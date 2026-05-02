import { Target, Lightbulb, Calculator, Users } from "lucide-react";
import adams from "../assets/thesis-members/adams.svg";
import clarence from "../assets/thesis-members/clarence.svg";
import jonathan from "../assets/thesis-members/jonathan.svg";

const members = [
  {
    img: adams,
    name: "Adams B. Buhion",
    role: "Project Manager",
  },
  {
    img: jonathan,
    name: "Jonathan Ray Domingo",
    role: "Natural Language Processing",
  },
  {
    img: clarence,
    name: "Clarence P. Olayta",
    role: "Frontend Developer",
  },
];

const About = () => {
  return (
    <main className="flex-1">
      <div className="flex flex-col items-center justify-center">
        <div className="w-5/6 md:w-3/5">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            About the Project
          </h1>
          <p>Understanding media sentiment across Philippine news outlets</p>
        </div>
        <section className="mt-6 w-5/6 space-y-2 rounded-xl bg-white p-8 text-justify shadow-md md:w-3/5 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-blue-700 dark:text-blue-300" />
            <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100">
              Project Purpose
            </h2>
          </div>
          <p>
            This system provides entity-level sentiment analysis across multiple
            Philippine news outlets, enabling users to understand how different
            media sources portray specific entities such as political figures,
            organizations, and countries.
          </p>
          <p>
            By comparing sentiment across news outlets, researchers,
            journalists, and citizens can gain insights into media bias,
            reporting patterns, and the evolution of public discourse over time.
          </p>
        </section>
        <section className="mt-6 w-5/6 space-y-2 rounded-xl bg-white p-8 text-justify shadow-md md:w-3/5 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Lightbulb
              size={16}
              className="fill-blue-700 text-blue-700 dark:fill-blue-300 dark:text-blue-300"
            />
            <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100">
              Why Entity-Level Sentiment Analysis
            </h2>
          </div>
          <p>
            Traditional sentiment analysis examines overall article tone, but
            entity-level analysis provides more granular insights by determining
            how specific entities are portrayed within the same article.
          </p>
          <p>
            For example, a single article may express positive sentiment toward
            one political figure while expressing negative sentiment toward
            another. This nuanced approach reveals how media outlets frame
            different actors in complex political narratives.
          </p>
          <p>
            In the Philippine context, where media plurality and political
            discourse are vibrant, this tool helps track how various outlets
            cover key national issues and personalities.
          </p>
        </section>
        <section className="mt-6 w-5/6 space-y-2 rounded-xl bg-white p-8 shadow-md md:w-3/5 dark:bg-slate-900">
          <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100">
            Video
          </h2>
          <p className="text-justify">
            The system processes news articles related to the West Philippine
            Sea per sentence through a cloud integration pipeline to determine
            entity framing at real time:
          </p>
          <div className="mx-auto aspect-video w-full">
            <iframe
              src="https://www.youtube.com/embed/dB9ZDwwDPgg?si=mL54DAE4Kdp3oVmF"
              title="YouTube video player"
              className="h-full w-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </section>
        <section className="mt-6 w-5/6 space-y-2 rounded-xl bg-white p-8 text-justify shadow-md md:w-3/5 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Calculator
              size={16}
              className="text-blue-700 dark:text-blue-300"
            />
            <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100">
              Calculations
            </h2>
          </div>
          <p>
            Traditional sentiment analysis examines overall article tone, but
            entity-level analysis provides more granular insights by determining
            how specific entities are portrayed within the same article.
          </p>
          <p>
            For example, a single article may express positive sentiment toward
            one political figure while expressing negative sentiment toward
            another. This nuanced approach reveals how media outlets frame
            different actors in complex political narratives.
          </p>
          <p>
            In the Philippine context, where media plurality and political
            discourse are vibrant, this tool helps track how various outlets
            cover key national issues and personalities.
          </p>
        </section>
        <section className="mt-6 w-5/6 space-y-2 rounded-xl bg-white p-8 shadow-md md:w-3/5 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Users
              size={16}
              className="fill-blue-700 text-blue-700 dark:fill-blue-300 dark:text-blue-300"
            />
            <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100">
              Project Team
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-y-4 md:grid-cols-2 md:gap-6">
            {members.map((member, index) => (
              <div
                key={index}
                className="mx-4 flex border-l-2 border-slate-300 pl-4 dark:border-slate-700"
              >
                <img
                  src={member.img}
                  alt={member.name}
                  className="size-16 rounded-full object-cover"
                />
                <div className="flex flex-col items-start justify-center pl-4">
                  <h3 className="text-slate-900 dark:text-slate-100">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-xs">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default About;
