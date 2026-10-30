const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cfg={theme:localStorage.getItem('nv-theme')||'dark',siteTheme:"normal",animations:localStorage.getItem('nv-animations')!=='false',font:Number(localStorage.getItem('nv-font')||18)};
let db,stories=[],isAdmin=false,user=null,activeStory=null,activeChapter=0,page=0,pages=[],timer;
const validCover=u=>typeof u==='string'&&/^https:\/\//i.test(u);
function applySettings(){document.documentElement.dataset.theme=cfg.theme;document.body.classList.toggle('halloween',cfg.siteTheme==='halloween');document.body.classList.toggle('christmas',cfg.siteTheme==='christmas');document.body.classList.toggle('no-motion',!cfg.animations);document.documentElement.style.setProperty('--reader-size',cfg.font+'px');if($('#siteSeasonSelect'))$('#siteSeasonSelect').value=cfg.siteTheme;renderSeasonEffects();$('#themeSetting').value=cfg.theme;$('#animationsSetting').checked=cfg.animations;$('#fontSetting').value=cfg.font;}
function setSetting(k,v){cfg[k]=v;localStorage.setItem('nv-'+k,String(v));applySettings();}
async function init(){applySettings();try{if(window.ENCRIA_SUPABASE_URL&&window.ENCRIA_SUPABASE_ANON_KEY&&window.supabase){db=supabase.createClient(window.ENCRIA_SUPABASE_URL,window.ENCRIA_SUPABASE_ANON_KEY);const {data:{user:u}}=await db.auth.getUser();user=u;await checkAdmin();await loadSiteTheme();db.auth.onAuthStateChange(()=>setTimeout(async()=>{const r=await db.auth.getUser();user=r.data.user;await checkAdmin();await loadSiteTheme();await loadStories();},0));await loadStories();}else{stories=await(await fetch('histoires.json')).json();render();} }catch(e){console.error(e);$('#empty').textContent='Chargement impossible : vérifie la connexion Supabase.';$('#empty').hidden=false;}updateAccount();}
async function loadSiteTheme(){
 if(!db)return;
 const {data,error}=await db.from('site_settings').select('site_theme').eq('id',1).maybeSingle();
 if(error){console.warn('Exécuter MIGRATION-V5.sql pour activer les thèmes globaux :',error.message);return;}
 cfg.siteTheme=['normal','halloween','christmas'].includes(data?.site_theme)?data.site_theme:'normal';applySettings();
}
async function saveSiteTheme(e){
 const select=e.target;if(!isAdmin||!db){select.value=cfg.siteTheme;return;}
 select.disabled=true;$('#siteSeasonStatus').textContent='Enregistrement…';
 const requested=select.value;const {error}=await db.rpc('set_site_theme',{new_theme:requested});
 if(error){$('#siteSeasonStatus').textContent='Erreur : '+error.message;select.value=cfg.siteTheme;}
 else{cfg.siteTheme=requested;applySettings();$('#siteSeasonStatus').textContent='Thème appliqué à tous les visiteurs.';}
 select.disabled=false;
}
function renderSeasonEffects(){
 const layer=$('#seasonEffects');if(!layer)return;layer.replaceChildren();
 const kind=cfg.siteTheme;if(kind==='normal')return;
 const icons={
 web:`<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.1"><path d="M0 0 L100 0 M0 0 L0 100 M0 0 L98 98 M0 0 L95 45 M0 0 L45 95"/><path d="M20 0 Q20 20 0 20 M40 0 Q42 42 0 40 M65 0 Q65 65 0 65 M85 0 Q85 85 0 85 M25 10 Q38 24 10 25 M43 18 Q63 45 18 43 M60 26 Q83 62 26 60"/></svg>`,
 bat:`<svg viewBox="0 0 100 55" fill="currentColor"><path d="M50 12 45 5 42 12 35 15 Q20 0 2 9 Q16 12 10 30 Q22 25 25 40 Q35 30 43 38 L50 50 57 38 Q65 30 75 40 Q78 25 90 30 Q84 12 98 9 Q80 0 65 15 L58 12 55 5Z"/></svg>`,
 ghost:`<svg viewBox="0 0 90 110" fill="none"><path d="M15 96 V45 C15 5 75 5 75 45 V96 L62 86 51 100 40 88 27 100Z" fill="#f6f1ed" fill-opacity=".86"/><ellipse cx="35" cy="49" rx="5" ry="8" fill="#252033"/><ellipse cx="55" cy="49" rx="5" ry="8" fill="#252033"/><ellipse cx="45" cy="69" rx="5" ry="7" fill="#252033"/></svg>`,
 pumpkin:`<svg viewBox="0 0 120 100"><path d="M60 22 Q54 8 65 2" stroke="#6f9b45" stroke-width="8" fill="none"/><ellipse cx="60" cy="62" rx="52" ry="35" fill="#f18b27"/><ellipse cx="38" cy="62" rx="21" ry="34" fill="#d8661d"/><ellipse cx="82" cy="62" rx="21" ry="34" fill="#d8661d"/><ellipse cx="60" cy="62" rx="27" ry="35" fill="#f99932"/><path d="m37 49 12 12H30Z M83 49 12 12H76Z M37 73 Q60 92 83 73 L75 71 69 78 60 73 51 78 45 71Z" fill="#1d1512"/></svg>`,
 snow:`<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 2V38M2 20H38M7 7L33 33M33 7L7 33"/><path d="m15 7 5 5 5-5 M15 33l5-5 5 5"/></svg>`,
 'xmas-tree':`<svg viewBox="0 0 100 130"><path d="M46 100h12v25H46z" fill="#77523b"/><path d="M50 8 15 61h15L6 104h88L70 61h15Z" fill="#247b61" stroke="#c4e6bf" stroke-width="2"/><path d="M50 3 55 14 68 15 58 24 61 37 50 30 39 37 42 24 32 15 45 14Z" fill="#ffe1a0"/><circle cx="30" cy="83" r="4" fill="#f5d7a4"/><circle cx="70" cy="82" r="4" fill="#f8a7a7"/><circle cx="50" cy="59" r="4" fill="#ffe5a1"/></svg>`,
 'xmas-gift':`<svg viewBox="0 0 90 90"><rect x="12" y="34" width="66" height="48" rx="4" fill="#b72f43"/><rect x="9" y="27" width="72" height="15" rx="3" fill="#d8485d"/><path d="M40 27C7 24 19 2 36 13L45 27C49 7 73 4 70 18 68 25 58 28 40 27Z" fill="none" stroke="#f8dba2" stroke-width="5"/><path d="M40 30h12v52H40z" fill="#f8dba2"/></svg>`,
 santa:`<svg viewBox="0 0 200 125" xmlns="http://www.w3.org/2000/svg"><path d="M20 73Q80 95 165 70L185 62L177 94Q95 121 21 90Z" fill="#a52636" stroke="#ffd89b" stroke-width="4"/><path d="M35 71q-8-35 23-40l16-21 15 22q25 0 26 31" fill="#c8333e" stroke="#f2d9b5" stroke-width="5"/><circle cx="79" cy="47" r="18" fill="#ffdbbb"/><path d="M60 52Q80 86 101 52Q80 66 60 52" fill="#fff9e8"/><path d="M57 33q10-35 35-25l-7 28" fill="#bb2937" stroke="#f8f2e3" stroke-width="5"/><circle cx="91" cy="11" r="7" fill="#fff"/><path d="M113 60Q133 42 150 59" stroke="#f2d2a3" stroke-width="10" fill="none"/><path d="M157 53q11-27 25-8" stroke="#ffdb9e" stroke-width="4" fill="none"/></svg>`,
 garland:`<svg viewBox="0 0 500 85" xmlns="http://www.w3.org/2000/svg"><path d="M0 5Q125 105 250 20Q375 105 500 5" stroke="#34765c" stroke-width="8" fill="none"/><g fill="#f6d78b"><circle cx="55" cy="40" r="7"/><circle cx="125" cy="59" r="7"/><circle cx="195" cy="41" r="7"/><circle cx="270" cy="35" r="7"/><circle cx="350" cy="62" r="7"/><circle cx="430" cy="42" r="7"/></g><g fill="#f8a0a5"><circle cx="88" cy="55" r="5"/><circle cx="315" cy="53" r="5"/><circle cx="468" cy="24" r="5"/></g></svg>`,
 'xmas-star':`<svg viewBox="0 0 70 70"><path d="M35 2 42 27 68 35 42 43 35 68 27 43 2 35 27 27Z" fill="#ffe6ab"/></svg>`
 };
 const types=kind==='halloween'?['web','web','pumpkin','pumpkin','ghost','ghost','bat','bat','bat','bat','blood']:Array.from({length:32},()=> 'snow').concat(['xmas-tree','xmas-star','xmas-gift','santa','garland']);
 types.forEach((type,i)=>{const el=document.createElement('span');el.className='season-item '+type;if(type!=='blood')el.innerHTML=icons[type];el.style.setProperty('--i',i);el.style.setProperty('--x',((i*47+11)%95)+'%');el.style.setProperty('--delay',((i*7)%19)*-.6+'s');el.style.setProperty('--dur',(9+(i*3)%12)+'s');layer.append(el);});
}
async function checkAdmin(){isAdmin=false;if(user&&db){const r=await db.from('admins').select('user_id').eq('user_id',user.id).maybeSingle();isAdmin=!!r.data;}updateAccount();applySettings();}
function updateAccount(){const b=$('#accountButton');b.textContent=user?'👤 Profil':'Connexion';$('#profileArea').hidden=!user;$('#loginArea').hidden=!!user;$('#adminLink').hidden=!isAdmin;$('#adminSeasonSetting').hidden=!isAdmin;$('#accountRole').textContent=isAdmin?'ADMINISTRATEUR':'COMPTE LECTEUR';if(user){$('#accountEmail').textContent=user.email||'';$('#accountName').textContent=user.user_metadata?.pseudo||(isAdmin?'Administrateur':'Lecteur');}}
async function loadStories(){if(!db)return;const [a,b]=await Promise.all([db.from('stories').select('*').order('created_at',{ascending:false}),db.from('chapters').select('*').order('publish_at')]);if(a.error||b.error)throw a.error||b.error;stories=a.data.filter(s=>isAdmin||s.visibility==='published'||(s.visibility==='scheduled'&&s.release_at&&new Date(s.release_at)<=new Date())||s.visibility==='scheduled').map(s=>({...s,chapters:b.data.filter(c=>c.story_id===s.id&&(isAdmin||new Date(c.publish_at)<=new Date())).map(c=>({title:c.title,text:c.body,background_url:c.background_url||null}))}));render();}
function upcoming(s){return s.visibility==='scheduled'&&s.release_at&&new Date(s.release_at)>new Date();}
function storyCard(s){const soon=upcoming(s),color=/^#[0-9a-f]{6}$/i.test(s.color)?s.color:'#7554a8';const date=soon?new Date(s.release_at):null;return `<article class="card"><div class="cover" style="--cover:${color}">${validCover(s.cover_url)?`<img class="cover-image" src="${esc(s.cover_url)}" alt="Couverture de ${esc(s.title)}" loading="lazy">`:''}</div><div class="card-body"><h3>${esc(s.title)}</h3><span class="genre-tag">${esc(s.genre)}</span> <span class="status-tag">${soon?'🟠 À venir':s.visibility==='draft'?'🔒 Brouillon':'🟢 Publiée'}</span><div class="author">par ${esc(s.author)}</div><p class="description">${esc(s.description)}</p>${soon?`<p class="release">📅 ${date.toLocaleString('fr-FR',{dateStyle:'long',timeStyle:'short'})}<br><span data-countdown="${esc(s.id)}"></span></p>`:''}${isAdmin?`<a class="edit-inline" href="admin.html?edit=${encodeURIComponent(s.id)}">✏️ Modifier l'histoire</a>`:''}<button class="read-btn" data-read="${esc(s.id)}" ${soon&&!isAdmin||!s.chapters.length?'disabled':''}>${soon&&!isAdmin?'🔒 Bientôt disponible':s.chapters.length?'Lire l’histoire →':'Aucun chapitre disponible'}</button></div></article>`;}
function render(){const q=$('#search').value.toLowerCase(),g=$('#genre').value,genres=[...new Set(stories.map(s=>s.genre).filter(Boolean))].sort();$('#genre').innerHTML='<option value="">Tous les genres</option>'+genres.map(x=>`<option value="${esc(x)}" ${x===g?'selected':''}>${esc(x)}</option>`).join('');const filtered=stories.filter(s=>(!g||s.genre===g)&&[s.title,s.author,s.genre,s.description].join(' ').toLowerCase().includes(q));const live=filtered.filter(s=>!upcoming(s)),soon=filtered.filter(upcoming);$('#grid').innerHTML=live.map(storyCard).join('');$('#upcomingGrid').innerHTML=soon.map(storyCard).join('');$('#upcomingSection').hidden=!soon.length;$('#empty').hidden=!!filtered.length;$('#storyCount').textContent=stories.filter(s=>!upcoming(s)&&s.visibility!=='draft').length;renderFeatured();updateCountdowns();}
let featureIndex=0;
function renderFeatured(){
 const el=$('#featuredStories');if(!el)return;
 const choices=stories.filter(s=>!upcoming(s)&&(s.visibility==='published'||!s.visibility)&&s.chapters.length);
 if(!choices.length){el.innerHTML='<div class="feature-empty"><span class="feature-sigil">✦</span><p>Découvre nos univers.<br>Chaque histoire commence ici.</p></div>';return;}
 featureIndex%=choices.length;
 const s=choices[featureIndex];const img=validCover(s.cover_url)?`<img src="${esc(s.cover_url)}" alt="Couverture de ${esc(s.title)}">`:'<span class="feature-sigil">✦</span>';
 el.innerHTML=`<button type="button" class="feature-book" data-read="${esc(s.id)}" aria-label="Lire ${esc(s.title)}"><div class="feature-art" style="--feature-color:${/^#[0-9a-f]{6}$/i.test(s.color)?s.color:'#583979'}">${img}</div><div class="feature-bottom"><span class="feature-kicker">À DÉCOUVRIR · ${esc(s.genre)}</span><strong>${esc(s.title)}</strong><span class="feature-cta">Lire cette histoire →</span></div></button><div class="feature-nav"><button type="button" data-feature="-1" aria-label="Couverture précédente">←</button><span>${featureIndex+1} / ${choices.length}</span><button type="button" data-feature="1" aria-label="Couverture suivante">→</button></div>`;
}
function updateCountdowns(){document.querySelectorAll('[data-countdown]').forEach(el=>{const s=stories.find(x=>x.id===el.dataset.countdown);if(!s)return;const diff=new Date(s.release_at)-new Date();if(diff<=0){el.textContent='Disponible maintenant';return;}const days=Math.floor(diff/86400000),hrs=Math.floor(diff%86400000/3600000),mins=Math.floor(diff%3600000/60000);el.textContent=`⏳ ${days} j ${hrs} h ${mins} min avant la sortie`;});}
function paginate(text){
 const single=matchMedia('(max-width:760px)').matches;
 const maxChars=Math.max(280,Math.round((single?750:700)*18/cfg.font));
 const words=String(text||'').split(/\s+/).filter(Boolean);const result=[];let chunk='';
 for(const word of words){if(chunk.length+word.length+1>maxChars&&chunk){result.push(chunk.trim());chunk='';}chunk+=word+' ';}
 if(chunk.trim())result.push(chunk.trim());return result.length?result:[''];
}
function readerStep(){return matchMedia('(max-width:760px)').matches?1:2;}
function openReader(id,idx=0,restore=true){
 const s=stories.find(x=>String(x.id)===String(id));if(!s||!s.chapters[idx]||upcoming(s)&&!isAdmin)return;
 activeStory=s;activeChapter=idx;pages=paginate(s.chapters[idx].text);
 const key='nv-progress-'+s.id+'-'+idx;const saved=restore?Number(localStorage.getItem(key)||0):0;
 page=Math.max(0,Math.min(Math.floor(saved/readerStep())*readerStep(),pages.length-1));
 $('#readerTitle').textContent=s.title;$('#readerMeta').textContent=`par ${s.author} · ${s.genre}`;
 $('#chapterSelect').innerHTML=s.chapters.map((c,i)=>`<option value="${i}" ${i===idx?'selected':''}>${esc(c.title)}</option>`).join('');
 const chapterBg=s.chapters[idx].background_url||s.cover_url;
 const background=validCover(chapterBg)?`url("${chapterBg.replace(/["\\]/g,'')}")`:'none';
 $('#reader').style.setProperty('--chapter-bg',background);
 drawPage();if(!$('#reader').open)$('#reader').showModal();
}
function drawPage(direction=0){
 if(!activeStory)return;
 const left=$('#bookPage'),right=$('#bookPageRight'),spread=readerStep();
 left.classList.remove('flip-next','flip-prev');right.classList.remove('flip-next','flip-prev');
 left.textContent=pages[page]||'';right.textContent=spread===2?(pages[page+1]||''):'';
 right.hidden=spread===1;
 if(direction&&cfg.animations){const flipping=direction>0?right:left;void flipping.offsetWidth;flipping.classList.add(direction>0?'flip-next':'flip-prev');}
 $('#pageIndicator').textContent=spread===2?`Pages ${page+1}${page+1<pages.length?'–'+Math.min(page+2,pages.length):''} / ${pages.length}`:`Page ${page+1} / ${pages.length}`;
 $('#prevPage').disabled=page===0&&activeChapter===0;
 $('#nextPage').disabled=page+spread>=pages.length&&activeChapter===activeStory.chapters.length-1;
 localStorage.setItem('nv-progress-'+activeStory.id+'-'+activeChapter,page);
}
function turn(dir){
 if(!activeStory)return;const step=readerStep();const nextPage=page+dir*step;
 if(nextPage>=0&&nextPage<pages.length){page=nextPage;drawPage(dir);}
 else{const next=activeChapter+dir;if(next>=0&&next<activeStory.chapters.length){openReader(activeStory.id,next,false);if(dir<0){page=Math.floor((pages.length-1)/step)*step;drawPage(dir);}}}
}
$('#search').addEventListener('input',render);$('#genre').addEventListener('change',render);$('#year').textContent=new Date().getFullYear();$('#siteSeasonSelect').onchange=saveSiteTheme;$('#themeSetting').onchange=e=>setSetting('theme',e.target.value);$('#animationsSetting').onchange=e=>setSetting('animations',e.target.checked);$('#fontSetting').oninput=e=>setSetting('font',Number(e.target.value));
$('#accountButton').onclick=()=>$('#accountDialog').showModal();$('#settingsButton').onclick=()=>$('#settingsDialog').showModal();$('#loginForm').onsubmit=async e=>{e.preventDefault();if(!db)return alert('Connexion indisponible sans Supabase.');const f=e.target;const {error}=await db.auth.signInWithPassword({email:f.elements.email.value,password:f.elements.password.value});$('#authStatus').textContent=error?error.message:'Connexion réussie.';if(!error)$('#accountDialog').close();};$('#registerForm').onsubmit=async e=>{e.preventDefault();if(!db)return;const f=e.target;const {error}=await db.auth.signUp({email:f.elements.email.value,password:f.elements.password.value,options:{data:{pseudo:f.elements.pseudo.value}}});$('#authStatus').textContent=error?error.message:'Compte créé ! Vérifie ton e-mail si une confirmation est demandée.';};$('#logoutButton').onclick=async()=>{await db.auth.signOut();$('#accountDialog').close();};
// Accueil : rotation automatique des vraies histoires toutes les 30 secondes.
setInterval(()=>{
 if(document.hidden||$('#reader').open)return;
 const choices=stories.filter(s=>!upcoming(s)&&(s.visibility==='published'||!s.visibility)&&s.chapters.length);
 if(choices.length>1){featureIndex=(featureIndex+1)%choices.length;renderFeatured();}
},30000);
// Clic sur l'image de fond ou les marges du lecteur = fermer.
$('#readerBackdrop').addEventListener('click',()=>$('#reader').close());
$('#reader').addEventListener('click',e=>{
 if(e.target===$('#reader'))$('#reader').close();
});
$('#prevPage').onclick=()=>turn(-1);$('#nextPage').onclick=()=>turn(1);$('#bookPage').onclick=()=>{if(!String(window.getSelection()).trim())turn(-1);};$('#bookPageRight').onclick=()=>{if(!String(window.getSelection()).trim())turn(1);};$('#chapterSelect').onchange=e=>openReader(activeStory.id,Number(e.target.value),true);
document.addEventListener('click',e=>{const b=e.target.closest('[data-read]');if(b)openReader(b.dataset.read);const f=e.target.closest('[data-feature]');if(f){const choices=stories.filter(s=>!upcoming(s)&&(s.visibility==='published'||!s.visibility)&&s.chapters.length);if(choices.length){featureIndex=(featureIndex+Number(f.dataset.feature)+choices.length)%choices.length;renderFeatured();}}const close=e.target.closest('[data-close]');if(close)$('#'+close.dataset.close).close();});document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close();}));document.addEventListener('keydown',e=>{if(!$('#reader').open||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;if(e.key==='ArrowRight')turn(1);if(e.key==='ArrowLeft')turn(-1);});window.addEventListener('resize',()=>{if(activeStory&&$('#reader').open){pages=paginate(activeStory.chapters[activeChapter].text);page=Math.min(Math.floor(page/readerStep())*readerStep(),pages.length-1);drawPage();}});setInterval(()=>{if(db){loadStories().catch(console.error);loadSiteTheme().catch(console.error);}else updateCountdowns();},30000);init();
