/* dta: 7 Oct 2026 data-refresh checks. GAC_FORMAT flip to 5v5, no stale "Season 83 / 3v3 season" prose, the events reseed keeps
   the user's own rows, every SNAPSHOTS date parses and is not in the future, expiry dates parse, and the refreshed constants
   (fleet tier rows, Executor, Conquest status wording, datacron expiries, Mandalorian & Grogu watch note) say what was verified.
   Run: cd DIR && NODE_PATH=/home/claude/.npm-global/lib/node_modules FILE=DIR/index.html PORT=8861 node tests/dta-check.js
   rf22 22 Oct 2026 — DELIBERATE updates for the data refresh (each marked "rf22" below): TODAY bound 15 → 22 Oct; Season 84 Event 3
   verified (est dropped); fleet rows Season 84 (Leviathan 96.5, Executor 93.2 / 18K, battles "in progress"); EXECUTOR_EVENT.asOf
   22 Oct; Mandalorian & Grogu note (kit revealed, 4 of 4 sets, 16 requirements); seed v9 (22 rows, captured 22 Oct, + Set 36 row,
   new row names); registry asOf values bumped where re-read (datacrons, meta-fleets, executor-event, gac-format, gac-schedule,
   tierlist, events); the Events-tab render check looks for the v9 rows (no Proving Grounds row any more).
   rv25 25 Oct 2026 — DELIBERATE: TODAY bound 25 Oct, seed v10 / 24 rows, gac-format asOf 25 Oct.
   rv25b 25 Oct 2026 (live swgoh.gg reads) — DELIBERATE, 9 assertions changed (old -> new, why):
     fleet asOf "22 Oct 2026" -> "25 Oct 2026" (re-verified live); seed v10 / CAPTURED 22 Oct -> v11 / 25 Oct; registry: datacrons, meta-fleets 22 Oct -> 25 Oct and
     tierlist, events 22 Oct -> 25 Oct (the other rf22 entries keep 22 Oct); reseed 5 -> 10 -> 5 -> 11; 24 rows -> 38 rows (ids seed0..seed37); the idempotent-reload row count
     26 -> 40 (38 + 2 user rows) and v10 -> v11; the real 20 Sep state upgrades to v11; the Conquest seed row was renamed "... — run 26 Oct -> 9 Nov" (sourced run, not the listed end).
     The datacron-expiry rows check (Set 33..36 dates) is UNCHANGED (the AEDT clock times are asserted in rv25b-check.js). The reseed row-name list also gained the new TB / TW rows.    rv31b 1 Nov 2026 — DELIBERATE (1 assertion): era hard end 2026-10-20 -> 2026-11-17 (Era 10's last live day; the entry now tracks Era 10).
   rv34 4 Nov 2026 — DELIBERATE (9 assertions + the pinned clock): PIN_NOW 1 Nov 12:00 AEDT -> 4 Nov 15:00 AEDT and TODAY 1 Nov -> 4 Nov (the refresh
     dated four registry entries 4 Nov); seed v12 / CAPTURED 1 Nov -> v13 / 4 Nov; registry datacrons + gac-schedule 1 Nov -> 4 Nov, events 1 Nov -> 4 Nov (meta-fleets,
     tierlist stay 1 Nov); reseed 5 -> 13; 40 -> 39 rows (seed0..seed38); idempotent reload 42 -> 41 rows, v13; 20 Sep state upgrades to v13; the reseed row-name
     list swaps the dropped Territory Battle / 2 Nov TW sign-up rows for the next-war sign-up and GAC Season 85 Week 1 rows.
   rv40 10 Nov 2026 — DELIBERATE (15 assertions): TODAY 4 Nov -> 10 Nov (the refresh dated eight registry entries 10 Nov; PIN_NOW stays 4 Nov 15:00 AEDT); s85e2 est true -> false (Week 2 sourced); Conquest knownThrough 2026-12-07 -> 2026-11-09; seed datacron rows: the Set 33 record row is dropped and Set 36 20 -> 21 Jan 2027;
     seed v13 / '4 Nov' -> v14 / '10 Nov'; registry datacrons + gac-schedule + events 4 Nov -> 10 Nov, gl-queue 1 Nov -> 10 Nov; hard ends conquest 7 Dec -> 9 Nov and gl-queue / ship-guide /
     nxt-queue 14 Nov -> 28 Nov; reseed 5 -> 14; 39 -> 43 rows (seed0..seed42); the reseed row-name list swaps the dropped Conquest / TW / Set 33 rows for the TB, Week 2, Era of Rogue One
     and Forge and Foundry rows; idempotent reload 41 -> 45 rows, v14; 20 Sep state upgrades to v14; the Events-tab render check now expects the TB / Era of Rogue One and the
     ABSENCE of the dropped Conquest 25 / Set 33 / Proving Grounds rows. The two 'every rendered Season 83' checks were fixed in the app (a new GL-order sentence was reworded), not here.
*/
process.env.PIN_NOW = process.env.PIN_NOW || "2026-11-04T04:00:00Z";   // rv40: deliberately left at 4 Nov (the Conquest live-day wording checks need a day inside Conquest 25's last run). rv34: Wed 4 Nov 2026 15:00 AEDT (the 4 Nov capture day; Season 85 Event 1 live). Was 2026-11-01T01:00:00Z.
//   // rv31: Sun 1 Nov 2026 12:00 AEDT (between Season 84 Event 3 and Season 85 Event 1) — this suite used the REAL clock before, so it rotted when the real date crossed a season boundary
const L = require("./lib.js");
const TODAY = "2026-11-10";   // rv40: the 10 Nov refresh moved events / datacrons / gac-schedule / droid-raid / gl-queue / nxt-queue / ship-guide / coach-tips to 10 Nov. rv34: the 4 Nov refresh moved events / datacrons / gac-schedule / coach-tips to 4 Nov.   // rv25: gac-format + droid-raid re-checked 25 Oct. rf22: every SNAPSHOTS date re-read in the 22 Oct refresh is now <= this   // upd 12 Oct: the SNAPSHOTS dates of the entries re-read on 12 Oct are now <= this; cap 15 Oct: cap-journeys is dated 2026-10-15 (the in-game screenshots), so the bound moved to 15 Oct
/* Rendered "Season 83" mentions that are legitimately about Season 83 DATA (a swgoh.gg tier-list / usage citation or the previous
   format), not a claim that Season 83 / 3v3 is the current GAC season. Anything else that matches /Season 83/ fails the check. */
