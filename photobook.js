/* Annecy Family Playbook — Fotoboek-editor (standalone, buiten de spellen).
   Album-beheer + Albelli-gericht fotoboek met print-klare PDF-export. */
(function(){
  "use strict";
  const A=()=>window.AnnecyLive||null;
  const lc=()=>{ const a=A(); return a&&a.client||null; };
  const gid=()=>{ const a=A(); return a&&a.group&&a.group.id; };
  const me=()=>{ const a=A(); return a&&a.player||null; };
  const joined=()=>{ const a=A(); return !!(a&&typeof a.isJoined==='function'&&a.isJoined()); };
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  const ALBUMS=[['vos','Fam Vos'],['ketelaar','Fam Ketelaar / Cardol']];
  // Albelli-achtige trim-formaten (mm). Bleed 3mm wordt bij export toegevoegd.
  const SIZES=[
    {k:'sq21',label:'Vierkant 21 × 21 cm',w:210,h:210},
    {k:'sq30',label:'Vierkant 30 × 30 cm',w:300,h:300},
    {k:'a4p', label:'Staand A4 21 × 28 cm',w:210,h:280},
    {k:'a4l', label:'Liggend 28 × 21 cm',w:280,h:210}
  ];
  const BLEED=3;

  let album='vos', photos=[], cfg=null, tab='album', chan=null, saveT=null, openPhotoId=null;

  const css=`
  #pbRoot{position:fixed;inset:0;z-index:4000;background:#f5f8f8;overflow-y:auto;-webkit-overflow-scrolling:touch;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#0d3550}
  #pbRoot *{box-sizing:border-box}
  .pbTop{position:sticky;top:0;z-index:5;background:#ffffffee;backdrop-filter:blur(12px);border-bottom:1px solid #e2ecea;display:flex;align-items:center;gap:10px;padding:12px 14px}
  .pbTop h2{margin:0;font-size:18px;flex:1}
  .pbBack{border:none;background:#eef4f4;border-radius:11px;padding:8px 12px;font-weight:800;cursor:pointer;color:#0d3550}
  .pbWrap{max-width:820px;margin:0 auto;padding:14px}
  .pbRow{display:flex;flex-wrap:wrap;gap:8px}
  .pbChip{padding:8px 13px;border-radius:999px;border:1px solid #d5e0dd;background:#fff;font-weight:700;font-size:14px;cursor:pointer;color:#0d3550}
  .pbChip.on{background:#0f91a3;color:#fff;border-color:#0f91a3}
  .pbTabs{display:flex;gap:8px;margin:12px 0}
  .pbTab{flex:1;padding:11px;border-radius:13px;border:1px solid #d5e0dd;background:#fff;font-weight:800;cursor:pointer;color:#0d3550;font-size:15px}
  .pbTab.on{background:#0d3550;color:#fff;border-color:#0d3550}
  .pbUpload{display:block;text-align:center;border:2px dashed #bcd3ce;border-radius:16px;padding:18px;color:#0f91a3;font-weight:800;cursor:pointer;margin:10px 0;background:#fff}
  .pbGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}
  .pbCell{position:relative;border-radius:12px;overflow:hidden;background:#e7eeec;cursor:pointer;border:2px solid transparent}
  .pbCell.cover{border-color:#ff6f68}
  .pbCell img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block}
  .pbCell .tag{position:absolute;left:5px;bottom:5px;font-size:10px;color:#fff;background:rgba(0,0,0,.5);padding:1px 6px;border-radius:6px}
  .pbCell .hid{position:absolute;inset:0;background:rgba(255,255,255,.6);display:flex;align-items:center;justify-content:center;font-size:22px}
  .pbCoverBadge{position:absolute;top:5px;left:5px;background:#ff6f68;color:#fff;font-size:10px;font-weight:800;padding:2px 6px;border-radius:6px}
  .pbEdit{background:#fff;border:1px solid #e2ecea;border-radius:14px;padding:12px;margin:10px 0;box-shadow:0 8px 22px rgba(13,53,80,.08)}
  .pbEdit input{width:100%;padding:9px;border:1px solid #d5e0dd;border-radius:9px;font-size:14px}
  .pbMiniRow{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
  .pbMini{border:1px solid #d5e0dd;background:#f3f6f6;border-radius:9px;padding:7px 10px;font-weight:700;font-size:13px;cursor:pointer;color:#0d3550}
  .pbMini.danger{background:#fdeceb;color:#c0392b;border-color:#f3c6c2}
  .pbField{margin:12px 0}
  .pbField label{display:block;font-weight:800;font-size:13px;margin-bottom:5px}
  .pbField input,.pbField select{width:100%;padding:10px;border:1px solid #d5e0dd;border-radius:10px;font-size:15px;background:#fff}
  .pbNote{color:#697983;font-size:12.5px;line-height:1.4;margin:8px 0}
  .pbBtn{display:block;width:100%;border:none;border-radius:13px;padding:14px;font-weight:800;font-size:15px;cursor:pointer;margin-top:10px}
  .pbBtn.primary{background:#ff6f68;color:#fff}
  .pbBtn.alt{background:#0f91a3;color:#fff}
  .pbBtn.ghost{background:#eef4f4;color:#0d3550}
  .pbBtn:disabled{opacity:.5;cursor:not-allowed}
  .pbPages{margin-top:14px;display:flex;flex-direction:column;gap:14px}
  .pbPage{background:#fff;border-radius:6px;box-shadow:0 6px 18px rgba(13,53,80,.14);overflow:hidden;position:relative;margin:0 auto;width:100%;max-width:340px}
  .pbPage .pglabel{position:absolute;top:6px;right:8px;font-size:10px;color:#8aa;z-index:2}
  .pbCanvas{display:grid;gap:4%;padding:5%;width:100%;height:100%}
  .pbCanvas.full{padding:0;gap:0}
  .pbCanvas figure{margin:0;display:flex;flex-direction:column;min-height:0}
  .pbCanvas img{width:100%;height:100%;object-fit:cover;border-radius:2px;min-height:0}
  .pbCanvas.full img{border-radius:0}
  .pbCanvas figcaption{font-size:9px;color:#51707a;margin-top:2px;text-align:center;line-height:1.1}
  .pbCover{position:relative;color:#fff;display:flex;flex-direction:column;justify-content:flex-end}
  .pbCover img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .pbCover .ct{position:relative;z-index:2;padding:16px;background:linear-gradient(transparent,rgba(4,26,40,.75))}
  .pbCover .ct .eb{font-size:10px;letter-spacing:2px;font-weight:800;opacity:.9}
  .pbCover .ct h3{margin:3px 0;font-size:22px;line-height:1.05}
  .pbCover .ct p{margin:0;font-size:12px;opacity:.9}
  .pbGate{background:#fff;border-radius:16px;padding:22px;text-align:center;box-shadow:0 8px 22px rgba(13,53,80,.08)}
  .dsBar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:8px 0}
  .dsCanvasWrap{background:#e7eeec;border-radius:12px;padding:10px;margin:8px 0}
  .dsCanvas{position:relative;width:100%;overflow:hidden;border-radius:4px;box-shadow:0 6px 18px rgba(13,53,80,.18);background:#fff;touch-action:none;container-type:size}
  .dsItem{position:absolute;cursor:move;touch-action:none}
  .dsItem.sel{outline:2px solid #ff6f68;outline-offset:1px}
  .dsItem>img{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none}
  .dsText{padding:4px 6px;overflow:hidden;line-height:1.15}
  .dsText[contenteditable]{outline:none}
  .rsz{position:absolute;right:-10px;bottom:-10px;width:22px;height:22px;background:#ff6f68;border:2px solid #fff;border-radius:50%;cursor:nwse-resize;touch-action:none;z-index:7}
  .dsHandle{position:absolute;top:-11px;left:-3px;background:#0d3550;color:#fff;font-size:9px;font-weight:800;padding:2px 7px;border-radius:7px;cursor:move;z-index:6;touch-action:none;white-space:nowrap;user-select:none}
  .dsDel{position:absolute;top:-12px;right:-12px;width:26px;height:26px;background:#c0392b;color:#fff;border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;z-index:8}
  .dsStrip{display:flex;gap:6px;overflow-x:auto;padding:6px 2px;scrollbar-width:none}
  .dsStrip img{height:62px;width:62px;object-fit:cover;border-radius:8px;cursor:pointer;flex:0 0 auto}
  .dsSwatch{width:32px;height:32px;border-radius:8px;border:2px solid #fff;box-shadow:0 0 0 1px #d5e0dd;cursor:pointer;flex:0 0 auto}
  .dsSwatch.on{box-shadow:0 0 0 2px #ff6f68}
  `;

  function el(html){ const d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstElementChild; }
  function toast(m){ let t=document.getElementById('pbToast'); if(!t){t=document.createElement('div');t.id='pbToast';t.style.cssText='position:fixed;left:50%;bottom:30px;transform:translateX(-50%);background:#0d3550;color:#fff;padding:11px 18px;border-radius:999px;font-weight:800;font-size:14px;z-index:6000;box-shadow:0 10px 30px rgba(0,0,0,.3);opacity:0;transition:opacity .2s';document.body.appendChild(t);} t.textContent=m; t.style.opacity='1'; clearTimeout(t._h); t._h=setTimeout(()=>t.style.opacity='0',2200); }
  function albName(k){ const a=ALBUMS.find(x=>x[0]===(k||album)); return a?a[1]:k; }
  // Verkleinde thumbnail via Supabase image-transform (houdt het album snel bij veel/grote foto's).
  function thumb(url,w){ try{ if(!url||url.indexOf('/storage/v1/object/public/')<0) return url; return url.replace('/storage/v1/object/public/','/storage/v1/render/image/public/')+(url.indexOf('?')>-1?'&':'?')+'width='+(w||400)+'&quality=62'; }catch(e){ return url; } }
  const CANVA_EMAIL='info@achterhoekfysio.nl';
  function canvaHint(){
    const box=el('<div style="background:#e8f7f8;border:1px solid #bfe3e6;border-radius:12px;padding:10px 12px;margin-top:10px"></div>');
    box.appendChild(el('<div style="font-weight:800;color:#0f91a3;margin-bottom:4px">🎨 Canva (visueel opmaken)</div>'));
    box.appendChild(el('<div style="font-size:13px;color:#0d3550">Inloggen met: <b>'+CANVA_EMAIL+'</b><br><span style="color:#697983;font-size:12px">Het wachtwoord staat bewust niet in de app — deel dat via een Canva Team-uitnodiging of een wachtwoordmanager.</span></div>'));
    const row=el('<div class="dsBar" style="margin-top:8px"></div>');
    const open=el('<button class="pbMini" style="background:#0f91a3;color:#fff">Open Canva</button>'); open.onclick=()=>window.open('https://www.canva.com/login','_blank','noopener'); row.appendChild(open);
    const cp=el('<button class="pbMini">📋 Kopieer e-mail</button>'); cp.onclick=()=>{ try{ navigator.clipboard.writeText(CANVA_EMAIL); toast('E-mail gekopieerd'); }catch(e){ toast('Kopiëren lukte niet'); } }; row.appendChild(cp);
    box.appendChild(row);
    return box;
  }
  function sizeObj(){ return SIZES.find(s=>s.k===(cfg&&cfg.size||'sq21'))||SIZES[0]; }

  const defaultCfg=()=>({title:albName(),subtitle:"Camping l'Idéal · Lac d'Annecy · 6–16 aug 2026",size:'sq21',layout:2,cover:null,order:[],hidden:[]});

  function scheduleSave(){ clearTimeout(saveT); saveT=setTimeout(saveCfg,600); }
  async function saveCfg(){ try{ await lc().rpc('save_book',{p_album:album,p_config:cfg}); }catch(e){ console.error(e); } }

  async function loadAll(){
    const c=lc(), g=gid();
    try{ const r=await c.from('photos').select('*').eq('group_id',g).eq('album',album).order('created_at'); photos=r.data||[]; }catch(e){ photos=[]; }
    cfg=defaultCfg();
    try{ const r=await c.from('game_books').select('config').eq('group_id',g).eq('album',album).maybeSingle(); if(r&&r.data&&r.data.config) cfg=Object.assign(defaultCfg(),r.data.config); }catch(e){}
    const ids=photos.map(p=>p.id);
    cfg.order=(cfg.order||[]).filter(id=>ids.includes(id));
    ids.forEach(id=>{ if(!cfg.order.includes(id)) cfg.order.push(id); });
    cfg.hidden=(cfg.hidden||[]).filter(id=>ids.includes(id));
    if(cfg.cover && !ids.includes(cfg.cover)) cfg.cover=null;
    undoStack=[];
    render();
  }
  function ordered(){ const m={}; photos.forEach(p=>m[p.id]=p); return cfg.order.map(id=>m[id]).filter(Boolean); }
  function inBook(){ return ordered().filter(p=>!cfg.hidden.includes(p.id)); }

  function subscribe(){
    const c=lc(), g=gid(); if(!c||!g) return;
    try{ if(chan) c.removeChannel(chan); }catch(e){}
    try{ chan=c.channel('pb-'+g).on('postgres_changes',{event:'*',schema:'public',table:'photos',filter:'group_id=eq.'+g},()=>{ if(document.getElementById('pbRoot')) softReload(); }).subscribe(); }catch(e){}
  }
  async function softReload(){ const c=lc(), g=gid(); try{ const r=await c.from('photos').select('*').eq('group_id',g).eq('album',album).order('created_at'); photos=r.data||[]; const ids=photos.map(p=>p.id); cfg.order=(cfg.order||[]).filter(id=>ids.includes(id)); ids.forEach(id=>{ if(!cfg.order.includes(id)) cfg.order.push(id); }); const ae=document.activeElement; if(!(ae&&(ae.tagName==='INPUT'||ae.isContentEditable))) render(); }catch(e){} }

  async function uploadFiles(files){
    const c=lc(), g=gid(); const pl=me();
    for(const file of files){
      if(!file.type||!file.type.startsWith('image/')) continue;
      const ext=((file.name||'foto').split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
      const path=g+'/'+album+'/'+Date.now()+'-'+Math.random().toString(36).slice(2,8)+'.'+ext;
      try{
        const up=await c.storage.from('fotos').upload(path,file,{cacheControl:'3600',upsert:false});
        if(up.error){ console.error(up.error); toast('Upload mislukt'); continue; }
        const pub=c.storage.from('fotos').getPublicUrl(path);
        const url=pub&&pub.data&&pub.data.publicUrl;
        await c.from('photos').insert({ group_id:g, album:album, path:path, url:url, uploaded_by:pl&&pl.id, uploader_name:pl&&pl.display_name });
      }catch(e){ console.error(e); toast('Upload mislukt'); }
    }
  }

  /* ---------- RENDER ---------- */
  function render(){
    let root=document.getElementById('pbRoot');
    if(!root){ root=el('<div id="pbRoot"></div>'); document.body.appendChild(root); document.body.style.overflow='hidden'; }
    root.innerHTML='';
    const top=el('<div class="pbTop"></div>');
    const back=el('<button class="pbBack">‹ Home</button>'); back.onclick=close; top.appendChild(back);
    top.appendChild(el('<h2>📖 Fotoboek</h2>'));
    root.appendChild(top);
    const wrap=el('<div class="pbWrap"></div>'); root.appendChild(wrap);

    if(!joined()){
      const gate=el('<div class="pbGate"><p style="font-weight:800;font-size:17px;margin:0 0 8px">Log eerst in</p><p class="pbNote">Om samen foto\'s te delen en een fotoboek te maken, log je eenmalig in met je naam en de familiecode (bij <b>Spellen</b>).</p></div>');
      const b=el('<button class="pbBtn alt">Naar Spellen om in te loggen</button>'); b.onclick=()=>{ close(); if(typeof window.switchScreen==='function') window.switchScreen('games'); };
      gate.appendChild(b); wrap.appendChild(gate); return;
    }

    // album keuze
    const alb=el('<div class="pbRow"></div>');
    ALBUMS.forEach(([k,label])=>{ const b=el('<button class="pbChip '+(k===album?'on':'')+'">'+esc(label)+'</button>'); b.onclick=()=>{ if(k!==album){ album=k; openPhotoId=null; loadAll(); } }; alb.appendChild(b); });
    wrap.appendChild(alb);

    // tabs
    const tabs=el('<div class="pbTabs"></div>');
    const t1=el('<button class="pbTab '+(tab==='album'?'on':'')+'" style="font-size:13.5px">📷 Album ('+inBook().length+')</button>'); t1.onclick=()=>{ tab='album'; render(); };
    const t3=el('<button class="pbTab '+(tab==='design'?'on':'')+'" style="font-size:13.5px">✨ Ontwerpen</button>'); t3.onclick=()=>{ tab='design'; render(); };
    const t2=el('<button class="pbTab '+(tab==='book'?'on':'')+'" style="font-size:13.5px">📖 Snel boek</button>'); t2.onclick=()=>{ tab='book'; render(); };
    tabs.appendChild(t1); tabs.appendChild(t3); tabs.appendChild(t2); wrap.appendChild(tabs);

    if(tab==='album') renderAlbum(wrap); else if(tab==='design') renderDesign(wrap); else renderBook(wrap);
  }

  function renderAlbum(wrap){
    const up=el('<label class="pbUpload">➕ Foto\'s toevoegen aan '+esc(albName())+'<span style="display:block;font-weight:600;color:#697983;font-size:12px;margin-top:3px">Je kunt meerdere foto\'s tegelijk kiezen</span><input type="file" accept="image/*" multiple style="display:none"></label>');
    const inp=up.querySelector('input');
    inp.onchange=async()=>{ const files=Array.from(inp.files||[]); if(!files.length)return; up.innerHTML='Bezig met uploaden… ('+files.length+')'; await uploadFiles(files); inp.value=''; await softReload(); toast(files.length+' foto\'s toegevoegd 🎉'); render(); };
    wrap.appendChild(up);
    if(!photos.length){ wrap.appendChild(el('<p class="pbNote">Nog geen foto\'s. Tik hierboven om foto\'s vanaf je telefoon toe te voegen. Iedereen in de familie ziet ze live.</p>')); return; }
    wrap.appendChild(el('<p class="pbNote">Typ direct een bijschrift bij elke foto. Knoppen: ☆ cover · ↑↓ volgorde · 🚫 uit het boek · 🗑 verwijderen (tik twee keer).</p>'));
    const grid=el('<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;margin-top:8px"></div>');
    ordered().forEach(p=>{
      const hidden=cfg.hidden.includes(p.id), isCover=cfg.cover===p.id;
      const card=el('<div style="border:1px solid '+(isCover?'#ff6f68':'#e6eeeb')+';border-radius:14px;overflow:hidden;background:#fff'+(hidden?';opacity:.6':'')+'"></div>');
      const media=el('<div style="position:relative"></div>');
      media.appendChild(el('<img loading="lazy" decoding="async" src="'+esc(thumb(p.url,420))+'" style="width:100%;height:148px;object-fit:cover;display:block">'));
      if(isCover) media.appendChild(el('<span style="position:absolute;top:6px;left:6px;background:#ff6f68;color:#fff;font-size:10px;font-weight:800;padding:2px 7px;border-radius:6px">COVER</span>'));
      if(hidden) media.appendChild(el('<span style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,.55);color:#fff;font-size:11px;padding:2px 6px;border-radius:6px">🚫</span>'));
      card.appendChild(media);
      const body=el('<div style="padding:8px"></div>');
      const cap=el('<input placeholder="Bijschrift…" style="width:100%;padding:7px 9px;border:1px solid #d5e0dd;border-radius:8px;font-size:13px">'); cap.value=p.caption||'';
      cap.onchange=async()=>{ p.caption=cap.value; try{ await lc().rpc('set_photo_caption',{p_photo_id:p.id,p_caption:cap.value}); toast('Bijschrift opgeslagen'); }catch(e){} };
      body.appendChild(cap);
      const row=el('<div class="pbMiniRow" style="margin-top:7px"></div>');
      const cov=el('<button class="pbMini" title="Als cover">'+(isCover?'★':'☆')+'</button>'); cov.onclick=()=>{ cfg.cover=(isCover?null:p.id); scheduleSave(); render(); };
      const up2=el('<button class="pbMini" title="Eerder">↑</button>'); up2.onclick=()=>move(p.id,-1);
      const dn=el('<button class="pbMini" title="Later">↓</button>'); dn.onclick=()=>move(p.id,1);
      const hid=el('<button class="pbMini" title="'+(hidden?'Terug in boek':'Uit boek')+'">'+(hidden?'👁':'🚫')+'</button>'); hid.onclick=()=>{ if(hidden) cfg.hidden=cfg.hidden.filter(i=>i!==p.id); else cfg.hidden.push(p.id); scheduleSave(); render(); };
      let armed=false; const del=el('<button class="pbMini danger">🗑</button>'); del.onclick=()=>{ if(!armed){ armed=true; del.textContent='Zeker?'; setTimeout(()=>{ armed=false; del.textContent='🗑'; },2500); return; } removePhoto(p); };
      row.append(cov,up2,dn,hid,del); body.appendChild(row);
      body.appendChild(el('<p class="pbNote" style="margin:6px 0 0;font-size:11px">'+esc(p.uploader_name||'')+'</p>'));
      card.appendChild(body); grid.appendChild(card);
    });
    wrap.appendChild(grid);
    if(A()&&A().isAdmin && photos.length){ let armedAll=false; const cl=el('<button class="pbBtn ghost" style="margin-top:16px;color:#c0392b">🗑 Album leegmaken (alle foto\'s wissen)</button>'); cl.onclick=()=>{ if(!armedAll){ armedAll=true; cl.textContent='Zeker weten? Tik nogmaals om ALLES te wissen'; setTimeout(()=>{ armedAll=false; cl.textContent='🗑 Album leegmaken (alle foto\'s wissen)'; },3000); return; } clearAlbum(); }; wrap.appendChild(cl); }
  }

  function photoEditor(p){
    const box=el('<div class="pbEdit" style="grid-column:1/-1"></div>');
    const cap=el('<input placeholder="Bijschrift (optioneel)">'); cap.value=p.caption||'';
    cap.onchange=async()=>{ p.caption=cap.value; try{ await lc().rpc('set_photo_caption',{p_photo_id:p.id,p_caption:cap.value}); toast('Bijschrift opgeslagen'); }catch(e){} };
    box.appendChild(cap);
    box.appendChild(el('<p class="pbNote" style="margin:6px 0 0">Geplaatst door '+esc(p.uploader_name||'')+'</p>'));
    const row=el('<div class="pbMiniRow"></div>');
    const cov=el('<button class="pbMini">'+(cfg.cover===p.id?'★ Cover (nu)':'☆ Als cover')+'</button>'); cov.onclick=()=>{ cfg.cover=(cfg.cover===p.id?null:p.id); scheduleSave(); render(); };
    const up=el('<button class="pbMini">↑ Eerder</button>'); up.onclick=()=>move(p.id,-1);
    const dn=el('<button class="pbMini">↓ Later</button>'); dn.onclick=()=>move(p.id,1);
    const hid=el('<button class="pbMini">'+(cfg.hidden.includes(p.id)?'👁 Terug in boek':'🚫 Uit boek')+'</button>'); hid.onclick=()=>{ if(cfg.hidden.includes(p.id)) cfg.hidden=cfg.hidden.filter(i=>i!==p.id); else cfg.hidden.push(p.id); scheduleSave(); render(); };
    const del=el('<button class="pbMini danger">🗑 Verwijderen</button>'); del.onclick=()=>removePhoto(p);
    row.append(cov,up,dn,hid,del); box.appendChild(row);
    return box;
  }
  function move(id,dir){ const i=cfg.order.indexOf(id), j=i+dir; if(i<0||j<0||j>=cfg.order.length) return; const t=cfg.order[i]; cfg.order[i]=cfg.order[j]; cfg.order[j]=t; scheduleSave(); render(); }
  async function removePhoto(p){
    const c=lc();
    try{ if(p.path) await c.storage.from('fotos').remove([p.path]); }catch(e){}
    try{ await c.from('photos').delete().eq('id',p.id); }catch(e){ toast('Verwijderen lukte niet'); return; }
    photos=photos.filter(x=>x.id!==p.id); cfg.order=cfg.order.filter(i=>i!==p.id); cfg.hidden=cfg.hidden.filter(i=>i!==p.id); if(cfg.cover===p.id)cfg.cover=null; scheduleSave(); render(); toast('Foto verwijderd');
  }
  async function clearAlbum(){
    const a=A();
    if(!(a&&a.isAdmin)){ toast('Alleen de beheerder kan het album leegmaken'); return; }
    const c=lc(); const paths=photos.map(p=>p.path).filter(Boolean);
    try{ if(paths.length) await c.storage.from('fotos').remove(paths); }catch(e){}
    try{ await c.from('photos').delete().eq('group_id',gid()).eq('album',album); }catch(e){ toast('Leegmaken lukte niet'); return; }
    photos=[]; cfg.order=[]; cfg.hidden=[]; cfg.cover=null; openPhotoId=null; scheduleSave(); render(); toast('Album leeggemaakt');
  }

  function renderBook(wrap){
    const list=inBook();
    // instellingen
    const f1=el('<div class="pbField"><label>Titel op de cover</label><input id="pbT" placeholder="Titel"></div>'); f1.querySelector('input').value=cfg.title||''; f1.querySelector('input').oninput=e=>{ cfg.title=e.target.value; scheduleSave(); updatePreview(); };
    const f2=el('<div class="pbField"><label>Ondertitel</label><input id="pbS" placeholder="Ondertitel"></div>'); f2.querySelector('input').value=cfg.subtitle||''; f2.querySelector('input').oninput=e=>{ cfg.subtitle=e.target.value; scheduleSave(); updatePreview(); };
    const f3=el('<div class="pbField"><label>Formaat (Albelli)</label><select id="pbSz"></select></div>');
    const sel=f3.querySelector('select'); SIZES.forEach(s=>{ const o=document.createElement('option'); o.value=s.k; o.textContent=s.label; if((cfg.size||'sq21')===s.k)o.selected=true; sel.appendChild(o); }); sel.onchange=e=>{ cfg.size=e.target.value; scheduleSave(); render(); };
    wrap.append(f1,f2,f3);
    const lay=el('<div class="pbField"><label>Foto\'s per pagina</label></div>');
    const lr=el('<div class="pbRow"></div>');
    [[1,'1 groot (paginavullend)'],[2,'2 per pagina'],[4,'4 per pagina']].forEach(([n,lb])=>{ const b=el('<button class="pbChip '+(cfg.layout==n?'on':'')+'">'+lb+'</button>'); b.onclick=()=>{ cfg.layout=n; scheduleSave(); render(); }; lr.appendChild(b); });
    lay.appendChild(lr); wrap.appendChild(lay);

    if(!list.length){ wrap.appendChild(el('<p class="pbNote">Voeg eerst foto\'s toe in het Album-tabblad.</p>')); return; }
    const nPages=1+Math.ceil(list.length/(cfg.layout||2));
    wrap.appendChild(el('<p class="pbNote"><b>'+list.length+' foto\'s</b> · '+nPages+' pagina\'s (incl. cover). Cover kies je in het Album (☆ Als cover); anders wordt de eerste foto gebruikt.</p>'));
    const vw=el('<button class="pbBtn alt">👁 Bekijk als digitaal boek (inkijkexemplaar)</button>'); vw.onclick=openViewer; wrap.appendChild(vw);

    const dl=el('<button class="pbBtn primary">⬇️ Print-klare PDF maken (voor Albelli)</button>'); dl.onclick=()=>exportPDF(dl); wrap.appendChild(dl);
    wrap.appendChild(el('<p class="pbNote">De PDF krijgt de gekozen paginamaat + 3&nbsp;mm afloop (bleed) en foto\'s op ~300&nbsp;dpi. Upload \'m bij Albelli via hun <b>PDF-fotoboek / zelf-ontworpen boek</b> optie. Let op: controleer bij Albelli de exacte maat en of ze losse pagina\'s of spreads willen.</p>'));

    const cv=el('<button class="pbBtn ghost" style="background:#e8f7f8;color:#0f91a3">🎨 Ontwerp in Canva (opent fotoboek-templates)</button>'); cv.onclick=()=>window.open('https://www.canva.com/photo-books/templates/','_blank','noopener'); wrap.appendChild(cv);
    const zbtn=el('<button class="pbBtn ghost">⬇️ Download alle foto\'s (.zip) — om in Canva/Albelli te gebruiken</button>'); zbtn.onclick=()=>downloadAllZip(zbtn); wrap.appendChild(zbtn);
    wrap.appendChild(el('<p class="pbNote">Liever visueel opmaken in <b>Canva</b> of Albelli\'s eigen editor? Download hier alle foto\'s in één keer en importeer ze daar. In Canva pak je een fotoboek-template, sleep je de foto\'s erin en exporteer je een print-PDF — die upload je bij Albelli. (Een directe automatische koppeling met Canva of Albelli bestaat helaas niet; dit is de snelste brug.)</p>'));
    wrap.appendChild(canvaHint());

    const prev=el('<div class="pbPages" id="pbPrev"></div>'); wrap.appendChild(prev);
    updatePreview();
  }

  function coverPhoto(){ const list=inBook(); return photos.find(p=>p.id===cfg.cover) || list[0] || photos[0]; }

  function updatePreview(){
    const host=document.getElementById('pbPrev'); if(!host) return;
    const s=sizeObj(); const ar=s.w/s.h;
    host.innerHTML='';
    // cover
    const cov=coverPhoto();
    const cpage=el('<div class="pbPage" style="aspect-ratio:'+ar+'"></div>');
    const cvr=el('<div class="pbCover" style="width:100%;height:100%"></div>');
    if(cov) cvr.appendChild(el('<img loading="lazy" decoding="async" src="'+esc(thumb(cov.url,1000))+'">'));
    cvr.appendChild(el('<div class="ct"><div class="eb">ANNECY 2026</div><h3>'+esc(cfg.title||albName())+'</h3>'+(cfg.subtitle?'<p>'+esc(cfg.subtitle)+'</p>':'')+'</div>'));
    cpage.appendChild(cvr); cpage.appendChild(el('<span class="pglabel">cover</span>')); host.appendChild(cpage);
    // content
    const list=inBook(), per=cfg.layout||2, cols=per===4?2:1;
    for(let i=0;i<list.length;i+=per){
      const chunk=list.slice(i,i+per);
      const page=el('<div class="pbPage" style="aspect-ratio:'+ar+'"></div>');
      const canvas=el('<div class="pbCanvas '+(per===1?'full':'')+'" style="grid-template-columns:repeat('+cols+',1fr)"></div>');
      chunk.forEach(p=>{ const fig=el('<figure></figure>'); fig.appendChild(el('<img loading="lazy" decoding="async" src="'+esc(thumb(p.url,760))+'">')); if(p.caption&&per>1) fig.appendChild(el('<figcaption>'+esc(p.caption)+'</figcaption>')); canvas.appendChild(fig); });
      page.appendChild(canvas); page.appendChild(el('<span class="pglabel">'+((i/per)+2)+'</span>')); host.appendChild(page);
    }
  }

  /* ---------- PDF EXPORT ---------- */
  function ensureScript(src,test){ return new Promise((res,rej)=>{ if(test&&test()) return res(); const s=document.createElement('script'); s.src=src; s.onload=()=>res(); s.onerror=()=>rej(new Error('load '+src)); document.head.appendChild(s); }); }
  function ensureJsPDF(){ return ensureScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', ()=>window.jspdf&&window.jspdf.jsPDF); }
  async function downloadAllZip(btn){
    const list=inBook(); if(!list.length){ toast('Geen foto\'s in het boek'); return; }
    const old=btn?btn.textContent:''; if(btn){ btn.disabled=true; btn.textContent='Foto\'s inpakken…'; }
    try{
      await ensureScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', ()=>window.JSZip);
      const zip=new window.JSZip(); let n=1;
      for(const p of list){
        try{ const r=await fetch(p.url,{mode:'cors'}); const b=await r.blob(); const ext=((p.path||'').split('.').pop()||'jpg').toLowerCase(); const cap=p.caption?('-'+p.caption.replace(/[^a-z0-9]+/gi,'_').slice(0,28)):''; zip.file(String(n).padStart(3,'0')+cap+'.'+ext, b); n++; }catch(e){ console.warn(e); }
      }
      const blob=await zip.generateAsync({type:'blob'});
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='Fotos-'+album+'-Annecy2026.zip'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),5000);
      toast('ZIP gedownload ✓');
    }catch(e){ console.error(e); alert('Inpakken lukte niet (internet?).'); }
    finally{ if(btn){ btn.disabled=false; btn.textContent=old; } }
  }
  function loadImg(url){ return new Promise((res,rej)=>{ const im=new Image(); im.crossOrigin='anonymous'; im.onload=()=>res(im); im.onerror=()=>rej(new Error('img')); im.src=url; }); }
  function coverData(img,wmm,hmm){
    const ar=wmm/hmm, iw=img.naturalWidth||img.width, ih=img.naturalHeight||img.height, iar=iw/ih;
    let sx,sy,sw,sh; if(iar>ar){ sh=ih; sw=ih*ar; sx=(iw-sw)/2; sy=0; } else { sw=iw; sh=iw/ar; sx=0; sy=(ih-sh)/2; }
    const cw=Math.max(1,Math.round(wmm*11.8)), ch=Math.max(1,Math.round(hmm*11.8)); // ~300 dpi
    const cv=document.createElement('canvas'); cv.width=cw; cv.height=ch;
    const ctx=cv.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,cw,ch); ctx.drawImage(img,sx,sy,sw,sh,0,0,cw,ch);
    return cv.toDataURL('image/jpeg',0.9);
  }
  async function exportPDF(btn){
    const list=inBook(); if(!list.length){ toast('Geen foto\'s in het boek'); return; }
    const old=btn?btn.textContent:''; if(btn){ btn.disabled=true; btn.textContent='PDF wordt gemaakt…'; }
    try{
      await ensureJsPDF();
      const s=sizeObj(); const pw=s.w+2*BLEED, ph=s.h+2*BLEED;
      const { jsPDF }=window.jspdf;
      const doc=new jsPDF({orientation: pw>=ph?'landscape':'portrait', unit:'mm', format:[pw,ph]});
      const safe=BLEED+7; // veilige marge voor multi-layout
      // cover (paginavullend, incl. bleed)
      const cov=coverPhoto();
      if(cov){ const im=await loadImg(cov.url); doc.addImage(coverData(im,pw,ph),'JPEG',0,0,pw,ph); }
      // donkere balk + titel
      doc.setGState(new doc.GState({opacity:0.42})); doc.setFillColor(4,26,40); doc.rect(0,ph*0.62,pw,ph*0.38,'F'); doc.setGState(new doc.GState({opacity:1}));
      doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(Math.max(18,pw*0.11)); doc.text(String(cfg.title||albName()), safe, ph-safe-8, {maxWidth:pw-2*safe});
      if(cfg.subtitle){ doc.setFont('helvetica','normal'); doc.setFontSize(Math.max(9,pw*0.035)); doc.text(String(cfg.subtitle), safe, ph-safe, {maxWidth:pw-2*safe}); }
      // content
      const per=cfg.layout||2, cols=per===4?2:1, rows=per===1?1:(per===2?2:2);
      for(let i=0;i<list.length;i+=per){
        doc.addPage([pw,ph], pw>=ph?'landscape':'portrait');
        const chunk=list.slice(i,i+per);
        if(per===1){
          const im=await loadImg(chunk[0].url); doc.addImage(coverData(im,pw,ph),'JPEG',0,0,pw,ph);
          if(chunk[0].caption){ doc.setGState(new doc.GState({opacity:0.4})); doc.setFillColor(4,26,40); doc.rect(0,ph-14,pw,14,'F'); doc.setGState(new doc.GState({opacity:1})); doc.setTextColor(255,255,255); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.text(String(chunk[0].caption), safe, ph-5, {maxWidth:pw-2*safe}); }
        } else {
          const gap=5; const gw=(pw-2*safe-(cols-1)*gap)/cols, gh=(ph-2*safe-(rows-1)*gap)/rows;
          for(let j=0;j<chunk.length;j++){
            const cx=safe+(j%cols)*(gw+gap), cy=safe+Math.floor(j/cols)*(gh+gap);
            const capH=chunk[j].caption?4:0;
            const im=await loadImg(chunk[j].url); doc.addImage(coverData(im,gw,gh-capH),'JPEG',cx,cy,gw,gh-capH);
            if(chunk[j].caption){ doc.setTextColor(80,112,122); doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.text(String(chunk[j].caption), cx, cy+gh-1, {maxWidth:gw}); }
          }
        }
      }
      doc.save('Fotoboek-'+album+'-Annecy2026.pdf');
      toast('PDF gedownload ✓');
    }catch(e){ console.error(e); alert('PDF maken lukte niet. Mogelijk blokkeert een foto de download; probeer opnieuw of met minder foto\'s.'); }
    finally{ if(btn){ btn.disabled=false; btn.textContent=old; } }
  }

  /* ---------- VRIJE OPMAAK (visuele editor) ---------- */
  let desPage=0, desSel=null, undoStack=[];
  function ensureFonts(){ if(document.getElementById('pbFonts'))return; const l=document.createElement('link'); l.id='pbFonts'; l.rel='stylesheet'; l.href='https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Dancing+Script:wght@600&family=Pacifico&family=Caveat:wght@700&family=Bebas+Neue&display=swap'; document.head.appendChild(l); }
  const FONTS=[['system-ui','Standaard'],["'Playfair Display',serif",'Elegant'],["'Dancing Script',cursive",'Handschrift'],["'Pacifico',cursive",'Speels'],["'Caveat',cursive",'Marker'],["'Bebas Neue',sans-serif",'Titel']];
  const BGS=[
    ['paper','Papier','#fbf7ef'],
    ['lake','Meer van Annecy','linear-gradient(160deg,#7ec8e3,#2b7bb0 60%,#0d3550)'],
    ['alps','Alpen','linear-gradient(180deg,#dbe7ef,#9fb8c9 70%,#6b8194)'],
    ['lavender','Lavendel (Provence)','linear-gradient(160deg,#efe3fb,#b89ad9 70%,#7a5fa6)'],
    ['sunset','Zonsondergang','linear-gradient(160deg,#ffe6c7,#ff9e7d 60%,#e75a7c)'],
    ['tricolore','Frankrijk','linear-gradient(90deg,#0055a4 0 33%,#f7f7f7 33% 66%,#ef4135 66%)'],
    ['forclaz','Bergmeer','linear-gradient(180deg,#c6e6da,#5bb89a 55%,#1f6f8b)']
  ];
  function bgCss(k){ const b=BGS.find(x=>x[0]===k); return b?b[2]:'#fbf7ef'; }
  const SHAPES=[['round','afgerond'],['rect','recht'],['circle','rond'],['pill','ovaal'],['triangle','driehoek'],['diamond','ruit'],['hexagon','zeshoek'],['star','ster']];
  function shapeStyleStr(shape){
    const R={round:'12px',rect:'0',circle:'50%',pill:'40px'};
    const CP={triangle:'polygon(50% 0,100% 100%,0 100%)',diamond:'polygon(50% 0,100% 50%,50% 100%,0 50%)',hexagon:'polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)',star:'polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)'};
    if(R[shape]!==undefined) return 'border-radius:'+R[shape];
    if(CP[shape]) return 'clip-path:'+CP[shape]+';border-radius:0';
    return 'border-radius:12px';
  }
  const STICKERS=['🌤️','☀️','⛰️','🏖️','🌊','🚗','🚵','🥾','🏊','⛵','🎈','🎉','❤️','⭐','🌸','🍦','📸','🗺️','😎','🏕️'];
  const DECOS=[['cloud','Wolk'],['sun','Zon'],['heart','Hart'],['star','Ster'],['balloon','Ballon'],['banner','Lint'],['arrow','Pijl']];
  function decoSvg(kind,color){
    const c=color||'#ff6f68';
    const S={
      cloud:'<path d="M24 74c-12 0-22-9-22-21S12 32 24 32c3-11 12-19 24-19 14 0 25 11 25 25v1c11 0 20 8 20 19s-9 19-20 19H24z" fill="'+c+'"/>',
      sun:'<circle cx="50" cy="50" r="22" fill="'+c+'"/>'+[0,1,2,3,4,5,6,7].map(i=>{const a=i*45*Math.PI/180,x1=50+28*Math.cos(a),y1=50+28*Math.sin(a),x2=50+42*Math.cos(a),y2=50+42*Math.sin(a);return '<line x1="'+x1.toFixed(1)+'" y1="'+y1.toFixed(1)+'" x2="'+x2.toFixed(1)+'" y2="'+y2.toFixed(1)+'" stroke="'+c+'" stroke-width="6" stroke-linecap="round"/>';}).join(''),
      heart:'<path d="M50 86C22 63 8 49 8 32 8 20 18 10 30 10c8 0 15 4 20 12 5-8 12-12 20-12 12 0 22 10 22 22 0 17-14 31-42 54z" fill="'+c+'"/>',
      star:'<polygon points="50,6 61,38 96,38 68,59 79,92 50,72 21,92 32,59 4,38 39,38" fill="'+c+'"/>',
      balloon:'<ellipse cx="50" cy="36" rx="26" ry="32" fill="'+c+'"/><path d="M50 68 l-5 9 h10 z" fill="'+c+'"/><line x1="50" y1="77" x2="50" y2="97" stroke="'+c+'" stroke-width="2"/>',
      banner:'<path d="M6 28 h88 l-12 16 12 16 H6 z" fill="'+c+'"/>',
      arrow:'<path d="M6 42 h58 v-16 l30 24 -30 24 v-16 H6 z" fill="'+c+'"/>'
    };
    return '<svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="display:block;overflow:visible">'+(S[kind]||S.heart)+'</svg>';
  }
  function stickerSvg(emoji){ return '<svg viewBox="0 0 100 100" width="100%" height="100%" style="display:block"><text x="50" y="80" font-size="86" text-anchor="middle">'+esc(emoji||'⭐')+'</text></svg>'; }
  function ensurePages(){ if(!Array.isArray(cfg.pages)) cfg.pages=[]; if(!cfg.pages.length) cfg.pages=[{bg:'paper',items:[]}]; if(desPage>=cfg.pages.length) desPage=cfg.pages.length-1; if(desPage<0) desPage=0; }
  function uid(){ return 'i'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
  function applyBgDom(elm,page){ if(page.bgPhoto){ const p=photos.find(x=>x.id===page.bgPhoto); if(p){ elm.style.background='#dfe6e4'; elm.appendChild(el('<img loading="lazy" decoding="async" src="'+esc(thumb(p.url,1200))+'" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;pointer-events:none">')); return; } } elm.style.background=bgCss(page.bg); }
  function pickBgPhoto(page){
    if(!photos.length){ toast('Voeg eerst foto\'s toe in het Album'); return; }
    const ov=el('<div style="position:fixed;inset:0;z-index:5200;background:rgba(6,26,40,.6);display:flex;align-items:center;justify-content:center;padding:16px"></div>');
    const card=el('<div style="background:#fff;border-radius:16px;max-width:520px;width:100%;max-height:80vh;overflow:auto;padding:16px"></div>');
    card.appendChild(el('<p style="font-weight:800;margin:0 0 8px">Kies een achtergrondfoto voor deze pagina</p>'));
    const g=el('<div class="pbGrid"></div>');
    ordered().forEach(p=>{ const c=el('<div class="pbCell"><img loading="lazy" decoding="async" src="'+esc(thumb(p.url,300))+'"></div>'); c.onclick=()=>{ pushUndo(); page.bgPhoto=p.id; scheduleSave(); ov.remove(); render(); }; g.appendChild(c); });
    card.appendChild(g);
    const cl=el('<button class="pbBtn ghost" style="margin-top:10px">Annuleren</button>'); cl.onclick=()=>ov.remove(); card.appendChild(cl);
    ov.appendChild(card); ov.onclick=e=>{ if(e.target===ov) ov.remove(); }; document.body.appendChild(ov);
  }
  const TEMPLATES=[
    {k:'cover',name:'Cover + titel',build:function(ph){ const it=[]; if(ph[0]) it.push({t:'photo',id:uid(),photo:ph[0].id,x:6,y:5,w:88,h:72,shape:'round',z:1}); it.push({t:'text',id:uid(),text:'Onze vakantie',x:8,y:79,w:84,h:14,font:"'Playfair Display',serif",size:9,color:'#0d3550',align:'center',z:2}); return it; }},
    {k:'big1',name:'1 grote foto',build:function(ph){ const it=[]; if(ph[0]) it.push({t:'photo',id:uid(),photo:ph[0].id,x:8,y:7,w:84,h:74,shape:'round',z:1}); it.push({t:'text',id:uid(),text:'Bijschrift…',x:8,y:84,w:84,h:10,font:"'Caveat',cursive",size:6,color:'#0d3550',align:'center',z:2}); return it; }},
    {k:'two',name:"2 foto's + titel",build:function(ph){ const it=[]; it.push({t:'text',id:uid(),text:'Titel',x:8,y:4,w:84,h:11,font:"'Bebas Neue',sans-serif",size:8,color:'#0d3550',align:'center',z:3}); if(ph[0]) it.push({t:'photo',id:uid(),photo:ph[0].id,x:6,y:18,w:44,h:60,shape:'round',z:1}); if(ph[1]) it.push({t:'photo',id:uid(),photo:ph[1].id,x:52,y:30,w:42,h:58,shape:'round',z:2}); return it; }},
    {k:'collage3',name:'Collage 3',build:function(ph){ const it=[]; if(ph[0]) it.push({t:'photo',id:uid(),photo:ph[0].id,x:5,y:6,w:60,h:88,shape:'round',z:1}); if(ph[1]) it.push({t:'photo',id:uid(),photo:ph[1].id,x:66,y:6,w:29,h:42,shape:'round',z:2}); if(ph[2]) it.push({t:'photo',id:uid(),photo:ph[2].id,x:66,y:52,w:29,h:42,shape:'round',z:3}); return it; }},
    {k:'grid4',name:'4 grid',build:function(ph){ const it=[]; const pos=[[6,6],[51,6],[6,51],[51,51]]; for(let i=0;i<4;i++){ if(ph[i]) it.push({t:'photo',id:uid(),photo:ph[i].id,x:pos[i][0],y:pos[i][1],w:43,h:43,shape:'rect',z:i+1}); } return it; }},
    {k:'overlap',name:'Over elkaar + tekst',build:function(ph){ const it=[]; if(ph[0]) it.push({t:'photo',id:uid(),photo:ph[0].id,x:8,y:9,w:56,h:62,shape:'round',z:1}); if(ph[1]) it.push({t:'photo',id:uid(),photo:ph[1].id,x:46,y:36,w:48,h:55,shape:'round',z:2}); it.push({t:'text',id:uid(),text:'Mooiste dag!',x:8,y:78,w:66,h:13,font:"'Dancing Script',cursive",size:8,color:'#e75a7c',align:'left',z:3}); return it; }}
  ];
  function applyTemplate(t,page){
    pushUndo(); page.items=t.build(inBook()); desSel=null; scheduleSave(); render(); toast('Sjabloon toegepast');
  }
  function snapshot(){ return {pages:JSON.stringify(cfg.pages||[]), desPage:desPage}; }
  function pushUndo(snap){ if(!snap) snap=snapshot(); undoStack.push(snap); if(undoStack.length>40) undoStack.shift(); }
  function undo(){ if(!undoStack.length){ toast('Niets om ongedaan te maken'); return; } const s=undoStack.pop(); try{ cfg.pages=JSON.parse(s.pages); }catch(e){ return; } desPage=Math.max(0,Math.min(s.desPage||0,cfg.pages.length-1)); desSel=null; scheduleSave(); render(); toast('Ongedaan gemaakt ↩️'); }
  function usedPhotoIds(){ const set=new Set(); (cfg.pages||[]).forEach(pg=>{ if(pg.bgPhoto) set.add(pg.bgPhoto); (pg.items||[]).forEach(it=>{ if(it.t==='photo'&&it.photo) set.add(it.photo); }); }); return set; }
  function autoFill(){
    const list=inBook(); if(!list.length){ toast('Geen foto\'s in het boek'); return; }
    pushUndo();
    const pages=[]; const coverT=TEMPLATES.find(t=>t.k==='cover'); let idx=0;
    pages.push({bg:'lake',bgPhoto:null,items:coverT.build([list[idx]])}); if(list[idx]) idx++;
    const cyc=['collage3','two','grid4','overlap','big1']; const bgc=['paper','alps','lavender','forclaz','sunset','tricolore']; let ci=0,bi=0;
    while(idx<list.length){ const tk=cyc[ci%cyc.length]; const t=TEMPLATES.find(x=>x.k===tk); const need=tk==='grid4'?4:(tk==='collage3'?3:((tk==='two'||tk==='overlap')?2:1)); const slice=list.slice(idx,idx+need); idx+=need; pages.push({bg:bgc[bi%bgc.length],bgPhoto:null,items:t.build(slice)}); ci++; bi++; }
    cfg.pages=pages; desPage=0; desSel=null; scheduleSave(); render(); const r=document.getElementById('pbRoot'); if(r)r.scrollTop=0; toast('Boek ingevuld: '+pages.length+' pagina\'s');
  }
  function dupPage(){ ensurePages(); pushUndo(); const copy=JSON.parse(JSON.stringify(cfg.pages[desPage])); (copy.items||[]).forEach(it=>it.id=uid()); cfg.pages.splice(desPage+1,0,copy); desPage++; desSel=null; scheduleSave(); render(); toast('Pagina gedupliceerd'); }
  function movePage(dir){ ensurePages(); const j=desPage+dir; if(j<0||j>=cfg.pages.length){ toast('Kan niet verder'); return; } pushUndo(); const t=cfg.pages[desPage]; cfg.pages[desPage]=cfg.pages[j]; cfg.pages[j]=t; desPage=j; scheduleSave(); render(); toast('Pagina verplaatst'); }

  function renderDesign(wrap){
    ensureFonts(); ensurePages();
    const page=cfg.pages[desPage]; const s=sizeObj(), ar=s.w/s.h;
    const top=el('<div class="dsBar"></div>');
    const undoB=el('<button class="pbMini">↩️ Ongedaan</button>'); if(!undoStack.length){ undoB.style.opacity='.5'; } undoB.onclick=undo; top.appendChild(undoB);
    const autoB=el('<button class="pbMini" style="background:#0f91a3;color:#fff">⚡ Vul boek automatisch</button>'); autoB.onclick=autoFill; top.appendChild(autoB);
    wrap.appendChild(top);
    const nav=el('<div class="dsBar"></div>');
    const prev=el('<button class="pbMini">‹</button>'); prev.onclick=()=>{ if(desPage>0){ desPage--; desSel=null; render(); } };
    const lbl=el('<span style="font-weight:800">Pagina '+(desPage+1)+' / '+cfg.pages.length+'</span>');
    const next=el('<button class="pbMini">›</button>'); next.onclick=()=>{ if(desPage<cfg.pages.length-1){ desPage++; desSel=null; render(); } };
    nav.append(prev,lbl,next); wrap.appendChild(nav);
    const pact=el('<div class="dsBar"></div>');
    const dupB=el('<button class="pbMini">⧉ Dupliceer</button>'); dupB.onclick=dupPage; pact.appendChild(dupB);
    const mlB=el('<button class="pbMini">◀ verplaats</button>'); mlB.onclick=()=>movePage(-1); pact.appendChild(mlB);
    const mrB=el('<button class="pbMini">verplaats ▶</button>'); mrB.onclick=()=>movePage(1); pact.appendChild(mrB);
    const delp=el('<button class="pbMini danger">🗑 pagina</button>'); delp.onclick=()=>{ if(cfg.pages.length<=1){ toast('Minstens 1 pagina'); return; } pushUndo(); cfg.pages.splice(desPage,1); desPage=Math.max(0,desPage-1); desSel=null; scheduleSave(); render(); toast('Pagina verwijderd (↩️ ongedaan mogelijk)'); }; pact.appendChild(delp);
    wrap.appendChild(pact);

    wrap.appendChild(el('<p class="pbNote" style="margin:6px 0 2px">Achtergrond (Annecy / Frankrijk of eigen foto):</p>'));
    const bgrow=el('<div class="dsBar"></div>');
    BGS.forEach(b=>{ const sw=el('<div class="dsSwatch '+(!page.bgPhoto && page.bg===b[0]?'on':'')+'" title="'+b[1]+'"></div>'); sw.style.background=b[2]; sw.onclick=()=>{ pushUndo(); page.bg=b[0]; page.bgPhoto=null; scheduleSave(); render(); }; bgrow.appendChild(sw); });
    wrap.appendChild(bgrow);
    const bgbtns=el('<div class="dsBar"></div>');
    const bph=el('<button class="pbMini">📷 Eigen foto als achtergrond</button>'); bph.onclick=()=>pickBgPhoto(page); bgbtns.appendChild(bph);
    if(page.bgPhoto){ const rem=el('<button class="pbMini danger">✕ Fotoachtergrond weg</button>'); rem.onclick=()=>{ pushUndo(); page.bgPhoto=null; scheduleSave(); render(); }; bgbtns.appendChild(rem); }
    const allb=el('<button class="pbMini">🔁 Op alle pagina\'s</button>'); allb.onclick=()=>{ pushUndo(); cfg.pages.forEach(pp=>{ pp.bg=page.bg; pp.bgPhoto=page.bgPhoto||null; }); scheduleSave(); render(); toast('Toegepast op alle pagina\'s'); }; bgbtns.appendChild(allb);
    wrap.appendChild(bgbtns);

    wrap.appendChild(el('<p class="pbNote" style="margin:8px 0 2px">Sjablonen (vult de pagina automatisch met je foto\'s):</p>'));
    const tplrow=el('<div class="dsBar"></div>');
    TEMPLATES.forEach(t=>{ const b=el('<button class="pbMini">'+t.name+'</button>'); b.onclick=()=>applyTemplate(t,page); tplrow.appendChild(b); });
    wrap.appendChild(tplrow);

    const addbar=el('<div class="dsBar"></div>');
    const at=el('<button class="pbMini">➕ Tekstvak</button>'); at.onclick=()=>{ pushUndo(); page.items.push({t:'text',id:uid(),text:'Typ hier…',x:12,y:12,w:62,h:16,font:"'Playfair Display',serif",size:6,color:'#0d3550',align:'left',z:page.items.length+1}); desSel=page.items[page.items.length-1].id; scheduleSave(); render(); };
    const pw=el('<button class="pbMini">💬 Praatwolk</button>'); pw.onclick=()=>{ pushUndo(); page.items.push({t:'text',id:uid(),bubble:true,text:'…',x:12,y:12,w:52,h:16,font:"'Caveat',cursive",size:8,color:'#0d3550',align:'center',z:page.items.length+1}); desSel=page.items[page.items.length-1].id; scheduleSave(); render(); }; addbar.appendChild(at); addbar.appendChild(pw);
    addbar.appendChild(el('<span class="pbNote" style="margin:0">Sleep · hoekje/2 vingers = vergroten · 🗑/Delete = weg · tik in tekst om te typen</span>')); wrap.appendChild(addbar);
    wrap.appendChild(el('<p class="pbNote" style="margin:8px 0 2px">Versiersels (kleur kies je na selectie):</p>'));
    const decos=el('<div class="dsBar"></div>');
    DECOS.forEach(d=>{ const b=el('<button class="pbMini" style="width:42px;height:36px;padding:3px">'+decoSvg(d[0],'#ff6f68')+'</button>'); b.title=d[1]; b.onclick=()=>{ pushUndo(); page.items.push({t:'deco',id:uid(),kind:d[0],color:'#ff6f68',x:20,y:20,w:26,h:26,z:page.items.length+1}); desSel=page.items[page.items.length-1].id; scheduleSave(); render(); }; decos.appendChild(b); });
    wrap.appendChild(decos);
    wrap.appendChild(el('<p class="pbNote" style="margin:8px 0 2px">Stickers (icoontjes):</p>'));
    const stks=el('<div class="dsBar" style="max-height:80px;overflow-y:auto"></div>');
    STICKERS.forEach(em=>{ const b=el('<button class="pbMini" style="font-size:20px;width:38px;height:36px;padding:0">'+em+'</button>'); b.onclick=()=>{ pushUndo(); page.items.push({t:'sticker',id:uid(),emoji:em,x:22,y:22,w:16,h:16,z:page.items.length+1}); desSel=page.items[page.items.length-1].id; scheduleSave(); render(); }; stks.appendChild(b); });
    wrap.appendChild(stks);

    const cw=el('<div class="dsCanvasWrap"></div>');
    const canvas=el('<div class="dsCanvas" id="dsCanvas" style="aspect-ratio:'+ar+'"></div>');
    applyBgDom(canvas,page);
    (page.items||[]).slice().sort((a,b)=>(a.z||0)-(b.z||0)).forEach(it=>canvas.appendChild(renderItem(it,page)));
    cw.appendChild(canvas); wrap.appendChild(cw);
    const newpg=el('<button class="pbBtn ghost" style="margin-top:8px">➕ Nieuwe pagina toevoegen</button>'); newpg.onclick=()=>{ pushUndo(); cfg.pages.push({bg:page.bg,bgPhoto:page.bgPhoto||null,items:[]}); desPage=cfg.pages.length-1; desSel=null; scheduleSave(); render(); const r=document.getElementById('pbRoot'); if(r)r.scrollTop=0; toast('Pagina toegevoegd — nu '+cfg.pages.length+' pagina\'s'); }; wrap.appendChild(newpg);

    if(desSel){ const it=(page.items||[]).find(x=>x.id===desSel); if(it) wrap.appendChild(itemToolbar(it,page)); }


    const vw2=el('<button class="pbBtn alt" style="margin-top:14px">👁 Bekijk als digitaal boek (inkijkexemplaar)</button>'); vw2.onclick=openViewer; wrap.appendChild(vw2);
    const dl=el('<button class="pbBtn primary" style="margin-top:8px">⬇️ Ontwerp als print-PDF (voor Albelli)</button>'); dl.onclick=()=>exportDesignPDF(dl); wrap.appendChild(dl);
    wrap.appendChild(el('<p class="pbNote">Je vrije ontwerp wordt op de gekozen paginamaat geëxporteerd. Houd belangrijke dingen iets van de rand i.v.m. Albelli\'s afsnijding.</p>'));
    wrap.appendChild(canvaHint());
    wrap.appendChild(el('<div style="height:122px"></div>'));
    const used=usedPhotoIds();
    const tray=el('<div style="position:fixed;left:0;right:0;bottom:0;z-index:40;background:#fff;border-top:1px solid #e2ecea;box-shadow:0 -6px 16px rgba(13,53,80,.12);padding:7px 10px 9px"></div>');
    tray.appendChild(el('<div style="font-size:11.5px;font-weight:800;color:#0d3550;margin-bottom:4px">Tik een foto om op deze pagina te zetten'+(used.size?' · ✓ = al ergens gebruikt':'')+'</div>'));
    const strip=el('<div class="dsStrip"></div>');
    if(!photos.length) strip.appendChild(el('<span class="pbNote" style="margin:0">Nog geen foto\'s — voeg ze toe in het Album.</span>'));
    ordered().forEach(p=>{ const w2=el('<div style="position:relative;flex:0 0 auto"></div>'); const im=el('<img loading="lazy" decoding="async" src="'+esc(thumb(p.url,170))+'" style="height:60px;width:60px;object-fit:cover;border-radius:8px'+(used.has(p.id)?';opacity:.4':'')+'">'); im.onclick=()=>{ pushUndo(); page.items.push({t:'photo',id:uid(),photo:p.id,x:15,y:20,w:55,h:42,shape:'round',z:page.items.length+1}); desSel=page.items[page.items.length-1].id; scheduleSave(); render(); }; w2.appendChild(im); if(used.has(p.id)) w2.appendChild(el('<span style="position:absolute;top:2px;right:2px;background:#37b26b;color:#fff;border-radius:50%;width:16px;height:16px;font-size:10px;display:flex;align-items:center;justify-content:center">✓</span>')); strip.appendChild(w2); });
    tray.appendChild(strip); wrap.appendChild(tray);
  }

  function renderItem(it,page){
    const node=el('<div class="dsItem'+(desSel===it.id?' sel':'')+'" style="left:'+it.x+'%;top:'+it.y+'%;width:'+it.w+'%;height:'+it.h+'%;z-index:'+(it.z||0)+'"></div>');
    if(it.t==='photo'){ const p=photos.find(x=>x.id===it.photo); const img=el('<img loading="lazy" decoding="async" src="'+(p?esc(thumb(p.url,1000)):'')+'">'); img.style.cssText=shapeStyleStr(it.shape); node.appendChild(img); attachGesture(node,node,it,{drag:true,pinch:true}); }
    else if(it.t==='deco'){ node.innerHTML=decoSvg(it.kind,it.color); attachGesture(node,node,it,{drag:true,pinch:true}); }
    else if(it.t==='sticker'){ node.innerHTML=stickerSvg(it.emoji); attachGesture(node,node,it,{drag:true,pinch:true}); }
    else {
      const handle=el('<div class="dsHandle">⠿ sleep</div>');
      const tx=el('<div class="dsText" contenteditable="true"></div>'); tx.style.cssText='width:100%;height:100%;font-family:'+it.font+';font-size:'+it.size+'cqw;color:'+it.color+';text-align:'+(it.align||'left')+(it.bubble?';background:#fff;border:2px solid #d5e0dd;border-radius:16px;padding:8px 11px;box-sizing:border-box;display:flex;align-items:center':''); tx.textContent=it.text||'';
      tx.addEventListener('focus',()=>{ desSel=it.id; });
      tx.addEventListener('blur',()=>{ it.text=tx.textContent; scheduleSave(); });
      node.appendChild(handle); node.appendChild(tx);
      if(it.bubble){ node.appendChild(el('<div style="position:absolute;left:18px;bottom:-9px;width:16px;height:16px;background:#fff;border-right:2px solid #d5e0dd;border-bottom:2px solid #d5e0dd;transform:rotate(45deg)"></div>')); }
      attachGesture(handle,node,it,{drag:true,pinch:false});
      attachGesture(node,node,it,{drag:false,pinch:true});
    }
    const rsz=el('<div class="rsz"></div>'); node.appendChild(rsz); resizeItem(rsz,node,it);
    if(desSel===it.id){ const del=el('<div class="dsDel">🗑</div>'); del.addEventListener('pointerdown',e=>e.stopPropagation()); del.onclick=e=>{ e.stopPropagation(); deleteItem(it,page); }; node.appendChild(del); }
    return node;
  }
  function deleteItem(it,page){ pushUndo(); page.items=(page.items||[]).filter(x=>x.id!==it.id); desSel=null; scheduleSave(); render(); }
  function attachGesture(listenEl,node,it,opts){
    opts=opts||{}; const pts=new Map(); let mode=null,s=null;
    const rect=()=>node.parentElement.getBoundingClientRect();
    listenEl.addEventListener('pointerdown',function(e){
      if(e.target.classList && (e.target.classList.contains('rsz')||e.target.classList.contains('dsDel'))) return;
      pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pts.size===1){
        if(opts.drag===false) return;
        desSel=it.id; document.querySelectorAll('.dsItem').forEach(n=>n.classList.remove('sel')); node.classList.add('sel');
        const r=rect(); s={ox:it.x,oy:it.y,sx:e.clientX,sy:e.clientY,W:r.width,H:r.height,changed:false,before:snapshot()}; mode='drag';
        try{ listenEl.setPointerCapture(e.pointerId); }catch(_){}
      } else if(pts.size===2 && opts.pinch!==false){
        desSel=it.id; const a=[...pts.values()]; const d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y); const r=rect();
        s={ow:it.w,oh:it.h,d0:d||1,changed:false,before:snapshot()}; mode='pinch';
      }
    });
    listenEl.addEventListener('pointermove',function(e){
      if(!pts.has(e.pointerId)) return; pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(mode==='drag'&&pts.size===1&&s){ if(Math.abs(e.clientX-s.sx)+Math.abs(e.clientY-s.sy)>4)s.changed=true; it.x=Math.max(-15,Math.min(96,s.ox+(e.clientX-s.sx)/s.W*100)); it.y=Math.max(-15,Math.min(96,s.oy+(e.clientY-s.sy)/s.H*100)); node.style.left=it.x+'%'; node.style.top=it.y+'%'; }
      else if(mode==='pinch'&&pts.size>=2&&s){ s.changed=true; const a=[...pts.values()]; const d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y); const sc=d/s.d0; it.w=Math.max(8,Math.min(150,s.ow*sc)); it.h=Math.max(6,Math.min(150,s.oh*sc)); node.style.width=it.w+'%'; node.style.height=it.h+'%'; }
    });
    function endp(e){ pts.delete(e.pointerId); if(pts.size===0){ if(mode){ if(s&&s.changed){ pushUndo(s.before); scheduleSave(); } render(); } mode=null; s=null; } else if(mode==='pinch'&&pts.size<2){ if(s&&s.changed){ pushUndo(s.before); scheduleSave(); } render(); mode=null; s=null; } }
    listenEl.addEventListener('pointerup',endp); listenEl.addEventListener('pointercancel',endp);
  }
  function resizeItem(handle,node,it){
    handle.addEventListener('pointerdown',function(e){
      e.stopPropagation(); const cv=node.parentElement.getBoundingClientRect(); const sx=e.clientX, sy=e.clientY, ow=it.w, oh=it.h;
      try{ handle.setPointerCapture(e.pointerId); }catch(_){}
      function mv(ev){ const dw=(ev.clientX-sx)/cv.width*100, dh=(ev.clientY-sy)/cv.height*100; it.w=Math.max(8,Math.min(100,ow+dw)); it.h=Math.max(6,Math.min(100,oh+dh)); node.style.width=it.w+'%'; node.style.height=it.h+'%'; }
      function up(){ handle.removeEventListener('pointermove',mv); handle.removeEventListener('pointerup',up); scheduleSave(); }
      handle.addEventListener('pointermove',mv); handle.addEventListener('pointerup',up);
    });
  }
  function itemToolbar(it,page){
    const box=el('<div class="pbEdit"></div>');
    box.appendChild(el('<p style="font-weight:800;margin:0 0 6px">Geselecteerd: '+({photo:'foto',deco:'versiersel',sticker:'sticker',text:'tekst'}[it.t]||'item')+'</p>'));
    const row=el('<div class="pbMiniRow"></div>');
    if(it.t==='photo'){
      SHAPES.forEach(sh=>{ const b=el('<button class="pbMini'+(it.shape===sh[0]?' on':'')+'">'+sh[1]+'</button>'); b.onclick=()=>{ it.shape=sh[0]; scheduleSave(); render(); }; row.appendChild(b); });
    } else if(it.t==='deco'){
      ['#ff6f68','#0f91a3','#0d3550','#e75a7c','#f4b400','#37b26b','#ffffff'].forEach(c=>{ const b=el('<button class="pbMini" style="width:28px;height:28px;padding:0;background:'+c+';border:1px solid #d5e0dd"></button>'); b.onclick=()=>{ it.color=c; scheduleSave(); render(); }; row.appendChild(b); });
    } else if(it.t==='sticker'){
      row.appendChild(el('<span class="pbNote" style="margin:0">Sleep om te verplaatsen · hoekje of pinch = groter/kleiner</span>'));
    } else {
      const fs=el('<select class="pbMini"></select>'); FONTS.forEach(f=>{ const o=document.createElement('option'); o.value=f[0]; o.textContent=f[1]; if(it.font===f[0])o.selected=true; fs.appendChild(o); }); fs.onchange=()=>{ it.font=fs.value; scheduleSave(); render(); }; row.appendChild(fs);
      const mn=el('<button class="pbMini">A−</button>'); mn.onclick=()=>{ it.size=Math.max(2,(it.size||6)-1); scheduleSave(); render(); }; row.appendChild(mn);
      const pl=el('<button class="pbMini">A+</button>'); pl.onclick=()=>{ it.size=Math.min(24,(it.size||6)+1); scheduleSave(); render(); }; row.appendChild(pl);
      ['#0d3550','#ffffff','#ff6f68','#0f91a3','#e75a7c'].forEach(c=>{ const b=el('<button class="pbMini" style="width:26px;height:26px;padding:0;background:'+c+'"></button>'); b.onclick=()=>{ it.color=c; scheduleSave(); render(); }; row.appendChild(b); });
    }
    box.appendChild(row);
    const row2=el('<div class="pbMiniRow"></div>');
    const fr=el('<button class="pbMini">⬆ naar voren</button>'); fr.onclick=()=>{ it.z=Math.max.apply(null,page.items.map(x=>x.z||0))+1; scheduleSave(); render(); };
    const bk=el('<button class="pbMini">⬇ naar achter</button>'); bk.onclick=()=>{ it.z=Math.min.apply(null,page.items.map(x=>x.z||0))-1; scheduleSave(); render(); };
    const dl=el('<button class="pbMini danger">🗑 verwijderen</button>'); dl.onclick=()=>{ page.items=page.items.filter(x=>x.id!==it.id); desSel=null; scheduleSave(); render(); };
    row2.append(fr,bk,dl); box.appendChild(row2);
    return box;
  }
  function ensureH2C(){ return ensureScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', ()=>window.html2canvas); }
  async function exportDesignPDF(btn){
    ensurePages(); if(!cfg.pages.length){ toast('Geen pagina\'s'); return; }
    const old=btn?btn.textContent:''; if(btn){ btn.disabled=true; btn.textContent='PDF wordt gemaakt…'; }
    let stage=null;
    try{
      await ensureJsPDF(); await ensureH2C();
      const s=sizeObj(), ar=s.w/s.h, pw=s.w, ph=s.h;
      const { jsPDF }=window.jspdf; const doc=new jsPDF({orientation: pw>=ph?'landscape':'portrait', unit:'mm', format:[pw,ph]});
      const W=1240, H=Math.round(W/ar);
      stage=document.createElement('div'); stage.style.cssText='position:fixed;left:-99999px;top:0;width:'+W+'px;height:'+H+'px;z-index:-1'; document.body.appendChild(stage);
      for(let pi=0; pi<cfg.pages.length; pi++){
        const page=cfg.pages[pi]; stage.innerHTML='';
        const cv=document.createElement('div'); cv.style.cssText='position:relative;width:'+W+'px;height:'+H+'px;overflow:hidden;'+(page.bgPhoto?'':'background:'+bgCss(page.bg)); stage.appendChild(cv);
        if(page.bgPhoto){ const bp=photos.find(x=>x.id===page.bgPhoto); if(bp){ const bimg=new Image(); bimg.crossOrigin='anonymous'; bimg.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0'; const bpr=new Promise(r=>{ bimg.onload=r; bimg.onerror=r; }); bimg.src=bp.url; await bpr; cv.appendChild(bimg); } else { cv.style.background=bgCss(page.bg); } }
        for(let k=0;k<(page.items||[]).length;k++){
          const it=page.items[k]; const n=document.createElement('div'); n.style.cssText='position:absolute;left:'+it.x+'%;top:'+it.y+'%;width:'+it.w+'%;height:'+it.h+'%;z-index:'+(it.z||0);
          if(it.t==='photo'){ const p=photos.find(x=>x.id===it.photo); const img=new Image(); img.crossOrigin='anonymous'; img.style.cssText='width:100%;height:100%;object-fit:cover;'+shapeStyleStr(it.shape); const pr=new Promise(r=>{ img.onload=r; img.onerror=r; }); img.src=p?p.url:''; await pr; n.appendChild(img); }
          else if(it.t==='deco'){ n.style.overflow='visible'; n.innerHTML=decoSvg(it.kind,it.color); }
          else if(it.t==='sticker'){ n.innerHTML=stickerSvg(it.emoji); }
          else { const t=document.createElement('div'); t.textContent=it.text||''; t.style.cssText='width:100%;height:100%;font-family:'+it.font+';font-size:'+(it.size*W/100)+'px;color:'+it.color+';text-align:'+(it.align||'left')+';padding:'+Math.round(W*0.006)+'px '+Math.round(W*0.008)+'px;overflow:hidden;line-height:1.15'+(it.bubble?';background:#fff;border:2px solid #d5e0dd;border-radius:'+Math.round(W*0.014)+'px;box-sizing:border-box;display:flex;align-items:center':''); n.appendChild(t); if(it.bubble){ const ts=Math.round(W*0.016); const tl=document.createElement('div'); tl.style.cssText='position:absolute;left:'+Math.round(W*0.018)+'px;bottom:-'+Math.round(ts/2)+'px;width:'+ts+'px;height:'+ts+'px;background:#fff;border-right:2px solid #d5e0dd;border-bottom:2px solid #d5e0dd;transform:rotate(45deg)'; n.appendChild(tl); } }
          cv.appendChild(n);
        }
        const canvas=await window.html2canvas(cv,{useCORS:true,scale:2,backgroundColor:null,logging:false});
        const data=canvas.toDataURL('image/jpeg',0.92);
        if(pi>0) doc.addPage([pw,ph], pw>=ph?'landscape':'portrait');
        doc.addImage(data,'JPEG',0,0,pw,ph);
      }
      doc.save('Fotoboek-ontwerp-'+album+'-Annecy2026.pdf');
      toast('PDF gedownload ✓');
    }catch(e){ console.error(e); alert('PDF maken lukte niet. Probeer opnieuw of met minder items.'); }
    finally{ if(stage&&stage.parentNode) stage.parentNode.removeChild(stage); if(btn){ btn.disabled=false; btn.textContent=old; } }
  }

  /* ---------- DIGITAAL INKIJKEXEMPLAAR ---------- */
  function openViewer(){
    const s=sizeObj(), ar=s.w/s.h;
    const ov=document.createElement('div'); ov.id='pbViewer';
    ov.style.cssText='position:fixed;inset:0;z-index:5000;background:#0d3550;overflow-y:auto;padding:16px 12px 40px';
    const top=document.createElement('div'); top.style.cssText='display:flex;justify-content:space-between;align-items:center;gap:10px;max-width:600px;margin:0 auto 12px;color:#fff';
    top.innerHTML='<b style="font-size:15px">📖 Inkijkexemplaar — '+esc(albName())+'</b>';
    const cl=document.createElement('button'); cl.textContent='✕ Sluiten'; cl.style.cssText='background:#ffffff22;color:#fff;border:none;border-radius:10px;padding:8px 12px;font-weight:800;cursor:pointer;flex:0 0 auto'; cl.onclick=()=>ov.remove(); top.appendChild(cl);
    ov.appendChild(top);
    const host=document.createElement('div'); host.style.cssText='max-width:600px;margin:0 auto;display:flex;flex-direction:column;gap:16px'; ov.appendChild(host);
    if(tab==='design'){
      ensurePages();
      (cfg.pages||[]).forEach((page,idx)=>{
        const pg=el('<div class="pbPage" style="max-width:600px;aspect-ratio:'+ar+';container-type:size"></div>');
        applyBgDom(pg,page);
        (page.items||[]).slice().sort((a,b)=>(a.z||0)-(b.z||0)).forEach(it=>{
          const n=el('<div style="position:absolute;left:'+it.x+'%;top:'+it.y+'%;width:'+it.w+'%;height:'+it.h+'%;z-index:'+(it.z||0)+'"></div>');
          if(it.t==='photo'){ const p=photos.find(x=>x.id===it.photo); n.innerHTML='<img loading="lazy" src="'+(p?esc(thumb(p.url,1000)):'')+'" style="width:100%;height:100%;object-fit:cover;'+shapeStyleStr(it.shape)+'">'; }
          else if(it.t==='deco'){ n.style.overflow='visible'; n.innerHTML=decoSvg(it.kind,it.color); }
          else if(it.t==='sticker'){ n.innerHTML=stickerSvg(it.emoji); }
          else { const t=el('<div style="width:100%;height:100%;font-family:'+it.font+';font-size:'+it.size+'cqw;color:'+it.color+';text-align:'+(it.align||'left')+';padding:4px 6px;overflow:hidden;line-height:1.15'+(it.bubble?';background:#fff;border:2px solid #d5e0dd;border-radius:16px;box-sizing:border-box;display:flex;align-items:center':'')+'"></div>'); t.textContent=it.text||''; n.appendChild(t); if(it.bubble){ n.appendChild(el('<div style="position:absolute;left:18px;bottom:-9px;width:16px;height:16px;background:#fff;border-right:2px solid #d5e0dd;border-bottom:2px solid #d5e0dd;transform:rotate(45deg)"></div>')); } }
          pg.appendChild(n);
        });
        pg.appendChild(el('<span style="position:absolute;bottom:4px;right:8px;font-size:10px;color:#9fb3c2">'+(idx+1)+'</span>'));
        host.appendChild(pg);
      });
      if(!cfg.pages.length||!(cfg.pages[0].items||[]).length) host.appendChild(el('<p style="color:#cdd;text-align:center">Nog niets ontworpen — voeg foto\'s en tekst toe in Ontwerpen.</p>'));
    } else {
      const cov=coverPhoto();
      const cp=el('<div class="pbPage" style="max-width:600px;aspect-ratio:'+ar+'"></div>');
      const cvr=el('<div class="pbCover" style="width:100%;height:100%"></div>');
      if(cov) cvr.appendChild(el('<img loading="lazy" src="'+esc(thumb(cov.url,1100))+'">'));
      cvr.appendChild(el('<div class="ct"><div class="eb">ANNECY 2026</div><h3>'+esc(cfg.title||albName())+'</h3>'+(cfg.subtitle?'<p>'+esc(cfg.subtitle)+'</p>':'')+'</div>'));
      cp.appendChild(cvr); host.appendChild(cp);
      const list=inBook(), per=cfg.layout||2, cols=per===4?2:1;
      for(let i=0;i<list.length;i+=per){
        const chunk=list.slice(i,i+per);
        const pg=el('<div class="pbPage" style="max-width:600px;aspect-ratio:'+ar+'"></div>');
        const cvn=el('<div class="pbCanvas '+(per===1?'full':'')+'" style="grid-template-columns:repeat('+cols+',1fr)"></div>');
        chunk.forEach(p=>{ const fig=el('<figure></figure>'); fig.appendChild(el('<img loading="lazy" src="'+esc(thumb(p.url,900))+'">')); if(p.caption&&per>1) fig.appendChild(el('<figcaption>'+esc(p.caption)+'</figcaption>')); cvn.appendChild(fig); });
        pg.appendChild(cvn); host.appendChild(pg);
      }
      if(!list.length) host.appendChild(el('<p style="color:#cdd;text-align:center">Nog geen foto\'s in het boek.</p>'));
    }
    document.body.appendChild(ov);
  }

  function close(){ try{ if(chan) lc().removeChannel(chan); }catch(e){} chan=null; const r=document.getElementById('pbRoot'); if(r) r.remove(); document.body.style.overflow=''; }

  function start(){
    if(!document.getElementById('pbCss')){ const st=document.createElement('style'); st.id='pbCss'; st.textContent=css; document.head.appendChild(st); }
    if(!window.__pbKeyBound){ window.__pbKeyBound=true; document.addEventListener('keydown',function(e){
      if(!document.getElementById('pbRoot')||tab!=='design'||!desSel) return;
      const ae=document.activeElement; if(ae && (ae.isContentEditable||ae.tagName==='INPUT'||ae.tagName==='TEXTAREA'||ae.tagName==='SELECT')) return;
      if(e.key==='Delete'||e.key==='Backspace'){ e.preventDefault(); ensurePages(); const pg=cfg.pages[desPage]; if(pg){ pushUndo(); pg.items=(pg.items||[]).filter(x=>x.id!==desSel); desSel=null; scheduleSave(); render(); } }
    }); }
    tab='album'; openPhotoId=null; photos=[]; cfg=defaultCfg(); render();
    if(joined()){ loadAll(); subscribe(); }
  }

  window.AnnecyPhotobook={ open:function(a){ if(a) album=a; start(); }, close:close };
})();
