/* rf22: 22 Oct 2026 data refresh. Boots the real saved state + the 12 Oct 2026 roster pulls (SNAP_DATE defaults to 2026-10-12 here)
   rv34 4 Nov 2026 — DELIBERATE (7 assertions): seed v12/40 rows/1 Nov -> v13/39 rows/4 Nov; "no past rows" bound 31 Oct -> 4 Nov with the rv34-dropped rows named
     (Contraband / Smuggler's Run allowed only as the 4 Nov read's new runs); Adelphi Era Challenge present -> absent, B1 "SCHEDULED" -> "RELEASED"; Stardust row -> S85 Week 1 row;
     registry events/datacrons/gac-schedule 1 Nov -> 4 Nov, coach-tips 1 Nov -> 4 Nov; GAC_SCHEDULE.asOf 1 Nov -> 4 Nov.
   rv40 10 Nov 2026 — DELIBERATE (11 assertions): droid-raid asOf/recheck 1 Nov/8 Nov -> 10 Nov/17 Nov (raid page re-read, byte-identical) in the data check, the registry check and
     the status-card check; Set 36 expiry 20 -> 21 Jan 2027 and the set list gains Forge and Foundry first (number inferred) — data check + Intel line; seed v13/39 rows/4 Nov -> v14/43 rows/10 Nov;
     'no past rows' bound 4 Nov -> 10 Nov with the rv40-dropped rows named (the Set 33 record row too) and the 10 Nov read's new runs allowed only from 9 Nov; the Conquest 25 run row
     present -> ABSENT; registry coach-tips 4 Nov -> 10 Nov, gl-queue 1 Nov -> 10 Nov, events/datacrons/gac-schedule 4 Nov -> 10 Nov; GAC_SCHEDULE estimates [s85e2, s85e3] -> [s85e3], asOf 10 Nov;
     CQDATA.knownThrough 7 Dec -> 9 Nov.
   in an Australia/Sydney context with Playwright's clock pinned to Fri 23 Oct 2026 03:00 AEDT (just after the 22 Oct reads).
   Covers: Mandalorian & Grogu set 4 (4 new requirements, exact names/ids, Era Level 74 route, the "not every requirement is a relic
   level" wording, exact-name resolution for the id-less B1), the Droid Destruction updates (Adelphi Ranger id + glreq, B1 still
   unconfirmed + inferred, Snowtrooper Commander glreq R8, the 13–15 Nov rerun, the squad-C pre-fill once Adelphi is owned, auto-fill
   leaving a 3★ Adelphi out), the Season 84 fleet board + Fury-class Interceptor, the Season 84 5v5 tier list (Cere S, Satele A 65.5,
   Jango gone, …) and the 3v3 refresh, Datacron Set 36, the v9 events seed (no past rows, Mini-Era row), the registry (24 entries, the
   right asOf values bumped and the rest untouched), no stale "Era 09 / Myths & Legends is running" text, the Conquest run-date caveat,
   escaping of the new strings, zero page errors, and no horizontal overflow at 390/1280 on the touched cards (screenshots in ../shots/).
   Run: cd DIR && NODE_PATH=... FILE=DIR/index.html PORT=9xxx SNAP_DATE=2026-10-12 node tests/rf22-check.js
   rv25 25 Oct 2026 — DELIBERATE: MGL_ASOF / DROID_RAID asOf+recheck / gac-format moved to the 25 Oct re-check; seed v10 with 24 rows.
   rv25b 25 Oct 2026 (live swgoh.gg reads) — DELIBERATE, 10 assertions changed (old -> new, why):
     fleet asOf "22 Oct 2026" -> "25 Oct 2026" and TIER_LIST.updated "22 Oct 2026" -> "25 Oct 2026" (tier lists re-verified unchanged live on 25 Oct);
     seed v10/24 rows/captured 22 Oct -> v11/38 rows/captured 25 Oct (rebuilt from swgoh.gg/schedule/); "no past rows" bound 22 Oct -> 25 Oct;
     B1 row "Mercenary Guard Droid (B1) (est.)" -> "Mercenary Guard Droid (B1)" with a SCHEDULED 4 Nov 05:00 AEDT note; Stardust "(est.)" -> scheduled event (31 Oct -> 1 Nov);
     Conquest "listed end 8 Nov, UNVERIFIED" -> the sourced 26 Oct -> 8 Nov (ends 9 Nov 05:00 AEDT) run row; countdown-derived rows 12 -> 7 (wording "22 Oct countdown", still ≈ and ±1 h);
     registry bump list; capital-journey Profundity wording (now dated by the schedule); Conquest tab caveat "Run dates UNVERIFIED" -> "Run dates, 25 Oct: ONE run is sourced ... UNVERIFIED".    rv31b 1 Nov 2026 — DELIBERATE (2 assertions): KEPT era 2026-09-28 -> 2026-11-01 and coach-tips 2026-09-27 -> 2026-11-01 (TIPS rewritten from the 31 Oct pulls), era hard end 2026-10-20 -> 2026-11-17 (the "era" entry is re-pointed to Era 10; Era 09 is an archive);
   GAC counters 'Update 22 Oct 2026' 5v5 line -> the 1 Nov capture line (5v5 + 3v3), values Stranger 53.0->53.2, SLKR 46.4->46.3, Cere 44.6->41.9, Leia #5 26.2 -> #4 27.0, Jango 'not in top 30' -> #34.
   rv48 18 Nov 2026 — DELIBERATE (25 assertions; the 23 Oct clock and the 12 Oct fixtures are unchanged): every value the 18 Nov refresh moved —
     MGL set 4: Mercenary Guard Droid (B1) id null -> B1MERCDROID and raid false -> true (swgoh.gg's raid page names him); MGL watch asOf 2026-10-25 -> 2026-11-18 and its note
     "no release date" -> "RELEASED" (M&G in play on the S85 boards; the exact-name resolver checks are kept); DROID_RAID: the "B1 Battle Droid" row -> "Mercenary Guard Droid (B1)"
     (B1MERCDROID, glreq R7, no longer inferred) and WINDOW second-hand -> launched, asOf/recheck 10 Nov/17 Nov -> 18 Nov/2 Dec; TIER_LIST: fleet Season 84 -> 85 (11 rows re-read),
     updated 1 Nov -> 18 Nov (the 5v5 category keeps Season 84 and gains its own asOf), 3v3 Season 83 (42 rows) -> Season 85 (108 rows, Leia A 81.7%); seed v14/43/10 Nov ->
     v15/18 Nov with the "no past rows" bound 10 Nov -> 18 Nov and the v14-only rows (Mini-Era, B1 marquee, Zuckuss rerun, Week 1, third-party Dark Sovereign) -> their v15
     successors (Dark Sovereign SOURCED, Conquest Run 3 present, Week 3 sourced); registry bump list (events / datacrons / gac-schedule / droid-raid / tierlist / meta-fleets /
     conquest / gac-counters / meta-squads / era / coach-tips / gl-queue -> 18 Nov); GAC_SCHEDULE estimates [s85e3] -> [s86e1]; CQDATA.knownThrough 9 Nov -> 7 Dec (Run 3
     sourced); ERA_NOW Era 10 -> Era of Rogue One (Era 10 checked in ERA_ARCHIVE.era10); GAC counters gain the S85 3v3 line (and 2 rows); the Era box / Era Level card /
     raid status / 18 Nov strapline wording; the MGL card's B1 row now carries B1MERCDROID (still 'or EL 74 in the Mini-Era' on the 23 Oct clock).
*/
process.env.SNAP_DATE = process.env.SNAP_DATE || "2026-10-12";
const L = require("./lib.js");
const ck = L.ck;
const AEDT = (mo, d, h) => Date.UTC(2026, mo - 1, d, h - 11, 0);
const RF = AEDT(10, 23, 3);
const SHOTS = L.path.join(L.ROOT, "shots");
try { L.fs.mkdirSync(SHOTS, { recursive: true }); } catch (e) {}
/* the 22 Oct live pulls carry ADELPHIRANGER at 3★ G1 on both accounts (verified in the owner's Chrome); the 12 Oct fixture predates her */
const ADELPHI = { s: 3, g: 1, r: 0, t: "char", name: "Adelphi Ranger", z: [], o: [], el: 0 };
const pullsWith = extra => { const a = JSON.parse(L.PULLS); for (const k of ["ollie", "tiny"]) Object.assign(a[k].reqs, extra); return JSON.stringify(a); };
async function openAt(b, o) {
  o = o || {};
  const ctx = await b.newContext({ viewport: { width: o.width || 1280, height: o.height || 1000 }, timezoneId: "Australia/Sydney", locale: "en-AU" });
  await ctx.clock.setFixedTime(o.at || RF);
  await ctx.addInitScript(([s, pl, seedKey]) => {
    try { if (!sessionStorage.getItem(seedKey)) { localStorage.clear(); localStorage.setItem("swgoh-tracker", s); localStorage.setItem("swgoh-holotable-pulls-v1", pl); sessionStorage.setItem(seedKey, "1"); } } catch (e) {}
  }, [L.REAL, o.pulls || L.PULLS, "seeded-" + (o.tag || "x")]);
  await ctx.route(/fonts\.g|swgoh\.gg|swgohrote\.com|corsproxy|allorigins|codetabs|api\.github/, r => r.abort());
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push(String(e).slice(0, 300)));
  p.on("console", m => { if (m.type() === "error" && !/Failed to load resource|net::ERR|fonts\.g/.test(m.text())) errs.push("console: " + m.text().slice(0, 200)); });
  await p.goto(`http://127.0.0.1:${L.PORT}/x.html`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(900);
  return { ctx, p, errs };
}
const openGl = async (p, acct) => { await p.evaluate(a => { switchAcct(a); switchTab("leia"); document.querySelectorAll('#glTables [data-card="glq"] details.glq-why').forEach(d => d.open = true); }, acct); await p.waitForTimeout(350); };
const planner = async (p, acct) => { await p.evaluate(a => { switchAcct(a); state.modesnav.category = "raid"; state.modesnav.raidView = "droid"; switchTab("modes"); }, acct); await p.waitForTimeout(400); };

