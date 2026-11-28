/* UI試作。既存マスターや工事データへは書き込まない。 */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const headers=['表示名','業者名','担当者','電話番号','FAX','メール','郵便番号','住所','金融機関','支店名','口座種別','口座番号','口座名義','締め日','支払日','備考'];
headers.push('業種','建設業の許可','石綿作業主任者');
const widths=[150,210,130,150,150,210,110,270,150,140,110,130,210,100,130,180];
widths.push(180,230,150);
const blank=()=>headers.map(()=>'');
const store=window.vendorStore.create(window.appStorage,window.appSessionStorage);let rows=[];try{rows=store.read();}catch(e){$('status').textContent=e.message;$('save').disabled=true;throw e;}if(!rows.length)rows=Array.from({length:12},blank);
let oldQualifications={};try{oldQualifications=JSON.parse(window.appSessionStorage.getItem('vendor_ui_qualifications')||'{}');}catch(e){}
rows=rows.map((r,i)=>window.vendorSchema.normalize(r,oldQualifications[i]||[]));
let baseline=JSON.stringify(rows);window.addEventListener('beforeunload',e=>{if(JSON.stringify(rows)!==baseline){e.preventDefault();e.returnValue='';}});
let anchor=[0,0],end=[0,0],history=[],before=null,dragging=false;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bounds=()=>[Math.min(anchor[0],end[0]),Math.max(anchor[0],end[0]),Math.min(anchor[1],end[1]),Math.max(anchor[1],end[1])];
function remember(snapshot=rows){history.push(structuredClone(snapshot));if(history.length>1)history.shift();$('undo').disabled=false;}
function paint(){const [r1,r2,c1,c2]=bounds();$('rows').querySelectorAll('input').forEach(i=>i.parentElement.classList.toggle('chosen',+i.dataset.r>=r1&&+i.dataset.r<=r2&&+i.dataset.c>=c1&&+i.dataset.c<=c2));$('selection').textContent=`${r1+1}〜${r2+1}行 ／ ${headers[c1]}${c1===c2?'':'〜'+headers[c2]}`;}
function render(){ before=null; $('grid').style.width=(46+widths.reduce((a,b)=>a+b,0))+'px'; $('headers').innerHTML='<tr><th aria-label="行番号">#</th>'+headers.map((h,c)=>`<th title="${h}" class="${c===18?'chief-header':''}" style="width:${widths[c]}px">${h}${c===0?' *':''}</th>`).join('')+'</tr>';$('rows').innerHTML=rows.map((row,r)=>'<tr><td>'+ (r+1)+'</td>'+row.map((v,c)=>`<td class="${c===18?'qualification-cell':''}"><input type="text" data-r="${r}" data-c="${c}" aria-label="${r+1}行目 ${headers[c]}" value="${esc(v)}"${c===10?' list="account-types"':''}></td>`).join('')+'</tr>').join('');$('count').textContent=`入力済み ${rows.filter(r=>r.some(Boolean)).length}件`;paint();}
function focus(r,c){r=Math.max(0,Math.min(rows.length-1,r));c=Math.max(0,Math.min(headers.length-1,c));anchor=end=[r,c];const input=$('rows').querySelector(`[data-r="${r}"][data-c="${c}"]`);input.focus();input.select();paint();}
function clear(){const [r1,r2,c1,c2]=bounds();remember();for(let r=r1;r<=r2;r++)for(let c=c1;c<=c2;c++)rows[r][c]='';render();focus(r1,c1);}
$('rows').addEventListener('pointerdown',e=>{if(e.button!==0||!e.target.matches('input'))return;const p=[+e.target.dataset.r,+e.target.dataset.c];if(!e.shiftKey)anchor=p;end=p;dragging=true;paint();});
$('rows').addEventListener('pointerover',e=>{if(dragging&&e.buttons===1&&e.target.matches('input')){end=[+e.target.dataset.r,+e.target.dataset.c];paint();}});document.addEventListener('pointerup',()=>dragging=false);
$('rows').addEventListener('focusin',e=>{if(e.target.matches('input'))before=structuredClone(rows);});
$('rows').addEventListener('input',e=>{const i=e.target;if(!i.matches('input'))return;if(before){remember(before);before=null;}rows[+i.dataset.r][+i.dataset.c]=i.value;});
function pasteRange(text,r=anchor[0],c=anchor[1]){let data;try{data=window.estimateGrid.parse(text);}catch(err){$('status').textContent=err.message+' 内容は変更していません。';return;}
 if(c===0&&data[0].length===headers.length&&data[0].every((v,i)=>v===headers[i]))data.shift();if(!data.length)return;
 if(data.some(row=>row.length!==data[0].length||row.length+c>headers.length||row.some((v,i)=>(c+i===10&&v!==''&&!['普通','当座'].includes(v))||(c+i===18&&v!==''&&v!=='〇')))){$('status').textContent='貼り付けできません。列数・列順、口座種別（普通／当座）、石綿作業主任者（〇／空欄）を確認してください。内容は変更していません。';return;}
 remember();while(rows.length<r+data.length)rows.push(blank());data.forEach((row,y)=>row.forEach((v,x)=>rows[r+y][c+x]=v));anchor=[r,c];end=[r+data.length-1,c+data[0].length-1];render();$('status').textContent=`${data.length}行 × ${data[0].length}列を貼り付けました。`;
}
$('rows').addEventListener('paste',e=>{if(!e.target.matches('input'))return;e.preventDefault();pasteRange(e.clipboardData.getData('text/plain'),+e.target.dataset.r,+e.target.dataset.c);});
function copy(e,cut=false){if(!e.target.matches('input'))return;const [r1,r2,c1,c2]=bounds();if(r1===r2&&c1===c2&&e.target.selectionStart!==e.target.selectionEnd)return;e.preventDefault();e.clipboardData.setData('text/plain',window.estimateGrid.encode(rows.slice(r1,r2+1).map(r=>r.slice(c1,c2+1))));if(cut)clear();}
$('rows').addEventListener('copy',e=>copy(e));$('rows').addEventListener('cut',e=>copy(e,true));
$('rows').addEventListener('keydown',e=>{if(e.isComposing)return;const i=e.target;if(!i.matches('input'))return;const r=+i.dataset.r,c=+i.dataset.c;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();undo();return;}
 if(e.key==='Delete'){e.preventDefault();clear();return;}
 if(e.shiftKey&&e.key.startsWith('Arrow')){e.preventDefault();const delta={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]}[e.key];end=[Math.max(0,Math.min(rows.length-1,end[0]+delta[0])),Math.max(0,Math.min(headers.length-1,end[1]+delta[1]))];paint();return;}
 let next=null;if(e.key==='Enter')next=[r+(e.shiftKey?-1:1),c];if(e.key==='Tab'){let n=r*headers.length+c+(e.shiftKey?-1:1);if(n>=0)next=[Math.floor(n/headers.length),n%headers.length];}
 if(e.key==='ArrowUp')next=[r-1,c];if(e.key==='ArrowDown')next=[r+1,c];if(e.key==='ArrowLeft')next=[r,c-1];if(e.key==='ArrowRight')next=[r,c+1];
 if(next){e.preventDefault();if(next[0]>=rows.length){remember();rows.push(blank());render();}focus(...next);}
});
function undo(){if(!history.length)return;rows=history.pop();anchor=end=[Math.min(anchor[0],rows.length-1),anchor[1]];render();$('undo').disabled=!history.length;$('status').textContent='直前の編集を元に戻しました。';}
$('undo').onclick=undo;$('add').onclick=()=>{remember();rows.push(...Array.from({length:10},blank));render();};$('insert').onclick=()=>{remember();const at=bounds()[0];rows.splice(at,0,blank());render();};$('delete').onclick=()=>{const [a,b]=bounds();remember();rows.splice(a,b-a+1);if(!rows.length)rows.push(blank());anchor=end=[Math.min(a,rows.length-1),0];render();};
$('save').onclick=async()=>{let invalid=[];rows.forEach((r,i)=>{if(r.some(Boolean)&&(!r[0].trim()||(r[10]&&!['普通','当座'].includes(r[10]))||(r[18]!==''&&r[18]!=='〇')))invalid.push(i);});$('rows').querySelectorAll('tr').forEach((tr,i)=>tr.querySelectorAll('td').forEach(td=>td.classList.toggle('invalid',invalid.includes(i))));$('status').textContent=invalid.length?`${invalid.map(i=>i+1).join('、')}行目の表示名・口座種別・石綿作業主任者（〇／空欄）を確認してください。`:'入力内容を確認しました。';if(!invalid.length){try{if(window.cloudRuntime)await window.cloudRuntime.checkAccess();store.save(rows);if(window.cloudRuntime)await window.cloudRuntime.flush();baseline=JSON.stringify(rows);$('status').textContent='保存しました。業者一覧・見積の取引先候補に反映しました。';}catch(e){$('status').textContent=e.message+' 入力内容はこの画面に残っています。';}}};

document.querySelector('.view-link').addEventListener('click',event=>{if(JSON.stringify(rows)!==baseline){event.preventDefault();$('status').textContent='変更が未保存です。「保存」してから業者一覧を開いてください。';}});
window.attachGridMenu({root:$('rows'),select:i=>{const p=[+i.dataset.r,+i.dataset.c],[a,b,c,d]=bounds();if(p[0]<a||p[0]>b||p[1]<c||p[1]>d)anchor=end=p;paint();},stamp:()=>JSON.stringify([rows,anchor,end]),copy:()=>{const[a,b,c,d]=bounds();return window.estimateGrid.encode(rows.slice(a,b+1).map(r=>r.slice(c,d+1)));},paste:pasteRange,clear,undo,status:message=>$('status').textContent=message});
const list=document.createElement('datalist');list.id='account-types';list.innerHTML='<option value="普通"><option value="当座">';document.body.append(list);render();
})();
