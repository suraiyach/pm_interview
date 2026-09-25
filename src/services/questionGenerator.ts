import { Question, TargetLevel } from '../types';

interface JDAnalysis {
  company: string;
  domain: string;
  keywords: string[];
  productType: 'b2b' | 'consumer' | 'marketplace' | 'fintech' | 'ai' | 'general';
}

export function analyzeJD(jdText: string, level: TargetLevel): JDAnalysis {
  const lower = jdText.toLowerCase();

  // Company detection
  let company = 'Tech Company';
  const companies = ['stripe', 'uber', 'airbnb', 'google', 'youtube', 'shopify', 'meta', 'amazon', 'apple', 'microsoft', 'netflix', 'doordash', 'lyft', 'coinbase', 'plaid', 'figma', 'notion', 'slack'];
  for (const c of companies) {
    if (lower.includes(c)) {
      company = c.charAt(0).toUpperCase() + c.slice(1);
      break;
    }
  }

  // Domain detection
  let domain = 'Product Growth & Core Platform';
  let productType: JDAnalysis['productType'] = 'general';

  if (lower.includes('payout') || lower.includes('payment') || lower.includes('treasury') || lower.includes('fintech') || lower.includes('banking')) {
    domain = 'Fintech Infrastructure & Payouts';
    productType = 'fintech';
  } else if (lower.includes('driver') || lower.includes('marketplace') || lower.includes('dispatch') || lower.includes('rider') || lower.includes('two-sided')) {
    domain = 'Two-Sided Marketplace & Dynamic Supply';
    productType = 'marketplace';
  } else if (lower.includes('host') || lower.includes('guest') || lower.includes('onboarding') || lower.includes('trust') || lower.includes('consumer')) {
    domain = 'Consumer Experience & Onboarding Trust';
    productType = 'consumer';
  } else if (lower.includes('creator') || lower.includes('video') || lower.includes('content') || lower.includes('youtube') || lower.includes('community')) {
    domain = 'Creator Economy & Engagement Tools';
    productType = 'consumer';
  } else if (lower.includes('ai') || lower.includes('llm') || lower.includes('machine learning') || lower.includes('agent') || lower.includes('copilot')) {
    domain = 'Agentic AI & Workflow Automation';
    productType = 'ai';
  } else if (lower.includes('enterprise') || lower.includes('b2b') || lower.includes('saas') || lower.includes('api') || lower.includes('developer')) {
    domain = 'Enterprise B2B & Developer Platform';
    productType = 'b2b';
  }

  // Extract core keywords
  const candidateKeywords = [
    'latency', 'conversion', 'churn', 'retention', 'activation', 'experimentation',
    'a/b testing', 'roadmap', 'stakeholder', 'scalability', 'compliance', 'revenue',
    'take-rate', 'unit economics', 'onboarding', 'reliability', 'algorithm', 'engagement'
  ];
  const foundKeywords = candidateKeywords.filter(kw => lower.includes(kw));

  return { company, domain, keywords: foundKeywords, productType };
}

