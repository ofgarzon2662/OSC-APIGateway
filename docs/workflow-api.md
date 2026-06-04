# Workflow API

> **Base URL:** `{{baseUrl}}/workflows`
> Only the _endpoints that modify data_ are protected.
> Human endpoints use **JWT**; the system status callback uses an **API key**.
> ```text
> Authorization: Bearer <jwt>            # human (PI / Collaborator)
> x-api-key: <key>                       # submission listener
> x-service-role: submitter_listener     # submission listener
> ```

A **workflow** groups one or more **artifacts** together with linked **GitHub repositories**, representing a complete piece of reproducible research. Like artifacts, workflows are persisted off-chain and asynchronously written to the blockchain.

---

## Common Schemas

| Name | JSON Shape |
|------|------------|
| **GitHubRepositoryItem** | ```json { "url": "https://github.com/org/repo", "description": "string", "gitHash": "string", "contents": [{ "filename": "file.py", "hash": "string" }] }``` |
| **ListWorkflowDto** | ```json { "id": "uuid", "title": "string", "description": "string", "submissionState": "PENDING" }``` |
| **GetWorkflowDto** | ```json { "id": "uuid", "title": "string", "description": "string", "keywords": ["kw"], "githubRepositories": [GitHubRepositoryItem], "artifacts": [ListArtifactDto], "submissionState": "PENDING", "submitterEmail": "user@mail", "submitterUsername": "uname", "submittedAt": "ISO-8601", "blockchainTxId": "string", "organization": { "name": "Org" } }``` |
| **SubmissionState enum** | PENDING, FAILED, SUCCESS |

---

## Endpoints

| Action | Method · Path | Auth | Role(s) | Body / Params | Success | Business-Error Codes |
|--------|---------------|------|---------|---------------|---------|----------------------|
| **Create workflow** | `POST /` | ✔ JWT | `PI`, `COLLABORATOR` | **CreateWorkflowDto** | **201** → **ListWorkflowDto** | **400** validation • **401** missing user info |
| **List workflows** | `GET /` | ✖ | — | — | **200** → `ListWorkflowDto[]` | — |
| **Get by ID** | `GET /:id` | ✖ | — | `id` (UUID) | **200** → **GetWorkflowDto** | **404** id not found |
| **Update (user)** | `PUT /:id` | ✔ JWT | `PI`, `COLLABORATOR` | **UpdateWorkflowDto** | **200** → `WorkflowEntity` | **400** validation • **404** not found |
| **Update status (system)** | `PATCH /:id` | ✔ API key | `SUBMITTER_LISTENER` | **UpdateWorkflowWorkerDto** | **200** → `WorkflowEntity` | **401** invalid key/role |

Errors follow the platform shape:

```json
{ "message": "text describing the problem", "error": "Bad Request | Not Found", "statusCode": 400 }
```

---

## DTO Validation Rules

### CreateWorkflowDto

| Field | Rule / Constraint |
|---|---|
| `title` | **required** · 3 – 200 chars |
| `description` | **required** · 50 – 3000 chars |
| `keywords[]` | optional · array of strings |
| `githubRepositories[]` | optional · array of **GitHubRepositoryDto** (validated, nested) |
| `artifactIds[]` | optional · array of **UUID v4** (existing artifact ids to group) |
| `submission_comment` | **required** · 20 – 1000 chars |

### UpdateWorkflowWorkerDto (system / listener only)

| Field | Rule / Constraint |
|---|---|
| `submissionState` | optional · `PENDING` / `SUCCESS` / `FAILED` |
| `updatedAt` | optional · ISO-8601 date string |
| `blockchainTxId` | optional · string |
| `peerId` | optional · string |
| `submissionError` | optional · string |

---

## Lifecycle

1. A **PI** or **Collaborator** `POST`s a workflow → persisted with `submissionState = PENDING` → `201` returned immediately.
2. The gateway publishes a `workflow.submit` command to `artifact.exchange`.
3. The submission worker writes the workflow to the ledger (via OSC-API) and publishes `workflow.submitted`.
4. The submission listener `PATCH`es this endpoint with the on-chain result, moving the workflow to `SUCCESS` (or `FAILED`).

> **Field normalization note.** Workflow update commands carry camelCase keys (`artifactIds`, `githubRepositories`) over the wire; the submission worker normalizes these to the snake_case shape the downstream blockchain layer expects. A mismatch here previously caused empty `artifact_ids` / `github_repositories` on-chain.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full asynchronous-submission rationale.
