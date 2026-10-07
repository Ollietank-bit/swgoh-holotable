/* "Next up" strip (nxt) — Overview, above the Today card. Boots the real saved state + the newest roster
   snapshot in an Australia/Sydney context with Date.now() pinned (same Date.now override as pbm-check's
   openX; the app reads the clock through nxtNow() → Date.now()). Covers: tile set + order for both
   accounts at 7 Oct 2026 12:00 local, urgency colours, est./unverified tags, tap + keyboard navigation,
   dismiss / reset persisting across reload, GAC tick hiding the defence tile, the empty strip rendering
   nothing, 390px without horizontal overflow, zero page errors, and the 30 Oct / 11 Oct clocks. */
const L = require("./lib.js");
async function openAt(b, o) {
  o = o || {};
  const ctx = await b.newContext({ viewport: { width: o.width || 1280, height: o.height || 1000 }, timezoneId: "Australia/Sydney", locale: "en-AU" });
  await ctx.addInitScript(([s, pl, seedKey, pin]) => {
    if (pin) { const real = Date.now.bind(Date), t0 = new Date(pin[0], pin[1], pin[2], pin[3], 0, 0).getTime(), s0 = real(); Date.now = () => t0 + (real() - s0); }
    try { if (!sessionStorage.getItem(seedKey)) { localStorage.clear(); localStorage.setItem("swgoh-tracker", s); localStorage.setItem("swgoh-holotable-pulls-v1", pl); sessionStorage.setItem(seedKey, "1"); } } catch (e) {}
  }, [L.REAL, L.PULLS, "seeded-" + (o.tag || "x"), o.pin || null]);
  await ctx.route(/fonts\.g|swgoh\.gg|corsproxy|allorigins|codetabs|api\.github/, r => r.abort());
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push(String(e).slice(0, 300)));
  p.on("console", m => { if (m.type() === "error" && !/Failed to load resource|net::ERR|fonts\.g/.test(m.text())) errs.push("console: " + m.text().slice(0, 200)); });
  await p.goto(`http://127.0.0.1:${L.PORT}/x.html`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(900);
  return { ctx, p, errs };
}
const tiles = p => p.evaluate(() => [...document.querySelectorAll("#nxtStrip .nxt-tile")].map(t => ({
  id: t.dataset.nxt, urg: (t.className.match(/nxt-u-(\w+)/) || [])[1], cd: t.querySelector(".nxt-cd").textContent.trim(),
  title: t.querySelector(".nxt-t").textContent.trim(), action: t.querySelector(".nxt-a").textContent.trim(),
  tag: (t.querySelector(".nxt-tag") || {}).textContent || "", aria: t.querySelector(".nxt-go").getAttribute("aria-label"),
  h: t.getBoundingClientRect().height, goH: t.querySelector(".nxt-go").getBoundingClientRect().height })));
