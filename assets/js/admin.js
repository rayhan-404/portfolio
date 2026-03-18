// admin.js — Phase 7 (uses openSheet/closeSheet from app.js)
import { isFirstSetup,setupAdmin,verifyPassword,isAuthenticated,setAuthenticated,lockAdmin,getPAT,getUsername,getRepoName,clearUsernameCache,resetAdmin } from './auth.js';
import { getUserRepos,getRepoContents,createRepo,pushFile,getFileSha } from './github-api.js';
import { showToast,openSheet,closeSheet } from './app.js';
import { formatDate } from './utils.js';

function getRoot(){return document.getElementById('admin-root');}
function setSaving(btn,on){if(!btn)return;if(on){btn.disabled=true;btn._o=btn.innerHTML;btn.innerHTML='<span class="spinner" style="width:18px;height:18px;border-width:2px;border-color:rgba(255,255,255,.3);border-top-color:white;"></span> Saving...';}else{btn.disabled=false;if(btn._o)btn.innerHTML=btn._o;}}
async function confirmDelete(msg){return new Promise(r=>{const d=document.createElement('div');d.className='confirm-dialog';d.innerHTML=`<div class="confirm-box"><div class="confirm-title">Confirm Delete</div><div class="confirm-msg">${msg}</div><div class="confirm-actions"><button class="btn-ghost" style="height:40px;padding:0 16px;" id="cc">Cancel</button><button class="btn-danger" id="co">Delete</button></div></div>`;document.body.appendChild(d);d.querySelector('#cc').onclick=()=>{d.remove();r(false);};d.querySelector('#co').onclick=()=>{d.remove();r(true);};})}
async function pushDataFile(path,data,msg){const t=getPAT(),u=await getUsername(),rp=getRepoName();if(!t||!u)throw new Error('PAT or username missing');const c=JSON.stringify(data,null,2),s=await getFileSha(u,rp,path,t);await pushFile(u,rp,path,c,msg,s,t);}

// SETUP
function renderSetup(){
  getRoot().innerHTML=`<div class="auth-screen">
    <div class="auth-logo"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg></div>
    <div class="auth-title">Admin Setup</div>
    <p class="auth-subtitle">Set a password and GitHub PAT to enable admin features.</p>
    <div class="auth-card">
      <div class="form-group"><label class="form-label">Password *</label><div class="pw-wrap"><input id="s-pw" type="password" class="field" placeholder="Min 6 characters" /></div></div>
      <div class="form-group"><label class="form-label">Confirm Password *</label><div class="pw-wrap"><input id="s-pw2" type="password" class="field" placeholder="Repeat password" /></div></div>
      <div class="form-group"><label class="form-label">GitHub PAT *</label><div class="pw-wrap"><input id="s-pat" type="password" class="field" placeholder="github_pat_... or ghp_..." /></div>
        <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener" class="pat-help">How to get a GitHub PAT →</a>
      </div>
      <div class="form-group"><label class="form-label">Repo Name</label><input id="s-repo" type="text" class="field" value="portfolio" /></div>
      <button id="s-btn" class="btn-filled" style="width:100%;height:50px;">Set Up Admin</button>
    </div></div>`;
  document.getElementById('s-btn')?.addEventListener('click',async()=>{
    const pw=document.getElementById('s-pw')?.value.trim(),pw2=document.getElementById('s-pw2')?.value.trim(),pat=document.getElementById('s-pat')?.value.trim(),repo=document.getElementById('s-repo')?.value.trim()||'portfolio';
    if(!pw||pw.length<6){showToast('Password must be at least 6 characters','error');return;}
    if(pw!==pw2){showToast('Passwords do not match','error');document.getElementById('s-pw2')?.classList.add('input-shake');setTimeout(()=>document.getElementById('s-pw2')?.classList.remove('input-shake'),500);return;}
    if(!pat||(!pat.startsWith('github_pat_')&&!pat.startsWith('ghp_'))){showToast('Invalid PAT format','error');return;}
    await setupAdmin(pw,pat,repo);setAuthenticated();showToast('Admin setup complete! 🎉','success');renderPanel();
  });
}

