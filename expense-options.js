/* 支出の簡易分類。会計上の仕訳は行わない。 */
(function(root){'use strict';
const individual=['経費','経費（兼用）','交際費','給料','税金・保険の納付','借入返済','借入返済（兼用）','10万円以上','10万円以上（兼用）','プライベート','その他'];
const corporation=['経費','経費（兼用）','交際費','役員報酬','給料','税金・保険の納付','借入返済','10万円以上','プライベート','その他'];
const methods=['現金','口座','カード','私費立替'];
const categories=type=>type==='individual'?[...individual]:type==='corporation'?[...corporation]:[];
const validExtra=row=>(!row.method||methods.includes(row.method))&&(row.category!=='その他'||String(row.note||'').trim()!=='');
const api={categories,methods,validExtra};if(typeof module==='object'&&module.exports)module.exports=api;else root.expenseOptions=api;
})(typeof window==='object'?window:globalThis);
