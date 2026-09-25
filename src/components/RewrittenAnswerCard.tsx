import React, { useState } from 'react';
import { Sparkles, Copy, Check, Volume2, VolumeX, ArrowRightLeft } from 'lucide-react';
import { speechManager } from '../services/speechService';

interface RewrittenAnswerCardProps {
  rewritten: { text: string; keyImprovements: string[]; frameworkUsed: string };
  candidateCombinedAnswer: string;
}

export const RewrittenAnswerCard: React.FC<RewrittenAnswerCardProps> = ({
  rewritten, candidateCombinedAnswer
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
      speechManager.speak(rewritten.text, () => setIsSpeaking(false));
    }
  };

  return (
    <div className="card p-6 sm:p-8 space-y-6 border-2 border-pink-200 shadow-pink-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3
                      border-b border-pink-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-pink-400 to-blush-500
                          flex items-center justify-center shadow-pink-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-pink-900">Staff PM Rewrite ✨</h3>
              <span className="badge bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-black">
                5/5 Benchmark
              </span>
            </div>
            <p className="text-xs text-pink-400 font-medium">
              How a Staff / Lead PM elevates your idea into an airtight executive response 💪
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button onClick={() => setViewMode(v => v === 'rewrite' ? 'compare' : 'rewrite')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              viewMode === 'compare'
                ? 'bg-pink-100 text-pink-600 border-pink-300'
                : 'bg-white text-pink-500 border-pink-200 hover:bg-pink-50'
            }`}>
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>{viewMode === 'compare' ? 'Side-by-Side' : 'Compare'}</span>
          </button>

          <button onClick={handleToggleSpeak}
            className={`p-2 rounded-xl border text-xs transition-all ${
              isSpeaking
                ? 'bg-pink-100 text-pink-500 border-pink-300 animate-pulse-pink'
                : 'bg-white text-pink-400 border-pink-200 hover:bg-pink-50'
            }`} title="Listen aloud">
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-pink-500
                       border border-pink-200 hover:bg-pink-50 text-xs font-bold transition-all">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied! 💕' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Framework + Why 5/5 */}
      <div className="bg-pink-50/70 border border-pink-100 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black text-pink-700">🏗️ Framework Applied:</span>
          <span className="text-xs font-mono text-blush-600 bg-pink-100 px-2.5 py-0.5 rounded-lg
                           border border-pink-200 font-bold">
            {rewritten.frameworkUsed}
          </span>
        </div>

        <div>
          <div className="text-[11px] font-black uppercase tracking-widest text-pink-400 mb-2">
            Why this version scores 5/5 on every dimension:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {rewritten.keyImprovements.map((imp, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-pink-700 font-medium">
                <span className="text-emerald-500 font-black shrink-0 mt-0.5">✓</span>
                <span>{imp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content: single or compare */}
      {viewMode === 'compare' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Candidate's version */}
          <div className="bg-pink-50/40 border border-pink-100 rounded-2xl p-4 flex flex-col">
            <div className="text-[10px] font-black uppercase tracking-widest text-pink-400 mb-2 pb-2
                            border-b border-pink-100 flex justify-between">
              <span>Your Submission</span>
              <span className="text-pink-300 font-medium normal-case">Original + Follow-up</span>
            </div>
            <div className="text-xs text-pink-700 whitespace-pre-wrap font-sans leading-relaxed
                            flex-1 overflow-y-auto max-h-[380px] pr-1 font-medium">
              {candidateCombinedAnswer}
            </div>
          </div>

          {/* Staff PM version */}
          <div className="bg-gradient-to-b from-white to-pink-50/60 border-2 border-pink-300
                          rounded-2xl p-4 flex flex-col shadow-pink-md">
            <div className="text-[10px] font-black uppercase tracking-widest text-pink-500 mb-2 pb-2
                            border-b border-pink-100 flex justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-pink-400" /> Staff PM Version
              </span>
              <span className="text-emerald-500 font-bold normal-case">Air-tight & Quantified</span>
            </div>
            <div className="text-xs text-pink-800 whitespace-pre-wrap font-sans leading-relaxed
                            flex-1 overflow-y-auto max-h-[380px] pr-1 font-medium">
              {rewritten.text}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-b from-white to-pink-50/50 border-2 border-pink-200
                        rounded-2xl p-5 shadow-pink-sm">
          <div className="text-xs text-pink-800 whitespace-pre-wrap font-sans leading-relaxed font-medium">
            {rewritten.text}
          </div>
        </div>
      )}
    </div>
  );
};
