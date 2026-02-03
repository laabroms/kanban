'use client';

import { useState, useRef } from 'react';
import { Epic } from '@/types';

interface EpicSelectorProps {
  epics: Epic[];
  selectedEpicId: string | null;
  onSelect: (epicId: string | null) => void;
  onAddEpic: (name: string, color: string, description?: string) => void;
  onUpdateEpic: (id: string, updates: { name?: string; color?: string; description?: string }) => void;
  onDeleteEpic: (id: string) => void;
}

const COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f97316', // orange
  '#22c55e', // green
  '#06b6d4', // cyan
  '#eab308', // yellow
  '#ef4444', // red
];

export function EpicSelector({ epics, selectedEpicId, onSelect, onAddEpic, onUpdateEpic, onDeleteEpic }: EpicSelectorProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [editingEpic, setEditingEpic] = useState<Epic | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('');
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddEpic(newName.trim(), newColor, newDescription.trim() || undefined);
    setNewName('');
    setNewDescription('');
    setNewColor(COLORS[0]);
    setShowCreate(false);
  };

  const handleStartEdit = (epic: Epic) => {
    setEditingEpic(epic);
    setEditName(epic.name);
    setEditDescription(epic.description || '');
    setEditColor(epic.color);
    setShowMenu(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEpic || !editName.trim()) return;
    onUpdateEpic(editingEpic.id, {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      color: editColor,
    });
    setEditingEpic(null);
  };

  const handleDelete = (epic: Epic) => {
    if (confirm(`Delete "${epic.name}" epic? Tasks will be unassigned.`)) {
      onDeleteEpic(epic.id);
    }
    setShowMenu(null);
  };

  // Long press handlers for mobile
  const handleTouchStart = (epicId: string) => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setShowMenu(epicId);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleEpicClick = (epicId: string) => {
    // Don't select if long press was triggered
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    onSelect(epicId);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 flex-wrap">
        {/* All tasks tab */}
        <button
          onClick={() => onSelect(null)}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${selectedEpicId === null
              ? 'bg-zinc-700 text-zinc-100'
              : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
            }
          `}
        >
          All Tasks
        </button>

        {/* Epic tabs */}
        {epics.map(epic => (
          <div key={epic.id} className="relative flex items-center">
            <button
              onClick={() => handleEpicClick(epic.id)}
              onTouchStart={() => handleTouchStart(epic.id)}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              onContextMenu={(e) => {
                e.preventDefault();
                setShowMenu(showMenu === epic.id ? null : epic.id);
              }}
              className={`
                pl-4 pr-8 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                ${selectedEpicId === epic.id
                  ? 'text-white'
                  : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
                }
              `}
              style={selectedEpicId === epic.id ? { backgroundColor: epic.color } : {}}
              title={epic.description || undefined}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: epic.color }}
              />
              {epic.name}
            </button>

            {/* Menu button - always visible */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(showMenu === epic.id ? null : epic.id);
              }}
              className={`
                absolute right-1 w-6 h-6 rounded-full 
                text-xs flex items-center justify-center transition-colors
                ${selectedEpicId === epic.id
                  ? 'text-white/70 hover:text-white hover:bg-white/20'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700'
                }
              `}
            >
              ⋮
            </button>

            {/* Context menu */}
            {showMenu === epic.id && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(null)}
                />
                <div className="absolute top-full right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-50 py-1 min-w-[140px]">
                  <button
                    onClick={() => handleStartEdit(epic)}
                    className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 flex items-center gap-2"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(epic)}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-zinc-700 flex items-center gap-2"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Add epic button */}
        {!showCreate && !editingEpic && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 py-2 text-zinc-500 hover:text-zinc-300 text-sm"
          >
            + Epic
          </button>
        )}
      </div>

      {/* Create epic form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="mt-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Epic name..."
              autoFocus
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm
                         text-zinc-100 focus:outline-none focus:border-blue-500"
            />
            <textarea
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="Description (optional)..."
              rows={2}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm
                         text-zinc-100 focus:outline-none focus:border-blue-500 resize-none"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-zinc-400">Color:</span>
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewColor(color)}
                  className={`w-6 h-6 rounded-full transition-transform ${newColor === color ? 'scale-125 ring-2 ring-white/50' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!newName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium
                           hover:bg-blue-500 disabled:opacity-50"
              >
                Create Epic
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setNewName('');
                  setNewDescription('');
                }}
                className="px-4 py-2 text-zinc-400 hover:text-zinc-200 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Edit epic modal */}
      {editingEpic && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">Edit Epic</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg
                             text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={3}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg
                             text-zinc-100 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditColor(color)}
                      className={`w-8 h-8 rounded-full transition-transform ${editColor === color ? 'scale-110 ring-2 ring-white/50' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEpic(null)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium
                             bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editName.trim()}
                  className="flex-1 py-2 rounded-lg text-sm font-medium
                             bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
