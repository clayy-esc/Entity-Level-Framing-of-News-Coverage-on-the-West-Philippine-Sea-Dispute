import { Link } from "react-router-dom";
import mediaScopeLight from "../assets/media-scope-ph-lm.svg";
import mediaScopeDark from "../assets/media-scope-ph-dm.svg";
import {
  BarChart4,
  AlertCircle,
  FileText,
  ListTodo,
  Moon,
  Sun,
} from "lucide-react";

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

const Navbar = ({ darkMode, onToggleDarkMode }) => {
  return (
    <header className="z-10 flex h-16 w-full flex-col items-start justify-around border-b border-slate-200 bg-white text-slate-900 md:flex-row md:items-center dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
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
              <Link
                className="flex items-center gap-1 rounded-xl px-4 py-2 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-blue-300"
                to={page.link}
              >
                <span>{page.icon}</span>
                <p>{page.name}</p>
              </Link>
            </li>
          ))}
          <div className="mx-2 hidden h-6 w-px bg-slate-300 md:block dark:bg-slate-700"></div>
          <li>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="flex cursor-pointer items-center gap-1 rounded-xl px-4 py-2 hover:bg-blue-50 hover:text-blue-700 md:rounded-full md:p-4 dark:hover:bg-slate-800 dark:hover:text-blue-300"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              <p className="block md:hidden">
                {darkMode ? "Light Mode" : "Dark Mode"}
              </p>
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
