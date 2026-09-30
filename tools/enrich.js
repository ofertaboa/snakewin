const fs=require('fs'),path=require('path'),http=require('http'),https=require('https');
const ORIGIN='https://www.snakewin.online';
const OUT=path.join(__dirname,'public');
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
const EXT=/\.(js|css|woff2?|ttf|otf|png|jpe?g|webp|gif|svg|ico|mp3|MP3|mp4|webm|wav|ogg|m4a|m3u8|ts|json|webmanifest|txt|xml|map|avif|bmp)$/;

function get(u,bin){return new Promise((res,rej)=>{
  const r=https.get(u,{headers:{'user-agent':UA,'accept':'*/*'},timeout:60000},(s)=>{
    if(s.statusCode>=300&&s.statusCode<400&&s.headers.location)return res(get(new URL(s.headers.location,u).href,bin));
    if(s.statusCode!==200){s.resume();return rej(new Error('HTTP '+s.statusCode));}
    const c=[];s.on('data',d=>c.push(d));s.on('end',()=>res(bin?Buffer.concat(c):Buffer.concat(c).toString('utf8')));
  });r.on('error',rej);r.on('timeout',()=>r.destroy(new Error('timeout')));
});}
function save(rel,buf){const p=path.join(OUT,rel.replace(/^\/+/,''));fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,buf);}
function local(rel){return fs.existsSync(path.join(OUT,rel.replace(/^\/+/,'')));}

function scanLocal(){
  const set=new Set();
  const walk=d=>{for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);
    if(f.isDirectory())walk(p);
    else if(/\.(html|js|css|json|webmanifest)$/i.test(f.name)){
      let t;try{t=fs.readFileSync(p,'utf8')}catch(e){continue}
      const re=/["'`](\/(?:_next|imagens|audio|video|fonts)[^"'`\s)]*\.[A-Za-z0-9]{1,5}(?:\?[^"'`\s)]*)?)["'`]/g;
      let m;while((m=re.exec(t)))set.add(decodeURI(m[1]));
      const re2=/(?:href|src)=["'`](\/[^"'`\s)]+\.[A-Za-z0-9]{1,5})["'`]/g;
      while((m=re2.exec(t)))set.add(decodeURI(m[1]));
    }}};
  walk(OUT);return set;
}

const CAND=new Set();
function addAll(dir,names){names.forEach(n=>CAND.add(dir+'/'+n));}
const roletaNames=['base-roleta.png','premio-r80-bonus.png','premio-5-giros.png','premio-r5.png','premio-xp-100.png','premio-r10.png','premio-2-giros.png','premio-r20.png','premio-xp-200.png','edge-asset.png','moeda-nivel-vip.png','pilha-moedas.png','icon-rolet.png'];
const painel=['vip-1.png','vip-2.png','vip-3.png','vip-0-fundo-couro.png','vip-1-fundo-prata.png','vip-2-fundo-roxo-premium.png','vip-3-fundo-ouro.png','cadeado-vip.png','moeda-nivel-vip.png','moedas-cashback-vip.png','presente-vip.png','icone-informacao-vip.png','seta-direita-vip.png','particulas-vip.png','marcador-concluido-vip.png','bomba.png'];
const jogo=['piso-jogo.png','moeda.png','botao.png','ma%C3%A7aasset.png','moita1.png','moita2.png','moita3.png','planta1.png','planta2.png','planta3.png','ruina-asset.png','folha_01.png','folha_02.png','folha_03.png','folha_04.png','folha_05.png','folha_06.png','folha_07.png','folha_08.png','folha_09.png','folha_10.png','folha_11.png','folha_12.png'];
const raiz=['logo.png','logotextosnakewin.png','background.png','back3.png','coroacima.png','interface-saldo.png','icon-mission.png','bau-icon.png','icon-rolet.png','banner-deposito.png','banner-indique-ganhe.png','banner-jogue-gratis.png','banner-painel.png','banner-rodadagratis.png','banner-saque.png','vdlpf-poster.webp'];
const audioRaiz=['broken.MP3','bubble.MP3','cashout.mp3','defeat.mp3','encaixe.MP3','pop01.mp3','pop02.mp3','pop03.mp3','pop04.mp3','selection.MP3','swtch.MP3','win.mp3'];
const speaks=['ABATERCOBRA.mp3','boasorte.mp3','bombacarregando.mp3','bombacuidado.mp3','booster.mp3','coin.mp3','comerma%C3%A7a.mp3','concluido.mp3','continue.mp3','explosaobomba.mp3','introbomba.mp3','loss.mp3','trilha-sonora.mp3'];
const game=['winning_offer_generic_win.ogg','vdlpf.mp4'];
addAll('/imagens/brand/asset-roleta',roletaNames);
addAll('/imagens/painel-xp',painel);
addAll('/imagens/assetsjogoimg',jogo);
addAll('/imagens',raiz);
addAll('/imagens/game',game);
addAll('/audio',audioRaiz);
addAll('/audio/speaks',speaks);

(async()=>{
  const missing=new Set();
  for(let round=0;round<4;round++){
    const cand=new Set([...CAND,...scanLocal()]);
    CAND.clear();
    let got=0,fail=0;
    for(const u of cand){
      const rel=u.split('?')[0];
      if(!EXT.test(rel))continue;
      if(local(rel)&&fs.statSync(path.join(OUT,rel.replace(/^\/+/,''))).size>0)continue;
      const url=ORIGIN+encodeURI(rel);
      try{const b=await get(url,true);save(rel,b);got++;console.log('OK  ',rel,b.length);}
      catch(e){fail++;console.log('MISS',rel,e.message);missing.add(rel);}
    }
    console.log(`-- round ${round}: fetched=${got} missing=${fail} scanned=${cand.size}`);
    if(got===0)break;
  }
  fs.writeFileSync(path.join(__dirname,'missing.json'),JSON.stringify([...missing].sort(),null,2));
  console.log('TOTAL MISSING:',missing.size);
})().catch(e=>{console.error('FATAL',e);process.exit(1)});
