/** DOM-free HTML presenters. State transitions live in leitner-engine.js. */
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const english=v=>`<span dir="ltr" lang="en" class="en">${h(v)}</span>`;
const tag=(name,children)=>`<span class="tv-l-tag">${h(name)}: ${english(children)}</span>`;
const posNames={noun:'اسم',verb:'فعل',adjective:'صفت',adverb:'قید',pronoun:'ضمیر',preposition:'حرف اضافه',conjunction:'حرف ربط',interjection:'حرف ندا',determiner:'تعیین‌کننده',unknown:'واژه'};
const formTitles={plural:'جمع',comparative:'تفضیلی',superlative:'عالی',verbForms:'صرف فعل'};
function morph(word,settings){
  const forms=word.forms||{};
  const items=[];
  for(const [key,label] of Object.entries(formTitles)){
    if(settings?.forms?.[key]===false)continue;
    const value=forms[key];
    if(!value)continue;
    const values=(Array.isArray(value)?value:[value]).filter(Boolean);
    if(values.length)items.push(tag(label,values.join(' · ')));
  }
  return items.length?`<div class="tv-l-morph"><span class="tv-l-section-name">شکل‌های همین واژه</span><div class="tv-l-tags">${items.join('')}</div></div>`:'';
}
function relations(word){
  if(!word.relations?.length)return '';
  const labels={synonym:'هم‌معنی',antonym:'متضاد',family:'هم‌خانواده',topic:'هم‌موضوع',partOf:'جزء',related:'مرتبط'};
  return `<div class="tv-l-rel"><span class="tv-l-section-name">واژه‌های مرتبط</span><div class="tv-l-tags">${word.relations.map(r=>tag(labels[r.type]||r.type,r.target||r.id)).join('')}</div></div>`;
}
export function renderLeitner({state,bank,summary,pending}){
  const queue=state.day.queue||[];
  const current=bank.entries.find(e=>e.id===queue[0]);
  const settings=state.settings;
  const boxes=[0,1,2,4,8,16,32,64].map(n=>{
    const c=summary.boxes[n]||{total:0,due:0};
    return `<div class="tv-l-box ${n===64?'finished':''}"><strong>${n===0?'صفر':n===64?'۶۴':n}</strong><span>${n===0?'در حال یادگیری':n===64?'یادگرفته‌شده':n+' روز'}</span><small>${c.total} کارت${n>0&&n<64?` · ${c.due} موعددار`:''}</small></div>`;
  }).join('');
  let card='';
  if(current){
    const revealed=!!pending && pending.id===current.id;
    const targetFirst=settings.direction==='target-first';
    const prompt=targetFirst?current.target:current.meaning;
    const other=targetFirst?current.meaning:current.target;
    const speak=settings.tts && (targetFirst || revealed)?`<button class="tv-l-speak" data-speak="${h(current.target)}" aria-label="شنیدن تلفظ ${h(current.target)}" title="تلفظ">◖))</button>`:'';
    card=`<section class="tv-l-card" aria-label="کارت جاری">
      <header class="tv-l-card-head"><span>${(current.partsOfSpeech||[]).map(p=>h(posNames[p?.toLowerCase()]||p)).join(' · ')}</span>${speak}${current.sources?.[0]?.lessonId ? `<button class="tv-l-source-link" data-open-lesson="${h(current.sources[0].lessonId)}" title="بازگشت به درس">${h(current.sources[0].lessonId)} · منبع</button>` : '<small>بانک لغات</small>'}</header>
      <div class="tv-l-card-center"><span class="tv-l-label">${targetFirst?'واژه انگلیسی':'معنی فارسی'}</span><h2 ${targetFirst?'dir="ltr" lang="en"':''}>${h(prompt)}</h2>
      ${revealed?`<div class="tv-l-reveal"><span>پاسخ</span><strong ${targetFirst?'':'dir="ltr" lang="en"'}>${h(other)}</strong></div>`:`<p class="tv-l-help">قبل از دیدن پاسخ، حدست را مشخص کن.</p>`}</div>
      ${revealed?`${current.example?`<p class="tv-l-example">${english(current.example)}</p>`:''}${morph(current,settings)}${relations(current)}
        <div class="tv-l-answer"><button class="tv-l-pass" data-action="leitner-correct">حدس درست</button><button class="tv-l-fail" data-action="leitner-wrong">اشتباه کردم</button></div>`:
        `<div class="tv-l-answer"><button class="tv-l-pass" data-action="leitner-known">بلدم</button><button class="tv-l-fail" data-action="leitner-unknown">بلد نیستم</button></div>`}
    </section>`;
  }else {
    card=`<div class="tv-l-empty" role="status"><h2>مرور امروز تمام شد</h2><p>کارت‌های خانه صفر تا پاسخ صحیح تکرار شدند. مرورهای بعدی در موعد خود ظاهر می‌شوند.</p><button class="secondary-btn" data-nav="lessons">رفتن به درس‌ها</button></div>`;
  }
  return `<div class="tv-l-page"><div class="tv-l-header"><div><span class="tv-kicker">تمرین فاصله‌دار</span><h1>لایتنر</h1><p>اول موعدهای قبلی؛ بعد واژه‌های جدید تا سقف روزانه.</p></div><button class="outline-btn" data-action="open-wordbank">بانک لغات (${summary.totalWords})</button></div>
    <div class="tv-l-counters"><span><strong>${summary.remainingToday}</strong> کارت باقی‌مانده امروز</span><span><strong>${summary.admitted}/${summary.limit}</strong> سهمیه امروز</span><span><strong>${summary.learned}</strong> آموخته‌شده</span></div>
    <div class="tv-l-main">${card}</div>
    <section class="tv-l-boxes" aria-label="وضعیت خانه‌های لایتنر">${boxes}</section>
    <p class="tv-l-note">خانه ۶۴ نهایی است و مرور اجباری ندارد. داده‌ها در همین مرورگر ذخیره می‌شوند.</p>
  </div>`;
}
export function renderLeitnerSettings({settings,summary}){
  const forms=[['plural','جمع اسم'],['comparative','صفت تفضیلی'],['superlative','صفت عالی'],['verbForms','شکل‌های فعل']];
  return `<div class="tv-l-settings">
    <label><span>سقف کارت‌های متفاوت روزانه</span><input type="number" min="1" max="200" step="1" data-leitner-setting="dailyLimit" value="${h(settings.dailyLimit)}" aria-label="سقف روزانه کارت‌ها"></label>
    <label><span>سمت اول کارت</span><select data-leitner-setting="direction"><option value="target-first" ${settings.direction==='target-first'?'selected':''}>اول انگلیسی</option><option value="meaning-first" ${settings.direction==='meaning-first'?'selected':''}>اول فارسی</option></select></label>
    <label class="tv-l-checkbox"><span>تلفظ TTS</span><input type="checkbox" data-leitner-setting="tts" ${settings.tts?'checked':''}></label>
    <label class="tv-l-checkbox"><span>تلفظ خودکار کارت جدید</span><input type="checkbox" data-leitner-setting="autoSpeak" ${settings.autoSpeak?'checked':''} ${settings.tts?'':'disabled'}></label>
    <div class="tv-l-grammar-settings"><span>شکل‌های دستوری روی کارت</span>${forms.map(([key,label])=>`<label class="tv-l-checkbox"><span>${label}</span><input type="checkbox" data-leitner-form="${key}" ${settings.forms?.[key]?'checked':''}></label>`).join('')}</div>
    <p class="tv-l-note">${summary.totalWords} واژه در بانک · ${summary.learned} واژه در خانه ۶۴. تغییر جهت فقط روی عبارت اصلی کارت اثر می‌گذارد.</p>
    <button class="secondary-btn" data-nav="leitner">شروع مرور</button>
  </div>`;
}
export function renderWordBank({bank,reviewState}){
  const count=bank.entries.length;
  return `<div class="tv-l-page"><header class="tv-l-header"><div><span class="tv-kicker">برگرفته از درس‌ها</span><h1>بانک لغات</h1><p>${count} مدخل یکتا؛ بدون تکرار صفت تفضیلی، جمع و سایر صورت‌های یک واژه.</p></div><button class="outline-btn" data-nav="leitner">بازگشت به لایتنر</button></header>
  <div class="tv-l-search"><label for="tv-bank-search">جست‌وجوی واژه یا معنی</label><input id="tv-bank-search" type="search" placeholder="جست‌وجو در بانک لغات" data-wordbank-filter></div>
  <div class="tv-l-bank-list">${bank.entries.map(word=>`<div class="tv-l-bank-item" data-bank-entry data-search="${h(`${word.target} ${word.meanings?.join(' ')||word.meaning}`.toLowerCase())}">
    <div><strong>${english(word.target)}</strong><span>${h(word.meanings?.join('، ')||word.meaning)}</span><small>${h(word.sources?.[0]?.lessonId||'واژه شخصی')}</small></div><span>${reviewState.cards[word.id]?.box===64?'یادگرفته‌شده':reviewState.cards[word.id]?`خانه ${reviewState.cards[word.id].box}`:'جدید'}</span>
  </div>`).join('')}</div><p class="tv-l-note">روابط معنایی و هم‌خانواده‌ها بعداً به بانک اضافه می‌شوند؛ فعلاً رابطه‌ای حدس زده نشده است.</p></div>`;
}
