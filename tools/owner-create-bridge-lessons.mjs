/** Two new owner-requested A1 lessons: extended numbers and school action verbs. */
import { readFileSync, writeFileSync } from 'node:fs';
const root=new URL('../content/language-pairs/fa-en/lessons/',import.meta.url);
const load=name=>JSON.parse(readFileSync(new URL(name,root),'utf8'));
const save=(name,data)=>writeFileSync(new URL(name,root),JSON.stringify(data,null,2)+'\n');
const manifest=JSON.parse(readFileSync(new URL('../content/curriculum/universal-path.v1.json',import.meta.url),'utf8'));
const ref=id=>({id,revision:manifest.revision,communicativeOutcome:manifest.lessons.find(l=>l.id===id).communicativeOutcome});
const word=(en,fa,examples,role)=>({en,fa,...(role?{role}:{}),examples});
const phrase=(en,fa,examples,kind='fixed')=>({en,fa,kind,examples});
const task=(fa,en)=>({task:fa,hint:en,example:en,assessment:{required:[{any:[en.toLowerCase().replace(/[.?!]/g,'')],feedback:'فاعل، فعل و ترتیب جمله را بررسی کن.'}],success:'این جمله را درست ساختی.'}});
const exchange=(question,fa,variants)=>({question,questionFa:fa,variants:variants.map(([label,en,translation])=>({label,en,fa:translation}))});
const meaning=(id,fa,entries)=>({id,fa,forms:entries.map(([en,translation,relation,note])=>({en,fa:translation,relation,note}))});
const mkFree=(id,prompt,placeholder,required)=>({id,type:'free-write',phase:'independent',title:'به زبان خودت بساز',prompt,placeholder,hint:'جواب‌ها می‌توانند دربارهٔ شخصیت و اشیای فرضی باشند.',kind:'free-text',minWords:16,
  assessment:{revision:1,required:required.map(text=>({any:[text],feedback:`عبارت ${text} را در یک جملهٔ کامل به کار ببر.`})),success:'ساختار آموخته‌شده را در متن خودت به کار بردی.'}});
