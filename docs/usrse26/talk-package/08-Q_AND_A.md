# Q&A Bank

The preferred answer pattern is: direct answer, design reason, evidence, limit.
Most answers should take 20-35 seconds.

## Product and Research Value

### Has OSC-IS been used by researchers?

Not in production yet. OSC-IS is an experimental product prototype, and we do
not have adoption or measured researcher-impact data. The current evidence
supports architecture, deployment, recovery, authorization, and interface
behavior. A researcher usability study is a logical next evaluation step.

### Why call it a product rather than a project?

"Product" changes what we consider part of quality. The API, ledger, deployment,
failure recovery, security controls, evidence, and user experience all have to
serve one coherent lifecycle. It does not mean OSC-IS is a production service;
it describes the engineering lens.

### What is a scientific artifact in this system?

It is a research output plus the metadata needed to understand it: a file
manifest and fingerprint, contributor and organization, related workflow,
status, and accepted version history. The design can represent datasets,
software, configuration, workflow outputs, logs, and analysis products.

### How does this relate to FAIR principles?

OSC-IS is FAIR-inspired rather than a claim of FAIR certification. Structured
metadata, identifiers, organization context, and inspectable history can
support findability, accessibility, interoperability, and reuse, but a full
FAIR assessment would require explicit metadata profiles, governance, and
community evaluation.

## Blockchain and Provenance

### Why use blockchain instead of only PostgreSQL?

PostgreSQL remains the operational metadata store. Fabric is used for a
permissioned record of accepted provenance events across organizations, where
stable history and organization boundaries are the point. The useful question
is not whether blockchain replaces a database; it does not. The question is
whether a shared, append-oriented provenance boundary is worth its complexity
for participating organizations. OSC-IS is still testing that product
hypothesis.

### Does blockchain guarantee that the research is true?

No. It can preserve what authorized participants accepted and make later
changes inspectable. It cannot prove that an input measurement was correct or
that the scientific interpretation is valid. Trust also depends on identity,
Gateway policy, software delivery, and governance.

### What exactly is recorded on the ledger?

The demonstrated flow records provenance-related artifact and workflow state,
including stable identifiers, accepted revisions, fingerprints, organization
context, and transaction evidence. Large artifact files belong in object
storage; the ledger is not used as a bulk file store.

### Does every researcher sign a Fabric transaction?

No. The prototype uses organization service identities for Fabric transactions.
Individual user attribution is stored as trusted Gateway audit metadata. That
kept the prototype manageable while preserving organization boundaries, but it
is not individual cryptographic non-repudiation. Selected per-user credentials
could be introduced if future governance requires them.

### Why keep authorization checks in chaincode after moving roles to the Gateway?

They protect different boundaries. The Gateway owns portal authentication,
membership, roles, and caller tenancy. Chaincode still verifies the submitting
organization and ledger invariants, so a client cannot bypass the Gateway and
declare a different organization or invalid transition.

### What are NSG and Citizen Science in the experiment?

They are the two organization contexts used to test multi-organization
membership and ledger isolation. The tests covered cross-organization reads,
writes, administrative behavior, and direct Fabric identity access. That is
evidence for those scenarios, not a comprehensive security proof.

## Architecture

### Why an asynchronous submission path?

Fabric submission can take longer and fail independently of the initial API
request. The transactional outbox, RabbitMQ, worker, completion event, and
listener separate user-facing request handling from ledger processing while
making pending and retry states explicit. The cost is more integration surface,
which is why correlation and failure testing matter.

### Did you use Kafka?

No. The demonstrated messaging path used RabbitMQ, with Amazon MQ providing the
managed RabbitMQ service in AWS. Kafka was not required or evidenced for this
workflow.

### Is the old OSC-API or Fabric Bridge still required?

Not for the demonstrated EKS path. Those components are associated with legacy
or compatibility paths around the VM implementation. The EKS experiment used
organization-specific Ledger Gateways to communicate with Fabric. Compatibility
code may still exist, but it should not be presented as part of the tested EKS
architecture.

### Why EKS?

We used EKS to evaluate declarative deployment, immutable workloads,
organization-specific services, GitOps reconciliation, failure injection, and
disposable infrastructure. It is not a claim that Kubernetes is mandatory or
the final production architecture. The experiment made operational behavior
measurable.

### Why not use only managed serverless services?

Fabric and its identity/network behavior are not a natural fit for a completely
serverless design. We did use managed services where they reduced undifferentiated
operations, such as Amazon MQ, while retaining containerized components where
we needed protocol and deployment control. Future design should continue to
compare complexity and cost against actual usage.

### Was the AWS design highly available?

No. The experiments tested controlled recovery of selected dependencies. Amazon
MQ was single-instance, PostgreSQL was in-cluster on EBS, and the public NLB had
one healthy target under the retained topology. We did not test regional
failure, production SLOs, or disaster recovery.

## Evidence and Testing

### Was this a full browser-to-blockchain E2E test?

No. We ran live browser edge smoke plus a separately validated API-to-ledger
integration path. A local Kind run then correlated one authenticated API request
through the asynchronous backend to a Fabric revision and final API state. A
future browser-to-ledger claim would require one disposable authenticated
browser mutation correlated through every boundary and rendered back in the UI.

