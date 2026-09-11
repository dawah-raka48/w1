/* ==========================================
   Weekly Reports System
   In-App Notifications
========================================== */
(function(){
    const nativeAlert = window.alert.bind(window);

    function ensureLayer(){
        let layer=document.getElementById("appNotificationLayer");
        if(layer) return layer;
        layer=document.createElement("div");
        layer.id="appNotificationLayer";
        layer.className="app-notification-layer";
        layer.setAttribute("aria-live","polite");
        layer.setAttribute("aria-atomic","true");
        document.body.appendChild(layer);
        return layer;
    }

    function showNotification(message){
        const layer=ensureLayer();
        const item=document.createElement("div");
        item.className="app-notification";
        item.setAttribute("role","status");
        item.innerHTML=`
            <div class="app-notification-icon"><i class="fa-solid fa-circle-check"></i></div>
            <div class="app-notification-content">
                <span class="app-notification-title">تم بنجاح</span>
                <span class="app-notification-message"></span>
            </div>
            <button type="button" class="app-notification-close" aria-label="إغلاق"><i class="fa-solid fa-xmark"></i></button>`;

        item.querySelector(".app-notification-message").textContent=String(message||"");
        item.querySelector(".app-notification-close").onclick=()=>remove();
        layer.appendChild(item);

        requestAnimationFrame(()=>item.classList.add("show"));

        const timer=setTimeout(remove,3500);
        function remove(){
            clearTimeout(timer);
            item.classList.remove("show");
            setTimeout(()=>item.remove(),250);
        }
    }

    window.alert=function(message){
        showNotification(message);
    };

    // Keep the native alert available for emergency/debug use.
    window.nativeAlert=nativeAlert;
})();
