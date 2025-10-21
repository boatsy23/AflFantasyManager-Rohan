import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "next-themes";
import { registerServiceWorker } from "@/lib/pwa/register-service-worker";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light">
    <App />
  </ThemeProvider>
);

// Register Service Worker for PWA
if (import.meta.env.PROD) {
  registerServiceWorker();
}
