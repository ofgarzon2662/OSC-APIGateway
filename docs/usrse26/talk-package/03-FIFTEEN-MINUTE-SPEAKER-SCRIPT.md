# Fifteen-Minute Speaker Script

This script is intentionally more complete than the final spoken version. Read
it aloud until the argument feels natural, then rehearse from the bold cue at
the start of each slide. The target is approximately 13 minutes 50 seconds,
leaving time for a pause, a slide delay, or one brief clarification.

## Slide 1 - Beyond the Ledger

**Cue: This is a product-engineering story, not a blockchain pitch.**

Good morning. I am Fernando Garzon from the San Diego Supercomputer Center at
UC San Diego.

OSC-IS is an experimental research software product for preserving scientific
artifacts, their context, and their accepted history. Today I want to focus less
on the list of technologies and more on what we learned while engineering the
product.

This is the story of what changed when we stopped treating provenance as a
blockchain feature and started treating deployment, identity, recovery,
security, and user experience as one product problem.

## Slide 2 - A File Is Not a Scientific Record

**Cue: Bytes are necessary; context makes them scientifically useful.**

Research teams produce datasets, software, configuration, workflow outputs,
logs, models, and analysis products. We can put all of those bytes into object
storage, but storage alone cannot answer the questions a future collaborator
will ask.

What produced this output? Which inputs and software version were involved?
Who contributed it, and through which organization? What changed after the
first submission? Which version was actually accepted?

That is the problem OSC-IS explores. An artifact is not only a file. It is the
file plus metadata, workflow context, contributors, organization, fingerprints,
and a history that can be inspected later.

I want to be precise about the maturity of this work. OSC-IS has not yet been
launched to production researchers, so I will not present adoption numbers or
researcher impact that we do not have. What I can show is the product hypothesis
and the engineering evidence we have built around it.

## Slide 3 - The Prototype Worked, and Exposed Its Limits

**Cue: The prototype was valuable because it exposed the hidden assumptions.**

The original architecture ran on a small number of virtual machines with
Docker and Docker Compose. It connected a web application, an API Gateway,
relational metadata, message queues, workers, and a Hyperledger Fabric network.

That implementation worked as a prototype. It let us learn the domain, test the
submission flow, and understand where asynchronous processing and provenance
belonged. It also exposed several assumptions that had been hidden inside a
successful demo.

Portal access logic had moved too close to the blockchain. Host configuration
and identity files were difficult to reproduce. Integration failures required
manual investigation across several services. The user interface exposed the
system, but it did not yet make the benefit of provenance obvious to a
researcher.

The lesson was not that virtual machines or Compose are wrong. The lesson was
that a prototype can run correctly while responsibilities, evidence, and
operational behavior remain implicit.

## Slide 4 - Put Responsibilities at the Right Boundary

**Cue: The turning point was responsibility, not Kubernetes.**

Our most important architectural change was to separate portal policy from
ledger invariants.

The API Gateway now owns authentication, organization membership, portal roles,
and caller tenancy. A collaborator cannot create another user or assign an
administrative role simply by changing a request. The Gateway derives the
active organization and records trusted audit metadata.

The chaincode keeps the invariants that must remain true at the ledger boundary:
the submitting organization, ownership, stable keys, valid state transitions,
and idempotency behavior. We tested denials at both layers, including direct
cross-organization Fabric access.

For this prototype, Fabric transactions use organization service identities.
That is a deliberate complexity tradeoff. Individual attribution is preserved
in trusted Gateway metadata; we are not claiming that every researcher
cryptographically signs a transaction. If future requirements demand individual
non-repudiation, the identity model can evolve without moving portal role logic
back into chaincode.

## Slide 5 - The Product After Separation

**Cue: Users should see a scientific record, not the infrastructure.**

This boundary decision also changed how we present the product.

The interface begins with three ideas. The artifact contains the output, its
manifest, and its fingerprint. Context connects it to a workflow, contributor,
and organization. History shows accepted revisions and the evidence associated
with them.

The blockchain is deliberately not the headline. Researchers should not need
to understand Linux, Kubernetes, or Fabric before they can contribute or
inspect a record. Fabric becomes visible where it adds meaning: accepted
events, file fingerprints, version history, and transaction identifiers.

The screenshots here use deterministic demonstration records. They are useful
visual and accessibility evidence, but they are not screenshots of a live
researcher deployment or proof of a live ledger transaction. The ledger
revisions and transaction identifiers were demonstrated separately through the
deployed API and backend tests.

This distinction matters. Good evidence says both what an artifact shows and
what it does not show.

## Slide 6 - Deployment Is Part of Product Quality

**Cue: We used EKS to test repeatability and disposability, not to collect
Kubernetes points.**

The next question was whether deployment itself could become reviewable and
testable.

We evaluated a disposable AWS architecture with application services and
organization-specific Ledger Gateways on EKS, a private managed RabbitMQ
service through Amazon MQ, PostgreSQL, ECR, and a two-organization Fabric
network representing NSG and Citizen Science.

Argo CD reconciled declared Git state. Images were deployed by immutable
digest. Workflow definitions request short-lived AWS credentials through GitHub
OIDC rather than static cloud keys, and workload roles were scoped to the
secrets each component required. The retained campaigns do not prove a remote
Actions run or branch-protection configuration.

