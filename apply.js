/* ===== 모드: bar | list | full ===== */
const params = new URLSearchParams(location.search);
const MODE = (params.get("mode") || "full").toLowerCase();

/* ===== 설정 ===== */
const TOTAL_SLOTS = 40;
const INITIAL_QUOTA = 12;
const DAILY_DEADLINE_HOUR = 23;
const NAMES = ["김서연","이준호","박지후","최민재","정다은","한지후","서우진","오예린","류시후","문서윤","신여준","장가온","권하린","유도현","임채린","홍서준","백다온","양시윤","배이한","남예서","주하율","고주원","하선우","강시후"];
const MIN_AGE=5, MAX_AGE=17;

/* ===== 상태/유틸 ===== */
let quotaLeft = INITIAL_QUOTA;
let appliedCount = Math.max(0, TOTAL_SLOTS - quotaLeft);
const pad2=n=>String(n).padStart(2,"0");
const timeToString=d=>`${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const randAge=()=>Math.floor(Math.random()*(MAX_AGE-MIN_AGE+1))+MIN_AGE;
function randomRecentDate(minAgo=0,maxAgo=30){ const now=new Date(); const m=Math.floor(Math.random()*(maxAgo-minAgo+1))+minAgo; return new Date(now.getTime()-m*60*1000); }

/* ===== 표시 제어 ===== */
function applyMode(){
  const bar   = document.getElementById("apply-fixedbar");
  const toast = document.getElementById("apply-toastwrap");
  const list  = document.getElementById("apply-list");
  if (MODE==="bar"){ list.style.display="none"; }
  else if (MODE==="list"){ bar.style.display="none"; toast.style.display="none"; document.body.style.paddingTop="0"; }
}

/* ===== 카운트다운/게이지(바 전용) ===== */
function tickCountdown(){
  if (MODE==="list") return;
  const now=new Date(); const dl=new Date();
  dl.setHours(DAILY_DEADLINE_HOUR,59,59,999);
  if (dl<now) dl.setDate(dl.getDate()+1);
  const diff=dl-now;
  const hh=pad2(Math.floor(diff/3600000)), mm=pad2(Math.floor((diff%3600000)/60000)), ss=pad2(Math.floor((diff%60000)/1000));
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

/* ===== 리스트 ===== */
function addRow(name,age,date){
  const tbody=document.querySelector("#apply-table tbody");
  if(!tbody) return;
  const tr=document.createElement("tr");
  tr.innerHTML=`<td>${name}</td><td>${age}</td><td>${timeToString(date)}</td>`;
  tbody.insertBefore(tr, tbody.firstChild);
  const rows=tbody.querySelectorAll("tr"); if(rows.length>50) rows[rows.length-1].remove();
}
function seedRows(n=8){ if(MODE==="bar") return; for(let i=0;i<n;i++) addRow(pick(NAMES), randAge(), randomRecentDate(3,35)); }

/* ===== 토스트(바 전용) ===== */
function showToast(name,age){
  if (MODE==="list") return;
  const wrap=document.getElementById("apply-toastwrap");
  const el=document.createElement("div");
  el.className="apply-toast";
  el.innerHTML=`<div style="display:flex;align-items:center;gap:10px;">
    <div style="width:10px;height:10px;border-radius:50%;background:#22c55e;flex:0 0 auto;"></div>
    <div><b>${name} (${age}세)</b> 접수 완료</div></div>
    <div style="margin-top:6px;color:#666;font-size:12px;">지금 확인하고 있어요…</div>`;
  wrap.appendChild(el); requestAnimationFrame(()=>{el.style.opacity="1"; el.style.transform="translateY(0)";});
  setTimeout(()=>{el.style.opacity="0"; el.style.transform="translateY(-10px)"; setTimeout(()=> el.remove(), 250);}, 3500);
}

/* ===== 높이 전달 (강화) ===== */
function calcDocHeight(){
  const de=document.documentElement, b=document.body;
  return Math.ceil(Math.max(
    de.scrollHeight, b.scrollHeight,
    de.offsetHeight, b.offsetHeight,
    de.clientHeight, b.clientHeight
  ));
}
function postHeight(){
  // 여유 32px 추가로 여백 포함
  const h = calcDocHeight() + 32;
  try{ parent.postMessage({ type:"applyHeight", value:h }, "*"); }catch(e){}
}
function installHeightWatchers(){
  // 레이아웃 변화를 감지해서 자동 전송
  const ro = new ResizeObserver(postHeight);
  ro.observe(document.documentElement);
  ro.observe(document.body);
  const main = document.querySelector('main'); if (main) ro.observe(main);
  // 안전망: 주기 전송
  setInterval(postHeight, 700);
  window.addEventListener("load", postHeight);
  window.addEventListener("resize", postHeight);
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
      if (Math.random()<0.6){
        quotaLeft=Math.max(0,quotaLeft-1);
        appliedCount=Math.min(TOTAL_SLOTS,appliedCount+1);
        if (MODE!=="list"){
          document.getElementById("apply-quota").textContent=quotaLeft;
          updateGauge();
        }
      }
      postHeight();
      loop();
    }, gap);
  })();

  installHeightWatchers();
  postHeight();
}
document.addEventListener("DOMContentLoaded", start);
