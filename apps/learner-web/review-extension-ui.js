/** DOM-free panels for lesson-sourced cards and observable progress. */
import { lessonReviewCandidates } from './lesson-review.js';
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderLessonReviewPanel({lessonId,bank,pinnedIds=[]}={}){
  const words=lessonReviewCandidates(bank,lessonId);
  const pinned=new Set(pinnedIds);
  return `<details class="tv-l-lesson-panel"><summary><span>ارسال واژه و عبارت به لایتنر</span><span class="tv-l-lesson-count">${words.length} واژه این درس</span></summary>
    <p>واژه‌های درس از بانک مشترک انتخاب می‌شوند. مورد انتخابی در ظرفیت بعدی مرور، در اولویت قرار می‌گیرد.</p>
    <div class="tv-l-lesson-words">${words.length ? words.map(w=>`<div class="tv-l-lesson-word"><span><b dir="ltr" lang="en">${h(w.target)}</b><small>${h(w.meaning)}</small></span><button type="button" data-pin-review="${h(w.id)}" ${pinned.has(w.id)?'disabled':''}>${pinned.has(w.id)?'در اولویت مرور':'افزودن به مرور'}</button></div>`).join('') : '<p>در این درس هنوز مدخل مستقلی برای بانک واژگان ثبت نشده است.</p>'}</div>
    <form data-lesson-card-form class="tv-l-custom-form"><strong>افزودن عبارت یا جمله از همین درس</strong><label>عبارت انگلیسی<input name="target" lang="en" dir="ltr" maxlength="180" required placeholder="Example phrase"></label><label>معنی فارسی<input name="meaning" maxlength="250" required placeholder="معنی عبارت"></label><button class="secondary-btn" type="submit">افزودن عبارت</button></form>
  </details>`;
}
export function summarizeActualReview({reviewState,reviewSummary,lessonSnapshot,historyDates=[],now=new Date()}={}){
  const rawEvents=Array.isArray(reviewState?.history)?reviewState.history:[];
  const dayKeys=new Set(Array.isArray(historyDates)?historyDates:[]);
  for(const e of rawEvents){if(Number.isFinite(Date.parse(e.reviewedAt))) {const d=new Date(e.reviewedAt);dayKeys.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);}}
  let streak=0;const pointer=new Date(now);const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  if(!dayKeys.has(key(pointer)))pointer.setDate(pointer.getDate()-1);
  for(let i=0;i<366&&dayKeys.has(key(pointer));i++,pointer.setDate(pointer.getDate()-1))streak++;
  return {
    lessonsCompleted:lessonSnapshot?.completedCount||0,lessonsAvailable:lessonSnapshot?.availableCount||0,
    percent:lessonSnapshot?.percent||0,due:reviewSummary?.due||0,remainingToday:reviewSummary?.remainingToday||0,
    introduced:(reviewSummary?.totalWords||0)-(reviewSummary?.unseen||0),totalWords:reviewSummary?.totalWords||0,
    mastered:reviewSummary?.learned||0,reviewEvents:rawEvents.length,streak,
    boxes:reviewSummary?.boxes||{}
  };
}
export function renderActualProgress({metrics}={}){
  const m=metrics||{};
  const boxNames=[0,1,2,4,8,16,32,64];
  return `<section class="tv-l-progress" aria-label="آمار واقعی یادگیری"><div class="tv-l-progress-grid">
    <div><span>درس تکمیل‌شده</span><strong>${m.lessonsCompleted||0} / ${m.lessonsAvailable||0}</strong><small>${m.percent||0}٪ از درس‌های آماده</small></div>
    <div><span>مرورهای موعدرسیده</span><strong>${m.due||0}</strong><small>${m.remainingToday||0} کارت در صف امروز</small></div>
    <div><span>مدخل‌های دیده‌شده</span><strong>${m.introduced||0} / ${m.totalWords||0}</strong><small>بانک فعال درس‌ها</small></div>
    <div><span>آموخته‌شده</span><strong>${m.mastered||0}</strong><small>واژه‌های خانه ۶۴</small></div>
    <div><span>پاسخ‌های ثبت‌شده</span><strong>${m.reviewEvents||0}</strong><small>بر اساس تاریخچه واقعی لایتنر</small></div>
    <div><span>روزهای متوالی فعالیت</span><strong>${m.streak||0}</strong><small>از مطالعه و مرور ثبت‌شده</small></div>
  </div><section class="tv-l-progress-boxes"><h3>توزیع فعلی واژه‌ها در خانه‌ها</h3><div>${boxNames.map(n=>`<span><b>${n===0?'صفر':n}</b><strong>${m.boxes?.[n]?.total||0}</strong></span>`).join('')}</div></section>
  <p class="tv-l-note">این اعداد از همین مرورگر محاسبه می‌شوند و بین دستگاه‌ها همگام‌سازی نمی‌شوند.</p></section>`;
}
