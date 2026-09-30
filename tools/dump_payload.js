const fs=require('fs');
const f=process.argv[2];
const t=fs.readFileSync(f,'utf8');
const idx=t.indexOf('icon-180.png');
let i=0,found=0;
while(found<6){
  const j=t.indexOf('icon-180.png',i);
  if(j<0)break;
  console.log('--- @'+j+' ---');
  console.log(JSON.stringify(t.slice(Math.max(0,j-420),j+220)));
  i=j+12;found++;
}
