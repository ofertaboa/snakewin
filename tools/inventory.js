const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const EX=new Set(['tools','orig','node_modules','.git']);
const EXT=['.html','.js','.css','.webmanifest','.json'];
function walk(d,out=[]){for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);
 if(f.isDirectory()){if(EX.has(f.name))continue;walk(p,out);}
 else if(EXT.includes(path.extname(f.name)))out.push(p);}return out;}
const segs={};const homes={};
for(const f of walk(ROOT)){
  const t=fs.readFileSync(f,'utf8');
  const rel=path.relative(ROOT,f);
  let m;
  const re=/(?<![\w@.\\])\/([A-Za-z0-9_.\-~%]*)/g;
  while((m=re.exec(t))){
    const seg=m[1];
    if(seg===''){
      if(t[m.index-1]==='"'&&t[m.index+1]==='"')homes[rel]=(homes[rel]||0)+1;
      continue;
    }
    const first=seg.split('/')[0];
    (segs[first]=segs[first]||{n:0,s:new Set(),f:new Set()}).n++;
    segs[first].s.add(rel);segs[first].f.add(t.slice(m.index,m.index+60).replace(/\s+/g,' '));
  }
}
const keys=Object.keys(segs).sort((a,b)=>segs[b].n-segs[a].n);
console.log('=== primeira-segmento (caminho absoluto) ===');
for(const k of keys){
  const v=segs[k];
  console.log(`\n[${v.n}] /${k}   em ${v.f.size} arquivo(s)`);
  let i=0;for(const s of v.s){console.log('   '+s);if(++i>=6){if(v.f.size>6)console.log('   ...');break;}}
  let j=0;for(const s of v.f){console.log('      '+s);if(++j>=2)break;}
}
console.log('\n=== "/" vazio ===');
for(const k of Object.keys(homes))console.log(`[${homes[k]}] ${k}`);
