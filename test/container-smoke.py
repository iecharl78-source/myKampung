import os,secrets,subprocess,tempfile,time,socket,ssl,http.client,json
from pathlib import Path

root=Path(__file__).resolve().parents[1]
environment={k:v for k,v in os.environ.items() if k not in ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH']}
environment.update(DOMAIN='kampung.test',ACME_EMAIL='test@example.com')
docker=['docker','--host=unix:///var/run/docker.sock']
project='kampung-test-'+secrets.token_hex(4)
with tempfile.TemporaryDirectory(prefix='kampung-container-') as temporary:
    temp=Path(temporary)
    with socket.socket() as sock:sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
    caddy=temp/'Caddyfile'
    caddy.write_text('https://kampung.test {\n tls internal\n reverse_proxy app:3000 {\n header_up X-Real-IP {remote_host}\n }\n}\n')
    override=temp/'override.yaml'
    override.write_text(f'''services:
  app:
    environment:
      PUBLIC_ORIGIN: https://kampung.test:{port}
  web:
    ports: !override
      - "127.0.0.1:{port}:443"
    volumes:
      - {caddy}:/etc/caddy/Caddyfile:ro
''')
    compose=docker+['compose','-p',project,'-f',str(root/'compose.yaml'),'-f',str(override)]
    def run(args,extra=None):
        result=subprocess.run(args,cwd=root,env={**environment,**(extra or {})},capture_output=True,text=True)
        if result.returncode:
            logs=subprocess.run(compose+['logs','--tail=20','app','backup'],cwd=root,env=environment,capture_output=True,text=True)
            raise RuntimeError(result.stderr[-2000:]+result.stdout[-2000:]+logs.stdout[-2000:])
        return result.stdout.strip()
    password=secrets.token_hex(16)
    try:
        run(compose+['build','app'])
        run(compose+['run','--rm','--no-deps','-e','ADMIN_PASSWORD','app','node','scripts/bootstrap-admin.js'],{'ADMIN_PASSWORD':password})
        run(compose+['up','-d','--wait','--wait-timeout','90'])
        web=run(compose+['ps','-q','web']);app=run(compose+['ps','-q','app'])
        assert run(docker+['inspect','--format','{{len .HostConfig.PortBindings}}',app])=='0'
        assert run(docker+['exec',app,'id','-u'])=='1000'
        run(docker+['exec',web,'caddy','validate','--config','/etc/caddy/Caddyfile'])
        for attempt in range(20):
            result=subprocess.run(docker+['cp',web+':/data/caddy/pki/authorities/local/root.crt',str(temp/'root.crt')],capture_output=True,text=True,env=environment)
            if result.returncode==0:break
            time.sleep(.2)
        assert result.returncode==0,'Local test CA not available'
        context=ssl.create_default_context(cafile=str(temp/'root.crt'))
        def request(path,method='GET',data=None,cookie='',origin=None):
            sock=socket.create_connection(('127.0.0.1',port),timeout=10)
            conn=http.client.HTTPConnection('kampung.test',port);conn.sock=context.wrap_socket(sock,server_hostname='kampung.test')
            headers={'Host':f'kampung.test:{port}','Content-Type':'application/json','Cookie':cookie}
            if origin:headers['Origin']=origin
            conn.request(method,path,body=None if data is None else json.dumps(data),headers=headers)
            response=conn.getresponse();status=response.status;returned=dict(response.getheaders());payload=response.read();conn.close();return status,returned,payload
        health=request('/healthz');assert health[0]==200,(health[0],health[2][:300],run(compose+['logs','--tail=10','web']))
        status,headers,body=request('/api/login','POST',{'username':'admin','password':password},origin=f'https://kampung.test:{port}')
        assert status==200,(status,body)
        cookie=headers['Set-Cookie'].split(';')[0]
        assert 'Secure' in headers['Set-Cookie'] and 'HttpOnly' in headers['Set-Cookie']
        assert headers.get('Strict-Transport-Security')=='max-age=31536000'
        record={'name':'Ahli Ujian HTTPS','phone':'0123456789','address1':'Alamat ujian sahaja','household':[]}
        assert request('/api/members','POST',record,cookie,origin='https://other.example')[0]==403
        assert request('/api/members','POST',record,cookie,origin=f'https://kampung.test:{port}')[0]==201
        run(compose+['restart','app'])
        for attempt in range(30):
            try:
                if request('/healthz')[0]==200:break
            except Exception:pass
            time.sleep(.2)
        assert request('/api/session',cookie=cookie)[0]==401
        status,headers,body=request('/api/login','POST',{'username':'admin','password':password},origin=f'https://kampung.test:{port}');assert status==200
        cookie=headers['Set-Cookie'].split(';')[0]
        assert len(json.loads(request('/api/members',cookie=cookie)[2]))==1
        run(compose+['exec','-T','backup','node','scripts/backup-full.js'])
        run(compose+['exec','-T','backup','node','-e',"const {readdirSync}=require('node:fs');const {DatabaseSync}=require('node:sqlite');const p='/backups/'+readdirSync('/backups').filter(x=>x.endsWith('.sqlite')).sort().at(-1);const d=new DatabaseSync(p,{readOnly:true});if(d.prepare('select count(*) n from members').get().n!==1||d.prepare('select count(*) n from users').get().n!==1)process.exit(1);d.close();"])
        print('Container check passed: production Compose, private app port, non-root user, verified HTTPS with test CA, Secure/HttpOnly cookies, origin rejection, persistence after restart, full online backup including user accounts.',flush=True)
    finally:
        subprocess.run(compose+['down','-v','--remove-orphans'],cwd=root,env=environment,capture_output=True)
