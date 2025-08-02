# Splitwise Backend API Documentation

## Overview

The Splitwise Backend is a RESTful API built with Express.js, TypeScript, and MongoDB. It provides authentication services and user management for the Splitwise expense-sharing application.

## Base URL

```
http://localhost:3000
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header for protected endpoints:

```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Health Check

#### GET /health

Check server and database status.

**Response:**

```json
{
  "success": true,
  "message": "Server is running and healthy",
  "data": {
    "timestamp": "2024-01-01T12:00:00.000Z",
    "uptime": 3600,
    "environment": "development",
    "version": "1.0.0",
    "database": {
      "connected": true,
      "readyState": "connected"
    }
  }
}
```

### Authentication Endpoints

#### POST /api/auth/register

Register a new user account.

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

**Validation Rules:**

- `firstName`: 2-50 characters, required
- `lastName`: 2-50 characters, required
- `email`: Valid email format, required, must be unique
- `password`: Minimum 6 characters, required

**Success Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

- `400`: Validation error
- `409`: Email already registered
- `500`: Internal server error

#### POST /api/auth/login

Authenticate an existing user.

**Request Body:**

```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

- `400`: Validation error
- `401`: Invalid credentials
- `500`: Internal server error

#### GET /api/auth/profile

Get authenticated user's profile information.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**

- `401`: Unauthorized (missing/invalid token)
- `404`: User not found
- `500`: Internal server error

### Protected Endpoints

#### GET /api/users

Get list of all users (admin functionality).

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "id": "507f1f77bcf86cd799439011",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### GET /api/dashboard

Get dashboard data for authenticated user.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Welcome to your dashboard",
  "data": {
    "user": {
      "userId": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com"
    },
    "message": "Hello john.doe@example.com, you have successfully accessed a protected route!",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or failed
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `500 Internal Server Error`: Server error

## Rate Limiting

Currently no rate limiting is implemented. In production, consider adding:

- Authentication rate limiting (login attempts)
- General API rate limiting
- DDoS protection

## Security Features

1. **Password Hashing**: Passwords are hashed using bcrypt with 12 salt rounds
2. **JWT Authentication**: Tokens expire after 24 hours
3. **Input Validation**: All inputs validated using Joi schemas
4. **CORS Configuration**: Configurable cross-origin resource sharing
5. **Error Message Filtering**: Production mode hides detailed error messages

## Environment Variables

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/splitwise-dev

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12
```

## Development Tools

### Using cURL

```bash
# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "securePassword123"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "securePassword123"
  }'

# Get profile (replace TOKEN with actual JWT)
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer TOKEN"
```

### Using Postman

1. Import the API endpoints
2. Set up environment variables for base URL and token
3. Use the register endpoint to create a user
4. Copy the token from the response
5. Use the token in the Authorization header for protected endpoints

## Database Schema

### User Collection

```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  firstName: String (required, 2-50 chars),
  lastName: String (required, 2-50 chars),
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

- `email`: Unique index for fast user lookups
- `createdAt`: Descending index for sorting

## Future Enhancements

1. **Password Reset**: Email-based password reset functionality
2. **Email Verification**: Email confirmation for new accounts
3. **Role-Based Access**: Admin and user roles
4. **Expense Management**: Core splitwise functionality
5. **Group Management**: User groups for expense sharing
6. **Social Features**: Friend requests and invitations
7. **Notifications**: Real-time notifications
8. **File Uploads**: Receipt and image handling
9. **Analytics**: Expense reporting and analytics
10. **Mobile API**: Mobile-specific endpoints
