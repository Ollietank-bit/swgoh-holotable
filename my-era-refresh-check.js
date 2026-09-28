/* Verifies the 28 Sep 2026 Era 09 "Myths & Legends" refresh: Journey EL-gate resolution (per-unit gates
   for Tiers 1-3), the EL-135 cap update, and the all-4-bosses Coliseum squad refresh. Checks the game
   modes tab renders every Era section without throwing and shows the new content. */
const { chromium } = require("playwright");
const fs = require("fs"), http = require("http");
const REAL = fs.readFileSync("/mnt/user-data/uploads/Star Wars Galaxy of Heroes - Holotable/state-backups/holotable-2026-09-20.json", "utf8");
const PULLS = JSON.stringify(JSON.parse(fs.readFileSync("/mnt/user-data/uploads/Star Wars Galaxy of Heroes - Holotable/_tmp-state-latest.json", "utf8")).pulls);
const srv = http.createServer((q, s) => { s.setHeader("content-type", "text/html"); fs.createReadStream("/home/user/index.html").pipe(s); });
const R = []; const ck = (n, p, d) => R.push({ check: n, pass: !!p, detail: d });

async function open(b, tab) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 } });
  await ctx.addInitScript(([s, pl]) => {
    try { localStorage.clear(); localStorage.setItem("swgoh-tracker", s);
      localStorage.setItem("swgoh-holotable-pulls-v1", pl); } catch (e) {}
  }, [REAL, PULLS]);
  await ctx.route(/fonts\.g|swgoh\.gg|corsproxy|allorigins|codetabs|api\.github/, r => r.abort());
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push(String(e).slice(0, 200)));
  await p.goto("http://127.0.0.1:8994/x.html", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(900);
  if (tab) { await p.evaluate(t => switchTab(t), tab); await p.waitForTimeout(300); }
  return { ctx, p, errs };
}

(async () => {
  await new Promise(r => srv.listen(8994, r));
  const b = await chromium.launch({ headless: true });

  /* 1. Raw data model: elUnit fields, EL cap text, coliseum boss coverage, SNAPSHOTS asOf. */
  { const { ctx, p, errs } = await open(b);
    const out = await p.evaluate(() => ({
      t1: ERA_JOURNEY_TIERS[0].elUnit, t2: ERA_JOURNEY_TIERS[1].elUnit, t3: ERA_JOURNEY_TIERS[2].elUnit, t4: ERA_JOURNEY_TIERS[3].elUnit,
      bosses: [...new Set(ERA_COLISEUM_SQUADS.map(s => s.boss))],
      krayt: ERA_COLISEUM_SQUADS.filter(s => s.boss === "Krayt Dragon").length,
      jotaz: ERA_COLISEUM_SQUADS.filter(s => s.boss === "Jotaz").length,
      zeffo: ERA_COLISEUM_SQUADS.filter(s => s.boss === "Zeffo Tomb Guardians").length,
      dryax: ERA_COLISEUM_SQUADS.filter(s => s.boss === "Dryax").length,
      snapAsOf: SNAPSHOTS.find(s => s.key === "era").asOf,
    }));
    ck("Journey Tiers 1-3 each name their EL-gated unit", out.t1[0] === "YODADSV" && out.t2[0] === "LUKESTARKILLER" && out.t3[0] === "MARAJADESKYWALKER", JSON.stringify(out.t1) + " " + JSON.stringify(out.t2) + " " + JSON.stringify(out.t3));
    ck("Journey Tier 4 EL gate stays unresolved (elUnit null)", out.t4 === null, JSON.stringify(out.t4));
    ck("Coliseum now covers all 4 bosses", out.bosses.length === 4 && out.bosses.includes("Krayt Dragon") && out.bosses.includes("Jotaz") && out.bosses.includes("Zeffo Tomb Guardians") && out.bosses.includes("Dryax"), JSON.stringify(out.bosses));
    ck("Each boss has at least 2 squads", out.krayt >= 2 && out.jotaz >= 2 && out.zeffo >= 2 && out.dryax >= 2, JSON.stringify({ krayt: out.krayt, jotaz: out.jotaz, zeffo: out.zeffo, dryax: out.dryax }));
    ck("Era snapshot asOf bumped to 2026-09-28", out.snapAsOf === "2026-09-28", out.snapAsOf);
    ck("no boot errors", errs.length === 0, JSON.stringify(errs));
    await ctx.close(); }

  /* 2. Render every Era section on the Game modes tab without throwing, and check for the refreshed text. */
  { const { ctx, p, errs } = await open(b, "modes");
    const out = await p.evaluate(() => {
      const results = {};
      for (const sec of ERA_SECTIONS) { try { results[sec.key] = sec.html(); } catch (e) { results[sec.key] = "THROW: " + e.message; } }
      return results;
    });
    for (const key of ["overview", "units", "journey", "coliseum", "challenges", "leveling"]) {
      ck(`Era section '${key}' renders without throwing`, out[key] && !out[key].startsWith("THROW"), (out[key] || "").slice(0, 150));
    }
    ck("Journey section shows the resolved per-unit EL gate text", out.journey.includes("RESOLVED 28 Sep 2026"), out.journey.slice(0, 200));
    ck("Leveling section shows EL 135 cap resolution", out.leveling.includes("135") && out.leveling.includes("Largely resolved"), out.leveling.slice(out.leveling.indexOf("Era Level cap"), out.leveling.indexOf("Era Level cap") + 200));
    ck("Coliseum section shows all 4 boss headers", ["Krayt Dragon", "Jotaz", "Zeffo Tomb Guardians", "Dryax"].every(b => out.coliseum.includes(b)), "checked");
    ck("Coliseum section shows refreshed Krayt Dragon damage (1,105,104)", out.coliseum.includes("1,105,104"), "checked");
    ck("no runtime errors on Game modes tab", errs.length === 0, JSON.stringify(errs));
    await ctx.close(); }

  /* 3. Data-health panel reflects the fresh asOf for the 'era' key. */
  { const { ctx, p, errs } = await open(b);
    const out = await p.evaluate(() => {
      const s = SNAPSHOTS.find(x => x.key === "era");
      return { state: snapState(s, Date.parse("2026-09-28T12:00:00Z")).state };
    });
    ck("Era snapshot reads as fresh as of 28 Sep 2026", out.state === "fresh", JSON.stringify(out));
    ck("no runtime errors", errs.length === 0, JSON.stringify(errs));
    await ctx.close(); }

  await b.close(); srv.close();
  const f = R.filter(r => !r.pass);
  console.log(JSON.stringify({ passed: R.length - f.length, failed: f.length, results: R }, null, 2));
})().catch(e => { console.error("FATAL", e && e.stack || e); srv.close(); process.exit(1); });
