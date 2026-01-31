'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, Priority, Epic } from '@/types';

interface TaskCardProps {
  task: Task;
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  epics?: Epic[];
}

const priorityColors: Record<Priority, string> = {
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const priorityLabels: Record<Priority, string> = {
  low: 'Low',
  medium: 'Med',
  high: 'High',
};

export function TaskCard({ task, onView, onEdit, onDelete, epics = [] }: TaskCardProps) {
  const epic = task.epicId ? epics.find(e => e.id === task.epicId) : null;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-zinc-800 rounded-lg p-3 border border-zinc-700
        hover:border-zinc-600 transition-colors cursor-grab
        ${isDragging ? 'opacity-50 shadow-xl' : ''}
      `}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-zinc-100 flex-1">
          {task.title}
        </h3>
        <span className={`
          text-xs px-2 py-0.5 rounded border shrink-0
          ${priorityColors[task.priority]}
        `}>
          {priorityLabels[task.priority]}
        </span>
      </div>
      
      {epic && (
        <div className="mt-2">
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ 
              backgroundColor: `${epic.color}20`,
              color: epic.color,
              border: `1px solid ${epic.color}40`
            }}
          >
            {epic.name}
          </span>
        </div>
      )}
      
      {task.description && (
        <p className="text-xs text-zinc-400 mt-2 line-clamp-2">
          {task.description}
        </p>
      )}
      
      <div className="flex gap-2 mt-3 pt-2 border-t border-zinc-700/50">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(task);
          }}
          className="text-xs text-zinc-500 hover:text-blue-400 transition-colors"
        >
          View
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
