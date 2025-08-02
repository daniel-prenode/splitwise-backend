import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import protectedRoutes from './routes/protected';
import { errorHandler, notFound } from './middleware/errorHandler';
import { ApiResponse } from './types';
import { dbConnection } from './config/database';

/**
 * @fileoverview Main Express application setup and configuration
 * 
 * This is the entry point for the Splitwise backend API server. It configures
 * the Express application with all necessary middleware, routes, error handling,
 * and database connection management.
 * 
 * Application Features:
 * - RESTful API with JSON responses
 * - MongoDB database integration
 * - JWT-based authentication
 * - Comprehensive error handling
 * - Health check endpoint
 * - Request logging
 * - Graceful shutdown handling
 * - CORS support for frontend integration
 * 
 * Environment Configuration:
 * - Loads environment variables from .env file
 * - Supports development and production modes
 * - Configurable port and database settings
 * 
 * @version 1.0.0
 * @author Splitwise Development Team
 */

// Load environment variables from .env file
dotenv.config();

// Create Express application instance
const app = express();

// Server configuration
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Middleware Configuration
 * 
 * The order of middleware is important:
 * 1. CORS - Enable cross-origin requests from frontend
 * 2. Body parsing - Parse JSON and URL-encoded data
 * 3. Request logging - Log all incoming requests
 * 4. Routes - Handle API endpoints
 * 5. 404 handler - Handle undefined routes
 * 6. Error handler - Handle all errors (must be last)
 */

// Enable CORS for all origins in development, configure for production
app.use(cors({
  origin: NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : '*',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

/**
 * Request logging middleware
 * Logs all incoming HTTP requests with timestamp, method, and path
 * In production, consider using a proper logging library like Winston
 */
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * Health Check Endpoint
 * 
 * Provides system health information including server status,
 * database connectivity, and environment details. Used by:
 * - Load balancers for health monitoring
 * - Docker health checks
 * - Development debugging
 * - System monitoring tools
 * 
 * @route GET /health
 * @returns {ApiResponse} Health status and system information
 */
app.get('/health', (req, res: express.Response<ApiResponse>) => {
  const dbStatus = dbConnection.getConnectionStatus();
  
  // Return 503 Service Unavailable if database is disconnected
  const statusCode = dbStatus ? 200 : 503;
  const message = dbStatus 
    ? 'Server is running and healthy' 
    : 'Server running but database disconnected';
  
  res.status(statusCode).json({
    success: dbStatus,
    message: message,
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(), // Server uptime in seconds
      environment: NODE_ENV,
      version: '1.0.0', // Consider reading from package.json
      database: {
        connected: dbStatus,
        readyState: dbStatus ? 'connected' : 'disconnected'
      }
    }
  });
});

/**
 * API Routes Configuration
 * 
 * Routes are organized by functionality:
 * - /api/auth/* - Authentication endpoints (register, login, profile)
 * - /api/* - Protected endpoints requiring authentication
 */

// Authentication routes (public and protected)
app.use('/api/auth', authRoutes);

// Protected routes requiring JWT authentication
app.use('/api', protectedRoutes);

/**
 * Error Handling Middleware
 * 
 * Order is critical:
 * 1. 404 handler for undefined routes
 * 2. Global error handler for all other errors
 */

// Handle 404 errors for undefined routes
app.use(notFound);

// Global error handler (must be last middleware)
app.use(errorHandler);

/**
 * Server Startup and Lifecycle Management
 * 
 * Handles:
 * - Database connection establishment
 * - HTTP server startup
 * - Graceful shutdown on process signals
 * - Error handling during startup
 * 
 * The startup sequence ensures the database is connected before
 * the HTTP server begins accepting requests.
 */
const startServer = async (): Promise<void> => {
  try {
    console.log('🚀 Starting Splitwise Backend Server...');
    
    // Step 1: Connect to MongoDB database
    console.log('📊 Connecting to database...');
    await dbConnection.connect();
    
    // Step 2: Start HTTP server
    console.log('🌐 Starting HTTP server...');
    const server = app.listen(PORT, () => {
      console.log('✅ Server startup completed successfully!');
      console.log('');
      console.log('� Server Information:');
      console.log(`   🚀 Server running on port: ${PORT}`);
      console.log(`   📍 Environment: ${NODE_ENV}`);
      console.log(`   🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`   📊 Database: ${dbConnection.getConnectionStatus() ? '✅ Connected' : '❌ Disconnected'}`);
      console.log('');
      console.log('📖 API Endpoints:');
      console.log(`   POST http://localhost:${PORT}/api/auth/register`);
      console.log(`   POST http://localhost:${PORT}/api/auth/login`);
      console.log(`   GET  http://localhost:${PORT}/api/auth/profile`);
      console.log(`   GET  http://localhost:${PORT}/api/dashboard`);
      console.log(`   GET  http://localhost:${PORT}/api/users`);
      console.log('');
    });

    /**
     * Graceful Shutdown Handler
     * 
     * Handles SIGTERM and SIGINT signals to gracefully shut down the server:
     * 1. Stop accepting new connections
     * 2. Close existing connections
     * 3. Disconnect from database
     * 4. Exit process
     * 
     * @param {string} signal - The signal that triggered shutdown
     */
    const shutdown = async (signal: string): Promise<void> => {
      console.log(`\n${signal} received. Initiating graceful shutdown...`);
      
      // Close HTTP server
      server.close(async () => {
        console.log('🔌 HTTP server closed.');
        
        try {
          // Close database connection
          await dbConnection.disconnect();
          console.log('💾 Database connection closed.');
          
          console.log('✅ Graceful shutdown completed.');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during database disconnection:', error);
          process.exit(1);
        }
      });
      
      // Force shutdown after 30 seconds if graceful shutdown fails
      setTimeout(() => {
        console.error('⚠️  Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    // Register shutdown handlers
    process.on('SIGTERM', () => shutdown('SIGTERM')); // Docker/Kubernetes shutdown
    process.on('SIGINT', () => shutdown('SIGINT'));   // Ctrl+C
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('🔍 Check your configuration and try again.');
    process.exit(1);
  }
};

/**
 * Application Entry Point
 * 
 * Starts the server and handles any uncaught errors during startup.
 * In production, consider using process managers like PM2 for
 * additional reliability and monitoring.
 */
startServer().catch((error) => {
  console.error('💥 Unhandled error during server startup:', error);
  process.exit(1);
});

// Export the Express app for testing purposes
export default app;
