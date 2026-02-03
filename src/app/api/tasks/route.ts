import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { tasks } from '@/db/schema';
import { sendWebhook } from '@/lib/webhook';

// GET all tasks
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const allTasks = await db.select().from(tasks).orderBy(tasks.createdAt);
    return NextResponse.json(allTasks);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST new task
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { title, description, priority, columnId, epicId, prUrl, images } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const [newTask] = await db.insert(tasks).values({
      title,
      description: description || null,
      priority: priority || 'medium',
      columnId: columnId || 'backlog',
      epicId: epicId || null,
      prUrl: prUrl || null,
      images: images ? JSON.stringify(images) : null,
    }).returning();

    // Send webhook notification
    await sendWebhook('task.created', {
      id: newTask.id,
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      columnId: newTask.columnId,
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