function makeLesson({id,title,goal,feature,orientation,shadow,words,phrases,meaningConcepts,composer,lab,quizSentences,warmup,exchangePairs,dialogueLines,image,imageAlt,pictureTasks,guidedTurns,free}) {
 const base=id.toLowerCase(),vocabId=`${base}-vocabulary`,shadowId=`${base}-shadowing`,composerId=composer.id;
 const foundation=[
  {id:shadowId,type:'shadowing',phase:'shadowing',title:'سایه‌خوانی موقعیتی',description:'گوش بده و در فاصله‌ای کوتاه جمله را تکرار کن. صدای ضبط‌شده بعداً جایگزین صدای مرورگر می‌شود.',audioSrc:null,rate:.72,pauseMs:550,lines:shadow},
  {id:vocabId,type:'vocabulary',phase:'words',title:'واژگان اصلی و تکمیلی',batchSize:4,deckRevision:1,items:words},
  {id:`${base}-expressions`,type:'expression-study',phase:'phrases',title:'عبارت‌های ترکیبی قابل مرور',description:'عبارت‌ها را بشنو و معنی واقعی هر ترکیب را در مثال‌های متفاوت بررسی کن.',items:phrases},
  {id:`${base}-meaning`,type:'meaning-cluster',phase:'phrases',title:'مفهوم‌های نزدیک، جمله‌های متفاوت',description:'تشخیص بده آیا جمله‌ها یک معنا دارند یا دربارهٔ کار و موقعیت متفاوتی حرف می‌زنند.',concepts:meaningConcepts},
  {id:lab.id,type:lab.type,phase:'phrases',title:lab.title,description:lab.description,...lab.details},
  {...composer,phase:'sentence'},
  {id:`${base}-forms`,type:'composer-view',phase:'variants',title:'همان جمله، چند حالت مختلف',description:'فاعل، معنی و حالت خبری/منفی/سؤالی را جابه‌جا کن.',sourceActivityId:composerId,patternIds:composer.patterns.slice(0,3).map(p=>p.id)},
  {id:`${base}-puzzle`,type:'sentence-builder',phase:'puzzle',title:'از یک بانک مشترک پنج جمله بساز',description:'درست‌بودن معنی و دستور مهم‌تر از حدس ترتیب است.',revision:1,reuseBank:true,goalCount:quizSentences.length,sentences:quizSentences.map((s,i)=>({id:`sentence-${i+1}`,words:s.split(/\s+/)}))},
  {id:`${base}-build`,type:'response-practice',phase:'construction',title:'این بار بدون پاسخ آماده بساز',practiceRevision:1,description:'از معنی فارسی جمله بساز و بعد نمونه را مقایسه کن.',tasks:warmup}
 ];
 const production=[
  {id:`${base}-exchange`,type:'exchange-lab',phase:'correspondence',title:'پرسش‌های موقعیتی با چهار پاسخ معنی‌دار',description:'هر پاسخ یک موقعیت متفاوت را روشن می‌کند؛ بعد خودت بدون دیدن پاسخ آماده جمله بساز.',pairs:exchangePairs},
  {id:`${base}-dialogue`,type:'dialogue',phase:'context',title:'گفت‌وگوی کوتاه در موقعیت واقعی',description:'نقش دو نفر را عوض کن؛ اول بشنو و بعد با صدای خودت پاسخ بده.',lines:dialogueLines},
  {id:`${base}-picture`,type:'picture-description',phase:'picture',title:'از تصویر به جمله برس',description:'عدد یا عمل درست را از تصویر بفهم و بعد خودت توصیف کن.',image,imageAlt,caption:'جزئیات تصویر مبنای جمله‌اند؛ صرفاً کلمات را تصادفی تغییر نده.',practiceRevision:1,tasks:pictureTasks},
  {id:`${base}-guided`,type:'guided-dialogue',phase:'guided',title:'وقتی موقعیت عوض می‌شود جواب هم عوض می‌شود',description:'پاسخ را متناسب با حرف نفر اول بساز.',practiceRevision:1,turns:guidedTurns},
  free,
  {id:`${base}-shadowing-review`,type:'shadowing-review',phase:'independent',title:'دوباره گوش بده و شدوینگ کن',sourceActivityId:shadowId}
 ];
 return {id,revision:1,status:'draft',title,goal,duration:'حدود ۲۵ تا ۳۵ دقیقه',feature,archetype:'cumulative',roadmapRef:ref(id),teachingModel:{primary:'K2',support:'K4'},lessonTemplate:'discovery-production-v1',
  orientation:{goal,prerequisites:orientation,previously:'لغات و ساختارهای قبلی در این درس دوباره در جمله‌های تازه استفاده می‌شوند.',quickCheck:{title:'خودت را امتحان کن',question:'می‌توانی بدون دیدن متن نمونه یک جملهٔ مربوط به این درس بسازی؟',example:shadow.at(-1),explanation:'اگر هنوز روان نیست، مسیر یادگیری را از ابتدا برو.',allowSkip:true}},
  learningAudit:{focusExpressions:[],specificIndependentExpressions:[],minDownstreamActivities:2,minGuidedActivities:1,requireIndependentProduction:true},
  sections:[{id:'foundation',label:'از صدا تا ساخت جمله',intro:'شدوینگ، کلمه، عبارت ترکیبی، اختلاف معنا، تغییر جمله و تمرین مستقل.',masteryActivityIds:[`${base}-build`],activities:foundation},
    {id:'production',label:'کاربرد در موقعیت',intro:'پرسش و پاسخ، گفت‌وگو و جمله‌سازی آزاد بر اساس موقعیت.',masteryActivityIds:[`${base}-guided`,`${base}-independent`],activities:production}]};
}

