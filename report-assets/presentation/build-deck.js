const path = require("path");
const pptxgen = require("pptxgenjs");

const ASSETS = path.join(__dirname, "assets");
const SHOTS = path.join(__dirname, "..", "screenshots");
const CFG = path.join(__dirname, "..", "cfg");

// ---- Palette: "Claim Ticket" theme ----
const NAVY = "1B2A4A";
const NAVY_DARK = "121D33";
const SLATE = "4A6FA5";
const AMBER = "E8A33D";
const CREAM_TEXT = "F7F8FA";
const BODY_TEXT = "2B3646";
const MUTED = "6B7686";
const WHITE = "FFFFFF";
const CARD_BG = "F2F4F8";

const FONT_HEAD = "Cambria";
const FONT_BODY = "Calibri";

const pres = new pptxgen();
pres.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pres.layout = "WIDE";

function bgSlide(color) {
  const s = pres.addSlide();
  s.background = { color };
  return s;
}

function footer(s, pageNum, dark) {
  s.addText("Campus Lost & Found Management System  |  CSX4104/ITX4104 Software Testing", {
    x: 0.5,
    y: 7.12,
    w: 9.5,
    h: 0.3,
    fontFace: FONT_BODY,
    fontSize: 9,
    color: dark ? "8A93A6" : MUTED,
    isTextBox: true,
    margin: 0,
  });
  s.addText(String(pageNum), {
    x: 12.5,
    y: 7.12,
    w: 0.4,
    h: 0.3,
    fontFace: FONT_BODY,
    fontSize: 9,
    align: "right",
    color: dark ? "8A93A6" : MUTED,
    isTextBox: true,
    margin: 0,
  });
}

function sectionTitle(s, kicker, title) {
  s.addText(kicker.toUpperCase(), {
    x: 0.6,
    y: 0.45,
    w: 10,
    h: 0.35,
    fontFace: FONT_BODY,
    fontSize: 13,
    bold: true,
    color: AMBER,
    charSpacing: 2,
    isTextBox: true,
    margin: 0,
  });
  s.addText(title, {
    x: 0.6,
    y: 0.78,
    w: 12.1,
    h: 0.7,
    fontFace: FONT_HEAD,
    fontSize: 32,
    bold: true,
    color: NAVY,
    isTextBox: true,
    margin: 0,
  });
}

function iconCircle(s, { x, y, d = 0.62, color = NAVY, icon, iconScale = 0.55 }) {
  s.addShape("ellipse", { x, y, w: d, h: d, fill: { color }, line: { type: "none" } });
  const iw = d * iconScale;
  s.addImage({ path: icon, x: x + (d - iw) / 2, y: y + (d - iw) / 2, w: iw, h: iw });
}

let pageNum = 0;
function nextPage() {
  pageNum += 1;
  return pageNum;
}

// ===========================================================================
// Slide 1 — Title
// ===========================================================================
{
  const s = bgSlide(NAVY);
  // decorative faint circles
  s.addShape("ellipse", { x: 10.6, y: -1.4, w: 5.5, h: 5.5, fill: { color: NAVY_DARK }, line: { type: "none" } });
  s.addShape("ellipse", { x: -1.8, y: 5.2, w: 4.2, h: 4.2, fill: { color: NAVY_DARK }, line: { type: "none" } });

  iconCircle(s, { x: 0.7, y: 0.7, d: 0.9, color: AMBER, icon: path.join(ASSETS, "tag.png"), iconScale: 0.55 });

  s.addText("CSX4104 / ITX4104  ·  SOFTWARE TESTING", {
    x: 0.7,
    y: 2.55,
    w: 10,
    h: 0.4,
    fontFace: FONT_BODY,
    fontSize: 14,
    bold: true,
    color: AMBER,
    charSpacing: 2,
    isTextBox: true,
    margin: 0,
  });
  s.addText("Campus Lost & Found\nManagement System", {
    x: 0.7,
    y: 2.95,
    w: 11.5,
    h: 1.9,
    fontFace: FONT_HEAD,
    fontSize: 46,
    bold: true,
    color: WHITE,
    isTextBox: true,
    margin: 0,
    lineSpacing: 52,
  });
  s.addText("Software Testing Term Project Report", {
    x: 0.72,
    y: 4.75,
    w: 9,
    h: 0.5,
    fontFace: FONT_BODY,
    italic: true,
    fontSize: 18,
    color: "C9D3E3",
    isTextBox: true,
    margin: 0,
  });

  s.addText(
    [
      { text: "Jatupon Itsara (6610073)", options: { breakLine: true } },
      { text: "Gulizara Benjapalaporn (6612233)", options: { breakLine: true } },
      { text: "Chanyanut Pumasri (6620025)", options: { breakLine: true } },
      { text: "Phanthira Kositjaroenkul (6630003)" },
    ],
    {
      x: 0.72,
      y: 5.7,
      w: 6,
      h: 1.3,
      fontFace: FONT_BODY,
      fontSize: 13,
      color: "C9D3E3",
      isTextBox: true,
      margin: 0,
      paraSpaceAfter: 4,
    }
  );

  s.addText("Assumption University — Vincent Mary School of Engineering, Science and Technology", {
    x: 0.72,
    y: 6.95,
    w: 11,
    h: 0.35,
    fontFace: FONT_BODY,
    fontSize: 11,
    color: "8A93A6",
    isTextBox: true,
    margin: 0,
  });
}

