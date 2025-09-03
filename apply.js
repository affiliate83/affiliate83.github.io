/* ===== 모드: bar 또는 list ===== */
const params = new URLSearchParams(location.search);
const MODE = (params.get("mode") || "full").toLowerCase(); // bar, list, full

/* ===== 설정 ===== */
const TOTAL_SLOTS = 40;
const INITIAL_QUOTA = 12;
const DAILY_DEADLINE_HOUR = 23;
const NAMES = ["김*연","이*호","박*후","최*재","정*은","한*후","서*진","오*린","류*후","문*윤","신*준","장*온","권*린","유*현","임*린","홍*준","백*온","양*윤","배*한","남*서","주*율","고*원","하*우","강*후"];
const MIN_AGE = 14, MAX_AGE = 19;

/* ===== 상태/유틸 ===== */
let quotaLeft = INITIAL_QUOTA;
let appliedCount = Math.max(0, TOTAL_SLOTS - quotaLeft);
const pad2=n=>String(n).padStart(2,"0");
const timeToString=d=>`${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const randAge=()=>Math.floor(Math.random()*(MAX_AGE-MIN_AGE+1))+MIN_AGE;
function randomRecentDate(minAgo=0,maxAgo=30){ const now=new Date(); const m=Math.floor(Math.random()*(maxAgo-minAgo+1))+minAgo; return new Date(now.getTime()-m*60*1000); }

/* ===== 공통: 요소 ===== */
const barEl   = () => document.getElementById("apply-fixedbar");
const toastEl = () => document.getElementById("apply-toastwrap");
const listEl  = () => document.getElementById("apply-list");

/* ===== 표시 제어 ===== */
function applyMode(){
  if (MODE==="bar"){ listEl().style.display="none"; }
  else if (MODE==="list"){ barEl().style.display="none"; toastEl().style.display="none"; document.body.style.paddingTop="0"; }
}

/* ===== 카운트다운/게이지(바 전용) ===== */
function tickCountdown(){
  if (MODE==="list") return;
  const now=new Date(); const dl=new Date(); dl.setHours(DAILY_DEADLINE_HOUR,59,59,999); if (dl<now) dl.setDate(dl.getDate()+1);
  const diff=dl-now; const hh=pad2(Math.floor(diff/3600000)), mm=pad2(Math.floor((diff%3600000)/60000)), ss=pad2(Math.floor((diff%60000)/1000));
  document.getElementById("apply-countdown").textContent=`${hh}:${mm}:${ss}`;
}
function updateGauge(fromZero=false){
  if (MODE==="list") return;
  const bar=document.getElementById("apply-gaugeBar");
  const p=Math.max(0,Math.min(100,appliedCount/TOTAL_SLOTS*100));
  if(fromZero){ bar.style.transition="none"; bar.style.width="0%"; requestAnimationFrame(()=>{bar.style.transition="width .7s ease, background-color .3s ease"; requestAnimationFrame(()=> bar.style.width=p+"%");}); }
  else{ bar.style.width=p+"%"; }
  bar.style.backgroundColor = p<60?"#22c55e":(p<85?"#f59e0b":"#ef4444");
}

/* ===== 리스트 전용 ===== */
function addRow(name,age,date){
  const tbody=document.querySelector("#apply-table tbody"); if(!tbody) return;
  const tr=document.createElement("tr"); tr.innerHTML=`<td>${name}</td><td>${age}</td><td>${timeToString(date)}</td>`;
  tbody.insertBefore(tr, tbody.firstChild);
  const rows=tbody.querySelectorAll("tr"); if(rows.length>50) rows[rows.length-1].remove();
}
function seedRows(n=8){ if(MODE==="bar") return; for(let i=0;i<n;i++) addRow(pick(NAMES), randAge(), randomRecentDate(3,35)); }

/* ===== 토스트(바 전용) ===== */
function showToast(name,age){
  if (MODE==="list") return;
  const wrap=toastEl(); const el=document.createElement("div");
  el.className="apply-toast";
  el.innerHTML=`<div style="display:flex;align-items:center;gap:10px;">
    <div style="width:10px;height:10px;border-radius:50%;background:#22c55e;flex:0 0 auto;"></div>
    <div><b>${name} (${age}세)</b> 접수 완료</div></div>
    <div style="margin-top:6px;color:#666;font-size:12px;">지금 확인하고 있어요…</div>`;
  wrap.appendChild(el); requestAnimationFrame(()=>{el.style.opacity="1"; el.style.transform="translateY(0)";});
  setTimeout(()=>{el.style.opacity="0"; el.style.transform="translateY(-10px)"; setTimeout(()=> el.remove(), 250);}, 3500);
}

/* ===== 시작 ===== */
function start(){
  applyMode();
  if (MODE!=="list"){ document.getElementById("apply-quota").textContent=quotaLeft; tickCountdown(); setInterval(tickCountdown,1000); updateGauge(true); }
  if (MODE!=="bar"){ seedRows(); }

  (function loop(){
    const gap=Math.floor(Math.random()*5000)+2000;
    setTimeout(()=>{
      const name=pick(NAMES), age=randAge(), now=new Date();
      if (MODE!=="bar"){ addRow(name,age,now); }
      if (MODE!=="list"){ showToast(name,age); }
      if (Math.random()<0.6){ quotaLeft=Math.max(0,quotaLeft-1); appliedCount=Math.min(TOTAL_SLOTS,appliedCount+1);
        if (MODE!=="list"){ document.getElementById("apply-quota").textContent=quotaLeft; updateGauge(); } }
      loop();
    }, gap);
  })();
}
document.addEventListener("DOMContentLoaded", start);
