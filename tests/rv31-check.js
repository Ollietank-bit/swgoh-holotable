/* rv31-check — the 1 Nov 2026 "Data health" refresh of the 7 references that wanted a re-pull (ref31/data-health-inputs.md, ref31/cap/refresh.json,
   ref31/team/final-review.md). New behaviour only:
     1. Registry: exactly 24 unique entries; "era" re-pointed to Era 10 (asOf 2026-11-01 = ERA_NOW.asOf, expires 2026-11-17 = ERA_NOW.end), no Era 09 entry;
        coach-tips / nxt-queue / ship-guide = 2026-11-01 (re-derived); conquest / gac-counters / meta-squads KEEP 2026-09-27 and their hints say what was
        and was not re-read; ship-guide label + SHIP_DATA.storesAsOf keep the 3 Oct store read.
     2. Data health: 3 of 24 on 1 Nov (conquest, gac-counters, meta-squads — all aging, 0 overdue); 0 stale on 30 Oct; on 18 Nov the Era 10 entry is
        stale with "window ended"; the Modes tab shows no stale chrome banner on 1 Nov.
     3. Era: the archived Era 09 banner on all 6 Era sections; the Era 10 box (chip fresh, 10 loaned units, EL 0 → 75, 4 bosses, Journey Guide /
        Coliseum rewards NOT read); strapline on 1 Nov / 18 Nov / 15 Oct; eraCurrentPhrase before and after 20 Oct.
     4. GAC_COUNTERS: all 15 rows carry the 1 Nov defence-board numbers (5v5 S84 + 3v3 S83) and the "pairings: 27 Sep" label, no "Update 22 Oct";
        spot values; the counters card dates line.
     5. Conquest: CQ_FEATS_REREAD on the tab (feats re-read 1 Nov, 34 keycards, plan/disks/enemies 27 Sep, next Conquest unknown); CQDATA unchanged.
     6. Coach's Corner: new ids, index 1 still the Set 33 id, chx/drr tips last; on the 31 Oct rosters the Leia R7 / JML / Teva flags are open and
        Tiny's Jabba-vs-JML flag is there; the flags' source line says 1 Nov.
     7. NXT_QUEUE: re-ranked order for both accounts, same ids plus ollie "jml-reqs"; Tiny's gear row includes Old Ben; no tick keys involved.
     8. Shipment guide: Ollie's Buy first = Teva (5★), Scion, Grogu & Anzellans; Tiny's plan order unchanged; the "store rules & offers as read
        3 Oct … ranking re-derived 1 Nov" note; shpKey format unchanged; Darth Bane in the journey-only list.
     9. Roster Gap Radar: the 23 GAC / PvP entries carry a "1 Nov 2026 capture" line; members of tracked squads unchanged.
    10. No new localStorage keys; escapeHtml on the new dynamic strings; zero page errors; no overflow at 390 / 1280; screenshots in ../shots/.
   rv34 4 Nov 2026 — DELIBERATE (3 assertions): coach-tips asOf 2026-11-01 -> 2026-11-04 (TIPS re-derived against the 4 Nov pulls), so the Coach source line reads
   'Flags as of 4 Nov 2026' (x2 widths). Everything else here still runs on the 31 Oct rosters at the 1 Nov clock.
   rv40 10 Nov 2026 — DELIBERATE (13 assertions; still the 31 Oct rosters at the 1 Nov clock): era hint 'Journey Guide and Coliseum rewards were not read on 1 Nov' -> 'six hours early … Era of Rogue One …
   nothing else researched'; nxt-queue / ship-guide 1 Nov -> 10 Nov, coach-tips 4 Nov -> 10 Nov, their hard ends 14 Nov -> 28 Nov; ship-guide hint / card 'ranking re-derived 1 Nov' -> 're-checked 10 Nov'
   (x3: hint + 2 widths); conquest hard end and CQDATA.knownThrough 7 Dec -> 9 Nov (x2) and its hint 'ends 9 Nov 05:00 AEDT' -> 'Conquest 25 ended 9 Nov'; Tiny's Jabba flag numbers '10 of 14 met, 19 relic tiers' /
   '6 of 14, 24 tiers' -> the 10 Nov '11 of 14 met with 6 relic tiers left' + '31 Oct: 19 tiers' (the flag is now the Jabba build flag); Coach source line 'as of 4 Nov' -> 'as of 10 Nov' (x2);
   NXT row 01 'the seven open units' -> 'four units still open on 10 Nov' and 'as of / re-ranked 1 Nov' -> 'as of / re-checked 10 Nov' (x2).
   rv48 18 Nov 2026 — DELIBERATE (28 assertions incl. 2-width repeats; still the 31 Oct rosters at the 1 Nov clock): the era entry is re-pointed to Era of Rogue One (asOf 18 Nov,
   expires 9 Feb 2027) and Era 10 joins ERA_ARCHIVE.era10 (its 1 Nov facts list is folded into one archived note: units, ten loaned units, EL cap 75, the 18 Nov known issue);
   conquest / gac-counters / meta-squads were genuinely re-read 18 Nov (Run 3 dates; S85 3v3 boards), so the 'NOT bumped (27 Sep)' checks now assert 18 Nov + the new honest hints,
   CQDATA.knownThrough 9 Nov -> 7 Dec (Run 3) and CQ_FEATS_REREAD says the run ended 9 Nov and Run 3 is listed (feats not re-read for it); nxt-queue / ship-guide / coach-tips -> 18 Nov,
   hard ends 28 Nov -> 1 Dec; the 1 Nov Data-health probe has no rows any more (every entry it listed is dated 18 Nov), so the card / hint checks move to the 18 Nov card
   (raid-notes, raid-intel, cap-journeys aging) and the 'stale by hard end' check moves to 10 Feb 2027 (Era of Rogue One's window); the 18 Nov strapline names Era of Rogue One;
   counters 15 -> 17 rows (M&G, Baylan added; the 15 old rows keep their 1 Nov line + gain an S85 line); Coach ids + jml-run-unlock-event (last; chx / drr move up one), the JML / Jabba
   flag numbers are the 18 Nov ones (the 31 Oct 22 / 19-tier history lines were dropped with the rewrite); NXT + 'rogue-one-kits' (last, both accounts); Ollie's Teva P1 -> P2;
   source lines 10 Nov -> 18 Nov; the escaping probe renders the Data-health card / chrome banner at 10 Feb 2027 (where the era and conquest hints show).
   Run: NODE_PATH=... FILE=DIR/index.html PORT=9xxx node tests/rv31-check.js */
