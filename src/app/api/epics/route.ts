import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { epics } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { validateRequest } from '@/lib/auth';

// GET all epics
export async function GET(request: NextRequest) {
  const auth = await validateRequest(request);
  if (!auth.valid) return auth.error!;

  try {
    const db = getDb();
    const allEpics = await db.select().from(epics).orderBy(asc(epics.position), asc(epics.createdAt));
    return NextResponse.json(allEpics);
  } catch (error) {
    console.error('Failed to fetch epics:', error);
    return NextResponse.json({ error: 'Failed to fetch epics' }, { status: 500 });
  }
}

// POST new epic
export async function POST(request: NextRequest) {
  const auth = await validateRequest(request);
  if (!auth.valid) return auth.error!;

  try {
    const db = getDb();
    const body = await request.json();
    const { name, color } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Get max position
    const existingEpics = await db.select().from(epics);
    const maxPosition = existingEpics.reduce((max, e) => Math.max(max, e.position), -1);

    const [newEpic] = await db.insert(epics).values({
      name,
      color: color || '#3b82f6',
      position: maxPosition + 1,
    }).returning();

    return NextResponse.json(newEpic, { status: 201 });
  } catch (error) {
    console.error('Failed to create epic:', error);
    return NextResponse.json({ error: 'Failed to create epic' }, { status: 500 });
  }
}
