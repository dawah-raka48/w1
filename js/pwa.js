(() => {
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (isStandalone()) return;

  let deferredPrompt = null;
  const banner = document.createElement('div');
  banner.id = 'pwaInstallBanner';
  banner.innerHTML = `
    <div class="pwa-install-icon"><img src="assets/logo.png" alt=""></div>
    <div class="pwa-install-content">
      <strong>ثبّت تطبيق التقارير على جهازك</strong>
      <span id="pwaInstallHint">تثبيت سريع للوصول إلى النظام من الشاشة الرئيسية</span>
    </div>
    <button id="pwaInstallAction" type="button">تثبيت</button>
    <button id="pwaInstallClose" type="button" aria-label="إغلاق">×</button>`;

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const action = banner.querySelector('#pwaInstallAction');
  const hint = banner.querySelector('#pwaInstallHint');

  const show = () => {
    if (!document.body || isStandalone()) return;
    if (sessionStorage.getItem('pwa-install-dismissed') === '1') return;
    if (!document.getElementById('pwaInstallBanner')) document.body.appendChild(banner);
  };

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    show();
  });

  if (isIOS && isSafari) {
    hint.textContent = 'اضغط مشاركة ثم «إضافة إلى الشاشة الرئيسية» للتثبيت';
    action.textContent = 'التعليمات';
    setTimeout(show, 900);
  } else {
    setTimeout(show, 1200);
  }

  action.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      banner.remove();
      return;
    }
    if (isIOS) alert('من Safari اضغط زر المشاركة ثم اختر «إضافة إلى الشاشة الرئيسية».');
  });

  banner.querySelector('#pwaInstallClose').addEventListener('click', () => {
    sessionStorage.setItem('pwa-install-dismissed', '1');
    banner.remove();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    banner.remove();
  });
})();
