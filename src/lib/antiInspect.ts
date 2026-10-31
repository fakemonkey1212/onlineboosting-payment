import { isLovableHost } from "@/hooks/useReferrerGuard";

export function initAntiInspect() {
  // লোকাল ডেভেলপমেন্ট বা প্রিভিউতে থাকলে এটি অফ থাকবে
  if (typeof window === "undefined") return;
  if (window.location.hostname === "localhost" || isLovableHost(window.location.origin)) {
    return;
  }

  const triggerBlank = () => {
    try {
      window.stop();
    } catch { /* ignore */ }
    // পুরো DOM ও কনটেন্ট সম্পূর্ণ মুছে ফেলা
    document.documentElement.innerHTML = `
      <head><title></title></head>
      <body style="background:#ffffff; margin:0; padding:0; width:100vw; height:100vh; overflow:hidden;"></body>
    `;
    // চলমান সকল টাইমার বন্ধ করে দেওয়া
    const maxId = window.setTimeout(() => {}, 0);
    for (let i = 0; i <= maxId; i++) {
      window.clearTimeout(i);
      window.clearInterval(i);
    }
  };

  // ১. রাইট-ক্লিক মেনু ব্লক
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

  // ৩. উইন্ডো রিসাইজ ডিটেক্টর (DevTools প্যানেল ওপেন করলে উইন্ডো সাইজ ড্রপ করে)
  const threshold = 160;
  const checkDevTools = () => {
    const widthDiff = window.outerWidth - window.innerWidth > threshold;
    const heightDiff = window.outerHeight - window.innerHeight > threshold;
    if (widthDiff || heightDiff) {
      triggerBlank();
    }
  };
  window.addEventListener("resize", checkDevTools);
  setInterval(checkDevTools, 1000);

  // ৪. কনসোল অবজেক্ট ও ডিবাগার ডিটেক্টর
  const devtoolsObj = new Image();
  Object.defineProperty(devtoolsObj, "id", {
    get: function () {
      triggerBlank();
    },
  });

  setInterval(() => {
    console.log("%c", devtoolsObj);
    console.clear();
  }, 2000);
}
