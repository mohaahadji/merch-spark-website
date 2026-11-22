const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');

test('sports workflow ranks live badge evidence, withholds flagged art and passes feedback into a new draft',async()=>{
 const node=(tag,text)=>({tag,text,children:[],get options(){return this.children;},get value(){return this._value??this.children[0]?.value??'';},set value(v){this._value=v;},setAttribute(){},append(...items){this.children.push(...items);},replaceChildren(){this.children=[];}});
 const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,node(id));return elements.get(id);};
 get('sports-type').value='basketball';
 get('sports-mode').value='ai';
 const prompts=[],queries=[];
 const slogans=['Around The Rim','Bleachers Bring Us Back',null];
 const LanguageModel={async create(){return {async prompt(input){prompts.push(JSON.parse(input));const slogan=slogans.shift();return JSON.stringify({slogan,palette:'night-game',layout:'split',emotion:'Recall a night with friends.'});},destroy(){}};}};
 const context=vm.createContext({document:{getElementById:get,createTextNode:text=>text},LanguageModel,URL,Image:class{async decode(){}},FileReader:class{readAsDataURL(){this.result='data:image/png;base64,AAAA';this.onload();}}});
 for(const file of ['research-model.js','sports-agents.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../site',file),'utf8'),context);
 let searchActive=false;
 context.SparkSportsAgents.mount({node,date:()=> 'Today',sourceUrl:()=>new URL('https://www.amazon.com/s'),
  canDesign(){return true;},beginSearch(){searchActive=true;return true;},endSearch(){searchActive=false;},
  async request(type,data){
   queries.push({type,...data});
   if(type==='SPARK_RESEARCH_SEARCH'){
    assert.equal(searchActive,true);
    const minimum=[50,200,100][queries.length-1];
    return {products:[{asin:'B00000000'+queries.length,title:'Sports shirt',boughtPastMonthLabel:minimum+'+ bought in past month'}]};
   }
   const matches=data.phrase==='Around The Rim'?[{mark:'Around The Rim',serial:'12345678'}]:[];
   return {screen:{terms:[data.phrase],retrievedAt:'2026-11-21T12:00:00Z',matches,matchCount:matches.length,partial:false}};
  }});
 await get('sports-form').onsubmit({preventDefault(){}});
 assert.equal(searchActive,false);
 assert.equal(get('sports-results').children[0].children[0].text,'basketball student section');
 await get('sports-design').onclick();
 const output=get('sports-design-output');
 assert.equal(output.children.some(child=>child.tag==='button'),false);
 assert.match(get('sports-status').textContent,/possible conflicts/);
 await get('sports-design').onclick();
 assert.match(prompts[1].screeningFeedback,/possible conflicts/);
 assert.equal(prompts[1].demand.medianBadgeThreshold,200);
 assert.match(output.children.find(child=>child.tag==='div').innerHTML,/BLEACHERS BRING/);
 assert.equal(output.children.at(-1).text,'Download transparent PNG');
 await get('sports-design').onclick();
 assert.ok(output.children.some(child=>child.text?.includes('Chrome AI did not produce a usable draft')));
 assert.match(output.children.find(child=>child.tag==='div').innerHTML,/BLEACHERS REMEMBER/);
 get('sports-mode').value='browser';
 await get('sports-design').onclick();
 assert.equal(prompts.length,3);
 assert.match(output.children.find(child=>child.tag==='div').innerHTML,/OUR ROW/);
 const brief=output.children.find(child=>child.tag==='section').children.find(child=>child.tag==='textarea');
 assert.match(brief.value,/basketball student section/);
 assert.match(brief.value,/transparent PNG/);
 assert.match(brief.value,/Spark will add the screened slogan/);
 const workflow=output.children.find(child=>child.tag==='section');
 const [file,review]=workflow.children.filter(child=>child.tag==='label').map(label=>label.children[0]);
 file.files=[{type:'image/png',size:4}];
 await file.onchange();
 assert.match(output.children.find(child=>child.tag==='div').innerHTML,/data:image\/png;base64,AAAA/);
 assert.equal(output.children.at(-1).disabled,true);
 review.checked=true;
 review.onchange();
 assert.equal(output.children.at(-1).disabled,false);
});
