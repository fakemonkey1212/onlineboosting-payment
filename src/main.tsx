import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { prefetchPublicDisplay } from "@/lib/bootPrefetch";

document.documentElement.classList.remove("dark");
document.documentElement.style.colorScheme = "light";

prefetchPublicDisplay();

createRoot(document.getElementById("root")!).render(<App />);
