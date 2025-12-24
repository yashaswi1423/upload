// Mobile nav toggle
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.getElementById('nav-menu');
const headerEl = document.querySelector('.site-header');
const navEl = document.querySelector('.site-nav');

// Respect prefers-reduced-motion
const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function setHeaderOffset() {
  const h1 = headerEl ? headerEl.offsetHeight : 0;
  const h2 = navEl ? navEl.offsetHeight : 0;
  const total = h1 + h2;
  document.documentElement.style.setProperty('--header-total', `${total}px`);
}

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const open = navMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : 'auto';
    requestAnimationFrame(() => {
      setHeaderOffset();
      updateActiveLink(); // recalc after layout changes
    });
  });
  // Close menu on link click (mobile)
  navMenu.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      navMenu.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = 'auto';
      requestAnimationFrame(() => {
        setHeaderOffset();
        updateActiveLink();
      });
    }
  });
}

// Smooth scroll with offset correction for sticky header
function scrollWithOffset(targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;
  const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-total')) || 0;
  const y = el.getBoundingClientRect().top + window.pageYOffset - headerHeight - 6;
  window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
}

document.querySelectorAll('a.nav-link[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const id = a.getAttribute('href').slice(1);
    scrollWithOffset(id);
    history.replaceState(null, '', `#${id}`);
  });
});

// Smooth scroll for any other in-page anchors (e.g., CTA buttons)
document.querySelectorAll('a[href^="#"]:not(.nav-link)').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    const id = href.slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    scrollWithOffset(id);
    history.replaceState(null, '', `#${id}`);
  });
});

// Scroll spy: highlight the link for the section nearest the viewport center
const links = Array.from(document.querySelectorAll('.nav-link'));
const sections = links
  .map(l => document.querySelector(l.getAttribute('href')))
  .filter(Boolean);

function updateActiveLink() {
  if (!sections.length) return;
  const viewportCenter = window.innerHeight / 2;
  let best = { idx: 0, dist: Infinity };

  sections.forEach((sec, i) => {
    const rect = sec.getBoundingClientRect();
    const secCenter = rect.top + rect.height / 2;
    const dist = Math.abs(secCenter - viewportCenter);
    if (dist < best.dist) best = { idx: i, dist };
  });

  links.forEach(l => {
    l.classList.remove('active');
    l.removeAttribute('aria-current');
  });
  const activeLink = links[best.idx];
  if (activeLink) {
    activeLink.classList.add('active');
    activeLink.setAttribute('aria-current', 'page');
  }
}

// rAF throttle for scroll
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateActiveLink();
      ticking = false;
    });
    ticking = true;
  }
});

window.addEventListener('load', () => {
  setHeaderOffset();
  updateActiveLink();
  if (location.hash && location.hash.length > 1) {
    const id = location.hash.slice(1);
    setTimeout(() => scrollWithOffset(id), 0);
  }
});
window.addEventListener('resize', () => {
  setHeaderOffset();
  updateActiveLink();
});

// Initial
setHeaderOffset();
updateActiveLink();

// Countdown Timer Functionality
function updateCountdown() {
  // Set the hackathon start date (September 3rd, 2026 at 9:00 AM IST)
  // Using UTC time and manually calculating IST offset
  const hackathonStart = new Date('2026-09-03T03:30:00.000Z'); // 9:00 AM IST = 3:30 AM UTC
  const now = new Date();
  const timeDiff = hackathonStart - now;

  // Check if countdown elements exist
  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) {
    console.error('Countdown elements not found!');
    return; // Elements not found, exit function
  }

  if (timeDiff > 0) {
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    // Update the countdown display
    daysEl.textContent = days.toString().padStart(2, '0');
    hoursEl.textContent = hours.toString().padStart(2, '0');
    minutesEl.textContent = minutes.toString().padStart(2, '0');
    secondsEl.textContent = seconds.toString().padStart(2, '0');
  } else {
    // Hackathon has started
    daysEl.textContent = '00';
    hoursEl.textContent = '00';
    minutesEl.textContent = '00';
    secondsEl.textContent = '00';
  }
}

