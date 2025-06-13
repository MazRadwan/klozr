import { NextResponse } from 'next/server';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * HTTP error helper functions that return consistent JSON responses
 */
export const httpError = {
  badRequest: (message = 'Bad Request', details?: any) => 
    NextResponse.json(
      { error: 'BAD_REQUEST', message, ...(details && { details }) }, 
      { status: 400 }
    ),

  unauthorized: (message = 'Unauthorized') => 
    NextResponse.json(
      { error: 'UNAUTHORIZED', message }, 
      { status: 401 }
    ),

  forbidden: (message = 'Forbidden') => 
    NextResponse.json(
      { error: 'FORBIDDEN', message }, 
      { status: 403 }
    ),

  notFound: (message = 'Not Found') => 
    NextResponse.json(
      { error: 'NOT_FOUND', message }, 
      { status: 404 }
    ),

  conflict: (message = 'Conflict') => 
    NextResponse.json(
      { error: 'CONFLICT', message }, 
      { status: 409 }
    ),

  unprocessableEntity: (message = 'Unprocessable Entity', details?: any) => 
    NextResponse.json(
      { error: 'UNPROCESSABLE_ENTITY', message, ...(details && { details }) }, 
      { status: 422 }
    ),

  internal: (message = 'Internal Server Error') => 
    NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message }, 
      { status: 500 }
    ),
};

/**
 * Helper to create and throw AppError instances
 */
export const throwError = {
  badRequest: (message: string, details?: any): never => {
    throw new AppError(message, 400, 'BAD_REQUEST');
  },

  unauthorized: (message: string): never => {
    throw new AppError(message, 401, 'UNAUTHORIZED');
  },

  forbidden: (message: string): never => {
    throw new AppError(message, 403, 'FORBIDDEN');
  },

  notFound: (message: string): never => {
    throw new AppError(message, 404, 'NOT_FOUND');
  },

  conflict: (message: string): never => {
    throw new AppError(message, 409, 'CONFLICT');
  },

  unprocessableEntity: (message: string): never => {
    throw new AppError(message, 422, 'UNPROCESSABLE_ENTITY');
  },

  internal: (message: string): never => {
    throw new AppError(message, 500, 'INTERNAL_SERVER_ERROR');
  },
};

/**
 * Utility to handle AppError instances and convert to HTTP responses
 */
export function handleAppError(error: AppError) {
  return NextResponse.json(
    { error: error.code, message: error.message },
    { status: error.statusCode }
  );
}