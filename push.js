// 3nD Basketball: result notifications (Web Push). Runs on the server only.
// Phones accept a notification only if it is encrypted for that one device (RFC 8291) and signed by this
// server's own key (VAPID, RFC 8292). Both are done here with the built-in crypto, no library.
const b64u=buf=>{let s='';for(const x of new Uint8Array(buf))s+=String.fromCharCode(x);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
const ub64=str=>{let s=String(str).replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const bin=atob(s);const a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return a;};
const cat=(...xs)=>{const o=new Uint8Array(xs.reduce((n,x)=>n+x.length,0));let i=0;for(const x of xs){o.set(x,i);i+=x.length;}return o;};
const utf8=s=>new TextEncoder().encode(s);
async function hkdf(salt,ikm,info,len){const k=await crypto.subtle.importKey('raw',ikm,'HKDF',false,['deriveBits']);return new Uint8Array(await crypto.subtle.deriveBits({name:'HKDF',hash:'SHA-256',salt,info},k,len*8));}

// Encrypt one message for one device. `fixed` is only for checking against the published test values.
async function pushEncrypt(plain,p256dh,auth,fixed){
  const ua=ub64(p256dh),authSecret=ub64(auth);
  const uaKey=await crypto.subtle.importKey('raw',ua,{name:'ECDH',namedCurve:'P-256'},false,[]);
  let asPriv,asPub;
  if(fixed){asPriv=await crypto.subtle.importKey('jwk',fixed.jwk,{name:'ECDH',namedCurve:'P-256'},false,['deriveBits']);asPub=fixed.pub;}
  else{const kp=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']);asPriv=kp.privateKey;asPub=new Uint8Array(await crypto.subtle.exportKey('raw',kp.publicKey));}
  const ecdh=new Uint8Array(await crypto.subtle.deriveBits({name:'ECDH',public:uaKey},asPriv,256));
  const ikm=await hkdf(authSecret,ecdh,cat(utf8('WebPush: info\0'),ua,asPub),32);
  const salt=fixed?fixed.salt:crypto.getRandomValues(new Uint8Array(16));
  const cek=await hkdf(salt,ikm,utf8('Content-Encoding: aes128gcm\0'),16);
  const nonce=await hkdf(salt,ikm,utf8('Content-Encoding: nonce\0'),12);
  const key=await crypto.subtle.importKey('raw',cek,'AES-GCM',false,['encrypt']);
  const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce},key,cat(utf8(plain),new Uint8Array([2]))));
  return cat(salt,new Uint8Array([0,0,16,0,asPub.length]),asPub,ct);
}
// this server's signing key: made once, kept in the database
async function newVapid(){
  const kp=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
  const jwk=await crypto.subtle.exportKey('jwk',kp.privateKey);
  return {jwk:{kty:jwk.kty,crv:jwk.crv,x:jwk.x,y:jwk.y,d:jwk.d},pub:b64u(await crypto.subtle.exportKey('raw',kp.publicKey))};
}
async function vapidHeader(endpoint,vapid,nowMs){
  const head=b64u(utf8(JSON.stringify({typ:'JWT',alg:'ES256'})));
  const body=b64u(utf8(JSON.stringify({aud:new URL(endpoint).origin,exp:Math.floor((nowMs||Date.now())/1000)+12*3600,sub:'https://chamitro.github.io/3nD-Basketball/'})));
  const key=await crypto.subtle.importKey('jwk',vapid.jwk,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
  const sig=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,utf8(head+'.'+body));
  return 'vapid t='+head+'.'+body+'.'+b64u(sig)+', k='+vapid.pub;
}
// Notifications may only be sent to the real notification services of the browser makers, never to an address a visitor made up.
const PUSH_HOSTS=['fcm.googleapis.com','.push.services.mozilla.com','.notify.windows.com','.push.apple.com'];
function pushHostOk(endpoint){
  try{const u=new URL(endpoint);if(u.protocol!=='https:')return false;return PUSH_HOSTS.some(h=>h[0]==='.'?u.hostname.endsWith(h):u.hostname===h);}catch(e){return false;}
}
// returns the HTTP status of the notification service (201 = accepted, 404/410 = this device is gone), 0 = no answer
async function sendPush(sub,payload,vapid){
  const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),6000);
  try{
    const body=await pushEncrypt(JSON.stringify(payload),sub.p256dh,sub.auth);
    const r=await fetch(sub.endpoint,{method:'POST',signal:ctl.signal,body,
      headers:{'Content-Encoding':'aes128gcm','Content-Type':'application/octet-stream',TTL:'86400',Urgency:'normal',Authorization:await vapidHeader(sub.endpoint,vapid)}});
    return r.status;
  }catch(e){return 0;}
  finally{clearTimeout(timer);}
}
