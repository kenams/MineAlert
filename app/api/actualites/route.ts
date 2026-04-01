import { NextRequest, NextResponse } from "next/server";

import { NEWS_PAGE_SIZE } from "@/lib/utils/constants";
import { getNewsArticles } from "@/lib/server/data";
import type { NewsFilters } from "@/types";

export const dynamic = "force-dynamic";

/**
 * Retourne le fil d'actualités minières avec filtres et pagination.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const filters: NewsFilters = {
    mineral: searchParams.get("mineral") ?? undefined,
    country: searchParams.get("country") ?? undefined,
    sentiment:
      (searchParams.get("sentiment") as NewsFilters["sentiment"]) ?? undefined,
    source: searchParams.get("source") ?? undefined,
    page: Number(searchParams.get("page") ?? "1"),
  };

  try {
    const result = await getNewsArticles({
      filters,
      pageSize: NEWS_PAGE_SIZE,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "Impossible de charger les actualités.",
      },
      { status: 500 }
    );
  }
}
