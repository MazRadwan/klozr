import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from './auth';
import { AppError, handleAppError, httpError } from './httpError';
import { z } from 'zod';

/**
 * Configuration options for the withHandler wrapper
 */
interface HandlerOptions {
  /** Whether authentication is required for this endpoint */
  auth?: boolean;
  /** Custom error handler for specific error types */
  onError?: (error: unknown) => NextResponse | void;
}

/**
 * Type for Next.js API route handlers
 */
type RouteHandler = (
  req: NextRequest,
  context: { params: Promise<any> }
) => Promise<NextResponse> | NextResponse;

/**
 * Type for route handlers without params
 */
type SimpleRouteHandler = (
  req: NextRequest
) => Promise<NextResponse> | NextResponse;

/**
 * Higher-order function that wraps API route handlers with:
 * 1. Authentication checking (when enabled)
 * 2. Consistent error handling and mapping
 * 3. Automatic AppError → JSON conversion
 * 4. Zod validation error formatting
 * 5. Unhandled exception catching
 */
export function withHandler(
  options: HandlerOptions,
  handler: RouteHandler
): RouteHandler {
  const { auth = true, onError } = options;

  return async (req: NextRequest, context: { params: Promise<any> }) => {
    try {
      // 1. Authentication check (if required)
      if (auth) {
        const authResult = await requireAuth();
        if (isAuthError(authResult)) {
          return authResult;
        }
      }

      // 2. Execute the main handler
      return await handler(req, context);

    } catch (error) {
      console.error('Handler error:', error);
      return handleError(error, onError);
    }
  };
}

/**
 * Higher-order function for simple handlers without params
 */
export function withSimpleHandler(
  options: HandlerOptions,
  handler: SimpleRouteHandler
): SimpleRouteHandler {
  const { auth = true, onError } = options;

  return async (req: NextRequest) => {
    try {
      // 1. Authentication check (if required)
      if (auth) {
        const authResult = await requireAuth();
        if (isAuthError(authResult)) {
          return authResult;
        }
      }

      // 2. Execute the main handler
      return await handler(req);

    } catch (error) {
      console.error('Handler error:', error);
      return handleError(error, onError);
    }
  };
}

/**
 * Centralized error handling logic
 */
function handleError(error: unknown, onError?: (error: unknown) => NextResponse | void): NextResponse {
  // Custom error handler (if provided)
  if (onError) {
    const customResponse = onError(error);
    if (customResponse) {
      return customResponse;
    }
  }

  // Handle known error types
  if (error instanceof AppError) {
    return handleAppError(error);
  }

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return httpError.badRequest('Validation error', error.errors);
  }

  // Handle generic errors
  if (error instanceof Error) {
    // Don't expose internal error details in production
    const message = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Internal server error';
    
    return httpError.internal(message);
  }

  // Handle unknown error types
  return httpError.internal('An unexpected error occurred');
}

/**
 * Convenience wrapper for simple handlers that don't require authentication
 */
export function withPublicHandler(
  handler: SimpleRouteHandler,
  onError?: (error: unknown) => NextResponse | void
): SimpleRouteHandler {
  return withSimpleHandler({ auth: false, onError }, handler);
}

/**
 * Convenience wrapper for simple handlers that require authentication (default)
 */
export function withAuthHandler(
  handler: SimpleRouteHandler,
  onError?: (error: unknown) => NextResponse | void
): SimpleRouteHandler {
  return withSimpleHandler({ auth: true, onError }, handler);
}

/**
 * Convenience wrapper for parameterized handlers that don't require authentication
 */
export function withPublicParamsHandler(
  handler: RouteHandler,
  onError?: (error: unknown) => NextResponse | void
): RouteHandler {
  return withHandler({ auth: false, onError }, handler);
}

/**
 * Convenience wrapper for parameterized handlers that require authentication (default)
 */
export function withAuthParamsHandler(
  handler: RouteHandler,
  onError?: (error: unknown) => NextResponse | void
): RouteHandler {
  return withHandler({ auth: true, onError }, handler);
}