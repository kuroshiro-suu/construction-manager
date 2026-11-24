(async()=>{'use strict';window.betaAllowed=true;const c=window.betaConfig;if(!c?.enabled)return;const key='construction_beta_access_v1';let remembered=false;try{remembered=localStorage.getItem(key)===c.passwordHash&&/^[a-f0-9]{64}$/.test(c.passwordHash);}catch{}if(remembered)return;
window.betaAllowed=false;const target=new URL('beta-access.html',location.href);target.searchParams.set('next',location.pathname.split('/').pop()+location.search+location.hash);location.replace(target.href);
})();
