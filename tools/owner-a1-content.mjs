/** One-time targeted editorial transforms for the owner's October A1 rearrangement. */
import { readFileSync, writeFileSync } from 'node:fs';
const root = new URL('../content/language-pairs/fa-en/lessons/', import.meta.url);
const load = name => JSON.parse(readFileSync(new URL(name,root),'utf8'));
const save = (name, data) => writeFileSync(new URL(name,root),JSON.stringify(data,null,2)+'\n');
const activity = (lesson,id)=>lesson.sections.flatMap(s=>s.activities).find(a=>a.id===id);
const vocab = lesson=>lesson.sections[0].activities.find(a=>a.type==='vocabulary');
const task = (fa,en)=>({task:fa,hint:en,example:en,assessment:{required:[{any:[en.toLowerCase().replace(/[.?!]/g,'')],feedback:'ترتیب فاعل، فعل و کلمات را بررسی کن.'}],success:'جمله درست است.'}});
const expression=(en,fa,examples)=>({en,fa,kind:'fixed',examples});
const need=(name,d)=>({en:name,fa:d,examples:[]});
const byId=ids=>new Set(ids);

// A1-1: short self-talk and small travel encounters, not a complete personal profile.
{
 const l=load('a1-1-v2.json');l.revision=Number(l.revision||0)+1;
 l.title='اولین برخورد و عبارت‌های روزمره';
 l.goal='سلام و احوال‌پرسی کوتاه، بیان نام و جنسیت ساده، صبح‌به‌خیر و شب‌به‌خیر و انجام گفت‌وگوی دو یا سه‌نوبتی در سفر.';
 l.orientation.goal='با عبارت‌های کوتاه بتوانی با یک گردشگر سلام و احوال‌پرسی کنی، اسمت و boy/girl را بگویی و خداحافظی کنی؛ سن، کشور و شغل لازم نیست.';
 const words=vocab(l);words.items.push({en:'boy',fa:'پسر',hint:'برای اشارهٔ ساده به جنسیت کودک یا نوجوان',examples:["I'm a boy.",'This is a boy.','He is a boy.']},{en:'girl',fa:'دختر',hint:'برای اشارهٔ ساده به جنسیت کودک یا نوجوان',examples:["I'm a girl.",'This is a girl.','She is a girl.']});
 activity(l,'a1-1-shadowing').lines.push("I'm a boy.","I'm a girl.");
 const phrases=l.sections[0].activities.find(a=>a.type==='expression-study');
 phrases.items.push(expression("I'm a boy",'من پسر هستم',["I'm a boy.",'Hello! My name is Sam. I am a boy.']),expression("I'm a girl",'من دختر هستم',["I'm a girl.",'Hi! My name is Sara. I am a girl.']));
 const checks=l.sections[0].activities.find(a=>a.type==='response-practice');checks.tasks.push(task('در یک معرفی کوتاه بگو پسر هستی.',"I'm a boy."),task('در یک معرفی دیگر بگو دختر هستی.',"I'm a girl."));
 const exchange=l.sections[1].activities.find(a=>a.type==='exchange-lab');
 exchange.pairs.push({question:'Hello! What is your name?',questionFa:'سلام! اسمت چیست؟',variants:[
 {label:'اسم و سلام',en:'Hi! My name is Sara.',fa:'سلام! اسم من سارا است.'},
 {label:'پسر',en:"Hello! I'm Ali. I'm a boy.",fa:'سلام! من علی هستم؛ پسرم.'},
 {label:'دختر',en:"Hi! I'm Mina. I'm a girl.",fa:'سلام! من مینا هستم؛ دخترم.'},
 {label:'پایان گفتگو',en:'My name is Sam. Nice to meet you!',fa:'من سم هستم. از آشنایی خوشوقتم!'}]});
 l.sections[1].activities.find(a=>a.type==='free-write').prompt='یک مکالمهٔ خیالی سه‌خطی با یک گردشگر بساز: سلام متناسب با زمان، نام و جنسیت یک شخصیت فرضی، و جملهٔ پایانی خوشوقتی یا خداحافظی. اطلاعات سن و کشور لازم نیست.';
 save('a1-1-v2.json',l);
}

