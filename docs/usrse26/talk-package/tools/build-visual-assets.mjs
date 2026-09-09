import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const required = [
  "SKILL_DIR",
  "TMP_DIR",
  "OUTPUT_DIR",
  "UX_DIR",
  "A11Y_DIR",
  "TEMPLATE_PATH",
];
for (const name of required) {
  if (!process.env[name] || !path.isAbsolute(process.env[name])) {
    throw new Error(`${name} must be an absolute path`);
  }
}

const {
  SKILL_DIR,
  TMP_DIR,
  OUTPUT_DIR,
  UX_DIR,
  A11Y_DIR,
  TEMPLATE_PATH,
} = process.env;

const { applyPresentationChartFont, finalizePresentation } = await import(
  pathToFileURL(path.join(SKILL_DIR, "container_tools/artifact_tool_utils.mjs")).href
);

const C = {
  navy: "#182B49",
  navy2: "#244B6B",
  cyan: "#00C6D7",
  teal: "#008C95",
  orange: "#FC8900",
  green: "#6E963B",
  yellow: "#FFCD00",
  magenta: "#D462AD",
  ink: "#152D3F",
  gray: "#667784",
  warm: "#B6B1A9",
  pale: "#F2F7F8",
  paleBlue: "#EAF5F7",
  paleOrange: "#FFF2E5",
  paleGreen: "#EFF6E9",
  white: "#FFFFFF",
  red: "#B53635",
  line: "#B8C7CE",
};

const FONT = "Calibri";
const SLIDE_W = 1280;
const SLIDE_H = 720;

function addText(slide, text, position, options = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position,
    fill: options.fill ?? "none",
    line: options.line ?? { fill: "none", width: 0 },
    borderRadius: options.borderRadius,
  });
  shape.text = text;
  shape.text.style = {
    typeface: options.fontFamily ?? FONT,
    fontSize: options.fontSize ?? 24,
    bold: options.bold ?? false,
    color: options.color ?? C.ink,
    alignment: options.alignment ?? "left",
    autoFit: "none",
  };
  shape.text.verticalAlignment = options.verticalAlignment ?? "middle";
  return shape;
}

function addBox(slide, label, position, options = {}) {
  const geometry = options.geometry ?? "roundRect";
  const shapeOptions = {
    geometry,
    position,
    fill: options.fill ?? C.white,
    line: options.line ?? { style: "solid", fill: C.line, width: 1.5 },
  };
  if (["rect", "textbox", "roundRect"].includes(geometry)) {
    shapeOptions.borderRadius = options.borderRadius ?? 7;
  }
  const shape = slide.shapes.add(shapeOptions);
  shape.text = label;
  shape.text.style = {
    typeface: options.fontFamily ?? FONT,
    fontSize: options.fontSize ?? 22,
    bold: options.bold ?? true,
    color: options.color ?? C.ink,
    alignment: options.alignment ?? "center",
    autoFit: "none",
  };
  shape.text.verticalAlignment = options.verticalAlignment ?? "middle";
  return shape;
}

function connect(slide, from, to, options = {}) {
  return slide.shapes.connect(from, to, {
    kind: options.kind ?? "elbow",
    fromSide: options.fromSide ?? "right",
    toSide: options.toSide ?? "left",
    line: {
      style: options.style ?? "solid",
      fill: options.color ?? C.teal,
      width: options.width ?? 2.5,
    },
    head: options.head === false
      ? { type: "none" }
      : { type: "triangle", width: "sm", length: "sm" },
  });
}

function addHeader(slide, title, maturity, subtitle = "") {
  slide.background.fill = C.white;
  addText(slide, title, { left: 64, top: 34, width: 930, height: 58 }, {
    fontSize: title.length > 32 ? 38 : 42,
    bold: true,
    color: C.navy,
  });
  addText(slide, maturity.toUpperCase(), { left: 1010, top: 42, width: 206, height: 34 }, {
    fontSize: 16,
    bold: true,
    color: maturity.toLowerCase().includes("historical") ? C.orange : C.teal,
    alignment: "right",
  });
  if (subtitle) {
    addText(slide, subtitle, { left: 64, top: 92, width: 1120, height: 34 }, {
      fontSize: 19,
      color: C.gray,
    });
  }
  slide.shapes.add({
    geometry: "line",
    position: { left: 64, top: 127, width: 1152, height: 1 },
    fill: "none",
    line: { style: "solid", fill: C.line, width: 1 },
  });
}

function addFooter(slide, text) {
  addText(slide, text, { left: 64, top: 672, width: 1152, height: 28 }, {
    fontSize: 15,
    color: C.gray,
  });
}

function addSectionLabel(slide, text, left, top, width, color = C.teal) {
  addText(slide, text.toUpperCase(), { left, top, width, height: 25 }, {
    fontSize: 15,
    bold: true,
    color,
  });
}

