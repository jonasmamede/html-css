const LS_KEYS = {SESSION:'ea_session', EVENTS:'ea_events'}
const el = id=>document.getElementById(id)

function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}

function saveEvents(events){localStorage.setItem(LS_KEYS.EVENTS,JSON.stringify(events))}
function loadEvents(){return JSON.parse(localStorage.getItem(LS_KEYS.EVENTS)||'[]')}

function saveSession(s){localStorage.setItem(LS_KEYS.SESSION,JSON.stringify(s))}
function loadSession(){return JSON.parse(localStorage.getItem(LS_KEYS.SESSION)||'null')}

function init(){renderSessionArea();renderTabs();renderList();renderCreate();renderProfile();renderDashboard()}

function renderSessionArea(){const target=el('session-area');const s=loadSession();if(!s){target.innerHTML=`<div><select id="role"><option>Aluno</option><option>Professor</option><option>Coordenacao</option></select> <input id="name" placeholder="Seu nome" /> <button id="btn-login" class="btn">Entrar</button></div>`;document.getElementById('btn-login').onclick=()=>{const name=document.getElementById('name').value.trim();const role=document.getElementById('role').value; if(!name) return alert('Informe nome'); saveSession({name,role}); init()}}else{target.innerHTML=`<div class="muted">${s.name} • ${s.role}</div> <button id="btn-logout" class="btn ghost">Sair</button>`;document.getElementById('btn-logout').onclick=()=>{localStorage.removeItem(LS_KEYS.SESSION); init()}}}

function switchView(name){document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('active',b.dataset.view===name));el('view-'+name).classList.remove('hidden')}

function renderTabs(){document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>switchView(b.dataset.view));}

function renderList(){const container=el('view-list');const events=loadEvents();const s=loadSession();container.innerHTML='';
if(events.length===0){container.innerHTML='<div class="card">Nenhum evento cadastrado.</div>';return}
events.sort((a,b)=>a.date.localeCompare(b.date)).forEach(ev=>{
  const div=document.createElement('div');div.className='card event-item';
  const left=document.createElement('div');
  left.innerHTML=`<strong>${ev.title}</strong><div class="meta">${ev.date} • ${ev.owner}</div><p class="muted">${ev.description}</p><div class="meta">Vagas: ${ev.registrants.length}/${ev.maxSlots}</div>`
  const right=document.createElement('div');
  if(s && s.role==='Aluno'){
    const enrolled=ev.registrants.includes(s.name);
    const btn=document.createElement('button');btn.className='btn';btn.textContent=enrolled? 'Cancelar' : 'Inscrever';btn.onclick=()=>{if(enrolled) cancelEnroll(ev.id); else enroll(ev.id)};right.appendChild(btn)
  }
  if(s && (s.role==='Professor' && s.name===ev.owner)){
    const edit=document.createElement('button');edit.className='btn ghost';edit.textContent='Editar';edit.onclick=()=>openEdit(ev.id);right.appendChild(edit);
    const list=document.createElement('button');list.className='btn';list.textContent='Inscritos';list.onclick=()=>openRegistrants(ev.id);right.appendChild(list);
    const del=document.createElement('button');del.className='btn ghost';del.textContent='Excluir';del.onclick=()=>{if(confirm('Remover evento?')) removeEvent(ev.id)};right.appendChild(del);
  }
  if(s && s.role==='Coordenacao'){
    const stats=document.createElement('button');stats.className='btn ghost';stats.textContent='Ver inscritos';stats.onclick=()=>openRegistrants(ev.id);right.appendChild(stats);
    const del=document.createElement('button');del.className='btn';del.textContent='Remover';del.onclick=()=>{if(confirm('Remover evento?')) removeEvent(ev.id)};right.appendChild(del);
  }
  div.appendChild(left);div.appendChild(right);container.appendChild(div);
})}

function renderCreate(){const container=el('view-create');const s=loadSession();if(!s || s.role!=='Professor'){container.innerHTML='<div class="card">Apenas Professores podem criar eventos.</div>';return}
container.innerHTML=`<div class="card"><form id="form-create"><label>Título</label><input id="ev-title" required type="text" /><label>Descrição</label><textarea id="ev-desc"></textarea><label>Data</label><input id="ev-date" type="date" required /><label>Vagas máximas</label><input id="ev-slots" type="number" min="1" value="20" required /><div style="margin-top:8px"><button class="btn">Salvar</button></div></form></div>`
document.getElementById('form-create').onsubmit=e=>{e.preventDefault();const events=loadEvents();const ev={id:uid(),title:el('ev-title').value,description:el('ev-desc').value,date:el('ev-date').value,maxSlots:parseInt(el('ev-slots').value,10),owner:s.name,registrants:[]};events.push(ev);saveEvents(events);renderList();switchView('list')}
}

function openEdit(id){const events=loadEvents();const ev=events.find(x=>x.id===id);if(!ev) return;showModal(`<h3>Editar</h3><form id="edit-form"><label>Título</label><input id="edit-title" value="${ev.title}" /><label>Descrição</label><textarea id="edit-desc">${ev.description}</textarea><label>Data</label><input id="edit-date" type="date" value="${ev.date}" /><label>Vagas</label><input id="edit-slots" type="number" value="${ev.maxSlots}" /><div style="margin-top:8px"><button class="btn">Salvar</button> <button type="button" id="cancel" class="btn ghost">Fechar</button></div></form>`)
document.getElementById('edit-form').onsubmit=e=>{e.preventDefault();ev.title=el('edit-title').value;ev.description=el('edit-desc').value;ev.date=el('edit-date').value;ev.maxSlots=parseInt(el('edit-slots').value,10);saveEvents(events);closeModal();renderList()}
document.getElementById('cancel').onclick=closeModal}

