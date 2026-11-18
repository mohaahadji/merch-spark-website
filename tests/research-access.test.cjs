const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {webcrypto}=require('node:crypto'),{TextEncoder}=require('node:util');
const source=fs.readFileSync(path.join(__dirname,'../site/research-app.js'),'utf8');

function setup(initial={}){
 const stored=new Map(Object.entries(initial)),input={value:'',focus(){},select(){}},error={textContent:''},button={disabled:false};
 const form={querySelector(){return button;},addEventListener(_type,listener){this.submit=listener;}};
 const gate={setAttribute(){},querySelector(selector){return {'#research-access-form':form,'#research-access-password':input,'#research-access-error':error}[selector];},remove(){this.removed=true;}};
 const initialized=Error('research initialization reached');
 const document={body:{dataset:new Proxy({}, {set(){throw initialized;}}),append(){}},createElement(){return gate;}};
 const sessionStorage={getItem(key){return stored.get(key)||null;},setItem(key,value){stored.set(key,value);}};
 const context=vm.createContext({document,sessionStorage,crypto:webcrypto,TextEncoder,Uint8Array});
 return {stored,input,error,button,form,gate,initialized,run:()=>vm.runInContext(source,context)};
}

test('research gate rejects incorrect passwords and unlocks for the requested password',async()=>{
 const app=setup();app.run();app.input.value='wrong';
 await app.form.submit({preventDefault(){}});
 assert.match(app.error.textContent,/did not match/);assert.notEqual(app.gate.removed,true);assert.equal(app.stored.size,0);
 app.input.value='123000';
 await assert.rejects(app.form.submit({preventDefault(){}}),app.initialized);
 assert.equal(app.gate.removed,true);assert.equal(app.stored.get('sparkResearchUnlockedV2'),'true');assert.equal(app.button.disabled,false);
});

test('unlocked research sessions skip the prompt on reload',()=>{
 const app=setup({sparkResearchUnlockedV2:'true'});
 assert.throws(app.run,app.initialized);assert.equal(app.form.submit,undefined);
});
