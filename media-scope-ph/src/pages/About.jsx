import members from "../content/members.js";
import {
  Database,
  Cpu,
  BotMessageSquare,
  LayoutDashboard,
  ChevronDown,
} from "lucide-react";

const pipeline = [
  {
    icon: <Database size={20} />,
    stage: "Data Collection",
    desc: "News articles collected from multiple Philippine outlets",
  },
  {
    icon: <Cpu size={20} />,
    stage: "Data Processing",
    desc: "Text cleaning, tokenization, and bilingual processing",
  },
  {
    icon: <BotMessageSquare size={20} />,
    stage: "Entity-Level Framing Classification",
    desc: "Determine entity portrayals across different news outlets",
  },
  {
    icon: <LayoutDashboard size={20} />,
    stage: "Visual Outputs",
    desc: "Cross-media comparison dashboards and reports",
  },
];

const About = () => {
  return (
    <main className="flex-1 bg-gray-100 dark:bg-slate-950">
      <div className="flex flex-col items-center justify-center">
        <div className="w-5/6 md:w-3/5">
          <h1>About the Project</h1>
          <p>Understanding media sentiment across Philippine news outlets</p>
        </div>
        <section className="m-2 w-5/6 rounded-xl bg-white p-8 text-justify shadow-md md:w-3/5 dark:bg-slate-900">
          <h2>Project Purpose</h2>
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
        <section className="m-2 w-5/6 rounded-xl bg-white p-8 text-justify shadow-md md:w-3/5 dark:bg-slate-900">
          <h2>Why Entity-Level Sentiment Analysis</h2>
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
        <section className="m-2 w-5/6 rounded-xl bg-white p-8 shadow-md md:w-3/5 dark:bg-slate-900">
          <h2>Model Pipeline</h2>
          <p className="text-justify">
            The system processes news articles through a multi-stage pipeline to
            determine entity framing:
          </p>
          <ul>
            {pipeline.map((step, index) => (
              <li key={index} className="flex flex-col">
                <div className="flex items-start">
                  <span className="m-2 shrink-0 self-start rounded-md bg-blue-50 p-2 text-blue-700 dark:bg-slate-800 dark:text-blue-300">
                    {step.icon}
                  </span>
                  <div>
                    <h3>{step.stage}</h3>
                    <p>{step.desc}</p>
                  </div>
                </div>
                {index !== pipeline.length - 1 && (
                  <div className="my-4 flex justify-center">
                    <ChevronDown size={20} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
        <section className="m-2 w-5/6 rounded-xl bg-white p-8 shadow-md md:w-3/5 dark:bg-slate-900">
          <h2 className="mb-4">Project Team</h2>
          <div className="grid grid-cols-1 gap-y-4 md:grid-cols-2 md:gap-6">
            {members.map((member, index) => (
              <div
                key={index}
                className="mx-8 border-l-2 border-slate-300 pl-4 dark:border-slate-700"
              >
                <h3>{member.name}</h3>
                <p className="mt-1 text-xs">{member.role}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default About;
