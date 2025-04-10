# User API Documentation

This document describes the available endpoints for managing users in the API.

## Base URL

All endpoints are relative to: `{{baseUrl}}/users`

## Authentication

Most endpoints require JWT authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Login
- **Method**: POST
- **URL**: `/login`
- **Auth Required**: No
- **Roles Required**: None
- **Request Body**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Response**: 
  ```json
  {
    "token": "string"
  }
  ```
- **Error Responses**:
  - 401: "Invalid credentials"

### Logout
- **Method**: POST
- **URL**: `/logout`
- **Auth Required**: Yes
- **Roles Required**: None
- **Response**: 200 OK
- **Description**: Invalidates the current JWT token

### Register User
- **Method**: POST
- **URL**: `/register`
- **Auth Required**: Yes
- **Roles Required**: ADMIN, PI
- **Request Body**:
  ```json
  {
    "name": "string",
    "email": "string (valid email)",
    "username": "string (min 8 chars)",
    "password": "string (min 8 chars)",
    "role": "string (must be a valid role)"
  }
  ```
- **Response**: Created user object (without password)
- **Error Responses**:
  - 412: "Username or email already exists"
  - 412: "Password must be at least 8 characters long"
  - 412: "Username must be at least 8 characters long"
  - 412: "Invalid role. Valid roles are: [list of valid roles]"

### Get All Users
- **Method**: GET
- **URL**: `/`
- **Auth Required**: Yes
- **Roles Required**: None
- **Response**: 
  ```json
  [
    {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "username": "string",
      "roles": ["string"],
      "organization": {...}
    }
  ]
  ```

### Get One User
- **Method**: GET
- **URL**: `/:username`
- **Auth Required**: Yes
- **Roles Required**: None
- **Parameters**: 
  - `username`: Username or email of the user
- **Response**: 
  ```json
  {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "username": "string",
    "roles": ["string"],
    "organization": {...}
  }
  ```
- **Error Responses**:
  - 404: "User not found"

### Delete All Users
- **Method**: DELETE
- **URL**: `/`
- **Auth Required**: Yes
- **Roles Required**: ADMIN
- **Response**: 204 No Content 