import fs from 'node:fs';
const required=['index.html','styles.css','app.js','cinema.js','silk.js','maximum.js','CLAUDE.md','AGENTS.md','docs/STORYBOARD.md','docs/QA_ACCEPTANCE.md','knowledge/MOTION_ATLAS_371.md'];
let ok=true;for(const p of required){const good=fs.existsSync(p);console.log((good?'OK  ':'FAIL')+' '+p);if(!good)ok=false}
const html=fs.readFileSync('index.html','utf8');
for(const token of ['id="inicio"','id="colecao"','id="filme"','id="materia"','id="atelier"','id="lojas"']){if(!html.includes(token)){console.log('FAIL anchor '+token);ok=false}}
if(!ok)process.exitCode=1;else console.log('Baseline e documentos presentes. QA visual e backend ainda exigem testes.');