// LOGIN
function renderLogin(){
  getRoot().innerHTML=`<div class="auth-screen">
    <div class="auth-logo"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg></div>
    <div class="auth-title">Admin 🔐</div>
    <p class="auth-subtitle">Enter your password to continue.</p>
    <div class="auth-card">
      <div class="form-group"><label class="form-label">Password</label><div class="pw-wrap"><input id="l-pw" type="password" class="field" placeholder="Your admin password" autofocus /></div></div>
      <button id="l-btn" class="btn-filled" style="width:100%;height:50px;">Unlock</button>
      <button id="l-reset" class="btn-ghost" style="width:100%;height:40px;font-size:12px;margin-top:4px;">Forgot password? Reset Admin</button>
    </div></div>`;
  const pw=document.getElementById('l-pw');
  pw?.addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('l-btn')?.click();});
  document.getElementById('l-btn')?.addEventListener('click',async()=>{
    const ok=await verifyPassword(pw?.value||'');
    if(ok){setAuthenticated();renderPanel();}
    else{showToast('Wrong password','error');pw?.classList.add('input-shake');setTimeout(()=>pw?.classList.remove('input-shake'),500);pw.value='';}
  });
  document.getElementById('l-reset')?.addEventListener('click',async()=>{
    if(await confirmDelete('This will delete your password and PAT. Continue?')){resetAdmin();showToast('Admin reset','info');renderSetup();}
  });
}

