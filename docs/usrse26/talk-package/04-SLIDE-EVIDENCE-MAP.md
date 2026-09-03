# Slide Evidence Map

This document is the claim-control layer for the deck. It does not replace the
canonical `USRSE26-EVIDENCE-WORKING/CLAIM-EVIDENCE-MATRIX.md`. It translates
that matrix into slide production decisions.

## Evidence Maturity Labels

- **Historical fact:** supported by source, diagrams, or repository history;
  not presented as a measured experiment.
- **Currently implemented:** present in reviewed code and supported by focused
  tests or retained UX evidence.
- **Experimentally demonstrated:** observed in one or more retained local or
  AWS experiments with a stated scope.
- **Not tested:** a boundary or future question, never a positive capability
  claim.

## Source Revision Ledger

| Evidence set | Exact revision |
|---|---|
| API Gateway platform source | `OSC-APIGateway@b66cf12430fb086a83957950aeed5aa435fab42e` |
| Chaincode source | `OSC-Chaincode@743df2d41a1ac845dc4600317aedf21cc0b0024e` |
| AWS run 1 Infra execution | `OSC-IS-Infra@d82693ae962f089c0c1ede97312c1c81030a0e3a` |
| AWS run 1 final evidence | `OSC-IS-Infra@d5975ce615104c85046af4a6d37999110e29f248` |
| AWS run 2 final evidence | `OSC-IS-Infra@25aefb8ec4bc14c681b4608e7ff0b4f45e939880` |
| Historical AWS Artifact Submission source | `OSC-Artifact-Submission@fcfdb3e6df9137509df84e012ac17de40bf2a706` |
| Post-campaign Artifact Submission reconciliation | `OSC-Artifact-Submission@9f167efdc95767f2fa16673923b28980a63adc43` |
| Historical UX evidence | `OSC-WebApp@07e2a0faf0093fc7a25e8f628213a14e42038e4d` |
| Accessibility evidence | `OSC-WebApp@16b18d31360104198021be7e619069f8d334da1b` |
| Infra reproducibility remediation | `OSC-IS-Infra@4d735abc3665dc1fb8e03f2b8f5aab7d54ce4574` |
| Local correlation execution/evidence creation | `OSC-IS-Infra@a60032dec7ae8a7f931a01224bc6ceb806449782` |
| Local correlation wording/checksum correction | `OSC-IS-Infra@0fedf45687c5b5e083082075414113aa39ebe20e` |

Historical AWS results remain bound to their historical source revisions.
Post-campaign remediation must never be described as having run on AWS unless a
new campaign actually tests it there.

## Slide 1 - Beyond the Ledger

**Claim:** OSC-IS is an experimental research software product for scientific
artifact management and provenance.

**Maturity:** Historical fact and current product framing.

**Source:** Accepted submission PDF; canonical evidence review.

**Required qualifier:** "Experimental" must appear visually or be spoken in
the opening minute.

**Do not say:** deployed product, service for researchers, production platform.

## Slide 2 - A File Is Not a Scientific Record

**Claim:** OSC-IS is designed to connect files with metadata, workflows,
contributors, organizations, fingerprints, and accepted revisions.

**Maturity:** Product intent; implementation examples exist.

**Sources:** Accepted abstract; WebApp UX evidence README; API artifact and
workflow models.

**Required qualifier:** This is the problem hypothesis. No adoption or measured
researcher outcome is available.

**Do not say:** ordinary storage cannot preserve provenance, users need this,
researcher productivity improved.

## Slide 3 - The Prototype Worked, and Exposed Its Limits

**Claim:** The historical prototype connected portal, Gateway, relational data,
messaging/workers, and Fabric through VMs and Compose, enabling learning while
exposing coupling and reproducibility problems.

**Maturity:** Historical fact plus engineering interpretation.

**Sources:** Historical Draw.io diagrams; accepted abstract; repository history;
final engineering review.

**Required qualifier:** Diagrams are historical conceptual views and do not
perfectly represent current code.

