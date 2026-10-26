// One-time editorial amendment: give underused core words an actual production task.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '../..');
const course = JSON.parse(readFileSync(resolve(root, 'content/language-pairs/fa-en/curriculum.a1.json'), 'utf8'));
const byId = new Map(course.stages.flatMap(s => s.chapters).flatMap(c => c.lessons).filter(x => x.file).map(x => [x.id, x]));
const changes = [
  ['A1-1', 'hello-intro-check', [
    ['موقع خداحافظی شبانه چه می‌گویی؟', 'Good night!', ['good', 'night']],
    ['وقتی یک گردشگر تازه وارد می‌شود، به او خوشامد بگو.', 'Welcome!', ['welcome']]
  ]],
  ['A1-2', 'family-intro-check', [
    ['به عکس اشاره کن و بگو «به این عکس نگاه کن. این مادر من است».', 'Look at this photo. This is my mother.', ['look', 'photo', 'mother']]
  ]],
  ['A1-3', 'ownership-have-practice', [
    ['بگو من خودکار ندارم؛ از جملهٔ منفی داشتن استفاده کن.', "I don't have a pen.", ["don't", 'have', 'pen']]
  ]],
  ['A1-4', 'count-family-transfer', [
    ['بگو من سه گوسفند دارم.', 'I have three sheep.', ['three', 'sheep']],
    ['بگو من یک نفر را می‌بینم.', 'I see one person.', ['one', 'person']],
    ['بگو من دو اتوبوس می‌بینم.', 'I see two buses.', ['two', 'buses']],
    ['بگو من یک موش می‌بینم.', 'I see one mouse.', ['one', 'mouse']]
  ]],
  ['A1-5', 'places-cumulative-transfer', [
    ['بگو کیف بین دو صندلی است.', 'The bag is between two chairs.', ['bag', 'between', 'chairs']],
    ['بگو کتاب من همین‌جاست.', 'My book is here.', ['book', 'here']]
  ]],
  ['A1-7', 'a1-7-build', [
    ['بگو برادرم بازوهای قوی دارد.', 'My brother has strong arms.', ['brother', 'arms']],
    ['بگو پدرم خوش‌چهره است.', 'My father is handsome.', ['father', 'handsome']]
  ]],
  ['A1-11', 'a1-10-build', [
    ['بگو خواهرم در خانه است.', 'My sister is at home.', ['sister', 'home']]
  ]],
  ['A1-12', 'a1-12-build', [
    ['بگو من تکلیف مدرسه دارم.', 'I have homework.', ['have', 'homework']]
  ]],
  ['A1-13', 'a1-11-build', [
    ['بگو من یک تخم‌مرغ می‌خورم.', 'I eat an egg.', ['eat', 'egg']],
    ['بگو پدرم مرغ را در فر می‌پزد.', 'My father cooks chicken in the oven.', ['father', 'cooks', 'chicken', 'oven']],
    ['بگو من مرغ را خرد می‌کنم.', 'I chop the chicken.', ['chop', 'chicken']],
    ['بگو من تخم‌مرغ و شیر را مخلوط می‌کنم.', 'I mix eggs and milk.', ['mix', 'eggs', 'milk']]
  ]],
  ['A1-14', 'a1-12-build', [
    ['سر میز با لطف درخواست چاقو کن.', 'Pass me the knife, please.', ['pass', 'knife']],
    ['با ادب بگو من یک دستمال سفره می‌خواهم.', 'I want a napkin, please.', ['want', 'napkin']],
    ['بگو سوپ ترش است.', 'The soup is sour.', ['soup', 'sour']]
  ]]
];
for (const [lessonId, practiceId, tasks] of changes) {
  const entry = byId.get(lessonId);
  if (!entry) throw Error(`Missing lesson ${lessonId}`);
  const path = resolve(root, 'content/language-pairs/fa-en', entry.file);
  const lesson = JSON.parse(readFileSync(path, 'utf8'));
  const practice = lesson.sections.flatMap(s => s.activities).find(x => x.id === practiceId);
  if (!practice || !Array.isArray(practice.tasks)) throw Error(`Missing practice ${lessonId}/${practiceId}`);
  for (const [task, example, required] of tasks) {
    if (practice.tasks.some(x => x.example === example)) continue;
    practice.tasks.push({ task, hint: example, example, assessment: { required, success: 'این واژه را در یک جملهٔ واقعی به کار بردی.' } });
  }
  writeFileSync(path, `${JSON.stringify(lesson, null, 2)}\n`);
  console.log(`${lessonId}: added core-word practice to ${practiceId}`);
}
