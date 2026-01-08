import { Droppable, Draggable } from '@hello-pangea/dnd';
import { TOOLS } from './tools';
export function Sidebar() {
  return (
    <div className="bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="font-bold text-gray-700">Components</h2>
        <p className="text-xs text-gray-500">Drag to canvas</p>
      </div>

      <Droppable droppableId="SIDEBAR" isDropDisabled={true}>
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="flex-1 overflow-y-auto p-3 space-y-3"
          >
            {TOOLS.map((tool, index) => (
              <Draggable key={tool.id} draggableId={tool.id} index={index}>
                {(provided, snapshot) => (
                  <>
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{ ...provided.draggableProps.style }}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border cursor-grab transition-all
                        ${snapshot.isDragging ? 'bg-blue-50 border-blue-500 shadow-lg' : 'bg-white border-gray-200 hover:border-blue-400'}
                      `}
                    >
                      <tool.icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">{tool.label}</span>
                    </div>
                    
                    {/* Clone to keep list looking full while dragging */}
                    {snapshot.isDragging && (
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 opacity-50">
                         <tool.icon className="w-4 h-4 text-gray-400" />
                         <span className="text-sm font-medium text-gray-400">{tool.label}</span>
                      </div>
                    )}
                  </>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}