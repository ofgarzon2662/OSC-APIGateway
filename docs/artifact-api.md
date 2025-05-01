# Artifact API

> **Base URL:** `{{baseUrl}}/artifacts`  
> Only the _endpoints that modify data_ are protected with **JWT**.  
> Send the token like this:
> ```text
> Authorization: Bearer <jwt>
> ```

---

## Common Schemas

| Name | JSON Shape |
|------|------------|
| **ListArtifactDto** | ```json { "id": "uuid", "title": "string", "description": "string", "lastTimeVerified": "2025-04-23T22:37:14.700Z" }``` |
| **GetArtifactDto** | ```json { "id": "uuid", "title": "string", "description": "string", "keywords": ["kw"], "links": ["https://…"], "dois": ["10.…"], "fundingAgencies": ["agency"], "acknowledgements": "string", "fileName": "file.tif", "hash": "64-hex", "verified": false, "lastTimeVerified": "2025-04-23T22:37:14.700Z", "submissionState": "PENDING", "submitterEmail": "user@mail", "submitterUsername": "uname", "submittedAt": "2025-04-23T22:35:00.000Z", "organization": { "name": "Org" } }``` |
| **SubmissionState enum** | PENDING, FAILED , SUCCESS |

---

## Endpoints

| Action | Method · Path | Auth | Role(s) | Body / Params | Success | Business-Error Codes* |
|--------|---------------|------|---------|---------------|---------|-----------------------|
| **Create artifact** | `POST /` | ✔ | `PI`, `COLLABORATOR` | **CreateArtifactDto** (see rules) | **201** → **ListArtifactDto** | **412** duplicate title • **400** validation |
| **List artifacts** | `GET /` | ✖ | — | — | **200** → `ListArtifactDto[]` | **404** no organization |
| **Get by ID** | `GET /:id` | ✖ | — | `id` (UUID) | **200** → **GetArtifactDto** | **404** id not found |
| **Update** | `PUT /:id` | ✔ | `SUBMITTER_LISTENER` | **UpdateArtifactDto** | **200** → full `ArtifactEntity` | **400** forbidden fields |
| **Delete** | `DELETE /:id` | ✔ | `ADMIN` | — | **204** No Content | **404** id not found |

\* Errors are returned as:

```json
{
  "message": "text describing the problem",
  "error": "Bad Request | Not Found | Precondition Failed",
  "statusCode": 400 | 404 | 412
}
```

---

## DTO Validation Rules

### CreateArtifactDto

| Field               | Rule / Constraint                                                                          |
|---------------------|--------------------------------------------------------------------------------------------|
| `title`             | **required** · 3 – 200 chars                                                               |
| `description`       | **required** · 50 – 3000 chars                                                             |
| `keywords[]`        | optional · array of strings · **total** concatenated length ≤ 1000 chars                   |
| `links[]`           | optional · array of **valid URLs** · total concatenated length ≤ 2000 chars                |
| `dois[]`            | optional · each matches `^10\.\d{4,9}/[-_.;()/:]\\w+$`                                     |
| `fundingAgencies[]` | optional · array of strings                                                                |
| `acknowledgements`  | optional · ≤ 3000 chars                                                                    |
| `fileName`          | **required** · 1 – 1000 chars                                                              |
| `hash`              | **required** · 64-hex SHA-256 string                                                       |
| `submittedAt`       | optional · ISO-8601 date                                                                   |
| `verified`          | optional · boolean                                                                         |
| `lastTimeVerified`  | optional · ISO-8601 date                                                                   |
| `submissionState`   | optional · enum `PENDING | FAILED | SUCCESS`                                               |

---

### UpdateArtifactDto  
Only the following fields are **allowed** when updating; any other keys trigger **400 Bad Request**.

| Field               | Type / Constraint      |
|---------------------|------------------------|
| `verified`          | boolean                |
| `lastTimeVerified`  | ISO-8601 date          |
| `submissionState`   | enum `SubmissionState` |
| `submittedAt`       | ISO-8601 date          |

---

### Behaviour Notes

* The system holds **exactly one organization**. Every artifact operation first checks that this single org exists.
* `title` must be **unique inside the organization**. Attempting to reuse a title returns **412 PRECONDITION_FAILED**.
* Deleting an organization cascades (`ON DELETE CASCADE`) and removes its artifacts automatically.
* Passwords are never exposed; the `submitter*` fields only include username & email.

---

_Last updated: 2025-04-24_
