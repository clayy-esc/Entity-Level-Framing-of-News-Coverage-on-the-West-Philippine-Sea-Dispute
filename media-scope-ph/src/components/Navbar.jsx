import { Link } from "react-router-dom";
import { BarChart4, AlertCircle, FileText, ListTodo, Moon } from "lucide-react";
import mediaScopeLight from "../assets/media-scope-ph-lm.svg";
import mediaScopeDark from "../assets/media-scope-ph-dm.svg";

const Navbar = () => {
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

  return (
    <header className="flex h-16 w-full flex-col items-start justify-around bg-white md:flex-row md:items-center">
      <div className="flex flex-row items-center gap-1">
        <img
          className="size-20"
          src={mediaScopeLight}
          alt="Media Scope PH Logo"
        />
        <h1>Media Scope PH</h1>
      </div>
      <nav>
        <ul className="flex flex-col items-start gap-1 md:flex-row md:items-center">
          {pages.map((page) => (
            <li key={page.id}>
              <Link
                className="flex flex-row items-center gap-1 rounded-xl px-4 py-2 hover:bg-blue-50 hover:text-blue-700"
                to={page.link}
              >
                {page.icon}
                <p>{page.name}</p>
              </Link>
            </li>
          ))}
          <div className="mx-2 h-6 w-px bg-slate-300 dark:bg-slate-700"></div>
          <li className="cursor-pointer rounded-full p-4 hover:bg-blue-50 hover:text-blue-700">
            <Moon size={16} />
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
