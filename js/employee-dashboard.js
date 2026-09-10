/* Employee dashboard live statistics */
(function(){
  'use strict';
  const user=JSON.parse(localStorage.getItem('currentUser')||'null');
  if(!user||typeof api!=='function') return;
  const weekEl=document.getElementById('weekNumber');
  const week=weekEl?weekEl.textContent:'';
  const dayNames={0:'الأحد',1:'الإثنين',2:'الثلاثاء',3:'الأربعاء',4:'الخميس',5:'الجمعة',6:'السبت'};
  const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value};
  const shortDate=value=>{if(!value)return 'لا يوجد';const d=new Date(value);if(Number.isNaN(d.getTime()))return 'لا يوجد';return d.toLocaleDateString('ar-EG',{day:'numeric',month:'long'});};
  const toMinutes=value=>{const p=String(value||'00:00').substring(0,5).split(':');return (parseInt(p[0],10)||0)*60+(parseInt(p[1],10)||0)};
  async function refresh(){
    try{
      const reportsResult=await api('getReports',{employeeId:user.id});
      const reports=reportsResult&&reportsResult.success&&Array.isArray(reportsResult.reports)?reportsResult.reports:[];
      set('totalReports',reports.length);
      if(reports.length){const sorted=reports.slice().sort((a,b)=>new Date(b.uploadDate)-new Date(a.uploadDate));set('lastUpload',shortDate(sorted[0].uploadDate));}else set('lastUpload','لا يوجد');
      const weekly=await api('checkWeeklyReport',{employeeId:user.id,week:week});
      const uploaded=!!(weekly&&weekly.success&&weekly.uploaded);
      if(uploaded){
        set('weeklyStatus','تم الرفع');
        const state=document.getElementById('uploadState');
        if(state){state.innerHTML='<i class="fa-solid fa-circle-check"></i> تم رفع التقرير';state.classList.remove('upload-closed');}
        return;
      }
      const settingsResult=await api('getSettings');
      const settings=settingsResult&&settingsResult.success?settingsResult.settings:null;
      let allowed=false;
      if(settings){
        const now=new Date();
        const currentMinutes=now.getHours()*60+now.getMinutes();
        const start=toMinutes(settings.startTime), end=toMinutes(settings.endTime);
        allowed=String(now.getDay())===String(settings.uploadDay)&&currentMinutes>=start&&currentMinutes<=end;
      }
      const state=document.getElementById('uploadState');
      if(allowed){
        set('weeklyStatus','بانتظار الرفع');
        if(state){state.innerHTML='<i class="fa-solid fa-cloud-arrow-up"></i> بانتظار الرفع';state.classList.remove('upload-closed');}
      }else{
        set('weeklyStatus','رفع التقارير مغلق');
        if(state){state.innerHTML='<i class="fa-solid fa-lock"></i> رفع التقارير مغلق';state.classList.add('upload-closed');}
      }
    }catch(e){console.warn('Dashboard stats unavailable',e)}
  }
  refresh();
})();