### Why are two links in the local trace called bounded inferences?

The retained package directly records the request, outbox, RabbitMQ messages,
Fabric transaction, final API state, and drained queues. It does not retain a
separate worker-to-Ledger-Gateway request record or listener-consumption record.
Those links are strongly inferred from matched completion and final-state
evidence, so we label them rather than calling the trace audit-complete.

### Does one revision prove exactly-once delivery?

No. One ledger revision was observed in each controlled case, and no duplicate
revision was observed. Universal exactly-once behavior would require broader
replay, concurrency, retry, and fault-injection testing.

### Are the recovery numbers performance guarantees?

No. They are controlled observations from two disposable AWS runs: 46 seconds
for the Ledger Gateway case, 223 and 226 seconds for RabbitMQ/worker, and 6
seconds for the alternate-peer case. They are not SLOs and were not produced
under load.

### Why are the two RabbitMQ recovery times much longer?

That path includes broker and worker interruption plus retry and outbox
publication behavior, so it has a wider recovery loop than switching to an
alternate peer. The experiment measured the result but was not a tuning study.
The useful next step would be to define a target, instrument each stage, and
then tune retries against that target.

### What did GitOps add beyond deployment automation?

It gave us a declared revision to compare with runtime state. We could introduce
drift, observe reconciliation, roll forward to an immutable revision, and roll
back to a known-good revision. That turns configuration history and recovery
into reviewable product evidence.

### How do you know the screenshots are not cherry-picked?

The UX captures use deterministic fixtures and are covered by a checksum
manifest at an exact WebApp revision. They demonstrate rendering states, not
live ledger behavior. The talk intentionally pairs them with separate backend
evidence rather than asking one screenshot to prove both.

## Security and Accessibility

### Is OSC-IS secure?

We do not make a comprehensive security claim. The experiment tested scoped
organization identity and denials, workflow configuration requesting short-lived
AWS credentials, exact secret access, immutable image digests, SBOM generation,
non-root images, and zero retained High/Critical image-scan findings. That image
result covers six deployed roles and eight scan records including two
replacements; current WebApp governance still has 15 High production dependency
findings. A full threat model, penetration test, all-severity remediation policy,
and remote governance verification remain.

### Were static AWS keys stored in GitHub?

No static AWS credential was introduced by the experiment. Workflow definitions
request GitHub OIDC credentials for a scoped AWS role, and workload access is
configured with scoped AWS identity. The retained campaigns do not prove a
remote Actions run; remote environment approvals and trust policy remain controls
that must be verified by repository/account administrators.

### Is the portal WCAG compliant?

We do not claim certification or offer a legal compliance opinion. Automated
and manual regression checks target WCAG 2.2 AA. The retained evidence includes
18 focused unit tests, 9 of 9 Cypress/axe journeys, and manual keyboard, focus,
semantics, error, responsive, and contrast review. Screen-reader and native
zoom testing remain gaps.

### How did you address npm supply-chain risk?

The affected JavaScript repositories disable dependency lifecycle scripts by
default, use lockfile-based installation, scan lockfiles and repository hooks,
and explicitly rebuild only reviewed lifecycle packages. CI actions and images
are pinned where practical, and dependency builds are separated from jobs that
hold AWS deployment identity. These controls reduce risk; they do not guarantee
that all future malicious packages are blocked.

## Cost, Sustainability, and Operations

### Did the AWS run cost $1.41?

The first run lasted about 2.25 hours. Exact timestamps and the planned rate
yield a nearest-cent estimate of $1.41; a conservative cent-level ceiling is
$1.42. Real-time provider billing was unavailable at teardown, so neither is an
invoice or realized cost. The separate campaign stayed below its $15 target and
$20 hard stop; those Run 2 cost-control values are report-level rather than a
retained provider invoice.

### How do you know teardown was complete?

Terraform destruction was followed by scoped authoritative service inventories
and parity checks. Those APIs found no live experiment resources. A tag index
temporarily retained stale records, so we reconciled it against EC2 and other
service APIs and later confirmed the tag query reached zero. We do not claim
the AWS account contained no unrelated resources.

### Could a small research team operate this?

Not yet as a production service without additional simplification and
operations work. The EKS experiment demonstrated reproducibility and testable
behavior, but production ownership would require SLOs, monitoring, backups,
security review, incident response, and a cost model tied to real usage. A
hybrid or simpler deployment may remain appropriate depending on the team.

## Software Engineering and AI

### What is the main software-engineering lesson?

Architecture improved when responsibilities became explicit, and confidence
improved when claims were tied to reproducible evidence. The specific tools
matter less than treating authorization, deployment, failure, security, and UX
as one product system.

### What role did AI-assisted coding play?

AI accelerated exploration, implementation, documentation, and test creation.
It did not decide the architecture or establish correctness. Human intent,
source review, threat boundaries, reproducible tests, independent review, and
evidence curation remained necessary. That is the practical distinction between
code generation and software engineering.

### What would you do next?

First, complete normal GitFlow integration and remote review. Then correct and
test the public-edge topology, add one authenticated browser-to-ledger journey,
perform screen-reader/native-zoom testing, and design a small researcher
usability study. Production operations and scaling tests should follow actual
adoption requirements, not precede them by assumption.
