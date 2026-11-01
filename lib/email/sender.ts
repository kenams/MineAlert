import "server-only";

import { Resend } from "resend";

import { getResendApiKey } from "@/lib/config/server";
import { createT, type Locale } from "@/lib/i18n";
import { esc } from "@/lib/utils/safe-html";

type AlertEmailInput = {
  to: string;
  mineralName: string;
  threshold: number;
  currentPrice: number;
  alertLabel: string;
  locale?: Locale;
};

type MailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

const FROM = process.env.MINEALERT_FROM?.trim() || "MineAlert <alertes@kah-digital.ch>";

/**
 * Envoie un email via Resend. Retourne skipped=true si Resend n'est pas configuré.
 */
export async function sendMail(input: MailInput): Promise<{ sent: boolean; skipped: boolean }> {
  const apiKey = getResendApiKey();

  if (!apiKey) {
    return { sent: false, skipped: true };
  }

  const result = await new Resend(apiKey).emails.send({
    from: FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return { sent: true, skipped: false };
}

/**
 * Envoie un email d'alerte de prix si Resend est configuré, sinon retourne un état de saut propre.
 */
export async function sendAlertEmail(input: AlertEmailInput): Promise<{
  sent: boolean;
  skipped: boolean;
}> {
  const t = createT(input.locale ?? "fr");

  return sendMail({
    to: input.to,
    subject: t("email.singleAlertSubject", { mineral: input.mineralName }),
    text: `${input.alertLabel}\n${t("email.singleAlertMineral")}${input.mineralName}\n${t("email.singleAlertThresholdText")}${input.threshold}\n${t("email.singleAlertPrice")}${input.currentPrice}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color:#1B4332;">${esc(t("email.singleAlertHeading"))}</h2>
        <p>${esc(input.alertLabel)}</p>
        <p>${esc(t("email.singleAlertMineral"))}<strong>${esc(input.mineralName)}</strong></p>
        <p>${esc(t("email.singleAlertThreshold"))}<strong>${input.threshold}</strong></p>
        <p>${esc(t("email.singleAlertPrice"))}<strong>${input.currentPrice}</strong></p>
      </div>
    `,
  });
}
