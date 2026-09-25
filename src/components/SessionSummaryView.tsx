import React, { useState } from 'react';
import { SessionMetaSummary, EvaluatedAnswer, Question } from '../types';
import { Download, Copy, Check, RotateCcw, Sparkles, BarChart3, Calendar, ArrowUpRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SessionSummaryViewProps {
  summary: SessionMetaSummary;
  questions: Question[];
  evaluatedAnswers: EvaluatedAnswer[];
  onRestart: () => void;
  onReviewQuestion: (idx: number) => void;
}

export const SessionSummaryView: React.FC<SessionSummaryViewProps> = ({
  summary, questions, evaluatedAnswers, onRestart, onReviewQuestion
}) => {
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    try { confetti({ particleCount: 120, spread: 90, colors: ['#f472b6','#fb7185','#c084fc','#fbbf24'], origin: { y: 0.5 } }); } catch {}
  }, []);

  const readinessBadge = {
    'Strong Hire / Above Bar': { bg: 'from-emerald-400 to-teal-500', badge: 'bg-emerald-50 text-emerald-600 border-emerald-200', emoji: '🌟' },
    'Solid Candidate':         { bg: 'from-blue-400 to-indigo-500',  badge: 'bg-blue-50 text-blue-600 border-blue-200',          emoji: '💪' },
    'Developing Potential':    { bg: 'from-pink-400 to-blush-500',   badge: 'bg-pink-50 text-pink-600 border-pink-200',           emoji: '📈' },
    'Needs Preparation':       { bg: 'from-rose-400 to-red-500',     badge: 'bg-rose-50 text-rose-600 border-rose-200',           emoji: '🔧' },
  }[summary.levelReadinessLabel] ?? { bg: 'from-pink-400 to-blush-500', badge: 'bg-pink-50 text-pink-600 border-pink-200', emoji: '✨' };

  const handleExport = () => {
    let md = `# Interview Coach — PM Session Report 🎯\n\n`;
    md += `**Role:** ${summary.roleTitle} (${summary.targetLevel}) @ ${summary.companyName}\n`;
    md += `**Readiness:** ${summary.levelReadinessScore}% — ${summary.levelReadinessLabel}\n\n`;
    md += `## Executive Summary\n${summary.executiveSummary}\n\n`;
    md += `## Dimension Averages (1–5)\n`;
    Object.entries(summary.dimensionAverages).forEach(([d, v]) => { md += `- **${d}:** ${v}/5.0\n`; });
    md += `\n## Systematic Patterns\n`;
    summary.systematicPatterns.forEach(p => {
      md += `### [${p.type.toUpperCase()}] ${p.title}\n${p.summary}\n*Drill:* ${p.recommendation}\n\n`;
    });
    md += `## 3-Week Action Plan\n`;
    summary.actionPlan.forEach(w => {
      md += `### ${w.week}\n`;
      w.exercises.forEach(e => { md += `- ${e}\n`; });
      md += '\n';
    });
    evaluatedAnswers.forEach((ans, idx) => {
      const q = questions.find(item => item.id === ans.questionId);
      md += `## Q${idx+1}: ${q?.title || 'Question'}\n${ans.initialAnswer}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `PM-Interview-${summary.companyName}-${summary.targetLevel}.md`;
    a.click();
  };

  const handleCopy = () => {
    const text = `Interview Coach Report\nTarget: ${summary.roleTitle} (${summary.targetLevel}) @ ${summary.companyName}\nReadiness: ${summary.levelReadinessScore}% (${summary.levelReadinessLabel})\n\nDimension Scores:\n${Object.entries(summary.dimensionAverages).map(([d,v])=>`• ${d}: ${v}/5`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const dimBar = (avg: number) => {
    if (avg >= 4) return 'bg-gradient-to-r from-emerald-400 to-teal-400';
    if (avg >= 3) return 'bg-gradient-to-r from-pink-400 to-blush-500';
    if (avg >= 2) return 'bg-gradient-to-r from-amber-400 to-orange-400';
    return 'bg-gradient-to-r from-rose-400 to-red-400';
  };

  return (
    <div className="relative min-h-screen">
      {/* Blobs */}
      <div className="blob w-[500px] h-[500px] bg-pink-300 -top-40 -left-20 opacity-30" />
      <div className="blob w-[400px] h-[400px] bg-purple-300 bottom-0 -right-20 opacity-25" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-10 sm:py-14 space-y-10">

        {/* Hero Banner */}
        <div className="card p-8 sm:p-12 bg-gradient-to-br from-pink-50 via-white to-purple-50
                        border-2 border-pink-200 shadow-pink-lg animate-fade-in overflow-hidden relative">
          {/* Decorative sparkles */}
          <div className="absolute top-6 right-6 text-5xl opacity-30 animate-float">✨</div>
          <div className="absolute bottom-6 left-6 text-3xl opacity-20 animate-float" style={{animationDelay:'1s'}}>🎉</div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                              bg-pink-100 border border-pink-200 text-pink-600 text-xs font-black uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 animate-bounce-soft" />
                <span>Full Loop Completed! 🏆</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-pink-900 tracking-tight leading-tight">
                Your PM Interview <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Performance Report</span> 📋
              </h1>
              <p className="text-pink-600 font-medium">
                <span className="font-black text-pink-800">{summary.roleTitle}</span> ({summary.targetLevel}) at <span className="font-black text-pink-800">{summary.companyName}</span>
              </p>
            </div>

            {/* Score Circle */}
            <div className="bg-white border-2 border-pink-200 p-7 rounded-3xl flex flex-col items-center
                            justify-center text-center shadow-pink-md shrink-0">
              <div className="text-xs font-black uppercase tracking-widest text-pink-400 mb-1">
                Level Readiness
              </div>
              <div className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-pink-500 to-purple-600">
                {summary.levelReadinessScore}%
              </div>
              <div className={`mt-2 px-3 py-1 rounded-full text-xs font-black border ${readinessBadge.badge}`}>
                {readinessBadge.emoji} {summary.levelReadinessLabel}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="relative z-10 mt-8 pt-6 border-t border-pink-100 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-pink-400 font-medium">
              🎯 {summary.completedQuestions} questions evaluated across 5 PM dimensions
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={handleCopy}
                className="btn-secondary flex items-center gap-1.5 px-3.5 py-2 text-xs">
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied 💕' : 'Copy Summary'}</span>
              </button>
              <button onClick={handleExport}
                className="btn-primary flex items-center gap-1.5 px-4 py-2 text-xs">
                <Download className="w-4 h-4" />
                <span>Download Report</span>
              </button>
              <button onClick={onRestart}
                className="btn-secondary flex items-center gap-1.5 px-3.5 py-2 text-xs">
                <RotateCcw className="w-4 h-4" />
                <span>New Session</span>
              </button>
            </div>
          </div>
        </div>

        {/* Grid: Score Bars + Executive Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Dimension Bars */}
          <div className="lg:col-span-1 card p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-pink-100 pb-3">
              <BarChart3 className="w-4 h-4 text-pink-400" />
              <h3 className="text-sm font-black text-pink-900">Dimension Averages 📊</h3>
            </div>

            <div className="space-y-4">
              {Object.entries(summary.dimensionAverages).map(([dim, avg]) => {
                const emojis: Record<string,string> = {
                  'Relevance': '🎯', 'Structure & Clarity': '🏗️',
                  'Product Sense': '💡', 'Analytical Rigor': '📊', 'Trade-offs & Decisions': '⚖️'
                };
                return (
                  <div key={dim} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-pink-800">
                        {emojis[dim] || '📌'} {dim}
                      </span>
                      <span className="font-mono font-black text-pink-600">{avg}/5.0</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-pink-100 overflow-hidden">
                      <div className={`h-full rounded-full ${dimBar(avg)} transition-all duration-700`}
                        style={{ width: `${(avg/5)*100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3.5 rounded-2xl bg-pink-50 border border-pink-100 text-xs text-pink-600 font-medium leading-relaxed">
              💡 For {summary.targetLevel}, interviewers expect consistent 4/5 or 5/5 on at least 4 of 5 dimensions.
            </div>
          </div>

          {/* Executive Summary */}
          <div className="lg:col-span-2 card p-6 sm:p-8 space-y-5">
            <h3 className="text-base font-black text-pink-900 border-b border-pink-100 pb-3">
              🧠 Executive Synthesis
            </h3>
            <p className="text-sm text-pink-700 font-medium leading-relaxed bg-pink-50/60
                          border border-pink-100 rounded-2xl p-4">
              {summary.executiveSummary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-2.5">
                <div className="flex items-center gap-2 font-black text-xs text-emerald-600 uppercase tracking-wider">
                  💪 Core Strengths
                </div>
                <ul className="space-y-2 text-xs text-emerald-700 font-medium">
                  {summary.topStrengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-black shrink-0">✓</span><span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 space-y-2.5">
                <div className="flex items-center gap-2 font-black text-xs text-amber-600 uppercase tracking-wider">
                  🎯 Priority Growth Levers
                </div>
                <ul className="space-y-2 text-xs text-amber-700 font-medium">
                  {summary.priorityFixes.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-500 font-black shrink-0">!</span><span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Patterns */}
        <div className="card p-6 sm:p-8 space-y-6">
          <div className="border-b border-pink-100 pb-4">
            <h3 className="text-lg font-black text-pink-900">🔍 Systematic Cross-Answer Patterns</h3>
            <p className="text-xs text-pink-400 font-medium mt-0.5">
              Meta-analysis of recurring habits & blindspots across your full session
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.systematicPatterns.map((p, idx) => (
              <div key={idx}
                className={`p-5 rounded-2xl border-2 space-y-3 transition-all hover:shadow-soft ${
                  p.type === 'weakness'
                    ? 'bg-rose-50/60 border-rose-100 hover:border-rose-200'
                    : 'bg-emerald-50/60 border-emerald-100 hover:border-emerald-200'
                }`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className={`badge text-[10px] font-black border ${
                    p.type === 'weakness' ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-emerald-100 text-emerald-600 border-emerald-200'
                  }`}>
                    {p.type === 'weakness' ? '⚠️ Anti-Pattern' : '⭐ Superpower'}
                  </span>
                  <span className="text-[11px] text-pink-400 font-mono font-medium">
                    {p.occurrences}/{p.totalQuestions} questions
                  </span>
                </div>
                <h4 className="font-black text-sm text-pink-900">{p.title}</h4>
                <p className="text-xs text-pink-600 font-medium leading-relaxed">{p.summary}</p>
                <div className="pt-2 border-t border-pink-100 text-xs text-indigo-600 font-medium flex items-start gap-2">
                  <span className="font-black text-indigo-500 shrink-0">💡 Drill:</span>
                  <span>{p.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3-Week Action Plan */}
        <div className="card p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 border-b border-pink-100 pb-4">
            <Calendar className="w-5 h-5 text-pink-400" />
            <div>
              <h3 className="text-lg font-black text-pink-900">📅 3-Week Action Plan</h3>
              <p className="text-xs text-pink-400 font-medium">
                Curated exercises to eliminate your specific blindspots before real interviews
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summary.actionPlan.map((plan, idx) => (
              <div key={idx}
                className="bg-gradient-to-b from-pink-50/80 to-white border border-pink-100
                            rounded-2xl p-5 space-y-3 hover:shadow-soft hover:border-pink-200 transition-all">
                <div className="text-[10px] font-black uppercase tracking-widest text-pink-400">
                  {plan.week}
                </div>
                <div className="text-sm font-black text-pink-900">{plan.focus}</div>
                <ul className="space-y-2 text-xs text-pink-600 font-medium pt-2 border-t border-pink-100">
                  {plan.exercises.map((ex, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-pink-400 font-black shrink-0 mt-0.5">•</span>
                      <span className="leading-relaxed">{ex}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Per-Question Table */}
        <div className="card p-6 space-y-4">
          <h3 className="text-sm font-black text-pink-900 uppercase tracking-wider">
            📝 Question-by-Question Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-pink-700">
              <thead className="bg-pink-50 font-black text-pink-500 uppercase tracking-wider border-b border-pink-100">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Question</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Probe Type</th>
                  <th className="py-3 px-4">Scores R/S/P/A/T</th>
                  <th className="py-3 px-4 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {evaluatedAnswers.map((ans, idx) => {
                  const q = questions.find(item => item.id === ans.questionId);
                  const sm = (dim: string) => ans.rubricScores.find(r => r.dimension === dim)?.score ?? '-';
                  return (
                    <tr key={ans.questionId} className="hover:bg-pink-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-black text-pink-600">#{idx+1}</td>
                      <td className="py-3.5 px-4 font-bold text-pink-800 max-w-[200px] truncate">{q?.title}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-600
                                         border border-pink-200 text-[10px] font-black uppercase">
                          {q?.category?.replace('_',' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-amber-600 font-bold">{ans.followUp.missingElement}</td>
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span className="text-emerald-500">{sm('Relevance')}</span>/
                        <span className="text-blue-500">{sm('Structure & Clarity')}</span>/
                        <span className="text-purple-500">{sm('Product Sense')}</span>/
                        <span className="text-indigo-500">{sm('Analytical Rigor')}</span>/
                        <span className="text-teal-500">{sm('Trade-offs & Decisions')}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button onClick={() => onReviewQuestion(idx)}
                          className="inline-flex items-center gap-1 text-pink-500 hover:text-pink-700 font-black transition-colors">
                          Inspect <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
