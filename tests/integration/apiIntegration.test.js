/**
 * Integration Testing — exercises the real Express app against the real database
 * (no mocks). Requires PostgreSQL running and DATABASE_URL set (see .env).
 *
 * Each test is numbered to match section 6.3 of the testing report
 * (Software_Testing_Report.docx): IT-01 .. IT-07.
 *
 * This suite runs under Node's built-in test runner via tsx (not Jest) because
 * the generated Prisma client is TS/ESM-native — the same reason the app itself
 * only runs via `tsx` (see package.json's dev/start scripts).
 *
 * Run with: npm run test:integration
 */
require("dotenv/config");
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../../src/app");
const prisma = require("../../src/config/prisma");

let student;
let staff;
let admin;
let category;

const createdReportIds = [];
let claimId;
let lostId;
let foundId;

async function findUserByRole(roleName) {
  const user = await prisma.user.findFirst({
    where: { role: { name: roleName } },
    orderBy: { createdAt: "asc" },
  });
  if (!user) throw new Error(`No seeded ${roleName} user found — run \`npm run prisma:seed\` first.`);
  return user;
}

function uniqueTitle(label) {
  return `IT-TEST ${label} ${Date.now()}`;
}

before(async () => {
  student = await findUserByRole("STUDENT");
  staff = await findUserByRole("STAFF");
  admin = await findUserByRole("ADMIN");
  category = await prisma.itemCategory.findFirst();
  if (!category) throw new Error("No seeded category found — run `npm run prisma:seed` first.");
});

after(async () => {
  // Delete any claims referencing our test reports first (FK constraint),
  // looked up fresh rather than relying on `claimId` so cleanup is resilient
  // even if an earlier assertion threw before claimId was captured.
  if (createdReportIds.length) {
    await prisma.claim.deleteMany({
      where: {
        OR: [
          { lostReportId: { in: createdReportIds } },
          { foundReportId: { in: createdReportIds } },
        ],
      },
    });
    await prisma.itemReport.deleteMany({ where: { id: { in: createdReportIds } } });
  }
  await prisma.$disconnect();
});

describe("IT-01: Report <-> Matching", () => {
  test("creating a matching LOST/FOUND pair produces a scored, ranked candidate", async () => {
    const lostRes = await request(app)
      .post("/api/reports")
      .set("x-user-id", student.id)
      .send({
        reportType: "LOST",
        title: uniqueTitle("Wallet"),
        description: "A brown leather wallet with a zipper coin pocket",
        location: "Library",
        occurredAt: "2026-08-20T10:00:00.000Z",
        categoryId: category.id,
        color: "Brown",
        brand: "Fossil",
      });
    assert.equal(lostRes.status, 201);
    lostId = lostRes.body.data.id;
    createdReportIds.push(lostId);

    const foundRes = await request(app)
      .post("/api/reports")
      .set("x-user-id", staff.id)
      .send({
        reportType: "FOUND",
        title: lostRes.body.data.title,
        description: lostRes.body.data.description,
        location: "Library",
        occurredAt: "2026-08-20T10:30:00.000Z",
        categoryId: category.id,
        color: "Brown",
        brand: "Fossil",
      });
    assert.equal(foundRes.status, 201);
    foundId = foundRes.body.data.id;
    createdReportIds.push(foundId);

    const matchesRes = await request(app).get(`/api/reports/${lostId}/matches`);
    assert.equal(matchesRes.status, 200);

    const candidate = matchesRes.body.data.find((m) => m.report.id === foundId);
    assert.ok(candidate, "expected the found report to appear as a match candidate");
    assert.ok(candidate.score >= 75, `expected score >= 75, got ${candidate.score}`);
    assert.equal(candidate.result, "STRONG_MATCH");
  });
});

