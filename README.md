# SIEGE: Autonomous Cognitive Telemetry Terminal

**SIEGE** is a brutalist, privacy-first academic forensics terminal built for high-performance students. Rather than a generic study planner, SIEGE acts as a ruthless intelligence dashboard—analyzing your study habits, predicting cognitive decay, and forcing you to confront syllabus vulnerabilities before an exam.

### ⚡ Core Architecture
SIEGE operates entirely within your browser (`localStorage`) to guarantee 100% data privacy. It leverages the Groq API for near-instantaneous AI telemetry without the bloat of a heavy backend database.

### 🎯 High-Yield Features
- **Syllabus Vulnerability Matrix**: Analyzes your study logs to generate an ASCII heatmap, instantly identifying your weakest concepts and bleeding marks.
- **Cognitive Decay Tracking**: Uses the Ebbinghaus forgetting curve against your logged study dates to predict real-time memory retention and alert you when topics are decaying.
- **Knowledge Graph RAG**: Syncs directly with your local Obsidian `/vault`. The AI tutor literally reads your own Markdown notes and PDFs to formulate answers and test you.
- **Crisis Mode Triage**: For impending deadlines, hitting `[ INITIATE CRISIS MODE ]` locks down the UI and triggers a military-style extraction of the absolute highest-yield topics you must memorize to pass.
- **Online Paper Hunting**: Automatically extracts your recently studied concepts and generates hyper-optimized Google Dorks (`filetype:pdf`) to hunt down authentic, real-world past papers and mocks from the live internet.

### 🚀 Getting Started
1. Clone the repository.
2. Run `python3 server.py` to boot the local API (for file processing and Knowledge Graph context).
3. Open `http://localhost:8080/siege.html` in your browser.
4. Input your free Groq API key in the settings panel and initiate your first scan.

> *"Functionality > Aesthetic. You cannot choose what is on the exam. You will be tested on what you need to know."*
