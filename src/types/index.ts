import { Request } from 'express';

/**
 * @fileoverview TypeScript type definitions for the Splitwise backend application
 * 
 * This module contains all the TypeScript interfaces and types used throughout
 * the backend application for type safety and better developer experience.
 */

/**
 * Represents a complete user object in the system
 * 
 * @interface User
 * @property {string} id - Unique identifier for the user (MongoDB ObjectId as string)
 * @property {string} email - User's email address (unique, used for authentication)
 * @property {string} password - Hashed password (should be excluded from API responses)
 * @property {string} firstName - User's first name
 * @property {string} lastName - User's last name
 * @property {Date} createdAt - Timestamp when the user account was created
 * 
 * @example
 * ```typescript
 * const user: User = {
 *   id: '507f1f77bcf86cd799439011',
 *   email: 'john.doe@example.com',
 *   password: '$2b$12$hashedPassword...',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   createdAt: new Date('2024-01-01T00:00:00Z')
 * };
 * ```
 */
export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
}

/**
 * Data structure for user registration requests
 * 
 * @interface UserRegistration
 * @property {string} email - User's email address (must be unique and valid format)
 * @property {string} password - Plain text password (will be hashed before storage)
 * @property {string} firstName - User's first name (2-50 characters)
 * @property {string} lastName - User's last name (2-50 characters)
 * 
 * @example
 * ```typescript
 * const registrationData: UserRegistration = {
 *   email: 'jane.doe@example.com',
 *   password: 'securePassword123',
 *   firstName: 'Jane',
 *   lastName: 'Doe'
 * };
 * ```
 */
export interface UserRegistration {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Data structure for user login requests
 * 
 * @interface UserLogin
 * @property {string} email - User's registered email address
 * @property {string} password - Plain text password for verification
 * 
 * @example
 * ```typescript
 * const loginData: UserLogin = {
 *   email: 'user@example.com',
 *   password: 'userPassword123'
 * };
 * ```
 */
export interface UserLogin {
  email: string;
  password: string;
}

/**
 * JWT token payload structure
 * 
 * Contains the claims/data encoded in the JWT token for authentication
 * and authorization purposes.
 * 
 * @interface JwtPayload
 * @property {string} userId - Unique identifier of the authenticated user
 * @property {string} email - Email address of the authenticated user
 * 
 * @example
 * ```typescript
 * const payload: JwtPayload = {
 *   userId: '507f1f77bcf86cd799439011',
 *   email: 'user@example.com'
 * };
 * ```
 */
export interface JwtPayload {
  userId: string;
  email: string;
}

/**
 * Extended Express Request interface with authentication data
 * 
 * Extends the standard Express Request object to include authenticated
 * user information populated by the authentication middleware.
 * 
 * @interface AuthRequest
 * @extends {Request}
 * @property {JwtPayload} [user] - Authenticated user data (optional, populated by auth middleware)
 * 
 * @example
 * ```typescript
 * app.get('/protected', authMiddleware, (req: AuthRequest, res: Response) => {
 *   const userId = req.user?.userId; // TypeScript knows this exists
 *   const userEmail = req.user?.email;
 * });
 * ```
 */
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * Standard API response structure for consistent response formatting
 * 
 * All API endpoints should return responses in this format for consistency
 * and easier frontend integration.
 * 
 * @template T - Type of the data payload
 * @interface ApiResponse
 * @property {boolean} success - Indicates if the operation was successful
 * @property {string} message - Human-readable message describing the result
 * @property {T} [data] - Optional payload data (present on successful operations)
 * @property {string} [error] - Optional error message (present on failed operations)
 * 
 * @example
 * ```typescript
 * // Success response
 * const successResponse: ApiResponse<User> = {
 *   success: true,
 *   message: 'User created successfully',
 *   data: { id: '123', email: 'user@example.com', ... }
 * };
 * 
 * // Error response
 * const errorResponse: ApiResponse = {
 *   success: false,
 *   message: 'Registration failed',
 *   error: 'Email already exists'
 * };
 * ```
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