// ===========================================================================
// Slide 2 — Agenda
// ===========================================================================
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "Overview", "What We'll Cover");

  const items = [
    ["Project Overview", "The system, its purpose, and tech stack"],
    ["Functional Scope", "What's in scope and what's explicitly not"],
    ["Testing Strategy", "Six testing techniques applied end-to-end"],
    ["Unit & Control Flow Testing", "91 tests, 38 independent paths, full branch coverage"],
    ["Domain & Integration Testing", "Boundary values and live end-to-end scenarios"],
    ["Access Control & Results", "Role-based security, defects found, final results"],
  ];
  const colW = 5.85;
  const startX = [0.6, 6.75];
  const startY = 1.85;
  const rowH = 1.55;
  items.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = startX[col];
    const y = startY + row * rowH;
    s.addShape("roundRect", {
      x,
      y,
      w: colW,
      h: 1.3,
      rectRadius: 0.08,
      fill: { color: CARD_BG },
      line: { type: "none" },
      shadow: { type: "outer", color: "9AA5B5", opacity: 0.25, blur: 6, offset: 2, angle: 90 },
    });
    s.addShape("ellipse", { x: x + 0.25, y: y + 0.25, w: 0.5, h: 0.5, fill: { color: NAVY }, line: { type: "none" } });
    s.addText(String(i + 1), {
      x: x + 0.25,
      y: y + 0.25,
      w: 0.5,
      h: 0.5,
      align: "center",
      valign: "middle",
      fontFace: FONT_HEAD,
      bold: true,
      fontSize: 18,
      color: WHITE,
      isTextBox: true,
      margin: 0,
    });
    s.addText(item[0], {
      x: x + 0.95,
      y: y + 0.16,
      w: colW - 1.1,
      h: 0.4,
      fontFace: FONT_BODY,
      bold: true,
      fontSize: 15,
      color: NAVY,
      isTextBox: true,
      margin: 0,
    });
    s.addText(item[1], {
      x: x + 0.95,
      y: y + 0.55,
      w: colW - 1.1,
      h: 0.65,
      fontFace: FONT_BODY,
      fontSize: 11.5,
      color: MUTED,
      isTextBox: true,
      margin: 0,
    });
  });
  footer(s, nextPage());
}

// ===========================================================================
// Slide 3 — Project Overview
// ===========================================================================
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "Introduction", "What the System Does");

  s.addText(
    "A web application that helps students and staff report lost and found items, automatically compares reports using a rule-based matching algorithm, and supports staff in verifying ownership before an item is handed over.",
    {
      x: 0.6,
      y: 1.75,
      w: 6.6,
      h: 1.5,
      fontFace: FONT_BODY,
      fontSize: 15,
      color: BODY_TEXT,
      isTextBox: true,
      margin: 0,
      lineSpacing: 22,
    }
  );

  const bullets = [
    "Item reporting with rule-based match scoring (name, description, color, brand, location, date)",
    "Ownership verification via claim evidence and staff decisions",
    "Handover confirmation requiring in-person identity checks",
    "In-app notifications and full audit logging",
    "Role-based access across Student, Staff, and Admin",
  ];
  s.addText(
    bullets.map((b, i) => ({ text: b, options: { bullet: { code: "25AA", color: AMBER }, breakLine: i < bullets.length - 1 } })),
    {
      x: 0.6,
      y: 3.25,
      w: 6.6,
      h: 3.2,
      fontFace: FONT_BODY,
      fontSize: 13.5,
      color: BODY_TEXT,
      isTextBox: true,
      margin: 0,
      paraSpaceAfter: 12,
    }
  );

  // Tech stack card
  const cx = 7.7,
    cy = 1.75,
    cw = 5.0,
    ch = 4.9;
  s.addShape("roundRect", { x: cx, y: cy, w: cw, h: ch, rectRadius: 0.1, fill: { color: NAVY }, line: { type: "none" } });
  s.addText("TECH STACK", {
    x: cx + 0.4,
    y: cy + 0.35,
    w: cw - 0.8,
    h: 0.4,
    fontFace: FONT_BODY,
    bold: true,
    fontSize: 13,
    color: AMBER,
    charSpacing: 2,
    isTextBox: true,
    margin: 0,
  });

  const stack = [
    ["react.png", "React 19 + TypeScript", "Vite, React Router v7"],
    ["node.png", "Node.js + Express", "Zod validation, Multer uploads"],
    ["database.png", "PostgreSQL + Prisma", "Custom TS/ESM client via tsx"],
  ];
  stack.forEach(([icon, title, sub], i) => {
    const iy = cy + 0.95 + i * 1.25;
    s.addShape("roundRect", { x: cx + 0.4, y: iy, w: 0.75, h: 0.75, rectRadius: 0.14, fill: { color: WHITE }, line: { type: "none" } });
    s.addImage({ path: path.join(ASSETS, icon), x: cx + 0.55, y: iy + 0.15, w: 0.45, h: 0.45 });
    s.addText(title, {
      x: cx + 1.35,
      y: iy + 0.02,
      w: cw - 1.7,
      h: 0.4,
      fontFace: FONT_BODY,
      bold: true,
      fontSize: 14,
      color: WHITE,
      isTextBox: true,
      margin: 0,
    });
    s.addText(sub, {
      x: cx + 1.35,
      y: iy + 0.4,
      w: cw - 1.7,
      h: 0.35,
      fontFace: FONT_BODY,
      fontSize: 11,
      color: "AEB9CC",
      isTextBox: true,
      margin: 0,
    });
  });
  footer(s, nextPage());
}

