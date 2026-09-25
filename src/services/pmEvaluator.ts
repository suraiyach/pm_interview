import {
  Question,
  TargetLevel,
  FollowUpQuestion,
  MissingElementKind,
  RubricDimensionScore,
  EvaluatedAnswer,
  SessionMetaSummary,
  PatternInsight
} from '../types';

interface AnswerAnalysis {
  hasMetrics: boolean;
  hasTradeoffs: boolean;
  hasDecisions: boolean;
  hasStructure: boolean;
  hasUserEmpathy: boolean;
  metricMatches: string[];
  tradeoffMatches: string[];
  decisionMatches: string[];
  wordCount: number;
}

export function analyzeAnswerFeatures(text: string): AnswerAnalysis {
  const lower = text.toLowerCase();
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  // 1. Metric detection
  const metricRegex = /(\b\d+(\.\d+)?%|\$\d+(\.\d+)?[kmb]?|\b\d+\s*(ms|seconds|minutes|days|weeks|months|users|accounts|bps|queries)\b|\b(kpi|okr|dau|mau|nps|csat|cac|ltv|arr|mrr|churn|retention|conversion|latency|throughput|p99|roi)\b)/gi;
  const metricMatches = text.match(metricRegex) || [];
  const hasMetrics = metricMatches.length >= 2 || (metricMatches.length >= 1 && /\b(increased|decreased|improved|reduced|lift|drop)\b/i.test(text));

  // 2. Trade-off detection
  const tradeoffKeywords = [
    'trade-off', 'tradeoff', 'trade off', 'sacrific', 'compromise', 'instead of',
    'deprioritiz', 'downside', 'opportunity cost', 'at the expense of', 'counter-metric',
    'guardrail', 'cannibaliz', 'consequence', 'alternative'
  ];
  const tradeoffMatches = tradeoffKeywords.filter(kw => lower.includes(kw));
  const hasTradeoffs = tradeoffMatches.length >= 1;

  // 3. Concrete Decision detection
  const decisionKeywords = [
    'decided to', 'chose', 'chosen', 'my decision', 'we prioritized', 'final call',
    'selected option', 'concluded that', 'i determined', 'recommendation is', 'pivoted to',
    'the call was', 'resolved to', 'firmly decided'
  ];
  const decisionMatches = decisionKeywords.filter(kw => lower.includes(kw));
  const hasDecisions = decisionMatches.length >= 1;

  // 4. Structure indicators
  const structureKeywords = ['first', 'second', 'third', 'situation', 'task', 'action', 'result', 'specifically', 'to summarize', 'in conclusion', 'framework', '1.', '2.', '3.'];
  const structureMatches = structureKeywords.filter(kw => lower.includes(kw));
  const hasStructure = structureMatches.length >= 2 || text.includes('\n\n') || text.includes('- ');

  // 5. User empathy indicators
  const empathyKeywords = ['user pain', 'customer', 'friction', 'persona', 'interview', 'unmet need', 'frustration', 'delight', 'workflow', 'mental model', 'empathy'];
  const empathyMatches = empathyKeywords.filter(kw => lower.includes(kw));
  const hasUserEmpathy = empathyMatches.length >= 2;

  return {
    hasMetrics,
    hasTradeoffs,
    hasDecisions,
    hasStructure,
    hasUserEmpathy,
    metricMatches,
    tradeoffMatches,
    decisionMatches,
    wordCount
  };
}

/**
 * Step 4: App asks ONE follow-up per answer, targeting whatever the answer is missing
 * (usually: a metric, a trade-off, or a concrete decision)
 */
