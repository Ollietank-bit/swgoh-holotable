/* "Next up" strip (nxt) — Overview, above the Today card. Boots the real saved state + the newest roster
   snapshot in an Australia/Sydney context with Date.now() pinned (same Date.now override as pbm-check's
   openX; the app reads the clock through nxtNow() → Date.now()). Covers: tile set + order for both
   accounts at 7 Oct 2026 12:00 local, urgency colours, est./unverified tags, tap + keyboard navigation,
   dismiss / reset persisting across reload, GAC tick hiding the defence tile, the empty strip rendering
   nothing, 390px without horizontal overflow, zero page errors, and the 30 Oct / 11 Oct clocks.
   rf22 22 Oct 2026 — DELIBERATE change (fixture, no assertion edited): every clock in this suite is 7–30 Oct and its tile expectations
   were written against the 12 Oct calendar seed (v8). The app's seed is now v9 (re-seeded 22 Oct; nothing in it is dated before 20 Oct),
   so this suite now boots a saved state that already carries the CURRENT seed version with the 12 Oct rows as its seed rows (ids
   seed0..seed19, copied verbatim from the v8 build). applyBootMaintenance therefore leaves them alone, and the strip logic is tested
   against the same calendar as before. The version is read from index.html, so a future seed bump re-seeds (and this note applies again).
   rv25b 25 Oct 2026 — DELIBERATE, 2 assertions changed (old -> new, why): the datacron tiles (Set 33 on 7 Oct, Set 34 on 30 Oct) were tagged "unverified" (the expiry dates
   came from a 1 Oct reply); swgoh.gg/datacrons/ + /schedule/ were read live on 25 Oct with the expiry clock times, so the tile is now UNTAGGED and its action carries the AEDT
   time. Old tag "unverified" -> new tag "" (both assertions), and the action checks now also require "29 Oct 18:00 AEDT" / "26 Nov 19:00 AEDT". */
