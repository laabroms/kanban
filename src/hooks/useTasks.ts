'use client';

import { useState, useEffect, useCallback } from 'react';
import { Task, ColumnId, Priority } from '@/types';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks from API
  useEffect(() => {
    async function loadTasks() {
      try {
        const res = await fetch('/api/tasks');
        if (!res.ok) throw new Error('Failed to fetch tasks');
        const data = await res.json();
        setTasks(data.map((t: Record<string, unknown>) => ({
          id: t.id as string,
          title: t.title as string,
          description: t.description as string | undefined,
          priority: t.priority as Priority,
          columnId: t.columnId as ColumnId,
          epicId: t.epicId as string | null | undefined,
          prUrl: t.prUrl as string | null | undefined,
          createdAt: new Date(t.createdAt as string).getTime(),
        })));
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
        setError('Failed to load tasks');
      }
      setIsLoaded(true);
    }

    loadTasks();
  }, []);

  const addTask = useCallback(async (
    title: string,
    description: string,
    priority: Priority,
    columnId: ColumnId = 'backlog',
    epicId?: string | null
  ) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, priority, columnId, epicId }),
      });
      if (!res.ok) throw new Error('Failed to create task');
      const newTask = await res.json();
      setTasks(prev => [...prev, {
        id: newTask.id,
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        columnId: newTask.columnId,
        epicId: newTask.epicId,
        prUrl: newTask.prUrl,
        createdAt: new Date(newTask.createdAt).getTime(),
      }]);
      return newTask;
    } catch (err) {
      setError('Failed to create task');
      console.error(err);
    }
  }, []);

  const updateTask = useCallback(async (
    id: string,
    updates: Partial<Omit<Task, 'id' | 'createdAt'>>
  ) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update task');
      setTasks(prev => prev.map(task =>
        task.id === id ? { ...task, ...updates } : task
      ));
    } catch (err) {
      setError('Failed to update task');
      console.error(err);
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');
      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (err) {
      setError('Failed to delete task');
      console.error(err);
    }
  }, []);

  const moveTask = useCallback(async (taskId: string, newColumnId: ColumnId) => {
    // Optimistic update
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, columnId: newColumnId } : task
    ));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId: newColumnId }),
      });
      if (!res.ok) throw new Error('Failed to move task');
    } catch (err) {
      // Revert on failure - refetch tasks
      setError('Failed to move task');
      console.error(err);
    }
  }, []);

  const getTasksByColumn = useCallback((columnId: ColumnId) => {
    return tasks.filter(task => task.columnId === columnId);
  }, [tasks]);

  return {
    tasks,
    isLoaded,
    error,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    getTasksByColumn,
  };
}
