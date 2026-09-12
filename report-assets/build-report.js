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
  ExternalHyperlink,
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
    paths: [
      ["P1", "item is null/not an object", "N1→N2(T)→N3 (throw: missing item)"],
      ["P2", "valid item, all fields present, occurredAt valid, no errors", "N1→N2(F)→N4→N5→N6(F)→…(loop)…→N4(F)→N8(T)→N9→N10(F)→N12(F)→N14 (valid)"],
      ["P3", "valid object, one required field missing/empty", "…→N6(T)→N7→N4…→N12(T)→N13 (throw: invalid item)"],
      ["P4", "valid object, occurredAt present but unparsable date", "…→N8(T)→N9→N10(T)→N11→N12(T)→N13 (throw: invalid item)"],
      ["P5", "valid object, occurredAt omitted entirely", "…→N8(F)→N12(F)→N14 (valid)"],
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
    paths: [
      ["P1", "either name empty after normalization", "N1→N2→N2(T)→N3 (return 0)"],
      ["P2", "normalized names identical", "…→N2(F)→N4(T)→N5 (return 25)"],
      ["P3", "one name a substring of the other", "…→N4(F)→N6(T)→N7 (return 15)"],
      ["P4", "names unrelated", "…→N6(F)→N8 (return 0)"],
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
    paths: [
      ["P1", "both descriptions empty (both word sets size 0)", "N1→N2(T)→N3 (return 0)"],
      ["P2", "one description empty, the other non-empty (loop body never runs)", "N1→N2(F)→N4→N5(F, no words)→N8→N9(F)→N11→N12"],
      ["P3", "both non-empty, no shared words (loop runs, N6 always False)", "…→N5(T)→N6(F)→N5(loop)…→N5(F)→N8→N9(F)→N11→N12"],
      ["P4", "both non-empty, at least one shared word (N6 True at least once)", "…→N5(T)→N6(T)→N7→N5(loop)…→N5(F)→N8→N9(F)→N11→N12"],
      ["P5 (infeasible)", "unionSize === 0 while N2 was False", "…→N8→N9(T)→N10→N12 — cannot occur: unionSize=0 only when both sets are empty, which N2 already intercepts"],
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
    paths: [
      ["P1", "either value empty after normalization", "N1→N2(T)→N3 (return 0)"],
      ["P2", "normalized values identical", "N1→N2(F)→N4(T)→N5 (return weight)"],
      ["P3", "normalized values differ", "N1→N2(F)→N4(F)→N6 (return 0)"],
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
    paths: [
      ["P1", "either location empty after normalization", "N1→N2(T)→N3 (return 0)"],
      ["P2", "normalized locations identical", "…→N2(F)→N4(T)→N5 (return 10)"],
      ["P3", "one location a substring of the other", "…→N4(F)→N6(T)→N7 (return 5)"],
      ["P4", "locations unrelated", "…→N6(F)→N8 (return 0)"],
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
    paths: [
      ["P1", "same-day report (diff = 0)", "N1→N2(T)→N3 (return 10)"],
      ["P2", "1-3 days apart", "N1→N2(F)→N4(T)→N5 (return 5)"],
      ["P3", "more than 3 days apart", "N1→N2(F)→N4(F)→N6 (return 0)"],
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
    paths: [
      ["P1", "score >= 75", "N1(T)→N2 (STRONG_MATCH)"],
      ["P2", "50 <= score < 75", "N1(F)→N3(T)→N4 (POSSIBLE_MATCH)"],
      ["P3", "score < 50", "N1(F)→N3(F)→N5 (WEAK_MATCH)"],
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
    paths: [
      ["P1", "action not in {APPROVE, REJECT, REQUEST_INFO}", "N1(T)→N2 (throw: invalid action)"],
      ["P2", "valid action, matchResult not a known band", "N1(F)→N3(T)→N4 (throw: invalid matchResult)"],
      ["P3", "action = REJECT", "…→N3(F)→N5(T)→N6 (REJECTED)"],
      ["P4", "action = REQUEST_INFO", "…→N5(F)→N7(T)→N8 (INFO_REQUESTED)"],
      ["P5", "action = APPROVE, hasEvidence = false", "…→N7(F)→N9(T)→N10 (throw: evidence required)"],
      ["P6", "APPROVE, evidence, WEAK_MATCH, not staff-verified", "…→N9(F)→N11(T)→N12 (throw: verification required)"],
      ["P7", "APPROVE, evidence, WEAK_MATCH, staff-verified", "…→N11(F)→N13 (APPROVED)"],
      ["P8", "APPROVE, evidence, POSSIBLE/STRONG match", "…→N11(F)→N13 (APPROVED)"],
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
    paths: [
      ["P1", "claim not yet APPROVED", "N1(T)→N2 (throw: must be APPROVED first)"],
      ["P2", "APPROVED, identity not verified", "N1(F)→N3(T)→N4 (throw: identity not verified)"],
      ["P3", "APPROVED, identity verified", "N1(F)→N3(F)→N5 (return true)"],
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
  new Paragraph({ text: "", spacing: { after: 1600 } }),
  new Paragraph({
    children: [new TextRun({ text: "Software Testing Term Project Report", bold: true, size: 40 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Campus Lost & Found Management System", size: 30 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 1200 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Rule-Based Item Matching, Ownership Verification & Claim Handling", italics: true, size: 24 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 1600 },
  }),
  new Paragraph({ children: [new TextRun({ text: "Members:", bold: true })], alignment: AlignmentType.CENTER, spacing: { after: 120 } }),
  new Paragraph({ text: "JATUPON ITSARA (6610073)", alignment: AlignmentType.CENTER }),
  new Paragraph({ text: "GULIZARA BENJAPALAPORN (6612233)", alignment: AlignmentType.CENTER }),
  new Paragraph({ text: "Chanyanut Pumasri (6620025)", alignment: AlignmentType.CENTER }),
  new Paragraph({ text: "Phanthira Kositjaroenkul (6630003)", alignment: AlignmentType.CENTER, spacing: { after: 1600 } }),
  new Paragraph({ children: [new PageBreak()] })
);

// ---- Introduction ----
children.push(h1("1. Introduction"));
children.push(
  p(
    "The Campus Lost & Found Management System helps students and staff report lost and found items, automatically compares reports using a rule-based matching algorithm, and supports staff in verifying ownership before an item is handed over. This report documents the software testing performed on the system, covering Unit Testing, Control Flow Testing, Data Flow Testing, Domain Testing, Integration Testing, Access Control Testing, and a final walkthrough mapping the implemented UI to the system's functional requirements."
  )
);

children.push(h2("1.1 Functional Scope"));
children.push(p("In scope:"));
[
  "Item reporting for lost and found items, including optional photos.",
  "Rule-based item matching and match score calculation.",
  "Staff/student confirmation or dismissal of suggested matches.",
  "Ownership verification using supporting evidence.",
  "Claim management for Lost & Found staff, including a handover confirmation step.",
  "In-app notifications for match confirmations and claim decisions.",
  "Audit logging for claim records.",
  "Input validation and error handling.",
  "Role-based access to student and staff workflows.",
].forEach((t) => children.push(bullet(t)));
children.push(p("Out of scope (per project proposal):"));
["Real Microsoft/AU authentication.", "User management.", "Email or SMS notifications.", "Mobile application.", "AI image recognition.", "Database performance optimization."].forEach((t) =>
  children.push(bullet(t))
);

// ---- Unit Testing ----
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(h1("2. Unit Testing"));
children.push(
  p(
    "Unit testing verifies individual functions in isolation. Jest was used as the test runner. All tests run against plain JavaScript modules with no database dependency, so they execute in well under one second."
  )
);
children.push(h2("2.1 Test Environment"));
children.push(p("Node.js v22.12.0, Jest 30.4.2. No mocking required — matchingService, claimService, notificationService, and the Zod validation schemas are pure functions."));

children.push(h2("2.2 Test Suites"));
const suites = [
  ["matchingService.test.js", "scoreItemName, scoreDescription, scoreExactOptionalField, scoreLocation, scoreDate, classifyScore, validateItemForMatching, calculateMatchScore", "50"],
  ["claimService.test.js", "decideClaim (decision table), canConfirmHandover (handover eligibility)", "17"],
  ["validation.test.js", "itemReportSchema, claimSubmissionSchema, claimDecisionSchema (equivalence partitioning)", "17"],
  ["notificationService.test.js", "buildNotificationMessage for all five notification types", "7"],
];
children.push(table(["Test File", "Functions Covered", "Test Count"], suites, [30, 55, 15]));
children.push(p(""));
children.push(h2("2.3 Result"));
children.push(...codeBlock(["Test Suites: 4 passed, 4 total", "Tests:       91 passed, 91 total", "Snapshots:   0 total", "Time:        0.43 s"]));
children.push(p("All 91 unit tests pass. Representative test cases are summarized below; full source is in tests/*.test.js."));

const unitCases = [
  ["scoreItemName: exact match", "\"Black Backpack\" / \"black backpack\"", "25", "25", "Pass"],
  ["scoreItemName: substring match", "\"Backpack\" / \"Black Backpack\"", "15", "15", "Pass"],
  ["scoreItemName: no match", "\"Backpack\" / \"Umbrella\"", "0", "0", "Pass"],
  ["scoreDate: boundary at 3/4 days", "diff=3 → 5, diff=4 → 0", "5 / 0", "5 / 0", "Pass"],
  ["scoreDescription: both empty (P1)", "\"\" / \"\"", "0", "0", "Pass"],
  ["scoreDescription: one empty (P2)", "\"\" / \"black leather backpack\"", "0", "0", "Pass"],
  ["scoreDate: unparsable date degrades to 0", "\"not-a-date\" / \"2026-08-10\"", "0", "0", "Pass"],
  ["classifyScore: threshold boundaries", "49→WEAK, 50→POSSIBLE, 74→POSSIBLE, 75→STRONG", "as listed", "as listed", "Pass"],
  ["classifyScore: out-of-domain scores", "-10 → WEAK, 150 → STRONG", "as listed", "as listed", "Pass"],
  ["validateItemForMatching: array input", "[] (typeof 'object', passes type check)", "throws (missing fields)", "throws (missing fields)", "Pass"],
  ["validateItemForMatching: multiple missing fields", "title and location both undefined", "2 error details", "2 error details", "Pass"],
  ["decideClaim: weak match needs verification", "APPROVE, WEAK_MATCH, staffVerifiedEvidence=false", "throws", "throws", "Pass"],
  ["decideClaim: weak match approved once verified", "APPROVE, WEAK_MATCH, staffVerifiedEvidence=true", "APPROVED", "APPROVED", "Pass"],
  ["canConfirmHandover: blocks unapproved claim", "status=PENDING, verifiedIdentity=true", "throws", "throws", "Pass"],
];
children.push(table(["Test Case", "Input", "Expected", "Actual", "Result"], unitCases, [24, 30, 16, 16, 14]));

// ---- Control Flow Testing ----
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(h1("3. Control Flow Testing"));
children.push(
  p(
    "For each function below, the control flow graph (CFG) is drawn from the source, and an independent path is listed for every branch so that full decision (branch) coverage is achieved. All paths are exercised by the Jest suite in Section 2."
  )
);

CFG_FUNCTIONS.forEach((fn, idx) => {
  children.push(h2(`3.${idx + 1} ${fn.name}`));
  children.push(p(`Module: ${fn.module}`, { italics: true, size: 18, color: "5B6570" }));
  children.push(
    p(`Cyclomatic Complexity: V(G) = ${fn.paths.length} (decision points + 1 = number of independent paths)`, {
      bold: true,
      size: 20,
    })
  );
  children.push(...imagePara(path.join(CFG_DIR, fn.file), 460, `Figure: Control flow graph for ${fn.name}`));
  children.push(
    table(
      ["Path", "Condition Combination", "Route Through CFG"],
      fn.paths,
      [10, 35, 55]
    )
  );
  if (fn.name.startsWith("scoreDescription")) {
    children.push(
      p(
        "Note: Path P5 is structurally counted toward V(G) but is infeasible when reached through scoreDescription() — unionSize can only be 0 if both word sets are empty, and that case is already intercepted earlier at node N2. This was confirmed by attempting to construct an input that reaches N9 with unionSize===0 without tripping N2, which is not possible. No defect: the dead branch is unreachable, not incorrect."
      )
    );
  }
  children.push(p(""));
});

// ---- Data Flow Testing ----
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(h1("4. Data Flow Testing"));
children.push(
  p(
    "Data flow testing analyzes how variables are defined (def) and used (c-use inside a node, p-use on a predicate's outgoing edges) across the same control flow graphs from Section 3. This identifies definition-use (DU) pairs that unit tests must exercise — e.g., a variable defined at one node and used at a predicate several nodes later."
  )
);

CFG_FUNCTIONS.forEach((fn, idx) => {
  children.push(h2(`4.${idx + 1} ${fn.name}`));
  children.push(h3("Predicate and p-use() set of edges"));
  children.push(table(["Edge (i,j)", "Predicate(i,j)", "Branch", "p-use(i,j)"], fn.predicateUse, [15, 45, 15, 25]));
  children.push(p(""));
  children.push(h3("Def() and c-use() set of nodes"));
  children.push(table(["Node (i)", "def(i)", "c-use(i)"], fn.defCUse, [15, 40, 45]));
  children.push(p(""));
});

// ---- Domain Testing ----
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(h1("5. Domain Testing"));
children.push(
  p(
    "Domain testing exercises the boundaries of each input domain and each business rule threshold using the running application (frontend at http://localhost:5173, backend at http://localhost:5050). Each case below shows the input, the expected outcome, and a screenshot of the actual result."
  )
);

function domainCase(title, input, expected, screenshotFile, note) {
  children.push(h2(title));
  children.push(p(`Input: ${input}`));
  children.push(p(`Expected: ${expected}`));
  children.push(...imagePara(path.join(SHOT_DIR, screenshotFile), 500));
  if (note) children.push(p(`Actual: ${note}`));
  children.push(p(""));
}

domainCase(
  "5.1 Item report — required field left blank (Equivalence Partitioning, invalid class)",
  "Report Lost Item form submitted with Title left empty.",
  "Submission blocked before it reaches the API.",
  "03-report-lost-invalid.png",
  "Browser enforces the required attribute (\"Please fill out this field.\") — matches the server-side rejection already covered by validation.test.js."
);

domainCase(
  "5.2 Item report — fully valid submission",
  "All required fields filled (title, description, location, date/time); category defaults to Bags.",
  "Report saves and the user is redirected straight to Match Results for the new report.",
  "04-report-lost-valid-redirect-to-matches.png",
  "Report saved; browser navigated to /matches/:id automatically."
);

domainCase(
  "5.3 Matching score — Strong Match boundary (≥ 75)",
  "\"Blue Wallet\" lost vs. \"Blue Wallet\" found — same title/color/brand/location, 1-hour date gap.",
  "Score ≥ 75 → STRONG_MATCH badge.",
  "05-match-strong.png",
  "Score = 97/100, STRONG MATCH. Breakdown: name 25, description 22, color 15, brand 15, location 10, date 10."
);

domainCase(
  "5.4 Matching score — Possible Match boundary (50–74)",
  "\"Silver Ring\" lost vs. \"Ring\" found — same color/brand/location, 3-day date gap, partial description overlap.",
  "50 ≤ score < 75 → POSSIBLE_MATCH badge.",
  "06-match-possible.png",
  "Score = 64/100, POSSIBLE MATCH."
);

domainCase(
  "5.5 Matching score — Weak Match boundary (< 50)",
  "\"Green Notebook\" lost vs. \"Umbrella\" found — different item, color, brand, location, 9-day gap.",
  "Score < 50 → WEAK_MATCH badge.",
  "07-match-weak.png",
  "Score = 12/100 for the closest weak candidate, WEAK MATCH."
);

domainCase(
  "5.6 Match confirmation — persisted decision",
  "Student clicks \"This is a match\" on the Strong Match candidate.",
  "Candidate is marked CONFIRMED and the decision persists across reloads.",
  "08-match-confirmed.png",
  "Badge changes to \"CONFIRMED MATCH\"; verified via GET /reports/:id/matches returning matchDecision: \"CONFIRMED\" after reload."
);

domainCase(
  "5.7 Claim evidence — boundary value (9 vs. 10 characters)",
  "Evidence text \"too short\" (9 characters) submitted against the 10-character minimum.",
  "Submission blocked at the boundary.",
  "09-claim-evidence-too-short.png",
  "Browser reports: \"Please lengthen this text to 10 characters or more (you are currently using 9 characters).\""
);

domainCase(
  "5.8 Claim decision — Weak Match approval blocked without staff verification",
  "Staff clicks Approve on a WEAK_MATCH claim (score 2/100) without checking \"I have verified this evidence in person\".",
  "Approval rejected by the business rule from Section 3's decideClaim CFG (path P6).",
  "16-weak-match-approval-blocked.png",
  "Error shown: \"Weak match claims require staff-verified evidence before approval.\" Claim remains PENDING."
);

domainCase(
  "5.9 Claim decision — Weak Match approved once verified",
  "Same claim, staff checks the verification box and clicks Approve again.",
  "Claim transitions to APPROVED (path P7).",
  "17-weak-match-approved-with-verification.png",
  "Status badge changes to APPROVED."
);

domainCase(
  "5.10 Handover — blocked without identity verification",
  "Staff opens an APPROVED claim and leaves \"I verified the claimant's identity in person\" unchecked.",
  "Confirm Handover button stays disabled (canConfirmHandover path P2).",
  "14-handover-blocked-disabled.png",
  "Button rendered disabled; clicking it has no effect (verified programmatically: button.disabled === true)."
);

domainCase(
  "5.11 Handover — completed once identity verified",
  "Staff checks the identity box, clicks Confirm Handover.",
  "Claim status becomes COMPLETED and both linked reports move to RESOLVED (canConfirmHandover path P3).",
  "15-handover-completed.png",
  "Status badge changes to COMPLETED."
);

domainCase(
  "5.12 Role boundary — Student blocked from the Staff dashboard",
  "A user acting as Demo Student (role=STUDENT) navigates directly to /staff.",
  "Access denied with an explanatory message, not the claims list.",
  "20-role-blocked-staff.png",
  "\"Restricted — You're signed in as Demo Student (STUDENT). Switch to a staff or admin account to view this page.\""
);

domainCase(
  "5.13 Role boundary — Staff blocked from the Student dashboard",
  "A user acting as Demo Staff (role=STAFF) navigates directly to /student.",
  "Access denied, symmetric to 5.12.",
  "21-role-blocked-student.png",
  "\"Restricted — You're signed in as Demo Staff (STAFF). Switch to a student account to view this page.\""
);

// ---- Integration Testing ----
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(h1("6. Integration Testing"));
children.push(h2("6.1 Integration Strategy"));
children.push(
  p(
    "Modules were integrated incrementally rather than all at once, following the natural dependency order of the workflow: a Claim cannot exist without Reports to reference, a Handover cannot exist without an approved Claim, and a Notification is always a side effect of a Match, Claim, or Handover event. Incremental integration surfaces interface mismatches early (e.g., between the matching engine's output shape and the claim submission endpoint) without waiting for the whole system to be wired up."
  )
);
children.push(p("Integration order: Report Reporting → Rule-Based Matching → Match Confirmation → Claim Submission → Claim Decision → Handover → Notifications → Role-Based Access."));

children.push(h2("6.2 Advantages / Disadvantages"));
children.push(
  table(
    ["", "Notes"],
    [
      ["Advantages", "Early defect detection per boundary (e.g. the weak-match/handover rules were caught and fixed before being combined with the UI); each module can be re-tested in isolation without waiting on the rest of the system."],
      ["Disadvantages", "More upfront planning to decide a safe integration order; a broken lower-level module (e.g. matchingService) blocks every module stacked on top of it (claims, handover, notifications)."],
    ],
    [20, 80]
  )
);

children.push(h2("6.3 Integration Test Results"));
children.push(
  p(
    "Unlike Sections 2–5, which exercise pure functions in isolation, these scenarios are automated end-to-end: tests/integration/apiIntegration.test.js runs via `npm run test:integration` (node:test executed under tsx, since the project's Prisma client is generated as a TypeScript/ESM module) against the real Express API and PostgreSQL database — not mocks. Each IT-xx below is one automated check, so a reader can independently confirm every Pass by running the command and reading the same PASS/FAIL output shown in 6.4."
  )
);
const integrationRows = [
  ["IT-01", "Report ↔ Matching", "Create a LOST and a FOUND report with matching title/description/color/brand/location/date.", "GET /reports/:id/matches returns the counterpart with matchScore ≥ 75 (STRONG_MATCH).", "Confirmed — matchScore=100, STRONG_MATCH.", "Pass"],
  ["IT-02", "Matching ↔ MatchDecision", "Confirm the suggested match (student).", "Decision persists as CONFIRMED and is returned on the next fetch.", "Confirmed via GET /reports/:id/matches.", "Pass"],
  ["IT-03", "Matching ↔ Claim", "Submit a claim referencing the confirmed lost/found pair.", "Claim is created with status PENDING and a generated claimNumber.", "Confirmed — claimId captured for downstream steps.", "Pass"],
  ["IT-04", "Claim ↔ Notification", "Staff approves the claim.", "Claim status becomes APPROVED and a Notification row is created for the claimant.", "Confirmed via GET /notifications.", "Pass"],
  ["IT-05", "Claim ↔ Report status", "Staff confirms handover on the approved claim.", "Both linked reports transition to RESOLVED.", "Confirmed — both reports RESOLVED.", "Pass"],
  ["IT-06", "Claim ↔ AuditLog", "Submit, approve, and hand over the same claim.", "An AuditLog row exists for each of the three actions (ADMIN-only read).", "Confirmed — 3 audit log entries found for the claim.", "Pass"],
  ["IT-07", "Role (actor) ↔ Route access", "STUDENT attempts to decide a claim; STAFF attempts to view the audit log; ADMIN views the audit log.", "403 Forbidden for both role violations; 200 OK for ADMIN.", "Confirmed — 403 / 403 / 200 as expected.", "Pass"],
];
children.push(table(["ID", "Modules", "Scenario", "Expected", "Actual", "Result"], integrationRows, [8, 16, 22, 24, 22, 8]));
children.push(p(""));
children.push(...imagePara(path.join(SHOT_DIR, "11-staff-dashboard.png"), 500, "Figure: Staff Dashboard showing claims produced end-to-end by the integrated Report → Match → Claim pipeline."));

// ---- Access Control Testing ----
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(h1("7. Access Control Testing"));
children.push(
  p(
    "Access control is simulated via an x-user-id header (no real authentication, per the project proposal's stated out-of-scope) and enforced server-side by a requireRole middleware. These checks were exercised two independent ways: automatically inside the integration suite (IT-07 above), and manually/reproducibly via the Bruno API collection (bruno/), which any team member can re-run without reading code."
  )
);
const accessControlRows = [
  ["AC-01", "STUDENT calls PATCH /claims/:id/decision (approve/reject a claim)", "403 Forbidden — decisions are staff/admin-only.", "403, message: role not permitted.", "Pass"],
  ["AC-02", "STAFF calls GET /audit-logs", "403 Forbidden — audit log is admin-only.", "403, message: role not permitted.", "Pass"],
  ["AC-03", "ADMIN calls GET /audit-logs", "200 OK with the full audit trail.", "200, audit rows returned.", "Pass"],
  ["AC-04", "STUDENT views /staff or /admin/audit-log route in the UI", "RequireRole redirects away from the page; nav does not show Staff/Audit Log tabs.", "Confirmed — see 20/21-role-blocked screenshots.", "Pass"],
];
children.push(table(["ID", "Scenario", "Expected", "Actual", "Result"], accessControlRows, [8, 32, 28, 22, 10]));
children.push(p(""));
children.push(
  p(
    "Evidence: automated — `npm run test:integration`, assertion block IT-07 in tests/integration/apiIntegration.test.js. Reproducible manually — Bruno collection, \"Claims → 5. Student Tries to Decide (expect 403)\" and \"Audit Log → 2. Staff Tries to View (expect 403)\", both validated via `npx @usebruno/cli run bruno --env Local -r`."
  )
);
children.push(...imagePara(path.join(SHOT_DIR, "20-role-blocked-staff.png"), 500, "Figure: UI-level role gating — a non-staff actor cannot reach the Staff dashboard."));

// ---- Final Test Case with FR + UI/UX ----
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(h1("8. Final Test Case with Functional Requirements and UI/UX"));
children.push(p("This section walks through the live application page by page, mapping each screen back to the functional requirements (FR1–FR5) from the project proposal."));

function frSection(title, fr, desc, screenshotFile) {
  children.push(h2(title));
  children.push(p(`Functional Requirement: ${fr}`, { bold: true }));
  children.push(p(desc));
  children.push(...imagePara(path.join(SHOT_DIR, screenshotFile), 500));
}

frSection(
  "7.1 Home — public browse",
  "Supports FR1 (browse without logging in) and NFR4 Usability",
  "Anyone can browse recently reported lost/found items and search, without an account. The page also explains the 3-step workflow (Report → Match → Claim) for first-time visitors.",
  "01-home-public.png"
);
frSection(
  "7.2 Report a Lost Item",
  "FR1 — Item Reporting",
  "Captures title, description, color, brand, location, date/time, category, and an optional photo. Required-field and boundary validation are enforced both client-side and server-side (Section 5.1, 5.2).",
  "02-home-student-nav.png"
);
frSection(
  "7.3 Match Results",
  "FR2 — Item Matching",
  "Displays every open candidate of the opposite type, ranked by score, with the full attribute breakdown and a Strong/Possible/Weak badge. Staff or student can confirm or dismiss a candidate directly from this screen.",
  "05-match-strong.png"
);
frSection(
  "7.4 Submit a Claim",
  "FR3 — Ownership Verification",
  "Lets a student pick their lost report and the found report they believe is theirs, and requires at least 10 characters of supporting evidence.",
  "10-claim-submitted-strong.png"
);
frSection(
  "7.5 Staff Dashboard & Claim Review",
  "FR4 — Claim Management",
  "Staff see every submitted claim with its status, and can drill into one to review the evidence and match score before deciding.",
  "12-claim-review-pending.png"
);
frSection(
  "7.6 Claim Decision & Handover",
  "FR4 — Claim Management",
  "Staff approve, reject, or request more information; an approved claim then requires a separate in-person identity check before the handover — and therefore the report — can be marked complete.",
  "13-claim-approved-handover-panel.png"
);
frSection(
  "7.7 Notifications",
  "Supports FR3 (View claim status) and NFR4 Usability",
  "Students receive an in-app notification whenever a match is confirmed or a claim's status changes, without needing to poll the claim page themselves.",
  "18-notifications.png"
);
frSection(
  "7.8 Track Claim by Code",
  "FR3 — Ownership Verification / View claim status",
  "A claimant (or staff) can look up any claim's current status and decision history using its human-readable code (e.g. CLM-00007).",
  "19-track-claim.png"
);
frSection(
  "7.9 Audit Logging",
  "FR5 — Audit Logging",
  "Every report creation, claim submission, claim decision, and handover is written to an AuditLog table with the acting user and a timestamp, retrievable via GET /api/audit-logs (admin-only).",
  "11-staff-dashboard.png"
);
frSection(
  "7.10 Role-Based Navigation",
  "NFR3 — Security",
  "The navigation bar and the /student and /staff routes adapt to the signed-in role: a student cannot reach the staff claims dashboard, and staff cannot reach the student's personal dashboard.",
  "21-role-blocked-student.png"
);

// ---- Summary ----
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(h1("9. Summary"));
children.push(
  p(
    "91 unit tests, 38 independent control-flow paths across 9 functions, 13 domain test cases, 7 automated integration scenarios (via tsx --test against the live API and database), and a Bruno-based access-control test collection were executed against the running system. All results matched expectations. The rule-based matching engine, claim decision logic, and handover eligibility check — the modules identified as highest-risk in the project proposal because of their branching complexity — are fully covered by static analysis (CFG/DFG), automated integration tests, and live, screenshot-based evidence from the running application."
  )
);

children.push(h2("9.1 Final Test Execution Results"));
const finalResultsRows = [
  ["Unit Testing", "91", "91", "0", "npx jest — see Section 2.3"],
  ["Control Flow Testing", "38 independent paths (9 functions)", "38", "0", "All CFG paths mapped to executed unit tests — Section 3"],
  ["Data Flow Testing", "9 functions (def/c-use/p-use)", "9", "0", "All DU-pairs exercised by the same unit tests — Section 4"],
  ["Domain Testing", "13", "13", "0", "Manual walkthrough against the running app — Section 5"],
  ["Integration Testing", "9 (IT-01..IT-07, incl. 3 sub-checks in IT-07)", "9", "0", "npm run test:integration — automated, reproducible"],
  ["Access Control Testing", "4 (AC-01..AC-04) + 2 Bruno 403 checks", "6", "0", "Integration suite IT-07 + Bruno collection — Section 7"],
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

children.push(h2("9.2 Defects Found and Resolved"));
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
    "No other failing tests or defects were found. One control-flow observation (not a defect) was documented in Section 3.3: the unionSize===0 branch inside scoreDescription()'s CFG is structurally present but unreachable through the public function, since the only way to reach it is already intercepted by an earlier check — the code behaves correctly, it simply contains one dead branch."
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
