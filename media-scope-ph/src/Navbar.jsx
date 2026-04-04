function Navbar() {
  return (
    <header className="flex h-16 items-center justify-around bg-white">
      <div>
        <img src="" alt="" />
        <h1>Media Scope PH</h1>
      </div>
      <nav>
        <ul className="flex space-x-4">
          <li>
            <a href="">Coverage</a>
          </li>
          <li>
            <a href="">About</a>
          </li>
          <li>
            <a href="">Methodology</a>
          </li>
          <li>
            <a href="">Report</a>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Navbar;
