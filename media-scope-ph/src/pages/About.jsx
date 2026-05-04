import { Target, Lightbulb, Info, Users } from "lucide-react";
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
            About the System
          </h1>
          <p>Exploring how news articles portray key actors in the West Philippine Sea dispute through entity-level framing analysis</p>
        </div>
        <section className="mt-6 w-5/6 space-y-2 rounded-xl bg-white p-8 text-justify shadow-md md:w-3/5 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-blue-700 dark:text-blue-300" />
            <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100">
              System Overview
            </h2>
          </div>
          <p>
            This system is an Entity-Level Framing and Cross-Media Analysis platform designed to help users understand how news articles portray key actors involved in the West Philippine Sea dispute.
          </p>
          <p>
            Instead of simply identifying whether a news article is positive or negative, the system focuses on how specific entities such as countries, government agencies, and organizations are represented within individual sentences.
          </p>
          <p>
            By analyzing these portrayals, the platform allows users to see how narratives are constructed and how different actors are positioned in news reporting.
          </p>
        </section>
        <section className="mt-6 w-5/6 space-y-2 rounded-xl bg-white p-8 text-justify shadow-md md:w-3/5 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Lightbulb
              size={16}
              className="fill-blue-700 text-blue-700 dark:fill-blue-300 dark:text-blue-300"
            />
            <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100">
              Purpose of the System
            </h2>
          </div>
          <p>
            The purpose of this system is to provide a more detailed and systematic way of analyzing news coverage, particularly in complex geopolitical issues.
          </p>
          <p>
            News reporting often appears neutral, but the way actions are described and attributed can influence how readers perceive different actors. This system helps uncover those subtle patterns by focusing on entity-level portrayal rather than overall tone.
          </p>
          <p>
            By comparing results across local and international news sources, users can gain a clearer understanding of how the same events and entities may be framed differently.
          </p>
        </section>
        <section className="mt-6 w-5/6 space-y-2 rounded-xl bg-white p-8 shadow-md md:w-3/5 dark:bg-slate-900">
          <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100">
            System Demonstration
          </h2>
          <p className="text-justify">
            This video provides a guided walkthrough of the system, showing how users can
  explore entity-level framing, compare news coverage, and perform real-time analysis.
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
            <Info
              size={16}
              className="text-blue-700 dark:text-blue-300"
            />
            <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100">
              Disclaimer
            </h2>
          </div>
          <p>
            This system provides model-generated analytical results and does not represent the actual intent, bias, or editorial stance of any news organization.
          </p>
          <p>
            The outputs should be interpreted as computational analysis results based on trained models, and are intended to support research and exploration rather than definitive conclusions.
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
