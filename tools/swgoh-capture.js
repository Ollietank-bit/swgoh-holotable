/* Holotable swgoh.gg CAPTURE v1 (tools/swgoh-capture.js)
   Paste this whole file as the `text` of javascript_tool in a swgoh.gg tab (any page; /schedule/ is a good one).
   One run: same-origin fetch() of the player API, the GAC bracket API and 8 HTML pages, structured extraction
   IN the page (DOMParser), then ONE gzip file saved to Downloads: holotable-capture-YYYY-MM-DD-HHmm.json.gz.
   Returns a <=300-char summary with no URLs (also kept in window.__holotableCapture.summary — re-read it with a
   second javascript_tool call `window.__holotableCapture.summary` if the first call timed out; the capture keeps
   running in the tab and the download still happens).
   The file is a superset of the bookmarklet's pull file ({type:"holotable-pull", v:1, at, accounts, gac}) so the
   app's "Import pull file…" still accepts it; extra keys: pages, manifest, captureVersion. Parse offline with
   `node tools/parse-capture.js <file.json.gz> [out.json]`.

   MODES (CONFIG.mode, or set window.__holotableCaptureConfig = {mode:"live"} before pasting):
     "all"   (default) fetch everything and download the file.
     "live"  extract ONLY the current tab's live DOM (document) for the page it is on and merge the result into the
             store (sessionStorage + localStorage key __holotableCaptureStore); no download. Use once per page when
             fetched HTML comes back un-hydrated (manifest shows 0 rows / text-only for a page).
     "flush" fetch the APIs (unless apis:false), merge the stored live pages over the fetched ones, download, clear store.
   Everything else is in CONFIG below. */
