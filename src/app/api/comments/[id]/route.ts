import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { comments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { validateRequest } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// DELETE a comment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await validateRequest(request);
  if (!auth.valid) return auth.error!;

  try {
    const db = getDb();
    const { id } = await params;

    const [deletedComment] = await db
      .delete(comments)
      .where(eq(comments.id, id))
      .returning();

    if (!deletedComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
