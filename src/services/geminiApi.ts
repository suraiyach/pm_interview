import { Question, TargetLevel, FollowUpQuestion, RubricDimensionScore } from '../types';

export interface LLMEvaluationResult {
  rubricScores: RubricDimensionScore[];
  rewrittenAnswer: {
    text: string;
    keyImprovements: string[];
    frameworkUsed: string;
  };
  strengths: string[];
  weaknesses: string[];
}

export async function callGeminiFollowUp(
  apiKey: string,
  question: Question,
  initialAnswer: string,
  level: TargetLevel
): Promise<FollowUpQuestion | null> {
  try {
    const prompt = `You are an elite, demanding Product Management Executive Interviewer at FAANG/Tier-1 Tech hiring for a ${level} position.
The candidate was asked:
"${question.title}": ${question.context}

The candidate gave this initial answer:
"""
${initialAnswer}
"""

Task:
Analyze this answer for the candidate's biggest missing element among these three:
1) A concrete metric (target KPI, baseline, or negative guardrail metric)
2) An explicit trade-off (what was sacrificed, opportunity cost, or risk)
3) A concrete decision (taking a definitive stand instead of being wishy-washy)

Pick the #1 most critical missing element.
Return ONLY valid JSON matching this exact structure:
{
  "missingElement": "metric" | "tradeoff" | "decision",
  "missingElementLabel": "Missing: ...",
  "explanation": "Brief 1-2 sentence diagnosis of why this answer is incomplete for a ${level}",
  "prompt": "Your direct, surgical interviewer follow-up question to probe this missing element"
}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json"
        }
      })
    });

    if (!res.ok) {
      console.warn('Gemini API call failed with status:', res.status);
      return null;
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text);
    return parsed as FollowUpQuestion;
  } catch (err) {
    console.error('Error invoking Gemini for follow-up:', err);
    return null;
  }
}

export async function callGeminiEvaluation(
  apiKey: string,
  question: Question,
  initialAnswer: string,
  followUp: FollowUpQuestion,
  followUpAnswer: string,
  level: TargetLevel
): Promise<LLMEvaluationResult | null> {
  try {
    const prompt = `You are a Principal PM Interview Bar-Raiser evaluating a candidate for a ${level} role.
Question: "${question.title}"
Context: ${question.context}

Candidate Initial Answer:
"""
${initialAnswer}
"""

Interviewer Follow-up:
"${followUp.prompt}"

Candidate Follow-up Answer:
"""
${followUpAnswer}
"""

EVALUATION RUBRIC:
Score the COMBINED answer (original + follow-up) on each of these 5 dimensions strictly from 1 to 5:
1. Relevance (Did they directly answer the prompt and follow-up without evasion or fluff?)
2. Structure & Clarity (STAR, CIRCLES, logical signposting, executive communication)
3. Product Sense (User empathy, customer friction, intuitive product craft)
4. Analytical Rigor (Quantitative metrics, baselines, guardrail counter-metrics)
5. Trade-offs & Decisions (Sacrifices, deprioritization, high-conviction decision-making)

Do NOT average into one single number. Give distinct scores for all 5.
Also provide a Staff PM / L6+ rewritten version of their answer showing how an exemplary candidate would articulate this exact thesis.

Return ONLY a valid JSON object matching this schema:
{
  "rubricScores": [
    {
      "dimension": "Relevance",
      "score": number (1-5),
      "title": string,
      "feedback": string,
      "evidence": string[],
      "improvement": string
    },
    {
      "dimension": "Structure & Clarity",
      "score": number (1-5),
      "title": string,
      "feedback": string,
      "evidence": string[],
      "improvement": string
    },
    {
      "dimension": "Product Sense",
      "score": number (1-5),
      "title": string,
      "feedback": string,
      "evidence": string[],
      "improvement": string
    },
    {
      "dimension": "Analytical Rigor",
      "score": number (1-5),
      "title": string,
      "feedback": string,
      "evidence": string[],
      "improvement": string
    },
    {
      "dimension": "Trade-offs & Decisions",
      "score": number (1-5),
      "title": string,
      "feedback": string,
      "evidence": string[],
      "improvement": string
    }
  ],
  "rewrittenAnswer": {
    "text": "markdown string of the rewritten answer",
    "keyImprovements": ["improvement 1", "improvement 2", "improvement 3"],
    "frameworkUsed": "e.g. STAR / CIRCLES"
  },
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"]
}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      })
    });

    if (!res.ok) {
      console.warn('Gemini API call failed with status:', res.status);
      return null;
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text);
    return parsed as LLMEvaluationResult;
  } catch (err) {
    console.error('Error invoking Gemini for evaluation:', err);
    return null;
  }
}
