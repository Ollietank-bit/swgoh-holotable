/* gos — GAC offence squad pool (7 Oct 2026). Eight swgoh.gg attack-perspective lineups added to META_SQUADS so
   'Optimise defence + offence' fills a real bench. Covers: entries well-formed (offence-only tag, base_ids resolve on the
   pulled rosters, names match roster names, leader first + in trio, no dup ids/names, source URL + asOf + confidence),
   gosTrio → GCO_TRIOS, gosOnly format gating, tier rows only where added from the live page (no invented rows), both
   accounts × both formats from fixtures: defence plan identical to the pre-change plan, legal offence bench (no unit
   twice across defence + offence, leaders owned 7★ ≥ G10, ≥ 3 owned 7★, 3v3 = 3 units), bench counts, planner rows
   pristine (no comma-split names), defence-side views never take the new entries, UI at 1280/390 with no overflow and
   zero page errors, screenshots. */
const L = require("./lib.js");
const { ck } = L;
const SHOTS = L.path.join(L.ROOT, "shots");
try { L.fs.mkdirSync(SHOTS, { recursive: true }); } catch (e) {}

const NEW = ["Bo-Katan (Mand'alor) Mandalorians (offence)", "Commander Luke Skywalker Rebels (offence)", "General Skywalker 501st (offence)",
  "Hera Syndulla Phoenix (offence)", "Emperor Palpatine Empire (offence)", "Padmé Amidala trio (offence, 3v3 only)",
  "Darth Revan trio (offence, 3v3 only)", "Stormtrooper Luke trio (offence, 3v3 only)"];
/* Defence plans recorded on the unmodified build (7 Oct 2026, fixtures): the gos change must not move them. */
const DEF_BASE = {
  "ollie/5v5": ["Supreme Leader Kylo Ren (GL)", "Jabba the Hutt (GL) Bounty Hunters", "Rey (GL) Jedi", "Executor (flagship only)"],
  "ollie/3v3": ["Supreme Leader Kylo Ren (GL)", "Jabba the Hutt (GL) Bounty Hunters", "Rey (GL) Jedi", "Executor (flagship only)"],
  "tiny/5v5": ["Supreme Leader Kylo Ren (GL)", "Leia Organa (GL) Rebels", "Rey (GL) Jedi", "Negotiator (flagship only)"],
  "tiny/3v3": ["Supreme Leader Kylo Ren (GL)", "Leia Organa (GL) Rebels", "Rey (GL) Jedi", "Negotiator (flagship only)"]
};
/* Offence bench sizes before gos (2 each) — the floor the change must beat. */
const MIN_BENCH = 4;

const PLAN = ([a, f, NEWN]) => { switchAcct(a); state.views["gco-" + a] = f; const def = gcoPlanFor(a), off = gofPlanFor(a);
  const out = { fmt: off.fmt, max: off.max,
    def: def.squadSlots.map(x => x.cand ? x.cand.name : null).concat(def.fleetSlots.map(x => x.cand ? x.cand.name : null)),
    defKeys: [].concat(...def.squadSlots.filter(x => x.cand).map(x => x.cand.keys)),
    excludedNew: def.excluded.filter(e => NEWN.includes(e.name)).map(e => e.reason),
    off: off.picked.map(c => ({ name: c.name, keys: c.keys, n: c.rows.length, lead: { owned: c.rows[0].owned, stars: c.rows[0].stars, gear: c.rows[0].gear },
      sevenN: c.rows.filter(r => r.owned && r.stars >= 7).length, trioAssumed: c.trioAssumed, gosOnly: c.sq.gosOnly || "" })),
    rows: gofPlannerRows(off), pristine: gofPlannerRows(off).every(r => gofIsPristine(r)),
    skippedNew: off.skipped.filter(k => NEWN.includes(k.name)).map(k => k.name + ": " + k.reason) };
  delete state.views["gco-" + a];
  return out; };