// PANEL
function renderPanel(){
  getRoot().innerHTML=`<div class="admin-panel">
    <div class="admin-topbar"><div class="admin-title">Admin <em>Panel</em></div>
      <button id="lock-btn" class="lock-btn"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg> Lock</button>
    </div>
    <div class="admin-tabs">
      <button class="admin-tab active" data-tab="profile">Profile</button>
      <button class="admin-tab" data-tab="tracking">Tracking</button>
      <button class="admin-tab" data-tab="repos">Repos</button>
      <button class="admin-tab" data-tab="blog">Blog</button>
      <button class="admin-tab" data-tab="certs">Certs</button>
    </div>
    <div id="tab-profile" class="admin-content active"></div>
    <div id="tab-tracking" class="admin-content"></div>
    <div id="tab-repos" class="admin-content"></div>
    <div id="tab-blog" class="admin-content"></div>
    <div id="tab-certs" class="admin-content"></div>
  </div>`;
  document.getElementById('lock-btn')?.addEventListener('click',()=>{lockAdmin();showToast('Locked 🔒','info');renderLogin();});
  const inited=new Set();
  function sw(tab){
    document.querySelectorAll('.admin-tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===tab));
    document.querySelectorAll('.admin-content').forEach(p=>p.classList.toggle('active',p.id===`tab-${tab}`));
    if(!inited.has(tab)){inited.add(tab);
      if(tab==='profile')initProfile();if(tab==='tracking')initTracking();if(tab==='repos')initRepos();if(tab==='blog')initBlog();if(tab==='certs')initCerts();
    }
  }
  document.querySelectorAll('.admin-tab').forEach(b=>b.addEventListener('click',()=>sw(b.dataset.tab)));
  sw('profile');
}

// TAB 1: PROFILE
async function initProfile(){
  const p=document.getElementById('tab-profile');p.innerHTML=`<div class="page-loading"><div class="spinner"></div></div>`;
  let d={};try{d=await(await fetch('data/profile.json')).json();}catch{}
  p.innerHTML=`<div class="admin-section">
    <div class="form-group"><label class="form-label">GitHub Username *</label><input id="p-un" type="text" class="field" value="${d.username||''}" placeholder="your-github-username" /></div>
    <div class="form-group"><label class="form-label">Name</label><input id="p-nm" type="text" class="field" value="${d.name||''}" /></div>
    <div class="form-group"><label class="form-label">Bio</label><textarea id="p-bio" class="field" rows="2">${d.bio||''}</textarea></div>
    <div class="form-group"><label class="form-label">Avatar URL</label><input id="p-av" type="url" class="field" value="${d.avatar||''}" /></div>
    <div class="form-group"><label class="form-label">Location</label><input id="p-loc" type="text" class="field" value="${d.location||''}" /></div>
    <div class="form-group"><label class="form-label">University</label><input id="p-uni" type="text" class="field" value="${d.university||''}" /></div>
    <div class="form-group"><label class="form-label">GitHub URL</label><input id="p-gh" type="url" class="field" value="${d.social?.github||''}" /></div>
    <div class="form-group"><label class="form-label">Facebook URL</label><input id="p-fb" type="url" class="field" value="${d.social?.facebook||''}" /></div>
    <div class="form-group"><label class="form-label">WhatsApp</label><input id="p-wa" type="url" class="field" value="${d.social?.whatsapp||''}" /></div>
    <div class="form-group"><label class="form-label">LinkedIn</label><input id="p-li" type="url" class="field" value="${d.social?.linkedin||''}" /></div>
    <div class="form-group"><label class="form-label">Formspree URL</label><input id="p-fs" type="url" class="field" value="${d.formspree||''}" /></div>
    <div class="form-group"><label class="form-label">Roles (comma-separated)</label><input id="p-ro" type="text" class="field" value="${(d.roles||[]).join(', ')}" /></div>
    <div class="form-group"><label class="form-label">Skills (comma-separated)</label><input id="p-sk" type="text" class="field" value="${(d.skills||[]).join(', ')}" /></div>
    <div class="admin-save-row"><button id="p-sv" class="btn-filled">Save Profile</button></div>
  </div>`;
  document.getElementById('p-sv')?.addEventListener('click',async()=>{
    const btn=document.getElementById('p-sv');setSaving(btn,true);
    const v=id=>document.getElementById(id)?.value.trim()||'';
    try{await pushDataFile('data/profile.json',{username:v('p-un'),name:v('p-nm'),bio:v('p-bio'),avatar:v('p-av'),location:v('p-loc'),university:v('p-uni'),roles:v('p-ro').split(',').map(s=>s.trim()).filter(Boolean),skills:v('p-sk').split(',').map(s=>s.trim()).filter(Boolean),social:{github:v('p-gh'),facebook:v('p-fb'),whatsapp:v('p-wa'),linkedin:v('p-li')},formspree:v('p-fs')},'Update profile');clearUsernameCache();showToast('Profile saved! ✅','success');}
    catch(e){showToast(`Failed: ${e.message}`,'error');}setSaving(btn,false);
  });
}

// TAB 2: TRACKING
async function initTracking(){
  const p=document.getElementById('tab-tracking');let d={};try{d=await(await fetch('data/tracking.json')).json();}catch{}
  const pct=d.progress??0;
  p.innerHTML=`<div class="admin-section">
    <div class="form-group"><label class="form-label">Topic *</label><input id="t-tp" type="text" class="field" value="${d.topic||''}" /></div>
    <div class="form-group"><label class="form-label">Progress</label><div class="range-wrap"><input id="t-pr" type="range" min="0" max="100" value="${pct}" /><span id="t-pv" class="range-val">${pct}%</span></div></div>
    <div class="form-group"><label class="form-label">Start Date</label><input id="t-dt" type="date" class="field" value="${d.startDate||''}" /></div>
    <div class="form-group"><label class="form-label">Resource URL</label><input id="t-ru" type="url" class="field" value="${d.resource||''}" /></div>
    <div class="form-group"><label class="form-label">Resource Label</label><input id="t-rl" type="text" class="field" value="${d.resourceLabel||''}" /></div>
    <div class="admin-save-row"><button id="t-sv" class="btn-filled">Save</button></div>
  </div>`;
  document.getElementById('t-pr')?.addEventListener('input',e=>{document.getElementById('t-pv').textContent=`${e.target.value}%`;});
  document.getElementById('t-sv')?.addEventListener('click',async()=>{
    const btn=document.getElementById('t-sv');setSaving(btn,true);
    const v=id=>document.getElementById(id)?.value.trim()||'';
    try{await pushDataFile('data/tracking.json',{topic:v('t-tp'),progress:Number(document.getElementById('t-pr')?.value)||0,startDate:v('t-dt'),resource:v('t-ru'),resourceLabel:v('t-rl')},'Update tracking');showToast('Saved! ✅','success');}
    catch(e){showToast(`Failed: ${e.message}`,'error');}setSaving(btn,false);
  });
}

// TAB 3: REPOS
async function initRepos(){
  const p=document.getElementById('tab-repos'),u=await getUsername();
  if(!u){p.innerHTML=`<div class="admin-section"><p style="color:var(--on-sv);font-size:14px;">Set GitHub username in Profile tab first.</p></div>`;return;}
  await renderRepoList(p,u);
}
async function renderRepoList(p,u){
  p.innerHTML=`<div class="admin-section"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;"><span style="font-family:var(--font-heading);font-weight:700;color:var(--on-s);">Repos</span><button id="nr-open" class="btn-tonal" style="height:34px;padding:0 12px;font-size:12px;">+ New Repo</button></div><div id="rli"><div class="spinner" style="margin:16px auto;display:block;"></div></div></div>`;
  document.getElementById('nr-open')?.addEventListener('click',()=>{openSheet('new-repo-sheet-scrim');initNewRepo(u,p);});
  try{
    const repos=await getUserRepos(u,getPAT(),30,'updated');
    const c=document.getElementById('rli');
    if(!repos.length){c.innerHTML=`<p style="color:var(--on-sv);font-size:13px;">No repos found.</p>`;return;}
    c.innerHTML=repos.map(r=>`<div class="admin-list-item" style="margin-bottom:8px;"><div class="admin-list-info"><div class="admin-list-title">${r.private?'🔒 ':'📁 '}${r.name}</div></div><button class="btn-tonal" style="height:32px;padding:0 10px;font-size:12px;" data-repo="${r.name}">Open</button></div>`).join('');
    c.querySelectorAll('button[data-repo]').forEach(b=>b.addEventListener('click',()=>renderRepoEditor(p,u,b.dataset.repo)));
  }catch(e){document.getElementById('rli').innerHTML=`<p style="color:var(--on-sv);font-size:13px;">${e.message}</p>`;}
}
function initNewRepo(u,p){
  const btn=document.getElementById('create-repo-btn');if(!btn||btn._i)return;btn._i=true;
  btn.addEventListener('click',async()=>{
    const n=document.getElementById('new-repo-name')?.value.trim();if(!n){showToast('Name required','error');return;}
    setSaving(btn,true);try{await createRepo(n,document.getElementById('new-repo-desc')?.value.trim(),document.getElementById('new-repo-private')?.checked,getPAT());closeSheet('new-repo-sheet-scrim');showToast(`Repo "${n}" created! ✅`,'success');renderRepoList(p,u);}catch(e){showToast(`Failed: ${e.message}`,'error');}setSaving(btn,false);
  });
}
async function renderRepoEditor(p,u,rn){
  p.innerHTML=`<div class="admin-section"><div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;"><button id="rb" class="rv-back-btn"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg></button><span style="font-family:var(--font-heading);font-weight:700;color:var(--pri);flex:1;">${rn}</span><button id="pf-open" class="btn-tonal" style="height:32px;padding:0 10px;font-size:12px;">+ Push File</button></div><div id="ref"><div class="spinner" style="margin:16px auto;display:block;"></div></div></div>`;
  document.getElementById('rb')?.addEventListener('click',()=>renderRepoList(p,u));
  document.getElementById('pf-open')?.addEventListener('click',()=>{openSheet('new-file-sheet-scrim');initPushFile(u,rn);});
  try{const c=await getRepoContents(u,rn,'','main',getPAT());const items=Array.isArray(c)?c:[c];document.getElementById('ref').innerHTML=`<div style="background:var(--s2);border-radius:12px;overflow:hidden;">${items.map(f=>`<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--out-v);font-family:var(--font-code);font-size:12px;color:var(--on-sv);">${f.type==='dir'?'📁':'📄'} ${f.name}${f.size?`<span style="margin-left:auto;font-size:11px;color:var(--out);">${(f.size/1024).toFixed(1)} KB</span>`:''}</div>`).join('')}</div>`;}
  catch(e){document.getElementById('ref').innerHTML=`<p style="color:var(--on-sv);font-size:13px;">${e.message}</p>`;}
}
function initPushFile(u,rn){
  const btn=document.getElementById('push-file-btn');if(!btn||btn._i)return;btn._i=true;
  btn.addEventListener('click',async()=>{
    const path=document.getElementById('new-file-path')?.value.trim(),content=document.getElementById('new-file-content')?.value,msg=document.getElementById('new-file-commit')?.value.trim()||'Add file';
    if(!path||!content){showToast('Path and content required','error');return;}
    setSaving(btn,true);try{const s=await getFileSha(u,rn,path,getPAT());await pushFile(u,rn,path,content,msg,s,getPAT());closeSheet('new-file-sheet-scrim');showToast(`Pushed "${path}" ✅`,'success');document.getElementById('new-file-path').value='';document.getElementById('new-file-content').value='';}
    catch(e){showToast(`Failed: ${e.message}`,'error');}setSaving(btn,false);
  });
}

// TAB 4: BLOG
async function initBlog(){await renderBlogList(document.getElementById('tab-blog'));}
async function renderBlogList(p){
  p.innerHTML=`<div class="admin-section"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;"><span style="font-family:var(--font-heading);font-weight:700;color:var(--on-s);">Blog Posts</span><button id="nb-open" class="btn-tonal" style="height:34px;padding:0 12px;font-size:12px;">+ New Post</button></div><div id="bli"><div class="spinner" style="margin:16px auto;display:block;"></div></div></div>`;
  document.getElementById('nb-open')?.addEventListener('click',()=>openPostSheet(null,p));
  let posts=[];try{posts=(await(await fetch('data/blog-posts.json')).json()).sort((a,b)=>new Date(b.date)-new Date(a.date));}catch{}
  const c=document.getElementById('bli');
  if(!posts.length){c.innerHTML=`<p style="color:var(--on-sv);font-size:13px;">No posts yet.</p>`;return;}
  c.innerHTML=posts.map(post=>`<div class="admin-list-item" style="margin-bottom:8px;"><div class="admin-list-info"><div class="admin-list-title">${post.title}</div><div class="admin-list-meta">${formatDate(post.date)}</div></div><div class="admin-list-actions"><button class="admin-icon-btn ep" data-id="${post.id}"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button><button class="admin-icon-btn del dp" data-id="${post.id}"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></div></div>`).join('');
  c.querySelectorAll('.ep').forEach(b=>b.addEventListener('click',()=>openPostSheet(posts.find(x=>x.id===b.dataset.id),p)));
  c.querySelectorAll('.dp').forEach(b=>b.addEventListener('click',async()=>{const post=posts.find(x=>x.id===b.dataset.id);if(!(await confirmDelete(`Delete "${post?.title}"?`)))return;try{await pushDataFile('data/blog-posts.json',posts.filter(x=>x.id!==b.dataset.id),`Delete: ${post?.title}`);showToast('Deleted ✅','success');renderBlogList(p);}catch(e){showToast(`Failed: ${e.message}`,'error');}}));
}
function openPostSheet(ex,p){
  document.getElementById('blog-sheet-title').textContent=ex?'Edit Post':'New Post';
  document.getElementById('blog-edit-id').value=ex?.id||'';
  document.getElementById('blog-title').value=ex?.title||'';
  document.getElementById('blog-tags').value=(ex?.tags||[]).join(', ');
  document.getElementById('blog-reading-time').value=ex?.readingTime||'';
  document.getElementById('blog-excerpt').value=ex?.excerpt||'';
  document.getElementById('blog-content').value=ex?.content||'';
  openSheet('blog-sheet-scrim');
  const btn=document.getElementById('blog-publish-btn');
  btn._h&&btn.removeEventListener('click',btn._h);
  btn._h=async()=>{
    const t=document.getElementById('blog-title')?.value.trim(),ct=document.getElementById('blog-content')?.value.trim();
    if(!t||!ct){showToast('Title and content required','error');return;}
    setSaving(btn,true);
    try{let ps=await(await fetch('data/blog-posts.json')).json();const eid=document.getElementById('blog-edit-id')?.value;const np={id:eid||String(Date.now()),title:t,date:eid?(ps.find(x=>x.id===eid)?.date||new Date().toISOString().split('T')[0]):new Date().toISOString().split('T')[0],tags:(document.getElementById('blog-tags')?.value||'').split(',').map(s=>s.trim()).filter(Boolean),excerpt:document.getElementById('blog-excerpt')?.value.trim()||ct.slice(0,120)+'...',content:ct,readingTime:document.getElementById('blog-reading-time')?.value.trim()||`${Math.ceil(ct.split(' ').length/200)} min`};ps=eid?ps.map(x=>x.id===eid?np:x):[np,...ps];await pushDataFile('data/blog-posts.json',ps,`${eid?'Update':'Add'} post: ${t}`);closeSheet('blog-sheet-scrim');showToast(`Post ${eid?'updated':'published'} ✅`,'success');renderBlogList(p);}
    catch(e){showToast(`Failed: ${e.message}`,'error');}setSaving(btn,false);
  };
  btn.addEventListener('click',btn._h);
}

// TAB 5: CERTS
async function initCerts(){await renderCertList(document.getElementById('tab-certs'));}
async function renderCertList(p){
  p.innerHTML=`<div class="admin-section"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;"><span style="font-family:var(--font-heading);font-weight:700;color:var(--on-s);">Certifications</span><button id="nc-open" class="btn-tonal" style="height:34px;padding:0 12px;font-size:12px;">+ Add</button></div><div id="cli"><div class="spinner" style="margin:16px auto;display:block;"></div></div></div>`;
  document.getElementById('nc-open')?.addEventListener('click',()=>openCertSheet(null,p));
  let certs=[];try{certs=(await(await fetch('data/certifications.json')).json()).sort((a,b)=>new Date(b.date)-new Date(a.date));}catch{}
  const c=document.getElementById('cli');
  if(!certs.length){c.innerHTML=`<p style="color:var(--on-sv);font-size:13px;">No certs yet.</p>`;return;}
  c.innerHTML=certs.map(cert=>`<div class="admin-list-item" style="margin-bottom:8px;border-left:3px solid ${cert.color||'var(--pri)'};border-radius:var(--r-md);"><div class="admin-list-info"><div class="admin-list-title">${cert.name}</div><div class="admin-list-meta">${cert.issuer} · ${formatDate(cert.date)}</div></div><div class="admin-list-actions"><button class="admin-icon-btn ec" data-id="${cert.id}"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button><button class="admin-icon-btn del dc" data-id="${cert.id}"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></div></div>`).join('');
  c.querySelectorAll('.ec').forEach(b=>b.addEventListener('click',()=>openCertSheet(certs.find(x=>x.id===b.dataset.id),p)));
  c.querySelectorAll('.dc').forEach(b=>b.addEventListener('click',async()=>{const cert=certs.find(x=>x.id===b.dataset.id);if(!(await confirmDelete(`Delete "${cert?.name}"?`)))return;try{await pushDataFile('data/certifications.json',certs.filter(x=>x.id!==b.dataset.id),`Delete: ${cert?.name}`);showToast('Deleted ✅','success');renderCertList(p);}catch(e){showToast(`Failed: ${e.message}`,'error');}}));
}
function openCertSheet(ex,p){
  document.getElementById('cert-sheet-title').textContent=ex?'Edit Certification':'Add Certification';
  document.getElementById('cert-edit-id').value=ex?.id||'';document.getElementById('cert-name').value=ex?.name||'';document.getElementById('cert-issuer').value=ex?.issuer||'';document.getElementById('cert-date').value=ex?.date||'';document.getElementById('cert-color').value=ex?.color||'#1A6B3F';document.getElementById('cert-verify-url').value=ex?.verifyUrl||'';
  openSheet('cert-sheet-scrim');
  const btn=document.getElementById('cert-save-btn');
  btn._h&&btn.removeEventListener('click',btn._h);
  btn._h=async()=>{
    const n=document.getElementById('cert-name')?.value.trim(),i=document.getElementById('cert-issuer')?.value.trim();
    if(!n||!i){showToast('Name and issuer required','error');return;}
    setSaving(btn,true);
    try{let cs=await(await fetch('data/certifications.json')).json();const eid=document.getElementById('cert-edit-id')?.value;const nc={id:eid||String(Date.now()),name:n,issuer:i,date:document.getElementById('cert-date')?.value||'',color:document.getElementById('cert-color')?.value||'#1A6B3F',verifyUrl:document.getElementById('cert-verify-url')?.value.trim()||''};cs=eid?cs.map(x=>x.id===eid?nc:x):[nc,...cs];await pushDataFile('data/certifications.json',cs,`${eid?'Update':'Add'} cert: ${n}`);closeSheet('cert-sheet-scrim');showToast(`Cert ${eid?'updated':'added'} ✅`,'success');renderCertList(p);}
    catch(e){showToast(`Failed: ${e.message}`,'error');}setSaving(btn,false);
  };
  btn.addEventListener('click',btn._h);
}

export async function init(){
  if(isFirstSetup())renderSetup();
  else if(!isAuthenticated())renderLogin();
  else renderPanel();
}
