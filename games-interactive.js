/* Annecy Family Playbook — spellen, live quizshow, Hitster (muziek),
   familie top-10, vrije tijd, en reset. Beste-telt scoremodel + live voortgang. */
(() => {
  "use strict";
  const LS={ get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}}, set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}} };

  const css=`
  .phRoot{margin:14px 0;display:flex;flex-direction:column;gap:14px}
  .phMenu{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
  .phTile{cursor:pointer;border:1px solid var(--line);background:var(--card);border-radius:16px;padding:14px;text-align:left;box-shadow:var(--shadow);transition:transform .12s}
  .phTile:hover{transform:translateY(-2px)}
  .phTile .ic{display:block;font-size:26px;line-height:1.1}.phTile .tt{display:block;margin:6px 0 2px;color:var(--ink);font-size:16px;font-weight:700}.phTile .ds{display:block;margin:0;color:var(--muted);font-size:12.5px;line-height:1.3}
  .phTile.wide{grid-column:1/-1;background:linear-gradient(120deg,var(--lake),var(--ink));border:none}
  .phTile.wide .tt,.phTile.wide .ds{color:#fff}
  .phPanel{border:1px solid var(--line);background:var(--card);border-radius:18px;padding:16px;box-shadow:var(--shadow)}
  .phBar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.phBar h3{margin:0;color:var(--ink);font-size:18px}
  .phBtn{cursor:pointer;border:none;border-radius:12px;padding:10px 14px;font-weight:700;font-size:14px;background:var(--lake);color:#fff;text-decoration:none;display:inline-block}
  .phBtn.alt{background:#eef4f4;color:var(--ink)}.phBtn.coral{background:var(--coral)}.phBtn:disabled{opacity:.45;cursor:not-allowed}
  .phBtnRow{display:flex;flex-wrap:wrap;gap:8px}
  .phBack{cursor:pointer;background:none;border:none;color:var(--lake);font-weight:700;font-size:14px;padding:4px}
  .phQ{font-size:17px;color:var(--ink);font-weight:700;margin:6px 0 12px}
  .phOpt{display:block;width:100%;text-align:left;margin:7px 0;padding:12px 14px;border-radius:12px;border:1px solid var(--line);background:#fff;color:var(--ink);font-size:15px;cursor:pointer}
  .phOpt:hover{border-color:var(--lake)}.phOpt.good{background:#e6f6ee;border-color:#37b26b;color:#186c3d}.phOpt.bad{background:#fdeaea;border-color:#e05a52;color:#a02b25}
  .phNote{color:var(--muted);font-size:13px;margin:8px 0 0}
  .phBingo{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:6px}
  .phCell{aspect-ratio:1/1;border-radius:12px;border:1px solid var(--line);background:#fff;color:var(--ink);font-size:12px;line-height:1.15;padding:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;text-align:center}
  .phCell.on{background:var(--lake);color:#fff;border-color:var(--lake)}
  .phDice{display:flex;gap:8px;justify-content:center;margin:12px 0;flex-wrap:wrap}
  .phDie{width:54px;height:54px;border-radius:12px;border:2px solid var(--line);background:#fff;font-size:34px;line-height:50px;text-align:center;cursor:pointer;user-select:none}
  .phDie.hold{border-color:var(--coral);background:#fff2f1}
  .phSheet{width:100%;border-collapse:collapse;font-size:14px}.phSheet td{border-bottom:1px solid var(--line);padding:7px 6px;color:var(--ink)}
  .phSheet td.v{text-align:right;color:var(--muted);width:64px}.phSheet tr.pick td{cursor:pointer}.phSheet tr.pick:hover td{background:#eef4f4}.phSheet tr.done td.v{color:var(--ink);font-weight:700}
  .phSheet tr.pick{background:#f3fbfb}.pickPill{display:inline-block;background:var(--lake);color:#fff;padding:4px 11px;border-radius:999px;font-weight:700;font-size:13px;white-space:nowrap}
  .phToast{position:fixed;left:50%;bottom:88px;transform:translateX(-50%);background:var(--ink);color:#fff;padding:10px 16px;border-radius:999px;font-weight:700;font-size:14px;box-shadow:var(--shadow);z-index:9999;opacity:0;transition:opacity .2s}
  .phToast.show{opacity:1}
  .phBig{font-size:22px;font-weight:800;color:var(--ink)}.phCenter{text-align:center}
  .phProgRow{display:flex;flex-direction:column;gap:5px;padding:9px 0;border-bottom:1px solid var(--line)}.phProgRow:last-child{border-bottom:none}
  .phProgGame{font-weight:700;color:var(--ink);font-size:14px}.phChips{display:flex;flex-wrap:wrap;gap:6px}
  .phChip{font-size:12px;padding:5px 10px;border-radius:999px;background:#eef4f4;color:var(--ink);border:none;cursor:pointer}
  .phChip.done{background:#e6f6ee;color:#186c3d;font-weight:700}.phChip.muted{color:var(--muted);background:#f3f6f6}
  .phBest{color:var(--lake);font-weight:700}
  .phTimer{font-size:26px;font-weight:800;color:var(--coral)}
  .phLead{display:flex;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:10px;background:#eef4f4;margin:4px 0;color:var(--ink);font-weight:700}
  .phLead.me{background:#e6f6ee}
  .phWho{font-size:12.5px;color:var(--muted);margin-top:8px}
  .phField{display:flex;gap:8px;align-items:center;margin:10px 0;color:var(--ink)}
  .phField input{flex:1;padding:9px;border-radius:10px;border:1px solid var(--line);font-size:15px}
  .phGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px}
  .phPhoto{position:relative}
  .phPhoto img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:10px;background:#eef4f4;display:block}
  .phPhoto span{position:absolute;left:4px;bottom:4px;font-size:10px;color:#fff;background:rgba(0,0,0,.45);padding:1px 5px;border-radius:6px}
  .phUpload{display:block;text-align:center;border:2px dashed var(--line);border-radius:14px;padding:16px;color:var(--lake);font-weight:700;cursor:pointer;margin:8px 0}
  `;

  const A=()=>window.AnnecyLive||null;
  function isJoined(){ const a=A(); if(a&&typeof a.isJoined==='function')return a.isJoined(); const p=document.getElementById('liveIdentityPanel'); return !!(p&&!p.classList.contains('liveHidden')); }
  const lc=()=>{ const a=A(); return a&&a.client||null; };
  const myId=()=>{ const a=A(); return a&&a.player&&a.player.id; };
  const myGroup=()=>{ const a=A(); return a&&a.group&&a.group.id; };
  const esc=(s)=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  let toastT;
  function toast(msg){ let t=document.getElementById('phToast'); if(!t){t=document.createElement('div');t.id='phToast';t.className='phToast';document.body.appendChild(t);} t.textContent=msg; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),2400); }
  const el=(html)=>{ const d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstElementChild; };
  const shuffle=(a)=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(p=>p[1]);

  async function recordGame(key,points,stateObj,msg){
    if(!isJoined()){ toast('Doe eerst mee met de familiecode hierboven ⤴'); return null; }
    let total=null;
    try{ const a=A(); if(a&&a.recordResult) total=await a.recordResult(key,points,stateObj||{}); }catch(e){}
    refreshProgressPanel(); if(msg) toast(msg); return total;
  }

  /* ---------- content ---------- */
  const QUIZ=[
    {q:"In welk gebergte ligt Annecy?",o:["De Pyreneeën","De Alpen","De Vogezen","De Ardennen"],a:1},
    {q:"Hoe wordt Annecy vaak liefkozend genoemd?",o:["Het Parijs van het zuiden","Venetië van de Alpen","De tuin van Frankrijk","Het kleine Rome"],a:1},
    {q:"Welk riviertje stroomt door de oude stad van Annecy?",o:["De Thiou","De Seine","De Rhône","De Loire"],a:0},
    {q:"Lac d'Annecy staat bekend als een van de … meren van Europa.",o:["diepste","schoonste","zoutste","grootste"],a:1},
    {q:"Welke beroemde kaas komt uit deze streek (Haute-Savoie)?",o:["Camembert","Roquefort","Reblochon","Brie"],a:2},
    {q:"Welk gerecht met aardappels, spek en Reblochon is een streekklassieker?",o:["Ratatouille","Tartiflette","Bouillabaisse","Quiche"],a:1},
    {q:"Het iconische oude gebouwtje midden in de Thiou heet…",o:["Palais de l'Île","Mont Saint-Michel","Pont du Gard","Sacré-Cœur"],a:0},
    {q:"Welke grote stad ligt het dichtst bij Annecy (±40 km)?",o:["Lyon","Genève","Marseille","Nice"],a:1},
    {q:"Vanaf de Col de la Forclaz doen mensen boven het meer vooral aan…",o:["duiken","paragliden","skispringen","raften"],a:1},
    {q:"Wat is de hoogste berg van de Alpen, niet ver van Annecy?",o:["Matterhorn","Mont Blanc","Mont Ventoux","Grossglockner"],a:1},
    {q:"In welk land ligt Annecy?",o:["Zwitserland","Italië","Frankrijk","Oostenrijk"],a:2},
    {q:"Met welk vervoermiddel rijd je het mooist het rondje om het meer?",o:["Metro","Fiets","Tram","Kabelbaan"],a:1},
    {q:"Wat is de hoofdstad van Frankrijk?",o:["Lyon","Marseille","Parijs","Bordeaux"],a:2},
    {q:"Hoe zeg je “hallo” in het Frans?",o:["Ciao","Bonjour","Hola","Hallo"],a:1},
    {q:"Wat betekent het Franse woord “merci”?",o:["Alsjeblieft","Dank je wel","Tot ziens","Goedemorgen"],a:1},
    {q:"Welke kleur zit NIET in de Franse vlag?",o:["Rood","Wit","Blauw","Groen"],a:3},
    {q:"Wat is het Franse woord voor kaas?",o:["Pain","Fromage","Lait","Beurre"],a:1},
    {q:"Welk gebergte vormt de grens tussen Frankrijk en Spanje?",o:["De Alpen","De Pyreneeën","De Jura","De Vogezen"],a:1},
    {q:"Welke sport doe je staand op een board met een peddel?",o:["Suppen (SUP)","Skiën","Curling","Boksen"],a:0},
    {q:"Wat eet je typisch bij een Frans ontbijt?",o:["Pizza","Croissant","Sushi","Pannenkoek"],a:1},
    {q:"Welke munt betaal je mee in Frankrijk?",o:["Pond","Frank","Euro","Dollar"],a:2},
    {q:"Hoeveel zijden heeft een gewone dobbelsteen?",o:["4","6","8","12"],a:1},
    {q:"Welke kleur krijg je als je blauw en geel mengt?",o:["Groen","Paars","Oranje","Bruin"],a:0},
    {q:"Wat is “au revoir” in het Nederlands?",o:["Goedemorgen","Tot ziens","Eet smakelijk","Welkom"],a:1}
  ];
  const BINGO_POOL=["Een stokbrood gespot","Een boot op het meer","Franse vlag gezien","Een koe met bel","IJsje gegeten","Iemand zei 'bonjour'","Bergtop met sneeuw","Een fietser voorbij","Croissant ontbijt","Zwemmen in het meer","Een kasteel gezien","Markt bezocht","Paraglider in de lucht","Franse plaat '74'","Picknick gedaan","Zonsondergang gezien","Een geit of ezel","Zwaan op het meer","Kabelbaan of gondel","Franse bakkerij binnen","Kerktoren gespot","Een tunnel doorgereden","Iemand at slakken/kikker","Bergbeekje of waterval","Fontein gezien","Iemand sprak Frans terug","Wijngaard of druiven","Zeilboot met vlag"];
  const LINES=[[0,1,2,3],[4,5,6,7],[8,9,10,11],[12,13,14,15],[0,4,8,12],[1,5,9,13],[2,6,10,14],[3,7,11,15],[0,5,10,15],[3,6,9,12]];
  const SONGS=[
    {a:"Bill Withers",t:"Ain't No Sunshine",y:1971,g:"Soul"},{a:"Queen",t:"Bohemian Rhapsody",y:1975,g:"Rock"},
    {a:"ABBA",t:"Dancing Queen",y:1976,g:"Disco/Pop"},{a:"Bee Gees",t:"Stayin' Alive",y:1977,g:"Disco"},
    {a:"Village People",t:"Y.M.C.A.",y:1978,g:"Disco"},{a:"André Hazes",t:"Zij gelooft in mij",y:1981,g:"Nederlands"},
    {a:"Journey",t:"Don't Stop Believin'",y:1981,g:"Rock"},{a:"Michael Jackson",t:"Thriller",y:1982,g:"Pop"},
    {a:"Toto",t:"Africa",y:1982,g:"Pop/Rock"},{a:"Survivor",t:"Eye of the Tiger",y:1982,g:"Rock"},
    {a:"Michael Jackson",t:"Billie Jean",y:1983,g:"Pop"},{a:"The Police",t:"Every Breath You Take",y:1983,g:"Pop/Rock"},
    {a:"Wham!",t:"Last Christmas",y:1984,g:"Pop"},{a:"a-ha",t:"Take On Me",y:1985,g:"Pop"},
    {a:"Europe",t:"The Final Countdown",y:1986,g:"Rock"},{a:"Bon Jovi",t:"Livin' on a Prayer",y:1986,g:"Rock"},
    {a:"Guns N' Roses",t:"Sweet Child o' Mine",y:1987,g:"Rock"},{a:"Whitney Houston",t:"I Wanna Dance with Somebody",y:1987,g:"Pop"},
    {a:"Madonna",t:"Like a Prayer",y:1989,g:"Pop"},{a:"Nirvana",t:"Smells Like Teen Spirit",y:1991,g:"Rock/Grunge"},
    {a:"Marco Borsato",t:"Dromen zijn bedrog",y:1994,g:"Nederlands"},{a:"Los del Río",t:"Macarena",y:1995,g:"Dance/Latin"},
    {a:"Guus Meeuwis",t:"Het is een nacht",y:1995,g:"Nederlands"},{a:"Spice Girls",t:"Wannabe",y:1996,g:"Pop"},
    {a:"Britney Spears",t:"...Baby One More Time",y:1998,g:"Pop"},{a:"Backstreet Boys",t:"I Want It That Way",y:1999,g:"Pop"},
    {a:"Daft Punk",t:"One More Time",y:2000,g:"Dance"},{a:"Destiny's Child",t:"Survivor",y:2001,g:"Pop/R&B"},
    {a:"Eminem",t:"Lose Yourself",y:2002,g:"Hiphop"},{a:"OutKast",t:"Hey Ya!",y:2003,g:"Pop/Hiphop"},
    {a:"Rihanna",t:"Umbrella",y:2007,g:"Pop"},{a:"Coldplay",t:"Viva la Vida",y:2008,g:"Pop/Rock"},
    {a:"Lady Gaga",t:"Poker Face",y:2008,g:"Pop"},{a:"Black Eyed Peas",t:"I Gotta Feeling",y:2009,g:"Pop/Dance"},
    {a:"Stromae",t:"Alors on danse",y:2009,g:"Dance (Frans)"},{a:"Adele",t:"Rolling in the Deep",y:2010,g:"Pop/Soul"},
    {a:"David Guetta ft. Sia",t:"Titanium",y:2011,g:"Dance"},{a:"Passenger",t:"Let Her Go",y:2012,g:"Pop/Folk"},
    {a:"Daft Punk",t:"Get Lucky",y:2013,g:"Disco/Dance"},{a:"Pharrell Williams",t:"Happy",y:2013,g:"Pop"},
    {a:"Avicii",t:"Wake Me Up",y:2013,g:"Dance"},{a:"Stromae",t:"Papaoutai",y:2013,g:"Pop (Frans)"},
    {a:"Katy Perry",t:"Roar",y:2013,g:"Pop"},{a:"Mark Ronson ft. Bruno Mars",t:"Uptown Funk",y:2014,g:"Funk/Pop"},
    {a:"Indila",t:"Dernière danse",y:2014,g:"Pop (Frans)"},{a:"Ed Sheeran",t:"Shape of You",y:2017,g:"Pop"},
    {a:"Luis Fonsi",t:"Despacito",y:2017,g:"Latin/Pop"},{a:"The Weeknd",t:"Blinding Lights",y:2019,g:"Pop/Synth"},
    {a:"Dua Lipa",t:"Don't Start Now",y:2019,g:"Pop"}
  ];
  const VT_PRESETS=["Spelen bij de camping","Eigen tijd bij de camping","Zwemmen bij de camping","Wandelen","Uitrusten / lezen","Samen een spel doen"];
  const ALBUMS=[['vos','Fam Vos'],['ketelaar-cardol','Fam Ketelaar / Cardol']];
  const SPEUR={kids:["Vind een dennenappel","Zoek een steen platter dan je hand","Tel 5 boten op het meer","Vind een gele bloem","Spot een eend of een zwaan","Vind een blad groter dan je hand","Zoek iets roods op de camping","Maak een foto van een berg","Vind een veertje","Hoor een vogel en doe hem na","Vind een tak in de vorm van een Y","Spot een hond die wordt uitgelaten"],volw:["Vind de dichtstbijzijnde boulangerie en noem 1 product","Fotografeer de Voie Verte (fietspad)","Zoek de naam van een berg om je heen","Bestel iets volledig in het Frans","Vind het riviertje de Eau Morte","Spot een paraglider boven het meer","Vind een terras met uitzicht op het meer","Ontdek de Réserve du Bout-du-Lac","Maak een groepsfoto op het strand van Doussard","Zoek uit hoe laat de zon vandaag ondergaat","Proef een lokale kaas of een ijsje","Vind een bord met Lac d Annecy erop"]};
  const PROG_GAMES=[["quiz","🧠","Familiequiz"],["bingo","🗺️","Vakantiebingo"],["yahtzee","🎲","Yahtzee"],["music","🎵","Hitster"]];

  /* ================= module ================= */
  let root, view, progSub=null;

  async function renderProgress(bodyEl){
    if(!bodyEl) return;
    if(!isJoined()){ bodyEl.innerHTML='<span class="phNote">Doe mee met de familiecode om te zien wie welke spellen speelt en afrondt.</span>'; return; }
    let rows=[]; try{ const a=A(); if(a&&a.loadGroupProgress) rows=await a.loadGroupProgress(); }catch(e){}
    let html='';
    PROG_GAMES.forEach(([k,ic,label])=>{
      const rs=rows.filter(r=>r.game_key===k); let chips='';
      if(rs.length===0) chips='<span class="phChip muted">nog niemand</span>';
      else{ rs.sort((a,b)=>((b.state&&b.state.best||0)-(a.state&&a.state.best||0))); rs.forEach(r=>{ const s=r.state||{}; chips+=`<span class="phChip ${s.done?'done':''}">${s.done?'✓ ':'⏳ '}${esc(s.name||'speler')} · ${s.best!=null?s.best:0}</span>`; }); }
      html+=`<div class="phProgRow"><span class="phProgGame">${ic} ${label}</span><span class="phChips">${chips}</span></div>`;
    });
    bodyEl.innerHTML=html;
  }
  function refreshProgressPanel(){ const b=document.getElementById('phProgBody'); if(b) renderProgress(b); }
  function ensureProgSub(){ if(progSub) return; const a=A(); if(a&&a.isJoined&&a.isJoined()&&a.onGroupProgress) progSub=a.onGroupProgress(()=>refreshProgressPanel()); }

  function menu(){
    view.innerHTML='';
    const m=el(`<div class="phMenu">
      <button class="phTile" style="display:flex;flex-direction:column;align-items:flex-start;gap:3px;text-align:left" data-g="quiz"><span class="ic">🧠</span><span class="tt">Familiequiz</span><span class="ds">Herspeelbaar · beste ronde telt.</span></button>
      <button class="phTile" style="display:flex;flex-direction:column;align-items:flex-start;gap:3px;text-align:left" data-g="bingo"><span class="ic">🗺️</span><span class="tt">Vakantiebingo</span><span class="ds">Tik af wat je onderweg ziet.</span></button>
      <button class="phTile" style="display:flex;flex-direction:column;align-items:flex-start;gap:3px;text-align:left" data-g="yahtzee"><span class="ic">🎲</span><span class="tt">Yahtzee</span><span class="ds">Herspeelbaar · hoogste totaal telt.</span></button>
      <button class="phTile" style="display:flex;flex-direction:column;align-items:flex-start;gap:3px;text-align:left" data-g="music"><span class="ic">🎵</span><span class="tt">Hitster — muziek</span><span class="ds">Raad het jaar · zelf of samen.</span></button>
      <button class="phTile" style="display:flex;flex-direction:column;align-items:flex-start;gap:3px;text-align:left" data-g="speur"><span class="ic">🔍</span><span class="tt">Speurtocht</span><span class="ds">Kids & volwassenen · rond de camping.</span></button>
      <button class="phTile" style="display:flex;flex-direction:column;align-items:flex-start;gap:3px;text-align:left" data-g="live"><span class="ic">🎬</span><span class="tt">Samen live</span><span class="ds">Quizshow: iedereen tegelijk, met afteltimer. Eén host.</span></button>
      <button class="phTile" style="display:flex;flex-direction:column;align-items:flex-start;gap:3px;text-align:left" data-g="woordrace"><span class="ic">🔤</span><span class="tt">Woordrace</span><span class="ds">Ontwar woorden tegen de klok · kids & volwassen.</span></button>
      <button class="phTile" style="display:flex;flex-direction:column;align-items:flex-start;gap:3px;text-align:left" data-g="snake"><span class="ic">🐍</span><span class="tt">Snake</span><span class="ds">Klassieker · je beste score telt.</span></button>
    </div>`);
    m.querySelectorAll('.phTile').forEach(b=> b.onclick=()=>open(b.dataset.g));
    view.appendChild(m);
    view.appendChild(el(`<p class="phNote phCenter">${isJoined()?'Speel zo vaak je wilt — per spel telt je <b>beste</b> resultaat mee. Samen tegelijk of ieder voor zich; de stand loopt live.':'Tip: vul hierboven één keer je naam + familiecode in, dan tellen je punten mee.'}</p>`));
    const prog=el(`<div class="phPanel"><div class="phBar"><h3>👀 Familie-voortgang</h3><span class="phNote">live · beste per spel</span></div><div id="phProgBody"><span class="phNote">Laden…</span></div></div>`);
    view.appendChild(prog); renderProgress(prog.querySelector('#phProgBody')); ensureProgSub();
    const reset=el('<button class="phBtn alt" style="align-self:center;margin-top:2px">⟲ Reset spellen</button>');
    reset.onclick=resetPanel; view.appendChild(reset);
  }
  function open(g){ ({quiz,bingo,yahtzee,music,live:liveQuiz,top10,vrijetijd,favs:favsView,fotos:photoAlbum,speur:speurtocht,tijdbom,woordrace,snake,reset:resetPanel}[g]||menu)(); }
  try{ window.AnnecyOpenGame=function(g){ try{ open(g); }catch(e){ console.error(e); } }; }catch(e){}
  function panel(title,bodyNode){ view.innerHTML=''; const p=el(`<div class="phPanel"><div class="phBar"><button class="phBack">‹ Terug</button><h3>${title}</h3><span></span></div></div>`); p.querySelector('.phBack').onclick=menu; p.appendChild(bodyNode); view.appendChild(p); return p; }
  function joinGate(title){ const body=el('<div><p class="phNote">Doe eerst mee met de familiecode hierboven ⤴ om dit te gebruiken.</p></div>'); panel(title,body); return body; }

  /* ---------- SOLO QUIZ ---------- */
  function quiz(){
    const body=el('<div></div>'); let order,i,correct;
    function newRound(){ order=shuffle(QUIZ.map((_,i)=>i)).slice(0,10); i=0; correct=0; }
    newRound();
    function render(){
      if(i>=order.length){
        const pts=correct*10;
        recordGame('quiz',pts,{done:true,goed:correct},`Ronde klaar: ${correct}/${order.length} goed`);
        body.innerHTML=`<div class="phCenter"><p class="phBig">${correct}/${order.length} goed 🎉</p><p class="phNote">Deze ronde = <span class="phBest">${pts} punten</span>. Alleen je beste ronde telt mee.</p></div>`;
        const row=el('<div class="phBtnRow phCenter" style="justify-content:center;margin-top:12px"></div>');
        const again=el('<button class="phBtn coral">Speel opnieuw 🔁</button>'); again.onclick=()=>{ newRound(); render(); };
        const back=el('<button class="phBtn alt">Terug</button>'); back.onclick=menu;
        row.appendChild(again); row.appendChild(back); body.appendChild(row); return;
      }
      const item=QUIZ[order[i]];
      body.innerHTML=`<p class="phNote">Vraag ${i+1} / ${order.length} · ${correct} goed</p><p class="phQ">${item.q}</p>`;
      const opts=el('<div></div>');
      item.o.forEach((txt,idx)=>{ const b=el(`<button class="phOpt">${esc(txt)}</button>`);
        b.onclick=()=>{ opts.querySelectorAll('.phOpt').forEach(x=>x.disabled=true); const ok=idx===item.a; b.classList.add(ok?'good':'bad'); if(!ok)opts.children[item.a].classList.add('good'); if(ok)correct++; next.disabled=false; };
        opts.appendChild(b); });
      body.appendChild(opts);
      const next=el('<button class="phBtn" style="margin-top:12px" disabled>Volgende ›</button>'); next.onclick=()=>{ i++; render(); }; body.appendChild(next);
    }
    render(); panel('Familiequiz',body);
  }

  /* ---------- BINGO ---------- */
  function bingo(){
    let s=LS.get('ph_bingo',null);
    if(!s||!Array.isArray(s.tiles)||s.tiles.length!==16){ s={tiles:shuffle(BINGO_POOL).slice(0,16),cells:[],lines:[]}; LS.set('ph_bingo',s); }
    if(!Array.isArray(s.cells))s.cells=[]; if(!Array.isArray(s.lines))s.lines=[];
    const body=el('<div></div>'),grid=el('<div class="phBingo"></div>'),info=el('<p class="phNote"></p>');
    const points=()=>s.cells.length*5+s.lines.length*15;
    function persist(msg){ LS.set('ph_bingo',s); recordGame('bingo',points(),{afgevinkt:s.cells.length,lijnen:s.lines.length,done:s.cells.length>=16},msg); }
    function refresh(){ grid.innerHTML='';
      s.tiles.forEach((t,idx)=>{ const on=s.cells.includes(idx); const c=el(`<button class="phCell ${on?'on':''}">${esc(t)}</button>`);
        c.onclick=()=>{ let msg=null; if(s.cells.includes(idx))s.cells=s.cells.filter(n=>n!==idx); else s.cells.push(idx);
          for(let li=0;li<LINES.length;li++){ const full=LINES[li].every(n=>s.cells.includes(n)); if(full&&!s.lines.includes(li)){s.lines.push(li);msg='BINGO! Volle lijn 🎉';} else if(!full&&s.lines.includes(li)){s.lines=s.lines.filter(n=>n!==li);} }
          persist(msg); refresh(); };
        grid.appendChild(c); });
      info.innerHTML=`${s.cells.length} / 16 afgevinkt · ${s.lines.length} lijn(en) · <span class="phBest">${points()} punten</span>`;
    }
    refresh();
    body.appendChild(el('<p class="phNote">Elk vakje = 5, elke volle lijn = 15. Je hoogste stand telt mee.</p>'));
    body.appendChild(grid); body.appendChild(info);
    const row=el('<div class="phBtnRow" style="margin-top:12px"></div>');
    const clr=el('<button class="phBtn alt">Kaart leegmaken</button>'); clr.onclick=()=>{ s.cells=[];s.lines=[]; LS.set('ph_bingo',s); refresh(); toast('Leeg — je beste blijft staan.'); };
    const nw=el('<button class="phBtn">Nieuwe kaart 🔁</button>'); nw.onclick=()=>{ LS.set('ph_bingo',null); bingo(); };
    row.appendChild(clr); row.appendChild(nw); body.appendChild(row);
    panel('Vakantiebingo',body);
  }

  /* ---------- YAHTZEE ---------- */
  const FACES=['','⚀','⚁','⚂','⚃','⚄','⚅'];
  function yahtzee(){
    let dice=[1,1,1,1,1],hold=[false,false,false,false,false],rolls=0,started=false;
    const cats=[{k:'ones',n:'Enen'},{k:'twos',n:'Tweeën'},{k:'threes',n:'Drieën'},{k:'fours',n:'Vieren'},{k:'fives',n:'Vijven'},{k:'sixes',n:'Zessen'},{k:'tok',n:'Three of a kind'},{k:'fok',n:'Four of a kind'},{k:'fh',n:'Full house (25)'},{k:'ss',n:'Kleine straat (30)'},{k:'ls',n:'Grote straat (40)'},{k:'yah',n:'Yahtzee (50)'},{k:'chance',n:'Chance'}];
    const score={};
    const counts=()=>{const c=[0,0,0,0,0,0,0];dice.forEach(d=>c[d]++);return c;};
    function scoreFor(k){const c=counts(),sum=dice.reduce((a,b)=>a+b,0);switch(k){case 'ones':return c[1];case 'twos':return c[2]*2;case 'threes':return c[3]*3;case 'fours':return c[4]*4;case 'fives':return c[5]*5;case 'sixes':return c[6]*6;case 'tok':return c.some(x=>x>=3)?sum:0;case 'fok':return c.some(x=>x>=4)?sum:0;case 'fh':{const t=c.some(x=>x===3),p=c.some(x=>x===2),f=c.some(x=>x===5);return (t&&p)||f?25:0;}case 'ss':{const st=new Set(dice),h=a=>a.every(n=>st.has(n));return h([1,2,3,4])||h([2,3,4,5])||h([3,4,5,6])?30:0;}case 'ls':{const st=new Set(dice),h=a=>a.every(n=>st.has(n));return h([1,2,3,4,5])||h([2,3,4,5,6])?40:0;}case 'yah':return c.some(x=>x===5)?50:0;case 'chance':return sum;}return 0;}
    const upper=()=>['ones','twos','threes','fours','fives','sixes'].reduce((a,k)=>a+(score[k]||0),0);
    const total=()=>{let t=Object.values(score).reduce((a,b)=>a+(b||0),0);if(upper()>=63)t+=35;return t;};
    const allDone=()=>cats.every(c=>score[c.k]!==undefined);
    const body=el('<div></div>'),dieRow=el('<div class="phDice"></div>'),rollBtn=el('<button class="phBtn coral">Gooien</button>');
    const rollInfo=el('<p class="phNote phCenter">Druk op “Gooien”. Na een worp: tik dobbelstenen aan om vast te houden, en tik op een <b style="color:var(--lake)">blauw vak</b> in de lijst om die score te kiezen. Zo vul je alle 13 vakken.</p>');
    const table=el('<table class="phSheet"></table>'),totalRow=el('<p class="phBig phCenter" style="margin-top:10px">Totaal: 0</p>');
    const updateTotal=()=>{totalRow.textContent=`Totaal: ${total()} ${upper()>=63?'(incl. +35 bonus)':''}`;};
    function drawDice(){dieRow.innerHTML='';dice.forEach((d,i)=>{const b=el(`<div class="phDie ${hold[i]?'hold':''}">${FACES[d]}</div>`);b.onclick=()=>{if(!started)return;hold[i]=!hold[i];drawDice();};dieRow.appendChild(b);});}
    function drawTable(){table.innerHTML='';cats.forEach(c=>{const filled=score[c.k]!==undefined;const prev=(started&&!filled)?scoreFor(c.k):(filled?score[c.k]:'');const tr=document.createElement('tr');tr.className=filled?'done':(started?'pick':'');const cell=(started&&!filled)?`<span class="pickPill">${prev} \u203a</span>`:(filled?score[c.k]:'—');tr.innerHTML=`<td>${c.n}</td><td class="v">${cell}</td>`;
      if(started&&!filled){tr.onclick=()=>pick(c.k);}
      table.appendChild(tr);});}
    async function pick(k){
      score[k]=scoreFor(k);rolls=0;hold=[false,false,false,false,false];started=false;rollBtn.disabled=false;rollBtn.textContent='Gooien';drawDice();drawTable();updateTotal();
      if(allDone()){const t=total();updateTotal();await recordGame('yahtzee',t,{done:true,score:t},`Klaar! Totaal ${t}`);rollInfo.innerHTML=`<span class="phBig">Klaar! Totaal: ${t}</span><br>Je hoogste totaal telt mee.`;rollBtn.disabled=true;const again=el('<div class="phBtnRow phCenter" style="justify-content:center;margin-top:10px"><button class="phBtn coral">Nog een potje 🔁</button></div>');again.firstElementChild.onclick=()=>yahtzee();body.appendChild(again);}
      else{rollInfo.innerHTML='Volgende beurt — druk op “Gooien”.';}
    }
    rollBtn.onclick=()=>{if(allDone())return;if(rolls>=3){toast('Kies eerst een vak');return;}started=true;dice=dice.map((d,i)=>hold[i]?d:(1+Math.floor(Math.random()*6)));rolls++;rollInfo.innerHTML=`Worp ${rolls} van 3 — tik dobbelstenen aan om vast te houden, of tik hieronder op een <b style="color:var(--lake)">blauw vak</b> om je score daar vast te leggen.`;if(rolls>=3)rollBtn.disabled=true;drawDice();drawTable();};
    drawDice();drawTable();updateTotal();
    body.appendChild(rollInfo);body.appendChild(dieRow);const br=el('<div class="phBtnRow phCenter" style="justify-content:center"></div>');br.appendChild(rollBtn);body.appendChild(br);body.appendChild(table);body.appendChild(totalRow);
    panel('Yahtzee',body);
  }

  /* ---------- HITSTER — muziek ---------- */
  function yearOptions(correct){ const s=new Set([correct]); let guard=0; while(s.size<4 && guard++<50){ const d=correct+(Math.floor(Math.random()*13)-6); if(d>=1965&&d<=2025&&d!==correct) s.add(d); } return shuffle([...s]); }
  function music(){
    const body=el('<div></div>');
    body.appendChild(el('<p class="phNote">Kies hoe je Hitster speelt:</p>'));
    const solo=el('<button class="phTile" style="width:100%;margin:6px 0;display:flex;flex-direction:column;align-items:flex-start;gap:3px;text-align:left"><span class="ic">🎧</span><span class="tt">Zelf spelen — telt mee</span><span class="ds">Op je eigen telefoon: beluister en raad het jaar uit 4 opties. Je beste ronde telt mee in de familiestand.</span></button>');
    const party=el('<button class="phTile" style="width:100%;margin:6px 0;display:flex;flex-direction:column;align-items:flex-start;gap:3px;text-align:left"><span class="ic">👥</span><span class="tt">Samen met 1 telefoon</span><span class="ds">Spelleider speelt het nummer voor de groep, de rest raadt hardop. Party-modus, geen punten.</span></button>');
    solo.onclick=musicSolo; party.onclick=musicParty;
    body.appendChild(solo); body.appendChild(party);
    panel('Hitster — muziek 🎵',body);
  }
  function musicSolo(){
    const body=el('<div></div>');
    let deck=shuffle(SONGS).slice(0,8), i=0, correct=0, answered=false;
    function render(){
      if(i>=deck.length){
        const pts=correct*10;
        recordGame('music',pts,{done:true,goed:correct},`Ronde klaar: ${correct}/${deck.length} goed`);
        body.innerHTML=`<div class="phCenter"><p class="phBig">${correct}/${deck.length} goed 🎉</p><p class="phNote">Deze ronde = <span class="phBest">${pts} punten</span>. Je beste ronde telt mee.</p></div>`;
        const row=el('<div class="phBtnRow phCenter" style="justify-content:center;margin-top:12px"></div>');
        const again=el('<button class="phBtn coral">Nog een ronde 🔁</button>'); again.onclick=()=>{ deck=shuffle(SONGS).slice(0,8); i=0; correct=0; answered=false; render(); };
        const back=el('<button class="phBtn alt">Terug</button>'); back.onclick=music;
        row.appendChild(again); row.appendChild(back); body.appendChild(row); return;
      }
      const song=deck[i]; answered=false;
      const sp='https://open.spotify.com/search/'+encodeURIComponent(song.a+' '+song.t);
      body.innerHTML=`<p class="phNote">Nummer ${i+1} / ${deck.length} · ${correct} goed</p><p class="phQ">Beluister en raad: in welk JAAR kwam dit nummer uit?</p>`;
      const rr=el('<div class="phBtnRow" style="margin-bottom:4px"></div>'); rr.appendChild(el(`<a class="phBtn coral" target="_blank" rel="noopener" href="${sp}">▶ Speel op Spotify</a>`)); body.appendChild(rr);
      const opts=el('<div></div>');
      yearOptions(song.y).forEach(yr=>{ const b=el(`<button class="phOpt">${yr}</button>`);
        b.onclick=()=>{ if(answered)return; answered=true; opts.querySelectorAll('.phOpt').forEach(x=>{x.disabled=true; if(Number(x.textContent)===song.y)x.classList.add('good');}); const ok=yr===song.y; if(!ok)b.classList.add('bad'); if(ok)correct++;
          reveal.innerHTML=`<b>${esc(song.a)} — ${esc(song.t)}</b> · ${song.y} · ${esc(song.g)}`; next.disabled=false; };
        opts.appendChild(b); });
      body.appendChild(opts);
      const reveal=el('<p class="phNote"></p>'); body.appendChild(reveal);
      const next=el('<button class="phBtn" style="margin-top:8px" disabled>Volgend nummer ›</button>'); next.onclick=()=>{ i++; render(); }; body.appendChild(next);
    }
    render(); panel('Hitster — zelf spelen 🎧',body);
  }
  function musicParty(){
    const body=el('<div></div>');
    let song=null,qtype=null,revealed=false,goed=LS.get('ph_music_goed',0);
    let players=[]; (async()=>{ try{ const a=A(); if(isJoined()&&a&&a.loadPlayers) players=await a.loadPlayers(); }catch(e){} })();
    const QTYPES=[['jaar','In welk JAAR kwam dit nummer uit?'],['genre','Wat is het GENRE?'],['artiest','Welke ARTIEST is dit?'],['titel','Wat is de TITEL van dit nummer?']];
    function nextSong(){ song=SONGS[Math.floor(Math.random()*SONGS.length)]; qtype=QTYPES[Math.floor(Math.random()*QTYPES.length)]; revealed=false; render(); }
    function counterEl(){ return `<p class="phNote phCenter" id="mCount">Goed geraden deze sessie: <b>${goed}</b></p>`; }
    function render(){
      if(!song){
        body.innerHTML='<p class="phNote">Party-spel voor één telefoon (de spelleider). Speel het nummer, laat je scherm <b>niet</b> zien 🙈, de rest raadt het antwoord op de vraag. Daarna onthul je het.</p>';
        const b=el('<button class="phBtn coral" style="margin-top:6px">Start — eerste nummer 🎵</button>'); b.onclick=nextSong; body.appendChild(b);
        body.appendChild(el(counterEl())); return;
      }
      const sp='https://open.spotify.com/search/'+encodeURIComponent(song.a+' '+song.t);
      body.innerHTML=`<p class="phNote">Vraag voor de spelers</p><p class="phQ">${qtype[1]}</p>`;
      const play=el(`<a class="phBtn coral" target="_blank" rel="noopener" href="${sp}">▶ Speel op Spotify</a>`);
      const rr=el('<div class="phBtnRow"></div>'); rr.appendChild(play); body.appendChild(rr);
      body.appendChild(el('<p class="phNote">Speel het bovenste zoekresultaat af voor de anderen. Als ze geraden hebben:</p>'));
      if(!revealed){ const r=el('<button class="phBtn" style="margin-top:6px">Toon antwoord</button>'); r.onclick=()=>{revealed=true;render();}; body.appendChild(r); }
      else{
        body.appendChild(el(`<div class="phPanel" style="margin-top:8px;box-shadow:none"><p class="phBig" style="font-size:18px">${esc(song.a)} — ${esc(song.t)}</p><p class="phNote">Jaar: <b>${song.y}</b> · Genre: <b>${esc(song.g)}</b></p></div>`));
        if(players.length){
          body.appendChild(el('<p class="phNote">Wie had het goed? Tik de naam aan (+10 punten):</p>'));
          const pr=el('<div class="phChips" style="margin-top:4px"></div>');
          players.forEach(pl=>{ const b=el(`<button class="phChip">${esc(pl.display_name)}</button>`); b.onclick=async()=>{ pr.querySelectorAll('button').forEach(x=>x.disabled=true); try{ await A().awardPoints(pl.id,10,'hitster'); }catch(e){} goed++; LS.set('ph_music_goed',goed); toast('+10 voor '+pl.display_name+' 🎉'); refreshProgressPanel(); nextSong(); }; pr.appendChild(b); });
          body.appendChild(pr);
          const skip=el('<button class="phBtn alt" style="margin-top:8px">Niemand · volgend nummer ›</button>'); skip.onclick=nextSong; body.appendChild(skip);
        } else {
          const row=el('<div class="phBtnRow" style="margin-top:8px"></div>');
          const good=el('<button class="phBtn alt">Goed geraden ✓</button>'); good.onclick=()=>{ goed++; LS.set('ph_music_goed',goed); const c=document.getElementById('mCount'); if(c)c.innerHTML=`Goed geraden deze sessie: <b>${goed}</b>`; };
          const nx=el('<button class="phBtn coral">Volgend nummer ›</button>'); nx.onclick=nextSong;
          row.appendChild(good); row.appendChild(nx); body.appendChild(row);
        }
      }
      body.appendChild(el(counterEl()));
    }
    render(); panel('Hitster — samen 👥',body);
  }

  /* ---------- MIJN TOP 10 ---------- */
  function top10(){
    if(!isJoined()) return joinGate('Mijn top 10');
    const body=el('<div></div>');
    body.appendChild(el('<p class="phNote">Maak je eigen top 10 van dingen die je wilt doen deze vakantie. Iedereen in de familie ziet elkaars lijst.</p>'));
    const mineWrap=el('<div></div>'), famWrap=el('<div style="margin-top:16px"></div>');
    body.appendChild(mineWrap); body.appendChild(famWrap);
    let items=[];
    async function save(){ try{ await A().saveProgress('top10',{items:items.slice(0,10)}); }catch(e){} loadFam(); }
    function renderMine(){
      mineWrap.innerHTML='<p class="phBig" style="font-size:16px">Mijn top 10</p>';
      if(!items.length) mineWrap.appendChild(el('<p class="phNote">Nog leeg — voeg hieronder je eerste wens toe.</p>'));
      items.forEach((it,i)=>{ const row=el(`<div class="phLead"><span>${i+1}. ${esc(it)}</span></div>`); const x=el('<button class="phBack" style="color:var(--coral)">✕</button>'); x.onclick=()=>{items.splice(i,1);save();renderMine();}; row.appendChild(x); mineWrap.appendChild(row); });
      if(items.length<10){ const add=el('<div class="phField"><input id="t10in" placeholder="Bijv. kajakken op het meer" maxlength="60"><button class="phBtn">Toevoegen</button></div>'); add.querySelector('button').onclick=()=>{ const inp=document.getElementById('t10in'); const v=(inp.value||'').trim(); if(v){items.push(v);save();renderMine();} }; mineWrap.appendChild(add); }
    }
    async function loadFam(){
      let rows=[]; try{ rows=await A().loadGroupProgress(); }catch(e){}
      const mine=rows.find(r=>r.game_key==='top10'&&r.player_id===myId());
      if(mine&&Array.isArray(mine.state.items)&&!items.length) items=mine.state.items.slice(0,10);
      famWrap.innerHTML='<p class="phBig" style="font-size:16px">Familie top 10\'s</p>';
      const others=rows.filter(r=>r.game_key==='top10'&&r.player_id!==myId());
      if(!others.length) famWrap.appendChild(el('<p class="phNote">Nog niemand anders heeft een lijst gemaakt.</p>'));
      others.forEach(r=>{ const s=r.state||{}; const box=el(`<div class="phPanel" style="box-shadow:none;margin-top:8px"><p style="font-weight:700;color:var(--ink);margin:0 0 4px">${esc(s.name||'speler')}</p></div>`); (s.items||[]).forEach((it,i)=>box.appendChild(el(`<div class="phNote" style="margin:2px 0">${i+1}. ${esc(it)}</div>`))); famWrap.appendChild(box); });
    }
    panel('Mijn top 10',body);
    (async()=>{ await loadFam(); renderMine(); })();
  }

  /* ---------- VRIJE TIJD ---------- */
  function vrijetijd(){
    if(!isJoined()) return joinGate('Vrije tijd');
    const body=el('<div></div>');
    body.appendChild(el('<p class="phNote">Wat wil jij in de vrije tijd doen bij de camping? Kies of vul zelf in. Iedereen ziet elkaars keuzes.</p>'));
    let choices=[];
    const chipsWrap=el('<div class="phChips" style="margin:10px 0"></div>');
    const add=el('<div class="phField"><input id="vtin" placeholder="Eigen idee…" maxlength="40"><button class="phBtn">Toevoegen</button></div>');
    const famWrap=el('<div style="margin-top:16px"></div>');
    async function save(){ try{ await A().saveProgress('vrijetijd',{choices}); }catch(e){} loadFam(); }
    function renderChips(){ chipsWrap.innerHTML='';
      VT_PRESETS.forEach(p=>{ const on=choices.includes(p); const c=el(`<button class="phChip ${on?'done':''}">${esc(p)}</button>`); c.onclick=()=>{ if(choices.includes(p))choices=choices.filter(x=>x!==p); else choices.push(p); save(); renderChips(); }; chipsWrap.appendChild(c); });
      choices.filter(c=>!VT_PRESETS.includes(c)).forEach(p=>{ const c=el(`<button class="phChip done">${esc(p)} ✕</button>`); c.onclick=()=>{ choices=choices.filter(x=>x!==p); save(); renderChips(); }; chipsWrap.appendChild(c); });
    }
    add.querySelector('button').onclick=()=>{ const inp=document.getElementById('vtin'); const v=(inp.value||'').trim(); if(v&&!choices.includes(v)){choices.push(v);save();renderChips();} };
    async function loadFam(){
      let rows=[]; try{ rows=await A().loadGroupProgress(); }catch(e){}
      const mine=rows.find(r=>r.game_key==='vrijetijd'&&r.player_id===myId());
      if(mine&&Array.isArray(mine.state.choices)&&!choices.length) choices=mine.state.choices.slice();
      famWrap.innerHTML='<p class="phBig" style="font-size:16px">Wat de familie wil</p>';
      const others=rows.filter(r=>r.game_key==='vrijetijd'&&r.player_id!==myId());
      if(!others.length) famWrap.appendChild(el('<p class="phNote">Nog niemand anders heeft iets gekozen.</p>'));
      others.forEach(r=>{ const s=r.state||{}; famWrap.appendChild(el(`<div class="phLead"><span>${esc(s.name||'speler')}</span><span style="font-weight:400;text-align:right">${(s.choices||[]).map(esc).join(', ')||'—'}</span></div>`)); });
    }
    body.appendChild(chipsWrap); body.appendChild(add); body.appendChild(famWrap);
    panel('Vrije tijd',body);
    (async()=>{ await loadFam(); renderChips(); })();
  }

  /* ---------- WIE VINDT WAT LEUK (favorieten) ---------- */
  async function syncFavs(){
    try{ const a=A(); if(!isJoined()||!a||!a.saveProgress) return;
      const raw=localStorage.getItem('favs'); const idx=raw?JSON.parse(raw):[];
      const AA=window.A||[]; const names=idx.map(i=>AA[i]&&AA[i].name).filter(Boolean);
      await a.saveProgress('favs',{items:names}); refreshProgressPanel();
    }catch(e){}
  }
  async function favsView(){
    if(!isJoined()) return joinGate('Wie vindt wat leuk');
    const body=el('<div></div>');
    body.appendChild(el('<p class="phNote">De hartjes die iedereen bij <b>Activiteiten</b> aantikt, verschijnen hier per persoon.</p>'));
    const wrap=el('<div></div>'); body.appendChild(wrap);
    panel('Wie vindt wat leuk ❤️',body);
    await syncFavs();
    let rows=[]; try{ rows=await A().loadGroupProgress(); }catch(e){}
    const favs=rows.filter(r=>r.game_key==='favs' && r.state && Array.isArray(r.state.items) && r.state.items.length);
    wrap.innerHTML='';
    if(!favs.length){ wrap.appendChild(el('<p class="phNote">Nog niemand heeft favorieten. Ga naar Activiteiten en tik op een ❤️.</p>')); return; }
    favs.forEach(r=>{ const st=r.state||{}; const box=el(`<div class="phPanel" style="box-shadow:none;margin-top:8px"><p style="font-weight:700;color:var(--ink);margin:0 0 4px">${esc(st.name||'speler')} — ${(st.items||[]).length} favoriet(en)</p></div>`); (st.items||[]).forEach(it=>box.appendChild(el(`<div class="phNote" style="margin:2px 0">❤️ ${esc(it)}</div>`))); wrap.appendChild(box); });
  }

  /* ---------- FOTOALBUM ---------- */
  function photoAlbum(){
    if(!isJoined()) return joinGate('Fotoalbum');
    const client=lc(), gid=myGroup();
    if(!client||!gid) return joinGate('Fotoalbum');
    let album=LS.get('ph_album','vos');
    const body=el('<div></div>');
    panel('Fotoalbum 📷',body);
    const albumName=()=>{ const a=ALBUMS.find(x=>x[0]===album); return a?a[1]:album; };
    function build(){
      body.innerHTML='';
      body.appendChild(el('<p class="phNote">Deel jullie vakantiefoto\'s. Kies een album, upload vanaf je telefoon (camera of galerij). Iedereen ziet ze live. Aan het eind maak je er een fotoboek van om te printen (bijv. bij Albelli of Fotofabriek).</p>'));
      const tabs=el('<div class="phBtnRow" style="margin-top:8px"></div>');
      ALBUMS.forEach(([k,label])=>{ const b=el('<button class="phChip '+(k===album?'done':'')+'">'+esc(label)+'</button>'); b.onclick=()=>{ album=k; LS.set('ph_album',k); build(); }; tabs.appendChild(b); });
      body.appendChild(tabs);
      const up=el('<label class="phUpload">➕ Foto\'s toevoegen aan '+esc(albumName())+'<input type="file" accept="image/*" capture="environment" multiple style="display:none"></label>');
      const inp=up.querySelector('input');
      inp.onchange=async()=>{ const files=Array.from(inp.files||[]); if(!files.length)return; up.textContent='Bezig met uploaden…'; await uploadFiles(files); build(); };
      body.appendChild(up);
      const info=el('<p class="phNote" id="phPhotoInfo">Laden…</p>'); body.appendChild(info);
      const gallery=el('<div class="phGrid" id="phGallery"></div>'); body.appendChild(gallery);
      const book=el('<button class="phBtn coral" style="margin-top:12px">📖 Fotoboek maken / bewerken</button>'); book.onclick=()=>bookEditor(album); body.appendChild(book);
      body.appendChild(el('<p class="phNote">In de fotoboek-editor stelt de app automatisch een opmaak samen. Je past titel, indeling en bijschriften aan en print naar PDF voor <b>Albelli</b> of <b>Fotofabriek</b>.</p>'));
      loadGallery();
    }
    async function uploadFiles(files){
      for(const file of files){
        if(!file.type||!file.type.startsWith('image/')) continue;
        const ext=((file.name||'foto').split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
        const path=gid+'/'+album+'/'+Date.now()+'-'+Math.random().toString(36).slice(2,8)+'.'+ext;
        try{
          const up=await client.storage.from('fotos').upload(path,file,{cacheControl:'3600',upsert:false});
          if(up.error){ console.error(up.error); toast('Upload mislukt'); continue; }
          const pub=client.storage.from('fotos').getPublicUrl(path);
          const url=pub&&pub.data&&pub.data.publicUrl;
          const pl=A().player;
          await client.from('photos').insert({ group_id:gid, album:album, path:path, url:url, uploaded_by:myId(), uploader_name:pl&&pl.display_name });
        }catch(e){ console.error(e); toast('Upload mislukt'); }
      }
      toast('Foto\'s toegevoegd 🎉');
    }
    async function loadGallery(){
      const g=document.getElementById('phGallery'), info=document.getElementById('phPhotoInfo');
      let data=[]; try{ const r=await client.from('photos').select('*').eq('group_id',gid).eq('album',album).order('created_at',{ascending:false}); data=r.data||[]; }catch(e){}
      if(g) g.innerHTML=data.map(p=>'<div class="phPhoto"><img loading="lazy" src="'+esc(p.url)+'" alt=""><span>'+esc(p.uploader_name||'')+'</span></div>').join('')||'<p class="phNote">Nog geen foto\'s in dit album.</p>';
      if(info) info.textContent=data.length+" foto('s) in "+albumName();
    }
    function makeBook(){
      (async()=>{
        let data=[]; try{ const r=await client.from('photos').select('*').eq('group_id',gid).eq('album',album).order('created_at'); data=r.data||[]; }catch(e){}
        if(!data.length){ toast('Nog geen foto\'s om een boek van te maken'); return; }
        const title=albumName();
        const figs=data.map(function(p){ return '<figure><img src="'+p.url+'"><figcaption>'+esc(p.uploader_name||'')+' · '+new Date(p.created_at).toLocaleDateString('nl-NL')+'</figcaption></figure>'; }).join('');
        const css2='@page{size:A4;margin:10mm}body{font-family:system-ui,sans-serif;color:#0d3550;margin:0}.cover{height:95vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;page-break-after:always}.cover .eb{letter-spacing:3px;color:#0f91a3;font-weight:700}.cover h1{font-size:44px;margin:8px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8mm;padding:6mm}figure{margin:0;page-break-inside:avoid}.grid img{width:100%;height:105mm;object-fit:cover;border-radius:3mm}figcaption{font-size:10px;color:#697983;margin-top:1.5mm}';
        const html='<html><head><meta charset="utf-8"><title>Fotoboek '+title+'</title><style>'+css2+'</style></head><body><div class="cover"><div class="eb">ANNECY 2026</div><h1>'+title+'</h1><div>Fotoboek · Camping L\'Idéal</div></div><div class="grid">'+figs+'</div><scr'+'ipt>window.onload=function(){setTimeout(function(){window.print();},900);};</scr'+'ipt></body></html>';
        const w=window.open('','_blank'); if(!w){ toast('Sta pop-ups toe voor het fotoboek'); return; } w.document.write(html); w.document.close();
      })();
    }
    build();
    try{ if(client._phPhotoSub) client.removeChannel(client._phPhotoSub); }catch(e){}
    try{ client._phPhotoSub=client.channel('photos-'+gid).on('postgres_changes',{event:'*',schema:'public',table:'photos',filter:'group_id=eq.'+gid},()=>loadGallery()).subscribe(); }catch(e){}
  }

  /* ---------- FOTOBOEK-EDITOR (Albelli-stijl) ---------- */
  function bookEditor(album){
    if(!isJoined()) return joinGate('Fotoboek');
    const client=lc(), gid=myGroup();
    if(!client||!gid) return joinGate('Fotoboek');
    const albObj=ALBUMS.find(x=>x[0]===album)||[album,album];
    const body=el('<div></div>');
    const p=panel('Fotoboek-editor 📖',body);
    p.querySelector('.phBack').onclick=()=>photoAlbum();
    let photos=[], cfg={title:albObj[1],subtitle:"Camping l'Idéal · Lac d'Annecy",layout:2,order:[],hidden:[]};
    let saveT=null;
    const inp=(ph,val)=>{ const e=el('<input>'); e.setAttribute('style',ph); e.value=val||''; return e; };
    function scheduleSave(){ clearTimeout(saveT); saveT=setTimeout(saveCfg,600); }
    async function saveCfg(){ try{ await client.rpc('save_book',{p_album:album,p_config:cfg}); }catch(e){ console.error(e); } }
    async function load(){
      body.innerHTML='<p class="phNote">Laden…</p>';
      try{ const r=await client.from('photos').select('*').eq('group_id',gid).eq('album',album).order('created_at'); photos=r.data||[]; }catch(e){ photos=[]; }
      try{ const r=await client.from('game_books').select('config').eq('group_id',gid).eq('album',album).maybeSingle(); if(r&&r.data&&r.data.config) cfg=Object.assign(cfg,r.data.config); }catch(e){}
      const ids=photos.map(x=>x.id);
      cfg.order=(cfg.order||[]).filter(id=>ids.includes(id));
      ids.forEach(id=>{ if(!cfg.order.includes(id)) cfg.order.push(id); });
      cfg.hidden=(cfg.hidden||[]).filter(id=>ids.includes(id));
      render();
    }
    function ordered(){ const map={}; photos.forEach(x=>map[x.id]=x); return cfg.order.map(id=>map[id]).filter(Boolean); }
    function move(id,dir){ const i=cfg.order.indexOf(id), j=i+dir; if(i<0||j<0||j>=cfg.order.length) return; const t=cfg.order[i]; cfg.order[i]=cfg.order[j]; cfg.order[j]=t; scheduleSave(); render(); }
    function render(){
      body.innerHTML='';
      body.appendChild(el('<p class="phNote">De app maakt automatisch een fotoboek van album <b>'+esc(albObj[1])+'</b>. Pas titel, indeling en bijschriften aan — alles wordt gedeeld met de familie. Klaar? Klik op <b>Voorbeeld / print</b> en sla op als PDF.</p>'));
      const tW=el('<div style="margin:12px 0"></div>');
      const tI=inp('width:100%;padding:9px;border:1px solid #d5e0dd;border-radius:9px;font-size:15px;font-weight:700', cfg.title); tI.placeholder='Titel van het fotoboek';
      tI.oninput=()=>{ cfg.title=tI.value; scheduleSave(); };
      const sI=inp('width:100%;padding:8px;border:1px solid #d5e0dd;border-radius:9px;font-size:13px;margin-top:6px', cfg.subtitle); sI.placeholder='Ondertitel';
      sI.oninput=()=>{ cfg.subtitle=sI.value; scheduleSave(); };
      tW.append(tI,sI); body.appendChild(tW);
      body.appendChild(el('<p class="phNote" style="margin-bottom:4px">Foto\'s per pagina:</p>'));
      const lr=el('<div class="phBtnRow"></div>');
      [[1,'1 groot'],[2,"2 foto's"],[4,"4 foto's"]].forEach(a=>{ const b=el('<button class="phChip '+(cfg.layout==a[0]?'done':'')+'">'+a[1]+'</button>'); b.onclick=()=>{ cfg.layout=a[0]; scheduleSave(); render(); }; lr.appendChild(b); });
      body.appendChild(lr);
      const vis=ordered(), inBook=vis.filter(x=>!cfg.hidden.includes(x.id)).length;
      body.appendChild(el('<p class="phNote" style="margin-top:14px">'+inBook+" foto('s) in het boek · gebruik ▲▼ om te ordenen, 🚫 om er één uit te laten</p>"));
      const list=el('<div></div>');
      vis.forEach(ph=>{
        const hidden=cfg.hidden.includes(ph.id);
        const row=el('<div style="display:flex;gap:8px;align-items:flex-start;padding:8px;border:1px solid #e6eeeb;border-radius:10px;margin:6px 0;'+(hidden?'opacity:.45':'')+'"></div>');
        const img=el('<img loading="lazy" src="'+esc(ph.url)+'" style="width:62px;height:62px;object-fit:cover;border-radius:8px;flex:0 0 auto">');
        const mid=el('<div style="flex:1;min-width:0"></div>');
        const cap=inp('width:100%;padding:6px 8px;border:1px solid #d5e0dd;border-radius:7px;font-size:13px', ph.caption); cap.placeholder='Bijschrift (optioneel)';
        cap.onchange=async()=>{ ph.caption=cap.value; try{ await client.rpc('set_photo_caption',{p_photo_id:ph.id,p_caption:cap.value}); toast('Bijschrift opgeslagen'); }catch(e){ console.error(e); } };
        mid.append(cap, el('<p class="phNote" style="margin:4px 0 0">'+esc(ph.uploader_name||'')+'</p>'));
        const ctr=el('<div style="display:flex;flex-direction:column;gap:3px;flex:0 0 auto"></div>');
        const mini='cursor:pointer;border:1px solid #d5e0dd;background:#f3f6f6;border-radius:7px;width:34px;height:26px;font-size:13px;line-height:1';
        const up=el('<button style="'+mini+'">▲</button>'); up.onclick=()=>move(ph.id,-1);
        const dn=el('<button style="'+mini+'">▼</button>'); dn.onclick=()=>move(ph.id,1);
        const tg=el('<button style="'+mini+'">'+(hidden?'👁':'🚫')+'</button>'); tg.title=hidden?'Weer in boek':'Uit boek laten'; tg.onclick=()=>{ if(hidden) cfg.hidden=cfg.hidden.filter(i=>i!==ph.id); else cfg.hidden.push(ph.id); scheduleSave(); render(); };
        ctr.append(up,dn,tg);
        row.append(img,mid,ctr); list.appendChild(row);
      });
      body.appendChild(list);
      if(!vis.length) body.appendChild(el('<p class="phNote">Nog geen foto\'s in dit album. Voeg eerst foto\'s toe in het fotoalbum.</p>'));
      const prev=el('<button class="phBtn coral" style="margin-top:14px">👁 Voorbeeld / print (PDF)</button>'); prev.onclick=printBook; body.appendChild(prev);
      body.appendChild(el('<p class="phNote">Tip: kies bij printen "Opslaan als PDF". Upload die PDF (of de losse foto\'s) bij <b>Albelli</b> of <b>Fotofabriek</b>.</p>'));
    }
    function printBook(){
      const list=ordered().filter(x=>!cfg.hidden.includes(x.id));
      if(!list.length){ toast('Geen foto\'s in het boek'); return; }
      const per=cfg.layout||2, cols=per===4?2:1;
      const imgH=per===1?'168mm':(per===2?'110mm':'80mm');
      const pages=[]; for(let i=0;i<list.length;i+=per) pages.push(list.slice(i,i+per));
      const fig=x=>{ const cap=x.caption?esc(x.caption):(esc(x.uploader_name||'')+' · '+new Date(x.created_at).toLocaleDateString('nl-NL')); return '<figure><img src="'+x.url+'"><figcaption>'+cap+'</figcaption></figure>'; };
      const pagesHTML=pages.map(pg=>'<section class="pg"><div class="grid">'+pg.map(fig).join('')+'</div></section>').join('');
      const title=esc(cfg.title||albObj[1]), sub=esc(cfg.subtitle||'');
      const css2='@page{size:A4;margin:0}*{box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;color:#0d3550;margin:0}'
        +'.cover{height:297mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;page-break-after:always;background:linear-gradient(160deg,#e8f4f6,#f7fbfb)}'
        +'.cover .eb{letter-spacing:4px;color:#0f91a3;font-weight:700;font-size:15px}.cover h1{font-size:46px;margin:10px 24px;line-height:1.08}.cover .sub{color:#51707a;font-size:16px}'
        +'.pg{min-height:297mm;padding:14mm 12mm;page-break-after:always;display:flex}'
        +'.grid{display:grid;grid-template-columns:repeat('+cols+',1fr);gap:8mm;width:100%;align-content:center}'
        +'figure{margin:0;page-break-inside:avoid;display:flex;flex-direction:column}'
        +'figure img{width:100%;height:'+imgH+';object-fit:cover;border-radius:3mm;box-shadow:0 1mm 3mm rgba(0,0,0,.12)}'
        +'figcaption{font-size:11px;color:#51707a;margin-top:2mm;text-align:center}';
      const html='<html><head><meta charset="utf-8"><title>Fotoboek '+title+'</title><style>'+css2+'</style></head><body>'
        +'<div class="cover"><div class="eb">ANNECY 2026</div><h1>'+title+'</h1>'+(sub?'<div class="sub">'+sub+'</div>':'')+'</div>'
        +pagesHTML+'<scr'+'ipt>window.onload=function(){setTimeout(function(){window.print();},900);};</scr'+'ipt></body></html>';
      const w=window.open('','_blank'); if(!w){ toast('Sta pop-ups toe voor het fotoboek'); return; } w.document.write(html); w.document.close();
    }
    load();
  }

  /* ---------- SPEURTOCHT ---------- */
  function speurtocht(){
    const s=LS.get('ph_speur',{done:[]}); if(!Array.isArray(s.done))s.done=[];
    const total=SPEUR.kids.length+SPEUR.volw.length;
    const points=()=>s.done.length*5;
    function persist(){ LS.set('ph_speur',s); recordGame('speurtocht',points(),{done:s.done.length>=total,goed:s.done.length}); }
    const body=el('<div></div>');
    function render(){
      body.innerHTML='';
      body.appendChild(el("<p class=\"phNote\">Speurtocht rond Camping l'Idéal & Lac d'Annecy. Vink af wat je vindt of doet — elk vakje = 5 punten. Voor jong én oud!</p>"));
      const mk=(title,items,offset)=>{ body.appendChild(el('<p class="phBig" style="font-size:16px;margin-top:12px">'+title+'</p>')); items.forEach((t,j)=>{ const idx=offset+j; const on=s.done.includes(idx); const b=el('<button class="phOpt '+(on?'good':'')+'">'+(on?'✅ ':'⬜ ')+esc(t)+'</button>'); b.onclick=()=>{ if(s.done.includes(idx))s.done=s.done.filter(n=>n!==idx); else s.done.push(idx); persist(); render(); }; body.appendChild(b); }); };
      mk('🧒 Voor de kids', SPEUR.kids, 0);
      mk('🧑 Voor de volwassenen', SPEUR.volw, SPEUR.kids.length);
      body.appendChild(el('<p class="phNote">'+s.done.length+' van '+total+' gevonden · <span class="phBest">'+points()+' punten</span></p>'));
      const reset=el('<button class="phBtn alt" style="margin-top:8px">Speurtocht leegmaken</button>'); reset.onclick=()=>{ s.done=[]; LS.set('ph_speur',s); render(); toast('Leeg — je beste blijft staan'); }; body.appendChild(reset);
    }
    render(); panel('Speurtocht 🔍',body);
  }

  /* ---------- TIJDBOM (party, 1 telefoon) ---------- */
  function tijdbom(){
    const CATS=['een Frans gerecht','een dier','iets dat je meeneemt op vakantie','een woord met een A','iets blauws','een land in Europa','een merk auto','iets dat je bij het meer doet','een Franse stad','een ijssmaak','een sport','iets in de tent of camper','een fruitsoort','een jongensnaam','een meisjesnaam','iets dat kan zwemmen','een kleur','iets in de supermarkt','een filmtitel','iets dat vliegt','een beroep','een drankje','iets op het strand','een berg of meer','iets met wielen','een woord van 5 letters'];
    let timer=null,pulse=null,cat='';
    const body=el('<div></div>');
    function cleanup(){ if(timer){clearTimeout(timer);timer=null;} if(pulse){clearInterval(pulse);pulse=null;} }
    function intro(){ cleanup(); body.innerHTML=''; body.appendChild(el(`<p class="phNote phCenter">Party-spel met één telefoon. Kies "Start": de app geeft een categorie en een <b>verborgen</b> afteltimer. Noem om de beurt iets en geef de telefoon door — wie 'm vasthoudt als de bom afgaat, verliest. Geen punten, puur lol.</p>`)); const r=el(`<div class="phBtnRow phCenter" style="justify-content:center"></div>`); const b=el(`<button class="phBtn coral">▶ Start de bom</button>`); b.onclick=start; r.appendChild(b); body.appendChild(r); }
    function start(){ cleanup(); cat=CATS[Math.floor(Math.random()*CATS.length)]; body.innerHTML=`<p class="phNote phCenter">Noem om de beurt iets uit de categorie en <b>geef de telefoon door</b>. Wie 'm vasthoudt als de bom afgaat, is af! 😄</p><p class="phCenter" style="font-size:56px;margin:12px 0"><span id="tbBomb" style="display:inline-block">💣</span></p><p class="phCenter" style="font-size:21px;font-weight:800;color:var(--ink)">${esc(cat)}</p><p class="phNote phCenter">De bom loopt… ⏳</p>`; const bomb=body.querySelector('#tbBomb'); let s=1,d=1; pulse=setInterval(()=>{ s+=d*0.05; if(s>=1.35)d=-1; if(s<=1)d=1; if(bomb)bomb.style.transform='scale('+s.toFixed(2)+')'; },80); timer=setTimeout(boom, 6000+Math.floor(Math.random()*17000)); }
    function boom(){ cleanup(); body.innerHTML=`<p class="phCenter" style="font-size:56px;margin:10px 0">💥</p><p class="phCenter" style="font-size:22px;font-weight:800;color:var(--coral)">BOEM!</p><p class="phNote phCenter">Wie de telefoon vasthoudt is af.<br>Categorie was: <b>${esc(cat)}</b></p>`; const r=el(`<div class="phBtnRow phCenter" style="justify-content:center;margin-top:12px"></div>`); const a=el(`<button class="phBtn coral">🔁 Nieuwe ronde</button>`); a.onclick=start; r.appendChild(a); body.appendChild(r); }
    const p=panel('Tijdbom 💣',body); p.querySelector('.phBack').onclick=()=>{ cleanup(); menu(); }; intro();
  }

  /* ---------- WOORDRACE / ANAGRAM (individueel) ---------- */
  function woordrace(){
    const KIDS=['strand','zon','ijs','boot','fiets','meer','berg','tent','vis','bal','kamp','auto','water','zand','hoed','bril','eend','kaas','stok','wolk','regen','ster','maan','vlag','slak'];
    const VOLW=['vakantie','avontuur','zonnebrand','wandeling','croissant','baguette','fromage','bonjour','plage','soleil','fietstocht','picknick','waterval','uitzicht','kampvuur','bergmeer','zwemvest','zonsondergang','ansichtkaart','ijssalon','kajakken','marmot','meander','panorama'];
    const body=el('<div></div>');
    const p=panel('Woordrace 🔤',body);
    function scramble(w){ const a=w.split(''); let s; do{ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } s=a.join(''); }while(s===w && w.length>1); return s; }
    function levelPick(){ p.querySelector('.phBack').onclick=menu; body.innerHTML='<p class="phNote">Ontwar zoveel mogelijk woorden binnen 60 seconden. Kies je niveau:</p>'; const k=el('<button class="phTile" style="width:100%;margin:6px 0;display:flex;flex-direction:column;align-items:flex-start;gap:3px;text-align:left"><span class="ic">🧒</span><span class="tt">Kids</span><span class="ds">Korte, makkelijke woorden · elk goed = 12 punten (extra!).</span></button>'); const v=el('<button class="phTile" style="width:100%;margin:6px 0;display:flex;flex-direction:column;align-items:flex-start;gap:3px;text-align:left"><span class="ic">🧑</span><span class="tt">Volwassen</span><span class="ds">Langere & Franse woorden · elk goed = 10 punten.</span></button>'); k.onclick=()=>round('kids'); v.onclick=()=>round('volw'); body.appendChild(k); body.appendChild(v); }
    function round(level){
      const fresh=()=>shuffle(level==='kids'?KIDS:VOLW);
      let pool=fresh(), idx=0, score=0, lives=3, cur='', tleft=0, tick=null, answered=false;
      const per=level==='kids'?12:10, PERT=level==='kids'?22:18;
      const hearts=()=>'❤️'.repeat(lives)+'🤍'.repeat(3-lives);
      function stopTick(){ if(tick){clearInterval(tick);tick=null;} }
      function startTick(){ stopTick(); tick=setInterval(()=>{ if(answered)return; tleft--; const t=document.getElementById('wrT'); if(t)t.textContent=tleft+'s'; if(tleft<=0) fail('⏰ Te laat!'); },1000); }
      function nextWord(){ answered=false; tleft=PERT; if(idx>=pool.length){ pool=pool.concat(fresh()); } cur=pool[idx++]; draw(); startTick(); }
      function draw(){
        body.innerHTML=`<div class="phBar"><span class="phNote">${score} goed · ${hearts()}</span><span class="phTimer" id="wrT">${tleft}s</span></div><p class="phQ phCenter" style="letter-spacing:5px;font-size:28px">${esc(scramble(cur).toUpperCase())}</p>`;
        const inp=el('<input placeholder="Jouw woord…" autocomplete="off" autocapitalize="none" style="width:100%;padding:12px;border:1px solid var(--line);border-radius:12px;font-size:16px">');
        const ok=el('<button class="phBtn coral" style="width:100%;margin-top:8px">Check</button>');
        const check=()=>{ if(answered)return; if(inp.value.trim().toLowerCase()===cur){ answered=true; stopTick(); score++; toast('Goed! ✓'); nextWord(); } else { fail('❌ Fout'); } };
        ok.onclick=check; inp.onkeydown=(e)=>{ if(e.key==='Enter') check(); };
        body.appendChild(inp); body.appendChild(ok);
        body.appendChild(el('<p class="phNote phCenter" style="margin-top:8px">Tip: het is een vakantiewoord. Bij <b>3 fout</b> ben je af.</p>'));
        setTimeout(()=>inp.focus(),40);
      }
      function fail(reason){ if(answered)return; answered=true; stopTick(); lives--;
        body.innerHTML=`<div class="phBar"><span class="phNote">${score} goed · ${hearts()}</span><span class="phTimer">—</span></div><p class="phCenter" style="font-size:19px;color:#e05a52;font-weight:800">${reason}</p><p class="phCenter" style="font-size:22px;font-weight:800;color:var(--ink)">Het woord was:<br><span style="color:var(--lake);letter-spacing:2px">${esc(cur.toUpperCase())}</span></p>`;
        const r=el('<div class="phBtnRow phCenter" style="justify-content:center;margin-top:12px"></div>'); const nb=el('<button class="phBtn coral">'+(lives<=0?'Uitslag ›':'Volgende ›')+'</button>'); nb.onclick=(lives<=0?end:nextWord); r.appendChild(nb); body.appendChild(r);
      }
      function end(){ stopTick(); const pts=score*per; recordGame('woordrace',pts,{done:true,goed:score,level},`Woordrace ${level}: ${score} goed`);
        body.innerHTML=`<div class="phCenter"><p class="phBig">Af! 💥</p><p class="phNote">Je had <b>${score}</b> woorden goed = <span class="phBest">${pts} punten</span>. Je beste ronde telt mee.</p></div>`;
        const r=el('<div class="phBtnRow phCenter" style="justify-content:center;margin-top:12px;flex-wrap:wrap"></div>'); const a=el('<button class="phBtn coral">Opnieuw 🔁</button>'); a.onclick=()=>round(level); const b=el('<button class="phBtn alt">Ander niveau</button>'); b.onclick=levelPick; const c=el('<button class="phBtn alt">Terug</button>'); c.onclick=menu; r.appendChild(a); r.appendChild(b); r.appendChild(c); body.appendChild(r);
      }
      p.querySelector('.phBack').onclick=()=>{ stopTick(); menu(); };
      nextWord();
    }
    levelPick();
  }

  /* ---------- SNAKE (individueel, touch) ---------- */
  function snake(){
    const body=el('<div></div>');
    const N=17, MAXW=Math.min((window.innerWidth||360)-40,380), CELL=Math.max(14,Math.floor(MAXW/N)), SZ=N*CELL, DPR=Math.min(2,window.devicePixelRatio||1);
    let arr,dir,nextDir,food,loop=null,score=0,over=false,speed=140,running=false;
    const cv=el('<canvas width="'+(SZ*DPR)+'" height="'+(SZ*DPR)+'" style="width:'+SZ+'px;height:'+SZ+'px;max-width:100%;border-radius:16px;touch-action:none;display:block;box-shadow:0 8px 22px rgba(13,53,80,.18)"></canvas>');
    const ctx=cv.getContext('2d'); ctx.scale(DPR,DPR);
    const info=el('<p class="phNote phCenter" id="snScore" style="font-size:15px;font-weight:800;color:var(--ink)">Score: 0</p>');
    function setScore(){ const e=document.getElementById('snScore'); if(e)e.textContent='Score: '+score; }
    function place(){ let ok=false; while(!ok){ food={x:Math.floor(Math.random()*N),y:Math.floor(Math.random()*N)}; ok=!arr.some(s=>s.x===food.x&&s.y===food.y); } }
    function reset(){ arr=[{x:8,y:8},{x:7,y:8},{x:6,y:8}]; dir={x:1,y:0}; nextDir=dir; score=0; over=false; speed=140; setScore(); place(); draw(); }
    function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); ctx.fill(); }
    function draw(){
      const g=ctx.createLinearGradient(0,0,0,SZ); g.addColorStop(0,'#12293d'); g.addColorStop(1,'#0b1a28'); ctx.fillStyle=g; ctx.fillRect(0,0,SZ,SZ);
      const fx=food.x*CELL+CELL/2, fy=food.y*CELL+CELL/2; ctx.save(); ctx.shadowColor='#ff6f68'; ctx.shadowBlur=14; ctx.fillStyle='#ff6f68'; ctx.beginPath(); ctx.arc(fx,fy,CELL*0.33,0,7); ctx.fill(); ctx.restore();
      arr.forEach((s,i)=>{ const t=i/Math.max(1,arr.length-1); ctx.fillStyle=i===0?'#3ff09a':'rgba(55,178,107,'+(1-t*0.55).toFixed(2)+')'; rr(s.x*CELL+1.5,s.y*CELL+1.5,CELL-3,CELL-3,Math.min(7,CELL*0.32)); });
      const h=arr[0], cx=h.x*CELL+CELL/2, cy=h.y*CELL+CELL/2; ctx.fillStyle='#0b1a28'; ctx.beginPath(); ctx.arc(cx+dir.x*CELL*0.16-2.4,cy+dir.y*CELL*0.16-1.6,1.7,0,7); ctx.arc(cx+dir.x*CELL*0.16+2.4,cy+dir.y*CELL*0.16-1.6,1.7,0,7); ctx.fill();
    }
    function loopFn(){ if(loop)clearInterval(loop); loop=setInterval(step,speed); }
    function step(){ if(over||!running)return; dir=nextDir; const h={x:arr[0].x+dir.x,y:arr[0].y+dir.y}; if(h.x<0||h.y<0||h.x>=N||h.y>=N||arr.some(s=>s.x===h.x&&s.y===h.y)){ gameOver(); return; } arr.unshift(h); if(h.x===food.x&&h.y===food.y){ score++; setScore(); place(); if(speed>65){speed-=4;loopFn();} } else arr.pop(); draw(); }
    function start(){ reset(); running=true; loopFn(); setScore(); }
    function stop(){ running=false; if(loop){clearInterval(loop);loop=null;} }
    function gameOver(){ over=true; running=false; if(loop){clearInterval(loop);loop=null;} recordGame('snake',score,{done:score>0,score},'Snake: '+score); info.innerHTML='💀 Game over — score: <b>'+score+'</b> · beste telt mee. Veeg of tik ▶ voor opnieuw.'; }
    function setDir(x,y){ if(dir.x===-x&&dir.y===-y)return; if(nextDir.x===x&&nextDir.y===y)return; nextDir={x:x,y:y}; }
    function swipe(dx,dy){ const T=Math.max(12,CELL*0.7); if(Math.abs(dx)<T&&Math.abs(dy)<T)return false; if(Math.abs(dx)>Math.abs(dy)) setDir(dx>0?1:-1,0); else setDir(0,dy>0?1:-1); return true; }
    let px=0,py=0,touching=false;
    cv.addEventListener('touchstart',e=>{ e.preventDefault(); const t=e.touches[0]; px=t.clientX; py=t.clientY; touching=true; if(!running&&!over)start(); else if(over)start(); },{passive:false});
    cv.addEventListener('touchmove',e=>{ e.preventDefault(); if(!touching)return; const t=e.touches[0]; if(swipe(t.clientX-px,t.clientY-py)){ px=t.clientX; py=t.clientY; } },{passive:false});
    cv.addEventListener('touchend',()=>{ touching=false; },{passive:true});
    let md=false; cv.addEventListener('mousedown',e=>{ md=true; px=e.clientX; py=e.clientY; if(!running&&!over)start(); else if(over)start(); }); cv.addEventListener('mousemove',e=>{ if(!md)return; if(swipe(e.clientX-px,e.clientY-py)){ px=e.clientX; py=e.clientY; } }); const upH=()=>md=false; window.addEventListener('mouseup',upH);
    const keyh=(e)=>{ const k=e.key; let hit=true; if(k==='ArrowUp')setDir(0,-1); else if(k==='ArrowDown')setDir(0,1); else if(k==='ArrowLeft')setDir(-1,0); else if(k==='ArrowRight')setDir(1,0); else hit=false; if(hit){ e.preventDefault(); if(!running&&!over)start(); } };
    document.addEventListener('keydown',keyh);
    body.appendChild(el('<p class="phNote phCenter">🐍 <b>Veeg met je vinger</b> over het speelveld om te sturen — ook in één doorlopende beweging. Eet de rode appel. Botsen = einde. Je beste score telt mee.</p>'));
    const wrap=el('<div class="phCenter"></div>'); wrap.appendChild(cv); body.appendChild(wrap); body.appendChild(info);
    const ctr=el('<div class="phBtnRow phCenter" style="justify-content:center;margin-top:10px"></div>'); const sb=el('<button class="phBtn coral">▶ Start / Opnieuw</button>'); sb.onclick=start; ctr.appendChild(sb); body.appendChild(ctr);
    const p=panel('Snake 🐍',body); p.querySelector('.phBack').onclick=()=>{ stop(); document.removeEventListener('keydown',keyh); window.removeEventListener('mouseup',upH); menu(); };
    reset();
  }

  /* ---------- RESET ---------- */
  function resetPanel(){
    const body=el('<div></div>');
    body.appendChild(el('<p class="phNote">Kies wat je opnieuw wilt beginnen. Dit wist <b>jouw</b> voortgang én je punten van dat spel uit de familiestand (alleen van jou, niet van anderen).</p>'));
    const games=[['quiz','🧠 Familiequiz'],['bingo','🗺️ Vakantiebingo'],['yahtzee','🎲 Yahtzee'],['music','🎵 Hitster'],['all','⟲ Alles resetten']];
    games.forEach(([k,label])=>{
      const b=el(`<button class="phBtn alt" style="display:block;width:100%;text-align:left;margin:6px 0">${label}</button>`);
      b.onclick=async()=>{
        if(!confirm('Zeker weten? Dit reset "'+label+'" voor jou.')) return;
        if(k==='quiz'||k==='all') LS.set('ph_quiz_done',{});
        if(k==='bingo'||k==='all') LS.set('ph_bingo',null);
        if(k==='music'||k==='all') LS.set('ph_music_goed',0);
        try{ const c=lc(); if(c && isJoined()) await c.rpc('reset_my_game',{p_game_key:k}); }catch(e){}
        refreshProgressPanel(); toast('Gereset ✓'); menu();
      };
      body.appendChild(b);
    });
    panel('Reset',body);
  }

  /* ---------- SAMEN LIVE — quizshow ---------- */
  function liveQuiz(){
    const body=el('<div></div>');
    const p=panel('Samen live 🎬',body);
    const client=lc(), gid=myGroup();
    if(!isJoined()||!client||!gid){ body.innerHTML='<p class="phNote">Doe eerst mee met de familiecode hierboven ⤴ om samen live te spelen.</p>'; return; }
    let sess=null, tick=null, chan1=null, chan2=null, lastKey='', myPick={q:-1,c:-1}, claimed=false, answers=[];
    const isHost=()=> !!(sess&&sess.host_id===myId());
    const remaining=()=> (sess&&sess.deadline)? Math.max(0,Math.round((new Date(sess.deadline).getTime()-Date.now())/1000)) : 0;
    function cleanup(){ if(tick){clearInterval(tick);tick=null;} [chan1,chan2].forEach(c=>{ if(c){try{client.removeChannel(c);}catch(e){}} }); chan1=chan2=null; }
    p.querySelector('.phBack').onclick=()=>{ cleanup(); menu(); };
    async function fetchAnswers(){ if(!sess||sess.q_index<0){answers=[];return;} try{ const {data}=await client.from('quiz_live_answers').select('name,choice,correct,player_id').eq('group_id',gid).eq('q_index',sess.q_index); answers=data||[]; }catch(e){answers=[];} }
    async function reload(){ try{ const {data}=await client.from('quiz_live').select('*').eq('group_id',gid).maybeSingle(); sess=data; }catch(e){sess=null;} await fetchAnswers(); render(true); }
    function render(force){
      const key=sess?sess.phase+':'+sess.q_index:'none';
      if(!force && key===lastKey && sess && sess.phase==='question'){ updateTimer(); return; }
      lastKey=key;
      if(!sess) return renderStart('');
      if(sess.phase==='ended') return renderEnd();
      if(sess.phase==='lobby') return renderLobby();
      if(sess.phase==='question') return renderQuestion();
      if(sess.phase==='reveal') return renderReveal();
    }
    function updateTimer(){ const t=document.getElementById('qlTimer'); if(t)t.textContent=remaining()+'s'; if(isHost()&&sess&&sess.phase==='question'&&remaining()<=0){ client.rpc('quiz_live_reveal'); } }
    function renderStart(msg){ lastKey='start';
      body.innerHTML=`${msg?`<p class="phNote">${esc(msg)}</p>`:''}<p class="phQ">Live quizshow 🎬</p><p class="phNote">Iedereen die deze pagina open heeft krijgt dezelfde vragen tegelijk, met afteltimer. Eén persoon start als host.</p>`;
      const f=el('<div class="phField"><span>Aantal vragen:</span><input id="qlN" type="number" min="3" max="20" value="8" style="max-width:80px"></div>');
      const start=el('<button class="phBtn coral">Start quizshow als host</button>');
      start.onclick=async()=>{ start.disabled=true; const n=Math.max(3,Math.min(20,parseInt((document.getElementById('qlN')||{}).value)||8)); try{ await client.rpc('quiz_live_start',{p_total:n}); }catch(e){ toast('Starten lukte niet'); start.disabled=false; return; } await reload(); };
      body.appendChild(f); body.appendChild(start);
    }
    function renderLobby(){
      body.innerHTML=`<p class="phQ">Lobby</p><p class="phNote">Host: <b>${esc(sess.host_name||'?')}</b> · ${sess.q_total} vragen. Iedereen die meedoet, opent dit scherm.</p>`;
      if(isHost()){ const b=el('<button class="phBtn coral">Begin de quiz ›</button>'); b.onclick=()=>client.rpc('quiz_live_next',{p_seconds:20}); body.appendChild(b); }
      else body.appendChild(el('<p class="phNote">⏳ Wachten tot de host begint…</p>'));
    }
    function renderQuestion(){
      const answered=myPick.q===sess.q_index;
      body.innerHTML=`<div class="phBar"><span class="phNote">Vraag ${sess.q_index+1} / ${sess.q_total}</span><span class="phTimer" id="qlTimer">${remaining()}s</span></div><p class="phQ">${esc(sess.question)}</p>`;
      const opts=el('<div></div>');
      (sess.options||[]).forEach((txt,idx)=>{ const b=el(`<button class="phOpt">${esc(txt)}</button>`);
        if(answered){ b.disabled=true; if(idx===myPick.c)b.classList.add('good'); }
        b.onclick=async()=>{ myPick={q:sess.q_index,c:idx}; opts.querySelectorAll('.phOpt').forEach(x=>x.disabled=true); b.classList.add('good'); try{ await client.rpc('quiz_live_answer',{p_choice:idx}); }catch(e){} await fetchAnswers(); showCount(); };
        opts.appendChild(b); });
      body.appendChild(opts);
      body.appendChild(el(`<p class="phWho" id="qlCount">${answers.length} hebben geantwoord</p>`));
      if(isHost()){ const r=el('<button class="phBtn alt" style="margin-top:8px">Toon antwoord nu ›</button>'); r.onclick=()=>client.rpc('quiz_live_reveal'); body.appendChild(r); }
    }
    function showCount(){ const c=document.getElementById('qlCount'); if(c)c.textContent=`${answers.length} hebben geantwoord`; }
    function renderReveal(){
      const ci=sess.revealed_answer;
      body.innerHTML=`<p class="phNote">Vraag ${sess.q_index+1} / ${sess.q_total} · antwoord</p><p class="phQ">${esc(sess.question)}</p>`;
      const opts=el('<div></div>');
      (sess.options||[]).forEach((txt,idx)=>{ const b=el(`<button class="phOpt" disabled>${esc(txt)}</button>`); if(idx===ci)b.classList.add('good'); if(myPick.q===sess.q_index&&myPick.c===idx&&idx!==ci)b.classList.add('bad'); opts.appendChild(b); });
      body.appendChild(opts);
      const good=answers.filter(a=>a.correct).map(a=>a.name||'speler');
      body.appendChild(el(`<p class="phWho">Goed beantwoord door: ${good.length?esc(good.join(', ')):'niemand'}</p>`));
      if(isHost()){ const last=(sess.q_index+1)>=sess.q_total; const b=el(`<button class="phBtn coral" style="margin-top:8px">${last?'Toon einduitslag 🏁':'Volgende vraag ›'}</button>`); b.onclick=()=> last? client.rpc('quiz_live_finish') : client.rpc('quiz_live_next',{p_seconds:20}); body.appendChild(b); }
      else body.appendChild(el('<p class="phNote">⏳ Wachten op de host…</p>'));
    }
    async function renderEnd(){
      let rows=[]; try{ const {data}=await client.from('quiz_live_answers').select('name,correct,player_id').eq('group_id',gid); rows=data||[]; }catch(e){}
      const tally={}; rows.forEach(r=>{ if(!tally[r.player_id])tally[r.player_id]={name:r.name,correct:0}; if(r.correct)tally[r.player_id].correct++; });
      const list=Object.entries(tally).map(([pid,v])=>({pid,name:v.name,correct:v.correct})).sort((a,b)=>b.correct-a.correct);
      if(!claimed){ claimed=true; try{ await client.rpc('quiz_live_claim'); refreshProgressPanel(); }catch(e){} }
      body.innerHTML = list.length? `<p class="phBig phCenter">🏁 Einduitslag</p><div>${list.map(x=>`<div class="phLead ${x.pid===myId()?'me':''}"><span>${esc(x.name||'speler')}</span><span>${x.correct} goed · ${x.correct*10} ptn</span></div>`).join('')}</div><p class="phNote phCenter">Je beste quizronde telt mee voor de familiescore.</p>` : '<p class="phNote">Nog geen quizshow gespeeld. Start er een!</p>';
      const again=el('<button class="phBtn coral" style="margin-top:12px">Nieuwe quizshow 🎬</button>'); again.onclick=()=>{ claimed=false; renderStart('Start een nieuwe ronde.'); };
      body.appendChild(again);
    }
    chan1=client.channel('ql-'+gid).on('postgres_changes',{event:'*',schema:'public',table:'quiz_live',filter:`group_id=eq.${gid}`}, async(pl)=>{ sess=pl.new; myPick={q:-1,c:-1}; await fetchAnswers(); render(true); }).subscribe();
    chan2=client.channel('qla-'+gid).on('postgres_changes',{event:'*',schema:'public',table:'quiz_live_answers',filter:`group_id=eq.${gid}`}, async()=>{ await fetchAnswers(); if(sess&&sess.phase==='question')showCount(); else render(true); }).subscribe();
    tick=setInterval(()=>{ if(sess&&sess.phase==='question')updateTimer(); },1000);
    body.innerHTML='<p class="phNote">Laden…</p>'; reload();
  }

  /* ---------- mount ---------- */
  function mount(){
    const games=document.getElementById('games'); if(!games||document.getElementById('phRoot'))return;
    const grid=document.getElementById('gameGrid'); if(grid)grid.style.display='none';
    games.querySelectorAll(':scope > .card').forEach(c=>{ if(!c.classList.contains('scoreCard'))c.style.display='none'; });
    const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
    root=document.createElement('div'); root.id='phRoot'; root.className='phRoot'; view=document.createElement('div');
    root.appendChild(el('<div class="phBar"><h3>🎮 Speel nu</h3><span class="phNote">herspeelbaar · beste telt · live</span></div>'));
    root.appendChild(view);
    const hub=document.getElementById('liveHub'); if(hub&&hub.parentNode)hub.insertAdjacentElement('afterend',root); else games.appendChild(root);
    menu();
    try{ const of=window.toggleFav; if(of && !of.__wrapped){ const w=function(i){ of(i); setTimeout(syncFavs,60); }; w.__wrapped=true; window.toggleFav=w; } }catch(e){}
    setTimeout(()=>{ if(isJoined()) syncFavs(); },1800);
    let tries=0; const iv=setInterval(()=>{ tries++; if(isJoined()){ ensureProgSub(); refreshProgressPanel(); } if(tries>40)clearInterval(iv); },1500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,300)); else setTimeout(mount,300);
})();
