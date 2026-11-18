#!/usr/bin/env node
/* gl-readiness — readiness of every Galactic Legend the account does NOT own, from a compact roster file, using the app's own
   requirement data and helpers (GL_ROADMAP / GL_ORDER / MGL_REQ via GL_QUEUE.watch, unitProgress, glqTiersLeft, mglReqMap, accountView).
   Usage:  NODE_PATH=/home/claude/.npm-global/lib/node_modules node tools/gl-readiness.js <roster.txt> [--account ollie] [--json out.json]
   Roster: optional '#' comment first line, then ID:stars.gear[rN][*] items, comma separated (see ref31/ollie-roster-31oct.txt).
   rv48 18 Nov 2026: "(unreleased)" is printed only for a watch entry whose `released` flag is not true (Mandalorian & Grogu is released); Mercenary Guard Droid (B1)
   resolves by his id B1MERCDROID (see gl-lib.js). */
const fs = require("fs");
const { withApp, pageReadiness } = require("./gl-lib.js");

function args(argv) {
  const a = { roster: null, account: "ollie", json: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--account") a.account = argv[++i];
    else if (argv[i] === "--json") a.json = argv[++i];
    else if (!a.roster) a.roster = argv[i];
    else { console.error("unexpected argument " + argv[i]); process.exit(1); }
  }
  if (!a.roster) { console.error("usage: gl-readiness.js <roster.txt> [--account ollie] [--json out.json]"); process.exit(1); }
  return a;
}
function table(res) {
  const rows = res.gls.slice().sort((a, b) => (a.released === b.released ? a.steps - b.steps : a.released ? -1 : 1));
  const L = ["| GL | Met | Relic steps left | R1-5 / R6-7 / R8+ | R8+ steps by level (unmet asks) | Shards short | Not owned | To G13 |", "|---|---|---|---|---|---|---|---|"];
  for (const g of rows) {
    const lv = Object.keys(g.levels).sort((x, y) => +x.slice(1) - +y.slice(1)).map(k => k + "x" + g.levels[k]).join(" ") || "-";
    const asks = lv === "-" ? "-" : `${lv} (asks: ${Object.keys(g.asks).sort().map(k => g.asks[k] + "x" + k).join(", ")})`;
    L.push(`| ${g.name}${g.released ? "" : " (unreleased)"} | ${g.met}/${g.total} | ${g.steps} | ${g.bands.r1_5} / ${g.bands.r6_7} / ${g.bands.r8p} | ${asks} | ${g.shortShards} | ${g.notOwned} | ${g.toG13} |`);
  }
  return L.join("\n");
}
(async () => {
  const a = args(process.argv);
  const res = await withApp(a.roster, a.account, (p, acct) => p.evaluate(pageReadiness, acct));
  for (const g of res.gls) if (g.appTiers !== g.steps || g.appMet !== g.met || g.appTotal !== g.total)
    console.error(`WARN ${g.id}: tool (steps ${g.steps}, met ${g.met}/${g.total}) != app helper (glqTiersLeft ${g.appTiers}, ${g.appMet}/${g.appTotal})`);
  console.log(`# GL readiness — ${a.account} — ${a.roster}\nOwned GLs (excluded): ${res.owned.map(o => `${o.name} R${o.r}`).join(", ") || "none"}\n`);
  console.log(table(res));
  console.log("\nNotes: relic step = one relic level (a not-owned unit counts its whole ask); shards short = shards to 7★ via the app's STAR_SHARDS_CUM (a not-owned unit counts 330); 'To G13' = owned units with no relic yet below G13; Not owned units are listed in the JSON.");
  if (a.json) { fs.writeFileSync(a.json, JSON.stringify(res, null, 1)); console.log("JSON written: " + a.json); }
})().catch(e => { console.error(e.stack || e); process.exit(1); });
