/* cap 15 Oct 2026: Dark Sovereign assertions rewritten (it is the Leviathan unlock journey, not a bonus event), seed version 7 -> 8, registry 23 -> 24.
   upd: 12 Oct 2026 data-refresh checks. Clock pinned with Playwright's clock (setFixedTime) so BOTH Date.now() and the no-argument
   new Date() the Events code uses read the pinned instant, in an Australia/Sydney context (AEDT, UTC+11).
   Covers: EVENTS_SEED contents + dates (both accounts, rendered), Proving Grounds confirmed, Bonus Proving Grounds, the Dark Sovereign
   (Leviathan) note and that it stays out of the Executor advice, the 12 Oct seed bump keeping user-added rows, ended events not
   upcoming, GAC_SCHEDULE flags + Season 85 inference + format, SNAPSHOTS asOf, the Conquest wording on 11 Oct / 12 Oct (04:00 and
   19:05) / 13 Oct, 390px overflow, zero page errors.
   Run: cd DIR && NODE_PATH=/home/claude/.npm-global/lib/node_modules FILE=DIR/index.html PORT=9230 node tests/upd-check.js
   rv25 25 Oct 2026 — DELIBERATE: seed v10 (24 rows: + Smuggler's Run 26 Oct, + Places of Power 31 Oct; Stardust note now THIRD-PARTY), gac-format asOf 25 Oct, future-date bound 25 Oct.    rv31b 1 Nov 2026 — DELIBERATE (1 assertion): era asOf 2026-09-28 -> 2026-11-01 (entry re-pointed to Era 10, ERA_NOW re-read 1 Nov); conquest still 2026-09-27.
*/
/* rv34 4 Nov 2026 — DELIBERATE rewrite of the seed-dependent parts of sections 1, 3, 4 and 5 (section 2 GAC timeline and section 6 Conquest wording untouched),
   because EVENTS_SEED moved to v13 (39 rows, diffed against the 4 Nov swgoh.gg/schedule/ capture). RF moves Sun 1 Nov 12:00 -> Wed 4 Nov 2026 15:00 AEDT (the capture day);
   labels were recomputed by hand from the schedule rows at that instant and then confirmed on screen. Old -> new, in order:
     clock 'Sun Nov 01 12:00' -> 'Wed Nov 04 15:00'; seed v12 / '1 Nov 2026' -> v13 / '4 Nov 2026'; want list 40 -> 39 rows (dropped as over: Territory Battle, Adelphi Ranger
     Era Challenge, first Places of Power, Stardust Transmission, Credit Heist, 2 Nov TW sign-up, Bespin, Echoes of Legend; added: Smuggler's Run II, GAC S85 Week 1,
     Contraband Cargo, next-war TW sign-up + attack phase, bonus drops wave 7, Smuggler's Run III); "no past row" bound 31 Oct -> 4 Nov; the Era Challenge check ->
     "Era Challenge and Adelphi marquee both gone"; B1 'SCHEDULED, not predicted' -> 'RELEASED Wed 4 Nov 05:00 AEDT', Stardust check -> Stardust absent; state rows 40 -> 39;
     TB-row check -> TB row absent + the next war's sign-up / attack rows; GAC_SCHEDULE / events / gac-schedule asOf 1 Nov -> 4 Nov and the future bound 1 Nov -> 4 Nov;
     All events 41 -> 40 rows; live labels (TB / Places of Power / Stardust Ends today, Credit Heist 1d, Era Challenge 2d, Conquest 7d, Mini-Era 16d, Set 33 3d ago) ->
     (TW attack phase + Training Droid Smuggling Ends today, Places of Power II + Smuggler's Run II 1d left, wave 6 2d left, Conquest 4d, B1 6d, Champion of the Pit 9d,
     Mini-Era 13d, GAC S85 22d, Set 33 6d ago); upcoming (TW sign-up + Bespin Tomorrow, Pit in 2d, B1 + S85 in 3d, Dark Sovereign in 19d) -> (S85 Week 1 + Contraband
     Tomorrow, next-war sign-up + wave 7 + Imperial Fleet + Smuggler's Run III in 2d, Peridea in 3d, next-war attack + Bonus Proving Grounds in 4d, Dark Sovereign in 16d);
     Current & next: the Era Challenge -> the TW attack phase among the first 8; reminders '7d left … Conquest' -> '4d left … Conquest'; Today strip rows recomputed;
     reseed 6 -> 13, 39 seed rows (seed0..seed38), user rows after index 39, the 'Bespin' render probe -> 'Contraband Cargo', reload 42 -> 41 rows, v13. */
/* rv40 10 Nov 2026 — DELIBERATE rewrite of the seed-dependent parts of sections 1, 3, 4 and 5 again (section 2 GAC timeline and section 6 Conquest wording untouched), because
   EVENTS_SEED moved to v14 (43 rows, diffed against the 10 Nov swgoh.gg/schedule/ capture). RF moves Wed 4 Nov 15:00 -> Wed 11 Nov 2026 12:00 AEDT (the day after the capture); labels were
   recomputed by hand from the rows at that instant (last live day minus today; past rows count from their start day) and confirmed on screen. Old -> new, in order: clock 'Wed Nov 04 15:00' ->
   'Wed Nov 11 12:00'; seed v13 / '4 Nov 2026' -> v14 / '10 Nov 2026'; want list 39 -> 43 rows (dropped: Conquest run, Set 33 record, waves 6–7, Training Droid Smuggling, both TW wars' rows,
   Places of Power II, Smuggler's Run II/III, the 5 Nov Contraband Cargo, Imperial Fleet, Peridea Patrol, (Bonus) Proving Grounds, the Pieces and Plans / Yoda / 17 Dec Grand Masters predictions;
   added: Smuggler's Run, the TB, the live Yoda node, the 10 Nov Contraband Cargo, B1 Era Challenge, Fanatical Devotion, Mirrored Paths, S85 Week 2 / inferred Week 3, Credit Heist, Hoth, Forest
   Moon, Grand Masters Training (sourced), Dathomir, Endor Escalation, Edrio, The Last Stand, Era of Rogue One, Secrets and Shadows, 3 predicted reruns, Forge and Foundry; Set 36 20 -> 21 Jan);
   'no past row except Set 33' -> 'no row ends before 10 Nov; only the three 10 Nov-ending rows are over at 11 Nov'; Conquest row check -> row ABSENT; TB-absent + TW rows -> the NEW TB row + NO TW
   row; s85e2 est -> sourced, GAC_SCHEDULE / events / gac-schedule asOf 4 Nov -> 10 Nov, gl-queue 1 Nov -> 10 Nov, future bound 4 Nov -> 10 Nov; items 39 -> 43; All events 40 -> 44 rows; live
   labels -> (Week 1 + Contraband Ends today, Fanatical Devotion 1d, Champion of the Pit 2d, TB 4d, Mini-Era + B1 Era Challenge 6d, S85 15d, B1 marquee 7d ago, Smuggler's Run 2d ago); upcoming
   -> (Mirrored Paths / Week 2 / Credit Heist Tomorrow, Hoth + Zuckuss in 2d, Forest Moon + Grand Masters in 3d, Dathomir 5d, Era of Rogue One 7d, Week 3 8d, Dark Sovereign 9d); Current & next:
   the TW attack phase -> S85 Week 1 among the first 8; upcomingEvents list recomputed; reminders '4d left … Conquest' -> no Conquest at all + the Mini-Era 6d / Week 1 Ends today; Today strip
   rows recomputed; reseed 6 -> 14, 43 seed rows (seed0..seed42), user rows after index 43, reload 41 -> 45 rows, v14. */
