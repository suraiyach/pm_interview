import React from 'react';
import { Question, EvaluatedAnswer } from '../types';
import { CheckCircle2, Circle, Clock, MessageSquareQuote, ShieldAlert } from 'lucide-react';

interface QuestionNavigatorProps {
  questions: Question[];
  currentIndex: number;
  evaluatedAnswers: EvaluatedAnswer[];
  onSelectIndex?: (index: number) => void;
}

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  questions,
  currentIndex,
  evaluatedAnswers,
  onSelectIndex
}) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'behavioral':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'product_sense':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'execution':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'strategy':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Interview Loop Roadmap
        </h4>
        <span className="text-xs font-mono text-indigo-400 font-semibold">
          {evaluatedAnswers.length} / {questions.length} Complete
        </span>
      </div>

      <div className="space-y-2">
        {questions.map((q, idx) => {
          const isEvaluated = evaluatedAnswers.some(ans => ans.questionId === q.id);
          const isCurrent = idx === currentIndex;
          const evaluation = evaluatedAnswers.find(ans => ans.questionId === q.id);

          return (
            <div
              key={q.id}
              onClick={() => onSelectIndex && (isEvaluated || isCurrent) && onSelectIndex(idx)}
              className={`p-3 rounded-xl border text-xs transition-all flex items-start space-x-3 ${
                isCurrent
                  ? 'bg-indigo-600/15 border-indigo-500/80 ring-1 ring-indigo-500/40 text-white'
                  : isEvaluated
                  ? 'bg-slate-850/60 border-slate-750 text-slate-300 hover:bg-slate-800 cursor-pointer'
                  : 'bg-slate-900/40 border-slate-800/80 text-slate-400 opacity-60'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isEvaluated ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isCurrent ? (
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-600" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${getCategoryColor(q.category)}`}>
                    {q.category.replace('_', ' ')}
                  </span>
                  {evaluation && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      Done
                    </span>
                  )}
                </div>
                <div className="font-medium text-white truncate text-xs">
                  {idx + 1}. {q.title}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {q.competency}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