// ===========================================================================
// Slide 4 — Functional Scope
// ===========================================================================
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "Requirements", "Functional Scope");

  const inScope = [
    "Item reporting for lost & found (optional photos)",
    "Rule-based matching & score calculation",
    "Confirm / dismiss suggested matches",
    "Ownership verification via evidence",
    "Claim management + handover confirmation",
    "In-app notifications & audit logging",
    "Role-based access (Student / Staff / Admin)",
  ];
  const outScope = [
    "Real Microsoft/AU authentication",
    "User account management",
    "Email or SMS notifications",
    "Mobile application",
    "AI-based image recognition",
    "Database performance optimization",
  ];

  function scopeCard(x, title, items, color, iconName) {
    const w = 5.85,
      y = 1.75,
      h = 4.9;
    s.addShape("roundRect", { x, y, w, h, rectRadius: 0.1, fill: { color: CARD_BG }, line: { type: "none" } });
    iconCircle(s, { x: x + 0.35, y: y + 0.35, d: 0.55, color, icon: path.join(ASSETS, iconName), iconScale: 0.5 });
    s.addText(title, {
      x: x + 1.05,
      y: y + 0.35,
      w: w - 1.4,
      h: 0.55,
      valign: "middle",
      fontFace: FONT_HEAD,
      bold: true,
      fontSize: 18,
      color: NAVY,
      isTextBox: true,
      margin: 0,
    });
    s.addText(
      items.map((it, i) => ({ text: it, options: { bullet: { code: "25AA", color }, breakLine: i < items.length - 1 } })),
      {
        x: x + 0.35,
        y: y + 1.15,
        w: w - 0.7,
        h: h - 1.4,
        fontFace: FONT_BODY,
        fontSize: 12.5,
        color: BODY_TEXT,
        isTextBox: true,
        margin: 0,
        paraSpaceAfter: 10,
      }
    );
  }
  scopeCard(0.6, "In Scope", inScope, NAVY, "checkwhite.png");
  scopeCard(6.85, "Out of Scope", outScope, "B0392B", "bug.png");
  footer(s, nextPage());
}

// ===========================================================================
// Slide 5 — Testing Strategy Overview
// ===========================================================================
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "Methodology", "Six Testing Techniques Applied");

  const cards = [
    ["unit.png", "Unit Testing", "91 tests across 4 files, pure-function isolation via Jest"],
    ["controlflow.png", "Control Flow", "9 functions · 38 independent CFG paths"],
    ["dataflow.png", "Data Flow", "def / c-use / p-use analysis on every CFG"],
    ["domain.png", "Domain Testing", "13 boundary cases on the live application"],
    ["integration.png", "Integration", "7 automated end-to-end API scenarios"],
    ["access.png", "Access Control", "Role-based 403/200 checks, Bruno + automated"],
  ];
  const colW = 3.9,
    gap = 0.25;
  const startX = 0.6,
    startY = 1.85,
    cardH = 2.35;
  cards.forEach((c, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = startX + col * (colW + gap);
    const y = startY + row * (cardH + 0.3);
    s.addShape("roundRect", {
      x,
      y,
      w: colW,
      h: cardH,
      rectRadius: 0.1,
      fill: { color: row === 0 ? NAVY : CARD_BG },
      line: { type: "none" },
    });
    iconCircle(s, { x: x + 0.3, y: y + 0.3, d: 0.65, color: AMBER, icon: path.join(ASSETS, c[0]), iconScale: 0.5 });
    s.addText(c[1], {
      x: x + 0.3,
      y: y + 1.1,
      w: colW - 0.6,
      h: 0.4,
      fontFace: FONT_BODY,
      bold: true,
      fontSize: 15,
      color: row === 0 ? WHITE : NAVY,
      isTextBox: true,
      margin: 0,
    });
    s.addText(c[2], {
      x: x + 0.3,
      y: y + 1.5,
      w: colW - 0.6,
      h: 0.75,
      fontFace: FONT_BODY,
      fontSize: 11,
      color: row === 0 ? "C9D3E3" : MUTED,
      isTextBox: true,
      margin: 0,
    });
  });
  footer(s, nextPage());
}

