/** В Script Properties задать SPREADSHEET_ID. Разворачивать как web app. */
const LEAD_HEADERS = ['request_id','created_at','name','phone','email','course','start_month','utm_source','utm_medium','utm_campaign','utm_content','status'];
function jsonResult(value){return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);}
function validateLead(input){
  const p={};
  for(const key of LEAD_HEADERS){if(key==='created_at'||key==='status')continue;p[key]=String(input[key]||'').trim();if(p[key].length>200)throw new Error('invalid_'+key);}
  if(!/^REQ-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.request_id))throw new Error('invalid_request_id');
  if(p.name.length<2||p.name.length>60)throw new Error('invalid_name');
  if(!/^\+7\d{10}$/.test(p.phone))throw new Error('invalid_phone');
  if(p.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))throw new Error('invalid_email');
  if(!['barista_basic','latte_art','alternative','corporate'].includes(p.course))throw new Error('invalid_course');
  if(!['dec_2026','jan_2027','feb_2027'].includes(p.start_month))throw new Error('invalid_start_month');
  if(String(input.consent)!=='true')throw new Error('consent_required');
  ['utm_source','utm_medium','utm_campaign','utm_content'].forEach((key,i)=>{if(!p[key])p[key]=['direct','none','not_set','not_set'][i];});
  return p;
}
function safeCell(value){return /^[=+\-@\t\r\n]/.test(value)?"'"+value:value;}
function getLeadBook(){
  const id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');if(!id)throw new Error('configuration');
  return SpreadsheetApp.openById(id);
}
function doPost(e){
  let lock;
  try{
    const input=e&&e.parameter||{};
    const p=validateLead(input);
    lock=LockService.getScriptLock();if(!lock.tryLock(20000))return jsonResult({ok:false,error:'busy'});
    const sheet=getLeadBook().getSheetByName('leads');if(!sheet)throw new Error('configuration');
    if(sheet.getRange(1,1,1,LEAD_HEADERS.length).getValues()[0].join('|')!==LEAD_HEADERS.join('|'))throw new Error('configuration');
    const count=sheet.getLastRow()-1;
    if(count>0&&sheet.getRange(2,1,count,1).createTextFinder(p.request_id).matchEntireCell(true).findNext())return jsonResult({ok:false,error:'duplicate'});
    const row=LEAD_HEADERS.map(k=>k==='created_at'?new Date():k==='status'?'new':safeCell(p[k]));
    sheet.getRange(sheet.getLastRow()+1,1,1,row.length).setValues([row]);SpreadsheetApp.flush();
    return jsonResult({ok:true,request_id:p.request_id});
  }catch(error){
    const code=String(error.message||'');
    return jsonResult({ok:false,error:/^(invalid_|consent_required)/.test(code)?code:'server'});
  }finally{if(lock&&lock.hasLock())lock.releaseLock();}
}
/** Выполнить один раз перед публикацией. Повтор не стирает обращения. */
function setupWorkbook(){
  const book=getLeadBook();book.setSpreadsheetTimeZone('Europe/Moscow');
  let sheet=book.getSheetByName('leads');if(!sheet)sheet=book.insertSheet('leads');
  if(sheet.getLastRow()>0&&sheet.getRange(1,1,1,12).getValues()[0].join('|')!==LEAD_HEADERS.join('|'))throw new Error('Unexpected headers; no changes made');
  sheet.getRange(1,1,1,12).setValues([LEAD_HEADERS]).setFontWeight('bold');sheet.setFrozenRows(1);
  sheet.getRange('A:A').setNumberFormat('@');sheet.getRange('D:E').setNumberFormat('@');sheet.getRange('B:B').setNumberFormat('yyyy-mm-dd hh:mm:ss');
  for(const [col,list]of [[6,['barista_basic','latte_art','alternative','corporate']],[7,['dec_2026','jan_2027','feb_2027']],[12,['new','contacted','prepaid','paid','lost']]]){
    sheet.getRange(2,col,sheet.getMaxRows()-1,1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(list,true).setAllowInvalid(false).build());
  }
  sheet.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND($A2<>"",COUNTIF($A$2:$A,$A2)>1)').setBackground('#ffc9c9').setRanges([sheet.getRange('A2:L')]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND($A2<>"",OR($B2="",$C2="",$D2="",$F2="",$G2="",$H2="",$I2="",$J2="",$K2="",$L2=""))').setBackground('#fff0bd').setRanges([sheet.getRange('A2:L')]).build()
  ]);
  if(!book.getSheetByName('crm_import'))book.insertSheet('crm_import');
  if(!book.getSheetByName('status_map')){const m=book.insertSheet('status_map');m.getRange(1,1,6,2).setValues([['status','stage'],['new','New lead'],['contacted','Contacted'],['prepaid','Prepaid'],['paid','Closed won'],['lost','Closed lost']]);}
}
