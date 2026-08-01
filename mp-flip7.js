/* Annecy Family Playbook — Multiplayer Flip 7 (turn-based, live).
   Iedereen speelt op zijn eigen telefoon. Om de beurt één actie (Flip of Stop),
   dan door naar de volgende speler. Live via de game_tables-motor. Eerste bij 200 wint. */
(function(){
  "use strict";
  const A=()=>window.AnnecyLive||null;
  const lc=()=>{ const a=A(); return a&&a.client||null; };
  const me=()=>{ const a=A(); return a&&a.player||null; };
  const joined=()=>{ const a=A(); return !!(a&&typeof a.isJoined==='function'&&a.isJoined()); };
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const el=(h)=>{ const d=document.createElement('div'); d.innerHTML=h.trim(); return d.firstElementChild; };
  function toast(m){ let t=document.getElementById('mfToast'); if(!t){t=document.createElement('div');t.id='mfToast';t.style.cssText='position:fixed;left:50%;bottom:30px;transform:translateX(-50%);background:#0d3550;color:#fff;padding:11px 18px;border-radius:999px;font-weight:800;z-index:6000;opacity:0;transition:opacity .2s';document.body.appendChild(t);} t.textContent=m; t.style.opacity='1'; clearTimeout(t._h); t._h=setTimeout(()=>t.style.opacity='0',2200); }
  const GAME='flip7mp', TARGET=200;

  let tid=null, ver=0, state=null, chan=null, myId=null, lastTurnMine=false, actx=null;

  function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
  function freshDeck(){ const d=[]; for(let v=0;v<=12;v++){ const cnt=v===0?1:v; for(let k=0;k<cnt;k++)d.push(v); } return shuffle(d); }

  /* ---- PURE REDUCER (testbaar) ---- */
  function reduce(s, act){
    s=JSON.parse(JSON.stringify(s));
    const seats=s.seats, cur=seats[s.turn];
    if(!cur || cur.id!==act.by) return s;            // niet jouw beurt
    const P=s.players[act.by];
    if(!P || P.status!=='in') return s;
    if(act.type==='flip'){
      if(!s.deck.length) s.deck=freshDeck();
      const card=s.deck.shift();
      P.cards.push(card);
      if(P.uniq.indexOf(card)>=0){ P.status='busted'; P.round=0; s.log=cur.name+' flipte '+card+' → BUST!'; }
      else { P.uniq.push(card); P.round=P.uniq.reduce((a,b)=>a+b,0); if(P.uniq.length>=7){ P.status='flip7'; P.round+=15; s.log=cur.name+' haalde FLIP 7! (+15)'; } else { s.log=cur.name+' flipte '+card; } }
    } else if(act.type==='stay'){ P.status='stayed'; s.log=cur.name+' stopt op '+P.round; }
    // volgende beurt
    advance(s);
    if(!seatsInPlay(s).length) endRound(s);
    return s;
  }
  function seatsInPlay(s){ return s.seats.filter(x=>s.players[x.id].status==='in'); }
  function advance(s){ const n=s.seats.length; for(let k=1;k<=n;k++){ const idx=(s.turn+k)%n; if(s.players[s.seats[idx].id].status==='in'){ s.turn=idx; return; } } }
  function endRound(s){
    s.seats.forEach(x=>{ const P=s.players[x.id]; P.total+=(P.status==='busted'?0:P.round); });
    const win=s.seats.map(x=>({name:x.name,total:s.players[x.id].total})).filter(o=>o.total>=TARGET).sort((a,b)=>b.total-a.total)[0];
    if(win){ s.phase='over'; s.winner=win.name; s.log='🏆 '+win.name+' wint met '+win.total+'!'; return; }
    // nieuwe ronde
    s.round=(s.round||1)+1; s.deck=freshDeck();
    s.seats.forEach(x=>{ s.players[x.id]={uniq:[],cards:[],round:0,status:'in',total:s.players[x.id].total}; });
    s.startSeat=((s.startSeat||0)+1)%s.seats.length; s.turn=s.startSeat; s.phase='playing';
    s.log='Ronde '+s.round+' — '+s.seats[s.turn].name+' begint.';
  }

  /* ---- NETWERK ---- */
  async function fetchTable(){ const c=lc(); const r=await c.from('game_tables').select('state,version,status,code').eq('id',tid).maybeSingle(); if(r.data){ state=r.data.state; ver=r.data.version; state.status=r.data.status; state.code=r.data.code; } return r.data; }
  function subscribe(){ const c=lc(); try{ if(chan) c.removeChannel(chan); }catch(e){} chan=c.channel('mf-'+tid).on('postgres_changes',{event:'*',schema:'public',table:'game_tables',filter:'id=eq.'+tid},(p)=>{ if(p.new){ state=p.new.state; ver=p.new.version; state.status=p.new.status; render(); } }).subscribe(); }
  async function apply(ns, status){ const c=lc(); const r=await c.rpc('mp_apply',{p_table_id:tid,p_state:ns,p_expected_version:ver,p_status:status||null}); if(r.error){ await fetchTable(); render(); toast('Net te laat — probeer opnieuw.'); return false; } ver=r.data; state=ns; render(); return true; }

  async function create(){ const c=lc(); const r=await c.rpc('mp_create_table',{p_game_key:GAME}); if(r.error){ toast(r.error.message); return; } const row=Array.isArray(r.data)?r.data[0]:r.data; tid=row.id; await fetchTable(); subscribe(); render(); }
  async function joinCode(code){ const c=lc(); const r=await c.rpc('mp_join_table',{p_code:code}); if(r.error){ toast(r.error.message); return; } tid=r.data; await fetchTable(); subscribe(); render(); }

  async function startGame(){ if(!state) return; const ns=JSON.parse(JSON.stringify(state)); ns.players={}; ns.seats.forEach(x=>ns.players[x.id]={uniq:[],cards:[],round:0,status:'in',total:0}); ns.deck=freshDeck(); ns.round=1; ns.startSeat=0; ns.turn=0; ns.phase='playing'; ns.log=ns.seats[0].name+' begint.'; await apply(ns,'playing'); }
  function doFlip(){ if(!isMyTurn())return; apply(reduce(state,{type:'flip',by:myId}), null).then(()=>{ if(state.phase==='over') apply(state,'done'); }); }
  function doStay(){ if(!isMyTurn())return; apply(reduce(state,{type:'stay',by:myId}), null); }
  function isMyTurn(){ return state && state.phase==='playing' && state.seats[state.turn] && state.seats[state.turn].id===myId; }

  function beep(){ try{ if(!actx)actx=new (window.AudioContext||window.webkitAudioContext)(); const o=actx.createOscillator(),g=actx.createGain(); o.frequency.value=660; o.connect(g); g.connect(actx.destination); g.gain.value=.12; o.start(); o.stop(actx.currentTime+.18); }catch(e){} }
  function notifyTurn(){ try{ if(window.Notification&&Notification.permission==='granted'){ new Notification('Flip 7 — jouw beurt!',{body:'Het is jouw beurt aan tafel '+(state.code||''),tag:'mf-turn'}); } }catch(e){} }

  /* ---- UI ---- */
  const css=`
  #mfRoot{position:fixed;inset:0;z-index:4200;background:#0e2233;color:#eaf3f5;overflow-y:auto;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  #mfRoot *{box-sizing:border-box}
  .mfTop{position:sticky;top:0;background:#0b1c2b;display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid #16344a}
  .mfTop h2{margin:0;font-size:17px;flex:1}
  .mfBack{border:none;background:#16344a;color:#eaf3f5;border-radius:10px;padding:8px 12px;font-weight:800;cursor:pointer}
  .mfWrap{max-width:640px;margin:0 auto;padding:16px}
  .mfCard{background:#12344a;border-radius:16px;padding:16px;margin:10px 0}
  .mfBtn{display:block;width:100%;border:none;border-radius:13px;padding:15px;font-weight:800;font-size:16px;cursor:pointer;margin-top:10px}
  .mfBtn.p{background:#ff6f68;color:#fff}.mfBtn.a{background:#12b0c4;color:#042}.mfBtn.g{background:#1c3d54;color:#eaf3f5}
  .mfCode{font-size:40px;font-weight:800;letter-spacing:6px;text-align:center;color:#67e8f9}
  .mfSeat{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:12px;background:#0f2b3e;margin:6px 0}
  .mfSeat.turn{outline:2px solid #ffd166;background:#173d54}
  .mfSeat .nm{flex:1;font-weight:800}
  .mfChips{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
  .mfChip{min-width:26px;height:30px;padding:0 6px;border-radius:7px;background:#eaf3f5;color:#0d3550;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:15px}
  .mfIn{width:100%;padding:13px;border-radius:12px;border:1px solid #2c5876;background:#0f2b3e;color:#fff;font-size:20px;text-align:center;letter-spacing:4px;text-transform:uppercase}
  .mfTurnBanner{background:#ffd166;color:#3a2c00;font-weight:800;text-align:center;padding:10px;border-radius:12px;margin-bottom:8px}
  .mfLog{font-size:13px;color:#9fc3d3;text-align:center;margin-top:8px;min-height:18px}
  `;

  function render(){
    let root=document.getElementById('mfRoot');
    if(!root){ root=el('<div id="mfRoot"></div>'); document.body.appendChild(root); document.body.style.overflow='hidden'; }
    root.innerHTML='';
    const top=el('<div class="mfTop"></div>'); const back=el('<button class="mfBack">‹ Sluiten</button>'); back.onclick=close; top.appendChild(back); top.appendChild(el('<h2>🎴 Flip 7 — samen</h2>')); root.appendChild(top);
    const wrap=el('<div class="mfWrap"></div>'); root.appendChild(wrap);

    if(!joined()){ wrap.appendChild(el('<div class="mfCard"><b>Log eerst in</b><p style="color:#9fc3d3">Meld je aan bij <b>Spellen</b> met je naam en de familiecode, dan kun je samen spelen.</p></div>')); return; }
    myId=me()&&me().id;

    if(!state){ // menu
      const c=el('<div class="mfCard"></div>');
      c.appendChild(el('<p style="margin-top:0;color:#cfe6ef">Speel Flip 7 samen — iedereen op zijn eigen telefoon, om de beurt. Maak een tafel en deel de code, of sluit aan met een code.</p>'));
      const nb=el('<button class="mfBtn p">➕ Nieuwe tafel maken</button>'); nb.onclick=create; c.appendChild(nb);
      const inp=el('<input class="mfIn" maxlength="4" placeholder="CODE" style="margin-top:14px">');
      const jb=el('<button class="mfBtn a">Aansluiten met code</button>'); jb.onclick=()=>{ const v=(inp.value||'').trim().toUpperCase(); if(v.length>=3) joinCode(v); else toast('Vul de 4-letter code in.'); };
      c.appendChild(inp); c.appendChild(jb); wrap.appendChild(c);
      wrap.appendChild(el('<p style="color:#7ea6b8;font-size:12.5px;text-align:center">Tip: zet meldingen aan als je erom gevraagd wordt, dan krijg je een seintje als je aan de beurt bent.</p>'));
      return;
    }

    const iAmHost = state.hostName && me() && state.hostName===me().display_name;
    const seats=state.seats||[];

    if(state.status==='lobby'||state.phase==='lobby'){
      const c=el('<div class="mfCard"></div>');
      c.appendChild(el('<p style="margin-top:0;text-align:center;color:#cfe6ef">Deel deze code met de anderen:</p>'));
      c.appendChild(el('<div class="mfCode">'+esc(state.code||'')+'</div>'));
      c.appendChild(el('<p style="text-align:center;color:#9fc3d3">'+seats.length+' speler(s) aan tafel</p>'));
      seats.forEach(s2=>c.appendChild(el('<div class="mfSeat"><span class="nm">'+esc(s2.name)+'</span>'+(s2.name===state.hostName?'<span style="color:#ffd166;font-size:12px">host</span>':'')+'</div>')));
      if(iAmHost){ const sb=el('<button class="mfBtn p">▶ Start het spel</button>'); sb.disabled=seats.length<2; if(seats.length<2){ sb.style.opacity='.5'; sb.textContent='Wacht op minstens 2 spelers…'; } sb.onclick=startGame; c.appendChild(sb); }
      else c.appendChild(el('<p style="text-align:center;color:#9fc3d3;margin-top:12px">Wachten tot de host start…</p>'));
      wrap.appendChild(c);
      askNotify();
      return;
    }

    // speelscherm
    const mine=isMyTurn();
    if(mine && !lastTurnMine){ beep(); notifyTurn(); toast('🎴 Jouw beurt!'); }
    lastTurnMine=mine;

    if(state.phase==='over'){
      wrap.appendChild(el('<div class="mfCard" style="text-align:center"><div style="font-size:44px">🏆</div><div style="font-size:22px;font-weight:800;color:#ffd166">'+esc(state.winner||'')+' wint!</div></div>'));
    } else {
      wrap.appendChild(el('<div class="mfTurnBanner">'+(mine?'🎴 Jouw beurt — Flip of Stop!':'Aan de beurt: '+esc((seats[state.turn]||{}).name||''))+'</div>'));
    }
    wrap.appendChild(el('<p style="text-align:center;color:#9fc3d3;margin:2px 0">Ronde '+(state.round||1)+' · eerste bij '+TARGET+' wint · kaarten in stapel: '+((state.deck||[]).length)+'</p>'));

    seats.forEach((s2,i)=>{ const P=(state.players||{})[s2.id]||{uniq:[],cards:[],round:0,status:'in',total:0};
      const row=el('<div class="mfSeat'+(i===state.turn&&state.phase==='playing'?' turn':'')+'"></div>');
      const stTxt = P.status==='busted'?'💥 bust':P.status==='stayed'?'✋ gestopt':P.status==='flip7'?'🎉 Flip 7':'';
      row.appendChild(el('<div style="flex:1"><div class="nm">'+esc(s2.name)+(s2.id===myId?' (jij)':'')+' <span style="color:#9fc3d3;font-weight:600;font-size:12px">'+stTxt+'</span></div><div class="mfChips">'+((P.cards||[]).map(v=>'<span class="mfChip">'+v+'</span>').join('')||'<span style="color:#6f96a8;font-size:12px">—</span>')+'</div></div>'));
      row.appendChild(el('<div style="text-align:right"><div style="font-size:12px;color:#9fc3d3">ronde</div><div style="font-weight:800">'+P.round+'</div><div style="font-size:12px;color:#67e8f9">tot: '+P.total+'</div></div>'));
      wrap.appendChild(row);
    });

    if(state.phase==='playing' && mine){ const r=el('<div style="display:flex;gap:10px;margin-top:12px"></div>'); const f=el('<button class="mfBtn p" style="margin:0;flex:1">🎴 Flip</button>'); f.onclick=doFlip; const s3=el('<button class="mfBtn a" style="margin:0;flex:1">✋ Stop</button>'); s3.onclick=doStay; r.appendChild(f); r.appendChild(s3); wrap.appendChild(r); }
    else if(state.phase==='playing'){ wrap.appendChild(el('<p style="text-align:center;color:#9fc3d3;margin-top:12px">Wachten op '+esc((seats[state.turn]||{}).name||'')+'…</p>')); }

    if(state.phase==='over' && iAmHost){ const nb=el('<button class="mfBtn g">Nieuw spel (zelfde tafel)</button>'); nb.onclick=startGame; wrap.appendChild(nb); }
    wrap.appendChild(el('<div class="mfLog">'+esc(state.log||'')+'</div>'));
  }

  function askNotify(){ try{ if(window.Notification && Notification.permission==='default'){ Notification.requestPermission().catch(()=>{}); } }catch(e){} }
  function close(){ try{ if(chan) lc().removeChannel(chan); }catch(e){} chan=null; tid=null; state=null; ver=0; const r=document.getElementById('mfRoot'); if(r)r.remove(); document.body.style.overflow=''; }
  function open(){ if(!document.getElementById('mfCss')){ const s=document.createElement('style'); s.id='mfCss'; s.textContent=css; document.head.appendChild(s); } tid=null; state=null; render(); }

  window.AnnecyMPFlip7={ open, close, _reduce:reduce, _freshDeck:freshDeck };
})();
