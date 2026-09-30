const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const HOST='http://localhost:'+(process.env.PORT||8080);
const RAW=require('./base');
const B=RAW?(String(RAW).startsWith('/')?String(RAW):'/'+String(RAW)).replace(/\/+$/g,''):'';
const url=u=>B&&!(u===B||u.startsWith(B+'/'))?B+u:u;
const pages=['/','/jogar/','/login/','/cadastro/','/roleta/','/bonus/','/termos/','/gerente/login/'];
const redirects={
  '/gerente':'/gerente/login','/gerente/comissoes':'/gerente/login','/gerente/criar-demo':'/gerente/login',
  '/gerente/indicados':'/gerente/login','/gerente/indicar':'/gerente/login','/gerente/meus-saques':'/gerente/login',
  '/gerente/notificacoes':'/gerente/login','/gerente/perfil':'/gerente/login'};
function fetch(u){return new Promise(r=>{const q=http.get(u,{timeout:20000},s=>{const c=[];s.on('data',d=>c.push(d));s.on('end',()=>r({code:s.statusCode,loc:s.headers.location||'',len:Buffer.concat(c).length}));});q.on('error',e=>r({code:0,loc:'',len:0,err:e.message}));q.on('timeout',()=>{q.destroy();r({code:0,loc:'',len:0,err:'timeout'})});});}
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
    const x=await fetch(HOST+url(r));
    const want=B+redirects[r];
    const ok=x.code===307&&x.loc===want;
    if(!ok)bad.push([r,x.code,x.loc]);
    console.log(x.code,r,'->',x.loc,ok?'OK':'FALHOU (esperado '+want+')');
  }
  const list=refs(ROOT);
  console.log('checking refs:',list.length);
  for(const u of list){const x=await fetch(HOST+url(u));if(x.code!==200){bad.push([u,x.code]);console.log('FAIL',x.code,u);}}
  console.log('\n=== FALHAS:',bad.length,'===');
  bad.forEach(b=>console.log(b.join('  ')));
  process.exit(bad.length?1:0);
})();
