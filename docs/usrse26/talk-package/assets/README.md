# Presentation Asset Inventory

Binary presentation assets are intentionally not committed on this branch. The
Markdown package remains lightweight and renders cleanly on GitHub. A OneDrive
mirror contains the reviewed images next to the same documents for local deck
production.

## Reviewed UX Images

Source revision:
`OSC-WebApp@07e2a0faf0093fc7a25e8f628213a14e42038e4d`.

| File | SHA-256 | Intended use |
|---|---|---|
| `home-desktop-1440x900.png` | `fc31a376848d49a84788bd3bc21ee96d7fea6d5e43a6df3dd99edca5be00757c` | Slide 5 primary product view or Slide 2 research-context crop |
| `home-mobile-390x844.png` | `beb01e77172d7a9a414cc14c351a893c8b9267c066a40f76b80f0dbba7e3622c` | Slide 5 responsive inset or accessibility appendix |
| `provenance-history-desktop-1440x900.png` | `6ba01c1f478f0f931b8ce6d9a649aa89469e171314f4858ee6a2e0ca86cc4f40` | Slides 1, 5, or 9; accepted history and transaction evidence |

These files are deterministic UX captures, not AWS-run screenshots or proof of
a live Fabric transaction. Preserve the visible demonstration-data labeling or
add an equivalent slide caption.

## Historical Architecture Sources

The OneDrive source package includes these existing exports and their editable
Draw.io sources remain in the OSC-IS architecture documentation folder:

- `OSC-IS_Components_Simple.drawio.png` - historical component/event-driven
  view.
- `OSC-IS Deployment_Infra Diagram MVP(1).png` - intermediate ECS/EC2/on-prem
  hybrid design.
- `SequenceDiagramSubmitArtifact.png` - historical asynchronous submission
  sequence.

Use them as design/history inputs. Do not present them as the current EKS
experiment without the corrections in
`../06-ARCHITECTURE-DIAGRAM-BRIEF.md`.

## Template

The presentation template is stored in OneDrive as:

`SDSC-UCSanDiego-HSDSC(1).potx`

The template is not duplicated in Git. Build the deck from its existing master
and layouts.

## Still to Produce

- Simplified historical VM/Compose SVG and PNG.
- Gateway-versus-chaincode responsibility-boundary SVG and PNG.
- Current disposable EKS experiment SVG and PNG.
- Recovery measurement graphic.
- GitOps drift/rollout/rollback graphic.
- Optional 60-90 second local product walkthrough.
- Final deck `.pptx` and offline `.pdf`.

Each generated asset should receive:

- a descriptive filename;
- a source or evidence note;
- a SHA-256 hash;
- an `Historical`, `Currently implemented`, `Experimentally demonstrated`, or
  `Not tested` label where relevant;
- alt text in the final deck.

## Storage Layout in OneDrive

```text
USRSE/2026/
  SDSC-UCSanDiego-HSDSC(1).potx
  OSC-IS-USRSE26-TALK-PACKAGE/
    README.md
    01-...md through 11-...md
    assets/
      reviewed-ux/
      historical-architecture/
      generated-diagrams/
      recordings/
      checksums.sha256
```

Only reviewed UX captures and existing historical diagrams should be copied
immediately. Generated diagrams, recordings, and deck exports should be added
after their own review.
