# Public Sharing Boundary

This talk package is safe to share only as the curated presentation material in
this directory and the reviewed visual assets identified in `assets/README.md`.
It is a Markdown-only package and contains no raw AWS identity output,
credentials, certificates, private endpoints, Terraform state, or source-evidence
archives.

## Shareable content

- the numbered talk-production Markdown files in this directory;
- the reviewed UX and historical-source visual assets, subject to the labels and
  redraw guidance in `assets/README.md` and the architecture brief;
- a checksum manifest generated for the specific public export.

## Private/reference content

Do not distribute copied raw source evidence, provider identity output, raw
Kubernetes/AWS inventories, or original engineering-review archives with the
public presentation package. Preserve those records separately for authorized
audit and operational reference. The public presentation must cite evidence by
repository revision and path rather than embedding those private records.

## Claims that remain intentionally bounded

- Live browser edge smoke and API-to-ledger validation are separate evidence
  layers; this is not browser-to-ledger E2E.
- The local correlated trace has five direct records and two bounded inferences.
- Image findings are scoped to six deployed roles and eight retained scan
  records, not the whole dependency estate.
- Cost is an estimate, not provider billing.
- OSC-IS remains an experimental prototype. Current WebApp governance is NOT
  READY because of 15 High production dependency findings; the other four
  primary repositories are ready only with manual gates.
