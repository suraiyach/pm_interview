import React, { useState } from 'react';
import { SessionMetaSummary, EvaluatedAnswer, Question } from '../types';
import {
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Download,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SessionSummaryViewProps {
  summary: SessionMetaSummary;
  questions: Question[];
  evaluatedAnswers: EvaluatedAnswer[];
  onRestart: () => void;
  onReviewQuestion: (idx: number) => void;
}

export const SessionSummaryView: React.FC<SessionSummaryViewProps> = ({
  summary,
  questions,
  evaluatedAnswers,
  onRestart,
  onReviewQuestion
}) => {
  const [copied, setCopied] = useState(false);

  // Trigger celebratory confetti on mount
  React.useEffect(() => {
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
      });
    } catch (e) {
      // ignore
    }
  }, []);

  const getReadinessBadge = (label: string) => {
    switch (label) {
      case 'Strong Hire / Above Bar':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Solid Candidate':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Developing Potential':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }
  };

  const handleExportMarkdown = () => {
    let md = `# Interview Coach — PM Mock Interview Session Summary\n\n`;
    md += `**Role:** ${summary.roleTitle} (${summary.targetLevel}) at ${summary.companyName}\n`;
    md += `**Readiness Calibration:** ${summary.levelReadinessScore}% — ${summary.levelReadinessLabel}\n`;
    md += `**Questions Evaluated:** ${summary.completedQuestions} of ${summary.totalQuestions}\n\n`;

    md += `## 1. Executive Summary\n${summary.executiveSummary}\n\n`;

    md += `## 2. Evaluation Rubric Averages (Scored 1-5 Independently)\n`;
    Object.entries(summary.dimensionAverages).forEach(([dim, val]) => {
      md += `- **${dim}:** ${val} / 5.0\n`;
    });
    md += `\n`;

    md += `## 3. Systematic Cross-Answer Patterns\n`;
    summary.systematicPatterns.forEach(p => {
      md += `### [${p.type.toUpperCase()}] ${p.title}\n`;
      md += `${p.summary}\n`;
      md += `*Recommendation:* ${p.recommendation}\n\n`;
    });

    md += `## 4. Personalized 3-Week Action Plan\n`;
    summary.actionPlan.forEach(week => {
      md += `### ${week.week} (${week.focus})\n`;
      week.exercises.forEach(ex => {
        md += `- ${ex}\n`;
      });
      md += `\n`;
    });

    md += `## 5. Detailed Question Transcripts & Evaluations\n`;
    evaluatedAnswers.forEach((ans, idx) => {
      const q = questions.find(item => item.id === ans.questionId);
      md += `### Question ${idx + 1}: ${q?.title || 'Question'}\n`;
      md += `*Context:* ${q?.context || ''}\n\n`;
      md += `**Candidate Initial Answer:**\n${ans.initialAnswer}\n\n`;
      md += `**Interviewer Follow-up Probe (${ans.followUp.missingElementLabel}):**\n${ans.followUp.prompt}\n\n`;
      md += `**Candidate Follow-up Response:**\n${ans.followUpAnswer}\n\n`;
      md += `**Rubric Scores:**\n`;
      ans.rubricScores.forEach(r => {
        md += `- ${r.dimension}: ${r.score}/5 (${r.title}) — ${r.feedback}\n`;
      });
      md += `\n**Staff PM Rewritten Answer:**\n${ans.rewrittenAnswer.text}\n\n`;
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PM-Interview-Report-${summary.companyName}-${summary.targetLevel}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    let summaryText = `Interview Coach Evaluation Report:\nTarget: ${summary.roleTitle} (${summary.targetLevel}) at ${summary.companyName}\nReadiness: ${summary.levelReadinessScore}% (${summary.levelReadinessLabel})\n\nDimension Averages (1-5):\n`;
    Object.entries(summary.dimensionAverages).forEach(([dim, val]) => {
      summaryText += `• ${dim}: ${val}/5.0\n`;
    });
    summaryText += `\nKey Patterns:\n`;
    summary.systematicPatterns.forEach(p => {
      summaryText += `• ${p.title}: ${p.summary}\n`;
    });
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full Loop Debrief Completed</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Session Performance & Pattern Summary
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Targeting <span className="font-semibold text-white">{summary.roleTitle}</span> ({summary.targetLevel}) at <span className="font-semibold text-white">{summary.companyName}</span>.
            </p>
          </div>

          {/* Readiness Score Card */}
          <div className="bg-slate-900/90 border border-slate-750 p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg shrink-0">
            <div className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1">
              Level Hiring Calibration
            </div>
            <div className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-300">
              {summary.levelReadinessScore}%
            </div>
            <div className={`mt-2.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getReadinessBadge(summary.levelReadinessLabel)}`}>
              {summary.levelReadinessLabel}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Evaluated across {summary.completedQuestions} comprehensive PM interview questions
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCopySummary}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:text-white text-xs font-semibold transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Summary Copied' : 'Copy Summary'}</span>
            </button>
            <button
              onClick={handleExportMarkdown}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Full Report (.md)</span>
            </button>
            <button
              onClick={onRestart}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:text-white text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>New Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: 5-Dimension Radar Averages & Executive Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: 5 Dimension Score Bars */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              5-Dimension Averages
            </h3>
          </div>

          <div className="space-y-4">
            {Object.entries(summary.dimensionAverages).map(([dimension, avg]) => {
              const pct = (avg / 5) * 100;
              let barColor = 'bg-rose-500';
              if (avg >= 4) barColor = 'bg-emerald-500';
              else if (avg >= 3) barColor = 'bg-indigo-500';
              else if (avg >= 2) barColor = 'bg-amber-500';

              return (
                <div key={dimension} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{dimension}</span>
                    <span className="font-mono text-white font-bold">{avg} / 5.0</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800 text-xs text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-200">Hiring Standard:</span> For {summary.targetLevel}, interviewers expect consistent 4/5 or 5/5 scores across at least 4 of the 5 dimensions.
          </div>
        </div>

        {/* Right: Executive Narrative Breakdown */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight mb-2">
              Executive Evaluation Synthesis
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-850/60 p-4 rounded-xl border border-slate-800">
              {summary.executiveSummary}
            </p>
          </div>

          {/* Core Strengths vs Priority Fixes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Top Strengths */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/30 space-y-2.5">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Observed Core Strengths</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {summary.topStrengths.map((str, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Priority Fixes */}
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/30 space-y-2.5">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>Primary Growth Levers</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {summary.priorityFixes.map((fix, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-amber-400 font-bold shrink-0">!</span>
                    <span>{fix}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Systematic Patterns Across Answers (Step 7 Highlight) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white tracking-tight">
                Systematic Patterns Detected Across Answers
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Meta-analysis identifying recurring habits, blindspots, and competencies throughout your session.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.systematicPatterns.map((pattern, idx) => {
            const isWeakness = pattern.type === 'weakness';
            return (
              <div
                key={idx}
                className={`p-5 rounded-xl border space-y-3 transition-all ${
                  isWeakness
                    ? 'bg-rose-950/15 border-rose-900/40 hover:border-rose-800'
                    : 'bg-emerald-950/15 border-emerald-900/40 hover:border-emerald-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isWeakness
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    }`}
                  >
                    {isWeakness ? 'Anti-Pattern Detected' : 'Consistent Superpower'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {pattern.occurrences} of {pattern.totalQuestions} questions
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-white mb-1">{pattern.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{pattern.summary}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-xs text-indigo-300/90 flex items-start space-x-2">
                  <span className="font-semibold text-indigo-400 shrink-0">Tactical Drill:</span>
                  <span>{pattern.recommendation}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3-Week Personalized PM Drill Action Plan */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-4">
          <Calendar className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              3-Week Personalized Action Plan
            </h3>
            <p className="text-xs text-slate-400">
              Curated daily drills engineered to eliminate your specific blindspots before your real interviews.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summary.actionPlan.map((plan, idx) => (
            <div key={idx} className="bg-slate-850/70 border border-slate-750/80 rounded-xl p-5 space-y-3">
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                {plan.week}
              </div>
              <div className="text-sm font-semibold text-white">
                {plan.focus}
              </div>
              <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                {plan.exercises.map((ex, exIdx) => (
                  <li key={exIdx} className="flex items-start space-x-2">
                    <span className="text-indigo-400 font-bold shrink-0 mt-0.5">•</span>
                    <span className="leading-relaxed">{ex}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Per-Question Detailed History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">
          Question Breakdown & Review
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 uppercase font-semibold text-slate-400 border-b border-slate-750">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Question</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Follow-Up Missing Element</th>
                <th className="py-3 px-4">Scores (Rel / Struct / Prod / Analyt / Trade)</th>
                <th className="py-3 px-4 text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {evaluatedAnswers.map((ans, idx) => {
                const q = questions.find(item => item.id === ans.questionId);
                const scoresMap: Record<string, number> = {};
                ans.rubricScores.forEach(r => { scoresMap[r.dimension] = r.score; });

                return (
                  <tr key={ans.questionId} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-medium text-white max-w-[220px] truncate">
                      {q?.title}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] uppercase font-semibold">
                        {q?.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-amber-300 font-mono text-[11px]">
                      {ans.followUp.missingElement}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="text-emerald-400">{scoresMap['Relevance'] || '-'}</span> /{' '}
                      <span className="text-indigo-400">{scoresMap['Structure & Clarity'] || '-'}</span> /{' '}
                      <span className="text-purple-400">{scoresMap['Product Sense'] || '-'}</span> /{' '}
                      <span className="text-blue-400">{scoresMap['Analytical Rigor'] || '-'}</span> /{' '}
                      <span className="text-teal-400">{scoresMap['Trade-offs & Decisions'] || '-'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onReviewQuestion(idx)}
                        className="inline-flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        <span>Inspect</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
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
  );
};
