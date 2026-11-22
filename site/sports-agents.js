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
  draft.direction=typeof draft.direction==='string'?draft.direction.trim().slice(0,350):'';
  return draft;
 }
 function imageBrief(sport,niche,draft) {
  const {ink,accent,shirt,intent}=palettes[draft.palette];
  return [
   'Create one original, text-free illustration for the central chest print of a collegiate '+sport.toLowerCase()+' fan T-shirt.',
   'Audience: college students and fans interested in '+niche.query+'. Emotional goal: '+draft.emotion,
   draft.direction ? 'Designer art direction: '+draft.direction : 'Depict one recognizable '+sport.toLowerCase()+' object and a game-day gesture from that niche. Use an editorial sports illustration style, bold contours, and a single strong silhouette.',
   'Use '+ink+' and '+accent+' as the ink colors for contrast on a '+shirt+' shirt. '+intent,
   'Make the artwork readable at thumbnail size. Center it in a landscape format, leave a small transparent margin, and use flat spot colors with clean edges. Export a transparent PNG.',
   'Deliver the isolated illustration only. Omit lettering, numbers, mockups, garments, rectangular backdrops, gradients, and fine texture. Spark will add the screened slogan as separate typography.',
   'Use fictional generic equipment and scenes. Exclude real teams, schools, players, mascots, likenesses, logos, existing artwork, and recognizable uniforms or trade dress.',
  ].join('\n\n');
 }
 const guardrails='Use generic campus sports rituals and fan belonging. Avoid team, university, conference, athlete and brand names, nicknames, initials, existing chants, slogans, mascot references, official colorways, logos, uniforms, copied artwork and any suggestion of official affiliation. Use original wording and unbranded imagery.';
 async function aiDesign(sport, niche, rejected, prior) {
  // Start the session from the button click so Chrome can authorize a model download.
  if(!globalThis.LanguageModel)throw Error('Chrome’s on-device AI is unavailable in this browser. Try the latest desktop Chrome with Prompt API support.');
  const session=await LanguageModel.create({initialPrompts:[{role:'system',content:'You are a senior fashion graphics designer specializing in screen-printed sports T-shirts for college students and fans. Build the concept around a specific fan ritual, group belonging or game-day memory. Choose a clear visual hierarchy and contrast for small storefront thumbnails. Treat audience appeal as a design hypothesis. Follow the supplied IP restrictions. Return only a JSON object with slogan (2 to 7 plain English words, maximum 55 letters and spaces), palette (night-game, weekend, or clubhouse), layout (stack or split), emotion (one short sentence describing the intended connection to the audience), and direction (one short sentence describing a distinctive subject, pose and illustration style without text or brands).'}]});
  try {
   return validate(await session.prompt(JSON.stringify({sport,niche:niche.query,demand:{sampleSize:niche.products.length,medianBadgeThreshold:niche.median},guardrails,wordingToAvoid:rejected,screeningFeedback:prior,layoutNotes:'Stack puts the words above the symbol. Split puts words on both sides vertically. Choose for quick thumbnail readability.'})));
  } finally { session.destroy(); }
 }
 function png(sport,draft,illustration) {
  return new Promise((resolve,reject)=>{
   const source=URL.createObjectURL(new Blob([artwork(sport,draft,false,illustration)],{type:'image/svg+xml'})),img=new Image();
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
 function artwork(sport,draft,background=false,illustration=null) {
  const {ink,accent,shirt}=palettes[draft.palette];
  const words=draft.slogan.toUpperCase().split(' ');
  const pivot=Math.ceil(words.length/2), lines=[words.slice(0,pivot).join(' '),words.slice(pivot).join(' ')];
  const ys=draft.layout==='split'?[120,540]:[120,210];
  const type=lines.map((line,i)=>`<text x="350" y="${ys[i]}" font-size="${Math.min(82,Math.floor(600/Math.max(line.length*.76,1)))}">${line}</text>`).join('');
  const graphic=illustration
   ? `<image x="85" y="${draft.layout==='split'?155:245}" width="530" height="${draft.layout==='split'?275:310}" href="${illustration}"/>`
   : `<g transform="translate(350 ${draft.layout==='split'?320:420}) scale(1.42)" fill="none" stroke="${accent}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">${symbols[sport]}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 620" width="4500" height="3986" role="img" aria-label="Sports shirt concept">${background?`<rect width="700" height="620" fill="${shirt}"/>`:''}<g fill="${ink}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900">${type}</g>${graphic}</svg>`;
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
    let illustration=null;
    const brief=node('textarea');
    brief.value=imageBrief(sports[sport][0],selected,draft);
    brief.readOnly=true;brief.rows=8;brief.setAttribute('aria-label','Image generator brief');
    const copy=node('button','Copy image brief','btn');
    copy.onclick=async()=>{
     try{await navigator.clipboard.writeText(brief.value);status.textContent='Image brief copied.';}
     catch{brief.focus();brief.select();status.textContent='The brief is selected. Use your browser’s copy command.';}
    };
    const imageBox=node('section',null,'sports-image-workflow');
    const fileLabel=node('label','Import the generated PNG');
    const file=node('input');file.type='file';file.accept='image/png';fileLabel.append(file);
    const reviewLabel=node('label');
    const review=node('input');review.type='checkbox';reviewLabel.append(review,document.createTextNode(' I reviewed the illustration for text, logos, likenesses, and copied art.'));
    reviewLabel.hidden=true;
    const clear=node('button','Remove illustration','btn');clear.hidden=true;
    imageBox.append(node('h3','Generate an illustration with AI'),node('p','Copy the brief into your image generator. Save the artwork as a transparent PNG, then import it here. Spark adds the screened slogan.'),brief,copy,fileLabel,reviewLabel,clear);
    const imageStatus=node('p');imageStatus.setAttribute('role','status');imageBox.append(imageStatus);
    file.onchange=async()=>{
     const selectedFile=file.files?.[0];
     if(!selectedFile)return;
     if(selectedFile.type!=='image/png'||selectedFile.size>10*1024*1024){imageStatus.textContent='Choose a PNG no larger than 10 MB.';file.value='';return;}
     file.disabled=true;download.disabled=true;
     try{
      const data=await new Promise((resolve,reject)=>{
       const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(selectedFile);
      });
      if(!/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(data))throw Error('Invalid image data.');
      const preview=new Image();preview.src=data;await preview.decode();
      illustration=data;review.checked=false;reviewLabel.hidden=false;clear.hidden=false;
      art.innerHTML=artwork(sport,draft,true,illustration);
      imageStatus.textContent='Illustration added. Review the artwork before downloading.';
     }catch{imageStatus.textContent='Could not read that PNG. Try another file.';}
     finally{file.value='';file.disabled=false;download.disabled=!!illustration&&!review.checked;}
    };
    review.onchange=()=>{download.disabled=!!illustration&&!review.checked;};
    clear.onclick=()=>{
     illustration=null;review.checked=false;reviewLabel.hidden=true;clear.hidden=true;download.disabled=false;
     art.innerHTML=artwork(sport,draft,true);imageStatus.textContent='Illustration removed.';
    };
    // This markup uses only validated ASCII wording and app-owned drawing primitives.
    art.innerHTML=artwork(sport,draft,true);
    output.append(imageBox,art,node('p',draft.emotion),node('p',palettes[draft.palette].intent),node('p',draft.layout==='split'?'The symbol sits between two lines of type, keeping the print balanced.':'Stacked lettering reads first, with the sport symbol as the second focal point.'));
    output.append(node('p','Review similar marks, artwork sources, rights of publicity and licensing before listing. The wording check covers the slogan.'));
    const download=node('button','Download transparent PNG','btn');
    download.onclick=async()=>{
     download.disabled=true;
     try{
      const url=URL.createObjectURL(await png(sport,draft,illustration)),a=node('a');
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
