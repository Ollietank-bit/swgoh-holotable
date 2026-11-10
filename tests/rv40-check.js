/* rv40-check — the 10 Nov 2026 refresh (ref40/refresh.json: one-click swgoh.gg capture 10 Nov 21:17 AEDT; ref40/team/readiness.md, gac.md, timing.md).
   Clock pinned to Wed 11 Nov 2026 12:00 AEDT (01:00Z) unless a check says otherwise; rosters = both 10 Nov compact pulls (rv40-rosters-10nov.json) laid over the
   7 Oct fixture pulls (names, zetas, ships kept). New behaviour only:
     1. Registry: exactly 24 unique entries; bumped to 2026-11-10 = events, datacrons, gac-schedule, droid-raid (recheck 17 Nov), gl-queue, nxt-queue, ship-guide,
        coach-tips; gl-queue / ship-guide / nxt-queue hard end 2026-11-14 → 2026-11-28; conquest hard end = CQDATA.knownThrough 2026-11-09 (asOf stays 27 Sep);
        era asOf 1 Nov / end 17 Nov with the six-hours-early hint; NOT bumped: tierlist / meta-fleets 1 Nov, gac-counters / meta-squads 27 Sep, gac-format 25 Oct,
        cap-journeys 22 Oct. Data health on 11 / 15 / 19 Nov: 5 (1 overdue) / 6 (1) / 7 (3).
     2. EVENTS_SEED v14 (CAPTURED 10 Nov, date order, saved state reseeded): key rows (TB 10–15 Nov, Grand Masters Training 14–16 Nov sourced, GAC S85 W2 12–18 Nov,
        W3 inferred 19–26 Nov, Era of Rogue One 18 Nov → 9 Feb 2027, Edrio, The Last Stand, four predicted reruns 25 Nov, Yoda (DSV) live 10 Nov, Set 36 21 Jan,
        Forge and Foundry 18 Feb with "37" inferred), dropped rows, carried rows after 28 Nov say so; GAC_SCHEDULE s85e2 sourced; TERRITORY (TB 10 → 16 Nov 05:00,
        no TW to 28 Nov); DATACRON_SETS + the Intel tab line; CQDATA.knownThrough + Conquest wording; ERA_NOW.next + strapline after 17 Nov.
     3. GL order on the 10 Nov rosters: Ollie Leia ✓ → JML (building, 14 tiers) → Jedi Master Kenobi (next, the default) → SEE (only if Bane) …; Tiny Leia ✓ → Jabba
        (building, 6 tiers) → JML (next) → JMK → SEE …; card headers; removal of the passed-checkpoint / verify-before-Wedge strings; NXT + Coach on the 10 Nov rosters
        (Tiny's Jabba flag fixnow 0/3, Ollie's JML step 3 2/4); no Jedi Knight Cal Kestis claimed as owned.
     4. GAC: the S85 Week 2 note under the planner title and in both Coach S85 flags; the bracket list's snapshot note; planner output unchanged for both accounts
        (Carbonite 3v3: SLKR + Leia + Bo-Katan trio; Executor / Negotiator; the same offence benches as the 4 Nov run) and Ollie's Emperor Palpatine trio is NOT on
        offence (Darth Vader (Duel's End) is 6★ on the 10 Nov pull).
     5. Escaping of the new dynamic strings; no overflow at 390 / 1280 on the changed views (screenshots in ../shots/rv40/); no new localStorage keys; zero page errors.
   Run: NODE_PATH=... FILE=DIR/index.html PORT=9xxx node tests/rv40-check.js */
const L = require("./lib.js");
const { ck } = L;
const AEDT = (mo, d, h, m) => Date.UTC(2026, mo - 1, d, h - 11, m || 0);
const NOW = AEDT(11, 11, 12);   // Wed 11 Nov 2026 12:00 AEDT = 01:00Z
const SHOTS = L.path.join(L.ROOT, "shots", "rv40");
try { L.fs.mkdirSync(SHOTS, { recursive: true }); } catch (e) {}
const ROS = JSON.parse(L.fs.readFileSync(L.path.join(__dirname, "rv40-rosters-10nov.json"), "utf8"));

function pulls10() {
  const acc = JSON.parse(L.PULLS);
  const NEW = { GLLEIA: "Leia Organa", ADELPHIRANGER: "Adelphi Ranger", B1MERCDROID: "Mercenary Guard Droid (B1)" };
  for (const a of ["ollie", "tiny"]) {
    const o = acc[a];
    for (const it of ROS[a].split(",")) {
      const [id, v] = it.split(":"); const m = /^(\d+)\.(\d+)(?:r(\d+))?\*?$/.exec(v || "");
      if (!m) throw new Error("bad roster item " + it);
      const prev = o.reqs[id] || { name: NEW[id] || id, t: "char", z: [], o: [], el: 0 };
      o.reqs[id] = Object.assign({}, prev, { s: +m[1], g: +m[2], r: +(m[3] || 0) });
    }
  }
  return acc;
}
async function openAt(b, o) {
  o = o || {};
  const ctx = await b.newContext({ viewport: { width: o.width || 1280, height: o.height || 1000 }, timezoneId: "Australia/Sydney", locale: "en-AU" });
  await ctx.clock.setFixedTime(o.at || NOW);
  await ctx.addInitScript(([s, pl, seedKey]) => {
    try { if (!sessionStorage.getItem(seedKey)) { localStorage.clear(); localStorage.setItem("swgoh-tracker", s); localStorage.setItem("swgoh-holotable-pulls-v1", pl); sessionStorage.setItem(seedKey, "1"); } } catch (e) {}
  }, [L.REAL, o.pulls || JSON.stringify(pulls10()), "seeded-" + (o.tag || "x")]);
  await ctx.addInitScript(() => { window.T0 = el => el ? el.innerText.replace(/\s+/g, " ").trim() : ""; });
  await ctx.route(/fonts\.g|swgoh\.gg|swgohrote\.com|corsproxy|allorigins|codetabs|api\.github/, r => r.abort());
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push(String(e).slice(0, 300)));
  p.on("console", m => { if (m.type() === "error" && !/Failed to load resource|net::ERR|fonts\.g/.test(m.text())) errs.push("console: " + m.text().slice(0, 200)); });
  await p.goto(`http://127.0.0.1:${L.PORT}/x.html`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(900);
  return { ctx, p, errs };
}
const BOK_DEF = "Bo-Katan (Mand'alor) trio (defence, 3v3 only)";

