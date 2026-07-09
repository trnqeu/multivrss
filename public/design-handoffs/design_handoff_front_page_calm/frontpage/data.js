/* global window */
// Sample corpus for the MultivRSS personalized "Front Page".
// Reflects the user's real categories (MIND, NEWS, SPORT, TECH, NEWSLETTERS, YOUTUBE).
//
// Each recommended item carries:
//   reason      — human copy explaining the pick
//   reasonType  — which engine surfaced it:
//       'source'  → affinity with a feed the user reads/saves from
//       'similar' → Meilisearch relevance: recent read/saved items used as the
//                   query, already-read & already-saved filtered out
//   affinity    — 0–100. For 'similar' = Meilisearch relevance score;
//                 for 'source' = strength of the source signal (read/save frequency).

const CATS = [
  { name: 'MIND',        count: 42,  sources: ['STANFORD ENC. PHIL.', 'AEON', 'NAUTILUS'] },
  { name: 'NEWS',        count: 117, sources: ['NYT › WORLD', 'THE GUARDIAN', 'REUTERS'] },
  { name: 'TECH',        count: 89,  sources: ['HACKER NEWS', 'ARS TECHNICA', 'THE VERGE'] },
  { name: 'NEWSLETTERS', count: 28,  sources: ['STRATECHERY', 'PLATFORMER', 'THE PRAGMATIC ENG.'] },
  { name: 'SPORT',       count: 64,  sources: ['ESPN — TOP', 'THE ATHLETIC'] },
  { name: 'YOUTUBE',     count: 33,  sources: ['VERITASIUM', '3BLUE1BROWN'] },
];

// The hero / FOR YOU lead — the single strongest pick.
const LEAD = {
  cat: 'NEWSLETTERS', src: 'STRATECHERY', date: 'JUN 19', read_min: 12,
  title: 'The Quiet Consolidation of the AI Stack',
  dek: 'Foundation-model labs are absorbing the tooling layer wholesale. What that means for the independent developers who built the last decade — and the leverage they have left.',
  reason: 'You saved 3 from Stratechery', reasonType: 'source', affinity: 96,
};

// Secondary FOR YOU picks (beside the lead).
const FORYOU = [
  { cat: 'TECH', src: 'HACKER NEWS', date: 'JUN 19', title: 'Show HN: A local-first RSS reader built in a weekend',
    dek: 'After years of fighting cloud sync I committed to a SQLite-backed store.', reason: 'Like 6 local-first posts you read', reasonType: 'similar', affinity: 91 },
  { cat: 'MIND', src: 'AEON', date: 'JUN 18', title: 'Attention is not a resource to be spent',
    dek: 'The economic metaphor we use for the mind quietly distorts how we live.', reason: 'Similar to “Deep Work” you saved', reasonType: 'similar', affinity: 88 },
  { cat: 'NEWSLETTERS', src: 'THE PRAGMATIC ENG.', date: 'JUN 18', title: 'What staff engineers actually do all day',
    dek: 'A field study across nineteen companies, and the patterns that repeat.', reason: 'You read Platformer daily', reasonType: 'source', affinity: 84 },
];

