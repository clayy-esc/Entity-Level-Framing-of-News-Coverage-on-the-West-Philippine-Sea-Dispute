const About = () => {
  return (
    <main className="h-auto bg-gray-100">
      <div className="flex flex-col items-center justify-center">
        <div className="w-2/3">
          <h1>About the Project</h1>
          <p>Understanding media sentiment across Philippine news outlets</p>
        </div>
        <section className="m-2 w-5/6 rounded-xl bg-white p-8 text-justify shadow-md md:w-2/3">
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
        <section className="m-2 w-5/6 rounded-xl bg-white p-8 text-justify shadow-md md:w-2/3">
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
        <section className="m-2 w-5/6 rounded-xl bg-white p-8 text-justify shadow-md md:w-2/3">
          <h2>System Workflow</h2>
          <p>
            The system processes news articles through a multi-stage pipeline to
            extract entities and determine sentiment:
          </p>
          <ul>
            <li>Article Input</li>
            <li>Preprocessing</li>
            <li>Named Entity Recognition</li>
            <li>Sentiment Classification</li>
            <li>Visual Outputs</li>
          </ul>
        </section>
        <section className="m-2 w-5/6 rounded-xl bg-white p-8 text-justify shadow-md md:w-2/3">
          <h2>Project Team</h2>
          <p>Hello, this is the about section.</p>
        </section>
      </div>
    </main>
  );
};

export default About;
