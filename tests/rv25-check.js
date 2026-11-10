/* rv25-check — independent review fixes, 25 Oct 2026 (GAC Opponent view gop*, the swgoh.gg pull-file hand-off pbm*, parsePlayer).
   rv34 4 Nov 2026 — DELIBERATE (6 assertions, section 10): seed v12/40/1 Nov -> v13/39/4 Nov; the 31 Oct Places of Power and Stardust rows present -> absent (over at 4 Nov);
     next-up at the 1 Nov clock: "2 Nov TW sign-up + Bespin" -> "4 Nov TW attack phase + Champion of the Pit" (those two rows were dropped); GAC_SCHEDULE / gac-schedule
     1 Nov -> 4 Nov; registry events + datacrons 1 Nov -> 4 Nov.
   rv40 10 Nov 2026 — DELIBERATE (6 assertions, section 10, + a clock fix): openX now pins with ctx.clock.setFixedTime as well (the Date.now override never reached the no-argument
     new Date() of the Events code, so the 'next-up at 1 Nov' check read the real clock and was already failing on the shipped 4 Nov build). Seed v13/39/4 Nov -> v14/43/10 Nov; Smuggler's Run
     absent -> only the 10 Nov read's 9 Nov run, Places of Power second run present -> absent (ended 5 Nov); next-up '4 Nov TW attack phase' -> no TW row at all + Champion of the Pit, S85,
     B1, and the Events tab shows the 10 Nov Territory Battle; GAC_SCHEDULE / gac-schedule 4 Nov -> 10 Nov with s85e2 sourced; registry droid-raid 1 Nov -> 10 Nov, events + datacrons 4 Nov ->
     10 Nov; DROID_RAID 1 Nov / recheck 8 Nov -> 10 Nov / 17 Nov with the 10 Nov note.
   Every check here FAILED (or could not be expressed) on the 22 Oct build 7e10af08…; see the review report for the scenarios.
     1. bookmarklet ≤ 2000 chars with a 60-char app URL (was 2001) and with the live GitHub Pages URL; still valid JS.
     2. the pull-file / opponent-snapshot inputs carry NO accept filter (mobile pickers grey out .json.gz); a gzip or plain pull file
        chosen in the opponent-snapshot picker is routed to the pull-file confirm card instead of "isn't valid JSON".
     3. per-kind defence caps: Carbonite 5v5 = 3 squads + 1 fleet — a 2nd fleet can no longer take a squad slot (4 fleets were allowed).
     4. a pull file's roster history + arena log entries are dated at the PULL (payload `at`), not at the Import press; an arena rank
        older than the newest logged entry is not inserted above it.
     5. parsePlayer survives null entries (units / abilities / mod stats / datacron tiers) and a numeric league_name, and drops a unit
        with no base_id (it used to land under "undefined"); a payload with no galactic power is refused (it imported as a 0-GP roster
        that wiped this device's mods); gopCompactPlayer no longer rejects a whole player whose unit id matches an Object.prototype
        member ("constructor").
     6. storage full: the main state write sheds the re-pullable opponent store (GOP_KEY) and retries — the owner's own change is saved,
        the Opponent card says the scouting data is gone after a reload; on the old build the change was simply not persisted.
     7. between Season 84 Event 3 and Season 85 Event 1 (pinned 30 Oct 2026, Australia/Sydney) the Opponent view keeps the scouted
        bracket's own format (5v5) instead of the schedule's next event (3v3).
     8. touch screens: adding a unit does not re-focus the search box (no keyboard over the list); fine pointers still focus it.
     9. an opponent snapshot player without zetas/omis renders "0 zetas", not "undefined zetas"; quotes in omicron names stay inside
        the title attribute; 390/1280 no overflow; zero page errors; screenshots of the changed UI.
    10. the 25 Oct data re-check (real clock): EVENTS_SEED v10 (+ Smuggler's Run 26 Oct, + Places of Power 31 Oct, Stardust note),
        DROID_RAID / ERA_NOW / MGL_ASOF / gac-format re-checked to 25 Oct, everything not re-verified left at 22 Oct, registry 24.
   Run WITHOUT SNAP_DATE: cd DIR && NODE_PATH=... FILE=DIR/index.html PORT=9xxx node tests/rv25-check.js
   rv25b 25 Oct 2026 (the same day, after swgoh.gg's own pages were read live in the owner's Chrome) — DELIBERATE, 5 section-10 assertions changed (old -> new, why):
     (1) seed "v10 / 24 rows / CAPTURED 22 Oct / state 10" -> "v11 / 38 rows / CAPTURED 25 Oct / state 11" (rebuilt from swgoh.gg/schedule/);
     (2) Smuggler's Run + Places of Power: were "THIRD-PARTY swgohevents, no time claimed" -> both are now on swgoh.gg/schedule/ with end times (Smuggler's Run ends 27 Oct 21:00 AEDT, Places of Power ends 1 Nov 18:00 AEDT); dates/categories unchanged;
     (3) Stardust Transmission: was "stays est., third-party" -> it is a scheduled event (31 Oct -> 1 Nov 18:00 AEDT), name has no "(est.)";
     (4) registry: was "only gac-format + droid-raid moved; events / fleet / datacrons / tier list NOT bumped" -> events, meta-fleets, datacrons, tierlist are 25 Oct (re-read live), gac-schedule stays 22 Oct;
     (5) Datacron Set 33: label "could not be re-read" -> re-read live; the date check (29 Oct) is unchanged and the 18:00 AEDT clock time is now also required.    rv31b 1 Nov 2026 — DELIBERATE (1 assertion): ERA_NOW.asOf 2026-10-25 -> 2026-11-01 and its source line 're-read 25 Oct 2026' -> 're-read 25 Oct and 1 Nov 2026' (swgoh.gg's Era 10 page re-read 1 Nov).
*/
const L = require("./lib.js");
const { ck } = L;
const zlib = require("zlib");
const SHOTS = L.path.join(L.ROOT, "shots");
try { L.fs.mkdirSync(SHOTS, { recursive: true }); } catch (e) {}
const TMP = L.path.join(L.ROOT, "shots", "rv25-files");
try { L.fs.mkdirSync(TMP, { recursive: true }); } catch (e) {}
const BASE = `http://127.0.0.1:${L.PORT}`;
const SNAP12 = JSON.parse(L.fs.readFileSync(L.path.join(L.ROOT, "holotable-roster-snapshot-2026-10-12.json"), "utf8"));

