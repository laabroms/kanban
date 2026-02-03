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
        bg-zinc-800 rounded-lg p-3 sm:p-3 border border-zinc-700
        hover:border-zinc-600 active:border-zinc-500 transition-colors
        touch-manipulation select-none
        ${isDragEnabled ? 'cursor-grabbing scale-105' : 'cursor-pointer'}
        ${isDragging ? 'opacity-50 shadow-xl scale-105' : ''}
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
      
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {epic && (
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
        )}
        {task.prUrl && (
          <a
            href={task.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/40 hover:bg-purple-500/30 transition-colors"
            title="View Pull Request"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
              <path d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"/>
            </svg>
            PR
          </a>
        )}
      </div>
      
      {task.description && (
        <p className="text-xs text-zinc-400 mt-2 line-clamp-2">
          {task.description}
        </p>
      )}
    </div>
  );
}
