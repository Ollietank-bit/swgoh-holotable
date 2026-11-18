#!/usr/bin/env node
/* tools/parse-capture.js — turn a holotable-capture-*.json.gz (from tools/swgoh-capture.js) into refresh.json.
   usage: node tools/parse-capture.js <file.json.gz|.json> [out.json] [--tz-override]
   Output: compact rosters (ref31/ollie-roster-31oct.txt format) + GL list / GP / last_updated / mod count, GAC bracket
   summary, schedule events with Australia/Sydney start/end instants and the app's `date` / `ends` (last live day)
   convention, tier boards (offence + defence), datacron sets with expiry, raid facts, and a coverage manifest.
   Exit codes: 0 ok, 1 usage/shape error, 2 schedule timezone refused (the page's "TIMES IN …" label is not Australian
   Eastern; pass --tz-override to compute in Australia/Sydney anyway and get a loud warning instead). */
"use strict";
const fs = require("fs"), path = require("path"), zlib = require("zlib");

const TZ = "Australia/Sydney";
const GL_IDS = ["GLREY", "SUPREMELEADERKYLOREN", "GRANDMASTERLUKE", "SITHPALPATINE", "JEDIMASTERKENOBI", "LORDVADER", "JABBATHEHUTT", "GLLEIA", "GLAHSOKATANO", "GLHONDO"];
const LABELS = { ollie: "Ollie", tiny: "Tiny" };
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const WDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const p2 = n => String(n).padStart(2, "0");
const isoDate = (y, m, d) => y + "-" + p2(m) + "-" + p2(d);
const dayNum = (y, m, d) => Math.round(Date.UTC(y, m - 1, d) / 864e5);     /* calendar-day ordinal (tz-free) */
const fromDayNum = n => { const t = new Date(n * 864e5); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; };

/* ---------- time zone core: ONE function turns a local wall time into a UTC instant via Intl (DST-correct) ---------- */
function tzParts(ms, tz) {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric", weekday: "short" });
  const o = {}; f.formatToParts(new Date(ms)).forEach(p => { o[p.type] = p.value; });
  return { y: +o.year, m: +o.month, d: +o.day, hh: +o.hour % 24, mm: +o.minute, ss: +o.second, wd: String(o.weekday || "").toLowerCase().slice(0, 3) };
}
function tzOffsetMs(ms, tz) { const p = tzParts(ms, tz); return Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss) - Math.floor(ms / 1000) * 1000; }
/** local wall time (y, m 1-12, d, hh, mm) in `tz` -> UTC ms. Non-existent local times (DST gap) resolve to the
 *  instant the clocks would have shown, consistently; ambiguous times (fall-back) take the first (DST) reading. */
function zonedToUtc(y, m, d, hh, mm, tz) {
  const guess = Date.UTC(y, m - 1, d, hh || 0, mm || 0);
  /* the zone's offsets a day before and a day after (they differ only around a transition); a reading is valid when it round-trips */
  const offs = Array.from(new Set([tzOffsetMs(guess - 864e5, tz), tzOffsetMs(guess, tz), tzOffsetMs(guess + 864e5, tz)]));
  const valid = offs.map(o => guess - o).filter(u => tzOffsetMs(u, tz) === guess - u).sort((a, b) => a - b);
  if (valid.length) return valid[0];                       /* unique, or ambiguous (fall-back hour) -> the earlier = DST reading */
  return guess - tzOffsetMs(guess - 864e5, tz);            /* non-existent (spring-forward gap) -> shifted forward by the gap, e.g. 02:30 -> 03:30 AEDT */
}
const localOf = (ms, tz) => { const p = tzParts(ms, tz); return { date: isoDate(p.y, p.m, p.d), time: p2(p.hh) + ":" + p2(p.mm), y: p.y, m: p.m, d: p.d, hh: p.hh, mm: p.mm, wd: p.wd, offsetMin: tzOffsetMs(ms, tz) / 6e4 }; };
/** the app's convention: `ends` = LAST LIVE DAY. An event that closes at or before 06:00 local (the game's 05:00/06:00 resets)
 *  counts the previous local day as its last live day; a later close (09:00 GAC, 11:00, 18:00 …) is the same day. */
function lastLiveDay(endLocal) {
  if (!endLocal) return null;
  if (endLocal.hh < 6 || (endLocal.hh === 6 && endLocal.mm === 0)) { const n = fromDayNum(dayNum(endLocal.y, endLocal.m, endLocal.d) - 1); return isoDate(n.y, n.m, n.d); }
  return endLocal.date;
}