describe("IT-02: Matching <-> MatchDecision", () => {
  test("confirming a match persists and is reflected on the next fetch", async () => {
    const decisionRes = await request(app)
      .post("/api/reports/matches/decision")
      .set("x-user-id", student.id)
      .send({ lostReportId: lostId, foundReportId: foundId, decision: "CONFIRMED" });
    assert.equal(decisionRes.status, 200);
    assert.equal(decisionRes.body.data.decision, "CONFIRMED");

    const matchesRes = await request(app).get(`/api/reports/${lostId}/matches`);
    const candidate = matchesRes.body.data.find((m) => m.report.id === foundId);
    assert.equal(candidate.matchDecision, "CONFIRMED");
  });
});

describe("IT-03: Matching <-> Claim", () => {
  test("submitting a claim stores the matchScore computed at submission time", async () => {
    const claimRes = await request(app)
      .post("/api/claims")
      .set("x-user-id", student.id)
      .send({
        lostReportId: lostId,
        foundReportId: foundId,
        evidenceDescription: "The zipper pull has a small chip near the top.",
      });
    assert.equal(claimRes.status, 201);
    assert.equal(claimRes.body.data.status, "PENDING");
    assert.ok(claimRes.body.data.matchScore >= 75);

    claimId = claimRes.body.data.id;
  });
});

describe("IT-04: Claim <-> Notification", () => {
  test("approving a claim creates a notification for the claimant", async () => {
    const decisionRes = await request(app)
      .patch(`/api/claims/${claimId}/decision`)
      .set("x-user-id", staff.id)
      .send({ action: "APPROVE", staffVerifiedEvidence: true });
    assert.equal(decisionRes.status, 200);
    assert.equal(decisionRes.body.data.status, "APPROVED");

    const notifRes = await request(app).get("/api/notifications").set("x-user-id", student.id);
    assert.equal(notifRes.status, 200);
    const notification = notifRes.body.data.find((n) => n.claimId === claimId);
    assert.ok(notification, "expected a notification referencing this claim");
    assert.equal(notification.type, "CLAIM_APPROVED");
  });
});

describe("IT-05: Claim <-> Report status", () => {
  test("confirming handover moves both linked reports to RESOLVED", async () => {
    const handoverRes = await request(app)
      .patch(`/api/claims/${claimId}/handover`)
      .set("x-user-id", staff.id)
      .send({ verifiedIdentity: true });
    assert.equal(handoverRes.status, 200);
    assert.equal(handoverRes.body.data.status, "COMPLETED");

    const reportsRes = await request(app).get("/api/reports");
    const lost = reportsRes.body.data.find((r) => r.id === lostId);
    const found = reportsRes.body.data.find((r) => r.id === foundId);
    assert.equal(lost.status, "RESOLVED");
    assert.equal(found.status, "RESOLVED");
  });
});

describe("IT-06: Claim <-> AuditLog", () => {
  test("every step of the claim lifecycle wrote an audit log entry", async () => {
    const auditRes = await request(app).get("/api/audit-logs").set("x-user-id", admin.id);
    assert.equal(auditRes.status, 200);

    const entriesForClaim = auditRes.body.data.filter((log) => log.claim && log.claim.id === claimId);
    const actions = entriesForClaim.map((log) => log.action).sort();
    assert.deepEqual(actions, ["CLAIM_DECIDED", "CLAIM_SUBMITTED", "HANDOVER_COMPLETED"]);
  });
});

describe("IT-07: Auth (actor) <-> Route access", () => {
  test("a student cannot decide a claim (403)", async () => {
    const res = await request(app)
      .patch(`/api/claims/${claimId}/decision`)
      .set("x-user-id", student.id)
      .send({ action: "REJECT" });
    assert.equal(res.status, 403);
  });

  test("staff cannot view the audit log (403, admin-only)", async () => {
    const res = await request(app).get("/api/audit-logs").set("x-user-id", staff.id);
    assert.equal(res.status, 403);
  });

  test("admin can view the audit log (200)", async () => {
    const res = await request(app).get("/api/audit-logs").set("x-user-id", admin.id);
    assert.equal(res.status, 200);
  });
});
