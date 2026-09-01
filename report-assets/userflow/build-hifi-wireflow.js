const fs = require("fs");
const path = require("path");

const DISPLAY_W = 340;
const COL_GAP = 170;
const ROW_GAP = 70;
const MARGIN = 70;
const TOP = 140;
const BADGE = "#2f6f8f";
const FLOW = "#2f7fb8";
const INK = "#1c2530";
const MUTED = "#5b6570";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function pngSize(file) {
  const buf = fs.readFileSync(file);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}
function toDataUri(file) {
  const buf = fs.readFileSync(file);
  return `data:image/png;base64,${buf.toString("base64")}`;
}
function txt(x, y, s, { size = 12, color = INK, weight = 400, anchor = "start" } = {}) {
  return `<text x="${x}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${esc(s)}</text>`;
}
function rect(x, y, w, h, { rx = 4, fill = "#fff", stroke = "#dde1e6", sw = 1 } = {}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

function buildDiagram({ title, subtitle, columns, screens, edges, outSvg, outPng }) {
  // Compute bounding box per screen: stack each column vertically.
  const boxes = {};
  columns.forEach((colKeys, colIdx) => {
    let y = TOP;
    colKeys.forEach((key) => {
      const scr = screens[key];
      const { width, height } = pngSize(scr.file);
      const h = Math.round(DISPLAY_W * (height / width));
      const x = MARGIN + colIdx * (DISPLAY_W + COL_GAP);
      boxes[key] = { x, y: y + 34, w: DISPLAY_W, h, top: y };
      y += 34 + h + ROW_GAP;
    });
  });

  const canvasW = MARGIN * 2 + columns.length * DISPLAY_W + (columns.length - 1) * COL_GAP;
  const maxBottom = Math.max(...Object.values(boxes).map((b) => b.top + 34 + b.h));
  const canvasH = maxBottom + 80;

  function anchor(key, side) {
    const b = boxes[key];
    if (side === "top") return { x: b.x + b.w / 2, y: b.y - 2 };
    if (side === "bottom") return { x: b.x + b.w / 2, y: b.y + b.h + 2 };
    if (side === "left") return { x: b.x - 2, y: b.y + Math.min(40, b.h / 2) };
    if (side === "right") return { x: b.x + b.w + 2, y: b.y + Math.min(40, b.h / 2) };
  }
  function colOf(key) {
    return columns.findIndex((c) => c.includes(key));
  }

  let edgeSvg = "";
  let labelSvg = "";
  edges.forEach(([from, to, lbl], i) => {
    const ca = colOf(from);
    const cb = colOf(to);
    const a = boxes[from];
    const b = boxes[to];
    const colKeys = columns[ca];
    const adjacent = ca === cb && Math.abs(colKeys.indexOf(from) - colKeys.indexOf(to)) === 1;
    let path, start, end, labelPt;
    if (ca === cb && adjacent) {
      // same column, directly stacked: simple vertical connector
      const down = b.y > a.y;
      start = anchor(from, down ? "bottom" : "top");
      end = anchor(to, down ? "top" : "bottom");
      path = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
      labelPt = { x: start.x + 12, y: (start.y + end.y) / 2 };
    } else if (ca === cb && !adjacent) {
      // same column but skips over another screen: exit the side, jog past it, re-enter the side
      const jogRight = ca !== columns.length - 1;
      const side = jogRight ? "right" : "left";
      start = anchor(from, side);
      end = anchor(to, side);
      const outX = jogRight ? a.x + a.w + 40 + (i % 3) * 16 : a.x - 40 - (i % 3) * 16;
      path = `M ${start.x} ${start.y} L ${outX} ${start.y} L ${outX} ${end.y} L ${end.x} ${end.y}`;
      labelPt = { x: outX, y: (start.y + end.y) / 2 - 6 };
    } else if (cb > ca) {
      // rightward to a later column: route the vertical jog through the gap
      // immediately after the source column, so it never crosses a column in between
      start = anchor(from, "right");
      end = anchor(to, "left");
      const midX = a.x + a.w + 18 + (i % 4) * 40;
      path = `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
      labelPt = { x: midX, y: (start.y + end.y) / 2 - 6 - (i % 3) * 16 };
    } else {
      // leftward to an earlier column: same idea, gap immediately before the source column
      start = anchor(from, "left");
      end = anchor(to, "right");
      const midX = a.x - 18 - (i % 4) * 40;
      path = `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
      labelPt = { x: midX, y: (start.y + end.y) / 2 - 6 - (i % 3) * 16 };
    }
    edgeSvg += `<path d="${path}" fill="none" stroke="${FLOW}" stroke-width="2.5" marker-end="url(#arrow)"/>`;
    edgeSvg += `<circle cx="${start.x}" cy="${start.y}" r="3.5" fill="${FLOW}"/>`;
    const w = lbl.length * 6 + 14;
    labelSvg += rect(labelPt.x - w / 2, labelPt.y - 10, w, 15, { rx: 7, fill: "#ffffff", stroke: FLOW, sw: 0.75 });
    labelSvg += txt(labelPt.x, labelPt.y + 1, lbl, { size: 8.5, color: FLOW, weight: 700, anchor: "middle" });
  });

  let screensSvg = "";
  Object.entries(boxes).forEach(([key, b]) => {
    const scr = screens[key];
    screensSvg += `<circle cx="${b.x + 12}" cy="${b.top + 12}" r="13" fill="${BADGE}"/>`;
    screensSvg += txt(b.x + 12, b.top + 16, String(scr.n), { size: 12, weight: 700, color: "#fff", anchor: "middle" });
    screensSvg += txt(b.x + 34, b.top + 17, scr.title, { size: 14, weight: 700 });
    screensSvg += rect(b.x - 3, b.y - 3, b.w + 6, b.h + 6, { rx: 10, fill: "#ffffff", stroke: "#c9ced6", sw: 1.5 });
    screensSvg += `<clipPath id="clip-${key}"><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="7"/></clipPath>`;
    screensSvg += `<image href="${toDataUri(scr.file)}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" clip-path="url(#clip-${key})"/>`;
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasW}" height="${canvasH}" viewBox="0 0 ${canvasW} ${canvasH}">
  <defs>
    <marker id="arrow" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto">
      <path d="M0,0 L7,3.5 L0,7 Z" fill="${FLOW}"/>
    </marker>
  </defs>
  <rect x="0" y="0" width="${canvasW}" height="${canvasH}" fill="#eef1f4"/>
  ${txt(canvasW / 2, 48, title, { size: 28, weight: 700, anchor: "middle" })}
  ${txt(canvasW / 2, 74, subtitle, { size: 14, color: MUTED, anchor: "middle" })}
  ${edgeSvg}
  ${screensSvg}
  ${labelSvg}
</svg>`;

  fs.writeFileSync(outSvg, svg);
  console.log("wrote", outSvg, canvasW, "x", canvasH);
}

const SHOT = (rel) => path.join(__dirname, "..", "screenshots", rel);
const HIFI = (rel) => path.join(__dirname, "hifi", rel);

// ---------------- STUDENT ----------------
const studentScreens = {
  home: { n: 1, title: "Home", file: HIFI("home-student.png") },
  reportLost: { n: 2, title: "Report a Lost Item", file: HIFI("report-lost-clean.png") },
  matches: { n: 3, title: "Match Results", file: SHOT("05-match-strong.png") },
  submitClaim: { n: 4, title: "Submit a Claim", file: HIFI("submit-claim-clean.png") },
  trackClaim: { n: 5, title: "Track Claim Status", file: SHOT("19-track-claim.png") },
  dashboard: { n: 6, title: "Student Dashboard", file: HIFI("student-dashboard.png") },
  foundItems: { n: 7, title: "Found Items", file: SHOT("22-found-items-browse.png") },
  foundDetail: { n: 8, title: "Found Item Detail", file: SHOT("23-found-item-detail.png") },
  notifications: { n: 9, title: "Notifications", file: SHOT("18-notifications.png") },
};
const studentColumns = [
  ["home", "reportLost", "matches", "submitClaim", "trackClaim"],
  ["dashboard", "foundItems", "foundDetail"],
  ["notifications"],
];
const studentEdges = [
  ["home", "reportLost", "\"I lost something\""],
  ["home", "dashboard", "\"Student\" tab"],
  ["home", "foundItems", "\"Found Items\" tab"],
  ["home", "notifications", "\"Notifications\" tab"],
  ["reportLost", "matches", "auto-redirect on save"],
  ["matches", "submitClaim", "\"Submit a Claim\""],
  ["submitClaim", "trackClaim", "auto-redirect on submit"],
  ["dashboard", "reportLost", "\"Report Lost Item\""],
  ["dashboard", "foundItems", "\"Browse Found Items\""],
  ["dashboard", "trackClaim", "\"Track a Claim\""],
  ["foundItems", "foundDetail", "click an item"],
  ["foundDetail", "submitClaim", "\"This looks like mine\""],
];

buildDiagram({
  title: "Campus Lost & Found — Student Wireflow",
  subtitle: "Real screenshots from the running app, acting as role = STUDENT",
  columns: studentColumns,
  screens: studentScreens,
  edges: studentEdges,
  outSvg: path.join(__dirname, "student-hifi.svg"),
});

// ---------------- STAFF ----------------
const staffScreens = {
  home: { n: 1, title: "Home", file: HIFI("home-staff.png") },
  dashboard: { n: 2, title: "Staff Dashboard", file: SHOT("11-staff-dashboard.png") },
  reportFound: { n: 3, title: "Report a Found Item", file: HIFI("report-found-clean.png") },
  reviewPending: { n: 4, title: "Review Claim — Pending", file: SHOT("12-claim-review-pending.png") },
  reviewApproved: { n: 5, title: "Review Claim — Approved", file: SHOT("13-claim-approved-handover-panel.png") },
  reviewCompleted: { n: 6, title: "Review Claim — Completed", file: SHOT("15-handover-completed.png") },
};
const staffColumns = [
  ["home", "dashboard", "reportFound"],
  ["reviewPending", "reviewApproved", "reviewCompleted"],
];
const staffEdges = [
  ["home", "dashboard", "\"Staff\" tab"],
  ["home", "reportFound", "\"I found something\""],
  ["dashboard", "reportFound", "\"Report Found Item\""],
  ["dashboard", "reviewPending", "\"Review\""],
  ["reviewPending", "reviewApproved", "Approve (evidence verified)"],
  ["reviewApproved", "reviewCompleted", "Confirm Handover (identity verified)"],
];

buildDiagram({
  title: "Campus Lost & Found — Staff Wireflow",
  subtitle: "Real screenshots from the running app, acting as role = STAFF",
  columns: staffColumns,
  screens: staffScreens,
  edges: staffEdges,
  outSvg: path.join(__dirname, "staff-hifi.svg"),
});

// ---------------- ADMIN ----------------
const adminScreens = {
  home: { n: 1, title: "Home", file: HIFI("home-admin.png") },
  dashboard: { n: 2, title: "Staff Dashboard (same access as Staff)", file: HIFI("staff-dashboard-admin.png") },
  auditLog: { n: 3, title: "Audit Log (Admin-only)", file: HIFI("audit-log.png") },
};
const adminColumns = [["home"], ["dashboard"], ["auditLog"]];
const adminEdges = [
  ["home", "dashboard", "\"Staff\" tab"],
  ["home", "auditLog", "\"Audit Log\" tab"],
];

buildDiagram({
  title: "Campus Lost & Found — Admin Wireflow",
  subtitle: "Real screenshots from the running app, acting as role = ADMIN. Admin has full Staff access, plus the Audit Log.",
  columns: adminColumns,
  screens: adminScreens,
  edges: adminEdges,
  outSvg: path.join(__dirname, "admin-hifi.svg"),
});