function addBulletLines(slide, lines, left, top, width, options = {}) {
  const lineHeight = options.lineHeight ?? 33;
  lines.forEach((line, index) => {
    const y = top + index * lineHeight;
    slide.shapes.add({
      geometry: "ellipse",
      position: { left, top: y + 10, width: 7, height: 7 },
      fill: options.dotColor ?? C.teal,
      line: { fill: "none", width: 0 },
    });
    addText(slide, line, { left: left + 17, top: y, width: width - 17, height: lineHeight - 2 }, {
      fontSize: options.fontSize ?? 20,
      color: options.color ?? C.ink,
    });
  });
}

function addImage(slide, filePath, position, alt, crop = undefined, fit = "cover") {
  return fs.readFile(filePath).then((bytes) => slide.images.add({
    blob: new Uint8Array(bytes),
    contentType: "image/png",
    alt,
    fit,
    position,
    crop,
    geometry: "rect",
  }));
}

const presentation = Presentation.create({
  slideSize: { width: SLIDE_W, height: SLIDE_H },
});

// 1. Historical VM and Compose prototype.
{
  const slide = presentation.slides.add();
  addHeader(slide, "Historical VM and Compose Prototype", "Historical conceptual view",
    "The original deployment proved the workflow and exposed tightly coupled operational responsibilities.");

  const user = addBox(slide, "Researcher", { left: 68, top: 258, width: 125, height: 68 }, {
    fill: C.paleBlue, line: { style: "solid", fill: C.cyan, width: 2 }, fontSize: 21,
  });
  const web = addBox(slide, "WebApp", { left: 228, top: 258, width: 130, height: 68 }, {
    fill: C.paleBlue, line: { style: "solid", fill: C.teal, width: 2 },
  });
  const gateway = addBox(slide, "API Gateway", { left: 410, top: 220, width: 150, height: 68 }, {
    fill: C.white, line: { style: "solid", fill: C.navy2, width: 2 },
  });
  const queue = addBox(slide, "RabbitMQ", { left: 610, top: 220, width: 145, height: 68 }, {
    fill: C.paleOrange, line: { style: "solid", fill: C.orange, width: 2 },
  });
  const workers = addBox(slide, "Workers + Listener", { left: 805, top: 220, width: 170, height: 68 }, {
    fill: C.white, line: { style: "solid", fill: C.navy2, width: 2 }, fontSize: 20,
  });
  const legacy = addBox(slide, "Legacy adapter\n+ OSC-API", { left: 1020, top: 220, width: 155, height: 88 }, {
    fill: C.paleOrange, line: { style: "solid", fill: C.orange, width: 2 }, fontSize: 19,
  });
  const db = addBox(slide, "PostgreSQL", { left: 410, top: 395, width: 150, height: 60 }, {
    geometry: "ellipse", fill: C.paleGreen, line: { style: "solid", fill: C.green, width: 2 }, fontSize: 18,
  });
  const fabric = addBox(slide, "External Fabric VM\nPeers + ordering + chaincode", { left: 973, top: 400, width: 225, height: 86 }, {
    fill: C.paleOrange, line: { style: "solid", fill: C.orange, width: 2 }, fontSize: 18,
  });

  connect(slide, user, web);
  connect(slide, web, gateway);
  connect(slide, gateway, queue);
  connect(slide, queue, workers);
  connect(slide, workers, legacy);
  connect(slide, gateway, db, { fromSide: "bottom", toSide: "top", color: C.green });
  connect(slide, legacy, fabric, { fromSide: "bottom", toSide: "top", color: C.orange });

  slide.shapes.add({
    geometry: "roundRect",
    position: { left: 386, top: 172, width: 610, height: 340 },
    fill: { color: C.white, transparency: 100000 },
    line: { style: "dashed", fill: C.orange, width: 2 },
    borderRadius: 7,
  }).sendToBack();
  addText(slide, "Mutable VM + Docker Compose boundary", { left: 402, top: 178, width: 310, height: 28 }, {
    fontSize: 16, bold: true, color: C.orange,
  });

  addText(slide, "Fast learning", { left: 410, top: 548, width: 190, height: 42 }, {
    fontSize: 24, bold: true, color: C.green,
  });
  addText(slide, "Implicit responsibilities", { left: 790, top: 548, width: 270, height: 42 }, {
    fontSize: 24, bold: true, color: C.orange,
  });
  addFooter(slide, "Historical source: original OSC-IS Draw.io architecture and repository history. Not a production topology.");
  slide.speakerNotes.textFrame.setText(
    "Historical conceptual view derived from the original OSC-IS Draw.io diagrams and current-state review. " +
    "The historical deployment connected the WebApp, API Gateway, PostgreSQL, RabbitMQ, workers, a compatibility adapter/OSC-API path, and an externally managed Fabric VM."
  );
}

