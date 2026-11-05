(function(){
  'use strict';
  const track=(...args)=>window.ZernoTrack?.(...args);
  const config=window.ZERNO_CONFIG || {};
  const toggle=document.querySelector('.nav-toggle'),nav=document.querySelector('nav');
  toggle?.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);});
  const names={barista_basic:'Бариста с нуля',latte_art:'Латте-арт',alternative:'Альтернативное заваривание',corporate:'Корпоративный мастер-класс'};
  /* Места не указаны в ТЗ. После подтверждения заменить null на актуальное число. */
  const cohorts=[
    {course:'barista_basic',date:'2026-12-02',month:'dec_2026',seats:null},
    {course:'barista_basic',date:'2026-12-16',month:'dec_2026',seats:null},
    {course:'barista_basic',date:'2027-01-13',month:'jan_2027',seats:null},
    {course:'latte_art',date:'2026-12-07',month:'dec_2026',seats:null},
    {course:'latte_art',date:'2027-01-20',month:'jan_2027',seats:null}
  ];
  const dates=document.querySelector('#course-dates');
  if(dates){
    for(const item of cohorts){
      const row=document.createElement('div');row.className='date';
      const label=document.createElement('div');
      label.textContent=names[item.course]+' · '+new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(new Date(item.date+'T12:00:00'));
      const small=document.createElement('small');small.textContent=item.seats===null?'Наличие мест уточняется':`Свободных мест: ${item.seats}`;label.append(small);
      const button=document.createElement('button');button.type='button';button.disabled=item.seats===0;
      button.textContent=item.seats===0?'Мест нет':item.seats===null?'Уточнить и выбрать':'Выбрать поток';
      button.dataset.event='select_course_date';button.dataset.courseName=item.course;button.dataset.startDate=item.date;
      button.addEventListener('click',()=>{location.href='contacts.html?'+new URLSearchParams({course:item.course,start_month:item.month});});
      row.append(label,button);dates.append(row);
    }
    const other=document.createElement('p');other.textContent='Альтернативное заваривание — каждую субботу. Дата корпоративного мастер-класса согласуется при записи.';dates.append(other);
  }
  document.querySelector('#quiz')?.addEventListener('submit',e=>{
    e.preventDefault();const data=new FormData(e.currentTarget), scores=[0,0,0,0];
    for(let i=0;i<4;i++){const answer=data.get('q'+i);if(answer===null)return;scores[Number(answer)]++;}
    const key=Object.keys(names)[scores.indexOf(Math.max(...scores))];
    const result=document.querySelector('#quiz-result');result.replaceChildren();
    const p=document.createElement('p');p.textContent='Вам подойдёт курс «'+names[key]+'».';
    const a=document.createElement('a');a.className='btn';a.href='contacts.html?course='+key;a.textContent='Записаться на этот курс';
    Object.assign(a.dataset,{event:'cta_click',buttonName:'quiz_result',pageSection:'quiz'});result.append(p,a);
    track('quiz_complete',{quiz_result:key});
  });
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
    let visible=0;
    document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    document.querySelectorAll('[data-categories]').forEach(row=>{row.hidden=button.dataset.filter!=='all'&&!row.dataset.categories.split(' ').includes(button.dataset.filter);if(!row.hidden)visible++;});
    document.querySelector('#menu-empty').hidden=visible>0;
    track('menu_filter',{filter_value:button.dataset.filter});
  }));
  document.querySelector('#copy-promo')?.addEventListener('click',async()=>{
    const status=document.querySelector('#promo-status');
    try{await navigator.clipboard.writeText('LATTE10');status.textContent='Промокод скопирован';track('promo_copy',{promo_code:'LATTE10'});}
    catch{status.textContent='Скопируйте вручную: LATTE10';}
  });
  const dialog=document.querySelector('#gallery-dialog');
  document.querySelectorAll('[data-photo]').forEach(button=>button.addEventListener('click',()=>{
    const source=button.querySelector('img'),image=dialog.querySelector('img');image.src=source.src;image.alt=source.alt;dialog.showModal();
    track('gallery_view',{photo_index:button.dataset.photo});
  }));
  document.querySelector('[data-close-dialog]')?.addEventListener('click',()=>dialog.close());
  const socials={instagram:'Instagram',vk:'ВКонтакте',telegram:'Telegram',youtube:'YouTube'};
  for(const container of document.querySelectorAll('[data-social-links]')){
    for(const [key,name]of Object.entries(socials)){
      let url;try{url=new URL(config.social?.[key]);if(url.protocol!=='https:')continue;}catch{continue;}
      const a=document.createElement('a');a.href=url.href;a.textContent=name;a.target='_blank';a.rel='noopener';Object.assign(a.dataset,{event:'social_click',network:key,pageSection:container.dataset.pageSection});container.append(a);
    }
  }
  for(const container of document.querySelectorAll('[data-messenger-links]')){
    for(const [key,name]of Object.entries({telegram:'Telegram',whatsapp:'WhatsApp'})){
      let url;try{url=new URL(config.messengers?.[key]);if(url.protocol!=='https:')continue;}catch{continue;}
      const a=document.createElement('a');a.className='btn outline';a.href=url.href;a.textContent=name;Object.assign(a.dataset,{event:'messenger_click',messenger:key});container.append(a);
    }
  }
  const thanks=document.querySelector('#thanks-content');
  if(thanks){let saved;try{saved=JSON.parse(sessionStorage.getItem('zerno_confirmed'));}catch{}
    if(saved && /^REQ-[0-9a-f-]{36}$/i.test(saved.request_id)){
      const p=document.createElement('p');p.className='request-number';p.textContent=saved.request_id;
      const next=document.createElement('p');next.textContent='Заявка зарегистрирована. Мы позвоним в течение часа, чтобы уточнить обучение.';thanks.replaceChildren(p,next);
    }
  }
})();
