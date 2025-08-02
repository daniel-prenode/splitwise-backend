# Splitwise Backend Development Guide

## Overview

This guide provides comprehensive documentation for developing and maintaining the Splitwise backend API. It covers architecture, best practices, and development workflows.

## Architecture Overview

### Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Validation**: Joi
- **Environment**: dotenv

### Project Structure

```
src/
├── config/
│   └── database.ts          # Database connection and configuration
├── controllers/
│   └── authController.ts    # Authentication business logic
├── middleware/
│   ├── auth.ts             # JWT authentication middleware
│   └── errorHandler.ts     # Global error handling
├── models/
│   └── User.ts             # User data model and schema
├── routes/
│   ├── auth.ts             # Authentication routes
│   └── protected.ts        # Protected API routes
├── types/
│   └── index.ts            # TypeScript type definitions
├── utils/
│   └── jwt.ts              # JWT utility functions
└── app.ts                  # Main application entry point
```

### Design Patterns

1. **Singleton Pattern**: Database connection management
2. **Middleware Pattern**: Express middleware for cross-cutting concerns
3. **Repository Pattern**: Data access abstraction (via Mongoose)
4. **Factory Pattern**: JWT token generation and validation

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Git
- VS Code (recommended)

### Local Development

1. **Clone and Setup**

   ```bash
   cd splitwise-backend
   npm install
   ```

2. **Environment Configuration**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

### Docker Development

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f backend

# Rebuild after changes
docker-compose build backend
```

## Code Organization

### Controllers

Controllers handle HTTP request/response logic and coordinate between services:

```typescript
// Example controller structure
export const controllerFunction = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    // 1. Validate input
    const { error, value } = schema.validate(req.body);

    // 2. Business logic
    const result = await service.performOperation(value);

    // 3. Send response
    res.status(200).json({
      success: true,
      message: 'Operation successful',
      data: result,
    });
  } catch (error) {
    // Error handling
    res.status(500).json({
      success: false,
      message: 'Operation failed',
      error: error.message,
    });
  }
};
```

### Middleware

Middleware functions provide cross-cutting functionality:

```typescript
// Example middleware structure
export const middleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Perform middleware logic

    // Continue to next middleware/route
    next();
  } catch (error) {
    // Pass error to error handler
    next(error);
  }
};
```

### Models

Models define data structure and business rules:

```typescript
// Example model structure
const schema = new Schema({
  field: {
    type: String,
    required: [true, 'Field is required'],
    validate: {
      validator: (value: string) => validation,
      message: 'Validation failed',
    },
  },
});

// Pre-save middleware
schema.pre('save', async function (next) {
  // Pre-processing logic
  next();
});

// Instance methods
schema.methods.methodName = function () {
  // Instance method logic
};

// Static methods
schema.statics.staticMethod = function () {
  // Static method logic
};
```

## Best Practices

### Code Style

1. **TypeScript Strict Mode**: Always use strict TypeScript configuration
2. **Explicit Types**: Avoid `any`, use specific types
3. **Async/Await**: Prefer async/await over Promises
4. **Error Handling**: Always handle errors explicitly
5. **Validation**: Validate all inputs at boundaries

### Security

1. **Input Validation**: Validate and sanitize all inputs
2. **Authentication**: Verify JWT tokens on protected routes
3. **Password Security**: Use bcrypt with appropriate salt rounds
4. **Environment Variables**: Never commit secrets to version control
5. **Error Messages**: Don't leak sensitive information in error messages

### Database

1. **Indexes**: Create indexes for frequently queried fields
2. **Validation**: Use Mongoose schema validation
3. **Transactions**: Use transactions for multi-document operations
4. **Connection Management**: Use connection pooling
5. **Data Consistency**: Ensure referential integrity

### API Design

1. **RESTful Routes**: Follow REST conventions
2. **Consistent Responses**: Use standard ApiResponse format
3. **HTTP Status Codes**: Use appropriate status codes
4. **Versioning**: Plan for API versioning
5. **Documentation**: Document all endpoints

## Testing Strategy

### Unit Tests

Test individual functions and components:

```typescript
// Example unit test
describe('JWT Utils', () => {
  test('should generate valid token', () => {
    const payload = { userId: '123', email: 'test@example.com' };
    const token = generateToken(payload);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });
});
```

### Integration Tests

Test API endpoints end-to-end:

```typescript
// Example integration test
describe('Auth Endpoints', () => {
  test('POST /api/auth/register should create user', async () => {
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(userData.email);
  });
});
```

### Test Data Management

```typescript
// Setup test database
beforeEach(async () => {
  await mongoose.connection.dropDatabase();
  // Seed test data
});