// A1-2: man/woman alongside mother/father; no have yet.
{
 const l=load('a1-2-v2.json');l.revision=Number(l.revision||0)+1;
 l.goal='جنسیت، ضمایر و نقش‌های خانوادگی را معرفی کن و سلام‌ها و نام گفتن درس اول را در مکالمهٔ خانوادگی دوباره به کار ببر.';
 l.orientation.goal='من مرد/زن هستم، من پدر/مادر هستم و این مادر من است را با she/he و my/his/her بساز؛ بدون معرفی فعل داشتن.';
 vocab(l).items.push({en:'man',fa:'مرد',examples:["I'm a man.",'He is a man.','This man is my father.']},{en:'woman',fa:'زن',examples:["I'm a woman.",'She is a woman.','This woman is my mother.']});
 activity(l,'a1-2-shadowing').lines.push("I'm a man.","I'm a woman.","I'm a mother.","I'm a father.");
 activity(l,'family-expressions').items.push(expression("I'm a man",'من مرد هستم',["I'm a man.",'He is a man.']),expression("I'm a woman",'من زن هستم',["I'm a woman.",'She is a woman.']),expression("I'm a father",'من پدر هستم',["I'm a father.",'This is my daughter.']),expression("I'm a mother",'من مادر هستم',["I'm a mother.",'This is my son.']));
 activity(l,'family-intro-check').tasks.push(task('بگو من زن هستم.',"I'm a woman."),task('بگو من مرد هستم.',"I'm a man."),task('بگو من مادر هستم.',"I'm a mother."),task('بگو من پدر هستم.',"I'm a father."));
 const e=l.sections[1].activities.find(a=>a.type==='exchange-lab');e.pairs.push({question:'Who are you in this family?',questionFa:'نقشت در خانواده چیست؟',variants:[
 {label:'مادر',en:"I'm a mother.",fa:'من مادر هستم.'},{label:'پدر',en:"I'm a father.",fa:'من پدر هستم.'},
 {label:'خواهر',en:"I'm a sister.",fa:'من خواهر هستم.'},{label:'برادر',en:"I'm a brother.",fa:'من برادر هستم.'}]});
 save('a1-2-v2.json',l);
}

// A1-3: make the possession lesson the first real appearance of personal objects.
{
 const l=load('a1-3-v4.json'),count=load('a1-4-v4.json');
 const list=vocab(count).items.filter(x=>byId(['book','bag','phone','pen','notebook','pencil']).has(x.en));
 vocab(l).items.push(...list);
 l.goal='وسایل شخصی را با my/mine معرفی کن، داشتن و نداشتن را تمرین کن و همان ساختار را به خانواده پیوند بده.';
 l.orientation.goal='با This is my pen، I have a pen و This is my mother / I have a daughter تفاوت مالکیت، معرفی و داشتن را در عمل بفهم.';
 activity(l,'a1-3-shadowing').lines.splice(2,2,'This is my mother.','I have a daughter.');
 activity(l,'ownership-expressions').items.push(expression('This is my mother','این مادر من است',['This is my mother.','This is my father.']),expression('I have a daughter','من یک دختر دارم',['I have a daughter.','I have a son.']));
 const response=l.sections[0].activities.find(a=>a.id==='ownership-have-practice');response.tasks.push(task('بگو این مادر من است.','This is my mother.'),task('بگو من یک دختر دارم.','I have a daughter.'),task('بگو من یک کتاب دارم.','I have a book.'));
 const ex=l.sections[1].activities.find(a=>a.type==='exchange-lab');ex.pairs.push({question:'Do you have a daughter?',questionFa:'آیا یک دختر داری؟',variants:[
  {label:'بله',en:'Yes, I have a daughter.',fa:'بله، یک دختر دارم.'},
  {label:'نه، پسر',en:'No, I have a son.',fa:'نه، یک پسر دارم.'},
  {label:'معرفی دختر',en:'This is my daughter.',fa:'این دختر من است.'},
  {label:'نداشتن',en:"No, I don't have a daughter.",fa:'نه، دختر ندارم.'}]});
 for(const section of l.sections)section.activities=section.activities.filter(a=>!['ownership-family-number-practice','ownership-four-six-build','ownership-four-six-transfer'].includes(a.id));
 const free=l.sections[1].activities.find(a=>a.type==='free-write');
 free.prompt='سه وسیلهٔ واقعی یا خیالی انتخاب کن. بگو کدام مال تو یا دیگری است؛ دربارهٔ چیزی که داری و نداری جمله بساز، یک سؤال Do you have ...? بپرس و یک بار این مادر من است / من یک دختر دارم را در گفت‌وگو به کار ببر. شمارش چندتایی در درس بعد است.';
 l.revision++;save('a1-3-v4.json',l);
 // A1-4: number is introduced now; old personal objects are recycled, not retaught.
 vocab(count).items=vocab(count).items.filter(x=>!byId(list.map(w=>w.en)).has(x.en));
 count.goal='عددهای ۱ تا ۱۲، جمع و شمارش خانواده و اشیا را با فعل داشتنِ درس قبل در جملهٔ کامل ترکیب کن.';
 count.orientation.goal='اعداد را بشمار، تعداد را بپرس و از I have / She has برای چند وسیله یا عضو خانواده استفاده کن.';
 activity(count,'counting-expressions').items.push(expression('I have three pens','من سه خودکار دارم',['I have three pens.','I have four books.']),expression('She has two sisters','او دو خواهر دارد',['She has two sisters.','My mother has three books.']));
 const builder=count.sections[0].activities.find(a=>a.id==='counting-construction');builder.tasks.push(task('بگو من سه مداد دارم.','I have three pencils.'),task('بگو خواهرم دو کتاب دارد.','My sister has two books.'));
 count.sections[1].activities.find(a=>a.type==='exchange-lab').pairs.push({question:'How many books do you have?',questionFa:'چند کتاب داری؟',variants:[
 {label:'دو',en:'I have two books.',fa:'دو کتاب دارم.'},{label:'سه',en:'I have three books.',fa:'سه کتاب دارم.'},
 {label:'چهار',en:'I have four books.',fa:'چهار کتاب دارم.'},{label:'ندارم',en:"I don't have any books.",fa:'هیچ کتابی ندارم.'}]});
 count.revision++;save('a1-4-v4.json',count);
}

