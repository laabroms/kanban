'use client';

import { useState, useCallback } from 'react';
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
import { COLUMNS, Task, ColumnId, Priority, Epic } from '@/types';
import { useTasks } from '@/hooks/useTasks';
import { useEpics } from '@/hooks/useEpics';
import { Column } from './Column';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { TaskDetailView } from './TaskDetailView';
import { EpicSelector } from './EpicSelector';
import { useToast } from './Toast';

export function KanbanBoard() {
  const { tasks, isLoaded, addTask, updateTask, deleteTask, moveTask } = useTasks();
  const { epics, isLoaded: epicsLoaded, addEpic, deleteEpic } = useEpics();
  const { showToast } = useToast();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultColumnId, setDefaultColumnId] = useState<ColumnId>('backlog');
  const [selectedEpicId, setSelectedEpicId] = useState<string | null>(null);
  const [hideCompletedTasks, setHideCompletedTasks] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Filter tasks by selected epic
  const getTasksByColumn = useCallback((columnId: ColumnId) => {
    return tasks.filter(task => {
      const matchesColumn = task.columnId === columnId;
      const matchesEpic = selectedEpicId === null || task.epicId === selectedEpicId;
      return matchesColumn && matchesEpic;
    });
  }, [tasks, selectedEpicId]);

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

  const handleViewTask = (task: Task) => {
    setViewingTask(task);
    setIsDetailOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setDefaultColumnId(task.columnId);
    setIsModalOpen(true);
  };

  const handleEditFromDetail = () => {
    if (viewingTask) {
      setIsDetailOpen(false);
      handleEditTask(viewingTask);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm('Delete this task?')) {
      try {
        await deleteTask(id);
        showToast('Task deleted', 'success');
      } catch {
        showToast('Failed to delete task', 'error');
      }
    }
  };

  const handleSaveTask = async (
    title: string,
    description: string,
    priority: Priority,
    columnId?: ColumnId,
    epicId?: string | null,
    prUrl?: string | null
  ) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, { title, description, priority, epicId, prUrl });
        showToast('Task updated', 'success');
      } else {
        const taskEpicId = epicId !== undefined ? epicId : selectedEpicId;
        await addTask(title, description, priority, columnId || 'backlog', taskEpicId);
        showToast('Task created', 'success');
      }
    } catch {
      showToast('Failed to save task', 'error');
    }
  };

  if (!isLoaded || !epicsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  // Get the epic for the viewing task
  const viewingTaskEpic = viewingTask?.epicId 
    ? epics.find(e => e.id === viewingTask.epicId) 
    : null;

  return (
    <div className="min-h-screen bg-zinc-950 p-6 pt-16">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Kanban Board</h1>
          <p className="text-zinc-500 text-sm mt-1">Drag and drop to organize your tasks</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hideCompletedTasks}
            onChange={(e) => setHideCompletedTasks(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-950 cursor-pointer"
          />
          <span className="text-sm text-zinc-400">Hide completed tasks</span>
        </label>
      </header>

      <EpicSelector
        epics={epics}
        selectedEpicId={selectedEpicId}
        onSelect={setSelectedEpicId}
        onAddEpic={async (name, color) => {
          try {
            await addEpic(name, color);
            showToast(`Epic "${name}" created`, 'success');
          } catch {
            showToast('Failed to create epic', 'error');
          }
        }}
        onDeleteEpic={async (id) => {
          const epic = epics.find(e => e.id === id);
          try {
            await deleteEpic(id);
            showToast(`Epic "${epic?.name}" deleted`, 'success');
            if (selectedEpicId === id) setSelectedEpicId(null);
          } catch {
            showToast('Failed to delete epic', 'error');
          }
        }}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMNS.filter(column => !hideCompletedTasks || column.id !== 'done').map(column => (
              <Column
                key={column.id}
                column={column}
                tasks={getTasksByColumn(column.id)}
                epics={epics}
                onViewTask={handleViewTask}
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
                onView={() => {}}
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
        epics={epics}
        defaultEpicId={selectedEpicId}
      />

      {viewingTask && (
        <TaskDetailView
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setViewingTask(null);
          }}
          onEdit={handleEditFromDetail}
          onDelete={handleDeleteTask}
          task={viewingTask}
          epic={viewingTaskEpic}
        />
      )}
    </div>
  );
}
