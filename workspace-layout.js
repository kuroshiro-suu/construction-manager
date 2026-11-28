/* 表示の配置だけを変更。権限・保存・会社スコープには触れない。 */
(()=>{'use strict';
function arrange(){const banner=document.querySelector('.cloud-save-banner');if(!banner||!banner.textContent.startsWith('保存先：'))return false;
 observer.disconnect();document.body.classList.add('workspace-compact');
 const brand=document.createElement('strong');brand.className='workspace-app-name';brand.innerHTML="<span class=\"yui-brand\" aria-label=\"Yui-Pad 工事・収支管理システム\"><img src=\"yui-mark.svg?v=20261128-yui3\" width=\"26\" height=\"26\" alt=\"\"><strong>Yui-Pad</strong><span class=\"yui-descriptor\">工事・収支管理システム</span></span>";banner.prepend(brand);
 const header=document.querySelector('body>header,main>header,.shell>header');
 if(header){for(const n of header.querySelectorAll('.brand, :scope>span')){if(n.textContent.includes('Yui-Pad')){const screen=n.querySelector('#section-screen-name');if(screen){header.prepend(screen);screen.classList.add('workspace-title');}n.classList.add('workspace-old-brand');}}
 if(header.classList.contains('brand'))header.classList.add('workspace-home-header');
 const panel=document.body.dataset.page==='index'?document.querySelector(new URLSearchParams(location.search).get('view')==='finance'?'#finance-panel .toolbar':'#jobs-panel .toolbar'):null;
 const heading=panel||document.querySelector('.page-heading,.page-head,.heading,.detailtop');
 if(panel){document.getElementById('section-screen-name')?.classList.add('workspace-old-brand');const nav=document.querySelector('.page-navigation,.home-return');if(nav&&!header.contains(nav))header.append(nav);}
 if(heading&&!heading.contains(header)){heading.classList.add('workspace-heading');header.classList.add('workspace-navigation');heading.append(header);}
 else if(!heading){header.classList.add('workspace-navigation');const nav=document.querySelector('.page-navigation');if(nav&&!header.contains(nav))header.append(nav);}
 }
 document.querySelectorAll('p.prototype-note').forEach(n=>{if(n.textContent.trim()==='保存先は、上部に表示された事業者のクラウドです。')n.classList.add('workspace-repeated-storage');});
 return true;}
const observer=new MutationObserver(arrange);observer.observe(document.body,{childList:true,subtree:true});arrange();})();
