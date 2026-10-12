/* Layout editing (lay) — unhide on the card, friendly hidden pills + Show all, Align cards (+ Undo align),
   ▲ ▼ reordering for touch, and the old machinery around it (drag, resize, density, Show:, Reset layout).
   Boots the real saved state + the pinned roster snapshot. Panes covered: Overview, Roster Gaps, GL Roadmap,
   Coach (two grids), Farm plan — for both accounts where it matters. A build without the lay feature (the
   pristine base) only gets the generic checks: no horizontal overflow in edit mode and zero page errors. */
const L = require("./lib.js");
const TABS = ["overview", "gaps", "leia", "coach", "farm"];
const PANE_OF = { overview: "overview", gaps: "gaps", leia: "leia", coach: "coach", farm: "farm" };
const edit = async (p, on) => { await p.evaluate(want => { if (editMode !== want) toggleEdit(); }, on); await p.waitForTimeout(120); };
/* DOM snapshot of one pane's grid: visible cards (order, span, rect), hidden placeholders. */
const grid = (p, pane) => p.evaluate(pn => {
  const cont = document.querySelector(`.tabpane.active .sortable[data-pane="${pn}"]`);
  if (!cont) return null;
  const cr = cont.getBoundingClientRect();
  const vis = [...cont.children].filter(el => el.matches(".card[data-card]:not(.lay-hidcard)")).map(el => {
    const r = el.getBoundingClientRect();
    return { id: el.dataset.card, span: +((el.style.gridColumn.match(/span\s+(\d+)/) || [])[1] || 0), x: r.left, y: r.top, w: r.width, h: r.height, r: r.right, b: r.bottom };
  });
  const hid = [...cont.querySelectorAll(":scope > .lay-hidcard")].map(el => ({ id: el.dataset.card,
    name: (el.querySelector(".lay-hidname") || {}).textContent || "", btn: (el.querySelector(".lay-toggle") || {}).textContent || "",
    pressed: (el.querySelector(".lay-toggle") || { getAttribute: () => null }).getAttribute("aria-pressed"),
    op: +getComputedStyle(el.querySelector(".lay-hidbody")).opacity }));
  return { left: cr.left, right: cr.right, vis, hid };
}, pane);
const pills = p => p.evaluate(() => [...document.querySelectorAll("#hiddenPills .lay-pill")].map(b => ({ pane: b.dataset.layPane, id: b.dataset.layId, text: b.textContent.trim() })));
/* Masonry check, in the page: per grid column, cards stack from the container top with exactly one gap
   (+ < LAY_UNIT px rounding) between them; no overlap; no column left empty; and no card has blank space
   below its content (a user-set min-height excepted). */
