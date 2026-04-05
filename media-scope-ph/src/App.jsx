import { useState } from "react";
import "./App.css";
import Navbar from "./components/Navbar.jsx";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="bg-gray-100">
      <Navbar />
      <h1 className="text-3xl font-bold underline">Hello World</h1>

      <svg className="h-6 w-6">
        <use href="/icons.svg#github-icon" />
      </svg>
    </div>
  );
}

export default App;
