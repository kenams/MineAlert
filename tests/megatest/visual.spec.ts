import fs from "node:fs";

import { expect, test } from "@playwright/test";

import { createConfirmedUser, deleteUserByEmail, login, randomEmail, signedInClient } from "./helpers";

const SHOTS = process.env.MT_SHOTS ?? "megatest-shots";
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 375, height: 800 },
];

test("[UI-1|6pts] aucune page ne déborde horizontalement (ordinateur et téléphone, FR et EN), captures enregistrées", async ({ browser }) => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const email = randomEmail("visual");
  const user = await createConfirmedUser(email, "Visuel");
  const client = await signedInClient(email);
  await client.from("users").insert({ id: user.id, email, full_name: "Visuel" });
  const overflow: string[] = [];

  try {
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
      const page = await context.newPage();
      await login(page, email, "");

      const targets = ["", "/en"].flatMap((prefix) =>
        [
          "/",
          "/login",
          "/legal",
          "/terms",
          "/dashboard",
          "/dashboard/minerais",
          "/dashboard/alertes",
          "/dashboard/depots",
          "/dashboard/risque-pays",
          "/dashboard/plan",
        ].map((path) => `${prefix}${path === "/" && prefix ? "" : path}` || "/")
      );

      for (const path of targets) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: window.innerWidth }));
        if (widths.scroll > widths.inner + 2) overflow.push(`${viewport.name} ${path}: ${widths.scroll}>${widths.inner}`);
        const slug = path.replace(/\//g, "_") || "_home";
        await page.screenshot({ path: `${SHOTS}/${viewport.name}${slug}.png`, fullPage: false });
      }
      await context.close();
    }
  } finally {
    await deleteUserByEmail(email);
  }

  expect(overflow).toEqual([]);
});