/* ---------- schedule text parsing ---------- */
const MO_RE = "(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?", WD_RE = "(?:sun|mon|tue|wed|thu|fri|sat)[a-z]*\\.?,?";
const MD = new RegExp("(?:" + WD_RE + "\\s+)?(?:" + MO_RE + "\\s+(\\d{1,2})(?:st|nd|rd|th)?|(\\d{1,2})(?:st|nd|rd|th)?\\s+" + MO_RE + ")(?:,?\\s+(\\d{4}))?", "i");
const TM = /(\d{1,2}):(\d{2})\s*([AP])\.?M\.?/i;
function parseMonthDay(s) {
  const m = MD.exec(s || ""); if (!m) return null;
  const mon = MONTHS.indexOf((m[1] || m[4] || "").toLowerCase().slice(0, 3)) + 1, d = +(m[2] || m[3]);
  return mon && d ? { m: mon, d, y: m[5] ? +m[5] : null, wd: (/(sun|mon|tue|wed|thu|fri|sat)/i.exec(s) || [""])[0].toLowerCase() || null } : null;
}
function parseTime(s) { const m = TM.exec(s || ""); if (!m) return null; let hh = +m[1] % 12; if (/p/i.test(m[3])) hh += 12; return { hh, mm: +m[2] }; }
/** choose the year that puts (m, d) closest to the anchor day; `after` = prefer the closest date on/after the anchor */
function resolveYear(md, anchor, after) {
  if (md.y) return md.y;
  const cands = [anchor.y - 1, anchor.y, anchor.y + 1].map(y => ({ y, diff: dayNum(y, md.m, md.d) - dayNum(anchor.y, anchor.m, anchor.d) }));
  if (after) { const ok = cands.filter(c => c.diff >= 0).sort((a, b) => a.diff - b.diff); if (ok.length && ok[0].diff <= 400) return ok[0].y; }
  return cands.sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff))[0].y;
}
function tzFromLabel(label) {
  const t = String(label || "");
  if (/australian\s+eastern|\bAE[DS]T\b|sydney|melbourne/i.test(t)) return TZ;
  return null;
}
/** schedule page object (pages.schedule) -> events with instants. Throws on a non-Australian-Eastern label unless opt.tzOverride. */
function resolveSchedule(page, capturedAtMs, opt) {
  opt = opt || {}; const warnings = [], errors = [];
  if (!page) return { events: [], warnings: [], errors: ["no schedule page in the capture"], tz: null, rowCount: 0 };
  if (!(page.rows || []).length) return { events: [], warnings: [], errors: ["schedule page has 0 structured rows (text-only fallback; re-capture with mode live on the /schedule/ tab)"], tz: tzFromLabel(page.tzLabel), tzLabel: page.tzLabel || null, atHeader: page.atHeader || null, rowCount: 0, textChars: (page.text || "").length };
  const tz = tzFromLabel(page.tzLabel);
  if (!tz) {
    const msg = 'schedule timezone label is "' + (page.tzLabel || "(none found)") + '" — not AUSTRALIAN EASTERN TIME; instants would be wrong';
    if (!opt.tzOverride) throw Object.assign(new Error(msg), { code: "BAD_TZ" });
    warnings.push("TZ OVERRIDE: " + msg + " (computing in " + TZ + " anyway)");
  }
  const zone = tz || TZ, capLocal = localOf(capturedAtMs || Date.now(), zone);
  /* anchor = the page's "At <date>" header, year resolved against the capture time (closest year) */
  let anchor = null; const atMd = parseMonthDay(String(page.atHeader || "").replace(/^At\s+/i, ""));
  if (atMd) { anchor = { y: resolveYear(atMd, capLocal, false), m: atMd.m, d: atMd.d }; if (atMd.wd && tzParts(Date.UTC(anchor.y, anchor.m - 1, anchor.d, 12), "UTC").wd !== atMd.wd.slice(0, 3)) warnings.push("the At-header weekday (" + atMd.wd + ") does not match " + isoDate(anchor.y, anchor.m, anchor.d)); }
  else { anchor = { y: capLocal.y, m: capLocal.m, d: capLocal.d }; warnings.push("no 'At <date>' header; years resolved against the capture time " + capLocal.date); }
  const events = (page.rows || []).map((r, i) => {
    const ev = { i, day: r.day, kind: r.kind, title: r.title, subtitle: r.subtitle, time: r.time, endsText: r.ends, predicted: !!r.predicted, confidence: r.conf || null };
    let dmd = null;
    if (/^today$/i.test(r.day || "")) dmd = { m: anchor.m, d: anchor.d, y: anchor.y };
    else if (/^tomorrow$/i.test(r.day || "")) { const n = fromDayNum(dayNum(anchor.y, anchor.m, anchor.d) + 1); dmd = { m: n.m, d: n.d, y: n.y }; }
    else dmd = parseMonthDay(r.day);
    if (!dmd) { ev.error = "no day header for this row"; errors.push("row " + i + " (" + (r.title || "?") + "): no day"); return ev; }
    const sy = resolveYear(dmd, anchor, false), st = parseTime(r.time);
    ev.date = isoDate(sy, dmd.m, dmd.d);
    if (dmd.wd && tzParts(Date.UTC(sy, dmd.m - 1, dmd.d, 12), "UTC").wd !== dmd.wd.slice(0, 3)) warnings.push("row " + i + ": weekday " + dmd.wd + " does not match " + ev.date);
    if (st) { const ms = zonedToUtc(sy, dmd.m, dmd.d, st.hh, st.mm, zone); ev.startUtc = new Date(ms).toISOString(); ev.startLocal = ev.date + " " + p2(st.hh) + ":" + p2(st.mm); ev.startOffsetMin = localOf(ms, zone).offsetMin; }
    else ev.startLocal = ev.date;
    if (r.ends) {
      const emd = parseMonthDay(r.ends.replace(/^.*?\bend(?:s|ed|ing)?\b/i, "")), et = parseTime(r.ends);
      if (emd) {
        const ey = resolveYear(emd, { y: sy, m: dmd.m, d: dmd.d }, true), eh = et || { hh: 23, mm: 59 };
        const ems = zonedToUtc(ey, emd.m, emd.d, eh.hh, eh.mm, zone), el = localOf(ems, zone);
        ev.endUtc = new Date(ems).toISOString(); ev.endLocal = el.date + (et ? " " + el.time : ""); ev.endOffsetMin = el.offsetMin;
        ev.ends = et ? lastLiveDay(el) : el.date; if (!et) warnings.push("row " + i + ": end has no time; ends = that day");
        if (ev.startUtc && ems < Date.parse(ev.startUtc)) warnings.push("row " + i + " (" + r.title + "): end before start");
      } else if (/\b(today|tomorrow)\b/i.test(r.ends)) { ev.endsRelative = r.ends; warnings.push("row " + i + ": relative end text kept as-is"); }
      else { ev.endsUnparsed = r.ends; warnings.push("row " + i + " (" + r.title + "): could not parse end text \"" + r.ends + "\""); }
    }
    if (r.iso && r.iso.length) ev.isoAttrs = r.iso;
    return ev;
  });
  return { tz: zone, tzLabel: page.tzLabel, atHeader: page.atHeader, anchorDate: isoDate(anchor.y, anchor.m, anchor.d), capturedLocal: capLocal.date + " " + capLocal.time, events, warnings, errors, rowCount: (page.rows || []).length, dayHeaders: page.dayHeaders || [] };
}