// A1-9: numbers are no longer new vocabulary here; recall them from A1-8.
{
 const l=load('a1-9-v3.json');
 const numberWords=new Set('thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred'.split(' '));
 vocab(l).items=vocab(l).items.filter(x=>!numberWords.has(x.en)&&x.en!=='teacher');
 l.goal='سن، نام، شماره تماس، زبان، کشور و محل زندگی را بپرس و پاسخ بده؛ اعداد درس هشتم را در اطلاعات شخصی به کار ببر.';
 l.orientation.prerequisites=['عبارت‌های معرفی درس اول','اعداد ۱۳ تا ۱۰۰ از درس هشتم','خانواده و ضمایر'];
 l.sections[0].activities=l.sections[0].activities.filter(a=>!['a1-8-number-lab','a1-8-warmup'].includes(a.id));
 l.revision++;save('a1-9-v3.json',l);
}

// A1-13/14 transfer action-verb mastery into food contexts, rather than claiming first verbs.
{
 const food=load('a1-13-v1.json');food.goal='کاربرد افعال یادگرفته‌شده در مدرسه را به خوردن، نوشیدن، پختن و خواستن منتقل کن و خوراکی‌ها و آشپزخانه را در گفت‌وگو معرفی کن.';
 food.sections[0].intro='افعال عملی را از درس ۱۲ به خوراک منتقل کن: اول سایه‌خوانی، سپس واژه و عبارت، تفاوت معنی، جملهٔ زنده و ساخت مستقل.';
 food.revision++;save('a1-13-v1.json',food);
 const meals=load('a1-14-v1.json');meals.goal='در مورد وعده‌ها و مزهٔ خوراکی‌ها حرف بزن و فرق and/with/without را در گفت‌وگوی واقعی سر میز استفاده کن.';
 const ex=meals.sections[1].activities.find(a=>a.type==='exchange-lab');
 ex.pairs.push({question:'How do you drink your coffee?',questionFa:'قهوه‌ات را چطور می‌نوشی؟',variants:[
  {label:'با شکر',en:'I drink coffee with sugar.',fa:'قهوه را با شکر می‌نوشم.'},
  {label:'بدون شکر',en:'I drink coffee without sugar.',fa:'قهوه را بدون شکر می‌نوشم.'},
  {label:'شیر',en:'I drink coffee with milk.',fa:'قهوه را با شیر می‌نوشم.'},
  {label:'درخواست',en:'Coffee without sugar, please.',fa:'قهوه بدون شکر لطفاً.'} ]},
  {question:'Are you hungry?',questionFa:'گرسنه هستی؟',variants:[
    {label:'بله',en:'Yes, I am hungry.',fa:'بله، گرسنه‌ام.'},
    {label:'سیرم',en:"No, I'm full.",fa:'نه، سیرم.'},
    {label:'کمی',en:'A little. I want some bread.',fa:'کمی. نان می‌خواهم.'},
    {label:'لطفاً آب',en:"No, I'm full. Water, please.",fa:'نه، سیرم. آب لطفاً.'}]},
  {question:'Is your lunch spicy?',questionFa:'ناهارت تند است؟',variants:[
    {label:'تند',en:'Yes, it is spicy.',fa:'بله، تند است.'},
    {label:'شور',en:'No, it is salty.',fa:'نه، شور است.'},
    {label:'شیرین',en:'No, it is sweet.',fa:'نه، شیرین است.'},
    {label:'توضیح',en:'It is a little spicy, but delicious.',fa:'کمی تند اما خوشمزه است.'}]},
  {question:'Do you eat kebab with soda?',questionFa:'کباب را با نوشابه می‌خوری؟',variants:[
    {label:'بله',en:'Yes, I eat kebab with soda.',fa:'بله، کباب را با نوشابه می‌خورم.'},
    {label:'بدون نوشابه',en:'No, I eat kebab without soda.',fa:'نه، بدون نوشابه می‌خورم.'},
    {label:'با آب',en:'I eat kebab and drink water.',fa:'کباب می‌خورم و آب می‌نوشم.'},
    {label:'سؤال متقابل',en:'No, I drink water. What about you?',fa:'نه، آب می‌نوشم. تو چطور؟'}]});
 meals.sections[1].activities.find(a=>a.type==='free-write').prompt+=' همچنین در پاسخ‌ها یک‌بار full، یکی از مزه‌های sweet/salty/spicy و ترکیب with/without را به‌صورت طبیعی به کار ببر.';
 meals.revision++;save('a1-14-v1.json',meals);
}
console.log('Owner A1 content revisions applied to versioned lessons 1–4, 9, 13, 14.');
