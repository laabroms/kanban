import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { comments, tasks } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

type RouteParams = { params: Promise<{ id: string }> };

// GET all comments for a task
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const db = getDb();
    const { id: taskId } = await params;

    // Verify task exists
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const taskComments = await db
      .select()
      .from(comments)
      .where(eq(comments.taskId, taskId))
      .orderBy(desc(comments.createdAt));

    return NextResponse.json(taskComments);
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST create a new comment
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const db = getDb();
    const { id: taskId } = await params;
    const body = await request.json();
    const { content, author } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Verify task exists
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const [newComment] = await db
      .insert(comments)
      .values({
        taskId,
        content: content.trim(),
        author: author?.trim() || 'Anonymous',
      })
      .returning();

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error('Failed to create comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
