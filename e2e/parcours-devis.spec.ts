import { expect, test } from "@playwright/test";
import path from "node:path";

async function enterDemo(page: import("@playwright/test").Page) {
  await page.goto("/connexion");
  // Auto-sync peut rediriger ; sinon on clique
  const enter = page.getByRole("button", {
    name: /Entrer dans l’espace|Entrer dans l'espace/,
  });
  const assistant = page.getByRole("heading", { name: "Assistant devis" });
  await Promise.race([
    assistant.waitFor({ state: "visible", timeout: 20_000 }),
    (async () => {
      await enter.waitFor({ state: "visible", timeout: 10_000 });
      await enter.click({ trial: false }).catch(async () => {
        // Bouton détaché si redirection déjà en cours
        await assistant.waitFor({ state: "visible", timeout: 20_000 });
      });
    })(),
  ]);
  await expect(assistant).toBeVisible({ timeout: 20_000 });
}

test.describe("Parcours devis DevisRapide IA", () => {
  test("accueil → connexion → devis → aperçu → PDF", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("DevisRapide IA").first()).toBeVisible();
    await page.getByRole("link", { name: "Essayer la démo" }).click();
    await enterDemo(page);

    await page
      .getByRole("button", { name: /exemple du cahier des charges/i })
      .click();
    await page.getByRole("button", { name: "Envoyer" }).click();

    await expect(page.getByText(/brouillon de devis/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("997,92 €", { exact: true }).first()).toBeVisible({
      timeout: 10_000,
    });

    const downloadPromise = page.waitForEvent("download", { timeout: 20_000 });
    await page.getByRole("button", { name: /Valider le devis|Devis déjà validé/ }).first().click();
    await page.getByRole("button", { name: /Exporter en PDF/i }).first().click();
    const download = await downloadPromise;
    const fileName = await download.suggestedFilename();
    const filePath = path.join("/tmp", fileName);
    await download.saveAs(filePath);
    expect(fileName.endsWith(".pdf")).toBeTruthy();
  });

  test("référence inconnue : pas d’invention", async ({ page }) => {
    await enterDemo(page);
    await page
      .getByLabel(/Message à l’assistant|Message à l'assistant/)
      .fill("Devis pour Monsieur Martin avec 1 référence XYZ999");
    await page.getByRole("button", { name: "Envoyer" }).click();
    await expect(page.getByText(/XYZ999/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/invente/i)).toBeVisible();
  });
});