/* ---------- rosters ---------- */
const unitOf = w => (w && typeof w === "object" && w.data && typeof w.data === "object") ? w.data : w;
function compactRoster(raw, key, code, capturedAtMs) {
  const d = raw && raw.data || {}, units = Array.isArray(raw && raw.units) ? raw.units.map(unitOf).filter(u => u && typeof u.base_id === "string") : [];
  const chars = units.filter(u => !u.combat_type || u.combat_type === 1), ships = units.filter(u => u.combat_type === 2);
  const relicOf = u => Math.max(0, (u.relic_tier || 0) - 2);
  const line = chars.map(u => u.base_id).sort().map(id => { const u = chars.find(x => x.base_id === id); const r = relicOf(u); return id + ":" + (u.rarity || 0) + "." + (u.gear_level || 1) + (r ? "r" + r : "") + (GL_IDS.includes(id) ? "*" : ""); }).join(",");
  const lu = String(d.last_updated || ""), luShort = lu ? lu.slice(0, 16).replace(/(\d{2}:\d{2})$/, "$1") + (/Z$|[+-]\d\d:?\d\d$/.test(lu) ? "" : "Z") : "?";
  const cap = new Date(capturedAtMs || Date.now());
  const header = "# " + (LABELS[key] || key) + " (" + code + ") chars only, swgoh.gg API, last_updated " + luShort + ". format ID:stars.gear[rN relic][*=GL]. Ships omitted. (captured " + cap.getUTCDate() + " " + ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][cap.getUTCMonth()] + " " + cap.getUTCFullYear() + ")";
  const gls = chars.filter(u => GL_IDS.includes(u.base_id)).map(u => ({ id: u.base_id, name: u.name || u.base_id, stars: u.rarity || 0, gear: u.gear_level || 1, relic: relicOf(u), label: (u.name || u.base_id) + " G" + (u.gear_level || 1) + " R" + relicOf(u) }));
  let zetas = 0, omis = 0; chars.forEach(u => { zetas += Array.isArray(u.zeta_abilities) ? u.zeta_abilities.length : 0; omis += Array.isArray(u.omicron_abilities) ? u.omicron_abilities.length : 0; });
  return { key, code, name: d.name || null, gp: d.galactic_power || null, gpChar: d.character_galactic_power || null, gpShip: d.ship_galactic_power || null, lastUpdated: lu || null,
    league: d.league_name || null, division: d.division_number || null, skillRating: d.skill_rating || null, chars: chars.length, ships: ships.length, mods: Array.isArray(raw.mods) ? raw.mods.length : 0,
    datacrons: Array.isArray(raw.datacrons) ? raw.datacrons.length : 0, zetas, omicrons: omis, gls, glCount: gls.length, compactHeader: header, compact: line,
    shipsCompact: ships.map(u => u.base_id).sort().map(id => { const u = ships.find(x => x.base_id === id); return id + ":" + (u.rarity || 0); }).join(",") };
}

/* ---------- GAC ---------- */
const digits = v => String(v == null ? "" : v).replace(/\D/g, "");
const seasonNum = v => typeof v === "string" && !/^\s*\d+\s*$/.test(v) ? +((/(\d+)\D*$/.exec(v) || [])[1] || 0) : (v == null ? null : +v);
function pickBracket(raw, own) {
  const arr = Array.isArray(raw) ? raw : raw && Array.isArray(raw.data) ? raw.data : raw && Array.isArray(raw.brackets) ? raw.brackets : null;
  if (arr) { const mine = arr.filter(b => b && Array.isArray(b.bracketPlayers) && b.bracketPlayers.some(p => digits(p.allyCode || p.ally_code) === own)); return (mine.sort((x, y) => String(y.startTime || "").localeCompare(String(x.startTime || "")))[0]) || arr[0] || null; }
  if (!raw || typeof raw !== "object") return null; return raw.data && !Array.isArray(raw.bracketPlayers) ? raw.data : raw;
}
function gacSummary(g, key, own, manifest) {
  if (!g || !g.bracket) return { key, ok: false, note: (manifest && manifest.notes || []).join("; ") || "no bracket data" };
  const all = Array.isArray(g.bracket.data) ? g.bracket.data : [], B = pickBracket(g.bracket, own), players = g.players || {};
  const sum = b => { if (!b) return null; const list = (b.bracketPlayers || []).map(p => ({ code: digits(p.allyCode || p.ally_code), name: p.playerName || p.name || "", gp: p.playerPower || p.galactic_power || 0, guild: String(p.guildName || p.guild_name || "").trim(), rank: p.bracketRank != null ? p.bracketRank : p.rank, score: p.bracketScore != null ? p.bracketScore : p.score, scouted: !!players[digits(p.allyCode || p.ally_code)] }));
    const me = list.find(p => p.code === own);
    return { bracketId: b.bracketId || b.id || null, season: seasonNum(b.seasonNumber != null ? b.seasonNumber : (b.season != null ? b.season : (b.seasonId || b.season_id))), seasonId: b.seasonId || b.season_id || null, week: b.weekNumber || b.week || null, league: b.leagueId || b.league || b.leagueName || null, start: b.startTime || b.start_time || null, size: list.length, ownRank: me ? me.rank : null, ownScore: me ? me.score : null, players: list }; };
  const cur = sum(B);
  return { key, ok: !!cur, current: cur, bracketsInAnswer: all.length, previous: all.filter(b => b !== B).map(b => { const s = sum(b); return s && { bracketId: s.bracketId, season: s.season, week: s.week, start: s.start, ownRank: s.ownRank, size: s.size }; }).filter(Boolean),
    scoutedPlayers: Object.keys(players).length, failedPlayers: manifest && manifest.failedPlayers || 0 };
}

