/* 設定のUI試作。ユーザー管理や認証・権限の実装ではない。 */
(() => {
'use strict';
const el=id=>document.getElementById(id),key='construction_demo_v02';
if(window.cloudRuntime&&window.appAccess.user().role==='owner'){const resetLink=el('company-reset-link');resetLink.hidden=false;resetLink.href=window.jobHrefFor('company-reset.html');}
const items={business:['事業者情報設定','帳票に使う事業者情報をまとめる画面です。項目の詳細は、次の画面試作で確認します。'],users:['ユーザー管理','メンバーの招待・権限変更などの画面は、これから作成します。'],vendors:['業者マスター','業者情報を表でまとめて入力・編集する画面は、これから作成します。'],units:['単位マスター','見積の入力候補を追加・編集する画面は、これから作成します。'],tax:['標準消費税率','新しく登録する工事に適用します。既存工事の税率は変わりません。'],fiscal:['決算月','今期の開始日・終了日を決める設定です。\n3月決算の場合は、4月1日〜翌年3月31日の1年間を1期として集計します。']};
let selected='',opener=null;
function read(){const raw=window.appStorage.getItem(key);const value=raw?JSON.parse(raw):{};if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('設定データを読み取れません');return value;}
function refresh(){try{const data=read();el('tax-value').textContent=(data.standardTaxRate??10)+'%';el('fiscal-value').textContent=data.fiscalEndMonth?data.fiscalEndMonth+'月':'未設定';}catch(e){el('status').textContent='保存済みの設定を読み取れませんでした。データは変更していません。';}}
for(let month=1;month<=12;month++){const option=document.createElement('option');option.value=month;option.textContent=month+'月';el('fiscal-input').append(option);}
function close(){el('setting-overlay').hidden=true;opener?.focus();}
for(const button of document.querySelectorAll('[data-setting]'))button.addEventListener('click',()=>{
 if(button.dataset.setting==='users'&&window.cloudRuntime){location.href=window.jobHrefFor('cloud-members.html');return;}if(button.dataset.setting==='users'){location.href='auth.html?screen=members';return;}
 if(button.dataset.setting==='business'){location.href=window.jobHrefFor('business.html');return;}
 if(button.dataset.setting==='units'){location.href=window.jobHrefFor('units.html');return;}
 if(button.dataset.setting==='vendors'){location.href=window.jobHrefFor('vendors.html');return;}
 selected=button.dataset.setting;opener=button;const [title,description]=items[selected];el('editor-heading').textContent=title;el('editor-description').textContent=description;
 el('tax-field').hidden=selected!=='tax';el('fiscal-field').hidden=selected!=='fiscal';el('save-setting').hidden=!['tax','fiscal'].includes(selected);el('editor-help').textContent='';
 if(selected==='tax'||selected==='fiscal'){try{const data=read();el('tax-input').value=data.standardTaxRate??10;el('fiscal-input').value=data.fiscalEndMonth??'';}catch(e){el('status').textContent='設定を読み取れないため、編集を開けません。';return;}}
 el('setting-overlay').hidden=false;el('tax-input').required=selected==='tax';(selected==='tax'?el('tax-input'):selected==='fiscal'?el('fiscal-input'):el('close-editor')).focus();
});
el('close-editor').addEventListener('click',close);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!el('setting-overlay').hidden)close();});
el('setting-form').addEventListener('submit',async event=>{event.preventDefault();if(!['tax','fiscal'].includes(selected))return;try{const data=read();if(selected==='tax'){const value=el('tax-input').valueAsNumber;if(!Number.isFinite(value)||value<0)return;data.standardTaxRate=value;}else data.fiscalEndMonth=el('fiscal-input').value?Number(el('fiscal-input').value):null;if(window.cloudRuntime)await window.cloudRuntime.checkAccess();window.appStorage.setItem(key,JSON.stringify(data));if(window.cloudRuntime)await window.cloudRuntime.flush();close();refresh();el('status').textContent=items[selected][0]+(window.cloudRuntime?'をクラウドに保存しました。':'をこのブラウザの試作品内に保存しました。');}catch(e){el('editor-help').textContent='保存できませんでした。既存データを上書きしていません。';}});
refresh();
})();