/* rv48 18 Nov 2026 — DELIBERATE rewrite of the seed-dependent parts of sections 1, 3, 4 and 5 again, plus two section-2 GAC checks (section 6 Conquest wording untouched),
   because EVENTS_SEED moved to v15 (63 rows, rebuilt from the 18 Nov capture + the extended read to 21 Mar 2027). RF moves Wed 11 Nov 12:00 -> Thu 19 Nov 2026 12:00 AEDT (the day after the
   capture, as in rv48-check); labels were recomputed from the rows at that instant (last live day minus today; upcoming = start minus today) and spot-checked by hand (Week 3 6d left, the
   season 7d, The Last Stand 5d, Era of Rogue One 82d, the TB in 5d). Old -> new, in order: clock 'Wed Nov 11 12:00' -> 'Thu Nov 19 12:00'; seed v14 / '10 Nov 2026' -> v15 / '18 Nov 2026';
   want list 43 -> 63 rows (generated from the v15 rows, then checked against the read); 'no row ends before 10 Nov; three over at 11 Nov' -> 'no row ends before 19 Nov; none over at 19 Nov
   12:00'; predicted rows 13 -> 19 and Dark Sovereign 'INFERRED' -> SOURCED (24 h, 20 -> 21 Nov), B1 marquee row -> gone; items 43 -> 63; the Mini-Era row check -> the Era of Rogue One row;
   Dark Sovereign note (unlock journey, third-party) -> the sourced blueprint event; Conquest row DROPPED -> Conquest Vol. 25 Run 3 PRESENT; TB / no-TW -> the 24 Nov TB + the 20–22 Nov TW rows;
   GAC_SCHEDULE s85e3 est -> sourced + s86e1 est, asOf 10 Nov -> 18 Nov; registry events / gac-schedule / conquest / era / gl-queue -> 18 Nov; future bound 10 Nov -> 18 Nov; section 2: '19 Nov
   S85E3 still estimated' -> sourced, '30 Nov: schedule run out (null)' -> 'next is the INFERRED S86E1'; All events 44 -> 64 rows; live / upcoming label lists recomputed; Current & next first 8
   (Mini-Era + Week 1) -> (Week 3 + Era of Rogue One); upcomingEvents list recomputed; reminders' first four -> GAC S85 7d, The Last Stand 5d, Era of Rogue One 82d, Forest Moon Ends today;
   Today strip rows recomputed; reseed 6 -> 15, 63 seed rows (seed0..seed62), user rows after index 63, the 'Contraband Cargo' render probe -> 'Smuggler's Run II', reload 45 -> 65 rows, v15. */
/* rv25b 25 Oct 2026 — DELIBERATE rewrite of the seed-dependent parts AGAIN (sections 1, 3, 4, 5), because EVENTS_SEED was REBUILT (v11, 38 rows) from
   swgoh.gg/schedule/ read live in the owner's Chrome. The pinned clock moves RF = Fri 23 Oct 03:00 AEDT -> Sun 25 Oct 2026 16:00 AEDT (the read time), so the labels are
   recomputed, not copied: the live rows now read Ends today (Ground War, Territory War attack phase), 1d left (Galactic Bounties I), 2d left (Adelphi Ranger, last live day
   27 Oct), 23d left (the Mini-Era, to 17 Nov); upcoming rows: Endor / Smuggler's Run / the Conquest run Tomorrow, the Territory Battle in 2d, B1 marquee in 10d, Dark Sovereign
   in 26d. Every assertion that was about a removed past row (Credit Heist, Contraband Cargo, Smuggler's Run III, Training Droid Smuggling) was replaced by its rv25b equivalent;
   the "(est.)" B1 / Stardust rows are no longer est. (swgoh.gg lists them as scheduled). Counts: seed 24 -> 38, All events 25 -> 39, reseed 6 -> 11 (was 10), reload 26 -> 40 rows.
   Section 2 (GAC timeline) and section 6 (Conquest wording on 11-13 Oct, boots the 12 Oct rows) are unchanged except the two Conquest-tab text checks listed in their own notes. */
/* rf22 22 Oct 2026 — DELIBERATE rewrite of the seed-dependent parts (sections 1, 3, 4, 5 and the clock of 6). The 12 Oct seed this suite
   was written against is gone: EVENTS_SEED was re-seeded to version 9 from swgoh.gg/events/ read 2026-10-22T15:53Z (23 Oct 02:53 AEDT).
     • Sections 1/3/4/5 now check the v9 seed (22 rows, their categories / start / last-live-day under the same AEDT convention, the "≈"
       labels on countdown-derived rows, the Dark Sovereign + Conquest notes, the reseed 6 → 9) at RF = Fri 23 Oct 2026 03:00 AEDT.
     • Section 2: Season 84 Event 3 is now VERIFIED (both accounts' live brackets, 22 Oct), so "22 Oct: S84E3 live but ESTIMATED" became
       "… live, verified"; the rest of the GAC timeline is unchanged.
     • Section 6 (Conquest wording on 11–13 Oct) tests behaviour on those dates, so it boots a state that already carries the current seed
       version with the 12 Oct rows (copied verbatim from the v8 build) — the same calendar it was written against — and additionally
       checks the rf22 run-date caveat on the Conquest tab. */
