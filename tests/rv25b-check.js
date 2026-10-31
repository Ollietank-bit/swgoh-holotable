/* rv25b-check — the 25 Oct 2026 live-read update (swgoh.gg read directly in the owner's Chrome; ref25/live-read-25oct.md). New facts only:
     1. Tier lists verified unchanged: TIER_LIST.updated + the fleet category asOf = 25 Oct 2026, "tierlist" + "meta-fleets" registry = 2026-10-25, the rows themselves untouched
        (first 5v5 / 3v3 / fleet rows spot-checked), the DEFENCE-board lines in GAC_COUNTERS keep their 22 Oct dates (not re-read), registry = exactly 24 entries.
     2. Datacrons: Sets 33-36 with names, numbers, expiry dates AND AEDT clock times (18:00 / 19:00 / 19:00 / 19:00), no Set 37; the Intel tab prints the times; the Next-up tile
        carries the time and no longer says "unverified"; "datacrons" registry = 25 Oct.
     3. Events seed v11 (38 rows, CAPTURED 25 Oct): TW attack phase ends 26 Oct 05:00, the Conquest run 26 Oct 05:00 -> 9 Nov 05:00, the Territory Battle 27 Oct 04:00 -> 2 Nov 04:00,
        bonus drops, Adelphi Ranger Era Challenge 28 Oct -> 4 Nov, Mirrored Paths ends 30 Oct 05:00, Places of Power, Stardust Transmission 31 Oct -> 1 Nov 18:00, B1 marquee 4 Nov 05:00,
        datacron expiries, Mini-Era end 18 Nov 06:00 AEDT, predicted rows labelled; GAC is NOT in the seed and S85 stays est.
     4. B1 marquee date is SOURCED everywhere it appears (events row, ERA_NOW, MGL note, Droid Destruction rows), while "the raid's unit IS this marquee" stays INFERRED.
     5. Conquest: the 26 Oct run is sourced (Today strip / Conquest tab / Next-up tile wording at 25 Oct and on day 1 of the run), the 14-on / 14-off count is called an inference.
     6. TB / TW: the notes on the TB Guide and TW tabs (countdowns at pinned clocks, 'over' afterwards), escapeHtml on every dynamic string.
     7. No new localStorage key; the registry still has 24 entries; zero page errors; no overflow at 390/1280; screenshots in ../shots/.
   Run: cd DIR && NODE_PATH=... FILE=DIR/index.html PORT=9xxx node tests/rv25b-check.js   (no SNAP_DATE needed; the clock is pinned per context) */
const L = require("./lib.js");
const { ck } = L;
const AEDT = (mo, d, h, m) => Date.UTC(2026, mo - 1, d, h - 11, m || 0);   // 2026-<mo>-<d> h:m AEDT (UTC+11) as epoch ms
const READ = AEDT(11, 1, 12);                                            // rv31: Sun 1 Nov 2026 12:00 AEDT (was Sun 25 Oct 16:00 AEDT, when the earlier schedule was read)
const SHOTS = L.path.join(L.ROOT, "shots");
try { L.fs.mkdirSync(SHOTS, { recursive: true }); } catch (e) {}

async function openAt(b, o) {
  o = o || {};
  const ctx = await b.newContext({ viewport: { width: o.width || 1280, height: o.height || 1000 }, timezoneId: "Australia/Sydney", locale: "en-AU" });
  await ctx.clock.setFixedTime(o.at || READ);
  await ctx.addInitScript(([s, pl, seedKey]) => {
    try { if (!sessionStorage.getItem(seedKey)) { localStorage.clear(); localStorage.setItem("swgoh-tracker", s); localStorage.setItem("swgoh-holotable-pulls-v1", pl); sessionStorage.setItem(seedKey, "1"); } } catch (e) {}
  }, [o.state || L.REAL, L.PULLS, "seeded-" + (o.tag || "x")]);
  await ctx.route(/fonts\.g|swgoh\.gg|swgohrote\.com|corsproxy|allorigins|codetabs|api\.github/, r => r.abort());
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push(String(e).slice(0, 300)));
  p.on("console", m => { if (m.type() === "error" && !/Failed to load resource|net::ERR|fonts\.g/.test(m.text())) errs.push("console: " + m.text().slice(0, 200)); });
  await p.goto(`http://127.0.0.1:${L.PORT}/x.html`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(900);
  return { ctx, p, errs };
}

