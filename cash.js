/* 工事別の請求・支払予定と実入出金を分けて保存する。 */
(() => {
'use strict';
const el=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const yen=value=>Number(value).toLocaleString('ja-JP');
let incomes=[{name:'御請求書',amount:'330000',method:'振込',invoice:'',due:'',actual:'',note:''}];
let payments=[
 {vendor:'リンナイ',budget:187000,amount:'',completed:'',due:'',actual:'',note:''},
 {vendor:'岡山設備',budget:55000,amount:'',completed:'',due:'',actual:'',note:''},
 {vendor:'岡山クリーン',budget:11000,amount:'',completed:'',due:'',actual:'',note:''}
];
const jobId=new URLSearchParams(location.search).get('id');let fingerprint=null,loadedJob=null;
if(jobId){try{const data=window.cashStore.open(JSON.parse(window.appStorage.getItem(window.cashStore.KEY)),jobId);incomes=data.incomes;if(!incomes.length)incomes.push({id:crypto.randomUUID(),name:'',amount:'',method:'',invoice:'',due:'',actual:'',note:'',completionInvoice:false});payments=data.payments;fingerprint=data.fingerprint;loadedJob=data.job;document.querySelector('.eyebrow').textContent=(window.cloudRuntime?.jobNo||loadedJob.id)+' ／ '+loadedJob.name;document.querySelector('.prototype-note').textContent='変更は「保存」でこのブラウザに保存します。';const rate=loadedJob.taxRate??10;document.querySelectorAll('.summaries>div').forEach((block,i)=>{if(i<2){const net=i===0?loadedJob.contract:loadedJob.budget;const tax=net==null?null:Math.floor(net*rate/100);const vals=block.querySelectorAll('dd');[net,tax,net==null?null:net+tax].forEach((v,j)=>vals[j].textContent=v==null?'—':yen(v));}});}catch(err){el('status').textContent=err.message;document.querySelectorAll('button').forEach(b=>b.disabled=true);throw err;}}
const saveButton=document.createElement('button');saveButton.textContent='入金・支払を保存';saveButton.id='save-cash';saveButton.style.cssText='display:block;margin:20px 0 10px auto;padding:12px 20px;background:#2e5f87;color:white;border:0;border-radius:4px';el('status').before(saveButton);saveButton.hidden=!jobId;let saving=false;
async function saveCash(){if(!jobId)return false;if(saving)return false;saving=true;saveButton.disabled=true;const inputCopy=structuredClone(incomes),paymentCopy=structuredClone(payments),controls=[...document.querySelectorAll('main input,main select,main button')].map(e=>[e,e.disabled]);for(const[e]of controls)e.disabled=true;let success=false;const work=async()=>{try{if(window.cloudRuntime)await window.cloudRuntime.checkAccess();const latest=JSON.parse(window.appStorage.getItem(window.cashStore.KEY));const result=window.cashStore.save(latest,jobId,inputCopy,paymentCopy,fingerprint);window.appStorage.setItem(window.cashStore.KEY,JSON.stringify(result.db));if(window.cloudRuntime)await window.cloudRuntime.flush();fingerprint=result.fingerprint;loadedJob=result.db.jobs.find(j=>j.id===jobId);el('status').textContent='入金・支払を保存しました。';success=true;}catch(err){el('status').textContent=err.message;}};try{if(navigator.locks)await navigator.locks.request('construction-demo-write',work);else await work();}finally{for(const[e,disabled]of controls)e.disabled=disabled;saving=false;saveButton.disabled=false;}return success;}
saveButton.onclick=saveCash;
function input(group,index,key,label,type='text',extra='') {
 const row=group==='income'?incomes[index]:payments[index];
 const hint=group==='income'?({amount:'今回請求する金額',invoice:'請求書に記載する請求日',due:'請求書に記載する入金期限日',note:'請求書に記載する備考'}[key]||''):'';return `<label><span>${label}${hint?'<small class="field-note">※'+hint+'</small>':''}</span><input aria-label="${group==='income'?'入金'+(index+1):row.vendor+' 支払'+(index+1)} ${label}" data-group="${group}" data-index="${index}" data-key="${key}" type="${type}" value="${esc(row[key])}" ${type==='number'?'min="0" step="1"':''} ${extra}></label>`;
}
function currentPosition(){try{return window.cashLedger.position({...loadedJob,id:jobId||'sample',income:incomes.map((r,i)=>({...r,id:r.id||'sample-income-'+i}))},payments.map((r,i)=>({...r,id:r.id||'sample-payment-'+i,job:jobId||'sample'})));}catch{return null;}}
function balance(group,row){const position=currentPosition();return position?.[group==='income'?'incomes':'payments'].find(r=>r.id===(row.id||'sample-'+group+'-'+(group==='income'?incomes:payments).indexOf(row)));}
function stateLabel(group,row){if(group==='payment'&&row.amount!==''&&Number(row.amount)===0)return '支払不要';const b=balance(group,row);if(!b)return '入力内容を確認';if(b.remaining===0){if(b.adjusted)return b.cash?'精算済（調整あり）':'精算済（調整）';return group==='income'?(row.actual?'入金済':'入金済（日付未入力）'):(row.actual?'支払済':'支払済（日付未入力）');}if(b.cash>0)return group==='income'?'一部入金':'一部支払';return group==='income'?'未入金':'未払';}
function state(group,index){const row=group==='income'?incomes[index]:payments[index],b=balance(group,row);return '<span class="state '+(b?.remaining===0?'done':'')+'" id="state-'+group+'-'+index+'">'+stateLabel(group,row)+'</span>';}
function remaining(group,row,i){const b=balance(group,row);return '<p class="card-remaining">'+(group==='income'?'この請求の未入金額（調整後）':'この支払の未払額（調整後）')+' <strong id="remaining-'+group+'-'+i+'">'+(b?.remaining==null?'—':yen(b.remaining)+'円')+'</strong></p>';}
function adjustmentCards(row){return (loadedJob?.settlementAdjustments||[]).filter(a=>a.income===row.id).map(a=>'<div class="linked-adjustment"><strong>'+esc({offset:'相殺',badDebt:'回収不能',correction:'請求訂正'}[a.kind])+' '+(a.kind==='correction'&&a.direction==='increase'?'+':'−')+yen(a.amount)+'円</strong><span>対象：'+esc(row.name||'名称未入力')+'</span><span>'+esc(a.date)+' ／ '+esc(a.reason)+'</span></div>').join('');}
function renderIncome(){
 el('income-cards').innerHTML=incomes.map((row,i)=>`<article aria-label="入金カード${i+1}"><div class="card-heading"><h3>入金 ${i+1}</h3>${state('income',i)}</div><div class="income-fields">
 <div class="claim-fields"><div class="fields">${input('income',i,'name','請求名','text','list="invoice-names"')}${input('income',i,'amount','入金額（税込）','number')}<label>入金方法<select aria-label="入金${i+1} 入金方法" data-group="income" data-index="${i}" data-key="method"><option value="">選択</option>${['振込','現金','クレジット'].map(v=>`<option ${row.method===v?'selected':''}>${v}</option>`).join('')}</select></label>${input('income',i,'invoice','請求日','date')}${input('income',i,'due','入金期限日','date')}${input('income',i,'note','備考')}</div><label class="final-payment"><input type="checkbox" data-group="income" data-index="${i}" data-key="completionInvoice" ${row.completionInvoice?'checked':''}>最終金 <small>この請求が最終請求の場合に✓</small></label></div>
 <div class="receipt-fields">${input('income',i,'actual','実績入金日','date')}${input('income',i,'actualAmount','実績入金額','number')}</div></div>${remaining('income',row,i)}<div class="card-footer"><span>請求書：${loadedJob?.history?.some(h=>h.incomeCardId===row.id&&h.type==='請求書')?'出力済':'未出力'}</span><button data-adjust="${i}">調整を追加</button><button data-invoice="${i}">請求書出力</button></div>${adjustmentCards(row)}</article>`).join('');
}
function renderPayments(){
 el('payment-cards').innerHTML=payments.map((row,i)=>`<article aria-label="${esc(row.vendor)}の支払カード"><div class="card-heading"><h3>${esc(row.vendor)}</h3><button class="split-button" data-split="${i}">分ける</button>${state('payment',i)}</div><div class="fields">${row.manual?input('payment',i,'vendor','支払先'):''}<div class="budget"><span>実行予算（税込）</span><output>${yen(row.budget)}</output></div>${input('payment',i,'amount','支払額（税込）','number','placeholder="未確定"')}${input('payment',i,'completed','完了日','date')}${input('payment',i,'due','支払予定日','date')}${input('payment',i,'actual','支払実績日','date')}${input('payment',i,'actualAmount','実支払額（税込）','number')}${input('payment',i,'note','備考')}</div>${remaining('payment',row,i)}</article>`).join('');
 updateSummary();
}
function updateSummary(){
 const complete=payments.every(row=>row.amount!==''&&Number.isFinite(Number(row.amount))&&Number(row.amount)>=0);
 el('confirmed-total').textContent=complete?yen(payments.reduce((sum,row)=>sum+Number(row.amount),0)):'未確定';
}
function change(event){
 const input=event.target;if(!input.dataset.group)return;
 const group=input.dataset.group,index=Number(input.dataset.index),key=input.dataset.key;
 const row=group==='income'?incomes[index]:payments[index];row[key]=input.type==='checkbox'?input.checked:input.value;
 for(const [g,rows] of [['income',incomes],['payment',payments]])rows.forEach((r,i)=>{const badge=el('state-'+g+'-'+i),b=balance(g,r);if(badge){badge.classList.toggle('done',b?.remaining===0);badge.textContent=stateLabel(g,r);}const remaining=el('remaining-'+g+'-'+i);if(remaining)remaining.textContent=b?.remaining==null?'—':yen(b.remaining)+'円';});
 if(group==='payment'&&key==='amount')updateSummary();if(group==='payment'&&key==='vendor')input.closest('article').querySelector('h3').textContent=input.value||'支払先未入力';
}
el('add-payment').disabled=!!loadedJob?.posted;el('add-payment').addEventListener('click',()=>{if(loadedJob?.posted){el('status').textContent='計上後の追加は追加工事で登録してください。';return;}payments.push({id:crypto.randomUUID(),job:jobId,vendor:'',manual:true,budget:0,amount:'',completed:'',due:'',actual:'',actualAmount:'',note:''});renderPayments();el('status').textContent='支払カードを追加しました。支払先と金額等を入力して保存してください。';});
document.addEventListener('input',change);document.addEventListener('change',change);
el('add-income').addEventListener('click',()=>{incomes.push({id:crypto.randomUUID(),name:'',amount:'',method:'',invoice:'',due:'',actual:'',note:'',completionInvoice:false});renderIncome();el('status').textContent='入金カードを追加しました。';});
document.addEventListener('click',async event=>{
 const adjust=event.target.closest('[data-adjust]');if(adjust){const row=incomes[Number(adjust.dataset.adjust)];if(!jobId||!row.name||row.amount===''){el('status').textContent='調整元の請求名・金額を入力して保存してください。';return;}if(await saveCash())location.href='settlement.html?id='+encodeURIComponent(jobId)+'&income='+encodeURIComponent(row.id);return;}
 const split=event.target.closest('[data-split]');
 if(split){const index=Number(split.dataset.split);payments.splice(index+1,0,{id:crypto.randomUUID(),job:jobId,vendor:payments[index].vendor,budget:0,amount:'',completed:'',due:'',actual:'',note:''});renderPayments();el('status').textContent='元のカードをそのまま残し、直下に支払カードを追加しました。';}
 const invoiceButton=event.target.closest('[data-invoice]');
 if(invoiceButton){
  const index=Number(invoiceButton.dataset.invoice);
  if(!incomes[index].invoice){
   el('status').textContent='請求書に記載する請求日を入力してください。';
   document.querySelector(`[data-group="income"][data-index="${index}"][data-key="invoice"]`)?.focus();
  }else if(incomes[index].completionInvoice&&!loadedJob?.completed){el('status').textContent='最終金の請求書には工事情報の完工日が必要です。';}else if(!jobId){el('status').textContent='工事情報から入金・支払を開いてください。';}else if(await saveCash()){location.href=window.jobHrefFor('report.html?id='+encodeURIComponent(jobId)+'&type=invoice&card='+encodeURIComponent(incomes[index].id));}
 }
});
const id=new URLSearchParams(location.search).get('id');if(id)el('back-link').href='construction.html?id='+encodeURIComponent(id);
el('settlement-link').addEventListener('click',async e=>{if(jobId){e.preventDefault();if(await saveCash())location.href='settlement.html?id='+encodeURIComponent(jobId);}});
renderIncome();renderPayments();
})();