// 2. Gateway and chaincode responsibility boundary.
{
  const slide = presentation.slides.add();
  addHeader(slide, "Authorization and Ledger Invariants", "Experimentally demonstrated",
    "Policy lives at the portal boundary; organization and ownership invariants remain enforceable at the ledger boundary.");

  const request = addBox(slide, "Authenticated request\nJWT + active organization", { left: 70, top: 250, width: 205, height: 100 }, {
    fill: C.paleBlue, line: { style: "solid", fill: C.cyan, width: 2 }, fontSize: 19,
  });
  const gateway = addBox(slide, "API Gateway", { left: 355, top: 168, width: 330, height: 70 }, {
    fill: C.navy, line: { style: "solid", fill: C.navy, width: 1 }, color: C.white, fontSize: 26,
  });
  const ledger = addBox(slide, "Fabric provenance contract", { left: 790, top: 168, width: 390, height: 70 }, {
    fill: C.teal, line: { style: "solid", fill: C.teal, width: 1 }, color: C.white, fontSize: 26,
  });
  addSectionLabel(slide, "Portal authorization", 375, 262, 260, C.navy2);
  addBulletLines(slide, [
    "Authentication and active membership",
    "Portal roles and administration",
    "Caller tenancy and audit metadata",
    "Organization-scoped routing",
  ], 375, 292, 285, { fontSize: 18, lineHeight: 38, dotColor: C.cyan });
  addSectionLabel(slide, "Ledger invariants", 812, 262, 260, C.teal);
  addBulletLines(slide, [
    "Submitting MSP checks",
    "Organization and ownership rules",
    "Stable keys and valid transitions",
    "Ledger history and idempotency",
  ], 812, 292, 335, { fontSize: 18, lineHeight: 38, dotColor: C.green });

  connect(slide, request, gateway, { color: C.cyan });
  connect(slide, gateway, ledger, { color: C.teal });

  addBox(slide, "Cross-organization request denied", { left: 383, top: 492, width: 265, height: 54 }, {
    fill: C.paleOrange, line: { style: "solid", fill: C.orange, width: 1.5 }, color: C.red, fontSize: 17,
  });
  addBox(slide, "Direct Fabric identity misuse denied", { left: 832, top: 492, width: 290, height: 54 }, {
    fill: C.paleOrange, line: { style: "solid", fill: C.orange, width: 1.5 }, color: C.red, fontSize: 17,
  });

  addBox(slide, "NSG", { left: 827, top: 575, width: 120, height: 42 }, {
    fill: C.paleBlue, line: { style: "solid", fill: C.cyan, width: 1.5 }, fontSize: 17,
  });
  addBox(slide, "Citizen Science", { left: 967, top: 575, width: 155, height: 42 }, {
    fill: C.paleGreen, line: { style: "solid", fill: C.green, width: 1.5 }, fontSize: 17,
  });
  addFooter(slide, "Fabric used organization service identities; individual attribution remained in trusted Gateway audit metadata.");
  slide.speakerNotes.textFrame.setText(
    "Evidence: C01, C02, and C15 in the US-RSE 2026 claim-evidence matrix. Six authorization controls were recorded in each of two separate disposable AWS runs. Claims apply to tested scenarios only."
  );
}

