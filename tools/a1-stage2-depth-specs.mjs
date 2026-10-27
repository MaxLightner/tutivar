/* A1.2 owner feedback, 2026-10-27: concrete situations before mechanical choices. */
const side=(id,en,fa,emoji,color)=>({id,en,fa,emoji,color});
const pair=(topic,prompt,a,b,correct,successEn,successFa,tip)=>({topic,prompt,options:[a,b],correct,successEn,successFa,retryFa:tip||'به رنگ، تعداد، قیمت، شکل یا موقعیتِ دو تصویر دقت کن.'});
const item=(id,en,fa,emoji,price,need)=>({id,en,fa,emoji,price,need});
const order=(topic,prompt,products,successEn,successFa,tender)=>({topic,prompt,products,successEn,successFa,tender});
const place=(id,fa,en,emoji,x,y)=>({id,fa,en,emoji,x,y});
const route=(topic,prompt,moves,en,fa,start={x:0,y:0},end={x:4,y:4})=>({topic,prompt,start,end,steps:moves.map(move=>({move})),successEn:en,successFa:fa,retryFa:'از نقشه و مقصد کمک بگیر؛ مسیر تازه را با جهت درست ادامه بده.'});

export const stage2Depth = {
15: {
  core:[['darker','تیره‌تر','This shirt is darker than that one.'],['lighter','روشن‌تر / کم‌رنگ‌تر','This blue is lighter than that blue.'],['prettier','زیباتر','This dress is prettier than that one.'],['tastier','خوشمزه‌تر','This soup is tastier than that soup.'],['brighter','روشن‌تر / پرنورتر','This lamp is brighter than that lamp.'],['bland','بی‌مزه','This soup is bland.']],
  optional:[['tasteless','بی‌مزه / بی‌طعم','The soup is tasteless.'],['colorful','رنگارنگ','This shirt is more colorful.'],['pale','کم‌رنگ / رنگ‌پریده','The pale blue shirt is lighter.']],
  phrases:[['more beautiful than','زیباتر از','This dress is more beautiful than that dress.'],['darker than','پررنگ‌تر از','This blue bag is darker than that bag.'],['lighter than','کم‌رنگ‌تر از','This shirt is lighter than that shirt.'],['sweeter than','شیرین‌تر از','This tea is sweeter than that tea.'],['sour but good','ترش ولی خوب','The lemon is sour but good.'],['tasty or bland?','خوشمزه یا بی‌مزه؟','Is the soup tasty or bland?']],
  intro:['This red shirt is darker than that one.','That dress is beautiful, but this one is ugly.','This tea is sweeter than that tea.','The lemon is sour. The cake is sweet.','This soup is tasty, but that soup is bland.','The blue bag is bigger, but it is more expensive.','Which shirt do you like? I like the lighter one.','I want less sugar, please.'],
  mission:{mode:'comparison',title:'مقایسهٔ واقعی؛ رنگ، مزه، اندازه و انتخاب',description:'دو تصویر را ببین؛ پاسخ با اطلاعات تصویر تغییر می‌کند. روی تصویر درست بزن و جملهٔ مقایسه را بساز.',scenes:[
    pair('رنگ پررنگ و کم‌رنگ','کدام رنگ پررنگ‌تر است؟',side('left','dark blue','آبی تیره','🟦','#254b9b'),side('right','pale blue','آبی روشن','🟦','#d0e8ff'),'left','The dark blue is darker than the light blue.','آبی تیره از آبی روشن پررنگ‌تر است.'),
    pair('زیبا و زشت','برای مهمانی کدام لباس مرتب‌تر و زیباتر به نظر می‌رسد؟',side('left','clean and pretty dress','پیراهن تمیز و مرتب','👗✨','#e8c8e8'),side('right','old and torn shirt','لباس کهنه و پاره','👕🩹','#93877e'),'left','The clean dress looks prettier than the torn shirt.','در این تصویر لباس تمیز زیباتر از لباس پاره به نظر می‌رسد؛ beautiful یعنی زیبا و ugly یعنی زشت.'),
    pair('شیرین و ترش','کدام خوراک ترش است؟',side('left','cake','کیک','🍰','#f5deb7'),side('right','lemon','لیمو','🍋','#f3efaa'),'right','The lemon is sour, but the cake is sweet.','لیمو ترش است، ولی کیک شیرین است.'),
    pair('خوشمزه و بی‌مزه','کدام غذا ظاهر خوشمزه‌تری دارد؟',side('left','meal A','غذای A','🍕','#f7d7a6'),side('right','meal B','غذای B','🥣','#d6e3e0'),'left','The pizza looks tastier than the plain soup.','پیتزا خوشمزه‌تر به نظر می‌رسد؛ البته مزهٔ واقعی را باید بچشی.'),
    pair('قیمت','کدام کالا ارزان‌تر است؟',side('left','bag · $25','کیف ۲۵ دلاری','🎒','#d9e5f1'),side('right','bag · $10','کیف ۱۰ دلاری','👜','#f0d0cf'),'right','The ten-dollar bag is cheaper than the other bag.','کیف ده‌دلاری ارزان‌تر از کیف بیست‌وپنج‌دلاری است.'),
    pair('اندازه','کدام بزرگ‌تر است؟',side('left','large box','جعبهٔ بزرگ','📦','#e3c397'),side('right','small cup','فنجان کوچک','☕','#dbe9e6'),'left','The box is bigger than the cup.','جعبه از فنجان بزرگ‌تر است.'),
    pair('مقدار','کدام مقدار کمتر است؟',side('left','three apples','سه سیب','🍎🍎🍎','#ffdfdb'),side('right','one apple','یک سیب','🍎','#f8d6d1'),'right','One apple is less than three apples.','یک سیب کمتر از سه سیب است.'),
    pair('دو ویژگی هم‌زمان','کدام انتخاب هم کم‌رنگ‌تر است و هم ارزان‌تر؟',side('left','dark jacket · $30','کاپشن تیره ۳۰ دلار','🧥','#415c85'),side('right','light jacket · $18','کاپشن روشن ۱۸ دلار','🧥','#d4e8ed'),'right','The light jacket is lighter and cheaper.','کاپشن روشن، هم کم‌رنگ‌تر است و هم ارزان‌تر.')
  ]},
  questions:[['Which shirt is darker?','کدام پیراهن پررنگ‌تر است؟','The dark blue shirt is darker.'],['Which food tastes sweeter?','کدام خوراک شیرین‌تر است؟','The cake tastes sweeter than the lemon.'],['Is that soup tasty or bland?','آن سوپ خوشمزه است یا بی‌مزه؟','It is bland, but I like the bread.'],['Do you want the prettier dress?','لباس زیباتر را می‌خواهی؟','Yes, but the other one is cheaper.']],
  tasks:[['بگو این پیراهن از آن پیراهن پررنگ‌تر است.','This shirt is darker than that shirt.'],['بگو سوپ بی‌مزه است ولی ساندویچ خوشمزه است.','The soup is bland, but the sandwich is delicious.'],['بگو کیک شیرین است و لیمو ترش است.','The cake is sweet and the lemon is sour.'],['بگو این چراغ روشن‌تر از آن چراغ است.','This lamp is brighter than that lamp.']],
  independent:'دو خوراک یا دو لباس واقعی را مقایسه کن. دربارهٔ رنگ یا مزه و قیمت یا اندازه دو جمله بنویس؛ در پایان بگو کدام را ترجیح می‌دهی و چرا.'
},
16:{
  core:[['sweater','ژاکت بافتنی','She is wearing a red sweater.'],['scarf','شال گردن','My scarf is green.'],['gloves','دستکش‌ها','These gloves are warm.'],['boots','چکمه‌ها','His boots are black.']],
  optional:[['skirt','دامن','She is wearing a long skirt.'],['belt','کمربند','This belt is brown.'],['tie','کراوات','He is wearing a tie.'],['cap','کلاه لبه‌دار','My cap is blue.'],['sandals','صندل','I wear sandals in summer.'],['hoodie','هودی','This hoodie is big.']],
  phrases:[['put on','پوشیدن / به تن کردن','Put on your jacket, please.'],['take off','درآوردن لباس','Take off your shoes at home.'],['too big','بیش از حد بزرگ','This coat is too big.'],['too small','بیش از حد کوچک','These shoes are too small.'],['a light-colored shirt','پیراهن روشن','She is wearing a light-colored shirt.']],
  intro:['I am wearing a blue shirt and black pants.','She is wearing a green dress.','He is wearing a warm jacket.','My shoes are brown but my socks are white.','This coat is too big for me.','Do you like the dark or the light scarf?','My sister wears a hat in the sun.','We wear boots when it rains.'],
  mission:{mode:'wardrobe',title:'کمد لباس دو نفر؛ از تصویر بخوان',description:'این بار باید پوشاک، رنگ و شخص را با هم تطبیق بدهی. حدس را از روی صحنه بزن.',scenes:[
    pair('پیراهن و رنگ','چه کسی پیراهن آبی پوشیده؟',side('left','Nina','نینا؛ لباس سبز','👩🏻‍🦰👗','#d4e6d3'),side('right','Ali','علی؛ پیراهن آبی','👨🏽👕','#bbd9ec'),'right','Ali is wearing a blue shirt.','علی پیراهن آبی پوشیده است.'),
    pair('کاپشن گرم','چه کسی کاپشن گرم پوشیده است؟',side('left','Reza','رضا؛ کاپشن','🧍🏻🧥','#e0e8f2'),side('right','Sara','سارا؛ تی‌شرت','👩🏼👚','#ffe7e4'),'left','Reza is wearing a warm jacket.','رضا کاپشن گرم پوشیده است.'),
    pair('کفش و چکمه','کدام جفت برای هوای بارانی مناسب‌تر است؟',side('left','sandals','صندل','🩴','#e7ebe6'),side('right','boots','چکمه','🥾','#c9af90'),'right','I wear boots in the rain.','در باران چکمه می‌پوشم.'),
    pair('جوراب و کلاه','کدام پوشاک را روی پا می‌پوشی؟',side('left','socks','جوراب','🧦','#e3eaf0'),side('right','hat','کلاه','🧢','#eee3bf'),'left','These socks are for my feet.','این جوراب‌ها برای پاهایم هستند.'),
    pair('اندازه','کدام لباس برای فرد کوچک‌جثه مناسب‌تر است؟',side('left','large coat','پالتوی خیلی بزرگ','🧥','#c4d9e9'),side('right','small shirt','پیراهن کوچک','👕','#d2eee2'),'right','The small shirt fits better.','پیراهن کوچک اندازهٔ مناسب‌تری دارد.'),
    pair('لباس زنانه','کدام تصویر پیراهن زنانه است؟',side('left','dress','پیراهن زنانه','👗','#f3d6ed'),side('right','jacket','کاپشن','🧥','#dce3eb'),'left','She is wearing a green dress.','او پیراهن سبز پوشیده است.'),
    pair('شال و دستکش','برای دست‌های سرد چه چیزی می‌پوشی؟',side('left','scarf','شال گردن','🧣','#f1d6c6'),side('right','gloves','دستکش','🧤','#d5e7f1'),'right','I wear gloves when my hands are cold.','وقتی دست‌هایم سرد است دستکش می‌پوشم.'),
    pair('مقایسهٔ لباس','کدام لباس روشن‌تر است؟',side('left','dark coat','پالتوی تیره','🧥','#385a63'),side('right','light shirt','پیراهن روشن','👕','#e7f2e7'),'right','The shirt is lighter than the coat.','پیراهن از پالتو روشن‌تر است.')
  ]},
  questions:[['What color is your jacket?','کاپشنت چه رنگ است؟','My jacket is dark blue.'],['Which shoes are yours?','کدام کفش‌ها مال توست؟','The black shoes are mine.'],['Is this coat too big?','این پالتو خیلی بزرگ است؟','Yes, it is too big.'],['What do you wear when it is cold?','وقتی هوا سرد است چه می‌پوشی؟','I wear my warm sweater and scarf.']],
  tasks:[['بگو برادرم یک ژاکت قرمز پوشیده است.','My brother is wearing a red sweater.'],['بپرس کفش‌های مشکی چه کسی هستند.','Whose black shoes are these?'],['بگو این پالتو بیش از حد بزرگ است.','This coat is too big.']],
  independent:'دو نفر را با دو لباس متفاوت تصور کن. برای هر نفر لباس و رنگ و اندازه بنویس؛ بعد بگو خودت امروز کدام را می‌پوشی.'
},
17:{
  core:[['elbow','آرنج','My elbow is between my shoulder and my hand.'],['wrist','مچ دست','My wrist is smaller than my arm.'],['ankle','مچ پا','My ankle is above my foot.'],['finger','انگشت دست','I have ten fingers.'],['toe','انگشت پا','I have ten toes.'],['chest','قفسهٔ سینه','My chest is above my stomach.']],
  optional:[['chin','چانه','My chin is under my mouth.'],['heel','پاشنه','My heel is part of my foot.'],['thumb','شست دست','I have two thumbs.'],['waist','کمر / میان‌تنه','My waist is below my chest.']],
  phrases:[['two feet','دو پا','I have two feet.'],['ten fingers','ده انگشت دست','I have ten fingers.'],['one nose','یک بینی','I have one nose.'],['longer than','بلندتر از','My leg is longer than my hand.'],['both hands','هر دو دست','I can move both hands.']],
  intro:['I have two eyes and one nose.','My leg is longer than my foot.','I have two hands and ten fingers.','My feet are under my knees.','This is my elbow, not my wrist.','My shoulder is bigger than my finger.','I have one head and two shoulders.','Foot becomes feet when we speak about two.'],
  mission:{mode:'body',title:'بدن را مقایسه کن؛ مفرد، جمع، اندازه',description:'به جای پرسیدن «عضو کجاست؟» دو عضو یا دو تعداد را مقایسه کن و عضو صحیح را لمس کن.',scenes:[
    pair('یک یا دو؟','از کدام عضو معمولاً دو تا داریم؟',side('left','head','سر','🙂','#f2d8c1'),side('right','hands','دست‌ها','👐','#d6e5e1'),'right','We have two hands but one head.','دو دست داریم اما یک سر.'),
    pair('پا و ساق','کدام عضو معمولاً بلندتر است؟',side('left','leg','پا از ران تا مچ','🦵','#e9d8c4'),side('right','foot','کف پا','🦶','#e4e6da'),'left','My leg is longer than my foot.','پای من از کف پایم بلندتر است.'),
    pair('foot یا feet','کدام تصویر با feet سازگار است؟',side('left','one foot','یک پا','🦶','#f5e7d3'),side('right','two feet','دو پا','🦶🦶','#e6efde'),'right','One foot, two feet.','یک پا foot و دو پا feet است.'),
    pair('انگشت و بازو','کدام عضو بلندتر است؟',side('left','arm','بازو / دست','💪','#e4d6ce'),side('right','finger','انگشت','☝️','#e9edf3'),'left','An arm is longer than a finger.','دست از انگشت بلندتر است.'),
    pair('مچ دست یا پا','کدام عضو به hand وصل است؟',side('left','wrist','مچ دست','✋','#d8e7e8'),side('right','ankle','مچ پا','🦶','#e5d8d6'),'left','The wrist is part of the hand and arm.','مچ دست به دست و بازو مربوط است.'),
    pair('بینی و چشم','کدام عضو معمولاً یک عدد است؟',side('left','eyes','چشم‌ها','👀','#e8f0d8'),side('right','nose','بینی','👃','#f1dacb'),'right','I have two eyes and one nose.','دو چشم و یک بینی دارم.'),
    pair('آرنج و زانو','کدام عضو بخشی از پا است؟',side('left','elbow','آرنج','💪','#e9ddd1'),side('right','knee','زانو','🦵','#dde8e5'),'right','My knee is part of my leg.','زانو بخشی از پا است.'),
    pair('شانه و انگشت','کدام عضو بزرگ‌تر است؟',side('left','shoulder','شانه','🧍','#d8e9f1'),side('right','finger','انگشت','☝️','#e8e3d8'),'left','My shoulder is bigger than my finger.','شانهٔ من از انگشتم بزرگ‌تر است.')
  ]},
  questions:[['How many fingers do you have?','چند انگشت دست داری؟','I have ten fingers.'],['Which is longer, your arm or finger?','دست بلندتر است یا انگشت؟','My arm is longer than my finger.'],['Do you have one foot or two feet?','یک پا داری یا دو پا؟','I have two feet.'],['Is your knee part of your arm?','زانو بخشی از دست است؟','No, my knee is part of my leg.']],
  tasks:[['بگو دو پا ولی یک سر دارم.','I have two feet but one head.'],['بگو دست من از انگشتم بلندتر است.','My arm is longer than my finger.'],['بگو من ده انگشت دست دارم.','I have ten fingers.'],['بگو ده انگشت پا دارم.','I have ten toes.'],['بگو قفسهٔ سینه‌ام بالای شکمم قرار دارد.','My chest is above my stomach.']],
  independent:'در ذهن دو عضو بدن خودت را انتخاب کن. تعداد، اندازه یا تفاوتشان را مقایسه کن و از foot/feet یا یک مفرد و جمع دیگر استفاده کن.'
},
18:{
  core:[['stomachache','دل‌درد','I have a stomachache.'],['nauseous','دارای حالت تهوع','I feel nauseous.'],['toothache','دندان‌درد','I have a toothache.'],['earache','گوش‌درد','I have an earache.'],['sore','دردناک / ملتهب','My throat is sore.'],['throat','گلو','My throat hurts.'],['weak','ضعیف / بی‌حال','I feel weak.'],['vomit','استفراغ کردن','I feel like I might vomit.']],
  optional:[['nausea','حالت تهوع','I have a feeling of nausea.'],['chills','لرز','I have chills.'],['rash','بثورات پوستی','I have a rash.'],['swollen','ورم‌کرده','My ankle is swollen.'],['cramp','گرفتگی / دل‌پیچه','I have a stomach cramp.']],
  phrases:[['My eye hurts.','چشمم درد می‌کند.','My eye hurts.'],['I have a stomachache.','دل‌درد دارم.','I have a stomachache.'],['I feel sick.','حالم خوب نیست / حالت تهوع دارم.','I feel sick.'],['I feel like vomiting.','حالت استفراغ دارم.','I feel like vomiting.'],['I need help, please.','لطفاً کمک می‌خواهم.','I need help, please.'],['Do you have some water?','کمی آب داری؟','Do you have some water?']],
  intro:['My stomach hurts. I have a stomachache.','I feel sick and nauseous.','My right eye hurts.','I have a toothache today.','My throat is sore, and I have a cough.','I feel dizzy and weak.','Can you help me, please?','I need some water and rest.'],
  mission:{mode:'symptoms',title:'از نشانه به جمله؛ چه دردی داری؟',description:'هر صحنه نشانهٔ متفاوتی دارد. عضو یا حالت درست را پیدا کن و سپس دو شکل طبیعی بیان درد را بخوان.',scenes:[
    pair('دل‌درد','فردی که دستش روی شکم است کدام است؟',side('left','stomach pain','دل‌درد','🤢','#e6ecda'),side('right','head pain','سردرد','🤕','#ecdac9'),'left','I have a stomachache. My stomach hurts.','دل‌درد دارم. شکمم درد می‌کند.'),
    pair('حالت تهوع','کدام تصویر حس تهوع را نشان می‌دهد؟',side('left','sleepy','خواب‌آلود','😴','#dfebf5'),side('right','nauseous','حالت تهوع','🤢','#dfe8c9'),'right','I feel sick. I feel nauseous.','حالم به هم می‌خورد. حالت تهوع دارم.'),
    pair('چشم درد می‌کند','کدام عضو درد می‌کند؟',side('left','eye','چشم','👁️','#e3edf3'),side('right','ear','گوش','👂','#f0dfcc'),'left','My eye hurts. I have pain in my eye.','چشمم درد می‌کند. چشم‌درد دارم.'),
    pair('دندان‌درد','کدام مورد دندان‌درد است؟',side('left','tooth','دندان','🦷','#f1eee9'),side('right','throat','گلو','🗣️','#efdcda'),'left','I have a toothache. My tooth hurts.','دندان‌درد دارم. دندانم درد می‌کند.'),
    pair('گلودرد','کدام تصویر به گلودرد مربوط است؟',side('left','sore throat','گلودرد','🗣️','#f1d9d9'),side('right','foot','پا','🦶','#ecdfc5'),'left','My throat is sore. My throat hurts.','گلویم درد می‌کند / گلودرد دارم.'),
    pair('گوش‌درد','کدام عضو درد دارد؟',side('left','ear','گوش','👂','#f0d7c9'),side('right','knee','زانو','🦵','#e2e9e4'),'left','I have an earache. My ear hurts.','گوش‌درد دارم. گوشم درد می‌کند.'),
    pair('تب یا سرفه','کدام تصویر بیشتر به تب اشاره دارد؟',side('left','fever','تب','🤒','#f2dbd8'),side('right','cough','سرفه','😷','#dbe5ed'),'left','I have a fever. I need some rest.','تب دارم. کمی استراحت لازم دارم.'),
    pair('سرگیجه','کدام حالت سرگیجه است؟',side('left','dizzy','سرگیجه','😵‍💫','#eedfeb'),side('right','happy','خوشحال','😃','#f6edc8'),'left','I feel dizzy. Can you help me?','سرگیجه دارم. می‌توانی کمکم کنی؟'),
    pair('دارو یا آب','اگر حالت تهوع داری کدام درخواست ساده‌تر و امن‌تر است؟',side('left','water','آب','💧','#d7ebf4'),side('right','random pills','قرص ناشناس','💊','#f1dadb'),'left','Can I have some water, please?','لطفاً کمی آب می‌دهی؟ بدون شناخت دارو، خودسرانه دارو انتخاب نکن.')
  ]},
  questions:[['Where does it hurt?','کجا درد می‌کند؟','My stomach hurts.'],['Do you have a headache or a toothache?','سردرد داری یا دندان‌درد؟','I have a toothache.'],['How do you feel?','چه حالی داری؟','I feel sick and weak.'],['Can I get you some water?','کمی آب برایت بیاورم؟','Yes, please. I feel dizzy.']],
  tasks:[['بگو چشم راستم درد می‌کند.','My right eye hurts.'],['بگو دل‌درد دارم و حالت تهوع دارم.','I have a stomachache and I feel sick.'],['بگو گلوی من درد می‌کند.','My throat hurts.'],['بگو احساس می‌کنم ممکن است استفراغ کنم.','I feel like I might vomit.']],
  independent:'در یک موقعیت فرضی، دو علامت متفاوت مثل دل‌درد یا چشم‌درد را بیان کن و با یک جملهٔ مؤدبانه آب، استراحت یا کمک بخواه؛ نام داروی خاصی لازم نیست.'
},
19:{
  core:[['builder','بنا / سازنده','The builder builds houses.'],['mechanic','مکانیک','The mechanic fixes cars.'],['dentist','دندان‌پزشک','The dentist helps people with their teeth.'],['pilot','خلبان','The pilot flies a plane.'],['baker','نانوا','The baker makes bread.'],['waiter','پیشخدمت','The waiter brings food.'],['cleaner','نظافتچی','The cleaner cleans rooms.'],['artist','هنرمند','The artist draws pictures.'],['fix','تعمیر کردن','The mechanic can fix a car.'],['build','ساختن','The builder can build a house.']],
  optional:[['shopkeeper','مغازه‌دار','The shopkeeper works in a store.'],['firefighter','آتش‌نشان','A firefighter helps people.'],['plumber','لوله‌کش','The plumber fixes the sink.'],['carpenter','نجار','The carpenter makes a table.']],
  phrases:[['builds houses','خانه می‌سازد','A builder builds houses.'],['fixes cars','ماشین تعمیر می‌کند','A mechanic fixes cars.'],['works at a school','در مدرسه کار می‌کند','A teacher works at a school.'],['drives a taxi','تاکسی می‌راند','My brother drives a taxi.'],['serves food','غذا سرو می‌کند','The waiter serves food.'],['helps patients','به بیماران کمک می‌کند','The doctor helps patients.']],
  intro:['My father is a builder. He builds houses.','The teacher works at our school.','A doctor helps sick people.','The baker makes bread every morning.','The driver drives a taxi.','The mechanic fixes my car.','The waiter brings food in the restaurant.','The nurse works with the doctor.'],
  mission:{mode:'roles',title:'شغل را از کاری که انجام می‌دهد پیدا کن',description:'شخص درست را از روی کاری که انجام می‌دهد، مکان کار و جملهٔ واقعی تشخیص بده.',scenes:[
    pair('خانه‌سازی','چه کسی خانه می‌سازد؟',side('left','builder','بنا','👷','#f2dfa9'),side('right','chef','آشپز','👩‍🍳','#f2e4dd'),'left','This is a builder. He builds houses.','این بنا است. او خانه می‌سازد.'),
    pair('درمان','چه کسی به بیمار کمک می‌کند؟',side('left','doctor','پزشک','👩‍⚕️','#dcebed'),side('right','driver','راننده','🚕','#f5ebbf'),'left','The doctor helps sick people.','پزشک به افراد بیمار کمک می‌کند.'),
    pair('مدرسه','چه کسی در مدرسه تدریس می‌کند؟',side('left','baker','نانوا','👨‍🍳','#ead9bd'),side('right','teacher','معلم','👩‍🏫','#e0e9e4'),'right','The teacher works at our school.','معلم در مدرسهٔ ما کار می‌کند.'),
    pair('تعمیر ماشین','ماشین خراب را چه کسی درست می‌کند؟',side('left','mechanic','مکانیک','🧑‍🔧','#d7e5ee'),side('right','artist','هنرمند','🧑‍🎨','#e9d9ef'),'left','The mechanic fixes cars.','مکانیک ماشین‌ها را تعمیر می‌کند.'),
    pair('نان صبحانه','چه کسی نان می‌پزد؟',side('left','pilot','خلبان','🧑‍✈️','#e1e9f4'),side('right','baker','نانوا','🥖','#f6e4bf'),'right','The baker makes bread.','نانوا نان می‌پزد.'),
    pair('رستوران','چه کسی غذا را برای مشتری می‌آورد؟',side('left','waiter','پیشخدمت','🧑‍🍽️','#dfebd8'),side('right','builder','بنا','👷','#ead8b8'),'left','The waiter serves food.','پیشخدمت غذا را سرو می‌کند.'),
    pair('حمل‌ونقل','چه کسی هواپیما هدایت می‌کند؟',side('left','driver','راننده','🚗','#d4e2eb'),side('right','pilot','خلبان','✈️','#cdddec'),'right','The pilot flies a plane.','خلبان هواپیما هدایت می‌کند.'),
    pair('هنر','چه کسی نقاشی می‌کشد؟',side('left','artist','هنرمند','🎨','#e6d7ee'),side('right','cashier','صندوق‌دار','💵','#e4eddc'),'left','The artist draws pictures.','هنرمند تصویر می‌کشد.'),
    pair('نظافت','چه کسی اتاق‌ها را تمیز می‌کند؟',side('left','cleaner','نظافتچی','🧹','#d7e8e0'),side('right','dentist','دندان‌پزشک','🦷','#f0e7db'),'left','The cleaner cleans rooms.','نظافتچی اتاق‌ها را تمیز می‌کند.')
  ]},
  questions:[['What does your father do?','پدرت چه‌کاره است؟','My father is a builder.'],['What does a builder do?','بنا چه کار می‌کند؟','A builder builds houses.'],['Does a mechanic cook food?','مکانیک غذا می‌پزد؟','No, a mechanic fixes cars.'],['Where does a teacher work?','معلم کجا کار می‌کند؟','A teacher works at a school.']],
  tasks:[['بگو این مرد بنا است و خانه می‌سازد.','This man is a builder. He builds houses.'],['بگو خواهرم دانشجو است و پدرم راننده است.','My sister is a student and my father is a driver.'],['بگو مکانیک ماشین مرا تعمیر می‌کند.','The mechanic fixes my car.']],
  independent:'سه نفر آشنا یا خیالی را معرفی کن: شغل، محل کار و یک کار واقعی برای هر نفر. دست‌کم یک جمله را با he/she + فعل مناسب بساز.'
},
20:{
  core:[['basket','سبد خرید','I put two apples in my basket.'],['list','فهرست','I have a shopping list.'],['fresh','تازه','These apples are fresh.'],['piece','عدد / تکه','I need two pieces.']],
  optional:[['aisle','راهروی فروشگاه','The milk is in aisle two.'],['discount','تخفیف','This shirt is on sale.'],['hanger','رخت‌آویز','The shirt is on a hanger.'],['checkout','صندوق پرداخت','The checkout is near the door.'],['trolley','چرخ خرید','The trolley is full.']],
  phrases:[['shopping list','فهرست خرید','This is my shopping list.'],['fitting room','اتاق پرو','Where is the fitting room?'],['How much is it?','قیمتش چقدر است؟','How much is this jacket?'],['I need two','دو عدد لازم دارم','I need two apples.'],['Do you have a smaller size?','اندازهٔ کوچک‌تر دارید؟','Do you have a smaller size?'],['Can I try it on?','می‌توانم پرو کنم؟','Can I try it on?']],
  intro:['I need two apples and milk.','Here is my shopping list.','I have eight dollars. Can I buy the food?','How much is this shirt?','Do you have a smaller size?','I want to try this jacket on.','The red shirt is cheaper than the blue one.','Put two apples in the basket, please.'],
  mission:{mode:'basket',title:'فهرست خرید؛ خودت سبد را کامل کن',description:'این بار هیچ پاسخ سه‌گزینه‌ای وجود ندارد. تعداد، قیمت و بودجه را با فهرست تطبیق بده. کالاهای اضافه هم روی قفسه هستند.',scenes:[
    order('سوپرمارکت','فهرست خانواده را از قفسه جمع کن. یک خوراک اضافه عمداً وجود دارد.',[
      item('apple','apple','سیب','🍎',2,3),item('milk','milk','شیر','🥛',3,1),item('bread','bread','نان','🍞',2,2),item('pizza','pizza','پیتزا','🍕',8,0),item('egg','egg','تخم‌مرغ','🥚',1,0)
    ],'I need three apples, one bottle of milk and two loaves of bread.','سه سیب، یک بطری شیر و دو قرص نان برای فهرستم لازم دارم.'),
    order('خرید لباس','برای دو نفر لباس انتخاب کن؛ رنگ را از جملهٔ مأموریت به خاطر بسپار.',[
      item('shirt','shirt','پیراهن','👕',8,2),item('socks','socks','جوراب','🧦',3,2),item('hat','hat','کلاه','🧢',5,0),item('jacket','jacket','کاپشن','🧥',20,1),item('dress','dress','پیراهن زنانه','👗',14,0)
    ],'I need two shirts, two pairs of socks and one jacket.','دو پیراهن، دو جفت جوراب و یک کاپشن لازم دارم.'),
    order('بودجهٔ محدود','فقط اقلام فهرست را انتخاب کن؛ بعد ببین جمع قیمت چقدر است.',[
      item('banana','banana','موز','🍌',2,2),item('water','water','آب','💧',1,3),item('juice','juice','آب‌میوه','🧃',4,0),item('cheese','cheese','پنیر','🧀',3,1),item('cake','cake','کیک','🍰',5,0)
    ],'My basket has two bananas, three bottles of water and some cheese.','سبدم دو موز، سه بطری آب و کمی پنیر دارد.')
  ]},
  questions:[['What is on your shopping list?','چه چیزهایی در فهرست خریدت هست؟','I need two apples and one bottle of milk.'],['How much is the blue shirt?','پیراهن آبی چند است؟','It is eight dollars.'],['Do you have a smaller size?','اندازهٔ کوچک‌تر دارید؟','Yes, here is a small shirt.'],['Can I try this jacket on?','می‌توانم این کاپشن را پرو کنم؟','Yes, you can try it on.']],
  tasks:[['بگو برای خریدم سه سیب و یک بطری شیر لازم دارم.','I need three apples and one bottle of milk.'],['بپرس این پیراهن چقدر است؟','How much is this shirt?'],['بگو من فهرست خریدم را همراه دارم.','I have my shopping list.'],['بگو این سیب‌ها تازه‌اند.','These apples are fresh.'],['بگو دو تکه نان لازم دارم.','I need two pieces of bread.']],
  independent:'یک فهرست خرید واقعی از سه قلم کالا بنویس، برای هرکدام تعداد و قیمت فرضی بگذار و دو سؤال خرید دربارهٔ قیمت یا اندازه بساز.'
},
21:{
  core:[['subtotal','جمع پیش از هزینه‌های اضافه','The subtotal is twelve dollars.'],['amount','مبلغ','What is the total amount?'],['charge','هزینه / مبلغ گرفتن','There is no extra charge.'],['split','تقسیم کردن','Can we split the bill?']],
  optional:[['tax','مالیات','The tax is one dollar.'],['refund','بازپرداخت پول','I need a refund.'],['paid','پرداخت‌شده','The bill is paid.'],['contactless','بدون تماس','Can I pay contactless?'],['balance','باقی‌مانده / مانده حساب','My balance is low.']],
  phrases:[['Can I have the bill?','می‌توانم صورت‌حساب را داشته باشم؟','Can I have the bill, please?'],['I will pay by card.','با کارت پرداخت می‌کنم.','I will pay by card.'],['Can I have a receipt?','می‌توانم رسید بگیرم؟','Can I have a receipt, please?'],['Here is your change.','این هم بقیهٔ پولتان.','Here is your change.'],['The total is','جمع کل ... است','The total is twelve dollars.'],['Let us split the bill.','بیایید صورت‌حساب را تقسیم کنیم.','Let us split the bill.']],
  intro:['Can I have the bill, please?','Our table has two soups and one coffee.','The total is twelve dollars.','I want to pay by card.','Do you need a receipt? Yes, please.','I will pay ten dollars in cash.','Here is your change.','The receipt shows the food and the total.'],
  mission:{mode:'basket',checkout:true,title:'از سفارش تا رسید واقعی',description:'صورت‌حساب را از سفارش می‌سازی، مبلغ جمع را می‌بینی، روش پرداخت را انتخاب می‌کنی و رسید می‌گیری.',scenes:[
    order('صورت‌حساب کافه','مشتری دو قهوه و یک کیک سفارش داده؛ یک نوشیدنی اضافه هم در فهرست هست.',[
      item('coffee','coffee','قهوه','☕',3,2),item('cake','cake','کیک','🍰',4,1),item('tea','tea','چای','🫖',2,0),item('water','water','آب','💧',1,0)
    ],'Two coffees and one cake: the total is ten dollars.','دو قهوه و یک کیک، جمع ده دلار می‌شود.',20),
    order('صورت‌حساب رستوران','از روی لیست سفارش، اقلام درست را وارد صورت‌حساب کن.',[
      item('soup','soup','سوپ','🥣',5,2),item('salad','salad','سالاد','🥗',4,1),item('juice','juice','آب‌میوه','🧃',3,2),item('pizza','pizza','پیتزا','🍕',9,0)
    ],'Two soups, one salad and two juices cost twenty dollars.','دو سوپ، یک سالاد و دو آب‌میوه بیست دلار می‌شود.',30),
    order('بقیهٔ پول','این بار مشتری با اسکناس نقدی خرید می‌کند. پس از درست کردن رسید، بقیهٔ پول را بخوان.',[
      item('sandwich','sandwich','ساندویچ','🥪',6,1),item('tea','tea','چای','🫖',2,2),item('bread','bread','نان','🍞',1,0)
    ],'I pay ten dollars for one sandwich and two teas.','برای یک ساندویچ و دو چای ده دلار می‌دهم.',20),
    order('رسید خرید لباس','قیمت و تعداد لباس‌ها را روی رسید تنظیم کن.',[
      item('shirt','shirt','پیراهن','👕',7,2),item('hat','hat','کلاه','🧢',4,1),item('boots','boots','چکمه','🥾',16,0),item('socks','socks','جوراب','🧦',2,1)
    ],'The receipt shows two shirts, one hat and one pair of socks.','رسید دو پیراهن، یک کلاه و یک جفت جوراب را نشان می‌دهد.',30)
  ]},
  questions:[['May I have the bill, please?','می‌توانم صورت‌حساب را بگیرم؟','Yes, here is your bill.'],['How much is the total?','جمع کل چقدر است؟','The total is ten dollars.'],['Cash or card?','نقدی یا کارت؟','Card, please.'],['Would you like a receipt?','رسید می‌خواهید؟','Yes, I need a receipt, please.'],['How much change do I get?','چقدر بقیهٔ پول می‌گیرم؟','You get ten dollars in change.']],
  tasks:[['بگو جمع کل ده دلار است.','The total is ten dollars.'],['بگو با کارت پرداخت می‌کنم و رسید می‌خواهم.','I will pay by card and I need a receipt.'],['بگو این هم بقیهٔ پول شما.','Here is your change.'],['بگو جمع قبل از هزینهٔ اضافه دوازده دلار است.','The subtotal is twelve dollars.'],['جمع مبلغ را بپرس.','What is the total amount?'],['بگو هزینهٔ اضافه وجود ندارد.','There is no extra charge.'],['بپرس می‌توانیم صورت‌حساب را تقسیم کنیم؟','Can we split the bill?']],
  independent:'سفارش واقعی یا فرضی دو نفر را روی صورت‌حساب بنویس، تعدادها و جمع قیمت را حساب کن، روش پرداخت را مشخص کن و مؤدبانه رسید بخواه.'
},
22:{
  core:[['hospital','بیمارستان','The hospital is next to the park.'],['bakery','نانوایی','The bakery is near the school.'],['museum','موزه','The museum is in the city.'],['bridge','پل','The bridge is over the road.'],['plaza','میدان شهری','The bank is near the plaza.']],
  optional:[['postbox','صندوق پست','The postbox is near the store.'],['fountain','آبنما','The fountain is in the square.'],['playfield','زمین بازی','The children play in the playfield.']],
  phrases:[['next to the bank','کنار بانک','The cafe is next to the bank.'],['across the street','آن سوی خیابان','The park is across the street.'],['on the corner','سر نبش / گوشه','The bakery is on the corner.'],['near the school','نزدیک مدرسه','The hospital is near the school.'],['between two buildings','بین دو ساختمان','The cafe is between two buildings.']],
  intro:['There is a park near my home.','The cafe is next to the bank.','The bakery is on the corner.','The hospital is across the street.','I can see the bridge on the city map.','The school is near the library.','Where is the supermarket? Find it on the map.','The square is in the middle of the city.'],
  mission:{mode:'city',title:'شهر کوچک طوطیوار؛ مکان را واقعاً روی نقشه پیدا کن',description:'نقشه ثابت است و مکان‌ها واقعیِ همین تمرین هستند. هر بار سراغ نشانی جدید برو؛ نام مکان را از روی نقشه پیدا کن.',places:[
    place('school','مدرسه','school','🏫',0,0),place('cafe','کافه','cafe','☕',2,0),place('bakery','نانوایی','bakery','🥖',4,0),
    place('park','پارک','park','🌳',1,1),place('bank','بانک','bank','🏦',3,0),
    place('hospital','بیمارستان','hospital','🏥',0,2),place('square','میدان','square','⛲',2,2),place('library','کتابخانه','library','📚',4,2),
    place('market','سوپرمارکت','supermarket','🛒',1,2),place('museum','موزه','museum','🏛️',3,3),
    place('station','ایستگاه','station','🚏',0,4),place('bridge','پل','bridge','🌉',2,4),place('store','مغازه','store','🏬',4,4)
  ],missions:[
    ['پارک','پارک را روی نقشه پیدا کن.','park','This is the park. It is near the market.','این پارک است؛ نزدیک فروشگاه قرار دارد.'],
    ['بیمارستان','روی نشانهٔ بیمارستان بزن.','hospital','The hospital is on the left side of the map.','بیمارستان در سمت چپ نقشه است.'],
    ['کافه','کافه را در ردیف بالا پیدا کن.','cafe','The cafe is near the school.','کافه نزدیک مدرسه است.'],
    ['نانوایی','نان کجا می‌خریم؟ نانوایی را پیدا کن.','bakery','This is the bakery.','این نانوایی است.'],
    ['کتابخانه','کتابخانه را لمس کن.','library','The library is near the square.','کتابخانه نزدیک میدان است.'],
    ['ایستگاه','برای اتوبوس کجا می‌ایستی؟','station','This is the bus station.','این ایستگاه اتوبوس است.'],
    ['سوپرمارکت','فروشگاه مواد غذایی کجاست؟','market','The supermarket is next to the park.','سوپرمارکت کنار پارک است.'],
    ['بانک','بانک را روی نقشه پیدا کن.','bank','The bank is above the museum on the map.','بانک در نقشه بالای موزه است.'],
    ['پل','نشانهٔ پل را پیدا کن.','bridge','This is the bridge.','این پل است.'],
    ['موزه','در این شهر موزه کجاست؟','museum','The museum is near the bank.','موزه نزدیک بانک است.']
  ].map(([topic,prompt,correct,successEn,successFa])=>({topic,prompt,correct,successEn,successFa}))},
  questions:[['Where is the park?','پارک کجاست؟','The park is near the market.'],['Is there a hospital in this city?','در این شهر بیمارستان هست؟','Yes, the hospital is near the school.'],['What is next to the park?','کنار پارک چیست؟','The supermarket is next to the park.'],['Where can I buy bread?','از کجا نان بخرم؟','At the bakery on the corner.']],
  tasks:[['بگو در این شهر پارک و بیمارستان هست.','There is a park and a hospital in this city.'],['بگو کافه کنار بانک است.','The cafe is next to the bank.'],['بپرس کتابخانه کجاست.','Where is the library?'],['بگو میدان شهری نزدیک بانک است.','The plaza is near the bank.']],
  independent:'خانهٔ خیالی‌ات را روی نقشهٔ شهر تصور کن. سه مکان نزدیک را نام ببر، جای نسبی دو مکان را بگو و از یک رهگذر مکان سوم را بپرس.'
},
23:{
  core:[['forward','به جلو','Walk forward to the bank.'],['ahead','جلوتر / روبه‌رو','The park is straight ahead.'],['toward','به سمت','Walk toward the bank.'],['east','شرق','The station is east of the park.'],['west','غرب','The cafe is west of the bank.']],
  optional:[['north','شمال','Go north on the map.'],['south','جنوب','The school is south of the park.'],['landmark','نشانهٔ مسیر','The bank is a landmark.']],
  phrases:[['Go straight.','مستقیم برو.','Go straight for one block.'],['Turn left.','به چپ بپیچ.','Turn left at the bank.'],['Turn right.','به راست بپیچ.','Turn right at the corner.'],['Cross the street.','از خیابان عبور کن.','Cross the street carefully.'],['at the intersection','سر تقاطع','Turn right at the intersection.'],['How do I get to ...?','چطور به ... بروم؟','How do I get to the park?']],
  intro:['Excuse me. How do I get to the park?','Go straight for two blocks.','Turn left at the bank.','Then turn right at the cafe.','The school is across the street.','Is the hospital far? No, it is near.','The bus stop is on the corner.','Thank you! You are welcome.'],
  mission:{mode:'route',title:'مسیریابی روی نقشه؛ هر گام را خودت انتخاب کن',description:'هر مأموریت چند پیچ دارد. گام‌های مسیر را یکی‌یکی بساز تا به مقصد برسی؛ جهت اشتباه پیشرفت نمی‌دهد.',places:[
    place('school','مدرسه','school','🏫',0,0),place('bank','بانک','bank','🏦',2,0),place('cafe','کافه','cafe','☕',4,0),
    place('park','پارک','park','🌳',1,2),place('market','فروشگاه','market','🛒',3,2),
    place('station','ایستگاه','station','🚏',0,4),place('hospital','بیمارستان','hospital','🏥',4,4)
  ],missions:[
    route('خانه تا پارک','از خانه حرکت کن: یک خانه به راست و یک خانه به پایین برو.',['east','south'],'Go one block east and one block south to the park.','یک بلوک به شرق و یک بلوک به جنوب برو تا به پارک برسی.',{x:0,y:1},{x:1,y:2}),
    route('مدرسه تا بانک','از مدرسه دو خانه به راست برو.',['east','east'],'Go straight to the bank.','مستقیم تا بانک برو.',{x:0,y:0},{x:2,y:0}),
    route('از کافه به بازار','از کافه دو خانه پایین برو و سپس یک خانه به چپ.',['south','south','west'],'Go straight, then turn left at the market.','مستقیم برو و سپس در بازار به چپ بپیچ.',{x:4,y:0},{x:3,y:2}),
    route('از ایستگاه تا پارک','از ایستگاه یک خانه به راست و دو خانه بالا برو.',['east','north','north'],'Go right, then go straight to the park.','به راست برو و سپس مستقیم تا پارک.',{x:0,y:4},{x:1,y:2}),
    route('تا بیمارستان','از بازار یک خانه به راست و دو خانه پایین برو.',['east','south','south'],'Turn right at the market, then go to the hospital.','کنار بازار به راست بپیچ و سپس به بیمارستان برو.',{x:3,y:2},{x:4,y:4})
  ]},
  questions:[['How do I get to the park?','چطور به پارک برسم؟','Go straight and turn right.'],['What do I do at the bank?','کنار بانک چه کنم؟','Turn left at the bank.'],['Is the bus stop near here?','ایستگاه اتوبوس نزدیک است؟','Yes, it is on the corner.'],['Do I cross the street?','از خیابان عبور کنم؟','Yes, cross the street carefully.']],
  tasks:[['بگو دو بلوک مستقیم برو و بعد چپ بپیچ.','Go straight for two blocks and then turn left.'],['بگو بانک روبه‌روی پارک است.','The bank is opposite the park.'],['بپرس کجا باید به راست بپیچم.','Where do I turn right?'],['بگو به سمت جلو تا بانک حرکت کن.','Walk forward to the bank.'],['بگو پارک درست روبه‌رو است.','The park is straight ahead.'],['بگو به سمت مدرسه راه برو.','Walk toward the school.']],
  independent:'برای رساندن دوست خیالی‌ات از مدرسه به پارک سه دستور مسیر بنویس. یک نشانهٔ شهری را به کار ببر و از او بپرس مقصد را پیدا کرده است یا نه.'
},
24:{
  core:[['fare','کرایه','The bus fare is two dollars.'],['passenger','مسافر','The passenger needs a ticket.'],['route','مسیر / خط','This bus route goes to the market.'],['vehicle','وسیلهٔ نقلیه','The bus is a vehicle.']],
  optional:[['schedule','برنامهٔ حرکت','The bus schedule is on the wall.'],['transfer','عوض‌کردن وسیلهٔ نقلیه','I need a transfer ticket.'],['terminal','پایانه','The bus terminal is near the station.']],
  phrases:[['take the bus','سوار اتوبوس شدن','I take the bus to school.'],['one ticket, please','یک بلیت لطفاً','One ticket, please.'],['How much is the fare?','کرایه چقدر است؟','How much is the bus fare?'],['Does this go to ...?','این به ... می‌رود؟','Does this bus go to the market?'],['get off here','اینجا پیاده شو','Please get off here.']],
  intro:['I go to school by bus.','The taxi is faster but more expensive.','The bus fare is two dollars.','I need a ticket to the market.','Where is the bus stop?','Does this train go to the city?','Two tickets, please.','Get off at the next stop.'],
  mission:{mode:'transport',title:'برای مسیر واقعی وسیله انتخاب کن',description:'زمان و هزینه را با هدف سفر مقایسه کن. همیشه سریع‌ترین و ارزان‌ترین انتخاب یکسان نیست.',scenes:[
    pair('بودجهٔ محدود','برای رفتن به مدرسه فقط ۳ دلار داری؛ کدام وسیله مناسب است؟',side('left','bus · $2','اتوبوس ۲ دلار','🚌','#d8e6df'),side('right','taxi · $8','تاکسی ۸ دلار','🚕','#f7e8b2'),'left','The bus is cheaper than the taxi.','اتوبوس از تاکسی ارزان‌تر است.'),
    pair('زمان کم','برای رسیدن به فرودگاه عجله داری؛ کدام سریع‌تر است؟',side('left','walk · 50 min','پیاده ۵۰ دقیقه','🚶','#e7f1e5'),side('right','taxi · 12 min','تاکسی ۱۲ دقیقه','🚕','#f8e6b9'),'right','The taxi is faster than walking.','تاکسی از پیاده‌روی سریع‌تر است.'),
    pair('ایستگاه','کدام تصویر ایستگاه اتوبوس را نشان می‌دهد؟',side('left','bus stop','ایستگاه اتوبوس','🚏','#e4ebdf'),side('right','railway platform','سکوی قطار','🚉','#dde7f1'),'left','This is the bus stop.','این ایستگاه اتوبوس است.'),
    pair('قطار و تاکسی','برای سفر به شهر دیگر کدام مناسب‌تر است؟',side('left','train','قطار','🚆','#dce6ee'),side('right','bicycle','دوچرخه','🚲','#e6e9dc'),'left','I travel to another city by train.','با قطار به شهر دیگر سفر می‌کنم.'),
    pair('کرایه','کدام بلیت ارزان‌تر است؟',side('left','train · $6','قطار ۶ دلار','🎫','#e1e9f1'),side('right','bus · $2','اتوبوس ۲ دلار','🎟️','#e5f0df'),'right','The bus fare is only two dollars.','کرایهٔ اتوبوس فقط دو دلار است.'),
    pair('مسافر','کدام تصویر مسافر را نشان می‌دهد؟',side('left','passenger','مسافر','🧍🏻‍♀️','#eee0de'),side('right','driver','راننده','🧑‍✈️','#d8e6ec'),'left','The passenger needs one ticket.','مسافر یک بلیت لازم دارد.'),
    pair('رسیدن به مقصد','برای رفتن به مرکز شهر از مترو استفاده می‌کنی؛ کدام مناسب است؟',side('left','subway','مترو','🚇','#dde6f1'),side('right','boat','قایق','⛵','#d8e9eb'),'left','I take the subway to the city center.','با مترو به مرکز شهر می‌روم.')
  ]},
  secondMission:{mode:'basket',checkout:true,title:'خرید بلیت و رسید سفر',description:'اول بلیت درست را با تعداد انتخاب کن، بعد هزینه را بپرداز و رسید بگیر.',scenes:[
    order('اتوبوس خانوادگی','دو نفر به پارک می‌روید؛ دقیقاً دو بلیت اتوبوس لازم دارید.',[item('bus','bus ticket','بلیت اتوبوس','🎫',2,2),item('train','train ticket','بلیت قطار','🎟️',6,0),item('taxi','taxi fare','کرایهٔ تاکسی','🚕',9,0)],'Two bus tickets cost four dollars.','دو بلیت اتوبوس چهار دلار می‌شود.',10),
    order('قطار به شهر','برای یک نفر یک بلیت قطار و یک آب می‌خری.',[item('train','train ticket','بلیت قطار','🎫',6,1),item('water','water','آب','💧',1,1),item('bus','bus ticket','بلیت اتوبوس','🎟️',2,0)],'One train ticket and one water cost seven dollars.','یک بلیت قطار و یک آب هفت دلار می‌شود.',10)
  ]},
  questions:[['How do you go to school?','چطور به مدرسه می‌روی؟','I take the bus to school.'],['How much is the bus fare?','کرایهٔ اتوبوس چند است؟','The bus fare is two dollars.'],['Does this train go to the city?','این قطار به شهر می‌رود؟','Yes, it goes to the city.'],['Where do I get off?','کجا باید پیاده شوم؟','Get off at the next stop.']],
  tasks:[['بگو کرایهٔ اتوبوس دو دلار است.','The bus fare is two dollars.'],['بگو تاکسی سریع‌تر ولی گران‌تر است.','The taxi is faster but more expensive.'],['یک بلیت قطار بخواه.','One train ticket, please.'],['بگو این خط اتوبوس به بازار می‌رود.','This bus route goes to the market.']],
  independent:'برای دو مقصد متفاوت وسیله انتخاب کن؛ یکی به دلیل هزینه و دیگری به دلیل زمان. سپس یک گفت‌وگوی خرید بلیت با مقصد و قیمت بنویس.'
}
};

