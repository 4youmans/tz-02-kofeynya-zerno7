(function(){
  'use strict';
  const form=document.querySelector('#lead-form');if(!form)return;
  const fields=['name','phone','email','course','start_month','consent'];
  const courses=['barista_basic','latte_art','alternative','corporate'],months=['dec_2026','jan_2027','feb_2027'];
  const config=window.ZERNO_CONFIG||{};
  const track=(...args)=>window.ZernoTrack?.(...args);
  const read=(k)=>{try{return sessionStorage.getItem(k);}catch{return null;}};
  const save=(k,v)=>{try{sessionStorage.setItem(k,v);}catch{}};
  const params=new URL(location.href).searchParams;
  for(const [key,allowed] of [['course',courses],['start_month',months]])if(allowed.includes(params.get(key)))form.elements[key].value=params.get(key);
  function uuid(){if(crypto.randomUUID)return crypto.randomUUID();const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const s=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`;}
  let id=read('zerno_pending_id');if(!/^REQ-[0-9a-f-]{36}$/i.test(id||'')){id='REQ-'+uuid();save('zerno_pending_id',id);}
  form.elements.request_id.value=id;
  Object.entries(window.ZernoAttribution||{}).forEach(([k,v])=>{if(form.elements[k])form.elements[k].value=v;});
  for(const key of fields){const el=form.elements[key];el.setAttribute('aria-describedby',key+'-error');el.addEventListener('input',()=>{el.removeAttribute('aria-invalid');document.getElementById(key+'-error').textContent='';});}
  function fail(key,message,type='invalid'){
    const el=form.elements[key];el.setAttribute('aria-invalid','true');document.getElementById(key+'-error').textContent=message;
    track('form_error',{field_name:key,error_type:type});
  }
  form.addEventListener('submit',async e=>{
    e.preventDefault();const button=form.querySelector('button[type=submit]');if(button.disabled)return;
    fields.forEach(k=>{form.elements[k].removeAttribute('aria-invalid');document.getElementById(k+'-error').textContent='';});
    const data=Object.fromEntries(new FormData(form));data.name=data.name.trim();data.email=data.email.trim();
    let digits=data.phone.replace(/\D/g,'');if(digits.length===11&&digits[0]==='8')digits='7'+digits.slice(1);if(digits.length===10)digits='7'+digits;data.phone='+'+digits;
    if(data.name.length<2||data.name.length>60)fail('name','Введите имя от 2 до 60 символов',data.name?'invalid':'required');
    if(!/^\+7\d{10}$/.test(data.phone))fail('phone','Введите телефон: +7 и десять цифр',data.phone==='+'?'required':'invalid');
    if(data.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))fail('email','Проверьте адрес электронной почты');
    if(!courses.includes(data.course))fail('course','Выберите курс');
    if(!months.includes(data.start_month))fail('start_month','Выберите месяц старта');
    if(!form.elements.consent.checked)fail('consent','Для отправки необходимо согласие','required');
    const invalid=form.querySelector('[aria-invalid=true]');if(invalid){invalid.focus();return;}
    const status=document.querySelector('#form-status');
    let endpoint;try{endpoint=new URL(config.leadEndpoint);if(endpoint.protocol!=='https:')throw Error();}catch{
      status.textContent='Онлайн-запись временно недоступна. Свяжитесь с нами по телефону.';
      track('form_error',{field_name:'form',error_type:'server'});return;
    }
    button.disabled=true;status.textContent='Отправляем заявку…';
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
    try{
      const response=await fetch(endpoint.href,{method:'POST',body:new URLSearchParams({...data,consent:'true'}),signal:controller.signal,redirect:'follow'});
      if(!response.ok)throw Error('network');const result=await response.json();
      if(result.ok!==true){
        if(result.error==='duplicate')throw Error('duplicate');
        throw Error('server');
      }
      save('zerno_confirmed',JSON.stringify({request_id:id}));
      try{sessionStorage.removeItem('zerno_pending_id');}catch{}
      track('generate_lead',{lead_course:data.course,lead_source:data.utm_source});
      location.assign('thanks.html');
    }catch(error){
      status.textContent=error.message==='duplicate'?'Этот номер уже зарегистрирован. Свяжитесь с нами, чтобы уточнить заявку.':'Не удалось подтвердить регистрацию. Проверьте связь и повторите отправку или позвоните нам.';
      track('form_error',{field_name:'form',error_type:'server'});
    }finally{clearTimeout(timeout);button.disabled=false;}
  });
})();