const L = require("./lib.js");
const { ck } = L;
const AEDT = (mo, d, h, m) => Date.UTC(2026, mo - 1, d, h - 11, m || 0);
const NOW = AEDT(11, 1, 12);   // Sun 1 Nov 2026 12:00 AEDT
const SHOTS = L.path.join(L.ROOT, "shots");
try { L.fs.mkdirSync(SHOTS, { recursive: true }); } catch (e) {}
const ROS = JSON.parse(L.fs.readFileSync(L.path.join(__dirname, "rv31-rosters-31oct.json"), "utf8"));

/* Both 31 Oct rosters (compact ID:stars.gear[rN][*]) over the 7 Oct pull (names, zetas, ships kept). */
function pulls31() {
  const acc = JSON.parse(L.PULLS);
  const NEW = { GLLEIA: "Leia Organa", ADELPHIRANGER: "Adelphi Ranger" };
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
  }, [L.REAL, JSON.stringify(pulls31()), "seeded-" + (o.tag || "x")]);
  await ctx.addInitScript(() => { window.T0 = el => el ? el.innerText.replace(/\s+/g, " ").trim() : ""; });   // compact innerText helper used by the page-side checks
  await ctx.route(/fonts\.g|swgoh\.gg|swgohrote\.com|corsproxy|allorigins|codetabs|api\.github/, r => r.abort());
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push(String(e).slice(0, 300)));
  p.on("console", m => { if (m.type() === "error" && !/Failed to load resource|net::ERR|fonts\.g/.test(m.text())) errs.push("console: " + m.text().slice(0, 200)); });
  await p.goto(`http://127.0.0.1:${L.PORT}/x.html`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(900);
  return { ctx, p, errs };
}
const T = s => String(s || "").replace(/\s+/g, " ").trim();

