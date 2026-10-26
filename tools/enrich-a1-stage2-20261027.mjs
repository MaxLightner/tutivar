/**
 * Content review after the structural A1.2 build: only required words are core.
 * Several extra guided prompts make introduced language actively retrievable.
 * Run once after author/finalize scripts.
 */
import { readFileSync, writeFileSync } from 'node:fs';
const prefix='content/language-pairs/fa-en/lessons/';
const read=path=>JSON.parse(readFileSync(path,'utf8'));
const put=(path,value)=>writeFileSync(path,JSON.stringify(value,null,2)+'\n');
const additions={
  15:[['مقایسه کن: اتوبوس از پیاده‌روی سریع‌تر است.','The bus is faster than walking.']],
  16:[['بگو من وقتی هوا سرد است پالتو می‌پوشم.','I wear a coat when it is cold.'],['بگو جوراب‌های من سفید هستند.','My socks are white.']],
  17:[['بگو شکمم پایین‌تر از سرم است.','My stomach is below my head.'],['بگو من دو پا دارم (جمع نامنظمِ foot).','I have two feet.']],
  18:[['بگو او (خانم) سرفه دارد.','She has a cough.'],['بگو دارو لازم دارم.','I need medicine.'],['بگو در پایم درد دارم.','I have pain in my leg.']],
  19:[['بگو پدرم کارگر است.','My father is a worker.']],
  20:[['بگو شیر را از سوپرمارکت می‌خرم.','I buy milk at the supermarket.'],['بگو میوه را از بازار می‌خرم.','I buy fruit at the market.'],['بپرس آیا این پیراهن اندازه است؟','Does this shirt fit?']],
  21:[['بگو این باقی پول شماست.','Here is your change.']],
  22:[['بگو این شهر یک پارک و یک بانک دارد.','This city has a park and a bank.']],
  23:[['بگو یک بلوک مستقیم برو.','Go straight for one block.'],['بگو از خیابان عبور کن.','Cross the street.']],
  24:[['بگو ما با قطار سفر می‌کنیم.','We travel by train.'],['بگو من سوار اتوبوس می‌شوم.','I ride the bus.']]
};
const focus={
  15:['bigger than'],16:['is wearing'],17:['two feet'],18:['I have a headache'],
  19:['What is your job?'],20:['I would like'],21:['by card'],22:['near here'],
  23:['Turn left'],24:['by taxi']
};
const optional={
  15:['compare'],17:[],18:['pharmacy'],19:[],20:['vegetable'],21:[],
  22:['station','place','store'],23:[],24:['subway','destination']
};
for(let n=15;n<=24;n++){
  const path=`${prefix}a1-${n}-v1.json`,lesson=read(path),all=lesson.sections.flatMap(section=>section.activities);
  const practice=all.find(a=>a.id===`a1-${n}-build`);
  if(!practice||practice.practiceRevision!==1||lesson.learningAudit.focusExpressions.length)
    throw Error('Unexpected lesson editing baseline for A1-'+n);
  for(const [task,example]of additions[n]||[]){
    practice.tasks.push({task,hint:'فعل و فاعل را دقیق انتخاب کن. نمونهٔ پاسخ بعد از دو تلاش می‌آید.',example,
      assessment:{required:[{any:[example],feedback:'یک جملهٔ کامل با همین معنی بنویس.'}],success:'پاسخ را با جملهٔ کامل ساختی.'}});
  }
  lesson.learningAudit.focusExpressions=focus[n];
  for(const word of all.find(a=>a.type==='vocabulary').items){
    if((optional[n]||[]).includes(word.en))word.role='supplementary';
  }
  put(path,lesson);
}
console.log('Added active retrieval and differentiated optional vocabulary to A1-15..24.');
