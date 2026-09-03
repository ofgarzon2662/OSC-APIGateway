# Slide-by-Slide Blueprint

## Deck Constraints

- **Session:** 15-minute talk plus 5 minutes of questions.
- **Target delivery:** 13:50, leaving approximately 70 seconds of operational
  margin.
- **Recommended count:** 10 slides, including title and close.
- **Narrative ratio:** roughly 40% problem and design lessons, 40% evidence,
  20% product experience and boundaries.
- **Visual rule:** one idea and one primary visual per slide.
- **Evidence rule:** every number and maturity claim must map to
  [04-SLIDE-EVIDENCE-MAP.md](04-SLIDE-EVIDENCE-MAP.md).

## Slide 1 - Beyond the Ledger

**Time:** 0:00-0:35

**Subtitle:** Engineering OSC-IS as a Research Software Product

**Purpose:** Establish that this is an engineering lessons talk about an
experimental product, not a blockchain product pitch.

**On-slide content:**

- Display title.
- Fernando Garzon, San Diego Supercomputer Center, UC San Diego.
- Small line: "Scientific artifact preservation, provenance, and reproducible
  collaboration."

**Visual:** Minimal UC San Diego/SDSC title layout. A restrained crop of the
provenance history interface may sit behind or beside the title only if it
remains legible. Do not open with a Kubernetes diagram.

**Key sentence:** "This is a story about what changed when we stopped treating
provenance as a blockchain feature and started treating OSC-IS as a research
software product."

**Transition:** "The reason starts with a deceptively simple object: a file."

## Slide 2 - A File Is Not a Scientific Record

**Time:** 0:35-1:50

**Purpose:** Ground the architecture in a researcher problem.

**On-slide content:**

> Bytes tell us what was saved. Provenance tells us what it means.

Use four short questions around one artifact image:

- What produced it?
- Which inputs and version?
- Who and which organization accepted it?
- What changed after the first submission?

**Visual:** One real or licensed scientific-work image, or a tight crop from the
reviewed home-page screenshot. Avoid generic blockchain iconography.

**Evidence:** This slide states motivation, not adoption or measured impact.

**Key sentence:** "Ordinary storage is necessary, but it does not preserve the
relationships a future collaborator needs to judge or reproduce an output."

**Transition:** "Our first implementation made those relationships concrete,
and it also made our engineering debt visible."

## Slide 3 - The Prototype Worked, and Exposed Its Limits

**Time:** 1:50-3:15

**Purpose:** Honor the original implementation while explaining why it had to
evolve.

**On-slide content:**

- VMs plus Docker Compose connected the portal, workers, message queues, and
  Fabric.
- It proved the workflow and accelerated learning.
- It also coupled identity, host configuration, and integration behavior in
  ways that were difficult to reproduce and test.

**Visual:** A simplified redrawing of the historical architecture: WebApp ->
Gateway -> queue/workers -> Fabric, with VM/Compose as the deployment boundary.
Use no more than six labeled blocks.

**Evidence label:** "Historical prototype."

**Key sentence:** "The prototype was successful because it showed us not only
that the system could work, but exactly where successful demos were masking
fragility."

**Do not say:** "The old system was bad" or imply it was in production.

**Transition:** "The first important upgrade was not EKS. It was deciding which
component should be responsible for what."

## Slide 4 - Put Responsibilities at the Right Boundary

**Time:** 3:15-4:45

**Purpose:** Present the central software architecture lesson.

**On-slide content:**

| API Gateway | Fabric chaincode |
|---|---|
| Authentication | Submitting MSP checks |
| Organization membership | Organization/ownership invariants |
| Portal roles and caller tenancy | Stable keys and valid transitions |
| Trusted user audit metadata | Ledger history and idempotency behavior |

Small tradeoff line:

> Fabric uses organization service identities; individual attribution remains
> in trusted Gateway audit metadata.

**Visual:** A two-boundary diagram with the client on the left, Gateway in the
middle, and the two-organization ledger on the right. Show denial checks at both
boundaries. Use NSG and Citizen Science as the two tested organizations.

**Evidence:** C01, C02, and C15.

**Key sentence:** "Moving portal authorization into the Gateway simplified the
chaincode, but we kept organization invariants in the ledger so a client could
not simply declare itself trusted."

**Transition:** "That separation gave us a product model we could explain to a
researcher as well as test as engineers."

## Slide 5 - The Product After Separation

**Time:** 4:45-6:10

**Purpose:** Connect architecture to an understandable researcher experience.

**On-slide content:**

- **Artifact:** output, file manifest, and fingerprint.
- **Context:** workflow, contributor, and organization.
- **History:** accepted revisions and transaction evidence.

**Visual:** Use the reviewed `home-desktop-1440x900.png` or a three-image strip
that includes the provenance-history screenshot. Mark demonstration records as
synthetic/representative.

**Evidence:** C11 and the WebApp UX revision. The interface state is fixture-
based visual evidence; AWS API/backend evidence independently demonstrates real
ledger revisions and transaction IDs.

**Key sentence:** "The blockchain is deliberately not the first thing a user
sees. The user sees a scientific record, while the product exposes Fabric where
its evidence is useful: accepted versions, fingerprints, and transaction
history."

**Transition:** "Making trust visible was one half of product quality. The
other half was making the product reproducible to operate."

## Slide 6 - Deployment Is Part of Product Quality

**Time:** 6:10-7:40

**Purpose:** Explain why the team evaluated EKS and GitOps without presenting
Kubernetes as the goal.

**On-slide content:**

