import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Download, 
  Upload, 
  Undo, 
  Redo, 
  Settings, 
  Layers, 
  Palette,
  Move,
  Type,
  Square,
  Circle as CircleIcon,
  Image as ImageIcon,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Trash2,
  Copy,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Plus,
  Minus
} from 'lucide-react';
import { KonvaCanvas } from './templateBuilder/KonvaCanvas';
import { FabricCanvas } from './templateBuilder/FabricCanvas';
import { LayerPanel } from './templateBuilder/LayerPanel';
import { PropertiesPanel } from './templateBuilder/PropertiesPanel';
import { ImportPanel } from './templateBuilder/ImportPanel';
import { ExportPanel } from './templateBuilder/ExportPanel';
import { ToolsPanel } from './templateBuilder/ToolsPanel';
import { TemplateData, ExportOptions } from '@/utils/templateExporter';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TemplateElement {
  id: string;
  type: 'text' | 'rect' | 'circle' | 'image' | 'group' | 'background';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  name: string;
  // Text properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  // Shape properties
  fillColor?: string;
  strokeColor?: string;
  cornerRadius?: number;
  // Image properties
  src?: string;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  // Group properties
  children?: TemplateElement[];
  expanded?: boolean;
}

interface AdvancedTemplateBuilderProps {
  templateId?: string;
  onSave?: (templateData: TemplateData) => void;
  onClose?: () => void;
}

