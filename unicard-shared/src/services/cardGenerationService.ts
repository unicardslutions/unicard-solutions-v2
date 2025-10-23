import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, Image as SvgImage, Circle } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { replaceFieldsInText } from '../utils/dynamicFields';

const { width: screenWidth } = Dimensions.get('window');

export interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'rectangle' | 'circle' | 'qr_code' | 'dynamic_field';
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  color?: string;
  backgroundColor?: string;
  text?: string;
  imageUrl?: string;
  borderRadius?: number;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  zIndex?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  dynamicField?: string;
  qrData?: string;
}

export interface Template {
  id: string;
  name: string;
  width: number;
  height: number;
  elements: TemplateElement[];
  background?: {
    type: 'color' | 'image';
    value: string;
  };
  canvas_type: 'konva' | 'fabric';
  version: number;
}

export interface StudentData {
  id: string;
  name: string;
  roll_number: string;
  class: string;
  section: string;
  photo_url?: string;
  school_name: string;
  school_logo?: string;
  [key: string]: any;
}

export interface CardGenerationOptions {
  format: 'png' | 'pdf';
  quality: number;
  dpi: number;
  includeBleed: boolean;
}

class CardGenerationService {
  private canvasWidth = 300; // Default card width in points
  private canvasHeight = 200; // Default card height in points

  async generateCard(
    template: Template,
    studentData: StudentData,
    options: CardGenerationOptions = {
      format: 'png',
      quality: 0.9,
      dpi: 300,
      includeBleed: false,
    }
  ): Promise<string> {
    try {
      // Scale canvas based on DPI
      const scale = options.dpi / 72; // 72 is default DPI
      const scaledWidth = this.canvasWidth * scale;
      const scaledHeight = this.canvasHeight * scale;

      // Generate SVG content
      const svgContent = this.generateSVG(template, studentData, scaledWidth, scaledHeight);

      if (options.format === 'png') {
        return await this.generatePNG(svgContent, scaledWidth, scaledHeight, options.quality);
      } else {
        return await this.generatePDF(svgContent, scaledWidth, scaledHeight);
      }
    } catch (error) {
      console.error('Error generating card:', error);
      throw error;
    }
  }

