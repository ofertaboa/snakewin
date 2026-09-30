const fs=require('fs'),path=require('path'),https=require('https');
const ORIGIN='https://www.snakewin.online';
const ROOT=path.join(__dirname,'..');
const SKIP=new Set(['tools','orig']);
const KEEP=new Set(['404.html','d.html']);

function get(u){return new Promise((res,rej)=>{
  const r=https.get(u,{headers:{'user-agent':'Mozilla/5.0'},timeout:60000},s=>{
    if(s.statusCode>=300&&s.statusCode<400&&s.headers.location)return res(get(new URL(s.headers.location,u)));
    if(s.statusCode!==200){s.resume();return rej(new Error('HTTP '+s.statusCode));}
    const c=[];s.on('data',d=>c.push(d));s.on('end',()=>res(Buffer.concat(c)));});
  r.on('error',rej);r.on('timeout',()=>r.destroy(new Error('timeout')));});}

const htmlFiles=[],jsFiles=[];
const walk=d=>{for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);
  if(f.isDirectory()){if(SKIP.has(f.name))continue;walk(p);}
  else if(f.name.endsWith('.html')&&!KEEP.has(f.name))htmlFiles.push(p);
  else if(f.name.endsWith('.js'))jsFiles.push(p);}};
walk(ROOT);

async function relist(){
  for(const p of htmlFiles){
    const rel=path.relative(ROOT,p).replace(/\\/g,'/');
    const route=rel.endsWith('/index.html')?rel.slice(0,-'/index.html'.length):(rel.replace(/\.html$/,''));
    try{const b=await get(ORIGIN+'/'+route);fs.writeFileSync(p,b);console.log('HTML fresh',route,b.length);}
    catch(e){console.log('HTML FAIL',route,e.message);}
  }
  for(const p of jsFiles){
    const rel=path.relative(ROOT,p).replace(/\\/g,'/');
    try{const b=await get(ORIGIN+'/'+rel);fs.writeFileSync(p,b);console.log('JS fresh',rel,b.length);}
    catch(e){console.log('JS FAIL',rel,e.message);}
  }
}

function patchLoaders(){
  const re=/return\`\$\{([A-Za-z_$][\w$]*)\.path\}\?url=\$\{encodeURIComponent\(([A-Za-z_$][\w$]*)\)\}[\s\S]*?:""\}\`/g;
  let n=0;
  for(const p of jsFiles){
    const s=fs.readFileSync(p,'utf8');
    if(!s.includes('encodeURIComponent('))continue;
    const o=s.replace(re,(_,cfg,src)=>'return '+src);
    if(o!==s){fs.writeFileSync(p,o);n++;console.log('LOADER patched',path.relative(ROOT,p));}
  }
  console.log('loader patched files:',n);
}

function rewriteHtml(){
  const loose=/\/_next\/image\?url=([^&"']+)(?:&amp;|&)w=[^&"' ,]+(?:&amp;|&)q=[^&"' ,]+/g;
  let n=0;
  for(const p of htmlFiles){
    const s=fs.readFileSync(p,'utf8');
    const o=s.replace(loose,(_,u)=>u);
    if(o!==s){fs.writeFileSync(p,o);n++;console.log('HTML rewritten',path.relative(ROOT,p));}
  }
  console.log('html rewritten:',n);
}

(async()=>{
  await relist();
  if(process.argv.includes('--pristine')){console.log('PRISTINE ONLY');return;}
  patchLoaders();
  rewriteHtml();
  let left=0;
  for(const p of htmlFiles)if(fs.readFileSync(p,'utf8').includes('/_next/image')){left++;console.log('LEFTOVER ->',path.relative(ROOT,p));}
  let lm=0;
  for(const p of jsFiles)if(fs.readFileSync(p,'utf8').includes('?url=')){lm++;console.log('LOADER NOT PATCHED ->',path.relative(ROOT,p));}
  console.log('leftover html:',left,'| unpatched loaders:',lm);
})().catch(e=>{console.error('FATAL',e);process.exit(1)});
