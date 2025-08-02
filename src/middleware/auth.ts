import { Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { UserModel } from '../models/User';

export const authenticateToken = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    const decoded = verifyToken(token);
    
    // Verify user still exists
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
        error: 'Authentication failed'
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
      error: message
    });
  }
};
