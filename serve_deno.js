// 3nD Basketball: the server function itself. Answers one browser request at a time.
function serverKeys(){
  const keys=[];
  try{const j=Deno.env.get('SUPABASE_SECRET_KEYS');if(j){const o=JSON.parse(j);const v=o.default||Object.values(o)[0];if(v)keys.push(String(v));}}catch(_e){}
  const legacy=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');if(legacy)keys.push(legacy);
  return keys;
}
async function sha256hex(s){
  const b=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
  return [...b].map(x=>x.toString(16).padStart(2,'0')).join('');
}
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
const STORE=restStore(Deno.env.get('SUPABASE_URL'),serverKeys());
Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:CORS});
  let out;
  try{
    const body=await req.json();
    // where the request comes from, for one thing only: a new browser on the same connection is offered the same fourteen
    // players until one of them joins (14 Nov 2026), so nobody fishes for a better pool. Never stored, only hashed.
    if(body&&typeof body==='object')body._ip=String(req.headers.get('x-forwarded-for')||req.headers.get('cf-connecting-ip')||'').split(',')[0].trim();
    out=await handle(STORE,body,Date.now(),sha256hex);
  }catch(e){
    console.error(e);
    out={error:'The server had a problem: '+String(e&&e.message||e).slice(0,200)};
  }
  return new Response(JSON.stringify(out),{headers:{...CORS,'Content-Type':'application/json'}});
});