// ===========================================================================
// Slide 6 — Unit Testing
// ===========================================================================
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "1 / 6 — Unit Testing", "Verifying Functions in Isolation");

  s.addText(
    "Jest 30.4.2 on Node.js v22.12.0. matchingService, claimService, and notificationService are pure functions with no database dependency — the full suite runs in well under a second.",
    {
      x: 0.6,
      y: 1.7,
      w: 6.6,
      h: 1.0,
      fontFace: FONT_BODY,
      fontSize: 13.5,
      color: BODY_TEXT,
      isTextBox: true,
      margin: 0,
      lineSpacing: 20,
    }
  );

  const rows = [
    ["matchingService.test.js", "7 scorers + calculateMatchScore", "50"],
    ["claimService.test.js", "decideClaim, canConfirmHandover", "17"],
    ["validation.test.js", "Zod schema equivalence partitioning", "17"],
    ["notificationService.test.js", "buildNotificationMessage (5 types)", "7"],
  ];
  const tableRows = [
    [
      { text: "Test File", options: { bold: true, color: WHITE, fill: { color: NAVY } } },
      { text: "Coverage", options: { bold: true, color: WHITE, fill: { color: NAVY } } },
      { text: "Tests", options: { bold: true, color: WHITE, fill: { color: NAVY }, align: "center" } },
    ],
    ...rows.map(([f, c, n]) => [
      { text: f, options: { color: BODY_TEXT } },
      { text: c, options: { color: BODY_TEXT } },
      { text: n, options: { color: BODY_TEXT, align: "center", bold: true } },
    ]),
  ];
  s.addTable(tableRows, {
    x: 0.6,
    y: 2.85,
    w: 6.6,
    colW: [2.7, 3.0, 0.9],
    fontFace: FONT_BODY,
    fontSize: 11.5,
    border: { type: "solid", color: "DDE1E8", pt: 0.75 },
    autoPage: false,
    rowH: 0.5,
  });

  // Big stat callout
  const bx = 7.7,
    by = 1.7,
    bw = 5.0,
    bh = 4.95;
  s.addShape("roundRect", { x: bx, y: by, w: bw, h: bh, rectRadius: 0.1, fill: { color: NAVY }, line: { type: "none" } });
  s.addText("91", {
    x: bx,
    y: by + 0.5,
    w: bw,
    h: 1.5,
    align: "center",
    fontFace: FONT_HEAD,
    bold: true,
    fontSize: 90,
    color: AMBER,
    isTextBox: true,
    margin: 0,
  });
  s.addText("UNIT TESTS — ALL PASSING", {
    x: bx,
    y: by + 2.05,
    w: bw,
    h: 0.4,
    align: "center",
    fontFace: FONT_BODY,
    bold: true,
    fontSize: 14,
    color: WHITE,
    charSpacing: 1,
    isTextBox: true,
    margin: 0,
  });
  s.addShape("line", { x: bx + 0.8, y: by + 2.65, w: bw - 1.6, h: 0, line: { color: "3C4E70", width: 1 } });
  s.addText(
    [
      { text: "Equivalence Partitioning — validation.test.js", options: { bullet: { code: "25AA", color: AMBER }, breakLine: true } },
      { text: "Boundary Value Analysis — classifyScore, scoreDate", options: { bullet: { code: "25AA", color: AMBER }, breakLine: true } },
      { text: "Decision Table Testing — decideClaim (6 rules)", options: { bullet: { code: "25AA", color: AMBER }, breakLine: true } },
      { text: "Edge cases: null/array input, empty descriptions, out-of-domain scores", options: { bullet: { code: "25AA", color: AMBER } } },
    ],
    {
      x: bx + 0.5,
      y: by + 2.9,
      w: bw - 1.0,
      h: 1.8,
      fontFace: FONT_BODY,
      fontSize: 12,
      color: "C9D3E3",
      isTextBox: true,
      margin: 0,
      paraSpaceAfter: 10,
      bullet: { code: "25AA", color: AMBER },
    }
  );
  footer(s, nextPage());
}

// ===========================================================================
// Slide 7 — Control Flow Testing
// ===========================================================================
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "2 / 6 — Control Flow Testing", "Every Branch, Mapped and Covered");

  s.addImage({ path: path.join(CFG, "decideClaim.png"), x: 0.6, y: 1.7, w: 7.1, h: 7.1 * (555 / 1400), sizing: { type: "contain", w: 7.1, h: 4.7 } });

  s.addText("decideClaim() — the claim-approval decision table, as a CFG", {
    x: 0.6,
    y: 6.45,
    w: 7.1,
    h: 0.4,
    italic: true,
    fontFace: FONT_BODY,
    fontSize: 11,
    color: MUTED,
    isTextBox: true,
    margin: 0,
  });

  const bx = 8.0,
    by = 1.7,
    bw = 4.7;
  const stats = [
    ["9", "functions analyzed"],
    ["38", "independent branch-coverage paths"],
    ["V(G)=8", "highest complexity — decideClaim()"],
  ];
  stats.forEach(([num, label], i) => {
    const y = by + i * 1.15;
    s.addText(num, {
      x: bx,
      y,
      w: 1.6,
      h: 0.9,
      fontFace: FONT_HEAD,
      bold: true,
      fontSize: 34,
      color: NAVY,
      isTextBox: true,
      margin: 0,
    });
    s.addText(label, {
      x: bx + 1.65,
      y: y + 0.18,
      w: bw - 1.7,
      h: 0.6,
      valign: "middle",
      fontFace: FONT_BODY,
      fontSize: 12.5,
      color: BODY_TEXT,
      isTextBox: true,
      margin: 0,
    });
  });

  s.addShape("roundRect", { x: bx, y: by + 3.55, w: bw, h: 1.85, rectRadius: 0.1, fill: { color: CARD_BG }, line: { type: "none" } });
  s.addText(
    "Notation: “1-2(T)-3” means from node 1, go to node 2, take the True branch to node 3. One discovery: a defensive branch in scoreDescription() is provably unreachable — flagged as an observation, not a defect.",
    {
      x: bx + 0.3,
      y: by + 3.75,
      w: bw - 0.6,
      h: 1.5,
      fontFace: FONT_BODY,
      fontSize: 11.5,
      color: BODY_TEXT,
      isTextBox: true,
      margin: 0,
      lineSpacing: 16,
    }
  );
  footer(s, nextPage());
}

