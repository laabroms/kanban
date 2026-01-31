'use client';

import { useState, useRef } from 'react';
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

const LONG_PRESS_DURATION = 200; // milliseconds

export function TaskCard({ task, onView, onEdit, onDelete, epics = [] }: TaskCardProps) {
  const epic = task.epicId ? epics.find(e => e.id === task.epicId) : null;
  const [isDragEnabled, setIsDragEnabled] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  
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

  const handlePointerDown = (e: React.PointerEvent) => {
    // Start long-press timer
    longPressTimerRef.current = setTimeout(() => {
      setIsDragEnabled(true);
      // Trigger drag listeners
      if (listeners?.onPointerDown) {
        listeners.onPointerDown(e as any);
      }
    }, LONG_PRESS_DURATION);
  };

  const handlePointerUp = () => {
    // Clear timer if pointer released before long-press completes
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsDragEnabled(false);
  };

  const handlePointerCancel = () => {
    // Clear timer on cancel (e.g., pointer leaves)
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsDragEnabled(false);
  };

  const handleClick = () => {
    // Only open view if we didn't just finish a drag
    if (!isDragging) {
      onView(task);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-zinc-800 rounded-lg p-3 border border-zinc-700
        hover:border-zinc-600 transition-colors
        ${isDragEnabled ? 'cursor-grabbing' : 'cursor-pointer'}
        ${isDragging ? 'opacity-50 shadow-xl' : ''}
      `}
      {...attributes}
      {...(isDragEnabled ? listeners : {})}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClick={handleClick}
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
    </div>
  );
}
