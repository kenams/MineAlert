import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";

export const ENV = {
  supabaseUrl: process.env.MT_SUPABASE_URL ?? "http://127.0.0.1:55321",
  anonKey: process.env.MT_ANON_KEY ?? "",
  serviceKey: process.env.MT_SERVICE_KEY ?? "",
  mailpit: process.env.MT_MAILPIT_URL ?? "http://127.0.0.1:55324",
  tickToken: process.env.MT_TICK_TOKEN ?? "megatest-tick-token",
  webhookSecret: process.env.MT_WEBHOOK_SECRET ?? "whsec_megatest_secret",
  base: process.env.E2E_BASE_URL ?? "http://localhost:3300",
};

export const PASSWORD = "MineAlert!Test12345";

export function admin(): SupabaseClient {
  return createClient(ENV.supabaseUrl, ENV.serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function randomEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 7)}@minealert-test.example`;
}

/** Crée un utilisateur confirmé côté Auth et son profil, comme après une première connexion. */
export async function createConfirmedUser(email: string, fullName = "Test User") {
  const client = admin();
  const { data, error } = await client.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: fullName } });
  if (error || !data.user) throw new Error(`createUser: ${error?.message}`);
  return data.user;
}

export async function deleteUserByEmail(email: string): Promise<void> {
  const client = admin();
  const { data } = await client.auth.admin.listUsers({ page: 1, perPage: 200 });
  const user = data?.users.find((candidate) => candidate.email === email);
  if (user) {
    await client.from("users").delete().eq("id", user.id);
    await client.auth.admin.deleteUser(user.id);
  }
}

/** Client Supabase connecté comme l'utilisateur (même clé publique que le navigateur) : sert à tester RLS et privilèges. */
export async function signedInClient(email: string): Promise<SupabaseClient> {
  const client = createClient(ENV.supabaseUrl, ENV.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`signIn: ${error.message}`);
  return client;
}

type MailpitMessage = { ID: string; Subject: string; To: Array<{ Address: string }> };

export async function waitForMail(to: string, timeoutMs = 20000): Promise<{ subject: string; html: string; text: string }> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const response = await fetch(`${ENV.mailpit}/api/v1/messages?limit=50`);
    const body = (await response.json()) as { messages?: MailpitMessage[] };
    const message = body.messages?.find((candidate) => candidate.To.some((recipient) => recipient.Address.toLowerCase() === to.toLowerCase()));
    if (message) {
      const full = (await (await fetch(`${ENV.mailpit}/api/v1/message/${message.ID}`)).json()) as { HTML: string; Text: string; Subject: string };
      return { subject: full.Subject, html: full.HTML, text: full.Text };
    }
    await new Promise((resolve) => setTimeout(resolve, 800));
  }
  throw new Error(`Aucun e-mail reçu pour ${to}`);
}

export function firstLink(html: string, mustContain: string): string {
  const match = [...html.matchAll(/href="([^"]+)"/g)].map((entry) => entry[1].replace(/&amp;/g, "&")).find((href) => href.includes(mustContain));
  if (!match) throw new Error(`Lien contenant « ${mustContain} » introuvable`);
  return match;
}

export function stripeSignature(body: string, secret = ENV.webhookSecret): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

export async function login(page: import("@playwright/test").Page, email: string, prefix = ""): Promise<void> {
  await page.goto(`${prefix}/login`);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
}
