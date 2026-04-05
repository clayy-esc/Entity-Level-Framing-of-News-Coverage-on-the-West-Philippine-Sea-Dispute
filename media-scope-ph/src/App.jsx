import { useState } from "react";
import "./App.css";
import Navbar from "./components/Navbar.jsx";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="h-screen bg-gray-100">
      <Navbar />
    </div>
  );
}

export default App;
