const CHAPTERS = window.COURSE_DATA;
CHAPTERS.forEach(c=>{c.tasks.forEach((t,i)=>t.afb=i<2?1:(i<6?2:3));if(c.bonus)c.bonus.afb=(c.id==="c2"||c.id==="c5")?3:2;});
const COURSE_KEY = "normalize-lab-blobs-v2";
const SESSION_KEY = "normalize-lab-blobs-session-v2";
const LOCAL_USERS_KEY = "normalize-lab-local-users-v2";
let cloudAvailable=false, session=null, profile=null, localMode=false, authMode="login", currentChapter="home", pendingSolution=null, saveTimer=null;

const shopItems=[
 {id:"theme-graphite",kind:"theme",cost:80,name:"Graphite Theme",preview:"⬛",value:"theme-graphite"},
 {id:"avatar-robot",kind:"avatar",cost:160,name:"Data Bot",preview:"🤖",value:"🤖"},
 {id:"pet-cat",kind:"pet",cost:260,name:"Pixel Cat",preview:"🐈",value:"🐈"},
 {id:"theme-aurora",kind:"theme",cost:360,name:"Aurora Theme",preview:"🌌",value:"theme-aurora"},
 {id:"avatar-ninja",kind:"avatar",cost:480,name:"Schema Ninja",preview:"🥷",value:"🥷"},
 {id:"outfit-crown",kind:"outfit",cost:600,name:"Data Crown",preview:"👑",value:"👑"},
 {id:"pet-fox",kind:"pet",cost:700,name:"Query Fox",preview:"🦊",value:"🦊"},
 {id:"theme-violet",kind:"theme",cost:700,name:"Violet Theme",preview:"🟣",value:"theme-violet"}
];
const badges=[
 {id:"c1",icon:"🧯",name:"Anomaly Hunter"},{id:"c2",icon:"🧱",name:"Atomic Builder"},
 {id:"c3",icon:"⛓️",name:"Dependency Pro"},{id:"c4",icon:"🧭",name:"Transit Breaker"},{id:"c5",icon:"🏁",name:"3NF Architect"}
];
const ranks=[{xp:0,name:"Schema Starter"},{xp:100,name:"Redundancy Scout"},{xp:240,name:"Dependency Analyst"},{xp:400,name:"Normalization Engineer"},{xp:560,name:"3NF Architect"},{xp:700,name:"Data Model Legend"}];

function defaultState(){return {xp:0,streak:0,bestStreak:0,completed:{},revealed:{},answers:{},badges:[],shopUnlocked:[],theme:"",avatar:"🧑‍💻",pet:"",outfit:"",currentChapter:"home",excelSolved:0};}
let state=defaultState();

