const { chromium } = require("playwright");
const path = require("path");

const APP = "http://localhost:5173";
const OUT = path.join(__dirname, "hifi");
const ADMIN = "f931db68-54df-452b-82be-b01fb5922c28";

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const page = await context.newPage();

  await page.goto(APP);
  await page.evaluate((id) => localStorage.setItem("lostfound.actorId", id), ADMIN);
  await page.reload();
  await page.waitForTimeout(400);

  await page.goto(`${APP}/`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, "home-admin.png"), fullPage: true });
  console.log("captured home-admin.png");

  await page.goto(`${APP}/staff`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, "staff-dashboard-admin.png"), fullPage: true });
  console.log("captured staff-dashboard-admin.png");

  await page.goto(`${APP}/admin/audit-log`);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, "audit-log.png"), fullPage: true });
  console.log("captured audit-log.png");

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