// Per-category stories. First item of each = the section lead.
const STORIES = {
  MIND: [
    { src: 'STANFORD ENC. PHIL.', date: 'JUN 19', title: 'Logical Truth', dek: 'A revised survey of what makes a sentence true in virtue of its form alone — and why the question refuses to settle.', reason: 'You opened 4 SEP entries', reasonType: 'source', affinity: 82, lead: true },
    { src: 'NAUTILUS', date: 'JUN 17', title: 'The mathematician who classified all the symmetries', reason: 'Similar to articles you saved', reasonType: 'similar', affinity: 71 },
    { src: 'AEON', date: 'JUN 16', title: 'Against the tyranny of the to-do list', affinity: 64 },
    { src: 'STANFORD ENC. PHIL.', date: 'JUN 15', title: 'Supervenience, revisited', affinity: 58 },
  ],
  NEWS: [
    { src: 'NYT › WORLD', date: 'JUN 19', title: 'Vance Issues Blunt Warning as Cease-Fire Holds by a Thread', dek: 'The vice president delivered a rebuke to critics of the agreement as monitors reported the first quiet night in weeks.', reason: 'Top from a source you read daily', reasonType: 'source', affinity: 79, lead: true },
    { src: 'THE GUARDIAN', date: 'JUN 19', title: 'Star-studded ceremony welcomes Obama Center to Chicago', affinity: 66 },
    { src: 'REUTERS', date: 'JUN 18', title: 'Central banks signal a slower path on rate cuts', affinity: 61 },
    { src: 'NYT › WORLD', date: 'JUN 18', title: 'Inside the negotiation that almost collapsed twice', affinity: 55 },
  ],
  TECH: [
    { src: 'ARS TECHNICA', date: 'JUN 19', title: 'The quiet return of the personal feed', dek: 'Algorithmic timelines are out; chronological rivers are back. A look at the small-web revival and the tools driving it.', reason: 'Matches what you read this week', reasonType: 'similar', affinity: 90, lead: true },
    { src: 'THE VERGE', date: 'JUN 18', title: 'Why everyone is self-hosting again', reason: 'Like 2 you saved', reasonType: 'similar', affinity: 77 },
    { src: 'HACKER NEWS', date: 'JUN 18', title: 'SQLite is all you need (until it isn’t)', affinity: 73 },
    { src: 'ARS TECHNICA', date: 'JUN 17', title: 'The case against the cloud, eight years on', affinity: 62 },
  ],
  NEWSLETTERS: [
    { src: 'PLATFORMER', date: 'JUN 18', title: 'The chronological feed is having a moment', dek: 'Why three major platforms quietly shipped a reverse-chron option this month, and what the data says about retention.', reason: 'You read Platformer daily', reasonType: 'source', affinity: 87, lead: true },
    { src: 'STRATECHERY', date: 'JUN 17', title: 'Aggregation theory in the age of agents', reason: 'You saved 3 from Stratechery', reasonType: 'source', affinity: 80 },
    { src: 'THE PRAGMATIC ENG.', date: 'JUN 16', title: 'The real cost of a microservice', affinity: 68 },
  ],
  SPORT: [
    { src: 'ESPN — TOP', date: 'JUN 18', title: 'Balogun living World Cup “dream” as U.S. choice pays off', dek: 'The striker has settled questions about his international future with a run of form that has the federation breathing easier.', reason: 'From a source you read on weekends', reasonType: 'source', affinity: 59, lead: true },
    { src: 'THE ATHLETIC', date: 'JUN 17', title: 'The tactical shift quietly reshaping the league', affinity: 52 },
    { src: 'ESPN — TOP', date: 'JUN 16', title: 'Transfer window: the deals that actually matter', affinity: 47 },
  ],
  YOUTUBE: [
    { src: 'VERITASIUM', date: 'JUN 17', title: 'The maths problem that broke the internet', dek: 'A deceptively simple puzzle that hides surprising depth — and a century of argument — underneath.', reason: 'Like videos you finished', reasonType: 'similar', affinity: 70, lead: true },
    { src: '3BLUE1BROWN', date: 'JUN 15', title: 'But what is a convolution, really?', affinity: 66 },
  ],
};

// Flat river (for the RIVER view), chronological, mixed categories.
const RIVER = [
  { cat:'MIND', src: 'STANFORD ENC. PHIL.', date: 'Jun 19', title: 'Logical Truth', body: 'Revised entry by Mario Gómez-Torrente. Changes to main text, bibliography, notes', read: false },
  { cat:'NEWS', src: 'NYT › WORLD', date: 'Jun 19', title: 'Vance Issues Blunt Warning as Cease-Fire Holds', body: 'The vice president delivered a rebuke to critics of the agreement', read: false },
  { cat:'NEWSLETTERS', src: 'STRATECHERY', date: 'Jun 19', title: 'The Quiet Consolidation of the AI Stack', body: 'Foundation-model labs are absorbing the tooling layer wholesale', read: false },
  { cat:'TECH', src: 'HACKER NEWS', date: 'Jun 19', title: 'Show HN: A local-first RSS reader built in a weekend', body: 'After years of fighting cloud sync I committed to a SQLite-backed store', read: false },
  { cat:'NEWS', src: 'THE GUARDIAN', date: 'Jun 19', title: 'Star-studded ceremony welcomes Obama Center to Chicago', body: 'Former presidents, heads of state and celebrities converged on a lakefront park', read: false },
  { cat:'SPORT', src: 'ESPN — TOP', date: 'Jun 18', title: 'Balogun living World Cup “dream” as U.S. choice pays off', body: 'The striker has settled questions about his international future', read: true },
  { cat:'TECH', src: 'ARS TECHNICA', date: 'Jun 18', title: 'The quiet return of the personal feed', body: 'Algorithmic timelines are out, chronological rivers are back in fashion', read: false },
  { cat:'NEWSLETTERS', src: 'PLATFORMER', date: 'Jun 18', title: 'The chronological feed is having a moment', body: 'Why three major platforms quietly shipped a reverse-chron option', read: false },
  { cat:'MIND', src: 'AEON', date: 'Jun 18', title: 'Attention is not a resource to be spent', body: 'The economic metaphor we use for the mind quietly distorts how we live', read: true },
  { cat:'YOUTUBE', src: 'VERITASIUM', date: 'Jun 17', title: 'The maths problem that broke the internet', body: 'A deceptively simple puzzle that hides surprising depth underneath', read: true },
  { cat:'TECH', src: 'THE VERGE', date: 'Jun 17', title: 'Why everyone is self-hosting again', body: 'A new generation of tinkerers is reclaiming their data one container at a time', read: false },
];

window.FP_DATA = { CATS, LEAD, FORYOU, STORIES, RIVER };
