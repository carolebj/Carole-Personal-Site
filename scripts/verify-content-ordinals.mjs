// Local render checks only; no CMS writes, external navigation or form submission.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const url = process.env.CONTENT_REVIEW_URL ?? "http://127.0.0.1:5196/";
assert.match(url, /^http:\/\/(?:127\.0\.0\.1|localhost):\d+\/$/);
const output = process.env.CONTENT_REVIEW_OUTPUT;
if (output) await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
try {
  for (const locale of ["fr-FR", "en-US"]) for (const width of [1280, 390]) {
    const context = await browser.newContext({ locale, viewport: { width, height: 900 } });
    await context.addInitScript(() => localStorage.setItem("portfolio-haptics", "off"));
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(url);
    const checkMenu = async (selector, name) => {
      // Existing mobile height transitions last 240 ms; inspect the settled layout.
      await page.waitForTimeout(350);
      const result = await page.locator(selector).evaluateAll(elements => elements.map(element => {
        const style = getComputedStyle(element), box = element.getBoundingClientRect();
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) if (node.textContent.trim()) break;
        const range = document.createRange();
        if (node) range.selectNodeContents(node);
        return { text: element.textContent.trim(), x: node ? range.getBoundingClientRect().x : null, expectedX: box.x + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft), standaloneOrdinals: Array.from(element.querySelectorAll("span")).filter(span => /^\s*0\d\s*$/.test(span.textContent)).length };
      }));
      assert.ok(result.length >= 2, name);
      for (const item of result) {
        assert.ok(!/^0\d\s/.test(item.text), item.text);
        assert.equal(item.standaloneOrdinals, 0);
        assert.ok(Math.abs(item.x - item.expectedX) < 2, `${name}: empty number gutter ${item.x}/${item.expectedX}`);
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      console.log("PASS", locale, width, name, result.length, "labels, aligned and unnumbered");
    };
    if (width > 1000) {
      await page.locator("#services-menu-trigger").hover();
      await checkMenu("#services-mega-menu a[href^='/services/']:not([href*='brief'])", "services menu");
      if (output) await page.screenshot({ path: `${output}/${locale}-${width}-services.png` });
      await page.locator("nav a[aria-expanded]").hover();
      await checkMenu("[data-sound-dropdown='carnet'] li a", "carnet menu");
      if (output) await page.screenshot({ path: `${output}/${locale}-${width}-carnet.png` });
    } else {
      await page.getByRole("button", { name: /Ouvrir le menu|Open menu/ }).click();
      await page.locator("button[aria-controls='mobile-services-panel']").click();
      await checkMenu("#mobile-services-panel a[href^='/services/']:not([href*='brief'])", "mobile services");
      if (output) await page.screenshot({ path: `${output}/${locale}-${width}-services.png` });
      const carnet = page.locator("[data-sound-dropdown='mobile'] button[aria-expanded]").last();
      await carnet.click();
      await checkMenu("[data-sound-dropdown='mobile-carnet'] a", "mobile carnet");
      if (output) await page.screenshot({ path: `${output}/${locale}-${width}-carnet.png` });
    }
    await page.goto(new URL("services", url).href);
    assert.equal(await page.locator("#main-content").evaluate(element => Array.from(element.querySelectorAll("span,p,a")).some(node => /^\s*0\d\s*$/.test(node.textContent))), false);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.goto(new URL("services/strategie-editoriale", url).href);
    assert.equal(await page.locator("#main-content").evaluate(element => Array.from(element.querySelectorAll("span,p")).some(node => /^\s*0\d\s*$/.test(node.textContent))), false);
    assert.deepEqual(errors, []);
    console.log("PASS", locale, width, "Services pages and no page errors");
    await context.close();
  }
} finally { await browser.close(); }
