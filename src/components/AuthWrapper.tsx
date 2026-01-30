'use client';

import { useState, useEffect } from 'react';
import { LoginPage } from './LoginPage';
import { KanbanBoard } from './KanbanBoard';
import { AdminPanel } from './AdminPanel';

interface SessionData {
  authenticated: boolean;
  isAdmin?: boolean;
  name?: string;
  needsSetup?: boolean;
}

export function AuthWrapper() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      setSession(data);
    } catch {
      setSession({ authenticated: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession({ authenticated: false });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  if (!session?.authenticated) {
    return (
      <LoginPage 
        onSuccess={checkSession} 
        needsSetup={session?.needsSetup}
      />
    );
  }

  return (
    <div className="relative">
      {/* User menu */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-3">
        <span className="text-zinc-500 text-sm">
          {session.name}
          {session.isAdmin && (
            <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
              Admin
            </span>
          )}
        </span>
        {session.isAdmin && (
          <button
            onClick={() => setShowAdmin(true)}
            className="text-sm text-zinc-400 hover:text-zinc-200 px-3 py-1.5
                       bg-zinc-800/50 rounded-lg hover:bg-zinc-800"
          >
            ⚙️ Passcodes
          </button>
        )}
        <button
          onClick={handleLogout}
          className="text-sm text-zinc-400 hover:text-zinc-200 px-3 py-1.5
                     bg-zinc-800/50 rounded-lg hover:bg-zinc-800"
        >
          Logout
        </button>
      </div>

      <KanbanBoard />

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
}
