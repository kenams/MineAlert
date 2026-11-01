import "server-only";

import { runAlertSweep } from "@/lib/alerts/sweep";
import { runDailyDigest } from "@/lib/jobs/digest";
import { maybeRunOnDemandSync } from "@/lib/server/on-demand-sync";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncCountryRisk } from "@/lib/sync/country-risk";
import { syncEdgarFilings } from "@/lib/sync/edgar";

type JobDefinition = {
  name: string;
  minIntervalMs: number;
  when?: () => boolean;
  run: () => Promise<string>;
};

const MINUTE = 60 * 1000;

const JOBS: JobDefinition[] = [
  {
    name: "edgar",
    minIntervalMs: 30 * MINUTE,
    run: async () => {
      const result = await syncEdgarFilings();
      return `${result.filings} dépôts, ${result.errors} erreurs, ${result.companies} sociétés`;
    },
  },
  {
    name: "country_risk",
    minIntervalMs: 7 * 24 * 60 * MINUTE,
    run: async () => `${(await syncCountryRisk()).countries} pays`,
  },
  {
    name: "digest",
    minIntervalMs: 20 * 60 * MINUTE,
    when: () => {
      const hour = new Date().getUTCHours();
      return hour >= 5 && hour <= 8;
    },
    run: async () => {
      const result = await runDailyDigest();
      return `${result.sent}/${result.recipients} e-mails`;
    },
  },
  {
    name: "alerts",
    minIntervalMs: 10 * MINUTE,
    run: async () => {
      await maybeRunOnDemandSync();
      const result = await runAlertSweep();
      return `${result.checked} alertes, ${result.events} événements, ${result.emailed} e-mails`;
    },
  },
];

/**
 * Lance les tâches planifiées arrivées à échéance. Chaque tâche est verrouillée en base pour que des appels répétés ne la relancent pas avant son intervalle.
 */
export async function runDueJobs(): Promise<Record<string, string>> {
  const client = createAdminClient();
  const report: Record<string, string> = {};

  for (const job of JOBS) {
    if (job.when && !job.when()) {
      report[job.name] = "hors fenêtre horaire";
      continue;
    }

    const cutoff = new Date(Date.now() - job.minIntervalMs).toISOString();
    const { data: claimed } = await client
      .from("job_runs")
      .update({ last_run: new Date().toISOString(), last_status: "running" })
      .eq("name", job.name)
      .lt("last_run", cutoff)
      .select("name");

    if (!claimed || claimed.length === 0) {
      report[job.name] = "pas encore dû";
      continue;
    }

    try {
      const detail = await job.run();
      await client.from("job_runs").update({ last_status: "ok", last_detail: detail }).eq("name", job.name);
      report[job.name] = `ok : ${detail}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : "erreur inconnue";
      await client
        .from("job_runs")
        .update({ last_status: "error", last_detail: message.slice(0, 300) })
        .eq("name", job.name);
      report[job.name] = `erreur : ${message}`;
    }
  }

  return report;
}