// 3. Current disposable EKS experiment.
{
  const slide = presentation.slides.add();
  addHeader(slide, "Disposable AWS Experiment", "Experimentally demonstrated",
    "GitOps reconciled a two-organization provenance stack on three private EKS nodes.");

  const git = addBox(slide, "Git repository\nDeclared state", { left: 70, top: 155, width: 170, height: 70 }, {
    fill: C.pale, line: { style: "solid", fill: C.navy2, width: 2 }, fontSize: 18,
  });
  const argo = addBox(slide, "Argo CD\nHealthy + Synced", { left: 300, top: 155, width: 180, height: 70 }, {
    fill: C.paleGreen, line: { style: "solid", fill: C.green, width: 2 }, fontSize: 18,
  });
  connect(slide, git, argo, { color: C.green });

  const browser = addBox(slide, "Browser", { left: 70, top: 310, width: 115, height: 58 }, {
    fill: C.paleBlue, line: { style: "solid", fill: C.cyan, width: 2 }, fontSize: 19,
  });
  const edge = addBox(slide, "CloudFront + S3\nWebApp", { left: 228, top: 300, width: 165, height: 78 }, {
    fill: C.paleBlue, line: { style: "solid", fill: C.cyan, width: 2 }, fontSize: 18,
  });
  connect(slide, browser, edge, { color: C.cyan });

  slide.shapes.add({
    geometry: "roundRect",
    position: { left: 430, top: 250, width: 780, height: 355 },
    fill: C.pale,
    line: { style: "solid", fill: C.navy2, width: 2 },
    borderRadius: 7,
  });
  addText(slide, "Private EKS runtime", { left: 720, top: 260, width: 250, height: 35 }, {
    fontSize: 21, bold: true, color: C.navy,
  });
  addText(slide, "3 Ready nodes", { left: 1000, top: 260, width: 180, height: 35 }, {
    fontSize: 17, bold: true, color: C.green, alignment: "right",
  });

  const api = addBox(slide, "API Gateway", { left: 465, top: 330, width: 145, height: 62 }, {
    fill: C.white, line: { style: "solid", fill: C.navy2, width: 2 }, fontSize: 18,
  });
  const pg = addBox(slide, "PostgreSQL\n+ outbox", { left: 465, top: 455, width: 145, height: 70 }, {
    fill: C.paleGreen, line: { style: "solid", fill: C.green, width: 2 }, fontSize: 17,
  });
  const mq = addBox(slide, "Private Amazon MQ\nRabbitMQ", { left: 655, top: 330, width: 175, height: 72 }, {
    fill: C.paleOrange, line: { style: "solid", fill: C.orange, width: 2 }, fontSize: 17,
  });
  const worker = addBox(slide, "Submission worker\n+ listener", { left: 655, top: 455, width: 175, height: 70 }, {
    fill: C.white, line: { style: "solid", fill: C.navy2, width: 2 }, fontSize: 17,
  });
  const gwNsg = addBox(slide, "NSG Ledger\nGateway", { left: 875, top: 315, width: 140, height: 72 }, {
    fill: C.paleBlue, line: { style: "solid", fill: C.cyan, width: 2 }, fontSize: 17,
  });
  const gwCs = addBox(slide, "Citizen Science\nLedger Gateway", { left: 875, top: 455, width: 140, height: 72 }, {
    fill: C.paleGreen, line: { style: "solid", fill: C.green, width: 2 }, fontSize: 16,
  });
  const fabric = addBox(slide, "Fabric\n2 orgs + ordering\nprovenance chaincode", { left: 1050, top: 350, width: 135, height: 120 }, {
    fill: C.navy, line: { style: "solid", fill: C.navy, width: 1 }, color: C.white, fontSize: 16,
  });

  connect(slide, edge, api, { color: C.cyan });
  connect(slide, argo, api, { fromSide: "bottom", toSide: "top", color: C.green, style: "dashed" });
  connect(slide, api, pg, { fromSide: "bottom", toSide: "top", color: C.green });
  connect(slide, api, mq, { color: C.orange });
  connect(slide, mq, worker, { fromSide: "bottom", toSide: "top", color: C.orange });
  connect(slide, worker, gwNsg, { color: C.cyan });
  connect(slide, worker, gwCs, { color: C.green });
  connect(slide, gwNsg, fabric, { color: C.cyan });
  connect(slide, gwCs, fabric, { color: C.green });

  addText(slide, "Secrets Manager + workload identity", { left: 446, top: 555, width: 410, height: 28 }, {
    fontSize: 16, color: C.gray,
  });
  addFooter(slide, "Disposable experiment, not a production topology. Workloads and images were deployed by immutable revision/digest.");
  slide.speakerNotes.textFrame.setText(
    "Source: OSC-IS-Infra AWS evidence commits d5975ce and 25aefb8. The EKS path excluded OSC-API and the historical compatibility adapter. OIDC is documented as workflow configuration; the retained evidence does not prove a remote GitHub Actions execution."
  );
}

// 4. Evidence layers.
{
  const slide = presentation.slides.add();
  addHeader(slide, "Three Evidence Layers", "Evidence model",
    "Each layer answers a different question; together they avoid an inflated browser-to-ledger claim.");

  const laneY = [175, 325, 475];
  const laneColors = [C.cyan, C.orange, C.green];
  const labels = ["1  Browser edge", "2  AWS API-to-ledger", "3  Local correlated trace"];
  const details = [
    "CloudFront, catalogs, navigation, mobile layout, session presentation, axe checks",
    "Authorization, asynchronous submission, ledger revisions, recovery, rollout and rollback",
    "One request across outbox, RabbitMQ, worker, Ledger Gateway, Fabric, completion and final API state",
  ];
  const outcomes = ["3/3 browser smoke", "Two separate AWS runs", "5 direct + 2 inferred links"];

  for (let i = 0; i < 3; i += 1) {
    addText(slide, labels[i], { left: 72, top: laneY[i], width: 265, height: 46 }, {
      fontSize: 23, bold: true, color: C.navy,
    });
    slide.shapes.add({
      geometry: "line",
      position: { left: 320, top: laneY[i] + 23, width: 85, height: 1 },
      fill: "none",
      line: { style: "solid", fill: laneColors[i], width: 5 },
    });
    addBox(slide, details[i], { left: 425, top: laneY[i] - 6, width: 520, height: 76 }, {
      fill: i === 0 ? C.paleBlue : i === 1 ? C.paleOrange : C.paleGreen,
      line: { style: "solid", fill: laneColors[i], width: 1.5 },
      fontSize: 18,
      bold: false,
      alignment: "left",
    });
    addBox(slide, outcomes[i], { left: 995, top: laneY[i] + 4, width: 210, height: 56 }, {
      fill: C.white,
      line: { style: "solid", fill: laneColors[i], width: 2 },
      fontSize: 17,
      color: C.navy,
    });
  }
  addBox(slide, "Retained evidence package", { left: 980, top: 620, width: 225, height: 42 }, {
    fill: C.navy, line: { style: "solid", fill: C.navy, width: 1 }, color: C.white, fontSize: 17,
  });
  addText(slide, "No full browser-to-ledger E2E claim", { left: 72, top: 616, width: 500, height: 44 }, {
    fontSize: 21, bold: true, color: C.red,
  });
  slide.speakerNotes.textFrame.setText(
    "Evidence boundary: live browser edge smoke plus a separately validated API-to-ledger integration path. The local trace contains five direct records and two bounded inferences."
  );
}

