/* 発注書・請書。保存済みスナップショットから見本の書式へ転記する。 */
(function(root){'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const day=v=>v?esc(String(v).replaceAll('-','/')):'—';
function render(s){const j=s.job,b=s.business,ack=s.type==='ack',no=s.jobNo||j.id;
const pair=(label,value)=>'<div class="pair"><label>'+label+'</label><b>'+esc(value||'—')+'</b></div>';
const seal=b.sealData?.startsWith('data:image/png;base64,')?'<img class="contract-seal" alt="印影" src="'+esc(b.sealData)+'">':'';
const customer='<div class="party"><h2>発注者</h2>'+pair('住所：',j.address)+pair('氏名：',[j.client,j.client?(j.honorific||'様'):''].filter(Boolean).join(' '))+'</div>';
const contractor='<div class="party contractor"><h2>受注者</h2>'+pair('住所：',[b.postalCode?'〒'+b.postalCode:'',b.address].filter(Boolean).join(' '))+pair('氏名：',b.businessName)+pair('電話番号：',b.phone)+seal+'</div>';
const amount=j.contract==null||j.contract===''?'—':'金 '+(Number(j.contract)+Math.floor(Number(j.contract)*(j.taxRate??10)/100)).toLocaleString('ja-JP',{maximumFractionDigits:6})+' 円';
const item=(label,value)=>'<div class="item"><label>'+label+'</label><div class="val">'+value+'</div></div>';
return '<section class="paper contract-paper'+(ack?' contract-ack':'')+'"><div class="contract-top"><div class="empty"></div><h1>'+esc(s.title)+'</h1><div class="right">'+(ack?'請書日：':'発注日：')+day(s.issueDate)+'<br>工事No.：'+esc(no)+'</div></div><div class="lead">'+(ack?'下記の工事について承諾し、お請けいたします。':'下記の工事を発注いたします。')+'</div>'+(ack?'<div class="contract-intro">'+customer+'<div class="stampbox">印紙</div></div>':'<div class="parties">'+customer+contractor+'</div>')+'<div class="sections">'+item('工事名',esc(j.name||'—'))+item('工事場所',esc(j.place||'—'))+item('工期','<div class="inline"><span>着手日：'+day(j.start)+'</span><span>完工日：'+day(j.end)+'</span></div>')+item('契約金額（税込）','<span class="contract-amount">'+esc(amount)+'</span>')+item('支払い条件',esc(j.paymentTerms||'—'))+'</div><div class="contract-note"><h2>備考</h2><p>1. 工事内容および仕様は、別途提示の見積書（本工事No.に対応するもの）によります。</p><p>2. 追加・変更工事が発生する場合は、双方協議のうえ合意後に実施するものとします。</p><p>3. '+(ack?'本請書を発注者に交付し、双方合意のうえ契約が成立するものとします。':'受注者から本注文に対応する請書が返送され、双方合意のうえ契約が成立するものとします。')+'</p></div>'+(ack?'<div class="contract-bottom"><div class="acceptor"><div>受注者</div>'+esc([b.postalCode?'〒'+b.postalCode:'',b.address].filter(Boolean).join(' '))+'<br><strong>'+esc(b.businessName)+'</strong><br>'+esc(b.phone?'TEL：'+b.phone:'')+seal+'</div></div>':'<div class="contract-sign"><label>発注者（署名）</label><div class="signature-line"></div><div class="stamp-hint">印</div></div>')+'<div class="page-footer"><span>工事No. '+esc(no)+'</span><span>1 / 1</span></div></section>';
}
const api={render};if(typeof module==='object'&&module.exports)module.exports=api;else root.contractReport=api;
})(typeof window==='object'?window:globalThis);
