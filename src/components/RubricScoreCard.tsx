import React from 'react';
import { RubricDimensionScore } from '../types';

interface RubricScoreCardProps {
  scores: RubricDimensionScore[];
}

const scoreConfig = (score: number) => {
  if (score === 5) return { emoji: '⭐', label: '5/5 Exemplary', bar: 'bg-gradient-to-r from-emerald-400 to-teal-400', badge: 'bg-emerald-50 text-emerald-600 border-emerald-200', glow: 'shadow-[0_0_12px_rgba(52,211,153,0.4)]' };
  if (score === 4) return { emoji: '✨', label: '4/5 Strong Bar', bar: 'bg-gradient-to-r from-blue-400 to-indigo-400', badge: 'bg-blue-50 text-blue-600 border-blue-200', glow: '' };
  if (score === 3) return { emoji: '💪', label: '3/5 Solid',     bar: 'bg-gradient-to-r from-pink-300 to-blush-400', badge: 'bg-pink-50 text-pink-600 border-pink-200', glow: '' };
  if (score === 2) return { emoji: '📈', label: '2/5 Developing', bar: 'bg-gradient-to-r from-amber-300 to-orange-400', badge: 'bg-amber-50 text-amber-600 border-amber-200', glow: '' };
  return             { emoji: '🔧', label: '1/5 Needs Focus',   bar: 'bg-gradient-to-r from-rose-400 to-red-400',   badge: 'bg-rose-50 text-rose-600 border-rose-200',   glow: '' };
};

const dimensionEmoji: Record<string, string> = {
  'Relevance':            '🎯',
  'Structure & Clarity':  '🏗️',
  'Product Sense':        '💡',
  'Analytical Rigor':     '📊',
  'Trade-offs & Decisions': '⚖️',
};

const dimensionDesc: Record<string, string> = {
  'Relevance':            'Directly answering the question and follow-up without evasion.',
  'Structure & Clarity':  'Logical flow, frameworks (STAR/CIRCLES), executive scannability.',
  'Product Sense':        'Deep user empathy, persona friction, intuitive product craft.',
  'Analytical Rigor':     'Quantitative KPIs, baselines, guardrail metrics, data reasoning.',
  'Trade-offs & Decisions': 'Explicit sacrifices, deprioritization, high-conviction calls.',
};

export const RubricScoreCard: React.FC<RubricScoreCardProps> = ({ scores }) => {
  return (
    <div className="card p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3
                      border-b border-pink-100 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-black text-pink-900">Evaluation Rubric 📋</h3>
            <span className="badge bg-pink-100 text-pink-500 border border-pink-200 text-[10px]">
              5 Independent Dimensions
            </span>
          </div>
          <p className="text-xs text-pink-400 font-medium">
            Scored 1–5 on each dimension — never averaged into one vague number 💕
          </p>
        </div>

        {/* Mini score cluster */}
        <div className="flex items-center gap-1.5">
          {scores.map(s => {
            const cfg = scoreConfig(s.score);
            return (
              <div key={s.dimension} title={s.dimension}
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black border ${cfg.badge} ${cfg.glow}`}>
                {s.score}
              </div>
            );
          })}
        </div>
      </div>

      {/* Each dimension */}
      <div className="space-y-4">
        {scores.map((item, idx) => {
          const cfg = scoreConfig(item.score);
          const pct = (item.score / 5) * 100;
          return (
            <div key={item.dimension}
              className="bg-pink-50/60 border border-pink-100 rounded-2xl p-4 sm:p-5 space-y-3
                         hover:border-pink-200 hover:shadow-soft transition-all duration-200">

              {/* Top row: dimension + badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{dimensionEmoji[item.dimension] || '📌'}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-pink-300">0{idx + 1}.</span>
                      <span className="font-black text-sm text-pink-900">{item.dimension}</span>
                    </div>
                    <p className="text-[11px] text-pink-400 font-medium italic">
                      {dimensionDesc[item.dimension]}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {/* 5-dot indicator */}
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(dot => (
                      <div key={dot}
                        className={`w-4 h-2 rounded-full transition-all duration-500 ${
                          dot <= item.score ? cfg.bar.replace('bg-gradient-to-r from-','').split(' ')[0].replace('from-', 'bg-') : 'bg-pink-100'
                        }`}
                        style={dot <= item.score ? {
                          background: dot <= item.score ? undefined : undefined,
                          backgroundImage: dot <= item.score ? `linear-gradient(to right, var(--tw-gradient-stops))` : 'none'
                        } : {}}
                      >
                        {dot <= item.score && (
                          <div className={`w-full h-full rounded-full ${cfg.bar}`} />
                        )}
                      </div>
                    ))}
                  </div>

                  <span className={`badge border text-[11px] font-black ${cfg.badge}`}>
                    {cfg.emoji} {cfg.label}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-pink-100 overflow-hidden">
                <div className={`h-full rounded-full ${cfg.bar} transition-all duration-700 ease-out`}
                  style={{ width: `${pct}%` }} />
              </div>

              {/* Feedback */}
              <div className="text-xs text-pink-700 font-medium leading-relaxed bg-white/70
                              p-3 rounded-xl border border-pink-100">
                <span className="font-black text-pink-800 mr-1.5">💬 {item.title}:</span>
                {item.feedback}
              </div>

              {/* Evidence */}
              {item.evidence && item.evidence.length > 0 && (
                <div className="text-[11px] text-pink-500 flex items-start gap-2 font-medium">
                  <span className="font-black text-pink-600 shrink-0">🔍 Observed:</span>
                  <span className="italic">{item.evidence.join(' ')}</span>
                </div>
              )}

              {/* How to reach 5/5 */}
              <div className="text-xs text-pink-600 bg-pink-50 border border-pink-200
                              px-3 py-2 rounded-xl flex items-start gap-2 font-medium">
                <span className="shrink-0 font-black text-pink-500">🚀 To reach 5/5:</span>
                <span>{item.improvement}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
