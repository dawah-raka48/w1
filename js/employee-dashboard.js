/* Employee dashboard live statistics */
(function(){
  'use strict';
  const user=JSON.parse(localStorage.getItem('currentUser')||'null');
  if(!user||typeof api!=='function') return;
  const total=document.getElementById('totalReports');
  const status=document.getElementById('weeklyStatus');
  const last=document.getElementById('lastUpload');
  const state=document.getElementById('uploadState');
  const weekEl=document.getElementById('weekNumber');
  const week=weekEl?weekEl.textContent:'';
  function set(id,value){const el=document.getElementById(id);if(el)el.textContent=value}
  function shortDate(value){
    if(!value) return 'لا يوجد';
    const d=new Date(value); if(Number.isNaN(d.getTime())) return 'لا يوجد';
    return d.toLocaleDateString('ar-EG',{day:'numeric',month:'long'});
  }
  async function refresh(){
    try{
      const reportsResult=await api('getReports',{employeeId:user.id});
      const reports=reportsResult&&reportsResult.success&&Array.isArray(reportsResult.reports)?reportsResult.reports:[];
      set('totalReports',reports.length);
      if(reports.length){
        const sorted=reports.slice().sort((a,b)=>new Date(b.uploadDate)-new Date(a.uploadDate));
        set('lastUpload',shortDate(sorted[0].uploadDate));
      }else set('lastUpload','لا يوجد');
      const weekly=await api('checkWeeklyReport',{employeeId:user.id,week:week});
      const uploaded=!!(weekly&&weekly.success&&weekly.uploaded);
      set('weeklyStatus',uploaded?'تم الرفع':'بانتظار الرفع');
      if(state){state.innerHTML=uploaded?'<i class="fa-solid fa-circle-check"></i> تم رفع التقرير':'<i class="fa-solid fa-cloud-arrow-up"></i> بانتظار التقرير';state.style.background=uploaded?'#eaf8f1':'#eaf8f1';}
    }catch(e){console.warn('Dashboard stats unavailable',e)}
  }
  refresh();
})();
