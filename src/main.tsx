import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { clearLegacyPaymentData } from "@/lib/clearLegacyPaymentData";

clearLegacyPaymentData();
import { prefetchPublicDisplay } from "@/lib/bootPrefetch";

document.documentElement.classList.remove("dark");
document.documentElement.style.colorScheme = "light";

prefetchPublicDisplay();

// Fallback: if any image fails to load, retry once, then hide the broken icon.
const BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
window.addEventListener("error", (e) => {
  const img = e.target as HTMLImageElement | null;
  if (!img || img.tagName !== "IMG" || img.src === BLANK) return;
  if (!img.dataset.retried && !img.src.startsWith("data:")) {
    img.dataset.retried = "1";
    const s = img.src; img.src = ""; img.src = s; return;
  }
  img.src = BLANK;
}, true);

const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
