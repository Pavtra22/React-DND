import { useState, useRef, useEffect } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Eye, EyeOff, Save, Home } from 'lucide-react'; // Import icons

import { Sidebar } from '../components/builder/Sidebar';
import { Canvas } from '../components/builder/Canvas';
import { PropertiesPanel } from '../components/builder/PropertiesPanel';
import { TOOLS } from '../components/builder/tools';
import { useBuilderStore } from '../store/useBuilderStore';
import type { ElementType } from '../types';
import { generateFormHTML } from '../utils/formHtmlGenerator';

// --- Resizer Component ---
const Resizer = ({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) => (
  <div
    className="w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors z-20 flex-shrink-0"
    onMouseDown={onMouseDown}
  />
);

export function Builder() {
  const { addElement, reorderElements, elements } = useBuilderStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  
  // --- Layout State ---
  const [showPreview, setShowPreview] = useState(false);
  // Initial widths (Sidebar: 250px, Props: 300px, Preview: 400px, Canvas: Flex)
  const [widths, setWidths] = useState({ sidebar: 250, props: 300, preview: 400 });
  
  const sidebarRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const resizingRef = useRef<string | null>(null);

  const navigate = useNavigate();

  // --- Resizing Logic ---
  const startResizing = (panel: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = panel;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizingRef.current) return;

    if (resizingRef.current === 'sidebar') {
      const newWidth = e.clientX;
      if (newWidth > 150 && newWidth < 500) setWidths(p => ({ ...p, sidebar: newWidth }));
    } 
    else if (resizingRef.current === 'props') {
      // Calculate from right side (ish) - simplified to just adjust based on movement
      // Since props panel is in the middle-ish, let's look at its reference
      if (propsRef.current) {
         // This logic depends on where the resizer is.
         // Let's assume standard behavior: Resizer is to the LEFT of the panel usually,
         // but here we have Sidebar | Canvas | Props | Preview
         // So Props resizer is between Canvas and Props.
         const newWidth = document.body.clientWidth - e.clientX - (showPreview ? widths.preview : 0);
         if (newWidth > 200 && newWidth < 600) setWidths(p => ({ ...p, props: newWidth }));
      }
    }
    else if (resizingRef.current === 'preview') {
      const newWidth = document.body.clientWidth - e.clientX;
      if (newWidth > 300 && newWidth < 800) setWidths(p => ({ ...p, preview: newWidth }));
    }
  };

  const handleMouseUp = () => {
    resizingRef.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
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
                className="border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={16} />
              {saveMutation.isPending ? "Saving..." : "Save Form"}
            </button>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex flex-1 overflow-hidden relative">
          
          {/* 1. Sidebar */}
          <div ref={sidebarRef} style={{ width: widths.sidebar }} className="flex flex-col border-r bg-white h-full overflow-hidden shrink-0">
             <Sidebar />
          </div>
          
          <Resizer onMouseDown={startResizing('sidebar')} />

          {/* 2. Canvas (Takes remaining space) */}
          <div className="flex-1 bg-gray-100 h-full overflow-hidden min-w-[300px] flex flex-col">
             <Canvas />
          </div>

          <Resizer onMouseDown={startResizing('props')} />

          {/* 3. Properties Panel */}
          <div ref={propsRef} style={{ width: widths.props }} className="flex flex-col border-l bg-white h-full overflow-hidden shrink-0 z-10">
            <PropertiesPanel />
          </div>

          {/* 4. Preview Panel (Conditional) */}
          {showPreview && (
            <>
                <Resizer onMouseDown={startResizing('preview')} />
                <div ref={previewRef} style={{ width: widths.preview }} className="flex flex-col border-l bg-white h-full overflow-hidden shrink-0 shadow-xl z-20">
                    <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700 text-sm">Live Preview</h3>
                        <span className="text-xs text-gray-400">Vanilla HTML/JS</span>
                    </div>
                    <div className="flex-1 overflow-hidden bg-white">
                        <iframe 
                            srcDoc={previewSrc} 
                            title="Form Preview" 
                            className="w-full h-full border-0"
                            sandbox="allow-scripts"
                        />
                    </div>
                </div>
            </>
          )}

        </main>

        {/* Modal for Final Save Confirmation (Optional, kept from original) */}
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