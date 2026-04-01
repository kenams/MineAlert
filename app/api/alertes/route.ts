import { NextRequest, NextResponse } from "next/server";

import { UnauthorizedError } from "@/lib/server/auth";
import {
  createUserAlert,
  deleteUserAlert,
  getUserAlerts,
} from "@/lib/server/data";
import type { CurrencyCode, UserAlert } from "@/types";

export const dynamic = "force-dynamic";

/**
 * Retourne les alertes utilisateur courantes.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const alerts = await getUserAlerts();
    return NextResponse.json({ alerts });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { success: false, data: null, error: "Authentification requise." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, data: null, error: "Impossible de charger les alertes." },
      { status: 500 }
    );
  }
}

/**
 * Crée une nouvelle alerte avec validation défensive du payload.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      mineralId?: string;
      type?: UserAlert["type"];
      threshold?: number;
      currency?: CurrencyCode;
    };

    if (
      !body.mineralId ||
      !body.type ||
      typeof body.threshold !== "number" ||
      !body.currency
    ) {
      return NextResponse.json(
        { success: false, data: null, error: "Payload de création invalide." },
        { status: 400 }
      );
    }

    const alert = await createUserAlert({
      mineralId: body.mineralId,
      type: body.type,
      threshold: body.threshold,
      currency: body.currency,
    });

    return NextResponse.json({ success: true, data: alert }, { status: 201 });
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
            : "Impossible de créer l'alerte.",
      },
      { status: 400 }
    );
  }
}

/**
 * Supprime une alerte à partir de son identifiant.
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { id?: string };

    if (!body.id) {
      return NextResponse.json(
        { success: false, data: null, error: "Identifiant d'alerte manquant." },
        { status: 400 }
      );
    }

    await deleteUserAlert(body.id);

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
            : "Impossible de supprimer l'alerte.",
      },
      { status: 400 }
    );
  }
}
