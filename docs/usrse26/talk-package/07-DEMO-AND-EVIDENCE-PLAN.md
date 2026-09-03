# Demo and Evidence Plan

## Recommendation

Do not depend on a live AWS deployment during a 15-minute conference talk. The
existing evidence is sufficient for the selected claims, the experiments were
properly torn down, and recreating the environment only to show it live adds
cost and failure risk without strengthening the story.

Use a **static-first evidence demonstration** built from reviewed screenshots,
sanitized summaries, and simple measurement graphics. Keep a 60-90 second
local or recorded product walkthrough as an optional complement, not as the
source of the technical claims.

## What the Demonstration Must Prove

The audience should be able to see four things:

1. A researcher encounters artifacts, workflows, and history rather than cloud
   or blockchain complexity.
2. The product has a clear identity boundary between portal authorization and
   ledger invariants.
3. Failure, drift, rollback, and cleanup produced inspectable observations.
4. Every claim has a visible scope and limitation.

## Main-Deck Evidence Assets

### Product experience

- Home desktop screenshot.
- Home mobile screenshot, if space permits.
- Provenance history desktop screenshot.
- Visible label: `Representative demonstration records`.

### Architecture

- Simplified historical VM/Compose diagram.
- Responsibility-boundary diagram.
- Disposable EKS experiment diagram.

### Measurements

- Paired recovery observations: `46/46`, `223/226`, and `6/6` seconds.
- Paired GitOps observations: drift `3/3`, rollout `13/14`, rollback `13/13`
  seconds.
- One observed ledger revision in each retained controlled recovery case.

### Delivery and operations

- Six deployed image roles: non-root, SBOMed, and deployed by digest; eight
  retained scan records, including two replacements, report zero High/Critical
  image-scan findings.
- First run duration and estimate: about 2.25 hours; nearest-cent $1.41 from
  exact timestamps, or $1.42 as a conservative cent-level ceiling.
- Final authoritative inventory: no live experiment resources.

Do not display raw private endpoints, account identity output, certificates,
secrets, Terraform state, or internal identity material.

## Optional 75-Second Product Walkthrough

This walkthrough can be recorded locally before the conference and embedded as
a video or represented by three click-through slides.

### 0-15 seconds - Home

- Show that OSC-IS is about scientific artifacts, workflows, and history.
- Point to the representative-record label.
- Say: "This is deterministic demonstration data, not a production researcher
  submission."

### 15-35 seconds - Artifact detail

- Open one representative artifact.
- Identify title, organization, contributor, file manifest, and fingerprint.
- Avoid claiming that the browser action is connected to a live ledger.

### 35-60 seconds - Provenance history

- Open accepted history.
- Point to version, accepted event, transaction ID, and artifact fingerprint.
- Say: "The UI state is a repeatable fixture; the AWS backend evidence
  separately demonstrated ledger revisions and transaction identifiers."

### 60-75 seconds - Workflow context

- Show the related workflow or return to the artifact context.
- Close with: "The user sees a scientific record; the infrastructure preserves
  and tests the accepted history behind it."

## Technical Evidence Sequence

The most reliable conference sequence is a reveal across Slides 7-9:

1. Reveal the three evidence layers.
2. Highlight that browser edge smoke and API-to-ledger validation are separate
   evidence layers.
3. Reveal the two-run recovery measurements.
4. Reveal GitOps drift/rollout/rollback measurements.
5. End with accessibility, image provenance, estimated cost, and teardown.

This tells a stronger story than a terminal recording because the audience can
compare the evidence in one glance.

## Evidence Graphic Specifications

### Recovery graphic

- Use one row per interruption.
- Show Run 1 and Run 2 as adjacent labeled dots.
- Use whole seconds exactly as retained.
- Put `controlled observation, not SLO` directly below the title.
- Add `one ledger revision observed` as a shared annotation.

### GitOps graphic

- Use a three-stage line: drift -> rollout -> rollback.
- Label each stage with both runs.
- Show the immutable revision change and return to known-good state without
  exposing internal repository URLs.
- Add `post-rollback provenance and authorization checks passed` as a concise
  footer.

### Evidence-layer graphic

- Browser lane ends at public rendering and edge behavior.
- AWS API lane begins at an API request and ends at ledger/API state.
- Local trace lane shows the correlation path.
- Use solid circles for direct records and outlined circles for bounded
  inferences.
- Explicitly label `not browser-to-ledger`.

### Teardown graphic

- Show `Terraform resources destroyed` and `authoritative parity` separately.
- Run 1: 73 Terraform resources destroyed.
- Run 2: 73 base plus 19 edge resources destroyed.
- Prefer the final phrase `No live experiment resources found` over `zero AWS
  resources`.
- Put `tag-index lag reconciled with service APIs` in notes or a small footer.

## Conference Fallback Ladder

1. **Primary:** Static slides with reviewed screenshots and measurement
   graphics.
2. **Fallback A:** Embedded local recording stored in the deck folder.
3. **Fallback B:** Three product screenshots with verbal narration.
4. **Fallback C:** Speaker continues from the architecture and evidence slides
   without any walkthrough.

The main argument must remain complete at every level of the fallback ladder.

## Optional New Validation Before the Talk

No new AWS run is required for the current talk claims. Run AWS again only if:

- deployable source revisions materially change;
- the presentation wants to claim corrected public-edge failover;
- an AWS parity claim is made for post-campaign remediation; or
- the team needs a new live demonstration for reasons outside this talk.

If a new run is authorized, it should be a short, disposable confirmation
campaign with:

- approved account and region verification before apply (keep the exact account
  identifier in restricted operator material, never in this shareable package);
- an explicit cost target and hard stop;
- immutable source revisions and image digests;
- a unique run ID on every resource;
- build jobs separated from credential-bearing deploy jobs;
- no static AWS credentials;
- mandatory teardown and authoritative service inventory;
- a sanitized, checksum-covered evidence package;
- no attempt to create production longevity or user-adoption evidence.

## Missing Evidence Worth Discussing, Not Hiding

- No authenticated browser submission correlated to the rendered history.
- No corrected public-edge failover run after the NLB single-target finding.
- No load, soak, capacity, SLO, backup/restore, regional-failure, or DR test.
- No screen-reader or native 200%/400% browser-zoom evidence.
- No researcher usability study, adoption, or impact metric.
- No individual researcher cryptographic signing.
- No provider invoice tied to the exact AWS experiment.

These gaps belong on the final slide or in Q&A. They are also a credible product
research agenda.

## Evidence Freeze Procedure

Before final slide export:

1. Verify the canonical evidence-package checksums.
2. Verify all slide numbers against the claim-evidence matrix.
3. Record the exact source revision for every copied visual.
4. Export diagrams and compute SHA-256 hashes.
5. Store a PDF export of the deck next to the source deck.
6. Store the talk script version used for the final rehearsal.
7. Record the deck commit and evidence-package revision in a small release note.
8. Never refresh evidence numbers manually from memory.

## Success Criteria

- The talk can be delivered with no network connection.
- The product walkthrough can fail without breaking the argument.
- Every measurement is legible and traceable.
- Every screenshot is correctly labeled as fixture, local, or AWS evidence.
- The audience hears both the engineering result and its limitations.
- Q&A can return to exact evidence paths without opening private operational
  data.
