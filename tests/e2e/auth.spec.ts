import { expect, test, type Page } from "@playwright/test";

import { readEnvValue } from "./helpers/env";
import {
  confirmAuthUserEmail,
  createConfirmedUser,
  deleteAuthUserByEmail,
  findAuthUserByEmail,
  getPublicProfileRow,
} from "./helpers/supabase-admin";

const GOOGLE_TEST_EMAIL = readEnvValue("E2E_GOOGLE_TEST_EMAIL");
const GOOGLE_TEST_PASSWORD = readEnvValue("E2E_GOOGLE_TEST_PASSWORD");

function createRandomEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@mailinator.com`;
}

async function loginWithEmail(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("Parcours d'authentification", () => {
  test("redirige le dashboard vers login sans session", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fdashboard/);
    await expect(
      page.getByRole("heading", { name: "Connexion" })
    ).toBeVisible();
  });

  test("inscription email/password puis creation du profil public.users", async ({
    page,
  }) => {
    const email = createRandomEmail("minealert-signup");
    const password = "MineAlert!12345";
    const fullName = "E2E Signup";

    try {
      let createdAuthUser = await findAuthUserByEmail(email);

      await page.goto("/register");
      await page.getByLabel("Nom complet").fill(fullName);
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Mot de passe").fill(password);
      await page.getByRole("checkbox").check();
      await page.getByRole("button", { name: "Creer mon compte" }).click();

      const confirmationMessage = page.getByText(
        "Compte cree. Verifiez votre email puis revenez vous connecter."
      );
      const rateLimitMessage = page.getByText(/rate limit/i);

      await expect
        .poll(
          async () =>
            page.url().match(/\/(login|dashboard)/)?.[0] ??
            (await confirmationMessage.isVisible().catch(() => false)
              ? "confirmation"
              : null) ??
            (await rateLimitMessage.isVisible().catch(() => false)
              ? "rate-limit"
              : null),
          {
            timeout: 10_000,
            message:
              "L'inscription doit soit naviguer, soit afficher un message de confirmation, soit signaler le rate-limit Supabase.",
          }
        )
        .not.toBeNull();

      if (await rateLimitMessage.isVisible().catch(() => false)) {
        createdAuthUser = await createConfirmedUser({
          email,
          password,
          fullName,
        });
        await loginWithEmail(page, email, password);
      }

      await expect
        .poll(async () => {
          createdAuthUser = await findAuthUserByEmail(email);
          return Boolean(createdAuthUser);
        }, {
          message: "Le user Auth doit etre cree par le formulaire d'inscription.",
        })
        .toBeTruthy();

      if (!createdAuthUser) {
        throw new Error("Impossible de recuperer le user Auth cree.");
      }

      await confirmAuthUserEmail(createdAuthUser.id);

      if (!page.url().includes("/dashboard")) {
        await loginWithEmail(page, email, password);
      }

      await expect(page).toHaveURL(/\/dashboard/);

      await expect
        .poll(() => getPublicProfileRow(createdAuthUser.id), {
          message: "Le profil public.users doit etre bootstrappe apres premiere session.",
        })
        .toMatchObject({
          id: createdAuthUser.id,
          email,
          full_name: fullName,
        });
    } finally {
      await deleteAuthUserByEmail(email);
    }
  });

  test("connexion email/password puis redirection dashboard", async ({ page }) => {
    const email = createRandomEmail("minealert-login");
    const password = "MineAlert!12345";
    const fullName = "E2E Login";

    try {
      const authUser = await createConfirmedUser({
        email,
        password,
        fullName,
      });

      await loginWithEmail(page, email, password);

      await expect(page.getByText("Dashboard").first()).toBeVisible();

      await expect
        .poll(() => getPublicProfileRow(authUser.id))
        .toMatchObject({
          id: authUser.id,
          email,
          full_name: fullName,
        });
    } finally {
      await deleteAuthUserByEmail(email);
    }
  });

  test("deconnexion puis retour login", async ({ page }) => {
    const email = createRandomEmail("minealert-logout");
    const password = "MineAlert!12345";
    const fullName = "E2E Logout";

    try {
      await createConfirmedUser({
        email,
        password,
        fullName,
      });

      await loginWithEmail(page, email, password);
      await Promise.all([
        page.waitForURL(/\/login/, { timeout: 10_000 }),
        page.getByTestId("sign-out-button").click(),
      ]);

      await expect(page).toHaveURL(/\/login/);
      await expect(
        page.getByRole("heading", { name: "Connexion" })
      ).toBeVisible();
    } finally {
      await deleteAuthUserByEmail(email);
    }
  });

  test("connexion Google puis redirection dashboard", async ({ page }) => {
    test.skip(
      !GOOGLE_TEST_EMAIL || !GOOGLE_TEST_PASSWORD,
      "Renseignez E2E_GOOGLE_TEST_EMAIL et E2E_GOOGLE_TEST_PASSWORD pour activer ce test."
    );

    await page.goto("/login");
    await page.getByTestId("google-auth-button").click();
    await page.waitForURL(/accounts\.google\.com/, { timeout: 60_000 });

    const emailInput = page.locator('input[type="email"]');

    if (await emailInput.count()) {
      await emailInput.first().fill(GOOGLE_TEST_EMAIL!);
      await page.getByRole("button", { name: /suivant|next/i }).click();
    }

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.first().waitFor({ state: "visible", timeout: 60_000 });
    await passwordInput.first().fill(GOOGLE_TEST_PASSWORD!);
    await page.getByRole("button", { name: /suivant|next/i }).click();

    const consentButton = page.getByRole("button", {
      name: /continuer|continue|autoriser|allow/i,
    });

    if (await consentButton.count()) {
      await consentButton.first().click();
    }

    await page.waitForURL(/\/dashboard/, { timeout: 120_000 });
    await expect(page.getByText("Dashboard").first()).toBeVisible();
  });
});
