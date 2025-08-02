import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import protectedRoutes from './routes/protected';
import { errorHandler, notFound } from './middleware/errorHandler';
import { ApiResponse } from './types';
import { dbConnection } from './config/database';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check route
app.get('/health', (req, res: express.Response<ApiResponse>) => {
  const dbStatus = dbConnection.getConnectionStatus();
  
  res.status(dbStatus ? 200 : 503).json({
    success: dbStatus,
    message: dbStatus ? 'Server is running' : 'Server running but database disconnected',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: dbStatus,
        readyState: dbStatus ? 'connected' : 'disconnected'
      }
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api', protectedRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server with database connection
const startServer = async () => {
  try {
    // Connect to database
    await dbConnection.connect();
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 Database status: ${dbConnection.getConnectionStatus() ? '✅ Connected' : '❌ Disconnected'}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`${signal} received. Shutting down gracefully...`);
      
      server.close(async () => {
        console.log('HTTP server closed.');
        
        // Close database connection
        await dbConnection.disconnect();
        
        console.log('Process terminated');
        process.exit(0);
      });
      
      // Force close server after 30 seconds
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