**Do not say:** production failed, researchers experienced outages, the old
architecture was insecure.

## Slide 4 - Put Responsibilities at the Right Boundary

**Claim C01:** "We separated portal authorization from chaincode invariants and
tested both boundaries."

**Claim C02:** "In the tested scenarios, cross-organization reads, writes,
administration, and direct Fabric identity access were denied."

**Claim C15:** "Fabric transactions were submitted with organization service
identities; the experiment does not demonstrate individual cryptographic
authorship."

**Maturity:** Experimentally demonstrated; high confidence for tested cases.

**Run 1 evidence:**

- `OSC-IS-Infra@d5975ce:docs/usrse26/platform-evidence/20260902a/fabric/provenance-and-authorization.json`

**Run 2 evidence:**

- `OSC-IS-Infra@25aefb8:docs/usrse26/e2e-evidence/2026-09-02-e2e20260902/platform-evidence/aws-stack/summary.json`

**Metric:** Six recorded authorization controls passed in each run.

**Required qualifier:** Tested scenarios only. Individual attribution depends
on trusted Gateway audit metadata.

**Do not say:** zero-trust, comprehensive authorization proof, every user signs
the ledger.

## Slide 5 - The Product After Separation

**Claim C11:** "The experimental interface presents provenance-centered
artifact, workflow, and version-history states responsively using deterministic
evidence fixtures."

**Maturity:** Currently implemented; high confidence for visual states.

**Evidence:**

- `OSC-WebApp@07e2a0f:docs/usrse26/ux-evidence/README.md`
- `OSC-WebApp@07e2a0f:docs/usrse26/ux-evidence/final/home-desktop-1440x900.png`
- `OSC-WebApp@07e2a0f:docs/usrse26/ux-evidence/final/home-mobile-390x844.png`
- `OSC-WebApp@07e2a0f:docs/usrse26/ux-evidence/final/provenance-history-desktop-1440x900.png`

**Metric:** Five final screenshots in the complete UX evidence set; 390x844 and
1440x900 explicitly exercised, plus a 320-pixel overflow journey.

**Required qualifier:** Fixture data is synthetic. The screenshots do not prove
a live ledger transaction or usability impact.

**Do not say:** production UI, researcher-tested, live blockchain screenshot.

## Slide 6 - Deployment Is Part of Product Quality

**Claim C08:** "Reviewed source produced six credential-free, SBOMed,
High/Critical-scanned, non-root images deployed by immutable digest in a
disposable environment."

**Maturity:** Experimentally demonstrated; medium-high confidence within the
reviewed campaign.

**Evidence:**

- `OSC-IS-Infra@d5975ce:docs/usrse26/platform-evidence/20260902a/artifacts/scan-summary.json`
- `OSC-IS-Infra@d5975ce:docs/usrse26/platform-evidence/20260902a/artifacts/ecr-deployment.json`
- `OSC-IS-Infra@25aefb8:docs/usrse26/e2e-evidence/2026-09-02-e2e20260902/webapp-artifact-manifest.json`
- `OSC-IS-Infra@25aefb8:docs/usrse26/e2e-evidence/2026-09-02-e2e20260902/platform-evidence/validation-summary.json`

**Metric:** Six images; zero retained High/Critical scan findings.

**Required qualifier:** Disposable experiment. Medium/Low vulnerability counts,
remote protection settings, and a comprehensive security assessment are not
part of this claim.

**Do not say:** secure supply chain, vulnerability-free, production topology.

## Slide 7 - Evidence, Not Architecture Theater

**Claim C09:** "We ran live browser edge smoke plus independently validated
API-to-ledger integration."

**Browser evidence:**

- `OSC-IS-Infra@25aefb8:docs/usrse26/e2e-evidence/2026-09-02-e2e20260902/aws-live.cy.ts`
- `OSC-IS-Infra@25aefb8:docs/usrse26/e2e-evidence/2026-09-02-e2e20260902/live-browser-results.txt`
- `OSC-IS-Infra@25aefb8:docs/usrse26/e2e-evidence/E2E-VALIDATION-REPORT.md`

