/* 事業者情報の画面試作。入力・印影の永続保存や送信は行わない。 */
(() => {
'use strict';
const el=id=>document.getElementById(id);let imageUrl='',sealData='',businessReadable=true,originalBusiness=window.appStorage.getItem('construction_business_v1');
function clearSeal(){if(imageUrl)URL.revokeObjectURL(imageUrl);imageUrl='';sealData='';el('seal-preview').textContent='未選択';el('seal-file').value='';el('remove-seal').hidden=true;}
el('seal-file').addEventListener('change',()=>{
 const file=el('seal-file').files[0];if(!file)return;
 clearSeal();el('seal-status').textContent='';
 if(file.type!=='image/png'){el('seal-status').textContent='背景が透明なPNG画像を選んでください。';return;}
 imageUrl=URL.createObjectURL(file);const currentUrl=imageUrl,img=document.createElement('img');img.alt='選択した印影の見本';
 img.onload=()=>{
  if(imageUrl!==currentUrl)return;
  try{
   const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
   const context=canvas.getContext('2d');context.drawImage(img,0,0);
   const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
   let transparent=false,visible=false;
   for(let i=3;i<pixels.length;i+=4){if(pixels[i]===0)transparent=true;if(pixels[i]>0)visible=true;if(transparent&&visible)break;}
   if(!transparent||!visible){clearSeal();el('seal-status').textContent='背景が透明で、印影が写っているPNG画像を選んでください。';return;}
   sealData=canvas.toDataURL('image/png');el('seal-preview').replaceChildren(img);el('remove-seal').hidden=false;
  }catch(e){clearSeal();el('seal-status').textContent='画像を確認できませんでした。別の透過PNGを選んでください。';}
 };
 img.onerror=()=>{if(imageUrl!==currentUrl)return;clearSeal();el('seal-status').textContent='画像を読み取れませんでした。';};img.src=currentUrl;
});
el('remove-seal').addEventListener('click',()=>{clearSeal();el('seal-status').textContent='';});
const form=el('business-form');try{const saved=JSON.parse(originalBusiness||'null');if(saved&&(typeof saved!=='object'||Array.isArray(saved)))throw Error();if(saved){for(const field of form.elements){if(!field.name||field.type==='file')continue;if(field.type==='checkbox')field.checked=Array.isArray(saved[field.name])?saved[field.name].includes(field.value):!!saved[field.name];else field.value=saved[field.name]||'';}if(saved.sealData?.startsWith('data:image/png;base64,')){sealData=saved.sealData;const img=document.createElement('img');img.src=sealData;img.alt='保存済みの印影';el('seal-preview').replaceChildren(img);el('remove-seal').hidden=false;}}}catch{businessReadable=false;el('business-status').textContent='保存済み情報を読み取れません。上書きせず入力内容を控えてください。';}
form.addEventListener('submit',async event=>{event.preventDefault();try{if(!businessReadable)throw Error('保存済み情報を読み取れないため上書きできません。');if(window.appStorage.getItem('construction_business_v1')!==originalBusiness)throw Error('別の画面で事業者情報が変更されています。開き直してください。');const fd=new FormData(form),saved={};for(const field of form.elements){if(!field.name||field.type==='file')continue;if(field.type==='checkbox'){saved[field.name]=field.name==='printRepresentative'?field.checked:fd.getAll(field.name);}else saved[field.name]=field.value;}saved.sealData=sealData;const serialized=JSON.stringify(saved);if(window.cloudRuntime)await window.cloudRuntime.checkAccess();window.appStorage.setItem('construction_business_v1',serialized);if(window.cloudRuntime)await window.cloudRuntime.flush();originalBusiness=serialized;el('business-status').textContent='事業者情報を保存しました。帳票に反映します。';}catch(err){el('business-status').textContent=err.message;}});
window.addEventListener('pagehide',()=>{if(imageUrl)URL.revokeObjectURL(imageUrl);});
})();
