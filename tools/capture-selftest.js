#!/usr/bin/env node
/* tools/capture-selftest.js — offline proof of the swgoh.gg CAPTURE tool (no network; nothing in tests/ is touched).
   NODE_PATH=/home/claude/.npm-global/lib/node_modules node tools/capture-selftest.js
   Serves tools/fixtures/*.html plus synthetic /api/ answers from a local origin, runs tools/swgoh-capture.js in a real
   Chromium page (origin check overridden through window.__holotableCaptureConfig) and checks:
     1. mode all: <=300-char URL-free summary, the .json.gz download, pull-compatible shape, parse-capture round trip
        reproducing the known 31 Oct / 1 Nov facts (GAC S85 4 Nov 09:00 -> 26 Nov 09:00, datacron expiries, SLKR / Leia
        rows, raid tiers, defence boards with hold %), the compact roster line byte-for-byte, and the app's own
        pbmPullText() accepting the file (index.html is loaded read-only in a second page)
     2. Australia/Sydney DST + year rollover through ONE function (resolveSchedule / zonedToUtc)
     3. the bad-timezone refusal (resolveSchedule throws; the CLI exits 2)
     4. the Cloudflare-interstitial stop, the wrong-origin stop
     5. a zero-rows page (un-hydrated shell) -> manifest note + plain-text / embedded-JSON fallback
     6. mode live on two tabs' pages, then mode flush merging the store into the file. */
"use strict";
const { chromium } = require("playwright");
const fs = require("fs"), http = require("http"), path = require("path"), os = require("os"), zlib = require("zlib"), cp = require("child_process");
const TOOLS = __dirname, FX = path.join(TOOLS, "fixtures"), ROOT = path.resolve(TOOLS, "..");
const P = require(path.join(TOOLS, "parse-capture.js"));
const SCRIPT = fs.readFileSync(path.join(TOOLS, "swgoh-capture.js"), "utf8");
const PORT = +(process.env.PORT || 9381), ORIGIN = "http://127.0.0.1:" + PORT;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "capture-selftest-"));
const R = []; const ck = (n, p, d) => { R.push({ check: n, pass: !!p, detail: d == null ? "" : String(d).slice(0, 400) }); if (!p) console.error("FAIL " + n + (d ? " — " + String(d).slice(0, 400) : "")); };
const CODES = { ollie: "229917529", tiny: "295352286" };

/* ---------- synthetic swgoh.gg answers ---------- */
const ROSTER_FILE = fs.readFileSync(path.join(FX, "ollie-roster-31oct.txt"), "utf8").split("\n");
const ROSTER_LINE = ROSTER_FILE[1].trim();
function playerFrom(line, code, name, gp, lu, modN) {
  const units = line.split(",").filter(Boolean).map(tok => {
    const m = /^([A-Z0-9_]+):(\d)\.(\d+)(?:r(\d+))?(\*)?$/.exec(tok); if (!m) throw new Error("bad roster token " + tok);
    const g = +m[3], r = m[4] ? +m[4] : 0;
    return { data: { base_id: m[1], name: m[1].toLowerCase(), rarity: +m[2], gear_level: g, relic_tier: r ? r + 2 : (g >= 13 ? 2 : 1), combat_type: 1, zeta_abilities: r >= 5 ? ["z1"] : [], omicron_abilities: [], ability_data: [] } };
  });
  units.push({ data: { base_id: "CAPITALEXECUTOR", name: "Executor", rarity: 7, gear_level: 1, relic_tier: 1, combat_type: 2 } }, { data: { base_id: "CAPITALPROFUNDITY", name: "Profundity", rarity: 4, gear_level: 1, relic_tier: 1, combat_type: 2 } });
  const mods = Array.from({ length: modN }, (_, i) => ({ id: "m" + i, set: 1 + i % 8, slot: 2 + i % 6, rarity: 6, tier: 5, level: 15, character: "VADER", primary_stat: { name: "Speed", display_value: "30" }, secondary_stats: [] }));
  return { data: { ally_code: +code, name, galactic_power: gp, character_galactic_power: Math.round(gp * 0.58), ship_galactic_power: Math.round(gp * 0.42), last_updated: lu, league_name: "Carbonite", division_number: 4, skill_rating: 1468, arena: { rank: 600 }, fleet_arena: { rank: 80 } }, units, mods, datacrons: [] };
}
const PLAYERS = {
  [CODES.ollie]: playerFrom(ROSTER_LINE, CODES.ollie, "Ollietank", 8440203, "2026-10-31T05:10:38", 952),
  [CODES.tiny]: playerFrom("GLLEIA:7.13r10*,GLREY:7.13r8*,SUPREMELEADERKYLOREN:7.13r8*,GENERALSKYWALKER:7.13r8,VADER:7.13r7,B1BATTLEDROIDV2:5.9", CODES.tiny, "Tiny", 8099135, "2026-10-30T18:32:01", 900)
};
const OPPS = Array.from({ length: 7 }, (_, i) => String(500000001 + i));
OPPS.forEach((c, i) => { PLAYERS[c] = playerFrom("GLREY:7.13r" + (5 + i) + "*,LORDVADER:7.13r8,JANGOFETT:7.12", c, "Opp " + (i + 1), 7000000 + i * 10000, "2026-10-29T10:00:00", 10); });
function bracket(id, start, week, own, ownRank) {
  const players = OPPS.map((c, i) => ({ allyCode: +c, playerLevel: 85, playerName: "Opp " + (i + 1), playerPower: 7000000 + i * 10000, guildName: "Wracker ", bracketRank: i + 2, bracketScore: 1000 - i * 50 }));
  players.splice(1, 0, { allyCode: +own, playerLevel: 85, playerName: "Ollietank", playerPower: 8440203, guildName: "Our Guild", bracketRank: ownRank, bracketScore: 1800 });
  return { startTime: start, leagueId: "CARBONITE", seasonId: "CHAMPIONSHIPS_GRAND_ARENA_GA2_EVENT_SEASON_84", eventId: "O" + Date.parse(start + "Z"), seasonNumber: 84, weekNumber: week, bracketId: id, bracketPlayers: players };
}
const BRACKETS = { [CODES.ollie]: { data: [bracket(8236, "2026-10-21T21:00:00", 3, CODES.ollie, 1), bracket(9320, "2026-10-14T21:00:00", 2, CODES.ollie, 1), bracket(9686, "2026-10-07T21:00:00", 1, CODES.ollie, 1)], message: null, totalCount: 3 },
  [CODES.tiny]: { data: [bracket(4395, "2026-10-21T21:00:00", 3, CODES.tiny, 2)], message: null, totalCount: 1 } };

