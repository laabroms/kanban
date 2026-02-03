import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { epics } from '@/db/schema';
import { eq } from 'drizzle-orm';

type RouteParams = { params: Promise<{ id: string }> };

// PATCH update epic
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const db = getDb();
    const { id } = await params;
    const body = await request.json();
    const { name, color, position } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (position !== undefined) updateData.position = position;

    const [updatedEpic] = await db
      .update(epics)
      .set(updateData)
      .where(eq(epics.id, id))
      .returning();

    if (!updatedEpic) {
      return NextResponse.json({ error: 'Epic not found' }, { status: 404 });
    }

    return NextResponse.json(updatedEpic);
  } catch (error) {
    console.error('Failed to update epic:', error);
    return NextResponse.json({ error: 'Failed to update epic' }, { status: 500 });
  }
}

// DELETE epic
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const db = getDb();
    const { id } = await params;
    
    const [deletedEpic] = await db
      .delete(epics)
      .where(eq(epics.id, id))
      .returning();

    if (!deletedEpic) {
      return NextResponse.json({ error: 'Epic not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete epic:', error);
    return NextResponse.json({ error: 'Failed to delete epic' }, { status: 500 });
  }
}
