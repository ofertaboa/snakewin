const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const SKIP=new Set(['tools','orig','.git']);
const walk=(d,cb)=>{for(const f of fs.readdirSync(d,{withFileTypes:true})){
  if(f.isDirectory()){if(SKIP.has(f.name))continue;walk(path.join(d,f.name),cb);}else cb(path.join(d,f.name));}};
let n=0;
walk(ROOT,p=>{
  if(!/\.(html|js)$/i.test(p))return;
  const src=fs.readFileSync(p,'utf8');
  let out=src;
  if(p.endsWith('.html')){
    out=out.replace(/\/_next\/image\?url=([^&"']+)(&amp;|&)w=[^&"']+(?:&amp;|&)q=[^"']*/g,(m,enc)=>{try{return decodeURIComponent(enc)}catch(e){return m}});
  }
  if(p.endsWith('.js')){
    out=out.split('dangerouslyAllowSVG:!1,unoptimized:!1').join('dangerouslyAllowSVG:!1,unoptimized:!0');
    out=out.split('path:"/_next/image",loader:"default",dangerouslyAllowSVG:!1,unoptimized:!1').join('path:"/_next/image",loader:"default",dangerouslyAllowSVG:!1,unoptimized:!0');
  }
  if(out!==src){fs.writeFileSync(p,out);n++;console.log('patched',path.relative(ROOT,p));}
});
console.log('patched files',n);