EKS is not the thesis, and it is not the only acceptable future deployment.
It was a useful experiment because it let us ask falsifiable questions: Can we
recreate the environment? Can we identify exactly what image is running? Can we
detect drift? Can we roll back? Can we destroy the experiment and account for
its resources?

A cloud diagram can describe those intentions. It cannot prove them.

## Slide 7 - Evidence, Not Architecture Theater

**Cue: We separated evidence layers instead of inflating the E2E label.**

We organized validation into three evidence layers.

First, browser edge smoke exercised the live CloudFront entry point, public
catalogs, navigation, mobile behavior, expired-session presentation, overflow,
and automated accessibility rules.

Second, AWS API-to-ledger tests exercised multi-organization authorization,
the asynchronous submission path, Fabric revisions, controlled dependency
failures, and GitOps rollback.

Third, a disposable local Kind environment correlated one authenticated API
submission across the transactional outbox, RabbitMQ command, worker and Ledger
Gateway path, Fabric commit, completion event, listener, and final API state.
Five links are retained as direct records. Two links, worker-to-Gateway execution
and listener consumption, are bounded inferences from matched completion and
final-state evidence.

We therefore do not call this full browser-to-ledger end-to-end testing. The
conference-safe statement is: live browser edge smoke plus a separately
validated API-to-ledger integration path. That language is less dramatic and
more useful because another engineer can understand exactly what was tested.

## Slide 8 - Failure Became a Test Case

**Cue: Two runs, controlled interruptions, measurable recovery.**

Once the boundaries were observable, failures became test cases.

We ran two separate disposable AWS campaigns. When we interrupted the Ledger
Gateway path, the submission recovered in 46 seconds in both runs. When we
interrupted RabbitMQ and the worker, recovery took 223 and 226 seconds. When a
peer was interrupted, the alternate peer was accepted in 6 seconds in both
runs.

Each retained recovery case ended with one observed ledger revision. That does
not prove universal exactly-once delivery. It tells us that no duplicate ledger
write was observed in these controlled cases.

We also introduced GitOps drift. Argo CD self-healed it in 3 seconds in both
runs. A rollout completed in 13 and 14 seconds, and rollback completed in 13
seconds in both runs. The post-rollback provenance and authorization checks
passed.

These numbers are observations, not service-level objectives. The RabbitMQ
broker was single-instance, the public edge had a known single-healthy-target
limitation, and we did not test regional failure or disaster recovery. The
value is that the behavior is now repeatable, measurable, and open to
improvement.

## Slide 9 - Trust Must Be Usable and Reviewable

**Cue: Trust has user, software-supply-chain, and operational surfaces.**

The ledger is only one trust surface.

On the user side, automated and manual regression checks target WCAG 2.2 AA.
The retained package includes 18 focused unit tests and 9 of 9 Cypress and axe
journeys, plus keyboard, focus, heading, label, error, retry, responsive, and
contrast review. This is regression evidence, not accessibility certification.

On the delivery side, the experiment used six deployed image roles that ran as
non-root, carried SBOMs, and were deployed by digest. Eight retained scan
records, including two replacements, reported zero High or Critical findings.
That is a set of tested image-scan controls, not a claim that the product is
comprehensively secure or dependency-clean.

On the operational side, the first AWS experiment ran for about 2.25 hours.
Its exact timestamps and planned rate yield a nearest-cent estimate of one
dollar and forty-one cents; a conservative cent-level ceiling is one dollar and
forty-two cents. Neither is an invoice. After teardown, authoritative service
inventories found no live experiment resources. A separate tag index lagged
temporarily, so we reconciled it against the service APIs instead of trusting
one source.

For me, this is what treating OSC-IS as a product means: the interface makes
history states inspectable, an engineer can identify the deployed revision, and
the team can account for the experiment after it ends.

## Slide 10 - Discipline Made the Prototype Falsifiable

**Cue: Three lessons, one honest boundary.**

I will close with three lessons.

First, separate policy from invariants. Portal roles and memberships belong in
the Gateway; organization and ledger invariants remain in chaincode.

Second, deployment is part of product quality. Recovery, drift, rollback,
security controls, and teardown are product behaviors that can be tested, not
tasks to defer until production.

Third, pair evidence with boundaries. A narrow claim that another engineer can
inspect is more useful than a broad claim supported only by a successful demo.

OSC-IS remains an experimental product prototype. It has no production
researcher deployment, adoption metric, production readiness claim, high
availability or disaster-recovery evidence, individual cryptographic
authorship, or accessibility certification. Those gaps define the next product
questions rather than invalidating the engineering work already done.

AI-assisted coding helped us explore and implement faster, but it did not
replace architecture, threat modeling, tests, review, or evidence curation.
Speed came from the tool. Confidence came from engineering discipline.

The ledger preserves accepted history, but engineering discipline is what made
that history usable, testable, and honest.

Thank you.

## Optional Q&A Bridge

If time remains, add:

> I would be happy to discuss the organization identity tradeoff, the
> asynchronous recovery path, or how we kept the AWS experiments disposable.

## Script Trimming Order

If a rehearsal runs long, remove these passages in order:

1. Slide 9 sentence about tag-index lag.
2. Slide 6 sentence listing every AWS service.
3. Slide 7 sentence enumerating every browser-smoke check.
4. Slide 3 sentence enumerating the original components.
5. Slide 10 AI-assisted coding paragraph, unless the session framing makes it
   especially relevant.

Do not remove the no-adoption statement, the evidence-layer distinction, the
service-identity tradeoff, or the final maturity boundary.
