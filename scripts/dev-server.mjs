import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();const port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.json':'application/json'};
http.createServer(async(req,res)=>{
 try{
  const parsed=new URL(req.url,'http://localhost');const decoded=decodeURIComponent(parsed.pathname);
  const requested=decoded==='/'?'/index.html':decoded;
  const full=path.resolve(root,'.'+requested);
  if(full!==root&&!full.startsWith(root+path.sep)){res.writeHead(403).end('Forbidden');return}
  const data=await fs.readFile(full);
  res.writeHead(200,{'content-type':mime[path.extname(full)]||'application/octet-stream','cache-control':'no-store'});res.end(data)
 }catch{res.writeHead(404).end('Not found')}
}).listen(port,()=>console.log('Belle preview: http://localhost:'+port));
