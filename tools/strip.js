const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const SKIP=new Set(['tools','orig']);
let n=0;
const walk=d=>{for(const f of fs.readdirSync(d,{withFileTypes:true})){
  const p=path.join(d,f.name);
  if(f.isDirectory()){if(SKIP.has(f.name))continue;walk(p);}
  else if(f.name.endsWith('.html')){
    let s=fs.readFileSync(p,'utf8'),o=s;
    // <img ... srcSet="X" ...>  -> remove srcSet/srcset/sizes (Next unoptimized nao emite)
    o=o.replace(/<img\b[^>]*>/g,tag=>tag
      .replace(/\s+srcSet="[^"]*"/gi,'')
      .replace(/\s+srcset="[^"]*"/gi,'')
      .replace(/\s+sizes="[^"]*"/gi,''));
    // <link rel="preload" as="image" imageSrcSet="X" imageSizes="Y"/> -> href
    o=o.replace(/<link\b[^>]*rel="preload"[^>]*as="image"[^>]*\/?>(?!<)/g,tag=>{
      const m=tag.match(/imageSrcSet="([^"]*)"/);
      if(!m)return tag;
      let t=tag.replace(/\s+imageSrcSet="[^"]*"/g,'').replace(/\s+imageSizes="[^"]*"/g,'');
      if(/href="/.test(t))return t;
      return t.replace(/<link\b/,'<link href="'+m[1]+'"');
    });
    if(o!==s){fs.writeFileSync(p,o);n++;console.log('fixed',path.relative(ROOT,p));}
  }}};
walk(ROOT);
console.log('html fixed',n);
