'use client';

import { useState, useEffect, useCallback } from 'react';
import { Task, ColumnId, Priority } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'kanban-tasks';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setTasks(JSON.parse(stored));
      } catch {
        console.error('Failed to parse stored tasks');
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks, isLoaded]);

  const addTask = useCallback((
    title: string,
    description: string,
    priority: Priority,
    columnId: ColumnId = 'backlog'
  ) => {
    const newTask: Task = {
      id: uuidv4(),
      title,
      description: description || undefined,
      priority,
      columnId,
      createdAt: Date.now(),
    };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  }, []);

  const updateTask = useCallback((
    id: string,
    updates: Partial<Omit<Task, 'id' | 'createdAt'>>
  ) => {
    setTasks(prev => prev.map(task =>
      task.id === id ? { ...task, ...updates } : task
    ));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  }, []);

  const moveTask = useCallback((taskId: string, newColumnId: ColumnId) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, columnId: newColumnId } : task
    ));
  }, []);

  const getTasksByColumn = useCallback((columnId: ColumnId) => {
    return tasks.filter(task => task.columnId === columnId);
  }, [tasks]);

  return {
    tasks,
    isLoaded,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    getTasksByColumn,
  };
}
