import "server-only";

import { Resend } from "resend";

import { getResendApiKey } from "@/lib/config/server";

type AlertEmailInput = {
  to: string;
  mineralName: string;
  threshold: number;
  currentPrice: number;
  alertLabel: string;
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
  return sendMail({
    to: input.to,
    subject: `Alerte MineAlert : ${input.mineralName}`,
    text: `${input.alertLabel}\nMinerai : ${input.mineralName}\nSeuil : ${input.threshold}\nPrix observé : ${input.currentPrice}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color:#1B4332;">Alerte MineAlert déclenchée</h2>
        <p>${input.alertLabel}</p>
        <p>Minerai : <strong>${input.mineralName}</strong></p>
        <p>Seuil configuré : <strong>${input.threshold}</strong></p>
        <p>Prix observé : <strong>${input.currentPrice}</strong></p>
      </div>
    `,
  });
}
