# Splitwise Backend

A robust TypeScript Express.js backend for the Splitwise application with MongoDB integration, JWT authentication, and comprehensive error handling.

## 🚀 Features

- **TypeScript** - Full type safety and modern JavaScript features
- **Express.js** - Fast, unopinionated, minimalist web framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt for secure password storage
- **Input Validation** - Joi schema validation
- **Error Handling** - Comprehensive error handling middleware
- **CORS** - Cross-Origin Resource Sharing support
- **Rate Limiting** - Built-in rate limiting for security
- **Health Checks** - Database and server health monitoring
- **Graceful Shutdown** - Proper cleanup on application termination

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (v5.0 or higher)

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd splitwise-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up MongoDB**

   ```bash
   npm run setup:db
   ```

   Or manually:

   - Install MongoDB: `brew install mongodb-community` (macOS)
   - Start MongoDB: `brew services start mongodb/brew/mongodb-community`
   - Or using Docker: `docker run -d -p 27017:27017 --name splitwise-mongo mongo:latest`

4. **Configure environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔧 Environment Variables

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/splitwise-dev

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:4200

# Security
BCRYPT_ROUNDS=12
```

## 📡 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### Health Check

- `GET /health` - Server and database health status

## 🏗️ Project Structure

```
src/
├── config/          # Configuration files
│   └── database.ts  # MongoDB connection setup
├── controllers/     # Route controllers
│   └── authController.ts
├── middleware/      # Custom middleware
│   ├── auth.ts      # JWT authentication
│   └── errorHandler.ts
├── models/          # Mongoose models
│   └── User.ts      # User model and schema
├── routes/          # Express routes
│   ├── auth.ts      # Authentication routes
│   └── protected.ts # Protected routes
├── types/           # TypeScript type definitions
│   └── index.ts
├── utils/           # Utility functions
│   └── jwt.ts       # JWT utilities
└── app.ts           # Express app setup
```

## 🔒 Security Features

- **Password Hashing** - bcrypt with configurable salt rounds
- **JWT Tokens** - Secure token-based authentication
- **Input Validation** - Joi schema validation for all inputs
- **Rate Limiting** - Protection against brute force attacks
- **CORS** - Configurable cross-origin request handling
- **Helmet** - Security headers middleware
- **Environment Variables** - Sensitive data protection

## 🗄️ Database Schema

### User Schema

```typescript
{
  _id: ObjectId,
  email: string (unique, indexed),
  password: string (hashed),
  name: string,
  createdAt: Date,
  updatedAt: Date
}
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run with coverage
npm run test:coverage
```

## 🚢 Production Deployment

1. **Build the application**

   ```bash
   npm run build
   ```

2. **Set production environment variables**

   ```bash
   NODE_ENV=production
   MONGODB_URI=mongodb://your-production-db-url
   JWT_SECRET=your-production-jwt-secret
   ```

3. **Start the production server**
   ```bash
   npm start
   ```

## 📊 Monitoring

- Health check endpoint: `GET /health`
- Database connection status included in health checks
- Graceful shutdown handling
- Process uptime monitoring

## 🛠️ Development Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm run setup:db     # Set up MongoDB databases and indexes
npm run clean        # Clean build directory
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
