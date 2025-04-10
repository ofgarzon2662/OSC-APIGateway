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
- **Auth Required**: No
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
    "title": "string (min 3 chars)",
    "description": "string (min 50 chars)",
    "keywords": ["string (total length ≤ 1000 chars)"],
    "links": ["string (valid URLs, total length ≤ 2000 chars)"],
    "fundingAgencies": ["string"],
    "dois": ["string"],
    "acknowledgements": "string",
    "fileName": "string",
    "hash": "string"
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
  - 412: "The title of the artifact is required and must be at least 3 characters long"
  - 412: "The description must be at least 50 characters long"
  - 412: "The keywords array can have at most 1000 characters in total"
  - 412: "The links array can have at most 2000 characters in total"
  - 412: "Each link in the links array must be a valid URL"
  - 412: "An artifact with this title already exists in this organization"
  - 412: "Invalid submitter email provided"
  - 412: "The organizationId provided is not valid"

### Update Artifact
- **Method**: PUT
- **URL**: `/:artifactId`
- **Auth Required**: Yes
- **Roles Required**: submitter_listener
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
- **Roles Required**: admin
- **Parameters**: 
  - `organizationId`: UUID of the organization
  - `artifactId`: UUID of the artifact
- **Response**: 204 No Content
- **Error Responses**:
  - 404: "Organization not found"
  - 404: "Artifact not found"
  - 412: "Artifact belongs to a different organization" 
