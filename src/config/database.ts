import mongoose from 'mongoose';

/**
 * Configuration interface for MongoDB database connection
 * @interface DatabaseConfig
 */
interface DatabaseConfig {
  /** MongoDB connection URI */
  uri: string;
  /** Mongoose connection options for optimization and reliability */
  options: mongoose.ConnectOptions;
}

/**
 * Singleton class for managing MongoDB database connections
 * Implements the singleton pattern to ensure only one database connection exists
 * throughout the application lifecycle.
 * 
 * Features:
 * - Connection pooling for optimal performance
 * - Automatic reconnection and retry logic
 * - Graceful shutdown handling
 * - Connection status monitoring
 * - Masked URI logging for security
 * 
 * @class DatabaseConnection
 * @example
 * ```typescript
 * import { dbConnection } from './config/database';
 * 
 * // Connect to database
 * await dbConnection.connect();
 * 
 * // Check connection status
 * const isConnected = dbConnection.getConnectionStatus();
 * 
 * // Disconnect (usually handled automatically)
 * await dbConnection.disconnect();
 * ```
 */
class DatabaseConnection {
  /** Singleton instance */
  private static instance: DatabaseConnection;
  /** Current connection state */
  private isConnected: boolean = false;

  /**
   * Private constructor to enforce singleton pattern
   * @private
   */
  private constructor() {}

  /**
   * Gets the singleton instance of DatabaseConnection
   * @returns {DatabaseConnection} The singleton instance
   */
  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * Establishes connection to MongoDB database
   * - Checks if already connected to avoid duplicate connections
   * - Uses optimized connection options for production use
   * - Sets up event handlers for connection monitoring
   * - Exits process on connection failure
   * 
   * @async
   * @returns {Promise<void>} Resolves when connection is established
   * @throws {Error} Exits process if connection fails
   * 
   * @example
   * ```typescript
   * try {
   *   await dbConnection.connect();
   *   console.log('Database connected successfully');
   * } catch (error) {
   *   // Process will exit automatically on connection failure
   * }
   * ```
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('Database already connected');
      return;
    }

    const config = this.getConfig();

    try {
      await mongoose.connect(config.uri, config.options);
      this.isConnected = true;
      
      console.log(`✅ MongoDB connected successfully to: ${this.getMaskedUri(config.uri)}`);
      
      // Setup connection event handlers
      this.setupEventHandlers();
      
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      process.exit(1);
    }
  }

  /**
   * Gracefully disconnects from MongoDB database
   * - Only disconnects if currently connected
   * - Handles errors during disconnection
   * - Updates internal connection state
   * 
   * @async
   * @returns {Promise<void>} Resolves when disconnection is complete
   * 
   * @example
   * ```typescript
   * await dbConnection.disconnect();
   * console.log('Database disconnected');
   * ```
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('🔌 MongoDB disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
    }
  }

  /**
   * Generates database configuration with optimized connection options
   * - Uses environment variable for URI with fallback to local development
   * - Configures connection pooling for optimal performance
   * - Sets timeouts for reliable connection handling
   * - Enables retry logic for improved reliability
   * 
   * @private
   * @returns {DatabaseConfig} Database configuration object
   */
  private getConfig(): DatabaseConfig {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/splitwise-dev';
    
    const options: mongoose.ConnectOptions = {
      // Connection pool settings
      maxPoolSize: 10,        // Maximum number of connections in pool
      minPoolSize: 5,         // Minimum number of connections in pool
      maxIdleTimeMS: 30000,   // Close connections after 30s of inactivity
      serverSelectionTimeoutMS: 5000,  // How long to try selecting a server
      socketTimeoutMS: 45000, // How long a socket stays open during inactivity
      
      // Retry settings
      retryWrites: true,      // Retry write operations on transient errors
      retryReads: true,       // Retry read operations on transient errors
    };

    return { uri, options };
  }

  /**
   * Sets up event handlers for MongoDB connection monitoring
   * - Logs connection state changes
   * - Handles graceful shutdown on process termination
   * - Updates internal connection state on disconnection
   * - Provides process-level error handling
   * 
   * @private
   */
  private setupEventHandlers(): void {
    mongoose.connection.on('connected', () => {
      console.log('🔗 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (error: any) => {
      console.error('❌ Mongoose connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    // Graceful shutdown handlers
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  /**
   * Masks sensitive information in MongoDB URI for secure logging
   * - Replaces password with asterisks in connection string
   * - Preserves URI structure while hiding credentials
   * 
   * @private
   * @param {string} uri - The MongoDB connection URI
   * @returns {string} URI with masked password
   * 
   * @example
   * Input:  "mongodb://user:password123@host:27017/db"
   * Output: "mongodb://user:****@host:27017/db"
   */
  private getMaskedUri(uri: string): string {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  }

  /**
   * Gets the current database connection status
   * - Checks both internal state and mongoose connection state
   * - Returns true only if fully connected and ready
   * 
   * @returns {boolean} True if database is connected and ready
   * 
   * @example
   * ```typescript
   * if (dbConnection.getConnectionStatus()) {
   *   // Safe to perform database operations
   *   const users = await UserModel.find();
   * }
   * ```
   */
  getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

/**
 * Singleton instance of the database connection
 * 
 * This is the main export that should be used throughout the application
 * for all database connection operations.
 * 
 * @example
 * ```typescript
 * import { dbConnection } from './config/database';
 * 
 * // In app.ts or main server file
 * await dbConnection.connect();
 * 
 * // In routes or services
 * if (dbConnection.getConnectionStatus()) {
 *   // Perform database operations
 * }
 * ```
 */
export const dbConnection = DatabaseConnection.getInstance();
