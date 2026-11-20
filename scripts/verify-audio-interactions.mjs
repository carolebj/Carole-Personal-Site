// Local-only event recipe. Disconnects test output, never sends forms or changes remote data.
import assert from "node:assert/strict";
import { chromium } from "playwright";

const url = "http://127.0.0.1:5194/";
const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({ locale: "fr-FR", viewport: { width: 1280, height: 850 } });
await context.addInitScript(() => {
  localStorage.setItem("portfolio-haptics", "on");
  window.audioEvents = [];
  const Native = window.AudioContext;
  window.AudioContext = class extends Native {
    createOscillator() {
      const oscillator = super.createOscillator();
      const set = oscillator.frequency.setValueAtTime.bind(oscillator.frequency);
      const start = oscillator.start.bind(oscillator);
      let frequency;
      oscillator.frequency.setValueAtTime = (value, time) => { frequency = value; return set(value, time); };
      oscillator.start = time => { window.audioEvents.push(frequency); return start(time); };
      return oscillator;
    }
    createGain() {
      const gain = super.createGain(), connect = gain.connect.bind(gain);
      gain.connect = (destination, ...args) => destination === this.destination ? undefined : connect(destination, ...args);
      return gain;
    }
  };
  HTMLMediaElement.prototype.play = () => Promise.resolve();
});
let page = await context.newPage();
page.setDefaultTimeout(15000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const events = () => page.evaluate(() => window.audioEvents.splice(0));
const settle = () => page.waitForTimeout(240);
const expect = async (name, frequencies) => {
  await settle(); const actual = await events(); assert.deepEqual(actual, frequencies, name); console.log("PASS", name, actual);
};
try {
  await page.goto(url);
  await page.locator("#services-menu-trigger").waitFor();
  await expect("no autoplay", []);
  await page.mouse.click(10, 400);
  await expect("decorative heading is silent", []);
  await page.locator("#services-menu-trigger").hover();
  await expect("hover opens services once", [330]);
  await page.locator("#services-menu-trigger span").last().hover();
  await expect("hover inside same trigger is silent", []);
  await page.locator("nav a[aria-expanded]").hover();
  await expect("switch menus closes then opens", [440, 330]);
  await page.mouse.move(1200, 500);
  await page.waitForTimeout(180);
  await expect("pointer exit closes", [440]);
  await page.locator("#services-menu-trigger").focus();
  await page.keyboard.press("Enter");
  await expect("keyboard opens menu", [330]);
  await page.locator("#services-mega-menu a").first().click();
  await expect("selection without extra close", [590]);

  await page.goto(url);
  await page.locator("#services a").first().waitFor();
  await page.locator("#services a").first().click();
  await expect("interactive service card click", [345]);
  await page.locator("footer a[href='/services']").first().click();
  await expect("footer navigation click", [345]);
  await page.locator("footer button[aria-pressed='false']").first().click();
  await expect("footer language choice", [590]);
  await page.locator("footer button[aria-pressed='false']").first().click();
  await page.locator("footer button[aria-pressed='false']").first().click();
  await expect("two independent fast choices are both retained", [590, 590]);

  // A fresh tab avoids ScrollRestoration restoring the previous footer position.
  await page.close();
  page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 850 });
  await page.goto(url);
  await settle();
  await page.getByRole("button", { name: /Ouvrir le menu|Open menu/ }).click();
  await expect("mobile menu opens without click duplicate", [330]);
  await page.locator("button[aria-controls='mobile-services-panel']").click();
  await expect("mobile accordion opens", [330]);
  await page.locator("#mobile-services-panel a").first().click();
  await expect("mobile selection closes both panels without duplicates", [590]);

  await page.close();
  page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(url);
  await settle();
  await page.locator("a[aria-label='Carole Tonoukouen']").click({ button: "right" });
  await expect("context menu opens", [330]);
  await page.getByRole("switch").click();
  await expect("mute is silent", []);
  assert.equal(await page.evaluate(() => localStorage.getItem("portfolio-haptics")), "off");
  await page.locator("nav a[data-sound='primary']").first().click();
  await expect("muted primary is silent", []);
  await page.reload();
  // addInitScript intentionally resets the isolated preference for this next check.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("nav a[data-sound='primary']").first().click();
  await expect("reduced-motion primary is silent", []);
  assert.deepEqual(errors, []);
  console.log("PASS no page errors; output disconnected throughout");
} finally { await browser.close(); }
