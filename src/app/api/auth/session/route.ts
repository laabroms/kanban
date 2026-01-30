import { NextResponse } from 'next/server';
import { getSession, hasAnyPasscodes } from '@/lib/auth';

export async function GET() {
  try {
    const hasPasscodes = await hasAnyPasscodes();
    
    if (!hasPasscodes) {
      return NextResponse.json({ 
        authenticated: false, 
        needsSetup: true 
      });
    }
    
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ authenticated: false });
    }
    
    return NextResponse.json(session);
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
