import { NextResponse } from "next/server";

import { runDueJobs } from "@/lib/jobs/run";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Déclencheur des tâches planifiées (dépôts SEC, risque pays, alertes). Sans secret : chaque tâche est verrouillée en base
 * et ne s'exécute que si son intervalle minimal est écoulé, donc des appels répétés sont sans effet.
 */
export async function GET(): Promise<NextResponse> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Base non configurée." }, { status: 503 });
  }

  try {
    const report = await runDueJobs();
    return NextResponse.json({ ok: true, report });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Erreur." },
      { status: 500 }
    );
  }
}
