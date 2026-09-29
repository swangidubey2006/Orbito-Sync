const APP='orbito_state_v1';
const defaultState={
  auth:null, account:null, accounts:{}, onboardingDone:false, activePage:'dashboard',
  settings:{assistant:'Orbito',voiceEnabled:true,notifications:true,speed:1,volume:1,theme:'orange'},
  reminders:[
    {id:'r1',title:'Take a Bath',time:'12:00',repeat:'Daily',enabled:true,message:'12 baj gaye hain, ab naha lo 🛁'},
    {id:'r2',title:'Lunch',time:'13:00',repeat:'Daily',enabled:true,message:'Lunch time ho gaya 🍱'},
    {id:'r3',title:'Study',time:'16:00',repeat:'Daily',enabled:true,message:'Study ka time hai 📚'},
    {id:'r4',title:'Project Work',time:'18:00',repeat:'Daily',enabled:true,message:'Project par thoda kaam kar lo 💻'},
    {id:'r5',title:'Dinner',time:'21:00',repeat:'Daily',enabled:true,message:'Dinner time! 🍽️'},
    {id:'r6',title:'Sleep',time:'23:00',repeat:'Daily',enabled:true,message:'Ab relax karo aur sone ki taiyari 😴'}
  ],
  routine:[
    {id:'t1',time:'07:00',title:'Wake Up',icon:'☀️',done:false},{id:'t2',time:'08:00',title:'Breakfast',icon:'🍳',done:false},{id:'t3',time:'10:00',title:'Study',icon:'📚',done:false},{id:'t4',time:'12:00',title:'Take a Bath',icon:'🛁',done:false},{id:'t5',time:'13:00',title:'Lunch',icon:'🍱',done:false},{id:'t6',time:'16:00',title:'Break',icon:'☕',done:false},{id:'t7',time:'18:00',title:'Project Work',icon:'💻',done:false},{id:'t8',time:'21:00',title:'Dinner',icon:'🍽️',done:false},{id:'t9',time:'23:00',title:'Sleep',icon:'🌙',done:false}
  ],
  tomorrow:[
    {id:'tm1',time:'07:00',title:'Wake Up',icon:'☀️'},{id:'tm2',time:'08:00',title:'Breakfast',icon:'🍳'},{id:'tm3',time:'10:00',title:'Study',icon:'📚'},{id:'tm4',time:'12:00',title:'Take a Bath',icon:'🛁'},{id:'tm5',time:'13:00',title:'Lunch',icon:'🍱'},{id:'tm6',time:'16:00',title:'Study',icon:'📚'},{id:'tm7',time:'18:00',title:'Project Work',icon:'💻'},{id:'tm8',time:'21:00',title:'Dinner',icon:'🍽️'},{id:'tm9',time:'23:00',title:'Sleep',icon:'🌙'}
  ],
  devices:{lights:true,ac:false,fan:false,tv:false,plug:false},
  messages:[{role:'bot',text:'Hi Swangi! 👋 Main Orbito hoon. Main reminders, routine, voice commands aur smart-home controls manage kar sakta hoon.'}],
  fired:{}, lastDate:''
};
let state=load();
let recognition=null;
let currentVoiceTarget=null;

