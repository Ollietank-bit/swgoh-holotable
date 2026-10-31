/* rv25c-check — the 1 Nov 2026 GL-order re-derivation for Ollietank (agent team on the 31 Oct roster: ref31/team/*.md) and the
   "owned Legend is not being unlocked" fix. New behaviour only:
     1. Pure data: GL_QUEUE.asOf + Ollie's asOf = 2026-11-01, Tiny keeps 2026-10-03; basis names the 31 Oct roster agent-team analysis; SNAPSHOTS is
        exactly 24 entries, gl-queue = 2026-11-01 (re-derived), gl-roadmap / nxt-queue / coach-tips NOT bumped; Ollie's order is
        Leia (finishing, same doneWhen) → JML (next) → SEE / JMK (checkpoint) → M&G watch → Lord Vader / GL Ahsoka / Hondo; the JMK reason (and the
        roadmap note) no longer say "guild-gated" and say Wat Tambor is 7★; Tiny's order + statuses + doneWhen are unchanged; prep ids, tick-key format.
     2. Ollie on a 31 Oct roster (built from tests/rv25c-ollie-roster-31oct.txt over the 7 Oct pull): Leia "Unlocked — finishing" R6 → R7, build-up 2/3;
        JML Next, 7/14 met, ≈22 relic tiers, the 5-G13 note + the verify-on-swgoh.gg flag; SEE / JMK checkpoint labels + trigger; Key-stats tile
        "GL Leia Organa build-up · R6 → R7"; quickstat, Overview card, GL Roadmap subtitle, Farm plan "Finish" phase + GL-order line.
     3. Ollie at Leia R7: she drops to ✓ Built, JML becomes Build now, SEE keeps its checkpoint label as Next; tile "R7 ✓".
     4. Tiny unaffected: 7 Oct fixture (G12 R0) and an R10 pull — same order and effective statuses as before, Leia ✓ Built at R10, tile "R10 ✓".
     5. No-roster case (built-in BASELINE): Ollie's Leia is not owned there → readiness % tile + an honest "roster doesn't show it unlocked" hint; Tiny's
        baseline Leia (G9) → "G9 → R7".
     6. escapeHtml on the dynamic strings (a hostile GL name / why / prep text renders as text); no new localStorage key; zero page errors; no overflow;
        390 / 1280 screenshots of the GL order card and Key stats in ../shots/.
   Run: NODE_PATH=... FILE=DIR/index.html PORT=9xxx node tests/rv25c-check.js */
const L = require("./lib.js");
const { ck } = L;
const AEDT = (mo, d, h, m) => Date.UTC(2026, mo - 1, d, h - 11, m || 0);
const NOW = AEDT(11, 1, 12);   // Sun 1 Nov 2026 12:00 AEDT
const SHOTS = L.path.join(L.ROOT, "shots");
try { L.fs.mkdirSync(SHOTS, { recursive: true }); } catch (e) {}

