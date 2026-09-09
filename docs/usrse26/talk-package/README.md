# US-RSE 2026 OSC-IS Talk Production Package

This directory is the writing and evidence-control package for the accepted
US-RSE 2026 talk:

> OSC-IS: Research Software Infrastructure for Scientific Artifact
> Preservation, Provenance, and Reproducible Collaboration

The recommended display title is:

> Beyond the Ledger: Engineering OSC-IS as a Research Software Product

The accepted title should remain in the conference program unless the program
chairs invite a change. The shorter display title can be used on the opening
slide, with the accepted title as a subtitle or in the speaker notes.

## Communication Job

In 15 minutes, show an RSE audience that OSC-IS became more credible when the
team treated deployment, authorization, failure recovery, security, and user
experience as parts of one research software product. The talk is not a claim
of production readiness or researcher adoption. It is an evidence-backed
account of an experimental product becoming more disciplined.

## Package Map

1. [Story spine](01-STORY-SPINE.md) - thesis, arc, tone, and claim boundaries.
2. [Slide blueprint](02-SLIDE-BY-SLIDE-BLUEPRINT.md) - ten slides with purpose,
   content, evidence, visuals, and timing.
3. [Speaker script](03-FIFTEEN-MINUTE-SPEAKER-SCRIPT.md) - a rehearsable script
   targeted at approximately 13 minutes 50 seconds.
4. [Slide evidence map](04-SLIDE-EVIDENCE-MAP.md) - exact claims, revisions,
   evidence paths, and prohibited overstatements.
5. [Visual storyboard](05-VISUAL-STORYBOARD.md) - design direction using the
   UC San Diego/SDSC template and reviewed visual assets.
6. [Architecture brief](06-ARCHITECTURE-DIAGRAM-BRIEF.md) - what to retain,
   redraw, label, and avoid in the architecture figures.
7. [Demo and evidence plan](07-DEMO-AND-EVIDENCE-PLAN.md) - a static-first
   conference demonstration with reliable fallbacks.
8. [Q&A bank](08-Q_AND_A.md) - concise answers to likely technical and
   reviewer-driven questions.
9. [Rehearsal runbook](09-REHEARSAL-RUNBOOK.md) - production schedule, timing
   gates, review prompts, and day-of checks.
10. [Cut list](10-CUT-LIST.md) - material that should not consume the 15-minute
    slot.
11. [Title and abstract alignment](11-TITLE-ABSTRACT-ALIGNMENT.md) - how the
    evidence-driven story answers the accepted submission and reviews.
12. [Asset library](assets/README.md) - reviewed images, generated diagrams and
    plots, editable PowerPoint source, validation evidence, and provenance.
13. [Public sharing boundary](12-PUBLIC-SHARING-BOUNDARY.md) - what may be
    shared from the package and what must remain private/audit-only.

## Authoritative Inputs

The package was developed from these sources:

- Accepted submission: `USRSE26_submission_107-1.pdf`.
- Canonical claim-to-evidence package:
  `OSC-IS/USRSE26-EVIDENCE-WORKING/`.
- Final engineering review:
  `OSC-IS/USRSE26-FINAL-ENGINEERING-REVIEW.md`.
- Historical Draw.io sources and architecture exports in the OSC-IS
  documentation folder.
- UC San Diego/SDSC PowerPoint template:
  `SDSC-UCSanDiego-HSDSC(1).potx`.

Evidence references use `repository@revision:path`. They are intentionally
specific because some evidence was produced on local review branches and not
all historical artifacts are appropriate to duplicate in this repository.

## Non-Negotiable Claim Boundaries

- Say **experimental product prototype**, not production-ready.
- Say **live browser edge smoke plus a separately validated API-to-ledger
  integration**, not full browser-to-ledger E2E.
- Say **controlled recovery experiments**, not high availability or disaster
  recovery.
- Say **organization service identities**, not individual researcher
  cryptographic signatures.
- Say **automated and manual regression checks target WCAG 2.2 AA**, not WCAG
  certified or legally compliant.
- Say **estimated cost from exact timestamps (nearest-cent $1.41)**, or use a
  **$1.42 conservative cent-level ceiling**; neither is an AWS invoice or
  realized cost.
- Say **no duplicate ledger revision was observed in the controlled cases**,
  not exactly-once delivery is guaranteed.
- State plainly that OSC-IS has not yet been launched to production researchers
  and has no adoption or measured impact data.
- If current release readiness is discussed, say that WebApp is **NOT READY**
  because governance found 15 High production dependency findings; the other
  four primary repositories are ready only with manual gates, and the combined
  five-repository release is not approved.

## Recommended Working Order

1. Read the story spine and slide blueprint together.
2. Challenge every slide against the evidence map.
3. Build the slides from the visual storyboard and architecture brief.
4. Rehearse from the script, then reduce the script to cue phrases.
5. Use the Q&A bank for adversarial rehearsal.
6. Apply the cut list if the timed run exceeds 14 minutes.

The Markdown files and PNG previews render cleanly on GitHub and in VS Code
Markdown Preview. The OneDrive mirror also contains the original source images,
editable historical diagrams, and deck-production files.