function rank(){return [...ranks].reverse().find(r=>state.xp>=r.xp)||ranks[0];}
function allTasks(){return CHAPTERS.flatMap(c=>[...c.tasks,c.bonus]);}
function regularTasks(){return CHAPTERS.flatMap(c=>c.tasks);}
function taskById(id){return allTasks().find(t=>t.id===id);}
function chapterProgress(c){const ts=c.tasks; return Math.round(ts.filter(t=>state.completed[t.id]).length/ts.length*100);}
function totalProgress(){const ts=regularTasks(); return Math.round(ts.filter(t=>state.completed[t.id]).length/ts.length*100);}
function escapeHtml(s){return (s??"").toString().replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
function norm(s){return (s||"").toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ß/g,"ss").replace(/\s+/g," ");}
function eqArr(a,b){return a.length===b.length && [...a].sort().every((x,i)=>x===[...b].sort()[i]);}
function toast(msg){const el=document.querySelector("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove("show"),2600);}
function confetti(){const box=document.querySelector("#confetti");const chars=["◆","●","★","✦","▰"];for(let i=0;i<24;i++){const s=document.createElement("span");s.className="piece";s.textContent=chars[i%chars.length];s.style.left=Math.random()*100+"vw";s.style.animationDelay=Math.random()*.35+"s";box.appendChild(s);setTimeout(()=>s.remove(),1900);}}

async function shaText(value){
 const buf=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(String(value)));
 return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join("");
}
async function apiFetch(name,opts={}){
 const headers={"Content-Type":"application/json",...(opts.headers||{})};
 if(session?.token)headers.Authorization="Bearer "+session.token;
 const r=await fetch(`/.netlify/functions/${name}`,{...opts,headers,cache:"no-store"});
 const data=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(data.error||`Serverfehler (${r.status})`);
 return data;
}
async function loadCloudConfig(){
 const status=document.querySelector("#cloudStatus"), demo=document.querySelector("#localDemoBtn"), teacher=document.querySelector("#teacherSetupBtn");
 try{const data=await apiFetch("status",{method:"GET"});cloudAvailable=!!data.configured;}catch(e){cloudAvailable=false;}
 if(cloudAvailable){status.textContent="Netlify Blobs: Cloud-Synchronisierung verfügbar.";demo.classList.add("hidden");teacher.classList.remove("hidden");}
 else{status.textContent="Netlify Functions/Blobs sind lokal nicht erreichbar. Für die Vorschau steht ein lokaler Demo-Modus bereit.";demo.classList.remove("hidden");teacher.classList.add("hidden");}
}
async function loginCloud(nickname,password){
 const data=await apiFetch("auth-login",{method:"POST",body:JSON.stringify({nickname,password})});
 session={token:data.token};localStorage.setItem(SESSION_KEY,JSON.stringify(session));
 profile=data.profile;state={...defaultState(),...(data.state||{})};currentChapter=state.currentChapter||"home";
 localStorage.setItem(COURSE_KEY+"-"+profile.user_id,JSON.stringify(state));
}
async function registerCloud(nickname,password){
 await apiFetch("auth-register",{method:"POST",body:JSON.stringify({nickname,password})});
 await loginCloud(nickname,password);
}
async function loadProfileAndProgress(){
 const me=await apiFetch("auth-me",{method:"GET"});profile=me.profile;
 const pr=await apiFetch("progress",{method:"GET"});state={...defaultState(),...(pr.state||{})};currentChapter=state.currentChapter||"home";
 localStorage.setItem(COURSE_KEY+"-"+profile.user_id,JSON.stringify(state));
}
async function saveCloud(){
 if(localMode||!session||!cloudAvailable)return;
 try{await apiFetch("progress",{method:"PUT",body:JSON.stringify({state})});document.querySelector("#syncLabel").textContent="Cloud gespeichert";}
 catch(e){document.querySelector("#syncLabel").textContent="lokal gespeichert";console.warn(e);}
}
function saveState(){
 const key=COURSE_KEY+"-"+(profile?.user_id||profile?.nickname||"demo");localStorage.setItem(key,JSON.stringify(state));
 clearTimeout(saveTimer);saveTimer=setTimeout(saveCloud,700);
}
async function restoreSession(){
 if(!cloudAvailable)return false;
 try{const raw=localStorage.getItem(SESSION_KEY);if(!raw)return false;session=JSON.parse(raw);if(!session?.token)return false;await loadProfileAndProgress();return true;}
 catch(e){localStorage.removeItem(SESSION_KEY);session=null;return false;}
}

async function setupTeacher(nickname,password,setupCode){
 const data=await apiFetch("teacher-setup",{method:"POST",body:JSON.stringify({nickname,password,setupCode})});
 session={token:data.token};localStorage.setItem(SESSION_KEY,JSON.stringify(session));
 profile=data.profile;state={...defaultState(),...(data.state||{})};currentChapter=state.currentChapter||"home";
 localStorage.setItem(COURSE_KEY+"-"+profile.user_id,JSON.stringify(state));
}

async function localLogin(nick,password){
 const users=JSON.parse(localStorage.getItem(LOCAL_USERS_KEY)||"{}");const key=norm(nick);const hash=await shaText(password);
 if(authMode==="register"){if(users[key])throw new Error("Nickname existiert lokal bereits.");users[key]={nickname:nick,hash};localStorage.setItem(LOCAL_USERS_KEY,JSON.stringify(users));}
 else{if(!users[key]||users[key].hash!==hash)throw new Error("Nickname oder Passwort stimmt lokal nicht.");}
 localMode=true;profile={user_id:"local-"+key,nickname:users[key].nickname,role:"student"};state={...defaultState(),...JSON.parse(localStorage.getItem(COURSE_KEY+"-"+profile.user_id)||"{}")};currentChapter=state.currentChapter||"home";
}

function showCourse(){
 document.querySelector("#authScreen").classList.add("hidden");document.querySelector("#courseApp").classList.remove("hidden");
 applyTheme();renderNav();render();updateHUD();
}
async function logout(){
 try{if(session?.token&&!localMode)await apiFetch("auth-logout",{method:"POST",body:"{}"});}catch(e){}
 localStorage.removeItem(SESSION_KEY);session=null;profile=null;localMode=false;document.querySelector("#courseApp").classList.add("hidden");document.querySelector("#authScreen").classList.remove("hidden");document.querySelector("#passwordInput").value="";
}
function applyTheme(){
 document.body.classList.remove("theme-graphite","theme-aurora","theme-violet");if(state.theme)document.body.classList.add(state.theme);
 document.querySelector("#avatarFace").textContent=state.avatar||"🧑‍💻";document.querySelector("#petFace").textContent=state.pet||"";document.querySelector("#outfitFace").textContent=state.outfit||"";
}
function updateBadges(){
 CHAPTERS.forEach(c=>{if(chapterProgress(c)===100&&!state.badges.includes(c.id)){state.badges.push(c.id);toast(`Badge freigeschaltet: ${badges.find(b=>b.id===c.id)?.name||c.title}`);confetti();}});
 saveState();
}
function updateHUD(){
 document.querySelector("#xpTop").textContent=state.xp;document.querySelector("#streakTop").textContent=state.streak;document.querySelector("#nicknameSide").textContent=profile?.nickname||"Lernender";document.querySelector("#rankSide").textContent=rank().name;
 const p=totalProgress();document.querySelector("#overallFill").style.width=p+"%";document.querySelector("#overallText").textContent=p+" %";document.querySelector("#badgeText").textContent=state.badges.length+" Badges";
 document.querySelector("#badgeGrid").innerHTML=badges.map(b=>`<div class="badge ${state.badges.includes(b.id)?"earned":""}"><div><span>${b.icon}</span>${b.name}</div></div>`).join("");
 document.querySelector("#teacherBtn").classList.toggle("hidden",profile?.role!=="teacher");applyTheme();renderNav();
}
function renderNav(){
 const nav=document.querySelector("#chapterNav");if(!nav)return;
 nav.innerHTML=`<button class="nav-btn ${currentChapter==="home"?"active":""}" data-nav="home"><span class="nav-num">⌂</span><span><strong>Mission Control</strong><small class="muted">Übersicht</small></span></button>`+
 CHAPTERS.map((c,i)=>`<button class="nav-btn ${currentChapter===c.id?"active":""} ${chapterProgress(c)===100?"done":""}" data-nav="${c.id}"><span class="nav-num">${chapterProgress(c)===100?"✓":i+1}</span><span><strong>${c.nav}</strong><small class="muted">${chapterProgress(c)} %</small></span></button>`).join("");
 nav.querySelectorAll("[data-nav]").forEach(b=>b.onclick=()=>go(b.dataset.nav));
}
function go(id){currentChapter=id;state.currentChapter=id;saveState();render();updateHUD();window.scrollTo({top:0,behavior:"smooth"});document.querySelector("#sidebar").classList.remove("open");document.querySelector("#scrim").classList.remove("show");}
function renderHome(){
 return `<section class="hero card"><img src="assets/hero.svg" alt="Normalisierungsweg vom Datenchaos bis zur dritten Normalform"><div class="hero-copy"><div class="eyebrow">Future Skills Festival</div><h1>Normalize Lab</h1><p>Sie übernehmen die Rolle eines Junior Data Analysts. Aus unübersichtlichen Festivaldaten entsteht Schritt für Schritt ein belastbares relationales Modell.</p><div class="hero-grid"><div class="hero-chip"><strong>⚡ XP</strong><div class="small muted">lösen Aufgaben und schalten Designs frei</div></div><div class="hero-chip"><strong>📊 Cloud-Sync</strong><div class="small muted">Lernstand auf mehreren Geräten</div></div><div class="hero-chip"><strong>📗 Excel Labs</strong><div class="small muted">Arbeitsdatei bearbeiten und selbst vergleichen</div></div><div class="hero-chip"><strong>🧑‍💻 Avatar</strong><div class="small muted">Galerie mit Themes, Pets und Avataren</div></div></div></div></section>
 <section class="section card"><div class="eyebrow">Lernpfad</div><h2>Vom Problem zur 3NF</h2><div class="concept-grid">${CHAPTERS.map(c=>`<button class="concept" style="text-align:left" data-goto="${c.id}"><div style="font-size:2rem">${c.icon}</div><h3>${c.title}</h3><p>${c.intro}</p><strong>Mission öffnen →</strong></button>`).join("")}</div></section>
 <section class="section card"><div class="eyebrow">Excel-Training</div><h2>Arbeiten wie an einem echten Datenbestand</h2><p>Ein großer Teil des Kurses besteht aus Excel-Labs. Sie laden eine unfertige Datei herunter, normalisieren sie lokal in Excel oder einer kompatiblen Tabellenkalkulation und öffnen anschließend nach einer Bestätigungsabfrage die Musterlösung. Die Bewertung erfolgt bei diesen offenen Modellierungsaufgaben durch einen strukturierten Selbstvergleich.</p></section>`;
}
function render(){
 const main=document.querySelector("#main");
 if(currentChapter==="home"){main.innerHTML=renderHome();main.querySelectorAll("[data-goto]").forEach(b=>b.onclick=()=>go(b.dataset.goto));return;}
 const c=CHAPTERS.find(x=>x.id===currentChapter)||CHAPTERS[0];
 main.innerHTML=`<section class="chapter-head card"><div><div class="eyebrow">Mission ${CHAPTERS.indexOf(c)+1}</div><h1>${c.title}</h1><p>${c.intro}</p><div class="progress-track"><div style="width:${chapterProgress(c)}%"></div></div></div><div class="chapter-icon">${c.icon}</div></section>${c.theory}<section class="section card"><div class="eyebrow">Training</div><h2>Interaktive Aufgaben</h2><p>Bearbeiten Sie die Aufgaben nacheinander oder springen Sie gezielt zu einem Format. Musterlösungen sind jederzeit erreichbar, werden aber erst nach einer kurzen Rückfrage eingeblendet.</p></section><section class="task-list">${[...c.tasks,c.bonus].map(renderTask).join("")}</section><section class="chapter-end"><h2>${chapterProgress(c)===100?"Mission abgeschlossen":"Missionsstatus"}</h2><p>${chapterProgress(c)===100?"Alle regulären Aufgaben dieses Kapitels sind abgeschlossen. Das Kapitel-Badge ist gesichert.":"Bearbeiten Sie die regulären Aufgaben weiter. Bonusmissionen geben zusätzliche XP."}</p><button class="primary" data-next>Zur nächsten Mission</button></section>`;
 wireTasks(c);
 const idx=CHAPTERS.indexOf(c);main.querySelector("[data-next]").onclick=()=>go(CHAPTERS[idx+1]?.id||"home");
}
function taskTypeName(t){return ({single:"Single Choice",multi:"Multiple Choice",tf:"Richtig / Falsch",drag:"Zuordnen",sort:"Reihenfolge",dependency:"Abhängigkeiten",free:"Freitext + Selbstcheck",excel:"Excel-Lab"})[t.type]||t.type;}
function renderTask(t){
 const done=!!state.completed[t.id];
 return `<article class="task card ${done?"done":""} ${t.bonus?"bonus":""}" id="${t.id}"><div class="task-head"><div><div class="task-tags">${t.bonus?'<span class="tag bonus">BONUS</span>':""}<span class="tag">${taskTypeName(t)}</span></div><h3>${done?"✅ ":""}${t.title}</h3></div><div class="points">+${t.points} XP</div></div><p>${t.prompt}</p><div class="task-body">${taskBody(t)}</div>${t.type!=="free"&&t.type!=="excel"?`<div class="task-actions"><button class="primary" data-check="${t.id}">${done?"Erneut prüfen":"Antwort prüfen"}</button><button class="solution-btn" data-solution="${t.id}">Musterlösung anzeigen</button></div>`:""}<div class="feedback" id="fb-${t.id}"></div><div class="solution-panel ${state.revealed[t.id]?"show":""}" id="sol-${t.id}"><strong>Musterlösung</strong><p>${t.solution}</p>${t.solutionFile?`<a class="download-btn" href="${t.solutionFile}" download>⬇ Lösung als Excel herunterladen</a>`:""}${t.checks?`<div class="checklist">${t.checks.map(x=>`<div class="check-row">✓ ${x}</div>`).join("")}</div>`:""}${t.type==="free"||t.type==="excel"?`<div class="self-actions"><button class="primary" data-selfok="${t.id}">Richtig – als korrekt werten</button><button class="secondary" data-retry="${t.id}">Nochmal bearbeiten</button></div>`:""}</div></article>`;
}
function taskBody(t){
 const saved=state.answers[t.id];
 if(t.type==="single"||t.type==="multi"){const typ=t.type==="single"?"radio":"checkbox";return `<div class="options">${t.options.map((o,i)=>`<label class="option"><input type="${typ}" name="${t.id}" value="${i}" ${saved?.includes?.(i)?"checked":""}><span>${o}</span></label>`).join("")}</div>`;}
 if(t.type==="tf")return `<div class="options">${t.statements.map((s,i)=>`<div class="option"><span style="flex:1">${s[0]}</span><label><input type="radio" name="${t.id}-${i}" value="true" ${saved?.[i]===true?"checked":""}> Richtig</label><label><input type="radio" name="${t.id}-${i}" value="false" ${saved?.[i]===false?"checked":""}> Falsch</label></div>`).join("")}</div>`;
 if(t.type==="free")return `<textarea id="input-${t.id}" placeholder="${t.placeholder||"Eigene Antwort eingeben"}">${saved?escapeHtml(saved):""}</textarea><div class="task-actions"><button class="solution-btn" data-free-solution="${t.id}">Musterlösung vergleichen</button></div>`;
 if(t.type==="excel")return `<div class="excel-lab"><div class="excel-icon">📗</div><h3>Arbeitsdatei</h3><p>Speichern Sie die Datei lokal, bearbeiten Sie sie und kehren Sie danach zum Selbstvergleich zurück.</p><a class="download-btn" href="${t.workFile}" download>⬇ Arbeitsdatei herunterladen</a></div><div class="task-actions"><button class="solution-btn" data-excel-solution="${t.id}">Musterlösung vergleichen</button></div>`;
 if(t.type==="drag"){const map=saved||{};const un=t.items.map((x,i)=>[x,i]).filter(([,i])=>!map[i]);return `<div class="match-board"><div class="drag-bank" data-bank="${t.id}">${un.map(([x,i])=>dragItem(t,i,x[0])).join("")}</div><div class="drop-zones">${t.categories.map(c=>`<div class="drop-zone" data-zone="${escapeHtml(c)}" data-zone-task="${t.id}"><strong>${c}</strong>${t.items.map((x,i)=>map[i]===c?dragItem(t,i,x[0]):"").join("")}</div>`).join("")}</div></div><p class="small muted">Desktop: ziehen. Touch: Element antippen, dann Ziel antippen.</p>`;}
 if(t.type==="sort"){const order=(saved?.length?saved:t.items).slice();return `<div class="sort-list" data-sort="${t.id}">${order.map((x,i)=>`<div class="sort-row" draggable="true" data-sort-item="${escapeHtml(x)}"><span>☷</span><span>${x}</span><button class="mini" data-up="${i}">↑</button><button class="mini" data-down="${i}">↓</button></div>`).join("")}</div>`;}
 if(t.type==="dependency"){const vals=saved||[];return `<div class="dep-table">${t.rows.map((r,i)=>`<div class="dep-row"><strong>${r[0]}</strong><select data-dep="${i}"><option value="">bitte wählen</option>${t.choices.map(c=>`<option value="${escapeHtml(c)}" ${vals[i]===c?"selected":""}>${c}</option>`).join("")}</select></div>`).join("")}</div>`;}
 return "";
}
function dragItem(t,i,label){return `<div class="drag-item" draggable="true" data-drag-task="${t.id}" data-drag-index="${i}">${label}</div>`;}
function collect(t){
 const el=document.querySelector("#"+t.id);
 if(t.type==="single"||t.type==="multi")return [...el.querySelectorAll(`input[name="${t.id}"]:checked`)].map(x=>+x.value);
 if(t.type==="tf")return t.statements.map((_,i)=>{const x=el.querySelector(`input[name="${t.id}-${i}"]:checked`);return x?x.value==="true":null;});
 if(t.type==="drag")return state.answers[t.id]||{};
 if(t.type==="sort")return [...el.querySelectorAll("[data-sort-item]")].map(x=>x.dataset.sortItem);
 if(t.type==="dependency")return t.rows.map((_,i)=>el.querySelector(`[data-dep="${i}"]`).value);
}
function correct(t,a){
 if(t.type==="single"||t.type==="multi")return eqArr(a,t.answer);
 if(t.type==="tf")return a.every((x,i)=>x===t.statements[i][1]);
 if(t.type==="drag")return t.items.every((x,i)=>a[i]===x[1]);
 if(t.type==="sort")return a.every((x,i)=>x===t.answer[i]);
 if(t.type==="dependency")return a.every((x,i)=>x===t.rows[i][1]);
 return false;
}
function checkTask(t){
 const a=collect(t);state.answers[t.id]=a;saveState();const fb=document.querySelector("#fb-"+t.id);
 if(correct(t,a)){fb.className="feedback show ok";fb.textContent=["Korrekt. Abhängigkeit erkannt.","Sauber gelöst.","Treffer. Das Schema hält.","Richtig – XP gesichert."][Math.floor(Math.random()*4)];completeTask(t,state.revealed[t.id] ? 0.5 : 1);}
 else{state.streak=0;saveState();fb.className="feedback show no";fb.textContent="Noch nicht korrekt. Prüfen Sie die Definition und die genaue Abhängigkeit noch einmal.";updateHUD();}
}
function completeTask(t,factor=1){
 if(state.completed[t.id]){updateHUD();return;}
 const gain=Math.max(1,Math.round(t.points*factor));state.completed[t.id]=true;state.xp+=gain;state.streak++;state.bestStreak=Math.max(state.bestStreak,state.streak);if(t.type==="excel")state.excelSolved=(state.excelSolved||0)+1;
 if(state.streak%4===0){state.xp+=5;toast(`+${gain} XP · Combo +5 XP`);}else toast(`+${gain} XP`);
 saveState();updateBadges();updateHUD();confetti();render();
}
function requestSolution(t){pendingSolution=t;document.querySelector("#solutionDialog").showModal();}
document.querySelector("#solutionDialog").addEventListener("close",e=>{if(e.target.returnValue==="confirm"&&pendingSolution){state.revealed[pendingSolution.id]=true;saveState();const p=document.querySelector("#sol-"+pendingSolution.id);if(p)p.classList.add("show");toast("Musterlösung eingeblendet. Vergleichen Sie gezielt.");}pendingSolution=null;});
function selfOk(t){if(t.type==="free"){const ta=document.querySelector("#input-"+t.id);state.answers[t.id]=ta?.value||state.answers[t.id]||"";}completeTask(t,state.revealed[t.id] ? 0.75 : 1);}
function retry(t){state.revealed[t.id]=false;saveState();document.querySelector("#sol-"+t.id)?.classList.remove("show");document.querySelector("#input-"+t.id)?.focus();toast("Lösung ausgeblendet. Ihre Eingabe bleibt erhalten.");}
let selectedDrag=null;
function wireDrag(t,el){
 el.querySelectorAll("[data-drag-index]").forEach(it=>{it.ondragstart=e=>{e.dataTransfer.setData("text/plain",it.dataset.dragIndex);selectedDrag={task:t.id,index:+it.dataset.dragIndex};};it.onclick=()=>{el.querySelectorAll(".drag-item").forEach(x=>x.classList.remove("selected"));selectedDrag={task:t.id,index:+it.dataset.dragIndex};it.classList.add("selected");};});
 el.querySelectorAll("[data-zone]").forEach(z=>{z.ondragover=e=>e.preventDefault();z.ondrop=e=>{e.preventDefault();placeDrag(t,+e.dataTransfer.getData("text/plain"),z.dataset.zone);};z.onclick=e=>{if(e.target.closest(".drag-item"))return;if(selectedDrag?.task===t.id)placeDrag(t,selectedDrag.index,z.dataset.zone);};});
}
function placeDrag(t,i,cat){state.answers[t.id]=state.answers[t.id]||{};state.answers[t.id][i]=cat;saveState();render();requestAnimationFrame(()=>document.querySelector("#"+t.id)?.scrollIntoView({block:"center"}));selectedDrag=null;}
function wireSort(t,el){const list=el.querySelector(`[data-sort="${t.id}"]`);let drag=null;list.querySelectorAll("[data-sort-item]").forEach(row=>{row.ondragstart=()=>drag=row;row.ondragover=e=>{e.preventDefault();if(drag&&drag!==row){const r=row.getBoundingClientRect();list.insertBefore(drag,e.clientY<r.top+r.height/2?row:row.nextSibling);}};row.ondragend=()=>saveSort(t,list);});list.querySelectorAll("[data-up]").forEach(b=>b.onclick=()=>{const row=b.closest(".sort-row"),p=row.previousElementSibling;if(p)list.insertBefore(row,p);saveSort(t,list);render();});list.querySelectorAll("[data-down]").forEach(b=>b.onclick=()=>{const row=b.closest(".sort-row"),n=row.nextElementSibling;if(n)list.insertBefore(n,row);saveSort(t,list);render();});}
function saveSort(t,list){state.answers[t.id]=[...list.querySelectorAll("[data-sort-item]")].map(x=>x.dataset.sortItem);saveState();}
function wireTasks(c){[...c.tasks,c.bonus].forEach(t=>{const el=document.querySelector("#"+t.id);if(!el)return;el.querySelector(`[data-check="${t.id}"]`)?.addEventListener("click",()=>checkTask(t));el.querySelector(`[data-solution="${t.id}"]`)?.addEventListener("click",()=>requestSolution(t));el.querySelector(`[data-free-solution="${t.id}"]`)?.addEventListener("click",()=>{state.answers[t.id]=document.querySelector("#input-"+t.id)?.value||"";saveState();requestSolution(t);});el.querySelector(`[data-excel-solution="${t.id}"]`)?.addEventListener("click",()=>requestSolution(t));el.querySelector(`[data-selfok="${t.id}"]`)?.addEventListener("click",()=>selfOk(t));el.querySelector(`[data-retry="${t.id}"]`)?.addEventListener("click",()=>retry(t));if(t.type==="drag")wireDrag(t,el);if(t.type==="sort")wireSort(t,el);});}

function renderShop(){
 document.querySelector("#shopGrid").innerHTML=shopItems.map(it=>{const owned=state.shopUnlocked.includes(it.id),eligible=state.xp>=it.cost;const active=(it.kind==="theme"&&state.theme===it.value)||(it.kind==="avatar"&&state.avatar===it.value)||(it.kind==="pet"&&state.pet===it.value)||(it.kind==="outfit"&&state.outfit===it.value);return `<div class="shop-item ${!eligible&&!owned?"locked":""}"><div class="shop-preview">${it.preview}</div><h3>${it.name}</h3><p class="small muted">Freischaltung ab ${it.cost} XP</p><button class="${owned?"secondary":"primary"} full" data-shop="${it.id}" ${!eligible&&!owned?"disabled":""}>${active?"Aktiv":owned?"Ausrüsten":"Freischalten"}</button></div>`;}).join("");
 document.querySelectorAll("[data-shop]").forEach(b=>b.onclick=()=>{const it=shopItems.find(x=>x.id===b.dataset.shop);if(!state.shopUnlocked.includes(it.id)){if(state.xp<it.cost)return;state.shopUnlocked.push(it.id);toast(`${it.name} freigeschaltet`);confetti();}if(it.kind==="theme")state.theme=it.value;if(it.kind==="avatar")state.avatar=it.value;if(it.kind==="pet")state.pet=it.value;if(it.kind==="outfit")state.outfit=it.value;saveState();applyTheme();renderShop();});
}
async function adminCall(action,payload={}){
 const r=await fetch("/.netlify/functions/admin",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+session.token},body:JSON.stringify({action,...payload})});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||"Aktion fehlgeschlagen");return data;
}
async function loadTeacher(){
 const box=document.querySelector("#teacherContent");box.textContent="Lade Daten …";
 try{const data=await adminCall("list");const rows=data.users.map(u=>{const st=u.state||{};const comp=Object.keys(st.completed||{}).length;const pct=Math.round(comp/regularTasks().length*100);return `<tr><td><strong>${escapeHtml(u.nickname)}</strong><br><span class="small muted">${u.role}</span></td><td>${st.xp||0}</td><td>${pct} %</td><td>${(st.badges||[]).length}</td><td>${u.updated_at?new Date(u.updated_at).toLocaleString("de-DE"):"-"}</td><td><div class="teacher-actions"><button class="mini" data-reset-progress="${u.user_id}">Fortschritt löschen</button><button class="mini" data-password="${u.user_id}">Passwort setzen</button><button class="danger mini" data-delete-user="${u.user_id}" ${u.user_id===profile.user_id?"disabled":""}>Nutzer löschen</button></div></td></tr>`;}).join("");box.innerHTML=`<div class="table-scroll"><table class="teacher-table"><thead><tr><th>Nutzer</th><th>XP</th><th>Fortschritt</th><th>Badges</th><th>letzte Synchronisierung</th><th>Aktionen</th></tr></thead><tbody>${rows}</tbody></table></div>`;
 box.querySelectorAll("[data-reset-progress]").forEach(b=>b.onclick=async()=>{if(confirm("Fortschritt dieses Nutzers wirklich löschen?")){await adminCall("resetProgress",{userId:b.dataset.resetProgress});toast("Fortschritt gelöscht.");loadTeacher();}});
 box.querySelectorAll("[data-password]").forEach(b=>b.onclick=async()=>{const pw=prompt("Neues temporäres Passwort (mindestens 6 Zeichen):");if(pw){await adminCall("resetPassword",{userId:b.dataset.password,newPassword:pw});toast("Passwort wurde gesetzt.");}});
 box.querySelectorAll("[data-delete-user]").forEach(b=>b.onclick=async()=>{if(confirm("Nutzerkonto wirklich vollständig entfernen?")){await adminCall("deleteUser",{userId:b.dataset.deleteUser});toast("Nutzer entfernt.");loadTeacher();}});
 }catch(e){box.innerHTML=`<div class="feedback show no">${escapeHtml(e.message)}</div>`;}
}

