import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendWebhook } from '@/lib/webhook';

type RouteParams = { params: Promise<{ id: string }> };

// GET single task
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const db = getDb();
    const { id } = await params;
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    return NextResponse.json(task);
  } catch (error) {
    console.error('Failed to fetch task:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

// PATCH update task
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const db = getDb();
    const { id } = await params;
    const body = await request.json();
    const { title, description, priority, columnId, epicId, prUrl } = body;

    // Get current task for comparison
    const [currentTask] = await db.select().from(tasks).where(eq(tasks.id, id));
    if (!currentTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (columnId !== undefined) updateData.columnId = columnId;
    if (epicId !== undefined) updateData.epicId = epicId;
    if (prUrl !== undefined) updateData.prUrl = prUrl;

    const [updatedTask] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();

    // Send webhook - detect if it's a move or general update
    const isMove = columnId !== undefined && columnId !== currentTask.columnId;
    await sendWebhook(
      isMove ? 'task.moved' : 'task.updated',
      {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        priority: updatedTask.priority,
        columnId: updatedTask.columnId,
      },
      isMove ? { from: currentTask.columnId, to: columnId } : undefined
    );

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Failed to update task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// DELETE task
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const db = getDb();
    const { id } = await params;
    const [deletedTask] = await db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning();

    if (!deletedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Send webhook notification
    await sendWebhook('task.deleted', {
      id: deletedTask.id,
      title: deletedTask.title,
      description: deletedTask.description,
      priority: deletedTask.priority,
      columnId: deletedTask.columnId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
