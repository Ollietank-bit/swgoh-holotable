const L=require("./lib.js"); const fs=require("fs");
(async()=>{const srv=await L.serve();const b=await L.chromium.launch();
const pulls=JSON.stringify(JSON.parse(fs.readFileSync("holotable-roster-snapshot-2026-10-12.json","utf8")).accounts);
for (const [w,h,n] of [[390,844,"m"],[1280,900,"d"]]){
const ctx=await b.newContext({viewport:{width:w,height:h},timezoneId:"Australia/Sydney",locale:"en-AU"});
await ctx.clock.install({time:new Date("2026-10-12T08:05:00Z")});
await ctx.addInitScript(([s,pl])=>{try{if(sessionStorage.getItem("seeded"))return;localStorage.clear();localStorage.setItem("swgoh-tracker",s);localStorage.setItem("swgoh-holotable-pulls-v1",pl);sessionStorage.setItem("seeded","1");}catch(e){}},[L.REAL,pulls]);
await ctx.route(/fonts\.g|swgoh\.gg|corsproxy|allorigins|codetabs|api\.github/,r=>r.abort());
const p=await ctx.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(String(e).slice(0,200)));
await p.goto(`http://127.0.0.1:${L.PORT}/x.html`,{waitUntil:"domcontentloaded"}); await p.waitForTimeout(1500);
await L.go(p,"ollie","overview"); await p.screenshot({path:`../ref/ov12-${n}.png`});
await L.go(p,"ollie","events"); await p.screenshot({path:`../ref/ev12-${n}.png`});
console.log(n,errs); await ctx.close();}
await b.close();srv.close();})();