document.querySelectorAll("[data-close-dialog]").forEach(b=>b.onclick=()=>document.querySelector("#"+b.dataset.closeDialog).close());
document.querySelector("#shopBtn").onclick=()=>{renderShop();document.querySelector("#shopDialog").showModal();};
document.querySelector("#teacherBtn").onclick=()=>{document.querySelector("#teacherDialog").showModal();loadTeacher();};
document.querySelector("#resetAllBtn").onclick=async()=>{if(confirm("Wirklich den Lernfortschritt ALLER Nutzer löschen? Nutzerkonten bleiben bestehen.")){try{await adminCall("resetAllProgress");toast("Gesamter Fortschritt wurde gelöscht.");loadTeacher();}catch(e){toast(e.message);}}};
document.querySelector("#logoutBtn").onclick=logout;
document.querySelector("#menuBtn").onclick=()=>{document.querySelector("#sidebar").classList.toggle("open");document.querySelector("#scrim").classList.toggle("show");};
document.querySelector("#scrim").onclick=()=>{document.querySelector("#sidebar").classList.remove("open");document.querySelector("#scrim").classList.remove("show");};

document.querySelectorAll("[data-auth-tab]").forEach(b=>b.onclick=()=>{authMode=b.dataset.authTab;document.querySelectorAll("[data-auth-tab]").forEach(x=>x.classList.toggle("active",x===b));document.querySelector("#authSubmit").textContent=authMode==="login"?"Anmelden":"Registrieren";document.querySelector("#passwordInput").autocomplete=authMode==="login"?"current-password":"new-password";});
document.querySelector("#authForm").onsubmit=async e=>{e.preventDefault();const nick=document.querySelector("#nicknameInput").value.trim(),pw=document.querySelector("#passwordInput").value,msg=document.querySelector("#authMessage");msg.textContent="";try{if(nick.length<2)throw new Error("Nickname muss mindestens 2 Zeichen lang sein.");if(pw.length<6)throw new Error("Passwort muss mindestens 6 Zeichen lang sein.");if(cloudAvailable){if(authMode==="register")await registerCloud(nick,pw);else await loginCloud(nick,pw);}else await localLogin(nick,pw);showCourse();}catch(err){msg.textContent=err.message;}};
document.querySelector("#localDemoBtn").onclick=async()=>{authMode="register";const nick=document.querySelector("#nicknameInput").value.trim()||"Demo";const pw=document.querySelector("#passwordInput").value||"demo123";try{await localLogin(nick,pw);}catch(e){authMode="login";await localLogin(nick,pw);}showCourse();};

document.querySelector("#teacherSetupBtn").onclick=()=>document.querySelector("#teacherSetupDialog").showModal();
document.querySelector("#teacherSetupForm").addEventListener("submit",async e=>{
 e.preventDefault();
 const nick=document.querySelector("#teacherNickInput").value.trim();
 const pw=document.querySelector("#teacherPwInput").value;
 const code=document.querySelector("#teacherCodeInput").value;
 const msg=document.querySelector("#teacherSetupMessage");msg.textContent="";
 try{
   if(!cloudAvailable)throw new Error("Netlify Blobs sind nicht erreichbar.");
   await setupTeacher(nick,pw,code);
   document.querySelector("#teacherSetupDialog").close();
   showCourse();
   toast("Lehrerzugang eingerichtet.");
 }catch(err){msg.textContent=err.message;}
});

(async function init(){await loadCloudConfig();if(await restoreSession())showCourse();})();
