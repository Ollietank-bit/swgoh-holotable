/* upd: 12 Oct 2026 data-refresh checks. Clock pinned with Playwright's clock (setFixedTime) so BOTH Date.now() and the no-argument
   new Date() the Events code uses read the pinned instant, in an Australia/Sydney context (AEDT, UTC+11).
   Covers: EVENTS_SEED contents + dates (both accounts, rendered), Proving Grounds confirmed, Bonus Proving Grounds, the Dark Sovereign
   (Leviathan) note and that it stays out of the Executor advice, the 12 Oct seed bump keeping user-added rows, ended events not
   upcoming, GAC_SCHEDULE flags + Season 85 inference + format, SNAPSHOTS asOf, the Conquest wording on 11 Oct / 12 Oct (04:00 and
   19:05) / 13 Oct, 390px overflow, zero page errors.
   Run: cd DIR && NODE_PATH=/home/claude/.npm-global/lib/node_modules FILE=DIR/index.html PORT=9230 node tests/upd-check.js */
const L = require("./lib.js");
const AEDT = (d, h, m) => Date.UTC(2026, 9, d, h - 11, m || 0);   // 2026-10-<d> h:m AEDT (UTC+11) as epoch ms
const NOW = Date.UTC(2026, 9, 12, 8, 5);                          // 12 Oct 2026 08:05Z = 19:05 AEDT
async function openAt(b, o) {
  o = o || {};
  const ctx = await b.newContext({ viewport: { width: o.width || 1280, height: o.height || 1000 }, timezoneId: "Australia/Sydney", locale: "en-AU" });
  await ctx.clock.setFixedTime(o.at || NOW);
  await ctx.addInitScript(([s, pl, seedKey]) => {
    try { if (!sessionStorage.getItem(seedKey)) { localStorage.clear(); localStorage.setItem("swgoh-tracker", s); localStorage.setItem("swgoh-holotable-pulls-v1", pl); sessionStorage.setItem(seedKey, "1"); } } catch (e) {}
  }, [o.state || L.REAL, L.PULLS, "seeded-" + (o.tag || "x")]);
  await ctx.route(/fonts\.g|swgoh\.gg|corsproxy|allorigins|codetabs|api\.github/, r => r.abort());
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push(String(e).slice(0, 300)));
  p.on("console", m => { if (m.type() === "error" && !/Failed to load resource|net::ERR|fonts\.g/.test(m.text())) errs.push("console: " + m.text().slice(0, 200)); });
  await p.goto(`http://127.0.0.1:${L.PORT}/x.html`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(900);
  return { ctx, p, errs };
}
/* every rendered Events row: label | name | cat | starts | ends | note */
const evRows = p => p.evaluate(() => [...document.querySelectorAll("#eventsGrid .form-row.cqline-event")].map(r => {
  const f = [...r.querySelectorAll(".form-field .txt")].map(x => x.textContent.trim());
  return { label: r.children[0].textContent.trim(), name: f[0], cat: (r.querySelector(".chip") || {}).textContent.replace(/^\S+\s/, "").trim(), starts: f[1], ends: f[2], note: f[3] };
}));
(async () => {
  const srv = await L.serve(); const b = await L.chromium.launch({ headless: true });

  /* ---------- 1. constants + seed, pure (12 Oct 19:05 AEDT) ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "pure" });
    const c = await p.evaluate(() => ({
      now: new Date().toString(), nowMs: Date.now(), off: new Date().getTimezoneOffset(),
      ver: EVENTS_SEED_VERSION, cap: EVENTS_SEED_CAPTURED, seed: EVENTS_SEED.map(e => [e.name, e.cat, e.date, e.ends || "", e.note]),
      items: state.events.items.map(e => [e.id, e.name]), stateVer: state.eventsSeedVersion,
      sched: GAC_SCHEDULE.events.map(e => [e.id, e.season, e.event, e.format, e.start, !!e.est]), schedAsOf: GAC_SCHEDULE.asOf,
      reg: SNAPSHOTS.length, snaps: Object.fromEntries(SNAPSHOTS.map(s => [s.key, s.asOf])),
      ids: SNAPSHOTS.map(s => s.key)
    }));
    L.ck("clock pinned to Mon 12 Oct 2026 19:05 AEDT (UTC+11)", /Mon Oct 12 2026 19:05/.test(c.now) && c.off === -660 && c.nowMs === NOW, c.now);
    L.ck("EVENTS_SEED_VERSION is 7, EVENTS_SEED_CAPTURED is '12 Oct 2026', saved state was reseeded to 7", c.ver === 7 && c.cap === "12 Oct 2026" && c.stateVer === 7, JSON.stringify([c.ver, c.cap, c.stateVer]));
    const by = Object.fromEntries(c.seed.map(r => [r[0], r]));
    /* [name, cat, date, ends] — dates are LOCAL Sydney calendar dates; ends = last live day (a 05:00 AEDT close is the day before) */
    const want = [
      ["Ultimate Journey Event", "Journey", "2026-10-12", "2026-10-12"],
      ["Terrible Tings", "Legendary", "2026-10-01", "2026-10-20"],
      ["The Wanderer's Blade", "Marquee", "2026-10-06", "2026-10-13"],
      ["Bonus Proving Grounds", "Other", "2026-10-12", "2026-10-12"],
      ["Coruscant", "Omega Battle", "2026-10-12", "2026-10-13"],
      ["Smuggler's Run", "Resource Event", "2026-10-12", ""],
      ["Proving Grounds", "Other", "2026-10-13", "2026-10-13"],
      ["Defense of Dathomir", "Special", "2026-10-13", ""],
      ["The Ronin", "Era Challenge", "2026-10-14", ""],
      ["Secrets and Shadows", "Assault Battle", "2026-10-14", ""],
      ["Shattered Empire", "Era Battle", "2026-10-15", ""],
      ["Hoth", "Omega Battle", "2026-10-16", ""],
      ["Daring Droid", "Mythic", "2026-10-17", ""],
      ["Military Might", "Assault Battle", "2026-10-17", ""],
      ["Dathomir", "Omega Battle", "2026-10-19", ""],
      ["Dark Sovereign", "Fleet Mastery", "2026-10-20", ""],
      ["Conquest 25 (Embo & Keibu) — run 1", "Other", "2026-09-28", "2026-10-11"],
      ["Datacron Set 33 expires", "Other", "2026-10-29", "2026-10-29"],
      ["Datacron Set 34 expires", "Other", "2026-11-26", "2026-11-26"],
      ["Datacron Set 35 expires", "Other", "2026-12-24", "2026-12-24"]
    ];
    L.ck("EVENTS_SEED has exactly the 15 swgoh.gg events (minus the auto Executor row) + Conquest + 3 datacron rows = 20", c.seed.length === 20 && want.length === 20 && c.seed.every(r => want.some(w => w[0] === r[0])), c.seed.length + ": " + c.seed.map(r => r[0]).join(" | "));
    const bad = want.filter(w => { const r = by[w[0]]; return !r || r[1] !== w[1] || r[2] !== w[2] || r[3] !== w[3]; });
    L.ck("every seed row's category / start / last-live-day matches the 12 Oct swgoh.gg conversion", bad.length === 0, JSON.stringify(bad.map(w => [w, by[w[0]]])));
    L.ck("Terrible Tings keeps the old 'Ends Tue 20 Oct' (21 Oct 05:00 AEDT close = last live day 20 Oct) — same convention as the 1 Oct row", by["Terrible Tings"][3] === "2026-10-20" && /21 Oct 05:00 AEDT/.test(by["Terrible Tings"][4]), by["Terrible Tings"][4]);
    L.ck("Discarded Doctrine is NOT a seed row (the derived 'auto' Executor row covers it — no duplicate)", !c.seed.some(r => /Discarded Doctrine/.test(r[0])) && c.items.length === 20, "");
    L.ck("Proving Grounds: no '(estimated)' in the name, start CONFIRMED in the note; Conquest row no longer says estimated/ESTIMATE for it", !/estimat/i.test(by["Proving Grounds"][0]) && /CONFIRMED/.test(by["Proving Grounds"][4]) && !c.seed.some(r => /\(estimated\)/.test(r[0])), by["Proving Grounds"][4]);
    L.ck("Bonus Proving Grounds row: live 12 Oct, ends 13 Oct 05:00 AEDT in the note", /13 Oct 05:00 AEDT/.test(by["Bonus Proving Grounds"][4]), by["Bonus Proving Grounds"][4]);
    const ds = by["Dark Sovereign"][4];
    L.ck("Dark Sovereign note: requires Leviathan (tier 4 + 4★), neither account owns it, not Executor advice", /REQUIRES/.test(ds) && /Leviathan/.test(ds) && /tier 4/.test(ds) && /4★/.test(ds) && /Neither Ollie nor Tiny owns Leviathan/.test(ds) && /Executor/.test(ds), ds);
    L.ck("Conquest 25 row: last live day 11 Oct, note says 12 Oct is the close and the run is over from 12 Oct; runs 2-3 'inferred, unconfirmed'", /12 Oct is the day it closes/.test(by["Conquest 25 (Embo & Keibu) — run 1"][4]) && /inferred, unconfirmed/.test(by["Conquest 25 (Embo & Keibu) — run 1"][4]), by["Conquest 25 (Embo & Keibu) — run 1"][4]);
    L.ck("GAC_SCHEDULE: S84E2 verified (no est), S84E3 est, S85 (3v3) 4/11/18 Nov est, asOf 2026-10-12",
      JSON.stringify(c.sched) === JSON.stringify([["s83e1", 83, 1, "3v3", "2026-09-09", false], ["s83e2", 83, 2, "3v3", "2026-09-16", false], ["s83e3", 83, 3, "3v3", "2026-09-23", false],
        ["s84e1", 84, 1, "5v5", "2026-10-07", false], ["s84e2", 84, 2, "5v5", "2026-10-14", false], ["s84e3", 84, 3, "5v5", "2026-10-21", true],
        ["s85e1", 85, 1, "3v3", "2026-11-04", true], ["s85e2", 85, 2, "3v3", "2026-11-11", true], ["s85e3", 85, 3, "3v3", "2026-11-18", true]]) && c.schedAsOf === "2026-10-12", JSON.stringify(c.sched));
    L.ck("seasons start every 28 days (S83 9 Sep, S84 7 Oct, S85 4 Nov) and each season's events are 7 days apart",
      (Date.UTC(2026, 9, 7) - Date.UTC(2026, 8, 9)) / 864e5 === 28 && (Date.UTC(2026, 10, 4) - Date.UTC(2026, 9, 7)) / 864e5 === 28 && c.sched.filter(r => r[2] > 1).every(r => { const prev = c.sched.find(q => q[1] === r[1] && q[2] === r[2] - 1); return (Date.UTC(...r[4].split("-").map((x, i) => i === 1 ? x - 1 : +x)) - Date.UTC(...prev[4].split("-").map((x, i) => i === 1 ? x - 1 : +x))) / 864e5 === 7; }), "");
    const snap = k => c.snaps[k];
    L.ck("SNAPSHOTS: registry still 22 entries", c.reg === 22, String(c.reg));
    L.ck("SNAPSHOTS asOf 2026-10-12 for the entries re-read today: events, gac-schedule, gac-format", snap("events") === "2026-10-12" && snap("gac-schedule") === "2026-10-12" && snap("gac-format") === "2026-10-12", JSON.stringify([snap("events"), snap("gac-schedule"), snap("gac-format")]));
    L.ck("SNAPSHOTS NOT bumped where the content was not re-read: conquest (plan/feats/enemy intel) 2026-09-27, executor-event (pricing) 2026-10-07", snap("conquest") === "2026-09-27" && snap("executor-event") === "2026-10-07", JSON.stringify([snap("conquest"), snap("executor-event")]));
    L.ck("no SNAPSHOTS asOf is in the future (after 12 Oct)", Object.values(c.snaps).every(a => !a || a <= "2026-10-12"), JSON.stringify(c.snaps));
    L.ck("zero page errors (pure)", errs.length === 0, JSON.stringify(errs));
    await ctx.close();
  }

  /* ---------- 2. GAC formats + labels at pinned moments ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "gac" });
    const g = await p.evaluate(([a, bb, c, d, e]) => {
      const pick = ms => { const ev = gcfEventNow(ms); return ev ? { id: ev.id, live: ev.gcfLive, est: !!ev.est, fmt: gacFormatNow(ms) } : null; };
      return { oct12: pick(a), oct15: pick(bb), oct22: pick(c), nov5: pick(d), nov19: pick(e), after: pick(Date.UTC(2026, 10, 30)) };
    }, [AEDT(12, 19), AEDT(15, 12), AEDT(22, 12), AEDT(5 + 31, 12), AEDT(19 + 31, 12)]);
    L.ck("12 Oct: S84E1 live (5v5, verified)", g.oct12.id === "s84e1" && g.oct12.live && !g.oct12.est && g.oct12.fmt === "5v5", JSON.stringify(g.oct12));
    L.ck("15 Oct: S84E2 live, verified (est false), 5v5", g.oct15.id === "s84e2" && g.oct15.live && !g.oct15.est && g.oct15.fmt === "5v5", JSON.stringify(g.oct15));
    L.ck("22 Oct: S84E3 live but ESTIMATED", g.oct22.id === "s84e3" && g.oct22.live && g.oct22.est, JSON.stringify(g.oct22));
    L.ck("5 Nov: S85E1 live (3v3, estimated) and the format follows it; 19 Nov: S85E3", g.nov5.id === "s85e1" && g.nov5.fmt === "3v3" && g.nov5.est && g.nov19.id === "s85e3", JSON.stringify([g.nov5, g.nov19]));
    L.ck("30 Nov: schedule has run out (null)", g.after === null, JSON.stringify(g.after));
    const gap = await p.evaluate(ms => { const e = gcfEventNow(ms); return e ? { id: e.id, live: e.gcfLive } : null; }, AEDT(29, 12) + 0 * 1);
    L.ck("29 Oct (after S84E3's 7-day window, before S85E1): not live, next is S85E1", gap && gap.id === "s85e1" && gap.live === false, JSON.stringify(gap));
    L.ck("zero page errors (gac)", errs.length === 0, JSON.stringify(errs));
    await ctx.close();
  }

  /* ---------- 3. Events tab rendered, both accounts, 1280 + 390 ---------- */
  for (const w of [1280, 390]) {
    const { ctx, p, errs } = await openAt(b, { width: w, tag: "events" + w });
    for (const acct of ["ollie", "tiny"]) {
      await L.go(p, acct, "events");
      await p.evaluate(() => { state.views.events = "all"; renderEvents(); }); await p.waitForTimeout(150);
      const rows = await evRows(p);
      const row = n => rows.find(r => r.name === n);
      L.ck(`[${w}] ${acct}: All events lists 21 rows (20 seed + the auto Executor row)`, rows.length === 21 && rows.some(r => /^Discarded Doctrine/.test(r.name)), rows.length + "");
      L.ck(`[${w}] ${acct}: Proving Grounds row — 'Tomorrow', starts 13 Oct, no 'estimated'`, row("Proving Grounds") && row("Proving Grounds").label === "Tomorrow" && /13 Oct/.test(row("Proving Grounds").starts) && !/estimat/i.test(row("Proving Grounds").name + row("Proving Grounds").note), JSON.stringify(row("Proving Grounds")));
      L.ck(`[${w}] ${acct}: live rows read Ends today (Ultimate Journey, Bonus PG), 1d left (Coruscant, Wanderer's Blade), 8d left (Terrible Tings)`,
        row("Ultimate Journey Event").label === "Ends today" && row("Bonus Proving Grounds").label === "Ends today" && row("Coruscant").label === "1d left" && row("The Wanderer's Blade").label === "1d left" && row("Terrible Tings").label === "8d left" && /20 Oct/.test(row("Terrible Tings").ends),
        JSON.stringify(["Ultimate Journey Event", "Bonus Proving Grounds", "Coruscant", "The Wanderer's Blade", "Terrible Tings"].map(n => [n, row(n).label, row(n).ends])));
      L.ck(`[${w}] ${acct}: Conquest 25 run 1 shows as over ('1d ago'), last day 11 Oct — never 'Ends today'`, row("Conquest 25 (Embo & Keibu) — run 1").label !== "Ends today" && /^\d+d ago$/.test(row("Conquest 25 (Embo & Keibu) — run 1").label) && /11 Oct/.test(row("Conquest 25 (Embo & Keibu) — run 1").ends), JSON.stringify(row("Conquest 25 (Embo & Keibu) — run 1")));
      L.ck(`[${w}] ${acct}: upcoming rows — Dark Sovereign 8d (20 Oct), Hoth 4d, Dathomir 7d, Smuggler's Run Today`, row("Dark Sovereign").label === "in 8d" && /20 Oct/.test(row("Dark Sovereign").starts) && row("Hoth").label === "in 4d" && row("Dathomir").label === "in 7d" && row("Smuggler's Run").label === "Today", JSON.stringify([row("Dark Sovereign"), row("Hoth"), row("Dathomir"), row("Smuggler's Run")].map(r => r && r.label)));
      L.ck(`[${w}] ${acct}: Dark Sovereign note on screen says it requires Leviathan and neither account owns it`, /REQUIRES completing the Leviathan Fleet Mastery tier 4/.test(row("Dark Sovereign").note) && /Neither Ollie nor Tiny owns Leviathan/.test(row("Dark Sovereign").note), row("Dark Sovereign").note.slice(0, 120));
      const oAll = await L.overflow(p);
      L.ck(`[${w}] ${acct}: All events view (long notes) has no horizontal overflow`, oAll.doc <= oAll.inner + 1, JSON.stringify(oAll));
      await p.evaluate(() => { state.views.events = "next"; renderEvents(); }); await p.waitForTimeout(150);
      const nx = await evRows(p);
      L.ck(`[${w}] ${acct}: Current & next shows no ended event (no Conquest 25 row, nothing '…d ago' except none), first 8 are live/upcoming`, nx.length === 8 && !nx.some(r => /Conquest 25/.test(r.name) || /d ago$/.test(r.label)), nx.map(r => r.name + ":" + r.label).join(" | "));
      const exh = await p.evaluate(() => eventsSeedExhausted());
      L.ck(`[${w}] ${acct}: calendar is not reported as 'run out'`, exh === false, String(exh));
      const o = await L.overflow(p);
      L.ck(`[${w}] ${acct}: Events tab has no horizontal overflow`, o.doc <= o.inner + 1, JSON.stringify(o));
    }
    await p.evaluate(() => { state.views.events = "all"; renderEvents(); }); await p.waitForTimeout(150);
    await p.screenshot({ path: `${L.ROOT}/shots/upd-events-${w}.png`, fullPage: true });
    for (const acct of ["ollie", "tiny"]) for (const tab of ["overview", "conquest", "gac", "coach"]) {
      await L.go(p, acct, tab);
      const o = await L.overflow(p);
      L.ck(`[${w}] ${acct}/${tab}: no horizontal overflow`, o.doc <= o.inner + 1, JSON.stringify(o));
    }
    await L.go(p, "ollie", "overview"); await p.screenshot({ path: `${L.ROOT}/shots/upd-overview-${w}.png` });
    L.ck(`[${w}] zero page errors`, errs.length === 0, JSON.stringify(errs.slice(0, 5)));
    await ctx.close();
  }

  /* ---------- 4. ended events never upcoming; Dark Sovereign stays out of the Executor advice ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "up" });
    const r = await p.evaluate(() => ({
      up: upcomingEvents(30).map(e => e.name), rem: eventReminderHtml().replace(/<[^>]+>/g, " ").replace(/\s+/g, " "), today: todayEventRows().map(e => [e.name, e.when]),
      exec: ["ollie", "tiny"].map(a => JSON.stringify(executorProgress(a, new Date())) + executorProgressHtml()).join("\n")
    }));
    L.ck("upcomingEvents(): the ended Conquest 25 run 1 is not in it; live/upcoming are", !r.up.some(n => /Conquest 25/.test(n)) && r.up.includes("Terrible Tings") && r.up.includes("Dark Sovereign"), r.up.join(" | "));
    L.ck("event reminders (Overview) never mention Conquest 25 as ending today", !/Conquest/.test(r.rem), r.rem.slice(0, 200));
    L.ck("Today strip events on 12 Oct: Ultimate Journey + Bonus Proving Grounds end today; Conquest is absent", r.today.some(t => t[0] === "Ultimate Journey Event" && t[1] === "ends today") && r.today.some(t => t[0] === "Bonus Proving Grounds" && t[1] === "ends today") && !r.today.some(t => /Conquest/.test(t[0])), JSON.stringify(r.today));
    L.ck("Executor progress/advice (both accounts) never mentions Leviathan or Dark Sovereign", !/Leviathan|Dark Sovereign/i.test(r.exec), r.exec.slice(0, 100));
    L.ck("zero page errors (upcoming)", errs.length === 0, JSON.stringify(errs));
    await ctx.close();
  }

  /* ---------- 5. reseed 6 -> 7 keeps the user's own rows ---------- */
  {
    const st = JSON.parse(L.REAL);
    const mine = [
      { id: "e1790000000001", name: "Guild TW start", cat: "Other", date: "2026-10-14", ends: "", note: "my own note — keep" },
      { id: "e1790000000002", name: "Mod night <b>x</b>", cat: "Special", date: "2026-10-12", ends: "2026-10-13", note: "edited by hand" }
    ];
    st.eventsSeedVersion = 6;
    st.events.items = [{ id: "seed0", name: "Terrible Tings", cat: "Legendary", date: "2026-10-01", ends: "2026-10-20", note: "old" }, { id: "seed2", name: "Jaxxon", cat: "Era Challenge", date: "2026-10-01", ends: "2026-10-06", note: "old" }].concat(mine);
    const { ctx, p, errs } = await openAt(b, { tag: "reseed", state: JSON.stringify(st) });
    const r = await p.evaluate(() => ({ v: state.eventsSeedVersion, items: state.events.items, n: EVENTS_SEED.length }));
    const seeds = r.items.filter(e => /^seed\d+$/.test(e.id));
    L.ck("reseed 6 -> 7: version 7, seed rows = EVENTS_SEED (20), ids seed0..seed19, the old Jaxxon row is gone", r.v === 7 && seeds.length === 20 && r.n === 20 && seeds.every((e, i) => e.id === "seed" + i) && !seeds.some(e => e.name === "Jaxxon"), r.v + " / " + seeds.length);
    const k1 = r.items.find(e => e.id === "e1790000000001"), k2 = r.items.find(e => e.id === "e1790000000002");
    L.ck("reseed: both user-added events survive byte-for-byte and come after the seed rows", JSON.stringify(k1) === JSON.stringify(mine[0]) && JSON.stringify(k2) === JSON.stringify(mine[1]) && r.items.slice(20).map(e => e.id).join() === "e1790000000001,e1790000000002", JSON.stringify(r.items.slice(20).map(e => e.id)));
    await L.go(p, "ollie", "events");
    await p.evaluate(() => { state.views.events = "all"; renderEvents(); }); await p.waitForTimeout(150);
    const rows = await evRows(p);
    L.ck("reseed: the user's rows render (markup escaped) next to the new seed rows", rows.some(x => x.name === "Guild TW start") && rows.some(x => x.name === "Mod night <b>x</b>") && rows.some(x => x.name === "Coruscant"), rows.length + " rows");
    await p.evaluate(() => { const e = state.events.items.find(x => x.id === "e1790000000001"); e.note = "edited after the bump"; store.write(state); });
    await p.reload({ waitUntil: "domcontentloaded" }); await p.waitForTimeout(900);
    const r2 = await p.evaluate(() => ({ v: state.eventsSeedVersion, n: state.events.items.length, note: (state.events.items.find(x => x.id === "e1790000000001") || {}).note }));
    L.ck("reseed is idempotent on reload (22 rows, v7, edit after the bump kept)", r2.v === 7 && r2.n === 22 && r2.note === "edited after the bump", JSON.stringify(r2));
    L.ck("zero page errors (reseed)", errs.length === 0, JSON.stringify(errs));
    await ctx.close();
  }

  /* ---------- 6. Conquest wording on 11 Oct, 12 Oct (04:00 / 19:05) and 13 Oct, 1280 ---------- */
  const clocks = [
    ["11 Oct 12:00 (last live day)", AEDT(11, 12), "live"],
    ["12 Oct 04:00 (before the 05:00 reset)", AEDT(12, 4), "ended"],
    ["12 Oct 19:05 (after reset)", NOW, "ended"],
    ["13 Oct 12:00", AEDT(13, 12), "ended"]
  ];
  const seen = [];
  for (const [label, at, want] of clocks) {
    const { ctx, p, errs } = await openAt(b, { tag: "cq" + at, at });
    await L.go(p, "ollie", "overview");
    const r = await p.evaluate(() => ({
      line: (document.querySelector(".today-cq .v") || {}).textContent || null, tabHtml: cqRunStatusHtml(cqRunStatus()).replace(/<[^>]+>/g, " ").replace(/\s+/g, " "),
      today: todayEventRows().map(e => [e.name, e.when]), rem: eventReminderHtml().replace(/<[^>]+>/g, " ").replace(/\s+/g, " "), rs: cqRunStatus()
    }));
    seen.push([label, r.line]);
    const cqToday = r.today.find(t => /Conquest/.test(t[0]));
    if (want === "live") {
      L.ck(`[${label}] Today strip: live, day 14 of 14, last live day 11 Oct`, /Conquest 25/.test(r.line) && /day 14 of 14/.test(r.line) && /last live day 11 Oct/.test(r.line), r.line);
      L.ck(`[${label}] Events row says the run 'ends today' (its last live day) — consistent with the strip`, cqToday && cqToday[1] === "ends today", JSON.stringify(r.today));
      L.ck(`[${label}] Conquest tab: 'Day 14 of 14 — live now'`, /Day 14 of 14 — live now/.test(r.tabHtml), r.tabHtml.slice(0, 160));
    } else {
      L.ck(`[${label}] Today strip: 'Conquest 25 run 1 ended — run 2 expected from 26 Oct, unconfirmed'`, r.line === "Conquest 25 run 1 ended — run 2 expected from 26 Oct, unconfirmed", r.line);
      L.ck(`[${label}] no 'off fortnight' / 'next run from' leftovers in the strip`, !/off fortnight|next run from/i.test(r.line), r.line);
      L.ck(`[${label}] Events row/reminders: Conquest 25 is NOT 'ends today' and not listed`, !cqToday && !/Conquest/.test(r.rem), JSON.stringify(r.today));
      L.ck(`[${label}] Conquest tab: 'Run 1 ended', last live day 11 Oct, run 2 from 26 Oct inferred/unconfirmed`, /Run 1 ended/.test(r.tabHtml) && /last live day 11 Oct/.test(r.tabHtml) && /run 2 expected from 26 Oct \(inferred from the cadence, unconfirmed\)/.test(r.tabHtml), r.tabHtml.slice(0, 220));
    }
    if (at === NOW) {
      await p.screenshot({ path: `${L.ROOT}/shots/upd-today-1280.png` });
      await L.go(p, "ollie", "conquest"); await p.waitForTimeout(200);
      const t = await p.evaluate(() => (document.querySelector(".cqrun") || {}).textContent || "");
      L.ck("[12 Oct 19:05] Conquest tab renders the 'Run 1 ended' line", /Run 1 ended — off fortnight/.test(t), t.slice(0, 160));
      await p.screenshot({ path: `${L.ROOT}/shots/upd-conquest-1280.png` });
    }
    L.ck(`[${label}] zero page errors`, errs.length === 0, JSON.stringify(errs.slice(0, 5)));
    await ctx.close();
  }
  L.ck("11 Oct / 12 Oct wording is one story (live → ended, same day on the strip and the Events row)", seen.length === 4, JSON.stringify(seen));
  {
    const { ctx, p, errs } = await openAt(b, { width: 390, height: 844, tag: "cq390" });
    await L.go(p, "ollie", "overview");
    const line = await p.evaluate(() => (document.querySelector(".today-cq .v") || {}).textContent);
    const o = await L.overflow(p);
    L.ck("[390] Overview with the 'run 1 ended' strip: no horizontal overflow", /run 1 ended/.test(line) && o.doc <= o.inner + 1, JSON.stringify([line, o]));
    await p.screenshot({ path: `${L.ROOT}/shots/upd-today-390.png` });
    await L.go(p, "ollie", "conquest");
    const o2 = await L.overflow(p);
    L.ck("[390] Conquest tab: no horizontal overflow", o2.doc <= o2.inner + 1, JSON.stringify(o2));
    await p.screenshot({ path: `${L.ROOT}/shots/upd-conquest-390.png` });
    L.ck("[390] zero page errors", errs.length === 0, JSON.stringify(errs.slice(0, 5)));
    await ctx.close();
  }
  await L.finish(b, srv);
})().catch(e => { console.error(e); process.exit(2); });