afterEach(async () => {
  await mongoose.connection.dropDatabase();
});
```

## Debugging

### Logging

Use structured logging for better debugging:

```typescript
// Good logging practice
console.log('User registration attempt', {
  email: user.email,
  timestamp: new Date().toISOString(),
  ip: req.ip,
});

// Avoid logging sensitive data
console.log('Login successful', {
  userId: user.id,
  email: user.email,
  // Don't log passwords!
});
```

### Error Handling

Implement comprehensive error handling:

```typescript
// Specific error types
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Error handling in controllers
try {
  // Operation
} catch (error) {
  if (error instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: error.message,
    });
  }

  // Fallback error handling
  console.error('Unexpected error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}
```

### Development Tools

1. **Nodemon**: Auto-restart on file changes
2. **MongoDB Compass**: Database GUI
3. **Postman**: API testing
4. **VS Code Extensions**:
   - TypeScript and JavaScript Language Features
   - MongoDB for VS Code
   - REST Client
   - GitLens

## Performance Optimization

### Database Optimization

1. **Indexes**: Create appropriate indexes
2. **Query Optimization**: Use efficient queries
3. **Connection Pooling**: Configure optimal pool size
4. **Aggregation**: Use MongoDB aggregation for complex queries

### Application Optimization

1. **Middleware Order**: Optimize middleware execution order
2. **Caching**: Implement caching for frequently accessed data
3. **Compression**: Use gzip compression for responses
4. **Rate Limiting**: Implement rate limiting for API protection

## Deployment

### Environment Configuration

```bash
# Production environment variables
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/splitwise-prod
JWT_SECRET=very-strong-production-secret-256-bits-minimum
BCRYPT_ROUNDS=12
```

### Docker Deployment

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/app.js"]
```

### Health Monitoring

1. **Health Endpoints**: Implement comprehensive health checks
2. **Logging**: Use structured logging for monitoring
3. **Metrics**: Track key performance indicators
4. **Alerting**: Set up alerts for critical issues

## Contributing

### Git Workflow

1. **Branching**: Use feature branches for development
2. **Commits**: Write descriptive commit messages
3. **Pull Requests**: Use PR reviews for code quality
4. **Testing**: Ensure all tests pass before merging

### Code Review Checklist

- [ ] Code follows TypeScript best practices
- [ ] All inputs are validated
- [ ] Error handling is comprehensive
- [ ] Security considerations are addressed
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] Performance implications are considered

### Release Process

1. **Version Bump**: Update version in package.json
2. **Changelog**: Update CHANGELOG.md
3. **Testing**: Run full test suite
4. **Build**: Create production build
5. **Deploy**: Deploy to staging, then production
6. **Monitoring**: Monitor deployment for issues

## Future Development

### Planned Features

1. **Expense Management**: Core splitwise functionality
2. **Group Management**: User groups and permissions
3. **Real-time Updates**: WebSocket integration
4. **File Uploads**: Receipt and image handling
5. **Notifications**: Email and push notifications
6. **Mobile API**: Mobile-specific optimizations
7. **Analytics**: Reporting and insights

### Technical Debt

1. **Testing**: Increase test coverage to 90%+
2. **Documentation**: Auto-generate API documentation
3. **Monitoring**: Implement comprehensive monitoring
4. **Security**: Security audit and penetration testing
5. **Performance**: Load testing and optimization

## Troubleshooting

### Common Issues

1. **Database Connection**: Check MongoDB URI and network connectivity
2. **Authentication Failures**: Verify JWT secret and token format
3. **Validation Errors**: Check Joi schema definitions
4. **CORS Issues**: Configure CORS settings for frontend domain
5. **Environment Variables**: Ensure all required variables are set

### Debug Commands

```bash
# Check database connection
npm run test:db

# Run specific tests
npm test -- --grep "authentication"

# Check for TypeScript errors
npm run type-check

# Lint code
npm run lint

# View logs in production
docker logs splitwise-backend
```
