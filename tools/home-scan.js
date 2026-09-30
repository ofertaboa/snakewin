const fs=require('fs'),path=require('path');
const EX=new Set(['tools','orig','.git']);
function walk(d,o=[]){for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);
 if(f.isDirectory()){if(EX.has(f.name))continue;walk(p,o);}
 else if(/\.(js|html|webmanifest|css)$/.test(f.name))o.push(p);}return o;}
const pats=[
 [/href\s*:\s*"\/"/g,'href:"/"'],
 [/href="\/"/g,'href="/"'],
 [/===\s*"\/"/g,'=== "/"'],
 [/!==\s*"\/"/g,'!=="/"'],
 [/\.push\("\/[^"]*"\)/g,'push("/...")'],
 [/\.replace\("\/[^"]*"\)/g,'replace("/...")'],
 [/location\.href="\/[^"]*"/g,'location.href="/..."'],
 [/start_url/g,'start_url']
];
const root=process.cwd();
for(const f of walk(root)){
  const t=fs.readFileSync(f,'utf8');
  for(const [re,label] of pats){
    re.lastIndex=0;let m;
    while((m=re.exec(t))){
      const i=m.index;
      console.log(path.relative(root,f)+' | '+label+' | ...'+t.slice(Math.max(0,i-50),i+40).replace(/\s+/g,' ')+'...');
    }
  }
}
