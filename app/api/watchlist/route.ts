import { NextRequest, NextResponse } from "next/server";

import { UnauthorizedError } from "@/lib/server/auth";
import {
  addMineralToWatchlist,
  getWatchlistMinerals,
  removeMineralFromWatchlist,
} from "@/lib/server/data";

export const dynamic = "force-dynamic";

/**
 * Retourne la watchlist courante.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const watchlist = await getWatchlistMinerals();
    return NextResponse.json({ watchlist });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { success: false, data: null, error: "Authentification requise." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "Impossible de charger la watchlist.",
      },
      { status: 500 }
    );
  }
}

/**
 * Ajoute un minerai à la watchlist.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { mineralId?: string };

    if (!body.mineralId) {
      return NextResponse.json(
        { success: false, data: null, error: "mineralId est requis." },
        { status: 400 }
      );
    }

    await addMineralToWatchlist({ mineralId: body.mineralId });
    return NextResponse.json({ success: true, data: null }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { success: false, data: null, error: "Authentification requise." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        data: null,
        error:
          error instanceof Error
            ? error.message
            : "Ajout à la watchlist impossible.",
      },
      { status: 400 }
    );
  }
}

/**
 * Retire un minerai de la watchlist.
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { mineralId?: string };

    if (!body.mineralId) {
      return NextResponse.json(
        { success: false, data: null, error: "mineralId est requis." },
        { status: 400 }
      );
    }

    await removeMineralFromWatchlist({ mineralId: body.mineralId });
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { success: false, data: null, error: "Authentification requise." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        data: null,
        error:
          error instanceof Error
            ? error.message
            : "Suppression de la watchlist impossible.",
      },
      { status: 400 }
    );
  }
}
