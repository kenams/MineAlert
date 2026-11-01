import { timingSafeEqual } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { getCronSecret } from "@/lib/config/server";
import { runDueJobs } from "@/lib/jobs/run";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const accepted: string[] = [];
  const tickToken = process.env.JOBS_TICK_TOKEN?.trim();

  if (tickToken) {
    accepted.push(tickToken);
  }

  try {
    const cron = getCronSecret();

    if (cron) {
      accepted.push(cron);
    }
  } catch {
    // CRON_SECRET absent : seul JOBS_TICK_TOKEN reste accepté.
  }

  if (accepted.length === 0) {
    return false;
  }

  const header = request.headers.get("authorization");
  const provided = request.headers.get("x-cron-secret") ?? (header?.startsWith("Bearer ") ? header.slice(7).trim() : "");

  return accepted.some((secret) => {
    const a = Buffer.from(provided, "utf8");
    const b = Buffer.from(secret, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

/**
 * Déclencheur des tâches planifiées (dépôts SEC, risque pays, alertes, résumé quotidien). Protégé par un secret.
 * Le détail de chaque exécution est enregistré dans la table job_runs, pas renvoyé à l'appelant.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  try {
    await runDueJobs();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(JSON.stringify({ source: "jobs-tick", message: error instanceof Error ? error.message : "unknown" }));
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
