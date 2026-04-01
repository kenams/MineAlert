import { NextRequest, NextResponse } from "next/server";

import { getMinerals } from "@/lib/server/data";
import type { ApiResponse, Mineral } from "@/types";

export const dynamic = "force-dynamic";

/**
 * Retourne la liste des minerais avec filtres simples par catégorie et recherche.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  try {
    const minerals = await getMinerals({ category, search });
    const sorted = [...minerals].sort(
      (first, second) => second.priceChangePercent24h - first.priceChangePercent24h
    );
    const response: ApiResponse<Mineral[]> = {
      success: true,
      data: sorted,
    };

    return NextResponse.json(response);
  } catch {
    const response: ApiResponse<Mineral[]> = {
      success: false,
      data: null,
      error: "Impossible de charger les minerais.",
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * Placeholder admin pour la mise à jour des minerais tant que le back-office n'est pas branché.
 */
export async function PATCH(): Promise<NextResponse> {
  return NextResponse.json(
    {
      success: false,
      data: null,
      error:
        "La mise à jour des minerais n'est pas encore disponible dans cette version.",
    },
    { status: 501 }
  );
}
