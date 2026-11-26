/* 支払一覧の独立したUIサンプル。実際の支払額は書き換えない。 */
(() => {
'use strict';
const el=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const yen=n=>Number(n).toLocaleString('ja-JP')+'円',date=v=>v?v.replaceAll('-','/'):'未定';
let rows=[];function load(){const db=JSON.parse(window.appStorage.getItem('construction_demo_v02')||'{"jobs":[],"payments":[]}');rows=window.companyLedger.collect(db).payments;}

const amount=r=>r.amount===null?r.budget:r.amount;
const isPending=r=>r.amount===null;
const noPaymentNeeded=r=>r.amount===0;
const isUnpaid=r=>!r.settled&&!noPaymentNeeded(r);
const jobLink=r=>r.job?`<a class="job-name" href="construction.html?id=${encodeURIComponent(r.job)}">${esc(r.name)}</a>`:`<span class="job-name">${esc(r.name)}</span>`;
const badge=r=>`<span class="badge ${r.settled||noPaymentNeeded(r)?'paid':''}">${noPaymentNeeded(r)?'支払不要':r.settled?(r.adjusted?'精算済（調整）':'支払済'):r.cash>0?'一部支払':'未払'}</span>`;
const amountText=r=>isPending(r)?`<span class="budget-amount">実行予算 ${yen(r.budget)}</span><span class="amount-hint">（未確定）</span>`:yen(r.amount);

function render(){
 try{load();}catch(e){rows=[];el('outstanding-total').textContent='—';el('count').textContent=e.message;el('payment-rows').textContent='保存データを確認できないため表示を停止しています。';el('payment-cards').textContent='';return;}

 el('outstanding-total').textContent=yen(rows.filter(isUnpaid).reduce((n,r)=>n+(r.remaining??r.budget),0));
 const q=el('search').value.trim().toLowerCase(),month=el('month').value,state=el('state').value,sort=el('sort').value;
 const shown=rows.filter(r=>(!q||(r.vendor+' '+r.name+' '+r.note).toLowerCase().includes(q))&&(!month||r.due.startsWith(month))&&(state==='all'||state==='paid'&&r.settled&&!noPaymentNeeded(r)||state==='unpaid'&&isUnpaid(r)||state==='pending'&&isPending(r)||state==='none'&&noPaymentNeeded(r))).slice();
 shown.sort((a,b)=>sort==='vendor'?a.vendor.localeCompare(b.vendor,'ja'):sort==='amount'?amount(b)-amount(a):(a.due||'9999').localeCompare(b.due||'9999'));
 el('payment-rows').innerHTML=shown.map(r=>`<tr><td><strong>${esc(r.vendor)}</strong></td><td>${jobLink(r)}</td><td class="money budget-value">${yen(r.budget)}</td><td class="money">${amountText(r)}</td><td class="date">${date(r.due)}</td><td class="date">${r.actual?date(r.actual):'—'}</td><td>${badge(r)}</td><td>${esc(r.note||'—')}</td></tr>`).join('')||'<tr><td colspan="8" class="empty">該当する支払はありません。</td></tr>';
 el('payment-cards').innerHTML=shown.map(r=>`<article><div class="card-top"><h2 class="vendor-name">${esc(r.vendor)}</h2>${badge(r)}</div><div class="payment-job">${jobLink(r)}</div><div class="payment-amounts"><div><span class="amount-label">実行予算額（税込）</span><div class="budget-value">${yen(r.budget)}</div></div><div><span class="amount-label">支払額（税込）</span><div class="card-amount">${amountText(r)}</div></div></div><dl><div><dt>支払予定日</dt><dd>${date(r.due)}</dd></div><div><dt>支払実績日</dt><dd>${r.actual?date(r.actual):'—'}</dd></div></dl>${r.note?`<p class="payment-memo">${esc(r.note)}</p>`:''}</article>`).join('')||'<p class="empty">該当する支払はありません。</p>';
 el('count').textContent=`${shown.length}件表示 ／ 全${rows.length}件`;
}
for(const id of ['search','month'])el(id).addEventListener('input',render);
for(const id of ['state','sort'])el(id).addEventListener('change',render);
el('reset').addEventListener('click',()=>{el('search').value='';el('month').value='';el('state').value='all';el('sort').value='due';render();});
window.addEventListener('focus',render);window.addEventListener('storage',e=>{if(e.key==='construction_demo_v02')render();});render();
})();
