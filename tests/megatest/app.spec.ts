import { expect, test, type Page } from "@playwright/test";

import { ENV, PASSWORD, admin, createConfirmedUser, deleteUserByEmail, firstLink, login, randomEmail, signedInClient, waitForMail } from "./helpers";

const LOCALES = process.env.MT_EN === "1" ? [{ id: "fr", prefix: "" }, { id: "en", prefix: "/en" }] : [{ id: "fr", prefix: "" }];
const FRENCH_WORDS = /\b(votre|vos|créer|Créer|alertes?|gratuit|Mon plan|Connexion|Se connecter|Inscription|Paramètres|Actualités|Minerais|Abonnement|résumé)\b/;
const created: string[] = [];

test.afterAll(async () => {
  for (const email of created) await deleteUserByEmail(email);
});

/** Collecte les erreurs console et les réponses 5xx pendant un parcours. */
function watch(page: Page) {
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error" && !/favicon|Failed to load resource.*(401|404)|hydrat|Falling back to browser navigation/i.test(message.text())) problems.push(`console: ${message.text().slice(0, 140)}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 500) problems.push(`HTTP ${response.status()} ${response.url()}`);
  });
  return problems;
}

for (const { id, prefix } of LOCALES) {
  test.describe(`Pages publiques (${id})`, () => {
    test(`[PUB-1-${id}|3pts] landing : cours en direct, deux plans, aucun cours périmé, pas d'erreur`, async ({ page }) => {
      const problems = watch(page);
      await page.goto(`${prefix}/`);
      await expect(page.locator("h1")).toBeVisible();
      const html = await page.content();
      expect(html).toMatch(/[1-9][ ,.  ]?\d{3}[.,]\d{2}/); // cours de l'or, selon le format de la locale
      expect(html).not.toMatch(/1[ ,.]?954[.,]30/); // ancien prix fictif
      await expect(page.getByText(/9[,.]99/).first()).toBeVisible();
      expect(problems).toEqual([]);
    });

    test(`[PUB-2-${id}|3pts] tous les liens internes de la landing répondent (aucun 404)`, async ({ page, request }) => {
      await page.goto(`${prefix}/`);
      const hrefs = await page.$$eval("a[href]", (anchors) => anchors.map((a) => a.getAttribute("href") as string));
      const internal = [...new Set(hrefs.filter((href) => href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/api")))];
      const broken: string[] = [];
      for (const href of internal) {
        const response = await request.get(`${ENV.base}${href}`, { maxRedirects: 5 });
        if (response.status() >= 400) broken.push(`${href} → ${response.status()}`);
      }
      expect(broken).toEqual([]);
    });

    test(`[PUB-3-${id}|2pts] login et inscription affichent leurs champs`, async ({ page }) => {
      for (const path of ["/login", "/register"]) {
        await page.goto(`${prefix}${path}`);
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
      }
    });

    test(`[PUB-4-${id}|2pts] dashboard sans session redirige vers la connexion dans la bonne langue`, async ({ page }) => {
      await page.goto(`${prefix}/dashboard`);
      await expect(page).toHaveURL(new RegExp(`${prefix}/login\\?redirectTo=`));
    });

    test(`[PUB-5-${id}|2pts] page inexistante : 404 propre`, async ({ request }) => {
      const response = await request.get(`${ENV.base}${prefix}/cette-page-n-existe-pas`);
      expect(response.status()).toBe(404);
    });
  });

  test.describe(`Inscription, connexion et parcours complet (${id})`, () => {
    test(`[AUTH-1-${id}|6pts] inscription → e-mail de confirmation → connexion → profil gratuit créé → déconnexion → reconnexion`, async ({ page }) => {
      const problems = watch(page);
      const email = randomEmail(`reg${id}`);
      created.push(email);

      await page.goto(`${prefix}/register`);
      await page.locator('input[type="text"]').first().fill("Parcours Complet");
      await page.locator('input[type="email"]').fill(email);
      await page.locator('input[type="password"]').fill(PASSWORD);
      await page.locator('input[type="checkbox"]').check();
      await page.locator('button[type="submit"]').click();

      const mail = await waitForMail(email, 30000);
      const confirmUrl = firstLink(mail.html, "/auth/v1/verify");
      await page.goto(confirmUrl);
      await page.waitForURL(/dashboard|login/, { timeout: 30000 });

      if (!/dashboard/.test(page.url())) await login(page, email, prefix);
      await expect(page).toHaveURL(/dashboard/);

      // profil créé, plan gratuit
      await expect.poll(async () => (await admin().from("users").select("plan").eq("email", email).maybeSingle()).data?.plan, { timeout: 15000 }).toBe("free");

      // déconnexion puis reconnexion
      await page.context().clearCookies();
      await page.goto(`${prefix}/dashboard`);
      await expect(page).toHaveURL(/login/);
      await login(page, email, prefix);
      await expect(page).toHaveURL(/dashboard/);
      expect(problems).toEqual([]);
    });

    test(`[AUTH-2-${id}|2pts] mot de passe erroné : message d'erreur, pas de connexion`, async ({ page }) => {
      const email = randomEmail(`bad${id}`);
      created.push(email);
      await createConfirmedUser(email);
      await page.goto(`${prefix}/login`);
      await page.locator('input[type="email"]').fill(email);
      await page.locator('input[type="password"]').fill("mauvais-mot-de-passe");
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(2500);
      await expect(page).toHaveURL(/login/);
      await expect(page.locator('[role="alert"], .text-rose-700, .text-red-600, .text-red-700').first()).toBeVisible();
    });

    test(`[AUTH-3-${id}|2pts] redirection ouverte refusée : redirectTo vers un site externe est ignoré`, async ({ page }) => {
      const email = randomEmail(`redir${id}`);
      created.push(email);
      await createConfirmedUser(email);
      await page.goto(`${prefix}/login?redirectTo=//evil.example.com/x`);
      await page.locator('input[type="email"]').fill(email);
      await page.locator('input[type="password"]').fill(PASSWORD);
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(4000);
      expect(new URL(page.url()).hostname).not.toBe("evil.example.com");
      const callback = await page.request.get(`${ENV.base}/auth/callback?code=x&next=//evil.example.com`, { maxRedirects: 0 });
      expect(callback.headers().location ?? "").not.toMatch(/evil\.example\.com/);
    });

    test(`[APP-1-${id}|8pts] tableau de bord : pages, alerte créée puis supprimée, limite du plan, dépôts, risque pays, plan`, async ({ page }) => {
      const problems = watch(page);
      const email = randomEmail(`app${id}`);
      created.push(email);
      const user = await createConfirmedUser(email, "App Test");
      const userClient = await signedInClient(email);
      await userClient.from("users").insert({ id: user.id, email, full_name: "App Test" });
      await login(page, email, prefix);

      for (const path of ["/dashboard", "/dashboard/minerais", "/dashboard/actualites", "/dashboard/alertes", "/dashboard/depots", "/dashboard/risque-pays", "/dashboard/plan", "/dashboard/carte", "/dashboard/profil", "/dashboard/parametres"]) {
        const response = await page.goto(`${prefix}${path}`);
        expect(response?.status(), path).toBeLessThan(400);
        await page.waitForLoadState("networkidle");
        await expect(page.locator("body")).not.toContainText(/Application error|Internal Server Error|undefined|NaN/);
      }

      // cours visibles sur la page minerais, sans lithium/nickel (pas de source en direct)
      await page.goto(`${prefix}/dashboard/minerais`);
      await page.waitForLoadState("networkidle");
      const minerals = await page.locator("body").innerText();
      expect(minerals).toMatch(/[1-9][ ,.  ]?\d{3}/);
      expect(minerals).not.toMatch(/Lithium|Nickel/);

      // dépôts et risque pays : données présentes
      await page.goto(`${prefix}/dashboard/depots`);
      await expect(page.locator("body")).toContainText(/Newmont/);
      await page.goto(`${prefix}/dashboard/risque-pays`);
      await expect(page.locator("body")).toContainText(/Congo/);

      // plan : liens de paiement avec la référence de l'utilisateur
      await page.goto(`${prefix}/dashboard/plan`);
      const checkout = await page.$$eval('a[href*="buy.stripe.com"]', (anchors) => anchors.map((a) => a.getAttribute("href") as string));
      expect(checkout.length).toBe(2);
      for (const href of checkout) {
        const url = new URL(href);
        expect(url.searchParams.get("client_reference_id")).toBe(user.id);
        expect(url.searchParams.get("prefilled_email")).toBe(email);
      }

      // alerte : création via l'API de l'application, vérifiée en base, puis suppression
      await page.goto(`${prefix}/dashboard/alertes`);
      const firstAlert = await page.request.post(`${ENV.base}/api/alertes`, { data: { mineralId: "mineral-xau", type: "price_above", threshold: 4500, currency: "USD" } });
      expect(firstAlert.status()).toBe(201);
      const { count } = await admin().from("user_alerts").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      expect(count).toBe(1);
      await page.reload();
      await expect(page.locator("body")).toContainText(/4[ ,.  ]?500/);

      // limite : la 6e alerte est refusée avec un message
      for (let i = 0; i < 4; i += 1) await page.request.post(`${ENV.base}/api/alertes`, { data: { mineralId: "mineral-xau", type: "price_above", threshold: 4600 + i, currency: "USD" } });
      const sixth = await page.request.post(`${ENV.base}/api/alertes`, { data: { mineralId: "mineral-xau", type: "price_above", threshold: 5000, currency: "USD" } });
      expect(sixth.status()).toBe(400);
      expect(((await sixth.json()) as { error?: string }).error ?? "").not.toBe("");

      const alerts = (await admin().from("user_alerts").select("id").eq("user_id", user.id)).data ?? [];
      const removed = await page.request.delete(`${ENV.base}/api/alertes`, { data: { id: alerts[0].id } });
      expect(removed.status()).toBe(200);
      expect(problems).toEqual([]);
    });

    test(`[ENG-1-${id}|6pts] moteur d'alertes : une alerte franchie crée un événement visible dans l'historique et aucune alerte sur un cours périmé`, async ({ page, request }) => {
      const email = randomEmail(`eng${id}`);
      created.push(email);
      const user = await createConfirmedUser(email);
      const userClient = await signedInClient(email);
      await userClient.from("users").insert({ id: user.id, email, full_name: "Eng" });
      await admin().from("user_alerts").insert([
        { user_id: user.id, mineral_id: "mineral-xau", type: "price_below", threshold: 99999 }, // franchie
        { user_id: user.id, mineral_id: "mineral-li", type: "price_below", threshold: 99999 }, // lithium : cours périmé, ne doit PAS déclencher
      ]);
      await admin().from("job_runs").update({ last_run: "1970-01-01T00:00:00Z" }).eq("name", "alerts");
      const tick = await request.get(`${ENV.base}/api/jobs/tick`, { headers: { authorization: `Bearer ${ENV.tickToken}` } });
      expect(tick.status()).toBe(200);
      const events = (await admin().from("alert_events").select("title").eq("user_id", user.id)).data ?? [];
      expect(events).toHaveLength(1);
      expect(events[0].title).toMatch(/99[ ,.  ]?999/);
      await login(page, email, prefix);
      await page.goto(`${prefix}/dashboard/alertes/historique`);
      await expect(page.locator("body")).toContainText(/99[ ,.  ]?999/);
    });
  });

  if (id === "en") {
    test.describe("Anglais : aucun français résiduel", () => {
      test("[EN-1|6pts] pages publiques et dashboard en anglais sans mots français courants", async ({ page }) => {
        const email = randomEmail("enclean");
        created.push(email);
        const user = await createConfirmedUser(email);
        const userClient = await signedInClient(email);
        await userClient.from("users").insert({ id: user.id, email, full_name: "En Clean" });
        const leaks: string[] = [];
        for (const path of ["/", "/login", "/register"]) {
          await page.goto(`/en${path}`);
          await page.waitForLoadState("networkidle");
          const text = await page.locator("body").innerText();
          const hit = text.match(FRENCH_WORDS);
          if (hit) leaks.push(`/en${path}: ${hit[0]}`);
        }
        await login(page, email, "/en");
        for (const path of ["/dashboard", "/dashboard/minerais", "/dashboard/alertes", "/dashboard/depots", "/dashboard/risque-pays", "/dashboard/plan", "/dashboard/profil", "/dashboard/parametres"]) {
          await page.goto(`/en${path}`);
          await page.waitForLoadState("networkidle");
          const text = await page.locator("body").innerText();
          const hit = text.match(FRENCH_WORDS);
          if (hit) leaks.push(`/en${path}: ${hit[0]}`);
        }
        expect(leaks).toEqual([]);
        expect(await page.locator("html").getAttribute("lang")).toBe("en");
      });
    });
  }
}
