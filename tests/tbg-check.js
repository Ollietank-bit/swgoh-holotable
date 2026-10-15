/* tbg: TB Guide — the TB tab is now swgohrote.com ("SWGOH RoTE Auto Guide") in a sandboxed iframe, with the old
   Holotable Rise of the Empire tracker kept in a collapsed card. Boots the real saved state + roster pulls.
   The sandbox cannot reach swgohrote.com, so every request to it is fulfilled by Playwright routing with a tiny
   static page — that exercises the real iframe load path without the network. Nothing here proves the LIVE site
   renders in the frame; that has to be checked in a real browser.
   Covers: the CSP (frame-src is exactly https://www.swgohrote.com, nothing else changed), the "TB Guide" label and
   the 5 sections, one lazily-created iframe per section with the exact src/sandbox/referrerpolicy/title/loading and
   no allow=, section switching replaces it, an ordinary re-render does NOT reload it, the credit + "Open in new tab"
   links (rel noopener noreferrer), the ally-code chips (clipboard success and the refused-clipboard fallback), the
   legacy tracker inside a collapsed <details> whose tick persists across a reload, the layout editor on the legacy
   card, the crystal-budget link in Events → Executor, the #tab=tb deep link, no horizontal overflow at 390/1280 on
   both accounts and every section, zero page errors. Screenshots go to ../shots/. */
const L = require("./lib.js");
const ck = L.ck;
const fs = L.fs, path = L.path;
const SHOTS = path.join(L.ROOT, "shots");
try { fs.mkdirSync(SHOTS, { recursive: true }); } catch (e) {}
const ORIGIN = "https://www.swgohrote.com";
const SECTIONS = [["guide", "Guide", "/"], ["map", "Map", "/map-view"], ["planner", "Squad planner", "/planner"], ["search", "Search", "/usage"], ["budget", "Crystal budget", "/budget"]];
const SANDBOX = "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox";
/* The CSP as it was before the swgohrote.com frame-src was added (frozen literal: no dependency on a base copy of the app). */
const PRE_FRAME_CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src https://swgoh.gg https://corsproxy.io https://api.allorigins.win https://api.codetabs.com https://api.github.com; base-uri 'none'; form-action 'none'";
const cspOf = html => (html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)">/) || [])[1] || "";

/* L.open, plus: swgohrote.com is fulfilled with a stub page (registered BEFORE the first navigation, so even a
   boot straight onto the TB tab is covered) and every request to it is logged. */
async function openT(b, o) {
  o = o || {};
  const ctx = await b.newContext({ viewport: { width: o.width || 1280, height: o.height || 1000 } });
  if (o.clipboard) await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: `http://127.0.0.1:${L.PORT}` });
  await ctx.addInitScript(([s, pl, seedKey]) => {
    try { if (sessionStorage.getItem(seedKey)) return;
      localStorage.clear(); localStorage.setItem("swgoh-tracker", s);
      localStorage.setItem("swgoh-holotable-pulls-v1", pl);
      sessionStorage.setItem(seedKey, "1"); } catch (e) {}
  }, [L.REAL, L.PULLS, "seeded-" + (o.tag || "t")]);
  await ctx.route(/fonts\.g|swgoh\.gg\/|corsproxy|allorigins|codetabs|api\.github/, r => r.abort());
  const reqs = [];
  await ctx.route(/^https:\/\/(www\.)?swgohrote\.com\//, r => {
    reqs.push(r.request().url());
    const u = new URL(r.request().url());
    r.fulfill({ status: 200, contentType: "text/html", body: `<!doctype html><meta charset="utf-8"><title>stub</title><body style="margin:0;background:#123;color:#fff;font:16px sans-serif"><p id="stub">swgohrote stub ${u.pathname.replace(/[<>&"]/g, "")}</p></body>` });
  });
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push(String(e).slice(0, 300)));
  p.on("console", m => { if (m.type() === "error" && !/Failed to load resource|net::ERR|fonts\.g/.test(m.text())) errs.push("console: " + m.text().slice(0, 200)); });
  await p.goto(`http://127.0.0.1:${L.PORT}/x.html${o.hash || ""}`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(o.settle || 900);
  return { ctx, p, errs, reqs };
}
const frameInfo = p => p.evaluate(() => [...document.querySelectorAll("#pane-tb iframe")].map(f => ({
  src: f.getAttribute("src"), sandbox: f.getAttribute("sandbox"), ref: f.getAttribute("referrerpolicy"), title: f.getAttribute("title"),
  loading: f.getAttribute("loading"), allow: f.getAttribute("allow"), allowfullscreen: f.hasAttribute("allowfullscreen"),
  h: Math.round(f.getBoundingClientRect().height), w: Math.round(f.getBoundingClientRect().width) })));
