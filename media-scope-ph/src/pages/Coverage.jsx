const Coverage = ({ darkMode }) => {
  const error = true;

  return (
    <div className={`h-screen ${darkMode ? "bg-slate-950" : "bg-gray-100"}`}>
      About Page
      {error && <p className="text-red-500">An error occurred.</p>}
      <p className={`${error ? "text-red-500" : "text-green-500"} text-2xl`}>
        Error is Shown
      </p>
    </div>
  );
};

export default Coverage;
