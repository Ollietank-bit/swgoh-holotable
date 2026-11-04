#!/usr/bin/env node
/* Runs every Holotable Playwright suite in tests/ (smoke.js + every *-check.js; probes and shot scripts excluded).
   - Discovery: tests/smoke.js plus tests/*-check.js, minus EXCLUDE (lib.js is a helper, the rest are probes/shots).
   - Parallel, at most MAX_PAR at once, each suite on its own port (BASE_PORT + index).
   - Env: FILE (index.html to test) defaults to ../index.html relative to tests/. NODE_PATH is always set to the global
     module dir. SNAP_DATE is removed from the env for NO_SNAP_DATE suites; every other env var is inherited.
   - Per-suite timeout TIMEOUT_MS (kills the whole process group, so Chromium goes too).
   - Results are read from the JSON each suite prints (results[].pass / results[].check). Parsing the JSON is used
     instead of counting the text, so a detail string that happens to contain "pass": true cannot skew the count.
   - One automatic solo retry (no other suite running) for any suite that failed, crashed or timed out on the first
     pass. A retry that passes is reported as PASSED ON RETRY, with the first-attempt failures printed and recorded.
     A suite that still fails after the retry makes the run fail (exit 1).
   - Writes tests/last-run.json. Exit 1 on any failing check, crash or timeout; 0 otherwise. */
"use strict";
const fs = require("fs"), path = require("path"), cp = require("child_process"), crypto = require("crypto");

const TESTS = __dirname;
const FILE = path.resolve(process.env.FILE || path.join(TESTS, "..", "index.html"));
const NODE_PATH = "/home/claude/.npm-global/lib/node_modules";
const BASE_PORT = 9600, MAX_PAR = 4, TIMEOUT_MS = 300000;
const EXCLUDE = new Set(["lib.js", "gof-probe.js", "drr-shot.js", "shot12.js", "view.js"]);
const NO_SNAP_DATE = new Set(["pbm-check.js", "chx-check.js", "nxt-check.js", "gop-check.js"]);

const files = fs.readdirSync(TESTS)
  .filter(f => (f === "smoke.js" || /-check\.js$/.test(f)) && !EXCLUDE.has(f))
  .sort();
const suites = files.map((file, i) => ({ name: file.replace(/-check\.js$|\.js$/, ""), file, port: BASE_PORT + i }));
const byName = Object.fromEntries(suites.map(s => [s.name, s]));

function envFor(s) {
  const env = Object.assign({}, process.env, { FILE, PORT: String(s.port), NODE_PATH });
  if (NO_SNAP_DATE.has(s.file)) delete env.SNAP_DATE;
  return env;
}

/* Returns the results array from a suite's stdout, or null when no JSON result block can be parsed. */
function parseResults(out) {
  const tryParse = t => { try { return JSON.parse(t); } catch (e) { return null; } };
  let obj = tryParse(out.trim());
  if (!obj) {
    const i = out.search(/^\{$/m);
    if (i >= 0) obj = tryParse(out.slice(i, out.lastIndexOf("}") + 1));
  }
  return obj && Array.isArray(obj.results) ? obj.results : null;
}

const lastLines = (t, n = 3) => String(t || "").trim().split("\n").slice(-n).join(" | ").slice(0, 400);

function summarise(s, r) {
  const res = { name: s.name, file: s.file, port: s.port, secs: +r.secs.toFixed(1), pass: 0, fail: 0, failed: [], error: null };
  if (r.timedOut) { res.error = `timeout after ${TIMEOUT_MS / 1000} s`; return res; }
  const results = parseResults(r.out);
  if (!results) { res.error = `crash (exit ${r.code ?? r.signal}), no parsable results: ${lastLines(r.err || r.out)}`; return res; }
  res.pass = results.filter(x => x.pass === true).length;
  res.failed = results.filter(x => x.pass !== true).map(x => x.check);
  res.fail = res.failed.length;
  if (r.code !== 0 && res.fail === 0) res.error = `exit code ${r.code ?? r.signal} with no failing checks: ${lastLines(r.err)}`;
  return res;
}

function runSuite(s) {
  return new Promise(resolve => {
    const t0 = Date.now();
    const child = cp.spawn(process.execPath, [path.join(TESTS, s.file)], {
      cwd: TESTS, env: envFor(s), detached: true, stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "", err = "", timedOut = false;
    child.stdout.on("data", d => { out += d; });
    child.stderr.on("data", d => { err += d; });
    const killGroup = sig => { try { process.kill(-child.pid, sig); } catch (e) { /* group already gone */ } };
    const timer = setTimeout(() => { timedOut = true; killGroup("SIGKILL"); }, TIMEOUT_MS);
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      killGroup("SIGKILL"); // reap any leftover Chromium children
      resolve(summarise(s, { out, err, code, signal, timedOut, secs: (Date.now() - t0) / 1000 }));
    });
  });
}

async function pool(items, n, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (next < items.length) {
      const idx = next++;
      results[idx] = await fn(items[idx]);
    }
  }));
  return results;
}

