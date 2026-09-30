const {spawnSync}=require('child_process'),fs=require('fs'),path=require('path'),os=require('os');
const CHROME='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT=process.env.PORT||8080;
const SITE=process.env.SITE||('http://localhost:'+PORT);
const B=(()=>{const r=require('./base');return r?String(r).replace(/^\/?/,'/').replace(/\/+$/,''):''})();
const routes=process.argv.slice(2).filter(a=>!a.startsWith('--'));
const list=routes.length?routes:['/','/jogar','/roleta','/login','/cadastro','/gerente/login','/bonus','/termos'];
const noise=/AudioContext|beforeinstallprompt|preloaded using link|Download the React DevTools/;
let fails=0;
for(const r of list){
  const url=SITE+B+r;
  const tag=r.replace(/[^a-z0-9]/gi,'')||'home';
  const res=spawnSync(CHROME,['--headless=new','--disable-gpu','--no-sandbox','--virtual-time-budget=12000',
    '--user-data-dir='+path.join(os.tmpdir(),'cc_'+tag),'--enable-logging=stderr','--v=0','--dump-dom',url],
    {encoding:'utf8',timeout:120000,maxBuffer:64*1024*1024});
  const html=res.stdout||'';
  const log=res.stderr||'';
  const errs=log.split(/\r?\n/).filter(l=>l.includes('CONSOLE')&&!noise.test(l));
  const visible=html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim().length;
  const blank=visible<40;
  const bad=errs.length>0||blank;
  if(bad)fails++;
  console.log((bad?'FALHA ':'OK    ')+r.padEnd(18)+' dom='+String(html.length).padStart(6)+
    ' texto='+String(visible).padStart(5)+(blank?'  [BRANCO]':'')+(errs.length?'  erros='+errs.length:''));
  errs.slice(0,3).forEach(e=>console.log('        '+e.slice(0,240)));
}
console.log('\nfalhas: '+fails);
process.exit(fails?1:0);
