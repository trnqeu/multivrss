/* global window */
// MultivRSS reader corpus — categories mirror the user's staging sidebar.

const CATS = [
  { key:'CULTURE', name:'Culture', count:42, sources:['LONGREADS','THE PARIS REVIEW','AEON','GUARDIAN › BOOKS'] },
  { key:'HUMOR',   name:'Humor',   count:18, sources:["MCSWEENEY'S",'THE ONION'] },
  { key:'MUSIC',   name:'Music',   count:54, sources:['PITCHFORK','BANDCAMP DAILY','STEREOGUM','NPR MUSIC'] },
  { key:'NEWS',    name:'News',    count:117,sources:['NYT › WORLD','REUTERS'] },
  { key:'PODCAST', name:'Podcast', count:33, sources:['THE EZRA KLEIN SHOW','HARDCORE HISTORY','99% INVISIBLE'] },
  { key:'SCIENCE', name:'Science', count:26, sources:['QUANTA MAGAZINE'] },
];

// FOR YOU ribbon — a few strong cross-category picks.
const FORYOU = [
  { cat:'PODCAST', src:'THE EZRA KLEIN SHOW', title:'Why the far right is thriving across the globe', chip:'YOU SAVED 3 SIMILAR' },
  { cat:'SCIENCE', src:'QUANTA MAGAZINE', title:'The mathematician who classified every symmetry', chip:'LIKE 4 YOU FINISHED' },
  { cat:'CULTURE', src:'LONGREADS', title:'Attention is not a resource to be spent', chip:'LIKE “DEEP WORK”' },
  { cat:'MUSIC', src:'PITCHFORK', title:'The quiet resurgence of the album as a form', chip:'YOU READ WEEKLY' },
];

// Per-category "section front": a lead + a list of rows.
const SECTIONS = {
  CULTURE: {
    lead:{ title:'The last great magazine editors, remembered', dek:'A generation that built the long read is retiring. What their sensibility taught a century of writers — and what replaces it now.', src:'THE PARIS REVIEW', date:'Jul 5', min:'14 MIN' },
    rows:[
      { title:'Attention is not a resource to be spent', src:'LONGREADS', date:'Jul 5' },
      { title:'Against the tyranny of the to-do list', src:'AEON', date:'Jul 4' },
      { title:'The novelists who refused to explain themselves', src:'GUARDIAN › BOOKS', date:'Jul 4' },
      { title:'On rereading the books that formed you', src:'THE PARIS REVIEW', date:'Jul 3' },
      { title:'The slow death, and slower revival, of the essay', src:'LONGREADS', date:'Jul 3' },
    ],
  },
  HUMOR: {
    lead:{ title:'I am the productivity guru your feed warned you about', dek:'A morning routine so optimized it no longer contains any actual work, only the anticipation of it.', src:"MCSWEENEY'S", date:'Jul 5', min:'4 MIN' },
    rows:[
      { title:'Man who read one systems book now redesigning your kitchen', src:'THE ONION', date:'Jul 5' },
      { title:'Report: your RSS reader has feelings about your unread count', src:"MCSWEENEY'S", date:'Jul 4' },
      { title:'Local feed declared bankruptcy, 4,000 items outstanding', src:'THE ONION', date:'Jul 3' },
    ],
  },
  MUSIC: {
    lead:{ title:'The quiet resurgence of the album as a form', dek:'Streaming was supposed to kill the album. Instead a wave of artists is using the 40-minute canvas more deliberately than ever.', src:'PITCHFORK', date:'Jul 5', min:'9 MIN' },
    rows:[
      { title:'Bandcamp Fridays and the economics of caring', src:'BANDCAMP DAILY', date:'Jul 5' },
      { title:'The reissue label preserving a lost decade of jazz', src:'STEREOGUM', date:'Jul 4' },
      { title:'How a public-radio session becomes a career', src:'NPR MUSIC', date:'Jul 4' },
      { title:'The producers quietly bringing back the B-side', src:'PITCHFORK', date:'Jul 3' },
      { title:'Field recordings are the new ambient', src:'BANDCAMP DAILY', date:'Jul 2' },
    ],
  },
  NEWS: {
    lead:{ title:'Vance issues blunt warning as cease-fire holds by a thread', dek:'The vice president rebuked critics of the agreement as monitors reported the first quiet night in weeks along the contested border.', src:'NYT › WORLD', date:'Jul 5', min:'6 MIN' },
    rows:[
      { title:'Central banks signal a slower path on rate cuts', src:'REUTERS', date:'Jul 5' },
      { title:'Star-studded ceremony welcomes Obama Center to Chicago', src:'NYT › WORLD', date:'Jul 4' },
      { title:'Inside the negotiation that nearly collapsed twice', src:'NYT › WORLD', date:'Jul 4' },
      { title:'Shipping insurers reprice risk across the strait', src:'REUTERS', date:'Jul 3' },
      { title:'A fragile calm settles over the capital', src:'NYT › WORLD', date:'Jul 3' },
    ],
  },
  PODCAST: {
    lead:{ title:'Why the far right is thriving across the globe', dek:'It was possible to see the first election as a fluke. After this one, it is clear we are living in a new era — and here is what it asks of us.', src:'THE EZRA KLEIN SHOW', date:'Jul 5', min:'71 MIN' },
    rows:[
      { title:'#498 — Anthony Kaldellis: the Roman Empire, reconsidered', src:'HARDCORE HISTORY', date:'Jul 4' },
      { title:'The hidden design of the sidewalk beneath you', src:'99% INVISIBLE', date:'Jul 3' },
      { title:'This conversation will change how you think about trauma', src:'THE EZRA KLEIN SHOW', date:'Jul 2' },
    ],
  },
  SCIENCE: {
    lead:{ title:'The mathematician who classified every symmetry', dek:'A decades-long effort to enumerate the finite simple groups produced a proof tens of thousands of pages long. Now a new generation is trying to make it legible.', src:'QUANTA MAGAZINE', date:'Jul 5', min:'11 MIN' },
    rows:[
      { title:'What a convolution really is, visually', src:'QUANTA MAGAZINE', date:'Jul 4' },
      { title:'The physics problem that broke the internet', src:'QUANTA MAGAZINE', date:'Jul 3' },
      { title:'Why some infinities are bigger than others', src:'QUANTA MAGAZINE', date:'Jul 2' },
    ],
  },
};