const OCT7 = [2026, 9, 7, 12];
(async () => {
  const srv = await L.serve(); const b = await L.chromium.launch({ headless: true });

  /* A build without the strip (the pristine base) only gets the generic checks: Overview at 390 without
     horizontal overflow and without page errors, for both accounts. */
  {
    const { ctx, p, errs } = await openAt(b, { width: 390, height: 844, tag: "probe", pin: OCT7 });
    const has = await p.evaluate(() => typeof nxtStripHtml === "function" && !!document.getElementById("nxtStrip"));
    if (!has) {
      for (const acct of ["ollie", "tiny"]) { await L.go(p, acct, "overview"); const o = await L.overflow(p); L.ck(`[390, no strip] ${acct}: Overview has no horizontal overflow`, o.doc <= o.inner + 1, JSON.stringify(o)); }
      L.ck("[390, no strip] no page errors", errs.length === 0, JSON.stringify(errs.slice(0, 5)));
      L.ck("this build has no Next up strip — feature checks skipped", true, "");
      await ctx.close(); await L.finish(b, srv); return;
    }
    await ctx.close();
  }

  /* ---------- 1. 7 Oct 2026 12:00 AEDT, 1280: tile set + order per account ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "oct7", pin: OCT7 });
    const tz = await p.evaluate(() => ({ now: new Date(nxtNow()).toString(), off: new Date(nxtNow()).getTimezoneOffset() }));
    L.ck("clock pinned to Wed 7 Oct 2026 12:00 AEDT (UTC+11, DST on)", /Wed Oct 07 2026 12:00/.test(tz.now) && tz.off === -660, JSON.stringify(tz));
    await L.go(p, "ollie", "overview");
    let t = await tiles(p);
    const ollieIds = ["ev-seed15", "cq-25-2026-09-28-end", "gac-s84e1-def-ollie", "exec-2026-10-15-ollie", "ev-seed0", "rotta-2026-10-27", "dc-33"];
    L.ck("ollie: 7 tiles in due-date order (event, conquest, GAC defence, Executor, event, Rotta est, datacron)", JSON.stringify(t.map(x => x.id)) === JSON.stringify(ollieIds), t.map(x => x.id).join());
    L.ck("ollie: countdowns are local calendar days (2,4,6,8,13,20,22)", t.map(x => x.cd.replace(/\D/g, "")).join() === "2,4,6,8,13,20,22", t.map(x => x.cd).join("|"));
    L.ck("ollie: urgency colours — 2–6d warning, ≥7d good", t.map(x => x.urg).join() === "warning,warning,warning,good,good,good,good", t.map(x => x.urg).join());
    L.ck("ollie: Rotta tile is tagged est., datacron tile is tagged unverified; dated tiles are untagged", t[5].tag === "est." && t[6].tag === "unverified" && t.slice(0, 5).every(x => !x.tag), t.map(x => x.tag).join("|"));
    L.ck("ollie: Executor tile says 30 blueprints to 6★", t[3].title === "Discarded Doctrine" && /30 blueprints to 6★/.test(t[3].action), t[3].action);
    L.ck("ollie: GAC tile reads 'GAC S84 E1 · Set defence' to Tue 13 Oct", t[2].title === "GAC S84 E1" && /Set defence/.test(t[2].action) && /13 Oct/.test(t[2].action), t[2].action);
    L.ck("ollie: Conquest tile shows the app's 11 Oct end with a local-time note", /Conquest 25/.test(t[1].title) && /11 Oct/.test(t[1].action) && /local time/.test(t[1].action), t[1].action);
    L.ck("ollie: datacron tile counts the pulled Set 33 datacrons (3) and names 29 Oct", /29 Oct/.test(t[6].action) && /3 Set 33 datacrons/.test(t[6].action), t[6].action);
    L.ck("aria-label spells the countdown in words and the destination", /due in 2 days/.test(t[0].aria) && /Opens Events/.test(t[0].aria) && /due in 6 days/.test(t[2].aria) && /Opens GAC Planner/.test(t[2].aria), t[0].aria);
    L.ck("every tile is a ≥44px-tall button target", t.every(x => x.goH >= 44 && x.h >= 44), JSON.stringify(t.map(x => Math.round(x.goH))));
    const a11y = await p.evaluate(() => ({
      btn: [...document.querySelectorAll("#nxtStrip .nxt-go, #nxtStrip .nxt-x")].every(el => el.tagName === "BUTTON" && el.type === "button"),
      nested: !document.querySelector("#nxtStrip button button"), list: document.querySelector("#nxtStrip .nxt-strip").getAttribute("role") === "list",
      xLabels: [...document.querySelectorAll("#nxtStrip .nxt-x")].every(el => /^Hide: /.test(el.getAttribute("aria-label")))
    }));
    L.ck("tiles and ✕ are real <button type=button>s, not nested, strip is role=list, ✕ labelled", a11y.btn && a11y.nested && a11y.list && a11y.xLabels, JSON.stringify(a11y));
    const esc = await p.evaluate(() => { const s = nxtStripHtml("ollie", nxtNow()); return !/<script|onerror=/i.test(s) && /&amp;|·/.test(s); });
    L.ck("strip markup is escaped (no raw script/onerror in output)", esc, "");
    L.ck("no stale tile on 7 Oct (no reference past 2× its half-life)", !t.some(x => /^stale-/.test(x.id)), t.map(x => x.id).join());

    await L.go(p, "tiny", "overview");
    t = await tiles(p);
    const tinyIds = ["ev-seed15", "cq-25-2026-09-28-end", "gac-s84e1-def-tiny", "exec-2026-10-15-tiny", "ev-seed0", "dc-33"];
    L.ck("tiny: 6 tiles in order — no Rotta tile (SHIP_PLAN marks Rotta a skip for Tiny)", JSON.stringify(t.map(x => x.id)) === JSON.stringify(tinyIds), t.map(x => x.id).join());
    L.ck("tiny: Executor tile says Tiny reaches 5★ free (10 blueprints short, one free run)", /Tiny reaches 5★ free/.test(t[3].action), t[3].action);

    /* ---------- 2. tap navigation (deep links through jumpToView / switchTab) ---------- */
    await L.go(p, "ollie", "overview");
    const nav = async (id) => { await p.click(`#nxtStrip .nxt-tile[data-nxt="${id}"] .nxt-go`); await p.waitForTimeout(200);
      return p.evaluate(() => ({ tab: curTab, gac: state.views.gac, intel: state.views.intel, events: state.views.events })); };
    let r = await nav("gac-s84e1-def-ollie");
    L.ck("tap GAC tile → GAC Planner, Scout & plan view", r.tab === "gac" && r.gac === "plan", JSON.stringify(r));
    await L.go(p, "ollie", "overview"); r = await nav("dc-33");
    L.ck("tap datacron tile → Farm Intel · Datacrons", r.tab === "intel" && r.intel === "datacrons", JSON.stringify(r));
    await L.go(p, "ollie", "overview"); r = await nav("exec-2026-10-15-ollie");
    L.ck("tap Executor tile → Events · Executor sub-view", r.tab === "events" && r.events === "executor", JSON.stringify(r));
    await L.go(p, "ollie", "overview"); r = await nav("cq-25-2026-09-28-end");
    L.ck("tap Conquest tile → Conquest tab", r.tab === "conquest", JSON.stringify(r));
    await L.go(p, "ollie", "overview"); r = await nav("ev-seed0");
    L.ck("tap event tile → Events · Current & next", r.tab === "events" && r.events === "next", JSON.stringify(r));
    await L.go(p, "ollie", "overview"); r = await nav("rotta-2026-10-27");
    L.ck("tap Rotta tile → Farm plan (shipment guide)", r.tab === "farm", JSON.stringify(r));
    await L.go(p, "ollie", "overview");
    await p.focus('#nxtStrip .nxt-tile[data-nxt="gac-s84e1-def-ollie"] .nxt-go'); await p.keyboard.press("Enter"); await p.waitForTimeout(200);
    L.ck("keyboard: focus tile + Enter navigates", (await p.evaluate(() => curTab)) === "gac", "");
    await L.go(p, "ollie", "overview");
    const ring = await p.evaluate(() => { const el = document.querySelector("#nxtStrip .nxt-go"); el.focus(); return getComputedStyle(el).outlineStyle !== "none" || !!document.activeElement.matches(".nxt-go"); });
    L.ck("tile is keyboard-focusable", ring, "");

    /* ---------- 3. dismiss ✕ → state.views, Reset hidden, both persisting across reload ---------- */
    const lsBefore = await p.evaluate(() => Object.keys(localStorage).sort().join());
    await p.click('#nxtStrip .nxt-tile[data-nxt="cq-25-2026-09-28-end"] .nxt-x'); await p.waitForTimeout(150);
    let d = await p.evaluate(() => ({ ids: [...document.querySelectorAll("#nxtStrip .nxt-tile")].map(t => t.dataset.nxt), key: state.views["nxt-dismiss-cq-25-2026-09-28-end"],
      reset: (document.querySelector("#nxtStrip .nxt-reset") || {}).textContent || "",
      device: JSON.parse(localStorage.getItem("swgoh-holotable-device-v1") || "{}"), synced: JSON.parse(localStorage.getItem("swgoh-tracker") || "{}") }));
    L.ck("✕ hides the tile and stores state.views['nxt-dismiss-<id>'] (due day as string)", !d.ids.includes("cq-25-2026-09-28-end") && d.key === String(Date.UTC(2026, 9, 11)), JSON.stringify([d.ids, d.key]));
    L.ck("the key lands in the device-local views bucket, not in the synced swgoh-tracker blob", !!(d.device.views && d.device.views["nxt-dismiss-cq-25-2026-09-28-end"]) && !("views" in d.synced), JSON.stringify(Object.keys(d.device)));
    L.ck("'Reset hidden (1)' link appears", /Reset hidden \(1\)/.test(d.reset), d.reset);
    const lsAfter = await p.evaluate(() => Object.keys(localStorage).sort().join());
    L.ck("no new localStorage key was created by dismissing", lsBefore === lsAfter, lsAfter);
    await p.reload({ waitUntil: "domcontentloaded" }); await p.waitForTimeout(900); await L.go(p, "ollie", "overview");
    d = await p.evaluate(() => ({ ids: [...document.querySelectorAll("#nxtStrip .nxt-tile")].map(t => t.dataset.nxt), reset: (document.querySelector("#nxtStrip .nxt-reset") || {}).textContent || "" }));
    L.ck("dismissal survives a reload (device-local view state)", !d.ids.includes("cq-25-2026-09-28-end") && d.ids.length === 6 && /Reset hidden \(1\)/.test(d.reset), JSON.stringify(d));
    await p.click("#nxtStrip .nxt-reset"); await p.waitForTimeout(150);
    d = await p.evaluate(() => ({ ids: [...document.querySelectorAll("#nxtStrip .nxt-tile")].map(t => t.dataset.nxt), reset: !!document.querySelector("#nxtStrip .nxt-reset"), keys: Object.keys(state.views).filter(k => k.startsWith("nxt-dismiss-")) }));
    L.ck("Reset hidden restores the tile, removes the key and the link", d.ids.includes("cq-25-2026-09-28-end") && d.ids.length === 7 && !d.reset && d.keys.length === 0, JSON.stringify(d));
    await p.reload({ waitUntil: "domcontentloaded" }); await p.waitForTimeout(900); await L.go(p, "ollie", "overview");
    L.ck("reset survives a reload", (await tiles(p)).length === 7, "");
    /* a stale dismissal (due day already passed) is pruned on paint */
    const pruned = await p.evaluate(() => { state.views["nxt-dismiss-old-thing"] = String(Date.UTC(2026, 8, 1)); state.views["nxt-dismiss-dc-33"] = String(Date.UTC(2026, 9, 29)); nxtPaint("ollie");
      return { old: "nxt-dismiss-old-thing" in state.views, dc: "nxt-dismiss-dc-33" in state.views, n: document.querySelectorAll("#nxtStrip .nxt-tile").length }; });
    L.ck("a dismissal whose due day has passed is pruned; a live one is kept", !pruned.old && pruned.dc && pruned.n === 6, JSON.stringify(pruned));
    await p.evaluate(() => nxtReset());
    /* all tiles dismissed → just the one-line head with the reset link, no empty box */
    const allGone = await p.evaluate(() => { nxtItems("ollie", nxtNow()).forEach(it => { state.views["nxt-dismiss-" + it.id] = it.due === null ? "" : String(it.due); }); nxtPaint("ollie");
      const el = document.getElementById("nxtStrip"); return { tiles: el.querySelectorAll(".nxt-tile").length, strip: !!el.querySelector(".nxt-strip"), reset: (el.querySelector(".nxt-reset") || {}).textContent || "" }; });
    L.ck("everything dismissed → no tile row, only 'Reset hidden (7)'", allGone.tiles === 0 && !allGone.strip && /Reset hidden \(7\)/.test(allGone.reset), JSON.stringify(allGone));
    await p.evaluate(() => nxtReset());

    /* ---------- 4. GAC tick hides the 'set defence' tile; the next (est.) event takes its place ---------- */
    await p.evaluate(() => pbmGacMark("ollie", "s84e1", true)); await p.waitForTimeout(200);
    t = await tiles(p);
    const gacNext = t.find(x => /^gac-/.test(x.id));
    L.ck("after 'I've set them': defence tile gone, next event 'GAC S84 E2' shown as est. (starts Wed 14 Oct, 7d, good)",
      !t.some(x => x.id === "gac-s84e1-def-ollie") && gacNext && gacNext.id === "gac-s84e2-start" && gacNext.tag === "est." && gacNext.urg === "good" && /14 Oct/.test(gacNext.action), JSON.stringify(gacNext));
    await p.evaluate(() => pbmGacMark("ollie", "s84e1", false)); await p.waitForTimeout(200);
    L.ck("undo brings the defence tile back", (await tiles(p)).some(x => x.id === "gac-s84e1-def-ollie"), "");

    /* ---------- 5. empty strip renders nothing (not an empty box) ---------- */
    const empty = await p.evaluate(() => { const real = nxtItems; nxtItems = () => []; nxtPaint("ollie"); const el = document.getElementById("nxtStrip");
      const out = { html: el.innerHTML, display: getComputedStyle(el).display, h: el.getBoundingClientRect().height }; nxtItems = real; nxtPaint("ollie"); return out; });
    L.ck("no candidates → #nxtStrip is empty and display:none (0px tall)", empty.html === "" && empty.display === "none" && empty.h === 0, JSON.stringify(empty));
    L.ck("[1280] no page errors", errs.length === 0, JSON.stringify(errs.slice(0, 5)));
    await ctx.close();
  }

  /* ---------- 6. 390px: no horizontal overflow, strip scrolls inside itself ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { width: 390, height: 844, tag: "oct7n", pin: OCT7 });
    for (const acct of ["ollie", "tiny"]) {
      await L.go(p, acct, "overview");
      const o = await L.overflow(p);
      const s = await p.evaluate(() => { const el = document.querySelector("#nxtStrip .nxt-strip"); return { sw: el.scrollWidth, cw: el.clientWidth, more: el.classList.contains("nxt-more"), n: el.querySelectorAll(".nxt-tile").length, minW: Math.min(...[...el.querySelectorAll(".nxt-tile")].map(t => t.getBoundingClientRect().width)) }; });
      L.ck(`[390] ${acct}: no horizontal page overflow`, o.doc <= o.inner + 1, JSON.stringify(o));
      L.ck(`[390] ${acct}: strip scrolls internally (scrollWidth > clientWidth), fade cue on, tiles ≥150px`, s.sw > s.cw && s.more && s.n >= 4 && s.minW >= 150, JSON.stringify(s));
    }
    const scrolled = await p.evaluate(async () => { const el = document.querySelector("#nxtStrip .nxt-strip"); el.scrollLeft = el.scrollWidth; await new Promise(r => setTimeout(r, 150)); return el.classList.contains("nxt-more"); });
    L.ck("[390] fade cue switches off at the end of the strip", scrolled === false, "");
    const x = await p.evaluate(() => document.querySelector("#nxtStrip .nxt-x").getBoundingClientRect().height);
    L.ck("[390] ✕ target is at least 32px (40px on coarse pointers)", x >= 32, String(x));
    L.ck("[390] no page errors", errs.length === 0, JSON.stringify(errs.slice(0, 5)));
    await ctx.close();
  }

  /* ---------- 7. 30 Oct 2026 12:00: datacron Set 33 tile gone, Set 34 up, stale tile, all good/stale colours ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "oct30", pin: [2026, 9, 30, 12] });
    await L.go(p, "ollie", "overview");
    const t = await tiles(p);
    L.ck("30 Oct: Set 33 tile gone; Set 34 (26 Nov, 27d, good, unverified) shown", !t.some(x => x.id === "dc-33") && t.some(x => x.id === "dc-34" && x.urg === "good" && x.tag === "unverified" && /26 Nov/.test(x.action)), t.map(x => x.id + ":" + x.urg).join());
    L.ck("30 Oct: Rotta, GAC (schedule run out) and 7-Oct events are gone", !t.some(x => /^(rotta-|gac-|ev-)/.test(x.id)), t.map(x => x.id).join());
    L.ck("30 Oct: Conquest run 2 ends 8 Nov (9d, good) and Executor 15 Nov (16d, good)", t.some(x => x.id === "cq-25-2026-10-26-end" && x.urg === "good" && /8 Nov/.test(x.action)) && t.some(x => x.id === "exec-2026-11-15-ollie" && x.urg === "good"), JSON.stringify(t.map(x => [x.id, x.cd])));
    const stale = t.find(x => /^stale-/.test(x.id));
    L.ck("30 Oct: one 'Data is stale' tile, last, info-coloured, count matches dataHealthRows", stale && t[t.length - 1] === stale && stale.urg === "stale" && +stale.cd.replace(/\D/g, "") === (await p.evaluate(() => dataHealthRows(nxtNow()).filter(r => r.st.state === "stale").length)), JSON.stringify(stale));
    await p.click(`#nxtStrip .nxt-tile[data-nxt="${stale ? stale.id : "none"}"] .nxt-go`); await p.waitForTimeout(1400);   /* smooth scroll */
    const dh = await p.evaluate(() => ({ tab: curTab, card: !!document.querySelector('[data-card="datahealth"]'), top: (document.querySelector('[data-card="datahealth"]') || { getBoundingClientRect: () => ({ top: 9e9 }) }).getBoundingClientRect().top }));
    L.ck("tap stale tile → Overview's Data health card scrolled into view", dh.tab === "overview" && dh.card && dh.top < 200, JSON.stringify(dh));
    L.ck("[30 Oct] no page errors", errs.length === 0, JSON.stringify(errs.slice(0, 5)));
    await ctx.close();
  }

  /* ---------- 8. 11 Oct 2026 (conquest's last day) and 10 Oct: critical colour, 'Today' / 1 day ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "oct11", pin: [2026, 9, 11, 9] });
    await L.go(p, "ollie", "overview");
    let t = await tiles(p);
    const cq = t.find(x => /^cq-/.test(x.id));
    L.ck("11 Oct: Conquest tile reads 'Today', critical, first in the strip; aria says 'due today'", cq && t[0] === cq && cq.cd === "Today" && cq.urg === "critical" && /due today/.test(cq.aria), JSON.stringify(cq));
    L.ck("11 Oct: Imperial Fleet (9 Oct, no end date) has vanished", !t.some(x => x.id === "ev-seed15"), t.map(x => x.id).join());
    await ctx.close();
    const o2 = await openAt(b, { tag: "oct10", pin: [2026, 9, 10, 23] });
    await L.go(o2.p, "ollie", "overview");
    t = await tiles(o2.p);
    const cq2 = t.find(x => /^cq-/.test(x.id));
    L.ck("10 Oct 23:00 local: Conquest tile is '1 day', critical (local calendar day, not 24h maths)", cq2 && /^1\s*day$/.test(cq2.cd) && cq2.urg === "critical" && /due tomorrow/.test(cq2.aria), JSON.stringify(cq2));
    L.ck("[11/10 Oct] no page errors", errs.length === 0 && o2.errs.length === 0, JSON.stringify(errs.concat(o2.errs).slice(0, 5)));
    await o2.ctx.close();
  }
  await L.finish(b, srv);
})().catch(e => { console.error(e); process.exit(2); });
