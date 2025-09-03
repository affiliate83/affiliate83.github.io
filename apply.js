/* ===== 모드: bar | list | full ===== */
const params = new URLSearchParams(location.search);
const MODE = (params.get("mode") || "full").toLowerCase();

/* ===== 설정 ===== */
const TOTAL_SLOTS = 40;
const INITIAL_QUOTA = 12;
const DAILY_DEADLINE_HOUR = 23;
const MAX_ROWS = 7;
const NAMES = ["김서연","이준호","박지후","최민재","정다은","한지후","서우진","오예린","류시후","문서윤","신여준","장가온","권하린","유도현","임채린","홍서준","백다온","양시윤","배이한","남예서","주하율","고주원","하선우","강시후"];
const MIN_AGE=5, MAX_AGE=17;

/* ===== 상태/유틸 ===== */
let quotaLeft = INITIAL_QUOTA;
let appliedCount = Math.max(0, TOTAL_SLOTS - quotaLeft);
const pad2=n=>String(n).padStart(2,"0");
const timeToString=d=>`${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const randAge=()=>Math.floor(Math.random()*(MAX_AGE-MIN_AGE+1))+MIN_AGE;
function randomRecentDate(minAgo=3,maxAgo=35){ const now=new Date(); const m=Math.floor(Math.random()*(maxAgo-minAgo+1))+minAgo; return new Date(now.getTime()-m*60*1000); }

/* ===== 공통 표시 제어 ===== */
function applyMode(){
  const bar   = document.getElementById("apply-fixedbar");
  const toast = document.getElementById("apply-toastwrap");
  const list  = document.getElementById("apply-list");
  if (!bar || !toast || !list) return;
  if (MODE==="bar"){ list.style.display="none"; }
  else if (MODE==="list"){ bar.style.display="none"; toast.style.display="none"; document.body.style.paddingTop="0"; }
}

/* ===== 바 전용: 카운트다운/게이지 ===== */
function tickCountdown(){
  if (MODE==="list") return;
  const now=new Date(), dl=new Date();
  dl.setHours(DAILY_DEADLINE_HOUR,59,59,999);
  if (dl<now) dl.setDate(dl.getDate()+1);
  const diff=dl-now;
  const hh=pad2(Math.floor(diff/3600000)), mm=pad2(Math.floor((diff%3600000)/60000)), ss=pad2(Math.floor((diff%60000)/1000));
  const t=document.getElementById("apply-countdown"); if(t) t.textContent=`${hh}:${mm}:${ss}`;
}
function updateGauge(fromZero=false){
  if (MODE==="list") return;
  const bar=document.getElementById("apply-gaugeBar"); if(!bar) return;
  const p=Math.max(0,Math.min(100,appliedCount/TOTAL_SLOTS*100));
  if(fromZero){ bar.style.transition="none"; bar.style.width="0%"; requestAnimationFrame(()=>{bar.style.transition="width .7s ease, background-color .3s ease"; requestAnimationFrame(()=> bar.style.width=p+"%");}); }
  else{ bar.style.width=p+"%"; }
  bar.style.backgroundColor = p<60?"#22c55e":(p<85?"#f59e0b":"#ef4444");
}

/* ===== 리스트 전용 ===== */
function addRow(name,age,date){
  const tbody=document.querySelector("#apply-table tbody"); if(!tbody) return;
  const tr=document.createElement("tr");
  tr.innerHTML=`<td>${name}</td><td>${age}</td><td>${timeToString(date)}</td>`;
  tbody.insertBefore(tr, tbody.firstChild);         // 최신이 위로
  // 최대 7행 유지
  const rows=tbody.querySelectorAll("tr");
  for(let i=MAX_ROWS;i<rows.length;i++) rows[i].remove();
}
function seedRows(n=5){ if(MODE!=="list") return; for(let i=0;i<n;i++) addRow(pick(NAMES), randAge(), randomRecentDate()); }

/* ===== 토스트(바 전용) + 새 접수 이벤트 전송 ===== */
function showToast(name,age){
  if (MODE==="list") return;
  const wrap=document.getElementById("apply-toastwrap"); if(!wrap) return;
  const el=document.createElement("div");
  el.className="apply-toast";
  el.innerHTML=`<div style="display:flex;align-items:center;gap:10px;">
    <div style="width:10px;height:10px;border-radius:50%;background:#22c55e;flex:0 0 auto;"></div>
    <div><b>${name} (${age}세)</b> 접수 완료</div></div>
    <div style="margin-top:6px;color:#666;font-size:12px;">지금 확인하고 있어요…</div>`;
  wrap.appendChild(el);
  requestAnimationFrame(()=>{el.style.opacity="1"; el.style.transform="translateY(0)";});
  setTimeout(()=>{el.style.opacity="0"; el.style.transform="translateY(-10px)"; setTimeout(()=> el.remove(), 250);}, 3500);
}

/* ===== 부모(티스토리)로 메시지 보냄 ===== */
function sendNewEntry(name, age, when){
  try{
    parent.postMessage({ type:"applyNew", payload:{ name, age, time: when.getTime() } }, "*");
  }catch(e){}
}

/* ===== 부모 → 리스트 모드로 전달된 새 항목 수신 ===== */
function installReceiver(){
  if (MODE!=="list") return;
  window.addEventListener("message", (e)=>{
    if(!e.data || e.data.type!=="applyNew") return;
    const p=e.data.payload||{};
    addRow(p.name || "이름", p.age || randAge(), p.time ? new Date(p.time) : new Date());
  }, false);
}

/* ===== 시작 ===== */
function start(){
  applyMode();

  if (MODE==="list"){
    seedRows(5);             // 초기 더미 5건
    installReceiver();       // 이후부터는 bar에서 오는 것만 추가
  } else {
    // bar / full: 카운트다운/게이지
    const q=document.getElementById("apply-quota"); if(q) q.textContent=quotaLeft;
    tickCountdown(); setInterval(tickCountdown,1000);
    updateGauge(true);
  }

  // 새 접수 루프 (bar에서만 토스트/신규 발생)
  (function loop(){
    const gap=Math.floor(Math.random()*5000)+2000; // 2~7초
    setTimeout(()=>{
      const name=pick(NAMES), age=randAge(), now=new Date();

      if (MODE!=="list"){          // bar 또는 full
        showToast(name,age);       // 토스트
        sendNewEntry(name,age, now); // 리스트로 전달
      }
      if (Math.random()<0.6){      // 연출: 잔여 감소/게이지 갱신
        quotaLeft=Math.max(0,quotaLeft-1);
        appliedCount=Math.min(TOTAL_SLOTS,appliedCount+1);
        const q=document.getElementById("apply-quota"); if(q && MODE!=="list") q.textContent=quotaLeft;
        updateGauge();
      }
      loop();
    }, gap);
  })();
}
document.addEventListener("DOMContentLoaded", start);
