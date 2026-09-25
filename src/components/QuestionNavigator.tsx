import React from 'react';
import { Question, EvaluatedAnswer } from '../types';
import { CheckCircle2, Circle } from 'lucide-react';

interface QuestionNavigatorProps {
  questions: Question[];
  currentIndex: number;
  evaluatedAnswers: EvaluatedAnswer[];
  onSelectIndex?: (index: number) => void;
}

const catStyle: Record<string, { emoji: string; badge: string }> = {
  behavioral:    { emoji: '🎭', badge: 'bg-blue-100 text-blue-600 border-blue-200' },
  product_sense: { emoji: '💡', badge: 'bg-purple-100 text-purple-600 border-purple-200' },
  execution:     { emoji: '⚙️', badge: 'bg-emerald-100 text-emerald-600 border-emerald-200' },
  strategy:      { emoji: '🧭', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
};

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  questions, currentIndex, evaluatedAnswers, onSelectIndex
}) => {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-black uppercase tracking-widest text-pink-500">
          🗺️ Interview Roadmap
        </h4>
        <span className="text-xs font-black text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200">
          {evaluatedAnswers.length}/{questions.length} ✅
        </span>
      </div>

      {/* Progress track */}
      <div className="w-full h-2 bg-pink-100 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-pink-400 to-blush-500 rounded-full transition-all duration-500"
          style={{ width: `${(evaluatedAnswers.length / Math.max(questions.length, 1)) * 100}%` }} />
      </div>

      <div className="space-y-2">
        {questions.map((q, idx) => {
          const isEvaluated = evaluatedAnswers.some(a => a.questionId === q.id);
          const isCurrent = idx === currentIndex;
          const cat = catStyle[q.category] || catStyle.behavioral;

          return (
            <div key={q.id}
              onClick={() => onSelectIndex && (isEvaluated || isCurrent) && onSelectIndex(idx)}
              className={`p-3 rounded-2xl border-2 text-xs transition-all duration-200 flex items-start gap-3 ${
                isCurrent
                  ? 'bg-pink-50 border-pink-400 shadow-pink-sm cursor-default'
                  : isEvaluated
                  ? 'bg-white border-pink-100 hover:border-pink-200 hover:shadow-soft cursor-pointer'
                  : 'bg-pink-50/30 border-pink-100/60 opacity-50 cursor-default'
              }`}>
              <div className="mt-0.5 shrink-0">
                {isEvaluated
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  : isCurrent
                  ? <div className="w-4 h-4 rounded-full border-2 border-pink-400 border-t-transparent animate-spin" />
                  : <Circle className="w-4 h-4 text-pink-200" />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1 flex-wrap">
                  <span className={`badge text-[10px] font-black border px-2 py-0.5 rounded-full ${cat.badge}`}>
                    {cat.emoji} {q.category.replace('_', ' ')}
                  </span>
                </div>
                <div className={`font-black truncate ${isCurrent ? 'text-pink-800' : 'text-pink-700'}`}>
                  {idx + 1}. {q.title}
                </div>
                <div className="text-[11px] text-pink-400 truncate font-medium">{q.competency}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
