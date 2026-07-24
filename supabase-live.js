(() => {
  const cfg = window.ANNECY_SUPABASE || {};
  const configured = cfg.url && cfg.publishableKey && !cfg.url.includes('YOUR-PROJECT') && !cfg.publishableKey.includes('YOUR_KEY');
  const state = { client:null, user:null, player:null, group:null, channel:null, players:[] };
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

  window.joinLiveGames = async function(){
    if(!configured){ setMessage('Supabase is nog niet gekoppeld. Volg SUPABASE_SETUP.md.'); return; }
    const name=$('livePlayerName')?.value.trim(); const code=$('liveGroupCode')?.value.replace(/\s+/g,'').toUpperCase();
    if(!name || !code){setMessage('Vul je naam en familiecode in.');return;}
    try{
      setMessage('Bezig met deelnemen…',true); await ensureAuth();
      const {data,error}=await state.client.rpc('join_game_group',{p_code:code,p_display_name:name});
      if(error) throw error;
      const row=Array.isArray(data)?data[0]:data;
      state.player={id:row.player_id,display_name:row.display_name,score:row.score}; state.group={id:row.group_id,name:row.group_name,join_code:row.join_code};
      await activateLive();
    }catch(err){console.error(err);setMessage(err.message && /Ongeldige|naam|aangemeld/.test(err.message) ? err.message : 'Deelnemen lukte niet. Controleer de code en de internetverbinding.');}
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
    h.innerHTML=state.players.map((p,i)=>`<div class="scoreRow ${p.id===state.player.id?'me':''}"><b>${i+1}. <span style="color:${p.active?'#37b26b':'#c7d2cf'}">●</span> ${esc(p.display_name)}${p.id===state.player.id?' · jij':''}${p.active?'':' <span style="font-weight:400;color:#9aa8a4;font-size:11px">(nog niet ingelogd)</span>'}</b><span>${p.score}</span><button onclick="scorePlayer('${p.id}',-1)">−</button><button onclick="scorePlayer('${p.id}',1)">+</button><input class="qsIn" type="number" inputmode="numeric" placeholder="±" data-pid="${p.id}" style="width:50px;margin-left:6px"><button onclick="quickScore(this)">OK</button></div>`).join('')||'<p class="small">Nog geen spelers.</p>';
    h.insertAdjacentHTML('beforeend','<button class="secondaryBtn" style="margin-top:8px" onclick="addManualPlayer()">+ Speler toevoegen (zonder telefoon)</button>');
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
    get player(){ return state.player; },
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
      const { data, error }=await state.client.rpc('record_game_result',{ p_game_key:gameKey, p_points:Math.round(points||0), p_state:Object.assign({}, stateObj||{}, {name:state.player.display_name}) });
      if(error){ console.error('recordResult',error); return null; }
      if(typeof state.__refreshPlayers==='function'){ try{ state.__refreshPlayers(); }catch(e){} }
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
