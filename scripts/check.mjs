import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'dist');
const base=fs.readFileSync(path.join(root,'.preview-base'),'utf8');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]);}
const files=walk(out),pages=files.filter(file=>file.endsWith('.html'));let links=0;
for(const page of pages){
 const html=fs.readFileSync(page,'utf8');
 if(!/<title>[^<]*Merch Spark[^<]*<\/title>/.test(html))throw Error(`Missing Merch Spark title: ${page}`);
 for(const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)){
  const value=match[1];if(!value.startsWith('/')||value.startsWith('//'))continue;
  const url=new URL(value,'https://preview.invalid');
  if(!url.pathname.startsWith(base))throw Error(`Link outside project base: ${value}`);
  let local=path.join(out,decodeURIComponent(url.pathname.slice(base.length)));
  if(fs.existsSync(local)&&fs.statSync(local).isDirectory())local=path.join(local,'index.html');
  if(!fs.existsSync(local))throw Error(`Broken link: ${value} in ${page}`);
  if(url.hash&&local.endsWith('.html')){
   const target=fs.readFileSync(local,'utf8'),id=decodeURIComponent(url.hash.slice(1));
   const workspaceRoute=['discover','keywords','saved'].includes(id)&&target.includes('research-app.js')&&target.includes(`data-view="${id}"`);
   if(!workspaceRoute&&!target.includes(`id="${id}"`)&&!target.includes(`id='${id}'`))throw Error(`Missing section ${value}`);
  }
  links++;
 }
}
if(files.some(file=>/\.(?:env|pem|key)$/.test(file)||file.includes('/.git/')))throw Error('Unexpected private configuration in site output.');
console.log(`Checked ${pages.length} pages and ${links} internal links/assets for ${base}`);
