/* pbm-check — proxy-free roster pull through a swgoh.gg tab (bookmarklet + postMessage), the failed-pull
   copy, gacHist, gacActivity() and the "GAC this round" strip / Re-enter-GAC flag retirement.
   chx (7 Oct 2026): the GAC flag is now derived and reads "Set GAC defence — …" while an event is live, so the
   flag matchers accept either headline (/Re-enter GAC|Set GAC defence/); nothing else here changed.
   Origin note: a test cannot make window.postMessage() arrive with a forged event.origin. So the gate is
   covered three ways: (1) END-TO-END with a REAL cross-origin postMessage — Playwright serves a fake
   https://swgoh.gg page + API via ctx.route, the generated bookmarklet runs there, window.open()s the app
   and the two windows really talk (event.origin is genuinely "https://swgoh.gg"); (2) synthetic
   MessageEvents dispatched in a popup (wrong origin / wrong source / right origin+source) through the real
   window listener; (3) pbmGate() and the handler pbmReceive() unit-tested directly. */
const L = require("./lib.js");
const { ck, SNAP, REAL, PULLS } = L;
const SHOTS = L.path.join(L.ROOT, "shots");
try { L.fs.mkdirSync(SHOTS, { recursive: true }); } catch (e) {}
const CODES = { ollie: "229917529", tiny: "295352286" };
const BASE = `http://127.0.0.1:${L.PORT}`;

/* A raw swgoh.gg /api/player/ body rebuilt from a saved parsePlayer() snapshot, so parsePlayer() can parse it. */
function rawFrom(p, code, sr, leagueName, div) {
  return {
    data: { ally_code: +code, name: "Fixture", galactic_power: p.gp, character_galactic_power: p.gpChar || 0, ship_galactic_power: p.gpShip || 0,
      skill_rating: sr, league_name: leagueName || "Carbonite", division_number: div || 5,
      arena: { rank: typeof p.squadRank === "number" ? p.squadRank : 0, leader: p.squadLeader || "" },
      fleet_arena: { rank: typeof p.fleetRank === "number" ? p.fleetRank : 0, leader: p.fleetLeader || "" } },
    units: Object.entries(p.reqs).map(([id, u]) => ({ data: { base_id: id, name: u.name || id, rarity: u.s, gear_level: u.g, relic_tier: u.r ? u.r + 2 : 1,
      combat_type: u.t === "ship" ? 2 : 1, era_level: u.el || 0,
      ability_data: (u.z || []).map(n => ({ name: n, has_zeta_learned: true })).concat((u.o || []).map(n => ({ name: n, has_omicron_learned: true }))) } })),
    mods: [], datacrons: []
  };
}
const RAW = { ollie: rawFrom(SNAP.accounts.ollie, CODES.ollie, 1500, "Carbonite", 5), tiny: rawFrom(SNAP.accounts.tiny, CODES.tiny, 1650, "Carbonite", 4) };

/* Like L.open, but optionally pins Date.now() to a LOCAL wall-clock time (y, m0, d, h) and can add routes. */
async function openX(b, o) {
  o = o || {};
  const ctx = await b.newContext({ viewport: { width: o.width || 1280, height: o.height || 1000 } });
  await ctx.addInitScript(([s, pl, withPulls, seedKey, pin]) => {
    if (pin) { const real = Date.now.bind(Date), t0 = new Date(pin[0], pin[1], pin[2], pin[3], 0, 0).getTime(), s0 = real(); Date.now = () => t0 + (real() - s0); }
    try { if (location.protocol !== "https:" && !sessionStorage.getItem(seedKey)) {
      localStorage.clear(); localStorage.setItem("swgoh-tracker", s);
      if (withPulls) localStorage.setItem("swgoh-holotable-pulls-v1", pl);
      sessionStorage.setItem(seedKey, "1"); } } catch (e) {}
  }, [o.state || REAL, o.pulls || PULLS, o.withPulls !== false, "seeded-" + (o.tag || "x"), o.pin || null]);
  await ctx.route(/fonts\.g|corsproxy|allorigins|codetabs|api\.github/, r => r.abort());
  if (o.fakeSwgoh) {
    await ctx.route(/^https:\/\/swgoh\.gg\//, r => {
      const m = /\/api\/player\/(\d+)\/$/.exec(r.request().url());
      if (m) { const k = Object.keys(CODES).find(x => CODES[x] === m[1]);
        return r.fulfill({ status: k ? 200 : 404, contentType: "application/json", body: JSON.stringify(k ? RAW[k] : { detail: "nope" }) }); }
      return r.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>swgoh.gg (fake)</title><p>fake swgoh.gg</p>" });
    });
  } else await ctx.route(/swgoh\.gg/, r => r.abort());
  const errs = [];
  ctx.on("page", pg => { pg.on("pageerror", e => errs.push(String(e).slice(0, 300)));
    pg.on("console", m => { if (m.type() === "error" && !/Failed to load resource|net::ERR|fonts\.g/.test(m.text()) && !(o.allowOriginMismatch && /target origin provided \('https:\/\/swgoh\.gg'\)/.test(m.text()))) errs.push("console: " + m.text().slice(0, 200)); }); });
  const p = await ctx.newPage();
  if (o.url !== false) { await p.goto(o.url || `${BASE}/x.html`, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(o.settle || 900); }
  return { ctx, p, errs };
}
const vis = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return !!(e && !e.hidden && e.offsetParent !== null); }, sel);

