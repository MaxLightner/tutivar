/** Owner-requested pedagogic rebuild of A1-15..24. Never mutate A1.3 or old v1 lessons. */
import { readFileSync, writeFileSync } from 'node:fs';
import { stage2Depth, stage2AnswerVariants } from './a1-stage2-depth-specs.mjs';

const read = path => JSON.parse(readFileSync(path,'utf8'));
const save = (path,data) => writeFileSync(path,JSON.stringify(data,null,2)+'\n');
const base='content/language-pairs/fa-en/';
const course=read(base+'curriculum.a1.json');
const legacy=read('content/curriculum/legacy-alignment.json');
const version='2026-10-27-owner-stage2-real-interactions-v2';
const cards=course.stages[1].chapters.flatMap(ch=>ch.lessons);
const unaffected=JSON.stringify(course.stages[2]);
const preceding=JSON.stringify(cards.filter(card=>/^A1-1[34]$/.test(card.id)));

function activity(lesson,type){return lesson.sections.flatMap(s=>s.activities).find(a=>a.type===type);}
function item([en,fa,example],role){return {en,fa,examples:[example],...(role?{role}:{})};}
const approvedVariations={
  'My right eye hurts.':['My right eye is hurting.','I have pain in my right eye.'],
  'This man is a builder. He builds houses.':['He is a builder and he builds houses.'],
  'I need three apples and one bottle of milk.':['Please give me three apples and a bottle of milk.']
};
function practice([task,example],situation=''){
  const variants=[example,...(approvedVariations[example]||[])];
  if(example.startsWith('I need '))variants.push('I would like '+example.slice('I need '.length));
  return {task,hint:situation||'اول جمله را در ذهنت بساز، سپس به ترتیب فاعل، فعل و واژهٔ هدف دقت کن. پاسخ نمونه فقط پس از دو تلاش نمایش داده می‌شود.',example,assessment:{required:[{any:variants,feedback:'جملهٔ کامل انگلیسی را با همان معنی و فعل درست بنویس.'}],success:'معنای این موقعیت را درست بیان کردی.'}};
}
function exchange([question,questionFa,answer],index,number){
  const [answerFa,alternative,alternativeFa]=stage2AnswerVariants[number]?.[index]||[];
  if(!answerFa||!alternative||!alternativeFa)throw Error(`Missing contextual answer translation ${number}:${index}`);
  return {question,questionFa,variants:[{label:'پاسخ اول',en:answer,fa:answerFa},{label:'پاسخ دیگر',en:alternative,fa:alternativeFa}]};
}
const fixed=txt=>({fixed:txt}),slot=(name,form='fa')=>({slot:name,form});
function setPersian(composer,n){
  Object.values(composer.wordSets).flat().forEach(entry=>{entry.forms.fa=entry.translation||entry.label;});
  const ps=composer.patterns;
  if(n===15){
    composer.wordSets.first.forEach(entry=>{entry.forms.enWithin=entry.forms.en[0].toLowerCase()+entry.forms.en.slice(1);});
    ps[1].segments[1].form='enWithin';
    composer.wordSets.feature.forEach(entry=>{entry.forms.faPredicate=entry.translation.replace(/ از$/,'');});
    ps[0].translationSegments=[slot('first'),fixed(' از '),slot('second'),fixed(' '),slot('feature','faPredicate'),fixed(' است.')];
    ps[1].translationSegments=[fixed('فکر می‌کنم '),...ps[0].translationSegments];
  }
  if(n===16){
    const subjects=[['من','پوشیده‌ام'],['او','پوشیده است'],['او','پوشیده است'],['ما','پوشیده‌ایم']];
    composer.wordSets.person.forEach((entry,index)=>{entry.forms.fa=subjects[index][0];entry.forms.faVerb=subjects[index][1];});
    composer.wordSets.clothing.forEach(entry=>{entry.forms.faClothes=entry.translation.replace(/ پوشیده$/,'');});
    const base=[slot('person'),fixed(' '),slot('clothing','faClothes'),fixed(' '),slot('person','faVerb'),fixed('.')];
    ps[0].translationSegments=base;ps[1].translationSegments=[fixed('ببین! '),...base];
  }
  if(n===17){
    const options=(pairs)=>pairs.map(([en,fa],i)=>({id:`option-${i}`,label:en,translation:fa,forms:{en,fa}}));
    composer.wordSets={first:options([['My arm','دست من'],['My leg','پای من'],['My shoulder','شانهٔ من'],['My hand','دست من']]),second:options([['my finger','انگشت من'],['my foot','کف پای من'],['my wrist','مچ دست من'],['my knee','زانوی من']]),feature:options([['longer than','بلندتر از'],['bigger than','بزرگ‌تر از'],['smaller than','کوچک‌تر از']])};
    composer.slots=Object.keys(composer.wordSets).map(name=>({id:name,label:name,wordSet:name,default:'option-0'}));
    composer.defaultPattern='compare';
    composer.wordSets.first.forEach(entry=>{entry.forms.enWithin=entry.forms.en[0].toLowerCase()+entry.forms.en.slice(1);});
    composer.patterns=[{id:'compare',label:'مقایسه کن',segments:[slot('first','en'),fixed(' is '),slot('feature','en'),fixed(' '),slot('second','en'),fixed('.')],translationSegments:[slot('first'),fixed(' از '),slot('second'),fixed(' '),slot('feature'),fixed(' است.')]},{id:'opinion',label:'به نظرت چطور؟',segments:[fixed('I think '),slot('first','enWithin'),fixed(' is '),slot('feature','en'),fixed(' '),slot('second','en'),fixed('.')],translationSegments:[fixed('فکر می‌کنم '),slot('first'),fixed(' از '),slot('second'),fixed(' '),slot('feature'),fixed(' است.')]}];
    composer.wordSets.feature.forEach(entry=>{entry.forms.fa=entry.translation.replace(/ از$/,'');});
  }
  if(n===18){
    composer.wordSets.person.forEach((entry,i)=>{entry.forms.faSubject=i===0?'من':'او';entry.forms.faVerb=i===0?'دارم':'دارد';});
    const base=[slot('person','faSubject'),fixed(' '),slot('symptom'),fixed(' '),slot('person','faVerb'),fixed('.')];
    ps[0].translationSegments=base;ps[1].translationSegments=[...base,fixed(' به کمک نیاز دارم.')];
    composer.wordSets.symptom.push(...[['a stomachache','دل‌درد'],['a toothache','دندان‌درد'],['an earache','گوش‌درد']].map(([en,fa],i)=>({id:'new-'+i,label:en,translation:fa,forms:{en,fa}})));
  }
  if(n===19){
    const base=[slot('subject'),fixed(' '),slot('role'),fixed(' است.')];
    ps[0].translationSegments=base;ps[1].translationSegments=[fixed('ببین! '),...base];
    composer.wordSets.role.push(...[['builder','بنا'],['mechanic','مکانیک'],['baker','نانوا'],['waiter','پیشخدمت']].map(([en,fa],i)=>({id:'role-'+i,label:'a '+en,translation:fa,forms:{en:'a '+en,fa}})));
  }
  if(n===20){ps[0].translationSegments=[fixed('لطفاً '),slot('item'),fixed(' '),slot('request'),fixed('.')];ps[1].translationSegments=[fixed('می‌خواهم '),slot('item'),fixed(' بخرم.')];}
  if(n===21){ps[0].translationSegments=[fixed('می‌توانم '),slot('method'),fixed(' پرداخت کنم؟')];ps[1].translationSegments=[fixed('می‌توانم '),slot('document'),fixed(' بگیرم؟')];}
  if(n===22){ps[0].translationSegments=[fixed('نزدیک '),slot('reference'),fixed(' '),slot('place'),fixed(' وجود دارد.')];ps[1].translationSegments=[fixed('آیا نزدیک '),slot('reference'),fixed(' '),slot('place'),fixed(' هست؟')];}
  if(n===23){
    composer.wordSets.turn=[['turn left','به چپ بپیچ'],['turn right','به راست بپیچ']].map(([en,fa],i)=>({id:'turn-'+i,label:en,translation:fa,forms:{en,fa}}));
    composer.slots.push({id:'turn',label:'پیچ بعدی',wordSet:'turn',default:'turn-0'});
    const instruction=[slot('movement','en'),fixed(', then '),slot('turn','en'),fixed(' '),slot('landmark','en'),fixed('.')];
    const translation=[slot('movement'),fixed('، سپس '),slot('landmark'),fixed(' '),slot('turn'),fixed('.')];
    composer.patterns=[{id:'step',label:'دو مرحلهٔ مسیر',segments:instruction,translationSegments:translation},{id:'two',label:'مسیر را تأیید کن',segments:[...instruction,fixed(' Is that clear?')],translationSegments:[...translation,fixed(' مسیر روشن است؟')]}];
  }
  if(n===24){ps[0].translationSegments=[fixed('من '),slot('vehicle'),fixed(' به '),slot('destination'),fixed(' می‌روم.')];ps[1].translationSegments=[fixed('تو '),slot('vehicle'),fixed(' به '),slot('destination'),fixed(' می‌روی؟')];}
}

