/* ==========================================
   Weekly Reports System
   Department Manager
========================================== */

const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if(!currentUser){ location.replace("index.html"); throw new Error("No user"); }
const userRole=String(currentUser.role||"").trim().toLowerCase();
if(userRole!=="manager"){ location.replace("index.html"); throw new Error("Invalid role"); }

const content=document.getElementById("content");
const managerName=document.getElementById("managerName");
const departmentName=document.getElementById("departmentName");
const logoutBtn=document.getElementById("logoutBtn");

if(managerName) managerName.textContent=currentUser.name||"مدير القسم";
if(departmentName) departmentName.textContent=`قسم ${currentUser.department||""}`;

function esc(value){return String(value??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));}
function formatDate(value){const d=new Date(value);if(Number.isNaN(d.getTime()))return"—";return d.toLocaleString("ar-EG",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:true});}
function dateKey(value){const d=new Date(value);if(Number.isNaN(d.getTime()))return"";return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function previewUrl(url){const v=String(url||"");const m=v.match(/\/file\/d\/([^/]+)/);if(m)return`https://drive.google.com/file/d/${m[1]}/preview`;const q=v.match(/[?&]id=([^&]+)/);if(q)return`https://drive.google.com/file/d/${q[1]}/preview`;return v;}
function openPdf(url,title="عرض التقرير"){const modal=document.getElementById("pdfModal"),frame=document.getElementById("pdfFrame"),titleEl=document.getElementById("pdfModalTitle");if(!modal||!frame)return window.open(url,"_blank");titleEl.textContent=title;frame.src=previewUrl(url);modal.classList.add("show");modal.setAttribute("aria-hidden","false");}
function closePdf(){const modal=document.getElementById("pdfModal"),frame=document.getElementById("pdfFrame");modal?.classList.remove("show");modal?.setAttribute("aria-hidden","true");if(frame)frame.src="about:blank";}
window.openPdf=openPdf;
document.getElementById("pdfClose")?.addEventListener("click",closePdf);
document.getElementById("pdfModal")?.addEventListener("click",e=>{if(e.target.id==="pdfModal")closePdf();});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closePdf();});