(async () => {
  const srv = await L.serve(); const b = await L.chromium.launch();
  const allErrs = [];

  /* ---------- 1. registry + pure data ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "pure" });
    const c = await p.evaluate(() => {
      const reg = Object.fromEntries(SNAPSHOTS.map(s => [s.key, s]));
      return { n: SNAPSHOTS.length, keys: new Set(SNAPSHOTS.map(s => s.key)).size, reg: Object.fromEntries(SNAPSHOTS.map(s => [s.key, [s.asOf, s.expires || "", s.label, s.hint]])),
        myths: SNAPSHOTS.some(s => /Myths|Era 09/.test(s.label)), eraNow: [ERA_NOW.asOf, ERA_NOW.end], arch: ERA_ARCHIVE, ship: [SHIP_DATA.asOf, SHIP_DATA.storesAsOf, SHIP_DATA.rerank],
        nxt: NXT_QUEUE.asOf, cq: [CQDATA.captured, CQDATA.skippable, CQDATA.redCrate, CQDATA.knownThrough, CQDATA.feats.global.map(f => f.name + "|" + f.req)], cqRe: CQ_FEATS_REREAD };
    });
    ck("registry: exactly 24 unique entries", c.n === 24 && c.keys === 24, `${c.n}/${c.keys}`);
    ck("era entry re-pointed (rv48) to Era of Rogue One: label, asOf 2026-11-18 = ERA_NOW.asOf, expires 2027-02-09 = ERA_NOW.end; no Era 09 / Myths entry; the hint says the chip flips six hours early and NOT researched; Era 10 in ERA_ARCHIVE.era10 (to 17 Nov, EL cap 75)", /^Era of Rogue One reference \(Era 11 by count; dates only\)$/.test(c.reg.era[2]) && c.reg.era[0] === "2026-11-18" && c.reg.era[1] === "2027-02-09" && c.eraNow.join() === "2026-11-18,2027-02-09" && !c.myths && /six hours early/.test(c.reg.era[3]) && /Era of Rogue One/.test(c.reg.era[3]) && /NOT researched/.test(c.reg.era[3]) && c.arch.era10 && c.arch.era10.end === "2026-11-17" && c.arch.era10.elCap === 75, JSON.stringify(c.reg.era));   // rv48: Era of Rogue One (Era 10 archived)
    ck("ERA_ARCHIVE: Era 09 Myths & Legends 28 Jul → 20 Oct 2026, research dated 28 Sep", c.arch.n === "09" && c.arch.name === "Myths & Legends" && c.arch.start === "2026-07-28" && c.arch.end === "2026-10-20" && c.arch.asOf === "2026-09-28", JSON.stringify(Object.assign({}, c.arch, { era10: undefined })));
    ck("re-derived → bumped: nxt-queue (NXT_QUEUE.asOf), ship-guide (SHIP_DATA.asOf) and coach-tips = 2026-11-18 (rv48: re-derived against the 18 Nov pulls); their hard ends -> 1 Dec (rv48)", c.reg["coach-tips"][0] === "2026-11-18" && c.reg["nxt-queue"][0] === "2026-11-18" && c.nxt === "2026-11-18" && c.reg["ship-guide"][0] === "2026-11-18" && c.reg["nxt-queue"][1] === "2026-12-01" && c.reg["ship-guide"][1] === "2026-12-01", JSON.stringify([c.reg["coach-tips"], c.reg["nxt-queue"][0], c.reg["ship-guide"][0]]));   // rv48: 18 Nov, hard ends 1 Dec
    ck("ship-guide: label and storesAsOf keep the 3 Oct store read; hint says ranking 18 Nov (rv48) / stores in-game only", c.ship[1] === "2026-10-03" && /store rules & prices read 3 Oct/.test(c.reg["ship-guide"][2]) && /ranking re-checked 18 Nov/.test(c.reg["ship-guide"][3]) && /3 Oct read/.test(c.reg["ship-guide"][3]), JSON.stringify(c.reg["ship-guide"]));   // rv48: 18 Nov
    ck("rv48: conquest (Run 3 dates), gac-counters and meta-squads (S85 3v3 boards) were re-read 18 Nov -> asOf 2026-11-18; conquest's hard end 9 Nov -> 7 Dec (= CQDATA.knownThrough, Run 3's last live day) (was: NOT bumped, 27 Sep)", c.reg.conquest[0] === "2026-11-18" && c.reg["gac-counters"][0] === "2026-11-18" && c.reg["meta-squads"][0] === "2026-11-18" && c.reg.conquest[1] === "2026-12-07", JSON.stringify([c.reg.conquest[0], c.reg["gac-counters"][0], c.reg["meta-squads"][0]]));   // rv48: all three re-read 18 Nov
    ck("their hints tell the truth (rv48): conquest 'run dates re-read 18 Nov … 27 Sep capture (feats re-read 1 Nov)'; gac-counters '3v3 hold numbers re-read 18 Nov … 5v5 … 1 Nov … reasoning 27 Sep'; meta-squads '3v3 GAC entries … 18 Nov … Arena / TW / raid … 27 Sep'", /run dates re-read 18 Nov: Conquest 25 Run 3/.test(c.reg.conquest[3]) && /27 Sep capture \(feats re-read 1 Nov\)/.test(c.reg.conquest[3])
      && /3v3 hold numbers re-read 18 Nov/.test(c.reg["gac-counters"][3]) && /5v5 hold numbers are the 1 Nov read/.test(c.reg["gac-counters"][3]) && /counter reasoning is the 27 Sep analysis/.test(c.reg["gac-counters"][3]) && /\(pairings\)/.test(c.reg["gac-counters"][2])
      && /3v3 GAC entries were re-checked against the Season 85 boards on 18 Nov/.test(c.reg["meta-squads"][3]) && /Arena \/ TW \/ raid entries are still the 27 Sep/.test(c.reg["meta-squads"][3]), "");   // rv48: the 18 Nov hints, still saying what was NOT re-read
    ck("CQDATA unchanged except knownThrough: captured 27 Sep, skippable 34, red crate 664, knownThrough 2026-12-07 (rv48: Run 3; rv40 had 2026-11-09), the 8 global feats in the re-read order", c.cq[0] === "27 Sep 2026" && c.cq[1] === 34 && c.cq[2] === 664 && c.cq[3] === "2026-12-07"   /* rv48: Run 3 */
      && JSON.stringify(c.cq[4].map(x => x.split("|")[0])) === JSON.stringify(["Challenge Path", "HoT", "Evasion Up", "Detonators", "Retribution", "Grogu", "Booming Voice", "Deployable Cooling Systems"]), JSON.stringify(c.cq[4]));
    ck("CQ_FEATS_REREAD: asOf 2026-11-01; feats unchanged, 34 keycards, plan/disks/enemies 27 Sep not re-read; rv48: 'That run ended 9 Nov' + Run 3 (24 Nov → 8 Dec) listed, feats not re-read for it", c.cqRe.asOf === "2026-11-01" && /8 global feats and their requirements are unchanged/.test(c.cqRe.text) && /skip up to 34 keycards/.test(c.cqRe.text) && /as captured 27 Sep \(not re-read\)/.test(c.cqRe.text) && /That run ended 9 Nov/.test(c.cqRe.text) && /Conquest 25 Run 3, Tue 24 Nov 06:00 → Tue 8 Dec 06:00 AEDT — the feats above were not re-read for it/.test(c.cqRe.text), c.cqRe.text);   // rv48: ended 9 Nov; Run 3 listed, feats not re-read
    allErrs.push(...errs); await ctx.close();
  }

  /* ---------- 2. Data health on 30 Oct / 1 Nov / 18 Nov ---------- */
  for (const [at, tag] of [[AEDT(10, 30, 12), "oct30"], [NOW, "nov1"], [AEDT(11, 18, 12), "nov18"]]) {
    const { ctx, p, errs } = await openAt(b, { at, tag: "dh-" + tag });
    await L.go(p, "ollie", "overview");
    const d = await p.evaluate(() => ({ rows: dataHealthRows().map(x => [x.e.key, x.st.state, !!x.st.expired]), card: T0(document.querySelector('[data-card="datahealth"]')),
      /* rv48 probes: the 18 Nov card, and 10 Feb 2027 (Era of Rogue One's hard end) */
      c18: (((dataHealthCard(Date.UTC(2026, 10, 18, 1)) || {}).html) || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " "),
      feb: dataHealthRows(Date.UTC(2027, 1, 10, 1)).map(x => [x.e.key, x.st.state, !!x.st.expired]),
      cFeb: (((dataHealthCard(Date.UTC(2027, 1, 10, 1)) || {}).html) || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " "),
      winFeb: eraWindowHtml(Date.UTC(2027, 1, 10, 1)).replace(/<[^>]+>/g, " ") }));
    if (tag === "nov1") {
      ck("1 Nov: Data health lists nothing and the card is absent (rv48: conquest, gac-counters and meta-squads — the three it listed — are dated 18 Nov now)", d.rows.length === 0 && d.card === "", JSON.stringify(d.rows));   // rv48: nothing ages at the 1 Nov clock (every entry it listed is now dated 18 Nov)
      ck("rv48: the 18 Nov card shows '3 of 24', no overdue, each kept date and its honest hint (raid notes 9 Aug, raid intel 17 Aug, capital-ship journeys 22 Oct 're-check in-game'); was the 1 Nov card", /3 of 24 built-in references want a re-pull/.test(d.c18) && !/overdue/.test(d.c18) && /Raid phases with no sourced squad/.test(d.c18) && /as of 9 Aug 2026/.test(d.c18) && /as of 17 Aug 2026/.test(d.c18) && /as of 22 Oct 2026/.test(d.c18) && /re-check in-game/.test(d.c18) && !/Era/.test(d.c18) && !/Shipment/.test(d.c18), d.c18.slice(0, 300));   // rv48: the 18 Nov card (raid-notes, raid-intel, cap-journeys)
      await L.go(p, "ollie", "modes");
      const ban = await p.evaluate(() => ({ html: (document.getElementById("chromeBanners") || {}).innerText || "", stale: chromeStaleRows("modes").length }));
      ck("1 Nov: no stale chrome banner on Game modes (Era 09 no longer flags 'ask Claude to re-research')", ban.stale === 0 && !/Stale/.test(ban.html), ban.html);
    } else if (tag === "oct30") {
      ck("30 Oct: nothing in the registry is stale (Era 09 archived, Era 10 tracked)", d.rows.every(r => r[1] !== "stale"), JSON.stringify(d.rows));
    } else {
      const era = await p.evaluate(() => { const x = SNAPSHOTS.find(s => s.key === "era"); const st = snapState(x); return ["era", st.state, !!st.expired]; });   // rv48: the era row isn't in dataHealthRows when fresh, so read its state directly
      ck("rv48: on 18 Nov the era entry (Era of Rogue One, began that day) is fresh; on 10 Feb 2027 it is stale by its hard end (window ended), so the registry still notices when the Era is over (was: Era 10 stale on 18 Nov)", era && era[1] === "fresh" && !era[2] && d.feb.find(r => r[0] === "era") && d.feb.find(r => r[0] === "era")[1] === "stale" && d.feb.find(r => r[0] === "era")[2] && /Era of Rogue One reference/.test(d.cFeb) && /window ended/.test(d.cFeb), JSON.stringify([era, d.feb.find(r => r[0] === "era")]));   // rv48: probe moved to 10 Feb 2027
      const strap = await p.evaluate(() => document.querySelector("[data-snap-era]").textContent);
      ck("rv48: 18 Nov strapline names Era of Rogue One to 9 Feb 2027 and says Era 10 ended 17 Nov (chip fresh); at 10 Feb 2027 it says the Era ended and the next isn't in this file (chip stale)", /Era of Rogue One to 9 Feb 2027/.test(strap) && /Era 10 ended 17 Nov 2026/.test(strap) && /fresh/.test(strap) && /Era of Rogue One ended 9 Feb 2027 — the next Era isn't in this file/.test(d.winFeb) && /stale/.test(d.winFeb), strap + " || " + d.winFeb);   // rv48
    }
    allErrs.push(...errs); await ctx.close();
  }

  /* ---------- 3. Era view ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "era" });
    await L.go(p, "ollie", "modes");
    const secs = await p.evaluate(async () => {
      state.modesnav.category = "eras"; renderModesCategory();
      const out = [];
      for (const s of ERA_SECTIONS) { state.modesnav.eraView = s.key; renderEras(); await new Promise(r => setTimeout(r, 30));
        const body = document.getElementById("eraBody"); const ban = body.querySelector(".era-archived");
        out.push({ key: s.key, ban: ban ? ban.textContent.replace(/\s+/g, " ") : null, first: body.querySelector(".card").firstElementChild === ban }); }
      state.modesnav.eraView = "overview"; renderEras();
      const box = document.querySelector("#eraBody .era-now");
      return { out, box: box ? box.textContent.replace(/\s+/g, " ") : "", chip: box && box.querySelector(".chip") ? box.querySelector(".chip").textContent : "", strap: document.querySelector("[data-snap-era]").textContent };
    });
    ck("archived banner 'Era 09 “Myths & Legends” — ended 20 Oct 2026 — kept as reference' heads all 6 Era sections", secs.out.length === 6 && secs.out.every(x => x.ban && /Era 09 “Myths & Legends” — ended (20 Oct 2026|Oct 20, 2026) — kept as reference\./.test(x.ban) && x.first), JSON.stringify(secs.out.map(x => [x.key, !!x.ban])));
    ck("rv48: the Era box (Era of Rogue One) carries the registry chip (fresh) — the Era 09 card title no longer does", /fresh/.test(secs.chip) && /Running now: Era of Rogue One \(Era 11 by count — inferred\)/.test(secs.box), secs.chip);   // rv48
    ck("rv48: Era box — Era 10's archived note (B1 + Adelphi, ten loaned units, EL cap 75) and Era of Rogue One's facts (18 loaned units; EL cap / Journey Guide / tiers / Coliseum NOT read) (was: Era 10's 1 Nov facts)", /Before it: Era 10 “The Mandalorian and Grogu” \(Mini-Era\)/.test(secs.box) && /Adelphi Ranger and Mercenary Guard Droid \(B1\)/.test(secs.box) && /Ten loaned units, all expired with it/.test(secs.box) && /Era Level cap 75/.test(secs.box)
      && /NOT read for this Era: its Era Level cap, Journey Guide, ability tiers and Coliseum rewards/.test(secs.box) && /Loaned units: 18/.test(secs.box), secs.box.slice(0, 300));   // rv48: Era 10 is the archived note; Rogue One's facts say what was NOT read
    ck("1 Nov strapline: Era 10 Mini-Era to 17 Nov 2026, Era 09 ended 20 Oct", /Era 10 “The Mandalorian and Grogu” Mini-Era to 17 Nov 2026/.test(secs.strap) && /Era 09 ended 20 Oct 2026/.test(secs.strap), secs.strap);
    const ph = await p.evaluate(() => ({ before: eraCurrentPhrase(Date.UTC(2026, 9, 15, 1)), after: eraCurrentPhrase(), win: eraWindowHtml(Date.UTC(2026, 9, 15, 1)) }));
    ck("15 Oct clock: 'The current Era (Era 09).' and the strapline names Era 09 to 20 Oct; 1 Nov: Era 09 'has ended'", ph.before === "The current Era (Era 09)." && /Era 09 &ldquo;Myths &amp; Legends&rdquo; to 20 Oct 2026/.test(ph.win) && /has ended/.test(ph.after), JSON.stringify(ph));
    allErrs.push(...errs); await ctx.close();
  }

  /* ---------- 4/5. GAC counters + Conquest ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "gac" });
    const g = await p.evaluate(() => ({ why: GAC_COUNTERS.map(c => c.why), defs: GAC_COUNTERS.map(c => c.def), counters: GAC_COUNTERS.map(c => c.counter) }));
    ck("rv48: 17 counter rows — the 15 original rows keep the 1 Nov defence-board line and the 'pairings: 27 Sep, not re-derived' label and gain an S85 line; the 2 new rows (M&G, Baylan) carry S85 numbers only; no 'Update 22 Oct' left", g.why.length === 17 && g.why.filter(w => /Defence boards read 1 Nov 2026 \(swgoh\.gg, one-click capture\): 5v5 Season 84/.test(w) && /Season 83 3v3(: Ahsoka Tano)? #\d+/.test(w) && /Pairing and reasoning: the 27 Sep analysis, not re-derived/.test(w)).length === 15 && g.why.every(w => !/Update 22 Oct/.test(w)) && g.why.filter(w => /S85 3v3 DEFENCE board \(read 18 Nov 2026/.test(w) || /S85 \(read 18 Nov 2026/.test(w)).length === 17, "");   // rv48: 17 rows
    const by = d => g.why[g.defs.indexOf(d)];
    ck("spot values from the capture: SLKR #2 46.3% / 10.8K + 3v3 #1 37.2%; Stranger #1 53.2% / 51K; Cere #3 41.9% / 3,215; Leia #4 27.0% + 3v3 #6 24.5%; Jango #34 18.6%; Rey row resolved to GL Rey by exact name",
      /#2, S, 46\.3% hold over 10\.8K battles; Season 83 3v3 #1, S, 37\.2% over 12\.4K/.test(by("Supreme Leader Kylo Ren (GL)")) && /#1, S, 53\.2% hold over 51K/.test(by("The Stranger")) && /#3, S, 41\.9% hold over 3,215/.test(by("Cere Junda Jedi Survivor"))
      && /#4, S, 27\.0% hold over 7,661 battles; Season 83 3v3 #6, S, 24\.5% over 33K/.test(by("Leia Organa (GL) Rebels")) && /#34, B, 18\.6% hold over 735/.test(by("Jango Fett Bounty Hunters")) && /named exactly "Rey", which is GL Rey's swgoh\.gg name \(GLREY/.test(by("GL Rey (Rey Jedi Master)")), "");
    ck("the counter pairings themselves are untouched (15 counters, SLKR → GL Rey, Leia → SEE or SLKR)", g.counters.length === 17 && g.counters[0] === "GL Rey (Jedi squad)" && by("Leia Organa (GL) Rebels") && g.counters[g.defs.indexOf("Leia Organa (GL) Rebels")] === "Sith Eternal Emperor (GL) or Supreme Leader Kylo Ren (GL)", JSON.stringify(g.counters.slice(0, 3)));   // rv48: 15 -> 17 (two new 'not researched' rows); old pairings untouched
    await L.go(p, "ollie", "gac"); await p.evaluate(() => { state.views.gac = "counters"; render(); }); await p.waitForTimeout(250);
    const card = await p.evaluate(() => T0(document.querySelector('[data-card="counters"]')));
    ck("GAC planner counters card (rv48): 'Pairings: the 27 Sep analysis, with the S85 3v3 changes … (as of 18 Nov …) · hold numbers: 18 Nov 2026 read … Season 85 (3v3) … 1 Nov … 5v5'", /Pairings: the 27 Sep analysis, with the S85 3v3 changes and two new rows added 18 Nov \(as of 18 Nov/.test(card) && /hold numbers: 18 Nov 2026 read of swgoh\.gg's Season 85 \(3v3\) defence board/.test(card) && /1 Nov 2026 read of the 5v5 \(Season 84\) board/.test(card), card.slice(0, 260));   // rv48
    await L.go(p, "ollie", "conquest"); await p.evaluate(() => { state.cq.view = "feats"; state.cq.sector = "global"; renderConquest(); }); await p.waitForTimeout(250);
    const cq = await p.evaluate(() => ({ meta: T0(document.getElementById("cqMeta")), body: T0(document.getElementById("cqBody")) }));
    ck("Conquest tab: the re-read note under the snapshot line (feats 1 Nov, 27 Sep for the rest; rv48: run dates 18 Nov, Run 3 listed); feats intro says Global re-checked 1 Nov, sectors not", /captured 27 Sep 2026 · run dates as of 18 Nov 2026/.test(cq.meta) && /Feats re-read 1 Nov 2026 on swgoh4\.life/.test(cq.meta) && /Conquest 25 Run 3/.test(cq.meta) && /Global feats re-checked 1 Nov 2026: unchanged; Sector 1–5 feats not re-read/.test(cq.body), cq.meta.slice(0, 300));   // rv48
    allErrs.push(...errs); await ctx.close();
  }

  /* ---------- 6/7/8/9. Coach, NXT, shipment, radar on the 31 Oct rosters ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "roster" });
    const c = await p.evaluate(() => {
      const ids = a => TIPS[a].map(t => t.id);
      const tip = (a, id) => { const t = TIPS[a].find(x => x.id === id); const reqs = state.pulls[a].reqs; return t ? { sev: t.sev, done: tipIsDone(a, reqs, t, 0), prog: t.check ? tipProgress(reqs, t.check) : null, key: hardTipKey(a, t), note: t.note } : null; };
      return { oIds: ids("ollie"), tIds: ids("tiny"), leia: tip("ollie", "leia-r7-then-freeze"), jml1: tip("ollie", "jml-step1-chewie-hermit"), teva: tip("ollie", "rotta-pit-teva-5"), jabba: tip("tiny", "jabba-now-closer-than-jml"),
        tLeia: tip("tiny", "gl-leia-organa-is-unlocked"), set33: tip("ollie", "2-set-33-datacrons-built"),
        nxtO: NXT_QUEUE.ollie.queue.map(e => e.id), nxtT: NXT_QUEUE.tiny.queue.map(e => e.id), jmlRow: nxtRows("ollie")[0], rebel: NXT_QUEUE.tiny.queue.find(e => e.id === "rebel-gear").reqs.map(r => r.id),
        shipO: SHIP_PLAN.ollie.map(e => [e.id, e.tier, e.star]), shipT: SHIP_PLAN.tiny.map(e => e.id), shpKey: shpKey("ollie", "CARSONTEVA"), journey: SHIP_DATA.journeyOnly.map(j => j[0]),
        radar: META_SQUADS.slice(0, 23).filter(s => /1 Nov 2026 capture \(swgoh\.gg offence boards/.test(s.notes || "")).length, raidNotes: META_SQUADS.slice(23).filter(s => /1 Nov 2026 capture/.test(s.notes || "")).length,
        slkr: JSON.stringify(META_SQUADS.find(s => s.name === "Supreme Leader Kylo Ren (GL)").members), bane: JSON.stringify(META_SQUADS.find(s => s.name === "Darth Bane Sith (offense)").members),
        ticks: Object.keys(state.ticks).filter(k => /nxt/.test(k)) };
    });
    ck("Coach ids (ollie): GAC chx first, index 1 keeps the Set 33 id (legacy -t1 tick lands where it did), the new Leia / JML / Teva / B1 / S85 / crystals flags, chx Executor then drr (rv48: then jml-run-unlock-event, appended last)", c.oIds[0] === "re-enter-gac-three-built" && c.oIds[1] === "2-set-33-datacrons-built" && ["leia-r7-then-freeze", "jml-step1-chewie-hermit", "jml-step2-mon-mothma", "jml-step3-four-g13s", "rotta-pit-teva-5", "b1-marquee-proving-grounds", "s85-3v3-defence", "crystals-energy-not-r10", "executor-fleet-slipped-to-rank"].every(i => c.oIds.includes(i))
      && c.oIds[c.oIds.length - 1] === "jml-run-unlock-event" && c.oIds[c.oIds.length - 2] === "drr-four-star-floor" && c.oIds[c.oIds.length - 3] === "chx-executor-plan" && !c.oIds.includes("c-3po-chewie-stuck-at") && !c.oIds.includes("lobot-is-g12-with-0"), c.oIds.join());   // rv48: + jml-run-unlock-event appended last
    ck("Coach ids (tiny): Leia keep first, GAC chx at index 1, Set 33, JML, Jabba-vs-JML, SLKR/Rey R9, S85, chx Executor, drr last", c.tIds[0] === "gl-leia-organa-is-unlocked" && c.tIds[1] === "re-enter-gac-rey-r8" && ["2-set-33-datacrons-built", "jedi-master-luke-skywalker-is", "jabba-now-closer-than-jml", "tiny-slkr-rey-r9", "tiny-s85-3v3-defence", "executor-is-still-only-4"].every(i => c.tIds.includes(i)) && c.tIds[c.tIds.length - 1] === "drr-four-star-floor", c.tIds.join());
    ck("31 Oct rosters: Leia R7 flag open (fixnow, auto); JML step 1 0/2; Teva 5★ open; tip keys keep the '<acct>-t:<id>' format", c.leia.sev === "fixnow" && !c.leia.done && c.jml1.prog.doneCount === 0 && c.jml1.prog.total === 2 && !c.teva.done && c.leia.key === "ollie-t:leia-r7-then-freeze", JSON.stringify([c.leia.done, c.jml1.prog, c.teva.done]));
    ck("derived numbers in the flags (tools/gl-readiness.js) — rv48: the 18 Nov ones (JML all 14 met; Tiny Jabba 13/14, C-3PO R4 → R7); Tiny Leia R10 on the 31 Oct pull; Set 33 'expired 29 Oct'", /All 14 of Jedi Master Luke's requirements are met now/.test(c.jml1.note) && /13 of 14 met/.test(c.jabba.note) && /C-3PO R4 → R7/.test(c.jabba.note) && /R10 on the 31 Oct pull/.test(c.tLeia.note) && /expired 29 Oct 2026 18:00 AEDT/.test(c.set33.note), "");   // rv48: 18 Nov numbers
    ck("NXT_QUEUE re-ranked, same ids (+ ollie jml-reqs): ollie jml-reqs → leia-squad-zetas → krrsantan → bkm → bane → rey-dsv → raddus-jyn → see-gear → dooku → temple; tiny drogan → r2d2 → jml-core → rebel-gear → rey-dsv → grogu → raddus-jyn → cassian → rex-fives; rv48: + rogue-one-kits last on both", c.nxtO.join() === "jml-reqs,leia-squad-zetas,krrsantan-zeta,bkm-omicrons,darth-bane,rey-dsv,raddus-jyn,see-gear,count-dooku,jedi-temple,rogue-one-kits" && c.nxtT.join() === "drogan-zetas,r2d2-zeta,jml-core,rebel-gear,rey-dsv,grogu-ants,raddus-jyn,cassian,rex-fives,rogue-one-kits", c.nxtO.join() + " | " + c.nxtT.join());   // rv48: + rogue-one-kits (last)
    ck("NXT: jml-reqs is row 1 with 7 live lines (Chewbacca R5 → R6 … Biggs G8 → R3), Not started; Tiny's gear row now includes Old Ben; no NXT tick keys exist", c.jmlRow.e.id === "jml-reqs" && c.jmlRow.lines.length === 7 && /Chewbacca: R5 → R6/.test(c.jmlRow.lines[0].t) && /Biggs Darklighter: G8 → R3/.test(c.jmlRow.lines[6].t) && c.rebel.includes("OLDBENKENOBI") && c.ticks.length === 0, JSON.stringify(c.jmlRow.lines.map(l => l.t)));
    ck("Shipment (ollie): plan order Carson Teva (rv48: P1 -> P2, 5★), Scion (P1), Grogu & Anzellans (P1), then the Rotta P2 rows; shpKey format unchanged; Darth Bane journey-only", JSON.stringify(c.shipO.slice(0, 4)) === JSON.stringify([["CARSONTEVA", "P2", 5], ["BOBAFETTSCION", "P1", 7], ["GOPHERANTS", "P1", 7], ["R5D4", "P2", 4]]) && c.shpKey === "ollie-p:shp:CARSONTEVA" && c.journey.includes("DARTHBANE"), JSON.stringify(c.shipO.slice(0, 5)));   // rv48: Teva P1 -> P2 (Rotta is behind Jabba/JML now)
    ck("Shipment (tiny): plan order unchanged from 3 Oct", c.shipT.join() === "GOPHERANTS,BOBAFETTSCION,CAPTAINSILVO,VANE,HUYANG,GENERALSYNDULLA,TUSKENHUNTRESS,RANGERZEB,DARTHMALAK,R5D4,CARSONTEVA,REMNANTSNOWCOMMANDER,BISHOP,KIADIMUNDI,BENSOLO,SATELESHAN,MAULHATEFUELED,THERONIN", c.shipT.join());
    ck("Radar: all 23 GAC / PvP entries carry the 1 Nov capture line, raid entries none; SLKR and Darth Bane members unchanged", c.radar === 23 && c.raidNotes === 0 && c.slkr === JSON.stringify([["SUPREMELEADERKYLOREN", "Supreme Leader Kylo Ren (GL)"], [null, "Rey (Dark Side Vision)"], ["KYLORENUNMASKED", "Kylo Ren (Unmasked)"], ["GENERALHUX", "General Hux"], ["FOSITHTROOPER", "Sith Trooper"]]) && c.bane === JSON.stringify([[null, "Darth Bane"], [null, "Darth Talon"], [null, "Savage Opress"]]), `${c.radar}/${c.raidNotes}`);

    for (const w of [1280, 390]) {
      await p.setViewportSize({ width: w, height: 1000 });
      await L.go(p, "ollie", "coach"); await p.evaluate(() => { state.views.coach = "priorities"; render(); }); await p.waitForTimeout(250);
      const co = await p.evaluate(() => T0(document.getElementById("tips")));
      ck(`[${w}] Coach's corner: Leia R7 flag shown, sources line 'Flags as of 18 Nov 2026 … fresh … 31 Oct pulls' (rv48; rv40: 'as of 10 Nov 2026'; rv34: 'as of 1 Nov 2026')`, /Leia R6 → R7 by ~5 Nov, then freeze Leia's relics/.test(co) && /Flags as of 18 Nov 2026/.test(co) && /fresh/.test(co) && /31 Oct pulls and the 31 Oct GL review/.test(co), co.slice(-260));
      await p.screenshot({ path: L.path.join(SHOTS, `rv31-coach-${w}.png`), fullPage: false });
      await L.go(p, "ollie", "farm"); await p.waitForTimeout(200);
      const sh = await p.evaluate(() => T0(document.querySelector('[data-card="shp"]')));
      ck(`[${w}] shipment card: 'Store rules & offers as read 3 Oct (not re-checkable outside the game …); ranking re-checked 18 Nov' (rv48), ranking chip 18 Nov, store read 3 Oct`, /Store rules & offers as read 3 Oct \(not re-checkable outside the game.*?\); ranking re-checked 18 Nov/.test(sh) && /Shipment ranking as of 18 Nov 2026/.test(sh) && /store rules & offers read 3 Oct 2026/.test(sh), sh.slice(-300));
      await L.go(p, "ollie", "leia"); await p.waitForTimeout(200);
      const nx = await p.evaluate(() => T0(document.querySelector('[data-card="nxt"]')));
      ck(`[${w}] NXT card: row 01 Jedi Master Luke requirements, source 'as of 18 Nov 2026 … re-checked 18 Nov' (rv48)`, /01 Jedi Master Luke requirements — all met on 18 Nov \(four open on 10 Nov, seven on 31 Oct\)/.test(nx) && /Next characters as of 18 Nov 2026/.test(nx) && /re-checked 18 Nov 2026/.test(nx), nx.slice(-200));
      await L.go(p, "ollie", "overview"); await p.waitForTimeout(200);
      const dh = await p.$('[data-card="datahealth"]'); if (dh) { await dh.scrollIntoViewIfNeeded(); await dh.screenshot({ path: L.path.join(SHOTS, `rv31-datahealth-${w}.png`) }); }
      const o = await L.overflow(p);
      ck(`[${w}] no horizontal overflow (overview / coach / farm / GL roadmap)`, o.doc <= o.inner + 1, JSON.stringify(o));
    }
    allErrs.push(...errs); await ctx.close();
  }

  /* ---------- 10. storage + escaping ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "esc" });
    const keys = await p.evaluate(async () => { for (const t of SUBTABS.map(x => x.key)) { switchTab(t); await new Promise(r => setTimeout(r, 40)); } return Object.keys(localStorage).sort(); });
    ck("no new localStorage keys (the same 4 as before rv31)", JSON.stringify(keys) === JSON.stringify(["swgoh-holotable-active-account-v1", "swgoh-holotable-device-v1", "swgoh-holotable-pulls-v1", "swgoh-tracker"]), JSON.stringify(keys));
    const r = await p.evaluate(() => {
      window.__x = 0; const h = '<img src=x onerror="window.__x=1"><b id="rvx">x</b>';
      const keep = [ERA_NOW.facts[0], ERA_ARCHIVE.name, CQ_FEATS_REREAD.text, SHIP_DATA.rerank, GAC_COUNTERS[0].why, NXT_QUEUE.ollie.queue[0].why, SNAP_BY_KEY.era.hint, SNAP_BY_KEY.conquest.hint];
      ERA_NOW.facts[0] = h; ERA_ARCHIVE.name = h; CQ_FEATS_REREAD.text = h; SHIP_DATA.rerank = h; GAC_COUNTERS[0].why = h; NXT_QUEUE.ollie.queue[0].why = h; SNAP_BY_KEY.era.hint = h; SNAP_BY_KEY.conquest.hint = h;
      const box = document.createElement("div");
      box.innerHTML = [eraArchivedBannerHtml(), eraNowHtml(), shpCardHtml("ollie"), gacCountersHtml(), nxtCardHtml("ollie"), (dataHealthCard(Date.UTC(2027, 1, 10, 1)) || {}).html || "", chromeBannerHtml("modes", Date.UTC(2027, 1, 10, 1))   /* rv48: 10 Feb 2027 — the era / conquest entries are stale there, so their hints render */].join("");
      switchAcct("ollie"); switchTab("conquest"); renderConquest();
      const meta = document.getElementById("cqMeta");
      const res = { img: box.querySelectorAll("img").length + meta.querySelectorAll("img").length, b: !!box.querySelector("#rvx") || !!meta.querySelector("#rvx"),
        shown: (box.textContent.match(/<img src=x/g) || []).length, metaShown: /<img src=x/.test(meta.textContent) };
      ERA_NOW.facts[0] = keep[0]; ERA_ARCHIVE.name = keep[1]; CQ_FEATS_REREAD.text = keep[2]; SHIP_DATA.rerank = keep[3]; GAC_COUNTERS[0].why = keep[4]; NXT_QUEUE.ollie.queue[0].why = keep[5]; SNAP_BY_KEY.era.hint = keep[6]; SNAP_BY_KEY.conquest.hint = keep[7];
      render(); return res;
    });
    await p.waitForTimeout(200);
    const fired = await p.evaluate(() => window.__x);
    ck("escaping: hostile text in ERA_NOW, ERA_ARCHIVE, the Conquest re-read note, the shipment re-rank note, a counters row, an NXT row and two registry hints renders as text — nothing injected or executed", r.img === 0 && !r.b && r.shown >= 7 && r.metaShown && !fired, JSON.stringify(r));
    allErrs.push(...errs); await ctx.close();
  }

  ck("zero page errors across the suite", allErrs.length === 0, JSON.stringify(allErrs.slice(0, 5)));
  await L.finish(b, srv);
})();
