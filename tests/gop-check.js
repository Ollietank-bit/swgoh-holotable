/* gop-check — GAC Planner › Opponent: bracket pull (bookmarklet `gac` half), compact store (GOP_KEY), opponent snapshot
   file (import / export / merge-newer-wins / garbage refused), picker UI, defence-squad building with auto-filled stats,
   flags + HEURISTIC counter, staleness, per-account separation, escapeHtml, 390/1280 no overflow, SNAPSHOTS consistency,
   the old bookmarklet behaviour unchanged, zero page errors. Fixtures are synthetic and built here in BOTH the raw
   swgoh.gg shapes (/api/player/, /api/v2/gac/brackets/recent/) and the compact shape, so the raw parser is exercised.
   Run WITHOUT SNAP_DATE (the pinned 7 Oct roster fixture is fine; nothing here depends on it). */
const L = require("./lib.js");
const { ck, REAL, PULLS } = L;
const SHOTS = L.path.join(L.ROOT, "shots");
try { L.fs.mkdirSync(SHOTS, { recursive: true }); } catch (e) {}
const CODES = { ollie: "229917529", tiny: "295352286" };
const BASE = `http://127.0.0.1:${L.PORT}`;
const T = (y, m0, d, h) => new Date(y, m0, d, h || 12, 0, 0).getTime();
const NOW = T(2026, 9, 16, 12);   /* Fri 16 Oct 2026 12:00 local — inside Season 84 Event 2 (14–21 Oct) */

/* ---------- raw swgoh.gg shapes (synthetic) ---------- */
function rawUnit(id, name, o) {
  o = o || {};
  const relic = o.r == null ? 0 : o.r;
  const ab = [];
  for (let i = 0; i < (o.z || 0); i++) ab.push({ id: `${id.toLowerCase()}_z${i}`, name: `${name} zeta ${i + 1}`, has_zeta_learned: true, is_zeta: true });
  (o.o || []).forEach((n, i) => ab.push({ id: `${id.toLowerCase()}_o${i}`, name: n, has_omicron_learned: true, is_omicron: true }));
  return { data: { base_id: id, name, rarity: o.s == null ? 7 : o.s, gear_level: o.g == null ? 13 : o.g, relic_tier: relic ? relic + 2 : 1, power: o.p || 30000,
    combat_type: o.ship ? 2 : 1, stats: o.ship ? {} : { "1": 60000, "5": o.sp == null ? 250 : o.sp, "17": 0.5 },
    zeta_abilities: ab.filter(a => a.is_zeta).map(a => a.id), omicron_abilities: ab.filter(a => a.is_omicron).map(a => a.id), ability_data: ab, mod_set_ids: [4, 4, 4, 4, 5, 5] } };
}
function rawMods(char, n6, spd, speedSet, arrow) {
  const out = [];
  for (let i = 0; i < 6; i++) out.push({ id: `${char}-m${i}`, character: char, set: speedSet ? 4 : 1, slot: 2 + i, rarity: i < n6 ? 6 : 5, tier: 5, level: 15, reroll_count: 0,
    primary_stat: { name: 2 + i === 3 && arrow ? "Speed" : "Offense", stat_id: 2 + i === 3 && arrow ? 5 : 6, value: 3000, display_value: "+30" },
    secondary_stats: [{ name: "Speed", stat_id: 5, roll: 3, value: Math.round(spd / 6) * 100, display_value: String(Math.round(spd / 6)) }, { name: "Health", stat_id: 1, roll: 1, value: 400, display_value: "400" }] });
  return out;
}
/* A player: `units` is a list of [id, name, opts]; `extraN` pads anonymous filler characters to a realistic roster size. */
function rawPlayer(code, name, o) {
  o = o || {};
  const units = (o.units || []).map(([id, n, x]) => rawUnit(id, n, x));
  for (let i = 0; i < (o.extraN || 0); i++) units.push(rawUnit(`FILLER_UNIT_${i}`, `Filler Unit ${i}`, { s: 7, g: 12, r: i % 4, sp: 180 + (i % 60), z: i % 3, p: 20000 + i * 10 }));
  for (let i = 0; i < (o.shipN || 0); i++) units.push(rawUnit(`FILLER_SHIP_${i}`, `Filler Ship ${i}`, { ship: true, s: 7, p: 40000 }));
  const mods = [];
  (o.mods || []).forEach(([char, n6, spd, set, arrow]) => mods.push(...rawMods(char, n6, spd, set, arrow)));
  return { data: { ally_code: +code, name, galactic_power: o.gp || 7000000, character_galactic_power: 4000000, ship_galactic_power: 3000000, guild_name: o.guild || "Synthetic Guild",
      league_name: "Carbonite", division_number: 5, skill_rating: o.sr || 1400, last_updated: o.lu || "2026-10-16T01:00:00", arena: { rank: 50 }, fleet_arena: { rank: 20 } },
    units, mods, datacrons: o.dc || [] };
}
const OPP = {
  slkr: { code: "111111111", name: "Kylo Fan", gp: 7900000, guild: "First Order Guild", sr: 1510, lu: "2026-10-16T01:00:00",
    units: [["SUPREMELEADERKYLOREN", "Supreme Leader Kylo Ren", { r: 9, sp: 331, z: 3, o: ["Our Loss Is Their Loss"], p: 48000 }], ["KYLORENUNMASKED", "Kylo Ren (Unmasked)", { r: 7, sp: 290, z: 2 }],
      ["GENERALHUX", "General Hux", { r: 5, sp: 275, z: 1 }], ["FOSITHTROOPER", "Sith Trooper", { r: 5, sp: 230 }], ["REYDARKVISION", "Rey (Dark Side Vision)", { r: 7, sp: 300, z: 1 }],
      ["GLREY", "Rey", { r: 8, sp: 320, z: 3 }], ["BENSOLO", "Ben Solo", { r: 5, sp: 260 }], ["CAPITALEXECUTOR", "Executor", { ship: true, p: 80000 }], ["RAZORCREST", "Razor Crest", { ship: true }]],
    mods: [["SUPREMELEADERKYLOREN", 6, 96, true, true], ["KYLORENUNMASKED", 5, 60, false, true], ["GENERALHUX", 4, 48, true, false]],
    dc: [{ id: "dc1", tier: 9, set_id: 33, tiers: [{ ability_description: null, scope_target_name: "Speed", stat_value: 0.0728 }, { ability_description: "First Order allies gain…", scope_target_name: "First Order", stat_value: null }, { ability_description: "Kylo Ren (Unmasked): …", scope_target_name: "Kylo Ren (Unmasked)", stat_value: null }] }],
    extraN: 190, shipN: 20 },
  evil: { code: "222222222", name: "<img src=x onerror=window.__pwned=1>", gp: 7500000, guild: "<b>Guild</b>", sr: 1450, lu: "2026-10-13T01:00:00",
    units: [["GLREY", "Rey", { r: 7, sp: 310, z: 3 }], ["EVILUNIT", "<svg onload=window.__pwned=2>", { r: 5, sp: 200 }], ["LORDVADER", "Lord Vader", { r: 8, sp: 305 }]], extraN: 40, shipN: 5 },
  weak: { code: "333333333", name: "Bench Warmer", gp: 6100000, guild: "Small Guild", sr: 1300, lu: "2026-10-15T20:00:00",
    units: [["JANGOFETT", "Jango Fett", { r: 5, sp: 280, z: 2 }], ["ZAMWESELL", "Zam Wesell", { r: 3, sp: 240 }], ["BOSSK", "Bossk", { r: 3, sp: 200 }], ["DATHCHA", "Dathcha", { s: 5, g: 9, r: 0, sp: 150 }]], extraN: 40, shipN: 5 }
};
function rawBracket(ownCode, startTime, codes) {
  const players = [{ allyCode: +ownCode, playerName: ownCode === CODES.ollie ? "Ollietank" : "Tiny", playerPower: 8183401, guildName: "Our Guild", bracketRank: 2, score: 1200 }];
  codes.forEach((c, i) => players.push({ allyCode: +c.code, playerName: c.name, playerPower: c.gp, guildName: c.guild, bracketRank: i + 1 === 2 ? 1 : i + 3, score: 1500 - i * 100 }));
  return { bracketId: 9320, league: "CARBONITE", season: 84, week: 2, startTime, bracketPlayers: players };
}
const RAW_OPPS = { [OPP.slkr.code]: rawPlayer(OPP.slkr.code, OPP.slkr.name, OPP.slkr), [OPP.evil.code]: rawPlayer(OPP.evil.code, OPP.evil.name, OPP.evil), [OPP.weak.code]: rawPlayer(OPP.weak.code, OPP.weak.name, OPP.weak) };
const BRACKET = rawBracket(CODES.ollie, "2026-10-14T21:00:00", [OPP.slkr, OPP.evil, OPP.weak, { code: "444444444", name: "Unscouted Guy", gp: 7000000, guild: "G4" }]);
const GAC = { ollie: { bracket: BRACKET, players: RAW_OPPS } };
/* the owner's own raw roster (so gopReceive can add a "you" entry), same builder pbm-check uses — minimal here */
const MY_RAW = { ollie: { data: { ally_code: +CODES.ollie, name: "Ollietank", galactic_power: 8183401, league_name: "Carbonite", division_number: 5, skill_rating: 1500, last_updated: "2026-10-16T02:00:00" }, units: [rawUnit("GLREY", "Rey", { r: 8, sp: 318, z: 3 })], mods: [], datacrons: [] } };

