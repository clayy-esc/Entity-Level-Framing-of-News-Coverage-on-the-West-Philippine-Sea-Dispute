import mediaScopeLight from "../assets/media-scope-ph-lm.svg";
import mediaScopeDark from "../assets/media-scope-ph-dm.svg";

function Navbar() {
  return (
    <header className="flex h-16 flex-col items-center justify-around bg-white sm:flex-row">
      <div className="flex flex-row items-center gap-2">
        <img
          className="size-20"
          src={mediaScopeLight}
          alt="Media Scope PH Logo"
        />
        <h1>Media Scope PH</h1>
      </div>
      <nav>
        <ul className="flex flex-row gap-2 text-sm sm:text-base">
          <li>
            <a
              className="rounded-xl px-4 py-2 hover:bg-blue-50 hover:text-blue-700"
              href=""
            >
              <span className="material-symbols-outlined">
                bar_chart_4_bars
              </span>
              Coverage
            </a>
          </li>
          <li>
            <a
              className="rounded-xl px-4 py-2 hover:bg-blue-50 hover:text-blue-700"
              href=""
            >
              <span className="material-symbols-outlined">error</span>
              About
            </a>
          </li>
          <li>
            <a
              className="rounded-xl px-4 py-2 hover:bg-blue-50 hover:text-blue-700"
              href=""
            >
              <span className="material-symbols-outlined">docs</span>
              Methodology
            </a>
          </li>
          <li>
            <a
              className="rounded-xl px-4 py-2 hover:bg-blue-50 hover:text-blue-700"
              href=""
            >
              <span className="material-symbols-outlined">list_alt</span>
              Report
            </a>
          </li>
          <li>
            <span className="material-symbols-outlined">dark_mode</span>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Navbar;
