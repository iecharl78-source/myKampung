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
  // TRUST_PROXY=1: trusted reverse proxy (e.g. Caddy) that overwrites X-Real-IP.
  // TRUST_PROXY=passenger: cPanel/Passenger; use only Passenger's own "!~" client-address header,
  // which visitors cannot supply. Never trust X-Real-IP there: Apache passes it through unchanged.
  const proxyHeader={'1':'x-real-ip',passenger:'!~passenger-client-address'}[env.TRUST_PROXY]||'';
  return {publicOrigin,secureCookie,trustProxy:Boolean(proxyHeader),proxyHeader};
}
export function clientAddress(req,config) {
  const supplied=config.proxyHeader?req.headers[config.proxyHeader]:undefined;
  if(config.trustProxy && typeof supplied==='string' && isIP(supplied)) return supplied;
  return req.socket.remoteAddress;
}
