import { useState } from "react";
import { Link } from "react-router-dom";
import mediaScopeLight from "../assets/media-scope-ph-lm.svg";
import mediaScopeDark from "../assets/media-scope-ph-dm.svg";
import {
  BarChart4,
  AlertCircle,
  FileText,
  ListTodo,
  Menu,
  Moon,
  Sun,
  X,
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <header className="relative z-30 w-full border-b border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
      <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <img
            className="size-20"
            src={darkMode ? mediaScopeDark : mediaScopeLight}
            alt="Media Scope PH Logo"
          />
          <h1 className="text-xl">Media Scope PH</h1>
        </div>

        <button
          type="button"
          className="ml-auto rounded-lg p-2 hover:bg-slate-100 md:hidden dark:hover:bg-slate-800"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu size={20} />
        </button>

        <nav className="ml-auto hidden md:block">
          <ul className="flex items-center gap-1">
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
            <div className="mx-2 h-6 w-px bg-slate-300 dark:bg-slate-700"></div>
            <li>
              <button
                type="button"
                onClick={onToggleDarkMode}
                className="flex cursor-pointer items-center gap-1 rounded-full p-4 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-blue-300"
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50"
            onClick={closeSidebar}
          ></button>

          <aside className="absolute top-0 right-0 flex h-full w-72 flex-col bg-white p-4 shadow-2xl dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button
                type="button"
                className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={closeSidebar}
              >
                <X size={20} />
              </button>
            </div>

            <nav>
              <ul className="flex flex-col items-stretch gap-1">
                {pages.map((page) => (
                  <li key={page.id}>
                    <Link
                      className="flex items-center gap-2 rounded-xl px-4 py-3 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-blue-300"
                      to={page.link}
                      onClick={closeSidebar}
                    >
                      <span>{page.icon}</span>
                      <p>{page.name}</p>
                    </Link>
                  </li>
                ))}

                <li className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={onToggleDarkMode}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-4 py-3 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-blue-300"
                  >
                    {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                    <p>{darkMode ? "Light Mode" : "Dark Mode"}</p>
                  </button>
                </li>
              </ul>
            </nav>
          </aside>
        </div>
      )}
    </header>
  );
};

export default Navbar;