export function generateFollowUp(question: Question, initialAnswer: string, level: TargetLevel): FollowUpQuestion {
  const analysis = analyzeAnswerFeatures(initialAnswer);

  // Determine the weakest missing link in order of priority for this question type
  let missingElement: MissingElementKind = 'metric';

  if (question.category === 'execution') {
    // In execution questions, metrics & decisions are paramount
    if (!analysis.hasMetrics) {
      missingElement = 'metric';
    } else if (!analysis.hasTradeoffs) {
      missingElement = 'tradeoff';
    } else if (!analysis.hasDecisions) {
      missingElement = 'decision';
    } else {
      missingElement = 'metric'; // Deepen the metrics
    }
  } else if (question.category === 'strategy') {
    // In strategy, tradeoffs and concrete decisions are paramount
    if (!analysis.hasTradeoffs) {
      missingElement = 'tradeoff';
    } else if (!analysis.hasDecisions) {
      missingElement = 'decision';
    } else if (!analysis.hasMetrics) {
      missingElement = 'metric';
    } else {
      missingElement = 'tradeoff';
    }
  } else if (question.category === 'product_sense') {
    // In product sense, tradeoffs between user desires and feasibility, or success metrics
    if (!analysis.hasMetrics) {
      missingElement = 'metric';
    } else if (!analysis.hasTradeoffs) {
      missingElement = 'tradeoff';
    } else {
      missingElement = 'decision';
    }
  } else {
    // Behavioral
    if (!analysis.hasMetrics) {
      missingElement = 'metric';
    } else if (!analysis.hasTradeoffs) {
      missingElement = 'tradeoff';
    } else {
      missingElement = 'decision';
    }
  }

  // Generate surgical follow-up prompts
  if (missingElement === 'metric') {
    const prompts = [
      `You articulated the conceptual solution, but an executive interviewer at the ${level} level will press on quantifiable impact. What exact North Star metric would determine success here, what is your estimated target baseline lift (e.g. +X% or -$Y), and what critical guardrail/counter-metric would you watch to ensure you didn't create collateral damage?`,
      `Your approach outlines the direction, but lacks quantitative grounding. If you had to define the exact telemetry scorecard for this launch in your next leadership review, what 2 primary KPIs and 1 negative guardrail metric would you measure, and why?`,
      `How would you prove this actually moved the needle? Walk me through the specific numbers: What baseline were you starting from, what was the measurable target, and how did you separate statistical noise from real signal?`
    ];
    return {
      missingElement: 'metric',
      missingElementLabel: 'Missing: Quantifiable Metrics & Guardrails',
      explanation: `Your initial response described qualitative intent, but omitted specific target KPIs, baselines, and counter-metrics expected of a ${level}.`,
      prompt: prompts[Math.floor(Math.random() * prompts.length)]
    };
  } else if (missingElement === 'tradeoff') {
    const prompts = [
      `Every PM decision comes with real opportunity costs. In this proposal, what explicit feature, technical simplification, or user cohort did you intentionally choose NOT to support? What was the hardest trade-off you had to defend to engineering or stakeholders?`,
      `This sounds like a win on paper, but where does the friction show up? Walk me through the biggest trade-off between user experience, engineering effort, and short-term business revenue in your approach. What did you sacrifice?`,
      `What is the primary failure mode or second-order downside of your chosen path? If an engineering director pushed back that this creates unsustainable tech debt or operational drag, how would you justify the compromise?`
    ];
    return {
      missingElement: 'tradeoff',
      missingElementLabel: 'Missing: Explicit Trade-offs & Sacrifices',
      explanation: `Your answer sounded overly rosy or idealized. Top PM interviewers look for candidates who explicitly name what they are deprioritizing and why.`,
      prompt: prompts[Math.floor(Math.random() * prompts.length)]
    };
  } else {
    const prompts = [
      `You listed several viable options and dimensions, but a strong ${level} must take a definitive stand. If you had only 1 engineering sprint and could only greenlight ONE exact path tomorrow, which one do you pick, what is the single deciding factor, and how do you break the tie?`,
      `Make the hard call: Rather than balancing all alternatives equally, what is the definitive decision you are making as the DRI (Directly Responsible Individual)? Why is this superior to the second-best alternative?`,
      `Cut through the ambiguity: Which specific segment or technical architecture do you commit to first, and what criteria would trigger you to reverse this decision?`
    ];
    return {
      missingElement: 'decision',
      missingElementLabel: 'Missing: A Concrete, Defensible Decision',
      explanation: `Your answer kept options open without committing to a definitive, high-conviction decision. Interviewers evaluate PMs on decisive prioritization.`,
      prompt: prompts[Math.floor(Math.random() * prompts.length)]
    };
  }
}

/**
 * Step 5: Score the FINAL answer (original + follow-up combined) against the 5 Rubric dimensions
 * Score every answer 1-5 on each dimension. DO NOT average into one number!
 */
