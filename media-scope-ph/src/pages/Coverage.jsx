const Coverage = () => {
  return (
    <main className="flex-1">
      <div className="flex flex-col items-center justify-center">
        <div className="w-5/6 md:w-4/5">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Cross-Media Sentiment Dashboard
          </h1>
          <p>
            Explore sentiment distribution and trends across Philippine news
            outlets
          </p>
        </div>
        <section className="mt-6 grid w-5/6 grid-cols-[1fr_3fr] gap-4 md:w-4/5">
          <div className="space-y-2 rounded-xl bg-white p-8 text-justify shadow-md dark:bg-slate-900">
            <p>
              Lorem ipsum dolor sit amet consectetur, adipisicing elit.
              Temporibus praesentium eveniet sit fugit omnis quo amet, pariatur
              quas accusantium debitis laboriosam sapiente aperiam dolores
              delectus, minima, voluptates eum dolorem sequi. Est, quisquam
              officiis. Odio repellendus sed totam. Nam veritatis fuga cumque
              fugit, tenetur
            </p>
          </div>
          <div className="space-y-2 rounded-xl bg-white p-8 text-justify shadow-md dark:bg-slate-900">
            <p>
              veniam omnis dicta. Nulla dolorum eveniet perferendis tempore,
              quisquam maxime nihil esse, quas, libero molestiae magnam debitis.
              Voluptatibus quos, fugiat assumenda harum ex nisi illum, deleniti
              eligendi consequatur earum est asperiores eaque sequi aperiam
              incidunt laborum voluptatem. Possimus, sit! Quis laudantium
              laboriosam et maiores unde, corrupti vitae?
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Coverage;
