import { NextRequest, NextResponse } from 'next/server';

/**
 * API Authentication Middleware
 * 
 * Checks for Bearer token in Authorization header.
 * Set API_TOKEN environment variable to enable auth.
 */
export function verifyApiToken(request: NextRequest): boolean {
  const apiToken = process.env.API_TOKEN;
  
  // If no API_TOKEN is set, allow all requests (backward compatible)
  if (!apiToken) {
    return true;
  }
  
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return false;
  }
  
  // Expected format: "Bearer <token>"
  const [type, token] = authHeader.split(' ');
  
  if (type !== 'Bearer' || !token) {
    return false;
  }
  
  return token === apiToken;
}

/**
 * Return 401 Unauthorized response
 */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Unauthorized - Invalid or missing API token' },
    { status: 401 }
  );
}
