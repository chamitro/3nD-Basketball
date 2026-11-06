// 3nD Basketball: the real database behind the online league (Supabase tables, reached over its REST interface).
function restStore(base,keys,prefix){
  if(prefix===undefined)prefix='/rest/v1/';
  let ki=0;
  async function q(path,opt){
    opt=opt||{};
    for(let attempt=0;attempt<keys.length;attempt++){
      const key=keys[ki];
      const headers={apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'};
      if(opt.prefer)headers.Prefer=opt.prefer;
      const r=await fetch(base+prefix+path,{method:opt.method||'GET',headers,body:opt.body===undefined?undefined:JSON.stringify(opt.body)});
      if((r.status===401||r.status===403)&&keys.length>1&&attempt<keys.length-1){ki=(ki+1)%keys.length;continue;}
      const t=await r.text();
      if(!r.ok)throw new Error('database '+r.status+': '+t.slice(0,300));
      return t?JSON.parse(t):null;
    }
    throw new Error('database refused the server key');
  }
  const one=async path=>{const a=await q(path);return (a&&a[0])||null;};
  const TEAM='id,key_hash,name,name_lc,is_house,league_no,w,l,pf,pa,pts,next_opp,last_seen,ver,pub,data';
  const pages=async(path,size)=>{const out=[];for(let off=0;;off+=size){const a=await q(path+'&limit='+size+'&offset='+off);out.push(...a);if(a.length<size)break;}return out;};
  return {
    league:()=>one('b3_league?id=eq.1'),
    saveLeague:lg=>q('b3_league?on_conflict=id',{method:'POST',prefer:'resolution=merge-duplicates,return=minimal',body:lg}),
    house:()=>one('b3_teams?is_house=is.true&select='+TEAM+'&limit=1'),
    teamByKey:h=>one('b3_teams?key_hash=eq.'+h+'&select='+TEAM),
    teamById:id=>one('b3_teams?id=eq.'+id+'&select='+TEAM),
    teamsInPlay:()=>pages('b3_teams?or=(next_opp.not.is.null,is_house.is.true)&select='+TEAM+'&order=id',500),
    allTeams:()=>pages('b3_teams?is_house=is.false&select='+TEAM+'&order=id',500),
    tableRows:no=>pages('b3_teams?is_house=is.false&league_no=eq.'+(+no)+'&select=id,name,w,l,pf,pa,pts,pub&order=pts.desc,id',1000),   // the teams that entered league `no`
    // match reports: the matches of one match day; and the match day just before (dir -1) or after (dir 1) a given one, or the latest of all
    roundMatches:(L,M,limit)=>q('b3_matches?league_no=eq.'+(+L)+'&match_no=eq.'+(+M)+'&select=id,a,b,a_name,b_name,score_a,score_b,rule,detail&order=id&limit='+(+limit)),
    roundNear:(L,M,dir)=>one('b3_matches?select=league_no,match_no'+(L===null?'':'&or=(league_no.'+(dir<0?'lt':'gt')+'.'+(+L)+',and(league_no.eq.'+(+L)+',match_no.'+(dir<0?'lt':'gt')+'.'+(+M)+'))')
      +'&order=league_no.'+(dir<0?'desc':'asc')+',match_no.'+(dir<0?'desc':'asc')+'&limit=1'),
    insertTeam:async row=>(await q('b3_teams?select='+TEAM,{method:'POST',prefer:'return=representation',body:row}))[0],
    saveTeam:async row=>{
      const a=await q('b3_teams?id=eq.'+row.id+'&ver=eq.'+row.ver+'&select=id',{method:'PATCH',prefer:'return=representation',
        body:{last_seen:row.last_seen,data:row.data,ver:row.ver+1}});   // who meets whom is never written from here
      if(!a||!a.length)throw new Error('conflict');
      row.ver++;
    },
    // a team enters league `no`: from zero, together with whatever else changed on the way in
    enterLeague:async(row,no)=>{
      const a=await q('b3_teams?id=eq.'+row.id+'&ver=eq.'+row.ver+'&is_house=is.false&select=id',{method:'PATCH',prefer:'return=representation',
        body:{league_no:no,w:0,l:0,pf:0,pa:0,pts:0,last_seen:row.last_seen,data:row.data,ver:row.ver+1}});
      if(!a||!a.length)throw new Error('conflict');
      row.ver++;row.league_no=no;
    },
    // small settings kept by the server itself (table b3_config). If the table is missing these simply fail and the caller copes.
    config:async key=>{const row=await one('b3_config?key=eq.'+encodeURIComponent(key)+'&select=value');return row?row.value:null;},
    setConfig:(key,value)=>q('b3_config?on_conflict=key',{method:'POST',prefer:'resolution=ignore-duplicates,return=minimal',body:{key,value}}),
    attach:async(id,now)=>{
      try{await q('rpc/b3_attach',{method:'POST',body:{p_id:id,p_now:now}});}
      catch(e){if(String(e.message).includes('b3_busy'))throw new Error('conflict');throw e;}
    },
    nameTaken:async lc=>!!(await one('b3_teams?name_lc=eq.'+encodeURIComponent(lc)+'&select=id')),
    pool:h=>one('b3_pools?key_hash=eq.'+h+'&select=players,rerolls'),
    savePool:(h,p)=>q('b3_pools?on_conflict=key_hash',{method:'POST',prefer:'resolution=merge-duplicates,return=minimal',body:{key_hash:h,players:p.players,rerolls:p.rerolls}}),
    dropPool:h=>q('b3_pools?key_hash=eq.'+h,{method:'DELETE',prefer:'return=minimal'}),
    lock:async now=>{
      const a=await q('b3_league?id=eq.1&next_match_at=lte.'+now+'&or=(busy_until.is.null,busy_until.lt.'+now+')&select=id',
        {method:'PATCH',prefer:'return=representation',body:{busy_until:now+60000}});
      return !!(a&&a.length);
    },
    commit:({league,teams,matches,reset})=>q('rpc/b3_commit',{method:'POST',body:{
      p_league:league,
      p_teams:teams.map(t=>({id:t.id,w:t.w,l:t.l,pf:t.pf,pa:t.pa,pts:t.pts,league_no:t.league_no,next_opp:t.next_opp,pub:t.pub,data:t.data})),
      p_matches:matches,p_reset:!!reset}}),
  };
}
