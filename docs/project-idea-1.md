# Project Proposal — InnerLoop

## Problem Statement

People often struggle to understand where their money and time go and why their mood, energy, or productivity changes from day to day. Students, young professionals, freelancers, and budget-conscious individuals are especially affected because small expenses, unplanned activities, distractions, and emotional stress frequently remain undocumented. Existing applications generally track finance, time, and mood separately, forcing users to maintain multiple platforms and providing limited insight into how these areas influence one another. A digital solution is necessary to collect these daily-life signals conveniently and transform them into understandable, personalized patterns.

## Proposed Solution

InnerLoop will be a privacy-first, voice-assisted personal pattern intelligence web application that analyzes relationships among a user’s spending, time usage, and self-reported mood. Users will record information manually or through guided Bangla and Banglish voice commands, such as reporting an expense, activity duration, or emotional state. Lightweight speech-recognition and classification models will run directly inside the browser without sending personal diary data to a third-party AI API. The system will build a personal baseline, identify unusual changes, discover repeated behavioural loops, and generate explainable insights based on the user’s own historical data.

## Target Users

* University students who want to understand their expenses, study time, distractions, and emotional patterns.
* Young professionals and freelancers who struggle with time management and unplanned spending.
* Individuals working toward savings, productivity, or lifestyle-improvement goals.
* Privacy-conscious users who prefer personal data and AI processing to remain on their own device.
* Users who find repetitive manual data entry difficult and prefer Bangla or Banglish voice input.

## Technology Stack

| Layer                | Technology                                     | Justification                                                                                                                                                                                                                                                                           |
| -------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend              | Next.js API Routes with Node.js and TypeScript | Provides lightweight server-side functionality for optional authentication, encrypted backup, model metadata, and export services while allowing the team to maintain one language across the application.                                                                              |
| Frontend             | Next.js, React, TypeScript, and Tailwind CSS   | Supports responsive web development, reusable components, PWA functionality, and deployment on Vercel.                                                                                                                                                                                  |
| Browser AI           | Transformers.js and ONNX Runtime Web           | Enables speech-recognition and custom machine-learning models to run directly inside the browser without using a paid third-party AI API. Transformers.js supports browser-based automatic speech recognition, while ONNX Runtime Web supports custom JavaScript-based model inference. |
| AI Model Development | Python, PyTorch, pandas, and scikit-learn      | Python will be used to prepare the Bangla/Banglish dataset, train lightweight classification models, evaluate performance, and export trained models to ONNX format.                                                                                                                    |
| Database             | IndexedDB with Dexie.js                        | Stores sensitive expense, time, and mood data locally inside the user’s browser. Dexie provides a structured and developer-friendly wrapper around the browser’s IndexedDB database.                                                                                                    |
| Offline Support      | Progressive Web App and Service Worker         | Allows the application interface, models, and essential assets to be cached so the application can remain usable after the initial installation and model download.                                                                                                                     |
| Visualization        | Recharts                                       | Provides responsive charts for expenses, time allocation, mood trends, baseline comparisons, and behavioural-loop visualization.                                                                                                                                                        |
| Container            | Docker                                         | Consistent environments                                                                                                                                                                                                                                                                 |
| Version Control      | Git + GitHub                                   | CI/CD, Faculty access                                                                                                                                                                                                                                                                   |

## Core Features (Prioritized)

1. **Guided Bangla and Banglish Voice Entry** — Users will choose Expense, Time, or Mood mode and describe the information through a short voice command. The browser-based speech-recognition model will convert the recording into text, after which the user can confirm or correct the extracted information before it is saved.

2. **Intelligent Structured Data Extraction** — InnerLoop will identify expense amounts and categories, activity durations, mood labels, and possible emotional triggers from voice transcripts or typed sentences. A hybrid approach combining a custom lightweight classifier, deterministic number parsing, dictionaries, and validation rules will improve accuracy and reduce unreliable AI-generated outputs.

3. **Personal Baseline and Anomaly Detection** — The system will learn the user’s normal spending, study time, distraction time, sleep-related input, and mood range from historical records. It will identify meaningful deviations, such as unusually high food expenses, a sudden reduction in study time, or several consecutive low-mood entries, without comparing the user to a generic population standard.

4. **Cross-Domain Pattern and Life Loop Discovery** — InnerLoop will analyze repeated sequences involving money, time, and mood. For example, it may identify that late sleep is repeatedly followed by low energy, unfinished work, guilt, increased social-media use, and further delay; all insights will include the number of observations and will be presented as associations rather than proven causes.

5. **Personal Experiment Lab** — Users will be able to create short experiments such as reducing social-media use, sleeping earlier, or limiting unplanned food expenses for seven days. The application will compare the experiment period with the user’s previous baseline and report measurable changes in spending, productive time, and self-reported mood.

## Out of Scope This Semester

* InnerLoop will not diagnose depression, anxiety, or any other mental-health condition and will not replace professional medical support.
* The application will not connect directly to bank accounts, mobile financial services, phone screen-time systems, wearable devices, or social-media accounts.
* The team will not build a large language model, a fully conversational chatbot, or a native mobile application during this semester; the deliverable will be an installable, offline-capable web application.

## Similar Products

**Exist** combines data from different personal services and helps users identify relationships within their behaviour. However, it depends heavily on integrations and externally collected data, whereas InnerLoop focuses on guided Bangla/Banglish voice input, local browser processing, privacy, personal experiments, and direct analysis of money, time, and mood.

**Daylio, RescueTime, and Money Manager** respectively focus on mood journaling, time and distraction tracking, and financial records. Daylio provides mood and activity journaling, RescueTime tracks applications and websites, and Money Manager provides expense and budget reports; InnerLoop differs by combining these domains and discovering repeated cross-domain personal patterns instead of presenting three independent tracking dashboards.
