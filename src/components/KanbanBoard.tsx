'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { COLUMNS, Task, ColumnId, Priority } from '@/types';
import { useTasks } from '@/hooks/useTasks';
import { Column } from './Column';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';

export function KanbanBoard() {
  const { tasks, isLoaded, addTask, updateTask, deleteTask, moveTask, getTasksByColumn } = useTasks();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultColumnId, setDefaultColumnId] = useState<ColumnId>('backlog');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    const isColumn = COLUMNS.some(col => col.id === overId);
    if (isColumn) {
      moveTask(taskId, overId as ColumnId);
      return;
    }

    // Check if dropped on another task
    const overTask = tasks.find(t => t.id === overId);
    if (overTask && overTask.columnId) {
      moveTask(taskId, overTask.columnId);
    }
  };

  const handleAddTask = (columnId: string) => {
    setEditingTask(null);
    setDefaultColumnId(columnId as ColumnId);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setDefaultColumnId(task.columnId);
    setIsModalOpen(true);
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('Delete this task?')) {
      deleteTask(id);
    }
  };

  const handleSaveTask = (title: string, description: string, priority: Priority, columnId?: ColumnId) => {
    if (editingTask) {
      updateTask(editingTask.id, { title, description, priority });
    } else {
      addTask(title, description, priority, columnId || 'backlog');
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Kanban Board</h1>
        <p className="text-zinc-500 text-sm mt-1">Drag and drop to organize your tasks</p>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 md:justify-center">
          {COLUMNS.map(column => (
            <Column
              key={column.id}
              column={column}
              tasks={getTasksByColumn(column.id)}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onAddTask={handleAddTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="rotate-3 opacity-90">
              <TaskCard
                task={activeTask}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        task={editingTask}
        defaultColumnId={defaultColumnId}
      />
    </div>
  );
}
