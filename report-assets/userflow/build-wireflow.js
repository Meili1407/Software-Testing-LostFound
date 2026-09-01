const fs = require("fs");
const path = require("path");

// ---- layout constants ----
const COLS = 4;
const CARD_W = 380;
const CARD_H = 470;
const GAP_X = 70;
const GAP_Y = 90;
const MARGIN = 70;
const TOP = 120;

const INK = "#1c2530";
const MUTED = "#5b6570";
const LINE = "#c9ced6";
const BADGE = "#2f6f8f";
const FLOW = "#2f7fb8";
const ACCENT = "#2f6f4f";
const BG_SCREEN = "#f7f8f9";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---- primitive builders (coordinates local to a screen's own 0..W / 0..H box) ----
function rect(x, y, w, h, { rx = 4, fill = "#fff", stroke = LINE, sw = 1 } = {}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}
function txt(x, y, s, { size = 10, color = INK, weight = 400, anchor = "start" } = {}) {
  return `<text x="${x}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${esc(s)}</text>`;
}
function navbar(w, labels, activeIdx) {
  let s = rect(0, 0, w, 22, { rx: 0, fill: "#ffffff", stroke: LINE });
  s += txt(10, 15, "Lost&Found", { size: 8, weight: 700 });
  let lx = 100;
  labels.forEach((l, i) => {
    s += txt(lx, 15, l, { size: 7, weight: i === activeIdx ? 700 : 400, color: i === activeIdx ? INK : MUTED });
    lx += l.length * 4.6 + 12;
  });
  s += rect(w - 70, 5, 60, 12, { rx: 3, fill: "#f0f1f3" });
  return s;
}
function button(x, y, w, h, label, { fill = ACCENT, color = "#fff", size = 8 } = {}) {
  return rect(x, y, w, h, { rx: 4, fill, stroke: fill }) + txt(x + w / 2, y + h / 2 + 3, label, { size, color, weight: 700, anchor: "middle" });
}
function field(x, y, w, h, label) {
  let s = txt(x, y - 3, label, { size: 6.5, color: MUTED, weight: 700 });
  s += rect(x, y, w, h, { rx: 3, fill: "#fff" });
  return s;
}
function textarea(x, y, w, h, label) {
  return field(x, y, w, h, label);
}
function badgePill(x, y, label, color) {
  const w = label.length * 5 + 14;
  return rect(x, y, w, 12, { rx: 6, fill: color, stroke: color }) + txt(x + w / 2, y + 9, label, { size: 6.5, color: "#fff", weight: 700, anchor: "middle" });
}
function card(x, y, w, h) {
  return rect(x, y, w, h, { rx: 6, fill: "#fff", stroke: LINE });
}
function label(x, y, s, opts) {
  return txt(x, y, s, opts);
}

// ---- one wireframe "phone/browser" content area per screen (W=340, H=380) ----
const W = 340,
  H = 380;

function screenHome() {
  let s = navbar(W, ["Home", "Staff", "Found", "Track", "Notif"], 0);
  s += rect(0, 22, W, H - 22, { rx: 0, fill: "#f7ede0", stroke: "none" });
  s += txt(14, 46, "Find what you lost.", { size: 15, weight: 700 });
  s += txt(14, 60, "Browse recently reported items.", { size: 7, color: MUTED });
  s += card(14, 70, W - 28, 60);
  [0, 1, 2].forEach((i) => {
    const x = 22 + i * 105;
    s += rect(x, 78, 12, 12, { rx: 6, fill: INK });
    s += txt(x + 16, 87, ["Report it", "We match it", "Claim it"][i], { size: 6.5, weight: 700 });
  });
  s += button(22, 108, 70, 14, "I lost sth");
  s += button(100, 108, 75, 14, "I found sth", { fill: "#fff", color: INK });
  s += rect(14, 140, W - 28, 16, { rx: 8, fill: "#fff" });
  for (let i = 0; i < 4; i++) {
    const x = 14 + i * ((W - 28) / 4 + 2);
    s += card(x, 168, (W - 28) / 4 - 4, 90);
    s += rect(x, 168, (W - 28) / 4 - 4, 40, { rx: 6, fill: "#e7cba8", stroke: "none" });
  }
  return s;
}

function screenReportLost(titleLabel = "Report a Lost Item") {
  let s = navbar(W, ["Home", "Student", "Found", "Track", "Notif"], 1);
  s += txt(14, 42, titleLabel, { size: 13, weight: 700 });
  s += field(14, 62, 150, 16, "CATEGORY");
  s += field(178, 62, 150, 16, "TITLE");
  s += textarea(14, 96, 314, 30, "DESCRIPTION");
  s += field(14, 140, 150, 16, "COLOR");
  s += field(178, 140, 150, 16, "BRAND");
  s += field(14, 174, 150, 16, "LOCATION");
  s += field(178, 174, 150, 16, "DATE & TIME");
  s += field(14, 208, 314, 16, "PHOTO (optional)");
  s += button(14, 236, 110, 18, "Save Report");
  return s;
}

function screenMatchResults() {
  let s = navbar(W, ["Home", "Student", "Found", "Track", "Notif"], 0);
  s += txt(14, 42, "Match Results", { size: 13, weight: 700 });
  const bands = [
    ["Blue Wallet", "97/100", ACCENT, "STRONG"],
    ["Silver Ring", "64/100", "#a3730f", "POSSIBLE"],
    ["Umbrella", "12/100", "#b3413a", "WEAK"],
  ];
  bands.forEach(([title, score, color, tag], i) => {
    const y = 56 + i * 76;
    s += card(14, y, W - 28, 66);
    s += txt(22, y + 16, title, { size: 8.5, weight: 700 });
    s += txt(W - 22, y + 16, score, { size: 9, weight: 700, anchor: "end" });
    s += badgePill(W - 70, y + 22, tag, color);
    s += button(22, y + 44, 60, 14, "Match", { size: 6.5 });
    s += button(86, y + 44, 60, 14, "Not match", { fill: "#fff", color: INK, size: 6.5 });
    s += button(154, y + 44, 60, 14, "Claim", { size: 6.5 });
  });
  return s;
}

function screenSubmitClaim() {
  let s = navbar(W, ["Home", "Student", "Found", "Track", "Notif"], 0);
  s += txt(14, 42, "Submit a Claim", { size: 13, weight: 700 });
  s += field(14, 62, 314, 16, "YOUR LOST REPORT");
  s += field(14, 96, 314, 16, "FOUND REPORT YOU'RE CLAIMING");
  s += textarea(14, 130, 314, 60, "SUPPORTING EVIDENCE (>=10 chars)");
  s += field(14, 200, 314, 16, "PHOTOS (optional)");
  s += button(14, 228, 110, 18, "Submit Claim");
  return s;
}

function screenTrackClaim() {
  let s = navbar(W, ["Home", "Student", "Found", "Track", "Notif"], 3);
  s += txt(14, 42, "Track Claim Status", { size: 13, weight: 700 });
  s += rect(14, 58, 220, 18, { rx: 3, fill: "#fff" });
  s += button(240, 58, 88, 18, "Check Status");
  s += card(14, 86, W - 28, 90);
  s += txt(22, 102, "CLM-00007 — Blue Wallet", { size: 8.5, weight: 700 });
  s += badgePill(W - 70, 94, "COMPLETED", "#2a4d8f");
  ["Match score  97/100", "Claimant   Demo Student", "Decision   Approved — Demo Staff"].forEach((t, i) => {
    s += txt(22, 122 + i * 16, t, { size: 6.5, color: MUTED });
  });
  return s;
}

function screenStudentDashboard() {
  let s = navbar(W, ["Home", "Student", "Found", "Track", "Notif"], 1);
  s += txt(14, 40, "Welcome back, Demo Student", { size: 11, weight: 700 });
  s += button(14, 52, 90, 16, "Report Lost");
  s += button(110, 52, 100, 16, "Browse Found", { fill: "#fff", color: INK });
  s += button(216, 52, 90, 16, "Track Claim", { fill: "#fff", color: INK });
  s += txt(14, 88, "Your Lost Reports", { size: 8.5, weight: 700 });
  s += card(14, 96, 150, 100);
  s += txt(14, 214, "Recent Claims", { size: 8.5, weight: 700 });
  s += card(178, 96, 150, 100);
  return s;
}

function screenFoundItems() {
  let s = navbar(W, ["Home", "Student", "Found", "Track", "Notif"], 2);
  s += txt(14, 42, "Found Items", { size: 13, weight: 700 });
  s += rect(14, 56, 220, 16, { rx: 3, fill: "#fff" });
  s += field(240, 56, 88, 16, "CATEGORY");
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < 2; c++) {
      const x = 14 + c * 160,
        y = 84 + r * 100;
      s += card(x, y, 150, 90);
      s += rect(x, y, 150, 45, { rx: 6, fill: "#e7cba8", stroke: "none" });
    }
  return s;
}