export const AdvancedTemplateBuilder: React.FC<AdvancedTemplateBuilderProps> = ({
  templateId,
  onSave,
  onClose,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('canvas');
  const [canvasType, setCanvasType] = useState<'konva' | 'fabric'>('konva');
  const [elements, setElements] = useState<TemplateElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 600 });
  const [background, setBackground] = useState<{ color?: string; image?: string }>({});
  const [templateName, setTemplateName] = useState('New Template');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Canvas controls
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(10);
  const [selectedTool, setSelectedTool] = useState('select');
  
  // History for undo/redo
  const [history, setHistory] = useState<TemplateElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Layer panel state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Load template if templateId is provided
  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    }
  }, [templateId]);

  // Save history state
  const saveHistory = useCallback((newElements: TemplateElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newElements]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Load template from database
  const loadTemplate = async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setTemplateName(data.name);
        setTemplateDescription(data.description || '');
        setCanvasSize({
          width: data.design_data?.canvas?.width || 400,
          height: data.design_data?.canvas?.height || 600,
        });
        setBackground(data.design_data?.background || {});
        setElements(data.design_data?.elements || []);
        setCanvasType(data.canvas_type || 'konva');
        saveHistory(data.design_data?.elements || []);
      }
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template');
    } finally {
      setIsLoading(false);
    }
  };

  // Save template to database
  const saveTemplate = async () => {
    if (!user) {
      toast.error('You must be logged in to save templates');
      return;
    }

    setIsSaving(true);
    try {
      const templateData = {
        name: templateName,
        description: templateDescription,
        design_data: {
          canvas: canvasSize,
          background,
          elements,
        },
        canvas_type: canvasType,
        orientation: canvasSize.width > canvasSize.height ? 'landscape' : 'portrait',
        is_public: false,
        created_by: user.id,
      };

      if (templateId) {
        // Update existing template
        const { error } = await supabase
          .from('templates')
          .update(templateData)
          .eq('id', templateId);

        if (error) throw error;
        toast.success('Template updated successfully');
      } else {
        // Create new template
        const { error } = await supabase
          .from('templates')
          .insert(templateData);

        if (error) throw error;
        toast.success('Template created successfully');
      }

      onSave?.(templateData);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle element selection
  const handleElementSelect = useCallback((elementId: string | null) => {
    setSelectedElementId(elementId);
  }, []);

  // Handle element update
  const handleElementUpdate = useCallback((elementId: string, updates: Partial<TemplateElement>) => {
    setElements(prev => {
      const newElements = prev.map(el => 
        el.id === elementId ? { ...el, ...updates } : el
      );
      saveHistory(newElements);
      return newElements;
    });
  }, [saveHistory]);

  // Handle element delete
  const handleElementDelete = useCallback((elementId: string) => {
    setElements(prev => {
      const newElements = prev.filter(el => el.id !== elementId);
      saveHistory(newElements);
      return newElements;
    });
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  }, [selectedElementId, saveHistory]);

  // Handle element add
  const handleElementAdd = useCallback((element: Omit<TemplateElement, 'id'>) => {
    const newElement: TemplateElement = {
      ...element,
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    setElements(prev => {
      const newElements = [...prev, newElement];
      saveHistory(newElements);
      return newElements;
    });
  }, [saveHistory]);

  // Handle element duplicate
  const handleElementDuplicate = useCallback((elementId: string) => {
    const element = elements.find(el => el.id === elementId);
    if (element) {
      const duplicatedElement: TemplateElement = {
        ...element,
        id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        x: element.x + 20,
        y: element.y + 20,
        name: `${element.name} Copy`,
      };
      setElements(prev => {
        const newElements = [...prev, duplicatedElement];
        saveHistory(newElements);
        return newElements;
      });
    }
  }, [elements, saveHistory]);

  // Handle element lock
  const handleElementLock = useCallback((elementId: string, locked: boolean) => {
    handleElementUpdate(elementId, { locked });
  }, [handleElementUpdate]);

  // Handle element visibility
  const handleElementVisibility = useCallback((elementId: string, visible: boolean) => {
    handleElementUpdate(elementId, { visible });
  }, [handleElementUpdate]);

  // Handle element reorder
  const handleElementReorder = useCallback((elementId: string, newZIndex: number) => {
    setElements(prev => {
      const newElements = prev.map(el => 
        el.id === elementId ? { ...el, zIndex: newZIndex } : el
      );
      saveHistory(newElements);
      return newElements;
    });
  }, [saveHistory]);

  // Handle element rename
  const handleElementRename = useCallback((elementId: string, newName: string) => {
    handleElementUpdate(elementId, { name: newName });
  }, [handleElementUpdate]);

  // Handle element group
  const handleElementGroup = useCallback((elementIds: string[]) => {
    // Implementation for grouping elements
    toast.info('Grouping functionality coming soon');
  }, []);

  // Handle element ungroup
  const handleElementUngroup = useCallback((elementId: string) => {
    // Implementation for ungrouping elements
    toast.info('Ungrouping functionality coming soon');
  }, []);

  // Handle import complete
  const handleImportComplete = useCallback((importedElements: any[], canvas: { width: number; height: number }, bg?: { color?: string; image?: string }) => {
    setElements(importedElements);
    setCanvasSize(canvas);
    if (bg) {
      setBackground(bg);
    }
    saveHistory(importedElements);
    toast.success('Template imported successfully');
  }, [saveHistory]);

  // Handle import error
  const handleImportError = useCallback((error: string) => {
    toast.error(error);
  }, []);

  // Handle undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setElements(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  // Handle redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setElements(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Get selected element
  const selectedElement = selectedElementId ? elements.find(el => el.id === selectedElementId) : null;

  // Convert elements to layer format
  const layerElements = elements.map(el => ({
    id: el.id,
    name: el.name,
    type: el.type,
    visible: el.visible,
    locked: el.locked,
    opacity: el.opacity,
    zIndex: el.zIndex,
    children: el.children,
    expanded: el.expanded,
  }));

  // Create template data for export
  const templateData: TemplateData = {
    metadata: {
      id: templateId || `template_${Date.now()}`,
      name: templateName,
      description: templateDescription,
      version: 1,
      canvasType,
      orientation: canvasSize.width > canvasSize.height ? 'landscape' : 'portrait',
      width: canvasSize.width,
      height: canvasSize.height,
      tags: [],
      createdBy: user?.id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    elements,
    background,
    canvas: canvasSize,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">Template Builder</h1>
              <div className="flex items-center gap-2">
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-64"
                  placeholder="Template name"
                />
                <Badge variant="outline">{elements.length} elements</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
              >
                <Redo className="w-4 h-4" />
              </Button>
              <Button
                onClick={saveTemplate}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Left sidebar - Tools and Layers */}
          <div className="col-span-3 space-y-4">
            <Tabs defaultValue="tools" className="h-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tools">Tools</TabsTrigger>
                <TabsTrigger value="layers">Layers</TabsTrigger>
                <TabsTrigger value="import">Import</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tools" className="h-full">
                <ToolsPanel
                  selectedTool={selectedTool}
                  onToolSelect={setSelectedTool}
                  canvasZoom={canvasZoom}
                  onZoomChange={setCanvasZoom}
                  showGrid={showGrid}
                  onGridToggle={setShowGrid}
                  snapToGrid={snapToGrid}
                  onSnapToGridToggle={setSnapToGrid}
                  gridSize={gridSize}
                  onGridSizeChange={setGridSize}
                  onAddElement={handleElementAdd}
                  onAlignElements={() => {}}
                  onDistributeElements={() => {}}
                  onGroupElements={() => {}}
                  onUngroupElements={() => {}}
                  onBringToFront={() => {}}
                  onSendToBack={() => {}}
                  onBringForward={() => {}}
                  onSendBackward={() => {}}
                />
              </TabsContent>
              
              <TabsContent value="layers" className="h-full">
                <LayerPanel
                  elements={layerElements}
                  selectedElementId={selectedElementId}
                  onElementSelect={handleElementSelect}
                  onElementUpdate={handleElementUpdate}
                  onElementDelete={handleElementDelete}
                  onElementDuplicate={handleElementDuplicate}
                  onElementLock={handleElementLock}
                  onElementVisibility={handleElementVisibility}
                  onElementReorder={handleElementReorder}
                  onElementRename={handleElementRename}
                  onElementGroup={handleElementGroup}
                  onElementUngroup={handleElementUngroup}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  filterType={filterType}
                  onFilterChange={setFilterType}
                />
              </TabsContent>
              
              <TabsContent value="import" className="h-full">
                <ImportPanel
                  onImportComplete={handleImportComplete}
                  onImportError={handleImportError}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Center - Canvas */}
          <div className="col-span-6">
            <Tabs defaultValue="konva" className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="konva">Konva.js</TabsTrigger>
                <TabsTrigger value="fabric">Fabric.js</TabsTrigger>
              </TabsList>
              
              <TabsContent value="konva" className="h-full">
                <KonvaCanvas
                  width={canvasSize.width}
                  height={canvasSize.height}
                  elements={elements}
                  selectedElementId={selectedElementId}
                  onElementSelect={handleElementSelect}
                  onElementUpdate={handleElementUpdate}
                  onElementDelete={handleElementDelete}
                  onElementAdd={handleElementAdd}
                  onElementDuplicate={handleElementDuplicate}
                  onElementLock={handleElementLock}
                  onElementVisibility={handleElementVisibility}
                  onElementReorder={handleElementReorder}
                  background={background}
                  gridSize={gridSize}
                  showGrid={showGrid}
                  snapToGrid={snapToGrid}
                />
              </TabsContent>
              
              <TabsContent value="fabric" className="h-full">
                <FabricCanvas
                  width={canvasSize.width}
                  height={canvasSize.height}
                  elements={elements}
                  selectedElementId={selectedElementId}
                  onElementSelect={handleElementSelect}
                  onElementUpdate={handleElementUpdate}
                  onElementDelete={handleElementDelete}
                  onElementAdd={handleElementAdd}
                  onElementDuplicate={handleElementDuplicate}
                  onElementLock={handleElementLock}
                  onElementVisibility={handleElementVisibility}
                  onElementReorder={handleElementReorder}
                  background={background}
                  gridSize={gridSize}
                  showGrid={showGrid}
                  snapToGrid={snapToGrid}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right sidebar - Properties and Export */}
          <div className="col-span-3 space-y-4">
            <Tabs defaultValue="properties" className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="properties">Properties</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
              </TabsList>
              
              <TabsContent value="properties" className="h-full">
                <PropertiesPanel
                  selectedElement={selectedElement}
                  onElementUpdate={handleElementUpdate}
                  onElementDelete={() => selectedElementId && handleElementDelete(selectedElementId)}
                  onElementDuplicate={() => selectedElementId && handleElementDuplicate(selectedElementId)}
                  onElementLock={(locked) => selectedElementId && handleElementLock(selectedElementId, locked)}
                  onElementVisibility={(visible) => selectedElementId && handleElementVisibility(selectedElementId, visible)}
                  onElementReorder={(newZIndex) => selectedElementId && handleElementReorder(selectedElementId, newZIndex)}
                />
              </TabsContent>
              
              <TabsContent value="export" className="h-full">
                <ExportPanel
                  templateData={templateData}
                  onExportStart={() => {}}
                  onExportComplete={() => {}}
                  onExportError={(error) => toast.error(error)}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};
