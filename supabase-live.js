(() => {
  const cfg = window.ANNECY_SUPABASE || {};
  const configured = cfg.url && cfg.publishableKey && !cfg.url.includes('YOUR-PROJECT') && !cfg.publishableKey.includes('YOUR_KEY');
  const state = { client:null, user:null, player:null, group:null, channel:null, players:[], isAdmin:false, locked:false, playingAs:null, playingAsName:null };
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const setMessage = (text, ok=false) => { const e=$('liveMessage'); if(e){e.textContent=text;e.className='liveStatus '+(ok?'liveOk':'liveError');} };
  const setConnection = text => { const e=$('liveConnection'); if(e)e.textContent=text; };

  async function ensureAuth(){
    const { data:{ session } } = await state.client.auth.getSession();
    if(session){ state.user=session.user; return; }
    const { data, error } = await state.client.auth.signInAnonymously();
    if(error) throw error;
    state.user=data.user;
  }

  async function loadMembership(){
    await ensureAuth();
    const { data, error } = await state.client.rpc('get_my_game_membership');
    if(error) throw error;
    const row=Array.isArray(data)?data[0]:data;
    if(row?.player_id){ state.player={id:row.player_id,display_name:row.display_name,score:row.score}; state.group={id:row.group_id,name:row.group_name,join_code:row.join_code}; await activateLive(); }
    else showJoin();
  }

  window.joinLiveGames = async function(takeover){
    if(!configured){ setMessage('Supabase is nog niet gekoppeld. Volg SUPABASE_SETUP.md.'); return; }
    const name=$('livePlayerName')?.value.trim(); const code=$('liveGroupCode')?.value.replace(/\s+/g,'').toUpperCase();
    if(!name || !code){setMessage('Vul je naam en familiecode in.');return;}
    try{
      setMessage(takeover?'Bezig met overnemen…':'Bezig met deelnemen…',true); await ensureAuth();
      const {data,error}=await state.client.rpc('join_game_group',{p_code:code,p_display_name:name,p_takeover:!!takeover});
      if(error) throw error;
      const row=Array.isArray(data)?data[0]:data;
      state.player={id:row.player_id,display_name:row.display_name,score:row.score}; state.group={id:row.group_id,name:row.group_name,join_code:row.join_code};
      await activateLive();
    }catch(err){
      console.error(err);
      if(err.message && /in gebruik/.test(err.message)){
        const e=$('liveMessage');
        if(e){ e.className='liveStatus liveError';
          e.innerHTML='Die naam is al actief op een ander apparaat.<br><button type="button" onclick="joinLiveGames(true)" style="margin-top:8px;background:#0f91a3;color:#fff;border:none;border-radius:10px;padding:9px 14px;font-weight:800;cursor:pointer">Dit ben ik — overnemen op dit apparaat</button><div style="font-size:12px;color:#6b8794;margin-top:6px">Je punten en voortgang gaan mee. Het oude apparaat wordt uitgelogd.</div>';
        }
      } else setMessage(err.message && /Ongeldige|naam|aangemeld/.test(err.message) ? err.message : 'Deelnemen lukte niet. Controleer de code en de internetverbinding.');
    }
  };

  window.leaveLiveGames = async function(){
    if(!confirm('Deze familiegroep op dit apparaat verlaten?')) return;
    try{ if(state.channel) await state.client.removeChannel(state.channel); await state.client.auth.signOut(); }catch(e){console.warn(e)}
    state.user=state.player=state.group=null; state.players=[]; showJoin(); renderLiveScores();
  };

  async function activateLive(){
    $('liveJoinPanel')?.classList.add('liveHidden'); $('liveIdentityPanel')?.classList.remove('liveHidden');
    if($('liveGroupName')) $('liveGroupName').textContent=state.group.name;
    if($('livePlayerLabel')) $('livePlayerLabel').textContent=`Ingelogd als ${state.player.display_name} · code ${state.group.join_code}`;
    $('offlineScoreControls')?.classList.add('liveHidden');
    try{ const r=await state.client.rpc('my_group_flags'); const row=Array.isArray(r.data)?r.data[0]:r.data; state.isAdmin=!!(row&&row.is_admin); state.locked=!!(row&&row.locked); }catch(e){ state.isAdmin=false; state.locked=false; }
    await refreshPlayers(); subscribe(); setConnection('Live verbonden');
  }
  function showJoin(){
    $('liveJoinPanel')?.classList.remove('liveHidden'); $('liveIdentityPanel')?.classList.add('liveHidden'); $('offlineScoreControls')?.classList.toggle('liveHidden',configured);
    if(!configured) setMessage('Demo-modus: scores blijven lokaal totdat Supabase is gekoppeld.');
  }
  async function refreshPlayers(){
    if(!state.group) return;
    const {data,error}=await state.client.from('game_players').select('id,display_name,score,updated_at,active').eq('group_id',state.group.id).order('active',{ascending:false}).order('score',{ascending:false}).order('display_name');
    if(error){console.error(error);setConnection('Verbinding fout');return;}
    state.players=data||[]; renderLiveScores();
  }
  function subscribe(){
    if(state.channel) state.client.removeChannel(state.channel);
    state.channel=state.client.channel(`group-${state.group.id}`).on('postgres_changes',{event:'*',schema:'public',table:'game_players',filter:`group_id=eq.${state.group.id}`},refreshPlayers).subscribe(status=>setConnection(status==='SUBSCRIBED'?'Live verbonden':'Verbinden…'));
  }
  function renderLiveScores(){
    if(!state.group){ if(typeof window.renderFamilyScores==='function') window.renderFamilyScores(); return; }
    const h=$('familyScores'); if(!h)return;
    const admin=!!state.isAdmin;
    const canEdit=admin && !state.locked;
    const chip='padding:6px 11px;border-radius:999px;border:1px solid #d5e0dd;font-size:13px;cursor:pointer;font-weight:700';
    const guests=state.players.filter(p=>!p.active);
    let bar='';
    if(admin && guests.length && !state.locked){
      bar='<div style="background:#eef4f4;border-radius:12px;padding:10px;margin-bottom:12px">'
        +'<div style="font-weight:800;font-size:13px;color:#0d3550;margin-bottom:6px">📱 Wie speelt er nu op deze telefoon? <span style="font-weight:600;color:#6b8794">(alleen beheerder)</span></div>'
        +'<div style="display:flex;flex-wrap:wrap;gap:6px">'
        +'<button onclick="AnnecySetPlayAs(\'\')" style="'+chip+';'+(!state.playingAs?'background:#0f91a3;color:#fff':'background:#fff;color:#0d3550')+'">🙋 '+esc(state.player.display_name)+' (jij)</button>'
        +guests.map(g=>'<button onclick="AnnecySetPlayAs(\''+g.id+'\')" style="'+chip+';'+(state.playingAs===g.id?'background:#ff6f68;color:#fff':'background:#fff;color:#0d3550')+'">'+esc(g.display_name)+'</button>').join('')
        +'</div>'
        +(state.playingAs?'<div style="margin-top:7px;font-size:12.5px;color:#e0554d;font-weight:800">▶ Je speelt nu als '+esc(state.playingAsName)+'. Elk spel dat je nu speelt telt voor '+esc(state.playingAsName)+'. Tik je eigen naam om terug te wisselen.</div>':'')
        +'</div>';
    }
    const rows=state.players.map((p,i)=>{
      const ctrl = canEdit ? `<button onclick="scorePlayer('${p.id}',-1)">−</button><button onclick="scorePlayer('${p.id}',1)">+</button><input class="qsIn" type="number" inputmode="numeric" placeholder="±" data-pid="${p.id}" style="width:50px;margin-left:6px"><button onclick="quickScore(this)">OK</button>` : '';
      return `<div class="scoreRow ${p.id===state.player.id?'me':''}"><b>${i+1}. <span style="color:${p.active?'#37b26b':'#c7d2cf'}">●</span> <span onclick="AnnecyPlayerGames('${p.id}')" style="cursor:pointer;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:2px">${esc(p.display_name)}</span>${p.id===state.player.id?' · jij':''}${p.active?'':' <span style="font-weight:400;color:#9aa8a4;font-size:11px">(nog niet ingelogd)</span>'}</b><span>${p.score}</span>${ctrl}</div>`;
    }).join('')||'<p class="small">Nog geen spelers.</p>';
    const lockBanner = state.locked ? '<div style="background:#fff4d6;border:1px solid #f0d98a;border-radius:12px;padding:10px 12px;margin-bottom:12px;font-weight:800;color:#8a6d1a">🔒 De vakantiescore is definitief gemaakt. Er kunnen geen punten meer bij.</div>' : '';
    h.innerHTML=lockBanner+bar+rows;
    if(admin){
      if(!state.locked){
        h.insertAdjacentHTML('beforeend','<button class="secondaryBtn" style="margin-top:8px" onclick="addManualPlayer()">+ Speler toevoegen (zonder telefoon)</button>');
        h.insertAdjacentHTML('beforeend','<button class="secondaryBtn" style="margin-top:8px;background:#ffece0;color:#c0392b;font-weight:800" onclick="AnnecyLockScores(true)">🔒 Score definitief maken (einde vakantie)</button>');
      } else {
        h.insertAdjacentHTML('beforeend','<button class="secondaryBtn" style="margin-top:8px" onclick="AnnecyLockScores(false)">🔓 Weer openstellen (ontgrendelen)</button>');
      }
    } else {
      h.insertAdjacentHTML('beforeend','<p class="small" style="margin-top:8px;color:#9aa8a4">'+(state.locked?'De vakantiescore is definitief gemaakt door de beheerder.':'De beheerder beheert de handmatige scores. Jouw spelpunten tellen automatisch mee.')+'</p>');
    }
    h.insertAdjacentHTML('beforeend','<p class="small" style="margin-top:6px;color:#9aa8a4">Tip: tik op een naam om te zien welke spellen die persoon heeft gespeeld.</p>');
  }
  window.changeLiveScore = async function(delta,reason='spel'){
    if(!state.player){setMessage('Doe eerst mee met de familiegroep.');return false;}
    const {error}=await state.client.rpc('change_my_game_score',{p_delta:delta,p_reason:reason});
    if(error){console.error(error);setConnection('Score niet opgeslagen');return false;} await refreshPlayers(); return true;
  };

  // Bestaande spellen koppelen aan de live score, met lokale fallback.
  window.scorePlayer=async function(pid,delta){ if(!state.client)return; const {error}=await state.client.rpc('award_points',{p_player_id:pid,p_points:delta,p_reason:'handmatig'}); if(error){console.error(error);setConnection('Score niet opgeslagen');} else await refreshPlayers(); };
  window.quickScore=async function(btn){ const inp=btn&&btn.previousElementSibling; if(!inp)return; const n=parseInt(inp.value,10); if(!n){return;} const pid=inp.getAttribute('data-pid'); inp.value=''; if(!pid||!state.client)return; const {error}=await state.client.rpc('award_points',{p_player_id:pid,p_points:Math.max(-100,Math.min(100,n)),p_reason:'handmatig'}); if(error){console.error(error);} else await refreshPlayers(); };
  window.addManualPlayer=async function(){ const name=prompt('Naam van de speler (bijv. een kind zonder telefoon):'); if(!name||!name.trim())return; const {error}=await state.client.rpc('add_manual_player',{p_name:name.trim()}); if(error){alert(error.message||'Toevoegen lukte niet');return;} await refreshPlayers(); };
  window.AnnecySetPlayAs=function(id){ if(!id){ state.playingAs=null; state.playingAsName=null; renderLiveScores(); return; } const p=state.players.find(x=>x.id===id); if(!p)return; state.playingAs=id; state.playingAsName=p.display_name; renderLiveScores(); };
  window.AnnecyPlayerGames=async function(pid){
    const p=state.players.find(x=>x.id===pid); if(!p||!state.client||!state.group)return;
    let rows=[]; try{ const {data}=await state.client.from('game_progress').select('game_key,state').eq('group_id',state.group.id).eq('player_id',pid); rows=data||[]; }catch(e){}
    const LABELS={quiz:'🧠 Familiequiz',bingo:'🗺️ Vakantiebingo',yahtzee:'🎲 Yahtzee',music:'🎵 Hitster',speurtocht:'🔍 Speurtocht',woordrace:'🔤 Woordrace',snake:'🐍 Snake',patience:'🃏 Patience',memory:'🧠 Memory',tetris:'🟦 Tetris',top10:'⭐ Mijn top 10',favs:'❤️ Favorieten',vrijetijd:'🛋️ Vrije tijd'};
    const scored=rows.filter(r=>r.state && r.state.best!=null && Number(r.state.best)>0);
    const inner = scored.length ? scored.map(r=>'<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eef2f1"><span>'+(LABELS[r.game_key]||r.game_key)+'</span><b>'+Number(r.state.best)+'</b></div>').join('') : '<p class="small">Nog geen spellen met een score gespeeld.</p>';
    let ov=document.getElementById('pgOverlay'); if(ov) ov.remove();
    ov=document.createElement('div'); ov.id='pgOverlay';
    ov.style.cssText='position:fixed;inset:0;background:rgba(6,26,40,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:18px';
    ov.innerHTML='<div style="background:#fff;border-radius:18px;max-width:420px;width:100%;padding:18px;box-shadow:0 20px 50px rgba(0,0,0,.35)"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:10px"><h3 style="margin:0;color:#0d3550;font-size:18px">'+esc(p.display_name)+' — gespeelde spellen</h3><button id="pgClose" style="border:none;background:#eef4f4;border-radius:10px;padding:6px 11px;cursor:pointer;font-weight:800">✕</button></div><p class="small" style="margin:0 0 8px;color:#697983">Beste ruwe score per spel. Familiepunten komen uit de ranking (1e=10, 2e=8, 3e=5, rest=1).</p>'+inner+'<div style="margin-top:12px;text-align:right;font-weight:800;color:#0f91a3">Familiescore: '+p.score+'</div></div>';
    ov.onclick=function(e){ if(e.target===ov) ov.remove(); };
    document.body.appendChild(ov);
    var cb=document.getElementById('pgClose'); if(cb) cb.onclick=function(){ ov.remove(); };
  };
  window.AnnecyLockScores=async function(lock){
    if(!state.isAdmin) return;
    if(lock && !confirm('Score definitief maken? Daarna kunnen er geen punten meer bij. Jij kunt het later weer openstellen.')) return;
    try{ const r=await state.client.rpc('set_group_locked',{p_locked:!!lock}); state.locked=!!(r&&r.data); }catch(e){ alert('Lukte niet'); return; }
    renderLiveScores();
  };
  const originalToggleBingo=window.toggleBingo;
  window.toggleBingo=async function(i){
    const before=getList('bingo').includes(i); originalToggleBingo(i);
    if(state.player) await window.changeLiveScore(before?-1:1,`bingo:${i}`);
  };
  const originalAddScore=window.addScore;
  window.addScore=async function(){
    if(state.player){ await window.changeLiveScore(1,'hitster'); const e=$('score'); if(e)e.textContent=String((Number(e.textContent)||0)+1); }
    else originalAddScore();
  };

  // Maak van iedere instructiekaart een uitvoerbaar spel met een puntenknop.
  const originalRenderGames=window.renderGames;
  function enhanceGameCards(){
    document.querySelectorAll('#gameGrid .gameCard').forEach((card,i)=>{
      if(card.querySelector('.gameActions')) return;
      const actions=document.createElement('div');actions.className='gameActions';
      const start=document.createElement('button');start.textContent='Start spel';start.onclick=()=>{card.scrollIntoView({behavior:'smooth',block:'center'});card.classList.toggle('activeGame');};
      const complete=document.createElement('button');complete.className='primary';complete.textContent='Ronde voltooid +1';complete.onclick=async()=>{const ok=state.player?await window.changeLiveScore(1,`game:${i}`):false;if(!state.player)alert('Doe eerst mee met de familiegroep om live punten te verdienen.');else if(ok)complete.textContent='Punt opgeslagen ✓';setTimeout(()=>complete.textContent='Ronde voltooid +1',1400);};
      actions.append(start,complete);card.append(actions);
    });
  }
  const observer=new MutationObserver(enhanceGameCards); const grid=$('gameGrid'); if(grid)observer.observe(grid,{childList:true}); enhanceGameCards();

  // Publieke API voor de spellenmodule: gedeelde voortgang binnen de groep.
  window.AnnecyLive = {
    isJoined(){ return !!state.player; },
    get isAdmin(){ return !!state.isAdmin; },
    get player(){ return state.player; },
    effectiveName(){ return state.playingAs ? state.playingAsName : (state.player&&state.player.display_name)||''; },
    isKid(){ const n=(state.playingAs?state.playingAsName:(state.player&&state.player.display_name)||'').trim().toLowerCase(); return ['merle','duuk','linn'].includes(n); },
    get group(){ return state.group; },
    get client(){ return state.client; },
    async loadPlayers(){ if(!state.client||!state.group) return []; try{ const { data }=await state.client.from('game_players').select('id,display_name,score').eq('group_id',state.group.id).order('display_name'); return data||[]; }catch(e){ return []; } },
    async awardPoints(playerId, points, reason){ if(!state.client) return null; const { data, error }=await state.client.rpc('award_points',{ p_player_id:playerId, p_points:Math.round(points||0), p_reason:reason||'spel' }); if(error){ console.error('awardPoints',error); return null; } return data; },
    async saveProgress(gameKey, patch){
      if(!state.client || !state.player || !state.group) return false;
      let existing=null;
      try{ const r=await state.client.from('game_progress').select('state').eq('player_id',state.player.id).eq('game_key',gameKey).maybeSingle(); existing=r.data; }catch(e){}
      const merged=Object.assign({}, (existing&&existing.state)||{}, patch, {name:state.player.display_name});
      const { error }=await state.client.from('game_progress').upsert(
        { player_id:state.player.id, group_id:state.group.id, game_key:gameKey, state:merged, updated_at:new Date().toISOString() },
        { onConflict:'player_id,game_key' });
      if(error){ console.error('saveProgress',error); return false; }
      return true;
    },
    async recordResult(gameKey, points, stateObj){
      if(!state.client || !state.player) return null;
      if(state.playingAs){
        const r=await state.client.rpc('record_result_for',{ p_player_id:state.playingAs, p_game_key:gameKey, p_points:Math.round(points||0), p_state:Object.assign({}, stateObj||{}, {name:state.playingAsName}) });
        if(r.error){ console.error('record_result_for',r.error); return null; }
        try{ refreshPlayers(); }catch(e){}
        return r.data;
      }
      const { data, error }=await state.client.rpc('record_game_result',{ p_game_key:gameKey, p_points:Math.round(points||0), p_state:Object.assign({}, stateObj||{}, {name:state.player.display_name}) });
      if(error){ console.error('recordResult',error); return null; }
      try{ refreshPlayers(); }catch(e){}
      return data;
    },
    async loadGroupProgress(){
      if(!state.client || !state.group) return [];
      const { data, error }=await state.client.from('game_progress').select('player_id,game_key,state,updated_at').eq('group_id',state.group.id);
      if(error){ console.error('loadGroupProgress',error); return []; }
      return data||[];
    },
    onGroupProgress(cb){
      if(!state.client || !state.group) return null;
      return state.client.channel('progress-'+state.group.id)
        .on('postgres_changes',{event:'*',schema:'public',table:'game_progress',filter:`group_id=eq.${state.group.id}`}, cb)
        .subscribe();
    }
  };

  async function init(){
    if(!configured || !window.supabase){showJoin();return;}
    state.client=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    try{await loadMembership();}catch(err){console.error(err);setMessage('Live omgeving kon niet laden. Controleer de Supabase-inrichting.');showJoin();}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
