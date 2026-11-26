/* ブラウザ内の試作用マスター。本番の会社別データ管理とは別。 */
(()=>{'use strict';const key='construction_ui_units_v1';const defaults=['式','個','箇所','組','セット','本','枚','缶','巻','束','m','㎡','㎥','帖','人工','日'];
function read(){const raw=window.appStorage.getItem(key);if(raw===null)return [...defaults];const data=JSON.parse(raw);if(!Array.isArray(data)||!data.every(v=>typeof v==='string'))throw Error('単位を読み取れません');return data;}
window.unitMaster={read,save(values){read();window.appStorage.setItem(key,JSON.stringify(values));window.dispatchEvent(new Event('unit-master-changed'));},defaults:[...defaults]};
})();
