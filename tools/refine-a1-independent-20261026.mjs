/**
 * One-time refinement of the new, versioned A1 lessons. Earlier lesson files
 * and historically stable activity IDs are deliberately left unchanged.
 * Independent writing checks broad communicative actions; guided practice
 * is still responsible for exact phrase retrieval.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const prefix = 'content/language-pairs/fa-en/lessons/';
const phrase = (any, feedback) => ({ any, feedback });
const pattern = (patterns, feedback) => ({ patterns, feedback });
const revisions = {
  'a1-1-v3.json': [
    phrase(['good morning', 'good afternoon', 'good evening', 'hello', 'hi'], 'مکالمه را با یک سلام مناسب آغاز کن.'),
    pattern(["\\b(?:i'm|i am|my name is)\\s+(?!fine\\b|good\\b|okay\\b|not\\b|thanks\\b)[a-z]+\\b"], 'نام یک شخصیت واقعی یا خیالی را معرفی کن.'),
    phrase(['how are you', 'what is your name', "what's your name", 'nice to meet you'], 'از طرف مقابل یک سؤال کوتاه بپرس یا واکنش آشنایی نشان بده.')
  ],
  'a1-2-v3.json': [
    pattern(['\\bthis is (?:my|your|his|her) (?:mother|father|sister|brother|son|daughter)\\b', '\\b(?:my|your) (?:mother|father|sister|brother|son|daughter) is\\b'], 'یکی از اعضای خانواده را با نسبت معرفی کن.'),
    pattern(["\\b(?:who is this|who's this|is this your|who is he|who is she)\\b"], 'یک سؤال دربارهٔ فرد یا نسبت خانوادگی بپرس.'),
    pattern(['\\b(?:he is|she is|his name is|her name is)\\b'], 'از he یا she یا مالکیت his/her استفاده کن.'),
    pattern(['\\bi am a (?:man|woman|father|mother|sister|brother|son|daughter)\\b', "\\bi'm a (?:man|woman|father|mother|sister|brother|son|daughter)\\b"], 'نقش یا جنسیت خودِ شخصیت را هم با I am a ... معرفی کن.')
  ],
  'a1-3-v5.json': [
    pattern(["\\b(?:this is (?:my|your|his|her)|it is (?:mine|yours)|it's (?:mine|yours))\\b"], 'مالک یک شیء را با my/your/his/her یا mine/yours مشخص کن.'),
    pattern(['\\b(?:i|you|he|she|they|my [a-z]+) (?:have|has)\\b'], 'دربارهٔ داشتن یک وسیله جمله بساز.'),
    pattern(["\\b(?:do you have|does (?:he|she) have|i don't have|i do not have|he doesn't have|she doesn't have)\\b"], 'یک سؤال یا جملهٔ منفی دربارهٔ داشتن بساز.')
  ],
  'a1-4-v5.json': [
    pattern(['\\b(?:how many|there (?:is|are)|(?:i|you|he|she|they) (?:have|has))\\b'], 'از تعداد بپرس یا تعداد افراد یا وسایل را در جمله‌ای بیان کن.'),
    pattern(['\\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|1[0-2]|[1-9])\\b'], 'حداقل یک عدد بین یک تا دوازده را در جمله‌ای بگو.'),
    pattern(['\\b(?:books|pens|pencils|bags|phones|cups|brothers|sisters|apples|keys|chairs)\\b'], 'نام یک چیز یا عضو خانواده را با تعداد جمع ببند.')
  ],
  'a1-10-v4.json': [
    phrase(['there is', 'there are'], 'دربارهٔ چیزی که در خانه وجود دارد جمله بساز.'),
    pattern(['\\b(?:in|on|under|next to|behind|above) (?:the|my) (?:bedroom|kitchen|bathroom|living room|table|bed|room|house)\\b'], 'محل یک وسیله را با قید مکان و یک اتاق یا وسیله مشخص کن.'),
    pattern(['\\b(?:my|your|his|her|our) house has\\b', '\\b(?:there are|there is no|there are no)\\b'], 'تعداد اتاق‌ها یا نبودن یکی از وسایل را نیز بیان کن.')
  ],
  'a1-12-v3.json': [
    pattern(["\\b(?:i am|i'm|he is|she is|they are|my [a-z]+ is) (?:happy|sad|tired|thirsty|hungry|fine|okay|afraid|angry|sick|cold|hot)\\b"], 'حال خودت یا یک نفر دیگر را با یکی از احساسات این درس بگو.'),
    phrase(['how are you', 'are you okay', 'how is he', 'how is she', "what's wrong", 'what is wrong'], 'با یک سؤال از حال شخص مقابل باخبر شو.')
  ],
  'a1-13-v2.json': [
    phrase(['eat', 'eats', 'drink', 'drinks', 'cook', 'cooks'], 'یکی از کارهای غذاخوردن، نوشیدن یا پختن را در جمله بیاور.'),
    phrase(['want', 'wants', 'like', 'likes'], 'در مورد علاقه یا خواستهٔ غذایی صحبت کن.'),
    phrase(["don't", "doesn't", 'do not', 'does not', 'do you', 'does she', 'does he'], 'یک پرسش یا جملهٔ منفی دربارهٔ غذا بساز.')
  ],
  'a1-14-v2.json': [
    phrase(['breakfast', 'lunch', 'dinner'], 'حداقل یک وعدهٔ غذایی را به کار ببر.'),
    phrase(['eat', 'eats', 'have', 'has'], 'بگو چه کسی چه چیزی می‌خورد یا دارد.'),
    phrase(['please', 'can you'], 'یک درخواست مؤدبانه در موقعیت غذاخوردن بنویس.'),
    phrase(['with', 'without', 'and'], 'دو غذا یا نوشیدنی را همراه هم یا بدون هم توصیف کن.')
  ]
};

for (const [file, required] of Object.entries(revisions)) {
  const path = prefix + file;
  const lesson = JSON.parse(readFileSync(path, 'utf8'));
  const activity = lesson.sections.flatMap(s => s.activities).find(a => a.type === 'free-write');
  if (!activity?.assessment?.productionProof || activity.assessment.revision < 2) {
    throw new Error(`Not the expected new versioned lesson: ${file}`);
  }
  if (activity.assessment.required[0]?.feedback === required[0]?.feedback) continue;
  activity.assessment.required = required;
  activity.assessment.revision++;
  // Only lesson-specific, guided modules insist on exact fixed expressions.
  if (lesson.learningAudit) {
    lesson.learningAudit.requireIndependentProduction = false;
    lesson.learningAudit.specificIndependentExpressions = [];
  }
  writeFileSync(path, JSON.stringify(lesson, null, 2) + '\n');
}
console.log('Independent checks refined for', Object.keys(revisions).length, 'versioned lessons.');
