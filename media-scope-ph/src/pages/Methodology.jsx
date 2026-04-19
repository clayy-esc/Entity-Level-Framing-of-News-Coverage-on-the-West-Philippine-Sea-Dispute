import { useState } from "react";
import { ChevronDown } from "lucide-react";

const Methodology = () => {
  const [openSections, setOpenSections] = useState({
    section1: false,
    section2: false,
    section3: false,
    section4: false,
  });

  const toggleSection = (sectionKey) => {
    setOpenSections((previousState) => ({
      ...previousState,
      [sectionKey]: !previousState[sectionKey],
    }));
  };

  return (
    <main className="flex-1">
      <div className="flex flex-col items-center justify-center">
        <div className="w-5/6 md:w-3/5">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Methodology
          </h1>
          <p>
            Technical processes and implementation details of the NLP pipeline
          </p>
        </div>
        <section className="mt-6 w-5/6 rounded-lg bg-white shadow-md md:w-3/5 dark:bg-slate-900">
          <button
            className={`flex w-full cursor-pointer items-center justify-between p-8 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${openSections.section1 ? "rounded-t-lg" : "rounded-lg"}`}
            onClick={() => toggleSection("section1")}
          >
            <h2 className="text-slate-900 dark:text-slate-100">
              Data Collection
            </h2>
            <ChevronDown
              size={20}
              className={`transition-transform duration-300 ${openSections.section1 ? "rotate-180" : ""}`}
            />
          </button>
          {openSections.section1 && (
            <div className="space-y-2 px-8 pb-8 text-justify">
              <p>
                News articles were collected from four major Philippine news
                outlets: GMA News, Rappler, Philippine Star, and Inquirer.net.
              </p>
              <p>
                Articles were scraped using automated web scraping tools,
                focusing on political and current affairs coverage from January
                2024 to December 2024.
              </p>
              <p>
                The dataset comprises approximately 40,000 articles, with
                metadata including publication date, outlet source, headline,
                and full article text. Articles were stored in a structured
                database for efficient processing.
              </p>
            </div>
          )}
        </section>
        <section className="mt-6 w-5/6 rounded-lg bg-white shadow-md md:w-3/5 dark:bg-slate-900">
          <button
            className={`flex w-full cursor-pointer items-center justify-between p-8 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${openSections.section2 ? "rounded-t-lg" : "rounded-lg"}`}
            onClick={() => toggleSection("section2")}
          >
            <h2 className="text-slate-900 dark:text-slate-100">
              Data Preprocessing
            </h2>
            <ChevronDown
              size={20}
              className={`transition-transform duration-300 ${openSections.section2 ? "rotate-180" : ""}`}
            />
          </button>
          {openSections.section2 && (
            <div className="space-y-2 px-8 pb-8 text-justify">
              <p>
                Lorem ipsum dolor, sit amet consectetur adipisicing elit. Aut ut
                at esse veritatis, sit, modi omnis delectus accusamus porro
                exercitationem similique quas voluptatibus illum mollitia soluta
                ab quibusdam nulla non. Tempora tempore ipsam deserunt placeat
                illo eveniet soluta veniam recusandae.
              </p>
              <p>
                dicta animi velit totam necessitatibus dolore eos beatae sed ea
                sit aut, vitae omnis libero dolores a quos pariatur? Quisquam?
                Ipsum ipsam animi delectus beatae eius placeat illum odio
                necessitatibus, explicabo quia iure a hic neque pariatur vero
                dolore, quaerat esse velit laborum minus quidem enim nam. Ipsum,
                eaque excepturi?
              </p>
            </div>
          )}
        </section>
        <section className="mt-6 w-5/6 rounded-lg bg-white shadow-md md:w-3/5 dark:bg-slate-900">
          <button
            className={`flex w-full cursor-pointer items-center justify-between p-8 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${openSections.section3 ? "rounded-t-lg" : "rounded-lg"}`}
            onClick={() => toggleSection("section3")}
          >
            <h2 className="text-slate-900 dark:text-slate-100">
              Entity-Level Framing Classification
            </h2>
            <ChevronDown
              size={20}
              className={`transition-transform duration-300 ${openSections.section3 ? "rotate-180" : ""}`}
            />
          </button>
          {openSections.section3 && (
            <div className="space-y-2 px-8 pb-8 text-justify">
              <p>
                Lorem ipsum dolor, sit amet consectetur adipisicing elit. Aut ut
                at esse veritatis, sit, modi omnis delectus accusamus porro
                exercitationem similique quas voluptatibus illum mollitia soluta
                ab quibusdam nulla non. Tempora tempore ipsam deserunt placeat
                illo eveniet soluta veniam recusandae.
              </p>
              <p>
                dicta animi velit totam necessitatibus dolore eos beatae sed ea
                sit aut, vitae omnis libero dolores a quos pariatur? Quisquam?
                Ipsum ipsam animi delectus beatae eius placeat illum odio
                necessitatibus, explicabo quia iure a hic neque pariatur vero
                dolore, quaerat esse velit laborum minus quidem enim nam. Ipsum,
                eaque excepturi?
              </p>
            </div>
          )}
        </section>
        <section className="mt-6 w-5/6 rounded-lg bg-white shadow-md md:w-3/5 dark:bg-slate-900">
          <button
            className={`flex w-full cursor-pointer items-center justify-between p-8 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${openSections.section4 ? "rounded-t-lg" : "rounded-lg"}`}
            onClick={() => toggleSection("section4")}
          >
            <h2 className="text-slate-900 dark:text-slate-100">
              Dashboard Visualization Outputs
            </h2>
            <ChevronDown
              size={20}
              className={`transition-transform duration-300 ${openSections.section4 ? "rotate-180" : ""}`}
            />
          </button>
          {openSections.section4 && (
            <div className="space-y-2 px-8 pb-8 text-justify">
              <p>
                Lorem ipsum dolor, sit amet consectetur adipisicing elit. Aut ut
                at esse veritatis, sit, modi omnis delectus accusamus porro
                exercitationem similique quas voluptatibus illum mollitia soluta
                ab quibusdam nulla non. Tempora tempore ipsam deserunt placeat
                illo eveniet soluta veniam recusandae.
              </p>
              <p>
                dicta animi velit totam necessitatibus dolore eos beatae sed ea
                sit aut, vitae omnis libero dolores a quos pariatur? Quisquam?
                Ipsum ipsam animi delectus beatae eius placeat illum odio
                necessitatibus, explicabo quia iure a hic neque pariatur vero
                dolore, quaerat esse velit laborum minus quidem enim nam. Ipsum,
                eaque excepturi?
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default Methodology;
