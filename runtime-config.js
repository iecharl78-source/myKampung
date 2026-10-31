import { isIP } from 'node:net';

export function runtimeConfig(env=process.env) {
  let publicOrigin='';
  if(env.PUBLIC_ORIGIN) {
    const value=new URL(env.PUBLIC_ORIGIN);
    if(value.protocol!=='https:' || value.username || value.password || value.pathname!=='/' || value.search || value.hash) throw Error('PUBLIC_ORIGIN mesti alamat asal HTTPS sahaja, contohnya https://kampung.example.com');
    publicOrigin=value.origin;
  }
  const secureCookie=env.COOKIE_SECURE==='1';
  if(env.NODE_ENV==='production' && (!publicOrigin || !secureCookie)) throw Error('Production memerlukan PUBLIC_ORIGIN HTTPS dan COOKIE_SECURE=1.');
  return {publicOrigin,secureCookie,trustProxy:env.TRUST_PROXY==='1'};
}
export function clientAddress(req,config) {
  const supplied=req.headers['x-real-ip'];
  if(config.trustProxy && typeof supplied==='string' && isIP(supplied)) return supplied;
  return req.socket.remoteAddress;
}
