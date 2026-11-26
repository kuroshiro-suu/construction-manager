/* 閲覧用UI試作。既存の工事や入金実績は変更しない。 */
(() => {
'use strict';
const el=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const yen=n=>Number(n).toLocaleString('ja-JP')+'円',date=v=>v?v.replaceAll('-','/'):'未定';
let rows=[];function load(){const db=JSON.parse(window.appStorage.getItem('construction_demo_v02')||'{"jobs":[],"payments":[]}');rows=window.companyLedger.collect(db).incomes;for(const r of window.otherIncome.rows(window.appStorage.getItem(window.otherIncome.KEY)))rows.push({id:r.id,other:true,name:r.content,client:[r.category,r.method,r.note].filter(Boolean).join(' ／ '),invoice:'その他入金',billed:'',amount:r.amount,due:'',actual:r.date,remaining:0,settled:r.amount!==null&&r.amount!=='',cash:Number(r.amount||0)});}


const badge=r=>r.other?`<span class="badge">${r.amount===null||r.amount===''?'金額未確定':'その他入金'}</span>`:`<span class="badge ${r.settled?'paid':''}">${r.settled?(r.adjusted?'精算済（調整）':'入金済'):r.cash>0?'一部入金':'未入金'}</span>`;
const jobLink=r=>`${r.job?`<a class="job-name" href="construction.html?id=${encodeURIComponent(r.job)}">${esc(r.name)}</a>`:`<span class="job-name">${esc(r.name)}</span>`}<span class="client">${esc(r.client)}</span>`;
function render(){
 try{load();}catch(e){rows=[];el('outstanding-total').textContent='—';el('count').textContent=e.message;el('income-rows').textContent='保存データを確認できないため表示を停止しています。';el('income-cards').textContent='';return;}

 el('outstanding-total').textContent=yen(rows.reduce((n,r)=>n+r.remaining,0));
 const q=el('search').value.trim().toLowerCase(),month=el('month').value,state=el('state').value,sort=el('sort').value;
 const shown=rows.filter(r=>(!q||(r.name+' '+r.client+' '+r.invoice).toLowerCase().includes(q))&&(!month||(r.other?r.actual:r.due).startsWith(month))&&(state==='all'||(state==='paid'?r.settled:!r.settled))).slice();
 shown.sort((a,b)=>sort==='client'?a.client.localeCompare(b.client,'ja'):sort==='amount'?b.amount-a.amount:(a.other?a.actual:a.due||'9999').localeCompare(b.other?b.actual:b.due||'9999'));
 el('income-rows').innerHTML=shown.map(r=>`<tr><td>${jobLink(r)}</td><td>${esc(r.invoice)}</td><td class="money">${(r.amount===null||r.amount===''?'—':yen(r.amount))}</td><td class="date ${r.billed?'': 'missing-invoice'}">${r.billed?date(r.billed):'—'}</td><td class="date">${r.other?'—':date(r.due)}</td><td class="date">${r.actual?date(r.actual):'—'}</td><td>${badge(r)}</td></tr>`).join('')||'<tr><td colspan="7" class="empty">該当する入金はありません。</td></tr>';
 el('income-cards').innerHTML=shown.map(r=>`<article><div class="card-top"><div>${jobLink(r)}</div>${badge(r)}</div><p class="invoice">${esc(r.invoice)}</p><div class="card-amount">${yen(r.amount)} <small>税込</small></div><dl><div><dt>請求日</dt><dd class="${r.billed?'': 'missing-invoice'}">${r.billed?date(r.billed):'—'}</dd></div><div><dt>入金期限日</dt><dd>${date(r.due)}</dd></div><div><dt>入金実績日</dt><dd>${r.actual?date(r.actual):'—'}</dd></div></dl></article>`).join('')||'<p class="empty">該当する入金はありません。</p>';
 el('count').textContent=`${shown.length}件表示 ／ 全${rows.length}件`;
}
for(const id of ['search','month'])el(id).addEventListener('input',render);
for(const id of ['state','sort'])el(id).addEventListener('change',render);
el('reset').addEventListener('click',()=>{el('search').value='';el('month').value='';el('state').value='all';el('sort').value='due';render();});
window.addEventListener('other-income-saved',render);window.addEventListener('focus',render);window.addEventListener('storage',e=>{if(e.key==='construction_demo_v02')render();});render();
})();
