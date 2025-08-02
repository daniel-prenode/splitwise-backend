import jwt, { SignOptions } from 'jsonwebtoken';
import { JwtPayload } from '../types';

/**
 * @fileoverview JWT (JSON Web Token) utilities for authentication
 * 
 * This module provides utility functions for creating, verifying, and extracting
 * JWT tokens used for user authentication in the Splitwise application.
 * 
 * Features:
 * - Token generation with configurable expiration
 * - Token verification with proper error handling
 * - Authorization header parsing
 * - Environment-based configuration
 * 
 * Security considerations:
 * - Uses strong secret keys (should be 256+ bits in production)
 * - Tokens expire after 24 hours by default
 * - Proper error handling prevents information leakage
 */

/** JWT secret key from environment or fallback (should be changed in production) */
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

/** JWT token expiration time from environment or default to 24 hours */
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Generates a JWT token for an authenticated user
 * 
 * Creates a signed JWT token containing user identification information
 * that can be used for subsequent API requests. The token includes
 * user ID and email, and expires after the configured time period.
 * 
 * @param {JwtPayload} payload - User data to encode in the token
 * @returns {string} Signed JWT token
 * 
 * @example
 * ```typescript
 * const payload: JwtPayload = {
 *   userId: '507f1f77bcf86cd799439011',
 *   email: 'user@example.com'
 * };
 * 
 * const token = generateToken(payload);
 * // Returns: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * 
 * // Send to client
 * res.json({
 *   success: true,
 *   message: 'Login successful',
 *   data: { token, user: payload }
 * });
 * ```
 */
export function generateToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: 12 * 60 * 60, // 12 hours in seconds
    issuer: 'splitwise-api',
    audience: 'splitwise-client'
  };
  
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Verifies and decodes a JWT token
 * 
 * Validates the token signature and expiration, then returns the
 * decoded payload. Throws an error if the token is invalid,
 * expired, or malformed.
 * 
 * @param {string} token - JWT token to verify
 * @returns {JwtPayload} Decoded token payload
 * @throws {Error} If token is invalid, expired, or malformed
 * 
 * @example
 * ```typescript
 * try {
 *   const payload = verifyToken(token);
 *   console.log(`User ${payload.email} is authenticated`);
 *   
 *   // Use payload.userId for database queries
 *   const user = await UserModel.findById(payload.userId);
 * } catch (error) {
 *   console.error('Token verification failed:', error.message);
 *   // Handle authentication failure
 * }
 * ```
 */
export function verifyToken(token: string): JwtPayload {
  try {
    const options = {
      issuer: 'splitwise-api',
      audience: 'splitwise-client'
    };
    
    return jwt.verify(token, JWT_SECRET, options) as JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token format');
    } else {
      throw new Error('Token verification failed');
    }
  }
}

/**
 * Extracts JWT token from Authorization header
 * 
 * Parses the Authorization header to extract the Bearer token.
 * Validates the header format and returns the token string.
 * 
 * Expected header format: "Bearer <token>"
 * 
 * @param {string | undefined} authHeader - Authorization header value
 * @returns {string} Extracted JWT token
 * @throws {Error} If header is missing or has invalid format
 * 
 * @example
 * ```typescript
 * // In Express middleware
 * app.use('/api/protected', (req, res, next) => {
 *   try {
 *     const token = extractTokenFromHeader(req.headers.authorization);
 *     const payload = verifyToken(token);
 *     req.user = payload;
 *     next();
 *   } catch (error) {
 *     res.status(401).json({
 *       success: false,
 *       message: 'Authentication required',
 *       error: error.message
 *     });
 *   }
 * });
 * ```
 */
export function extractTokenFromHeader(authHeader: string | undefined): string {
  if (!authHeader) {
    throw new Error('Authorization header is required');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new Error('Invalid authorization header format. Expected: Bearer <token>');
  }

  if (!parts[1] || parts[1].trim() === '') {
    throw new Error('Token is missing from authorization header');
  }

  return parts[1];
}
