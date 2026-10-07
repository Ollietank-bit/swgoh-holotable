/* Boots the app with the real saved state + the newest roster snapshot; visits every tab for both accounts at
   1280 and 390 wide; no page errors, no horizontal overflow. The broad regression net for every change. */
const L = require("./lib.js");
(async () => {
  const srv = await L.serve(); const b = await L.chromium.launch({ headless: true });
  for (const w of [1280, 390]) {
    const { ctx, p, errs } = await L.open(b, { width: w, tag: "smoke" + w });
    const tabs = await p.evaluate(() => SUBTABS.map(t => t.key));
    L.ck(`[${w}] the app lists tabs`, tabs.length >= 10, tabs.join());
    for (const acct of ["ollie", "tiny"]) {
      for (const t of tabs) {
        await L.go(p, acct, t);
        const o = await L.overflow(p);
        L.ck(`[${w}] ${acct}/${t}: no horizontal overflow`, o.doc <= o.inner + 1, JSON.stringify(o));
      }
    }
    L.ck(`[${w}] no page errors across all tabs`, errs.length === 0, JSON.stringify(errs.slice(0, 5)));
    await ctx.close();
  }
  await L.finish(b, srv);
})().catch(e => { console.error(e); process.exit(2); });
