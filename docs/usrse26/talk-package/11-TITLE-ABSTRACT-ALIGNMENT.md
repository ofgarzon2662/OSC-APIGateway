# Title and Abstract Alignment

## Recommendation

Keep the accepted conference title in the program:

> OSC-IS: Research Software Infrastructure for Scientific Artifact
> Preservation, Provenance, and Reproducible Collaboration

Use this display title on the opening slide:

> Beyond the Ledger: Engineering OSC-IS as a Research Software Product

Place the accepted title in smaller type beneath it or in the speaker notes.
This preserves the accepted submission while giving the audience a concise
signal that the talk is about engineering lessons rather than a product pitch
for blockchain.

## Why the Display Title Works

- **Beyond the Ledger** says that provenance matters, but the talk covers the
  surrounding product responsibilities.
- **Engineering** directly addresses the RSE audience.
- **Research Software Product** supports the intended framing: sustained value,
  quality, and usability rather than a one-time project demonstration.
- The title does not imply adoption, production readiness, or measured impact.

## Accepted Abstract Versus Final Talk

The accepted abstract promises:

- Motivation for artifact preservation, provenance, and reproducibility.
- A web application and backend API.
- Relational metadata, object storage, asynchronous processing, and a
  provenance layer.
- Cloud-native deployment exploration.
- Engineering tradeoffs, artifact lifecycle, metadata, maintainability, and
  lessons for RSE teams.
- A brief connection to AI-assisted scientific work.

The final outline fulfills those promises but changes the emphasis. It spends
less time listing components and more time answering the reviewers' questions:

| Reviewer concern | Response in the talk |
|---|---|
| Abstract is primarily descriptive | Slides 3-4 explain the responsibility boundary and its tradeoff. |
| Limited evaluation evidence | Slides 7-9 provide repeated recovery, GitOps, authorization, UX, supply-chain, cost, and teardown evidence. |
| Limited adoption or impact evidence | Slides 2 and 10 explicitly state that no production researcher deployment or impact study exists. |
| Too much scope | One through-line: discipline made the prototype testable as a product. |
| Need practical takeaways | Slide 10 gives three transferable RSE lessons. |
| Need lessons learned | The prototype, identity boundary, evidence layers, known edge limitation, and maturity boundaries are presented as lessons. |

## Abstract Claims That Need Careful Delivery

### "Scalable"

The accepted abstract mentions engineering tradeoffs for scalable systems. The
talk should not claim that OSC-IS was load-tested or proved scalable. Use:

> We evaluated deployment patterns that can support future scaling, but did not
> run load, soak, or capacity tests.

### "Useful to scientific communities"

No production researcher study exists. Use:

> The interface is a product hypothesis designed around inspectable artifacts,
> workflows, organizations, and history; researcher usability and adoption are
> future evaluation work.

### "Auditability and trust"

Avoid implying that blockchain automatically guarantees truth. Use:

> The permissioned ledger preserves accepted revisions, fingerprints, and
> transaction evidence. Trust still depends on Gateway policy, organization
> identity, secure delivery, and usable presentation.

### "AI-assisted scientific work"

Keep this to one short point near the close:

> As AI increases the volume and speed of generated research outputs, recording
> inputs, versions, transformations, and accepted history becomes more useful.

Do not make AI-assisted coding a separate architecture story. If mentioned,
distinguish acceleration from assurance: AI helped produce changes; tests,
review, and evidence established confidence.

## Optional Revised Abstract

Use this only if the organizers request an updated program abstract. Do not
silently replace the accepted abstract.

> Scientific artifacts are more than stored files: their value depends on
> metadata, workflow context, organizational responsibility, and an inspectable
> history of accepted change. OSC-IS is an experimental research software
> product that combines a researcher-facing portal, asynchronous services, and
> Hyperledger Fabric provenance. This talk follows the product's evolution from
> a VM and Docker Compose prototype toward a reproducible, GitOps-managed AWS
> experiment. Rather than presenting a technology inventory, it focuses on
> engineering decisions and their evidence: separating portal authorization
> from ledger invariants, representing two research organizations, correlating
> asynchronous submissions, measuring controlled recovery and rollback,
> deploying reviewed images by immutable digest, and making provenance visible
> through an accessible interface. Two disposable AWS campaigns repeated
> recovery and GitOps measurements, while local integration evidence exposed
> the limits of the validation layers. OSC-IS has not yet been deployed to
> production researchers; production readiness, adoption, and measured impact
> remain future work. The practical lesson for RSE teams is that disciplined
> boundaries, automated deployment, failure testing, and explicit claim limits
> can turn a working prototype into a more credible and testable product
> hypothesis.

## Program-Safe Short Description

> An evidence-backed engineering account of evolving OSC-IS from a VM-based
> provenance prototype into a testable research software product, including
> identity boundaries, GitOps deployment, controlled recovery, and honest
> maturity limits.

## Final Decision Checklist

- Confirm whether the conference permits a display-title variation.
- Keep the accepted title in metadata, submission records, and the final PDF
  filename.
- Never imply that the revised abstract was the version reviewed by the panel.
- Make the no-adoption and experimental-prototype statements visible, not only
  verbal.
- Use "product" consistently, but do not imply a production service.
