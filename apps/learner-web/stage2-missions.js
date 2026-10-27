/* Contextual activities for A1.2. The prompts, places, prices and answers live in lesson JSON. */
const cap = (n, max) => Math.max(0, Math.min(max, Number(n) || 0));
const keyFor = (a, c) => `${c.lessonId}:${a.id}`;
const button = (key, action, value, label, classes = '', disabled = false) =>
  `<button type="button" class="${classes}" data-mission-key="${key}" data-mission-action="${action}" data-mission-value="${value}" ${disabled ? 'disabled' : ''}>${label}</button>`;

export function reduceStage2Mission(activity, state = {}, action, value) {
  const s = structuredClone(state);
  const scenes = activity.scenes || activity.missions || [];
  const round = cap(s.round, Math.max(0, scenes.length - 1));
  const scene = scenes[round];
  if (!scene) return s;
  if (action === 'reset') return { round, cart: {}, path: [] };
  if (action === 'next') {
    if (!s.solved || (activity.checkout && !s.paid) || round >= scenes.length - 1) return s;
    return { round: round + 1, cart: {}, path: [] };
  }
  if (activity.mode === 'basket') {
    const product = scene.products?.find(p => p.id === value);
    if (['add', 'remove'].includes(action) && product && !s.paid) {
      const count = Number(s.cart?.[value] || 0);
      s.cart = { ...s.cart, [value]: Math.max(0, Math.min(9, count + (action === 'add' ? 1 : -1))) };
      s.solved = false; s.checked = false; s.paid = false;
      return s;
    }
    if (action === 'check') {
      s.checked = true;
      s.solved = scene.products.every(p => Number(s.cart?.[p.id] || 0) === Number(p.need || 0));
      return s;
    }
    if (action === 'method' && s.solved && ['cash','card'].includes(value)) { s.method = value; return s; }
    if (action === 'pay' && s.solved && s.method) { s.paid = true; return s; }
    return s;
  }
  if (activity.mode === 'route') {
    if (action !== 'move' || s.solved) return s;
    const path = s.path || [],delta={north:[0,-1],south:[0,1],west:[-1,0],east:[1,0]}[value];
    if (!delta) return s;
    const point=path.reduce((p,step)=>{
      const d={north:[0,-1],south:[0,1],west:[-1,0],east:[1,0]}[step];return{x:p.x+d[0],y:p.y+d[1]};
    },scene.start);
    const next={x:point.x+delta[0],y:point.y+delta[1]};
    if(next.x<0||next.x>4||next.y<0||next.y>4){s.wrong=true;return s;}
    s.path=[...path,value];s.wrong=false;
    s.solved=next.x===scene.end.x&&next.y===scene.end.y;
    return s;
  }
  if (action === 'choose' && !s.solved) {
    if (!(scene.options || (activity.mode === 'city' ? activity.places : []) || []).some(entry => entry.id === value)) return s;
    s.answer = value;
    s.solved = value === scene.correct;
  }
  return s;
}

