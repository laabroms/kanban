import { NextRequest, NextResponse } from 'next/server';
import { login, hasAnyPasscodes, createPasscode } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Passcode is required' }, { status: 400 });
    }
    
    // Check if this is initial setup (no passcodes exist)
    const hasPasscodes = await hasAnyPasscodes();
    
    if (!hasPasscodes) {
      // First passcode becomes admin
      if (code.length !== 6 || !/^\d+$/.test(code)) {
        return NextResponse.json({ error: 'Passcode must be exactly 6 digits' }, { status: 400 });
      }
      
      await createPasscode(code, 'Admin', true);
      const result = await login(code);
      return NextResponse.json({ 
        success: true, 
        isAdmin: true,
        message: 'Admin passcode created successfully' 
      });
    }
    
    const result = await login(code);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }
    
    return NextResponse.json({ success: true, isAdmin: result.isAdmin });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