const ALLOWED_S83 = [
  /swgoh\.gg'?s? (GAC tier lists )?\(?5v5 Season 82, 3v3 Season 83\)?/,        // GL_QUEUE.basis: which tier lists the analysis read
  /swgoh\.gg Season 83 \(4 Oct\)/,                                              // NXT_QUEUE skip row: Tarkin win-rate citation
  /swgoh\.gg'?s? Season 83 3v3 (squad|trio)/,                                   // Leia trio citations (3v3 data, now labelled as such)
  /\(swgoh\.gg Season 83, S-tier #6\)/,                                         // Leia 3v3 squad citation
  /3v3 \(1,455 battles, Season 83\)/,                                           // meta-squad note: win rate quoted at 3v3
  /flagship ownership, Season 83/,                                              // Fleet tier reference header (the fleet list IS Season 83)
  /Fleet Arena — [SA]-tier, Season 83/,                                         // META_FLEETS mode labels (same)
  /Season 83 \(3v3\)|\(Season 83, 3v3|Season 83 3v3/                            // usage-data source lines and tier-list method text
];
(async () => {
  const srv = await L.serve(); const b = await L.chromium.launch({ headless: true });

  /* ---- 1. constants, pure ---- */
  {
    const { ctx, p, errs } = await L.open(b, { tag: "pure" });
    const c = await p.evaluate(() => {
      const fleet = TIER_LIST.categories.find(k => k.key === "fleet");
      const row = n => fleet.squads.find(s => s.leader === n);
      const rs = cqRunStatus(new Date(2026, 9, 7));
      const mg = GL_QUEUE.watch.MANDOGROGU;
      return {
        fmt: GAC_FORMAT, strap: document.querySelector("[data-snap-gac]").textContent.trim(),
        gacHeading: JSON.stringify(GUIDANCE).includes("Grand Arena (5v5 season)") && !JSON.stringify(GUIDANCE).includes("Grand Arena (3v3 season)"),
        gcoFmt: gcoFormat("ollie"),
        fleet: { lev: row("Leviathan"), pro: row("Profundity"), exe: row("Executor"), n: fleet.squads.length, battles: fleet.battles, asOf: fleet.asOf },
        fleetTiersMatch: META_FLEET_TIER.every(t => (row(t.name) || {}).tier === t.tier),
        exec: { asOf: EXECUTOR_EVENT.asOf, next: executorEventOn(1, new Date(2026, 9, 7)), after: executorEventOn(1, new Date(2026, 9, 16)), cost: JSON.stringify(SHIP_STAR_COST),
          refresh: [EXECUTOR_EVENT.refreshCrystals, EXECUTOR_EVENT.refreshShards, EXECUTOR_EVENT.refreshMax, EXECUTOR_EVENT.packCrystals, EXECUTOR_EVENT.packShards, EXECUTOR_EVENT.shardsPerRun] },
        cq: { rs, knownThrough: CQDATA.knownThrough, conq: CQDATA.conquest, today: todayConquestLine(), html: cqRunStatusHtml(rs) },
        mg: { note: mg.note, req: mg.req.map(r => r[2]).join(",") },
        dcExp: DATACRON_RECS.filter(d => /Set 33/.test(d.set)).every(d => /EXPIRED 29 Oct 2026 18:00 AEDT/.test(d.detail) && /unverified/.test(d.detail) && !/before then/.test(d.detail) && /EXPIRED/.test(d.set)),
        seedDc: EVENTS_SEED.filter(e => /^Datacron Set \d+ (expires|expired)$/.test(e.name)).map(e => [e.name, e.date, e.ends]),
        seedAll: EVENTS_SEED.map(e => [e.date, e.ends || ""]), seedVer: EVENTS_SEED_VERSION, seedCaptured: EVENTS_SEED_CAPTURED,
        snaps: SNAPSHOTS.map(s => ({ key: s.key, asOf: s.asOf, iso: snapISO(s.asOf), exp: s.expires || null, expIso: s.expires ? snapISO(s.expires) : null })),
        sched: GAC_SCHEDULE.events.map(e => [e.id, e.format, e.start, !!e.est]),
        stateCqDayLabel: !!document.querySelector("body")
      };
    });
    L.ck("GAC_FORMAT is 5v5", c.fmt === "5v5", c.fmt);
    L.ck("strapline reads 'GAC (3v3 season)' at the pinned 1 Nov clock (rv31: between Season 84 Event 3 and Season 85 Event 1 the schedule's NEXT event decides, and Season 85 is 3v3)", /^GAC \(3v3 season\)/.test(c.strap), c.strap);
    L.ck("GUIDANCE 'Grand Arena (5v5 season)' headings follow the constant", c.gacHeading === true);
    L.ck("GCO default format follows the schedule (gacFormatNow) -> 3v3 at the pinned 1 Nov clock (GAC_FORMAT, the fallback constant, stays 5v5 until Season 85 starts)", c.gcoFmt === "3v3", c.gcoFmt);
    L.ck("GAC_SCHEDULE: Season 83 3v3 events, Season 84 5v5 events (upd 12 Oct: e2 verified; rf22: e3 verified from the live brackets), Season 85 3v3: E1 SOURCED (rv31: swgoh.gg/schedule/, no est), E2 SOURCED (rv40: Week 2 on the 10 Nov schedule), E3 still est", JSON.stringify(c.sched) === JSON.stringify([["s83e1", "3v3", "2026-09-09", false], ["s83e2", "3v3", "2026-09-16", false], ["s83e3", "3v3", "2026-09-23", false], ["s84e1", "5v5", "2026-10-07", false], ["s84e2", "5v5", "2026-10-14", false], ["s84e3", "5v5", "2026-10-21", false], ["s85e1", "3v3", "2026-11-04", false], ["s85e2", "3v3", "2026-11-11", false], ["s85e3", "3v3", "2026-11-18", true]]), JSON.stringify(c.sched));
    L.ck("Fleet tier list (rv31): Leviathan S 96.6, Profundity A 98.6, Executor B 93.3 / 26.5K (swgoh.gg Season 84, read 1 Nov)", c.fleet.lev.tier === "S" && c.fleet.lev.wr === 96.6 && c.fleet.pro.tier === "A" && c.fleet.pro.wr === 98.6 && c.fleet.exe.tier === "B" && c.fleet.exe.wr === 93.3 && c.fleet.exe.battles === "26.5K", JSON.stringify(c.fleet));
    L.ck("Fleet category (rf22, rv31): 11 rows, Season 84 in progress, asOf 1 Nov 2026 (first 6 rows re-read live); META_FLEET_TIER agrees row by row", c.fleet.n === 11 && /in progress/.test(c.fleet.battles) && c.fleet.asOf === "1 Nov 2026" && c.fleetTiersMatch);
    L.ck("EXECUTOR_EVENT.asOf 2026-10-22 (rf22: figures re-matched on swgohevents.com); next occurrence 15 Oct 2026 (and 15 Nov after it)", c.exec.asOf === "2026-10-22" && c.exec.next === "2026-10-15" && c.exec.after === "2026-11-15", JSON.stringify(c.exec));
    L.ck("SHIP_STAR_COST and Executor economy unchanged (65/85/100; 999 for 10, 19 refreshes, 1250 per pack)", c.exec.cost === '{"5":65,"6":85,"7":100}' && JSON.stringify(c.exec.refresh) === "[999,10,19,1250,10,10]", JSON.stringify(c.exec));
    L.ck("Conquest 25: live on 7 Oct, day 10 of 14, last live day 2026-10-11 (swgoh.gg lists 12 Oct = exclusive end), next run 2026-10-26", c.cq.conq === 25 && c.cq.rs.live && c.cq.rs.day === 10 && c.cq.rs.runEnd === "2026-10-11" && c.cq.rs.nextStart === "2026-10-26" && !c.cq.rs.stale, JSON.stringify(c.cq.rs));
    L.ck("Conquest knownThrough = 2026-11-09 (rv40: Conquest 25 ended and the 10 Nov schedule read lists no next run; the derived 7 Dec is gone)", c.cq.knownThrough === "2026-11-09");
    L.ck("Conquest status wording says 'last live day' and explains the exclusive end", ((/last live day/.test(c.cq.today || "") && /last live day/.test(c.cq.html) && /listed there as ending on the 12th/.test(c.cq.html)) || (/run 1 ended/.test(c.cq.today || "") && /Oct 26|26 Oct/.test(c.cq.today || ""))), (c.cq.today || "") + " || " + c.cq.html.slice(0, 220));
    L.ck("Mandalorian & Grogu watch note (rf22): kit revealed 20 Oct, NO release date, 8 entry tiers, Relic 10, 33 units; all 16 requirements in 4 of 4 sets (10,9,7,6,9,7,7,7,9,8,7,10,7,7,10,8)", /kit was revealed 20 Oct 2026/.test(c.mg.note) && /NO release date is announced/.test(c.mg.note) && /8 entry tiers/.test(c.mg.note) && /Relic 10/.test(c.mg.note) && /33 eligible/.test(c.mg.note) && /Rotta the Hutt, Grogu & Anzellans/.test(c.mg.note) && c.mg.req === "10,9,7,6,9,7,7,7,9,8,7,10,7,7,10,8", c.mg.note.slice(0, 160));
    L.ck("Datacron recs (rv31): Set 33 picks say EXPIRED 29 Oct 2026 18:00 AEDT, flag the post-expiry behaviour as unverified, and no longer say 'level before then'", c.dcExp === true);
    L.ck("Seed datacron rows (rv40): Set 34 expires 26 Nov, Set 35 24 Dec 2026, Set 36 21 Jan 2027 (the Set 33 record row is dropped; Forge and Foundry is named, not numbered — checked in rv40-check)", JSON.stringify(c.seedDc) === JSON.stringify([["Datacron Set 34 expires", "2026-11-26", "2026-11-26"], ["Datacron Set 35 expires", "2026-12-24", "2026-12-24"], ["Datacron Set 36 expires", "2027-01-21", "2027-01-21"]]), JSON.stringify(c.seedDc));
    const real = d => /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d + "T00:00:00Z")) && new Date(d + "T00:00:00Z").toISOString().slice(0, 10) === d;
    L.ck("every EVENTS_SEED date/ends is a real calendar date, ends >= date", c.seedAll.every(([d, e]) => real(d) && (!e || (real(e) && e >= d))), JSON.stringify(c.seedAll.filter(([d, e]) => !(real(d) && (!e || (real(e) && e >= d))))));
    L.ck("EVENTS_SEED_VERSION is 14 (rv40 10 Nov diff against swgoh.gg/schedule/); CAPTURED '10 Nov 2026'", c.seedVer === 14 && c.seedCaptured === "10 Nov 2026", c.seedVer + " / " + c.seedCaptured);
    L.ck("SNAPSHOTS registry now 24 unique keys (drr: + droid-raid, cap: + cap-journeys)", c.snaps.length === 24 && new Set(c.snaps.map(s => s.key)).size === 24, String(c.snaps.length));
    L.ck(`every SNAPSHOTS asOf parses and is <= ${TODAY}`, c.snaps.every(s => s.iso && s.iso <= TODAY), JSON.stringify(c.snaps.filter(s => !(s.iso && s.iso <= TODAY))));
    L.ck("every SNAPSHOTS expires parses and is >= its asOf", c.snaps.filter(s => s.exp).every(s => s.expIso && s.expIso >= s.iso), JSON.stringify(c.snaps.filter(s => s.exp)));
    const asOf = k => c.snaps.find(s => s.key === k).iso;
    L.ck("rv31: executor-event stays 2026-10-22 (not re-read) and gac-format stays 2026-10-25 (the season selector was not re-read); meta-fleets re-read 1 Nov = 2026-11-01; rv40: datacrons and gac-schedule (Season 85 Week 2) re-read 10 Nov = 2026-11-10", asOf("executor-event") === "2026-10-22" && asOf("gac-format") === "2026-10-25" && asOf("meta-fleets") === "2026-11-01" && ["datacrons", "gac-schedule"].every(k => asOf(k) === "2026-11-10"), JSON.stringify(["datacrons", "gac-format", "meta-fleets", "executor-event", "gac-schedule"].map(k => [k, asOf(k)])));
    L.ck("rv31: tierlist (re-read, rows updated) = 1 Nov; rv40: events (schedule diffed 10 Nov) = 10 Nov; NOT re-verified, so NOT bumped: conquest 27 Sep; gl-queue = 10 Nov since rv40 (both orders re-derived from the 10 Nov rosters; rv25c 1 Nov; was 3 Oct)", asOf("tierlist") === "2026-11-01" && asOf("events") === "2026-11-10" && asOf("conquest") === "2026-09-27" && asOf("gl-queue") === "2026-11-10", JSON.stringify(["tierlist", "events", "conquest", "gl-queue"].map(k => [k, asOf(k)])));
    L.ck("expiry-bearing entries still parse: era 17 Nov (rv31: Era 10's last live day; was Era 09's 20 Oct), conquest 9 Nov (rv40; was 7 Dec), gl-queue/ship-guide/nxt-queue 28 Nov (rv40; was 14 Nov)", ["era:2026-11-17", "conquest:2026-11-09", "gl-queue:2026-11-28", "ship-guide:2026-11-28", "nxt-queue:2026-11-28"].every(x => { const [k, d] = x.split(":"); return c.snaps.find(s => s.key === k).expIso === d; }));
    L.ck("zero page errors (pure)", errs.length === 0, JSON.stringify(errs));
    await ctx.close();
  }

  /* ---- 2. reseed: user events survive the 5 -> 6 seed bump ---- */
  {
    const st = JSON.parse(L.REAL);
    const old = st.events.items.filter(e => /^seed\d+$/.test(e.id)).slice(0, 16);
    st.eventsSeedVersion = 5;
    const __iso = n => { const d = new Date(Date.now() + n * 864e5); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };   /* clock-relative so the check does not rot */
    const mine = [
      { id: "e1790000000001", name: "Guild TW start", cat: "Other", date: __iso(0), ends: __iso(3), note: "my own note — keep" },
      { id: "e1790000000002", name: "Mod night <b>x</b>", cat: "Special", date: __iso(1), ends: __iso(4), note: "edited by hand" }
    ];
    st.events.items = old.concat(mine);
    const { ctx, p, errs } = await L.open(b, { tag: "reseed", state: JSON.stringify(st) });
    const r = await p.evaluate(() => ({ v: state.eventsSeedVersion, items: state.events.items, n: EVENTS_SEED.length }));
    const seedRows = r.items.filter(e => /^seed\d+$/.test(e.id));
    L.ck("reseed: version bumped 5 -> 14 (rv40: current seed version)", r.v === 14, String(r.v));
    L.ck("reseed: seed rows now equal EVENTS_SEED (43 rows after the rv40 diff), ids seed0..seed42 unique", seedRows.length === r.n && r.n === 43 && new Set(seedRows.map(e => e.id)).size === r.n && seedRows.every((e, i) => e.id === "seed" + i), r.n + "/" + seedRows.length);
    L.ck("reseed: the new Mini-Era / conquest / Dark Sovereign / datacron rows are present (rf22)", ["Era 10 — The Mandalorian and Grogu (Mini-Era)", "Territory Battle — Rise of the Empire", "GAC Season 85 (3v3)", "GAC Season 85 — Week 1 (3v3)", "GAC Season 85 — Week 2 (3v3)", "Era of Rogue One", "Dark Sovereign", "Datacron Set 34 expires", "Datacron Set 35 expires", "Datacron Set 36 expires", "Datacron set Forge and Foundry expires"].every(n => seedRows.some(e => e.name === n)));
    const k1 = r.items.find(e => e.id === "e1790000000001"), k2 = r.items.find(e => e.id === "e1790000000002");
    L.ck("reseed: user-added event 1 survives byte-for-byte", k1 && JSON.stringify(k1) === JSON.stringify(mine[0]), JSON.stringify(k1));
    L.ck("reseed: user-added event 2 (with markup in its name) survives byte-for-byte", k2 && JSON.stringify(k2) === JSON.stringify(mine[1]), JSON.stringify(k2));
    L.ck("reseed: user rows are kept AFTER the seed rows, none duplicated, total = seeds + 2", r.items.length === r.n + 2 && r.items.slice(r.n).map(e => e.id).join() === "e1790000000001,e1790000000002", r.items.length + "");
    await L.go(p, "ollie", "events");
    await p.evaluate(() => { const b = [...document.querySelectorAll("button,.pill")].find(e => e.innerText.trim() === "All events"); if (b) b.click(); });
    await p.waitForTimeout(400);
    const html = await p.evaluate(() => document.getElementById("pane-events") ? document.getElementById("pane-events").innerText : document.body.innerText);
    L.ck("reseed: the Events tab renders the user's own row and the markup is escaped, not executed", /Guild TW start/.test(html) && /Mod night <b>x<\/b>/.test(html), html.slice(0, 100));
    const bold = await p.evaluate(() => [...document.querySelectorAll(".cqline-event b, .form-row b")].some(e => e.textContent === "x"));
    L.ck("reseed: no <b> injected from a user event name", bold === false);
    /* reload with the SAME storage: version is 6 now, so nothing is reseeded and nothing is duplicated */
    await p.evaluate(() => { const e = state.events.items.find(x => x.id === "e1790000000001"); e.note = "edited after the bump"; store.write(state); });
    await p.reload({ waitUntil: "domcontentloaded" }); await p.waitForTimeout(900);
    const r2 = await p.evaluate(() => ({ v: state.eventsSeedVersion, n: state.events.items.length, note: (state.events.items.find(x => x.id === "e1790000000001") || {}).note }));
    L.ck("reseed: idempotent on reload — still 45 rows (43 seed + 2 user), v14, edit made after the bump kept", r2.v === 14 && r2.n === 45 && r2.note === "edited after the bump", JSON.stringify(r2));
    L.ck("zero page errors (reseed)", errs.length === 0, JSON.stringify(errs));
    await ctx.close();
    /* A pre-existing saved state (the real 20 Sep one, seed version 3, no user rows) also upgrades cleanly. */
    const o2 = await L.open(b, { tag: "reseed3" });
    const r3 = await o2.p.evaluate(() => ({ v: state.eventsSeedVersion, n: state.events.items.length, n2: EVENTS_SEED.length }));
    L.ck("reseed: the real 20 Sep state (seed v3) upgrades to v14 with exactly the seed rows", r3.v === 14 && r3.n === r3.n2, JSON.stringify(r3));
    await o2.ctx.close();
  }

  /* ---- 3. rendered text: no stale "3v3 season", "Season 83" only as data citations; every tab, both accounts, 1280 + 390 ---- */
  for (const w of [1280, 390]) {
    const { ctx, p, errs } = await L.open(b, { width: w, tag: "text" + w });
    const tabs = await p.evaluate(() => SUBTABS.map(t => t.key));
    const hits = new Set(); let bad3v3 = [], badS83 = [], overflow = [];
    const extra = ["gap:radar", "tierlist"];
    for (const acct of ["ollie", "tiny"]) for (const t of tabs) {
      await L.go(p, acct, t);
      if (t === "tierlist") for (const v of ["5v5", "3v3", "fleet", "method"]) { await p.evaluate(v => { state.views.tierlist = v; render(); }, v); await p.waitForTimeout(120); }
      const txt = await p.evaluate(() => document.body.innerText + "\n" + [...document.querySelectorAll("[title]")].map(e => e.title).join("\n") + "\n" + [...document.querySelectorAll("details")].map(e => e.textContent).join("\n"));
      for (const m of txt.matchAll(/3v3 season(?!\s*\d)/gi)) bad3v3.push(t + ": " + m[0]);
      for (const m of txt.matchAll(/.{0,70}Season 83.{0,70}/g)) { const s = m[0].replace(/\s+/g, " "); hits.add(s); if (!ALLOWED_S83.some(re => re.test(s))) badS83.push(t + ": " + s); }
      const o = await L.overflow(p); if (o.doc > o.inner + 1) overflow.push(`${acct}/${t} ${JSON.stringify(o)}`);
    }
    L.ck(`[${w}] no rendered "3v3 season" anywhere except the Modes strapline, which the schedule derives (rv31, pinned 1 Nov: Season 85 is 3v3) (all tabs, both accounts)`, bad3v3.filter(x => !/^modes: /.test(x)).length === 0 && bad3v3.some(x => /^modes: /.test(x)), JSON.stringify(bad3v3.slice(0, 5)));
    L.ck(`[${w}] every rendered "Season 83" is an allowed data citation (${hits.size} distinct, all matched the allow-list)`, badS83.length === 0, JSON.stringify(badS83.slice(0, 5)));
    L.ck(`[${w}] no horizontal overflow on any tab`, overflow.length === 0, JSON.stringify(overflow));
    /* visible UI that changed: strapline, Events, Tier list fleet, Gaps fleet card, Conquest, Intel > datacrons */
    await L.go(p, "ollie", "modes");
    const strap = await p.evaluate(() => (document.querySelector("[data-snap-gac]") || {}).textContent);
    L.ck(`[${w}] Modes strapline says GAC (3v3 season) with a chip (rv31: pinned 1 Nov, Season 85 pending)`, /GAC \(3v3 season\)/.test(strap || ""), strap);
    await L.go(p, "ollie", "events");
    /* upd 12 Oct: the 20-row seed has more than 8 live/upcoming rows, so "Current & next" no longer reaches the Conquest / datacron rows — read "All events" */
    await p.evaluate(() => { state.views.events = "all"; renderEvents(); }); await p.waitForTimeout(150);
    const ev = await p.evaluate(() => document.body.innerText);
    L.ck(`[${w}] Events tab lists the Territory Battle, the Mini-Era, Era of Rogue One and a datacron expiry (rv40 v14 rows; Conquest 25 and the Set 33 record row are dropped, no Proving Grounds row), nothing '(estimated)'`, /Territory Battle — Rise of the Empire/.test(ev) && /Era 10 — The Mandalorian and Grogu \(Mini-Era\)/.test(ev) && /Era of Rogue One/.test(ev) && !/\(estimated\)/.test(ev) && /Datacron Set 3[456] expires/.test(ev) && !/Conquest 25 \(Embo & Keibu\)/.test(ev) && !/Datacron Set 33 expired/.test(ev) && !/Proving Grounds/.test(ev));
    await L.go(p, "ollie", "tierlist");
    await p.evaluate(() => { state.views.tierlist = "fleet"; render(); }); await p.waitForTimeout(150);
    const fl = await p.evaluate(() => document.body.innerText);
    L.ck(`[${w}] Tier List fleet view shows 93.3% / 26.5K for Executor and Season 84 (rv31, read 1 Nov)`, /93\.3% WR · 26\.5K/.test(fl) && /Season 84/.test(fl), fl.slice(0, 120));
    await L.go(p, "ollie", "conquest");
    const cq = await p.evaluate(() => document.getElementById("cqBody") ? document.body.innerText : "");
    L.ck(`[${w}] Conquest tab status line reads live day with 'last live day' (no dated 'ends 11 Oct')`, /last live day/.test(cq), cq.slice(0, 160));
    await p.screenshot({ path: `${L.ROOT}/shots/dta-conquest-${w}.png` });
    await L.go(p, "ollie", "events"); await p.screenshot({ path: `${L.ROOT}/shots/dta-events-${w}.png` });
    await L.go(p, "ollie", "tierlist"); await p.screenshot({ path: `${L.ROOT}/shots/dta-tierlist-fleet-${w}.png` });
    L.ck(`[${w}] zero page errors`, errs.length === 0, JSON.stringify(errs.slice(0, 5)));
    await ctx.close();
  }

  /* ---- 4. raw source: "3v3 season" appears only in code comments about hypotheticals ---- */
  {
    const src = L.fs.readFileSync(L.FILE, "utf8").split("\n");
    const lines = src.map((t, i) => [i + 1, t]).filter(([, t]) => /3v3 season(?!\s*\d)/i.test(t));
    const allowed = lines.filter(([, t]) => /^\s*(\/\*|\*|in a 3v3 season|[a-z ].*\*\/$)/.test(t) || /in a 3v3 season are assumed/.test(t) || /3v3 season\)?[`"]?\s*\*\//.test(t));
    L.ck("raw file: remaining '3v3 season' text is only in code comments (gco block, hypothetical) — listed", lines.length === allowed.length, JSON.stringify(lines.map(([n, t]) => n + ": " + t.trim().slice(0, 100))));
  }

  await L.finish(b, srv);
})().catch(e => { console.error(e); process.exit(2); });