// ===========================================================================
// Slide 8 — Data Flow Testing
// ===========================================================================
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "3 / 6 — Data Flow Testing", "Tracking Variables Through Every Path");

  s.addText(
    "Data flow testing analyzes how each variable is defined (def) and used (c-use / p-use) across the same control flow graphs — finding definition-use pairs that unit tests must exercise.",
    {
      x: 0.6,
      y: 1.75,
      w: 11.9,
      h: 0.9,
      fontFace: FONT_BODY,
      fontSize: 14,
      color: BODY_TEXT,
      isTextBox: true,
      margin: 0,
      lineSpacing: 20,
    }
  );

  const tableRows = [
    [
      { text: "Edges (i,j)", options: { bold: true, color: WHITE, fill: { color: NAVY } } },
      { text: "predicate(i,j)", options: { bold: true, color: WHITE, fill: { color: NAVY } } },
      { text: "p-use(i,j)", options: { bold: true, color: WHITE, fill: { color: NAVY } } },
    ],
    [{ text: "(9,10)" }, { text: "matchResult===WEAK && !staffVerifiedEvidence" }, { text: "{matchResult, staffVerifiedEvidence}" }],
    [{ text: "(9,11)" }, { text: "~(matchResult===WEAK && !staffVerifiedEvidence)" }, { text: "{matchResult, staffVerifiedEvidence}" }],
  ].map((row) => row.map((c) => ({ text: c.text, options: { ...c.options, color: c.options?.color || BODY_TEXT, fontSize: 12 } })));

  s.addTable(tableRows, {
    x: 0.6,
    y: 2.95,
    w: 11.9,
    colW: [1.8, 6.2, 3.9],
    fontFace: FONT_BODY,
    fontSize: 12,
    border: { type: "solid", color: "DDE1E8", pt: 0.75 },
    autoPage: false,
    rowH: 0.55,
  });
  s.addText("Excerpt from decideClaim() — full def/c-use/p-use tables for all 9 functions are in the written report.", {
    x: 0.6,
    y: 4.75,
    w: 11.9,
    h: 0.4,
    italic: true,
    fontFace: FONT_BODY,
    fontSize: 11,
    color: MUTED,
    isTextBox: true,
    margin: 0,
  });

  const stripY = 5.4;
  const stats = [
    ["9", "functions with full DU analysis"],
    ["100%", "DU-pairs covered by existing unit tests"],
    ["0", "additional tests needed"],
  ];
  stats.forEach(([num, label], i) => {
    const x = 0.6 + i * 4.0;
    s.addShape("roundRect", { x, y: stripY, w: 3.7, h: 1.35, rectRadius: 0.1, fill: { color: CARD_BG }, line: { type: "none" } });
    s.addText(num, {
      x: x + 0.25,
      y: stripY + 0.15,
      w: 1.4,
      h: 1.05,
      valign: "middle",
      fontFace: FONT_HEAD,
      bold: true,
      fontSize: 30,
      color: NAVY,
      isTextBox: true,
      margin: 0,
    });
    s.addText(label, {
      x: x + 1.6,
      y: stripY + 0.15,
      w: 1.9,
      h: 1.05,
      valign: "middle",
      fontFace: FONT_BODY,
      fontSize: 11.5,
      color: BODY_TEXT,
      isTextBox: true,
      margin: 0,
    });
  });
  footer(s, nextPage());
}

// ===========================================================================
// Slide 9 — Domain Testing
// ===========================================================================
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "4 / 6 — Domain Testing", "Exercising the Match-Score Boundaries");

  s.addText(
    "Every threshold in the rule-based matching engine was tested at its boundary using the live application — 13 cases in total, covering item reporting, matching, claims, handover, and role access.",
    {
      x: 0.6,
      y: 1.7,
      w: 11.9,
      h: 0.7,
      fontFace: FONT_BODY,
      fontSize: 13.5,
      color: BODY_TEXT,
      isTextBox: true,
      margin: 0,
      lineSpacing: 18,
    }
  );

  const bands = [
    { label: "WEAK MATCH", range: "0 – 49", color: "B0392B", shot: "07-match-weak.png" },
    { label: "POSSIBLE MATCH", range: "50 – 74", color: AMBER, shot: "06-match-possible.png" },
    { label: "STRONG MATCH", range: "75 – 100", color: "2E7D5B", shot: "05-match-strong.png" },
  ];
  const cw = 3.85,
    gap = 0.2,
    startX = 0.6,
    y = 2.6;
  bands.forEach((b, i) => {
    const x = startX + i * (cw + gap);
    s.addShape("roundRect", { x, y, w: cw, h: 3.9, rectRadius: 0.1, fill: { color: CARD_BG }, line: { type: "none" } });
    s.addShape("roundRect", { x: x + 0.25, y: y + 0.25, w: cw - 0.5, h: 0.55, rectRadius: 0.06, fill: { color: b.color }, line: { type: "none" } });
    s.addText(b.label, {
      x: x + 0.25,
      y: y + 0.25,
      w: cw - 0.5,
      h: 0.55,
      align: "center",
      valign: "middle",
      fontFace: FONT_BODY,
      bold: true,
      fontSize: 13,
      color: WHITE,
      isTextBox: true,
      margin: 0,
    });
    s.addText(b.range + " pts", {
      x: x + 0.25,
      y: y + 0.9,
      w: cw - 0.5,
      h: 0.35,
      align: "center",
      fontFace: FONT_BODY,
      fontSize: 12,
      color: MUTED,
      isTextBox: true,
      margin: 0,
    });
    s.addImage({ path: path.join(SHOTS, b.shot), x: x + 0.25, y: y + 1.35, w: cw - 0.5, h: 2.35, sizing: { type: "contain", w: cw - 0.5, h: 2.35 } });
  });
  footer(s, nextPage());
}