function sceneHeader(scene, round, length, e) {
  return `<div class="mission-top"><span>مأموریت ${round + 1} از ${length}</span><strong>${e(scene.topic || scene.title || '')}</strong></div>`;
}
function missionFooter(scene, state, key, atEnd, e, canAdvance = true) {
  const correct = state.solved;
  const feedback = state.answer || state.checked || state.wrong || state.path?.length
    ? `<p class="mission-feedback ${correct ? 'is-correct' : state.wrong || state.answer || state.checked ? 'is-wrong' : ''}" role="status">${correct ? e(scene.successFa || 'درست پیدا کردی؛ حالا جملهٔ کاربردی را ببین.') : state.wrong || state.answer || state.checked ? e(scene.retryFa || 'به معنی سؤال و اطلاعات تصویر نگاه کن و دوباره امتحان کن.') : 'مسیرت را ادامه بده.'}</p>` : '';
  const sentence = correct ? `<div class="mission-bilingual"><p lang="en" dir="ltr">${e(scene.successEn || '')}</p><p>${e(scene.successFa || '')}</p></div>` : '';
  const next = correct && canAdvance && !atEnd ? button(key,'next','','مأموریت بعدی ←','secondary-btn') : '';
  const done = correct && canAdvance && atEnd ? '<p class="mission-finished">✓ همهٔ موقعیت‌ها را حل کردی. اکنون همان مهارت را در یک جملهٔ تازه به کار ببر.</p>' : '';
  return `${feedback}${sentence}<div class="mission-next">${next}${done}</div>`;
}
function pairMission(a, c, state, key) {
  const e=c.e,round=cap(state.round,a.scenes.length-1),scene=a.scenes[round];
  const cards=scene.options.map(item=>{
    const active=state.answer===item.id,kind=active?(state.solved?'is-correct':'is-wrong'):'';
    return button(e(key),'choose',e(item.id),`<span class="mission-visual" style="--swatch:${e(item.color||'#eef4f0')}">${e(item.emoji||'◉')}</span><strong lang="en">${e(item.en)}</strong><small>${e(item.fa||'')}</small>`,`mission-picture-choice ${kind}`);
  }).join('');
  return `${sceneHeader(scene,round,a.scenes.length,e)}<p class="mission-instruction">${e(scene.prompt)}</p><div class="mission-picture-grid">${cards}</div>${missionFooter(scene,state,e(key),round===a.scenes.length-1,e)}`;
}
function cityMap(a,c,scene,state,key,mode) {
  const e=c.e;
  const allPlaces=a.places||[];
  const routePoints=mode==='route'?(state.path||[]).reduce((points,step)=>{
    const last=points.at(-1),delta={north:[0,-1],south:[0,1],west:[-1,0],east:[1,0]}[step];
    return[...points,{x:last.x+delta[0],y:last.y+delta[1]}];
  },[scene.start]):[];
  const grid=Array.from({length:25},(_,index)=>{
    const x=index%5,y=Math.floor(index/5),place=allPlaces.find(p=>p.x===x&&p.y===y);
    // City recognition is a Persian-to-English task; repeating the Persian prompt
    // on every map pin would make the interaction a simple matching exercise.
    const label=place?`<span class="city-icon">${e(place.emoji||'📍')}</span><small ${mode==='city'?'lang="en" dir="ltr"':''}>${e(mode==='city'?place.en:place.fa)}</small>`:'<span class="city-cross">＋</span>';
    const placed=mode==='route' ? '' : place?.id;
    const active=state.answer===placed,solved=active&&state.solved;
    const marker=mode==='route' ? (routePoints.at(-1).x===x&&routePoints.at(-1).y===y?'city-current':routePoints.some(p=>p.x===x&&p.y===y)?'city-visited':scene.end.x===x&&scene.end.y===y?'city-goal':'') : '';
    const clickable=mode!=='route' && !!place;
    return clickable?button(e(key),'choose',e(placed),label,`city-map-cell city-place ${solved?'is-correct':active?'is-wrong':''}`):`<div class="city-map-cell ${marker} ${place?'city-place':''}">${marker==='city-current'?'<span class="city-walker">🚶</span>':label}</div>`;
  }).join('');
  return `<div class="city-map" role="group" aria-label="نقشهٔ قابل تعامل محله؛ پنج ردیف و پنج ستون">${grid}</div>`;
}
function mapMission(a,c,state,key){
  const e=c.e,round=cap(state.round,a.missions.length-1),scene=a.missions[round];
  return `${sceneHeader(scene,round,a.missions.length,e)}<p class="mission-instruction">${e(scene.prompt)}</p>${cityMap(a,c,scene,state,key,'city')}${missionFooter(scene,state,e(key),round===a.missions.length-1,e)}`;
}
function routeMission(a,c,state,key){
  const e=c.e,round=cap(state.round,a.missions.length-1),scene=a.missions[round],steps=scene.steps||[];
  const cursor=(state.path||[]).length,active=!state.solved;
  const dirs=[['north','↑','به شمال / بالای نقشه'],['west','←','به چپ / غرب'],['south','↓','به جنوب / پایین نقشه'],['east','→','به راست / شرق']];
  const actions=dirs.map(([id,arrow,title])=>button(e(key),'move',id,`<b>${arrow}</b><small>${title}</small>`,'route-arrow',!active)).join('');
  const trace=(state.path||[]).map((step,i)=>`${i+1}. ${dirs.find(d=>d[0]===step)?.[2]}`).join(' ← ');
  return `${sceneHeader(scene,round,a.missions.length,e)}<p class="mission-instruction">${e(scene.prompt)}</p>${cityMap(a,c,scene,state,key,'route')}<div class="route-controls"><p>مسیر را خودت بساز؛ راه‌های مختلفی می‌توانند درست باشند. کوتاه‌ترین مسیر ${steps.length} گام است و تو ${cursor} گام برداشته‌ای.</p><div class="route-buttons">${actions}</div><small>${e(trace||'اولین حرکت را انتخاب کن.')}</small>${button(e(key),'reset','','از ابتدا مسیر را بساز','outline-btn')}</div>${missionFooter(scene,state,e(key),round===a.missions.length-1,e)}`;
}
function basketMission(a,c,state,key){
  const e=c.e,round=cap(state.round,a.scenes.length-1),scene=a.scenes[round],cart=state.cart||{};
  const products=scene.products.map(p=>{
    const qty=Number(cart[p.id]||0);
    return `<div class="basket-product"><span>${e(p.emoji||'🛒')}</span><div><strong lang="en">${e(p.en)}</strong><small>${e(p.fa)} · $${Number(p.price)}</small></div><div class="basket-quantity">${button(e(key),'remove',e(p.id),'−','outline-btn',qty<=0||state.paid)}<b>${qty}</b>${button(e(key),'add',e(p.id),'+','outline-btn',qty>=9||state.paid)}</div></div>`;
  }).join('');
  const total=scene.products.reduce((sum,p)=>sum+(Number(cart[p.id]||0)*Number(p.price)),0);
  const list=scene.products.filter(p=>p.need).map(p=>`<li><b>${p.need} × ${e(p.en)}</b><span>${e(p.fa)}</span></li>`).join('');
  const check=button(e(key),'check','','فهرست را با سبد تطبیق بده','secondary-btn',!!state.paid);
  const receipt=a.checkout && state.solved?`<div class="basket-receipt"><strong>RECEIPT · رسید</strong><ol>${scene.products.filter(p=>cart[p.id]).map(p=>`<li>${e(p.en)} × ${cart[p.id]} <span>$${(cart[p.id]*p.price)}</span></li>`).join('')}</ol><p>Total · جمع: <b>$${total}</b></p><div class="basket-method">${button(e(key),'method','cash','نقدی','outline-btn '+(state.method==='cash'?'is-active':''))}${button(e(key),'method','card','کارت','outline-btn '+(state.method==='card'?'is-active':''))}</div>${state.method==='cash'?`<p>اگر $${scene.tender||20} بدهی، باقی‌مانده $${Math.max(0,(scene.tender||20)-total)} است.</p>`:''}${button(e(key),'pay','','پرداخت و دریافت رسید','secondary-btn',!state.method||state.paid)}${state.paid?'<p class="mission-finished">✓ رسید صادر شد؛ قیمت، تعداد و روش پرداخت را به انگلیسی بگو.</p>':''}</div>`:'';
  const canAdvance = !a.checkout || !!state.paid;
  const view = missionFooter(scene,state,e(key),round===a.scenes.length-1,e,canAdvance);
  return `${sceneHeader(scene,round,a.scenes.length,e)}<p class="mission-instruction">${e(scene.prompt)}</p><div class="basket-lab"><div class="basket-shopping-list"><strong>SHOPPING LIST · فهرست خرید</strong><ul>${list}</ul><small>${e(scene.note||'فقط کالاهای مورد نیاز را انتخاب کن؛ تعداد دقیق مهم است.')}</small></div><div class="basket-shelf">${products}</div><div class="basket-summary"><span>Total · $${total}</span>${check}</div></div>${receipt}${view}`;
}

/** Returns only the interactive body. lesson-modules supplies the standard activity wrapper. */
export function renderStage2Mission(a,c){
  const key=keyFor(a,c),saved=c.progress.missionLabStates?.[key]||{},mode=a.mode;
  if(['comparison','wardrobe','body','symptoms','roles','transport'].includes(mode))return pairMission(a,c,saved,key);
  if(mode==='city')return mapMission(a,c,saved,key);
  if(mode==='route')return routeMission(a,c,saved,key);
  if(mode==='basket')return basketMission(a,c,saved,key);
  throw new Error(`Unknown stage-two mission mode ${mode}`);
}
