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
  `;

  function el(html){ const d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstElementChild; }
  function toast(m){ let t=document.getElementById('pbToast'); if(!t){t=document.createElement('div');t.id='pbToast';t.style.cssText='position:fixed;left:50%;bottom:30px;transform:translateX(-50%);background:#0d3550;color:#fff;padding:11px 18px;border-radius:999px;font-weight:800;font-size:14px;z-index:6000;box-shadow:0 10px 30px rgba(0,0,0,.3);opacity:0;transition:opacity .2s';document.body.appendChild(t);} t.textContent=m; t.style.opacity='1'; clearTimeout(t._h); t._h=setTimeout(()=>t.style.opacity='0',2200); }
  function albName(k){ const a=ALBUMS.find(x=>x[0]===(k||album)); return a?a[1]:k; }
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
    render();
  }
  function ordered(){ const m={}; photos.forEach(p=>m[p.id]=p); return cfg.order.map(id=>m[id]).filter(Boolean); }
  function inBook(){ return ordered().filter(p=>!cfg.hidden.includes(p.id)); }

  function subscribe(){
    const c=lc(), g=gid(); if(!c||!g) return;
    try{ if(chan) c.removeChannel(chan); }catch(e){}
    try{ chan=c.channel('pb-'+g).on('postgres_changes',{event:'*',schema:'public',table:'photos',filter:'group_id=eq.'+g},()=>{ if(document.getElementById('pbRoot')) softReload(); }).subscribe(); }catch(e){}
  }
  async function softReload(){ const c=lc(), g=gid(); try{ const r=await c.from('photos').select('*').eq('group_id',g).eq('album',album).order('created_at'); photos=r.data||[]; const ids=photos.map(p=>p.id); cfg.order=(cfg.order||[]).filter(id=>ids.includes(id)); ids.forEach(id=>{ if(!cfg.order.includes(id)) cfg.order.push(id); }); if(!openPhotoId) render(); }catch(e){} }

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
    const t1=el('<button class="pbTab '+(tab==='album'?'on':'')+'">📷 Album ('+inBook().length+')</button>'); t1.onclick=()=>{ tab='album'; render(); };
    const t2=el('<button class="pbTab '+(tab==='book'?'on':'')+'">📖 Fotoboek maken</button>'); t2.onclick=()=>{ tab='book'; render(); };
    tabs.appendChild(t1); tabs.appendChild(t2); wrap.appendChild(tabs);

    if(tab==='album') renderAlbum(wrap); else renderBook(wrap);
  }

  function renderAlbum(wrap){
    const up=el('<label class="pbUpload">➕ Foto\'s toevoegen aan '+esc(albName())+'<input type="file" accept="image/*" capture="environment" multiple style="display:none"></label>');
    const inp=up.querySelector('input');
    inp.onchange=async()=>{ const files=Array.from(inp.files||[]); if(!files.length)return; up.textContent='Bezig met uploaden…'; await uploadFiles(files); await softReload(); toast('Foto\'s toegevoegd 🎉'); render(); };
    wrap.appendChild(up);
    if(!photos.length){ wrap.appendChild(el('<p class="pbNote">Nog geen foto\'s. Tik hierboven om foto\'s vanaf je telefoon toe te voegen. Iedereen in de familie ziet ze live.</p>')); return; }
    wrap.appendChild(el('<p class="pbNote">Tik op een foto om bijschrift, cover, volgorde of verwijderen te regelen. 🚫 = niet in het boek.</p>'));
    const grid=el('<div class="pbGrid"></div>');
    ordered().forEach(p=>{
      const hidden=cfg.hidden.includes(p.id), isCover=cfg.cover===p.id;
      const cell=el('<div class="pbCell '+(isCover?'cover':'')+'"><img loading="lazy" src="'+esc(p.url)+'" alt="">'+(isCover?'<span class="pbCoverBadge">COVER</span>':'')+(p.caption?'<span class="tag">'+esc(p.caption)+'</span>':'')+(hidden?'<span class="hid">🚫</span>':'')+'</div>');
      cell.onclick=()=>{ openPhotoId=(openPhotoId===p.id?null:p.id); render(); };
      grid.appendChild(cell);
      if(openPhotoId===p.id) grid.appendChild(photoEditor(p));
    });
    wrap.appendChild(grid);
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
    if(!confirm('Deze foto definitief verwijderen uit het album?')) return;
    const c=lc();
    try{ if(p.path) await c.storage.from('fotos').remove([p.path]); }catch(e){}
    try{ await c.from('photos').delete().eq('id',p.id); }catch(e){ toast('Verwijderen lukte niet'); return; }
    photos=photos.filter(x=>x.id!==p.id); cfg.order=cfg.order.filter(i=>i!==p.id); cfg.hidden=cfg.hidden.filter(i=>i!==p.id); if(cfg.cover===p.id)cfg.cover=null; openPhotoId=null; scheduleSave(); render(); toast('Verwijderd');
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

    const dl=el('<button class="pbBtn primary">⬇️ Print-klare PDF maken (voor Albelli)</button>'); dl.onclick=()=>exportPDF(dl); wrap.appendChild(dl);
    wrap.appendChild(el('<p class="pbNote">De PDF krijgt de gekozen paginamaat + 3&nbsp;mm afloop (bleed) en foto\'s op ~300&nbsp;dpi. Upload \'m bij Albelli via hun <b>PDF-fotoboek / zelf-ontworpen boek</b> optie. Let op: controleer bij Albelli de exacte maat en of ze losse pagina\'s of spreads willen.</p>'));

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
    if(cov) cvr.appendChild(el('<img src="'+esc(cov.url)+'">'));
    cvr.appendChild(el('<div class="ct"><div class="eb">ANNECY 2026</div><h3>'+esc(cfg.title||albName())+'</h3>'+(cfg.subtitle?'<p>'+esc(cfg.subtitle)+'</p>':'')+'</div>'));
    cpage.appendChild(cvr); cpage.appendChild(el('<span class="pglabel">cover</span>')); host.appendChild(cpage);
    // content
    const list=inBook(), per=cfg.layout||2, cols=per===4?2:1;
    for(let i=0;i<list.length;i+=per){
      const chunk=list.slice(i,i+per);
      const page=el('<div class="pbPage" style="aspect-ratio:'+ar+'"></div>');
      const canvas=el('<div class="pbCanvas '+(per===1?'full':'')+'" style="grid-template-columns:repeat('+cols+',1fr)"></div>');
      chunk.forEach(p=>{ const fig=el('<figure></figure>'); fig.appendChild(el('<img src="'+esc(p.url)+'">')); if(p.caption&&per>1) fig.appendChild(el('<figcaption>'+esc(p.caption)+'</figcaption>')); canvas.appendChild(fig); });
      page.appendChild(canvas); page.appendChild(el('<span class="pglabel">'+((i/per)+2)+'</span>')); host.appendChild(page);
    }
  }

  /* ---------- PDF EXPORT ---------- */
  function ensureJsPDF(){ return new Promise((res,rej)=>{ if(window.jspdf&&window.jspdf.jsPDF) return res(); const s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'; s.onload=()=>res(); s.onerror=rej; document.head.appendChild(s); }); }
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

  function close(){ try{ if(chan) lc().removeChannel(chan); }catch(e){} chan=null; const r=document.getElementById('pbRoot'); if(r) r.remove(); document.body.style.overflow=''; }

  function start(){
    if(!document.getElementById('pbCss')){ const st=document.createElement('style'); st.id='pbCss'; st.textContent=css; document.head.appendChild(st); }
    tab='album'; openPhotoId=null; photos=[]; cfg=defaultCfg(); render();
    if(joined()){ loadAll(); subscribe(); }
  }

  window.AnnecyPhotobook={ open:function(a){ if(a) album=a; start(); }, close:close };
})();
