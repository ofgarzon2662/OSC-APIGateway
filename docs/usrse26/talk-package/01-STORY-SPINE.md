# Story Spine

## One-Sentence Thesis

OSC-IS became a more credible research software product when engineering
discipline moved provenance out of an isolated blockchain feature and into an
end-to-end product concern spanning authorization, deployment, recovery,
security, evidence, and user experience.

## Audience Promise

An RSE should leave with three practical ideas:

1. Put identity and policy at the boundary best equipped to own them, while
   retaining domain invariants in the provenance layer.
2. Treat deployment and failure recovery as testable product behavior rather
   than operational work that begins after development.
3. Use evidence labels and explicit limitations to make an experimental system
   trustworthy without pretending it is production-ready.

## Narrative Arc

### 1. Start With the Research Problem

A file can preserve bytes and still lose the scientific record. Research teams
need to know what an output is, which workflow produced it, who contributed it,
which organization accepted it, what changed, and which revision is being
examined. The human problem is continuity and trust, not simply storage.

### 2. Respect the Prototype

The original VM and Docker Compose implementation was useful. It made the
architecture concrete, exposed integration points, and proved that the team
could connect a portal, asynchronous workers, and a Fabric ledger. Its
limitations were diagnostic, not embarrassing.

The key lesson was that a working prototype can still place responsibilities
at the wrong boundary. Portal user access logic had leaked toward the
blockchain. Deployment was tied to mutable hosts and manual configuration.
Failures were incidents to debug, not controlled behaviors to measure. The UI
made the infrastructure visible but did not make its value obvious to a
researcher.

### 3. Show the Boundary Decision

The architectural turning point was not Kubernetes. It was responsibility.

- The API Gateway owns portal authentication, membership, roles, and caller
  tenancy.
- Hyperledger Fabric chaincode owns ledger invariants, organization boundaries,
  stable keys, valid transitions, and idempotency behavior.
- Organization service identities submit Fabric transactions. Individual user
  attribution is retained in trusted Gateway audit metadata, not as a claim of
  per-user cryptographic authorship.

This decision reduced complexity in the chaincode without making the ledger
trust the client.

### 4. Treat the System as a Product

Once the boundary was clearer, the work expanded from components to the whole
product:

- A researcher-facing interface presents artifacts, workflows, organizations,
  and accepted history.
- A transactional outbox and RabbitMQ path make asynchronous submission
  observable and recoverable.
- Organization-specific Ledger Gateways connect application services to the
  two-organization Fabric network.
- GitOps, immutable image digests, SBOMs, scanning, and scoped AWS identity make
  the deployment reviewable.
- Accessibility and responsive states make provenance inspectable without
  requiring command-line expertise.

### 5. Make Evidence the Climax

The talk earns its claims with bounded experiments:

- Two independent AWS runs repeated controlled recovery timings.
- Argo CD detected drift and completed measured rollout and rollback.
- Tested cross-organization operations were denied at the Gateway and Fabric
  boundaries.
- A local Kind run correlated one API submission through the asynchronous path,
  using five direct records and two bounded inferences, to one Fabric revision.
- Reviewed images were non-root, SBOMed, scanned for High/Critical findings, and
  deployed by digest.
- The first AWS experiment had a conservative estimated upper bound of $1.41,
  and authoritative inventories found no live experiment resources after
  teardown.

The point is not that EKS is impressive. The point is that the architecture
became falsifiable: drift, failure, identity errors, and deployment state could
be tested and inspected.

### 6. End With Honest Product Maturity

OSC-IS is still experimental. It has not been launched to production
researchers. It has no adoption study, impact metric, production SLO, HA or DR
claim, or accessibility certification. Those are not footnotes to hide. They
define the next product questions.

The achievement is narrower and more useful: discipline turned a fragile
prototype into a testable product hypothesis with traceable evidence and a
clear path for iteration.

## Recurring Contrast

Use one contrast throughout the deck:

| Before | After |
|---|---|
| Components happened to run | Product behavior was defined and tested |
| User policy leaked toward the ledger | Gateway policy and ledger invariants have distinct owners |
| Host configuration was part of the system | Deployment state is declared and reconciled |
| Failure meant manual debugging | Failure became a controlled experiment with a recovery time |
| Provenance was a backend capability | Provenance is visible as accepted history in the interface |
| Confidence came from a successful demo | Confidence comes from evidence plus stated limitations |

Do not frame this as old technology versus new technology. Frame it as implicit
assumptions versus explicit, testable responsibilities.

## Emotional Rhythm

1. **Recognition:** research outputs become difficult to trust over time.
2. **Humility:** the prototype worked and taught us where it was fragile.
3. **Clarity:** a boundary decision simplified the product.
4. **Momentum:** cloud-native practices made behavior measurable.
5. **Proof:** recovery, rollback, authorization, and teardown have numbers.
6. **Restraint:** the evidence is meaningful, but the product is not yet
   production-ready or adopted.
7. **Invitation:** other RSE teams can apply the same discipline before their
   prototypes become infrastructure.

## Tone

- Speak as an engineer reporting what was learned, not as a vendor selling a
  platform.
- Credit the original prototype for making learning possible.
- Prefer concrete verbs: separated, denied, measured, restored, correlated,
  verified, and tore down.
- Explain technology only when it carries a design lesson.
- Let limitations increase credibility instead of apologizing for them.

## Phrases to Reuse

- "A file is not yet a scientific record."
- "The turning point was responsibility, not Kubernetes."
- "Deployment is part of product quality."
- "We turned failures into measured test cases."
- "The blockchain is evidence infrastructure, not the user experience."
- "This is an experimental product prototype, not a production service."
- "AI accelerated implementation; engineering discipline decided what counted
  as evidence."

## Phrases to Avoid

- "We solved reproducibility."
- "Blockchain guarantees trust."
- "Exactly once."
- "Fully end to end."
- "Production-ready."
- "Highly available."
- "WCAG compliant."
- "Researchers love it" or any adoption implication.
- "It only cost $1.41."
- "AI built the platform."

## Final Takeaway

Research infrastructure becomes sustainable when teams treat architecture,
operations, security, evidence, and usability as one engineering problem. The
ledger matters, but the discipline around it is what makes provenance usable.