// A1-8: the number bank is moved out of personal information, not duplicated.
{
 const oldProfile=load('a1-9-v3.json');
 const priorProfile=load('a1-8-v2.json');
 const coreEntries=priorProfile.sections[0].activities.find(a=>a.type==='vocabulary').items.filter(x=>/^(thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)$/.test(x.en));
 const numbers=[13,14,15,16,17,18,19,20,30,40,50,60,70,80,90,100].map((n,i)=>({number:n,en:n===100?'one hundred':coreEntries[i].en}));
 const words=[...coreEntries.map((x,i)=>({...x,examples:[`I have ${numbers[i].en} books.`,`There are ${numbers[i].en} pencils.`,`How many books do you have?`]})),
  ...[word('digit','رقم',['This number has two digits.'],'supplementary'),word('total','مجموع',['The total is thirty.'],'supplementary'),word('dozen','دوجین',['A dozen is twelve.'],'supplementary'),word('pair','جفت',['A pair has two things.'],'supplementary')]];
 const baseComposer=structuredClone(load('a1-4-v4.json').sections[0].activities.find(a=>a.id==='counting-composer'));
 baseComposer.id='a1-8-composer';baseComposer.title='تعداد را تغییر بده و داشتن را با عدد بساز';baseComposer.description='تعداد و شیء را تغییر بده؛ یک جمله دربارهٔ داشتن یا وجود چند چیز می‌سازی.';
 baseComposer.wordSets.counts=numbers.map(entry=>({id:entry.en.replaceAll(' ','-'),label:entry.en,translation:String(entry.number),forms:{word:entry.en,faWord:String(entry.number)}}));
 baseComposer.slots.find(x=>x.id==='count').default='twenty';
 const havePattern=(id,label,initial)=>({id,label,segments:[{fixed:initial},{slot:'count',form:'word'},{fixed:' '},{slot:'object',form:'plural'},{fixed:'.'}],translationSegments:[{fixed:'من/او '},{slot:'count',form:'faWord'},{fixed:' '},{slot:'object',form:'faPlural'},{fixed:' دارم/دارد.'}]});
 baseComposer.patterns=[havePattern('i-have','من دارم','I have '),havePattern('she-has','او دارد','My sister has '),...baseComposer.patterns.filter(p=>['there-are','how-many','are-there'].includes(p.id))];
 baseComposer.defaultPattern='i-have';
 const countLabels={book:'book',pencil:'pencil',sister:'sister',ball:'ball',pen:'pen',bag:'bag'};
 const phrases=[phrase('thirteen books','سیزده کتاب',['I have thirteen books.','There are thirteen books.']),phrase('twenty pencils','بیست مداد',['I have twenty pencils.','She has twenty pencils.']),phrase('thirty-five','سی‌وپنج',['I have thirty-five books.','There are thirty-five pencils.']),phrase('one hundred','صد',['One hundred is ten groups of ten.','I have one hundred pencils.']),phrase('How many books?','چند کتاب؟',['How many books do you have?','How many books are there?']),phrase('fifty pens','پنجاه خودکار',['I have fifty pens.','My sister has fifty pens.'])];
 const meaningConcepts=[meaning('quantity','یک عدد، دو موقعیت',['I have twenty books.','من بیست کتاب دارم.','equivalent','تعداد داشته‌های یک نفر است.'].length?[["I have twenty books.",'من بیست کتاب دارم.','equivalent','داشتن.'],['There are twenty books.','بیست کتاب وجود دارد.','related','وجود داشتن؛ صاحب مشخص نیست.'],['Do you have twenty books?','آیا بیست کتاب داری؟','related','همان تعداد را می‌پرسیم.']]:[]),
  meaning('compare','عدد عوض شده و نتیجه هم تغییر می‌کند.',[['I have thirteen pens.','سیزده خودکار دارم.','equivalent','سیزده.'],['I have thirty pens.','سی خودکار دارم.','related','دهگان متفاوت است.'],['I have thirty-three pens.','سی‌وسه خودکار دارم.','related','دهگان و یکان با هم.']])];
 const nouns=[['کتاب','books'],['مداد','pencils'],['خودکار','pens'],['خواهر','sisters'],['توپ','balls']];
 const exchangePairs=nouns.map(([fa,plural],i)=>exchange(`How many ${plural} do you have?`,`چند ${fa} داری؟`,[13,20,35,40].map((n,j)=>[String(n),`I have ${["thirteen","twenty","thirty-five","forty"][j]} ${plural}.`,`${n} ${fa} دارم.`])));
 exchangePairs.push(exchange('Are there fifty books in the room?','آیا در اتاق پنجاه کتاب هست؟',[["بله","Yes, there are fifty books.","بله، پنجاه کتاب هست."],["فقط چهل","No, there are forty books.","نه، چهل کتاب هست."],["کمتر","No, there are twenty books.","نه، بیست کتاب هست."],["متفاوت","There are thirty-five books.","سی‌وپنج کتاب هست."]]));
 const lesson=makeLesson({id:'A1-8',title:'اعداد در زندگی روزمره',goal:'اعداد سیزده تا صد را در شمارش و جمله‌های مالکیت و وجود به کار ببر و از عددهای درس چهارم به اینجا پل بزن.',feature:'اعداد پویا در دسته‌های ده‌تایی',orientation:['شمارش تا دوازده','داشتن و نداشتن','جمع اسامی اشیا'],
  shadow:['I have thirteen books.','My sister has twenty pencils.','How many pens do you have?','There are thirty books.','I have forty notebooks.','There are fifty balls.','I have sixty pencils.','There are one hundred books.'],words,phrases,meaningConcepts,composer:baseComposer,
  lab:{id:'a1-8-quantities',type:'cumulative-number-lab',title:'عدد بزرگ و تعداد واقعی در یک تصویر',description:'عدد و شیء را تغییر بده؛ دهگان‌ها به‌صورت دسته دیده می‌شوند و جمله هم عوض می‌شود.',details:{mode:'quantities',numbers,objects:[{fa:'کتاب',plural:'books'},{fa:'خودکار',plural:'pens'},{fa:'مداد',plural:'pencils'},{fa:'خواهر',plural:'sisters'},{fa:'توپ',plural:'balls'}]}},
  quizSentences:['I have thirteen pens.','My sister has twenty books.','There are thirty pencils.','Do you have forty books?','There are fifty balls.'],
  warmup:[task('بگو من سیزده کتاب دارم.','I have thirteen books.'),task('بگو خواهرم بیست مداد دارد.','My sister has twenty pencils.'),task('بپرس چند خودکار داری.','How many pens do you have?'),task('بگو سی کتاب در اتاق وجود دارد.','There are thirty books.'),task('بگو من چهل خودکار دارم.','I have forty pens.'),task('بگو صد مداد وجود دارد.','There are one hundred pencils.')],exchangePairs,
  dialogueLines:[{speaker:'Sara',en:'How many books do you have?',fa:'چند کتاب داری؟'},{speaker:'Ali',en:'I have twenty books.',fa:'بیست کتاب دارم.'},{speaker:'Sara',en:'Does your sister have books?',fa:'خواهرت کتاب دارد؟'},{speaker:'Ali',en:'Yes. She has thirteen books.',fa:'بله، سیزده کتاب دارد.'},{speaker:'Sara',en:'How many pencils are there?',fa:'چند مداد وجود دارد؟'},{speaker:'Ali',en:'There are thirty-five pencils.',fa:'سی‌وپنج مداد وجود دارد.'}],
  image:'./assets/scene-a1-8-numbers.svg',imageAlt:'دو دسته ده‌تایی و چهار واحد برای تشخیص عدد بیست‌وچهار',pictureTasks:[task('از تصویر بگو بیست‌وچهار خودکار وجود دارد.','There are twenty-four pens.'),task('بگو من بیست‌وچهار خودکار دارم.','I have twenty-four pens.')],
  guidedTurns:[{speaker:'دوست',incoming:'How many pens do you have?',...task('بگو سیزده خودکار داری.','I have thirteen pens.')},{speaker:'دوست',incoming:'Are there thirty books?',...task('بگو نه، بیست کتاب وجود دارد.','No, there are twenty books.')},{speaker:'دوست',incoming:'Does your sister have pencils?',...task('بگو بله، خواهرم چهل مداد دارد.','Yes, my sister has forty pencils.')}],
  free:mkFree('a1-8-independent','دو موقعیت خیالی بساز: دربارهٔ تعداد وسیله‌های خودت و خواهرت حرف بزن، سپس بگو چند شیء در یک اتاق وجود دارد. دست‌کم یکی از اعداد سیزده تا صد را به کار ببر.','I have twenty books.\nMy sister has thirteen pencils.\nThere are thirty pens in the room.',['i have','there are'])});
 save('a1-8-v3.json',lesson);
}

