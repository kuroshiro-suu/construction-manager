/* 保存された実入出金を1記録1行で表示。非現金調整や予定は混ぜない。 */
(() => {
'use strict';
const el=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const yen=n=>Number(n).toLocaleString('ja-JP')+'円',formatDate=v=>v.replaceAll('-','/');
const labels={income:'入金',payment:'工事支払',expense:'会社支出'};
let transactions=[];
function sourceData(){const db=JSON.parse(window.appStorage.getItem('construction_demo_v02')||'null')||{jobs:[],payments:[]};if(db.jobs===undefined&&db.payments===undefined){db.jobs=[];db.payments=[];}const expenses=window.cashLedger.expenseRows(window.appStorage.getItem(window.cashLedger.EXPENSE_KEY));return window.cashLedger.collect(db,expenses);}
const badge=r=>`<span class="kind-badge ${r.kind}">${labels[r.kind]}</span>`;
const jobLink=r=>r.job?`<a class="job-name" href="construction.html?id=${encodeURIComponent(r.job)}">${esc(r.jobName)}</a>`:esc(r.jobName||'—');
let period='current',fiscalMonth=null;
try { const settings=JSON.parse(window.appStorage.getItem('construction_demo_v02')||'{}'); const month=Number(settings.fiscalEndMonth); if(Number.isInteger(month)&&month>=1&&month<=12)fiscalMonth=month; } catch(e) {}
const todayParts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',year:'numeric',month:'numeric'}).formatToParts(new Date());
const thisYear=Number(todayParts.find(p=>p.type==='year').value),thisMonth=Number(todayParts.find(p=>p.type==='month').value);
const iso=(year,month,day)=>`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
function choosePeriod(value){
 period=value;try{const settings=JSON.parse(window.appStorage.getItem('construction_demo_v02')||'{}'),m=Number(settings.fiscalEndMonth);fiscalMonth=Number.isInteger(m)&&m>=1&&m<=12?m:null;}catch{fiscalMonth=null;}
 if(value==='current'&&fiscalMonth){const endYear=thisYear+(thisMonth>fiscalMonth?1:0);el('start').value=iso(fiscalMonth===12?endYear:endYear-1,fiscalMonth===12?1:fiscalMonth+1,1);el('end').value=iso(endYear,fiscalMonth,new Date(endYear,fiscalMonth,0).getDate());}
 else if(value==='month'){el('start').value=iso(thisYear,thisMonth,1);el('end').value=iso(thisYear,thisMonth,new Date(thisYear,thisMonth,0).getDate());}
 else {el('start').value='';el('end').value='';}
 render();
}
function render(){try{transactions=sourceData();el('report').disabled=false;}catch(err){el('status').textContent=err.message;for(const id of ['income-total','payment-total','expense-total','difference-total'])el(id).textContent='—';el('book-rows').innerHTML='<tr><td colspan="6">保存データを確認できないため集計を停止しています。</td></tr>';el('book-cards').textContent='保存データを確認してください。';el('count').textContent='';el('report').disabled=true;return;}
 const query=el('search').value.trim().toLowerCase(),start=el('start').value,end=el('end').value,kind=el('kind').value;
 if(start&&end&&start>end){el('status').textContent='開始日を終了日以前にしてください。';}else el('status').textContent='';
 const needsFiscal=period==='current'&&!fiscalMonth;
 el('fiscal-notice').hidden=!needsFiscal;
 for(const name of ['current','month','all'])el('period-'+name).setAttribute('aria-pressed',String(period===name));
 el('period-label').textContent=needsFiscal?'決算月未設定':start||end?`${start?formatDate(start):'指定なし'} 〜 ${end?formatDate(end):'指定なし'}`:'全期間';
 const shown=transactions.filter(r=>!needsFiscal&&(!query||(r.description+' '+r.party+' '+(r.jobName||'')).toLowerCase().includes(query))&&(!start||r.actual>=start)&&(!end||r.actual<=end)&&(kind==='all'||r.kind===kind)).slice();
 shown.sort((a,b)=>el('sort').value==='new'?b.actual.localeCompare(a.actual):a.actual.localeCompare(b.actual));
 const incoming=shown.filter(r=>r.kind==='income').reduce((sum,r)=>sum+r.amount,0),outgoing=shown.filter(r=>r.kind!=='income').reduce((sum,r)=>sum+r.amount,0);
 el('income-total').textContent=yen(incoming);el('payment-total').textContent=yen(shown.filter(r=>r.kind==='payment').reduce((sum,r)=>sum+r.amount,0));el('expense-total').textContent=yen(shown.filter(r=>r.kind==='expense').reduce((sum,r)=>sum+r.amount,0));el('difference-total').textContent=yen(incoming-outgoing);el('difference-total').classList.toggle('negative',incoming-outgoing<0);
 el('book-rows').innerHTML=shown.map(r=>`<tr><td class="date">${formatDate(r.actual)}</td><td>${badge(r)}</td><td><span class="book-description">${esc(r.description)}</span>${r.party?`<span class="counterparty">${esc(r.party)}</span>`:''}</td><td>${jobLink(r)}</td><td class="money">${r.kind==='income'?yen(r.amount):'—'}</td><td class="money">${r.kind!=='income'?yen(r.amount):'—'}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">該当する入出金はありません。</td></tr>';
 el('book-cards').innerHTML=shown.map(r=>`<article><div class="book-card-head"><time datetime="${r.actual}">${formatDate(r.actual)}</time>${badge(r)}</div><div class="book-description">${esc(r.description)}</div>${r.party?`<span class="counterparty">${esc(r.party)}</span>`:''}${r.job?`<p class="book-card-job">${jobLink(r)}</p>`:''}<div class="book-card-money"><span>${r.kind==='income'?'入金（税込）':'出金（税込）'}</span><strong>${yen(r.amount)}</strong></div></article>`).join('')||'<p class="empty">該当する入出金はありません。</p>';
 el('count').textContent=`${shown.length}件表示 ／ 実入出金 全${transactions.length}件`;
 if(needsFiscal){for(const id of ['income-total','payment-total','expense-total','difference-total'])el(id).textContent='—';}
}
el('search').addEventListener('input',render);
for(const id of ['start','end'])el(id).addEventListener('input',()=>{period='custom';render();});
for(const name of ['current','month','all'])el('period-'+name).addEventListener('click',()=>choosePeriod(name));
for(const id of ['kind','sort'])el(id).addEventListener('change',render);
el('reset').addEventListener('click',()=>{el('search').value='';el('kind').value='all';el('sort').value='new';choosePeriod('current');});

window.addEventListener('storage',e=>{if(e.key==='construction_demo_v02'||e.key===window.cashLedger.EXPENSE_KEY){if(period==='custom')render();else choosePeriod(period);}});window.addEventListener('focus',()=>{if(period==='custom')render();else choosePeriod(period);});
choosePeriod('current');
})();
