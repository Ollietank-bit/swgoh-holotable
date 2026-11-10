/* rv34-check — the 4 Nov 2026 refresh (ref34/refresh.json: one-click swgoh.gg capture 4 Nov 14:38 AEDT; ref34/rost.json; ref34/defence-analysis.txt) and the
   3v3 Season 85 defence evidence in the GAC planner. Clock pinned to Wed 4 Nov 2026 15:00 AEDT (04:00Z); rosters = both 4 Nov compact pulls (rv34-rosters-4nov.json)
   laid over the 7 Oct fixture pulls (names, zetas, ships kept). New behaviour only:
     1. Registry: exactly 24 unique entries; bumped to 2026-11-04 = events (EVENTS_SEED_CAPTURED), coach-tips, datacrons, gac-schedule (GAC_SCHEDULE.asOf);
        NOT bumped (not re-derived on 4 Nov): tierlist 1 Nov, meta-fleets 1 Nov, gac-counters / meta-squads / conquest 27 Sep, droid-raid 1 Nov (DROID_RAID asOf +
        recheck), era 1 Nov, nxt-queue / gl-queue / ship-guide 1 Nov; TERRITORY asOf 4 Nov with the TB part kept at 1 Nov.
     2. Events seed v13 (CAPTURED 4 Nov, 39 rows, date order, saved state reseeded): the Season 85 rows (season 4 → 26 Nov, Week 1 5 → 11 Nov), the rows added from the
        4 Nov read, the ended rows gone, the B1 marquee-issue note, the next Territory War in TERRITORY (note before / after the current war ends), Set 36 = 10 focused variants.
     3. Coach's Corner on the 4 Nov rosters: same ids, index 1 = Set 33, chx / drr last; Leia R7 flag done (and not in Action flags), JML step 1 1/2, step 3 1/4,
        Tiny's Jabba 11 of 14 / 12 tiers; the source line says "re-checked against the 4 Nov pulls" and "as of 4 Nov 2026".
     4. GAC planner, both accounts: the Bo-Katan (Mand'alor) + IG-12 & Grogu + Paz Vizsla trio (GCO_DEF_BOARD, not a META_SQUADS entry) is a DEFENCE candidate in 3v3
        only (excluded in 5v5), tier A from the 3v3 defence board, MODERATE, hold line shown; the offence entry keeps "do not use on defense" and The Mandalorian
        (Beskar Armor); no unit is ever on both the defence plan and the offence bench (also with Bo-Katan kept for offence); SLKR's 3v3 trio is flagged assumed in
        the UI, Jabba's is not; hold lines for Leia / SLKR / Jabba; optimiser notes stay "pristine"; escaping of the new strings.
     5. Overflow at 390 / 1280 on GAC (3v3 planner, both accounts) and Coach; screenshots in ../shots/rv34/; no new localStorage keys; zero page errors.
     6. P2 acceptance: the unmodified 4 Nov capture (RV34_CAPTURE, default /home/claude/work/ref34/holotable-capture-2026-11-04-1438.json.gz) goes through the real
        "Import pull file…" input (#pbmPullFile → pbmPullFile → pbmReceive → confirm card → pbmImport) on top of the 7 Oct fixture pulls: both accounts import, Leia R7
        (Ollie) / R10 (Tiny), label "Live pull · 4 Nov 2026" dated at the capture, the extra capture keys cause no errors, and the Carbonite 3v3 plan on the imported rosters.
        A missing capture file is a FAILED check, not a skip.
   rv40 10 Nov 2026 — DELIBERATE (21 assertions + the capture path; the clock stays 4 Nov 15:00 and the rosters stay the 4 Nov pulls): every value the 10 Nov refresh moved —
   registry events / coach-tips / datacrons / gac-schedule 4 Nov -> 10 Nov, droid-raid 1 Nov/recheck 8 Nov -> 10 Nov/17 Nov, nxt-queue / gl-queue / ship-guide 1 Nov -> 10 Nov; s85e2 est -> sourced;
   seed v13/39/'4 Nov' -> v14/43/'10 Nov'; the 4 Nov read's added rows present -> ABSENT (ended before 10 Nov; the only Contraband Cargo is the 10 Nov run); 'only the Set 33 record row ends
   before 4 Nov' -> 'no row ends before 10 Nov' (TB / Credit Heist allowed only as the new runs); 'no Forest Moon / Fanatical Devotion row' -> both present as SCHEDULED rows, no predicted
   assault rows; Set 36 source 'read 1 Nov and 4 Nov' -> 'read 1 Nov, 4 Nov and 10 Nov'; TERRITORY asOf/tbAsOf 4 Nov/1 Nov -> 10 Nov/10 Nov; TW note 'read 4 Nov … read to 8 Nov' ->
   'read 10 Nov … read to 28 Nov' and the TB note 'read 1 Nov' -> 'read 10 Nov'; Events subtitle 'read 4 Nov' -> 'read 10 Nov'; Leia flag note 'Week 1 opens (Thu 5 Nov' -> 'Week 2 opens (Thu 12 Nov';
   JML step 3 'G8 → G12' + 'Wedge and Biggs G12 → G13' -> 'Biggs is G12' + 'Biggs G12 → G13 (Princess Leia and Wedge done)'; Tiny's Jabba flag 4 Nov numbers -> 10 Nov (11/14, 6 tiers) with
   4 Nov / 31 Oct kept (x3: data + 2 widths); B1 / Bane / S85 board / Leia / GP claims re-checked on 10 Nov (8.49M -> 8.50M); NXT JML cost 17/7 -> 14/6 with 17/7 kept; Coach source line
   'as of 4 Nov … 4 Nov pulls' -> 'as of 10 Nov … 4 Nov and 10 Nov pulls' (x2). P2: the capture path falls back to ref40/ (the same unmodified 4 Nov file); a missing file still FAILS.
   Run: NODE_PATH=... FILE=DIR/index.html PORT=9xxx node tests/rv34-check.js */
