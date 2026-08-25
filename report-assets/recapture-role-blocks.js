const { chromium } = require("playwright");
const path = require("path");

const APP = "http://localhost:5173";
const OUT = path.join(__dirname, "screenshots");
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

  async function shot(name) {
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, name), fullPage: true });
    console.log("captured", name);
  }

  await setActor(STUDENT);
  await page.goto(`${APP}/staff`);
  await shot("20-role-blocked-staff.png");

  await setActor(STAFF);
  await page.goto(`${APP}/student`);
  await shot("21-role-blocked-student.png");

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