(async () => {
  const srv = await L.serve(); const b = await L.chromium.launch({ headless: true });

  /* ---------- 1. constants (pure) ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "pure" });
    const c = await p.evaluate(() => {
      const w = GL_QUEUE.watch.MANDOGROGU, cat = k => TIER_LIST.categories.find(x => x.key === k);
      const e = n => DROID_RAID.ELIGIBLE.find(x => x.name === n);
      return {
        now: new Date().toString(),
        set4: MGL_SETS[3], sets: MGL_SETS.map(s => [s.n, !!s.pending, s.req.length]), req: MGL_REQ.map(r => r.slice()), note: w.note, asOf: w.asOf, mglAsOf: MGL_ASOF,
        b1Res: { byName: mglResolve({ ZZB1: { name: "Mercenary Guard Droid (B1)", s: 3, g: 1, r: 0 } }, "", "Mercenary Guard Droid (B1)") !== undefined,
          notOldB1: mglResolve({ B1BATTLEDROIDV2: { name: "B1 Battle Droid", s: 7, g: 13, r: 5 } }, "", "Mercenary Guard Droid (B1)") === undefined,
          adelphiWrongName: mglResolve({ ADELPHIRANGER: { name: "Adelphi Ranger (Old)", s: 7, g: 13, r: 7 } }, "ADELPHIRANGER", "Adelphi Ranger") === undefined,
          key: [mglKey(null, "Mercenary Guard Droid (B1)"), mglKey("IG12", "IG-12 & Grogu")] },
        adel: e("Adelphi Ranger"), b1: e("Mercenary Guard Droid (B1)"),   /* rv48: the row was "B1 Battle Droid" (id null) */ snow: e("Snowtrooper Commander"), gl: e("The Mandalorian and Grogu"),
        rerun: DROID_RAID.RERUN, window: DROID_RAID.WINDOW, waves: DROID_RAID.WAVES.length, drAsOf: DROID_RAID.asOf, recheck: DROID_RAID.recheck, sqC: DROID_RAID.SQUADS[2].units,
        prio: JSON.stringify(DROID_RAID.PRIORITY), eligible: DROID_RAID.ELIGIBLE.length,
        fleet: cat("fleet"), metaFleet: META_FLEET_TIER.map(f => [f.name, f.tier]), lev: META_FLEETS[0], pro: META_FLEETS[1],
        t5: cat("5v5"), t3: cat("3v3"), updated: TIER_LIST.updated,
        dcSets: DATACRON_SETS, nxtDc: NXT_DATACRON_EXPIRY,
        seed: EVENTS_SEED.map(x => ({ name: x.name, cat: x.cat, date: x.date, ends: x.ends || "", note: x.note })), seedVer: EVENTS_SEED_VERSION, seedCap: EVENTS_SEED_CAPTURED,
        catKeys: Object.keys(EVENT_CAT_CHIP),
        reg: SNAPSHOTS.map(s => [s.key, s.asOf, s.expires || null]), sched: GAC_SCHEDULE.events.filter(x => x.est).map(x => x.id), schedAsOf: GAC_SCHEDULE.asOf,
        cap: { asOf: CAP_ASOF, ingame: CAP_INGAME, lev: CAP_JOURNEYS[0].when, pro: CAP_JOURNEYS[1].when, levReq: CAP_JOURNEYS[0].req.length, proReq: CAP_JOURNEYS[1].req.length },
        exec: EXECUTOR_EVENT.asOf, era: ERA_ARCHIVE.era10, eraNow: ERA_NOW, counters: GAC_COUNTERS.map(x => x.why), cqWarn: CQ_RUN_CAVEAT.text, cq: { anchor: CQDATA.cycle.anchor, kt: CQDATA.knownThrough, cap: CQDATA.captured },
        ship: SHIP_DATA.units.REMNANTSNOWCOMMANDER.src.map(s => s.other || s.store || s.node)
      };
    });
    ck("clock pinned to Fri 23 Oct 2026 03:00 AEDT", /Fri Oct 23 2026 03:00/.test(c.now), c.now);
    /* MGL set 4 */
    ck("MGL: four sets, all published (none pending), 4 requirements each → 16", JSON.stringify(c.sets) === "[[1,false,4],[2,false,4],[3,false,4],[4,false,4]]" && c.req.length === 16, JSON.stringify(c.sets));
    ck("MGL set 4: exact names, ids, relic levels — Mercenary Guard Droid (B1) [id null] R7, Adelphi Ranger [ADELPHIRANGER] R7, IG-12 & Grogu [IG12] R10, Snowtrooper Commander [REMNANTSNOWCOMMANDER] R8", JSON.stringify(c.set4.req.map(r => [r[0], r[1], r[2]])) === JSON.stringify([["B1MERCDROID", "Mercenary Guard Droid (B1)", 7], ["ADELPHIRANGER", "Adelphi Ranger", 7], ["IG12", "IG-12 & Grogu", 10], ["REMNANTSNOWCOMMANDER", "Snowtrooper Commander", 8]]), JSON.stringify(c.set4.req));   // rv48: B1 id null -> B1MERCDROID
    ck("MGL set 4: the two marquees carry the Era Level 74 route (el), IG-12 & Grogu / Snowtrooper Commander do not; MGL_REQ carries it as element 5", JSON.stringify(c.req.slice(12).map(r => r[5])) === "[74,74,null,null]" && c.req.slice(0, 12).every(r => r[5] === null), JSON.stringify(c.req.slice(12)));
    ck("MGL set 4 raid flags: Adelphi Ranger + Snowtrooper Commander raid units; B1 NOT (its raid match is inferred); IG-12 & Grogu not", JSON.stringify(c.req.slice(12).map(r => r[4])) === "[true,true,false,true]", JSON.stringify(c.req.slice(12).map(r => r[4])));   // rv48: B1 is a raid unit (named on swgoh.gg's raid page, 18 Nov)
    ck("MGL set 4 metadata: published 21 Oct 2026, source = EA Final Requirements, quest title not published; MGL_ASOF = watch asOf (2026-10-25 since the rv25 re-check)", c.set4.revealed === "21 Oct 2026" && /Final Requirements/.test(c.set4.src) && c.set4.quest === "title not published" && c.mglAsOf === "2026-10-25" && c.asOf === "2026-11-18", JSON.stringify([c.set4.revealed, c.set4.quest, c.asOf]));   // rv48: the watch entry's asOf moved to 18 Nov (released); MGL_ASOF (the requirement sets) stays 25 Oct
    ck("MGL note: kit revealed 20 Oct, no release date, Mini-Era 20 Oct – 17 Nov, EL 74 = 7★ + Relic 7, 'not every requirement is a relic level any more'; the old 'all Relic-only' / 'Coming Soon' claims are gone", /kit was revealed 20 Oct/.test(c.note) && /^RELEASED/.test(c.note) && /release date is unverified/.test(c.note) && /Era Level 74 route/.test(c.note) && /Relic 7 now/.test(c.note) && !/all Relic-only/.test(c.note) && !/Coming Soon/.test(c.note), c.note.slice(0, 300));   // rv48: 'NO release date' -> 'RELEASED (date unverified)'; the EL 74 route is recorded as ended
    ck("exact-name resolution: an id-less 'Mercenary Guard Droid (B1)' resolves by exact name only; the roster's old 'B1 Battle Droid' never stands in; a wrong name under ADELPHIRANGER is rejected; the null id is keyed 'name:<name>', never 'null'",
      c.b1Res.byName && c.b1Res.notOldB1 && c.b1Res.adelphiWrongName && c.b1Res.key[0] === "name:Mercenary Guard Droid (B1)" && c.b1Res.key[1] === "IG12", JSON.stringify(c.b1Res));
    /* Droid Destruction */
    ck("DROID_RAID: Adelphi Ranger has her real id ADELPHIRANGER (22 Oct live pulls), is glreq R7, no longer unconfirmed", c.adel.id === "ADELPHIRANGER" && c.adel.idSrc === "live-22oct" && c.adel.overlap === "glreq" && c.adel.glRelic === 7 && !c.adel.unconfirmed && /released/.test(c.adel.why), JSON.stringify(c.adel));
    ck("DROID_RAID: 'B1 Battle Droid' keeps id null + unconfirmed; its note says it is very likely Mercenary Guard Droid (B1) but INFERRED, and that the 7★ B1 Battle Droid is a different unit", c.b1.id === "B1MERCDROID" && !c.b1.unconfirmed && c.b1.overlap === "glreq" && c.b1.glRelic === 7 && /no longer inferred/.test(c.b1.why) && /different, older unit/.test(c.b1.why), c.b1.why);   // rv48: the row is "Mercenary Guard Droid (B1)" with B1MERCDROID (swgoh.gg's raid page, 18 Nov)
    ck("DROID_RAID: Snowtrooper Commander is now glreq R8 (set 4) and its note names Fleet Battles 5-D Hard", c.snow.overlap === "glreq" && c.snow.glRelic === 8 && /R8/.test(c.snow.why) && /Fleet Battles 5-D Hard/.test(c.snow.why), JSON.stringify(c.snow));
    ck("DROID_RAID: Zuckuss + 4-LOM rerun 13–15 Nov recorded outside the 7 waves; release window 'near the end of the Mini-Era' labelled second-hand; asOf 2026-11-10 / recheck 17 Nov since rv40; 33 eligible, 7 waves", c.rerun.start === "2026-11-13" && c.rerun.end === "2026-11-15" && JSON.stringify(c.rerun.units) === '["ZUCKUSS","4LOM"]' && c.waves === 7 && c.window.launched === true && /launch date unverified/.test(c.window.text) && c.drAsOf === "2026-11-18" && c.recheck === "2026-12-02" && c.eligible === 33, JSON.stringify([c.rerun, c.window]));   // rv48: window 'second-hand' -> launched; asOf/recheck 18 Nov / 2 Dec
    ck("DROID_RAID: squad C lists Adelphi Ranger as a 6th candidate (second, after Teva); wave-day PRIORITY untouched (Adelphi is a marquee, not a wave unit)", JSON.stringify(c.sqC) === JSON.stringify(["CARSONTEVA", "ADELPHIRANGER", "R5D4", "RANGERZEB", "BISHOP", "GOPHERANTS"]) && !/ADELPHIRANGER/.test(c.prio), JSON.stringify(c.sqC));
    ck("shipment guide: Snowtrooper Commander's Fleet Battles 5-D Hard source added (first), bundles kept", /Fleet Battles \(Hard\) 5-D/.test(c.ship[0]) && c.ship.includes("featured") && c.ship.includes("weekly"), JSON.stringify(c.ship));
    /* fleet */
    const FL = [["Leviathan", "S", 96.4, "13K"], ["Profundity", "A", 98.4, "15.4K"], ["Executor", "B", 92.9, "7,869"], ["Home One", "B", 94.5, "645"], ["Chimaera", "B", 86.1, "1,400"], ["Endurance", "C", 45.7, "204"], ["Negotiator", "C", 79.1, "3,582"], ["Executrix", "C", 61.3, "362"], ["Malevolence", "C", 67.5, "2,669"], ["Raddus", "D", 69.8, "685"], ["Finalizer", "D", 23.8, "352"]];   // rv48: the Season 85 fleet board (18 Nov capture) — Negotiator #8 -> #7
    const FL_LETTERS_S84 = [["Leviathan", "S"], ["Profundity", "A"], ["Executor", "B"], ["Home One", "B"], ["Chimaera", "B"], ["Endurance", "C"], ["Executrix", "C"], ["Negotiator", "C"], ["Malevolence", "C"], ["Raddus", "D"], ["Finalizer", "D"]];   // META_FLEET_TIER was not re-ordered (same letters)
    ck("fleet tier list: Season 84, 11 rows (rv31: first 6 re-read 1 Nov; rows 7-11 carried from 25 Oct) in order, tier, WR, battles", c.fleet.season === 85 && c.fleet.asOf === "18 Nov 2026" && JSON.stringify(c.fleet.squads.map(s => [s.leader, s.tier, s.wr, s.battles])) === JSON.stringify(FL), JSON.stringify(c.fleet.squads.slice(0, 3)));   // rv48: Season 84 (1 Nov) -> Season 85 (18 Nov), all 11 rows re-read
    ck("META_FLEET_TIER follows the S84 board order with unchanged letters (Home One ahead of Chimaera) — rv48: compared with the S84 letters kept here, since S85 only swapped Negotiator / Executrix (both C)", JSON.stringify(c.metaFleet) === JSON.stringify(FL_LETTERS_S84), JSON.stringify(c.metaFleet));
    ck("META_FLEETS: Leviathan lineup = Leviathan, Fury-class Interceptor (2nd, confirmed), B-28, TIE Dagger; Profundity lineup matches the board; both labelled Season 84", JSON.stringify(c.lev.members.map(m => m[0])) === JSON.stringify(["Leviathan", "Fury-class Interceptor", "B-28 Extinction-class Bomber", "TIE Dagger"]) && JSON.stringify(c.pro.members.map(m => m[0])) === JSON.stringify(["Profundity", "Han's Millennium Falcon", "Outrider", "Rebel Y-wing"]) && /Season 84/.test(c.lev.mode) && /Season 84/.test(c.pro.mode), JSON.stringify([c.lev.mode, c.pro.mode]));
    /* 5v5 / 3v3 */
    const t5 = n => c.t5.squads.find(s => s.leader === n), t3 = n => c.t3.squads.find(s => s.leader === n);
    ck("5v5 tier list: Season 84 in progress, 2.26M battles (25 Oct total), 57 rows, SLKR #1 S 91.4, TIER_LIST.updated 1 Nov 2026 (rv31: top 28 of 30 rows re-read)", c.t5.season === 84 && /2\.26M/.test(c.t5.battles) && c.t5.squads.length === 57 && c.t5.squads[0].leader === "Supreme Leader Kylo Ren" && c.t5.squads[0].wr === 91.4 && c.updated === "18 Nov 2026" && c.t5.asOf === "1 Nov 2026" && /NOT re-read 18 Nov/.test(c.t5.battles), c.t5.battles);   // rv48: TIER_LIST.updated 1 Nov -> 18 Nov (3v3 + fleet re-read); the 5v5 category keeps 1 Nov as its own asOf
    ck("5v5 moves: Cere Junda S (#4, 88.4 after rv31), Satele Shan A (65.3% over 117K after rv31), Lord Vader A→S (#5, 85.7, rv31), JMLS A, Commander Luke B; Jango Fett has no row (not in the top 57)",
      t5("Cere Junda").tier === "S" && c.t5.squads.indexOf(t5("Cere Junda")) === 3 && t5("Satele Shan").tier === "A" && t5("Satele Shan").wr === 65.3 && t5("Satele Shan").battles === "117K" && t5("Lord Vader").tier === "S" && c.t5.squads.indexOf(t5("Lord Vader")) === 4 && t5("Jedi Master Luke Skywalker").tier === "A" && t5("Commander Luke Skywalker").tier === "B" && !t5("Jango Fett"), "");
    ck("5v5 Leia Organa: #3 S, 90.0% over 142K (rv31); 3v3 Leia: #6 S, 80.6% over 190K, still labelled Season 83 (3.98M battles)", c.t5.squads[2].leader === "Leia Organa" && t5("Leia Organa").tier === "S" && t5("Leia Organa").wr === 90 && t5("Leia Organa").battles === "142K" && c.t3.squads[9].leader === "Leia Organa" && t3("Leia Organa").tier === "A" && t3("Leia Organa").wr === 81.7 && t3("Leia Organa").battles === "61.9K" && c.t3.season === 85, JSON.stringify([t5("Leia Organa"), t3("Leia Organa")]));   // rv48: 3v3 is the Season 85 board (Leia #10 A 81.7% over 61.9K)
    ck("3v3: 40 re-read rows + the 2 kept 7 Oct rows (Stormtrooper Luke, Padmé), no duplicate leaders in any category", c.t3.squads.length === 108 && t3("Stormtrooper Luke").wr === 73.6 && t3("Padmé Amidala").wr === 76.2 && [c.t5, c.t3, c.fleet].every(k => new Set(k.squads.map(s => s.leader)).size === k.squads.length), String(c.t3.squads.length));   // rv48: all 108 Season 85 rows (the 7 Oct rows replaced)
    /* datacrons */
    ck("Datacron Set 36 'The Legend Codex' listed second (rv40: after the new Forge and Foundry), expires 2027-01-21 (rv40; was 20 Jan), 10 named characters incl. IG-90 and Leia (Jedi Training); sets 33/34/35 expiries unchanged",
      c.dcSets[1].n === 36 && c.dcSets[1].name === "The Legend Codex" && c.dcSets[1].expires === "2027-01-21" && c.dcSets[1].units.split(" · ").length === 10 && /IG-90/.test(c.dcSets[1].units) && /Leia \(Jedi Training\)/.test(c.dcSets[1].units)
      && c.dcSets[0].name === "Forge and Foundry" && JSON.stringify(c.dcSets.slice(2).map(d => [d.n, d.expires])) === JSON.stringify([[35, "2026-12-24"], [34, "2026-11-26"], [33, "2026-10-29"]]) && c.nxtDc[36] === "2027-01-21" && c.nxtDc[33] === "2026-10-29", JSON.stringify(c.dcSets.map(d => d.n)));
    /* events seed v9 */
    ck("EVENTS_SEED v14 (rv40: diffed against the 10 Nov swgoh.gg/schedule/ capture): captured 10 Nov 2026, 43 rows sorted by date, every category in swgoh.gg's taxonomy map (incl. Territory Battle / Grand Arena / Era Challenge)", c.seedVer === 15 && c.seedCap === "18 Nov 2026" && c.seed.length >= 55 && c.seed.every((r, i) => !i || r.date >= c.seed[i - 1].date) && c.seed.every(r => c.catKeys.includes(r.cat)), "");   // rv48: v14/43/10 Nov -> v15/18 Nov (rebuilt from the 18 Nov capture + extended read)
    ck("EVENTS_SEED v14 has NO past rows (rv40: every row starts or ends on/after 10 Nov 2026; the Set 33 record row is dropped too) and none of the dropped rows (rv31: Adelphi Ranger marquee, Ground War, Endor, Coven, Duel of the Fates, Ghosts, the 26 Oct Smuggler's Run, Mirrored Paths, Mara Jade node; rv34: Territory Battle, Adelphi Era Challenge, first Places of Power, Stardust, Credit Heist, 2 Nov TW sign-up, Bespin, Echoes of Legend); rv40: Conquest 25's run, Proving Grounds, the TW rows, waves 6–7, Pieces and Plans); the 10 Nov read's NEW Territory Battle, Mirrored Paths, Credit Heist, Contraband Cargo, Smuggler's Run, Endor Escalation and B1 Era Challenge rows are allowed only as runs starting 9 Nov or later; the only Terrible Tings / Ultimate Journey rows are labelled predicted", c.seed.every(r => (r.ends || r.date) >= "2026-11-18") && !c.seed.some(r => /Wanderer|Coruscant|run 1|Mara Jade|Adelphi Ranger Era Challenge|Stardust Transmission|Echoes of Legend|Proving Grounds|Bonus drops|Pieces and Plans|Set 33|Era 10|Zuckuss|Week 1|Week 2|Credit Heist|Contraband/.test(r.name) || ["Adelphi Ranger", "Mercenary Guard Droid (B1)"].includes(r.name)) && c.seed.filter(r => /Terrible Tings/.test(r.name)).every(r => /\(predicted\)/.test(r.name)), JSON.stringify(c.seed.filter(r => (r.ends || r.date) < "2026-11-18").map(r => r.name)));   // rv48: bound 10 Nov -> 18 Nov; the v14 rows that ended by 18 Nov are named
    const mini = c.era;   // rv48: the Mini-Era row is gone from the seed (ended 18 Nov 06:00); its facts live in ERA_ARCHIVE.era10
    ck("EVENTS_SEED v14: the Mini-Era row (20 Oct → 17 Nov last live day = 18 Nov 06:00 AEDT, EL cap 75) is there; the Adelphi Ranger Era Challenge (ended 4 Nov 05:00) is gone (rv34); the B1 marquee row says RELEASED 4 Nov 05:00 AEDT (rv34: read on the 4 Nov schedule), not est.", mini && mini.end === "2026-11-17" && mini.endAedt === "18 Nov 06:00 AEDT" && mini.elCap === 75 && !c.seed.some(r => /Mini-Era|Adelphi Ranger Era Challenge/.test(r.name)) && !c.seed.some(r => r.name === "Mercenary Guard Droid (B1)"), JSON.stringify(mini));   // rv48: Mini-Era + B1 marquee rows dropped (over); Era 10 is ERA_ARCHIVE.era10
    ck("EVENTS_SEED v14: Zuckuss + 4-LOM rerun 13–15 Nov, Dark Sovereign next run ~20 Nov (third-party), GAC Season 85 Week 1 5 -> 11 Nov (rv34: replaces the dropped Stardust Transmission check), the Conquest 25 run row DROPPED (rv40: ended; the 10 Nov read lists no Conquest), Set 36 expiry row 21 Jan 2027 (rv40)", !c.seed.some(r => /Zuckuss \+ 4-LOM/.test(r.name)) && c.seed.some(r => r.name === "Dark Sovereign" && r.date === "2026-11-20" && r.ends === "2026-11-21" && /^SOURCED/.test(r.note)) && c.seed.some(r => r.name === "GAC Season 85 — Week 3 (3v3)" && r.date === "2026-11-19" && r.ends === "2026-11-25") && !c.seed.some(r => /Stardust Transmission/.test(r.name))
      && c.seed.some(r => r.name === "Conquest Vol. 25 — Run 3" && r.ends === "2026-12-07") && c.seed.some(r => r.name === "Datacron Set 36 expires" && r.date === "2027-01-21"), "");   // rv48: Zuckuss rerun gone (never on swgoh.gg, past); Dark Sovereign SOURCED 20–21 Nov; Week 1 -> Week 3; Conquest Run 3 PRESENT
    ck("EVENTS_SEED v12: no row still takes its time from a 22/23 Oct countdown (all 7 such rows were over or replaced by schedule reads at 1 Nov); any that did would still need '≈' and ±1 h", c.seed.filter(r => /Oct countdown/.test(r.note)).every(r => /≈/.test(r.note) && /±1 h/.test(r.note)) && c.seed.filter(r => /Oct countdown/.test(r.note)).length === 0, c.seed.filter(r => /Oct countdown/.test(r.note)).map(r => r.name).join());
    /* registry */
    const reg = Object.fromEntries(c.reg.map(r => [r[0], r[1]]));
    const BUMPED = ["executor-event", "cap-journeys"];   /* rv48: unchanged — still the only 22 Oct entries */   /* rv40: droid-raid moved to 10 Nov with events, datacrons, gac-schedule */   /* rv31: events, tierlist, datacrons, meta-fleets, droid-raid, gac-schedule moved to 1 Nov; gac-format stays 25 Oct; these two keep 22 Oct */
    const KEPT = { conquest: "2026-11-18", "gac-counters": "2026-11-18", "meta-squads": "2026-11-18", bestmods: "2026-08-08", "tb-rote": "2026-08-09", "assault-battles": "2026-08-22", "raid-intel": "2026-08-17", "raid-notes": "2026-08-09", era: "2026-11-18", "executor-req": "2026-08-09", "coach-tips": "2026-11-18", "gl-roadmap": "2026-08-08", "gl-queue": "2026-11-18" };   // rv48: conquest (Run 3 dates), gac-counters / meta-squads (S85 boards), era (Rogue One dates), coach-tips + gl-queue (18 Nov rosters) -> 18 Nov   // rv40: coach-tips + gl-queue re-derived from the 10 Nov rosters (were 2026-11-04 / 2026-11-01)   // rv25c: gl-queue re-derived (Ollie's order, 31 Oct roster) — was "2026-10-03"
    ck("SNAPSHOTS registry: still 24 unique entries", c.reg.length === 24 && new Set(c.reg.map(r => r[0])).size === 24, String(c.reg.length));
    ck("SNAPSHOTS: executor-event and cap-journeys are still dated 2026-10-22 (not re-verified since); tierlist and meta-fleets moved to 2026-11-01 (rv31 live reads); events, datacrons, gac-schedule and droid-raid moved to 2026-11-10 (rv40 capture); gac-format stays 2026-10-25 (not re-read)", BUMPED.every(k => reg[k] === "2026-10-22") && c.reg.filter(r => r[1] === "2026-10-22").length === BUMPED.length && ["tierlist", "meta-fleets", "events", "datacrons", "gac-schedule", "droid-raid"].every(k => reg[k] === "2026-11-18") && reg["gac-format"] === "2026-10-25", JSON.stringify(BUMPED.map(k => [k, reg[k]])));   // rv48: tierlist / meta-fleets / events / datacrons / gac-schedule / droid-raid -> 18 Nov
    ck("SNAPSHOTS: entries NOT refreshed keep their dates (conquest/gac-counters/meta-squads 27 Sep, …; gl-queue and coach-tips 10 Nov since rv40; era 1 Nov since rv31); era re-pointed to Era 10 since rv31 (asOf 1 Nov, hard end 17 Nov; was Era 09 28 Sep / 20 Oct)", Object.entries(KEPT).every(([k, v]) => reg[k] === v) && c.reg.find(r => r[0] === "era")[2] === "2027-02-09", JSON.stringify(Object.keys(KEPT).map(k => [k, reg[k]])));   // rv48: era hard end 17 Nov -> 9 Feb 2027 (Era of Rogue One)
    ck("GAC_SCHEDULE: only Season 85 event 3 is estimated (S85 start sourced 1 Nov, Week 2 sourced 10 Nov from swgoh.gg/schedule/; S84E3 verified from the live brackets), asOf 2026-11-10 (rv40: Week 2 read)", JSON.stringify(c.sched) === '["s86e1"]' && c.schedAsOf === "2026-11-18", JSON.stringify(c.sched));   // rv48: s85e3 SOURCED (Week 3 on the 18 Nov read); the only estimate is the INFERRED s86e1
    ck("capital ship journeys: CAP_ASOF 22 Oct, CAP_INGAME 15 Oct; Dark Sovereign monthly on the 20th (next ~20 Nov) still labelled third-party/unverified; Profundity (rv25b) now DATED by swgoh.gg/schedule/ (31 Oct 6:00 PM -> 1 Nov 18:00 AEDT, about 24 h) with the monthly pattern only as a match; Journey Guide caveat; requirement lists unchanged (16 + 14)",
      c.cap.asOf === "2026-10-22" && c.cap.ingame === "2026-10-15" && /third-party, unverified/.test(c.cap.lev) && /20th of every month/.test(c.cap.lev) && /~20 Nov/.test(c.cap.lev) && /Journey Guide tab is off/.test(c.cap.lev) && /not stated/.test(c.cap.lev) && /swgoh\.gg\/schedule\//.test(c.cap.pro) && /31 Oct at 6:00 PM/.test(c.cap.pro) && /1 Nov 18:00 AEDT/.test(c.cap.pro) && /last-day-of-the-month pattern/.test(c.cap.pro) && !/unverified/i.test(c.cap.pro) && c.cap.levReq === 16 && c.cap.proReq === 14, c.cap.lev.slice(0, 200));
    ck("Executor economy asOf 22 Oct (figures re-matched); Conquest model kept but caveated (anchor 28 Sep, captured 27 Sep unchanged; rv40: knownThrough 7 Dec -> 9 Nov, the run ended and none is listed)", c.exec === "2026-10-22" && c.cq.anchor === "2026-09-28" && c.cq.kt === "2026-12-07" && c.cq.cap === "27 Sep 2026" && /UNVERIFIED/.test(c.cqWarn) && /28 Sep – 8 Nov/.test(c.cqWarn) && /Run 3/.test(c.cqWarn), c.cqWarn);   // rv48: knownThrough 9 Nov -> 7 Dec (Conquest 25 Run 3 sourced 18 Nov)
    ck("ERA_NOW: Era 10 'The Mandalorian and Grogu' Mini-Era 20 Oct → 17 Nov 2026, EL cap 75; the facts name the EL 74 / 75 equivalences and the 10 loaned units", c.era.n === 10 && c.era.name === "The Mandalorian and Grogu" && c.era.start === "2026-10-20" && c.era.end === "2026-11-17" && c.era.elCap === 75 && /EL 74 = 7★ \+ Relic 7/.test(c.era.note) && /Ten loaned units/.test(c.era.note) && c.eraNow.name === "Era of Rogue One", JSON.stringify(c.era));   // rv48: Era 10 is ERA_ARCHIVE.era10 now (ERA_NOW = Era of Rogue One); its EL 74 rule and loan count are in the archive note
    ck("GAC counters: every row ends with its defence-board line — rv31: the 1 Nov capture (5v5 S84 + 3v3 S83) replaced the 22 Oct 5v5-only line — Stranger #1 53.2% hold, SLKR #2 46.3%, Cere #3 41.9%, Leia #4 27.0%; Jango now read at #34", c.counters.length === 17 && c.counters.filter(w => /Defence boards read 1 Nov 2026/.test(w)).length === 15 && c.counters.filter(w => /S85 3v3 DEFENCE board \(read 18 Nov 2026/.test(w) || /S85 \(read 18 Nov 2026/.test(w)).length >= 16 && /#1, S, 53\.2% hold/.test(c.counters[2]) && /#2, S, 46\.3% hold/.test(c.counters[0]) && /#3, S, 41\.9% hold/.test(c.counters[16]) && /#4, S, 27\.0% hold/.test(c.counters[4]) && /#34, B, 18\.6% hold/.test(c.counters[13]), "");   // rv48: 15 -> 17 rows (M&G, Baylan), each old row also gains its S85 3v3 line; the 1 Nov values are unchanged
    ck("no page errors (pure)", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ---------- 2. rendered: GL order watch (12 Oct pulls) ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "gl" });
    await openGl(p, "ollie");
    const d = await p.evaluate(() => { const row = document.querySelector('#glTables [data-card="glq"] .glq-row[data-glq="MANDOGROGU"]'); const s4 = row.querySelector('.mgl-set[data-mgl-set="4"]');
      return { head: s4.querySelector(".mgl-sethead").textContent.trim(), lis: [...s4.querySelectorAll("li")].map(li => ({ id: li.getAttribute("data-mgl-id"), txt: li.textContent.replace(/\s+/g, " ").trim() })), ready: row.querySelector(".glq-ready").textContent, why: row.querySelector(".glq-watchreqs").textContent.replace(/\s+/g, " ") }; });
    ck("[ollie] GL order: set 4 renders 4 units with live status from the 12 Oct pull (IG-12 & Grogu R7 → R10, Snowtrooper Commander 3★ G8 → R8, the two marquees not owned)",
      /Set 4 of 4 — quest title not published · published 21 Oct 2026/.test(d.head) && d.lis.length === 4 && /IG-12 & Grogu: 7★ R7 → R10/.test(d.lis[2].txt) && /Snowtrooper Commander: 3★ G8 → R8/.test(d.lis[3].txt) && /Adelphi Ranger: not owned → R7/.test(d.lis[1].txt) && /Mercenary Guard Droid \(B1\): not owned → R7/.test(d.lis[0].txt), JSON.stringify(d.lis.map(l => l.txt)));
    ck("[ollie] the B1 row has an empty data-mgl-id (never 'null') and says 'id unverified'; both marquees show 'or EL 74 in the Mini-Era'", d.lis[0].id === "B1MERCDROID" && !/id unverified/.test(d.lis[0].txt) && d.lis.filter(l => /or EL 74 in the Mini-Era/.test(l.txt)).length === 2 && !/null/.test(JSON.stringify(d.lis)), JSON.stringify(d.lis[0]));   // rv48: B1 carries B1MERCDROID (no 'id unverified'); on this 23 Oct clock the EL 74 route still shows
    ck("[ollie] summary line: 0/16 published requirements met (all 4 of 4 sets published)", /^0\/16 published requirements met \(all 4 of 4 sets published\)/.test(d.ready), d.ready);
    await openGl(p, "tiny");
    const t = await p.evaluate(() => [...document.querySelectorAll('#glTables [data-card="glq"] .glq-row[data-glq="MANDOGROGU"] .mgl-set li')].length);
    ck("[tiny] GL order: all 16 requirement rows render", t === 16, String(t));
    ck("no page errors (gl)", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ---------- 3. Adelphi Ranger owned (22 Oct live pull shape): resolution, planner pre-fill, auto-fill ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "adel", pulls: pullsWith({ ADELPHIRANGER: ADELPHI }) });
    const r = await p.evaluate(() => {
      const out = {};
      for (const a of ["ollie", "tiny"]) {
        const sq = drrSquads(a), row = drrRows(a).find(x => x.e.id === "ADELPHIRANGER"), c = drrCounts(a);
        const w = glqRows(a).find(x => x.kind === "watch"), ad = w.rows.find(x => x.id === "ADELPHIRANGER");
        out[a] = { C: sq[2], bench: drrRows(a).filter(x => x.owned && !sq.flat().includes(x.e.id)).map(x => x.e.id).sort(), tier: row.tier, owned: c.owned, adelCur: mglCur(ad.u), done: w.doneCount, total: w.total };
      }
      drrAutoFill("ollie");
      const af = drrSquads("ollie").flat();
      drrResetSquads("ollie");
      out.auto = { has: af.includes("ADELPHIRANGER"), n: af.length };
      return out;
    });
    ck("owned Adelphi Ranger resolves by id + exact name on both accounts: 3★ G1 → T– (below the 4★ floor); 27 of 33 eligible owned", ["ollie", "tiny"].every(a => r[a].tier === -1 && r[a].owned === 27 && r[a].adelCur === "3★ G1"), JSON.stringify([r.ollie, r.tiny].map(x => [x.tier, x.owned, x.adelCur])));
    ck("squad C pre-fill once she is owned: Teva, Adelphi Ranger, R5-D4, Zeb, Ward (5) — Grogu & Anzellans moves to the bench", ["ollie", "tiny"].every(a => JSON.stringify(r[a].C) === JSON.stringify(["CARSONTEVA", "ADELPHIRANGER", "R5D4", "RANGERZEB", "BISHOP"]) && r[a].bench.includes("GOPHERANTS")), JSON.stringify([r.ollie.C, r.ollie.bench]));
    ck("'Auto-fill by tier' leaves a 3★ Adelphi Ranger out (it only takes floor-ready units)", r.auto.has === false && r.auto.n === 11, JSON.stringify(r.auto));
    await planner(p, "ollie");
    const m = await p.evaluate(() => { const row = document.querySelector('[data-card="drr-matrix"] .drr-row[data-drr-id="ADELPHIRANGER"]'); const c = document.querySelector('[data-drr-squad="C"]'); return { row: row.textContent.replace(/\s+/g, " "), off: row.classList.contains("drr-off"), guess: !!c.querySelector(".drr-sqhead .chip.grind") }; });
    ck("planner matrix: Adelphi Ranger row is owned (not greyed), tagged 'GL req R7', shows 3★ G1 / T–; squad C shows the 'tag-based guess' chip (Adelphi is fielded)", !m.off && /GL req R7/.test(m.row) && /3★ G1/.test(m.row) && /T–/.test(m.row) && m.guess, m.row.slice(0, 200));
    ck("no page errors (adelphi)", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ---------- 4. rendered text: Era, Events, Tier list, datacrons, Conquest, planner status ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "txt" });
    await L.go(p, "ollie", "modes");
    const strap = await p.evaluate(() => document.querySelector("[data-snap-era]").textContent);
    ck("Modes strapline on 23 Oct: Era 10 'The Mandalorian and Grogu' Mini-Era to 17 Nov 2026 (EL cap 75), not 'which Era is current isn't in this file'", /Era 10 “The Mandalorian and Grogu” Mini-Era to (17 Nov 2026|Nov 17, 2026)/.test(strap) && /EL cap 75/.test(strap) && !/isn't in this file/.test(strap), strap);
    await p.evaluate(() => { state.modesnav.category = "eras"; state.modesnav.eraView = "overview"; store.write(state); renderModesCategory(); renderEras(); }); await p.waitForTimeout(250);
    const era = await p.evaluate(() => document.getElementById("eraBody").textContent.replace(/\s+/g, " "));
    ck("Era overview: a 'Running now: Era 10 … Mini-Era' box with EL cap 75; Era 09 is described as ended; 'EL 135' is explicitly Era 09's", /Running now: Era of Rogue One/.test(era) && /Before it: Era 10 “The Mandalorian and Grogu” \(Mini-Era\)/.test(era) && /Era Level cap 75/.test(era) && /\(ended\)/.test(era) && /has ended/.test(era), era.slice(0, 300));   // rv48: ERA_NOW is Era of Rogue One; Era 10 (EL cap 75) is named in the box's 'Before it' line
    await p.evaluate(() => { state.modesnav.eraView = "leveling"; renderEras(); }); await p.waitForTimeout(150);
    const lv = await p.evaluate(() => document.getElementById("eraBody").textContent.replace(/\s+/g, " "));
    ck("Era Level card: 'EL 135 (Era 09 — the Mini-Era running now caps at EL 75)'", /EL 135 \(Era 09 — Era 10, the Mini-Era, capped at EL 75; Era of Rogue One’s cap was not read\)/.test(lv), (lv.match(/The Era Level cap.{0,80}/) || [""])[0]);   // rv48: the Mini-Era is over; Rogue One's cap was not read
    const body = await p.evaluate(() => { const parts = []; for (const t of ["overview", "modes", "coach", "farm", "leia"]) { switchTab(t); parts.push(document.body.innerText); } return parts.join("\n"); });
    ck("no rendered text says Era 09 / Myths & Legends is current or still running", !/The current Era \(Era 09\)/.test(body) && !/Era 09 “Myths & Legends” to 20 Oct/.test(body) && !/Era Challenges — Era 09/.test(body) && !/keyed to Myths & Legends units\. Do reachable/.test(body), "");
    await p.evaluate(() => { switchTab("events"); state.views.events = "next"; renderEvents(); }); await p.waitForTimeout(200);
    const ev = await p.evaluate(() => ({ rows: [...document.querySelectorAll("#eventsGrid .form-row.cqline-event")].map(r => r.textContent.replace(/\s+/g, " ")), exhausted: eventsSeedExhausted(), runout: /has run out/.test(document.getElementById("eventsGrid").textContent) }));
    ck("Events 'Current & next' on 23 Oct: 8 live/upcoming rows incl. the Mini-Era and Adelphi Ranger, nothing ended, the calendar is not 'run out'", ev.rows.length === 8 && ev.rows.some(r => /Mini-Era/.test(r)) && ev.rows.some(r => /Adelphi Ranger/.test(r)) && !ev.rows.some(r => /d ago/.test(r)) && !ev.exhausted && !ev.runout, JSON.stringify(ev.rows.map(r => r.slice(0, 40))));
    await p.evaluate(() => { switchTab("tierlist"); state.views.tierlist = "5v5"; render(); }); await p.waitForTimeout(200);
    const tl = await p.evaluate(() => document.getElementById("tierlistGrid").textContent.replace(/\s+/g, " "));
    ck("Tier List 5v5 card: 'Top 10 · Season 84 · 2.26M …', Cere Junda S, Satele Shan not in the top 10", /Top 10 · Season 84 · 2\.26M/.test(tl) && /Cere Junda/.test(tl) && !/Satele Shan/.test(tl) && !/Jango Fett/.test(tl), tl.slice(0, 200));
    await p.evaluate(() => { switchTab("intel"); state.views.intel = "datacrons"; render(); }); await p.waitForTimeout(200);
    const dc = await p.evaluate(() => (document.querySelector(".dc-sets") || {}).textContent || "");
    ck("Intel › Datacrons: active-set line lists the new Forge and Foundry (rv40, number inferred) first, then #36 “The Legend Codex” (no longer new), 35, 34, 33, and says the picks don't cover Set 36", /^Active sets/.test(dc.trim()) && /“Forge and Foundry” \(new\)/.test(dc) && /#36 “The Legend Codex” —/.test(dc) && dc.indexOf("Forge and Foundry") < dc.indexOf("#36") && dc.indexOf("#36") < dc.indexOf("#35") && dc.indexOf("#35") < dc.indexOf("#33") && /do not cover Set 36/.test(dc), dc.slice(0, 200));
    await p.evaluate(() => { switchTab("conquest"); }); await p.waitForTimeout(200);
    const cq = await p.evaluate(() => (document.querySelector(".cqrun") || {}).textContent || "");
    ck("Conquest tab status line carries the run-date caveat (rv25b: one run SOURCED, the rest UNVERIFIED) and a LOW-MODERATE chip", /Run dates, 25 Oct: ONE run is sourced/.test(cq) && /UNVERIFIED/.test(cq) && /LOW-MODERATE/.test(cq), cq.slice(0, 200));
    await planner(p, "ollie");
    const st = await p.evaluate(() => document.querySelector('[data-card="drr-status"]').textContent.replace(/\s+/g, " "));
    ck("raid planner status: 'near the end of the Mini-Era (~10–17 Nov, second-hand)', re-checked 10 Nov since rv40 (still version 1.0), fresh chip", /raid planner · live/.test(st) && /launch date unverified/.test(st) && /last re-checked 18 Nov 2026/.test(st) && /fresh/.test(st), st.slice(0, 240));   // rv48: the raid is LIVE (243 posted runs); re-checked 18 Nov
    const wv = await p.evaluate(() => document.querySelector('[data-card="drr-waves"]').textContent.replace(/\s+/g, " "));
    ck("raid planner waves card: wave 3 is live today (23–25 Oct) and the 13–15 Nov Zuckuss + 4-LOM rerun is noted", /Wave 3 is live/.test(wv) && /Zuckuss \+ 4-LOM additive drops rerun/.test(wv) && /13 Nov/.test(wv) && /15 Nov/.test(wv), wv.slice(0, 200));
    ck("no page errors (text)", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }
  /* 18 Nov: after the Mini-Era the strapline says so instead of naming it as current */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "nov18", at: AEDT(11, 18, 12) });
    await L.go(p, "ollie", "modes");
    const strap = await p.evaluate(() => document.querySelector("[data-snap-era]").textContent);
    ck("18 Nov: strapline says Era 10 ended 17 Nov and that the current Era isn't in this file", /Era of Rogue One to 9 Feb 2027/.test(strap) && /Era 10 ended 17 Nov 2026/.test(strap), strap);   // rv48: the current Era IS in this file now (Era of Rogue One, dates only)
    ck("no page errors (18 Nov)", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ---------- 5. escaping of the new strings ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "esc" });
    const H = '<img src=x onerror="window.__rf22=1"><b id="rf22x">x</b>';
    const r = await p.evaluate(h => {
      DROID_RAID.ELIGIBLE.find(e => e.name === "Adelphi Ranger").why = h; ERA_NOW.facts[0] = h; DATACRON_SETS[0].units = h; CQ_RUN_CAVEAT.text = h; MGL_SETS[3].src = h;
      const html = [drrMatrixCardHtml("ollie"), eraOverviewHtml(), datacronHtml(), cqRunStatusHtml(cqRunStatus()), mglSetsHtml(glqRows("ollie").find(x => x.kind === "watch").rows)].join("");
      const box = document.createElement("div"); box.innerHTML = html; document.body.appendChild(box);
      const out = { img: box.querySelectorAll("img").length, b: !!box.querySelector("#rf22x"), shown: (box.textContent.match(/<img src=x/g) || []).length };
      box.remove(); return out;
    }, H);
    await p.waitForTimeout(150);
    const fired = await p.evaluate(() => window.__rf22 === 1);
    ck("escaping: hostile text in the Adelphi note, ERA_NOW, the Set 36 roster, the Conquest caveat and the set-4 source renders as text — no element injected, nothing executed", r.img === 0 && !r.b && r.shown === 5 && !fired, JSON.stringify(r));
    ck("no page errors (escaping)", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ---------- 6. layout: 390 / 1280 on the touched cards, screenshots ---------- */
  for (const w of [1280, 390]) {
    const { ctx, p, errs } = await openAt(b, { tag: "lay" + w, width: w, height: w === 390 ? 900 : 1000, pulls: pullsWith({ ADELPHIRANGER: ADELPHI }) });
    const views = [
      ["mgl", async () => { await openGl(p, "ollie"); await p.evaluate(() => document.querySelector('#glTables [data-card="glq"] .mgl-set[data-mgl-set="4"]').scrollIntoView({ block: "center" })); }, '#glTables [data-card="glq"]'],
      ["drr", async () => { await planner(p, "ollie"); }, "#drrGrid"],
      ["drr-matrix", async () => { await planner(p, "ollie"); await p.evaluate(() => document.querySelector('[data-card="drr-matrix"] .drr-row[data-drr-id="ADELPHIRANGER"]').scrollIntoView({ block: "center" })); }, '[data-card="drr-matrix"]'],
      ["fleettier", async () => { await p.evaluate(() => { switchAcct("ollie"); switchTab("gaps"); state.views.gaps = "fleets"; render(); }); await p.waitForTimeout(250); await p.evaluate(() => document.querySelector('[data-card="fleettier"]').scrollIntoView({ block: "start" })); }, '[data-card="fleettier"]'],
      ["capjourneys", async () => { await p.evaluate(() => { switchAcct("ollie"); switchTab("arena"); sectionView("arena", "fleet"); }); await p.waitForTimeout(250); }, '[data-card="capjourneys"]'],
      ["events", async () => { await p.evaluate(() => { switchAcct("ollie"); switchTab("events"); state.views.events = "all"; renderEvents(); }); await p.waitForTimeout(250); }, "#eventsGrid"],
      ["tierlist", async () => { await p.evaluate(() => { switchAcct("ollie"); switchTab("tierlist"); state.views.tierlist = "5v5"; render(); }); await p.waitForTimeout(250); }, "#tierlistGrid"],
      ["counters", async () => { await p.evaluate(() => { switchAcct("ollie"); switchTab("gac"); sectionView("gac", "counters"); }); await p.waitForTimeout(300); }, "#tab-gac, #pane-gac"],
      ["era", async () => { await p.evaluate(() => { switchAcct("ollie"); switchTab("modes"); state.modesnav.category = "eras"; state.modesnav.eraView = "overview"; renderModesCategory(); renderEras(); }); await p.waitForTimeout(250); }, "#eraBody"],
      ["datacrons", async () => { await p.evaluate(() => { switchAcct("ollie"); switchTab("intel"); state.views.intel = "datacrons"; render(); }); await p.waitForTimeout(250); }, "#intelGrid"]
    ];
    for (const [name, go, sel] of views) {
      await go(); await p.waitForTimeout(120);
      const o = await L.overflow(p);
      const inner = await p.evaluate(s => { const el = document.querySelector(s); if (!el) return { found: false }; const wide = [...el.querySelectorAll("*")].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 1; }).length; return { found: true, wide }; }, sel);
      ck(`[${w}] ${name}: no horizontal overflow (page ${o.doc} ≤ ${o.inner}; nothing inside the card past the viewport)`, o.doc <= o.inner + 1 && inner.found && inner.wide === 0, JSON.stringify([o, inner]));
      await p.screenshot({ path: L.path.join(SHOTS, `rf22-${name}-${w}.png`), fullPage: false });
    }
    ck(`[${w}] no page errors (layout)`, errs.length === 0, errs.join(" | "));
    await ctx.close();
  }
  await L.finish(b, srv);
})().catch(e => { console.error(e); process.exit(2); });
