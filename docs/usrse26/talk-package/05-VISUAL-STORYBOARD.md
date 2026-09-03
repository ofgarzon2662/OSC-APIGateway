# Visual Storyboard

## Visual Thesis

The deck should feel like a calm engineering case study: a small number of
precise diagrams, real interface evidence, and measurements with generous
space. It should not resemble a cloud vendor architecture pitch, a product
marketing deck, or a dense project status report.

The visual progression should mirror the argument:

1. Human research context.
2. A simple historical system.
3. A clarified responsibility boundary.
4. A visible product experience.
5. A testable deployment.
6. Evidence and measured failure.
7. Honest lessons and boundaries.

## Template Direction

Use the provided `SDSC-UCSanDiego-HSDSC(1).potx` template as the design source.
Its inspected properties are:

- 16:9 widescreen slide size.
- Theme: `NPACI/SDSC (logo) template`.
- Major font: Calibri Light.
- Minor font: Calibri.
- Accent colors: cyan `#00C6D7`, orange `#FC8900`, warm gray `#B6B1A9`, yellow
  `#FFCD00`, magenta `#D462AD`, and green `#6E963B`.
- Useful native layouts include Title Slide, Section Header, Title and Content,
  Two Content, Image Right + Copy, Image Left + Copy, Picture with Caption,
  Title Only, Big Bold Statement - Reverse, and their reverse variants.

Use the template's master, logos, and institutional footer rather than
recreating them. Keep OSC visual identity through the screenshots and a small
OSC wordmark, not by recoloring the entire SDSC deck.

## Palette Use

- **Navy/dark template background:** titles, closing statement, architecture
  boundaries.
- **White:** evidence and interface slides where screenshots need fidelity.
- **Cyan:** primary flow, confirmed behavior, and the user-facing provenance
  thread.
- **Orange:** limitations, controlled interruptions, and historical state.
- **Green:** successful recovery or completed validation.
- **Warm gray:** contextual lines and untested/future material.

Never rely on color alone. Pair status color with labels such as `Observed`,
`Controlled experiment`, `Historical`, or `Not tested`.

## Typography and Density

- Opening title: template title size, ideally 50 points or larger.
- Slide titles: template size, never below 35 points.
- Body: 20-24 points when possible; 18 points is the floor for evidence labels.
- Measurement numerals: 30-44 points.
- Keep titles to one line.
- Prefer one sentence or three short bullets to explanatory paragraphs.
- Put evidence provenance in speaker notes; use a short source revision in a
  14-16 point footer only when the evidence would otherwise be ambiguous.

## Asset Policy

- Use the reviewed OSC interface screenshots listed in `assets/README.md`.
- Use original Draw.io sources to make new architecture exports.
- Use real, properly licensed scientific or institutional photography if an
  additional human image is needed.
- Do not use AI-generated people or laboratory images.
- Do not use generic blockchain chains, coins, glowing cubes, or stock
  cybersecurity imagery.
- Do not use screenshots of terminals, raw JSON, or GitHub Actions logs in the
  main ten slides. Translate them into a number, timeline, or compact flow.

## Slide Compositions

### Slide 1 - Beyond the Ledger

**Template layout:** Title Slide or Section Header - Reverse.

**Composition:** Left-aligned title over a dark field. A narrow vertical crop of
the provenance-history interface can occupy the right third, but a text-only
title slide is acceptable and may be stronger.

**Visible labels:** Name, affiliation, accepted topic. Add a small
`Experimental product prototype` line.

**Avoid:** cloud logos, architecture, or a list of technologies.

### Slide 2 - A File Is Not a Scientific Record

**Template layout:** Image Left + Copy.

**Composition:** A clear scientific-work image on the left. On the right, the
single statement "Bytes tell us what was saved. Provenance tells us what it
means." Place four short questions beneath it.

**Alternative:** Crop the reviewed home hero image if licensing or sourcing a
separate photograph is inconvenient.

### Slide 3 - The Prototype Worked, and Exposed Its Limits

**Template layout:** Title Only.

**Composition:** A simplified six-node historical architecture across the
center. A small orange `Historical prototype` label sits above it. Under the
diagram, use two statements: `Fast learning` and `Implicit responsibilities`.

**Diagram rule:** Redraw from the historical Draw.io source; do not paste the
full dense component diagram into the slide.

### Slide 4 - Put Responsibilities at the Right Boundary

**Template layout:** Comparison.

