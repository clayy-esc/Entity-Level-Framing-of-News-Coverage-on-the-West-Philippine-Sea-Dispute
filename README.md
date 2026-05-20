# Media Scope PH: Entity-Level Framing of News Coverage on the West Philippine Sea Dispute Using RoBERTa and BERT-Based Transformer Models

**Media Scope PH** is a full-stack cloud-based web application built to support real-time entity-level framing analysis and comparative visualization of framing patterns found in news coverage regarding the West Philippine Sea dispute.

## 📖 About the Study

News media play a significant role in shaping public understanding of the West Philippine Sea dispute through the contextual representation of geopolitical actors involved in the conflict. However, traditional sentiment analysis approaches are often insufficient for analyzing news discourse because formally neutral reporting may still convey evaluative meaning through contextual and narrative cues.

To address this, our study developed an entity-level framing analysis framework using transformer-based NLP models. We constructed a domain-specific dataset of **7,323 news articles** from GMA News, Philippine Daily Inquirer, AP News, and South China Morning Post (2014-2025). Transformed into an entity-level corpus of 6,181 sentences and 13,123 entity instances, we implemented **BERT and RoBERTa** models using entity-conditioned sentence representations to classify entities into four framing categories:

- **Legitimate**
- **Aggressor**
- **Defensive**
- **Neutral**

**Key Findings:**

- **RoBERTa** achieved the highest performance with **80.61% accuracy** and an **80.69% weighted F1-score**, slightly outperforming BERT.
- The findings demonstrate that entity-level framing analysis provides a more context-sensitive and scalable approach for analyzing geopolitical news discourse compared to traditional polarity-based sentiment analysis.
- The deployed platform was assessed using selected user-oriented ISO/IEC 25010 software quality characteristics, with results indicating positive assessments regarding its functionality, usability, and analytical value.

## Project Structure

```text
Entity-Level-Framing-of-News-Coverage-on-the-West-Philippine-Sea-Dispute/
└── media-scope-ph/            # Main project directory
    ├── backend/               # FastAPI backend source code
    │   ├── database.py        # Database connection setup
    │   ├── main.py            # FastAPI application entry point
    │   ├── models.py          # SQLAlchemy database models
    │   ├── routes/            # API endpoints (e.g., analyses.py)
    │   ├── schemas.py         # Pydantic validation schemas
    │   └── requirements.txt   # Python dependencies
    ├── public/                # Static assets
    ├── src/                   # React frontend source code
    │   ├── assets/            # Logos, methodology diagrams, etc.
    │   ├── charts/            # Reusable ECharts components (Bar, Heatmap, Line, Table)
    │   ├── components/        # UI components (Navbar, Footer, etc.)
    │   ├── data/              # Static dataset fallbacks (JSON)
    │   └── pages/             # Application views (About, Coverage, Methodology, Report)
    ├── package.json           # Node.js dependencies
    ├── tailwind.config.js     # Tailwind CSS configuration
    └── vite.config.js         # Vite bundler configuration
```

## 🌐 Accessing the System

1. Open a modern web browser (Google Chrome, Mozilla Firefox, Microsoft Edge, or Safari).
2. Navigate to the deployment link: **[Media Scope PH Web Application](https://media-scope-ph.vercel.app/)**
3. The application will load the primary dashboard. As the system is built for open research, no login or account management is required. All usage is anonymous and session-based.

## 👥 Target Users

- **Journalists and Researchers**: For analyzing and studying how news outlets portray entities involved in the West Philippine Sea dispute.
- **General Users**: For exploring how different news sources report and frame entities related to the West Philippine Sea dispute.

## 📈 System Features & Overview

- **Interactive Visualization and Entity-Level Framing Analysis:** The application provides interactive visualizations such as bar charts, line charts, heatmaps, and tables to analyze how entities are portrayed across local and international news outlets using framing labels (Legitimate, Aggressor, Defensive, Neutral).
- **Real-Time and Community Analyses:** Input news content and auto-detect entities using BERT-Large-NER for real-time framing analysis using deployed transformer-based models (BERT, RoBERTa), while also displaying previously submitted community analyses for comparison and exploration.
- **Data Filtering and Entity Generalization:** Filter analytical data by framing labels, news outlets, entities, and date ranges. Also supports generalized entity analysis for broader comparative visualization.

## 🧭 System Navigation and Interface

The web application is organized into four primary pages accessible via the navigation bar:

1. **Coverage Page (Comparative Analysis):** The main dashboard for analyzing news data.
   - **Search-Enabled Filtering:** Filter panel with search functionality to quickly find specific entity names, news outlets, or framing labels.
   - **Synchronized Visualizations:** All charts and tables update automatically and consistently when a filter is applied.
   - **Generalize Toggle:** Converts categorical data into a numerical scale, aggregating entity framing to show broader media trends.

2. **About Page:** Provides background information about the project, its purpose, disclaimer, and details regarding the development team.

3. **Methodology Page:** Describes the system's analytical pipeline, from data collection and preprocessing to model training. Uses expandable sections to guide users through the technical stages of the research.

4. **Report Page (Real-Time Analysis):** The workspace for real-time model interaction.
   - **Sentence/Article Input and Model Selection:** Enter news sentences or whole articles and choose between two transformer models (BERT, RoBERTa).
   - **Auto Detect Entities / Multi-Entity Selection:** Auto-detect entities using BERT-Large-NER or manually highlight entities (e.g., "China Coast Guard") for simultaneous processing.
   - **Duplicate Analysis Detection:** Identifies if a sentence has already been analyzed and provides a link to jump directly to the saved result.
   - **Community Analyses Table:** A live feed that logs and displays all processed inputs, predicting framing labels for community exploration.

## ⚙️ System Requirements

### Hardware Requirements

- A standard modern computer (desktop or laptop) capable of running a web browser efficiently.
- _Note:_ Processing speed for framing classification depends on the backend server's inference capabilities.
- _Note:_ Complex analytical plots are best viewed on a high-resolution desktop monitor to ensure all data points and labels are legible.

### Software & Network Requirements

- A modern, up-to-date web browser (Chrome, Firefox, Edge, Safari).
- A standard operating system (Windows, macOS, Linux).
- A stable internet connection is required to communicate with the hosted transformer models and cloud database.

## ❓ Troubleshooting Common Issues

- **Model Latency:** If real-time analysis takes more than a few seconds, it may be due to a "cold start" of the hosted inference API. Wait for the process to complete or refresh the page to restart the request.
- **Visual Distortion:** If charts or heatmaps appear cut off or overlapping, ensure the application is being viewed on a desktop browser. Set the browser zoom level to 100% for optimal plot visibility.
- **Data Interpretation:** Classification results are generated by AI models and represent analytical interpretations. Refer to the "Entity-Level Framing Annotation Guideline" on the Report Page to understand the exact labeling criteria.
- **Input Errors:** The "Analyze Sentence or Article" button remains disabled if text is entered but no specific entity is highlighted. Ensure at least one entity is selected within the text area to proceed.
