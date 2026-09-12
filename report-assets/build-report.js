const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ImageRun,
  ShadingType,
  BorderStyle,
  AlignmentType,
  PageBreak,
  TableOfContents,
} = require("docx");

const CFG_DIR = path.join(__dirname, "cfg");
const SHOT_DIR = path.join(__dirname, "screenshots");

function pngSize(file) {
  const buf = fs.readFileSync(file);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function imagePara(file, displayWidth = 560, caption) {
  const { width, height } = pngSize(file);
  const displayHeight = Math.round(displayWidth * (height / width));
  const children = [
    new Paragraph({
      children: [
        new ImageRun({
          type: "png",
          data: fs.readFileSync(file),
          transformation: { width: displayWidth, height: displayHeight },
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: caption ? 60 : 200 },
    }),
  ];
  if (caption) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: caption, italics: true, size: 18, color: "5B6570" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }
  return children;
}

function h1(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } });
}
function h2(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } });
}
function h3(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_3, spacing: { before: 250, after: 120 } });
}
function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, ...opts })],
    spacing: { after: 160 },
  });
}
function bullet(text) {
  return new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 80 } });
}
function numbered(n, text) {
  return new Paragraph({
    children: [new TextRun({ text: `${n}. `, bold: true }), new TextRun({ text })],
    spacing: { after: 100 },
    indent: { left: 260 },
  });
}
function code(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Consolas", size: 18 })],
    shading: { type: ShadingType.CLEAR, fill: "F5F6F8" },
    spacing: { after: 40 },
  });
}
function codeBlock(lines) {
  return lines.map((l) => code(l));
}
function darkCode(text) {
  return new Paragraph({
    children: [new TextRun({ text: text || " ", font: "Consolas", size: 18, color: "D4D4D4" })],
    shading: { type: ShadingType.CLEAR, fill: "1E1E1E" },
    spacing: { after: 16 },
  });
}
function darkCodeBlock(lines) {
  return lines.map((l) => darkCode(l));
}
function terminalLine(text) {
  const green = /^(PASS|✓|Tests:.*passed|.*passed,.*total$)/.test(text) || /^✓/.test(text.trim());
  return new Paragraph({
    children: [new TextRun({ text: text || " ", font: "Consolas", size: 18, color: green ? "6A9955" : "D4D4D4" })],
    shading: { type: ShadingType.CLEAR, fill: "0C0C0C" },
    spacing: { after: 16 },
  });
}
function terminalBlock(lines) {
  return lines.map((l) => terminalLine(l));
}

function testCaseBlock(num, title, { input, expectedOutput, description, actualOutput }) {
  const out = [];
  out.push(
    new Paragraph({
      children: [new TextRun({ text: `Test Case ${num}: ${title}`, bold: true, size: 22 })],
      spacing: { before: 220, after: 100 },
    })
  );
  out.push(p("Input:", { bold: true }));
  if (Array.isArray(input)) input.forEach((i) => out.push(bullet(i)));
  else out.push(p(input));
  out.push(p("Expected Output:", { bold: true }));
  out.push(p(expectedOutput));
  out.push(p("Description:", { bold: true }));
  out.push(p(description));
  out.push(p("Actual Output:", { bold: true }));
  out.push(p(actualOutput));
  return out;
}

const CELL_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 2, color: "DDE1E6" },
  bottom: { style: BorderStyle.SINGLE, size: 2, color: "DDE1E6" },
  left: { style: BorderStyle.SINGLE, size: 2, color: "DDE1E6" },
  right: { style: BorderStyle.SINGLE, size: 2, color: "DDE1E6" },
};

function cell(text, { header = false, widthPct, width } = {}) {
  return new TableCell({
    width: width ? { size: width, type: WidthType.DXA } : { size: widthPct, type: WidthType.PERCENTAGE },
    shading: header ? { type: ShadingType.CLEAR, fill: "1C2530" } : undefined,
    borders: CELL_BORDER,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: String(text),
            bold: header,
            color: header ? "FFFFFF" : "1C2530",
            size: 19,
          }),
        ],
      }),
    ],
  });
}

function table(headers, rows, widths) {
  const totalDxa = 9360; // ~6.5in usable width
  const colWidths = widths
    ? widths.map((w) => Math.round((w / 100) * totalDxa))
    : headers.map(() => Math.round(totalDxa / headers.length));
  return new Table({
    width: { size: totalDxa, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((hText, i) => cell(hText, { header: true, width: colWidths[i] })),
      }),
      ...rows.map(
        (r) =>
          new TableRow({
            children: r.map((c, i) => cell(c, { width: colWidths[i] })),
          })
      ),
    ],
  });
}

// ---------------------------------------------------------------------------
// Control Flow + Data Flow function definitions
// ---------------------------------------------------------------------------

