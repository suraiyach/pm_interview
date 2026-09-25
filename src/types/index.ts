export type TargetLevel = 'APM' | 'PM' | 'Senior PM' | 'Group PM';

export type QuestionCategory = 'behavioral' | 'product_sense' | 'execution' | 'strategy';

export interface RubricDimensionScore {
  dimension: 'Relevance' | 'Structure & Clarity' | 'Product Sense' | 'Analytical Rigor' | 'Trade-offs & Decisions';
  score: number; // 1 to 5
  title: string;
  feedback: string;
  evidence: string[]; // Specific quotes or missing points
  improvement: string;
}

export interface Question {
  id: string;
  category: QuestionCategory;
  categoryLabel: string;
  title: string;
  context: string;
  competency: string;
  levelExpectation: string;
  frameworkTip: string;
  idealKeyElements: string[];
}

export type MissingElementKind = 'metric' | 'tradeoff' | 'decision';

export interface FollowUpQuestion {
  missingElement: MissingElementKind;
  missingElementLabel: string;
  explanation: string;
  prompt: string;
}

export interface EvaluatedAnswer {
  questionId: string;
  initialAnswer: string;
  followUp: FollowUpQuestion;
  followUpAnswer: string;
  combinedAnswer: string;
  rubricScores: RubricDimensionScore[];
  rewrittenAnswer: {
    text: string;
    keyImprovements: string[];
    frameworkUsed: string;
  };
  strengths: string[];
  weaknesses: string[];
  evaluationTimestamp: number;
}

export interface PatternInsight {
  type: 'weakness' | 'strength' | 'neutral';
  dimension: string;
  title: string;
  summary: string;
  occurrences: number;
  totalQuestions: number;
  recommendation: string;
}

export interface SessionMetaSummary {
  targetLevel: TargetLevel;
  roleTitle: string;
  companyName: string;
  totalQuestions: number;
  completedQuestions: number;
  dimensionAverages: Record<string, number>;
  levelReadinessScore: number; // 0 - 100%
  levelReadinessLabel: 'Needs Preparation' | 'Developing Potential' | 'Solid Candidate' | 'Strong Hire / Above Bar';
  executiveSummary: string;
  systematicPatterns: PatternInsight[];
  topStrengths: string[];
  priorityFixes: string[];
  actionPlan: {
    week: string;
    focus: string;
    exercises: string[];
  }[];
}

export interface InterviewSession {
  id: string;
  targetLevel: TargetLevel;
  jobDescription: string;
  roleTitle: string;
  companyName: string;
  questions: Question[];
  currentQuestionIndex: number;
  evaluatedAnswers: EvaluatedAnswer[];
  stage: 'setup' | 'interview' | 'summary';
  apiKey?: string;
  useLiveLLM: boolean;
}
