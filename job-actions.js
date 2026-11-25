(function(root){'use strict';
function canDelete(user,job){return !!user&&!!job&&(['owner','F'].includes(user.role)||user.role==='guest'&&!job.ordered&&!job.lost&&(job.createdByUserId===user.id||(job.guestEditorIds||[]).includes(user.id)));}
function canCancel(job,payments=[]){return !!job?.ordered&&!job.completed&&!job.posted&&!(job.settlementAdjustments||[]).length&&[...(job.income||[]),...payments].every(r=>!r.actual&&!(Number(r.actualAmount)>0)&&!r.received&&!r.paid);}
const api={canDelete,canCancel};if(typeof module==='object'&&module.exports)module.exports=api;else root.jobActions=api;
})(typeof window==='object'?window:globalThis);