function load(){try{const saved=JSON.parse(localStorage.getItem(APP)||'null');if(!saved)return structuredClone(defaultState);const next={...structuredClone(defaultState),...saved,settings:{...defaultState.settings,...(saved.settings||{})},accounts:{...(saved.accounts||{})}};if(saved.account?.email && !next.accounts[String(saved.account.email).trim().toLowerCase()]){const a={...saved.account};next.accounts[String(a.email).trim().toLowerCase()]={name:a.name,email:String(a.email).trim().toLowerCase(),password:a.password};}if(next.auth?.email){const k=String(next.auth.email).trim().toLowerCase();next.auth=next.accounts[k]?{name:next.accounts[k].name,email:k}:null;}return next}catch(e){return structuredClone(defaultState)}}
function save(){localStorage.setItem(APP,JSON.stringify(state))}
function esc(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function toast(msg,type=''){const root=document.getElementById('toast-root');const el=document.createElement('div');el.className='toast '+type;el.textContent=msg;root.appendChild(el);setTimeout(()=>el.remove(),3000)}
function initials(name){return (name||'Swangi').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()}
function timeNow(){return new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
function todayKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function fmtDate(d=new Date()){return d.toLocaleDateString([], {weekday:'long',day:'numeric',month:'long',year:'numeric'})}
function nextReminder(){const now=new Date();let mins=now.getHours()*60+now.getMinutes();return state.reminders.filter(r=>r.enabled).map(r=>({...r,mins:r.time.split(':').reduce((a,b)=>a*60+ +b,0)})).sort((a,b)=>a.mins-b.mins).find(r=>r.mins>mins) || state.reminders.filter(r=>r.enabled).sort((a,b)=>a.time.localeCompare(b.time))[0]}
function iconFor(title){const x=title.toLowerCase();if(x.includes('bath'))return '🛁';if(x.includes('lunch'))return '🍱';if(x.includes('study'))return '📚';if(x.includes('project'))return '💻';if(x.includes('dinner'))return '🍽️';if(x.includes('sleep'))return '🌙';if(x.includes('break'))return '☕';if(x.includes('breakfast'))return '🍳';return '⏰'}

function applyTheme(){document.body.dataset.theme=state.settings?.theme||'orange'}
async function sendSignupEmail(name,email){try{const res=await fetch('/api/signup-email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email})});if(!res.ok)return false;const data=await res.json().catch(()=>({}));return !!data.sent}catch(e){return false}}
function render(){applyTheme();document.getElementById('app').innerHTML=state.auth?appShell():authView(); if(state.auth) bindShell();}
function brand(){return `<div class="brand"><div class="brand-mark"><img src="assets/orbito-round-logo.png" alt="Orbito"></div><span>Orbito</span></div>`}
function authView(){
  const signup=location.hash==='#signup';
  return `<div class="auth-new">
    <div class="auth-noise"></div>
    <div class="auth-glow g1"></div><div class="auth-glow g2"></div><div class="auth-glow g3"></div>
    <section class="auth-card-new glass-auth">
      <div class="auth-brand-new"><div class="auth-round-logo-new"><img src="assets/orbito-round-logo.png" alt="Orbito"></div><span>Orbito</span></div>
      <div class="auth-eyebrow">YOUR DAY, IN SYNC.</div>
      <h1>${signup?'Create your Orbito account':'Welcome back'}</h1>
      <p class="auth-sub">${signup?'Set up your profile once, then let Orbito keep your routine in sync.':'Sign in to continue to your smart daily routine.'}</p>
      <div class="auth-tabs">
        <button class="auth-tab ${!signup?'active':''}" data-auth-mode="login">Login</button>
        <button class="auth-tab ${signup?'active':''}" data-auth-mode="signup">Sign up</button>
        <span class="auth-tab-line" style="transform:translateX(${signup?'100%':'0'})"></span>
      </div>
      <div class="auth-form-new">
        ${signup?`<div class="auth-field"><label>Full name</label><input id="name" autocomplete="name" placeholder="Enter your full name"></div>`:''}
        <div class="auth-field"><label>Email address</label><input id="email" type="email" autocomplete="email" placeholder="you@example.com"></div>
        <div class="auth-field"><label>Password</label><div class="pass-wrap"><input id="password" type="password" autocomplete="${signup?'new-password':'current-password'}" placeholder="Enter your password"><button type="button" class="eye-btn" data-eye="password">◉</button></div></div>
        ${signup?`<div class="auth-field"><label>Confirm password</label><div class="pass-wrap"><input id="confirm" type="password" autocomplete="new-password" placeholder="Re-enter your password"><button type="button" class="eye-btn" data-eye="confirm">◉</button></div></div>`:`<div class="auth-meta"><label class="remember-new"><input type="checkbox"> <span>Remember me</span></label><button type="button" class="forgot-new" id="forgotAuth">Forgot password?</button></div>`}
        <button class="auth-primary" id="authBtn" type="button">${signup?'Create account':'Sign in'}<span></span></button>
      </div>
      <p class="auth-switch-new">${signup?'Already have an account?':'Don’t have an account?'} <button type="button" id="switchAuth">${signup?'Sign in':'Create one'}</button></p>
      <div class="auth-status" id="authStatus"></div>
    </section>
    <section class="auth-visual-new">
      <div class="orbit-ring ring1"></div><div class="orbit-ring ring2"></div>
      <div class="ai-chip-new chip1">✦ AI powered</div><div class="ai-chip-new chip2">◌ Smart routine</div><div class="ai-chip-new chip3">⌁ Voice ready</div>
      <div class="visual-copy"><div>ORBITO AI</div><h2>Your day,<br><span>in sync.</span></h2><p>Natural language routines, smart reminders and a calmer day.</p></div>
      <div class="mascot-new"><div class="mascot-glow-new"></div><img src="assets/auth-visual-exact.png" alt="Orbito AI mascot"></div>
    </section>
  </div>`;
}
function appShell(){return `<div class="shell"><aside class="sidebar" id="sidebar"><div class="side-brand">${brand()}</div><nav class="nav">${navBtn('dashboard','🏠','Dashboard')}${navBtn('voice','🎙️','Voice Assistant')}${navBtn('chat','🤖','AI Chatbot')}${navBtn('reminders','⏰','Reminders')}${navBtn('routine','📅','My Routine')}${navBtn('tomorrow','🌙','Tomorrow’s Routine')}${navBtn('kids','🎮','Kidz')}${navBtn('settings','⚙️','Settings')}</nav><div class="side-bottom"><div class="mini-user"><div class="avatar">${initials(state.auth.name)}</div><div><strong style="font-size:12px">${esc(state.auth.name)}</strong><div class="muted" style="font-size:10px">Personal account</div></div></div></div></aside><main class="content"><div class="topbar"><div style="display:flex;align-items:center;gap:10px"><button class="icon-btn mobile-menu" id="menuBtn">☰</button><div><h2>${pageTitle()}</h2><p>${fmtDate()} · ${timeNow()}</p></div></div><div class="top-actions"><button class="ghost notify-icon-btn" id="notifyBtn" aria-label="Notifications" title="Notifications">${state.settings.notifications?'🔔':'🔕'}</button><div class="avatar">${initials(state.auth.name)}</div></div></div><div class="notification-popover hidden" id="notificationPopover"><div class="notification-popover-title">Notifications</div><div class="notification-popover-status">${state.settings.notifications?'Notifications are ON':'Notifications are OFF'}</div><div class="notification-popover-actions"><button class="notification-option ${state.settings.notifications?'selected':''}" data-notify-choice="on">🔔 On</button><button class="notification-option ${!state.settings.notifications?'selected':''}" data-notify-choice="off">🔕 Off</button></div></div><div class="page">${pageContent()}</div><div class="footer-note">Orbito · Your day, in sync. · Browser-first smart assistant</div></main><button class="logout-corner" id="cornerLogout">↪ Logout</button></div>`}
function navBtn(id,ic,label){return `<button class="${state.activePage===id?'active':''}" data-page="${id}"><span class="nav-icon">${ic}</span><span>${label}</span></button>`}
function pageTitle(){return ({dashboard:'Dashboard',voice:'Voice Assistant',chat:'AI Chatbot',reminders:'Reminders',routine:'My Routine',tomorrow:'Tomorrow’s Routine',kids:'Kidz',settings:'Settings'})[state.activePage]||'Dashboard'}

function pageContent(){switch(state.activePage){case'dashboard':return dashboard();case'voice':return voice();case'chat':return chat();case'reminders':return reminders();case'routine':return routine(false);case'tomorrow':return routine(true);case'kids':return kids();case'settings':return settings();default:return dashboard()}}
function dashboard(){const next=nextReminder();const done=state.routine.filter(x=>x.done).length;return `<div class="grid"><div class="card hero"><div><span class="pill"><span class="dot"></span> Orbito is ready</span><h1>Good morning, ${esc(state.auth.name.split(' ')[0])}! 👋</h1><div class="muted">Here’s what’s happening today.</div></div><div class="dashboard-mascot-wrap"><img class="mascot-small" src="assets/mascot.png" alt="Orbito"></div></div><div class="grid g3"><div class="card stat"><div class="muted">Next reminder</div><div class="value">${next?esc(next.time):'—'}</div><div class="label">${next?esc(next.title):'No active reminders'}</div></div><div class="card stat"><div class="muted">Today’s progress</div><div class="value">${done}/${state.routine.length}</div><div class="progress"><span style="width:${state.routine.length?done/state.routine.length*100:0}%"></span></div></div></div><div class="grid g2"><div class="card"><div class="section-head"><h3>Today’s Routine</h3><button class="small-btn" data-page="routine">View all</button></div><div class="list">${state.routine.slice(0,6).map(r=>routineRow(r)).join('')}</div></div><div class="card"><div class="section-head"><h3>Quick Actions</h3></div><div class="grid g2"><button class="ghost" data-page="reminders">➕ Add reminder</button><button class="ghost" data-page="chat">💬 Open chat</button><button class="ghost" data-page="voice">🎙️ Voice command</button></div><div style="margin-top:18px" class="notice">Tip: say “Remind me to study at 6 PM” or type it in Orbito Chat.</div></div></div></div>`}
function routineRow(r){return `<div class="list-row"><div class="list-main"><div class="list-icon">${r.icon||iconFor(r.title)}</div><div><div class="list-title">${esc(r.title)}</div><div class="list-sub">${esc(r.time)}</div></div></div><button class="small-btn" data-toggle-routine="${r.id}">${r.done?'✓ Done':'Mark done'}</button></div>`}
function voice(){return `<div class="grid g2"><div class="card voice-wrap"><span class="pill">🎙 Browser voice control</span><div style="height:55px"></div><button class="mic" id="micBtn">🎙</button><div class="voice-status"><strong id="voiceText">Tap to speak</strong><div class="muted" id="voiceHint">Try: “Remind me to study at 6 PM”</div></div><div class="quick-commands"><button class="small-btn" data-voice="What is my next reminder?">Next reminder</button><button class="small-btn" data-voice="Show my schedule">Today’s schedule</button><button class="small-btn" data-voice="Turn on lights">Turn on lights</button></div></div><div class="card"><div class="section-head"><h3>Recent commands</h3></div><div class="list">${state.messages.slice(-5).reverse().map(m=>`<div class="list-row"><div class="list-main"><div class="list-icon">${m.role==='user'?'🗣️':'🤖'}</div><div><div class="list-title">${esc(m.text.slice(0,70))}</div><div class="list-sub">${m.role==='user'?'You':'Orbito'}</div></div></div></div>`).join('')}</div></div></div>`}
function chat(){return `<div class="chat"><div class="card chat-window"><div class="messages" id="messages">${state.messages.map(m=>`<div class="msg ${m.role==='user'?'user':'bot'}">${esc(m.text)}</div>`).join('')}</div><div class="chat-compose"><button class="icon-btn" id="chatMic">🎙</button><input id="chatInput" placeholder="Ask Orbito anything about your day…"><button class="primary" style="width:auto" id="sendChat">Send</button></div></div><div class="card"><h3>Quick suggestions</h3><div class="list" style="margin-top:12px">${['Add a reminder','What’s my next reminder?','Show my schedule','Change my routine'].map(x=>`<button class="list-row" data-chat="${x}"><span>${x}</span><span>›</span></button>`).join('')}</div><div class="section-head"><h3>What Orbito can do</h3></div><div class="notice">Create, update and cancel reminders, check your schedule, complete routine items and control simulated smart-home devices.</div></div></div>`}
function reminders(){return `<div class="section-head"><div><h3 style="font-size:20px">Stay on track, always.</h3><div class="muted">Browser notifications + voice announcements.</div></div><button class="primary" style="width:auto" id="addReminder">＋ Add Reminder</button></div><div class="card"><div class="list">${state.reminders.length?state.reminders.map(reminderRow).join(''):`<div class="empty">No reminders yet. Add your first one.</div>`}</div></div>`}
function reminderRow(r){return `<div class="list-row"><div class="list-main"><div class="list-icon">${iconFor(r.title)}</div><div><div class="list-title">${esc(r.title)}</div><div class="list-sub">${esc(r.time)} · ${esc(r.repeat)} · ${esc(r.message||'Reminder')}</div></div></div><div class="actions"><button class="small-btn" data-edit-reminder="${r.id}">✎</button><button class="switch ${r.enabled?'on':''}" data-toggle-reminder="${r.id}"><span></span></button><button class="small-btn danger" data-delete-reminder="${r.id}">⌫</button></div></div>`}
function routine(tom){const arr=tom?state.tomorrow:state.routine;return `<div class="card"><div class="section-head"><div><h3 style="font-size:20px">${tom?'Plan tomorrow.':'Your daily plan.'}</h3><div class="muted">${tom?'Edit tomorrow’s routine once and Orbito will keep it saved.':'Check things off as you go.'}</div></div><button class="primary" style="width:auto" id="addRoutine" data-tomorrow="${tom}">＋ Add Activity</button></div>${tom?`<div class="calendar-strip"><div class="day-chip active"><strong>Tomorrow</strong><span>${new Date(Date.now()+86400000).toLocaleDateString([], {day:'numeric',month:'short'})}</span></div></div>`:''}<div class="timeline" style="margin-top:15px">${arr.map((r,i)=>`<div class="time-row ${!tom&&r.done?'done':''}"><div class="time">${esc(r.time)}</div><div class="check">${r.icon||iconFor(r.title)}</div><div><div class="time-title" style="font-weight:800;font-size:13px">${esc(r.title)}</div><div class="muted" style="font-size:11px">${tom?'Tomorrow’s plan':'Today'}</div></div><div class="actions"><button class="small-btn" data-edit-routine="${r.id}" data-tomorrow="${tom}">✎</button>${!tom?`<button class="small-btn" data-toggle-routine="${r.id}">${r.done?'Undo':'Done'}</button>`:''}<button class="small-btn danger" data-delete-routine="${r.id}" data-tomorrow="${tom}">⌫</button></div></div>`).join('')}</div></div>`}
function kids(){return `<div class="kids-head card"><div><span class="pill">🎮 Orbito Kidz</span><h1>Play, learn & challenge yourself!</h1><div class="muted">11 mini-games — skill, math, puzzles, racing and reflex challenges.</div></div><div class="kids-logo-wrap"><img src="assets/mascot.png" class="kids-mascot" alt="Orbito Kidz"></div></div><div class="games-grid">${gameCard('circle','⭕','Perfect Circle','Draw the closest possible circle.','Skill')} ${gameCard('racer','🏎️','Orbito Racer','Dodge traffic and survive as long as you can.','Speed')} ${gameCard('subway','🚇','Orbito Subway Rush','An original endless runner inspired by lane-switch racing.','Runner')} ${gameCard('math','➗','Math Master','Solve quick sums before the timer runs out.','Math')} ${gameCard('puzzle','🧩','Puzzle Slide','Arrange the tiles from 1 to 8.','Puzzle')} ${gameCard('memory','🧠','Memory Match','Match all the hidden pairs.','Memory')} ${gameCard('color','🎨','Color Tap','Tap the color that matches the target.','Focus')} ${gameCard('numbers','🔢','Number Dash','Tap numbers from 1 to 15 in order.','Speed')} ${gameCard('dodge','🛸','Dodge Zone','Move your ship and avoid falling blocks.','Reflex')} ${gameCard('maze','🧭','Maze Escape','Guide the dot to the goal with arrow keys.','Logic')} ${gameCard('typing','⌨️','Typing Sprint','Type the sentence as fast as you can.','Words')}</div><div id="gameStage"></div>`}
function gameCard(id,ic,title,desc,tag){return `<button class="game-card" data-game="${id}"><div class="game-icon">${ic}</div><div><b>${title}</b><span>${desc}</span></div><em>${tag}</em></button>`}
function settings(){const themes=[['orange','🍊','Orbito Peach'],['black','⚫','Black'],['white','⚪','White'],['navy','🔵','Navy Blue'],['green','🟢','Forest Green'],['pink','🌸','Pink'],['brown','🟤','Chocolate Brown']];return `<div class="settings-grid"><div class="card"><h3>Profile</h3><div class="field"><label>Name</label><input id="setName" value="${esc(state.auth.name)}"></div><div class="field"><label>Email</label><input value="${esc(state.auth.email)}" disabled></div><button class="primary" id="saveProfile">Save profile</button></div><div class="card"><h3>Assistant</h3><div class="field"><label>Assistant name</label><input id="assistantName" value="${esc(state.settings.assistant)}"></div><div class="field"><label>Voice speed</label><input id="speed" type="range" min="0.6" max="1.5" step="0.1" value="${state.settings.speed}"></div><div class="field"><label>Volume</label><input id="volume" type="range" min="0" max="1" step="0.1" value="${state.settings.volume}"></div><button class="primary" id="saveAssistant">Save assistant settings</button></div><div class="card theme-card"><h3>Appearance & Themes</h3><div class="muted" style="font-size:12px;margin-bottom:14px">Choose a clear, high-contrast theme. The selected theme is saved automatically.</div><div class="theme-grid">${themes.map(([id,ic,name])=>`<button class="theme-choice ${state.settings.theme===id?'selected':''}" data-theme-choice="${id}"><span class="theme-swatch ${id}">${ic}</span><span>${name}</span>${state.settings.theme===id?'<b>✓</b>':''}</button>`).join('')}</div></div><div class="card"><h3>Notifications</h3>${toggleSetting('notifications','Browser notifications','Allow Orbito to show reminder alerts.',state.settings.notifications)}${toggleSetting('voiceEnabled','Voice announcements','Speak reminder messages aloud.',state.settings.voiceEnabled)}<button class="ghost" style="margin-top:12px" id="testNotification">🔔 Send test notification</button></div><div class="card"><h3>Account</h3><div class="notice">Your current demo data is stored in this browser using localStorage.</div><div class="account-actions"><button class="ghost" id="settingsLogout">↪ Log out</button><button class="small-btn danger" id="reset">Reset demo data</button></div></div></div>`}

function toggleSetting(id,title,desc,val){return `<div class="toggle-row"><div><strong>${title}</strong><span>${desc}</span></div><button class="switch ${val?'on':''}" data-setting="${id}"><span></span></button></div>`}

function toggleNotificationMenu(){
  const pop=document.getElementById('notificationPopover');
  if(!pop)return;
  pop.classList.toggle('hidden');
  pop.querySelectorAll('[data-notify-choice]').forEach(b=>b.onclick=async()=>{
    if(b.dataset.notifyChoice==='on'){await requestNotifications();}
    else{state.settings.notifications=false;save();render();toast('Notifications turned off.','ok');}
  });
}
function bindShell(){
  document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{state.activePage=b.dataset.page;save();render();window.scrollTo(0,0)});
  const menu=document.getElementById('menuBtn'); if(menu) menu.onclick=()=>document.getElementById('sidebar').classList.toggle('open');
  const nb=document.getElementById('notifyBtn');if(nb)nb.onclick=toggleNotificationMenu;
  document.querySelectorAll('[data-toggle-routine]').forEach(b=>b.onclick=()=>toggleRoutine(b.dataset.toggleRoutine));
  document.querySelectorAll('[data-delete-routine]').forEach(b=>b.onclick=()=>deleteRoutine(b.dataset.deleteRoutine,b.dataset.tomorrow==='true'));
  document.querySelectorAll('[data-edit-routine]').forEach(b=>b.onclick=()=>openRoutineModal(b.dataset.editRoutine,b.dataset.tomorrow==='true'));
  const ar=document.getElementById('addRoutine');if(ar)ar.onclick=()=>openRoutineModal(null,ar.dataset.tomorrow==='true');
  document.querySelectorAll('[data-toggle-reminder]').forEach(b=>b.onclick=()=>{const r=state.reminders.find(x=>x.id===b.dataset.toggleReminder);r.enabled=!r.enabled;save();render()});
  document.querySelectorAll('[data-delete-reminder]').forEach(b=>b.onclick=()=>{if(confirm('Delete this reminder?')){state.reminders=state.reminders.filter(r=>r.id!==b.dataset.deleteReminder);save();render()}});
  document.querySelectorAll('[data-edit-reminder]').forEach(b=>b.onclick=()=>openReminderModal(b.dataset.editReminder));
  const add=document.getElementById('addReminder');if(add)add.onclick=()=>openReminderModal();
  document.querySelectorAll('[data-device]').forEach(b=>b.onclick=()=>{state.devices[b.dataset.device]=!state.devices[b.dataset.device];save();render();toast(`${b.dataset.device} ${state.devices[b.dataset.device]?'on':'off'}`,'ok')});
  document.querySelectorAll('[data-setting]').forEach(b=>b.onclick=async()=>{const k=b.dataset.setting;if(k==='notifications'&&!state.settings.notifications){await requestNotifications();return}state.settings[k]=!state.settings[k];save();render()});
  document.querySelectorAll('[data-theme-choice]').forEach(b=>b.onclick=()=>{state.settings.theme=b.dataset.themeChoice;save();render()});
  const clo=document.getElementById('cornerLogout');if(clo)clo.onclick=logout;
  const slo=document.getElementById('settingsLogout');if(slo)slo.onclick=logout;
  const tn=document.getElementById('testNotification');if(tn)tn.onclick=sendTestNotification;
  document.querySelectorAll('[data-game]').forEach(b=>b.onclick=()=>startGame(b.dataset.game));
  const sp=document.getElementById('saveProfile');if(sp)sp.onclick=()=>{state.auth.name=document.getElementById('setName').value.trim()||state.auth.name;save();toast('Profile saved','ok');render()};
  const sa=document.getElementById('saveAssistant');if(sa)sa.onclick=()=>{state.settings.assistant=document.getElementById('assistantName').value.trim()||'Orbito';state.settings.speed=+document.getElementById('speed').value;state.settings.volume=+document.getElementById('volume').value;save();toast('Assistant settings saved','ok');render()};
  const lo=document.getElementById('logout');if(lo)lo.onclick=logout;
  const reset=document.getElementById('reset');if(reset)reset.onclick=()=>{if(confirm('Reset all Orbito demo data?')){state=structuredClone(defaultState);state.auth=null;save();render()}};
  bindChat();bindVoice();
}
function bindChat(){const input=document.getElementById('chatInput'),send=document.getElementById('sendChat');if(!input||!send)return;const go=()=>{const t=input.value.trim();if(t){handleCommand(t);input.value=''}};send.onclick=go;input.onkeydown=e=>{if(e.key==='Enter')go()};document.querySelectorAll('[data-chat]').forEach(b=>b.onclick=()=>handleCommand(b.dataset.chat));const cm=document.getElementById('chatMic');if(cm)cm.onclick=()=>startRecognition(t=>{input.value=t;go()})}
function bindVoice(){const mic=document.getElementById('micBtn');if(!mic)return;mic.onclick=()=>startRecognition(t=>handleCommand(t));document.querySelectorAll('[data-voice]').forEach(b=>b.onclick=()=>handleCommand(b.dataset.voice))}
function speak(text){if(!state.settings.voiceEnabled||!('speechSynthesis'in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=state.settings.speed;u.volume=state.settings.volume;window.speechSynthesis.speak(u)}
function startRecognition(cb){if(!('webkitSpeechRecognition'in window||'SpeechRecognition'in window)){toast('Voice recognition is not supported in this browser. Try Chrome.','warn');return}const SR=window.SpeechRecognition||window.webkitSpeechRecognition;recognition=new SR();recognition.lang='en-IN';recognition.interimResults=false;recognition.maxAlternatives=1;const mic=document.getElementById('micBtn'),txt=document.getElementById('voiceText');if(mic)mic.classList.add('listening');if(txt)txt.textContent='Listening…';recognition.onresult=e=>{const t=e.results[0][0].transcript;if(txt)txt.textContent=t;cb(t)};recognition.onerror=()=>{if(txt)txt.textContent='Couldn’t hear that. Try again.';toast('Voice input failed','warn')};recognition.onend=()=>{if(mic)mic.classList.remove('listening')};recognition.start()}
function handleCommand(raw){const text=raw.trim();state.messages.push({role:'user',text});let reply='';let low=text.toLowerCase();
  const m=low.match(/(?:remind me to|remind me|add (?:a )?reminder(?: to)?)\s+(.+?)\s+(?:at|@)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if(m){let h=+m[2],min=+(m[3]||'00'),amp=(m[4]||'').toLowerCase();if(amp==='pm'&&h<12)h+=12;if(amp==='am'&&h===12)h=0;const time=`${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;const title=m[1].replace(/daily|every day/ig,'').trim();state.reminders.push({id:'r'+Date.now(),title:cap(title),time,repeat:'Daily',enabled:true,message:`Reminder: ${cap(title)}`});reply=`Done! ${cap(title)} ka reminder ${time} par set kar diya.`}
  else if(low.includes('next reminder')){const r=nextReminder();reply=r?`Next reminder ${r.time} par hai: ${r.title}.`:'Abhi koi active reminder nahi hai.'}
  else if(low.includes('schedule')||low.includes('routine')){reply='Aaj ka schedule: '+state.routine.map(x=>`${x.time} ${x.title}`).join(', ')+'.'}
  else if(/turn on (the )?lights?|lights? on/.test(low)){state.devices.lights=true;reply='Lights on kar diye 💡'}
  else if(/turn off (the )?lights?|lights? off/.test(low)){state.devices.lights=false;reply='Lights off kar diye 💡'}
  else if(/turn on (the )?fan|fan on/.test(low)){state.devices.fan=true;reply='Fan on kar diya 🌀'}
  else if(/turn off (the )?fan|fan off/.test(low)){state.devices.fan=false;reply='Fan off kar diya 🌀'}
  else if(/turn on (the )?ac|ac on/.test(low)){state.devices.ac=true;reply='AC on kar diya ❄️'}
  else if(/turn off (the )?ac|ac off/.test(low)){state.devices.ac=false;reply='AC off kar diya ❄️'}
  else if(low.includes('what can you do')||low==='help'){reply='Main reminders add/toggle kar sakta hoon, schedule bata sakta hoon, routine manage kar sakta hoon aur demo smart-home devices control kar sakta hoon.'}
  else if(low.includes('good morning')){reply=`Good morning ${state.auth.name.split(' ')[0]}! Aaj ka din productive banate hain ☀️`}
  else {reply=`Maine suna: “${text}”. Main abhi reminders, routine, schedule aur smart-home commands ko handle kar sakta hoon.`}
  state.messages.push({role:'bot',text:reply});save();speak(reply);render();if(state.activePage==='chat'){setTimeout(()=>{const m=document.getElementById('messages');if(m)m.scrollTop=m.scrollHeight},30)}
}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function openReminderModal(id){const r=id?state.reminders.find(x=>x.id===id):null;modal(`<div class="modal-head"><h3>${r?'Edit':'Add'} Reminder</h3><button class="icon-btn" data-close>×</button></div><div class="field"><label>Title</label><input id="mTitle" value="${esc(r?.title||'Study')}" placeholder="Study"></div><div class="field"><label>Time</label><input id="mTime" type="time" value="${r?.time||'18:00'}"></div><div class="field"><label>Repeat</label><select id="mRepeat"><option ${r?.repeat==='Daily'?'selected':''}>Daily</option><option ${r?.repeat==='Once'?'selected':''}>Once</option></select></div><div class="field"><label>Message</label><input id="mMessage" value="${esc(r?.message||'Time for your reminder!')}"></div><div class="form-actions"><button class="ghost" data-close>Cancel</button><button class="primary" style="width:auto" id="saveReminder">Save</button></div>`);document.getElementById('saveReminder').onclick=()=>{const obj={id:r?.id||'r'+Date.now(),title:document.getElementById('mTitle').value.trim()||'Reminder',time:document.getElementById('mTime').value,repeat:document.getElementById('mRepeat').value,enabled:r?.enabled??true,message:document.getElementById('mMessage').value.trim()||'Reminder time'};if(r)Object.assign(r,obj);else state.reminders.push(obj);save();closeModal();render();toast('Reminder saved','ok')}
}
function openRoutineModal(id,tom){const arr=tom?state.tomorrow:state.routine;const r=id?arr.find(x=>x.id===id):null;modal(`<div class="modal-head"><h3>${r?'Edit':'Add'} Activity</h3><button class="icon-btn" data-close>×</button></div><div class="field"><label>Activity</label><input id="aTitle" value="${esc(r?.title||'Project Work')}"></div><div class="field"><label>Time</label><input id="aTime" type="time" value="${r?.time||'18:00'}"></div><div class="field"><label>Icon</label><input id="aIcon" value="${esc(r?.icon||'💻')}"></div><div class="form-actions"><button class="ghost" data-close>Cancel</button><button class="primary" style="width:auto" id="saveActivity">Save</button></div>`);document.getElementById('saveActivity').onclick=()=>{const obj={id:r?.id||'t'+Date.now(),title:document.getElementById('aTitle').value.trim()||'Activity',time:document.getElementById('aTime').value,icon:document.getElementById('aIcon').value||'⏰'};if(r)Object.assign(r,obj);else arr.push(obj);arr.sort((a,b)=>a.time.localeCompare(b.time));save();closeModal();render();toast('Activity saved','ok')}
}
function deleteRoutine(id,tom){if(!confirm('Delete this activity?'))return;const key=tom?'tomorrow':'routine';state[key]=state[key].filter(x=>x.id!==id);save();render()}
function toggleRoutine(id){const r=state.routine.find(x=>x.id===id);if(r){r.done=!r.done;save();render()}}
function modal(html){const d=document.createElement('div');d.className='modal-backdrop';d.id='modal';d.innerHTML=`<div class="modal">${html}</div>`;document.body.appendChild(d);d.querySelectorAll('[data-close]').forEach(x=>x.onclick=closeModal);d.onclick=e=>{if(e.target===d)closeModal()}}
function closeModal(){document.getElementById('modal')?.remove()}
async function requestNotifications(){if(!('Notification'in window)){toast('Browser notifications are not supported. Use Chrome/Edge on localhost or HTTPS.','warn');return false}try{const p=Notification.permission==='granted'?'granted':await Notification.requestPermission();state.settings.notifications=p==='granted';save();if(p==='granted'){await sendTestNotification(true);toast('Notifications enabled 🔔','ok')}else toast('Notification permission was not granted.','warn');render();return p==='granted'}catch(e){toast('Notification permission failed. Open the site on localhost/HTTPS.','warn');return false}}
async function sendTestNotification(silent=false){if(!('Notification'in window)){toast('Notifications are not supported in this browser.','warn');return false}if(Notification.permission!=='granted'){const ok=await requestNotifications();if(!ok)return false}const title='Orbito test notification';const body='Great! Browser notifications are working 🔔';try{if('serviceWorker' in navigator){const reg=await navigator.serviceWorker.ready.catch(()=>null);if(reg?.showNotification){await reg.showNotification(title,{body,icon:'assets/orbito-logo.png',tag:'orbito-test'});if(!silent)toast('Test notification sent 🔔','ok');return true}}new Notification(title,{body,icon:'assets/orbito-logo.png',tag:'orbito-test'});if(!silent)toast('Test notification sent 🔔','ok');return true}catch(e){if(!silent)toast('Notification could not be shown. Use localhost/HTTPS and allow notifications.','warn');return false}}
function logout(){if('speechSynthesis'in window)window.speechSynthesis.cancel();if(recognition)try{recognition.stop()}catch(e){}state.auth=null;state.activePage='dashboard';save();location.hash='';render();toast('Logged out','ok')}
function checkReminders(){const now=new Date();const key=todayKey();if(state.lastDate!==key){state.lastDate=key;state.fired={};save()}const hm=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;state.reminders.forEach(r=>{if(!r.enabled||r.time!==hm)return;const k=`${key}_${r.id}`;if(state.fired[k])return;state.fired[k]=true;const text=r.message||`${r.title} ka time ho gaya.`;toast(text,'ok');speak(text);if(state.settings.notifications&&'Notification'in window&&Notification.permission==='granted')sendReminderNotification(r.title,text,r.id);if(r.repeat==='Once')r.enabled=false;save()})}
async function sendReminderNotification(title,body,id){try{if('serviceWorker'in navigator){const reg=await navigator.serviceWorker.ready.catch(()=>null);if(reg?.showNotification){await reg.showNotification(`Orbito · ${title}`,{body,icon:'assets/orbito-logo.png',tag:`reminder-${id}`,renotify:true});return}}new Notification(`Orbito · ${title}`,{body,icon:'assets/orbito-logo.png',tag:`reminder-${id}`})}catch(e){console.warn('Notification failed',e)}}


let gameTimer=null,gameState={};
function startGame(id){clearInterval(gameTimer);const stage=document.getElementById('gameStage');if(!stage)return;stage.innerHTML=`<div class="game-modal card"><div class="game-modal-head"><div><span class="pill">🎮 ${id}</span><h2>${({circle:'Perfect Circle',racer:'Orbito Racer',subway:'Orbito Subway Rush',math:'Math Master',puzzle:'Puzzle Slide',memory:'Memory Match',color:'Color Tap',numbers:'Number Dash',dodge:'Dodge Zone',maze:'Maze Escape',typing:'Typing Sprint'})[id]}</h2></div><button class="icon-btn" id="closeGame">×</button></div><div id="gameBoard"></div><div class="game-score" id="gameScore">Score: 0</div></div>`;document.getElementById('closeGame').onclick=()=>{clearInterval(gameTimer);document.onkeydown=null;stage.innerHTML=''};({circle:gameCircle,racer:gameRacer,subway:gameSubway,math:gameMath,puzzle:gamePuzzle,memory:gameMemory,color:gameColor,numbers:gameNumbers,dodge:gameDodge,maze:gameMaze,typing:gameTyping})[id]();stage.scrollIntoView({behavior:'smooth',block:'start'})}
function setGameScore(v){const e=document.getElementById('gameScore');if(e)e.textContent='Score: '+v}
function gameCircle(){const b=document.getElementById('gameBoard');b.innerHTML='<p class="game-help">Hold your mouse/finger and draw one circle. The closer it is to a perfect circle, the higher your score.</p><canvas id="circleCanvas" width="700" height="360"></canvas><button class="primary game-action" id="circleReset">Try again</button>';const c=document.getElementById('circleCanvas'),ctx=c.getContext('2d');let pts=[],down=false;function pos(e){const r=c.getBoundingClientRect(),x=(e.clientX-r.left)*c.width/r.width,y=(e.clientY-r.top)*c.height/r.height;return{x,y}}function draw(){ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(0,0,c.width,c.height);if(pts.length<2)return;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle='var(--orange)';ctx.lineWidth=6;ctx.lineCap='round';ctx.stroke()}function reset(){pts=[];down=false;draw();setGameScore(0)}c.onpointerdown=e=>{down=true;pts=[pos(e)];c.setPointerCapture(e.pointerId);draw()};c.onpointermove=e=>{if(!down)return;pts.push(pos(e));draw()};c.onpointerup=()=>{if(!down)return;down=false;if(pts.length<20){setGameScore(10);return}const cx=pts.reduce((a,p)=>a+p.x,0)/pts.length,cy=pts.reduce((a,p)=>a+p.y,0)/pts.length;const rs=pts.map(p=>Math.hypot(p.x-cx,p.y-cy)),avg=rs.reduce((a,v)=>a+v,0)/rs.length;const sd=Math.sqrt(rs.reduce((a,v)=>a+(v-avg)**2,0)/rs.length);const closure=Math.hypot(pts[0].x-pts.at(-1).x,pts[0].y-pts.at(-1).y);const score=Math.max(0,Math.min(100,Math.round(100*(1-(sd/(avg||1))*1.8-(closure/(avg||1))*0.25))));setGameScore(score);toast(score>90?'Perfect! 🔥':score>70?'Great circle! 👏':'Keep practicing!','ok')};document.getElementById('circleReset').onclick=reset}
function gameSubway(){const b=document.getElementById('gameBoard');b.innerHTML='<p class="game-help">Original endless-runner: use ← → or A/D to switch lanes, collect coins and avoid trains. No copyrighted game assets are used.</p><div class="subway-board" id="subwayBoard"><div class="track-lines"></div><div class="runner" id="runner">🏃</div></div><button class="primary game-action" id="subwayStart">Start run</button>';const board=document.getElementById('subwayBoard'),runner=document.getElementById('runner');let lane=1,running=false,score=0,obs=[],coins=[];function place(){runner.style.left=(16+lane*34)+'%'}function move(e){if(!running)return;if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a')lane=Math.max(0,lane-1);if(e.key==='ArrowRight'||e.key.toLowerCase()==='d')lane=Math.min(2,lane+1);place()}document.onkeydown=move;place();document.getElementById('subwayStart').onclick=()=>{running=true;score=0;obs=[];coins=[];lane=1;place();document.getElementById('subwayStart').disabled=true;gameTimer=setInterval(()=>{score++;setGameScore(score);if(Math.random()<.17){const el=document.createElement('div');el.className='subway-obstacle';const l=Math.floor(Math.random()*3);el.style.left=(16+l*34)+'%';el.style.top='-45px';el.textContent='🚆';board.appendChild(el);obs.push({el,y:-45,l})}if(Math.random()<.2){const el=document.createElement('div');el.className='subway-coin';const l=Math.floor(Math.random()*3);el.style.left=(16+l*34)+'%';el.style.top='-30px';el.textContent='🪙';board.appendChild(el);coins.push({el,y:-30,l})}const br=board.getBoundingClientRect();obs.forEach(o=>{o.y+=8;o.el.style.top=o.y+'px';const rr=o.el.getBoundingClientRect();if(rr.bottom>br.bottom)o.dead=true;if(!o.dead&&o.l===lane&&rr.bottom>br.bottom-95&&rr.top<br.bottom-15){running=false;clearInterval(gameTimer);toast('Train hit! Score '+score,'warn');document.getElementById('subwayStart').disabled=false}});coins.forEach(o=>{o.y+=8;o.el.style.top=o.y+'px';const rr=o.el.getBoundingClientRect();if(rr.bottom>br.bottom)o.dead=true;if(!o.dead&&o.l===lane&&rr.bottom>br.bottom-100&&rr.top<br.bottom-10){o.dead=true;o.el.remove();score+=10;setGameScore(score)}});obs=obs.filter(o=>!o.dead);coins=coins.filter(o=>!o.dead)},100)} }
function gameMath(){const b=document.getElementById('gameBoard');let round=0,score=0,timer;function next(){round++;if(round>10){toast('Math Master complete! '+score+'/10 🎓','ok');return}const a=2+Math.floor(Math.random()*18),c=2+Math.floor(Math.random()*18),ops=['+','−','×'],op=ops[Math.floor(Math.random()*ops.length)],ans=op==='+'?a+c:op==='−'?a-c:a*c;let left=6;clearInterval(timer);b.innerHTML=`<p class="game-help">Solve 10 questions. You have 6 seconds each.</p><div class="math-timer" id="mathTimer">6</div><div class="math-question">${a} ${op} ${c} = ?</div><div class="math-options">${[ans,ans+(1+Math.floor(Math.random()*4))*(Math.random()<.5?-1:1),ans+(2+Math.floor(Math.random()*5))].sort(()=>Math.random()-.5).map(v=>`<button data-answer="${v}">${v}</button>`).join('')}</div>`;const finish=v=>{clearInterval(timer);if(v===ans)score++;setGameScore(score);setTimeout(next,180)};b.querySelectorAll('[data-answer]').forEach(x=>x.onclick=()=>finish(+x.dataset.answer));timer=setInterval(()=>{left--;const t=document.getElementById('mathTimer');if(t)t.textContent=left;if(left<=0)finish(null)},1000)}next()}
function gamePuzzle(){const b=document.getElementById('gameBoard');let tiles=[1,2,3,4,5,6,7,8,''];function shuffle(){tiles.sort(()=>Math.random()-.5);if(isSolved())shuffle()}function isSolved(){return tiles.join(',')==='1,2,3,4,5,6,7,8,'}function draw(){b.innerHTML='<p class="game-help">Slide the tiles into 1 → 8 order. Tap a tile next to the empty space.</p><div class="puzzle-grid">'+tiles.map((v,i)=>`<button class="puzzle-tile ${v===''?'empty':''}" data-i="${i}">${v}</button>`).join('')+'</div><button class="ghost game-action" id="puzzleShuffle">Shuffle again</button>';b.querySelectorAll('.puzzle-tile').forEach(x=>x.onclick=()=>{const i=+x.dataset.i,e=tiles.indexOf(''),r=Math.floor(i/3),c=i%3,er=Math.floor(e/3),ec=e%3;if(Math.abs(r-er)+Math.abs(c-ec)!==1)return;[tiles[i],tiles[e]]=[tiles[e],tiles[i]];draw();if(isSolved()){setGameScore(100);toast('Puzzle solved! 🧩🏆','ok')}});document.getElementById('puzzleShuffle').onclick=()=>{shuffle();draw()}}shuffle();draw()}
function gameRacer(){const b=document.getElementById('gameBoard');b.innerHTML='<p class="game-help">Use ← → or A/D. Dodge the orange blocks. Survive as long as possible.</p><div class="racer-board" id="racerBoard"><div class="car" id="car">🏎️</div></div><button class="primary game-action" id="racerStart">Start race</button>';const board=document.getElementById('racerBoard'),car=document.getElementById('car');let x=50,running=false,score=0,blocks=[];function move(e){if(!running)return;if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a')x=Math.max(8,x-6);if(e.key==='ArrowRight'||e.key.toLowerCase()==='d')x=Math.min(92,x+6);car.style.left=x+'%'}document.onkeydown=move;document.getElementById('racerStart').onclick=()=>{running=true;score=0;blocks=[];x=50;car.style.left=x+'%';document.getElementById('racerStart').disabled=true;gameTimer=setInterval(()=>{score++;setGameScore(score);if(Math.random()<.18){const ob=document.createElement('div');ob.className='road-block';ob.style.left=(8+Math.random()*84)+'%';ob.style.top='-30px';board.appendChild(ob);blocks.push({el:ob,y:-30,x:parseFloat(ob.style.left)});}blocks.forEach(o=>{o.y+=7;o.el.style.top=o.y+'px';const cr=board.getBoundingClientRect(),rr=o.el.getBoundingClientRect();if(rr.bottom>cr.bottom-35){o.el.remove();o.dead=true}if(!o.dead&&Math.abs((x/100*cr.width+cr.left)-(rr.left+rr.width/2))<35&&rr.bottom>cr.bottom-100){running=false;clearInterval(gameTimer);toast('Crash! Score '+score,'warn');document.getElementById('racerStart').disabled=false}});blocks=blocks.filter(o=>!o.dead)},120)} }
function gameMemory(){const b=document.getElementById('gameBoard'),vals=['🍊','⭐','🚀','🐼','🎮','🌈','🍕','🐸'];let cards=[...vals,...vals].sort(()=>Math.random()-.5),open=[],matched=0;b.innerHTML='<p class="game-help">Find all matching pairs.</p><div class="memory-grid">'+cards.map((x,i)=>`<button class="memory-card" data-i="${i}">?</button>`).join('')+'</div>';document.querySelectorAll('.memory-card').forEach(btn=>btn.onclick=()=>{const i=+btn.dataset.i;if(open.length===2||btn.classList.contains('matched')||open.some(o=>o.i===i))return;btn.textContent=cards[i];btn.classList.add('open');open.push({i,btn});if(open.length===2){setTimeout(()=>{if(cards[open[0].i]===cards[open[1].i]){open.forEach(o=>o.btn.classList.add('matched'));matched++;setGameScore(matched*12);if(matched===vals.length)toast('You matched them all! 🧠🏆','ok')}else open.forEach(o=>{o.btn.textContent='?';o.btn.classList.remove('open')});open=[]},450)}})}
function gameColor(){const colors=[['Red','#ff5b5b'],['Blue','#4d8dff'],['Green','#42b883'],['Yellow','#f2c94c'],['Purple','#9b6cff']];const b=document.getElementById('gameBoard');let score=0,round=0;function next(){round++;if(round>10){toast('Finished! Score '+score+'/10','ok');return}const target=colors[Math.floor(Math.random()*colors.length)];b.innerHTML=`<p class="game-help">Tap the button that is exactly <b>${target[0]}</b>.</p><div class="color-grid">${colors.map(c=>`<button data-c="${c[0]}" style="--c:${c[1]}">${c[0]}</button>`).join('')}</div>`;b.querySelectorAll('button').forEach(x=>x.onclick=()=>{if(x.dataset.c===target[0])score++;setGameScore(score);next()})}next()}
function gameNumbers(){const b=document.getElementById('gameBoard');let n=1,start=0;function reset(){n=1;start=performance.now();const nums=Array.from({length:15},(_,i)=>i+1).sort(()=>Math.random()-.5);b.innerHTML='<p class="game-help">Tap 1 → 15 as fast as possible.</p><div class="number-grid">'+nums.map(x=>`<button data-n="${x}">${x}</button>`).join('')+'</div>';b.querySelectorAll('button').forEach(x=>x.onclick=()=>{if(+x.dataset.n!==n){x.classList.add('shake');setTimeout(()=>x.classList.remove('shake'),200);return}x.disabled=true;n++;setGameScore(n-1);if(n===16){const sec=((performance.now()-start)/1000).toFixed(2);toast('Finished in '+sec+'s! ⚡','ok')}})}reset()}
function gameDodge(){const b=document.getElementById('gameBoard');b.innerHTML='<p class="game-help">Move with ← → or A/D and avoid falling blocks.</p><div class="dodge-board" id="dodgeBoard"><div class="ship" id="ship">🚀</div></div><button class="primary game-action" id="dodgeStart">Start</button>';const board=document.getElementById('dodgeBoard'),ship=document.getElementById('ship');let x=50,running=false,score=0,obs=[];document.onkeydown=e=>{if(!running)return;if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a')x=Math.max(5,x-7);if(e.key==='ArrowRight'||e.key.toLowerCase()==='d')x=Math.min(95,x+7);ship.style.left=x+'%'};document.getElementById('dodgeStart').onclick=()=>{running=true;score=0;obs=[];document.getElementById('dodgeStart').disabled=true;gameTimer=setInterval(()=>{score++;setGameScore(score);if(Math.random()<.22){const el=document.createElement('div');el.className='fall-block';el.style.left=(5+Math.random()*90)+'%';el.style.top='-20px';board.appendChild(el);obs.push({el,y:-20})}const br=board.getBoundingClientRect();obs.forEach(o=>{o.y+=8;o.el.style.top=o.y+'px';const rr=o.el.getBoundingClientRect(),sr=ship.getBoundingClientRect();if(rr.bottom>br.bottom-25)o.dead=true;if(!o.dead&&!(rr.right<sr.left||rr.left>sr.right||rr.bottom<sr.top||rr.top>sr.bottom)){running=false;clearInterval(gameTimer);toast('Game over! Score '+score,'warn');document.getElementById('dodgeStart').disabled=false}});obs=obs.filter(o=>!o.dead)},100)} }
function gameMaze(){const b=document.getElementById('gameBoard');const map=['1111111111','1000000001','1011111101','1001000001','1101011101','1001010001','1011010101','1000010101','1111111101','1111111111'];let p={x:1,y:1};b.innerHTML='<p class="game-help">Use arrow keys. Reach the green goal.</p><div class="maze" id="maze"></div>';const el=document.getElementById('maze');function draw(){el.innerHTML=map.map((row,y)=>[...row].map((v,x)=>`<span class="maze-cell ${v==='1'?'wall':''} ${p.x===x&&p.y===y?'player':''} ${x===8&&y===8?'goal':''}></span>`).join('')).join('')}function move(e){const d={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key];if(!d)return;const nx=p.x+d[0],ny=p.y+d[1];if(map[ny]?.[nx]==='0'){p={x:nx,y:ny};draw();if(p.x===8&&p.y===8){setGameScore(100);toast('Maze escaped! 🏆','ok')}}}document.onkeydown=move;draw()}
function gameTyping(){const b=document.getElementById('gameBoard');const phrases=['Orbito keeps my day perfectly in sync.','Small steps make big dreams happen.','I can learn, play and build every day.','Focus now, celebrate later.'];const text=phrases[Math.floor(Math.random()*phrases.length)];b.innerHTML=`<p class="game-help">Type the sentence below as quickly and accurately as possible.</p><div class="typing-phrase">${esc(text)}</div><input class="typing-input" id="typingInput" autocomplete="off" placeholder="Start typing…"><button class="primary game-action" id="typingStart">Start timer</button><div class="muted" id="typingResult"></div>`;const input=document.getElementById('typingInput'),start=document.getElementById('typingStart'),result=document.getElementById('typingResult');let t0=0;start.onclick=()=>{t0=performance.now();input.focus();result.textContent='Timer started…'};input.oninput=()=>{if(!t0)return;const val=input.value;if(val===text){const sec=(performance.now()-t0)/1000,wpm=Math.round(text.split(/\s+/).length/(sec/60));setGameScore(Math.max(1,wpm));result.textContent=`Completed in ${sec.toFixed(1)}s · ${wpm} WPM`;toast('Typing complete! ⌨️','ok');t0=0}}}

setInterval(checkReminders,10000);setInterval(()=>{if(state.auth)render()},60000);checkReminders();

window.addEventListener('hashchange',()=>{if(!state.auth) render()});
document.addEventListener('click',async e=>{
  const modeBtn=e.target.closest('[data-auth-mode]');
  if(modeBtn){
    const nextHash=modeBtn.dataset.authMode==='signup'?'#signup':'';
    if(location.hash!==nextHash){
      modeBtn.classList.add('auth-clicking');
      location.hash=nextHash;
      render();
    } else {
      modeBtn.classList.remove('auth-clicking');
      void modeBtn.offsetWidth;
      modeBtn.classList.add('auth-clicking');
      setTimeout(()=>modeBtn.classList.remove('auth-clicking'),220);
    }
    return;
  }
  if(e.target.closest('#switchAuth')){
    const switchBtn=e.target.closest('#switchAuth');
    const nextHash=location.hash==='#signup'?'':'#signup';
    switchBtn.classList.add('auth-clicking');
    setTimeout(()=>switchBtn.classList.remove('auth-clicking'),220);
    if(location.hash!==nextHash){ location.hash=nextHash; render(); }
    return;
  }
  const eye=e.target.closest('[data-eye]');
  if(eye){
    const input=document.getElementById(eye.dataset.eye);
    if(input) input.type=input.type==='password'?'text':'password';
    return;
  }
  if(e.target.id==='forgotAuth'){
    const email=prompt('Enter your account email address:','');
    if(!email)return;
    const key=email.trim().toLowerCase();
    const account=state.accounts[key] || (state.account && String(state.account.email||'').trim().toLowerCase()===key ? state.account : null);
    if(!account){toast('No account found with this email. Please sign up first.','warn');return;}
    const next=prompt('Enter a new password (at least 6 characters):','');
    if(!next || next.length<6){toast('Password must be at least 6 characters.','warn');return;}
    account.password=next;
    state.accounts[key]=account;
    state.account=account;
    save();
    toast('Password updated successfully. You can sign in now.','ok');
    return;
  }
  if(e.target.id==='authBtn'){
    const signup=location.hash==='#signup';
    const email=document.getElementById('email')?.value.trim().toLowerCase()||'';
    const pw=document.getElementById('password')?.value||'';
    const status=document.getElementById('authStatus');
    const setStatus=(msg,type='warn')=>{if(status){status.textContent=msg;status.dataset.type=type;} toast(msg,type);};
    if(!email || !/^\S+@\S+\.\S+$/.test(email)){setStatus('Please enter a valid email address.');return;}
    if(!pw || pw.length<6){setStatus('Password must be at least 6 characters.');return;}
    const btn=e.target;
    btn.disabled=true;
    try{
      if(signup){
        const name=document.getElementById('name')?.value.trim()||'';
        const confirm=document.getElementById('confirm')?.value||'';
        if(name.length<2){setStatus('Please enter your full name.');return;}
        if(pw!==confirm){setStatus('Passwords do not match.');return;}
        const res=await fetch('/api/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,password:pw})});
        const data=await res.json().catch(()=>({}));
        if(!res.ok){setStatus(data.error||'Unable to create account. Please try again.');return;}
        state.account=data.account;
        state.accounts={...(state.accounts||{}),[email]:data.account};
        state.auth=null;
        state.onboardingDone=false;
        save();
        location.hash='';
        render();
        toast(data.emailSent?'Account created and confirmation email sent.':'Account created successfully. Please sign in.','ok');
        return;
      }
      const res=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})});
      const data=await res.json().catch(()=>({}));
      if(!res.ok){setStatus(data.error||'Unable to sign in. Please try again.');return;}
      state.account=data.account;
      state.accounts={...(state.accounts||{}),[email]:data.account};
      state.auth=data.account;
      save();
      location.hash='';
      render();
      toast('Welcome back!','ok');
    }catch(err){
      setStatus('Unable to connect to Orbito server. Please make sure npm run dev is running.');
    }finally{btn.disabled=false;}
    return;
  }
});
if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('sw.js').catch(()=>{});
render();
