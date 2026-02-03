import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { passcodes, sessions } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

const SESSION_COOKIE = 'kanban_session';

// API token validation for external API access
export function validateApiToken(request: NextRequest): { valid: boolean; error?: NextResponse } {
  const apiToken = process.env.API_AUTH_TOKEN;
  
  // If no token is configured, allow all requests (dev mode)
  if (!apiToken) {
    return { valid: true };
  }
  
  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (token === apiToken) {
      return { valid: true };
    }
  }
  
  // Check x-api-token header
  const xApiToken = request.headers.get('x-api-token');
  if (xApiToken === apiToken) {
    return { valid: true };
  }
  
  return {
    valid: false,
    error: NextResponse.json(
      { error: 'Unauthorized - Invalid or missing API token' },
      { status: 401 }
    ),
  };
}

// Validate request - checks either session cookie OR API token
export async function validateRequest(request: NextRequest): Promise<{ valid: boolean; error?: NextResponse }> {
  // First check API token (for external API calls)
  const tokenCheck = validateApiToken(request);
  if (tokenCheck.valid) {
    return { valid: true };
  }
  
  // Fall back to session cookie check (for frontend)
  const session = await getSession();
  if (session?.authenticated) {
    return { valid: true };
  }
  
  return {
    valid: false,
    error: NextResponse.json(
      { error: 'Unauthorized - Please provide a valid API token or login' },
      { status: 401 }
    ),
  };
}
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Simple hash function for passcodes (in production, use bcrypt)
export function hashCode(code: string): string {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    const char = code.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // Add salt and convert to hex
  const salted = `kanban_${hash}_${code.split('').reverse().join('')}`;
  let finalHash = 0;
  for (let i = 0; i < salted.length; i++) {
    finalHash = ((finalHash << 5) - finalHash) + salted.charCodeAt(i);
    finalHash = finalHash & finalHash;
  }
  return Math.abs(finalHash).toString(16).padStart(8, '0');
}

// Generate a random session token
export function generateToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

// Verify passcode and create session
export async function login(code: string): Promise<{ success: boolean; isAdmin?: boolean; error?: string }> {
  const db = getDb();
  const hashedCode = hashCode(code);
  
  const [passcode] = await db
    .select()
    .from(passcodes)
    .where(eq(passcodes.code, hashedCode));
  
  if (!passcode) {
    return { success: false, error: 'Invalid passcode' };
  }
  
  // Update last used timestamp
  await db
    .update(passcodes)
    .set({ lastUsedAt: new Date() })
    .where(eq(passcodes.id, passcode.id));
  
  // Create session
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  
  await db.insert(sessions).values({
    passcodeId: passcode.id,
    token,
    expiresAt,
  });
  
  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
  
  return { success: true, isAdmin: passcode.isAdmin };
}

// Get current session
export async function getSession(): Promise<{ authenticated: boolean; isAdmin: boolean; name?: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  
  if (!token) {
    return null;
  }
  
  const db = getDb();
  const [session] = await db
    .select({
      id: sessions.id,
      expiresAt: sessions.expiresAt,
      passcodeId: sessions.passcodeId,
      passcodeName: passcodes.name,
      isAdmin: passcodes.isAdmin,
    })
    .from(sessions)
    .innerJoin(passcodes, eq(sessions.passcodeId, passcodes.id))
    .where(and(
      eq(sessions.token, token),
      gt(sessions.expiresAt, new Date())
    ));
  
  if (!session) {
    return null;
  }
  
  return {
    authenticated: true,
    isAdmin: session.isAdmin,
    name: session.passcodeName,
  };
}

// Logout - delete session
export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  
  if (token) {
    const db = getDb();
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  
  cookieStore.delete(SESSION_COOKIE);
}

// Check if any passcodes exist (for initial setup)
export async function hasAnyPasscodes(): Promise<boolean> {
  const db = getDb();
  const result = await db.select({ id: passcodes.id }).from(passcodes).limit(1);
  return result.length > 0;
}

// Create a passcode (admin only, or during initial setup)
export async function createPasscode(code: string, name: string, isAdmin: boolean): Promise<{ success: boolean; error?: string }> {
  if (code.length !== 6 || !/^\d+$/.test(code)) {
    return { success: false, error: 'Passcode must be exactly 6 digits' };
  }
  
  const db = getDb();
  const hashedCode = hashCode(code);
  
  // Check if code already exists
  const [existing] = await db
    .select()
    .from(passcodes)
    .where(eq(passcodes.code, hashedCode));
  
  if (existing) {
    return { success: false, error: 'This passcode already exists' };
  }
  
  await db.insert(passcodes).values({
    code: hashedCode,
    name,
    isAdmin,
  });
  
  return { success: true };
}

// List all passcodes (admin only)
export async function listPasscodes(): Promise<Array<{ id: string; name: string; isAdmin: boolean; createdAt: Date; lastUsedAt: Date | null }>> {
  const db = getDb();
  return db
    .select({
      id: passcodes.id,
      name: passcodes.name,
      isAdmin: passcodes.isAdmin,
      createdAt: passcodes.createdAt,
      lastUsedAt: passcodes.lastUsedAt,
    })
    .from(passcodes)
    .orderBy(passcodes.createdAt);
}

// Delete a passcode (admin only)
export async function deletePasscode(id: string): Promise<{ success: boolean; error?: string }> {
  const db = getDb();
  
  // Don't allow deleting the last admin
  const admins = await db
    .select()
    .from(passcodes)
    .where(eq(passcodes.isAdmin, true));
  
  const [passcodeToDelete] = await db
    .select()
    .from(passcodes)
    .where(eq(passcodes.id, id));
  
  if (passcodeToDelete?.isAdmin && admins.length <= 1) {
    return { success: false, error: 'Cannot delete the last admin passcode' };
  }
  
  await db.delete(passcodes).where(eq(passcodes.id, id));
  return { success: true };
}
