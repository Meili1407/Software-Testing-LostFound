const { chromium } = require("playwright");
const path = require("path");

const APP = "http://localhost:5173";
const OUT = path.join(__dirname, "hifi");
const STUDENT = "443d8996-7b6b-4613-a017-31cb63ffd155";
const STAFF = "9e84a61e-2627-48e8-ad36-be5aed7bbf69";

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const page = await context.newPage();

  async function setActor(userId) {
    await page.goto(APP);
    await page.evaluate((id) => localStorage.setItem("lostfound.actorId", id), userId);
    await page.reload();
    await page.waitForTimeout(400);
  }

  async function shot(name, selector) {
    await page.waitForTimeout(350);
    if (selector) {
      await page.locator(selector).screenshot({ path: path.join(OUT, name) });
    } else {
      await page.screenshot({ path: path.join(OUT, name), fullPage: true });
    }
    console.log("captured", name);
  }

  // Home as student (clean)
  await setActor(STUDENT);
  await page.goto(`${APP}/`);
  await shot("home-student.png");

  // Report Lost - clean empty form
  await page.goto(`${APP}/student/report-lost`);
  await shot("report-lost-clean.png");

  // Student Dashboard - populated
  await page.goto(`${APP}/student`);
  await shot("student-dashboard.png");

  // Submit Claim - clean empty-ish form (still auto-fills selects, that's fine/realistic)
  await page.goto(`${APP}/claims/submit`);
  await shot("submit-claim-clean.png");

  // Home as staff (clean)
  await setActor(STAFF);
  await page.goto(`${APP}/`);
  await shot("home-staff.png");

  // Report Found - clean empty form
  await page.goto(`${APP}/staff/report-found`);
  await shot("report-found-clean.png");

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
