/* ===== 모드 결정: bar | list | full (오타/공백/약어 모두 허용) ===== */
const raw = (new URLSearchParams(location.search).get("mode") || "full")
  .toLowerCase().replace(/\s/g, "");
let MODE = "full";
if (["bar","top","b"].includes(raw)) MODE = "bar";
else if (["list","bottom","l"].includes(raw)) MODE = "list";

/* ===== 설정 ===== */
const TOTAL_SLOTS = 40;
const INITIAL_QUOTA = 12;
const DAILY_DEADLINE_HOUR = 23;
const MAX_ROWS = 7;
const GAP_MS = 3000; // 정확히 3초 간격
const NAMES = ["김서연","이준호","박지후","최민재","정다은","한지후","서우진","오예린","류시후","문서윤","신여준","장가온","권하린","유도현","임채린","홍서준","백다온","양시윤","배이한","남예서","주하율","고주원","하선우","강시후"];
const MIN_AGE=14, MAX_AGE=19;

/* ===== 상태/유틸 ===== */
let quotaLeft = INITIAL_QUOTA;
let appliedCount = Math.max(0, TOTAL_SLOTS - quotaLeft);
const pad2=n=>String(n).padStart(2,"0");
const timeToString=d=>`${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const randAge=()=>Math.floor(Math.random()*(MAX_AGE-MIN_AGE+1))+MIN_AGE;
function randomRecentDate(minAgo=3,maxAgo=35){ const now=new Date(); const m=Math.floor(Math.random()*(maxAgo-minAgo+1))+minAgo; return new Date(now.getTime()-m*60*1000); }
function maskName(name){
  if(!name) return ""; const arr=[...String(name).trim()];
  if(arr.length===1) return arr[0]+"*";
  if(arr.length===2) return arr[0]+"*";
  return arr[0] + "*" + arr[arr.length-1];
}

/* ===== 요소 ===== */
const $ = s => document.querySelector(s);

/* ===== 표시 제어 ===== */
function applyMode(){
  const bar   = $("#apply-fixedbar");
  const toast = $("#apply-toastwrap");
  const list  = $("#apply-list");
  if (!bar || !toast || !list) return;
  if (MODE==="bar"){ list.style.display="none"; }
  else if (MODE==="list"){ bar.style.display="none"; toast.style.display="none"; document.body.style.paddingTop="0"; }
  // full 모드: 둘 다 표시
}

/* ===== 바 전용: 카운트다운/게이지 ===== */
function tickCountdown(){
  if (MODE==="list") return;
  const now=new Date(), dl=new Date();
  dl.setHours(DAILY_DEADLINE_HOUR,59,59,999);
  if (dl<now) dl.setDate(dl.getDate()+1);
  const diff=dl-now;
  const hh=pad2(Math.floor(diff/3600000)), mm=pad2(Math.floor((diff%3600000)/60000)), ss=pad2(Math.floor((diff%60000)/1000));
  const t=$("#apply-countdown"); if(t) t.textContent=`${hh}:${mm}:${ss}`;
}
function updateGauge(fromZero=false){
  if (MODE==="list") return;
  const bar=$("#apply-gaugeBar"); if(!bar) return;
  const p=Math.max(0,Math.min(100,appliedCount/TOTAL_SLOTS*100));
  if(fromZero){ bar.style.transition="none"; bar.style.width="0%"; requestAnimationFrame(()=>{bar.style.transition="width .7s ease, background-color .3s ease"; requestAnimationFrame(()=> bar.style.width=p+"%");}); }
  else{ bar.style.width=p+"%"; }
  bar.style.backgroundColor = p<60?"#22c55e":(p<85?"#f59e0b":"#ef4444");
}

/* ===== 리스트 ===== */
function addRow(displayName,age,date){
  const tbody=$("#apply-table tbody"); if(!tbody) return;
  const tr=document.createElement("tr");
  tr.innerHTML=`<td>${displayName}</td><td>${age}</td><td>${timeToString(date)}</td>`;
  tbody.insertBefore(tr, tbody.firstChild);
  const rows=tbody.querySelectorAll("tr");
  for(let i=MAX_ROWS;i<rows.length;i++) rows[i].remove();
}
function seedRows(n=5){ for(let i=0;i<n;i++) addRow(maskName(pick(NAMES)), randAge(), randomRecentDate()); }

/* ===== 토스트 + 새 접수 이벤트 ===== */
function showToast(name,age){
  if (MODE==="list") return;
  const wrap=$("#apply-toastwrap"); if(!wrap) return;
  const el=document.createElement("div");
  el.className="apply-toast";
  el.innerHTML=`<div style="display:flex;align-items:center;gap:10px;">
    <div style="width:10px;height:10px;border-radius:50%;background:#22c55e;flex:0 0 auto;"></div>
    <div><b>${maskName(name)} (${age}세)</b> 접수 완료</div></div>
    <div style="margin-top:6px;color:#666;font-size:12px;">지금 확인하고 있어요…</div>`;
  wrap.appendChild(el);
  requestAnimationFrame(()=>{el.style.opacity="1"; el.style.transform="translateY(0)";});
  setTimeout(()=>{el.style.opacity="0"; el.style.transform="translateY(-10px)"; setTimeout(()=> el.remove(), 250);}, 2500);
}
function sendNewEntry(name, age, when){
  try{ parent.postMessage({ type:"applyNew", payload:{ name, age, time: when.getTime() } }, "*"); }catch(e){}
}
function installReceiver(){
  window.addEventListener("message", (e)=>{
    if(!e.data || e.data.type!=="applyNew") return;
    const p=e.data.payload||{};
    addRow(maskName(p.name||""), p.age||randAge(), p.time?new Date(p.time):new Date());
  }, false);
}

/* ===== 시작 ===== */
function start(){
  applyMode();
  // 리스트가 보이는 어떤 모드(list/full)에서도 기본 행 몇 개 보이게
  if (MODE!=="bar") { seedRows(5); installReceiver(); }

  if (MODE!=="list"){ // bar/full
    const q=$("#apply-quota"); if(q) q.textContent=quotaLeft;
    tickCountdown(); setInterval(tickCountdown,1000); updateGauge(true);
  }

  // 정확히 3초마다 새 접수 생성 (bar/full에서만 토스트 발생 + 이벤트 송신)
  (function loop(){
    setTimeout(()=>{
      const name=pick(NAMES), age=randAge(), now=new Date();
      if (MODE!=="list"){ showToast(name,age); sendNewEntry(name,age,now); }
      if (Math.random()<0.6){ quotaLeft=Math.max(0,quotaLeft-1); appliedCount=Math.min(TOTAL_SLOTS,appliedCount+1);
        const q=$("#apply-quota"); if(q && MODE!=="list") q.textContent=quotaLeft; updateGauge(); }
      loop();
    }, GAP_MS);
  })();
}
document.addEventListener("DOMContentLoaded", start);
