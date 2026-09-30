const fs=require('fs'),path=require('path');
const OUT=path.join(__dirname,'public');
const seen=new Set();
const IMGRE=/(?:\/(?:imagens|audio|video|fonts|_next\/static)\/[^"'\\\s<>()\]]+?\.(?:png|jpe?g|webp|gif|svg|ico|bmp|avif|mp4|webm|m4a|mp3|MP3|ogg|wav|woff2?|ttf|otf|css|js|m3u8|json|webmanifest))/g;
const URLRE=/url=([^&"'\\\s<]+)/g;
const walk=d=>{for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);
  if(f.isDirectory())walk(p);
  else if(/\.(html|js|css|json|webmanifest|txt)$/i.test(f.name)){
    let raw;try{raw=fs.readFileSync(p,'utf8')}catch(e){continue}
    let t=raw;try{t=decodeURIComponent(raw)}catch(e){}
    let m;
    while((m=IMGRE.exec(t)))seen.add(m[0].split('?')[0]);
    while((m=URLRE.exec(t))){const u=decodeURIComponent(m[1]);if(/^\/(imagens|audio|video|fonts|_next)/.test(u))seen.add(u.split('?')[0]);}
  }}};
walk(OUT);
// dynamic/template candidates
const add=(d,n)=>n.forEach(x=>seen.add(d+'/'+x));
add('/imagens/brand/asset-roleta',['base-roleta.png','botao-girar.png','circulo-central-roleta.png','moldura-rodadas-gratis.png','moldura-ultimos-ganhos.png','ponteiro-roleta.png','premio-r80-bonus.png','premio-5-giros.png','premio-r5.png','premio-xp-100.png','premio-r10.png','premio-2-giros.png','premio-r20.png','premio-xp-200.png','edge-asset.png']);
add('/imagens/painel-xp',['vip-1.png','vip-2.png','vip-3.png','vip-0-fundo-couro.png','vip-1-fundo-prata.png','vip-2-fundo-roxo-premium.png','vip-3-fundo-ouro.png','cadeado-vip.png','moeda-nivel-vip.png','moedas-cashback-vip.png','presente-vip.png','icone-informacao-vip.png','seta-direita-vip.png','particulas-vip.png','marcador-concluido-vip.png','bomba.png']);
for(let i=1;i<=12;i++)add('/imagens/assetsjogoimg',['folha_'+String(i).padStart(2,'0')+'.png']);
add('/imagens/assetsjogoimg',['piso-jogo.png','moeda.png','botao.png','ma%C3%A7aasset.png','maçaasset.png','moita1.png','moita2.png','moita3.png','planta1.png','ruina-asset.png']);
add('/imagens',['logotextosnakewin.png','bau-icon.png','interface-saldo.png','icon-mission.png','coroacima.png','back3.png','background.png']);
add('/imagens/brand',['logo.png','icon-rolet.png','icon-180.png','icon-192.png','icon-512.png','favicon-96.png']);
add('/imagens/game',['vdlpf.mp4','vdlpf-poster.webp']);
add('/audio',['broken.MP3','bubble.MP3','cashout.mp3','defeat.mp3','encaixe.MP3','pop01.mp3','pop02.mp3','pop03.mp3','pop04.mp3','selection.MP3','swtch.MP3','win.mp3']);
add('/audio/speaks',['ABATERCOBRA.mp3','boasorte.mp3','bombacarregando.mp3','bombacuidado.mp3','booster.mp3','coin.mp3','comerma%C3%A7a.mp3','concluido.mp3','continue.mp3','explosaobomba.mp3','introbomba.mp3','loss.mp3','trilha-sonora.mp3']);
add('/audio/game',['winning_offer_generic_win.ogg']);

const missing=[],exists=[];
for(const u of [...seen].sort()){
  const rel=decodeURIComponent(u).replace(/^\/+/,'');
  const p=path.join(OUT,rel);
  (fs.existsSync(p)&&fs.statSync(p).size>0?exists:missing).push(u);
}
fs.writeFileSync(path.join(__dirname,'missing.json'),JSON.stringify(missing,null,2));
fs.writeFileSync(path.join(__dirname,'present.json'),JSON.stringify(exists,null,2));
console.log('total refs',seen.size,'present',exists.length,'MISSING',missing.length);
console.log(missing.join('\n'));

const https=require('https');
function get(u){return new Promise((res,rej)=>{const r=https.get(u,{headers:{'user-agent':'Mozilla/5.0'},timeout:60000},(s)=>{
  if(s.statusCode>=300&&s.statusCode<400&&s.headers.location)return res(get(new URL(s.headers.location,u)));
  if(s.statusCode!==200){s.resume();return rej(new Error('HTTP '+s.statusCode));}
  const c=[];s.on('data',d=>c.push(d));s.on('end',()=>res(Buffer.concat(c)));});r.on('error',rej);r.on('timeout',()=>r.destroy(new Error('timeout')));});}
(async()=>{
  const still=[];
  for(const u of missing){
    const rel=decodeURIComponent(u).replace(/^\/+/,'');
    try{const b=await get('https://www.snakewin.online'+encodeURI(u));
      const p=path.join(OUT,rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b);
      console.log('OK  ',rel,b.length);}catch(e){console.log('MISS',u,e.message);still.push(u);}
  }
  fs.writeFileSync(path.join(__dirname,'missing.json'),JSON.stringify(still,null,2));
  console.log('STILL MISSING:',still.length);
})();

