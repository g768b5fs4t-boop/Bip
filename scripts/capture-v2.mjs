import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.BASE_URL || "http://127.0.0.1:3000";
await mkdir("/opt/cursor/artifacts", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

await page.goto(base);
await page.screenshot({ path: "/opt/cursor/artifacts/v2-accueil-mobile.png", fullPage: true });

await page.getByRole("link", { name: "Créer un devis" }).click();
await page.waitForURL(/connexion|app/);
const enter = page.getByRole("button", { name: /Entrer/ });
if (await enter.isVisible().catch(() => false)) {
  await enter.click({ timeout: 3000 }).catch(() => {});
}
await page.waitForURL(/\/app/, { timeout: 20000 });
await page.screenshot({ path: "/opt/cursor/artifacts/v2-dashboard-mobile.png", fullPage: true });

await page.goto(`${base}/app/creer`);
await page.getByRole("heading", { name: "Créer un devis" }).waitFor();
await page.screenshot({ path: "/opt/cursor/artifacts/v2-creer-etape1.png", fullPage: true });

await page.getByLabel(/Décrivez ou dictez/).fill(
  "Fais-moi un devis pour Monsieur Martin, avec 2 moteurs référence MOT123, 4 télécommandes TEL456, 5 heures de pose et 150 € de déplacement.",
);
await page.getByRole("button", { name: "Préparer le devis" }).click();
await page.getByText("997,92 €", { exact: true }).first().waitFor({ timeout: 20000 });
await page.screenshot({ path: "/opt/cursor/artifacts/v2-creer-etape2.png", fullPage: true });

await browser.close();
console.log("v2 captures OK");