/* The 31 Oct roster (swgoh.gg API via Chrome, chars only): ID:stars.gear[rN][*] → reqs, over the 7 Oct pull (names, zetas, ships kept). */
function pulls31() {
  const txt = L.fs.readFileSync(L.path.join(__dirname, "rv25c-ollie-roster-31oct.txt"), "utf8").split("\n")[1];
  const acc = JSON.parse(L.PULLS);
  const o = acc.ollie, NEW = { GLLEIA: "Leia Organa", ADELPHIRANGER: "Adelphi Ranger" };
  for (const it of txt.split(",")) {
    const [id, v] = it.split(":"); const m = /^(\d+)\.(\d+)(?:r(\d+))?\*?$/.exec(v || "");
    if (!m) throw new Error("bad roster item " + it);
    const prev = o.reqs[id] || { name: NEW[id] || id, t: "char", z: [], o: [], el: 0 };
    o.reqs[id] = Object.assign({}, prev, { s: +m[1], g: +m[2], r: +(m[3] || 0) });
  }
  o.glCount = 4; o.glNote = "Leia Organa R6 · Rey R8 · Jabba the Hutt R9";
  return acc;
}
async function openAt(b, o) {
  o = o || {};
  const ctx = await b.newContext({ viewport: { width: o.width || 1280, height: o.height || 1000 }, timezoneId: "Australia/Sydney", locale: "en-AU" });
  await ctx.clock.setFixedTime(o.at || NOW);
  await ctx.addInitScript(([s, pl, withPulls, seedKey]) => {
    try { if (!sessionStorage.getItem(seedKey)) { localStorage.clear(); localStorage.setItem("swgoh-tracker", s); if (withPulls) localStorage.setItem("swgoh-holotable-pulls-v1", pl); sessionStorage.setItem(seedKey, "1"); } } catch (e) {}
  }, [o.state || L.REAL, JSON.stringify(o.pulls || pulls31()), o.noPulls ? false : true, "seeded-" + (o.tag || "x")]);
  await ctx.route(/fonts\.g|swgoh\.gg|swgohrote\.com|corsproxy|allorigins|codetabs|api\.github/, r => r.abort());
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push(String(e).slice(0, 300)));
  p.on("console", m => { if (m.type() === "error" && !/Failed to load resource|net::ERR|fonts\.g/.test(m.text())) errs.push("console: " + m.text().slice(0, 200)); });
  await p.goto(`http://127.0.0.1:${L.PORT}/x.html`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(900);
  return { ctx, p, errs };
}
/* Everything visible about the GL order card + Key stats + the other owned-Legend surfaces, for one account. */
const readAll = (p, acct) => p.evaluate(a => {
  switchAcct(a); switchTab("leia");
  const card = document.querySelector('#glTables [data-card="glq"]');
  const rows = [...card.querySelectorAll(".glq-row")].map(r => ({ id: r.dataset.glq, chip: r.querySelector(".chip").textContent.trim(), ready: r.querySelector(".glq-ready").textContent.trim(),
    why: r.querySelector(".glq-why").textContent.replace(/\s+/g, " ").trim(), cur: r.classList.contains("glq-current") }));
  const mnote = card.querySelector(".mnote").textContent.replace(/\s+/g, " ").trim(), src = card.querySelector(".srcline").textContent.replace(/\s+/g, " ").trim();
  const prep = [...card.querySelectorAll(".glq-prep [data-tick], .glq-prep input, .glq-prep .glq-rule")].map(e => e.getAttribute("data-tick") || e.id || e.textContent.trim().slice(0, 60));
  const glSub = document.getElementById("glSub").textContent;
  switchTab("overview");
  const ks = [...document.querySelectorAll('#ovGrid [data-card="keystats"] .lay-stat')].map(el => ({ l: el.querySelector(".lbl").textContent.trim(), v: el.querySelector(".val").textContent.trim(), n: el.querySelector(".note").textContent.trim() }));
  const qs = [...document.querySelectorAll("#quickstats .qstat")].map(el => el.querySelector(".qlbl").textContent.trim() + " " + el.querySelector(".qval").textContent.trim());
  const rd = (document.querySelector('#ovGrid [data-card="readiness"]') || {}).textContent || "";
  const daily = ((document.querySelector('#ovGrid [data-card="daily"]') || {}).textContent || "").replace(/\s+/g, " ");
  switchTab("farm");
  const farm = (document.getElementById("farm") || document.body).innerText;
  const fl = (document.querySelector(".glq-farmline") || {}).textContent || "";
  return { rows, mnote, src, prep, glSub, ks, daily, gl: ks.find(x => /Leia/.test(x.l)), qs, rd: rd.replace(/\s+/g, " ").trim(), farm, fl: fl.replace(/\s+/g, " ").trim(), html: card.innerHTML };
}, acct);