function rawFrom(p, code, sr, ranks) {
  return {
    data: { ally_code: +code, name: "Fixture", galactic_power: p.gp, character_galactic_power: p.gpChar || 0, ship_galactic_power: p.gpShip || 0,
      skill_rating: sr, league_name: "Carbonite", division_number: 5, arena: { rank: ranks[0] }, fleet_arena: { rank: ranks[1] } },
    units: Object.entries(p.reqs).map(([id, u]) => ({ data: { base_id: id, name: u.name || id, rarity: u.s, gear_level: u.g, relic_tier: u.r ? u.r + 2 : 1,
      combat_type: u.t === "ship" ? 2 : 1, era_level: u.el || 0, ability_data: (u.z || []).map(n => ({ name: n, has_zeta_learned: true })) } })),
    mods: [], datacrons: []
  };
}
/* in-page builders for a synthetic opponent + bracket (raw swgoh.gg shapes, real bracket envelope) */
const BUILD = () => {
  window.__mk = (code, name, units, o) => ({ data: Object.assign({ ally_code: +code, name, galactic_power: 7e6, guild_name: "G", league_name: "Carbonite", division_number: 5, skill_rating: 1500, last_updated: "2026-10-24T01:00:00" }, o || {}),
    units: units.map(([id, n, r, sp, ship, omi]) => ({ data: { base_id: id, name: n, rarity: 7, gear_level: 13, relic_tier: r + 2, power: 30000 + r * 1000, combat_type: ship ? 2 : 1, stats: ship ? {} : { "5": sp },
      ability_data: omi ? [{ id: "o1", name: omi, has_omicron_learned: true }] : [] } })), mods: [], datacrons: [] });
  window.__opp = __mk("111222333", "Opp One", [["SUPREMELEADERKYLOREN", "Supreme Leader Kylo Ren", 9, 330, false, 'Say "hi" <b>'], ["KYLORENUNMASKED", "Kylo Ren (Unmasked)", 7, 290], ["GENERALHUX", "General Hux", 5, 270],
    ["FOSITHTROOPER", "Sith Trooper", 5, 230], ["GLREY", "Rey", 8, 320], ["BENSOLO", "Ben Solo", 5, 260], ["JABBATHEHUTT", "Jabba the Hutt", 7, 200],
    ["CAPITALEXECUTOR", "Executor", 0, 0, true], ["RAZORCREST", "Razor Crest", 0, 0, true], ["HOUNDSTOOTH", "Hound's Tooth", 0, 0, true], ["CAPITALPROFUNDITY", "Profundity", 0, 0, true]]);
  window.__br = (season, week) => ({ data: [{ startTime: "2026-10-21T21:00:00", leagueId: "CARBONITE", seasonNumber: season, weekNumber: week, bracketId: 8236,
    bracketPlayers: [{ allyCode: 229917529, playerName: "Ollietank", playerPower: 8e6, bracketRank: 0 }, { allyCode: 111222333, playerName: "Opp One", playerPower: 7e6, guildName: "G", bracketRank: 1, bracketScore: 0, playerIsFake: false }] }], message: null, totalCount: 1, errorKey: null });
  window.__seed = (season, week) => { gopClear(); const g = gopReceive({ ollie: { bracket: __br(season, week), players: { "111222333": __opp } } }, Date.now() - 3600e3, null); gopImportParsed(g);
    switchAcct("ollie"); switchTab("gac"); sectionView("gac", "opponent"); gopSelWrite("ollie", { opp: "", squads: [] }); gopPickOpp("ollie", "111222333"); };
};
async function openX(b, o) {
  o = o || {};
  const ctx = await b.newContext(Object.assign({ viewport: { width: o.width || 1280, height: o.height || 1000 } }, o.mobile ? { isMobile: true, hasTouch: true } : {}, o.tz ? { timezoneId: o.tz } : {}));
  if (o.pin) await ctx.clock.setFixedTime(o.pin);   // rv40: the Date.now override below does not reach the no-argument new Date() the Events code uses, so section 10 read the REAL clock and rotted on 10 Nov
  await ctx.addInitScript(([s, pl, seedKey, pin]) => {
    if (pin) { const real = Date.now.bind(Date), s0 = real(); Date.now = () => pin + (real() - s0); }
    try { if (!sessionStorage.getItem(seedKey)) { localStorage.clear(); localStorage.setItem("swgoh-tracker", s); localStorage.setItem("swgoh-holotable-pulls-v1", pl); sessionStorage.setItem(seedKey, "1"); } } catch (e) {}
  }, [L.REAL, L.PULLS, "seeded-" + (o.tag || "x"), o.pin || null]);
  await ctx.route(/fonts\.g|swgoh\.gg|swgohrote\.com|corsproxy|allorigins|codetabs|api\.github/, r => r.abort());
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push(String(e).slice(0, 300)));
  p.on("console", m => { if (m.type() === "error" && !/Failed to load resource|net::ERR|fonts\.g/.test(m.text())) errs.push("console: " + m.text().slice(0, 200)); });
  await p.goto(`${BASE}/x.html`, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(900);
  await p.evaluate(BUILD);
  return { ctx, p, errs };
}

