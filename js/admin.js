/* ==========================================
   Weekly Reports System
   Admin Dashboard
========================================== */

const content = document.getElementById("content");
let employeesData = [];
let reportsData = [];
let editingEmployeeId = null;

const menuCards = document.querySelectorAll(".menu-card");

menuCards.forEach(card => {
    card.addEventListener("click", () => {
        menuCards.forEach(item => item.classList.remove("active"));
        card.classList.add("active");
        loadPage(card.dataset.page);
    });
});

function loadPage(page){
    switch(page){
        case "dashboard": dashboardPage(); break;
        case "reports": reportsPage(); break;
        case "employees": employeesPage(); break;
        case "settings": settingsPage(); break;
    }
}

function esc(value){
    return String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
}

function normalizeDepartment(value){
    return String(value ?? "")
        .normalize("NFKC")
        .replace(/[\u064B-\u065F\u0670]/g, "")
        .replace(/ـ/g, "")
        .replace(/[\u0623\u0625\u0622]/g, "ا")
        .replace(/\s+/g, " ")
        .trim();
}

function roleLabel(role){
    const r = String(role || "").toLowerCase();
    if(r === "admin") return "مدير عام";
    if(r === "manager") return "مدير قسم";
    return "موظف";
}

function formatDate(value){
    const d = new Date(value);
    if(Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("ar-EG", {year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:true});
}

function dateKey(value){
    const d = new Date(value);
    if(Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function previewUrl(url){
    const value = String(url || "");
    const m = value.match(/\/file\/d\/([^/]+)/);
    if(m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    const q = value.match(/[?&]id=([^&]+)/);
    if(q) return `https://drive.google.com/file/d/${q[1]}/preview`;
    return value;
}

function openPdf(url, title="عرض التقرير"){
    const modal=document.getElementById("pdfModal");
    const frame=document.getElementById("pdfFrame");
    const titleEl=document.getElementById("pdfModalTitle");
    if(!modal || !frame) return window.open(url,"_blank");
    titleEl.textContent=title;
    frame.src=previewUrl(url);
    modal.classList.add("show");
    modal.setAttribute("aria-hidden","false");
}

function closePdf(){
    const modal=document.getElementById("pdfModal");
    const frame=document.getElementById("pdfFrame");
    if(!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden","true");
    if(frame) frame.src="about:blank";
}

window.openPdf=openPdf;

// PDF modal events are delegated because the modal is declared after admin.js in admin.html.
document.addEventListener("click", e => {
    if (e.target.closest("#pdfClose")) {
        closePdf();
        return;
    }

    if (e.target.id === "pdfModal") {
        closePdf();
    }
});

document.addEventListener("keydown", e => {
    if (e.key === "Escape") closePdf();
});

/* ==========================
   Dashboard
========================== */
async function dashboardPage(){
    content.innerHTML=`<div class="loading-state"><i class="fa-solid fa-spinner fa-spin"></i><span>جارٍ تحميل لوحة التحكم...</span></div>`;

    try{
        const [employeesResult,reportsResult]=await Promise.all([
            api("getEmployees"),
            api("getReports")
        ]);

        if(!employeesResult.success || !reportsResult.success){
            throw new Error("تعذر تحميل البيانات");
        }

        employeesData = employeesResult.employees || [];
        reportsData = reportsResult.reports || [];

        const currentWeek = typeof getMonthWeek === "function"
            ? getMonthWeek(new Date())
            : "";

        const weekReports = currentWeek
            ? reportsData.filter(r => String(r.week ?? "").trim() === String(currentWeek).trim())
            : reportsData;

        // الموظفون النشطون فقط، مع استبعاد المدير العام ومديري الأقسام من موظفي الرفع.
        const activeEmployees = employeesData.filter(e =>
            String(e.status ?? "").trim().toLowerCase() === "active"
        );

        const reportingEmployees = activeEmployees.filter(e => {
            const role = String(e.role || "").trim().toLowerCase();
            return role !== "manager" && role !== "admin";
        });

        const managers = activeEmployees.filter(e =>
            String(e.role || "").trim().toLowerCase() === "manager"
        );

        // نحسب الرفع اعتماداً على employeeId، وليس على اسم الموظف أو القسم.
        const uploadedEmployeeIds = new Set(
            weekReports
                .map(r => String(r.employeeId ?? "").trim())
                .filter(Boolean)
        );

        const uploadedEmployees = reportingEmployees.filter(e =>
            uploadedEmployeeIds.has(String(e.id ?? "").trim())
        );

        const missingEmployees = reportingEmployees.filter(e =>
            !uploadedEmployeeIds.has(String(e.id ?? "").trim())
        );

        // تجميع الأقسام بعد توحيد المسافات والاختلافات البسيطة في كتابة العربية.
        const departmentMap = new Map();

        reportingEmployees.forEach(employee => {
            const key = normalizeDepartment(employee.department);
            if(!key) return;

            if(!departmentMap.has(key)){
                departmentMap.set(key, {
                    name: String(employee.department).trim(),
                    employees: []
                });
            }

            departmentMap.get(key).employees.push(employee);
        });

        const deptRows = [...departmentMap.values()].map(dept => {
            const deptEmployees = dept.employees;

            const deptUploaded = deptEmployees.filter(e =>
                uploadedEmployeeIds.has(String(e.id ?? "").trim())
            );

            const total = deptEmployees.length;
            const uploaded = deptUploaded.length;
            const missing = total - uploaded;
            const pct = total
                ? Math.round((uploaded / total) * 100)
                : 0;

            return `
            <div class="dept-row">
                <div class="dept-info">
                    <strong>${esc(dept.name)}</strong>
                    <span>إجمالي ${total} موظف</span>
                </div>

                <div class="dept-progress-wrap">
                    <div class="progress">
                        <span style="width:${pct}%"></span>
                    </div>
                    <div class="dept-counts">
                        <span class="uploaded-count">رفع: ${uploaded}</span>
                        <span class="missing-count">لم يرفع: ${missing}</span>
                    </div>
                </div>

                <b>${pct}%</b>
            </div>`;
        }).join("");

        const missingRows = missingEmployees.length
            ? missingEmployees.map((employee, index) => `
                <div class="missing-employee">
                    <div class="missing-number">${index + 1}</div>
                    <div class="missing-person">
                        <strong>${esc(employee.name)}</strong>
                        <span>${esc(employee.department || "بدون قسم")}</span>
                    </div>
                    <span class="missing-badge">لم يرفع</span>
                </div>
            `).join("")
            : `
                <div class="no-missing">
                    <i class="fa-solid fa-circle-check"></i>
                    <div>
                        <strong>ممتاز! جميع الموظفين رفعوا التقارير</strong>
                        <span>لا يوجد موظفون متأخرون لهذا الأسبوع.</span>
                    </div>
                </div>`;

        content.innerHTML=`
        <div class="dashboard-intro">
            <div>
                <span>نظرة عامة</span>
                <h1>لوحة التحكم</h1>
                <p>متابعة الموظفين والتقارير الأسبوعية من مكان واحد.</p>
            </div>
            <div class="intro-date">
                <i class="fa-regular fa-calendar"></i>
                <span>${new Date().toLocaleDateString("ar-SA")}</span>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon blue"><i class="fa-solid fa-users"></i></div>
                <div><span>إجمالي الموظفين</span><strong>${reportingEmployees.length}</strong></div>
            </div>

            <div class="stat-card">
                <div class="stat-icon purple"><i class="fa-solid fa-user-tie"></i></div>
                <div><span>مديرو الأقسام</span><strong>${managers.length}</strong></div>
            </div>

            <div class="stat-card">
                <div class="stat-icon green"><i class="fa-solid fa-file-circle-check"></i></div>
                <div><span>رفعوا هذا الأسبوع</span><strong>${uploadedEmployees.length}</strong></div>
            </div>

            <div class="stat-card">
                <div class="stat-icon orange"><i class="fa-solid fa-clock"></i></div>
                <div><span>لم يرفعوا</span><strong>${missingEmployees.length}</strong></div>
            </div>
        </div>

        <div class="dashboard-panels">
            <section class="panel-card department-status-panel">
                <div class="panel-head">
                    <div>
                        <span>متابعة الأقسام</span>
                        <h2>حالة التقارير هذا الأسبوع</h2>
                    </div>
                    <i class="fa-solid fa-chart-column"></i>
                </div>

                <div class="dept-list">
                    ${deptRows || '<div class="empty-card">لا توجد أقسام أو موظفون نشطون</div>'}
                </div>
            </section>

            <section class="panel-card quick-actions">
                <div class="panel-head">
                    <div>
                        <span>إجراءات سريعة</span>
                        <h2>الوصول السريع</h2>
                    </div>
                    <i class="fa-solid fa-bolt"></i>
                </div>

                <button onclick="loadPage('reports')">
                    <i class="fa-solid fa-file-pdf"></i>
                    <span>عرض التقارير</span>
                    <small>بحث وفلترة التقارير</small>
                </button>

                <button onclick="loadPage('employees')">
                    <i class="fa-solid fa-users"></i>
                    <span>إدارة الموظفين</span>
                    <small>إضافة وتعديل الموظفين</small>
                </button>

                <button class="missing-toggle" id="missingToggleBtn" type="button">
                    <i class="fa-solid fa-user-clock"></i>
                    <span>الموظفون الذين لم يرفعوا</span>
                    <small>${missingEmployees.length} موظف لم يرفع تقرير هذا الأسبوع</small>
                </button>
            </section>
        </div>

        <section class="missing-panel" id="missingPanel" hidden>
            <div class="missing-panel-head">
                <div>
                    <span>المتابعة</span>
                    <h2>الموظفون الذين لم يرفعوا التقرير</h2>
                    <p>قائمة الموظفين المطلوب منهم رفع التقرير هذا الأسبوع.</p>
                </div>
                <div class="missing-total">
                    <strong>${missingEmployees.length}</strong>
                    <span>موظف</span>
                </div>
            </div>
            <div class="missing-list">${missingRows}</div>
        </section>`;

        const missingToggleBtn = document.getElementById("missingToggleBtn");
        const missingPanel = document.getElementById("missingPanel");

        missingToggleBtn?.addEventListener("click", () => {
            const willShow = missingPanel.hidden;
            missingPanel.hidden = !willShow;
            missingToggleBtn.classList.toggle("active", willShow);

            const icon = missingToggleBtn.querySelector("i");
            if(icon){
                icon.className = willShow
                    ? "fa-solid fa-eye-slash"
                    : "fa-solid fa-user-clock";
            }
        });

    }catch(err){
        console.error(err);
        content.innerHTML=`
            <div class="empty-card">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <h3>تعذر تحميل لوحة التحكم</h3>
                <p>حاول مرة أخرى.</p>
            </div>`;
    }
}

/* ==========================
   Employees
========================== */
async function employeesPage() {
    const result = await api("getEmployees");
    if(!result.success){ content.innerHTML=`<div class="empty-card"><i class="fa-solid fa-triangle-exclamation"></i><h3>تعذر تحميل الموظفين</h3></div>`; return; }
    employeesData = result.employees || [];
    const departments=[...new Set(employeesData.map(e=>e.department).filter(Boolean))];
    content.innerHTML=`
    <div class="section-title"><div><span class="eyebrow">إدارة النظام</span><h2><i class="fa-solid fa-users"></i> الموظفون</h2><p>إدارة الموظفين والصلاحيات والحالات.</p></div><button class="primary-btn" id="addEmployeeBtn"><i class="fa-solid fa-plus"></i> إضافة موظف</button></div>
    <div class="toolbar"><div class="search-box"><i class="fa-solid fa-magnifying-glass"></i><input id="employeeSearch" placeholder="بحث باسم الموظف أو اسم المستخدم"></div><select id="employeeDepartment"><option value="">كل الأقسام</option>${departments.map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join("")}</select><select id="employeeRole"><option value="">كل الصلاحيات</option><option value="employee">موظف</option><option value="manager">مدير قسم</option><option value="admin">مدير عام</option></select></div>
    <div class="table-container"><table><thead><tr><th>#</th><th>الاسم</th><th>القسم</th><th>اسم المستخدم</th><th>الصلاحية</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody id="employeesBody"></tbody></table></div>`;
    document.getElementById("addEmployeeBtn").onclick=()=>{
        editingEmployeeId=null; document.querySelector(".modal-title").textContent="إضافة موظف"; document.getElementById("employeeModal").classList.add("show");
    };
    const render=()=>{
        const q=document.getElementById("employeeSearch").value.trim().toLowerCase();
        const dept=document.getElementById("employeeDepartment").value;
        const role=document.getElementById("employeeRole").value;
        const filtered=employeesData.filter(e=>(!q || `${e.name} ${e.username}`.toLowerCase().includes(q)) && (!dept || e.department===dept) && (!role || String(e.role).toLowerCase()===role));
        document.getElementById("employeesBody").innerHTML=filtered.length?filtered.map(e=>`<tr><td>${esc(e.id)}</td><td><strong>${esc(e.name)}</strong></td><td>${esc(e.department)}</td><td dir="ltr">${esc(e.username)}</td><td><span class="role-badge ${String(e.role).toLowerCase()}">${roleLabel(e.role)}</span></td><td><span class="status ${e.status==="active"?"active":"stop"}">${e.status==="active"?"نشط":"موقوف"}</span></td><td><div class="actions"><button class="icon-btn edit-btn" onclick="editEmployee(${Number(e.id)})" title="تعديل"><i class="fa-solid fa-pen"></i></button><button class="icon-btn delete-btn" onclick="deleteEmployee(${Number(e.id)})" title="حذف"><i class="fa-solid fa-trash"></i></button></div></td></tr>`).join(""):`<tr><td colspan="7"><div class="table-empty"><i class="fa-solid fa-user-slash"></i><span>لا توجد نتائج مطابقة</span></div></td></tr>`;
    };
    ["employeeSearch","employeeDepartment","employeeRole"].forEach(id=>document.getElementById(id).addEventListener(id==="employeeSearch"?"input":"change",render));
    render(); setupEmployeeModal();
}

/* ==========================
   Reports
========================== */
async function reportsPage(){
    const result=await api("getReports");
    if(!result.success){ content.innerHTML=`<div class="empty-card"><i class="fa-solid fa-triangle-exclamation"></i><h3>تعذر تحميل التقارير</h3></div>`; return; }
    reportsData=result.reports||[];
    const departments=[...new Set(reportsData.map(r=>r.department).filter(Boolean))];
    content.innerHTML=`
    <div class="section-title"><div><span class="eyebrow">المتابعة</span><h2><i class="fa-solid fa-file-pdf"></i> التقارير</h2><p>ابحث عن التقارير وراجعها أو احذفها عند الحاجة.</p></div><div class="result-count" id="reportCount"></div></div>
    <div class="toolbar reports-toolbar"><div class="search-box"><i class="fa-solid fa-magnifying-glass"></i><input id="searchName" placeholder="البحث باسم الموظف أو الملف"></div><select id="searchDepartment"><option value="">كل الأقسام</option>${departments.map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join("")}</select><input type="text" id="searchWeek" placeholder="الأسبوع"><input type="date" id="searchDate"><button class="secondary-btn" id="clearReportFilters"><i class="fa-solid fa-rotate-left"></i> مسح</button></div>
    <div class="table-container"><table><thead><tr><th>الموظف</th><th>القسم</th><th>الأسبوع</th><th>تاريخ الرفع</th><th>الحالة</th><th>عرض</th><th>حذف</th></tr></thead><tbody id="reportsBody"></tbody></table></div>`;
    const render=()=>{
        const name=document.getElementById("searchName").value.trim().toLowerCase();
        const dept=document.getElementById("searchDepartment").value;
        const week=document.getElementById("searchWeek").value.trim().toLowerCase();
        const date=document.getElementById("searchDate").value;
        const filtered=reportsData.filter(r=>(!name || `${r.employeeName} ${r.fileName}`.toLowerCase().includes(name)) && (!dept || r.department===dept) && (!week || String(r.week).toLowerCase().includes(week)) && (!date || dateKey(r.uploadDate)===date));
        document.getElementById("reportCount").textContent=`${filtered.length} تقرير`;
        document.getElementById("reportsBody").innerHTML=filtered.length?filtered.map(r=>`<tr><td><strong>${esc(r.employeeName)}</strong></td><td>${esc(r.department)}</td><td>${esc(r.week)}</td><td>${formatDate(r.uploadDate)}</td><td><span class="report-status">${esc(r.status||"تم الرفع")}</span></td><td><button class="view-btn" onclick='openPdf(${JSON.stringify(String(r.url||""))}, ${JSON.stringify("تقرير " + String(r.employeeName||""))})'><i class="fa-solid fa-eye"></i> عرض</button></td><td><button class="icon-btn delete-btn" onclick="deleteReport(${Number(r.id)})" title="حذف"><i class="fa-solid fa-trash"></i></button></td></tr>`).join(""):`<tr><td colspan="7"><div class="table-empty"><i class="fa-solid fa-file-circle-xmark"></i><span>لا توجد تقارير مطابقة</span></div></td></tr>`;
    };
    ["searchName","searchDepartment","searchWeek","searchDate"].forEach(id=>document.getElementById(id).addEventListener(id.includes("Name")||id.includes("Week")?"input":"change",render));
    document.getElementById("clearReportFilters").onclick=()=>{["searchName","searchDepartment","searchWeek","searchDate"].forEach(id=>document.getElementById(id).value="");render();};
    render();
}

/* ==========================
   Settings
========================== */
async function settingsPage(){
    const result=await api("getSettings");
    if(!result.success){ content.innerHTML=`<div class="empty-card"><i class="fa-solid fa-triangle-exclamation"></i><h3>تعذر تحميل الإعدادات</h3></div>`; return; }
    const settings=result.settings||{};
    content.innerHTML=`<div class="section-title"><div><span class="eyebrow">النظام</span><h2><i class="fa-solid fa-gear"></i> الإعدادات</h2><p>تحديد موعد رفع التقارير الأسبوعية.</p></div></div><div class="settings-grid"><div class="setting-card"><label>يوم رفع التقارير</label><select id="uploadDay"><option value="0">الأحد</option><option value="1">الإثنين</option><option value="2">الثلاثاء</option><option value="3">الأربعاء</option><option value="4">الخميس</option><option value="5">الجمعة</option><option value="6">السبت</option></select></div><div class="setting-card"><label>وقت البداية</label><input id="startTime" type="time"></div><div class="setting-card"><label>وقت النهاية</label><input id="endTime" type="time"></div></div><button id="saveSettingsBtn" class="primary-btn save-settings"><i class="fa-solid fa-floppy-disk"></i> حفظ الإعدادات</button>`;
    document.getElementById("uploadDay").value=settings.uploadDay??""; document.getElementById("startTime").value=settings.startTime??""; document.getElementById("endTime").value=settings.endTime??"";
    document.getElementById("saveSettingsBtn").onclick=saveSettings;
}

/* ==========================
   Employee Modal
========================== */
function setupEmployeeModal(){
    const modal=document.getElementById("employeeModal"), closeBtn=document.getElementById("closeModal");
    if(!modal||!closeBtn)return;
    closeBtn.onclick=()=>modal.classList.remove("show");
    modal.onclick=e=>{if(e.target===modal)modal.classList.remove("show");};
}

async function saveEmployee(){
    const name=document.getElementById("empName").value.trim(); const username=document.getElementById("empUsername").value.trim(); const password=document.getElementById("empPassword").value.trim(); const department=document.getElementById("empDepartment").value; const role=document.getElementById("empRole").value;
    if(!name||!username||!password){alert("يرجى إدخال جميع البيانات");return;}
    const action=editingEmployeeId?"updateEmployee":"addEmployee";
    const result=await api(action,{id:editingEmployeeId,name,username,password,department,role});
    if(result.success){ document.getElementById("employeeModal").classList.remove("show"); editingEmployeeId=null; document.querySelector(".modal-title").textContent="إضافة موظف"; await employeesPage(); alert(action==="addEmployee"?"تمت إضافة الموظف بنجاح":"تم تحديث الموظف بنجاح"); }
    else alert(result.message||"تعذر حفظ الموظف");
}

document.getElementById("saveEmployee")?.addEventListener("click",saveEmployee);

function editEmployee(id){
    editingEmployeeId=id; const employee=employeesData.find(e=>Number(e.id)===Number(id)); if(!employee)return;
    document.getElementById("empName").value=employee.name||""; document.getElementById("empUsername").value=employee.username||""; document.getElementById("empPassword").value=employee.password||""; document.getElementById("empDepartment").value=employee.department||""; document.getElementById("empRole").value=employee.role||"employee"; document.querySelector(".modal-title").textContent="تعديل الموظف"; document.getElementById("employeeModal").classList.add("show");
}
window.editEmployee=editEmployee;

async function deleteEmployee(id){
    if(!confirm("هل تريد حذف هذا الموظف؟"))return;
    const result=await api("deleteEmployee",{id});
    if(result.success){await employeesPage();alert("تم حذف الموظف بنجاح");}else alert(result.message||"تعذر حذف الموظف");
}
window.deleteEmployee=deleteEmployee;

async function deleteReport(id){
    if(!confirm("هل تريد حذف هذا التقرير؟"))return;
    const result=await api("deleteReport",{id});
    if(result.success){await reportsPage();alert("تم حذف التقرير");}else alert(result.message||"تعذر حذف التقرير");
}
window.deleteReport=deleteReport;

async function saveSettings(){
    const result=await api("saveSettings",{uploadDay:document.getElementById("uploadDay").value,startTime:document.getElementById("startTime").value,endTime:document.getElementById("endTime").value});
    alert(result.success?"تم حفظ الإعدادات بنجاح":(result.message||"تعذر حفظ الإعدادات"));
}

/* ==========================
   Clock / Logout / Start
========================== */
function updateClock(){const now=new Date();document.getElementById("currentTime").textContent=now.toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit"});document.getElementById("currentDate").textContent=now.toLocaleDateString("ar-SA");}
updateClock();setInterval(updateClock,1000);

document.getElementById("logoutBtn")?.addEventListener("click",()=>{if(!confirm("هل تريد تسجيل الخروج؟"))return;localStorage.removeItem("currentUser");location.replace("index.html");});

document.querySelectorAll(".menu-card").forEach(btn=>btn.classList.remove("active"));
document.querySelector('[data-page="dashboard"]')?.classList.add("active");
dashboardPage();
