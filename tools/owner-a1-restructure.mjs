/**
 * One-time, owner-approved A1 curriculum amendment (2026-10-26).
 * Keeps the October pilot files intact and produces versioned destinations.
 * Run only on the prior approved revision; do not use to regenerate hand-edited lessons.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { gitBlobSha, parseCanonicalSource } from './curriculum-contract.mjs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const json = path => JSON.parse(read(path));
const save = (path, data) => writeFileSync(new URL(path, root), JSON.stringify(data, null, 2) + '\n');
const revision = '2026-10-26-owner-a1-twelve-per-stage';
const manifestPath = 'content/curriculum/universal-path.v1.json';
const curriculumPath = 'content/language-pairs/fa-en/curriculum.a1.json';
const sourcePath = 'docs/curriculum/01-universal-learning-path.md';
const lockPath = 'content/curriculum/roadmap.lock.json';
const manifest = json(manifestPath);
if (manifest.revision === revision) {
  console.log('Curriculum amendment already applied.');
  process.exit(0);
}
if (manifest.revision !== '2026-10-25-owner-kitchen-verbs-a1')
  throw Error('Unexpected upstream curriculum revision; inspect before transforming.');
const course = json(curriculumPath);
const lock = json(lockPath);
const oldEntries = course.stages.flatMap(s => s.chapters).flatMap(c => c.lessons).filter(e => /^A1-\d+$/.test(e.id));
const byOldId = new Map(oldEntries.map(entry => [entry.id, entry]));

// Two inserted A1 lessons: numbers before information, school before food.
function renumberOld(n) {
  if (n === 3) return 4;
  if (n === 4) return 3;
  if (n >= 11) return n + 2;
  if (n >= 8) return n + 1;
  return n;
}
function renumberRefs(input) {
  return input.replace(/\bA1-(\d+)\b/g, (all, n) => `A1-${renumberOld(Number(n))}`);
}
const sourceOverrides = new Map([
  [1, { title:'اولین برخورد و عبارت‌های روزمره', communicativeOutcome:'در برخورد با یک فرد تازه، سلام، صبح‌به‌خیر یا شب‌به‌خیر مناسب می‌گوید؛ نام و جنسیت خود را با عبارت کوتاه بیان می‌کند؛ یک مکالمهٔ دو یا سه‌نوبتی را آغاز و مؤدبانه پایان می‌دهد. سن، کشور و شغل در این درس الزامی نیست.', globalConcept:'احوال‌پرسی، مونولوگ کوتاه، نام و جنسیت پایه', scopeBoundary:'عبارت‌های کاربردی تماس اولیه؛ فقط نام، boy/girl و سلام‌های موقعیتی، بدون پروفایل و اعداد.' }],
  [2, { title:'خانواده، جنسیت و ضمایر', communicativeOutcome:'اعضای خانواده را نام می‌برد و با my/his/her معرفی می‌کند؛ نقش خود را با I am a mother/father/sister/brother و جنسیت بزرگسال را با I am a man/woman می‌گوید؛ he/she و ضمایر پایه را به کار می‌برد و عبارت‌های سلام و معرفی درس اول را تمرین می‌کند.', globalConcept:'جنسیت، نسبت، ضمیر و تعلق شخصی محدود', scopeBoundary:'داشتن با have/has و شمارش هنوز تدریس نمی‌شوند؛ my/his/her برای معرفی نسبت مجاز است.' }],
  [3, { title:'لوازم شخصی، مالکیت و داشتن', communicativeOutcome:'وسایل شخصی را معرفی می‌کند و فرق تعلق (This is my pen / It is mine) و داشتن (I have a pen) را توضیح می‌دهد؛ داشتن، نداشتن و سؤال را با اشیا و اعضای خانواده می‌سازد (This is my mother / I have a daughter).', prerequisiteBridge:'A1-1، A1-2', globalConcept:'وسایل شخصی، مالکیت، داشتن و نداشتن', scopeBoundary:'داشتن اشیا و افراد، مالکیت مفرد و جمله‌های بدون شمارش چندتایی؛ تعداد در درس بعد می‌آید.' }],
  [4, { title:'اعداد، شمارش و تعداد اشیا و افراد', communicativeOutcome:'تا ۱۲ می‌شمارد؛ تعداد اشیا و اعضای خانواده را می‌پرسد و بیان می‌کند؛ جمع‌بستن اسم را در عبارت عدددار درست به‌کار می‌برد و have/has درس قبل را با تعداد بازمی‌سازد (I have three pens / She has two sisters).', prerequisiteBridge:'A1-3، A1-2', globalConcept:'شمارش، تعداد، جمع و داشتنِ عدددار', scopeBoundary:'اعداد یک تا دوازده و جمع اولیه؛ اعداد ۱۳ تا ۱۰۰ در درس هشتم تثبیت می‌شوند.' }],
  [8, { title:'اعداد در زندگی روزمره', axis:'ساختار/مفهوم‌محور', communicativeOutcome:'اعداد ۱۳ تا ۱۰۰ را می‌خواند، می‌نویسد و از هم تشخیص می‌دهد؛ با آن‌ها تعداد اشیا و افراد، مالکیت و موقعیت‌های ساده را بیان می‌کند و ارقام چندبخشی را برای ورود به سن و شماره تماس آماده می‌سازد.', prerequisiteBridge:'A1-4، A1-5، A1-6', globalConcept:'عدد بزرگ‌تر و کاربرد عدد با واژه‌های قبلی', scopeBoundary:'تمرین شمارش و تعداد، نه درس کامل سن، پروفایل یا قیمت‌گذاری؛ اعداد پایه درس چهارم تکرار می‌شوند.', archetypes:['K1','K2'] }],
  [9, { prerequisiteBridge:'A1-8، A1-1، A1-2', scopeBoundary:'سن و شماره تماس با اعداد تمرین‌شده در A1-8؛ معرفی کشور، زبان و تحصیل در قالب کوتاه. مدرسه و افعال مطالعه در A1-12 عمیق می‌شوند.' }],
  [12, { title:'مدرسه، مطالعه و فعالیت‌های ساده', axis:'موضوع/مأموریت‌محور', communicativeOutcome:'با وسایل شخصی آموخته‌شده و واژگان مدرسه، می‌گوید چه کسی چه کاری می‌کند؛ read/write/study/go/walk/sit را در جملهٔ خبری، منفی و پرسشی با فاعل‌های متفاوت به کار می‌برد و یک موقعیت کوتاه کلاسی را توضیح می‌دهد.', prerequisiteBridge:'A1-3، A1-9، A1-11', globalConcept:'افعال کنشی، مدرسه و مطالعه', scopeBoundary:'آغاز منسجم فعل‌های عملی و تغییر فاعل/صورت جمله؛ غذا و آشپزی در A1-13 گسترش می‌یابد.', archetypes:['K5','K2'] }],
  [13, { prerequisiteBridge:'A1-12، A1-10، A1-11، A1-8', globalConcept:'کاربرد فعل‌های کنشی در آشپزخانه و معرفی خوراکی', scopeBoundary:'نام خوراکی‌ها و وسایل و تمرین eat/drink/cook/want بر پایهٔ صرف فعل‌های درس ۱۲؛ منوی محدود فقط کاربرد پایانی است.' }],
  [14, { prerequisiteBridge:'A1-13، A1-10', scopeBoundary:'وعده‌ها، and/with/without، سلیقه و درخواست ساده؛ تمرین مزه‌ها و سیرشدن در گفت‌وگوی مستقل.' }]
]);
const idMap = new Map(manifest.lessons.filter(l => l.level === 'A1').map(l => [l.id, `A1-${renumberOld(l.order)}`]));
const rewritten = manifest.lessons.map(original => {
  if (original.level !== 'A1') return {
    ...original,
    prerequisiteBridge: renumberRefs(original.prerequisiteBridge),
    prerequisiteIds: original.prerequisiteIds.map(id => idMap.get(id) || id)
  };
  const order = renumberOld(original.order);
  return { ...original, id:`A1-${order}`, order, title:sourceOverrides.get(order)?.title || original.title,
    prerequisiteBridge: renumberRefs(original.prerequisiteBridge),
    prerequisiteIds:original.prerequisiteIds.map(id => idMap.get(id) || id) };
});
for (const [order, fields] of sourceOverrides) {
  if (order === 8 || order === 12) {
    rewritten.push({id:`A1-${order}`,level:'A1',order,title:fields.title,axis:fields.axis,
      communicativeOutcome:fields.communicativeOutcome,prerequisiteBridge:fields.prerequisiteBridge,
      prerequisiteIds:[...new Set(fields.prerequisiteBridge.match(/A1-\d+/g))],globalConcept:fields.globalConcept,
      scopeBoundary:fields.scopeBoundary,archetypes:fields.archetypes});
  } else {
    const target = rewritten.find(l => l.id === `A1-${order}`);
    Object.assign(target,fields);
    if (fields.prerequisiteBridge) target.prerequisiteIds=[...new Set(fields.prerequisiteBridge.match(/A1-\d+/g)||[])];
  }
}
rewritten.sort((a,b)=>{
  const levels=['A1','A2','B1','B2'];
  return levels.indexOf(a.level)-levels.indexOf(b.level)||a.order-b.order;
});
const outcomeById = new Map(rewritten.map(l=>[l.id,l]));

// The full owner-authorized source document is updated, not only the website.
const oldSource = read(sourcePath);
const sourceLines = renumberRefs(oldSource).split('\n');
const byTable = new Map(rewritten.map(l=>[l.id,l]));
function toRow(l) {return `| ${l.id} — ${l.title} | ${l.axis} | ${l.communicativeOutcome} | ${l.prerequisiteBridge} | ${l.globalConcept} | ${l.scopeBoundary} | ${l.archetypes.join(' + ')} |`;}
const changedSource = sourceLines.map(line=>{
  const match=line.match(/^\|\s*(A1-\d+)\s+—/);
  return match ? toRow(byTable.get(match[1])) : line;
});
for (const insertion of [8,12]) {
  const idx=changedSource.findIndex(line=>line.startsWith(`| A1-${insertion+1} —`));
  if(idx < 0) throw Error('Source row insertion point missing: ' + insertion);
  changedSource.splice(idx,0,toRow(byTable.get(`A1-${insertion}`)));
}
let source=changedSource.join('\n').replace(/A1\s*\(34\)/g,'A1 (36)');
// Distinguish a historical heading in the document from the current amendment.
source += `\n\n### اصلاح مصوب مالک محصول — ۲۶ اکتبر ۲۰۲۶\n\nدرس‌های ۳ و ۴ جابه‌جا و بازتألیف شدند؛ درس ۸ برای اعداد ۱۳ تا ۱۰۰ و درس ۱۲ برای مدرسه و افعال عملی افزوده شد. غذا به ۱۳ و ۱۴ رفت؛ مرزهای A1 به ۱–۱۲، ۱۳–۲۴ و ۲۵–۳۶ منتقل شدند. نسخه‌های قبلی برای بازیابی حفظ می‌شوند.\n`;
const sourceSha=gitBlobSha(source);
const result={...manifest,revision,sourceGitBlobSha:sourceSha,
  totals:{...manifest.totals,total:128,A1:36},lessons:rewritten};

// Preserve old file identity for recovery, create versioned content at changed IDs.
const destByOld = new Map([[1,'a1-1-v2.json'],[2,'a1-2-v2.json'],[3,'a1-4-v4.json'],[4,'a1-3-v4.json'],[5,'a1-5-v3.json'],[6,'a1-6-v4.json'],[7,'a1-7-v2.json'],[8,'a1-9-v3.json'],[9,'a1-10-v3.json'],[10,'a1-11-v2.json'],[11,'a1-13-v1.json'],[12,'a1-14-v1.json']]);
for (const [oldNo,dest] of destByOld) {
  const old=byOldId.get(`A1-${oldNo}`);
  if (!old?.file) throw Error(`Missing current lesson for A1-${oldNo}`);
  const lesson=json('content/language-pairs/fa-en/'+old.file);
  const target=`A1-${renumberOld(oldNo)}`,outcome=outcomeById.get(target);
  lesson.id=target;lesson.title=outcome.title;
  lesson.roadmapRef={id:target,revision,communicativeOutcome:outcome.communicativeOutcome};
  if (dest !== old.file.split('/').at(-1))
    save('content/language-pairs/fa-en/lessons/'+dest,lesson);
  else save('content/language-pairs/fa-en/'+old.file,lesson);
}
const meta = (id,title,subtitle,icon,feature,file,status='sample')=>({id,title,subtitle,icon,feature,file:`lessons/${file}`,status});
const extras=new Map([
 ['A1-8',meta('A1-8',sourceOverrides.get(8).title,'۱۳ تا ۱۰۰ در وسایل، خانواده و موقعیت‌های ساده','numbers','تعداد قابل تغییر در جمله','a1-8-v3.json')],
 ['A1-12',meta('A1-12',sourceOverrides.get(12).title,'خواندن، نوشتن، رفتن و پاسخ درباره فعالیت','book','جملهٔ زندهٔ فاعل و فعل','a1-12-v2.json')]
]);
const entries=[];
for(let n=1;n<=36;n++) {
  const oldNo=n===8||n===12?null:[...Array(34)].map((_,i)=>i+1).find(i=>renumberOld(i)===n);
  if (oldNo===null) {entries.push(extras.get(`A1-${n}`));continue;}
  const old=byOldId.get(`A1-${oldNo}`);
  const canonical=outcomeById.get(`A1-${n}`);
  if (!old) throw Error('Missing lesson outline A1-'+oldNo);
  const entry={...old,id:`A1-${n}`,title:canonical.title};
  if (n<=14) {entry.file='lessons/'+destByOld.get(oldNo);entry.status='sample';}
  else {delete entry.file;entry.status='planned';}
  entries.push(entry);
}
const chapters=(start,end,slices)=>slices.map(([lo,hi,i,title,description])=>({
  id:`a1-${start===1?1:start===13?2:3}-${i}`,title,description,
  lessons:[...entries.slice(lo-1,hi),...(end===12&&hi===9?[{id:'A1-W1',title:'کارگاه شناخت خود و اطراف',icon:'trophy',kind:'workshop',status:'planned'}]:[]),...(end===12&&hi===12?[{id:'A1-W2',title:'کارگاه پایان بخش نخست A1',icon:'trophy',kind:'workshop',status:'planned'}]:[])]
}));
course.stages=[
 {id:'A1.1',title:'بخش اول: آشنایی و یادگیری ساخت جمله',description:'۱۲ درس نخست؛ از سلام و معرفی تا شمارش، توصیف، خانه، مدرسه و افعال ساده.',chapters:chapters(1,12,[[1,4,1,'آشنایی، خانواده و داشتن','سلام، ضمایر، وسایل شخصی و شمارش را به هم وصل کن.'],[5,9,2,'مکان، ظاهر و اطلاعات شخصی','ویژگی‌ها، عدد بزرگ‌تر و پرسش‌های شخصی.'],[10,12,3,'زندگی روزمره، خانه و مطالعه','احساسات، خانه و نخستین افعال منسجم.']])},
 {id:'A1.2',title:'بخش دوم: خوراک، نیازها و رفت‌وآمد',description:'۱۲ درس ۱۳ تا ۲۴؛ غذا، بدن، خرید، شهر، رفت‌وآمد و برنامه روزانه.',chapters:chapters(13,24,[[13,16,1,'خوراک، بدن و سلامت','از غذا و گفت‌وگو سر میز تا نیازهای جسمی.'],[17,20,2,'خرید و محیط شهر','انتخاب، قیمت، شهر و شغل.'],[21,24,3,'مسیر، پرداخت و برنامه','موقعیت، پرداخت، برنامه و عادت.']])},
 {id:'A1.3',title:'بخش سوم: ارتباط مستقل',description:'۱۲ درس ۲۵ تا ۳۶؛ روایت، زمان، طبیعت، درخواست، علاقه و ارتباط.',chapters:chapters(25,36,[[25,28,1,'گذشته، آینده و هدف','رویداد، برنامه و تصمیم.'],[29,32,2,'روزمره، طبیعت و توانایی','تقویم، طبیعت، وظایف و درخواست.'],[33,36,3,'گفت‌وگو و ارتباط','ادب، علاقه، تعامل اجتماعی و پیام دیجیتال.']])}
];
const summary={revision,authorizedBy:'product-owner',affectedIds:['A1-1','A1-2','A1-3','A1-4','A1-8','A1-9','A1-10','A1-11','A1-12','A1-13','A1-14','A1-15–36'],
  decisionReference:'Tutivar project conversation, 2026-10-26: owner ordered A1-1 as short tourist/greeting phrases; A1-2 as gender, family and pronouns without have; personal possessions plus have in A1-3; count in A1-4; extended numbers before profile; school and action verbs before food; food moves to A1 part two; three 12-lesson stages.',
  rationale:'A prerequisite-first, cumulative teaching sequence with core vocabulary used downstream; preserve archived old content and progress by versioned remapping.'};
lock.approvedRevision=revision;lock.approvedChanges.push(summary);
lock.sourceGitBlobSha=sourceSha;
lock.manifestGitBlobSha=gitBlobSha(JSON.stringify(result,null,2)+'\n');
save(manifestPath,result);save(curriculumPath,course);save(lockPath,lock);
writeFileSync(new URL(sourcePath,root),source);
console.log('Owner-approved 36-lesson A1 table and versioned content generated.');