(async () => {
  const srv = await L.serve(); const b = await L.chromium.launch();
  const allErrs = [];

  /* ---------- 1/2. registry, data health, events seed, schedule data ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "pure" });
    const c = await p.evaluate(([d11, d15, d19, d18]) => {
      const reg = Object.fromEntries(SNAPSHOTS.map(s => [s.key, [snapISO(s.asOf), s.expires ? snapISO(s.expires) : "", s.hint]]));
      const by = n => EVENTS_SEED.find(e => e.name === n) || null;
      const dh = t => { const r = dataHealthRows(t); return { n: r.length, stale: r.filter(x => x.st.state === "stale").map(x => x.e.key), keys: r.map(x => x.e.key) }; };
      return { n: SNAPSHOTS.length, keys: new Set(SNAPSHOTS.map(s => s.key)).size, reg, dr: [DROID_RAID.asOf, DROID_RAID.recheck, DROID_RAID.recheckNote], tl: TIER_LIST.updated,
        dh11: dh(d11), dh15: dh(d15), dh19: dh(d19), card11: (dataHealthCard(d11) || {}).html || "",
        ver: EVENTS_SEED_VERSION, cap: EVENTS_SEED_CAPTURED, stateVer: state.eventsSeedVersion, len: EVENTS_SEED.length, sorted: EVENTS_SEED.every((e, i) => !i || e.date >= EVENTS_SEED[i - 1].date),
        seed: EVENTS_SEED.map(e => [e.name, e.date, e.ends || "", e.note]), stateSeed: state.events.items.filter(e => /^seed\d+$/.test(e.id)).length,
        tb: by("Territory Battle — Rise of the Empire"), gmt: by("Mythic: Grand Masters Training"), w2: by("GAC Season 85 — Week 2 (3v3)"), w3: by("GAC Season 85 — Week 3 (3v3, inferred)"),
        season: by("GAC Season 85 (3v3)"), ro: by("Era of Rogue One"), edrio: by("New character: Edrio Two Tubes"), last: by("The Last Stand"), yoda: by("Yoda (Dark Side Vision) farmable node"),
        yodaP: by("Yoda (Dark Side Vision) farmable node (predicted)"), s36: by("Datacron Set 36 expires"), ff: by("Datacron set Forge and Foundry expires"), b1ec: by("Mercenary Guard Droid (B1) Era Challenge"),
        zuck: by("Zuckuss + 4-LOM additive drops rerun"), mini: by("Era 10 — The Mandalorian and Grogu (Mini-Era)"),
        reruns: ["Terrible Tings", "Champion of the Pit", "The Price of Hope", "Web of Hate"].map(n => by(n + " rerun (predicted)")),
        s85: GAC_SCHEDULE.events.filter(e => e.season === 85).map(e => [e.id, e.start, !!e.est]), gacAs: GAC_SCHEDULE.asOf,
        terr: [TERRITORY.asOf, TERRITORY.tbAsOf, TERRITORY.readTo, new Date(TERRITORY.tb.startMs).toISOString(), new Date(TERRITORY.tb.endMs).toISOString(), TERRITORY.tb.names],
        tbNote: territoryNoteHtml("tb").replace(/<[^>]+>/g, ""), twNote: territoryNoteHtml("tw").replace(/<[^>]+>/g, ""), tbAfter: territoryNoteHtml("tb", Date.UTC(2026, 10, 16, 1)).replace(/<[^>]+>/g, ""),
        dc: DATACRON_SETS.map(d => [d.n, !!d.nInferred, d.name, d.expires, d.time, !!d.isNew, d.focused || ""]),
        cq: [CQDATA.knownThrough, CQDATA.captured, CQDATA.cycle.anchor], cqStatus: (() => { const d = document.createElement("div"); d.innerHTML = cqRunStatusHtml(cqRunStatus(new Date(d11))); return d.textContent.replace(/\s+/g, " "); })(),
        era: [ERA_NOW.end, ERA_NOW.asOf, JSON.stringify(ERA_NOW.next), ERA_NOW.facts[ERA_NOW.facts.length - 1]], eraWin17: eraWindowHtml(Date.UTC(2026, 10, 17, 1)).replace(/<[^>]+>/g, ""), eraWin18: eraWindowHtml(d18).replace(/<[^>]+>/g, "") };
    }, [AEDT(11, 11, 12), AEDT(11, 15, 12), AEDT(11, 19, 12), AEDT(11, 18, 12)]);
    const A = k => c.reg[k][0], E = k => c.reg[k][1];
    ck("registry: exactly 24 unique entries", c.n === 24 && c.keys === 24, `${c.n}/${c.keys}`);
    ck("bumped to 2026-11-10 (re-read or re-derived on 10 Nov): events, datacrons, gac-schedule, droid-raid, gl-queue, nxt-queue, ship-guide, coach-tips",
      ["events", "datacrons", "gac-schedule", "droid-raid", "gl-queue", "nxt-queue", "ship-guide", "coach-tips"].every(k => A(k) === "2026-11-10") && c.gacAs === "2026-11-10", JSON.stringify(Object.fromEntries(Object.entries(c.reg).map(([k, v]) => [k, v[0]]))));
    ck("NOT bumped: tierlist / meta-fleets 1 Nov (boards identical, no re-derivation), gac-counters / meta-squads / conquest 27 Sep, gac-format 25 Oct, cap-journeys 22 Oct, era 1 Nov, raid-intel 17 Aug, gl-roadmap 8 Aug",
      A("tierlist") === "2026-11-01" && c.tl === "1 Nov 2026" && A("meta-fleets") === "2026-11-01" && A("gac-counters") === "2026-09-27" && A("meta-squads") === "2026-09-27" && A("conquest") === "2026-09-27"
      && A("gac-format") === "2026-10-25" && A("cap-journeys") === "2026-10-22" && A("era") === "2026-11-01" && A("raid-intel") === "2026-08-17" && A("gl-roadmap") === "2026-08-08", "");
    ck("hard ends: gl-queue / ship-guide / nxt-queue 2026-11-14 → 2026-11-28 (end of the 10 Nov read's sourced coverage); conquest = CQDATA.knownThrough 2026-11-09; era 2026-11-17 (last live day)",
      E("gl-queue") === "2026-11-28" && E("ship-guide") === "2026-11-28" && E("nxt-queue") === "2026-11-28" && E("conquest") === "2026-11-09" && E("era") === "2026-11-17", JSON.stringify([E("gl-queue"), E("ship-guide"), E("nxt-queue"), E("conquest"), E("era")]));
    ck("hints say why: gl-queue names the S85 3v3 board / JML's last G13 / Jabba / a read past 28 Nov; era says the chip flips six hours early and names Era of Rogue One; conquest says Conquest 25 ended 9 Nov and no next one is listed",
      /Season 85 3v3 board/.test(c.reg["gl-queue"][2]) && /past 28 Nov/.test(c.reg["gl-queue"][2]) && /six hours early/.test(c.reg.era[2]) && /Era of Rogue One/.test(c.reg.era[2]) && /Conquest 25 ended 9 Nov/.test(c.reg.conquest[2]) && /no next Conquest/.test(c.reg.conquest[2]), "");
    ck("DROID_RAID: asOf 2026-11-10, recheck 2026-11-17; the note says byte-identical page, the 10 Nov mechanics headline (Gotra) and that the post itself was not read",
      c.dr[0] === "2026-11-10" && c.dr[1] === "2026-11-17" && /byte-identical to 4 Nov/.test(c.dr[2]) && /Gotra Boss Guard droids/.test(c.dr[2]) && /the post itself not read/.test(c.dr[2]), c.dr[2].slice(0, 160));
    ck("Data health 11 Nov: 5 want a re-pull, 1 overdue (conquest — window ended 9 Nov); aging: raid-notes, gac-counters, meta-squads, cap-journeys",
      c.dh11.n === 5 && JSON.stringify(c.dh11.stale) === '["conquest"]' && ["raid-notes", "gac-counters", "meta-squads", "cap-journeys"].every(k => c.dh11.keys.includes(k)) && /5 of 24 built-in references want a re-pull, 1 overdue/.test(c.card11), JSON.stringify(c.dh11));
    ck("Data health 15 Nov: 6, 1 overdue (conquest); + raid-intel aging (the gl-queue / ship-guide / nxt-queue 14 Nov hard ends no longer fire)",
      c.dh15.n === 6 && JSON.stringify(c.dh15.stale) === '["conquest"]' && c.dh15.keys.includes("raid-intel") && !c.dh15.keys.some(k => ["gl-queue", "ship-guide", "nxt-queue"].includes(k)), JSON.stringify(c.dh15));
    ck("Data health 19 Nov: 7, 3 overdue (conquest, cap-journeys, era — window ended 17 Nov); aging raid-notes, raid-intel, gac-counters, meta-squads",
      c.dh19.n === 7 && JSON.stringify(c.dh19.stale.slice().sort()) === '["cap-journeys","conquest","era"]' && ["raid-notes", "raid-intel", "gac-counters", "meta-squads"].every(k => c.dh19.keys.includes(k)), JSON.stringify(c.dh19));
    ck("EVENTS_SEED v14, CAPTURED '10 Nov 2026', 43 rows in date order; saved state reseeded to 14 with exactly the seed rows",
      c.ver === 14 && c.cap === "10 Nov 2026" && c.len === 43 && c.sorted && c.stateVer === 14 && c.stateSeed === 43, JSON.stringify([c.ver, c.cap, c.len, c.sorted, c.stateVer, c.stateSeed]));
    ck("no row's last live day is before 10 Nov (the read's day); the B1 marquee (last live day 10 Nov) and Smuggler's Run (to 10 Nov 22:00) are the only rows ending on it",
      c.seed.every(r => (r[2] || r[1]) >= "2026-11-10") && c.seed.filter(r => (r[2] || r[1]) === "2026-11-10").map(r => r[0]).sort().join("|") === "Mercenary Guard Droid (B1)|Smuggler's Run|Yoda (Dark Side Vision) farmable node", JSON.stringify(c.seed.filter(r => (r[2] || r[1]) <= "2026-11-10").map(r => r[0])));
    const gone = ["Conquest 25 (Embo & Keibu) — run 26 Oct → 9 Nov", "Datacron Set 33 expired", "Proving Grounds", "Bonus Proving Grounds", "Mythic: Pieces and Plans (predicted)", "Territory War — attack phase", "Territory War — attack phase (next war)", "Territory War — sign-up (next war)", "Bonus drops (additive drops, wave 7)", "Mythic: Grand Masters Training (predicted)"];
    ck("dropped / superseded rows are gone (Conquest 25 run, Set 33 record row, Proving Grounds ×2, Pieces and Plans, the TW rows, wave 7, the 17 Dec Grand Masters prediction, the 11 Nov Yoda prediction)", gone.every(n => !c.seed.some(r => r[0] === n)) && !c.yodaP, JSON.stringify(gone.filter(n => c.seed.some(r => r[0] === n))));
    ck("Territory Battle row 10 → 15 Nov (closes 16 Nov 05:00 AEDT), new names; Grand Masters Training SOURCED 14 → 16 Nov 19:00 (no '(predicted)'), says the 17 Dec prediction was 33 days late",
      c.tb && c.tb.cat === "Territory Battle" && c.tb.date === "2026-11-10" && c.tb.ends === "2026-11-15" && /Mon 16 Nov 05:00 AEDT/.test(c.tb.note) && /Separatist Might/.test(c.tb.note)
      && c.gmt && c.gmt.date === "2026-11-14" && c.gmt.ends === "2026-11-16" && /SCHEDULED/.test(c.gmt.note) && /Mon 16 Nov 19:00 AEDT/.test(c.gmt.note) && /17 Dec/.test(c.gmt.note), JSON.stringify([c.tb && c.tb.ends, c.gmt && c.gmt.ends]));
    ck("GAC S85 Week 2 12 → 18 Nov (sourced, 'Thu 12 Nov 09:00 → ENDS Wed 18 Nov 09:00', snapshot caveat); Week 3 INFERRED 19 → 26 Nov; season row says W2 sourced, W3 inferred, no week 4",
      c.w2 && c.w2.date === "2026-11-12" && c.w2.ends === "2026-11-18" && /Thu 12 Nov 09:00 → ENDS Wed 18 Nov 09:00/.test(c.w2.note) && /snapshots/.test(c.w2.note)
      && c.w3 && c.w3.date === "2026-11-19" && c.w3.ends === "2026-11-26" && /^INFERRED, not read/.test(c.w3.note) && c.season && /Week 3 is NOT a row/.test(c.season.note) && /no week 4/.test(c.season.note), JSON.stringify([c.w2 && c.w2.ends, c.w3 && c.w3.ends]));
    ck("Era of Rogue One 18 Nov → last live day 9 Feb 2027 (Episode 1 to 16 Dec), dates only / not researched; Edrio Two Tubes 18 Nov 05:00; The Last Stand 18 → 24 Nov (featured unit unverified); B1 Era Challenge 11 → 17 Nov",
      c.ro && c.ro.date === "2026-11-18" && c.ro.ends === "2027-02-09" && /16 Dec 06:00 AEDT/.test(c.ro.note) && /NOT researched/.test(c.ro.note) && c.edrio && /18 Nov 05:00 AEDT/.test(c.edrio.note)
      && c.last && c.last.cat === "Marquee" && c.last.ends === "2026-11-24" && /unverified/.test(c.last.note) && c.b1ec && c.b1ec.cat === "Era Challenge" && c.b1ec.ends === "2026-11-17", "");
    ck("four predicted legendary reruns on 25 Nov ('(predicted)' names, PREDICTED notes, confidences MEDIUM / LOW / LOW / LOW); Yoda (DSV) node LIVE on 10 Nov (Update 11-9, DS 9-E Hard)",
      c.reruns.every(r => r && r.date === "2026-11-25" && /^PREDICTED by swgoh\.gg/.test(r.note)) && /MEDIUM/.test(c.reruns[0].note) && c.reruns.slice(1).every(r => /LOW/.test(r.note))
      && c.yoda && c.yoda.date === "2026-11-10" && /Update 11-9/.test(c.yoda.note) && /9-E \(Hard\)/.test(c.yoda.note), "");
    ck("every '(predicted)' row says PREDICTED; every row after 28 Nov is CARRIED (or a datacron / Era row the 10 Nov read lists)",
      c.seed.filter(r => /\(predicted\)$/.test(r[0])).every(r => /PREDICTED/.test(r[3])) && c.seed.filter(r => r[1] > "2026-11-28").every(r => /CARRIED/.test(r[3]) || /^Datacron /.test(r[0])), JSON.stringify(c.seed.filter(r => r[1] > "2026-11-28" && !/CARRIED/.test(r[3]) && !/^Datacron /.test(r[0])).map(r => r[0])));
    ck("datacron rows: Set 36 expires 21 Jan 2027 (was 20 Jan), no 'No Set 37'; Forge and Foundry expires 18 Feb 2027 with its '37' INFERRED; Zuckuss rerun DOWNGRADED (no bonus drops 9–28 Nov)",
      c.s36 && c.s36.date === "2027-01-21" && c.s36.ends === "2027-01-21" && !/No Set 37/.test(c.s36.note) && c.ff && c.ff.date === "2027-02-18" && /Set 37 by order only \(inferred\)/.test(c.ff.note) && /does not number sets/.test(c.ff.note)
      && c.zuck && /DOWNGRADED 10 Nov/.test(c.zuck.note), "");
    ck("Mini-Era row: end 17 Nov kept (18 Nov 06:00 AEDT), names Era of Rogue One as next, no GL release through 28 Nov", c.mini && c.mini.ends === "2026-11-17" && /Era of Rogue One begins/.test(c.mini.note) && /runs to 28 Nov/.test(c.mini.note), "");
    ck("GAC_SCHEDULE: s85e1 sourced, s85e2 2026-11-11 SOURCED (est dropped), s85e3 2026-11-18 still est; asOf 10 Nov",
      JSON.stringify(c.s85) === JSON.stringify([["s85e1", "2026-11-04", false], ["s85e2", "2026-11-11", false], ["s85e3", "2026-11-18", true]]), JSON.stringify(c.s85));
    ck("TERRITORY: asOf / tbAsOf 10 Nov, readTo 28 Nov, TB 2026-11-09T18:00Z → 2026-11-15T18:00Z 'Geonosis: Separatist Might · Hoth: Imperial Retaliation'",
      JSON.stringify(c.terr) === JSON.stringify(["2026-11-10", "2026-11-10", "28 Nov", "2026-11-09T18:00:00.000Z", "2026-11-15T18:00:00.000Z", "Geonosis: Separatist Might · Hoth: Imperial Retaliation"]), JSON.stringify(c.terr));
    ck("TB note at 11 Nov 12:00: live, ends in 4d 17h, read 10 Nov; after 16 Nov: over; TW note: both wars over, 'The schedule (read to 28 Nov) lists no later Territory War'",
      /live, ends in 4d 17h/.test(c.tbNote) && /read 10 Nov 2026/.test(c.tbNote) && /over/.test(c.tbAfter) && /over/.test(c.twNote) && /read to 28 Nov\) lists no later Territory War/.test(c.twNote), c.tbNote + " || " + c.twNote);
    ck("DATACRON_SETS: Forge and Foundry first (n 37 nInferred, 18 Feb 2027 19:00, new, '10 character datacrons, 2 focused variants'), Set 36 21 Jan 2027 (no longer new), 35 / 34 unchanged, 33 expired",
      JSON.stringify(c.dc.map(d => d.slice(0, 6))) === JSON.stringify([[37, true, "Forge and Foundry", "2027-02-18", "19:00", true], [36, false, "The Legend Codex", "2027-01-21", "19:00", false], [35, false, "Duty and Defiance", "2026-12-24", "19:00", false], [34, false, "The Art of Command", "2026-11-26", "19:00", false], [33, false, "Supremacy Directive", "2026-10-29", "18:00", false]])
      && /10 character datacrons, 2 focused variants/.test(c.dc[0][6]), JSON.stringify(c.dc));
    ck("Conquest: knownThrough 2026-11-09 (captured / anchor untouched); the 11 Nov status line says Conquest 25 has ended, no next Conquest is listed, and the cadence's date is unsupported",
      JSON.stringify(c.cq) === JSON.stringify(["2026-11-09", "27 Sep 2026", "2026-09-28"]) && /Conquest 25 has ended/.test(c.cqStatus) && /no next Conquest is listed/.test(c.cqStatus) && /nothing supports/.test(c.cqStatus) && /swgoh\.gg's schedule read 10 Nov \(to 28 Nov\) lists NO next Conquest/.test(c.cqStatus), c.cqStatus.slice(0, 300));
    ck("ERA_NOW: end stays 2026-11-17, asOf 1 Nov; next = Era of Rogue One 18 Nov 06:00 → 10 Feb 2027 (read 10 Nov); the new fact says dates only, NOT researched; strapline on 17 Nov still Era 10, on 18 Nov names Era of Rogue One and 'isn't in this file'",
      c.era[0] === "2026-11-17" && c.era[1] === "2026-11-01" && /"name":"Era of Rogue One"/.test(c.era[2]) && /"asOf":"2026-11-10"/.test(c.era[2]) && /NOT researched/.test(c.era[3]) && /Era 10 .*to 17 Nov 2026/.test(c.eraWin17)
      && /Era of Rogue One began 18 Nov 06:00 AEDT/.test(c.eraWin18) && /isn't in this file/.test(c.eraWin18), c.eraWin18);
    allErrs.push(...errs); await ctx.close();
  }

  /* ---------- 3. GL order, NXT and Coach on the 10 Nov rosters ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "gl" });
    const c = await p.evaluate(() => {
      const eff = a => glqRows(a).map(r => [r.e.glId || r.e.watchId, r.eff, r.tiers]);
      const card = a => { switchAcct(a); switchTab("leia"); const el = document.querySelector('#glTables [data-card="glq"]'); return { mnote: T0(el.querySelector(".mnote")), rows: [...el.querySelectorAll(".glq-row")].map(r => [r.dataset.glq, T0(r.querySelector(".chip")), T0(r.querySelector(".glq-ready"))]), text: el.textContent }; };
      const tip = (a, id) => { const t = TIPS[a].find(x => x.id === id); const reqs = state.pulls[a].reqs; return t ? { sev: t.sev, t: t.t, note: t.note, prog: t.check ? tipProgress(reqs, t.check) : null, key: hardTipKey(a, t) } : null; };
      const blob = JSON.stringify([GL_QUEUE, NXT_QUEUE, TIPS.ollie.filter(t => t.t).map(t => [t.t, t.note]), TIPS.tiny.filter(t => t.t).map(t => [t.t, t.note]), SHIP_DATA.rerank, SHIP_DATA.journeyOnly, GUIDANCE.tiny.glSub]);
      return { oEff: eff("ollie"), tEff: eff("tiny"), oCard: card("ollie"), tCard: card("tiny"), blob, oAs: GL_QUEUE.ollie.asOf, tAs: GL_QUEUE.tiny.asOf, nxtAs: NXT_QUEUE.asOf, shipAs: SHIP_DATA.asOf,
        jmlWhy: GL_QUEUE.ollie.queue.find(e => e.glId === "GRANDMASTERLUKE").why, jmkTrig: GL_QUEUE.ollie.queue.find(e => e.glId === "JEDIMASTERKENOBI").trigger, seeTrig: GL_QUEUE.ollie.queue.find(e => e.glId === "SITHPALPATINE").trigger,
        tJabba: GL_QUEUE.tiny.queue.find(e => e.glId === "JABBATHEHUTT"), oPrep: GL_QUEUE.ollie.prep.map(it => it.id), tPrep: GL_QUEUE.tiny.prep.map(it => it.id),
        nxtO: NXT_QUEUE.ollie.doThisWeek, nxtT: NXT_QUEUE.tiny.doThisWeek, rebel: NXT_QUEUE.tiny.queue.find(e => e.id === "rebel-gear").why, jmlRow: NXT_QUEUE.ollie.queue[0],
        tJab: tip("tiny", "jabba-now-closer-than-jml"), tJml: tip("tiny", "jedi-master-luke-skywalker-is"), tFreeze: tip("tiny", "freeze-luxury-relics-until-jedi"), oStep3: tip("ollie", "jml-step3-four-g13s"), oStep1: tip("ollie", "jml-step1-chewie-hermit"),
        oB1: tip("ollie", "b1-marquee-proving-grounds"), oFleet: tip("ollie", "executor-fleet-slipped-to-rank"), oIds: TIPS.ollie.map(t => t.id), tIds: TIPS.tiny.map(t => t.id), glSub: GUIDANCE.tiny.glSub };
    });
    ck("asOf 2026-11-10: GL_QUEUE, Ollie, Tiny (re-ranked), NXT_QUEUE, SHIP_DATA", c.oAs === "2026-11-10" && c.tAs === "2026-11-10" && c.nxtAs === "2026-11-10" && c.shipAs === "2026-11-10", JSON.stringify([c.oAs, c.tAs, c.nxtAs, c.shipAs]));
    ck("Ollie (10 Nov roster): Leia ✓ built → JML building (14 relic tiers) → Jedi Master Kenobi next (63, the default) → SEE then (50, only if Bane) → M&G watch → Lord Vader / GL Ahsoka / Hondo later",
      JSON.stringify(c.oEff) === JSON.stringify([["GLLEIA", "done", 0], ["GRANDMASTERLUKE", "building", 14], ["JEDIMASTERKENOBI", "next", 63], ["SITHPALPATINE", "then", 50], ["MANDOGROGU", "watch", 107], ["LORDVADER", "later", 86], ["GLAHSOKATANO", "later", 100], ["GLHONDO", "later", 84]]), JSON.stringify(c.oEff));
    ck("Tiny (10 Nov roster): Leia ✓ built → Jabba building (6 relic tiers) → JML next (24) → Jedi Master Kenobi then → SEE then (40) → M&G watch → Lord Vader / GL Ahsoka / Hondo later",
      JSON.stringify(c.tEff) === JSON.stringify([["GLLEIA", "done", 0], ["JABBATHEHUTT", "building", 6], ["GRANDMASTERLUKE", "next", 24], ["JEDIMASTERKENOBI", "then", 63], ["SITHPALPATINE", "then", 40], ["MANDOGROGU", "watch", 107], ["LORDVADER", "later", 58], ["GLAHSOKATANO", "later", 87], ["GLHONDO", "later", 68]]), JSON.stringify(c.tEff));
    ck("cards: Ollie 'Now: Jedi Master Luke Skywalker · next: Jedi Master Kenobi', JML '10/14 met', SEE chip 'Or — only if Darth Bane is obtainable'; Tiny 'Now: Jabba the Hutt · next: Jedi Master Luke Skywalker', Jabba '11/14 met … ≈6 relic tiers left'",
      /Now: Jedi Master Luke Skywalker · next: Jedi Master Kenobi\./.test(c.oCard.mnote) && /^10\/14 met/.test((c.oCard.rows.find(r => r[0] === "GRANDMASTERLUKE") || [])[2] || "") && /Or — only if Darth Bane is obtainable$/.test((c.oCard.rows.find(r => r[0] === "SITHPALPATINE") || [])[1] || "")
      && /Now: Jabba the Hutt · next: Jedi Master Luke Skywalker\./.test(c.tCard.mnote) && /^11\/14 met · \d+% · ≈6 relic tiers left$/.test((c.tCard.rows.find(r => r[0] === "JABBATHEHUTT") || [])[2] || ""), c.oCard.mnote.slice(0, 120) + " || " + c.tCard.mnote.slice(0, 120));
    ck("JML reason: 10 of 14, 14 relic tiers, 3 to G13, Old Ben G9 → G13 → R5 the pace-setter, about 5–15 Dec (best case ~28 Nov); JMK trigger = the default, re-check at the S85 3v3 board or JML's last G13; SEE trigger: Proving Grounds 9–10 Nov outcome UNVERIFIED",
      /10 of 14 requirements are met with 14 relic tiers/.test(c.jmlWhy) && /3 units still to take to G13/.test(c.jmlWhy) && /Old Ben\) G9 → G13 → R5/.test(c.jmlWhy) && /about 5–15 Dec 2026/.test(c.jmlWhy) && /best case about 28 Nov/.test(c.jmlWhy)
      && /The default Legend after Jedi Master Luke/.test(c.jmkTrig) && /Season 85 3v3 board/.test(c.jmkTrig) && /last G13/.test(c.jmkTrig) && /whether it featured Bane is UNVERIFIED/.test(c.seeTrig), "");
    ck("Tiny's Jabba row: status next, 'Han Solo R7 → R8, C-3PO R3 → R7 and Fennec Shand R6 → R7', ETA unlock about 20–25 Nov; the old 'a long Bounty Hunter build — behind' reason is gone; prep ids unchanged on both accounts",
      c.tJabba.status === "next" && /Han Solo R7 → R8, C-3PO R3 → R7 and Fennec Shand R6 → R7/.test(c.tJabba.why) && /unlock about 20–25 Nov/.test(c.tJabba.why) && JSON.stringify(c.oPrep) === '["lobot-g13","jml-gear","jml-verify","maul-g13","groguants-7","scion-unlock","skip-peridea"]' && JSON.stringify(c.tPrep) === '["luke-gear","raddus-jyn-g13","groguants-7","thrawn-rule"]', c.tJabba.why.slice(0, 120));
    const bad = ["decided at the 8–12 Nov checkpoint", "decided at an explicit", "Proving Grounds 8–10 Nov", "Proving Grounds, 8–10 Nov", "(8–10 Nov", "BEFORE gearing Wedge", "before gearing Wedge", "BEFORE taking Wedge", "late Dec – Jan", "a long Bounty Hunter build — behind", "Wedge Antilles G8,", "G12 / G5 / G8 / G8 / G10", "Princess Leia G9 → G13", "Old Ben and Princess Leia G9"];
    ck("passed-checkpoint / verify-before-Wedge / stale-Wedge strings are gone from GL_QUEUE, NXT_QUEUE, TIPS, SHIP_DATA and Tiny's GL subtitle", bad.every(x => !c.blob.includes(x)), JSON.stringify(bad.filter(x => c.blob.includes(x))));
    ck("Jedi Knight Cal Kestis is never claimed as owned: where it is named, it says neither account owns it and that the rosters' 'Cal Kestis' is a different unit", /Jedi Knight Cal Kestis/.test(c.jmlWhy) && /whom neither account owns on 10 Nov/.test(c.jmlWhy) && /different unit/.test(c.jmlWhy) && !/Jedi Knight Cal Kestis \(5★/.test(c.blob), "");
    ck("NXT: Ollie this week = JML 10 of 14 / Chewbacca R6 / Old Ben gear / S85 Week 2 / Proving Grounds unverified; Tiny's = Jabba first; Tiny's rebel row 'G12 / G5 / G12 / G8 / G10'; JML row re-costed (14 tiers, 6 gear levels)",
      /10 of 14 met, 14 relic tiers, 3 units to G13/.test(c.nxtO) && /Old Ben \(G9/.test(c.nxtO) && /Week 2 opens Thu 12 Nov 09:00 AEDT/.test(c.nxtO) && /unverified/.test(c.nxtO) && /^Jabba the Hutt is the next Legend now/.test(c.nxtT)
      && /G12 \/ G5 \/ G12 \/ G8 \/ G10/.test(c.rebel) && /14 tiers/.test(c.jmlRow.cost) && /6 levels/.test(c.jmlRow.cost) && /four units still open on 10 Nov/.test(c.jmlRow.name), c.nxtT.slice(0, 100));
    ck("Coach ids unchanged (14 Ollie / 13 Tiny, same order); Tiny's Jabba flag is fixnow 'Jabba the Hutt next …' with 0/3 on the 10 Nov roster; JML is 'After Jabba'; the freeze flag is for Jabba",
      c.oIds.length === 14 && c.tIds.length === 13 && c.oIds[1] === "2-set-33-datacrons-built" && c.tIds[c.tIds.length - 1] === "drr-four-star-floor" && c.tJab.sev === "fixnow" && /^Jabba the Hutt next: Han Solo R7 → R8, C-3PO R3 → R7, Fennec Shand R6 → R7$/.test(c.tJab.t)
      && c.tJab.prog.doneCount === 0 && c.tJab.prog.total === 3 && c.tJab.key === "tiny-t:jabba-now-closer-than-jml" && /^After Jabba — Jedi Master Luke/.test(c.tJml.t) && /Jabba's last six tiers/.test(c.tFreeze.t), JSON.stringify([c.tJab.t, c.tJab.prog]));
    ck("Coach Ollie: JML step 3 'Old Ben G9 → G13, Biggs G12 → G13 (Princess Leia and Wedge done)' 2/4 on 10 Nov; step 1 1/2 with '14 relic tiers with 10 of 14'; B1 / Proving Grounds flag says unverified; fleet rank 67 at the 10 Nov read",
      /Princess Leia and Wedge done/.test(c.oStep3.t) && c.oStep3.prog.doneCount === 2 && c.oStep3.prog.total === 4 && !/BEFORE/.test(c.oStep3.note) && c.oStep1.prog.doneCount === 1 && /14 relic tiers with 10 of 14/.test(c.oStep1.note)
      && /unverified/.test(c.oB1.t) && /4★ G5 on your 10 Nov pull/.test(c.oB1.note) && /rank 67/.test(c.oFleet.t), JSON.stringify([c.oStep3.prog, c.oStep1.prog]));
    for (const w of [1280, 390]) {
      await p.setViewportSize({ width: w, height: 1000 });
      for (const a of ["ollie", "tiny"]) {
        await L.go(p, a, "leia"); await p.waitForTimeout(200);
        const card = await p.$('#glTables [data-card="glq"]');
        if (card) await card.screenshot({ path: L.path.join(SHOTS, `rv40-glq-${a}-${w}.png`) });
        const o1 = await L.overflow(p);
        ck(`[${w}] ${a}: no horizontal overflow (GL Roadmap with the GL order card)`, o1.doc <= o1.inner + 1, JSON.stringify(o1));
        await L.go(p, a, "coach"); await p.evaluate(() => { state.views.coach = "priorities"; render(); }); await p.waitForTimeout(250);
        const co = await p.evaluate(() => ({ act: T0(document.querySelector('[data-card="action-flags"]')), all: T0(document.getElementById("tips")) }));
        if (a === "tiny") ck(`[${w}] Coach (tiny): Action flags lead with the Jabba flag; source line 're-checked against the 4 Nov and 10 Nov pulls', as of 10 Nov 2026`, /Jabba the Hutt next: Han Solo R7 → R8/.test(co.act) && /re-checked against the 4 Nov and 10 Nov pulls/.test(co.all) && /Flags as of 10 Nov 2026/.test(co.all), co.act.slice(0, 200));
        else ck(`[${w}] Coach (ollie): S85 flag carries the Week 2 window and the snapshot caveat; no 'BEFORE taking Wedge'`, /Week 2 runs Thu 12 Nov 09:00 → Wed 18 Nov 09:00 AEDT/.test(co.all) && /snapshots/.test(co.all) && !/BEFORE taking Wedge/.test(co.all), "");
        await p.screenshot({ path: L.path.join(SHOTS, `rv40-coach-${a}-${w}.png`), fullPage: false });
        const o2 = await L.overflow(p);
        ck(`[${w}] ${a}: no horizontal overflow (Coach)`, o2.doc <= o2.inner + 1, JSON.stringify(o2));
      }
    }
    allErrs.push(...errs); await ctx.close();
  }

  /* ---------- 4. GAC planner on the 10 Nov rosters ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "plan" });
    await L.go(p, "ollie", "gac");
    const PLAN = ([a, lg]) => {
      switchAcct(a); state.views["gcolg-" + a] = lg; state.views["gco-" + a] = "3v3"; gcfPlanMemo.clear();
      const def = gcoPlanFor(a), off = gofPlanFor(a);
      const res = { def: def.squadSlots.map(x => x.cand ? x.cand.name : null), fleet: def.fleetSlots.map(x => x.cand ? x.cand.name : null), off: off.picked.map(c => c.name),
        palp: off.skipped.find(s => s.name === "Emperor Palpatine Empire (offence)") || null, vde: (state.pulls[a].reqs.VADERDUELSEND || {}).s };
      delete state.views["gcolg-" + a]; delete state.views["gco-" + a]; gcfPlanMemo.clear();
      return res;
    };
    const oc = await p.evaluate(PLAN, ["ollie", "carbonite"]), tc = await p.evaluate(PLAN, ["tiny", "carbonite"]);
    ck("planner unchanged, Carbonite 3v3, both accounts: SLKR + Leia + the Bo-Katan defence trio; fleet Executor (Ollie) / Negotiator (Tiny)",
      JSON.stringify(oc.def) === JSON.stringify(["Supreme Leader Kylo Ren (GL)", "Leia Organa (GL) Rebels", BOK_DEF]) && JSON.stringify(tc.def) === JSON.stringify(["Supreme Leader Kylo Ren (GL)", "Leia Organa (GL) Rebels", BOK_DEF])
      && JSON.stringify(oc.fleet) === '["Executor (flagship only)"]' && JSON.stringify(tc.fleet) === '["Negotiator (flagship only)"]', JSON.stringify([oc.def, tc.def, oc.fleet, tc.fleet]));
    ck("offence benches as in the 4 Nov run: Ollie Revan trio, Rey, Padmé trio, Jabba, CLS, Hera; Tiny General Skywalker, Padmé trio, Rey, CLS, Hera, Bossk",
      JSON.stringify(oc.off) === JSON.stringify(["Darth Revan trio (offence, 3v3 only)", "Rey (GL) Jedi", "Padmé Amidala trio (offence, 3v3 only)", "Jabba the Hutt (GL) Bounty Hunters", "Commander Luke Skywalker Rebels (offence)", "Hera Syndulla Phoenix (offence)"])
      && JSON.stringify(tc.off) === JSON.stringify(["General Skywalker 501st (offence)", "Padmé Amidala trio (offence, 3v3 only)", "Rey (GL) Jedi", "Commander Luke Skywalker Rebels (offence)", "Hera Syndulla Phoenix (offence)", "Bossk Bounty Hunters"]), JSON.stringify([oc.off, tc.off]));
    ck("Ollie's Emperor Palpatine trio is NOT on offence: skipped 'only 2/3 members at 7★' (Darth Vader (Duel's End) is 6★ on the 10 Nov pull)",
      oc.vde === 6 && !oc.off.some(n => /Palpatine/.test(n)) && oc.palp && /only 2\/3 members at 7★/.test(oc.palp.reason), JSON.stringify([oc.vde, oc.palp]));
    const notes = await p.evaluate(() => ({ s85: GCF_S85_NOTE, gop: GOP_SNAPSHOT_NOTE, s85Html: gcfS85NoteHtml(), off: gcfS85NoteHtml(Date.UTC(2026, 10, 30, 1)) }));
    ck("S85 note: Week 2 Thu 12 Nov 09:00 → Wed 18 Nov 09:00 AEDT (sourced, read 10 Nov), Week 3 inferred, bracket scores are snapshots; shown while Season 85 is the event, not after it",
      /Week 2 runs Thu 12 Nov 09:00 → Wed 18 Nov 09:00 AEDT \(sourced\)/.test(notes.s85) && /read 10 Nov/.test(notes.s85) && /Week 3 is inferred/.test(notes.s85) && /snapshots — rounds won as of its last bracket refresh/.test(notes.s85) && /gcf-s85/.test(notes.s85Html) && notes.off === "", notes.s85);
    ck("bracket-list note: rank and score are swgoh.gg's snapshot, the score is rounds won (0–3 a week) and can lag", /score is rounds won as of its last bracket refresh \(0–3 a week\)/.test(notes.gop) && /can lag/.test(notes.gop), notes.gop);
    for (const w of [1280, 390]) {
      await p.setViewportSize({ width: w, height: 1000 });
      for (const a of ["ollie", "tiny"]) {
        await p.evaluate(([acct]) => { switchAcct(acct); delete state.views["gcolg-" + acct]; delete state.views["gco-" + acct]; switchTab("gac"); sectionView("gac", "defense"); gofRun(acct); }, [a]);
        await p.waitForTimeout(350);
        const u = await p.evaluate(() => { const c = document.querySelector('[data-card="gco"]'); return { t: T0(c), title: T0(c.querySelector(".gco-plan-title")), s85: T0(c.querySelector(".gcf-s85")) }; });
        ck(`[${w}] ${a}: planner title 'Season 85 Event 2 · 3v3 defence plan' (no '(estimated dates)'), the dated S85 note under it, no 'rank 3' claim`,
          /^Season 85 Event 2 · 3v3 defence plan/.test(u.title) && !/estimated/.test(u.title) && /Week 2 runs Thu 12 Nov 09:00/.test(u.s85) && !/rank 3\b/i.test(u.t), u.title + " | " + u.s85.slice(0, 80));
        const o = await L.overflow(p);
        ck(`[${w}] ${a}: no horizontal overflow (GAC planner with the S85 note)`, o.doc <= o.inner + 1, JSON.stringify(o));
        const card = await p.$('[data-card="gco"]');
        if (card) await card.screenshot({ path: L.path.join(SHOTS, `rv40-gac-${a}-${w}.png`) });
      }
    }
    allErrs.push(...errs); await ctx.close();
  }

  /* ---------- 5. other changed views (Events, Intel › Datacrons, Conquest, Modes era box), escaping, storage ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "views" });
    for (const w of [1280, 390]) {
      await p.setViewportSize({ width: w, height: 1000 });
      await L.go(p, "ollie", "events"); await p.evaluate(() => { state.views.events = "all"; renderEvents(); }); await p.waitForTimeout(200);
      const ev = await p.evaluate(() => ({ sub: [...document.querySelectorAll(".h2sub")].map(x => x.textContent).find(t => /Upcoming game-wide events/.test(t)) || "", grid: T0(document.getElementById("eventsGrid") || document.body) }));
      ck(`[${w}] Events: subtitle names the 10 Nov read (9–28 Nov), the TB and Week 1 / Week 2, no Territory War listed; the list shows the TB, Week 2 and Era of Rogue One`,
        /read 10 Nov, covering 9–28 Nov/.test(ev.sub) && /Territory Battle \(10–16 Nov\)/.test(ev.sub) && /Week 2/.test(ev.sub) && /no Territory War/.test(ev.sub) && /Territory Battle — Rise of the Empire/.test(ev.grid) && /GAC Season 85 — Week 2/.test(ev.grid) && /Era of Rogue One/.test(ev.grid), ev.sub.slice(0, 200));
      await p.screenshot({ path: L.path.join(SHOTS, `rv40-events-${w}.png`), fullPage: false });
      let o = await L.overflow(p); ck(`[${w}] no horizontal overflow (Events, all)`, o.doc <= o.inner + 1, JSON.stringify(o));
      await L.go(p, "ollie", "intel"); await p.evaluate(() => { state.views.intel = "datacrons"; render(); }); await p.waitForTimeout(250);
      const dc = await p.evaluate(() => (document.querySelector(".dc-sets") || { textContent: "" }).textContent.replace(/\s+/g, " "));
      ck(`[${w}] Intel › Datacrons: 'read 10 Nov 2026', '#37 (number inferred — swgoh.gg does not number sets) “Forge and Foundry” (new)', 18 Feb 2027 19:00 AEDT, Set 36 21 Jan 2027, no 'No Set 37', the Bo-Katan datacron caveat`,
        /read 10 Nov 2026/.test(dc) && /#37 \(number inferred — swgoh\.gg does not number sets\) “Forge and Foundry” \(new\)/.test(dc) && /18 Feb 2027 19:00 AEDT/.test(dc) && /#36 “The Legend Codex” — expires 21 Jan 2027 19:00 AEDT/.test(dc) && !/No Set 37/.test(dc) && /Bo-Katan \(Mand'alor\) character datacron/.test(dc), dc.slice(0, 300));
      await p.evaluate(() => { const el = document.querySelector(".dc-sets"); if (el) el.scrollIntoView({ block: "start" }); }); await p.waitForTimeout(100);
      await p.screenshot({ path: L.path.join(SHOTS, `rv40-datacrons-${w}.png`), fullPage: false });
      o = await L.overflow(p); ck(`[${w}] no horizontal overflow (Intel › Datacrons)`, o.doc <= o.inner + 1, JSON.stringify(o));
      await L.go(p, "ollie", "conquest"); await p.waitForTimeout(200);
      const cq = await p.evaluate(() => T0(document.getElementById("pane-conquest")));
      ck(`[${w}] Conquest (11 Nov): the stale banner fires (window ended 9 Nov) and the status line says no next Conquest is listed`, /This reference is Conquest 25/.test(cq) && /no next Conquest is listed/.test(cq), cq.slice(0, 200));
      await p.screenshot({ path: L.path.join(SHOTS, `rv40-conquest-${w}.png`), fullPage: false });
      o = await L.overflow(p); ck(`[${w}] no horizontal overflow (Conquest)`, o.doc <= o.inner + 1, JSON.stringify(o));
    }
    const keys = await p.evaluate(async () => { for (const t of SUBTABS.map(x => x.key)) { switchTab(t); await new Promise(r => setTimeout(r, 40)); } return Object.keys(localStorage).sort(); });
    ck("no new localStorage keys (the same 4 as before rv40)", JSON.stringify(keys) === JSON.stringify(["swgoh-holotable-active-account-v1", "swgoh-holotable-device-v1", "swgoh-holotable-pulls-v1", "swgoh-tracker"]), JSON.stringify(keys));
    const r = await p.evaluate(() => {
      window.__x = 0; const h = '<img src=x onerror="window.__x=1"><b id="rvx">x</b>';
      const keep = [ERA_NOW.next.name, ERA_NOW.next.startAedt, DATACRON_SETS[0].name, DATACRON_SETS[0].units, TERRITORY.tb.names, TERRITORY.readTo, ERA_NOW.facts[ERA_NOW.facts.length - 1]];
      ERA_NOW.next.name = h; ERA_NOW.next.startAedt = h; DATACRON_SETS[0].name = h; DATACRON_SETS[0].units = h; TERRITORY.tb.names = h; TERRITORY.readTo = h; ERA_NOW.facts[ERA_NOW.facts.length - 1] = h;
      const box = document.createElement("div");
      box.innerHTML = eraWindowHtml(Date.UTC(2026, 10, 18, 1)) + eraNowHtml(Date.UTC(2026, 10, 18, 1)) + datacronHtml() + territoryNoteHtml("tb") + territoryNoteHtml("tw") + gcfS85NoteHtml();
      const res = { img: box.querySelectorAll("img").length, b: !!box.querySelector("#rvx"), shown: (box.textContent.match(/<img src=x/g) || []).length };
      [ERA_NOW.next.name, ERA_NOW.next.startAedt, DATACRON_SETS[0].name, DATACRON_SETS[0].units, TERRITORY.tb.names, TERRITORY.readTo] = keep; ERA_NOW.facts[ERA_NOW.facts.length - 1] = keep[6]; render();
      return res;
    });
    await p.waitForTimeout(200);
    const fired = await p.evaluate(() => window.__x);
    ck("escaping: hostile text in ERA_NOW.next, the new datacron set, the TB names / readTo and the new Era fact renders as text — nothing injected or executed", r.img === 0 && !r.b && r.shown >= 7 && !fired, JSON.stringify(r));
    allErrs.push(...errs); await ctx.close();
  }

  ck("zero page errors across the suite", allErrs.length === 0, JSON.stringify(allErrs.slice(0, 5)));
  await L.finish(b, srv);
})();
