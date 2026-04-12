import { Link } from "react-router-dom";
import {
  BarChart4,
  AlertCircle,
  FileText,
  ListTodo,
  Moon,
  Sun,
} from "lucide-react";
import mediaScopeLight from "../assets/media-scope-ph-lm.svg";
import mediaScopeDark from "../assets/media-scope-ph-dm.svg";

const Navbar = ({ darkMode, onToggleDarkMode }) => {
  const pages = [
    {
      id: "coverage",
      name: "Coverage",
      icon: <BarChart4 size={16} />,
      link: "/",
    },
    {
      id: "about",
      name: "About",
      icon: <AlertCircle size={16} />,
      link: "/about",
    },
    {
      id: "methodology",
      name: "Methodology",
      icon: <FileText size={16} />,
      link: "/methodology",
    },
    {
      id: "report",
      name: "Report",
      icon: <ListTodo size={16} />,
      link: "/report",
    },
  ];

  const headerClassName = darkMode
    ? "border-slate-800 bg-slate-900 text-slate-100"
    : "border-slate-200 bg-white text-slate-900";

  const linkClassName = darkMode
    ? "flex flex-row items-center gap-1 rounded-xl px-4 py-2 hover:bg-slate-800 hover:text-blue-300"
    : "flex flex-row items-center gap-1 rounded-xl px-4 py-2 hover:bg-blue-50 hover:text-blue-700";

  const toggleClassName = darkMode
    ? "cursor-pointer rounded-full p-4 hover:bg-slate-800 hover:text-blue-300"
    : "cursor-pointer rounded-full p-4 hover:bg-blue-50 hover:text-blue-700";

  return (
    <header
      className={`flex h-16 w-full flex-col items-start justify-around border-b md:flex-row md:items-center ${headerClassName}`}
    >
      <div className="flex flex-row items-center gap-1">
        <img
          className="size-20"
          src={darkMode ? mediaScopeDark : mediaScopeLight}
          alt="Media Scope PH Logo"
        />
        <h1>Media Scope PH</h1>
      </div>
      <nav>
        <ul className="flex flex-col items-start gap-1 md:flex-row md:items-center">
          {pages.map((page) => (
            <li key={page.id}>
              <Link className={linkClassName} to={page.link}>
                {page.icon}
                <p>{page.name}</p>
              </Link>
            </li>
          ))}
          <div
            className={`mx-2 h-6 w-px ${darkMode ? "bg-slate-700" : "bg-slate-300"}`}
          ></div>
          <li>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className={toggleClassName}
              aria-label={
                darkMode ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
