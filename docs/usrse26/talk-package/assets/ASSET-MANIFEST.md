# US-RSE 2026 Visual Evidence Manifest

Use this file while assembling the slide deck. Every generated visual has a
speaker-safe claim boundary and suggested alt text. Exact hashes are in
`checksums.sha256`.

## Generated Visuals

| File | Suggested use | Maturity | Evidence basis | Claim boundary |
|---|---|---|---|---|
| `generated-diagrams/01-historical-vm-compose.png` | Original prototype architecture | Historical conceptual view | Original Draw.io architecture and repository history | Not a current or production topology |
| `generated-diagrams/02-authorization-ledger-boundaries.png` | Engineering lesson about access control | Experimentally demonstrated | Gateway authorization and chaincode invariant tests | Organization service identities were used by Fabric; individual attribution stayed in trusted Gateway audit metadata |
| `generated-diagrams/03-disposable-aws-eks-experiment.png` | Current experimental architecture | Experimentally demonstrated | Retained AWS evidence at Infra revisions `d5975ce` and `25aefb8` | Disposable experiment; OIDC configuration is present but a remote Actions execution is not proven |
| `generated-diagrams/04-evidence-layers.png` | Explain the validation strategy | Evidence model | Browser smoke, AWS API-to-ledger evidence, and local correlated trace | No full browser-to-ledger E2E claim; local trace has 5 direct and 2 bounded inferred links |
| `generated-plots/05-recovery-observations.png` | Failure and recovery results | Experimentally demonstrated | Retained summaries from two disposable AWS runs | Values are observations, not SLO, HA, or disaster-recovery guarantees |
| `generated-plots/06-gitops-observations.png` | Drift, rollout, and rollback results | Experimentally demonstrated | Retained Argo CD and post-rollback summaries | Not a production deployment-frequency or reliability target |
| `generated-diagrams/07-kubernetes-workload-topology.png` | Cluster picture showing nodes and workloads | Experimentally demonstrated | Retained node, pod, and Argo CD snapshots at Infra revision `25aefb8` | Observed scheduling only; private names, addresses, and endpoints omitted |
| `generated-composites/08-product-experience.png` | Artifact, workflow, and history UX | Currently implemented | Canonical deterministic WebApp captures at `07e2a0f` | Synthetic representative records, not live-ledger screenshots |
| `generated-composites/09-accessibility-evidence.png` | Accessibility appendix | Currently implemented | 18 focused unit tests, 9/9 Cypress/axe journeys, and manual captures at `16b18d3` | WCAG 2.2 AA target, not certification; report-level 222/222 is not raw-transcript-backed |
| `generated-composites/10-trust-evidence-summary.png` | Honest results summary or appendix | Evidence summary | Retained test, scan, cost, and teardown evidence | Six deployed image roles, eight scan records including two replacements, and zero High/Critical IMAGE-scan findings only; WebApp still reports 15 High production dependency findings |

## Suggested Alt Text

| File | Alt text |
|---|---|
| `01-historical-vm-compose.png` | Historical OSC-IS prototype with a WebApp, API Gateway, PostgreSQL, RabbitMQ, workers, a legacy adapter, and an external Fabric virtual machine. |
| `02-authorization-ledger-boundaries.png` | Authorization split between the API Gateway, which enforces portal roles and organization routing, and the Fabric contract, which enforces ledger invariants. |
| `03-disposable-aws-eks-experiment.png` | Sanitized disposable AWS architecture with CloudFront and S3, Argo CD, three private EKS nodes, Amazon MQ, PostgreSQL, two ledger gateways, and a two-organization Fabric network. |
| `04-evidence-layers.png` | Three evidence layers: browser edge smoke, AWS API-to-ledger tests, and one local correlated trace. |
| `05-recovery-observations.png` | Horizontal bar chart comparing two AWS runs: Ledger Gateway recovery at 46 seconds, RabbitMQ and worker recovery at 223 and 226 seconds, and alternate peer recovery at 6 seconds. |
| `06-gitops-observations.png` | Horizontal bar chart comparing drift self-heal, rollout, and rollback observations across two disposable AWS runs. |
| `07-kubernetes-workload-topology.png` | Three Ready EKS nodes showing selected application, ordering, certificate authority, peer, and chaincode workload placement from a retained snapshot. |
| `08-product-experience.png` | Side-by-side OSC-IS artifact record, workflow record, and accepted provenance history screens using deterministic demonstration data. |
| `09-accessibility-evidence.png` | Keyboard-focus, error-and-retry, and expired-session reflow examples beside counts of 18 focused unit tests and 9 of 9 Cypress axe journeys. |
| `10-trust-evidence-summary.png` | Summary of accessibility journeys, deployed image roles, estimated AWS run cost, teardown status, and the remaining WebApp dependency-risk boundary. |

## Original Inputs

- The five canonical product screenshots remain under
  `OSC-WebApp/docs/usrse26/ux-evidence/final`.
- The five accessibility captures remain under
  `OSC-WebApp/docs/evidence/accessibility-manual-20260902`.
- Historical diagram sources remain in the UC San Diego OneDrive architecture
  documentation folder.
- The licensed lab photograph remains in
  `OSC-WebApp/src/assets/images/research-lab-microscopy-pexels-8940359.jpg`.

No generated visual contains the AWS account ID, credentials, private IP
addresses, or private endpoint names.
