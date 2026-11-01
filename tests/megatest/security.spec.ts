import { expect, test } from "@playwright/test";

import { ENV, admin, createConfirmedUser, deleteUserByEmail, randomEmail, signedInClient, stripeSignature } from "./helpers";

const emails: string[] = [];

test.afterAll(async () => {
  for (const email of emails) await deleteUserByEmail(email);
});

async function userWithProfile(prefix: string) {
  const email = randomEmail(prefix);
  emails.push(email);
  const user = await createConfirmedUser(email, "Sec Test");
  const client = await signedInClient(email);
  const { error } = await client.from("users").insert({ id: user.id, email, full_name: "Sec Test" });
  if (error) throw new Error(`profil: ${error.message}`);
  return { email, user, client };
}

test.describe("Sécurité base de données (clé publique, comme un vrai navigateur)", () => {
  test("[SEC-1|5pts] un utilisateur ne peut pas s'auto-attribuer le plan Pro ni des champs Stripe", async () => {
    const { user, client } = await userWithProfile("sec1");
    await client.from("users").update({ plan: "pro", stripe_customer_id: "cus_FAKE", stripe_subscription_id: "sub_FAKE" }).eq("id", user.id);
    const { data } = await admin().from("users").select("plan,stripe_customer_id,stripe_subscription_id").eq("id", user.id).single();
    expect(data).toEqual({ plan: "free", stripe_customer_id: null, stripe_subscription_id: null });
  });

  test("[SEC-2|3pts] un nouveau profil ne peut pas être créé directement en plan Business", async () => {
    const email = randomEmail("sec2");
    emails.push(email);
    const user = await createConfirmedUser(email);
    const client = await signedInClient(email);
    await client.from("users").insert({ id: user.id, email, full_name: "X", plan: "business" });
    const { data } = await admin().from("users").select("plan").eq("id", user.id).single();
    expect(data?.plan).toBe("free");
  });

  test("[SEC-3|4pts] la limite d'alertes du plan gratuit (5) est imposée par la base", async () => {
    const { user, client } = await userWithProfile("sec3");
    let refused = 0;
    for (let i = 0; i < 8; i += 1) {
      const { error } = await client.from("user_alerts").insert({ user_id: user.id, mineral_id: "mineral-xau", type: "price_above", threshold: 5000 + i });
      if (error) refused += 1;
    }
    const { count } = await admin().from("user_alerts").select("*", { count: "exact", head: true }).eq("user_id", user.id);
    expect(count).toBe(5);
    expect(refused).toBe(3);
  });

  test("[SEC-4|4pts] isolation : un utilisateur ne voit ni les alertes, ni les profils, ni les événements des autres", async () => {
    const a = await userWithProfile("sec4a");
    const b = await userWithProfile("sec4b");
    await a.client.from("user_alerts").insert({ user_id: a.user.id, mineral_id: "mineral-xau", type: "price_above", threshold: 9000 });
    await admin().from("alert_events").insert({ user_id: a.user.id, title: "privé" });
    expect((await b.client.from("user_alerts").select("id").eq("user_id", a.user.id)).data).toHaveLength(0);
    expect((await b.client.from("users").select("id").eq("id", a.user.id)).data).toHaveLength(0);
    expect((await b.client.from("alert_events").select("id").eq("user_id", a.user.id)).data).toHaveLength(0);
    // et il ne peut pas écrire à la place de l'autre
    const forged = await b.client.from("user_alerts").insert({ user_id: a.user.id, mineral_id: "mineral-xau", type: "price_above", threshold: 1 });
    expect(forged.error).not.toBeNull();
  });

  test("[SEC-5|3pts] tables internes illisibles (job_runs) et modification d'un événement limitée à read_at", async () => {
    const { user, client } = await userWithProfile("sec5");
    expect((await client.from("job_runs").select("*")).data ?? []).toHaveLength(0);
    const { data: event } = await admin().from("alert_events").insert({ user_id: user.id, title: "t", url: "https://sec.gov/x" }).select("id").single();
    await client.from("alert_events").update({ title: "piraté", url: "javascript:alert(1)" }).eq("id", event!.id);
    await client.from("alert_events").update({ read_at: new Date().toISOString() }).eq("id", event!.id);
    const { data } = await admin().from("alert_events").select("title,url,read_at").eq("id", event!.id).single();
    expect(data?.title).toBe("t");
    expect(data?.url).toBe("https://sec.gov/x");
    expect(data?.read_at).not.toBeNull();
  });

  test("[SEC-6|3pts] les données publiques sont lisibles sans connexion (cours, dépôts, risque pays) mais pas les profils", async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const anon = createClient(ENV.supabaseUrl, ENV.anonKey);
    expect((await anon.from("minerals").select("id")).data?.length).toBeGreaterThan(0);
    expect((await anon.from("regulatory_filings").select("id")).data?.length).toBeGreaterThan(0);
    expect((await anon.from("country_risk").select("iso3")).data?.length).toBeGreaterThan(0);
    expect((await anon.from("users").select("id")).data ?? []).toHaveLength(0);
    expect((await anon.from("user_alerts").select("id")).data ?? []).toHaveLength(0);
  });
});

