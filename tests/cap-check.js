/* cap: Capital ship journeys (Arena tab > Fleet Arena card "capjourneys") + the corrected Dark Sovereign note (Events seed row).
   Boots the real saved state + the 12 Oct 2026 roster pulls (SNAP_DATE defaults to 2026-10-12 here). Every expected unit value below was
   read from holotable-roster-snapshot-2026-10-12.json, and the Ollie figures reconcile with the in-game 5/16 (Leviathan) and 7/14
   (Profundity) the owner read off Ollietank's screens on 15 Oct. Covers: the data (16 + 14 prerequisites, exact names/levels, 80 blueprints
   as 10/10/20/40), Ollie 5/16 + 7/14, Tiny's computed status, "not owned" cases, exact-name matching, no-pull baseline, the corrected
   Dark Sovereign wording (old claims gone), registry (24), escaping, Arena-overview pointer, layout-editor hide/show, 390/1280 overflow,
   zero page errors, screenshots into shots/.
   Run: cd DIR && NODE_PATH=... FILE=DIR/index.html PORT=9xxx SNAP_DATE=2026-10-12 node tests/cap-check.js */
process.env.SNAP_DATE = process.env.SNAP_DATE || "2026-10-12";
const L = require("./lib.js");
const ck = L.ck;
const LEV = [["Darth Revan", "r", 9], ["Darth Malak", "r", 9], ["Sith Empire Trooper", "r", 7], ["Sith Trooper", "r", 7], ["Darth Maul", "r", 7], ["HK-47", "r", 7], ["Bastila Shan", "r", 7], ["Sith Assassin", "r", 5], ["50R-T", "r", 5],
  ["Fury-class Interceptor", "s", 4], ["Mark VI Interceptor", "s", 4], ["TIE Dagger", "s", 4], ["B-28 Extinction-class Bomber", "s", 4], ["Scimitar", "s", 4], ["Sith Fighter", "s", 4], ["Ebon Hawk", "s", 4]];
const PRO = [["Admiral Raddus", "r", 9], ["Cassian Andor", "r", 8], ["Dash Rendar", "r", 7], ["Mon Mothma", "r", 5], ["Bistan", "r", 5], ["Jyn Erso", "r", 5], ["Hera Syndulla", "r", 5],
  ["Outrider", "s", 4], ["Cassian's U-wing", "s", 4], ["Bistan's U-wing", "s", 4], ["Wedge Antilles's X-wing", "s", 4], ["Biggs Darklighter's X-wing", "s", 4], ["Rebel Y-wing", "s", 4], ["Ghost", "s", 4]];
