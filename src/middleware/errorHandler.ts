import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

/**
 * @fileoverview Error handling middleware for Express application
 * 
 * This module provides centralized error handling middleware that catches
 * and processes all errors in the Express application, ensuring consistent
 * error responses and proper logging.
 * 
 * Features:
 * - Centralized error handling for all routes
 * - Environment-specific error message filtering
 * - Consistent API response format
 * - Comprehensive error logging
 * - 404 handler for undefined routes
 */

/**
 * Global error handling middleware for Express
 * 
 * This middleware catches all errors that occur in the application and
 * formats them into consistent API responses. It handles both expected
 * application errors and unexpected system errors.
 * 
 * Error Processing:
 * - Logs all errors for debugging and monitoring
 * - Uses existing status code or defaults to 500
 * - Filters error messages based on environment
 * - Returns consistent ApiResponse format
 * 
 * Security Considerations:
 * - In production, hides detailed error messages from clients
 * - Logs full error details for server-side debugging
 * - Prevents information leakage through error messages
 * 
 * @param {Error} error - The error object that was thrown
 * @param {Request} req - Express request object
 * @param {Response<ApiResponse>} res - Express response object
 * @param {NextFunction} next - Express next function (required for error middleware)
 * 
 * @example
 * ```typescript
 * // In app.ts, add as the last middleware
 * app.use(errorHandler);
 * 
 * // Errors thrown anywhere in the app will be caught:
 * app.get('/api/test', (req, res) => {
 *   throw new Error('Something went wrong');
 *   // This error will be caught by errorHandler middleware
 * });
 * 
 * // Async errors need to be passed to next():
 * app.get('/api/async', async (req, res, next) => {
 *   try {
 *     await someAsyncOperation();
 *   } catch (error) {
 *     next(error); // Pass to error handler
 *   }
 * });
 * ```
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void {
  // Log error details for server-side debugging
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    headers: req.headers,
    body: req.body
  });

  // Determine status code - use existing or default to 500
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  // Determine error message based on environment
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong' 
    : error.message;

  // Send consistent error response
  res.status(statusCode).json({
    success: false,
    message: 'Internal server error',
    error: errorMessage
  });
}

/**
 * 404 Not Found handler for undefined routes
 * 
 * This middleware handles requests to routes that don't exist in the
 * application. It should be added after all route definitions but
 * before the error handler middleware.
 * 
 * @param {Request} req - Express request object
 * @param {Response<ApiResponse>} res - Express response object
 * 
 * @example
 * ```typescript
 * // In app.ts, add after all route definitions
 * app.use('/api/auth', authRoutes);
 * app.use('/api/protected', protectedRoutes);
 * 
 * // Add 404 handler after all routes
 * app.use(notFound);
 * 
 * // Finally add error handler
 * app.use(errorHandler);
 * ```
 * 
 * Response Format:
 * ```json
 * {
 *   "success": false,
 *   "message": "Route not found",
 *   "error": "Cannot GET /api/nonexistent"
 * }
 * ```
 */
export function notFound(req: Request, res: Response<ApiResponse>): void {
  // Log 404 attempts for monitoring
  console.warn('404 Not Found:', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: `Cannot ${req.method} ${req.originalUrl}`
  });
}
