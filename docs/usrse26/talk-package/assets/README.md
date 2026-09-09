# Presentation Asset Library

This directory contains the reviewed visual evidence for the US-RSE 2026 OSC-IS
talk. The OneDrive mirror is the deck-production copy; this repository copy
keeps the generated PNGs, editable source deck, data tables, validation receipt,
and reproducible builder together.

## Start Here

- `ASSET-MANIFEST.md` maps each image to its intended slide, source evidence,
  maturity label, alt text, and claim boundary.
- `editable-source/OSC-IS-USRSE26-EDITABLE-VISUAL-ASSETS-v3.pptx` contains all
  ten generated visuals as editable PowerPoint slides. Slides 5 and 6 use native
  PowerPoint charts.
- `../tools/build-visual-assets.mjs` rebuilds the generated library with the
  first-party Artifact Tool runtime.
- `source-data/` contains the small, sanitized CSV inputs used by the two charts
  and the Kubernetes summary.
- `checksums.sha256` records the exact reviewed files.

## Folders

| Folder | Contents |
|---|---|
| `reviewed-ux/` | Five deterministic desktop and mobile product captures from `OSC-WebApp@07e2a0f` in OneDrive; originals remain in the WebApp repository. |
| `accessibility-appendix/` | Five focused accessibility captures from `OSC-WebApp@16b18d3` in OneDrive; originals remain in the WebApp repository. |
| `licensed-photography/` | The retained Pexels research-lab image and source note in OneDrive; the application copy remains in the WebApp repository. |
| `historical-architecture/` | Existing architecture PNGs plus selected editable Draw.io sources in OneDrive. |
| `generated-diagrams/` | Historical, authorization, AWS, evidence-layer, and Kubernetes diagrams. |
| `generated-plots/` | Recovery and GitOps observation charts. |
| `generated-composites/` | Product, accessibility, and trust-summary composites. |
| `editable-source/` | Editable visual-library PPTX and its validation receipt. |
| `source-data/` | Presentation-safe chart and topology data. |

## Evidence Boundaries

- The AWS material describes two separate disposable experiments, not
  production, high availability, disaster recovery, or user adoption.
- Browser evidence is a live browser edge smoke plus a separately validated
  API-to-ledger path. It is not a full browser-to-ledger E2E claim.
- The Kubernetes diagram is a sanitized rendering of a retained scheduling
  snapshot: 54 Running pods across three Ready EKS nodes. It is not a live Argo
  CD console screenshot or an intended placement policy.
- Product screenshots use deterministic synthetic records. They are not
  screenshots of live Fabric transactions.
- Accessibility checks target WCAG 2.2 AA; they are not certification or a
  legal opinion.
- The cost figure is an estimate, not an invoice.

## Validation

The editable source passed package integrity, slide-size, heading-fit, font,
first-party import, and native-chart checks. The final render test reported no
overflow. See `editable-source/visual-assets-v3.validation.json`.

The `PUBLIC-SHAREABLE` package is intentionally unchanged. Promote assets into
that package only after the final slide-by-slide privacy and claim review.