/* ---------- local origin: fixture pages + api ---------- */
const BASE_ROUTES = { "/schedule/": "schedule.html", "/tier-list/gac/": "tier-gac.html", "/tier-list/gac/?side=defense": "tier-gac-def.html", "/tier-list/3v3/": "tier-3v3.html", "/tier-list/3v3/?side=defense": "tier-3v3-def.html",
  "/tier-list/fleet/": "tier-fleet.html", "/datacrons/": "datacrons.html", "/raids/droid-destruction/": "raid.html", "/cf/": "cf.html", "/schedule-dst/": "schedule-dst.html", "/schedule-newyear/": "schedule-newyear.html", "/schedule-badtz/": "schedule-badtz.html", "/blank/": null };
let routes = Object.assign({}, BASE_ROUTES), hits = [];
const srv = http.createServer((q, s) => {
  hits.push(q.url);
  let m;
  if ((m = /^\/api\/player\/(\d+)\/$/.exec(q.url))) { const p = PLAYERS[m[1]]; s.setHeader("content-type", "application/json"); if (!p) { s.statusCode = 404; return s.end('{"detail":"Not found."}'); } return s.end(JSON.stringify(p)); }
  if ((m = /^\/api\/v2\/gac\/brackets\/recent\/(\d+)\/$/.exec(q.url))) { s.setHeader("content-type", "application/json"); return s.end(JSON.stringify(BRACKETS[m[1]] || { data: [], message: null, totalCount: 0 })); }
  if (q.url === "/app.html") { s.setHeader("content-type", "text/html"); return fs.createReadStream(path.join(ROOT, "index.html")).pipe(s); }
  if (!(q.url in routes)) { s.statusCode = 404; return s.end("not found"); }
  s.setHeader("content-type", "text/html; charset=utf-8");
  s.end(routes[q.url] ? fs.readFileSync(path.join(FX, routes[q.url])) : "<!doctype html><html><head><title>blank</title></head><body><p>blank page</p></body></html>");
});