// 5. Recovery observations.
{
  const slide = presentation.slides.add();
  addHeader(slide, "Controlled Recovery Observations", "Experimentally demonstrated",
    "Elapsed seconds from controlled dependency interruption to observed recovery.");

  const chart = slide.charts.add("bar", {
    position: { left: 100, top: 165, width: 1060, height: 400 },
    categories: ["Ledger Gateway", "RabbitMQ + worker", "Alternate peer"],
    series: [
      { name: "Run 1", values: [46, 223, 6], fill: C.teal },
      { name: "Run 2", values: [46, 226, 6], fill: C.orange },
    ],
    barOptions: { direction: "bar", grouping: "clustered", gapWidth: 58 },
    hasLegend: false,
    xAxis: {
      min: 0, max: 250, majorUnit: 50, numberFormatCode: "0\" s\"",
      textStyle: { typeface: FONT, fontSize: 15, fill: C.gray },
      majorGridlines: { style: "solid", fill: "#DDE5E8", width: 1 },
      line: { style: "solid", fill: C.line, width: 1 },
    },
    yAxis: {
      textStyle: { typeface: FONT, fontSize: 17, fill: C.ink },
      line: { fill: "none", width: 0 },
    },
    dataLabels: {
      showValue: true, position: "outEnd",
      textStyle: { typeface: FONT, fontSize: 16, fill: C.ink, bold: true },
    },
    chartFill: C.white,
    chartLine: { fill: "none", width: 0 },
    plotAreaFill: C.white,
    plotAreaLine: { fill: "none", width: 0 },
  });
  applyPresentationChartFont(chart, { fontFamily: FONT });
  slide.shapes.add({
    geometry: "rect",
    position: { left: 555, top: 568, width: 12, height: 12 },
    fill: C.teal,
    line: { fill: "none", width: 0 },
  });
  addText(slide, "Run 1", { left: 574, top: 559, width: 70, height: 30 }, {
    fontSize: 16, color: C.ink,
  });
  slide.shapes.add({
    geometry: "rect",
    position: { left: 650, top: 568, width: 12, height: 12 },
    fill: C.magenta,
    line: { fill: "none", width: 0 },
  });
  addText(slide, "Run 2", { left: 669, top: 559, width: 70, height: 30 }, {
    fontSize: 16, color: C.ink,
  });
  addBox(slide, "One ledger revision observed in each retained recovery case", { left: 260, top: 595, width: 760, height: 48 }, {
    fill: C.paleGreen, line: { style: "solid", fill: C.green, width: 1.5 }, color: C.navy, fontSize: 18,
  });
  addFooter(slide, "Measured observations from two disposable AWS runs. These are not SLO, HA, or disaster-recovery claims.");
  slide.speakerNotes.textFrame.setText(
    "Sources: run 1 resilience/summary.json at OSC-IS-Infra d5975ce and run 2 aws-recovery/summary.json at 25aefb8. Values: Gateway 46/46 seconds; RabbitMQ-worker 223/226 seconds; alternate peer 6/6 seconds."
  );
}

