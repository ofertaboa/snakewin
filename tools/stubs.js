const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const targets=[
  ['gerente','login/'],
  ['gerente/comissoes','../login/'],
  ['gerente/criar-demo','../login/'],
  ['gerente/indicados','../login/'],
  ['gerente/indicar','../login/'],
  ['gerente/meus-saques','../login/'],
  ['gerente/notificacoes','../login/'],
  ['gerente/perfil','../login/']
];
for(const [dir,t] of targets){
  const d=path.join(ROOT,dir);
  fs.mkdirSync(d,{recursive:true});
  const html=`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">`+
    `<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">`+
    `<meta http-equiv="refresh" content="0;url=${t}">`+
    `<title>Redirecionando? ? SnakeWin</title>`+
    `<script>location.replace(${JSON.stringify(t)})</script>`+
    `</head><body style="margin:0;background:#131413;color:#fff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100dvh">`+
    `<p>Redirecionando para o <a style="color:#4dfbc8" href="${t}">login</a>?</p>`+
    `</body></html>`;
  fs.writeFileSync(path.join(d,'index.html'),html);
  console.log('STUB '+dir+'/index.html  ->  '+t);
}
