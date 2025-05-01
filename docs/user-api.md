# User API

> **Base URL:** `{{baseUrl}}/users`  
> Unless noted otherwise, routes require a valid **JWT**:  
> 
> ```text
> Authorization: Bearer <jwt>
> ```

---

## Common Schemas

| Name | JSON Shape |
|------|------------|
| **UserGetDto** | ```json { "id":"uuid", "name":"string", "username":"string", "roles":["admin"], "organizationName":"string | null" }``` |
| **AuthToken** | ```json { "access_token":"<jwt string>" }``` |
| **AdminUsersCheck** | ```json { "message":"Admin users found", "count":2, "users":[ { "id":"uuid","username":"string","roles":["admin"] } … ] }``` |

---

## Endpoints

| Action | Method · Path | Auth | Role(s) | Body / Params | Success Response | Business-Error Codes* |
|--------|---------------|------|---------|---------------|------------------|-----------------------|
| **Login** | `POST /login` | — | — | ```json { "username":"string","password":"string" }```. Users can Login Using either teir username or email | **200** → `AuthToken` | **401** bad creds |
| **Logout** | `POST /logout` | ✔ | — | — | **200** `{ "message":"logged out" }` | — |
| **Create user** | `POST /register` | ✔ | `ADMIN · PI` | [`UserCreateDto`](#usercreatedto) | **201** → `UserGetDto` | **400/412** see rules |
| **List users** | `GET /` | ✔ | `ADMIN · PI` | — | **200** → `UserGetDto[]` | — |
| **Get user** | `GET /:id` | ✔ | `ADMIN · PI` | `id` (UUID) | **200** → `UserGetDto` | **404** not found |
| **Update user** | `PUT /:id` | ✔ | `ADMIN` | [`UserUpdateDto`](#userupdatedto) | **200** → `UserGetDto` (+ `message` when pwd changed) | **400/401/404** |
| **Delete user** | `DELETE /:id` | ✔ | `ADMIN · PI` | `id` (UUID) | **204** No Content | **400/404** rules below |
| **Check admin users** | `GET /admins/check-admin-users` | ✔ | `ADMIN` | — | **200** → `AdminUsersCheck` | — |

### Special Delete-rules  
* **Admin** cannot delete another **Admin**.  
* **PI** cannot delete Admins and may only delete users whose single role is **COLLABORATOR**.

---

## DTO Validation Rules

### UserCreateDto  <a id="usercreatedto"></a>

| Field      | Rules / Constraints                                                          |
|------------|------------------------------------------------------------------------------|
| `name`     | required · 3 – 50 chars                                                      |
| `email`    | required · valid e-mail                                                      |
| `username` | required · 8 – 50 chars (unique)                                             |
| `password` | required · **≥ 8** chars                                                     |
| `role`     | required · enum `ADMIN | PI | COLLABORATOR`                                   |

### UserUpdateDto  <a id="userupdatedto"></a>

| Field      | Rules / Constraints &nbsp;*(all optional)*                                   |
|------------|------------------------------------------------------------------------------|
| `name`     | 3 – 50 chars                                                                 |
| `email`    | valid e-mail · unique                                                        |
| `username` | 8 – 50 chars · unique                                                        |
| `password` | **≥ 8** chars                                                                |
| `role`     | enum `ADMIN - PI - COLLABORATOR` (cannot self-modify)                        |

---

## Behaviour Notes & Edge Cases

| Topic | Details |
|-------|---------|
| **Bootstrap Admins** | Two admin accounts are auto-seeded from **environment variables** (`ADMIN1_*`, `ADMIN2_*`). The values aren’t in the repo and **must be shared securely among the team**. |
| **Role-based creation** | *Admins* may create any user.<br>*PIs* may create **PI** or **COLLABORATOR** only.<br>Creating non-admin users fails if no organization exists. |
| **Org linkage** | Non-admin users are automatically linked to the single Organization; Admins have `organization: null`. |
| **Password change** | On successful `PUT /:id` with `password`, the response adds: <br>`"message": "Password updated … log in again"` and the caller **must re-authenticate**. |
| **Uniqueness** | `username` and `email` are globally unique. Duplicate requests return **400 Bad Request** `"User with this username or email already exists"`. |
| **Self-update limits** | Admins updating themselves **cannot** change `username` or `email`. Any user cannot change their own `role`. |

---

\* Business errors are returned in the unified shape:

```json
{
  "message": "specific explanation",
  "error": "Bad Request | Unauthorized | Not Found | Precondition Failed",
  "statusCode": 400 | 401 | 404 | 412
}

_Last updated: 2025-04-24_

