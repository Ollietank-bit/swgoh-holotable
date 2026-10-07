/* gof — GAC Optimise card 'Offence plan' suite (7 Oct 2026).
   Covers: offence plan properties for both accounts × both formats (legal: no unit twice across defence + offence,
   leaders owned 7★ ≥ G10, ≥ 3 owned members, one GL per squad, raid builds out, bench ≤ GOF_MAX, unowned never
   claimed in planner rows), counter-text mapping (conservative), reference counter squads, keep-for-offence priority,
   UI (second primary button, section, assumption wording, chips, format switch, defence-only path untouched),
   Apply/confirm/replace/Reset with user-edited rows, pristine grammar, cross-account isolation, copy text, Cloud
   Sync row semantics (uniqueRows/threeWayRows), legacy-migration refusal, performance, 390 px no overflow, zero
   page errors, screenshots. */
const L = require("./lib.js");
const { ck } = L;
const SHOTS = L.path.join(L.ROOT, "shots");
try { L.fs.mkdirSync(SHOTS, { recursive: true }); } catch (e) {}
const openBoth = async (p, acct) => { await L.go(p, acct, "gac"); await p.evaluate(a => { sectionView("gac", "defense"); gofRun(a); }, acct); await p.waitForTimeout(250); };
const PLAN = ([a, f]) => { switchAcct(a); state.views["gco-" + a] = f; const def = gcoPlanFor(a), off = gofPlanFor(a);
  const reqs = state.pulls[a].reqs;
  return { fmt: off.fmt, max: off.max, ms: off.ms, defMs: def.ms,
    def: def.squadSlots.map(x => x.cand ? { name: x.cand.name, keys: x.cand.keys, units: x.cand.rows.map(r => r.name) } : null).filter(Boolean),
    defFleetKeys: def.fleetSlots.flatMap(x => x.cand ? x.cand.keys : []),
    off: off.picked.map(c => ({ name: c.name, keys: c.keys, units: c.rows.map(r => r.name), owned: c.rows.map(r => r.owned), ready: c.rows.map(r => r.ready),
      lead: { owned: c.rows[0].owned, stars: c.rows[0].stars, gear: c.rows[0].gear, name: c.rows[0].name }, gl: c.members.filter(m => GL_IDS.includes(m[0])).length, ownedN: c.ownedN, sevenN: c.rows.filter(r => r.owned && r.stars >= 7).length,
      into: c.into, raid: !!(c.sq.raidTier || /raid/i.test(c.sq.mode || "")), ref: c.ref, blocked: c.blocked, clash: c.clash.length })),
    fleet: off.fleet ? { name: off.fleet.name, keys: off.fleet.keys } : null,
    rows: gofPlannerRows(off), skipped: off.skipped, lookup: off.lookup,
    unownedNames: [].concat(...off.picked.map(c => c.rows.filter(r => !r.owned).map(r => r.name))) }; };