(async () => {
  const srv = await L.serve(); const b = await L.chromium.launch({ headless: true });
  const allErrs = [];
  /* A section that throws (e.g. run against a build without these features) is one failed check, not a crash. */
  const sec = async fn => { try { await fn(); } catch (e) { ck("section crashed: " + String(e.message || e).split("\n")[0].slice(0, 120), false, ""); } };

  /* ---------- 1. bookmarklet link: builds, decodes, is short and dependency-free ---------- */
  await sec(async () => {
    const { ctx, p, errs } = await openX(b, { tag: "bm" });
    const bm = await p.evaluate(() => { const a = document.getElementById("pbmBmLink"); return a ? { href: a.getAttribute("href"), drag: a.getAttribute("draggable") } : null; });
    ck("bookmarklet link is rendered in ☁ Sync → Backup & recovery", !!bm && bm.drag === "true", JSON.stringify(bm && bm.drag));
    const code = bm ? decodeURIComponent(bm.href.replace(/^javascript:/, "")) : "";
    ck("bookmarklet href is a javascript: URL", !!bm && bm.href.startsWith("javascript:"), bm && bm.href.slice(0, 30));
    let parses = false; try { new Function(code); parses = true; } catch (e) {}
    ck("decoded bookmarklet is valid JavaScript", parses, code.slice(0, 80));
    ck("bookmarklet carries both ally codes and this app's own URL", code.includes(CODES.ollie) && code.includes(CODES.tiny) && code.includes(`"${BASE}/x.html"`), code.slice(0, 200));
    ck("bookmarklet fetches same-origin /api/player/ with Accept: application/json and posts holotable-pull v1",
      code.includes("'/api/player/'") && code.includes("Accept:'application/json'") && code.includes("type:'holotable-pull',v:1") && code.includes("e.origin===O") && code.includes("e.source===w"), "");
    ck("bookmarklet is short and dependency-free (< 2000 chars, no script tags / imports)", code.length < 2000 && !/<script|import\(|require\(/.test(code), String(code.length));
    await p.evaluate(() => openSyncModal()); await p.waitForTimeout(200);
    const hasCopy = await p.evaluate(() => [...document.querySelectorAll("#pbmBmBox button")].some(x => /Copy bookmarklet/.test(x.textContent)));
    ck("'Copy bookmarklet' button present", hasCopy, "");
    await p.evaluate(() => { try { Object.defineProperty(navigator, "clipboard", { value: { writeText: t => { window.__copied = t; return Promise.resolve(); } }, configurable: true }); } catch (e) {} pbmBmCopy(); });
    await p.waitForTimeout(150);
    const copied = await p.evaluate(() => ({ t: window.__copied || "", msg: document.getElementById("pbmBmMsg").textContent }));
    ck("Copy bookmarklet copies the same javascript: URL", copied.t === bm.href && /Copied/.test(copied.msg), copied.msg);
    await p.screenshot({ path: L.path.join(SHOTS, "pbm-sync-1280.png") });
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 2. END-TO-END: fake swgoh.gg tab runs the bookmarklet → app tab → confirm → Import ---------- */
  await sec(async () => {
    const { ctx, p, errs } = await openX(b, { tag: "e2e", fakeSwgoh: true });
    const href = await p.evaluate(() => document.getElementById("pbmBmLink").getAttribute("href"));
    const code = decodeURIComponent(href.replace(/^javascript:/, ""));
    const before = await p.evaluate(() => ({ o: state.pulls.ollie.fetchedAt, t: state.pulls.tiny.fetchedAt }));
    const sw = await ctx.newPage();
    await sw.goto("https://swgoh.gg/", { waitUntil: "domcontentloaded" });
    const [pop] = await Promise.all([ctx.waitForEvent("page", { timeout: 15000 }), sw.evaluate(c => { (0, eval)(c); }, code)]);
    await pop.waitForLoadState("domcontentloaded");
    let shown = false;
    try { await pop.waitForSelector("#pbmConfirm:not([hidden]) #pbmImportBtn", { timeout: 15000 }); shown = true; } catch (e) {}
    ck("e2e: real swgoh.gg-origin postMessage shows the confirm card in the opened app tab", shown, "");
    const txt = shown ? await pop.textContent("#pbmConfirm") : "";
    ck("e2e: confirm reads 'Import roster from swgoh.gg: Ollietank 8.20M GP · Tiny 7.89M GP'", /Import roster from swgoh\.gg: Ollietank 8\.20M GP · Tiny 7\.89M GP/.test(txt), txt.slice(0, 160));
    const pre = await pop.evaluate(() => ({ armed: pbmArmed, wrote: (JSON.parse(localStorage.getItem("swgoh-holotable-pulls-v1") || "{}").ollie || {}).fetchedAt, st: document.getElementById("pullStatus").textContent }));
    ck("e2e: nothing written before Import, listener disarmed, no proxy auto-pull", pre.wrote === before.o && pre.armed === false && !/Pull failed/.test(pre.st), JSON.stringify(pre));
    await pop.screenshot({ path: L.path.join(SHOTS, "pbm-confirm-1280.png") });
    if (shown) await pop.click("#pbmImportBtn");
    await pop.waitForTimeout(300);
    const after = await pop.evaluate(() => { const pl = JSON.parse(localStorage.getItem("swgoh-holotable-pulls-v1") || "{}");
      return { o: pl.ollie && pl.ollie.fetchedAt, gp: pl.ollie && pl.ollie.gp, tgp: pl.tiny && pl.tiny.gp, hist: pl.ollie && pl.ollie.gacHist, last: state.lastPull, st: document.getElementById("pullStatus").textContent, card: !!document.querySelector("#pbmConfirm:not([hidden])") }; });
    ck("e2e: Import writes both pulls to PULLS_KEY (fresh fetchedAt, raw GP)", after.o > before.o && after.gp === SNAP.accounts.ollie.gp && after.tgp === SNAP.accounts.tiny.gp, JSON.stringify({ o: after.o, gp: after.gp }));
    ck("e2e: imported pull carries gacHist seeded from the previous pull + the new rating", Array.isArray(after.hist) && after.hist.length === 2 && after.hist[0].sr === 1467 && after.hist[1].sr === 1500 && after.hist[1].league === "Carb 5", JSON.stringify(after.hist));
    ck("e2e: status says imported, card closed, lastPull stamped", /Imported from a swgoh\.gg tab/.test(after.st) && !after.card && after.last > 0, after.st);
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 3. origin/source gate through the real window listener (synthetic events) ---------- */
  await sec(async () => {
    /* allowOriginMismatch: this popup's opener is the app itself, not swgoh.gg, so Chrome logs the (correct)
       refusal to deliver the ready announcement to it — expected here, and the only console error tolerated. */
    const { ctx, p, errs } = await openX(b, { tag: "gate", allowOriginMismatch: true });
    const [pop] = await Promise.all([ctx.waitForEvent("page"), p.evaluate(() => { window.open("/x.html#pbm=1"); })]);
    await pop.waitForLoadState("domcontentloaded"); await pop.waitForTimeout(900);
    const raw = RAW.ollie;
    const res = await pop.evaluate(raw => {
      const out = {};
      const send = (origin, source, data) => window.dispatchEvent(new MessageEvent("message", { origin, source, data }));
      const good = { type: "holotable-pull", v: 1, accounts: { ollie: raw } };
      const shown = () => !!document.querySelector("#pbmConfirm:not([hidden])");
      out.armed0 = pbmArmed; out.viaBm = PBM_VIA_BM;
      send("https://evil.example", window.opener, good); out.wrongOrigin = shown();
      send("https://swgoh.gg.evil.example", window.opener, good); out.lookalike = shown();
      send("https://swgoh.gg", window, good); out.wrongSource = shown();
      send("https://swgoh.gg", null, good); out.nullSource = shown();
      send("https://swgoh.gg", window.opener, { type: "something-else" }); out.otherType = shown(); out.stillArmed = pbmArmed;
      send("https://swgoh.gg", window.opener, good); out.right = shown(); out.armedAfter = pbmArmed;
      out.gate = [pbmGate("https://swgoh.gg", window.opener), pbmGate("https://swgoh.gg", window), pbmGate("http://swgoh.gg", window.opener), pbmGate("null", window.opener)];
      pbmCancel(); send("https://swgoh.gg", window.opener, good); out.afterCancel = shown();
      return out;
    }, raw);
    ck("gate: popup opened by a page is armed (announced ready)", res.armed0 === true && res.viaBm === true, JSON.stringify(res));
    ck("gate: wrong origin ignored", !res.wrongOrigin && !res.lookalike, "");
    ck("gate: wrong source (self / null) ignored", !res.wrongSource && !res.nullSource, "");
    ck("gate: other message types ignored and listener stays armed", !res.otherType && res.stillArmed, "");
    ck("gate: right origin + source shows confirm and disarms", res.right && res.armedAfter === false, "");
    ck("gate: pbmGate() unit — only https://swgoh.gg from window.opener passes", JSON.stringify(res.gate) === "[true,false,false,false]", JSON.stringify(res.gate));
    ck("gate: after Cancel no further message is acted on", !res.afterCancel, "");
    /* a page with no opener never arms */
    const solo = await p.evaluate(raw => { window.dispatchEvent(new MessageEvent("message", { origin: "https://swgoh.gg", source: null, data: { type: "holotable-pull", v: 1, accounts: { ollie: raw } } }));
      return { armed: pbmArmed, shown: !!document.querySelector("#pbmConfirm:not([hidden])") }; }, raw);
    ck("gate: a normally-opened app tab (no opener) never arms or shows a card", !solo.armed && !solo.shown, JSON.stringify(solo));
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 4. handler unit tests: pbmReceive / Cancel / Import / untrusted input ---------- */
  await sec(async () => {
    const { ctx, p, errs } = await openX(b, { tag: "recv" });
    const r = await p.evaluate(([ro, rt]) => {
      const out = {};
      const PK = "swgoh-holotable-pulls-v1";
      const before = localStorage.getItem(PK);
      out.badV = pbmReceive({ type: "holotable-pull", v: 2, accounts: { ollie: ro } });
      out.cancel = pbmReceive({ type: "holotable-pull", v: 1, accounts: { ollie: ro, evil: ro, __proto__x: 1 } });
      out.cardText = document.getElementById("pbmConfirm").textContent;
      pbmCancel();
      out.unchangedAfterCancel = localStorage.getItem(PK) === before && !document.querySelector("#pbmConfirm:not([hidden])");
      /* oversize, wrong ally code, hostile unit id */
      const big = JSON.parse(JSON.stringify(rt)); big.data.pad = "x".repeat(8 * 1024 * 1024 + 10);
      const wrong = JSON.parse(JSON.stringify(ro)); wrong.data.ally_code = 111111111;
      const evil = JSON.parse(JSON.stringify(ro)); evil.units.push({ data: { base_id: "<img src=x onerror=window.__pwned=1>", rarity: "7", gear_level: 13, relic_tier: 5 } });
      pbmReceive({ type: "holotable-pull", v: 1, accounts: { ollie: wrong, tiny: big } });
      out.bothBad = document.getElementById("pbmConfirm").textContent; out.bothBadImportBtn = !!document.getElementById("pbmImportBtn");
      pbmCancel();
      pbmReceive({ type: "holotable-pull", v: 1, accounts: { ollie: evil } });
      out.evilHtml = document.getElementById("pbmConfirm").innerHTML; out.evilImg = !!document.querySelector("#pbmConfirm img");
      pbmCancel();
      /* Import writes, with the device-local write */
      const updatedAt0 = state.updatedAt;
      let writes = []; const w0 = store.write; store.write = function (s, opts) { writes.push(opts || null); return w0.apply(this, arguments); };
      pbmReceive({ type: "holotable-pull", v: 1, accounts: { ollie: ro } });
      out.importRet = pbmImport();
      store.write = w0;
      out.writes = writes;
      const pl = JSON.parse(localStorage.getItem(PK));
      out.ollieGp = pl.ollie.gp; out.ollieFresh = Date.now() - pl.ollie.fetchedAt < 60000; out.tinyUntouched = pl.tiny.fetchedAt === JSON.parse(before).tiny.fetchedAt;
      out.lastPullOnlyIfAll = !state.lastPull;
      return out;
    }, [RAW.ollie, RAW.tiny]);
    ck("handler: unknown protocol version is refused", r.badV === false, "");
    ck("handler: unknown account keys ignored (only Ollietank listed)", r.cancel === true && /Ollietank 8\.20M GP/.test(r.cardText) && !/evil/i.test(r.cardText), r.cardText.slice(0, 120));
    ck("handler: Cancel writes nothing", r.unchangedAfterCancel, "");
    ck("handler: wrong ally code and >8 MB raw are rejected with reasons, no Import button", /different player/.test(r.bothBad) && /too big/.test(r.bothBad) && !r.bothBadImportBtn, r.bothBad.slice(0, 200));
    ck("handler: hostile unit id is escaped in the reason (no element injected)", !r.evilImg && /&lt;img/.test(r.evilHtml) && /malformed unit/.test(r.evilHtml), r.evilHtml.slice(0, 200));
    ck("handler: Import writes the pull with { pulls, skipStamp, skipSync } first", r.importRet === 1 && r.writes.length >= 1 && JSON.stringify(r.writes[0]) === JSON.stringify({ pulls: true, skipStamp: true, skipSync: true }), JSON.stringify(r.writes));
    ck("handler: Import updated Ollietank only; lastPull not stamped for a one-account import", r.ollieGp === SNAP.accounts.ollie.gp && r.ollieFresh && r.tinyUntouched && r.lastPullOnlyIfAll, JSON.stringify(r).slice(0, 200));
    const injected = await p.evaluate(() => window.__pwned);
    ck("handler: no script ran from untrusted data", injected === undefined, String(injected));
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 5. failed-pull copy ---------- */
  await sec(async () => {
    const { ctx, p, errs } = await openX(b, { tag: "err" });
    await p.evaluate(() => pullAll());
    await p.waitForFunction(() => !rpPullBusy, null, { timeout: 120000 });
    const st = await p.evaluate(() => ({ t: document.getElementById("pullStatus").textContent, cls: document.getElementById("pullStatus").className, btn: !!document.querySelector("#pullStatus .pbm-help-btn") }));
    ck("copy: network failure says swgoh.gg blocks direct requests and proxies are down", /Pull failed/.test(st.t) && /swgoh\.gg blocks direct requests from other websites/.test(st.t) && /free proxies this app falls back on are down/.test(st.t), st.t.slice(0, 300));
    ck("copy: shows the 3-step swgoh.gg-tab route and the Export/Import alternative", /1\) ☁ Sync/.test(st.t) && /2\) open swgoh\.gg/.test(st.t) && /3\) click the bookmark/.test(st.t) && /Export \/ ⬆ Import roster snapshot/.test(st.t), "");
    ck("copy: 'Ask Claude to pull fresh data' is gone", !/Ask Claude/.test(st.t), "");
    ck("copy: 'Set it up →' button present", st.btn, "");
    await p.screenshot({ path: L.path.join(SHOTS, "pbm-error-1280.png"), clip: { x: 0, y: 0, width: 1280, height: 260 } });
    await p.click("#pullStatus .pbm-help-btn"); await p.waitForTimeout(300);
    ck("copy: 'Set it up →' opens ☁ Sync at the bookmarklet", await vis(p, "#pbmBmLink"), "");
    await p.evaluate(() => closeSyncModal());
    const u = await p.evaluate(() => {
      const st = document.createElement("div"); const A = ACCOUNTS;
      const web = new Error("route returned a web page instead of JSON"); web.rpWebPage = true;
      rpPullReport(st, [{ a: A[0], err: web }, { a: A[1], err: web }]); const w = st.textContent;
      rpPullReport(st, [{ a: A[0], err: new Error("HTTP 503") }, { a: A[1], err: new Error("HTTP 503") }]); const h = st.textContent;
      const net = new Error("Failed to fetch"); net.rpParts = [{ name: "swgoh.gg direct", msg: "Failed to fetch" }, { name: "corsproxy.io", msg: "signal is aborted without reason" }];
      rpPullReport(st, [{ a: A[0] }, { a: A[1], err: net }]); const part = st.textContent;
      rpPullReport(st, [{ a: A[0], rvSaved: true, err: new Error("x") }, { a: A[1] }]); const saved = st.textContent;
      return { w, h, part, saved };
    });
    ck("copy: web-page branch keeps the bot-check text", /bot check or a rate limit/.test(u.w) && !/blocks direct requests/.test(u.w) && !/Ask Claude/.test(u.w), u.w.slice(0, 200));
    ck("copy: HTTP-status failure keeps the proxies-unreliable text + short alternative", /free CORS proxies this app relies on are unreliable/.test(u.h) && /swgoh\.gg-tab route/.test(u.h), u.h.slice(0, 260));
    ck("copy: partial pull with network errors uses the new copy", /Partial pull/.test(u.part) && /blocks direct requests/.test(u.part) && /for Tiny/.test(u.part), u.part.slice(0, 260));
    ck("copy: rvSaved branch unchanged", /the step after saving failed/.test(u.saved), u.saved.slice(0, 160));
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 6. gacHist carry-forward / cap / validation / old snapshots ---------- */
  await sec(async () => {
    const { ctx, p, errs } = await openX(b, { tag: "hist" });
    const r = await p.evaluate(raw => {
      const out = {};
      const mk = sr => { const j = JSON.parse(JSON.stringify(raw)); j.data.skill_rating = sr; return j; };
      const a = parsePlayer(mk(1500), undefined);
      out.first = a.gacHist;
      const b = parsePlayer(mk(1500), a); out.same = b.gacHist.length;
      const c = parsePlayer(mk(1520), Object.assign({}, b, { fetchedAt: b.fetchedAt - 1 })); out.changed = c.gacHist;
      let prev = c; for (let i = 0; i < 15; i++) prev = parsePlayer(mk(1600 + i), Object.assign({}, prev, { fetchedAt: prev.fetchedAt - 1 }));
      out.capLen = prev.gacHist.length; out.capFirst = prev.gacHist[0].sr; out.capLast = prev.gacHist[11].sr;
      const lg = mk(1614); lg.data.league_name = "Bronzium"; lg.data.division_number = 1;
      out.league = parsePlayer(lg, prev).gacHist.slice(-1)[0];
      out.noSr = parsePlayer(mk("abc"), prev).gacHist.length;
      const seeded = parsePlayer(mk(1500), state.pulls.ollie); out.seed = seeded.gacHist;
      out.okWith = rpPullProblem(seeded);
      out.badHist = rpPullProblem(Object.assign({}, seeded, { gacHist: [{ at: "x", sr: 1, league: "" }] }));
      out.badHist2 = rpPullProblem(Object.assign({}, seeded, { gacHist: "nope" }));
      out.clean = rvSnapClean(Object.assign({}, seeded, { gacHist: seeded.gacHist.map(h => Object.assign({ junk: 1 }, h)) }), Date.now()).gacHist;
      out.cleanNo = "gacHist" in rvSnapClean(state.pulls.ollie, Date.now());
      return out;
    }, RAW.ollie);
    ck("gacHist: first pull with no history and no prior SR starts the list with one entry", r.first.length === 1 && r.first[0].sr === 1500 && r.first[0].league === "Carb 5", JSON.stringify(r.first));
    ck("gacHist: unchanged rating/league appends nothing", r.same === 1, String(r.same));
    ck("gacHist: changed rating appends with prevAt", r.changed.length === 2 && r.changed[1].sr === 1520 && typeof r.changed[1].prevAt === "number", JSON.stringify(r.changed));
    ck("gacHist: capped at 12, oldest dropped", r.capLen === 12 && r.capFirst === 1603 && r.capLast === 1614, JSON.stringify(r).slice(0, 120));
    ck("gacHist: league change alone appends", r.league.league === "Bron 1" && r.league.sr === 1614, JSON.stringify(r.league));
    ck("gacHist: non-numeric skill_rating appends nothing", r.noSr === 12, String(r.noSr));
    ck("gacHist: seeded from an old pull's own gacNote (1467 SR) at its fetchedAt", r.seed.length === 2 && r.seed[0].sr === 1467 && r.seed[0].at === SNAP.accounts.ollie.fetchedAt && r.seed[1].prevAt === SNAP.accounts.ollie.fetchedAt, JSON.stringify(r.seed));
    ck("gacHist: rpPullProblem accepts it, rejects malformed", r.okWith === "" && /gacHist/.test(r.badHist) && /gacHist/.test(r.badHist2), r.badHist);
    ck("gacHist: rvSnapClean keeps it, drops unknown keys; old pulls stay without it", r.clean.length === 2 && !("junk" in r.clean[0]) && r.cleanNo === false, JSON.stringify(r.clean));
    /* the real old snapshot (no gacHist) still validates and imports through the existing UI, keeping this device's gacHist */
    await p.evaluate(() => { state.pulls.ollie.gacHist = [{ at: Date.now() - 5000, sr: 1400, league: "Carb 5" }]; store.write(state, { pulls: true, skipStamp: true, skipSync: true }); });
    const snap = JSON.parse(JSON.stringify(SNAP)); const now = Date.now();
    snap.accounts.ollie.fetchedAt = now - 1000; snap.accounts.tiny.fetchedAt = now - 1000; snap.exportedAt = new Date(now).toISOString();
    const v = await p.evaluate(t => rpValidateSnapshot(t).ok, JSON.stringify(snap));
    ck("old snapshot (no gacHist) still validates", v === true, "");
    await p.evaluate(() => openSyncModal());
    await p.setInputFiles("#rpSnapFile", { name: "old-snap.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(snap)) });
    await p.waitForTimeout(500);
    await p.click("#recGoBtn"); await p.waitForTimeout(500);
    const after = await p.evaluate(() => ({ f: state.pulls.ollie.fetchedAt, h: state.pulls.ollie.gacHist, th: state.pulls.tiny.gacHist, page: document.querySelectorAll(".card").length }));
    ck("old snapshot imports, keeps this device's gacHist, renders", after.f > now - 5000 && Array.isArray(after.h) && after.h[0].sr === 1400 && after.th === undefined && after.page > 0, JSON.stringify(after).slice(0, 200));
    const snap2 = JSON.parse(JSON.stringify(snap)); snap2.accounts.ollie.gacHist = [{ at: 1, sr: "bad", league: "x" }];
    const v2 = await p.evaluate(t => rpValidateSnapshot(t), JSON.stringify(snap2));
    ck("snapshot with a malformed gacHist is refused", v2.ok === false && /gacHist/.test(v2.msg), v2.msg);
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 7. gacActivity states (fabricated gacHist + ticks, pinned clocks) ---------- */
  await sec(async () => {
    const { ctx, p, errs } = await openX(b, { tag: "act" });
    const r = await p.evaluate(() => {
      const T = (m, d, h) => new Date(2026, m, d, h || 12, 0, 0).getTime();
      const out = {};
      const setHist = h => { state.pulls.ollie = Object.assign({}, state.pulls.ollie, { gacHist: h }); };
      setHist(undefined);
      out.offSeason = gacActivity("ollie", T(9, 3));
      out.pendingNoHist = gacActivity("ollie", T(9, 8));
      setHist([{ at: T(9, 7, 10), sr: 1467, league: "Carb 5" }, { at: T(9, 8, 9), sr: 1500, league: "Carb 5", prevAt: T(9, 7, 20) }]);
      out.playedSr = gacActivity("ollie", T(9, 8, 12));
      /* gcf (deliberate change): an interval that only spans the gap between events now counts as played, so the
         ambiguous case starts inside the previous event (s83e3, 23–30 Sep). The gap case is covered in gcf-check. */
      setHist([{ at: T(8, 28, 7), sr: 1330, league: "Carb 5" }, { at: T(9, 7, 13), sr: 1467, league: "Carb 5", prevAt: T(8, 28, 7) }]);
      out.amb = gacActivity("ollie", T(9, 8));
      setHist(undefined);
      state.ticks["ollie-p:gac:s84e1"] = true;
      out.tick = gacActivity("ollie", T(9, 8));
      out.tickNextEvent = gacActivity("ollie", T(9, 15));   // s84e2 (estimated) — the tick does not carry over
      out.tinyUnaffected = gacActivity("tiny", T(9, 8)).state;
      delete state.ticks["ollie-p:gac:s84e1"];
      out.ranOut = gacActivity("ollie", T(10, 30));
      return out;
    });
    ck("gacActivity: between events → unknown, names the next event", r.offSeason.state === "unknown" && r.offSeason.roundId === null && /Season 84 Event 1/.test(r.offSeason.evidence), JSON.stringify(r.offSeason));
    ck("gacActivity: event live, no evidence → pending s84e1", r.pendingNoHist.state === "pending" && r.pendingNoHist.roundId === "s84e1", JSON.stringify(r.pendingNoHist));
    ck("gacActivity: SR moved between two pulls inside the event → played +33", r.playedSr.state === "played" && r.playedSr.how === "sr" && r.playedSr.delta === 33 && /\+33/.test(r.playedSr.evidence), JSON.stringify(r.playedSr));
    ck("gacActivity: SR move spanning the event start is NOT claimed (pending, says why, but recent)", r.amb.state === "pending" && /may be the previous one/.test(r.amb.evidence) && r.amb.recent === true, JSON.stringify(r.amb));
    ck("gacActivity: per-event tick → played; next event pending again; other account unaffected", r.tick.state === "played" && r.tick.how === "tick" && r.tickNextEvent.state === "pending" && r.tickNextEvent.roundId === "s84e2" && r.tinyUnaffected === "pending", JSON.stringify([r.tick.state, r.tickNextEvent.state, r.tinyUnaffected]));
    ck("gacActivity: schedule run out → unknown with honest text", r.ranOut.state === "unknown" && /run out/.test(r.ranOut.evidence), r.ranOut.evidence);
    const reg = await p.evaluate(() => ({ n: SNAPSHOTS.length, e: SNAP_BY_KEY["gac-schedule"], st: snapState(SNAP_BY_KEY["gac-schedule"], Date.now()).state, fmt: GAC_FORMAT, src: GAC_SCHEDULE.source, est: GAC_SCHEDULE.events.filter(e => e.est).map(e => e.id) }));
    ck("GAC_SCHEDULE registered in SNAPSHOTS (22 entries), dated 2026-10-07", reg.n === 22 && reg.e && reg.e.asOf === "2026-10-07" && reg.e.tab === "coach", JSON.stringify(reg).slice(0, 200));
    ck("GAC_SCHEDULE: source recorded; later events flagged as estimates; GAC_FORMAT is 5v5 (dta refresh: Season 84)", reg.src === "swgoh.gg/p/<code>/gac-history/" && JSON.stringify(reg.est) === '["s84e2","s84e3"]' && reg.fmt === "5v5", JSON.stringify(reg));
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 8. UI: strip + flag retirement (clock pinned to Thu 8 Oct 2026 12:00 local) ---------- */
  for (const w of [1280, 390]) await sec(async () => {
    const { ctx, p, errs } = await openX(b, { tag: "ui" + w, width: w, pin: [2026, 9, 8, 12] });
    await L.go(p, "ollie", "overview");
    const ov = await p.evaluate(() => { const c = document.querySelector('[data-card="flags"]') || [...document.querySelectorAll(".card")].find(x => /Top flags/.test(x.textContent));
      return { strip: c && c.querySelector(".pbm-gac") ? c.querySelector(".pbm-gac").dataset.pbmGac : null, txt: c ? c.textContent : "", hasReenter: c ? /Re-enter GAC|Set GAC defence/.test(c.textContent) : null, red: (document.querySelector(".cnt") ? 1 : 0) }; });
    ck(`[${w}] overview Top flags: amber 'Set your defences for Season 84 Event 1' + Re-enter flag still shown`, ov.strip === "pending" && /Set your defences for Season 84 Event 1/.test(ov.txt) && /I've set them/.test(ov.txt) && ov.hasReenter, ov.txt.slice(0, 200));
    ck(`[${w}] honest wording present`, /not which squads; the GAC planner checks your squads/.test(ov.txt), "");
    const keyOk = await p.evaluate(() => hardTipKey("ollie", TIPS.ollie.find(t => t.id === "re-enter-gac-three-built")) === "ollie-t:re-enter-gac-three-built" && hardTipKey("tiny", TIPS.tiny.find(t => t.id === "re-enter-gac-rey-r8")) === "tiny-t:re-enter-gac-rey-r8" && TIPS.ollie.find(t => t.id === "re-enter-gac-three-built").sev === "fixnow");
    ck(`[${w}] tip keys and TIPS entries unchanged`, keyOk, "");
    let o = await L.overflow(p); ck(`[${w}] overview: no horizontal overflow`, o.doc <= o.inner + 1, JSON.stringify(o));
    await p.evaluate(() => { const e = document.querySelector("#ovGrid .pbm-gac"); if (e) e.scrollIntoView({ block: "center" }); }); await p.waitForTimeout(100);
    await p.screenshot({ path: L.path.join(SHOTS, `pbm-overview-pending-${w}.png`), fullPage: false });
    const redBefore = await p.evaluate(() => activeTips("ollie", (state.pulls.ollie || {}).reqs || {}, ["fixnow"]).length);
    await p.click('#ovGrid [data-pbm-gac="pending"] .pbm-gac-set'); await p.waitForTimeout(250);
    const ov2 = await p.evaluate(() => { const c = [...document.querySelectorAll(".card")].find(x => /Top flags/.test(x.textContent));
      return { strip: c.querySelector(".pbm-gac").dataset.pbmGac, txt: c.textContent, tick: state.ticks["ollie-p:gac:s84e1"], red: activeTips("ollie", (state.pulls.ollie || {}).reqs || {}, ["fixnow"]).length }; });
    ck(`[${w}] 'I've set them' stores ollie-p:gac:s84e1 and the strip turns green`, ov2.tick === true && ov2.strip === "played" && /✓ Defences set for Season 84 Event 1/.test(ov2.txt), ov2.txt.slice(0, 160));
    ck(`[${w}] Re-enter GAC flag auto-resolves (gone from Top flags, one fewer red)`, !/Re-enter GAC|Set GAC defence/.test(ov2.txt) && ov2.red === redBefore - 1, `${redBefore}→${ov2.red}`);
    await L.go(p, "ollie", "coach");
    const co = await p.evaluate(() => { const c = [...document.querySelectorAll(".card")].find(x => /Action flags/.test(x.textContent)); return { strip: c && c.querySelector(".pbm-gac") ? c.querySelector(".pbm-gac").dataset.pbmGac : null, txt: c ? c.textContent : "", first: c && c.querySelector(".cardtitle + .pbm-gac") ? 1 : 0 }; });
    ck(`[${w}] Coach's corner: strip at the top of Action flags, Re-enter GAC flag hidden`, co.strip === "played" && co.first === 1 && !/Re-enter GAC|Set GAC defence/.test(co.txt), co.txt.slice(0, 160));
    o = await L.overflow(p); ck(`[${w}] coach: no horizontal overflow`, o.doc <= o.inner + 1, JSON.stringify(o));
    await p.evaluate(() => { const e = document.querySelector("#tips .pbm-gac"); if (e) e.scrollIntoView({ block: "center" }); }); await p.waitForTimeout(100);
    await p.screenshot({ path: L.path.join(SHOTS, `pbm-coach-played-${w}.png`), fullPage: false });
    await p.click('#tips [data-pbm-gac="played"] .pbm-gac-undo'); await p.waitForTimeout(250);
    const co2 = await p.evaluate(() => { const c = [...document.querySelectorAll(".card")].find(x => /Action flags/.test(x.textContent)); return { strip: c.querySelector(".pbm-gac").dataset.pbmGac, re: /Re-enter GAC|Set GAC defence/.test(c.textContent), tick: state.ticks["ollie-p:gac:s84e1"] }; });
    ck(`[${w}] Undo → pending again and the flag returns`, co2.strip === "pending" && co2.re && co2.tick === false, JSON.stringify(co2));
    /* SR-detected play for Tiny via gacHist */
    await p.evaluate(() => { const T = (d, h) => new Date(2026, 9, d, h, 0, 0).getTime();
      state.pulls.tiny.gacHist = [{ at: T(7, 9), sr: 1649, league: "Carb 4" }, { at: T(8, 10), sr: 1690, league: "Carb 4", prevAt: T(7, 21) }];
      store.write(state, { pulls: true, skipStamp: true, skipSync: true }); });
    await L.go(p, "tiny", "coach");
    const ti = await p.evaluate(() => { const c = [...document.querySelectorAll(".card")].find(x => /Action flags/.test(x.textContent)); return { strip: c.querySelector(".pbm-gac").dataset.pbmGac, txt: c.textContent }; });
    ck(`[${w}] Tiny: SR-detected play → '✓ Defences set … skill rating +41 since …' and rey-r8 flag hidden`, ti.strip === "played" && /skill rating \+41 since your/.test(ti.txt) && !/Re-enter GAC|Set GAC defence/.test(ti.txt), ti.txt.slice(0, 200));
    await L.go(p, "tiny", "overview");
    o = await L.overflow(p); ck(`[${w}] tiny overview: no horizontal overflow`, o.doc <= o.inner + 1, JSON.stringify(o));
    /* confirm card + sync box at this width */
    await p.evaluate(raw => pbmReceive({ type: "holotable-pull", v: 1, accounts: { ollie: raw } }), RAW.ollie);
    const box = await p.evaluate(() => { const r = document.getElementById("pbmConfirm").getBoundingClientRect(); return { l: r.left, r: r.right, w: innerWidth }; });
    ck(`[${w}] confirm card fits the viewport`, box.l >= 0 && box.r <= box.w, JSON.stringify(box));
    if (w === 390) await p.screenshot({ path: L.path.join(SHOTS, "pbm-confirm-390.png") });
    await p.evaluate(() => pbmCancel());
    await p.evaluate(() => openSyncModal()); await p.waitForTimeout(200);
    await p.evaluate(() => document.getElementById("pbmBmBox").scrollIntoView({ block: "center" }));
    const sb = await p.evaluate(() => { const e = document.getElementById("pbmBmBox"); return { sw: e.scrollWidth, cw: e.clientWidth, doc: document.documentElement.scrollWidth, inner: innerWidth }; });
    ck(`[${w}] bookmarklet box: no overflow`, sb.sw <= sb.cw + 1 && sb.doc <= sb.inner + 1, JSON.stringify(sb));
    if (w === 390) await p.screenshot({ path: L.path.join(SHOTS, "pbm-sync-390.png") });
    allErrs.push(...errs); await ctx.close();
  });
  /* between events (pinned 3 Oct): neutral strip */
  await sec(async () => {
    const { ctx, p, errs } = await openX(b, { tag: "off", pin: [2026, 9, 3, 12] });
    await L.go(p, "ollie", "overview");
    const s = await p.evaluate(() => { const e = document.querySelector(".pbm-gac"); return e ? { st: e.dataset.pbmGac, t: e.textContent } : null; });
    ck("between events: neutral 'unknown' strip naming the next event", s && s.st === "unknown" && /next: Season 84 Event 1/.test(s.t), JSON.stringify(s));
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 9. file:// fallback ---------- */
  await sec(async () => {
    const { ctx, p, errs } = await openX(b, { tag: "file", url: "file://" + L.FILE });
    const r = await p.evaluate(() => ({ link: !!document.getElementById("pbmBmLink"), txt: (document.getElementById("pbmBmBox") || {}).textContent || "", alt: pbmPullAltText(true) }));
    ck("file://: no bookmarklet, says why, points at Export/Import", !r.link && /open as a local file/.test(r.txt) && /Export \/ ⬆ Import roster snapshot/.test(r.txt) && /hosted copy/.test(r.alt), r.txt.slice(0, 160));
    allErrs.push(...errs); await ctx.close();
  });

  ck("zero page errors across every context", allErrs.length === 0, JSON.stringify(allErrs.slice(0, 6)));
  await L.finish(b, srv);
})().catch(e => { console.error(e); process.exit(2); });
