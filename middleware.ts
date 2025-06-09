import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Simple test - block all API routes except auth
  if (request.nextUrl.pathname.startsWith('/api/') && 
      !request.nextUrl.pathname.startsWith('/api/auth/')) {
    
    return NextResponse.json(
      { 
        error: 'Unauthorized', 
        message: 'You must be logged in to access this resource' 
      }, 
      { status: 401 }
    );
  }
  
  return NextResponse.next();
}

export const config = {
  // Apply middleware to all API routes
  matcher: [
    '/api/((?!auth).*)' // Match /api/* but exclude /api/auth/*
  ]
}