// Every added conversation prompt has two genuinely relevant replies with accurate Persian meaning.
// This is intentionally not a fixed three-button answer bank.
export const stage2AnswerVariants = {
  15:[
    ['پیراهن آبیِ تیره پررنگ‌تر است.','The dark red shirt is darker.','پیراهن قرمز تیره پررنگ‌تر است.'],
    ['کیک از لیمو شیرین‌تر است.','The tea tastes sweeter than the coffee.','چای از قهوه شیرین‌تر است.'],
    ['بی‌مزه است، اما نان را دوست دارم.','It is tasty, especially with bread.','خوشمزه است، به‌خصوص همراه نان.'],
    ['بله، ولی لباس دیگر ارزان‌تر است.','No, I want the cheaper dress.','نه، لباس ارزان‌تر را می‌خواهم.']
  ],
  16:[
    ['کاپشنم آبی تیره است.','It is light green.','سبز روشن است.'],
    ['کفش‌های مشکی مال من هستند.','The brown boots are mine.','چکمه‌های قهوه‌ای مال من‌اند.'],
    ['بله، خیلی بزرگ است.','No, this one fits well.','نه، این یکی اندازه است.'],
    ['ژاکت گرم و شال گردنم را می‌پوشم.','I put on a coat and gloves.','پالتو و دستکش می‌پوشم.']
  ],
  17:[
    ['ده انگشت دست دارم.','I have ten fingers and ten toes.','ده انگشت دست و ده انگشت پا دارم.'],
    ['دستم از انگشتم بلندتر است.','My leg is longer than my foot.','پایم از کف پایم بلندتر است.'],
    ['دو پا دارم.','I have two feet and two hands.','دو پا و دو دست دارم.'],
    ['نه، زانو بخشی از پای من است.','No, my elbow is part of my arm.','نه، آرنج من بخشی از دستم است.']
  ],
  18:[
    ['شکمم درد می‌کند.','My right eye hurts.','چشم راستم درد می‌کند.'],
    ['دندان‌درد دارم.','I have a headache.','سردرد دارم.'],
    ['حالم بد است و احساس ضعف دارم.','I feel nauseous and dizzy.','حالت تهوع و سرگیجه دارم.'],
    ['بله، لطفاً. سرگیجه دارم.','Yes, please. I have a stomachache.','بله، لطفاً. دل‌درد دارم.']
  ],
  19:[
    ['پدرم بنا است.','My father drives a bus.','پدرم رانندهٔ اتوبوس است.'],
    ['بنا خانه می‌سازد.','A builder works on houses.','بنا روی ساخت خانه‌ها کار می‌کند.'],
    ['نه، مکانیک ماشین تعمیر می‌کند.','No, a chef cooks food.','نه، آشپز غذا می‌پزد.'],
    ['معلم در مدرسه کار می‌کند.','A teacher teaches students.','معلم به دانش‌آموزان درس می‌دهد.']
  ],
  20:[
    ['دو سیب و یک بطری شیر لازم دارم.','I need bread, cheese and water.','نان، پنیر و آب لازم دارم.'],
    ['هشت دلار است.','It is ten dollars, but the red one is cheaper.','ده دلار است، ولی مدل قرمز ارزان‌تر است.'],
    ['بله، این پیراهن کوچک است.','Yes, we have a smaller one.','بله، یک مدل کوچک‌تر داریم.'],
    ['بله، می‌توانی آن را پرو کنی.','Of course. The fitting room is over there.','البته. اتاق پرو آنجاست.']
  ],
  21:[
    ['بله، این هم صورت‌حساب شما.','Of course. Your bill is on the table.','البته. صورت‌حساب شما روی میز است.'],
    ['جمع کل ده دلار است.','The total is fifteen dollars.','جمع کل پانزده دلار است.'],
    ['کارت، لطفاً.','Cash, please.','نقدی، لطفاً.'],
    ['بله، لطفاً رسید می‌خواهم.','No, thank you. I do not need a receipt.','نه، ممنون. رسید لازم ندارم.'],
    ['ده دلار بقیهٔ پول می‌گیرید.','You get five dollars in change.','پنج دلار بقیهٔ پول می‌گیرید.']
  ],
  22:[
    ['پارک نزدیک بازار است.','The park is on the map, near the cafe.','پارک روی نقشه، نزدیک کافه است.'],
    ['بله، بیمارستان نزدیک مدرسه است.','Yes, there is a hospital on the west side.','بله، در سمت غرب شهر بیمارستان هست.'],
    ['سوپرمارکت کنار پارک است.','There is a market near the park.','نزدیک پارک یک فروشگاه هست.'],
    ['در نانوایی سر نبش.','At the bakery near the school.','در نانوایی نزدیک مدرسه.']
  ],
  23:[
    ['مستقیم برو و بعد به راست بپیچ.','Go straight for two blocks and turn left.','دو بلوک مستقیم برو و بعد به چپ بپیچ.'],
    ['کنار بانک به چپ بپیچ.','Walk past the bank and turn right.','از بانک رد شو و به راست بپیچ.'],
    ['بله، سر نبش است.','Yes, it is across the street.','بله، آن سوی خیابان است.'],
    ['بله، بااحتیاط از خیابان عبور کن.','No, stay on this side of the street.','نه، همین سمت خیابان بمان.']
  ],
  24:[
    ['با اتوبوس به مدرسه می‌روم.','I walk to school every day.','هر روز پیاده به مدرسه می‌روم.'],
    ['کرایهٔ اتوبوس دو دلار است.','It is three dollars for one ticket.','برای یک بلیت سه دلار است.'],
    ['بله، به شهر می‌رود.','No, take the next train, please.','نه، لطفاً سوار قطار بعدی شوید.'],
    ['در ایستگاه بعدی پیاده شو.','Get off at the station near the park.','در ایستگاه نزدیک پارک پیاده شو.']
  ]
};
