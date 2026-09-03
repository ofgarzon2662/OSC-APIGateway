# Cut List

The talk succeeds through focus, not coverage. This list protects the
15-minute story from material that is true or interesting but not essential.

## Must Keep

These elements carry the argument and may not be cut:

- A file is not yet a scientific record.
- The original prototype enabled learning.
- Portal authorization moved to the Gateway while ledger invariants remained
  in chaincode.
- The organization service-identity tradeoff.
- The distinction between browser edge smoke and API-to-ledger integration.
- At least one paired recovery measurement and one GitOps result.
- The fixture label on product screenshots.
- No production researcher deployment or measured impact.
- The experimental-prototype boundary.
- The closing lesson that discipline made the system testable and honest.

## First Cuts When Over Time

1. Remove the exact list of browser-smoke assertions.
2. Reduce the historical architecture to four nodes.
3. Name only the Ledger Gateway and RabbitMQ recovery rows; leave peer recovery
   visible but do not narrate it.
4. Summarize GitOps as "drift, rollout, and rollback repeated across two runs"
   while leaving exact values on the slide.
5. Remove the Run 2 cost target and hard stop; retain the first-run estimate and
   teardown evidence.
6. Reduce the supply-chain controls to `SBOM + non-root + digest`.
7. Remove the spoken tag-index explanation and reserve it for Q&A.
8. Remove the AI-assisted coding paragraph.

## Move to Appendix or Q&A

- Complete AWS service inventory.
- Full GitHub Actions workflow design.
- OIDC trust-policy details.
- Exact IAM actions and secret ARNs.
- Dependency supply-chain scanner design and package allowlists.
- Complete source revision ledger.
- Terraform resource counts beyond the teardown summary.
- Python and npm reproducibility remediation details.
- Artifact Submission branch reconciliation history.
- All seven application-secret reconciliation hashes.
- Exact correlation, artifact, and Fabric transaction IDs.
- Detailed Postman collection strategy.
- Chaincode refactoring and coverage details.
- Why Kafka was not selected.
- Full accessibility manual checklist.
- Full future production-readiness backlog.

## Exclude From the Talk

- Internal branch-cleanup chronology.
- Git merge conflict history.
- Political or approval history around EKS.
- Comparisons of individual contributors or prior code quality.
- Descriptions such as "crappy," "flaky," or "bad" for the prototype.
- Raw console screenshots, Terraform plans, CI logs, JSON, or test transcripts.
- A repository-by-repository status report.
- SonarQube removal details.
- Malware package IOC lists.
- AWS account number.
- Private endpoints, identity output, credentials, certificates, or secrets.
- Live cloud deployment as theater.
- A broad feature roadmap.
- A claim that AI produced the architecture.

## Technology Naming Budget

The following names are enough for the main talk:

- Angular.
- API Gateway/NestJS, if implementation context is needed.
- PostgreSQL.
- RabbitMQ/Amazon MQ.
- Hyperledger Fabric.
- EKS.
- Argo CD.

Do not add S3, CloudFront, ECR, NLB, EBS, KMS, Secrets Manager, Terraform,
Cypress, axe, Trivy, CycloneDX, and every worker name to the same slide. Mention
those only where they carry a specific evidence point.

## Story Decisions Already Made

- This is a product-engineering talk, not a system tour.
- The responsibility boundary is more important than the migration chronology.
- Evidence is more important than a live demonstration.
- UX is part of trust, not a cosmetic side story.
- EKS is an evaluated mechanism, not the definition of modernity.
- No adoption data is better than invented proxy metrics.
- Limitations belong in the main talk, not only in backup slides.

## Scope-Control Test

Before adding any content, ask:

1. Does this help explain the research problem?
2. Does this reveal an engineering tradeoff?
3. Does this provide evidence for the thesis?
4. Does this teach a transferable RSE lesson?

If the answer is no to all four, cut it. If the answer is yes to only one but
the content needs more than 20 seconds, move it to Q&A.
