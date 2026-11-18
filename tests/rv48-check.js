/* rv48-check — the 18 Nov 2026 refresh (ref48/refresh.json: one-click swgoh.gg capture 18 Nov 19:10 AEDT; ref48/schedule-ext-18nov.md: the extended schedule read to
   21 Mar 2027; ref48/team/readiness.md, gac.md, timing.md). Clock pinned to Thu 19 Nov 2026 12:00 AEDT (01:00Z) unless a check says otherwise (PIN_NOW overrides);
   rosters = both 18 Nov compact pulls (rv48-rosters-18nov.json, with display names for the ids the 7 Oct fixture predates) laid over the 7 Oct fixture pulls
   (SNAP_DATE picks another fixture; names, zetas, ships kept). New behaviour only:
     1. ERA_NOW = Era of Rogue One (dates / schedule rows only), ERA_ARCHIVE keeps Era 09 and gains era10; the strapline on 17 / 19 Nov.
     2. EVENTS_SEED v15 (CAPTURED 18 Nov): no past rows at the pinned clock, GAC S85 Week 3 SOURCED to 25 Nov, the TB 24–30 Nov, Conquest 25 Run 3, the TWs, Season 86
        labelled INFERRED, predicted rows flagged, the Rogue One release cadence, coverage to 21 Mar 2027; GAC_SCHEDULE / GCF_S85_NOTE; TERRITORY; Conquest (knownThrough,
        the sourced Run 3 in cqRunStatus); DATACRON_SETS; DROID_RAID (live, B1MERCDROID) + MGL set 4.
     3. Registry: exactly 24 entries with the expected asOf / expires; Data health on 19 Nov and 2 Dec.
     4. GL order on the 18 Nov rosters (Ollie: Jedi Master Luke 14/14 now → Jedi Master Kenobi; Tiny: Jabba with C-3PO the only gap → Jedi Master Luke; M&G "Later —
        released"), Coach flags, NXT rows.
     5. Planner: Carbonite 3v3 + Bronzium for both accounts (Ollie SLKR / Leia / Jabba with Bo-Katan on offence; Tiny SLKR / Leia / Bo-Katan).
     6. Stale-text bans; tools (gl-lib B1 name, parse-capture raid extractor); escaping; overflow at 390 / 1280 with screenshots in ../shots/rv48/; no new localStorage
        keys; zero page errors.
   Run: NODE_PATH=... FILE=DIR/index.html PORT=9xxx [PIN_NOW=iso] [SNAP_DATE=2026-10-07] node tests/rv48-check.js */
const L = require("./lib.js");
const { ck } = L;
const AEDT = (mo, d, h, m, y) => Date.UTC(y || 2026, mo - 1, d, h - 11, m || 0);
const NOW = process.env.PIN_NOW ? Date.parse(process.env.PIN_NOW) : AEDT(11, 19, 12);   // Thu 19 Nov 2026 12:00 AEDT = 01:00Z
const SHOTS = L.path.join(L.ROOT, "shots", "rv48");
try { L.fs.mkdirSync(SHOTS, { recursive: true }); } catch (e) {}
const ROS = JSON.parse(L.fs.readFileSync(L.path.join(__dirname, "rv48-rosters-18nov.json"), "utf8"));

function pulls18() {
  const acc = JSON.parse(L.PULLS), NEW = ROS._names || {};
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
  }, [L.REAL, JSON.stringify(pulls18()), "seeded-" + (o.tag || "x")]);
  await ctx.addInitScript(() => { window.T0 = el => el ? el.innerText.replace(/\s+/g, " ").trim() : ""; });
  await ctx.route(/fonts\.g|swgoh\.gg|swgohrote\.com|corsproxy|allorigins|codetabs|api\.github/, r => r.abort());
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push(String(e).slice(0, 300)));
  p.on("console", m => { if (m.type() === "error" && !/Failed to load resource|net::ERR|fonts\.g/.test(m.text())) errs.push("console: " + m.text().slice(0, 200)); });
  await p.goto(`http://127.0.0.1:${L.PORT}/x.html`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(900);
  return { ctx, p, errs };
}
const BOK_DEF = "Bo-Katan (Mand'alor) trio (defence, 3v3 only)", BOK_OFF = "Bo-Katan (Mand'alor) Mandalorians (offence)";
const SLKR = "Supreme Leader Kylo Ren (GL)", LEIA = "Leia Organa (GL) Rebels", JABBA = "Jabba the Hutt (GL) Bounty Hunters";