// Initialize countdown timer when DOM is loaded
function initCountdown() {
  updateCountdown(); // Initial update
  setInterval(updateCountdown, 1000); // Update every second
}

// Start countdown when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCountdown);
} else {
  initCountdown();
}

// Problem Statement Modal Functionality
const psData = {
  'NH-SJC-001': {
    id: 'NH-SJC-PS-001',
    domain: 'Gen AI for Business Applications',
    problemText: `Retailers manage huge volumes of purchasing, inventory, logistics and demand‑forecasting data. Inspired by AIMultiple’s description of agentic RAG, where an AI agent autonomously routes queries to appropriate databases and self‑corrects, teams should build a multi‑agent system that accepts natural‑language questions from planners (e.g., “Which warehouse should ship March orders to our eastern region to minimise cost and meet service‑level agreements?”). 
    The system must:
•	Use a routing agent to decide which data sources to query (inventory DB, ERP orders table, shipping‑cost API, etc.), generate appropriate SQL/API calls and retrieve the data. The agent should perform multiple function calls and refine its approach if initial results are insufficient.
•	Coordinate with a reasoning agent to compute optimal decisions—such as order–warehouse assignments or route schedules—and provide interpretable explanations.
•	Present a concise report showing the data sources used, the reasoning steps and the final recommendation.
This task demonstrates how agentic RAG can enable autonomous, multi‑turn information retrieval and decision‑making in supply‑chain management.`
  },
  'NH-SJC-002': {
    id: 'NH-SJC-PS-002',
    domain: 'Gen AI for Business Applications',
    problemText: `Financial institutions face complex regulations. A standard chatbot may not access internal policies, whereas RAG allows a model to pull in enterprise‑specific data and produce accurate outputs. 
    Participants will build an agentic assistant that:
•	Ingests regulatory documents, internal risk policies and recent compliance rulings. When a user asks a question—such as “How do the latest Reserve Bank of India guidelines affect our mortgage‑underwriting criteria?”—a reasoning agent autonomously retrieves and synthesises relevant information from multiple sources and delivers a response with citations.
•	Highlights ambiguities or conflicting regulations, flags potential risks and suggests follow‑up questions.
•	Demonstrates agentic features—autonomous decision‑making and real‑time adaptation—by refining its responses based on user feedback and evolving regulations.
This challenge underscores how agentic AI can augment compliance teams by offering context‑aware answers and risk insights.`
  },
  'NH-SJC-003': {
    id: 'NH-SJC-PS-003',
    domain: 'Gen AI for Business Applications',
    problemText: `The CIO report notes that AI agents automate repetitive tasks and adapt to changing conditions across domains like customer service, supply chain and IT operations. Planning a marketing campaign often requires coordination between marketing, finance and inventory teams. Participants will create a multi‑agent platform that:
•	Uses RAG to access CRM data (customer profiles), finance budgets and real‑time inventory levels.
•	Plans a product promotion by generating targeted customer segments, projecting revenue, checking budget constraints and suggesting discount levels.
•	Deploys multiple agents: one agent proposes creative content, another agent validates financial feasibility, and a third checks inventory availability. Agents collaborate and negotiate, adjusting the plan autonomously.
•	Presents the final campaign plan along with supporting data and explanations, adapting when underlying data changes.`
  },
  'NH-SJC-004': {
    id: 'NH-SJC-PS-004',
    domain: 'Cyber Security',
    problemText: `Phishing email detector, Threat intelligence summarizer, Log analysis + incident triage, Security policy assistant
Pick a cybersecurity use case 
•\tPhishing email detector + auto-responder: a GenAI agent analyzes incoming emails, flags phishing attempts, drafts safe responses. 
•\tThreat intelligence summarizer: an agent retrieves the latest CVEs/threat feeds and summarizes risks for security teams. 
•\tLog analysis + incident triage: ingest system logs, use RAG to identify anomalies, and recommend mitigation steps. 
•\tSecurity policy assistant: generate or validate compliance policies automatically. 
•\tUser-friendly security coach: explain security alerts or incidents to non-technical users in plain language. 
Build the GenAI workflow 
o\tUse a GenAI framework such as LangChain, LangGraph, LlamaIndex, AutoGen, etc. 
o\tShow how your system retrieves, analyzes, and generates insights or actions. 
o\tIntegrate at least one external data source or tool (threat feeds, logs, APIs, databases). 
o\tOptionally, use RAG (Retrieval-Augmented Generation) or Agentic workflows (multiple cooperating agents for retrieval, reasoning, and action). 
Host/Run it 
o\tDeploy on AWS or Azure (Bedrock/OpenAI on Azure, Lambda/Functions, DynamoDB/CosmosDB, etc.) or run locally / cloud-agnostic. 
Prepare a short demo 
o\t5–7 minute demo showing how the system works 
o\t1–2 page architecture diagram/slide deck explaining agents, tools, and state flow
Technologies & Resources 
o\tGenAI frameworks: LangChain, LangGraph, LlamaIndex, Microsoft AutoGen, Hugging Face Transformers 
o\tData sources: CVE/NVD feeds, VirusTotal, Shodan, Syslog/Kibana, AWS GuardDuty, Azure Sentinel 
o\tCloud (optional): AWS (Bedrock, Lambda, DynamoDB, S3), Azure (OpenAI, Functions, CosmosDB, Sentinel), or on-prem APIs.Any open APIs or security datasets
Tips 
o\tUse RAG to enrich LLM responses with up-to-date threat intelligence. 
o\tDesign agentic workflows where one agent retrieves threat data, another analyzes, another drafts actions/reports. 
o\tFocus on privacy & security in your own implementation (no leaking of credentials). 
o\tShow how your GenAI solution would fit into a real security operations workflow.`
  },
  'NH-SJC-005': {
    id: 'NH-SJC-PS-005',
    domain: 'Cyber Security',
    problemText: `“Spot the Insider Threat”

Background:
In IT companies, thousands of employees access emails, cloud apps, code repositories, and sensitive client data daily. While firewalls and antivirus protect against outsiders, some of the biggest risks come from inside — like an employee accidentally uploading data to public drives, sharing passwords, or using personal USB devices.

The Challenge:
Design a simple solution to detect and alert when there is a potential insider threat.

Your solution should:
•\tMonitor basic activities such as unusual file uploads, bulk downloads, or logins from unexpected locations.
•\tShow real-time alerts like “Large data download detected from HR folder at 2 AM.”
•\tKeep employee privacy protected (avoid storing personal details unnecessarily).
•\tProvide a clean dashboard with a simple risk score: Low / Medium / High. [a simple dashboard/web page]
•\tSimulate 3–4 basic anomalies: like login at odd hours, large file download, or multiple failed login attempts.
•\tBuild a basic rule-based detector (no need for advanced ML).

Bonus:
•\tAdd a feature to suggest quick actions: “Suspend suspicious session” or “Notify IT Security.”
•\tShow how the tool scales for a company with 1,000+ employees.

Goal:
Help IT companies catch risky activities early and prevent data leaks — keeping both client data and company reputation safe.`
  },
  'NH-SJC-006': {
    id: 'NH-SJC-PS-006',
    domain: 'Cyber Security',
    problemText: `AI-Powered Cyber Threat Detection Dashboard
Cybersecurity – Focused on proactive threat detection, visualization, and simulation using AI.
Modalities:
•\tText: Threat logs, system alerts, and incident reports.
•\tImage: Screenshots of attack patterns, phishing attempts, malware signatures.
•\tVideo: Security camera feeds or recorded attack simulations for anomaly detection.

Detailed Steps to Implement:
1. Data Collection &Preprocessing:
•\tAggregate threat logs from firewalls, IDS/IPS systems, and SIEM tools.
•\tNormalize and clean data for consistency across sources.
2. Threat Pattern Analysis:         
•\tUse NLP models to extract insights from textual logs (e.g., suspicious IPs, attack vectors).
•\tApply computer vision techniques to detect anomalies in images or video feeds.
3. Generative Modeling for Synthetic Scenarios:
•\tImplement GANs or diffusion models to create synthetic attack scenarios for training and stress-testing.
•\tSimulate phishing campaigns, DDoS attacks, and ransomware behaviors in a controlled environment.
4. Dashboard Development:
•\tBuild an interactive dashboard using frameworks like Streamlit, Dash, or React.
•\tInclude real-time threat visualization (heatmaps, timelines, attack graphs).
•\tProvide drill-down capabilities for detailed analysis of each threat.
5. Alerting & Recommendations:
•\tIntegrate AI-driven alerts for high-risk patterns.
•\tSuggest mitigation strategies based on historical data and predictive analytics.
Expected Output:
A fully interactive dashboard that:
•\tDisplays real-time threat visualizations (maps, graphs, timelines).
•\tOffers synthetic attack simulations for training and preparedness.
•\tProvides actionable insights and recommendations for security teams.`
  },
  'NH-SJC-007': {
    id: 'NH-SJC-PS-007',
    domain: 'AI/ML/DL',
    problemText: `Medical Assistant
Pick a medical use case 
•\tExamples: 
o\tClinical triage assistant: intake patient symptoms, retrieve guidelines, generate preliminary triage notes. 
o\tMedical literature summarizer: fetch and summarize latest research for doctors. 
o\tMedication adherence coach: personalized reminders + explanations for patients. 
o\tHospital resource scheduler: agentic system that retrieves resource data, forecasts demand, and schedules staff. 
o\tRadiology report helper: retrieve historical cases, help draft preliminary reports. 
Build the GenAI workflow 
•\tUse LangChain or LangGraph to define agents, tools, memory/state, and workflows. 
•\tIntegrate RAG or Agentic RAG to pull from medical guidelines, research papers, or hospital data. 
•\tShow state propagation between nodes/agents. 
•\tInclude at least one external data source or service (e.g., PubMed API, FHIR server, hospital database). 
Host/Run it 
•\tDeploy on AWS or Azure (Bedrock/OpenAI on Azure, Lambda/Functions, DynamoDB/CosmosDB, HealthLake, Azure Health Data Services) or run locally/cloud-agnostic. 
Prepare a short demo 
•\t5–7 minute demo showing how the system works 
•\t1–2 page architecture diagram/slide deck explaining agents, tools, RAG components, and state flow
Technologies & Resources 
• GenAI frameworks: LangChain, LangGraph, LlamaIndex, Microsoft AutoGen, Hugging Face Transformers 
• Medical data sources: PubMed, WHO guidelines, FHIR servers, open-source EHR data sets (e.g. MIMIC-III), hospital APIs (synthetic/test only) 
• Cloud (optional): AWS (Bedrock, HealthLake, Lambda, DynamoDB, S3), Azure (OpenAI, Health Data Services, Functions, CosmosDB)
Tips 
• Use RAG to enrich LLM responses with up-to-date medical knowledge. 
• Agentic workflows: design one agent for retrieval (guidelines, literature), another for reasoning/answer generation, and others for acting or orchestrating tasks. 
• Focus on privacy & security of patient data — only use de-identified or synthetic data for the hackathon. 
• Show how your workflow could realistically fit into a clinical or hospital workflow.`
  },
  'NH-SJC-008': {
    id: 'NH-SJC-PS-008',
    domain: 'AI/ML/DL',
    problemText: `Create an AI teaching assistant that uses the Socratic Method to teach sorting algorithms. 
The assistant should: 
1. Ask probing questions instead of revealing answers directly 
2. Adapt follow-up questions based on student responses 
3. Guide students to discover answers through their own reasoning 
4. Maintain focus on sorting algorithms 
5. Handle the computational complexity efficiently 
Target Topic: Data Structures and Algorithms - Sorting Algorithms 
This topic is chosen because it is fundamental to computer science education, familiar to most software engineering students, and well-defined in scope, making it ideal for a focused prototype. 
Example 1: Time Complexity Query 
Student Question: "What is the time complexity of bubble sort?" 
Traditional Approach (NOT what we want): "The time complexity of bubble sort is O(n²)." 
Socratic Approach (What your solution should do): 
Step 1: "Let's think about how each algorithm works. Can you describe how merge sort divides the problem?" 
Step 2: "Good! Now, how does that division strategy affect the number of operations needed?" 
Step 3: "Now compare that with bubble sort - how many comparisons does it make for an array of size n?" 
Step 4: Guide the student to compare O(n log n) vs O(n²) on their own 
Example 2: When/Why to Use an Algorithm 
Student Question: "When should I use quick sort?" 
Traditional Approach (NOT what we want): "Quick sort is good for large datasets and has an average time complexity of O(n log n), but worst case is O(n²) when the pivot is poorly chosen." 
Socratic Approach (What your solution should do): 
Step 1: "What factors do you think are important when choosing a sorting algorithm for a project?" 
Step 2: "Interesting! How do you think quick sort performs on average compared to its worst case?" 
Step 3: "What might cause quick sort to hit its worst-case scenario?" 
Step 4: "Given what you've discovered, in what situations would quick sort be a good choice?" 
Example 3: Implementation Details 
Student Question: "How does merge sort work?" 
Traditional Approach (NOT what we want): "Merge sort divides the array into halves recursively until single elements remain, then merges them back in sorted order." 
Socratic Approach (What your solution should do): 
Step 1: "Have you heard of the divide-and-conquer strategy in algorithms?" 
Step 2: "How do you think we could apply that strategy to sorting?" 
Step 3: "If we keep dividing an array in half, what's the smallest piece we can get?" 
Step 4: "Great! Now, if you have two sorted arrays, how would you combine them into one sorted array?" 
Step 5: Guide the student to piece together the full merge sort process 
Example 4: Handling Incorrect Answers 
Student Question: "Is bubble sort O(n) time complexity?" 
Traditional Approach (NOT what we want): "No, that's incorrect. Bubble sort is O(n²)." 
Socratic Approach (What your solution should do): 
Step 1: "Let's think about this together. In bubble sort, how many times do we need to pass through the array?" 
Step 2: "And in each pass, how many comparisons might we make?" 
Step 3: "So if we have n elements, and we make up to n passes, with up to n comparisons each pass, what does that tell us?" 
Step 4: "Right! So would you like to reconsider your answer about the time complexity?" 
FINAL NOTE 
Remember: The goal is not just to build an AI that knows the answers, but one that teaches students how to find them. Your assistant should make students think, not just provide information.`
  },
  'NH-SJC-009': {
    id: 'NH-SJC-PS-009',
    domain: 'AI/ML/DL',
    problemText: ` Banking Fraud Detection using Multimodal Transactions
Banking & Financial Services – Focused on fraud prevention using AI and multimodal data analysis.
Modalities:
Text: Transaction logs, account activity, and customer details.
Audio: Voice recordings from customer service calls or verification calls.
Image: ID documents, scanned checks, and profile pictures for identity verification.
Detailed Steps to Implement:
1. Data Collection & Integration:
•\tGather transaction logs from banking systems (amount, location, device info, time).
•\tCollect voice call recordings from customer support or verification processes.
•\tAcquire ID images (government-issued IDs, selfies for KYC) for authentication checks.
2. Preprocessing& Feature Extraction:
•\tText: Use NLP to detect anomalies in transaction patterns (e.g., sudden large transfers, unusual geolocation).
•\tAudio: Apply speech-to-text and voice biometrics to verify identity and detect stress or suspicious behavior.
•\tImage: Use computer vision for ID validation (e.g., forgery detection, face matching with selfie).
3. Multimodal Fusion & AI Model:
•\tCombine features from text, audio, and image into a unified representation using multimodal deep learning.
•\tTrain fraud detection models using supervised learning and anomaly detection techniques.
4. Generative AI for Synthetic Fraud Scenarios:
•\tUse GANs or diffusion models to create synthetic fraud cases for model training and stress testing.
•\tSimulate scenarios like fake IDs, voice spoofing, and transaction laundering patterns.
5.Fraud Detection Dashboard:
•\tBuild an interactive dashboard for fraud analysts:
•\tReal-time alerts for suspicious transactions.
•\tMultimodal evidence (transaction details, voice snippet, ID image).
•\tSynthetic fraud scenarios for proactive risk assessment.
6. Reporting & Compliance:
•\tGenerate automated fraud reports with confidence scores and recommended actions.
•\tEnsure compliance with banking regulations (KYC, AML, GDPR).
Expected Outcomes:
A fraud detection dashboard that:
•\tDisplays real-time alerts with multimodal evidence.
•\tProvides synthetic fraud scenarios for training and preparedness.
•\tGenerates detailed reports for compliance and investigation.`
  },
  'NH-SJC-010': {
    id: 'NH-SJC-PS-010',
    domain: 'Internet of Things (IoT)',
    problemText: `Problem Statement: AI-Powered IoT Coaching System for Sports Training 
Background 
Quality coaching is the difference between good and great athletes. However, personal coaches are expensive, not always available 24/7, and inaccessible to millions of aspiring athletes. What if technology could provide real-time, intelligent coaching that adapts to each athlete's needs, corrects their form, designs personalized training plans, and motivates them like a human coach would? 
The Challenge 
Create an intelligent IoT coaching system that acts as a virtual sports coach - not just tracking metrics, but actively training athletes through real-time guidance, technique correction, personalized workout planning, and adaptive feedback based on performance and progress. 
The Core Problem 
Athletes Need a Coach, Not Just Data 
• Passive devices tell you what happened, but don't help you improve 
• Human coaches are expensive and not always available 
• Generic training apps don't adapt to individual weaknesses or provide real-time correction 
• Athletes train alone without immediate feedback on form, pacing, or technique 

What a Real Coach Does (Your Device Should Too) 
1. Observes and corrects technique in real-time 
2. Designs personalized training plans based on goals and current level 
3. Provides motivation and encouragement during tough workouts 
4. Adapts training based on fatigue, performance, and progress 
5. Teaches fundamentals and advanced techniques progressively 
6. Prevents injuries by catching poor form or overtraining 
7. Gives tactical advice during practice sessions`
  },
  'NH-SJC-011': {
    id: 'NH-SJC-PS-011',
    domain: 'Internet of Things (IoT)',
    problemText: `Smart Home Intrusion Detection using Multimodal Sensors
IoT (Internet of Things) – Leveraging connected smart devices for home security.
Modalities:
Audio: Sounds captured by smart microphones (e.g., breaking glass, forced entry noises).
Image: Video frames or snapshots from smart cameras for motion and object detection.
Text: Metadata from sensors (timestamps, device logs, door/window status).

Detailed Steps to Implement:
1. Sensor Integration & Data Acquisition:
•\tConnect smart cameras, microphones, and door/window sensors to a central IoT hub.
•\tStream audio and video data in real-time; collect sensor logs for contextual information.
2. Preprocessing& Feature Extraction:
•\tApply noise reduction and audio feature extraction (MFCCs) for sound classification.
•\tUse image processing and deep learning (CNNs) for detecting human presence or unusual activity.
•\tCombine sensor logs for event correlation (e.g., door opened + motion detected).
3. Multimodal Fusion & AI Model:
•\tImplement a fusion model that combines audio, image, and text features for robust intrusion detection.
•\tUse anomaly detection algorithms or supervised learning for classification of intrusion vs. normal activity.
4. Alerting & Reporting System:
•\tTrigger real-time alerts via mobile app or SMS when intrusion is detected.
•\tGenerate incident reports with timestamp, detected modality, and confidence score.
•\tAttach visual evidence (snapshot or short video clip) for verification.
5. Dashboard & User Interface:
•\tBuild a dashboard to monitor live feeds, intrusion alerts, and historical reports.
•\tInclude analytics like intrusion frequency, time-of-day patterns, and device health status.
Expected Outcomes:
•\tReal-time intrusion alerts delivered to the homeowner’s device.
•\tIncident reports with detailed logs and visual/audio evidence.
•\tA user-friendly dashboard for monitoring and managing home security.`
  },
  'NH-SJC-012': {
    id: 'NH-SJC-PS-012',
    domain: 'Internet of Things (IoT)',
    problemText: `Defect Detection in Manufacturing using Multimodal Sensors
Manufacturing – Leveraging AI and IoT for predictive maintenance and quality assurance.
Modalities:
•\tImage: Visual inspection of machine parts and products using cameras.
•\tAudio: Sound patterns from machines (e.g., grinding, vibration noise) for anomaly detection.
•\tText: Machine logs, operational parameters, and maintenance history.
Detailed Steps to Implement:
1. Data Acquisition & Integration:
•\tCollect image data from cameras installed on production lines for visual defect detection.
•\tCapture audio signals from microphones placed near machines to monitor abnormal sounds.
•\tGather textual logs from sensors and PLCs (Programmable Logic Controllers) for operational context.
2. Preprocessing& Feature Extraction:
•\tImage: Apply computer vision techniques (CNNs) to detect cracks, misalignments, or surface defects.
•\tAudio: Use signal processing (MFCCs, spectrograms) to identify unusual frequency patterns indicating wear or malfunction.
•\tText: Parse logs for error codes, temperature spikes, or vibration anomalies using NLP.
3. Multimodal Fusion & AI Model:
•\tCombine image, audio, and text features into a unified representation using multimodal deep learning architectures.
•\tTrain classification models to categorize defects (e.g., mechanical, electrical, surface).
4. Defect Classification & Alerting:
•\tImplement real-time detection and classification of defects.
•\tTrigger alerts for critical anomalies and schedule predictive maintenance tasks.
5. Report Generation & Dashboard:
•\tGenerate automated maintenance reports with defect type, severity, and recommended actions.
•\tInclude visual evidence (images) and audio clips for verification.
•\tBuild a dashboard for supervisors to monitor machine health and defect trends.
Expected Outcomes:
1. A defect classification system that:
•\tDetects and classifies defects using multimodal data.
•\tProvides visual and audio evidence for each detected issue.
•\tGenerates maintenance reports with actionable insights.
2. Additional features:
•\tPredictive analytics for future failures.
•\tHistorical defect trend visualization.`
  },
  'NH-SJC-013': {
    id: 'NH-SJC-PS-013',
    domain: 'Innovation using Web 3.0',
    problemText: `Front-Running Attack Detection & Mitigation System
Problem:
MEV (Maximal Extractable Value) bots constantly front-run regular users by inserting transactions with higher gas fees, exploiting DeFi traders and NFT buyers. This leads to slippage, unfair trades, and financial losses for everyday users.
Build a middleware DApp or dashboard that:
1.\tDetects suspicious mempool behavior, including sandwich attacks, front-running, and other MEV patterns.
2.\tShows flagged transactions, affected users, and potential slippage losses in real-time.
3.\tOptionally integrates a private transaction relayer (e.g., Flashbots) to allow users to submit transactions safely.
4.\tBonus: Includes a simulation mode where users can test transactions before submitting to predict front-running risks.
Evaluation Criteria:
Metric\tDescription\tEvaluation Criteria
Detection\nAccuracy\tHow well the system identifies front-running / sandwich attacks in the mempool\t% of correctly flagged malicious transactions vs. total simulated attacks
User Impact\nAwareness\tClarity of information about affected users and potential losses\tQuality of dashboard visualization, ease of understanding, actionable insights
Real-Time\nPerformance\tSpeed at which transactions are analyzed and flagged\tTime from transaction broadcast → detection (< few seconds ideal)`
  }
};

function openPSModal(psId) {
  const modal = document.getElementById('psModal');
  const data = psData[psId];
  
  if (!data) return;
  
  // Populate modal with simplified data
  document.getElementById('psId').textContent = data.id;
  document.getElementById('psDomain').textContent = data.domain;
  document.getElementById('psProblemText').textContent = data.problemText;
  
  // Show modal
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closePSModal() {
  const modal = document.getElementById('psModal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto'; // Restore scrolling
}

// Close modal when clicking outside of it
window.addEventListener('click', function(event) {
  const modal = document.getElementById('psModal');
  if (event.target === modal) {
    closePSModal();
  }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    closePSModal();
  }
});