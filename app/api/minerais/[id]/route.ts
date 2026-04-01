import { NextRequest, NextResponse } from "next/server";

import {
  getMineralByIdOrSymbol,
  getPriceHistoryForMineral,
} from "@/lib/server/data";

export const dynamic = "force-dynamic";

/**
 * Retourne le détail d'un minerai et son historique 30 jours par défaut.
 */
export async function GET(
  _: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const mineral = await getMineralByIdOrSymbol(context.params.id);

    if (!mineral) {
      return NextResponse.json(
        { success: false, data: null, error: "Minerai introuvable." },
        { status: 404 }
      );
    }

    const history = await getPriceHistoryForMineral(context.params.id, "30d");

    return NextResponse.json({
      success: true,
      data: {
        mineral,
        history,
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "Impossible de charger le détail du minerai.",
      },
      { status: 500 }
    );
  }
}