function openRegistrants(id){const events=loadEvents();const ev=events.find(x=>x.id===id);if(!ev) return;let html=`<h3>Inscritos - ${ev.title}</h3><div>`;if(ev.registrants.length===0) html+='<div class="card">Nenhum inscrito.</div>';else ev.registrants.forEach(r=>{html+=`<div class="card"><div style="display:flex;justify-content:space-between"><div>${r}</div><div><button class="btn ghost" data-name="${r}">Remover</button></div></div></div>`});html+=`</div><div style="margin-top:8px"><button id="close-reg" class="btn ghost">Fechar</button></div>`;showModal(html);document.querySelectorAll('[data-name]').forEach(b=>b.onclick=()=>{const who=b.dataset.name; if(confirm('Remover inscrito?')){ev.registrants=ev.registrants.filter(x=>x!==who);saveEvents(events); closeModal(); openRegistrants(id)}});document.getElementById('close-reg').onclick=closeModal}

function enroll(id){const s=loadSession();if(!s){alert('Entre primeiro');return}const events=loadEvents();const ev=events.find(x=>x.id===id);if(!ev) return;if(ev.registrants.includes(s.name)){alert('Já inscrito');return}if(ev.registrants.length>=ev.maxSlots){alert('Evento cheio');return}ev.registrants.push(s.name);saveEvents(events);renderList();}
function cancelEnroll(id){const s=loadSession();if(!s) return;const events=loadEvents();const ev=events.find(x=>x.id===id);if(!ev) return;ev.registrants=ev.registrants.filter(x=>x!==s.name);saveEvents(events);renderList();}

function removeEvent(id){const events=loadEvents();saveEvents(events.filter(e=>e.id!==id));renderList();renderDashboard();}

function renderProfile(){const container=el('view-profile');const s=loadSession();if(!s){container.innerHTML='<div class="card">Faça login para ver seu perfil.</div>';return}
const events=loadEvents();if(s.role==='Aluno'){const mine=events.filter(e=>e.registrants.includes(s.name));if(mine.length===0) container.innerHTML='<div class="card">Você não está inscrito em nenhum evento.</div>';else{container.innerHTML='';mine.forEach(ev=>{const d=document.createElement('div');d.className='card';d.innerHTML=`<strong>${ev.title}</strong><div class="meta">${ev.date} • ${ev.owner}</div><div style="margin-top:8px"><button class="btn" data-id="${ev.id}">Cancelar inscrição</button></div>`;container.appendChild(d)});container.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{if(confirm('Cancelar inscrição?')){cancelEnroll(b.dataset.id);renderProfile()}})} } else if(s.role==='Professor'){const mine=events.filter(e=>e.owner===s.name);if(mine.length===0) container.innerHTML='<div class="card">Você não criou eventos ainda.</div>';else{container.innerHTML='';mine.forEach(ev=>{const d=document.createElement('div');d.className='card';d.innerHTML=`<strong>${ev.title}</strong><div class="meta">${ev.date} • ${ev.registrants.length}/${ev.maxSlots} inscritos</div><div style="margin-top:8px"><button class="btn ghost" data-edit="${ev.id}">Editar</button><button class="btn" data-reg="${ev.id}">Ver inscritos</button></div>`;container.appendChild(d)});container.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openEdit(b.dataset.edit));container.querySelectorAll('[data-reg]').forEach(b=>b.onclick=()=>openRegistrants(b.dataset.reg))} } else {container.innerHTML='<div class="card">Coordenação: use o Dashboard.</div>'} }

function renderDashboard(){const container=el('view-dashboard');const s=loadSession();if(!s || s.role!=='Coordenacao'){container.innerHTML='<div class="card">Acesso restrito à Coordenação.</div>';return}
const events=loadEvents();const totalEvents=events.length;const totalInscritos=events.reduce((a,e)=>a+e.registrants.length,0);const mostFilled=[...events].sort((a,b)=> (b.registrants.length/b.maxSlots) - (a.registrants.length/a.maxSlots)).slice(0,3);
let html=`<div class="card"><strong>Estatísticas</strong><div class="meta">Total eventos: ${totalEvents}</div><div class="meta">Total inscritos: ${totalInscritos}</div></div>`;
if(mostFilled.length) html+=mostFilled.map(e=>`<div class="card"><strong>${e.title}</strong><div class="meta">${e.registrants.length}/${e.maxSlots} • ${Math.round((e.registrants.length/e.maxSlots)*100)}%</div><div style="margin-top:8px"><button class="btn" data-remove="${e.id}">Remover</button></div></div>`).join('');container.innerHTML=html;container.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{if(confirm('Remover evento?')){removeEvent(b.dataset.remove);renderDashboard()}})}

/* modal helpers */
function showModal(html){const m=document.createElement('div');m.className='modal';m.innerHTML=`<div class="panel">${html}</div>`;document.getElementById('modals').appendChild(m);}
function closeModal(){const mod=document.getElementById('modals');mod.innerHTML=''}

init();
