const Report = ({ darkMode }) => {
  return (
    <div className={`h-screen ${darkMode ? "bg-slate-950" : "bg-gray-100"}`}>
      Report Page
    </div>
  );
};

export default Report;
