/**
 * Owner-authorized A1.2 amendment (2026-10-27). Generates only A1-15..24.
 * Do not change A1.3 or any existing published A1-1..14 lesson body.
 * Run once from the repository root, against the 2026-10-26 owner revision.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { gitBlobSha } from './curriculum-contract.mjs';

const read = path => JSON.parse(readFileSync(path, 'utf8'));
const put = (path, content) => writeFileSync(path, typeof content === 'string' ? content : JSON.stringify(content, null, 2) + '\n');
const revision = '2026-10-27-owner-a1-stage2-practical-sequence';
const root = 'content/language-pairs/fa-en/';
const manifest = read('content/curriculum/universal-path.v1.json');
const catalog = read(root + 'curriculum.a1.json');
const lock = read('content/curriculum/roadmap.lock.json');
const legacy = read('content/curriculum/legacy-alignment.json');
if (manifest.revision !== '2026-10-26-owner-home-school-feelings-realworld' || lock.approvedRevision !== manifest.revision)
  throw Error('Unexpected starting roadmap revision; review amendment before running again.');

const specification = [
  {
    n:15, title:'مقایسهٔ سادهٔ چیزها', axis:'ساختار/مفهوم‌محور', icon:'layers', feature:'انتخاب با دلیل و مقایسهٔ واقعی',
    goal:'بین دو خوراک، وسیله یا لباس تفاوت اندازه، مقدار یا قیمت را بگو و انتخابت را با یک دلیل ساده توضیح بده.',
    outcome:'دو چیز آشنا را از نظر بزرگی، کوچکی، گرانی، ارزانی یا مقدار مقایسه می‌کند؛ با صفت و عدد واقعی انتخاب ساده‌ای را توضیح می‌دهد و نظر کوتاه خود را بیان می‌کند.',
    prerequisite:'A1-6، A1-8، A1-13، A1-14', concept:'تفاوت و انتخاب در موقعیت واقعی', boundary:'مقایسهٔ پرکاربرد با than و more/less؛ شرح نظام کامل صفات تفضیلی و برترین‌ها به A2 موکول شود.', archetypes:['K8','K1'],
    scene:'دو فروشگاه و دو خوراک', mission:'در یک فروشگاه فرضی، دو کالا با دو قیمت یا اندازه را مقایسه کن، یکی را انتخاب کن و دلیل بیاور.', cue:'وقتی در فروشگاه میان دو چیز انتخاب می‌کنی', reflection:'دو چیز واقعی را کنار هم بگذار؛ در ذهنت بگو کدام بزرگ‌تر یا ارزان‌تر است و چرا.',
    words:[['bigger','بزرگ‌تر','This bag is bigger than that bag.'],['smaller','کوچک‌تر','This cup is smaller than that cup.'],['cheaper','ارزان‌تر','The apple is cheaper than the sandwich.'],['than','از (در مقایسه)','This book is bigger than that one.'],['faster','سریع‌تر','The bus is faster than walking.'],['slower','کندتر','This bus is slower than that one.'],['less','کمتر','This meal has less sugar.'],['compare','مقایسه کردن','Compare the two bags.']],
    phrases:[['bigger than','بزرگ‌تر از'],['cheaper than','ارزان‌تر از'],['I think','فکر می‌کنم'],['Which one','کدام‌یک']],
    composer:{sets:{first:[['This bag','این کیف'],['This book','این کتاب'],['This cup','این فنجان']], second:[['that bag','آن کیف'],['that book','آن کتاب'],['that cup','آن فنجان']],feature:[['bigger than','بزرگ‌تر از'],['smaller than','کوچک‌تر از'],['cheaper than','ارزان‌تر از']]},patterns:[['compare','مقایسه کن',[['slot','first'],['fixed',' is '],['slot','feature'],['fixed',' '],['slot','second'],['fixed','.']]],['opinion','نظر بده',[['fixed','I think '],['slot','first'],['fixed',' is '],['slot','feature'],['fixed',' '],['slot','second'],['fixed','.']]]]},
    pairs:[['Which bag is bigger?','کدام کیف بزرگ‌تر است؟',[['آبی','The blue bag is bigger.'],['قرمز','The red bag is bigger.'],['هم‌اندازه','They are the same size.']]],['Which meal is cheaper?','کدام غذا ارزان‌تر است؟',[['سوپ','The soup is cheaper than the pizza.'],['پیتزا','The pizza is cheaper today.'],['برابر','They have the same price.']]],['Do you want more rice?','برنج بیشتری می‌خواهی؟',[['بیشتر','Yes, I want more rice.'],['کمتر','No, I want less rice.'],['کافی','No, this is enough.']]],['Which bus is faster?','کدام اتوبوس سریع‌تر است؟',[['اولی','The first bus is faster.'],['دومی','The second bus is faster.'],['کند','This bus is slower.']]]],
    tasks:[['بگو این کیف از آن کیف بزرگ‌تر است.','This bag is bigger than that bag.'],['بگو سوپ از پیتزا ارزان‌تر است.','The soup is cheaper than the pizza.'],['بگو من برنج کمتری می‌خواهم.','I want less rice.'],['بپرس کدام‌یک کوچک‌تر است.','Which one is smaller?']],
    quiz:[['با قیمت‌های ۴ و ۸ دلار، جملهٔ درست کدام است؟',['The four-dollar meal is cheaper.','The eight-dollar meal is cheaper.','Both meals cost ten dollars.'],0],['«این کیف کوچک‌تر است» کدام است؟',['This bag is bigger.','This bag is smaller.','This bag is faster.'],1],['جای درست than در جمله؟',['This is cheaper than that.','This is than cheaper that.','This than is cheaper that.'],0]],
    dialogue:[['Sara','Which bag do you want?','کدام کیف را می‌خواهی؟'],['Ali','The blue bag is bigger.','کیف آبی بزرگ‌تر است.'],['Sara','But the red bag is cheaper.','اما کیف قرمز ارزان‌تر است.'],['Ali','I think the red bag is better for me.','فکر می‌کنم کیف قرمز برای من بهتر است.'],['Sara','Do you want the small one?','کوچک را می‌خواهی؟'],['Ali','Yes. The small one is enough.','بله. کیف کوچک کافی است.']],
    independentRequired:['\\b(?:bigger|smaller|cheaper|faster|slower)\\s+than\\b','\\b(?:i think|i want|i like)\\b']
  },
  {
    n:16,title:'پوشاک و آنچه می‌پوشیم',axis:'موضوع/مأموریت‌محور',icon:'person',feature:'توصیف پوشش با تغییر رنگ و فاعل',
    goal:'لباس‌های لازم را نام ببر؛ بگو خودت و دیگران چه لباسی پوشیده‌اند و آن لباس چه رنگ یا اندازه‌ای دارد.',
    outcome:'لباس‌های معمول را نام می‌برد و با رنگ و اندازهٔ آموخته‌شده توصیف می‌کند؛ دربارهٔ لباس خودش، او و دیگران با wear و شکل مناسب آن جمله و پرسش کوتاه می‌سازد.',
    prerequisite:'A1-2، A1-6، A1-7، A1-15',concept:'نام لباس، پوشیدن و توصیف قابل تغییر',boundary:'لباس‌ها و پوشیدن در موقعیت روزمره؛ سایزبندی خرید و قیمت در A1-20 تمرین می‌شود.',archetypes:['K2','K1'],
    scene:'کمد لباس و دو شخصیت',mission:'برای دو نفر خیالی لباس انتخاب کن؛ بگو هرکدام چه پوشیده، رنگش چیست و کدام لباس را برای خودت می‌خواهی.',cue:'وقتی برای بیرون‌رفتن لباس انتخاب می‌کنی',reflection:'دو لباس خودت را بدون نگاه به متن نام ببر و رنگ و اندازه‌شان را توصیف کن.',
    words:[['shirt','پیراهن','I wear a blue shirt.'],['jacket','کاپشن / کت','She wears a warm jacket.'],['shoes','کفش‌ها','My shoes are black.'],['pants','شلوار','He wears black pants.'],['dress','پیراهن زنانه','She wears a green dress.'],['wear','پوشیدن','I wear my jacket today.'],['socks','جوراب‌ها','These socks are white.'],['hat','کلاه','This is a red hat.'],['coat','پالتو','I wear a coat when it is cold.']],
    phrases:[['a blue shirt','پیراهن آبی'],['black shoes','کفش مشکی'],['is wearing','پوشیده است'],['What are you wearing?','چه پوشیده‌ای؟']],
    composer:{sets:{person:[['I am','من'],['She is','او (مونث)'],['He is','او (مذکر)'],['We are','ما']],clothing:[['wearing a blue shirt','پیراهن آبی پوشیده'],['wearing black shoes','کفش مشکی پوشیده'],['wearing a warm jacket','کاپشن گرم پوشیده'],['wearing a green dress','پیراهن سبز پوشیده']]},patterns:[['wearing','چه پوشیده؟',[['slot','person'],['fixed',' '],['slot','clothing'],['fixed','.']]],['question','لباس چه کسی؟',[['fixed','Look! '],['slot','person'],['fixed',' '],['slot','clothing'],['fixed','.']]]]},
    pairs:[['What are you wearing?','چه پوشیده‌ای؟',[['پیراهن آبی','I am wearing a blue shirt.'],['کاپشن','I am wearing a warm jacket.'],['شلوار','I am wearing black pants.']]],['What is she wearing?','او چه پوشیده؟',[['لباس سبز','She is wearing a green dress.'],['کفش مشکی','She is wearing black shoes.'],['کلاه قرمز','She is wearing a red hat.']]],['Whose shoes are these?','این کفش‌ها مال کیست؟',[['من','They are my shoes.'],['خواهر','They are my sister’s shoes.'],['تو','They are your shoes.']]],['Is this jacket big?','این کاپشن بزرگ است؟',[['بله','Yes, it is big.'],['کوچک','No, it is small.'],['گرم','It is a warm jacket.']]]],
    tasks:[['بگو من پیراهن آبی پوشیده‌ام.','I am wearing a blue shirt.'],['بگو او (خانم) پیراهن سبز پوشیده است.','She is wearing a green dress.'],['بگو کفش‌های من مشکی هستند.','My shoes are black.'],['بپرس تو چه پوشیده‌ای.','What are you wearing?']],
    quiz:[['پوشاک مناسب پا کدام است؟',['shoes','jacket','hat'],0],['جملهٔ درست برای او (خانم)؟',['She is wearing a green dress.','She are wearing a green dress.','She am wearing a green dress.'],0],['کدام عبارت دربارهٔ اندازه است؟',['a big coat','black socks','a blue hat'],0]],
    dialogue:[['Nina','What are you wearing today?','امروز چه پوشیده‌ای؟'],['Reza','I am wearing a blue shirt.','پیراهن آبی پوشیده‌ام.'],['Nina','Are your shoes black?','کفش‌هایت مشکی‌اند؟'],['Reza','Yes, and my jacket is green.','بله، و کاپشنم سبز است.'],['Nina','Your jacket looks warm.','کاپشنت گرم به نظر می‌رسد.'],['Reza','It is. It is cold outside.','گرم است. بیرون سرد است.']],independentRequired:['\\b(?:wear|wearing|wears)\\b','\\b(?:shirt|jacket|shoes|pants|dress|socks|hat|coat)\\b']
  },
  {
    n:17,title:'اعضای بدن و جای آن‌ها',axis:'موضوع/مأموریت‌محور',icon:'person',feature:'نشان‌دادن، نام‌بردن و توصیف بدن',
    goal:'نام و جای اعضای معمول بدن را بفهم و بگو؛ اعضایی را که از درس ظاهر می‌شناسی در جمله‌های تازه دوباره به کار ببر.',
    outcome:'اعضای اصلی بدن را نام می‌برد و روی تصویر یا شخص خیالی مشخص می‌کند؛ جای سادهٔ عضو را شرح می‌دهد و میان مفرد و جمع رایج مانند foot/feet تمایز می‌گذارد.',
    prerequisite:'A1-2، A1-5، A1-7، A1-16',concept:'عضو بدن و جای آن',boundary:'فقط بدن و کاربرد روزمره؛ بیماری و درد در A1-18 وارد می‌شود.',archetypes:['K2','K3'],
    scene:'بدن از سر تا پا',mission:'در تصویر یک آدم فرضی، شش عضو بدن را پیدا کن؛ سه جمله دربارهٔ جای اعضا و یک سؤال دربارهٔ دست یا پا بساز.',cue:'وقتی دست و پا و صورتت را در آینه می‌بینی',reflection:'با نام‌بردن بخش‌های بدنت به انگلیسی، بالا و پایین بدن را توصیف کن.',
    words:[['head','سر','My head is above my shoulders.'],['leg','پا (از ران تا مچ)','I have two legs.'],['foot','پا (مچ به پایین)','This is my left foot.'],['feet','پاها (جمع foot)','My feet are under my legs.'],['stomach','شکم','My stomach is below my chest.'],['back','پشت','This is my back.'],['neck','گردن','My neck is under my head.'],['knee','زانو','My knee is on my leg.'],['shoulder','شانه','My shoulder is next to my neck.']],
    phrases:[['two feet','دو پا'],['left hand','دست چپ'],['right leg','پای راست'],['above the knee','بالای زانو']],
    composer:{sets:{owner:[['My','مال من'],['Your','مال تو'],['His','مال او (مذکر)'],['Her','مال او (مونث)']],part:[['head','سر'],['neck','گردن'],['shoulder','شانه'],['knee','زانو']]},patterns:[['identify','نشان بده',[['fixed','This is '],['slot','owner'],['fixed',' '],['slot','part'],['fixed','.']]],['question','بپرس',[['fixed','Where is '],['slot','owner'],['fixed',' '],['slot','part'],['fixed','?']]]]},
    pairs:[['Where is your neck?','گردنت کجاست؟',[['زیر سر','My neck is under my head.'],['بالای شانه','My neck is above my shoulders.'],['همین‌جا','Here is my neck.']]],['How many legs do you have?','چند پا داری؟',[['دو','I have two legs.'],['یک (خیالی)','This picture has one leg.'],['پای من','These are my legs.']]],['What is below your knee?','زیر زانو چیست؟',[['پا','My foot is below my knee.'],['دو پا','My feet are below my knees.'],['مچ','My ankle is below my knee.']]],['Where is your back?','پشتت کجاست؟',[['پشت بدن','My back is behind my stomach.'],['اینجاست','Here is my back.'],['درد نیست','This is my back.']]]],
    tasks:[['بگو من دو پا دارم.','I have two legs.'],['بگو گردنم زیر سرم است.','My neck is under my head.'],['بگو زانوی من روی پایم است.','My knee is on my leg.'],['بپرس شانهٔ تو کجاست.','Where is your shoulder?']],
    quiz:[['جمع foot چیست؟',['feet','foots','footies'],0],['کدام عضو بالای گردن است؟',['head','foot','knee'],0],['درست کدام است؟',['I have two legs.','I has two leg.','I have two leg.'],0]],
    dialogue:[['Teacher','Point to your head.','به سرت اشاره کن.'],['Student','This is my head.','این سر من است.'],['Teacher','Where is your neck?','گردنت کجاست؟'],['Student','It is under my head.','زیر سرم است.'],['Teacher','How many feet do you have?','چند پا داری؟'],['Student','I have two feet.','دو پا دارم.']],independentRequired:['\\b(?:head|neck|shoulder|knee|foot|feet|leg|stomach|back)\\b','\\b(?:is|are|have)\\b']
  },
  {
    n:18,title:'بیماری، درد و درخواست کمک',axis:'تلفیقی',icon:'heart',feature:'تشخیص موقعیت و درخواست روشن کمک',
    goal:'درد و چند علامت ساده را بگو؛ وقتی کمک، استراحت یا دارو لازم داری با جمله‌ای کوتاه و واضح درخواست کن.',
    outcome:'درد یا علامت رایج مانند تب، سرفه یا سردرد را با جملهٔ کوتاه توضیح می‌دهد؛ می‌تواند درخواست کمک یا دارو و یک سؤال روشن دربارهٔ حال دیگری مطرح کند.',
    prerequisite:'A1-12، A1-17',concept:'بیان مشکل جسمی و کمک‌خواستن',boundary:'مراجعهٔ مفصل به پزشک، بیمارستان، تشخیص و دوز دارو جزو این درس نیست؛ فقط ارتباط اولیه در موقعیت روزمره.',archetypes:['K5','K4'],
    scene:'دوست بیمار و درخواست کمک',mission:'سه موقعیت خیالی را بررسی کن: سردرد، سرفه و سرگیجه. برای یکی حالت را بگو، کمک بخواه و به سؤال دوستت پاسخ بده؛ توصیهٔ پزشکی نده.',cue:'وقتی حال خودت یا کسی خوب نیست',reflection:'یک جمله برای گفتن درد و یک جمله برای کمک‌خواستن را از حفظ به یاد بیاور.',
    words:[['fever','تب','I have a fever.'],['cough','سرفه','She has a cough.'],['headache','سردرد','I have a headache.'],['pain','درد','I have pain in my leg.'],['medicine','دارو','I need medicine.'],['help','کمک','Can you help me?'],['hurts','درد می‌کند','My stomach hurts.'],['dizzy','سرگیجه‌دار','I feel dizzy.'],['pharmacy','داروخانه','Where is the pharmacy?']],
    phrases:[['I have a headache','سردرد دارم'],['My stomach hurts','شکمم درد می‌کند'],['Can you help me?','می‌توانی کمکم کنی؟'],['I need medicine','دارو لازم دارم']],
    composer:{sets:{person:[['I have','من دارم'],['She has','او (مونث) دارد'],['He has','او (مذکر) دارد']],symptom:[['a headache','سردرد'],['a fever','تب'],['a cough','سرفه']]},patterns:[['state','علامت را بگو',[['slot','person'],['fixed',' '],['slot','symptom'],['fixed','.']]],['follow','کمک بخواه',[['slot','person'],['fixed',' '],['slot','symptom'],['fixed','. I need help.']]]]},
    pairs:[['What is wrong?','مشکلت چیست؟',[['سردرد','I have a headache.'],['شکم','My stomach hurts.'],['سرگیجه','I feel dizzy.']]],['Can I help you?','می‌توانم کمکت کنم؟',[['بله','Yes, please help me.'],['آب','Yes, I need some water.'],['استراحت','Thank you. I need rest.']]],['Does she have a fever?','او تب دارد؟',[['بله','Yes, she has a fever.'],['سرفه','No, she has a cough.'],['نمی‌دانم','I do not know.']]],['What do you need?','چه لازم داری؟',[['دارو','I need medicine, please.'],['کمک','I need help.'],['استراحت','I need rest.']]]],
    tasks:[['بگو من سردرد دارم.','I have a headache.'],['بگو شکمم درد می‌کند.','My stomach hurts.'],['بگو او (خانم) تب دارد.','She has a fever.'],['مؤدبانه کمک بخواه.','Can you help me, please?']],
    quiz:[['دوستت می‌گوید I feel dizzy. چه حالتی دارد؟',['سرگیجه','گرسنگی','خوشحالی'],0],['برای کمک‌خواستن کدام جمله روشن است؟',['Can you help me?','You headache?','I your help?'],0],['سؤال دربارهٔ داروخانه کدام است؟',['Where is the pharmacy?','Where is your dinner?','Do you have a pencil?'],0]],
    dialogue:[['Omid','Are you okay?','حالت خوب است؟'],['Mina','No. I have a headache.','نه. سردرد دارم.'],['Omid','Can I help you?','می‌توانم کمکت کنم؟'],['Mina','Yes, please. I need some water.','بله لطفاً. کمی آب می‌خواهم.'],['Omid','Do you need to rest?','لازم است استراحت کنی؟'],['Mina','Yes. Thank you for helping me.','بله. بابت کمکت ممنونم.']],independentRequired:['\\b(?:headache|fever|cough|pain|hurts|dizzy)\\b','\\b(?:need|help|please|can you)\\b']
  },
  {
    n:19,title:'مشاغل ساده و نقش افراد',axis:'موضوع/مأموریت‌محور',icon:'briefcase',feature:'چه کسی چه کاری می‌کند و کجا؟',
    goal:'نام شغل‌های ساده را بگو؛ شغل هر عضو خانواده یا شخصیت خیالی و محل کار یا فعالیتش را مشخص کن.',
    outcome:'شغل‌های رایج مانند پزشک، معلم، دانشجو، راننده و فروشنده را معرفی می‌کند؛ با ضمیر یا اسم شخص می‌گوید چه کسی چه شغلی دارد و به‌طور ساده چه کاری انجام می‌دهد.',
    prerequisite:'A1-2، A1-9، A1-11، A1-18',concept:'نقش و عمل و محل فعالیت',boundary:'مشاغل معمول و فعل‌های پایه؛ سابقهٔ شغلی و معرفی حرفه‌ای پیچیده در این درس نیست.',archetypes:['K2','K4'],
    scene:'چهار فرد، چهار شغل',mission:'برای سه شخصیت خیالی از خانواده یا دوستانت شغل تعیین کن؛ توضیح بده هرکدام چه کار می‌کنند و یکی کجا کار می‌کند.',cue:'وقتی کسی را با شغلش معرفی می‌کنی',reflection:'سه نفر را در ذهن با نقش ساده مثل معلم، راننده یا دانشجو معرفی کن.',
    words:[['doctor','پزشک','My sister is a doctor.'],['driver','راننده','He is a bus driver.'],['cashier','صندوقدار','The cashier works in a shop.'],['nurse','پرستار','She is a nurse.'],['chef','آشپز حرفه‌ای','The chef cooks dinner.'],['farmer','کشاورز','My father is a farmer.'],['worker','کارگر','He is a worker.'],['job','شغل','What is your job?']],
    phrases:[['What is your job?','شغلت چیست؟'],['works in a shop','در مغازه کار می‌کند'],['bus driver','رانندهٔ اتوبوس'],['is a teacher','معلم است']],
    composer:{sets:{subject:[['My sister','خواهرم'],['My brother','برادرم'],['She','او (مونث)'],['He','او (مذکر)'],['My friend','دوستم']],role:[['a doctor','پزشک'],['a driver','راننده'],['a nurse','پرستار'],['a chef','آشپز'],['a teacher','معلم'],['a student','دانشجو']]},patterns:[['job','شغل',[['slot','subject'],['fixed',' is '],['slot','role'],['fixed','.']]],['question','دربارهٔ او بپرس',[['fixed','Is '],['slot','subject'],['fixed',' '],['slot','role'],['fixed','?']]]]},
    pairs:[['What is your sister’s job?','شغل خواهرت چیست؟',[['پزشک','She is a doctor.'],['معلم','She is a teacher.'],['پرستار','She is a nurse.']]],['What does a chef do?','آشپز چه می‌کند؟',[['می‌پزد','A chef cooks food.'],['شام','A chef cooks dinner.'],['آشپزخانه','A chef works in a kitchen.']]],['Where does a cashier work?','صندوقدار کجا کار می‌کند؟',[['فروشگاه','A cashier works in a shop.'],['سوپرمارکت','A cashier works in a supermarket.'],['رستوران','A cashier works in a restaurant.']]],['Is your brother a student?','برادرت دانشجو است؟',[['بله','Yes, he is a student.'],['راننده','No, he is a driver.'],['کشاورز','No, he is a farmer.']]]],
    tasks:[['بگو خواهرم پزشک است.','My sister is a doctor.'],['بگو او (مرد) راننده است.','He is a driver.'],['بگو آن آشپز شام می‌پزد.','The chef cooks dinner.'],['شغل مخاطبت را بپرس.','What is your job?']],
    quiz:[['چه کسی در فروشگاه پول مشتری را دریافت می‌کند؟',['cashier','driver','farmer'],0],['شغل کسی که غذا می‌پزد چیست؟',['chef','doctor','student'],0],['کدام جمله برای او (مذکر) درست است؟',['He is a driver.','He are a driver.','He am a driver.'],0]],
    dialogue:[['Lina','What is your mother’s job?','شغل مادرت چیست؟'],['Nima','She is a teacher.','او معلم است.'],['Lina','What does your brother do?','برادرت چه کار می‌کند؟'],['Nima','He is a driver.','او راننده است.'],['Lina','Is your sister a student?','خواهرت دانشجو است؟'],['Nima','Yes, she studies architecture.','بله. معماری می‌خواند.']],independentRequired:['\\b(?:doctor|driver|nurse|chef|cashier|farmer|teacher|student|worker)\\b','\\b(?:is|work|works|cooks|drives|studies)\\b']
  },
  {
    n:20,title:'خرید در سوپرمارکت و فروشگاه لباس',axis:'تلفیقی',icon:'bag',feature:'انتخاب کالا، اندازه و تعداد',
    goal:'در یک فروشگاه مواد غذایی یا پوشاک، کالا بخواه، تعداد و اندازه را مشخص کن و قیمتش را بپرس؛ خرید را مؤدبانه تمام کن.',
    outcome:'در سوپرمارکت و لباس‌فروشی کالای مشخص می‌خواهد، قیمت و اندازه را می‌پرسد، انتخاب می‌کند و از فروشنده تشکر می‌کند؛ از واژگان غذا و پوشاک استفادهٔ دوباره می‌کند.',
    prerequisite:'A1-8، A1-13، A1-15، A1-16، A1-19',concept:'انتخاب و خرید عملی',boundary:'پرداخت، رسید و تسویهٔ حساب در A1-21؛ پس‌دادن کالا و شکایت خارج از A1 است.',archetypes:['K5','K4'],
    scene:'دو مغازه و سبد خرید',mission:'در یک سوپرمارکت خیالی دو خوراکی و در لباس‌فروشی یک لباس بخواه، اندازه یا تعداد را مشخص کن و قیمت هرکدام را سؤال کن.',cue:'وقتی در سوپرمارکت یا لباس‌فروشی چیزی انتخاب می‌کنی',reflection:'لیست کوتاه خرید امروزت را با تعداد و اندازه به انگلیسی در ذهن بساز.',
    words:[['buy','خریدن','I want to buy two apples.'],['shop','مغازه / خریدکردن','This shop has blue shirts.'],['supermarket','سوپرمارکت','I buy milk at the supermarket.'],['market','بازار','The market is near the park.'],['fruit','میوه','I want some fruit.'],['vegetable','سبزی / صیفی','We buy vegetables.'],['try','امتحان کردن','Can I try this jacket?'],['fit','اندازه بودن','Does this shirt fit?'],['medium','سایز متوسط','I need a medium shirt.'],['large','سایز بزرگ','Do you have a large jacket?']],
    phrases:[['How much is this?','قیمت این چقدر است؟'],['Do you have a medium?','سایز متوسط دارید؟'],['I would like','من ... می‌خواهم'],['Can I try this on?','می‌توانم این را امتحان کنم؟']],
    composer:{sets:{item:[['two apples','دو سیب'],['some fruit','کمی میوه'],['a medium shirt','یک پیراهن متوسط'],['a blue jacket','یک کاپشن آبی']],request:[['I would like','می‌خواهم'],['I need','نیاز دارم'],['Do you have','آیا دارید']]},patterns:[['request','کالا بخواه',[['slot','request'],['fixed',' '],['slot','item'],['fixed',', please.']]],['confirm','انتخاب کن',[['fixed','I want to buy '],['slot','item'],['fixed','.']]]]},
    pairs:[['What would you like?','چه می‌خواهید؟',[['دو سیب','I would like two apples, please.'],['شیر','I would like some milk, please.'],['میوه','I would like some fruit, please.']]],['What size do you need?','چه سایزی می‌خواهی؟',[['متوسط','I need a medium shirt.'],['بزرگ','I need a large jacket.'],['کوچک','I need a small shirt.']]],['Can I help you?','می‌توانم کمکتان کنم؟',[['لباس','Yes, can I try this jacket?'],['سبزی','Yes, I want some vegetables.'],['فقط نگاه','No, thank you. I am looking.']]],['How much is this shirt?','قیمت این پیراهن چقدر است؟',[['ده دلار','It is ten dollars.'],['بیست دلار','It is twenty dollars.'],['ارزان‌تر','This shirt is cheaper.']]]],
    tasks:[['دو سیب بخواه.','I would like two apples, please.'],['بگو یک پیراهن سایز متوسط لازم دارم.','I need a medium shirt.'],['برای امتحان‌کردن کاپشن اجازه بگیر.','Can I try this jacket?'],['قیمت این لباس را بپرس.','How much is this shirt?']],
    quiz:[['در فروشگاه لباس، وقتی سایز نمی‌دانی چه می‌پرسی؟',['What size is this?','Where is the rice?','Are you a driver?'],0],['کدام درخواست برای دو سیب درست است؟',['I would like two apples.','I would like two apple.','I would two apples.'],0],['try this on چه معنایی دارد؟',['امتحان‌کردن لباس','پختن غذا','گرفتن رسید'],0]],
    dialogue:[['Seller','Hello. Can I help you?','سلام. کمکی می‌خواهید؟'],['Buyer','Yes. I need a blue shirt.','بله. پیراهن آبی می‌خواهم.'],['Seller','What size do you need?','چه سایزی می‌خواهید؟'],['Buyer','Medium, please. Can I try this on?','متوسط لطفاً. می‌توانم امتحانش کنم؟'],['Seller','Yes. Here you are.','بله، بفرمایید.'],['Buyer','It fits. How much is it?','اندازه است. قیمتش چقدر است؟']],independentRequired:['\\b(?:buy|would like|need|do you have)\\b','\\b(?:how much|size|medium|large|small|try)\\b']
  },
  {
    n:21,title:'پرداخت، صورت‌حساب و رسید',axis:'تلفیقی',icon:'wallet',feature:'شبیه‌سازی حساب‌کردن سفارش',
    goal:'در کافه، رستوران یا فروشگاه صورت‌حساب بخواه، رقم پرداختی را بفهم، روش پرداخت را بگو و رسید دریافت کن.',
    outcome:'صورت‌حساب را درخواست و مبلغ ساده را می‌خواند؛ می‌گوید با پول نقد یا کارت پرداخت می‌کند و رسید و بقیهٔ پول را مؤدبانه می‌خواهد.',
    prerequisite:'A1-8، A1-13، A1-14، A1-20',concept:'تسویه و رسید',boundary:'مبلغ‌های محدود و واقعی؛ تخفیف پیچیده، مالیات، انعام اجباری و شکایت به بعد موکول شود.',archetypes:['K5','K3'],
    scene:'میز کافه، فاکتور و کارت',mission:'بعد از یک سفارش فرضی در کافه، صورت‌حساب بخواه، مبلغ را تکرار کن، روش پرداخت انتخاب کن و رسید بخواه.',cue:'وقتی در کافه یا رستوران حساب می‌کنی',reflection:'آخرین خریدت را تصور کن؛ چطور مبلغ، کارت و رسید را به انگلیسی می‌گویی؟',
    words:[['pay','پرداخت کردن','I can pay by card.'],['cash','پول نقد','I pay in cash.'],['card','کارت','Can I pay by card?'],['bill','صورت‌حساب','The bill is twenty dollars.'],['receipt','رسید','Can I have a receipt?'],['change','باقی‌پول','Here is your change.'],['tip','انعام','The tip is optional.'],['payment','پرداخت','The payment is complete.']],
    phrases:[['Can I have the bill?','می‌شود صورت‌حساب را بدهید؟'],['by card','با کارت'],['in cash','نقدی'],['Can I have a receipt?','رسید می‌خواهم']],
    composer:{sets:{method:[['by card','با کارت'],['in cash','نقدی']],document:[['the bill','صورت‌حساب'],['a receipt','رسید']]},patterns:[['pay','پرداخت کن',[['fixed','Can I pay '],['slot','method'],['fixed','?']]],['ask','مدرک بخواه',[['fixed','Can I have '],['slot','document'],['fixed',', please?']]]]},
    pairs:[['How would you like to pay?','چطور پرداخت می‌کنی؟',[['کارت','I would like to pay by card.'],['نقدی','I will pay in cash.'],['می‌توانم با کارت؟','Can I pay by card?']]],['Would you like a receipt?','رسید می‌خواهی؟',[['بله','Yes, a receipt, please.'],['نه','No, thank you.'],['لطفاً','Can I have a receipt, please?']]],['How much is the bill?','صورت‌حساب چقدر است؟',[['بیست دلار','The bill is twenty dollars.'],['سی دلار','It is thirty dollars.'],['پنج دلار','It is five dollars.']]],['Here is your change.','این هم بقیهٔ پولتان.',[['تشکر','Thank you.'],['رسید','And a receipt, please.'],['کافی','That is enough. Thank you.']]]],
    tasks:[['صورت‌حساب را مؤدبانه بخواه.','Can I have the bill, please?'],['بپرس می‌توانم با کارت پرداخت کنم؟','Can I pay by card?'],['بگو نقدی پرداخت می‌کنم.','I pay in cash.'],['رسید بخواه.','Can I have a receipt, please?']],
    quiz:[['پس از سفارش در کافه چه می‌خواهی؟',['the bill','the bus stop','the jacket'],0],['برای پرداخت نقدی کدام درست است؟',['I pay in cash.','I pay by cash card.','I cash receipt.'],0],['receipt چیست؟',['رسید','پیش‌غذا','باقی‌پول'],0]],
    dialogue:[['Guest','Can I have the bill, please?','می‌شود صورت‌حساب را بدهید؟'],['Waiter','Of course. It is twenty dollars.','البته. بیست دلار است.'],['Guest','Can I pay by card?','می‌توانم با کارت پرداخت کنم؟'],['Waiter','Yes, you can.','بله می‌توانید.'],['Guest','Can I have a receipt?','می‌شود رسید بدهید؟'],['Waiter','Of course. Here you are.','البته. بفرمایید.']],independentRequired:['\\b(?:bill|receipt)\\b','\\b(?:pay|card|cash)\\b']
  },
  {
    n:22,title:'مکان‌های شهر و اطراف ما',axis:'موضوع/مأموریت‌محور',icon:'pin',feature:'شناسایی مکان روی نقشهٔ ساده',
    goal:'مکان‌های اصلی شهر را بشناس و دربارهٔ وجود و جای نزدیک آن‌ها سؤال کن؛ خیابان، پارک، پیاده‌رو و مغازه را از هم تمیز بده.',
    outcome:'خیابان، پیاده‌رو، پارک، مغازه، کافه و مکان‌های رایج شهر را نام می‌برد؛ وجود و نزدیکی آن‌ها را در جمله و سؤال به کار می‌برد.',
    prerequisite:'A1-5، A1-9، A1-10، A1-19',concept:'محیط شهر و رابطهٔ مکانی',boundary:'نام و موقعیت مکان‌ها؛ دستور مسیر و آدرس مرحله‌به‌مرحله در A1-23 تدریس می‌شود.',archetypes:['K2','K3'],
    scene:'نقشهٔ یک محلهٔ ساده',mission:'یک محلهٔ خیالی با پارک، کافه، مغازه و پیاده‌رو توصیف کن و دو سؤال دربارهٔ نزدیک‌ترین مکان‌ها بساز.',cue:'وقتی در خیابان اطرافت را نگاه می‌کنی',reflection:'در راه خودت سه مکان را ببین و انگلیسی نام ببر؛ بگو کدام به تو نزدیک است.',
    words:[['park','پارک','The park is near my home.'],['sidewalk','پیاده‌رو','The sidewalk is next to the street.'],['corner','گوشه / نبش','The café is on the corner.'],['cafe','کافه','There is a cafe near the park.'],['bank','بانک','The bank is next to the shop.'],['station','ایستگاه','The station is near the school.'],['city','شهر','This is a big city.'],['place','مکان','This place is near my home.'],['store','فروشگاه','The store is on this street.'],['road','جاده','This road is long.']],
    phrases:[['near here','نزدیک اینجا'],['on the corner','سر نبش'],['across the street','آن سوی خیابان'],['Is there a park?','اینجا پارک هست؟']],
    composer:{sets:{place:[['a park','پارک'],['a cafe','کافه'],['a bank','بانک'],['a store','فروشگاه']],reference:[['my home','خانه‌ام'],['the school','مدرسه'],['the market','بازار']]},patterns:[['location','جای مکان',[['fixed','There is '],['slot','place'],['fixed',' near '],['slot','reference'],['fixed','.']]],['exist','سؤال مکان',[['fixed','Is there '],['slot','place'],['fixed',' near '],['slot','reference'],['fixed','?']]]]},
    pairs:[['Is there a park near here?','نزدیک اینجا پارک هست؟',[['بله','Yes, there is a park.'],['نزدیک خانه','Yes, near my home.'],['نه','No, there is no park here.']]],['Where is the cafe?','کافه کجاست؟',[['نبش','The cafe is on the corner.'],['پارک','It is next to the park.'],['خیابان','It is across the street.']]],['Where is the sidewalk?','پیاده‌رو کجاست؟',[['کنار خیابان','The sidewalk is next to the street.'],['اینجا','It is here.'],['کنار پارک','It is near the park.']]],['Is there a bank in this city?','در این شهر بانک هست؟',[['بله','Yes, there is a bank.'],['نبش','Yes, on the corner.'],['نه','No, not near here.']]]],
    tasks:[['بگو نزدیک خانه‌ام یک پارک است.','There is a park near my home.'],['بگو پیاده‌رو کنار خیابان است.','The sidewalk is next to the street.'],['بگو کافه سر نبش است.','The cafe is on the corner.'],['بپرس نزدیک اینجا بانک هست؟','Is there a bank near here?']],
    quiz:[['sidewalk کدام است؟',['پیاده‌رو','غذا','کفش'],0],['کافه سر نبش است؛ کدام جمله؟',['The cafe is on the corner.','The cafe is under the table.','The cafe is in my bag.'],0],['برای پرسیدن وجود پارک کدام؟',['Is there a park near here?','Is park a doctor?','Does park a bag?'],0]],
    dialogue:[['Visitor','Is there a cafe near here?','نزدیک اینجا کافه هست؟'],['Local','Yes. There is a cafe near the park.','بله. نزدیک پارک کافه‌ای هست.'],['Visitor','Where is the park?','پارک کجاست؟'],['Local','It is across the street.','آن‌طرف خیابان است.'],['Visitor','And the bank?','و بانک؟'],['Local','The bank is on the corner.','بانک سر نبش است.']],independentRequired:['\\b(?:park|sidewalk|cafe|bank|store|station|city)\\b','\\b(?:near|next to|on the corner|across)\\b']
  },
  {
    n:23,title:'آدرس و راهنمایی مسیر کوتاه',axis:'تلفیقی',icon:'map',feature:'اجرای چند دستور روی نقشه',
    goal:'مقصد کوتاه را بپرس؛ دستورهای ساده را به ترتیب بده و بین «اینجا کجاست» و «چطور بروم» تفاوت بگذار.',
    outcome:'مسیر کوتاه و قابل‌اجرا را می‌پرسد و با go straight، turn left/right و نشان‌دادن مقصد روی نقشه راهنمایی می‌کند؛ برای یک مقصد تازه حداقل دو مرحله را به ترتیب می‌گوید.',
    prerequisite:'A1-5، A1-22',concept:'دستور حرکت و توالی مکانی',boundary:'فقط مسیرهای کوتاه در محله؛ زمان سفر و انتخاب وسیله در A1-24، جهت‌یابی پیچیده به سطح بعد.',archetypes:['K6','K3'],
    scene:'مسیر از پارک تا کتابخانه',mission:'به گردشگری خیالی راه از کافه تا پارک را در دو یا سه دستور کوتاه بده؛ سپس مقصد دیگری را بپرس و یک مسیر متفاوت بساز.',cue:'وقتی کسی از تو مسیر می‌پرسد',reflection:'راه ساده‌ای را که هر روز می‌روی تصور کن و با «مستقیم، چپ، راست» توضیح بده.',
    words:[['left','چپ','Turn left at the bank.'],['right','راست','Turn right at the park.'],['turn','پیچیدن','Turn left here.'],['cross','عبور کردن','Cross the street.'],['opposite','روبرو','The bank is opposite the cafe.'],['block','بلوک / یک خیابان فرعی','Go one block.'],['traffic','ترافیک / آمدوشد','Stop at the traffic light.'],['intersection','تقاطع','Turn right at the intersection.']],
    phrases:[['Go straight','مستقیم برو'],['Turn left','به چپ بپیچ'],['Turn right','به راست بپیچ'],['How do I get to...?','چطور به ... برسم؟']],
    composer:{sets:{movement:[['Go straight','مستقیم برو'],['Turn left','چپ بپیچ'],['Turn right','راست بپیچ'],['Cross the street','از خیابان رد شو']],landmark:[['at the park','در پارک'],['at the bank','نزدیک بانک'],['at the intersection','در تقاطع']]},patterns:[['step','دستور بده',[['slot','movement'],['fixed',' '],['slot','landmark'],['fixed','.']]],['two','مرحلهٔ دوم',[['fixed','First, '],['slot','movement'],['fixed','. Then stop '],['slot','landmark'],['fixed','.']]]]},
    pairs:[['How do I get to the park?','چطور به پارک بروم؟',[['مستقیم','Go straight and turn left.'],['راست','Go straight, then turn right.'],['تقاطع','Turn left at the intersection.']]],['Where do I turn?','کجا بپیچم؟',[['بانک','Turn right at the bank.'],['پارک','Turn left at the park.'],['تقاطع','Turn right at the intersection.']]],['Is the cafe opposite the bank?','کافه روبه‌روی بانک است؟',[['بله','Yes, it is opposite the bank.'],['نه','No, it is next to the bank.'],['خیابان','No, it is across the street.']]],['What do I do at the street?','در خیابان چه کنم؟',[['عبور','Cross the street.'],['مستقیم','Go straight.'],['صبر','Stop at the traffic light.']]]],
    tasks:[['بگو مستقیم برو و به چپ بپیچ.','Go straight and turn left.'],['بگو سر تقاطع به راست بپیچ.','Turn right at the intersection.'],['بگو بانک روبه‌روی کافه است.','The bank is opposite the cafe.'],['بپرس چطور به پارک بروم؟','How do I get to the park?']],
    quiz:[['بعد از Go straight, turn left کدام حرکت است؟',['مستقیم، سپس چپ','چپ، سپس راست','راست، سپس مستقیم'],0],['opposite یعنی؟',['روبه‌رو','زیر','داخل'],0],['برای رفتن به پارک کدام سؤال درست است؟',['How do I get to the park?','What is your park?','Do I park?'],0]],
    dialogue:[['Tourist','Excuse me. How do I get to the park?','ببخشید. چطور به پارک بروم؟'],['Local','Go straight for one block.','یک بلوک مستقیم برو.'],['Tourist','Then what?','بعد چه کنم؟'],['Local','Turn left at the bank.','سر بانک به چپ بپیچ.'],['Tourist','Is the park far?','پارک دور است؟'],['Local','No. It is opposite the cafe.','نه. روبه‌روی کافه است.']],independentRequired:['\\b(?:go straight|turn left|turn right|cross)\\b','\\b(?:then|first|at the|opposite|next to)\\b']
  },
  {
    n:24,title:'حمل‌ونقل و رسیدن به مقصد',axis:'تلفیقی',icon:'bus',feature:'انتخاب وسیله و گفت‌وگوی ایستگاه',
    goal:'وسیلهٔ رسیدن به مقصد را انتخاب کن؛ ایستگاه و بلیت را بپرس و یک گفت‌وگوی کوتاه در تاکسی یا اتوبوس انجام بده.',
    outcome:'می‌گوید با اتوبوس، تاکسی یا قطار به مقصد آشنا می‌رود؛ ایستگاه، بلیت و مقصد را می‌پرسد و در مکالمهٔ کوتاه رفت‌وآمد پاسخ می‌دهد.',
    prerequisite:'A1-8، A1-20، A1-22، A1-23',concept:'وسیله، مسیر و مقصد',boundary:'سفر کوتاه و بلیت پایه؛ ساعت‌بندی پیچیده، برنامهٔ روزانه و عادت‌های تکراری فعلاً وارد بخش دوم نمی‌شوند.',archetypes:['K5','K4'],
    scene:'ایستگاه، تاکسی و اتوبوس',mission:'برای رفتن از خانهٔ خیالی به مدرسه یا پارک وسیلهٔ مناسب انتخاب کن؛ از کسی جای ایستگاه و قیمت بلیت را بپرس، بعد مقصد را تأیید کن.',cue:'وقتی منتظر اتوبوس یا تاکسی هستی',reflection:'در مسیر امروزت وسیلهٔ رفت‌وآمدت را به انگلیسی نام ببر و یک سؤال دربارهٔ مقصد بساز.',
    words:[['taxi','تاکسی','I go home by taxi.'],['train','قطار','This train goes to the city.'],['ticket','بلیت','I need one ticket.'],['stop','ایستگاه / توقف','Where is the bus stop?'],['ride','سوارشدن / سفر کوتاه','I ride the bus.'],['travel','سفر کردن','We travel by train.'],['subway','مترو','The subway station is near here.'],['destination','مقصد','The park is my destination.'],['platform','سکو','The train is at platform two.']],
    phrases:[['by bus','با اتوبوس'],['by taxi','با تاکسی'],['a ticket to','بلیت به مقصد'],['Where is the bus stop?','ایستگاه اتوبوس کجاست؟']],
    composer:{sets:{destination:[['the park','پارک'],['the school','مدرسه'],['the market','بازار'],['my home','خانهٔ من']],vehicle:[['by bus','با اتوبوس'],['by taxi','با تاکسی'],['by train','با قطار']]},patterns:[['travel','وسیله و مقصد',[['fixed','I go to '],['slot','destination'],['fixed',' '],['slot','vehicle'],['fixed','.']]],['question','دربارهٔ رسیدن بپرس',[['fixed','Do you go to '],['slot','destination'],['fixed',' '],['slot','vehicle'],['fixed','?']]]]},
    pairs:[['How do you go to school?','چطور به مدرسه می‌روی؟',[['اتوبوس','I go by bus.'],['تاکسی','I go by taxi.'],['پیاده','I walk to school.']]],['Where is the bus stop?','ایستگاه اتوبوس کجاست؟',[['نزدیک پارک','The bus stop is near the park.'],['نبش','It is on the corner.'],['روبه‌رو','It is opposite the bank.']]],['How many tickets do you need?','چند بلیت می‌خواهی؟',[['یک','One ticket, please.'],['دو','Two tickets, please.'],['رفت','I need a ticket to the city.']]],['Does this train go to the city?','این قطار به شهر می‌رود؟',[['بله','Yes, it goes to the city.'],['نه','No, take the other train.'],['سکو','The train is at platform two.']]]],
    tasks:[['بگو با تاکسی به مدرسه می‌روم.','I go to school by taxi.'],['ایستگاه اتوبوس را بپرس.','Where is the bus stop?'],['یک بلیت بخواه.','One ticket, please.'],['بپرس این قطار به شهر می‌رود؟','Does this train go to the city?']],
    quiz:[['برای رفتن با وسیلهٔ نقلیه کدام عبارت رایج است؟',['by bus','on bus by','with the bus of'],0],['ticket یعنی؟',['بلیت','رسید خرید','کت'],0],['برای پیدا کردن ایستگاه چه می‌پرسی؟',['Where is the bus stop?','Where is my jacket?','Where is breakfast?'],0]],
    dialogue:[['Passenger','Excuse me. Where is the bus stop?','ببخشید. ایستگاه اتوبوس کجاست؟'],['Local','It is near the park.','نزدیک پارک است.'],['Passenger','Does this bus go to the school?','این اتوبوس به مدرسه می‌رود؟'],['Driver','Yes. One ticket?','بله. یک بلیت؟'],['Passenger','Yes, one ticket, please.','بله، یک بلیت لطفاً.'],['Driver','Here you are.','بفرمایید.']],independentRequired:['\\b(?:bus|taxi|train|subway|ticket|stop)\\b','\\b(?:go|take|need|ride|travel)\\b']
  }
];

const canonicalById = new Map(manifest.lessons.map(row=>[row.id,row]));
const oldStage3 = JSON.stringify(manifest.lessons.filter(row=>row.level==='A1'&&row.order>=25));
const oldStage3Catalog = JSON.stringify(catalog.stages[2]);
const oldA1_13_14 = JSON.stringify(catalog.stages[1].chapters[0].lessons.slice(0,2));
const oldStage2Rows = manifest.lessons.filter(row=>row.level==='A1'&&row.order>=15&&row.order<=24).map(row=>structuredClone(row));
const prereqById = new Map();

for(const spec of specification){
  const id = 'A1-'+spec.n;
  const original = canonicalById.get(id);
  const row = {
    ...original, title:spec.title, axis:spec.axis, communicativeOutcome:spec.outcome,
    prerequisiteBridge:spec.prerequisite, prerequisiteIds:[...new Set(spec.prerequisite.match(/\bA1-\d+\b/g)||[])],
    globalConcept:spec.concept, scopeBoundary:spec.boundary, archetypes:spec.archetypes
  };
  Object.assign(original,row);
  prereqById.set(id,row);
}
if(JSON.stringify(manifest.lessons.filter(row=>row.level==='A1'&&row.order>=25))!==oldStage3)
  throw Error('Stage 3 changed unexpectedly.');
const sourcePath='docs/curriculum/01-universal-learning-path.md';
const oldSource=readFileSync(sourcePath,'utf8');
const newSource=oldSource.replace(/^\|\s*A1-(1[5-9]|2[0-4])\s+—.*$/gm, match=>{
  const id=match.match(/A1-(\d+)/)?.[0];
  const row=prereqById.get(id);
  if(!row)throw Error('Unknown source row: '+match);
  return `| ${row.id} — ${row.title} | ${row.axis} | ${row.communicativeOutcome} | ${row.prerequisiteBridge} | ${row.globalConcept} | ${row.scopeBoundary} | ${row.archetypes.join(' + ')} |`;
});
if(newSource===oldSource)throw Error('Source update did not find its ten lesson rows');
manifest.revision=revision;
manifest.sourceGitBlobSha=gitBlobSha(newSource);

const entries=catalog.stages[1].chapters.flatMap(ch=>ch.lessons);
const chapters=catalog.stages[1].chapters;
catalog.stages[1].title='بخش دوم: از خوراک تا رفت‌وآمد';
catalog.stages[1].description='۱۲ درس ۱۳ تا ۲۴؛ خوراک، مقایسه، پوشاک، بدن، بیماری، مشاغل، خرید، پرداخت، شهر، آدرس و حمل‌ونقل.';
chapters[0].title='خوراک، مقایسه و پوشاک';
chapters[0].description='از غذا و وعده‌ها به انتخاب میان چیزها و توصیف پوشش.';
chapters[1].title='بدن، سلامت، شغل و خرید';
chapters[1].description='بدن را می‌شناسی، کمک می‌خواهی، شغل‌ها را معرفی می‌کنی و خرید می‌کنی.';
chapters[2].title='پرداخت، شهر، آدرس و حمل‌ونقل';
chapters[2].description='از پرداخت در کافه تا شناخت شهر و رسیدن به مقصد.';
for(const spec of specification){
  const card=entries.find(x=>x.id==='A1-'+spec.n);
  if(!card || card.file)throw Error('Expected unimplemented card '+spec.n);
  Object.assign(card,{title:spec.title,subtitle:spec.goal,icon:spec.icon,feature:spec.feature,file:`lessons/a1-${spec.n}-v1.json`,status:'sample'});
}
if(JSON.stringify(catalog.stages[2])!==oldStage3Catalog || JSON.stringify(catalog.stages[1].chapters[0].lessons.slice(0,2))!==oldA1_13_14)
  throw Error('Attempt to touch stage 3 or existing lessons 13/14');

function wordsToItems(words){return words.map(([en,fa,example])=>({en,fa,examples:[example]}));}
function segment([kind,value]){return kind==='fixed'?{fixed:value}:{slot:value,form:'en'};}
function slotOption([text,translation],index){return {id:'option-'+index,label:text,translation,forms:{en:text}};}
function composerFor(spec){
  const sets=Object.fromEntries(Object.entries(spec.composer.sets).map(([key,options])=>[key,options.map(slotOption)]));
  return {
    id:`a1-${spec.n}-composer`,type:'sentence-composer',phase:'sentence',title:'جمله را با تغییر معنی بساز',
    description:'روی واژه‌های جمله بزن و فاعل، کالا، مقصد یا ویژگی را تغییر بده. بعد ساختار دیگر را امتحان کن؛ به مفهوم جمله دقت کن.',
    targetLanguage:'en',wordSets:sets,slots:Object.keys(sets).map(key=>({id:key,label:key,wordSet:key,default:'option-0'})),
    defaultPattern:spec.composer.patterns[0][0],patterns:spec.composer.patterns.map(([id,label,parts])=>({id,label,segments:parts.map(segment),translationSegments:[]}))
  };
}
const simpleTask=([fa,en])=>({task:fa,hint:'کلمات کلیدی را پیدا کن؛ نمونهٔ کامل پس از دو تلاش نشان داده می‌شود.',example:en,assessment:{required:[{any:[en],feedback:'جملهٔ انگلیسی با همین معنی بساز؛ به فاعل، فعل و ترتیب توجه کن.'}],success:'این موقعیت را ساختی.'}});
function labelScene(spec){
  const labels=spec.pairs.slice(0,3).map(p=>p[0].replace(/[?.]/g,''));
  const colors=['#dbece5','#e2e8f3','#f1e6d8'];
  const cards=labels.map((label,i)=>`<g transform="translate(${18+i*214},90)"><rect width="202" height="180" rx="18" fill="${colors[i]}" stroke="#9bb7a8"/><text x="101" y="48" fill="#334f4d" font-family="Arial,sans-serif" font-size="16" text-anchor="middle">${String(spec.n).padStart(2,'0')} · ${String(i+1).padStart(2,'0')}</text><text x="101" y="102" fill="#1a4f49" font-family="Arial,sans-serif" font-size="15" font-weight="bold" text-anchor="middle">${label.length>23?label.slice(0,22)+'…':label}</text><path d="M40 137H162" stroke="#78a699" stroke-width="5" stroke-linecap="round"/></g>`).join('');
  const text=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 300" role="img"><rect width="680" height="300" fill="#f9fcf9" rx="22"/><text x="340" y="48" fill="#294f48" font-family="Arial,sans-serif" font-size="20" text-anchor="middle" font-weight="bold">A1 · LESSON ${spec.n}</text>${cards}</svg>\n`;
  return text;
}
function buildLesson(spec){
  const id=`A1-${spec.n}`,row=canonicalById.get(id),prefix=`a1-${spec.n}`;
  const compose=composerFor(spec);
  const puzzleSentences=[...spec.tasks.slice(0,3).map(([fa,en],i)=>({id:`sentence-${i+1}`,words:en.split(' ')})),
    ...spec.pairs.slice(0,2).map(([q,qfa,answers],i)=>({id:`sentence-${i+4}`,words:answers[1][1].split(' ')}))];
  const words=wordsToItems(spec.words);
  const expressions=spec.phrases.map(([en,fa])=>({en,fa,kind:'fixed',examples:[...spec.tasks.map(t=>t[1]),...spec.pairs.flatMap(p=>p[2].map(a=>a[1]))].filter(line=>line.toLowerCase().includes(en.toLowerCase())).slice(0,3)}));
  const exchange=spec.pairs.map(([question,questionFa,answers])=>({question,questionFa,variants:answers.map(([label,en])=>({label,en,fa:label}))}));
  const pictureTasks=spec.pairs.slice(0,3).map(([question,fa,answers])=>simpleTask([`به کارت تصویر مربوط به «${fa}» نگاه کن؛ یکی از پاسخ‌های درست را بنویس.`,answers[0][1]]));
  const guidedTurns=spec.pairs.map(([question,fa,answers],i)=>({speaker:i%2?'دوستت':'مخاطب خیالی',incoming:question,...simpleTask([`برای «${fa}» جواب مناسب بده.`,answers[2][1]])}));
  const independent={
    id:`${prefix}-independent`,type:'free-write',phase:'independent',title:'مأموریت واقعی و ساختن بدون الگو',
    prompt:spec.mission,placeholder:'دو یا سه جملهٔ انگلیسی خودت را اینجا بنویس؛ اطلاعات فرضی کافی است.',
    hint:'از جمله‌های درس الهام بگیر ولی فاعل، شیء، مکان یا تصمیم را خودت عوض کن.',kind:'free-text',minWords:14,
    assessment:{revision:1,required:spec.independentRequired.map((pattern,i)=>({patterns:[pattern],feedback:i===0?'واژگان اصلی موقعیت را داخل جملهٔ کامل به کار ببر.':'یک کار، سؤال یا دلیل مرتبط هم بنویس.'})),
      productionProof:{minWords:10,minClauses:2},success:'دو جملهٔ مستقل با هدف درس ساختی؛ حالا سرنخ زندگی واقعی را هم امتحان کن.'},
    realWorldMission:{cue:spec.cue,reflection:spec.reflection}
  };
  const foundation=[
    {id:`${prefix}-shadowing`,type:'shadowing',phase:'shadowing',title:'ابتدا نمونهٔ موقعیت را گوش کن',description:'با این چند جمله آشنا شو؛ هنوز لازم نیست همه را بی‌کمک بسازی.',audioSrc:null,rate:.8,pauseMs:500,lines:[spec.tasks[0][1],spec.pairs[0][0],spec.pairs[0][2][0][1],spec.tasks[1][1],spec.tasks[2][1],spec.pairs[1][0]]},
    {id:`${prefix}-vocabulary`,type:'vocabulary',phase:'words',title:'واژگان تازهٔ این مأموریت',deckRevision:1,batchSize:4,items:words},
    {id:`${prefix}-expressions`,type:'expression-study',phase:'phrases',title:'عبارت‌های آماده برای موقعیت واقعی',description:'ترکیب‌ها را در جمله ببین؛ جملهٔ کامل را به‌جای جداکردن تک‌تک واژه‌ها به یاد بیاور.',presentation:'deck',items:expressions},
    compose,
    {id:`${prefix}-variants`,type:'composer-view',phase:'variants',title:'یک جمله با دو هدف ارتباطی',description:'ساختار را عوض کن؛ یک‌بار گزارش بده، یک‌بار سؤال بپرس یا نظر بده.',sourceActivityId:compose.id,patternIds:compose.patterns.map(p=>p.id),examples:spec.tasks.slice(0,3).map(([fa,en])=>({en,fa}))},
    {id:`${prefix}-decision`,type:'quiz-set',phase:'variants',title:'در موقعیت چه واکنشی مناسب است؟',questions:spec.quiz.map(([question,choices,answer])=>({question,choices,answer,feedback:'از معنی و موقعیت استفاده کن؛ فقط شکل واژه را حفظ نکن.'}))},
    {id:`${prefix}-puzzle`,type:'sentence-builder',phase:'puzzle',title:'چند جمله با بانک کلمات مشترک بساز',description:'هر بار جملهٔ متفاوتی پیدا کن؛ واژه‌های مشترک را به‌موقع استفاده کن.',revision:1,goalCount:puzzleSentences.length,reuseBank:true,sentences:puzzleSentences},
    {id:`${prefix}-build`,type:'response-practice',phase:'construction',title:'از فارسی به یک پاسخ دقیق برس',description:'چند جمله و سؤال متفاوت بنویس؛ راهنمایی تنها وقتی لازم بود باز کن.',practiceRevision:1,tasks:spec.tasks.map(simpleTask)}
  ];
  const production=[
    {id:`${prefix}-exchange`,type:'exchange-lab',phase:'correspondence',title:'گفت‌وگو با انتخاب‌های معنی‌دار',description:'چهار موقعیت را ببین. برای هر سؤال سه پاسخ متفاوت ولی درست بررسی کن؛ در پایان پاسخ خودت را مستقل بساز.',pairs:exchange},
    {id:`${prefix}-dialogue`,type:'dialogue',phase:'context',title:`یک گفت‌وگوی واقعی دربارهٔ ${spec.title}`,description:'پاسخ بعدی را قبل از آشکارشدنش حدس بزن؛ سپس جای نقش‌ها را عوض کن.',lines:spec.dialogue.map(([speaker,en,fa])=>({speaker,en,fa}))},
    {id:`${prefix}-picture`,type:'picture-description',phase:'picture',title:'سه موقعیت را از کارت مرور کن',description:'در هر کارت معنای پرسش فرق می‌کند؛ به جای حفظ جمله، پاسخ مناسب را تولید کن.',image:`./assets/scene-a1-${spec.n}-stage2.svg`,imageAlt:spec.scene,caption:spec.scene,practiceRevision:1,tasks:pictureTasks},
    {id:`${prefix}-guided`,type:'guided-dialogue',phase:'guided',title:'این بار خودت در مکالمه پاسخ بده',description:'۴ نوبت با پرسش‌ها و نقش‌های متفاوت. متن نمونه از اول نمایش داده نمی‌شود.',practiceRevision:1,completion:'حالا بدون راهنمایی در موقعیت تازه پاسخ بساز.',turns:guidedTurns},
    independent,
    {id:`${prefix}-shadowing-review`,type:'shadowing-review',phase:'independent',title:'حالا همان جمله‌های آغاز درس را بازبگو',description:'متن شروع را بازشنوی کن و فاصلهٔ یادگیری خودت را بسنج.',sourceActivityId:`${prefix}-shadowing`}
  ];
  return {
    id,revision,status:'draft',title:spec.title,goal:spec.goal,duration:24,feature:spec.feature,archetype:spec.archetypes[0],
    roadmapRef:{id,revision,communicativeOutcome:row.communicativeOutcome},teachingModel:{type:'discovery-production',sections:2},lessonTemplate:'discovery-production-v1',
    orientation:{goal:spec.goal,prerequisites:row.prerequisiteIds,previously:'دانسته‌های بخش اول و درس‌های پیشین را در این موقعیت تازه دوباره به کار می‌بریم.',quickCheck:{title:'مرور آغازین',question:spec.pairs[0][0],example:spec.pairs[0][2][0][1],explanation:'اگر این پاسخ تازه است، در مسیر واژه تا تولید آن را خواهی ساخت.',allowSkip:false}},
    visual:{src:`./assets/scene-a1-${spec.n}-stage2.svg`,alt:spec.scene,caption:spec.scene},
    learningAudit:{focusExpressions:[],specificIndependentExpressions:[],minDownstreamActivities:2,minGuidedActivities:1,requireIndependentProduction:false},
    sections:[{id:'foundation',label:'بخش اول · کشف و تمرین',intro:'واژه → عبارت → جملهٔ زنده → سنجش → ساختن',masteryActivityIds:[`${prefix}-puzzle`,`${prefix}-build`],activities:foundation},
      {id:'production',label:'بخش دوم · کاربرد و تولید',intro:'پرسش‌وپاسخ → گفت‌وگو → توصیف → تولید مستقل',masteryActivityIds:[`${prefix}-guided`,`${prefix}-independent`],activities:production}]
  };
}

// Verify that no word is introduced twice, including the preceding 14 lessons.
const seen=new Map();
for(const card of catalog.stages[0].chapters.flatMap(ch=>ch.lessons).concat(catalog.stages[1].chapters[0].lessons.slice(0,2)).filter(x=>x.file)){
  const lesson=read(root+card.file);
  for(const w of lesson.sections.flatMap(s=>s.activities).find(x=>x.type==='vocabulary').items)
    seen.set(w.en.toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g,''),card.id);
}
for(const spec of specification){
  for(const w of spec.words){
    const key=w[0].toLowerCase();
    if(seen.has(key))throw Error(`Duplicate vocabulary ${key} from ${seen.get(key)} in A1-${spec.n}`);
    seen.set(key,'A1-'+spec.n);
  }
}

for(const spec of specification){
  const lessonPath=`${root}lessons/a1-${spec.n}-v1.json`;
  const scenePath=`apps/learner-web/assets/scene-a1-${spec.n}-stage2.svg`;
  if(existsSync(lessonPath)||existsSync(scenePath))throw Error('Refusing to overwrite '+lessonPath+' or '+scenePath);
}
for(const spec of specification){
  put(`${root}lessons/a1-${spec.n}-v1.json`,buildLesson(spec));
  put(`apps/learner-web/assets/scene-a1-${spec.n}-stage2.svg`,labelScene(spec));
}
put(sourcePath,newSource);
put('content/curriculum/universal-path.v1.json',manifest);
put(root+'curriculum.a1.json',catalog);
lock.approvedRevision=revision;
lock.approvedChanges.push({revision,authorizedBy:'product-owner',affectedIds:specification.map(x=>'A1-'+x.n),
  decisionReference:'Tutivar project conversation, 2026-10-26/27: owner explicitly specified stage-2 order: food, meals, comparison, clothing, body, illness/help, simple jobs, shopping, payment/receipt, city, addresses/directions, transportation; owner explicitly forbade touching stage 3.',
  rationale:'Teach realistic interactions in prerequisite order; split clothing and body, focus illness on simple help rather than hospital visits; move daily routine and habits out of A1.2 while leaving all A1.3 files unchanged.'});
lock.sourceGitBlobSha=gitBlobSha(newSource);
lock.manifestGitBlobSha=gitBlobSha(JSON.stringify(manifest,null,2)+'\n');
put('content/curriculum/roadmap.lock.json',lock);
legacy.stage2PracticalSequence={revision,preserveProgress:true,statusBefore:'planned',statusAfter:'sample',oldRows:oldStage2Rows,
  newFiles:Object.fromEntries(specification.map(x=>['A1-'+x.n,`lessons/a1-${x.n}-v1.json`])),
  displacedGoals:[{oldId:'A1-23',title:'شرح برنامهٔ روزانه',destination:'pending owner-approved placement in stage 3; not amended'},{oldId:'A1-24',title:'بیان عادت و میزان تکرار',destination:'pending owner-approved placement in stage 3; not amended'}],
  knownDeferredDependency:'A1.3 uses old A1-23 as a time-sequencing prerequisite; no stage-3 edits authorized yet.'};
put('content/curriculum/legacy-alignment.json',legacy);
console.log(`Generated ${specification.length} stage-two two-section lessons and ten simple context SVGs; stage three unchanged.`);