const L = require("./lib.js");
const { ck } = L;
const AEDT = (mo, d, h, m) => Date.UTC(2026, mo - 1, d, h - 11, m || 0);
const NOW = AEDT(11, 4, 15);   // Wed 4 Nov 2026 15:00 AEDT = 04:00Z
const SHOTS = L.path.join(L.ROOT, "shots", "rv34");
try { L.fs.mkdirSync(SHOTS, { recursive: true }); } catch (e) {}
const ROS = JSON.parse(L.fs.readFileSync(L.path.join(__dirname, "rv34-rosters-4nov.json"), "utf8"));

function pulls4() {
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
  }, [L.REAL, o.pulls || JSON.stringify(pulls4()), "seeded-" + (o.tag || "x")]);
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

(async () => {
  const srv = await L.serve(); const b = await L.chromium.launch();
  const allErrs = [];

  /* ---------- 1/2. registry, events seed, territory, datacrons, GAC schedule ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "pure" });
    const c = await p.evaluate(() => {
      const reg = Object.fromEntries(SNAPSHOTS.map(s => [s.key, [s.asOf, s.expires || "", s.hint]]));
      const by = n => EVENTS_SEED.find(e => e.name === n) || null;
      return { n: SNAPSHOTS.length, keys: new Set(SNAPSHOTS.map(s => s.key)).size, reg, tlUpd: TIER_LIST.updated, dr: [DROID_RAID.asOf, DROID_RAID.recheck], gacAs: GAC_SCHEDULE.asOf,
        s85: GAC_SCHEDULE.events.filter(e => e.season === 85).map(e => [e.id, e.start, !!e.est]),
        terr: [TERRITORY.asOf, TERRITORY.tbAsOf, new Date(TERRITORY.twNext.signupMs).toISOString(), new Date(TERRITORY.twNext.startMs).toISOString(), new Date(TERRITORY.twNext.endMs).toISOString(), new Date(TERRITORY.tw.endMs).toISOString()],
        ver: EVENTS_SEED_VERSION, cap: EVENTS_SEED_CAPTURED, stateVer: state.eventsSeedVersion, len: EVENTS_SEED.length, sorted: EVENTS_SEED.every((e, i) => !i || e.date >= EVENTS_SEED[i - 1].date),
        seed: EVENTS_SEED.map(e => [e.name, e.date, e.ends || ""]), stateSeed: state.events.items.filter(e => /^seed\d+$/.test(e.id)).length,
        season: by("GAC Season 85 (3v3)"), wk1: by("GAC Season 85 — Week 1 (3v3)"), b1: by("Mercenary Guard Droid (B1)"), twNextS: by("Territory War — sign-up (next war)"), twNextA: by("Territory War — attack phase (next war)"),
        w7: by("Bonus drops (additive drops, wave 7)"), sr2: by("Smuggler's Run II"), cc: by("Contraband Cargo"), sr3: by("Smuggler's Run III"), set33: by("Datacron Set 33 expired"), mini: by("Era 10 — The Mandalorian and Grogu (Mini-Era)"),
        dc36: DATACRON_SETS.find(d => d.n === 36).focused, dcRow36: by("Datacron Set 36 expires").note,
        twNow: territoryNoteHtml("tw").replace(/<[^>]+>/g, ""), twLater: territoryNoteHtml("tw", Date.UTC(2026, 10, 6, 1)).replace(/<[^>]+>/g, ""), twGone: territoryNoteHtml("tw", Date.UTC(2026, 10, 9, 0)).replace(/<[^>]+>/g, ""),
        tb: territoryNoteHtml("tb").replace(/<[^>]+>/g, ""), sub: document.querySelector('[data-pane="events"] .h2sub, #events .h2sub') ? document.querySelector('[data-pane="events"] .h2sub, #events .h2sub').textContent : [...document.querySelectorAll(".h2sub")].map(x => x.textContent).find(t => /Upcoming game-wide events/.test(t)) || "" };
    });
    ck("registry: exactly 24 unique entries", c.n === 24 && c.keys === 24, `${c.n}/${c.keys}`);
    ck("bumped to 2026-11-10 by rv40 (re-derived from the 10 Nov capture; were 4 Nov): events, coach-tips, datacrons, gac-schedule (= GAC_SCHEDULE.asOf)",
      c.reg.events[0] === "2026-11-10" && c.reg["coach-tips"][0] === "2026-11-10" && c.reg.datacrons[0] === "2026-11-10" && c.reg["gac-schedule"][0] === "2026-11-10" && c.gacAs === "2026-11-10",
      JSON.stringify([c.reg.events[0], c.reg["coach-tips"][0], c.reg.datacrons[0], c.reg["gac-schedule"][0]]));
    ck("NOT bumped (the capture's boards were identical to 1 Nov, or the source was not re-read): tierlist 1 Nov (TIER_LIST.updated), meta-fleets 1 Nov, gac-counters / meta-squads / conquest 27 Sep, era 1 Nov; rv40 re-read / re-derived on 10 Nov: droid-raid 10 Nov (recheck 17 Nov), nxt-queue, gl-queue, ship-guide 10 Nov",
      c.reg.tierlist[0] === "2026-11-01" && c.tlUpd === "1 Nov 2026" && c.reg["meta-fleets"][0] === "2026-11-01" && c.reg["gac-counters"][0] === "2026-09-27" && c.reg["meta-squads"][0] === "2026-09-27" && c.reg.conquest[0] === "2026-09-27"
      && c.reg["droid-raid"][0] === "2026-11-10" && c.dr.join() === "2026-11-10,2026-11-17" && c.reg.era[0] === "2026-11-01" && c.reg["nxt-queue"][0] === "2026-11-10" && c.reg["gl-queue"][0] === "2026-11-10" && c.reg["ship-guide"][0] === "2026-11-10",
      JSON.stringify(Object.fromEntries(Object.entries(c.reg).map(([k, v]) => [k, v[0]]))));
    ck("GAC_SCHEDULE: s85e1 2026-11-04 sourced (no est), s85e2 11 Nov sourced by rv40 (Week 2 read 10 Nov), s85e3 18 Nov still est", JSON.stringify(c.s85) === JSON.stringify([["s85e1", "2026-11-04", false], ["s85e2", "2026-11-11", false], ["s85e3", "2026-11-18", true]]), JSON.stringify(c.s85));
    ck("EVENTS_SEED v14 (rv40), CAPTURED '10 Nov 2026', 43 rows in date order; saved state reseeded to 14 with exactly the seed rows", c.ver === 14 && c.cap === "10 Nov 2026" && c.len === 43 && c.sorted && c.stateVer === 14 && c.stateSeed === 43, JSON.stringify([c.ver, c.cap, c.len, c.sorted, c.stateVer, c.stateSeed]));
    ck("Season 85 rows: the season 4 Nov → 26 Nov (09:00 close = same day, re-confirmed 4 Nov) and Week 1 5 Nov → 11 Nov ('Thu 5 Nov 09:00 → ENDS Wed 11 Nov 09:00'), both Grand Arena",
      c.season && c.season.date === "2026-11-04" && c.season.ends === "2026-11-26" && /re-confirmed 4 Nov/.test(c.season.note) && /Week 1/.test(c.season.note)
      && c.wk1 && c.wk1.cat === "Grand Arena" && c.wk1.date === "2026-11-05" && c.wk1.ends === "2026-11-11" && /Thu 5 Nov 09:00 → ENDS Wed 11 Nov 09:00/.test(c.wk1.note) && /read 4 Nov/.test(c.wk1.note), JSON.stringify([c.season && c.season.ends, c.wk1]));
    ck("rows added from the 4 Nov read are gone again in v14 (rv40: all ended before the 10 Nov read): Smuggler's Run II / III, the 5 Nov Contraband Cargo, the next war's TW sign-up and attack phase, bonus drops wave 7; the only Contraband Cargo row is the 10 Nov one",
      !c.sr2 && !c.sr3 && !c.twNextS && !c.twNextA && !c.w7 && c.cc && c.cc.date === "2026-11-10" && c.cc.ends === "2026-11-11", JSON.stringify([c.sr2, c.cc && c.cc.date, c.sr3, c.twNextS, c.twNextA, c.w7]).slice(0, 200));
    const gone = ["Territory Battle — Rise of the Empire", "Adelphi Ranger Era Challenge", "Places of Power", "Stardust Transmission", "Credit Heist", "Territory War — sign-up", "Bespin", "Echoes of Legend"];
    ck("ended rows stay dropped (Adelphi Era Challenge, first Places of Power, Stardust, 2 Nov TW sign-up, Bespin, Echoes of Legend); rv40: the Territory Battle and Credit Heist names are back only as the NEW 10 Nov / 12 Nov runs, and no row (not even the Set 33 record row, now dropped) ends before 10 Nov",
      gone.filter(n => n !== "Territory Battle — Rise of the Empire" && n !== "Credit Heist").every(n => !c.seed.some(r => r[0] === n)) && c.seed.filter(r => /^(Territory Battle — Rise of the Empire|Credit Heist)$/.test(r[0])).every(r => r[1] >= "2026-11-10") && c.seed.filter(r => (r[2] || r[1]) < "2026-11-10").length === 0 && !c.set33, JSON.stringify(c.seed.filter(r => (r[2] || r[1]) < "2026-11-10")));
    ck("B1 row: released 4 Nov 05:00, marquee 06:00 → 11 Nov 06:00 (last live day 10 Nov), CG's 4 Nov data-error post (R5-D4 progress, fixed, rewards not reverted)",
      c.b1 && c.b1.date === "2026-11-04" && c.b1.ends === "2026-11-10" && /RELEASED Wed 4 Nov 05:00 AEDT/.test(c.b1.note) && /R5-D4 progress/.test(c.b1.note) && /will not be reverted/.test(c.b1.note), c.b1 && c.b1.note.slice(0, 160));
    ck("no recurring PREDICTED assault row was added (rv40: Forest Moon and Fanatical Devotion are now SCHEDULED rows from the 10 Nov read, named without '(predicted)'; the predicted Military Might / Rebel Roundup / Ground War / Places of Power / Duel of the Fates rows stay off); the Mini-Era row is unchanged at 20 Oct → 17 Nov", c.seed.filter(r => /Forest Moon|Fanatical Devotion/.test(r[0])).length === 2 && c.seed.filter(r => /Forest Moon|Fanatical Devotion/.test(r[0])).every(r => !/predicted/i.test(r[0]) && r[1] >= "2026-11-11") && !c.seed.some(r => /Military Might|Rebel Roundup|Ground War|Places of Power|Duel of the Fates|Defense of Dathomir|Coven of Shadows/.test(r[0])) && c.mini && c.mini.date === "2026-10-20" && c.mini.ends === "2026-11-17", "");
    ck("Set 36: '10 focused variants' in DATACRON_SETS and its seed row (the 25 Oct read's 9 is corrected; source dated)", /10 character datacrons, 10 focused variants/.test(c.dc36) && /10 focused variants — swgoh\.gg\/datacrons\/ read 1 Nov, 4 Nov and 10 Nov/.test(c.dcRow36), c.dc36);   // rv40: "read 1 Nov and 4 Nov" -> "read 1 Nov, 4 Nov and 10 Nov"
    ck("TERRITORY (rv34; rv40: asOf and the TB part both 10 Nov — the new TB was read then): next war sign-up 2026-11-05T19:00Z (6 Nov 06:00 AEDT), attack 2026-11-07T18:00Z → 2026-11-08T18:00Z; current war still ends 2026-11-04T19:00Z",
      JSON.stringify(c.terr) === JSON.stringify(["2026-11-10", "2026-11-10", "2026-11-05T19:00:00.000Z", "2026-11-07T18:00:00.000Z", "2026-11-08T18:00:00.000Z", "2026-11-04T19:00:00.000Z"]), JSON.stringify(c.terr));
    ck("TW note at 4 Nov 15:00: attack phase live, ends in 15h 0m; 'Next: sign-up opens Fri 6 Nov 06:00 AEDT; attack phase opens Sun 8 Nov 05:00 AEDT, ends Mon 9 Nov 05:00 AEDT'; rv40: read 10 Nov, read to 28 Nov",
      /attack phase live, ends in 15h 0m/.test(c.twNow) && /Next: sign-up opens Fri 6 Nov 06:00 AEDT; attack phase opens Sun 8 Nov 05:00 AEDT, ends Mon 9 Nov 05:00 AEDT/.test(c.twNow) && /read 10 Nov 2026/.test(c.twNow) && /read to 28 Nov/.test(c.twNow), c.twNow);
    ck("TW note on 6 Nov 12:00 AEDT shows the next war (sign-up open), and after 9 Nov 05:00 says over with no later war listed; rv40: the TB note reads 10 Nov",
      /Territory War \(next war\)/.test(c.twLater) && /sign-up is open; the attack phase opens in 1d 17h/.test(c.twLater) && /over/.test(c.twGone) && /lists no later Territory War/.test(c.twGone) && /read 10 Nov 2026/.test(c.tb), c.twLater + " || " + c.twGone);
    ck("Events tab subtitle no longer claims a live Territory Battle and names the schedule read (rv40: 10 Nov)", /read 10 Nov/.test(c.sub) && !/live Territory Battle/.test(c.sub) && /Week 1/.test(c.sub), c.sub.slice(0, 200));
    allErrs.push(...errs); await ctx.close();
  }

  /* ---------- 3. Coach's Corner on the 4 Nov rosters ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "coach" });
    const c = await p.evaluate(() => {
      const ids = a => TIPS[a].map(t => t.id);
      const tip = (a, id) => { const t = TIPS[a].find(x => x.id === id); const reqs = state.pulls[a].reqs; return t ? { sev: t.sev, t: t.t, done: tipIsDone(a, reqs, t, 0), prog: t.check ? tipProgress(reqs, t.check) : null, key: hardTipKey(a, t), note: t.note } : null; };
      return { oIds: ids("ollie"), tIds: ids("tiny"), leia: tip("ollie", "leia-r7-then-freeze"), jml1: tip("ollie", "jml-step1-chewie-hermit"), jml3: tip("ollie", "jml-step3-four-g13s"), jabba: tip("tiny", "jabba-now-closer-than-jml"),
        b1: tip("ollie", "b1-marquee-proving-grounds"), s85: tip("ollie", "s85-3v3-defence"), gs: tip("ollie", "no-general-skywalker-despite-8"), t33: tip("tiny", "2-set-33-datacrons-built"),
        leiaR: state.pulls.ollie.reqs.GLLEIA.r, nxtDo: NXT_QUEUE.ollie.doThisWeek, nxtJml: NXT_QUEUE.ollie.queue[0] };
    });
    ck("Coach ids unchanged in order: ollie GAC chx first, index 1 = Set 33, Leia flag at index 2, chx Executor then drr last; tiny Leia keep first, chx GAC 1, drr last",
      c.oIds[0] === "re-enter-gac-three-built" && c.oIds[1] === "2-set-33-datacrons-built" && c.oIds[2] === "leia-r7-then-freeze" && c.oIds[c.oIds.length - 2] === "chx-executor-plan" && c.oIds[c.oIds.length - 1] === "drr-four-star-floor"
      && c.tIds[0] === "gl-leia-organa-is-unlocked" && c.tIds[1] === "re-enter-gac-rey-r8" && c.tIds[c.tIds.length - 1] === "drr-four-star-floor" && c.oIds.length === 14 && c.tIds.length === 13, c.oIds.join() + " | " + c.tIds.join());
    ck("4 Nov rosters: Leia is R7, so the Leia R7 flag is DONE (auto check met, still fixnow, key format unchanged) and its note says so with the 4 Nov source (rv40: and names Week 2, Thu 12 Nov 09:00 AEDT, instead of Week 1)",
      c.leiaR === 7 && c.leia.done && c.leia.sev === "fixnow" && c.leia.key === "ollie-t:leia-r7-then-freeze" && /DONE on the 4 Nov pull/.test(c.leia.note) && /Week 2 opens \(Thu 12 Nov 09:00 AEDT/.test(c.leia.note), JSON.stringify([c.leiaR, c.leia.done]));
    ck("JML step 1: 1/2 done on 4 Nov (Hermit Yoda R5), note '17 relic tiers with 9 of 14 … (31 Oct: 22 relic tiers with 7 of 14)' and the freeze rule; step 3: 1/4 done (Princess Leia G13); rv40 title: Old Ben + Biggs left (Princess Leia and Wedge done on 10 Nov)",
      c.jml1.prog.doneCount === 1 && c.jml1.prog.total === 2 && /17 relic tiers with 9 of 14/.test(c.jml1.note) && /22 relic tiers with 7 of 14/.test(c.jml1.note) && /keep Leia's relics frozen at R7/.test(c.jml1.note)
      && c.jml3.prog.doneCount === 1 && c.jml3.prog.total === 4 && /Princess Leia is G13 R3/.test(c.jml3.note) && /Biggs is G12/.test(c.jml3.note) && /Biggs G12 → G13 \(Princess Leia and Wedge done\)/.test(c.jml3.t), JSON.stringify([c.jml1.prog, c.jml3.prog]));
    ck("Tiny's Jabba flag (rv40: now the Jabba build flag, tools/gl-readiness.js on the 10 Nov pull): 11 of 14 with 6 relic tiers, no G13s, Han Solo R7 → R8; the 4 Nov (12 tiers, Fennec at G12) and 31 Oct (19 tiers) readings kept, dated",
      /11 of 14 met with 6 relic tiers left and no unit to take to G13/.test(c.jabba.note) && /4 Nov: 12 tiers, Fennec at G12/.test(c.jabba.note) && /31 Oct: 19 tiers/.test(c.jabba.note), c.jabba.note.slice(0, 200));
    ck("other re-checked claims (rv40: re-checked again on the 10 Nov pulls): B1 3★ G1 on 4 Nov / 4★ G5 on 10 Nov + the marquee data-error post; Bane / Rey (DSV) still unowned 10 Nov; S85 board still Season 83 (re-read 1, 4 and 10 Nov); GP 8.50M; Tiny's 4 Nov datacron read = one Set 36 at tier 0",
      /3★ G1 on 4 Nov/.test(c.b1.note) && /4★ G5 on your 10 Nov pull/.test(c.b1.note) && /R5-D4 progress/.test(c.b1.note) && /still unowned on the 10 Nov pull/.test(c.b1.note) && /Season 83 3v3 DEFENCE board \(still the latest — read 1 Nov, 4 Nov and again 10 Nov/.test(c.s85.note) && /Leia is R7 on the 10 Nov pull/.test(c.s85.note)
      && /8\.50M GP/.test(c.gs.t) && /Set 36 datacron at tier 0/.test(c.t33.note), "");
    ck("NXT (ollie): 'do this week' says Leia is held at R7 (rv40: still R7 on the 10 Nov pull); the JML row is re-costed (rv40: 14 tiers / 6 gear levels; the 4 Nov 17 / 7 and 31 Oct figures kept, dated)", /still R7 on the 10 Nov pull/.test(c.nxtDo) && /14 tiers/.test(c.nxtJml.cost) && /17 on 4 Nov/.test(c.nxtJml.cost) && /6 levels/.test(c.nxtJml.cost) && /7 levels on 4 Nov/.test(c.nxtJml.cost) && /22 on 31 Oct/.test(c.nxtJml.cost), c.nxtDo);
    for (const w of [1280, 390]) {
      await p.setViewportSize({ width: w, height: 1000 });
      await L.go(p, "ollie", "coach"); await p.evaluate(() => { state.views.coach = "priorities"; render(); }); await p.waitForTimeout(250);
      const co = await p.evaluate(() => ({ act: T0(document.querySelector('[data-card="action-flags"]')), all: T0(document.getElementById("tips")) }));
      ck(`[${w}] Coach (ollie): the Leia R7 flag is not in Action flags (done); JML step 1 is, with '1/2 done'; source line 'as of 10 Nov 2026 … re-checked against the 4 Nov and 10 Nov pulls' (rv40)`,
        !/Leia R6 → R7 by ~5 Nov/.test(co.act) && /Jedi Master Luke, step 1: Chewbacca R5 → R6/.test(co.act) && /1\/2 done/.test(co.act) && /Flags as of 10 Nov 2026/.test(co.all) && /re-checked against the 4 Nov and 10 Nov pulls/.test(co.all), co.act.slice(0, 300));
      await p.screenshot({ path: L.path.join(SHOTS, `rv34-coach-ollie-${w}.png`), fullPage: false });
      const o1 = await L.overflow(p);
      ck(`[${w}] no horizontal overflow (Coach, ollie)`, o1.doc <= o1.inner + 1, JSON.stringify(o1));
      await L.go(p, "tiny", "coach"); await p.evaluate(() => { state.views.coach = "priorities"; render(); }); await p.waitForTimeout(250);
      const ct = await p.evaluate(() => T0(document.getElementById("tips")));
      ck(`[${w}] Coach (tiny): the Jabba flag (rv40: was 'Jabba is now clearly closer') reads 'Jabba the Hutt next' with the 10 Nov numbers`, /Jabba the Hutt next: Han Solo R7 → R8, C-3PO R3 → R7, Fennec Shand R6 → R7/.test(ct) && /11 of 14 met with 6 relic tiers left/.test(ct), ct.slice(0, 200));
      await p.screenshot({ path: L.path.join(SHOTS, `rv34-coach-tiny-${w}.png`), fullPage: false });
    }
    allErrs.push(...errs); await ctx.close();
  }

  /* ---------- 4. GAC planner: Bo-Katan (Mand'alor) defence trio, 3v3 only ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "plan" });
    await L.go(p, "ollie", "gac");
    const PLAN = ([a, f, lg, keep]) => {
      switchAcct(a); state.views["gcolg-" + a] = lg; state.views["gco-" + a] = f + (keep ? "|keep=" + keep : "");
      const def = gcoPlanFor(a), off = gofPlanFor(a);
      const defKeys = def.squadSlots.filter(x => x.cand).flatMap(x => x.cand.keys), offKeys = off.picked.flatMap(c => c.keys);
      const bk = def.squadSlots.find(x => x.cand && x.cand.name === "Bo-Katan (Mand'alor) trio (defence, 3v3 only)");
      const all = def.squadSlots.map(x => x.cand ? x.cand.name : null);
      const offSkip = off.skipped.find(s => s.name === "Bo-Katan (Mand'alor) Mandalorians (offence)") || null;
      const rows = gcoPlannerRows(def);
      return { fmt: def.fmt, all, bk: bk ? { zone: bk.slot.zone.key, members: bk.cand.members.map(m => m[0]), tier: bk.cand.defTl && bk.cand.defTl.tier, tl: !!bk.cand.tl, conf: bk.cand.sq.confidence, why: bk.cand.why, hold: bk.cand.hold, assumed: bk.cand.trioAssumed, score: bk.cand.score } : null,
        excl: def.excluded.find(e => e.name === "Bo-Katan (Mand'alor) trio (defence, 3v3 only)") || null, kept: def.kept.map(k => k.name),
        overlap: defKeys.filter(k => offKeys.includes(k)), offNames: off.picked.map(c => c.name), offSkip,
        slkr: (def.squadSlots.find(x => x.cand && x.cand.name === "Supreme Leader Kylo Ren (GL)") || {}).cand, jabba: (def.squadSlots.find(x => x.cand && x.cand.name === "Jabba the Hutt (GL) Bounty Hunters") || {}).cand,
        leia: (def.squadSlots.find(x => x.cand && x.cand.name === "Leia Organa (GL) Rebels") || {}).cand, pristine: rows.every(r => gcfNoteIsOurs(r.note)) };
    };
    const strip = x => x ? { assumed: x.trioAssumed, hold: x.hold, members: x.members.map(m => m[0]) } : null;
    const res = {};
    for (const a of ["ollie", "tiny"]) for (const lg of ["carbonite", "bronzium"]) for (const f of ["3v3", "5v5"]) {
      const r = await p.evaluate(PLAN, [a, f, lg, ""]); r.slkr = strip(r.slkr); r.jabba = strip(r.jabba); r.leia = strip(r.leia); res[`${a}/${lg}/${f}`] = r;
      const tag = `${a}/${lg}/${f}`;
      if (f === "3v3") {
        ck(`[${tag}] the Bo-Katan (Mand'alor) + IG-12 & Grogu + Paz Vizsla trio is placed on defence: tier A from the 3v3 DEFENCE board (no offence TIER_LIST row), MODERATE, named trio, hold line`,
          r.bk && JSON.stringify(r.bk.members) === '["MANDALORBOKATAN","IG12","PAZVIZSLA"]' && r.bk.tier === "A" && !r.bk.tl && r.bk.conf === "MODERATE" && !r.bk.assumed
          && /DEFENCE board \(#10, 30\.4% hold over 5,365 battles, Season 83, read 4 Nov 2026 — small sample\)/.test(r.bk.why) && r.bk.hold === "swgoh.gg 3v3 DEFENCE board (Season 83, read 4 Nov 2026): #10, A tier, 30.4% hold, 5,365 battles — small sample", JSON.stringify(r.all));
        ck(`[${tag}] no unit on both the defence plan and the offence bench; the Bo-Katan OFFENCE entry is skipped for sharing units with the defence plan`, r.overlap.length === 0 && !r.offNames.includes(BOK_DEF) && !r.offNames.includes(BOK_OFF) && r.offSkip && /defence plan/.test(r.offSkip.reason), JSON.stringify([r.overlap, r.offSkip]));
        ck(`[${tag}] SLKR's 3v3 trio is ASSUMED (SLKR + Kylo Ren (Unmasked) + General Hux) and its hold line opens 'assumed — no board data for this variant; the proven trio needs Rey (Dark Side Vision).'; Leia's hold line #6 24.5%`,
          r.slkr && r.slkr.assumed && JSON.stringify(r.slkr.members) === '["SUPREMELEADERKYLOREN","KYLORENUNMASKED","GENERALHUX"]' && /^assumed — no board data for this variant; the proven trio needs Rey \(Dark Side Vision\)\./.test(r.slkr.hold) && /#1, S tier, 37\.2% hold, 12\.4K battles/.test(r.slkr.hold) && /neither account owns Rey \(Dark Side Vision\) on the 4 Nov pulls/.test(r.slkr.hold)
          && r.leia && /#6, S tier, 24\.5% hold, 33K battles/.test(r.leia.hold), JSON.stringify(r.slkr));
        ck(`[${tag}] optimiser zone notes stay 'pristine' (the new candidate name is known to gcfNoteIsOurs)`, r.pristine, "");
      } else {
        ck(`[${tag}] 5v5: the defence-board trio is excluded ('3v3 only'), never placed, and the 5v5 plan has no hold lines`, !r.bk && r.excl && /3v3 only/.test(r.excl.reason) && !(r.slkr && r.slkr.hold) && !(r.leia && r.leia.hold) && r.overlap.length === 0, JSON.stringify([r.all, r.excl]));
      }
    }
    const oc = res["ollie/carbonite/3v3"], tc = res["tiny/carbonite/3v3"];
    ck("Carbonite 3v3 (3 squads), both accounts: SLKR (assumed) + Leia + the Bo-Katan defence trio; Ollie's Jabba is NOT on defence and his Jabba + Boushh + Krrsantan trio is on the offence bench",
      JSON.stringify(oc.all) === JSON.stringify(["Supreme Leader Kylo Ren (GL)", "Leia Organa (GL) Rebels", BOK_DEF]) && JSON.stringify(tc.all) === JSON.stringify(["Supreme Leader Kylo Ren (GL)", "Leia Organa (GL) Rebels", BOK_DEF])
      && !oc.jabba && oc.offNames.some(n => /^Jabba the Hutt/.test(n)), JSON.stringify([oc.all, tc.all, oc.offNames]));
    const ob = res["ollie/bronzium/3v3"];
    ck("ollie bronzium 3v3: Jabba is placed with his named trio (Jabba + Boushh + Krrsantan — not 'assumed') and the #17 A 18.4% / 174K hold line", ob.jabba && !ob.jabba.assumed && JSON.stringify(ob.jabba.members) === '["JABBATHEHUTT","BOUSHH","KRRSANTAN"]' && /#17, A tier, 18\.4% hold, 174K battles/.test(ob.jabba.hold), JSON.stringify(ob.jabba));
    const keep = await p.evaluate(PLAN, ["ollie", "3v3", "carbonite", "MANDALORBOKATAN"]);
    ck("Keep-for-offence Bo-Katan (ollie, 3v3): the defence trio is kept out, the Bo-Katan offence entry may attack, still no unit on both sides", !keep.bk && keep.kept.includes(BOK_DEF) && keep.offNames.includes(BOK_OFF) && keep.overlap.length === 0, JSON.stringify([keep.all, keep.offNames]));
    const data = await p.evaluate(() => ({ inMeta: META_SQUADS.some(s => /trio \(defence/.test(s.name)), off: META_SQUADS.find(s => s.name === "Bo-Katan (Mand'alor) Mandalorians (offence)"), n: META_SQUADS.length,
      gofSrc: META_SQUADS.filter(sq => !(sq.raidTier || /raid/i.test(sq.mode || ""))).map(s => s.name).includes("Bo-Katan (Mand'alor) trio (defence, 3v3 only)"), trios: [GCO_TRIOS["Jabba the Hutt (GL) Bounty Hunters"], GCO_TRIOS["Supreme Leader Kylo Ren (GL)"] || null] }));
    ck("the offence entry is untouched: still 'do not use on defense (offence-only entry — not assessed for defence)', 3v3 trio with The Mandalorian (Beskar Armor); the defence trio is NOT a META_SQUADS entry (Radar / Tier List / offence pool unchanged, still 49 entries)",
      /do not use on defense \(offence-only entry — not assessed for defence\)/.test(data.off.mode) && JSON.stringify(data.off.gosTrio) === '["MANDALORBOKATAN","IG12","THEMANDALORIANBESKARARMOR"]' && !data.inMeta && !data.gofSrc && data.n === 49, String(data.n));
    ck("GCO_TRIOS: Jabba's named trio registered; SLKR has none (its board trio needs Rey (Dark Side Vision)), so it stays the assumed fallback", JSON.stringify(data.trios[0]) === '["JABBATHEHUTT","BOUSHH","KRRSANTAN"]' && data.trios[1] === null, JSON.stringify(data.trios));

    /* UI: 3v3 planner (defence + offence) for each account at 1280 / 390 */
    for (const w of [1280, 390]) {
      await p.setViewportSize({ width: w, height: 1000 });
      for (const a of ["ollie", "tiny"]) {
        await p.evaluate(([acct]) => { switchAcct(acct); delete state.views["gcolg-" + acct]; delete state.views["gco-" + acct]; switchTab("gac"); sectionView("gac", "defense"); gofRun(acct); }, [a]);
        await p.waitForTimeout(350);
        const u = await p.evaluate(() => { const c = document.querySelector('[data-card="gco"]'); return { t: T0(c), raw: c.textContent.replace(/\s+/g, " "), title: T0(c.querySelector(".gco-plan-title")), assume: T0(c.querySelector(".gcf-assume")), holds: [...c.querySelectorAll(".gco-hold")].map(T0), chips: [...c.querySelectorAll(".gco-slot-head .chip")].map(T0) }; });
        ck(`[${w}] ${a}: GAC planner title 'Season 85 Event 1 · 3v3 defence plan', the Bo-Katan defence trio shows 'A-tier (defence board)' + its hold line; Leia and SLKR hold lines; one 'trio assumed' line naming SLKR`,
          /^Season 85 Event 1 · 3v3 defence plan/.test(u.title) && u.chips.includes("A-tier (defence board)") && u.holds.some(h => /#10, A tier, 30\.4% hold, 5,365 battles — small sample/.test(h)) && u.holds.some(h => /#6, S tier, 24\.5% hold/.test(h))
          && u.holds.some(h => /37\.2% hold/.test(h) && /^Hold evidence: assumed — no board data for this variant; the proven trio needs Rey \(Dark Side Vision\)\./.test(h)) && /3v3 trio assumed .* for Supreme Leader Kylo Ren \(GL\)/.test(u.assume) && !/Bo-Katan/.test(u.assume) && /Bo-Katan \(Mand'alor\) trio \(defence, 3v3 only\)/.test(u.t), JSON.stringify([u.title, u.assume, u.holds.length]));
        ck(`[${w}] ${a}: offence half shows the Bo-Katan offence entry under skipped (shares units with the defence plan), not on the bench`, /Bo-Katan \(Mand'alor\) Mandalorians \(offence\) — shares .* on your defence plan/.test(u.raw) && !/\d Bo-Katan \(Mand'alor\) Mandalorians \(offence\)/.test(u.t), "");
        const o = await L.overflow(p);
        ck(`[${w}] ${a}: no horizontal overflow (GAC planner, 3v3, defence + offence)`, o.doc <= o.inner + 1, JSON.stringify(o));
        const card = await p.$('[data-card="gco"]');
        if (card) await card.screenshot({ path: L.path.join(SHOTS, `rv34-gac-${a}-${w}.png`) });
      }
    }
    allErrs.push(...errs); await ctx.close();
  }

  /* ---------- 5. storage + escaping ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "esc" });
    const keys = await p.evaluate(async () => { for (const t of SUBTABS.map(x => x.key)) { switchTab(t); await new Promise(r => setTimeout(r, 40)); } return Object.keys(localStorage).sort(); });
    ck("no new localStorage keys (the same 4 as before rv34)", JSON.stringify(keys) === JSON.stringify(["swgoh-holotable-active-account-v1", "swgoh-holotable-device-v1", "swgoh-holotable-pulls-v1", "swgoh-tracker"]), JSON.stringify(keys));
    const r = await p.evaluate(() => {
      window.__x = 0; const h = '<img src=x onerror="window.__x=1"><b id="rvx">x</b>';
      const sq = GCO_DEF_BOARD[0], keep = [sq.hold["3v3"], sq.defTier.battles, TERRITORY.twNext.signupLabel, TERRITORY.twNext.label];
      sq.hold["3v3"] = h; sq.defTier.battles = h; TERRITORY.twNext.signupLabel = h; TERRITORY.twNext.label = h;
      gcfPlanMemo.clear(); switchAcct("ollie"); state.views["gco-ollie"] = "3v3"; delete state.views["gcolg-ollie"];
      const pl = gcoPlanFor("ollie"); const slot = pl.squadSlots.find(x => x.cand && x.cand.name === sq.name);
      const box = document.createElement("div"); box.innerHTML = (slot ? gcoSlotHtml(slot, "ollie") : "") + territoryNoteHtml("tw") + territoryNoteHtml("tw", Date.UTC(2026, 10, 6, 1));
      const res = { slot: !!slot, img: box.querySelectorAll("img").length, b: !!box.querySelector("#rvx"), shown: (box.textContent.match(/<img src=x/g) || []).length };
      sq.hold["3v3"] = keep[0]; sq.defTier.battles = keep[1]; TERRITORY.twNext.signupLabel = keep[2]; TERRITORY.twNext.label = keep[3]; gcfPlanMemo.clear(); delete state.views["gco-ollie"]; render();
      return res;
    });
    await p.waitForTimeout(200);
    const fired = await p.evaluate(() => window.__x);
    ck("escaping: hostile text in the defence trio's hold line / battles and the next-war labels renders as text — nothing injected or executed", r.slot && r.img === 0 && !r.b && r.shown >= 4 && !fired, JSON.stringify(r));
    allErrs.push(...errs); await ctx.close();
  }

  /* ---------- 6. P2 acceptance: the 4 Nov one-click capture (.json.gz, unmodified) through the real "Import pull file…" input ---------- */
  {
    const GZ = process.env.RV34_CAPTURE || ["/home/claude/work/ref34/holotable-capture-2026-11-04-1438.json.gz", "/home/claude/work/ref40/holotable-capture-2026-11-04-1438.json.gz"].find(f => L.fs.existsSync(f)) || "/home/claude/work/ref34/holotable-capture-2026-11-04-1438.json.gz";   // rv40: ref34/ is gone from this workspace; the same 4 Nov capture file sits in ref40/ — still a FAILED check if neither exists
    const have = L.fs.existsSync(GZ);
    ck("P2: the 4 Nov capture file is present (" + L.path.basename(GZ) + ")", have, GZ);
    if (have) {
      /* start from the 7 Oct fixture pulls (Ollie's Leia not yet R7) so the import has to be what moves her */
      const { ctx, p, errs } = await openAt(b, { tag: "imp", pulls: L.PULLS });
      const before = await p.evaluate(() => ({ o: ((state.pulls.ollie || {}).reqs || {}).GLLEIA || null, lbl: (state.pulls.ollie || {}).fetchedLabel || "" }));
      await p.evaluate(() => { switchAcct("ollie"); switchTab("overview"); });
      await p.setInputFiles("#pbmPullFile", GZ);
      await p.waitForSelector("#pbmConfirm:not([hidden]) #pbmImportBtn", { timeout: 30000 });
      const card = await p.evaluate(() => T0(document.getElementById("pbmConfirm")));
      ck("P2: the .gz is unpacked in the page and the confirm card offers both accounts with their 4 Nov GP (Ollietank 8.49M, Tiny 8.12M), 'From holotable-capture-2026-11-04-1438.json.gz', no ✗ line",
        /Import roster from swgoh\.gg: Ollietank 8\.49M GP · Tiny 8\.12M GP/.test(card) && /From holotable-capture-2026-11-04-1438\.json\.gz/.test(card) && !/✗/.test(card), card.slice(0, 300));
      await p.click("#pbmImportBtn"); await p.waitForTimeout(1500);
      const r = await p.evaluate(() => {
        const o = state.pulls.ollie || {}, t = state.pulls.tiny || {}, rq = (x, id) => (x.reqs || {})[id] || null;
        return { st: T0(document.getElementById("pullStatus")), oLeia: rq(o, "GLLEIA"), tLeia: rq(t, "GLLEIA"), oSlkr: rq(o, "SUPREMELEADERKYLOREN"), oJabba: rq(o, "JABBATHEHUTT"), dsv: [rq(o, "GLREY") && rq(o, "GLREY").name, !!Object.values(o.reqs || {}).find(u => u.name === "Rey (Dark Side Vision)"), !!Object.values(t.reqs || {}).find(u => u.name === "Rey (Dark Side Vision)")],
          bk: ["MANDALORBOKATAN", "IG12", "PAZVIZSLA"].map(id => [rq(o, id) && rq(o, id).r, rq(t, id) && rq(t, id).r]),
          lbl: [o.fetchedLabel, t.fetchedLabel], at: [o.fetchedAt, t.fetchedAt], gp: [o.gp, t.gp], hdr: (document.getElementById("datasrc") || {}).innerHTML || "", keys: Object.keys(localStorage).sort() };
      });
      ck("P2: both accounts imported ('✓ Imported swgoh.gg pull file … — Ollietank & Tiny', nothing 'not imported')", /✓ Imported swgoh\.gg pull file holotable-capture-2026-11-04-1438\.json\.gz/.test(r.st) && /Ollietank & Tiny/.test(r.st) && !/not imported/.test(r.st), r.st.slice(0, 260));
      ck("P2: Ollie's Leia is G13 R7 after the import (was " + JSON.stringify(before.o && [before.o.g, before.o.r]) + " on the fixture), Tiny's R10; SLKR R9, Jabba R9 (Ollie); Bo-Katan R8 / IG-12 R7 / Paz R7 on both",
        r.oLeia && r.oLeia.g === 13 && r.oLeia.r === 7 && !(before.o && before.o.r === 7) && r.tLeia && r.tLeia.r === 10 && r.oSlkr && r.oSlkr.r === 9 && r.oJabba && r.oJabba.r === 9 && JSON.stringify(r.bk) === "[[8,8],[7,7],[7,7]]", JSON.stringify([before.o, r.oLeia, r.tLeia, r.bk]));
      ck("P2: neither imported roster has Rey (Dark Side Vision) (the SLKR board trio's missing unit)", !r.dsv[1] && !r.dsv[2], JSON.stringify(r.dsv));
      ck("P2: label 'Live pull · 4 Nov 2026' on both, dated at the capture (2026-11-04T03:38:02.894Z), not the Import press; GP 8,486,481 / 8,115,256",
        r.lbl[0] === "Live pull · 4 Nov 2026" && r.lbl[1] === "Live pull · 4 Nov 2026" && r.at[0] === Date.parse("2026-11-04T03:38:02.894Z") && r.at[1] === r.at[0] && r.gp[0] === 8486481 && r.gp[1] === 8115256 && /Live pull · 4 Nov 2026/.test(r.hdr), JSON.stringify([r.lbl, r.at, r.gp]));
      ck("P2: the capture's extra keys (captureVersion, capturedAt, mode, tz, page, pages, manifest) cause no page error, and storage holds only the 4 pre-rv34 keys plus the existing GAC-bracket key (GOP_KEY, swgoh-holotable-opponents-v1 — the capture carries a bracket)", errs.length === 0 && JSON.stringify(r.keys) === JSON.stringify(["swgoh-holotable-active-account-v1", "swgoh-holotable-device-v1", "swgoh-holotable-opponents-v1", "swgoh-holotable-pulls-v1", "swgoh-tracker"]), JSON.stringify([errs.slice(0, 3), r.keys]));
      /* the imported roster drives the app: Coach shows the Leia flag done, the 3v3 planner places the Bo-Katan defence trio */
      const after = await p.evaluate(() => { gcfPlanMemo.clear(); state.views["gco-ollie"] = "3v3"; state.views["gcolg-ollie"] = "carbonite"; const pl = gcoPlanFor("ollie"); const out = pl.squadSlots.map(x => x.cand && x.cand.name); delete state.views["gco-ollie"]; delete state.views["gcolg-ollie"]; gcfPlanMemo.clear(); return out; });
      ck("P2: on the imported rosters, Ollie's Carbonite 3v3 plan is SLKR + Leia + the Bo-Katan defence trio", JSON.stringify(after) === JSON.stringify(["Supreme Leader Kylo Ren (GL)", "Leia Organa (GL) Rebels", BOK_DEF]), JSON.stringify(after));
      allErrs.push(...errs); await ctx.close();
    }
  }

  ck("zero page errors across the suite", allErrs.length === 0, JSON.stringify(allErrs.slice(0, 5)));
  await L.finish(b, srv);
})();
