import { Link } from "react-router-dom";
import mediaScopeLight from "../assets/media-scope-ph-lm.svg";
import mediaScopeDark from "../assets/media-scope-ph-dm.svg";

function Navbar() {
  const pages = [
    { name: "Coverage", icon: "bar_chart_4_bars", link: "/" },
    { name: "About", icon: "error", link: "/about" },
    { name: "Methodology", icon: "docs", link: "/methodology" },
    { name: "Report", icon: "list_alt", link: "/report" },
  ];

  return (
    <header className="items-left flex h-16 flex-col justify-around bg-white md:flex-row md:items-center">
      <div className="flex flex-row items-center gap-1">
        <img
          className="size-20"
          src={mediaScopeLight}
          alt="Media Scope PH Logo"
        />
        <h1>Media Scope PH</h1>
      </div>
      <nav>
        <ul className="items-left flex flex-col gap-1 md:flex-row md:items-center">
          {pages.map((page) => (
            <li key={page.name}>
              <Link
                className="flex flex-row items-center rounded-xl px-4 py-2 hover:bg-blue-50 hover:text-blue-700"
                to={page.link}
              >
                <span className="material-symbols-outlined text-xl!">
                  {page.icon}
                </span>
                <p>{page.name}</p>
              </Link>
            </li>
          ))}
          <li className="flex cursor-pointer flex-row items-center rounded-xl px-4 py-2 hover:bg-blue-50 hover:text-blue-700">
            <span className="material-symbols-outlined text-xl!">
              dark_mode
            </span>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Navbar;