/* ---------- helpers ---------- */
const urlFree = s => !/:\/\/|[?=]|swgoh\.gg|127\.0\.0\.1/.test(s);
async function run(page, cfg, waitDownload) {
  await page.evaluate(c => { window.__holotableCaptureConfig = c; }, Object.assign({ origin: ORIGIN, toast: false, pauseMs: 10 }, cfg));
  const dlP = waitDownload ? page.waitForEvent("download", { timeout: 90000 }) : null;
  const summary = await page.evaluate(SCRIPT);
  let file = null;
  if (dlP) { const dl = await dlP; file = path.join(TMP, dl.suggestedFilename()); await dl.saveAs(file); }
  const state = await page.evaluate(() => ({ status: window.__holotableCapture.status, name: window.__holotableCapture.name, manifest: window.__holotableCapture.manifest || null }));
  return { summary, file, state };
}
const readGz = f => JSON.parse(zlib.gunzipSync(fs.readFileSync(f)).toString("utf8"));
async function pageOut(page) { return page.evaluate(() => { const o = window.__holotableCapture.out; return o ? { pages: o.pages, manifest: o.manifest } : null; }); }

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 }, timezoneId: "Australia/Sydney" });
  await ctx.route(/fonts\.g|swgoh\.gg|swgohrote\.com|corsproxy|allorigins|codetabs|api\.github|google/, r => r.abort());
  const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", e => errs.push(String(e).slice(0, 300)));

  /* ===== 1. mode all from /schedule/ ===== */
  await page.goto(ORIGIN + "/schedule/", { waitUntil: "domcontentloaded" });
  const A = await run(page, { mode: "all" }, true);
  ck("1a summary is <= 300 chars and carries no URL / query string / host", A.summary.length <= 300 && A.summary.length > 40 && urlFree(A.summary), A.summary);
  ck("1b summary names the file stem, per-page row counts and 'no issues'", /^holotable-capture-\d{4}-\d{2}-\d{2}-\d{4} json\.gz \d+KB saved/.test(A.summary) && /schedule 19, 5v5 30, 5v5def 9, 3v3 12, 3v3def 5, fleet 6, dcron 7, raid 8/.test(A.summary) && /no issues/.test(A.summary), A.summary);
  ck("1c a holotable-capture-YYYY-MM-DD-HHmm.json.gz download happened and is gzip", A.file && /^holotable-capture-\d{4}-\d{2}-\d{2}-\d{4}\.json\.gz$/.test(path.basename(A.file)) && fs.readFileSync(A.file)[0] === 0x1f, A.file);
  const J = readGz(A.file);
  ck("1d file shape: pull-compatible keys + pages/manifest/captureVersion", J.type === "holotable-pull" && J.v === 1 && typeof J.at === "number" && J.accounts.ollie && J.accounts.tiny && J.gac.ollie && J.gac.tiny && J.captureVersion === 1 && ["schedule", "tierGac", "tierGacDef", "tier3v3", "tier3v3Def", "tierFleet", "datacrons", "raid"].every(k => J.pages[k] && Array.isArray(J.pages[k].rows)) && J.manifest.pages.raid, Object.keys(J).join(","));
  ck("1e accounts are the RAW /api/player answers (byte-compatible with the bookmarklet pull)", JSON.stringify(J.accounts.ollie) === JSON.stringify(PLAYERS[CODES.ollie]) && JSON.stringify(J.accounts.tiny) === JSON.stringify(PLAYERS[CODES.tiny]), "");
  ck("1f gac half: raw bracket answer + 7 scouted opponent rosters per account (own codes skipped)", J.gac.ollie.bracket.data.length === 3 && Object.keys(J.gac.ollie.players).length === 7 && !J.gac.ollie.players[CODES.ollie] && Object.keys(J.gac.tiny.players).length === 7, JSON.stringify(J.manifest.gac));
  ck("1g defence boards were discovered from the offence pages' links and flagged as defence", J.manifest.pages.tierGacDef.discovered === true && J.manifest.pages.tierGacDef.path === "/tier-list/gac/?side=defense" && J.manifest.pages.tier3v3Def.discovered === true && J.pages.tierGacDef.side === "defence" && J.pages.tier3v3Def.side === "defence", JSON.stringify([J.manifest.pages.tierGacDef.tried, J.manifest.pages.tier3v3Def.tried]));
  ck("1h page text kept (capped) and the schedule's embedded JSON captured", J.pages.schedule.text.length > 500 && J.pages.schedule.json.length === 1 && /Australia\/Sydney/.test(J.pages.schedule.json[0]), "");
  /* parse-capture CLI + API */
  const outFile = path.join(TMP, "refresh.json");
  const cli = cp.spawnSync(process.execPath, [path.join(TOOLS, "parse-capture.js"), A.file, outFile], { encoding: "utf8" });
  ck("1i parse-capture CLI exits 0 and writes refresh.json", cli.status === 0 && fs.existsSync(outFile), cli.stderr + cli.stdout.slice(0, 300));
  const F = JSON.parse(fs.readFileSync(outFile, "utf8"));
  ck("1j compact roster line reproduces ref31/ollie-roster-31oct.txt byte for byte (ships omitted, GL *)", F.rosters.ollie.compact === ROSTER_LINE, F.rosters.ollie.compact.slice(0, 120));
  ck("1k roster header/meta: GP, last_updated, 952 mods, 4 GLs with relics (Leia R6, Rey R8, Jabba R9, SLKR R9)", /^# Ollie \(229917529\) chars only, swgoh\.gg API, last_updated 2026-10-31T05:10Z\. format ID:stars\.gear\[rN relic\]\[\*=GL\]\. Ships omitted\./.test(F.rosters.ollie.compactHeader) && F.rosters.ollie.gp === 8440203 && F.rosters.ollie.mods === 952 && F.rosters.ollie.ships === 2 && F.rosters.ollie.gls.map(g => g.id + ":" + g.relic).sort().join() === "GLLEIA:6,GLREY:8,JABBATHEHUTT:9,SUPREMELEADERKYLOREN:9" && F.rosters.tiny.gls.find(g => g.id === "GLLEIA").relic === 10, F.rosters.ollie.compactHeader + " | " + JSON.stringify(F.rosters.ollie.gls));
  const g = F.gac.ollie.current;
  ck("1l GAC summary: newest bracket S84 w3 #8236 start 2026-10-21T21:00, Ollie rank 1 of 8, 7 scouted, 2 previous rounds", g && g.season === 84 && g.week === 3 && String(g.bracketId) === "8236" && g.start === "2026-10-21T21:00:00" && g.ownRank === 1 && g.size === 8 && F.gac.ollie.scoutedPlayers === 7 && F.gac.ollie.previous.length === 2 && g.players.filter(p => p.scouted).length === 7 && g.league === "CARBONITE", JSON.stringify(F.gac.ollie).slice(0, 300));
  const ev = F.schedule.events, byT = t => ev.find(e => e.title === t);
  ck("1m schedule: TZ Australia/Sydney from 'TIMES IN AUSTRALIAN EASTERN TIME', anchor 2026-11-01 from 'At Sun Nov 1', 19 rows, no errors", F.schedule.tz === "Australia/Sydney" && F.schedule.anchorDate === "2026-11-01" && ev.length === 19 && F.schedule.errors.length === 0 && F.schedule.warnings.length === 0, JSON.stringify(F.schedule.warnings));
  const gac = byT("Grand Arena Championship Season 85 begins");
  ck("1n GAC S85: Wed 4 Nov 09:00 AEDT -> 2026-11-03T22:00Z, ends Thu 26 Nov 09:00 -> 2026-11-25T22:00Z; date 2026-11-04, ends 2026-11-26 (3v3)", gac && gac.date === "2026-11-04" && gac.startUtc === "2026-11-03T22:00:00.000Z" && gac.endUtc === "2026-11-25T22:00:00.000Z" && gac.ends === "2026-11-26" && gac.subtitle === "3v3" && gac.kind === "Grand Arena", JSON.stringify(gac));
  const c4 = byT("Droid Destruction Cache IV"), tw = ev.find(e => e.title === "Territory War" && e.subtitle === "Sign-up"), ch = byT("Credit Heist"), pop = ev.find(e => e.title === "Places of Power" && e.date === "2026-10-31"), bonus = byT("Bonus Drops"), cotp = byT("Champion of the Pit");
  ck("1o last-live-day rule: 'Ends Nov 4, 3:00 AM' -> ends 2026-11-03; TW sign-up ends 4 Nov 06:00 -> 2026-11-03; Credit Heist 22:00 -> same day; 18:00 -> same day; 11:00 -> same day; Pit 14 Nov 06:00 -> 2026-11-13",
    c4 && c4.ends === "2026-11-03" && c4.endUtc === "2026-11-03T16:00:00.000Z" && c4.date === "2026-10-31" && tw && tw.ends === "2026-11-03" && tw.startUtc === "2026-11-01T20:00:00.000Z" && ch && ch.ends === "2026-11-02" && pop && pop.ends === "2026-11-01" && bonus && bonus.ends === "2026-11-06" && cotp && cotp.ends === "2026-11-13" && cotp.date === "2026-11-03", JSON.stringify([c4, tw, ch].map(e => e && [e.title, e.date, e.ends, e.endUtc])));
  const fd = byT("Fanatical Devotion"), pp = byT("Pieces and Plans"), era = ev.filter(e => /^Era of .* ends$/.test(e.title || ""));
  ck("1p predicted rows carry PREDICTED + confidence and no end; 'Era … ends' titles are titles, not end texts (18 Nov 06:00)", fd && fd.predicted && fd.confidence === "HIGH" && fd.date === "2026-11-04" && !fd.endUtc && pp && pp.predicted && pp.confidence === "MEDIUM" && pp.date === "2026-11-10" && era.length === 2 && era.every(e => e.date === "2026-11-18" && e.startUtc === "2026-11-17T19:00:00.000Z" && !e.endsText), JSON.stringify([fd, pp, era[0]]));
  const b5 = F.boards.tierGac, bd = F.boards.tierGacDef, b3 = F.boards.tier3v3, b3d = F.boards.tier3v3Def, bf = F.boards.tierFleet;
  ck("1q 5v5 offence: 30 rows, S84, #1 SLKR S 91.4% 134K elo 3201 (+Rey DSV…); #3 Leia 90.0% 142K; #7 Baylan datacron-dependent; #8 Bane NEW; tiers S/A/B", b5.count === 30 && b5.season === 84 && b5.side === "offence" && b5.rows[0].leader === "Supreme Leader Kylo Ren" && b5.rows[0].tier === "S" && b5.rows[0].winPct === 91.4 && b5.rows[0].battlesN === 134000 && b5.rows[0].elo === 3201 && b5.rows[0].units[1] === "Rey (Dark Side Vision)" && b5.rows[2].leader === "Leia Organa" && b5.rows[2].winPct === 90 && b5.rows[2].battles === "142K" && b5.rows[6].dc === true && b5.rows[6].leader === "Baylan Skoll" && b5.rows[7].trend === "NEW" && b5.rows[5].tier === "A" && b5.rows[19].tier === "B" && b5.rankGaps.length === 0, JSON.stringify(b5.rows.slice(0, 2)) + JSON.stringify(b5.rows[19]));
  ck("1r 5v5 DEFENCE: hold % captured as label/value stats, #2 SLKR hold 46.4% over 139K, #5 Leia 26.2%, #7 Lord Vader 28.7%/107K, rank gaps reported (hidden rows)", bd.count === 9 && bd.side === "defence" && bd.rows[1].leader === "Supreme Leader Kylo Ren" && bd.rows[1].holdPct === 46.4 && bd.rows[1].battlesN === 139000 && bd.rows[1].winPct === null && bd.rows[1].stats.some(s => s.label === "Hold %" && s.value === "46.4%") && bd.rows[1].stats.some(s => s.label === "Avg banners" && s.value === "41.0") && bd.rows[4].leader === "Leia Organa" && bd.rows[4].holdPct === 26.2 && bd.rows[6].holdPct === 28.7 && bd.rankGaps.includes(8) && bd.rankGaps.includes(22) && !bd.suspicious.some(s => /hold/.test(s)), JSON.stringify(bd.rows[1]) + JSON.stringify(bd.suspicious));
  ck("1s 3v3 offence S83 (table markup, '#1' ranks): Stranger+Maul(HF)+Starkiller 91.2%/86.4K; Rey+Ben Solo+Rey JT 80.8%/3,841; 3v3 defence: Hold %/Banners columns, #2 SLKR hold 44.1%", b3.count === 12 && b3.season === 83 && b3.rows[0].units.join("+") === "The Stranger+Maul (Hate-Fueled)+Starkiller" && b3.rows[0].winPct === 91.2 && b3.rows[0].battles === "86.4K" && b3.rows[8].battlesN === 3841 && b3.rows[8].units[1] === "Ben Solo" && b3.rows[11].tier === "A" && b3d.count === 5 && b3d.side === "defence" && b3d.rows[1].holdPct === 44.1 && b3d.rows[1].stats.some(s => s.label === "Banners" && s.value === "24.0") && b3d.colHeaders.includes("Hold %"), JSON.stringify([b3.rows[8], b3d.rows[1]]));
  ck("1t fleet S84 (list markup, tier from class): Leviathan S 96.6%/44.7K; Profundity A 98.6%; Home One NEW 2,025; Endurance C ▼2 50.8%", bf.count === 6 && bf.rows[0].leader === "Leviathan" && bf.rows[0].tier === "S" && bf.rows[0].winPct === 96.6 && bf.rows[0].battlesN === 44700 && bf.rows[1].tier === "A" && bf.rows[3].trend === "NEW" && bf.rows[3].battlesN === 2025 && bf.rows[5].tier === "C" && bf.rows[5].trend === "▼2" && bf.rows[5].winPct === 50.8, JSON.stringify(bf.rows[5]));
  const D = F.datacrons, dn = n => D.sets.find(s => s.name === n);
  ck("1u datacrons: Legend Codex (Set 36, FOCUSED) 2027-01-20, Duty and Defiance 2026-12-24, Art of Command 2026-11-26 = next to expire; Supremacy Directive (Set 33, focused) EXPIRED 2026-10-29; 7 sets", D.count === 7 && dn("The Legend Codex").expiresDate === "2027-01-20" && dn("The Legend Codex").focused && dn("The Legend Codex").setNo === 36 && !dn("The Legend Codex").expired && dn("Duty and Defiance").expiresDate === "2026-12-24" && dn("The Art of Command").expiresDate === "2026-11-26" && D.nextToExpire.name === "The Art of Command" && dn("Supremacy Directive").expired && dn("Supremacy Directive").focused && dn("Supremacy Directive").setNo === 33 && dn("Supremacy Directive").expiresDate === "2026-10-29" && dn("Peace & Power").expired && D.active.length === 3 && dn("The Legend Codex").tags.includes("Bossk"), JSON.stringify(D.sets.map(s => [s.name, s.expiresDate, s.expired])));
  const RD = F.raid;
  ck("1v raid: 'UPCOMING RAID · NOVEMBER 2026', ALLOWED UNITS 33 (30 out now), max score 18M, in development / no release date, 8 tiers, T1 = Gear XII, T7 3.6M/18M", /UPCOMING RAID · NOVEMBER 2026/.test(RD.banner) && /33 \(30 out now\)/.test(RD.allowedUnits) && /18M/.test(RD.maxScore) && /In development/.test(RD.releaseText) && /No release date/.test(RD.releaseText) && RD.tierCount === 8 && RD.tiers[1].tier === "T1" && RD.tiers[1].requirement === "Gear XII" && RD.tiers[7].score === "3.6M" && RD.tiers[7].all === "18M", JSON.stringify(RD).slice(0, 300));
  ck("1w coverage manifest: nothing missing, nothing text-only, no suspicious entries", F.coverage.missing.length === 0 && F.coverage.textOnly.length === 0 && F.coverage.suspicious.length === 0 && F.coverage.issues.length === 0 && Object.keys(F.coverage.pages).length === 8, JSON.stringify(F.coverage.suspicious));
  /* the app itself accepts the file (read-only use of index.html: pbmPullText -> confirm card) */
  try {
    const app = await ctx.newPage(); const appErrs = []; app.on("pageerror", e => appErrs.push(String(e).slice(0, 200)));
    await app.goto(ORIGIN + "/app.html", { waitUntil: "domcontentloaded" }); await app.waitForTimeout(1200);
    const txt = zlib.gunzipSync(fs.readFileSync(A.file)).toString("utf8");
    const res = await app.evaluate(([t, n]) => { const ok = pbmPullText(t, n); const el = document.getElementById("pbmConfirm"); return { ok, card: el ? el.innerText.slice(0, 400) : "", hidden: el ? el.hidden : null }; }, [txt, path.basename(A.file)]);
    ck("1x index.html's own pbmPullText() accepts the capture file as a pull (extra keys ignored): confirm card offers Ollie + Tiny + GAC bracket", res.ok === true && res.hidden === false && /Import roster from swgoh\.gg/.test(res.card) && /Ollie/.test(res.card) && /Tiny/.test(res.card) && /8\.44M GP/.test(res.card) && /GAC/i.test(res.card), JSON.stringify(res) + " " + appErrs.join(" | "));
    await app.close();
  } catch (e) { ck("1x index.html's own pbmPullText() accepts the capture file", false, String(e).slice(0, 300)); }

  /* ===== 2. DST + rollover through resolveSchedule / zonedToUtc ===== */
  const z = (y, m, d, h, mi) => new Date(P.zonedToUtc(y, m, d, h, mi, "Australia/Sydney")).toISOString();
  ck("2a zonedToUtc: AEST before 4 Oct 2026 (+10), AEDT after (+11), spring-forward gap 02:30 -> 03:30 AEDT, fall-back 4 Apr 2027 02:30 -> first (DST) reading, mid-winter +10",
    z(2026, 10, 3, 18, 0) === "2026-10-03T08:00:00.000Z" && z(2026, 10, 5, 18, 0) === "2026-10-05T07:00:00.000Z" && z(2026, 10, 4, 2, 30) === "2026-10-03T16:30:00.000Z" && z(2027, 4, 4, 2, 30) === "2027-04-03T15:30:00.000Z" && z(2027, 4, 4, 3, 30) === "2027-04-03T17:30:00.000Z" && z(2026, 7, 1, 12, 0) === "2026-07-01T02:00:00.000Z" && z(2026, 11, 4, 9, 0) === "2026-11-03T22:00:00.000Z", [z(2026, 10, 4, 2, 30), z(2027, 4, 4, 2, 30)].join(" "));
  const dstCap = await (async () => { routes["/schedule/"] = "schedule-dst.html"; await page.goto(ORIGIN + "/schedule/", { waitUntil: "domcontentloaded" }); await run(page, { mode: "all", apis: false, download: false, iframe: false }); return (await pageOut(page)).pages.schedule; })();
  const DS = P.resolveSchedule(dstCap, Date.parse("2026-10-03T05:00:00Z"));
  const gw = DS.events.find(e => e.title === "Ground War"), pg = DS.events.find(e => e.title === "Pre-gap pack"), cq = DS.events.find(e => e.title === "Conquest Vol. 25");
  ck("2b a row spanning the 4 Oct 2026 AEDT start: Ground War Sat 3 Oct 18:00 AEST -> 08:00Z, ends Mon 5 Oct 18:00 AEDT -> 07:00Z (last live day 5 Oct)", DS.tz === "Australia/Sydney" && DS.anchorDate === "2026-10-03" && gw && gw.startUtc === "2026-10-03T08:00:00.000Z" && gw.endUtc === "2026-10-05T07:00:00.000Z" && gw.startOffsetMin === 600 && gw.endOffsetMin === 660 && gw.date === "2026-10-03" && gw.ends === "2026-10-05", JSON.stringify(gw));
  ck("2c end inside the DST gap (Oct 4, 2:30 AM) resolves to 03:30 AEDT = 2026-10-03T16:30Z and, being before 06:00, last live day 3 Oct; '14 days · ends Oct 18, 5:00 AM' parses (Conquest, start Sun 4 Oct 05:00 AEDT -> 03T18:00Z, ends 17 Oct)", pg && pg.startUtc === "2026-10-02T15:30:00.000Z" && pg.endUtc === "2026-10-03T16:30:00.000Z" && pg.ends === "2026-10-03" && cq && cq.date === "2026-10-04" && cq.startUtc === "2026-10-03T18:00:00.000Z" && cq.endUtc === "2026-10-17T18:00:00.000Z" && cq.ends === "2026-10-17", JSON.stringify([pg, cq]));
  const nyCap = await (async () => { routes["/schedule/"] = "schedule-newyear.html"; await page.goto(ORIGIN + "/schedule/", { waitUntil: "domcontentloaded" }); await run(page, { mode: "all", apis: false, download: false, iframe: false }); return (await pageOut(page)).pages.schedule; })();
  const NY = P.resolveSchedule(nyCap, Date.parse("2026-12-30T00:00:00Z")), gb = NY.events.find(e => e.title === "Galactic Bounties I"), hoth = NY.events.find(e => e.title === "Hoth");
  ck("2d Dec -> Jan rollover: 'At Wed Dec 30' anchors 2026; 'Ends Jan 2, 5:00 AM' -> 2027-01-01T18:00Z (last live day 2027-01-01); 'Fri, Jan 1' day header -> 2027-01-01 (weekday check passes)", NY.anchorDate === "2026-12-30" && gb && gb.date === "2026-12-30" && gb.startUtc === "2026-12-30T07:00:00.000Z" && gb.endUtc === "2027-01-01T18:00:00.000Z" && gb.ends === "2027-01-01" && hoth && hoth.date === "2027-01-01" && hoth.startUtc === "2027-01-01T08:00:00.000Z" && hoth.ends === "2027-01-02" && NY.warnings.length === 0, JSON.stringify([gb, hoth, NY.warnings]));
  const NY2 = P.resolveSchedule(nyCap, Date.parse("2027-01-03T00:00:00Z"));
  ck("2e the same page captured on 3 Jan 2027 still anchors 'At Wed Dec 30' to 2026 (closest year to the capture)", NY2.anchorDate === "2026-12-30" && NY2.events.find(e => e.title === "Hoth").date === "2027-01-01", NY2.anchorDate);
  ck("2f lastLiveDay: 06:00 and earlier -> previous day, 06:01 and later -> same day", P.lastLiveDay({ y: 2026, m: 11, d: 4, hh: 6, mm: 0, date: "2026-11-04" }) === "2026-11-03" && P.lastLiveDay({ y: 2026, m: 11, d: 4, hh: 3, mm: 0, date: "2026-11-04" }) === "2026-11-03" && P.lastLiveDay({ y: 2026, m: 11, d: 4, hh: 6, mm: 1, date: "2026-11-04" }) === "2026-11-04" && P.lastLiveDay({ y: 2026, m: 11, d: 26, hh: 9, mm: 0, date: "2026-11-26" }) === "2026-11-26" && P.lastLiveDay({ y: 2027, m: 1, d: 1, hh: 5, mm: 0, date: "2027-01-01" }) === "2026-12-31", "");

  /* ===== 3. bad timezone -> refusal ===== */
  const badCap = await (async () => { routes["/schedule/"] = "schedule-badtz.html"; await page.goto(ORIGIN + "/schedule/", { waitUntil: "domcontentloaded" }); await run(page, { mode: "all", apis: false, download: false, iframe: false }); return (await pageOut(page)).pages.schedule; })();
  let threw = null; try { P.resolveSchedule(badCap, Date.now()); } catch (e) { threw = e; }
  ck("3a 'TIMES IN PACIFIC TIME' -> resolveSchedule throws BAD_TZ naming the label", threw && threw.code === "BAD_TZ" && /PACIFIC TIME/.test(threw.message) && badCap.tzLabel === "TIMES IN PACIFIC TIME", threw && threw.message);
  const badFile = path.join(TMP, "bad-tz.json.gz"); fs.writeFileSync(badFile, zlib.gzipSync(JSON.stringify(Object.assign({}, J, { pages: Object.assign({}, J.pages, { schedule: badCap }) }))));
  const cli2 = cp.spawnSync(process.execPath, [path.join(TOOLS, "parse-capture.js"), badFile, path.join(TMP, "bad.json")], { encoding: "utf8" });
  const cli3 = cp.spawnSync(process.execPath, [path.join(TOOLS, "parse-capture.js"), badFile, path.join(TMP, "bad-forced.json"), "--tz-override"], { encoding: "utf8" });
  ck("3b CLI exits 2 with a loud REFUSED message and writes nothing; --tz-override computes anyway with a warning in coverage.suspicious", cli2.status === 2 && /REFUSED/.test(cli2.stderr) && !fs.existsSync(path.join(TMP, "bad.json")) && cli3.status === 0 && fs.existsSync(path.join(TMP, "bad-forced.json")) && JSON.parse(fs.readFileSync(path.join(TMP, "bad-forced.json"), "utf8")).coverage.suspicious.some(s => /TZ OVERRIDE/.test(s)), cli2.stderr.slice(0, 200));
  const over = P.resolveSchedule(badCap, Date.now(), { tzOverride: true });
  ck("3c with the override the Pacific page is still computed in Australia/Sydney and says so", over.tz === "Australia/Sydney" && over.warnings.some(w => /TZ OVERRIDE/.test(w)) && over.events.length === 1, JSON.stringify(over.warnings));
  routes["/schedule/"] = "schedule.html";

  /* ===== 4. Cloudflare interstitial and wrong origin ===== */
  await page.goto(ORIGIN + "/cf/", { waitUntil: "domcontentloaded" });
  const hitsBefore = hits.length; const CF = await run(page, { mode: "all" }, false);
  ck("4a on the 'Just a moment…' page the script reports BLOCKED and stops (no fetches, no download)", /^BLOCKED: the Cloudflare check/.test(CF.summary) && CF.state.status === "cloudflare" && hits.length === hitsBefore && urlFree(CF.summary), CF.summary);
  await page.goto(ORIGIN + "/schedule/", { waitUntil: "domcontentloaded" });
  const WO = await run(page, { mode: "all", origin: "https://swgoh.gg" }, false);
  ck("4b on another origin (default config) the script says it is not on swgoh.gg and stops", /^NOT on the expected site/.test(WO.summary) && WO.state.status === "wrong-origin", WO.summary);
  /* a fetched page that is itself the Cloudflare challenge is recorded as a failure, not parsed as content */
  routes["/datacrons/"] = "cf.html";
  const CF2 = await run(page, { mode: "all", apis: false, download: false, iframe: false }, false);
  const cf2m = (await pageOut(page)).manifest.pages.datacrons;
  ck("4c a page answer that is the Cloudflare challenge is flagged 'cloudflare-challenge' in the manifest and the summary lists it under ISSUES", cf2m.ok === false && cf2m.notes.includes("cloudflare-challenge") && /ISSUES:.*dcron|ISSUES:.*datacrons/.test(CF2.summary) && /dcron FAIL/.test(CF2.summary), CF2.summary + " " + JSON.stringify(cf2m));
  routes["/datacrons/"] = "datacrons.html";

  /* ===== 5. zero rows -> manifest note + text fallback (fetch, live tab and iframe all see the shell) ===== */
  routes["/schedule/"] = "schedule-empty.html";
  await page.goto(ORIGIN + "/schedule/", { waitUntil: "domcontentloaded" });
  const Z = await run(page, { mode: "all", apis: false, download: false, iframe: true }, false);
  const zo = await pageOut(page), zm = zo.manifest.pages.schedule, zp = zo.pages.schedule;
  ck("5a un-hydrated shell: 0 rows recorded, plain-text fallback kept, embedded JSON kept, live-tab and iframe comparisons noted, summary shows 'schedule 0' under ISSUES", zm.ok && zm.rows === 0 && zp.rows.length === 0 && /Loading the event schedule/.test(zp.text) && zp.json.length === 1 && /Places of Power/.test(zp.json[0]) && zm.notes.some(n => /plain-text fallback/.test(n)) && zm.notes.some(n => /live tab 0 rows/.test(n)) && zm.notes.some(n => /iframe/.test(n)) && /schedule 0\b/.test(Z.summary) && /ISSUES:.*schedule 0 rows \(text only\)/.test(Z.summary), Z.summary + " " + JSON.stringify(zm.notes));
  const ZF = P.parseCapture(Object.assign({}, J, { pages: Object.assign({}, J.pages, { schedule: zp }), manifest: Object.assign({}, J.manifest, { pages: Object.assign({}, J.manifest.pages, { schedule: zm }) }) }));
  ck("5b parse-capture lists the page under coverage.textOnly and still parses everything else", ZF.coverage.textOnly.join() === "schedule" && ZF.coverage.missing.length === 0 && ZF.schedule.events.length === 0 && ZF.boards.tierGac.count === 30, JSON.stringify(ZF.coverage.textOnly));
  routes["/schedule/"] = "schedule.html";
  ck("5c the text cap is larger for 0-row pages (<= 60 KB) than for parsed pages (<= 20 KB)", zp.text.length <= 61440 && J.pages.tierGac.text.length <= 20480 && J.pages.tierGac.textTruncated === false, "");

  /* ===== 6. mode live x2, then mode flush ===== */
  await page.goto(ORIGIN + "/tier-list/gac/?side=defense", { waitUntil: "domcontentloaded" });
  const L1 = await run(page, { mode: "live" }, false);
  await page.goto(ORIGIN + "/datacrons/", { waitUntil: "domcontentloaded" });
  const L2 = await run(page, { mode: "live" }, false);
  ck("6a mode live extracts the CURRENT tab only (defence board detected from ?side=defense, then datacrons) and reports the store contents", /^live tierGacDef: 9 rows/.test(L1.summary) && /store has: tierGacDef 9/.test(L1.summary) && /^live datacrons: 7 rows/.test(L2.summary) && /store has: tierGacDef 9, datacrons 7/.test(L2.summary) && urlFree(L1.summary) && urlFree(L2.summary), L1.summary + " || " + L2.summary);
  const stored = await page.evaluate(k => ({ s: !!sessionStorage.getItem(k), l: !!localStorage.getItem(k), keys: Object.keys(JSON.parse(localStorage.getItem(k) || "{}").pages || {}) }), "__holotableCaptureStore");
  ck("6b the live store is in sessionStorage AND localStorage (survives navigation; other tabs of the origin see it)", stored.s && stored.l && stored.keys.join() === "tierGacDef,datacrons", JSON.stringify(stored));
  await page.goto(ORIGIN + "/blank/", { waitUntil: "domcontentloaded" });
  const L3 = await run(page, { mode: "live" }, false);
  ck("6c mode live on a non-capture page says so and stores nothing", /not one of the capture pages/.test(L3.summary) && L3.state.status === "live-unknown-page", L3.summary);
  const FL = await run(page, { mode: "flush" }, true);
  const JF = readGz(FL.file);
  ck("6d mode flush: APIs fetched, the two live pages come from the store (page.source live, manifest live-store, marked * in the summary), the other six are fetched, and the store is cleared", JF.pages.tierGacDef.source === "live" && JF.pages.datacrons.source === "live" && JF.manifest.pages.tierGacDef.source === "live-store" && JF.manifest.pages.datacrons.source === "live-store" && JF.pages.schedule.source === "fetch" && JF.pages.tierGac.source === "fetch" && JF.accounts.ollie && Object.keys(JF.gac.ollie.players).length === 7 && /5v5def 9\*/.test(FL.summary) && /dcron 7\*/.test(FL.summary) && JF.mode === "flush" && !(await page.evaluate(k => sessionStorage.getItem(k) || localStorage.getItem(k), "__holotableCaptureStore")), FL.summary);
  const FF = P.parseCapture(JF);
  ck("6e the flushed file parses like the fetched one (same 5v5 defence hold % for SLKR, same datacron expiries)", FF.boards.tierGacDef.rows[1].holdPct === 46.4 && FF.datacrons.sets[0].expiresDate === "2027-01-20" && FF.coverage.missing.length === 0, "");

  /* ===== 7. hygiene ===== */
  ck("7a no uncaught page errors during any run", errs.length === 0, errs.join(" | "));
  ck("7b swgoh-capture.js is one async IIFE expression (javascript_tool text) under 48 KB, with the ally codes and mode switch at the top", /^\/\*[\s\S]*?\*\/\s*\(async \(\) => \{/.test(SCRIPT) && /\}\)\(\)\s*$/.test(SCRIPT) && SCRIPT.length < 49152 && SCRIPT.indexOf('ollie: "229917529", tiny: "295352286"') > 0 && SCRIPT.indexOf('mode: "all"') < 2500, SCRIPT.length + " bytes");
  ck("7c the fixture defence boards are marked synthetic", /SYNTHETIC FIXTURE/.test(fs.readFileSync(path.join(FX, "tier-gac-def.html"), "utf8")) && /SYNTHETIC FIXTURE/.test(fs.readFileSync(path.join(FX, "tier-3v3-def.html"), "utf8")), "");

  /* ===== 8. real-shaped squad normalisation (fixtures/real-tier-rows-1nov.json = DERIVED FROM REAL CAPTURE 1 Nov 2026: trimmed raw extractor rows with unmodified leaves) ===== */
  const RS = JSON.parse(fs.readFileSync(path.join(FX, "real-tier-rows-1nov.json"), "utf8")), rb = k => P.tierBoard(Object.assign({ title: "real 1 Nov", source: "fetch", colHeaders: [] }, RS.boards[k]), k, { ok: true, discovered: true });
  const RS5 = rb("tierGac"), RSD = rb("tierGacDef"), RSF = rb("tierFleet"), q5 = RS5.squads;
  ck("8a real-shaped 5v5 rows (squad + 3 datacron-tooltip rows per squad, positional rank guesses): tooltip noise dropped, only Elo squads kept, ranks from the '#N' leaf", /derived from real capture 1 Nov/.test(RS._note) && RS5.rowCount === 10 && RS5.count === 7 && RS5.droppedRows === 3 && q5.map(q => q.rank).join() === "1,2,4,7,8,21,84" && q5.every(q => q.rankSource === "page") && !q5.some(q => /Sample-size|Whenever|Light Side allies/.test(q.units.join())) && RS5.rows.length === 10, JSON.stringify(RS5.squadCoverage));
  ck("8b real squad fields: #1 SLKR S 2437 91.4% 134K (134000) 67 builds ▲1, units in page order; #4 Cere A→S ▲5; #7 Baylan DATACRON dependent NEW; #8 Bane+Dooku 2 units; #21 Rotta 1 unit flagged short; #84 negative Elo", q5[0].leader === "Supreme Leader Kylo Ren" && q5[0].units.join("|") === "Supreme Leader Kylo Ren|Rey (Dark Side Vision)|Sith Trooper|General Hux|Kylo Ren (Unmasked)" && q5[0].tier === "S" && q5[0].elo === 2437 && q5[0].win === 91.4 && q5[0].hold === null && q5[0].battles === "134K" && q5[0].battlesN === 134000 && q5[0].builds === 67 && q5[0].trendText === "▲1" && q5[0].trend === 1 && q5[0].datacronDependent === false
    && q5[2].leader === "Cere Junda" && q5[2].tierChange === "A→S" && q5[2].trend === 5 && q5[2].tier === "S" && q5[3].leader === "Baylan Skoll" && q5[3].datacronDependent === true && q5[3].isNew === true && q5[3].tier === "A" && q5[4].units.join("+") === "Darth Bane+Count Dooku" && q5[4].win === 85 && q5[4].trendText === "—" && q5[5].unitCount === 1 && q5[5].flags.includes("short") && q5[6].elo < 0 && q5[6].flags.includes("negative-elo"), JSON.stringify(q5.slice(0, 1)) + JSON.stringify(q5[3]));
  const qd = RSD.squads;
  ck("8c real-shaped DEFENCE rows: hold % (not win), a squad row with a tooltip LEAKED onto its leaves keeps exactly its 5 units (no dup Kix) and is flagged, the missing #98 is a reported rank gap, the gap is a single informational note, not a suspicious entry", RSD.rowCount === 11 && qd.map(q => q.rank).join() === "1,2,97,99,105" && qd[0].leader === "The Stranger" && qd[0].hold === 53.2 && qd[0].win === null && qd[0].battlesN === 51000 && qd[0].builds === 221 && qd[0].trendText === "—" && qd[1].hold === 46.3 && qd[1].battles === "10.8K"
    && qd[4].unitCount === 5 && qd[4].units.join() === "Captain Silvo,Brutus,Kix,Quiggold,Vane" && qd[4].flags.includes("tooltip-leak") && qd[4].isNew && qd[4].builds === 4 && qd[4].battles === "93" && RSD.squadCoverage.rankGaps.includes(98) && RSD.squadCoverage.strictlyIncreasing === true && RSD.squadCoverage.contiguous === false && RSD.suspicious.length === 0 && RSD.notes.length === 1 && /missing/.test(RSD.notes[0]) && !RSD.suspicious.some(x => /guess|without a tier|duplicate/.test(x)), JSON.stringify([RSD.suspicious, RSD.squadCoverage.rankGapRanges, qd[4]]));
  ck("8d real-shaped fleet rows: tier letters from the heading ('S','tier','S' heading leaves leak into the first rows), Meta Explorer link text is not a unit/tooltip squad, Elo 3110 96.6% 44.7K 80 builds, contiguous #1-#3, no false alarms", RSF.count === 3 && RSF.squads[0].leader === "Leviathan" && RSF.squads[0].units.length === 4 && RSF.squads[0].tier === "S" && RSF.squads[1].tier === "A" && RSF.squads[2].tier === "B" && RSF.squads[0].elo === 3110 && RSF.squads[0].win === 96.6 && RSF.squads[0].battlesN === 44700 && RSF.squads[0].builds === 80 && RSF.squads[0].datacronDependent === false && RSF.squadCoverage.contiguous && RSF.suspicious.length === 0, JSON.stringify(RSF.squads[0]));
  ck("8e the synthetic offline fixtures (no Elo in some, plain rank column) still normalise: every board's squads == its rows, page ranks, no false 'positional guess' alarm", ["tierGac", "tierGacDef", "tier3v3", "tier3v3Def", "tierFleet"].every(k => F.boards[k].squads.length === F.boards[k].rowCount && F.boards[k].squads.every(q => q.rankSource === "page")) && F.boards.tierGac.squads[0].elo === 3201 && F.boards.tierGac.squads[0].win === 91.4 && F.boards.tierGacDef.squads[1].hold === 46.4 && F.boards.tier3v3Def.squads[1].hold === 44.1 && F.boards.tier3v3Def.squads[1].bannersN === 24 && F.boards.tierGac.squads[6].datacronDependent === true && !F.coverage.suspicious.some(x => /guess|duplicate leaders/.test(x)), JSON.stringify(F.coverage.suspicious));

  await browser.close(); srv.close();
  const passed = R.filter(r => r.pass).length, failed = R.length - passed;
  console.log(JSON.stringify({ passed, failed, tmp: TMP, results: R.map(r => r.pass ? r.check : { FAIL: r.check, detail: r.detail }) }, null, 1));
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error("selftest crashed:", e && e.stack || e); console.log(JSON.stringify({ passed: R.filter(r => r.pass).length, failed: R.length - R.filter(r => r.pass).length + 1, results: R }, null, 1)); process.exit(1); });