const stubText = async p => { const f = p.frames().find(x => x.url().startsWith(ORIGIN)); if (!f) return null; try { return await f.evaluate(() => (document.getElementById("stub") || {}).textContent || ""); } catch (e) { return "ERR " + e.message; } };
const pick = async (p, label) => { await p.evaluate(l => { const btn = [...document.querySelectorAll("#tbNav button")].find(x => x.textContent.trim() === l); btn.click(); }, label); await p.waitForTimeout(500); };

(async () => {
  const srv = await L.serve(); const b = await L.chromium.launch({ headless: true });

  /* ---- 1. CSP (static, both files) ---- */
  {
    const html = fs.readFileSync(L.FILE, "utf8");
    const csp = cspOf(html), base = PRE_FRAME_CSP;
    const dirs = Object.fromEntries(csp.split(";").map(x => x.trim()).filter(Boolean).map(x => { const [k, ...v] = x.split(/\s+/); return [k, v]; }));
    ck("CSP has frame-src https://www.swgohrote.com and nothing broader in it", JSON.stringify(dirs["frame-src"]) === JSON.stringify(["https://www.swgohrote.com"]), JSON.stringify(dirs["frame-src"]));
    ck("CSP: no child-src / worker-src added; default-src still 'none'; no wildcard or bare https: anywhere", !dirs["child-src"] && !dirs["worker-src"] && JSON.stringify(dirs["default-src"]) === `["'none'"]` && !/(^|\s)(\*|https:)(\s|;|$)/.test(csp) && !/\*\./.test(csp), csp);
    ck("CSP: the only change vs the pre-frame CSP is the inserted frame-src directive", csp.replace(" frame-src https://www.swgohrote.com;", "") === base && csp !== base, csp);
    ck("exactly one CSP meta", (html.match(/http-equiv="Content-Security-Policy"/g) || []).length === 1, "");
  }

  /* ---- 2. tab label, sections, lazy single iframe, attributes, switching, no reload on re-render ---- */
  {
    const { ctx, p, errs, reqs } = await openT(b, { width: 1280, tag: "main" });
    const pre = await p.evaluate(() => ({ label: (SUBTABS.find(t => t.key === "tb") || {}).label, frames: document.querySelectorAll("iframe").length, hasOld: SUBTABS.some(t => /TB Planner/.test(t.label)),
 }));
    ck("tab label is 'TB Guide' (was 'TB Planner'); nothing in SUBTABS says TB Planner", pre.label === "TB Guide" && !pre.hasOld, JSON.stringify(pre));
    ck("lazy: no iframe and no swgohrote request before the TB tab is opened", pre.frames === 0 && reqs.length === 0, `${pre.frames} / ${reqs.join()}`);
    const keys0 = await p.evaluate(() => Object.keys(localStorage).sort().join());
    await L.go(p, "ollie", "tb"); await p.waitForTimeout(600);
    const gnav = await p.evaluate(() => ({ active: [...document.querySelectorAll("#groupSubtabs button.active, #localRouteList button.active")].map(e => e.textContent.trim()), any: [...document.querySelectorAll("button, a")].some(e => /TB Planner/.test(e.textContent)) }));
    ck("Battle nav: the active tab button reads 'TB Guide' (desktop + phone route list); no 'TB Planner' anywhere", gnav.active.length === 2 && gnav.active.every(t => t === "TB Guide") && !gnav.any, JSON.stringify(gnav));
    const nav = await p.evaluate(() => [...document.querySelectorAll("#tbNav button")].map(x => ({ t: x.textContent.trim(), on: x.classList.contains("active"), sel: x.getAttribute("aria-selected") })));
    ck("TB tab shows the 5 sections: Guide, Map, Squad planner, Search, Crystal budget", JSON.stringify(nav.map(n => n.t)) === JSON.stringify(SECTIONS.map(s => s[1])), JSON.stringify(nav));
    ck("default section is Guide (the fixture's old views.tb phase value is not a section)", nav[0].on && nav[0].sel === "true" && nav.filter(n => n.on).length === 1, JSON.stringify(nav));
    const mig = await p.evaluate(() => ({ tb: state.views.tb, ph: state.views["tb-phase"] || null }));
    ck("old views.tb phase value migrated in memory: views.tb = 'guide'", mig.tb === "guide", JSON.stringify(mig));
    for (const [key, label, pth] of SECTIONS) {
      await pick(p, label);
      const f = await frameInfo(p);
      const want = ORIGIN + pth;
      ck(`[${key}] exactly one iframe in the TB tab`, f.length === 1, JSON.stringify(f));
      const x = f[0] || {};
      ck(`[${key}] src is exactly ${want}`, x.src === want, x.src);
      ck(`[${key}] sandbox / referrerpolicy / loading=lazy / title / no allow`, x.sandbox === SANDBOX && x.ref === "no-referrer" && x.loading === "lazy" && /swgohrote\.com/.test(x.title || "") && /third-party/.test(x.title || "") && x.allow === null && !x.allowfullscreen, JSON.stringify(x));
      ck(`[${key}] frame is tall enough for a phone (>= 480px, ~80vh) and fits the pane width`, x.h >= 480 && x.h >= Math.round(1000 * 0.79) && x.w > 300 && x.w <= 1280, `${x.w}x${x.h}`);
      const st = await stubText(p);
      ck(`[${key}] the frame loaded (stubbed) ${pth}`, st === `swgohrote stub ${pth}`, String(st));
      const sv = await p.evaluate(() => state.views.tb);
      ck(`[${key}] section remembered in state.views.tb (device-local)`, sv === key, sv);
      const open = await p.evaluate(() => [...document.querySelectorAll("#tbEmbed a.tbg-open")].map(a => ({ href: a.getAttribute("href"), t: a.target, rel: a.rel, txt: a.textContent.trim() })));
      ck(`[${key}] one 'Open in new tab ↗' link to the same URL, target=_blank rel="noopener noreferrer"`, open.length === 1 && open[0].href === want && open[0].t === "_blank" && open[0].rel === "noopener noreferrer" && /Open in new tab ↗/.test(open[0].txt), JSON.stringify(open));
      await p.screenshot({ path: path.join(SHOTS, `tbg-1280-${key}.png`), fullPage: false });
    }
    const req = [...new Set(reqs.map(u => new URL(u).pathname))];
    ck("each section requested only when selected (5 distinct pages, in click order, nothing else)", JSON.stringify(req) === JSON.stringify(SECTIONS.map(s => s[2])), JSON.stringify(req));
    const head = await p.evaluate(() => { const e = document.getElementById("tbEmbed"); return { credit: (e.querySelector(".tbg-credit") || {}).textContent || "", note: (e.querySelector(".tbg-note") || {}).textContent || "" }; });
    ck("credit line: Powered by swgohrote.com — a free community tool; not part of Holotable, its data isn't stored here", /^Powered by swgohrote\.com — a free community tool; not part of Holotable, its data isn't stored here\.$/.test(head.credit.trim()), head.credit);
    ck("honest note: live third-party site, can change or go away", /live third-party site/.test(head.note) && /change, break or go away/.test(head.note) && /Open in new tab/.test(head.note), head.note);
    /* re-render must not reload the frame */
    await pick(p, "Guide");
    await p.evaluate(() => { document.querySelector("#pane-tb iframe").__tbgMark = 1; });
    const n0 = reqs.length;
    await p.evaluate(() => { render(); switchAcct("tiny"); render(); switchAcct("ollie"); });
    await p.waitForTimeout(400);
    const same = await p.evaluate(() => { const f = document.querySelectorAll("#pane-tb iframe"); return { n: f.length, mark: f[0] && f[0].__tbgMark === 1 }; });
    ck("render() and an account switch keep the SAME iframe (no reload, no new request)", same.n === 1 && same.mark && reqs.length === n0, JSON.stringify(same) + ` req ${n0}->${reqs.length}`);
    /* reload: remembered section comes back */
    await pick(p, "Map");
    await p.reload({ waitUntil: "domcontentloaded" }); await p.waitForTimeout(900);
    await L.go(p, "ollie", "tb"); await p.waitForTimeout(400);
    const after = await frameInfo(p);
    ck("after a reload the last section (Map) is restored", after.length === 1 && after[0].src === ORIGIN + "/map-view", JSON.stringify(after.map(x => x.src)));
    const keys1 = await p.evaluate(() => Object.keys(localStorage).sort().join());
    ck("no new localStorage keys (same key set before the TB tab was opened and after all of the above)", keys1 === keys0, `${keys0} -> ${keys1}`);
    ck("no page errors (main)", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ---- 3. ally-code chips: clipboard success + refused-clipboard fallback ---- */
  {
    const { ctx, p, errs } = await openT(b, { width: 1280, tag: "clip", clipboard: true });
    await L.go(p, "ollie", "tb"); await p.waitForTimeout(400);
    const chips = await p.evaluate(() => [...document.querySelectorAll("#tbEmbed .tbg-chip")].map(c => ({ k: c.dataset.tbgCode, t: c.textContent.replace(/\s+/g, " ").trim(), aria: c.getAttribute("aria-label") })));
    ck("two ally-code chips: Copy Ollietank's ally code 229-917-529, Copy Tiny's ally code 295-352-286", chips.length === 2 && /Copy Ollietank's ally code 229-917-529/.test(chips[0].t) && /Copy Tiny's ally code 295-352-286/.test(chips[1].t) && chips[0].aria === "Copy Ollietank's ally code 229-917-529" && chips[1].aria === "Copy Tiny's ally code 295-352-286", JSON.stringify(chips));
    await p.click('#tbEmbed .tbg-chip[data-tbg-code="tiny"]'); await p.waitForTimeout(300);
    const r = await p.evaluate(async () => ({ clip: await navigator.clipboard.readText().catch(e => "ERR " + e), msg: document.getElementById("tbgMsg").textContent, boxHidden: document.getElementById("tbgCopyText").hidden }));
    ck("tap copies Tiny's ally code digits to the clipboard and says so", r.clip === "295352286" && /Copied Tiny's ally code \(295-352-286\)/.test(r.msg) && r.boxHidden, JSON.stringify(r));
    await p.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new Error("denied")); });
    await p.click('#tbEmbed .tbg-chip[data-tbg-code="ollie"]'); await p.waitForTimeout(300);
    const f = await p.evaluate(() => { const box = document.getElementById("tbgCopyText"); return { hidden: box.hidden, val: box.value, focused: document.activeElement === box, sel: box.selectionEnd - box.selectionStart, msg: document.getElementById("tbgMsg").textContent }; });
    ck("refused clipboard: the code is shown selected in a read-only box with an explanation (pbmBmCopy pattern)", !f.hidden && f.val === "229917529" && f.focused && f.sel === 9 && /wouldn't copy automatically/.test(f.msg), JSON.stringify(f));
    ck("no page errors (chips)", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ---- 4. legacy tracker: collapsed details, functional, tick persists across reload; layout editor ---- */
  {
    const { ctx, p, errs } = await openT(b, { width: 1280, tag: "legacy" });
    await L.go(p, "ollie", "tb"); await p.waitForTimeout(400);
    const d = await p.evaluate(() => { const card = document.querySelector('#tbGrid [data-card="legacy"]'); const det = card && card.querySelector("details.tb-legacy");
      return { cards: document.querySelectorAll("#tbGrid [data-card]").length, title: card && card.querySelector(".cardtitle").textContent.trim(), det: !!det, open: det && det.open, inside: det && !!det.querySelector('input[type="checkbox"]') && !!det.querySelector("#tbLegacyNav"),
        boxesOutside: [...document.querySelectorAll('#pane-tb input[type="checkbox"]')].filter(x => !x.closest("details.tb-legacy")).length, txt: det && det.textContent,
        last: [...document.querySelectorAll("#pane-tb > *")].pop().id, frameAbove: !!(document.querySelector("#tbEmbed iframe").compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING) }; });
    ck("legacy tracker is one card titled 'Legacy special-mission tracker (previous TB tab)', at the bottom (below the embed)", d.cards === 1 && d.title === "Legacy special-mission tracker (previous TB tab)" && d.last === "tbGrid" && d.frameAbove, JSON.stringify({ c: d.cards, t: d.title, last: d.last, a: d.frameAbove }));
    ck("its tracker lives inside a <details> that is collapsed on load; no tracker controls outside it", d.det && d.open === false && d.inside && d.boxesOutside === 0, JSON.stringify({ det: d.det, open: d.open, inside: d.inside, out: d.boxesOutside }));
    ck("legacy note: was the Holotable's own RotE tracker; Phase 5 gates unconfirmed", /Holotable's own Rise of the Empire tracker/.test(d.txt) && /Phase 5 gates are unconfirmed/.test(d.txt), (d.txt || "").slice(0, 300));
    await p.evaluate(() => { document.querySelector("details.tb-legacy").open = true; }); await p.waitForTimeout(200);
    const ph = await p.evaluate(() => [...document.querySelectorAll("#tbLegacyNav button")].map(x => x.textContent.trim() + (x.classList.contains("active") ? "*" : "")));
    ck("legacy phase pills 1–6 inside the card", ph.length === 6 && /^Phase 1/.test(ph[0]) && ph.filter(x => x.endsWith("*")).length === 1, JSON.stringify(ph));
    await p.evaluate(() => { document.querySelector("#pane-tb iframe").__tbgMark = 1; });
    await p.check('details.tb-legacy input[aria-label="Mark Corellia complete"]'); await p.waitForTimeout(300);
    const t1 = await p.evaluate(() => ({ v: state.tb["1-Corellia"], open: document.querySelector("details.tb-legacy").open, run: !!state.tbRun, mark: document.querySelector("#pane-tb iframe").__tbgMark === 1 }));
    ck("ticking writes state.tb['1-Corellia'].done, keeps the details open and the frame untouched", t1.v && t1.v.done === true && t1.open && t1.run && t1.mark, JSON.stringify(t1));
    await p.selectOption('details.tb-legacy select[aria-label="Assignee for Corellia"]', "tiny"); await p.waitForTimeout(200);
    await p.evaluate(() => { [...document.querySelectorAll("#tbLegacyNav button")][2].click(); }); await p.waitForTimeout(300);
    const t2 = await p.evaluate(() => ({ ph: state.views["tb-phase"], title: [...document.querySelectorAll("details.tb-legacy .cardtitle")].map(x => x.textContent).join("|"), open: document.querySelector("details.tb-legacy").open, tb: state.views.tb }));
    ck("phase pill switches the legacy phase (views['tb-phase']) and leaves the TB Guide section alone", t2.ph === "3" && /Phase 3/.test(t2.title) && t2.open && t2.tb === "guide", JSON.stringify(t2));
    await p.reload({ waitUntil: "domcontentloaded" }); await p.waitForTimeout(900);
    await L.go(p, "ollie", "tb"); await p.waitForTimeout(300);
    const t3 = await p.evaluate(() => { const det = document.querySelector("details.tb-legacy"); const wasOpen = det.open; det.open = true;
      [...document.querySelectorAll("#tbLegacyNav button")][0].click(); return { wasOpen, saved: JSON.parse(localStorage.getItem("swgoh-tracker")).tb["1-Corellia"] }; });
    await p.waitForTimeout(300);
    const t4 = await p.evaluate(() => { document.querySelector("details.tb-legacy").open = true; const cb = document.querySelector('details.tb-legacy input[aria-label="Mark Corellia complete"]'), sel = document.querySelector('details.tb-legacy select[aria-label="Assignee for Corellia"]'); return { checked: cb && cb.checked, who: sel && sel.value, row: cb && cb.closest(".form-row").classList.contains("done") }; });
    ck("after a reload: collapsed again, and the tick + assignee persisted (state.tb in swgoh-tracker)", t3.wasOpen === false && t3.saved && t3.saved.done === true && t3.saved.assigned === "tiny" && t4.checked && t4.who === "tiny" && t4.row, JSON.stringify({ t3, t4 }));
    await p.screenshot({ path: path.join(SHOTS, "tbg-1280-legacy-open.png"), fullPage: true });
    /* layout editor on the TB pane */
    await p.evaluate(() => { document.querySelector("#pane-tb iframe").__tbgMark = 1; if (!editMode) toggleEdit(); }); await p.waitForTimeout(250);
    const e1 = await p.evaluate(() => ({ tools: !!document.querySelector('#tbGrid [data-card="legacy"] .lay-tools'), fixed: LAY_FIXED.includes("tb"), mark: document.querySelector("#pane-tb iframe").__tbgMark === 1 }));
    ck("edit mode: the legacy card gets layout tools; tb stays in LAY_FIXED; frame not reloaded", e1.tools && e1.fixed && e1.mark, JSON.stringify(e1));
    await p.click('#tbGrid [data-card="legacy"] .lay-tools .lay-toggle'); await p.waitForTimeout(200);
    const e2 = await p.evaluate(() => ({ hidden: (state.layout.hidden.tb || []).includes("legacy"), strip: !!document.querySelector('#tbGrid .lay-hidcard') }));
    await p.evaluate(() => { showCard("tb", "legacy"); try { layAlign(); } catch (e) { window.__alignErr = String(e); } try { laySortImportance(); } catch (e) { window.__sortErr = String(e); } }); await p.waitForTimeout(250);
    const e3 = await p.evaluate(() => ({ back: !(state.layout.hidden.tb || []).includes("legacy") && !!document.querySelector('#tbGrid [data-card="legacy"]:not(.lay-hidcard)'), alignErr: window.__alignErr || null, sortErr: window.__sortErr || null, frames: document.querySelectorAll("#pane-tb iframe").length }));
    ck("hide → 'Hidden' strip; show brings it back; Align and Sort run without errors; still one frame", e2.hidden && e2.strip && e3.back && !e3.alignErr && !e3.sortErr && e3.frames === 1, JSON.stringify({ e2, e3 }));
    await p.evaluate(() => { if (editMode) toggleEdit(); }); await p.waitForTimeout(150);
    ck("no page errors (legacy + layout)", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ---- 5. budget link in Events → Executor; registry entry; deep link ---- */
  {
    const { ctx, p, errs } = await openT(b, { width: 1280, tag: "budget" });
    await p.evaluate(() => { state.views.events = "executor"; switchTab("events"); }); await p.waitForTimeout(300);
    const bl = await p.evaluate(() => [...document.querySelectorAll('#eventsGrid [data-card="executor"] a[href="https://www.swgohrote.com/budget"]')].map(a => ({ t: a.target, rel: a.rel, txt: a.textContent })));
    ck("Events → Executor card links the Crystal Income Calculator (https://www.swgohrote.com/budget), target=_blank rel=noopener noreferrer", bl.length === 1 && bl[0].t === "_blank" && bl[0].rel === "noopener noreferrer" && /Crystal Income Calculator/.test(bl[0].txt), JSON.stringify(bl));
    const all = await p.evaluate(() => { switchTab("overview"); return document.querySelectorAll('#pane-overview a[href*="swgohrote.com"]').length; });
    ck("the budget link is not sprinkled elsewhere (Overview has none)", all === 0, String(all));
    const reg = await p.evaluate(() => ({ n: SNAPSHOTS.length, e: SNAP_BY_KEY["tb-rote"] }));
    ck("SNAPSHOTS: 24 entries (cap: + cap-journeys); tb-rote kept (asOf 2026-08-09, half-life 120, tab tb), now labelled/hinted as the legacy tracker", reg.n === 24 && reg.e && reg.e.asOf === "2026-08-09" && reg.e.halfLife === 120 && reg.e.tab === "tb" && /legacy tracker/i.test(reg.e.label) && /swgohrote\.com, live/.test(reg.e.hint), JSON.stringify(reg));
    ck("no page errors (budget)", errs.length === 0, errs.join(" | "));
    await ctx.close();
    for (const acct of ["ollie", "tiny"]) {
      const o = await openT(b, { width: 390, tag: "deep-" + acct, hash: `#tab=tb&account=${acct}` });
      const dl = await o.p.evaluate(() => ({ cur: curTab, acct: current, active: document.getElementById("pane-tb").classList.contains("active"), frames: [...document.querySelectorAll("#pane-tb iframe")].map(f => f.getAttribute("src")), hash: location.hash }));
      const st = await stubText(o.p);
      ck(`#tab=tb&account=${acct} deep link opens TB Guide with the Guide frame loaded`, dl.cur === "tb" && dl.acct === acct && dl.active && dl.frames.length === 1 && dl.frames[0] === ORIGIN + "/" && st === "swgohrote stub /", JSON.stringify(dl) + " " + st);
      ck(`no page errors (deep link ${acct})`, o.errs.length === 0, o.errs.join(" | "));
      await o.ctx.close();
    }
  }

  /* ---- 6. overflow at 390 / 1280, both accounts, every section; screenshots ---- */
  for (const w of [390, 1280]) {
    const { ctx, p, errs } = await openT(b, { width: w, height: w === 390 ? 844 : 1000, tag: "ov" + w });
    const bad = [];
    for (const acct of ["ollie", "tiny"]) {
      await L.go(p, acct, "tb");
      for (const [key, label] of SECTIONS) {
        await pick(p, label);
        const o = await L.overflow(p);
        if (o.doc > o.inner + 1) bad.push(`${acct}/${key} ${JSON.stringify(o)}`);
        const el = await p.evaluate(() => [...document.querySelectorAll("#pane-tb *")].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1); }).slice(0, 3).map(e => e.className || e.tagName));
        if (el.length) bad.push(`${acct}/${key} element past the edge: ${el.join(",")}`);
        if (w === 390 && acct === "ollie") await p.screenshot({ path: path.join(SHOTS, `tbg-390-${key}.png`), fullPage: false });
      }
      await p.evaluate(() => { document.querySelector("details.tb-legacy").open = true; }); await p.waitForTimeout(150);
      const o = await L.overflow(p);
      if (o.doc > o.inner + 1) bad.push(`${acct}/legacy-open ${JSON.stringify(o)}`);
      if (acct === "ollie") {
        await p.evaluate(() => document.querySelector('#tbGrid [data-card="legacy"]').scrollIntoView());
        await p.screenshot({ path: path.join(SHOTS, `tbg-${w}-legacy-open-view.png`), fullPage: false });
      }
      await p.evaluate(() => { document.querySelector("details.tb-legacy").open = false; foldState.delete("tb-legacy"); window.scrollTo(0, 0); });
    }
    const h = await p.evaluate(() => Math.round(document.querySelector("#pane-tb iframe").getBoundingClientRect().height));
    ck(`[${w}] no horizontal overflow on the TB tab (both accounts, all 5 sections, legacy card open)`, bad.length === 0, JSON.stringify(bad));
    ck(`[${w}] frame height usable: ${h}px (>= 480 and >= 79% of the viewport)`, h >= 480 && h >= Math.round((w === 390 ? 844 : 1000) * 0.79), String(h));
    if (w === 390) await p.screenshot({ path: path.join(SHOTS, "tbg-390-full.png"), fullPage: true });
    ck(`[${w}] no page errors (overflow sweep)`, errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ---- 7. network blocked (the harness's abort, as in every other suite): no page errors, layout intact ---- */
  {
    const { ctx, p, errs } = await L.open(b, { width: 390, height: 844, tag: "blocked" });
    await L.go(p, "ollie", "tb"); await p.waitForTimeout(800);
    const o = await L.overflow(p);
    const f = await frameInfo(p);
    ck("[390, swgohrote.com aborted] still one frame, fallback link present, no overflow", f.length === 1 && o.doc <= o.inner + 1 && await p.evaluate(() => !!document.querySelector("#tbEmbed a.tbg-open")), JSON.stringify({ o, n: f.length }));
    ck("[390, swgohrote.com aborted] no page errors", errs.length === 0, errs.join(" | "));
    await p.screenshot({ path: path.join(SHOTS, "tbg-390-blocked.png"), fullPage: false });
    await ctx.close();
  }

  await L.finish(b, srv);
})().catch(e => { console.error(e); process.exit(2); });
