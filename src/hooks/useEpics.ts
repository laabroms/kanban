'use client';

import { useState, useEffect, useCallback } from 'react';
import { Epic } from '@/types';

export function useEpics() {
  const [epics, setEpics] = useState<Epic[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEpics() {
      try {
        const res = await fetch('/api/epics');
        if (!res.ok) throw new Error('Failed to fetch epics');
        const data = await res.json();
        setEpics(data.map((e: Record<string, unknown>) => ({
          id: e.id as string,
          name: e.name as string,
          description: e.description as string | null | undefined,
          color: e.color as string,
          position: e.position as number,
          createdAt: new Date(e.createdAt as string).getTime(),
        })));
      } catch (err) {
        console.error('Failed to fetch epics:', err);
        setError('Failed to load epics');
      }
      setIsLoaded(true);
    }

    loadEpics();
  }, []);

  const addEpic = useCallback(async (name: string, color: string, description?: string) => {
    try {
      const res = await fetch('/api/epics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color, description }),
      });
      if (!res.ok) throw new Error('Failed to create epic');
      const newEpic = await res.json();
      setEpics(prev => [...prev, {
        id: newEpic.id,
        name: newEpic.name,
        description: newEpic.description,
        color: newEpic.color,
        position: newEpic.position,
        createdAt: new Date(newEpic.createdAt).getTime(),
      }]);
      return newEpic;
    } catch (err) {
      setError('Failed to create epic');
      console.error(err);
    }
  }, []);

  const updateEpic = useCallback(async (id: string, updates: Partial<Omit<Epic, 'id' | 'createdAt'>>) => {
    try {
      const res = await fetch(`/api/epics/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update epic');
      setEpics(prev => prev.map(epic =>
        epic.id === id ? { ...epic, ...updates } : epic
      ));
    } catch (err) {
      setError('Failed to update epic');
      console.error(err);
    }
  }, []);

  const deleteEpic = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/epics/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete epic');
      setEpics(prev => prev.filter(epic => epic.id !== id));
    } catch (err) {
      setError('Failed to delete epic');
      console.error(err);
    }
  }, []);

  return {
    epics,
    isLoaded,
    error,
    addEpic,
    updateEpic,
    deleteEpic,
  };
}
