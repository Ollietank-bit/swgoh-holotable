/* gcf — Opus-review fixes for the GAC Optimise planner (gco*) and the pbm import / GAC-activity block (7 Oct 2026).
   Covers: pristine-row protection (gcoIsPristine in confirm/reset/count + confirm wording), format from the
   GAC_SCHEDULE with a pinned clock (gacFormatNow, title, SNAPSHOTS/gacFormatHtml consumers), leader-below-G10
   block, owned-only planner notes + "fill N slot(s) yourself" + 'unowned' chip, Fleet Arena flagship bonus,
   offence-only exclusions, no omicron bonus, base_id member keys, per-account pending Apply (cleared on
   format/league change), memoised plans, keep-for-offence chips (device-local views entry, reload), Copy plan
   text + clipboard + fallback, one-line trio caveat, no scorer internals in Why, import refuses an older payload
   and clamps fetchedAt, no-ally-code payload rejected, confirm focus/Escape/aria-live, other-tab storage
   banner, DST-safe event windows + gap evidence, 390 px no overflow, zero page errors. */
const L = require("./lib.js");
const { ck, SNAP, REAL, PULLS } = L;
const SHOTS = L.path.join(L.ROOT, "shots");
try { L.fs.mkdirSync(SHOTS, { recursive: true }); } catch (e) {}
const CODES = { ollie: "229917529", tiny: "295352286" };

function rawFrom(p, code, sr) {
  return {
    data: { ally_code: +code, name: "Fixture", galactic_power: p.gp, character_galactic_power: p.gpChar || 0, ship_galactic_power: p.gpShip || 0,
      skill_rating: sr, league_name: "Carbonite", division_number: 5,
      arena: { rank: typeof p.squadRank === "number" ? p.squadRank : 0, leader: p.squadLeader || "" },
      fleet_arena: { rank: typeof p.fleetRank === "number" ? p.fleetRank : 0, leader: p.fleetLeader || "" } },
    units: Object.entries(p.reqs).map(([id, u]) => ({ data: { base_id: id, name: u.name || id, rarity: u.s, gear_level: u.g, relic_tier: u.r ? u.r + 2 : 1,
      combat_type: u.t === "ship" ? 2 : 1, era_level: u.el || 0,
      ability_data: (u.z || []).map(n => ({ name: n, has_zeta_learned: true })).concat((u.o || []).map(n => ({ name: n, has_omicron_learned: true }))) } })),
    mods: [], datacrons: []
  };
}
const RAW_OLLIE = rawFrom(SNAP.accounts.ollie, CODES.ollie, 1500);

/* L.open plus: pinned Date.now() at a LOCAL wall-clock time [y, m0, d, h], and an optional timezone. */
async function openX(b, o) {
  o = o || {};
  const ctx = await b.newContext({ viewport: { width: o.width || 1280, height: o.height || 1000 }, timezoneId: o.tz || undefined });
  await ctx.addInitScript(([s, pl, seedKey, pin]) => {
    if (pin) { const real = Date.now.bind(Date), t0 = new Date(pin[0], pin[1], pin[2], pin[3], 0, 0).getTime(), s0 = real(); Date.now = () => t0 + (real() - s0); }
    try { if (!sessionStorage.getItem(seedKey)) {
      localStorage.clear(); localStorage.setItem("swgoh-tracker", s); localStorage.setItem("swgoh-holotable-pulls-v1", pl);
      sessionStorage.setItem(seedKey, "1"); } } catch (e) {}
  }, [REAL, PULLS, "seeded-" + (o.tag || "x"), o.pin || null]);
  await ctx.route(/fonts\.g|swgoh\.gg|corsproxy|allorigins|codetabs|api\.github/, r => r.abort());
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push(String(e).slice(0, 300)));
  p.on("console", m => { if (m.type() === "error" && !/Failed to load resource|net::ERR|fonts\.g/.test(m.text())) errs.push("console: " + m.text().slice(0, 200)); });
  await p.goto(`http://127.0.0.1:${L.PORT}/x.html`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(o.settle || 900);
  return { ctx, p, errs };
}
const openPlan = async (p, acct) => { await L.go(p, acct, "gac"); await p.evaluate(a => { sectionView("gac", "defense"); gcoRun(a); }, acct); await p.waitForTimeout(250); };

