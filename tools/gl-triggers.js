#!/usr/bin/env node
/* gl-triggers — should the GL order be re-reviewed? Evaluates, from a compact roster (same format as gl-readiness.js):
     (a) every GL_QUEUE.<account> doneWhen spec (the app's own specMet / specLiveLabel) — e.g. Leia R7, Captain Drogan R7, R2-D2 R8;
     (b) any Legend in the roster (the '*' marker) or in an optional --capture file that is not in GL_ROADMAP (nor the watched unreleased one);
     (c) cost margin between the two cheapest UNOWNED released Legends by relic steps left (glqTiersLeft): if the dearer one costs less than
         35% more than the cheaper -> CLOSE-CALL ("run full review"), else ROUTINE.
   Usage:  NODE_PATH=/home/claude/.npm-global/lib/node_modules node tools/gl-triggers.js <roster.txt> [--account ollie] [--prev prev.json]
                                                                                       [--capture capture.json|.txt] [--save state.json] [--json out.json]
   --prev    state file written earlier by --save (previous run): reports queue-order / step deltas and newly-met doneWhen specs.
   --capture swgoh.gg-style JSON (array of units with base_id + galactic_legend/is_galactic_legend true) OR another compact roster (its '*' items).
   Exit code: 0 ROUTINE, 2 CLOSE-CALL, 1 error. Verdict rule: CLOSE-CALL if (b) fires or (c) margin < 35%; (a) lines are reported either way
   (a newly met doneWhen is an ACTION line: advance the queue; it is not by itself a close call). */
const fs = require("fs");
const { withApp, pageReadiness, parseRoster } = require("./gl-lib.js");
const THRESH = 0.35;

function args(argv) {
  const a = { roster: null, account: "ollie", prev: null, capture: null, save: null, json: null };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (["--account", "--prev", "--capture", "--save", "--json"].includes(k)) a[k.slice(2)] = argv[++i];
    else if (!a.roster) a.roster = k;
    else { console.error("unexpected argument " + k); process.exit(1); }
  }
  if (!a.roster) { console.error("usage: gl-triggers.js <roster.txt> [--account ollie] [--prev prev.json] [--capture file] [--save state.json] [--json out.json]"); process.exit(1); }
  return a;
}
function captureGls(file) {
  const txt = fs.readFileSync(file, "utf8");
  try {
    const j = JSON.parse(txt), arr = Array.isArray(j) ? j : (j.data || j.units || j.characters || []);
    return arr.filter(u => u && (u.galactic_legend || u.is_galactic_legend || u.isGalacticLegend)).map(u => u.base_id || u.baseId || u.id);
  } catch (e) { return parseRoster(file).gls; }
}
/* Runs in the page */
function pageTriggers(acct) {
  const base = accountView(acct), reqs = (base.src && base.src.reqs) || {};
  const rows = glqRows(acct);
  const doneWhen = [];
  ((GL_QUEUE[acct] || {}).queue || []).forEach(e => {
    if (!e.doneWhen) return;
    const specs = e.doneWhen.map(sp => {
      const u = reqs[sp.id];
      return { id: sp.id, type: sp.type, min: sp.min, met: specMet(reqs, sp), label: specLiveLabel(reqs, sp) };
    });
    const row = rows.find(r => r.e === e || (r.e && r.e.glId === e.glId));
    doneWhen.push({ glId: e.glId, name: (GL_ROADMAP[e.glId] || {}).name || e.glId, allMet: specs.every(s => s.met), eff: row ? row.eff : null, specs });
  });
  const queue = rows.map(r => ({ id: r.e.glId || r.e.watchId, eff: r.eff, name: r.name }));
  return { doneWhen, queue, knownGls: GL_ORDER.slice(), watch: Object.keys(GL_QUEUE.watch), ownedGls: GL_ORDER.filter(g => reqs[g]) };
}