export function evaluateCombinedAnswer(
  question: Question,
  initialAnswer: string,
  followUp: FollowUpQuestion,
  followUpAnswer: string,
  level: TargetLevel
): {
  rubricScores: RubricDimensionScore[];
  rewrittenAnswer: { text: string; keyImprovements: string[]; frameworkUsed: string };
  strengths: string[];
  weaknesses: string[];
} {
  const combined = `${initialAnswer}\n\n[Follow-up clarification]: ${followUpAnswer}`;
  const analysisInitial = analyzeAnswerFeatures(initialAnswer);
  const analysisFollowUp = analyzeAnswerFeatures(followUpAnswer);
  const analysisCombined = analyzeAnswerFeatures(combined);

  const initialWords = analysisInitial.wordCount;
  const followUpWords = analysisFollowUp.wordCount;
  const totalWords = analysisCombined.wordCount;

  // 1. RELEVANCE (1-5)
  // Did they directly answer the specific question and follow-up prompt?
  let relevanceScore = 3;
  let relevanceTitle = 'Solid Relevance to Question';
  let relevanceFeedback = 'The answer stays generally on track with the prompt.';
  const relevanceEvidence: string[] = [];
  let relevanceImprovement = 'Anchor every sentence directly to the core prompt before branching out.';

  if (initialWords < 40 || followUpWords < 15) {
    relevanceScore = 1;
    relevanceTitle = 'Underdeveloped / Off-Topic';
    relevanceFeedback = 'The response was too sparse or evasive to directly address the core dilemma and the follow-up probe.';
    relevanceEvidence.push(`Response length is only ${totalWords} words, leaving major aspects of the prompt unanswered.`);
    relevanceImprovement = 'Directly address the specific prompt scenarios and unpack your reasoning step-by-step.';
  } else if (followUpWords > 25 && analysisFollowUp.hasMetrics && followUp.missingElement === 'metric') {
    relevanceScore = 5;
    relevanceTitle = 'Direct, Comprehensive & Laser-Focused';
    relevanceFeedback = 'Directly addressed the core scenario and seamlessly tackled the follow-up probe with targeted specifics.';
    relevanceEvidence.push('Provided concrete numbers directly mapped to the interviewer\'s follow-up request.');
    relevanceImprovement = 'Maintain this precision in live spoken rounds without rambling.';
  } else if (followUpWords > 20) {
    relevanceScore = 4;
    relevanceTitle = 'High Relevance & Direct Engagement';
    relevanceFeedback = 'Addressed both the primary scenario and the follow-up probe without getting sidetracked by irrelevant context.';
    relevanceEvidence.push('Integrated the follow-up clarification directly into the narrative.');
    relevanceImprovement = 'Conclude with a 1-sentence executive summary that ties back to the prompt objective.';
  } else {
    relevanceScore = 2;
    relevanceTitle = 'Tangential or Incomplete Response';
    relevanceFeedback = 'Diverged into general principles rather than solving the concrete scenario posed in the prompt.';
    relevanceEvidence.push('Follow-up answer was cursory and did not fully resolve the interviewer\'s probe.');
    relevanceImprovement = 'Restate the interviewer\'s question in your opening line to maintain razor-sharp focus.';
  }

  // 2. STRUCTURE & CLARITY (1-5)
  // Framework, logical flow, readability, STAR/CIRCLES
  let structureScore = 3;
  let structureTitle = 'Readable Flow';
  let structureFeedback = 'Clear language with natural transitions, though lacks an explicit framework.';
  const structureEvidence: string[] = [];
  let structureImprovement = 'Signpost your sections upfront (e.g. "I will approach this in three phases: diagnosis, trade-off evaluation, and metric guardrails").';

  if (analysisCombined.hasStructure && totalWords >= 120) {
    structureScore = 5;
    structureTitle = 'Masterclass PM Structure';
    structureFeedback = 'Exceptional organizational clarity. Uses clear logical checkpoints, framework signposting, and crisp bulleting.';
    structureEvidence.push('Used structured transitions, sequential numbering, or clear paragraph delineation.');
    structureImprovement = 'Keep this structured executive presence under tight time constraints.';
  } else if (totalWords >= 80 && (analysisInitial.hasStructure || analysisFollowUp.hasStructure)) {
    structureScore = 4;
    structureTitle = 'Well-Structured & Logical Arc';
    structureFeedback = 'Good pacing and coherent progression from problem statement to proposed solution and follow-up defense.';
    structureEvidence.push('Logical progression from context to execution.');
    structureImprovement = 'Add explicit category labels or numbered pillars to make your points instantly scannable for interviewers.';
  } else if (totalWords < 50) {
    structureScore = 1;
    structureTitle = 'Unstructured / Stream of Consciousness';
    structureFeedback = 'Fragmented thoughts without an identifiable framework or logical narrative arc.';
    structureEvidence.push('Lack of paragraph breaks or thematic grouping.');
    structureImprovement = 'Use a standard framework like STAR for behavioral or CIRCLES for product design.';
  } else {
    structureScore = 2;
    structureTitle = 'Loose Structure';
    structureFeedback = 'Ideas are grouped haphazardly; reads like brainstorming rather than a synthesized executive recommendation.';
    structureEvidence.push('Transitions between problem, execution, and outcomes are muddy.');
    structureImprovement = 'Start with your bottom-line recommendation before detailing the rationale.';
  }

  // 3. PRODUCT SENSE & USER EMPATHY (1-5)
  // Persona understanding, deep pain points, intuitive judgment
  let productSenseScore = 3;
  let productSenseTitle = 'Competent Product Intuition';
  let productSenseFeedback = 'Understands the standard user workflow and functional needs.';
  const productSenseEvidence: string[] = [];
  let productSenseImprovement = 'Dig deeper into the emotional and workflow friction of specific underserved personas rather than generic users.';

  if (analysisCombined.hasUserEmpathy && totalWords >= 100) {
    productSenseScore = level === 'Group PM' || level === 'Senior PM' ? 4 : 5;
    productSenseTitle = 'Deep User Empathy & Insightful Product Craft';
    productSenseFeedback = 'Demonstrates deep empathy with the specific pain points and non-obvious nuances of the user persona.';
    productSenseEvidence.push('Articulated specific user friction points and behavioral incentives.');
    productSenseImprovement = 'Connect user friction directly to downstream business retention metrics.';
  } else if (analysisCombined.hasUserEmpathy || totalWords >= 80) {
    productSenseScore = 3;
    productSenseTitle = 'Moderate Product Sense';
    productSenseFeedback = 'Identifies the general problem space, but proposes somewhat conventional or expected solutions.';
    productSenseEvidence.push('Identified standard user personas without deep segmentation.');
    productSenseImprovement = 'Explore 1-2 non-standard edge cases or extreme user cohorts to showcase exceptional product craft.';
  } else if (totalWords >= 40) {
    productSenseScore = 2;
    productSenseTitle = 'Shallow User Insight';
    productSenseFeedback = 'Focuses predominantly on internal mechanics or generic features without empathizing with the real customer problem.';
    productSenseEvidence.push('Mentions features without explaining what user pain they solve.');
    productSenseImprovement = 'Anchor every proposed feature in a real user quote or observed behavioral bottleneck.';
  } else {
    productSenseScore = 1;
    productSenseTitle = 'Lacks User Centricity';
    productSenseFeedback = 'Fails to acknowledge user personas or customer friction points entirely.';
    productSenseEvidence.push('No mention of user personas, pain points, or user feedback loops.');
    productSenseImprovement = 'Always start any product question by stating: "Who is the primary user and what is their acute struggle?"';
  }

  // 4. ANALYTICAL RIGOR & METRICS (1-5)
  // Concrete metrics, North Star, counter-metrics, statistical grounding
  let analyticalScore = 2;
  let analyticalTitle = 'Developing Analytical Rigor';
  let analyticalFeedback = 'Mentions vague improvements (e.g. "improve engagement") without concrete KPIs or guardrails.';
  const analyticalEvidence: string[] = [];
  let analyticalImprovement = 'Define a clear North Star metric (e.g. Weekly Active Transacting Users), a proxy metric, and an explicit guardrail metric.';

  if (analysisCombined.metricMatches.length >= 3 && totalWords >= 100) {
    analyticalScore = 5;
    analyticalTitle = 'Exceptional Quantitative Precision';
    analyticalFeedback = 'Flawless analytical grounding. Pairs primary outcome metrics with statistical targets and counter-metrics.';
    analyticalEvidence.push(`Cited explicit quantitative targets/metrics: ${analysisCombined.metricMatches.slice(0, 3).join(', ')}`);
    analyticalImprovement = 'Discuss sample size / power calculation or MDE if this is an A/B test question.';
  } else if (analysisCombined.hasMetrics || analysisCombined.metricMatches.length >= 1) {
    analyticalScore = analysisCombined.metricMatches.length >= 2 ? 4 : 3;
    analyticalTitle = analysisCombined.metricMatches.length >= 2 ? 'Strong Metric Awareness' : 'Basic Metric Framing';
    analyticalFeedback = analysisCombined.metricMatches.length >= 2
      ? 'Good use of quantifiable metrics, though counter-metrics could be more rigorous.'
      : 'Brought in metrics when probed, but could have established them upfront.';
    analyticalEvidence.push(`Mentioned: ${analysisCombined.metricMatches.join(', ')}`);
    analyticalImprovement = 'Always pair your primary conversion metric with a negative counter-metric (e.g. refund rate, customer support ticket volume).';
  } else {
    analyticalScore = 1;
    analyticalTitle = 'Missing Quantitative Rigor';
    analyticalFeedback = 'Zero quantitative evidence, baselines, or measurable KPI targets.';
    analyticalEvidence.push('No numerical metrics, percentages, or concrete success thresholds detected.');
    analyticalImprovement = 'Quantify everything: state the baseline (e.g. 12%), the target (e.g. 18%), and the time horizon (e.g. 60 days).';
  }

  // 5. TRADE-OFFS & DECISIONS (1-5)
  // Prioritization, sacrificed features, decisive calls, second-order effects
  let tradeoffScore = 2;
  let tradeoffTitle = 'Tentative or Implicit Trade-offs';
  let tradeoffFeedback = 'Hesitant to commit to what was sacrificed or did not take a definitive stand on prioritization.';
  const tradeoffEvidence: string[] = [];
  let tradeoffImprovement = 'Explicitly declare what you are NOT doing and why the chosen path outweighs the discarded alternative.';

  if (analysisCombined.hasTradeoffs && analysisCombined.hasDecisions && totalWords >= 90) {
    tradeoffScore = 5;
    tradeoffTitle = 'Staff-Level Strategic Conviction';
    tradeoffFeedback = 'Exemplary decision-making. Explicitly outlines the sacrifices, defends the prioritization criteria, and shows strong ownership.';
    tradeoffEvidence.push(`Articulated clear trade-offs (${analysisCombined.tradeoffMatches.slice(0, 2).join(', ')}) and committed to a decision.`);
    tradeoffImprovement = 'Address second-order organizational impacts (e.g. sales enablement or partner backlash).';
  } else if (analysisCombined.hasTradeoffs || analysisCombined.hasDecisions) {
    tradeoffScore = analysisCombined.hasTradeoffs && analysisCombined.hasDecisions ? 4 : 3;
    tradeoffTitle = analysisCombined.hasTradeoffs ? 'Recognizes Trade-offs' : 'Decisive but Skips Trade-offs';
    tradeoffFeedback = analysisCombined.hasTradeoffs
      ? 'Acknowledged trade-offs, but could take a firmer stance on the final call.'
      : 'Made a decision, but glossed over the painful compromises or opportunity cost.';
    tradeoffEvidence.push(analysisCombined.hasTradeoffs ? 'Discussed trade-offs or sacrifices.' : 'Made a definitive choice.');
    tradeoffImprovement = 'Use a weighted decision matrix to make your prioritization completely defensible to skeptical stakeholders.';
  } else {
    tradeoffScore = 1;
    tradeoffTitle = 'Avoided Tough Calls';
    tradeoffFeedback = 'Presented a wishful "we will do everything" approach without acknowledging finite engineering capacity or strategic trade-offs.';
    tradeoffEvidence.push('No explicit trade-offs, discarded alternatives, or concrete prioritization criteria.');
    tradeoffImprovement = 'Product management is the art of saying no. State clearly: "We explicitly chose not to build X because the cost of delay on Y was too severe."';
  }

  // Compile the 5 distinct Rubric scores
  const rubricScores: RubricDimensionScore[] = [
    {
      dimension: 'Relevance',
      score: relevanceScore,
      title: relevanceTitle,
      feedback: relevanceFeedback,
      evidence: relevanceEvidence,
      improvement: relevanceImprovement
    },
    {
      dimension: 'Structure & Clarity',
      score: structureScore,
      title: structureTitle,
      feedback: structureFeedback,
      evidence: structureEvidence,
      improvement: structureImprovement
    },
    {
      dimension: 'Product Sense',
      score: productSenseScore,
      title: productSenseTitle,
      feedback: productSenseFeedback,
      evidence: productSenseEvidence,
      improvement: productSenseImprovement
    },
    {
      dimension: 'Analytical Rigor',
      score: analyticalScore,
      title: analyticalTitle,
      feedback: analyticalFeedback,
      evidence: analyticalEvidence,
      improvement: analyticalImprovement
    },
    {
      dimension: 'Trade-offs & Decisions',
      score: tradeoffScore,
      title: tradeoffTitle,
      feedback: tradeoffFeedback,
      evidence: tradeoffEvidence,
      improvement: tradeoffImprovement
    }
  ];

  // Strengths & Weaknesses
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  rubricScores.forEach(r => {
    if (r.score >= 4) {
      strengths.push(`${r.dimension}: ${r.title} — ${r.feedback}`);
    } else if (r.score <= 2) {
      weaknesses.push(`${r.dimension}: ${r.title} — ${r.improvement}`);
    }
  });

  if (strengths.length === 0) {
    strengths.push('Willingness to tackle high-ambiguity prompts with a constructive attitude.');
  }
  if (weaknesses.length === 0) {
    weaknesses.push('Elevate narrative polish for Senior/Executive committee reviews.');
  }

  // Generate Staff-Level Rewritten Answer
  const rewrittenAnswer = generateStaffRewrite(question, initialAnswer, followUpAnswer, level, analysisCombined);

  return {
    rubricScores,
    rewrittenAnswer,
    strengths,
    weaknesses
  };
}

