/* Все явные события GA4 сосредоточены здесь. Личные данные не передаются. */
(function () {
  'use strict';
  const config = window.ZERNO_CONFIG || {};
  const storage = {get(k){try{return sessionStorage.getItem(k);}catch{return null;}},set(k,v){try{sessionStorage.setItem(k,v);}catch{}}};
  const keys = ['utm_source','utm_medium','utm_campaign','utm_content'];
  const defaults = ['direct','none','not_set','not_set'];
  const url = new URL(location.href);
  let attribution;
  try { attribution = JSON.parse(storage.get('zerno_utm')); } catch {}
  if (!attribution || typeof attribution !== 'object' || Array.isArray(attribution)) attribution = null;
  if (!attribution && keys.some(k => url.searchParams.has(k))) {
    attribution = Object.fromEntries(keys.map((k,i) => [k,(url.searchParams.get(k)||defaults[i]).slice(0,200)]));
    storage.set('zerno_utm',JSON.stringify(attribution));
  }
  window.ZernoAttribution = Object.fromEntries(keys.map((k,i) => [k,String(attribution?.[k] || defaults[i]).slice(0,200)]));
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
  if (/^G-[A-Z0-9]+$/.test(config.measurementId || '')) {
    const tag = document.createElement('script'); tag.async=true;
    tag.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(config.measurementId);
    document.head.append(tag);
    gtag('js',new Date()); gtag('config',config.measurementId);
  }
  const parameters = {
    generate_lead:['lead_course','lead_source'],cta_click:['button_name','page_section'],
    view_course:['course_name'],select_course_date:['course_name','start_date'],
    quiz_complete:['quiz_result'],menu_filter:['filter_value'],bean_view:['bean_name','roast_level'],
    promo_copy:['promo_code'],contact_click:['contact_type'],messenger_click:['messenger'],
    social_click:['network','page_section'],form_error:['field_name','error_type'],
    map_open:['map_service'],gallery_view:['photo_index']
  };
  window.ZernoTrack = function(name,values={}) {
    if (!Object.hasOwn(parameters,name)) return;
    const safe={};
    for(const key of parameters[name]) if(values[key]!=null) safe[key]=String(values[key]).slice(0,100);
    if (/^G-[A-Z0-9]+$/.test(config.measurementId || '')) gtag('event',name,safe);
    document.dispatchEvent(new CustomEvent('zerno:event',{detail:{name,params:safe}}));
  };
  document.addEventListener('click',e=>{
    const el=e.target.closest('[data-event]');
    if(!el || el.disabled) return;
    const name=el.dataset.event, values={};
    for(const key of parameters[name] || []) values[key]=el.dataset[key.replace(/_([a-z])/g,(_,c)=>c.toUpperCase())];
    window.ZernoTrack(name,values);
  });
})();
