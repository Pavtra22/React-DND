import { useState, useRef, useEffect, useCallback } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Eye, EyeOff, Save, Home, Loader2 } from 'lucide-react';

import { Sidebar } from '../components/builder/Sidebar';
import { Canvas } from '../components/builder/Canvas';
import { PropertiesPanel } from '../components/builder/PropertiesPanel';
import { PreviewPanel } from '../components/builder/PreviewPanel';
import { Resizer } from '../components/builder/Resizer';
import { TOOLS } from '../components/builder/tools';
import { useBuilderStore } from '../store/useBuilderStore';
import type { ElementType } from '../types';
import { generateFormHTML } from '../utils/formHtmlGenerator';

export function Builder() {
  const { addElement, reorderElements, elements } = useBuilderStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  
  // Layout State
  const [showPreview, setShowPreview] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  // Panel Widths
  const [widths, setWidths] = useState({ 
    sidebar: 250, 
    props: 300, 
    preview: 400 
  });
  
  const resizingRef = useRef<string | null>(null);
  const navigate = useNavigate();

  // --- Resizing Logic ---
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingRef.current) return;

    const panel = resizingRef.current;
    const screenWidth = window.innerWidth;
    const minCanvasWidth = 300; // Hard constraint: Canvas never goes below this

    if (panel === 'sidebar') {
      const newWidth = e.clientX;
      // Calculate if this new width leaves enough room for canvas + props + preview
      const rightSideWidth = widths.props + (showPreview ? widths.preview : 0);
      const remainingForCanvas = screenWidth - newWidth - rightSideWidth;

      if (newWidth > 180 && newWidth < 500 && remainingForCanvas > minCanvasWidth) {
        setWidths(prev => ({ ...prev, sidebar: newWidth }));
      }
    } 
    else if (panel === 'props') {
      // Resizing Properties Panel (Handle is on its LEFT)
      // Logic: Props Width = (Screen Right Edge) - (Mouse X) - (Preview Width)
      const previewWidth = showPreview ? widths.preview : 0;
      const newWidth = screenWidth - e.clientX - previewWidth;
      
      // Calculate if this leaves enough room for Canvas (Mouse X - Sidebar Width)
      const canvasWidth = e.clientX - widths.sidebar;

      if (newWidth > 200 && newWidth < 600 && canvasWidth > minCanvasWidth) {
        setWidths(prev => ({ ...prev, props: newWidth }));
      }
    }
    else if (panel === 'preview') {
      // Resizing Preview Panel (Handle is on its LEFT)
      // Logic: Preview Width = (Screen Width) - (Mouse X)
      const newWidth = screenWidth - e.clientX;
      
      // Calculate if this leaves enough room for Canvas
      // Canvas = MouseX - Sidebar - Props
      const canvasWidth = e.clientX - widths.sidebar - widths.props;

      if (newWidth > 300 && newWidth < 900 && canvasWidth > minCanvasWidth) {
        setWidths(prev => ({ ...prev, preview: newWidth }));
      }
    }
  }, [showPreview, widths.sidebar, widths.props, widths.preview]); 

  const handleMouseUp = useCallback(() => {
    resizingRef.current = null;
    setIsResizing(false);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto'; // Re-enable text selection
  }, []);

  // Attach global listeners only when resizing
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const startResizing = (panel: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); 
    resizingRef.current = panel;
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none'; // Prevent highlighting text while dragging
  };

  // --- Data Logic ---
  const saveMutation = useMutation({
    mutationFn: async (newForm: { name: string; elements: string }) => {
      return axios.post('http://localhost:8080/api/forms', newForm);
    },
    onSuccess: () => {
      setIsModalOpen(false);
      navigate({ to: '/forms' });
    },
    onError: (error) => {
        console.error("Save failed", error);
        alert("Failed to save form. Is the backend running?");
    }
  });

  const handleSave = () => {
    if (!formName.trim()) return;
    const elementsJson = JSON.stringify(elements);
    saveMutation.mutate({ name: formName, elements: elementsJson });
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === 'CANVAS' && destination.droppableId === 'CANVAS') {
      reorderElements(source.index, destination.index);
    }
    if (source.droppableId === 'SIDEBAR' && destination.droppableId === 'CANVAS') {
      const tool = TOOLS[source.index];
      addElement(destination.index, {
        id: uuidv4(),
        type: tool.type as ElementType,
        label: tool.label,
        required: false,
        placeholder: '',
      });
    }
  };

  const previewSrc = generateFormHTML(formName || "Preview Form", elements);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex h-screen w-full flex-col bg-gray-50 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b px-6 py-3 bg-white shadow-sm z-30 shrink-0 h-16">
          <div className="flex items-center gap-4">
             <h1 className="text-xl font-bold text-gray-800">Form Builder</h1>
             <input 
                type="text" 
                placeholder="Form Name" 
                className="border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
                value={formName}
                onChange={e => setFormName(e.target.value)}
             />
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setShowPreview(!showPreview)} 
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors border ${showPreview ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
                {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                {showPreview ? "Hide Preview" : "Preview"}
            </button>
            
            <div className="h-full w-px bg-gray-300 mx-2"></div>

            <button onClick={() => navigate({ to: '/forms' })} className="flex items-center gap-2 text-gray-600 px-3 py-2 hover:bg-gray-100 rounded text-sm">
                <Home size={16} /> My Forms
            </button>
            <button 
                onClick={() => setIsModalOpen(true)}
                disabled={elements.length === 0 || saveMutation.isPending}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saveMutation.isPending ? "Saving..." : "Save Form"}
            </button>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className={`flex flex-1 overflow-hidden relative ${isResizing ? 'pointer-events-none cursor-col-resize' : ''}`}>
          
          {/* 1. Sidebar */}
          <div style={{ width: widths.sidebar }} className="flex flex-col border-r bg-white h-full overflow-hidden shrink-0">
             <Sidebar />
          </div>
          
          <Resizer onMouseDown={startResizing('sidebar')} />

          {/* 2. Canvas (Takes remaining space) */}
          <div className="flex-1 bg-gray-100 h-full overflow-hidden min-w-[300px] flex flex-col relative">
             <Canvas />
          </div>

          {/* 3. Properties Panel */}
          <Resizer onMouseDown={startResizing('props')} />
          <div style={{ width: widths.props }} className="flex flex-col border-l bg-white h-full overflow-hidden shrink-0 z-10">
            <PropertiesPanel />
          </div>

          {/* 4. Preview Panel (Conditional) */}
          {showPreview && (
            <>
                <Resizer onMouseDown={startResizing('preview')} />
                <PreviewPanel 
                    width={widths.preview} 
                    previewSrc={previewSrc} 
                    onClose={() => setShowPreview(false)} 
                />
            </>
          )}

        </main>

        {/* Modal for Final Save Confirmation */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                    <h2 className="text-lg font-bold mb-4">Confirm Save</h2>
                    <p className="mb-4 text-gray-600">Are you ready to save <strong>{formName || "Untitled Form"}</strong>?</p>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            Confirm Save
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </DragDropContext>
  );
}