(async () => {
  const srv = await L.serve(); const b = await L.chromium.launch({ headless: true });

  /* ---- 1. format from the schedule (pinned clocks) ---- */
  for (const [pin, want, titleRe, tag] of [
    [[2026, 8, 10, 12], "3v3", /^Season 83 Event 1 · 3v3 defence plan — Ollietank$/, "s83e1"],
    [[2026, 9, 8, 12], "5v5", /^Season 84 Event 1 · 5v5 defence plan — Ollietank$/, "s84e1"],
    [[2026, 9, 2, 12], "5v5", /^Season 84 Event 1 \(next — starts .+\) · 5v5 defence plan — Ollietank$/, "gap"]
  ]) {
    const { ctx, p, errs } = await openX(b, { tag: "fmt" + tag, pin });
    await openPlan(p, "ollie");
    const r = await p.evaluate(() => ({ now: gacFormatNow(), def: gcoFormat("ollie"), title: document.querySelector('[data-card="gco"] .gco-plan-title').textContent.trim(),
      pills: [...document.querySelectorAll("#gcoFmtNav button")].map(x => x.textContent + (x.classList.contains("active") ? "*" : "")).join(","), strap: gacFormatHtml(Date.now()), snapLbl: SNAP_BY_KEY["gac-format"].label }));
    ck(`[${tag}] gacFormatNow() follows the schedule event (${want})`, r.now === want && r.def === want, JSON.stringify(r));
    ck(`[${tag}] plan title names the event and format`, titleRe.test(r.title), r.title);
    ck(`[${tag}] format pills list the live format first and mark it active`, r.pills.startsWith(want + "*"), r.pills);
    ck(`[${tag}] gacFormatHtml strapline uses the schedule format`, r.strap.startsWith(`GAC (${want} season)`), r.strap.slice(0, 40));
    if (tag === "s84e1") {
      /* what-if: user picks the other format */
      await p.click("#gcoFmtNav button:not(.active)"); await p.waitForTimeout(250);
      const t2 = await p.$eval('[data-card="gco"] .gco-plan-title', e => e.textContent.trim());
      ck("[s84e1] picking 3v3 during a 5v5 event says it's a what-if", /^Season 84 Event 1 · 3v3 \(what-if — this event is 5v5\) defence plan — Ollietank$/.test(t2), t2);
      const direct = await p.evaluate(() => ({ a: gacFormatNow(new Date(2026, 8, 20, 12).getTime()), b: gacFormatNow(new Date(2026, 9, 15, 12).getTime()), c: gacFormatNow(new Date(2027, 0, 5).getTime()), g: GAC_FORMAT }));
      ck("gacFormatNow(ms): S83 → 3v3, S84 → 5v5, after the schedule → GAC_FORMAT", direct.a === "3v3" && direct.b === "5v5" && direct.c === direct.g, JSON.stringify(direct));
    }
    ck(`[${tag}] no page errors`, errs.length === 0, JSON.stringify(errs.slice(0, 3)));
    await ctx.close();
  }

  /* ---- 2. plan content: exclusions, G10, omicrons, FA flagship, member keys, memo, Why text ---- */
  {
    const { ctx, p, errs } = await openX(b, { tag: "plan", pin: [2026, 9, 8, 12] });
    await openPlan(p, "ollie");
    const r = await p.evaluate(() => {
      const out = {};
      const plan = gcoPlanFor("ollie");
      out.excl = plan.excluded.map(k => k.name);
      out.reyCand = !out.excl.includes("Rey (GL) Jedi");
      const reqs = state.pulls.ollie.reqs;
      /* leader below G10 */
      const slkr = META_SQUADS.find(s => s.name === "Supreme Leader Kylo Ren (GL)");
      const lowReqs = Object.assign({}, reqs, { SUPREMELEADERKYLOREN: Object.assign({}, reqs.SUPREMELEADERKYLOREN, { g: 8, r: 0 }) });
      out.g8 = gcoSquadCandidate(slkr, "5v5", lowReqs).blocked;
      out.g13 = gcoSquadCandidate(slkr, "5v5", reqs).blocked;
      /* omicrons do not move the score */
      const omiReqs = Object.assign({}, reqs, { SUPREMELEADERKYLOREN: Object.assign({}, reqs.SUPREMELEADERKYLOREN, { o: ["a", "b", "c"] }) });
      const noOmi = Object.assign({}, reqs, { SUPREMELEADERKYLOREN: Object.assign({}, reqs.SUPREMELEADERKYLOREN, { o: [] }) });
      const c1 = gcoSquadCandidate(slkr, "5v5", omiReqs), c2 = gcoSquadCandidate(slkr, "5v5", noOmi);
      out.omi = { a: c1.score, b: c2.score, why: c1.why };
      /* FA flagship */
      const exe = { name: "Executor", tlFleet: "Executor" };
      const fa = gcoFleetCandidate(exe, reqs, state.pulls.ollie.fleetLeader), noFa = gcoFleetCandidate(exe, reqs, "");
      out.fa = { lead: state.pulls.ollie.fleetLeader, isFa: fa.isFa, diff: Math.round((fa.score - noFa.score) * 100) / 100, why: fa.why, whyNo: noFa.why, chosen: plan.fleetSlots.map(x => x.cand && x.cand.name) };
      /* base_id member keys for name-only rows */
      const someId = Object.keys(reqs).find(k => reqs[k].t === "char" && reqs[k].name && findUnitByName(reqs, reqs[k].name) === reqs[k]);
      out.key = { id: someId, got: gcoMemberKey(null, reqs[someId].name, reqs), unowned: gcoMemberKey(null, "Nobody Owns This", reqs) };
      const reyDsv = gcoSquadCandidate(slkr, "5v5", reqs).rows.find(x => x.name === "Rey (Dark Side Vision)");
      out.reyKey = reyDsv ? { owned: reyDsv.owned, key: reyDsv.key } : null;
      /* memo */
      const m1 = gcoPlanFor("ollie"), m2 = gcoPlanFor("ollie");
      state.views["gco-ollie"] = "3v3"; const m3 = gcoPlanFor("ollie"); delete state.views["gco-ollie"];
      const m4 = gcoPlanFor("ollie");
      state.pulls.ollie = Object.assign({}, state.pulls.ollie, { fetchedAt: state.pulls.ollie.fetchedAt + 1, reqs: Object.assign({}, reqs) });
      const m5 = gcoPlanFor("ollie");
      out.memo = { same: m1 === m2, fmtNew: m3 !== m1, back: m4 === m1, pullNew: m5 !== m1 && JSON.stringify(m5.squadSlots.map(x => x.cand && x.cand.name)) === JSON.stringify(m1.squadSlots.map(x => x.cand && x.cand.name)) };
      return out;
    });
    ck("offence-only squads (Fennec GL-killer, Jango, Stranger, Bane) are excluded; Rey 'GAC off/def' is not", ["Fennec Shand Mercs (GL-killer)", "Jango Fett Bounty Hunters", "The Stranger Sith/Nightsister", "Darth Bane Sith (offense)"].every(n => r.excl.includes(n)) && r.reyCand, JSON.stringify(r.excl.slice(0, 6)));
    ck("leader below G10 is blocked: 'leader X is G8 — too low to hold'", /^leader Supreme Leader Kylo Ren \(GL\) is G8 — too low to hold$/.test(r.g8) && r.g13 === "", JSON.stringify([r.g8, r.g13]));
    ck("omicrons no longer change the score and are not named in Why", r.omi.a === r.omi.b && !/omicron/i.test(r.omi.why), JSON.stringify(r.omi));
    ck("Fleet Arena flagship (from pull.fleetLeader) gets +25 and 'your Fleet Arena flagship' in Why", r.fa.lead === "CAPITALEXECUTOR" && r.fa.isFa && r.fa.diff === 25 && /your Fleet Arena flagship/.test(r.fa.why) && !/Fleet Arena/.test(r.fa.whyNo) && /flagship-only check/.test(r.fa.why), JSON.stringify(r.fa));
    ck("gcoMemberKey derives the base_id from the roster when the row has none", r.key.got === r.key.id && r.key.unowned === "name:nobody owns this" && (!r.reyKey || !r.reyKey.owned || !/^name:/.test(r.reyKey.key)), JSON.stringify([r.key, r.reyKey]));
    ck("gcoPlanFor is memoised (same object on repeat; new on format change / new pull)", r.memo.same && r.memo.fmtNew && r.memo.back && r.memo.pullNew, JSON.stringify(r.memo));
    /* Why text + summary + skipped line */
    await p.evaluate(() => renderGac()); await p.waitForTimeout(150);
    const w = await p.evaluate(() => { const c = document.querySelector('[data-card="gco"]');
      const whys = [...c.querySelectorAll(".gco-why")].map(x => x.textContent).join(" | ");
      const fold = [...c.querySelectorAll("details")].find(d => /How this is scored/.test(d.textContent));
      const skips = [...c.querySelectorAll(".gco-skip")].map(x => x.textContent);
      return { whys, summary: c.querySelector(".gco-summary").textContent, foldMs: fold ? /ms to compute/.test(fold.textContent) && /\+ 20 for a built Galactic Legend/.test(fold.textContent) && /\+ 25 when the flagship is your own Fleet Arena flagship/.test(fold.textContent) : false,
        dupScore: skips.filter(t => /\(\d+(\.\d+)?\) · score/.test(t) || (t.match(/· score /g) || []).length > 1).length, scoreLines: skips.filter(t => /· score \d/.test(t)).length }; });
    ck("Why lines carry no scorer internals ('(+20)', 'ms')", !/\(\+\d+\)/.test(w.whys) && !/\bms\b/.test(w.whys) && /Galactic Legend anchor/.test(w.whys), w.whys.slice(0, 300));
    ck("summary no longer says 'computed in N ms'; the scoring fold does", !/computed in/.test(w.summary) && w.foldMs, w.summary.slice(0, 200));
    ck("skipped-squad lines show the score once", w.dupScore === 0 && w.scoreLines >= 1, JSON.stringify(w));
    ck("no page errors (plan content)", errs.length === 0, JSON.stringify(errs.slice(0, 3)));
    await ctx.close();
  }

  /* ---- 3. unowned members: owned-only notes + fill N + unowned chip; one-line trio caveat in 3v3 ---- */
  {
    const { ctx, p, errs } = await openX(b, { tag: "unowned", pin: [2026, 9, 8, 12] });
    await openPlan(p, "ollie");
    const info = await p.evaluate(() => {
      const pl = gcoPlanFor("ollie"); const c = pl.squadSlots[0].cand;
      const victim = c.members.slice(1).find(m => m[0] && state.pulls.ollie.reqs[m[0]]);
      return { name: c.name, victim, rows: c.rows.map(r => r.name), un0: c.unownedN };
    });
    await p.evaluate(([bid]) => { delete state.pulls.ollie.reqs[bid]; renderGac(); }, [info.victim[0]]);
    await p.waitForTimeout(200);
    const r = await p.evaluate(([nm, vName]) => {
      const pl = gcoPlanFor("ollie"); const x = [...pl.squadSlots].find(s => s.cand && s.cand.name === nm);
      const rows = gcoPlannerRows(pl); const row = rows[pl.squadSlots.indexOf(x)];
      const slotEl = [...document.querySelectorAll('[data-card="gco"] .gco-slot')].find(el => el.querySelector(".gco-name") && el.querySelector(".gco-name").textContent === nm);
      return { still: !!x, unownedN: x && x.cand.unownedN, unowned: x ? x.cand.rows.filter(q => !q.owned).map(q => q.name) : [], note: row && row.note, chip: slotEl ? [...slotEl.querySelectorAll(".gcf-unowned")].length : -1,
        set: slotEl ? slotEl.querySelector(".gco-set").textContent : "", text: gcfPlanText(pl, "ollie"), pristine: row ? gcoIsPristine(row) : null, vName };
    }, [info.name, info.victim[1]]);
    const N = info.un0 + 1, fill = ` + fill ${N} slot${N === 1 ? "" : "s"} yourself`;
    const noneNamed = s => r.unowned.every(n => !s.includes(n));
    ck("squad with an extra unowned member is still chosen (≥3 owned)", r.still && r.unownedN === N && r.unowned.includes(r.vName), JSON.stringify(r).slice(0, 300));
    ck("planner note lists owned members only and appends ' + fill N slot(s) yourself'", r.note && noneNamed(r.note) && r.note.endsWith(fill) && /\(L\)/.test(r.note), r.note);
    ck("the card shows an 'unowned' chip on each unowned member", r.chip === N, String(r.chip));
    ck("'Set in game' names only owned units and says how many to fill", noneNamed(r.set) && r.set.includes(fill.trim()), r.set);
    ck("copy text also lists owned members only (+ fill N)", noneNamed(r.text) && r.text.includes(fill), r.text);
    ck("an owned-only note with the fill suffix is still recognised as untouched (pristine)", r.pristine === true, String(r.pristine));
    /* 3v3: trio caveat collapsed to one line under the title */
    await p.evaluate(() => gcfSetFmt("ollie", "3v3")); await p.waitForTimeout(250);
    const t = await p.evaluate(() => { const c = document.querySelector('[data-card="gco"]');
      return { lines: c.querySelectorAll(".gcf-assume").length, perSlot: [...c.querySelectorAll(".gco-set")].filter(x => /trio assumed/.test(x.textContent)).length,
        afterTitle: c.querySelector(".gco-plan-title").nextElementSibling && c.querySelector(".gco-plan-title").nextElementSibling.className, txt: (c.querySelector(".gcf-assume") || {}).textContent || "" }; });
    ck("3v3: ONE amber trio-assumed line under the title, none per squad", t.lines === 1 && t.perSlot === 0 && t.afterTitle === "gcf-assume" && /unverified/.test(t.txt), JSON.stringify(t));
    ck("no page errors (unowned)", errs.length === 0, JSON.stringify(errs.slice(0, 3)));
    await ctx.close();
  }

  /* ---- 4. pristine-row protection + pending per account ---- */
  {
    const { ctx, p, errs } = await openX(b, { tag: "pristine", pin: [2026, 9, 8, 12] });
    await openPlan(p, "ollie");
    await p.evaluate(() => { gcoApply("ollie"); gcoConfirm("ollie"); });
    await p.waitForTimeout(200);
    const base = await p.evaluate(() => { const zs = gacData().zones; return { n: zs.length, mine: zs.filter(gcoIsRow).map((z, i) => zs.indexOf(z)) }; });
    ck("first Apply writes 4 pristine rows", base.mine.length === 4 && await p.evaluate(() => gacData().zones.filter(gcoIsPristine).length === 4), JSON.stringify(base));
    /* user scouts row 0 (defIdx), edits row 1's note, edits row 2's zone; row 3 stays untouched */
    const [i0, i1, i2] = base.mine;
    await p.evaluate(([a, b2, c]) => { sectionView("gac", "plan"); const zs = gacData().zones;
      gacZoneSet(a, "defIdx", "0"); gacZoneSet(b2, "note", zs[b2].note + " — opp runs Rey here"); gacZoneSet(c, "zone", zs[c].zone + " (watch)"); sectionView("gac", "defense"); }, [i0, i1, i2]);
    await p.waitForTimeout(200);
    const unit = await p.evaluate(() => {
      const row = gcoPlannerRows(gcoPlanFor("ollie"))[0];
      const old = Object.assign({}, row, { note: row.note.replace(/ \+ fill \d+ slots? yourself$/, "") });
      return { fresh: gcoIsPristine(row), defIdx: gcoIsPristine(Object.assign({}, row, { defIdx: "2" })), noteAdd: gcoIsPristine(Object.assign({}, row, { note: row.note + " x" })),
        zoneEdit: gcoIsPristine(Object.assign({}, row, { zone: "Front zone — top · my squad 1/1 (mine)" })), empty: gcoIsPristine({ zone: "Back zone · my squad 1/1", defIdx: "", note: "⛨ Optimiser (5v5): no eligible tracked squad — fill from your roster in game" }),
        oldForm: gcoIsPristine(old), fake: gcoIsPristine({ zone: "Back zone · my squad 1/1", defIdx: "", note: "⛨ Optimiser (5v5): My own squad — Han, Chewie" }) };
    });
    ck("gcoIsPristine: untouched rows yes; picked opponent / edited note / edited zone / unknown squad no", unit.fresh && !unit.defIdx && !unit.noteAdd && !unit.zoneEdit && unit.empty && unit.oldForm && !unit.fake, JSON.stringify(unit));
    await p.evaluate(() => { gcoRun("ollie"); });
    await p.waitForTimeout(150);
    ck("Reset button counts only the untouched optimiser row", /Reset \(1 in planner\)/.test(await p.$eval('[data-card="gco"] .gco-actions', e => e.textContent)));
    await p.evaluate(() => gcoApply("ollie")); await p.waitForTimeout(150);
    const conf = await p.$eval(".gco-confirm", e => e.textContent);
    ck("confirm says it replaces 1 untouched row and keeps the 3 you edited", /Replaces the 1 optimiser row already in the planner that you haven't touched/.test(conf) && /Keeps the 3 optimiser rows you have scouted or edited/.test(conf) && /\(3 of them edited optimiser rows\)/.test(conf), conf.replace(/\s+/g, " ").slice(0, 600));
    await p.evaluate(() => gcoConfirm("ollie")); await p.waitForTimeout(200);
    const after = await p.evaluate(([n]) => { const zs = gacData().zones; return { total: zs.length, pristine: zs.filter(gcoIsPristine).length, edited: zs.filter(z => gcoIsRow(z) && !gcoIsPristine(z)).length,
      scout: zs.some(z => z.defIdx === "0" && gcoIsRow(z)), note: zs.some(z => / — opp runs Rey here$/.test(z.note)), zone: zs.some(z => / \(watch\)$/.test(z.zone)), n }; }, [base.n]);
    ck("re-Apply keeps the 3 edited optimiser rows untouched and replaces only the pristine one", after.total === base.n + 3 && after.pristine === 4 && after.edited === 3 && after.scout && after.note && after.zone, JSON.stringify(after));
    await p.evaluate(() => { gcoRun("ollie"); gcoReset("ollie"); }); await p.waitForTimeout(200);
    const rs = await p.evaluate(() => { const zs = gacData().zones; const saved = JSON.parse(localStorage.getItem("swgoh-tracker")).gac.ollie.zones; return { pristine: zs.filter(gcoIsPristine).length, edited: zs.filter(z => gcoIsRow(z) && !gcoIsPristine(z)).length, saved: saved.filter(z => /Optimiser/.test(z.note || "")).length }; });
    ck("Reset removes only pristine rows; the 3 edited ones survive (and are persisted)", rs.pristine === 0 && rs.edited === 3 && rs.saved === 3, JSON.stringify(rs));
    /* pending per account */
    await openPlan(p, "ollie");
    await p.evaluate(() => gcoApply("ollie")); await p.waitForTimeout(150);
    await openPlan(p, "tiny");
    const tinyBtn = await p.evaluate(() => ({ dis: document.querySelector('[data-card="gco"] .gco-actions .gco-btn.primary').disabled, ollie: !!gcoUi.pending.ollie, confirm: !!document.querySelector(".gco-confirm") }));
    ck("pending Apply on Ollie does not disable Tiny's Apply (per account)", tinyBtn.dis === false && tinyBtn.ollie && !tinyBtn.confirm, JSON.stringify(tinyBtn));
    await p.evaluate(() => gcoApply("tiny")); await p.waitForTimeout(150);
    await L.go(p, "ollie", "gac"); await p.evaluate(() => renderGac()); await p.waitForTimeout(150);   /* no gcoRun: that would clear Ollie's pending */
    const ol = await p.evaluate(() => ({ dis: document.querySelector('[data-card="gco"] .gco-actions .gco-btn.primary').disabled, both: !!gcoUi.pending.ollie && !!gcoUi.pending.tiny }));
    ck("back on Ollie: Ollie's Apply is disabled while its own confirm is pending; Tiny's pending survives", ol.dis === true && ol.both, JSON.stringify(ol));
    await p.evaluate(() => gcoApply("ollie")); await p.evaluate(() => gcfSetFmt("ollie", gcoFormat("ollie") === "5v5" ? "3v3" : "5v5")); await p.waitForTimeout(150);
    ck("changing the format clears that account's pending Apply only", await p.evaluate(() => !gcoUi.pending.ollie && !!gcoUi.pending.tiny && !document.querySelector(".gco-confirm")));
    await p.evaluate(() => gcoApply("ollie")); await p.evaluate(() => gcfSetLeague("ollie", "bronzium")); await p.waitForTimeout(150);
    ck("changing the league clears the pending Apply", await p.evaluate(() => !gcoUi.pending.ollie));
    await p.evaluate(() => { gcoApply("ollie"); state.views["gcolg-ollie"] = "auto"; });
    ck("a stale pending (league changed behind it) is refused by gcoConfirm", await p.evaluate(() => { const n = gacData().zones.length; gcoConfirm("ollie"); return gacData().zones.length === n && !gcoUi.pending.ollie; }));
    ck("no page errors (pristine/pending)", errs.length === 0, JSON.stringify(errs.slice(0, 3)));
    await ctx.close();
  }

  /* ---- 5. keep-for-offence + copy plan ---- */
  {
    const { ctx, p, errs } = await openX(b, { tag: "keep", pin: [2026, 9, 8, 12] });
    await openPlan(p, "ollie");
    const before = await p.evaluate(() => ({ chips: [...document.querySelectorAll('[data-card="gco"] .gcf-chip')].map(c => c.textContent), lead: gcoPlanFor("ollie").squadSlots[0].cand.rows[0].key, first: gcoPlanFor("ollie").squadSlots[0].cand.name, keys: Object.keys(state) }));
    ck("Keep-for-offence chip row lists the chosen leaders", before.chips.length >= 3, JSON.stringify(before.chips));
    await p.click('[data-card="gco"] .gcf-chip'); await p.waitForTimeout(250);
    const k = await p.evaluate(([lead]) => { const pl = gcoPlanFor("ollie");
      return { view: state.views["gco-ollie"], keep: gcfViewOf("ollie").keep, used: [...pl.squadSlots, ...pl.fleetSlots].some(x => x.cand && x.cand.keys.includes(lead)), kept: pl.kept.map(x => x.name),
        pressed: [...document.querySelectorAll('[data-card="gco"] .gcf-chip[aria-pressed="true"]')].length, fold: [...document.querySelectorAll('[data-card="gco"] .gco-skip')].some(e => /kept for offence/.test(e.textContent)),
        newKeys: Object.keys(state).filter(x => /gco|gcf|keep/i.test(x)), devLocal: DEVICE_UI_KEYS.includes("views"), blobKeep: (localStorage.getItem("swgoh-tracker") || "").includes("keep="), filled: pl.summary.squadsFilled }; }, [before.lead]);
    ck("keeping the first leader removes every squad using it from the plan", k.keep.includes(before.lead) && !k.used && k.kept.includes(before.first) && k.pressed === 1 && k.fold, JSON.stringify(k));
    ck("keep list lives in the device-local views entry state.views['gco-ollie'] (no new keys)", /\|keep=/.test(k.view) && k.newKeys.length === 0 && k.devLocal && !k.blobKeep, k.view);
    ck("the synced blob carries no views/keep data", await p.evaluate(() => !JSON.stringify(stateWithoutDeviceLocal(state)).includes("keep=")));
    /* format pill keeps the keep list */
    await p.click("#gcoFmtNav button:not(.active)"); await p.waitForTimeout(250);
    const kf = await p.evaluate(() => ({ view: state.views["gco-ollie"], fmt: gcoFormat("ollie") }));
    ck("switching format with the pills keeps the keep list", /^(3v3|5v5)\|keep=/.test(kf.view) && kf.view.startsWith(kf.fmt), JSON.stringify(kf));
    await p.reload({ waitUntil: "domcontentloaded" }); await p.waitForTimeout(900);
    await openPlan(p, "ollie");
    ck("keep list survives a reload", await p.evaluate(([lead]) => gcfViewOf("ollie").keep.includes(lead) && !!document.querySelector('[data-card="gco"] .gcf-chip[aria-pressed="true"]'), [before.lead]));
    ck("legacy plain views value ('5v5') still parses", await p.evaluate(() => { const v = state.views["gco-tiny"]; state.views["gco-tiny"] = "5v5"; const ok = gcoFormat("tiny") === "5v5" && gcfViewOf("tiny").keep.length === 0; if (v === undefined) delete state.views["gco-tiny"]; else state.views["gco-tiny"] = v; return ok; }));
    await p.click('[data-card="gco"] .gcf-chip[aria-pressed="true"]'); await p.waitForTimeout(250);
    ck("un-keeping restores the leader to the plan", await p.evaluate(([lead]) => gcfViewOf("ollie").keep.length === 0 && gcoPlanFor("ollie").squadSlots.some(x => x.cand && x.cand.keys.includes(lead)), [before.lead]));
    /* copy plan */
    await p.evaluate(() => gcfSetFmt("ollie", "5v5")); await p.waitForTimeout(200);
    const text = await p.evaluate(() => gcfPlanText(gcoPlanFor("ollie"), "ollie"));
    const lines = text.split("\n");
    ck("copy text header 'GAC S84 E1 (5v5) — Ollietank, Carbonite 5'", lines[0] === "GAC S84 E1 (5v5) — Ollietank, Carbonite 5", lines[0]);
    ck("copy text: one line per slot, 'Front top: … (L), …' and a 'Fleet:' line", lines.length === 5 && /^Front top: .+ \(L\)/.test(lines[1]) && /^Front bottom: /.test(lines[2]) && /^Back: /.test(lines[3]) && /^Fleet: /.test(lines[4]), text);
    await p.evaluate(() => { window.__copied = null; Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: t => { window.__copied = t; return Promise.resolve(); } } }); });
    await p.click('[data-card="gco"] .gcf-copy-btn'); await p.waitForTimeout(200);
    const c1 = await p.evaluate(() => ({ copied: window.__copied, msg: document.getElementById("gcfCopyMsg-ollie").textContent }));
    ck("📋 Copy plan writes the plain-text plan via navigator.clipboard.writeText", c1.copied === text && /Copied/.test(c1.msg), JSON.stringify(c1).slice(0, 200));
    await p.evaluate(() => { Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: () => Promise.reject(new Error("denied")) } }); });
    await p.click('[data-card="gco"] .gcf-copy-btn'); await p.waitForTimeout(250);
    const c2 = await p.evaluate(() => { const ta = document.getElementById("gcfCopyText-ollie"); return { open: !!ta.closest("details").open, val: ta.value, sel: ta.selectionEnd - ta.selectionStart, focus: document.activeElement === ta, msg: document.getElementById("gcfCopyMsg-ollie").textContent }; });
    ck("clipboard refused → fallback opens the fold with the plan selected in a textarea", c2.open && c2.val === text && c2.sel === text.length && c2.focus && /Couldn't copy/.test(c2.msg), JSON.stringify(c2).slice(0, 200));
    await p.screenshot({ path: L.path.join(SHOTS, "gcf-optimise-1280.png"), fullPage: false, clip: await p.evaluate(() => { const r = document.querySelector('[data-card="gco"]').getBoundingClientRect(); return { x: Math.max(0, r.x), y: Math.max(0, r.y + scrollY), width: Math.min(r.width, innerWidth), height: Math.min(r.height, 2400) }; }) }).catch(() => {});
    ck("no page errors (keep/copy)", errs.length === 0, JSON.stringify(errs.slice(0, 3)));
    await ctx.close();
  }

  /* ---- 6. pbm: older payload refused, clamp, no ally code, confirm focus/Escape/aria-live, coarse CSS ---- */
  {
    const { ctx, p, errs } = await openX(b, { tag: "pbm" });
    await L.go(p, "ollie", "overview");
    const r = await p.evaluate(([raw]) => {
      const out = {};
      const PK = "swgoh-holotable-pulls-v1";
      const cur = state.pulls.ollie.fetchedAt;
      /* older payload: arrived before the pull already on this device */
      const before = localStorage.getItem(PK);
      pbmPending = { items: [{ a: ACCOUNTS[0], raw, gp: raw.data.galactic_power }], bad: [], at: cur - 60000 };
      out.oldRet = pbmImport();
      out.oldSt = document.getElementById("pullStatus").textContent;
      out.oldSame = localStorage.getItem(PK) === before && state.pulls.ollie.fetchedAt === cur;
      /* newer payload: imported, fetchedAt/charDataAt clamped to arrival */
      const at = Date.now() - 5000;
      pbmPending = { items: [{ a: ACCOUNTS[0], raw, gp: raw.data.galactic_power }], bad: [], at };
      out.newRet = pbmImport();
      const pl = state.pulls.ollie;
      out.clamp = { f: pl.fetchedAt === at, c: pl.charDataAt <= at, h: (pl.gacHist || []).every(h => h.at <= at), saved: JSON.parse(localStorage.getItem(PK)).ollie.fetchedAt === at };
      /* no ally code */
      const noCode = JSON.parse(JSON.stringify(raw)); delete noCode.data.ally_code;
      const blank = JSON.parse(JSON.stringify(raw)); blank.data.ally_code = "";
      out.noCode = pbmParseOne(ACCOUNTS[0], noCode, state.pulls.ollie).why;
      out.blank = pbmParseOne(ACCOUNTS[0], blank, state.pulls.ollie).why;
      pbmReceive({ type: "holotable-pull", v: 1, accounts: { ollie: noCode } });
      out.noCodeCard = document.getElementById("pbmConfirm").textContent; out.noCodeBtn = !!document.getElementById("pbmImportBtn");
      out.closeFocus = document.activeElement && document.activeElement.id;
      pbmCancel();
      /* confirm a11y */
      pbmReceive({ type: "holotable-pull", v: 1, accounts: { ollie: raw } });
      const el = document.getElementById("pbmConfirm");
      out.focus = document.activeElement && document.activeElement.id; out.live = el.getAttribute("aria-live");
      out.coarse = [...document.styleSheets].some(s => { try { return [...s.cssRules].some(x => x.media && /coarse/.test(x.media.mediaText) && /\.pbm-gac-btn/.test(x.cssText) && /\.pbm-help-btn/.test(x.cssText) && /44px/.test(x.cssText) && /8px 12px/.test(x.cssText)); } catch (e) { return false; } });
      return out;
    }, [RAW_OLLIE]);
    ck("import refuses a payload that arrived before the pull already on this device", r.oldRet === 0 && /a newer pull landed after this one arrived/.test(r.oldSt) && r.oldSame, JSON.stringify([r.oldRet, r.oldSt.slice(0, 160)]));
    ck("a valid import clamps fetchedAt / charDataAt / gacHist to the arrival time", r.newRet === 1 && r.clamp.f && r.clamp.c && r.clamp.h && r.clamp.saved, JSON.stringify(r.clamp));
    ck("pbmParseOne rejects a payload with no (or blank) ally code", /no ally code/.test(r.noCode) && /no ally code/.test(r.blank), JSON.stringify([r.noCode, r.blank]));
    ck("no-ally-code payload: reason shown, no Import button, Close gets focus", /no ally code/.test(r.noCodeCard) && !r.noCodeBtn && r.closeFocus === "pbmCancelBtn", r.noCodeCard.slice(0, 160));
    ck("#pbmConfirm: Import button focused on show, aria-live=polite", r.focus === "pbmImportBtn" && r.live === "polite", JSON.stringify([r.focus, r.live]));
    ck("@media (pointer:coarse) gives .pbm-gac-btn/.pbm-help-btn 44px + 8px 12px", r.coarse);
    await p.keyboard.press("Escape"); await p.waitForTimeout(100);
    ck("Escape cancels the import card (nothing pending, hidden)", await p.evaluate(() => pbmPending === null && document.getElementById("pbmConfirm").hidden));
    ck("no page errors (pbm)", errs.length === 0, JSON.stringify(errs.slice(0, 3)));
    await ctx.close();
  }

  /* ---- 7. another tab writes → banner; this tab writes nothing ---- */
  {
    const { ctx, p, errs } = await openX(b, { tag: "tabs", settle: 1500 });
    await L.go(p, "ollie", "overview");
    await p.evaluate(() => { document.getElementById("pullStatus").textContent = ""; });
    const p2 = await ctx.newPage();
    await p2.goto(`http://127.0.0.1:${L.PORT}/x.html`, { waitUntil: "domcontentloaded" }); await p2.waitForTimeout(900);
    await p.evaluate(() => { document.getElementById("pullStatus").textContent = ""; document.getElementById("pullStatus").className = "pullstatus"; });
    const marker = await p2.evaluate(() => { const s = JSON.parse(localStorage.getItem("swgoh-tracker")); s.__gcfMarker = 1; const v = JSON.stringify(s); localStorage.setItem("swgoh-tracker", v); return v; });
    await p.waitForTimeout(300);
    const t = await p.evaluate(() => ({ txt: document.getElementById("pullStatus").textContent, cls: document.getElementById("pullStatus").className, role: document.getElementById("pullStatus").getAttribute("role") }));
    ck("a write to the main state key in another tab shows the reload banner", /Holotable was updated in another tab — reload before changing anything here\./.test(t.txt) && /err/.test(t.cls) && t.role === "alert", JSON.stringify(t));
    ck("this tab did not auto-write state in response", await p.evaluate(([m]) => localStorage.getItem("swgoh-tracker") === m && !("__gcfMarker" in state), [marker]));
    await p.evaluate(() => { document.getElementById("pullStatus").textContent = ""; });
    await p2.evaluate(() => localStorage.setItem("swgoh-holotable-pulls-v1", localStorage.getItem("swgoh-holotable-pulls-v1")));   // same value → no event
    await p2.evaluate(() => { const v = JSON.parse(localStorage.getItem("swgoh-holotable-pulls-v1")); v.ollie.gp += 1; localStorage.setItem("swgoh-holotable-pulls-v1", JSON.stringify(v)); });
    await p.waitForTimeout(300);
    ck("a write to PULLS_KEY in another tab shows the banner too", /updated in another tab/.test(await p.evaluate(() => document.getElementById("pullStatus").textContent)));
    await p.evaluate(() => { document.getElementById("pullStatus").textContent = ""; });
    await p2.evaluate(() => localStorage.setItem("some-other-key", "x"));
    await p.waitForTimeout(300);
    ck("unrelated keys are ignored", (await p.evaluate(() => document.getElementById("pullStatus").textContent)) === "");
    ck("no page errors (two tabs)", errs.length === 0, JSON.stringify(errs.slice(0, 3)));
    await ctx.close();
  }

  /* ---- 8. GAC windows: rollover const, DST-safe days (Australia/Sydney), gap evidence ---- */
  {
    const { ctx, p, errs } = await openX(b, { tag: "dst", tz: "Australia/Sydney" });
    const r = await p.evaluate(() => {
      const T = (m, d, h) => new Date(2026, m, d, h || 12, 0, 0).getTime();
      const out = { roll: GAC_ROLLOVER_UTC_H };
      out.dst = { day: pbmLocalDay("2026-10-01", 7) === new Date(2026, 9, 8).getTime(), naive: pbmLocalDay("2026-10-01", 7) - (pbmLocalDay("2026-10-01") + 7 * PBM_DAY) };
      out.ends = pbmGacEvents().every(e => new Date(e.endMs).getHours() === 0 && new Date(e.startMs).getHours() === 0);
      const setHist = h => { state.pulls.ollie = Object.assign({}, state.pulls.ollie, { gacHist: h }); };
      setHist([{ at: T(9, 1, 7), sr: 1330, league: "Carb 5" }, { at: T(9, 8, 13), sr: 1467, league: "Carb 5", prevAt: T(9, 1, 7) }]);
      out.gap = gacActivity("ollie", T(9, 8, 14));
      setHist([{ at: T(8, 28, 7), sr: 1330, league: "Carb 5" }, { at: T(9, 8, 13), sr: 1467, league: "Carb 5", prevAt: T(8, 28, 7) }]);
      out.span = gacActivity("ollie", T(9, 8, 14));
      setHist([{ at: T(8, 1, 7), sr: 1330, league: "Carb 5" }, { at: T(8, 10, 13), sr: 1467, league: "Carb 5", prevAt: T(8, 1, 7) }]);
      out.preSchedule = gacActivity("ollie", T(8, 10, 14));
      return out;
    });
    ck("GAC_ROLLOVER_UTC_H is null (unverified → local-midnight behaviour kept)", r.roll === null, String(r.roll));
    ck("DST-safe: a 7-day window across AEDT start ends on local midnight (naive math is 1 h off)", r.dst.day && r.dst.naive === -3600000 && r.ends, JSON.stringify(r.dst));
    ck("SR change whose interval only spans the gap between events counts as played", r.gap.state === "played" && r.gap.how === "sr" && r.gap.delta === 137, JSON.stringify(r.gap));
    ck("SR change spanning the previous event is still ambiguous (pending)", r.span.state === "pending" && /may be the previous one/.test(r.span.evidence), JSON.stringify(r.span));
    ck("SR change starting before the schedule's first event stays ambiguous", r.preSchedule.state === "pending" && /may be the previous one/.test(r.preSchedule.evidence), JSON.stringify(r.preSchedule));
    ck("no page errors (DST)", errs.length === 0, JSON.stringify(errs.slice(0, 3)));
    await ctx.close();
  }

  /* ---- 9. 390 px: plan + keep chips + copy fold + confirm, no overflow; screenshots ---- */
  for (const w of [390, 1280]) {
    const { ctx, p, errs } = await openX(b, { tag: "w" + w, width: w, height: w === 390 ? 844 : 1000, pin: [2026, 9, 8, 12] });
    await openPlan(p, "ollie");
    await p.evaluate(() => { const d = document.getElementById("gcfCopyText-ollie").closest("details"); d.open = true; gcoApply("ollie"); });
    await p.waitForTimeout(250);
    await p.evaluate(() => { const d = document.getElementById("gcfCopyText-ollie"); if (d) d.closest("details").open = true; });
    const o = await L.overflow(p);
    ck(`[${w}] no horizontal overflow with plan, chips, copy fold and confirm open`, o.doc <= o.inner + 1, JSON.stringify(o));
    const cw = await p.evaluate(() => { const c = document.querySelector('[data-card="gco"]'); return { sw: c.scrollWidth, cw: c.clientWidth }; });
    ck(`[${w}] Optimise card content fits its box`, cw.sw <= cw.cw + 1, JSON.stringify(cw));
    if (w === 390) {
      const h = await p.evaluate(() => [...document.querySelectorAll('[data-card="gco"] .gco-btn')].map(b => Math.round(b.getBoundingClientRect().height)));
      ck("[390] all card buttons incl. Copy plan are ≥ 40 px tall", h.length >= 5 && h.every(x => x >= 40), h.join());
    }
    await p.evaluate(() => document.querySelector('[data-card="gco"]').scrollIntoView({ block: "start" }));
    await p.waitForTimeout(150);
    await p.screenshot({ path: L.path.join(SHOTS, `gcf-optimise-full-${w}.png`), fullPage: true });
    /* other-tab banner screenshot (header) */
    await p.evaluate(() => { window.scrollTo(0, 0); gcfOnStorage({ key: "swgoh-tracker", storageArea: localStorage }); });
    await p.waitForTimeout(150);
    const o2 = await L.overflow(p);
    ck(`[${w}] other-tab banner: no horizontal overflow`, o2.doc <= o2.inner + 1, JSON.stringify(o2));
    await p.screenshot({ path: L.path.join(SHOTS, `gcf-othertab-${w}.png`), fullPage: false });
    ck(`[${w}] no page errors`, errs.length === 0, JSON.stringify(errs.slice(0, 3)));
    await ctx.close();
  }

  await L.finish(b, srv);
})().catch(e => { console.error(e); process.exit(2); });