function screenFoundItemDetail() {
  let s = navbar(W, ["Home", "Student", "Found", "Track", "Notif"], 2);
  s += txt(14, 38, "← Back to Found Items", { size: 7, color: MUTED });
  s += card(14, 48, W - 28, 180);
  s += txt(24, 70, "Blue Wallet", { size: 12, weight: 700 });
  s += badgePill(W - 90, 58, "RESOLVED", "#2a4d8f");
  ["Category  Bags", "Color  Blue", "Brand  Fossil", "Location  Gymnasium", "Date found  8/22/2026"].forEach((t, i) => {
    s += txt(24, 92 + i * 16, t, { size: 6.5, color: MUTED });
  });
  s += button(24, 190, 200, 18, "This looks like mine — Submit a Claim");
  return s;
}

function screenNotifications() {
  let s = navbar(W, ["Home", "Student", "Found", "Track", "Notif"], 4);
  s += txt(14, 42, "Notifications", { size: 13, weight: 700 });
  s += button(W - 100, 32, 86, 16, "Mark all read", { fill: "#fff", color: INK, size: 6.5 });
  for (let i = 0; i < 3; i++) {
    const y = 58 + i * 56;
    s += card(14, y, W - 28, 46);
    s += txt(22, y + 18, `Claim update notification #${i + 1}`, { size: 7.5 });
    s += txt(22, y + 32, "8/25/2026, 12:09 AM", { size: 6, color: MUTED });
    s += button(W - 78, y + 14, 60, 14, "Mark read", { fill: "#fff", color: INK, size: 6 });
  }
  return s;
}

