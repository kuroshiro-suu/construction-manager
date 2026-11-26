/* 工事IDに結び付けて保存するローカル試用版。IDなしは独立した操作見本。 */
(() => {
'use strict';
const el = id => document.getElementById(id);
function refreshMasterCandidates(){
 try{const values=window.unitMaster.read();el('units').replaceChildren(...values.map(value=>{const o=document.createElement('option');o.value=value;return o;}));}catch(e){/* 読取失敗時は既存候補を保つ。 */}
 try{const rows=window.vendorStore.create(window.appStorage,window.appSessionStorage).read();if(Array.isArray(rows))el('vendors').replaceChildren(...rows.filter(r=>Array.isArray(r)&&typeof r[0]==='string'&&r[0].trim()).map(r=>{const o=document.createElement('option');o.value=r[0];return o;}));}catch(e){}
}
refreshMasterCandidates();window.addEventListener('focus',refreshMasterCandidates);window.addEventListener('storage',refreshMasterCandidates);window.addEventListener('unit-master-changed',refreshMasterCandidates);
const fields = ['no','name','spec','cq','cu','cp','qq','qu','qp','note','vendor'];
const labels = {no:'No.',name:'名称',spec:'仕様',cq:'原価数量',cu:'原価単位',cp:'原価単価',qq:'提出数量',qu:'提出単位',qp:'提出単価',note:'備考',vendor:'取引先'};
const numeric = new Set(['cq','cp','qq','qp']);
const blank = () => Object.fromEntries(fields.map(key => [key,'']));
let rows = [
 {...blank(),no:'1',name:'給湯器交換工事',cq:'1',cu:'式',cp:'0',qq:'1',qu:'式',qp:'300000'},
 {...blank(),no:'',name:' 給湯器本体',spec:'リンナイ製○○',cq:'1',cu:'台',cp:'150000',vendor:'リンナイ'},
 {...blank(),no:'',name:' リモコン類',spec:'リンナイ製○○',cq:'1',cu:'式',cp:'20000',vendor:'リンナイ'},
 {...blank(),no:'',name:' 取付工事費',cq:'1',cu:'式',cp:'50000',vendor:'岡山設備'},
 {...blank(),no:'',name:'産業廃棄物処分費',cq:'1',cu:'式',cp:'10000',vendor:'岡山クリーン'},
 ...Array.from({length:7},blank)
];
const jobId=new URLSearchParams(location.search).get('id');
const store=window.estimateStore.create(window.appStorage);let opened=null,blocked=false,dirty=false;
if(jobId){el('back-link').href='construction.html?id='+encodeURIComponent(jobId);try{opened=store.open(jobId);rows=opened.job.estimate?structuredClone(opened.job.estimate.rows):Array.from({length:12},blank);el('estimate-job').textContent=(window.cloudRuntime?.jobNo||opened.job.id)+' ／ '+opened.job.name;document.title=opened.job.name+'｜見積エディタ';blocked=Boolean((opened.job.ordered||opened.job.posted)&&!opened.job.estimate);el('estimate-notice').textContent=blocked?'この工事は既に確定した金額があります。元の見積明細が未登録のため編集・保存を止めています。既存金額は変更しません。':'この工事専用の見積です。「見積を保存」で保存し、工事情報の請負金額・実行予算額に反映します。保存先はこのブラウザ内です。';}catch(e){blocked=true;rows=[];el('estimate-job').textContent='工事を開けません';el('estimate-notice').textContent=e.message;}}
else{el('save-estimate').hidden=true;}
function locked(key){return blocked||Boolean(opened?.job.ordered&&['qq','qu','qp'].includes(key))||Boolean(opened?.job.posted&&['cq','cu','cp','vendor'].includes(key));}
const structureLocked=()=>blocked||Boolean(opened?.job.ordered||opened?.job.posted);
function changed(){if(!jobId||blocked)return;dirty=true;el('save-estimate').textContent='見積を保存（未保存）';}
const grid=window.estimateGrid,columns=grid.columns;
let selected=0,anchor=[0,0],end=[0,0],beforeEdit=null,editing=false,navigating=false,dragging=false;
const history=[];
const money=value=>Number(value).toLocaleString('ja-JP',{maximumFractionDigits:2});
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const amount=(row,side)=>row[side+'q']===''||row[side+'p']===''?null:Number(row[side+'q'])*Number(row[side+'p']);
const bounds=()=>[Math.min(anchor[0],end[0]),Math.max(anchor[0],end[0]),Math.min(anchor[1],end[1]),Math.max(anchor[1],end[1])];
function status(text){el('status').textContent=text;}
function remember(snapshot=rows){history.splice(0,history.length,structuredClone(snapshot));el('undo').disabled=false;}
function paint(){const [r1,r2,c1,c2]=bounds();el('rows').querySelectorAll('td[data-col]').forEach(td=>{const r=Number(td.dataset.row),c=Number(td.dataset.col);td.classList.toggle('range-selected',r>=r1&&r<=r2&&c>=c1&&c<=c2);td.classList.toggle('active-cell',r===end[0]&&c===end[1]);});selected=end[0];el('selection-note').textContent=r1===r2&&c1===c2?`${r1+1}行目 ／ ${cellLabel(c1)}`:`${r1+1}〜${r2+1}行 ／ ${cellLabel(c1)}〜${cellLabel(c2)}`;}
function cellLabel(c){return columns[c]?labels[columns[c]]:c===6?'原価金額':'提出金額';}
function focusCell(r,c,extend=false){const cap=grid.plan(rows.length).capacity;r=Math.max(0,Math.min(cap-1,r));c=Math.max(0,Math.min(12,c));if(!extend)anchor=[r,c];end=[r,c];editing=false;navigating=true;const td=el('rows').querySelector(`[data-row="${r}"][data-col="${c}"]`),control=td?.querySelector('input,textarea')||td;control?.focus({preventScroll:true});td?.scrollIntoView({block:'nearest',inline:'nearest'});if(control?.matches('input,textarea'))try{control.select();}catch(e){}navigating=false;beforeEdit=structuredClone(rows);paint();}
function inputCell(row,index,key){const c=columns.indexOf(key),attr=`data-row="${index}" data-col="${c}"`;if(key==='name'||key==='spec')return `<td ${attr} class="description-cell"><textarea rows="1" data-row="${index}" data-key="${key}" aria-label="${index+1}行目 ${labels[key]}"${locked(key)||(structureLocked()&&index>=rows.length)?' readonly':''}>${escape(row[key])}</textarea></td>`;const isNumber=numeric.has(key),isPrice=key==='cp'||key==='qp';const list=key==='cu'||key==='qu'?' list="units"':key==='vendor'?' list="vendors"':'';return `<td ${attr} class="${isNumber?'number':''}${key==='cq'?' cost-start':key==='qq'?' quote-start':''}"><input data-row="${index}" data-key="${key}" aria-label="${index+1}行目 ${labels[key]}" type="${isNumber&&!isPrice?'number':'text'}"${isPrice?' inputmode="decimal"':isNumber?' step="any"':''}${list} value="${escape(isPrice?grid.formatPrice(row[key]):row[key])}"${locked(key)||(structureLocked()&&index>=rows.length)?' readonly':''}></td>`;}
function render(){beforeEdit=null;const layout=grid.plan(rows.length),starts=new Map(layout.pages.map(p=>[p.start,p.number]));let html='';for(let i=0;i<layout.capacity;i++){const row=rows[i]||blank();html+=`<tr${starts.has(i)?` class="page-start" data-page="${starts.get(i)}"`:''}>`+columns.map((key,c)=>key?inputCell(row,i,key):`<td data-row="${i}" data-col="${c}" data-amount="${c===6?'c':'q'}-${i}" class="calculated" tabindex="0" aria-label="${i+1}行目 ${cellLabel(c)}"></td>`).join('')+'</tr>';}
el('rows').innerHTML=html;el('row-count').textContent=`${layout.pages.length}ページ ／ 明細${rows.length}行`;el('page-info').textContent=`ページ境界は青線 ／ 行数は帳票見本に基づく暫定値`;
el('delete-row').disabled=rows.length===0||structureLocked();el('insert-row').disabled=el('add-row').disabled=el('add-page').disabled=structureLocked();el('save-estimate').disabled=blocked;anchor=[Math.min(anchor[0],layout.capacity-1),anchor[1]];end=[Math.min(end[0],layout.capacity-1),end[1]];recalculate();paint();}
function writeInput(input){const key=input.dataset.key;if(locked(key)||(structureLocked()&&Number(input.dataset.row)>=rows.length))return;let value=input.value;if(key==='cp'||key==='qp'){try{value=grid.normalize(value,key);input.setCustomValidity('');}catch(e){input.setCustomValidity('単価には数値を入力してください。');return;}}if(numeric.has(key)&&value!==''&&!Number.isFinite(Number(value)))return;if(beforeEdit){remember(beforeEdit);beforeEdit=null;}const r=Number(input.dataset.row);if(structureLocked()&&r>=rows.length)return;while(rows.length<=r)rows.push(blank());rows[r][key]=value;changed();recalculate();el('row-count').textContent=`${grid.plan(rows.length).pages.length}ページ ／ 明細${rows.length}行`;}
el('rows').addEventListener('focusin',event=>{const td=event.target.closest('td[data-col]');if(!td)return;if(!navigating){anchor=end=[Number(td.dataset.row),Number(td.dataset.col)];editing=false;paint();}beforeEdit=structuredClone(rows);});
el('rows').addEventListener('focusout',event=>{const input=event.target,key=input.dataset.key;if(key!=='cp'&&key!=='qp')return;if(!input.validity.valid)status('単価には数値を入力してください。入力前の値に戻しました。');input.setCustomValidity('');input.value=grid.formatPrice((rows[Number(input.dataset.row)]||blank())[key]);});
el('rows').addEventListener('input',event=>{if(event.target.matches('input,textarea'))writeInput(event.target);});
el('rows').addEventListener('pointerdown',event=>{if(event.button===2){event.preventDefault();return;}if(event.button!==0||event.pointerType==='touch')return;const td=event.target.closest('td[data-col]');if(!td)return;if(editing&&+td.dataset.row===end[0]&&+td.dataset.col===end[1]&&!event.shiftKey)return;event.preventDefault();dragging=true;focusCell(+td.dataset.row,+td.dataset.col,event.shiftKey);});
el('rows').addEventListener('pointerover',event=>{if(!dragging||event.buttons!==1)return;const td=event.target.closest('td[data-col]');if(td)focusCell(+td.dataset.row,+td.dataset.col,true);});
document.addEventListener('pointerup',()=>dragging=false);window.addEventListener('blur',()=>dragging=false);
el('rows').addEventListener('dblclick',event=>{const control=event.target.closest('input,textarea');if(control){editing=true;control.focus();}});
function rangeMatrix(){const [r1,r2,c1,c2]=bounds(),matrix=[];for(let r=r1;r<=r2;r++){const row=rows[r]||blank();matrix.push(columns.slice(c1,c2+1).map((key,i)=>key?row[key]:String(amount(row,c1+i===6?'c':'q')??'')));}return matrix;}
function editableRange(){const [r1,r2,c1,c2]=bounds();for(let c=c1;c<=c2;c++)if(!columns[c]||locked(columns[c]))throw Error('自動計算欄・確定済みの欄を含むため、内容を変更できません。');return[r1,r2,c1,c2];}
function clearSelection(){const[r1,r2,c1,c2]=editableRange();remember();for(let r=r1;r<=Math.min(r2,rows.length-1);r++)for(let c=c1;c<=c2;c++)rows[r][columns[c]]='';changed();render();focusCell(r1,c1);status('選択範囲の内容を消しました。行数は変わりません。');}
function clipboard(event,cut){if(editing&&event.target.matches('input,textarea')&&event.target.selectionStart!==event.target.selectionEnd)return;event.preventDefault();try{if(cut)editableRange();event.clipboardData.setData('text/plain',grid.encode(rangeMatrix()));if(cut)clearSelection();else status('選択範囲をコピーしました。');}catch(e){status(e.message);}}
el('rows').addEventListener('copy',event=>clipboard(event,false));el('rows').addEventListener('cut',event=>clipboard(event,true));
function pasteSelection(text,r=bounds()[0],c=bounds()[2]){const matrix=grid.parse(text);if(structureLocked()&&r+matrix.length>rows.length)throw Error('確定済み明細の行数を増やす貼り付けはできません。');const next=grid.paste(rows,matrix,r,c,locked,blank);remember();rows=next;changed();anchor=[r,c];end=[r+matrix.length-1,c+matrix[0].length-1];render();focusCell(end[0],end[1],true);status(matrix.length+'行 × '+matrix[0].length+'列を貼り付けました。');}
el('rows').addEventListener('paste',event=>{const text=event.clipboardData.getData('text/plain');if(editing&&event.target.matches('textarea')&&!text.includes('\t'))return;event.preventDefault();try{pasteSelection(text);}catch(e){status(e.message+' 内容は変更していません。');}});
let clipboardBusy=false;
async function rangeAction(action){if(clipboardBusy)return;clipboardBusy=true;const selection=bounds(),snapshot=JSON.stringify(rows);try{
 if(action==='clear'){clearSelection();return;}
 if(action==='copy'||action==='cut'){
  if(action==='cut')editableRange();
  await navigator.clipboard.writeText(grid.encode(rangeMatrix()));
  if(action==='cut'){if(snapshot!==JSON.stringify(rows)||JSON.stringify(selection)!==JSON.stringify(bounds())){status('コピーしました。操作中に選択や内容が変わったため、切り取りは行いませんでした。');return;}clearSelection();status('選択範囲を切り取りました。');}else status('選択範囲をコピーしました。');
 }else{const text=await navigator.clipboard.readText();if(snapshot!==JSON.stringify(rows)||JSON.stringify(selection)!==JSON.stringify(bounds())){status('操作中に選択や内容が変わったため、貼り付けを止めました。');return;}pasteSelection(text,selection[0],selection[2]);}
 }catch(e){status((e.name==='NotAllowedError'||e.name==='TypeError')?'クリップボードを使えませんでした。選択後にCtrl＋C／X／Vで操作してください。内容は変更していません。':e.message+' 内容は変更していません。');}finally{clipboardBusy=false;}}
for(const [id,action]of [['copy-range','copy'],['cut-range','cut'],['clear-range','clear'],['paste-range','paste']])el(id).addEventListener('click',()=>rangeAction(action));
const cellMenu=el('cell-menu');
function closeCellMenu(){cellMenu.hidden=true;}
el('rows').addEventListener('contextmenu',event=>{const td=event.target.closest('td[data-col]');if(!td)return;event.preventDefault();dragging=false;const r=+td.dataset.row,c=+td.dataset.col,[r1,r2,c1,c2]=bounds();if(r<r1||r>r2||c<c1||c>c2)focusCell(r,c);editing=false;
 let protectedRange=false;try{editableRange();}catch(e){protectedRange=true;}
 cellMenu.querySelector('[data-menu-action="cut"]').disabled=protectedRange;cellMenu.querySelector('[data-menu-action="clear"]').disabled=protectedRange;cellMenu.querySelector('[data-menu-action="undo"]').disabled=!history.length;cellMenu.querySelector('[data-menu-action="insert-row"]').disabled=structureLocked();cellMenu.querySelector('[data-menu-action="delete-row"]').disabled=structureLocked()||bounds()[0]>=rows.length;
 cellMenu.hidden=false;const rect=cellMenu.getBoundingClientRect(),cellRect=td.getBoundingClientRect();const x=event.clientX||cellRect.left,y=event.clientY||cellRect.bottom;
 cellMenu.style.left=Math.max(4,Math.min(x,window.innerWidth-rect.width-4))+'px';cellMenu.style.top=Math.max(4,Math.min(y,window.innerHeight-rect.height-4))+'px';cellMenu.querySelector('button:not(:disabled)').focus();
});
cellMenu.addEventListener('click',event=>{const button=event.target.closest('[data-menu-action]');if(!button||button.disabled)return;closeCellMenu();if(button.dataset.menuAction==='undo')undo();else if(button.dataset.menuAction==='insert-row'||button.dataset.menuAction==='delete-row')el(button.dataset.menuAction).click();else rangeAction(button.dataset.menuAction);});
cellMenu.addEventListener('keydown',event=>{const buttons=Array.from(cellMenu.querySelectorAll('button:not(:disabled)')),index=buttons.indexOf(document.activeElement);if(event.key==='Escape'){event.preventDefault();closeCellMenu();focusCell(end[0],end[1],true);}else if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();buttons[(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length].focus();}else if(event.key==='Tab')closeCellMenu();});
document.addEventListener('pointerdown',event=>{if(!cellMenu.contains(event.target))closeCellMenu();});window.addEventListener('resize',closeCellMenu);document.querySelector('.sheet-scroll').addEventListener('scroll',closeCellMenu);
el('rows').addEventListener('keydown',event=>{if(event.isComposing)return;const target=event.target,control=target.matches('input,textarea'),r=end[0],c=end[1];
if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='a'&&!editing){event.preventDefault();anchor=[0,0];end=[grid.plan(rows.length).capacity-1,12];paint();return;}
if(event.key==='F2'&&control){event.preventDefault();editing=true;return;}
if(event.key==='Escape'){event.preventDefault();focusCell(r,c);return;}
if(event.key==='Enter'&&target.matches('textarea')&&event.altKey){event.preventDefault();if(target.readOnly)return;target.setRangeText('\n',target.selectionStart,target.selectionEnd,'end');writeInput(target);return;}
if(event.key==='Enter'&&!event.altKey&&target.matches('textarea')&&window.matchMedia('(any-pointer: coarse)').matches)return;
if(event.key==='Delete'&&!editing){event.preventDefault();try{clearSelection();}catch(e){status(e.message);}return;}
const directions={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]};if(directions[event.key]&&(!editing||event.shiftKey)){event.preventDefault();const[dr,dc]=directions[event.key];focusCell(r+dr,c+dc,event.shiftKey);return;}
if(event.key==='Enter'){event.preventDefault();focusCell(r+(event.shiftKey?-1:1),c);return;}
if(event.key==='Tab'){const index=r*13+c+(event.shiftKey?-1:1);if(index<0||index>=grid.plan(rows.length).capacity*13)return;event.preventDefault();focusCell(Math.floor(index/13),index%13);return;}
});
el('add-row').addEventListener('click',()=>{if(structureLocked())return;remember();rows.push(blank());changed();render();focusCell(rows.length-1,0);});
el('add-page').addEventListener('click',()=>{if(structureLocked())return;const layout=grid.plan(rows.length),next=layout.capacity+24,first=layout.capacity;remember();while(rows.length<next)rows.push(blank());changed();render();focusCell(first,0);status('次の1ページ分の明細行を追加しました。');});
el('insert-row').addEventListener('click',()=>{if(structureLocked())return;const at=Math.min(bounds()[0],rows.length);remember();rows.splice(at,0,blank());changed();render();focusCell(at,0);});
el('delete-row').addEventListener('click',()=>{if(structureLocked())return;const[a,b]=bounds();if(a>=rows.length){status('この空き行はまだ明細に追加されていません。');return;}remember();rows.splice(a,b-a+1);changed();render();focusCell(Math.min(a,Math.max(0,rows.length-1)),0);});
function undo(){if(!history.length)return;rows=history.pop();beforeEdit=null;changed();render();focusCell(end[0],end[1],true);el('undo').disabled=!history.length;status('直前の編集を1つ元に戻しました。');}
el('undo').addEventListener('click',undo);document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'&&!event.isComposing){event.preventDefault();undo();}});
el('save-estimate').addEventListener('click',async()=>{if(!jobId||blocked)return;const saveButton=el('save-estimate');saveButton.disabled=true;const snapshot=structuredClone(rows),fingerprint=opened.fingerprint;try{const write=async()=>{if(window.cloudRuntime)await window.cloudRuntime.checkAccess();const saved=store.save(jobId,snapshot,fingerprint);if(window.cloudRuntime)await window.cloudRuntime.flush();return saved;};opened=navigator.locks?.request?await navigator.locks.request('construction-demo-write',write):await write();dirty=JSON.stringify(rows)!==JSON.stringify(snapshot);saveButton.textContent=dirty?'見積を保存（未保存）':'見積を保存';status(dirty?'保存しました。保存中の追加変更はもう一度保存してください。':'この工事の見積を保存しました。');}catch(e){status(e.message+' 入力内容は画面に残っています。');}finally{saveButton.disabled=blocked;}});
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
el('estimate-notice').classList.toggle('is-important',blocked);
render();

