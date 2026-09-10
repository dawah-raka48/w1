/* Employee dashboard live statistics + real upload-window status */
(function(){
'use strict';
const user=JSON.parse(localStorage.getItem('currentUser')||'null');
if(!user||typeof api!=='function')return;
const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value};
const shortDate=value=>{if(!value)return 'لا يوجد';const d=new Date(value);if(Number.isNaN(d.getTime()))return 'لا يوجد';return d.toLocaleDateString('ar-EG',{day:'numeric',month:'long'});};
const toMinutes=value=>{const p=String(value||'00:00').substring(0,5).split(':');return (parseInt(p[0],10)||0)*60+(parseInt(p[1],10)||0)};
async function refresh(){
try{
const reportsResult=await api('getReports',{employeeId:user.id});
const reports=reportsResult&&reportsResult.success&&Array.isArray(reportsResult.reports)?reportsResult.reports:[];
set('totalReports',reports.length);
if(reports.length){const sorted=reports.slice().sort((a,b)=>new Date(b.uploadDate)-new Date(a.uploadDate));set('lastUpload',shortDate(sorted[0].uploadDate));}else set('lastUpload','لا يوجد');
const week=(document.getElementById('weekNumber')||{}).textContent||'';
const weekly=await api('checkWeeklyReport',{employeeId:user.id,week:week});
const uploaded=!!(weekly&&weekly.success&&weekly.uploaded);
const settingsResult=await api('getSettings');
const settings=settingsResult&&settingsResult.success?settingsResult.settings:null;
const state=document.getElementById('uploadState');
if(uploaded){set('weeklyStatus','تم الرفع');if(state){state.innerHTML='<i class="fa-solid fa-circle-check"></i> تم رفع التقرير';state.className='upload-state uploaded';}return;}
let allowed=false;
if(settings){const now=new Date();const current=now.getHours()*60+now.getMinutes();allowed=String(now.getDay())===String(settings.uploadDay)&&current>=toMinutes(settings.startTime)&&current<=toMinutes(settings.endTime);}
if(allowed){set('weeklyStatus','بانتظار الرفع');if(state){state.innerHTML='<i class="fa-solid fa-cloud-arrow-up"></i> بانتظار الرفع';state.className='upload-state available';}}
else{set('weeklyStatus','غير متاح الآن');if(state){state.innerHTML='<i class="fa-solid fa-lock"></i> غير متاح الآن';state.className='upload-state closed';}}
}catch(e){console.warn('Dashboard stats unavailable',e)}}
refresh();
})();