(async () => {
  const srv = await L.serve(); const b = await L.chromium.launch({ headless: true });
  const allErrs = [];

  /* ---------- 1. pure data: tier lists, registry, datacrons, seed, B1, Conquest ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "pure" });
    const c = await p.evaluate(() => {
      const by = n => EVENTS_SEED.find(e => e.name === n) || null, reg = Object.fromEntries(SNAPSHOTS.map(s => [s.key, s.asOf]));
      const cat = k => TIER_LIST.categories.find(x => x.key === k);
      return {
        now: new Date().toString(), updated: TIER_LIST.updated, fleetAsOf: cat("fleet").asOf, fleetN: cat("fleet").squads.length,
        t5: cat("5v5").squads.slice(0, 3).map(s => [s.leader, s.tier, s.wr, s.battles]), t3: cat("3v3").squads.slice(0, 2).map(s => [s.leader, s.wr, s.battles]),
        fl: cat("fleet").squads.slice(0, 2).map(s => [s.leader, s.tier, s.wr, s.battles]), t5n: cat("5v5").squads.length, t5season: cat("5v5").season, t3season: cat("3v3").season,
        reg, regN: SNAPSHOTS.length, regUnique: new Set(SNAPSHOTS.map(s => s.key)).size,
        counters22: GAC_COUNTERS.filter(x => /Update 22 Oct 2026 \(swgoh\.gg 5v5 DEFENCE board/.test(x.why)).length, countersAny25: GAC_COUNTERS.some(x => /25 Oct/.test(x.why)),
        dc: DATACRON_SETS.map(d => [d.n, d.name, d.expires, d.time]), dcTz: DATACRON_TZ, nxtDc: NXT_DATACRON_EXPIRY,
        seed: EVENTS_SEED.map(e => ({ name: e.name, cat: e.cat, date: e.date, ends: e.ends || "", note: e.note })), ver: EVENTS_SEED_VERSION, cap: EVENTS_SEED_CAPTURED, stateVer: state.eventsSeedVersion,
        sorted: EVENTS_SEED.every((e, i) => !i || e.date >= EVENTS_SEED[i - 1].date), catKeys: Object.keys(EVENT_CAT_CHIP),
        era: { end: ERA_NOW.end, aedt: ERA_NOW.endAedt, facts: ERA_NOW.facts }, b1raid: DROID_RAID.ELIGIBLE.find(e => e.name === "B1 Battle Droid"),
        mgl: (GL_QUEUE.watch.MANDOGROGU || {}).note || "", caveat: CQ_RUN_CAVEAT, cq: { kt: CQDATA.knownThrough, anchor: CQDATA.cycle.anchor, cap: CQDATA.captured },
        gacS85: GAC_SCHEDULE.events.filter(e => e.season === 85).map(e => [e.start, !!e.est]), gacAsOf: GAC_SCHEDULE.asOf, pro: CAP_JOURNEYS[1].when, capAsOf: CAP_ASOF,
        terr: { asOf: TERRITORY.asOf, twEnd: new Date(TERRITORY.tw.endMs).toISOString(), twSignup: new Date(TERRITORY.tw.signupMs).toISOString(), twStart: new Date(TERRITORY.tw.startMs).toISOString(), tbStart: new Date(TERRITORY.tb.startMs).toISOString(), tbEnd: new Date(TERRITORY.tb.endMs).toISOString() },
        sd: by("Stardust Transmission"), rawKeys: [...new Set((document.documentElement.outerHTML.match(/"swgoh-[a-z0-9-]*"/g) || []))]
      };
    });
    ck("clock pinned to Sun 1 Nov 2026 12:00 AEDT", /Sun Nov 01 2026 12:00/.test(c.now), c.now);
    ck("TIER_LIST.updated = 1 Nov 2026 and the Fleet category asOf = 1 Nov 2026 (rv31: top ~30 5v5 / ~12 3v3 / first 6 fleet rows re-read)", c.updated === "1 Nov 2026" && c.fleetAsOf === "1 Nov 2026", JSON.stringify([c.updated, c.fleetAsOf]));
    ck("tier rows (rv31): 5v5 Season 84 top 2 (Kylo 91.4/134K, The Stranger 90.1/35.1K, …), 57 rows; 3v3 Season 83 (The Stranger 91.2/86.4K first); fleet 11 rows (Leviathan S 96.6/44.7K, Profundity A 98.6/50.6K)",
      c.t5season === 84 && c.t3season === 83 && c.t5n === 57 && c.t5[0][0] === "Supreme Leader Kylo Ren" && c.t5[0][2] === 91.4 && c.t5[0][3] === "134K" && c.t5[1][0] === "The Stranger" && c.t5[1][3] === "35.1K" && c.t3[0][0] === "The Stranger" && c.t3[0][1] === 91.2 && c.t3[0][2] === "86.4K"
      && c.fleetN === 11 && JSON.stringify(c.fl) === JSON.stringify([["Leviathan", "S", 96.6, "44.7K"], ["Profundity", "A", 98.6, "50.6K"]]), JSON.stringify([c.t5, c.t3, c.fl]));
    ck("registry: still exactly 24 unique entries; tierlist + meta-fleets + datacrons + events = 2026-11-01", c.regN === 24 && c.regUnique === 24 && ["tierlist", "meta-fleets", "datacrons", "events"].every(k => c.reg[k] === "2026-11-01"), JSON.stringify([c.regN, c.reg.tierlist, c.reg["meta-fleets"], c.reg.datacrons, c.reg.events]));
    ck("NOT re-verified, so NOT bumped: the defence boards (GAC_COUNTERS lines keep 'Update 22 Oct 2026', none says 25 Oct or 1 Nov), gac-counters 27 Sep, cap-journeys 22 Oct, conquest 27 Sep, executor-event 22 Oct (rv31: gac-schedule moved to 2026-11-01, see the GAC check below)",
      c.counters22 >= 10 && !c.countersAny25 && c.reg["gac-counters"] === "2026-09-27" && c.reg["gac-schedule"] === "2026-11-01" && c.reg["cap-journeys"] === "2026-10-22" && c.reg.conquest === "2026-09-27" && c.reg["executor-event"] === "2026-10-22", JSON.stringify([c.counters22, c.reg]));
    ck("datacrons: Set 36 The Legend Codex 20 Jan 2027 19:00, 35 Duty and Defiance 24 Dec 19:00, 34 The Art of Command 26 Nov 19:00, 33 Supremacy Directive 29 Oct 18:00 (AEDT); no Set 37",
      JSON.stringify(c.dc) === JSON.stringify([[36, "The Legend Codex", "2027-01-20", "19:00"], [35, "Duty and Defiance", "2026-12-24", "19:00"], [34, "The Art of Command", "2026-11-26", "19:00"], [33, "Supremacy Directive", "2026-10-29", "18:00"]]) && c.dcTz === "AEDT"
      && !c.dc.some(d => d[0] === 37) && JSON.stringify(c.nxtDc) === JSON.stringify({ 33: "2026-10-29", 34: "2026-11-26", 35: "2026-12-24", 36: "2027-01-20" }), JSON.stringify(c.dc));
    const by = Object.fromEntries(c.seed.map(r => [r.name, r]));
    ck("EVENTS_SEED_VERSION 12 (rv31), EVENTS_SEED_CAPTURED '1 Nov 2026', 40 rows in date order, saved state reseeded to 12, every category known to EVENT_CAT_CHIP (incl. Grand Arena)", c.ver === 12 && c.cap === "1 Nov 2026" && c.seed.length === 40 && c.sorted && c.stateVer === 12 && c.seed.every(r => c.catKeys.includes(r.cat)), JSON.stringify([c.ver, c.cap, c.seed.length, c.stateVer]));
    const tw = by["Territory War — attack phase"], tws = by["Territory War — sign-up"], tb = by["Territory Battle — Rise of the Empire"], cq = by["Conquest 25 (Embo & Keibu) — run 26 Oct → 9 Nov"];
    ck("Territory War (rv31): sign-up 2 Nov 07:00 -> 4 Nov 06:00 AEDT (last live day 3 Nov), attack phase 4 Nov 06:00 -> 5 Nov 06:00 AEDT (last live day 4 Nov)", tw && tws && tw.cat === "Territory War" && tw.date === "2026-11-04" && tw.ends === "2026-11-04" && /4 Nov 06:00 AEDT/.test(tw.note) && /5 Nov 06:00 AEDT/.test(tw.note) && tws.cat === "Territory War" && tws.date === "2026-11-02" && tws.ends === "2026-11-03" && /2 Nov 07:00 AEDT/.test(tws.note) && /4 Nov 06:00 AEDT/.test(tws.note), JSON.stringify([tws, tw]).slice(0, 400));
    ck("Territory Battle Rise of the Empire (Geonosis: Republic Offensive · Hoth: Rebel Assault): 6 days, 27 Oct 04:00 -> 2 Nov 04:00 AEDT (last live day 1 Nov)", tb && tb.cat === "Territory Battle" && tb.date === "2026-10-27" && tb.ends === "2026-11-01" && /Geonosis: Republic Offensive · Hoth: Rebel Assault/.test(tb.note) && /6 days/.test(tb.note) && /27 Oct 04:00 AEDT/.test(tb.note) && /2 Nov 04:00 AEDT/.test(tb.note), JSON.stringify(tb));
    ck("Conquest 25 run: 26 Oct 05:00 -> 9 Nov 05:00 AEDT sourced (last live day 8 Nov); the 'listed end' row and the 8 Nov-only date are gone", cq && cq.date === "2026-10-26" && cq.ends === "2026-11-08" && /ends Nov 9, 5:00 AM/.test(cq.note) && !by["Conquest 25 (Embo & Keibu) — listed end"], JSON.stringify(cq));
    ck("rv31: bonus drops wave 6 is 3 Nov 11:00 -> 6 Nov 11:00 (wave 4 and Mirrored Paths are gone), Era Challenge 28 Oct 05:00 -> 4 Nov 05:00, Places of Power ends 1 Nov 18:00 (+ a second run 4 Nov), Stardust Transmission 31 Oct -> 1 Nov 18:00",
      !by["Bonus drops (additive drops, wave 4)"] && !by["Mirrored Paths"] && by["Bonus drops (additive drops, wave 6)"].date === "2026-11-03" && by["Bonus drops (additive drops, wave 6)"].ends === "2026-11-06" && /3 Nov 11:00 → 6 Nov 11:00 AEDT/.test(by["Bonus drops (additive drops, wave 6)"].note)
      && by["Adelphi Ranger Era Challenge"].date === "2026-10-28" && by["Adelphi Ranger Era Challenge"].ends === "2026-11-03" && /4 Nov 05:00 AEDT/.test(by["Adelphi Ranger Era Challenge"].note)
      && /1 Nov 18:00 AEDT/.test(by["Places of Power"].note) && by["Places of Power (second run)"].date === "2026-11-04" && by["Places of Power (second run)"].ends === "2026-11-05"
      && by["Stardust Transmission"].date === "2026-10-31" && by["Stardust Transmission"].ends === "2026-11-01" && /1 Nov 18:00 AEDT/.test(by["Stardust Transmission"].note), "");
    ck("B1 marquee 4 Nov 05:00 AEDT is SCHEDULED (swgoh.gg/schedule/), no '(est.)', no 'INFERRED' about the date; Mini-Era ends 18 Nov 06:00 AEDT (last live day 17 Nov)",
      by["Mercenary Guard Droid (B1)"] && by["Mercenary Guard Droid (B1)"].date === "2026-11-04" && /4 Nov 05:00 AEDT/.test(by["Mercenary Guard Droid (B1)"].note) && /SCHEDULED, not predicted/.test(by["Mercenary Guard Droid (B1)"].note) && !by["Mercenary Guard Droid (B1) (est.)"] && !/≈ INFERRED/.test(by["Mercenary Guard Droid (B1)"].note)
      && by["Era 10 — The Mandalorian and Grogu (Mini-Era)"].ends === "2026-11-17" && /18 Nov 06:00 AEDT/.test(by["Era 10 — The Mandalorian and Grogu (Mini-Era)"].note) && /17 Nov 19:00 UTC/.test(by["Era 10 — The Mandalorian and Grogu (Mini-Era)"].note), "");
    ck("datacron rows (rv31): Set 33 is a past 'expired' record row (EXPIRED 29 Oct 18:00 AEDT, no 'expires' row left), 34: 26 Nov 19:00; 35: 24 Dec 19:00; 36: 20 Jan 2027 19:00, each said to be read 25 Oct and again 1 Nov (Set 33's row: read 1 Nov)",
      !by["Datacron Set 33 expires"] && /EXPIRED 29 Oct 18:00 AEDT/.test(by["Datacron Set 33 expired"].note) && /read 1 Nov/.test(by["Datacron Set 33 expired"].note) && /26 Nov 19:00 AEDT/.test(by["Datacron Set 34 expires"].note) && /24 Dec 19:00 AEDT/.test(by["Datacron Set 35 expires"].note) && /20 Jan 2027 19:00 AEDT/.test(by["Datacron Set 36 expires"].note) && c.seed.filter(r => /^Datacron Set (34|35|36) expires$/.test(r.name)).length === 3 && c.seed.filter(r => /^Datacron Set (34|35|36) expires$/.test(r.name)).every(r => /read 25 Oct and again 1 Nov/.test(r.note)), "");
    const preds = c.seed.filter(r => /\(predicted\)$/.test(r.name));
    ck("13 predicted nodes / mythics / releases (Mara Jade node gone as over), each named '(predicted)' and opening 'PREDICTED by swgoh.gg (not scheduled by CG)'; none is an est. row", preds.length === 13 && preds.every(r => /^PREDICTED by swgoh\.gg \(not scheduled by CG\)/.test(r.note)) && !c.seed.some(r => /\(est\.\)/.test(r.name)), preds.map(r => r.name).join(" | "));
    ck("rv31: the over rows are gone (Smuggler's Run, Endor, Ground War, Galactic Bounties I as a live row [only the 26 Dec predicted rerun is left], Coven, Duel of the Fates, Ghosts); Credit Heist (1 Nov -> 2 Nov 22:00) and Training Droid Smuggling (3 Nov -> 4 Nov 22:00) are listed again by the 1 Nov schedule; Executor event stays derived (not a seed row)",
      !by["Smuggler's Run"] && !by["Endor"] && !by["Ground War"] && !by["Galactic Bounties I"] && !by["Coven of Shadows"] && !by["Duel of the Fates"] && !by["Ghosts of Dathomir"] && !!by["Galactic Bounties I (predicted)"] && by["Credit Heist"].date === "2026-11-01" && by["Credit Heist"].ends === "2026-11-02" && /2 Nov 22:00 AEDT/.test(by["Credit Heist"].note) && by["Training Droid Smuggling"].date === "2026-11-03" && by["Training Droid Smuggling"].ends === "2026-11-04" && /4 Nov 22:00 AEDT/.test(by["Training Droid Smuggling"].note) && !c.seed.some(r => /Discarded Doctrine/.test(r.name)), "");
    ck("rv31: GAC Season 85 IS a seed row now (Grand Arena, 4 Nov -> 26 Nov, 3v3, 'SCHEDULED, no longer an estimate'); GAC_SCHEDULE: S85E1 4 Nov est:false, E2/E3 (11 / 18 Nov) still est:true, GAC_SCHEDULE.asOf 2026-11-01",
      by["GAC Season 85 (3v3)"] && by["GAC Season 85 (3v3)"].cat === "Grand Arena" && by["GAC Season 85 (3v3)"].date === "2026-11-04" && by["GAC Season 85 (3v3)"].ends === "2026-11-26" && /now SCHEDULED, no longer an estimate/.test(by["GAC Season 85 (3v3)"].note) && /Season 86 and later are NOT on the schedule/.test(by["GAC Season 85 (3v3)"].note) && JSON.stringify(c.gacS85) === JSON.stringify([["2026-11-04", false], ["2026-11-11", true], ["2026-11-18", true]]) && c.gacAsOf === "2026-11-01", JSON.stringify(c.gacS85));
    ck("Mini-Era data: ERA_NOW.end stays the last live day 2026-11-17, endAedt '18 Nov 06:00 AEDT', facts say both; B1 marquee fact says 4 Nov 05:00 AEDT and no longer 'inferred'", c.era.end === "2026-11-17" && c.era.aedt === "18 Nov 06:00 AEDT" && c.era.facts.some(f => /18 Nov 06:00 AEDT/.test(f) && /17 Nov 19:00 UTC/.test(f)) && c.era.facts.some(f => /Mercenary Guard Droid \(B1\) on 4 Nov 05:00 AEDT \(listed as scheduled on swgoh\.gg\/schedule\//.test(f) && !/~4 Nov/.test(f) && !/AEDT, inferred\)/.test(f)), JSON.stringify(c.era.facts.slice(0, 3)));
    ck("Droid Destruction + MGL copy: the B1 marquee date is sourced (4 Nov 05:00 AEDT, swgoh.gg/schedule/), while 'the raid's B1 IS the marquee' stays INFERRED, id stays null + unconfirmed",
      c.b1raid && c.b1raid.id === null && c.b1raid.unconfirmed === true && /4 Nov 05:00 AEDT/.test(c.b1raid.why) && /swgoh\.gg\/schedule\//.test(c.b1raid.why) && /INFERRED/.test(c.b1raid.why) && !/~4 Nov/.test(c.b1raid.why) && /B1's is 4 Nov 05:00 AEDT/.test(c.mgl) && !/~2 weeks later \(inferred\)/.test(c.mgl), (c.b1raid || {}).why);
    ck("Conquest: CQ_RUN_CAVEAT is dated 25 Oct and names the sourced run, the 3rd-run count, the 28 Sep – 8 Nov span and the UNVERIFIED rest; model data untouched (anchor 28 Sep, knownThrough 7 Dec, captured 27 Sep)",
      c.caveat.asOf === "2026-10-25" && c.caveat.sourcedStart === "2026-10-26" && /26 Oct 05:00 to 9 Nov 05:00 AEDT/.test(c.caveat.text) && /3rd run/.test(c.caveat.text) && /28 Sep – 8 Nov/.test(c.caveat.text) && /UNVERIFIED/.test(c.caveat.text) && /contradicts/.test(c.caveat.text)
      && c.cq.anchor === "2026-09-28" && c.cq.kt === "2026-12-07" && c.cq.cap === "27 Sep 2026", c.caveat.text);
    ck("Profundity's Stardust Transmission is DATED in the capital-journey card (31 Oct 6:00 PM -> 1 Nov 18:00 AEDT), the 15 Oct in-game screen is still quoted, and CAP_ASOF is NOT moved (prerequisites are the 15 Oct screenshots)",
      /DATED since 25 Oct/.test(c.pro) && /31 Oct/.test(c.pro) && /1 Nov 18:00 AEDT/.test(c.pro) && /EVENT CURRENTLY UNAVAILABLE/.test(c.pro) && c.capAsOf === "2026-10-22", c.pro);
    ck("TERRITORY data is absolute UTC (rv31): TW sign-up opens 2026-11-01T20:00Z (2 Nov 07:00 AEDT), attack phase opens 2026-11-03T19:00Z (4 Nov 06:00 AEDT) and ends 2026-11-04T19:00Z (5 Nov 06:00 AEDT); TB 2026-10-26T17:00Z (27 Oct 04:00 AEDT) -> 2026-11-01T17:00Z (2 Nov 04:00 AEDT); asOf 2026-11-01", c.terr.twEnd === "2026-11-04T19:00:00.000Z" && c.terr.twSignup === "2026-11-01T20:00:00.000Z" && c.terr.twStart === "2026-11-03T19:00:00.000Z" && c.terr.tbStart === "2026-10-26T17:00:00.000Z" && c.terr.tbEnd === "2026-11-01T17:00:00.000Z" && c.terr.asOf === "2026-11-01", JSON.stringify(c.terr));
    ck("no new localStorage key: the only 'swgoh-…' key literals in the file are the 11 existing ones", JSON.stringify(c.rawKeys.slice().sort()) === JSON.stringify(["\"swgoh-holotable-active-account-v1\"", "\"swgoh-holotable-base-v1\"", "\"swgoh-holotable-conflict-v1\"", "\"swgoh-holotable-device-v1\"", "\"swgoh-holotable-guard-v1\"", "\"swgoh-holotable-opponents-v1\"", "\"swgoh-holotable-pulls-v1\"", "\"swgoh-holotable-rollback-v1\"", "\"swgoh-holotable-sync-cfg-v1\"", "\"swgoh-holotable-watermark-v1\"", "\"swgoh-tracker\""]), JSON.stringify(c.rawKeys));
    ck("zero page errors (pure)", errs.length === 0, JSON.stringify(errs)); allErrs.push(...errs); await ctx.close();
  }

  /* ---------- 2. rendered: Events, Intel › Datacrons, TB Guide, TW, Conquest, Today, Next up — at 1280 and 390 ---------- */
  for (const w of [1280, 390]) {
    const { ctx, p, errs } = await openAt(b, { width: w, tag: "ui" + w });
    for (const acct of ["ollie", "tiny"]) {
      /* Events: the new rows are listed with the right "when" labels at the read time */
      await L.go(p, acct, "events");
      await p.evaluate(() => { state.views.events = "all"; renderEvents(); }); await p.waitForTimeout(150);
      const rows = await p.evaluate(() => [...document.querySelectorAll("#eventsGrid .form-row.cqline-event")].map(r => ({ label: r.children[0].textContent.trim(), name: (r.querySelector(".form-field .txt") || {}).textContent.trim(), cat: (r.querySelector(".chip") || { textContent: "" }).textContent.trim() })));
      const row = n => rows.find(r => r.name === n) || {};
      ck(`[${w}] ${acct}: All events lists 41 rows (40 seed + the auto Executor row); Territory Battle 'Ends today' with a Territory Battle chip, Territory War sign-up 'Tomorrow', B1 marquee and GAC Season 85 'in 3d', Mythic: Pieces and Plans 'in 9d'`, rows.length === 41 && row("Territory Battle — Rise of the Empire").label === "Ends today" && /Territory Battle/.test(row("Territory Battle — Rise of the Empire").cat) && row("Territory War — sign-up").label === "Tomorrow" && /Territory War/.test(row("Territory War — sign-up").cat) && row("Mercenary Guard Droid (B1)").label === "in 3d" && row("GAC Season 85 (3v3)").label === "in 3d" && /Grand Arena/.test(row("GAC Season 85 (3v3)").cat) && row("Mythic: Pieces and Plans (predicted)").label === "in 9d", JSON.stringify(rows.slice(0, 6)));
      const intro = await p.evaluate(() => document.querySelector("#pane-events .mnote").textContent.replace(/\s+/g, " "));
      ck(`[${w}] ${acct}: the Events intro says swgoh.gg/schedule/ (AEDT), predicted rows are swgoh.gg's own predictions, and no longer says 'TW/TB timing ... aren't on a public feed'`, /swgoh\.gg\/schedule\//.test(intro) && /AEDT/.test(intro) && /predicted/.test(intro) && !/guild-specific TW\/TB timing and GAC seasons aren't on a public feed/.test(await p.evaluate(() => document.querySelector("#pane-events .h2sub").textContent)), intro.slice(0, 160));
      const oE = await L.overflow(p);
      ck(`[${w}] ${acct}: Events tab (All events, long notes) no horizontal overflow`, oE.doc <= oE.inner + 1, JSON.stringify(oE));
      if (acct === "ollie") { await p.evaluate(() => { state.views.events = "next"; renderEvents(); }); await p.waitForTimeout(120); await p.screenshot({ path: `${SHOTS}/rv25b-events-next-${w}.png`, fullPage: true });
        await p.evaluate(() => { state.views.events = "all"; renderEvents(); }); await p.waitForTimeout(120); await p.screenshot({ path: `${SHOTS}/rv25b-events-all-${w}.png`, fullPage: true }); }

      /* Intel › Datacrons */
      await L.go(p, acct, "intel");
      await p.evaluate(() => { state.views.intel = "datacrons"; render(); }); await p.waitForTimeout(250);
      const dc = await p.evaluate(() => (document.querySelector(".dc-sets") || { textContent: "" }).textContent.replace(/\s+/g, " "));
      ck(`[${w}] ${acct}: Intel › Datacrons (rv31): three ACTIVE sets with AEDT times, 'read 1 Nov', Set 33 listed under Expired with its 29 Oct 18:00 AEDT time and the unverified-behaviour caveat, no Set 37`, /read 1 Nov 2026/.test(dc) && /#36 “The Legend Codex”/.test(dc) && /20 Jan 2027 19:00 AEDT/.test(dc) && /#35 “Duty and Defiance”/.test(dc) && /24 Dec 2026 19:00 AEDT/.test(dc) && /#34 “The Art of Command”/.test(dc) && /26 Nov 2026 19:00 AEDT/.test(dc) && /Expired: #33 “Supremacy Directive” — expired 29 Oct 2026 18:00 AEDT/.test(dc) && !/Active sets[^.]*#33/.test(dc.split("Expired:")[0]) && /unverified/.test(dc) && /No Set 37/.test(dc) && !/#37/.test(dc) && /6 focused variants/.test(dc) && /9 focused variants/.test(dc), dc.slice(0, 300));
      const oD = await L.overflow(p);
      ck(`[${w}] ${acct}: Datacrons view no horizontal overflow`, oD.doc <= oD.inner + 1, JSON.stringify(oD));
      if (acct === "ollie") await p.screenshot({ path: `${SHOTS}/rv25b-datacrons-${w}.png`, fullPage: true });

      /* TB Guide + TW */
      await L.go(p, acct, "tb");
      const tbn = await p.evaluate(() => (document.querySelector("#tbSched .terr-note") || { textContent: "" }).textContent.replace(/\s+/g, " "));
      ck(`[${w}] ${acct}: TB Guide shows the sourced window — Rise of the Empire (Geonosis: Republic Offensive · Hoth: Rebel Assault), 6 days, Tue 27 Oct 04:00 AEDT -> Mon 2 Nov 04:00 AEDT, 'live, ends in 16h 0m' at the 1 Nov read time (rv31)`, /Territory Battle — Rise of the Empire/.test(tbn) && /Geonosis: Republic Offensive · Hoth: Rebel Assault/.test(tbn) && /6 days/.test(tbn) && /Tue 27 Oct 04:00 AEDT/.test(tbn) && /Mon 2 Nov 04:00 AEDT/.test(tbn) && /live, ends in 16h 0m/.test(tbn) && /read 1 Nov 2026/.test(tbn), tbn);
      const oT = await L.overflow(p);
      ck(`[${w}] ${acct}: TB Guide no horizontal overflow`, oT.doc <= oT.inner + 1, JSON.stringify(oT));
      if (acct === "ollie") await p.screenshot({ path: `${SHOTS}/rv25b-tb-${w}.png` });
      await L.go(p, acct, "tw");
      const twn = await p.evaluate(() => (document.querySelector("#twSched .terr-note") || { textContent: "" }).textContent.replace(/\s+/g, " "));
      ck(`[${w}] ${acct}: TW tab (rv31) shows sign-up opens Mon 2 Nov 07:00 AEDT, attack phase opens Wed 4 Nov 06:00 AEDT and ends Thu 5 Nov 06:00 AEDT, 'sign-up opens in 19h 0m' at the read time, no later TW listed`, /Territory War/.test(twn) && /sign-up opens Mon 2 Nov 07:00 AEDT/.test(twn) && /attack phase opens Wed 4 Nov 06:00 AEDT/.test(twn) && /ends Thu 5 Nov 06:00 AEDT/.test(twn) && /sign-up opens in 19h 0m/.test(twn) && /lists no later Territory War/.test(twn) && /read 1 Nov 2026/.test(twn), twn);
      const oW = await L.overflow(p);
      ck(`[${w}] ${acct}: TW tab no horizontal overflow`, oW.doc <= oW.inner + 1, JSON.stringify(oW));
      if (acct === "ollie") await p.screenshot({ path: `${SHOTS}/rv25b-tw-${w}.png` });

      /* Conquest tab + Today strip at the read time (run 1 ended, the sourced run starts tomorrow) + Next-up tiles */
      await L.go(p, acct, "conquest");
      const cqt = await p.evaluate(() => (document.querySelector(".cqrun") || { textContent: "" }).textContent.replace(/\s+/g, " "));
      ck(`[${w}] ${acct}: Conquest tab (rv31, day 7 of the sourced run) — 'Day 7 of 14 — live now', ends 9 Nov 05:00 AEDT (sourced, 3rd run, no run after it listed), the caveat (still dated 25 Oct) names the one sourced run, no stale 'unconfirmed' / 'expected from 26 Oct' wording`, /Day 7 of 14 — live now/.test(cqt) && /live 26 Oct – 8 Nov \(last live day\)/.test(cqt) && /swgoh\.gg's schedule ends it 9 Nov 05:00 AEDT and calls it the 3rd run/.test(cqt) && /no run after it is listed/.test(cqt) && /Run dates, 25 Oct: ONE run is sourced/.test(cqt) && !/expected from 26 Oct/.test(cqt) && !/unconfirmed/.test(cqt), cqt.slice(0, 260));
      await L.go(p, acct, "overview");
      const today = await p.evaluate(() => ({ cq: (document.querySelector(".today-cq .v") || { textContent: "" }).textContent, ev: (document.querySelector(".today-events .v") || { textContent: "" }).textContent.replace(/\s+/g, " "), tiles: [...document.querySelectorAll("#nxtStrip .nxt-tile")].map(t => ({ id: t.dataset.nxt, a: t.querySelector(".nxt-a").textContent, tag: (t.querySelector(".nxt-tag") || { textContent: "" }).textContent })) }));
      ck(`[${w}] ${acct}: Today strip (rv31) — Conquest line reads 'day 7 of 14, last live day 8 Nov (swgoh.gg schedule: ends 9 Nov 05:00 AEDT)'; events line has the Territory Battle, Places of Power and Stardust Transmission ending today and Credit Heist starting today`, today.cq === "Conquest 25 — day 7 of 14, last live day 8 Nov (swgoh.gg schedule: ends 9 Nov 05:00 AEDT)" && /Territory Battle — Rise of the Empire ends today/.test(today.ev) && /Places of Power ends today/.test(today.ev) && /Stardust Transmission ends today/.test(today.ev) && /Credit Heist starts today/.test(today.ev), JSON.stringify(today.cq + " || " + today.ev));
      const cqTile = today.tiles.find(t => /^cq-/.test(t.id)), dcTile = today.tiles.find(t => t.id === "dc-33");
      ck(`[${w}] ${acct}: Next-up (rv31) — the Conquest tile says 'Last live day Sun, 8 Nov · ends 9 Nov 05:00 AEDT (swgoh.gg schedule)'; the Set 33 datacron tile is GONE (expired 29 Oct, clock-based) and where a datacron tile fits (Tiny) it is Set 34 on 'Thu, 26 Nov 19:00 AEDT', untagged; the Rotta tile is untagged and says 3 Nov 06:00 AEDT (Ollie)`, cqTile && /Last live day Sun, 8 Nov · ends 9 Nov 05:00 AEDT \(swgoh\.gg schedule\)/.test(cqTile.a) && !dcTile && today.tiles.filter(t => /^dc-/.test(t.id)).every(t => t.id === "dc-34" && /26 Nov 19:00 AEDT/.test(t.a) && t.tag === "") && (acct !== "ollie" || today.tiles.some(t => /^rotta-2026-11-03$/.test(t.id) && /3 Nov 06:00 AEDT/.test(t.a) && t.tag === "")) && (acct !== "tiny" || today.tiles.some(t => t.id === "dc-34")), JSON.stringify(today.tiles));
      const strap = await p.evaluate(() => { const e = document.querySelector("[data-snap-era]"); return e ? e.textContent : ""; });
      ck(`[${w}] ${acct}: Modes strapline gives the Mini-Era end in both zones — 'to 17 Nov 2026' and 'ends 18 Nov 06:00 AEDT'`, /Mini-Era to 17 Nov 2026/.test(strap) && /ends 18 Nov 06:00 AEDT/.test(strap), strap);
    }
    ck(`[${w}] zero page errors`, errs.length === 0, JSON.stringify(errs.slice(0, 5))); allErrs.push(...errs);
    await ctx.close();
  }

  /* ---------- 3. clocks: TB/TW notes over time, the Conquest run live (day 2, 27 Oct) ---------- */
  {
    const probe = async (at, tag) => { const { ctx, p, errs } = await openAt(b, { at, tag }); const r = await p.evaluate(() => ({ tb: territoryNoteHtml("tb").replace(/<[^>]+>/g, ""), tw: territoryNoteHtml("tw").replace(/<[^>]+>/g, ""), cqLine: (() => { const rs = cqRunStatus(); return { live: rs.live, day: rs.day, start: rs.runStart, html: cqRunStatusHtml(rs).replace(/<[^>]+>/g, " ").replace(/\s+/g, " "), today: todayConquestLine() && todayConquestLine().replace(/<[^>]+>/g, "") }; })() })); allErrs.push(...errs); await ctx.close(); return r; };
    const a = await probe(AEDT(11, 4, 5, 59), "tw-last-minute"), b2 = await probe(AEDT(11, 5, 6, 1), "tw-over"), c = await probe(AEDT(10, 28, 12), "tb-live"), d = await probe(AEDT(11, 2, 5), "tb-over"), e = await probe(AEDT(10, 27, 12), "cq-live"), f = await probe(AEDT(11, 3, 12), "tw-signup-open"), g = await probe(AEDT(11, 4, 12), "tw-live");
    ck("TW (rv31): 3 Nov 12:00 AEDT 'sign-up is open; the attack phase opens in 18h 0m'; 4 Nov 05:59 'opens in 1m'; 4 Nov 12:00 'attack phase live, ends in 18h 0m' (5 Nov 06:00 AEDT); 5 Nov 06:01 'over' (was: live 'ends in 1m' at 26 Oct 04:59, 'over' at 05:01)", /sign-up is open; the attack phase opens in 18h 0m/.test(f.tw) && /the attack phase opens in 1m/.test(a.tw) && /attack phase live, ends in 18h 0m/.test(g.tw) && /over/.test(b2.tw) && !/attack phase live/.test(b2.tw) && !/sign-up is open/.test(b2.tw), [f.tw, a.tw, g.tw, b2.tw].join(" || "));
    ck("TB at 28 Oct 12:00 AEDT: 'live, ends in 4d 16h' (2 Nov 04:00 AEDT); at 2 Nov 05:00 AEDT: over, and says no later TB is listed", /live, ends in 4d 16h/.test(c.tb) && /over/.test(d.tb) && /lists no later Territory Battle/.test(d.tb), c.tb + " || " + d.tb);
    ck("Conquest at 27 Oct 12:00 AEDT (day 2 of the sourced run): live, Today says 'day 2 of 14, last live day 8 Nov (swgoh.gg schedule: ends 9 Nov 05:00 AEDT)' with NO 'run N of 3'; the tab says ends 9 Nov 05:00 AEDT / 3rd run / no run after it is listed",
      e.cqLine.live && e.cqLine.day === 2 && e.cqLine.start === "2026-10-26" && e.cqLine.today === "Conquest 25 — day 2 of 14, last live day 8 Nov (swgoh.gg schedule: ends 9 Nov 05:00 AEDT)" && !/run \d of 3/.test(e.cqLine.today) && /ends it 9 Nov 05:00 AEDT and calls it the 3rd run/.test(e.cqLine.html) && /no run after it is listed/.test(e.cqLine.html) && !/next run from 23 Nov/.test(e.cqLine.html), JSON.stringify(e.cqLine));
  }

  /* ---------- 4. escaping: every dynamic string in the new notes goes through escapeHtml ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "esc" });
    const r = await p.evaluate(() => {
      const keep = JSON.stringify([TERRITORY, DATACRON_SETS.map(d => ({ ...d })), CQ_RUN_CAVEAT.startLabel, CQ_RUN_CAVEAT.endLabel]);
      const bad = "<img src=x onerror=window.__x=1>";
      TERRITORY.tb.label = bad; TERRITORY.tb.names = bad; TERRITORY.tb.startLabel = bad; TERRITORY.tb.endLabel = bad; TERRITORY.tw.label = bad; TERRITORY.tw.signupLabel = bad; TERRITORY.tw.openedLabel = bad; TERRITORY.tw.endLabel = bad;
      const tb = territoryNoteHtml("tb"), tw = territoryNoteHtml("tw");
      DATACRON_SETS.forEach(d => { d.name = bad; d.time = bad; d.units = bad; if (d.focused) d.focused = bad; });
      switchAcct("ollie"); switchTab("intel"); state.views.intel = "datacrons"; render();
      const dcHtml = (document.querySelector(".dc-sets") || { innerHTML: "" }).innerHTML;
      CQ_RUN_CAVEAT.startLabel = bad; CQ_RUN_CAVEAT.endLabel = bad;
      const cqh = cqRunStatusHtml({ todayISO: "2026-10-25", liveDays: 14, live: true, day: 2, runStart: "2026-10-26", runEnd: "2026-11-08", nextStart: "2026-11-23", occurrence: 2, runId: "2026-10-26", stale: false });
      return { tb, tw, dcHtml, cqh, injected: !!document.querySelector("img[src='x']"), x: window.__x === 1 };
    });
    ck("TB / TW notes, the datacron line and the Conquest run line escape hostile strings (no <img> element, no handler fired)", !/<img/i.test(r.tb) && !/<img/i.test(r.tw) && !/<img/i.test(r.dcHtml) && !/<img/i.test(r.cqh) && /&lt;img/.test(r.tb) && /&lt;img/.test(r.tw) && /&lt;img/.test(r.dcHtml) && /&lt;img/.test(r.cqh) && !r.injected && !r.x, (r.tb + r.dcHtml.slice(0, 120)).slice(0, 200));
    ck("zero page errors (escaping)", errs.length === 0, JSON.stringify(errs)); allErrs.push(...errs); await ctx.close();
  }

  /* ---------- 5. rv31 (1 Nov 2026) specifics: Set 33 expiry, Leia state text, Rotta, Droid Destruction ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "rv31" });
    const r = await p.evaluate(() => {
      const s33 = DATACRON_SETS.find(d => d.n === 33), s34 = DATACRON_SETS.find(d => d.n === 34), now = Date.now();
      const rec = n => DATACRON_RECS.find(x => x.gl === n) || {};
      return {
        e33: dcSetExpired(s33, now), e33old: dcSetExpired(s33, Date.UTC(2026, 9, 7)), e33seen: dcSetExpired(s33, Date.UTC(2026, 9, 7), true), e34: dcSetExpired(s34, now), e34late: dcSetExpired(s34, Date.UTC(2026, 10, 27)),
        seen: s33.expiredSeen, slkr: rec("Supreme Leader Kylo Ren"), rey: rec("GL Rey (Jedi Master)"),
        oSub: GUIDANCE.ollie.glSub, tSub: GUIDANCE.tiny.glSub, rotta: NXT_ROTTA_EST, snaps: SNAPSHOTS.length,
        b1why: DROID_RAID.ELIGIBLE.find(e => e.name === "B1 Battle Droid").why, drWhen: DROID_RAID.recheck,
        tlNote: TIER_LIST.categories.map(c => [c.key, c.battles]), lsKeys: Object.keys(localStorage).sort().join()
      };
    });
    ck("Set 33 'Supremacy Directive' is EXPIRED at the 1 Nov clock (29 Oct 18:00 AEDT passed); the clock-only check still counts down on an older clock (7 Oct) while the datacron tab's copy (seen=true) honours the 1 Nov 'expiredSeen' read; Set 34 is not expired at 1 Nov but is after 27 Nov", r.e33 === true && r.e33old === false && r.e33seen === true && r.seen === "2026-11-01" && r.e34 === false && r.e34late === true, JSON.stringify([r.e33, r.e33old, r.e33seen, r.seen, r.e34, r.e34late]));
    ck("SLKR / GL Rey datacron picks are marked EXPIRED 29 Oct 2026 in their set line, the confidence chip starts 'Expired — was …', and the copy says it is history", /EXPIRED 29 Oct 2026/.test(r.slkr.set) && /^Expired — was /.test(r.slkr.confidence) && /EXPIRED 29 Oct 2026/.test(r.rey.set) && /^Expired — was /.test(r.rey.confidence) && /expired/i.test(r.slkr.detail) && /expired/i.test(r.rey.detail), JSON.stringify([r.slkr.set, r.slkr.confidence, r.rey.confidence]));
    ck("Leia state text (hard-coded copy only, GL_QUEUE logic untouched): Ollie is GL Leia G13 R6 (one relic tier short of R7) and no longer 'not unlocked'; Tiny is R10 and 'already past the G13 R7 build-up target'", /G13 R6/.test(r.oSub) && /one relic tier short of the R7/.test(r.oSub) && !/not unlocked/i.test(r.oSub) && /R10/.test(r.tSub) && /past the G13 R7 build-up target/.test(r.tSub), r.oSub.slice(0, 160) + " || " + r.tSub.slice(0, 160));
    ck("Rotta: NXT_ROTTA_EST is sourced (3 Nov, prep by 2 Nov) from the scheduled Champion of the Pit event", r.rotta.sourced === true && r.rotta.date === "2026-11-03" && r.rotta.prepBy === "2026-11-02", JSON.stringify(r.rotta));
    ck("Droid Destruction (1 Nov): re-checked page unchanged (recheck 8 Nov); the B1 line still says 4 Nov 05:00 AEDT (marquee release) and INFERRED for the raid-unit identity", r.drWhen === "2026-11-08" && /4 Nov 05:00 AEDT/.test(r.b1why) && /INFERRED/.test(r.b1why), r.b1why.slice(0, 200));
    ck("tier-list category subtitles say which rows were re-read on 1 Nov (5v5 'top 30 rows', 3v3 'top 12 rows', fleet 'first 6 rows')", /28 of the top 30 rows re-read 1 Nov/.test(r.tlNote[0][1]) && /top 12 rows re-read 1 Nov/.test(r.tlNote.find(x => x[0] === "3v3")[1]) && /first 6 rows re-read 1 Nov/.test(r.tlNote.find(x => x[0] === "fleet")[1]), JSON.stringify(r.tlNote));
    ck("SNAPSHOTS is still exactly 24 entries after rv31", r.snaps === 24, String(r.snaps));
    ck("zero page errors (rv31)", errs.length === 0, JSON.stringify(errs)); allErrs.push(...errs); await ctx.close();
  }

  ck("zero page errors across rv25b-check", allErrs.length === 0, JSON.stringify(allErrs.slice(0, 5)));
  await L.finish(b, srv);
})().catch(e => { console.error(e); process.exit(2); });
