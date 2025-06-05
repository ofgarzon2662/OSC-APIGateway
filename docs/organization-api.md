# Organization API

> **Base URL:** `{{baseUrl}}/organizations`  
> All routes require JWT authentication.  
> Send the token in the header:
>
> ```text
> Authorization: Bearer <jwt>
> ```

---

## Common Schemas

| Name | JSON Shape |
|------|------------|
| **UserForOrganizationDto** | ```json { "id": "uuid", "name": "string", "username": "string", "email": "string", "roles": ["pi"] }``` |
| **Artifact (minimal)** | ```json { "id": "uuid", "title": "string", "description": "string", "lastTimeVerified": "2025-04-23T22:37:14.700Z" }``` |
| **OrganizationResponseDto** | ```json { "id": "uuid", "name": "string", "description": "string", "users": [UserForOrganizationDto …], "artifacts": [Artifact …] }``` |

---

## Endpoints

| Action | Method · Path | Auth | Role(s) | Body / Params | Success Response | Business-Error Codes* |
|--------|---------------|------|---------|---------------|------------------|-----------------------|
| List organization (only one should exist) | `GET /` | ✔ | — | — | **200** → `OrganizationResponseDto[]` (size 1) | **404** no orgs · **412** >1 org |
| Get by ID | `GET /:organizationId` | ✔ | — | `organizationId` (UUID) | **200** → `OrganizationResponseDto` | **404** id not found |
| Create | `POST /` | ✔ | `ADMIN` | ```json { "name":"min 4", "description":"20-250" }``` | **201** → `OrganizationResponseDto` | **412** already exists · **400** validation |
| Update | `PUT /:organizationId` | ✔ | `ADMIN` | same as **Create** | **200** → `OrganizationResponseDto` | **404** id not found · **400** validation |
| Delete by ID | `DELETE /:organizationId` | ✔ | `ADMIN` | — | **204** No Content | **404** id not found |
| Delete ALL | `DELETE /` | ✔ | `ADMIN` | — | **204** No Content | **404** no orgs |

\* Business errors are returned as:

```json
{
  "message": "text describing the problem",
  "error": "Bad Request | Not Found | Precondition Failed",
  "statusCode": 400 | 404 | 412
}

```


### Validation Rules (Create / Update)

| Field | Rule |
|-------|------|
| `name` | **required** · minimum **4** characters |
| `description` | **required** · between **20 – 250** characters |

---

### Behaviour Notes

* The system is designed to hold **exactly one organization**.  
  Creating a second one returns **412 PRECONDITION_FAILED**.
* Deleting an organization cascades to **users** and **artifacts**  
  thanks to `ON DELETE CASCADE` in the DB schema.
* Endpoints never expose sensitive data such as user passwords;  
  returned `users` objects only include non-sensitive fields.

---

_Last updated: 2025-04-24_