// 6. GitOps observations.
{
  const slide = presentation.slides.add();
  addHeader(slide, "GitOps Reconciliation Observations", "Experimentally demonstrated",
    "Argo CD restored declared state and immutable revisions in both disposable runs.");

  const chart = slide.charts.add("bar", {
    position: { left: 120, top: 165, width: 1020, height: 400 },
    categories: ["Drift self-heal", "Rollout", "Rollback"],
    series: [
      { name: "Run 1", values: [3, 13, 13], fill: C.teal },
      { name: "Run 2", values: [3, 14, 13], fill: C.magenta },
    ],
    barOptions: { direction: "bar", grouping: "clustered", gapWidth: 58 },
    hasLegend: true,
    legend: { position: "bottom", overlay: false, textStyle: { typeface: FONT, fontSize: 16, fill: C.ink } },
    xAxis: {
      min: 0, max: 16, majorUnit: 2, numberFormatCode: "0\" s\"",
      textStyle: { typeface: FONT, fontSize: 15, fill: C.gray },
      majorGridlines: { style: "solid", fill: "#DDE5E8", width: 1 },
      line: { style: "solid", fill: C.line, width: 1 },
    },
    yAxis: {
      textStyle: { typeface: FONT, fontSize: 17, fill: C.ink },
      line: { fill: "none", width: 0 },
    },
    dataLabels: {
      showValue: true, position: "outEnd",
      textStyle: { typeface: FONT, fontSize: 16, fill: C.ink, bold: true },
    },
    chartFill: C.white,
    chartLine: { fill: "none", width: 0 },
    plotAreaFill: C.white,
    plotAreaLine: { fill: "none", width: 0 },
  });
  applyPresentationChartFont(chart, { fontFamily: FONT });
  addText(slide, "Declared state", { left: 280, top: 598, width: 165, height: 35 }, {
    fontSize: 18, bold: true, color: C.navy, alignment: "center",
  });
  addText(slide, "Drift detected", { left: 555, top: 598, width: 165, height: 35 }, {
    fontSize: 18, bold: true, color: C.orange, alignment: "center",
  });
  addText(slide, "Known-good restored", { left: 830, top: 598, width: 200, height: 35 }, {
    fontSize: 18, bold: true, color: C.green, alignment: "center",
  });
  addFooter(slide, "Measured observations, not a production deployment-frequency or reliability target.");
  slide.speakerNotes.textFrame.setText(
    "Sources: run 1 gitops/summary.json at OSC-IS-Infra d5975ce and run 2 aws-gitops/summary.json plus aws-post-rollback/summary.json at 25aefb8."
  );
}

// 7. Sanitized cluster topology.
{
  const slide = presentation.slides.add();
  addHeader(slide, "Observed Kubernetes Workload Topology", "Experimentally demonstrated",
    "A retained snapshot showed 54 Running pods across three Ready EKS nodes.");

  addBox(slide, "Argo CD\nHealthy + Synced", { left: 70, top: 160, width: 180, height: 65 }, {
    fill: C.paleGreen, line: { style: "solid", fill: C.green, width: 2 }, color: C.navy, fontSize: 18,
  });
  addText(slide, "34 platform pods", { left: 280, top: 170, width: 190, height: 45 }, {
    fontSize: 22, bold: true, color: C.navy,
  });
  addText(slide, "6 application pods", { left: 520, top: 170, width: 200, height: 45 }, {
    fontSize: 22, bold: true, color: C.teal,
  });
  addText(slide, "14 Fabric pods", { left: 770, top: 170, width: 185, height: 45 }, {
    fontSize: 22, bold: true, color: C.orange,
  });
  addText(slide, "All Running", { left: 1010, top: 170, width: 170, height: 45 }, {
    fontSize: 22, bold: true, color: C.green, alignment: "right",
  });

  const nodes = [
    {
      x: 70, title: "Node A  Shared / ordering", zone: "zone 2a  |  m7i.large  |  Ready",
      apps: ["PostgreSQL", "Citizen Science Gateway"],
      fabric: ["Ordering service", "Org CA", "Chaincode pods"],
      color: C.orange,
    },
    {
      x: 465, title: "Node B  NSG", zone: "zone 2b  |  m7i.large  |  Ready",
      apps: ["API Gateway", "Submission worker"],
      fabric: ["NSG CA", "NSG peers", "Chaincode pod"],
      color: C.cyan,
    },
    {
      x: 860, title: "Node C  Citizen Science", zone: "zone 2b  |  m7i.large  |  Ready",
      apps: ["NSG Ledger Gateway", "Submission listener"],
      fabric: ["Citizen Science CA", "Citizen Science peers"],
      color: C.green,
    },
  ];
  for (const node of nodes) {
    slide.shapes.add({
      geometry: "roundRect",
      position: { left: node.x, top: 250, width: 350, height: 370 },
      fill: C.pale,
      line: { style: "solid", fill: node.color, width: 2.5 },
      borderRadius: 7,
    });
    addText(slide, node.title, { left: node.x + 20, top: 265, width: 310, height: 42 }, {
      fontSize: 22, bold: true, color: C.navy,
    });
    addText(slide, node.zone, { left: node.x + 20, top: 305, width: 310, height: 30 }, {
      fontSize: 15, color: C.gray,
    });
    addSectionLabel(slide, "Application", node.x + 20, 350, 160, C.teal);
    addBulletLines(slide, node.apps, node.x + 24, 380, 300, { fontSize: 17, lineHeight: 34, dotColor: C.teal });
    addSectionLabel(slide, "Fabric", node.x + 20, 465, 160, C.orange);
    addBulletLines(slide, node.fabric, node.x + 24, 495, 300, { fontSize: 17, lineHeight: 31, dotColor: node.color });
  }
  addFooter(slide, "Observed scheduling snapshot, not an intended high-availability topology. Node names and private addresses are intentionally omitted.");
  slide.speakerNotes.textFrame.setText(
    "Source: kubernetes-nodes.json, kubernetes-pods.json, and argocd-application.json at OSC-IS-Infra 25aefb8. Counts: 8 Argo CD, 6 Secrets Manager CSI, 3 cert-manager, 1 ingress, 16 kube-system, 6 osc-apps, and 14 osc-fabric pods."
  );
}