/**
 * Step 6: App shows a rewritten, stronger version of the answer
 */
function generateStaffRewrite(
  question: Question,
  initialAnswer: string,
  followUpAnswer: string,
  level: TargetLevel,
  analysis: AnswerAnalysis
): { text: string; keyImprovements: string[]; frameworkUsed: string } {
  const category = question.category;

  if (category === 'behavioral') {
    return {
      frameworkUsed: 'STAR (Situation, Task, Action, Result) with Staff PM Gravitas',
      keyImprovements: [
        'Added specific baseline and quantified outcome metrics (+28% velocity, 0 SLA breaches)',
        'Explicitly articulated the engineering trade-off matrix used to depersonalize the conflict',
        'Demonstrated active technical empathy rather than positional authority',
        'Included long-term systemic fix (architecture review RFC) to prevent recurring friction'
      ],
      text: `**Situation & Context:**
During our Q3 infrastructure initiative, we faced a critical architectural deadlock. The growth team needed real-time webhook delivery to support our new enterprise cohort, but our principal infrastructure engineer pushed back aggressively, citing that our legacy Redis queue would suffer memory exhaustion under peak 10,000 req/sec loads.

**My Role & The Core Trade-off:**
As the PM lead, I recognized this wasn't an emotional disagreement—it was an unquantified risk trade-off between short-term revenue enablement ($1.8M ARR in pipeline) vs. platform stability (guardrail SLA of 99.99%).

**Decisive Action:**
1. **De-escalate & Re-frame:** Rather than pulling executive rank, I scheduled a 45-minute whiteboarding session where we modeled the p99 latency curve together.
2. **Decoupled Phased Solution:** I proposed a two-phase compromise:
   - *Phase 1 (Immediate MVP):* Implement batch webhook polling with rate-limiting caps on the top 5 high-volume accounts, requiring only 2 engineer-weeks of work.
   - *Phase 2 (Architectural Moat):* Allocate 30% of next sprint capacity to migrate the async message bus to Apache Kafka.
3. **Guardrail Metric Alignment:** We agreed that if queue latency exceeded 250ms, auto-throttling would engage immediately, protecting the core database.

**Measurable Impact & Retrospective:**
We shipped Phase 1 on schedule. We unlocked all 4 pending enterprise deals ($1.8M ARR) with zero downtime incidents. More importantly, we instituted a bi-weekly "Product-Eng Architecture RFC" that eliminated cross-team friction and reduced sprint scope surprises by 45% over the subsequent two quarters.`
    };
  } else if (category === 'product_sense') {
    return {
      frameworkUsed: 'CIRCLES Framework (Goals -> Segmentation -> Pain Points -> 10x Solutions -> Prioritization & Metrics)',
      keyImprovements: [
        'Structured around high-value user segment rather than generic, one-size-fits-all personas',
        'Framed solution around eliminating cognitive overhead and latent friction',
        'Defined precise North Star metric and operational counter-metrics',
        'Named the explicit trade-off: sacrificed advanced customizations in favor of 60-second time-to-value'
      ],
      text: `**1. Strategic Objective & Persona Segmentation:**
Our goal is to transform this experience from a transactional utility into an intelligent, habitual workflow. Looking at our user base, I segment them into three distinct cohorts:
- *Cohort A: High-Frequency Power Users* (Need batch efficiency and API controls)
- *Cohort B: Anxious First-Timers* (Need cognitive hand-holding and trust validation)
- *Cohort C: Passive Casuals* (Low intent, high churn risk)

I prioritize **Cohort B (Anxious First-Timers)** because onboarding conversion currently drops 42% at step 3, representing our single largest growth leak.

**2. Deepest Unmet Pain Point:**
First-timers suffer from "Imposter Friction"—they fear making irreversible mistakes, configuring wrong settings, or exposing themselves to financial or operational vulnerability.

**3. Three Differentiated Solutions:**
- *Idea 1: Intelligent Preset Autopilot:* Zero-config setup where our ML model pre-populates 90% of parameters based on lookalike high-performing profiles.
- *Idea 2: Interactive Sandbox & Simulated Dry-Run:* An instant risk-free test environment where users preview outcomes before going live.
- *Idea 3: Contextual Peer Benchmarking:* Real-time micro-nudges showing how top 10% peers configure the same parameters.

**4. Prioritization & Ruthless Trade-off:**
I prioritize **Idea 1 (Preset Autopilot)** using RICE scoring (High Reach 80%, High Impact 4/5, Moderate Effort). 
*The hard trade-off:* We intentionally sacrifice granular manual configurability in the primary flow, burying custom controls under an "Advanced" accordion to preserve a sub-60-second time-to-first-value.

**5. Success Telemetry:**
- **North Star Metric:** 14-Day Activation Funnel Completion Rate (Target: Baseline 34% -> 52%).
- **Counter / Guardrail Metric:** Day-30 Support Ticket Rate per new user (Guardrail: Must remain < 3.2%).`
    };
  } else if (category === 'execution') {
    return {
      frameworkUsed: 'Systematic MECE Funnel Triage & Risk Mitigation Protocol',
      keyImprovements: [
        'Eliminated guesswork with a structured MECE triage tree (Data Integrity -> Internal Release -> External Shock)',
        'Established immediate stakeholder communication and operational containment protocols',
        'Specified concrete cohort slice dimensions (Geo, App Version, ISP, Payment Gateway)',
        'Defined post-mortem action items to prevent future blindspots'
      ],
      text: `**Phase 1: Operational Containment & Sanity Checks (0-20 mins)**
1. **Rule Out Telemetry Failure:** First, verify with data engineering whether the 12% drop is a real behavioral drop or a logging/pipeline outage. Check raw event ingestion lags, Kafka consumer offsets, and database write queues.
2. **Incident Severity & Stakeholder Comms:** Spin up a P1 incident Slack bridge. Send an executive advisory to leadership with: *Identified Issue, Time of Inception, Impacted Surfaces, Lead Incident Commander, and Next Update Time (within 45 mins)*.

**Phase 2: MECE Hypothesis Breakdown (20-60 mins)**
I isolate the drop across three mutually exclusive vectors:
- *Internal Engineering Triggers:* Check Friday/weekend deployment manifests, feature flag toggles, experiment rollouts, and third-party partner API degradation (e.g. gateway timeout spikes).
- *Cohort Slice & Blast Radius:* Cut the data by:
  - Client platform: iOS vs. Android vs. Web (e.g. Did a new iOS build break auth?)
  - Geography & Currency: Localized network outages, banking partner downtime.
  - User Tenure: New vs. Returning users.
- *External Macro Factors:* Major holiday, competitor promotional campaign, regulatory crackdown.

**Phase 3: Decisive Mitigation (60-90 mins)**
If the root cause traces to a weekend canary deployment (e.g. 15% increase in checkout gateway timeouts on iOS build 4.12):
- **Immediate Rollback:** Execute instant zero-downtime rollback of feature flag \`checkout_v2_bundle\` to stable baseline.
- **Verification:** Monitor live transaction throughput over a 15-minute sliding window to confirm recovery to normal baseline (e.g. 98.4% success).

**Phase 4: Post-Mortem & Structural Prevention**
Conduct a blameless post-mortem within 48 hours. Implement automated canary rollback triggers that immediately revert flags if checkout error rates exceed 0.5% for >3 minutes, eliminating reliance on manual morning dashboard triage.`
    };
  } else {
    // Strategy
    return {
      frameworkUsed: 'Strategic Moat Defense & Capital Allocation Matrix',
      keyImprovements: [
        'Evaluated competitive threat through network effects and switching cost defensibility',
        'Refused superficial price-matching in favor of high-margin ecosystem lock-in',
        'Allocated resources across clear strategic pillars with measurable leading indicators',
        'Demonstrated C-suite narrative calibration and proactive ecosystem strategy'
      ],
      text: `**1. Executive Threat Assessment:**
A competitor launching a zero-fee alternative is not an existential crisis—it is a classic commoditization play on our base utility layer. Competing in a race to the bottom on price destroys our unit economics. Instead, our strategic moat must shift from the transactional layer to our **proprietary network effects, enterprise data gravity, and developer workflow lock-in**.

**2. Strategic Posture: Do Not Match—Leapfrog:**
- *Why we do not price match:* Our cost structure and enterprise reliability justify premium pricing. Lowering prices signals that our products are interchangeable.
- *Our Counter-Attack:* Double down on the workflow integration where switching costs are prohibitive (e.g., automated reconciliation, multi-entity tax reporting, and sub-100ms API reliability).

**3. Two-Horizon Execution Roadmap:**
- **Horizon 1 (Next 90 Days - Defense & Retention):**
  - Implement a dedicated "Enterprise Retention Swat Team" with pre-approved custom SLA packaging for our top 20% accounts (which generate 78% of revenue).
  - Launch a self-serve ROI Calculator inside the admin portal demonstrating that switching yields negative ROI once developer migration hours are factored in.
- **Horizon 2 (Next 180 Days - Platform Moat):**
  - Unveil our AI Workflow Automation Platform—bundling fraud prevention, intelligent treasury routing, and predictive cash flow into an all-in-one suite that a point-solution competitor cannot replicate.

**4. The Ruthless Trade-off:**
We intentionally pause our international speculative consumer beta to re-allocate 15 engineers directly to enterprise API performance and developer toolchain ergonomics.

**5. Boardroom Scorecard:**
- **Primary Metric:** Net Revenue Retention (NRR) among Tier-1 accounts (Maintain >= 122%).
- **Leading Indicator:** Competitor Win/Loss ratio in head-to-head RFP evaluations (Target: Win rate > 75%).`
    };
  }
}

