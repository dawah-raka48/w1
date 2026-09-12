/* ==========================================
   Weekly Reports System
   Theme Switcher
========================================== */
(function(){
    const STORAGE_KEY = "weeklyReportsTheme";

    function getSavedTheme(){
        const saved = localStorage.getItem(STORAGE_KEY);
        if(saved === "dark" || saved === "light") return saved;
        return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    function applyTheme(theme){
        document.body.classList.toggle("dark", theme === "dark");
        document.documentElement.style.colorScheme = theme;

        const btn = document.getElementById("themeBtn");
        if(!btn) return;

        const icon = btn.querySelector("i");
        if(icon){
            icon.className = theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
        }

        btn.setAttribute("aria-label", theme === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن");
        btn.setAttribute("title", theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن");
    }

    const initialTheme = getSavedTheme();
    applyTheme(initialTheme);

    document.addEventListener("click", function(event){
        const btn = event.target.closest("#themeBtn");
        if(!btn) return;

        const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
        localStorage.setItem(STORAGE_KEY, nextTheme);
        applyTheme(nextTheme);
    });

    window.addEventListener("storage", function(event){
        if(event.key === STORAGE_KEY && (event.newValue === "dark" || event.newValue === "light")){
            applyTheme(event.newValue);
        }
    });
})();