function screenStaffDashboard() {
  let s = navbar(W, ["Home", "Staff", "Found", "Track", "Notif"], 1);
  s += txt(14, 42, "Staff Dashboard", { size: 13, weight: 700 });
  s += button(W - 110, 32, 96, 16, "Report Found");
  s += txt(14, 66, "Claims Awaiting Review", { size: 8.5, weight: 700 });
  for (let i = 0; i < 3; i++) {
    const y = 76 + i * 46;
    s += card(14, y, W - 28, 38);
    s += txt(22, y + 16, `CLM-0000${i + 5} — Item ${i + 1}`, { size: 7.5, weight: 700 });
    s += badgePill(W - 130, y + 8, "PENDING", "#a3730f");
    s += button(W - 66, y + 8, 52, 16, "Review", { fill: "#fff", color: INK, size: 6.5 });
  }
  return s;
}

function screenClaimReview() {
  let s = navbar(W, ["Home", "Staff", "Found", "Track", "Notif"], 1);
  s += txt(14, 42, "Review Claim", { size: 13, weight: 700 });
  s += card(14, 56, W - 28, 90);
  s += txt(22, 74, "CLM-00007 — Blue Wallet", { size: 8.5, weight: 700 });
  s += badgePill(W - 80, 64, "PENDING", "#a3730f");
  ["Match score  97/100", "Evidence  \"My initials are on the flap.\""].forEach((t, i) => {
    s += txt(22, 96 + i * 16, t, { size: 6.5, color: MUTED });
  });
  s += rect(14, 156, 10, 10, { rx: 2, fill: "#fff" });
  s += txt(28, 165, "I have verified this evidence in person", { size: 6.5, color: MUTED });
  s += button(14, 174, 60, 18, "Approve");
  s += button(80, 174, 55, 18, "Reject", { fill: "#b3413a", stroke: "#b3413a" });
  s += button(141, 174, 100, 18, "Request Info", { fill: "#fff", color: INK });
  return s;
}