(async () => {
  "use strict";
  const CONFIG = Object.assign({
    mode: "all",                                   // "all" | "live" | "flush"
    origin: "https://swgoh.gg",                    // the only origin the script will run on (selftest overrides)
    accounts: { ollie: "229917529", tiny: "295352286" },
    pages: {                                       // key -> path (keys are the file's pages.<key>)
      schedule: "/schedule/", tierGac: "/tier-list/gac/", tierGacDef: "/tier-list/gac/?side=defense",
      tier3v3: "/tier-list/3v3/", tier3v3Def: null /* discovered from the 3v3 page's own links, else ?side=defense */,
      tierFleet: "/tier-list/fleet/", datacrons: "/datacrons/", raid: "/raids/droid-destruction/"
    },
    apis: true, gacPlayers: true, gacConcurrency: 3,
    iframe: true,                                  // when fetched HTML yields 0 rows: render the page in a hidden same-origin iframe and retry
    expand: true,                                  // live mode: click "show more"-style buttons before extracting
    download: true, toast: true, clearStore: true,
    textCapRows: 20480, textCapEmpty: 61440, jsonCap: 150000,
    fetchMs: 20000, iframeMs: 15000, totalMs: 150000, pauseMs: 300
  }, (typeof self !== "undefined" && self.__holotableCaptureConfig) || {});
  const STORE_KEY = "__holotableCaptureStore";
  const S = self.__holotableCapture = { status: "running", summary: "", name: "", started: Date.now(), progress: [] };
  const T0 = Date.now(), timeLeft = () => CONFIG.totalMs - (Date.now() - T0);
  const clean = s => String(s == null ? "" : s).replace(/\s+/g, " ").trim();
  /* the summary must carry no URL / query string: scheme://, "?" and "=" are stripped, hostnames are never printed */
  const noUrl = s => String(s).replace(/[a-z]+:\/\/\S+/gi, "[url]").replace(/[?=]/g, "").replace(/\s+/g, " ").trim();
  const finish = (sum, status) => { S.status = status || "done"; S.summary = noUrl(sum).slice(0, 300); return S.summary; };
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- 0. where are we ---------- */
  if (location.origin !== CONFIG.origin) return finish("NOT on the expected site (" + location.host + "): open a swgoh.gg tab first", "wrong-origin");
  const isCf = (title, doc) => /just a moment|attention required|verify you are human/i.test(title || "") || !!(doc && doc.querySelector && doc.querySelector("#challenge-running,#challenge-form,#challenge-stage,.cf-turnstile,#cf-chl-widget"));
  if (isCf(document.title, document)) return finish("BLOCKED: the Cloudflare check is showing in this tab; wait for it to finish (reload if needed), then run again", "cloudflare");

  /* ---------- 1. fetch helper ---------- */
  async function get(path, json) {
    const ac = new AbortController(), tm = setTimeout(() => ac.abort(), CONFIG.fetchMs), r = { ok: false, status: 0, bytes: 0, text: "", notes: [] };
    try {
      const x = await fetch(path, { credentials: "same-origin", signal: ac.signal, headers: { Accept: json ? "application/json" : "text/html" } });
      r.status = x.status; r.text = await x.text(); r.bytes = r.text.length; r.ok = x.ok;
      if (/<title>\s*(just a moment|attention required)/i.test(r.text.slice(0, 4000))) { r.ok = false; r.notes.push("cloudflare-challenge"); }
      if (json && r.ok) { try { r.data = JSON.parse(r.text); } catch (e) { r.ok = false; r.notes.push(/^\s*</.test(r.text) ? "html-answer" : "bad-json"); } }
      if (!x.ok && !r.notes.length) r.notes.push("http " + x.status);
    } catch (e) { r.notes.push(ac.signal.aborted ? "timeout" : "fetch: " + String(e && e.message || e).slice(0, 60)); }
    clearTimeout(tm); r.text = r.text || ""; return r;
  }

  /* ---------- 2. DOM walk: ordered leaves (text nodes + img alt) with per-element leaf ranges ---------- */
  const SKIP = /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|SVG|IFRAME|HEAD|OBJECT|CANVAS|VIDEO|AUDIO|SELECT|OPTION)$/;
  const BLOCK = /^(ADDRESS|ARTICLE|ASIDE|BLOCKQUOTE|BR|DD|DETAILS|DIV|DL|DT|FIELDSET|FIGCAPTION|FIGURE|FOOTER|FORM|H[1-6]|HEADER|HR|LI|MAIN|NAV|OL|P|PRE|SECTION|SUMMARY|TABLE|TBODY|TD|TFOOT|TH|THEAD|TR|UL)$/;
  const STOP = /^(BODY|HTML|MAIN)$/;
  function walk(root) {
    const leaves = [], range = new Map(), parts = [];
    (function rec(el) {
      const a = leaves.length;
      for (const c of el.childNodes) {
        if (c.nodeType === 3) { const t = clean(c.nodeValue); if (t) { leaves.push({ t, el, i: leaves.length }); parts.push(t + " "); } continue; }
        if (c.nodeType !== 1 || SKIP.test(c.tagName)) continue;
        if (c.tagName === "IMG") { const alt = clean(c.getAttribute("alt")); if (alt) { range.set(c, [leaves.length, leaves.length + 1]); leaves.push({ t: alt, el: c, img: true, i: leaves.length }); parts.push("[" + alt + "] "); } continue; }
        const blk = BLOCK.test(c.tagName); if (blk) parts.push("\n"); rec(c); if (blk) parts.push("\n");
      }
      range.set(el, [a, leaves.length]);
    })(root);
    const text = parts.join("").replace(/[ \t]+\n/g, "\n").replace(/\n{2,}/g, "\n").replace(/ {2,}/g, " ").trim();
    return { root, leaves, range, text };
  }
  const prefix = (W, flag) => { const p = new Array(W.leaves.length + 1); p[0] = 0; W.leaves.forEach((l, i) => { p[i + 1] = p[i] + (flag[i] ? 1 : 0); }); return p; };
  const countIn = (W, p, el) => { const r = W.range.get(el); return r ? p[r[1]] - p[r[0]] : 0; };
  /* rows = for every anchor leaf, the largest ancestor that still holds <= maxAnchors anchor leaves, no header leaf and <= maxN leaves */
  function group(W, isAnchor, opt) {
    opt = opt || {}; const maxA = opt.maxAnchors || 1, maxN = opt.maxN || 30, hdrFlag = opt.hdrFlag || [];
    const aFlag = W.leaves.map(l => isAnchor(l) ? 1 : 0), pa = prefix(W, aFlag), ph = prefix(W, hdrFlag), seen = new Set(), rows = [];
    W.leaves.forEach((l, i) => {
      if (!aFlag[i] || hdrFlag[i]) return;
      let el = l.el;
      while (el.parentElement) {
        const p = el.parentElement, r = W.range.get(p);
        if (!r || STOP.test(p.tagName) || countIn(W, pa, p) > maxA || countIn(W, ph, p) > 0 || r[1] - r[0] > maxN) break;
        el = p;
      }
      if (seen.has(el)) return; seen.add(el);
      const r = W.range.get(el); rows.push({ el, a: r[0], b: r[1], leaves: W.leaves.slice(r[0], r[1]) });
    });
    return rows.filter(x => !rows.some(y => y !== x && y.a <= x.a && y.b >= x.b && (y.b - y.a) > (x.b - x.a))).sort((x, y) => x.a - y.a);
  }
  /* "which of these candidates is a header": an element with <= maxLeaves leaves whose joined text matches re; flags all its leaves */
  function headerLeaves(W, re, maxLeaves) {
    const flag = new Array(W.leaves.length).fill(0), hdrs = [];
    W.range.forEach((r, el) => {
      const n = r[1] - r[0]; if (!n || n > maxLeaves || el.nodeType !== 1 || el.tagName === "IMG") return;
      if (W.leaves.slice(r[0], r[1]).some(l => l.img)) return;
      const t = clean(W.leaves.slice(r[0], r[1]).map(l => l.t).join(" ")).replace(/\s+,/g, ",");
      if (re.test(t)) hdrs.push({ i: r[0], b: r[1], t });
    });
    /* keep the smallest element per start index */
    const best = new Map(); hdrs.forEach(h => { const o = best.get(h.i); if (!o || h.b - h.i < o.b - o.i) best.set(h.i, h); });
    const out = Array.from(best.values()).sort((x, y) => x.i - y.i);
    out.forEach(h => { for (let i = h.i; i < h.b; i++) flag[i] = 1; });
    return { flag, hdrs: out };
  }
  const hdrBefore = (hdrs, a) => { let h = null; for (const x of hdrs) { if (x.i < a) h = x; else break; } return h ? h.t : null; };
  const classStr = el => { let s = ""; for (let e = el, n = 0; e && n < 4 && e.nodeType === 1; e = e.parentElement, n++) s += " " + (e.getAttribute("class") || "") + " " + (e.getAttribute("data-tier") || ""); return s; };
  const attrText = el => Array.from(el.querySelectorAll("[title],[aria-label],[data-tooltip],[data-original-title]")).map(e => (e.getAttribute("title") || "") + " " + (e.getAttribute("aria-label") || "") + " " + (e.getAttribute("data-tooltip") || "") + " " + (e.getAttribute("data-original-title") || "")).join(" ");
  const isoIn = el => { const m = (el.outerHTML || "").match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/g); return m ? Array.from(new Set(m)).slice(0, 6) : []; };
  const tables = doc => Array.from(doc.querySelectorAll("table")).slice(0, 12).map(t => ({
    caption: clean(t.caption && t.caption.textContent).slice(0, 120),
    rows: Array.from(t.querySelectorAll("tr")).slice(0, 150).map(tr => Array.from(tr.children).slice(0, 14).map(c => clean(c.textContent).slice(0, 120))) }));
  const embedded = doc => Array.from(doc.querySelectorAll('script[type="application/json"],script[type="application/ld+json"],script#__NEXT_DATA__')).map(s => s.textContent || "")
    .filter(s => s.length > 40 && /event|schedule|tier|datacron|raid|season|squad/i.test(s)).map(s => s.slice(0, CONFIG.jsonCap)).slice(0, 3);
  const controls = doc => {
    const o = { selects: [], active: [] };
    doc.querySelectorAll("select").forEach(s => { const op = s.options[s.selectedIndex]; o.selects.push({ name: s.name || s.id || "", value: s.value, text: clean(op && op.textContent).slice(0, 40) }); });
    doc.querySelectorAll('[aria-current],[aria-selected="true"],[aria-pressed="true"],.active,.selected,.is-active,input:checked').forEach(e => { const t = clean(e.textContent || e.value || e.getAttribute("aria-label")).slice(0, 40); if (t && o.active.length < 30 && !o.active.includes(t)) o.active.push(t); });
    return o;
  };
  const meta = doc => ({ title: clean(doc.title).slice(0, 160), h1: Array.from(doc.querySelectorAll("h1,h2")).slice(0, 8).map(h => clean(h.textContent).slice(0, 120)) });
  const capText = (W, rows) => { const cap = rows ? CONFIG.textCapRows : CONFIG.textCapEmpty; return { text: W.text.slice(0, cap), textTruncated: W.text.length > cap }; };

  /* ---------- 3. page extractors (each returns {rows, ...}; the same function serves fetched and live DOMs) ---------- */
  const WD = "(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)[a-z]*\\.?", MO = "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.?", DN = "\\d{1,2}(?:st|nd|rd|th)?";
  const DAYHDR = new RegExp("^(?:" + WD + ",?\\s+(?:" + MO + "\\s+" + DN + "|" + DN + "\\s+" + MO + ")(?:,?\\s+\\d{4})?|Today|Tomorrow)$", "i");
  const BAREHDR = new RegExp("^(?:" + MO + "\\s+" + DN + "|" + DN + "\\s+" + MO + ")(?:,?\\s+\\d{4})?$", "i");
  const ATHDR = new RegExp("^At\\s+(?:" + WD + ",?\\s+)?(?:" + MO + "\\s+" + DN + "|" + DN + "\\s+" + MO + ")(?:,?\\s+\\d{4})?(?:,?\\s+\\d{1,2}:\\d{2}\\s*[AP]M)?$", "i");
  const TIME = /^\d{1,2}:\d{2}(?:\s*[AP]\.?M\.?)?(?:\s+[A-Z]{2,5})?$/i, PCT = /^\d{1,3}(?:\.\d+)?\s*%$/, NUM = /^#?[\d,]+(?:\.\d+)?\s*[KMB]?$/i, EXPIRE = /\bexpir(?:es|ed|e|ing|y)\b/i;
  /* an END leaf starts with "Ends"/"Ended" or says "ends <date|time|in N|today>"; a title that merely finishes with the word "ends" ("Era … ends") is not one */
  const ENDS = /^(?:ends?|ended|ending)\b|\bend(?:s|ed|ing)?\s+(?:in\s+\d|on\s+|at\s+|(?:sun|mon|tue|wed|thu|fri|sat)[a-z]*,?\s|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d|\d{1,2}:\d{2}|\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|today|tomorrow)/i;
  const KIND = /^(assault battle|fleet mastery|omega battle|era battle|era challenge|era event|era|legendary(?: event)?|marquee(?: event)?|new character|new ship|new unit|store(?: packs?)?|packs?|bundle|datacron|resource(?: event)?|special(?: event)?|territory (?:war|battle)|grand arena|gac|conquest|journey(?: guide)?|mythic(?: event)?|galactic (?:challenge|bount(?:y|ies)|legend)|raid|bonus(?: drops?)?|release|farmable node|shard node|node|proving grounds|credit heist|event|quest|challenge|login calendar|calendar|lightspeed bundle|other|hero'?s journey|epic confrontation|ancient journey|fleet|arena|ship)$/i;
  const CAPS = /^[A-Z][A-Z0-9 &'’:\-\/]{2,29}$/;

  function schedule(doc) {
    const W = walk(doc.body || doc);
    const H = headerLeaves(W, DAYHDR, 4);
    let hdrs = H.hdrs, hdrFlag = H.flag;
    if (!hdrs.length) { const B = headerLeaves(W, BAREHDR, 3); const bare = B.hdrs.filter(h => /^H[1-6]$/.test(W.leaves[h.i].el.parentElement && W.leaves[h.i].el.parentElement.tagName) || /^H[1-6]$/.test(W.leaves[h.i].el.tagName)); if (bare.length) { hdrs = bare; hdrFlag = new Array(W.leaves.length).fill(0); bare.forEach(h => { for (let i = h.i; i < h.b; i++) hdrFlag[i] = 1; }); } }
    const isTime = l => !l.img && l.t.length <= 16 && TIME.test(l.t);
    const isEnd = l => !l.img && (ENDS.test(l.t) || /predicted/i.test(l.t));
    let rows = group(W, isTime, { maxN: 32, hdrFlag });
    const covered = l => rows.some(r => r.a <= l.i && l.i < r.b);
    rows = rows.concat(group(W, l => isEnd(l) && !covered(l), { maxN: 32, hdrFlag }).filter(r => !rows.some(x => x.a < r.b && r.a < x.b))).sort((x, y) => x.a - y.a);
    const out = rows.map(it => {
      const used = new Set(), L = it.leaves.filter(l => !l.img);
      const take = re => { const l = L.find(x => !used.has(x) && re.test(x.t)); if (l) used.add(l); return l ? l.t : null; };
      const r = { day: hdrBefore(hdrs, it.a), time: take(TIME), ends: take(ENDS), predicted: take(/^predicted\b/i) || take(/predicted/i) };
      r.conf = take(/^(?:very\s+)?(?:high|medium|low)(?:\s+confidence)?$/i) || (r.predicted && (/(high|medium|low)/i.exec(r.predicted) || [])[1]) || null;
      r.kind = take(KIND); if (!r.kind) { const c = L.find(x => !used.has(x) && CAPS.test(x.t) && !/^(NEW|PREDICTED|HIGH|MEDIUM|LOW|TODAY|TOMORROW|LIVE|ENDED)$/.test(x.t)); if (c) { used.add(c); r.kind = c.t; } }
      const rest = L.filter(x => !used.has(x)).map(x => x.t);
      r.title = rest[0] || null; r.subtitle = rest.slice(1).join(" · ") || null;
      r.leaves = it.leaves.map(l => (l.img ? "[" : "") + l.t + (l.img ? "]" : "")).slice(0, 24);
      const iso = isoIn(it.el); if (iso.length) r.iso = iso;
      if (/predicted/i.test(classStr(it.el)) && !r.predicted) r.predicted = "PREDICTED (class)";
      return r;
    });
    const all = W.leaves.filter(l => !l.img).map(l => l.t);
    const atHeader = all.find(t => ATHDR.test(t)) || (W.text.match(new RegExp("\\bAt\\s+" + WD + ",?\\s+" + MO + "\\s+" + DN + "(?:,?\\s+\\d{4})?", "i")) || [])[0] || null;
    const tzLabel = all.find(t => t.length < 100 && /\btimes?\b.*\b(?:time|zone|utc|gmt)\b/i.test(t)) || (W.text.match(/times?\s+(?:are\s+|shown\s+)?in\s+[A-Z][A-Za-z\/ ]{3,40}?\b(?:time|zone|utc|gmt)\b(?:\s*\([^)]{1,20}\))?/i) || [])[0] || null;
    return Object.assign(meta(doc), { rows: out, dayHeaders: hdrs.map(h => h.t), atHeader, tzLabel: tzLabel ? clean(tzLabel) : null, controls: controls(doc), tables: tables(doc), json: embedded(doc) }, capText(W, out.length));
  }

  const HEADW = /^(rank|#|tier|squad|fleet|team|leader|units?|elo|rating|win ?(?:%|rate)?|hold ?(?:%|rate)?|hold|wins?|losses|win\/loss|battles|attempts|builds?|trend|change|datacrons?|banners?|avg\.? ?banners?|score|usage|popularity|defen[cs]e(?: hold)?|offen[cs]e)$/i;
  const STATW = /^(elo|rating|win ?(?:%|rate)?|hold ?(?:%|rate)?|hold|wins?|losses|win\/loss|battles|attempts|builds?|banners?|avg\.? ?banners?|score|usage|popularity)$/i;
  const UNITALT = /^(gear|relic|zeta|omicron|datacron|ultimate|icon|star|tier|rank|trend|up|down|new|logo|avatar|portrait|\d+|[a-z])$/i;
  const TREND = /^(NEW|—|–|-|[▲▼△▽↑↓]\s*\d*|[+\-−]\s*\d+|\d+\s*[▲▼↑↓])$/;
  function tierList(doc, path) {
    const W = walk(doc.body || doc);
    const isPct = l => !l.img && PCT.test(l.t);
    const valid = r => r.leaves.some(l => l.img && l.t.length > 1 && !UNITALT.test(l.t)) || r.el.querySelector("[title],[data-unit-name],[data-name],[data-base-id]");
    const pick = hdrFlag => { let best = null; for (let k = 1; k <= 3; k++) { const rs = group(W, isPct, { maxAnchors: k, maxN: 120, hdrFlag }); const n = rs.filter(valid).length; if (!best || n > best.n) best = { k, rs, n }; if (n && k > 1 && n <= best.n) break; } return best; };
    let best = pick([]);
    /* "S Tier" / "Tier S" SECTION headings (outside any row; an in-row "S" badge is not a heading) — when present, rows must not span across them */
    const T = headerLeaves(W, /^(?:tier\s+)?[SABCDF](?:\s+tier)?$/i, 2);
    const inRow0 = new Array(W.leaves.length).fill(0); best.rs.filter(valid).forEach(r => { for (let i = r.a; i < r.b; i++) inRow0[i] = 1; });
    T.hdrs = T.hdrs.filter(h => !inRow0[h.i]); T.flag = new Array(W.leaves.length).fill(0); T.hdrs.forEach(h => { for (let i = h.i; i < h.b; i++) T.flag[i] = 1; });
    if (T.hdrs.length) best = pick(T.flag);
    const rowsRaw = best.rs.filter(valid), inRow = new Array(W.leaves.length).fill(0); rowsRaw.forEach(r => { for (let i = r.a; i < r.b; i++) inRow[i] = 1; });
    const colHeaders = W.leaves.filter((l, i) => !inRow[i] && !l.img && HEADW.test(l.t)).map(l => l.t).filter((t, i, a) => a.indexOf(t) === i).slice(0, 16);
    const statCols = colHeaders.filter(t => STATW.test(t));
    const rows = rowsRaw.map((it, idx) => {
      const L = it.leaves, firstImg = L.findIndex(l => l.img && !UNITALT.test(l.t));
      const units = L.filter(l => l.img && l.t.length > 1 && !UNITALT.test(l.t)).map(l => l.t).filter((t, i, a) => a.indexOf(t) === i);
      const titles = Array.from(it.el.querySelectorAll("[data-unit-name],[data-name],[data-base-id],a[title],img[title],[title]")).map(e => clean(e.getAttribute("data-unit-name") || e.getAttribute("data-name") || e.getAttribute("data-base-id") || e.getAttribute("title"))).filter(t => t && t.length > 1 && t.length < 60 && !UNITALT.test(t) && !/datacron/i.test(t)).filter((t, i, a) => a.indexOf(t) === i).slice(0, 10);
      const rankLeaf = L.slice(0, firstImg < 0 ? L.length : firstImg).find(l => !l.img && /^#?\d{1,3}$/.test(l.t)) || null;
      const rankEl = !rankLeaf && it.el.querySelector("[class*='rank']"); const rankTxt = rankLeaf ? rankLeaf.t : rankEl ? clean(rankEl.textContent) : "";
      let tier = (L.find(l => !l.img && l !== rankLeaf && /^[SABCDF]$/.test(l.t)) || {}).t || null;
      if (!tier) { const m = /(?:^|[\s_\-])(?:tier|badge|grade)[_\-]?([sabcdf])(?![a-z0-9])/i.exec(classStr(it.el) + " " + Array.from(it.el.querySelectorAll("[class*='tier'],[class*='badge'],[data-tier]")).map(e => (e.getAttribute("class") || "") + " " + (e.getAttribute("data-tier") || "")).join(" ")); if (m) tier = m[1].toUpperCase(); }
      if (!tier) { const h = hdrBefore(T.hdrs, it.a); if (h) tier = h.replace(/tier/i, "").trim().toUpperCase(); }
      const vals = L.filter(l => !l.img && l !== rankLeaf && (PCT.test(l.t) || NUM.test(l.t))).map(l => l.t);
      const pcts = vals.filter(v => PCT.test(v)), nums = vals.filter(v => !PCT.test(v));
      const trend = (L.find(l => !l.img && l !== rankLeaf && TREND.test(l.t)) || {}).t || null;
      /* label/value pairs: (a) board column headers zipped positionally when the counts agree, (b) "label value" / "value label" neighbours, (c) one-leaf "91.4% win" */
      const stats = [];
      if (statCols.length && statCols.length === vals.length) statCols.forEach((c, i) => stats.push({ label: c, value: vals[i] }));
      else {
        const txt = L.filter(l => !l.img && l !== rankLeaf).map(l => l.t);
        txt.forEach((t, i) => {
          const m = /^([\d.,]+%?\s*[KMB]?)\s+([A-Za-z][A-Za-z %\/.]{1,20})$/.exec(t) || /^([A-Za-z][A-Za-z %\/.]{1,20}?)\s*:?\s+([\d.,]+%?\s*[KMB]?)$/.exec(t);
          if (m) { const lab = /\d/.test(m[1]) ? m[2] : m[1], v = /\d/.test(m[1]) ? m[1] : m[2]; stats.push({ label: clean(lab), value: clean(v) }); return; }
          if (!(PCT.test(t) || NUM.test(t))) return;
          const nb = [txt[i - 1], txt[i + 1]].find(x => x && x.length <= 20 && !/\d/.test(x) && !TREND.test(x) && !/^[SABCDF]$/.test(x));
          if (nb) stats.push({ label: nb, value: t });
        });
      }
      const dc = /datacron/i.test(classStr(it.el) + " " + attrText(it.el) + " " + L.filter(l => !l.img).map(l => l.t).join(" ")) || L.some(l => l.img && /datacron/i.test(l.t));
      const row = { rank: rankTxt ? +rankTxt.replace(/\D/g, "") : null, tier, units: units.length ? units : titles, win: pcts[0] || null, pcts, nums, stats, trend, dc,
        leaves: L.map(l => (l.img ? "[" : "") + l.t + (l.img ? "]" : "")).slice(0, 40) };
      /* normalised stats: by label when the board has labels, else positional (elo = the 3-4 digit number, then battles, builds) */
      const byLabel = re => (stats.find(s => re.test(s.label)) || {}).value || null;
      const n = { elo: byLabel(/^(elo|rating)$/i), win: byLabel(/^win/i), hold: byLabel(/^hold|defen[cs]e hold/i), battles: byLabel(/battles|attempts/i), builds: byLabel(/^builds?$/i), banners: byLabel(/banners?/i) };
      if (!stats.length && nums.length) { const elo = nums.find(x => /^\d{3,4}$/.test(x)); n.elo = elo || null; const after = nums.filter(x => x !== elo); n.battles = after[0] || null; n.builds = after[1] || null; }
      if (!n.win && !n.hold && pcts[0]) n.win = pcts[0];
      if (n.elo) row.elo = +String(n.elo).replace(/,/g, ""); row.battles = n.battles; row.builds = n.builds; if (n.hold) { row.hold = n.hold; if (!byLabel(/^win/i)) row.win = null; } if (n.banners) row.banners = n.banners;
      return row;
    });
    rows.forEach((r, i) => { if (r.rank == null) { r.rank = i + 1; r.rankGuess = true; } });
    const first = W.leaves.slice(0, 500).filter(l => !l.img).map(l => l.t), ttl = clean(doc.title);
    const sideHint = [ttl].concat(controls(doc).active, meta(doc).h1).join(" | ");
    return Object.assign(meta(doc), { rows, side: /defen[cs]e/i.test(sideHint) || /hold/i.test(statCols.join(" ")) ? "defence" : /offen[cs]e/i.test(sideHint) ? "offence" : null,
      season: (/\bSeason\s*(\d+)/i.exec(ttl + " " + first.slice(0, 120).join(" ")) || [])[1] || null,
      seasonText: (/\bSeason\s*\d+/i.exec(ttl) || [])[0] || first.find(t => /\bSeason\s*\d+/i.test(t)) || null,
      statusText: first.find(t => /\b(in progress|live|final|complete|concluded|ended)\b/i.test(t) && t.length < 80) || null,
      battlesText: first.find(t => /battles/i.test(t) && /\d/.test(t) && t.length < 120) || null, colHeaders, statCols, groupedBy: best.k,
      defenceLinks: Array.from(doc.querySelectorAll("a[href]")).map(a => a.getAttribute("href")).filter(h => h && /defen[cs]e/i.test(h)).filter((t, i, a) => a.indexOf(t) === i).slice(0, 6),
      controls: controls(doc), tables: tables(doc), json: embedded(doc) }, capText(W, rows.length));
  }

  function datacrons(doc) {
    const W = walk(doc.body || doc);
    const SEC = headerLeaves(W, /^(active|expired|current|upcoming|past|live|retired)(\s+(sets?|datacrons?))?$/i, 2);
    const isX = l => !l.img && EXPIRE.test(l.t);
    let rows = group(W, isX, { maxN: 60, hdrFlag: SEC.flag });
    if (!rows.length) rows = group(W, l => !l.img && ENDS.test(l.t), { maxN: 60, hdrFlag: SEC.flag });
    const out = rows.map(it => {
      const L = it.leaves.filter(l => !l.img), x = L.find(l => EXPIRE.test(l.t) || ENDS.test(l.t)), xi = L.indexOf(x);
      let exp = x ? x.t : null; if (exp && !/\d/.test(exp) && L[xi + 1]) exp += " " + L[xi + 1].t;
      const txt = L.map(l => l.t).join(" "), sec = hdrBefore(SEC.hdrs, it.a);
      const name = (L.find(l => l !== x && l.t.length > 2 && !/expir|focused|^set\s*#?\d+$|^(active|expired|new|live|current)$|^\d+$|^ends?\b/i.test(l.t)) || {}).t || null;
      return { name, setNo: +((/\bSet\s*#?(\d+)/i.exec(txt + " " + classStr(it.el)) || [])[1]) || null, focused: /focused/i.test(txt + " " + classStr(it.el)), expiresText: exp,
        expired: /\bexpired\b/i.test(exp || "") || /expired|past|retired/i.test(sec || ""), section: sec, alts: it.leaves.filter(l => l.img).map(l => l.t).slice(0, 20),
        leaves: L.map(l => l.t).slice(0, 30), iso: isoIn(it.el) };
    });
    return Object.assign(meta(doc), { rows: out, sections: SEC.hdrs.map(h => h.t), tables: tables(doc), json: embedded(doc) }, capText(W, out.length));
  }

  function raid(doc) {
    const W = walk(doc.body || doc), all = W.leaves.filter(l => !l.img).map(l => l.t), tb = tables(doc);
    const facts = []; all.slice(0, 800).forEach((t, i) => { if (facts.length < 40 && t.length < 200 && /\b(UPCOMING|LIVE|RAID|allowed units|out now|release|target|expected|in development|coming soon|community update|max score|tiers?|attempts?|status|rewards?)\b/i.test(t) && !facts.some(f => f.t === t)) facts.push({ t, next: (all[i + 1] || "").slice(0, 160) }); });
    const au = all.findIndex(t => /allowed units/i.test(t));
    let tiers = []; tb.forEach(t => t.rows.forEach(r => { if (/^(T\d+|Tier\s*\d+)/i.test(r[0] || "")) tiers.push(r); }));
    if (!tiers.length) tiers = group(W, l => !l.img && /^(T\d+|Tier\s*\d+)$/i.test(l.t), { maxN: 14 }).map(it => it.leaves.filter(l => !l.img).map(l => l.t));
    const rel = all.find(t => /\b(release|target|expected|coming|launch)\b/i.test(t) && /\b(20\d\d|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|q[1-4]|soon|tbd|no date)\b/i.test(t) && t.length < 200) || null;
    return Object.assign(meta(doc), { rows: tiers, facts, banner: all.slice(0, 80).filter(t => /\b(UPCOMING|LIVE|RAID|20\d\d)\b/i.test(t) && t.length < 80).slice(0, 6),
      allowedUnits: au >= 0 ? all.slice(au, au + 2).join(" ") : (all.find(t => /allowed units/i.test(t)) || null), releaseText: rel, tables: tb, json: embedded(doc) }, capText(W, tiers.length));
  }
  const EXTRACT = { schedule, tierGac: tierList, tierGacDef: tierList, tier3v3: tierList, tier3v3Def: tierList, tierFleet: tierList, datacrons, raid };
  const pageKeyFor = (pathname, search) => {
    const p = pathname.replace(/\/?$/, "/"), def = /side=defen[cs]e|defen[cs]e/i.test(search || "") || /\/defen[cs]e\/$/i.test(p);
    if (/^\/schedule\//.test(p)) return "schedule"; if (/^\/tier-list\/gac\//.test(p)) return def ? "tierGacDef" : "tierGac";
    if (/^\/tier-list\/3v3\//.test(p)) return def ? "tier3v3Def" : "tier3v3"; if (/^\/tier-list\/fleet\//.test(p)) return "tierFleet";
    if (/^\/datacrons\//.test(p)) return "datacrons"; if (/^\/raids\//.test(p)) return "raid"; return null;
  };

  /* ---------- 4. store for live mode (sessionStorage = per tab, localStorage = across tabs; both are written and merged) ---------- */
  const readStore = () => { const o = { pages: {}, manifest: {} }; [sessionStorage, localStorage].forEach(st => { try { const j = JSON.parse(st.getItem(STORE_KEY) || "null"); if (j && j.pages) for (const k in j.pages) if (!o.pages[k] || (j.pages[k].at || 0) > (o.pages[k].at || 0)) { o.pages[k] = j.pages[k]; o.manifest[k] = (j.manifest || {})[k]; } } catch (e) {} }); return o; };
  const writeStore = o => { let ok = false; [sessionStorage, localStorage].forEach(st => { try { st.setItem(STORE_KEY, JSON.stringify(o)); ok = true; } catch (e) {} }); self.__holotableCaptureStore = o; return ok; };
  const clearStore = () => [sessionStorage, localStorage].forEach(st => { try { st.removeItem(STORE_KEY); } catch (e) {} });

  if (CONFIG.mode === "live") {
    const key = CONFIG.liveKey || pageKeyFor(location.pathname, location.search);
    if (!key) return finish("live: this tab is not one of the capture pages (schedule, tier-list gac/3v3/fleet, datacrons, raids)", "live-unknown-page");
    let clicked = 0;
    if (CONFIG.expand) { for (let round = 0; round < 3; round++) { const btns = Array.from(document.querySelectorAll("button,[role=button]")).filter(b => /^(show|view|load|see)\s+(all|more)\b|^expand\b|\bhidden\b/i.test(clean(b.textContent)) && b.offsetParent !== null); if (!btns.length) break; btns.slice(0, 20).forEach(b => { try { b.click(); clicked++; } catch (e) {} }); await sleep(400); } }
    const page = EXTRACT[key](document, location.pathname + location.search);
    page.path = location.pathname + location.search; page.source = "live"; page.at = Date.now();
    const st = readStore(); st.pages[key] = page; st.manifest[key] = { ok: true, rows: page.rows.length, source: "live", at: page.at, expanded: clicked, notes: page.textTruncated ? ["text truncated"] : [] };
    const saved = writeStore(st);
    const have = Object.keys(st.pages).map(k => k + " " + st.pages[k].rows.length).join(", ");
    return finish("live " + key + ": " + page.rows.length + " rows" + (clicked ? " (" + clicked + " expand clicks)" : "") + (saved ? " stored" : " STORE FAILED") + " | store has: " + have + " | next: other pages with mode live, then mode flush", "live");
  }

  /* ---------- 5. mode all / flush: APIs, pages, file ---------- */
  const at = Date.now();
  const out = { type: "holotable-pull", v: 1, at, accounts: {}, gac: {}, captureVersion: 1, capturedAt: new Date(at).toISOString(), mode: CONFIG.mode,
    tz: (Intl.DateTimeFormat().resolvedOptions() || {}).timeZone || null, page: location.pathname + location.search, pages: {}, manifest: { accounts: {}, gac: {}, pages: {}, issues: [] } };
  const issues = out.manifest.issues, acctBits = [], gacBits = [], pageBits = [];
  const codeOf = k => String(CONFIG.accounts[k]).replace(/\D/g, "");

  if (CONFIG.apis) for (const k in CONFIG.accounts) {
    const r = await get("/api/player/" + codeOf(k) + "/", true), m = { ok: r.ok, status: r.status, bytes: r.bytes, notes: r.notes };
    if (r.ok && r.data && r.data.data) { out.accounts[k] = r.data; m.gp = r.data.data.galactic_power; m.lastUpdated = r.data.data.last_updated; m.units = (r.data.units || []).length; m.mods = (r.data.mods || []).length; m.datacrons = (r.data.datacrons || []).length; }
    else { m.ok = false; if (!m.notes.length) m.notes.push("no data"); issues.push(k + " player " + (r.status || m.notes[0])); }
    out.manifest.accounts[k] = m; acctBits.push(k + (m.ok ? " ok " + (m.gp / 1e6).toFixed(2) + "M" : " FAIL " + (r.status || m.notes[0]))); S.progress.push("player " + k + " " + (m.ok ? "ok" : "fail"));
  }

  /* HTML pages: fetch -> DOMParser -> extract; the live tab wins when it is that page and fetch gave 0 rows; iframe render as last resort */
  async function viaIframe(path, fn) {
    return new Promise(res => {
      const f = document.createElement("iframe"); f.style.cssText = "position:fixed;left:-9999px;top:0;width:1280px;height:900px;opacity:0;pointer-events:none"; let fin = false;
      const end = v => { if (fin) return; fin = true; clearTimeout(tm); try { f.remove(); } catch (e) {} res(v); };
      const tm = setTimeout(() => { try { const d = f.contentDocument; if (d && d.body) return end({ page: fn(d, path), title: d.title, late: true }); } catch (e) {} end({ err: "iframe timeout" }); }, CONFIG.iframeMs);
      f.onload = () => setTimeout(() => { try { const d = f.contentDocument; if (!d || !d.body) return end({ err: "no iframe document" }); if (isCf(d.title, d)) return end({ err: "iframe got the Cloudflare page" }); end({ page: fn(d, path), title: d.title }); } catch (e) { end({ err: "iframe: " + String(e.message || e).slice(0, 60) }); } }, 2500);
      f.onerror = () => end({ err: "iframe error" }); f.src = path; document.body.appendChild(f);
    });
  }
  const samePath = (a, b) => a.split("?")[0].replace(/\/?$/, "/") === b.split("?")[0].replace(/\/?$/, "/");
  const sameQuery = (a, b) => (a.split("?")[1] || "") === (b.split("?")[1] || "");
  const sig = p => (p && p.rows || []).slice(0, 8).map(r => (r.units || []).join("+") + "|" + (r.win || "")).join(";");
  async function capturePage(k, path, fn, m) {
    let page = null;
    try {
      const r = await get(path, false); m.status = r.status; m.bytes = r.bytes; m.notes = m.notes.concat(r.notes);
      if (r.ok) { const doc = new DOMParser().parseFromString(r.text, "text/html"); page = fn(doc, path); m.ok = true; m.rows = page.rows.length; m.title = page.title; }
    } catch (e) { m.notes.push("extract: " + String(e && e.message || e).slice(0, 80)); }
    if (samePath(location.pathname, path) && sameQuery(location.pathname + location.search, path)) {
      try { const lp = fn(document, path); m.live = { rows: lp.rows.length }; m.notes.push("live tab " + lp.rows.length + " rows vs fetched " + m.rows);
        if (!m.rows && lp.rows.length) { page = lp; m.ok = true; m.rows = lp.rows.length; m.source = "live"; } } catch (e) { m.notes.push("live: " + String(e.message || e).slice(0, 60)); }
    }
    if (!m.rows && CONFIG.iframe && timeLeft() > CONFIG.iframeMs + 10000) {
      const f = await viaIframe(path, fn);
      if (f.page && f.page.rows.length) { page = f.page; m.ok = true; m.rows = f.page.rows.length; m.source = "iframe"; m.notes.push("rows came from a rendered iframe (page is client-rendered; fetch gave 0)"); }
      else m.notes.push(f.err || "iframe rendered 0 rows" + (f.title ? " (" + f.title.slice(0, 40) + ")" : ""));
    }
    if (page) { page.path = path; page.source = m.source; page.at = Date.now(); }
    return page;
  }
  const label = k => k.replace("tierGacDef", "5v5def").replace("tierGac", "5v5").replace("tier3v3Def", "3v3def").replace("tier3v3", "3v3").replace("tierFleet", "fleet").replace("datacrons", "dcron");
  const stored = CONFIG.mode === "flush" ? readStore() : { pages: {}, manifest: {} };
  for (const k of Object.keys(CONFIG.pages)) {
    const fn = EXTRACT[k] || schedule, m = { ok: false, status: 0, bytes: 0, rows: 0, notes: [], source: "fetch" };
    let path = CONFIG.pages[k], page = null;
    if (stored.pages[k]) {   /* flush: a page captured live in this tab (or another tab of this origin) wins */
      page = stored.pages[k]; m.ok = true; m.rows = page.rows.length; m.source = "live-store"; m.notes.push("from live store"); path = page.path;
    } else if (/Def$/.test(k)) {
      /* defence boards: discover the link from the offence page already captured, then try candidates until one looks like a defence board */
      const offKey = k.replace(/Def$/, ""), off = out.pages[offKey], base = CONFIG.pages[offKey] || "/tier-list/" + (offKey === "tierGac" ? "gac" : "3v3") + "/";
      const cands = []; const add = p => { if (p && !cands.includes(p)) cands.push(p); };
      if (path) add(path);
      (off && off.defenceLinks || []).forEach(h => { try { const u = new URL(h, location.origin + base); if (u.origin === location.origin) add(u.pathname + u.search); } catch (e) {} });
      add(base + "?side=defense"); add(base + "?side=defence"); add(base + "?mode=defense"); add(base + "defense/");
      m.tried = []; m.discovered = false;
      for (const c of cands.slice(0, 5)) {
        if (timeLeft() < 20000) { m.notes.push("no time left for more defence candidates"); break; }
        const mm = { ok: false, status: 0, bytes: 0, rows: 0, notes: [], source: "fetch" }, p = await capturePage(k, c, fn, mm);
        const looks = p && p.rows.length && (p.side === "defence" || (off && sig(p) !== sig(off)));
        m.tried.push({ path: c, status: mm.status, rows: mm.rows, side: p ? p.side : null, sameAsOffence: !!(p && off && sig(p) === sig(off)) });
        if (looks) { page = p; path = c; Object.assign(m, mm, { tried: m.tried, discovered: true }); break; }
        if (!page && p && p.rows.length) { page = p; path = c; Object.assign(m, mm, { tried: m.tried }); m.notes.push("rows parsed but the board does not look like a defence board (same rows as offence?)"); }
        else if (!page && p) { Object.assign(m, mm, { tried: m.tried }); }
        await sleep(CONFIG.pauseMs);
      }
      if (page && !m.discovered) issues.push(k + " may be the offence board (no hold%/defence marker)");
    } else {
      page = await capturePage(k, path, fn, m);
    }
    if (page) { out.pages[k] = page; if (page.json && page.json.length) m.notes.push("embedded json x" + page.json.length); if (page.textTruncated) m.notes.push("text truncated"); if (!page.rows.length) m.notes.push("0 rows: plain-text fallback kept (" + page.text.length + " chars)"); }
    m.path = path;
    if (!m.ok) issues.push(k + " " + (m.status || m.notes[0] || "fail")); else if (!m.rows) issues.push(k + " 0 rows (text only)");
    out.manifest.pages[k] = m; pageBits.push(label(k) + " " + (m.ok ? m.rows + (m.source !== "fetch" ? "*" : "") : "FAIL")); S.progress.push("page " + k + " " + m.rows);
    await sleep(CONFIG.pauseMs);
  }

  /* GAC brackets last: the opponent rosters are the biggest and least critical part, so they get whatever time is left */
  if (CONFIG.apis) for (const k in CONFIG.accounts) {
    const code = codeOf(k), r = await get("/api/v2/gac/brackets/recent/" + code + "/", true), m = { ok: r.ok, status: r.status, bytes: r.bytes, notes: r.notes, players: 0, failedPlayers: 0 };
    if (r.ok && r.data) {
      const j = r.data; let B = j.data;
      B = Array.isArray(B) ? B.filter(x => x && (x.bracketPlayers || []).some(p => String(p.allyCode) === code)).sort((x, y) => x.startTime < y.startTime ? 1 : -1)[0] || B[0] : B && B.bracketPlayers ? B : j;
      m.brackets = Array.isArray(j.data) ? j.data.length : B ? 1 : 0;
      if (B) { m.bracketId = B.bracketId || B.id || null; m.start = B.startTime || B.start_time || null; m.season = B.seasonNumber || B.season || B.season_number || B.seasonId || B.season_id || null; m.week = B.weekNumber || B.week || null; m.size = (B.bracketPlayers || []).length; }
      const q = {};
      if (CONFIG.gacPlayers && B && timeLeft() > 25000) {
        const others = (B.bracketPlayers || []).map(p => String(p.allyCode || "").replace(/\D/g, "")).filter(c => c && !Object.keys(CONFIG.accounts).map(codeOf).includes(c));
        for (let i = 0; i < others.length; i += CONFIG.gacConcurrency) {
          if (timeLeft() < 15000) { m.notes.push("opponents cut short (time)"); break; }
          await Promise.all(others.slice(i, i + CONFIG.gacConcurrency).map(async c => { const x = await get("/api/player/" + c + "/", true); if (x.ok && x.data) { q[c] = x.data; m.players++; } else m.failedPlayers++; }));
        }
      } else if (CONFIG.gacPlayers && B) m.notes.push("opponents skipped (time)");
      out.gac[k] = { bracket: j, players: q };
    } else { if (!m.notes.length) m.notes.push("no data"); issues.push(k + " gac " + (r.status || m.notes[0])); }
    out.manifest.gac[k] = m;
    gacBits.push(k + (m.ok ? (m.season ? " S" + ((/(\d+)\D*$/.exec(String(m.season)) || [])[1] || m.season) : "") + (m.week ? "w" + m.week : "") + " " + m.players + "/" + Math.max(0, (m.size || 1) - 1) + " opp" : " FAIL " + (r.status || m.notes[0])));
    S.progress.push("gac " + k + " " + (m.ok ? "ok" : "fail"));
  }
  out.manifest.ms = Date.now() - T0; S.out = out;   /* inspectable in DevTools: __holotableCapture.out.pages.schedule.rows */

  /* ---------- 6. save ---------- */
  const d = new Date(), p2 = n => String(n).padStart(2, "0"), stem = "holotable-capture-" + d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()) + "-" + p2(d.getHours()) + p2(d.getMinutes());
  let name = stem + ".json", blob = new Blob([JSON.stringify(out)], { type: "application/json" }), kb = 0, dl = "no-download";
  try {
    if (self.CompressionStream) { blob = await new Response(blob.stream().pipeThrough(new CompressionStream("gzip"))).blob(); name += ".gz"; }
    kb = Math.round(blob.size / 1024); S.name = name; S.blob = blob; S.manifest = out.manifest;
    const url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = name; a.style.display = "none"; document.body.appendChild(a);
    S.save = () => { a.click(); return name; };
    if (CONFIG.download) { a.click(); dl = "saved"; }
    if (CONFIG.mode === "flush" && CONFIG.clearStore) clearStore();
    if (CONFIG.toast) { const t = document.createElement("div"); t.style.cssText = "position:fixed;z-index:99999;inset:auto 9px 9px;padding:12px;border-radius:9px;background:#123;color:#fff;font:15px/1.4 system-ui";
      t.textContent = "Holotable capture: saved " + name + " (" + kb + " KB). "; const b = document.createElement("a"); b.href = url; b.download = name; b.textContent = "Save again"; b.style.color = "#8cf"; t.append(b);
      t.onclick = e => { if (e.target === t) t.remove(); }; document.body.append(t); }
  } catch (e) { issues.push("save: " + String(e && e.message || e).slice(0, 60)); dl = "save FAILED"; }
  const sum = stem + " json.gz " + kb + "KB " + dl + " | " + (acctBits.join(", ") || "no apis") + " | " + pageBits.join(", ") + " | gac " + (gacBits.join(", ") || "-") + " | " + (issues.length ? "ISSUES: " + issues.join("; ") : "no issues") + " | " + Math.round(out.manifest.ms / 1000) + "s";
  return finish(sum, issues.length ? "done-with-issues" : "done");
})()
