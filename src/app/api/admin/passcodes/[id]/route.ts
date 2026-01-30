import { NextRequest, NextResponse } from 'next/server';
import { getSession, deletePasscode } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// DELETE - Delete a passcode (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    
    if (!session?.authenticated || !session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    const result = await deletePasscode(id);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete passcode error:', error);
    return NextResponse.json({ error: 'Failed to delete passcode' }, { status: 500 });
  }
}