const L = require("./lib.js");
const SEED_12OCT = [{"id":"seed0","name":"Ultimate Journey Event","cat":"Journey","date":"2026-10-12","ends":"2026-10-12","note":"Earn rewards playing your powerful Galactic Legends — live at capture, ends 13 Oct 05:00 AEDT (start date not shown by swgoh.gg)."},{"id":"seed1","name":"Terrible Tings","cat":"Legendary","date":"2026-10-01","ends":"2026-10-20","note":"Earn Darth Jar Jar Shards! — live; ends 21 Oct 05:00 AEDT (last live day 20 Oct)."},{"id":"seed2","name":"The Wanderer's Blade","cat":"Marquee","date":"2026-10-06","ends":"2026-10-13","note":"Earn Rewards Daily! — live; ends 14 Oct 05:00 AEDT (last live day 13 Oct)."},{"id":"seed3","name":"Bonus Proving Grounds","cat":"Other","date":"2026-10-12","ends":"2026-10-12","note":"Conquest unit shards — live at capture, ends 13 Oct 05:00 AEDT, when the regular Proving Grounds starts (start date not shown by swgoh.gg)."},{"id":"seed4","name":"Coruscant","cat":"Omega Battle","date":"2026-10-12","ends":"2026-10-13","note":"Now with Zetas! — live at capture, ends 13 Oct 18:00 AEDT (start date not shown by swgoh.gg)."},{"id":"seed5","name":"Smuggler's Run","cat":"Resource Event","date":"2026-10-12","note":"Starts 12 Oct 21:00 AEDT."},{"id":"seed6","name":"Proving Grounds","cat":"Other","date":"2026-10-13","ends":"2026-10-13","note":"Conquest unit shards — start CONFIRMED on swgoh.gg/events/ (13 Oct 05:00 AEDT). The end is not shown there; 13 Oct is swgoh.wiki's 24-hour length, unconfirmed."},{"id":"seed7","name":"Defense of Dathomir","cat":"Special","date":"2026-10-13","note":"Mother Talzin shards — starts 13 Oct 18:00 AEDT."},{"id":"seed8","name":"The Ronin","cat":"Era Challenge","date":"2026-10-14","note":"Earn Era Currency! — starts 14 Oct 05:00 AEDT."},{"id":"seed9","name":"Secrets and Shadows","cat":"Assault Battle","date":"2026-10-14","note":"Dark Side followers — starts 14 Oct 18:00 AEDT."},{"id":"seed10","name":"Shattered Empire","cat":"Era Battle","date":"2026-10-15","note":"Starts 15 Oct 05:00 AEDT."},{"id":"seed11","name":"Hoth","cat":"Omega Battle","date":"2026-10-16","note":"Now with Zetas! — starts 16 Oct 18:00 AEDT."},{"id":"seed12","name":"Daring Droid","cat":"Mythic","date":"2026-10-17","note":"Starts 17 Oct 18:00 AEDT."},{"id":"seed13","name":"Military Might","cat":"Assault Battle","date":"2026-10-17","note":"Empire — starts 17 Oct 18:00 AEDT."},{"id":"seed14","name":"Dathomir","cat":"Omega Battle","date":"2026-10-19","note":"Now with Zetas! — starts 19 Oct 18:00 AEDT."},{"id":"seed15","name":"Dark Sovereign","cat":"Fleet Mastery","date":"2026-10-20","note":"Leviathan UNLOCK journey (Journey Guide · Fleet Mastery) — starts ~20 Oct 18:00 AEDT (in-game countdown on 15 Oct: 4d 18h; swgoh.gg's event list agrees). In-game screen (Ollie, 15 Oct): 16 prerequisites, 80 blueprints in 4 reward tiers (10/10/20/40), Leviathan at 0/80. Progress for both accounts: Arena tab › Fleet Arena › Capital ship journeys. CONFLICT: swgoh.gg's page for this event, read 12 Oct, described a bonus star-up event needing Leviathan owned at 4★; the in-game screen contradicts that, so it is treated as the unlock journey. Still unknown: how long the event stays open, how often it returns, and whether a separate bonus event also exists."},{"id":"seed16","name":"Conquest 25 (Embo & Keibu) — run 1","cat":"Other","date":"2026-09-28","ends":"2026-10-11","note":"swgoh.gg/conquest/ (read 12 Oct) lists Conquest 25 as 28 Sep – 12 Oct; 12 Oct is the day it closes (at the reset), so the last live day is 11 Oct and the run is over from 12 Oct. Runs 2–3 follow the 14-on / 14-off cadence — inferred, unconfirmed; no Conquest 26 is listed."},{"id":"seed17","name":"Datacron Set 33 expires","cat":"Other","date":"2026-10-29","ends":"2026-10-29","note":"Supremacy Directive (First Order · Resistance) — swgoh.gg/datacrons/, 7 Oct. Level Set 33 datacrons before it expires."},{"id":"seed18","name":"Datacron Set 34 expires","cat":"Other","date":"2026-11-26","ends":"2026-11-26","note":"The Art of Command (Empire · Jedi Vanguard) — swgoh.gg/datacrons/, 7 Oct."},{"id":"seed19","name":"Datacron Set 35 expires","cat":"Other","date":"2026-12-24","ends":"2026-12-24","note":"Duty and Defiance (Clone Trooper · Unaligned Force User) — swgoh.gg/datacrons/, 7 Oct."}];
const SEED_VER = +(L.fs.readFileSync(L.FILE, "utf8").match(/const EVENTS_SEED_VERSION = (\d+);/) || [0, 0])[1];
const STATE_12OCT = (() => { const st = JSON.parse(L.REAL); st.eventsSeedVersion = SEED_VER; st.eventsSeeded = true; st.events = st.events || {}; st.events.items = SEED_12OCT.concat(((st.events.items) || []).filter(e => !/^seed\d+$/.test(e && e.id))); return JSON.stringify(st); })();
async function openAt(b, o) {
  o = o || {};
  const ctx = await b.newContext({ viewport: { width: o.width || 1280, height: o.height || 1000 }, timezoneId: "Australia/Sydney", locale: "en-AU" });
  await ctx.addInitScript(([s, pl, seedKey, pin]) => {
    if (pin) { const real = Date.now.bind(Date), t0 = new Date(pin[0], pin[1], pin[2], pin[3], 0, 0).getTime(), s0 = real(); Date.now = () => t0 + (real() - s0); }
    try { if (!sessionStorage.getItem(seedKey)) { localStorage.clear(); localStorage.setItem("swgoh-tracker", s); localStorage.setItem("swgoh-holotable-pulls-v1", pl); sessionStorage.setItem(seedKey, "1"); } } catch (e) {}
  }, [o.state || STATE_12OCT, L.PULLS, "seeded-" + (o.tag || "x"), o.pin || null]);
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
    /* upd 12 Oct: EVENTS_SEED was re-read (version 7), so the 7 Oct clock now meets the new rows: seed0 Ultimate Journey (Journey, 12 Oct) and seed4 Coruscant (Omega Battle, 12 Oct) instead of the old Imperial Fleet / Jakku rows. */
    const ollieIds = ["cq-25-2026-09-28-end", "ev-seed0", "ev-seed4", "gac-s84e1-def-ollie", "exec-2026-10-15-ollie", "dc-33", "rotta-2026-11-03"];
    L.ck("ollie: 7 tiles in due-date order (conquest, 2 events, GAC defence, Executor, datacron, Rotta — rv31: Rotta is now SCHEDULED for 3 Nov, so it sorts after the 29 Oct datacron, was ~27 Oct est. before it)", JSON.stringify(t.map(x => x.id)) === JSON.stringify(ollieIds), t.map(x => x.id).join());
    L.ck("ollie: countdowns are local calendar days (4,5,5,6,8,22,27)", t.map(x => x.cd.replace(/\D/g, "")).join() === "4,5,5,6,8,22,27", t.map(x => x.cd).join("|"));
    L.ck("ollie: urgency colours — 2–6d warning, ≥7d good", t.map(x => x.urg).join() === "warning,warning,warning,warning,good,good,good", t.map(x => x.urg).join());
    L.ck("ollie: the datacron tile is untagged since rv25b (expiry read live on 25 Oct) and carries its AEDT time; rv31: the Rotta tile is now UNTAGGED too (Champion of the Pit is SCHEDULED 3 Nov 06:00 AEDT on swgoh.gg/schedule/, was tagged est.) and says so; dated tiles are untagged", t[5].tag === "" && /29 Oct 18:00 AEDT/.test(t[5].action) && t[6].tag === "" && /3 Nov 06:00 AEDT/.test(t[6].action) && t.slice(0, 5).every(x => !x.tag), t.map(x => x.tag).join("|"));
    L.ck("ollie: Executor tile says 30 blueprints to 6★", t[4].title === "Discarded Doctrine" && /30 blueprints to 6★/.test(t[4].action), t[4].action);
    L.ck("ollie: GAC tile reads 'GAC S84 E1 · Set defence' to Tue 13 Oct", t[3].title === "GAC S84 E1" && /Set defence/.test(t[3].action) && /13 Oct/.test(t[3].action), t[3].action);
    L.ck("ollie: Conquest tile shows the app's 11 Oct end with a local-time note", /Conquest 25/.test(t[0].title) && /11 Oct/.test(t[0].action) && /local time/.test(t[0].action), t[0].action);
    L.ck("ollie: datacron tile counts the pulled Set 33 datacrons (3) and names 29 Oct", /29 Oct/.test(t[5].action) && /3 Set 33 datacrons/.test(t[5].action), t[5].action);
    L.ck("aria-label spells the countdown in words and the destination", /due in 4 days/.test(t[0].aria) && /Opens Conquest/.test(t[0].aria) && /due in 5 days/.test(t[1].aria) && /Opens Events/.test(t[1].aria) && /due in 6 days/.test(t[3].aria) && /Opens GAC Planner/.test(t[3].aria), t[0].aria);
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
    const tinyIds = ["cq-25-2026-09-28-end", "ev-seed0", "ev-seed4", "gac-s84e1-def-tiny", "exec-2026-10-15-tiny", "dc-33"];
    L.ck("tiny: 6 tiles in order — no Rotta tile (SHIP_PLAN marks Rotta a skip for Tiny)", JSON.stringify(t.map(x => x.id)) === JSON.stringify(tinyIds), t.map(x => x.id).join());
    L.ck("tiny: Executor tile says Tiny reaches 5★ free (10 blueprints short, one free run)", /Tiny reaches 5★ free/.test(t[4].action), t[4].action);

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
    await L.go(p, "ollie", "overview"); r = await nav("rotta-2026-11-03");
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
    L.ck("after 'I've set them': defence tile gone, next event 'GAC S84 E2' shown WITHOUT an est. tag — verified 12 Oct (starts Wed 14 Oct, 7d, good)",
      !t.some(x => x.id === "gac-s84e1-def-ollie") && gacNext && gacNext.id === "gac-s84e2-start" && gacNext.tag === "" && gacNext.urg === "good" && /14 Oct/.test(gacNext.action), JSON.stringify(gacNext));
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
    L.ck("30 Oct: Set 33 tile gone; Set 34 (26 Nov 19:00 AEDT, 27d, good, untagged since rv25b) shown", !t.some(x => x.id === "dc-33") && t.some(x => x.id === "dc-34" && x.urg === "good" && x.tag === "" && /26 Nov 19:00 AEDT/.test(x.action)), t.map(x => x.id + ":" + x.urg).join());
    L.ck("30 Oct: the 7-Oct events are gone; the Rotta tile is up (rv31: SCHEDULED 3 Nov, 5d, untagged — it was gone here when Rotta was an est. ~27 Oct); GAC shows Season 85 Event 1 (4 Nov) instead of running out, untagged since rv31 (the S85 start is sourced from swgoh.gg/schedule/)", !t.some(x => /^ev-/.test(x.id)) && t.some(x => x.id === "rotta-2026-11-03" && x.tag === "" && x.urg === "warning") && t.some(x => x.id === "gac-s85e1-start" && x.tag === "" && /4 Nov/.test(x.action)), t.map(x => x.id).join());
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
    L.ck("11 Oct: Imperial Fleet (old 9 Oct row, no end date, gone from the 12 Oct seed) has vanished", !t.some(x => x.title === "Imperial Fleet"), t.map(x => x.id).join());
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
