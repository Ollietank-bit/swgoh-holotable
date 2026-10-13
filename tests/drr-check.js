/* drr: Droid Destruction raid planner (Game modes › Raids › "Droid Destruction (planner)"). Boots the real saved state + the
   12 Oct 2026 roster snapshot (SNAP_DATE defaults to 2026-10-12 here) in an Australia/Sydney context with Playwright's
   context.clock pinned. Covers: the DROID_RAID module (33 eligible, exact-name id resolution, tiers, boxes, waves), the
   readiness matrix counts vs ROSTER.md, derived tiers, squad pre-fill legality, min/mean scoring, the Fable box-ladder
   table, picker edits persisting across reload without leaking between accounts, auto-fill/reset, model toggle (device-
   local), slider + scenarios, wave highlight on 12 Oct / 17 Oct / 9 Nov, featured-unit slots + ticks, confidence pills,
   the SNAPSHOTS entry (23 entries now), Next-up tile + Coach tip, escaping, 390/1280 overflow, zero page errors,
   layout-editor hide/show + packing, the three-way merge on state.drr, and a pre-drr save loading unchanged. */
process.env.SNAP_DATE = process.env.SNAP_DATE || "2026-10-12";
const L = require("./lib.js");
const ck = L.ck;
async function openAt(b, o) {
  o = o || {};
  const ctx = await b.newContext({ viewport: { width: o.width || 1280, height: o.height || 1000 }, timezoneId: "Australia/Sydney", locale: "en-AU" });
  await ctx.clock.install({ time: new Date((o.day || "2026-10-12") + "T" + (o.time || "08:05:00") + "+11:00") });
  await ctx.addInitScript(([s, pl, seedKey]) => { try { if (!sessionStorage.getItem(seedKey)) { localStorage.clear(); localStorage.setItem("swgoh-tracker", s); localStorage.setItem("swgoh-holotable-pulls-v1", pl); sessionStorage.setItem(seedKey, "1"); } } catch (e) {} },
    [o.state || L.REAL, L.PULLS, "seeded-" + (o.tag || "x")]);
  await ctx.route(/fonts\.g|swgoh\.gg|corsproxy|allorigins|codetabs|api\.github/, r => r.abort());
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push(String(e).slice(0, 300)));
  p.on("console", m => { if (m.type() === "error" && !/Failed to load resource|net::ERR|fonts\.g/.test(m.text())) errs.push("console: " + m.text().slice(0, 200)); });
  await p.goto(`http://127.0.0.1:${L.PORT}/x.html`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(900);
  return { ctx, p, errs };
}
/* a <select> change without Playwright's actionability wait (the masonry ResizeObserver can keep a card "unstable" for a while) */
const pick = async (p, sel, v) => { const ok = await p.evaluate(([s, v]) => { const e = document.querySelector(s); if (!e || ![...e.options].some(o => o.value === v)) return false; e.value = v; e.dispatchEvent(new Event("change", { bubbles: true })); return true; }, [sel, v]); if (!ok) throw new Error("pick: no option " + v + " in " + sel); await p.waitForTimeout(250); };
const planner = async (p, acct) => { await p.evaluate(a => { switchAcct(a); state.modesnav.category = "raid"; state.modesnav.raidView = "droid"; switchTab("modes"); }, acct); await p.waitForTimeout(350); };
const packCheck = (p, pane) => p.evaluate(pn => {
  const cont = document.querySelector(`.tabpane.active .sortable[data-pane="${pn}"]`);
  if (!cont || !cont.getClientRects().length) return null;
  const gap = parseFloat(getComputedStyle(cont).columnGap) || 0, cr = cont.getBoundingClientRect();
  const colW = (cr.width - 11 * gap) / 12;
  const px = (el, k) => parseFloat(getComputedStyle(el)[k]) || 0;
  const items = [...cont.children].filter(el => el.getClientRects().length).map(el => {
    const r = el.getBoundingClientRect();
    const c0 = Math.round((r.left - cr.left) / (colW + gap)), c1 = Math.round((r.right - cr.left + gap) / (colW + gap));
    let cb = r.top + px(el, "borderTopWidth") + px(el, "paddingTop");
    [...el.children].forEach(ch => { const s = getComputedStyle(ch); if (s.position === "absolute" || s.position === "fixed" || !ch.getClientRects().length) return; cb = Math.max(cb, ch.getBoundingClientRect().bottom + (parseFloat(s.marginBottom) || 0)); });
    return { id: el.dataset.card || el.className.slice(0, 20), top: r.top, bottom: r.bottom, c0, c1, blank: r.bottom - px(el, "paddingBottom") - px(el, "borderBottomWidth") - cb, minH: el.style.minHeight };
  });
  const holes = []; let emptyCols = 0;
  for (let c = 0; c < 12; c++) {
    const col = items.filter(it => it.c0 <= c && it.c1 > c).sort((a, b) => a.top - b.top);
    if (!col.length) { emptyCols++; continue; }
    if (col[0].top - cr.top > 1.5) holes.push({ c, top: col[0].id, d: Math.round(col[0].top - cr.top) });
    for (let i = 1; i < col.length; i++) { const d = col[i].top - col[i - 1].bottom; if (d > gap + 2.5 || d < gap - 0.5) holes.push({ c, above: col[i - 1].id, below: col[i].id, d: Math.round(d * 10) / 10 }); }
  }
  const seen = new Set(), uniq = holes.filter(h => { const k = (h.above || "") + ">" + (h.below || h.top); if (seen.has(k)) return false; seen.add(k); return true; });
  return { gap, n: items.length, emptyCols, holes: uniq, blank: items.filter(it => it.blank > 3 && !it.minH).map(it => [it.id, Math.round(it.blank)]), mas: cont.classList.contains("lay-mas"), spans: [...cont.children].map(el => el.style.gridRowEnd) };
}, pane);
(async () => {
  const srv = await L.serve(); const b = await L.chromium.launch({ headless: true });

  /* ---------- probe: pristine base build gets only the generic checks ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "probe" });
    const has = await p.evaluate(() => typeof DROID_RAID === "object" && typeof drrPlan === "function" && !!document.getElementById("drrGrid"));
    if (!has) {
      for (const w of [1280, 390]) { await p.setViewportSize({ width: w, height: 900 }); for (const a of ["ollie", "tiny"]) { await L.go(p, a, "modes"); const o = await L.overflow(p); ck(`[base, ${w}] ${a}/modes: no horizontal overflow`, o.doc <= o.inner + 1, JSON.stringify(o)); } }
      ck("[base] no page errors", errs.length === 0, JSON.stringify(errs.slice(0, 5)));
      ck("this build has no Droid Destruction planner — feature checks skipped", true, "");
      await ctx.close(); await L.finish(b, srv); return;
    }
    await ctx.close();
  }

  /* ---------- 1. module + readiness maths (12 Oct 2026, 1280) ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "mod" });
    const tz = await p.evaluate(() => ({ now: new Date(drrNow()).toString(), off: new Date().getTimezoneOffset() }));
    ck("clock pinned to Mon 12 Oct 2026 08:05 AEDT via context.clock", /Mon Oct 12 2026 08:05/.test(tz.now) && tz.off === -660, JSON.stringify(tz));
    const m = await p.evaluate(() => {
      const D = DROID_RAID, names = D.ELIGIBLE.map(e => e.name);
      const res = {};
      for (const a of ["ollie", "tiny"]) {
        const reqs = state.pulls[a].reqs;
        const owned = D.ELIGIBLE.filter(e => e.id && reqs[e.id]);
        res[a] = { owned: owned.length, exact: owned.every(e => reqs[e.id].name === e.name), unresolved: D.ELIGIBLE.filter(e => !e.id || !reqs[e.id]).map(e => e.name),
          counts: drrCounts(a), nameMismatch: owned.filter(e => reqs[e.id].name !== e.name).map(e => [e.id, reqs[e.id].name, e.name]),
          b1: reqs.B1BATTLEDROIDV2 ? reqs.B1BATTLEDROIDV2.name : null };
      }
      return { n: names.length, uniq: new Set(names).size, ids: D.ELIGIBLE.filter(e => e.id).length, nullIds: D.ELIGIBLE.filter(e => !e.id).map(e => e.name),
        unconf: D.ELIGIBLE.filter(e => e.unconfirmed).map(e => e.name), large: D.ELIGIBLE.filter(e => e.large).map(e => e.name),
        tiers: D.TIERS.map(t => [t.t, t.req, t.pts]), boxes: D.BOXES, waves: D.WAVES.map(w => [w.n, w.start, w.end]), attempts: D.ATTEMPTS, model: D.SCORING_MODEL, models: Object.keys(D.SCORING_MODELS),
        floor: D.T0_FLOOR, squads: D.SQUADS.map(s => [s.key, s.units.length, (s.guess || []).length]), res, entry: DRR_RAID_ENTRY, b1Eligible: D.ELIGIBLE.find(e => e.name === "B1 Battle Droid").id };
    });
    ck("ELIGIBLE: 33 entries, unique names, in CG's order (4-LOM first, Adelphi Ranger last)", m.n === 33 && m.uniq === 33, String(m.n));
    ck("30 entries carry an id; the GL and the two 'coming soon' marquees (B1, Adelphi) are id null = unowned / unknown id", m.ids === 30 && JSON.stringify(m.nullIds) === JSON.stringify(["The Mandalorian and Grogu", "B1 Battle Droid", "Adelphi Ranger"]), JSON.stringify(m.nullIds));
    ck("the roster's 7★ 'B1 Battle Droid' (B1BATTLEDROIDV2) is NOT matched to the coming marquee; B1 + Adelphi flagged unconfirmed", m.b1Eligible === null && m.res.ollie.b1 === "B1 Battle Droid" && JSON.stringify(m.unconf) === JSON.stringify(["B1 Battle Droid", "Adelphi Ranger"]), JSON.stringify([m.b1Eligible, m.res.ollie.b1, m.unconf]));
    ck("Rotta the Hutt is the only LARGE unit", JSON.stringify(m.large) === JSON.stringify(["Rotta the Hutt"]), JSON.stringify(m.large));
    for (const a of ["ollie", "tiny"]) {
      ck(`${a}: 26 owned eligible units, every id resolves to the EXACT in-game name (no fuzzy matches)`, m.res[a].owned === 26 && m.res[a].exact, JSON.stringify(m.res[a].nameMismatch));
      ck(`${a}: the 7 unowned are Maul (HF), Cassian (Undercover), Rotta, Darth Jar Jar, the GL, B1, Adelphi`, JSON.stringify(m.res[a].unresolved) === JSON.stringify(["Maul (Hate-Fueled)", "Cassian Andor (Undercover)", "Rotta the Hutt", "Darth Jar Jar", "The Mandalorian and Grogu", "B1 Battle Droid", "Adelphi Ranger"]), JSON.stringify(m.res[a].unresolved));
    }
    const co = m.res.ollie.counts, ct = m.res.tiny.counts;
    ck("ROSTER.md counters — ollie: ≥4★ 11, G12 4, R2+ 0 of 26", co.owned === 26 && co.floor === 11 && co.g12 === 4 && co.r2 === 0, JSON.stringify([co.owned, co.floor, co.g12, co.r2]));
    ck("ROSTER.md counters — tiny: ≥4★ 12, G12 3, R2+ 0 of 26", ct.owned === 26 && ct.floor === 12 && ct.g12 === 3 && ct.r2 === 0, JSON.stringify([ct.owned, ct.floor, ct.g12, ct.r2]));
    ck("TIERS: 8 tiers T0–T7 at 300k/450k/600k/900k/1.2M/1.8M/2.7M/3.6M, T0 req names the 4★ floor", m.tiers.length === 8 && JSON.stringify(m.tiers.map(t => t[2])) === JSON.stringify([300000, 450000, 600000, 900000, 1200000, 1800000, 2700000, 3600000]) && /4★/.test(m.tiers[0][1]) && m.tiers[1][1] === "Gear XII" && m.tiers[7][1] === "Relic 10", JSON.stringify(m.tiers));
    ck("BOXES: 17 ascending thresholds 65k … 18m", m.boxes.length === 17 && m.boxes[0] === 65000 && m.boxes[16] === 18000000 && m.boxes.every((x, i) => !i || x > m.boxes[i - 1]), JSON.stringify(m.boxes));
    ck("WAVES: 7 windows 16 Oct – 8 Nov as in EA's post", JSON.stringify(m.waves) === JSON.stringify([[1, "2026-10-16", "2026-10-18"], [2, "2026-10-20", "2026-10-22"], [3, "2026-10-23", "2026-10-25"], [4, "2026-10-27", "2026-10-29"], [5, "2026-10-30", "2026-11-01"], [6, "2026-11-03", "2026-11-05"], [7, "2026-11-06", "2026-11-08"]]), JSON.stringify(m.waves));
    ck("ATTEMPTS = 5, SCORING_MODEL = weakest-unit with per-unit as the alternative", m.attempts === 5 && m.model === "weakest-unit" && JSON.stringify(m.models) === JSON.stringify(["weakest-unit", "per-unit"]), JSON.stringify([m.attempts, m.model, m.models]));
    ck("T0 floor is ONE constant: 4★, marked UNVERIFIED, note quotes CG's 'no requirement'", m.floor.stars === 4 && m.floor.conf === "UNVERIFIED" && /no requirement/.test(m.floor.note), JSON.stringify(m.floor));
    ck("Opus squads A–E: 5,5,5,5,4 units; tag-based guesses on A (Jaxxon), B (Barriss), E (both troopers)", JSON.stringify(m.squads) === JSON.stringify([["A", 5, 1], ["B", 5, 1], ["C", 5, 0], ["D", 5, 0], ["E", 4, 2]]), JSON.stringify(m.squads));
    ck("Raid selector entry: key 'droid', labelled '(planner)', no coach squads", m.entry.key === "droid" && /planner/.test(m.entry.label) && m.entry.drr === true && m.entry.squads.length === 0, JSON.stringify(m.entry));
    /* derived tiers */
    const t = await p.evaluate(() => [[{ s: 3, g: 9, r: 0 }, -1], [{ s: 4, g: 9, r: 0 }, 0], [{ s: 7, g: 12, r: 0 }, 1], [{ s: 3, g: 12, r: 0 }, 1], [{ s: 7, g: 13, r: 1 }, 1], [{ s: 7, g: 13, r: 2 }, 2], [{ s: 7, g: 13, r: 3 }, 2], [{ s: 7, g: 13, r: 4 }, 3], [{ s: 7, g: 13, r: 6 }, 4], [{ s: 7, g: 13, r: 8 }, 5], [{ s: 7, g: 13, r: 9 }, 6], [{ s: 7, g: 13, r: 10 }, 7], [null, null], [undefined, null]]
      .map(([u, want]) => [drrTier(u), want]).filter(([got, want]) => got !== want));
    ck("drrTier(): r>=10→7, 9→6, 8→5, 6→4, 4→3, 2→2, g>=12→1, s>=4→0, else −1, not owned → null (display relic = relic_tier−2 per parsePlayer)", t.length === 0, JSON.stringify(t));
    const relicConv = await p.evaluate(() => { const u = parsePlayer({ data: {}, units: [{ data: { base_id: "X", name: "X", rarity: 7, gear_level: 13, relic_tier: 4, combat_type: 1 } }] }, null).reqs.X; return { r: u.r, tier: drrTier(u) }; });
    ck("relic convention confirmed from parsePlayer: relic_tier 4 → display R2 → T2", relicConv.r === 2 && relicConv.tier === 2, JSON.stringify(relicConv));
    const vd = await p.evaluate(() => ({ o: drrRows("ollie").find(r => r.e.id === "VADERDUELSEND").tier, t: drrRows("tiny").find(r => r.e.id === "VADERDUELSEND").tier, go: drrRows("ollie").find(r => r.e.id === "GOPHERANTS").tier, rotta: drrRows("ollie").find(r => r.e.large).tier }));
    ck("matrix rows: Vader (Duel's End) is T1 on ollie (6★ G12) and T– on tiny (3★ G11); Grogu & Anzellans T– (3★); Rotta null (not owned)", vd.o === 1 && vd.t === -1 && vd.go === -1 && vd.rotta === null, JSON.stringify(vd));
    /* squad pre-fill legality + scoring */
    for (const a of ["ollie", "tiny"]) {
      const s = await p.evaluate(acct => {
        const sq = drrSquads(acct), reqs = state.pulls[acct].reqs, all = sq.flat();
        const plan = drrPlan(acct, "weakest-unit"), per = drrPlan(acct, "per-unit");
        return { lens: sq.map(l => l.length), uniq: new Set(all).size === all.length, owned: all.every(id => !!reqs[id]), large: sq.every(l => l.filter(id => (drrById(id) || {}).large).length <= 1),
          bench: drrRows(acct).filter(r => r.owned && !all.includes(r.e.id)).map(r => r.e.id), min: { tiers: plan.squads.map(s => s.tier), total: plan.total, boxes: plan.boxes }, mean: { tiers: per.squads.map(s => s.tier), total: per.total, boxes: per.boxes } };
      }, a);
      ck(`${a}: pre-fill = Opus squads, 5/5/5/5/4 units, each unit once, only owned units, ≤1 large; bench = Yoda & Chewie + Mara Jade`, JSON.stringify(s.lens) === "[5,5,5,5,4]" && s.uniq && s.owned && s.large && JSON.stringify(s.bench.sort()) === JSON.stringify(["MARAJADESKYWALKER", "YODACHEWBACCA"]), JSON.stringify(s));
      if (a === "ollie") {
        ck("ollie weakest-unit: B is T0 (Barriss 5★ G10), A/C/D/E blocked by 3★ units → 300k, 4 boxes, next 340k (40k short)", JSON.stringify(s.min.tiers) === "[-1,0,-1,-1,-1]" && s.min.total === 300000 && s.min.boxes.reached === 4 && s.min.boxes.next === 340000 && s.min.boxes.gap === 40000, JSON.stringify(s.min));
        ck("ollie per-unit mean (hypothetical): A 0, B floor(4/5)=0, C 0, D 0, E none → 1.2M, 7 boxes", JSON.stringify(s.mean.tiers) === "[0,0,0,0,-1]" && s.mean.total === 1200000 && s.mean.boxes.reached === 7, JSON.stringify(s.mean));
      } else {
        ck("tiny weakest-unit: every pre-filled squad has a 3★ unit → 0 points, 0 boxes, next 65k", JSON.stringify(s.min.tiers) === "[-1,-1,-1,-1,-1]" && s.min.total === 0 && s.min.boxes.reached === 0 && s.min.boxes.next === 65000, JSON.stringify(s.min));
        ck("tiny per-unit mean: A 0, B 1 (three G12), C 0, D 0, E none → 1.35M, 7 boxes", JSON.stringify(s.mean.tiers) === "[0,1,0,0,-1]" && s.mean.total === 1350000 && s.mean.boxes.reached === 7, JSON.stringify(s.mean));
      }
    }
    /* box ladder maths for every row of the Fable §2a table */
    const ladder = await p.evaluate(() => [[[[0, 3]], 900000, 6], [[[0, 5]], 1500000, 7], [[[0, 3], [1, 2]], 1800000, 8], [[[1, 5]], 2250000, 9], [[[2, 5]], 3000000, 10], [[[3, 5]], 4500000, 11], [[[4, 5]], 6000000, 12], [[[4, 4], [5, 1]], 6600000, 13], [[[5, 5]], 9000000, 14], [[[5, 4], [6, 1]], 9900000, 15], [[[7, 3], [5, 2]], 14400000, 16], [[[7, 5]], 18000000, 17]]
      .map(([mix, total, boxes]) => { const t = drrMixTotal(mix), bx = drrBoxes(t); return { mix: JSON.stringify(mix), t, total, got: bx.reached, boxes, ok: t === total && bx.reached === boxes }; }));
    ck("box ladder: all 12 Fable rows (3×T0=900k→6 … 5×T7=18M→17) compute exactly", ladder.every(r => r.ok), JSON.stringify(ladder.filter(r => !r.ok)));
    const bx = await p.evaluate(() => [drrBoxes(0), drrBoxes(64999), drrBoxes(65000), drrBoxes(18000000), drrBoxes(99e6)]);
    ck("drrBoxes edges: 0 → 0 boxes next 65k; 64,999 → 0; 65,000 → 1; 18M → 17, no next box", bx[0].reached === 0 && bx[0].next === 65000 && bx[1].reached === 0 && bx[2].reached === 1 && bx[3].reached === 17 && bx[3].next === null && bx[4].reached === 17, JSON.stringify(bx));
    /* "to reach" lines vs the Opus cost table */
    const needs = await p.evaluate(() => {
      const f = (a, i) => { const n = drrNeeds(drrSquads(a)[i], state.pulls[a].reqs); return [n.t0.shards, n.t1.gear, n.t2.shards, n.t2.gear, n.t2.relics]; };
      return { oA: f("ollie", 0), oB: f("ollie", 1), oC: f("ollie", 2), oD: f("ollie", 3), oE: f("ollie", 4), tA: f("tiny", 0), tB: f("tiny", 1), tC: f("tiny", 2), tD: f("tiny", 3), tE: f("tiny", 4) };
    });
    const want = { oA: [90, 21, 1190, 26, 10], oB: [0, 2, 970, 7, 10], oC: [90, 15, 1275, 20, 10], oD: [120, 8, 1120, 13, 10], oE: [120, 12, 1120, 16, 8], tA: [90, 21, 1040, 26, 10], tB: [60, 3, 1310, 8, 10], tC: [60, 16, 1160, 21, 10], tD: [60, 8, 1060, 13, 10], tE: [120, 12, 1120, 16, 8] };
    ck("computed T0 shards / T1 gear levels / T2 shards-gear-relics match the Opus table for all 10 account×squad rows", JSON.stringify(needs) === JSON.stringify(want), JSON.stringify(needs));
    /* three-way merge on state.drr (generic rule — a squad list is one fact, edited as a whole) */
    const mg = await p.evaluate(() => {
      const base = { waves: {}, ollie: { squads: {} }, tiny: { squads: {} } };
      const local = { waves: {}, ollie: { squads: { 1: ["MAJORPARTAGAZ", "DEDRAMEERO"] } }, tiny: { squads: {} } };
      const remote = { waves: { 1: { e: "KLEYA" } }, ollie: { squads: {} }, tiny: { squads: { 0: ["IG90"] } } };
      const out = threeWayValue(base, local, remote, "drr", { remoteNewer: true, collisions: [] });
      const both = threeWayValue(base, { waves: {}, ollie: { squads: { 1: ["A"] } }, tiny: { squads: {} } }, { waves: {}, ollie: { squads: { 1: ["B"] } }, tiny: { squads: {} } }, "drr", { remoteNewer: true, collisions: [] });
      return { out, both, rule: mergeRuleFor("drr.ollie.squads.1") };
    });
    ck("merge: local squad edit, remote wave slot + tiny squad edit → all three kept (generic three-way rule, no MERGE_RULES entry needed)", JSON.stringify(mg.out) === JSON.stringify({ waves: { 1: { e: "KLEYA" } }, ollie: { squads: { 1: ["MAJORPARTAGAZ", "DEDRAMEERO"] } }, tiny: { squads: { 0: ["IG90"] } } }) && mg.rule === "", JSON.stringify(mg));
    ck("merge: the SAME squad edited on both devices resolves to one list (never a union past 5 units)", Array.isArray(mg.both.ollie.squads[1]) && mg.both.ollie.squads[1].length === 1, JSON.stringify(mg.both));
    const shape = await p.evaluate(() => { const s = { drr: { waves: { 1: { e: "KLEYA", c: 5 } }, ollie: { squads: { 0: ["IG90", 7, null] } }, tiny: "junk" } }; hardSanitizeState(s); return s.drr; });
    ck("hardSanitizeState: wave slots keep strings only, squads keep string ids only, a non-object account branch is dropped", JSON.stringify(shape) === JSON.stringify({ waves: { 1: { e: "KLEYA" } }, ollie: { squads: { 0: ["IG90"] } } }), JSON.stringify(shape));
    ck("[module] no page errors", errs.length === 0, JSON.stringify(errs.slice(0, 5)));
    await ctx.close();
  }

  /* ---------- 2. UI: navigation, matrix, picker, persistence, model, slider, waves, pills, layout (12 Oct, 1280) ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "ui" });
    await L.go(p, "ollie", "modes");
    const nav0 = await p.evaluate(() => ({ opt: [...document.querySelectorAll("#raidNav select option")].map(o => o.value), grid: document.getElementById("drrGrid").style.display, body: document.getElementById("raidBody").children.length }));
    ck("Raid selector lists the planner after the five coach raids; the grid is hidden on the Order 66 view", nav0.opt[nav0.opt.length - 1] === "droid" && nav0.opt.length === 6 && nav0.grid === "none" && nav0.body === 1, JSON.stringify(nav0));
    await p.click("#raidNav .mobile-mode-buttons button:has-text('Droid Destruction')"); await p.waitForTimeout(300);
    const nav1 = await p.evaluate(() => ({ view: state.modesnav.raidView, grid: document.getElementById("drrGrid").style.display, cards: [...document.querySelectorAll("#drrGrid > .card[data-card]")].map(e => e.dataset.card), body: document.getElementById("raidBody").innerHTML, detail: document.getElementById("raidDetailNav").style.display, crumb: document.getElementById("modesCrumb").textContent.replace(/\s+/g, " ").trim() }));
    ck("selecting it shows the planner: 5 cards in priority order, coach card gone, account nav hidden, crumb 'Raids › Droid Destruction (planner)'", nav1.view === "droid" && nav1.grid === "" && JSON.stringify(nav1.cards) === JSON.stringify(["drr-status", "drr-squads", "drr-matrix", "drr-waves", "drr-calc"]) && nav1.body === "" && nav1.detail === "none" && /^Raids\s*›\s*Droid Destruction \(planner\)$/.test(nav1.crumb), JSON.stringify(nav1));
    /* honesty strip */
    const pills = await p.evaluate(() => { const c = document.querySelector('[data-card="drr-status"]'); return { confs: [...c.querySelectorAll(".drr-conf .chip")].map(e => e.textContent.trim()), n: c.querySelectorAll(".drr-pill").length, txt: c.textContent, chip: (c.querySelector(".cardtitle .chip") || {}).textContent || "" }; });
    ck("confidence pill strip: CONFIRMED / UNVERIFIED / UNKNOWN rows with their items; 'guess'/'meta' never claimed", pills.confs.length === 3 && /confirmed/.test(pills.confs[0]) && /unverified/.test(pills.confs[1]) && /unknown/.test(pills.confs[2]) && pills.n === 13 && /5 attempts/.test(pills.txt) && /weakest-unit scoring/.test(pills.txt) && /bosses \/ phases/.test(pills.txt) && /box contents/.test(pills.txt), JSON.stringify(pills.confs));
    ck("status card says 'last re-checked 12 Oct 2026 — re-check 26 Oct 2026, or the day CG's next update posts' and carries the droid-raid snapshot chip (fresh)", /last re-checked 12 Oct 2026/.test(pills.txt) && /re-check 26 Oct 2026/.test(pills.txt) && /next update/.test(pills.txt) && /fresh/.test(pills.chip), pills.chip);
    const reg = await p.evaluate(() => { const e = SNAP_BY_KEY["droid-raid"]; return { n: SNAPSHOTS.length, e, now: snapState(e, Date.now()).state, oct26: snapState(e, Date.UTC(2026, 9, 26, 12)).state, nov9: snapState(e, Date.UTC(2026, 10, 9, 12)).state, hint: e.hint }; });
    ck("SNAPSHOTS registry: 23 entries incl. droid-raid (asOf 2026-10-12, half-life 14, tab modes, hint 'ask Claude to re-check the Droid Destruction posts')", reg.n === 23 && reg.e.asOf === "2026-10-12" && reg.e.halfLife === 14 && reg.e.tab === "modes" && /re-check the Droid Destruction posts/.test(reg.hint), JSON.stringify(reg.e));
    ck("the chip flips: fresh on 12 Oct → aging on 26 Oct → stale on 9 Nov (automatic)", reg.now === "fresh" && reg.oct26 === "aging" && reg.nov9 === "stale", JSON.stringify([reg.now, reg.oct26, reg.nov9]));
    /* matrix */
    const mx = await p.evaluate(() => { const c = document.querySelector('[data-card="drr-matrix"]'); const rows = [...c.querySelectorAll(".drr-row")];
      return { n: rows.length, off: rows.filter(r => r.classList.contains("drr-off")).length, counts: c.querySelector(".statuscounts").textContent.replace(/\s+/g, " "), first: rows[0].querySelector("b").textContent, unknown: rows.filter(r => /unowned \/ unknown id/.test(r.textContent)).map(r => r.querySelector("b").textContent),
        tags: { dual: c.querySelectorAll(".drr-tags .chip.done").length, raid: c.querySelectorAll(".drr-tags .chip.watch").length, hold: c.querySelectorAll(".drr-tags .chip.close").length, bench: c.querySelectorAll(".drr-tags .chip.grind").length }, pri: rows.filter(r => r.querySelector(".drr-pri")).length, sq: rows.filter(r => r.querySelector(".drr-sq")).length, overflow: c.scrollWidth <= c.clientWidth + 1 }; });
    ck("matrix: 33 rows, 7 greyed NOT OWNED, counters '≥4★ 11/26 · G12 4 · R2+ 0' with Tiny beside, Vader DE (T1) first, the GL/B1/Adelphi rows say 'unowned / unknown id'", mx.n === 33 && mx.off === 7 && /≥4★ 11\/26/.test(mx.counts) && /G12 4/.test(mx.counts) && /R2\+ 0/.test(mx.counts) && /Tiny: ≥4★ 12 · G12 3/.test(mx.counts) && mx.first === "Darth Vader (Duel's End)" && mx.unknown.length === 3 && mx.overflow, JSON.stringify(mx));
    ck("overlap tag column (mgl 12 Oct: 'Hold — GL?' became 'GL requirement (published) + raid-eligible' on 6 units, Ward moved from raid-only, Rotta added): 8 dual-use, 12 raid-only, 6 GL-requirement, 1 bench + 2 'unconfirmed' (amber); 17 Opus priority ranks + LARGE/GL markers; 24 squad letters", mx.tags.dual === 8 && mx.tags.hold === 6 && mx.tags.bench === 3 && mx.tags.raid === 12 && mx.pri === 19 && mx.sq === 24, JSON.stringify(mx.tags) + " pri=" + mx.pri + " sq=" + mx.sq);
    /* squads card + picker */
    const sq0 = await p.evaluate(() => { const c = document.querySelector('[data-card="drr-squads"]'); return { total: c.querySelector(".drr-total .val").textContent, boxes: c.querySelectorAll(".drr-total .val")[1].textContent.replace(/\s+/g, ""), next: c.querySelectorAll(".drr-total > div")[2].textContent.replace(/\s+/g, " "), guesses: c.querySelectorAll(".drr-sqhead .chip.grind").length, selects: c.querySelectorAll("select.drr-slot").length, meta: /\bmeta\b/i.test(c.querySelector(".mnote").textContent) && !/not a meta/.test(c.querySelector(".mnote").textContent),
      bOpts: [...c.querySelector('[data-drr-squad="B"] select.drr-slot').options].map(o => o.value), needs: c.querySelector('[data-drr-squad="B"] .drr-needs').textContent.replace(/\s+/g, " ") }; });
    ck("squads card: 300k · 4/17 boxes · next 340k (40k short); 3 squads carry a 'tag-based guess' chip; 25 slot pickers (24 units + 1 add slot on E); never called a meta", sq0.total === "300k" && sq0.boxes === "4/17" && /340k/.test(sq0.next) && /40k short/.test(sq0.next) && sq0.guesses === 3 && sq0.selects === 25 && !sq0.meta, JSON.stringify(sq0));
    ck("squad B's 'to reach' lines are computed: T0 ready now · T1 +2 gear levels (Inquisitor Barriss +2) · T2 970 shards / 7 gear levels / 10 relic tiers", /T0 ready now/.test(sq0.needs) && /\+2 gear levels to G12 \(Inquisitor Barriss \+2\)/.test(sq0.needs) && /970 shards to 7★ · 7 gear levels to G13 · 10 relic tiers/.test(sq0.needs), sq0.needs);
    ck("picker options exclude units already used in OTHER squads (B's leader slot offers its own unit + the 2 bench units only)", JSON.stringify(sq0.bOpts.slice().sort()) === JSON.stringify(["", "MAJORPARTAGAZ", "MARAJADESKYWALKER", "YODACHEWBACCA"]), JSON.stringify(sq0.bOpts));
    /* remove Barriss from B → B becomes T1 */
    await pick(p, '[data-drr-squad="B"] .drr-slotwrap:nth-child(5) select', "");
    const sq1 = await p.evaluate(() => ({ b: drrSquads("ollie")[1], saved: state.drr.ollie.squads, total: drrPlan("ollie").total, boxes: drrPlan("ollie").boxes, dom: document.querySelector('[data-card="drr-squads"] .drr-total .val').textContent, edited: !!document.querySelector('[data-drr-squad="B"] .drr-pill'), chip: document.querySelector('[data-drr-squad="B"] .drr-sqhead .chip').textContent,
      blob: JSON.parse(localStorage.getItem("swgoh-tracker")).drr, tiny: drrPlan("tiny").total, tinySaved: state.drr.tiny.squads }));
    ck("removing Barriss: B = 4 units at T1 → 450k, 5 boxes (next 500k); only B is saved under state.drr.ollie.squads; 'edited' tag shown", sq1.b.length === 4 && !sq1.b.includes("INQUISITORBARRISS") && sq1.total === 450000 && sq1.boxes.reached === 5 && sq1.boxes.next === 500000 && sq1.dom === "450k" && Object.keys(sq1.saved).join() === "1" && sq1.edited && /T1 · 450k pts/.test(sq1.chip), JSON.stringify(sq1.b) + " " + JSON.stringify(sq1.saved));
    ck("the edit lands in the SYNCED swgoh-tracker blob (state.drr) and does not leak to Tiny (tiny squads untouched, 0 points)", sq1.blob && sq1.blob.ollie && Array.isArray(sq1.blob.ollie.squads[1]) && sq1.blob.ollie.squads[1].length === 4 && Object.keys(sq1.tinySaved).length === 0 && sq1.tiny === 0, JSON.stringify(sq1.blob));
    /* move a unit from A into B's empty slot → each unit once */
    const addOpts = await p.evaluate(() => [...document.querySelector('[data-drr-squad="B"] .drr-slotwrap:nth-child(5) select').options].map(o => o.value));
    ck("B's new 'add a unit' slot offers only the bench + the freed Barriss, never a unit already in another squad (Zuckuss is in A)", !addOpts.includes("ZUCKUSS") && addOpts.includes("INQUISITORBARRISS") && addOpts.includes("YODACHEWBACCA") && addOpts.length === 4, JSON.stringify(addOpts));
    await p.evaluate(() => drrSetSlot("ollie", 1, 4, "ZUCKUSS")); await p.waitForTimeout(250);   /* a forced move (defence in depth: the writer also enforces each-unit-once) */
    const sq2 = await p.evaluate(() => { const s = drrSquads("ollie"); const all = s.flat(); return { a: s[0], b: s[1], uniq: new Set(all).size === all.length, savedKeys: Object.keys(state.drr.ollie.squads).sort().join() }; });
    ck("writing Zuckuss (from A) into B moves him: A drops to 4, B has him, each unit still once; both squads now saved", sq2.a.length === 4 && !sq2.a.includes("ZUCKUSS") && sq2.b.includes("ZUCKUSS") && sq2.uniq && sq2.savedKeys === "0,1", JSON.stringify(sq2));
    await p.reload({ waitUntil: "domcontentloaded" }); await p.waitForTimeout(900); await planner(p, "ollie");
    const sq3 = await p.evaluate(() => ({ a: drrSquads("ollie")[0].length, b: drrSquads("ollie")[1], total: document.querySelector('[data-card="drr-squads"] .drr-total .val').textContent }));
    ck("picker edits persist across a reload (A 4 units, B has Zuckuss, no Barriss) — and B drops back to T0/300k because Zuckuss is G4 (weakest unit)", sq3.a === 4 && sq3.b.includes("ZUCKUSS") && !sq3.b.includes("INQUISITORBARRISS") && sq3.total === "300k", JSON.stringify(sq3));
    await planner(p, "tiny");
    const sqT = await p.evaluate(() => ({ b: drrSquads("tiny")[1], saved: Object.keys(state.drr.tiny.squads).length, total: document.querySelector('[data-card="drr-squads"] .drr-total .val').textContent }));
    ck("Tiny still shows the untouched Opus pre-fill (B = 5 units incl. Barriss, nothing saved, 0 points under weakest-unit)", sqT.b.length === 5 && sqT.b.includes("INQUISITORBARRISS") && sqT.saved === 0 && sqT.total === "0", JSON.stringify(sqT));
    await planner(p, "ollie");
    await p.click('[data-card="drr-squads"] .drr-actions .drr-btn:nth-child(2)'); await p.waitForTimeout(250);   /* Reset to suggested */
    const rs = await p.evaluate(() => ({ saved: Object.keys(state.drr.ollie.squads).length, lens: drrSquads("ollie").map(l => l.length), total: drrPlan("ollie").total }));
    ck("'Reset to suggested' clears the saved squads → Opus pre-fill again (5/5/5/5/4, 300k)", rs.saved === 0 && JSON.stringify(rs.lens) === "[5,5,5,5,4]" && rs.total === 300000, JSON.stringify(rs));
    await p.click('[data-card="drr-squads"] .drr-actions .drr-btn:nth-child(1)'); await p.waitForTimeout(250);   /* Auto-fill by tier */
    const af = await p.evaluate(() => { const s = drrSquads("ollie"), reqs = state.pulls.ollie.reqs, all = s.flat(); const tiers = s.map(l => l.map(id => drrTier(reqs[id]))); return { lens: s.map(l => l.length), uniq: new Set(all).size === all.length, n: all.length, tiers, total: drrPlan("ollie").total, boxes: drrPlan("ollie").boxes.reached, saved: Object.keys(state.drr.ollie.squads).length }; });
    const nonInc = af.tiers.flat().every((t, i, arr) => !i || t <= arr[i - 1]);
    ck("'Auto-fill by tier' packs the 11 floor-ready units best-first (tiers non-increasing), each once: squad 1 = 4×T1+T0 → T0, squad 2 = 5×T0, squad 3 = 1 unit → 900k, 6 boxes", JSON.stringify(af.lens) === "[5,5,1,0,0]" && af.uniq && af.n === 11 && nonInc && af.total === 900000 && af.boxes === 6 && af.saved === 5, JSON.stringify(af));
    await p.click('[data-card="drr-squads"] .drr-actions .drr-btn:nth-child(2)'); await p.waitForTimeout(250);
    /* scoring model toggle — device-local */
    await p.click('[data-card="drr-squads"] .drr-model:nth-of-type(2)'); await p.waitForTimeout(250);
    const md = await p.evaluate(() => ({ view: state.views["drr-model"], total: drrPlan("ollie").total, dom: document.querySelector('[data-card="drr-squads"] .drr-total .val').textContent, pressed: document.querySelector('[data-card="drr-squads"] .drr-model.on').textContent, inBlob: "views" in JSON.parse(localStorage.getItem("swgoh-tracker")), device: !!(JSON.parse(localStorage.getItem("swgoh-holotable-device-v1") || "{}").views || {})["drr-model"], today: document.querySelector('[data-drr-scen="today"] .val').textContent }));
    ck("'Per-unit mean' toggle: state.views['drr-model'] (device bucket, not the synced blob) → ollie 1.2M, scenario 'Today' follows", md.view === "per-unit" && md.total === 1200000 && md.dom === "1.2M" && /Per-unit mean/.test(md.pressed) && !md.inBlob && md.device && md.today === "1.2M", JSON.stringify(md));
    await p.reload({ waitUntil: "domcontentloaded" }); await p.waitForTimeout(900); await planner(p, "ollie");
    ck("the model choice survives a reload", (await p.evaluate(() => drrModel())) === "per-unit", "");
    await p.click('[data-card="drr-squads"] .drr-model:nth-of-type(1)'); await p.waitForTimeout(200);
    /* calculator: slider + ladder + scenarios */
    const sc = await p.evaluate(() => [...document.querySelectorAll('[data-card="drr-calc"] .drr-scen')].map(e => [e.dataset.drrScen, e.querySelector(".val").textContent, e.querySelector(".bx").textContent]));
    ck("scenarios: Today 300k 4 · Floor 1.5M 7 · Likely 1.8M 8 · Stretch 2.25M 9 · Long-term 3M 10 boxes", JSON.stringify(sc) === JSON.stringify([["today", "300k", "4 boxes"], ["floor", "1.5M", "7 boxes"], ["likely", "1.8M", "8 boxes"], ["stretch", "2.25M", "9 boxes"], ["long", "3M", "10 boxes"]]), JSON.stringify(sc));
    const slide = async v => { await p.evaluate(x => { const r = document.querySelector('[data-card="drr-calc"] input[type=range]'); r.value = x; r.dispatchEvent(new Event("input", { bubbles: true })); }, v); await p.waitForTimeout(250);
      return p.evaluate(() => ({ view: state.views["drr-slider"], out: document.querySelector(".drr-simout").textContent.replace(/\s+/g, " "), hit: document.querySelectorAll(".drr-ladder .drr-box.hit").length, sim: document.querySelectorAll(".drr-ladder .drr-box.sim").length, boxes: document.querySelectorAll(".drr-ladder .drr-box").length, lbl: document.querySelector(".drr-sliderrow .lbl").textContent.replace(/\s+/g, " ") })); };
    let sl = await slide(1);
    ck("slider T1: '5 × 450k = 2.25M → 9 of 17 boxes', ladder shows 4 hit today + 5 more at T1 of 17 cells", sl.view === "1" && /5 × 450k = 2.25M → 9 of 17 boxes/.test(sl.out) && sl.hit === 4 && sl.sim === 5 && sl.boxes === 17 && /Gear XII/.test(sl.lbl), JSON.stringify(sl));
    sl = await slide(7);
    ck("slider T7: 5 × 3.6M = 18M → 17 of 17 boxes (all cells lit)", /5 × 3.6M = 18M → 17 of 17 boxes/.test(sl.out) && sl.hit + sl.sim === 17 && /Relic 10/.test(sl.lbl), JSON.stringify(sl));
    sl = await slide(0);
    ck("slider T0: 5 × 300k = 1.5M → 7 of 17 boxes", /5 × 300k = 1.5M → 7 of 17 boxes/.test(sl.out) && sl.hit === 4 && sl.sim === 3, JSON.stringify(sl));
    /* waves: 12 Oct = wave 1 next, none live */
    const wv = await p.evaluate(() => { const c = document.querySelector('[data-card="drr-waves"]'); return { n: c.querySelectorAll(".drr-wave").length, live: c.querySelectorAll(".drr-wlive").length, past: c.querySelectorAll(".drr-wpast").length, next: (c.querySelector('[data-drr-wave="1"] .chip') || {}).textContent, head: c.querySelector(".mnote").textContent, selects: c.querySelectorAll("select.drr-slot").length, ticks: c.querySelectorAll("input[data-k]").length, keys: [...c.querySelectorAll("input[data-k]")].map(e => e.dataset.k) }; });
    ck("12 Oct: 7 wave rows, none live, none past, wave 1 chipped 'next', 28 featured-unit selects, 7 per-account ticks keyed ollie-p:drr:w1…w7", wv.n === 7 && wv.live === 0 && wv.past === 0 && /next/.test(wv.next) && /Next: wave 1 from Fri, 16 Oct/.test(wv.head) && wv.selects === 28 && wv.ticks === 7 && wv.keys[0] === "ollie-p:drr:w1" && wv.keys[6] === "ollie-p:drr:w7", JSON.stringify(wv));
    await p.evaluate(() => { document.querySelector('[data-drr-wave="1"] details').open = true; });
    await pick(p, '[data-drr-wave="1"] .drr-wslot:nth-child(1) select', "KLEYA");
    await pick(p, '[data-drr-wave="1"] .drr-wslot:nth-child(2) select', "STORMTROOPERLUKE");
    const ws = await p.evaluate(() => ({ saved: state.drr.waves, blob: JSON.parse(localStorage.getItem("swgoh-tracker")).drr.waves, advice: [...document.querySelectorAll('[data-drr-wave="1"] .drr-wadvice .drr-pill')].map(e => e.textContent.replace(/\s+/g, " ")), summary: document.querySelector('[data-drr-wave="1"] summary').textContent }));
    ck("featured-unit slots save to state.drr.waves['1'] (synced) and rank by Opus priority: 'Kleya Marki P1 · 3★ → farm to 4★' first, Luke '7★ → Flawed Signal Data'", ws.saved["1"].e === "KLEYA" && ws.saved["1"].c === "STORMTROOPERLUKE" && ws.blob["1"].e === "KLEYA" && ws.advice.length === 2 && /^Kleya Marki P1 · 3★ → farm to 4★$/.test(ws.advice[0]) && /Stormtrooper Luke · 7★ → Flawed Signal Data/.test(ws.advice[1]) && /2\/4 entered/.test(ws.summary), JSON.stringify(ws));
    const bad = await p.evaluate(() => { drrSetWaveSlot(1, "m", "NOT_A_UNIT"); drrSetWaveSlot(99, "e", "KLEYA"); return { w1: state.drr.waves["1"], w99: state.drr.waves["99"] }; });
    ck("an id that is not an eligible unit is ignored; an unknown wave number still only stores known ids", bad.w1.m === undefined && (bad.w99 === undefined || bad.w99.e === "KLEYA"), JSON.stringify(bad));
    await p.evaluate(() => { if (state.drr.waves["99"]) { delete state.drr.waves["99"]; store.write(state); } });
    await p.click('[data-drr-wave="1"] input[data-k]'); await p.waitForTimeout(300);
    const tk = await p.evaluate(() => ({ tick: state.ticks["ollie-p:drr:w1"], checked: document.querySelector('[data-drr-wave="1"] input[data-k]').checked, tinyTick: state.ticks["tiny-p:drr:w1"] }));
    ck("wave tick: state.ticks['ollie-p:drr:w1'] = true (derived tick key, full re-render keeps it checked), Tiny's own key untouched", tk.tick === true && tk.checked && !tk.tinyTick, JSON.stringify(tk));
    await p.reload({ waitUntil: "domcontentloaded" }); await p.waitForTimeout(900); await planner(p, "tiny");
    const tw = await p.evaluate(() => ({ sel: document.querySelector('[data-drr-wave="1"] .drr-wslot:nth-child(1) select').value, advice: [...document.querySelectorAll('[data-drr-wave="1"] .drr-wadvice .drr-pill')].map(e => e.textContent.replace(/\s+/g, " ")), checked: document.querySelector('[data-drr-wave="1"] input[data-k]').checked, key: document.querySelector('[data-drr-wave="1"] input[data-k]').dataset.k }));
    ck("after reload on Tiny: the featured units are shared (Kleya still in Energy; Tiny's 4★ Kleya reads 'at the floor', no P rank), the simmed tick is per account (unchecked, tiny-p:drr:w1)", tw.sel === "KLEYA" && /^Kleya Marki · 4★ at the floor$/.test(tw.advice[0]) && !tw.checked && tw.key === "tiny-p:drr:w1", JSON.stringify(tw));
    /* escaping */
    await planner(p, "ollie");
    const esc = await p.evaluate(() => { const n0 = state.pulls.ollie.reqs.KLEYA.name; state.pulls.ollie.reqs.KLEYA.name = `<img src=x onerror="window.__drrx=1"><script>window.__drrx=2</script>Kleya & "Marki"`; drrRender(); const g = document.getElementById("drrGrid");
      const r = { raw: /<img src=x onerror|<script>window/.test(g.innerHTML), img: g.querySelectorAll("img, script").length, txt: g.textContent.includes('<script>window.__drrx=2</script>Kleya & "Marki"'), x: window.__drrx, where: (g.innerHTML.match(/&lt;script&gt;/g) || []).length }; state.pulls.ollie.reqs.KLEYA.name = n0; drrRender(); return r; });
    ck("a hostile pulled unit name is escaped (needs lines): no <img>/<script> element created, text shown verbatim, nothing executed", !esc.raw && esc.img === 0 && esc.txt && esc.x === undefined && esc.where >= 1, JSON.stringify(esc));
    /* layout editor */
    await p.evaluate(() => { if (!editMode) toggleEdit(); }); await p.waitForTimeout(250);
    const ed = await p.evaluate(() => ({ panes: layTabPanes(), tools: document.querySelectorAll('#drrGrid .card[data-card] .lay-tools').length, sortBtn: document.querySelector("#layTools .lay-sort").disabled }));
    ck("edit mode: the planner grid is a 'drr' pane with ▲▼✕ tools on all 5 cards; Sort by importance enabled (LAY_PRIORITY.drr)", ed.panes.includes("drr") && ed.tools === 5 && ed.sortBtn === false, JSON.stringify(ed));
    await p.evaluate(() => hideCard(new Event("click"), "drr", "drr-calc")); await p.waitForTimeout(250);
    const hid = await p.evaluate(() => ({ hidden: state.layout.hidden.drr, vis: [...document.querySelectorAll('#drrGrid > .card[data-card]:not(.lay-hidcard)')].map(e => e.dataset.card), strip: !!document.querySelector('#drrGrid .lay-hidcard[data-card="drr-calc"]'), pill: !!document.querySelector('#hiddenPills [data-lay-id="drr-calc"]') }));
    ck("✕ hide on the calculator: state.layout.hidden.drr = ['drr-calc'], 4 cards visible, hidden strip + edit-bar pill", JSON.stringify(hid.hidden) === JSON.stringify(["drr-calc"]) && hid.vis.length === 4 && hid.strip && hid.pill, JSON.stringify(hid));
    await p.evaluate(() => layShow(null, "drr", "drr-calc")); await p.waitForTimeout(250);
    const shown = await p.evaluate(() => ({ hidden: state.layout.hidden.drr, vis: [...document.querySelectorAll('#drrGrid > .card[data-card]:not(.lay-hidcard)')].map(e => e.dataset.card) }));
    ck("⊕ show puts it back in its place", shown.hidden.length === 0 && JSON.stringify(shown.vis) === JSON.stringify(["drr-status", "drr-squads", "drr-matrix", "drr-waves", "drr-calc"]), JSON.stringify(shown));
    await p.evaluate(() => { if (editMode) toggleEdit(); }); await p.waitForTimeout(300);
    const pk = await packCheck(p, "drr");
    ck("masonry packing: the drr grid is packed (lay-mas, row spans set) with no holes and no blank space inside cards", pk && pk.mas && pk.n === 5 && pk.spans.every(s => /^span \d+$/.test(s)) && pk.holes.length === 0 && pk.blank.length === 0, JSON.stringify(pk));
    const back = await p.evaluate(() => { raidView("o66"); return { grid: document.getElementById("drrGrid").style.display, body: document.getElementById("raidBody").children.length, detail: document.getElementById("raidDetailNav").style.display, crumb: document.getElementById("modesCrumb").textContent.replace(/\s+/g, " ").trim() }; });
    ck("switching back to Order 66: planner hidden, coach card and account nav back, crumb has the account level again", back.grid === "none" && back.body === 1 && back.detail === "" && /Order 66 Raid\s*›\s*Ollietank/.test(back.crumb), JSON.stringify(back));
    ck("[ui 1280] no page errors", errs.length === 0, JSON.stringify(errs.slice(0, 5)));
    await ctx.close();
  }

  /* ---------- 3. Next-up tile + Coach tip, three clocks ---------- */
  {
    const tile = p => p.evaluate(() => [...document.querySelectorAll("#nxtStrip .nxt-tile")].filter(t => /^drr-/.test(t.dataset.nxt)).map(t => ({ id: t.dataset.nxt, cd: t.querySelector(".nxt-cd").textContent.trim(), title: t.querySelector(".nxt-t").textContent.trim(), action: t.querySelector(".nxt-a").textContent.trim(), tag: (t.querySelector(".nxt-tag") || {}).textContent || "" })));
    const tipOf = (p, a) => p.evaluate(acct => { const tp = TIPS[acct][TIPS[acct].length - 1]; const reqs = state.pulls[acct].reqs; const pr = tipProgress(reqs, tp.check); return { id: tp.id, sev: tp.sev, t: tp.t, note: tp.note, n: tp.check.length, done: pr.doneCount, total: pr.total, isDone: tipIsDone(acct, reqs, tp, TIPS[acct].length - 1), target: tipTarget(tp), key: hardTipKey(acct, tp) }; }, a);
    {
      const { ctx, p, errs } = await openAt(b, { tag: "oct12" });
      await L.go(p, "ollie", "overview");
      let t = await tile(p);
      ck("12 Oct: one 'Droid raid wave 1' tile, 4 days, 'Additive drops Fri, 16 Oct–Sun, 18 Oct · spend nothing on relics before it', no est. tag (dates are CG's)", t.length === 1 && t[0].id === "drr-w1-start" && /^4/.test(t[0].cd) && /16 Oct/.test(t[0].action) && /18 Oct/.test(t[0].action) && /spend nothing on relics/.test(t[0].action) && t[0].tag === "", JSON.stringify(t));
      await p.click('#nxtStrip .nxt-tile[data-nxt="drr-w1-start"] .nxt-go'); await p.waitForTimeout(500);
      const nav = await p.evaluate(() => ({ tab: curTab, cat: state.modesnav.category, view: state.modesnav.raidView, grid: document.getElementById("drrGrid").style.display, jump: state.views["drr-jump"], cards: document.querySelectorAll("#drrGrid > .card").length }));
      ck("tap → Game modes › Raids › Droid Destruction planner (flag consumed, 5 cards)", nav.tab === "modes" && nav.cat === "raid" && nav.view === "droid" && nav.grid === "" && nav.jump === undefined && nav.cards === 5, JSON.stringify(nav));
      const tip = await tipOf(p, "ollie"), tipT = await tipOf(p, "tiny");
      ck("Coach tip (ollie, last in TIPS): 'Droid Destruction: spend nothing on relics before 16 Oct; farm the 4★ floor (11 of 25 units there)', improve, auto-tracked 11/25, key ollie-t:drr-four-star-floor", tip.id === "drr-four-star-floor" && tip.sev === "improve" && /^Droid Destruction: spend nothing on relics before 16 Oct; farm the 4★ floor \(11 of 25 units there\)$/.test(tip.t) && tip.n === 25 && tip.done === 11 && tip.total === 25 && !tip.isDone && tip.key === "ollie-t:drr-four-star-floor", JSON.stringify(tip));
      ck("Coach tip (tiny): 12 of 25 there; note names the 3★ units by priority (Vader, Barriss first) and says relics wait", /\(12 of 25 units there\)/.test(tipT.t) && tipT.done === 12 && /below 4★: Darth Vader \(Duel&#39;s End\), Inquisitor Barriss/.test(tipT.note) && /relics, G13 and crystals wait/.test(tipT.note), JSON.stringify(tipT));
      ck("the tip routes to the planner (TIP_ROUTES first entry, before the relic/farm route)", tip.target && tip.target.tab === "modes" && tip.target.view && tip.target.view[0] === "drr-jump" && /Droid Destruction/.test(tip.target.label), JSON.stringify(tip.target));
      await L.go(p, "ollie", "coach");
      const coach = await p.evaluate(() => { const l = [...document.querySelectorAll("#tips label.tip")].find(x => /Droid Destruction/.test(x.textContent)); return l ? { auto: l.classList.contains("auto"), txt: l.textContent.replace(/\s+/g, " "), link: !!l.querySelector(".tiplink") } : null; });
      ck("Coach's corner shows it as an auto-tracked flag with '11/25 done' and a deep link", coach && coach.auto && /11\/25 done/.test(coach.txt) && coach.link, JSON.stringify(coach));
      await p.click("#tips label.tip .tiplink >> text=Droid Destruction"); await p.waitForTimeout(500);
      ck("clicking the flag lands on the planner", (await p.evaluate(() => curTab === "modes" && state.modesnav.raidView === "droid" && document.getElementById("drrGrid").style.display === "")), "");
      const retire = await p.evaluate(() => { const reqs = state.pulls.ollie.reqs; const saved = {}; DROID_RAID.ELIGIBLE.forEach(e => { if (e.id && reqs[e.id]) { saved[e.id] = reqs[e.id].s; reqs[e.id].s = Math.max(4, reqs[e.id].s); } });
        const tp = TIPS.ollie[TIPS.ollie.length - 1]; const r = { done: tipIsDone("ollie", reqs, tp, TIPS.ollie.length - 1), t: tp.t, floor: drrCounts("ollie").floor }; Object.keys(saved).forEach(id => { reqs[id].s = saved[id]; }); return r; });
      ck("retires itself: with every owned eligible unit at ≥4★ the flag reads '(25 of 25 units there)' and tipIsDone() is true", retire.done && /\(25 of 25 units there\)/.test(retire.t) && retire.floor === 26, JSON.stringify(retire));
      ck("[12 Oct] no page errors", errs.length === 0, JSON.stringify(errs.slice(0, 5)));
      await ctx.close();
    }
    {
      const { ctx, p, errs } = await openAt(b, { tag: "oct17", day: "2026-10-17" });
      await L.go(p, "ollie", "overview");
      const t = await tile(p);
      ck("17 Oct: the tile is 'Live to Sun, 18 Oct · Kleya…' (wave 1 end, 1 day)", t.length === 1 && t[0].id === "drr-w1-end" && /^1/.test(t[0].cd) && /Live to/.test(t[0].action) && /18 Oct/.test(t[0].action) && /stop at 4★/.test(t[0].action), JSON.stringify(t));
      await planner(p, "ollie");
      const w = await p.evaluate(() => ({ live: [...document.querySelectorAll(".drr-wave.drr-wlive")].map(e => e.dataset.drrWave), past: document.querySelectorAll(".drr-wpast").length, chip: document.querySelector('[data-drr-wave="1"] .chip').textContent, open: document.querySelector('[data-drr-wave="1"] details').open, head: document.querySelector('[data-card="drr-waves"] .mnote').textContent, tip: TIPS.ollie[TIPS.ollie.length - 1].t }));
      ck("17 Oct: wave 1 highlighted live ('! live today'), its featured-unit fold open, header 'Wave 1 is live (to Sun, 18 Oct)', Coach tip says 'wave 1 is live to 18 Oct — sim its featured units'", JSON.stringify(w.live) === '["1"]' && w.past === 0 && /live today/.test(w.chip) && w.open && /Wave 1 is live \(to Sun, 18 Oct\)/.test(w.head) && /wave 1 is live to 18 Oct — sim its featured units/.test(w.tip), JSON.stringify(w));
      ck("[17 Oct] no page errors", errs.length === 0, JSON.stringify(errs.slice(0, 5)));
      await ctx.close();
    }
    {
      const { ctx, p, errs } = await openAt(b, { tag: "nov9", day: "2026-11-09" });
      await L.go(p, "ollie", "overview");
      const t = await tile(p);
      ck("9 Nov: no Droid raid tile (all waves over)", t.length === 0, JSON.stringify(t));
      await planner(p, "ollie");
      const w = await p.evaluate(() => ({ live: document.querySelectorAll(".drr-wlive").length, past: document.querySelectorAll(".drr-wpast").length, head: document.querySelector('[data-card="drr-waves"] .mnote').textContent, chip: (document.querySelector('.cardtitle .chip') || {}).textContent, tip: TIPS.ollie[TIPS.ollie.length - 1].t }));
      ck("9 Nov: all 7 waves greyed as over, header 'All seven waves have run', snapshot chip aging/stale (28 days), tip says the free waves are over", w.live === 0 && w.past === 7 && /All seven waves have run/.test(w.head) && /stale|aging/.test(w.chip) && /the free waves are over/.test(w.tip), JSON.stringify(w));
      ck("[9 Nov] no page errors", errs.length === 0, JSON.stringify(errs.slice(0, 5)));
      await ctx.close();
    }
    {
      const { ctx, p, errs } = await openAt(b, { tag: "oct7", day: "2026-10-07" });
      await L.go(p, "ollie", "overview");
      const t = await tile(p);
      ck("7 Oct: no tile yet (one-week horizon — the existing nxt-check tile set on 7 Oct is unchanged)", t.length === 0, JSON.stringify(t));
      ck("[7 Oct] no page errors", errs.length === 0, JSON.stringify(errs.slice(0, 5)));
      await ctx.close();
    }
  }

  /* ---------- 4. 390px: no horizontal overflow, both accounts, planner + overview + coach; pre-drr save loads ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "m390", width: 390, height: 844 });
    for (const a of ["ollie", "tiny"]) {
      await planner(p, a);
      const o = await L.overflow(p);
      const inner = await p.evaluate(() => { const g = document.getElementById("drrGrid"); return { cards: g.querySelectorAll(".card").length, wide: [...g.querySelectorAll("*")].filter(el => el.getBoundingClientRect().right > innerWidth + 1).length, selW: Math.max(...[...g.querySelectorAll("select.drr-slot")].map(s => s.getBoundingClientRect().height)) }; });
      ck(`[390] ${a}: planner has no horizontal overflow (page or any element), 5 cards stacked, pickers ≥36px tall`, o.doc <= o.inner + 1 && inner.wide === 0 && inner.cards === 5 && inner.selW >= 36, JSON.stringify([o, inner]));
      for (const tab of ["overview", "coach"]) { await L.go(p, a, tab); const o2 = await L.overflow(p); ck(`[390] ${a}/${tab}: no horizontal overflow`, o2.doc <= o2.inner + 1, JSON.stringify(o2)); }
    }
    ck("[390] no page errors", errs.length === 0, JSON.stringify(errs.slice(0, 5)));
    await ctx.close();
  }
  {
    const st = JSON.parse(L.REAL); delete st.drr;
    const { ctx, p, errs } = await openAt(b, { tag: "old", state: JSON.stringify(st) });
    const d = await p.evaluate(() => ({ drr: state.drr, hasPulls: !!state.pulls.ollie, keys: Object.keys(state.drr || {}).sort().join() }));
    ck("a save from before this feature loads unchanged: state.drr is backfilled by mergeDefaults ({ waves, ollie, tiny })", d.keys === "ollie,tiny,waves" && d.hasPulls, JSON.stringify(d));
    await planner(p, "ollie");
    ck("…and the planner renders from it (5 cards, 300k)", (await p.evaluate(() => document.querySelectorAll("#drrGrid > .card").length === 5 && drrPlan("ollie").total === 300000)), "");
    const nopull = await p.evaluate(() => { const keep = state.pulls.ollie; delete state.pulls.ollie; let r; try { r = { html: drrStatusCardHtml("ollie"), rows: drrRows("ollie").filter(x => x.owned).length, plan: drrPlan("ollie").total }; } catch (e) { r = { err: String(e) }; } state.pulls.ollie = keep; return r; });
    ck("no live pull on a device: the cards render from the baseline and say so instead of throwing", !nopull.err && /no live pull on this device/.test(nopull.html) && nopull.plan === 0, JSON.stringify(nopull).slice(0, 200));
    ck("[old save] no page errors", errs.length === 0, JSON.stringify(errs.slice(0, 5)));
    await ctx.close();
  }
  await L.finish(b, srv);
})().catch(e => { console.error(e); process.exit(2); });
