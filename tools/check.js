const fs=require('fs'),path=require('path');
const netfetch=globalThis.fetch;
const ROOT=path.join(__dirname,'..');
const HOST=process.env.SITE||('http://localhost:'+(process.env.PORT||8080));
const RAW=require('./base');
const B=RAW?(String(RAW).startsWith('/')?String(RAW):'/'+String(RAW)).replace(/\/+$/g,''):'';
const url=u=>B&&!(u===B||u.startsWith(B+'/'))?B+u:u;
const pages=['/','/jogar/','/login/','/cadastro/','/roleta/','/bonus/','/termos/','/gerente/login/'];
const redirects={
  '/gerente':'/gerente/login','/gerente/comissoes':'/gerente/login','/gerente/criar-demo':'/gerente/login',
  '/gerente/indicados':'/gerente/login','/gerente/indicar':'/gerente/login','/gerente/meus-saques':'/gerente/login',
  '/gerente/notificacoes':'/gerente/login','/gerente/perfil':'/gerente/login'};
async function fetch(u,mode){try{
  const s=await netfetch(u,{redirect:mode||'manual',signal:AbortSignal.timeout(20000)});
  const b=Buffer.from(await s.arrayBuffer());
  return{code:s.status,loc:s.headers.get('location')||'',len:b.length,url:s.url||u,text:b.toString('utf8')};
}catch(e){return{code:0,loc:'',len:0,err:e.message,url:u,text:''};}}
function refs(dir){
  const set=new Set();
  const walk=d=>{for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);
    if(f.isDirectory()){if(['tools','orig'].includes(f.name))continue;walk(p);}
    else if(/\.(html|js|css|json|webmanifest)$/i.test(f.name)){
      let t;try{t=fs.readFileSync(p,'utf8')}catch(e){continue}
      const re=/(?:["'(=])((?:\/(?:_next|imagens|audio|video|fonts)\/|\/[a-z][a-z0-9\-\/]*\/)[^"'\s\\<>()]*?\.(?:html|js|css|png|jpe?g|webp|gif|svg|ico|bmp|avif|mp3|MP3|ogg|wav|m4a|mp4|webmanifest|webm|m3u8|woff2?|ttf|otf|json|txt|xml))/g;
      let m;while((m=re.exec(t)))set.add(m[1].split('?')[0]);
    }}};
  walk(dir);return [...set];
}
(async()=>{
  const bad=[];
  console.log('base path:',JSON.stringify(B));
  for(const r of pages){const x=await fetch(HOST+url(r));if(x.code!==200)bad.push([r,x.code]);console.log(x.code,r,x.len);}
  for(const r of Object.keys(redirects)){
    const want=B+redirects[r];
    const a=await fetch(HOST+url(r));
    let ok=a.code===307&&a.loc===want,detail=`${a.code} ${r} -> ${a.loc}`;
    if(!ok){ // GitHub Pages nao suporta 307: 301 de diretorio + stub com meta refresh
      const b=await fetch(HOST+url(r),'follow');
      if(b.code===200){
        if(/\/gerente\/login\/?$/.test(b.url)){ok=true;detail=`${b.code} ${r} -> ${b.url} (307 seguido)`;}
        else{
          const c=await fetch(b.url);
          if(c.code===200&&/login/.test(c.text)){ok=true;detail=`${b.code} ${r} -> stub ${b.url}`;}
          else detail=`${b.code} ${r} -> ${b.url} (stub sem redirect)`;
        }
      }else detail=`${b.code} ${r} -> ${b.url}`;
    }
    if(!ok)bad.push([r,a.code,a.loc]);
    console.log(detail,ok?'OK':'FALHOU (esperado '+want+')');
  }
  const list=refs(ROOT);
  console.log('checking refs:',list.length);
  for(const u of list){const x=await fetch(HOST+url(u));if(x.code!==200){bad.push([u,x.code]);console.log('FAIL',x.code,u);}}
  console.log('\n=== FALHAS:',bad.length,'===');
  bad.forEach(b=>console.log(b.join('  ')));
  process.exit(bad.length?1:0);
})();
