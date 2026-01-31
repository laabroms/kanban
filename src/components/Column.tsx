'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column as ColumnType, Task, Epic } from '@/types';
import { TaskCard } from './TaskCard';

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  epics?: Epic[];
  onViewTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (columnId: string) => void;
}

const columnColors: Record<string, string> = {
  'backlog': 'border-t-zinc-500',
  'in-progress': 'border-t-blue-500',
  'review': 'border-t-yellow-500',
  'done': 'border-t-green-500',
};

export function Column({ column, tasks, epics = [], onViewTask, onEditTask, onDeleteTask, onAddTask }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      className={`
        flex flex-col bg-zinc-900 rounded-lg border border-zinc-800
        border-t-2 ${columnColors[column.id]}
        min-h-[500px] w-72 shrink-0
      `}
    >
      <div className="p-3 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-zinc-200">{column.title}</h2>
          <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
            {tasks.length}
          </span>
        </div>
      </div>
      
      <div
        ref={setNodeRef}
        className={`
          flex-1 p-2 space-y-2 overflow-y-auto
          ${isOver ? 'bg-zinc-800/50' : ''}
          transition-colors
        `}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              epics={epics}
              onView={onViewTask}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className="text-xs text-zinc-600 text-center py-8">
            Drop tasks here
          </div>
        )}
      </div>
      
      <div className="p-2 border-t border-zinc-800">
        <button
          onClick={() => onAddTask(column.id)}
          className="w-full text-sm text-zinc-500 hover:text-zinc-300 
                     hover:bg-zinc-800 rounded p-2 transition-colors
                     flex items-center justify-center gap-1"
        >
          <span>+</span> Add Task
        </button>
      </div>
    </div>
  );
}
