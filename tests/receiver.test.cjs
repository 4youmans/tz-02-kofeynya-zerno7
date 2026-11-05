const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../apps-script/Code.gs'),'utf8');
let rows=[],release=0;
const sheet={getLastRow:()=>rows.length+1,getRange:(r,c,n,m)=>({getValues:()=>[['request_id','created_at','name','phone','email','course','start_month','utm_source','utm_medium','utm_campaign','utm_content','status']],createTextFinder:value=>({matchEntireCell(){return this;},findNext:()=>rows.some(row=>row[0]===value)?{}:null}),setValues:values=>rows.push(...values)})};
const ctx={ContentService:{createTextOutput:text=>({setMimeType(){return JSON.parse(text);}}),MimeType:{JSON:'json'}},PropertiesService:{getScriptProperties:()=>({getProperty:()=> 'test-book'})},SpreadsheetApp:{openById:()=>({getSheetByName:()=>sheet}),flush(){}},LockService:{getScriptLock:()=>({tryLock:()=>true,hasLock:()=>true,releaseLock(){release++;}})}};
vm.createContext(ctx);vm.runInContext(source,ctx);
const good={request_id:'REQ-00000000-0000-4000-8000-000000000001',name:'Тест приёмника',phone:'+79000000000',email:'',course:'barista_basic',start_month:'dec_2026',consent:'true',utm_source:'instagram',utm_medium:'social',utm_campaign:'barista_dec_2026',utm_content:'bio',status:'paid'};
let passed=0;function test(label,fn){fn();passed++;console.log('PASS',label);}
test('valid request persists and server sets status',()=>{const r=ctx.doPost({parameter:good});assert.equal(r.ok,true);assert.equal(rows.length,1);assert.equal(rows[0][11],'new');assert.equal(rows[0][7],'instagram');});
test('duplicate rejected without another row',()=>{const r=ctx.doPost({parameter:good});assert.equal(r.error,'duplicate');assert.equal(rows.length,1);});
for(const [key,value]of [['name','А'],['name','x'.repeat(61)],['phone','123'],['email','bad@'],['course','other'],['start_month','unknown'],['request_id','bad'],['consent','false'],['utm_content','x'.repeat(201)]])test('invalid '+key+' rejected',()=>{assert.equal(ctx.doPost({parameter:{...good,[key]:value}}).ok,false);assert.equal(rows.length,1);});
test('missing request rejected',()=>assert.equal(ctx.doPost({}).ok,false));
test('empty source defaults',()=>{const p=ctx.validateLead({...good,utm_source:'',utm_medium:'',utm_campaign:'',utm_content:''});assert.equal(p.utm_source,'direct');assert.equal(p.utm_medium,'none');assert.equal(p.utm_campaign,'not_set');});
test('spreadsheet formula protected',()=>assert.equal(ctx.safeCell('=IMPORTXML("x")'),'\'=IMPORTXML("x")'));
test('lock released on duplicate and success',()=>assert.equal(release,2));
const analytics=fs.readFileSync(path.join(__dirname,'../js/analytics.js'),'utf8');
function browser(url,saved){const store=new Map(saved?[['zerno_utm',JSON.stringify(saved)]]:[]),events=[];const window={ZERNO_CONFIG:{measurementId:''}},document={addEventListener(){},dispatchEvent(e){events.push(e.detail);},head:{append(){}}};const c={window,document,location:{href:url},sessionStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},URL,CustomEvent:class{constructor(n,o){this.detail=o.detail;}}};vm.createContext(c);vm.runInContext(analytics,c);return {window,store,events};}
test('UTM captured from landing',()=>{const b=browser('https://site.example/?utm_source=instagram&utm_medium=social&utm_campaign=test&utm_content=bio');assert.equal(b.window.ZernoAttribution.utm_source,'instagram');});
test('internal navigation retains source',()=>{const b=browser('https://site.example/contacts.html',{utm_source:'vk',utm_medium:'social',utm_campaign:'test',utm_content:'post'});assert.equal(b.window.ZernoAttribution.utm_source,'vk');});
test('direct defaults',()=>assert.equal(browser('https://site.example/').window.ZernoAttribution.utm_source,'direct'));
test('tracking whitelist excludes contact data',()=>{const b=browser('https://site.example/');b.window.ZernoTrack('generate_lead',{lead_course:'latte_art',lead_source:'vk',phone:'secret',name:'secret'});assert.equal(Object.keys(b.events[0].params).length,2);assert.equal(b.events[0].params.phone,undefined);});
console.log(`${passed} checks passed. This does not verify Google deployment or CORS.`);
