/* chx-check — Coach flags, Executor card + crystal decision, the failed-pull status card and the data-freshness
   line (7 Oct 2026). Clock pinned to Wed 7 Oct 2026 13:00 UTC (Playwright clock + UTC timezone) so the
   Executor dates (next Discarded Doctrine = 15 Oct) and the fixture pull time (12:10 UTC) are deterministic.
   Fixtures: real saved state (Executor counts 55/55) + the 7 Oct roster snapshot (Ollie Executor 5★, Tiny 4★). */
const L = require("./lib.js");
const { ck, SNAP, REAL, PULLS } = L;
const SHOTS = L.path.join(L.ROOT, "shots");
try { L.fs.mkdirSync(SHOTS, { recursive: true }); } catch (e) {}
const NOW = "2026-10-07T13:00:00Z";

async function openC(b, o) {
  o = o || {};
  const ctx = await b.newContext({ viewport: { width: o.width || 1280, height: o.height || 1000 }, timezoneId: "UTC", locale: "en-US" });
  await ctx.clock.setFixedTime(new Date(NOW));
  await ctx.addInitScript(([s, pl, withPulls, seedKey]) => {
    try { if (sessionStorage.getItem(seedKey)) return;
      localStorage.clear(); localStorage.setItem("swgoh-tracker", s);
      if (withPulls) localStorage.setItem("swgoh-holotable-pulls-v1", pl);
      sessionStorage.setItem(seedKey, "1"); } catch (e) {}
  }, [o.state || REAL, PULLS, o.pulls !== false, "seeded-" + (o.tag || "x")]);
  await ctx.route(/fonts\.g|swgoh\.gg|corsproxy|allorigins|codetabs|api\.github/, r => r.abort());
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push(String(e).slice(0, 300)));
  p.on("console", m => { if (m.type() === "error" && !/Failed to load resource|net::ERR|fonts\.g/.test(m.text())) errs.push("console: " + m.text().slice(0, 200)); });
  await p.goto(`http://127.0.0.1:${L.PORT}/x.html`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(o.settle || 900);
  return { ctx, p, errs };
}
const noOverflow = async (p, label) => { const o = await L.overflow(p); ck(`${label}: no horizontal overflow`, o.doc <= o.inner + 1, JSON.stringify(o)); };
/* Expected built-GL phrase computed from the fixture pull (relic'd GLs, GL_ORDER order) — never hardcoded. */
const GL_ORDER = ["GLREY", "SUPREMELEADERKYLOREN", "GRANDMASTERLUKE", "SITHPALPATINE", "JEDIMASTERKENOBI", "LORDVADER", "JABBATHEHUTT", "GLLEIA", "GLAHSOKATANO", "GLHONDO"];
const SHORT = { GLREY: "Rey", SUPREMELEADERKYLOREN: "SLKR", GRANDMASTERLUKE: "JML", SITHPALPATINE: "SEE", JEDIMASTERKENOBI: "JMK", LORDVADER: "Lord Vader", JABBATHEHUTT: "Jabba", GLLEIA: "GL Leia", GLAHSOKATANO: "GL Ahsoka", GLHONDO: "GL Hondo" };
function builtPhrase(acct) {
  const reqs = SNAP.accounts[acct].reqs;
  const a = GL_ORDER.filter(id => reqs[id] && (reqs[id].r || 0) > 0).map(id => `${SHORT[id]} R${reqs[id].r}`);
  return a.length <= 1 ? (a[0] || "") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
}