// ===========================================================================
// Slide 10 — Integration Testing
// ===========================================================================
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "5 / 6 — Integration Testing", "The Full Pipeline, End to End");

  const steps = ["Report", "Match", "Confirm", "Claim", "Decide", "Handover"];
  const pw = 1.85,
    gap = 0.2,
    startX = 0.6,
    py = 1.85;
  steps.forEach((label, i) => {
    const x = startX + i * (pw + gap);
    s.addShape("roundRect", { x, y: py, w: pw, h: 0.75, rectRadius: 0.08, fill: { color: i === steps.length - 1 ? AMBER : NAVY }, line: { type: "none" } });
    s.addText(label, {
      x,
      y: py,
      w: pw,
      h: 0.75,
      align: "center",
      valign: "middle",
      fontFace: FONT_BODY,
      bold: true,
      fontSize: 12.5,
      color: i === steps.length - 1 ? NAVY : WHITE,
      isTextBox: true,
      margin: 0,
    });
    if (i < steps.length - 1) {
      s.addImage({ path: path.join(ASSETS, "arrow.png"), x: x + pw + 0.01, y: py + 0.24, w: 0.28, h: 0.28 });
    }
  });

  s.addText(
    "Automated end-to-end via tests/integration/apiIntegration.test.js (node:test under tsx) against the real Express API and PostgreSQL database — not mocks.",
    {
      x: 0.6,
      y: 2.85,
      w: 11.9,
      h: 0.5,
      fontFace: FONT_BODY,
      italic: true,
      fontSize: 12.5,
      color: MUTED,
      isTextBox: true,
      margin: 0,
    }
  );

  const rows = [
    ["TC-IT-001", "Report ↔ Matching", "matchScore=100, STRONG_MATCH", "Pass"],
    ["TC-IT-003", "Matching ↔ Claim", "Claim created, status PENDING", "Pass"],
    ["TC-IT-005", "Claim ↔ Report Status", "Both reports → RESOLVED", "Pass"],
    ["TC-IT-006", "Claim ↔ AuditLog", "3 audit entries recorded", "Pass"],
    ["TC-IT-007", "Role ↔ Route Access", "403 / 403 / 200 as expected", "Pass"],
  ];
  const tableRows = [
    [
      { text: "ID", options: { bold: true, color: WHITE, fill: { color: NAVY } } },
      { text: "Modules", options: { bold: true, color: WHITE, fill: { color: NAVY } } },
      { text: "Actual Result", options: { bold: true, color: WHITE, fill: { color: NAVY } } },
      { text: "Status", options: { bold: true, color: WHITE, fill: { color: NAVY }, align: "center" } },
    ],
    ...rows.map(([id, mod, res, status]) => [
      { text: id, options: { color: BODY_TEXT } },
      { text: mod, options: { color: BODY_TEXT } },
      { text: res, options: { color: BODY_TEXT } },
      { text: status, options: { color: "2E7D5B", bold: true, align: "center" } },
    ]),
  ];
  s.addTable(tableRows, {
    x: 0.6,
    y: 3.55,
    w: 11.9,
    colW: [1.5, 3.0, 5.9, 1.5],
    fontFace: FONT_BODY,
    fontSize: 12,
    border: { type: "solid", color: "DDE1E8", pt: 0.75 },
    autoPage: false,
    rowH: 0.5,
  });
  footer(s, nextPage());
}

// ===========================================================================
// Slide 11 — Access Control Testing
// ===========================================================================
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "6 / 6 — Access Control Testing", "Role-Based Security, Verified Twice");

  s.addText(
    "Access control is enforced server-side by a requireRole middleware and exercised two independent ways: the automated integration suite, and a reproducible Bruno API collection anyone on the team can re-run.",
    {
      x: 0.6,
      y: 1.7,
      w: 6.7,
      h: 1.1,
      fontFace: FONT_BODY,
      fontSize: 13.5,
      color: BODY_TEXT,
      isTextBox: true,
      margin: 0,
      lineSpacing: 19,
    }
  );

  const roles = [
    ["student.png", "Student", "Report items, submit claims, view own notifications"],
    ["staff.png", "Staff", "Review & decide claims, confirm handover"],
    ["admin.png", "Admin", "View audit log (only role permitted)"],
  ];
  roles.forEach((r, i) => {
    const y = 2.95 + i * 0.98;
    s.addShape("roundRect", { x: 0.6, y, w: 6.7, h: 0.82, rectRadius: 0.08, fill: { color: CARD_BG }, line: { type: "none" } });
    iconCircle(s, { x: 0.78, y: y + 0.14, d: 0.55, color: NAVY, icon: path.join(ASSETS, r[0]), iconScale: 0.5 });
    s.addText(r[1], {
      x: 1.5,
      y: y + 0.08,
      w: 2.0,
      h: 0.32,
      fontFace: FONT_BODY,
      bold: true,
      fontSize: 13.5,
      color: NAVY,
      isTextBox: true,
      margin: 0,
    });
    s.addText(r[2], {
      x: 1.5,
      y: y + 0.4,
      w: 5.6,
      h: 0.35,
      fontFace: FONT_BODY,
      fontSize: 11,
      color: MUTED,
      isTextBox: true,
      margin: 0,
    });
  });

  s.addImage({
    path: path.join(SHOTS, "20-role-blocked-staff.png"),
    x: 7.65,
    y: 1.7,
    w: 5.05,
    h: 5.0,
    sizing: { type: "contain", w: 5.05, h: 5.0 },
  });
  s.addText("A Student redirected away from the Staff dashboard — UI-level role gating in action", {
    x: 7.65,
    y: 6.65,
    w: 5.05,
    h: 0.4,
    italic: true,
    fontFace: FONT_BODY,
    fontSize: 10.5,
    color: MUTED,
    align: "center",
    isTextBox: true,
    margin: 0,
  });
  footer(s, nextPage());
}

