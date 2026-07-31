/* Annecy Family Playbook — Fotodagboek (standalone, homepage).
   Kaart per vakantiedag (6-16 aug), dagtitel + verhaal, foto's per dag.
   Foto's zijn gedeeld met de fotoboek-editor (zelfde 'photos'-tabel).
   Aan het eind: knop naar de volledige fotoboek-editor. */
(function(){
  "use strict";
  const A=()=>window.AnnecyLive||null;
  const lc=()=>{ const a=A(); return a&&a.client||null; };
  const gid=()=>{ const a=A(); return a&&a.group&&a.group.id; };
  const me=()=>{ const a=A(); return a&&a.player||null; };
  const joined=()=>{ const a=A(); return !!(a&&typeof a.isJoined==='function'&&a.isJoined()); };
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  const DAYS=[]; for(let d=1; d<=16; d++) DAYS.push('2026-08-'+String(d).padStart(2,'0'));
  function dayLabel(iso){ try{ return new Date(iso+'T12:00:00').toLocaleDateString('nl-NL',{weekday:'long',day:'numeric',month:'long'}); }catch(e){ return iso; } }
  function dayShort(iso){ try{ return new Date(iso+'T12:00:00').toLocaleDateString('nl-NL',{weekday:'short',day:'numeric',month:'short'}); }catch(e){ return iso; } }

  const EMOJIS=['❤️','👍','😂','😮','🔥','🎉'];
  let photos=[], entries={}, reacts={}, comments={}, saveT={}, chan=null, reloadT=null;

  const css=`
  #dgRoot{position:fixed;inset:0;z-index:4000;background:#f5f8f8;overflow-y:auto;-webkit-overflow-scrolling:touch;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#0d3550}
  #dgRoot *{box-sizing:border-box}
  .dgTop{position:sticky;top:0;z-index:5;background:#ffffffee;backdrop-filter:blur(12px);border-bottom:1px solid #e2ecea;display:flex;align-items:center;gap:10px;padding:12px 14px}
  .dgTop h2{margin:0;font-size:18px;flex:1}
  .dgBack{border:none;background:#eef4f4;border-radius:11px;padding:8px 12px;font-weight:800;cursor:pointer;color:#0d3550}
  .dgWrap{max-width:760px;margin:0 auto;padding:14px}
  .dgNote{color:#697983;font-size:12.5px;line-height:1.45;margin:8px 0}
  .dgJump{display:flex;gap:6px;overflow-x:auto;padding:8px 0;scrollbar-width:none}
  .dgJump::-webkit-scrollbar{display:none}
  .dgJump button{flex:0 0 auto;border:1px solid #d5e0dd;background:#fff;border-radius:999px;padding:7px 12px;font-weight:700;font-size:13px;cursor:pointer;color:#0d3550}
  .dgDay{background:#fff;border:1px solid #e2ecea;border-radius:16px;padding:14px;margin:14px 0;box-shadow:0 6px 18px rgba(13,53,80,.06)}
  .dgDayHead{display:flex;align-items:baseline;gap:8px;margin-bottom:8px}
  .dgDayHead h3{margin:0;font-size:17px;text-transform:capitalize}
  .dgDayHead .cnt{font-size:12px;color:#8aa2ab;font-weight:700}
  .dgTitle{width:100%;padding:9px 11px;border:1px solid #d5e0dd;border-radius:10px;font-size:15px;font-weight:700;margin-bottom:6px}
  .dgStory{width:100%;padding:9px 11px;border:1px solid #d5e0dd;border-radius:10px;font-size:14px;line-height:1.4;min-height:64px;resize:vertical;font-family:inherit}
  .dgBy{font-size:11px;color:#9aa8a4;margin:4px 0 2px}
  .dgUpload{display:block;text-align:center;border:2px dashed #bcd3ce;border-radius:14px;padding:14px;color:#0f91a3;font-weight:800;cursor:pointer;margin:10px 0 4px;background:#fbfdfd}
  .dgGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}
  .dgCell{position:relative;border-radius:11px;overflow:hidden;background:#e7eeec;border:1px solid #e2ecea}
  .dgCell img{width:100%;height:96px;object-fit:cover;display:block}
  .dgCell .who{position:absolute;left:4px;top:4px;font-size:9px;color:#fff;background:rgba(0,0,0,.5);padding:1px 5px;border-radius:6px;max-width:80%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .dgCap{width:100%;border:none;border-top:1px solid #eef2f1;padding:5px 6px;font-size:11px;background:#fff}
  .dgCellRow{display:flex}
  .dgCellRow select{flex:1;border:none;border-top:1px solid #eef2f1;font-size:10px;padding:3px;background:#fbfdfd;color:#51707a}
  .dgCellRow button{border:none;border-top:1px solid #eef2f1;border-left:1px solid #eef2f1;background:#fdeceb;color:#c0392b;font-size:11px;padding:3px 7px;cursor:pointer}
  .dgBtn{display:block;width:100%;border:none;border-radius:13px;padding:14px;font-weight:800;font-size:15px;cursor:pointer;margin-top:12px}
  .dgBtn.primary{background:#ff6f68;color:#fff}
  .dgBtn.alt{background:#0f91a3;color:#fff}
  .dgGate{background:#fff;border-radius:16px;padding:22px;text-align:center;box-shadow:0 8px 22px rgba(13,53,80,.08);margin-top:14px}
  .dgFeed{display:flex;flex-direction:column;gap:12px;margin-top:10px}
  .dgPost{border:1px solid #e6eeeb;border-radius:14px;overflow:hidden;background:#fff}
  .dgPostHead{display:flex;align-items:center;gap:8px;padding:9px 11px}
  .dgAv{width:30px;height:30px;border-radius:50%;background:#0f91a3;color:#fff;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center;flex:0 0 auto}
  .dgPostHead b{font-size:13.5px}.dgPostHead .t{font-size:11px;color:#9aa8a4}
  .dgPost>img{width:100%;max-height:62vh;object-fit:cover;display:block;background:#e7eeec}
  .dgCapEdit{width:100%;border:none;border-top:1px solid #eef2f1;padding:8px 11px;font-size:13.5px}
  .dgReactBar{display:flex;flex-wrap:wrap;gap:5px;padding:8px 10px;border-top:1px solid #eef2f1}
  .dgReact{border:1px solid #e2ecea;background:#f6faf9;border-radius:999px;padding:4px 10px;font-size:14px;cursor:pointer;line-height:1;display:flex;align-items:center;gap:4px}
  .dgReact.on{background:#e6f4f6;border-color:#0f91a3}
  .dgReact .n{font-size:11px;font-weight:800;color:#51707a}
  .dgReactSum{font-size:12px;color:#697983;padding:2px 11px}
  .dgCmts{padding:6px 11px 10px;border-top:1px solid #eef2f1}
  .dgCmt{display:flex;gap:7px;margin:6px 0;font-size:13px}
  .dgCmt .av{width:24px;height:24px;border-radius:50%;background:#c7d8dc;color:#345;font-weight:800;font-size:11px;display:flex;align-items:center;justify-content:center;flex:0 0 auto}
  .dgCmt .bub{background:#f2f6f6;border-radius:12px;padding:6px 10px;flex:1}
  .dgCmt .bub b{font-size:12px}.dgCmt .bub .x{float:right;color:#b3c0bc;cursor:pointer;font-weight:800;margin-left:6px}
  .dgCmtAdd{display:flex;gap:6px;margin-top:8px}
  .dgCmtAdd input{flex:1;border:1px solid #d5e0dd;border-radius:999px;padding:8px 12px;font-size:13px}
  .dgCmtAdd button{border:none;background:#0f91a3;color:#fff;border-radius:999px;padding:8px 14px;font-weight:800;font-size:13px;cursor:pointer}
  `;

  function el(html){ const d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstElementChild; }
  function toast(m){ let t=document.getElementById('dgToast'); if(!t){t=document.createElement('div');t.id='dgToast';t.style.cssText='position:fixed;left:50%;bottom:30px;transform:translateX(-50%);background:#0d3550;color:#fff;padding:11px 18px;border-radius:999px;font-weight:800;font-size:14px;z-index:6000;box-shadow:0 10px 30px rgba(0,0,0,.3);opacity:0;transition:opacity .2s';document.body.appendChild(t);} t.textContent=m; t.style.opacity='1'; clearTimeout(t._h); t._h=setTimeout(()=>t.style.opacity='0',2200); }
  function thumb(url,w){ try{ if(!url||url.indexOf('/storage/v1/object/public/')<0) return url; return url.replace('/storage/v1/object/public/','/storage/v1/render/image/public/')+(url.indexOf('?')>-1?'&':'?')+'width='+(w||300)+'&quality=62'; }catch(e){ return url; } }

  async function loadAll(){
    const c=lc(), g=gid(); if(!c||!g) return;
    try{ const r=await c.from('photos').select('*').eq('group_id',g).order('created_at'); photos=r.data||[]; }catch(e){ photos=[]; }
    try{ const r2=await c.from('diary_entries').select('*').eq('group_id',g); entries={}; (r2.data||[]).forEach(e=>{ entries[e.day]=e; }); }catch(e){ entries={}; }
    try{ const r3=await c.from('photo_reactions').select('*').eq('group_id',g); reacts={}; (r3.data||[]).forEach(x=>{ (reacts[x.photo_id]=reacts[x.photo_id]||[]).push(x); }); }catch(e){ reacts={}; }
    try{ const r4=await c.from('photo_comments').select('*').eq('group_id',g).order('created_at'); comments={}; (r4.data||[]).forEach(x=>{ (comments[x.photo_id]=comments[x.photo_id]||[]).push(x); }); }catch(e){ comments={}; }
    render();
  }
  function softReload(){ clearTimeout(reloadT); reloadT=setTimeout(()=>{ const ae=document.activeElement; if(ae&&(ae.tagName==='INPUT'||ae.tagName==='TEXTAREA'||ae.isContentEditable)) return; loadAll(); },350); }
  function subscribe(){
    const c=lc(), g=gid(); if(!c||!g) return;
    try{ if(chan) c.removeChannel(chan); }catch(e){}
    chan=c.channel('diary-'+g)
      .on('postgres_changes',{event:'*',schema:'public',table:'photos',filter:'group_id=eq.'+g},softReload)
      .on('postgres_changes',{event:'*',schema:'public',table:'photo_reactions',filter:'group_id=eq.'+g},softReload)
      .on('postgres_changes',{event:'*',schema:'public',table:'photo_comments',filter:'group_id=eq.'+g},softReload)
      .on('postgres_changes',{event:'*',schema:'public',table:'diary_entries',filter:'group_id=eq.'+g},softReload)
      .subscribe();
  }
  async function toggleReact(pid,emoji){
    const c=lc(), g=gid(), p=me(); const uid=p&&p.id; if(!uid) return;
    const mine=(reacts[pid]||[]).find(x=>x.player_id===uid);
    try{
      if(mine && mine.emoji===emoji){ await c.from('photo_reactions').delete().eq('photo_id',pid).eq('player_id',uid); }
      else { await c.from('photo_reactions').upsert({photo_id:pid,group_id:g,player_id:uid,name:p.display_name,emoji:emoji},{onConflict:'photo_id,player_id'}); }
    }catch(e){ console.error('react',e); }
    await loadAll();
  }
  async function addComment(pid,inp){
    const c=lc(), g=gid(), p=me(); const body=(inp.value||'').trim(); if(!body||!p) return;
    inp.value='';
    try{ await c.from('photo_comments').insert({photo_id:pid,group_id:g,player_id:p.id,name:p.display_name,body:body}); }catch(e){ console.error('comment',e); toast('Reactie plaatsen mislukt'); }
    await loadAll();
  }
  async function delComment(id){ try{ await lc().from('photo_comments').delete().eq('id',id); }catch(e){ console.error(e); } await loadAll(); }

  function scheduleSaveEntry(day, patch){ entries[day]=Object.assign({day:day}, entries[day]||{}, patch); clearTimeout(saveT[day]); saveT[day]=setTimeout(()=>saveEntry(day),800); }
  async function saveEntry(day){ const c=lc(), g=gid(), p=me(); const e=entries[day]||{}; try{ await c.from('diary_entries').upsert({group_id:g,day:day,title:e.title||null,story:e.story||null,updated_by:p&&p.id,updated_by_name:p&&p.display_name,updated_at:new Date().toISOString()},{onConflict:'group_id,day'}); toast('Dagboek opgeslagen ✓'); }catch(err){ console.error('saveEntry',err); toast('Opslaan mislukt'); } }

  async function uploadFiles(files, day, btn){
    const c=lc(), g=gid(), p=me(); let n=0;
    for(const file of files){
      if(!file.type||!file.type.startsWith('image/')) continue;
      const ext=((file.name||'foto').split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
      const path=g+'/dagboek/'+Date.now()+'-'+Math.random().toString(36).slice(2,8)+'.'+ext;
      try{
        const up=await c.storage.from('fotos').upload(path,file,{cacheControl:'3600',upsert:false});
        if(up.error){ console.error(up.error); continue; }
        const pub=c.storage.from('fotos').getPublicUrl(path);
        const url=pub&&pub.data&&pub.data.publicUrl;
        await c.from('photos').insert({ group_id:g, album:'vos', path:path, url:url, uploaded_by:p&&p.id, uploader_name:p&&p.display_name, diary_day:day });
        n++;
      }catch(e){ console.error(e); }
    }
    if(btn) btn.textContent='➕ Foto\'s toevoegen';
    toast(n+' foto\'s toegevoegd 🎉');
    await loadAll();
  }

  async function setCaption(id,val){ try{ await lc().rpc('set_photo_caption',{p_photo_id:id,p_caption:val}); toast('Bijschrift opgeslagen'); }catch(e){ console.error(e); } }
  async function moveDay(id,day){ try{ await lc().rpc('set_photo_day',{p_photo_id:id,p_day:day||null}); await loadAll(); }catch(e){ console.error(e); toast('Verplaatsen mislukt'); } }
  async function delPhoto(p){ const c=lc(); try{ if(p.path) await c.storage.from('fotos').remove([p.path]); }catch(e){} try{ const r=await c.from('photos').delete().eq('id',p.id); if(r.error) toast('Alleen wie de foto plaatste kan hem verwijderen'); }catch(e){ console.error(e); } await loadAll(); }

  function daySelect(cur){ let o='<option value="">— kies dag —</option>'; DAYS.forEach(d=>{ o+='<option value="'+d+'"'+(d===cur?' selected':'')+'>'+esc(dayShort(d))+'</option>'; }); return o; }

  function photoCell(p){
    const cell=el('<div class="dgCell"></div>');
    cell.appendChild(el('<img loading="lazy" decoding="async" src="'+esc(thumb(p.url,300))+'" alt="">'));
    if(p.uploader_name) cell.appendChild(el('<span class="who">'+esc(p.uploader_name)+'</span>'));
    const cap=el('<input class="dgCap" placeholder="Bijschrift…">'); cap.value=p.caption||''; cap.onchange=()=>{ p.caption=cap.value; setCaption(p.id,cap.value); }; cell.appendChild(cap);
    const row=el('<div class="dgCellRow"></div>');
    const sel=el('<select title="Verplaats naar dag">'+daySelect(p.diary_day)+'</select>'); sel.onchange=()=>moveDay(p.id,sel.value); row.appendChild(sel);
    let armed=false; const del=el('<button title="Verwijderen">🗑</button>'); del.onclick=()=>{ if(!armed){ armed=true; del.textContent='?'; setTimeout(()=>{ armed=false; del.textContent='🗑'; },2200); return; } delPhoto(p); }; row.appendChild(del);
    cell.appendChild(row);
    return cell;
  }

  function initials(n){ n=(n||'?').trim(); return (n.charAt(0)||'?').toUpperCase(); }
  function shortTime(iso){ try{ return new Date(iso).toLocaleString('nl-NL',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}); }catch(e){ return ''; } }

  function postCard(p){
    const uid=me()&&me().id;
    const post=el('<div class="dgPost"></div>');
    const head=el('<div class="dgPostHead"><div class="dgAv">'+esc(initials(p.uploader_name))+'</div><div style="flex:1;min-width:0"><b>'+esc(p.uploader_name||'Iemand')+'</b><div class="t">'+esc(shortTime(p.created_at))+'</div></div></div>');
    const mv=el('<select title="Verplaats naar dag" style="font-size:11px;border:1px solid #e2ecea;border-radius:8px;padding:3px;color:#51707a;background:#fbfdfd">'+daySelect(p.diary_day)+'</select>'); mv.onchange=()=>moveDay(p.id,mv.value); head.appendChild(mv);
    let armed=false; const del=el('<button title="Verwijderen" style="border:none;background:#fdeceb;color:#c0392b;border-radius:8px;padding:4px 8px;font-size:12px;cursor:pointer;margin-left:4px">🗑</button>'); del.onclick=()=>{ if(!armed){ armed=true; del.textContent='?'; setTimeout(()=>{ armed=false; del.textContent='🗑'; },2200); return; } delPhoto(p); }; head.appendChild(del);
    post.appendChild(head);
    post.appendChild(el('<img loading="lazy" decoding="async" src="'+esc(thumb(p.url,900))+'" alt="">'));
    const cap=el('<input class="dgCapEdit" placeholder="Schrijf een bijschrift…">'); cap.value=p.caption||''; cap.onchange=()=>{ p.caption=cap.value; setCaption(p.id,cap.value); }; post.appendChild(cap);
    const rlist=reacts[p.id]||[]; const mine=rlist.find(x=>x.player_id===uid); const counts={}; rlist.forEach(x=>counts[x.emoji]=(counts[x.emoji]||0)+1);
    const bar=el('<div class="dgReactBar"></div>');
    EMOJIS.forEach(em=>{ const n=counts[em]||0; const b=el('<button class="dgReact'+(mine&&mine.emoji===em?' on':'')+'">'+em+(n?'<span class="n">'+n+'</span>':'')+'</button>'); b.onclick=()=>toggleReact(p.id,em); bar.appendChild(b); });
    post.appendChild(bar);
    if(rlist.length) post.appendChild(el('<div class="dgReactSum">'+rlist.map(x=>esc(x.name||'?')+' '+x.emoji).join(' · ')+'</div>'));
    const cm=el('<div class="dgCmts"></div>');
    (comments[p.id]||[]).forEach(x=>{ const row=el('<div class="dgCmt"><div class="av">'+esc(initials(x.name))+'</div><div class="bub">'+(x.player_id===uid?'<span class="x" title="Verwijderen">×</span>':'')+'<b>'+esc(x.name||'?')+'</b><br>'+esc(x.body)+'</div></div>'); const xx=row.querySelector('.x'); if(xx) xx.onclick=()=>delComment(x.id); cm.appendChild(row); });
    const add=el('<div class="dgCmtAdd"><input placeholder="Schrijf een reactie…"><button>Plaats</button></div>'); const inp=add.querySelector('input'); add.querySelector('button').onclick=()=>addComment(p.id,inp); inp.onkeydown=(e)=>{ if(e.key==='Enter') addComment(p.id,inp); }; cm.appendChild(add);
    post.appendChild(cm);
    return post;
  }

  function dayCard(day){
    const dayPhotos=photos.filter(p=>p.diary_day===day);
    const e=entries[day]||{};
    const card=el('<div class="dgDay" id="dg-'+day+'"></div>');
    let tag=''; if(day<'2026-08-06') tag=' <span style="font-size:11px;font-weight:800;color:#0f91a3;background:#e6f4f6;padding:2px 7px;border-radius:6px;text-transform:none">🚗 onderweg</span>'; else if(day==='2026-08-06') tag=' <span style="font-size:11px;font-weight:800;color:#c65b1e;background:#ffefe2;padding:2px 7px;border-radius:6px;text-transform:none">📍 aankomst Annecy</span>';
    const head=el('<div class="dgDayHead"><h3>'+esc(dayLabel(day))+'</h3>'+tag+'<span class="cnt">'+dayPhotos.length+' foto\'s</span></div>');
    card.appendChild(head);
    const ti=el('<input class="dgTitle" placeholder="Titel van de dag (bijv. Aankomst & meer)">'); ti.value=e.title||''; ti.oninput=()=>scheduleSaveEntry(day,{title:ti.value}); card.appendChild(ti);
    const st=el('<textarea class="dgStory" placeholder="Wat hebben jullie vandaag gedaan? Schrijf hier het dagverhaal…"></textarea>'); st.value=e.story||''; st.oninput=()=>scheduleSaveEntry(day,{story:st.value}); card.appendChild(st);
    if(e.updated_by_name) card.appendChild(el('<p class="dgBy">Laatst bijgewerkt door '+esc(e.updated_by_name)+'</p>'));
    const up=el('<label class="dgUpload">➕ Foto\'s toevoegen<input type="file" accept="image/*" multiple style="display:none"></label>');
    const inp=up.querySelector('input'); inp.onchange=()=>{ const files=Array.from(inp.files||[]); if(!files.length)return; up.childNodes[0].nodeValue='Bezig met uploaden…'; uploadFiles(files,day,up); inp.value=''; };
    card.appendChild(up);
    if(dayPhotos.length){ const feed=el('<div class="dgFeed"></div>'); dayPhotos.forEach(p=>feed.appendChild(postCard(p))); card.appendChild(feed); }
    return card;
  }

  function render(){
    let root=document.getElementById('dgRoot');
    if(!root){ root=el('<div id="dgRoot"></div>'); document.body.appendChild(root); document.body.style.overflow='hidden'; }
    root.innerHTML='';
    const top=el('<div class="dgTop"></div>');
    const back=el('<button class="dgBack">‹ Home</button>'); back.onclick=close; top.appendChild(back);
    top.appendChild(el('<h2>📔 Annecy Fotodagboek</h2>'));
    root.appendChild(top);
    const wrap=el('<div class="dgWrap"></div>'); root.appendChild(wrap);

    if(!joined()){
      const gate=el('<div class="dgGate"><p style="font-weight:800;font-size:17px;margin:0 0 8px">Log eerst in</p><p class="dgNote">Meld je eenmalig aan met je naam en de familiecode (bij <b>Spellen</b>), dan kun je samen aan het dagboek werken.</p></div>');
      const b=el('<button class="dgBtn alt">Naar Spellen om in te loggen</button>'); b.onclick=()=>{ close(); if(typeof window.switchScreen==='function') window.switchScreen('games'); };
      gate.appendChild(b); wrap.appendChild(gate); return;
    }

    wrap.appendChild(el('<p class="dgNote">Onze gezamenlijke tijdlijn — iedereen plaatst foto\'s en een dagverhaal, en je kunt op elkaars foto\'s <b>reageren met emoji</b> en <b>comments</b> plaatsen. Alles verschijnt live en komt automatisch ook in de fotoboek-editor.</p>'));

    const jump=el('<div class="dgJump"></div>');
    DAYS.forEach(d=>{ const b=el('<button>'+esc(dayShort(d))+'</button>'); b.onclick=()=>{ const t=document.getElementById('dg-'+d); if(t) t.scrollIntoView({behavior:'smooth',block:'start'}); }; jump.appendChild(b); });
    wrap.appendChild(jump);

    DAYS.forEach(d=>wrap.appendChild(dayCard(d)));

    const undated=photos.filter(p=>!p.diary_day);
    if(undated.length){
      const box=el('<div class="dgDay"></div>');
      box.appendChild(el('<div class="dgDayHead"><h3>📥 Nog niet ingedeeld</h3><span class="cnt">'+undated.length+' foto\'s</span></div>'));
      box.appendChild(el('<p class="dgNote">Deze foto\'s staan al in het fotoboek maar hebben nog geen dag. Kies onderaan elke foto een dag om ze in het dagboek te plaatsen.</p>'));
      const g=el('<div class="dgGrid"></div>'); undated.forEach(p=>g.appendChild(photoCell(p))); box.appendChild(g);
      wrap.appendChild(box);
    }

    const book=el('<button class="dgBtn primary">📖 Maak er een volledig fotoboek van</button>');
    book.onclick=()=>{ close(); if(window.AnnecyPhotobook&&window.AnnecyPhotobook.open){ try{ window.AnnecyPhotobook.open('vos'); }catch(e){ console.error(e); } } };
    wrap.appendChild(book);
    wrap.appendChild(el('<p class="dgNote" style="text-align:center;margin-top:6px">In de fotoboek-editor kies je opmaak en formaat en exporteer je een print-PDF (Albelli / Fotofabriek).</p>'));
  }

  function close(){ try{ if(chan) lc().removeChannel(chan); }catch(e){} chan=null; const r=document.getElementById('dgRoot'); if(r) r.remove(); document.body.style.overflow=''; }

  function open(){
    if(!document.getElementById('dgCss')){ const s=document.createElement('style'); s.id='dgCss'; s.textContent=css; document.head.appendChild(s); }
    render();
    loadAll();
    subscribe();
  }

  window.AnnecyDiary={ open, close };
})();
