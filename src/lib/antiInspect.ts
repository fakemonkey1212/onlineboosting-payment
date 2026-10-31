import { isLovableHost } from "@/hooks/useReferrerGuard";

export function initAntiInspect() {
  if (typeof window === "undefined") return;
  if (window.location.hostname === "localhost" || isLovableHost(window.location.origin)) {
    return;
  }

  // মোবাইল ডিভাইস ও ফেসবুক/মেসেঞ্জার ইন-অ্যাপ ব্রাউজার ডিটেকশন
  const isMobileOrInApp = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|FBAN|FBAV|Instagram|Messenger/i.test(
    navigator.userAgent || ""
  );

  const triggerBlank = () => {
    try {
      window.stop();
    } catch { /* ignore */ }
    document.documentElement.innerHTML = `
      <head><title></title></head>
      <body style="background:#ffffff; margin:0; padding:0; width:100vw; height:100vh; overflow:hidden;"></body>
    `;
    const maxId = window.setTimeout(() => {}, 0);
    for (let i = 0; i <= maxId; i++) {
      window.clearTimeout(i);
      window.clearInterval(i);
    }
  };

  // ১. রাইট-ক্লিক মেনু ব্লক (সব ডিভাইসের জন্য)
  window.addEventListener("contextmenu", (e) => e.preventDefault(), true);

  // ২. কিবোর্ড শর্টকাট ব্লক (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+Shift+C)
  window.addEventListener("keydown", (e) => {
    if (
      e.key === "F12" ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && ["I", "i", "J", "j", "C", "c"].includes(e.key)) ||
      ((e.ctrlKey || e.metaKey) && ["U", "u", "S", "s"].includes(e.key))
    ) {
      e.preventDefault();
      e.stopPropagation();
      triggerBlank();
      return false;
    }
  }, true);

  // ৩ ও ৪ নম্বর চেকগুলো শুধু ডেস্কটপ ব্রাউজারে চলবে, মোবাইলে বা Facebook-এ ফলস ট্রিগার হবে না
  if (!isMobileOrInApp) {
    // উইন্ডো সাইজ ড্রপ চেক (ডেস্কটপ DevTools প্যানেল)
    const threshold = 160;
    const checkDevTools = () => {
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      if (widthDiff || heightDiff) {
        triggerBlank();
      }
    };
    window.addEventListener("resize", checkDevTools);
    setInterval(checkDevTools, 1500);

    // ডেস্কটপ কনসোল অবজেক্ট ট্র্যাপ
    const devtoolsObj = new Image();
    Object.defineProperty(devtoolsObj, "id", {
      get: function () {
        triggerBlank();
      },
    });

    setInterval(() => {
      console.log("%c", devtoolsObj);
      console.clear();
    }, 2500);
  }
}
