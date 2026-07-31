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

  const DAYS=[]; for(let d=6; d<=16; d++) DAYS.push('2026-08-'+String(d).padStart(2,'0'));
  function dayLabel(iso){ try{ return new Date(iso+'T12:00:00').toLocaleDateString('nl-NL',{weekday:'long',day:'numeric',month:'long'}); }catch(e){ return iso; } }
  function dayShort(iso){ try{ return new Date(iso+'T12:00:00').toLocaleDateString('nl-NL',{weekday:'short',day:'numeric',month:'short'}); }catch(e){ return iso; } }

  let photos=[], entries={}, saveT={}, openDay=null;

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
  `;

  function el(html){ const d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstElementChild; }
  function toast(m){ let t=document.getElementById('dgToast'); if(!t){t=document.createElement('div');t.id='dgToast';t.style.cssText='position:fixed;left:50%;bottom:30px;transform:translateX(-50%);background:#0d3550;color:#fff;padding:11px 18px;border-radius:999px;font-weight:800;font-size:14px;z-index:6000;box-shadow:0 10px 30px rgba(0,0,0,.3);opacity:0;transition:opacity .2s';document.body.appendChild(t);} t.textContent=m; t.style.opacity='1'; clearTimeout(t._h); t._h=setTimeout(()=>t.style.opacity='0',2200); }
  function thumb(url,w){ try{ if(!url||url.indexOf('/storage/v1/object/public/')<0) return url; return url.replace('/storage/v1/object/public/','/storage/v1/render/image/public/')+(url.indexOf('?')>-1?'&':'?')+'width='+(w||300)+'&quality=62'; }catch(e){ return url; } }

  async function loadAll(){
    const c=lc(), g=gid(); if(!c||!g) return;
    try{ const r=await c.from('photos').select('*').eq('group_id',g).order('created_at'); photos=r.data||[]; }catch(e){ photos=[]; }
    try{ const r2=await c.from('diary_entries').select('*').eq('group_id',g); entries={}; (r2.data||[]).forEach(e=>{ entries[e.day]=e; }); }catch(e){ entries={}; }
    render();
  }

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

  function dayCard(day){
    const dayPhotos=photos.filter(p=>p.diary_day===day);
    const e=entries[day]||{};
    const card=el('<div class="dgDay" id="dg-'+day+'"></div>');
    const head=el('<div class="dgDayHead"><h3>'+esc(dayLabel(day))+'</h3><span class="cnt">'+dayPhotos.length+' foto\'s</span></div>');
    card.appendChild(head);
    const ti=el('<input class="dgTitle" placeholder="Titel van de dag (bijv. Aankomst & meer)">'); ti.value=e.title||''; ti.oninput=()=>scheduleSaveEntry(day,{title:ti.value}); card.appendChild(ti);
    const st=el('<textarea class="dgStory" placeholder="Wat hebben jullie vandaag gedaan? Schrijf hier het dagverhaal…"></textarea>'); st.value=e.story||''; st.oninput=()=>scheduleSaveEntry(day,{story:st.value}); card.appendChild(st);
    if(e.updated_by_name) card.appendChild(el('<p class="dgBy">Laatst bijgewerkt door '+esc(e.updated_by_name)+'</p>'));
    const up=el('<label class="dgUpload">➕ Foto\'s toevoegen<input type="file" accept="image/*" multiple style="display:none"></label>');
    const inp=up.querySelector('input'); inp.onchange=()=>{ const files=Array.from(inp.files||[]); if(!files.length)return; up.childNodes[0].nodeValue='Bezig met uploaden…'; uploadFiles(files,day,up); inp.value=''; };
    card.appendChild(up);
    if(dayPhotos.length){ const g=el('<div class="dgGrid"></div>'); dayPhotos.forEach(p=>g.appendChild(photoCell(p))); card.appendChild(g); }
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

    wrap.appendChild(el('<p class="dgNote">Iedereen in de familie schrijft mee: kies een dag, voeg foto\'s toe en schrijf het dagverhaal. Alles wordt live gedeeld en komt automatisch ook in de fotoboek-editor.</p>'));

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

  function close(){ const r=document.getElementById('dgRoot'); if(r) r.remove(); document.body.style.overflow=''; }

  function open(){
    if(!document.getElementById('dgCss')){ const s=document.createElement('style'); s.id='dgCss'; s.textContent=css; document.head.appendChild(s); }
    render();
    loadAll();
  }

  window.AnnecyDiary={ open, close };
})();
