// Reescreve todos os caminhos absolutos do app para dentro do base path.
// Uso:  node tools\rebase.js            (aplica o base de tools\base.js)
//       node tools\rebase.js --root      (remove o base -> hospedagem na raiz)
//       node tools\rebase.js /outra     (troca o base)
//       node tools\rebase.js --dry      (so mostra, nao grava)
// Idempotente: sempre remove o base atual e reaplica o desejado.
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const EX=new Set(['tools','orig','.git','node_modules']);
const EXT=['.html','.js','.css','.webmanifest','.json'];
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const AHEAD='[\\/\\x27"?#),;\\s\\]}\\x60]';

// segmentos que sao caminhos do APP (assets e rotas) - nunca URLs externas.
// (supabase usa /admin /object /token /user /recovery /rpc /vector ... e fica de fora)
const T=['_next','imagens','audio','video','fonts','favicon\\.ico','manifest\\.webmanifest',
         'jogar','login','cadastro','roleta','bonus','termos','gerente'];

// home "/" - literais exatos, so em posicao de rota.
// nao casa com .replace("/","") nem com .replace("/jogar")
const HOME=[
  ['.replace("/")',      '.replace("{B}/")'],
  ['.push("/")',         '.push("{B}/")'],
  ['href:"/"',           'href:"{B}/"'],
  ['href="/"',           'href="{B}/"'],
  ['start_url":"/"',     'start_url":"{B}/"']
];
const withB=(s,B)=>s.replace(/\{B\}/g,B);

function walk(d,out=[]){for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);
  if(f.isDirectory()){if(EX.has(f.name))continue;walk(p,out);}
  else if(EXT.includes(path.extname(f.name))&&f.name!=='d.html')out.push(p);}return out;}

const ALL=process.argv.slice(2);
const args=ALL.filter(a=>!a.startsWith('--'));
const dry=ALL.includes('--dry');
const OLD_RAW=require('./base');
const OLD=OLD_RAW?(String(OLD_RAW).startsWith('/')?String(OLD_RAW):'/'+String(OLD_RAW)).replace(/\/+$/g,''):'';
let NEW;
if(ALL.includes('--root'))NEW='';
else NEW=(args.length?String(args[0]):String(OLD)).replace(/\/+$/g,'');
if(NEW&&!NEW.startsWith('/'))NEW='/'+NEW;

function segRe(mode){
  if(mode==='strip')return new RegExp('(?<![\\w.])'+esc(OLD)+'\\/((?:'+T.join('|')+'))(?='+AHEAD+')','g');
  return new RegExp('(?<![\\w./])\\/((?:'+T.join('|')+'))(?='+AHEAD+')','g');
}

let changed=0;const hits={};
for(const p of walk(ROOT)){
  const before=fs.readFileSync(p,'utf8');
  let s=before;
  if(OLD){                                   // 1) remove o base atual
    for(const [plain,withB0] of HOME)s=s.split(withB(withB0,OLD)).join(plain);
    s=s.replace(segRe('strip'),(m,p1)=>'/'+p1);
  }
  if(NEW){                                   // 2) aplica o base novo
    s=s.replace(segRe('apply'),m=>{hits[m]=(hits[m]||0)+1;return NEW+m;});
    for(const [plain,withB0] of HOME){
      const n=s.split(plain).length-1;
      if(n>0){s=s.split(plain).join(withB(withB0,NEW));hits[plain+'   (home)']=(hits[plain+'   (home)']||0)+n;}
    }
  }
  if(s!==before){
    changed++;
    if(!dry)fs.writeFileSync(p,s);
    console.log((dry?'DRY  ':'WROTE ')+path.relative(ROOT,p));
  }
}
console.log('\nbase: '+JSON.stringify(OLD)+'  ->  '+JSON.stringify(NEW));
console.log('arquivos alterados: '+changed);
const k=Object.keys(hits).sort((a,b)=>hits[b]-hits[a]);
if(k.length){console.log('\ncaminhos com base aplicado:');k.forEach(x=>console.log('  '+String(hits[x]).padStart(4)+'  '+(x[0]==='/'?NEW+x:x)));}
if(dry)console.log('\n(dry run - nada foi gravado)');
