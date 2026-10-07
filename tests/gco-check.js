/* gco — GAC Planner 'Optimise defence' suite (7 Oct 2026).
   Covers: deterministic plans; no unit twice per account × format; excluded squads never chosen; slot
   counts per league/format match GCO_FORMATS; Apply writes planner rows through the planner state, survives
   a reload, keeps user rows and needs a confirm; refused while legacy migration is pending; Reset removes
   only optimiser rows; unowned-unit scenario changes the plan; escaping; 390 px; zero page errors. */
const L = require("./lib.js");
const PLAN = ([a, f]) => { switchAcct(a); state.views["gco-" + a] = f; const p = gcoPlanFor(a);
  return { fmt: p.fmt, league: p.league.key, slots: [...p.squadSlots, ...p.fleetSlots].map(x => ({ key: x.slot.key, kind: x.slot.kind, name: x.cand ? x.cand.name : null, units: x.cand ? x.cand.rows.map(r => r.name) : [] })),
    skipped: p.skipped.map(k => k.name), excluded: p.excluded.map(k => k.name), summary: p.summary, ms: gcoUi.ms[a] }; };
(async () => {
  const srv = await L.serve(); const b = await L.chromium.launch({ headless: true });

  /* ---- 1. pure plan properties, both accounts × both formats ---- */
  {
    const { ctx, p, errs } = await L.open(b, { tag: "plan" });
    await L.go(p, "ollie", "gac");
    L.ck("GCO_FORMATS carries asOf + sources + 5 leagues", await p.evaluate(() => GCO_FORMATS.asOf && GCO_FORMATS.sources.length >= 2 && GCO_FORMATS.leagues.length === 5 && GCO_FORMATS.leagues.every(l => ["5v5", "3v3"].every(f => l[f] && ["ft", "fb", "bk", "fl"].every(z => Number.isInteger(l[f][z]))))));
    /* gcf (deliberate change): the default now follows the GAC_SCHEDULE event live now (gacFormatNow), not GAC_FORMAT. */
    L.ck("default format follows the live schedule event (gacFormatNow)", await p.evaluate(() => gcoFormat("ollie") === (gacFormatNow() === "3v3" ? "3v3" : "5v5")));
    for (const acct of ["ollie", "tiny"]) for (const fmt of ["5v5", "3v3"]) {
      const a = await p.evaluate(PLAN, [acct, fmt]), b2 = await p.evaluate(PLAN, [acct, fmt]);
      const tag = `${acct}/${fmt}`;
      const strip = x => JSON.stringify({ ...x, ms: 0 });
      L.ck(`[${tag}] plan is deterministic on repeat`, strip(a) === strip(b2), JSON.stringify(a.slots.map(s => s.name)));
      L.ck(`[${tag}] plan uses the requested format`, a.fmt === fmt, a.fmt);
      const units = a.slots.flatMap(s => s.units);
      L.ck(`[${tag}] no unit appears twice across all slots`, new Set(units).size === units.length, units.join("|"));
      const names = a.slots.map(s => s.name).filter(Boolean);
      L.ck(`[${tag}] no squad appears twice`, new Set(names).size === names.length, names.join("|"));
      /* gcf (deliberate change): offence-only now also covers "GAC offense…", "counter-offense", "offense counter". */
      const exclBad = await p.evaluate(([f]) => META_SQUADS.filter(sq => GCF_OFFENCE_ONLY_RE.test(sq.mode || "") || sq.raidTier || /raid/i.test(sq.mode || "")).map(sq => sq.name), [fmt]);
      L.ck(`[${tag}] excluded (offense-only / raid) squads never chosen`, !names.some(n => exclBad.includes(n)) && a.excluded.length === exclBad.length, `${a.excluded.length} excluded`);
      L.ck(`[${tag}] every chosen squad's leader is owned at 7★`, await p.evaluate(([aa, f]) => { const pl = gcoPlanFor(aa); return pl.squadSlots.every(x => !x.cand || (x.cand.rows[0].owned && x.cand.rows[0].stars >= 7)); }, [acct, fmt]));
      L.ck(`[${tag}] no chosen squad lists two Galactic Legends`, await p.evaluate(([aa]) => gcoPlanFor(aa).squadSlots.every(x => !x.cand || x.cand.members.filter(m => GL_IDS.includes(m[0])).length <= 1), [acct]));
      const counts = await p.evaluate(([aa, f]) => { const lg = gcoLeague(aa).league[f]; return { sq: lg.ft + lg.fb + lg.bk, fl: lg.fl, league: gcoLeague(aa).league.key }; }, [acct, fmt]);
      L.ck(`[${tag}] slot counts match the league layout (${counts.league})`, a.slots.filter(s => s.kind === "squad").length === counts.sq && a.slots.filter(s => s.kind === "fleet").length === counts.fl, JSON.stringify({ got: a.slots.length, counts }));
      L.ck(`[${tag}] league auto-detected from the pull as Carbonite`, a.league === "carbonite", a.league);
      L.ck(`[${tag}] every squad slot filled on this roster`, a.summary.squadsFilled === a.summary.squadsNeeded, JSON.stringify(a.summary));
      L.ck(`[${tag}] computed in under 100 ms`, a.ms < 100, a.ms + " ms");
      L.ck(`[${tag}] 3v3 squads field 3 units, 5v5 squads at most 5`, a.slots.filter(s => s.kind === "squad" && s.name).every(s => fmt === "3v3" ? s.units.length === 3 : s.units.length <= 5), JSON.stringify(a.slots.map(s => s.units.length)));
    }
    /* Slot counts for every league × format equal the wiki's squad/fleet totals. */
    const totals = await p.evaluate(() => GCO_FORMATS.leagues.map(l => ["5v5", "3v3"].map(f => { const s = gcoSlots(f, l); return `${l.key}/${f}:${s.squads.length}+${s.fleets.length}`; })).flat());
    const want = ["carbonite/5v5:3+1", "carbonite/3v3:3+1", "bronzium/5v5:5+1", "bronzium/3v3:7+1", "chromium/5v5:7+2", "chromium/3v3:10+2", "aurodium/5v5:9+2", "aurodium/3v3:13+2", "kyber/5v5:11+3", "kyber/3v3:15+3"];
    L.ck("gcoSlots reproduces the wiki squad/fleet totals for all 5 leagues × 2 formats", JSON.stringify(totals) === JSON.stringify(want), totals.join(" "));
    L.ck("slot order starts front-top, front-bottom, back", await p.evaluate(() => gcoSlots("5v5", GCO_FORMATS.leagues[4]).squads.slice(0, 3).map(s => s.key).join()) === "ft-1,fb-1,bk-1");
    /* Kyber 3v3 (15 squads) still terminates quickly and without overlap. */
    const ky = await p.evaluate(() => { state.views["gcolg-ollie"] = "kyber"; state.views["gco-ollie"] = "3v3"; const t0 = performance.now(); const pl = gcoPlanFor("ollie"); const ms = performance.now() - t0; const u = pl.squadSlots.filter(x => x.cand).flatMap(x => x.cand.rows.map(r => r.name)); delete state.views["gcolg-ollie"]; return { ms, slots: pl.squadSlots.length, dup: new Set(u).size !== u.length, filled: pl.summary.squadsFilled }; });
    L.ck("Kyber 3v3 override: 15 squad slots, no overlap, < 100 ms", ky.slots === 15 && !ky.dup && ky.ms < 100, JSON.stringify(ky));
    L.ck("no page errors (plan computation)", errs.length === 0, JSON.stringify(errs.slice(0, 3)));
    await ctx.close();
  }

  /* ---- 2. unowned-unit scenario: delete a chosen leader from the pull → plan changes ---- */
  {
    const { ctx, p, errs } = await L.open(b, { tag: "unowned" });
    await L.go(p, "ollie", "gac");
    const before = await p.evaluate(PLAN, ["ollie", "5v5"]);
    const lead = await p.evaluate(() => { const pl = gcoPlanFor("ollie"); const c = pl.squadSlots[0].cand; return c.members[0][0]; });
    await p.evaluate(([bid]) => { delete state.pulls.ollie.reqs[bid]; }, [lead]);
    const after2 = await p.evaluate(PLAN, ["ollie", "5v5"]);
    const beforeNames = before.slots.map(s => s.name), afterNames = after2.slots.map(s => s.name);
    L.ck("deleting the top squad's leader from the pull changes the plan", JSON.stringify(beforeNames) !== JSON.stringify(afterNames) && !afterNames.includes(beforeNames[0]), `${beforeNames.join("|")} → ${afterNames.join("|")}`);
    L.ck("the dropped squad is now listed under skipped with a 'leader … not owned' reason", await p.evaluate(([n]) => gcoPlanFor("ollie").skipped.some(k => k.name === n && /leader .* not owned/.test(k.reason)), [beforeNames[0]]));
    const units = after2.slots.flatMap(s => s.units);
    L.ck("the changed plan still has no duplicate units", new Set(units).size === units.length);
    L.ck("no page errors (unowned scenario)", errs.length === 0, JSON.stringify(errs.slice(0, 3)));
    await ctx.close();
  }

  /* ---- 3. UI, Apply/confirm/reset, reload persistence, escaping ---- */
  {
    const { ctx, p, errs } = await L.open(b, { tag: "ui" });
    await L.go(p, "ollie", "gac");
    await p.evaluate(() => sectionView("gac", "defense"));
    L.ck("Defense view shows the Optimise card before the existing ranked list", await p.evaluate(() => { const cards = [...document.querySelectorAll('#gacGrid [data-card]')].map(c => c.dataset.card); return cards[0] === "gco" && cards.includes("defense"); }));
    L.ck("card starts collapsed with an 'Optimise defence' button and format pills", await p.evaluate(() => /Optimise defence/.test(document.querySelector('[data-card="gco"] .gco-btn.primary').textContent) && document.querySelectorAll('#gcoFmtNav button').length === 2 && !document.querySelector('[data-card="gco"] .gco-plan-title')));
    await p.click('[data-card="gco"] .gco-btn.primary');
    await p.waitForTimeout(250);
    const title = await p.$eval('[data-card="gco"] .gco-plan-title', e => e.textContent);
    /* gcf (deliberate change): the title now names the live event, e.g. "Season 84 Event 1 · 5v5 defence plan — Ollietank". */
    L.ck("plan title reads '<Season N Event N> · <fmt> defence plan — Ollietank'", /^(Season \d+ Event \d+[^·]* · )?(5v5|3v3)( \(what-if[^)]*\))? defence plan — Ollietank$/.test(title.trim()), title);
    L.ck("plan lists one .gco-slot per slot with zone + set-in-game + why lines", await p.evaluate(() => { const s = [...document.querySelectorAll('[data-card="gco"] .gco-slot')]; return s.length === 4 && s.every(el => el.querySelector(".gco-zone") && el.querySelector(".gco-set")) && s.filter(el => el.querySelector(".gco-why")).length >= 3; }));
    L.ck("readiness glyphs ✓/⚠/✕ and gap text render", await p.evaluate(() => { const t = document.querySelector('[data-card="gco"]').textContent; return /✓/.test(t) && /(⚠|✕)/.test(t) && /(relic tier|G\d+ → G12|not owned)/.test(t); }));
    L.ck("confidence badge, tier chip, summary with readiness % and honesty line present", await p.evaluate(() => { const c = document.querySelector('[data-card="gco"]'); return !!c.querySelector(".chip.done, .chip.close, .chip.grind, .chip.stargate") && /-tier/.test(c.textContent) && /Plan readiness \d+%/.test(c.textContent) && /not a hold-rate guarantee/.test(c.textContent); }));
    L.ck("'Skipped strong squads and why' fold lists reasons", await p.evaluate(() => { const d = [...document.querySelectorAll('[data-card="gco"] details')].find(x => /Skipped strong squads/.test(x.textContent)); return !!d && d.querySelectorAll(".gco-skip").length >= 5 && /do not use on defense/.test(d.textContent); }));
    /* dta 7 Oct 2026: GAC_FORMAT is now 5v5, whose Carbonite plan carries no assumption to label; the "3v3 trio assumed ... unverified"
       copy only exists in the 3v3 view. So: the all-league caveat is checked on the default view, 'unverified' on the 3v3 pill, then back. */
    L.ck("all-league caveat appears in the card copy (default view)", await p.evaluate(() => /all-league/.test(document.querySelector('[data-card="gco"]').textContent)));
    await p.evaluate(() => [...document.querySelectorAll("#gcoFmtNav button")].find(b => b.textContent.trim() === "3v3").click()); await p.waitForTimeout(250);
    L.ck("'unverified' labelling appears in the card copy (3v3 view)", await p.evaluate(() => { const t = document.querySelector('[data-card="gco"]').textContent; return /all-league/.test(t) && /unverified/i.test(t); }));
    await p.evaluate(() => [...document.querySelectorAll("#gcoFmtNav button")].find(b => b.textContent.trim() === "5v5").click()); await p.waitForTimeout(250);
    /* format switch via the pills */
    const fmt0 = await p.evaluate(() => gcoFormat("ollie"));
    await p.click('#gcoFmtNav button:not(.active)');
    await p.waitForTimeout(300);
    const fmt1 = await p.evaluate(() => gcoFormat("ollie"));
    L.ck("format pill switches the plan's format and the title", fmt0 !== fmt1 && (await p.$eval('[data-card="gco"] .gco-plan-title', e => e.textContent)).includes(fmt1), `${fmt0} → ${fmt1}`);
    L.ck("format choice is stored only in the device-local views map (no new top-level state key)", await p.evaluate(() => { const keys = Object.keys(state); return state.views["gco-ollie"] && !keys.some(k => /^gco/i.test(k)) && DEVICE_UI_KEYS.includes("views"); }));
    /* Apply → confirm card → planner rows */
    const zonesBefore = await p.evaluate(() => gacData().zones.length);
    L.ck("fixture planner starts with no optimiser rows", await p.evaluate(() => !gacData().zones.some(gcoIsRow)));
    await p.click('[data-card="gco"] .gco-actions .gco-btn.primary');
    await p.waitForTimeout(250);
    L.ck("Apply opens a confirm card and does NOT write yet", await p.evaluate(([n]) => !!document.querySelector(".gco-confirm") && gacData().zones.length === n && JSON.parse(localStorage.getItem("swgoh-tracker")).gac.ollie.zones.filter(z => /Optimiser/.test(z.note || "")).length === 0, [zonesBefore]));
    L.ck("confirm card lists every row that will be written", await p.evaluate(() => document.querySelectorAll(".gco-confirm li").length === 4));
    await p.click('.gco-confirm .gco-btn:not(.primary)');   // Cancel
    await p.waitForTimeout(200);
    L.ck("Cancel closes the confirm without writing", await p.evaluate(([n]) => !document.querySelector(".gco-confirm") && gacData().zones.length === n, [zonesBefore]));
    /* now with user content present in the planner */
    await p.evaluate(() => { gacZoneAdd(); gacZoneSet(gacData().zones.length - 1, "zone", "My scouted zone <b>x</b>"); gacZoneSet(gacData().zones.length - 1, "note", "user note & stuff"); gacOffAdd(); sectionView("gac", "defense"); });
    await p.waitForTimeout(200);
    const userZones = await p.evaluate(() => gacData().zones.length), userOff = await p.evaluate(() => gacData().offense.length);
    await p.evaluate(() => gcoApply("ollie"));
    await p.waitForTimeout(200);
    L.ck("with user content the confirm card warns and nothing is written until confirmed", await p.evaluate(([z]) => { const c = document.querySelector(".gco-confirm"); return !!c && /already has your own content/.test(c.textContent) && /add alongside/.test(c.querySelector(".gco-btn.primary").textContent) && gacData().zones.length === z; }, [userZones]));
    await p.click('.gco-confirm .gco-btn.primary');
    await p.waitForTimeout(300);
    const afterApply = await p.evaluate(([z, o]) => { const zs = gacData().zones; return { total: zs.length, mine: zs.filter(gcoIsRow).length, user: zs.filter(x => !gcoIsRow(x)).length, keptUser: zs.some(x => x.zone === "My scouted zone <b>x</b>" && x.note === "user note & stuff"), off: gacData().offense.length, init: state.gac.ollie.initialized, saved: JSON.parse(localStorage.getItem("swgoh-tracker")).gac.ollie.zones.filter(x => /Optimiser/.test(x.note || "")).length }; }, [userZones, userOff]);
    L.ck("confirmed Apply writes 4 optimiser rows via the planner state and keeps user rows/offense", afterApply.mine === 4 && afterApply.user === userZones && afterApply.keptUser && afterApply.off === userOff && afterApply.init === true && afterApply.saved === 4, JSON.stringify(afterApply));
    L.ck("written rows carry zone + leader-first note and empty defIdx", await p.evaluate(() => gacData().zones.filter(gcoIsRow).every(z => /Front zone|Back zone|Fleet zone/.test(z.zone) && z.defIdx === "" && /\(L\)|flagship/.test(z.note))));
    /* escaping: user row with <b> must render as text in the planner, and the plan card itself escapes names */
    await p.evaluate(() => sectionView("gac", "plan"));
    await p.waitForTimeout(200);
    L.ck("planner renders the user's '<b>' zone text as text (escaped)", await p.evaluate(() => { const z = document.querySelector('[data-card="zones"]'); return z && !z.querySelector(".form-row b") && z.textContent.includes("My scouted zone <b>x</b>"); }));
    /* reload persistence */
    await p.reload({ waitUntil: "domcontentloaded" }); await p.waitForTimeout(900);
    await L.go(p, "ollie", "gac");
    const reloaded = await p.evaluate(() => ({ mine: gacData().zones.filter(gcoIsRow).length, user: gacData().zones.filter(x => !gcoIsRow(x)).length }));
    L.ck("applied rows survive a reload alongside user rows", reloaded.mine === 4 && reloaded.user === userZones, JSON.stringify(reloaded));
    /* re-apply replaces only optimiser rows */
    await p.evaluate(() => { sectionView("gac", "defense"); gcoRun("ollie"); gcoApply("ollie"); });
    await p.waitForTimeout(200);
    L.ck("re-Apply confirm says it replaces the 4 existing optimiser rows", await p.evaluate(() => /Replaces the 4 optimiser rows/.test(document.querySelector(".gco-confirm").textContent)));
    await p.evaluate(() => gcoConfirm("ollie"));
    await p.waitForTimeout(200);
    L.ck("re-Apply leaves exactly 4 optimiser rows (no duplicates) and user rows intact", await p.evaluate(([z]) => gacData().zones.filter(gcoIsRow).length === 4 && gacData().zones.filter(x => !gcoIsRow(x)).length === z, [userZones]));
    /* Reset removes only optimiser rows */
    await p.evaluate(() => { sectionView("gac", "defense"); gcoRun("ollie"); });
    await p.waitForTimeout(200);
    L.ck("Reset button shows the count of optimiser rows in the planner", await p.evaluate(() => /Reset \(4 in planner\)/.test(document.querySelector('[data-card="gco"] .gco-actions').textContent)));
    await p.evaluate(() => gcoReset("ollie"));
    await p.waitForTimeout(200);
    L.ck("Reset removes the optimiser rows only (user rows + offense untouched, persisted)", await p.evaluate(([z, o]) => gacData().zones.filter(gcoIsRow).length === 0 && gacData().zones.length === z && gacData().offense.length === o && JSON.parse(localStorage.getItem("swgoh-tracker")).gac.ollie.zones.length === z, [userZones, userOff]));
    /* Tiny account: card + apply work there too and never touch Ollie's planner */
    await L.go(p, "tiny", "gac");
    await p.evaluate(() => { sectionView("gac", "defense"); gcoRun("tiny"); });
    await p.waitForTimeout(200);
    L.ck("Tiny's plan card renders with its own title", /— Tiny$/.test((await p.$eval('[data-card="gco"] .gco-plan-title', e => e.textContent)).trim()));
    await p.evaluate(() => { gcoApply("tiny"); gcoConfirm("tiny"); });
    await p.waitForTimeout(200);
    L.ck("Applying on Tiny writes Tiny's planner only", await p.evaluate(([z]) => state.gac.tiny.zones.filter(gcoIsRow).length === 4 && state.gac.ollie.zones.filter(gcoIsRow).length === 0 && state.gac.ollie.zones.length === z, [userZones]));
    L.ck("buttons are ≥ 44 px tall on coarse pointers (CSS rule present)", await p.evaluate(() => [...document.styleSheets].some(s => { try { return [...s.cssRules].some(r => r.media && /coarse/.test(r.media.mediaText) && /\.gco-btn/.test(r.cssText) && /44px/.test(r.cssText)); } catch (e) { return false; } })));
    L.ck("no page errors (UI flow)", errs.length === 0, JSON.stringify(errs.slice(0, 3)));
    await ctx.close();
  }

  /* ---- 4. refused while a legacy migration is pending ---- */
  {
    const { ctx, p, errs } = await L.open(b, { tag: "migr" });
    await L.go(p, "ollie", "gac");
    const r = await p.evaluate(() => {
      state.legacyMigration = { pending: true, legacyGac: { initialized: true, zones: [{ zone: "old", defIdx: "", note: "legacy" }], offense: [] }, legacyCq: null, shared: { gac: false, cq: false }, resolved: "", resolvedAt: 0, legacyUpdates: {}, assignmentBackups: {} };
      const before = JSON.stringify(state.gac.ollie);
      /* gcf (deliberate change): gcoUi.pending is per account now. */
      gcoRun("ollie"); gcoApply("ollie"); const hadConfirm = !!gcoUi.pending.ollie; gcoConfirm("ollie");
      return { hadConfirm, unchanged: JSON.stringify(state.gac.ollie) === before, pendingCleared: !gcoUi.pending.ollie, ok: preparePlannerWrite("gac") === false };
    });
    L.ck("Apply is refused while the legacy migration is pending (planner untouched)", r.hadConfirm && r.unchanged && r.pendingCleared && r.ok, JSON.stringify(r));
    L.ck("no page errors (migration guard)", errs.length === 0, JSON.stringify(errs.slice(0, 3)));
    await ctx.close();
  }

  /* ---- 5. 390 px: plan open, confirm open, no horizontal overflow, controls tall enough ---- */
  {
    const { ctx, p, errs } = await L.open(b, { width: 390, height: 844, tag: "m390" });
    await L.go(p, "ollie", "gac");
    await p.evaluate(() => { sectionView("gac", "defense"); gcoRun("ollie"); gcoApply("ollie"); });
    await p.waitForTimeout(300);
    const o = await L.overflow(p);
    L.ck("[390] no horizontal overflow with plan + confirm open", o.doc <= o.inner + 1, JSON.stringify(o));
    const cardW = await p.evaluate(() => { const c = document.querySelector('[data-card="gco"]'); return { w: c.getBoundingClientRect().width, sw: c.scrollWidth, cw: c.clientWidth }; });
    L.ck("[390] plan card content does not overflow its box", cardW.sw <= cardW.cw + 1, JSON.stringify(cardW));
    const h = await p.evaluate(() => [...document.querySelectorAll('[data-card="gco"] .gco-btn, #gcoFmtNav button')].map(b => Math.round(b.getBoundingClientRect().height)));
    L.ck("[390] action/format buttons are at least 40 px tall (44 under coarse pointer)", h.length >= 4 && h.every(x => x >= 40), h.join());
    await L.go(p, "tiny", "gac");
    await p.evaluate(() => { gcoRun("tiny"); });
    await p.waitForTimeout(200);
    const o2 = await L.overflow(p);
    L.ck("[390] Tiny plan: no horizontal overflow", o2.doc <= o2.inner + 1, JSON.stringify(o2));
    L.ck("[390] no page errors", errs.length === 0, JSON.stringify(errs.slice(0, 3)));
    await ctx.close();
  }

  /* ---- 6. no pulls at all: card still renders from the built-in baseline without errors ---- */
  {
    const { ctx, p, errs } = await L.open(b, { tag: "nopulls", pulls: false });
    await L.go(p, "ollie", "gac");
    const r = await p.evaluate(() => { sectionView("gac", "defense"); gcoRun("ollie"); const pl = gcoPlanFor("ollie"); return { slots: pl.squadSlots.length + pl.fleetSlots.length, title: !!document.querySelector(".gco-plan-title"), league: pl.league.key, auto: pl.leagueAuto }; });
    L.ck("without any pull the card renders from BASELINE, Carbonite default, no crash", r.slots === 4 && r.title && r.league === "carbonite" && r.auto, JSON.stringify(r));
    L.ck("no page errors (no pulls)", errs.length === 0, JSON.stringify(errs.slice(0, 3)));
    await ctx.close();
  }

  await L.finish(b, srv);
})().catch(e => { console.error(e); process.exit(2); });
