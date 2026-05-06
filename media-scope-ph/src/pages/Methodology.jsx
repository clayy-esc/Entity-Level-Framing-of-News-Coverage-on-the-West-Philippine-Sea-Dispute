import { useState } from "react";
import { ChevronDown } from "lucide-react";

const Methodology = () => {
  const [openSections, setOpenSections] = useState({
    section1: false,
    section2: false,
    section3: false,
    section4: false,
    section5: false,
    section6: false,
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
            This section outlines the data pipeline, modeling approach, and
            system design used to analyze entity-level framing in news articles.
          </p>
        </div>
        <section className="mt-6 w-5/6 rounded-lg bg-white shadow-md md:w-3/5 dark:bg-slate-900">
          <button
            className={`flex w-full cursor-pointer items-center justify-between p-8 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${openSections.section1 ? "rounded-t-lg" : "rounded-lg"}`}
            onClick={() => toggleSection("section1")}
          >
            <h2 className="text-slate-900 dark:text-slate-100">
              Analytical Framework
            </h2>
            <ChevronDown
              size={20}
              className={`transition-transform duration-300 ${openSections.section1 ? "rotate-180" : ""}`}
            />
          </button>
          {openSections.section1 && (
            <div className="space-y-2 px-8 pb-8 text-justify">
              <p>
                The system follows the CRISP-DM methodology, which structures
                the workflow into data understanding, data preparation,
                modeling, evaluation, and deployment. This approach supports an
                iterative and data-driven process, allowing continuous
                refinement of both the dataset and the model.
              </p>
              <p>
                Unlike traditional sentiment analysis systems, this study
                focuses on entity-level framing, where each entity is analyzed
                within its sentence-level context. This enables more precise and
                context-sensitive interpretation of how actors are portrayed in
                news discourse.
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
              Data Collection
            </h2>
            <ChevronDown
              size={20}
              className={`transition-transform duration-300 ${openSections.section2 ? "rotate-180" : ""}`}
            />
          </button>
          {openSections.section2 && (
            <div className="space-y-2 px-8 pb-8 text-justify">
              <p>
                News articles were collected from selected local and
                international media outlets, including Philippine Daily
                Inquirer, GMA News, AP News, and South China Morning Post. These
                sources were chosen to support cross-media comparison of how the
                same geopolitical issue is reported.
              </p>
              <p>
                A hybrid collection approach was used, combining manual link
                selection and automated retrieval. Each article webpage was
                preserved as a static HTML file and processed offline to ensure
                reproducibility, consistency, and compliance with ethical data
                collection practices.
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
              Data Preparation
            </h2>
            <ChevronDown
              size={20}
              className={`transition-transform duration-300 ${openSections.section3 ? "rotate-180" : ""}`}
            />
          </button>
          {openSections.section3 && (
            <div className="space-y-2 px-8 pb-8 text-justify">
              <p>
                The dataset underwent a structured preprocessing pipeline,
                including text cleaning, normalization, and sentence
                segmentation. Non-editorial elements such as advertisements and
                navigation components were removed to retain only relevant
                textual content.
              </p>
              <p>
                Relevant articles were identified using LLM-assisted filtering,
                followed by Named Entity Recognition (NER) to extract candidate
                entities. Each entity was manually reviewed and annotated with
                one of four framing labels based on its contextual portrayal
                within the sentence.
              </p>
            </div>
          )}
        </section>
        <section className="mt-6 w-5/6 rounded-lg bg-white shadow-md md:w-3/5 dark:bg-slate-900">
          <button
            className={`flex w-full cursor-pointer items-center justify-between p-8 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${openSections.section4 ? "rounded-t-lg" : "rounded-lg"}`}
            onClick={() => toggleSection("section4")}
          >
            <h2 className="text-slate-900 dark:text-slate-100">Modeling</h2>
            <ChevronDown
              size={20}
              className={`transition-transform duration-300 ${openSections.section4 ? "rotate-180" : ""}`}
            />
          </button>
          {openSections.section4 && (
            <div className="space-y-2 px-8 pb-8 text-justify">
              <p>
                Transformer-based models, specifically BERT and RoBERTa, were
                fine-tuned for entity-level framing classification. Each input
                is structured as a sentence paired with a target entity,
                allowing the model to focus on contextual cues related to that
                entity.
              </p>
              <p>
                The models were trained using stratified datasets and optimized
                using techniques such as class weighting, learning rate tuning,
                and validation-based model selection. This ensures balanced
                performance across all framing categories.
              </p>
            </div>
          )}
        </section>
        <section className="mt-6 w-5/6 rounded-lg bg-white shadow-md md:w-3/5 dark:bg-slate-900">
          <button
            className={`flex w-full cursor-pointer items-center justify-between p-8 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${openSections.section5 ? "rounded-t-lg" : "rounded-lg"}`}
            onClick={() => toggleSection("section5")}
          >
            <h2 className="text-slate-900 dark:text-slate-100">Evaluation</h2>
            <ChevronDown
              size={20}
              className={`transition-transform duration-300 ${openSections.section5 ? "rotate-180" : ""}`}
            />
          </button>
          {openSections.section5 && (
            <div className="space-y-2 px-8 pb-8 text-justify">
              <p>
                Model performance was evaluated using precision, recall, and
                F1-score, with F1-score serving as the primary metric due to
                class imbalance among framing categories. Evaluation was
                conducted at the entity–sentence level to ensure fine-grained
                analysis.
              </p>
              <p>
                Additional analysis included per-class performance and confusion
                matrix evaluation to identify common misclassification patterns.
                This helps assess how well the model captures subtle framing
                cues in formally neutral news language.
              </p>
            </div>
          )}
        </section>
        <section className="mt-6 w-5/6 rounded-lg bg-white shadow-md md:w-3/5 dark:bg-slate-900">
          <button
            className={`flex w-full cursor-pointer items-center justify-between p-8 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${openSections.section6 ? "rounded-t-lg" : "rounded-lg"}`}
            onClick={() => toggleSection("section6")}
          >
            <h2 className="text-slate-900 dark:text-slate-100">Deployment</h2>
            <ChevronDown
              size={20}
              className={`transition-transform duration-300 ${openSections.section6 ? "rotate-180" : ""}`}
            />
          </button>
          {openSections.section6 && (
            <div className="space-y-2 px-8 pb-8 text-justify">
              <p>
                The system is deployed as a web-based application using a
                distributed architecture. The frontend handles user interaction,
                while the backend processes requests and communicates with a
                model inference service that performs classification.
              </p>
              <p>
                A database is used to store user-generated analyses, while
                preprocessed datasets power the visualization dashboard. This
                architecture enables scalable, real-time analysis and
                interactive exploration of entity-level framing patterns.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default Methodology;
