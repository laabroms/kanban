'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Task, Comment, Epic, COLUMNS } from '@/types';

interface TaskDetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
  task: Task;
  epic?: Epic | null;
}

export function TaskDetailView({ isOpen, onClose, onEdit, onDelete, task, epic }: TaskDetailViewProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const modalRef = useRef<HTMLDivElement>(null);

  // Fetch comments when task changes
  useEffect(() => {
    if (isOpen && task?.id) {
      fetchComments();
    }
  }, [isOpen, task?.id]);

  const fetchComments = async () => {
    if (!task?.id) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          author: authorName.trim() || 'Anonymous',
        }),
      });

      if (response.ok) {
        const comment = await response.json();
        setComments([comment, ...comments]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setComments(comments.filter(c => c.id !== commentId));
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  // Handle escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Lock body scroll and prevent touch scrolling on backdrop
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        // Restore scroll position
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen || !task) return null;

  const column = COLUMNS.find(c => c.id === task.columnId);
  const priorityColors = {
    low: 'bg-blue-500/20 text-blue-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    high: 'bg-red-500/20 text-red-400',
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onTouchMove={(e) => {
        // Prevent background scrolling on mobile when touching backdrop
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div 
        ref={modalRef}
        className="bg-zinc-900 rounded-t-xl sm:rounded-xl border-t sm:border border-zinc-800 w-full sm:max-w-2xl shadow-xl max-h-[85vh] sm:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>
        {/* Header */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-start justify-between gap-2 mb-3">
            <h2 className="text-lg sm:text-xl font-semibold text-zinc-100 break-words flex-1">
              {task.title}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[task.priority]}`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-700 text-zinc-300">
              {column?.title}
            </span>
            {epic && (
              <span 
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{ backgroundColor: `${epic.color}20`, color: epic.color }}
              >
                {epic.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={onEdit}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:bg-zinc-600 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => {
                onClose();
                onDelete(task.id);
              }}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 active:bg-red-900/70 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Description */}
          {task.description && (
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Description</h3>
              <p className="text-zinc-200 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* PR Link */}
          {task.prUrl && (
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Pull Request</h3>
              <a 
                href={task.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"/>
                </svg>
                {task.prUrl}
              </a>
            </div>
          )}

          {/* Due Date */}
          {task.dueDate && (
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Due Date</h3>
              {(() => {
                const due = new Date(task.dueDate);
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
                const diffDays = Math.ceil((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const isOverdue = diffDays < 0 && task.columnId !== 'done';
                const isDueSoon = diffDays >= 0 && diffDays <= 2 && task.columnId !== 'done';
                
                return (
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                    isOverdue 
                      ? 'bg-red-500/20 text-red-400' 
                      : isDueSoon 
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      {due.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      {isOverdue && ' (Overdue)'}
                      {isDueSoon && diffDays === 0 && ' (Today)'}
                      {isDueSoon && diffDays === 1 && ' (Tomorrow)'}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Images */}
          {task.images && task.images.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-2">
                Attachments ({task.images.length})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {task.images.map((img) => (
                  <a
                    key={img.id}
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-32 object-cover rounded-lg border border-zinc-700 
                                 group-hover:border-blue-500 transition-colors"
                    />
                    <p className="text-xs text-zinc-500 mt-1 truncate">{img.name}</p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-3">
              Comments {comments.length > 0 && `(${comments.length})`}
            </h3>

            {/* Add Comment Form */}
            <form onSubmit={handleSubmitComment} className="mb-4">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm
                             text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={2}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm
                             text-zinc-100 focus:outline-none focus:border-blue-500 resize-none"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg
                             hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? '...' : 'Post'}
                </button>
              </div>
            </form>

            {/* Comments List */}
            {isLoading ? (
              <p className="text-zinc-500 text-sm">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-zinc-500 text-sm">No comments yet</p>
            ) : (
              <div className="space-y-3">
                {comments.map(comment => (
                  <div key={comment.id} className="bg-zinc-800/50 rounded-lg p-3 group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-zinc-200">{comment.author}</span>
                          <span className="text-xs text-zinc-500">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm text-zinc-300 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        aria-label="Delete comment"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