// 8. Product experience composite.
{
  const slide = presentation.slides.add();
  addHeader(slide, "Artifact, Workflow, and Provenance History", "Currently implemented",
    "Deterministic fixtures make the product states repeatable; they are not live-ledger screenshots.");

  const files = [
    ["artifact-detail-desktop-1440x900.png", "Artifact record", "Artifact metadata, organization, fingerprint, and transaction context"],
    ["workflow-detail-desktop-1440x900.png", "Workflow record", "Workflow relationships and committed ledger-event context"],
    ["provenance-history-desktop-1440x900.png", "Accepted history", "Version timeline, transaction evidence, and verification state"],
  ];
  for (let i = 0; i < files.length; i += 1) {
    const x = 40 + i * 405;
    await addImage(slide, path.join(UX_DIR, files[i][0]), { left: x, top: 175, width: 390, height: 244 }, files[i][2], undefined, "contain");
    slide.shapes.add({
      geometry: "rect",
      position: { left: x, top: 175, width: 390, height: 244 },
      fill: { color: C.white, transparency: 100000 },
      line: { style: "solid", fill: C.line, width: 1.5 },
    });
    addText(slide, files[i][1], { left: x, top: 438, width: 390, height: 36 }, {
      fontSize: 23, bold: true, color: i === 0 ? C.teal : i === 1 ? C.orange : C.green,
      alignment: "center",
    });
    addText(slide, files[i][2], { left: x + 15, top: 476, width: 360, height: 58 }, {
      fontSize: 15, color: C.gray, alignment: "center",
    });
  }
  addBox(slide, "Three views of the same provenance-centered product model", { left: 260, top: 565, width: 760, height: 48 }, {
    fill: C.paleGreen, line: { style: "solid", fill: C.green, width: 1.5 }, color: C.navy, fontSize: 18,
  });
  addFooter(slide, "Source revision: OSC-WebApp 07e2a0f. Demonstration records are synthetic and representative.");
  slide.speakerNotes.textFrame.setText(
    "All three screenshots come from the canonical deterministic UX evidence package at OSC-WebApp 07e2a0f. They support current product-state and visual-design claims, not a live Fabric transaction."
  );
}

// 9. Accessibility evidence appendix visual.
{
  const slide = presentation.slides.add();
  addHeader(slide, "Accessibility Regression Evidence", "Currently implemented",
    "Automated and manual checks target WCAG 2.2 AA; this is not certification.");

  const panels = [
    ["keyboard-focus-home-desktop-1440x900.png", "Keyboard focus"],
    ["artifact-error-mobile-390x844.png", "Error and retry"],
    ["sign-in-expired-400-percent-reflow-equivalent-320x900.png", "Expired session reflow"],
  ];
  const xs = [70, 365, 660];
  const widths = [250, 250, 250];
  for (let i = 0; i < panels.length; i += 1) {
    await addImage(slide, path.join(A11Y_DIR, panels[i][0]), { left: xs[i], top: 165, width: widths[i], height: 390 }, panels[i][1]);
    addText(slide, panels[i][1], { left: xs[i], top: 565, width: widths[i], height: 36 }, {
      fontSize: 19, bold: true, color: C.navy, alignment: "center",
    });
  }
  addText(slide, "18", { left: 965, top: 210, width: 180, height: 72 }, {
    fontSize: 50, bold: true, color: C.teal, alignment: "center",
  });
  addText(slide, "focused unit tests", { left: 945, top: 278, width: 220, height: 40 }, {
    fontSize: 20, color: C.ink, alignment: "center",
  });
  addText(slide, "9/9", { left: 965, top: 365, width: 180, height: 72 }, {
    fontSize: 50, bold: true, color: C.green, alignment: "center",
  });
  addText(slide, "Cypress/axe journeys", { left: 935, top: 433, width: 240, height: 44 }, {
    fontSize: 20, color: C.ink, alignment: "center",
  });
  addBox(slide, "No screen-reader or native-zoom claim", { left: 925, top: 520, width: 270, height: 64 }, {
    fill: C.paleOrange, line: { style: "solid", fill: C.orange, width: 1.5 }, color: C.red, fontSize: 17,
  });
  addFooter(slide, "Source revision: OSC-WebApp 16b18d3. Report-level 222/222 execution history is not raw-transcript-backed.");
  slide.speakerNotes.textFrame.setText(
    "Evidence includes 18 focused unit tests and 9/9 Cypress/axe journeys, plus manual keyboard, focus, semantics, headings, errors, responsive layout, contrast, non-color cue, and reduced-motion checks. No accessibility certification or legal opinion."
  );
}

