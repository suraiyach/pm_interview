# 🎯 Interview Coach — AI-Powered PM Evaluation Engine

**Interview Coach** is a specialized mock interview web application engineered for Product Manager candidates (APM, PM, Senior PM, and Group PM). Unlike generic AI chatbots that simply converse, Interview Coach operates with a **visible, objective, 5-dimension evaluation rubric**, surgical single-probe follow-ups, Staff PM rewrites, and systematic cross-answer pattern recognition.

---

## 🚀 Live Access

The application is running locally at:
👉 **[http://localhost:5173/](http://localhost:5173/)**

---

## 🌟 Core Flow & Architecture

1. **Job Description & Seniority Calibration:**
   - Paste any real job description or choose from 1-click curated presets (Stripe Global Payouts Senior PM, Uber Marketplace Senior PM, Airbnb Host Trust PM, Google APM, Shopify GPM).
   - Select your target level: **APM** (Foundational), **PM** (Autonomous), **Senior PM** (Strategic Bar), or **Group PM** (Executive Governance).

2. **Role-Specific Question Generation (6–8 Questions):**
   - Automatically parses company domain, product ecosystem, and level expectations.
   - Generates a balanced interview loop spanning:
     - 🎭 **Behavioral & Leadership** (Stakeholder conflict, project pivots, cross-functional gridlock)
     - 💡 **Product Sense & Design** (Core workflows, edge cases, accessibility, underserved personas)
     - 📊 **Execution & Analytical Rigor** (12% metric drop triage, A/B testing with negative spillovers)
     - 🧭 **Strategy & Moat Defense** (Defending against zero-fee disruptors, capital allocation)

3. **Candidate Response & Interview Controls:**
   - Structured answer box with real-time word counter and pacing timer.
   - **Voice Dictation (Speech-to-Text):** Practice speaking your answers aloud via browser Web Speech API.
   - **Text-to-Speech:** Click "Listen" to have the interviewer read the question aloud.
   - **Framework Scaffolds:** 1-click templates for STAR (Behavioral) and CIRCLES (Product Sense).

4. **Targeted 1-Probe Follow-Up:**
   - The engine analyzes your initial response for the **#1 critical missing element**:
     - 📉 **A Metric:** Missing baseline, quantifiable lift, or negative guardrail counter-metric.
     - ⚖️ **A Trade-Off:** Missing explicit sacrifices, technical debt acknowledgment, or deprioritized cohorts.
     - 🔨 **A Concrete Decision:** Missing a definitive, high-conviction call between competing alternatives.
   - Highlights the exact diagnosis in a probe banner and presents one focused follow-up prompt.

5. **5-Dimension Evaluation Rubric (Scored 1–5 Independently):**
   *Never averaged into a single deceptive number—each dimension is scored independently with evidence and actionable recommendations:*
   - **Relevance (1–5):** Direct engagement with the core scenario and follow-up without meandering or evasion.
   - **Structure & Clarity (1–5):** Upfront signposting, framework adherence (STAR/CIRCLES), executive scannability.
   - **Product Sense (1–5):** User empathy, emotional friction discovery, workflow craft, underserved persona insight.
   - **Analytical Rigor (1–5):** Quantitative metrics, baseline-to-target deltas, guardrail telemetry, statistical grounding.
   - **Trade-offs & Decisions (1–5):** Prioritization conviction, explicit sacrifices, defense against counter-arguments.

6. **Exemplary Staff PM Rewritten Answer:**
   - Presents a 5/5 Staff / Lead PM caliber rewritten version of your exact thesis.
   - Highlights **"Why This Version Scores 5/5 on Every Rubric"** (e.g. added +28% metric lift, named the 2 discarded paths, used STAR).
   - Side-by-side comparison toggle: Compare your draft against the Staff PM response.
   - Audio speech playback to hear how an executive PM articulates the answer aloud.

7. **End-of-Session Pattern Summary (Meta-Analysis):**
   - Synthesizes performance across all answered questions in the loop.
   - **Systematic Pattern Recognition:** Flags recurring blindspots (e.g., *"You consistently skipped quantifying impact across 4 of 6 answers"*, *"Hesitant to commit to explicit trade-offs"*).
   - **Level Readiness Score:** Percentage calibration against your chosen seniority bar (APM / PM / Senior PM / Group PM).
   - **3-Week Personalized Action Plan:** Targeted weekly exercises tailored to eliminate your specific blindspots.
   - **Export Capabilities:** 1-click download of the complete interview transcript and feedback as Markdown (`.md`).

---

## 🗄️ Supabase Database Integration

Interview Coach natively supports **Supabase PostgreSQL** for cloud persistence of candidate loops, evaluations, and pattern analyses.

### How to Connect to Supabase:
1. **Via the UI:** Click the **"Connect Supabase"** button in the top navigation header.
2. Enter your:
   - **Supabase Project URL** (e.g. `https://xyz.supabase.co`)
   - **Supabase Anon Public API Key** (`eyJ...`)
3. Click **"Test Connection"** to verify real-time connectivity.
4. Click **"Copy SQL"** and run the generated migration in your [Supabase SQL Editor](https://supabase.com/dashboard) (also available in [`supabase/schema.sql`](file:///Users/suraiyach/.gemini/antigravity/scratch/interview-coach/supabase/schema.sql)).

### Or via `.env` file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### Database Tables Created:
- **`interview_sessions`**: Stores session ID, candidate level (APM/PM/Senior PM/Group PM), company name, role title, questions, readiness score, and executive summary.
- **`evaluated_answers`**: Stores question prompts, candidate initial answers, follow-up probe type (metric/trade-off/decision), follow-up responses, 5-dimension rubric scores (1–5), and Staff PM rewrites.
- **`session_patterns`**: Stores cross-answer systematic pattern recognition (e.g. consistently skipped metrics, lack of trade-off conviction).

### 🕒 Session History & Replay:
- Click the **"History"** button in the header to view past mock interviews.
- Select any previous session to reload questions, re-examine past evaluations, and inspect Staff PM rewritten answers.

1. **Zero-Config Built-In Engine (Default):**
   - Works immediately out of the box with zero setup or API keys required.
   - Powered by a comprehensive PM heuristic evaluation matrix that parses metric frequencies, trade-off language, decision verbs, and structural markers.

2. **Live Google Gemini Integration (Optional):**
   - Click the **"AI Engine"** button in the header to enter your Google Gemini API key (`gemini-1.5-flash`).
   - Seamlessly uses live LLM reasoning for custom follow-up probes and real-time rubric generation.

---

## 💻 Tech Stack

- **Framework:** React 18 + Vite 8 (TypeScript)
- **Styling:** Tailwind CSS + JetBrains Mono / Inter typography
- **Icons & Effects:** Lucide React + Canvas Confetti
- **Voice APIs:** Browser Web Speech API (`SpeechRecognition` & `SpeechSynthesis`)
- **State & Storage:** React state + `localStorage` persistence

---

## 🏃‍♂️ Development & Build Commands

```bash
# Enter project directory
cd /Users/suraiyach/.gemini/antigravity/scratch/interview-coach

# Start development server
npm run dev

# Run production build
npm run build

# Preview production build
npm run preview
```
