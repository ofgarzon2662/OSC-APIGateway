# US-RSE 2026 Interactive Demonstration API

This module is a narrow, additive boundary around the authenticated OSC API. It
does not weaken or replace the bearer-token product path. A demonstration guest
can create public records only through `/api/v1/demo`; the guest cookie is not
accepted by the normal artifact, workflow, user, organization, or internal
routes.

## Public lifecycle

The default event window is October 20, 2026 at 8:00 AM Pacific daylight time
(`2026-10-20T15:00:00Z`) through October 23, 2026 at 8:00 AM Pacific daylight
time (`2026-10-23T15:00:00Z`). It is exactly 72 hours.

`GET /api/v1/demo/status` returns one of `SCHEDULED`, `PREPARING`, `OPEN`,
`READ_ONLY`, or `CLOSED`, the UTC open/close instants, and a nontechnical
message. `GET /api/v1/demo/counters` reports anonymous browser sessions,
accepted and confirmed records, and provenance history views. Neither endpoint
uses a guest cookie.

Lifecycle automation uses the separate `X-Demo-Control-Key` credential on:

- `PUT /api/v1/demo/internal/status`
- `GET /api/v1/demo/internal/export`
- `POST /api/v1/demo/internal/purge`

The browser cookie is never a control credential. The status update payload
requires a machine run ID and may set the bounded open/close instants. Any
window longer than 72 hours is rejected.

## Guest session and authorization

`POST /api/v1/demo/session` accepts only:

```json
{ "organization": "neuroscience-gateway" }
```

`citizen-science` is the only other valid value. The response sets a 30-minute
`Secure`, `HttpOnly`, `SameSite=Strict`, path `/` cookie named
`__Host-osc_demo`. The signed token is never returned in JSON. The response
body contains an unprivileged CSRF token, expiration, selected organization,
and random contributor alias. No name, username, password, or email is asked
of the attendee.

All browser mutations require:

- the exact configured `Origin`;
- the guest cookie; and
- the current CSRF value in `X-Demo-CSRF`.

Silent renewal at `POST /api/v1/demo/session/refresh` rotates the CSRF token and
cookie only while the runtime is `OPEN`. Renewal never exceeds the configured
close instant. The server-stored session, rather than browser input, supplies
the organization and capability.

## Controlled contributions

`POST /api/v1/demo/artifacts` accepts a client-generated UUID request ID,
lowercase SHA-256 fingerprint, size from 1 byte through 10 MiB, allowlisted
lowercase extension, and one controlled research context. It has no field for
file bytes, original filename, links, HTML, or free-form public text. The
server generates every public field, including a manifest name of the form
`demo-artifact-<record UUID>.<extension>`.

`POST /api/v1/demo/workflows` accepts a request ID, one to three distinct
artifact UUIDs, and one controlled research context. Every linked artifact
must belong to the session-bound organization.

Request IDs are idempotency keys within a session. A same-payload retry returns
the original record UUID and does not reserve another quota slot. Reusing a
request ID with a different payload is rejected. If a process stops between
the idempotency reservation and record persistence, a same-payload retry
resumes under the already reserved record UUID, preventing a second ledger
revision.

Limits are enforced with conditional database updates:

| Scope             | Anonymous sessions | Artifacts | Workflows | Survey |
| ----------------- | -----------------: | --------: | --------: | -----: |
| Per guest session |                  1 |         3 |         2 |      1 |
| Entire event      |                300 |     1,000 |       500 |      — |

Reaching an event-wide session or contribution limit changes the runtime to
`READ_ONLY`. Reads and privacy-safe events remain available; new sessions,
contributions, and refreshes fail closed.

The following cookie-authenticated reads expose only controlled public result
fields:

- `GET /api/v1/demo/artifacts/:id`
- `GET /api/v1/demo/artifacts/:id/history`
- `GET /api/v1/demo/workflows/:id`

There are intentionally no guest update, delete, administration, role-change,
history-refresh, or internal-operation interfaces.

## Telemetry, survey, and retention

`POST /api/v1/demo/events` accepts only `STATUS_VIEWED` and `SURVEY_SHOWN`.
Accepted artifact/workflow events and authorized history views are recorded
server-side.
Raw session identifiers are never stored in analytics tables; a dedicated
secret produces an HMAC-SHA-256 pseudonym. Event rows contain no IP address or
browser fingerprint.

`POST /api/v1/demo/feedback` accepts three integer ratings from 1 through 5 and
one optional private comment of at most 300 characters. The comment is escaped
before storage, never put on the ledger, never returned by a public endpoint,
and excluded from the sanitized export. Feedback can be submitted once per
session.

| Data               | Fields                                                                                                                 | Retention       | Public?           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- | --------------- | ----------------- |
| Guest session      | HMAC pseudonym, organization, alias, quotas, expiry                                                                    | 30 days         | No                |
| Contribution index | HMAC pseudonym, request/record IDs, controlled metadata                                                                | 30 days         | No                |
| Event              | HMAC pseudonym, organization, allowlisted event/resource                                                               | 30 days         | Aggregate only    |
| Feedback           | HMAC pseudonym, organization, ratings, escaped private comment                                                         | 30 days         | No                |
| Sanitized export   | event-wide counters and 1-5 rating distributions; no rows, comments, organization breakdown, timestamps, or pseudonyms | at most 30 days | Operator evidence |

The sanitized export has a fixed versioned schema. Its survey section contains
only an event-wide `sampleSize` and five-bin distributions for ease,
provenance, and usefulness. Per-submission timestamps and organization-level
survey cells are never exported.

The purge endpoint deletes rows whose explicit `retentionExpiresAt` has passed.
Infrastructure separately expires operational security logs after seven days
and the sanitized evidence/control-plane package after at most 30 days.

Survey results must be described as a self-selected convenience sample from a
conference demonstration, not as community acceptance. Session counts must be
called anonymous browser sessions, not people, users, or unique attendees.

## Verification

Run the focused contract suite and then the full quality gate:

```text
npx cross-env NODE_ENV=test jest --runInBand src/demo/demo.contract.spec.ts
npm run test:ci
npm run build
npm audit --omit=dev --audit-level=critical
```

The contract suite includes exact-origin, cookie and CSRF enforcement; rejected
extra fields; server-side organization binding; cross-organization workflow
denial; idempotency and interrupted-write recovery; session and global quotas;
event allowlisting; one-shot feedback; escaping; counters; and read-only
failover. The migration is also validated from an empty PostgreSQL database,
with `DB_SYNCHRONIZE=false` and `DB_MIGRATIONS_RUN=true`.
