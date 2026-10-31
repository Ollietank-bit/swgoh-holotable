/* cap 15 Oct 2026: Dark Sovereign assertions rewritten (it is the Leviathan unlock journey, not a bonus event), seed version 7 -> 8, registry 23 -> 24.
   upd: 12 Oct 2026 data-refresh checks. Clock pinned with Playwright's clock (setFixedTime) so BOTH Date.now() and the no-argument
   new Date() the Events code uses read the pinned instant, in an Australia/Sydney context (AEDT, UTC+11).
   Covers: EVENTS_SEED contents + dates (both accounts, rendered), Proving Grounds confirmed, Bonus Proving Grounds, the Dark Sovereign
   (Leviathan) note and that it stays out of the Executor advice, the 12 Oct seed bump keeping user-added rows, ended events not
   upcoming, GAC_SCHEDULE flags + Season 85 inference + format, SNAPSHOTS asOf, the Conquest wording on 11 Oct / 12 Oct (04:00 and
   19:05) / 13 Oct, 390px overflow, zero page errors.
   Run: cd DIR && NODE_PATH=/home/claude/.npm-global/lib/node_modules FILE=DIR/index.html PORT=9230 node tests/upd-check.js
   rv25 25 Oct 2026 — DELIBERATE: seed v10 (24 rows: + Smuggler's Run 26 Oct, + Places of Power 31 Oct; Stardust note now THIRD-PARTY), gac-format asOf 25 Oct, future-date bound 25 Oct. */
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
const RF = Date.UTC(2026, 10, 1, 1, 0);   // rv31: Sun 1 Nov 2026 12:00 AEDT (rv25b used Sun 25 Oct 16:00 AEDT); Nov uses explicit UTC.  old comment:                                          // rv25b: Sun 25 Oct 2026 16:00 AEDT, the time swgoh.gg/schedule/ was read (rf22 used Fri 23 Oct 03:00 AEDT)
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
    L.ck("clock pinned to Sun 1 Nov 2026 12:00 AEDT (UTC+11)", /Sun Nov 01 2026 12:00/.test(c.now) && c.off === -660 && c.nowMs === RF, c.now);
    L.ck("EVENTS_SEED_VERSION is 12 (rv31: 11 -> 12, rebuilt from swgoh.gg/schedule/ read 31 Oct / 1 Nov), EVENTS_SEED_CAPTURED '1 Nov 2026', saved state was reseeded to 12", c.ver === 12 && c.cap === "1 Nov 2026" && c.stateVer === 12, JSON.stringify([c.ver, c.cap, c.stateVer]));
    const by = Object.fromEntries(c.seed.map(r => [r[0], r]));
    /* [name, cat, date, ends] — dates are LOCAL Sydney calendar dates; ends = last live day (a 05:00 AEDT close is the day before) */
    const want = [
      ["Era 10 — The Mandalorian and Grogu (Mini-Era)", "Other", "2026-10-20", "2026-11-17"],
      ["Conquest 25 (Embo & Keibu) — run 26 Oct → 9 Nov", "Other", "2026-10-26", "2026-11-08"],
      ["Territory Battle — Rise of the Empire", "Territory Battle", "2026-10-27", "2026-11-01"],
      ["Adelphi Ranger Era Challenge", "Era Challenge", "2026-10-28", "2026-11-03"],
      ["Datacron Set 33 expired", "Other", "2026-10-29", "2026-10-29"],
      ["Places of Power", "Assault Battle", "2026-10-31", "2026-11-01"],
      ["Stardust Transmission", "Fleet Mastery", "2026-10-31", "2026-11-01"],
      ["Credit Heist", "Resource Event", "2026-11-01", "2026-11-02"],
      ["Territory War — sign-up", "Territory War", "2026-11-02", "2026-11-03"],
      ["Bespin", "Omega Battle", "2026-11-02", "2026-11-03"],
      ["Champion of the Pit (Rotta the Hutt shards)", "Legendary", "2026-11-03", "2026-11-13"],
      ["Echoes of Legend", "Era Battle", "2026-11-03", "2026-11-03"],
      ["Bonus drops (additive drops, wave 6)", "Other", "2026-11-03", "2026-11-06"],
      ["Training Droid Smuggling", "Resource Event", "2026-11-03", "2026-11-04"],
      ["Mercenary Guard Droid (B1)", "Marquee", "2026-11-04", "2026-11-10"],
      ["Territory War — attack phase", "Territory War", "2026-11-04", "2026-11-04"],
      ["GAC Season 85 (3v3)", "Grand Arena", "2026-11-04", "2026-11-26"],
      ["Places of Power (second run)", "Assault Battle", "2026-11-04", "2026-11-05"],
      ["Imperial Fleet", "Omega Battle", "2026-11-06", "2026-11-07"],
      ["Peridea Patrol", "Assault Battle", "2026-11-07", "2026-11-08"],
      ["Bonus Proving Grounds", "Other", "2026-11-08", "2026-11-08"],
      ["Proving Grounds", "Other", "2026-11-09", "2026-11-09"],
      ["Mythic: Pieces and Plans (predicted)", "Other", "2026-11-10", ""],
      ["Yoda (Dark Side Vision) farmable node (predicted)", "Other", "2026-11-11", ""],
      ["Zuckuss + 4-LOM additive drops rerun", "Other", "2026-11-13", "2026-11-15"],
      ["Ultimate Journey Event (predicted)", "Journey", "2026-11-16", ""],
      ["Dark Sovereign", "Fleet Mastery", "2026-11-20", ""],
      ["Terrible Tings rerun (predicted)", "Legendary", "2026-11-25", ""],
      ["Adelphi Ranger farmable node (predicted)", "Other", "2026-11-25", ""],
      ["Starkiller (Luke Concept) farmable node (predicted)", "Other", "2026-11-25", ""],
      ["Datacron Set 34 expires", "Other", "2026-11-26", "2026-11-26"],
      ["Galactic Bounties II (predicted)", "Special", "2026-11-29", ""],
      ["Mercenary Guard Droid (B1) farmable node (predicted)", "Other", "2026-12-09", ""],
      ["Stormtrooper (Concept) farmable node (predicted)", "Other", "2026-12-09", ""],
      ["Mythic: Grand Masters Training (predicted)", "Other", "2026-12-17", ""],
      ["Jaxxon farmable node (predicted)", "Other", "2026-12-23", ""],
      ["Datacron Set 35 expires", "Other", "2026-12-24", "2026-12-24"],
      ["Galactic Bounties I (predicted)", "Special", "2026-12-26", ""],
      ["6 accelerated unit releases (predicted)", "Other", "2027-01-06", ""],
      ["Datacron Set 36 expires", "Other", "2027-01-20", "2027-01-20"]
    ];
    L.ck("EVENTS_SEED (v12) = the 1 Nov swgoh.gg/schedule/ rows (live + scheduled + 13 PREDICTED nodes/mythics/releases carried or re-read) + Mini-Era, Conquest run, TB, TW sign-up / attack, GAC S85, B1 marquee, Stardust, Zuckuss/4-LOM rerun, Dark Sovereign, 4 datacron rows = 40, in date order", c.seed.length === 40 && want.length === 40 && c.seed.every((r, i) => r[0] === want[i][0]), c.seed.length + ": " + c.seed.map(r => r[0]).join(" | "));
    const bad = want.filter(w => { const r = by[w[0]]; return !r || r[1] !== w[1] || r[2] !== w[2] || r[3] !== w[3]; });
    L.ck("every seed row's category / start / last-live-day matches the 1 Nov schedule conversion (a 04:00 / 05:00 AEDT close = the day before; an 11:00 / 18:00 / 19:00 / 21:00 close = the same day)", bad.length === 0, JSON.stringify(bad.map(w => [w, by[w[0]]])));
    L.ck("no seed row is past at 1 Nov except the one deliberate record row (Datacron Set 33 expired, 29 Oct); every other row starts or ends on/after 31 Oct (the earliest is the Mini-Era / Conquest / TB / Era Challenge, still live)", c.seed.filter(r => (r[3] || r[2]) < "2026-10-31").map(r => r[0]).join() === "Datacron Set 33 expired", "");
    L.ck("Adelphi Ranger marquee row is gone (over: ended 28 Oct); the Era Challenge row keeps 28 Oct 05:00 -> 4 Nov 05:00 AEDT = last live day 3 Nov", !by["Adelphi Ranger"] && by["Adelphi Ranger Era Challenge"][3] === "2026-11-03" && /ENDS 4 Nov 05:00 AEDT/.test(by["Adelphi Ranger Era Challenge"][4]), (by["Adelphi Ranger Era Challenge"] || [])[4]);
    L.ck("no row is still timed from a 22/23 Oct countdown (all 7 are over / replaced by schedule reads); Dark Sovereign says INFERRED; every PREDICTED row is named '(predicted)' and its note opens 'PREDICTED by swgoh.gg (not scheduled by CG)'; B1 + Stardust are scheduled, not est.", !c.seed.some(r => /Oct countdown/.test(r[4])) && /≈ NEXT RUN, inferred/i.test(by["Dark Sovereign"][4]) && want.filter(w => /\(predicted\)$/.test(w[0])).length === 13 && want.filter(w => /\(predicted\)$/.test(w[0])).every(w => /^PREDICTED by swgoh\.gg \(not scheduled by CG\)/.test(by[w[0]][4])) && !c.seed.some(r => /\(est\.\)/.test(r[0])) && /SCHEDULED, not predicted/.test(by["Mercenary Guard Droid (B1)"][4]) && /SCHEDULED event/.test(by["Stardust Transmission"][4]), want.filter(w => /\(predicted\)$/.test(w[0])).length + "");
    L.ck("Discarded Doctrine is NOT a seed row (the derived 'auto' Executor row covers it — no duplicate)", !c.seed.some(r => /Discarded Doctrine/.test(r[0])) && c.items.length === 40, "");
    L.ck("Mini-Era row: 20 Oct → ends 18 Nov 06:00 AEDT (last live day 17 Nov), Era Level cap 75 (EL 74 = 7★ + Relic 7), GL event pause before it ends, Journey Guide tab off", /18 Nov 06:00 AEDT/.test(by[want[0][0]][4]) && /Era Level cap 75/.test(by[want[0][0]][4]) && /EL 74 = 7★ \+ Relic 7/.test(by[want[0][0]][4]) && /pauses about an hour before the Mini-Era ends/.test(by[want[0][0]][4]) && /Journey Guide tab is off/.test(by[want[0][0]][4]), by[want[0][0]][4].slice(0, 200));
    const ds = by["Dark Sovereign"][4];
    L.ck("Dark Sovereign note: next run ~20 Nov (third-party, inferred); the Leviathan UNLOCK journey (16 prerequisites, 80 blueprints, 10/10/20/40), swgoh.gg 'bonus' reading flagged as conflicting, unknowns stated; the old 'REQUIRES owning Leviathan / does not apply' claims are gone", /UNLOCK journey/.test(ds) && /Leviathan/.test(ds) && /16 prerequisites/.test(ds) && /80 blueprints/.test(ds) && /10\/10\/20\/40/.test(ds) && /CONFLICT/.test(ds) && /bonus star-up/.test(ds) && /Still unknown/.test(ds) && /third-party/.test(ds) && /~20 Nov/.test(ds) && !/REQUIRES/.test(ds) && !/does not apply/.test(ds) && !/Neither Ollie nor Tiny owns Leviathan/.test(ds), ds);
    const cq = by["Conquest 25 (Embo & Keibu) — run 26 Oct → 9 Nov"][4];
    L.ck("Conquest row (rv25b): the 26 Oct 05:00 -> 9 Nov 05:00 AEDT run is SOURCED (swgoh.gg/schedule/, counted as the 3rd run, whole Conquest 25 = 28 Sep – 8 Nov); the 14-on / 14-off count and later dates are called an inference; EA's 19 Oct Sunday-start note; earlier runs still unsourced", /SOURCED/.test(cq) && /ends Nov 9, 5:00 AM/.test(cq) && /3rd run/.test(cq) && /28 Sep – 8 Nov/.test(cq) && /14-on \/ 14-off/.test(cq) && /inference/.test(cq) && /19 Oct/.test(cq) && /Sunday/.test(cq) && /unsourced/.test(cq), cq);
    const tbr = by["Territory Battle — Rise of the Empire"][4], twr = by["Territory War — attack phase"][4];
    L.ck("TB row: Rise of the Empire (Geonosis: Republic Offensive · Hoth: Rebel Assault), 6 days, 27 Oct 04:00 -> 2 Nov 04:00 AEDT, no later TB in the 1 Nov window; TW attack-phase row (rv31): opens 4 Nov 06:00 AEDT, ends 5 Nov 06:00 AEDT; both say the guild's own timing can differ", /Geonosis: Republic Offensive/.test(tbr) && /Hoth: Rebel Assault/.test(tbr) && /6 days/.test(tbr) && /27 Oct 04:00 AEDT/.test(tbr) && /2 Nov 04:00 AEDT/.test(tbr) && /guild's own TB start can differ/.test(tbr) && /1 Nov read lists no later Territory Battle/.test(tbr) && /4 Nov 06:00 AEDT/.test(twr) && /5 Nov 06:00 AEDT/.test(twr) && /guild's own phase timing can differ/.test(twr), tbr + " || " + twr);
    L.ck("GAC_SCHEDULE (rv31): S84E2 and S84E3 verified (no est), S85E1 (3v3, 4 Nov) now SOURCED from swgoh.gg/schedule/ (no est), S85E2/E3 (11 / 18 Nov) still est, asOf 2026-11-01",
      JSON.stringify(c.sched) === JSON.stringify([["s83e1", 83, 1, "3v3", "2026-09-09", false], ["s83e2", 83, 2, "3v3", "2026-09-16", false], ["s83e3", 83, 3, "3v3", "2026-09-23", false],
        ["s84e1", 84, 1, "5v5", "2026-10-07", false], ["s84e2", 84, 2, "5v5", "2026-10-14", false], ["s84e3", 84, 3, "5v5", "2026-10-21", false],
        ["s85e1", 85, 1, "3v3", "2026-11-04", false], ["s85e2", 85, 2, "3v3", "2026-11-11", true], ["s85e3", 85, 3, "3v3", "2026-11-18", true]]) && c.schedAsOf === "2026-11-01", JSON.stringify(c.sched));
    L.ck("seasons start every 28 days (S83 9 Sep, S84 7 Oct, S85 4 Nov) and each season's events are 7 days apart",
      (Date.UTC(2026, 9, 7) - Date.UTC(2026, 8, 9)) / 864e5 === 28 && (Date.UTC(2026, 10, 4) - Date.UTC(2026, 9, 7)) / 864e5 === 28 && c.sched.filter(r => r[2] > 1).every(r => { const prev = c.sched.find(q => q[1] === r[1] && q[2] === r[2] - 1); return (Date.UTC(...r[4].split("-").map((x, i) => i === 1 ? x - 1 : +x)) - Date.UTC(...prev[4].split("-").map((x, i) => i === 1 ? x - 1 : +x))) / 864e5 === 7; }), "");
    const snap = k => c.snaps[k];
    L.ck("SNAPSHOTS: registry 24 entries (23 + cap cap-journeys)", c.reg === 24, String(c.reg));
    L.ck("SNAPSHOTS asOf: events 2026-11-01 (rv31: swgoh.gg/schedule/ read live), gac-schedule 2026-11-01 (S85 start is now on the schedule), gac-format stays 2026-10-25 (swgoh.gg/gac/squads/ not re-read)", snap("events") === "2026-11-01" && snap("gac-schedule") === "2026-11-01" && snap("gac-format") === "2026-10-25", JSON.stringify([snap("events"), snap("gac-schedule"), snap("gac-format")]));
    L.ck("SNAPSHOTS NOT bumped where the content was not re-read: conquest (plan/feats/enemy intel) 2026-09-27, era (Era 09 reference) 2026-09-28; gl-queue IS re-derived since rv25c (Ollie's order, 31 Oct roster) → 2026-11-01 (was 2026-10-03)", snap("conquest") === "2026-09-27" && snap("era") === "2026-09-28" && snap("gl-queue") === "2026-11-01", JSON.stringify([snap("conquest"), snap("era"), snap("gl-queue")]));
    L.ck("no SNAPSHOTS asOf is in the future (after the rv31 re-check, 1 Nov)", Object.values(c.snaps).every(a => !a || a <= "2026-11-01"), JSON.stringify(c.snaps));
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
    L.ck("5 Nov: S85E1 live (3v3, rv31: start now sourced, not estimated) and the format follows it; 19 Nov: S85E3 (still estimated)", g.nov5.id === "s85e1" && g.nov5.fmt === "3v3" && !g.nov5.est && g.nov19.id === "s85e3" && g.nov19.est, JSON.stringify([g.nov5, g.nov19]));
    L.ck("30 Nov: schedule has run out (null)", g.after === null, JSON.stringify(g.after));
    const gap = await p.evaluate(ms => { const e = gcfEventNow(ms); return e ? { id: e.id, live: e.gcfLive } : null; }, AEDT(29, 12) + 0 * 1);
    L.ck("29 Oct (after S84E3's 7-day window, before S85E1): not live, next is S85E1", gap && gap.id === "s85e1" && gap.live === false, JSON.stringify(gap));
    L.ck("zero page errors (gac)", errs.length === 0, JSON.stringify(errs));
    await ctx.close();
  }

  /* ---------- 3. Events tab rendered, both accounts, 1280 + 390 (rv31: 1 Nov 12:00 AEDT, v12 seed) ---------- */
  for (const w of [1280, 390]) {
    const { ctx, p, errs } = await openAt(b, { width: w, tag: "events" + w, at: RF });
    for (const acct of ["ollie", "tiny"]) {
      await L.go(p, acct, "events");
      await p.evaluate(() => { state.views.events = "all"; renderEvents(); }); await p.waitForTimeout(150);
      const rows = await evRows(p);
      const row = n => rows.find(r => r.name === n);
      L.ck(`[${w}] ${acct}: All events lists 41 rows (40 seed + the auto Executor row)`, rows.length === 41 && rows.some(r => /^Discarded Doctrine/.test(r.name)), rows.length + "");
      L.ck(`[${w}] ${acct}: live rows read Ends today (Territory Battle, Places of Power, Stardust Transmission), 1d left (Credit Heist), 2d left (Adelphi Ranger Era Challenge, last day 3 Nov), 7d left (Conquest 25 run), 16d left (the Mini-Era, to 17 Nov), and the Set 33 record row reads 3d ago`,
        row("Territory Battle — Rise of the Empire").label === "Ends today" && row("Places of Power").label === "Ends today" && row("Stardust Transmission").label === "Ends today" && row("Credit Heist").label === "1d left" && row("Adelphi Ranger Era Challenge").label === "2d left" && /3 Nov/.test(row("Adelphi Ranger Era Challenge").ends) && row("Conquest 25 (Embo & Keibu) — run 26 Oct → 9 Nov").label === "7d left" && row("Era 10 — The Mandalorian and Grogu (Mini-Era)").label === "16d left" && row("Datacron Set 33 expired").label === "3d ago",
        JSON.stringify(["Territory Battle — Rise of the Empire", "Places of Power", "Stardust Transmission", "Credit Heist", "Adelphi Ranger Era Challenge", "Conquest 25 (Embo & Keibu) — run 26 Oct → 9 Nov", "Era 10 — The Mandalorian and Grogu (Mini-Era)", "Datacron Set 33 expired"].map(n => [n, row(n).label, row(n).ends])));
      L.ck(`[${w}] ${acct}: upcoming rows — Territory War sign-up and Bespin Tomorrow (2 Nov), Champion of the Pit (Rotta) in 2d (3 Nov), the B1 marquee and GAC Season 85 in 3d (4 Nov), Dark Sovereign in 19d (20 Nov)`, row("Territory War — sign-up").label === "Tomorrow" && row("Bespin").label === "Tomorrow" && row("Champion of the Pit (Rotta the Hutt shards)").label === "in 2d" && row("Mercenary Guard Droid (B1)").label === "in 3d" && row("GAC Season 85 (3v3)").label === "in 3d" && row("Dark Sovereign").label === "in 19d" && /20 Nov/.test(row("Dark Sovereign").starts), JSON.stringify(["Territory War — sign-up", "Bespin", "Champion of the Pit (Rotta the Hutt shards)", "Mercenary Guard Droid (B1)", "GAC Season 85 (3v3)", "Dark Sovereign"].map(n => row(n) && row(n).label)));
      L.ck(`[${w}] ${acct}: Dark Sovereign note on screen says it is the Leviathan unlock journey, next run inferred, not a requirement-to-own bonus event`, /Leviathan UNLOCK journey/.test(row("Dark Sovereign").note) && /16 prerequisites/.test(row("Dark Sovereign").note) && /third-party/.test(row("Dark Sovereign").note) && !/REQUIRES/.test(row("Dark Sovereign").note) && !/does not apply/.test(row("Dark Sovereign").note), row("Dark Sovereign").note.slice(0, 120));
    const oAll = await L.overflow(p);
      L.ck(`[${w}] ${acct}: All events view (long notes) has no horizontal overflow`, oAll.doc <= oAll.inner + 1, JSON.stringify(oAll));
      await p.evaluate(() => { state.views.events = "next"; renderEvents(); }); await p.waitForTimeout(150);
      const nx = await evRows(p);
      L.ck(`[${w}] ${acct}: Current & next shows no ended event (nothing '…d ago'), first 8 are live/upcoming, Mini-Era + Adelphi Ranger Era Challenge among them`, nx.length === 8 && !nx.some(r => /d ago$/.test(r.label)) && nx.some(r => r.name === "Adelphi Ranger Era Challenge") && nx.some(r => /Mini-Era/.test(r.name)), nx.map(r => r.name + ":" + r.label).join(" | "));
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

  /* ---------- 4. ended events never upcoming; Dark Sovereign stays out of the Executor advice (rv31: 1 Nov, v12 seed) ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "up", at: RF });
    const r = await p.evaluate(() => ({
      up: upcomingEvents(30).map(e => e.name), rem: eventReminderHtml().replace(/<[^>]+>/g, " ").replace(/\s+/g, " "), today: todayEventRows().map(e => [e.name, e.when]),
      exec: ["ollie", "tiny"].map(a => JSON.stringify(executorProgress(a, new Date())) + executorProgressHtml()).join("\n")
    }));
    L.ck("upcomingEvents(): live + upcoming v12 rows (the Adelphi Ranger Era Challenge, the Mini-Era, Territory War sign-up + attack phase, Territory Battle, GAC Season 85, Dark Sovereign, the Conquest run); the over rows (Adelphi Ranger marquee, Ground War, Smuggler's Run, Set 33 record) are not listed", r.up.includes("Adelphi Ranger Era Challenge") && r.up.includes("Era 10 — The Mandalorian and Grogu (Mini-Era)") && r.up.includes("Territory War — sign-up") && r.up.includes("Territory War — attack phase") && r.up.includes("Territory Battle — Rise of the Empire") && r.up.includes("GAC Season 85 (3v3)") && r.up.includes("Dark Sovereign") && r.up.includes("Conquest 25 (Embo & Keibu) — run 26 Oct → 9 Nov") && !r.up.includes("Adelphi Ranger") && !r.up.includes("Ground War") && !r.up.includes("Smuggler's Run") && !r.up.includes("Datacron Set 33 expired"), r.up.join(" | "));
    L.ck("event reminders (Overview) never label Conquest as ending today (rv31: the label precedes the name in the reminder text, so the old /Conquest.*Ends today/ would match the NEXT item's label; it now reads '7d left')", !/Ends today\s*[◉↗]\s*\S*\s*Conquest/.test(r.rem) && /7d left\s*◉\s*Other Conquest 25/.test(r.rem), r.rem.slice(0, 200));
    L.ck("Today strip events on 1 Nov: the Territory Battle, Places of Power and Stardust Transmission end today, Credit Heist starts today; the Mini-Era, the Conquest run and the Adelphi Ranger Era Challenge read live; Ground War / Galactic Bounties I are gone", r.today.some(t => t[0] === "Territory Battle — Rise of the Empire" && t[1] === "ends today") && r.today.some(t => t[0] === "Places of Power" && t[1] === "ends today") && r.today.some(t => t[0] === "Stardust Transmission" && t[1] === "ends today") && r.today.some(t => t[0] === "Credit Heist" && t[1] === "starts today") && r.today.some(t => /Conquest 25/.test(t[0]) && /^live/.test(t[1])) && r.today.some(t => /Mini-Era/.test(t[0]) && /^live/.test(t[1])) && r.today.some(t => t[0] === "Adelphi Ranger Era Challenge" && /^live/.test(t[1])) && !r.today.some(t => /Ground War|Galactic Bounties I/.test(t[0])), JSON.stringify(r.today));
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
    L.ck("reseed 6 -> 12: version 12 (rv31), seed rows = EVENTS_SEED (40), ids seed0..seed39, the old Jaxxon / Terrible Tings rows are gone (the new ones are the '(predicted)' nodes / reruns)", r.v === 12 && seeds.length === 40 && r.n === 40 && seeds.every((e, i) => e.id === "seed" + i) && !seeds.some(e => e.name === "Jaxxon" || e.name === "Terrible Tings"), r.v + " / " + seeds.length);
    const k1 = r.items.find(e => e.id === "e1790000000001"), k2 = r.items.find(e => e.id === "e1790000000002");
    L.ck("reseed: both user-added events survive byte-for-byte and come after the seed rows", JSON.stringify(k1) === JSON.stringify(mine[0]) && JSON.stringify(k2) === JSON.stringify(mine[1]) && r.items.slice(40).map(e => e.id).join() === "e1790000000001,e1790000000002", JSON.stringify(r.items.slice(40).map(e => e.id)));
    await L.go(p, "ollie", "events");
    await p.evaluate(() => { state.views.events = "all"; renderEvents(); }); await p.waitForTimeout(150);
    const rows = await evRows(p);
    L.ck("reseed: the user's rows render (markup escaped) next to the new seed rows", rows.some(x => x.name === "Guild TW start") && rows.some(x => x.name === "Mod night <b>x</b>") && rows.some(x => x.name === "Bespin"), rows.length + " rows");
    await p.evaluate(() => { const e = state.events.items.find(x => x.id === "e1790000000001"); e.note = "edited after the bump"; store.write(state); });
    await p.reload({ waitUntil: "domcontentloaded" }); await p.waitForTimeout(900);
    const r2 = await p.evaluate(() => ({ v: state.eventsSeedVersion, n: state.events.items.length, note: (state.events.items.find(x => x.id === "e1790000000001") || {}).note }));
    L.ck("reseed is idempotent on reload (42 rows = 40 seed + 2 user rows, v12, edit after the bump kept)", r2.v === 12 && r2.n === 42 && r2.note === "edited after the bump", JSON.stringify(r2));
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
