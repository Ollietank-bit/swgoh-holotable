/* rvf — review fixes, 12 Oct 2026.
   Part 2: GAC "played" evidence. A skill-rating move is NOT play when the league changed between the two pulls or
   |ΔSR| < GAC_MIN_SR_PLAYED (5, unverified). Uses the 7 Oct and 12 Oct roster snapshots as the two pulls: Ollie
   1467 → 1468 with Carb 5 → Carb 4 (ambiguous), Tiny 1649 → 1691 in Carb 4 (played). Checks gacActivity, the strip on
   Overview (Top flags) and Coach's corner (Action flags), the Re-enter/Set-GAC Coach flag and the Next-up GAC tile, with
   the clock pinned to Mon 12 Oct 2026 20:00 in Australia/Sydney.
   Part 1: offence-plan fixes — exact pristine-row shape (user-trimmed rows survive Reset / re-Apply), Bo-Katan counter
   mapped to the researched gos lineup (+ legacy "(counter squad)" rows still replaceable), pending Apply dropped when the
   roster pull changes, two-device merge of different plans, gos trios ⊂ lineups, base_ids resolve on the 12 Oct pulls,
   league read from the pull (Carb 4 now — nothing assumes Carb 5), 390 px, zero page errors. */
const L = require("./lib.js");
const { ck } = L;
const SHOTS = L.path.join(L.ROOT, "shots");
try { L.fs.mkdirSync(SHOTS, { recursive: true }); } catch (e) {}
const SNAP7 = JSON.parse(L.fs.readFileSync(L.path.join(L.ROOT, "holotable-roster-snapshot-2026-10-07.json"), "utf8"));
const SNAP12 = JSON.parse(L.fs.readFileSync(L.path.join(L.ROOT, "holotable-roster-snapshot-2026-10-12.json"), "utf8"));
const PULLS12 = JSON.stringify(SNAP12.accounts);
const PIN = Date.UTC(2026, 9, 12, 9, 0, 0);   // Mon 12 Oct 2026 20:00 AEDT — after both 12 Oct pulls, inside S84 E1
async function openR(b, o) {
  o = o || {};
  const ctx = await b.newContext({ viewport: { width: o.width || 1280, height: o.height || 1000 }, timezoneId: "Australia/Sydney", locale: "en-AU" });
  await ctx.addInitScript(([s, pl, seedKey, pin]) => {
    if (pin) { const real = Date.now.bind(Date), s0 = real(); Date.now = () => pin + (real() - s0); }
    try { if (!sessionStorage.getItem(seedKey)) { localStorage.clear(); localStorage.setItem("swgoh-tracker", s); localStorage.setItem("swgoh-holotable-pulls-v1", pl); sessionStorage.setItem(seedKey, "1"); } } catch (e) {}
  }, [L.REAL, o.pulls || PULLS12, "seeded-rvf-" + (o.tag || "x"), o.pin === undefined ? PIN : o.pin]);
  await ctx.route(/fonts\.g|swgoh\.gg|corsproxy|allorigins|codetabs|api\.github/, r => r.abort());
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push(String(e).slice(0, 300)));
  p.on("console", m => { if (m.type() === "error" && !/Failed to load resource|net::ERR|fonts\.g/.test(m.text())) errs.push("console: " + m.text().slice(0, 200)); });
  await p.goto(`http://127.0.0.1:${L.PORT}/x.html`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(900);
  return { ctx, p, errs };
}
const allErrs = [];
const sec = async f => { try { await f(); } catch (e) { ck("section ran without throwing", false, String(e).slice(0, 300)); } };