function recalculate() {
 let cost=0,quote=0;
 Array.from({length:grid.plan(rows.length).capacity},(_,i)=>rows[i]||blank()).forEach((row,index)=>{
  for(const side of ['c','q']) {
   const value=amount(row,side);
   el('rows').querySelector(`[data-amount="${side}-${index}"]`).textContent=value===null?'':money(value);
   if(side==='c')cost+=value??0; else quote+=value??0;
  }
 });
 const rate=Number(opened?.job.taxRate??10),ct=Math.floor(cost*rate/100),qt=Math.floor(quote*rate/100);el('estimate-tax').textContent='金額は税抜・円 ／ 工事の税率 '+rate+'%';
 const totals=[['小計',cost,quote],['消費税（'+rate+'%）',ct,qt],['税込合計',cost+ct,quote+qt]];
 el('summary-rows').innerHTML=totals.map(([label,c,q])=>`<tr><th colspan="6" scope="row">${label}</th><td>${money(c)}</td><td colspan="3"></td><td>${money(q)}</td><td colspan="2"></td></tr>`).join('');
 for(const [prefix,net,tax] of [['cost',cost,ct],['quote',quote,qt]]) {
  el(prefix+'-net').textContent=money(net);el(prefix+'-tax').textContent=money(tax);el(prefix+'-gross').textContent=money(net+tax);
 }
 el('profit').textContent=money(quote-cost);
 el('profit-rate').textContent=quote?((quote-cost)/quote*100).toFixed(1)+'%':'—';
}

})();
