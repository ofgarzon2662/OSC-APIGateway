# Architecture Diagram Brief

## Recommendation

Keep Draw.io as the diagram source of truth. The existing files already encode
useful project history, are easy for the team to edit by hand, and avoid the
visual ambiguity of generated architecture art. AI can help critique labels or
reduce complexity, but the final topology and trust boundaries should remain
human-controlled.

Create three conference diagrams:

1. **Historical prototype** - what the first VM/Compose system taught us.
2. **Responsibility boundary** - what moved to the Gateway and what stayed in
   chaincode.
3. **Disposable AWS experiment** - what was actually evaluated with EKS,
   GitOps, Amazon MQ, and two Fabric organizations.

Do not attempt to make one diagram serve all three purposes.

## Assessment of Existing Diagrams

### `OSC-IS_Components_Simple.drawio.png`

**Useful:** It captures the portal, API Gateway, relational database, queues,
workers, and peer integration. It reflects the event-driven intent of the
prototype.

**Mismatch:** It includes storage and verification paths that are not the
center of the retained US-RSE evidence. It is too wide and dense for a 15-minute
talk. The current implementation and evidence use a transactional outbox,
organization-specific Ledger Gateways, completion handling, multi-organization
authorization, and a clearer separation between application and Fabric
responsibilities.

**Decision:** Use as a historical design source, not as a current architecture
slide.

### `OSC-IS Deployment_Infra Diagram MVP(1).png`

**Useful:** It records an important intermediate design: CloudFront/S3, AWS
application services, managed database intent, RabbitMQ, Fabric identity
storage, and a connection to an on-premises Fabric VM.

**Mismatch:** It depicts ECS, an EC2-hosted RabbitMQ broker, Fabric Bridge, and
an on-premises VM. The demonstrated AWS experiment used EKS, private Amazon MQ
RabbitMQ, organization Ledger Gateways, and a disposable two-organization
Fabric deployment. The diagram also includes broad service inventory that
obscures the product flow.

**Decision:** Keep it as architecture-history evidence. If shown, title it
`Intermediate hybrid design - not the EKS experiment`. Do not silently relabel
it as current.

### `SequenceDiagramSubmitArtifact.png`

**Useful:** It communicates the asynchronous submission intent and the return
path from Fabric through a listener to relational state.

**Mismatch:** It does not show the transactional outbox, correlation ID,
organization-specific Ledger Gateway, distinct direct versus inferred evidence
links, or the current authorization boundary. Its early success message may be
misread as ledger acceptance rather than asynchronous submission acceptance.

**Decision:** Redraw only if the correlated path becomes a main slide visual.
Otherwise use the simpler evidence-lane graphic on Slide 7.

## Diagram 1 - Historical Prototype

### Communication Goal

Show why the prototype was a valid first step and why implicit responsibilities
became difficult to sustain.

### Required Nodes

- Researcher.
- WebApp.
- API Gateway and relational metadata.
- RabbitMQ queues.
- Submission worker/listener.
- Fabric peer/chaincode.
- One outer boundary labeled `VMs + Docker Compose`.

### Required Annotations

- `Proved the workflow` in cyan or green.
- `Manual host/identity configuration` in orange.
- `Portal policy too close to ledger` in orange.
- `Historical prototype` maturity label.

### Exclusions

- AWS service icons.
- Exact queue names.
- Storage and verifier components unless discussed verbally.
- A judgmental red X over the architecture.

## Diagram 2 - Responsibility Boundary

### Communication Goal

Make the central engineering decision understandable in under 20 seconds.

### Topology

```text
Researcher request
      |
      v
+-------------------------+
| API Gateway             |
| auth, membership, role, |
| caller tenancy, audit   |
+-------------------------+
      | organization context + trusted audit metadata
      v
+-------------------------+
| Organization Ledger     |
| Gateway                 |
+-------------------------+
      | organization service identity
      v
+-------------------------+
| Fabric chaincode        |
| MSP, ownership, keys,   |
| transitions, history   |
+-------------------------+
```

Place `NSG` and `Citizen Science` as two organization lanes entering their own
Ledger Gateway and Fabric organization. Show cross-organization denial markers
at both the Gateway and Fabric boundaries.

