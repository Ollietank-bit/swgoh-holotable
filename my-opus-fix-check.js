/* Verifies the Opus-review fix pass (27 Sep 2026): relic numbers, GL naming, tier-list cross-refs for
   Darth Traya / Dark Trooper Moff Gideon / Rotta the Hutt, GAC_COUNTERS SLKR/Rotta corrections,
   Darth Bane excluded from Recommended Defense, Roster Gap Radar surfacing confidence/notes/sources,
   Conquest Teva progress denominator, and META_FLEET_TIER Endurance/Home One swap. */
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
  await p.goto("http://127.0.0.1:8993/x.html", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(900);
  if (tab) { await p.evaluate(t => switchTab(t), tab); await p.waitForTimeout(300); }
  return { ctx, p, errs };
}

(async () => {
  await new Promise(r => srv.listen(8993, r));
  const b = await chromium.launch({ headless: true });

  /* 1. Relic numbers + naming in the raw data model. */
  { const { ctx, p, errs } = await open(b);
    const out = await p.evaluate(() => ({
      ollieFlag: TIPS.ollie[0].note,
      tinyLeiaFlag: TIPS.tiny[0].note,
      tinyReenterTitle: TIPS.tiny[1].t,
      tinyReenterFlag: TIPS.tiny[1].note,
      tinyMandoFlag: TIPS.tiny[8].t,
      tinyGmlTitle: TIPS.tiny[3].t,
      tinyGearFlag: TIPS.tiny[4].t + " | " + TIPS.tiny[4].note,
      glReyNote: META_SQUADS.find(m => m.name === "Rey (GL) Jedi").notes,
      trayaNote: META_SQUADS.find(m => m.name === "Darth Traya Sith").notes,
      gideonNote: META_SQUADS.find(m => m.name === "Dark Trooper Moff Gideon Empire").notes,
      slkrDefChars: GAC_COUNTERS.find(g => g.def.includes("Supreme Leader Kylo Ren")).defChars,
      rottaCounterWhy: GAC_COUNTERS.find(g => g.def.includes("Rotta")).why,
      rottaTl5v5: tierListEntry("5v5", "Rotta the Hutt"),
      rottaTl3v3: tierListEntry("3v3", "Rotta the Hutt"),
      trayaTl: tierListEntry("5v5", "Darth Traya") || tierListEntry("3v3", "Darth Traya"),
      metaFleetEndurance: META_FLEET_TIER.find(f => f.name === "Endurance").tier,
      metaFleetHomeOne: META_FLEET_TIER.find(f => f.name === "Home One").tier,
    }));
    ck("Ollie GL relic numbers fixed (R8/R9/R9)", /Rey \(R8\), Supreme Leader Kylo Ren \(R9\) and Jabba the Hutt \(R9\)/.test(out.ollieFlag), out.ollieFlag);
    ck("Tiny GL Leia relic fixed (R0 not R1)", /R0, G9/.test(out.tinyLeiaFlag), out.tinyLeiaFlag);
    ck("Tiny re-enter GAC relic numbers fixed (Rey R8, SLKR R8, Bo-Katan R8)", /Rey R8, SLKR R8/.test(out.tinyReenterTitle) && /Bo-Katan Mand'alor \(R8/.test(out.tinyReenterFlag), out.tinyReenterTitle + " | " + out.tinyReenterFlag);
    ck("Tiny Mandalorian squad note fixed (R8 not R10)", /Bo-Katan Mand'alor R8/.test(out.tinyMandoFlag), out.tinyMandoFlag);
    ck("GRANDMASTERLUKE renamed to Jedi Master Luke Skywalker in TIPS", out.tinyGmlTitle === "Jedi Master Luke Skywalker is the clear next target — 6 of 14 requirements already met", out.tinyGmlTitle);
    ck("Gear-blocked count corrected to five, including Leia & Wedge", /^Five Jedi Master Luke units/.test(out.tinyGearFlag) && /Princess Leia \(G8\)/.test(out.tinyGearFlag) && /Wedge Antilles \(G8\)/.test(out.tinyGearFlag), out.tinyGearFlag);
    ck("GL Rey tier-list note corrected (she appears as plain 'Rey')", /DOES still appear/.test(out.glReyNote) && !/no longer appears at all/.test(out.glReyNote), out.glReyNote);
    ck("Darth Traya note now flags the tier claim as unconfirmed", /same-day re-check could not find/.test(out.trayaNote), out.trayaNote);
    ck("Dark Trooper Moff Gideon note now flags the tier claim as unconfirmed", /same-day re-check could not find/.test(out.gideonNote), out.gideonNote);
    ck("GAC_COUNTERS SLKR defChars corrected to live composition", out.slkrDefChars === "SLKR, Rey (Dark Side Vision), Kylo Ren (Unmasked), General Hux, Sith Trooper", out.slkrDefChars);
    ck("GAC_COUNTERS Rotta tier claim corrected (A-tier 3v3, B-tier 5v5)", /A-tier 3v3, B-tier 5v5/.test(out.rottaCounterWhy), out.rottaCounterWhy);
    ck("Rotta the Hutt now resolves in TIER_LIST (5v5 B, 3v3 A)", out.rottaTl5v5 && out.rottaTl5v5.tier === "B" && out.rottaTl3v3 && out.rottaTl3v3.tier === "A", JSON.stringify({ v5: out.rottaTl5v5, v3: out.rottaTl3v3 }));
    ck("Darth Traya still correctly absent from TIER_LIST (unverified, not fabricated)", out.trayaTl === null, JSON.stringify(out.trayaTl));
    ck("META_FLEET_TIER Endurance/Home One corrected (C/B)", out.metaFleetEndurance === "C" && out.metaFleetHomeOne === "B", JSON.stringify({ e: out.metaFleetEndurance, h: out.metaFleetHomeOne }));
    ck("no boot errors", errs.length === 0, JSON.stringify(errs));
    await ctx.close(); }

  /* 2. Darth Bane must never appear in Recommended Defense (his mode says do-not-use-on-defense). */
  { const { ctx, p, errs } = await open(b, "gac");
    const out = await p.evaluate(() => {
      const d = gacDefenseForAccount("ollie");
      const d2 = gacDefenseForAccount("tiny");
      return { anyBaneOllie: d.squads.some(x => x.sq.name.includes("Darth Bane")), anyBaneTiny: d2.squads.some(x => x.sq.name.includes("Darth Bane")) };
    });
    ck("Darth Bane excluded from Recommended Defense for both accounts", !out.anyBaneOllie && !out.anyBaneTiny, JSON.stringify(out));
    ck("no runtime errors rendering GAC tab", errs.length === 0, JSON.stringify(errs));
    await ctx.close(); }

  /* 3. Roster Gap Radar now surfaces confidence/notes/sources on a MODERATE-confidence squad card. */
  { const { ctx, p, errs } = await open(b, "gaps");
    await p.evaluate(() => { const el = [...document.querySelectorAll("#gapsNav *")].find(e => e.textContent.trim() === "All squads"); if (el) el.click(); });
    await p.waitForTimeout(300);
    const out = await p.evaluate(() => document.getElementById("pane-gaps").innerText);
    ck("Roster Gap Radar shows a confidence chip/notes for Darth Bane's flagged squad", out.includes("MODERATE") && /do not use on defense|Talon \+ Savage Opress/.test(out), out.slice(out.indexOf("Darth Bane") - 20, out.indexOf("Darth Bane") + 400));
    ck("no runtime errors rendering Roster Gap Radar tab", errs.length === 0, JSON.stringify(errs));
    await ctx.close(); }

  /* 4. Conquest Teva feat progress denominator corrected (checked in the raw plan data — day 6's text is
     what carries this line, not necessarily whichever day the fixture's current-day pointer renders). */
  { const { ctx, p, errs } = await open(b, "conquest");
    const out = await p.evaluate(() => CQDATA.plan.days["6"]);
    ck("Conquest Teva progress denominator corrected to 4/10", out.includes("Teva 4/10") && !out.includes("Teva 4/8"), out.includes("Teva 4/10") ? "found 4/10" : "not found");
    ck("no runtime errors rendering Conquest tab", errs.length === 0, JSON.stringify(errs));
    await ctx.close(); }

  await b.close(); srv.close();
  const f = R.filter(r => !r.pass);
  console.log(JSON.stringify({ passed: R.length - f.length, failed: f.length, results: R }, null, 2));
})().catch(e => { console.error("FATAL", e && e.stack || e); srv.close(); process.exit(1); });
