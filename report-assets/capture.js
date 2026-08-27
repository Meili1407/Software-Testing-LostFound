const { chromium } = require("playwright");
const path = require("path");

const API = "http://localhost:5050/api";
const APP = "http://localhost:5173";
const OUT = path.join(__dirname, "screenshots");

const STUDENT = "443d8996-7b6b-4613-a017-31cb63ffd155";
const STAFF = "9e84a61e-2627-48e8-ad36-be5aed7bbf69";
const CATEGORY = "24538618-f254-49b4-b1f9-3adeb5c7df6d"; // Bags

async function api(path_, { method = "GET", userId, body } = {}) {
  const res = await fetch(`${API}${path_}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(userId ? { "x-user-id": userId } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path_} -> ${res.status}: ${json.message}`);
  return json.data;
}

async function createReport(userId, overrides) {
  return api("/reports", {
    method: "POST",
    userId,
    body: {
      reportType: "LOST",
      categoryId: CATEGORY,
      ...overrides,
    },
  });
}

async function main() {
  console.log("Seeding deterministic demo data...");

  const strongLost = await createReport(STUDENT, {
    reportType: "LOST",
    title: "Blue Wallet",
    description: "A blue leather wallet with card slots",
    color: "Blue",
    brand: "Fossil",
    location: "Gymnasium",
    occurredAt: "2026-08-22T08:00",
  });
  const strongFound = await createReport(STAFF, {
    reportType: "FOUND",
    title: "Blue Wallet",
    description: "A blue leather wallet with several card slots",
    color: "Blue",
    brand: "Fossil",
    location: "Gymnasium",
    occurredAt: "2026-08-22T09:00",
  });

  const possibleLost = await createReport(STUDENT, {
    reportType: "LOST",
    title: "Silver Ring",
    description: "A small silver ring with a blue gemstone",
    color: "Silver",
    brand: "Pandora",
    location: "Chemistry Building",
    occurredAt: "2026-08-20T10:00",
  });
  const possibleFound = await createReport(STAFF, {
    reportType: "FOUND",
    title: "Ring",
    description: "Found a ring near the chemistry building entrance",
    color: "Silver",
    brand: "Pandora",
    location: "Chemistry Building",
    occurredAt: "2026-08-23T10:00",
  });

  const weakLost = await createReport(STUDENT, {
    reportType: "LOST",
    title: "Green Notebook",
    description: "A green spiral notebook for chemistry class notes",
    color: "Green",
    brand: "Moleskine",
    location: "Chemistry Building",
    occurredAt: "2026-08-10T09:00",
  });
  const weakFound = await createReport(STAFF, {
    reportType: "FOUND",
    title: "Umbrella",
    description: "A black umbrella left near the gym entrance",
    color: "Black",
    brand: "Totes",
    location: "Gymnasium",
    occurredAt: "2026-08-01T09:00",
  });

  console.log("Seeded:", {
    strong: [strongLost.id, strongFound.id],
    possible: [possibleLost.id, possibleFound.id],
    weak: [weakLost.id, weakFound.id],
  });

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const page = await context.newPage();

  async function setActor(userId) {
    await page.goto(APP);
    await page.evaluate((id) => localStorage.setItem("lostfound.actorId", id), userId);
    await page.reload();
    await page.waitForTimeout(400);
  }

  async function shot(name) {
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, name), fullPage: true });
    console.log("captured", name);
  }

  // 01 - public home, no actor
  await page.goto(APP);
  await page.evaluate(() => localStorage.removeItem("lostfound.actorId"));
  await page.reload();
  await shot("01-home-public.png");

  // 02 - home as student
  await setActor(STUDENT);
  await shot("02-home-student-nav.png");

  // 03 - report lost: invalid submission (missing required fields)
  await page.goto(`${APP}/student/report-lost`);
  await page.waitForTimeout(300);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(300);
  await shot("03-report-lost-invalid.png");

  // 04 - report lost: valid submission -> redirects to matches
  await page.fill('#category', CATEGORY).catch(() => {});
  await page.selectOption("#category", CATEGORY).catch(() => {});
  await page.fill("#title", "Report Form Demo Item");
  await page.fill("#description", "A demo item created to show a valid report submission");
  await page.fill("#location", "Student Center");
  await page.fill('input[type="datetime-local"]', "2026-08-24T10:00");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);
  await shot("04-report-lost-valid-redirect-to-matches.png");

  // 05/06/07 - match bands
  await page.goto(`${APP}/matches/${strongLost.id}`);
  await shot("05-match-strong.png");
  await page.goto(`${APP}/matches/${possibleLost.id}`);
  await shot("06-match-possible.png");
  await page.goto(`${APP}/matches/${weakLost.id}`);
  await shot("07-match-weak.png");

  // 08 - confirm the strong match
  await page.goto(`${APP}/matches/${strongLost.id}`);
  await page.waitForTimeout(300);
  await page.click('button:has-text("This is a match")');
  await page.waitForTimeout(400);
  await shot("08-match-confirmed.png");

  // 09 - claim evidence too short
  await page.goto(`${APP}/claims/submit?lostReportId=${strongLost.id}&foundReportId=${strongFound.id}`);
  await page.waitForTimeout(300);
  await page.fill("textarea", "too short");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(400);
  await shot("09-claim-evidence-too-short.png");

  // 10 - claim valid submission (strong)
  await page.fill("textarea", "The wallet has my initials embossed on the inside flap.");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);
  await shot("10-claim-submitted-strong.png");
  const strongClaimUrl = page.url();
  const strongCode = new URL(strongClaimUrl).searchParams.get("code");

  // claim for possible match (for request-info demo)
  await page.goto(`${APP}/claims/submit?lostReportId=${possibleLost.id}&foundReportId=${possibleFound.id}`);
  await page.waitForTimeout(300);
  await page.fill("textarea", "It has a small scratch near the gemstone setting.");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);

  // claim for weak match (for staff-verification-required demo)
  await page.goto(`${APP}/claims/submit?lostReportId=${weakLost.id}&foundReportId=${weakFound.id}`);
  await page.waitForTimeout(300);
  await page.fill("textarea", "My name is written on the inside front cover.");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);

  // switch to staff
  await setActor(STAFF);

  // 11 - staff dashboard
  await page.goto(`${APP}/staff`);
  await shot("11-staff-dashboard.png");

  // find claim review links
  const reviewHrefs = await page.$$eval('a:has-text("Review")', (as) => as.map((a) => a.getAttribute("href")));
  console.log("review links", reviewHrefs);

  async function findClaimReviewByLostTitle(title) {
    for (const href of reviewHrefs) {
      await page.goto(`${APP}${href}`);
      const text = await page.textContent("body");
      if (text.includes(title)) return href;
    }
    return null;
  }

  const strongReviewHref = await findClaimReviewByLostTitle("Blue Wallet");
  const possibleReviewHref = await findClaimReviewByLostTitle("Silver Ring");
  const weakReviewHref = await findClaimReviewByLostTitle("Green Notebook");

  // 12 - pending claim review (strong)
  await page.goto(`${APP}${strongReviewHref}`);
  await shot("12-claim-review-pending.png");

  // 13 - approve with verification checked -> handover panel appears
  await page.check('input[type="checkbox"]');
  await page.click('button:has-text("Approve")');
  await page.waitForTimeout(500);
  await shot("13-claim-approved-handover-panel.png");

  // 14 - handover blocked (button disabled without identity check)
  const handoverBtn = page.locator('button:has-text("Confirm Handover")');
  const isDisabled = await handoverBtn.isDisabled();
  console.log("handover button disabled?", isDisabled);
  await shot("14-handover-blocked-disabled.png");

  // 15 - confirm handover -> completed
  await page.check('input[type="checkbox"]');
  await page.click('button:has-text("Confirm Handover")');
  await page.waitForTimeout(500);
  await shot("15-handover-completed.png");

  // 16 - weak match approval blocked without staff verification
  await page.goto(`${APP}${weakReviewHref}`);
  await page.waitForTimeout(300);
  await page.click('button:has-text("Approve")');
  await page.waitForTimeout(400);
  await shot("16-weak-match-approval-blocked.png");

  // 17 - weak match approved after checking verification
  await page.check('input[type="checkbox"]');
  await page.click('button:has-text("Approve")');
  await page.waitForTimeout(400);
  await shot("17-weak-match-approved-with-verification.png");

  // 24 - request more info (possible match claim)
  await page.goto(`${APP}${possibleReviewHref}`);
  await page.waitForTimeout(300);
  await page.click('button:has-text("Request More Info")');
  await page.waitForTimeout(400);
  await shot("24-claim-info-requested.png");

  // switch back to student for notifications + tracking
  await setActor(STUDENT);

  // 18 - notifications
  await page.goto(`${APP}/notifications`);
  await shot("18-notifications.png");

  // 19 - track claim by code
  await page.goto(`${APP}/claims/track${strongCode ? `?code=${strongCode}` : ""}`);
  await page.waitForTimeout(400);
  if (!strongCode) {
    await page.fill('input[placeholder="CLM-00001"]', "CLM-00001");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(400);
  }
  await shot("19-track-claim.png");

  // 20 - student blocked from /staff
  await page.goto(`${APP}/staff`);
  await page.waitForTimeout(300);
  await shot("20-role-blocked-staff.png");

  // 22/23 - found items browse + detail
  await page.goto(`${APP}/found-items`);
  await shot("22-found-items-browse.png");
  await page.goto(`${APP}/found-items/${strongFound.id}`);
  await shot("23-found-item-detail.png");

  // switch to staff, confirm blocked from /student
  await setActor(STAFF);
  await page.goto(`${APP}/student`);
  await page.waitForTimeout(300);
  await shot("21-role-blocked-student.png");

  await browser.close();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
