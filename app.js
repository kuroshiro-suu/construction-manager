/* 工事進捗管理 v0.2: UIのみのローカル試作。本番用の認証・権限・採番・保存ではありません。 */
(function(){'use strict';
const KEY='construction_demo_v02';let progressClearing=false;
const statuses=['未受注','受注','完工','計上','complete','不調'];
const initial={jobs:[
{id:'20270001-01',name:'田中邸 浴室改修工事',category:'元請',client:'田中 太郎',honorific:'様',address:'岡山市北区〇〇',phone:'086-000-0000',start:'2027-01-10',end:'2027-01-25',ordered:'2027-01-05',completed:'',posted:'',lost:false,contract:1850000,budget:1350000,income:[{amount:1850000,received:false}],history:[{type:'見積書',date:'2027-01-05'}]},
{id:'20270002-01',name:'山本邸 外壁塗装工事',category:'元請',client:'山本様',honorific:'様',address:'',phone:'',start:'2027-01-04',end:'2027-01-19',ordered:'2026-12-20',completed:'2027-01-18',posted:'2027-01-25',lost:false,contract:2400000,budget:1700000,income:[{amount:2400000,received:false}],history:[{type:'見積書',date:'2026-12-10'},{type:'請求書',date:'2027-01-25'}]},
{id:'20270003-01',name:'佐藤邸 キッチン改修',category:'下請',client:'〇〇工務店',honorific:'御中',address:'',phone:'',start:'2027-01-15',end:'2027-02-05',ordered:'2027-01-08',completed:'2027-02-04',posted:'',lost:false,contract:1280000,budget:900000,income:[{amount:1280000,received:false}],history:[]},
{id:'20270004-01',name:'鈴木邸 給湯器交換',category:'元請',client:'鈴木様',honorific:'様',address:'',phone:'',start:'2027-01-08',end:'2027-01-08',ordered:'2027-01-01',completed:'2027-01-08',posted:'2027-01-10',lost:false,contract:350000,budget:240000,income:[{amount:350000,received:true}],history:[{type:'請求書',date:'2027-01-10'}]},
{id:'20270005-01',name:'高橋邸 洗面所改修',category:'元請',client:'高橋様',honorific:'様',address:'',phone:'',start:'',end:'',ordered:'',completed:'',posted:'',lost:false,contract:null,budget:null,income:[],history:[]},
{id:'20270006-01',name:'中村邸 建具交換',category:'下請',client:'中村様',honorific:'様',address:'',phone:'',start:'',end:'',ordered:'',completed:'',posted:'',lost:true,contract:120000,budget:80000,income:[],history:[]}
],payments:[
{id:'p1',job:'20270001-01',vendor:'岡山設備',due:'2027-02-25',budget:280000,amount:null,paid:false},
{id:'p2',job:'20270001-01',vendor:'山陽内装',due:'2027-02-25',budget:150000,amount:null,paid:false},
{id:'p3',job:'20270002-01',vendor:'山陽内装',due:'2027-02-28',budget:420000,amount:435000,paid:false},
{id:'p4',job:'20270002-01',vendor:'備前電工',due:'2027-02-28',budget:95000,amount:95000,paid:false},
{id:'p5',job:'20270003-01',vendor:'岡山建築',due:'2027-03-25',budget:540000,amount:null,paid:false},
{id:'p6',job:'20270004-01',vendor:'岡山設備',due:'2027-02-25',budget:240000,amount:240000,paid:true}
]};
let db; try{db=JSON.parse(window.appStorage.getItem(KEY))}catch(e){} if(!db || !Array.isArray(db.jobs)||!Array.isArray(db.payments)) {const preferences={standardTaxRate:db?.standardTaxRate,fiscalEndMonth:db?.fiscalEndMonth};db={...structuredClone(initial),...preferences};}
if(window.appStorage.getItem(KEY)===null)window.appStorage.setItem(KEY,JSON.stringify(db));
else{try{const settingsOnly=JSON.parse(window.appStorage.getItem(KEY));if(settingsOnly&&typeof settingsOnly==='object'&&!Array.isArray(settingsOnly)&&settingsOnly.jobs===undefined&&settingsOnly.payments===undefined){db={...settingsOnly,jobs:db.jobs,payments:db.payments};window.appStorage.setItem(KEY,JSON.stringify(db));}}catch(e){/* 読めない保存データを初期サンプルで上書きしない。 */}}
let persistedSnapshot=window.appStorage.getItem(KEY);
function persist(){const latestRaw=window.appStorage.getItem(KEY);if(latestRaw!==persistedSnapshot){let onlyHistory=false;try{const before=JSON.parse(persistedSnapshot),latest=JSON.parse(latestRaw);const stripped=value=>{const next=structuredClone(value);for(const job of next.jobs)delete job.history;return JSON.stringify(next);};onlyHistory=stripped(before)===stripped(latest);if(onlyHistory)for(const job of db.jobs){const saved=latest.jobs.find(j=>j.id===job.id);if(saved)job.history=structuredClone(saved.history||[]);}}catch{}if(!onlyHistory){toast('別の画面でデータが更新されています。開き直してから保存してください。');throw Error('保存競合：既存データは変更していません。');}}const serialized=JSON.stringify(db);window.appStorage.setItem(KEY,serialized);persistedSnapshot=serialized;}
const el=id=>document.getElementById(id),yen=n=>n==null?'—':'¥'+Number(n).toLocaleString('ja-JP'),html=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const demoTaxRate = 10;
const standardTaxRate = () => db.standardTaxRate ?? demoTaxRate;

function contractAmount(job) {
  if (job.contract == null || job.contract === '') return '—';
  const net = Number(job.contract);
  if (!Number.isFinite(net)) return '—';
  const gross = net + Math.floor(net * (job.taxRate ?? demoTaxRate) / 100);
  return `${net.toLocaleString('ja-JP')}（${gross.toLocaleString('ja-JP')}）`;
}

function jobPeriod(job) {
  if (!job.start && !job.end) return '—';
  const format = value => value ? html(value.replaceAll('-', '/')) : '—';
  return `${format(job.start)}〜${format(job.end)}`;
}

function jobHref(id) {
  return window.jobHrefFor('construction.html?id=' + encodeURIComponent(id));
}
function payrows(j){return db.payments.filter(p=>p.job===j.id)}
function hasPending(j){return payrows(j).some(p=>p.amount===null||p.amount===''||p.amount===undefined)}
function isComplete(j){if(!j.posted||hasPending(j)||!j.income.length)return false;try{const balances=window.cashLedger.position(j,db.payments);return balances.incomes.every(r=>r.remaining===0)&&balances.payments.every(r=>r.remaining===0);}catch{return false;}}
function status(j){return j.lost?'不調':isComplete(j)?'complete':j.posted?'計上':j.completed?'完工':j.ordered?'受注':'未受注'}
function pill(s){return `<span class="badge" data-status="${s}">${s}</span>`}
let on=['未受注','受注','完工','計上','complete'];
function toast(msg){const t=el('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2400)}
let confirmFn=null;
function closeModal(){el('modalwrap').classList.remove('open');confirmFn=null;el('modal-confirm').classList.add('hidden')}
function modal(title,content,confirmLabel,callback){el('modal-title').textContent=title;el('modal-content').innerHTML=content;const b=el('modal-confirm');b.classList.toggle('hidden',!callback);b.textContent=confirmLabel||'登録';b.disabled=false;confirmFn=callback||null;el('modalwrap').classList.add('open')}
el('modal-close').addEventListener('click',closeModal);el('modalwrap').addEventListener('click',e=>{if(e.target===el('modalwrap'))closeModal()});el('modal-confirm').addEventListener('click',()=>confirmFn?.());
function newId(){const year=new Date().getFullYear().toString();let max=0;for(const j of db.jobs){if(j.id.startsWith(year)&&j.id.endsWith('-01'))max=Math.max(max,Number(j.id.slice(4,8))||0)}return year+String(max+1).padStart(4,'0')+'-01'}
function openNewJob(){if(window.cloudRuntime){modal('工事の仮登録','<div class="field"><label for="newjob-name">工事名</label><input id="newjob-name"></div>','工事登録',async()=>{const name=el('newjob-name').value.trim();if(!name){toast('工事名を入力してください');return;}el('modal-confirm').disabled=true;try{const saved=await window.cloudRuntime.createJob(name);location.href=jobHref(saved.id);}catch(e){toast(e.message);el('modal-confirm').disabled=false;}});return;}modal('工事の仮登録','<div class="stack"><div class="field"><label for="newjob-name">工事名</label><input id="newjob-name" placeholder="例：田中邸 給湯器交換"></div><p class="inlinehelp">工事No.は試作品内で仮採番します。本番ではサーバー上で自動採番します。</p></div>','工事登録',()=>{const name=el('newjob-name').value.trim();if(!name){toast('工事名を入力してください');return}const id=newId();db.jobs.unshift({id,name,createdByUserId:window.appAccess.user()?.id,category:'元請',client:'',honorific:'様',address:'',phone:'',start:'',end:'',ordered:'',completed:'',posted:'',lost:false,contract:null,budget:null,taxRate:standardTaxRate(),income:[],history:[]});persist();location.href=jobHref(id)});const input=el('newjob-name');input.focus();input.addEventListener('keydown',event=>{if(event.key==='Enter')confirmFn?.()})}
function openSettings() {
  modal('設定', `
    <div class="settings-menu">
      ${['事業者情報設定','業者マスター','単位マスター','ユーザー管理'].map(name => `<button type="button" class="btn" data-settings-preview="${name}">${name}</button>`).join('')}
    </div>
    <form id="tax-settings" class="settings-tax">
      <div class="field">
        <label for="standard-tax">標準消費税率（%）</label>
        <input id="standard-tax" type="number" min="0" step="any" required value="${html(standardTaxRate())}">
      </div>
      <p class="inlinehelp">新しく仮登録する工事に適用します。</p>
      <div class="field"><label for="fiscal-month">決算月</label><select id="fiscal-month"><option value="">未設定</option>${Array.from({length:12},(_,i)=>`<option value="${i+1}" ${Number(db.fiscalEndMonth)===i+1?'selected':''}>${i+1}月</option>`).join('')}</select></div>
    </form>
    <p class="inlinehelp">標準消費税率と決算月は、このブラウザの試作品内に保存できます。他の設定は準備中です。</p>`,
    '保存', () => el('tax-settings').requestSubmit());
  document.querySelectorAll('[data-settings-preview]').forEach(button => {
    button.addEventListener('click', () => toast(`${button.dataset.settingsPreview}は準備中です`));
  });
  el('tax-settings').addEventListener('submit', event => {
    event.preventDefault();
    db.standardTaxRate = el('standard-tax').valueAsNumber;
    db.fiscalEndMonth = el('fiscal-month').value ? Number(el('fiscal-month').value) : null;
    persist();
    closeModal();
    toast('標準消費税率・決算月を保存しました');
  });
}

function topPage() {
  const filters = el('status-filters');
  filters.innerHTML = statuses.map(name => {
    const pressed = on.includes(name);
    return `<button type="button" class="lamp${pressed ? ' on' : ''}" data-status="${name}" aria-pressed="${pressed}">${name}</button>`;
  }).join('');

  function display() {
    const query = el('jobs-search').value.trim().toLowerCase();
    const jobs = db.jobs.slice().sort((a,b)=>window.listOrder.jobs(a,b,window.cloudRuntime?.jobNumbers||{})).map(job => ({job, state: status(job)})).filter(({job, state}) =>
      on.includes(state) && [job.name, job.client, job.id].join(' ').toLowerCase().includes(query));
    el('jobs-tbody').innerHTML = jobs.map(({job, state}) => `
      <tr>
        <td><a class="linkish" href="${jobHref(job.id)}">${html(job.name)}</a></td>
        <td>${html(job.client || '—')}</td>
        <td class="num">${jobPeriod(job)}</td>
        <td class="right num">${contractAmount(job)}</td>
        <td>${pill(state)}</td>
      </tr>`).join('') || '<tr><td colspan="5" class="no-data">該当する工事はありません</td></tr>';
    el('job-cards').innerHTML = jobs.map(({job, state}) => `
      <a class="jobcard job-link" href="${jobHref(job.id)}">
        <div class="cardrow"><span class="cardname">${html(job.name)}</span>${pill(state)}</div>
        <div class="cardbottom">
          <span class="job-meta"><span class="cardmeta">${html(job.client || '—')}</span><span class="num">${jobPeriod(job)}</span></span>
          <span class="cardmoney num">${contractAmount(job)}</span>
        </div>
      </a>`).join('') || '<div class="no-data">該当する工事はありません</div>';
    el('job-count').textContent = `${jobs.length}件表示 / 登録${db.jobs.length}件`;
  }

function payDisplay(){const q=el('pay-search').value.trim().toLowerCase(),mode=el('pay-sort').value;let list=db.payments.filter(p=>{const j=db.jobs.find(j=>j.id===p.job);return (p.vendor+(j?.name||'')).toLowerCase().includes(q)}).slice();list.sort((a,b)=>mode==='vendor'?a.vendor.localeCompare(b.vendor,'ja'):mode==='budget'?(b.budget||0)-(a.budget||0):mode==='blank'?Number(a.amount!==null)-Number(b.amount!==null):a.due.localeCompare(b.due));
el('pay-tbody').innerHTML=list.map(p=>{const j=db.jobs.find(j=>j.id===p.job);return `<tr><td>${html(p.vendor)}</td><td class="linkish" data-id="${html(p.job)}">${html(j?.name||p.job)}</td><td class="num">${html(p.due||'—')}</td><td class="right num">${yen(p.budget)}</td><td class="right num">${p.amount===null?'<span class="muted">空欄</span>':yen(p.amount)}</td><td>${p.paid?'支払済':'未払'}</td></tr>`}).join('')||'<tr><td colspan="6" class="no-data">支払情報がありません</td></tr>';
el('pay-cards').innerHTML=list.map(p=>{const j=db.jobs.find(j=>j.id===p.job);return `<div class="jobcard" data-id="${html(p.job)}"><div class="cardrow"><b>${html(p.vendor)}</b><b>${p.amount===null?'支払額：空欄':yen(p.amount)}</b></div><div class="cardbottom"><span class="cardmeta">${html(j?.name||p.job)}　${html(p.due||'')}</span><span class="muted">${p.paid?'支払済':'未払'}</span></div></div>`}).join('');el('pay-count').textContent=`${list.length}件の支払明細。未確定金額も表示。`}

  document.querySelectorAll('[data-tab]').forEach(button => {
    button.addEventListener('click', () => {
      const tab = button.dataset.tab;
      document.querySelectorAll('[data-tab]').forEach(item => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      el('jobs-panel').classList.toggle('hidden', tab !== 'jobs');
      el('finance-panel').classList.toggle('hidden', tab !== 'finance');
    });
  });

  const financeButtons = document.querySelectorAll('[data-finance]');
  function showFinance(name) {
    const payments = name === '支払一覧';
    financeButtons.forEach(button => button.removeAttribute('aria-pressed'));
    el('finance-preview').classList.toggle('hidden', payments);
    el('payments-panel').classList.toggle('hidden', !payments);
    el('finance-heading').textContent = name;
    if (payments) payDisplay();
  }
  financeButtons.forEach(button => button.addEventListener('click', () => { if (button.dataset.finance === '支出台帳') location.href = window.jobHrefFor('expenses.html'); else if (button.dataset.finance === '入金一覧') location.href = window.jobHrefFor('income-list.html'); else if (button.dataset.finance === '支払一覧') location.href = window.jobHrefFor('payment-list.html'); else if (button.dataset.finance === '収支台帳') location.href = window.jobHrefFor('cashbook.html'); else showFinance(button.dataset.finance); }));

  filters.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const state = button.dataset.status;
    const pressed = !on.includes(state);
    on = pressed ? [...on, state] : on.filter(item => item !== state);
    button.classList.toggle('on', pressed);
    button.setAttribute('aria-pressed', String(pressed));
    display();
  });
  el('jobs-search').addEventListener('input', display);
  el('pay-search').addEventListener('input', payDisplay);
  el('pay-sort').addEventListener('change', payDisplay);
  el('payments-panel').addEventListener('click', event => {
    const target = event.target.closest('[data-id]');
    if (target) location.href = jobHref(target.dataset.id);
  });
  document.querySelector('[data-modal="newjob"]').addEventListener('click', openNewJob);
  document.querySelector('[data-modal="settings"]').addEventListener('click', () => { location.href=window.jobHrefFor('settings.html'); });

  display();
  showFinance('');
  const entryView = new URLSearchParams(location.search).get('view');
  const screenName=entryView==='finance'?'収支トップ':'工事一覧';const screenLabel=document.getElementById('section-screen-name');if(screenLabel)screenLabel.textContent=screenName;document.title=screenName+'｜売上進捗管理システム';
  if (entryView === 'finance') document.querySelector('[data-tab="finance"]').click();
  if (entryView === 'settings') {
    location.replace('settings.html');
  }
}
function detailPage(){const params=new URLSearchParams(location.search),id=params.get('id')||db.jobs[0].id;let job=db.jobs.find(j=>j.id===id);if(!job){location.href='index.html';return}

const guestModel=window.guestPermissions;let guests=[];function loadGuests(){guests=window.memberStore.guests(window.memberStore.read(window.appStorage.getItem(window.memberStore.KEY)));}try{loadGuests();}catch(e){toast(e.message);el('save-job').disabled=true;}
let guestIds=guestModel.sanitize(job.guestEditorIds||[],guests,job.createdByUserId);
function renderGuestPermissions(){
 try{loadGuests();}catch(e){el('guest-permission-list').textContent=e.message;el('save-job').disabled=true;return;}
 const locked=Boolean(job.ordered||el('order-date').value);
 const permitted=guests.filter(u=>u.id===job.createdByUserId||guestIds.includes(u.id));
 el('guest-permission-summary').textContent=locked?'受注後はゲストの操作対象外':permitted.length?'許可中：'+permitted.map(u=>u.name).join('、'):'許可しているゲストなし';
 el('guest-permission-list').innerHTML=!guests.length?'<p class="sectionhint">登録されたゲストはまだいません。<a href="auth.html?screen=members">ユーザー管理へ</a></p>':guests.map(u=>u.id===job.createdByUserId?'<div class="guest-person"><span>'+html(u.name)+'</span><span class="guest-creator">登録者</span></div>':'<label class="guest-person"><input type="checkbox" data-guest-id="'+html(u.id)+'" '+(guestIds.includes(u.id)?'checked ':'')+(locked?'disabled':'')+'><span>'+html(u.name)+'</span></label>').join('');

}
el('guest-permission-list').addEventListener('change',event=>{if(!event.target.matches('[data-guest-id]'))return;if(job.ordered||el('order-date').value){renderGuestPermissions();return;}guestIds=Array.from(el('guest-permission-list').querySelectorAll('[data-guest-id]:checked'),input=>input.dataset.guestId);renderGuestPermissions();});
el('order-date').addEventListener('change',renderGuestPermissions);
const extraFields={'job-place':'place','actual-start':'actualStart','actual-end':'actualEnd','estimate-date':'estimateDate','estimate-expiry':'estimateExpiry','payment-terms':'paymentTerms','estimate-terms':'estimateTerms'};
function fill(){for(const [field,key] of Object.entries(extraFields))el(field).value=job[key]||'';el('memorandum-link').href='memorandum.html?id='+encodeURIComponent(job.id);el('job-number').textContent='工事No. '+(window.cloudRuntime?.jobNo||job.id);el('job-name').value=job.name;document.querySelectorAll('[name=category]').forEach(r=>r.checked=r.value===job.category);el('client-name').value=job.client||'';el('honorific').value=job.honorific||'様';el('client-address').value=job.address||'';el('client-phone').value=job.phone||'';el('period-start').value=job.start||'';el('period-end').value=job.end||'';el('order-date').value=job.ordered||'';el('completion-date').value=job.completed||'';el('posting-date').value=job.posted||'';render()}
function render(){const user=window.appAccess.user();for(const kind of ['order','completion','posting']){const b=el(kind+'-clear');b.disabled=progressClearing||!window.jobActions.canClear(user,job,kind);b.title=kind==='order'&&job.completed?'先に完工・計上を解除してください。':kind==='completion'&&job.posted?'先に計上を解除してください。':'';}let lostPanel=el('lost-actions-panel');if(!lostPanel){lostPanel=document.createElement('section');lostPanel.id='lost-actions-panel';lostPanel.innerHTML='<p>この工事は不調です。</p><button id=lost-restore-top>未受注に戻す</button> <button id=lost-delete-top>削除する</button>';el('job-name').closest('main').prepend(lostPanel);el('lost-restore-top').onclick=()=>el('lost-job').click();el('lost-delete-top').onclick=()=>el('delete-job').click();}lostPanel.hidden=!job.lost;el('lost-restore-top').disabled=!['owner','F'].includes(user?.role);el('lost-delete-top').disabled=!window.jobActions.canDelete(user,job);el('lost-job').textContent=job.ordered?'受注解除':job.lost?'未受注に戻す':'不調にする';el('lost-job').disabled=!['owner','F'].includes(user?.role)||(!!job.ordered&&!window.jobActions.canCancel(job,payrows(job)));el('delete-job').disabled=!window.jobActions.canDelete(user,job);el('order-action').disabled=!!(job.ordered||job.posted||job.lost);el('completion-action').disabled=!!(job.completed||job.lost);el('completion-action').textContent=job.completed?'完工済み':'完工する';el('order-action').textContent=job.ordered?'受注済み':'受注する';el('posting-action').disabled=!!job.posted;el('posting-action').textContent=job.posted?'計上済み':'計上する';document.querySelectorAll('[name=category]').forEach(r=>r.disabled=!!job.ordered);renderGuestPermissions();const s=status(job);el('detail-status').textContent=s;el('detail-status').dataset.status=s;el('metric-contract').textContent=yen(job.contract);el('metric-budget').textContent=yen(job.budget);const profit=job.contract!=null&&job.budget!=null?job.contract-job.budget:null;el('metric-profit').textContent=yen(profit);el('metric-rate').textContent=profit!==null&&job.contract?((profit/job.contract)*100).toFixed(1)+'%':'—';el('actual-metrics').classList.remove('hidden');
if(job.posted){const extra=job.internalActual||0;const actual=payrows(job).reduce((n,p)=>n+(Number(p.amount)||0),0)+extra;el('metric-actual').textContent=yen(actual);el('metric-actualprofit').textContent=job.contract==null?'—':yen(job.contract-actual);el('metric-actualrate').textContent=job.contract?((job.contract-actual)/job.contract*100).toFixed(1)+'%':'—';el('metrics-hint').textContent='デモ：実績原価は手入力された支払額の合計です。自社人工の実績評価は未設計。'}else{for(const id of ['metric-actual','metric-actualprofit','metric-actualrate'])el(id).textContent='—';el('metrics-hint').textContent='実績は計上後に表示します。'}
const hist=job.history||[];el('history-summary').textContent=hist.length?hist.slice(-3).map(x=>`${x.claimName||x.type} ${String(x.date).slice(0,10)}`).join(' ／ '):'出力履歴なし'}
function readForm(){return {...Object.fromEntries(Object.entries(extraFields).map(([field,key])=>[key,el(field).value])),name:el('job-name').value.trim(),category:document.querySelector('[name=category]:checked')?.value||'元請',client:el('client-name').value.trim(),honorific:el('honorific').value,address:el('client-address').value,phone:el('client-phone').value,start:el('period-start').value,end:el('period-end').value,ordered:job.ordered||'',completed:job.completed||'',posted:job.posted||''}}
async function save(){if(window.cloudRuntime){try{await window.cloudRuntime.checkAccess();}catch(e){toast(e.message);return false;}}try{loadGuests();}catch(e){toast(e.message);return false;}const d=readForm();if(!d.name){toast('工事名を入力してください');return false}const before=structuredClone(job);Object.assign(job,d,{guestEditorIds:d.ordered?[]:window.cloudRuntime&&window.appAccess.user().role!=='owner'?(job.guestEditorIds||[]):guestModel.sanitize(guestIds,guests,job.createdByUserId)});try{persist();if(window.cloudRuntime)await window.cloudRuntime.flush();}catch(e){Object.keys(job).forEach(key=>delete job[key]);Object.assign(job,before);toast('保存できませんでした。'+e.message+' 入力内容は画面に残っています。');return false;}guestIds=[...job.guestEditorIds];render();toast('工事情報を更新しました');return true}
async function progressAction(kind){if(!await save())return;let items;try{items=window.progressModel.checks(db,job.id,kind);}catch(e){toast(e.message);return;}const order=kind==='order',complete=kind==='completion',actionName=order?'受注':complete?'完工':'計上',title=actionName+'する';modal(title,'<p class="inlinehelp">'+(complete?'実績工期を確認し、完工日を確定します。':order?'契約日を受注日として確定します。受注後は見積の提出側が編集できなくなります。':'請求・支払の予定と金額を確定します。計上後は見積の原価側・取引先も編集できなくなります。入金・支払の消込は後から行えます。')+'</p><ul class="progress-checks">'+items.map(r=>'<li class="'+(r.ok?'ok':'missing')+'">'+(r.ok?'☑ ':'□ ')+html(r.label)+'</li>').join('')+'</ul><a href="cash.html?id='+encodeURIComponent(job.id)+'">入金・支払を確認する →</a><div class="field progress-date"><label for="transition-date">'+(order?'受注日（契約日）':complete?'完工日':'計上日')+'</label><input type="date" id="transition-date"></div><p id="transition-error" role="alert"></p>','日付を確定して'+actionName,async()=>{try{const next=window.progressModel.transition(db,job.id,kind,el('transition-date').value),before=db;db=next;try{persist();if(window.cloudRuntime)await window.cloudRuntime.flush();}catch(e){db=before;throw e;}job=db.jobs.find(j=>j.id===id);guestIds=[...(job.guestEditorIds||[])];closeModal();if(!window.appAccess.jobRead(job)){location.href=window.jobHrefFor('index.html');return;}fill();toast(actionName+'しました');}catch(e){el('transition-error').textContent=e.message;}});el('modal-confirm').disabled=items.some(r=>!r.ok);}
async function clearProgress(kind){if(progressClearing||!window.jobActions.canClear(window.appAccess.user(),job,kind))return;progressClearing=true;const b=el(kind+'-clear');b.disabled=true;try{if(!window.cloudRuntime)throw Error('日付の解除はクラウド版で行ってください。');if(!await save())return;b.disabled=true;await window.cloudRuntime.jobAction('clear-'+kind,job.name);db=JSON.parse(window.appStorage.getItem(KEY));job=db.jobs.find(j=>j.id===id);fill();toast(({order:'受注',completion:'完工',posting:'計上'}[kind])+'日を解除しました。必要な条件を確認して、日付を確定し直せます。');}catch(e){toast(e.message);}finally{progressClearing=false;render();}}
for(const kind of ['order','completion','posting'])el(kind+'-clear').addEventListener('click',()=>clearProgress(kind));
el('completion-action').addEventListener('click',()=>progressAction('completion'));el('order-action').addEventListener('click',()=>progressAction('order'));el('posting-action').addEventListener('click',()=>progressAction('posting'));
function cashModal(){const pays=payrows(job);const rowHtml=pays.map(p=>`<div class="payline"><div><b>${html(p.vendor)}</b><small>実行予算 ${yen(p.budget)}</small></div><div class="field"><label>支払額（手入力）</label><input type="number" min="0" step="1" data-pay-amount="${p.id}" value="${p.amount??''}" placeholder="空欄"></div><div class="field"><label>支払予定日</label><input type="date" data-pay-due="${p.id}" value="${html(p.due||'')}"></div><label><input type="checkbox" data-pay-paid="${p.id}" ${p.paid?'checked':''}> 支払済</label></div>`).join('');const incomeHtml=(job.income||[]).map((r,i)=>`<label style="display:block;padding:8px 0;border-bottom:1px solid #ddd"><input style="width:auto" type="checkbox" data-income="${i}" ${r.received?'checked':''}> 入金消込　${yen(r.amount)}</label>`).join('');modal('入金・支払（簡易デモ）',`<p class="inlinehelp">このウィンドウは計上条件を試すための仮機能です。正式な支払・入金画面は未設計です。</p><h4>支払</h4>${rowHtml||'<p class="muted">支払明細なし</p>'}<h4>入金</h4>${incomeHtml||'<p class="muted">入金明細なし（詳細設計で追加予定）</p>'}`,'保存',()=>{const edits=[];for(const p of pays){const input=document.querySelector(`[data-pay-amount="${p.id}"]`),v=input.value.trim().replaceAll(',','');if(v!==''&&(!Number.isFinite(Number(v))||Number(v)<0)){toast('支払額は0以上の数値を入力してください');return}edits.push({p,amount:v===''?null:Number(v),due:document.querySelector(`[data-pay-due="${p.id}"]`).value,paid:document.querySelector(`[data-pay-paid="${p.id}"]`).checked})}for(const ed of edits){ed.p.amount=ed.amount;ed.p.due=ed.due;ed.p.paid=ed.paid}document.querySelectorAll('[data-income]').forEach(c=>job.income[Number(c.dataset.income)].received=c.checked);persist();closeModal();render();toast('デモの入出金情報を保存しました')})}
function branch(){modal('追加工事（枝番登録）','<div class="field"><label>追加工事名</label><input id="branch-name" placeholder="例：浴槽手直し"></div><p class="inlinehelp">同じ親番号で次の枝番を採番。施主・区分・工期の基本情報を引き継ぎ、金額と入出金は新規にします。</p>','追加登録',()=>{const name=el('branch-name').value.trim();if(!name){toast('追加工事名を入力してください');return}const prefix=job.id.slice(0,8),seq=Math.max(...db.jobs.filter(j=>j.id.startsWith(prefix+'-')).map(j=>Number(j.id.slice(9))||0),0)+1;if(seq>99){toast('枝番が上限です（試作仕様）');return}const id=prefix+'-'+String(seq).padStart(2,'0');const child={...job,id,name,estimate:undefined,memorandum:undefined,memorandums:undefined,settlementAdjustments:undefined,actualStart:'',actualEnd:'',estimateDate:'',guestEditorIds:[],createdByUserId:window.appAccess.user()?.id,ordered:'',completed:'',posted:'',lost:false,contract:null,budget:null,income:[],history:[]};db.jobs.unshift(child);persist();location.href='construction.html?id='+id})}
el('lost-job').onclick=()=>{const action=job.ordered?'cancel-order':job.lost?'restore':'lost';const label=action==='cancel-order'?'受注を解除して不調にする':action==='restore'?'未受注に戻す':'不調にする';modal(label,'<p>'+html(job.name)+'</p><p class="inlinehelp">見積・請求予定・帳票履歴は残します。'+(action==='cancel-order'?'受注日の確定を解除します。':'')+'</p>',label,async()=>{el('modal-confirm').disabled=true;try{if(window.cloudRuntime){await window.cloudRuntime.jobAction(action,job.name);location.href=window.cloudRuntime.href('index.html');}else{const before=structuredClone(job);job.lost=action!=='restore';if(action==='cancel-order')job.ordered='';try{persist();}catch(e){Object.assign(job,before);throw e;}location.href='index.html';}}catch(e){toast(/cm_job_action|schema cache|function.*not.*exist/i.test(e.message)?'状態変更のサーバー設定を反映してからお試しください。':e.message);el('modal-confirm').disabled=false;}});};
el('delete-job').onclick=()=>{if(!window.jobActions.canDelete(window.appAccess.user(),job))return;modal('工事削除','<p><strong>'+html(job.name)+'</strong></p><p>この工事の見積・入出金・帳票履歴をまとめて削除します。元に戻せません。</p><div class="field"><label for="delete-job-name">確認のため工事名を入力</label><input id="delete-job-name" autocomplete="off"></div>','この工事を削除',async()=>{if(el('delete-job-name').value!==job.name){toast('工事名を同じ文字で入力してください。');return;}el('modal-confirm').disabled=true;try{if(!window.cloudRuntime)throw Error('工事削除はクラウド版で行ってください。');await window.cloudRuntime.jobAction('delete',job.name);location.href=window.cloudRuntime.href('index.html');}catch(e){toast(/cm_job_action|schema cache|function.*not.*exist/i.test(e.message)?'削除機能のサーバー設定を反映してからお試しください。':e.message);el('modal-confirm').disabled=false;}});};
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>{switch(b.dataset.action){case 'branch':branch();break;case 'cash':location.href=window.jobHrefFor('cash.html?id='+encodeURIComponent(job.id));break;case 'history':window.openConstructionDocuments(job.id,'history');break;case 'estimate':location.href=window.jobHrefFor('estimate.html?id='+encodeURIComponent(job.id));break;case 'documents':window.openConstructionDocuments(job.id);break}}));
window.addEventListener('focus',renderGuestPermissions);window.addEventListener('storage',e=>{if(e.key===window.memberStore.KEY)renderGuestPermissions();});el('save-job').addEventListener('click',save);fill()}
if(document.body.dataset.page==='index')topPage();else detailPage();
})();
