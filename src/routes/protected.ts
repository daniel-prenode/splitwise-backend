import { Router, Response } from 'express';
import { UserModelLegacy as UserModel } from '../models/User';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest, ApiResponse } from '../types';

const router = Router();

// Example protected route - Get all users (admin-like functionality)
router.get('/users', authenticateToken, async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
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

// Example protected route - Dashboard
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