(async () => {
  const srv = await L.serve(); const b = await L.chromium.launch({ headless: true });

  /* ---- 1. entries well-formed ---- */
  {
    const { ctx, p, errs } = await L.open(b, { tag: "data" });
    const d = await p.evaluate((NEWN) => {
      const roster = id => (state.pulls.ollie.reqs || {})[id] || (state.pulls.tiny.reqs || {})[id] || null;
      const all = META_SQUADS.map(s => s.name);
      return NEWN.map(n => {
        const sq = META_SQUADS.find(s => s.name === n);
        if (!sq) return { n, missing: true };
        const ids = sq.members.map(m => m[0]);
        const res = sq.members.map(([id, nm]) => { const u = id && roster(id); return { id, nm, ok: !!u, rosterName: u ? u.name : null }; });
        return { n, missing: false, mode: sq.mode, offOnly: GCF_OFFENCE_ONLY_RE.test(sq.mode) && /do not use on defense/i.test(sq.mode) && !/raid/i.test(sq.mode) && !sq.raidTier,
          nMembers: sq.members.length, idsNonNull: ids.every(Boolean), dupIds: new Set(ids).size !== ids.length, dupName: all.filter(x => x === n).length !== 1,
          res, trio: sq.gosTrio || null, trioReg: GCO_TRIOS[n] || null, gosOnly: sq.gosOnly || "", tl5: sq.tl5v5 || "", tl3: sq.tl3v3 || "",
          tl5row: !!tierListEntry("5v5", sq.tl5v5), tl3row: !!tierListEntry("3v3", sq.tl3v3), conf: sq.confidence, confOk: GCO_CONF[sq.confidence] != null,
          asOf: sq.asOf, urls: (sq.sources || []).filter(s => /https:\/\/swgoh\.gg\//.test(s)).length, notes: (sq.notes || "").length,
          gl: ids.filter(id => GL_IDS.includes(id)).length, commaName: sq.members.some(m => /, /.test(m[1])) };
      });
    }, NEW);
    ck("all 8 new offence entries exist in META_SQUADS, each name unique", d.every(x => !x.missing && !x.dupName), JSON.stringify(d.filter(x => x.missing || x.dupName).map(x => x.n)));
    for (const x of d.filter(e => !e.missing)) {
      const t = x.n;
      ck(`[${t}] tagged offence-only ("GAC offense … do not use on defense"), not a raid build`, x.offOnly, x.mode);
      ck(`[${t}] every member has a base_id that resolves on a pulled roster; no duplicate ids`, x.idsNonNull && x.res.every(r => r.ok) && !x.dupIds, JSON.stringify(x.res.filter(r => !r.ok)));
      ck(`[${t}] member names match the roster's unit names (comma names rewritten without the comma)`, x.res.every(r => r.rosterName === r.nm || (/, /.test(r.rosterName) && !/, /.test(r.nm))) && !x.commaName, JSON.stringify(x.res.filter(r => r.rosterName !== r.nm)));
      ck(`[${t}] no Galactic Legend in the lineup`, x.gl === 0);
      if (x.gosOnly) {
        ck(`[${t}] 3v3-only trio: exactly 3 members, gosOnly "3v3", 3v3 tier key only`, x.gosOnly === "3v3" && x.nMembers === 3 && !x.tl5 && !!x.tl3 && !x.trio, JSON.stringify([x.gosOnly, x.nMembers, x.tl5, x.tl3]));
      } else {
        ck(`[${t}] 5-unit lineup with a published 3v3 trio: leader first, trio ⊂ members, registered in GCO_TRIOS`, x.nMembers === 5 && Array.isArray(x.trio) && x.trio.length === 3 && x.trio[0] === x.res[0].id && x.trio.every(id => x.res.some(r => r.id === id)) && JSON.stringify(x.trioReg) === JSON.stringify(x.trio), JSON.stringify([x.trio, x.trioReg]));
      }
      ck(`[${t}] provenance: asOf 7 Oct 2026, ≥ 1 swgoh.gg source URL, notes, a known confidence grade`, x.asOf === "7 Oct 2026" && x.urls >= 1 && x.notes > 40 && x.confOk, JSON.stringify([x.asOf, x.urls, x.conf]));
    }
    /* tier rows: only the ones read from the live page on 7 Oct; Hera 3v3 and CLS 3v3 deliberately have none (neutral 50) */
    const tl = await p.evaluate(() => {
      const cat = k => TIER_LIST.categories.find(c => c.key === k).squads;
      const dup = k => { const l = cat(k).map(s => s.leader); return l.length !== new Set(l).size; };
      const get = (k, n) => { const e = tierListEntry(k, n); return e ? `${e.tier} ${e.wr} ${e.battles}` : null; };
      return { dup5: dup("5v5"), dup3: dup("3v3"), updated: TIER_LIST.updated,
        r5: ["Bo-Katan (Mand'alor)", "General Skywalker", "Emperor Palpatine", "Hera Syndulla", "Commander Luke Skywalker"].map(n => get("5v5", n)),
        r3: ["Darth Revan", "Emperor Palpatine", "General Skywalker", "Stormtrooper Luke", "Padmé Amidala", "Bo-Katan (Mand'alor)"].map(n => get("3v3", n)),
        none3: [get("3v3", "Hera Syndulla"), get("3v3", "Commander Luke Skywalker")], top10: TIER_LIST.categories.map(c => c.squads.slice(0, 10).map(s => s.leader).join("|")) };
    });
    ck("tier list: 5v5 rows for the five 5v5 leaders as read (B/B/B/B/C), no duplicate leaders", JSON.stringify(tl.r5) === JSON.stringify(["B 80.3 90.5K", "B 84.5 82.7K", "B 72.1 10K", "B 76.4 7,771", "C 77.3 36.8K"]) && !tl.dup5, JSON.stringify(tl.r5));
    ck("tier list: 3v3 rows as read (DR A, Palpatine B, GAS B, STL B, Padmé B; Bo-Katan's existing A row untouched), no duplicates", JSON.stringify(tl.r3) === JSON.stringify(["A 84.5 21.8K", "B 79.4 36.3K", "B 83.8 64.8K", "B 77.1 4,330", "B 80.3 3,524", "A 84.2 68.5K"]) && !tl.dup3, JSON.stringify(tl.r3));
    ck("tier list: no invented row for Hera 3v3 / CLS 3v3 (neutral 50); TIER_LIST.updated not bumped", tl.none3.every(x => x === null) && tl.updated === "30 Sep 2026", JSON.stringify(tl.none3));
    ck("tier list: the visible top-10 of each category is unchanged by the appended rows", tl.top10[0].startsWith("Leia Organa|Supreme Leader Kylo Ren|The Stranger") && tl.top10[1].startsWith("Sith Eternal Emperor|The Stranger|Lord Vader"), JSON.stringify(tl.top10));
    const misc = await p.evaluate((NEWN) => ({
      fmtOk: [gosFmtOk({}, "5v5"), gosFmtOk({ gosOnly: "3v3" }, "3v3"), gosFmtOk({ gosOnly: "3v3" }, "5v5")],
      leiaTrio: JSON.stringify(GCO_TRIOS["Leia Organa (GL) Rebels"]),
      recDef: ACCOUNTS.map(a => gacDefenseForAccount(a.key).squads.map(x => x.sq.name)).flat().filter(n => NEWN.includes(n)),
      arena: ACCOUNTS.map(a => squadArenaCandidates(a.key).map(x => x.sq.name)).flat().filter(n => NEWN.includes(n)),
      snap: (SNAPSHOTS.find(s => s.key === "meta-squads") || {}).asOf, snapN: SNAPSHOTS.length }), NEW);
    ck("gosFmtOk: no gosOnly → every format; gosOnly 3v3 → 3v3 only", JSON.stringify(misc.fmtOk) === "[true,true,false]", JSON.stringify(misc.fmtOk));
    ck("existing GCO_TRIOS entry (Leia) untouched", misc.leiaTrio === '["GLLEIA","CAPTAINDROGAN","R2D2_LEGENDARY"]', misc.leiaTrio);
    ck("Recommended defense and Squad Arena never list a new offence-only entry", misc.recDef.length === 0 && misc.arena.length === 0, JSON.stringify([misc.recDef, misc.arena]));
    ck("SNAPSHOTS: meta-squads asOf NOT bumped (the old entries were not re-read), registry size unchanged (22)", misc.snap === "2026-09-27" && misc.snapN === 22, `${misc.snap} / ${misc.snapN}`);
    ck("no page errors (data)", errs.length === 0, JSON.stringify(errs.slice(0, 3)));
    await ctx.close();
  }

  /* ---- 2. plans from fixtures: both accounts × both formats ---- */
  {
    const { ctx, p, errs } = await L.open(b, { tag: "plans" });
    await L.go(p, "ollie", "gac");
    const counts = {};
    for (const acct of ["ollie", "tiny"]) for (const fmt of ["5v5", "3v3"]) {
      const tag = `${acct}/${fmt}`;
      const a = await p.evaluate(PLAN, [acct, fmt, NEW]);
      counts[tag] = a.off.length;
      ck(`[${tag}] defence plan identical to the pre-change plan`, JSON.stringify(a.def) === JSON.stringify(DEF_BASE[tag]), JSON.stringify(a.def));
      ck(`[${tag}] defence planner excludes every new entry as offence-only`, a.excludedNew.length === NEW.length && a.excludedNew.every(r => /offense-only/.test(r)), String(a.excludedNew.length));
      const keys = a.defKeys.concat(...a.off.map(c => c.keys));
      ck(`[${tag}] no unit used twice across defence + offence`, new Set(keys).size === keys.length, keys.length + " keys");
      ck(`[${tag}] every offence leader owned 7★ ≥ G10 and every squad has ≥ 3 owned 7★ units`, a.off.every(c => c.lead.owned && c.lead.stars >= 7 && c.lead.gear >= 10 && c.sevenN >= 3), JSON.stringify(a.off.map(c => [c.name, c.lead, c.sevenN])));
      ck(`[${tag}] bench is fuller: ${MIN_BENCH}..${a.max} squads (was 2 before this change)`, a.off.length >= MIN_BENCH && a.off.length <= a.max, String(a.off.length));
      const newN = a.off.filter(c => NEW.includes(c.name)).length;
      ck(`[${tag}] at least 3 of the bench squads are new gos entries`, newN >= 3, `${newN}: ${a.off.map(c => c.name).join(" | ")}`);
      ck(`[${tag}] format respected: 3v3 = 3 units and no assumed trio for a new entry; 5v5 = no 3v3-only trio`, a.off.every(c => fmt === "3v3" ? c.n === 3 && (!NEW.includes(c.name) || !c.trioAssumed) : c.n <= 5 && c.gosOnly !== "3v3"), JSON.stringify(a.off.map(c => [c.name, c.n, c.trioAssumed])));
      ck(`[${tag}] every offence planner row is recognised as pristine (names with quotes/no commas parse)`, a.pristine && a.rows.length >= a.off.length, JSON.stringify(a.rows.map(r => r.squad).slice(0, 2)));
      console.error(`GOS ${tag}: DEF ${a.def.join(" | ")} || OFF ${a.off.map((c, i) => `#${i + 1} ${c.name}`).join(" | ")} || new skipped: ${a.skippedNew.join(" ; ")}`);
    }
    ck("bench counts: Ollie 5v5 ≥ 5, Ollie 3v3 = 6, Tiny 5v5 = 6, Tiny 3v3 = 6", counts["ollie/5v5"] >= 5 && counts["ollie/3v3"] === 6 && counts["tiny/5v5"] === 6 && counts["tiny/3v3"] === 6, JSON.stringify(counts));
    /* Tiny owns General Skywalker, Ollie does not; Ollie owns Darth Revan, Tiny does not — the bench follows the roster */
    const own = await p.evaluate(() => { const names = (a, f) => { switchAcct(a); state.views["gco-" + a] = f; const n = gofPlanFor(a).picked.map(c => c.name); delete state.views["gco-" + a]; return n; };
      return { o3: names("ollie", "3v3"), t5: names("tiny", "5v5"), t3: names("tiny", "3v3"), o5: names("ollie", "5v5") }; });
    ck("roster-driven: GAS 501st only on Tiny's bench; Darth Revan trio only on Ollie's 3v3 bench", own.t5.includes("General Skywalker 501st (offence)") && !own.o5.includes("General Skywalker 501st (offence)") && own.o3.includes("Darth Revan trio (offence, 3v3 only)") && !own.t3.includes("Darth Revan trio (offence, 3v3 only)"), JSON.stringify(own));
    ck("no page errors (plans)", errs.length === 0, JSON.stringify(errs.slice(0, 3)));
    await ctx.close();
  }

  /* ---- 3. UI: Optimise defence + offence and Roster Gaps at 1280 / 390 ---- */
  for (const w of [1280, 390]) {
    const { ctx, p, errs } = await L.open(b, { width: w, tag: "ui" + w });
    for (const acct of ["ollie", "tiny"]) {
      await L.go(p, acct, "gac");
      await p.evaluate(a => { sectionView("gac", "defense"); gofRun(a); }, acct); await p.waitForTimeout(300);
      const u = await p.evaluate(([a, NEWN]) => { const g = document.getElementById("gof-" + a); return { has: !!g, slots: g ? g.querySelectorAll(".gof-slot").length : 0, text: g ? g.textContent : "", newShown: NEWN.filter(n => g && g.textContent.includes(n)).length }; }, [acct, NEW]);
      ck(`[${w}] ${acct}: offence section renders ≥ ${MIN_BENCH} slots incl. new entries`, u.has && u.slots >= MIN_BENCH && u.newShown >= 3, `${u.slots} slots, ${u.newShown} new`);
      const o = await L.overflow(p);
      ck(`[${w}] ${acct}/gac: no horizontal overflow with the fuller bench`, o.doc <= o.inner + 1, JSON.stringify(o));
      if (acct === "ollie") { const el = await p.$('[data-card="gco"]'); if (el) await el.screenshot({ path: L.path.join(SHOTS, `gos-gac-${w}.png`) }); }
    }
    await L.go(p, "ollie", "gaps");
    const g = await p.evaluate(NEWN => { const prev = state.views.gaps; state.views.gaps = "all"; render();
      const t = document.getElementById("gapsGrid").innerText, folds = [...document.querySelectorAll("#gapsGrid summary")].filter(s => /Why this squad\? notes & sources \(2\)/.test(s.textContent)).length;
      const r = { shown: NEWN.filter(n => t.includes(n)).length, folds };
      return r; }, NEW);
    ck(`[${w}] Roster Gaps 'All squads' lists all 8 new squads, each with a notes & sources fold`, g.shown === 8 && g.folds >= 8, JSON.stringify(g));
    const o2 = await L.overflow(p);
    ck(`[${w}] ollie/gaps: no horizontal overflow`, o2.doc <= o2.inner + 1, JSON.stringify(o2));
    await p.screenshot({ path: L.path.join(SHOTS, `gos-gaps-${w}.png`) });
    await p.evaluate(() => { delete state.views.gaps; render(); });
    ck(`[${w}] zero page errors`, errs.length === 0, JSON.stringify(errs.slice(0, 3)));
    await ctx.close();
  }

  await L.finish(b, srv);
})().catch(e => { console.error(e); process.exit(2); });
