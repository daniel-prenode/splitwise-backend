import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

/**
 * @fileoverview Authentication routes for user management
 * 
 * This module defines all authentication-related routes including:
 * - User registration (public)
 * - User login (public)  
 * - User profile retrieval (protected)
 * 
 * Route Structure:
 * - Base path: /api/auth
 * - Public routes: No authentication required
 * - Protected routes: JWT authentication required
 * 
 * Security Features:
 * - Input validation handled in controllers
 * - JWT authentication middleware for protected routes
 * - Consistent error handling across all endpoints
 * 
 * @example
 * ```typescript
 * // In app.ts
 * app.use('/api/auth', authRoutes);
 * 
 * // Available endpoints:
 * // POST /api/auth/register - Create new user account
 * // POST /api/auth/login - Authenticate existing user
 * // GET /api/auth/profile - Get authenticated user's profile
 * ```
 */

const router = Router();

/**
 * @route POST /api/auth/register
 * @description Register a new user account
 * @access Public
 * @body {UserRegistration} firstName, lastName, email, password
 * @returns {ApiResponse} User data and JWT token
 * 
 * @example
 * ```bash
 * curl -X POST http://localhost:3000/api/auth/register \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "firstName": "John",
 *     "lastName": "Doe",
 *     "email": "john.doe@example.com", 
 *     "password": "securePassword123"
 *   }'
 * ```
 */
router.post('/register', register);

/**
 * @route POST /api/auth/login
 * @description Authenticate user and generate session token
 * @access Public
 * @body {UserLogin} email, password
 * @returns {ApiResponse} User data and JWT token
 * 
 * @example
 * ```bash
 * curl -X POST http://localhost:3000/api/auth/login \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "email": "john.doe@example.com",
 *     "password": "securePassword123"
 *   }'
 * ```
 */
router.post('/login', login);

/**
 * @route GET /api/auth/profile
 * @description Get authenticated user's profile information
 * @access Protected (JWT required)
 * @middleware authenticateToken - Validates JWT and populates req.user
 * @returns {ApiResponse} User profile data
 * 
 * @example
 * ```bash
 * curl -X GET http://localhost:3000/api/auth/profile \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * ```
 */
router.get('/profile', authenticateToken, getProfile);

export default router;