**Composition:** Gateway on the left and chaincode on the right, separated by a
visible boundary. Four responsibilities per side. A single request arrow enters
the Gateway and a transaction arrow enters Fabric. Put denial shields at both
boundaries.

**Footer:** `Organization service identity; user attribution in Gateway audit
metadata.`

**Avoid:** more than two organizations or internal class names.

### Slide 5 - The Product After Separation

**Template layout:** Picture with Caption or Image Right + Copy.

**Composition:** Use the home-page screenshot as the primary visual. Add three
small text labels outside the screenshot: `Artifact`, `Context`, `History`.
Alternatively use the provenance-history screenshot full bleed with one
callout around accepted revisions and transaction evidence.

**Fixture label:** `Representative demonstration record` must remain visible.

### Slide 6 - Deployment Is Part of Product Quality

**Template layout:** Title Only.

**Composition:** One current architecture diagram occupying no more than 70% of
the canvas. Put Git + Argo CD above the runtime, users and CloudFront/S3 on the
left, application services in the center, and the two-organization Fabric
boundary on the right. Use a small AWS cloud outline only if it improves
containment.

**Evidence label:** `Disposable AWS experiment`.

**Avoid:** the complete AWS service-icon catalog. Use text labels and at most
five recognizable service icons.

### Slide 7 - Evidence, Not Architecture Theater

**Template layout:** Title and Content.

**Composition:** Three horizontal lanes:

1. Browser edge smoke.
2. AWS API-to-ledger behavior.
3. Local correlated trace.

Give each lane a scope statement and one result. A legend marks `direct record`
and `bounded inference`. End all three lanes at the evidence package, not at a
generic checkmark.

**Avoid:** calling the three lanes a testing pyramid; they differ by boundary,
not only by test size.

### Slide 8 - Failure Became a Test Case

**Template layout:** Two Content.

**Composition:** Left side holds three paired recovery measurements. Right side
holds three GitOps measurements. Use paired dots or thin timelines, not bars
that imply a performance target. Keep the two runs visually adjacent.

**Footer:** `Two independent disposable AWS runs. Controlled observations, not
SLOs.`

**Avoid:** green-only success coding and false precision beyond whole seconds.

### Slide 9 - Trust Must Be Usable and Reviewable

**Template layout:** Image Left + Copy.

**Composition:** Crop the provenance-history screenshot on the left. On the
right, use four evidence statements with large numerals: `9/9`, `6 images`,
`$1.41 estimate`, `0 live experiment resources`.

Each number needs a noun and limitation. For example, never display `$1.41`
without `conservative estimated upper bound`.

### Slide 10 - Discipline Made the Prototype Falsifiable

**Template layout:** Big Bold Statement - Reverse.

**Composition:** One closing sentence in large type:

> The ledger preserves accepted history. Engineering discipline makes it
> usable, testable, and honest.

Put the three lessons along the bottom as short phrases. Place the experimental
maturity boundary in a visible footer, not hidden in notes.

## Diagram and Screenshot Treatment

- Export Draw.io diagrams at 2x or as SVG for PowerPoint placement.
- Use 16:9-aware crops. Do not stretch screenshots.
- Crop browser chrome unless the URL or live endpoint is evidence; no URL is
  needed for fixture screenshots.
- Preserve enough page context to show that the history screen is a product
  experience, not a floating mockup.
- Do not enlarge raster images beyond their native dimensions.
- Use thin 1-2 point callout lines and one accent color per screenshot.

## Accessibility for the Deck

- Add concise alt text to every image and diagram.
- Confirm all text/background pairs meet WCAG AA contrast even though the deck
  itself is not a WCAG certification artifact.
- Ensure reading order follows the visual order.
- Do not encode `historical`, `observed`, and `not tested` by color alone.
- Use direct labels on measurement graphics instead of a detached legend.
- Check slides in grayscale and on a standard projector preview.
- Provide the exported PDF to attendees if conference policy permits.

## Visual Quality Gate

Before the deck is considered ready:

1. Render every slide to PNG.
2. Inspect every slide at full size, not only as thumbnails.
3. Confirm no title wraps, no label is below the font-size floor, and no
   screenshot is pixelated.
4. Confirm the fixture labels and maturity boundaries remain readable.
5. Confirm every data visual matches the evidence map exactly.
6. Run the talk from the projected/slideshow view and check remote-room
   legibility from several feet away.
