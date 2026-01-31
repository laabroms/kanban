export type Priority = 'low' | 'medium' | 'high';

export type ColumnId = 'backlog' | 'in-progress' | 'review' | 'done';

export interface Epic {
  id: string;
  name: string;
  color: string;
  position: number;
  createdAt: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  columnId: ColumnId;
  epicId?: string | null;
  prUrl?: string | null;
  createdAt: number;
}

export interface Comment {
  id: string;
  taskId: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface Column {
  id: ColumnId;
  title: string;
}

export const COLUMNS: Column[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
];
