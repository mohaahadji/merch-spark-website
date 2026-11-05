const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const ctx={console,Date};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../site/research-model.js'),'utf8'),ctx);const M=ctx.SparkResearchModel;
const p=(n,more={})=>M.normalize({asin:'B'+String(n).padStart(9,'0'),title:'Funny Mountain Hiking Adventure Shirt',boughtPastMonthLabel:'50+ bought in past month',price:19.99,rating:4.5,reviewCount:10,bsr:25000,bsrCategory:'Clothing, Shoes & Jewelry',...more});
test('product imports exclude ads and retain missing values and source provenance',()=>{assert.equal(M.normalize({ASIN:'B000000001',Title:'Test',Sponsored:'yes'}),null);const item=p(1,{price:null,reviewCount:null,imported:true});assert.equal(item.price,null);assert.equal(item.reviewCount,null);assert.equal(item.imported,true);assert.equal(M.normalize({asin:'bad',title:'Test'}),null);});
test('numeric filters never treat unknown values as zero and missing values sort last both ways',()=>{const rows=[p(1),p(2,{price:null,bsr:null,reviewCount:null}),p(3,{price:10,bsr:50000,reviewCount:30})];assert.deepEqual(Array.from(M.filter(rows,{maxReviews:20}),p=>p.asin),['B000000001']);assert.equal(M.filter(rows,{sort:'priceDesc'}).at(-1).asin,'B000000002');assert.equal(M.filter(rows,{knownOnly:true}).length,2);assert.equal(M.filter(rows,{query:'b000000003'}).length,1);});
test('estimates require explicit reference data and a compatible parent category; no invented default unit sales',()=>{const item=p(1),model={enabled:true,anchorRank:100000,anchorSales:40,exponent:1,royalty:2};assert.equal(M.estimate(item,{enabled:false}),null);assert.equal(M.estimate(item,{enabled:true}),null);assert.equal(M.estimate(p(2,{bsrCategory:"Boys' Novelty T-Shirts"}),model),null);const e=M.estimate(item,model);assert.equal(e.units,160);assert.equal(e.low,80);assert.equal(e.high,320);assert.equal(e.royalties,320);});
test('keyword hunter uses actual title phrases in the eligible filtered sample and counts products once',()=>{const rows=[p(1),p(2,{title:'Hiking Adventure Hiking Adventure Tee'}),p(3,{bsr:200000}),p(4,{bsr:null})];const terms=M.keywords(rows,{maxBsr:100000,size:'2'});const t=terms.find(t=>t.term==='hiking adventure');assert.equal(t.count,2);assert.equal(t.medianBsr,25000);assert.equal(terms.some(t=>t.term.includes('shirt')),false);});
test('CSV parses quoted commas, escaped quotes and CRLF; exports protect spreadsheet formulas',()=>{const rows=M.parseCSV('asin,title,price\r\nB000000001,"Cat, \"\"Hi\"\"",19.99\r\n');assert.equal(rows[0].title,'Cat, "Hi"');assert.throws(()=>M.parseCSV('a,b\n"bad'),/Unclosed/);assert.ok(M.csv([{title:'=HYPERLINK("x")'}],['title']).includes("'=HYPERLINK"));});

test('legacy products without badge evidence never enter results or keyword research; badge lower bounds survive imports',()=>{
 const old=p(1,{boughtPastMonthLabel:null,boughtPastMonthMin:500}),good=p(2,{boughtPastMonthLabel:'1K+ bought in past month',boughtPastMonthMin:1});
 assert.equal(M.hasBadge(old),false);assert.equal(good.boughtPastMonthMin,1000);assert.equal(M.filter([old,good]).length,1);assert.ok(M.keywords([old,good]).every(term=>term.count===1));
 assert.equal(M.hasBadge(p(3,{boughtPastMonthLabel:'50+ bought in past week'})),false);
 const csv=M.csv([good],['asin','title','boughtPastMonthLabel','boughtPastMonthMin']);const imported=M.normalize(M.parseCSV(csv)[0]);assert.equal(imported.boughtPastMonthMin,1000);assert.equal(imported.boughtPastMonthLabel,'1K+ bought in past month');
});

