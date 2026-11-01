// Calcule la note du MEGA Fulltest : points des tests Playwright (titre « [ID|Npts] ») + contrôle des données.
// Usage : node scripts/megatest-score.mjs megatest-report.json [data-score-json]
import fs from "node:fs";

const report = JSON.parse(fs.readFileSync(process.argv[2] ?? "megatest-report.json", "utf8"));
const rows = [];

function walk(suite) {
  for (const spec of suite.specs ?? []) {
    const match = spec.title.match(/\[([\w-]+)\|(\d+)pts\]/);
    if (!match) continue;
    const ok = spec.tests.every((t) => t.results.every((r) => r.status === "passed"));
    const error = spec.tests.flatMap((t) => t.results).find((r) => r.status !== "passed")?.error?.message?.split("\n")[0]?.slice(0, 160);
    rows.push({ id: match[1], points: Number(match[2]), ok, error });
  }
  for (const child of suite.suites ?? []) walk(child);
}
for (const suite of report.suites) walk(suite);

const total = rows.reduce((s, r) => s + r.points, 0);
const earned = rows.filter((r) => r.ok).reduce((s, r) => s + r.points, 0);
for (const r of rows) console.log(`${r.ok ? "OK " : "KO "} [${r.points}] ${r.id}${r.ok ? "" : "  → " + r.error}`);
console.log(`\nSCORE TESTS NAVIGATEUR/API : ${earned}/${total}`);