/* expected on-screen gap text per unit, written by hand from the 12 Oct pulls (NOT from the app's own functions) */
const GAP = {
  ollie: {
    lev: { "Darth Revan": "7★ R5 — +4 relic tiers (R5 → R9)", "Darth Malak": "7★ R7 — +2 relic tiers (R7 → R9)", "Sith Empire Trooper": "7★ R5 — +2 relic tiers (R5 → R7)", "Sith Trooper": "7★ R5 — +2 relic tiers (R5 → R7)",
      "Darth Maul": "7★ G12 — 1 gear step to G13 (G12 → G13) · +7 relic tiers (R0 → R7)", "HK-47": "7★ R5 — +2 relic tiers (R5 → R7)", "Bastila Shan": "7★ G12 — 1 gear step to G13 (G12 → G13) · +7 relic tiers (R0 → R7)",
      "Sith Assassin": "7★ G3 — 10 gear steps to G13 (G3 → G13) · +5 relic tiers (R0 → R5)", "50R-T": "7★ G7 — 6 gear steps to G13 (G7 → G13) · +5 relic tiers (R0 → R5)",
      "Fury-class Interceptor": "not owned", "Mark VI Interceptor": "3★ — 1★ to go (3★ → 4★)", "TIE Dagger": "✓ 7★", "B-28 Extinction-class Bomber": "✓ 7★", "Scimitar": "✓ 7★", "Sith Fighter": "✓ 5★", "Ebon Hawk": "✓ 7★" },
    pro: { "Admiral Raddus": "7★ G5 — 8 gear steps to G13 (G5 → G13) · +9 relic tiers (R0 → R9)", "Cassian Andor": "7★ G7 — 6 gear steps to G13 (G7 → G13) · +8 relic tiers (R0 → R8)",
      "Dash Rendar": "4★ G3 — needs 7★ first (4★ → 7★) · 10 gear steps to G13 (G3 → G13) · +7 relic tiers (R0 → R7)", "Mon Mothma": "7★ G12 — 1 gear step to G13 (G12 → G13) · +5 relic tiers (R0 → R5)",
      "Bistan": "7★ G4 — 9 gear steps to G13 (G4 → G13) · +5 relic tiers (R0 → R5)", "Jyn Erso": "7★ G10 — 3 gear steps to G13 (G10 → G13) · +5 relic tiers (R0 → R5)", "Hera Syndulla": "7★ R3 — +2 relic tiers (R3 → R5)",
      "Outrider": "✓ 7★", "Cassian's U-wing": "✓ 7★", "Bistan's U-wing": "✓ 7★", "Wedge Antilles's X-wing": "✓ 7★", "Biggs Darklighter's X-wing": "✓ 7★", "Rebel Y-wing": "✓ 7★", "Ghost": "✓ 7★" }
  },
  tiny: {
    lev: { "Darth Revan": "not owned", "Darth Malak": "not owned", "Sith Empire Trooper": "6★ G5 — needs 7★ first (6★ → 7★) · 8 gear steps to G13 (G5 → G13) · +7 relic tiers (R0 → R7)", "Sith Trooper": "7★ R5 — +2 relic tiers (R5 → R7)",
      "Darth Maul": "7★ G12 — 1 gear step to G13 (G12 → G13) · +7 relic tiers (R0 → R7)", "HK-47": "7★ G5 — 8 gear steps to G13 (G5 → G13) · +7 relic tiers (R0 → R7)", "Bastila Shan": "7★ G10 — 3 gear steps to G13 (G10 → G13) · +7 relic tiers (R0 → R7)",
      "Sith Assassin": "7★ G5 — 8 gear steps to G13 (G5 → G13) · +5 relic tiers (R0 → R5)", "50R-T": "7★ G5 — 8 gear steps to G13 (G5 → G13) · +5 relic tiers (R0 → R5)",
      "Fury-class Interceptor": "not owned", "Mark VI Interceptor": "2★ — 2★ to go (2★ → 4★)", "TIE Dagger": "✓ 7★", "B-28 Extinction-class Bomber": "✓ 7★", "Scimitar": "✓ 7★", "Sith Fighter": "✓ 7★", "Ebon Hawk": "✓ 7★" },
    pro: { "Admiral Raddus": "7★ G5 — 8 gear steps to G13 (G5 → G13) · +9 relic tiers (R0 → R9)", "Cassian Andor": "7★ G5 — 8 gear steps to G13 (G5 → G13) · +8 relic tiers (R0 → R8)",
      "Dash Rendar": "7★ G5 — 8 gear steps to G13 (G5 → G13) · +7 relic tiers (R0 → R7)", "Mon Mothma": "7★ G12 — 1 gear step to G13 (G12 → G13) · +5 relic tiers (R0 → R5)",
      "Bistan": "7★ G6 — 7 gear steps to G13 (G6 → G13) · +5 relic tiers (R0 → R5)", "Jyn Erso": "7★ G8 — 5 gear steps to G13 (G8 → G13) · +5 relic tiers (R0 → R5)", "Hera Syndulla": "7★ G13 — +5 relic tiers (R0 → R5)",
      "Outrider": "✓ 7★", "Cassian's U-wing": "✓ 7★", "Bistan's U-wing": "✓ 7★", "Wedge Antilles's X-wing": "✓ 7★", "Biggs Darklighter's X-wing": "✓ 7★", "Rebel Y-wing": "✓ 7★", "Ghost": "✓ 7★" }
  }
};
/* [met, total, tiers] per account per journey, by hand from the pulls */
const SUM = { ollie: { lev: [5, 16, 36], pro: [7, 14, 41] }, tiny: { lev: [5, 16, 58], pro: [7, 14, 44] } };
const NOT_OWNED = { ollie: { lev: ["Fury-class Interceptor"], pro: [] }, tiny: { lev: ["Darth Revan", "Darth Malak", "Fury-class Interceptor"], pro: [] } };
const arena = async (p, acct, view) => { await p.evaluate(([a, v]) => { switchAcct(a); switchTab("arena"); sectionView("arena", v || "fleet"); }, [acct, view]); await p.waitForTimeout(350); };
const ACCOUNTS_LABEL = { ollie: "Ollietank", tiny: "Tiny" };