(async () => {
  const srv = await L.serve(); const b = await L.chromium.launch({ headless: true });
  const allErrs = [];

  /* ---------- 1. pure data ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "pure" });
    const c = await p.evaluate(() => {
      const reg = Object.fromEntries(SNAPSHOTS.map(s => [s.key, s.asOf]));
      const q = a => GL_QUEUE[a].queue.map(e => [e.glId || e.watchId, e.status, e.label || ""]);
      const by = (a, id) => GL_QUEUE[a].queue.find(e => e.glId === id) || {};
      return { asOf: GL_QUEUE.asOf, oAs: GL_QUEUE.ollie.asOf, tAs: GL_QUEUE.tiny.asOf, basis: GL_QUEUE.basis, n: SNAPSHOTS.length, keys: new Set(SNAPSHOTS.map(s => s.key)).size, reg,
        oq: q("ollie"), tq: q("tiny"), oLeia: by("ollie", "GLLEIA"), tLeia: by("tiny", "GLLEIA"), jml: by("ollie", "GRANDMASTERLUKE"), see: by("ollie", "SITHPALPATINE"),
        jmk: by("ollie", "JEDIMASTERKENOBI"), tjmk: by("tiny", "JEDIMASTERKENOBI"), watchTrig: GL_QUEUE.ollie.queue.find(e => e.watchId).trigger,
        lv: by("ollie", "LORDVADER").why, ah: by("ollie", "GLAHSOKATANO").why, ho: by("ollie", "GLHONDO").why,
        road: GL_ROADMAP.JEDIMASTERKENOBI.note, gated: GL_ROADMAP.JEDIMASTERKENOBI.gated, prep: GL_QUEUE.ollie.prep.map(it => [it.id, !!it.rule]), tprep: GL_QUEUE.tiny.prep.map(it => it.id),
        key: glqPrepKey("ollie", { id: "jml-gear" }), tkey: glqPrepKey("tiny", { id: "luke-gear" }), fin: GLQ_STATUS.finishing };
    });
    ck("asOf: GL_QUEUE 2026-11-01 (Ollie re-derived), Ollie 2026-11-01, Tiny keeps 2026-10-03; basis = agent-team analysis of the 31 Oct 2026 roster (Ollie) + Tiny's 3 Oct basis kept", c.asOf === "2026-11-01" && c.oAs === "2026-11-01" && c.tAs === "2026-10-03" && /agent-team analysis of the 31 Oct 2026 roster/.test(c.basis) && /Tiny: .*1 Oct 2026 roster pull.*not re-ranked/.test(c.basis), c.basis);
    ck("SNAPSHOTS: exactly 24 unique entries; gl-queue 2026-11-01; NOT bumped: gl-roadmap 2026-08-08, nxt-queue 2026-10-04, coach-tips 2026-09-27", c.n === 24 && c.keys === 24 && c.reg["gl-queue"] === "2026-11-01" && c.reg["gl-roadmap"] === "2026-08-08" && c.reg["nxt-queue"] === "2026-10-04" && c.reg["coach-tips"] === "2026-09-27", JSON.stringify([c.n, c.reg["gl-queue"], c.reg["gl-roadmap"], c.reg["nxt-queue"], c.reg["coach-tips"]]));
    ck("Ollie order: Leia (finishing) → JML (next) → SEE (then, checkpoint) → JMK (then, checkpoint) → M&G watch → Lord Vader → GL Ahsoka → Hondo",
      JSON.stringify(c.oq) === JSON.stringify([["GLLEIA", "finishing", ""], ["GRANDMASTERLUKE", "next", ""], ["SITHPALPATINE", "then", "Then — decide at checkpoint"], ["JEDIMASTERKENOBI", "then", "Or — decide at checkpoint"], ["MANDOGROGU", "watch", ""], ["LORDVADER", "later", ""], ["GLAHSOKATANO", "later", ""], ["GLHONDO", "later", ""]]), JSON.stringify(c.oq));
    ck("Ollie Leia: doneWhen unchanged (Leia R7, Drogan R7, R2-D2 R8); why says UNLOCKED G13 R6 on 31 Oct; trigger = R7 then JML; 'finishing' label exists", JSON.stringify(c.oLeia.doneWhen) === JSON.stringify([{ id: "GLLEIA", type: "relic", min: 7 }, { id: "CAPTAINDROGAN", type: "relic", min: 7 }, { id: "R2D2_LEGENDARY", type: "relic", min: 8 }]) && /UNLOCKED — 7★ G13 R6 on the 31 Oct/.test(c.oLeia.why) && /Leia R7/.test(c.oLeia.trigger) && /Drogan R7 and R2-D2 R8/.test(c.oLeia.trigger) && /Jedi Master Luke/.test(c.oLeia.trigger) && c.fin[1] === "Unlocked — finishing", c.oLeia.trigger);
    ck("JML why/trigger/flag (from the review): 22 relic tiers, 7 of 14, 5 units to G13; order of work Chewbacca R5 → R6 + Hermit Yoda R3 → R5, Mon Mothma, Old Ben + Princess Leia G9 → G13, Wedge + Biggs G8 → G13; verify on swgoh.gg before Wedge/Biggs",
      /22 relic tiers/.test(c.jml.why) && /7 of 14/.test(c.jml.why) && /5 units still have to reach G13/.test(c.jml.why) && /Chewbacca R5 → R6 and Hermit Yoda R3 → R5 first/.test(c.jml.trigger) && /Mon Mothma G12 → G13 → R5/.test(c.jml.trigger) && /Old Ben and Princess Leia G9 → G13, Wedge and Biggs G8 → G13/.test(c.jml.trigger) && /Verify .*swgoh\.gg BEFORE gearing Wedge and Biggs/.test(c.jml.flag) && /thinner/.test(c.jml.flag), c.jml.trigger.slice(0, 160));
    ck("SEE / JMK checkpoint: Proving Grounds 8–10 Nov (Darth Bane) + Season 85 3v3 board ~11–12 Nov; SEE nextLabel keeps the checkpoint", /Proving Grounds, 8–10 Nov/.test(c.see.trigger) && /~11–12 Nov/.test(c.see.trigger) && /Darth Bane/.test(c.see.trigger) && /Proving Grounds, 8–10 Nov/.test(c.jmk.trigger) && c.see.nextLabel === "Next — decide at checkpoint", c.see.trigger.slice(0, 120));
    ck("JMK reason: no 'guild-gated', says Wat Tambor is already 7★ (G5 on 31 Oct), only gear + relics left; Tiny's JMK reason fixed the same way (G6, order unchanged)", !/guild-gated/i.test(c.jmk.why) && /Wat Tambor is already 7★ \(G5 on 31 Oct\)/.test(c.jmk.why) && /gear \(G5 → G13\) and relics \(to R7\)/.test(c.jmk.why) && !/guild-gated/i.test(c.tjmk.why) && /already 7★/.test(c.tjmk.why) && c.tjmk.status === "later", c.jmk.why.slice(0, 120) + " || " + c.tjmk.why.slice(0, 80));
    ck("GL_ROADMAP JMK note: no 'guild-gated' / 'cannot solo-farm'; the shard gate only matters below 7★; `gated` kept (the farm plan only flags it below 7★)", !/guild-gated|cannot solo-farm/i.test(c.road) && /a gate on reaching 7★, not on his R7/.test(c.road) && JSON.stringify(c.gated) === '["WATTAMBOR"]', c.road);
    ck("later rows re-derived on the 31 Oct roster: Lord Vader ~86 / GL Ahsoka ~100 / Hondo ~84 relic tiers; M&G watch: nothing held for it, cheap shard windows only", /86 relic tiers on the 31 Oct roster/.test(c.lv) && /100 relic tiers on the 31 Oct roster/.test(c.ah) && /84 relic tiers on the 31 Oct roster/.test(c.ho) && /no relic materials, no Era Tokens/.test(c.watchTrig) && /Champion of the Pit \(Rotta\) 3–14 Nov/.test(c.watchTrig), c.watchTrig.slice(0, 120));
    ck("Tiny unaffected (data): order + statuses + Leia doneWhen exactly as before", JSON.stringify(c.tq) === JSON.stringify([["GLLEIA", "building", ""], ["GRANDMASTERLUKE", "next", ""], ["SITHPALPATINE", "then", "Then — reconsider"], ["MANDOGROGU", "watch", ""], ["JABBATHEHUTT", "later", ""], ["LORDVADER", "later", ""], ["GLAHSOKATANO", "later", ""], ["GLHONDO", "later", ""], ["JEDIMASTERKENOBI", "later", ""]]) && JSON.stringify(c.tLeia.doneWhen) === JSON.stringify(c.oLeia.doneWhen) && JSON.stringify(c.tprep) === JSON.stringify(["luke-gear", "raddus-jyn-g13", "groguants-7", "thrawn-rule"]), JSON.stringify(c.tq));
    ck("prep ids: Ollie adds jml-gear (tick) + jml-verify (rule), none renamed; tick key format `${acct}-p:glq:${id}` unchanged", JSON.stringify(c.prep) === JSON.stringify([["lobot-g13", false], ["jml-gear", false], ["jml-verify", true], ["maul-g13", false], ["groguants-7", false], ["scion-unlock", false], ["skip-peridea", true]]) && c.key === "ollie-p:glq:jml-gear" && c.tkey === "tiny-p:glq:luke-gear", JSON.stringify(c.prep));
    allErrs.push(...errs); await ctx.close();
  }

  /* ---------- 2. Ollie on the 31 Oct roster (Leia G13 R6) ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "o31" });
    const lsBefore = await p.evaluate(() => Object.keys(localStorage).sort());
    const d = await readAll(p, "ollie");
    const live = await p.evaluate(() => { const rr = glqRows("ollie"); const g = id => rr.find(r => r.e.glId === id);
      return { leia: [g("GLLEIA").eff, g("GLLEIA").v.owned, g("GLLEIA").own && g("GLLEIA").own.val, g("GLLEIA").build.doneCount], jml: [g("GRANDMASTERLUKE").eff, g("GRANDMASTERLUKE").v.doneCount, g("GRANDMASTERLUKE").v.reqRows.length, g("GRANDMASTERLUKE").tiers],
        see: [g("SITHPALPATINE").eff, g("SITHPALPATINE").tiers], jmk: [g("JEDIMASTERKENOBI").eff, g("JEDIMASTERKENOBI").tiers] }; });
    const R = id => d.rows.find(r => r.id === id) || {};
    ck("glqRows (31 Oct): Leia building + owned, R6 → R7, build-up 2/3; JML next, 7/14 met, 22 relic tiers; SEE then (50); JMK then (63)", JSON.stringify(live.leia) === JSON.stringify(["building", true, "R6 → R7", 2]) && JSON.stringify(live.jml) === JSON.stringify(["next", 7, 14, 22]) && JSON.stringify(live.see) === JSON.stringify(["then", 50]) && JSON.stringify(live.jmk) === JSON.stringify(["then", 63]), JSON.stringify(live));
    ck("card row 1: GL Leia Organa chip 'Unlocked — finishing', ready 'unlocked ✓ · R6 → R7 (1 relic tier to go) · build-up 2/3', current + open", R("GLLEIA").chip.endsWith("Unlocked — finishing") && R("GLLEIA").ready === "unlocked ✓ · R6 → R7 (1 relic tier to go) · build-up 2/3" && R("GLLEIA").cur && d.rows[0].id === "GLLEIA", JSON.stringify(R("GLLEIA")).slice(0, 200));
    ck("card row 2: Jedi Master Luke 'Next', '7/14 met · …% · ≈22 relic tiers left', why carries the 5-G13 note and the ⚠ verify-on-swgoh.gg flag", /Next$/.test(R("GRANDMASTERLUKE").chip) && /^7\/14 met · \d+% · ≈22 relic tiers left$/.test(R("GRANDMASTERLUKE").ready) && /5 units still have to reach G13/.test(R("GRANDMASTERLUKE").why) && /⚠ Unverified: Verify Jedi Master Luke's requirement list on swgoh\.gg BEFORE gearing Wedge and Biggs/.test(R("GRANDMASTERLUKE").why) && d.rows[1].id === "GRANDMASTERLUKE", R("GRANDMASTERLUKE").chip + " | " + R("GRANDMASTERLUKE").ready);
    ck("card rows 3–4: SEE 'Then — decide at checkpoint', JMK 'Or — decide at checkpoint'; JMK why has no 'guild-gated'", /Then — decide at checkpoint$/.test(R("SITHPALPATINE").chip) && /Or — decide at checkpoint$/.test(R("JEDIMASTERKENOBI").chip) && !/guild-gated/i.test(R("JEDIMASTERKENOBI").why) && d.rows[2].id === "SITHPALPATINE" && d.rows[3].id === "JEDIMASTERKENOBI", R("SITHPALPATINE").chip + " | " + R("JEDIMASTERKENOBI").chip);
    ck("card header: 'Now: GL Leia Organa · next: Jedi Master Luke Skywalker', snapshot dated 1 Nov 2026; source line has the gl-queue chip + the 31 Oct basis", /Now: GL Leia Organa · next: Jedi Master Luke Skywalker\./.test(d.mnote) && /expert snapshot \((1 Nov 2026|Nov 1, 2026)\)/.test(d.mnote) && /31 Oct 2026 roster/.test(d.src), d.mnote.slice(0, 200));
    ck("Key stats tile: 'GL Leia Organa build-up' · 'R6 → R7' · 'unlocked ✓ · 1 relic tier to go to the R7 build-up target' (no 'readiness', no '%')", d.gl && d.gl.l === "GL Leia Organa build-up" && d.gl.v === "R6 → R7" && d.gl.n === "unlocked ✓ · 1 relic tier to go to the R7 build-up target" && !d.ks.some(x => /readiness/i.test(x.l)), JSON.stringify(d.gl));
    ck("quickstat 'GL Leia Organa R6 → R7'; Overview card 'unlocked' + 'R6 → R7: 1 relic tier to go'; GL Roadmap subtitle the same (no 'Already unlocked')", d.qs.some(q => q === "GL Leia Organa R6 → R7") && /✓ unlocked/.test(d.rd) && /Unlocked ✓ — R6 → R7: 1 relic tier to go to the build-up target\./.test(d.rd) && d.glSub === "Unlocked ✓ — R6 → R7: 1 relic tier to go to the build-up target." && !/Already unlocked/.test(d.rd), d.rd.slice(0, 200) + " || " + d.glSub);
    ck("Farm plan: 'Finish GL Leia Organa' phase (R7, the GL order's target — no 'match your other Legends' R9 yardstick) and the GL-order line names Jedi Master Luke Skywalker (1 Nov)", /Finish GL Leia Organa/.test(d.farm) && /the GL order's build-up target \(R7\)/.test(d.farm) && !/match your other Legends/.test(d.farm) && /next Legend to build is Jedi Master Luke Skywalker/.test(d.fl) && /(1 Nov 2026|Nov 1, 2026)/.test(d.fl), d.fl);
    ck("Daily routine (owned Leia): energy goes to 'Jedi Master Luke Skywalker farms (next in the GL order)'; Leia's line says relic tiers (R6 → R7), not energy", /Spend all energy \+ 1–2 refreshes on Jedi Master Luke Skywalker farms \(next in the GL order\)/.test(d.daily) && /GL Leia Organa is unlocked — what's left is relic tiers \(R6 → R7\), not energy/.test(d.daily), d.daily.slice(0, 300));
    /* tick the new prep item by hand: the derived key is written to state.ticks, nothing else changes in storage */
    const tk = await p.evaluate(() => { switchTab("leia"); const k = glqPrepKey("ollie", { id: "jml-gear" }); const el = document.querySelector(`#glTables [data-card="glq"] input[data-k="${k}"]`);
      if (el) el.click();
      return { k, found: !!el, v: !!state.ticks[k], keys: Object.keys(localStorage).sort(), saved: JSON.parse(localStorage.getItem("swgoh-tracker")).ticks[k] }; });
    ck("hand tick on jml-gear lands under 'ollie-p:glq:jml-gear'; localStorage keys unchanged (no new key)", tk.v && tk.saved && tk.k === "ollie-p:glq:jml-gear" && JSON.stringify(tk.keys) === JSON.stringify(lsBefore), JSON.stringify([tk, lsBefore]));
    allErrs.push(...errs); await ctx.close();
  }

  /* ---------- 3. Ollie at Leia R7 ---------- */
  {
    const pl = pulls31(); pl.ollie.reqs.GLLEIA.r = 7;
    const { ctx, p, errs } = await openAt(b, { tag: "o31r7", pulls: pl });
    const d = await readAll(p, "ollie");
    const R = id => d.rows.find(r => r.id === id) || {};
    ck("Leia R7: Leia '✓ Built', JML 'Build now' (current), SEE 'Next — decide at checkpoint', JMK keeps 'Or — decide at checkpoint'; tile 'R7 ✓ · at the R7 build-up target'", /Built$/.test(R("GLLEIA").chip) && /Build now$/.test(R("GRANDMASTERLUKE").chip) && R("GRANDMASTERLUKE").cur && /Next — decide at checkpoint$/.test(R("SITHPALPATINE").chip) && /Or — decide at checkpoint$/.test(R("JEDIMASTERKENOBI").chip) && d.gl.v === "R7 ✓" && /at the R7 build-up target/.test(d.gl.n) && R("GLLEIA").ready === "unlocked ✓ · R7 · build-up 3/3", JSON.stringify(d.rows.slice(0, 4).map(r => r.chip)) + JSON.stringify(d.gl));
    ck("Leia R7: Farm plan has no 'Finish' / 'Keep building' phase for her (the GL order holds her at R7)", !/Finish GL Leia Organa|Keep building GL Leia Organa/.test(d.farm), "");
    allErrs.push(...errs); await ctx.close();
  }

  /* ---------- 4. Tiny unaffected (7 Oct fixture G12 R0, and an R10 pull) ---------- */
  {
    const fx = JSON.parse(L.PULLS);
    const { ctx, p, errs } = await openAt(b, { tag: "t07", pulls: fx });
    const d = await readAll(p, "tiny");
    const eff = await p.evaluate(() => glqRows("tiny").map(r => [r.e.glId || r.e.watchId, r.eff]));
    ck("Tiny (7 Oct fixture): effective order unchanged — Leia building, JML next, SEE then, watch, then later ×5; Leia chip still 'Building up' (status building, not finishing)", JSON.stringify(eff) === JSON.stringify([["GLLEIA", "building"], ["GRANDMASTERLUKE", "next"], ["SITHPALPATINE", "then"], ["MANDOGROGU", "watch"], ["JABBATHEHUTT", "later"], ["LORDVADER", "later"], ["GLAHSOKATANO", "later"], ["GLHONDO", "later"], ["JEDIMASTERKENOBI", "later"]]) && /Building up$/.test(d.rows[0].chip) && /expert snapshot \((3 Oct 2026|Oct 3, 2026)\)/.test(d.mnote), JSON.stringify(eff) + " " + d.rows[0].chip);
    ck("Tiny (7 Oct fixture, Leia G12 R0): tile 'G12 → R7' · 'unlocked ✓ · G13, then 7 relic tiers to the R7 build-up target'; ready text shows the same step", d.gl && d.gl.l === "GL Leia Organa build-up" && d.gl.v === "G12 → R7" && d.gl.n === "unlocked ✓ · G13, then 7 relic tiers to the R7 build-up target" && d.rows[0].ready === "unlocked ✓ · G12 → R7 (G13, then 7 relic tiers) · build-up 2/3", JSON.stringify(d.gl) + " | " + d.rows[0].ready);
    allErrs.push(...errs); await ctx.close();
    const t10 = JSON.parse(L.PULLS); t10.tiny.reqs.GLLEIA = Object.assign({}, t10.tiny.reqs.GLLEIA, { g: 13, r: 10 });
    const o2 = await openAt(b, { tag: "t10", pulls: t10 });
    const d2 = await readAll(o2.p, "tiny");
    const eff2 = await o2.p.evaluate(() => glqRows("tiny").map(r => [r.e.glId || r.e.watchId, r.eff]));
    ck("Tiny at R10 (her 30 Oct live state): Leia ✓ Built 'unlocked ✓ · R10 · build-up 3/3', JML Build now, SEE Next, JMK reason without 'guild-gated'; tile 'R10 ✓ · past the R7 build-up target'", eff2[0][1] === "done" && eff2[1][1] === "building" && eff2[2][1] === "next" && /Built$/.test(d2.rows[0].chip) && d2.rows[0].ready === "unlocked ✓ · R10 · build-up 3/3" && /Next$/.test(d2.rows[2].chip) && !/guild-gated/i.test(d2.rows.find(r => r.id === "JEDIMASTERKENOBI").why) && d2.gl.v === "R10 ✓" && d2.gl.n === "unlocked ✓ · past the R7 build-up target", JSON.stringify(eff2.slice(0, 3)) + JSON.stringify(d2.gl));
    allErrs.push(...o2.errs); await o2.ctx.close();
  }

  /* ---------- 5. no roster (built-in BASELINE only) ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "nopull", noPulls: true });
    const o = await readAll(p, "ollie"), t = await readAll(p, "tiny");
    ck("no roster, Ollie (30 Sep baseline, Leia not owned there): tile 'GL Leia Organa readiness' '~NN%'; GL order row says the roster doesn't show her unlocked yet, chip 'Build now'", o.gl && o.gl.l === "GL Leia Organa readiness" && /^~\d+%$/.test(o.gl.v) && /this roster doesn't show it unlocked yet/.test(o.rows[0].ready) && /Build now$/.test(o.rows[0].chip) && /saved baseline roster/.test(o.mnote), JSON.stringify(o.gl) + " | " + o.rows[0].ready);
    ck("no roster, Tiny (baseline Leia G9 R0): tile 'G9 → R7'; card renders", t.gl && t.gl.v === "G9 → R7" && t.rows.length === 9, JSON.stringify(t.gl));
    allErrs.push(...errs); await ctx.close();
  }

  /* ---------- 6. escaping, overflow, screenshots ---------- */
  {
    const { ctx, p, errs } = await openAt(b, { tag: "esc" });
    const e = await p.evaluate(() => {
      const keep = [GL_ROADMAP.GLLEIA.name, GL_QUEUE.ollie.queue[1].why, GL_QUEUE.ollie.prep[1].text, GL_QUEUE.ollie.queue[0].trigger];
      GL_ROADMAP.GLLEIA.name = '<img id="x1" src=x>Leia & "co"';
      GL_QUEUE.ollie.queue[1].why = 'why <b id="x2">bold</b>';
      GL_QUEUE.ollie.prep[1].text = 'prep <i id="x3">i</i>';
      GL_QUEUE.ollie.queue[0].trigger = 'trig <u id="x4">u</u>';
      switchAcct("ollie"); switchTab("leia");
      const card = document.querySelector('#glTables [data-card="glq"]').textContent;
      switchTab("overview");
      const ks = document.querySelector('#ovGrid [data-card="keystats"]').textContent, qs = document.getElementById("quickstats").textContent;
      const daily = document.querySelector('#ovGrid [data-card="daily"]').textContent, nextup = document.querySelector('#ovGrid [data-card="nextup"]').textContent;
      const res = { injected: ["x1", "x2", "x3", "x4"].filter(id => document.getElementById(id)).length, card: /why <b id="x2">bold<\/b>/.test(card) && /prep <i id="x3">i<\/i>/.test(card) && /trig <u id="x4">u<\/u>/.test(card) && /<img id="x1" src=x>Leia & "co"/.test(card),
        ks: /<img id="x1" src=x>Leia & "co" build-up/.test(ks), qs: /<img id="x1" src=x>Leia & "co"/.test(qs), daily: /<img id="x1" src=x>Leia & "co" is unlocked/.test(daily), nextup: /Finish <img id="x1" src=x>Leia & "co"/.test(nextup) };
      GL_ROADMAP.GLLEIA.name = keep[0]; GL_QUEUE.ollie.queue[1].why = keep[1]; GL_QUEUE.ollie.prep[1].text = keep[2]; GL_QUEUE.ollie.queue[0].trigger = keep[3]; render();
      return res;
    });
    ck("escapeHtml: a hostile Legend name / why / trigger / prep text renders as literal text in the GL order card and the Key-stats tile · quickstat · Daily routine · Next farm actions (no injected elements)", e.injected === 0 && e.card && e.ks && e.qs && e.daily && e.nextup, JSON.stringify(e));
    allErrs.push(...errs); await ctx.close();
    for (const w of [390, 1280]) {
      const o = await openAt(b, { tag: "shot" + w, width: w, height: w === 390 ? 900 : 1000 });
      await o.p.evaluate(() => { switchAcct("ollie"); switchTab("leia"); });
      await o.p.waitForTimeout(300);
      const ov1 = await L.overflow(o.p);
      const card = await o.p.$('#glTables [data-card="glq"]');
      await card.screenshot({ path: `${SHOTS}/rv25c-glq-ollie-${w}.png` });
      await o.p.evaluate(() => switchTab("overview")); await o.p.waitForTimeout(300);
      const ov2 = await L.overflow(o.p);
      const ks = await o.p.$('#ovGrid [data-card="keystats"]');
      await ks.screenshot({ path: `${SHOTS}/rv25c-keystats-ollie-${w}.png` });
      const fit = await o.p.evaluate(() => [...document.querySelectorAll('#ovGrid [data-card="keystats"] .lay-stat .val')].every(el => el.scrollWidth <= el.clientWidth + 1));
      ck(`[${w}] no horizontal overflow on the GL Roadmap and Overview tabs; Key-stats values fit their tiles; screenshots saved`, ov1.doc <= ov1.inner + 1 && ov2.doc <= ov2.inner + 1 && fit, JSON.stringify([ov1, ov2, fit]));
      allErrs.push(...o.errs); await o.ctx.close();
    }
  }
  ck("zero page errors across every context", allErrs.length === 0, allErrs.join(" | ").slice(0, 600));
  await L.finish(b, srv);
})();
