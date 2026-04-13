import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Coverage from "./pages/Coverage.jsx";
import About from "./pages/About.jsx";
import Methodology from "./pages/Methodology.jsx";
import Report from "./pages/Report.jsx";
import Footer from "./components/Footer.jsx";

const App = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("darkMode");

    if (savedTheme !== null) {
      return savedTheme === "true";
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prevMode) => !prevMode)}
      />
      <Routes>
        <Route path="/" element={<Coverage />} />
        <Route path="/about" element={<About />} />
        <Route path="/methodology" element={<Methodology />} />
        <Route path="/report" element={<Report />} />
      </Routes>
      <Footer />
    </div>
  );
};

export default App;
