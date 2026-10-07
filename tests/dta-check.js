/* dta: 7 Oct 2026 data-refresh checks. GAC_FORMAT flip to 5v5, no stale "Season 83 / 3v3 season" prose, the events reseed keeps
   the user's own rows, every SNAPSHOTS date parses and is not in the future, expiry dates parse, and the refreshed constants
   (fleet tier rows, Executor, Conquest status wording, datacron expiries, Mandalorian & Grogu watch note) say what was verified.
   Run: cd DIR && NODE_PATH=/home/claude/.npm-global/lib/node_modules FILE=DIR/index.html PORT=8861 node tests/dta-check.js */
const L = require("./lib.js");
const TODAY = "2026-10-07";
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
        dcExp: DATACRON_RECS.filter(d => /Set 33/.test(d.set)).every(d => /29 Oct 2026/.test(d.detail) && /before then/.test(d.detail)),
        seedDc: EVENTS_SEED.filter(e => /^Datacron Set \d+ expires$/.test(e.name)).map(e => [e.name, e.date, e.ends]),
        seedAll: EVENTS_SEED.map(e => [e.date, e.ends || ""]), seedVer: EVENTS_SEED_VERSION, seedCaptured: EVENTS_SEED_CAPTURED,
        snaps: SNAPSHOTS.map(s => ({ key: s.key, asOf: s.asOf, iso: snapISO(s.asOf), exp: s.expires || null, expIso: s.expires ? snapISO(s.expires) : null })),
        sched: GAC_SCHEDULE.events.map(e => [e.id, e.format, e.start, !!e.est]),
        stateCqDayLabel: !!document.querySelector("body")
      };
    });
    L.ck("GAC_FORMAT is 5v5", c.fmt === "5v5", c.fmt);
    L.ck("strapline reads 'GAC (5v5 season)'", /^GAC \(5v5 season\)/.test(c.strap), c.strap);
    L.ck("GUIDANCE 'Grand Arena (5v5 season)' headings follow the constant", c.gacHeading === true);
    L.ck("GCO default format follows GAC_FORMAT -> 5v5", c.gcoFmt === "5v5", c.gcoFmt);
    L.ck("GAC_SCHEDULE: Season 83 3v3 events, Season 84 5v5 events (e2/e3 estimates)", JSON.stringify(c.sched) === JSON.stringify([["s83e1", "3v3", "2026-09-09", false], ["s83e2", "3v3", "2026-09-16", false], ["s83e3", "3v3", "2026-09-23", false], ["s84e1", "5v5", "2026-10-07", false], ["s84e2", "5v5", "2026-10-14", true], ["s84e3", "5v5", "2026-10-21", true]]), JSON.stringify(c.sched));
    L.ck("Fleet tier list: Leviathan S 96.6, Profundity A 98.5, Executor B 93.0 (swgoh.gg Season 83, read 7 Oct)", c.fleet.lev.tier === "S" && c.fleet.lev.wr === 96.6 && c.fleet.pro.tier === "A" && c.fleet.pro.wr === 98.5 && c.fleet.exe.tier === "B" && c.fleet.exe.wr === 93.0 && c.fleet.exe.battles === "23.5K", JSON.stringify(c.fleet));
    L.ck("Fleet category: 11 rows, battles 3.98M, asOf 7 Oct 2026; META_FLEET_TIER agrees row by row", c.fleet.n === 11 && /3\.98M/.test(c.fleet.battles) && c.fleet.asOf === "7 Oct 2026" && c.fleetTiersMatch);
    L.ck("EXECUTOR_EVENT.asOf 2026-10-07; next occurrence 15 Oct 2026 (and 15 Nov after it)", c.exec.asOf === "2026-10-07" && c.exec.next === "2026-10-15" && c.exec.after === "2026-11-15", JSON.stringify(c.exec));
    L.ck("SHIP_STAR_COST and Executor economy unchanged (65/85/100; 999 for 10, 19 refreshes, 1250 per pack)", c.exec.cost === '{"5":65,"6":85,"7":100}' && JSON.stringify(c.exec.refresh) === "[999,10,19,1250,10,10]", JSON.stringify(c.exec));
    L.ck("Conquest 25: live on 7 Oct, day 10 of 14, last live day 2026-10-11 (swgoh.gg lists 12 Oct = exclusive end), next run 2026-10-26", c.cq.conq === 25 && c.cq.rs.live && c.cq.rs.day === 10 && c.cq.rs.runEnd === "2026-10-11" && c.cq.rs.nextStart === "2026-10-26" && !c.cq.rs.stale, JSON.stringify(c.cq.rs));
    L.ck("Conquest knownThrough stays 2026-12-07 (derived; later runs unconfirmed)", c.cq.knownThrough === "2026-12-07");
    L.ck("Conquest status wording says 'last live day' and explains the exclusive end", /last live day/.test(c.cq.today || "") && /last live day/.test(c.cq.html) && /listed there as ending on the 12th/.test(c.cq.html), (c.cq.today || "") + " || " + c.cq.html.slice(0, 220));
    L.ck("Mandalorian & Grogu watch note: no date, 8 entry tiers, Relic 10, 33 units; requirements unchanged (9,8,7,10)", /no exact date announced as of 7 Oct 2026/.test(c.mg.note) && /8 entry tiers/.test(c.mg.note) && /Relic 10/.test(c.mg.note) && /33 eligible/.test(c.mg.note) && /Rotta the Hutt and Grogu & Anzellans/.test(c.mg.note) && c.mg.req === "9,8,7,10", c.mg.note.slice(0, 160));
    L.ck("Datacron recs: Set 33 expiry 29 Oct with a 'level before then' note", c.dcExp === true);
    L.ck("Seed datacron-expiry rows: Set 33 29 Oct, Set 34 26 Nov, Set 35 24 Dec 2026", JSON.stringify(c.seedDc) === JSON.stringify([["Datacron Set 33 expires", "2026-10-29", "2026-10-29"], ["Datacron Set 34 expires", "2026-11-26", "2026-11-26"], ["Datacron Set 35 expires", "2026-12-24", "2026-12-24"]]), JSON.stringify(c.seedDc));
    const real = d => /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d + "T00:00:00Z")) && new Date(d + "T00:00:00Z").toISOString().slice(0, 10) === d;
    L.ck("every EVENTS_SEED date/ends is a real calendar date, ends >= date", c.seedAll.every(([d, e]) => real(d) && (!e || (real(e) && e >= d))), JSON.stringify(c.seedAll.filter(([d, e]) => !(real(d) && (!e || (real(e) && e >= d))))));
    L.ck("EVENTS_SEED_VERSION is 6; CAPTURED stays '1 Oct 2026' (swgoh.gg/events/ itself was not re-read)", c.seedVer === 6 && c.seedCaptured === "1 Oct 2026", c.seedVer + " / " + c.seedCaptured);
    L.ck("SNAPSHOTS registry still 22 unique keys", c.snaps.length === 22 && new Set(c.snaps.map(s => s.key)).size === 22, String(c.snaps.length));
    L.ck(`every SNAPSHOTS asOf parses and is <= ${TODAY}`, c.snaps.every(s => s.iso && s.iso <= TODAY), JSON.stringify(c.snaps.filter(s => !(s.iso && s.iso <= TODAY))));
    L.ck("every SNAPSHOTS expires parses and is >= its asOf", c.snaps.filter(s => s.exp).every(s => s.expIso && s.expIso >= s.iso), JSON.stringify(c.snaps.filter(s => s.exp)));
    const asOf = k => c.snaps.find(s => s.key === k).iso;
    L.ck("re-verified today: datacrons, gac-format, meta-fleets, executor-event, gac-schedule = 2026-10-07", ["datacrons", "gac-format", "meta-fleets", "executor-event", "gac-schedule"].every(k => asOf(k) === TODAY), JSON.stringify(["datacrons", "gac-format", "meta-fleets", "executor-event", "gac-schedule"].map(k => [k, asOf(k)])));
    L.ck("NOT re-verified, so NOT bumped: tierlist 30 Sep, events 1 Oct, conquest 27 Sep, gl-queue 3 Oct", asOf("tierlist") === "2026-09-30" && asOf("events") === "2026-10-01" && asOf("conquest") === "2026-09-27" && asOf("gl-queue") === "2026-10-03", JSON.stringify(["tierlist", "events", "conquest", "gl-queue"].map(k => [k, asOf(k)])));
    L.ck("expiry-bearing entries still parse: era 20 Oct, conquest 7 Dec, gl-queue/ship-guide/nxt-queue 14 Nov", ["era:2026-10-20", "conquest:2026-12-07", "gl-queue:2026-11-14", "ship-guide:2026-11-14", "nxt-queue:2026-11-14"].every(x => { const [k, d] = x.split(":"); return c.snaps.find(s => s.key === k).expIso === d; }));
    L.ck("zero page errors (pure)", errs.length === 0, JSON.stringify(errs));
    await ctx.close();
  }

  /* ---- 2. reseed: user events survive the 5 -> 6 seed bump ---- */
  {
    const st = JSON.parse(L.REAL);
    const old = st.events.items.filter(e => /^seed\d+$/.test(e.id)).slice(0, 16);
    st.eventsSeedVersion = 5;
    const mine = [
      { id: "e1790000000001", name: "Guild TW start", cat: "Other", date: "2026-10-10", ends: "", note: "my own note — keep" },
      { id: "e1790000000002", name: "Mod night <b>x</b>", cat: "Special", date: "2026-10-12", ends: "2026-10-13", note: "edited by hand" }
    ];
    st.events.items = old.concat(mine);
    const { ctx, p, errs } = await L.open(b, { tag: "reseed", state: JSON.stringify(st) });
    const r = await p.evaluate(() => ({ v: state.eventsSeedVersion, items: state.events.items, n: EVENTS_SEED.length }));
    const seedRows = r.items.filter(e => /^seed\d+$/.test(e.id));
    L.ck("reseed: version bumped 5 -> 6", r.v === 6, String(r.v));
    L.ck("reseed: seed rows now equal EVENTS_SEED (21 rows incl. the 5 appended), ids seed0..seed20 unique", seedRows.length === r.n && r.n === 21 && new Set(seedRows.map(e => e.id)).size === r.n && seedRows.every((e, i) => e.id === "seed" + i), r.n + "/" + seedRows.length);
    L.ck("reseed: the new conquest / datacron rows are present", ["Conquest 25 (Embo & Keibu) — run 1", "Proving Grounds (estimated)", "Datacron Set 33 expires", "Datacron Set 34 expires", "Datacron Set 35 expires"].every(n => seedRows.some(e => e.name === n)));
    const k1 = r.items.find(e => e.id === "e1790000000001"), k2 = r.items.find(e => e.id === "e1790000000002");
    L.ck("reseed: user-added event 1 survives byte-for-byte", k1 && JSON.stringify(k1) === JSON.stringify(mine[0]), JSON.stringify(k1));
    L.ck("reseed: user-added event 2 (with markup in its name) survives byte-for-byte", k2 && JSON.stringify(k2) === JSON.stringify(mine[1]), JSON.stringify(k2));
    L.ck("reseed: user rows are kept AFTER the seed rows, none duplicated, total = seeds + 2", r.items.length === r.n + 2 && r.items.slice(r.n).map(e => e.id).join() === "e1790000000001,e1790000000002", r.items.length + "");
    await L.go(p, "ollie", "events");
    const html = await p.evaluate(() => document.getElementById("eventsBody") ? document.getElementById("eventsBody").innerText : document.body.innerText);
    L.ck("reseed: the Events tab renders the user's own row and the markup is escaped, not executed", /Guild TW start/.test(html) && /Mod night <b>x<\/b>/.test(html), html.slice(0, 100));
    const bold = await p.evaluate(() => [...document.querySelectorAll(".cqline-event b, .form-row b")].some(e => e.textContent === "x"));
    L.ck("reseed: no <b> injected from a user event name", bold === false);
    /* reload with the SAME storage: version is 6 now, so nothing is reseeded and nothing is duplicated */
    await p.evaluate(() => { const e = state.events.items.find(x => x.id === "e1790000000001"); e.note = "edited after the bump"; store.write(state); });
    await p.reload({ waitUntil: "domcontentloaded" }); await p.waitForTimeout(900);
    const r2 = await p.evaluate(() => ({ v: state.eventsSeedVersion, n: state.events.items.length, note: (state.events.items.find(x => x.id === "e1790000000001") || {}).note }));
    L.ck("reseed: idempotent on reload — still 23 rows, v6, edit made after the bump kept", r2.v === 6 && r2.n === 23 && r2.note === "edited after the bump", JSON.stringify(r2));
    L.ck("zero page errors (reseed)", errs.length === 0, JSON.stringify(errs));
    await ctx.close();
    /* A pre-existing saved state (the real 20 Sep one, seed version 3, no user rows) also upgrades cleanly. */
    const o2 = await L.open(b, { tag: "reseed3" });
    const r3 = await o2.p.evaluate(() => ({ v: state.eventsSeedVersion, n: state.events.items.length, n2: EVENTS_SEED.length }));
    L.ck("reseed: the real 20 Sep state (seed v3) upgrades to v6 with exactly the seed rows", r3.v === 6 && r3.n === r3.n2, JSON.stringify(r3));
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
    L.ck(`[${w}] no rendered "3v3 season" anywhere (all tabs, both accounts)`, bad3v3.length === 0, JSON.stringify(bad3v3.slice(0, 5)));
    L.ck(`[${w}] every rendered "Season 83" is an allowed data citation (${hits.size} distinct, all matched the allow-list)`, badS83.length === 0, JSON.stringify(badS83.slice(0, 5)));
    L.ck(`[${w}] no horizontal overflow on any tab`, overflow.length === 0, JSON.stringify(overflow));
    /* visible UI that changed: strapline, Events, Tier list fleet, Gaps fleet card, Conquest, Intel > datacrons */
    await L.go(p, "ollie", "modes");
    const strap = await p.evaluate(() => (document.querySelector("[data-snap-gac]") || {}).textContent);
    L.ck(`[${w}] Modes strapline says GAC (5v5 season) with a chip`, /GAC \(5v5 season\)/.test(strap || ""), strap);
    await L.go(p, "ollie", "events");
    const ev = await p.evaluate(() => document.body.innerText);
    L.ck(`[${w}] Events tab lists Conquest 25, Proving Grounds (estimated) and a datacron expiry`, /Conquest 25 \(Embo & Keibu\)/.test(ev) && /Proving Grounds \(estimated\)/.test(ev) && /Datacron Set 3[345] expires/.test(ev));
    await L.go(p, "ollie", "tierlist");
    await p.evaluate(() => { state.views.tierlist = "fleet"; render(); }); await p.waitForTimeout(150);
    const fl = await p.evaluate(() => document.body.innerText);
    L.ck(`[${w}] Tier List fleet view shows 93.0% / 23.5K for Executor and 3.98M battles`, /93(\.0)?% WR · 23\.5K/.test(fl) && /3\.98M/.test(fl), fl.slice(0, 120));
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
