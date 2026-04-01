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

/**
 * Envoie un email d'alerte si Resend est configuré, sinon retourne un état de saut propre.
 */
export async function sendAlertEmail(input: AlertEmailInput): Promise<{
  sent: boolean;
  skipped: boolean;
}> {
  const apiKey = getResendApiKey();

  if (!apiKey) {
    return { sent: false, skipped: true };
  }

  const resend = new Resend(apiKey);

  await resend.emails.send({
    from: "MineAlert <alerts@minealert.local>",
    to: input.to,
    subject: `Alerte MineAlert: ${input.mineralName}`,
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

  return { sent: true, skipped: false };
}