const CFG_FUNCTIONS = [
  {
    name: "validateItemForMatching(item, label)",
    file: "validateItemForMatching.png",
    module: "matchingService.js",
    branchCoverage: [
      "P1: 1-2(T)-3 — item is null / not an object",
      "P2: 1-2(F)-4(T)-5-6(F)-4(F)-8(T)-9-10(F)-12(F)-14 — fully valid item",
      "P3: 1-2(F)-4(T)-5-6(T)-7-4(F)-8(F)-12(T)-13 — a required field is missing/empty",
      "P4: 1-2(F)-4(F)-8(T)-9-10(T)-11-12(T)-13 — occurredAt present but unparsable",
      "P5: 1-2(F)-4(F)-8(F)-12(F)-14 — occurredAt omitted entirely",
    ],
    predicateUse: [
      ["(2,3)", "!item || typeof item !== 'object'", "True", "{item}"],
      ["(2,4)", "!item || typeof item !== 'object'", "False", "{item}"],
      ["(4,5)", "has next field in REQUIRED_FIELDS", "True", "{}"],
      ["(4,8)", "has next field in REQUIRED_FIELDS", "False", "{}"],
      ["(6,7)", "value undefined/null/''", "True", "{value}"],
      ["(6,4)", "value undefined/null/''", "False", "{value}"],
      ["(8,9)", "occurredAt !== undefined && !== null", "True", "{item}"],
      ["(8,12)", "occurredAt !== undefined && !== null", "False", "{item}"],
      ["(10,11)", "isNaN(date.getTime())", "True", "{date}"],
      ["(10,12)", "isNaN(date.getTime())", "False", "{date}"],
      ["(12,13)", "errors.length > 0", "True", "{errors}"],
      ["(12,14)", "errors.length > 0", "False", "{errors}"],
    ],
    defCUse: [
      ["1", "{errors}", "{}"],
      ["2", "{}", "{}"],
      ["3", "{}", "{label}"],
      ["4", "{field}", "{}"],
      ["5", "{value}", "{item, field}"],
      ["6", "{}", "{}"],
      ["7", "{errors}", "{errors, field, label}"],
      ["8", "{}", "{}"],
      ["9", "{date}", "{item}"],
      ["10", "{}", "{}"],
      ["11", "{errors}", "{errors, label}"],
      ["12", "{}", "{}"],
      ["13", "{}", "{label, errors}"],
      ["14", "{}", "{}"],
    ],
  },
  {
    name: "scoreItemName(nameA, nameB)",
    file: "scoreItemName.png",
    module: "matchingService.js",
    branchCoverage: [
      "P1: 1-2(T)-3 — either name empty after normalization",
      "P2: 1-2(F)-4(T)-5 — normalized names identical",
      "P3: 1-2(F)-4(F)-6(T)-7 — one name a substring of the other",
      "P4: 1-2(F)-4(F)-6(F)-8 — names unrelated",
    ],
    predicateUse: [
      ["(2,3)", "!a || !b", "True", "{a, b}"],
      ["(2,4)", "!a || !b", "False", "{a, b}"],
      ["(4,5)", "a === b", "True", "{a, b}"],
      ["(4,6)", "a === b", "False", "{a, b}"],
      ["(6,7)", "a.includes(b) || b.includes(a)", "True", "{a, b}"],
      ["(6,8)", "a.includes(b) || b.includes(a)", "False", "{a, b}"],
    ],
    defCUse: [
      ["1", "{a, b}", "{nameA, nameB}"],
      ["2", "{}", "{}"],
      ["3", "{}", "{}"],
      ["4", "{}", "{}"],
      ["5", "{}", "{}"],
      ["6", "{}", "{}"],
      ["7", "{}", "{}"],
      ["8", "{}", "{}"],
    ],
  },
  {
    name: "scoreDescription(descA, descB)",
    file: "scoreDescription.png",
    module: "matchingService.js",
    branchCoverage: [
      "P1: 1-2(T)-3 — both descriptions empty (both word sets size 0)",
      "P2: 1-2(F)-4-5(F)-8-9(F)-11-12 — one description empty, loop body never runs",
      "P3: 1-2(F)-4-5(T)-6(F)-5(loop)-5(F)-8-9(F)-11-12 — both non-empty, no shared words",
      "P4: 1-2(F)-4-5(T)-6(T)-7-5(loop)-5(F)-8-9(F)-11-12 — both non-empty, at least one shared word",
      "P5 (infeasible): 1-2(F)-4-...-8-9(T)-10-12 — unionSize===0 while N2 was False",
    ],
    predicateUse: [
      ["(2,3)", "setA.size===0 && setB.size===0", "True", "{setA, setB}"],
      ["(2,4)", "setA.size===0 && setB.size===0", "False", "{setA, setB}"],
      ["(5,6)", "next word exists in setA (loop test)", "True", "{setA}"],
      ["(5,8)", "next word exists in setA (loop test)", "False", "{setA}"],
      ["(6,7)", "setB.has(word)", "True", "{setB, word}"],
      ["(6,5)", "setB.has(word)", "False", "{setB, word}"],
      ["(9,10)", "unionSize === 0", "True", "{unionSize}"],
      ["(9,11)", "unionSize === 0", "False", "{unionSize}"],
    ],
    defCUse: [
      ["1", "{setA, setB}", "{descA, descB}"],
      ["2", "{}", "{setA, setB}"],
      ["3", "{}", "{}"],
      ["4", "{intersectionSize}", "{}"],
      ["5", "{word}", "{setA}"],
      ["6", "{}", "{setB, word}"],
      ["7", "{intersectionSize}", "{intersectionSize}"],
      ["8", "{unionSize}", "{setA, setB, intersectionSize}"],
      ["9", "{}", "{unionSize}"],
      ["10", "{similarity}", "{}"],
      ["11", "{similarity}", "{intersectionSize, unionSize}"],
      ["12", "{}", "{similarity}"],
    ],
  },
  {
    name: "scoreExactOptionalField(valueA, valueB, weight)",
    file: "scoreExactOptionalField.png",
    module: "matchingService.js",
    branchCoverage: [
      "P1: 1-2(T)-3 — either value empty after normalization",
      "P2: 1-2(F)-4(T)-5 — normalized values identical",
      "P3: 1-2(F)-4(F)-6 — normalized values differ",
    ],
    predicateUse: [
      ["(2,3)", "!a || !b", "True", "{a, b}"],
      ["(2,4)", "!a || !b", "False", "{a, b}"],
      ["(4,5)", "a === b", "True", "{a, b}"],
      ["(4,6)", "a === b", "False", "{a, b}"],
    ],
    defCUse: [
      ["1", "{a, b}", "{valueA, valueB}"],
      ["2", "{}", "{}"],
      ["3", "{}", "{}"],
      ["4", "{}", "{}"],
      ["5", "{}", "{weight}"],
      ["6", "{}", "{}"],
    ],
  },
  {
    name: "scoreLocation(locationA, locationB)",
    file: "scoreLocation.png",
    module: "matchingService.js",
    branchCoverage: [
      "P1: 1-2(T)-3 — either location empty after normalization",
      "P2: 1-2(F)-4(T)-5 — normalized locations identical",
      "P3: 1-2(F)-4(F)-6(T)-7 — one location a substring of the other",
      "P4: 1-2(F)-4(F)-6(F)-8 — locations unrelated",
    ],
    predicateUse: [
      ["(2,3)", "!a || !b", "True", "{a, b}"],
      ["(2,4)", "!a || !b", "False", "{a, b}"],
      ["(4,5)", "a === b", "True", "{a, b}"],
      ["(4,6)", "a === b", "False", "{a, b}"],
      ["(6,7)", "a.includes(b) || b.includes(a)", "True", "{a, b}"],
      ["(6,8)", "a.includes(b) || b.includes(a)", "False", "{a, b}"],
    ],
    defCUse: [
      ["1", "{a, b}", "{locationA, locationB}"],
      ["2", "{}", "{}"],
      ["3", "{}", "{}"],
      ["4", "{}", "{}"],
      ["5", "{}", "{}"],
      ["6", "{}", "{}"],
      ["7", "{}", "{}"],
      ["8", "{}", "{}"],
    ],
  },
  {
    name: "scoreDate(dateA, dateB)",
    file: "scoreDate.png",
    module: "matchingService.js",
    branchCoverage: [
      "P1: 1-2(T)-3 — same-day report (diff = 0)",
      "P2: 1-2(F)-4(T)-5 — 1-3 days apart",
      "P3: 1-2(F)-4(F)-6 — more than 3 days apart",
    ],
    predicateUse: [
      ["(2,3)", "diff === 0", "True", "{diff}"],
      ["(2,4)", "diff === 0", "False", "{diff}"],
      ["(4,5)", "diff <= 3", "True", "{diff}"],
      ["(4,6)", "diff <= 3", "False", "{diff}"],
    ],
    defCUse: [
      ["1", "{diff}", "{dateA, dateB}"],
      ["2", "{}", "{}"],
      ["3", "{}", "{}"],
      ["4", "{}", "{}"],
      ["5", "{}", "{}"],
      ["6", "{}", "{}"],
    ],
  },
  {
    name: "classifyScore(score)",
    file: "classifyScore.png",
    module: "matchingService.js",
    branchCoverage: [
      "P1: 1(T)-2 — score >= 75",
      "P2: 1(F)-3(T)-4 — 50 <= score < 75",
      "P3: 1(F)-3(F)-5 — score < 50",
    ],
    predicateUse: [
      ["(1,2)", "score >= 75", "True", "{score}"],
      ["(1,3)", "score >= 75", "False", "{score}"],
      ["(3,4)", "score >= 50", "True", "{score}"],
      ["(3,5)", "score >= 50", "False", "{score}"],
    ],
    defCUse: [
      ["1", "{}", "{}"],
      ["2", "{}", "{}"],
      ["3", "{}", "{}"],
      ["4", "{}", "{}"],
      ["5", "{}", "{}"],
    ],
  },
  {
    name: "decideClaim({action, hasEvidence, matchResult, staffVerifiedEvidence})",
    file: "decideClaim.png",
    module: "claimService.js",
    branchCoverage: [
      "P1: 1(T)-2 — action not in {APPROVE, REJECT, REQUEST_INFO}",
      "P2: 1(F)-3(T)-4 — valid action, matchResult not a known band",
      "P3: 1(F)-3(F)-5(T)-6 — action = REJECT",
      "P4: 1(F)-3(F)-5(F)-7(T)-8 — action = REQUEST_INFO",
      "P5: 1(F)-3(F)-5(F)-7(F)-9(T)-10 — APPROVE, hasEvidence = false",
      "P6: 1(F)-3(F)-5(F)-7(F)-9(F)-11(T)-12 — APPROVE, evidence, WEAK_MATCH, not staff-verified",
      "P7/P8: 1(F)-3(F)-5(F)-7(F)-9(F)-11(F)-13 — APPROVE, evidence, WEAK (verified) or POSSIBLE/STRONG",
    ],
    predicateUse: [
      ["(1,2)", "!VALID_ACTIONS.includes(action)", "True", "{action}"],
      ["(1,3)", "!VALID_ACTIONS.includes(action)", "False", "{action}"],
      ["(3,4)", "!VALID_MATCH_RESULTS.includes(matchResult)", "True", "{matchResult}"],
      ["(3,5)", "!VALID_MATCH_RESULTS.includes(matchResult)", "False", "{matchResult}"],
      ["(5,6)", "action === REJECT", "True", "{action}"],
      ["(5,7)", "action === REJECT", "False", "{action}"],
      ["(7,8)", "action === REQUEST_INFO", "True", "{action}"],
      ["(7,9)", "action === REQUEST_INFO", "False", "{action}"],
      ["(9,10)", "!hasEvidence", "True", "{hasEvidence}"],
      ["(9,11)", "!hasEvidence", "False", "{hasEvidence}"],
      ["(11,12)", "matchResult===WEAK && !staffVerifiedEvidence", "True", "{matchResult, staffVerifiedEvidence}"],
      ["(11,13)", "matchResult===WEAK && !staffVerifiedEvidence", "False", "{matchResult, staffVerifiedEvidence}"],
    ],
    defCUse: [
      ["1", "{}", "{}"],
      ["2", "{}", "{action}"],
      ["3", "{}", "{}"],
      ["4", "{}", "{matchResult}"],
      ["5", "{}", "{}"],
      ["6", "{}", "{}"],
      ["7", "{}", "{}"],
      ["8", "{}", "{}"],
      ["9", "{}", "{}"],
      ["10", "{}", "{}"],
      ["11", "{}", "{}"],
      ["12", "{}", "{}"],
      ["13", "{}", "{}"],
    ],
  },
  {
    name: "canConfirmHandover({status, verifiedIdentity})",
    file: "canConfirmHandover.png",
    module: "claimService.js",
    branchCoverage: [
      "P1: 1(T)-2 — claim not yet APPROVED",
      "P2: 1(F)-3(T)-4 — APPROVED, identity not verified",
      "P3: 1(F)-3(F)-5 — APPROVED, identity verified",
    ],
    predicateUse: [
      ["(1,2)", "status !== APPROVED", "True", "{status}"],
      ["(1,3)", "status !== APPROVED", "False", "{status}"],
      ["(3,4)", "!verifiedIdentity", "True", "{verifiedIdentity}"],
      ["(3,5)", "!verifiedIdentity", "False", "{verifiedIdentity}"],
    ],
    defCUse: [
      ["1", "{}", "{}"],
      ["2", "{}", "{status}"],
      ["3", "{}", "{}"],
      ["4", "{}", "{}"],
      ["5", "{}", "{}"],
    ],
  },
];

// ---------------------------------------------------------------------------
// Document assembly
// ---------------------------------------------------------------------------

const children = [];

