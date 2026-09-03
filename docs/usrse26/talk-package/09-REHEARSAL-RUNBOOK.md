# Rehearsal Runbook

## Delivery Target

- **Talk:** 15 minutes.
- **Questions:** 5 minutes.
- **Rehearsed talk target:** 13:30-13:50.
- **Hard stop:** 14:15 during rehearsal. Any longer requires a content cut.
- **Slide count:** 10 main slides. Appendix slides do not enter the timed talk.

The goal is not to memorize every sentence. The goal is to make the reasoning
sequence so familiar that a slide failure or audience interruption does not
break the story.

## Production Schedule

This schedule uses September 11 as the working target for the early deck review
with Suba. Adjust dates if the conference provides a different formal deadline.

### September 2-3 - Freeze the Argument

- Review the story spine and ten-slide blueprint.
- Confirm the display title and accepted-title treatment.
- Confirm all numeric claims against the evidence map.
- Decide whether Slide 5 uses one screenshot or a three-state strip.
- Mark all missing visuals as design work, not missing evidence.

**Exit gate:** The talk can be explained verbally in two minutes without
showing slides.

### September 4-6 - Build the Visual Evidence

- Redraw the three architecture figures from the diagram brief.
- Create the recovery and GitOps measurement graphics.
- Crop and place the reviewed interface screenshots.
- Add evidence-scope labels and alt text.
- Build only the ten main slides before considering an appendix.

**Exit gate:** Every slide has one clear job and one primary visual.

### September 7 - Complete the First Deck

- Add speaker notes with source revisions and claim limits.
- Export a PDF and render all slides to images.
- Review at projected size and in grayscale.
- Remove visual density before polishing transitions.

**Exit gate:** A colleague can understand the argument from the slides and
notes without repository access.

### September 8-9 - Internal Review

- Deliver one untimed explanatory run.
- Deliver one timed run without interruption.
- Ask a reviewer to challenge the blockchain choice, identity model, no-user
  evidence, EKS decision, and production boundaries.
- Record every question that required more than 45 seconds to answer.
- Revise the Q&A bank and slides only where confusion is repeated.

**Exit gate:** Two consecutive runs finish below 14:15 with all required
boundaries intact.

### September 10-11 - Review Handoff

- Freeze the evidence numbers.
- Run the claim-audit search from the evidence map.
- Verify all links, embedded media, fonts, and notes.
- Export the review PDF and a self-contained PowerPoint.
- Provide Suba a one-paragraph summary of the thesis and a list of known
  limitations before the review.

**Exit gate:** Review package is readable offline and has no unsupported claim.

### After the Review - Practice, Do Not Expand

- Incorporate only changes that improve clarity, correctness, or timing.
- Do not add new architecture scope because there is available slide space.
- Practice weekly until two weeks before the talk, then three short runs per
  week.
- During the final week, rehearse the exact equipment and fallback path.

## Rehearsal Modes

### Mode 1 - Argument Run

No slides. Explain the talk from these ten cues:

1. Product, not blockchain pitch.
2. File versus scientific record.
3. Prototype as learning instrument.
4. Gateway policy versus ledger invariants.
5. User sees artifact, context, history.
6. Deployment as product quality.
7. Separate evidence layers.
8. Measured recovery and GitOps.
9. Usable, secure, accountable trust.
10. Discipline plus honest boundaries.

Target: 4 minutes. If this is unclear, slides will not fix it.

### Mode 2 - Script Run

Read the full script aloud while advancing slides. Mark sentences that feel
written rather than spoken. Replace them with shorter language, but do not
weaken evidence qualifiers.

Target: 14:30 or less on the first pass.

### Mode 3 - Timed Cue Run

Use one cue card or Presenter View notes containing only:

- the first sentence of each slide;
- the critical metric or claim boundary;
- the transition to the next slide.

Target: 13:30-13:50 for two consecutive runs.

### Mode 4 - Adversarial Run

Ask a reviewer to interrupt with these questions:

- Why blockchain?
- Where are the researchers?
- Is this really end to end?
- Why use Kubernetes for a prototype?
- Can a user forge an organization?
- Does one revision prove exactly once?
- Is it WCAG compliant?
- Did AWS really cost $1.41?
- What happens if the only healthy NLB target fails?
- What did AI do versus what did engineering prove?

The speaker should answer in 20-35 seconds and return to the story.

### Mode 5 - Failure Run

Practice with:

- no network;
- embedded video unavailable;
- Presenter View unavailable;
- architecture animation skipped;
- a 12-minute warning from the moderator;
- one audience interruption at Slide 7.

The talk must still reach Slides 8-10. Evidence and closing boundaries cannot
be sacrificed to recover time.

## Per-Slide Timing Calls

| Slide | End target | Warning threshold | Recovery action |
|---|---:|---:|---|
| 1 | 0:35 | 0:45 | Remove affiliation expansion |
| 2 | 1:50 | 2:05 | Ask only two provenance questions aloud |
| 3 | 3:15 | 3:35 | Remove component enumeration |
| 4 | 4:45 | 5:05 | Read two responsibilities per side |
| 5 | 6:10 | 6:30 | Omit screenshot-evidence explanation; keep fixture label |
| 6 | 7:40 | 8:00 | Name only EKS, Amazon MQ, and Argo CD |
| 7 | 9:10 | 9:35 | Describe local trace without enumerating every boundary |
| 8 | 10:55 | 11:20 | State recovery table, summarize GitOps in one sentence |
| 9 | 12:20 | 12:45 | Keep accessibility and teardown; cut supply-chain detail |
| 10 | 13:50 | 14:15 | Deliver three lessons and closing line only |

## Content Quality Checklist

- The problem appears before the architecture.
- The prototype is treated respectfully.
- The responsibility boundary is the central design decision.
- EKS is framed as an experiment, not the goal.
- Browser smoke and API-to-ledger evidence remain separate.
- Recovery numbers are called observations, not SLOs.
- The single-healthy-target edge limitation is not hidden if HA is discussed.
- UX screenshots are labeled as deterministic demonstration records.
- Accessibility is described as regression testing that targets WCAG 2.2 AA.
- AWS cost is an estimated upper bound.
- The final slide says there has been no production researcher deployment.
- The last sentence is about engineering discipline, not technology.

## Delivery Notes

- Pause after "The turning point was responsibility, not Kubernetes."
- Slow down for the service-identity tradeoff. It is subtle and likely to
  generate questions.
- Give the recovery table five silent seconds before interpreting it.
- Do not read source revisions aloud.
- Look at the audience for the final maturity boundary. It should sound
  confident, not apologetic.
- End cleanly after "usable, testable, and honest." Do not add an improvised
  roadmap.

## Review Prompt for a Human Colleague

> Please review this as a 15-minute US-RSE engineering talk. Identify where the
> argument becomes descriptive, where a claim exceeds its evidence, where a
> visual requires too much explanation, and which single lesson you remember
> five minutes after the talk. Do not ask for more technology detail unless it
> is necessary to understand a tradeoff.

## Final 24-Hour Checklist

- Store `.pptx`, `.pdf`, and any video in the same offline folder.
- Open the files from that folder on the presentation laptop.
- Confirm fonts and animations render without OneDrive/network access.
- Bring a PDF fallback and a static screenshot fallback for any media.
- Confirm the title, name, affiliation, and contact information.
- Confirm there are no private endpoints, credentials, or internal-only data.
- Run once at conversational pace, then stop editing.