// Flat chronological river — mixed categories. id-stable for read/save state.
const RIVER = [
  { cat:'PODCAST', src:'THE EZRA KLEIN SHOW', date:'Jul 5', day:'JUL 5', title:'Why the far right is thriving across the globe', body:'It was possible to see the first election as a fluke — after this one it is clear we live in a new era', c:0, read:false },
  { cat:'NEWS', src:'NYT › WORLD', date:'Jul 5', day:'JUL 5', title:'Vance issues blunt warning as cease-fire holds by a thread', body:'The vice president rebuked critics of the agreement as monitors reported the first quiet night in weeks', c:0, read:false },
  { cat:'SCIENCE', src:'QUANTA MAGAZINE', date:'Jul 5', day:'JUL 5', title:'The mathematician who classified every symmetry', body:'A decades-long effort to enumerate the finite simple groups produced a proof tens of thousands of pages long', c:41, read:false },
  { cat:'CULTURE', src:'LONGREADS', date:'Jul 5', day:'JUL 5', title:'Attention is not a resource to be spent', body:'The economic metaphor we use for the mind quietly distorts how we live and work', c:12, read:false },
  { cat:'MUSIC', src:'PITCHFORK', date:'Jul 5', day:'JUL 5', title:'The quiet resurgence of the album as a form', body:'Streaming was supposed to kill the album; instead artists are using the 40-minute canvas more deliberately', c:8, read:false },
  { cat:'HUMOR', src:"MCSWEENEY'S", date:'Jul 5', day:'JUL 5', title:'I am the productivity guru your feed warned you about', body:'A morning routine so optimized it no longer contains any actual work, only the anticipation of it', c:0, read:false },
  { cat:'NEWS', src:'REUTERS', date:'Jul 5', day:'JUL 5', title:'Central banks signal a slower path on rate cuts', body:'Policymakers pushed back on market expectations, citing sticky services inflation and resilient labour data', c:0, read:false },
  { cat:'CULTURE', src:'THE PARIS REVIEW', date:'Jul 5', day:'JUL 5', title:'The last great magazine editors, remembered', body:'A generation that built the long read is retiring — what their sensibility taught a century of writers', c:5, read:false },
  { cat:'MUSIC', src:'BANDCAMP DAILY', date:'Jul 5', day:'JUL 5', title:'Bandcamp Fridays and the economics of caring', body:'How one recurring day rewired the way independent listeners think about paying for music', c:0, read:false },

  { cat:'PODCAST', src:'HARDCORE HISTORY', date:'Jul 4', day:'JUL 4', title:'#498 — Anthony Kaldellis: the Roman Empire, reconsidered', body:'A sweeping revision of the Byzantine centuries and why the label itself may mislead', c:0, read:true },
  { cat:'CULTURE', src:'AEON', date:'Jul 4', day:'JUL 4', title:'Against the tyranny of the to-do list', body:'The list promises control and quietly delivers a subtler kind of anxiety instead', c:31, read:false },
  { cat:'NEWS', src:'NYT › WORLD', date:'Jul 4', day:'JUL 4', title:'Star-studded ceremony welcomes Obama Center to Chicago', body:'Former presidents, heads of state and celebrities converged on a lakefront park', c:34, read:false },
  { cat:'MUSIC', src:'STEREOGUM', date:'Jul 4', day:'JUL 4', title:'The reissue label preserving a lost decade of jazz', body:'Crate by crate, a small team is returning out-of-print sessions to the catalogue', c:0, read:false },
  { cat:'SCIENCE', src:'QUANTA MAGAZINE', date:'Jul 4', day:'JUL 4', title:'What a convolution really is, visually', body:'A ground-up picture of the operation that quietly powers modern machine learning', c:22, read:true },
  { cat:'HUMOR', src:'THE ONION', date:'Jul 4', day:'JUL 4', title:'Man who read one systems book now redesigning your kitchen', body:'Sources confirm the whiteboard has appeared and is not going anywhere', c:0, read:false },
  { cat:'MUSIC', src:'NPR MUSIC', date:'Jul 4', day:'JUL 4', title:'How a public-radio session becomes a career', body:'The small room, the single take, and the long tail of a well-timed performance', c:0, read:false },
  { cat:'CULTURE', src:'GUARDIAN › BOOKS', date:'Jul 4', day:'JUL 4', title:'The novelists who refused to explain themselves', body:'On the enduring appeal of the writer who leaves the reader to do the work', c:9, read:false },

  { cat:'PODCAST', src:'99% INVISIBLE', date:'Jul 3', day:'JUL 3', title:'The hidden design of the sidewalk beneath you', body:'Curb cuts, tactile paving and a century of decisions you never noticed', c:0, read:false },
  { cat:'NEWS', src:'REUTERS', date:'Jul 3', day:'JUL 3', title:'Shipping insurers reprice risk across the strait', body:'Premiums jumped as underwriters recalculated exposure along a critical trade route', c:0, read:true },
  { cat:'SCIENCE', src:'QUANTA MAGAZINE', date:'Jul 3', day:'JUL 3', title:'The physics problem that broke the internet', body:'A deceptively simple puzzle that hides a century of argument underneath', c:57, read:false },
  { cat:'CULTURE', src:'LONGREADS', date:'Jul 3', day:'JUL 3', title:'The slow death, and slower revival, of the essay', body:'Declared dead every decade, the form keeps outliving its obituaries', c:6, read:false },
  { cat:'MUSIC', src:'PITCHFORK', date:'Jul 3', day:'JUL 3', title:'The producers quietly bringing back the B-side', body:'What gets left off the record, and why it is suddenly worth releasing again', c:0, read:false },
  { cat:'HUMOR', src:'THE ONION', date:'Jul 3', day:'JUL 3', title:'Local feed declared bankruptcy, 4,000 items outstanding', body:'The reader in question could not be reached, having marked itself as read', c:0, read:true },
  { cat:'PODCAST', src:'THE EZRA KLEIN SHOW', date:'Jul 2', day:'JUL 2', title:'This conversation will change how you think about trauma', body:'A clinician on what a decade of research has quietly overturned', c:0, read:false },
  { cat:'MUSIC', src:'BANDCAMP DAILY', date:'Jul 2', day:'JUL 2', title:'Field recordings are the new ambient', body:'Artists are trading synthesizers for the sound of a specific place at a specific hour', c:0, read:false },
  { cat:'SCIENCE', src:'QUANTA MAGAZINE', date:'Jul 2', day:'JUL 2', title:'Why some infinities are bigger than others', body:'Cantor’s diagonal, revisited for anyone who bounced off it the first time', c:18, read:true },
  { cat:'CULTURE', src:'THE PARIS REVIEW', date:'Jul 2', day:'JUL 2', title:'On rereading the books that formed you', body:'The novel does not change; you do, and the gap is where the meaning lives', c:0, read:false },
];

function catCount(key){ return RIVER.filter(x => x.cat === key).length; }

window.RD = { CATS, FORYOU, SECTIONS, RIVER, catCount };