function updateClock(){const now=new Date();document.getElementById("currentTime").textContent=now.toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit"});document.getElementById("currentDate").textContent=now.toLocaleDateString("ar-SA");}
updateClock();setInterval(updateClock,1000);

logoutBtn?.addEventListener("click",()=>{if(!confirm("هل تريد تسجيل الخروج؟"))return;localStorage.removeItem("currentUser");location.replace("index.html");});

const menuCards=document.querySelectorAll(".menu-card");
menuCards.forEach(card=>card.addEventListener("click",()=>{menuCards.forEach(item=>item.classList.remove("active"));card.classList.add("active");loadPage(card.dataset.page);}));

function loadPage(page){switch(page){case"dashboard":dashboardPage();break;case"employees":employeesPage();break;case"reports":reportsPage();break;}}

async function getDepartmentData(){
    const [empRes,repRes]=await Promise.all([api("getEmployees"),api("getReports",{department:currentUser.department,role:"manager"})]);
    if(!empRes.success||!repRes.success)throw new Error("تعذر تحميل البيانات");
    const employees=(empRes.employees||[]).filter(e=>e.department===currentUser.department);
    const reports=(repRes.reports||[]).filter(r=>r.department===currentUser.department);
    return {employees,reports};
}

async function dashboardPage(){
    content.innerHTML=`<div class="loading-state"><i class="fa-solid fa-spinner fa-spin"></i><span>جارٍ تحميل لوحة القسم...</span></div>`;
    try{
        const {employees,reports}=await getDepartmentData();
        const active=employees.filter(e=>e.status==="active");
        const currentWeek=typeof getMonthWeek==="function"?getMonthWeek(new Date()):"";
        const weekReports=currentWeek?reports.filter(r=>String(r.week)===String(currentWeek)):reports;
        const uploaded=new Set(weekReports.map(r=>String(r.employeeId)));
        const missing=active.filter(e=>!uploaded.has(String(e.id)));
        const latest=reports.slice().sort((a,b)=>new Date(b.uploadDate)-new Date(a.uploadDate)).slice(0,5);
        const latestRows=latest.length?latest.map(r=>`<tr><td><strong>${esc(r.employeeName)}</strong></td><td>${esc(r.week)}</td><td>${formatDate(r.uploadDate)}</td><td><button class="view-btn" onclick='openPdf(${JSON.stringify(String(r.url||""))},${JSON.stringify("تقرير "+String(r.employeeName||""))})'><i class="fa-solid fa-eye"></i> عرض</button></td></tr>`).join(""):``;
        content.innerHTML=`
        <div class="dashboard-intro"><div><span>مرحبًا بك</span><h1>${esc(currentUser.name||"مدير القسم")}</h1><p>لوحة متابعة تقارير قسم ${esc(currentUser.department||"")}.</p></div><div class="intro-date"><i class="fa-regular fa-calendar"></i><span>${new Date().toLocaleDateString("ar-SA")}</span></div></div>
        <div class="stats-grid"><div class="stat-card"><div class="stat-icon blue"><i class="fa-solid fa-users"></i></div><div><span>موظفو القسم</span><strong>${active.length}</strong></div></div><div class="stat-card"><div class="stat-icon green"><i class="fa-solid fa-file-circle-check"></i></div><div><span>تقارير هذا الأسبوع</span><strong>${weekReports.length}</strong></div></div><div class="stat-card"><div class="stat-icon orange"><i class="fa-solid fa-user-clock"></i></div><div><span>لم يرفعوا</span><strong>${missing.length}</strong></div></div><div class="stat-card"><div class="stat-icon purple"><i class="fa-solid fa-folder-open"></i></div><div><span>إجمالي التقارير</span><strong>${reports.length}</strong></div></div></div>
        <div class="dashboard-panels"><section class="panel-card"><div class="panel-head"><div><span>آخر النشاط</span><h2>أحدث التقارير</h2></div><i class="fa-solid fa-clock-rotate-left"></i></div><div class="table-container compact"><table><thead><tr><th>الموظف</th><th>الأسبوع</th><th>التاريخ</th><th>التقرير</th></tr></thead><tbody>${latestRows||'<tr><td colspan="4"><div class="table-empty">لا توجد تقارير حتى الآن</div></td></tr>'}</tbody></table></div></section><section class="panel-card missing-panel"><div class="panel-head"><div><span>المتابعة</span><h2>لم يرفعوا هذا الأسبوع</h2></div><i class="fa-solid fa-user-clock"></i></div>${missing.length?`<div class="missing-list">${missing.map(e=>`<div class="missing-item"><span class="avatar">${esc(String(e.name||"?").trim().charAt(0))}</span><div><strong>${esc(e.name)}</strong><small>${esc(e.department)}</small></div><span class="missing-badge">لم يرفع</span></div>`).join("")}</div>`:'<div class="empty-card small"><i class="fa-solid fa-circle-check"></i><span>جميع الموظفين رفعوا التقرير.</span></div>'}</section></div>`;
    }catch(e){content.innerHTML=`<div class="empty-card"><i class="fa-solid fa-triangle-exclamation"></i><h3>تعذر تحميل لوحة القسم</h3><p>حاول مرة أخرى.</p></div>`;}
}

async function employeesPage(){
    try{
        const {employees}=await getDepartmentData();
        content.innerHTML=`<div class="section-title"><div><span class="eyebrow">قسم ${esc(currentUser.department)}</span><h2><i class="fa-solid fa-users"></i> موظفو القسم</h2><p>قائمة الموظفين التابعين للقسم.</p></div><div class="result-count">${employees.length} موظف</div></div><div class="toolbar"><div class="search-box"><i class="fa-solid fa-magnifying-glass"></i><input id="managerEmployeeSearch" placeholder="البحث باسم الموظف"></div><select id="managerEmployeeStatus"><option value="">كل الحالات</option><option value="active">نشط</option><option value="inactive">موقوف</option></select></div><div class="table-container"><table><thead><tr><th>الاسم</th><th>القسم</th><th>الحالة</th></tr></thead><tbody id="managerEmployeesBody"></tbody></table></div>`;
        const render=()=>{const q=document.getElementById("managerEmployeeSearch").value.trim().toLowerCase(),status=document.getElementById("managerEmployeeStatus").value;const filtered=employees.filter(e=>(!q||String(e.name).toLowerCase().includes(q))&&(!status||(status==="active"?e.status==="active":e.status!=="active")));document.getElementById("managerEmployeesBody").innerHTML=filtered.length?filtered.map(e=>`<tr><td><strong>${esc(e.name)}</strong></td><td>${esc(e.department)}</td><td><span class="status ${e.status==="active"?"active":"stop"}">${e.status==="active"?"نشط":"موقوف"}</span></td></tr>`).join(""):`<tr><td colspan="3"><div class="table-empty">لا توجد نتائج</div></td></tr>`;};
        document.getElementById("managerEmployeeSearch").addEventListener("input",render);document.getElementById("managerEmployeeStatus").addEventListener("change",render);render();
    }catch(e){content.innerHTML=`<div class="empty-card"><i class="fa-solid fa-triangle-exclamation"></i><h3>تعذر تحميل الموظفين</h3></div>`;}
}

async function reportsPage(){
    try{
        const {reports}=await getDepartmentData();
        content.innerHTML=`<div class="section-title"><div><span class="eyebrow">المتابعة</span><h2><i class="fa-solid fa-file-pdf"></i> تقارير القسم</h2><p>البحث والفلترة ومراجعة تقارير موظفي القسم.</p></div><div class="result-count" id="managerReportCount"></div></div><div class="toolbar reports-toolbar"><div class="search-box"><i class="fa-solid fa-magnifying-glass"></i><input id="managerSearchName" placeholder="البحث باسم الموظف أو الملف"></div><input type="text" id="managerSearchWeek" placeholder="الأسبوع"><input type="date" id="managerSearchDate"><button class="secondary-btn" id="managerClearFilters"><i class="fa-solid fa-rotate-left"></i> مسح</button></div><div class="table-container"><table><thead><tr><th>الموظف</th><th>الأسبوع</th><th>تاريخ الرفع</th><th>الحالة</th><th>التقرير</th></tr></thead><tbody id="managerReportsBody"></tbody></table></div>`;
        const render=()=>{const name=document.getElementById("managerSearchName").value.trim().toLowerCase(),week=document.getElementById("managerSearchWeek").value.trim().toLowerCase(),date=document.getElementById("managerSearchDate").value;const filtered=reports.filter(r=>(!name||`${r.employeeName} ${r.fileName}`.toLowerCase().includes(name))&&(!week||String(r.week).toLowerCase().includes(week))&&(!date||dateKey(r.uploadDate)===date));document.getElementById("managerReportCount").textContent=`${filtered.length} تقرير`;document.getElementById("managerReportsBody").innerHTML=filtered.length?filtered.map(r=>`<tr><td><strong>${esc(r.employeeName)}</strong></td><td>${esc(r.week)}</td><td>${formatDate(r.uploadDate)}</td><td><span class="report-status">${esc(r.status||"تم الرفع")}</span></td><td><button class="view-btn" onclick='openPdf(${JSON.stringify(String(r.url||""))},${JSON.stringify("تقرير "+String(r.employeeName||""))})'><i class="fa-solid fa-eye"></i> عرض التقرير</button></td></tr>`).join(""):`<tr><td colspan="5"><div class="table-empty"><i class="fa-solid fa-file-circle-xmark"></i><span>لا توجد نتائج مطابقة</span></div></td></tr>`;};
        ["managerSearchName","managerSearchWeek"].forEach(id=>document.getElementById(id).addEventListener("input",render));document.getElementById("managerSearchDate").addEventListener("change",render);document.getElementById("managerClearFilters").onclick=()=>{document.getElementById("managerSearchName").value="";document.getElementById("managerSearchWeek").value="";document.getElementById("managerSearchDate").value="";render();};render();
    }catch(e){content.innerHTML=`<div class="empty-card"><i class="fa-solid fa-triangle-exclamation"></i><h3>تعذر تحميل التقارير</h3></div>`;}
}

document.querySelectorAll(".menu-card").forEach(btn=>btn.classList.remove("active"));document.querySelector('[data-page="dashboard"]')?.classList.add("active");dashboardPage();
