/* Shared harness for the Holotable suites (rebuilt 7 Oct 2026 after the cloud workspace reset).
   Env: FILE (index.html to serve, default ../index.html next to the tests dir), PORT (default 9100).
   Fixtures live one level up (state-2026-09-20.json = real saved app state, holotable-roster-snapshot-*.json = pulls). */
const { chromium } = require("playwright");
const fs = require("fs"), http = require("http"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
const FILE = process.env.FILE || path.join(ROOT, "index.html");
const PORT = +(process.env.PORT || 9100);
const REAL = fs.readFileSync(path.join(ROOT, "state-2026-09-20.json"), "utf8");
const snapName = fs.readdirSync(ROOT).filter(f => /^holotable-roster-snapshot-.*\.json$/.test(f)).sort().pop();
const SNAP = JSON.parse(fs.readFileSync(path.join(ROOT, snapName), "utf8"));
const PULLS = JSON.stringify(SNAP.accounts);
const R = []; const ck = (n, p, d) => R.push({ check: n, pass: !!p, detail: d });
function serve() { const srv = http.createServer((q, s) => { s.setHeader("content-type", "text/html"); fs.createReadStream(FILE).pipe(s); }); return new Promise(r => srv.listen(PORT, () => r(srv))); }
async function open(b, o) {
  o = o || {};
  const ctx = await b.newContext({ viewport: { width: o.width || 1280, height: o.height || 1000 } });
  await ctx.addInitScript(([s, pl, withPulls, seedKey]) => {
    try { if (sessionStorage.getItem(seedKey)) return;
      localStorage.clear(); localStorage.setItem("swgoh-tracker", s);
      if (withPulls) localStorage.setItem("swgoh-holotable-pulls-v1", pl);
      sessionStorage.setItem(seedKey, "1"); } catch (e) {}
  }, [o.state || REAL, PULLS, o.pulls !== false, "seeded-" + (o.tag || "x")]);
  await ctx.route(/fonts\.g|swgoh\.gg|corsproxy|allorigins|codetabs|api\.github/, r => r.abort());
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push(String(e).slice(0, 300)));
  p.on("console", m => { if (m.type() === "error" && !/Failed to load resource|net::ERR|fonts\.g/.test(m.text())) errs.push("console: " + m.text().slice(0, 200)); });
  await p.goto(`http://127.0.0.1:${PORT}/x.html`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(o.settle || 900);
  return { ctx, p, errs };
}
const go = async (p, acct, tab) => { await p.evaluate(([a, t]) => { if (a) switchAcct(a); if (t) switchTab(t); }, [acct, tab]); await p.waitForTimeout(250); };
const overflow = p => p.evaluate(() => ({ doc: document.documentElement.scrollWidth, inner: innerWidth }));
async function finish(b, srv) {
  await b.close(); srv.close();
  const passed = R.filter(r => r.pass).length, failed = R.length - passed;
  console.log(JSON.stringify({ passed, failed, results: R }, null, 1));
  process.exit(failed ? 1 : 0);
}
module.exports = { chromium, fs, path, ROOT, FILE, PORT, REAL, SNAP, PULLS, R, ck, serve, open, go, overflow, finish };