function screenReportFound() {
  return screenReportLost("Report a Found Item");
}

// ---- screen registry ----
const SCREENS = [
  { n: 1, title: "Home", build: screenHome },
  { n: 2, title: "Report a Lost Item", build: screenReportLost },
  { n: 3, title: "Match Results", build: screenMatchResults },
  { n: 4, title: "Submit a Claim", build: screenSubmitClaim },
  { n: 5, title: "Track Claim Status", build: screenTrackClaim },
  { n: 6, title: "Student Dashboard", build: screenStudentDashboard },
  { n: 7, title: "Found Items", build: screenFoundItems },
  { n: 8, title: "Found Item Detail", build: screenFoundItemDetail },
  { n: 9, title: "Notifications", build: screenNotifications },
  { n: 10, title: "Staff Dashboard", build: screenStaffDashboard },
  { n: 11, title: "Review Claim", build: screenClaimReview },
  { n: 12, title: "Report a Found Item", build: screenReportFound },
];

// grid positions (1-indexed screen n -> row/col)
function gridPos(n) {
  const idx = n - 1;
  const col = idx % COLS;
  const row = Math.floor(idx / COLS);
  const x = MARGIN + col * (CARD_W + GAP_X);
  const y = TOP + row * (CARD_H + GAP_Y);
  return { x, y, col, row };
}

const CANVAS_W = MARGIN * 2 + COLS * CARD_W + (COLS - 1) * GAP_X;
const ROWS = Math.ceil(SCREENS.length / COLS);
const CANVAS_H = TOP + ROWS * CARD_H + (ROWS - 1) * GAP_Y + 140;

// ---- flow edges: [fromScreen, toScreen, label] ----
const EDGES = [
  [1, 2, "I lost something"],
  [1, 12, "I found something"],
  [1, 6, "Student tab"],
  [1, 7, "Found Items tab"],
  [1, 9, "Notifications tab"],
  [1, 10, "Staff tab"],
  [2, 3, "auto-redirect"],
  [3, 4, "Submit a Claim"],
  [4, 5, "auto-redirect"],
  [6, 2, "Report Lost Item"],
  [6, 7, "Browse Found Items"],
  [6, 5, "Track a Claim"],
  [7, 8, "click item"],
  [8, 4, "Submit a Claim"],
  [10, 12, "Report Found Item"],
  [10, 11, "Review"],
];

function edgeAnchor(n, side) {
  const { x, y } = gridPos(n);
  if (side === "top") return { x: x + CARD_W / 2, y: y - 6 };
  if (side === "bottom") return { x: x + CARD_W / 2, y: y + CARD_H + 6 };
  if (side === "left") return { x: x - 6, y: y + CARD_H / 2 };
  if (side === "right") return { x: x + CARD_W + 6, y: y + CARD_H / 2 };
}