/* ---------- tier boards / datacrons / raid ---------- */
const numOf = s => { if (s == null) return null; const m = /^([\d,]+(?:\.\d+)?)\s*([KMB])?$/i.exec(String(s).replace(/^#/, "").trim()); if (!m) return null; const n = parseFloat(m[1].replace(/,/g, "")); return Math.round(n * ({ K: 1e3, M: 1e6, B: 1e9 }[(m[2] || "").toUpperCase()] || 1)); };
const pctOf = s => { const m = /^(\d{1,3}(?:\.\d+)?)\s*%$/.exec(String(s || "").trim()); return m ? +m[1] : null; };
/* ---------- squad normalisation (REAL swgoh.gg shape, derived from the 1 Nov 2026 capture) ----------
   The generic extractor (swgoh-capture.js tierList) returns every repeated block on a tier page as a "row": on the real site that is
   ~4 rows per squad — the SQUAD row plus datacron TOOLTIP rows (a level "L9" / "L6" / "L3", an affix such as "Dark Side" or a unit
   name + its long ability text, then "NN.N%" and "· 48.9K") whose "unit" is e.g. 'Sample-size-adjusted win rate'. Those carry no Elo
   and are positional rank guesses, so board.rows is DEPRECATED noise; use board.squads.
   REAL squad-row leaf order (each row keeps its raw `leaves`; img alts are written [Name]):
     [Leader] [Unit2] … [UnitN]  Elo <n>  Win % <p>|Hold % <p>  Battles <134K|1,051>  [<n> builds]  [Datacron dependent]  #<rank>  <trend>  [<X→Y>]
   trend = ▲n | ▼n | NEW | — ; X→Y = tier change (to-letter == the section/tier letter). 'N builds' and 'Datacron dependent' are optional.
   A tooltip block ("Meta Explorer", "— <Leader> builds, datacrons & counters", "L9", …) can leak onto the END of a squad row's leaves
   (a Meta Explorer link in fleet rows, a dangling datacron tooltip) — scanning stops there, and the units are only the [alts] BEFORE the
   first 'Elo' label, so a leaked unit alt never joins the squad. The tier letter is the extractor's section heading (S/A/B/C/D, fleet S-D;
   verified: monotone down the rank and equal to every X→Y target); the first fleet rows also carry "S","tier","S" heading leaves.
   Rank: the page's own '#N' leaf (rankSource "page"); fixtures with a plain rank column also "page"; only if neither exists the
   sequential order of squad rows (rankSource "sequential"). Real boards list every squad (no 'Show more' needed) but the defence
   boards can skip ranks (88-104 missing, then #105) — reported as rankGaps, never invented.
   A squad row = has an Elo (real pages) OR a page-given rank + a win/hold % (fixtures without an Elo column) AND >= 1 unit. Real pages
   do contain legitimate 1-unit squads (Rotta the Hutt, Wampa …): they are kept (unitCount 1, flag "short") because dropping them would
   punch holes in the page's own ranking. Negative Elo values are real on the long tail (low-sample squads, flag "negative-elo", not suspicious). */
const LABEL_RE = /^(elo|win ?%|win rate|hold ?%|hold rate|battles|banners|avg\.? ?banners)$/i;
const TREND_RE = /^(NEW|—|–|-|[▲▼]\s*\d+)$/;
const TIERCHG_RE = /^([SABCDF])\s*→\s*([SABCDF])$/;
const intOf = v => { if (v == null) return null; const m = /^-?[\d,]+(?:\.\d+)?$/.exec(String(v).trim()); return m ? Math.round(parseFloat(String(v).replace(/,/g, ""))) : null; };
const pctNum = v => { const m = /^(-?\d{1,3}(?:\.\d+)?)\s*%$/.exec(String(v == null ? "" : v).trim()); return m ? +m[1] : null; };
/** raw leaves -> the fields of a real squad row, or null when the leaves do not have the labelled shape (no 'Elo'/'Win %'/'Hold %' label). */
function parseSquadLeaves(leaves) {
  const L = (leaves || []).map(String), li = L.findIndex(l => LABEL_RE.test(l));
  if (li < 0) return null;
  const o = { units: L.slice(0, li).filter(l => /^\[.*\]$/.test(l)).map(l => l.slice(1, -1)), vals: {}, rank: null, trendText: null, tierChange: null, builds: null, dcDep: false, leaked: false };
  for (let i = li; i < L.length; i++) {
    const t = L[i];
    if (/^meta explorer$/i.test(t) || /^L\d+$/.test(t) || /builds, datacrons & counters$/i.test(t)) { o.leaked = true; break; }
    if (LABEL_RE.test(t) && i + 1 < L.length) { o.vals[t.toLowerCase().replace(/\s+/g, "").replace(/^avg\.?/, "avg")] = L[i + 1]; i++; continue; }
    let m;
    if ((m = /^(\d[\d,]*)\s+builds?$/i.exec(t))) { o.builds = intOf(m[1]); continue; }
    if (/^datacron dependent$/i.test(t)) { o.dcDep = true; continue; }
    if (/^#\d+$/.test(t) && o.rank == null) { o.rank = +t.slice(1); continue; }
    if (TIERCHG_RE.test(t) && o.rank != null) { o.tierChange = t.replace(/\s+/g, ""); continue; }
    if (TREND_RE.test(t) && o.rank != null && o.trendText == null) { o.trendText = t.replace(/\s+/g, ""); continue; }
  }
  return o;
}
function trendNum(t) { const m = /^([▲▼])(\d+)$/.exec(t || ""); return m ? (m[1] === "▲" ? 1 : -1) * +m[2] : null; }
/** a board page -> { squads, dropped } (squads only; see the block comment above for the structure and the rank rule) */
function normaliseSquads(rowsIn, key, isDef) {
  const squads = []; let dropped = 0;
  (rowsIn || []).forEach(r => {
    const P = parseSquadLeaves(r.leaves), stat = lab => ((r.stats || []).find(s => lab.test(s.label)) || {}).value || null;
    const units = P && P.units.length ? P.units : (r.units || []);
    const eloRaw = P && P.vals.elo != null ? P.vals.elo : (r.elo != null ? r.elo : stat(/^(elo|rating)$/i));
    const winTxt = P && P.vals["win%"] != null ? P.vals["win%"] : (P && P.vals.winrate) || (isDef ? null : (r.win || stat(/^win/i)));
    const holdTxt = P && P.vals["hold%"] != null ? P.vals["hold%"] : (P && P.vals.holdrate) || (isDef ? (r.hold || stat(/^hold/i) || r.win || null) : (r.hold || null));
    const pageRank = P && P.rank != null ? P.rank : (!r.rankGuess && Number.isFinite(r.rank) ? r.rank : null);
    const hasElo = intOf(eloRaw) != null, hasPct = pctNum(winTxt) != null || pctNum(holdTxt) != null;
    const isSquad = units.length >= 1 && (hasElo || (pageRank != null && hasPct)) && !(units.length === 1 && /^sample-size-adjusted/i.test(units[0]));
    if (!isSquad) { dropped++; return; }
    const battles = (P && P.vals.battles != null ? P.vals.battles : r.battles) || null;
    const banners = (P && P.vals.banners != null ? P.vals.banners : (P && P.vals.avgbanners) || r.banners) || null;
    const trendText = P ? P.trendText : (r.trend || null);
    const tierChange = P ? P.tierChange : null, buildsN = P ? P.builds : intOf(r.builds);
    const sq = { rank: pageRank, rankSource: pageRank != null ? "page" : "sequential", tier: r.tier || null, trendText, trend: trendNum(trendText), isNew: trendText === "NEW", tierChange,
      leader: units[0] || null, units: units.slice(), unitCount: units.length, elo: intOf(eloRaw), win: isDef ? null : pctNum(winTxt), hold: isDef ? pctNum(holdTxt) : null,
      battles, battlesN: numOf(battles), builds: buildsN, datacronDependent: P ? P.dcDep : !!r.dc, banners, bannersN: banners != null && /^\d+(\.\d+)?$/.test(String(banners)) ? parseFloat(banners) : null, flags: [] };
    if (units.length < 2) sq.flags.push("short"); if (sq.elo != null && sq.elo <= 0) sq.flags.push("negative-elo"); if (P && P.leaked) sq.flags.push("tooltip-leak");
    if (!sq.tier) sq.flags.push("no-tier"); if (tierChange && sq.tier && tierChange.slice(-1) !== sq.tier) sq.flags.push("tierChange-mismatch");
    squads.push(sq);
  });
  squads.forEach((q, i) => { if (q.rank == null) q.rank = i + 1; });   /* sequential fallback (only when the page gave no rank) */
  return { squads, dropped };
}
const compressRanges = a => { const out = []; for (let i = 0; i < a.length;) { let j = i; while (j + 1 < a.length && a[j + 1] === a[j] + 1) j++; out.push(j > i ? a[i] + "-" + a[j] : String(a[i])); i = j + 1; } return out; };
/** coverage of a squad list: strictly increasing ranks 1..N, gaps reported (hidden/collapsed rows, or ranks the page skips) */
function squadCoverage(squads) {
  const ranks = squads.map(q => q.rank), gaps = [], tiers = {}; let strict = true, dup = 0;
  for (let i = 1; i < ranks.length; i++) { if (ranks[i] === ranks[i - 1]) dup++; if (ranks[i] <= ranks[i - 1]) strict = false; }
  const first = ranks.length ? ranks[0] : null, last = ranks.length ? ranks[ranks.length - 1] : null;
  if (strict && first != null) { for (let n = 1; n < first; n++) gaps.push(n); for (let i = 1; i < ranks.length; i++) for (let n = ranks[i - 1] + 1; n < ranks[i]; n++) gaps.push(n); }
  const order = "SABCDF"; let tierOrderOk = true; squads.forEach((q, i) => { if (q.tier) tiers[q.tier] = (tiers[q.tier] || 0) + 1; if (i && q.tier && squads[i - 1].tier && order.indexOf(q.tier) < order.indexOf(squads[i - 1].tier)) tierOrderOk = false; });
  return { squadCount: squads.length, firstRank: first, lastRank: last, strictlyIncreasing: strict, duplicateRanks: dup, startsAtOne: first === 1, rankGaps: gaps, rankGapCount: gaps.length, rankGapRanges: compressRanges(gaps),
    contiguous: strict && first === 1 && !gaps.length, tierCounts: tiers, tierOrderOk, rankSources: Array.from(new Set(squads.map(q => q.rankSource))) };
}
function tierBoard(page, key, m) {
  if (!page) return { key, ok: false, note: (m && m.notes || []).join("; ") || "missing" };
  const isDef = /Def$/.test(key) || page.side === "defence";
  /* DEPRECATED: the raw extractor rows (squad rows + tooltip/build noise, positional rank guesses) — kept only for old consumers */
  const rows = (page.rows || []).map(r => ({ rank: r.rank, rankGuess: !!r.rankGuess, tier: r.tier, units: r.units || [], leader: (r.units || [])[0] || null,
    win: r.win || null, winPct: pctOf(r.win), hold: r.hold || null, holdPct: pctOf(r.hold), battles: r.battles || null, battlesN: numOf(r.battles), elo: r.elo != null ? r.elo : null,
    builds: r.builds || null, banners: r.banners || null, dc: !!r.dc, trend: r.trend || null, stats: r.stats || [] }));
  const N = normaliseSquads(page.rows, key, isDef), squads = N.squads, cov = squadCoverage(squads);
  const suspicious = [], notes = [];
  if (!squads.length) suspicious.push("no squad rows recognised (" + rows.length + " raw rows)");
  else {
    if (!cov.strictlyIncreasing) suspicious.push("squad ranks are not strictly increasing" + (cov.duplicateRanks ? " (" + cov.duplicateRanks + " duplicates)" : ""));
    else {
      if (!cov.startsAtOne) suspicious.push("first squad rank is #" + cov.firstRank + ", not #1");
      if (cov.rankGapCount) notes.push(cov.rankGapCount + " rank(s) missing between #1 and #" + cov.lastRank + " (" + cov.rankGapRanges.join(", ") + "): hidden/collapsed or skipped by the page — informational, not a parse error");
    }
    if (squads.some(q => q.rankSource === "sequential")) suspicious.push(squads.filter(q => q.rankSource === "sequential").length + " squads had no '#N' rank on the page (sequential order used)");
    const nt = squads.filter(q => !q.tier).length; if (nt) suspicious.push(nt + " squads without a tier letter");
    if (!cov.tierOrderOk) suspicious.push("tier letters are not in S>A>B>C>D order down the ranking");
    const mm = squads.filter(q => q.flags.includes("tierChange-mismatch")); if (mm.length) suspicious.push(mm.length + " squads whose tier change does not end on their tier (#" + mm.map(q => q.rank).join(", #") + ")");
    if (isDef && !squads.some(q => q.hold != null)) suspicious.push("defence board without any hold % value");
    if (!isDef && !squads.some(q => q.win != null)) suspicious.push("offence board without any win % value");
  }
  if (m && m.discovered === false) suspicious.push("defence URL not confirmed (board may be the offence board)");
  const leaderRepeats = Array.from(new Set(squads.map(q => q.leader).filter((l, i, a) => l && a.indexOf(l) !== i)));   /* informational: several builds of one leader are normal */
  return { key, ok: true, path: page.path, source: page.source, title: page.title, season: page.season ? +page.season : null, seasonText: page.seasonText, side: page.side || (isDef ? "defence?" : "offence?"), status: page.statusText || null, battlesText: page.battlesText || null,
    colHeaders: page.colHeaders || [], count: squads.length, rankGaps: cov.rankGaps.slice(0, 60), squadCoverage: cov, droppedRows: N.dropped, leaderRepeats, suspicious, notes,
    squads, rowsDeprecated: "board.rows = raw extractor rows incl. tooltip/sub-build noise and positional rank guesses; use board.squads", rowCount: rows.length, rows };
}
function datacronSets(page, capturedAtMs) {
  if (!page) return { ok: false, sets: [] };
  const sets = (page.rows || []).map(r => {
    const md = parseMonthDay(r.expiresText || ""); let date = null;
    if (md) { const y = md.y || resolveYear(md, localOf(capturedAtMs || Date.now(), TZ), false); date = isoDate(y, md.m, md.d); }
    const daysLeft = date ? Math.round((Date.parse(date + "T08:00:00Z") - (capturedAtMs || Date.now())) / 864e5) : null;
    return { name: r.name, setNo: r.setNo, focused: !!r.focused, expired: !!r.expired || (daysLeft != null && daysLeft < 0 && /expired/i.test(r.expiresText || "")), section: r.section, expiresText: r.expiresText, expiresDate: date, daysLeft, tags: r.alts || [] };
  });
  return { ok: true, source: page.source, sections: page.sections || [], count: sets.length, active: sets.filter(s => !s.expired).map(s => s.name), nextToExpire: sets.filter(s => !s.expired && s.expiresDate).sort((a, b) => a.expiresDate.localeCompare(b.expiresDate))[0] || null, sets };
}
/* rv48 18 Nov 2026: the released raid page. swgoh.gg's raid page became "Best Squads by Tier" once the raid went live: "N posted runs — Squads players posted
   in the SWGoH Raid Server through <date>" is the RELEASED signal (status "released", postedRuns, postedThrough), and the page's "Shared loadouts: Coming soon"
   line is a SEPARATE feature — the in-page extractor's releaseText picked that "Coming soon" leaf on 18 Nov and read it as the raid's release status. Here a
   "Coming soon" that the page text pairs with "Shared loadouts" is reported as sharedLoadouts, never as releaseText. Duration / launch cost / entry come from the
   page text when present. A pre-release page (no posted runs) is parsed exactly as before. */
function raidFacts(page) {
  if (!page) return { ok: false };
  const facts = page.facts || [], find = re => { const f = facts.find(x => re.test(x.t)); return f ? (f.t + (f.next && !/\d/.test(f.t) ? " " + f.next : "")).trim() : null; };
  const text = String(page.text || ""), m = re => { const x = re.exec(text); return x ? x[1].trim() : null; };
  const posted = m(/(\d[\d,]*)\s+posted runs\b/i), postedRuns = posted ? +posted.replace(/,/g, "") : null;
  const postedThrough = m(/posted runs\b[^\n]*?\bthrough\s+([A-Z][a-z]{2,8}\.? \d{1,2}, \d{4})/);
  const sharedLoadouts = m(/Shared loadouts\s*:?\s*\n?\s*(Coming soon|[^\n]{1,40})/i);
  let releaseText = page.releaseText || find(/release|target|expected|in development/i);
  if (releaseText && /^\s*coming soon\s*$/i.test(releaseText) && (sharedLoadouts || postedRuns)) releaseText = null;   // the "Shared loadouts" leaf, not the raid
  const released = !!(postedRuns && postedRuns > 0);
  return { ok: true, source: page.source, title: page.title, banner: (page.banner || []).join(" · ") || null, releaseText, allowedUnits: page.allowedUnits || null,
    maxScore: find(/max score/i), status: released ? "released" : find(/^status/i), released, postedRuns, postedThrough, sharedLoadouts,
    duration: m(/\bDuration\s*\n\s*([^\n]{1,20})/), launchCost: m(/\bLaunch cost\s*\n\s*([^\n]{1,20})/), entry: m(/\bEntry\s*\n\s*([^\n]{1,60})/),
    requirements: m(/\bRequirements:\s*([^\n]{1,240})/),
    tiers: (page.rows || []).map(r => ({ tier: r[0], requirement: r[1], score: r[2], all: r[3], raw: r })), tierCount: (page.rows || []).length, facts: facts.slice(0, 40).map(f => f.t) };
}

/* ---------- top level ---------- */
function loadCapture(file) {
  const buf = fs.readFileSync(file); const text = buf[0] === 0x1f && buf[1] === 0x8b ? zlib.gunzipSync(buf).toString("utf8") : buf.toString("utf8");
  const j = JSON.parse(text);
  if (!j || j.type !== "holotable-pull" || j.v !== 1 || typeof j.accounts !== "object") throw new Error("not a holotable-pull v1 file (type/v/accounts)");
  if (j.captureVersion !== 1 || typeof j.pages !== "object" || typeof j.manifest !== "object") throw new Error("pull file without capture pages/manifest (captureVersion 1 expected) — it is a plain bookmarklet pull");
  return { data: j, bytes: buf.length, unpacked: text.length };
}
function parseCapture(j, opt) {
  opt = opt || {}; const at = +j.at || Date.parse(j.capturedAt) || Date.now(), man = j.manifest || {}, pm = man.pages || {};
  const codes = Object.assign({ ollie: "229917529", tiny: "295352286" }, opt.codes || {});
  const rosters = {}; for (const k in j.accounts) rosters[k] = compactRoster(j.accounts[k], k, codes[k] || digits(j.accounts[k] && j.accounts[k].data && j.accounts[k].data.ally_code), at);
  const gac = {}; for (const k in (j.gac || {})) gac[k] = gacSummary(j.gac[k], k, codes[k] || "", (man.gac || {})[k]);
  const schedule = resolveSchedule(j.pages.schedule, at, { tzOverride: opt.tzOverride });
  const boards = {}; ["tierGac", "tierGacDef", "tier3v3", "tier3v3Def", "tierFleet"].forEach(k => { boards[k] = tierBoard(j.pages[k], k, pm[k]); });
  const datacrons = datacronSets(j.pages.datacrons, at), raid = raidFacts(j.pages.raid);
  /* coverage */
  const pages = {}, missing = [], textOnly = [], suspicious = [], notes = [], boardCoverage = {};
  ["schedule", "tierGac", "tierGacDef", "tier3v3", "tier3v3Def", "tierFleet", "datacrons", "raid"].forEach(k => {
    const m = pm[k] || {}, pg = j.pages[k];
    pages[k] = { ok: !!m.ok, rows: m.rows || 0, source: m.source || null, path: m.path || (pg && pg.path) || null, status: m.status || null, notes: m.notes || [], textChars: pg && pg.text ? pg.text.length : 0, textTruncated: !!(pg && pg.textTruncated), embeddedJson: pg && pg.json ? pg.json.length : 0, title: pg && pg.title || m.title || null, tried: m.tried, discovered: m.discovered };
    if (!m.ok || !pg) missing.push(k); else if (!(pg.rows || []).length) textOnly.push(k);
    if (boards[k] && boards[k].suspicious) boards[k].suspicious.forEach(s => suspicious.push(k + ": " + s));
    if (boards[k] && boards[k].ok) { const c = boards[k].squadCoverage; boardCoverage[k] = { squads: c.squadCount, rawRows: boards[k].rowCount, noiseDropped: boards[k].droppedRows, firstRank: c.firstRank, lastRank: c.lastRank, strictlyIncreasing: c.strictlyIncreasing, contiguous: c.contiguous, rankGapCount: c.rankGapCount, rankGaps: c.rankGapRanges, tierCounts: c.tierCounts, tierOrderOk: c.tierOrderOk, shortSquads: boards[k].squads.filter(q => q.unitCount < 2).length };
      boards[k].notes.forEach(n => notes.push(k + ": " + n)); }
  });
  schedule.warnings.forEach(w => suspicious.push("schedule: " + w)); schedule.errors.forEach(e => suspicious.push("schedule ERROR: " + e));
  for (const k in rosters) { if (!rosters[k].chars) suspicious.push(k + ": roster has no characters"); }
  for (const k in gac) { if (!gac[k].ok) suspicious.push(k + ": no GAC bracket"); }
  if (datacrons.ok) datacrons.sets.forEach(s => { if (!s.expiresDate) suspicious.push("datacron " + (s.name || "?") + ": no expiry date parsed"); });
  if (!j.pages.datacrons || !datacrons.count) suspicious.push("datacrons: no sets");
  const accounts = {}; for (const k in (man.accounts || {})) accounts[k] = man.accounts[k];
  return { generatedAt: new Date().toISOString(), capturedAt: new Date(at).toISOString(), capturedLocal: localOf(at, TZ).date + " " + localOf(at, TZ).time + " " + TZ, captureMode: j.mode || null, capturePage: j.page || null, browserTz: j.tz || null,
    rosters, gac, schedule, boards, datacrons, raid,
    coverage: { accounts, gac: man.gac || {}, pages, boards: boardCoverage, missing, textOnly, suspicious, notes, issues: man.issues || [], captureMs: man.ms || null } };
}

function main(argv) {
  const args = argv.filter(a => !a.startsWith("--")), flags = argv.filter(a => a.startsWith("--"));
  if (!args[0]) { console.error("usage: node tools/parse-capture.js <holotable-capture-*.json.gz> [out.json] [--tz-override]"); return 1; }
  let cap; try { cap = loadCapture(args[0]); } catch (e) { console.error("parse-capture: cannot read " + args[0] + ": " + e.message); return 1; }
  let out; try { out = parseCapture(cap.data, { tzOverride: flags.includes("--tz-override") }); }
  catch (e) { if (e.code === "BAD_TZ") { console.error("parse-capture: REFUSED — " + e.message + ". Fix the page's time zone (swgoh.gg settings) or re-run with --tz-override."); return 2; } console.error("parse-capture: " + (e.stack || e.message)); return 1; }
  out.file = { name: path.basename(args[0]), bytes: cap.bytes, unpacked: cap.unpacked };
  const dest = args[1] || path.join(path.dirname(args[0]), "refresh.json");
  fs.writeFileSync(dest, JSON.stringify(out, null, 1));
  const r = out.rosters, b = out.boards;
  console.log("parse-capture: wrote " + dest + " (" + Math.round(cap.bytes / 1024) + " KB gz, " + Math.round(cap.unpacked / 1024) + " KB json)");
  for (const k in r) console.log("  " + k + ": GP " + r[k].gp + ", " + r[k].chars + " chars / " + r[k].ships + " ships, " + r[k].mods + " mods, GLs: " + (r[k].gls.map(g => g.label).join(", ") || "none") + ", last_updated " + r[k].lastUpdated);
  for (const k in out.gac) { const c = out.gac[k].current; console.log("  gac " + k + ": " + (c ? "S" + c.season + " w" + c.week + " #" + c.bracketId + " " + c.league + " start " + c.start + " rank " + c.ownRank + " of " + c.size + ", " + out.gac[k].scoutedPlayers + " scouted" : "no bracket")); }
  console.log("  schedule: " + out.schedule.events.length + " rows, " + out.schedule.tz + ", anchor " + out.schedule.anchorDate + ", " + out.schedule.warnings.length + " warnings, " + out.schedule.errors.length + " errors");
  for (const k in b) { const x = b[k], c = x.squadCoverage; console.log("  " + k + ": " + (x.ok ? x.count + " squads (" + x.rowCount + " raw rows, " + x.droppedRows + " noise dropped), " + (x.side || "?") + ", season " + x.season + ", ranks #" + c.firstRank + "-#" + c.lastRank + (c.contiguous ? " contiguous" : ", " + (c.strictlyIncreasing ? "" : "NOT strictly increasing, ") + "rank gaps " + c.rankGapRanges.join(",")) + ", tiers " + JSON.stringify(c.tierCounts) : "MISSING")); }
  console.log("  datacrons: " + out.datacrons.count + " sets; raid tiers: " + (out.raid.tierCount || 0));
  if (out.coverage.notes.length) console.log("  coverage notes (informational):\n    - " + out.coverage.notes.join("\n    - "));
  console.log("  coverage: missing " + JSON.stringify(out.coverage.missing) + ", text-only " + JSON.stringify(out.coverage.textOnly) + ", suspicious " + out.coverage.suspicious.length + (out.coverage.suspicious.length ? ":\n    - " + out.coverage.suspicious.join("\n    - ") : ""));
  return 0;
}
module.exports = { zonedToUtc, localOf, lastLiveDay, resolveSchedule, resolveYear, parseMonthDay, parseTime, compactRoster, gacSummary, pickBracket, tierBoard, normaliseSquads, parseSquadLeaves, squadCoverage, datacronSets, raidFacts, loadCapture, parseCapture, numOf, pctOf, TZ, GL_IDS };
if (require.main === module) process.exit(main(process.argv.slice(2)));