// 10. Trust/evidence summary.
{
  const slide = presentation.slides.add();
  addHeader(slide, "Trust Surfaces Beyond the Ledger", "Evidence summary",
    "Usability, deployability, reviewability, and cleanup were treated as product behavior.");

  const metrics = [
    { x: 75, n: "9/9", label: "Cypress/axe journeys", color: C.teal },
    { x: 365, n: "6", label: "deployed image roles", color: C.orange },
    { x: 655, n: "$1.41", label: "nearest-cent run estimate", color: C.magenta },
    { x: 945, n: "0", label: "live experiment resources", color: C.green },
  ];
  for (const m of metrics) {
    addText(slide, m.n, { left: m.x, top: 195, width: 230, height: 95 }, {
      fontSize: 52, bold: true, color: m.color, alignment: "center",
    });
    addText(slide, m.label, { left: m.x, top: 295, width: 230, height: 55 }, {
      fontSize: 20, bold: true, color: C.navy, alignment: "center",
    });
  }
  addText(slide, "Accessibility regression", { left: 75, top: 405, width: 230, height: 34 }, {
    fontSize: 18, color: C.gray, alignment: "center",
  });
  addText(slide, "8 retained scan records", { left: 365, top: 405, width: 230, height: 34 }, {
    fontSize: 18, color: C.gray, alignment: "center",
  });
  addText(slide, "$1.42 conservative ceiling", { left: 655, top: 405, width: 230, height: 34 }, {
    fontSize: 18, color: C.gray, alignment: "center",
  });
  addText(slide, "after authoritative teardown", { left: 945, top: 405, width: 230, height: 34 }, {
    fontSize: 18, color: C.gray, alignment: "center",
  });
  addBox(slide, "Current release boundary: WebApp governance reports 15 High production dependency findings.", {
    left: 155, top: 515, width: 970, height: 72,
  }, {
    fill: C.paleOrange, line: { style: "solid", fill: C.orange, width: 2 }, color: C.red, fontSize: 21,
  });
  addFooter(slide, "Image-scan findings do not describe the full dependency estate. Cost is an estimate, not an invoice.");
  slide.speakerNotes.textFrame.setText(
    "Evidence summary for slide assembly. Six deployed image roles and eight retained scan records, including two replacements, reported zero High/Critical image-scan findings. Do not generalize this result to all product dependencies or comprehensive security."
  );
}

await fs.mkdir(TMP_DIR, { recursive: true });
await fs.mkdir(OUTPUT_DIR, { recursive: true });

const names = [
  "01-historical-vm-compose",
  "02-authorization-ledger-boundaries",
  "03-disposable-aws-eks-experiment",
  "04-evidence-layers",
  "05-recovery-observations",
  "06-gitops-observations",
  "07-kubernetes-workload-topology",
  "08-product-experience",
  "09-accessibility-evidence",
  "10-trust-evidence-summary",
];

for (let index = 0; index < presentation.slides.items.length; index += 1) {
  const slide = presentation.slides.items[index];
  const preview = await presentation.export({ slide, format: "png", scale: 2 });
  await fs.writeFile(
    path.join(OUTPUT_DIR, `${names[index]}.png`),
    new Uint8Array(await preview.arrayBuffer())
  );
  const layout = await slide.export({ format: "layout" });
  await fs.writeFile(path.join(TMP_DIR, `${names[index]}.layout.json`), await layout.text());
}

const candidatePath = path.join(TMP_DIR, "visual-assets-candidate.pptx");
await (await PresentationFile.exportPptx(presentation)).save(candidatePath);

const finalPath = path.join(OUTPUT_DIR, "OSC-IS-USRSE26-EDITABLE-VISUAL-ASSETS-v3.pptx");

await finalizePresentation({
  workspaceDir: path.dirname(TMP_DIR),
  candidatePath,
  finalPath,
  pythonExecutable: process.env.RUNTIME_PYTHON,
  integrityValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_layout_geometry.py"),
  layoutArgs: [
    "--expected-slide-size-emu", "12192000,6858000",
    "--validate-heading-fit",
  ],
  explicitTotalSlideCount: 10,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [5, 6],
  materializeLiteralChartWorkbooks: true,
  nativeChartTargetApplication: "powerpoint",
  fontPolicy: {
    basis: "design",
    families: ["Calibri"],
  },
  verifyArtifactToolImport: true,
  receiptPath: path.join(TMP_DIR, "visual-assets-v3.validation.json"),
});

console.log(JSON.stringify({ finalPath, pngs: names.map((name) => `${name}.png`) }, null, 2));
