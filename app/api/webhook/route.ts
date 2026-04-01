import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Placeholder de webhook pour les intégrations externes futures.
 */
export async function POST(_: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    {
      success: true,
      message: "Webhook reçu, aucun traitement supplémentaire pour l'instant.",
    },
    { status: 202 }
  );
}
