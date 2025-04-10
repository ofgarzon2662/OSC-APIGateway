# Artifact API Documentation

This document describes the available endpoints for managing artifacts in the API.

## Base URL

All endpoints are relative to: `{{baseUrl}}/organizations/{organizationId}/artifacts`

## Authentication

All endpoints require JWT authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Get All Artifacts
- **Method**: GET
- **URL**: `/`
- **Auth Required**: No
- **Roles Required**: None
- **Parameters**:
  - `organizationId`: UUID of the organization
- **Response**: 
  ```json
  [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "lastTimeVerified": "date"
    }
  ]
  ```
- **Error Responses**:
  - 404: "Organization not found"

### Get One Artifact
- **Method**: GET
- **URL**: `/:artifactId`
- **Auth Required**: Yes
- **Roles Required**: None
- **Parameters**: 
  - `organizationId`: UUID of the organization
  - `artifactId`: UUID of the artifact
- **Response**: 
  ```json
  {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "keywords": ["string"],
    "links": ["string"],
    "fundingAgencies": ["string"],
    "verified": boolean,
    "lastTimeVerified": "date",
    "submissionState": "string",
    "submittedAt": "date",
    "submittedBy": {
      "id": "uuid",
      "name": "string",
      "email": "string"
    }
  }
  ```
- **Error Responses**:
  - 404: "Organization not found"
  - 404: "Artifact not found"

### Create Artifact
- **Method**: POST
- **URL**: `/`
- **Auth Required**: Yes
- **Roles Required**: None
- **Parameters**:
  - `organizationId`: UUID of the organization
- **Request Body**:
  ```json
  {
    "title": "string",
    "description": "string",
    "keywords": ["string"],
    "links": ["string"],
    "fundingAgencies": ["string"]
  }
  ```
- **Response**: 
  ```json
  {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "lastTimeVerified": "date"
  }
  ```
- **Error Responses**:
  - 404: "Organization not found"
  - 412: "Title is required"
  - 412: "Description is required"
  - 412: "Total length of keywords and links must not exceed 10"
  - 412: "An artifact with this title already exists in this organization"

### Update Artifact
- **Method**: PUT
- **URL**: `/:artifactId`
- **Auth Required**: Yes
- **Roles Required**: None
- **Parameters**: 
  - `organizationId`: UUID of the organization
  - `artifactId`: UUID of the artifact
- **Request Body**:
  ```json
  {
    "title": "string",
    "description": "string",
    "keywords": ["string"],
    "links": ["string"],
    "fundingAgencies": ["string"],
    "verified": boolean,
    "lastTimeVerified": "date",
    "submissionState": "string",
    "submittedAt": "date"
  }
  ```
- **Response**: Updated artifact object
- **Error Responses**:
  - 404: "Organization not found"
  - 404: "Artifact not found"
  - 412: "Artifact belongs to a different organization"
  - 412: "Total length of keywords and links must not exceed 10"
  - 412: "An artifact with this title already exists in this organization"

### Delete Artifact
- **Method**: DELETE
- **URL**: `/:artifactId`
- **Auth Required**: Yes
- **Roles Required**: None
- **Parameters**: 
  - `organizationId`: UUID of the organization
  - `artifactId`: UUID of the artifact
- **Response**: 204 No Content
- **Error Responses**:
  - 404: "Organization not found"
  - 404: "Artifact not found"
  - 412: "Artifact belongs to a different organization" 
