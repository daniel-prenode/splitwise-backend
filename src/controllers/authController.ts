import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import { UserModelLegacy as UserModel } from '../models/User';
import { generateToken } from '../utils/jwt';
import { UserRegistration, UserLogin, ApiResponse, AuthRequest } from '../types';

/**
 * @fileoverview Authentication controller for user registration, login, and profile management
 * 
 * This module handles all authentication-related HTTP requests including:
 * - User registration with validation
 * - User login with password verification
 * - User profile retrieval for authenticated users
 * 
 * Features:
 * - Comprehensive input validation using Joi
 * - Secure password handling with bcrypt
 * - JWT token generation for authentication
 * - Consistent error handling and responses
 * - Security best practices implementation
 */

/**
 * Joi validation schema for user registration
 * 
 * Validates:
 * - firstName: 2-50 characters, required
 * - lastName: 2-50 characters, required  
 * - email: Valid email format, required
 * - password: Minimum 6 characters, required
 */
const registerSchema = Joi.object({
  firstName: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required'
    }),
  lastName: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    })
});

/**
 * Joi validation schema for user login
 * 
 * Validates:
 * - email: Valid email format, required
 * - password: Any non-empty string, required
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

/**
 * Handles user registration requests
 * 
 * This endpoint creates a new user account with the following process:
 * 1. Validates input data using Joi schema
 * 2. Checks if email is already registered
 * 3. Creates user account (password automatically hashed by model)
 * 4. Generates JWT token for immediate login
 * 5. Returns user data and token
 * 
 * Security Features:
 * - Password hashing handled automatically by User model
 * - Email uniqueness enforcement
 * - Input validation and sanitization
 * - No password returned in response
 * 
 * @route POST /api/auth/register
 * @param {Request} req - Express request with UserRegistration data in body
 * @param {Response<ApiResponse>} res - Express response
 * @returns {Promise<void>} JSON response with user data and token
 * 
 * @example
 * Request Body:
 * ```json
 * {
 *   "firstName": "John",
 *   "lastName": "Doe", 
 *   "email": "john.doe@example.com",
 *   "password": "securePassword123"
 * }
 * ```
 * 
 * Success Response (201):
 * ```json
 * {
 *   "success": true,
 *   "message": "User registered successfully",
 *   "data": {
 *     "user": {
 *       "id": "507f1f77bcf86cd799439011",
 *       "firstName": "John",
 *       "lastName": "Doe",
 *       "email": "john.doe@example.com",
 *       "createdAt": "2024-01-01T00:00:00.000Z"
 *     },
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   }
 * }
 * ```
 * 
 * Error Responses:
 * - 400: Validation error (invalid input data)
 * - 409: Conflict (email already registered)
 * - 500: Internal server error
 */
export async function register(req: Request, res: Response<ApiResponse>): Promise<void> {
  try {
    // Validate input data against schema
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
      return;
    }

    const { firstName, lastName, email, password }: UserRegistration = value;

    // Check if user with this email already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User already exists',
        error: 'Email is already registered'
      });
      return;
    }

    // Create new user (password hashing handled in model pre-save middleware)
    const user = await UserModel.create({
      firstName,
      lastName,
      email,
      password
    });

    // Generate JWT token for immediate authentication
    const token = generateToken({
      userId: user.id,
      email: user.email
    });

    // Return success response with user data and token
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to register user'
    });
  }
}

/**
 * Handles user login requests
 * 
 * This endpoint authenticates existing users with the following process:
 * 1. Validates input data (email and password)
 * 2. Finds user by email address
 * 3. Verifies password using bcrypt comparison
 * 4. Generates JWT token for session management
 * 5. Returns user data and token
 * 
 * Security Features:
 * - Password verification using bcrypt
 * - Generic error messages to prevent user enumeration
 * - No password returned in response
 * - Rate limiting should be implemented at middleware level
 * 
 * @route POST /api/auth/login
 * @param {Request} req - Express request with UserLogin data in body
 * @param {Response<ApiResponse>} res - Express response
 * @returns {Promise<void>} JSON response with user data and token
 * 
 * @example
 * Request Body:
 * ```json
 * {
 *   "email": "john.doe@example.com",
 *   "password": "securePassword123"
 * }
 * ```
 * 
 * Success Response (200):
 * ```json
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "data": {
 *     "user": {
 *       "id": "507f1f77bcf86cd799439011",
 *       "firstName": "John",
 *       "lastName": "Doe",
 *       "email": "john.doe@example.com",
 *       "createdAt": "2024-01-01T00:00:00.000Z"
 *     },
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   }
 * }
 * ```
 * 
 * Error Responses:
 * - 400: Validation error (invalid input format)
 * - 401: Authentication failed (invalid credentials)
 * - 500: Internal server error
 */
export async function login(req: Request, res: Response<ApiResponse>): Promise<void> {
  try {
    // Validate input data against schema
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
      return;
    }

    const { email, password }: UserLogin = value;

    // Find user by email address
    const user = await UserModel.findByEmail(email);
    if (!user) {
      // Generic error message to prevent user enumeration attacks
      res.status(401).json({
        success: false,
        message: 'Authentication failed',
        error: 'Invalid email or password'
      });
      return;
    }

    // Verify password using bcrypt comparison
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // Same generic error message for consistency
      res.status(401).json({
        success: false,
        message: 'Authentication failed',
        error: 'Invalid email or password'
      });
      return;
    }

    // Generate JWT token for session management
    const token = generateToken({
      userId: user.id,
      email: user.email
    });

    // Return success response with user data and token
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to login'
    });
  }
}

/**
 * Retrieves authenticated user's profile information
 * 
 * This endpoint returns the current user's profile data. It requires
 * authentication via JWT token and can only access the requesting user's
 * own profile information.
 * 
 * Authentication Requirements:
 * - Valid JWT token in Authorization header
 * - User account must still exist in database
 * - Token must not be expired
 * 
 * @route GET /api/auth/profile
 * @middleware authenticateToken - Validates JWT and populates req.user
 * @param {AuthRequest} req - Express request with authenticated user data
 * @param {Response<ApiResponse>} res - Express response
 * @returns {Promise<void>} JSON response with user profile data
 * 
 * @example
 * Request Headers:
 * ```
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * ```
 * 
 * Success Response (200):
 * ```json
 * {
 *   "success": true,
 *   "message": "Profile retrieved successfully",
 *   "data": {
 *     "user": {
 *       "id": "507f1f77bcf86cd799439011",
 *       "firstName": "John",
 *       "lastName": "Doe",
 *       "email": "john.doe@example.com",
 *       "createdAt": "2024-01-01T00:00:00.000Z"
 *     }
 *   }
 * }
 * ```
 * 
 * Error Responses:
 * - 401: Unauthorized (missing/invalid token)
 * - 404: User not found (account deleted after token issued)
 * - 500: Internal server error
 */
export async function getProfile(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  try {
    // Check if user was populated by authentication middleware
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
        error: 'User not authenticated'
      });
      return;
    }

    // Fetch complete user data from database
    const user = await UserModel.findById(req.user.userId);
    if (!user) {
      // User may have been deleted after token was issued
      res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'User account does not exist'
      });
      return;
    }

    // Return user profile data (password excluded by model)
    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to retrieve profile'
    });
  }
}
