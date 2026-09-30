const fs=require('fs'),path=require('path'),http=require('http'),https=require('https');
const ORIGIN='https://www.snakewin.online';
const OUT=path.join(__dirname,'public');
const seen=new Set(), queue=[], assets=new Set(), routes=new Set(['/']);
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';

function get(u,bin){return new Promise((res,rej)=>{
  const mod=u.startsWith('https')?https:http;
  const r=mod.get(u,{headers:{'user-agent':UA,'accept':'*/*'},timeout:45000},(s)=>{
    if(s.statusCode>=300&&s.statusCode<400&&s.headers.location)return res(get(new URL(s.headers.location,u).href,bin));
    if(s.statusCode!==200){s.resume();return rej(new Error(u+' -> '+s.statusCode));}
    const c=[];s.on('data',d=>c.push(d));s.on('end',()=>res(bin?Buffer.concat(c):Buffer.concat(c).toString('utf8')));
  });
  r.on('error',rej);r.on('timeout',()=>r.destroy(new Error('timeout '+u)));
});}

function save(rel,buf){
  const p=path.join(OUT,rel.replace(/^\/+/,''));
  fs.mkdirSync(path.dirname(p),{recursive:true});
  if(!fs.existsSync(p)||fs.statSync(p).size===0)fs.writeFileSync(p,buf);
}
function abs(u,base){try{return new URL(u,base).href}catch(e){return null}}

function pushUrl(u){ if(!u||u.startsWith('data:')||u.startsWith('mailto:')||u.startsWith('#')||u.includes('facebook.com')||u.includes('google')||u.includes('gstatic')&&false)return;
  if(u.startsWith('http')&&!u.startsWith(ORIGIN))return;
  const url=u.startsWith('http')?u:ORIGIN+(u.startsWith('/')?u:'/'+u);
  if(seen.has(url))return; seen.add(url); queue.push(url);
}

const extRe=/\.(js|css|woff2?|ttf|otf|png|jpe?g|webp|gif|svg|ico|mp3|mp4|webm|wav|ogg|m4a|m3u8|ts|json|webmanifest|txt|xml|map|avif|bmp)(\?|$)/i;
function collectRefs(text,base){
  if(!text)return;
  const re=/(?:src|href|srcSet|url)\s*[:=]\s*["'`]([^"'`]+)["'`]|["'`](\/(?:_next|imagens|image|img|images|assets|static|audio|audios|music|sounds|video|videos|media|fonts|css|js|manifest\.webmanifest|favicon)[^"'`\s)]*)["'`]|["'`]([^"'`\s)]+\.(?:png|jpe?g|webp|gif|svg|ico|mp3|mp4|webm|wav|ogg|m4a|m3u8|ts|woff2?|css|js)(\?[^"'`\s)]*)?)["'`]/gi;
  let m;while((m=re.exec(text))){
    let u=m[1]||m[2]||m[3]; if(!u)continue;
    if(u.startsWith('http')&&u.startsWith(ORIGIN))u=u.slice(ORIGIN.length);
    if(u.startsWith('//'))continue;
    if(u.startsWith('data:')||u.startsWith('#'))continue;
    if(extRe.test(u)){ const a=abs(u,base); if(a&&a.startsWith(ORIGIN))pushUrl(a); }
  }
}
function collectRoutes(text){
  if(!text)return;
  const re=/["'`](\/[a-z0-9][a-z0-9\-\/]{0,40})["'`]/gi;
  let m;
  while((m=re.exec(text))){
    const p=m[1];
    if(/\.(png|jpe?g|webp|gif|svg|ico|mp3|mp4|js|css|m3u8|ts|woff2?|json|webmanifest|txt|xml|map|webm|wav|ogg)(\?|$)/i.test(p))continue;
    if(p.startsWith('/_next')||p.startsWith('/api/'))continue;
    if(/\/(node_modules|src|app|pages|components|lib|public|_vercel)/.test(p))continue;
    if(/^[\/][a-z0-9\-\/]*$/.test(p)&&p.split('/').filter(Boolean).length<=3)routes.add(p);
  }
  // Next build manifest route lists
  const rm=/\{"page":"(\/[^"]*)"/g; while((m=rm.exec(text))) routes.add(m[1].replace(/\/\[.*?\]/g,''));
}

(async()=>{
  fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
  // seed html routes
  ['/', '/jogar','/login','/cadastro','/termos'].forEach(p=>pushUrl(ORIGIN+p));
  while(queue.length){
    const url=queue.shift();
    let buf;
    try{buf=await get(url,true);}catch(e){console.log('FAIL',e.message);continue;}
    const p=new URL(url).pathname;
    const isHtml=(buf.slice(0,200).toString().toLowerCase().includes('<!doctype')||buf.slice(0,200).toString().toLowerCase().includes('<html'));
    if(isHtml||url.endsWith('.txt')||url.endsWith('.xml')||url.endsWith('.webmanifest')){
      const txt=buf.toString('utf8');
      const rel=p==='/'?'/index.html':(extRe.test(p)?p:(p.replace(/\/+$/,'')+'/index.html'));
      save(rel,buf);
      collectRefs(txt,url);
      if(isHtml)collectRoutes(txt);
      console.log('HTML',p,rel,buf.length);
    }else{
      save(p,buf); console.log('ASSET',p,buf.length);
      if(/\.(js|css|m3u8|map)$/i.test(p)){const t=buf.toString('utf8');collectRefs(t,url);collectRoutes(t);}
    }
    if(queue.length>3000)break;
  }
  // second pass: fetch newly discovered routes as HTML
  for(const r of [...routes]){
    const u=ORIGIN+(r==='/'?'/':r);
    if(seen.has(u))continue; pushUrl(u);
  }
  let guard=0;
  while(queue.length&&guard<500){
    guard++;
    const url=queue.shift();
    let buf; try{buf=await get(url,true);}catch(e){console.log('FAIL2',e.message);continue;}
    const p=new URL(url).pathname;
    const isHtml=buf.slice(0,200).toString().toLowerCase().includes('<html');
    if(isHtml){
      const rel=p==='/'?'/index.html':(p.replace(/\/+$/,'')+'/index.html');
      save(rel,buf);const t=buf.toString('utf8');collectRefs(t,url);collectRoutes(t);
      console.log('HTML2',p,rel,buf.length);
    }else{ save(p,buf); if(/\.(js|css|m3u8)$/i.test(p)){const t=buf.toString('utf8');collectRefs(t,url);collectRoutes(t);} console.log('ASSET2',p,buf.length); }
    for(const r of routes){const u=ORIGIN+(r==='/'?'/':r); if(!seen.has(u))pushUrl(u);}
  }
  fs.writeFileSync(path.join(__dirname,'routes.json'),JSON.stringify([...routes].sort(),null,2));
  console.log('ROUTES:',[...routes].sort().join('  '));
  console.log('DONE files=',seen.size);
})().catch(e=>{console.error('FATAL',e);process.exit(1)});