const L = require("./lib.js");
const AEDT = (d, h, m) => Date.UTC(2026, 9, d, h - 11, m || 0);   // 2026-10-<d> h:m AEDT (UTC+11) as epoch ms
const NOW = Date.UTC(2026, 9, 12, 8, 5);                          // 12 Oct 2026 08:05Z = 19:05 AEDT
const RF = Date.UTC(2026, 10, 19, 1, 0);   // rv48: Thu 19 Nov 2026 12:00 AEDT (the day after the 18 Nov capture, as in rv48-check). rv40 used Date.UTC(2026, 10, 11, 1, 0) = Wed 11 Nov 12:00 AEDT. rv40: Wed 11 Nov 2026 12:00 AEDT (the day after the 10 Nov capture, as in rv40-check). rv34 used Date.UTC(2026, 10, 4, 4, 0) = Wed 4 Nov 15:00 AEDT. rv34: Wed 4 Nov 2026 15:00 AEDT (the 4 Nov capture day). rv31 used Date.UTC(2026, 10, 1, 1, 0) = Sun 1 Nov 12:00 AEDT.   // rv31: Sun 1 Nov 2026 12:00 AEDT (rv25b used Sun 25 Oct 16:00 AEDT); Nov uses explicit UTC.  old comment:                                          // rv25b: Sun 25 Oct 2026 16:00 AEDT, the time swgoh.gg/schedule/ was read (rf22 used Fri 23 Oct 03:00 AEDT)
const SEED_12OCT = [{"id":"seed0","name":"Ultimate Journey Event","cat":"Journey","date":"2026-10-12","ends":"2026-10-12","note":"Earn rewards playing your powerful Galactic Legends — live at capture, ends 13 Oct 05:00 AEDT (start date not shown by swgoh.gg)."},{"id":"seed1","name":"Terrible Tings","cat":"Legendary","date":"2026-10-01","ends":"2026-10-20","note":"Earn Darth Jar Jar Shards! — live; ends 21 Oct 05:00 AEDT (last live day 20 Oct)."},{"id":"seed2","name":"The Wanderer's Blade","cat":"Marquee","date":"2026-10-06","ends":"2026-10-13","note":"Earn Rewards Daily! — live; ends 14 Oct 05:00 AEDT (last live day 13 Oct)."},{"id":"seed3","name":"Bonus Proving Grounds","cat":"Other","date":"2026-10-12","ends":"2026-10-12","note":"Conquest unit shards — live at capture, ends 13 Oct 05:00 AEDT, when the regular Proving Grounds starts (start date not shown by swgoh.gg)."},{"id":"seed4","name":"Coruscant","cat":"Omega Battle","date":"2026-10-12","ends":"2026-10-13","note":"Now with Zetas! — live at capture, ends 13 Oct 18:00 AEDT (start date not shown by swgoh.gg)."},{"id":"seed5","name":"Smuggler's Run","cat":"Resource Event","date":"2026-10-12","note":"Starts 12 Oct 21:00 AEDT."},{"id":"seed6","name":"Proving Grounds","cat":"Other","date":"2026-10-13","ends":"2026-10-13","note":"Conquest unit shards — start CONFIRMED on swgoh.gg/events/ (13 Oct 05:00 AEDT). The end is not shown there; 13 Oct is swgoh.wiki's 24-hour length, unconfirmed."},{"id":"seed7","name":"Defense of Dathomir","cat":"Special","date":"2026-10-13","note":"Mother Talzin shards — starts 13 Oct 18:00 AEDT."},{"id":"seed8","name":"The Ronin","cat":"Era Challenge","date":"2026-10-14","note":"Earn Era Currency! — starts 14 Oct 05:00 AEDT."},{"id":"seed9","name":"Secrets and Shadows","cat":"Assault Battle","date":"2026-10-14","note":"Dark Side followers — starts 14 Oct 18:00 AEDT."},{"id":"seed10","name":"Shattered Empire","cat":"Era Battle","date":"2026-10-15","note":"Starts 15 Oct 05:00 AEDT."},{"id":"seed11","name":"Hoth","cat":"Omega Battle","date":"2026-10-16","note":"Now with Zetas! — starts 16 Oct 18:00 AEDT."},{"id":"seed12","name":"Daring Droid","cat":"Mythic","date":"2026-10-17","note":"Starts 17 Oct 18:00 AEDT."},{"id":"seed13","name":"Military Might","cat":"Assault Battle","date":"2026-10-17","note":"Empire — starts 17 Oct 18:00 AEDT."},{"id":"seed14","name":"Dathomir","cat":"Omega Battle","date":"2026-10-19","note":"Now with Zetas! — starts 19 Oct 18:00 AEDT."},{"id":"seed15","name":"Dark Sovereign","cat":"Fleet Mastery","date":"2026-10-20","note":"Leviathan UNLOCK journey (Journey Guide · Fleet Mastery) — starts ~20 Oct 18:00 AEDT (in-game countdown on 15 Oct: 4d 18h; swgoh.gg's event list agrees). In-game screen (Ollie, 15 Oct): 16 prerequisites, 80 blueprints in 4 reward tiers (10/10/20/40), Leviathan at 0/80. Progress for both accounts: Arena tab › Fleet Arena › Capital ship journeys. CONFLICT: swgoh.gg's page for this event, read 12 Oct, described a bonus star-up event needing Leviathan owned at 4★; the in-game screen contradicts that, so it is treated as the unlock journey. Still unknown: how long the event stays open, how often it returns, and whether a separate bonus event also exists."},{"id":"seed16","name":"Conquest 25 (Embo & Keibu) — run 1","cat":"Other","date":"2026-09-28","ends":"2026-10-11","note":"swgoh.gg/conquest/ (read 12 Oct) lists Conquest 25 as 28 Sep – 12 Oct; 12 Oct is the day it closes (at the reset), so the last live day is 11 Oct and the run is over from 12 Oct. Runs 2–3 follow the 14-on / 14-off cadence — inferred, unconfirmed; no Conquest 26 is listed."},{"id":"seed17","name":"Datacron Set 33 expires","cat":"Other","date":"2026-10-29","ends":"2026-10-29","note":"Supremacy Directive (First Order · Resistance) — swgoh.gg/datacrons/, 7 Oct. Level Set 33 datacrons before it expires."},{"id":"seed18","name":"Datacron Set 34 expires","cat":"Other","date":"2026-11-26","ends":"2026-11-26","note":"The Art of Command (Empire · Jedi Vanguard) — swgoh.gg/datacrons/, 7 Oct."},{"id":"seed19","name":"Datacron Set 35 expires","cat":"Other","date":"2026-12-24","ends":"2026-12-24","note":"Duty and Defiance (Clone Trooper · Unaligned Force User) — swgoh.gg/datacrons/, 7 Oct."}];
const SEED_VER = +(L.fs.readFileSync(L.FILE, "utf8").match(/const EVENTS_SEED_VERSION = (\d+);/) || [0, 0])[1];
const STATE_12OCT = (() => { const st = JSON.parse(L.REAL); st.eventsSeedVersion = SEED_VER; st.eventsSeeded = true; st.events = st.events || {}; st.events.items = SEED_12OCT.concat(((st.events.items) || []).filter(e => !/^seed\d+$/.test(e && e.id))); return JSON.stringify(st); })();
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

  /* ---------- 1. constants + seed, pure (rf22: 23 Oct 03:00 AEDT) ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "pure", at: RF });
    const c = await p.evaluate(() => ({
      now: new Date().toString(), nowMs: Date.now(), off: new Date().getTimezoneOffset(),
      ver: EVENTS_SEED_VERSION, cap: EVENTS_SEED_CAPTURED, seed: EVENTS_SEED.map(e => [e.name, e.cat, e.date, e.ends || "", e.note]),
      items: state.events.items.map(e => [e.id, e.name]), stateVer: state.eventsSeedVersion,
      sched: GAC_SCHEDULE.events.map(e => [e.id, e.season, e.event, e.format, e.start, !!e.est]), schedAsOf: GAC_SCHEDULE.asOf,
      reg: SNAPSHOTS.length, snaps: Object.fromEntries(SNAPSHOTS.map(s => [s.key, s.asOf])),
      ids: SNAPSHOTS.map(s => s.key)
    }));
    L.ck("clock pinned to Thu 19 Nov 2026 12:00 AEDT (UTC+11)", /Thu Nov 19 2026 12:00/.test(c.now) && c.off === -660 && c.nowMs === RF, c.now);   // rv48: Wed 11 Nov -> Thu 19 Nov
    L.ck("EVENTS_SEED_VERSION is 14 (rv40: 13 -> 14, diffed against the 10 Nov swgoh.gg/schedule/ capture), EVENTS_SEED_CAPTURED '10 Nov 2026', saved state was reseeded to 14", c.ver === 15 && c.cap === "18 Nov 2026" && c.stateVer === 15, JSON.stringify([c.ver, c.cap, c.stateVer]));   // rv48: 14 / 10 Nov -> 15 / 18 Nov
    const by = Object.fromEntries(c.seed.map(r => [r[0], r]));
    /* [name, cat, date, ends] — dates are LOCAL Sydney calendar dates; ends = last live day (a 05:00 AEDT close is the day before) */
    const want = [   // rv48: the v15 seed (18 Nov swgoh.gg/schedule/ capture + extended read to 21 Mar 2027) — each row hand-checked against the read: a close at or before 06:00 AEDT = the day before
      ["GAC Season 85 (3v3)", "Grand Arena", "2026-11-04", "2026-11-26"],
      ["The Last Stand", "Marquee", "2026-11-18", "2026-11-24"],
      ["Era of Rogue One", "Other", "2026-11-18", "2027-02-09"],
      ["Forest Moon", "Assault Battle", "2026-11-18", "2026-11-19"],
      ["Secrets and Shadows", "Assault Battle", "2026-11-18", "2026-11-19"],
      ["Smuggler's Run II", "Resource Event", "2026-11-18", "2026-11-19"],
      ["GAC Season 85 — Week 3 (3v3)", "Grand Arena", "2026-11-19", "2026-11-25"],
      ["Defense of Dathomir", "Special", "2026-11-19", "2026-11-20"],
      ["Places of Power", "Assault Battle", "2026-11-19", "2026-11-20"],
      ["Training Droid Smuggling", "Resource Event", "2026-11-19", "2026-11-20"],
      ["Territory War — sign-up", "Territory War", "2026-11-20", "2026-11-21"],
      ["Double Drop Event", "Other", "2026-11-20", "2026-11-23"],
      ["Dark Sovereign", "Fleet Mastery", "2026-11-20", "2026-11-21"],
      ["Secrets and Shadows (second run)", "Assault Battle", "2026-11-20", "2026-11-21"],
      ["Smuggler's Run III", "Resource Event", "2026-11-20", "2026-11-21"],
      ["Ground War (predicted)", "Assault Battle", "2026-11-21", ""],
      ["Military Might", "Assault Battle", "2026-11-21", "2026-11-22"],
      ["Territory War — attack phase", "Territory War", "2026-11-22", "2026-11-22"],
      ["Knightfall", "Era Battle", "2026-11-22", "2026-11-22"],
      ["Ultimate Journey Event", "Journey", "2026-11-23", "2026-11-23"],
      ["Crimes Against the Republic", "Era Battle", "2026-11-23", "2026-11-23"],
      ["Endor", "Omega Battle", "2026-11-23", "2026-11-24"],
      ["Territory Battle — Rise of the Empire", "Territory Battle", "2026-11-24", "2026-11-29"],
      ["Conquest Vol. 25 — Run 3", "Other", "2026-11-24", "2026-12-07"],
      ["Coven of Shadows", "Special", "2026-11-24", "2026-11-25"],
      ["Champion of the Pit rerun (predicted)", "Legendary", "2026-11-25", ""],
      ["Terrible Tings rerun (predicted)", "Legendary", "2026-11-25", ""],
      ["The Price of Hope rerun (predicted)", "Legendary", "2026-11-25", ""],
      ["Web of Hate rerun (predicted)", "Legendary", "2026-11-25", ""],
      ["Adelphi Ranger farmable node (predicted)", "Other", "2026-11-25", ""],
      ["Starkiller (Luke Concept) farmable node (predicted)", "Other", "2026-11-25", ""],
      ["Rebel Roundup", "Assault Battle", "2026-11-25", "2026-11-26"],
      ["Ghosts of Dathomir", "Special", "2026-11-26", "2026-11-27"],
      ["Datacron Set 34 expires", "Other", "2026-11-26", "2026-11-26"],
      ["Galactic Bounties II (predicted)", "Special", "2026-11-29", ""],
      ["GAC Season 86 (5v5, INFERRED)", "Grand Arena", "2026-12-02", ""],
      ["New character: Moroff", "Other", "2026-12-02", "2026-12-02"],
      ["Contracted Cannon", "Marquee", "2026-12-02", "2026-12-08"],
      ["Mercenary Guard Droid (B1) farmable node (predicted)", "Other", "2026-12-09", ""],
      ["Stormtrooper (Concept) farmable node (predicted)", "Other", "2026-12-09", ""],
      ["New character: General Merrick", "Other", "2026-12-16", "2026-12-16"],
      ["Blue Leader", "Marquee", "2026-12-16", "2026-12-22"],
      ["Era of Rogue One — Episode 2", "Other", "2026-12-16", "2027-01-12"],
      ["Jaxxon farmable node (predicted)", "Other", "2026-12-23", ""],
      ["Datacron Set 35 expires", "Other", "2026-12-24", "2026-12-24"],
      ["Galactic Bounties I (predicted)", "Special", "2026-12-26", ""],
      ["New character: General Draven", "Other", "2026-12-30", "2026-12-30"],
      ["Hope at Any Cost", "Marquee", "2026-12-30", "2027-01-05"],
      ["Mythic: Artist of War (predicted)", "Other", "2027-01-04", ""],
      ["The Ronin farmable node (predicted)", "Other", "2027-01-06", ""],
      ["New characters: Jyn Erso (Undercover) + Sergeant Melshi", "Other", "2027-01-13", "2027-01-13"],
      ["Where Stardust Falls", "Legendary", "2027-01-13", "2027-02-09"],
      ["The Sergeant's Stand", "Marquee", "2027-01-13", "2027-01-19"],
      ["Era of Rogue One — Episode 3", "Other", "2027-01-13", "2027-02-09"],
      ["Datacron Set 36 expires", "Other", "2027-01-21", "2027-01-21"],
      ["New character: Bail Organa", "Other", "2027-01-27", "2027-01-27"],
      ["Beacon of Hope", "Marquee", "2027-01-27", "2027-02-02"],
      ["Mythic: Emperor's Demise (predicted)", "Other", "2027-02-13", ""],
      ["Edrio Two Tubes farmable node (predicted)", "Other", "2027-02-17", ""],
      ["Datacron set Forge and Foundry expires", "Other", "2027-02-18", "2027-02-18"],
      ["Moroff farmable node (predicted)", "Other", "2027-03-03", ""],
      ["General Merrick farmable node (predicted)", "Other", "2027-03-17", ""],
      ["Mythic: Daring Droid (predicted)", "Other", "2027-03-20", ""]
    ];
    L.ck("EVENTS_SEED (v14) = the 10 Nov swgoh.gg/schedule/ rows (live + scheduled, 9–28 Nov; GAC W3 inferred) + the rows carried from 4 Nov (Champion of the Pit, B1, the S85 season / Week 1) + 13 PREDICTED nodes/reruns/releases + Mini-Era, Zuckuss/4-LOM rerun, Dark Sovereign, 4 datacron rows = 43, in date order", c.seed.length === 63 && want.length === 63 && c.seed.every((r, i) => r[0] === want[i][0]), c.seed.length + ": " + c.seed.map(r => r[0]).join(" | "));   // rv48: v15 = 63 rows (18 Nov capture + extended read)
    const bad = want.filter(w => { const r = by[w[0]]; return !r || r[1] !== w[1] || r[2] !== w[2] || r[3] !== w[3]; });
    L.ck("every seed row's category / start / last-live-day matches the 10 Nov schedule conversion (a 04:00 / 05:00 / 06:00 AEDT close = the day before; a 09:00 / 11:00 / 18:00 / 19:00 / 22:00 close = the same day)", bad.length === 0, JSON.stringify(bad.map(w => [w, by[w[0]]])));
    L.ck("rv40: no seed row ends before the 10 Nov read (the Set 33 record row is dropped); at the 11 Nov clock the only rows already over are the three that ended on the read day — the B1 marquee, Smuggler's Run (10 Nov 22:00) and the Yoda (DSV) node row", c.seed.filter(r => (r[3] || r[2]) < "2026-11-19").length === 0, JSON.stringify(c.seed.filter(r => (r[3] || r[2]) < "2026-11-19").map(r => r[0])));   // rv48: no row ends before 19 Nov (the rows that ended 18 Nov — Contraband Cargo, the 18 Nov TW attack phase — are not seeded)
    L.ck("Adelphi Ranger marquee row is gone (over: ended 28 Oct) and so is the Era Challenge row (rv34: it ended 4 Nov 05:00 AEDT = last live day 3 Nov, before the 4 Nov read)", !by["Adelphi Ranger"] && !by["Adelphi Ranger Era Challenge"], JSON.stringify(by["Adelphi Ranger Era Challenge"] || null));
    L.ck("no row is still timed from a 22/23 Oct countdown (all 7 are over / replaced by schedule reads); Dark Sovereign says INFERRED; every PREDICTED row is named '(predicted)' and its note opens 'PREDICTED by swgoh.gg (not scheduled by CG)'; B1 is RELEASED (rv34; was scheduled), not est.; Stardust is gone (over); rv40: still 13 predicted rows (the Pieces and Plans / Yoda / 17 Dec Grand Masters predictions left, three legendary-rerun predictions came in)", !c.seed.some(r => /Oct countdown/.test(r[4])) && /^SOURCED/.test(by["Dark Sovereign"][4]) && want.filter(w => /\(predicted\)$/.test(w[0])).length === 19 && want.filter(w => /\(predicted\)$/.test(w[0])).every(w => /^PREDICTED by swgoh\.gg \(not scheduled by CG\)/.test(by[w[0]][4])) && !c.seed.some(r => /\(est\.\)/.test(r[0])) && !by["Mercenary Guard Droid (B1)"] && !by["Stardust Transmission"], want.filter(w => /\(predicted\)$/.test(w[0])).length + "");   // rv48: Dark Sovereign SOURCED; 20 predicted rows; the B1 marquee row is gone (over)
    L.ck("Discarded Doctrine is NOT a seed row (the derived 'auto' Executor row covers it — no duplicate)", !c.seed.some(r => /Discarded Doctrine/.test(r[0])) && c.items.length === 63, "");   // rv48: 43 -> 63
    L.ck("rv48: the Mini-Era row is gone (ended 18 Nov 06:00 AEDT); the Era of Rogue One row names the 18 loaned units, Terentatek, last live day 9 Feb and what was NOT read", !by["Era 10 — The Mandalorian and Grogu (Mini-Era)"] && /18 loaned units/i.test(by["Era of Rogue One"][4]) && /Terentatek/.test(by["Era of Rogue One"][4]) && /last live day 9 Feb/.test(by["Era of Rogue One"][4]) && /NOT read/.test(by["Era of Rogue One"][4]), (by["Era of Rogue One"][4] || "").slice(0, 200));   // rv48: the Mini-Era row is gone (ended 18 Nov 06:00); the Era of Rogue One row carries the 18 Nov facts
    const ds = by["Dark Sovereign"][4];
    L.ck("Dark Sovereign note: next run ~20 Nov (third-party, inferred); the Leviathan UNLOCK journey (16 prerequisites, 80 blueprints, 10/10/20/40), swgoh.gg 'bonus' reading flagged as conflicting, unknowns stated; the old 'REQUIRES owning Leviathan / does not apply' claims are gone", /^SOURCED/.test(ds) && /Leviathan Blueprints/.test(ds) && /Fri 20 Nov 19:00 → ENDS Sat 21 Nov 19:00 AEDT/.test(ds) && /24-hour blueprint event/.test(ds) && /16 prerequisites/.test(ds) && /separate question/.test(ds) && !/REQUIRES/.test(ds) && !/does not apply/.test(ds), ds.slice(0, 200));   // rv48: a SOURCED 24 h blueprint event (was a third-party ~20 Nov guess); the unlock-journey question stays separate
    L.ck("Conquest row (rv40): DROPPED — the 26 Oct → 9 Nov run has ended and the 10 Nov read lists no Conquest; its sourced dates live on in CQ_RUN_CAVEAT on the Conquest tab", c.seed.some(r => r[0] === "Conquest Vol. 25 — Run 3" && r[2] === "2026-11-24" && r[3] === "2026-12-07" && /^SOURCED/.test(r[4])), JSON.stringify(c.seed.filter(r => /Conquest/.test(r[0])).map(r => r[0])));   // rv48: Conquest 25 Run 3 is SOURCED on the 18 Nov extended read (24 Nov 06:00 → 8 Dec 06:00)
    const tbr = (by["Territory Battle — Rise of the Empire"] || [])[4] || "";
    L.ck("rv40: TB row = the NEW 10 Nov run (Geonosis: Separatist Might, Hoth: Imperial Retaliation; 10 Nov 05:00 → 16 Nov 05:00 AEDT; the guild's own TB start can differ); NO Territory War row (both 4–9 Nov wars are over and the 10 Nov read lists none to 28 Nov)", /Republic Offensive · Hoth: Rebel Assault/.test(tbr) && /Tue 24 Nov 05:00/.test(tbr) && /Mon 30 Nov 05:00 AEDT/.test(tbr) && /guild's own TB start can differ/.test(tbr) && c.seed.filter(r => r[1] === "Territory War").length === 2, tbr.slice(0, 200));   // rv48: the 24 Nov TB; two TW rows (sign-up 20 Nov, attack 22 Nov)
    L.ck("GAC_SCHEDULE (rv31): S84E2 and S84E3 verified (no est), S85E1 (3v3, 4 Nov) now SOURCED from swgoh.gg/schedule/ (no est), rv40: S85E2 (11 Nov) SOURCED (Week 2 read 10 Nov), S85E3 (18 Nov) still est, asOf 2026-11-10", JSON.stringify(c.sched) === JSON.stringify([["s83e1", 83, 1, "3v3", "2026-09-09", false], ["s83e2", 83, 2, "3v3", "2026-09-16", false], ["s83e3", 83, 3, "3v3", "2026-09-23", false],
        ["s84e1", 84, 1, "5v5", "2026-10-07", false], ["s84e2", 84, 2, "5v5", "2026-10-14", false], ["s84e3", 84, 3, "5v5", "2026-10-21", false],
        ["s85e1", 85, 1, "3v3", "2026-11-04", false], ["s85e2", 85, 2, "3v3", "2026-11-11", false], ["s85e3", 85, 3, "3v3", "2026-11-18", false], ["s86e1", 86, 1, "5v5", "2026-12-02", true]]) && c.schedAsOf === "2026-11-18", JSON.stringify(c.sched));   // rv48: s85e3 SOURCED (Week 3 read 18 Nov); s86e1 INFERRED (est); asOf 18 Nov
    L.ck("seasons start every 28 days (S83 9 Sep, S84 7 Oct, S85 4 Nov) and each season's events are 7 days apart",
      (Date.UTC(2026, 9, 7) - Date.UTC(2026, 8, 9)) / 864e5 === 28 && (Date.UTC(2026, 10, 4) - Date.UTC(2026, 9, 7)) / 864e5 === 28 && c.sched.filter(r => r[2] > 1).every(r => { const prev = c.sched.find(q => q[1] === r[1] && q[2] === r[2] - 1); return (Date.UTC(...r[4].split("-").map((x, i) => i === 1 ? x - 1 : +x)) - Date.UTC(...prev[4].split("-").map((x, i) => i === 1 ? x - 1 : +x))) / 864e5 === 7; }), "");
    const snap = k => c.snaps[k];
    L.ck("SNAPSHOTS: registry 24 entries (23 + cap cap-journeys)", c.reg === 24, String(c.reg));
    L.ck("SNAPSHOTS asOf: events 2026-11-10 (rv40: swgoh.gg/schedule/ capture diffed), gac-schedule 2026-11-10 (S85 Week 2 read), gac-format stays 2026-10-25 (swgoh.gg/gac/squads/ not re-read)", snap("events") === "2026-11-18" && snap("gac-schedule") === "2026-11-18" && snap("gac-format") === "2026-10-25", JSON.stringify([snap("events"), snap("gac-schedule"), snap("gac-format")]));   // rv48: events / gac-schedule -> 18 Nov
    L.ck("SNAPSHOTS NOT bumped where the content was not re-read: conquest (plan/disks/enemy intel; only the feats were re-read 1 Nov) 2026-09-27; era is re-pointed to Era 10 since rv31 (ERA_NOW re-read 1 Nov → 2026-11-01; Era 09 is an archive with no entry, was 2026-09-28); gl-queue IS re-derived (rv25c: Ollie's order, 31 Oct roster → 2026-11-01; rv40: both orders, 10 Nov rosters → 2026-11-10)", snap("conquest") === "2026-11-18" && snap("era") === "2026-11-18" && snap("gl-queue") === "2026-11-18" && snap("gac-format") === "2026-10-25", JSON.stringify([snap("conquest"), snap("era"), snap("gl-queue")]));   // rv48: conquest (Run 3 dates re-read), era (Era of Rogue One dates), gl-queue (18 Nov rosters) -> 18 Nov; gac-format still not re-read
    L.ck("no SNAPSHOTS asOf is in the future (after the rv40 re-check, 10 Nov)", Object.values(c.snaps).every(a => !a || a <= "2026-11-18"), JSON.stringify(c.snaps));   // rv48: bound 10 Nov -> 18 Nov
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
    L.ck("22 Oct: S84E3 live and (rf22) VERIFIED from the live brackets — no longer estimated", g.oct22.id === "s84e3" && g.oct22.live && !g.oct22.est, JSON.stringify(g.oct22));
    L.ck("5 Nov: S85E1 live (3v3, rv31: start now sourced, not estimated) and the format follows it; 19 Nov: S85E3 (rv48: sourced)", g.nov5.id === "s85e1" && g.nov5.fmt === "3v3" && !g.nov5.est && g.nov19.id === "s85e3" && !g.nov19.est, JSON.stringify([g.nov5, g.nov19]));   // rv48: S85E3 is SOURCED now
    L.ck("30 Nov: rv48 — next is the INFERRED Season 86 Event 1 (5v5, est), not null", g.after && g.after.id === "s86e1" && g.after.live === false && g.after.est === true && g.after.fmt === "5v5", JSON.stringify(g.after));   // rv48: the INFERRED s86e1 (2 Dec, 5v5) is next — the schedule no longer runs out on 30 Nov
    const gap = await p.evaluate(ms => { const e = gcfEventNow(ms); return e ? { id: e.id, live: e.gcfLive } : null; }, AEDT(29, 12) + 0 * 1);
    L.ck("29 Oct (after S84E3's 7-day window, before S85E1): not live, next is S85E1", gap && gap.id === "s85e1" && gap.live === false, JSON.stringify(gap));
    L.ck("zero page errors (gac)", errs.length === 0, JSON.stringify(errs));
    await ctx.close();
  }

  /* ---------- 3. Events tab rendered, both accounts, 1280 + 390 (rv34: 4 Nov 15:00 AEDT, v13 seed) ---------- */
  for (const w of [1280, 390]) {
    const { ctx, p, errs } = await openAt(b, { width: w, tag: "events" + w, at: RF });
    for (const acct of ["ollie", "tiny"]) {
      await L.go(p, acct, "events");
      await p.evaluate(() => { state.views.events = "all"; renderEvents(); }); await p.waitForTimeout(150);
      const rows = await evRows(p);
      const row = n => rows.find(r => r.name === n);
      L.ck(`[${w}] ${acct}: All events lists 64 rows (63 seed + the auto Executor row; rv48: was 44)`, rows.length === 64 && rows.some(r => /^Discarded Doctrine/.test(r.name)), rows.length + "");
      const LIVE = [["Forest Moon", "Ends today"], ["Secrets and Shadows", "Ends today"], ["Smuggler's Run II", "Ends today"], ["Defense of Dathomir", "1d left"], ["Places of Power", "1d left"], ["The Last Stand", "5d left"], ["GAC Season 85 — Week 3 (3v3)", "6d left"], ["GAC Season 85 (3v3)", "7d left"], ["Era of Rogue One", "82d left"]];
      L.ck(`[${w}] ${acct}: live rows (rv48, 19 Nov 12:00) read Ends today (Forest Moon, Secrets and Shadows, Smuggler's Run II), 1d left (Defense of Dathomir, Places of Power), 5d left (The Last Stand, last day 24 Nov), 6d left (GAC S85 Week 3, to 25 Nov), 7d left (the season, to 26 Nov), 82d left (Era of Rogue One, to 9 Feb)`,
        LIVE.every(([n, l]) => row(n) && row(n).label === l) && /25 Nov/.test(row("GAC Season 85 — Week 3 (3v3)").ends) && /9 Feb/.test(row("Era of Rogue One").ends),
        JSON.stringify(LIVE.map(([n]) => [n, row(n) && row(n).label, row(n) && row(n).ends])));
      const UP = [["Territory War — sign-up", "Tomorrow"], ["Double Drop Event", "Tomorrow"], ["Dark Sovereign", "Tomorrow"], ["Military Might", "in 2d"], ["Territory War — attack phase", "in 3d"], ["Ultimate Journey Event", "in 4d"], ["Territory Battle — Rise of the Empire", "in 5d"], ["Conquest Vol. 25 — Run 3", "in 5d"], ["Rebel Roundup", "in 6d"], ["Datacron Set 34 expires", "in 7d"], ["GAC Season 86 (5v5, INFERRED)", "in 13d"]];
      L.ck(`[${w}] ${acct}: upcoming rows (rv48) — the TW sign-up, Double Drop and Dark Sovereign Tomorrow (20 Nov), Military Might in 2d, the TW attack phase in 3d, the Ultimate Journey in 4d, the TB and Conquest Run 3 in 5d (24 Nov), Rebel Roundup in 6d, Set 34 in 7d, the inferred Season 86 in 13d`, UP.every(([n, l]) => row(n) && row(n).label === l) && /20 Nov/.test(row("Dark Sovereign").starts), JSON.stringify(UP.map(([n]) => [n, row(n) && row(n).label])));
      L.ck(`[${w}] ${acct}: Dark Sovereign note on screen (rv48): a SOURCED 24-hour Leviathan blueprint event, the unlock-journey question kept separate, not a requirement-to-own bonus event`, /^SOURCED/.test(row("Dark Sovereign").note) && /Leviathan Blueprints/.test(row("Dark Sovereign").note) && /16 prerequisites/.test(row("Dark Sovereign").note) && !/REQUIRES/.test(row("Dark Sovereign").note) && !/does not apply/.test(row("Dark Sovereign").note), row("Dark Sovereign").note.slice(0, 120));
    const oAll = await L.overflow(p);
      L.ck(`[${w}] ${acct}: All events view (long notes) has no horizontal overflow`, oAll.doc <= oAll.inner + 1, JSON.stringify(oAll));
      await p.evaluate(() => { state.views.events = "next"; renderEvents(); }); await p.waitForTimeout(150);
      const nx = await evRows(p);
      L.ck(`[${w}] ${acct}: Current & next shows no ended event (nothing '…d ago'), first 8 are live/upcoming, GAC S85 Week 3 (6d left) + Era of Rogue One among them (rv48: were the Mini-Era + Week 1)`, nx.length === 8 && !nx.some(r => /d ago$/.test(r.label)) && nx.some(r => r.name === "GAC Season 85 — Week 3 (3v3)" && r.label === "6d left") && nx.some(r => r.name === "Era of Rogue One"), nx.map(r => r.name + ":" + r.label).join(" | "));
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

  /* ---------- 4. ended events never upcoming; Dark Sovereign stays out of the Executor advice (rv34: 4 Nov, v13 seed) ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "up", at: RF });
    const r = await p.evaluate(() => ({
      up: upcomingEvents(30).map(e => e.name), rem: eventReminderHtml().replace(/<[^>]+>/g, " ").replace(/\s+/g, " "), today: todayEventRows().map(e => [e.name, e.when]),
      exec: ["ollie", "tiny"].map(a => JSON.stringify(executorProgress(a, new Date())) + executorProgressHtml()).join("\n")
    }));
    L.ck("upcomingEvents(): live + upcoming v15 rows (rv48: the season, The Last Stand, Era of Rogue One, Forest Moon, Week 3, the TW sign-up, Dark Sovereign, the TB, Conquest Run 3 — the Mini-Era / B1 / Week 2 / Contraband rows are gone; rv40: the Mini-Era, the Territory Battle, GAC Season 85 + Week 1 ending today + Week 2, Contraband Cargo, the B1 Era Challenge, Era of Rogue One, Dark Sovereign); the over rows (the B1 marquee and Smuggler's Run, both ended 10 Nov, the Yoda node row) and the dropped ones (Conquest run, Territory War rows, Set 33 record, Adelphi rows, Ground War, Bespin) are not listed", ["GAC Season 85 (3v3)", "The Last Stand", "Era of Rogue One", "Forest Moon", "GAC Season 85 — Week 3 (3v3)", "Territory War — sign-up", "Dark Sovereign", "Territory Battle — Rise of the Empire", "Conquest Vol. 25 — Run 3"].every(n => r.up.includes(n)) && !["Era 10 — The Mandalorian and Grogu (Mini-Era)", "Mercenary Guard Droid (B1)", "Smuggler's Run", "Contraband Cargo", "GAC Season 85 — Week 2 (3v3)", "Territory War — attack phase (18 Nov)", "Adelphi Ranger", "Adelphi Ranger Era Challenge", "Bespin", "Datacron Set 33 expired"].some(n => r.up.includes(n)), r.up.join(" | "));   // rv48: the v15 live / upcoming rows
    L.ck("event reminders (Overview) never label Conquest as ending today (rv31: the label precedes the name in the reminder text, so the old /Conquest.*Ends today/ would match the NEXT item's label; rv40: the Conquest row is dropped, so Conquest is not in the reminders at all — the first four are the Mini-Era 6d, Champion of the Pit 2d, GAC S85 15d and Week 1 ending today)", !/Ends today\s*[◉↗]\s*\S*\s*Conquest/.test(r.rem) && !/Conquest/.test(r.rem) && /7d left\s*◉\s*Grand Arena GAC Season 85 \(3v3\)/.test(r.rem) && /82d left\s*◉\s*Other Era of Rogue One/.test(r.rem) && /Ends today\s*◉\s*Assault Battle Forest Moon/.test(r.rem), r.rem.slice(0, 200));   // rv48: the first four are GAC S85 7d, The Last Stand 5d, Era of Rogue One 82d, Forest Moon ending today (Conquest Run 3 starts 24 Nov, outside them)
    const TODAY = [["Forest Moon", "ends today"], ["Smuggler's Run II", "ends today"], ["GAC Season 85 — Week 3 (3v3)", "starts today"], ["Defense of Dathomir", "starts today"], ["Places of Power", "starts today"]];   // rv48
    L.ck("Today strip events on 19 Nov (rv48: Forest Moon and Smuggler's Run II end today; Week 3, Defense of Dathomir and Places of Power start today; the season, The Last Stand and Era of Rogue One read live; no Conquest / TW row yet); was 11 Nov (rv40): GAC S85 Week 1 and Contraband Cargo end today; the B1 Era Challenge and Fanatical Devotion start today; the Mini-Era, Champion of the Pit, GAC Season 85 and the Territory Battle read live; no Conquest / Territory War / Stardust / Ground War row", TODAY.every(([n, w]) => r.today.some(t => t[0] === n && t[1] === w)) && ["GAC Season 85 (3v3)", "The Last Stand", "Era of Rogue One"].every(k => r.today.some(t => t[0] === k && /^live/.test(t[1]))) && !r.today.some(t => /Conquest|Territory War|Stardust|Mini-Era/.test(t[0])), JSON.stringify(r.today));   // rv48: 19 Nov rows
    L.ck("Executor progress/advice (both accounts) never mentions Leviathan or Dark Sovereign", !/Leviathan|Dark Sovereign/i.test(r.exec), r.exec.slice(0, 100));
    L.ck("zero page errors (upcoming)", errs.length === 0, JSON.stringify(errs));
    await ctx.close();
  }

  /* ---------- 5. reseed 6 -> current (7 at upd, 8 since cap) keeps the user's own rows ---------- */
  {
    const st = JSON.parse(L.REAL);
    const mine = [
      { id: "e1790000000001", name: "Guild TW start", cat: "Other", date: "2026-10-14", ends: "", note: "my own note — keep" },
      { id: "e1790000000002", name: "Mod night <b>x</b>", cat: "Special", date: "2026-10-12", ends: "2026-10-13", note: "edited by hand" }
    ];
    st.eventsSeedVersion = 6;
    st.events.items = [{ id: "seed0", name: "Terrible Tings", cat: "Legendary", date: "2026-10-01", ends: "2026-10-20", note: "old" }, { id: "seed2", name: "Jaxxon", cat: "Era Challenge", date: "2026-10-01", ends: "2026-10-06", note: "old" }].concat(mine);
    const { ctx, p, errs } = await openAt(b, { tag: "reseed", state: JSON.stringify(st), at: RF });
    const r = await p.evaluate(() => ({ v: state.eventsSeedVersion, items: state.events.items, n: EVENTS_SEED.length }));
    const seeds = r.items.filter(e => /^seed\d+$/.test(e.id));
    L.ck("reseed 6 -> 15: version 15 (rv48), seed rows = EVENTS_SEED (63), ids seed0..seed62, the old Jaxxon / Terrible Tings rows are gone (the new ones are the '(predicted)' nodes / reruns)", r.v === 15 && seeds.length === 63 && r.n === 63 && seeds.every((e, i) => e.id === "seed" + i) && !seeds.some(e => e.name === "Jaxxon" || e.name === "Terrible Tings"), r.v + " / " + seeds.length);   // rv48: 14 / 43 -> 15 / 63
    const k1 = r.items.find(e => e.id === "e1790000000001"), k2 = r.items.find(e => e.id === "e1790000000002");
    L.ck("reseed: both user-added events survive byte-for-byte and come after the seed rows", JSON.stringify(k1) === JSON.stringify(mine[0]) && JSON.stringify(k2) === JSON.stringify(mine[1]) && r.items.slice(63).map(e => e.id).join() === "e1790000000001,e1790000000002", JSON.stringify(r.items.slice(63).map(e => e.id)));   // rv48: after index 63
    await L.go(p, "ollie", "events");
    await p.evaluate(() => { state.views.events = "all"; renderEvents(); }); await p.waitForTimeout(150);
    const rows = await evRows(p);
    L.ck("reseed: the user's rows render (markup escaped) next to the new seed rows", rows.some(x => x.name === "Guild TW start") && rows.some(x => x.name === "Mod night <b>x</b>") && rows.some(x => x.name === "Smuggler's Run II"), rows.length + " rows");   // rv48: probe row Contraband Cargo -> Smuggler's Run II
    await p.evaluate(() => { const e = state.events.items.find(x => x.id === "e1790000000001"); e.note = "edited after the bump"; store.write(state); });
    await p.reload({ waitUntil: "domcontentloaded" }); await p.waitForTimeout(900);
    const r2 = await p.evaluate(() => ({ v: state.eventsSeedVersion, n: state.events.items.length, note: (state.events.items.find(x => x.id === "e1790000000001") || {}).note }));
    L.ck("reseed is idempotent on reload (65 rows = 63 seed + 2 user rows, v15, edit after the bump kept)", r2.v === 15 && r2.n === 65 && r2.note === "edited after the bump", JSON.stringify(r2));   // rv48: 45 rows / v14 -> 65 rows / v15
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
    const { ctx, p, errs } = await openAt(b, { tag: "cq" + at, at, state: STATE_12OCT });
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
      L.ck(`[${label}] Today strip (rv25b): 'Conquest 25 run 1 ended — next run starts 26 Oct 05:00 AEDT (swgoh.gg schedule; ends 9 Nov 05:00 AEDT)' - the 26 Oct start is now sourced, so no 'unconfirmed'`, r.line === "Conquest 25 run 1 ended — next run starts 26 Oct 05:00 AEDT (swgoh.gg schedule; ends 9 Nov 05:00 AEDT)" && !/unconfirmed/.test(r.line), r.line);
      L.ck(`[${label}] no 'off fortnight' / 'next run from' leftovers in the strip`, !/off fortnight|next run from/i.test(r.line), r.line);
      L.ck(`[${label}] Events row/reminders: Conquest 25 is NOT 'ends today' and not listed`, !cqToday && !/Conquest/.test(r.rem), JSON.stringify(r.today));
      L.ck(`[${label}] Conquest tab (rv25b): 'Run 1 ended', last live day 11 Oct, the next run starts 26 Oct 05:00 AEDT and ends 9 Nov 05:00 AEDT (sourced: swgoh.gg's schedule, which calls it the 3rd run)`, /Run 1 ended/.test(r.tabHtml) && /last live day 11 Oct/.test(r.tabHtml) && /the next run starts 26 Oct 05:00 AEDT and ends 9 Nov 05:00 AEDT \(sourced: swgoh\.gg's schedule, which calls it the 3rd run\)/.test(r.tabHtml) && !/inferred from the cadence, unconfirmed/.test(r.tabHtml), r.tabHtml.slice(0, 260));
    }
    if (at === NOW) {
      await p.screenshot({ path: `${L.ROOT}/shots/upd-today-1280.png` });
      await L.go(p, "ollie", "conquest"); await p.waitForTimeout(200);
      const t = await p.evaluate(() => (document.querySelector(".cqrun") || {}).textContent || "");
      L.ck("[12 Oct 19:05] Conquest tab renders the 'Run 1 ended' line", /Run 1 ended — off fortnight/.test(t), t.slice(0, 160));
      L.ck("[rv25b] Conquest tab status line carries the run-date caveat (one run SOURCED 26 Oct -> 9 Nov; swgoh.gg one span 28 Sep – 8 Nov; EA Sunday start; earlier runs UNVERIFIED) and a LOW-MODERATE chip", /Run dates, 25 Oct: ONE run is sourced/.test(t) && /UNVERIFIED/.test(t) && /28 Sep – 8 Nov/.test(t) && /Sunday/.test(t) && /LOW-MODERATE/.test(t), t.slice(0, 400));
      await p.screenshot({ path: `${L.ROOT}/shots/upd-conquest-1280.png` });
    }
    L.ck(`[${label}] zero page errors`, errs.length === 0, JSON.stringify(errs.slice(0, 5)));
    await ctx.close();
  }
  L.ck("11 Oct / 12 Oct wording is one story (live → ended, same day on the strip and the Events row)", seen.length === 4, JSON.stringify(seen));
  {
    const { ctx, p, errs } = await openAt(b, { width: 390, height: 844, tag: "cq390", state: STATE_12OCT });
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