(async () => {
  const srv = await L.serve(); const b = await L.chromium.launch();
  const allErrs = [];

  /* ---------- 1/2/3. Era, events seed, schedule data, registry, data health ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "pure" });
    const c = await p.evaluate(([d17, d19, d25, dec2, dec8]) => {
      const by = n => EVENTS_SEED.find(e => e.name === n) || null;
      const strip = h => String(h || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ");
      const reg = Object.fromEntries(SNAPSHOTS.map(s => [s.key, [snapISO(s.asOf), s.expires ? snapISO(s.expires) : "", s.hint]]));
      const dh = t => { const r = dataHealthRows(t); return { n: r.length, stale: r.filter(x => x.st.state === "stale").map(x => x.e.key).sort(), keys: r.map(x => x.e.key).sort() }; };
      const cq = t => { const rs = cqRunStatus(new Date(t)); const box = document.createElement("div"); box.innerHTML = cqRunStatusHtml(rs); return { rs: [rs.live, rs.day, rs.runStart, rs.runEnd, rs.nextStart, rs.stale, rs.liveDays], txt: box.textContent.replace(/\s+/g, " ") }; };
      return {
        era: { n: ERA_NOW.n, name: ERA_NOW.name, start: ERA_NOW.start, end: ERA_NOW.end, ep1: ERA_NOW.episode1End, elCap: ERA_NOW.elCap, asOf: ERA_NOW.asOf, next: ERA_NOW.next, facts: ERA_NOW.facts.join(" | ") },
        arch: { n: ERA_ARCHIVE.n, end: ERA_ARCHIVE.end, e10: ERA_ARCHIVE.era10 },
        win17: strip(eraWindowHtml(d17)), win19: strip(eraWindowHtml(d19)), now19: strip(eraNowHtml(d19)), cur: eraCurrentPhrase(d19),
        ver: EVENTS_SEED_VERSION, cap: EVENTS_SEED_CAPTURED, stateVer: state.eventsSeedVersion, len: EVENTS_SEED.length, stateSeed: state.events.items.filter(e => /^seed\d+$/.test(e.id)).length,
        sorted: EVENTS_SEED.every((e, i) => !i || e.date >= EVENTS_SEED[i - 1].date), cats: EVENTS_SEED.every(e => Object.prototype.hasOwnProperty.call(EVENT_CAT_CHIP, e.cat)),
        seed: EVENTS_SEED.map(e => [e.name, e.date, e.ends || "", e.note, e.cat]),
        w3: by("GAC Season 85 — Week 3 (3v3)"), season: by("GAC Season 85 (3v3)"), tb: by("Territory Battle — Rise of the Empire"), cqRow: by("Conquest Vol. 25 — Run 3"),
        s86: by("GAC Season 86 (5v5, INFERRED)"), twS: by("Territory War — sign-up"), twA: by("Territory War — attack phase"), ds: by("Dark Sovereign"), dd: by("Double Drop Event"),
        moroff: by("New character: Moroff"), merrick: by("New character: General Merrick"), draven: by("New character: General Draven"), jyn: by("New characters: Jyn Erso (Undercover) + Sergeant Melshi"),
        stardust: by("Where Stardust Falls"), ep2: by("Era of Rogue One — Episode 2"), ro: by("Era of Rogue One"), s34: by("Datacron Set 34 expires"), ff: by("Datacron set Forge and Foundry expires"),
        rebel: by("Rebel Roundup"), ghosts: by("Ghosts of Dathomir"), knight: by("Knightfall"), mil: by("Military Might"), dath: by("Defense of Dathomir"), pop: by("Places of Power"),
        sched: GAC_SCHEDULE.events.filter(e => e.season >= 85).map(e => [e.id, e.start, e.format, !!e.est]), gacAs: GAC_SCHEDULE.asOf, s85note: GCF_S85_NOTE, s85html: gcfS85NoteHtml(d19), s85off: gcfS85NoteHtml(d25 + 86400000),
        terr: [TERRITORY.asOf, TERRITORY.tbAsOf, TERRITORY.readTo, new Date(TERRITORY.tw.startMs).toISOString(), new Date(TERRITORY.tw.endMs).toISOString(), new Date(TERRITORY.twNext.signupMs).toISOString(),
          new Date(TERRITORY.twNext.startMs).toISOString(), new Date(TERRITORY.twNext.endMs).toISOString(), new Date(TERRITORY.tb.startMs).toISOString(), new Date(TERRITORY.tb.endMs).toISOString(), TERRITORY.tb.names],
        twNote: strip(territoryNoteHtml("tw", d19)), tbNote: strip(territoryNoteHtml("tb", d19)), tbAfter: strip(territoryNoteHtml("tb", dec2)),
        cqK: [CQDATA.knownThrough, CQDATA.captured, CQDATA.cycle.anchor, CQ_RUN_NEXT.start, CQ_RUN_NEXT.end], cq19: cq(d19), cq25: cq(d25), cq8: cq(dec8), today19: todayConquestLine(),
        dc: DATACRON_SETS.map(d => [d.n, d.name, d.expires, d.focused || ""]),
        dr: { asOf: DROID_RAID.asOf, recheck: DROID_RAID.recheck, note: DROID_RAID.recheckNote, win: DROID_RAID.WINDOW, b1: DROID_RAID.ELIGIBLE.find(e => e.id === "B1MERCDROID") || null, nullIds: DROID_RAID.ELIGIBLE.filter(e => !e.id).map(e => e.name),
          b1Old: DROID_RAID.ELIGIBLE.some(e => e.name === "B1 Battle Droid"), n: DROID_RAID.ELIGIBLE.length, card: strip(drrStatusCardHtml("ollie")), counts: drrCounts("ollie"), countsT: drrCounts("tiny") },
        mgl4: MGL_SETS[3].req.map(r => [r[0], r[1], r[2], !!r[3]]),
        reg, n: SNAPSHOTS.length, keys: new Set(SNAPSHOTS.map(s => s.key)).size, tl: TIER_LIST.updated, tl3: TIER_LIST.categories.find(x => x.key === "3v3"), tl5: TIER_LIST.categories.find(x => x.key === "5v5").season,
        tlf: TIER_LIST.categories.find(x => x.key === "fleet"), dh19: dh(d19), dh2: dh(dec2), card19: strip((dataHealthCard(d19) || {}).html || "")
      };
    }, [AEDT(11, 17, 12), AEDT(11, 19, 12), AEDT(11, 25, 12), AEDT(12, 2, 12), AEDT(12, 8, 12)]);

    /* 1. Era */
    ck("ERA_NOW: Era of Rogue One (n 11, by count), 18 Nov → last live day 9 Feb 2027, Episode 1 to 15 Dec, EL cap not read (null), asOf 18 Nov, no `next`",
      c.era.name === "Era of Rogue One" && c.era.n === 11 && c.era.start === "2026-11-18" && c.era.end === "2027-02-09" && c.era.ep1 === "2026-12-15" && c.era.elCap === null && c.era.asOf === "2026-11-18" && c.era.next === null, JSON.stringify(c.era).slice(0, 200));
    ck("ERA_NOW facts: 18 loaned units incl. Raddus / Jyn / Krennic, Coliseum boss Terentatek, attempts 15 / 10 / 5, the Era Conversion Known Issue (Adelphi Ranger + B1, inbox), cap / Journey / ability tiers NOT read",
      /Loaned units: 18/.test(c.era.facts) && /Admiral Raddus, Jyn Erso and Director Krennic/.test(c.era.facts) && /Terentatek/.test(c.era.facts) && /15 at Tier 1, 10 at Tier 2, 5 at Tier 3/.test(c.era.facts)
      && /Era Conversion Known Issue/.test(c.era.facts) && /Adelphi Ranger and Mercenary Guard Droid \(B1\)/.test(c.era.facts) && /inbox/.test(c.era.facts) && /NOT read/.test(c.era.facts) && /Journey Guide/.test(c.era.facts), "");
    ck("ERA_ARCHIVE: Era 09 kept (the archived section is Era 09's), era10 = The Mandalorian and Grogu Mini-Era 20 Oct → 17 Nov, EL cap 75, Known Issue noted",
      c.arch.n === "09" && c.arch.end === "2026-10-20" && c.arch.e10 && c.arch.e10.n === 10 && c.arch.e10.name === "The Mandalorian and Grogu" && c.arch.e10.end === "2026-11-17" && c.arch.e10.elCap === 75 && /Known issue/i.test(c.arch.e10.note), JSON.stringify(c.arch).slice(0, 200));
    ck("strapline: 17 Nov still Era 10 (to 17 Nov); 19 Nov 'Era of Rogue One to 9 Feb 2027 … Episode 1 … EL cap not read' — not Era 10 as current; the Era box names Rogue One and archives Era 10",
      /^Era 10 .*Mini-Era to 17 Nov 2026/.test(c.win17) && /^Era of Rogue One to 9 Feb 2027/.test(c.win19) && /EL cap not read/.test(c.win19) && /Era 10 ended 17 Nov 2026/.test(c.win19) && !/^Era 10/.test(c.win19)
      && /Running now: Era of Rogue One/.test(c.now19) && /Before it: Era 10 “The Mandalorian and Grogu”/.test(c.now19) && /not the Era running now/.test(c.cur), c.win19 + " || " + c.now19.slice(0, 120));

    /* 2. Events seed */
    ck("EVENTS_SEED v15, CAPTURED '18 Nov 2026', date order, every category in EVENT_CAT_CHIP; saved state reseeded to 15 with exactly the seed rows",
      c.ver === 15 && c.cap === "18 Nov 2026" && c.sorted && c.cats && c.stateVer === 15 && c.stateSeed === c.len && c.len >= 55, JSON.stringify([c.ver, c.cap, c.sorted, c.cats, c.stateVer, c.stateSeed, c.len]));
    ck("no past rows at the pinned clock (Thu 19 Nov): every row's last live day (or start) is on/after 19 Nov; no Era 10 / Week 1 / Week 2 / Champion of the Pit / Endor Escalation row",
      c.seed.every(r => (r[2] || r[1]) >= "2026-11-19") && !c.seed.some(r => /^Era 10|Week 1 \(3v3\)|Week 2 \(3v3\)|^Champion of the Pit \(|Endor Escalation|Zuckuss|Mercenary Guard Droid \(B1\) Era Challenge|accelerated unit releases/.test(r[0])),
      JSON.stringify(c.seed.filter(r => (r[2] || r[1]) < "2026-11-19").map(r => r[0])));
    ck("GAC S85 Week 3 SOURCED: 19 → 25 Nov ('Thu 19 Nov 09:00 → ENDS Wed 25 Nov 09:00 AEDT'), no 'inferred' in its name or note; the season row says W3 sourced and its 26 Nov end carried / unverified",
      c.w3 && c.w3.date === "2026-11-19" && c.w3.ends === "2026-11-25" && /^SOURCED/.test(c.w3.note) && /Thu 19 Nov 09:00 → ENDS Wed 25 Nov 09:00 AEDT/.test(c.w3.note) && !/inferred/i.test(c.w3.name)
      && c.season && /Week 3 is SOURCED/.test(c.season.note) && /CARRIED/.test(c.season.note) && /UNVERIFIED/.test(c.season.note), JSON.stringify(c.w3).slice(0, 160));
    ck("Territory Battle 24 → 29 Nov (closes Mon 30 Nov 05:00, 'Republic Offensive · Rebel Assault', SOURCED); TW sign-up 20 → 21 Nov and attack 22 Nov; Conquest Vol. 25 Run 3 24 Nov → 7 Dec (closes Tue 8 Dec 06:00, SOURCED)",
      c.tb && c.tb.date === "2026-11-24" && c.tb.ends === "2026-11-29" && /Mon 30 Nov 05:00 AEDT/.test(c.tb.note) && /Republic Offensive · Hoth: Rebel Assault/.test(c.tb.note) && /^SOURCED/.test(c.tb.note)
      && c.twS && c.twS.date === "2026-11-20" && c.twS.ends === "2026-11-21" && c.twA && c.twA.date === "2026-11-22" && c.twA.ends === "2026-11-22"
      && c.cqRow && c.cqRow.date === "2026-11-24" && c.cqRow.ends === "2026-12-07" && /Tue 8 Dec 06:00 AEDT/.test(c.cqRow.note) && /^SOURCED/.test(c.cqRow.note), "");
    ck("Season 86 row labelled INFERRED (name and note), 2 Dec, 5v5, no end; Dark Sovereign SOURCED 20 → 21 Nov; Double Drop 20 → 23 Nov (drops not stated); Defense of Dathomir / Places of Power 19 → 20 Nov; Military Might 21 → 22; Knightfall 22",
      c.s86 && /INFERRED/.test(c.s86.name) && /^INFERRED/.test(c.s86.note) && c.s86.date === "2026-12-02" && !c.s86.ends && c.ds && c.ds.cat === "Fleet Mastery" && c.ds.ends === "2026-11-21" && /^SOURCED/.test(c.ds.note)
      && c.dd && c.dd.ends === "2026-11-23" && /NOT stated/.test(c.dd.note) && c.dath && c.dath.ends === "2026-11-20" && c.pop && c.pop.ends === "2026-11-20" && c.mil && c.mil.ends === "2026-11-22" && c.knight && c.knight.ends === "2026-11-22", "");
    ck("Rogue One cadence: Moroff 2 Dec, General Merrick 16 Dec, General Draven 30 Dec, Jyn Erso (Undercover) + Melshi 13 Jan 2027 (GL status unverified); Where Stardust Falls Legendary 13 Jan → 9 Feb; Episode 2 16 Dec → 12 Jan; Era row to 9 Feb 2027",
      c.moroff && c.moroff.date === "2026-12-02" && c.merrick && c.merrick.date === "2026-12-16" && c.draven && c.draven.date === "2026-12-30" && c.jyn && c.jyn.date === "2027-01-13" && /Galactic Legend is UNVERIFIED/.test(c.jyn.note)
      && c.stardust && c.stardust.cat === "Legendary" && c.stardust.ends === "2027-02-09" && c.ep2 && c.ep2.date === "2026-12-16" && c.ep2.ends === "2027-01-12" && c.ro && c.ro.ends === "2027-02-09", "");
    ck("Rebel Roundup 25 → 26 Nov and Ghosts of Dathomir 26 → 27 Nov (sourced); Set 34 26 Nov; Forge and Foundry 18 Feb 2027 with 4 focused variants; coverage to 21 Mar 2027 (last row ≤ 21 Mar)",
      c.rebel && c.rebel.ends === "2026-11-26" && c.ghosts && c.ghosts.ends === "2026-11-27" && c.s34 && c.s34.date === "2026-11-26" && c.ff && /4 focused variants/.test(c.ff.note) && c.seed[c.seed.length - 1][1] <= "2027-03-21" && c.seed[c.seed.length - 1][1] >= "2027-03-01", c.seed[c.seed.length - 1].slice(0, 2).join(" "));
    ck("every '(predicted)' row says PREDICTED; no row claims a Galactic Legend release",
      c.seed.filter(r => /\(predicted\)$/.test(r[0])).length >= 10 && c.seed.filter(r => /\(predicted\)$/.test(r[0])).every(r => /^PREDICTED by swgoh\.gg/.test(r[3])) && !c.seed.some(r => /Galactic Legend (release|unlock)/i.test(r[0])), "");
    ck("GAC_SCHEDULE: s85e3 2026-11-18 SOURCED (no est), s86e1 2026-12-02 5v5 est; asOf 18 Nov; S85 note: Week 3 Thu 19 Nov 09:00 → Wed 25 Nov 09:00 sourced, 2 of 3 rounds stale, SR 1894 → 2046 / 2042, ~2040 band inferred; shown during S85, not after 25 Nov",
      JSON.stringify(c.sched) === JSON.stringify([["s85e1", "2026-11-04", "3v3", false], ["s85e2", "2026-11-11", "3v3", false], ["s85e3", "2026-11-18", "3v3", false], ["s86e1", "2026-12-02", "5v5", true]]) && c.gacAs === "2026-11-18"
      && /Week 3 runs Thu 19 Nov 09:00 → Wed 25 Nov 09:00 AEDT \(sourced\)/.test(c.s85note) && /only 2 of 3 rounds/.test(c.s85note) && /1894 → 2046/.test(c.s85note) && /2042/.test(c.s85note) && /2040 SR/.test(c.s85note) && /inference/.test(c.s85note)
      && /gcf-s85/.test(c.s85html) && c.s85off === "", JSON.stringify(c.sched));
    ck("TERRITORY: asOf / tbAsOf 18 Nov; current war attack 18 Nov 06:00 → 19 Nov 06:00; next war sign-up Fri 20 Nov 06:00, attack Sun 22 Nov 05:00 → Mon 23 Nov 05:00; TB 24 Nov 05:00 → 30 Nov 05:00 'Republic Offensive · Rebel Assault'",
      JSON.stringify(c.terr) === JSON.stringify(["2026-11-18", "2026-11-18", "21 Mar 2027", "2026-11-17T19:00:00.000Z", "2026-11-18T19:00:00.000Z", "2026-11-19T19:00:00.000Z", "2026-11-21T18:00:00.000Z", "2026-11-22T18:00:00.000Z", "2026-11-23T18:00:00.000Z", "2026-11-29T18:00:00.000Z", "Geonosis: Republic Offensive · Hoth: Rebel Assault"]), JSON.stringify(c.terr));
    ck("TW / TB notes at 19 Nov 12:00: next war 'sign-up opens in 18h 0m', TB 'starts in 4d 17h'; the 'lists no later Territory War' wording is gone (rows appear only a few days ahead); after 30 Nov the TB says over with the same caveat",
      /Territory War \(next war\)/.test(c.twNote) && /sign-up opens in 18h 0m/.test(c.twNote) && /only a few days ahead/.test(c.twNote) && !/lists no later Territory War|lists no war after that/.test(c.twNote)
      && /starts in 4d 17h/.test(c.tbNote) && /read 18 Nov 2026/.test(c.tbNote) && /over/.test(c.tbAfter) && /only a few days ahead/.test(c.tbAfter), c.twNote.slice(0, 200));
    ck("Conquest: knownThrough 2026-12-07 (captured 27 Sep / anchor untouched); CQ_RUN_NEXT 24 Nov → 7 Dec; 19 Nov = between runs, next 24 Nov (sourced, 'Run 3'), not stale; 25 Nov = day 2 of 14 of Run 3; 8 Dec = stale",
      JSON.stringify(c.cqK) === JSON.stringify(["2026-12-07", "27 Sep 2026", "2026-09-28", "2026-11-24", "2026-12-07"]) && c.cq19.rs[0] === false && c.cq19.rs[4] === "2026-11-24" && c.cq19.rs[5] === false && /Run 3, starts Tue 24 Nov 06:00 AEDT and ends Tue 8 Dec 06:00 AEDT/.test(c.cq19.txt)
      && JSON.stringify(c.cq25.rs.slice(0, 4)) === '[true,2,"2026-11-24","2026-12-07"]' && c.cq25.rs[6] === 14 && /Day 2 of 14 — live now/.test(c.cq25.txt) && c.cq8.rs[5] === true && /Run 3 starts Tue 24 Nov 06:00 AEDT/.test(c.today19), c.cq19.txt.slice(0, 200));
    ck("DATACRON_SETS: Forge and Foundry '10 character datacrons, 4 focused variants'; 37 / 36 / 35 / 34 expiries unchanged",
      /10 character datacrons, 4 focused variants/.test(c.dc[0][3]) && JSON.stringify(c.dc.slice(0, 4).map(d => [d[0], d[2]])) === JSON.stringify([[37, "2027-02-18"], [36, "2027-01-21"], [35, "2026-12-24"], [34, "2026-11-26"]]), JSON.stringify(c.dc));
    ck("DROID_RAID: asOf 18 Nov, WINDOW launched, recheck note '243 posted runs' + 'Shared loadouts: Coming soon' read as a separate feature; 33 eligible; Mercenary Guard Droid (B1) = B1MERCDROID (glreq R7, no 'B1 Battle Droid' row); only M&G has no id",
      c.dr.asOf === "2026-11-18" && c.dr.win.launched === true && /243 posted runs/.test(c.dr.note) && /Shared loadouts: Coming soon/.test(c.dr.note) && /separate feature/.test(c.dr.note) && c.dr.n === 33
      && c.dr.b1 && c.dr.b1.name === "Mercenary Guard Droid (B1)" && c.dr.b1.overlap === "glreq" && c.dr.b1.glRelic === 7 && !c.dr.b1.unconfirmed && !c.dr.b1Old && JSON.stringify(c.dr.nullIds) === '["The Mandalorian and Grogu"]', JSON.stringify(c.dr.nullIds));
    ck("raid card: 'raid planner · live', not 'unreleased'; Tier 0 at best; counts on the 18 Nov rosters: Ollie 28 owned / 21 at 4★+ / 5 at G12, Tiny 28 / 14 / 3 (the readiness review's figures)",
      /raid planner · live/.test(c.dr.card) && !/unreleased/i.test(c.dr.card) && /Tier 0 at best/.test(c.dr.card) && c.dr.counts.owned === 28 && c.dr.counts.floor === 21 && c.dr.counts.g12 === 5 && c.dr.countsT.owned === 28 && c.dr.countsT.floor === 14 && c.dr.countsT.g12 === 3,
      JSON.stringify([c.dr.counts.owned, c.dr.counts.floor, c.dr.counts.g12, c.dr.countsT.owned, c.dr.countsT.floor, c.dr.countsT.g12]));
    ck("MGL set 4: Mercenary Guard Droid (B1) carries B1MERCDROID and is flagged raid (was null / not raid)", JSON.stringify(c.mgl4[0]) === '["B1MERCDROID","Mercenary Guard Droid (B1)",7,true]', JSON.stringify(c.mgl4));
    ck("TIER_LIST: updated 18 Nov; 3v3 = Season 85 (108 rows, #1 The Stranger 95.1%, Leia A 81.7%, Jabba A 80.9%, M&G A); fleet = Season 85 (11 rows, Negotiator 7th); 5v5 stays Season 84 with its own 1 Nov asOf",
      c.tl === "18 Nov 2026" && c.tl3.season === 85 && c.tl3.squads.length === 108 && c.tl3.squads[0].leader === "The Stranger" && c.tl3.squads[0].wr === 95.1
      && JSON.stringify(c.tl3.squads.find(s => s.leader === "Leia Organa")) === '{"leader":"Leia Organa","tier":"A","wr":81.7,"battles":"61.9K"}' && c.tl3.squads.find(s => s.leader === "Jabba the Hutt").tier === "A" && c.tl3.squads.find(s => s.leader === "The Mandalorian and Grogu").tier === "A"
      && c.tlf.season === 85 && c.tlf.squads.length === 11 && c.tlf.squads[6].leader === "Negotiator" && c.tl5 === 84, "");

    /* 3. Registry + data health */
    const A = k => c.reg[k][0], E = k => c.reg[k][1];
    ck("registry: exactly 24 unique entries", c.n === 24 && c.keys === 24, `${c.n}/${c.keys}`);
    const BUMP = ["events", "gac-schedule", "era", "droid-raid", "datacrons", "gac-counters", "meta-squads", "tierlist", "meta-fleets", "gl-queue", "nxt-queue", "ship-guide", "conquest", "coach-tips"];
    ck("asOf 2026-11-18 (re-read or re-derived 18 Nov): " + BUMP.join(", "), BUMP.every(k => A(k) === "2026-11-18"), JSON.stringify(BUMP.filter(k => A(k) !== "2026-11-18").map(k => [k, A(k)])));
    ck("NOT bumped: gac-format 25 Oct, cap-journeys / executor-event 22 Oct, raid-intel 17 Aug, raid-notes 9 Aug, gl-roadmap 8 Aug, bestmods / tb-rote / assault-battles / executor-req unchanged",
      A("gac-format") === "2026-10-25" && A("cap-journeys") === "2026-10-22" && A("executor-event") === "2026-10-22" && A("raid-intel") === "2026-08-17" && A("raid-notes") === "2026-08-09" && A("gl-roadmap") === "2026-08-08"
      && A("tb-rote") === "2026-08-09" && A("assault-battles") === "2026-08-22" && A("executor-req") === "2026-08-09", "");
    ck("hard ends: gl-queue / ship-guide / nxt-queue 2026-12-01; era 2027-02-09; conquest 2026-12-07 (= knownThrough)",
      E("gl-queue") === "2026-12-01" && E("ship-guide") === "2026-12-01" && E("nxt-queue") === "2026-12-01" && E("era") === "2027-02-09" && E("conquest") === "2026-12-07", JSON.stringify(["gl-queue", "ship-guide", "nxt-queue", "era", "conquest"].map(E)));
    ck("hints say what was NOT re-read: era 'dates only' + cap / Journey not researched; tierlist names the 5v5 exception; conquest says the plan / disks / intel are the 27 Sep capture; gac-counters says the reasoning is 27 Sep",
      /dates only/.test(c.reg.era[2]) && /NOT researched/.test(c.reg.era[2]) && /5v5 board is still the 1 Nov read/.test(c.reg.tierlist[2]) && /27 Sep capture/.test(c.reg.conquest[2]) && /Run 3/.test(c.reg.conquest[2]) && /27 Sep analysis/.test(c.reg["gac-counters"][2]), "");
    ck("Data health 19 Nov: 3 want a re-pull, 1 overdue (cap-journeys); aging raid-intel / raid-notes — was 7 (3 overdue) on the 10 Nov build",
      c.dh19.n === 3 && JSON.stringify(c.dh19.stale) === '["cap-journeys"]' && JSON.stringify(c.dh19.keys) === '["cap-journeys","raid-intel","raid-notes"]' && /3 of 24 built-in references want a re-pull, 1 overdue/.test(c.card19), JSON.stringify(c.dh19));
    ck("Data health 2 Dec: gl-queue, ship-guide and nxt-queue are stale (window ended 1 Dec — before the inferred Season 86 start)",
      ["gl-queue", "ship-guide", "nxt-queue"].every(k => c.dh2.stale.includes(k)), JSON.stringify(c.dh2));
    allErrs.push(...errs); await ctx.close();
  }

  /* ---------- 4. GL order, Coach, NXT on the 18 Nov rosters ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "gl" });
    const c = await p.evaluate(() => {
      const eff = a => glqRows(a).map(r => [r.e.glId || r.e.watchId, r.eff, r.tiers]);
      const card = a => { switchAcct(a); switchTab("leia"); const el = document.querySelector('#glTables [data-card="glq"]'); return { mnote: T0(el.querySelector(".mnote")), rows: [...el.querySelectorAll(".glq-row")].map(r => [r.dataset.glq, T0(r.querySelector(".chip")), T0(r.querySelector(".glq-ready"))]), text: el.textContent }; };
      const tip = (a, id) => { const t = TIPS[a].find(x => x.id === id); const reqs = state.pulls[a].reqs; return t ? { sev: t.sev, t: t.t, note: t.note, prog: t.check ? tipProgress(reqs, t.check) : null } : null; };
      const blob = JSON.stringify([GL_QUEUE, NXT_QUEUE, SHIP_DATA, SHP_WHY, SHIP_PLAN, TIPS.ollie.filter(t => t.t).map(t => [t.t, t.note]), TIPS.tiny.filter(t => t.t).map(t => [t.t, t.note]), DROID_RAID]);
      const nxt = a => nxtRows(a).map(r => [r.e.id, r.eff]);
      return { oEff: eff("ollie"), tEff: eff("tiny"), oCard: card("ollie"), tCard: card("tiny"), blob, asOf: [GL_QUEUE.asOf, GL_QUEUE.ollie.asOf, GL_QUEUE.tiny.asOf, NXT_QUEUE.asOf, SHIP_DATA.asOf],
        basis: GL_QUEUE.basis, watch: GL_QUEUE.watch.MANDOGROGU, jml: GL_QUEUE.ollie.queue.find(e => e.glId === "GRANDMASTERLUKE"), leiaO: GL_QUEUE.ollie.queue.find(e => e.glId === "GLLEIA"),
        tJabba: GL_QUEUE.tiny.queue.find(e => e.glId === "JABBATHEHUTT"), tJml: GL_QUEUE.tiny.queue.find(e => e.glId === "GRANDMASTERLUKE"), see: GL_QUEUE.ollie.queue.find(e => e.glId === "SITHPALPATINE"),
        oPrep: GL_QUEUE.ollie.prep.map(it => it.id), tPrep: GL_QUEUE.tiny.prep.map(it => it.id),
        oIds: TIPS.ollie.map(t => t.id), tIds: TIPS.tiny.map(t => t.id), oRun: tip("ollie", "jml-run-unlock-event"), oW3: tip("ollie", "s85-3v3-defence"), tW3: tip("tiny", "tiny-s85-3v3-defence"),
        tJab: tip("tiny", "jabba-now-closer-than-jml"), tFreeze: tip("tiny", "freeze-luxury-relics-until-jedi"), tFive: tip("tiny", "five-jedi-master-luke-units"), oGs: tip("ollie", "no-general-skywalker-despite-8"), oB1: tip("ollie", "b1-marquee-proving-grounds"),
        nxtO: nxt("ollie"), nxtT: nxt("tiny"), weekO: NXT_QUEUE.ollie.doThisWeek, weekT: NXT_QUEUE.tiny.doThisWeek, ship: SHIP_PLAN.ollie.find(x => x.id === "CARSONTEVA").tier };
    });
    ck("asOf 2026-11-18: GL_QUEUE, Ollie, Tiny, NXT_QUEUE, SHIP_DATA; basis names the Season 85 3v3 boards (no 'Season 83' as the current 3v3 source)",
      c.asOf.every(x => x === "2026-11-18") && /Season 85 3v3/.test(c.basis) && !/Season 83/.test(c.basis), JSON.stringify(c.asOf));
    ck("Ollie: Leia ✓ → Jedi Master Luke NOW (14/14, 0 tiers) → Jedi Master Kenobi next (44) → SEE (43, only if Bane) → GL Ahsoka (66) ahead of Lord Vader (86) → M&G later (107) → Hondo",
      JSON.stringify(c.oEff) === JSON.stringify([["GLLEIA", "done", 0], ["GRANDMASTERLUKE", "building", 0], ["JEDIMASTERKENOBI", "next", 44], ["SITHPALPATINE", "then", 43], ["GLAHSOKATANO", "later", 66], ["LORDVADER", "later", 86], ["MANDOGROGU", "later", 107], ["GLHONDO", "later", 82]]), JSON.stringify(c.oEff));
    ck("Tiny: Leia ✓ → Jabba NOW (3 tiers) → Jedi Master Luke next (17) → JMK / SEE / GL Ahsoka then → Lord Vader → M&G later → Hondo",
      JSON.stringify(c.tEff) === JSON.stringify([["GLLEIA", "done", 0], ["JABBATHEHUTT", "building", 3], ["GRANDMASTERLUKE", "next", 17], ["JEDIMASTERKENOBI", "then", 63], ["SITHPALPATINE", "then", 40], ["GLAHSOKATANO", "then", 65], ["LORDVADER", "later", 58], ["MANDOGROGU", "later", 107], ["GLHONDO", "later", 68]]), JSON.stringify(c.tEff));
    const row = (cd, id) => cd.rows.find(r => r[0] === id) || [];
    ck("cards: Ollie 'Now: Jedi Master Luke Skywalker · next: Jedi Master Kenobi', JML '14/14 met'; Tiny 'Now: Jabba the Hutt · next: Jedi Master Luke Skywalker', Jabba '13/14 met … ≈3 relic tiers left'; M&G chip 'Later — released' on both (no 'unreleased')",
      /Now: Jedi Master Luke Skywalker · next: Jedi Master Kenobi\./.test(c.oCard.mnote) && /^14\/14 met/.test(row(c.oCard, "GRANDMASTERLUKE")[2] || "") && /Now: Jabba the Hutt · next: Jedi Master Luke Skywalker\./.test(c.tCard.mnote)
      && /^13\/14 met · \d+% · ≈3 relic tiers left$/.test(row(c.tCard, "JABBATHEHUTT")[2] || "") && /Later — released$/.test(row(c.oCard, "MANDOGROGU")[1] || "") && /Later — released$/.test(row(c.tCard, "MANDOGROGU")[1] || "")
      && !/unreleased/i.test(c.oCard.text) && !/unreleased/i.test(c.tCard.text), JSON.stringify([row(c.oCard, "MANDOGROGU"), row(c.tCard, "JABBATHEHUTT")]));
    ck("JML: 'ALL 14 REQUIREMENTS MET', run the event now, unlock 19–25 Nov MEDIUM, Journey Guide / tiers unverified; Tiny's Jabba: C-3PO R4 → R7 the ONLY gap, requirements 21–25 Nov, unlock 23–28 Nov; Tiny's JML 8 of 14, 17 tiers, 3 to G13, late Dec – mid Jan",
      /ALL 14 REQUIREMENTS MET/.test(c.jml.why) && /run his unlock event now/.test(c.jml.why) && /19–25 Nov \(confidence MEDIUM\)/.test(c.jml.why) && /unverified/.test(c.jml.flag)
      && /ONLY gap is C-3PO R4 → R7/.test(c.tJabba.why) && /about 21–25 Nov/.test(c.tJabba.why) && /about 23–28 Nov/.test(c.tJabba.why) && /8 of 14 met, 17 relic tiers/.test(c.tJml.why) && /3 units to G13/.test(c.tJml.why) && /late Dec 2026 – mid Jan 2027/.test(c.tJml.why), "");
    ck("M&G watch: released: true, note says RELEASED with the S85 #1 defence row (80.8% / 1,314 battles) and the raid page, release date unverified, 0 of 16 / ~107 tiers; SEE: Bane via Conquest Run 3 (24 Nov) plausible but unverified; Leia R8 (not 'frozen at R7')",
      c.watch.released === true && /^RELEASED/.test(c.watch.note) && /80\.8% hold over 1,314 battles/.test(c.watch.note) && /raid page/.test(c.watch.note) && /release date is unverified/.test(c.watch.note) && /0 of 16/.test(c.watch.note) && /107 relic tiers/.test(c.watch.note)
      && /Conquest 25 Run 3 starts Tue 24 Nov 06:00 AEDT/.test(c.see.trigger) && /plausible but UNVERIFIED/.test(c.see.trigger) && /G13 R8/.test(c.leiaO.why) && !/frozen at R7/.test(c.blob), "");
    ck("prep ids: old ids kept (ticks keyed by id) + new ollie stc-g12 / gs-7star, tiny stc-stars",
      JSON.stringify(c.oPrep) === '["lobot-g13","jml-gear","jml-verify","stc-g12","gs-7star","maul-g13","groguants-7","scion-unlock","skip-peridea"]' && JSON.stringify(c.tPrep) === '["luke-gear","raddus-jyn-g13","groguants-7","stc-stars","thrawn-rule"]', JSON.stringify([c.oPrep, c.tPrep]));
    ck("no 'unreleased' anywhere in GL_QUEUE / NXT_QUEUE / SHIP data / TIPS text / DROID_RAID (raid and M&G are released)", !/unreleased/i.test(c.blob), (c.blob.match(/.{60}unreleased.{30}/i) || [""])[0]);
    ck("Coach: Ollie ids = the 10 Nov 14 + 'jml-run-unlock-event' appended LAST (positional tick migration safe), fixnow, retires on JML 7★ (0/1 now); Tiny ids unchanged (13)",
      c.oIds.length === 15 && c.oIds[13] === "drr-four-star-floor" && c.oIds[14] === "jml-run-unlock-event" && c.oRun.sev === "fixnow" && /Run Jedi Master Luke's unlock event today/.test(c.oRun.t) && c.oRun.prog.doneCount === 0 && c.tIds.length === 13 && c.tIds[c.tIds.length - 1] === "drr-four-star-floor", JSON.stringify(c.oIds.slice(-3)));
    ck("Coach Tiny: 'C-3PO is the only gap before Jabba' (2/3 on the 18 Nov pull: Han R8 ✓, Fennec R7 ✓); freeze flag 'last three tiers'; three JML units to G13 (0/3)",
      /^C-3PO is the only gap before Jabba: C-3PO R4 → R7$/.test(c.tJab.t) && c.tJab.prog.doneCount === 2 && c.tJab.prog.total === 3 && /last three tiers/.test(c.tFreeze.t) && /^Three Jedi Master Luke units/.test(c.tFive.t) && c.tFive.prog.total === 3 && c.tFive.prog.doneCount === 0, JSON.stringify([c.tJab.prog, c.tFive.prog]));
    ck("Coach W3 flags (both): 'Thu 19 Nov 09:00 → Wed 25 Nov 09:00'; Ollie Jabba + Leia + SLKR with Bo-Katan on offence (alternative given), Tiny unchanged SLKR + Leia + Bo-Katan / Negotiator; ~2040 band inferred; General Skywalker 5★ flag; B1 = raid unit + inbox",
      /Thu 19 Nov 09:00 → Wed 25 Nov 09:00/.test(c.oW3.t) && /Jabba \+ Leia \+ SLKR on defence, Bo-Katan attacks/.test(c.oW3.t) && /30\.3% over 60K/.test(c.oW3.note) && /measured numbers only/.test(c.oW3.note) && /2040 SR/.test(c.oW3.note)
      && /Thu 19 Nov 09:00 → Wed 25 Nov 09:00/.test(c.tW3.t) && /SLKR \+ Leia \+ Bo-Katan on defence, unchanged/.test(c.tW3.t) && /Negotiator/.test(c.tW3.note) && /General Skywalker unlocked \(5★\)/.test(c.oGs.t) && /confirmed Droid Destruction unit/.test(c.oB1.t) && /inbox/.test(c.oB1.note), "");
    ck("NXT: 'rogue-one-kits' is the last row on both accounts (release dates only); Ollie's JML row is Done; this week = run JML / JMK cheap steps / General Skywalker 7★ / Snowtrooper Commander G12; Tiny's = C-3PO only gap; Teva no longer P1",
      c.nxtO[c.nxtO.length - 1][0] === "rogue-one-kits" && c.nxtT[c.nxtT.length - 1][0] === "rogue-one-kits" && c.nxtO[0][0] === "jml-reqs" && c.nxtO[0][1] === "done"
      && /ALL MET/.test(c.weekO) && /Mace Windu R3/.test(c.weekO) && /General Skywalker to 7★/.test(c.weekO) && /Snowtrooper Commander G10 → G12/.test(c.weekO) && /C-3PO R4 → R7 is the ONLY gap/.test(c.weekT) && c.ship === "P2", JSON.stringify([c.nxtO[0], c.ship]));
    for (const w of [1280, 390]) {
      await p.setViewportSize({ width: w, height: 1000 });
      for (const a of ["ollie", "tiny"]) {
        await L.go(p, a, "leia"); await p.waitForTimeout(200);
        const card = await p.$('#glTables [data-card="glq"]');
        if (card) await card.screenshot({ path: L.path.join(SHOTS, `rv48-glq-${a}-${w}.png`) });
        const o1 = await L.overflow(p);
        ck(`[${w}] ${a}: no horizontal overflow (GL Roadmap with the GL order card)`, o1.doc <= o1.inner + 1, JSON.stringify(o1));
        await L.go(p, a, "coach"); await p.evaluate(() => { state.views.coach = "priorities"; render(); }); await p.waitForTimeout(250);
        const co = await p.evaluate(() => ({ act: T0(document.querySelector('[data-card="action-flags"]')), all: T0(document.getElementById("tips")) }));
        if (a === "ollie") ck(`[${w}] Coach (ollie): Action flags carry 'Run Jedi Master Luke's unlock event today'; source line names the 18 Nov pulls; flags as of 18 Nov 2026`, /Run Jedi Master Luke's unlock event today/.test(co.act) && /18 Nov pulls/.test(co.all) && /Flags as of 18 Nov 2026/.test(co.all), co.act.slice(0, 160));
        else ck(`[${w}] Coach (tiny): Action flags lead with 'C-3PO is the only gap before Jabba'`, /C-3PO is the only gap before Jabba/.test(co.act), co.act.slice(0, 160));
        const o2 = await L.overflow(p);
        ck(`[${w}] ${a}: no horizontal overflow (Coach)`, o2.doc <= o2.inner + 1, JSON.stringify(o2));
      }
    }
    allErrs.push(...errs); await ctx.close();
  }

  /* ---------- 5. GAC planner on the 18 Nov rosters ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "plan" });
    await L.go(p, "ollie", "gac");
    const PLAN = ([a, lg]) => {
      switchAcct(a); state.views["gcolg-" + a] = lg; state.views["gco-" + a] = "3v3"; gcfPlanMemo.clear();
      const def = gcoPlanFor(a), off = gofPlanFor(a);
      const res = { def: def.squadSlots.map(x => x.cand ? x.cand.name : null), fleet: def.fleetSlots.map(x => x.cand ? x.cand.name : null), off: off.picked.map(c => c.name),
        jabbaHold: (def.squadSlots.find(x => x.cand && x.cand.name === "Jabba the Hutt (GL) Bounty Hunters") || { cand: {} }).cand.hold || "",
        blocked: def.skipped.filter(s => /trio \(defence, 3v3 only\)/.test(s.name) && /not owned/.test(s.reason)).map(s => s.name).sort() };
      delete state.views["gcolg-" + a]; delete state.views["gco-" + a]; gcfPlanMemo.clear();
      return res;
    };
    const oc = await p.evaluate(PLAN, ["ollie", "carbonite"]), tc = await p.evaluate(PLAN, ["tiny", "carbonite"]);
    const ob = await p.evaluate(PLAN, ["ollie", "bronzium"]), tb = await p.evaluate(PLAN, ["tiny", "bronzium"]);
    ck("planner, Carbonite 3v3, Ollie: SLKR + Leia + Jabba on defence (Jabba's S85 30.3% hold line shown), Executor; Bo-Katan (Mand'alor) is on the OFFENCE bench (first), not on defence",
      JSON.stringify(oc.def) === JSON.stringify([SLKR, LEIA, JABBA]) && JSON.stringify(oc.fleet) === '["Executor (flagship only)"]' && oc.off[0] === BOK_OFF && !oc.def.includes(BOK_DEF) && /30\.3% hold, 60K battles/.test(oc.jabbaHold), JSON.stringify([oc.def, oc.off]));
    ck("Ollie's offence bench: Bo-Katan, Rey, Padmé trio, Darth Revan trio, Commander Luke, Hera (Jabba no longer attacks — he defends)",
      JSON.stringify(oc.off) === JSON.stringify([BOK_OFF, "Rey (GL) Jedi", "Padmé Amidala trio (offence, 3v3 only)", "Darth Revan trio (offence, 3v3 only)", "Commander Luke Skywalker Rebels (offence)", "Hera Syndulla Phoenix (offence)"]), JSON.stringify(oc.off));
    ck("planner, Carbonite 3v3, Tiny: unchanged — SLKR + Leia + the Bo-Katan defence trio, Negotiator; bench General Skywalker, Padmé, Rey, CLS, Hera, Bossk",
      JSON.stringify(tc.def) === JSON.stringify([SLKR, LEIA, BOK_DEF]) && JSON.stringify(tc.fleet) === '["Negotiator (flagship only)"]'
      && JSON.stringify(tc.off) === JSON.stringify(["General Skywalker 501st (offence)", "Padmé Amidala trio (offence, 3v3 only)", "Rey (GL) Jedi", "Commander Luke Skywalker Rebels (offence)", "Hera Syndulla Phoenix (offence)", "Bossk Bounty Hunters"]), JSON.stringify([tc.def, tc.off]));
    ck("Bronzium (7 squads): Ollie SLKR, Leia, Jabba, Bo-Katan defence trio, Rey, Bossk, Thrawn; Tiny SLKR, Leia, Bo-Katan, Rey, Bossk, Nightsisters + one empty slot; no unit on both sides",
      JSON.stringify(ob.def) === JSON.stringify([SLKR, LEIA, JABBA, BOK_DEF, "Rey (GL) Jedi", "Bossk Bounty Hunters", "Grand Admiral Thrawn Empire"])
      && JSON.stringify(tb.def) === JSON.stringify([SLKR, LEIA, BOK_DEF, "Rey (GL) Jedi", "Bossk Bounty Hunters", "Nightsisters", null]) && !ob.off.includes(BOK_OFF) && !ob.off.includes("Rey (GL) Jedi"), JSON.stringify([ob.def, tb.def]));
    ck("the S85 board's top trios (M&G #1, The Stranger #2, Baylan Skoll #4) are blocked candidates on both accounts — leader not owned",
      JSON.stringify(oc.blocked) === JSON.stringify(["Baylan Skoll trio (defence, 3v3 only)", "The Mandalorian and Grogu trio (defence, 3v3 only)", "The Stranger trio (defence, 3v3 only)"]) && JSON.stringify(tc.blocked) === JSON.stringify(oc.blocked), JSON.stringify(oc.blocked));
    const g = await p.evaluate(() => ({ bok: GCO_DEF_BOARD[0], mg: GCO_DEF_BOARD.find(x => /Mandalorian and Grogu/.test(x.name)), dates: gacCountersDatesHtml().replace(/<[^>]+>/g, ""), slkr: GAC_COUNTERS.find(x => x.def === "Supreme Leader Kylo Ren (GL)").why,
      leia: GAC_COUNTERS.find(x => x.def === "Leia Organa (GL) Rebels").why, rey: GAC_COUNTERS.find(x => x.def === "GL Rey (Rey Jedi Master)").why, newRows: GAC_COUNTERS.filter(x => /Mandalorian and Grogu|Baylan/.test(x.def)).map(x => x.def), holdAs: GAC_COUNTERS_HOLD_ASOF,
      leiaHold: META_SQUADS.find(x => x.name === "Leia Organa (GL) Rebels").hold["3v3"], jabbaTl: META_SQUADS.find(x => x.name === "Jabba the Hutt (GL) Bounty Hunters").tl3v3 }));
    ck("GCO_DEF_BOARD Bo-Katan: S85 #17 A 23.7% over 1,450 (read 18 Nov, small sample); M&G row #1 S 80.8% / 1,314 (LOW); META Leia hold S85 #9 A 22.9%; Jabba tl3v3 set",
      g.bok.defTier.season === 85 && g.bok.defTier.rank === 17 && g.bok.defTier.hold === 23.7 && g.bok.defTier.battles === "1,450" && /S85 · read 18 Nov 2026/.test(g.bok.hold["3v3"]) && /small sample/.test(g.bok.hold["3v3"])
      && g.mg && g.mg.defTier.rank === 1 && g.mg.defTier.hold === 80.8 && g.mg.defTier.battles === "1,314" && g.mg.confidence === "LOW" && /Season 85, read 18 Nov 2026.*#9, A tier, 22\.9% hold/.test(g.leiaHold) && g.jabbaTl === "Jabba the Hutt", "");
    ck("GAC_COUNTERS: HOLD_ASOF 18 Nov, dates line names Season 85 (3v3) and the 5v5 1 Nov read; SLKR no longer 'top 4 on both' (now #7), Leia A on 3v3, GL Rey #8; new rows for The Mandalorian and Grogu and Baylan Skoll",
      g.holdAs === "2026-11-18" && /Season 85 \(3v3\)/.test(g.dates) && /5v5 \(Season 84\)/.test(g.dates) && !/Season 83/.test(g.dates) && !/top 4 on both/.test(g.slkr) && /#7, A, 26\.0%/.test(g.slkr) && /A on the Season 85 3v3 board/.test(g.leia) && /#8, A, 22\.1%/.test(g.rey)
      && g.newRows.length === 2, JSON.stringify(g.newRows));
    for (const w of [1280, 390]) {
      await p.setViewportSize({ width: w, height: 1000 });
      for (const a of ["ollie", "tiny"]) {
        await p.evaluate(([acct]) => { switchAcct(acct); delete state.views["gcolg-" + acct]; delete state.views["gco-" + acct]; switchTab("gac"); sectionView("gac", "defense"); gofRun(acct); }, [a]);
        await p.waitForTimeout(350);
        const u = await p.evaluate(() => { const c = document.querySelector('[data-card="gco"]'); return { t: T0(c), title: T0(c.querySelector(".gco-plan-title")), s85: T0(c.querySelector(".gcf-s85")) }; });
        ck(`[${w}] ${a}: planner title 'Season 85 Event 3 · 3v3 defence plan' (no '(estimated dates)'), the S85 Week 3 note under it`,
          /^Season 85 Event 3 · 3v3 defence plan/.test(u.title) && !/estimated/.test(u.title) && /Week 3 runs Thu 19 Nov 09:00 → Wed 25 Nov 09:00/.test(u.s85), u.title + " | " + u.s85.slice(0, 80));
        const o = await L.overflow(p);
        ck(`[${w}] ${a}: no horizontal overflow (GAC planner)`, o.doc <= o.inner + 1, JSON.stringify(o));
        const card = await p.$('[data-card="gco"]');
        if (card) await card.screenshot({ path: L.path.join(SHOTS, `rv48-gac-${a}-${w}.png`) });
      }
    }
    allErrs.push(...errs); await ctx.close();
  }

  /* ---------- 6. stale-text bans, tools, views, escaping, storage ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "views" });
    const s = await p.evaluate(() => {
      const evNotes = EVENTS_SEED.map(e => e.name + " " + e.note).join(" | ");
      const tipsTxt = JSON.stringify([TIPS.ollie.filter(t => t.t).map(t => [t.t, t.note]), TIPS.tiny.filter(t => t.t).map(t => [t.t, t.note])]);
      return { inferred26: [evNotes, GCF_S85_NOTE, tipsTxt].filter(t => /Week 3 is inferred|Week 3 \(3v3, inferred\)|inferred at Thu 19 Nov 09:00 → Thu 26 Nov|INFERRED, not read: the 10 Nov/.test(t)).length,
        era10: [eraWindowHtml(), eraNowHtml()].some(h => /^(<[^>]+>)*Era 10\b/.test(h) || /Running now: Era 10/.test(h)), s83: [TIER_LIST.categories.find(c => c.key === "3v3").season, /Season 83/.test(GL_QUEUE.basis), /Season 83/.test(GCF_S85_NOTE), /Season 83 \(3v3\)/.test(gacCountersDatesHtml())],
        mgl: MGL_REQ.find(r => r[1] === "Mercenary Guard Droid (B1)")[0], s85tips: /Season 83 3v3 DEFENCE board/.test(tipsTxt) };
    });
    ck("stale-text bans: no 'Week 3 … inferred … 26 Nov' anywhere in the seed / S85 note / tips; no Era 10 as the current Era; no 'Season 83' as the current 3v3 source (tier list 85, GL basis, S85 note, counters dates, Coach)",
      s.inferred26 === 0 && !s.era10 && s.s83[0] === 85 && !s.s83[1] && !s.s83[2] && !s.s83[3] && !s.s85tips, JSON.stringify(s));
    ck("B1MERCDROID is the id everywhere the app names Mercenary Guard Droid (B1) (MGL_REQ, DROID_RAID.ELIGIBLE)", s.mgl === "B1MERCDROID", s.mgl);
    const libSrc = L.fs.readFileSync(L.path.join(L.ROOT, "tools", "gl-lib.js"), "utf8");
    let raidRes = null;
    try {
      const P = require(L.path.join(L.ROOT, "tools", "parse-capture.js"));
      const live = P.raidFacts({ source: "fetch", title: "x", releaseText: "Coming soon", facts: [], rows: [], text: "Duration\n2d 23h\nLaunch cost\n180K\nEntry\n4★ · Droid Destruction Raid\nReadiness\nShared loadouts Coming soon\n243 posted runs Squads players posted in the SWGoH Raid Server through Nov 17, 2026." });
      const pre = P.raidFacts({ source: "fetch", title: "x", releaseText: "In development · No release date", facts: [], rows: [], text: "Upcoming raid" });
      raidRes = { live, pre };
    } catch (e) { raidRes = { err: String(e) }; }
    ck("tools: gl-lib.js names B1MERCDROID 'Mercenary Guard Droid (B1)' and reads the watch entry's released flag; parse-capture's raid extractor reads 'N posted runs' as released and 'Shared loadouts: Coming soon' as that feature (a pre-release page parses as before)",
      /B1MERCDROID: "Mercenary Guard Droid \(B1\)"/.test(libSrc) && /released: w\.released === true/.test(libSrc) && raidRes.live && raidRes.live.released === true && raidRes.live.postedRuns === 243 && raidRes.live.postedThrough === "Nov 17, 2026"
      && raidRes.live.sharedLoadouts === "Coming soon" && raidRes.live.releaseText === null && raidRes.live.status === "released" && raidRes.live.duration === "2d 23h" && raidRes.pre.released === false && /In development/.test(raidRes.pre.releaseText), JSON.stringify(raidRes).slice(0, 300));
    for (const w of [1280, 390]) {
      await p.setViewportSize({ width: w, height: 1000 });
      await L.go(p, "ollie", "events"); await p.evaluate(() => { state.views.events = "all"; renderEvents(); }); await p.waitForTimeout(200);
      const ev = await p.evaluate(() => ({ sub: [...document.querySelectorAll(".h2sub")].map(x => x.textContent).find(t => /Upcoming game-wide events/.test(t)) || "", grid: T0(document.getElementById("eventsGrid") || document.body) }));
      ck(`[${w}] Events: subtitle names the 18 Nov read to 21 Mar 2027, W3, the TWs, the TB, Conquest Run 3 and Season 86 as an inference; the list shows W3, the TB, Conquest Run 3, Season 86 (INFERRED)`,
        /read 18 Nov, scrolled out to 21 Mar 2027/.test(ev.sub) && /Week 3/.test(ev.sub) && /Territory Battle \(24–30 Nov\)/.test(ev.sub) && /Conquest 25 Run 3/.test(ev.sub) && /inference/.test(ev.sub)
        && /GAC Season 85 — Week 3 \(3v3\)/.test(ev.grid) && /Territory Battle — Rise of the Empire/.test(ev.grid) && /Conquest Vol\. 25 — Run 3/.test(ev.grid) && /GAC Season 86 \(5v5, INFERRED\)/.test(ev.grid), ev.sub.slice(0, 200));
      let o = await L.overflow(p); ck(`[${w}] no horizontal overflow (Events, all)`, o.doc <= o.inner + 1, JSON.stringify(o));
      await p.screenshot({ path: L.path.join(SHOTS, `rv48-events-${w}.png`), fullPage: false });
      await L.go(p, "ollie", "modes"); await p.evaluate(() => { state.modesnav.category = "raid"; state.modesnav.raidView = "droid"; render(); }); await p.waitForTimeout(300);
      const md = await p.evaluate(() => ({ sub: [...document.querySelectorAll(".h2sub")].map(x => x.textContent).find(t => /Current state of the game/.test(t)) || "", body: T0(document.getElementById("pane-modes")) }));
      ck(`[${w}] Game modes: strapline 'Droid Destruction raid live' + 'Era of Rogue One to 9 Feb 2027' (no Era 10 / Mini-Era as current); the raid planner card says live, not unreleased`,
        /Droid Destruction raid live/.test(md.sub) && /Era of Rogue One to 9 Feb 2027/.test(md.sub) && !/Mini-Era to 17 Nov/.test(md.sub) && /raid planner · live/.test(md.body) && !/raid planner · unreleased/.test(md.body), md.sub.slice(0, 200));
      o = await L.overflow(p); ck(`[${w}] no horizontal overflow (Game modes › Droid Destruction)`, o.doc <= o.inner + 1, JSON.stringify(o));
      await L.go(p, "ollie", "overview"); await p.waitForTimeout(250);
      const dh = await p.evaluate(() => T0(document.querySelector('[data-card="datahealth"]')));
      ck(`[${w}] Overview: Data health card '3 of 24 … 1 overdue' (cap-journeys)`, /3 of 24 built-in references want a re-pull, 1 overdue/.test(dh) && /Capital ship journeys/.test(dh), dh.slice(0, 160));
      o = await L.overflow(p); ck(`[${w}] no horizontal overflow (Overview)`, o.doc <= o.inner + 1, JSON.stringify(o));
      await L.go(p, "ollie", "conquest"); await p.waitForTimeout(200);
      const cq = await p.evaluate(() => T0(document.getElementById("pane-conquest")));
      ck(`[${w}] Conquest (19 Nov): no stale banner; status names Run 3 from Tue 24 Nov 06:00 AEDT; the plan is labelled 'captured 27 Sep 2026'`, !/This reference is Conquest 25/.test(cq) && /Run 3, starts Tue 24 Nov 06:00 AEDT/.test(cq) && /captured 27 Sep 2026/.test(cq), cq.slice(0, 200));
      o = await L.overflow(p); ck(`[${w}] no horizontal overflow (Conquest)`, o.doc <= o.inner + 1, JSON.stringify(o));
    }
    const keys = await p.evaluate(async () => { for (const t of SUBTABS.map(x => x.key)) { switchTab(t); await new Promise(r => setTimeout(r, 40)); } return Object.keys(localStorage).sort(); });
    ck("no new localStorage keys (the same 4 as before rv48)", JSON.stringify(keys) === JSON.stringify(["swgoh-holotable-active-account-v1", "swgoh-holotable-device-v1", "swgoh-holotable-pulls-v1", "swgoh-tracker"]), JSON.stringify(keys));
    const r = await p.evaluate(() => {
      window.__x = 0; const h = '<img src=x onerror="window.__x=1"><b id="rvx">x</b>';
      const keep = [ERA_ARCHIVE.era10.note, ERA_ARCHIVE.era10.name, ERA_NOW.facts[0], CQ_RUN_NEXT.startLabel, CQ_RUN_NEXT.label, TERRITORY.laterNote, GCF_S85_NOTE, DROID_RAID.WINDOW.text];
      ERA_ARCHIVE.era10.note = h; ERA_ARCHIVE.era10.name = h; ERA_NOW.facts[0] = h; CQ_RUN_NEXT.startLabel = h; CQ_RUN_NEXT.label = h; TERRITORY.laterNote = h; DROID_RAID.WINDOW.text = h;
      const box = document.createElement("div");
      box.innerHTML = eraWindowHtml(Date.UTC(2026, 10, 17, 1)) + eraNowHtml() + cqRunStatusHtml(cqRunStatus(new Date())) + (todayConquestLine() || "") + territoryNoteHtml("tw") + territoryNoteHtml("tb", Date.UTC(2026, 11, 2)) + drrStatusCardHtml("ollie");
      const res = { img: box.querySelectorAll("img").length, b: !!box.querySelector("#rvx"), shown: (box.textContent.match(/<img src=x/g) || []).length };
      [ERA_ARCHIVE.era10.note, ERA_ARCHIVE.era10.name, ERA_NOW.facts[0], CQ_RUN_NEXT.startLabel, CQ_RUN_NEXT.label, TERRITORY.laterNote] = keep; DROID_RAID.WINDOW.text = keep[7]; render();
      return res;
    });
    await p.waitForTimeout(200);
    const fired = await p.evaluate(() => window.__x);
    ck("escaping: hostile text in ERA_ARCHIVE.era10, an Era fact, CQ_RUN_NEXT labels, TERRITORY.laterNote and the raid WINDOW renders as text — nothing injected or executed", r.img === 0 && !r.b && r.shown >= 7 && !fired, JSON.stringify(r));
    allErrs.push(...errs); await ctx.close();
  }

  ck("zero page errors across the suite", allErrs.length === 0, JSON.stringify(allErrs.slice(0, 5)));
  await L.finish(b, srv);
})();
