/* ===== 설정값 ===== */
const TOTAL_SLOTS = 50;        // 총 정원
const INITIAL_QUOTA = 12;      // 초기 잔여
const DAILY_DEADLINE_HOUR = 23;
const NAMES = ["김*연","이*호","박*후","최*재","정*은","한*후","서*진","오*린","류*후","문*윤","신*준","장*온","권*린","유*현","임*린","홍*준","백*온","양*윤","배*한","남*서","주*율","고*원","하*우","강*후"];
const MIN_AGE = 14, MAX_AGE = 19;

/* ===== 상태/유틸 ===== */
let quotaLeft = INITIAL_QUOTA;
let appliedCount = Math.max(0, TOTAL_SLOTS - quotaLeft);
const pad2 = n => String(n).padStart(2,"0");
const timeToString = d => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
const randAge = () => Math.floor(Math.random()*(MAX_AGE-MIN_AGE+1))+MIN_AGE;
function randomRecentDate(minAgo=0, maxAgo=30){
  const now = new Date(); const agoMin = Math.floor(Math.random()*(maxAgo-minAgo+1))+minAgo;
  return new Date(now.getTime() - agoMin*60*1000);
}

/* ===== 카운트다운 ===== */
function tickCountdown(){
  const now = new Date();
  const deadline = new Date();
  deadline.setHours(DAILY_DEADLINE_HOUR,59,59,999);
  if (deadline < now) deadline.setDate(deadline.getDate()+1);
  const diff = deadline - now;
  const hh = pad2(Math.floor(diff/3600000));
  const mm = pad2(Math.floor((diff%3600000)/60000));
  const ss = pad2(Math.floor((diff%60000)/1000));
  document.getElementById("apply-countdown").textContent = `${hh}:${mm}:${ss}`;
}

/* ===== 게이지 ===== */
function updateGauge(fromZero=false){
  const bar = document.getElementById("apply-gaugeBar");
  const percent = Math.max(0, Math.min(100, appliedCount / TOTAL_SLOTS * 100));
  if (fromZero){
    bar.style.transition="none"; bar.style.width="0%";
    requestAnimationFrame(()=>{ bar.style.transition="width .7s ease, background-color .3s ease";
      requestAnimationFrame(()=> bar.style.width = percent + "%"); });
  } else {
    bar.style.width = percent + "%";
  }
  bar.style.backgroundColor = percent < 60 ? "#22c55e" : (percent < 85 ? "#f59e0b" : "#ef4444");
}

/* ===== 표 ===== */
function addRow(name, age, date){
  const tbody = document.querySelector("#apply-table tbody");
  const tr = document.createElement("tr");
  tr.innerHTML = `<td>${name}</td><td>${age}</td><td>${timeToString(date)}</td>`;
  tbody.insertBefore(tr, tbody.firstChild);
  const rows = tbody.querySelectorAll("tr");
  if (rows.length > 50) rows[rows.length-1].remove();
}
function seedRows(n=8){ for (let i=0;i<n;i++) addRow(pick(NAMES), randAge(), randomRecentDate(3,35)); }

/* ===== 토스트 ===== */
function showToast(name, age){
  const wrap = document.getElementById("apply-toastwrap");
  const el = document.createElement("div");
  el.className = "apply-toast";
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:10px;height:10px;border-radius:50%;background:#22c55e;flex:0 0 auto;"></div>
      <div><b>${name} (${age}세)</b> 접수 완료</div>
    </div>
    <div style="margin-top:6px;color:#666;font-size:12px;">지금 확인하고 있어요…</div>`;
  wrap.appendChild(el);
  requestAnimationFrame(()=>{ el.style.opacity="1"; el.style.transform="translateY(0)"; });
  setTimeout(()=>{ el.style.opacity="0"; el.style.transform="translateY(-10px)"; setTimeout(()=> el.remove(), 250); }, 3500);
}

/* ===== 자동 높이(티스토리 iFrame) ===== */
function postHeight(){
  const h = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  try { parent.postMessage({ type:"applyHeight", value:h }, "*"); } catch (e) {}
}

/* ===== 시작 ===== */
function start(){
  document.getElementById("apply-quota").textContent = quotaLeft;
  tickCountdown(); setInterval(tickCountdown, 1000);
  seedRows(); updateGauge(true);

  (function loop(){
    const gap = Math.floor(Math.random()*5000)+2000; // 2~7초
    setTimeout(()=>{
      if (quotaLeft > 0){
        const name = pick(NAMES), age = randAge(), now = new Date();
        addRow(name, age, now); showToast(name, age);
        if (Math.random() < 0.6){
          quotaLeft = Math.max(0, quotaLeft-1);
          appliedCount = Math.min(TOTAL_SLOTS, appliedCount+1);
          document.getElementById("apply-quota").textContent = quotaLeft;
          updateGauge();
        }
        postHeight();
      }
      loop();
    }, gap);
  })();

  postHeight(); setInterval(postHeight, 800);
  window.addEventListener("resize", postHeight);
}
document.addEventListener("DOMContentLoaded", start);