export function generateQuestionsForJD(jdText: string, level: TargetLevel): Question[] {
  const analysis = analyzeJD(jdText, level);
  const company = analysis.company;
  const domain = analysis.domain;

  const questions: Question[] = [];

  // 1. Behavioral Question (Calibrated to Level)
  if (level === 'APM') {
    questions.push({
      id: 'q1-behavioral',
      category: 'behavioral',
      categoryLabel: 'Behavioral & Collaboration',
      title: 'Managing Disagreement with Engineering on Scope',
      context: `As an APM on ${company}'s ${domain} team, you will collaborate daily with experienced engineers. Tell me about a time when you strongly advocated for a product requirement or user experience change, but your lead engineer argued it was too complex or low priority. How did you handle the situation and what was the outcome?`,
      competency: 'Collaboration & Influence Without Authority',
      levelExpectation: 'Demonstrate active listening, curiosity, willingness to understand technical constraints, and data-backed persuasion rather than emotional pushback.',
      frameworkTip: 'Use the STAR method (Situation, Task, Action, Result). Highlight your specific contribution and what you learned.',
      idealKeyElements: ['Technical empathy', 'Shared problem framing', 'Iterative compromise/scope phasing', 'Quantifiable project outcome']
    });
  } else if (level === 'PM') {
    questions.push({
      id: 'q1-behavioral',
      category: 'behavioral',
      categoryLabel: 'Behavioral & Ownership',
      title: 'Leading Through a High-Stakes Project Pivot',
      context: `In fast-moving environments like ${company}, priorities shift based on market realities. Describe a situation in your PM career where halfway through execution, qualitative feedback or early metric signals showed your initial thesis was wrong. How did you steer the cross-functional team, communicate to leadership, and pivot?`,
      competency: 'Intellectual Honesty & Decisive Ownership',
      levelExpectation: 'Show rapid pattern recognition, calm leadership under uncertainty, stakeholder transparency, and turning a potential setback into a strategic win.',
      frameworkTip: 'Frame around: Trigger data -> Team communication -> Re-evaluating alternatives -> Execution pivot -> Concrete learnings.',
      idealKeyElements: ['Metric anomaly detection', 'Stakeholder alignment', 'Sunk cost mitigation', 'Measurable pivot result']
    });
  } else if (level === 'Senior PM') {
    questions.push({
      id: 'q1-behavioral',
      category: 'behavioral',
      categoryLabel: 'Behavioral & Cross-Functional Influence',
      title: 'Resolving Severe Cross-Team Architectural or Metric Conflict',
      context: `As a Senior PM at ${company}, you often face misaligned organizational incentives (e.g. Growth team pushing short-term conversion vs Trust/Risk or Infrastructure teams prioritizing compliance and long-term reliability). Describe a major cross-functional gridlock you navigated between two executive or engineering stakeholders. How did you architect the compromise and enforce accountability?`,
      competency: 'Executive Influence & Systemic Conflict Resolution',
      levelExpectation: 'Articulate principle-based frameworks over superficial compromises; show how you decoupled goals, quantified tradeoffs, and created win-win accountability mechanisms.',
      frameworkTip: 'Structure: Conflicting organizational incentives -> Alignment framework used -> Hard tradeoff decided -> Long-term systemic resolution.',
      idealKeyElements: ['Incentive alignment', 'Quantified trade-off matrix', 'Executive communication', 'Sustained organizational metric impact']
    });
  } else {
    // Group PM
    questions.push({
      id: 'q1-behavioral',
      category: 'behavioral',
      categoryLabel: 'Behavioral & Leadership Craft',
      title: 'Coaching a Struggling PM & Rebuilding Trust Across Organizations',
      context: `As a Group PM at ${company}, your impact is multiplied through your product leads. Walk me through a time when a PM on your team was failing to deliver on a critical pillar, resulting in declining team morale and eroded partner trust. How did you diagnose whether it was a competence, clarity, or organizational issue, and how did you intervene without micromanaging?`,
      competency: 'People Management & High-Performance Team Building',
      levelExpectation: 'Demonstrate deep empathy, situational leadership, root-cause diagnosis, constructive coaching, and organizational shielding.',
      frameworkTip: 'Structure: Diagnostic approach -> Direct feedback & growth plan -> Structural shielding -> Outcome for the PM and the organization.',
      idealKeyElements: ['Root-cause diagnosis', 'Actionable feedback cadence', 'Stakeholder relationship repair', 'Team retention & growth']
    });
  }

  // 2. Product Sense: Core Experience & User Problem
  questions.push({
    id: 'q2-product-sense',
    category: 'product_sense',
    categoryLabel: 'Product Sense & Design',
    title: `Re-architecting the ${company} ${domain} Experience`,
    context: `Imagine you are tasked with reimagining the core workflow in ${company}'s ${domain} for the next 3 years. Who are the primary user personas, what are their deepest unaddressed pain points today, and what 3 distinct product concepts would you explore to deliver a 10x improvement?`,
    competency: 'User Empathy, Problem Space Exploration & Creativity',
    levelExpectation: level === 'APM'
      ? 'Clear persona definition, relatable pain points, and creative, intuitive feature solutions.'
      : level === 'PM'
      ? 'Segmentation by user value, prioritization criteria across technical feasibility and business value.'
      : 'Ecosystem analysis, network effects, second-order customer behavior, and defensible product differentiation.',
    frameworkTip: 'CIRCLES or Problem-User-Solution framework: 1. Goal -> 2. Persona Segmentation -> 3. Pain Points -> 4. Solutions -> 5. Prioritization & Success Metric.',
    idealKeyElements: ['User segmentation', 'Prioritized pain points', 'Differentiated solutions', 'North star metric']
  });

  // 3. Product Sense: Edge Cases & Accessibility / Inclusivity
  questions.push({
    id: 'q3-product-sense',
    category: 'product_sense',
    categoryLabel: 'Product Sense & Edge Cases',
    title: `Designing for Non-Standard / High-Risk Cohorts in ${company}`,
    context: `Most products work well for the happy path. In ${company}'s ${domain}, consider edge-case or vulnerable user cohorts (e.g. users experiencing localized service outages, first-time non-digital natives, or extreme power users hitting scale bottlenecks). Pick one challenging cohort and design a bespoke end-to-end experience that solves their acute crisis.`,
    competency: 'Product Craft, Edge-Case Anticipation & Empathy',
    levelExpectation: 'Go beyond superficial UI tweaks. Analyze systemic fail-safes, clear feedback states, graceful degradation, and emotional reassurance.',
    frameworkTip: 'Identify extreme user state -> Map emotional & operational breakdown points -> Design fail-safes & recovery workflows -> Define guardrail metrics.',
    idealKeyElements: ['Extreme user persona', 'Failure state mapping', 'Graceful recovery flows', 'Trust preservation']
  });

  // 4. Execution & Analytical: Metric Drop Triage
  questions.push({
    id: 'q4-execution',
    category: 'execution',
    categoryLabel: 'Execution & Analytical Rigor',
    title: 'Root-Cause Triage: Critical Metric Dropped 12% Overnight',
    context: `It is 9:00 AM on Monday at ${company}. Your executive dashboard alerts you that the primary health metric for ${domain} (e.g. successful transaction rate, activation funnel completion, or driver/host availability) dropped 12% over the weekend with no planned service disruptions. Walk me through your step-by-step diagnostic playbook for the next 2 hours.`,
    competency: 'Analytical Diagnostics, Funnel Telemetry & Incident Leadership',
    levelExpectation: 'Do not jump to solutions. Formulate a structured MECE breakdown: data integrity checks -> internal release correlations -> external macro factors -> geographic/segment cuts -> mitigation comms.',
    frameworkTip: 'MECE Funnel Triage: Internal (deployments, infra, A/B test bugs) vs External (holidays, competitor, regulations) vs Telemetry/Logging errors.',
    idealKeyElements: ['Data sanity check', 'Segment isolation (OS/geo/cohort)', 'Internal change audit', 'Stakeholder communication protocol']
  });

  // 5. Execution & Analytical: A/B Experiment & Counter-Metrics
  questions.push({
    id: 'q5-execution',
    category: 'execution',
    categoryLabel: 'Execution & Experimentation',
    title: 'Designing an A/B Test with High Cannibalization / Negative Spillover Risk',
    context: `You are launching a major optimization to the ${domain} funnel at ${company}. Early prototypes show a +6% lift in the primary conversion metric, but customer support reports a slight increase in post-conversion friction, and partner teams worry about latency or margin impact. How do you design the experimentation framework, select your primary, secondary, and guardrail metrics, and decide whether to roll out?`,
    competency: 'Statistical Experimentation, Guardrail Telemetry & Rollout Strategy',
    levelExpectation: 'Explicitly define guardrails and trade-offs. Discuss sample size / power calculation, minimum detectable effect (MDE), and cohort cannibalization.',
    frameworkTip: 'Hypothesis -> Unit of Diversion -> Primary metric -> Guardrail/Counter-metrics -> Decision thresholds -> Rollout phasing.',
    idealKeyElements: ['Primary vs Guardrail metrics', 'Spillover/Cannibalization handling', 'Statistical significance & power', 'Staged rollout plan']
  });

  // 6. Strategy: Competitive Defense & Ecosystem Shifts
  questions.push({
    id: 'q6-strategy',
    category: 'strategy',
    categoryLabel: 'Strategy & Market Dynamics',
    title: `Defending ${company}'s Moat Against Aggressive Industry Disruption`,
    context: `A well-funded competitor (or a major platform giant like Apple or Google) announces an aggressive zero-fee or AI-native alternative targeting ${company}'s ${domain}. Your VP asks for your strategic evaluation: Is this an existential threat, a distraction, or an opportunity? What is your 6-month and 2-year counter-strategy?`,
    competency: 'Strategic Thinking, Moat Defense & Long-Term Vision',
    levelExpectation: level === 'APM' || level === 'PM'
      ? 'Identify core user switching costs, brand trust, and where the competitor is weak.'
      : 'Evaluate flywheel effects, proprietary data moats, switching costs, ecosystem partnerships, and bold counter-moves (e.g. open APIs, platform bundle).',
    frameworkTip: 'Threat Assessment (Customer overlap, switching friction) -> Competitive Advantage Audit -> Strategic Options (Ignore, Match, Leapfrog) -> Roadmap shift.',
    idealKeyElements: ['Switching cost evaluation', 'Proprietary data/flywheel moat', 'Leapfrog innovation vector', 'Resource allocation shift']
  });

  // 7. Strategy & Level-Specific Capstone (Prioritization or Portfolio Allocation)
  if (level === 'APM' || level === 'PM') {
    questions.push({
      id: 'q7-strategy',
      category: 'strategy',
      categoryLabel: 'Strategy & Prioritization',
      title: 'Ruthless Roadmap Prioritization with Limited Engineering Bandwidth',
      context: `You have 3 high-impact feature initiatives for ${domain} next quarter, but engineering only has capacity to ship ONE: 
Option A: Tech debt & infrastructure refactor that reduces latency by 40% and improves system reliability.
Option B: A top customer-requested feature that unlocks $2M in projected incremental ARR.
Option C: A zero-to-one speculative innovation that your founders are excited about for market PR.
How do you evaluate and prioritize? Make a definitive call.`,
      competency: 'Prioritization Frameworks, Trade-offs & Executive Defense',
      levelExpectation: 'Do not choose "we will do a little of all three". Make a definitive decision, explain the scoring framework (RICE, cost of delay), and explain how you communicate what is NOT being built.',
      frameworkTip: 'Define evaluation criteria -> Quantify opportunity cost & risk -> Make decisive recommendation -> Mitigation for deferred items.',
      idealKeyElements: ['Definitive selection', 'Explicit trade-off justification', 'Mitigation for unselected tracks', 'Executive communication strategy']
    });
  } else {
    // Senior PM & Group PM
    questions.push({
      id: 'q7-strategy',
      category: 'strategy',
      categoryLabel: 'Strategy & Organizational Resource Allocation',
      title: `Multi-Year Vision & Portfolio Capital Allocation for ${domain}`,
      context: `As a ${level} overseeing ${domain} at ${company}, you are preparing the annual strategic review for the C-suite. You have a budget of 40 headcount and \$15M in operational compute/budget. How do you divide your portfolio across: Core Optimization (Current Cash Cow), Strategic Expansion (Adjacent Segments), and Moonshots (Breakthrough AI/Platforms)? Defend your investment thesis and tell us how you measure portfolio ROI.`,
      competency: 'Portfolio Management, Horizon Planning & Executive Governance',
      levelExpectation: 'Use 70-20-10 or Horizon 1-2-3 frameworks with specific, defensible percentage allocations tailored to company stage and domain maturity.',
      frameworkTip: 'Horizon 1/2/3 allocation -> Risk-weighted expected value -> Leading vs Lagging milestone governance -> Talent distribution.',
      idealKeyElements: ['Horizon allocation rationale', 'Capital and headcount sizing', 'Milestone-based governance', 'Executive narrative']
    });
  }

  return questions;
}
