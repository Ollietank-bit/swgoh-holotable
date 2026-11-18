/* gl-lib.js — shared plumbing for tools/gl-readiness.js and tools/gl-triggers.js (read-only; never edits index.html).
   Loads index.html in headless Chromium (Playwright), injects a compact roster the same way tests/rv25c-check.js does
   (a pull in localStorage "swgoh-holotable-pulls-v1"), and runs the app's OWN helpers in the page. Requirement rows are
   never re-parsed: they come from GL_ROADMAP / GL_QUEUE.watch.MANDOGROGU.req as the page holds them.
   rv48 18 Nov 2026: Mercenary Guard Droid (B1) now resolves — the app's MGL_SETS carries his base_id B1MERCDROID (it was null, and an exact-name
   match never fires here because buildPulls gives roster-only units no name), so he is no longer counted "not owned" (both accounts own him at 4★).
   Roster-only units also get a display name from the app's own requirement lists when one exists (see buildPulls' NAMES).
   Needs NODE_PATH to include the global playwright (e.g. /home/claude/.npm-global/lib/node_modules). */
const fs = require("fs"), http = require("http"), path = require("path");
let chromium;
try { ({ chromium } = require("playwright")); }
catch (e) { ({ chromium } = require("/home/claude/.npm-global/lib/node_modules/playwright")); }
const ROOT = path.resolve(__dirname, "..");
const FILE = process.env.FILE || path.join(ROOT, "index.html");
const PULLS_KEY = "swgoh-holotable-pulls-v1";

/* Compact roster: optional '#' comment lines, then ID:stars.gear[rN][*] items separated by commas (whitespace/newlines ok). */
function parseRoster(file) {
  const units = {}, gls = [];
  const body = fs.readFileSync(file, "utf8").split("\n").filter(l => l.trim() && !l.trim().startsWith("#")).join(",");
  for (const raw of body.split(",")) {
    const it = raw.trim(); if (!it) continue;
    const [id, v] = it.split(":");
    const m = /^(\d+)\.(\d+)(?:r(\d+))?(\*)?$/.exec((v || "").trim());
    if (!id || !m) throw new Error("bad roster item: " + JSON.stringify(it));
    units[id] = { s: +m[1], g: +m[2], r: +(m[3] || 0) };
    if (m[4]) gls.push(id);
  }
  return { units, gls };
}

/* Build the pull the app expects. Names/zetas/ships come from the newest holotable-roster-snapshot-*.json in the repo root
   (same fixture rv25c uses) when present; chars in that fixture that the roster does not list are dropped (the roster is complete
   for chars), so stale fixture gear can never leak in. */
/* rv48: display names for ids the 7 Oct fixture predates (exact in-game names), so name-based lookups resolve too. */
const NAMES = { B1MERCDROID: "Mercenary Guard Droid (B1)", ADELPHIRANGER: "Adelphi Ranger", GLLEIA: "Leia Organa", GENERALSKYWALKER: "General Skywalker", EDRIOTWOTUBES: "Edrio Two Tubes", CAPTAINSILVO: "Captain Silvo", VANE: "Vane" };
function buildPulls(roster, acct, baseFile) {
  let acc = {};
  const snaps = fs.readdirSync(ROOT).filter(f => /^holotable-roster-snapshot-.*\.json$/.test(f)).sort();
  const bf = baseFile || (snaps.length ? path.join(ROOT, snaps[snaps.length - 1]) : null);
  if (bf) acc = JSON.parse(fs.readFileSync(bf, "utf8")).accounts || {};
  const p = acc[acct] || { fetchedAt: Date.now(), fetchedLabel: "Live pull · tool", charDataLive: true, reqs: {} };
  const reqs = {};
  for (const [id, u] of Object.entries(p.reqs || {})) if (u.t !== "char") reqs[id] = u;          // ships etc. kept as is
  for (const [id, u] of Object.entries(roster.units)) {
    const prev = (p.reqs || {})[id] || Object.assign({ t: "char", z: [], o: [], el: 0 }, NAMES[id] ? { name: NAMES[id] } : {});
    reqs[id] = Object.assign({}, prev, u);
  }
  p.reqs = reqs;
  return Object.assign({}, acc, { [acct]: p });
}

function serve() {
  return new Promise(res => { const srv = http.createServer((q, s) => { s.setHeader("content-type", "text/html"); fs.createReadStream(FILE).pipe(s); }); srv.listen(0, "127.0.0.1", () => res(srv)); });
}