  private generateSVG(template: Template, studentData: StudentData, width: number, height: number): string {
    const elements = template.elements
      .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
      .map(element => this.renderElement(element, studentData, width, height))
      .join('');

    const background = this.renderBackground(template.background, width, height);

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        ${background}
        ${elements}
      </svg>
    `;
  }

  private renderBackground(background: any, width: number, height: number): string {
    if (!background) {
      return `<rect width="${width}" height="${height}" fill="white"/>`;
    }

    if (background.type === 'color') {
      return `<rect width="${width}" height="${height}" fill="${background.value}"/>`;
    } else if (background.type === 'image') {
      return `
        <defs>
          <pattern id="background" patternUnits="userSpaceOnUse" width="${width}" height="${height}">
            <image href="${background.value}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>
          </pattern>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#background)"/>
      `;
    }

    return `<rect width="${width}" height="${height}" fill="white"/>`;
  }

  private renderElement(element: TemplateElement, studentData: StudentData, canvasWidth: number, canvasHeight: number): string {
    const x = element.x;
    const y = element.y;
    const width = element.width || 100;
    const height = element.height || 50;
    const opacity = element.opacity || 1;

    switch (element.type) {
      case 'text':
        return this.renderText(element, studentData, x, y, width, height, opacity);
      
      case 'image':
        return this.renderImage(element, studentData, x, y, width, height, opacity);
      
      case 'rectangle':
        return this.renderRectangle(element, x, y, width, height, opacity);
      
      case 'circle':
        return this.renderCircle(element, x, y, width, height, opacity);
      
      case 'qr_code':
        return this.renderQRCode(element, studentData, x, y, width, height, opacity);
      
      case 'dynamic_field':
        return this.renderDynamicField(element, studentData, x, y, width, height, opacity);
      
      default:
        return '';
    }
  }

  private renderText(element: TemplateElement, studentData: StudentData, x: number, y: number, width: number, height: number, opacity: number): string {
    const text = element.text || '';
    const fontSize = element.fontSize || 14;
    const fontFamily = element.fontFamily || 'Arial';
    const fontWeight = element.fontWeight || 'normal';
    const fontStyle = element.fontStyle || 'normal';
    const color = element.color || '#000000';
    const stroke = element.stroke;
    const strokeWidth = element.strokeWidth || 0;

    const textProps = [
      `x="${x}"`,
      `y="${y + fontSize}"`, // SVG text baseline adjustment
      `font-size="${fontSize}"`,
      `font-family="${fontFamily}"`,
      `font-weight="${fontWeight}"`,
      `font-style="${fontStyle}"`,
      `fill="${color}"`,
      `opacity="${opacity}"`,
    ];

    if (stroke && strokeWidth > 0) {
      textProps.push(`stroke="${stroke}"`, `stroke-width="${strokeWidth}"`);
    }

    return `<text ${textProps.join(' ')}>${text}</text>`;
  }

  private renderImage(element: TemplateElement, studentData: StudentData, x: number, y: number, width: number, height: number, opacity: number): string {
    const imageUrl = element.imageUrl || studentData.photo_url || '';
    
    if (!imageUrl) {
      return '';
    }

    return `
      <image 
        href="${imageUrl}" 
        x="${x}" 
        y="${y}" 
        width="${width}" 
        height="${height}" 
        opacity="${opacity}"
        preserveAspectRatio="xMidYMid slice"
      />
    `;
  }

  private renderRectangle(element: TemplateElement, x: number, y: number, width: number, height: number, opacity: number): string {
    const fill = element.backgroundColor || 'transparent';
    const stroke = element.stroke || 'none';
    const strokeWidth = element.strokeWidth || 0;
    const borderRadius = element.borderRadius || 0;

    return `
      <rect 
        x="${x}" 
        y="${y}" 
        width="${width}" 
        height="${height}" 
        fill="${fill}" 
        stroke="${stroke}" 
        stroke-width="${strokeWidth}" 
        rx="${borderRadius}" 
        ry="${borderRadius}"
        opacity="${opacity}"
      />
    `;
  }

  private renderCircle(element: TemplateElement, x: number, y: number, width: number, height: number, opacity: number): string {
    const radius = Math.min(width, height) / 2;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const fill = element.backgroundColor || 'transparent';
    const stroke = element.stroke || 'none';
    const strokeWidth = element.strokeWidth || 0;

    return `
      <circle 
        cx="${centerX}" 
        cy="${centerY}" 
        r="${radius}" 
        fill="${fill}" 
        stroke="${stroke}" 
        stroke-width="${strokeWidth}"
        opacity="${opacity}"
      />
    `;
  }

  private renderQRCode(element: TemplateElement, studentData: StudentData, x: number, y: number, width: number, height: number, opacity: number): string {
    const qrData = element.qrData || studentData.id || '';
    
    if (!qrData) {
      return '';
    }

    // For mobile, we'll generate a simple QR code representation
    // In a real implementation, you'd use a QR code library
    return `
      <rect 
        x="${x}" 
        y="${y}" 
        width="${width}" 
        height="${height}" 
        fill="white" 
        stroke="black" 
        stroke-width="1"
        opacity="${opacity}"
      />
      <text 
        x="${x + width/2}" 
        y="${y + height/2}" 
        text-anchor="middle" 
        font-size="10" 
        fill="black"
        opacity="${opacity}"
      >
        QR: ${qrData.substring(0, 8)}...
      </text>
    `;
  }

  private renderDynamicField(element: TemplateElement, studentData: StudentData, x: number, y: number, width: number, height: number, opacity: number): string {
    const fieldName = element.dynamicField || '';
    const text = replaceFieldsInText(fieldName, studentData);
    const fontSize = element.fontSize || 14;
    const fontFamily = element.fontFamily || 'Arial';
    const fontWeight = element.fontWeight || 'normal';
    const fontStyle = element.fontStyle || 'normal';
    const color = element.color || '#000000';

    return `
      <text 
        x="${x}" 
        y="${y + fontSize}" 
        font-size="${fontSize}" 
        font-family="${fontFamily}" 
        font-weight="${fontWeight}" 
        font-style="${fontStyle}" 
        fill="${color}"
        opacity="${opacity}"
      >
        ${text}
      </text>
    `;
  }

  private async generatePNG(svgContent: string, width: number, height: number, quality: number): Promise<string> {
    try {
      // In a real implementation, you would convert SVG to PNG
      // For now, we'll create a placeholder file
      const fileName = `card_${Date.now()}.png`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // This is a placeholder - in reality you'd use a library like react-native-svg
      // or a native module to convert SVG to PNG
      await FileSystem.writeAsStringAsync(fileUri, svgContent);
      
      return fileUri;
    } catch (error) {
      console.error('Error generating PNG:', error);
      throw error;
    }
  }

  private async generatePDF(svgContent: string, width: number, height: number): Promise<string> {
    try {
      // In a real implementation, you would convert SVG to PDF
      // For now, we'll create a placeholder file
      const fileName = `card_${Date.now()}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // This is a placeholder - in reality you'd use a PDF generation library
      await FileSystem.writeAsStringAsync(fileUri, svgContent);
      
      return fileUri;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  async shareCard(fileUri: string, title: string = 'Student Card'): Promise<void> {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: fileUri.endsWith('.pdf') ? 'application/pdf' : 'image/png',
          dialogTitle: title,
        });
      } else {
        console.warn('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing card:', error);
      throw error;
    }
  }

  async saveToGallery(fileUri: string): Promise<void> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        throw new Error('Media library permission not granted');
      }

      const asset = await MediaLibrary.createAssetAsync(fileUri);
      await MediaLibrary.createAlbumAsync('UniCard', asset, false);
    } catch (error) {
      console.error('Error saving to gallery:', error);
      throw error;
    }
  }

  async generateBatchCards(
    template: Template,
    studentsData: StudentData[],
    options: CardGenerationOptions
  ): Promise<string[]> {
    const results: string[] = [];
    
    for (const studentData of studentsData) {
      try {
        const cardUri = await this.generateCard(template, studentData, options);
        results.push(cardUri);
      } catch (error) {
        console.error(`Error generating card for student ${studentData.id}:`, error);
        // Continue with other students
      }
    }
    
    return results;
  }

  async createZipFile(fileUris: string[], zipName: string = 'cards.zip'): Promise<string> {
    try {
      // In a real implementation, you would use a ZIP library
      // For now, we'll return the first file as a placeholder
      const zipUri = `${FileSystem.documentDirectory}${zipName}`;
      
      // This is a placeholder - in reality you'd use a ZIP library
      await FileSystem.writeAsStringAsync(zipUri, 'ZIP placeholder');
      
      return zipUri;
    } catch (error) {
      console.error('Error creating ZIP file:', error);
      throw error;
    }
  }
}

export const cardGenerationService = new CardGenerationService();