### Exact Identity Caption

> Portal users authenticate at the Gateway. Fabric transactions use scoped
> organization service identities. Individual attribution is trusted Gateway
> audit metadata, not per-user cryptographic authorship.

### Design Rule

Do not imply that chaincode performs no authorization. It retains ledger-level
organization and invariant checks.

## Diagram 3 - Disposable AWS Experiment

### Communication Goal

Show how deployment discipline made the product measurable. This is not a
reference production architecture.

### Required Topology

```text
Researcher browser
      |
      v
CloudFront + private S3 WebApp
      |
      v
Private NLB -> API Gateway on EKS
                  |        |
                  |        +-> PostgreSQL
                  |
                  +-> transactional outbox
                              |
                              v
                   private Amazon MQ RabbitMQ
                              |
                              v
                   submission worker/listener
                              |
                 +------------+------------+
                 v                         v
          NSG Ledger Gateway      Citizen Science Ledger Gateway
                 |                         |
                 +---- two-org Fabric -----+

Git repository -> Argo CD -> declared Kubernetes state
GitHub OIDC -> scoped AWS deployment role
ECR digest -> Kubernetes workload
```

### Runtime Labels

- `Disposable EKS experiment` around the application and Fabric runtime.
- `Private managed RabbitMQ` on Amazon MQ.
- `AMQP/RabbitMQ protocol` on the broker connection. Kafka was not used or
  required by the demonstrated implementation.
- `Immutable image digests` between ECR and workloads.
- `Short-lived deployment identity` between GitHub Actions and AWS.
- `Organization-scoped service identity` between each Ledger Gateway and
  Fabric.

### Known Limitations to Encode

Use a small `Experiment boundary` box, not warning icons across the diagram:

- Amazon MQ was single-instance.
- PostgreSQL was in-cluster on EBS in the experiment.
- The public NLB had one healthy target because of the retained target topology.
- No load, regional failure, backup/restore, HA, or DR test.

The limitations may be summarized verbally if placing them all on the diagram
would make it unreadable, but `Disposable experiment` must remain visible.

### Components Not in the Demonstrated EKS Path

- OSC-API was associated with the legacy VM compatibility path and should not
  appear in the EKS diagram.
- The legacy Fabric Bridge should not be drawn as a required EKS component.
  Organization-specific Ledger Gateways are the demonstrated connection.
- OSC-Docker may remain relevant as historical Fabric packaging, but it is not
  an application service in the EKS product flow.
- Kafka was not part of the demonstrated messaging path.

## Diagram Consistency Rules

- Use `API Gateway`, not a mixture of `APIGateway`, `Gateway`, and `API`.
- Use `Ledger Gateway` for the application-to-Fabric connector.
- Use `Hyperledger Fabric` for the network and `chaincode` for the smart
  contract.
- Use `RabbitMQ` for the protocol and `Amazon MQ` for the AWS managed service.
- Use `PostgreSQL`, not `PostgresDB`, in audience-facing labels.
- Spell the organizations `NSG` and `Citizen Science` consistently. If expanded,
  use `Neuroscience Gateway (NSG)` after the project owner confirms the final
  capitalization.
- Use solid arrows for synchronous requests, dashed arrows for asynchronous
  events, and a distinct thin line for GitOps reconciliation.
- Add an arrow legend once. Do not repeat protocol labels on every edge.

## Validation Against Code and Evidence

Before exporting a diagram:

1. Confirm every displayed runtime component exists in the tested manifests.
2. Confirm every AWS managed service appears in the retained campaign evidence.
3. Confirm the identity arrows match the current ADR and authorization tests.
4. Confirm the async path includes the outbox and completion return path.
5. Confirm historical diagrams are visibly dated/labeled.
6. Confirm the current diagram does not imply browser-to-ledger correlation.
7. Have the Infra and API maintainers separately review the figure.

## Export Requirements

- Maintain the editable `.drawio` source.
- Export SVG for deck placement and PNG at 2x for review/sharing.
- Use a transparent or template-matched background.
- Keep all labels legible at full-slide view.
- Record the source file and export hash in the presentation asset inventory.