for(let n=15;n<=24;n++){
  const card=cards.find(x=>x.id==='A1-'+n);
  if(card.file!==`lessons/a1-${n}-v1.json`&&card.file!==`lessons/a1-${n}-v2.json`)throw Error('Unexpected course file for '+n);
  const lesson=read(base+`lessons/a1-${n}-v1.json`),spec=stage2Depth[n];
  if(lesson.id!==card.id||!spec)throw Error('Lesson mismatch '+n);
  lesson.revision=version;
  const first=lesson.sections[0].activities,second=lesson.sections[1].activities;
  const vocab=activity(lesson,'vocabulary');
  vocab.title='واژگان کلیدی و تکمیلی این موقعیت';vocab.deckRevision=2;
  vocab.items.push(...spec.core.map(row=>item(row)),...spec.optional.map(row=>item(row,'supplementary')));
  const expressions=activity(lesson,'expression-study');
  expressions.description='عبارت‌ها را با ترجمه و نمونه ببین؛ سپس همان‌ها را در صحنهٔ تعاملی به کار ببر.';
  const used=new Set(expressions.items.map(row=>row.en.toLowerCase()));
  expressions.items.push(...spec.phrases.filter(p=>!used.has(p[0].toLowerCase())).map(([en,fa,example])=>({en,fa,kind:'fixed',examples:[example]})));
  activity(lesson,'shadowing').lines=spec.intro;
  const composer=activity(lesson,'sentence-composer');
  setPersian(composer,n);
  composer.description='روی واژه‌های روشن جمله بزن؛ معنی فارسی هم‌زمان با تغییر فاعل، ویژگی یا شیء تغییر می‌کند.';
  const variant=activity(lesson,'composer-view');
  variant.description='یک ساختار را با معنی متفاوت بساز و ترجمهٔ هر تغییر را هم ببین.';
  if(n===17)variant.patternIds=['compare','opinion'];
  const genericQuiz=first.findIndex(a=>a.type==='quiz-set');
  if(genericQuiz<0)throw Error('Expected three-choice quiz '+n);
  first.splice(genericQuiz,1);
  const mission={...structuredClone(spec.mission),id:`a1-${n}-mission`,type:'mission-lab',phase:'variants'};
  first.splice(5,0,mission);
  if(spec.secondMission)first.splice(6,0,{...structuredClone(spec.secondMission),id:`a1-${n}-ticket-mission`,type:'mission-lab',phase:'variants'});
  lesson.sections[0].masteryActivityIds.push(mission.id);
  if(spec.secondMission)lesson.sections[0].masteryActivityIds.push(`a1-${n}-ticket-mission`);
  const response=activity(lesson,'response-practice');
  response.description='از حفظ‌کردن گزینه‌ها عبور کن؛ پاسخ را خودت به انگلیسی بنویس و بعد از هر تلاش بازخورد بگیر.';
  response.tasks.push(...spec.tasks.map(t=>practice(t)));
  const exchangeActivity=activity(lesson,'exchange-lab');
  exchangeActivity.description='اول در ذهن جواب بده؛ سپس پاسخ نمونه را آشکار کن و شکل‌های دیگر پاسخ را بررسی کن.';
  exchangeActivity.requireRecall=true;
  exchangeActivity.pairs.push(...spec.questions.map((question,i)=>exchange(question,i,n)));
  const guided=activity(lesson,'guided-dialogue');
  guided.description='با حداقل هفت نوبت پاسخ مستقل؛ جواب را انتخاب نمی‌کنی، خودت می‌نویسی.';
  guided.turns.push(...spec.tasks.map(([fa,en],i)=>({speaker:i%2?'مشتری خیالی':'همراهت',incoming:spec.questions[i%spec.questions.length][0],...practice([fa,en])})));
  const picture=activity(lesson,'picture-description');
  picture.title='از صحنه به زبان؛ خودت توضیح بده';
  picture.description='از عبارت‌های ثابت تصویر فراتر برو؛ صحنهٔ جدید را با جزئیات نوشته‌شده توصیف کن.';
  picture.tasks.push(...spec.tasks.slice(0,2).map(t=>practice(t)));
  const independent=activity(lesson,'free-write');
  independent.prompt=spec.independent;
  independent.realWorldMission.reflection=spec.independent;
  independent.minWords=Math.max(14,independent.minWords||14);
  independent.assessment.revision=2;
  // Older assessment patterns must not reject newly introduced, central words.
  const extraPatterns={
    15:['\\b(?:darker|lighter|prettier|tastier|sweeter|more beautiful|more colorful)\\s+than\\b'],
    17:['\\b(?:arm|wrist|ankle|finger|toe|chest|elbow|feet)\\b'],
    18:['\\b(?:stomachache|nauseous|toothache|earache|sore|throat|weak|vomit|nausea)\\b'],
    19:['\\b(?:builder|mechanic|dentist|pilot|baker|waiter|cleaner|artist|carpenter|plumber)\\b'],
    22:['\\b(?:hospital|bakery|museum|bridge|plaza|library|supermarket)\\b']
  }[n];
  if(extraPatterns)independent.assessment.required[0].patterns.push(...extraPatterns);
  const dialogue=activity(lesson,'dialogue');
  dialogue.lines.push(...spec.questions.slice(0,2).flatMap(([en,fa,answer],i)=>[
    {speaker:i%2?'Ali':'Sara',en,fa},{speaker:i%2?'Sara':'Ali',en:answer,fa:spec.tasks[i]?.[0]||fa}
  ]));
  // Provide a written meaning alongside each completed puzzle sentence.
  const puzzle=activity(lesson,'sentence-builder');
  puzzle.sentences.forEach((row,i)=>{row.fa=(response.tasks[i]||response.tasks[0]).task;});
  save(base+`lessons/a1-${n}-v2.json`,lesson);
  card.file=`lessons/a1-${n}-v2.json`;
}
if(JSON.stringify(course.stages[2])!==unaffected||JSON.stringify(cards.filter(card=>/^A1-1[34]$/.test(card.id)))!==preceding)throw Error('Stage boundary violation');
legacy.stage2PracticalSequence.depthRevision={
  revision:version,
  reason:'Owner feedback: meaningful interactive comparison, clothing translations and optional vocabulary, deeper symptoms and jobs, actual shopping lists, bill/receipt, map search and multi-step routing',
  preserveProgress:true,
  source:'2026-10-27 Tutivar A1.2 owner lesson-by-lesson review',
  replacementFiles:Object.fromEntries(Array.from({length:10},(_,i)=>{const n=i+15;return [`A1-${n}`,`lessons/a1-${n}-v2.json`];}))
};
save(base+'curriculum.a1.json',course);
save('content/curriculum/legacy-alignment.json',legacy);
console.log('Expanded A1-15..24 into independent v2 lessons; old v1 and A1.3 preserved.');