const packCheck = (p, pane) => p.evaluate(pn => {
  const cont = document.querySelector(`.tabpane.active .sortable[data-pane="${pn}"]`);
  if (!cont || !cont.getClientRects().length) return null;
  const gap = parseFloat(getComputedStyle(cont).columnGap) || 0, cr = cont.getBoundingClientRect();
  const colW = (cr.width - 11 * gap) / 12;
  const px = (el, k) => parseFloat(getComputedStyle(el)[k]) || 0;
  const items = [...cont.children].filter(el => el.getClientRects().length).map(el => {
    const r = el.getBoundingClientRect();
    const c0 = Math.round((r.left - cr.left) / (colW + gap)), c1 = Math.round((r.right - cr.left + gap) / (colW + gap));
    let cb = r.top + px(el, "borderTopWidth") + px(el, "paddingTop");
    [...el.children].forEach(ch => { const s = getComputedStyle(ch); if (s.position === "absolute" || s.position === "fixed" || !ch.getClientRects().length) return; cb = Math.max(cb, ch.getBoundingClientRect().bottom + (parseFloat(s.marginBottom) || 0)); });
    return { id: el.dataset.card || el.className.slice(0, 20), top: r.top, bottom: r.bottom, c0, c1, blank: r.bottom - px(el, "paddingBottom") - px(el, "borderBottomWidth") - cb, minH: el.style.minHeight };
  });
  const holes = []; let emptyCols = 0;
  for (let c = 0; c < 12; c++) {
    const col = items.filter(it => it.c0 <= c && it.c1 > c).sort((a, b) => a.top - b.top);
    if (!col.length) { emptyCols++; continue; }
    if (col[0].top - cr.top > 1.5) holes.push({ c, top: col[0].id, d: Math.round(col[0].top - cr.top) });
    for (let i = 1; i < col.length; i++) { const d = col[i].top - col[i - 1].bottom; if (d > gap + 2.5 || d < gap - 0.5) holes.push({ c, above: col[i - 1].id, below: col[i].id, d: Math.round(d * 10) / 10 }); }
  }
  const seen = new Set(), uniq = holes.filter(h => { const k = (h.above || "") + ">" + (h.below || h.top); if (seen.has(k)) return false; seen.add(k); return true; });
  return { gap, n: items.length, emptyCols, holes: uniq, blank: items.filter(it => it.blank > 3 && !it.minH).map(it => [it.id, Math.round(it.blank)]) };
}, pane);
(async () => {
  const srv = await L.serve(); const b = await L.chromium.launch({ headless: true });

  /* ---------- probe: does this build have the lay feature? ---------- */
  {
    const { ctx, p, errs } = await L.open(b, { tag: "probe" });
    const has = await p.evaluate(() => typeof layAlign === "function" && typeof layMove === "function");
    if (!has) {
      for (const w of [1280, 390]) {
        await p.setViewportSize({ width: w, height: 900 }); await edit(p, true);
        for (const t of TABS) { await L.go(p, "ollie", t); const o = await L.overflow(p); L.ck(`[base, ${w}] ${t} in edit mode: no horizontal overflow`, o.doc <= o.inner + 1, JSON.stringify(o)); }
        await edit(p, false);
      }
      L.ck("[base] no page errors", errs.length === 0, JSON.stringify(errs.slice(0, 5)));
      L.ck("this build has no lay feature — feature checks skipped", true, "");
      await ctx.close(); await L.finish(b, srv); return;
    }
    await ctx.close();
  }

  /* ---------- 1. hide → dims + ⊕ show on the card; show restores position/size; pills; both accounts ---------- */
  {
    const { ctx, p, errs } = await L.open(b, { tag: "hide" });
    for (const acct of ["ollie", "tiny"]) {
      for (const tab of TABS) {
        await L.go(p, acct, tab); await edit(p, true);
        const pane = PANE_OF[tab];
        const g0 = await grid(p, pane);
        if (!g0 || g0.vis.length < 2) { L.ck(`${acct}/${tab}: grid has cards`, false, JSON.stringify(g0)); continue; }
        const target = g0.vis[1];   // second card: has a neighbour on both sides of its slot in most panes
        const idx0 = g0.vis.findIndex(c => c.id === target.id);
        await p.click(`.tabpane.active .sortable[data-pane="${pane}"] > .card[data-card="${target.id}"] .lay-toggle`);
        await p.waitForTimeout(150);
        const g1 = await grid(p, pane), h = g1.hid.find(x => x.id === target.id);
        const st = await p.evaluate(([pn, id]) => ({ hidden: state.layout.hidden[pn] || [], focus: document.activeElement && document.activeElement.closest(".card") && document.activeElement.closest(".card").dataset.card,
          focusText: document.activeElement && document.activeElement.textContent }), [pane, target.id]);
        L.ck(`${acct}/${tab}: ✕ hide → card leaves the rows and shows as a dimmed "Hidden" strip with ⊕ show`,
          !g1.vis.some(c => c.id === target.id) && h && h.op < 1 && /⊕ show/.test(h.btn) && h.pressed === "true" && st.hidden.includes(target.id), JSON.stringify({ h, hidden: st.hidden }));
        L.ck(`${acct}/${tab}: focus follows to the card's ⊕ show`, st.focus === target.id && /show/.test(st.focusText || ""), JSON.stringify(st));
        const pl = await pills(p), pill = pl.find(x => x.id === target.id);
        L.ck(`${acct}/${tab}: hidden pill shows the card's title (${h && h.name}), not the raw id`,
          pill && h && h.name && pill.text.includes(h.name) && (h.name.toLowerCase() !== target.id.toLowerCase() || /^[A-Z]/.test(h.name)), JSON.stringify({ pill, name: h && h.name, id: target.id }));
        /* idempotent: a second hide changes nothing */
        await p.evaluate(([pn, id]) => hideCard(new Event("click"), pn, id), [pane, target.id]);
        const dup = await p.evaluate(([pn, id]) => (state.layout.hidden[pn] || []).filter(x => x === id).length, [pane, target.id]);
        L.ck(`${acct}/${tab}: hide is idempotent (id listed once)`, dup === 1, String(dup));
        /* show from the card itself */
        await p.click(`.tabpane.active .sortable[data-pane="${pane}"] > .lay-hidcard[data-card="${target.id}"] .lay-toggle`);
        await p.waitForTimeout(150);
        const g2 = await grid(p, pane), back = g2.vis.find(c => c.id === target.id);
        L.ck(`${acct}/${tab}: ⊕ show restores the card to its old slot and width`,
          back && g2.vis.findIndex(c => c.id === target.id) === idx0 && back.span === target.span && !g2.hid.some(x => x.id === target.id) && Math.abs(back.w - target.w) < 2,
          JSON.stringify({ idx0, idx: g2.vis.findIndex(c => c.id === target.id), was: target.span, now: back && back.span }));
        const lbl = await p.evaluate(([pn, id]) => { const el = document.querySelector(`.tabpane.active .sortable[data-pane="${pn}"] > .card[data-card="${id}"] .lay-toggle`); return el && [el.textContent.trim(), el.getAttribute("aria-pressed")]; }, [pane, target.id]);
        L.ck(`${acct}/${tab}: the toggle reads ✕ hide again`, lbl && lbl[0] === "✕ hide" && lbl[1] === "false", JSON.stringify(lbl));
        await p.evaluate(([pn, id]) => { showCard(pn, id); showCard(pn, id); }, [pane, target.id]);
        L.ck(`${acct}/${tab}: show is idempotent`, await p.evaluate(pn => (state.layout.hidden[pn] || []).length === 0, pane), "");
        await edit(p, false);
      }
    }
    /* pane isolation: hidden on Overview stays on Overview; the other tab lists it only as a count */
    await L.go(p, "ollie", "overview"); await edit(p, true);
    await p.click('.tabpane.active [data-card="flags"] .lay-toggle'); await p.waitForTimeout(120);
    await L.go(p, "ollie", "leia");
    const iso = await p.evaluate(() => ({ leia: state.layout.hidden.leia || [], pills: document.getElementById("hiddenPills").textContent, cards: document.querySelectorAll("#glTables .lay-hidcard").length }));
    L.ck("hiding on Overview does not leak into another tab (GL Roadmap: no hidden cards, no Overview pill, a count instead)",
      iso.leia.length === 0 && iso.cards === 0 && !/Top flags/.test(iso.pills) && /1 card hidden elsewhere/.test(iso.pills), JSON.stringify(iso));
    await L.go(p, "tiny", "overview");
    const tinyHid = await grid(p, "overview");
    L.ck("layout is per tab and shared by both accounts (as before): Tiny's Overview shows the same hidden Top flags strip",
      tinyHid.hid.some(x => x.id === "flags" && x.name === "Top flags") && !tinyHid.vis.some(c => c.id === "flags"), JSON.stringify(tinyHid.hid));
    await edit(p, false);
    const off = await p.evaluate(() => ({ flags: !!document.querySelector('#ovGrid [data-card="flags"]'), tools: document.querySelectorAll("#ovGrid .lay-tools").length, hidcards: document.querySelectorAll(".lay-hidcard").length }));
    L.ck("locked layout: hidden card absent, no edit toolbars or Hidden strips rendered", !off.flags && off.tools === 0 && off.hidcards === 0, JSON.stringify(off));
    /* Show all hidden */
    await edit(p, true);
    await p.click('.tabpane.active [data-card="daily"] .lay-toggle'); await p.waitForTimeout(120);
    const sa = await p.evaluate(() => (document.querySelector("#hiddenPills .lay-showall") || {}).textContent);
    L.ck("two hidden on this tab → 'Show all hidden (2)'", sa === "Show all hidden (2)", sa);
    await p.click("#hiddenPills .lay-showall"); await p.waitForTimeout(120);
    const after = await p.evaluate(() => ({ hid: state.layout.hidden.overview || [], cards: document.querySelectorAll("#ovGrid .lay-hidcard").length, pills: document.querySelectorAll("#hiddenPills .lay-pill").length, status: document.getElementById("layStatus").textContent }));
    L.ck("Show all brings both back (state, strips and pills cleared, status says so)", after.hid.length === 0 && after.cards === 0 && after.pills === 0 && /Showing 2 cards/.test(after.status), JSON.stringify(after));
    /* a pill click shows the card */
    await p.click('.tabpane.active [data-card="eventflags"] .lay-toggle'); await p.waitForTimeout(120);
    await p.click('#hiddenPills .lay-pill[data-lay-id="eventflags"]'); await p.waitForTimeout(120);
    L.ck("a hidden pill (⊕ Event reminders) shows its card", await p.evaluate(() => !!document.querySelector('#ovGrid > .card[data-card="eventflags"]:not(.lay-hidcard)') && !(state.layout.hidden.overview || []).length), "");
    /* escaping */
    const esc = await p.evaluate(() => layHiddenCardHtml("overview", { id: "x'y", html: '<div class="cardtitle">&lt;img src=x onerror=alert(1)&gt; Boom</div>' }));
    L.ck("titles and ids are escaped in the Hidden strip markup", !/<img/.test(esc) && /&lt;img/.test(esc) && /x\\&#39;y|x\\'y/.test(esc), esc.slice(0, 300));
    L.ck("[hide/show] no page errors", errs.length === 0, JSON.stringify(errs.slice(0, 5)));
    await ctx.close();
  }

  /* ---------- 2. Align cards: clean column widths + gap-free masonry pack; Undo align ---------- */
  {
    const { ctx, p, errs } = await L.open(b, { tag: "align" });
    for (const acct of ["ollie", "tiny"]) {
      for (const tab of ["overview", "gaps", "leia", "farm"]) {
        await L.go(p, acct, tab); await edit(p, true);
        const pane = PANE_OF[tab];
        /* make it ragged first: a custom height and an odd width on the second card */
        await p.evaluate(([pn]) => { const second = document.querySelectorAll(`.tabpane.active .sortable[data-pane="${pn}"] > .card[data-card]`)[1].dataset.card;
          state.layout.size[pn] = Object.assign({}, state.layout.size[pn], { [second]: { w: 5, h: 333 } }); store.write(state); render(); }, [pane]);
        const before = await p.evaluate(pn => JSON.stringify(state.layout.size[pn] || null), pane);
        await p.click("#layTools .lay-align"); await p.waitForTimeout(250);
        const g = await grid(p, pane);
        let lead = 0; while (lead < g.vis.length && g.vis[lead].span === 12) lead++;
        const rest = g.vis.slice(lead).map(c => c.span);
        L.ck(`${acct}/${tab}: Align gives a leading run of full-width cards, then ONE clean column width (${rest[0] || "-"})`,
          rest.every(w => w === rest[0]) && (!rest.length || [12, 6, 4].includes(rest[0])), JSON.stringify(g.vis.map(c => c.id + ":" + c.span)));
        await edit(p, false); await p.waitForTimeout(150);
        const pk = await packCheck(p, pane);
        L.ck(`${acct}/${tab}: after Align the pane is packed with no vertical gap above any card (> gap + ${2}px) and no overlap`, pk && pk.holes.length === 0 && pk.emptyCols === 0, JSON.stringify(pk));
        L.ck(`${acct}/${tab}: no card has blank space inside it (height = content)`, pk && pk.blank.length === 0, JSON.stringify(pk && pk.blank));
        await edit(p, true);
        const hs = await p.evaluate(pn => [...document.querySelectorAll(`.tabpane.active .sortable[data-pane="${pn}"] > .card[data-card]:not(.lay-hidcard)`)].filter(el => { const s = (state.layout.size[pn] || {})[el.dataset.card]; return s && s.h; }).length, pane);
        L.ck(`${acct}/${tab}: Align clears custom heights for the visible cards`, hs === 0, String(hs));
        const clip = await p.evaluate(pn => [...document.querySelectorAll(`.tabpane.active .sortable[data-pane="${pn}"] > .card[data-card]`)].filter(el => el.scrollHeight > el.clientHeight + 2 && getComputedStyle(el).overflow !== "visible").map(el => el.dataset.card), pane);
        L.ck(`${acct}/${tab}: no card content clipped after Align`, clip.length === 0, JSON.stringify(clip));
        const undo = await p.evaluate(() => (document.querySelector("#layTools .lay-undo") || {}).textContent);
        L.ck(`${acct}/${tab}: 'Undo align' is offered`, undo === "↶ Undo align", String(undo));
        await p.click("#layTools .lay-undo"); await p.waitForTimeout(150);
        const restored = await p.evaluate(pn => ({ size: JSON.stringify(state.layout.size[pn] || null), undo: !!document.querySelector("#layTools .lay-undo") }), pane);
        L.ck(`${acct}/${tab}: Undo align restores the previous widths/heights and retires itself`, restored.size === before && !restored.undo, JSON.stringify({ before, after: restored.size }));
        await p.evaluate(pn => { delete state.layout.size[pn]; store.write(state); render(); }, pane);
        await edit(p, false);
      }
    }
    /* Undo is withdrawn by the next layout change */
    await L.go(p, "ollie", "overview"); await edit(p, true);
    await p.click("#layTools .lay-align"); await p.waitForTimeout(150);
    await p.click('.tabpane.active #ovGrid > .card[data-card]:nth-child(2) .lay-mv[data-lay-dir="1"]'); await p.waitForTimeout(150);
    L.ck("a move after Align withdraws 'Undo align'", await p.evaluate(() => !document.querySelector("#layTools .lay-undo")), "");
    const viewsOnly = await p.evaluate(() => { const blob = JSON.parse(localStorage.getItem("swgoh-tracker") || "{}"); return { inBlob: !!(blob.views && blob.views["lay-undo"]), layoutKeys: Object.keys(state.layout).sort().join() }; });
    L.ck("undo record is device-local (not in the synced blob) and layout gained no new fields", !viewsOnly.inBlob && viewsOnly.layoutKeys === "density,hidden,order,show,sidebarCollapsed,size", JSON.stringify(viewsOnly));
    /* Coach: both grids (the weekly one only shows on its view) */
    await L.go(p, "ollie", "coach");
    for (const [view, pane] of [["priorities", "coach"], ["weekly", "modes"]]) {
      await p.evaluate(v => sectionView("coach", v), view); await p.waitForTimeout(150);
      await p.click("#layTools .lay-align"); await p.waitForTimeout(200);
      await edit(p, false); await p.waitForTimeout(100);
      const pk = await packCheck(p, pane);
      L.ck(`coach tab (${view} view): '${pane}' grid aligned and packed with no holes or blank space`, pk && pk.n > 1 && pk.holes.length === 0 && pk.blank.length === 0 && pk.emptyCols === 0, JSON.stringify(pk));
      await edit(p, true);
    }
    await edit(p, false);
    /* screenshots of the aligned look */
    await L.go(p, "ollie", "overview");
    await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await p.screenshot({ path: L.path.join(L.ROOT, "shots", "lay-check-aligned-1280.png") });
    L.ck("[align] no page errors", errs.length === 0, JSON.stringify(errs.slice(0, 5)));
    await ctx.close();
  }

  /* ---------- 3. ▲ ▼ reorder: focus kept, persists after reload; hidden slots kept ---------- */
  {
    const { ctx, p, errs } = await L.open(b, { tag: "move" });
    await L.go(p, "ollie", "overview"); await edit(p, true);
    const ids0 = (await grid(p, "overview")).vis.map(c => c.id);
    const firstUp = await p.evaluate(() => document.querySelector("#ovGrid > .card[data-card] .lay-mv[data-lay-dir='-1']").disabled);
    L.ck("first card's ▲ is disabled, last card's ▼ is disabled", firstUp && await p.evaluate(() => { const c = [...document.querySelectorAll("#ovGrid > .card[data-card]:not(.lay-hidcard)")].pop(); return c.querySelector(".lay-mv[data-lay-dir='1']").disabled; }), "");
    await p.focus(`#ovGrid > .card[data-card="${ids0[1]}"] .lay-mv[data-lay-dir="1"]`);
    await p.keyboard.press("Enter"); await p.waitForTimeout(150);
    const m = await p.evaluate(() => ({ ids: [...document.querySelectorAll("#ovGrid > .card[data-card]:not(.lay-hidcard)")].map(e => e.dataset.card),
      focus: document.activeElement.closest(".card") && document.activeElement.closest(".card").dataset.card, dir: document.activeElement.dataset.layDir, status: document.getElementById("layStatus").textContent }));
    L.ck("▼ (keyboard Enter) moves the card down one place", m.ids[2] === ids0[1] && m.ids[1] === ids0[2], JSON.stringify(m.ids));
    L.ck("focus stays on the moved card's ▼, and the status line announces it", m.focus === ids0[1] && m.dir === "1" && /Moved .* down — now 3 of/.test(m.status), JSON.stringify(m));
    await p.keyboard.press("Enter"); await p.waitForTimeout(120);
    await p.click(`#ovGrid > .card[data-card="${ids0[1]}"] .lay-mv[data-lay-dir="-1"]`); await p.waitForTimeout(120);
    const m2 = (await grid(p, "overview")).vis.map(c => c.id);
    L.ck("▼ then ▲ nets one place down", m2.indexOf(ids0[1]) === 2, JSON.stringify(m2));
    /* hidden card keeps its slot through a move */
    await p.click(`#ovGrid > .card[data-card="${m2[3]}"] .lay-toggle`); await p.waitForTimeout(100);
    await p.click(`#ovGrid > .card[data-card="${m2[0]}"] .lay-mv[data-lay-dir="1"]`); await p.waitForTimeout(100);
    await p.click(`#ovGrid > .lay-hidcard[data-card="${m2[3]}"] .lay-toggle`); await p.waitForTimeout(100);
    const m3 = (await grid(p, "overview")).vis.map(c => c.id);
    L.ck("a card hidden during a move comes back in its own slot", m3.indexOf(m2[3]) === 3 && m3[0] === m2[1] && m3[1] === m2[0], JSON.stringify({ m2, m3 }));
    await p.reload({ waitUntil: "domcontentloaded" }); await p.waitForTimeout(900); await L.go(p, "ollie", "overview");
    const m4 = await p.evaluate(() => [...document.querySelectorAll("#ovGrid > .card[data-card]")].map(e => e.dataset.card));
    L.ck("the ▲ ▼ order survives a reload (state.layout.order)", JSON.stringify(m4) === JSON.stringify(m3), JSON.stringify({ m3, m4 }));
    /* drag & drop still works (HTML5 DnD) and keeps hidden slots */
    await edit(p, true);
    await p.dragAndDrop(`#ovGrid > .card[data-card="${m4[2]}"]`, `#ovGrid > .card[data-card="${m4[0]}"]`, { targetPosition: { x: 40, y: 10 } });
    await p.waitForTimeout(150);
    const dd = await p.evaluate(() => state.layout.order.overview);
    L.ck("drag & drop still reorders (dragged card now first)", dd[0] === m4[2] && dd.length >= m4.length, JSON.stringify(dd));
    /* corner resize still saves a snapped width */
    const rzBox = await p.evaluate(id => { const r = document.querySelector(`#ovGrid > .card[data-card="${id}"] .rz`).getBoundingClientRect(); return { x: r.left + 8, y: r.top + 8 }; }, dd[1]);
    await p.mouse.move(rzBox.x, rzBox.y); await p.mouse.down(); await p.mouse.move(rzBox.x - 220, rzBox.y + 40, { steps: 5 }); await p.mouse.up();
    const rs = await p.evaluate(id => state.layout.size.overview && state.layout.size.overview[id], dd[1]);
    L.ck("corner resize still saves a column-snapped width and a height", rs && Number.isInteger(rs.w) && rs.w >= 3 && rs.w <= 12 && rs.h > 0, JSON.stringify(rs));
    /* density, Show:, Reset layout */
    await p.click("#denCompact"); const dens = await p.evaluate(() => [state.layout.density, document.body.classList.contains("compact")]);
    await p.click("#denCozy");
    await p.click("#shTiles"); const tilesOff = await p.evaluate(() => [state.layout.show.tiles, document.querySelector('#ovGrid > .card[data-card="keystats"]') ? "card" : "none"]);
    await p.click("#shTiles");
    L.ck("Density and Show: toggles still work (Stat tiles now shows/hides the Key stats card)", dens[0] === "compact" && dens[1] && tilesOff[0] === false && tilesOff[1] === "none", JSON.stringify({ dens, tilesOff }));
    await p.click('#editToolbar button[onclick="resetLayout()"]'); await p.waitForTimeout(120);
    const rst = await p.evaluate(() => ({ size: state.layout.size, hidden: state.layout.hidden, order: state.layout.order.overview }));
    L.ck("Reset layout still resets sizes and hidden, and the Overview order to the importance order", JSON.stringify(rst.size) === "{}" && JSON.stringify(rst.hidden) === "{}" && rst.order[0] === "keystats", JSON.stringify(rst));
    const strip = await p.evaluate(() => ({ inGrid: !!document.querySelector(".sortable #nxtStrip"), tools: document.querySelectorAll("#nxtStrip .lay-tools").length, tiles: document.querySelectorAll("#nxtStrip .nxt-tile").length }));
    L.ck("the Next up strip is not a card (no edit tools, not in a grid) and still renders", !strip.inGrid && strip.tools === 0 && strip.tiles > 0, JSON.stringify(strip));
    await p.click("#editToolbar .lay-done"); await p.waitForTimeout(100);
    L.ck("the edit bar's 🔒 Done leaves edit mode", await p.evaluate(() => !editMode && !document.body.classList.contains("editing")), "");
    L.ck("[move] no page errors", errs.length === 0, JSON.stringify(errs.slice(0, 5)));
    await ctx.close();
  }

  /* ---------- 4. old saved state with hidden + size still loads ---------- */
  {
    const old = JSON.parse(L.REAL);
    old.layout = Object.assign({}, old.layout, { hidden: { overview: ["flags"], gaps: ["nonexistent-card"] }, size: { overview: { daily: { w: 7, h: 400 } } } });
    const { ctx, p, errs } = await L.open(b, { tag: "old", state: JSON.stringify(old) });
    await L.go(p, "ollie", "overview");
    const o = await p.evaluate(() => { const d = document.querySelector('#ovGrid > .card[data-card="daily"]'); return { flags: !!document.querySelector('#ovGrid [data-card="flags"]'), span: d && d.style.gridColumn, mh: d && d.style.minHeight }; });
    L.ck("old state: hidden card stays hidden, saved width/height still applied", !o.flags && /span 7/.test(o.span) && o.mh === "400px", JSON.stringify(o));
    await edit(p, true);
    const g = await grid(p, "overview"), pl = await pills(p);
    L.ck("old state in edit mode: Hidden strip + pill read 'Top flags'", g.hid.some(h => h.id === "flags" && h.name === "Top flags") && pl.some(x => x.id === "flags" && /Top flags/.test(x.text)), JSON.stringify({ hid: g.hid, pl }));
    await L.go(p, "ollie", "gaps");
    const gp = await pills(p);
    L.ck("a hidden id with no card on screen still gets a readable pill (prettified id)", gp.some(x => x.id === "nonexistent-card" && /Nonexistent card/.test(x.text)), JSON.stringify(gp));
    L.ck("[old state] no page errors", errs.length === 0, JSON.stringify(errs.slice(0, 5)));
    await ctx.close();
  }

  /* ---------- 5. phone 390 (touch): edit via More, pills visible, ▲ ▼ by tap, 44px targets, no overflow ---------- */
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    await ctx.addInitScript(([s, pl]) => { try { if (sessionStorage.getItem("seeded-m")) return; localStorage.clear(); localStorage.setItem("swgoh-tracker", s); localStorage.setItem("swgoh-holotable-pulls-v1", pl); sessionStorage.setItem("seeded-m", "1"); } catch (e) {} }, [L.REAL, L.PULLS]);
    await ctx.route(/fonts\.g|swgoh\.gg|corsproxy|allorigins|codetabs|api\.github/, r => r.abort());
    const p = await ctx.newPage(); const errs = [];
    p.on("pageerror", e => errs.push(String(e).slice(0, 300)));
    p.on("console", m => { if (m.type() === "error" && !/Failed to load resource|net::ERR|fonts\.g/.test(m.text())) errs.push("console: " + m.text().slice(0, 200)); });
    await p.goto(`http://127.0.0.1:${L.PORT}/x.html`, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(900);
    await L.go(p, "ollie", "overview");
    await p.tap("#moreButton"); await p.waitForTimeout(150);
    await p.tap("#morePanel .more-actions button:first-child"); await p.waitForTimeout(200);
    const bar = await p.evaluate(() => { const r = document.getElementById("editToolbar").getBoundingClientRect(); return { editing: document.body.classList.contains("editing"), w: r.width, right: r.right,
      touchHint: getComputedStyle(document.querySelector(".lay-hint-touch")).display, fineHint: getComputedStyle(document.querySelector(".lay-hint-fine")).display,
      done: document.querySelector("#editToolbar .lay-done").getBoundingClientRect().height }; });
    L.ck("[390 touch] More → Edit layout opens the edit bar; touch hint says resize needs a mouse; a Done button is there", bar.editing && bar.w > 300 && bar.right <= 391 && bar.touchHint !== "none" && bar.fineHint === "none" && bar.done >= 44, JSON.stringify(bar));
    await p.tap('#ovGrid > .card[data-card="flags"] .lay-toggle'); await p.waitForTimeout(150);
    const pill = await p.evaluate(() => { const b = document.querySelector('#hiddenPills .lay-pill[data-lay-id="flags"]'); if (!b) return null; const r = b.getBoundingClientRect(); return { text: b.textContent.trim(), h: r.height, w: r.width, right: r.right, vis: getComputedStyle(b).visibility, disp: getComputedStyle(document.getElementById("hiddenPills")).display }; });
    L.ck("[390 touch] the hidden pill is visible on the phone with a friendly title and a ≥44px target", pill && pill.text === "⊕ Top flags" && pill.h >= 44 && pill.right <= 391 && pill.disp !== "none", JSON.stringify(pill));
    const tgt = await p.evaluate(() => [...document.querySelectorAll("#ovGrid .lay-tools button, #editToolbar .pill")].filter(b => b.offsetParent).map(b => { const r = b.getBoundingClientRect(); return Math.min(r.width, r.height); }));
    L.ck("[390 touch] every card tool and edit-bar button is ≥44px", tgt.length > 10 && tgt.every(x => x >= 44), JSON.stringify(tgt.filter(x => x < 44)));
    await p.tap('#hiddenPills .lay-pill[data-lay-id="flags"]'); await p.waitForTimeout(150);
    L.ck("[390 touch] tapping the pill shows the card", await p.evaluate(() => !!document.querySelector('#ovGrid > .card[data-card="flags"]:not(.lay-hidcard)')), "");
    const ids0 = await p.evaluate(() => [...document.querySelectorAll("#ovGrid > .card[data-card]")].map(e => e.dataset.card));
    await p.tap(`#ovGrid > .card[data-card="${ids0[0]}"] .lay-mv[data-lay-dir="1"]`); await p.waitForTimeout(150);
    const ids1 = await p.evaluate(() => [...document.querySelectorAll("#ovGrid > .card[data-card]")].map(e => e.dataset.card));
    L.ck("[390 touch] ▼ by tap reorders the cards", ids1[0] === ids0[1] && ids1[1] === ids0[0], JSON.stringify(ids1));
    const span12 = await p.evaluate(() => [...document.querySelectorAll("#ovGrid > .card")].every(el => Math.abs(el.getBoundingClientRect().width - document.getElementById("ovGrid").getBoundingClientRect().width) < 2));
    L.ck("[390] cards still take the full width on a phone", span12, "");
    for (const t of TABS) { await L.go(p, "ollie", t); const o = await L.overflow(p); L.ck(`[390 edit] ${t}: no horizontal overflow`, o.doc <= o.inner + 1, JSON.stringify(o)); }
    await L.go(p, "ollie", "overview");
    await p.tap('#ovGrid > .card[data-card="daily"] .lay-toggle'); await p.waitForTimeout(120);
    await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await p.screenshot({ path: L.path.join(L.ROOT, "shots", "lay-check-390-edit.png"), fullPage: false });
    await p.tap("#editToolbar .lay-done"); await p.waitForTimeout(120);
    L.ck("[390 touch] Done leaves edit mode (the header Lock button is hidden on phones)", await p.evaluate(() => !editMode), "");
    L.ck("[390] no page errors", errs.length === 0, JSON.stringify(errs.slice(0, 5)));
    await ctx.close();
  }

  /* ---------- 6. 1280: no overflow in edit mode on every covered tab; screenshot of a hidden card ---------- */
  {
    const { ctx, p, errs } = await L.open(b, { tag: "wide" });
    await edit(p, true);
    for (const t of TABS) { await L.go(p, "ollie", t); const o = await L.overflow(p); L.ck(`[1280 edit] ${t}: no horizontal overflow`, o.doc <= o.inner + 1, JSON.stringify(o)); }
    await L.go(p, "ollie", "overview");
    await p.click('#ovGrid > .card[data-card="flags"] .lay-toggle'); await p.waitForTimeout(150);
    await p.evaluate(() => document.querySelector('#ovGrid > .lay-hidcard').scrollIntoView({ block: "center", behavior: "instant" }));
    await p.screenshot({ path: L.path.join(L.ROOT, "shots", "lay-check-hidden-1280.png") });
    L.ck("[1280] no page errors", errs.length === 0, JSON.stringify(errs.slice(0, 5)));
    await ctx.close();
  }
  /* ---------- 7. gap-free pack (default layout), Key stats first, importance sort + undo, Match heights ---------- */
  {
    const { ctx, p, errs } = await L.open(b, { tag: "pack" });
    const PACK_TABS = ["overview", "gaps", "leia", "coach", "farm", "events", "gac", "intel", "arena"];
    for (const acct of ["ollie", "tiny"]) {
      for (const tab of PACK_TABS) {
        await L.go(p, acct, tab); await p.waitForTimeout(100);
        const pane = await p.evaluate(() => (document.querySelector(".tabpane.active .sortable[data-pane]") || {}).dataset?.pane);
        const pk = await packCheck(p, pane);
        L.ck(`[default] ${acct}/${tab}: no card has blank space inside it`, pk && pk.blank.length === 0, JSON.stringify(pk && pk.blank));
        L.ck(`[default] ${acct}/${tab}: cards stack with one gap and never overlap (holes listed if any)`, pk && pk.holes.every(h => h.d >= pk.gap - 0.5) , JSON.stringify(pk));
        L.ck(`[default] ${acct}/${tab}: no vertical gaps between boxes in any column`, pk && pk.holes.length === 0 && pk.emptyCols === 0, JSON.stringify(pk));
      }
    }
    /* Key stats card first on Overview for both accounts (the real saved state has a custom Overview order) */
    for (const acct of ["ollie", "tiny"]) {
      await L.go(p, acct, "overview");
      const ks = await p.evaluate(() => { const first = document.querySelector("#ovGrid > .card[data-card]");
        const st = [...first.querySelectorAll(".lay-stat")].map(el => ({ l: el.querySelector(".lbl").textContent.trim(), v: el.querySelector(".val").textContent.trim() }));
        return { first: first.dataset.card, st, tiles: document.getElementById("tiles").innerHTML.trim(), tilesShown: getComputedStyle(document.getElementById("tiles")).display, y: first.getBoundingClientRect().top, strip: document.getElementById("nxtStrip").getBoundingClientRect().bottom }; });
      const lbl = ks.st.map(x => x.l).join("|");
      L.ck(`${acct}: Overview's first card is Key stats, right under the Next up strip`, ks.first === "keystats" && ks.y >= ks.strip && ks.y - ks.strip < 60, JSON.stringify({ first: ks.first, y: ks.y, strip: ks.strip }));
      L.ck(`${acct}: Key stats shows Galactic power, GL readiness, GLs owned, Fleet arena and GAC, each with a value`,
        /Galactic power/i.test(lbl) && /readiness/i.test(lbl) && /GLs owned/i.test(lbl) && /Fleet arena/i.test(lbl) && /GAC/.test(lbl) && ks.st.every(x => x.v.length > 0), JSON.stringify(ks.st));
      const gl = ks.st.find(x => /readiness/i.test(x.l));
      L.ck(`${acct}: the GL tracker value is a percentage or 'Owned ✓'`, gl && (/^~?\d+%$/.test(gl.v) || gl.v === "Owned ✓"), JSON.stringify(gl));
      L.ck(`${acct}: the old stat strip at the bottom of Overview is gone (no duplicate)`, ks.tiles === "" && ks.tilesShown === "none", JSON.stringify({ t: ks.tiles.slice(0, 60), d: ks.tilesShown }));
    }
    /* pack stays right after opening a fold, a tab switch, and 1280 → 390 → 1280 */
    await L.go(p, "ollie", "gaps");
    const opened = await p.evaluate(() => { const d = document.querySelector("#gapsGrid details:not([open])"); if (!d) return false; d.open = true; return true; });
    await p.waitForTimeout(200);
    let pk = await packCheck(p, "gaps");
    L.ck("after opening a fold (Why this squad?) the pane re-packs: no holes, no overlap", opened && pk.holes.length === 0 && pk.emptyCols === 0, JSON.stringify(pk));
    await L.go(p, "ollie", "leia"); await L.go(p, "ollie", "overview");
    pk = await packCheck(p, "overview");
    L.ck("after switching tabs away and back the Overview is packed", pk.holes.length === 0 && pk.blank.length === 0, JSON.stringify(pk));
    for (const w of [390, 1280]) {
      await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(300);
      for (const [tab, pane] of [["overview", "overview"], ["gaps", "gaps"], ["leia", "leia"], ["farm", "farm"]]) {
        if (tab !== "overview") { await L.go(p, "ollie", tab); await p.waitForTimeout(150); }
        pk = await packCheck(p, pane);
        const o = await L.overflow(p);
        L.ck(`after resizing to ${w}: ${tab} packed (no holes, no blank space, no horizontal overflow)`, pk.holes.length === 0 && pk.blank.length === 0 && pk.emptyCols === 0 && o.doc <= o.inner + 1, JSON.stringify({ pk, o }));
      }
      await L.go(p, "ollie", "overview"); await p.waitForTimeout(150);
    }
    await p.setViewportSize({ width: 1280, height: 1000 }); await p.waitForTimeout(200);
    /* Sort by importance + Undo sort */
    await edit(p, true);
    const saved0 = await p.evaluate(() => JSON.stringify(state.layout.order.overview));
    await p.click("#layTools .lay-sort"); await p.waitForTimeout(150);
    const so = await p.evaluate(() => ({ order: state.layout.order.overview, dom: [...document.querySelectorAll("#ovGrid > .card[data-card]:not(.lay-hidcard)")].map(e => e.dataset.card), undo: (document.querySelector("#layTools .lay-undo") || {}).textContent }));
    const want = ["keystats", "flags", "readiness", "today", "nextup", "daily", "eventflags", "momentum", "datahealth"].filter(id => so.dom.includes(id));
    L.ck("Sort by importance puts Overview in priority order (Key stats, Top flags, GL readiness, Today, Next farm actions, Daily, Event reminders, What's moved)", JSON.stringify(so.dom) === JSON.stringify(want), JSON.stringify(so.dom));
    L.ck("…and offers 'Undo sort'", so.undo === "↶ Undo sort", String(so.undo));
    await p.click("#layTools .lay-undo"); await p.waitForTimeout(150);
    L.ck("Undo sort restores the saved order exactly", await p.evaluate(() => JSON.stringify(state.layout.order.overview)) === saved0, "");
    await L.go(p, "ollie", "farm");
    const fs = await p.evaluate(() => { const b = document.querySelector("#layTools .lay-sort"); return { dis: b.disabled, t: b.title }; });
    L.ck("Farm plan (phase order): Sort by importance is disabled and says why", fs.dis && /phases/.test(fs.t), JSON.stringify(fs));
    await L.go(p, "ollie", "leia");
    await p.click("#layTools .lay-sort"); await p.waitForTimeout(150);
    const lo = await p.evaluate(() => [...document.querySelectorAll("#glTables > .card[data-card]")].map(e => e.dataset.card));
    L.ck("GL Roadmap sort: GL queue first, target Legend + its requirements before pace/joint", lo[0] === "glq" && lo.indexOf("note") < lo.indexOf("pace") && lo.indexOf("reqs-1") < lo.indexOf("pace"), JSON.stringify(lo));
    /* Match heights toggle (device-local) */
    await L.go(p, "ollie", "overview");
    await p.click("#layTools .lay-match-btn"); await p.waitForTimeout(150);
    const mh = await p.evaluate(() => { const g = document.getElementById("ovGrid"); const blob = JSON.parse(localStorage.getItem("swgoh-tracker") || "{}");
      const cards = [...g.querySelectorAll(":scope > .card[data-card]:not(.lay-hidcard)")].map(el => el.getBoundingClientRect());
      const rowsEq = cards.every(a => cards.filter(b2 => Math.abs(b2.top - a.top) < 2).every(b2 => Math.abs(b2.height - a.height) < 2));
      return { match: g.classList.contains("lay-match"), mas: g.classList.contains("lay-mas"), view: state.views["lay-match"], inBlob: !!(blob.views && blob.views["lay-match"]), rowsEq, pressed: document.querySelector("#layTools .lay-match-btn").getAttribute("aria-pressed") }; });
    L.ck("'Match heights in a row' switches to equal-height rows, device-local", mh.match && !mh.mas && mh.view === "1" && !mh.inBlob && mh.rowsEq && mh.pressed === "true", JSON.stringify(mh));
    await p.click("#layTools .lay-match-btn"); await p.waitForTimeout(150);
    pk = await packCheck(p, "overview");
    L.ck("…and back off: masonry again", await p.evaluate(() => document.getElementById("ovGrid").classList.contains("lay-mas")) && pk.blank.length === 0, JSON.stringify(pk));
    await edit(p, false);
    L.ck("[pack] no page errors", errs.length === 0, JSON.stringify(errs.slice(0, 5)));
    await ctx.close();
  }
  /* ---------- 8. no saved order → the importance order is the default ---------- */
  {
    const st = JSON.parse(L.REAL); st.layout = Object.assign({}, st.layout); delete st.layout.order;   /* a first-run layout */
    const { ctx, p, errs } = await L.open(b, { tag: "noorder", state: JSON.stringify(st) });
    await L.go(p, "ollie", "overview");
    const dom = await p.evaluate(() => [...document.querySelectorAll("#ovGrid > .card[data-card]")].map(e => e.dataset.card));
    const want = ["keystats", "flags", "readiness", "today", "nextup", "daily", "eventflags", "momentum", "datahealth"].filter(id => dom.includes(id));
    L.ck("a first-run Overview renders in importance order", JSON.stringify(dom) === JSON.stringify(want), JSON.stringify(dom));
    await L.go(p, "ollie", "leia");
    const lo = await p.evaluate(() => ({ saved: state.layout.order.leia || null, dom: [...document.querySelectorAll("#glTables > .card[data-card]")].map(e => e.dataset.card) }));
    L.ck("GL Roadmap with no saved order renders in importance order (queue, next characters, target Legend + requirements, pace, joint) without saving one",
      lo.saved === null && JSON.stringify(lo.dom) === JSON.stringify(["glq", "nxt", "note", "reqs-1", "reqs-2", "pace", "joint"].filter(id => lo.dom.includes(id))), JSON.stringify(lo));
    await L.go(p, "ollie", "overview");
    await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await p.screenshot({ path: L.path.join(L.ROOT, "shots", "lay-check-default-1280.png") });
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(300);
    await p.screenshot({ path: L.path.join(L.ROOT, "shots", "lay-check-default-390.png"), fullPage: true });
    L.ck("[no order] no page errors", errs.length === 0, JSON.stringify(errs.slice(0, 5)));
    await ctx.close();
  }
  await L.finish(b, srv);
})();