/**
 * Step 7: After all questions: a session summary showing patterns across answers
 * (e.g. "you consistently skip quantifying impact")
 */
export function generateSessionMetaSummary(
  targetLevel: TargetLevel,
  roleTitle: string,
  companyName: string,
  evaluatedAnswers: EvaluatedAnswer[]
): SessionMetaSummary {
  const totalQuestions = evaluatedAnswers.length;

  // Calculate dimension averages
  const dimensionTotals: Record<string, number> = {
    'Relevance': 0,
    'Structure & Clarity': 0,
    'Product Sense': 0,
    'Analytical Rigor': 0,
    'Trade-offs & Decisions': 0
  };

  evaluatedAnswers.forEach(ans => {
    ans.rubricScores.forEach(scoreItem => {
      if (dimensionTotals[scoreItem.dimension] !== undefined) {
        dimensionTotals[scoreItem.dimension] += scoreItem.score;
      }
    });
  });

  const dimensionAverages: Record<string, number> = {};
  Object.keys(dimensionTotals).forEach(dim => {
    dimensionAverages[dim] = totalQuestions > 0 ? Number((dimensionTotals[dim] / totalQuestions).toFixed(1)) : 0;
  });

  // Analyze systematic cross-answer patterns
  const patterns: PatternInsight[] = [];

  // Pattern 1: Quantifying impact
  let skippedMetricsCount = 0;
  evaluatedAnswers.forEach(ans => {
    const analysis = analyzeAnswerFeatures(ans.initialAnswer);
    if (!analysis.hasMetrics) skippedMetricsCount++;
  });

  if (skippedMetricsCount >= Math.ceil(totalQuestions * 0.5)) {
    patterns.push({
      type: 'weakness',
      dimension: 'Analytical Rigor',
      title: 'Consistently Skips Quantifying Impact',
      summary: `You omitted concrete metrics, baseline numbers, or percentage targets in your initial answer across ${skippedMetricsCount} of ${totalQuestions} questions. You only supplied numbers after explicit interviewer follow-ups.`,
      occurrences: skippedMetricsCount,
      totalQuestions,
      recommendation: 'Train yourself to make "Metric Anchoring" your second sentence in every PM answer. State the baseline, target delta, and guardrail metric upfront.'
    });
  } else if (dimensionAverages['Analytical Rigor'] >= 4) {
    patterns.push({
      type: 'strength',
      dimension: 'Analytical Rigor',
      title: 'Consistently Rigorous Data Grounding',
      summary: `Strong analytical discipline. You proactively introduced KPIs, sample sizing, and counter-metrics across ${totalQuestions - skippedMetricsCount} questions without needing hand-holding.`,
      occurrences: totalQuestions - skippedMetricsCount,
      totalQuestions,
      recommendation: 'Maintain this rigor and continue tying guardrail metrics to company-wide financial health.'
    });
  }

  // Pattern 2: Trade-offs & Decisions
  let skippedTradeoffsCount = 0;
  evaluatedAnswers.forEach(ans => {
    const analysis = analyzeAnswerFeatures(ans.initialAnswer);
    if (!analysis.hasTradeoffs) skippedTradeoffsCount++;
  });

  if (skippedTradeoffsCount >= Math.ceil(totalQuestions * 0.5)) {
    patterns.push({
      type: 'weakness',
      dimension: 'Trade-offs & Decisions',
      title: 'Reluctance to Articulate Explicit Sacrifices',
      summary: `In ${skippedTradeoffsCount} of ${totalQuestions} questions, your initial answers described ideal solutions without declaring what features, user segments, or technical debts you would deprioritize.`,
      occurrences: skippedTradeoffsCount,
      totalQuestions,
      recommendation: 'Use the phrase: "The hardest trade-off here is X versus Y. I intentionally sacrifice X because Y has higher strategic leverage."'
    });
  }

  // Pattern 3: Structure
  let weakStructureCount = 0;
  evaluatedAnswers.forEach(ans => {
    const s = ans.rubricScores.find(r => r.dimension === 'Structure & Clarity');
    if (s && s.score <= 2) weakStructureCount++;
  });

  if (weakStructureCount >= 2) {
    patterns.push({
      type: 'weakness',
      dimension: 'Structure & Clarity',
      title: 'Tendency Toward Unstructured Brainstorming',
      summary: `In ${weakStructureCount} questions, your ideas arrived as an unsegmented stream of consciousness rather than a structured executive narrative.`,
      occurrences: weakStructureCount,
      totalQuestions,
      recommendation: 'Always outline your response structure in the first 10 seconds: "I will approach this across 3 vectors: 1. User friction, 2. Solution space, 3. Success telemetry."'
    });
  } else if (dimensionAverages['Structure & Clarity'] >= 4) {
    patterns.push({
      type: 'strength',
      dimension: 'Structure & Clarity',
      title: 'Crisp, Scannable Executive Communication',
      summary: 'You consistently use clear frameworks (STAR, CIRCLES, MECE) with logical transitions that make your arguments easy for interviewers to follow.',
      occurrences: totalQuestions - weakStructureCount,
      totalQuestions,
      recommendation: 'Use this structured clarity to anchor team alignment in cross-functional meetings.'
    });
  }

  // Pattern 4: User Empathy
  if (dimensionAverages['Product Sense'] >= 4) {
    patterns.push({
      type: 'strength',
      dimension: 'Product Sense',
      title: 'Strong Natural User Empathy & Craft',
      summary: 'You excel at visualizing the authentic human frustrations behind business problems and designing intuitive workflows.',
      occurrences: totalQuestions,
      totalQuestions,
      recommendation: 'Pair this strong user empathy with clear engineering feasibility assessments.'
    });
  } else if (dimensionAverages['Product Sense'] <= 2.5) {
    patterns.push({
      type: 'weakness',
      dimension: 'Product Sense',
      title: 'Overly Abstract or Feature-Obsessed Framing',
      summary: 'Your product sense answers tended to list technical mechanisms or generic features without stepping into the shoes of the specific persona.',
      occurrences: totalQuestions,
      totalQuestions,
      recommendation: 'Spend the first 2 minutes of any product design question explicitly mapping the user\'s daily emotional journey and unaddressed friction.'
    });
  }

  // Overall Readiness calculation
  const overallAvg = Object.values(dimensionAverages).reduce((a, b) => a + b, 0) / 5;
  const levelReadinessScore = Math.min(100, Math.max(10, Math.round((overallAvg / 5) * 100)));

  let levelReadinessLabel: SessionMetaSummary['levelReadinessLabel'] = 'Developing Potential';
  if (levelReadinessScore >= 82) {
    levelReadinessLabel = 'Strong Hire / Above Bar';
  } else if (levelReadinessScore >= 68) {
    levelReadinessLabel = 'Solid Candidate';
  } else if (levelReadinessScore >= 50) {
    levelReadinessLabel = 'Developing Potential';
  } else {
    levelReadinessLabel = 'Needs Preparation';
  }

  const topStrengths: string[] = [];
  const priorityFixes: string[] = [];

  patterns.forEach(p => {
    if (p.type === 'strength') topStrengths.push(`${p.title}: ${p.summary}`);
    if (p.type === 'weakness') priorityFixes.push(`${p.title}: ${p.recommendation}`);
  });

  if (topStrengths.length === 0) {
    topStrengths.push('Adaptable response formulation and willingness to incorporate live interviewer feedback.');
    topStrengths.push('Good breadth of product awareness across behavioral and execution scenarios.');
  }

  if (priorityFixes.length === 0) {
    priorityFixes.push('Push for L6+ executive brevity: state your bottom-line takeaway in the first sentence.');
  }

  const executiveSummary = `Across this ${totalQuestions}-question mock loop for the ${targetLevel} role at ${companyName}, you scored an average of ${overallAvg.toFixed(1)} / 5.0 across the 5 PM evaluation dimensions. Your highest performing dimension was ${
    Object.entries(dimensionAverages).sort((a, b) => b[1] - a[1])[0][0]
  } (${Object.entries(dimensionAverages).sort((a, b) => b[1] - a[1])[0][1]} / 5.0), while your primary growth lever to comfortably clear the ${targetLevel} hiring bar is ${
    Object.entries(dimensionAverages).sort((a, b) => a[1] - b[1])[0][0]
  } (${Object.entries(dimensionAverages).sort((a, b) => a[1] - b[1])[0][1]} / 5.0).`;

  const actionPlan = [
    {
      week: 'Week 1: Quantitative Anchoring Drills',
      focus: 'Eliminating the "skipped metrics" habit',
      exercises: [
        'Practice the 3-Metric Drill: For every feature you mention, force yourself to write (1) North Star, (2) Conversion proxy, (3) Safety guardrail.',
        'Back-of-the-envelope estimation: Practice estimating TAM, latency impact, and daily transaction volume in 3 minutes.'
      ]
    },
    {
      week: 'Week 2: Trade-off & Decision Matrix Drills',
      focus: 'Defending ruthless prioritization',
      exercises: [
        'Write 5 "Anti-Roadmaps": Practice listing 3 great ideas and explaining why you refuse to build them this quarter.',
        'RICE and Cost-of-Delay simulations: Justify tech debt refactors versus short-term feature builds.'
      ]
    },
    {
      week: 'Week 3: Executive Framework Speed Runs',
      focus: 'STAR and CIRCLES mastery under time pressure',
      exercises: [
        '3-Minute Spoken STAR drills: Practice answering behavioral conflict questions in under 180 seconds with clear punchlines.',
        'MECE incident triage roleplay: Walk through sudden 10% metric drops without jumping to premature conclusions.'
      ]
    }
  ];

  return {
    targetLevel,
    roleTitle,
    companyName,
    totalQuestions,
    completedQuestions: totalQuestions,
    dimensionAverages,
    levelReadinessScore,
    levelReadinessLabel,
    executiveSummary,
    systematicPatterns: patterns,
    topStrengths,
    priorityFixes,
    actionPlan
  };
}
