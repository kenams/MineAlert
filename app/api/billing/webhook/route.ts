import { createHmac, timingSafeEqual } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Liens de paiement Stripe de MineAlert Pro (mensuel, annuel). Le webhook reçoit les événements de tout le compte Stripe :
 * on ne traite que ceux issus de ces deux liens, ou d'abonnements déjà rattachés à un utilisateur MineAlert.
 */
const MINEALERT_PAYMENT_LINKS = new Set([
  "plink_1UWxJgGSZgm5QCNLu5j0EJFA",
  "plink_1UWxKYGSZgm5QCNLDQuyhZk6",
]);

const SIGNATURE_TOLERANCE_SECONDS = 300;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type StripeEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
};

function verifySignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) {
    return false;
  }

  const parts = header.split(",").map((part) => part.trim().split("="));
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > SIGNATURE_TOLERANCE_SECONDS) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");

  return signatures.some((signature) => {
    const a = Buffer.from(signature, "utf8");
    const b = Buffer.from(expected, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Webhook Stripe : active le plan Pro après paiement, le retire à la fin de l'abonnement.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!secret) {
    return NextResponse.json({ error: "Webhook non configuré." }, { status: 503 });
  }

  const rawBody = await request.text();

  if (!verifySignature(rawBody, request.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  let event: StripeEvent;

  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const client = createAdminClient();
  const object = event.data?.object ?? {};

  try {
    if (event.type === "checkout.session.completed") {
      const link = asString(object.payment_link);

      if (!link || !MINEALERT_PAYMENT_LINKS.has(link) || object.mode !== "subscription" || object.payment_status !== "paid") {
        return NextResponse.json({ received: true, ignored: true });
      }

      const reference = asString(object.client_reference_id);
      const subscriptionId = asString(object.subscription);
      const customerId = asString(object.customer);

      if (!reference || !UUID_PATTERN.test(reference) || !subscriptionId || !customerId) {
        console.warn(JSON.stringify({ source: "stripe-webhook", status: "missing_reference", event: event.id }));
        return NextResponse.json({ error: "Référence utilisateur manquante." }, { status: 500 });
      }

      const { data: user } = await client
        .from("users")
        .select("id,plan,stripe_subscription_id")
        .eq("id", reference)
        .maybeSingle();

      if (!user) {
        console.warn(JSON.stringify({ source: "stripe-webhook", status: "user_not_found", event: event.id }));
        return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 500 });
      }

      // Ne jamais écraser l'abonnement d'un compte déjà Pro avec un autre abonnement : à traiter à la main.
      if (user.stripe_subscription_id && user.stripe_subscription_id !== subscriptionId && user.plan === "pro") {
        console.warn(JSON.stringify({ source: "stripe-webhook", status: "already_subscribed", event: event.id }));
        return NextResponse.json({ received: true, ignored: true });
      }

      const { error } = await client
        .from("users")
        .update({
          plan: "pro",
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({ received: true });
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscriptionId = asString(object.id);
      const status = asString(object.status);

      if (!subscriptionId) {
        return NextResponse.json({ received: true, ignored: true });
      }

      const active = event.type !== "customer.subscription.deleted" && (status === "active" || status === "trialing" || status === "past_due");
      const ended = event.type === "customer.subscription.deleted" || status === "canceled" || status === "unpaid" || status === "incomplete_expired";

      if (!active && !ended) {
        return NextResponse.json({ received: true, ignored: true });
      }

      const customerId = asString(object.customer);
      let update = client
        .from("users")
        .update({ plan: active ? "pro" : "free", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", subscriptionId);

      if (customerId) {
        update = update.eq("stripe_customer_id", customerId);
      }

      const { error } = await update;

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true, ignored: true });
  } catch (error) {
    console.error(
      JSON.stringify({ source: "stripe-webhook", status: "error", event: event.id, message: error instanceof Error ? error.message : "unknown" })
    );
    return NextResponse.json({ error: "Traitement impossible." }, { status: 500 });
  }
}