(async () => {
  const srv = await L.serve(); const b = await L.chromium.launch({ headless: true });

  /* ---- 1. plan properties, both accounts × both formats ---- */
  {
    const { ctx, p, errs } = await L.open(b, { tag: "plan" });
    await L.go(p, "ollie", "gac");
    const defs = await p.evaluate(() => GAC_COUNTERS.map(c => c.def));
    for (const acct of ["ollie", "tiny"]) for (const fmt of ["5v5", "3v3"]) {
      const tag = `${acct}/${fmt}`;
      const a = await p.evaluate(PLAN, [acct, fmt]), a2 = await p.evaluate(PLAN, [acct, fmt]);
      const strip = x => JSON.stringify({ ...x, ms: 0, defMs: 0 });
      ck(`[${tag}] offence plan is deterministic on repeat and uses the requested format`, strip(a) === strip(a2) && a.fmt === fmt, a.off.map(c => c.name).join("|"));
      const keys = [].concat(...a.def.map(d => d.keys), ...a.off.map(c => c.keys));
      ck(`[${tag}] no unit key appears twice across defence + offence squads`, new Set(keys).size === keys.length, keys.join("|").slice(0, 300));
      const names = a.def.map(d => d.name).concat(a.off.map(c => c.name));
      ck(`[${tag}] no squad appears twice across defence + offence`, new Set(names).size === names.length, names.join("|"));
      ck(`[${tag}] bench has 1..${a.max} squads (GOF_MAX) and is never empty on this roster`, a.off.length >= 1 && a.off.length <= a.max, String(a.off.length));
      ck(`[${tag}] every offence leader is owned, 7★ and ≥ G10`, a.off.every(c => c.lead.owned && c.lead.stars >= 7 && c.lead.gear >= 10), JSON.stringify(a.off.map(c => c.lead)));
      ck(`[${tag}] every offence squad has ≥ 3 owned 7★ members, no blocked/clashing squad chosen`, a.off.every(c => c.ownedN >= Math.min(3, c.units.length) && c.sevenN >= Math.min(3, c.units.length) && !c.blocked && !c.clash), JSON.stringify(a.off.map(c => [c.ownedN, c.sevenN])));
      ck(`[${tag}] one Galactic Legend per squad, no raid builds`, a.off.every(c => c.gl <= 1 && !c.raid));
      ck(`[${tag}] 3v3 squads field 3 units, 5v5 at most 5`, a.off.every(c => fmt === "3v3" ? c.units.length === 3 : c.units.length <= 5), JSON.stringify(a.off.map(c => c.units.length)));
      const rowText = a.rows.map(r => r.squad).join("\n");
      ck(`[${tag}] planner rows never name an unowned unit as set-able; each row tagged, numbered and format-stamped`, a.unownedNames.every(n => !rowText.includes(n)) && a.rows.filter(r => /#\d+:/.test(r.squad)).length === a.off.length && a.rows.every(r => r.squad.startsWith(`⚔ Optimiser (${fmt}) `)), rowText.slice(0, 300));
      ck(`[${tag}] every 'good into' entry is a GAC_COUNTERS defence; zone text is one of ours`, a.off.every(c => c.into.every(d => defs.includes(d))) && a.rows.every(r => /^good into: /.test(r.zone) || r.zone === "no counter match in this app's reference — use where it fits" || r.zone === "fleet attack"), JSON.stringify(a.rows.map(r => r.zone)));
      ck(`[${tag}] offence fleet (if any) is not the defence fleet`, !a.fleet || !a.fleet.keys.some(k => a.defFleetKeys.includes(k)), JSON.stringify(a.fleet));
      ck(`[${tag}] skipped list explains every non-chosen candidate (defence clash / blocked / shares / cut)`, a.skipped.length > 0 && a.skipped.every(k => /placed on your defence plan|on your defence plan|not owned|needs 7★|too low|members|shares .* with|bench is full|scored below/.test(k.reason)), JSON.stringify(a.skipped.slice(0, 4)));
      ck(`[${tag}] lookup rows only list READY answers with a status`, a.lookup.every(r => defs.includes(r.def) && r.opts.length > 0 && r.opts.every(o => /offence #\d+|on your defence plan|shares .* with your defence plan|eligible, below the bench cut|leader owned/.test(o.status))), JSON.stringify(a.lookup.slice(0, 3)));
      ck(`[${tag}] offence plan computed in under 150 ms (defence ${a.defMs} ms + offence ${a.ms} ms)`, a.ms + a.defMs < 150, `${a.ms} + ${a.defMs} ms`);
      console.error(`PLAN ${tag}: DEF ${a.def.map(d => d.name).join(" | ")} || OFF ${a.off.map((c, i) => `#${i + 1} ${c.name} [${c.units.map((u, j) => u + (c.owned[j] ? "" : "(unowned)")).join(", ")}]${c.into.length ? " into: " + c.into.join("; ") : ""}`).join(" | ")} || FLEET ${a.fleet ? a.fleet.name : "-"}`);
    }
    /* counter-text mapping is conservative, reference squads are real */
    const m = await p.evaluate(() => {
      const map = t => gofMapOptions(t).map(x => x.meta || x.lead);
      return { generic: [map("Empire burst"), map("a Rebel burst squad"), map("a Jedi burst squad"), map("Padme Amidala (Naboo/Separatist)")],
        rey: map("GL Rey (Jedi squad)"), both: GAC_COUNTERS.map(c => gofOptions(c).length), traya: gofOptions({ counter: "Sith Eternal Emperor (GL) or Darth Revan/Darth Traya (Sith Empire)" }).map(map),
        refs: gofRefSquads().map(sq => ({ name: sq.name, n: sq.members.length, lead: sq.members[0][1], tl: !!tierListEntry("3v3", sq.tl3v3) || !!tierListEntry("5v5", sq.tl5v5) })),
        into: { thrawn: gofGoodInto("Grand Admiral Thrawn Empire"), rey: gofGoodInto("Rey (GL) Jedi"), bossk: gofGoodInto("Bossk Bounty Hunters"), see: gofGoodInto("Sith Eternal Emperor (counter squad)") } };
    });
    ck("generic counter advice maps to nothing; named leaders map once", JSON.stringify(m.generic.slice(0, 3)) === "[[],[],[]]" && JSON.stringify(m.generic[3]) === '["Padmé Amidala"]' && JSON.stringify(m.rey) === '["Rey (GL) Jedi"]', JSON.stringify(m.generic));
    ck("'A or B' counter text splits into two options; 'Darth Revan/Darth Traya' maps to both", m.both.every(n => n >= 1 && n <= 2) && JSON.stringify(m.traya) === '[["Sith Eternal Emperor"],["Darth Traya Sith","Darth Revan"]]', JSON.stringify(m.traya));
    ck("reference counter squads built from GAC_COUNTERS: Sith Eternal Emperor, Great Mothers, Bo-Katan (≥ 3 members, on a tier list)", m.refs.length === 3 && m.refs.every(r => r.n >= 3 && r.tl && r.name === `${r.lead} (counter squad)`) && m.refs.map(r => r.lead).sort().join("|") === "Bo-Katan (Mand'alor)|Great Mothers|Sith Eternal Emperor", JSON.stringify(m.refs));
    ck("gofGoodInto: Thrawn → Great Mothers; Rey → SLKR + SEE; SEE counter squad → 6 defences; Bossk → none", JSON.stringify(m.into.thrawn) === '["Great Mothers (Nightsisters)"]' && m.into.rey.includes("Supreme Leader Kylo Ren (GL)") && m.into.rey.includes("Sith Eternal Emperor (GL)") && m.into.see.length >= 5 && m.into.bossk.length === 0, JSON.stringify(m.into));
    ck("no page errors (plan)", errs.length === 0, JSON.stringify(errs.slice(0, 3)));
    await ctx.close();
  }

  /* ---- 2. keep-for-offence makes the kept squad the priority pick; unowned member scenario ---- */
  {
    const { ctx, p, errs } = await L.open(b, { tag: "keep" });
    await openBoth(p, "ollie");
    const r = await p.evaluate(() => {
      state.views["gco-ollie"] = "5v5";
      const d0 = gcoPlanFor("ollie"), reyKey = "GLREY";
      const before = { onDef: d0.squadSlots.some(x => x.cand && x.cand.keys.includes(reyKey)), off: gofPlanFor("ollie").picked.map(c => c.name) };
      gcfKeepToggle("ollie", reyKey);
      const o = gofPlanFor("ollie"), d = gcoPlanFor("ollie");
      const sec = document.getElementById("gof-ollie");
      const out = { before, first: o.picked[0] && o.picked[0].name, held: o.picked[0] && o.picked[0].held, why: o.picked[0] && o.picked[0].why, defHasRey: d.squadSlots.some(x => x.cand && x.cand.keys.includes(reyKey)),
        chip: sec ? [...sec.querySelectorAll(".chip.keep")].map(x => x.textContent.trim()) : null, summary: sec ? sec.querySelector(".gco-summary").textContent : "", keys: Object.keys(state).filter(k => /gof/i.test(k)) };
      gcfKeepToggle("ollie", reyKey);
      out.after = gofPlanFor("ollie").picked.map(c => c.name);
      return out;
    });
    ck("before: Rey (GL) sits on defence and is not on the bench", r.before.onDef && !r.before.off.includes("Rey (GL) Jedi"), JSON.stringify(r.before));
    ck("Keep-for-offence Rey → 'Rey (GL) Jedi' becomes offence #1 with 'held back for offence' and leaves defence", r.first === "Rey (GL) Jedi" && r.held.includes("Rey (GL)") && /held back for offence/.test(r.why) && !r.defHasRey, JSON.stringify([r.first, r.held, r.defHasRey]));
    ck("the card shows a '✓ kept for offence' chip and counts the priority pick in the summary", r.chip && r.chip.length === 1 && /kept for offence/.test(r.chip[0]) && /1 priority pick/.test(r.summary), JSON.stringify([r.chip, r.summary.slice(0, 120)]));
    ck("un-keeping restores the previous bench; no new state keys", JSON.stringify(r.after) === JSON.stringify(r.before.off) && r.keys.length === 0, JSON.stringify(r.after));
    /* unowned member: delete a non-leader from the top bench squad → still chosen, flagged, never claimed */
    const u = await p.evaluate(() => {
      const c = gofPlanFor("ollie").picked[0]; const victim = c.members.slice(1).find(m => m[0] && state.pulls.ollie.reqs[m[0]]);
      delete state.pulls.ollie.reqs[victim[0]]; state.pulls.ollie = Object.assign({}, state.pulls.ollie, { fetchedAt: state.pulls.ollie.fetchedAt + 1 });
      renderGac();
      const o = gofPlanFor("ollie"), x = o.picked.find(q => q.name === c.name), row = gofPlannerRows(o)[o.picked.indexOf(x)];
      const el = [...document.querySelectorAll("#gof-ollie .gof-slot")].find(e => e.querySelector(".gco-name").textContent === c.name);
      return { name: c.name, victim: victim[1], still: !!x, unowned: x && x.rows.filter(q => !q.owned).map(q => q.name), note: row && row.squad, chips: el ? el.querySelectorAll(".gcf-unowned").length : -1, pristine: row ? gofIsPristine(row) : null };
    });
    ck("an extra unowned member keeps the squad on the bench, flagged 'unowned', absent from the planner row, row still pristine", u.still && u.unowned.includes(u.victim) && !u.note.includes(u.victim) && / \+ fill \d+ slots? yourself$/.test(u.note) && u.chips >= 1 && u.pristine === true, JSON.stringify(u));
    ck("no page errors (keep/unowned)", errs.length === 0, JSON.stringify(errs.slice(0, 3)));
    await ctx.close();
  }

  /* ---- 3. UI: buttons, section, wording, format switch, defence-only path ---- */
  {
    const { ctx, p, errs } = await L.open(b, { tag: "ui" });
    await L.go(p, "ollie", "gac"); await p.evaluate(() => sectionView("gac", "defense")); await p.waitForTimeout(200);
    const c0 = await p.evaluate(() => { const btns = [...document.querySelectorAll('[data-card="gco"] .gco-ctl .gco-btn')]; return { labels: btns.map(x => x.textContent.trim()), firstPrimary: document.querySelector('[data-card="gco"] .gco-btn.primary').textContent.trim(), gof: !!document.getElementById("gof-ollie"), title: document.querySelector('[data-card="gco"] .cardtitle').textContent }; });
    ck("collapsed card: 'Optimise defence' stays the first primary button; 'Optimise defence + offence' is added beside it; no offence section", c0.labels.join("|") === "Optimise defence|Optimise defence + offence" && c0.firstPrimary === "Optimise defence" && !c0.gof && /^Optimise defence —/.test(c0.title.replace(/\s+/g, " ")), JSON.stringify(c0));
    await p.click('[data-card="gco"] .gco-btn.primary'); await p.waitForTimeout(250);
    const c1 = await p.evaluate(() => ({ gof: !!document.getElementById("gof-ollie"), plan: !!document.querySelector('[data-card="gco"] .gco-plan-title'), apply: document.querySelector('[data-card="gco"] .gco-actions .gco-btn.primary').textContent.trim(), text: gcfPlanText(gcoPlanFor("ollie"), "ollie"), title: document.querySelector('[data-card="gco"] .cardtitle').textContent }));
    ck("defence-only button: plan opens WITHOUT the offence section; Apply/Copy text unchanged", c1.plan && !c1.gof && c1.apply === "Apply to planner" && !/Offence order/.test(c1.text) && c1.text.split("\n").length === 5 && !/\+ offence/.test(c1.title), JSON.stringify([c1.apply, c1.text.split("\n").length]));
    await p.click('[data-card="gco"] .gco-btn.gof-run'); await p.waitForTimeout(300);
    const c2 = await p.evaluate(() => { const g = document.getElementById("gof-ollie"); const o = gofPlanFor("ollie");
      return { gof: !!g, title: document.querySelector('[data-card="gco"] .cardtitle').textContent.replace(/\s+/g, " "), btn: document.querySelector('[data-card="gco"] .gof-run').textContent.trim(), apply: document.querySelector('[data-card="gco"] .gco-actions .gco-btn.primary').textContent.trim(),
        slots: g.querySelectorAll(".gof-slot").length, n: o.picked.length, nums: [...g.querySelectorAll(".gof-num")].map(x => x.textContent).join(","), rule: g.querySelector(".gof-rule").textContent, head: g.querySelector(".gof-title").textContent,
        whys: g.querySelectorAll(".gof-slot .gco-why").length, into: g.querySelectorAll(".gof-into").length, fleet: g.querySelector(".gof-fleet").textContent, folds: [...g.querySelectorAll("details > summary")].map(s => s.textContent.trim()), region: g.getAttribute("role"),
        mods: g.querySelectorAll(".gof-slot .chrome-gearbtn").length, afterDef: g.previousElementSibling.className, beforeActions: g.nextElementSibling.className, hint: (g.querySelector(".gcf-assume") || {}).textContent || "" }; });
    ck("'Optimise defence + offence' opens both halves; title, button and Apply labels say so", c2.gof && /^Optimise defence \+ offence —/.test(c2.title) && c2.btn === "Re-optimise defence + offence" && c2.apply === "Apply defence + offence to planner", JSON.stringify([c2.title, c2.btn, c2.apply]));
    ck("offence section sits after the defence summary and before the actions, one numbered slot per bench squad, Why + Good-into + Mods per slot", c2.afterDef === "gco-summary" && c2.beforeActions === "gco-actions" && c2.slots === c2.n && c2.nums === Array.from({ length: c2.n }, (_, i) => i + 1).join(",") && c2.whys === c2.n && c2.into === c2.n && c2.mods === c2.n && c2.region === "region", JSON.stringify([c2.slots, c2.n, c2.nums, c2.afterDef, c2.beforeActions]));
    ck("rule line states the assumptions: defence units excluded (not verified), one GL per squad, bench ≠ attack count", /did not use/.test(c2.rule) && /not verified by this app/.test(c2.rule) && /One Galactic Legend per squad/.test(c2.rule) && /not the number of attacks the game allows/.test(c2.rule) && /up to \d+/.test(c2.head), c2.rule.slice(0, 200));
    ck("GL hint appears when the defence plan took every eligible GL (Ollie owns SLKR, Jabba, Rey)", /took every eligible Galactic Legend/.test(c2.hint) && /Keep for offence/.test(c2.hint), c2.hint.slice(0, 160));
    ck("fleet-attack line names a fleet not on defence and says fleets are a separate pool", /Fleet attack:/.test(c2.fleet) && /separate pool/.test(c2.fleet), c2.fleet.slice(0, 160));
    ck("three folds: lookup (ready counters only), skipped candidates, how offence is scored", c2.folds.length === 3 && /If you see X on defence → use Y \(ready counters only\)/.test(c2.folds[0]) && /skipped and why \(\d+\)/.test(c2.folds[1]) && /How offence is scored/.test(c2.folds[2]), JSON.stringify(c2.folds));
    const look = await p.evaluate(() => { const g = document.getElementById("gof-ollie"); const rows = [...g.querySelectorAll(".gof-look-row")]; const o = gofPlanFor("ollie");
      return { n: rows.length, planN: o.lookup.length, defs: rows.map(r => r.querySelector(".gof-look-def").textContent), opts: rows.map(r => [...r.querySelectorAll(".gof-look-opt")].map(x => x.className + ":" + x.textContent)), fine: g.querySelector(".gof-look").previousElementSibling.textContent }; });
    ck("lookup fold renders one row per defence with a ready answer, status per option, no win rates claimed", look.n === look.planN && look.n >= 3 && look.opts.every(o => o.length >= 1) && /no win rates are claimed/.test(look.fine) && !/%/.test(JSON.stringify(look.opts)), JSON.stringify(look.defs));
    /* format switch via the pills re-renders the offence half */
    await p.click("#gcoFmtNav button:not(.active)"); await p.waitForTimeout(300);
    const f = await p.evaluate(() => { const g = document.getElementById("gof-ollie"); const o = gofPlanFor("ollie"); return { fmt: o.fmt, head: g.querySelector(".gof-title").textContent, units: o.picked.map(c => c.rows.length), gof: !!g, pending: !!gcoUi.pending.ollie }; });
    ck("format pill switch keeps the offence half open and re-plans for the other format", f.gof && f.head.includes(f.fmt) && f.units.every(n => f.fmt === "3v3" ? n === 3 : n <= 5), JSON.stringify(f));
    /* escaping: a hostile squad name never reaches the DOM unescaped */
    const esc = await p.evaluate(() => { const sq = { name: "<img src=x onerror=window.__gofx=1>", mode: "GAC off", members: [["SUPREMELEADERKYLOREN", "Supreme Leader Kylo Ren (GL)"], ["KYLORENUNMASKED", "Kylo Ren (Unmasked)"], ["GENERALHUX", "General Hux"]] };
      const c = gofCandidate(sq, "3v3", state.pulls.ollie.reqs, [], new Map()); const html = gofSlotHtml(c, 0, "ollie"); const d = document.createElement("div"); d.innerHTML = html; return { safe: !html.includes("<img src=x") && d.querySelector("img") === null, x: window.__gofx }; });
    ck("squad names are escaped in the offence slot HTML", esc.safe && !esc.x, JSON.stringify(esc));
    ck("no page errors (UI)", errs.length === 0, JSON.stringify(errs.slice(0, 3)));
    await ctx.close();
  }

  /* ---- 4. Apply / confirm / replace / Reset with user-edited rows; defence-only apply leaves offence rows alone ---- */
  {
    const { ctx, p, errs } = await L.open(b, { tag: "apply" });
    await openBoth(p, "ollie");
    await p.evaluate(() => { state.views["gco-ollie"] = "5v5"; sectionView("gac", "plan"); gacOffAdd(); gacOffSet(gacData().offense.length - 1, "squad", "My own <b>CLS</b> team"); sectionView("gac", "defense"); gofRun("ollie"); });
    await p.waitForTimeout(200);
    const userOff = await p.evaluate(() => gacData().offense.length), userZones = await p.evaluate(() => gacData().zones.length);
    await p.evaluate(() => gcoApply("ollie")); await p.waitForTimeout(200);
    const conf = await p.evaluate(() => { const c = document.querySelector(".gco-confirm"); const p0 = gcoUi.pending.ollie; return { txt: c.textContent.replace(/\s+/g, " "), li: c.querySelectorAll("li").length, off: p0.off && p0.off.length, rows: p0.rows.length, written: gacData().offense.length }; });
    ck("Apply (both halves) builds ONE confirm listing defence rows + offence rows; nothing written yet", /Apply this 5v5 defence \+ offence plan/.test(conf.txt) && /Offence: writes \d+ rows into “Offense \/ banner order”/.test(conf.txt) && conf.li === conf.rows + conf.off && conf.off >= 2 && conf.written === userOff, JSON.stringify([conf.li, conf.rows, conf.off]));
    ck("confirm counts the user's own offence row as kept content", new RegExp(`${userOff} offense row`).test(conf.txt) && /nothing of yours is overwritten/.test(conf.txt), conf.txt.slice(-300));
    await p.evaluate(() => gcoConfirm("ollie")); await p.waitForTimeout(200);
    const w1 = await p.evaluate(([uo, uz]) => { const off = gacData().offense, zs = gacData().zones; const saved = JSON.parse(localStorage.getItem("swgoh-tracker")).gac.ollie.offense;
      return { mine: off.filter(gofIsRow).length, pristine: off.filter(gofIsPristine).length, user: off.filter(o => !gofIsRow(o)).length, keptUser: off.some(o => o.squad === "My own <b>CLS</b> team"), order: off.map(o => gofIsRow(o) ? "o" : "u").join(""), zonesMine: zs.filter(gcoIsPristine).length, saved: saved.filter(o => /⚔ Optimiser/.test(o.squad)).length, init: state.gac.ollie.initialized, uo, uz, zTotal: zs.length }; }, [userOff, userZones]);
    ck("confirmed: offence rows appended after the user's row (pristine, persisted), defence rows written too, user rows intact", w1.mine >= 3 && w1.pristine === w1.mine && w1.user === w1.uo && w1.keptUser && /^u+o+$/.test(w1.order) && w1.zonesMine === 4 && w1.saved === w1.mine && w1.init && w1.zTotal === w1.uz + 4, JSON.stringify(w1));
    /* Scout & plan offence table shows them, escaped, numbered */
    await p.evaluate(() => sectionView("gac", "plan")); await p.waitForTimeout(200);
    const tbl = await p.evaluate(() => { const rows = [...document.querySelectorAll('[data-card="offense"] .form-row')]; return { n: rows.length, txt: rows.map(r => r.querySelector(".txt").textContent).join("|"), html: document.querySelector('[data-card="offense"]').innerHTML.includes("<b>CLS</b>") }; });
    ck("Offense / banner order table lists the ⚔ rows after the user's row, escaped", tbl.n === w1.mine + w1.user && /⚔ Optimiser \(5v5\) #1:/.test(tbl.txt) && !tbl.html, tbl.txt.slice(0, 200));
    /* user edits one optimiser offence row's squad text and one row's zone target; a third stays untouched */
    const idx = await p.evaluate(() => { const off = gacData().offense; const mine = off.map((o, i) => gofIsRow(o) ? i : -1).filter(i => i >= 0); gacOffSet(mine[0], "squad", off[mine[0]].squad + " (my tweak)"); gacOffSet(mine[1], "zone", "Front zone — top, 2nd attack"); return mine; });
    await p.waitForTimeout(150);
    const unit = await p.evaluate(() => { const off = gacData().offense; const row = gofPlannerRows(gofPlanFor("ollie"))[0]; const fleetRow = gofPlannerRows(gofPlanFor("ollie")).find(r => /fleet:/.test(r.squad));
      return { edited: off.filter(o => gofIsRow(o) && !gofIsPristine(o)).length, pristine: off.filter(gofIsPristine).length, fresh: gofIsPristine(row), zoneEdit: gofIsPristine(Object.assign({}, row, { zone: "Front zone" })), sqEdit: gofIsPristine(Object.assign({}, row, { squad: row.squad + " x" })),
        fake: gofIsPristine({ squad: "⚔ Optimiser (5v5) #1: Fennec Shand Mercs (GL-killer) — Han Solo (L), Chewbacca", zone: "good into: Great Mothers (Nightsisters)" }), fakeZone: gofIsPristine(Object.assign({}, row, { zone: "good into: Something I typed" })), fleet: fleetRow ? gofIsPristine(fleetRow) : null, fleetEdit: fleetRow ? gofIsPristine(Object.assign({}, fleetRow, { zone: "fleet attack 2" })) : null, notOurs: gofIsPristine({ squad: "CLS", zone: "" }), nul: gofIsPristine(null) }; });
    ck("gofIsPristine: untouched yes; edited squad text / typed zone / unknown units / invented 'good into' / edited fleet zone / user rows no", unit.edited === 2 && unit.pristine >= 1 && unit.fresh && !unit.zoneEdit && !unit.sqEdit && !unit.fake && !unit.fakeZone && unit.fleet === true && unit.fleetEdit === false && !unit.notOurs && !unit.nul, JSON.stringify(unit));
    await p.evaluate(() => { sectionView("gac", "defense"); gofRun("ollie"); }); await p.waitForTimeout(200);
    const lbl = await p.$eval('[data-card="gco"] .gco-actions', e => e.textContent);
    ck("Reset button counts untouched zone rows + untouched offence rows separately", new RegExp(`Reset \\(4 \\+ ${w1.mine - 2} offence in planner\\)`).test(lbl), lbl.replace(/\s+/g, " ").slice(0, 120));
    await p.evaluate(() => gcoApply("ollie")); await p.waitForTimeout(150);
    const conf2 = await p.$eval(".gco-confirm", e => e.textContent.replace(/\s+/g, " "));
    ck("re-Apply confirm: replaces the untouched offence rows, keeps the 2 you edited (and still 'Replaces the 4 optimiser rows' for defence)", new RegExp(`Replaces the ${w1.mine - 2} offence optimiser row`).test(conf2) && /Keeps the 2 offence optimiser rows you have edited/.test(conf2) && /Replaces the 4 optimiser rows already in the planner/.test(conf2), conf2.slice(-500));
    await p.evaluate(() => gcoConfirm("ollie")); await p.waitForTimeout(200);
    const w2 = await p.evaluate(() => { const off = gacData().offense; return { mine: off.filter(gofIsRow).length, pristine: off.filter(gofIsPristine).length, edited: off.filter(o => gofIsRow(o) && !gofIsPristine(o)).length, tweak: off.some(o => / \(my tweak\)$/.test(o.squad)), zone: off.some(o => o.zone === "Front zone — top, 2nd attack"), user: off.filter(o => !gofIsRow(o)).length }; });
    ck("re-Apply keeps the 2 edited offence rows byte-identical and replaces only the pristine ones (no duplicates)", w2.edited === 2 && w2.tweak && w2.zone && w2.pristine === w1.mine && w2.mine === w1.mine + 2 && w2.user === userOff, JSON.stringify(w2));
    /* defence-only Apply (offence half closed) must not touch offence rows */
    await p.evaluate(() => { delete gofUi.open.ollie; gcoRun("ollie"); gcoApply("ollie"); }); await p.waitForTimeout(150);
    const d1 = await p.evaluate(() => ({ off: gcoUi.pending.ollie.off, li: document.querySelectorAll(".gco-confirm li").length, txt: document.querySelector(".gco-confirm").textContent }));
    await p.evaluate(() => gcoConfirm("ollie")); await p.waitForTimeout(150);
    const d2 = await p.evaluate(() => { const off = gacData().offense; return { mine: off.filter(gofIsRow).length, pristine: off.filter(gofIsPristine).length }; });
    ck("defence-only Apply: confirm lists 4 defence rows only and leaves every offence optimiser row in place", d1.off === null && d1.li === 4 && !/Offence:/.test(d1.txt) && d2.mine === w2.mine && d2.pristine === w2.pristine, JSON.stringify([d1.off, d1.li, d2]));
    /* Reset removes pristine offence rows only */
    await p.evaluate(() => { gofRun("ollie"); gcoReset("ollie"); }); await p.waitForTimeout(200);
    const rs = await p.evaluate(() => { const off = gacData().offense, zs = gacData().zones; const saved = JSON.parse(localStorage.getItem("swgoh-tracker")).gac.ollie; return { pristine: off.filter(gofIsPristine).length, edited: off.filter(o => gofIsRow(o) && !gofIsPristine(o)).length, user: off.filter(o => !gofIsRow(o)).length, zonesMine: zs.filter(gcoIsRow).length, saved: saved.offense.filter(o => /⚔ Optimiser/.test(o.squad)).length, open: !!gcoUi.open.ollie }; });
    ck("Reset removes pristine offence rows (and pristine zone rows); the 2 edited offence rows + the user's row survive, persisted", rs.pristine === 0 && rs.edited === 2 && rs.user === userOff && rs.zonesMine === 0 && rs.saved === 2 && rs.open, JSON.stringify(rs));
    await p.evaluate(() => gcoReset("ollie")); await p.waitForTimeout(150);
    ck("second Reset with nothing pristine left just closes the card (both halves) and writes nothing", await p.evaluate(([n]) => !gcoUi.open.ollie && !gofUi.open.ollie && gacData().offense.length === n && !document.querySelector("#gof-ollie"), [rs.edited + rs.user]));
    /* legacy migration pending: refused */
    const leg = await p.evaluate(() => { const n = gacData().offense.length; const save = state.legacyMigration;
      state.legacyMigration = { pending: true, legacyGac: { initialized: true, zones: [{ zone: "old", defIdx: "", note: "legacy" }], offense: [] }, legacyCq: null, shared: { gac: false, cq: false }, resolved: "", resolvedAt: 0, legacyUpdates: {}, assignmentBackups: {} };
      gofRun("ollie"); gcoApply("ollie"); gcoConfirm("ollie"); const out = { n, after: state.gac.ollie.offense.length, pending: !!gcoUi.pending.ollie }; state.legacyMigration = save; return out; });
    ck("while legacy migration is pending, confirm is refused and no offence row is written", leg.after === leg.n && !leg.pending, JSON.stringify(leg));
    ck("no page errors (apply)", errs.length === 0, JSON.stringify(errs.slice(0, 3)));
    await ctx.close();
  }

  /* ---- 5. cross-account isolation + copy text + merge semantics ---- */
  {
    const { ctx, p, errs } = await L.open(b, { tag: "iso" });
    await openBoth(p, "ollie");
    await p.evaluate(() => { gcoApply("ollie"); gcoConfirm("ollie"); }); await p.waitForTimeout(200);
    const iso = await p.evaluate(() => { const o = state.gac.ollie.offense.filter(gofIsRow).length; switchAcct("tiny"); const t = (state.gac.tiny || { offense: [] }).offense.filter(gofIsRow).length; const open = { o: !!gofUi.open.ollie, t: !!gofUi.open.tiny }; switchAcct("ollie"); return { o, t, open }; });
    ck("Ollie's offence rows never land in Tiny's planner; the offence half is open per account", iso.o >= 3 && iso.t === 0 && iso.open.o && !iso.open.t, JSON.stringify(iso));
    await openBoth(p, "tiny");
    const tinyPlans = await p.evaluate(() => { const o = gofPlanFor("tiny"), d = gcoPlanFor("tiny"); const keys = [].concat(...d.squadSlots.filter(x => x.cand).map(x => x.cand.keys), ...o.picked.map(c => c.keys)); return { acct: o.acct, n: o.picked.length, dup: new Set(keys).size !== keys.length, apply: document.querySelector('[data-card="gco"] .gco-actions .gco-btn.primary').disabled, pendO: !!gcoUi.pending.ollie }; });
    ck("Tiny's bench is Tiny's (legal, non-empty) and Tiny's Apply is not blocked by Ollie's state", tinyPlans.acct === "tiny" && tinyPlans.n >= 1 && !tinyPlans.dup && !tinyPlans.apply, JSON.stringify(tinyPlans));
    await p.evaluate(() => { gcoApply("tiny"); gcoConfirm("tiny"); }); await p.waitForTimeout(200);
    const both = await p.evaluate(() => ({ o: state.gac.ollie.offense.filter(gofIsRow).map(r => r.squad), t: state.gac.tiny.offense.filter(gofIsRow).map(r => r.squad) }));
    ck("after both applies each account holds only its own ⚔ rows (different benches)", both.o.length >= 3 && both.t.length >= 2 && JSON.stringify(both.o) !== JSON.stringify(both.t), JSON.stringify(both).slice(0, 300));
    /* gcoApply for the wrong account is a no-op */
    ck("gcoApply('ollie') while Tiny is current does nothing", await p.evaluate(() => { delete gcoUi.pending.ollie; gcoApply("ollie"); return !gcoUi.pending.ollie; }));
    /* copy text */
    await openBoth(p, "ollie");
    const text = await p.evaluate(() => ({ t: gcfPlanText(gcoPlanFor("ollie"), "ollie"), ta: document.getElementById("gfCopyText-ollie") ? 1 : (document.getElementById("gcfCopyText-ollie") || {}).value, rows: +document.getElementById("gcfCopyText-ollie").getAttribute("rows"), n: gofPlanFor("ollie").picked.length, fleet: !!gofPlanFor("ollie").fleet }));
    const lines = text.t.split("\n");
    ck("copy text: defence lines, then 'Offence order (… bench, best first — not an attack count):' and numbered attack lines + fleet", lines.length === 5 + 1 + text.n + (text.fleet ? 1 : 0) && /^Offence order \(5v5 bench, best first — not an attack count\):$/.test(lines[5]) && /^1\. .+ \(L\)/.test(lines[6]) && (!text.fleet || /^Fleet attack: /.test(lines[lines.length - 1])), text.t);
    ck("the plain-text fold's textarea carries the same text with enough rows", text.ta === text.t && text.rows === lines.length, String(text.rows));
    await p.evaluate(() => { window.__copied = null; Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: t => { window.__copied = t; return Promise.resolve(); } } }); });
    await p.click('[data-card="gco"] .gcf-copy-btn'); await p.waitForTimeout(200);
    ck("📋 Copy plan copies the combined text", await p.evaluate(() => window.__copied) === text.t);
    /* Cloud Sync row semantics: identity is the whole row */
    const mg = await p.evaluate(() => {
      const rows = gofPlannerRows(gofPlanFor("ollie")); const user = { squad: "mine", zone: "" };
      const base = [user, ...rows], local = [user, ...rows], remoteReset = [user];
      const a = threeWayRows(base, local, remoteReset);                       /* other device Reset → deletion honoured here */
      const edited = Object.assign({}, rows[0], { squad: rows[0].squad + " (edit)" });
      const b2 = threeWayRows(base, [user, edited, ...rows.slice(1)], remoteReset);   /* my edit beats their reset */
      const c = threeWayRows(null, [user, ...rows], [user, ...rows]);          /* same plan applied on two devices → one copy each */
      const d = uniqueRows(rows, rows).length;
      const m = mergeGacPlanner({ zones: [], offense: rows }, { zones: [], offense: [user] });
      const distinct = new Set(rows.map(r => JSON.stringify(r))).size === rows.length;
      return { a: a.length, b: b2.length, bKeep: b2.some(r => / \(edit\)$/.test(r.squad)), c: c.length, d, m: m.offense.length, distinct, n: rows.length };
    });
    ck("threeWayRows: a Reset elsewhere removes untouched ⚔ rows here; an edited row survives it; the same plan on two devices does not duplicate", mg.a === 1 && mg.b === 2 && mg.bKeep && mg.c === mg.n + 1 && mg.d === mg.n && mg.m === mg.n + 1 && mg.distinct, JSON.stringify(mg));
    ck("no page errors (isolation/copy/merge)", errs.length === 0, JSON.stringify(errs.slice(0, 3)));
    await ctx.close();
  }

  /* ---- 6. performance (cold plan) + 390 / 1280 layout + screenshots ---- */
  for (const w of [390, 1280]) {
    const { ctx, p, errs } = await L.open(b, { tag: "w" + w, width: w, height: w === 390 ? 844 : 1000 });
    await openBoth(p, "ollie");
    if (w === 1280) {
      const perf = await p.evaluate(() => { const out = []; for (let i = 0; i < 3; i++) { state.pulls.ollie = Object.assign({}, state.pulls.ollie, { fetchedAt: state.pulls.ollie.fetchedAt + 1, reqs: Object.assign({}, state.pulls.ollie.reqs) }); const t0 = performance.now(); gofPlanFor("ollie"); out.push(performance.now() - t0); } return out; });
      ck("cold defence + offence plan (memo invalidated by a new pull) takes < 150 ms", perf.every(x => x < 150), perf.map(x => x.toFixed(1)).join(", ") + " ms");
      const ky = await p.evaluate(() => { state.views["gcolg-ollie"] = "kyber"; state.views["gco-ollie"] = "3v3"; const t0 = performance.now(); const o = gofPlanFor("ollie"); const ms = performance.now() - t0; const keys = [].concat(...o.def.squadSlots.filter(x => x.cand).map(x => x.cand.keys), ...o.picked.map(c => c.keys)); delete state.views["gcolg-ollie"]; delete state.views["gco-ollie"]; renderGac(); return { ms, dup: new Set(keys).size !== keys.length, n: o.picked.length }; });
      ck("Kyber 3v3 what-if: offence still legal and fast", !ky.dup && ky.ms < 150, JSON.stringify(ky));
    }
    await p.evaluate(() => gcoApply("ollie")); await p.waitForTimeout(250);
    for (const re of [/If you see/, /skipped and why \(/, /How offence is scored/]) {
      const sums = await p.$$('#gof-ollie details > summary');
      for (const s of sums) { if (re.test(await s.textContent())) { await s.click(); break; } }
    }
    await p.waitForTimeout(250);
    const o = await L.overflow(p);
    ck(`[${w}] no horizontal overflow with offence section, all folds and the confirm open`, o.doc <= o.inner + 1, JSON.stringify(o));
    const cw = await p.evaluate(() => { const c = document.querySelector('[data-card="gco"]'); const g = document.getElementById("gof-ollie"); return { sw: c.scrollWidth, cw: c.clientWidth, gw: g.scrollWidth, gc: g.clientWidth, open: [...g.querySelectorAll("details")].filter(d => d.open).length }; });
    ck(`[${w}] card and offence section content fit their boxes (3 folds open)`, cw.sw <= cw.cw + 1 && cw.gw <= cw.gc + 1 && cw.open === 3, JSON.stringify(cw));
    if (w === 390) {
      const h = await p.evaluate(() => [...document.querySelectorAll('[data-card="gco"] .gco-btn')].map(b => Math.round(b.getBoundingClientRect().height)));
      ck("[390] every card button incl. 'Optimise defence + offence' is ≥ 40 px tall", h.length >= 6 && h.every(x => x >= 40), h.join());
    }
    const pos = await p.evaluate(() => { const g = document.getElementById("gof-ollie"); const r = g.getBoundingClientRect(); return { y: r.top + scrollY, h: r.height }; });
    await p.screenshot({ path: L.path.join(SHOTS, `gof-offence-${w}.png`), fullPage: true, clip: { x: 0, y: Math.max(0, pos.y - 20), width: w, height: Math.min(pos.h + 40, 6000) } }).catch(() => {});
    await p.screenshot({ path: L.path.join(SHOTS, `gof-card-${w}.png`), fullPage: true }).catch(() => {});
    ck(`[${w}] no page errors`, errs.length === 0, JSON.stringify(errs.slice(0, 3)));
    await ctx.close();
  }

  await L.finish(b, srv);
})().catch(e => { console.error(e); process.exit(2); });