**Metric:** Final live Chrome smoke: 3 passed, 0 failed, 0 console
warnings/errors.

**Claim C17:** "A disposable local two-organization Fabric deployment
correlated one authenticated API submission across the transactional outbox,
RabbitMQ command, worker, organization Ledger Gateway, Fabric commit,
completion event, listener, and final API state."

**Correlation evidence:**

- `OSC-IS-Infra@0fedf45:docs/usrse26/correlation-evidence/20260902-local/CORRELATED-PROVENANCE-TRACE-REPORT.md`
- `OSC-IS-Infra@0fedf45:docs/usrse26/correlation-evidence/20260902-local/trace-manifest.json`
- `OSC-IS-Infra@a60032d:docs/usrse26/correlation-evidence/20260902-local/source-revisions.json`
- `OSC-IS-Infra@0fedf45:docs/usrse26/correlation-evidence/20260902-local/checksums.sha256`

**Metric:** Correlation `usrse26-e2e-20260902-local-003`; one Fabric revision;
zero duplicate revision observed; cross-organization API and Fabric reads both
HTTP 403; 7/7 corrected trace hashes verified.

**Required qualifier:** Five direct records plus two bounded inferences. Local
Kind/Fabric/RabbitMQ/PostgreSQL, not AWS, Amazon MQ, or a browser mutation.

**Do not say:** full browser-to-ledger E2E, audit-complete trace, all boundaries
directly observed.

## Slide 8 - Failure Became a Test Case

**Claims C04-C06:** Controlled dependency interruptions recovered in two
independent AWS runs.

| Observation | Run 1 | Run 2 | Evidence |
|---|---:|---:|---|
| Ledger Gateway recovery | 46 s | 46 s | Run 1 resilience summary; Run 2 AWS recovery summary |
| RabbitMQ/worker recovery | 223 s | 226 s | Run 1 resilience summary; Run 2 AWS recovery summary |
| Alternate peer accepted | 6 s | 6 s | Run 1 resilience summary; Run 2 AWS recovery summary |

**Recovery evidence:**

- `OSC-IS-Infra@d5975ce:docs/usrse26/platform-evidence/20260902a/resilience/summary.json`
- `OSC-IS-Infra@25aefb8:docs/usrse26/e2e-evidence/2026-09-02-e2e20260902/platform-evidence/aws-recovery/summary.json`

**Claim C07:** "Argo CD self-healed drift and completed measured rollout and
rollback using immutable revisions."

| Observation | Run 1 | Run 2 |
|---|---:|---:|
| Drift self-heal | 3 s | 3 s |
| Rollout | 13 s | 14 s |
| Rollback | 13 s | 13 s |

**GitOps evidence:**

- `OSC-IS-Infra@d5975ce:docs/usrse26/platform-evidence/20260902a/gitops/summary.json`
- `OSC-IS-Infra@25aefb8:docs/usrse26/e2e-evidence/2026-09-02-e2e20260902/platform-evidence/aws-gitops/summary.json`
- `OSC-IS-Infra@25aefb8:docs/usrse26/e2e-evidence/2026-09-02-e2e20260902/platform-evidence/aws-post-rollback/summary.json`

**Required qualifier:** One observed ledger revision in each controlled recovery
case. Small, disposable environment; RabbitMQ was single-instance and the
public edge had one healthy NLB target.

**Do not say:** SLO, high availability, disaster recovery, exactly once, edge
failover.

## Slide 9 - Trust Must Be Usable and Reviewable

**Claim C10:** "Automated and manual regression checks target WCAG 2.2 AA; this
is not certification or a legal compliance opinion."

**Accessibility evidence:**

- `OSC-WebApp@16b18d3:docs/ACCESSIBILITY-MANUAL-EVIDENCE-20260902.md`
- `OSC-WebApp@16b18d3:docs/evidence/accessibility-manual-20260902/SHA256SUMS.txt`