function routeEdge(from, to, label, idx) {
  const a = gridPos(from);
  const b = gridPos(to);
  let start, end, path, labelPt;

  if (a.row === b.row && b.col > a.col) {
    // rightward along the same row
    start = edgeAnchor(from, "right");
    end = edgeAnchor(to, "left");
    const midY = start.y - 20 - (idx % 4) * 18;
    path = `M ${start.x} ${start.y} L ${start.x + 12} ${start.y} L ${start.x + 12} ${midY} L ${end.x - 12} ${midY} L ${end.x - 12} ${end.y} L ${end.x} ${end.y}`;
    labelPt = { x: (start.x + end.x) / 2, y: midY - 4 };
  } else if (a.row === b.row && b.col < a.col) {
    // leftward along the same row (e.g. dashboard -> an earlier column)
    start = edgeAnchor(from, "left");
    end = edgeAnchor(to, "right");
    const midY = start.y + 20 + (idx % 4) * 18;
    path = `M ${start.x} ${start.y} L ${start.x - 12} ${start.y} L ${start.x - 12} ${midY} L ${end.x + 12} ${midY} L ${end.x + 12} ${end.y} L ${end.x} ${end.y}`;
    labelPt = { x: (start.x + end.x) / 2, y: midY + 12 };
  } else if (a.col === b.col && b.row !== a.row) {
    // straight vertical line within the same column
    const down = b.row > a.row;
    start = edgeAnchor(from, down ? "bottom" : "top");
    end = edgeAnchor(to, down ? "top" : "bottom");
    path = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
    labelPt = { x: start.x + 14, y: (start.y + end.y) / 2 };
  } else if (b.row > a.row) {
    // forward diagonal: drop down, jog sideways, drop into the target
    start = edgeAnchor(from, "bottom");
    end = edgeAnchor(to, "top");
    const midY = start.y + 20 + (idx % 4) * 18;
    path = `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`;
    labelPt = { x: (start.x + end.x) / 2, y: midY - 4 };
  } else {
    // fallback: loop around the right side
    start = edgeAnchor(from, "right");
    end = edgeAnchor(to, "right");
    const outX = Math.max(a.x + CARD_W, b.x + CARD_W) + 24 + (idx % 4) * 14;
    path = `M ${start.x} ${start.y} L ${outX} ${start.y} L ${outX} ${end.y} L ${end.x} ${end.y}`;
    labelPt = { x: outX + 8, y: (start.y + end.y) / 2 };
  }
  return { path, start, end, labelPt };
}

// ---- assemble full SVG ----
let body = "";

// title
body += txt(CANVAS_W / 2, 50, "Campus Lost & Found — Wireflow", { size: 26, weight: 700, anchor: "middle" });
body += txt(CANVAS_W / 2, 76, "Low-fidelity screens traced from the actual running app, connected by real navigation paths", {
  size: 13,
  color: MUTED,
  anchor: "middle",
});

// edges first (under cards)
EDGES.forEach(([from, to, lbl], i) => {
  const { path, start } = routeEdge(from, to, lbl, i);
  body += `<path d="${path}" fill="none" stroke="${FLOW}" stroke-width="2" marker-end="url(#arrow)"/>`;
  body += `<circle cx="${start.x}" cy="${start.y}" r="3" fill="${FLOW}"/>`;
});

// screens
SCREENS.forEach((scr) => {
  const { x, y } = gridPos(scr.n);
  body += `<g transform="translate(${x},${y})">`;
  body += rect(-2, -2, CARD_W + 4, CARD_H + 4, { rx: 12, fill: "#ffffff", stroke: "#dde1e6", sw: 1.5 });
  body += `<circle cx="18" cy="18" r="13" fill="${BADGE}"/>`;
  body += txt(18, 22, String(scr.n), { size: 12, weight: 700, color: "#fff", anchor: "middle" });
  body += txt(40, 23, scr.title, { size: 13, weight: 700 });
  body += `<g transform="translate(20,40)">`;
  body += rect(-4, -4, W + 8, H + 8, { rx: 8, fill: BG_SCREEN, stroke: "#e2e5e9" });
  body += scr.build();
  body += `</g>`;
  body += "</g>";
});

// edge labels drawn last (on top) with a white pill background for legibility
EDGES.forEach(([from, to, lbl], i) => {
  const { labelPt } = routeEdge(from, to, lbl, i);
  const w = lbl.length * 5.6 + 10;
  body += rect(labelPt.x - w / 2, labelPt.y - 10, w, 13, { rx: 6, fill: "#ffffff", stroke: FLOW, sw: 0.75 });
  body += txt(labelPt.x, labelPt.y, lbl, { size: 7.5, color: FLOW, weight: 700, anchor: "middle" });
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}">
  <defs>
    <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 Z" fill="${FLOW}"/>
    </marker>
  </defs>
  <rect x="0" y="0" width="${CANVAS_W}" height="${CANVAS_H}" fill="#eef1f4"/>
  ${body}
</svg>`;

fs.writeFileSync(path.join(__dirname, "wireflow.svg"), svg);
console.log("wrote wireflow.svg", CANVAS_W, "x", CANVAS_H);
