import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Authentication guard utility for API routes
 * Call this at the beginning of any protected API route
 */
export async function requireAuth() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { 
          error: 'Unauthorized', 
          message: 'You must be logged in to access this resource' 
        }, 
        { status: 401 }
      );
    }
    
    return {
      session,
      user: session.user,
      error: null
    };
  } catch (error) {
    console.error('[Auth Guard] Error checking authentication:', error);
    return NextResponse.json(
      { 
        error: 'Authentication Error', 
        message: 'Failed to verify authentication' 
      }, 
      { status: 500 }
    );
  }
}

/**
 * Type guard to check if the result is an error response
 */
export function isAuthError(result: any): result is NextResponse {
  return result instanceof NextResponse && result.status >= 400;
}