// A1-12: school is where verbs are taught systematically; food will reuse them.
{
 const old=load('a1-13-v1.json'),oldComposer=structuredClone(old.sections[0].activities.find(a=>a.type==='sentence-composer'));
 oldComposer.id='a1-12-composer';oldComposer.title='چه کسی چه کاری می‌کند؟';oldComposer.description='تفاوت read/write/go/walk/open/close را با انتخاب شیء یا مقصد مناسب ببین؛ فاعل و شکل جمله هم تغییر می‌کنند.';
 const actions=[
  ['read','reads','خواندن',[['a book','یک کتاب','📖'],['a story','یک داستان','📗']]],
  ['write','writes','نوشتن',[['a note','یک یادداشت','📝'],['a sentence','یک جمله','✏️']]],
  ['study','studies','درس خواندن',[['English','انگلیسی','📘'],['at school','در مدرسه','🏫']]],
  ['go','goes','رفتن',[['to school','به مدرسه','🏫'],['to class','به کلاس','🚪']]],
  ['walk','walks','پیاده رفتن',[['to school','به مدرسه','🚶'],['to the classroom','به کلاس','🚪']]],
  ['sit','sits','نشستن',[['at a desk','پشت میز','🪑'],['in the classroom','در کلاس','🏫']]],
  ['open','opens','باز کردن',[['the book','کتاب را','📖'],['the door','در را','🚪']]],
  ['close','closes','بستن',[['the book','کتاب را','📕'],['the door','در را','🚪']]]
 ];
 oldComposer.wordSets.verbs=actions.map(([en,third,fa])=>({id:en,label:en,translation:fa,forms:{en,fa}}));
 oldComposer.wordSets.objects=actions.flatMap(([verb,, ,objects])=>objects.map(([en,fa])=>({id:verb+'-'+en.replaceAll(' ','-'),label:en,translation:fa,forms:{en},availableWhen:{slot:'verb',in:[verb]}})));
 oldComposer.slots.find(s=>s.id==='verb').default='read';oldComposer.slots.find(s=>s.id==='object').default='read-a-book';oldComposer.slots.find(s=>s.id==='object').label='شیء یا مقصد';
 oldComposer.derivedDefaults={verb:'read',object:'read-a-book',does:'Do',not:"don't"};
 oldComposer.dependencies=[...actions.map(([verb])=>({id:'action-'+verb,when:{slot:'verb',equals:verb},set:{verb,object:verb+'-'+actions.find(x=>x[0]===verb)[3][0][0].replaceAll(' ','-')}})),
 ...['she','he'].map(subject=>({id:'third-'+subject,when:{slot:'subject',equals:subject},set:{does:'Does',not:"doesn't"}})),
 ...actions.flatMap(([verb,third])=>['she','he'].map(subject=>({id:verb+'-'+subject,when:{all:[{slot:'verb',equals:verb},{slot:'subject',equals:subject}]},set:{verb:third}})))];
 const core=[word('school','مدرسه',['I go to school.','She walks to school.','The school is near my house.']),word('classroom','کلاس درس',['I sit in the classroom.','The classroom is big.','I walk to the classroom.']),word('teacher','معلم',['The teacher reads a book.','My teacher writes a sentence.','The teacher is in the classroom.']),word('desk','میز مطالعه',['I sit at a desk.','The book is on the desk.','My pen is on the desk.']),word('board','تخته',['The teacher writes on the board.','The board is big.','The board is in the classroom.']),word('homework','تکلیف',['I have homework.','My homework is in my bag.','I do my homework.']),
  ...actions.filter(([en])=>en!=='study').map(([en,,fa,objects])=>word(en,fa,[`I ${en} ${objects[0][0]}.`,`My sister ${actions.find(x=>x[0]===en)[1]} ${objects[0][0]}.`,`Do you ${en} ${objects[0][0]}?`]))];
 const supplemental=[word('library','کتابخانه',['The library is near the school.'],'supplementary'),word('eraser','پاک‌کن',['The eraser is on the desk.'],'supplementary'),word('marker','ماژیک',['The teacher has a marker.'],'supplementary'),word('exam','امتحان',['I have an exam.'],'supplementary'),word('uniform','لباس فرم',['The uniform is blue.'],'supplementary'),word('playground','حیاط بازی',['We walk to the playground.'],'supplementary')];
 const phrases=[phrase('read a book','کتاب خواندن',['I read a book.','My sister reads a book.']),phrase('write a sentence','نوشتن جمله',['I write a sentence.','The teacher writes a sentence.']),phrase('go to school','به مدرسه رفتن',['I go to school.','He goes to school.']),phrase('walk to school','پیاده به مدرسه رفتن',['I walk to school.','She walks to school.']),phrase('at a desk','پشت میز',['I sit at a desk.','My brother sits at a desk.']),phrase('in the classroom','در کلاس',['I study in the classroom.','The teacher is in the classroom.']),phrase('open the book','کتاب را باز کردن',['I open the book.','Do you open the book?']),phrase('close the book','کتاب را بستن',['I close the book.','She closes the book.'])];
 const actionOptions=actions.map(([en,third,fa,objects])=>({en,third,fa,emoji:({read:'📖',write:'✍️',study:'📚',go:'🏫',walk:'🚶',sit:'🪑',open:'📖',close:'📕'})[en],objects:objects.map(([en,fa,emoji])=>({en,fa,emoji}))}));
 const exchangePairs=[
  exchange('What do you read at school?','در مدرسه چه می‌خوانی؟',[["کتاب","I read a book.","کتاب می‌خوانم."],["داستان","I read a story.","داستان می‌خوانم."],["درس","I study English.","انگلیسی می‌خوانم."],["معلم","My teacher reads a book.","معلمم کتاب می‌خواند."]]),
  exchange('Do you walk to school?','پیاده به مدرسه می‌روی؟',[["بله","Yes, I walk to school.","بله، پیاده می‌روم."],["نه","No, I don't walk to school.","نه، پیاده نمی‌روم."],["خواهرم","My sister walks to school.","خواهرم پیاده می‌رود."],["می‌روم","I go to school every day.","هر روز به مدرسه می‌روم."]]),
  exchange('Does your sister write a sentence?','خواهرت یک جمله می‌نویسد؟',[["بله","Yes, she writes a sentence.","بله، یک جمله می‌نویسد."],["نه","No, she doesn't write a sentence.","نه، جمله نمی‌نویسد."],["می‌خواند","No, she reads a book.","نه، کتاب می‌خواند."],["من","I write a sentence.","من یک جمله می‌نویسم."]]),
  exchange('Where is your book?','کتابت کجاست؟',[["روی میز","My book is on the desk.","کتابم روی میز است."],["در کیف","My book is in my bag.","کتابم در کیف است."],["پدر","My father has my book.","پدرم کتابم را دارد."],["خواهر","My sister reads my book.","خواهرم کتاب مرا می‌خواند."]]),
  exchange('What does the teacher do?','معلم چه کاری می‌کند؟',[["می‌نویسد","The teacher writes on the board.","روی تخته می‌نویسد."],["می‌خواند","The teacher reads a book.","کتاب می‌خواند."],["در را باز می‌کند","The teacher opens the door.","در را باز می‌کند."],["کتاب را می‌بندد","The teacher closes the book.","کتاب را می‌بندد."]])];
 const lesson=makeLesson({id:'A1-12',title:'مدرسه، مطالعه و فعالیت‌های ساده',goal:'واژه‌های مدرسه را با read/write/go/walk/sit/open/close در خبری، منفی و پرسشی ترکیب کن؛ ضمایر و وسایل آموخته‌شده را دوباره به کار ببر.',feature:'کلاس و افعال قابل تغییر',orientation:['لوازم شخصی درس سوم','موقعیت مکانی درس پنجم','تحصیل ساده در درس نهم'],
  shadow:['I read a book.','My sister reads a book.','The teacher writes on the board.','I go to school.','My brother walks to school.','I sit at a desk.','Do you read books?','She does not write a sentence.','Open the book, please.','Close the book, please.'],
  words:[...core,...supplemental],phrases,meaningConcepts:[meaning('go-walk','راه‌رفتن روش خاصی از رفتن است.',[['I go to school.','به مدرسه می‌روم.','equivalent','فقط رفتن را بیان می‌کند.'],['I walk to school.','پیاده به مدرسه می‌روم.','related','روش رفتن را مشخص می‌کند.'],['Does your sister walk to school?','آیا خواهرت پیاده می‌رود؟','related','همان عمل را سؤال می‌کنیم.']]),meaning('read-write','خواندن با نوشتن فرق دارد.',[['I read a book.','کتاب می‌خوانم.','equivalent','اطلاعات را می‌خوانی.'],['I write a sentence.','جمله می‌نویسم.','related','یک عمل متفاوت است.'],['My sister reads a book.','خواهرم کتاب می‌خواند.','related','فاعل و شکل فعل عوض شد.']])],composer:oldComposer,
  lab:{id:'a1-12-action-lab',type:'daily-choice-lab',title:'فاعل، فعل و شیء را معنا‌دار تغییر بده',description:'فعل‌های کلاس را با کتاب، جمله، تخته یا مقصد مناسب ترکیب کن؛ خبری و منفی و پرسشی را ببین.',details:{mode:'school',options:actionOptions}},
  quizSentences:['I read a book.','My sister writes a sentence.','Do you walk to school?','He does not read a book.','The teacher writes on the board.'],
  warmup:[task('بگو من کتاب می‌خوانم.','I read a book.'),task('بگو خواهرم یک جمله می‌نویسد.','My sister writes a sentence.'),task('بگو من پیاده به مدرسه می‌روم.','I walk to school.'),task('بگو پدرم کتاب را باز می‌کند.','My father opens the book.'),task('بگو خواهرم کتاب نمی‌خواند.',"My sister doesn't read a book."),task('بپرس آیا برادرت به مدرسه می‌رود؟','Does your brother go to school?')],exchangePairs,
  dialogueLines:[{speaker:'Teacher',en:'Good morning! Open your books, please.',fa:'صبح بخیر! لطفاً کتاب‌ها را باز کنید.'},{speaker:'Sara',en:'Good morning! I have my book.',fa:'صبح بخیر! کتابم را دارم.'},{speaker:'Teacher',en:'Do you read English?',fa:'انگلیسی می‌خوانی؟'},{speaker:'Sara',en:'Yes, I read English at school.',fa:'بله، در مدرسه انگلیسی می‌خوانم.'},{speaker:'Teacher',en:'Does your brother walk to school?',fa:'برادرت پیاده به مدرسه می‌رود؟'},{speaker:'Sara',en:'No, he does not walk to school.',fa:'نه، پیاده به مدرسه نمی‌رود.'},{speaker:'Teacher',en:'Please write a sentence on the board.',fa:'لطفاً یک جمله روی تخته بنویس.'},{speaker:'Sara',en:'Yes. I write a sentence.',fa:'بله، یک جمله می‌نویسم.'}],
  image:'./assets/scene-a1-12-school.svg',imageAlt:'کلاس درس با میز، تخته، کتاب باز و دو دانش‌آموز',pictureTasks:[task('بگو یک کتاب روی میز است.','There is a book on the desk.'),task('بگو معلم روی تخته می‌نویسد.','The teacher writes on the board.'),task('بگو من در کلاس کتاب می‌خوانم.','I read a book in the classroom.')],
  guidedTurns:[{speaker:'معلم',incoming:'Do you read books?',...task('بگو بله، کتاب می‌خوانم.','Yes, I read books.')},{speaker:'دوست',incoming:'Does your sister walk to school?',...task('بگو بله، خواهرم پیاده به مدرسه می‌رود.','Yes, my sister walks to school.')},{speaker:'معلم',incoming:'What does your brother do?',...task('بگو برادرم انگلیسی می‌خواند.','My brother studies English.')},{speaker:'معلم',incoming:'Do you write on the board?',...task('بگو نه، در دفتر جمله می‌نویسم.','No, I write a sentence in my notebook.')}],
  free:mkFree('a1-12-independent','یک روز مدرسهٔ خیالی را در چهار یا پنج جمله توصیف کن. یک بار read، یک بار write، یک بار walk یا go و یک پرسش Do/Does بیاور. از کتاب، قلم و خانوادهٔ درس‌های قبل هم استفاده کن.','I go to school.\nI read a book.\nMy sister writes a sentence.\nDo you walk to school?',['read','write','school'])});
 save('a1-12-v2.json',lesson);
}
console.log('Authored new A1-8 number transfer and A1-12 school/action-verb lessons.');