// ---- Title page ----
children.push(
  new Paragraph({ text: "CSX4104 SOFTWARE TESTING", spacing: { after: 100 }, alignment: AlignmentType.CENTER }),
  new Paragraph({ text: "", spacing: { after: 1400 } }),
  new Paragraph({ text: "ASSUMPTION UNIVERSITY", alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
  new Paragraph({ text: "Vincent Mary School of Engineering, Science and Technology", alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
  new Paragraph({ text: "CSX4104/ITX4104 SOFTWARE TESTING", alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
  new Paragraph({ text: "Submitted to", alignment: AlignmentType.CENTER, spacing: { after: 40 } }),
  new Paragraph({ children: [new TextRun({ text: "Asst. Prof. Dr. Darun Kesrarat", bold: true })], alignment: AlignmentType.CENTER, spacing: { after: 800 } }),
  new Paragraph({
    children: [new TextRun({ text: "Term Project Report", bold: true, size: 36 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Campus Lost & Found Management System", size: 28 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 1000 },
  }),
  new Paragraph({ children: [new TextRun({ text: "Group members:", bold: true })], alignment: AlignmentType.CENTER, spacing: { after: 120 } }),
  new Paragraph({ text: "JATUPON ITSARA (6610073)", alignment: AlignmentType.CENTER }),
  new Paragraph({ text: "GULIZARA BENJAPALAPORN (6612233)", alignment: AlignmentType.CENTER }),
  new Paragraph({ text: "Chanyanut Pumasri (6620025)", alignment: AlignmentType.CENTER }),
  new Paragraph({ text: "Phanthira Kositjaroenkul (6630003)", alignment: AlignmentType.CENTER, spacing: { after: 800 } }),
  new Paragraph({ text: "SEMESTER 1/2026", alignment: AlignmentType.CENTER, spacing: { after: 1600 } }),
  new Paragraph({ children: [new PageBreak()] })
);

// ---- Table of Contents ----
children.push(
  new Paragraph({
    children: [new TextRun({ text: "Table of Contents", bold: true, size: 32 })],
    spacing: { before: 400, after: 200 },
  })
);
[
  ["Introduction", 3],
  ["Functional Scope", 3],
  ["Unit Testing", 5],
  ["Control Flow Testing", 25],
  ["Data Flow Testing", 34],
  ["Domain Testing", 40],
  ["Integration Testing", 54],
  ["Access Control Testing", 57],
  ["Final Test Case with Functional Requirements and UI/UX", 58],
  ["Summary", 68],
].forEach(([title, pageNum]) => {
  children.push(
    new Paragraph({
      tabStops: [{ type: "right", position: 9350, leader: "dot" }],
      children: [new TextRun({ text: title }), new TextRun({ text: `\t${pageNum}` })],
      spacing: { after: 120 },
    })
  );
});
children.push(new Paragraph({ children: [new PageBreak()] }));

// ---- Introduction ----
children.push(h1("Introduction"));
children.push(
  p(
    "The Campus Lost & Found Management System is a web application that helps students and staff at the university report lost and found items, automatically compares reports using a rule-based matching algorithm, and supports staff in verifying ownership before an item is handed over. This report documents the software testing performed on the system, applying Unit Testing, Control Flow Testing, Data Flow Testing, Domain Testing, Integration Testing, and Access Control Testing, with a final walkthrough mapping the implemented UI to the system's functional requirements."
  )
);

children.push(h1("Functional Scope"));
children.push(h2("Report Lost & Found Items"));
[
  "The system should allow students and staff to submit an item report with a title, description, category, color, brand, location, and date/time last seen.",
  "Each report is stored in the database and shown in the matching results and browse pages.",
].forEach((t) => children.push(bullet(t)));

children.push(h2("Rule-Based Item Matching"));
[
  "The system should automatically compare a new report against existing reports of the opposite type (lost vs. found) using weighted attribute scoring: item name, description, color, brand, location, and date.",
  "Matches are classified into STRONG_MATCH (≥75), POSSIBLE_MATCH (50–74), or WEAK_MATCH (<50) and flagged for the user to confirm or dismiss.",
].forEach((t) => children.push(bullet(t)));

children.push(h2("Ownership Verification & Claim Management"));
[
  "The system should let a student submit a claim on a matched report with supporting evidence (minimum 10 characters).",
  "The system should let staff approve, reject, or request more information on a claim, applying stricter verification for weak matches.",
  "The system should require a separate in-person identity check before a claim's handover can be confirmed.",
].forEach((t) => children.push(bullet(t)));

children.push(h2("Notifications & Audit Logging"));
[
  "The system should notify a student in-app whenever a match is confirmed or their claim's status changes.",
  "The system should write an audit log entry for every claim submission, decision, and handover, viewable only by Admin.",
].forEach((t) => children.push(bullet(t)));

children.push(h2("Role-Based Access"));
[
  "The system should implement role-based access control across Student, Staff, and Admin, simulated via a header rather than full authentication (per the project proposal's stated out of scope).",
].forEach((t) => children.push(bullet(t)));

children.push(p(""));
children.push(p("Out of scope (per project proposal):", { bold: true }));
["Real Microsoft/AU authentication.", "User management (account creation/administration).", "Email or SMS notifications.", "Mobile application.", "AI-based image recognition for photo matching.", "Database performance optimization / horizontal scaling."].forEach((t) =>
  children.push(bullet(t))
);

// ---------------------------------------------------------------------------
// Unit Testing
// ---------------------------------------------------------------------------
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(h1("Unit Testing"));
children.push(
  p(
    "Unit testing verifies individual functions in isolation. Jest 30.4.2 on Node.js v22.12.0 was used as the test runner. matchingService, claimService, and notificationService are pure functions with no database dependency, so the full suite executes in well under one second."
  )
);
children.push(h2("Test Environment"));
children.push(p("Node.js v22.12.0, Jest 30.4.2. No mocking required."));

let unitCount = 0;
function unitSection({ name, sourceLines, testLines, terminalLines, cases, notes }) {
  unitCount += 1;
  children.push(h2(`${unitCount}. Testing: ${name}`));
  children.push(...darkCodeBlock(sourceLines));
  children.push(p(""));
  children.push(...darkCodeBlock(testLines));
  children.push(p(""));
  children.push(...terminalBlock(terminalLines));
  children.push(p(""));
  cases.forEach((c, i) => children.push(...testCaseBlock(i + 1, c.title, c)));
  if (notes && notes.length) {
    children.push(p("Notes:", { bold: true }));
    notes.forEach((n) => children.push(bullet(n)));
  }
  children.push(p(""));
}

unitSection({
  name: "scoreItemName",
  sourceLines: [
    "function scoreItemName(nameA, nameB) {",
    "  const a = normalizeText(nameA);",
    "  const b = normalizeText(nameB);",
    "",
    "  if (!a || !b) return 0;",
    "  if (a === b) return WEIGHTS.itemName;",
    "  if (a.includes(b) || b.includes(a)) return Math.round(WEIGHTS.itemName * 0.6);",
    "  return 0;",
    "}",
  ],
  testLines: [
    "test(\"gives full weight for an exact match (case/whitespace insensitive)\", () => {",
    "  expect(scoreItemName(\"Black Backpack\", \"  black backpack  \")).toBe(WEIGHTS.itemName);",
    "});",
    "",
    "test(\"gives partial credit when one name contains the other\", () => {",
    "  expect(scoreItemName(\"Backpack\", \"Black Backpack\")).toBe(Math.round(WEIGHTS.itemName * 0.6));",
    "});",
    "",
    "test(\"returns 0 when both names are empty/undefined\", () => {",
    "  expect(scoreItemName(\"\", \"\")).toBe(0);",
    "  expect(scoreItemName(undefined, undefined)).toBe(0);",
    "});",
    "",
    "test(\"treats non-string input (null/number) as an empty name\", () => {",
    "  expect(scoreItemName(null, \"Backpack\")).toBe(0);",
    "  expect(scoreItemName(123, \"Backpack\")).toBe(0);",
    "});",
  ],
  terminalLines: [
    "PASS  tests/matchingService.test.js",
    "  matchingService: unit tests for attribute scorers",
    "    ✓ scoreItemName gives full weight for an exact match (case/whitespace insensitive)",
    "    ✓ scoreItemName gives partial credit when one name contains the other",
    "    ✓ scoreItemName gives zero for unrelated names",
    "  FR2 additional coverage: scoreItemName edge cases",
    "    ✓ returns 0 when both names are empty/undefined",
    "    ✓ treats non-string input (null/number) as an empty name, returning 0",
    "",
    "Tests:       6 passed, 6 total",
  ],
  cases: [
    {
      title: "Exact Match (case/whitespace insensitive)",
      input: ['nameA = "Black Backpack"', 'nameB = "  black backpack  "'],
      expectedOutput: "25 (WEIGHTS.itemName)",
      description: "Both names are normalized (trim + lowercase) before comparison, so differences in case or surrounding whitespace should not prevent a perfect match.",
      actualOutput: "The function returned 25. Test passed.",
    },
    {
      title: "Substring Containment (partial credit)",
      input: ['nameA = "Backpack"', 'nameB = "Black Backpack"'],
      expectedOutput: "15 (round(25 * 0.6))",
      description: "One name is a substring of the other, which the algorithm rewards as a 60% partial match rather than 0% or 100%.",
      actualOutput: "The function returned 15. Test passed.",
    },
    {
      title: "Both Names Empty",
      input: ['nameA = ""', 'nameB = ""', "and nameA = undefined, nameB = undefined"],
      expectedOutput: "0",
      description: "Ensures the function does not throw when normalization yields an empty string on both sides — an edge case not covered by the exact-match/substring cases above.",
      actualOutput: "The function returned 0 in both cases. Test passed.",
    },
    {
      title: "Non-string Input",
      input: ['nameA = null, nameB = "Backpack"', 'nameA = 123, nameB = "Backpack"'],
      expectedOutput: "0",
      description: "normalizeText() only accepts strings; null and number inputs should degrade to an empty string rather than throwing a TypeError.",
      actualOutput: "The function returned 0 in both cases. Test passed.",
    },
  ],
  notes: [
    "Function tested: scoreItemName(nameA, nameB).",
    "Behavior confirmed: case/whitespace-insensitive matching; 60% partial credit for substring containment; degrades gracefully (no throw) for missing or non-string input.",
    "Relevance: contributes 25 of the 100 total match-score points computed by calculateMatchScore().",
  ],
});

unitSection({
  name: "scoreDescription",
  sourceLines: [
    "function scoreDescription(descA, descB) {",
    "  const similarity = jaccardSimilarity(toWordSet(descA), toWordSet(descB));",
    "  return Math.round(WEIGHTS.description * similarity);",
    "}",
    "",
    "function jaccardSimilarity(setA, setB) {",
    "  if (setA.size === 0 && setB.size === 0) return 0;",
    "  let intersectionSize = 0;",
    "  for (const word of setA) {",
    "    if (setB.has(word)) intersectionSize += 1;",
    "  }",
    "  const unionSize = setA.size + setB.size - intersectionSize;",
    "  return unionSize === 0 ? 0 : intersectionSize / unionSize;",
    "}",
  ],
  testLines: [
    "test(\"scales with word overlap (Jaccard similarity)\", () => {",
    "  const full = scoreDescription(\"black leather backpack torn pocket\", \"black leather backpack torn pocket\");",
    "  const none = scoreDescription(\"black leather backpack\", \"red umbrella broken handle\");",
    "  expect(full).toBe(WEIGHTS.description);",
    "  expect(none).toBe(0);",
    "});",
    "",
    "test(\"P1: both descriptions empty returns 0 (no divide-by-zero)\", () => {",
    "  expect(scoreDescription(\"\", \"\")).toBe(0);",
    "});",
    "",
    "test(\"P2: one empty, one non-empty returns 0\", () => {",
    "  expect(scoreDescription(\"\", \"black leather backpack\")).toBe(0);",
    "});",
  ],
  terminalLines: [
    "PASS  tests/matchingService.test.js",
    "  matchingService: unit tests for attribute scorers",
    "    ✓ scoreDescription scales with word overlap (Jaccard similarity)",
    "  FR2 additional coverage: scoreDescription control-flow paths",
    "    ✓ P1: both descriptions empty returns 0 (does not divide by zero)",
    "    ✓ P2: one empty description and one non-empty description returns 0",
    "    ✓ single shared word scores partial credit proportional to Jaccard overlap",
    "    ✓ is case-insensitive and whitespace-insensitive",
    "",
    "Tests:       5 passed, 5 total",
  ],
  cases: [
    {
      title: "P1 — Both Descriptions Empty",
      input: ['descA = ""', 'descB = ""'],
      expectedOutput: "0",
      description: "This is the control-flow path guarded by the early-return check in jaccardSimilarity (setA.size===0 && setB.size===0). Without this guard, unionSize would be 0 and the ratio would divide by zero.",
      actualOutput: "The function returned 0. Test passed.",
    },
    {
      title: "P2 — One Description Empty",
      input: ['descA = ""', 'descB = "black leather backpack"'],
      expectedOutput: "0",
      description: "setA is empty so the for...of loop over setA runs zero iterations; intersectionSize stays 0 and similarity is 0.",
      actualOutput: "The function returned 0. Test passed.",
    },
    {
      title: "P3/P4 — Full and No Overlap",
      input: ['Full: "black leather backpack torn pocket" vs itself', 'None: "black leather backpack" vs "red umbrella broken handle"'],
      expectedOutput: "25 for identical text, 0 for disjoint text",
      description: "Exercises the loop body with setB.has(word) True on every iteration (full overlap) and False on every iteration (no overlap).",
      actualOutput: "Returned 25 and 0 respectively. Test passed.",
    },
  ],
  notes: [
    "Function tested: scoreDescription(descA, descB), which wraps the Jaccard-similarity helper jaccardSimilarity().",
    "Control-flow observation: the unionSize===0 branch inside jaccardSimilarity (node 9, True) is structurally present but infeasible when called through scoreDescription — the only way unionSize can be 0 is if both word sets are empty, which node 2 already intercepts. See Control Flow Testing, path P5.",
    "Relevance: contributes 25 of the 100 total match-score points.",
  ],
});

unitSection({
  name: "scoreExactOptionalField",
  sourceLines: [
    "function scoreExactOptionalField(valueA, valueB, weight) {",
    "  const a = normalizeText(valueA);",
    "  const b = normalizeText(valueB);",
    "",
    "  if (!a || !b) return 0;",
    "  return a === b ? weight : 0;",
    "}",
  ],
  testLines: [
    "test(\"matches case-insensitively and rewards exact match only\", () => {",
    "  expect(scoreExactOptionalField(\"Black\", \"black\", WEIGHTS.color)).toBe(WEIGHTS.color);",
    "  expect(scoreExactOptionalField(\"Black\", \"Red\", WEIGHTS.color)).toBe(0);",
    "});",
    "",
    "test(\"returns 0 when both values are missing\", () => {",
    "  expect(scoreExactOptionalField(undefined, undefined, WEIGHTS.color)).toBe(0);",
    "  expect(scoreExactOptionalField(null, null, WEIGHTS.brand)).toBe(0);",
    "});",
    "",
    "test(\"returns the exact weight passed in, including a weight of 0\", () => {",
    "  expect(scoreExactOptionalField(\"Black\", \"black\", 0)).toBe(0);",
    "  expect(scoreExactOptionalField(\"Black\", \"black\", 15)).toBe(15);",
    "});",
  ],
  terminalLines: [
    "PASS  tests/matchingService.test.js",
    "  matchingService: unit tests for attribute scorers",
    "    ✓ scoreExactOptionalField matches case-insensitively and rewards exact match only",
    "    ✓ scoreExactOptionalField gives zero when a field is missing on either side",
    "  FR2 additional coverage: scoreExactOptionalField edge cases",
    "    ✓ returns 0 when both values are missing",
    "    ✓ returns the exact weight passed in, including a weight of 0",
    "",
    "Tests:       4 passed, 4 total",
  ],
  cases: [
    {
      title: "Exact Match (color field)",
      input: ['valueA = "Black"', 'valueB = "black"', "weight = 15"],
      expectedOutput: "15",
      description: "Used for optional attributes (color, brand) that only ever score full weight or zero — no partial credit.",
      actualOutput: "The function returned 15. Test passed.",
    },
    {
      title: "Both Values Missing",
      input: ["valueA = undefined, valueB = undefined", "valueA = null, valueB = null"],
      expectedOutput: "0",
      description: "Neither report specified the optional field, so there is nothing to compare — the function must not throw or award credit by accident.",
      actualOutput: "The function returned 0 in both cases. Test passed.",
    },
    {
      title: "Zero Weight Boundary",
      input: ['valueA = "Black", valueB = "black", weight = 0'],
      expectedOutput: "0",
      description: "A weight of 0 is a valid domain boundary; the function should still return exactly 0 (the weight itself), not treat it as a falsy \"no weight given\" case.",
      actualOutput: "The function returned 0. Test passed.",
    },
  ],
  notes: [
    "Function tested: scoreExactOptionalField(valueA, valueB, weight) — shared by the color (weight 15) and brand (weight 15) attributes.",
  ],
});

unitSection({
  name: "scoreLocation",
  sourceLines: [
    "function scoreLocation(locationA, locationB) {",
    "  const a = normalizeText(locationA);",
    "  const b = normalizeText(locationB);",
    "",
    "  if (!a || !b) return 0;",
    "  if (a === b) return WEIGHTS.location;",
    "  if (a.includes(b) || b.includes(a)) return Math.round(WEIGHTS.location * 0.5);",
    "  return 0;",
    "}",
  ],
  testLines: [
    "test(\"gives full weight for exact match and partial credit for containment\", () => {",
    "  expect(scoreLocation(\"Library 2nd Floor\", \"library 2nd floor\")).toBe(WEIGHTS.location);",
    "  expect(scoreLocation(\"Library\", \"Library 2nd Floor\")).toBe(Math.round(WEIGHTS.location * 0.5));",
    "  expect(scoreLocation(\"Library\", \"Gymnasium\")).toBe(0);",
    "});",
    "",
    "test(\"gives partial credit regardless of which side is the longer string\", () => {",
    "  expect(scoreLocation(\"Library 2nd Floor\", \"Library\")).toBe(Math.round(WEIGHTS.location * 0.5));",
    "});",
    "",
    "test(\"returns 0 when either location is empty/undefined\", () => {",
    "  expect(scoreLocation(\"\", \"Library\")).toBe(0);",
    "  expect(scoreLocation(undefined, undefined)).toBe(0);",
    "});",
  ],
  terminalLines: [
    "PASS  tests/matchingService.test.js",
    "  matchingService: unit tests for attribute scorers",
    "    ✓ scoreLocation gives full weight for exact match and partial credit for containment",
    "  FR2 additional coverage: scoreLocation edge cases",
    "    ✓ returns 0 when either location is empty/undefined",
    "    ✓ gives partial credit regardless of which side is the longer, containing string",
    "",
    "Tests:       3 passed, 3 total",
  ],
  cases: [
    {
      title: "Substring Containment — Both Orderings",
      input: ['"Library" vs "Library 2nd Floor"', '"Library 2nd Floor" vs "Library"'],
      expectedOutput: "5 (round(10 * 0.5)) for both orderings",
      description: "The predicate is a.includes(b) || b.includes(a) — a logical OR with two operands. The original test suite only exercised the case where the second operand was True; this case forces the first operand True, completing condition coverage.",
      actualOutput: "Returned 5 in both orderings. Test passed.",
    },
    {
      title: "Either Location Missing",
      input: ['locationA = "", locationB = "Library"', "locationA = undefined, locationB = undefined"],
      expectedOutput: "0",
      description: "Domain boundary: an unset location must not accidentally match or crash the scorer.",
      actualOutput: "The function returned 0 in both cases. Test passed.",
    },
  ],
  notes: ["Function tested: scoreLocation(locationA, locationB) — structurally identical to scoreItemName but with weight 10 and a 5-point (50%) partial-credit tier."],
});

unitSection({
  name: "scoreDate",
  sourceLines: [
    "function daysBetween(dateA, dateB) {",
    "  const msPerDay = 24 * 60 * 60 * 1000;",
    "  const a = dateA instanceof Date ? dateA : new Date(dateA);",
    "  const b = dateB instanceof Date ? dateB : new Date(dateB);",
    "  return Math.abs(Math.round((a.getTime() - b.getTime()) / msPerDay));",
    "}",
    "",
    "function scoreDate(dateA, dateB) {",
    "  const diff = daysBetween(dateA, dateB);",
    "",
    "  if (diff === 0) return WEIGHTS.date;",
    "  if (diff <= 3) return Math.round(WEIGHTS.date * 0.5);",
    "  return 0;",
    "}",
  ],
  testLines: [
    "test(\"boundary values at 0, 3, and 4 days apart\", () => {",
    "  expect(scoreDate(\"2026-08-10\", \"2026-08-10\")).toBe(WEIGHTS.date);",
    "  expect(scoreDate(\"2026-08-10\", \"2026-08-13\")).toBe(Math.round(WEIGHTS.date * 0.5));",
    "  expect(scoreDate(\"2026-08-10\", \"2026-08-14\")).toBe(0);",
    "});",
    "",
    "test(\"degrades gracefully to 0 for an unparsable date instead of throwing\", () => {",
    "  expect(scoreDate(\"not-a-date\", \"2026-08-10\")).toBe(0);",
    "});",
    "",
    "test(\"is symmetric regardless of argument order\", () => {",
    "  expect(scoreDate(\"2026-08-13\", \"2026-08-10\")).toBe(scoreDate(\"2026-08-10\", \"2026-08-13\"));",
    "});",
  ],
  terminalLines: [
    "PASS  tests/matchingService.test.js",
    "  matchingService: unit tests for attribute scorers",
    "    ✓ scoreDate: boundary values at 0, 3, and 4 days apart",
    "  FR2 additional coverage: scoreDate edge cases",
    "    ✓ is symmetric regardless of argument order",
    "    ✓ accepts Date object inputs directly",
    "    ✓ degrades gracefully to 0 for an unparsable date instead of throwing",
    "    ✓ returns 0 for a large date gap well beyond the 3-day boundary",
    "",
    "Tests:       5 passed, 5 total",
  ],
  cases: [
    {
      title: "Boundary — 3 vs. 4 Days Apart",
      input: ['diff = 3 days: "2026-08-10" vs "2026-08-13"', 'diff = 4 days: "2026-08-10" vs "2026-08-14"'],
      expectedOutput: "5 at diff=3 (round(10*0.5)), 0 at diff=4",
      description: "Boundary Value Analysis on the diff <= 3 threshold — the two values immediately either side of the boundary must land in different score bands.",
      actualOutput: "Returned 5 and 0 respectively. Test passed.",
    },
    {
      title: "Unparsable Date Input",
      input: ['dateA = "not-a-date"', 'dateB = "2026-08-10"'],
      expectedOutput: "0",
      description: "new Date(\"not-a-date\") produces an Invalid Date, so getTime() is NaN and diff becomes NaN. Both diff===0 and diff<=3 evaluate to false for NaN, so the function safely falls through to 0 rather than throwing or returning NaN.",
      actualOutput: "The function returned 0. Test passed.",
    },
  ],
  notes: ["Function tested: scoreDate(dateA, dateB), backed by the helper daysBetween(). Confirmed this defensive behavior is intentional, not a bug — validateItemForMatching() already rejects unparsable dates earlier in the real request flow."],
});

unitSection({
  name: "classifyScore",
  sourceLines: [
    "function classifyScore(score) {",
    "  if (score >= 75) return MATCH_RESULT.STRONG;",
    "  if (score >= 50) return MATCH_RESULT.POSSIBLE;",
    "  return MATCH_RESULT.WEAK;",
    "}",
  ],
  testLines: [
    "test.each([",
    "  [0, MATCH_RESULT.WEAK], [49, MATCH_RESULT.WEAK],",
    "  [50, MATCH_RESULT.POSSIBLE], [74, MATCH_RESULT.POSSIBLE],",
    "  [75, MATCH_RESULT.STRONG], [100, MATCH_RESULT.STRONG],",
    "])(\"classifyScore(%i) -> %s\", (score, expected) => {",
    "  expect(classifyScore(score)).toBe(expected);",
    "});",
    "",
    "test(\"clamps out-of-range scores into the nearest band\", () => {",
    "  expect(classifyScore(-10)).toBe(MATCH_RESULT.WEAK);",
    "  expect(classifyScore(150)).toBe(MATCH_RESULT.STRONG);",
    "});",
    "",
    "test(\"honors fractional scores right at the threshold\", () => {",
    "  expect(classifyScore(74.9)).toBe(MATCH_RESULT.POSSIBLE);",
    "  expect(classifyScore(75.0001)).toBe(MATCH_RESULT.STRONG);",
    "});",
  ],
  terminalLines: [
    "PASS  tests/matchingService.test.js",
    "  matchingService: Boundary Value Analysis on decision thresholds",
    "    ✓ classifyScore(0) -> WEAK_MATCH",
    "    ✓ classifyScore(49) -> WEAK_MATCH",
    "    ✓ classifyScore(50) -> POSSIBLE_MATCH",
    "    ✓ classifyScore(74) -> POSSIBLE_MATCH",
    "    ✓ classifyScore(75) -> STRONG_MATCH",
    "    ✓ classifyScore(100) -> STRONG_MATCH",
    "  FR2 additional coverage: classifyScore domain boundaries",
    "    ✓ clamps out-of-range scores into the nearest band instead of throwing",
    "    ✓ honors fractional scores right at the threshold boundary",
    "",
    "Tests:       8 passed, 8 total",
  ],
  cases: [
    {
      title: "Threshold Boundaries (49/50 and 74/75)",
      input: "49, 50, 74, 75",
      expectedOutput: "49→WEAK_MATCH, 50→POSSIBLE_MATCH, 74→POSSIBLE_MATCH, 75→STRONG_MATCH",
      description: "Boundary Value Analysis on both decision thresholds (>=50 and >=75) — the value immediately below and immediately at each threshold must land on opposite sides.",
      actualOutput: "All four values classified as expected. Test passed.",
    },
    {
      title: "Out-of-Domain Scores",
      input: "-10, 150",
      expectedOutput: "-10 → WEAK_MATCH, 150 → STRONG_MATCH",
      description: "calculateMatchScore() always clamps its input to 0–100 before calling classifyScore(), but classifyScore() itself has no such guard — this confirms it degrades sensibly rather than misbehaving if ever called directly with an out-of-range value.",
      actualOutput: "Returned WEAK_MATCH and STRONG_MATCH respectively. Test passed.",
    },
  ],
  notes: [],
});

unitSection({
  name: "validateItemForMatching",
  sourceLines: [
    "function validateItemForMatching(item, label) {",
    "  const errors = [];",
    "  if (!item || typeof item !== \"object\") {",
    "    throw new ValidationError(`${label} item must be an object.`, [`${label}: missing item`]);",
    "  }",
    "  for (const field of REQUIRED_FIELDS) {",
    "    const value = item[field];",
    "    if (value === undefined || value === null || value === \"\") {",
    "      errors.push(`${label}: missing required field \"${field}\"`);",
    "    }",
    "  }",
    "  if (item.occurredAt !== undefined && item.occurredAt !== null) {",
    "    const date = item.occurredAt instanceof Date ? item.occurredAt : new Date(item.occurredAt);",
    "    if (Number.isNaN(date.getTime())) {",
    "      errors.push(`${label}: \"occurredAt\" is not a valid date`);",
    "    }",
    "  }",
    "  if (errors.length > 0) {",
    "    throw new ValidationError(`Invalid ${label} item for matching.`, errors);",
    "  }",
    "}",
  ],
  testLines: [
    "test.each([\"title\", \"description\", \"location\", \"occurredAt\"])(",
    "  \"rejects an item missing required field %s\",",
    "  (field) => {",
    "    const item = makeItem({ [field]: undefined });",
    "    expect(() => validateItemForMatching(item, \"lost\")).toThrow(ValidationError);",
    "  }",
    ");",
    "",
    "test(\"an array is typeof 'object' so it passes the type check, but fails on missing fields\", () => {",
    "  expect(() => validateItemForMatching([], \"lost\")).toThrow(ValidationError);",
    "});",
    "",
    "test(\"reports every missing field at once, not just the first\", () => {",
    "  const item = makeItem({ title: undefined, location: undefined });",
    "  try {",
    "    validateItemForMatching(item, \"lost\");",
    "  } catch (err) {",
    "    expect(err.details).toHaveLength(2);",
    "  }",
    "});",
  ],
  terminalLines: [
    "PASS  tests/matchingService.test.js",
    "  matchingService: Equivalence Partitioning on item validation",
    "    ✓ accepts a fully valid item",
    "    ✓ rejects an item missing required field title",
    "    ✓ rejects an item missing required field description",
    "    ✓ rejects an item missing required field location",
    "    ✓ rejects an item missing required field occurredAt",
    "    ✓ rejects an item with an invalid occurredAt value",
    "    ✓ accepts an item with optional fields (color/brand) omitted",
    "    ✓ rejects a non-object item",
    "  FR2 additional coverage: validateItemForMatching edge cases",
    "    ✓ rejects a non-object, non-null item (a string) with the object-type error",
    "    ✓ rejects a non-object, non-null item (a number) with the object-type error",
    "    ✓ an array is typeof 'object' so it passes the type check, but fails on missing fields",
    "    ✓ rejects a required field that is present but an empty string",
    "    ✓ reports every missing field at once, not just the first",
    "    ✓ accepts a Date object (not just a date string) for occurredAt",
    "    ✓ includes the caller-supplied label in the error details",
    "",
    "Tests:       15 passed, 15 total",
  ],
  cases: [
    {
      title: "Array Input (typeof 'object' but not a valid item)",
      input: "item = [] (an empty array)",
      expectedOutput: "Throws ValidationError with missing-field details, NOT the \"must be an object\" message",
      description: "typeof [] === 'object' in JavaScript, so an array passes the initial type guard at node 2. It then fails every REQUIRED_FIELDS lookup (arrays have no .title, .description, etc.), so it is rejected for a different, more specific reason than a primitive input.",
      actualOutput: "Threw ValidationError with 4 missing-field entries in err.details. Test passed.",
    },
    {
      title: "Multiple Missing Fields at Once",
      input: "item with both title and location set to undefined",
      expectedOutput: "err.details has length 2 (one entry per missing field)",
      description: "The loop over REQUIRED_FIELDS (node 4) accumulates every violation into the errors array before throwing once at node 13, rather than stopping at the first problem found.",
      actualOutput: "err.details.length === 2. Test passed.",
    },
    {
      title: "Non-Object Primitive Input",
      input: 'item = "just a string", item = 42',
      expectedOutput: "Throws ValidationError with the \"item must be an object\" message",
      description: "typeof \"string\" and typeof 42 are neither 'object', so both trip the first branch at node 2 directly.",
      actualOutput: "Both threw ValidationError as expected. Test passed.",
    },
  ],
  notes: ["Function tested: validateItemForMatching(item, label) — the guard function called before every match-score calculation."],
});

unitSection({
  name: "calculateMatchScore (integration of all scorers)",
  sourceLines: [
    "function calculateMatchScore(lostItem, foundItem) {",
    "  validateItemForMatching(lostItem, \"lost\");",
    "  validateItemForMatching(foundItem, \"found\");",
    "  const breakdown = {",
    "    itemName: scoreItemName(lostItem.title, foundItem.title),",
    "    description: scoreDescription(lostItem.description, foundItem.description),",
    "    color: scoreExactOptionalField(lostItem.color, foundItem.color, WEIGHTS.color),",
    "    brand: scoreExactOptionalField(lostItem.brand, foundItem.brand, WEIGHTS.brand),",
    "    location: scoreLocation(lostItem.location, foundItem.location),",
    "    date: scoreDate(lostItem.occurredAt, foundItem.occurredAt),",
    "  };",
    "  const rawScore = Object.values(breakdown).reduce((sum, value) => sum + value, 0);",
    "  const score = Math.min(100, Math.max(0, rawScore));",
    "  return { score, result: classifyScore(score), breakdown };",
    "}",
  ],
  testLines: [
    "test(\"identical items produce a perfect score and Strong Match\", () => {",
    "  const result = calculateMatchScore(makeItem(), makeItem());",
    "  expect(result.score).toBe(100);",
    "  expect(result.result).toBe(MATCH_RESULT.STRONG);",
    "});",
    "",
    "test(\"completely unrelated items produce a low score and Weak Match\", () => {",
    "  const result = calculateMatchScore(lost, unrelatedFound);",
    "  expect(result.score).toBeLessThan(50);",
    "  expect(result.result).toBe(MATCH_RESULT.WEAK);",
    "});",
    "",
    "test(\"propagates validation errors for an invalid found item\", () => {",
    "  expect(() => calculateMatchScore(makeItem(), makeItem({ title: \"\" }))).toThrow(ValidationError);",
    "});",
  ],
  terminalLines: [
    "PASS  tests/matchingService.test.js",
    "  matchingService: calculateMatchScore integration",
    "    ✓ identical items produce a perfect score and Strong Match",
    "    ✓ completely unrelated items produce a low score and Weak Match",
    "    ✓ partially matching items land in the Possible Match band",
    "    ✓ propagates validation errors for an invalid found item",
    "",
    "Tests:       4 passed, 4 total",
  ],
  cases: [
    {
      title: "Identical Items — Perfect Score",
      input: "Two reports with the same title, description, color, brand, location, and date",
      expectedOutput: "score = 100, result = STRONG_MATCH",
      description: "Sums all six scorers at full weight (25+25+15+15+10+10=100) and confirms classifyScore(100) resolves to STRONG_MATCH.",
      actualOutput: "score=100, result=STRONG_MATCH. Test passed.",
    },
    {
      title: "Invalid Found Item Propagates",
      input: 'lost = valid item, found = item with title: ""',
      expectedOutput: "Throws ValidationError before any scoring runs",
      description: "calculateMatchScore() calls validateItemForMatching() on both items first, so a malformed found report should abort before scoreItemName/scoreDescription/etc. are ever invoked.",
      actualOutput: "Threw ValidationError. Test passed.",
    },
  ],
  notes: [],
});

unitSection({
  name: "decideClaim (decision table)",
  sourceLines: [
    "function decideClaim({ action, hasEvidence, matchResult, staffVerifiedEvidence = false }) {",
    "  if (!VALID_ACTIONS.includes(action)) {",
    "    throw new ValidationError(`Invalid claim action: ${action}`);",
    "  }",
    "  if (!VALID_MATCH_RESULTS.includes(matchResult)) {",
    "    throw new ValidationError(`Invalid match result: ${matchResult}`);",
    "  }",
    "  if (action === CLAIM_ACTION.REJECT) {",
    "    return { status: CLAIM_STATUS.REJECTED, reason: \"Staff rejected the claim.\" };",
    "  }",
    "  if (action === CLAIM_ACTION.REQUEST_INFO) {",
    "    return { status: CLAIM_STATUS.INFO_REQUESTED, reason: \"Staff requested additional information.\" };",
    "  }",
    "  if (!hasEvidence) {",
    "    throw new ValidationError(\"Cannot approve a claim without supporting evidence.\");",
    "  }",
    "  if (matchResult === MATCH_RESULT.WEAK && !staffVerifiedEvidence) {",
    "    throw new ValidationError(\"Weak match claims require staff-verified evidence before approval.\");",
    "  }",
    "  return { status: CLAIM_STATUS.APPROVED, reason: \"Claim approved after evidence verification.\" };",
    "}",
  ],
  testLines: [
    "test(\"Rule 4: APPROVE, hasEvidence=true, matchResult=WEAK_MATCH, staffVerifiedEvidence=false -> throws\", () => {",
    "  expect(() =>",
    "    decideClaim({ action: CLAIM_ACTION.APPROVE, hasEvidence: true, matchResult: MATCH_RESULT.WEAK, staffVerifiedEvidence: false })",
    "  ).toThrow(ValidationError);",
    "});",
    "",
    "test(\"Rule 5: APPROVE, hasEvidence=true, matchResult=WEAK_MATCH, staffVerifiedEvidence=true -> APPROVED\", () => {",
    "  const result = decideClaim({ action: CLAIM_ACTION.APPROVE, hasEvidence: true, matchResult: MATCH_RESULT.WEAK, staffVerifiedEvidence: true });",
    "  expect(result.status).toBe(CLAIM_STATUS.APPROVED);",
    "});",
  ],
  terminalLines: [
    "PASS  tests/claimService.test.js",
    "  claimService: Decision Table Testing for claim approval logic",
    "    ✓ Rule 1: REJECT -> REJECTED (evidence and match strength irrelevant)",
    "    ✓ Rule 2: REQUEST_INFO -> INFO_REQUESTED (evidence and match strength irrelevant)",
    "    ✓ Rule 3: APPROVE with hasEvidence=false and matchResult=WEAK_MATCH -> throws (evidence required)",
    "    ✓ Rule 4: APPROVE, hasEvidence=true, matchResult=WEAK_MATCH, staffVerifiedEvidence=false -> throws",
    "    ✓ Rule 5: APPROVE, hasEvidence=true, matchResult=WEAK_MATCH, staffVerifiedEvidence=true -> APPROVED",
    "    ✓ Rule 6: APPROVE, hasEvidence=true, matchResult=POSSIBLE_MATCH, staffVerifiedEvidence=false -> APPROVED",
    "    ✓ rejects an unknown action",
    "    ✓ rejects an unknown matchResult",
    "",
    "Tests:       11 passed, 11 total",
  ],
  cases: [
    {
      title: "Weak Match Requires Staff Verification",
      input: "action=APPROVE, hasEvidence=true, matchResult=WEAK_MATCH, staffVerifiedEvidence=false",
      expectedOutput: "Throws ValidationError",
      description: "The decision table's highest-risk rule: a weak-confidence match must not be auto-approved on evidence alone — a staff member must have verified it in person first.",
      actualOutput: "Threw ValidationError with the message \"Weak match claims require staff-verified evidence before approval.\" Test passed.",
    },
    {
      title: "Weak Match Approved Once Verified",
      input: "Same as above but staffVerifiedEvidence=true",
      expectedOutput: "status = APPROVED",
      description: "Confirms the True branch of the same predicate correctly allows approval once the extra verification step is satisfied.",
      actualOutput: "status=APPROVED. Test passed.",
    },
  ],
  notes: [],
});

unitSection({
  name: "canConfirmHandover",
  sourceLines: [
    "function canConfirmHandover({ status, verifiedIdentity }) {",
    "  if (status !== CLAIM_STATUS.APPROVED) {",
    "    throw new ValidationError(",
    "      `Cannot confirm handover for a claim with status ${status}; it must be APPROVED first.`",
    "    );",
    "  }",
    "  if (!verifiedIdentity) {",
    "    throw new ValidationError(\"Staff must verify the claimant's identity before handover.\");",
    "  }",
    "  return true;",
    "}",
  ],
  testLines: [
    "test(\"allows handover when claim is APPROVED and identity is verified\", () => {",
    "  expect(canConfirmHandover({ status: CLAIM_STATUS.APPROVED, verifiedIdentity: true })).toBe(true);",
    "});",
    "",
    "test.each([CLAIM_STATUS.PENDING, CLAIM_STATUS.REJECTED, CLAIM_STATUS.INFO_REQUESTED, CLAIM_STATUS.COMPLETED])(",
    "  \"rejects handover when status is %s, even with verified identity\",",
    "  (status) => {",
    "    expect(() => canConfirmHandover({ status, verifiedIdentity: true })).toThrow(ValidationError);",
    "  }",
    ");",
  ],
  terminalLines: [
    "PASS  tests/claimService.test.js",
    "  claimService: handover eligibility (canConfirmHandover)",
    "    ✓ allows handover when claim is APPROVED and identity is verified",
    "    ✓ rejects handover when status is PENDING, even with verified identity",
    "    ✓ rejects handover when status is REJECTED, even with verified identity",
    "    ✓ rejects handover when status is INFO_REQUESTED, even with verified identity",
    "    ✓ rejects handover when status is COMPLETED, even with verified identity",
    "    ✓ rejects handover when identity has not been verified",
    "",
    "Tests:       6 passed, 6 total",
  ],
  cases: [
    {
      title: "Blocks Handover on an Unapproved Claim",
      input: "status=PENDING, verifiedIdentity=true",
      expectedOutput: "Throws ValidationError",
      description: "A claim must reach APPROVED before a handover can even be attempted, regardless of identity verification — this equivalence class is tested across all four non-APPROVED statuses.",
      actualOutput: "Threw ValidationError for all four statuses tested. Test passed.",
    },
    {
      title: "Blocks Handover Without Identity Verification",
      input: "status=APPROVED, verifiedIdentity=false",
      expectedOutput: "Throws ValidationError",
      description: "Even an approved claim cannot be handed over until staff confirm the claimant's identity in person.",
      actualOutput: "Threw ValidationError. Test passed.",
    },
  ],
  notes: [],
});

unitSection({
  name: "buildNotificationMessage",
  sourceLines: [
    "function buildNotificationMessage(type, context = {}) {",
    "  switch (type) {",
    "    case NOTIFICATION_TYPE.MATCH_CONFIRMED:",
    "      return `A possible match was confirmed for your lost item \"${context.itemTitle}\".`;",
    "    case NOTIFICATION_TYPE.CLAIM_APPROVED:",
    "      return `Your claim for \"${context.itemTitle}\" was approved. Staff will arrange a handover.`;",
    "    case NOTIFICATION_TYPE.CLAIM_REJECTED:",
    "      return `Your claim for \"${context.itemTitle}\" was rejected.${context.reason ? ` Reason: ${context.reason}` : \"\"}`;",
    "    case NOTIFICATION_TYPE.CLAIM_INFO_REQUESTED:",
    "      return `Staff requested more information for your claim on \"${context.itemTitle}\".`;",
    "    case NOTIFICATION_TYPE.HANDOVER_READY:",
    "      return `Handover confirmed for \"${context.itemTitle}\". Your claim is now complete.`;",
    "    default:",
    "      throw new ValidationError(`Unknown notification type: ${type}`);",
    "  }",
    "}",
  ],
  testLines: [
    "test(\"CLAIM_REJECTED includes the reason when provided\", () => {",
    "  const message = buildNotificationMessage(NOTIFICATION_TYPE.CLAIM_REJECTED, {",
    "    itemTitle: \"Black Backpack\", reason: \"Evidence did not match.\",",
    "  });",
    "  expect(message).toContain(\"Evidence did not match.\");",
    "});",
    "",
    "test(\"CLAIM_REJECTED omits the reason clause when none is provided\", () => {",
    "  const message = buildNotificationMessage(NOTIFICATION_TYPE.CLAIM_REJECTED, { itemTitle: \"Black Backpack\" });",
    "  expect(message).not.toContain(\"Reason:\");",
    "});",
    "",
    "test(\"throws for an unknown notification type\", () => {",
    "  expect(() => buildNotificationMessage(\"UNKNOWN_TYPE\", {})).toThrow(ValidationError);",
    "});",
  ],
  terminalLines: [
    "PASS  tests/notificationService.test.js",
    "  notificationService: buildNotificationMessage",
    "    ✓ MATCH_CONFIRMED mentions the lost item's title",
    "    ✓ CLAIM_APPROVED mentions the item and handover",
    "    ✓ CLAIM_REJECTED includes the reason when provided",
    "    ✓ CLAIM_REJECTED omits the reason clause when none is provided",
    "    ✓ CLAIM_INFO_REQUESTED mentions more information is needed",
    "    ✓ HANDOVER_READY mentions the claim is complete",
    "    ✓ throws for an unknown notification type",
    "",
    "Tests:       7 passed, 7 total",
  ],
  cases: [
    {
      title: "Rejection Reason Included When Provided",
      input: 'type=CLAIM_REJECTED, context={itemTitle:"Black Backpack", reason:"Evidence did not match."}',
      expectedOutput: 'Message contains "Evidence did not match."',
      description: "The reason clause is conditionally appended with a template-literal ternary — this confirms the True branch (reason given) renders correctly.",
      actualOutput: "Message contained the reason text. Test passed.",
    },
    {
      title: "Rejection Reason Omitted When Absent",
      input: 'type=CLAIM_REJECTED, context={itemTitle:"Black Backpack"} (no reason)',
      expectedOutput: 'Message does NOT contain "Reason:"',
      description: "Confirms the False branch of the same ternary — no reason means no dangling \"Reason:\" text in the message.",
      actualOutput: 'Message did not contain "Reason:". Test passed.',
    },
    {
      title: "Unknown Notification Type",
      input: 'type="UNKNOWN_TYPE"',
      expectedOutput: "Throws ValidationError",
      description: "The switch statement's default case guards against a typo or a future notification type added to the enum without updating this function.",
      actualOutput: "Threw ValidationError. Test passed.",
    },
  ],
  notes: [],
});

children.push(h2("Overall Unit Testing Result"));
children.push(...codeBlock(["$ npm test", "Test Suites: 4 passed, 4 total", "Tests:       91 passed, 91 total", "Snapshots:   0 total", "Time:        0.43 s"]));
children.push(p("All 91 unit tests pass across matchingService.test.js (50), claimService.test.js (17), validation.test.js (17), and notificationService.test.js (7)."));

// ---------------------------------------------------------------------------
// Control Flow Testing
// ---------------------------------------------------------------------------
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(h1("Control Flow Testing"));
children.push(
  p(
    "Control flow testing ensures that all possible paths through the code are tested. For each function below, the control flow graph (CFG) is drawn from the source, decision (diamond) and statement (rectangle) nodes are numbered, and every independent branch-coverage path is listed in compact node-sequence notation (e.g. \"1-2(T)-3\" means: from node 1, go to node 2, take the True branch to node 3)."
  )
);

CFG_FUNCTIONS.forEach((fn) => {
  children.push(h2(fn.name));
  children.push(p(`Module: ${fn.module}`, { italics: true, size: 18, color: "5B6570" }));
  children.push(
    p(`Cyclomatic Complexity: V(G) = ${fn.branchCoverage.length} (decision points + 1 = number of independent paths)`, {
      bold: true,
      size: 20,
    })
  );
  children.push(...imagePara(path.join(CFG_DIR, fn.file), 460, `Figure: Control flow graph for ${fn.name}`));
  children.push(p("Branch Coverage", { bold: true }));
  fn.branchCoverage.forEach((line) => children.push(p(line)));
  if (fn.name.startsWith("scoreDescription")) {
    children.push(
      p(
        "Note: Path P5 is structurally counted toward V(G) but is infeasible when reached through scoreDescription() — unionSize can only be 0 if both word sets are empty, and that case is already intercepted earlier at node 2. No defect: the dead branch is unreachable, not incorrect."
      )
    );
  }
  children.push(p(""));
});

// ---------------------------------------------------------------------------
// Data Flow Testing
// ---------------------------------------------------------------------------
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(h1("Data Flow Testing"));
children.push(
  p(
    "Data flow testing analyzes how variables are defined (def) and used (c-use inside a node, p-use on a predicate's outgoing edges) across the same control flow graphs from the previous section. This identifies definition-use (DU) pairs that unit tests must exercise — e.g. a variable defined at one node and used at a predicate several nodes later. A False-branch predicate is written with a leading ~ (negation)."
  )
);

CFG_FUNCTIONS.forEach((fn) => {
  children.push(h2(fn.name));
  children.push(p("Predicate and p-use() set of Edges", { bold: true }));
  const puRows = fn.predicateUse.map(([edge, predicate, branch, use]) => [
    edge,
    branch === "False" ? `~(${predicate})` : predicate,
    use,
  ]);
  children.push(table(["Edges(i,j)", "predicate(i,j)", "p-use(i,j)"], puRows, [15, 55, 30]));
  children.push(p(""));
  children.push(p("Def() and c-use() Set of Nodes", { bold: true }));
  children.push(table(["Node(i)", "def(i)", "c-use(i)"], fn.defCUse, [15, 40, 45]));
  children.push(p(""));
});

// ---------------------------------------------------------------------------
// Domain Testing
// ---------------------------------------------------------------------------
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(h1("Domain Testing"));
children.push(
  p(
    "Domain testing exercises the boundaries of each input domain and each business rule threshold using the running application (frontend at http://localhost:5173, backend at http://localhost:5050)."
  )
);
children.push(p("Domain testing for the Campus Lost & Found system focuses on the following features:"));
[
  "Item Reporting: validating that the system correctly handles required and optional fields when reporting a lost or found item.",
  "Rule-Based Matching: verifying the system correctly scores and classifies candidate matches at each threshold boundary.",
  "Ownership Verification: ensuring claim evidence meets the minimum-length business rule.",
  "Claim Decisions & Handover: testing the weak-match verification rule and the identity-verification rule before handover.",
  "Role-Based Access: confirming a user cannot reach a dashboard outside their role.",
].forEach((t) => children.push(bullet(t)));

let domainCount = 0;
function domainCase({ title, action, expectedOutcome, expectedBehavior, screenshotFile, actualNote, validationResults }) {
  domainCount += 1;
  children.push(h2(`Test Case ${domainCount}: ${title}`));
  children.push(p("Test Case Description:", { bold: true }));
  children.push(bullet(`Action: ${action}`));
  children.push(bullet(`Expected Outcome: ${expectedOutcome}`));
  children.push(p("Expected Behavior:", { bold: true }));
  expectedBehavior.forEach((t) => children.push(bullet(t)));
  children.push(p("Actual Outcome:", { bold: true }));
  children.push(...imagePara(path.join(SHOT_DIR, screenshotFile), 480));
  if (actualNote) children.push(p(actualNote, { italics: true }));
  children.push(p("Validation Results:", { bold: true }));
  validationResults.forEach((t) => children.push(bullet(t)));
  children.push(p(""));
}

domainCase({
  title: "Item Report — Required Field Left Blank",
  action: "Submit the Report Lost Item form with the Title field left empty.",
  expectedOutcome: "The system should prevent submission before it reaches the API.",
  expectedBehavior: ["Submission is blocked client-side.", "An explanatory validation message is shown to the user."],
  screenshotFile: "03-report-lost-invalid.png",
  actualNote: 'Browser enforced the required attribute: "Please fill out this field." This matches the server-side rejection already covered by validation.test.js.',
  validationResults: ["The system correctly blocked the invalid submission.", "The rejection is enforced both client-side and server-side."],
});

domainCase({
  title: "Item Report — Fully Valid Submission",
  action: "Fill in all required fields (title, description, location, date/time); leave category at its default (Bags).",
  expectedOutcome: "The report should save and the user should be redirected straight to Match Results for the new report.",
  expectedBehavior: ["The report is saved to the database.", "The browser navigates automatically to the new report's match results page."],
  screenshotFile: "04-report-lost-valid-redirect-to-matches.png",
  actualNote: "Report saved; browser navigated to /matches/:id automatically.",
  validationResults: ["The system correctly accepted the valid submission and redirected the user."],
});

domainCase({
  title: "Matching Score — Strong Match Boundary (>= 75)",
  action: 'Report "Blue Wallet" as lost and "Blue Wallet" as found, with the same color/brand/location and only a 1-hour date gap.',
  expectedOutcome: "A score >= 75 should display the STRONG_MATCH badge.",
  expectedBehavior: ["The candidate is ranked at the top of the match list.", "The badge reads STRONG MATCH."],
  screenshotFile: "05-match-strong.png",
  actualNote: "Score = 97/100, STRONG MATCH. Breakdown: name 25, description 22, color 15, brand 15, location 10, date 10.",
  validationResults: ["The system correctly classified the pair as a Strong Match at the upper boundary."],
});

domainCase({
  title: "Matching Score — Possible Match Boundary (50-74)",
  action: 'Report "Silver Ring" as lost and "Ring" as found, with the same color/brand/location, a 3-day date gap, and partial description overlap.',
  expectedOutcome: "A score between 50 and 74 should display the POSSIBLE_MATCH badge.",
  expectedBehavior: ["The candidate appears in the match list.", "The badge reads POSSIBLE MATCH."],
  screenshotFile: "06-match-possible.png",
  actualNote: "Score = 64/100, POSSIBLE MATCH.",
  validationResults: ["The system correctly classified the pair as a Possible Match inside the mid-range band."],
});

domainCase({
  title: "Matching Score — Weak Match Boundary (< 50)",
  action: 'Report "Green Notebook" as lost and "Umbrella" as found — different item, color, brand, and location, with a 9-day date gap.',
  expectedOutcome: "A score below 50 should display the WEAK_MATCH badge.",
  expectedBehavior: ["The candidate still appears (matching does not hide weak candidates).", "The badge reads WEAK MATCH."],
  screenshotFile: "07-match-weak.png",
  actualNote: "Score = 12/100 for the closest weak candidate, WEAK MATCH.",
  validationResults: ["The system correctly classified the dissimilar pair as a Weak Match."],
});

domainCase({
  title: "Match Confirmation — Persisted Decision",
  action: 'Student clicks "This is a match" on the Strong Match candidate.',
  expectedOutcome: "The candidate should be marked CONFIRMED and the decision should persist across reloads.",
  expectedBehavior: ["The badge updates immediately.", "Reloading the page shows the same CONFIRMED state."],
  screenshotFile: "08-match-confirmed.png",
  actualNote: 'Badge changed to "CONFIRMED MATCH"; verified via GET /reports/:id/matches returning matchDecision: "CONFIRMED" after reload.',
  validationResults: ["The decision was correctly persisted to the database, not just the UI."],
});

domainCase({
  title: "Claim Evidence — Boundary Value (9 vs. 10 Characters)",
  action: 'Submit a claim with evidence text "too short" (9 characters) against the 10-character minimum.',
  expectedOutcome: "Submission should be blocked at the boundary.",
  expectedBehavior: ["The form does not submit.", "A message states the minimum character count."],
  screenshotFile: "09-claim-evidence-too-short.png",
  actualNote: 'Browser reported: "Please lengthen this text to 10 characters or more (you are currently using 9 characters)."',
  validationResults: ["The system correctly rejected evidence one character short of the minimum."],
});

domainCase({
  title: "Claim Decision — Weak Match Approval Blocked Without Staff Verification",
  action: 'Staff clicks Approve on a WEAK_MATCH claim (score 2/100) without checking "I have verified this evidence in person".',
  expectedOutcome: "Approval should be rejected by the business rule from decideClaim (path P6).",
  expectedBehavior: ["The claim remains PENDING.", "An error message explains why approval was blocked."],
  screenshotFile: "16-weak-match-approval-blocked.png",
  actualNote: 'Error shown: "Weak match claims require staff-verified evidence before approval." Claim remained PENDING.',
  validationResults: ["The system correctly enforced the stricter verification rule for weak matches."],
});

domainCase({
  title: "Claim Decision — Weak Match Approved Once Verified",
  action: "Same claim; staff checks the verification box and clicks Approve again.",
  expectedOutcome: "The claim should transition to APPROVED (path P7).",
  expectedBehavior: ["The status badge updates to APPROVED."],
  screenshotFile: "17-weak-match-approved-with-verification.png",
  actualNote: "Status badge changed to APPROVED.",
  validationResults: ["The system correctly allowed approval once the extra verification step was satisfied."],
});

domainCase({
  title: "Handover — Blocked Without Identity Verification",
  action: 'Staff opens an APPROVED claim and leaves "I verified the claimant\'s identity in person" unchecked.',
  expectedOutcome: "The Confirm Handover button should stay disabled (canConfirmHandover path P2).",
  expectedBehavior: ["The Confirm Handover button is rendered disabled and does nothing if clicked."],
  screenshotFile: "14-handover-blocked-disabled.png",
  actualNote: "Button rendered disabled; clicking it had no effect (verified programmatically: button.disabled === true).",
  validationResults: ["The system correctly blocked handover confirmation until identity was verified."],
});

domainCase({
  title: "Handover — Completed Once Identity Verified",
  action: "Staff checks the identity box, clicks Confirm Handover.",
  expectedOutcome: "The claim status should become COMPLETED and both linked reports should move to RESOLVED (canConfirmHandover path P3).",
  expectedBehavior: ["The status badge updates to COMPLETED.", "Both the lost and found reports show RESOLVED."],
  screenshotFile: "15-handover-completed.png",
  actualNote: "Status badge changed to COMPLETED; both reports moved to RESOLVED.",
  validationResults: ["The system correctly completed the handover and closed out both linked reports."],
});

domainCase({
  title: "Role Boundary — Student Blocked From the Staff Dashboard",
  action: "A user acting as Demo Student (role=STUDENT) navigates directly to /staff.",
  expectedOutcome: "Access should be denied with an explanatory message, not the claims list.",
  expectedBehavior: ["A Restricted page is shown instead of the Staff dashboard."],
  screenshotFile: "20-role-blocked-staff.png",
  actualNote: '"Restricted — You\'re signed in as Demo Student (STUDENT). Switch to a staff or admin account to view this page."',
  validationResults: ["The system correctly enforced role-based access for the Staff dashboard."],
});

domainCase({
  title: "Role Boundary — Staff Blocked From the Student Dashboard",
  action: "A user acting as Demo Staff (role=STAFF) navigates directly to /student.",
  expectedOutcome: "Access should be denied, symmetric to the previous case.",
  expectedBehavior: ["A Restricted page is shown instead of the Student dashboard."],
  screenshotFile: "21-role-blocked-student.png",
  actualNote: '"Restricted — You\'re signed in as Demo Staff (STAFF). Switch to a student account to view this page."',
  validationResults: ["The system correctly enforced role-based access for the Student dashboard, symmetric to the Staff case."],
});

// ---------------------------------------------------------------------------
// Integration Testing
// ---------------------------------------------------------------------------
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(h1("Integration Testing"));
children.push(
  p(
    "Integration testing is a crucial phase in the development of the Campus Lost & Found system. Its main goal is to verify that different modules interact correctly and data flows seamlessly between them. For this project, we used the Incremental Integration approach, where modules are progressively integrated and tested rather than assembled all at once. This allows early detection of issues and ensures that each component works as expected within the full system."
  )
);

children.push(h2("Justification for Incremental Integration Approach"));
children.push(p("The Campus Lost & Found system relies on multiple modules that share data, such as:"));
[
  "Item reporting (src/routes/reports.js)",
  "Rule-based matching (src/services/matchingService.js)",
  "Claim management (src/routes/claims.js, src/services/claimService.js)",
  "Notifications (src/services/notificationService.js)",
  "Audit logging (src/routes/auditLogs.js)",
  "Role-based access (src/middleware/authContext.js)",
].forEach((t) => children.push(bullet(t)));
children.push(p("Using incremental integration ensures controlled testing and prevents interface mismatches, especially between the matching engine's output shape and the claim submission endpoint."));

children.push(p("Advantages", { bold: true }));
[
  "Early Defect Detection: each module is tested as it is integrated, enabling identification of problems (e.g. the weak-match/handover rules) before being combined with the UI.",
  "Flexibility: a defect in one module (e.g. notifications) can be fixed without breaking others (e.g. claim submission).",
  "Manageable Testing: integration is tested step by step, making it easier to debug interactions such as match scoring feeding into claim decisions.",
].forEach((t, i) => children.push(numbered(i + 1, t)));

children.push(p("Disadvantages", { bold: true }));
[
  "Time-Consuming: incremental integration requires more upfront planning than integrating all modules at once.",
  "Dependency Management: modules must be integrated in a logical order, e.g. reports must exist before a claim can reference them, and a claim must be approved before a handover can be confirmed.",
].forEach((t, i) => children.push(numbered(i + 1, t)));

children.push(p("Integration order: Report Reporting → Rule-Based Matching → Match Confirmation → Claim Submission → Claim Decision → Handover → Notifications → Role-Based Access."));

children.push(h2("Test Results Summary"));
children.push(
  p(
    "These scenarios are automated end-to-end: tests/integration/apiIntegration.test.js runs via `npm run test:integration` (node:test executed under tsx, since the project's Prisma client is generated as a TypeScript/ESM module) against the real Express API and PostgreSQL database — not mocks."
  )
);
const integrationRows = [
  ["TC-IT-001", "Report ↔ Matching", "Create a LOST and a FOUND report with matching attributes.", "GET /reports/:id/matches returns the counterpart with matchScore >= 75 (STRONG_MATCH).", "matchScore=100, STRONG_MATCH.", "Pass"],
  ["TC-IT-002", "Matching ↔ MatchDecision", "Confirm the suggested match (student).", "Decision persists as CONFIRMED and is returned on the next fetch.", "Confirmed via GET /reports/:id/matches.", "Pass"],
  ["TC-IT-003", "Matching ↔ Claim", "Submit a claim referencing the confirmed lost/found pair.", "Claim is created with status PENDING and a generated claimNumber.", "claimId captured for downstream steps.", "Pass"],
  ["TC-IT-004", "Claim ↔ Notification", "Staff approves the claim.", "Claim status becomes APPROVED and a Notification row is created for the claimant.", "Confirmed via GET /notifications.", "Pass"],
  ["TC-IT-005", "Claim ↔ Report Status", "Staff confirms handover on the approved claim.", "Both linked reports transition to RESOLVED.", "Both reports RESOLVED.", "Pass"],
  ["TC-IT-006", "Claim ↔ AuditLog", "Submit, approve, and hand over the same claim.", "An AuditLog row exists for each of the three actions (ADMIN-only read).", "3 audit log entries found for the claim.", "Pass"],
  ["TC-IT-007", "Role (actor) ↔ Route Access", "STUDENT attempts to decide a claim; STAFF attempts to view the audit log; ADMIN views the audit log.", "403 Forbidden for both role violations; 200 OK for ADMIN.", "403 / 403 / 200 as expected.", "Pass"],
];
children.push(table(["Test Case ID", "Modules", "Test Scenario", "Expected Output", "Actual Output", "Status"], integrationRows, [10, 14, 22, 24, 20, 10]));
children.push(p(""));
children.push(...imagePara(path.join(SHOT_DIR, "11-staff-dashboard.png"), 500, "Figure: Staff Dashboard showing claims produced end-to-end by the integrated Report → Match → Claim pipeline."));

children.push(h2("Summary of Results"));
children.push(p("All integration points were tested using automated checks against the live API and database. The interactions between modules worked as expected:"));
[
  "Reports and matches are correctly recorded and scored.",
  "Rule-based matching correctly computes confidence scores and classifies match bands.",
  "Claim decisions correctly enforce the weak-match verification rule.",
  "Handover correctly requires identity verification and cascades report status to RESOLVED.",
  "Audit logging correctly records every claim decision and handover.",
  "Role-based access correctly blocks STUDENT and STAFF from admin/staff-only endpoints.",
].forEach((t) => children.push(bullet(t)));
children.push(p("No major issues were encountered; all modules behaved as intended once integrated, confirming that the system functions cohesively end-to-end."));

// ---------------------------------------------------------------------------
// Access Control Testing
// ---------------------------------------------------------------------------
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(h1("Access Control Testing"));
children.push(
  p(
    "Access control is simulated via an x-user-id header (no real authentication, per the project proposal's stated out-of-scope) and enforced server-side by a requireRole middleware. These checks were exercised two independent ways: automatically inside the integration suite (TC-IT-007 above), and manually/reproducibly via the Bruno API collection (bruno/), which any team member can re-run without reading code."
  )
);
const accessControlRows = [
  ["TC-AC-001", "STUDENT calls PATCH /claims/:id/decision (approve/reject a claim)", "403 Forbidden — decisions are staff/admin-only.", "403, message: role not permitted.", "Pass"],
  ["TC-AC-002", "STAFF calls GET /audit-logs", "403 Forbidden — audit log is admin-only.", "403, message: role not permitted.", "Pass"],
  ["TC-AC-003", "ADMIN calls GET /audit-logs", "200 OK with the full audit trail.", "200, audit rows returned.", "Pass"],
  ["TC-AC-004", "STUDENT views /staff or /admin/audit-log route in the UI", "RequireRole redirects away; nav hides Staff/Audit Log tabs.", "Confirmed — see role-blocked screenshots.", "Pass"],
];
children.push(table(["Test Case ID", "Test Scenario", "Expected Output", "Actual Output", "Status"], accessControlRows, [10, 34, 26, 20, 10]));
children.push(p(""));
children.push(
  p(
    "Evidence: automated — `npm run test:integration`, assertion block TC-IT-007 in tests/integration/apiIntegration.test.js. Reproducible manually — Bruno collection, \"Claims → 5. Student Tries to Decide (expect 403)\" and \"Audit Log → 2. Staff Tries to View (expect 403)\", both validated via `npx @usebruno/cli run bruno --env Local -r`."
  )
);
children.push(...imagePara(path.join(SHOT_DIR, "20-role-blocked-staff.png"), 500, "Figure: UI-level role gating — a non-staff actor cannot reach the Staff dashboard."));

// ---------------------------------------------------------------------------
// Final Test Case with Functional Requirements and UI/UX
// ---------------------------------------------------------------------------
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(h1("Final Test Case with Functional Requirements and UI/UX"));
children.push(p("This section walks through the live application role by role, mapping each screen back to the functional requirements (FR1-FR5) from the project proposal."));

function pageOverview(title, fr, actions, screenshotFile) {
  children.push(h2(title));
  children.push(p(`Functional Requirement: ${fr}`, { bold: true }));
  children.push(p("Available Actions:", { bold: true }));
  actions.forEach((a) => children.push(bullet(a)));
  children.push(...imagePara(path.join(SHOT_DIR, screenshotFile), 500));
}

children.push(h2("Student — Functional Overview"));
pageOverview(
  "Home — Public Browse",
  "Supports FR1 (browse without logging in) and NFR4 Usability",
  ["Anyone can browse recently reported lost/found items and search, without an account.", "The page explains the 3-step workflow (Report → Match → Claim) for first-time visitors."],
  "01-home-public.png"
);
pageOverview(
  "Report a Lost Item",
  "FR1 — Item Reporting",
  ["Captures title, description, color, brand, location, date/time, category, and an optional photo.", "Required-field and boundary validation are enforced both client-side and server-side."],
  "02-home-student-nav.png"
);
pageOverview(
  "Match Results",
  "FR2 — Item Matching",
  ["Displays every open candidate of the opposite type, ranked by score, with the full attribute breakdown and a Strong/Possible/Weak badge.", "The student can confirm or dismiss a candidate directly from this screen."],
  "05-match-strong.png"
);
pageOverview(
  "Submit a Claim",
  "FR3 — Ownership Verification",
  ["The student picks their lost report and the found report they believe is theirs.", "The form requires at least 10 characters of supporting evidence."],
  "10-claim-submitted-strong.png"
);
pageOverview(
  "Notifications",
  "Supports FR3 (view claim status) and NFR4 Usability",
  ["The student receives an in-app notification whenever a match is confirmed or a claim's status changes, without needing to poll the claim page."],
  "18-notifications.png"
);
pageOverview(
  "Track Claim by Code",
  "FR3 — Ownership Verification / view claim status",
  ["A claimant can look up any claim's current status and decision history using its human-readable code (e.g. CLM-00007)."],
  "19-track-claim.png"
);

children.push(h2("Staff — Functional Overview"));
pageOverview(
  "Staff Dashboard & Claim Review",
  "FR4 — Claim Management",
  ["Staff see every submitted claim with its status.", "Staff can drill into a claim to review the evidence and match score before deciding."],
  "12-claim-review-pending.png"
);
pageOverview(
  "Claim Decision & Handover",
  "FR4 — Claim Management",
  ["Staff approve, reject, or request more information on a claim.", "An approved claim requires a separate in-person identity check before the handover — and therefore the report — can be marked complete."],
  "13-claim-approved-handover-panel.png"
);

children.push(h2("Admin — Functional Overview"));
pageOverview(
  "Audit Logging",
  "FR5 — Audit Logging",
  ["Every report creation, claim submission, claim decision, and handover is written to an AuditLog table with the acting user and a timestamp.", "The log is retrievable via GET /api/audit-logs, restricted to Admin."],
  "11-staff-dashboard.png"
);

children.push(h2("Role-Based Navigation (all roles)"));
children.push(p("Functional Requirement: NFR3 — Security", { bold: true }));
children.push(p("Available Actions:", { bold: true }));
["The navigation bar and the /student and /staff routes adapt to the signed-in role.", "A student cannot reach the staff claims dashboard, and staff cannot reach the student's personal dashboard."].forEach((a) => children.push(bullet(a)));
children.push(...imagePara(path.join(SHOT_DIR, "21-role-blocked-student.png"), 500));

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(h1("Summary"));
children.push(
  p(
    "91 unit tests, 38 independent control-flow paths across 9 functions, 13 domain test cases, 7 automated integration scenarios (via tsx --test against the live API and database), and a Bruno-based access-control test collection were executed against the running system. All results matched expectations. The rule-based matching engine, claim decision logic, and handover eligibility check — the modules identified as highest-risk in the project proposal because of their branching complexity — are fully covered by static analysis (CFG/DFG), automated integration tests, and live, screenshot-based evidence from the running application."
  )
);

children.push(h2("Final Test Execution Results"));
const finalResultsRows = [
  ["Unit Testing", "91", "91", "0", "npx jest — see Unit Testing section"],
  ["Control Flow Testing", "38 independent paths (9 functions)", "38", "0", "All CFG paths mapped to executed unit tests"],
  ["Data Flow Testing", "9 functions (def/c-use/p-use)", "9", "0", "All DU-pairs exercised by the same unit tests"],
  ["Domain Testing", "13", "13", "0", "Manual walkthrough against the running app"],
  ["Integration Testing", "7 (TC-IT-001..007, incl. 3 sub-checks in TC-IT-007)", "7", "0", "npm run test:integration — automated, reproducible"],
  ["Access Control Testing", "4 (TC-AC-001..004) + 2 Bruno 403 checks", "6", "0", "Integration suite TC-IT-007 + Bruno collection"],
];
children.push(
  table(
    ["Test Type", "Cases Run", "Passed", "Failed", "Evidence"],
    finalResultsRows,
    [18, 24, 12, 12, 34]
  )
);
children.push(p(""));
children.push(...codeBlock([
  "$ npm test",
  "Test Suites: 4 passed, 4 total",
  "Tests:       91 passed, 91 total",
  "",
  "$ npm run test:integration",
  "# tests 9",
  "# pass 9",
  "# fail 0",
  "",
  "$ npx @usebruno/cli run --env Local -r",
  "Requests      22 (22 Passed)",
  "Tests         18/18",
]));

children.push(h2("Defects Found and Resolved"));
const defectRows = [
  [
    "DEF-01",
    "GET /api/claims/by-code/ (empty code segment) and GET /api/claims/:id with a malformed (non-UUID) id both returned an uncaught 500 Internal Server Error instead of a clean 4xx response.",
    "The empty/invalid segment matched Express route GET /:id, which passed the string straight to Prisma; Postgres rejected it as invalid UUID syntax (Prisma error code P2007), and errorHandler.js did not recognize that code.",
    "Fixed in src/middleware/errorHandler.js: P2007 (and P2023) are now mapped to a 404 Not Found response. Verified via curl and via the Bruno \"Get Claim by Code\" request.",
    "Fixed",
  ],
];
children.push(table(["ID", "Symptom", "Root Cause", "Resolution", "Status"], defectRows, [10, 30, 25, 25, 10]));
children.push(p(""));
children.push(
  p(
    "No other failing tests or defects were found. One control-flow observation (not a defect) was documented in Control Flow Testing: the unionSize===0 branch inside scoreDescription()'s CFG is structurally present but unreachable through the public function, since the only way to reach it is already intercepted by an earlier check — the code behaves correctly, it simply contains one dead branch."
  )
);

const doc = new Document({
  sections: [
    {
      properties: {
        page: { size: { width: 12240, height: 15840 } },
      },
      children,
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  const outPath = path.join(__dirname, "Software_Testing_Report.docx");
  fs.writeFileSync(outPath, buffer);
  console.log("Wrote", outPath);
});
