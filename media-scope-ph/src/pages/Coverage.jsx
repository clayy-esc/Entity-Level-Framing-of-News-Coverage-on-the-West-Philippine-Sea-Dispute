const error = true;

const Coverage = () => {
  return (
    <main className="flex-1 bg-gray-100 dark:bg-slate-950">
      About Page
      {error && <p className="text-red-500">An error occurred.</p>}
      <p className={`${error ? "text-red-500" : "text-green-500"} text-2xl`}>
        Error is Shown
      </p>
    </main>
  );
};

export default Coverage;
