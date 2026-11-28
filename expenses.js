/* 会社支出のブラウザ保存。記録を1件ずつ収支へ渡す。 */
(() => {
'use strict';
const el=id=>document.getElementById(id),keys=['date','content','amount','category','method','note'];
const labels={date:'日付',content:'内容',amount:'金額',category:'種別',method:'支払方法',note:'メモ'};
let businessType='';try{businessType=JSON.parse(window.appStorage.getItem('construction_business_v1')||'{}').businessType||'';}catch{}const categories=window.expenseOptions.categories(businessType);
el('business-type-notice').hidden=categories.length>0;el('business-type-notice').textContent=categories.length?'':'種別を選ぶには、設定 → 事業者情報で個人・法人を選択してください。既存の支出はそのまま残ります。';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const blank=()=>({date:'',content:'',amount:'',category:'',method:'',note:''});
const yen=n=>Number(n).toLocaleString('ja-JP')+'円';
const expenseKey=window.cashLedger.EXPENSE_KEY;let expenseSnapshot=window.appStorage.getItem(expenseKey),loadError='';let ledger=[];try{ledger=structuredClone(window.cashLedger.expenseRows(expenseSnapshot));}catch(err){loadError=err.message;}let nextId=Math.max(0,...ledger.map(r=>typeof r.id==='number'?r.id:0))+1,mode='new',newDraft=Array.from({length:5},blank),editDraft=null,draft=[],before=null,history=[];
async function saveLedger(next){if(loadError)throw Error(loadError);if(window.appStorage.getItem(expenseKey)!==expenseSnapshot)throw Error('別の画面で支出が変更されています。入力内容を控えて開き直してください。');const serialized=JSON.stringify({...JSON.parse(expenseSnapshot||'{"version":1}'),version:1,rows:next});window.cashLedger.expenseRows(serialized);if(window.cloudRuntime)await window.cloudRuntime.checkAccess();window.appStorage.setItem(expenseKey,serialized);if(window.cloudRuntime)await window.cloudRuntime.flush();expenseSnapshot=serialized;ledger=next;}
const filled=row=>keys.some(key=>String(row[key]??'').trim()!=='');
const valid=row=>window.cashLedger.day(row.date)&&row.content.trim()!==''&&row.amount!==''&&Number.isSafeInteger(Number(row.amount))&&Number(row.amount)>=0&&window.expenseOptions.validExtra(row);
function status(message){el('status').textContent=message;}
function sum(rows){return rows.reduce((n,row)=>n+(Number(row.amount)||0),0);}
function renderLedger(){
 const query=el('search').value.trim().toLowerCase(),month=el('month').value;
 const rows=ledger.map((r,index)=>({...r,_order:index})).filter(row=>(!month||row.date.startsWith(month))&&(!query||(row.content+' '+(row.category||'')+' '+(row.method||'')+' '+row.note).toLowerCase().includes(query))).sort((a,b)=>window.listOrder.newest({...a,sortDate:a.date},{...b,sortDate:b.date}));
 el('ledger-rows').innerHTML=rows.map(row=>`<tr><td data-label="日付">${esc(row.date.replaceAll('-','/'))}</td><td data-label="内容">${esc(row.content)}</td><td data-label="金額" class="amount">${yen(row.amount)}</td><td data-label="種別">${esc(row.category||'—')}</td><td data-label="支払方法">${esc(row.method||'—')}</td><td data-label="メモ">${esc(row.note)}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">該当する支出はありません。</td></tr>';
 el('ledger-total').textContent=yen(sum(rows));el('list-count').textContent=`${rows.length}件表示 ／ 登録${ledger.length}件`;
}
function renderDraft(){
 el('entry-rows').innerHTML=draft.map((row,i)=>`<tr>${keys.map(key=>['category','method'].includes(key)?`<td data-label="${labels[key]}"><select data-row="${i}" data-key="${key}" aria-label="${i+1}行目 ${labels[key]}"><option value="">選択してください</option>${[...new Set([...(key==='category'?categories:window.expenseOptions.methods),...(row[key]?[row[key]]:[])])].map(v=>`<option value="${esc(v)}" ${v===row[key]?'selected':''}>${esc(v)}</option>`).join('')}</select></td>`:`<td data-label="${labels[key]}"><input data-row="${i}" data-key="${key}" aria-label="${i+1}行目 ${labels[key]}" type="${key==='date'?'date':key==='amount'?'number':'text'}" ${key==='amount'?'data-money min="0" step="1"':''} value="${esc(row[key])}"></td>`).join('')}</tr>`).join('');
 el('draft-total').textContent=yen(sum(draft));el('undo').disabled=!history.length;
}
function open(modeValue){
 mode=modeValue;draft=mode==='new'?newDraft:(editDraft??structuredClone(ledger));history=[];before=null;
 el('page-title').textContent=mode==='new'?'支出の新規登録':'支出の編集';
 el('entry-hint').textContent=mode==='new'?'領収書を見ながら、続けて入力してください。日付は順不同で大丈夫です。':'登録済みの支出だけを表示しています。まとめて修正できます。';
 el('register').textContent=mode==='new'?'まとめて登録':'変更を反映';
 el('entry-hint').hidden=false;el('expense-page-description').textContent=mode==='new'?'新しい支出を入力する画面です。まとめて登録すると支出台帳の一覧に反映されます。':'登録済みの支出を入力・修正する画面です。変更を反映すると支出台帳の一覧に反映されます。';el('add-tools').hidden=mode!=='new';el('ledger-view').hidden=true;el('entry-view').hidden=false;renderDraft();status('');
}
function back(message='',keepDraft=true){
 if(mode==='new')newDraft=draft; else if(keepDraft)editDraft=draft;
 el('entry-hint').hidden=true;el('expense-page-description').textContent='登録済みの支出を日付順に確認する画面です。新しい支出は「新規登録」、登録済みの内容は「内容を編集」から入力・修正できます。';el('entry-view').hidden=true;el('ledger-view').hidden=false;el('page-title').textContent='支出台帳';renderLedger();status(message);
}
document.addEventListener('app-parent-back',event=>{if(!el('entry-view').hidden){event.preventDefault();returnToLedger();}});
function remember(value){history.push(structuredClone(value));if(history.length>1)history.shift();el('undo').disabled=false;}
el('new-entry').addEventListener('click',()=>open('new'));el('edit-entry').addEventListener('click',()=>open('edit'));
function returnToLedger(){back(mode==='new'&&draft.some(filled)?'入力途中の内容は、このページを開いている間、新規登録画面に残しています。':mode==='edit'?'編集途中の内容は、このページを開いている間、編集画面に残しています。':'台帳へ戻りました。');}
el('back-ledger').addEventListener('click',returnToLedger);
function add(count){remember(draft);draft.push(...Array.from({length:count},blank));renderDraft();status(count+'行追加しました。');}
el('add-one').addEventListener('click',()=>add(1));el('add-ten').addEventListener('click',()=>add(10));
el('entry-rows').addEventListener('focusin',event=>{if(event.target.matches('input,select'))before=structuredClone(draft);});
el('entry-rows').addEventListener('input',event=>{const input=event.target;if(!input.matches('input,select'))return;draft[Number(input.dataset.row)][input.dataset.key]=input.value;input.closest('tr').classList.remove('invalid');el('draft-total').textContent=yen(sum(draft));});
el('entry-rows').addEventListener('change',()=>{if(before&&JSON.stringify(before)!==JSON.stringify(draft)){remember(before);before=structuredClone(draft);}});
el('entry-rows').addEventListener('keydown',event=>{if(event.key==='Enter'&&event.target.matches('input,select')){event.preventDefault();const i=Number(event.target.dataset.row)+(event.shiftKey?-1:1);el('entry-rows').querySelector(`[data-row="${i}"][data-key="${event.target.dataset.key}"]`)?.focus();}});
el('undo').addEventListener('click',()=>{if(!history.length)return;draft=history.pop();before=null;renderDraft();status('直前の操作を元に戻しました。');});
el('register').addEventListener('click',async()=>{
 const errors=[];
 draft.forEach((row,i)=>{if((mode==='edit'||filled(row))&&!valid(row))errors.push(i);});
 if(errors.length){errors.forEach(i=>el('entry-rows').children[i].classList.add('invalid'));status(`${errors.map(i=>i+1).join('・')}行目の日付・内容・金額を確認してください。「その他」はメモも必要です。入力途中の行はそのまま残しています。`);return;}
 if(mode==='new'){
  const entries=draft.filter(filled);if(!entries.length){status('入力した支出はまだありません。');return;}
  try{await saveLedger([...ledger,...entries.map(row=>({...row,id:nextId++,createdAt:new Date().toISOString()}))]);}catch(err){status(err.message);return;}newDraft=Array.from({length:5},blank);draft=newDraft;back(`${entries.length}件を保存しました。収支台帳へ反映します。`);
 }else{try{await saveLedger(structuredClone(draft));}catch(err){status(err.message);return;}editDraft=null;back('支出の変更を保存しました。収支台帳へ反映します。',false);}
});
el('search').addEventListener('input',renderLedger);el('month').addEventListener('input',renderLedger);el('clear-filter').addEventListener('click',()=>{el('search').value='';el('month').value='';renderLedger();});
window.attachSimpleGrid({root:el('entry-rows'),columns:keys.length,keys,allowAppend:()=>mode==='new',read:()=>draft.map(row=>keys.map(key=>row[key])),commit:next=>{remember(draft);draft=next.map((row,i)=>({...draft[i],...Object.fromEntries(keys.map((key,c)=>[key,row[c]]))}));renderDraft();},undo:()=>el('undo').click(),status,normalize:(v,c)=>{if(c===0&&v){v=v.replaceAll('/','-');const match=v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);if(!match)throw Error('発生日は年/月/日で貼り付けてください。');v=match[1]+'-'+match[2].padStart(2,'0')+'-'+match[3].padStart(2,'0');const date=new Date(v+'T00:00:00Z');if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==v)throw Error('発生日を確認してください。');}if(c===3&&v&&!categories.includes(v))throw Error('事業者区分に合った種別を選択してください。');if(c===4&&v&&!window.expenseOptions.methods.includes(v))throw Error('支払方法は候補から選択してください。');if(c===2&&v){v=v.trim().replaceAll(',','');if(!/^\d+(?:\.\d+)?$/.test(v)||!Number.isFinite(Number(v)))throw Error('支出額は0以上の数値にしてください。');}return v;}});
renderLedger();
if(loadError){status(loadError+' 既存データ保護のため編集を止めています。');el('new-entry').disabled=el('edit-entry').disabled=true;}else if(new URLSearchParams(location.search).get('view')==='new')open('new');
})();
