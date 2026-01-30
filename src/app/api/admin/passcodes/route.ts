import { NextRequest, NextResponse } from 'next/server';
import { getSession, listPasscodes, createPasscode } from '@/lib/auth';

// GET - List all passcodes (admin only)
export async function GET() {
  try {
    const session = await getSession();
    
    if (!session?.authenticated || !session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const codes = await listPasscodes();
    return NextResponse.json(codes);
  } catch (error) {
    console.error('List passcodes error:', error);
    return NextResponse.json({ error: 'Failed to list passcodes' }, { status: 500 });
  }
}

// POST - Create a new passcode (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.authenticated || !session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { code, name, isAdmin } = await request.json();
    
    if (!code || !name) {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 });
    }
    
    const result = await createPasscode(code, name, isAdmin || false);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Create passcode error:', error);
    return NextResponse.json({ error: 'Failed to create passcode' }, { status: 500 });
  }
}
