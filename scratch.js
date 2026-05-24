import { chromium } from 'playwright';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173'); // Adjust port if needed
  await page.waitForTimeout(2000);
  const comments = await page.innerHTML('.tt-item-reply');
  console.log(comments);
  await browser.close();
})();
