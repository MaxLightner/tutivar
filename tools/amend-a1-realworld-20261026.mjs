/**
 * One-time, owner-authorized A1 amendment. Run from the repository root.
 * Creates versioned lesson files; does not overwrite older teaching content.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { gitBlobSha } from './curriculum-contract.mjs';

const read = path => JSON.parse(readFileSync(path, 'utf8'));
const write = (path, value) => writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n');
const prefix = 'content/language-pairs/fa-en/';
const current = read(prefix + 'curriculum.a1.json');
const canonical = read('content/curriculum/universal-path.v1.json');
const lock = read('content/curriculum/roadmap.lock.json');
const legacy = read('content/curriculum/legacy-alignment.json');
const revision = '2026-10-26-owner-home-school-feelings-realworld';
if (canonical.revision !== '2026-10-26-owner-a1-twelve-per-stage') throw Error('Base A1 roadmap revision changed');
const permutation = { 'A1-10': 'A1-12', 'A1-11': 'A1-10', 'A1-12': 'A1-11' };
const oldForNew = { 'A1-10': 'A1-11', 'A1-11': 'A1-12', 'A1-12': 'A1-10' };
const remapReferences = value => String(value).replace(/\bA1-(?:10|11|12)\b/g, id => permutation[id]);
const oldById = new Map(canonical.lessons.map(row => [row.id, row]));
const newRows = canonical.lessons.map((original, idx) => {
  const old = oldById.get(oldForNew[original.id] || original.id);
  const row = { ...old, id: original.id, order: original.order };
  for (const field of ['communicativeOutcome', 'prerequisiteBridge', 'globalConcept', 'scopeBoundary'])
    row[field] = remapReferences(row[field]);
  row.prerequisiteIds = [...new Set((row.prerequisiteBridge.match(/\b(?:A1|A2|B1|B2)-\d+\b/g) || []))];
  return row;
});

const missions = {
  1: ['وقتی یک گردشگر یا فرد تازه می‌بینی', 'یک گفت‌وگوی خیالی شروع کن: سلام مناسب، پرسیدن حال و نام، معرفی نام و جنسیت فرضی، واکنش مؤدبانه و خداحافظی.', 'امروز در یک برخورد کوتاه، کدام سلام مناسب‌تر بود؟'],
  2: ['وقتی عکس خانوادگی یا جمع چند نفر را می‌بینی', 'سه نفر را با نسبت و ضمیر معرفی کن، یک‌بار دربارهٔ صاحبِ نسبت بپرس و نقش خودت را با جملهٔ ساده بگو.', 'به یک عکس واقعی نگاه کن و دو نسبت خانوادگی را در ذهنت انگلیسی بگو.'],
  3: ['وقتی وسایلت را جمع می‌کنی', 'به دوست خیالی بگو کدام وسیله مال تو یا اوست، یکی را داری و یکی را نداری و دربارهٔ یک وسیله سؤال کن.', 'هنگام برداشتن کیف و قلم در ذهن بگو چه داری و مال چه کسی است.'],
  4: ['وقتی چند شیء روی میز یا چند نفر در اتاق می‌بینی', 'دربارهٔ تعداد کتاب‌ها و اعضای خانوادهٔ خیالی جمله بساز؛ یک سؤال تعداد بپرس و یک جمع ساده را توضیح بده.', 'فردا در اطرافت چند چیز را واقعاً بشمار و به انگلیسی بیان کن.'],
  5: ['وقتی چیزی را کنار وسایل دیگر گذاشته‌ای', 'جای سه وسیلهٔ واقعی یا فرضی را بدون نگاه‌کردن به جملهٔ آماده توصیف کن و دربارهٔ جای یکی سؤال بپرس.', 'هر بار دنبال کلید یا گوشی می‌گردی، موقعیتش را به انگلیسی در ذهن بگو.'],
  6: ['وقتی می‌خواهی وسیله‌ای را برای شخص دیگری مشخص کنی', 'دو شیء شبیه به هم را با رنگ، اندازه و در صورت نیاز شکل یا جنس متمایز کن؛ یک سؤال دربارهٔ ویژگی بپرس.', 'به دو وسیلهٔ اطرافت نگاه کن و تفاوتشان را با دو صفت بگو.'],
  7: ['وقتی دو نفر را از دور می‌بینی', 'دو شخصیت خیالی را با مو و قد متفاوت توصیف کن؛ یک جمله دربارهٔ دو عضو خانواده و یک سؤال دربارهٔ ظاهر بساز.', 'در یک جمع، یک صفت را با مخالفش مقایسه کن؛ از توصیف تحقیرآمیز افراد پرهیز کن.'],
  8: ['وقتی تعداد صندلی، کتاب یا شماره‌ای را می‌بینی', 'به دوست خیالی بگو چند وسیله داری و چند وسیله در اتاق هست؛ دست‌کم یک عدد میان سیزده تا صد را به کار ببر.', 'روی پلاک، ساعت یا شمارهٔ صفحه یک عدد دورقمی پیدا کن و در ذهنت بخوان.'],
  9: ['وقتی یک فرم ثبت‌نام یا معرفی کوتاه می‌بینی', 'برای یک شخصیت کاملاً فرضی، نام، سن، کشور، زبان و تحصیل را معرفی کن و دو پرسش اطلاعاتی بساز. هرگز دادهٔ واقعی وارد نکن.', 'در یک فرم یا وب‌سایت، نام فیلدهای اطلاعات شخصی را پیدا کن و معنایشان را حدس بزن.'],
  10: ['وقتی مهمانی برای اولین بار وارد خانه‌ات می‌شود', 'چند اتاق و وسیلهٔ یک خانهٔ فرضی را معرفی کن؛ بگو کدام چیز وجود دارد یا ندارد و یکی از آن‌ها کجاست.', 'در خانه به یک اتاق نگاه کن و بدون مثال آماده سه جمله درباره‌اش بساز.'],
  11: ['وقتی سر میز مطالعه یا در کلاس هستی', 'فعالیت یک روز مدرسهٔ خیالی را توصیف کن: چه کسی می‌خواند، می‌نویسد و می‌رود؛ یک سؤال واقعی با Do/Does بپرس.', 'هنگام دیدن کتاب و قلم، عمل جاری خودت یا یکی دیگر را در ذهنت توصیف کن.'],
  12: ['وقتی کسی خسته، تشنه یا ناراحت به نظر می‌رسد', 'با یک دوست خیالی احوال‌پرسی کن، حال خودت و یک نفر دیگر را بگو و یک واکنش همدلانه مناسب نشان بده.', 'اگر امروز خسته یا تشنه شدی، جمله‌اش را در ذهنت بساز و پاسخ مناسب به دوستت را تصور کن.'],
  13: ['وقتی کسی دربارهٔ غذا و آشپزی سؤال می‌کند', 'برای یک آشپزخانهٔ خیالی بگو چه می‌خوری، می‌نوشی، می‌پزی و می‌خواهی؛ یک درخواست یا سؤال و یک پاسخ منفی بساز.', 'هنگام بازکردن یخچال یا پخت‌وپز، فعل مناسب را در ذهنت انتخاب کن.'],
  14: ['وقتی سر میز صبحانه، ناهار یا شام نشسته‌ای', 'سه وعده را برای دو نفر مختلف توصیف کن؛ دربارهٔ مزه، سیربودن و همراهی غذا حرف بزن و وسیله‌ای را مؤدبانه درخواست کن.', 'سر میز واقعی تفاوت with، without و and را در یک سفارش خیالی مرور کن.']
};
const targetFiles = {
  'A1-1': 'lessons/a1-1-v3.json', 'A1-2': 'lessons/a1-2-v3.json',
  'A1-3': 'lessons/a1-3-v5.json', 'A1-4': 'lessons/a1-4-v5.json',
  'A1-5': 'lessons/a1-5-v4.json', 'A1-6': 'lessons/a1-6-v5.json',
  'A1-7': 'lessons/a1-7-v3.json', 'A1-8': 'lessons/a1-8-v4.json',
  'A1-9': 'lessons/a1-9-v4.json', 'A1-10': 'lessons/a1-10-v4.json',
  'A1-11': 'lessons/a1-11-v3.json', 'A1-12': 'lessons/a1-12-v3.json',
  'A1-13': 'lessons/a1-13-v2.json', 'A1-14': 'lessons/a1-14-v2.json'
};
const catalogRows = current.stages.flatMap(s => s.chapters).flatMap(c => c.lessons).filter(x => /^A1-\d+$/.test(x.id || ''));
const originals = new Map(catalogRows.map(entry => [entry.id, { ...entry }]));
const byId = new Map(newRows.map(row => [row.id, row]));
const oldVersions = {};
for (let n = 1; n <= 14; n++) {
  const id = `A1-${n}`;
  const origin = originals.get(oldForNew[id] || id);
  const destination = targetFiles[id];
  if (existsSync(prefix + destination)) throw Error('Amendment has already been applied: ' + destination);
  const lesson = read(prefix + origin.file);
  oldVersions[id] = { sourceId: origin.id, sourceFile: origin.file, sourceGitBlobSha: gitBlobSha(readFileSync(prefix + origin.file, 'utf8')) };
  lesson.id = id;
  lesson.title = byId.get(id).title;
  lesson.revision = revision;
  lesson.roadmapRef = { id, revision, communicativeOutcome: byId.get(id).communicativeOutcome };
  if (lesson.orientation?.prerequisites)
    lesson.orientation.prerequisites = lesson.orientation.prerequisites.map(remapReferences);
  if (n === 1) {
    const deck = lesson.sections[0].activities.find(activity => activity.type === 'vocabulary');
    for (const item of deck.items) if (['afternoon', 'thank', 'me', 'see', 'welcome'].includes(item.en)) item.role = 'supplementary';
    deck.deckRevision = (deck.deckRevision || 1) + 1;
  }
  if (n === 7) {
    const activities = lesson.sections[0].activities;
    const insertAt = activities.findLastIndex(activity => activity.phase === 'variants') + 1;
    activities.splice(insertAt, 0, {
      id: 'a1-7-antonym-pairs', type: 'antonym-pair-lab', phase: 'variants',
      title: 'دو تصویر روبه‌رو؛ صفت و مخالف آن',
      description: 'روی یک صفت بزن؛ سمت چپ تصویر آن و سمت راست تصویرِ صفت مخالف را ببین. تفاوت را در یک جمله بیان کن.',
      pairs: [
        { left: 'tall', right: 'short', leftFa: 'قدبلند', rightFa: 'کوتاه‌قد', trait: 'height' },
        { left: 'young', right: 'old', leftFa: 'جوان', rightFa: 'مسن', trait: 'age' },
        { left: 'curly', right: 'straight', leftFa: 'موی فرفری', rightFa: 'موی صاف', trait: 'hair' },
        { left: 'long', right: 'short', leftFa: 'موی بلند', rightFa: 'موی کوتاه', trait: 'length' },
        { left: 'slim', right: 'overweight', leftFa: 'لاغراندام', rightFa: 'دارای اضافه‌وزن', trait: 'build' }
      ],
      note: 'زیبا و زشت قضاوتی و وابسته به موقعیت‌اند؛ از این صفت‌ها برای برچسب‌زدن به ظاهر آدم‌ها استفاده نکن.'
    });
  }
  const free = lesson.sections.flatMap(s => s.activities).find(a => a.type === 'free-write');
  if (!free || !free.assessment) throw Error('Missing independent production in ' + id);
  const [cue, challenge, reflection] = missions[n];
  free.prompt = challenge;
  free.realWorldMission = { cue, reflection };
  free.assessment.productionProof = { minWords: 8, minClauses: 2 };
  if (n === 8) {
    free.assessment.productionProof.required = [{
      patterns: ['\\b(?:thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|[1-9][0-9]|100)\\b'],
      feedback: 'حداقل یک عدد بین سیزده تا صد را در جملهٔ کامل به کار ببر.'
    }];
  }
  free.assessment.revision = (Number(free.assessment.revision) || 1) + 1;
  write(prefix + destination, lesson);
}

// Each new numerical card borrows the old card of the matching teaching topic.
for (const entry of catalogRows) {
  const from = originals.get(oldForNew[entry.id] || entry.id);
  const row = byId.get(entry.id);
  Object.assign(entry, { ...from, id: entry.id, title: row.title, file: targetFiles[entry.id] });
}
const chapter = current.stages[0].chapters.find(c => c.id === 'a1-1-3');
chapter.description = 'خانه، مطالعه و نخستین افعال منسجم؛ سپس احساسات و نیازهای روزمره.';
write(prefix + 'curriculum.a1.json', current);

const newSource = readFileSync('docs/curriculum/01-universal-learning-path.md', 'utf8').replace(
  /^\|\s*(A1|A2|B1|B2)-(\d+)\s+—.*$/gm,
  (original, level, n) => {
    const id = `${level}-${n}`;
    const row = byId.get(id);
    if (!row) return original;
    return `| ${row.id} — ${row.title} | ${row.axis} | ${row.communicativeOutcome} | ${row.prerequisiteBridge} | ${row.globalConcept} | ${row.scopeBoundary} | ${row.archetypes.join(' + ')} |`;
  }
);
write('docs/curriculum/01-universal-learning-path.md', newSource);
canonical.revision = revision;
canonical.sourceGitBlobSha = gitBlobSha(newSource);
canonical.lessons = newRows;
write('content/curriculum/universal-path.v1.json', canonical);
lock.approvedRevision = revision;
lock.approvedChanges.push({
  revision, authorizedBy: 'product-owner',
  affectedIds: ['A1-1','A1-6','A1-7','A1-8','A1-9','A1-10','A1-11','A1-12','A1-13','A1-14'],
  decisionReference: 'Tutivar project conversation, 2026-10-26: owner approved moving some greeting words to supplementary; contrasting adjective pictures; hiding number-test answers; refining all independent real-world production; and explicitly reordered A1-10 home, A1-11 school, A1-12 feelings before food.',
  rationale: 'Reorder by prerequisites and real-life motivation, make independent practice test actual responses, preserve versioned course content and learner progress.'
});
lock.sourceGitBlobSha = gitBlobSha(newSource);
lock.manifestGitBlobSha = gitBlobSha(JSON.stringify(canonical, null, 2) + '\n');
write('content/curriculum/roadmap.lock.json', lock);
legacy.homeSchoolFeelings = {
  revision, progressRevision: 'a1-owner-home-school-feelings-2026-10-26',
  preserveProgress: true,
  archiveNamespace: 'oct-2026-before-home-school-feelings',
  remap: { 'A1-10': 'A1-12', 'A1-11': 'A1-10', 'A1-12': 'A1-11' },
  oldVersions,
  replacement: targetFiles
};
write('content/curriculum/legacy-alignment.json', legacy);
console.log('Versioned A1 lesson amendment generated:', Object.values(targetFiles).join(', '));
