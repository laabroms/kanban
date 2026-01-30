'use client';

import { useState, useEffect } from 'react';

interface Passcode {
  id: string;
  name: string;
  isAdmin: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

interface AdminPanelProps {
  onClose: () => void;
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [passcodes, setPasscodes] = useState<Passcode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchPasscodes();
  }, []);

  const fetchPasscodes = async () => {
    try {
      const res = await fetch('/api/admin/passcodes');
      if (res.ok) {
        const data = await res.json();
        setPasscodes(data);
      }
    } catch (err) {
      console.error('Failed to fetch passcodes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const res = await fetch('/api/admin/passcodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newCode, name: newName, isAdmin: newIsAdmin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create passcode');
      } else {
        setNewCode('');
        setNewName('');
        setNewIsAdmin(false);
        setShowCreate(false);
        fetchPasscodes();
      }
    } catch {
      setError('Connection error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete passcode "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/passcodes/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to delete');
      } else {
        fetchPasscodes();
      }
    } catch {
      alert('Connection error');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-lg shadow-xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">Manage Passcodes</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <p className="text-zinc-500 text-center py-8">Loading...</p>
          ) : (
            <div className="space-y-3">
              {passcodes.map(pc => (
                <div
                  key={pc.id}
                  className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-100 font-medium">{pc.name}</span>
                      {pc.isAdmin && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-500 text-xs mt-1">
                      Last used: {formatDate(pc.lastUsedAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(pc.id, pc.name)}
                    className="text-red-400 hover:text-red-300 text-sm px-2 py-1"
                  >
                    Delete
                  </button>
                </div>
              ))}

              {passcodes.length === 0 && (
                <p className="text-zinc-500 text-center py-4">No passcodes yet</p>
              )}
            </div>
          )}

          {showCreate ? (
            <form onSubmit={handleCreate} className="mt-4 p-4 bg-zinc-800/30 rounded-lg space-y-3">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g., Guest, Team Member"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2
                             text-zinc-100 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">6-Digit Passcode</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={newCode}
                  onChange={e => setNewCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  maxLength={6}
                  autoComplete="off"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2
                             text-zinc-100 font-mono tracking-widest focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={newIsAdmin}
                  onChange={e => setNewIsAdmin(e.target.checked)}
                  className="rounded bg-zinc-800 border-zinc-700"
                />
                Admin access (can manage passcodes)
              </label>
              
              {error && <p className="text-red-400 text-sm">{error}</p>}
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium
                             bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || newCode.length !== 6 || !newName}
                  className="flex-1 py-2 rounded-lg text-sm font-medium
                             bg-blue-600 text-white hover:bg-blue-500
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 w-full py-2 rounded-lg text-sm font-medium
                         border border-dashed border-zinc-700 text-zinc-400
                         hover:border-zinc-600 hover:text-zinc-300"
            >
              + Add Passcode
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
