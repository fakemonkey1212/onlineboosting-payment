import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { prefetchPublicDisplay } from "@/lib/bootPrefetch";
import { initAntiInspect } from "@/lib/antiInspect"; // 👈 নতুন যোগ করা হলো

document.documentElement.classList.remove("dark");
document.documentElement.style.colorScheme = "light";

initAntiInspect(); // 👈 নতুন কল করা হলো
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

createRoot(document.getElementById("root")!).render(<App />);