(async () => {
  const srv = await L.serve(); const b = await L.chromium.launch({ headless: true });
  const allErrs = [];
  const sec = async (name, fn) => { try { await fn(); } catch (e) { ck(`${name}: section crashed — ${String(e.message || e).split("\n")[0].slice(0, 160)}`, false, ""); } };

  /* ---------- 1 + 2a. bookmarklet budget, no accept filters ---------- */
  await sec("1", async () => {
    const { ctx, p, errs } = await openX(b, { tag: "bm" });
    const r = await p.evaluate(() => {
      const live = "https://ollietank-bit.github.io/swgoh-holotable/", u60 = live + "x".repeat(60 - live.length);
      const c60 = pbmBookmarkletCode(u60), cl = pbmBookmarkletCode(live);
      let parses = false; try { new Function(c60); parses = true; } catch (e) {}
      return { n60: c60.length, nl: cl.length, u60: u60.length, parses, alerts: (c60.match(/alert\(/g) || []).length, toast: c60.includes("'✓ Holotable: saved '") && c60.includes("Import pull file…") && c60.includes("no roster ('+e.message+')"),
        acc: ["pbmPullFile", "gopSnapFile"].map(id => { switchAcct("ollie"); switchTab("gac"); sectionView("gac", "opponent"); const el = document.getElementById(id); return el ? el.getAttribute("accept") : "missing"; }) };
    });
    ck("bookmarklet ≤ 2000 chars with a 60-char app URL (was 2001) and with the live GitHub Pages URL", r.u60 === 60 && r.n60 <= 2000 && r.nl <= 2000, JSON.stringify([r.n60, r.nl]));
    ck("bookmarklet still valid JS, one alert (not on swgoh.gg), toast texts intact", r.parses && r.alerts === 1 && r.toast, "");
    ck("pull-file and opponent-snapshot inputs have NO accept filter (mobile pickers grey out .json.gz)", r.acc[0] === null && r.acc[1] === null, JSON.stringify(r.acc));
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 2b. a pull file chosen in the opponent-snapshot picker is routed ---------- */
  await sec("2b", async () => {
    const { ctx, p, errs } = await openX(b, { tag: "route" });
    const payload = await p.evaluate(() => JSON.stringify({ type: "holotable-pull", v: 1, at: Date.now() - 600e3, accounts: {}, gac: { ollie: { bracket: __br(84, 3), players: { "111222333": __opp } } } }));
    L.fs.writeFileSync(L.path.join(TMP, "pull.json.gz"), zlib.gzipSync(Buffer.from(payload)));
    L.fs.writeFileSync(L.path.join(TMP, "pull-plain.json"), payload);
    await p.evaluate(() => { switchAcct("ollie"); switchTab("gac"); sectionView("gac", "opponent"); });
    const out = {};
    for (const f of ["pull.json.gz", "pull-plain.json"]) {
      await p.evaluate(() => { pbmCancel(); gopUi.msg = ""; });
      await p.setInputFiles("#gopSnapFile", L.path.join(TMP, f));
      await p.waitForFunction(() => !!pbmPending || /nothing was changed/.test(gopUi.msg), null, { timeout: 8000 }).catch(() => {});
      out[f] = await p.evaluate(() => ({ pending: !!pbmPending && pbmPending.src === "file" && !!pbmPending.gac, card: !(document.getElementById("pbmConfirm") || { hidden: true }).hidden, msg: gopUi.msg }));
    }
    ck("opponent picker: a .json.gz pull file opens the pull-file confirm card (was: \"isn't valid JSON\")", out["pull.json.gz"].pending && out["pull.json.gz"].card, JSON.stringify(out["pull.json.gz"]));
    ck("opponent picker: a plain .json pull file opens the pull-file confirm card too", out["pull-plain.json"].pending && out["pull-plain.json"].card, JSON.stringify(out["pull-plain.json"]));
    const imp = await p.evaluate(() => { pbmImport(); return Object.keys(gopRead().players).includes("111222333"); });
    ck("…and pressing Import stores the scouted opponent", imp, "");
    const snap = await p.evaluate(() => gopImportText(JSON.stringify({ type: "x" }), "junk.json").ok);
    ck("a non-pull, non-snapshot JSON in the opponent picker is still refused", snap === false, "");
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 3. per-kind caps ---------- */
  for (const w of [1280, 390]) await sec("3-" + w, async () => {
    const { ctx, p, errs } = await openX(b, { tag: "cap" + w, width: w });
    const r = await p.evaluate(() => {
      __seed(84, 3);
      const out = { lay: (l => [l.fmt, l.squads, l.fleets])(gopLayout("ollie")) };
      ["CAPITALEXECUTOR", "RAZORCREST", "HOUNDSTOOTH", "CAPITALPROFUNDITY"].forEach(s => { gopSquadAdd("ollie"); gopUnitAdd("ollie", gopSel("ollie").squads.length - 1, s); });
      out.after4 = gopSel("ollie").squads.map(q => q.length);
      out.fleets = gopSel("ollie").squads.filter(q => q.length && gopSquadKind(q, gopOppOf("ollie")) === "fleet").length;
      gopUi.pick.ollie = 1; renderGac();
      out.offered = [...document.querySelectorAll("#gopPickList-ollie .gop-urow")].map(x => x.textContent);
      gopSelWrite("ollie", { opp: "111222333", squads: [["SUPREMELEADERKYLOREN"], ["GLREY"], ["JABBATHEHUTT"], []] });
      gopUi.pick.ollie = 3; renderGac();
      out.offered2 = [...document.querySelectorAll("#gopPickList-ollie .gop-urow")].map(x => x.textContent);
      out.hint = document.querySelector('.gop-sq[data-gop-squad="3"] .gop-sq-head').textContent;
      gopUnitAdd("ollie", 3, "BENSOLO"); out.benRefused = gopSel("ollie").squads[3].length === 0;
      gopUnitAdd("ollie", 3, "CAPITALEXECUTOR"); out.fleetOk = gopSel("ollie").squads[3][0] === "CAPITALEXECUTOR";
      out.of = { doc: document.documentElement.scrollWidth, inner: innerWidth };
      return out;
    });
    ck(`[${w}] Carbonite 5v5 layout is 3 squads + 1 fleet`, r.lay.join() === "5v5,3,1", r.lay.join());
    ck(`[${w}] four ship leaders → only ONE fleet is created (was 4 fleets); the rest of the slots stay empty`, r.fleets === 1 && r.after4.filter(n => n).length === 1, JSON.stringify(r.after4));
    ck(`[${w}] with the fleet slot full, an empty slot's picker offers characters only`, r.offered.length > 0 && r.offered.every(t => !/ship/.test(t)), JSON.stringify(r.offered.slice(0, 3)));
    ck(`[${w}] with all 3 squad slots full, the empty slot offers ships only, refuses a character leader and takes a ship`, r.offered2.length > 0 && r.offered2.every(t => /ship/.test(t)) && r.benRefused && r.fleetOk && /squad slots full — fleet only/.test(r.hint), JSON.stringify([r.offered2.length, r.benRefused, r.fleetOk, r.hint]));
    ck(`[${w}] no horizontal overflow`, r.of.doc <= r.of.inner + 1, JSON.stringify(r.of));
    await p.evaluate(() => { gopSelWrite("ollie", { opp: "111222333", squads: [["SUPREMELEADERKYLOREN"], ["GLREY"], ["JABBATHEHUTT"], []] }); gopUi.pick.ollie = 3; renderGac(); document.querySelector('.gop-sq[data-gop-squad="3"]').scrollIntoView({ block: "start" }); });
    await p.waitForTimeout(150);
    await p.screenshot({ path: L.path.join(SHOTS, `rv25-cap-${w}.png`) });
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 4. history + arena dated at the pull ---------- */
  await sec("4", async () => {
    const { ctx, p, errs } = await openX(b, { tag: "hist" });
    const raw = { ollie: rawFrom(SNAP12.accounts.ollie, "229917529", 1500, [77, 33]), tiny: rawFrom(SNAP12.accounts.tiny, "295352286", 1650, [88, 44]) };
    const r = await p.evaluate(raw => {
      const at = Date.now() - 3 * 864e5;
      const evBefore = (historyFor("ollie").ev || []).length;
      pbmPullText(JSON.stringify({ type: "holotable-pull", v: 1, at, accounts: raw }), "old-pull.json");
      const n = pbmImport();
      const h = historyFor("ollie"), newEv = (h.ev || []).slice(evBefore);
      const log = (state.arena.log.ollie || []).filter(e => e.rank === 77 || e.rank === 33);
      return { n, at, atMin: Math.floor(at / 60000), newEv: newEv.length, evTs: [...new Set(newEv.map(e => e[0]))], log: log.map(e => [e.mode, e.rank, e.ts]), fetchedAt: state.pulls.ollie.fetchedAt };
    }, raw);
    ck("a 3-day-old pull file imports both accounts", r.n === 2 && r.fetchedAt === r.at, JSON.stringify([r.n, r.fetchedAt - r.at]));
    ck("its roster-history events are dated at the PULL minute, not at the Import press", r.newEv > 0 && r.evTs.length === 1 && r.evTs[0] === r.atMin, JSON.stringify([r.newEv, r.evTs, r.atMin]));
    ck("its arena-log entries (squad 77, fleet 33) are dated at the pull", r.log.length === 2 && r.log.every(e => e[2] === r.at), JSON.stringify(r.log));
    const r2 = await p.evaluate(raw => {
      state.arena.log.ollie.unshift({ mode: "squad", rank: 5, ts: Date.now(), src: "manual" });
      raw.ollie.data.arena.rank = 66;
      const at = Date.now() - 2 * 864e5;
      pbmPullText(JSON.stringify({ type: "holotable-pull", v: 1, at, accounts: { ollie: raw.ollie } }), "old2.json"); pbmImport();
      return { has66: state.arena.log.ollie.some(e => e.rank === 66), head: state.arena.log.ollie.filter(e => e.mode === "squad")[0].rank };
    }, raw);
    ck("an arena rank older than the newest logged entry is not inserted above it", !r2.has66 && r2.head === 5, JSON.stringify(r2));
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 5. parser robustness ---------- */
  await sec("5", async () => {
    const { ctx, p, errs } = await openX(b, { tag: "parse" });
    const r = await p.evaluate(() => {
      const out = {};
      const u = (id, extra) => ({ data: Object.assign({ base_id: id, name: id, rarity: 7, gear_level: 13, relic_tier: 5, combat_type: 1 }, extra || {}) });
      const j = { data: { ally_code: 229917529, galactic_power: 8e6, league_name: 5 }, units: [null, 7, u("A", { ability_data: [null, { name: "z", has_zeta_learned: true }] }), { data: { name: "no base id" } }, u("B")],
        mods: [null, { character: "A", set: 4, slot: 2, rarity: 6, tier: 5, level: 15, primary_stat: null, secondary_stats: [null, { name: "Speed", display_value: "12" }] }],
        datacrons: [null, { tier: 3, set_id: 36, tiers: [null, { ability_description: null, scope_target_name: "Speed", stat_value: 0.05 }] }] };
      try { const pp = parsePlayer(j); out.ok = true; out.ids = Object.keys(pp.reqs); out.problem = rpPullProblem(pp); out.zA = pp.reqs.A.z; out.mods = pp.mods.length; out.dc = pp.datacrons.length; out.gac = pp.gac; }
      catch (e) { out.ok = false; out.err = e.message; }
      pbmPending = null;
      pbmPullText(JSON.stringify({ type: "holotable-pull", v: 1, at: Date.now() - 1000, accounts: { ollie: { data: { ally_code: 229917529 } } } }), "nogp.json");
      out.nogp = pbmPending ? { items: pbmPending.items.length, bad: pbmPending.bad.map(x => x.why) } : null;
      pbmCancel();
      const c = gopCompactPlayer({ data: { ally_code: 123456789, name: "x", galactic_power: 1 }, units: [{ base_id: "constructor", rarity: 7, gear_level: 13, relic_tier: 3 }, { base_id: "VALUEOF", rarity: 7, gear_level: 13, relic_tier: 3 }, { base_id: "toString", rarity: 7, gear_level: 13, relic_tier: 3 }],
        mods: [{ character: "VALUEOF", rarity: 6, set: 4, slot: 2, secondary_stats: [{ name: "Speed", display_value: "10" }] }] }, 1);
      out.ctor = c && { ok: gopPlayerOk(c), m: c.units.constructor && c.units.constructor.m, mv: c.units.VALUEOF.m };
      return out;
    });
    ck("parsePlayer: null units/abilities/mod stats/datacron tiers and a numeric league_name no longer throw", r.ok === true && r.problem === "", JSON.stringify(r).slice(0, 300));
    ck("parsePlayer: a unit without base_id is dropped (no \"undefined\" key); the rest parse", r.ok && r.ids.join() === "A,B" && r.zA.join() === "z" && r.mods === 1 && r.dc === 1, JSON.stringify(r.ids));
    ck("pull file: a player answer with no galactic power is refused with a reason (it imported as a 0-GP roster)", r.nogp && r.nogp.items === 0 && r.nogp.bad.length === 1 && /no galactic power/.test(r.nogp.bad[0]), JSON.stringify(r.nogp));
    ck("gopCompactPlayer: a unit id like \"constructor\" no longer picks up Object's own property as its mods (player was rejected)", r.ctor && r.ctor.ok && r.ctor.m === undefined && JSON.stringify(r.ctor.mv) === "[1,10,1,0]", JSON.stringify(r.ctor));
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 6. storage full → opponent store shed, own data saved ---------- */
  for (const w of [1280, 390]) await sec("6-" + w, async () => {
    const { ctx, p, errs } = await openX(b, { tag: "quota" + w, width: w });
    const r = await p.evaluate(() => {
      __seed(84, 3);
      /* a big but valid opponent store: 7 players × 300 units */
      const players = {}, bp = [{ allyCode: 229917529, playerName: "me" }];
      for (let k = 0; k < 7; k++) { const code = String(400000001 + k); bp.push({ allyCode: +code, playerName: "P" + k }); const us = []; for (let u = 0; u < 300; u++) us.push(["UNIT_" + u, "A rather long unit name number " + u, u % 9, 200 + u % 90]); players[code] = __mk(code, "P" + k, us); }
      gopImportParsed(gopReceive({ ollie: { bracket: { data: [{ startTime: "2026-10-21T21:00:00", seasonNumber: 84, weekNumber: 3, bracketPlayers: bp }] }, players } }, Date.now(), null));
      const gopLen = (localStorage.getItem(GOP_KEY) || "").length;
      let i = 0;
      for (const sz of [262144, 65536, 16384, 4096, 1024, 256, 64, 16]) { try { for (;;) { localStorage.setItem("rv25junk" + i, "x".repeat(sz)); i++; } } catch (e) {} }
      state.notes = state.notes || {};
      const marker = "rv25-marker-" + "n".repeat(20000);
      state.rv25probe = marker; store.write(state);
      const saved = (localStorage.getItem("swgoh-tracker") || "").includes("rv25-marker-");
      const out = { gopLen, saved, fail: localWriteFail, gopGone: localStorage.getItem(GOP_KEY) === null, stillShown: Object.keys(gopRead().players).length };
      renderGac();
      const c = document.querySelector('#gacGrid .card[data-card="gop"]');
      out.warn = !!c && /storage on this device was full/.test(c.textContent);
      out.of = { doc: document.documentElement.scrollWidth, inner: innerWidth };
      window.__junkN = i;
      return out;
    });
    ck(`[${w}] storage full: the owner's change is still saved — the opponent store (${Math.round(r.gopLen / 1024)} KB) is dropped from storage instead (old build: change NOT persisted)`, r.saved && !r.fail && r.gopGone, JSON.stringify(r));
    ck(`[${w}] …the scouting data stays on screen this session and the Opponent card says it is gone after a reload`, r.stillShown > 0 && r.warn, JSON.stringify([r.stillShown, r.warn]));
    ck(`[${w}] no horizontal overflow with the storage warning`, r.of.doc <= r.of.inner + 1, JSON.stringify(r.of));
    await p.evaluate(() => { const c = document.querySelector('#gacGrid .card[data-card="gop"]'); c.scrollIntoView({ block: "start" }); });
    await p.waitForTimeout(150);
    await p.screenshot({ path: L.path.join(SHOTS, `rv25-quota-${w}.png`) });
    const r2 = await p.evaluate(() => { for (let j = 0; j <= window.__junkN; j++) localStorage.removeItem("rv25junk" + j); __seed(84, 3); renderGac(); const c = document.querySelector('#gacGrid .card[data-card="gop"]'); return { warn: /storage on this device was full/.test(c.textContent), stored: localStorage.getItem(GOP_KEY) !== null }; });
    ck(`[${w}] once there is room again, a new import is stored and the warning clears`, r2.stored && !r2.warn, JSON.stringify(r2));
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 7. format between seasons ---------- */
  await sec("7", async () => {
    const pin = Date.parse("2026-10-30T01:00:00Z");   /* Fri 30 Oct 12:00 AEDT — after S84E3 (21–28 Oct), before S85E1 (~4 Nov, 3v3) */
    const { ctx, p, errs } = await openX(b, { tag: "fmt", tz: "Australia/Sydney", pin });
    const r = await p.evaluate(() => {
      __seed(84, 3);
      const a = { gco: gcoFormat("ollie"), gop: gopFormat("ollie"), size: gopLayout("ollie").size, round: gopBracketRound(gopBracketFor("ollie")).text };
      renderGac(); a.title = document.querySelector('#gacGrid .card[data-card="gop"] .cardtitle').textContent;
      __seed(0, 0); a.noSeason = gopFormat("ollie");
      __seed(84, 3); gcfViewWrite("ollie", "3v3", []); a.pill = gopFormat("ollie"); gcfViewWrite("ollie", "", []);
      return a;
    });
    ck("30 Oct (between seasons): the schedule's next event is 3v3, but the scouted Season 84 bracket keeps 5v5 caps (5 units)", r.gco === "3v3" && r.gop === "5v5" && r.size === 5 && /5v5/.test(r.title), JSON.stringify(r));
    ck("…its round chip says previous round; a bracket with no season falls back to the schedule; an explicit 3v3 pill still wins", /previous round/.test(r.round) && r.noSeason === "3v3" && r.pill === "3v3", JSON.stringify(r));
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 8. focus on touch vs fine pointer ---------- */
  for (const mobile of [true, false]) await sec("8-" + mobile, async () => {
    const { ctx, p, errs } = await openX(b, { tag: "focus" + mobile, width: 390, height: 844, mobile });
    const r = await p.evaluate(() => { __seed(84, 3); gopSquadAdd("ollie"); const a = document.activeElement && document.activeElement.id; gopUnitAdd("ollie", 0, "SUPREMELEADERKYLOREN"); const b2 = document.activeElement && document.activeElement.id; return { a, b: b2, open: !!document.getElementById("gopQ-ollie") }; });
    if (mobile) ck("touch screen: opening the picker / adding a unit does not focus the search box (keyboard stays down)", r.open && r.a !== "gopQ-ollie" && r.b !== "gopQ-ollie", JSON.stringify(r));
    else ck("fine pointer: the search box is still focused after opening the picker and after adding a unit", r.open && r.a === "gopQ-ollie" && r.b === "gopQ-ollie", JSON.stringify(r));
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 9. snapshot player without zetas/omis; title attribute quoting ---------- */
  await sec("9", async () => {
    const { ctx, p, errs } = await openX(b, { tag: "misc" });
    const r = await p.evaluate(() => {
      __seed(84, 3);
      gopSelWrite("ollie", { opp: "111222333", squads: [["SUPREMELEADERKYLOREN"]] }); renderGac();
      const omi = document.querySelector(".gop-omi");
      const out = { title: omi && omi.getAttribute("title"), attrs: omi ? omi.getAttributeNames() : [] };
      const s = JSON.parse(gopSnapshotText()); const pl = s.players["111222333"]; delete pl.zetas; delete pl.omis; pl.lu = Date.now(); s.exportedAt = new Date().toISOString();
      gopClear(); out.imp = gopImportText(JSON.stringify(s), "snap.json").ok; renderGac();
      out.head = document.querySelector(".gop-h").textContent + " | " + [...document.querySelectorAll(".gop-h")].map(x => x.textContent).join(" | ");
      return out;
    });
    ck("an omicron name with quotes/markup stays inside the title attribute (no injected attributes)", r.title === 'Say "hi" <b>' && r.attrs.join() === "class,title", JSON.stringify(r));
    ck("a snapshot player without zetas/omis renders 0 zetas · 0 omis, not \"undefined\"", r.imp && /0 zetas · 0 omis/.test(r.head) && !/undefined/.test(r.head), r.head.slice(0, 300));
    allErrs.push(...errs); await ctx.close();
  });

  /* ---------- 10. 1 Nov data re-check (rv31; pinned to Sun 1 Nov 2026 12:00 AEDT — was the real clock at 25 Oct) ---------- */
  await sec("10", async () => {
    const { ctx, p, errs } = await openX(b, { tag: "data", tz: "Australia/Sydney", pin: Date.parse("2026-11-01T01:00:00Z") });
    const r = await p.evaluate(() => {
      const by = n => EVENTS_SEED.find(e => e.name === n) || null, snap = k => (SNAP_BY_KEY[k] || {}).asOf;
      switchAcct("ollie"); switchTab("events"); state.views.events = "all"; renderEvents();
      return { ver: EVENTS_SEED_VERSION, cap: EVENTS_SEED_CAPTURED, n: EVENTS_SEED.length, sorted: EVENTS_SEED.every((e, i) => !i || e.date >= EVENTS_SEED[i - 1].date),
        smug: by("Smuggler's Run"), pop: by("Places of Power"), pop2: by("Places of Power (second run)"), sd: by("Stardust Transmission"), sdEst: by("Stardust Transmission (est.)"), dc33t: (DATACRON_SETS.find(d => d.n === 33) || {}).time, stateVer: state.eventsSeedVersion,
        dr: [DROID_RAID.asOf, DROID_RAID.recheck, DROID_RAID.recheckNote], era: [ERA_NOW.asOf, ERA_NOW.src, ERA_NOW.start, ERA_NOW.end, ERA_NOW.elCap], mgl: MGL_ASOF, watch: GL_QUEUE.watch.MANDOGROGU.asOf,
        sched: GAC_SCHEDULE.asOf, s85: GAC_SCHEDULE.events.filter(e => e.season === 85).map(e => [e.start, e.format, !!e.est]),
        reg: { n: SNAPSHOTS.length, fmt: snap("gac-format"), drr: snap("droid-raid"), ev: snap("events"), fleet: snap("meta-fleets"), dc: snap("datacrons"), tl: snap("tierlist"), sch: snap("gac-schedule") },
        dc33: (DATACRON_SETS.find(d => d.n === 33) || {}).expires, up: upcomingEvents(40).map(e => e.name), fmtNow: gacFormatNow(),
        evTxt: (document.getElementById("eventsGrid") || document.body).textContent };
    });
    ck("EVENTS_SEED v14: 43 rows in date order; CAPTURED 10 Nov (rv40: swgoh.gg/schedule/ capture diff); saved state reseeded to 14", r.ver === 14 && r.n === 43 && r.sorted && r.cap === "10 Nov 2026" && r.stateVer === 14, JSON.stringify([r.ver, r.n, r.cap, r.stateVer]));
    ck("Smuggler's Run (26 Oct) is gone — the only row of that name is the 10 Nov read's NEW run (9 Nov 22:00 → 10 Nov 22:00); the 31 Oct Places of Power is gone, and (rv40) so is its second run (ended 5 Nov, before the 10 Nov read)", r.smug && r.smug.date === "2026-11-09" && r.smug.ends === "2026-11-10" && /read 10 Nov/.test(r.smug.note) && !r.pop && !r.pop2, JSON.stringify([r.smug, r.pop, r.pop2]).slice(0, 300));
    ck("Stardust Transmission (31 Oct -> 1 Nov 18:00 AEDT) is no longer a seed row (rv34: over at 4 Nov), and no '(est.)' row came back", !r.sd && !r.sdEst, JSON.stringify([r.sd, r.sdEst]));
    ck("at the pinned date (1 Nov) the next-up list has Champion of the Pit, GAC Season 85 (3v3) and the B1 marquee — rv40: no Territory War row at all (the 4 Nov attack phase was dropped; none is listed 9–28 Nov), and the Events tab shows the 10 Nov Territory Battle; no Bespin; the only Smuggler's Run is the 9 Nov one", r.up.includes("Champion of the Pit (Rotta the Hutt shards)") && r.up.includes("GAC Season 85 (3v3)") && r.up.includes("Mercenary Guard Droid (B1)") && !r.up.some(n => /Territory War/.test(n)) && !r.up.includes("Bespin") && (!r.up.includes("Smuggler's Run") || (r.smug && r.smug.date === "2026-11-09")) && /Territory Battle — Rise of the Empire/.test(r.evTxt), JSON.stringify(r.up.slice(0, 12)));
    ck("DROID_RAID re-checked 10 Nov (rv40): asOf 2026-11-10, recheck 17 Nov, note says page byte-identical / the mechanics headline is the only newer raid post seen / November 2026", r.dr[0] === "2026-11-10" && r.dr[1] === "2026-11-17" && /last re-checked 10 Nov 2026/.test(r.dr[2]) && /byte-identical/.test(r.dr[2]) && /only newer raid post seen/.test(r.dr[2]) && /November 2026/.test(r.dr[2]), JSON.stringify(r.dr));
    ck("ERA_NOW re-read 25 Oct (and again 1 Nov, rv31): same 20 Oct → 17 Nov, EL cap 75; asOf 2026-11-01, source line says re-read 25 Oct and 1 Nov", r.era[0] === "2026-11-01" && /re-read 25 Oct and 1 Nov 2026/.test(r.era[1]) && r.era[2] === "2026-10-20" && r.era[3] === "2026-11-17" && r.era[4] === 75, JSON.stringify(r.era).slice(0, 200));
    ck("M&G GL watch re-checked 25 Oct (MGL_ASOF = watch asOf = 2026-10-25); nothing else about it changed", r.mgl === "2026-10-25" && r.watch === "2026-10-25", JSON.stringify([r.mgl, r.watch]));
    ck("GAC: between seasons at 1 Nov the plan format is 3v3 (next event, Season 85); gac-format NOT re-read (25 Oct); GAC_SCHEDULE re-read 1, 4 and 10 Nov (rv40: asOf 10 Nov; S85 start sourced, 4 Nov 3v3 not est.; 11 Nov sourced (Week 2); 18 Nov still est.)", r.fmtNow === "3v3" && r.reg.fmt === "2026-10-25" && r.sched === "2026-11-10" && r.reg.sch === "2026-11-10" && JSON.stringify(r.s85) === JSON.stringify([["2026-11-04", "3v3", false], ["2026-11-11", "3v3", false], ["2026-11-18", "3v3", true]]), JSON.stringify([r.fmtNow, r.reg, r.s85]));
    ck("registry: still 24 entries; meta-fleets / tierlist = 1 Nov (rv31 live reads); droid-raid / events / datacrons / gac-schedule = 10 Nov (rv40 capture); gac-format stays 25 Oct", r.reg.n === 24 && r.reg.drr === "2026-11-10" && r.reg.ev === "2026-11-10" && r.reg.fleet === "2026-11-01" && r.reg.dc === "2026-11-10" && r.reg.tl === "2026-11-01" && r.reg.sch === "2026-11-10" && r.reg.fmt === "2026-10-25", JSON.stringify(r.reg));
    ck("Datacron Set 33 expiry unchanged (29 Oct), re-read live on 25 Oct with its clock time (18:00 AEDT)", r.dc33 === "2026-10-29" && r.dc33t === "18:00", String(r.dc33) + " " + r.dc33t);
    allErrs.push(...errs); await ctx.close();
  });

  ck("zero page errors across rv25-check", allErrs.length === 0, JSON.stringify(allErrs.slice(0, 5)));
  await L.finish(b, srv);
})().catch(e => { console.error(e); process.exit(2); });
