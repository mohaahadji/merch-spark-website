import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const repository=process.env.GITHUB_REPOSITORY?.split('/').at(-1);
const fallback=repository&&!repository.endsWith('.github.io')?`/${repository}/`:'/';
const base=process.env.BASE_PATH||fallback;
if(!/^\/(?:[A-Za-z0-9._-]+\/)*$/.test(base))throw Error('BASE_PATH must be / or an absolute directory path ending in /.');
const out=path.join(root,'dist');
fs.mkdirSync(out,{recursive:true});
fs.cpSync(path.join(root,'site'),out,{recursive:true});
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]);}
for(const file of walk(out))if(file.endsWith('.html')){
  const html=fs.readFileSync(file,'utf8').replace(/\b(href|src)=(['"])\/(?!\/)/g,(_match,attr,quote)=>`${attr}=${quote}${base}`);
  fs.writeFileSync(file,html);
}
fs.writeFileSync(path.join(out,'.nojekyll'),'');
fs.writeFileSync(path.join(root,'.preview-base'),base);
console.log(`Merch Spark built for ${base}`);
