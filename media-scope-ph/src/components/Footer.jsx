const Footer = ({ darkMode }) => {
  return (
    <footer
      className={`w-full py-6 text-center text-xs ${
        darkMode ? "bg-slate-900 text-slate-300" : "bg-white text-slate-500"
      }`}
    >
      <p>
        &copy; 2026 Media Scope PH | Philippine News Sentiment Analysis System
      </p>
      <p className="mt-2 text-[10px] tracking-widest uppercase opacity-60">
        CS Research Project
      </p>
    </footer>
  );
};

export default Footer;
