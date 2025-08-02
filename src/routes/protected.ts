import { Router, Response } from 'express';
import { UserModelLegacy as UserModel } from '../models/User';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest, ApiResponse } from '../types';

/**
 * @fileoverview Protected routes requiring authentication
 * 
 * This module defines routes that require JWT authentication. All routes
 * in this module use the authenticateToken middleware to ensure only
 * authenticated users can access these endpoints.
 * 
 * Route Structure:
 * - Base path: /api
 * - All routes require JWT authentication
 * - Routes demonstrate various protected functionality
 * 
 * Security Features:
 * - JWT authentication required for all routes
 * - User existence verification in middleware
 * - Consistent error handling
 * - Request enrichment with user data
 * 
 * @example
 * ```typescript
 * // In app.ts
 * app.use('/api', protectedRoutes);
 * 
 * // Available endpoints:
 * // GET /api/users - List all users (admin functionality)
 * // GET /api/dashboard - User dashboard data
 * ```
 */

const router = Router();

/**
 * @route GET /api/users
 * @description Get list of all users (admin-like functionality)
 * @access Protected (JWT required)
 * @middleware authenticateToken - Validates JWT and populates req.user
 * @returns {ApiResponse} Array of all users (passwords excluded)
 * 
 * Note: In a production application, this endpoint should have additional
 * authorization checks to ensure only admin users can access it.
 * 
 * @example
 * ```bash
 * curl -X GET http://localhost:3000/api/users \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * ```
 * 
 * Success Response:
 * ```json
 * {
 *   "success": true,
 *   "message": "Users retrieved successfully",
 *   "data": {
 *     "users": [
 *       {
 *         "id": "507f1f77bcf86cd799439011",
 *         "firstName": "John",
 *         "lastName": "Doe", 
 *         "email": "john.doe@example.com",
 *         "createdAt": "2024-01-01T00:00:00.000Z"
 *       }
 *     ]
 *   }
 * }
 * ```
 */
router.get('/users', authenticateToken, async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    // Retrieve all users from database (passwords automatically excluded)
    const users = await UserModel.getAllUsers();
    
    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: { users }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to retrieve users'
    });
  }
});

/**
 * @route GET /api/dashboard  
 * @description Get dashboard data for authenticated user
 * @access Protected (JWT required)
 * @middleware authenticateToken - Validates JWT and populates req.user
 * @returns {ApiResponse} Dashboard data with user info and welcome message
 * 
 * This is a demo endpoint showing how to access authenticated user data
 * in protected routes. The req.user object is populated by the
 * authenticateToken middleware.
 * 
 * @example
 * ```bash
 * curl -X GET http://localhost:3000/api/dashboard \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * ```
 * 
 * Success Response:
 * ```json
 * {
 *   "success": true,
 *   "message": "Welcome to your dashboard",
 *   "data": {
 *     "user": {
 *       "userId": "507f1f77bcf86cd799439011",
 *       "email": "john.doe@example.com"
 *     },
 *     "message": "Hello john.doe@example.com, you have successfully accessed a protected route!",
 *     "timestamp": "2024-01-01T12:00:00.000Z"
 *   }
 * }
 * ```
 */
router.get('/dashboard', authenticateToken, async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      message: 'Welcome to your dashboard',
      data: {
        user: req.user,
        message: `Hello ${req.user?.email}, you have successfully accessed a protected route!`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to load dashboard'
    });
  }
});

export default router;
