import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';

export interface TemplateMetadata {
  id: string;
  name: string;
  description?: string;
  version: number;
  canvasType: 'konva' | 'fabric';
  orientation: 'portrait' | 'landscape';
  width: number;
  height: number;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  parentTemplateId?: string;
}

export interface ExportOptions {
  format: 'json' | 'pdf' | 'eps' | 'png';
  dpi?: number;
  includeMetadata?: boolean;
  includeVersionHistory?: boolean;
  compress?: boolean;
  quality?: number;
  includeBleed?: boolean;
  bleedSize?: number;
  includeCropMarks?: boolean;
  colorSpace?: 'RGB' | 'CMYK';
}

export interface TemplateData {
  metadata: TemplateMetadata;
  elements: any[];
  background?: {
    color?: string;
    image?: string;
  };
  canvas: {
    width: number;
    height: number;
  };
}

// Export to unified JSON format
export const exportToJSON = (
  templateData: TemplateData,
  options: ExportOptions = {}
): string => {
  const exportData = {
    metadata: {
      ...templateData.metadata,
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0',
    },
    canvas: templateData.canvas,
    background: templateData.background,
    elements: templateData.elements,
    exportOptions: options,
  };

  if (options.compress) {
    // Simple compression by removing unnecessary whitespace
    return JSON.stringify(exportData, null, 0);
  }

  return JSON.stringify(exportData, null, 2);
};

// Export to PDF
export const exportToPDF = async (
  templateData: TemplateData,
  options: ExportOptions = {}
): Promise<void> => {
  const dpi = options.dpi || 300;
  const quality = options.quality || 1.0;
  const includeBleed = options.includeBleed || false;
  const bleedSize = options.bleedSize || 3; // mm
  const includeCropMarks = options.includeCropMarks || false;

  // Calculate dimensions in mm
  const mmPerInch = 25.4;
  const widthMM = (templateData.canvas.width / dpi) * mmPerInch;
  const heightMM = (templateData.canvas.height / dpi) * mmPerInch;

  // Add bleed if requested
  const finalWidth = includeBleed ? widthMM + (bleedSize * 2) : widthMM;
  const finalHeight = includeBleed ? heightMM + (bleedSize * 2) : heightMM;

  const pdf = new jsPDF({
    orientation: templateData.metadata.orientation,
    unit: 'mm',
    format: [finalWidth, finalHeight],
  });

  // Set up canvas for rendering
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  canvas.width = templateData.canvas.width;
  canvas.height = templateData.canvas.height;

  // Render background
  if (templateData.background) {
    if (templateData.background.color) {
      ctx.fillStyle = templateData.background.color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (templateData.background.image) {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve();
        };
        img.onerror = reject;
        img.src = templateData.background.image!;
      });
    }
  }

  // Render elements
  for (const element of templateData.elements) {
    await renderElementToCanvas(ctx, element, canvas.width, canvas.height);
  }

  // Convert canvas to image data
  const imageData = canvas.toDataURL('image/png', quality);

  // Add image to PDF
  pdf.addImage(
    imageData,
    'PNG',
    includeBleed ? bleedSize : 0,
    includeBleed ? bleedSize : 0,
    widthMM,
    heightMM
  );

  // Add crop marks if requested
  if (includeCropMarks) {
    addCropMarks(pdf, finalWidth, finalHeight, bleedSize);
  }

  // Save PDF
  const fileName = `${templateData.metadata.name.replace(/\s+/g, '_')}_Template.pdf`;
  pdf.save(fileName);
};

// Export to PNG
export const exportToPNG = async (
  templateData: TemplateData,
  options: ExportOptions = {}
): Promise<void> => {
  const dpi = options.dpi || 300;
  const quality = options.quality || 1.0;
  const includeBleed = options.includeBleed || false;
  const bleedSize = options.bleedSize || 3; // pixels

  // Calculate final dimensions
  const finalWidth = includeBleed 
    ? templateData.canvas.width + (bleedSize * 2) 
    : templateData.canvas.width;
  const finalHeight = includeBleed 
    ? templateData.canvas.height + (bleedSize * 2) 
    : templateData.canvas.height;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  canvas.width = finalWidth;
  canvas.height = finalHeight;

  // Render background
  if (templateData.background) {
    if (templateData.background.color) {
      ctx.fillStyle = templateData.background.color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (templateData.background.image) {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const x = includeBleed ? bleedSize : 0;
          const y = includeBleed ? bleedSize : 0;
          ctx.drawImage(img, x, y, templateData.canvas.width, templateData.canvas.height);
          resolve();
        };
        img.onerror = reject;
        img.src = templateData.background.image!;
      });
    }
  }

  // Render elements
  for (const element of templateData.elements) {
    const elementX = (element.x || 0) + (includeBleed ? bleedSize : 0);
    const elementY = (element.y || 0) + (includeBleed ? bleedSize : 0);
    await renderElementToCanvas(ctx, element, templateData.canvas.width, templateData.canvas.height, elementX, elementY);
  }

  // Convert to blob and download
  canvas.toBlob((blob) => {
    if (blob) {
      const fileName = `${templateData.metadata.name.replace(/\s+/g, '_')}_Template.png`;
      saveAs(blob, fileName);
    }
  }, 'image/png', quality);
};

