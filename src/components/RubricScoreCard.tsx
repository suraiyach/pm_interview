import React from 'react';
import { RubricDimensionScore } from '../types';
import { CheckCircle, AlertTriangle, XCircle, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';

interface RubricScoreCardProps {
  scores: RubricDimensionScore[];
}

export const RubricScoreCard: React.FC<RubricScoreCardProps> = ({ scores }) => {
  const getScoreBadge = (score: number) => {
    switch (score) {
      case 5:
        return {
          label: '5/5 • Exemplary (Staff PM)',
          color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          barColor: 'bg-emerald-500',
          icon: <Sparkles className="w-4 h-4 text-emerald-400" />
        };
      case 4:
        return {
          label: '4/5 • Strong PM Bar',
          color: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
          barColor: 'bg-teal-500',
          icon: <CheckCircle className="w-4 h-4 text-teal-400" />
        };
      case 3:
        return {
          label: '3/5 • Solid Baseline',
          color: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
          barColor: 'bg-blue-500',
          icon: <TrendingUp className="w-4 h-4 text-blue-400" />
        };
      case 2:
        return {
          label: '2/5 • Developing Gaps',
          color: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          barColor: 'bg-amber-500',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />
        };
      default:
        return {
          label: '1/5 • Needs Immediate Focus',
          color: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          barColor: 'bg-rose-500',
          icon: <XCircle className="w-4 h-4 text-rose-400" />
        };
    }
  };

  const dimensionDescriptions: Record<string, string> = {
    'Relevance': 'Directly answering the core question and follow-up without evasion or fluff.',
    'Structure & Clarity': 'Logical organization, frameworks (STAR/CIRCLES), clear executive communication.',
    'Product Sense': 'Deep empathy for user pain points, persona friction, and intuitive product craft.',
    'Analytical Rigor': 'Quantitative KPIs, baselines, guardrail metrics, and data-driven reasoning.',
    'Trade-offs & Decisions': 'Explicit sacrifices, deprioritized alternatives, and high-conviction calls.'
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-bold text-white tracking-tight">
              Evaluation Rubric Breakdown
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              5 Independent Dimensions
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Scored 1–5 on each dimension independently (never averaged into a vague overall number).
          </p>
        </div>
      </div>

      {/* 5 Distinct Dimension Cards */}
      <div className="grid grid-cols-1 gap-4">
        {scores.map((item, idx) => {
          const badge = getScoreBadge(item.score);
          return (
            <div
              key={item.dimension}
              className="p-4 rounded-xl bg-slate-850/80 border border-slate-750/70 hover:border-slate-700 transition-all space-y-3"
            >
              {/* Header: Dimension Name & Score Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-slate-400">0{idx + 1}.</span>
                    <span className="font-bold text-sm text-white">{item.dimension}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 italic">
                    {dimensionDescriptions[item.dimension] || ''}
                  </p>
                </div>

                <div className="flex items-center space-x-2 self-start sm:self-auto">
                  {/* Visual 5-block indicator */}
                  <div className="flex space-x-1 mr-1">
                    {[1, 2, 3, 4, 5].map(step => (
                      <div
                        key={step}
                        className={`w-3.5 h-2 rounded-sm transition-all ${
                          step <= item.score ? badge.barColor : 'bg-slate-750'
                        }`}
                      />
                    ))}
                  </div>
                  <span
                    className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${badge.color}`}
                  >
                    {badge.icon}
                    <span>{badge.label}</span>
                  </span>
                </div>
              </div>

              {/* Title & Critique */}
              <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="font-semibold text-white mr-1.5">{item.title}:</span>
                {item.feedback}
              </div>

              {/* Concrete Evidence or Missing points */}
              {item.evidence && item.evidence.length > 0 && (
                <div className="text-[11px] text-slate-400 flex items-start space-x-2">
                  <span className="font-semibold text-slate-300 shrink-0">Evaluator Observation:</span>
                  <span className="italic">{item.evidence.join(' ')}</span>
                </div>
              )}

              {/* Actionable Improvement Recommendation */}
              <div className="text-xs text-indigo-300/90 bg-indigo-950/30 border border-indigo-900/40 px-3 py-2 rounded-lg flex items-start space-x-2">
                <span className="text-indigo-400 font-semibold shrink-0">How to reach 5/5:</span>
                <span>{item.improvement}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