// ===========================================================================
// Slide 12 — Defect Found & Fixed
// ===========================================================================
{
  const s = bgSlide(NAVY);
  s.addText("DEFECT FOUND & RESOLVED", {
    x: 0.6,
    y: 0.55,
    w: 10,
    h: 0.4,
    fontFace: FONT_BODY,
    bold: true,
    fontSize: 13,
    color: AMBER,
    charSpacing: 2,
    isTextBox: true,
    margin: 0,
  });
  s.addText("A Real Bug, Caught Before Users Saw It", {
    x: 0.6,
    y: 0.9,
    w: 12,
    h: 0.7,
    fontFace: FONT_HEAD,
    bold: true,
    fontSize: 30,
    color: WHITE,
    isTextBox: true,
    margin: 0,
  });

  const colW = 5.85,
    y0 = 2.05,
    h0 = 4.6;
  // Before card
  s.addShape("roundRect", { x: 0.6, y: y0, w: colW, h: h0, rectRadius: 0.1, fill: { color: "2A1A1A" }, line: { type: "none" } });
  iconCircle(s, { x: 0.95, y: y0 + 0.35, d: 0.6, color: "B0392B", icon: path.join(ASSETS, "bug.png"), iconScale: 0.55 });
  s.addText("BEFORE", {
    x: 1.7,
    y: y0 + 0.45,
    w: 3,
    h: 0.4,
    fontFace: FONT_BODY,
    bold: true,
    fontSize: 15,
    color: "E88A7A",
    isTextBox: true,
    margin: 0,
  });
  s.addText(
    "GET /api/claims/by-code/ (empty code) and a malformed claim ID both returned an uncaught 500 Internal Server Error.",
    {
      x: 0.95,
      y: y0 + 1.15,
      w: colW - 0.7,
      h: 1.1,
      fontFace: FONT_BODY,
      fontSize: 13,
      color: "F0D9D3",
      isTextBox: true,
      margin: 0,
      lineSpacing: 18,
    }
  );
  s.addText(
    "Root cause: Express routed the bad segment to GET /:id, which passed it straight to Prisma. Postgres rejected it as invalid UUID syntax (error P2007) — a code errorHandler.js didn't recognize.",
    {
      x: 0.95,
      y: y0 + 2.35,
      w: colW - 0.7,
      h: 1.9,
      fontFace: FONT_BODY,
      italic: true,
      fontSize: 12,
      color: "C9A99F",
      isTextBox: true,
      margin: 0,
      lineSpacing: 17,
    }
  );

  // After card
  const ax = 6.85;
  s.addShape("roundRect", { x: ax, y: y0, w: colW, h: h0, rectRadius: 0.1, fill: { color: "12291F" }, line: { type: "none" } });
  iconCircle(s, { x: ax + 0.35, y: y0 + 0.35, d: 0.6, color: "2E7D5B", icon: path.join(ASSETS, "checkwhite.png"), iconScale: 0.55 });
  s.addText("AFTER", {
    x: ax + 1.1,
    y: y0 + 0.45,
    w: 3,
    h: 0.4,
    fontFace: FONT_BODY,
    bold: true,
    fontSize: 15,
    color: "7ED6A5",
    isTextBox: true,
    margin: 0,
  });
  s.addText("Fixed in src/middleware/errorHandler.js: Prisma codes P2007 and P2023 now map to a clean 404 Not Found.", {
    x: ax + 0.35,
    y: y0 + 1.15,
    w: colW - 0.7,
    h: 1.1,
    fontFace: FONT_BODY,
    fontSize: 13,
    color: "D3F0DE",
    isTextBox: true,
    margin: 0,
    lineSpacing: 18,
  });
  s.addText(
    "Verified via curl and the Bruno “Get Claim by Code” request. Full regression re-run afterward: 91/91 unit tests and 9/9 integration checks still passing.",
    {
      x: ax + 0.35,
      y: y0 + 2.35,
      w: colW - 0.7,
      h: 1.9,
      fontFace: FONT_BODY,
      italic: true,
      fontSize: 12,
      color: "A0C9B0",
      isTextBox: true,
      margin: 0,
      lineSpacing: 17,
    }
  );
  footer(s, nextPage(), true);
}

