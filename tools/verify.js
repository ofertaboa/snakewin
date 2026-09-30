const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.join(__dirname,'..');
const EX=new Set(['tools','orig','.git','node_modules']);
function walk(d,o=[]){for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);
 if(f.isDirectory()){if(EX.has(f.name))continue;walk(p,o);}
 else if(/\.(html|js|css|webmanifest|json)$/.test(f.name)&&f.name!=='d.html')o.push(p);}return o;}

const BAD=['undefined/','//snakewin','href="/"','.replace("/")','.push("/")','start_url":"/"'];
// caminhos do app SEM base (base atual = /snakewin)
const NAKED=[/'\/_next\//,/"\/_next\//,/'\/imagens\//,/"\/imagens\//,/'\/audio\//,/"\/audio\//,
  /href="\/(jogar|login|cadastro|roleta|bonus|termos|gerente)/, /href:"\/(jogar|login|cadastro|roleta|bonus|termos|gerente)/];
let bad=0;
for(const f of walk(ROOT)){
  const t=fs.readFileSync(f,'utf8');
  const rel=path.relative(ROOT,f);
  for(const p of BAD)if(t.includes(p)){console.log('DEFEITO  '+JSON.stringify(p)+'  ->  '+rel);bad++;}
  for(const re of NAKED)if(re.test(t)){console.log('SEM BASE '+re+'  ->  '+rel);bad++;}
}
console.log('defeitos: '+bad);

if(process.argv.includes('--hash')){
  const h={};
  for(const f of walk(ROOT))h[path.relative(ROOT,f)]=crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex');
  fs.writeFileSync(process.argv[process.argv.indexOf('--hash')+1],JSON.stringify(h));
  console.log('snapshot gravado: '+Object.keys(h).length+' arquivos');
}
if(process.argv.includes('--cmp')){
  const a=JSON.parse(fs.readFileSync(process.argv[process.argv.indexOf('--cmp')+1],'utf8'));
  let d=0;
  for(const f of walk(ROOT)){const rel=path.relative(ROOT,f);
    const v=crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex');
    if(a[rel]!==v){console.log('DIFERE '+rel);d++;}}
  console.log('arquivos diferentes do snapshot: '+d);
}