/* Like pbm-check's openX: optional pinned clock, no network. */
async function openX(b, o) {
  o = o || {};
  const ctx = await b.newContext({ viewport: { width: o.width || 1280, height: o.height || 1000 } });
  await ctx.addInitScript(([s, pl, seedKey, pin]) => {
    if (pin) { const real = Date.now.bind(Date), s0 = real(); Date.now = () => pin + (real() - s0); }
    try { if (!sessionStorage.getItem(seedKey)) { localStorage.clear(); localStorage.setItem("swgoh-tracker", s); localStorage.setItem("swgoh-holotable-pulls-v1", pl); sessionStorage.setItem(seedKey, "1"); } } catch (e) {}
  }, [o.state || REAL, PULLS, "seeded-" + (o.tag || "x"), o.pin === undefined ? NOW : o.pin]);
  await ctx.route(/fonts\.g|swgoh\.gg|swgohrote\.com|corsproxy|allorigins|codetabs|api\.github/, r => r.abort());
  const errs = [];
  ctx.on("page", pg => { pg.on("pageerror", e => errs.push(String(e).slice(0, 300)));
    pg.on("console", m => { if (m.type() === "error" && !/Failed to load resource|net::ERR|fonts\.g/.test(m.text())) errs.push("console: " + m.text().slice(0, 200)); }); });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/x.html`, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(o.settle || 900);
  return { ctx, p, errs };
}
/* seed the opponent store in-page through the real raw parser, then open GAC › Opponent for `acct` */
async function seed(p, acct, gac, my) {
  return p.evaluate(([acct, gac, my]) => { gopClear(); const g = gopReceive(gac, Date.now(), my || null); const r = g ? gopImportParsed(g) : null; switchAcct(acct); switchTab("gac"); sectionView("gac", "opponent"); return { g: g && { playerN: g.playerN, badN: g.badN, brackets: Object.keys(g.brackets) }, r }; }, [acct, gac, my || null]);
}
const card = p => p.evaluate(() => { const c = document.querySelector('#gacGrid .card[data-card="gop"]'); return c ? { txt: c.textContent, html: c.innerHTML } : null; });

(async () => {
  const srv = await L.serve(); const b = await L.chromium.launch({ headless: true });
  const allErrs = [];
  const sec = async fn => { try { await fn(); } catch (e) { ck("section crashed: " + String(e.message || e).split("\n")[0].slice(0, 140), false, ""); } };

  /* ---------- 1. registry, SNAPSHOTS, bookmarklet ---------- */
  await sec(async () => {
    const { ctx, p, errs } = await openX(b, { tag: "reg" });
    await L.go(p, "ollie", "gac");
    const r = await p.evaluate(() => ({
      leads: GOP_DEF_LEADS.map(x => ({ def: x.def, ok: GAC_COUNTERS.some(c => c.def === x.def), names: x.names })),
      snapN: SNAPSHOTS.length, snapOk: SNAPSHOTS.every(s => typeof s.key === "string" && snapISO(s.asOf) && typeof s.halfLife === "number"), snapKeys: new Set(SNAPSHOTS.map(s => s.key)).size,
      fmt: GAC_FORMAT, now: gacFormatNow(), nav: [...document.querySelectorAll("#gacNav button")].map(x => x.textContent),
      href: (document.getElementById("pbmBmLink") || {}).getAttribute ? document.getElementById("pbmBmLink").getAttribute("href") : null
    }));
    ck("GOP_DEF_LEADS: every entry resolves to an existing GAC_COUNTERS row by exact def string", r.leads.length === 15 && r.leads.every(x => x.ok), JSON.stringify(r.leads.filter(x => !x.ok)));
    ck("GOP_DEF_LEADS: exact in-game names, no duplicates across rows", new Set([].concat(...r.leads.map(x => x.names))).size === [].concat(...r.leads.map(x => x.names)).length, "");
    ck("SNAPSHOTS registry unchanged: 24 entries, unique keys, every asOf parses (nothing dated was baked in)", r.snapN === 24 && r.snapOk && r.snapKeys === 24, JSON.stringify([r.snapN, r.snapOk]));
    ck("GAC format is 5v5 for Season 84 (schedule + constant agree)", r.fmt === "5v5" && r.now === "5v5", r.now);
    const code = r.href ? decodeURIComponent(r.href.replace(/^javascript:/, "")) : "";
    let parses = false; try { new Function(code); parses = true; } catch (e) {}
    ck("bookmarklet still valid JS, still posts holotable-pull v1 with the same gate (old behaviour kept)", parses && code.includes("type:'holotable-pull',v:1") && code.includes("'/api/player/'") && code.includes("Accept:'application/json'") && code.includes("e.origin===O") && code.includes("e.source===w"), code.slice(0, 120));
    ck("bookmarklet now also fetches /api/v2/gac/brackets/recent/<code>/ and every bracketPlayer's roster (best effort, own codes skipped) and sends it as `gac`", code.includes("'/api/v2/gac/brackets/recent/'") && code.includes("bracketPlayers") && code.includes("gac:g") && code.includes("Object.values(A).indexOf(c)>=0"), "");
    ck("bookmarklet stays under the 2000-char budget pbm-check enforces", code.length < 2000, String(code.length));
    ck("GAC nav gained an 'Opponent' view between Scout & plan and Defense", r.nav.join("|") === "Scout & plan|Opponent|Defense|Counters|Career totals", r.nav.join("|"));
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 2. raw → compact parser, bracket parser, size budget ---------- */
  await sec(async () => {
    const { ctx, p, errs } = await openX(b, { tag: "parse" });
    const r = await p.evaluate(([raw, br, own]) => {
      const c = gopCompactPlayer(raw, Date.now());
      const b = gopCompactBracket(br, own, Date.now());
      const k = c.units.SUPREMELEADERKYLOREN, hux = c.units.GENERALHUX, ship = c.units.CAPITALEXECUTOR, filler = c.units.FILLER_UNIT_3;
      return { code: c.code, name: c.name, gp: c.gp, guild: c.guild, league: c.league, div: c.div, sr: c.sr, lu: c.lu, zetas: c.zetas, omis: c.omis, dc: c.dc, unitN: Object.keys(c.units).length,
        k, hux, ship, filler, ok: gopPlayerOk(c), size: JSON.stringify(c).length,
        bad: [gopCompactPlayer(null), gopCompactPlayer({ data: {} }), gopCompactPlayer({ data: { ally_code: "abc" }, units: [] }), gopCompactPlayer("x")],
        b, bOk: gopBracketOk(b), bBad: [gopCompactBracket(null, own), gopCompactBracket({ bracketPlayers: [] }, own), gopCompactBracket({ bracketPlayers: [{ playerName: "no code" }] }, own)],
        bAlt: gopCompactBracket({ data: { id: "77", league_name: "KYBER", start_time: 1760475600, players: [{ ally_code: "555555555", name: "Alt Shape", galactic_power: 9e6, guild: "G", rank: 1 }] } }, own) };
    }, [RAW_OPPS[OPP.slkr.code], BRACKET, CODES.ollie]);
    ck("compact player: header fields from data.* (code as digits, name, gp, guild, league, division, SR)", r.code === OPP.slkr.code && r.name === "Kylo Fan" && r.gp === 7900000 && r.guild === "First Order Guild" && r.league === "Carbonite" && r.div === 5 && r.sr === 1510, JSON.stringify([r.code, r.name, r.gp, r.league]));
    ck("compact player: data.last_updated parsed to ms (UTC assumed when no zone), zeta/omicron totals counted", r.lu === Date.UTC(2026, 9, 16, 1) && r.zetas > 10 && r.omis === 1, JSON.stringify([r.lu, r.zetas, r.omis]));
    ck("compact unit: SLKR 7★ R9 (relic_tier 11 → R9) 331 spd 3 zetas, omicron name kept, mods [6 six-dot, +96 spd secondaries, 6 speed-set mods, speed arrow]", r.k && r.k.s === 7 && r.k.g === 13 && r.k.r === 9 && r.k.sp === 331 && r.k.z === 3 && JSON.stringify(r.k.o) === '["Our Loss Is Their Loss"]' && JSON.stringify(r.k.m) === "[6,96,6,1]" && r.k.n === "Supreme Leader Kylo Ren", JSON.stringify(r.k));
    ck("compact unit: Hux mods [4,48,6,0] (no speed arrow); unmodded filler has no `m`; filler keeps s/g/r/sp/p", r.hux && JSON.stringify(r.hux.m) === "[4,48,6,0]" && r.filler && !("m" in r.filler) && r.filler.g === 12 && r.filler.r === 3 && r.filler.sp === 183 && r.filler.p > 0, JSON.stringify([r.hux, r.filler]));
    ck("compact ship: only stars/power + t:'ship' (no gear/relic/speed)", r.ship && r.ship.t === "ship" && r.ship.s === 7 && !("g" in r.ship) && !("sp" in r.ship), JSON.stringify(r.ship));
    ck("compact datacrons: tier, set and the ability-row TARGET names only (stat rows dropped)", JSON.stringify(r.dc) === '[{"t":9,"s":33,"tg":["First Order","Kylo Ren (Unmasked)"]}]', JSON.stringify(r.dc));
    ck("compact player passes its own strict shape check; unusable raws return null (never throw)", r.ok === true && r.bad.every(x => x === null) && r.unitN === 219, JSON.stringify([r.ok, r.bad, r.unitN]));
    ck("one realistic 219-unit opponent compacts to under 30 KB (raw is ~470 KB)", r.size < 30 * 1024, `${r.size} bytes`);
    ck("bracket: id/league/season/week/start + 5 players (code, name, gp, guild, rank, score), own code recorded", r.b && r.b.id === "9320" && r.b.league === "CARBONITE" && r.b.season === 84 && r.b.event === 2 && r.b.start === Date.UTC(2026, 9, 14, 21) && r.b.own === CODES.ollie && r.b.players.length === 5 && r.b.players[1].code === OPP.slkr.code && r.b.players[1].gp === 7900000 && r.b.players[1].score === 1500 && r.bOk === true, JSON.stringify(r.b).slice(0, 300));
    ck("bracket: alternative key spellings (data.{id, league_name, start_time seconds, players[].ally_code}) still parse; junk → null", r.bAlt && r.bAlt.id === "77" && r.bAlt.league === "KYBER" && r.bAlt.start === 1760475600000 && r.bAlt.players[0].code === "555555555" && r.bBad.every(x => x === null), JSON.stringify(r.bAlt));
    /* size budget: 8 opponents × ~200 units (+20 ships) with mods on 30 units each */
    const big = [];
    for (let i = 0; i < 8; i++) {
      const mods = []; for (let j = 0; j < 30; j++) mods.push([`FILLER_UNIT_${j}`, 6, 60 + j, j % 2 === 0, j % 3 === 0]);
      big.push(rawPlayer(String(600000000 + i), `Opponent ${i}`, { extraN: 200, shipN: 20, mods, dc: RAW_OPPS[OPP.slkr.code].datacrons }));
    }
    const sz = await p.evaluate(raws => { const players = {}; raws.forEach(r => { const c = gopCompactPlayer(r, Date.now()); players[c.code] = c; });
      const rawN = raws.reduce((s, r) => s + JSON.stringify(r).length, 0);
      return { compact: JSON.stringify({ v: 1, brackets: {}, players }).length, rawN, n: Object.keys(players).length, units: Object.keys(players["600000000"].units).length }; }, big);
    ck(`size budget: 8 opponents × ${sz.units} units compact to ${Math.round(sz.compact / 1024)} KB — well under 600 KB (raw would be ${Math.round(sz.rawN / 1024)} KB)`, sz.n === 8 && sz.compact < 600 * 1024 && sz.compact < sz.rawN / 4, JSON.stringify(sz));
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 3. snapshot file: validate / import / merge newer wins / export round-trip ---------- */
  await sec(async () => {
    const { ctx, p, errs } = await openX(b, { tag: "snap" });
    const r = await p.evaluate(([gac, my]) => {
      gopClear();
      const g = gopReceive(gac, Date.now(), my);
      const out = { recv: { playerN: g.playerN, badN: g.badN, brackets: Object.keys(g.brackets), hasMe: !!g.players[ACCOUNTS[0].code] } };
      out.imp = gopImportParsed(g);
      const st = gopRead();
      out.stored = { brackets: Object.keys(st.brackets), players: Object.keys(st.players).sort(), key: !!localStorage.getItem(GOP_KEY), inState: JSON.stringify(stateWithoutDeviceLocal(state)).includes("Kylo Fan"), inPulls: (localStorage.getItem("swgoh-holotable-pulls-v1") || "").includes("Kylo Fan"), inTracker: (localStorage.getItem("swgoh-tracker") || "").includes("Kylo Fan") };
      const text = gopSnapshotText(); const snap = JSON.parse(text);
      out.exportShape = { kind: snap.kind, version: snap.version, exportedOk: Number.isFinite(Date.parse(snap.exportedAt)), brackets: Object.keys(snap.brackets), playerN: Object.keys(snap.players).length, kb: Math.round(text.length / 1024) };
      out.valid = gopValidateSnapshot(text).ok;
      /* garbage, never throws */
      const bad = {};
      bad.notJson = gopValidateSnapshot("{nope");
      bad.array = gopValidateSnapshot("[1,2]");
      bad.roster = gopValidateSnapshot(JSON.stringify({ kind: "holotable-roster-snapshot", version: 1 }));
      bad.backup = gopValidateSnapshot(JSON.stringify({ stateVersion: 7 }));
      bad.kind = gopValidateSnapshot(JSON.stringify({ kind: "x", version: 1 }));
      bad.version = gopValidateSnapshot(JSON.stringify(Object.assign({}, snap, { version: 2 })));
      bad.date = gopValidateSnapshot(JSON.stringify(Object.assign({}, snap, { exportedAt: "yesterday" })));
      bad.noBr = gopValidateSnapshot(JSON.stringify(Object.assign({}, snap, { brackets: {} })));
      bad.badBr = gopValidateSnapshot(JSON.stringify(Object.assign({}, snap, { brackets: { [ACCOUNTS[0].code]: { own: ACCOUNTS[0].code, players: "x" } } })));
      bad.keyMismatch = gopValidateSnapshot(JSON.stringify(Object.assign({}, snap, { players: { "999999999": snap.players[Object.keys(snap.players)[0]] } })));
      bad.badUnit = (() => { const s2 = JSON.parse(text); const pl = s2.players["111111111"]; pl.units.SUPREMELEADERKYLOREN.r = 99; return gopValidateSnapshot(JSON.stringify(s2)); })();
      bad.proto = gopValidateSnapshot(JSON.stringify(Object.assign({}, snap, { players: Object.assign({ __proto__x: 1 }, snap.players) })));
      bad.foreign = gopValidateSnapshot(JSON.stringify(Object.assign({}, snap, { brackets: { "888888888": Object.assign({}, snap.brackets[ACCOUNTS[0].code], { own: "888888888" }) } })));
      bad.pad = (() => { const s2 = JSON.parse(text); s2.players["111111111"].junk = "x".repeat(10000); s2.players["111111111"].units.GLREY.junk2 = "y".repeat(5000); s2.players["111111111"].lu += 1; s2.exportedAt = new Date().toISOString(); const v = gopValidateSnapshot(JSON.stringify(s2)); if (v.ok) gopImportParsed(v.parsed); const st = gopRead().players["111111111"]; return { ok: v.ok, msg: "", stripped: !("junk" in st) && !("junk2" in st.units.GLREY) && st.lu === snap.players["111111111"].lu + 1 }; })();
      out.padStripped = bad.pad.stripped;
      out.bad = Object.fromEntries(Object.entries(bad).map(([k, v]) => [k, { ok: v.ok, msg: String(v.msg || "").slice(0, 160) }]));
      /* the junk import above bumped Kylo's lu by 1 ms; restore the baseline text's copy for the merge checks below */
      gopClear(); gopImportParsed(gopValidateSnapshot(text).parsed);
      /* merge: an OLDER copy of Kylo Fan is ignored, a NEWER one replaces, an older bracket is ignored, a newer bracket replaces */
      const older = JSON.parse(text); older.players["111111111"].lu -= 3600e3; older.players["111111111"].name = "Older Kylo"; older.brackets[ACCOUNTS[0].code].start -= 7 * 86400e3; older.brackets[ACCOUNTS[0].code].id = "old";
      const r1 = gopImportText(JSON.stringify(older), "older.json");
      out.afterOlder = { name: gopRead().players["111111111"].name, br: gopRead().brackets[ACCOUNTS[0].code].id, newer: r1.newer, msg: gopUi.msg.slice(0, 120) };
      const newer = JSON.parse(text); newer.players["111111111"].lu += 3600e3; newer.players["111111111"].name = "Newer Kylo"; newer.players["111111111"].units.SUPREMELEADERKYLOREN.sp = 340; newer.brackets[ACCOUNTS[0].code].start += 7 * 86400e3; newer.brackets[ACCOUNTS[0].code].id = "new";
      const r2 = gopImportText(JSON.stringify(newer), "newer.json");
      out.afterNewer = { name: gopRead().players["111111111"].name, sp: gopRead().players["111111111"].units.SUPREMELEADERKYLOREN.sp, br: gopRead().brackets[ACCOUNTS[0].code].id, newer: r2.newer, others: gopRead().players["333333333"].name, msg: gopUi.msg.slice(0, 160) };
      /* a snapshot whose unit list carries junk keys is stripped? (no — refused: strict shape) and the store re-reads clean after a reload */
      gopCache = null; out.reread = { players: Object.keys(gopRead().players).length, name: gopRead().players["111111111"].name };
      /* a corrupted key is ignored, not fatal */
      localStorage.setItem(GOP_KEY, "{broken"); gopCache = null; out.broken = Object.keys(gopRead().brackets).length;
      localStorage.setItem(GOP_KEY, JSON.stringify({ v: 1, brackets: { "229917529": { nope: 1 } }, players: { "111111111": { code: "222222222" } } })); gopCache = null; out.brokenShape = [Object.keys(gopRead().brackets).length, Object.keys(gopRead().players).length];
      return out;
    }, [GAC, MY_RAW]);
    ck("gopReceive: 3 scouted opponents, 0 unreadable, bracket keyed by the owner's ally code, owner's own entry added from the roster half", r.recv.playerN === 3 && r.recv.badN === 0 && JSON.stringify(r.recv.brackets) === `["${CODES.ollie}"]` && r.recv.hasMe, JSON.stringify(r.recv));
    ck("import writes GOP_KEY only — nothing in the synced blob, swgoh-tracker or PULLS_KEY", r.imp.ok && r.stored.key && !r.stored.inState && !r.stored.inPulls && !r.stored.inTracker && r.stored.players.length === 4, JSON.stringify(r.stored));
    ck("export: kind holotable-opponent-snapshot v1 with exportedAt, brackets by own code, 4 players, small (< 120 KB) and re-validates", r.exportShape.kind === "holotable-opponent-snapshot" && r.exportShape.version === 1 && r.exportShape.exportedOk && r.exportShape.playerN === 4 && r.exportShape.kb < 120 && r.valid === true, JSON.stringify(r.exportShape));
    const B = r.bad;
    ck("garbage refused with a reason, never thrown: not JSON / array / wrong kind / wrong version / bad date", !B.notJson.ok && /valid JSON/.test(B.notJson.msg) && !B.array.ok && /array/.test(B.array.msg) && !B.kind.ok && /isn't a Holotable opponent snapshot/.test(B.kind.msg) && !B.version.ok && /format v2/.test(B.version.msg) && !B.date.ok && /exportedAt/.test(B.date.msg), JSON.stringify(B));
    ck("a roster snapshot or a backup is named for what it is and pointed at the right button", !B.roster.ok && /roster snapshot/.test(B.roster.msg) && /Import roster snapshot/.test(B.roster.msg) && !B.backup.ok && /backup/.test(B.backup.msg), JSON.stringify([B.roster, B.backup]));
    ck("shape refused: no bracket / malformed bracket / player key ≠ code / out-of-range relic / foreign account", !B.noBr.ok && /no bracket/.test(B.noBr.msg) && !B.badBr.ok && !B.keyMismatch.ok && !B.badUnit.ok && !B.foreign.ok && /not to an account this app tracks/.test(B.foreign.msg) && B.proto.ok === false, JSON.stringify([B.noBr, B.badBr, B.keyMismatch, B.badUnit, B.foreign]));
    ck("unknown junk fields (player / unit level) are stripped on import — never stored (like rvSnapClean)", r.bad.pad.ok === true && r.padStripped === true, JSON.stringify(r.bad.pad));
    ck("merge: an older copy (earlier swgoh.gg last_updated / earlier bracket start) changes nothing — '0 new or newer'", r.afterOlder.name === "Kylo Fan" && r.afterOlder.br === "9320" && r.afterOlder.newer === 0 && /0 new or newer/.test(r.afterOlder.msg), JSON.stringify(r.afterOlder));
    ck("merge: a newer copy replaces that player and bracket, other players untouched, status says 1 new or newer", r.afterNewer.name === "Newer Kylo" && r.afterNewer.sp === 340 && r.afterNewer.br === "new" && r.afterNewer.newer === 1 && r.afterNewer.others === "Bench Warmer" && /Imported newer\.json/.test(r.afterNewer.msg), JSON.stringify(r.afterNewer));
    ck("store re-reads from localStorage after a cache drop; a corrupt or wrong-shape key reads as empty, not an error", r.reread.players === 4 && r.reread.name === "Newer Kylo" && r.broken === 0 && JSON.stringify(r.brokenShape) === "[0,0]", JSON.stringify([r.reread, r.broken, r.brokenShape]));
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 4. pbm integration: the `gac` half rides the existing confirm → Import ---------- */
  await sec(async () => {
    const { ctx, p, errs } = await openX(b, { tag: "pbm" });
    const r = await p.evaluate(([gac, my]) => {
      gopClear();
      const out = {};
      const K = "swgoh-holotable-pulls-v1";
      const ro = JSON.parse(JSON.stringify(my.ollie)); ro.data.galactic_power = 8183401; ro.data.character_galactic_power = 1; ro.data.ship_galactic_power = 1;
      /* the owner's roster raw must parse: reuse the device's current pull rebuilt as raw */
      const prev = state.pulls.ollie;
      const rawOwn = { data: Object.assign({}, ro.data, { galactic_power: prev.gp }), units: Object.entries(prev.reqs).map(([id, u]) => ({ data: { base_id: id, name: u.name || id, rarity: u.s, gear_level: u.g, relic_tier: u.r ? u.r + 2 : 1, combat_type: u.t === "ship" ? 2 : 1, stats: { "5": 200 } } })), mods: [], datacrons: [] };
      /* 1. no gac → card byte-identical to the classic one */
      pbmReceive({ type: "holotable-pull", v: 1, accounts: { ollie: rawOwn } }); const classic = document.getElementById("pbmConfirm").innerHTML; pbmCancel();
      pbmReceive({ type: "holotable-pull", v: 1, accounts: { ollie: rawOwn }, gac: {} }); out.emptyGacSame = document.getElementById("pbmConfirm").innerHTML === classic; pbmCancel();
      pbmReceive({ type: "holotable-pull", v: 1, accounts: { ollie: rawOwn }, gac: "junk" }); out.junkGacSame = document.getElementById("pbmConfirm").innerHTML === classic; pbmCancel();
      out.classicHasNoGac = !/GAC bracket/.test(classic);
      /* 2. with gac → extra line, nothing written until Import */
      pbmReceive({ type: "holotable-pull", v: 1, accounts: { ollie: rawOwn }, gac });
      out.withGac = document.getElementById("pbmConfirm").textContent;
      out.beforeImport = !localStorage.getItem(GOP_KEY);
      out.imgInCard = !!document.querySelector("#pbmConfirm img");
      const w0 = store.write, writes = []; store.write = function (s, o) { writes.push(o || null); return w0.apply(this, arguments); };
      out.ret = pbmImport(); store.write = w0; out.writes = writes;
      out.afterImport = { key: !!localStorage.getItem(GOP_KEY), players: Object.keys(gopRead().players).length, br: !!gopRead().brackets[ACCOUNTS[0].code], st: document.getElementById("pullStatus").textContent, spOwn: state.pulls.ollie.reqs.GLREY && state.pulls.ollie.reqs.GLREY.sp };
      /* 3. gac-only payload (roster half failed) still offers the bracket */
      gopClear(); pbmReceive({ type: "holotable-pull", v: 1, accounts: {}, gac }); out.gacOnly = { t: document.getElementById("pbmConfirm").textContent, btn: !!document.getElementById("pbmImportBtn") }; pbmImport();
      out.gacOnlyStored = Object.keys(gopRead().players).length;
      /* 4. a hostile gac payload (bracket but unreadable players) */
      gopClear(); pbmReceive({ type: "holotable-pull", v: 1, accounts: {}, gac: { ollie: { bracket: gac.ollie.bracket, players: { "111111111": { data: { ally_code: 999 } }, "222222222": "<script>x</script>" } } } });
      out.hostile = document.getElementById("pbmConfirm").textContent; pbmCancel();
      out.badVersionStill = pbmReceive({ type: "holotable-pull", v: 2, accounts: {}, gac });
      return out;
    }, [GAC, MY_RAW]);
    ck("pbm: a payload without `gac` (old bookmarklet) renders the confirm card byte-identically; `gac:{}` or junk too", r.classicHasNoGac && r.emptyGacSame && r.junkGacSame, JSON.stringify([r.classicHasNoGac, r.emptyGacSame, r.junkGacSame]));
    ck("pbm: with `gac` the card adds '+ GAC bracket for Ollietank: 3 of 4 opponents scouted · bracket 9320 · started Wed 14 Oct', writes nothing before Import, escapes names", /\+ GAC bracket for Ollietank: 3 of 4 opponents scouted · bracket 9320 · started/.test(r.withGac) && /GAC opponent scouting data/.test(r.withGac) && r.beforeImport && !r.imgInCard, r.withGac.slice(0, 260));
    ck("pbm: Import still writes the pull first with { pulls, skipStamp, skipSync }, returns 1, then stores the bracket in GOP_KEY and says so in the status", r.ret === 1 && JSON.stringify(r.writes[0]) === JSON.stringify({ pulls: true, skipStamp: true, skipSync: true }) && r.afterImport.key && r.afterImport.players === 4 && r.afterImport.br && /GAC bracket: 4 players scouted/.test(r.afterImport.st), JSON.stringify(r.afterImport).slice(0, 300));
    ck("pbm: the owner's own units now carry final Speed (`sp`) from stats['5'] after a pull (optional field, validated)", r.afterImport.spOwn === 200, String(r.afterImport.spOwn));
    ck("pbm: a gac-only payload (no roster) still offers 'Import GAC bracket from swgoh.gg' and stores it", /Import GAC bracket from swgoh\.gg/.test(r.gacOnly.t) && r.gacOnly.btn && r.gacOnlyStored === 3, JSON.stringify(r.gacOnly).slice(0, 200));
    ck("pbm: unreadable players are counted, not imported; unknown protocol version still refused", /0 of 4 opponents scouted \(2 unreadable\)/.test(r.hostile) && r.badVersionStill === false, r.hostile.slice(0, 200));
    const pwned = await p.evaluate(() => window.__pwned);
    ck("pbm: no script ran from the hostile payload", pwned === undefined, String(pwned));
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 5. UI at 1280 and 390: bracket list, pick, squads, picker, stats, flags, counter, staleness, escaping ---------- */
  for (const w of [1280, 390]) await sec(async () => {
    const { ctx, p, errs } = await openX(b, { tag: "ui" + w, width: w, height: w === 390 ? 844 : 1000 });
    const s = await seed(p, "ollie", GAC, MY_RAW);
    ck(`[${w}] seeded through the raw parser: 3 opponents + you`, s.g && s.g.playerN === 3 && s.r && s.r.ok, JSON.stringify(s));
    await p.waitForTimeout(250);
    let c = await card(p);
    ck(`[${w}] Opponent view renders the card with the honesty line and the three data buttons`, !!c && /can't see which opponent you were matched with/.test(c.txt) && /Refresh from swgoh\.gg \(bookmarklet\)/.test(c.txt) && /Import opponent snapshot/.test(c.txt) && /Export opponent snapshot/.test(c.txt), c && c.txt.slice(0, 200));
    const list = await p.evaluate(() => ({ rows: [...document.querySelectorAll(".gop-prow")].map(e => ({ me: e.classList.contains("me"), btn: e.tagName === "BUTTON", t: e.textContent })), round: document.querySelector(".gop-round .chip").textContent, img: !!document.querySelector('#gacGrid .card[data-card="gop"] img, #gacGrid .card[data-card="gop"] svg'), head: document.querySelector(".gop-h").textContent }));
    ck(`[${w}] bracket list: 5 rows sorted by rank — 'you' (#2) is a plain row, the 4 opponents are buttons, each with GP, guild, rank, banners`, list.rows.length === 5 && list.rows.filter(r => r.me).length === 1 && !list.rows[1].btn && list.rows[1].me && list.rows.filter(r => !r.me).every(r => r.btn) && /7\.90M GP · First Order Guild · #3 · 1,500 banners/.test(list.rows.find(r => /Kylo Fan/.test(r.t)).t) && /#1 · 1,400 banners/.test(list.rows[0].t), JSON.stringify(list.rows.map(r => r.t.slice(0, 60))));
    ck(`[${w}] scouted / not scouted status per row, data age shown; the un-pulled player reads 'not scouted'`, list.rows.filter(r => /✓ scouted · \d+ units/.test(r.t)).length === 2 && list.rows.filter(r => /⚠ scouted/.test(r.t)).length === 1 && /not scouted/.test(list.rows.find(r => /Unscouted Guy/.test(r.t)).t) && /swgoh\.gg updated/.test(list.rows.find(r => /Kylo Fan/.test(r.t)).t), JSON.stringify(list.rows.map(r => r.t.slice(0, 80))));
    ck(`[${w}] bracket header names bracket 9320 · CARBONITE · season 84 week 2; round chip says 'this round (Season 84 Event 2)' at the pinned 16 Oct clock`, /bracket 9320 · CARBONITE · season 84 week 2/.test(list.head) && /this round \(Season 84 Event 2\)/.test(list.round), list.head + " | " + list.round);
    ck(`[${w}] escapeHtml: the hostile opponent name and guild render as text — no <img>/<svg> element injected`, !list.img && list.rows.some(r => r.t.includes("<img src=x onerror=window.__pwned=1>")) && list.rows.some(r => r.t.includes("<b>Guild</b>")), "");
    let o = await L.overflow(p); ck(`[${w}] no horizontal overflow (bracket list)`, o.doc <= o.inner + 1, JSON.stringify(o));
    await p.evaluate(() => document.querySelector('#gacGrid .card[data-card="gop"]').scrollIntoView({ block: "start" }));
    await p.screenshot({ path: L.path.join(SHOTS, `gop-bracket-${w}.png`), fullPage: false });
    /* pick Kylo Fan */
    await p.click(`.gop-prow:has-text("Kylo Fan")`); await p.waitForTimeout(250);
    const pk = await p.evaluate(() => ({ sel: gopSel("ollie"), views: state.views["gop-ollie"], on: document.querySelector(".gop-prow.on") && document.querySelector(".gop-prow.on").textContent, h: [...document.querySelectorAll(".gop-h")].map(e => e.textContent), age: document.querySelector(".gop-age") && document.querySelector(".gop-age").textContent, dc: document.querySelector(".gop-dc") && document.querySelector(".gop-dc").textContent, cap: document.querySelector(".gop-h2") && document.querySelector(".gop-h2").textContent }));
    ck(`[${w}] picking an opponent persists in state.views['gop-ollie'] (device-local), highlights the row, shows their header line`, pk.sel.opp === OPP.slkr.code && typeof pk.views === "string" && /Kylo Fan/.test(pk.on || "") && pk.h.some(t => /Opponent: Kylo Fan — 7\.90M GP · First Order Guild · Carbonite 5 · 1510 SR/.test(t)), JSON.stringify([pk.sel, pk.on && pk.on.slice(0, 40), pk.h]));
    ck(`[${w}] fresh data: age line without a warning; datacron targets listed; cap reads 0/4 (Carbonite 5v5: 3 squads + 1 fleet)`, pk.age && !/⚠/.test(pk.age) && /swgoh\.gg updated/.test(pk.age) && /Datacrons: T9 set 33 → First Order \/ Kylo Ren \(Unmasked\)/.test(pk.dc || "") && /0\/4 \(Carbonite 5v5: 3 squads \+ 1 fleet\)/.test(pk.cap || ""), JSON.stringify([pk.age, pk.dc, pk.cap]));
    /* add a squad, open picker, search, add leader + 4 */
    await p.click(`.card[data-card="gop"] button:has-text("+ Add defence squad")`); await p.waitForTimeout(250);
    const pick0 = await p.evaluate(() => ({ open: !!document.getElementById("gopQ-ollie"), focused: document.activeElement && document.activeElement.id, n: document.querySelectorAll(".gop-urow").length, first: document.querySelector(".gop-urow") && document.querySelector(".gop-urow").textContent, more: /more — narrow the search/.test(document.getElementById("gopPickList-ollie").textContent) }));
    ck(`[${w}] adding a squad opens the picker with the search box focused; list capped at 40 rows, sorted by power, shows ships too`, pick0.open && pick0.focused === "gopQ-ollie" && pick0.n === 40 && /Executor/.test(pick0.first) && /ship/.test(pick0.first) && pick0.more, JSON.stringify(pick0));
    await p.fill("#gopQ-ollie", "kylo"); await p.waitForTimeout(150);
    const pick1 = await p.evaluate(() => [...document.querySelectorAll(".gop-urow")].map(e => e.textContent));
    ck(`[${w}] search filters by exact-substring name/id: 'kylo' → SLKR + Kylo Ren (Unmasked) only, each with auto-filled stats`, pick1.length === 2 && pick1.every(t => /Kylo/.test(t)) && /7★ · R9 · 331 spd · 3z · 1 omi · mods 6×6● \+96 spd · speed set · spd arrow/.test(pick1.find(t => /Supreme/.test(t))), JSON.stringify(pick1));
    await p.click(`.gop-urow:has-text("Supreme Leader Kylo Ren")`); await p.waitForTimeout(250);
    for (const n of ["Rey (Dark Side Vision)", "Kylo Ren (Unmasked)", "General Hux", "Sith Trooper"]) {
      const open = await p.evaluate(() => !!document.getElementById("gopQ-ollie"));
      if (!open) { await p.click(`.gop-sq[data-gop-squad="0"] .gop-add`); await p.waitForTimeout(200); }
      await p.fill("#gopQ-ollie", n); await p.waitForTimeout(120);
      await p.click(`.gop-urow:has-text("${n}")`); await p.waitForTimeout(200);
    }
    const sq = await p.evaluate(() => { const s = document.querySelector('.gop-sq[data-gop-squad="0"]'); return { sel: gopSel("ollie"), units: [...s.querySelectorAll(".gop-u")].map(e => e.textContent), head: s.querySelector(".gop-sq-head").textContent, add: !!s.querySelector(".gop-add"), picker: !!document.getElementById("gopQ-ollie"), flags: [...s.querySelectorAll(".gop-flag")].map(e => ({ c: e.className, t: e.textContent })), ctr: s.querySelector(".gop-ctr") && s.querySelector(".gop-ctr").textContent, cap: document.querySelector(".gop-h2").textContent, shipRows: 0 }; });
    ck(`[${w}] five units tapped in, leader first with (L) and a GL chip; picker closes at 5/5 and '+ add unit' disappears`, sq.sel.squads.length === 1 && sq.sel.squads[0][0] === "SUPREMELEADERKYLOREN" && sq.sel.squads[0].length === 5 && /\(L\) Supreme Leader Kylo Ren GL/.test(sq.units[0]) && !sq.add && !sq.picker && /5\/5 units/.test(sq.head) && /1\/4/.test(sq.cap), JSON.stringify([sq.sel, sq.units[0], sq.head]));
    ck(`[${w}] auto-filled per unit: stars, relic, speed, zetas, omicron names, mod summary (6-dot count, speed secondaries, speed set, arrow)`, /7★ · R9 · 331 spd · 3z · 1 omi · mods 6×6● \+96 spd · speed set · spd arrow/.test(sq.units[0]) && /omi: Our Loss Is Their Loss/.test(sq.units[0]) && /7★ · R5 · 275 spd · 1z · mods 4×6● \+48 spd · speed set/.test(sq.units.find(t => /Hux/.test(t))) && /7★ · R5 · 230 spd/.test(sq.units.find(t => /Sith Trooper/.test(t))), JSON.stringify(sq.units));
    const F = sq.flags.map(f => f.t).join(" | ");
    ck(`[${w}] flags: GL lead, relic comparison vs your counter, speed, omicron warning (mode caveat), zetas, datacron hit, mods summary`, /Galactic Legend lead \(Supreme Leader Kylo Ren\)/.test(F) && /relic/.test(F) && /speed|fastest/.test(F) && /omicrons on Supreme Leader Kylo Ren — mode not in the data/.test(F) && /7 zetas/.test(F) && /datacron T9 \(set 33\) names Kylo Ren \(Unmasked\)/.test(F) && /mods: 15×6● · \+68 spd\/unit from secondaries · 2 speed sets \(3 of 5 modded in their pull\)/.test(F), F);
    ck(`[${w}] danger flags are red-classed (GL, omicron, datacron)`, sq.flags.filter(f => /danger/.test(f.c)).length >= 3, JSON.stringify(sq.flags.map(f => f.c)));
    ck(`[${w}] counter block is labelled HEURISTIC, names the reference row (SLKR) and its answer (GL Rey), recommends a roster squad with its optimiser status, and quotes the reference why`, /HEURISTIC/.test(sq.ctr) && /Supreme Leader Kylo Ren \(GL\) — reference answer: GL Rey \(Jedi squad\)/.test(sq.ctr) && /→ Use Rey \(GL\) Jedi — (offence #\d|on your defence plan|shares|eligible, below the bench cut)/.test(sq.ctr) && /Why \(reference\):/.test(sq.ctr), sq.ctr && sq.ctr.slice(0, 300));
    ck(`[${w}] relic/speed comparison uses YOUR counter squad from the roster pull (owned count, avg relic, speeds caveat)`, /\(\d\/5 owned · avg R\d\.\d( · fastest \d+| · speeds unknown until your next pull)\)/.test(sq.ctr) && /theirs avg R6\.6|relics even: theirs R6\.6|relic edge/.test(F), F);
    o = await L.overflow(p); ck(`[${w}] no horizontal overflow (squad built)`, o.doc <= o.inner + 1, JSON.stringify(o));
    await p.evaluate(() => document.querySelector('.gop-sq[data-gop-squad="0"]').scrollIntoView({ block: "start" }));
    await p.screenshot({ path: L.path.join(SHOTS, `gop-squad-${w}.png`), fullPage: false });
    await p.evaluate(() => document.querySelector('.gop-sq[data-gop-squad="0"] .gop-flags').scrollIntoView({ block: "start" }));
    await p.screenshot({ path: L.path.join(SHOTS, `gop-counter-${w}.png`), fullPage: false });
    /* second squad: no-reference lead (Ben Solo) → bench fallback; a ship can't join a character squad; fleet squad */
    await p.click(`.card[data-card="gop"] button:has-text("+ Add defence squad")`); await p.waitForTimeout(200);
    await p.fill("#gopQ-ollie", "Ben Solo"); await p.click(`.gop-urow:has-text("Ben Solo")`); await p.waitForTimeout(200);
    const sq2 = await p.evaluate(() => { const s = document.querySelector('.gop-sq[data-gop-squad="1"]'); const ships = [...document.querySelectorAll(".gop-urow")].filter(e => /ship/.test(e.textContent)).length; return { ctr: s.querySelector(".gop-ctr").textContent, head: s.querySelector(".gop-sq-head").textContent, shipsOffered: ships, pickerOpen: !!document.getElementById("gopQ-ollie"), used: [...document.querySelectorAll(".gop-urow")].some(e => /Supreme Leader/.test(e.textContent)) }; });
    ck(`[${w}] a lead with no reference row says so honestly and falls back to the offence bench; already-placed units and ships are not offered for a character squad`, /No reference row for a Ben Solo lead/.test(sq2.ctr) && /Your offence bench, best first: #1/.test(sq2.ctr) && /Ben Solo lead/.test(sq2.head) && sq2.pickerOpen && sq2.shipsOffered === 0 && !sq2.used, JSON.stringify(sq2).slice(0, 300));
    await p.evaluate(() => gopUnitAdd("ollie", 1, "CAPITALEXECUTOR"));
    await p.evaluate(() => gopSquadAdd("ollie")); await p.waitForTimeout(150);
    await p.fill("#gopQ-ollie", "Executor"); await p.click(`.gop-urow:has-text("Executor")`); await p.waitForTimeout(200);
    const fl = await p.evaluate(() => { const s = document.querySelector('.gop-sq[data-gop-squad="2"]'); return { sel: gopSel("ollie").squads, head: s.querySelector(".gop-sq-head").textContent, ctr: s.querySelector(".gop-ctr").textContent, chars: [...document.querySelectorAll(".gop-urow")].filter(e => !/ship/.test(e.textContent)).length }; });
    ck(`[${w}] a ship can't be added to a character squad; a squad led by a capital ship is a fleet (capital tag, 1/8 ships, only ships offered) with the offence plan's fleet as the answer`, fl.sel[1].length === 1 && fl.sel[2][0] === "CAPITALEXECUTOR" && /Fleet/.test(fl.head) && /1\/8 ships/.test(fl.head) && /HEURISTIC/.test(fl.ctr) && /Fleet:/.test(fl.ctr) && /aren't scored/.test(fl.ctr) && fl.chars === 0, JSON.stringify(fl).slice(0, 300));
    /* remove a unit / a squad; cap at 4 */
    await p.evaluate(() => { gopUnitDel("ollie", 0, 4); gopSquadDel("ollie", 1); });
    const rm = await p.evaluate(() => { const s = gopSel("ollie").squads; gopSquadAdd("ollie"); gopSquadAdd("ollie"); gopSquadAdd("ollie"); return { after: s, n: gopSel("ollie").squads.length, btnDisabled: document.querySelector('.card[data-card="gop"] button[onclick^="gopSquadAdd"]').disabled, cap: document.querySelector(".gop-h2").textContent }; });
    ck(`[${w}] remove unit / remove squad work; adding stops at the layout cap (4 for Carbonite 5v5) and the button disables`, rm.after.length === 2 && rm.after[0].length === 4 && rm.n === 4 && rm.btnDisabled && /4\/4/.test(rm.cap), JSON.stringify(rm));
    /* staleness: pick the 3-day-old opponent */
    await p.click(`.gop-prow:has-text("<img src=x")`); await p.waitForTimeout(250);
    const st = await p.evaluate(() => ({ sel: gopSel("ollie"), age: document.querySelector(".gop-age").textContent, stale: document.querySelector(".gop-age").classList.contains("stale"), h: document.querySelector(".gop-sec:nth-of-type(2) .gop-h, .gop-sec .gop-h:not(:first-child)") ? 1 : 0, heads: [...document.querySelectorAll(".gop-h")].map(e => e.textContent), pwned: window.__pwned, img: !!document.querySelector("#gacGrid img, #gacGrid svg") }));
    ck(`[${w}] switching opponent clears the squads (theirs, not carried over); a > 24 h old pull shows the ⚠ staleness warning with the age`, st.sel.opp === OPP.evil.code && st.sel.squads.length === 0 && st.stale && /⚠ swgoh\.gg updated .* \(3 days ago\)/.test(st.age) && /more than 24 h old/.test(st.age), st.age);
    ck(`[${w}] hostile opponent/unit names stay inert in the opponent header and picker (no element, no script)`, st.pwned === undefined && !st.img && st.heads.some(t => t.includes("Opponent: <img src=x onerror=window.__pwned=1>")), JSON.stringify(st.heads));
    await p.evaluate(() => gopSquadAdd("ollie")); await p.fill("#gopQ-ollie", "svg"); await p.waitForTimeout(100);
    const ev = await p.evaluate(() => ({ rows: [...document.querySelectorAll(".gop-urow")].map(e => e.textContent), img: !!document.querySelector("#gacGrid img, #gacGrid svg"), pwned: window.__pwned }));
    ck(`[${w}] a hostile unit name in the picker is text only`, ev.rows.length === 1 && ev.rows[0].includes("<svg onload=window.__pwned=2>") && !ev.img && ev.pwned === undefined, JSON.stringify(ev));
    await p.click(`.gop-urow:has-text("svg onload")`); await p.waitForTimeout(150);
    await p.evaluate(() => document.querySelector(".gop-age").scrollIntoView({ block: "start" }));
    await p.screenshot({ path: L.path.join(SHOTS, `gop-stale-${w}.png`), fullPage: false });
    o = await L.overflow(p); ck(`[${w}] no horizontal overflow (stale opponent + hostile names)`, o.doc <= o.inner + 1, JSON.stringify(o));
    /* per-account separation */
    await L.go(p, "tiny", "gac"); await p.waitForTimeout(200);
    const tiny = await card(p);
    ck(`[${w}] Tiny: own view — no bracket on this device, the set-up steps, and none of Ollie's picks or opponents`, !!tiny && /No GAC bracket on this device for Tiny yet/.test(tiny.txt) && /Desktop Chrome/.test(tiny.txt) && /Phone:/.test(tiny.txt) && !/Kylo Fan/.test(tiny.txt), tiny && tiny.txt.slice(0, 200));
    const tsel = await p.evaluate(() => ({ t: gopSel("tiny"), o: gopSel("ollie").opp, exportDisabled: document.querySelector('.card[data-card="gop"] button[onclick="gopExport()"]').disabled }));
    ck(`[${w}] Tiny has no selection; Ollie's selection survives the switch; Export disabled without a bracket`, tsel.t.opp === "" && tsel.t.squads.length === 0 && tsel.o === OPP.evil.code && tsel.exportDisabled, JSON.stringify(tsel));
    if (w === 390) await p.screenshot({ path: L.path.join(SHOTS, `gop-empty-${w}.png`), fullPage: false });
    o = await L.overflow(p); ck(`[${w}] no horizontal overflow (empty state)`, o.doc <= o.inner + 1, JSON.stringify(o));
    /* Tiny gets a bracket of their own via snapshot import through the real file input */
    const tinyGac = { tiny: { bracket: rawBracket(CODES.tiny, "2026-10-14T21:00:00", [OPP.weak]), players: { [OPP.weak.code]: RAW_OPPS[OPP.weak.code] } } };
    const snapText = await p.evaluate(g => { const r = gopReceive(g, Date.now()); return JSON.stringify({ kind: GOP_SNAP_KIND, version: GOP_SNAP_VERSION, exportedAt: new Date().toISOString(), brackets: r.brackets, players: r.players }); }, tinyGac);
    await p.setInputFiles("#gopSnapFile", { name: "tiny-opps.json", mimeType: "application/json", buffer: Buffer.from(snapText) });
    await p.waitForTimeout(500);
    const ti = await p.evaluate(() => ({ msg: (document.querySelector(".gop-msg") || {}).textContent, rows: document.querySelectorAll(".gop-prow").length, ollieBr: !!gopRead().brackets[ACCOUNTS[0].code], tinyBr: !!gopRead().brackets[ACCOUNTS[1].code], players: Object.keys(gopRead().players).length }));
    ck(`[${w}] 'Import opponent snapshot…' through the file input: Tiny's bracket appears (2 rows), Ollie's bracket kept (4 players: Bench Warmer is shared, Tiny's own entry isn't in a file), status line reports it`, /Imported tiny-opps\.json: Tiny bracket, 1 players \(1 new or newer/.test(ti.msg || "") && ti.rows === 2 && ti.ollieBr && ti.tinyBr && ti.players === 4, JSON.stringify(ti));
    await p.setInputFiles("#gopSnapFile", { name: "garbage.json", mimeType: "application/json", buffer: Buffer.from("{\"kind\":\"nope\"}") });
    await p.waitForTimeout(400);
    const gb = await p.evaluate(() => ({ msg: (document.querySelector(".gop-msg") || {}).textContent, cls: (document.querySelector(".gop-msg") || {}).className, rows: document.querySelectorAll(".gop-prow").length }));
    ck(`[${w}] a garbage file through the input is refused with a friendly message and changes nothing`, /isn't a Holotable opponent snapshot/.test(gb.msg || "") && /bad/.test(gb.cls) && gb.rows === 2, JSON.stringify(gb));
    await p.setInputFiles("#gopSnapFile", { name: "roster.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ kind: "holotable-roster-snapshot", version: 1 })) });
    await p.waitForTimeout(400);
    const rs = await p.evaluate(() => (document.querySelector(".gop-msg") || {}).textContent);
    ck(`[${w}] a roster snapshot dropped here is redirected to ☁ Sync → Import roster snapshot`, /That's a roster snapshot/.test(rs || "") && /Import roster snapshot/.test(rs || ""), rs);
    /* Refresh button opens ☁ Sync at the bookmarklet box; the box now mentions the bracket */
    await p.click(`.card[data-card="gop"] button:has-text("Refresh from swgoh.gg")`); await p.waitForTimeout(300);
    const bm = await p.evaluate(() => { const e = document.getElementById("pbmBmLink"); return { vis: !!(e && e.offsetParent !== null), txt: (document.getElementById("pbmBmBox") || {}).textContent || "" }; });
    ck(`[${w}] 'Refresh from swgoh.gg (bookmarklet)' opens ☁ Sync at the bookmarklet, whose note now says it also reads the GAC bracket and to re-drag it`, bm.vis && /current GAC bracket/.test(bm.txt) && /Re-drag the bookmark/.test(bm.txt), bm.txt.slice(0, 200));
    await p.evaluate(() => closeSyncModal());
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 6. bracket round detection at other clocks; selection survives reload; export download ---------- */
  await sec(async () => {
    const { ctx, p, errs } = await openX(b, { tag: "round", pin: T(2026, 9, 23, 12) });   /* 23 Oct: inside the ESTIMATED Season 84 Event 3 */
    await seed(p, "ollie", GAC, MY_RAW); await p.waitForTimeout(200);
    const r1 = await p.evaluate(() => ({ chip: document.querySelector(".gop-round .chip").textContent, cls: document.querySelector(".gop-round .chip").className, unit: gopBracketRound({ start: null }).text, future: gopBracketRound({ start: Date.now() + 30 * 86400e3 }).text, ranOut: gopBracketRound({ start: Date.now() }, new Date(2027, 5, 1).getTime()).text }));
    ck("a 14 Oct bracket viewed on 23 Oct reads 'previous round's bracket (started Wed 14 Oct) — re-pull…' (amber)", /previous round's bracket \(started Wed(, Oct 14| 14 Oct)\)/.test(r1.chip) && /grind/.test(r1.cls), r1.chip);
    ck("round detection: unknown start → asks you to check; schedule run out → says so honestly", /start time unknown/.test(r1.unit) && /schedule has run out/.test(r1.ranOut), JSON.stringify(r1));
    await p.evaluate(() => { gopPickOpp("ollie", "111111111"); gopSquadAdd("ollie"); gopUnitAdd("ollie", 0, "GLREY"); });
    await p.reload({ waitUntil: "domcontentloaded" }); await p.waitForTimeout(900);
    const r2 = await p.evaluate(() => { switchTab("gac"); sectionView("gac", "opponent"); return { sel: gopSel("ollie"), players: Object.keys(gopRead().players).length, txt: document.querySelector('#gacGrid .card[data-card="gop"]').textContent }; });
    ck("after a reload the store (GOP_KEY) and the picks (state.views, DEVICE_KEY) are still there and render", r2.players === 4 && r2.sel.opp === "111111111" && r2.sel.squads[0][0] === "GLREY" && /Opponent: Kylo Fan/.test(r2.txt) && /\(L\) Rey/.test(r2.txt), JSON.stringify(r2.sel));
    const exp = await p.evaluate(() => { let got = null; const d0 = downloadText; window.downloadText = (n, t) => { got = { n, kb: Math.round(t.length / 1024), kind: JSON.parse(t).kind }; }; try { gopExport(); } finally { window.downloadText = d0; } return { got, msg: gopUi.msg }; });
    ck("Export opponent snapshot downloads holotable-opponent-snapshot-<date>.json and reports size/players", exp.got && /^holotable-opponent-snapshot-\d{4}-\d{2}-\d{2}\.json$/.test(exp.got.n) && exp.got.kind === "holotable-opponent-snapshot" && /Saved holotable-opponent-snapshot-.*4 players across 1 bracket/.test(exp.msg), JSON.stringify(exp));
    /* the owner's own roster `sp` is optional in validation + cleaning (old snapshots still validate) */
    const sp = await p.evaluate(() => { const pl = JSON.parse(JSON.stringify(state.pulls.ollie)); pl.reqs.GLREY.sp = 318; const ok = rpPullProblem(pl); const bad = rpPullProblem(Object.assign({}, pl, { reqs: Object.assign({}, pl.reqs, { GLREY: Object.assign({}, pl.reqs.GLREY, { sp: "fast" }) }) })); const cleaned = rvSnapClean(pl, Date.now()).reqs.GLREY.sp; return { ok, bad, cleaned, none: rpPullProblem(state.pulls.ollie) }; });
    ck("roster pull: `sp` accepted when numeric, refused when not, kept by rvSnapClean, absent is fine", sp.ok === "" && /malformed unit/.test(sp.bad) && sp.cleaned === 318 && sp.none === "", JSON.stringify(sp));
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 7. END-TO-END bookmarklet: fake swgoh.gg serves rosters + Ollie's bracket + opponent rosters (Tiny's bracket 404s) ---------- */
  await sec(async () => {
    const SNAP = L.SNAP;
    const rawFrom = (pl, code) => ({ data: { ally_code: +code, name: "Fixture", galactic_power: pl.gp, character_galactic_power: pl.gpChar || 0, ship_galactic_power: pl.gpShip || 0, skill_rating: 1500, league_name: "Carbonite", division_number: 5, last_updated: "2026-10-16T01:00:00", arena: { rank: 1, leader: "" }, fleet_arena: { rank: 1, leader: "" } },
      units: Object.entries(pl.reqs).map(([id, u]) => ({ data: { base_id: id, name: u.name || id, rarity: u.s, gear_level: u.g, relic_tier: u.r ? u.r + 2 : 1, combat_type: u.t === "ship" ? 2 : 1, era_level: u.el || 0, stats: { "5": 210 }, ability_data: [] } })), mods: [], datacrons: [] });
    const OWN = { [CODES.ollie]: rawFrom(SNAP.accounts.ollie, CODES.ollie), [CODES.tiny]: rawFrom(SNAP.accounts.tiny, CODES.tiny) };
    const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 } });
    await ctx.addInitScript(([s, pl, seedKey]) => { try { if (location.protocol !== "https:" && !sessionStorage.getItem(seedKey)) { localStorage.clear(); localStorage.setItem("swgoh-tracker", s); localStorage.setItem("swgoh-holotable-pulls-v1", pl); sessionStorage.setItem(seedKey, "1"); } } catch (e) {} }, [REAL, PULLS, "seeded-e2e"]);
    await ctx.route(/fonts\.g|corsproxy|allorigins|codetabs|api\.github/, r => r.abort());
    const hits = [];
    await ctx.route(/^https:\/\/swgoh\.gg\//, r => {
      const u = r.request().url(); hits.push(u.replace("https://swgoh.gg", ""));
      let m = /\/api\/player\/(\d+)\/$/.exec(u);
      if (m) { const body = OWN[m[1]] || RAW_OPPS[m[1]]; return r.fulfill({ status: body ? 200 : 404, contentType: "application/json", body: JSON.stringify(body || { detail: "nope" }) }); }
      m = /\/api\/v2\/gac\/brackets\/recent\/(\d+)\/$/.exec(u);
      if (m) return m[1] === CODES.ollie ? r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(BRACKET) }) : r.fulfill({ status: 404, contentType: "application/json", body: "{}" });
      return r.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>swgoh.gg (fake)</title><p>fake</p>" });
    });
    const errs = [];
    ctx.on("page", pg => { pg.on("pageerror", e => errs.push(String(e).slice(0, 300))); });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/x.html`, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(900);
    const href = await p.evaluate(() => document.getElementById("pbmBmLink").getAttribute("href"));
    const code = decodeURIComponent(href.replace(/^javascript:/, ""));
    const sw = await ctx.newPage();
    await sw.goto("https://swgoh.gg/", { waitUntil: "domcontentloaded" });
    const [pop] = await Promise.all([ctx.waitForEvent("page", { timeout: 20000 }), sw.evaluate(c => { (0, eval)(c); }, code)]);
    await pop.waitForLoadState("domcontentloaded");
    let shown = false;
    try { await pop.waitForSelector("#pbmConfirm:not([hidden]) #pbmImportBtn", { timeout: 20000 }); shown = true; } catch (e) {}
    const txt = shown ? await pop.textContent("#pbmConfirm") : "";
    ck("e2e: the real bookmarklet on a (fake) swgoh.gg tab fetched both rosters, Ollie's bracket and its 4 other players' rosters, skipped Tiny's 404 bracket", hits.filter(h => /\/api\/player\//.test(h)).length === 6 && hits.includes(`/api/v2/gac/brackets/recent/${CODES.ollie}/`) && hits.includes(`/api/v2/gac/brackets/recent/${CODES.tiny}/`) && !hits.some(h => h === `/api/player/${CODES.ollie}/` && false), JSON.stringify(hits));
    ck("e2e: the opened app tab shows the classic roster confirm PLUS the bracket line (3 of 4 scouted — 'Unscouted Guy' 404s)", shown && /Import roster from swgoh\.gg: Ollietank 8\.20M GP · Tiny 7\.89M GP/.test(txt) && /\+ GAC bracket for Ollietank: 3 of 4 opponents scouted · bracket 9320/.test(txt) && !/GAC bracket for Tiny/.test(txt), txt.slice(0, 300));
    await pop.screenshot({ path: L.path.join(SHOTS, "gop-confirm-1280.png") });
    if (shown) await pop.click("#pbmImportBtn");
    await pop.waitForTimeout(400);
    const after = await pop.evaluate(() => ({ players: Object.keys(gopRead().players).sort(), br: gopRead().brackets[ACCOUNTS[0].code] && gopRead().brackets[ACCOUNTS[0].code].id, st: document.getElementById("pullStatus").textContent, gp: state.pulls.ollie.gp, sp: Object.values(state.pulls.ollie.reqs).some(u => u.sp === 210) }));
    ck("e2e: Import stores the bracket + 4 players (3 opponents + you) in GOP_KEY, the rosters as before (with `sp`), and the status says so", after.br === "9320" && after.players.length === 4 && after.players.includes(OPP.slkr.code) && after.players.includes(CODES.ollie) && /Imported from a swgoh\.gg tab/.test(after.st) && /GAC bracket: 4 players scouted/.test(after.st) && after.gp === SNAP.accounts.ollie.gp && after.sp, JSON.stringify(after).slice(0, 300));
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 8. default GAC view untouched (lay/gof suites rely on it) ---------- */
  await sec(async () => {
    const { ctx, p, errs } = await openX(b, { tag: "plain" });
    await L.go(p, "ollie", "gac");
    const r = await p.evaluate(() => ({ view: state.views.gac || "plan", cards: [...document.querySelectorAll("#gacGrid .card")].map(c => c.dataset.card), gop: !!document.querySelector('[data-card="gop"]'), key: localStorage.getItem(GOP_KEY) }));
    ck("GAC Planner still opens on Scout & plan with the zones + offense cards; no opponent card and no GOP_KEY until something is imported", r.view === "plan" && r.cards.join("|") === "zones|offense" && !r.gop && r.key === null, JSON.stringify(r));
    allErrs.push(...errs); await ctx.close();
  });

  ck("zero page errors across every context", allErrs.length === 0, JSON.stringify(allErrs.slice(0, 6)));
  await L.finish(b, srv);
})().catch(e => { console.error(e); process.exit(2); });
