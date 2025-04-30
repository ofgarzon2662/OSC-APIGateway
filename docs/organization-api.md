# Organization API Documentation

This document describes the available endpoints for managing organizations in the API.

## Base URL

All endpoints are relative to: `{{baseUrl}}/organizations`

## Authentication

Most endpoints require JWT authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Get All Organizations
- **Method**: GET
- **URL**: `/`
- **Auth Required**: Yes
- **Roles Required**: None
- **Description**: Retrieves all organizations (note: system is designed to have only one organization)
- **Response**: 
  ```json
  [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "users": [...],
      "artifacts": [...]
    }
  ]
  ```
- **Error Responses**:
  - 404: "There are no organizations in the database"
  - 412: "There is more than one organization in the database. This should not happen"

### Get One Organization
- **Method**: GET
- **URL**: `/:organizationId`
- **Auth Required**: Yes
- **Roles Required**: None
- **Parameters**: 
  - `organizationId`: UUID of the organization
- **Response**: 
  ```json
  {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "users": [...],
    "artifacts": [...]
  }
  ```
- **Error Responses**:
  - 404: "The organization with the provided id does not exist"

### Create Organization
- **Method**: POST
- **URL**: `/`
- **Auth Required**: Yes
- **Roles Required**: ADMIN
- **Request Body**:
  ```json
  {
    "name": "string (min 4 chars)",
    "description": "string (20-250 chars)"
  }
  ```
- **Response**: Created organization object
- **Error Responses**:
  - 412: "There is already an organization in the database. There can only be one."
  - 400: "The name of the organization is required and must have at least 4 characters"
  - 400: "The description is required and must be at least 20 characters long"
  - 400: "The description cannot be longer than 250 characters"

### Update Organization
- **Method**: PUT
- **URL**: `/:organizationId`
- **Auth Required**: Yes
- **Roles Required**: ADMIN
- **Parameters**: 
  - `organizationId`: UUID of the organization
- **Request Body**:
  ```json
  {
    "name": "string (min 4 chars)",
    "description": "string (20-250 chars)"
  }
  ```
- **Response**: Updated organization object
- **Error Responses**:
  - 404: "The organization with the provided id does not exist"
  - 400: "The description cannot be longer than 250 characters"
  - 400: "The description is required and must be at least 20 characters long"

### Delete Organization
- **Method**: DELETE
- **URL**: `/:organizationId`
- **Auth Required**: Yes
- **Roles Required**: ADMIN
- **Parameters**: 
  - `organizationId`: UUID of the organization
- **Response**: 204 No Content
- **Error Responses**:
  - 404: "The organization with the provided id does not exist"

### Delete All Organizations
- **Method**: DELETE
- **URL**: `/`
- **Auth Required**: Yes
- **Roles Required**: ADMIN
- **Response**: 204 No Content
- **Error Responses**:
  - 404: "There are no organizations in the database" 