(async () => {
  const srv = await L.serve(); const b = await L.chromium.launch({ headless: true });

  /* ---------- 1. gacHist from the two real pulls, then gacActivity ---------- */
  await sec(async () => {
    const { ctx, p, errs } = await openR(b, { tag: "act" });
    const r = await p.evaluate(([s7, s12]) => {
      const out = { min: GAC_MIN_SR_PLAYED };
      /* rebuild each account's history exactly as a 12 Oct pull on top of the 7 Oct pull would (pbmGacHistNext) */
      for (const a of ["ollie", "tiny"]) {
        const prev = s7[a], next = s12[a], sr = +/^(\d+) SR$/.exec(next.gacNote)[1];
        const h = pbmGacHistNext(prev, { skill_rating: sr }, next.gac, next.fetchedAt);
        out["hist_" + a] = h;
        out["fixture_" + a] = next.gacHist;
        state.pulls[a] = Object.assign({}, state.pulls[a], { gacHist: h });
        out[a] = gacActivity(a);
        out["recent_" + a] = gacActivity(a).recent;
        out["tipResolved_" + a] = pbmGacTipResolved(a, { id: a === "ollie" ? "re-enter-gac-three-built" : "re-enter-gac-rey-r8" });
      }
      out.now = new Date(Date.now()).toString();
      return out;
    }, [SNAP7.accounts, SNAP12.accounts]);
    ck("GAC_MIN_SR_PLAYED is 5", r.min === 5, String(r.min));
    const shape = h => (h || []).map(x => `${x.sr}/${x.league}/${x.prevAt ? 1 : 0}`).join(" → ");
    ck("pbmGacHistNext over the 7 Oct → 12 Oct pulls rebuilds the fixture history (Ollie 1467/Carb 5 → 1468/Carb 4; Tiny 1649 → 1691 in Carb 4)",
      shape(r.hist_ollie) === "1467/Carb 5/0 → 1468/Carb 4/1" && shape(r.hist_tiny) === "1649/Carb 4/0 → 1691/Carb 4/1" && shape(r.fixture_ollie) === shape(r.hist_ollie) && shape(r.fixture_tiny) === shape(r.hist_tiny),
      shape(r.hist_ollie) + " | " + shape(r.hist_tiny));
    const o = r.ollie, t = r.tiny;
    ck("Ollie (+1 SR, league Carb 5 → Carb 4): pending, ambiguous 'league', never 'played'", o.state === "pending" && o.ambiguous === "league" && o.roundId === "s84e1" && !o.how, JSON.stringify(o).slice(0, 300));
    ck("Ollie evidence keeps 'since your <date> pull' and says why it can't count", /^skill rating \+1 since your .*7.* pull, but your league also changed \(Carb 5 → Carb 4\)/.test(o.evidence) && /doesn't show you set defences/.test(o.evidence), o.evidence);
    ck("Ollie: the ambiguous move is not 'recent' play, so the Re-enter/Set-GAC flag is NOT retired", r.recent_ollie === false && r.tipResolved_ollie === false, JSON.stringify([r.recent_ollie, r.tipResolved_ollie]));
    ck("Tiny (+42 SR, same league): played via SR, delta 42, flag retired", t.state === "played" && t.how === "sr" && t.delta === 42 && /^skill rating \+42 since your .*7.* pull$/.test(t.evidence) && r.tipResolved_tiny === true, JSON.stringify(t).slice(0, 300));
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 2. evidence rules on fabricated histories (threshold boundary, league, empty league, sequences) ---------- */
  await sec(async () => {
    const { ctx, p, errs } = await openR(b, { tag: "rules" });
    const r = await p.evaluate(() => {
      const ev = pbmGacEvents().find(e => e.id === "s84e1"), d = (day, h) => new Date(2026, 9, day, h || 12).getTime(), now = d(12, 20);
      const run = h => pbmGacEvidence(h, ev, now);
      const two = (a, b, la, lb) => run([{ at: d(8), sr: a, league: la }, { at: d(11), sr: b, league: lb, prevAt: d(8) }]);
      return {
        small3: two(1500, 1503, "Carb 4", "Carb 4"), small4neg: two(1500, 1496, "Carb 4", "Carb 4"),
        five: two(1500, 1505, "Carb 4", "Carb 4"), fiveNeg: two(1500, 1495, "Carb 4", "Carb 4"),
        leagueBig: two(1500, 1560, "Carb 5", "Carb 4"), emptyLeague: two(1500, 1540, "", "Carb 4"),
        seq: run([{ at: d(8), sr: 1467, league: "Carb 5" }, { at: d(9), sr: 1468, league: "Carb 4", prevAt: d(8) }, { at: d(11), sr: 1508, league: "Carb 4", prevAt: d(9) }]),
        seqSmallAfter: run([{ at: d(8), sr: 1500, league: "Carb 4" }, { at: d(9), sr: 1540, league: "Carb 4", prevAt: d(8) }, { at: d(11), sr: 1542, league: "Carb 4", prevAt: d(9) }]),
        txtSmall: rvfAmbEvidence({ why: "small", delta: 3, from: d(8) }), amb: rvfSrAmbiguity({ sr: 1, league: " Carb 4" }, { sr: 40, league: "Carb 4 " })
      };
    });
    ck("|ΔSR| 3 and −4 (same league) are ambiguous 'small', not played", !r.small3.played && r.small3.amb.why === "small" && !r.small4neg.played && r.small4neg.amb.why === "small", JSON.stringify([r.small3, r.small4neg]));
    ck("|ΔSR| exactly 5 (either sign) counts as played", r.five.played && r.five.delta === 5 && r.fiveNeg.played && r.fiveNeg.delta === -5, JSON.stringify([r.five, r.fiveNeg]));
    ck("a league change makes even +60 ambiguous", !r.leagueBig.played && r.leagueBig.amb.why === "league" && r.leagueBig.amb.delta === 60, JSON.stringify(r.leagueBig));
    ck("an empty league (old seeded entry) is unknown, not a change: +40 counts", r.emptyLeague.played && r.emptyLeague.delta === 40, JSON.stringify(r.emptyLeague));
    ck("league-change +1 then a real +40 in the new league → played, delta 40 (the re-placement move is left out)", r.seq.played && r.seq.delta === 40, JSON.stringify(r.seq));
    ck("a real +40 followed by a +2 wobble stays played (+40 — the wobble is not counted)", r.seqSmallAfter.played && r.seqSmallAfter.delta === 40, JSON.stringify(r.seqSmallAfter));
    ck("small-move wording names the threshold and says it is unverified; whitespace around league names is not a change", /under 5 points/.test(r.txtSmall) && /unverified/.test(r.txtSmall) && r.amb === "", r.txtSmall);
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 3. UI: Overview strip, Coach flag, Next-up tile (1280 + 390) ---------- */
  for (const w of [1280, 390]) await sec(async () => {
    const { ctx, p, errs } = await openR(b, { tag: "ui" + w, width: w });
    await L.go(p, "ollie", "overview");
    const ov = await p.evaluate(() => { const c = [...document.querySelectorAll(".card")].find(x => /Top flags/.test(x.textContent)); const g = c && c.querySelector(".pbm-gac");
      return { strip: g ? g.dataset.pbmGac : null, amb: g ? g.dataset.rvfAmb : null, txt: g ? g.textContent.replace(/\s+/g, " ") : "", btn: !!(g && g.querySelector(".pbm-gac-set")), card: c ? c.textContent : "" }; });
    ck(`[${w}] Overview (Ollie): amber strip, ambiguous=league, 'I've set them' offered, no '✓ Defences set'`, ov.strip === "pending" && ov.amb === "league" && ov.btn && /Set your defences for Season 84 Event 1/.test(ov.txt) && /can't confirm/.test(ov.txt) && !/Defences set/.test(ov.card), ov.txt.slice(0, 300));
    ck(`[${w}] Overview (Ollie): strip explains the league change and the 5-point rule`, /league also changed \(Carb 5 → Carb 4\)/.test(ov.txt) && /by 5\+ points, same league/.test(ov.txt), ov.txt.slice(0, 400));
    ck(`[${w}] Overview (Ollie): the Set-GAC flag stays in Top flags`, /Set GAC defence/.test(ov.card), "");
    const nx = await p.evaluate(() => ({ items: nxtItems("ollie", Date.now()).filter(x => /^gac-/.test(x.id)).map(x => ({ id: x.id, action: x.action })), dom: [...document.querySelectorAll("#nxtStrip .nxt-tile")].map(x => x.dataset.nxt) }));
    ck(`[${w}] Next up (Ollie): 'GAC S84 E1 · Set defence · to Tue 13 Oct' tile, no next-event tile`, nx.items.length === 1 && nx.items[0].id === "gac-s84e1-def-ollie" && /^Set defence · to .*13/.test(nx.items[0].action) && nx.dom.includes("gac-s84e1-def-ollie"), JSON.stringify(nx));
    let o = await L.overflow(p); ck(`[${w}] overview (Ollie): no horizontal overflow`, o.doc <= o.inner + 1, JSON.stringify(o));
    await p.evaluate(() => { const e = document.querySelector("#ovGrid .pbm-gac"); if (e) e.scrollIntoView({ block: "center" }); }); await p.waitForTimeout(120);
    await p.screenshot({ path: L.path.join(SHOTS, `rvf-overview-ollie-amb-${w}.png`), fullPage: false });
    await L.go(p, "ollie", "coach");
    const co = await p.evaluate(() => { const c = [...document.querySelectorAll(".card")].find(x => /Action flags/.test(x.textContent)); const g = c && c.querySelector(".pbm-gac");
      return { strip: g ? g.dataset.pbmGac : null, amb: g ? g.dataset.rvfAmb : null, flag: [...document.querySelectorAll("#tips .tiplink")].map(x => x.textContent).find(t => /GAC/.test(t)) || "" }; });
    ck(`[${w}] Coach (Ollie): strip pending/ambiguous and the 'Set GAC defence — Season 84 Event 1 (5v5) is live' flag shown`, co.strip === "pending" && co.amb === "league" && /^Set GAC defence — Season 84 Event 1 \(5v5\) is live/.test(co.flag), JSON.stringify(co));
    o = await L.overflow(p); ck(`[${w}] coach (Ollie): no horizontal overflow`, o.doc <= o.inner + 1, JSON.stringify(o));
    await p.evaluate(() => { const e = document.querySelector("#tips .pbm-gac"); if (e) e.scrollIntoView({ block: "center" }); }); await p.waitForTimeout(120);
    await p.screenshot({ path: L.path.join(SHOTS, `rvf-coach-ollie-amb-${w}.png`), fullPage: false });
    /* the manual tick still works from the ambiguous state, and Undo brings it back */
    await p.click('#tips [data-pbm-gac="pending"] .pbm-gac-set'); await p.waitForTimeout(250);
    const t1 = await p.evaluate(() => ({ strip: document.querySelector("#tips .pbm-gac").dataset.pbmGac, txt: document.querySelector("#tips .pbm-gac").textContent, tick: state.ticks["ollie-p:gac:s84e1"], flag: [...document.querySelectorAll("#tips .tiplink")].some(x => /Set GAC defence/.test(x.textContent)), tile: nxtItems("ollie", Date.now()).map(x => x.id).filter(x => /^gac-/.test(x)) }));
    ck(`[${w}] 'I've set them' → green via tick, flag retired, Next-up moves to the next event`, t1.strip === "played" && t1.tick === true && /you ticked/.test(t1.txt) && !t1.flag && JSON.stringify(t1.tile) === '["gac-s84e2-start"]', JSON.stringify(t1).slice(0, 300));
    await p.click('#tips [data-pbm-gac="played"] .pbm-gac-undo'); await p.waitForTimeout(250);
    const t2 = await p.evaluate(() => ({ strip: document.querySelector("#tips .pbm-gac").dataset.pbmGac, amb: document.querySelector("#tips .pbm-gac").dataset.rvfAmb }));
    ck(`[${w}] Undo → back to the ambiguous pending strip`, t2.strip === "pending" && t2.amb === "league", JSON.stringify(t2));
    /* Tiny: +42 in the same league stays 'played' */
    await L.go(p, "tiny", "coach");
    const ti = await p.evaluate(() => { const g = document.querySelector("#tips .pbm-gac"); return { strip: g.dataset.pbmGac, txt: g.textContent, flag: [...document.querySelectorAll("#tips .tiplink")].some(x => /Set GAC defence|Re-enter GAC/.test(x.textContent)) }; });
    ck(`[${w}] Coach (Tiny): '✓ Defences set … skill rating +42 since your … pull', GAC flag retired`, ti.strip === "played" && /✓ Defences set for Season 84 Event 1/.test(ti.txt) && /skill rating \+42 since your/.test(ti.txt) && !ti.flag, ti.txt.slice(0, 200));
    await L.go(p, "tiny", "overview");
    const tn = await p.evaluate(() => ({ items: nxtItems("tiny", Date.now()).filter(x => /^gac-/.test(x.id)).map(x => x.id), strip: (document.querySelector("#ovGrid .pbm-gac") || {}).dataset }));
    ck(`[${w}] Overview/Next up (Tiny): strip played, GAC tile is the next event (S84 E2), no defence tile`, tn.strip && tn.strip.pbmGac === "played" && JSON.stringify(tn.items) === '["gac-s84e2-start"]', JSON.stringify(tn));
    o = await L.overflow(p); ck(`[${w}] overview (Tiny): no horizontal overflow`, o.doc <= o.inner + 1, JSON.stringify(o));
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 4. offence rows: exact pristine shape ---------- */
  await sec(async () => {
    const { ctx, p, errs } = await openR(b, { tag: "pristine" });
    await L.go(p, "ollie", "gac");
    const r = await p.evaluate(() => {
      const out = { fresh: [], cases: {} };
      for (const a of ["ollie", "tiny"]) for (const f of ["5v5", "3v3"]) {
        switchAcct(a); state.views["gco-" + a] = f;
        const rows = gofPlannerRows(gofPlanFor(a));
        out.fresh.push(`${a}/${f}:${rows.length}:${rows.every(gofIsPristine)}`);
      }
      switchAcct("ollie"); state.views["gco-ollie"] = "5v5";
      const rows = gofPlannerRows(gofPlanFor("ollie")), r0 = rows.find(x => /good into: .*, /.test(x.zone)) || rows[0];
      const items = r0.squad.split(" — ")[1].split(", ");
      const t = o => gofIsPristine(o);
      out.r0 = r0;
      out.cases = {
        dropMember: t({ squad: r0.squad.replace(", " + items[2], ""), zone: r0.zone }),
        dropAndFakeFill: t({ squad: r0.squad.replace(", " + items[2], "") + " + fill 1 slot yourself", zone: r0.zone }),
        badFillGrammar: t({ squad: r0.squad.replace(", " + items[2], "") + " + fill 1 slots yourself", zone: r0.zone }),
        moveLeader: t({ squad: r0.squad.replace(" (L)", "").replace(items[1], items[1] + " (L)"), zone: r0.zone }),
        reorderLeader: t({ squad: r0.squad.replace(items[0] + ", " + items[1], items[1] + ", " + items[0]), zone: r0.zone }),
        duplicate: t({ squad: r0.squad.replace(items[2], items[1]), zone: r0.zone }),
        zoneSubset: t({ squad: r0.squad, zone: r0.zone.split(", ")[0] }),
        zoneAppend: t({ squad: r0.squad, zone: r0.zone + " — vs Leia" }),
        zoneNoMatch: t({ squad: r0.squad, zone: GOF_NO_MATCH }),
        fleetAsSquad: t({ squad: rows.find(x => /fleet:/.test(x.squad)).squad.replace("fleet:", "#9:"), zone: GOF_NO_MATCH }),
        squadAsFleet: t({ squad: r0.squad.replace(/#\d+:/, "fleet:"), zone: GOF_FLEET_ZONE }),
        fleetZoneEdit: t({ squad: rows.find(x => /fleet:/.test(x.squad)).squad, zone: GOF_FLEET_ZONE + " (Exec)" }),
        commaName: t({ squad: "⚔ Optimiser (3v3) #2: Padmé Amidala trio (offence, 3v3 only) — Padmé Amidala (L), Ahsoka Tano (Snips), Grand Master Yoda", zone: GOF_NO_MATCH }),
        commaNameTrimmed: t({ squad: "⚔ Optimiser (3v3) #2: Padmé Amidala trio (offence, 3v3 only) — Padmé Amidala (L), Grand Master Yoda", zone: GOF_NO_MATCH }),
        unownedFill: t({ squad: "⚔ Optimiser (5v5) #1: General Skywalker 501st (offence) — General Skywalker (L), CT-5555 \"Fives\", CT-7567 \"Rex\" + fill 2 slots yourself", zone: GOF_NO_MATCH })
      };
      /* Bo-Katan: mapped to the researched gos lineup; the old reference squad's rows stay recognisable */
      const legacy = rvfLegacyRefs()[0];
      out.bk = { refs: gofRefSquads().map(s => s.name), into: gofGoodInto("Bo-Katan (Mand'alor) Mandalorians (offence)"),
        legacyRow: gofIsPristine({ squad: `⚔ Optimiser (5v5) #2: ${legacy.name} — ${legacy.names[0]} (L), ${legacy.names[2]} + fill 2 slots yourself`, zone: gofZoneText({ into: legacy.into }) }),
        legacyInto: legacy.into };
      const off = gofPlanFor("ollie"), bk = off.picked.find(c => /^Bo-Katan/.test(c.name));
      out.bk.bench = bk ? { name: bk.name, into: bk.into, i: off.picked.indexOf(bk) } : null;
      out.bk.lookup = off.lookup.filter(x => x.opts.some(o => /^Bo-Katan/.test(o.label))).map(x => x.def + " → " + x.opts.find(o => /^Bo-Katan/.test(o.label)).status);
      return out;
    });
    ck("fresh optimiser rows are pristine for both accounts × both formats", r.fresh.length === 4 && r.fresh.every(x => /:true$/.test(x)), r.fresh.join(" "));
    const c = r.cases;
    /* limitation: dropping a member AND typing the exact "+ fill 1 slot yourself" suffix is indistinguishable from an unowned slot */
    ck("a row with a member removed is the user's (also with a mis-spelt fill suffix)", !c.dropMember && !c.badFillGrammar, JSON.stringify(c));
    ck("moving the (L) mark / swapping the leader / duplicating a unit makes it the user's", !c.moveLeader && !c.reorderLeader && !c.duplicate, JSON.stringify(c));
    ck("zone: a trimmed or extended 'good into' list is the user's; the no-match text is still ours", !c.zoneSubset && !c.zoneAppend && c.zoneNoMatch, `${r.r0.zone} | ${JSON.stringify(c)}`);
    ck("a fleet row can't pose as a squad row or vice versa; an edited fleet zone is the user's", !c.fleetAsSquad && !c.squadAsFleet && !c.fleetZoneEdit, JSON.stringify(c));
    ck("squad names with commas/parentheses parse (Padmé trio); trimmed version is the user's; owned + fill adds up", c.commaName && !c.commaNameTrimmed && c.unownedFill, JSON.stringify(c));
    ck("Bo-Katan: no '(counter squad)' duplicate; gos lineup gets 'good into' (Cassian + Jango) and the lookup points at the bench", !r.bk.refs.some(n => /Bo-Katan/.test(n)) && r.bk.into.length === 2 && r.bk.bench && JSON.stringify(r.bk.bench.into) === JSON.stringify(r.bk.into) && r.bk.lookup.length === 2 && r.bk.lookup.every(x => / → offence #\d+$/.test(x)), JSON.stringify(r.bk));
    ck("a row an older build wrote for 'Bo-Katan (Mand'alor) (counter squad)' is still pristine (replaceable)", r.bk.legacyRow && r.bk.legacyInto.length === 2, JSON.stringify(r.bk));
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 5. Apply → user trims a row → Reset / re-Apply keep it; pending dropped on a new pull ---------- */
  for (const w of [1280, 390]) await sec(async () => {
    const { ctx, p, errs } = await openR(b, { tag: "apply" + w, width: w });
    await L.go(p, "ollie", "gac");
    await p.evaluate(() => { sectionView("gac", "defense"); state.views["gco-ollie"] = "5v5"; gofRun("ollie"); }); await p.waitForTimeout(250);
    await p.evaluate(() => gcoApply("ollie")); await p.waitForTimeout(150);
    await p.click('[data-card="gco"] .gco-confirm .gco-btn.primary'); await p.waitForTimeout(250);
    const a1 = await p.evaluate(() => { const off = gacData().offense; return { n: off.length, ours: off.filter(gofIsPristine).length }; });
    ck(`[${w}] Apply writes pristine offence rows`, a1.n >= 3 && a1.ours === a1.n, JSON.stringify(a1));
    /* user drops one member from row 0 (keeps the rest of the text) */
    const trimmed = await p.evaluate(() => { const off = gacData().offense, i = off.findIndex(gofIsPristine), items = off[i].squad.split(" — ")[1].split(", ");
      const s = off[i].squad.replace(", " + items[items.length - 1], ""); sectionView("gac", "plan"); gacOffSet(i, "squad", s); sectionView("gac", "defense"); return s; });
    await p.waitForTimeout(200);
    const a2 = await p.evaluate(t => ({ ours: gacData().offense.filter(gofIsPristine).length, has: gacData().offense.some(o => o.squad === t) }), trimmed);
    ck(`[${w}] the trimmed row is no longer counted as an optimiser row`, a2.has && a2.ours === a1.n - 1, JSON.stringify(a2));
    await p.evaluate(() => gcoApply("ollie")); await p.waitForTimeout(150);
    const conf = await p.$eval('[data-card="gco"] .gco-confirm', e => e.textContent.replace(/\s+/g, " "));
    ck(`[${w}] confirm: keeps the 1 offence row you edited`, /Keeps the 1 offence optimiser row you have edited/.test(conf), conf.slice(0, 400));
    const o = await L.overflow(p); ck(`[${w}] GAC defence view with offence + confirm open: no horizontal overflow`, o.doc <= o.inner + 1, JSON.stringify(o));
    await p.evaluate(() => { const e = document.querySelector('[data-card="gco"] .gco-confirm'); if (e) e.scrollIntoView({ block: "center" }); }); await p.waitForTimeout(120);
    await p.screenshot({ path: L.path.join(SHOTS, `rvf-gac-confirm-${w}.png`), fullPage: false });
    /* a new roster pull lands while the confirm is open → the stale pending Apply is dropped */
    const pend = await p.evaluate(() => { const before = !!gcfPendingFresh("ollie"); state.pulls.ollie = Object.assign({}, state.pulls.ollie, { fetchedAt: state.pulls.ollie.fetchedAt + 60000 }); renderGac();
      return { before, after: !!gcfPendingFresh("ollie"), card: !!document.querySelector('[data-card="gco"] .gco-confirm') }; });
    ck(`[${w}] pending Apply is dropped when the roster pull changes underneath it`, pend.before && !pend.after && !pend.card, JSON.stringify(pend));
    /* pending survives an account round-trip when nothing changed */
    const rt = await p.evaluate(() => { gcoApply("ollie"); switchAcct("tiny"); switchAcct("ollie"); return { fresh: !!gcfPendingFresh("ollie"), tiny: !!gcoUi.pending.tiny }; });
    ck(`[${w}] pending Apply is per account and survives switching away and back`, rt.fresh && !rt.tiny, JSON.stringify(rt));
    await p.evaluate(() => gcoCancel("ollie"));
    await p.evaluate(() => gcoReset("ollie")); await p.waitForTimeout(200);
    const a3 = await p.evaluate(t => ({ n: gacData().offense.length, has: gacData().offense.some(o => o.squad === t), ours: gacData().offense.filter(gofIsPristine).length }), trimmed);
    ck(`[${w}] Reset removes the untouched offence rows and keeps the trimmed one`, a3.has && a3.ours === 0 && a3.n === 1, JSON.stringify(a3));
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 6. Cloud Sync: two devices apply different plans ---------- */
  await sec(async () => {
    const { ctx, p, errs } = await openR(b, { tag: "sync" });
    await L.go(p, "ollie", "gac");
    const r = await p.evaluate(() => {
      state.views["gco-ollie"] = "5v5"; const base = gofPlannerRows(gofPlanFor("ollie"));
      state.views["gco-ollie"] = "3v3"; const remote = gofPlannerRows(gofPlanFor("ollie"));   /* device B re-applied in 3v3 */
      const items = base[1].squad.split(" — ")[1].split(", ");
      const edited = Object.assign({}, base[1], { squad: base[1].squad.replace(", " + items[items.length - 1], "") });
      const local = [base[0], edited].concat(base.slice(2));                                      /* device A trimmed row #2 */
      const merged = threeWayRows(base, local, remote);
      const afterReset = merged.filter(o => !gofIsPristine(o));
      /* two devices applied DIFFERENT plans before ever syncing (no base): A has the 5v5 bench, B the 3v3 bench with its row #2 trimmed */
      const r2 = remote[1], it2 = r2.squad.split(" — ")[1].split(", "), trim3 = Object.assign({}, r2, { squad: r2.squad.replace(", " + it2[it2.length - 1], "") });
      const devB = remote.map(x => x === r2 ? trim3 : x);
      const both = threeWayRows([], base, devB);
      const bothReset = both.filter(o => !gofIsPristine(o)).map(o => o.squad);
      return { both: both.length, bothWant: base.length + devB.length, bothReset, trim3: trim3.squad, merged: merged.length, remote: remote.length, keepsEdit: merged.some(o => o.squad === edited.squad), dropsBase: !merged.some(o => base.slice(2).some(b => b.squad === o.squad && b.zone === o.zone) && !remote.some(x => x.squad === o.squad)),
        hasRemote: remote.every(x => merged.some(o => o.squad === x.squad)), afterReset: afterReset.map(o => o.squad) , editedSquad: edited.squad };
    });
    ck("threeWayRows: the trimmed row survives, the other device's new plan arrives, untouched old rows are dropped", r.keepsEdit && r.hasRemote && r.dropsBase && r.merged === r.remote + 1, JSON.stringify(r).slice(0, 400));
    ck("two devices applying different plans: rows union (no loss), and Reset/re-Apply clears every untouched row but the trimmed one", r.both === r.bothWant && r.bothReset.length === 1 && r.bothReset[0] === r.trim3, JSON.stringify([r.both, r.bothWant, r.bothReset]));
    ck("after the merge, Reset would leave only the user's trimmed row", r.afterReset.length === 1 && r.afterReset[0] === r.editedSquad, JSON.stringify(r.afterReset));
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 7. gos data vs the 12 Oct pulls; league from the pull ---------- */
  await sec(async () => {
    const { ctx, p, errs } = await openR(b, { tag: "data" });
    await L.go(p, "ollie", "gac");
    const r = await p.evaluate(() => {
      const gos = META_SQUADS.filter(sq => /offence-only entry/.test(sq.mode || ""));
      const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
      const ids = gos.flatMap(sq => sq.members.map(m => ({ sq: sq.name, bid: m[0], name: m[1] })));
      const resolve = ids.map(x => { const u = state.pulls.ollie.reqs[x.bid] || state.pulls.tiny.reqs[x.bid]; return { ...x, ok: !!u && norm(u.name) === norm(x.name), got: u ? u.name : null }; });
      const trios = gos.filter(sq => sq.gosTrio).map(sq => ({ name: sq.name, subset: sq.gosTrio.every(id => sq.members.some(m => m[0] === id)), lead: sq.gosTrio[0] === sq.members[0][0], reg: JSON.stringify(GCO_TRIOS[sq.name]) === JSON.stringify(sq.gosTrio), used: gcoSquadMembers(sq, "3v3", state.pulls.ollie.reqs).members.map(m => m[0]).join() === sq.gosTrio.join() }));
      const out = { n: gos.length, bad: resolve.filter(x => !x.ok), trios,
        defLeak: [gcoPlanFor("ollie"), gcoPlanFor("tiny")].some(pl => pl.squadSlots.some(x => x.cand && gos.includes(x.cand.sq))),
        arenaLeak: squadArenaCandidates("ollie").some(c => gos.includes(c.sq)), recLeak: gos.some(sq => !/do not use on defense/i.test(sq.mode)),
        only3: ["ollie", "tiny"].every(a => { switchAcct(a); state.views["gco-" + a] = "5v5"; return !gofPlanFor(a).picked.some(c => c.sq.gosOnly === "3v3"); }) };
      switchAcct("ollie");
      /* league: Ollie's 12 Oct pull says Carb 4 (was Carb 5 on 7 Oct) */
      state.views["gco-ollie"] = "5v5";
      const lg = gcoLeague("ollie");
      out.league = { gac: state.pulls.ollie.gac, key: lg.league.key, auto: lg.auto, pulled: lg.pulled, header: gcfPlanText(gcoPlanFor("ollie"), "ollie").split("\n")[0] };
      sectionView("gac", "defense"); gcoUi.open.ollie = true; renderGac();
      out.opt = (document.querySelector('[data-card="gco"] select option[value="auto"]') || {}).textContent;
      const saved = state.pulls.ollie.gac; state.pulls.ollie = Object.assign({}, state.pulls.ollie, { gac: "Carb 5" });
      out.league5 = gcfPlanText(gcoPlanFor("ollie"), "ollie").split("\n")[0];
      state.pulls.ollie = Object.assign({}, state.pulls.ollie, { gac: saved });
      return out;
    });
    ck("8 gos offence entries; every member base_id resolves on the 12 Oct pulls to the same unit name", r.n === 8 && r.bad.length === 0, JSON.stringify(r.bad));
    ck("every gosTrio is a 3-unit subset of its lineup, leader first, registered in GCO_TRIOS and used for 3v3", r.trios.length === 5 && r.trios.every(t => t.subset && t.lead && t.reg && t.used), JSON.stringify(r.trios));
    ck("offence-only entries never reach the defence plan, Squad Arena or Recommended defence; 3v3-only trios stay off the 5v5 bench", !r.defLeak && !r.arenaLeak && !r.recLeak && r.only3, JSON.stringify([r.defLeak, r.arenaLeak, r.recLeak, r.only3]));
    ck("League auto-resolves from the pull: 'Carb 4' → Carbonite (pulled), copy header 'Carbonite 4'", r.league.gac === "Carb 4" && r.league.key === "carbonite" && r.league.auto && r.league.pulled && / — Ollietank, Carbonite 4$/.test(r.league.header) && /Auto \(Carbonite from your pull\)/.test(r.opt || ""), JSON.stringify([r.league, r.opt]));
    ck("nothing pins Carb 5: the division follows whatever the pull says", / — Ollietank, Carbonite 5$/.test(r.league5), r.league5);
    allErrs.push(...errs); await ctx.close();
  });

  ck("zero page errors across all sections", allErrs.length === 0, JSON.stringify(allErrs.slice(0, 5)));
  await L.finish(b, srv);
})().catch(e => { console.error(e); process.exit(2); });