(async () => {
  const a = args(process.argv);
  const { rd, tr, roster } = await withApp(a.roster, a.account, async (p, acct, roster) => ({
    rd: await p.evaluate(pageReadiness, acct), tr: await p.evaluate(pageTriggers, acct), roster }));
  const prev = a.prev ? JSON.parse(fs.readFileSync(a.prev, "utf8")) : null;
  const reasons = [], info = [], actions = [];

  /* (a) doneWhen */
  for (const d of tr.doneWhen) {
    for (const s of d.specs) info.push(`doneWhen ${d.name}: ${s.met ? "MET" : "NOT met"} - ${s.label}${s.type === "relic" ? "" : ` (${s.type})`}`);
    const was = prev && (prev.doneWhen || {})[d.glId];
    if (d.allMet) actions.push(`ACTION: ${d.name} doneWhen fully met${was === false ? " (newly since previous run)" : ""} - advance the queue / freeze its relics`);
    else if (was === true) reasons.push(`${d.name} doneWhen was met on the previous run and no longer is - check the roster`);
  }

  /* (b) new GL not in GL_ROADMAP (roster '*' markers and optional capture) */
  const known = new Set([...tr.knownGls, ...tr.watch]);
  const seen = new Set([...roster.gls, ...(a.capture ? captureGls(a.capture) : [])]);
  const unknown = [...seen].filter(id => !known.has(id));
  for (const id of unknown) reasons.push(`new Legend in ${a.capture ? "roster/capture" : "roster"} not in GL_ROADMAP: ${id}`);
  if (!unknown.length) info.push(`new GLs: none (${seen.size} Legend marker${seen.size === 1 ? "" : "s"} seen, all in GL_ROADMAP)`);

  /* (c) cost margin between the two cheapest unowned released Legends */
  const un = rd.gls.filter(g => g.released).sort((x, y) => x.steps - y.steps);
  let margin = null;
  if (un.length >= 2) {
    const [x, y] = un;
    margin = x.steps > 0 ? (y.steps - x.steps) / x.steps : Infinity;
    const line = `cheapest two unowned: ${x.name} ${x.steps} vs ${y.name} ${y.steps} relic steps -> ${y.name} costs ${isFinite(margin) ? Math.round(margin * 100) + "% more" : "infinitely more"} (= ${y.steps ? Math.round(100 * (y.steps - x.steps) / y.steps) : 0}% saved by picking ${x.name}); threshold ${THRESH * 100}%`;
    if (margin < THRESH) reasons.push("close call: " + line); else info.push(line);
  } else info.push("fewer than two unowned released Legends - margin not applicable");

  /* queue sanity vs the app's own order: the queue's NOW/NEXT should not be dearer than the cheapest unowned */
  const nr = tr.queue.map(q => un.find(g => g.id === q.id && (q.eff === "building" || q.eff === "next"))).find(Boolean);
  if (nr && un.length && nr.id !== un[0].id)
    info.push(`queue's first unowned pick is ${nr.name} (${nr.steps} steps) but ${un[0].name} is cheapest (${un[0].steps}) - the order is an expert choice, not a cost sort`);
  if (prev && prev.top2) {
    const now = un.slice(0, 2).map(g => g.id);
    if (JSON.stringify(now) !== JSON.stringify(prev.top2)) reasons.push(`cheapest-two order changed since the previous run: ${prev.top2.join(", ")} -> ${now.join(", ")}`);
    else info.push(`cheapest-two unchanged since previous run (${now.join(", ")})`);
    for (const g of un.slice(0, 2)) { const o = (prev.steps || {})[g.id]; if (o != null && o !== g.steps) info.push(`${g.name} relic steps ${o} -> ${g.steps}`); }
  }

  const verdict = reasons.length ? "CLOSE-CALL" : "ROUTINE";
  console.log(`${verdict}${verdict === "CLOSE-CALL" ? " - run full review" : ""}  (${a.account}, ${a.roster})`);
  reasons.forEach(r => console.log("  ! " + r));
  actions.forEach(r => console.log("  > " + r));
  info.forEach(r => console.log("  - " + r));
  const state = { account: a.account, roster: a.roster, verdict, top2: un.slice(0, 2).map(g => g.id), steps: Object.fromEntries(rd.gls.map(g => [g.id, g.steps])),
    doneWhen: Object.fromEntries(tr.doneWhen.map(d => [d.glId, d.allMet])), margin: isFinite(margin) ? margin : null, reasons, actions, info, doneWhenDetail: tr.doneWhen };
  if (a.save) fs.writeFileSync(a.save, JSON.stringify(state, null, 1));
  if (a.json) fs.writeFileSync(a.json, JSON.stringify(state, null, 1));
  process.exit(verdict === "CLOSE-CALL" ? 2 : 0);
})().catch(e => { console.error(e.stack || e); process.exit(1); });
