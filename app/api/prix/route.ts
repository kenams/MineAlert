import { NextResponse } from "next/server";

import { getMinerals } from "@/lib/server/data";

export const dynamic = "force-dynamic";

/**
 * Retourne les prix actuels des minerais, triés par catégorie puis par nom.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const minerals = await getMinerals();
    const sorted = [...minerals].sort((first, second) => {
      const categoryCompare = first.category.localeCompare(second.category);

      if (categoryCompare !== 0) {
        return categoryCompare;
      }

      return first.name.localeCompare(second.name);
    });

    return NextResponse.json(sorted);
  } catch {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "Impossible de charger les prix.",
      },
      { status: 500 }
    );
  }
}
