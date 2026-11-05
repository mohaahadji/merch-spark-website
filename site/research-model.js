/* Browser-local research math. Missing values stay unknown; estimates require explicit assumptions. */
(() => {
 const numeric=(v,min=0,max=Infinity)=>v!=null&&v!==''&&Number.isFinite(Number(v))&&Number(v)>=min&&Number(v)<=max?Number(v):null;
 function badge(value){const label=String(value||'').replace(/\s+/g,' ').trim(),m=label.match(/^([\d,]+(?:\.\d+)?)\s*([KM])?\s*\+\s+bought in (?:the\s+)?past month$/i);if(!m)return null;const min=Number(m[1].replace(/,/g,''))*({K:1000,M:1000000}[m[2]?.toUpperCase()]||1);return Number.isSafeInteger(min)&&min>0?{boughtPastMonthLabel:label,boughtPastMonthMin:min}:null;}
 const hasBadge=p=>{const b=badge(p.boughtPastMonthLabel);return !!b&&b.boughtPastMonthMin===p.boughtPastMonthMin;};
 function normalize(p){
  const aliases=Object.fromEntries(Object.entries(p||{}).map(([k,v])=>[k.toLowerCase().replace(/[^a-z]/g,''),v]));const get=(...keys)=>keys.map(k=>aliases[k]).find(v=>v!=null&&v!=='');
  const asin=String(get('asin')||'').toUpperCase(),title=String(get('title','producttitle')||'').trim();if(!/^[A-Z0-9]{10}$/.test(asin)||!title||/^(?:true|yes|1|sponsored)$/i.test(String(get('sponsored','ad')||'')))return null;
  const number=(v,min=0,max=Infinity)=>numeric(typeof v==='string'?v.replace(/[$,]/g,'').trim():v,min,max);
  const image=String(get('image','imageurl')||'');const observed=number(get('observedat'));
  const purchase=badge(get('boughtpastmonthlabel','purchasebadge'));
  return {asin,title:title.slice(0,500),boughtPastMonthLabel:purchase?.boughtPastMonthLabel||null,boughtPastMonthMin:purchase?.boughtPastMonthMin??null,boughtPastMonthObservedAt:purchase?number(get('boughtpastmonthobservedat'))||observed||Date.now():null,brand:String(get('brand')||'').slice(0,200),url:'https://www.amazon.com/dp/'+asin,image:/^https:\/\/(?:m\.media-amazon\.com|images-na\.ssl-images-amazon\.com)\//.test(image)?image:null,price:number(get('price')),rating:number(get('rating','stars'),0,5),reviewCount:number(get('reviewcount','reviews','ratings')),bsr:number(get('bsr','bestsellersrank'),1),bsrCategory:String(get('bsrcategory','category')||''),currency:'USD',imported:p.imported===true,sourceUrl:String(get('sourceurl')||''),searchPosition:number(get('searchposition')),observedAt:observed||Date.now(),detailsAt:number(get('detailsat')),sponsored:false,history:Array.isArray(p.history)?p.history.filter(h=>numeric(h?.at)&&numeric(h?.bsr,1)).slice(-30):[]};
 }
 function filter(products,f={},saved=new Set()){
  let rows=products.filter(p=>{
   if(!hasBadge(p))return false;
   if(f.savedOnly&&!saved.has(p.asin))return false;
   if(f.query&&!`${p.title} ${p.brand} ${p.asin}`.toLowerCase().includes(f.query.toLowerCase()))return false;
   for(const [field,min,max] of [['price',f.minPrice,f.maxPrice],['rating',f.minRating,''],['reviewCount',f.minReviews,f.maxReviews],['bsr',f.minBsr,f.maxBsr]]){
    if(min!==''&&min!=null&&(p[field]==null||p[field]<Number(min)))return false;
    if(max!==''&&max!=null&&(p[field]==null||p[field]>Number(max)))return false;
   }return !f.knownOnly||p.bsr!=null;
  });const [field,direction]=({bsr:['bsr',1],price:['price',1],priceDesc:['price',-1],reviews:['reviewCount',-1],stars:['rating',-1],newest:['observedAt',-1]})[f.sort]||['bsr',1];
  rows.sort((a,b)=>a[field]==null?b[field]==null?a.asin.localeCompare(b.asin):1:b[field]==null?-1:(a[field]-b[field])*direction||a.asin.localeCompare(b.asin));return rows;
 }
 const median=values=>{const a=values.filter(v=>v!=null&&Number.isFinite(v)).sort((a,b)=>a-b);return a.length?a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2:null;};
 function estimate(product,model){
  if(!model?.enabled||!numeric(model.anchorRank,1)||!numeric(model.anchorSales,1)||!numeric(model.exponent,.1,2)||!numeric(product.bsr,1)||!/^clothing(?:[,\s].*)?$|^fashion$/i.test(product.bsrCategory||''))return null;
  const units=Math.min(1000000,Number(model.anchorSales)*(Number(model.anchorRank)/product.bsr)**Number(model.exponent));
  return {units:Math.round(units),low:Math.floor(units*.5),high:Math.ceil(units*2),revenue:product.price==null?null:units*product.price,royalties:numeric(model.royalty)!=null?units*Number(model.royalty):null};
 }
 const baseStop=new Set('a an and are as at be by for from how i im in is it its me my of on or our that the their this to with you your shirt shirts tshirt tshirts t shirt t-shirts tee tees gift gifts men mens women womens kids boys girls unisex youth adult adults funny cool novelty cotton premium lightweight classic fit solid colors heather all other double needle sleeve bottom hem machine wash cold like dry low heat'.split(' '));
 function keywords(products,{maxBsr=100000,extra='',size='all'}={}){
  const stop=new Set([...baseStop,...extra.toLowerCase().split(/[,\n]/).map(s=>s.trim()).filter(Boolean)]),map=new Map();
  const eligible=products.filter(p=>hasBadge(p)&&p.bsr!=null&&p.bsr<=maxBsr&&/^clothing(?:[,\s].*)?$|^fashion$/i.test(p.bsrCategory||''));
  for(const p of eligible){const tokens=p.title.toLowerCase().match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu)||[],phrases=new Set();
   for(const n of size==='all'?[1,2,3]:[Number(size)])for(let i=0;i<=tokens.length-n;i++){const words=tokens.slice(i,i+n);if(words.some(w=>stop.has(w)||w.length<2)||stop.has(words.join(' ')))continue;phrases.add(words.join(' '));}
   for(const term of phrases){if(!map.has(term))map.set(term,[]);map.get(term).push(p);}
  }
  return [...map].map(([term,items])=>({term,count:items.length,medianBsr:median(items.map(p=>p.bsr)),medianReviews:median(items.map(p=>p.reviewCount)),averagePrice:items.filter(p=>p.price!=null).length?items.filter(p=>p.price!=null).reduce((sum,p)=>sum+p.price,0)/items.filter(p=>p.price!=null).length:null,score:items.reduce((sum,p)=>sum+1/Math.log10(p.bsr+10),0),asins:items.map(p=>p.asin)})).sort((a,b)=>b.score-a.score||a.medianBsr-b.medianBsr||a.term.localeCompare(b.term));
 }
 function parseCSV(text){let rows=[],row=[],cell='',quoted=false;text=String(text).replace(/^\uFEFF/,'');for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}if(quoted)throw Error('Unclosed quote in CSV.');row.push(cell);if(row.some(Boolean))rows.push(row);const header=rows.shift();if(!header)throw Error('The file is empty.');return rows.map(row=>Object.fromEntries(header.map((key,i)=>[key,row[i]??''])));}
 function csv(rows,fields){const cell=v=>{let s=String(v??'');if(/^[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};return '\uFEFF'+[fields.map(cell).join(','),...rows.map(row=>fields.map(key=>cell(row[key])).join(','))].join('\r\n');}
 globalThis.SparkResearchModel={normalize,filter,median,estimate,keywords,parseCSV,csv,badge,hasBadge};
})();