/* Opens the app with the roster injected; calls fn(page, acct) and returns its result. */
async function withApp(rosterFile, acct, fn, opts) {
  opts = opts || {};
  const roster = parseRoster(rosterFile);
  const pulls = buildPulls(roster, acct, opts.base);
  const srv = await serve(), port = srv.address().port;
  const b = await chromium.launch({ headless: true });
  try {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 } });
    await ctx.addInitScript(([pl, key]) => { try { localStorage.clear(); localStorage.setItem(key, pl); } catch (e) {} }, [JSON.stringify(pulls), PULLS_KEY]);
    await ctx.route(/fonts\.g|swgoh\.gg|swgohrote\.com|corsproxy|allorigins|codetabs|api\.github/, r => r.abort());
    const p = await ctx.newPage(); const errs = [];
    p.on("pageerror", e => errs.push(String(e).slice(0, 300)));
    await p.goto(`http://127.0.0.1:${port}/x.html`, { waitUntil: "domcontentloaded" });
    await p.waitForFunction(() => typeof glqRows === "function" && typeof state !== "undefined", null, { timeout: 15000 });
    await p.waitForTimeout(400);
    const live = await p.evaluate(a => { switchAcct(a); return !!state.pulls[a]; }, acct);
    if (!live) throw new Error("roster pull was not accepted by the app (state.pulls." + acct + " empty)");
    if (errs.length) process.stderr.write("page errors: " + errs.join(" | ") + "\n");
    return await fn(p, acct, roster);
  } finally { await b.close(); srv.close(); }
}

/* Runs in the page: per-GL readiness using the app's own data and helpers. Returns plain JSON. */
function pageReadiness(acct) {
  const base = accountView(acct), reqs = (base.src && base.src.reqs) || {};
  const bandOf = lvl => lvl <= 5 ? "r1_5" : lvl <= 7 ? "r6_7" : "r8p";
  /* list: [id, name, relicNeed] rows; map: the roster map those ids resolve in (the MGL one resolves by exact name) */
  const evalList = (list, map) => {
    const o = { met: 0, total: list.length, steps: 0, bands: { r1_5: 0, r6_7: 0, r8p: 0 }, shortShards: 0, notOwned: 0, toG13: 0, toG13Units: [], notOwnedUnits: [], asks: {}, levels: {}, unmet: [] };
    for (const [id, name, rr, setN] of list) {
      const key = typeof mglKey === "function" ? mglKey(id, name) : id, u = map[key], need = hardNum(rr);
      const pr = unitProgress(u, need);
      if (pr.done) o.met++; else o.unmet.push(name + " " + pr.cur + " -> R" + need);
      const r = hardNum(u && u.r), from = Math.min(need, r);
      for (let l = from + 1; l <= need; l++) { o.steps++; o.bands[bandOf(l)]++; if (l >= 8) o.levels["R" + l] = (o.levels["R" + l] || 0) + 1; }
      if (need >= 8 && r < need) o.asks["R" + need] = (o.asks["R" + need] || 0) + 1;
      if (!u) { o.notOwned++; o.notOwnedUnits.push(name); o.shortShards += STAR_SHARDS_CUM[7]; }
      else {
        o.shortShards += STAR_SHARDS_CUM[7] - STAR_SHARDS_CUM[Math.min(hardNum(u.s), 7)];
        if (r <= 0 && (hardNum(u.g) || 1) < 13) { o.toG13++; o.toG13Units.push(name + " G" + (hardNum(u.g) || 1)); }
      }
    }
    return o;
  };
  const out = [];
  GL_ORDER.forEach(gid => {
    if (reqs[gid]) return;                                   // owned
    const v = accountView(acct, gid);
    const o = evalList(v.gl.req, reqs);
    o.appTiers = glqTiersLeft(reqs, v.gl.req);               // the app's own relic-step count (cross-check)
    o.appMet = v.doneCount; o.appTotal = v.reqRows.length;   // the app's own met count
    out.push(Object.assign({ id: gid, name: v.gl.name, released: true }, o));
  });
  Object.entries(GL_QUEUE.watch).forEach(([wid, w]) => {
    const wm = mglReqMap(reqs, w.req);
    const o = evalList(w.req, wm);
    const row = glqRows(acct).find(r => r.kind === "watch" && r.e.watchId === wid);
    o.appTiers = glqTiersLeft(wm, w.req);
    o.appMet = row ? row.doneCount : null; o.appTotal = row ? row.total : null;
    out.push(Object.assign({ id: wid, name: w.name, released: w.released === true }, o));   // rv48: the watch entry says whether it is released (Mandalorian & Grogu: true since 18 Nov)
  });
  const owned = GL_ORDER.filter(g => reqs[g]).map(g => ({ id: g, name: GL_ROADMAP[g].name, r: hardNum(reqs[g].r) }));
  return { acct, live: base.live, owned, gls: out, asOf: GL_QUEUE.asOf };
}

module.exports = { parseRoster, buildPulls, withApp, pageReadiness, ROOT, FILE };
