/** Static HTML translation coverage gate; Node-only to avoid DOM lib typings. */
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const keys=new Set();
for(const path of ['src/preferences/copy.ts','src/preferences/catalog-copy.ts','src/preferences/extended-copy.ts']){
 const source=readFileSync(path,'utf8');
 const start=source.indexOf('= [')+2;
 const end=source.lastIndexOf('] as const')+1;
 const rows=JSON.parse(source.slice(start,end));
 for(const item of rows){
  if(item.length!==4 || item.some(v=>!v.trim()))throw new Error('Incomplete row in '+path+' '+item[0]);
  keys.add(item[0].trim());
 }
}
const doc=new JSDOM(readFileSync('index.html','utf8')).window.document;
for(const x of doc.querySelectorAll('script,svg,style,template'))x.remove();
const names=new Set(['Belle Alencar','BELLE ALENCAR','WhatsApp','Instagram','MG','GO',
  'Araxá','Frutal','Catalão','Mineiros',
  'Av. Vereador João Sena, 103, Centro','Av. Coronel Delfino Nunes, 382',
  'Av. José Marcelino, 206, Centro','Quarta Avenida, 76, Centro']);
const missing=new Set();
let checked=0;
const w=doc.createTreeWalker(doc.body,doc.defaultView.NodeFilter.SHOW_TEXT);
let n;
while((n=w.nextNode())){
 const t=(n.textContent||'').trim();
 if(!t||!/[a-zA-ZÀ-ÿ]/.test(t)||names.has(t))continue;
 checked++;
 if(!keys.has(t))missing.add(t);
}
for(const el of doc.querySelectorAll('*'))for(const attr of ['alt','aria-label','title','placeholder']){
 const t=el.getAttribute(attr)?.trim();
 if(!t||names.has(t))continue;
 checked++;
 if(!keys.has(t) && !/^(Favoritos, \d+ peças|Sacola de interesse, \d+ peças)$/.test(t))
   missing.add(attr+': '+t);
}
if(missing.size)throw new Error('UNTRANSLATED STATIC CONTENT:\n'+[...missing].join('\n'));
console.log('PASS',checked,'static text/aria/alt/placeholder entries covered,',keys.size,'phrases in 4 languages.');
