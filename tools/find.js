const fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'..','_next','static','chunks');
const needle=process.argv[2]||'loginPath';
for(const f of fs.readdirSync(dir).filter(x=>x.endsWith('.js'))){
  const t=fs.readFileSync(path.join(dir,f),'utf8');
  let i=-1;
  while((i=t.indexOf(needle,i+1))>=0){
    console.log('FILE',f,'@',i);
    console.log(JSON.stringify(t.slice(Math.max(0,i-600),i+600)));
    console.log('-----');
  }
}
