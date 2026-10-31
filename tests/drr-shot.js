/* drr: screenshots of the Droid Destruction planner (Game modes › Raids) at 1280 and 390, clock pinned to 12 Oct 2026 AEDT,
   12 Oct roster snapshot. Usage: SNAP_DATE=2026-10-12 FILE=... PORT=... node tests/drr-shot.js [acct] [YYYY-MM-DD] */
process.env.SNAP_DATE = process.env.SNAP_DATE || "2026-10-12";
const L = require("./lib.js");
const acct = process.argv[2] || "ollie", day = process.argv[3] || "2026-10-12";
(async () => {
  const srv = await L.serve(); const b = await L.chromium.launch();
  for (const [w, h, n] of [[1280, 1000, "d"], [390, 844, "m"]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, timezoneId: "Australia/Sydney", locale: "en-AU" });
    await ctx.clock.install({ time: new Date(day + "T08:05:00+11:00") });
    await ctx.addInitScript(([s, pl]) => { try { if (sessionStorage.getItem("seeded")) return; localStorage.clear(); localStorage.setItem("swgoh-tracker", s); localStorage.setItem("swgoh-holotable-pulls-v1", pl); sessionStorage.setItem("seeded", "1"); } catch (e) {} }, [L.REAL, L.PULLS]);
    await ctx.route(/fonts\.g|swgoh\.gg|corsproxy|allorigins|codetabs|api\.github/, r => r.abort());
    const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(String(e).slice(0, 300)));
    p.on("console", m => { if (m.type() === "error" && !/Failed to load resource|net::ERR|fonts\.g/.test(m.text())) errs.push("console: " + m.text().slice(0, 200)); });
    await p.goto(`http://127.0.0.1:${L.PORT}/x.html`, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(1200);
    await p.evaluate(a => { switchAcct(a); state.modesnav.category = "raid"; state.modesnav.raidView = "droid"; switchTab("modes"); }, acct);
    await p.waitForTimeout(600);
    const o = await L.overflow(p);
    await p.screenshot({ path: `shots/drr-${n}-${acct}-${day}.png`, fullPage: true });
    await p.evaluate(() => switchTab("coach")); await p.waitForTimeout(400);
    await p.screenshot({ path: `shots/drr-${n}-${acct}-coach.png`, fullPage: false });
    await p.evaluate(() => switchTab("overview")); await p.waitForTimeout(400);
    await p.screenshot({ path: `shots/drr-${n}-${acct}-overview.png`, fullPage: false });
    console.log(n, acct, JSON.stringify(o), errs);
    await ctx.close();
  }
  await b.close(); srv.close();
})().catch(e => { console.error(e); process.exit(2); });
