/* gof — prints the offence plans for both accounts × both formats (owner sanity check). Not a pass/fail suite. */
const L = require("./lib.js");
(async () => {
  const srv = await L.serve(); const b = await L.chromium.launch({ headless: true });
  const { ctx, p, errs } = await L.open(b, { tag: "probe" });
  await L.go(p, "ollie", "gac");
  const out = await p.evaluate(() => {
    const res = {};
    for (const acct of ["ollie", "tiny"]) for (const fmt of ["5v5", "3v3"]) {
      switchAcct(acct); state.views["gco-" + acct] = fmt;
      const def = gcoPlanFor(acct), off = gofPlanFor(acct);
      const fmtC = c => `${c.name} [${c.score}] — ${c.rows.map(r => r.name + (r.owned ? "" : "(UNOWNED)") + (r.ready ? "" : "*")).join(", ")}${c.into && c.into.length ? " | into: " + c.into.join("; ") : ""}`;
      res[acct + "/" + fmt] = {
        ms: off.ms, defMs: def.ms,
        defence: def.squadSlots.map(x => x.cand ? `${x.slot.zone.label}: ${fmtC(x.cand)}` : `${x.slot.zone.label}: EMPTY`).concat(def.fleetSlots.map(x => x.cand ? `Fleet: ${x.cand.name}` : "Fleet: EMPTY")),
        offence: off.picked.map((c, i) => `#${i + 1} ${fmtC(c)}`),
        fleet: off.fleet ? off.fleet.name : null,
        skipped: off.skipped.map(k => `${k.name}: ${k.reason}`),
        lookup: off.lookup.map(r => `${r.def} → ${r.opts.map(o => `${o.label} (${o.status})`).join(" | ")}`),
        rows: gofPlannerRows(off),
        text: gofTextLines(acct)
      };
      delete state.views["gco-" + acct];
    }
    return res;
  });
  console.log(JSON.stringify(out, null, 1));
  console.log("errors:", JSON.stringify(errs));
  await ctx.close(); await b.close(); srv.close();
})().catch(e => { console.error(e); process.exit(2); });
