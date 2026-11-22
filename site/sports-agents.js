(() => {
 const sports = {
  football: ['Football', 'campus tailgate football', 'football student section', 'football watch party'],
  basketball: ['Basketball', 'campus basketball game day', 'basketball student section', 'basketball watch party'],
  baseball: ['Baseball', 'campus baseball game day', 'baseball bleacher fan', 'baseball watch party'],
  soccer: ['Soccer', 'campus soccer game day', 'soccer supporter section', 'soccer watch party'],
  volleyball: ['Volleyball', 'campus volleyball game day', 'volleyball student section', 'volleyball fan'],
 };
 const palettes = {
  'night-game': { shirt:'#202933', ink:'#FFF1D6', accent:'#FF9361', intent:'Cream lettering carries the message against the dark shirt. Coral gives the sport graphic the warmth of a crowded game night.' },
  'weekend': { shirt:'#F4EEE3', ink:'#223B39', accent:'#974638', intent:'Deep teal keeps the words readable on cream. Brick red gives the graphic the warmth of a shared weekend ritual.' },
  'clubhouse': { shirt:'#25233A', ink:'#F5E7FF', accent:'#8DD6BE', intent:'Pale lavender makes the wording legible. Mint gives the central graphic a lively accent against the dark shirt.' },
 };
 const slogans={
  football:[['Kickoff Starts In The Parking Lot','Save Me A Spot At Kickoff'],['Bleachers Shake When We Stand','I Lost My Voice At Kickoff'],['My Couch Calls The Plays','Fourth Downs With The Crew']],
  basketball:[['Tipoff Is Our Study Break','Meet Me Courtside After Class'],['Bleachers Remember Every Buzzer','Our Row Stands For Overtime'],['My Couch Has Courtside Energy','Overtime With My Favorite People']],
  baseball:[['Class Ends At First Pitch','Meet Me Under Ballpark Lights'],['Bleachers Are My Weekend Seats','Save Our Row For Extra Innings'],['Extra Innings On The Couch','The Living Room Keeps Score']],
  soccer:[['Lecture Ends Before Kickoff','Meet Me By The Touchline'],['The Stands Sing Past Ninety','Our Row Roars At Stoppage Time'],['My Couch Is The Touchline','Ninety Minutes With My People']],
  volleyball:[['First Serve After Class','Meet Me Where The Gym Echoes'],['Our Row Cheers Every Rally','Bleachers Shake At Match Point'],['I Count Rallies With Friends','One More Set With The Crew']],
 };
 const moods=[
  {palette:'weekend',layout:'stack',emotion:'Recall the ritual of meeting friends before the game.'},
  {palette:'night-game',layout:'split',emotion:'Bring back the feeling of cheering in the stands together.'},
  {palette:'clubhouse',layout:'stack',emotion:'Celebrate the friends who make watching the game a tradition.'},
 ];
 function wording(value){return value.toLowerCase().replace(/[^a-z ]/g,' ').replace(/ +/g,' ').trim();}
 function repeats(slogan,rejected){
  const candidate=' '+wording(slogan)+' ';
  return rejected.some(mark=>wording(mark)&&candidate.includes(' '+wording(mark)+' '));
 }
 function browserDesign(sport,niche,rejected,previous) {
  const group=sports[sport].indexOf(niche.query)-1;
  const order=[group,(group+1)%3,(group+2)%3];
  const candidates=order.flatMap(i=>slogans[sport][i].map(slogan=>({...moods[group],slogan})))
   .filter(draft=>!repeats(draft.slogan,rejected));
  const draft=candidates.find(candidate=>candidate.slogan!==previous)||candidates[0];
  if(!draft)throw Error('No more slogans are available for this opportunity after screening. Choose another opportunity or sport.');
  return draft;
 }
 function opportunity(query, rows) {
  const M = SparkResearchModel;
  const products = [...new Map(rows.map(M.normalize).filter(p=>p&&M.hasBadge(p)&&!M.excludedBrand(p)).map(p=>[p.asin,p])).values()]
   .sort((a,b)=>b.boughtPastMonthMin-a.boughtPastMonthMin||a.asin.localeCompare(b.asin));
  return { query, products, median:M.median(products.map(p=>p.boughtPastMonthMin)) };
 }
 function validate(raw) {
  const draft=JSON.parse(raw.trim().replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/i,'$1'));
  if (!draft || typeof draft.slogan!=='string' || !/^([A-Za-z]+ ){1,6}[A-Za-z]+$/.test(draft.slogan) || draft.slogan.length>55
   || !Object.hasOwn(palettes,draft.palette) || !['stack','split'].includes(draft.layout)
   || typeof draft.emotion!=='string' || !draft.emotion.trim() || draft.emotion.length>280) throw Error('The AI returned an invalid design. Try generating it again.');
  return draft;
 }
 const guardrails='Use generic campus sports rituals and fan belonging. Avoid team, university, conference, athlete and brand names, nicknames, initials, existing chants, slogans, mascot references, official colorways, logos, uniforms, copied artwork and any suggestion of official affiliation. Only original wording, with a generic sport symbol drawn by the app.';
 async function aiDesign(sport, niche, rejected, prior) {
  // Start the session from the button click so Chrome can authorize a model download.
  if(!globalThis.LanguageModel)throw Error('Chrome’s on-device AI is unavailable in this browser. Try the latest desktop Chrome with Prompt API support.');
  const session=await LanguageModel.create({initialPrompts:[{role:'system',content:'You are an original T-shirt designer for college students and sports fans. Follow the supplied IP restrictions. Return only a JSON object with slogan (2 to 7 plain English words, maximum 55 letters and spaces), palette (night-game, weekend, or clubhouse), layout (stack or split), emotion (one short sentence describing the intended connection to the audience).'}]});
  try {
   return validate(await session.prompt(JSON.stringify({sport,niche:niche.query,demand:{sampleSize:niche.products.length,medianBadgeThreshold:niche.median},guardrails,wordingToAvoid:rejected,screeningFeedback:prior,layoutNotes:'Stack puts the words above the symbol. Split puts words on both sides vertically. Choose for quick thumbnail readability.'})));
  } finally { session.destroy(); }
 }
 function png(sport,draft) {
  return new Promise((resolve,reject)=>{
   const source=URL.createObjectURL(new Blob([artwork(sport,draft)],{type:'image/svg+xml'})),img=new Image();
   img.onload=()=>{
    URL.revokeObjectURL(source);
    const canvas=document.createElement('canvas');canvas.width=4500;canvas.height=5400;
    const context=canvas.getContext('2d');
    if(!context){reject(Error('Image export is unavailable in this browser.'));return;}
    context.drawImage(img,0,(canvas.height-3986)/2,canvas.width,3986);
    canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Could not export the PNG.')),'image/png');
   };
   img.onerror=()=>{URL.revokeObjectURL(source);reject(Error('Could not render the PNG.'));};
   img.src=source;
  });
 }
 const symbols={
  football:'<ellipse rx="115" ry="66" transform="rotate(-28)"/><path d="M-55 28 55-28M-36 1l16 30M-8-13l16 30M20-27l16 30"/>',
  basketball:'<circle r="88"/><path d="M-88 0H88M0-88V88M-70-53Q30 0-70 53M70-53Q-30 0 70 53"/>',
  baseball:'<circle r="88"/><path d="M-70-53Q-10 0-70 53M70-53Q10 0 70 53M-70-33l28-8m-20 41h28m-36 33 28 8m112-74-28-8m20 41H34m36 33-28 8"/>',
  soccer:'<circle r="88"/><path d="M0-36 34-13 21 29H-21L-34-13ZM0-36V-88M34-13l50-15M21 29l31 42M-21 29l-31 42M-34-13l-50-15"/>',
  volleyball:'<circle r="88"/><path d="M0 0Q0-48 58-66M0 0Q47 32 18 86M0 0Q-50 29-84 23M-29 11Q-35-48 25-84M26 9q45 20 29 60M-2-30q-53 28-74 5"/>',
 };
 function artwork(sport,draft,background=false) {
  const {ink,accent,shirt}=palettes[draft.palette];
  const words=draft.slogan.toUpperCase().split(' ');
  const pivot=Math.ceil(words.length/2), lines=[words.slice(0,pivot).join(' '),words.slice(pivot).join(' ')];
  const ys=draft.layout==='split'?[120,540]:[120,210];
  const type=lines.map((line,i)=>`<text x="350" y="${ys[i]}" font-size="${Math.min(82,Math.floor(600/Math.max(line.length*.76,1)))}">${line}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 620" width="4500" height="3986" role="img" aria-label="Sports shirt concept">${background?`<rect width="700" height="620" fill="${shirt}"/>`:''}<g fill="${ink}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900">${type}</g><g transform="translate(350 ${draft.layout==='split'?320:420}) scale(1.42)" fill="none" stroke="${accent}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">${symbols[sport]}</g></svg>`;
 }
 function mount({request,sourceUrl,beginSearch,endSearch,canDesign,node,date}) {
  const $=id=>document.getElementById(id), status=$('sports-status'), list=$('sports-results'), output=$('sports-design-output');
  const picker=$('sports-opportunity'), scan=$('sports-scan'), generate=$('sports-design');
  let opportunities=[],sport,rejected=[],prior='',previous='';
  function controls(busy) {
   scan.disabled=busy;$('sports-mode').disabled=busy;$('sports-type').disabled=busy;picker.disabled=busy||!opportunities.length;generate.disabled=picker.disabled;
  }
  function link(text,url) {
   const a=node('a',text);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;
  }
  function resetDesign(){output.replaceChildren();rejected=[];prior='';previous='';}
  picker.onchange=()=>{resetDesign();status.textContent='Opportunity selected. Generate a draft and screen its wording.';};
  $('sports-form').onsubmit=async event=>{
   event.preventDefault();
   if(!beginSearch())return;
   const key=$('sports-type').value;
   sport=key;opportunities=[];picker.replaceChildren();list.replaceChildren();resetDesign();controls(true);
   let failure='';
   try {
    for(const query of sports[key].slice(1)) {
     status.textContent='Searching Amazon for '+query+' shirts…';
     const url=SparkResearchModel.searchLink(sourceUrl().href,query);
     const result=await request('SPARK_RESEARCH_SEARCH',{url,purpose:'keywords'});
     if(result.needsPermission)throw Error('Enable Amazon.com research in Spark extension settings.');
     const item=opportunity(query,result.products);
     if(item.products.length)opportunities.push(item);
    }
   } catch(error){failure=error.message;}
   finally {
    opportunities.sort((a,b)=>b.median-a.median||b.products.length-a.products.length||a.query.localeCompare(b.query));
    status.textContent=(failure?'Scan incomplete. '+failure+' ':'')+(opportunities.length?'Ranked '+opportunities.length+' niches by median badge threshold.':'No badge-bearing shirts found in the completed searches.');
    for(const item of opportunities){
     const li=node('li'), strongest=item.products[0];
     li.append(node('strong',item.query),node('p',item.median.toLocaleString('en-US')+' median badge threshold · '+item.products.length+' qualifying listings'));
     li.append(link(strongest.boughtPastMonthLabel+' · Amazon listing',strongest.url),node('small',' Observed '+date(strongest.boughtPastMonthObservedAt)));
     list.append(li);
     const option=node('option',item.query);option.value=String(picker.options.length);picker.append(option);
    }
    endSearch();controls(false);
   }
  };
  generate.onclick=async()=>{
   const selected=opportunities[Number(picker.value)];
   if(!selected)return;
   if(!canDesign()){status.textContent='Reload the updated Merch Spark extension and refresh this page to enable apparel wording screening.';return;}
   controls(true);output.replaceChildren();
   try{
    const useAI=$('sports-mode').value==='ai';
    let draft, fallback=false;
    if(useAI){
     status.textContent='Chrome AI is drafting wording and choosing a palette…';
     try{
      draft=await aiDesign(sports[sport][0],selected,rejected,prior);
      if(repeats(draft.slogan,rejected))throw Error('Draft repeats flagged wording.');
     }catch{draft=undefined;fallback=true;}
    }
    if(!draft)draft=browserDesign(sport,selected,rejected,previous);
    previous=draft.slogan;
    const fallbackMessage='Chrome AI did not produce a usable draft. Spark prepared a browser-generated design. ';
    status.textContent=(fallback?fallbackMessage:'')+'Checking the proposed wording with the USPTO…';
    output.append(node('h3',draft.slogan));
    if(fallback)output.append(node('p',fallbackMessage.trim()));
    const screen= (await request('SPARK_RESEARCH_TRADEMARK',{phrase:draft.slogan})).screen;
    output.append(node('p','Live US apparel records searched for '+screen.terms.join(', ')+'. Checked '+date(Date.parse(screen.retrievedAt))+'.'));
    if(screen.matchCount||screen.partial){
     prior=screen.matchCount?'The preliminary search found possible conflicts. Use entirely different wording.':'The last screening was incomplete. Use different wording for a new check.';
     rejected.push(draft.slogan,...screen.matches.map(m=>m.mark));
     status.textContent=prior;
     for(const match of screen.matches)output.append(link(match.mark+' · USPTO record', 'https://tsdr.uspto.gov/#caseNumber='+match.serial+'&caseSearchType=US_APPLICATION&caseType=DEFAULT&searchType=status'),node('br'));
     return;
    }
    status.textContent='Draft ready for review. No live matches in the limited US apparel wording search.';
    const art=node('div',null,'sports-art');
    // This markup uses only validated ASCII wording and app-owned drawing primitives.
    art.innerHTML=artwork(sport,draft,true);
    output.append(art,node('p',draft.emotion),node('p',palettes[draft.palette].intent),node('p',draft.layout==='split'?'The symbol sits between two lines of type, keeping the print balanced.':'Stacked lettering reads first, with the sport symbol as the second focal point.'));
    output.append(node('p','Artwork provenance: original app-drawn sport geometry with system typography. Review similar marks, visual references, rights of publicity and licensing before listing.'));
    const download=node('button','Download transparent PNG','btn');
    download.onclick=async()=>{
     download.disabled=true;
     try{
      const url=URL.createObjectURL(await png(sport,draft)),a=node('a');
      a.href=url;a.download='merch-spark-sports-concept.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
     }catch(error){status.textContent=error.message;}
     finally{download.disabled=false;}
    };
    output.append(download);
   } catch(error){status.textContent=error.message;}
   finally{controls(false);}
  };
  controls(false);
 }
 globalThis.SparkSportsAgents={mount};
})();
