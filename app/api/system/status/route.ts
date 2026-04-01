import { NextResponse } from "next/server";

import { getDataFreshnessStatus } from "@/lib/server/data";

export const dynamic = "force-dynamic";

/**
 * Expose un statut léger de fraîcheur pour le dashboard et le monitoring applicatif.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const status = await getDataFreshnessStatus();
    return NextResponse.json(status);
  } catch {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "Impossible de charger le statut systeme.",
      },
      { status: 500 }
    );
  }
}