const pad = (v, n, right) => right ? String(v).padStart(n) : String(v).padEnd(n);

(async () => {
  const wall0 = Date.now();
  const md5 = crypto.createHash("md5").update(fs.readFileSync(FILE)).digest("hex");
  console.log(`Running ${suites.length} suites (max ${MAX_PAR} parallel) against ${FILE} (md5 ${md5})`);

  const first = await pool(suites, MAX_PAR, async s => {
    const r = await runSuite(s);
    console.log(`  done  ${pad(r.name, 6)} pass=${r.pass} fail=${r.fail}${r.error ? " ERROR" : ""} ${r.secs}s`);
    return r;
  });

  const final = Object.fromEntries(first.map(r => [r.name, r]));
  const toRetry = first.filter(r => r.error || r.fail > 0);
  for (const r of toRetry) {
    const why = r.error ? r.error : `failed: ${r.failed.join("; ")}`;
    console.log(`  retry ${r.name} (solo) after first attempt ${why}`);
    const again = await runSuite(byName[r.name]);
    again.retried = true;
    again.firstAttempt = { pass: r.pass, fail: r.fail, failed: r.failed, error: r.error };
    again.passedOnRetry = !again.error && again.fail === 0;
    final[r.name] = again;
    console.log(`  retry ${r.name}: ${again.passedOnRetry ? "PASSED ON RETRY" : "still failing"} pass=${again.pass} fail=${again.fail}${again.error ? " ERROR" : ""} ${again.secs}s`);
  }

  const rows = suites.map(s => final[s.name]);
  const status = r => r.error ? (/timeout/.test(r.error) ? "TIMEOUT" : "CRASH")
    : r.fail > 0 ? "FAIL" : r.passedOnRetry ? "PASSED ON RETRY" : "ok";
  const totals = {
    suites: rows.length,
    pass: rows.reduce((a, r) => a + r.pass, 0),
    fail: rows.reduce((a, r) => a + r.fail, 0),
    crashedOrTimedOut: rows.filter(r => r.error).length,
    passedOnRetry: rows.filter(r => r.passedOnRetry).map(r => r.name),
    wallSecs: +((Date.now() - wall0) / 1000).toFixed(1),
  };
  const bad = rows.filter(r => r.error || r.fail > 0);
  totals.ok = bad.length === 0;

  const W = Math.max(...rows.map(r => r.name.length), 5);
  console.log("");
  console.log(`${pad("suite", W)}  ${pad("pass", 5, true)}  ${pad("fail", 4, true)}  ${pad("seconds", 7, true)}  status`);
  console.log(`${"-".repeat(W)}  -----  ----  -------  ------`);
  for (const r of rows) {
    console.log(`${pad(r.name, W)}  ${pad(r.pass, 5, true)}  ${pad(r.fail, 4, true)}  ${pad(r.secs.toFixed(1), 7, true)}  ${status(r)}`);
  }
  console.log(`${"-".repeat(W)}  -----  ----  -------`);
  console.log(`${pad("TOTAL", W)}  ${pad(totals.pass, 5, true)}  ${pad(totals.fail, 4, true)}  wall ${totals.wallSecs}s`);
  console.log("");

  if (totals.passedOnRetry.length) {
    console.log("PASSED ON RETRY (first attempt failed, solo retry passed):");
    for (const r of rows.filter(x => x.passedOnRetry)) {
      const first1 = r.firstAttempt.error ? r.firstAttempt.error : r.firstAttempt.failed.join("; ");
      console.log(`  ${r.name}: ${first1}`);
    }
    console.log("");
  }
  if (bad.length) {
    console.log("FAILING:");
    for (const r of bad) {
      if (r.error) console.log(`  ${r.name}: ${r.error}`);
      for (const c of r.failed) console.log(`  ${r.name}: ${c}`);
    }
    console.log("");
  }
  console.log(`${totals.ok ? "ALL PASS" : "FAILED"}: ${totals.pass} passing, ${totals.fail} failing, ${totals.crashedOrTimedOut} crashed/timed out, ${rows.length} suites, wall ${totals.wallSecs}s`);

  const report = { when: new Date().toISOString(), file: FILE, md5, suites: {}, totals };
  for (const r of rows) {
    report.suites[r.name] = { pass: r.pass, fail: r.fail, failed: r.failed, secs: r.secs, status: status(r), file: r.file, port: r.port };
    if (r.error) report.suites[r.name].error = r.error;
    if (r.retried) {
      Object.assign(report.suites[r.name], { retried: true, passedOnRetry: r.passedOnRetry, firstAttempt: r.firstAttempt });
    }
  }
  fs.writeFileSync(path.join(TESTS, "last-run.json"), JSON.stringify(report, null, 2) + "\n");
  process.exit(totals.ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
