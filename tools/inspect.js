const fs=require('fs');
for(const f of process.argv.slice(2)){
 const t=fs.readFileSync(f,'utf8');
 const imgs=[...t.matchAll(/<img[^>]*>/g)].map(m=>m[0]);
 console.log('==',f,'imgs=',imgs.length);
 imgs.slice(0,8).forEach(x=>console.log('   IMG',x.slice(0,340)));
 const pre=[...t.matchAll(/<link[^>]*as="image"[^>]*>/g)].map(m=>m[0]);
 pre.slice(0,5).forEach(x=>console.log('  PRE',x.slice(0,300)));
 console.log('  literal srcSet:',t.split('srcSet').length-1,
             '| imageSrcSet:',t.split('imageSrcSet').length-1,
             '| srcset=:',t.split('srcset=').length-1,
             '| sizes=:',t.split(' sizes=').length-1);
}