- Disposable two-organization Fabric deployment.
- EKS application workloads and organization Ledger Gateways.
- Private Amazon MQ RabbitMQ service and PostgreSQL.
- ECR images by immutable digest; Argo CD reconciles declared state.
- Narrow AWS identity through OIDC and workload roles.

**Visual:** One current-state architecture diagram. Place the Git repository and
Argo CD above the runtime, not as another application microservice. Put Gateway
IAM/RBAC and Fabric invariants on opposite sides of a visible trust boundary.

**Evidence label:** "Disposable AWS experiment, not production topology."

**Evidence:** C07, C08, and the architecture/identity assessment.

**Key sentence:** "EKS was an experiment in whether we could make deployment
state reviewable, repeatable, and disposable. It was not a declaration that
every OSC-IS deployment must use Kubernetes."

**Transition:** "A diagram can describe that intention. It cannot prove the
system behaved that way."

## Slide 7 - Evidence, Not Architecture Theater

**Time:** 7:40-9:10

**Purpose:** Teach the audience how the team separated evidence layers and
avoided an inflated E2E claim.

**On-slide content:**

1. **Browser edge:** CloudFront, public catalogs, navigation, mobile layout,
   session-expired presentation, and axe checks.
2. **AWS API-to-ledger:** authorization, asynchronous submission, Fabric
   revisions, recovery, and rollback.
3. **Local correlated trace:** one request across outbox, RabbitMQ, worker,
   Ledger Gateway, Fabric, completion, listener, and final API state.

**Visual:** Three horizontal evidence lanes. Distinguish five direct trace
records from two bounded inferences with a small legend.

**Evidence:** C03, C09, C17, and C18.

**Key sentence:** "We do not call this full browser-to-ledger E2E. The browser
edge and the API-to-ledger path were validated independently, and the local
trace made the asynchronous boundaries inspectable."

**Transition:** "Once the evidence layers were explicit, failures stopped being
surprises and became experiments."

## Slide 8 - Failure Became a Test Case

**Time:** 9:10-10:55

**Purpose:** Deliver the quantitative evidence climax.

**On-slide content:**

| Controlled interruption | Run 1 | Run 2 |
|---|---:|---:|
| Ledger Gateway recovery | 46 s | 46 s |
| RabbitMQ/worker recovery | 223 s | 226 s |
| Alternate peer accepted | 6 s | 6 s |

Secondary line:

> One ledger revision observed in each retained recovery case.

GitOps callout:

- Drift self-heal: 3 s / 3 s.
- Rollout: 13 s / 14 s.
- Rollback: 13 s / 13 s.

**Visual:** A clean paired-dot or compact timeline graphic. Do not use a dense
dashboard. Use the numbers as measured observations, not service objectives.

**Evidence:** C04-C07.

**Key sentence:** "These are controlled observations from two disposable AWS
runs, not SLOs, HA, or disaster-recovery evidence. Their value is that we can
repeat and inspect them."

**Transition:** "The same discipline applied to the software supply chain, the
interface, and the cost of experimentation."

## Slide 9 - Trust Must Be Usable and Reviewable

**Time:** 10:55-12:20

**Purpose:** Unite UX, accessibility, security, and cost as trust surfaces.

**On-slide content:**

- 9/9 retained Cypress/axe journeys; manual checks target WCAG 2.2 AA.
- Six reviewed images: non-root, SBOMed, scanned for High/Critical findings,
  and deployed by digest.
- First AWS run: 2.25 hours, conservative estimated upper bound $1.41.
- Authoritative post-teardown inventory: no live experiment resources.

**Visual:** Provenance-history screenshot on one side; four short evidence facts
on the other. A small footer should carry the limits: no certification,
comprehensive security assessment, or provider invoice claim.

**Evidence:** C08, C10-C13.

**Key sentence:** "Trust is not only a ledger property. It includes whether a
researcher can inspect history, whether a reviewer can identify the deployed
image, and whether an experiment leaves untracked infrastructure behind."

**Transition:** "So what did the discipline actually change, and what remains
unproven?"

## Slide 10 - Discipline Made the Prototype Falsifiable

**Time:** 12:20-13:50

**Purpose:** Answer the reviewers directly with lessons, tradeoffs, and honest
next steps.

**On-slide content:**

Three lessons:

1. **Separate policy from invariants.** Put user roles in the Gateway and
   organization rules in the ledger.
2. **Test deployment behavior.** Measure recovery, drift, rollback, and cleanup
   as product behavior.
3. **Pair evidence with boundaries.** A narrow claim that can be reproduced is
   more useful than a broad claim supported by a demo.

Boundary footer:

> Experimental product prototype. No production researcher deployment,
> adoption metric, production readiness, HA/DR, individual cryptographic
> authorship, or WCAG certification claim.

**Visual:** One bold statement layout from the SDSC template. Avoid a roadmap
full of features.

**Closing sentence:** "The ledger preserves accepted history, but engineering
discipline is what made that history usable, testable, and honest."

**Q&A bridge:** "I would be happy to discuss the identity tradeoff, the
asynchronous recovery path, or how we kept the AWS experiments disposable."

## Timing Check

| Slide | Target end |
|---|---:|
| 1 | 0:35 |
| 2 | 1:50 |
| 3 | 3:15 |
| 4 | 4:45 |
| 5 | 6:10 |
| 6 | 7:40 |
| 7 | 9:10 |
| 8 | 10:55 |
| 9 | 12:20 |
| 10 | 13:50 |

If the rehearsal exceeds 14:15, apply the cuts in
[10-CUT-LIST.md](10-CUT-LIST.md) before speaking faster.