(async () => {
  const srv = await L.serve(); const b = await L.chromium.launch({ headless: true });

  /* ---- 1. constants, pure ---- */
  {
    const { ctx, p, errs } = await L.open(b, { tag: "pure" });
    const c = await p.evaluate(() => {
      const e = SNAP_BY_KEY["cap-journeys"], row = EVENTS_SEED.find(r => r.name === "Dark Sovereign");
      const eligible = new Set(DROID_RAID.ELIGIBLE.map(x => x.name));
      return { j: CAP_JOURNEYS.map(j => ({ key: j.key, ship: j.ship, event: j.event, guide: j.guide, starts: j.starts, bp: j.blueprints, tiers: j.tiers, n: j.req.length, req: j.req.map(r => [r[1], r[2], r[3]]), when: j.when, conflict: j.conflict, order: j.order })),
        asOf: CAP_ASOF, opinion: CAP_OPINION, reg: { n: SNAPSHOTS.length, keys: new Set(SNAPSHOTS.map(s => s.key)).size, e: e && { asOf: e.asOf, halfLife: e.halfLife, tab: e.tab, hint: e.hint, label: e.label, expires: e.expires } },
        raidClash: CAP_JOURNEYS.flatMap(j => j.req.map(r => r[1])).filter(n => eligible.has(n)), seedVer: EVENTS_SEED_VERSION, stateVer: state.eventsSeedVersion, row, glqAsOf: GL_QUEUE.asOf,
        meta: META_FLEET_TIER.filter(f => f.name === "Leviathan" || f.name === "Profundity").map(f => [f.name, f.tier]),
        unit: (() => {
          const reqs = { SITHTROOPER: { name: "Sith Empire Trooper", s: 7, g: 13, r: 5 }, FOSITHTROOPER: { name: "Sith Trooper", s: 7, g: 13, r: 6 }, TIEDAGGER: { name: "Not TIE Dagger", s: 7, g: 1, r: 0 }, FURY: { name: "Fury-class Interceptor", s: 4, g: 1, r: 0 }, NONAME: { s: 7, g: 13, r: 9 } };
          return { wrongNameRejected: mglResolve(reqs, "TIEDAGGER", "TIE Dagger") === undefined, byIdRightName: mglResolve(reqs, "SITHTROOPER", "Sith Empire Trooper") === reqs.SITHTROOPER, troopersApart: mglResolve(reqs, "FOSITHTROOPER", "Sith Trooper") === reqs.FOSITHTROOPER,
            nullIdByName: mglResolve(reqs, "", "Fury-class Interceptor") === reqs.FURY, baselineNoName: mglResolve({ HK47: { s: 7, g: 13, r: 7 } }, "HK47", "HK-47") !== undefined,
            relicMet: capEval({ s: 7, g: 13, r: 7 }, "r", 7).met, relicShort: capEval({ s: 7, g: 13, r: 6 }, "r", 7).met, relicG12: capEval({ s: 7, g: 12, r: 0 }, "r", 7).gap, shipExact4: capEval({ s: 4, g: 1, r: 0 }, "s", 4).met, ship3: capEval({ s: 3, g: 1, r: 0 }, "s", 4).met,
            lowStar: capEval({ s: 4, g: 3, r: 0 }, "r", 7).gap, unowned: capEval(undefined, "r", 9), unownedShip: capEval(undefined, "s", 4), relicOnlyCountsAtG13: capEval({ s: 7, g: 12, r: 0 }, "r", 5).met };
        })() };
    });
    const lev = c.j[0], pro = c.j[1];
    ck("two journeys: Leviathan (event Dark Sovereign, starts 2026-10-20) and Profundity (event Stardust Transmission, no date), both 'Journey Guide · Fleet Mastery'", lev.ship === "Leviathan" && lev.event === "Dark Sovereign" && lev.starts === "2026-10-20" && pro.ship === "Profundity" && pro.event === "Stardust Transmission" && pro.starts === null && lev.guide === "Journey Guide · Fleet Mastery" && pro.guide === lev.guide, JSON.stringify([lev.ship, lev.event, pro.ship, pro.event]));
    ck("Leviathan: 16 prerequisites in the screen's order with exact names and levels (R9 R9 R7 R7 R7 R7 R7 R5 R5 + seven 4★ ships)", lev.n === 16 && JSON.stringify(lev.req) === JSON.stringify(LEV), JSON.stringify(lev.req));
    ck("Profundity: 14 prerequisites in the screen's order with exact names and levels (R9 R8 R7 R5 R5 R5 R5 + seven 4★ ships)", pro.n === 14 && JSON.stringify(pro.req) === JSON.stringify(PRO), JSON.stringify(pro.req));
    ck("both rewards: 80 blueprints in four tiers 10/10/20/40 (sum 80)", [lev, pro].every(j => j.bp === 80 && JSON.stringify(j.tiers) === "[10,10,20,40]" && j.tiers.reduce((a, b) => a + b, 0) === 80), JSON.stringify([lev.tiers, pro.tiers]));
    ck("honest unknowns: Leviathan date from the in-game countdown (4d 18h on 15 Oct), duration/recurrence/separate-bonus unknown; Profundity 'EVENT CURRENTLY UNAVAILABLE', no date known", /20 Oct 2026 18:00 AEDT/.test(lev.when) && /4d 18h on 15 Oct/.test(lev.when) && /unknown/.test(lev.when) && /separate Leviathan bonus event/.test(lev.when) && /EVENT CURRENTLY UNAVAILABLE/.test(pro.when) && /no date is known/.test(pro.when) && /unknown/.test(pro.when), lev.when + " || " + pro.when);
    ck("source conflict stated: swgoh.gg's 12 Oct 'bonus star-up' reading vs the in-game screen, which wins", /read 12 Oct/.test(lev.conflict) && /bonus star-up/.test(lev.conflict) && /in-game screen/.test(lev.conflict) && /follows/.test(lev.conflict), lev.conflict);
    ck("app's opinion constant is the requested sentence, and the cheapest-first order names the units in the requested order (Malak/Trooper/Trooper/HK-47 +2, Revan +4, Mark VI, Fury-class source unknown, Maul/Bastila, 50R-T/Sith Assassin)",
      c.opinion === "Leviathan is the nearer target for Ollie (≈36 tiers, dated, Sith roster part-built); Profundity needs ≈41 tiers plus gear and has no date." && /Malak.*Sith Empire Trooper.*Sith Trooper.*HK-47.*\+2.*Revan \+4.*Mark VI.*Fury-class Interceptor.*source unknown.*Maul.*Bastila.*one gear step.*\+7.*50R-T.*Sith Assassin.*heavy gear/.test(lev.order), lev.order);
    ck("tier context is NOT duplicated: Leviathan S / Profundity A come from META_FLEET_TIER; the journeys carry no tier letters of their own", JSON.stringify(c.meta) === '[["Leviathan","S"],["Profundity","A"]]' && c.j.every(j => !("tier" in j)), JSON.stringify(c.meta));
    ck("SNAPSHOTS: cap-journeys registered (asOf 2026-10-15, half-life 14, tab arena, honest hint, no hard expiry); registry is 24 unique keys; gl-queue untouched", c.reg.n === 24 && c.reg.keys === 24 && c.reg.e && c.reg.e.asOf === "2026-10-15" && c.reg.e.halfLife === 14 && c.reg.e.tab === "arena" && /re-check in-game: prerequisites and dates are read off the user's screenshots/.test(c.reg.e.hint) && !c.reg.e.expires && c.asOf === "2026-10-15" && c.glqAsOf === "2026-10-03", JSON.stringify(c.reg));
    ck("none of the 30 prerequisite names is one of Droid Destruction's 33 eligible units (exact names; 'Cassian Andor (Undercover)' and 'Maul (Hate-Fueled)' are different units)", c.raidClash.length === 0, JSON.stringify(c.raidClash));
    ck("exact-name resolution: a wrong name under an id is rejected; Sith Empire Trooper (SITHTROOPER) and Sith Trooper (FOSITHTROOPER) stay apart; a null id resolves by exact name; nameless baseline entries still resolve by id",
      c.unit.wrongNameRejected && c.unit.byIdRightName && c.unit.troopersApart && c.unit.nullIdByName && c.unit.baselineNoName, JSON.stringify(c.unit));
    ck("capEval: relic met only at relic >= need; ship met at stars >= 4 (exactly 4★ counts, 3★ does not); G12 without relic = 1 gear step + all tiers; 4★ character 'needs 7★ first'; not owned = whole requirement; no relic counts below G13",
      c.unit.relicMet === true && c.unit.relicShort === false && c.unit.shipExact4 === true && c.unit.ship3 === false && /1 gear step to G13 \(G12 → G13\) · \+7 relic tiers \(R0 → R7\)/.test(c.unit.relicG12) && /^needs 7★ first \(4★ → 7★\)/.test(c.unit.lowStar)
      && c.unit.unowned.gap === "not owned" && c.unit.unowned.tiers === 9 && c.unit.unownedShip.gap === "not owned" && c.unit.relicOnlyCountsAtG13 === false, JSON.stringify(c.unit));
    ck("EVENTS_SEED_VERSION is 8 and the saved state was reseeded to it", c.seedVer === 8 && c.stateVer === 8, JSON.stringify([c.seedVer, c.stateVer]));
    ck("no page errors (pure)", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ---- 2. Dark Sovereign wording (data, source text, rendered Events tab) ---- */
  {
    const { ctx, p, errs } = await L.open(b, { tag: "ds" });
    const note = await p.evaluate(() => EVENTS_SEED.find(r => r.name === "Dark Sovereign").note);
    const src = L.fs.readFileSync(L.FILE, "utf8");
    ck("Dark Sovereign row: Leviathan UNLOCK journey, starts ~20 Oct 18:00 AEDT (countdown 4d 18h on 15 Oct), 16 prerequisites, 80 blueprints in 4 tiers 10/10/20/40, Leviathan at 0/80", /Leviathan UNLOCK journey/.test(note) && /20 Oct 18:00 AEDT/.test(note) && /4d 18h/.test(note) && /16 prerequisites/.test(note) && /80 blueprints in 4 reward tiers \(10\/10\/20\/40\)/.test(note) && /0\/80/.test(note), note);
    ck("Dark Sovereign row: states the swgoh.gg (12 Oct) 'bonus star-up' reading as a CONFLICT that the in-game screen wins, and what is still unknown (duration, recurrence, separate bonus event)", /CONFLICT/.test(note) && /read 12 Oct/.test(note) && /bonus star-up/.test(note) && /in-game screen contradicts that/.test(note) && /Still unknown: how long the event stays open, how often it returns, and whether a separate bonus event also exists/.test(note), note);
    ck("old claims are gone from the row and from the whole file: 'REQUIRES completing the Leviathan Fleet Mastery tier 4', 'does not apply to either account', 'Neither Ollie nor Tiny owns Leviathan', 'needs Leviathan owned at 4★+', 'plays no part in these numbers'",
      !/REQUIRES completing the Leviathan/.test(src) && !/does not apply to either/.test(src) && !/does not apply to either account/.test(note) && !/Neither Ollie nor Tiny owns Leviathan/.test(src) && !/needs Leviathan owned at 4★\+/.test(src) && !/plays no part in these numbers/.test(src) && !/bonus event\s*\n?\s*\(20 Oct/.test(src) && !/OWNING Leviathan at 4★ or more/.test(src), "");
    ck("the Executor comment now says it is a different ship so the crystal numbers are unaffected, and no longer says Leviathan must be owned", /Leviathan unlock journey "Dark Sovereign"/.test(src) && /different\s+ship from the Executor, so the crystal\/refresh\/pack numbers above are unaffected/.test(src), "");
    for (const acct of ["ollie", "tiny"]) {
      await p.evaluate(a => { switchAcct(a); switchTab("events"); }, acct); await p.waitForTimeout(350);
      const t = await p.evaluate(() => { const rows = [...document.querySelectorAll("#tab-events tr, #tab-events .ev-row, #tab-events [class*=ev]")].filter(e => /Dark Sovereign/.test(e.textContent)); return rows.length ? rows[rows.length - 1].textContent.replace(/\s+/g, " ") : document.body.textContent.replace(/\s+/g, " ").match(/Dark Sovereign.{0,900}/) ? document.body.textContent.replace(/\s+/g, " ").match(/Dark Sovereign.{0,900}/)[0] : ""; });
      ck(`[${acct}] Events tab shows the corrected Dark Sovereign note (unlock journey + 'Capital ship journeys' pointer), none of the old claims`, /Leviathan UNLOCK journey/.test(t) && /Capital ship journeys/.test(t) && !/REQUIRES/.test(t) && !/does not apply/.test(t), t.slice(0, 160));
    }
    ck("no page errors (ds)", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ---- 3. per-account live status from the 12 Oct pulls ---- */
  for (const acct of ["ollie", "tiny"]) {
    const { ctx, p, errs } = await L.open(b, { tag: "acct-" + acct });
    await arena(p, acct, "fleet");
    const d = await p.evaluate(() => {
      const card = document.querySelector('#arenaGrid [data-card="capjourneys"]');
      const j = {};
      card.querySelectorAll(".cap-journey").forEach(el => {
        const key = el.dataset.capJourney;
        j[key] = { sums: Object.fromEntries([...el.querySelectorAll(".cap-sum")].map(s => [s.dataset.capSum, s.textContent.replace(/\s+/g, " ").trim()])),
          rows: Object.fromEntries([...el.querySelectorAll(".cap-row[data-cap-unit]")].map(r => [r.dataset.capUnit, { pre: r.querySelector(".cap-pre").textContent.replace(/\s+/g, " ").trim(), cells: Object.fromEntries([...r.querySelectorAll(".cap-cell")].map(c => [c.dataset.capAcct, c.textContent.replace(/\s+/g, " ").trim()])) }])),
          head: el.querySelector(".cap-jhead").textContent.replace(/\s+/g, " ").trim(), when: el.querySelector(".cap-when").textContent, order: el.querySelector(".cap-order p").textContent, count: el.querySelectorAll(".cap-row[data-cap-unit]").length };
      });
      return { j, title: card.querySelector(".cardtitle").textContent.replace(/\s+/g, " ").trim(), text: card.textContent.replace(/\s+/g, " "), opinion: card.querySelector(".cap-opinion").textContent.replace(/\s+/g, " ").trim(), chip: !!card.querySelector(".cardtitle .chip"),
        accts: [...card.querySelector(".cap-journey").querySelectorAll(".cap-sum")].map(s => s.dataset.capSum), idx: [...document.querySelectorAll("#arenaGrid > .card")].map(c => c.dataset.card),
        rowsOk: [...document.querySelectorAll("#arenaGrid .cap-row[data-cap-unit]")].every(r => [...r.children].map(c => c.className).join().includes("cap-cell")) };
    });
    ck(`[${acct}] card is on the Fleet Arena view and is the first card; title 'Capital ship journeys'; freshness chip present`, d.idx[0] === "capjourneys" && /^Capital ship journeys/.test(d.title) && d.chip, JSON.stringify(d.idx));
    ck(`[${acct}] both journeys render, Ollietank listed first in every summary and every row`, Object.keys(d.j).join() === "leviathan,profundity" && d.accts.join() === "ollie,tiny" && Object.values(d.j).every(x => Object.values(x.rows).every(r => Object.keys(r.cells).join() === "ollie,tiny")), d.accts.join());
    ck(`[${acct}] 16 + 14 prerequisite rows, names and requirement labels match the data (R9 / 4★ …)`, d.j.leviathan.count === 16 && d.j.profundity.count === 14 &&
      LEV.every(([n, k, v]) => d.j.leviathan.rows[n] && d.j.leviathan.rows[n].pre === `${n} ${k === "r" ? "R" + v : v + "★"}`) && PRO.every(([n, k, v]) => d.j.profundity.rows[n] && d.j.profundity.rows[n].pre === `${n} ${k === "r" ? "R" + v : v + "★"}`), "");
    for (const who of ["ollie", "tiny"]) {
      const badLev = LEV.filter(([n]) => d.j.leviathan.rows[n].cells[who] !== `${(ACCOUNTS_LABEL[who])} ${GAP[who].lev[n]}`.replace(/\s+/g, " ")).map(([n]) => [n, d.j.leviathan.rows[n].cells[who], GAP[who].lev[n]]);
      const badPro = PRO.filter(([n]) => d.j.profundity.rows[n].cells[who] !== `${(ACCOUNTS_LABEL[who])} ${GAP[who].pro[n]}`.replace(/\s+/g, " ")).map(([n]) => [n, d.j.profundity.rows[n].cells[who], GAP[who].pro[n]]);
      ck(`[${acct}] ${who === "ollie" ? "Ollie" : "Tiny"} column: every Leviathan and Profundity prerequisite shows the current ★/G/R state and the computed gap from the 12 Oct pull`, badLev.length === 0 && badPro.length === 0, JSON.stringify([badLev, badPro]).slice(0, 700));
      const s = SUM[who];
      for (const [key, name] of [["lev", "leviathan"], ["pro", "profundity"]]) {
        const [m, t, tiers] = s[key], txt = d.j[name].sums[who];
        ck(`[${acct}] ${who} ${name}: '${m}/${t} prerequisites met · ≈${tiers} relic tiers left'${who === "ollie" ? ` — reconciles with the in-game ${m}/${t}` : ""}`, new RegExp(`${m}/${t} prerequisites met · ≈${tiers} relic tiers left`).test(txt), txt);
      }
      ck(`[${acct}] ${who}: 'not owned' cases — ${NOT_OWNED[who].lev.join(", ") || "none"} (Leviathan); none for Profundity; each reads 'not owned', never a number`, NOT_OWNED[who].lev.every(n => d.j.leviathan.rows[n].cells[who].endsWith("not owned")) && d.j.leviathan.sums[who].includes(`${NOT_OWNED[who].lev.length} not owned`) && !/not owned/.test(Object.values(d.j.profundity.rows).map(r => r.cells[who]).join(" ")), d.j.leviathan.sums[who]);
      ck(`[${acct}] ${who}: Leviathan and Profundity themselves 'not owned' in the summary, with the roster date shown`, /Leviathan not owned/.test(d.j.leviathan.sums[who]) && /Profundity not owned/.test(d.j.profundity.sums[who]) && /Oct 12, 2026/.test(d.j.leviathan.sums[who]), d.j.leviathan.sums[who]);
    }
    ck(`[${acct}] Ollie 5/16 and 7/14 exactly (the in-game counts)`, SUM.ollie.lev[0] === 5 && /5\/16 prerequisites met/.test(d.j.leviathan.sums.ollie) && /7\/14 prerequisites met/.test(d.j.profundity.sums.ollie) && !/15\/16|6\/16|8\/14|6\/14/.test(d.j.leviathan.sums.ollie + d.j.profundity.sums.ollie), d.j.leviathan.sums.ollie + " || " + d.j.profundity.sums.ollie);
    ck(`[${acct}] the five met Leviathan prerequisites on Ollie are exactly TIE Dagger, B-28, Scimitar, Sith Fighter, Ebon Hawk; the seven met Profundity ones are the seven 4★ ships`,
      LEV.filter(([n]) => d.j.leviathan.rows[n].cells.ollie.includes("✓")).map(x => x[0]).join() === "TIE Dagger,B-28 Extinction-class Bomber,Scimitar,Sith Fighter,Ebon Hawk" && PRO.filter(([n]) => d.j.profundity.rows[n].cells.ollie.includes("✓")).map(x => x[0]).join() === "Outrider,Cassian's U-wing,Bistan's U-wing,Wedge Antilles's X-wing,Biggs Darklighter's X-wing,Rebel Y-wing,Ghost", "");
    ck(`[${acct}] event lines: Leviathan 'Dark Sovereign', starts ~20 Oct 18:00 AEDT; Profundity 'Stardust Transmission', 'EVENT CURRENTLY UNAVAILABLE', no date; unknowns spelled out; tier chips S (Leviathan) and A (Profundity) read from the tier data (96.6% / 98.5% WR)`,
      /Dark Sovereign/.test(d.j.leviathan.head) && /S-tier 96\.6% WR/.test(d.j.leviathan.head) && /Stardust Transmission/.test(d.j.profundity.head) && /A-tier 98\.5% WR/.test(d.j.profundity.head) && /~20 Oct 2026 18:00 AEDT/.test(d.j.leviathan.when) && /How long the event stays open/.test(d.j.leviathan.when) && /EVENT CURRENTLY UNAVAILABLE/.test(d.j.profundity.when) && /no date is known/.test(d.j.profundity.when), d.j.leviathan.head);
    ck(`[${acct}] opinion clearly labelled 'The app's opinion (not a fact)' with the requested sentence; GAC usefulness + Droid Destruction note (not on the 33-unit list; hold until boxes/kits known; waves from 16 Oct) present`,
      /^The app's opinion \(not a fact\): Leviathan is the nearer target for Ollie \(≈36 tiers, dated, Sith roster part-built\); Profundity needs ≈41 tiers plus gear and has no date\.$/.test(d.opinion) && /useful for GAC too/.test(d.text) && /33-unit eligible list/.test(d.text) && /boxes and boss kits are known/.test(d.text) && /16 Oct/.test(d.text) && /competition for the same relic materials/.test(d.text), d.opinion);
    ck(`[${acct}] cheapest-first order (collapsed, labelled as opinion) matches the requested sequence; honest 'verify in-game' provenance line`, /Malak, Sith Empire Trooper, Sith Trooper and HK-47 are \+2/.test(d.j.leviathan.order) && /Fury-class Interceptor \(Ollie does not own it - source unknown, check that unit's screen in-game\)/.test(d.j.leviathan.order) && /re-check in-game/.test(d.text) && /in-game screenshots/.test(d.text) && /Season 83/.test(d.text), d.j.leviathan.order.slice(0, 120));
    ck(`[${acct}] no page errors`, errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ---- 4. baseline (no pull) + escaping + pointer ---- */
  {
    const { ctx, p, errs } = await L.open(b, { tag: "nopull", pulls: false });
    await arena(p, "ollie", "fleet");
    const d = await p.evaluate(() => { const card = document.querySelector('[data-card="capjourneys"]'); return { rows: card.querySelectorAll(".cap-row[data-cap-unit]").length, sums: [...card.querySelectorAll(".cap-sum")].map(s => s.textContent.replace(/\s+/g, " ")), na: card.querySelectorAll(".cap-cell.cap-na").length, notOwned: /not owned/.test(card.textContent), txt: card.textContent.replace(/\s+/g, " ") }; });
    ck("without a live pull the card renders all 30 rows, says 'pull needed' for every cell/summary and never claims 'not owned' from the nameless, ship-less baseline roster", d.rows === 30 && d.na === 60 && d.sums.length === 4 && d.sums.every(s => /pull needed to see status/.test(s)) && !d.notOwned, JSON.stringify([d.rows, d.na, d.sums]));
    await arena(p, "tiny", "fleet");
    ck("baseline, Tiny: no throw, rows rendered", await p.evaluate(() => document.querySelectorAll('[data-card="capjourneys"] .cap-row[data-cap-unit]').length) === 30, "");
    await arena(p, "ollie", "overview");
    const ov = await p.evaluate(() => ({ card: !!document.querySelector('[data-card="capjourneys"]'), pointer: !!document.querySelector(".cap-pointer") }));
    ck("baseline: Arena overview has no live card to hang the pointer on (empty-state) and does not throw", ov.card === false, JSON.stringify(ov));
    ck("no page errors (baseline)", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }
  {
    const { ctx, p, errs } = await L.open(b, { tag: "esc" });
    await p.evaluate(() => { state.pulls.ollie.fetchedLabel = 'Live <b id="capxss">pull</b> "q" & <img src=x onerror="window.__capx=1">'; store.write(state); });
    await arena(p, "ollie", "fleet");
    const d = await p.evaluate(() => ({ injected: !!document.getElementById("capxss") || !!document.querySelector('[data-card="capjourneys"] img') || window.__capx === 1, txt: document.querySelector('[data-card="capjourneys"]').textContent.includes('<b id="capxss">pull</b>') }));
    ck("escaping: markup in the pull's label is shown as text inside the card, never parsed", !d.injected && d.txt, JSON.stringify(d));
    await arena(p, "ollie", "overview");
    const ov = await p.evaluate(() => { const el = document.querySelector(".cap-pointer"); return el ? { txt: el.textContent.replace(/\s+/g, " ").trim(), link: !!el.querySelector("a") } : null; });
    ck("Arena overview: one pointer line with both accounts' met counts per journey and a Fleet Arena link (Ollietank first)", ov && ov.link && /^Capital ship journeys \(prerequisites met\) — Leviathan Ollietank 5\/16 · Tiny 5\/16; Profundity Ollietank 7\/14 · Tiny 7\/14\./.test(ov.txt), ov && ov.txt);
    await p.evaluate(() => document.querySelector(".cap-pointer a").click()); await p.waitForTimeout(350);
    ck("the pointer link opens Fleet Arena, where the card is", await p.evaluate(() => state.views.arena === "fleet" && !!document.querySelector('#arenaGrid [data-card="capjourneys"]')), "");
    await p.evaluate(() => { switchTab("modes"); }); await p.waitForTimeout(250);
    ck("not spammed: the card exists only in the Arena pane (not on Game modes, Overview, Roster Gaps, Events)", await p.evaluate(() => [...document.querySelectorAll('[data-card="capjourneys"]')].every(c => c.closest("#arenaGrid")) && document.querySelectorAll('[data-card="capjourneys"]').length === 1), "");
    ck("no page errors (escaping/pointer)", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ---- 5. layout editor: hide / show the card ---- */
  {
    const { ctx, p, errs } = await L.open(b, { tag: "lay" });
    await arena(p, "ollie", "fleet");
    await p.evaluate(() => { if (!editMode) toggleEdit(); }); await p.waitForTimeout(200);
    const before = await p.evaluate(() => ({ tools: !!document.querySelector('#arenaGrid [data-card="capjourneys"] .lay-tools'), title: layTitles["arena/capjourneys"] }));
    ck("edit mode: the card carries the layout tools and a friendly title", before.tools && /Capital ship journeys/.test(before.title || ""), JSON.stringify(before));
    await p.evaluate(() => hideCard(new Event("click"), "arena", "capjourneys")); await p.waitForTimeout(200);
    const hid = await p.evaluate(() => ({ strip: !!document.querySelector('#arenaGrid > .lay-hidcard[data-card="capjourneys"]'), full: !!document.querySelector('#arenaGrid > .card[data-card="capjourneys"]:not(.lay-hidcard)'), hidden: (state.layout.hidden.arena || []).slice() }));
    ck("hide: the card collapses to a '⊕ show' strip, the rest of Fleet Arena stays", hid.strip && !hid.full && hid.hidden.includes("capjourneys") && await p.evaluate(() => !!document.querySelector('#arenaGrid [data-card="fleetlog"]')), JSON.stringify(hid));
    await p.evaluate(() => { toggleEdit(); }); await p.waitForTimeout(200);
    ck("after leaving edit mode the hidden card is gone from the page (no strip, no card)", await p.evaluate(() => !document.querySelector('#arenaGrid [data-card="capjourneys"]')), "");
    await p.evaluate(() => { showCard("arena", "capjourneys"); }); await p.waitForTimeout(250);
    const back = await p.evaluate(() => ({ full: !!document.querySelector('#arenaGrid > .card[data-card="capjourneys"]:not(.lay-hidcard)'), rows: document.querySelectorAll('#arenaGrid [data-card="capjourneys"] .cap-row[data-cap-unit]').length, hidden: (state.layout.hidden.arena || []).length, first: document.querySelector("#arenaGrid > .card").dataset.card }));
    ck("show: the card is back with all 30 rows and the hidden list is empty", back.full && back.rows === 30 && back.hidden === 0, JSON.stringify(back));
    await p.evaluate(() => { switchAcct("tiny"); }); await p.waitForTimeout(250);
    ck("the layout is per pane, shared by both accounts (card still visible on Tiny)", await p.evaluate(() => !!document.querySelector('#arenaGrid [data-card="capjourneys"]')), "");
    ck("no page errors (layout)", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ---- 6. overflow + screenshots, 390 / 1280, both accounts ---- */
  for (const w of [1280, 390]) {
    const { ctx, p, errs } = await L.open(b, { tag: "ov" + w, width: w, height: w === 390 ? 900 : 1000 });
    for (const acct of ["ollie", "tiny"]) {
      await arena(p, acct, "fleet");
      const o = await L.overflow(p);
      const f = await p.evaluate(() => { const c = document.querySelector('[data-card="capjourneys"]'); const r = c.getBoundingClientRect(); return { fits: c.scrollWidth <= c.clientWidth + 1, right: r.right, vw: innerWidth, wide: [...c.querySelectorAll(".cap-row,.cap-cell,.cap-pre,.cap-sum,.cap-when,.cap-conflict,.cap-opinion,.cap-raid")].filter(e => e.scrollWidth > e.clientWidth + 1).length, cols: getComputedStyle(c.querySelector(".cap-row[data-cap-unit]")).gridTemplateColumns.split(" ").length }; });
      ck(`[${w}px ${acct}] capital ship journeys card: no horizontal overflow (doc ${o.doc} <= ${o.inner}); card and every row fit`, o.doc <= o.inner && f.fits && f.right <= f.vw + 1 && f.wide === 0, JSON.stringify([o, f]));
      ck(`[${w}px ${acct}] responsive layout: ${w === 390 ? "stacked (1 column)" : "prerequisite + one column per account (3 columns)"}`, f.cols === (w === 390 ? 1 : 3), String(f.cols));
      await p.evaluate(() => document.querySelector('[data-card="capjourneys"]').scrollIntoView({ block: "start" })); await p.waitForTimeout(150);
      await p.locator('[data-card="capjourneys"]').screenshot({ path: `${L.ROOT}/shots/cap-card-${acct}-${w}.png` });
      await arena(p, acct, "overview");
      const o2 = await L.overflow(p);
      ck(`[${w}px ${acct}] Arena overview with the pointer line: no horizontal overflow`, o2.doc <= o2.inner, JSON.stringify(o2));
      await p.screenshot({ path: `${L.ROOT}/shots/cap-overview-${acct}-${w}.png` });
    }
    ck(`[${w}px] no page errors`, errs.length === 0, errs.join(" | "));
    await ctx.close();
  }
  await L.finish(b, srv);
})();
