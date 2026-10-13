/* mgl: Mandalorian & Grogu GL watch (GL Roadmap tab › "GL order" card › Mandalorian & Grogu › Why) + the Droid Destruction
   planner's GL-overlap tags. Boots the real saved state + the 12 Oct 2026 roster pulls (SNAP_DATE defaults to 2026-10-12 here).
   Covers: the 12 requirements (exact names, relic levels) in 3 published sets + set 4 "Coming Soon", the "3 of 4 = set 3 of 4
   sets" wording, no release date / no kit statements, per-account live status computed from the pulls (every expected value
   below was read from holotable-roster-snapshot-2026-10-12.json), EXACT name matching (no fuzzy matches), the registry
   (23 entries, gl-queue NOT bumped), the planner overlap tags/squad C note, 390/1280 overflow, zero page errors. */
process.env.SNAP_DATE = process.env.SNAP_DATE || "2026-10-12";
const L = require("./lib.js");
const ck = L.ck;
/* [id, exact name, need, set, ollie "S G R" | null, tiny "S G R" | null] — values read from the 12 Oct pulls */
const EXP = [
  ["THEMANDALORIAN", "The Mandalorian", 10, 1, [7, 12, 0], [7, 12, 0]],
  ["R5D4", "R5-D4", 9, 1, [3, 9, 0], [4, 9, 0]],
  ["GREEFKARGA", "Greef Karga", 7, 1, [7, 11, 0], [7, 12, 0]],
  ["RACCOON", "Rotta the Hutt", 6, 1, null, null],
  ["IG11", "IG-11", 9, 2, [7, 13, 0], [7, 13, 0]],
  ["CARSONTEVA", "Captain Carson Teva", 7, 2, [4, 9, 0], [3, 8, 0]],
  ["RANGERZEB", "Zeb Orrelios (New Republic Pilot)", 7, 2, [5, 9, 0], [6, 9, 0]],
  ["BISHOP", "Colonel Ward", 7, 2, [3, 9, 0], [4, 9, 0]],
  ["BOBAFETTSCION", "Boba Fett, Scion of Jango", 9, 3, null, null],
  ["JEDIKNIGHTLUKE", "Jedi Knight Luke Skywalker", 8, 3, [7, 13, 7], [7, 13, 7]],
  ["GOPHERANTS", "Grogu & Anzellans", 7, 3, [3, 9, 0], [3, 9, 0]],
  ["THEMANDALORIANBESKARARMOR", "The Mandalorian (Beskar Armor)", 10, 3, [7, 13, 7], [7, 13, 7]]
];
const RAID_IDS = ["R5D4", "RACCOON", "CARSONTEVA", "RANGERZEB", "BISHOP", "GOPHERANTS"];
const gapOf = (x, need) => { if (!x) return "unlock first"; const [s, g, r] = x, b = []; if (s < 7) b.push(`${7 - s}★ to 7★`); if (r <= 0 && g < 13) b.push(`G${g} → G13`); if (r < need) b.push(`${need - r} relic tier${need - r === 1 ? "" : "s"} (R${r} → R${need})`); return b.length ? b.join(" · ") : "met ✓"; };
const curOf = x => x ? `${x[0]}★ ${x[2] > 0 ? "R" + x[2] : "G" + x[1]}` : "not owned";
(async () => {
  const srv = await L.serve(); const b = await L.chromium.launch({ headless: true });
  const openGl = async (p, acct) => { await p.evaluate(a => { switchAcct(a); switchTab("leia"); document.querySelectorAll('#glTables [data-card="glq"] details.glq-why').forEach(d => d.open = true); }, acct); await p.waitForTimeout(400); };
  const planner = async (p, acct) => { await p.evaluate(a => { switchAcct(a); state.modesnav.category = "raid"; state.modesnav.raidView = "droid"; switchTab("modes"); }, acct); await p.waitForTimeout(450); };

  /* ---- 1. constants, pure ---- */
  {
    const { ctx, p, errs } = await L.open(b, { tag: "pure" });
    const c = await p.evaluate(() => {
      const w = GL_QUEUE.watch.MANDOGROGU;
      return { req: w.req.map(r => r.slice(0, 4)), sets: MGL_SETS.map(s => ({ n: s.n, pending: !!s.pending, quest: s.quest, revealed: s.revealed, n_req: s.req.length })), note: w.note, asOf: w.asOf,
        reg: { n: SNAPSHOTS.length, gl: SNAP_BY_KEY["gl-queue"].asOf, glExp: SNAP_BY_KEY["gl-queue"].expires, drr: SNAP_BY_KEY["droid-raid"].asOf }, glqAsOf: GL_QUEUE.asOf,
        watchRaid: w.req.filter(r => r[4]).map(r => r[0]), raidEl: DROID_RAID.ELIGIBLE.filter(e => e.overlap === "glreq").map(e => [e.id, e.glRelic]), hold: DROID_RAID.ELIGIBLE.filter(e => e.overlap === "hold").length, overlapKeys: Object.keys(DRR_OVERLAP),
        queue: ["ollie", "tiny"].map(a => GL_QUEUE[a].queue.filter(e => e.watchId).map(e => e.watchId)),
        exact: (() => { const reqs = { THEMANDALORIAN: { name: "The Mandalorian (Beskar Armor)", s: 7, g: 13, r: 7 }, THEMANDALORIANBESKARARMOR: { name: "The Mandalorian (Beskar Armor)", s: 7, g: 13, r: 7 }, BOBAFETT: { name: "Boba Fett", s: 7, g: 13, r: 8 }, NONAME: { s: 7, g: 13, r: 1 }, ROTTA_ALIAS: { name: "Rotta the Hutt", s: 7, g: 12, r: 0 } };
          return { wrongNameUnderId: mglResolve(reqs, "THEMANDALORIAN", "The Mandalorian") === undefined, beskarById: mglResolve(reqs, "THEMANDALORIANBESKARARMOR", "The Mandalorian (Beskar Armor)") === reqs.THEMANDALORIANBESKARARMOR,
            scionNotBoba: mglResolve(reqs, "BOBAFETTSCION", "Boba Fett, Scion of Jango") === undefined, rottaByName: mglResolve(reqs, "RACCOON", "Rotta the Hutt") === reqs.ROTTA_ALIAS, noNameBaseline: mglResolve({ IG11: { s: 7, g: 13, r: 0 } }, "IG11", "IG-11") !== undefined,
            map: Object.keys(mglReqMap(reqs, [["THEMANDALORIAN", "The Mandalorian", 10], ["BOBAFETTSCION", "Boba Fett, Scion of Jango", 9]])).includes("THEMANDALORIAN") }; })() };
    });
    ck("watch req list = the 12 published requirements, exact names/levels, in set order", JSON.stringify(c.req) === JSON.stringify(EXP.map(e => [e[0], e[1], e[2], e[3]])), JSON.stringify(c.req));
    ck("relic levels read 10,9,7,6 · 9,7,7,7 · 9,8,7,10", c.req.map(r => r[2]).join(",") === "10,9,7,6,9,7,7,7,9,8,7,10", c.req.map(r => r[2]).join(","));
    ck("sets: 4 total; 1 'Companion' (by 22 Jul), 2 'Hunted' (19 Aug), 3 'Caretaker' (16 Sep) with 4 units each; set 4 pending with no units", c.sets.length === 4 && c.sets[0].quest === "Companion" && /22 Jul 2026/.test(c.sets[0].revealed) && c.sets[1].quest === "Hunted" && c.sets[1].revealed === "19 Aug 2026" && c.sets[2].quest === "Caretaker" && c.sets[2].revealed === "16 Sep 2026" && c.sets.slice(0, 3).every(s => s.n_req === 4 && !s.pending) && c.sets[3].pending && c.sets[3].n_req === 0, JSON.stringify(c.sets));
    ck("note: no release date and no kit reveal as of 12 Oct 2026; '3 of 4' = set 3 of 4 sets, NOT 3 of 4 requirements; set 4 still 'Coming Soon'; late Oct–early Nov labelled inference",
      /no release date and no kit reveal announced as of 12 Oct 2026/.test(c.note) && /"3 of 4" means set 3 of 4 sets, not 3 of 4 requirements/.test(c.note) && /set 4 is still "Coming Soon"/.test(c.note) && /inference only/.test(c.note) && !/requirements? unchanged/.test(c.note), c.note.slice(0, 700));
    ck("note keeps the Droid Destruction facts (8 entry tiers, Relic 10, 33 eligible units) and says the raid follows the GL in November", /8 entry tiers/.test(c.note) && /Relic 10/.test(c.note) && /33 eligible/.test(c.note) && /targeting release in November/.test(c.note));
    ck("watch entry asOf 2026-10-12; registry unchanged: 23 entries, gl-queue still 2026-10-03 (the ORDER was not re-ranked), expires 2026-11-14, droid-raid 2026-10-12", c.asOf === "2026-10-12" && c.reg.n === 23 && c.reg.gl === "2026-10-03" && c.glqAsOf === "2026-10-03" && c.reg.glExp === "2026-11-14" && c.reg.drr === "2026-10-12", JSON.stringify(c.reg));
    ck("both queues still carry exactly one MANDOGROGU watch row", JSON.stringify(c.queue) === '[["MANDOGROGU"],["MANDOGROGU"]]', JSON.stringify(c.queue));
    ck("raid-eligible GL requirements: watch data (R5-D4, Rotta, Teva, Zeb, Ward, Grogu & Anzellans) = planner 'glreq' units with matching relic levels (R5-D4 9, Rotta 6, rest 7); no 'hold' units remain",
      JSON.stringify(c.watchRaid.slice().sort()) === JSON.stringify(RAID_IDS.slice().sort()) && JSON.stringify(c.raidEl.slice().sort()) === JSON.stringify([["R5D4", 9], ["RACCOON", 6], ["CARSONTEVA", 7], ["RANGERZEB", 7], ["BISHOP", 7], ["GOPHERANTS", 7]].sort()) && c.hold === 0 && !c.overlapKeys.includes("hold") && c.overlapKeys.includes("glreq"), JSON.stringify([c.watchRaid, c.raidEl, c.overlapKeys]));
    ck("exact-name resolution: wrong name under an id is rejected; ids resolve by exact name only; 'Boba Fett' never stands in for 'Boba Fett, Scion of Jango'; baseline entries without names still resolve by id", c.exact.wrongNameUnderId && c.exact.beskarById && c.exact.scionNotBoba && c.exact.rottaByName && c.exact.noNameBaseline && c.exact.map === false, JSON.stringify(c.exact));
    ck("no page errors (pure)", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ---- 2. per-account live status from the 12 Oct pulls ---- */
  for (const acct of ["ollie", "tiny"]) {
    const ai = acct === "ollie" ? 4 : 5;
    const { ctx, p, errs } = await L.open(b, { tag: "gl-" + acct });
    await openGl(p, acct);
    const d = await p.evaluate(() => {
      const row = document.querySelector('#glTables [data-card="glq"] .glq-row[data-glq="MANDOGROGU"]');
      const sets = [...row.querySelectorAll(".mgl-set")].map(s => ({ n: s.dataset.mglSet, head: s.querySelector(".mgl-sethead").textContent.trim(), src: s.querySelector(".mgl-setsrc").textContent.trim(), lis: [...s.querySelectorAll("li")].map(li => ({ id: li.dataset.mglId, txt: li.textContent.replace(/\s+/g, " ").trim(), met: li.classList.contains("glq-met"), raid: !!li.querySelector(".mgl-raid") })), pending: s.classList.contains("mgl-pending"), body: s.textContent.replace(/\s+/g, " ") }));
      const rr = glqRows(current).find(r => r.kind === "watch");
      return { sets, ready: row.querySelector(".glq-ready").textContent.trim(), summary: row.querySelector("summary").textContent.trim(), chip: row.querySelector(".chip").textContent.trim(),
        rows: rr.rows.map(x => ({ id: x.id, cur: mglCur(x.u), done: x.done, owned: !!x.u })), doneCount: rr.doneCount, total: rr.total, tiers: rr.tiers, avg: rr.avg, live: rr.live, open: row.querySelector("details").open,
        watchtxt: row.querySelector(".glq-watchreqs").textContent.replace(/\s+/g, " ") };
    });
    ck(`[${acct}] 4 set blocks: sets 1–3 with 4 units each, set 4 a dashed 'Coming Soon' block with no units`, d.sets.length === 4 && d.sets.slice(0, 3).every(s => s.lis.length === 4 && !s.pending) && d.sets[3].pending && d.sets[3].lis.length === 0 && /Set 4 of 4 — not announced/.test(d.sets[3].head) && /Coming Soon/.test(d.sets[3].body), JSON.stringify(d.sets.map(s => [s.n, s.lis.length, s.pending])));
    ck(`[${acct}] set headings carry quest title + publish date + a source line`, /Set 1 of 4 — “Companion” · published by 22 Jul 2026/.test(d.sets[0].head) && /Set 2 of 4 — “Hunted” · published 19 Aug 2026/.test(d.sets[1].head) && /Set 3 of 4 — “Caretaker” · published 16 Sep 2026/.test(d.sets[2].head) && /swgoh\.gg/.test(d.sets[0].src) && /Update 8-19-2026/.test(d.sets[1].src) && /EA Update 9-16/.test(d.sets[2].src), d.sets.map(s => s.head + " | " + s.src).join(" // "));
    const bad = [];
    EXP.forEach(([id, name, need, set, o, t]) => {
      const x = acct === "ollie" ? o : t, li = d.sets.flatMap(s => s.lis).find(l => l.id === id), s = d.sets.find(s => s.lis.some(l => l.id === id));
      const want = `${name}: ${curOf(x)} → R${need}`;
      if (!li || !li.txt.includes(want) || !li.txt.endsWith(gapOf(x, need)) || s.n !== String(set) || li.raid !== RAID_IDS.includes(id) || li.met) bad.push([id, li && li.txt, want, gapOf(x, need)]);
    });
    ck(`[${acct}] all 12 units: owned? ★ G/R → required relic, plus the computed gap, match the 12 Oct pull; the 6 raid units carry a 'raid unit' marker`, bad.length === 0, JSON.stringify(bad).slice(0, 600));
    ck(`[${acct}] owned 10 of 12 (Rotta the Hutt and Boba Fett, Scion of Jango NOT owned); only Jedi Knight Luke R7 and The Mandalorian (Beskar Armor) R7 have relics`,
      d.rows.filter(r => r.owned).length === 10 && d.rows.filter(r => !r.owned).map(r => r.id).join() === "RACCOON,BOBAFETTSCION" && EXP.filter(e => (acct === "ollie" ? e[4] : e[5]) && (acct === "ollie" ? e[4] : e[5])[2] > 0).map(e => e[0]).join() === "JEDIKNIGHTLUKE,THEMANDALORIANBESKARARMOR", JSON.stringify(d.rows));
    const treeTiers = EXP.reduce((n, e) => n + Math.max(0, e[2] - ((acct === "ollie" ? e[4] : e[5]) ? (acct === "ollie" ? e[4] : e[5])[2] : 0)), 0);
    ck(`[${acct}] 0/12 met, ≈${treeTiers} relic tiers left, summary line says 'published requirements … (sets 1–3 of 4; set 4 not announced)'`, d.doneCount === 0 && d.total === 12 && d.tiers === treeTiers && /^0\/12 published requirements met \(sets 1–3 of 4; set 4 not announced\)/.test(d.ready) && new RegExp(`≈${treeTiers} relic tiers left`).test(d.ready) && d.live === true, d.ready);
    ck(`[${acct}] Watch chip + summary: 'Watch — unreleased', 'Why · switch rule · the 12 requirements'; re-check date line shown ('re-checked 12 Oct 2026', order as of 3 Oct 2026)`, /Watch — unreleased/.test(d.chip) && /the 12 requirements/.test(d.summary) && /Watch entry re-checked (12 Oct 2026|Oct 12, 2026)/.test(d.watchtxt) && /as of (3 Oct 2026|Oct 3, 2026)/.test(d.watchtxt), d.chip + " | " + d.summary);
    const cross = await p.evaluate(([acct, ids]) => { const reqs = state.pulls[acct].reqs; return ids.map(([id, name]) => { const byId = reqs[id], byName = Object.values(reqs).filter(u => u.name === name); return [id, name, byId ? byId.name : null, byName.length]; }); }, [acct, EXP.map(e => [e[0], e[1]])]);
    const crossBad = cross.filter(([id, name, idName, nByName]) => idName !== null && idName !== name || (idName === null && nByName !== 0));
    ck(`[${acct}] ids cross-checked against the pull by EXACT name: every owned id carries the exact in-game name; the two unowned names appear nowhere in the roster`, crossBad.length === 0 && cross.filter(c => c[2] === null).map(c => c[0]).join() === "RACCOON,BOBAFETTSCION", JSON.stringify(crossBad));
    ck(`[${acct}] no page errors`, errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ---- 3. other surfaces + baseline (no pull) ---- */
  {
    const { ctx, p, errs } = await L.open(b, { tag: "nopull", pulls: false });
    await openGl(p, "ollie");
    const d = await p.evaluate(() => { const row = document.querySelector('#glTables [data-card="glq"] .glq-row[data-glq="MANDOGROGU"]'); return { lis: row.querySelectorAll(".mgl-set li").length, ready: row.querySelector(".glq-ready").textContent, sets: row.querySelectorAll(".mgl-set").length }; });
    ck("without a live pull the watch still renders all 12 requirements + set 4, (baseline roster), no throw", d.lis === 12 && d.sets === 4 && /^0\/12 published requirements met/.test(d.ready), JSON.stringify(d));
    ck("no page errors (baseline)", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }
  {
    const { ctx, p, errs } = await L.open(b, { tag: "text" });
    const t = await p.evaluate(() => ({ ollie: GL_QUEUE.ollie.queue.find(e => e.watchId).why + " || " + GL_QUEUE.ollie.queue.find(e => e.watchId).trigger, tiny: GL_QUEUE.tiny.queue.find(e => e.watchId).why + " || " + GL_QUEUE.tiny.queue.find(e => e.watchId).trigger,
      ship: [SHP_WHY.ga, SHP_WHY.scion, SHP_WHY.mgFlag, SHP_WHY.rottaWhen, SHP_WHY.tinyRotta].join(" || "), nxt: JSON.stringify(NXT_QUEUE.tiny.queue.find(e => e.id === "grogu-ants").why) }));
    ck("queue 'why' texts: 12 requirements / sets 1–3 of 4, 10 of 12 owned on the 12 Oct pull, no leftover '4 requirements announced'", /sets 1–3 of its 4/.test(t.ollie) && /own 10 of the 12/.test(t.ollie) && /sets 1–3 of 4/.test(t.tiny) && /10 of the 12/.test(t.tiny) && !/4 requirements announced/.test(t.tiny + t.ollie) && !/the one announced requirement/.test(t.ollie), t.ollie.slice(0, 200));
    ck("shipment guide notes: 'published' (set 3 of 4), no 'only 4 requirements are public'; mgFlag says no release date / no kit and that '3 of 4' means set 3 of 4 sets; Rotta/R5-D4/Teva/Zeb/Ward conflict flagged", /Published requirement \(R7, set 3 of 4, 16 Sep\)/.test(t.ship) && /Published requirement \(R9, set 3 of 4, 16 Sep\)/.test(t.ship) && !/only 4 requirements/.test(t.ship) && /no release date and no kit reveal/.test(t.ship) && /set 3 of 4 sets/.test(t.ship) && /published Mandalorian & Grogu requirements/.test(t.ship), t.ship.slice(0, 300));
    ck("no page errors (text)", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ---- 4. Droid Destruction planner overlap tags ---- */
  for (const acct of ["ollie", "tiny"]) {
    const { ctx, p, errs } = await L.open(b, { tag: "drr-" + acct });
    await planner(p, acct);
    const d = await p.evaluate(() => {
      const c = document.querySelector('[data-card="drr-matrix"]'); const rows = [...c.querySelectorAll(".drr-row")];
      const tagOf = id => { const r = rows.find(r => r.dataset.drrId === id); const ch = r && r.querySelector(".drr-tags .chip.close"); return r ? { chip: ch ? ch.textContent.trim() : null, title: ch ? ch.title : null, why: r.querySelector(".drr-why").textContent } : null; };
      const sqC = document.querySelector('[data-card="drr-squads"] [data-drr-squad="C"]');
      return { txt: c.textContent, mnote: c.querySelector(".mnote").textContent, ids: ["R5D4", "RACCOON", "CARSONTEVA", "RANGERZEB", "BISHOP", "GOPHERANTS"].map(id => [id, tagOf(id)]), closeChips: c.querySelectorAll(".drr-tags .chip.close").length, raidChips: c.querySelectorAll(".drr-tags .chip.watch").length,
        sqC: sqC ? sqC.querySelector(".srcline").textContent : null, hold: /Hold — GL\?/.test(document.body.textContent), eligible: DROID_RAID.ELIGIBLE.length, priority: JSON.stringify(DROID_RAID.PRIORITY), tiers: JSON.stringify(DROID_RAID.TIERS.map(t => [t.t, t.req, t.pts])) };
    });
    const want = { R5D4: 9, RACCOON: 6, CARSONTEVA: 7, RANGERZEB: 7, BISHOP: 7, GOPHERANTS: 7 };
    const badTags = d.ids.filter(([id, t]) => !t || t.chip !== `GL req R${want[id]}` || t.title !== `GL requirement (R${want[id]}, published) + raid-eligible` || !/published M&G GL requirement R/.test(t.why));
    ck(`[${acct}] planner: the six units carry 'GL req R9/R6/R7…' with the full title 'GL requirement (R…, published) + raid-eligible'; Ward no longer raid-only`, badTags.length === 0 && d.closeChips === 6 && d.raidChips === 12, JSON.stringify(badTags) + ` close=${d.closeChips} raid=${d.raidChips}`);
    ck(`[${acct}] planner legend explains GL req (published, sets 1–3 of 4, kit/date unknown, dual-use but not before boxes are known); old 'Hold — GL?' wording gone`, /GL req R/.test(d.mnote) && /published/.test(d.mnote) && /sets 1–3 of 4/.test(d.mnote) && /kit and release date unknown/.test(d.mnote) && /not before the raid's boxes are known/.test(d.mnote) && !d.hold && !/must-build/.test(d.mnote) && !/requirements post/.test(d.txt), d.mnote.slice(0, 400));
    ck(`[${acct}] squad C note: all five published GL requirements; dual-use but not before the raid's boxes are known; kit/date unknown`, d.sqC && /published Mandalorian & Grogu GL requirements/.test(d.sqC) && /R5-D4 R9/.test(d.sqC) && /dual-use for the GL/.test(d.sqC) && /not before the raid's boxes are known/.test(d.sqC) && /kit and release date are unknown/.test(d.sqC), d.sqC);
    ck(`[${acct}] tier maths and priorities untouched (33 eligible; tier table + wave-day priorities unchanged)`, d.eligible === 33 && d.priority.includes('"R5D4","BISHOP","GOPHERANTS"') && d.tiers === JSON.stringify([[0, "4★ floor", 300000], [1, "Gear XII", 450000], [2, "Relic 2", 600000], [3, "Relic 4", 900000], [4, "Relic 6", 1200000], [5, "Relic 8", 1800000], [6, "Relic 9", 2700000], [7, "Relic 10", 3600000]]), d.tiers);
    ck(`[${acct}] no page errors (planner)`, errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ---- 5. layout: 390 / 1280, shots ---- */
  for (const w of [1280, 390]) {
    const { ctx, p, errs } = await L.open(b, { tag: "lay" + w, width: w, height: w === 390 ? 900 : 1000 });
    for (const acct of ["ollie", "tiny"]) {
      await openGl(p, acct);
      const o = await L.overflow(p);
      const row = await p.evaluate(() => { const r = document.querySelector('#glTables [data-card="glq"] .glq-row[data-glq="MANDOGROGU"]'); const b = r.getBoundingClientRect(); return { fits: r.scrollWidth <= r.clientWidth + 1, right: b.right, vw: innerWidth, wide: [...r.querySelectorAll("li,.mgl-set,.mgl-sethead")].filter(e => e.scrollWidth > e.clientWidth + 1).length }; });
      ck(`[${w}px ${acct}] GL order card: no horizontal overflow (doc ${o.doc} ≤ ${o.inner}); the watch row fits`, o.doc <= o.inner && row.fits && row.right <= row.vw + 1 && row.wide === 0, JSON.stringify([o, row]));
      await p.evaluate(() => document.querySelector('#glTables [data-card="glq"] .glq-row[data-glq="MANDOGROGU"]').scrollIntoView({ block: "start" })); await p.waitForTimeout(150);
      await p.screenshot({ path: `${L.ROOT}/shots/mgl-glq-${acct}-${w}.png`, fullPage: false });
      await planner(p, acct);
      const o2 = await L.overflow(p);
      const m = await p.evaluate(() => { const c = document.querySelector('[data-card="drr-matrix"]'); return { fits: c.scrollWidth <= c.clientWidth + 1, tagsFit: [...c.querySelectorAll(".drr-tags")].every(t => t.scrollWidth <= t.clientWidth + 1) }; });
      ck(`[${w}px ${acct}] planner matrix + squads: no horizontal overflow (doc ${o2.doc} ≤ ${o2.inner})`, o2.doc <= o2.inner && m.fits && m.tagsFit, JSON.stringify([o2, m]));
      await p.evaluate(() => { const r = [...document.querySelectorAll('[data-card="drr-matrix"] .drr-row')].find(r => r.dataset.drrId === "R5D4"); r.scrollIntoView({ block: "center" }); }); await p.waitForTimeout(150);
      await p.screenshot({ path: `${L.ROOT}/shots/mgl-drr-${acct}-${w}.png`, fullPage: false });
    }
    ck(`[${w}px] no page errors`, errs.length === 0, errs.join(" | "));
    await ctx.close();
  }
  await L.finish(b, srv);
})();
