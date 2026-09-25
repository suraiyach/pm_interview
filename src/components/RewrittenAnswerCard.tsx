import React, { useState } from 'react';
import { Sparkles, Copy, Check, Volume2, VolumeX, Eye, ArrowRightLeft, Award } from 'lucide-react';
import { speechManager } from '../services/speechService';

interface RewrittenAnswerCardProps {
  rewritten: {
    text: string;
    keyImprovements: string[];
    frameworkUsed: string;
  };
  candidateCombinedAnswer: string;
}

export const RewrittenAnswerCard: React.FC<RewrittenAnswerCardProps> = ({
  rewritten,
  candidateCombinedAnswer
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [viewMode, setViewMode] = useState<'rewrite' | 'compare'>('rewrite');

  const handleCopy = () => {
    navigator.clipboard.writeText(rewritten.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      speechManager.stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speechManager.speak(rewritten.text, () => {
        setIsSpeaking(false);
      });
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/20 border border-indigo-500/30 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Exemplary Staff PM Rewrite
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              5/5 Benchmark
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            How a Staff / Lead PM elevates your core ideas into an airtight, defensible executive response.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {/* Comparison View Toggle */}
          <button
            onClick={() => setViewMode(viewMode === 'rewrite' ? 'compare' : 'rewrite')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              viewMode === 'compare'
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>{viewMode === 'compare' ? 'Viewing Side-by-Side' : 'Compare with Mine'}</span>
          </button>

          {/* Listen aloud */}
          <button
            onClick={handleToggleSpeak}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              isSpeaking
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
            }`}
            title={isSpeaking ? 'Stop audio' : 'Listen to how this sounds aloud'}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:text-white text-xs font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Framework Badge & Key Enhancements */}
      <div className="bg-slate-850/80 border border-slate-750 rounded-xl p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <Award className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-200">Framework Applied:</span>
          <span className="text-xs font-mono text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
            {rewritten.frameworkUsed}
          </span>
        </div>

        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Why This Version Scores 5/5 on Every Rubric:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {rewritten.keyImprovements.map((imp, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                <span>{imp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Display (Single or Side-by-Side Compare) */}
      {viewMode === 'compare' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Candidate Version */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between border-b border-slate-800 pb-2">
              <span>Your Combined Submission</span>
              <span className="text-[10px] text-slate-500 font-normal">Original + Follow-up</span>
            </div>
            <div className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed flex-1 overflow-y-auto max-h-[420px] pr-2">
              {candidateCombinedAnswer}
            </div>
          </div>

          {/* Rewritten Staff PM Version */}
          <div className="bg-slate-950 border border-indigo-500/40 rounded-xl p-4 flex flex-col relative ring-1 ring-indigo-500/20">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2 flex items-center justify-between border-b border-indigo-950/60 pb-2">
              <span className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Staff PM Elevated Version</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-normal">Air-Tight & Quantified</span>
            </div>
            <div className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed flex-1 overflow-y-auto max-h-[420px] pr-2 prose prose-invert prose-xs">
              {rewritten.text}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-950 border border-indigo-500/30 rounded-xl p-5 relative ring-1 ring-indigo-500/10">
          <div className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed space-y-3">
            {rewritten.text}
          </div>
        </div>
      )}
    </div>
  );
};
