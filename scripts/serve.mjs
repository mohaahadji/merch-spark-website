import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dist=path.join(root,'dist');
if(!fs.existsSync(path.join(dist,'index.html')))throw Error('Run npm run build first.');
const base=fs.readFileSync(path.join(root,'.preview-base'),'utf8'),port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8'};
http.createServer((req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');
  if(url.pathname==='/'&&base!=='/'){res.writeHead(302,{Location:base});res.end();return;}
  if(!url.pathname.startsWith(base)){res.writeHead(404);res.end('Not found');return;}
  let file=path.resolve(dist,decodeURIComponent(url.pathname.slice(base.length))||'.');
  if(file!==dist&&!file.startsWith(dist+path.sep)){res.writeHead(403);res.end();return;}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  const missing=!fs.existsSync(file)||!fs.statSync(file).isFile();if(missing)file=path.join(dist,'404.html');
  res.writeHead(missing?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});fs.createReadStream(file).pipe(res);
 }catch{res.writeHead(400);res.end('Invalid request');}
}).listen(port,'127.0.0.1',()=>console.log(`Merch Spark preview: http://127.0.0.1:${port}${base}`));
