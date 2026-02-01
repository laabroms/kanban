'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Task, TaskImage, Priority, ColumnId, Epic } from '@/types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, description: string, priority: Priority, columnId?: ColumnId, epicId?: string | null, prUrl?: string | null, images?: TaskImage[] | null) => void;
  task?: Task | null;
  defaultColumnId?: ColumnId;
  epics?: Epic[];
  defaultEpicId?: string | null;
}

export function TaskModal({ isOpen, onClose, onSave, task, defaultColumnId, epics = [], defaultEpicId }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [epicId, setEpicId] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState('');
  const [images, setImages] = useState<TaskImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when task changes or modal opens
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setEpicId(task.epicId || null);
      setPrUrl(task.prUrl || '');
      setImages(task.images || []);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setEpicId(defaultEpicId || null);
      setPrUrl('');
      setImages([]);
    }
  }, [task, isOpen, defaultEpicId]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newImages: TaskImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Only accept images
      if (!file.type.startsWith('image/')) continue;
      // Limit file size to 5MB
      if (file.size > 5 * 1024 * 1024) continue;

      try {
        const base64 = await fileToBase64(file);
        newImages.push({
          id: crypto.randomUUID(),
          data: base64,
          name: file.name,
          type: file.type,
        });
      } catch (err) {
        console.error('Failed to read file:', err);
      }
    }

    setImages(prev => [...prev, ...newImages]);
    setIsUploading(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Focus title input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 10);
    }
  }, [isOpen]);

  // Handle escape key and focus trap
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === 'Tab') {
      const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
        'input, textarea, button, select, [tabindex]:not([tabindex="-1"])'
      );
      
      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(title.trim(), description.trim(), priority, defaultColumnId, epicId, prUrl.trim() || null, images.length > 0 ? images : null);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const selectedEpic = epics.find(e => e.id === epicId);

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-md shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-zinc-800">
          <h2 id="modal-title" className="text-lg font-semibold text-zinc-100">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="task-title" className="block text-sm text-zinc-400 mb-1">
              Title
            </label>
            <input
              ref={titleInputRef}
              id="task-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2
                         text-zinc-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Enter task title..."
            />
          </div>
          
          <div>
            <label htmlFor="task-description" className="block text-sm text-zinc-400 mb-1">
              Description (optional)
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2
                         text-zinc-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              placeholder="Add more details..."
              rows={3}
            />
          </div>

          {epics.length > 0 && (
            <div>
              <label htmlFor="task-epic" className="block text-sm text-zinc-400 mb-1">
                Epic
              </label>
              <select
                id="task-epic"
                value={epicId || ''}
                onChange={e => setEpicId(e.target.value || null)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2
                           text-zinc-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                style={selectedEpic ? { borderLeftColor: selectedEpic.color, borderLeftWidth: '4px' } : {}}
              >
                <option value="">No epic</option>
                {epics.map(epic => (
                  <option key={epic.id} value={epic.id}>
                    {epic.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="task-pr-url" className="block text-sm text-zinc-400 mb-1">
              Pull Request URL (optional)
            </label>
            <input
              id="task-pr-url"
              type="url"
              value={prUrl}
              onChange={e => setPrUrl(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2
                         text-zinc-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="https://github.com/..."
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              Images (optional)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="image-upload"
            />
            <div className="space-y-2">
              {/* Image previews */}
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {images.map(img => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.data}
                        alt={img.name}
                        className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full
                                   flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Remove ${img.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full py-2 px-3 border border-dashed border-zinc-600 rounded-lg
                           text-zinc-400 hover:border-zinc-500 hover:text-zinc-300 transition-colors
                           flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUploading ? (
                  <span>Uploading...</span>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Add Images</span>
                  </>
                )}
              </button>
              <p className="text-xs text-zinc-500">Max 5MB per image. Supports JPG, PNG, GIF.</p>
            </div>
          </div>
          
          <fieldset>
            <legend className="block text-sm text-zinc-400 mb-2">Priority</legend>
            <div className="flex gap-2" role="radiogroup">
              {(['low', 'medium', 'high'] as Priority[]).map(p => (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={priority === p}
                  onClick={() => setPriority(p)}
                  className={`
                    flex-1 py-2 rounded-lg text-sm font-medium transition-colors
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900
                    ${priority === p 
                      ? p === 'low' 
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                        : p === 'medium'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                        : 'bg-red-500/20 text-red-400 border border-red-500/50'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                    }
                  `}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </fieldset>
          
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm font-medium
                         bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 py-2 rounded-lg text-sm font-medium
                         bg-blue-600 text-white hover:bg-blue-500 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
            >
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