(async () => {
  const srv = await L.serve(); const b = await L.chromium.launch({ headless: true });
  const allErrs = [];
  const sec = async (name, fn) => { try { await fn(); } catch (e) { ck(`section '${name}' crashed: ` + String(e.message || e).split("\n")[0].slice(0, 160), false, ""); } };

  /* ---------- 1. Executor arithmetic (pure) ---------- */
  await sec("math", async () => {
    const { ctx, p, errs } = await openC(b, { tag: "math" });
    const r = await p.evaluate(() => {
      const now = new Date();
      const o = executorProgress("ollie", now), t = executorProgress("tiny", now);
      const dO = chxExecDecision("ollie", now), dT = chxExecDecision("tiny", now);
      const keep = JSON.parse(JSON.stringify(state.executor));
      state.executor.tiny = { shards: 0, star: 4, at: Date.now() };
      const t0 = executorProgress("tiny", now);
      state.executor = keep;
      return { o, t, t0, c250: chxOneEventCost(250), c200: chxOneEventCost(200), c201: chxOneEventCost(201), r30: chxRefreshes(30), r10: chxRefreshes(10), r0: chxRefreshes(0),
        dO: { kind: dO.kind, sooner: dO.target.sooner, crystals: dO.target.crystals, refreshes: dO.target.refreshes, next: dO.nextISO },
        dT: { kind: dT.kind, next: dT.nextISO, ladder: dT.ladder.map(x => [x.st, x.cum, x.r, x.crystals, x.freeISO]) },
        cost: SHIP_STAR_COST, ev: EXECUTOR_EVENT };
    });
    const ev = r.ev, cumFrom4 = r.cost[5] + r.cost[6] + r.cost[7];
    ck("constants: 65/85/100 blueprints, 250 cumulative from 4★", r.cost[5] === 65 && r.cost[6] === 85 && r.cost[7] === 100 && cumFrom4 === 250, JSON.stringify(r.cost));
    ck("r(n): r(0)=0, r(10)=0 (free run), r(30)=2", r.r0 === 0 && r.r10 === 0 && r.r30 === 2, `${r.r0}/${r.r10}/${r.r30}`);
    const exp250 = ev.refreshMax * ev.refreshCrystals + Math.ceil((250 - ev.shardsPerRun - ev.refreshMax * ev.refreshShards) / ev.packShards) * ev.packCrystals;
    ck("chxOneEventCost(250) = 19 refreshes + 5 packs = 25,231 (from the constants)", r.c250.crystals === exp250 && exp250 === 25231 && r.c250.refreshes === 19 && r.c250.packs === 5 && r.c250.capped, JSON.stringify(r.c250));
    ck("200 blueprints fit the cap exactly (19 refreshes, no pack); 201 needs one pack", !r.c200.capped && r.c200.packs === 0 && r.c200.crystals === 18981 && r.c201.capped && r.c201.packs === 1 && r.c201.crystals === 18981 + 1250, JSON.stringify([r.c200, r.c201]));
    ck("Tiny from 4★ with 0 blueprints: crystalsToMax = 25,231 (packs past the 19-refresh cap)", r.t0.toMax === 250 && r.t0.crystalsToMax === 25231, JSON.stringify({ toMax: r.t0.toMax, c: r.t0.crystalsToMax }));
    ck("Ollie fixture: 5★ 55/85 → 30 to 6★ (1,998 crystals), 130 to 7★ (11,988)", r.o.star === 5 && r.o.toNextStar === 30 && r.o.crystalsToNextStar === 1998 && r.o.toMax === 130 && r.o.crystalsToMax === 11988, JSON.stringify(r.o));
    ck("Tiny fixture: 4★ 55/65 → 10 to 5★ (free), 195 to 7★ (18,981 — inside the cap)", r.t.star === 4 && r.t.toNextStar === 10 && r.t.crystalsToNextStar === 0 && r.t.toMax === 195 && r.t.crystalsToMax === 18981, JSON.stringify(r.t));
    ck("dates (clock 7 Oct 2026): next occurrence 15 Oct; Ollie 6★ 15 Dec, 7★ 15 Oct 2027; Tiny 5★ 15 Oct, 7★ 15 May 2028",
      r.dO.next === "2026-10-15" && r.o.nextStarISO === "2026-12-15" && r.o.maxISO === "2027-10-15" && r.t.nextStarISO === "2026-10-15" && r.t.maxISO === "2028-05-15", JSON.stringify([r.o.nextStarISO, r.o.maxISO, r.t.nextStarISO, r.t.maxISO]));
    ck("decision: Tiny = save (free run completes 5★); Ollie = spend 1,998 (2 refreshes), 6★ 2 months sooner",
      r.dT.kind === "save" && r.dO.kind === "spend" && r.dO.crystals === 1998 && r.dO.refreshes === 2 && r.dO.sooner === 2, JSON.stringify([r.dT.kind, r.dO]));
    ck("Tiny ladder: 6★ in one event = 9 refreshes (8,991); 7★ = 19 refreshes (18,981)", JSON.stringify(r.dT.ladder.slice(1).map(x => [x[0], x[2], x[3]])) === JSON.stringify([[6, 9, 8991], [7, 19, 18981]]), JSON.stringify(r.dT.ladder));
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 2. Executor card (both widths) + shard entry up to the star cost ---------- */
  for (const w of [1280, 390]) await sec("exec-card-" + w, async () => {
    const { ctx, p, errs } = await openC(b, { width: w, tag: "ex" + w });
    await p.evaluate(() => { state.views.events = "executor"; switchTab("events"); }); await p.waitForTimeout(300);
    const c = await p.evaluate(() => { const card = document.querySelector('#eventsGrid [data-card="executor"]') || document.querySelector("#eventsGrid .card");
      const v = [...card.querySelectorAll(".chx-exec")].map(e => ({ kind: e.dataset.chxVerdict, chip: e.querySelector(".chip").textContent, txt: e.querySelector(".chx-exec-verdict").textContent }));
      return { v, txt: card.textContent, folds: card.querySelectorAll(".chx-exec details.fold-more").length }; });
    ck(`[${w}] Executor card: Ollie chip 'Spend 1,998 crystals on Oct 15'`, c.v[0] && c.v[0].kind === "spend" && /^Spend 1,998 crystals on Oct 15$/.test(c.v[0].chip) && /to reach 6★ 2 months sooner/.test(c.v[0].txt), JSON.stringify(c.v[0]));
    ck(`[${w}] Executor card: Tiny chip 'Save crystals — take the free run'`, c.v[1] && c.v[1].kind === "save" && c.v[1].chip === "Save crystals — take the free run" && /Oct 15/.test(c.v[1].txt), JSON.stringify(c.v[1]));
    ck(`[${w}] Executor card: one 'How this is calculated' fold per account`, c.folds === 2, String(c.folds));
    ck(`[${w}] Executor card: the wrong "Can't be bought inside one occurrence" copy is gone; advice disclaimer present`, !/Can't be bought/.test(c.txt) && /can't see your crystal balance/.test(c.txt), "");
    await p.evaluate(() => { const d = document.querySelector('.chx-exec details.fold-more'); d.open = true; }); await p.waitForTimeout(100);
    const how = await p.evaluate(() => document.querySelector('.chx-exec details.fold-more').textContent);
    ck(`[${w}] fold shows r(n) formula, the rule and the 7★ ladder`, /r\(n\) = ceil\(max\(0, n − 10\) ÷ 10\)/.test(how) && /buy packs only when the cap/.test(how) && /7★ — 130 blueprints/.test(how) && /11,988/.test(how), how.slice(0, 200));
    await noOverflow(p, `[${w}] Executor card`);
    await p.screenshot({ path: L.path.join(SHOTS, `chx-executor-${w}.png`), fullPage: false, clip: await p.evaluate(() => { const r = (document.querySelector('#eventsGrid [data-card="executor"]') || document.querySelector("#eventsGrid .card")).getBoundingClientRect(); return { x: Math.max(0, r.x), y: Math.max(0, r.y + scrollY), width: Math.min(innerWidth, r.width), height: Math.min(1400, r.height) }; }) });
    if (w === 1280) {
      const s = await p.evaluate(() => {
        executorShardsSet("ollie", 999); const saved = state.executor.ollie.shards;
        const v = executorProgress("ollie", new Date()), d = chxExecDecision("ollie", new Date());
        const txt = document.querySelector('#eventsGrid .chx-exec').closest(".card").textContent;
        const tip = TIPS.ollie.find(t => t.id === "chx-executor-plan").t;
        executorShardsSet("ollie", 55);
        return { saved, ready: v.readyToPromote, kind: d.kind, txt: /ready to promote/.test(txt), tip, back: state.executor.ollie.shards };
      });
      ck("shard entry clamps to the star cost (85), not cost − 1; shows 'ready to promote'", s.saved === 85 && s.ready && s.kind === "promote" && s.txt && /promote it in-game/.test(s.tip) && s.back === 55, JSON.stringify(s));
    }
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 3. Coach flags: derived text, severity order, routes ---------- */
  for (const w of [1280, 390]) await sec("coach-" + w, async () => {
    const { ctx, p, errs } = await openC(b, { width: w, tag: "co" + w });
    const RANK = { "! Fix now": 0, "↗ Improve": 1, "◉ Watch": 2, "✓ Keep doing": 3 };
    for (const acct of ["ollie", "tiny"]) {
      await L.go(p, acct, "coach");
      await p.evaluate(() => { state.views.coach = "priorities"; render(); }); await p.waitForTimeout(200);
      const f = await p.evaluate(() => {
        const cards = [...document.querySelectorAll("#tips .card")];
        const grab = re => { const c = cards.find(x => re.test(x.querySelector(".cardtitle") && x.querySelector(".cardtitle").textContent)); return c ? [...c.querySelectorAll("label.tip")].map(l => ({ sev: l.querySelector(".chip").textContent.trim(), t: (l.querySelector(".tiplink") || l.querySelector("b") || {}).textContent || "", note: (l.querySelector(".note") || {}).textContent || "" })) : []; };
        return { action: grab(/Action flags/), wk: grab(/Watch/) };
      });
      const order = list => list.every((x, i) => i === 0 || RANK[list[i - 1].sev] <= RANK[x.sev]);
      ck(`[${w}] ${acct}: Action flags sorted fix now → improve`, f.action.length > 0 && order(f.action), f.action.map(x => x.sev).join(","));
      ck(`[${w}] ${acct}: Watch & keep sorted watch → keep`, order(f.wk), f.wk.map(x => x.sev).join(","));
      const ex = f.action.find(x => /^Executor \d★/.test(x.t));
      if (acct === "tiny") {
        ck(`[${w}] tiny: Executor flag generated — 'Executor 4★ — 10 blueprints from 5★; the free run on Thu, Oct 15 gets you there'`, ex && /^Executor 4★ — 10 blueprints from 5★; the free run on Thu, Oct 15 gets you there/.test(ex.t) && /7★ on the free path: May 15, 2028/.test(ex.note) && /Save crystals — take the free run/.test(ex.note), JSON.stringify(ex));
        const leia = f.action.concat(f.wk).find(x => /GL Leia Organa is unlocked/.test(x.t));
        ck(`[${w}] tiny: 'GL Leia Organa is unlocked' is a ✓ Keep flag, not ! Fix now`, leia && leia.sev === "✓ Keep doing" && !f.action.some(x => /GL Leia Organa is unlocked/.test(x.t)), JSON.stringify(leia));
        ck(`[${w}] tiny: 'still only 4★ (63.5K power)' static flag is gone`, !f.action.concat(f.wk).some(x => /still only 4★|65% power/.test(x.t + x.note)), "");
      } else {
        ck(`[${w}] ollie: Executor flag generated — 'Executor 5★ — 30 to 6★: 3 free runs (Dec 15) or 1,998 crystals in one event'`, ex && /^Executor 5★ — 30 to 6★: 3 free runs \(Dec 15\) or 1,998 crystals in one event/.test(ex.t) && /7★ on the free path: Oct 15, 2027/.test(ex.note) && /Spend 1,998 crystals on Thu, Oct 15/.test(ex.note), JSON.stringify(ex));
        const gac = f.action.find(x => /GAC/.test(x.t));
        const built = builtPhrase("ollie");
        ck(`[${w}] ollie: GAC flag 'Set GAC defence — Season 84 Event 1 (5v5) is live, round closes … (estimated)'`, gac && gac.sev === "! Fix now" && /^Set GAC defence — Season 84 Event 1 \(5v5\) is live, round closes Tue, Oct 13 \(estimated\)/.test(gac.t), JSON.stringify(gac));
        ck(`[${w}] ollie: GAC note built from the pull ('${built} are built and parked — defence costs no mats')`, gac && built === "Rey R8, SLKR R9 and Jabba R9" && gac.note.includes(`${built} are built and parked — defence costs no mats`), gac && gac.note.slice(0, 160));
      }
    }
    /* derived checks retire the flag; the GAC flag keeps pbm's "I've set them" retirement */
    const ret = await p.evaluate(() => {
      const tip = TIPS.tiny.find(t => t.id === "executor-is-still-only-4");
      const reqs = JSON.parse(JSON.stringify(state.pulls.tiny.reqs));
      const before = tipIsDone("tiny", reqs, tip);
      const spec = JSON.stringify(tip.check);
      reqs.CAPITALEXECUTOR.s = 7; const saved = state.pulls.tiny; state.pulls = Object.assign({}, state.pulls, { tiny: Object.assign({}, saved, { reqs }) });
      const after = tipIsDone("tiny", reqs, tip), t7 = tip.t;
      state.pulls = Object.assign({}, state.pulls, { tiny: saved });
      return { before, after, spec, t7 };
    });
    ck(`[${w}] Executor flag carries star('CAPITALEXECUTOR', 5) and retires itself at 7★`, !ret.before && ret.after && ret.spec === JSON.stringify({ id: "CAPITALEXECUTOR", type: "star", min: 5 }) && /7★ — maxed/.test(ret.t7), JSON.stringify(ret));
    /* routes: click the flag headlines */
    await L.go(p, "ollie", "coach");
    await p.evaluate(() => { [...document.querySelectorAll("#tips .tiplink")].find(x => /^Executor 5★/.test(x.textContent)).click(); }); await p.waitForTimeout(300);
    const r1 = await p.evaluate(() => ({ tab: curTab, view: state.views.events, card: !!document.querySelector("#eventsGrid .chx-exec") }));
    ck(`[${w}] Executor flag → Events · Executor plan view`, r1.tab === "events" && r1.view === "executor" && r1.card, JSON.stringify(r1));
    await L.go(p, "ollie", "coach");
    await p.evaluate(() => { [...document.querySelectorAll("#tips .tiplink")].find(x => /^Set GAC defence/.test(x.textContent)).click(); }); await p.waitForTimeout(300);
    const r2 = await p.evaluate(() => ({ tab: curTab, view: state.views.gac }));
    ck(`[${w}] GAC flag → GAC · Defense view`, r2.tab === "gac" && r2.view === "defense", JSON.stringify(r2));
    const r3 = await p.evaluate(() => ({ fleet: tipTarget(TIPS.ollie.find(t => t.id === "executor-fleet-slipped-to-rank")).tab, blue: tipTarget({ t: "Discarded Doctrine blueprints" }).tab }));
    ck(`[${w}] 'Executor fleet slipped to rank 80' still routes to Arena; 'Discarded Doctrine' text routes to events`, r3.fleet === "arena" && r3.blue === "events", JSON.stringify(r3));
    await L.go(p, "ollie", "coach");
    await p.evaluate(() => { const b = document.querySelector("#tips .pbm-gac-set"); if (b) b.click(); }); await p.waitForTimeout(300);
    const r4 = await p.evaluate(() => ({ strip: (document.querySelector("#tips .pbm-gac") || {}).dataset.pbmGac, flag: [...document.querySelectorAll("#tips .tiplink")].some(x => /Set GAC defence/.test(x.textContent)) }));
    ck(`[${w}] pbm 'I've set them' still retires the GAC flag`, r4.strip === "played" && !r4.flag, JSON.stringify(r4));
    await p.evaluate(() => pbmGacMark("ollie", "s84e1", false)); await p.waitForTimeout(200);
    /* Weekly goals: the static 'Executor at 65% power' mode note is derived now */
    await L.go(p, "tiny", "coach");
    await p.evaluate(() => { state.views.coach = "weekly"; render(); }); await p.waitForTimeout(200);
    const wk = await p.evaluate(() => document.getElementById("modes").textContent);
    ck(`[${w}] Weekly goals: Tiny fleet note derived ('4★ now, 10 blueprints from 5★'), no '65% power'`, /Executor is the upgrade path: 4★ now, 10 blueprints from 5★/.test(wk) && !/65% power/.test(wk), wk.slice(0, 120));
    await p.evaluate(() => { state.views.coach = "priorities"; render(); }); await L.go(p, "tiny", "coach");
    await noOverflow(p, `[${w}] Coach`);
    await p.screenshot({ path: L.path.join(SHOTS, `chx-coach-tiny-${w}.png`), fullPage: false });
    await L.go(p, "ollie", "coach");
    await p.screenshot({ path: L.path.join(SHOTS, `chx-coach-ollie-${w}.png`), fullPage: false });
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 4. failed-pull status card (forced: swgoh.gg + proxies aborted) ---------- */
  for (const w of [390, 1280]) await sec("pullfail-" + w, async () => {
    const { ctx, p, errs } = await openC(b, { width: w, tag: "pf" + w });
    await p.evaluate(() => pullAll());
    await p.waitForFunction(() => !rpPullBusy, null, { timeout: 150000 });
    await p.waitForTimeout(200);
    const c = await p.evaluate(() => {
      const st = document.getElementById("pullStatus"), cs = getComputedStyle(st), r = st.getBoundingClientRect();
      const msg = st.querySelector(".chx-fail-msg");
      const btn = sel => { const e = st.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { t: e.textContent, vis: b.width > 0 && b.height > 0 && b.right <= innerWidth + 1 }; };
      return { role: st.getAttribute("role"), cls: st.className, ws: cs.whiteSpace, ov: cs.overflow, border: cs.borderTopStyle, h: r.height, right: r.right, vis: r.width > 0 && r.height > 0,
        msg: msg ? msg.textContent : "", clipped: msg ? msg.scrollWidth > msg.clientWidth + 1 : true, bm: btn(".pbm-help-btn"), imp: btn(".chx-fail-imp"), x: btn(".chx-fail-x"), info: document.getElementById("chromeSticky").classList.contains("chrome-info-open") };
    });
    ck(`[${w}] failed pull: #pullStatus is a role=status card with a border, wrapping, visible without ⓘ`, c.role === "status" && /chx-fail/.test(c.cls) && c.ws === "normal" && c.border === "solid" && c.vis && !c.info && c.h > 40, JSON.stringify(c).slice(0, 300));
    ck(`[${w}] failed pull: copy 'Couldn't reach swgoh.gg — the free proxies this app uses are blocked right now; retrying rarely helps. Showing the roster pulled today 12:10.'`,
      /^Couldn't reach swgoh\.gg — the free proxies this app uses are blocked right now; retrying rarely helps\. Showing the roster pulled today 12:10\.$/.test(c.msg.trim()) && !c.clipped, c.msg);
    ck(`[${w}] failed pull: 'Pull via swgoh.gg tab →' (.pbm-help-btn) and 'Import a snapshot' buttons on screen, plus ✕`, c.bm && c.bm.vis && c.bm.t === "Pull via swgoh.gg tab →" && c.imp && c.imp.vis && c.imp.t === "Import a snapshot" && c.x && c.x.vis, JSON.stringify([c.bm, c.imp, c.x]));
    await noOverflow(p, `[${w}] failed-pull card`);
    await p.screenshot({ path: L.path.join(SHOTS, `chx-pullfail-${w}.png`), clip: { x: 0, y: 0, width: w, height: w < 600 ? 520 : 330 } });
    await p.click("#pullStatus .chx-fail-imp"); await p.waitForTimeout(300);
    const imp = await p.evaluate(() => ({ open: document.getElementById("syncModal").classList.contains("open"), focus: document.activeElement && document.activeElement.id }));
    ck(`[${w}] 'Import a snapshot' opens ☁ Sync at the roster-snapshot import`, imp.open && imp.focus === "rpSnapImportBtn", JSON.stringify(imp));
    if (w === 1280) {
      const sm = await p.evaluate(() => { const ms = document.getElementById("syncModalStatus").textContent; const cancel = [...document.querySelectorAll("#syncModal .modal-actions .pill")].find(x => x.textContent === "Cancel"); const cs = getComputedStyle(cancel);
        return { ms, radius: cs.borderTopLeftRadius, bs: cs.borderTopStyle, bg: cs.backgroundColor }; });
      ck("Sync modal: 'Not connected yet — fill in the fields above.'", sm.ms === "Not connected yet — fill in the fields above.", sm.ms);
      ck("Sync modal: Cancel is styled as a .pill (14px radius, 1px solid border)", sm.radius === "14px" && sm.bs === "solid", JSON.stringify(sm));
      await p.screenshot({ path: L.path.join(SHOTS, "chx-syncmodal-1280.png"), fullPage: false });
    }
    await p.evaluate(() => closeSyncModal()); await p.waitForTimeout(150);
    await p.click("#pullStatus .pbm-help-btn"); await p.waitForTimeout(300);
    ck(`[${w}] 'Pull via swgoh.gg tab →' opens ☁ Sync at the bookmarklet`, await p.evaluate(() => { const e = document.getElementById("pbmBmLink"); return !!(e && e.offsetParent); }), "");
    await p.evaluate(() => closeSyncModal()); await p.waitForTimeout(150);
    const det = await p.evaluate(() => document.querySelector("#pullStatus .chx-fail-more").textContent);
    ck(`[${w}] the technical text survives under 'Details'`, /Pull failed/.test(det) && /blocks direct requests/.test(det), det.slice(0, 160));
    await p.click("#pullStatus .chx-fail-x"); await p.waitForTimeout(150);
    const gone = await p.evaluate(() => { const st = document.getElementById("pullStatus"); return { t: st.textContent, h: st.getBoundingClientRect().height }; });
    ck(`[${w}] ✕ dismisses the card`, gone.t === "" && (w > 600 || gone.h === 0), JSON.stringify(gone));
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 5. data freshness: one phrase in the header, #datasrc and the Today card ---------- */
  await sec("fresh", async () => {
    const { ctx, p, errs } = await openC(b, { tag: "fr" });
    await L.go(p, "ollie", "overview");
    const r = await p.evaluate(() => ({ ms: chxFreshMs(), max: Math.max(state.pulls.ollie.fetchedAt, state.pulls.tiny.fetchedAt), last: state.lastPull || 0,
      ps: document.getElementById("pullStatus").textContent, ds: document.querySelector("#datasrc .datasrc-label").textContent,
      today: (todayDataLine("ollie", Date.now()) || { html: "" }).html, todayCard: (document.querySelector(".today-data") || {}).textContent || "", fresh: document.body.classList.contains("data-fresh") }));
    ck("fixture has pulls but no lastPull (the contradictory case)", r.last === 0 && r.ms === r.max && r.ms > 0, JSON.stringify([r.last, r.ms, r.max]));
    ck("header: no 'First run' line when a pull exists", !/First run/.test(r.ps), r.ps);
    ck("#datasrc: 'Roster: pulled today 12:10 · …references…'", /^Roster: pulled today 12:10 · (references fresh|\d+ references? aging|\d+ stale)/.test(r.ds), r.ds);
    ck("Today card: no 'no swgoh.gg pull on this device yet'; same 'Roster: pulled today 12:10' phrase when shown", !/no swgoh\.gg pull on this device yet/.test(r.today + r.todayCard) && (!r.today || /Roster: pulled today 12:10/.test(r.today)), r.today.slice(0, 200));
    ck("Pull button de-emphasised (body.data-fresh) from the pull, not lastPull", r.fresh, "");
    allErrs.push(...errs); await ctx.close();
    const n = await openC(b, { tag: "fr0", pulls: false });
    const r0 = await n.p.evaluate(() => ({ ms: chxFreshMs(), ps: document.getElementById("pullStatus").textContent, ds: document.querySelector("#datasrc .datasrc-label").textContent, today: (todayDataLine("ollie", Date.now()) || { html: "" }).html }));
    ck("no pull at all: 'First run' still shown, #datasrc says built-in baseline, Today says no pull yet", r0.ms === 0 && /First run/.test(r0.ps) && /^Roster: built-in baseline — no pull on this device yet/.test(r0.ds) && /no swgoh\.gg pull on this device yet/.test(r0.today), JSON.stringify(r0).slice(0, 300));
    allErrs.push(...n.errs); await n.ctx.close();
    for (const w of [1280, 390]) {
      const o = await openC(b, { width: w, tag: "frs" + w });
      await L.go(o.p, "ollie", "overview");
      if (w === 390) await o.p.evaluate(() => chromeToggleInfo());
      await o.p.waitForTimeout(150);
      await o.p.screenshot({ path: L.path.join(SHOTS, `chx-fresh-${w}.png`), clip: { x: 0, y: 0, width: w, height: 420 } });
      await noOverflow(o.p, `[${w}] overview with freshness line`);
      allErrs.push(...o.errs); await o.ctx.close();
    }
  });

  ck("zero page errors across every context", allErrs.length === 0, JSON.stringify(allErrs.slice(0, 6)));
  await L.finish(b, srv);
})().catch(e => { console.error(e); process.exit(2); });
