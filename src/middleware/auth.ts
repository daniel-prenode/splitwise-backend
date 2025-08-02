import { Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { UserModel } from '../models/User';

/**
 * @fileoverview Authentication middleware for JWT token verification
 * 
 * This module provides Express middleware for authenticating API requests
 * using JWT tokens. It verifies tokens, checks user existence, and adds
 * user information to the request object for downstream handlers.
 * 
 * Security features:
 * - JWT token verification with signature validation
 * - User existence verification in database
 * - Proper error handling and status codes
 * - Request enrichment with authenticated user data
 */

/**
 * Express middleware for JWT token authentication
 * 
 * This middleware function authenticates incoming requests by:
 * 1. Extracting JWT token from Authorization header
 * 2. Verifying token signature and expiration
 * 3. Checking if the user still exists in database
 * 4. Adding decoded user information to request object
 * 5. Calling next() to continue to protected route
 * 
 * If authentication fails at any step, returns 401 Unauthorized response.
 * 
 * @param {AuthRequest} req - Express request object (extended with user property)
 * @param {Response<ApiResponse>} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {Promise<void>} Resolves when authentication is complete
 * 
 * @example
 * ```typescript
 * // Protect a single route
 * app.get('/api/profile', authenticateToken, (req: AuthRequest, res) => {
 *   const userId = req.user?.userId; // TypeScript knows this exists
 *   // Handle authenticated request
 * });
 * 
 * // Protect all routes under a path
 * app.use('/api/protected', authenticateToken);
 * 
 * // In route handler, user is guaranteed to be present
 * app.get('/api/protected/data', (req: AuthRequest, res) => {
 *   console.log(`Request from user: ${req.user!.email}`);
 * });
 * ```
 * 
 * @throws {401} Unauthorized - If token is missing, invalid, expired, or user doesn't exist
 * 
 * Token Requirements:
 * - Must be provided in Authorization header
 * - Format: "Bearer <jwt-token>"
 * - Token must be valid, not expired, and properly signed
 * - Associated user must exist in database
 */
export async function authenticateToken(
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    // Extract and verify JWT token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);
    const decoded = verifyToken(token);
    
    // Verify that the user still exists in the database
    // This prevents access with tokens for deleted users
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
        error: 'Authentication failed - user account may have been deleted'
      });
      return;
    }

    // Add decoded user information to request object
    // This makes user data available to all subsequent middleware and route handlers
    req.user = decoded;
    
    // Continue to next middleware/route handler
    next();
  } catch (error) {
    // Handle authentication errors with appropriate messages
    const message = error instanceof Error ? error.message : 'Authentication failed';
    
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
      error: message
    });
  }
}
