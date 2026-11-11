import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.BASE_URL || "http://127.0.0.1:3000";
await mkdir("/opt/cursor/artifacts", { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(base);
await page.screenshot({
  path: "/opt/cursor/artifacts/cycle1-accueil.png",
  fullPage: true,
});
await page.getByRole("link", { name: "Essayer la démo" }).click();
await page.waitForURL(/connexion|app/);
const assistant = page.getByRole("heading", { name: "Assistant devis" });
if (!(await assistant.isVisible().catch(() => false))) {
  const enter = page.getByRole("button", { name: /Entrer/ });
  if (await enter.isVisible().catch(() => false)) {
    await enter.click({ timeout: 5000 }).catch(() => {});
  }
}
await assistant.waitFor({ timeout: 20000 });
await page.screenshot({
  path: "/opt/cursor/artifacts/cycle1-assistant.png",
  fullPage: true,
});
await page.getByRole("button", { name: /exemple/i }).click();
await page.getByRole("button", { name: "Envoyer" }).click();
await page.getByText("997,92 €", { exact: true }).first().waitFor();
await page.screenshot({
  path: "/opt/cursor/artifacts/cycle1-devis-apercu.png",
  fullPage: true,
});
await browser.close();
console.log("captures OK");
