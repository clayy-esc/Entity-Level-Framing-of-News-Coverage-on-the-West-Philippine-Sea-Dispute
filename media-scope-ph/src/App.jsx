import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Coverage from "./pages/Coverage.jsx";
import About from "./pages/About.jsx";
import Methodology from "./pages/Methodology.jsx";
import Report from "./pages/Report.jsx";
import Footer from "./components/Footer.jsx";

const App = () => {
  return (
    <div>
      <Navbar />
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