// ===========================================================================
// Slide 13 — Final Results Summary
// ===========================================================================
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "Results", "Final Test Execution Summary");

  const stats = [
    ["91", "Unit Tests"],
    ["38", "Control-Flow Paths"],
    ["13", "Domain Cases"],
    ["7", "Integration Scenarios"],
    ["6", "Access Control Checks"],
  ];
  const cw = 2.28,
    gap = 0.15,
    startX = 0.6,
    y = 1.8;
  stats.forEach((st, i) => {
    const x = startX + i * (cw + gap);
    s.addShape("roundRect", { x, y, w: cw, h: 1.9, rectRadius: 0.1, fill: { color: NAVY }, line: { type: "none" } });
    s.addText(st[0], {
      x,
      y: y + 0.18,
      w: cw,
      h: 1.0,
      align: "center",
      fontFace: FONT_HEAD,
      bold: true,
      fontSize: 40,
      color: AMBER,
      isTextBox: true,
      margin: 0,
    });
    s.addText(st[1], {
      x: x + 0.1,
      y: y + 1.25,
      w: cw - 0.2,
      h: 0.55,
      align: "center",
      fontFace: FONT_BODY,
      bold: true,
      fontSize: 11,
      color: WHITE,
      isTextBox: true,
      margin: 0,
    });
  });

  s.addShape("roundRect", { x: 0.6, y: 4.0, w: 11.9, h: 0.85, rectRadius: 0.1, fill: { color: "E9F3EC" }, line: { type: "none" } });
  s.addImage({ path: path.join(ASSETS, "check.png"), x: 0.9, y: 4.2, w: 0.45, h: 0.45 });
  s.addText("155 total test cases executed across all six techniques — 100% Pass, zero open defects.", {
    x: 1.5,
    y: 4.0,
    w: 10.7,
    h: 0.85,
    valign: "middle",
    fontFace: FONT_BODY,
    bold: true,
    fontSize: 16,
    color: "1F6B45",
    isTextBox: true,
    margin: 0,
  });

  const codeLines = [
    "$ npm test                              Tests: 91 passed, 91 total",
    "$ npm run test:integration               # pass 9   # fail 0",
    "$ npx @usebruno/cli run --env Local -r   Requests 22 (22 Passed) · Tests 18/18",
  ];
  s.addShape("roundRect", { x: 0.6, y: 5.1, w: 11.9, h: 1.55, rectRadius: 0.08, fill: { color: "1E1E1E" }, line: { type: "none" } });
  s.addText(
    codeLines.map((l, i) => ({ text: l, options: { breakLine: i < codeLines.length - 1 } })),
    {
      x: 0.9,
      y: 5.3,
      w: 11.3,
      h: 1.2,
      fontFace: "Consolas",
      fontSize: 12,
      color: "D4D4D4",
      isTextBox: true,
      margin: 0,
      paraSpaceAfter: 6,
    }
  );
  footer(s, nextPage());
}

// ===========================================================================
// Slide 14 — Key Takeaways
// ===========================================================================
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "Conclusion", "Key Takeaways");

  const points = [
    ["shield.png", "High-risk logic, fully covered", "The rule-based matching engine, claim decisions, and handover eligibility — flagged as highest-risk for their branching complexity — are covered by CFG/DFG analysis, not just spot checks."],
    ["lightbulb.png", "Static analysis found a real defect", "Building the CFGs surfaced an unreachable branch and, separately, the by-code 500-error bug — both fixed before this report was finalized."],
    ["checkwhite.png", "Every result is reproducible", "Automated integration tests and a Bruno collection mean any teammate can re-run and independently verify every “Pass” claim in this report."],
  ];
  const y0 = 1.85,
    rowH = 1.55;
  points.forEach((pt, i) => {
    const y = y0 + i * rowH;
    iconCircle(s, { x: 0.6, y: y + 0.1, d: 0.85, color: NAVY, icon: path.join(ASSETS, pt[0]), iconScale: 0.5 });
    s.addText(pt[1], {
      x: 1.75,
      y,
      w: 10.8,
      h: 0.45,
      fontFace: FONT_BODY,
      bold: true,
      fontSize: 16,
      color: NAVY,
      isTextBox: true,
      margin: 0,
    });
    s.addText(pt[2], {
      x: 1.75,
      y: y + 0.48,
      w: 10.8,
      h: 0.95,
      fontFace: FONT_BODY,
      fontSize: 12.5,
      color: BODY_TEXT,
      isTextBox: true,
      margin: 0,
      lineSpacing: 17,
    });
  });
  footer(s, nextPage());
}

// ===========================================================================
// Slide 15 — Thank You
// ===========================================================================
{
  const s = bgSlide(NAVY);
  s.addShape("ellipse", { x: -2, y: -2, w: 6, h: 6, fill: { color: NAVY_DARK }, line: { type: "none" } });
  s.addShape("ellipse", { x: 10.2, y: 4.5, w: 5.5, h: 5.5, fill: { color: NAVY_DARK }, line: { type: "none" } });

  iconCircle(s, { x: 5.9, y: 2.1, d: 1.1, color: AMBER, icon: path.join(ASSETS, "tag.png"), iconScale: 0.55 });

  s.addText("Thank You", {
    x: 0,
    y: 3.35,
    w: 13.333,
    h: 1.0,
    align: "center",
    fontFace: FONT_HEAD,
    bold: true,
    fontSize: 44,
    color: WHITE,
    isTextBox: true,
    margin: 0,
  });
  s.addText("Questions & Discussion", {
    x: 0,
    y: 4.35,
    w: 13.333,
    h: 0.5,
    align: "center",
    fontFace: FONT_BODY,
    italic: true,
    fontSize: 17,
    color: "C9D3E3",
    isTextBox: true,
    margin: 0,
  });
  s.addText("Campus Lost & Found Management System  ·  CSX4104/ITX4104 Software Testing", {
    x: 0,
    y: 6.85,
    w: 13.333,
    h: 0.4,
    align: "center",
    fontFace: FONT_BODY,
    fontSize: 11,
    color: "8A93A6",
    isTextBox: true,
    margin: 0,
  });
}

pres.writeFile({ fileName: path.join(__dirname, "Campus_Lost_and_Found_Presentation.pptx") }).then(() => {
  console.log("Wrote presentation.");
});
