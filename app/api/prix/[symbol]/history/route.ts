import { NextRequest, NextResponse } from "next/server";

import { getPriceHistoryForMineral } from "@/lib/server/data";

export const dynamic = "force-dynamic";

/**
 * Retourne l'historique de prix d'un symbole avec une période configurable.
 */
export async function GET(
  request: NextRequest,
  context: { params: { symbol: string } }
): Promise<NextResponse> {
  const period = request.nextUrl.searchParams.get("period") ?? "30d";

  try {
    const history = await getPriceHistoryForMineral(context.params.symbol, period);
    return NextResponse.json({ history });
  } catch {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "Impossible de charger l'historique.",
      },
      { status: 500 }
    );
  }
}
