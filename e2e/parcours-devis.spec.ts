import { expect, test } from "@playwright/test";
import path from "node:path";

async function enterDemo(page: import("@playwright/test").Page) {
  await page.goto("/connexion");
  const enter = page.getByRole("button", {
    name: /Entrer dans l’espace|Entrer dans l'espace/,
  });
  const dash = page.getByRole("heading", { name: /Martin Automatismes|Tableau/i });
  const createHeading = page.getByRole("heading", { name: "Créer un devis" });
  await Promise.race([
    dash.waitFor({ state: "visible", timeout: 20_000 }).catch(() => null),
    createHeading.waitFor({ state: "visible", timeout: 20_000 }).catch(() => null),
    (async () => {
      await enter.waitFor({ state: "visible", timeout: 10_000 });
      await enter.click().catch(async () => {
        await page.waitForURL(/\/app/, { timeout: 20_000 });
      });
    })(),
  ]);
  await page.waitForURL(/\/app/, { timeout: 20_000 });
}

test.describe("Parcours devis DevisRapide IA V2", () => {
  test("parcours 3 étapes → PDF", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("DevisRapide IA").first()).toBeVisible();
    await page.getByRole("link", { name: "Créer un devis" }).click();
    await enterDemo(page);

    await page.goto("/app/creer");
    await expect(page.getByRole("heading", { name: "Créer un devis" })).toBeVisible();

    await page.getByLabel(/Décrivez ou dictez/).fill(
      "Fais-moi un devis pour Monsieur Martin, avec 2 moteurs référence MOT123, 4 télécommandes TEL456, 5 heures de pose et 150 € de déplacement.",
    );
    await page.getByRole("button", { name: "Préparer le devis" }).click();

    await expect(page.getByText(/D-20/)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("997,92 €", { exact: true }).first()).toBeVisible();

    await page.getByRole("button", { name: "Valider" }).click();
    const downloadPromise = page.waitForEvent("download", { timeout: 20_000 });
    await page.getByRole("button", { name: /PDF/i }).click();
    const download = await downloadPromise;
    const fileName = await download.suggestedFilename();
    await download.saveAs(path.join("/tmp", fileName));
    expect(fileName.endsWith(".pdf")).toBeTruthy();
  });

  test("assistant refuse référence inconnue", async ({ page }) => {
    await enterDemo(page);
    await page.goto("/app/assistant");
    await expect(page.getByRole("heading", { name: "Assistant devis" })).toBeVisible({
      timeout: 15_000,
    });
    await page
      .getByLabel(/Message à l’assistant|Message à l'assistant/)
      .fill("Devis pour Monsieur Martin avec 1 référence XYZ999");
    await page.getByRole("button", { name: "Envoyer" }).click();
    await expect(
      page.locator(".bg-\\[color\\:var\\(--chip\\)\\], .bg-\\[color\\:var\\(--chip\\)\\]").filter({ hasText: /XYZ999|introuvable|invente/i }).first(),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/invente jamais/i).first()).toBeVisible();
  });
});
