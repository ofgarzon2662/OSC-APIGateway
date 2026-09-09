# Visual Source Data

These small, presentation-safe tables drive the editable measurement charts
and Kubernetes topology summary. They intentionally omit the AWS account,
private addresses, endpoint names, and credentials.

## Evidence Lineage

- Recovery observations: `OSC-IS-Infra@d5975ce` and
  `OSC-IS-Infra@25aefb8` recovery summaries.
- GitOps observations: `OSC-IS-Infra@d5975ce` and
  `OSC-IS-Infra@25aefb8` GitOps and post-rollback summaries.
- Kubernetes summary: `OSC-IS-Infra@25aefb8` node, pod, and Argo CD snapshots.

The measurements describe two separate disposable experiments. They are not
service objectives, availability guarantees, or production observations.
