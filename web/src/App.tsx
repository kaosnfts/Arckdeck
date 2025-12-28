import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Shell } from "./components/Shell";
import { PageFade } from "./components/PageFade";

import Landing from "./pages/Landing";
import Docs from "./pages/Docs";
import Guide from "./pages/Guide";
import AppDashboard from "./pages/AppDashboard";
import ReceiptPublic from "./pages/ReceiptPublic";
import Faucet from "./pages/Faucet";

export default function App() {
  const [dark, setDark] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const saved = localStorage.getItem("arcdeck-theme");
    const isDark = saved ? saved === "dark" : true;
    setDark(isDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("arcdeck-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <Shell dark={dark} setDark={setDark}>
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageFade><Landing /></PageFade>} />
          <Route path="/guia" element={<PageFade><Guide /></PageFade>} />
          <Route path="/docs" element={<PageFade><Docs /></PageFade>} />
          <Route path="/app" element={<PageFade><AppDashboard /></PageFade>} />
          <Route path="/faucet" element={<PageFade><Faucet /></PageFade>} />
          <Route path="/r/:invoiceId" element={<PageFade><ReceiptPublic /></PageFade>} />
        </Routes>
      </AnimatePresence>
    </Shell>
  );
}
