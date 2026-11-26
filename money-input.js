/* 表示だけ3桁区切りにし、入力イベントと保存用の値はカンマなしにする。 */
(function(root){'use strict';
const raw=value=>String(value??'').replaceAll(',','').trim();
function format(value){const valueRaw=raw(value);const m=valueRaw.match(/^([+-]?)(\d+)(\.\d*)?$/);return m?m[1]+m[2].replace(/\B(?=(\d{3})+(?!\d))/g,',')+(m[3]||''):valueRaw;}
if(typeof module==='object'&&module.exports){module.exports={raw,format};return;}
root.moneyInput={raw,format};const selector='input[data-money],input[data-pay-amount]';
const style=document.createElement('style');style.textContent=':root{--input-dropdown-arrow:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 12 12%27%3E%3Cpath d=%27M3 4.5l3 3 3-3%27 fill=%27none%27 stroke=%27%23253443%27 stroke-width=%271.3%27/%3E%3C/svg%3E")}input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}input[type=number]{-moz-appearance:textfield;appearance:textfield}.money-input{text-align:right;font-variant-numeric:tabular-nums}select:not([multiple]):not([size]){appearance:none;-webkit-appearance:none;background-image:var(--input-dropdown-arrow);background-position:right 9px center;background-repeat:no-repeat;background-size:12px 12px;padding-right:28px!important}';document.head.append(style);
function display(input){if(input?.isConnected&&input.matches(selector))input.value=format(input.value);}
function enhance(){document.querySelectorAll(selector).forEach(input=>{if(!input.classList.contains('money-input')){input.type='text';input.inputMode='decimal';input.classList.add('money-input');input.setAttribute('autocomplete','off');if(input!==document.activeElement)display(input);}});}

for(const type of ['input','change'])document.addEventListener(type,e=>{if(e.target.matches?.(selector)){const t=e.target,value=raw(t.value);if(value!==t.value){const p=t.selectionStart,n=(t.value.slice(0,p).match(/,/g)||[]).length;t.value=value;if(p!==null)t.setSelectionRange(Math.max(0,p-n),Math.max(0,p-n));}}},true);
document.addEventListener('focusout',e=>{if(e.target.matches?.(selector))queueMicrotask(()=>display(e.target));});
document.addEventListener('keydown',e=>{if(e.target.matches?.('input[type=number]')&&['ArrowUp','ArrowDown'].includes(e.key))e.preventDefault();if(e.key==='Enter'&&e.target.matches?.(selector))queueMicrotask(()=>display(e.target));},true);
function start(){enhance();new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(typeof window==='object'?window:globalThis);