// Export to EPS (simplified implementation)
export const exportToEPS = async (
  templateData: TemplateData,
  options: ExportOptions = {}
): Promise<void> => {
  // For now, we'll create a simple EPS file
  // In a production environment, you'd want to use a proper EPS library
  
  const epsContent = generateEPSContent(templateData);
  const blob = new Blob([epsContent], { type: 'application/postscript' });
  const fileName = `${templateData.metadata.name.replace(/\s+/g, '_')}_Template.eps`;
  saveAs(blob, fileName);
};

// Helper function to render element to canvas
const renderElementToCanvas = async (
  ctx: CanvasRenderingContext2D,
  element: any,
  canvasWidth: number,
  canvasHeight: number,
  offsetX = 0,
  offsetY = 0
): Promise<void> => {
  ctx.save();

  const x = (element.x || element.left || 0) + offsetX;
  const y = (element.y || element.top || 0) + offsetY;
  const width = element.width || 100;
  const height = element.height || 100;
  const rotation = element.rotation || element.angle || 0;
  const opacity = element.opacity || 1;

  ctx.globalAlpha = opacity;

  if (rotation !== 0) {
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-width / 2, -height / 2);
  }

  switch (element.type) {
    case 'text':
      ctx.font = `${element.fontStyle || 'normal'} ${element.fontWeight || 'normal'} ${element.fontSize || 16}px ${element.fontFamily || 'Arial'}`;
      ctx.fillStyle = element.fill || '#000000';
      ctx.textAlign = (element.textAlign as CanvasTextAlign) || 'left';
      ctx.fillText(element.text || '', 0, height / 2);
      break;

    case 'image':
      if (element.src) {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            ctx.drawImage(img, 0, 0, width, height);
            resolve();
          };
          img.onerror = reject;
          img.src = element.src;
        });
      }
      break;

    case 'rect':
    case 'rectangle':
      ctx.fillStyle = element.fill || '#000000';
      if (element.cornerRadius || element.rx) {
        const radius = element.cornerRadius || element.rx || 0;
        drawRoundedRect(ctx, 0, 0, width, height, radius);
        ctx.fill();
      } else {
        ctx.fillRect(0, 0, width, height);
      }
      break;

    case 'circle':
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, 2 * Math.PI);
      ctx.fillStyle = element.fill || '#000000';
      ctx.fill();
      break;

    default:
      // Generic shape rendering
      ctx.fillStyle = element.fill || '#000000';
      ctx.fillRect(0, 0, width, height);
      break;
  }

  ctx.restore();
};

// Helper function to draw rounded rectangle
const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

// Helper function to add crop marks to PDF
const addCropMarks = (pdf: jsPDF, width: number, height: number, bleedSize: number): void => {
  const markLength = 5; // mm
  const markThickness = 0.1; // mm

  pdf.setLineWidth(markThickness);
  pdf.setDrawColor(0, 0, 0);

  // Corner marks
  const positions = [
    { x: bleedSize, y: bleedSize }, // Top-left
    { x: width - bleedSize, y: bleedSize }, // Top-right
    { x: bleedSize, y: height - bleedSize }, // Bottom-left
    { x: width - bleedSize, y: height - bleedSize }, // Bottom-right
  ];

  positions.forEach((pos, index) => {
    const isRight = index % 2 === 1;
    const isBottom = index >= 2;

    // Horizontal mark
    pdf.line(
      pos.x - (isRight ? markLength : 0),
      pos.y,
      pos.x + (isRight ? 0 : markLength),
      pos.y
    );

    // Vertical mark
    pdf.line(
      pos.x,
      pos.y - (isBottom ? 0 : markLength),
      pos.x,
      pos.y + (isBottom ? markLength : 0)
    );
  });
};

// Helper function to generate EPS content
const generateEPSContent = (templateData: TemplateData): string => {
  const width = templateData.canvas.width;
  const height = templateData.canvas.height;

  let eps = `%!PS-Adobe-3.0 EPSF-3.0
%%Creator: UniCard Template Builder
%%Title: ${templateData.metadata.name}
%%BoundingBox: 0 0 ${width} ${height}
%%EndComments

%%BeginProlog
%%EndProlog

%%Page: 1 1
gsave
`;

  // Add background
  if (templateData.background?.color) {
    eps += `0 0 ${width} ${height} rectfill\n`;
  }

  // Add elements (simplified)
  for (const element of templateData.elements) {
    if (element.type === 'text') {
      eps += `/${element.fontFamily || 'Arial'} findfont ${element.fontSize || 16} scalefont setfont\n`;
      eps += `${element.x || 0} ${height - (element.y || 0)} moveto\n`;
      eps += `(${element.text || ''}) show\n`;
    }
  }

  eps += `grestore
%%Trailer
%%EOF`;

  return eps;
};

// Main export function
export const exportTemplate = async (
  templateData: TemplateData,
  options: ExportOptions
): Promise<void> => {
  switch (options.format) {
    case 'json':
      const jsonData = exportToJSON(templateData, options);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const fileName = `${templateData.metadata.name.replace(/\s+/g, '_')}_Template.json`;
      saveAs(blob, fileName);
      break;

    case 'pdf':
      await exportToPDF(templateData, options);
      break;

    case 'png':
      await exportToPNG(templateData, options);
      break;

    case 'eps':
      await exportToEPS(templateData, options);
      break;

    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
};