test('monthly badge thresholds combine with all other filters and support numeric sorting',()=>{
 const rows=[p(1),p(2,{price:22,boughtPastMonthLabel:'1K+ bought in past month'}),p(3,{price:18,rating:4.8,reviewCount:20,boughtPastMonthLabel:'100+ bought in past month'}),p(4,{boughtPastMonthLabel:null})];
 assert.deepEqual(Array.from(M.filter(rows,{minMonthly:100,maxMonthly:500,maxPrice:20,minRating:4.5,maxReviews:25,query:'hiking'}),p=>p.asin),['B000000003']);
 assert.deepEqual(Array.from(M.filter(rows,{sort:'monthly'}),p=>p.boughtPastMonthMin),[1000,100,50]);
 assert.equal(M.filter(rows,{minMonthly:1000,maxMonthly:1000}).length,1);assert.equal(M.filter(rows,{maxMonthly:25}).length,0);
});
test('excluded brands stay excluded from saved/imported products and keyword extraction',()=>{
 for(const brand of M.excludedBrands){const item=p(1,{brand});assert.equal(M.filter([item]).length,0,brand);assert.equal(M.filter([item],{savedOnly:true},new Set([item.asin])).length,0);assert.equal(M.keywords([item]).length,0);}
 for(const title of ['Spider-Man Shirt','K-Pop Demon Hunters Tee','Dr. Seuss Shirt'])assert.equal(M.filter([p(1,{title})]).length,0);
 assert.equal(M.filter([p(1,{title:'Marvelous Camping Shirt'})]).length,1);
});

test('independent keyword hunting needs purchase badges but not BSR; optional filters apply when entered',()=>{
 const rows=[p(1,{title:'Forest Hiking Adventure Shirt',bsr:null}),p(2,{title:'Forest Hiking Adventure Tee',bsr:null,boughtPastMonthLabel:'200+ bought in past month'}),p(3,{title:'Forest Hiking Adventure Tee',bsr:null,brand:'Peanuts'}),p(4,{title:'Forest Hiking Adventure Shirt',boughtPastMonthLabel:null})];
 const term=M.keywords(rows,{size:'2'}).find(t=>t.term==='forest hiking');assert.equal(term.count,2);assert.equal(term.medianBsr,null);assert.equal(term.medianMonthly,125);assert.equal(Number.isFinite(term.score),true);assert.equal(M.keywords(rows,{maxBsr:100000}).length,0);assert.equal(M.keywords(rows,{minMonthly:200,size:'2'}).find(t=>t.term==='forest hiking').count,1);
});

test('keyword results contain only two-to-five-word phrases, including when a legacy caller requests singles',()=>{
 for(const size of ['all','1','2','3','4','5',0,99]){const terms=M.keywords([p(1,{title:'Mountain Forest Hiking Adventure Camping Nature Shirt'})],{size});assert.ok(terms.length);for(const term of terms){const count=term.term.split(' ').length;assert.ok(count>=2&&count<=5,term.term);if(['2','3','4','5'].includes(String(size)))assert.equal(count,Number(size));}}
});
test('new result batches append after existing matches even if they rank ahead under the selected sort',()=>{
 const a=p(1,{price:20}),b=p(2,{price:30}),c=p(3,{price:10});const first=M.filter([a,b],{sort:'price'}),second=M.filter([a,b,c],{sort:'price'});
 const appended=M.appendOrder(second,first.map(p=>p.asin));assert.deepEqual(Array.from(appended,p=>p.asin),[a.asin,b.asin,c.asin]);assert.deepEqual(Array.from(M.appendOrder(second,[]),p=>p.asin),[c.asin,a.asin,b.asin]);assert.deepEqual(Array.from(M.appendOrder([b,c],[a.asin,b.asin]),p=>p.asin),[b.asin,c.asin]);assert.equal(M.appendOrder([a,a,b],[]).length,2);
});
test('requested musicians and brands are excluded with punctuation, accent and typo variants',()=>{
 for(const name of ['Justin Bieber','Justin Beiber','Pokemon','Pokémon','Third Eye Blind','Third Eye Blink','Hot Wheels','HotWheels','Jurassic Park','Jurassic World','Sesame Street','Coca-Cola','Coca Cola','CocaCola','Barbie','Metallica','Mettalica','Metalica','The Legend of Zelda','Legend of Zelda','Zelda'])assert.equal(M.filter([p(1,{title:name+' Adventure Shirt'})]).length,0,name);
 assert.equal(M.filter([p(1,{title:'Mountain Adventure Shirt',brand:'Coca-Cola Company'})]).length,0);assert.equal(M.filter([p(1,{title:'Hot Wilderness Adventure Shirt'})]).length,1);
});
