/* Annecy Family Playbook — Multiplayer Quiz (Outsmarted-stijl, live).
   Iedereen antwoordt op zijn eigen telefoon én zet in hoe zeker hij is (1/2/3).
   Goed antwoord = je inzet erbij. Host stuurt de vragen. Draait op de game_tables-motor. */
(function(){
  "use strict";
  const A=()=>window.AnnecyLive||null;
  const lc=()=>{ const a=A(); return a&&a.client||null; };
  const me=()=>{ const a=A(); return a&&a.player||null; };
  const joined=()=>{ const a=A(); return !!(a&&typeof a.isJoined==='function'&&a.isJoined()); };
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const el=(h)=>{ const d=document.createElement('div'); d.innerHTML=h.trim(); return d.firstElementChild; };
  function toast(m){ let t=document.getElementById('mqToast'); if(!t){t=document.createElement('div');t.id='mqToast';t.style.cssText='position:fixed;left:50%;bottom:30px;transform:translateX(-50%);background:#0d3550;color:#fff;padding:11px 18px;border-radius:999px;font-weight:800;z-index:6000;opacity:0;transition:opacity .2s';document.body.appendChild(t);} t.textContent=m; t.style.opacity='1'; clearTimeout(t._h); t._h=setTimeout(()=>t.style.opacity='0',2200); }
  const GAME='quizmp', QN=10;

  const Q=[
    {q:'In welk land ligt het Lac d\'Annecy?',o:['Italië','Frankrijk','Zwitserland','Oostenrijk'],c:1},
    {q:'Hoeveel is 7 × 8?',o:['54','56','58','64'],c:1},
    {q:'Welke berg is de hoogste van de Alpen?',o:['Matterhorn','Mont Ventoux','Mont Blanc','Jungfrau'],c:2},
    {q:'Wat is de hoofdstad van Frankrijk?',o:['Lyon','Parijs','Marseille','Nice'],c:1},
    {q:'Hoeveel poten heeft een spin?',o:['6','8','10','4'],c:1},
    {q:'Welke kleur krijg je van blauw + geel?',o:['Paars','Groen','Oranje','Bruin'],c:1},
    {q:'Welk land staat bekend om de croissant?',o:['Spanje','Frankrijk','Duitsland','België'],c:1},
    {q:'Hoeveel dagen heeft een schrikkeljaar?',o:['365','366','367','364'],c:1},
    {q:'Welke planeet noemen we de rode planeet?',o:['Venus','Mars','Jupiter','Saturnus'],c:1},
    {q:'Wat is het grootste dier ter wereld?',o:['Olifant','Blauwe vinvis','Giraffe','Walrus'],c:1},
    {q:'Hoeveel spelers per team staan er bij voetbal op het veld?',o:['9','10','11','12'],c:2},
    {q:'In welke stad staat de Eiffeltoren?',o:['Londen','Parijs','Rome','Berlijn'],c:1},
    {q:'Hoeveel is 12 × 12?',o:['124','132','144','154'],c:2},
    {q:'Hoeveel kleuren heeft een regenboog (traditioneel)?',o:['5','6','7','8'],c:2},
    {q:'Wat eet een panda vooral?',o:['Vis','Bamboe','Vlees','Fruit'],c:1},
    {q:'Welke rivier stroomt door Parijs?',o:['Rhône','Seine','Loire','Rijn'],c:1},
    {q:'Wat is de helft van 90?',o:['35','40','45','50'],c:2},
    {q:'Welk dier is het snelst op land?',o:['Leeuw','Jachtluipaard','Paard','Hazewind'],c:1},
    {q:'Hoeveel maanden hebben (minstens) 28 dagen?',o:['1','2','6','12'],c:3},
    {q:'Welke zee ligt bij Nice en Marseille?',o:['Noordzee','Middellandse Zee','Oostzee','Zwarte Zee'],c:1}
  ];

  let tid=null, ver=0, state=null, chan=null, myId=null, pendingA=null;

  function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }

  async function fetchTable(){ const c=lc(); const r=await c.from('game_tables').select('state,version,status,code').eq('id',tid).maybeSingle(); if(r.data){ state=r.data.state; ver=r.data.version; state.status=r.data.status; state.code=r.data.code; } return r.data; }
  function subscribe(){ const c=lc(); try{ if(chan) c.removeChannel(chan); }catch(e){} chan=c.channel('mq-'+tid).on('postgres_changes',{event:'*',schema:'public',table:'game_tables',filter:'id=eq.'+tid},(p)=>{ if(p.new){ state=p.new.state; ver=p.new.version; state.status=p.new.status; render(); } }).subscribe(); }
  async function apply(ns, status){ const c=lc(); const r=await c.rpc('mp_apply',{p_table_id:tid,p_state:ns,p_expected_version:ver,p_status:status||null}); if(r.error){ await fetchTable(); render(); toast('Net te laat — probeer opnieuw.'); return false; } ver=r.data; state=ns; render(); return true; }
  async function create(){ const c=lc(); const r=await c.rpc('mp_create_table',{p_game_key:GAME}); if(r.error){ toast(r.error.message); return; } const row=Array.isArray(r.data)?r.data[0]:r.data; tid=row.id; await fetchTable(); subscribe(); render(); }
  async function joinCode(code){ const c=lc(); const r=await c.rpc('mp_join_table',{p_code:code}); if(r.error){ toast(r.error.message); return; } tid=r.data; await fetchTable(); subscribe(); render(); }

  function curQ(){ return Q[state.order[state.qIndex]]; }
  async function startGame(){ const ns=JSON.parse(JSON.stringify(state)); ns.order=shuffle(Q.map((_,i)=>i)).slice(0,Math.min(QN,Q.length)); ns.qIndex=0; ns.answers={}; ns.totals={}; ns.seats.forEach(s=>ns.totals[s.id]=0); ns.phase='question'; await apply(ns,'playing'); }
  async function submit(a,c){ pendingA=null; const cl=lc(); const r=await cl.rpc('mp_submit_answer',{p_table_id:tid,p_a:a,p_c:c}); if(r.error){ toast(r.error.message); return; } toast('Antwoord verstuurd ✓'); }
  async function reveal(){ const ns=JSON.parse(JSON.stringify(state)); const q=Q[ns.order[ns.qIndex]]; Object.keys(ns.answers||{}).forEach(pid=>{ const ans=ns.answers[pid]; if(ans && ans.a===q.c) ns.totals[pid]=(ns.totals[pid]||0)+(ans.c||1); }); ns.phase='reveal'; await apply(ns,'playing'); }
  async function nextQ(){ const ns=JSON.parse(JSON.stringify(state)); if(ns.qIndex+1>=ns.order.length){ ns.phase='over'; await apply(ns,'done'); } else { ns.qIndex++; ns.answers={}; ns.phase='question'; await apply(ns,'playing'); } }

  const css=`
  #mqRoot{position:fixed;inset:0;z-index:4200;background:#10233a;color:#eaf0f7;overflow-y:auto;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  #mqRoot *{box-sizing:border-box}
  .mqTop{position:sticky;top:0;background:#0b1a2e;display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid #1d3556}
  .mqTop h2{margin:0;font-size:17px;flex:1}
  .mqBack{border:none;background:#1d3556;color:#eaf0f7;border-radius:10px;padding:8px 12px;font-weight:800;cursor:pointer}
  .mqWrap{max-width:640px;margin:0 auto;padding:16px}
  .mqCard{background:#17335a;border-radius:16px;padding:16px;margin:10px 0}
  .mqBtn{display:block;width:100%;border:none;border-radius:13px;padding:15px;font-weight:800;font-size:16px;cursor:pointer;margin-top:10px}
  .mqBtn.p{background:#ffb020;color:#3a2600}.mqBtn.a{background:#3ba0ff;color:#04203a}.mqBtn.g{background:#22406a;color:#eaf0f7}
  .mqCode{font-size:40px;font-weight:800;letter-spacing:6px;text-align:center;color:#7fd4ff}
  .mqSeat{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:12px;background:#122a4c;margin:6px 0}
  .mqIn{width:100%;padding:13px;border-radius:12px;border:1px solid #2c4d78;background:#122a4c;color:#fff;font-size:20px;text-align:center;letter-spacing:4px;text-transform:uppercase}
  .mqOpt{display:block;width:100%;text-align:left;border:1px solid #2c4d78;background:#122a4c;color:#eaf0f7;border-radius:12px;padding:14px;margin:7px 0;font-size:15px;font-weight:700;cursor:pointer}
  .mqOpt.sel{outline:2px solid #ffb020}
  .mqOpt.good{background:#14532d;border-color:#2ecc71}
  .mqOpt.bad{background:#5b1a1a;border-color:#e74c3c}
  .mqConf{display:flex;gap:8px;margin-top:8px}
  .mqConf button{flex:1;border:none;border-radius:12px;padding:12px;font-weight:800;cursor:pointer;background:#22406a;color:#eaf0f7}
  `;

  function askNotify(){ try{ if(window.Notification && Notification.permission==='default'){ Notification.requestPermission().catch(()=>{}); } }catch(e){} }

  function render(){
    let root=document.getElementById('mqRoot');
    if(!root){ root=el('<div id="mqRoot"></div>'); document.body.appendChild(root); document.body.style.overflow='hidden'; }
    root.innerHTML='';
    const top=el('<div class="mqTop"></div>'); const back=el('<button class="mqBack">‹ Sluiten</button>'); back.onclick=close; top.appendChild(back); top.appendChild(el('<h2>🧠 Quiz — samen</h2>')); root.appendChild(top);
    const wrap=el('<div class="mqWrap"></div>'); root.appendChild(wrap);

    if(!joined()){ wrap.appendChild(el('<div class="mqCard"><b>Log eerst in</b><p style="color:#a9c3de">Meld je aan bij <b>Spellen</b> met je naam en de familiecode.</p></div>')); return; }
    myId=me()&&me().id;

    if(!state){
      const c=el('<div class="mqCard"></div>');
      c.appendChild(el('<p style="margin-top:0;color:#cfe0f0">Quiz waarbij je op je eigen telefoon antwoordt én inzet hoe zeker je bent (1, 2 of 3 punten). Goed = je inzet erbij! Maak een tafel en deel de code, of sluit aan.</p>'));
      const nb=el('<button class="mqBtn p">➕ Nieuwe quiz-tafel</button>'); nb.onclick=create; c.appendChild(nb);
      const inp=el('<input class="mqIn" maxlength="4" placeholder="CODE" style="margin-top:14px">');
      const jb=el('<button class="mqBtn a">Aansluiten met code</button>'); jb.onclick=()=>{ const v=(inp.value||'').trim().toUpperCase(); if(v.length>=3) joinCode(v); else toast('Vul de code in.'); };
      c.appendChild(inp); c.appendChild(jb); wrap.appendChild(c); return;
    }

    const iAmHost = state.hostName && me() && state.hostName===me().display_name;
    const seats=state.seats||[];

    if(state.status==='lobby'||state.phase==='lobby'){
      const c=el('<div class="mqCard"></div>');
      c.appendChild(el('<p style="margin-top:0;text-align:center;color:#cfe0f0">Deel deze code:</p>'));
      c.appendChild(el('<div class="mqCode">'+esc(state.code||'')+'</div>'));
      c.appendChild(el('<p style="text-align:center;color:#a9c3de">'+seats.length+' speler(s)</p>'));
      seats.forEach(s2=>c.appendChild(el('<div class="mqSeat"><span style="flex:1;font-weight:800">'+esc(s2.name)+'</span>'+(s2.name===state.hostName?'<span style="color:#ffb020;font-size:12px">host</span>':'')+'</div>')));
      if(iAmHost){ const sb=el('<button class="mqBtn p">▶ Start de quiz</button>'); if(seats.length<2){ sb.style.opacity='.5'; sb.textContent='Wacht op minstens 2 spelers…'; sb.disabled=true; } sb.onclick=startGame; c.appendChild(sb); }
      else c.appendChild(el('<p style="text-align:center;color:#a9c3de;margin-top:12px">Wachten tot de host start…</p>'));
      wrap.appendChild(c); askNotify(); return;
    }

    if(state.phase==='over'){
      const board=seats.map(s=>({name:s.name,total:(state.totals||{})[s.id]||0})).sort((a,b)=>b.total-a.total);
      const c=el('<div class="mqCard" style="text-align:center"></div>'); c.appendChild(el('<div style="font-size:44px">🏆</div>')); c.appendChild(el('<div style="font-size:22px;font-weight:800;color:#ffb020">'+esc(board[0].name)+' wint!</div>'));
      board.forEach((b,i)=>c.appendChild(el('<div class="mqSeat"><span style="flex:1;font-weight:800">'+(i+1)+'. '+esc(b.name)+'</span><span style="color:#7fd4ff;font-weight:800">'+b.total+'</span></div>')));
      wrap.appendChild(c);
      if(iAmHost){ const nb=el('<button class="mqBtn g">Nieuwe quiz (zelfde tafel)</button>'); nb.onclick=startGame; wrap.appendChild(nb); }
      return;
    }

    // question / reveal
    const q=curQ(); const myAns=(state.answers||{})[myId]; const answeredCount=Object.keys(state.answers||{}).length;
    wrap.appendChild(el('<p style="text-align:center;color:#a9c3de;margin:2px 0">Vraag '+(state.qIndex+1)+' / '+state.order.length+'</p>'));
    const qc=el('<div class="mqCard"></div>'); qc.appendChild(el('<p style="font-size:19px;font-weight:800;margin:0 0 6px">'+esc(q.q)+'</p>'));
    q.o.forEach((opt,i)=>{ let cls='mqOpt'; if(state.phase==='reveal'){ if(i===q.c)cls+=' good'; else if(myAns&&myAns.a===i)cls+=' bad'; } else if((myAns&&myAns.a===i)||(!myAns&&pendingA===i)){ cls+=' sel'; } const b=el('<button class="'+cls+'">'+String.fromCharCode(65+i)+'. '+esc(opt)+'</button>');
      if(state.phase==='question'&&!myAns){ b.onclick=()=>{ pendingA=i; render(); }; }
      qc.appendChild(b); });
    wrap.appendChild(qc);

    if(state.phase==='question'){
      if(myAns) wrap.appendChild(el('<p style="text-align:center;color:#7ee0a0;font-weight:800">✓ Verstuurd (inzet '+myAns.c+') — wachten op de rest…</p>'));
      else if(pendingA!=null){
        const box=el('<div class="mqCard"></div>'); box.appendChild(el('<p style="margin:0 0 4px;font-weight:800">Je koos: '+esc(q.o[pendingA])+'</p><p style="margin:0;color:#a9c3de;font-size:13px">Hoe zeker ben je? Goed = deze punten erbij, fout = niets.</p>'));
        const row=el('<div class="mqConf"></div>'); [['🤏 Gok',1],['✋ Redelijk',2],['💪 Zeker',3]].forEach(pr=>{ const b=el('<button>'+pr[0]+'<br>('+pr[1]+')</button>'); b.onclick=()=>submit(pendingA,pr[1]); row.appendChild(b); }); box.appendChild(row);
        const cancel=el('<button class="mqBtn g" style="margin-top:8px">← Ander antwoord</button>'); cancel.onclick=()=>{ pendingA=null; render(); }; box.appendChild(cancel);
        wrap.appendChild(box);
      }
      else wrap.appendChild(el('<p style="text-align:center;color:#a9c3de">Kies je antwoord.</p>'));
      wrap.appendChild(el('<p style="text-align:center;color:#7f9cbb;font-size:13px">'+answeredCount+' / '+seats.length+' hebben geantwoord</p>'));
      if(iAmHost){ const rb=el('<button class="mqBtn p">Toon het antwoord ›</button>'); rb.onclick=reveal; wrap.appendChild(rb); }
    } else if(state.phase==='reveal'){
      const c=el('<div class="mqCard"></div>');
      seats.forEach(s=>{ const ans=(state.answers||{})[s.id]; const ok=ans&&ans.a===q.c; const gained=ok?(ans.c||1):0; const tag=ans?(ok?('+'+gained):'fout'):'geen'; c.appendChild(el('<div class="mqSeat"><span style="flex:1;font-weight:800">'+esc(s.name)+'</span><span style="color:'+(ok?'#2ecc71':'#e88')+';font-size:13px;margin-right:8px">'+tag+'</span><span style="color:#7fd4ff;font-weight:800">'+((state.totals||{})[s.id]||0)+'</span></div>')); });
      wrap.appendChild(c);
      if(iAmHost){ const nb=el('<button class="mqBtn p">'+(state.qIndex+1>=state.order.length?'Eindstand ›':'Volgende vraag ›')+'</button>'); nb.onclick=nextQ; wrap.appendChild(nb); }
      else wrap.appendChild(el('<p style="text-align:center;color:#a9c3de">Wachten op de host…</p>'));
    }
  }

  function close(){ try{ if(chan) lc().removeChannel(chan); }catch(e){} chan=null; tid=null; state=null; ver=0; pendingA=null; const r=document.getElementById('mqRoot'); if(r)r.remove(); document.body.style.overflow=''; }
  function open(){ if(!document.getElementById('mqCss')){ const s=document.createElement('style'); s.id='mqCss'; s.textContent=css; document.head.appendChild(s); } tid=null; state=null; render(); }

  window.AnnecyMPQuiz={ open, close };
})();