test.describe("API HTTP", () => {
  test("[API-1|3pts] routes privées : 401 sans session", async ({ request }) => {
    for (const path of ["/api/alertes", "/api/watchlist"]) {
      const response = await request.get(`${ENV.base}${path}`);
      expect(response.status(), path).toBe(401);
    }
    const create = await request.post(`${ENV.base}/api/alertes`, { data: { mineralId: "mineral-xau", type: "price_above", threshold: 1, currency: "USD" } });
    expect(create.status()).toBe(401);
  });

  test("[API-2|3pts] déclencheur de tâches : refuse sans jeton ou avec un mauvais jeton, accepte le bon", async ({ request }) => {
    expect((await request.get(`${ENV.base}/api/jobs/tick`)).status()).toBe(401);
    expect((await request.get(`${ENV.base}/api/jobs/tick`, { headers: { authorization: "Bearer mauvais" } })).status()).toBe(401);
    const ok = await request.get(`${ENV.base}/api/jobs/tick`, { headers: { authorization: `Bearer ${ENV.tickToken}` } });
    expect(ok.status()).toBe(200);
    expect(await ok.json()).toEqual({ ok: true });
  });

  test("[API-3|5pts] webhook Stripe : signature obligatoire, activation Pro, mauvais client ignoré, arrêt, autre produit ignoré", async ({ request }) => {
    const { user } = await userWithProfile("hook");
    const post = (event: object, signature?: string) => {
      const body = JSON.stringify(event);
      return request.post(`${ENV.base}/api/billing/webhook`, { data: body, headers: { "content-type": "application/json", "stripe-signature": signature ?? stripeSignature(body) } });
    };
    const paid = { id: "evt_1", type: "checkout.session.completed", data: { object: { mode: "subscription", payment_status: "paid", payment_link: "plink_1UWxJgGSZgm5QCNLu5j0EJFA", client_reference_id: user.id, customer: "cus_T", subscription: "sub_T" } } };

    expect((await post(paid, "t=1,v1=00")).status()).toBe(400);
    expect((await request.post(`${ENV.base}/api/billing/webhook`, { data: "{}" })).status()).toBe(400);
    expect((await post({ ...paid, data: { object: { ...paid.data.object, payment_link: "plink_AUTRE" } } })).status()).toBe(200);
    expect((await admin().from("users").select("plan").eq("id", user.id).single()).data?.plan).toBe("free");

    expect((await post(paid)).status()).toBe(200);
    expect((await admin().from("users").select("plan,stripe_subscription_id").eq("id", user.id).single()).data).toEqual({ plan: "pro", stripe_subscription_id: "sub_T" });

    await post({ id: "evt_2", type: "customer.subscription.deleted", data: { object: { id: "sub_T", status: "canceled", customer: "cus_AUTRE" } } });
    expect((await admin().from("users").select("plan").eq("id", user.id).single()).data?.plan).toBe("pro");

    await post({ id: "evt_3", type: "customer.subscription.deleted", data: { object: { id: "sub_T", status: "canceled", customer: "cus_T" } } });
    expect((await admin().from("users").select("plan").eq("id", user.id).single()).data?.plan).toBe("free");
  });
});
