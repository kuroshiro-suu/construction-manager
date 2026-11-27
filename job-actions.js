(function(root){'use strict';
function canDelete(user,job){return !!user&&!!job&&(['owner','F'].includes(user.role)||user.role==='guest'&&!job.ordered&&!job.lost&&(job.createdByUserId===user.id||(job.guestEditorIds||[]).includes(user.id)));}
function canCancel(job,payments=[]){return !!job?.ordered&&!job.completed&&!job.posted&&!(job.settlementAdjustments||[]).length&&[...(job.income||[]),...payments].every(r=>!r.actual&&!(Number(r.actualAmount)>0)&&!r.received&&!r.paid);}
function canClear(user,job,kind){if(!['owner','F'].includes(user?.role)||!job)return false;if(kind==='posting')return !!job.posted;if(kind==='completion')return !!job.completed&&!job.posted;if(kind==='order')return !!job.ordered&&!job.completed&&!job.posted;return false;}
const api={canDelete,canCancel,canClear};if(typeof module==='object'&&module.exports)module.exports=api;else root.jobActions=api;
})(typeof window==='object'?window:globalThis);