**Metric:** Manifest-backed 18 focused unit tests and 9/9 Cypress/axe journeys.
The report-level 222/222 full suite is execution history; its raw transcript is
not retained in the hashed set.

**Claim C12:** "The first AWS experiment ran for 2.25 hours with a conservative
estimated upper bound of $1.41; the independent campaign stayed below its $15
target and $20 hard stop."

**Cost evidence:**

- `OSC-IS-Infra@d5975ce:docs/usrse26/platform-evidence/20260902a/aws/cost-estimate.json`
- `OSC-IS-Infra@d5975ce:docs/usrse26/platform-evidence/20260902a/aws/teardown-proof.json`
- `OSC-IS-Infra@25aefb8:docs/usrse26/e2e-evidence/E2E-VALIDATION-REPORT.md`

**Claim C13:** "After teardown, authoritative service inventories found no live
experiment resources; tag-index lag was separately reconciled."

**Teardown evidence:**

- `OSC-IS-Infra@d5975ce:docs/usrse26/platform-evidence/20260902a/aws/teardown-proof.json`
- `OSC-IS-Infra@d5975ce:docs/usrse26/platform-evidence/20260902a/aws/inventory-parity.json`
- `OSC-IS-Infra@25aefb8:docs/usrse26/e2e-evidence/2026-09-02-e2e20260902/inventory-parity-final.json`
- Root `USRSE26-FINAL-ENGINEERING-REVIEW.md`

**Required qualifiers:** Accessibility regression, not certification. Zero
retained High/Critical image findings, not zero vulnerabilities. Cost estimate,
not invoice. No live **experiment** resources, not an empty AWS account.

## Slide 10 - Discipline Made the Prototype Falsifiable

**Claim C14:** "OSC-IS is an experimental product prototype; production
readiness, HA, DR, adoption, and measured researcher impact have not been
demonstrated."

**Maturity:** Not tested; high-confidence boundary statement.

**Sources:** Canonical unsupported-claims register; final engineering review;
AWS E2E report; UX evidence README.

**Required spoken boundaries:**

- No production researcher deployment.
- No adoption or measured impact data.
- No load, soak, capacity, SLO, backup/restore, regional failure, or DR test.
- No individual cryptographic authorship.
- No accessibility certification.

**Do not weaken this slide to make the result sound larger.** Its restraint is
part of the engineering contribution.

## Claims Reserved for Q&A or Appendix

### Clean-checkout remediation - C16

The Infra bootstrap and Artifact Submission branch reconciliation were verified
locally after the historical AWS campaigns. Use only if asked about
reproducibility or branch integration.

- Infra: `4d735abc3665dc1fb8e03f2b8f5aab7d54ce4574`.
- Artifact Submission merge: `9f167efdc95767f2fa16673923b28980a63adc43`.
- Evidence: `docs/usrse26/remediation/INFRA-INTEGRATION-REPRODUCIBILITY-REPORT.md`.
- Scope: clean Windows/WSL checkout and focused local checks; not AWS or remote
  PR-governance evidence.

### Secret reconciliation - C18

The local manifest reapply preserved canonicalized data hashes for all seven
application credential Secrets, and transient runtime-secret files were absent
after both runs.

- Evidence: `OSC-IS-Infra@a60032d:docs/usrse26/correlation-evidence/20260902-local/secret-reconciliation-hashes.json`.
- Scope: local Kind gate, not every future environment or rotation path.

## Final Pre-Export Claim Audit

Search the deck and speaker notes for these terms before exporting:

- `production`
- `end-to-end` or `E2E`
- `exactly once`
- `highly available` or `HA`
- `disaster recovery` or `DR`
- `WCAG compliant` or `certified`
- `secure`
- `researchers use`
- `$1.41`
- `zero resources`
- `sign` or `signature`

Each occurrence must either match the safe wording above or explicitly state a
limitation.
