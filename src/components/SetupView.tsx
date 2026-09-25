import React, { useState } from 'react';
import { TargetLevel } from '../types';
import { SAMPLE_JDS, SampleJD } from '../data/sampleJDs';
import { Briefcase, Sparkles, CheckCircle2, ChevronRight, Layers, FileText, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface SetupViewProps {
  onStartSession: (level: TargetLevel, jdText: string, roleTitle: string, companyName: string) => void;
  isGenerating: boolean;
}

export const SetupView: React.FC<SetupViewProps> = ({ onStartSession, isGenerating }) => {
  const [selectedLevel, setSelectedLevel] = useState<TargetLevel>('Senior PM');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('stripe-senior-pm');
  const [roleTitle, setRoleTitle] = useState<string>('Senior Product Manager - Global Payouts & Treasury');
  const [companyName, setCompanyName] = useState<string>('Stripe');
  const [jdText, setJdText] = useState<string>(SAMPLE_JDS[0].description);

  const handleSelectPreset = (preset: SampleJD) => {
    setSelectedPresetId(preset.id);
    setSelectedLevel(preset.level);
    setRoleTitle(preset.title);
    setCompanyName(preset.company);
    setJdText(preset.description);
  };

  const levels: { level: TargetLevel; title: string; exp: string; focus: string; tag: string }[] = [
    {
      level: 'APM',
      title: 'Associate PM',
      exp: '0-2 years exp',
      focus: 'User empathy, feature design, basic telemetry, structured problem-solving',
      tag: 'Foundational'
    },
    {
      level: 'PM',
      title: 'Product Manager',
      exp: '2-5 years exp',
      focus: 'End-to-end execution, A/B experimentation, roadmap defense, cross-functional delivery',
      tag: 'Autonomous'
    },
    {
      level: 'Senior PM',
      title: 'Senior PM',
      exp: '5-8 years exp',
      focus: 'Product strategy, system architecture, ruthless trade-offs, executive alignment',
      tag: 'Strategic Bar'
    },
    {
      level: 'Group PM',
      title: 'Group PM / Lead',
      exp: '8+ years exp',
      focus: 'Portfolio governance, team coaching, capital allocation, multi-year moats',
      tag: 'Executive'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim()) return;
    onStartSession(selectedLevel, jdText, roleTitle || 'Product Manager', companyName || 'Tech Company');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero Title */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <Zap className="w-3.5 h-3.5" />
          <span>Real PM Evaluation • Not a Chatbot</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Master Your PM Interview with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200">Visible, Objective Rubrics</span>
        </h1>
        <p className="mt-4 text-slate-400 text-base sm:text-lg leading-relaxed">
          Paste your target job description. The engine generates 6–8 role-specific questions, detects missing metrics or trade-offs in your answers with surgical follow-ups, and scores you against a transparent 5-dimension hiring rubric.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Target Level Selection */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Select Your Target Level</h2>
              <p className="text-xs text-slate-400">Questions and evaluation depth will calibrate strictly to this seniority bar.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {levels.map(item => {
              const isSelected = selectedLevel === item.level;
              return (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => setSelectedLevel(item.level)}
                  className={`text-left p-4 rounded-xl border transition-all relative ${
                    isSelected
                      ? 'bg-indigo-600/15 border-indigo-500 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500'
                      : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-base text-white">{item.level}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      isSelected ? 'bg-indigo-500/30 text-indigo-300' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {item.tag}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-indigo-300/90 mb-1">{item.title} • {item.exp}</div>
                  <div className="text-[11px] text-slate-400 leading-normal line-clamp-2">{item.focus}</div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 text-indigo-400">
                      <CheckCircle2 className="w-4 h-4 fill-indigo-400 text-slate-900" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Choose Preset or Custom JD */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Paste or Select a Job Description</h2>
              <p className="text-xs text-slate-400">Try one of our curated top-tier tech presets, or paste any real JD you are applying to.</p>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
              Quick 1-Click Presets:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {SAMPLE_JDS.map(preset => {
                const isPreset = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`flex items-start text-left p-3 rounded-xl border text-xs transition-all ${
                      isPreset
                        ? 'bg-slate-800 border-indigo-500/80 ring-1 ring-indigo-500/50'
                        : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/70'
                    }`}
                  >
                    <Briefcase className={`w-4 h-4 mr-2.5 shrink-0 mt-0.5 ${isPreset ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span>{preset.company}</span>
                        <span className="text-[10px] text-indigo-300 font-normal">({preset.level})</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]">{preset.title}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role and Company Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={e => {
                  setCompanyName(e.target.value);
                  setSelectedPresetId('');
                }}
                placeholder="e.g. Stripe, Uber, Airbnb, OpenAI"
                className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Role Title</label>
              <input
                type="text"
                value={roleTitle}
                onChange={e => {
                  setRoleTitle(e.target.value);
                  setSelectedPresetId('');
                }}
                placeholder="e.g. Senior Product Manager - Payments"
                className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* JD Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">Job Description Text</label>
              <span className="text-[11px] text-slate-400">{jdText.length} characters</span>
            </div>
            <textarea
              rows={9}
              value={jdText}
              onChange={e => {
                setJdText(e.target.value);
                setSelectedPresetId('');
              }}
              placeholder="Paste the full job posting here (responsibilities, requirements, team mission)..."
              className="w-full bg-slate-850 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-500 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
        </div>

        {/* Feature Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-left">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2.5">
              <Layers className="w-4 h-4" />
            </div>
            <div className="text-sm font-semibold text-white mb-1">6–8 Role-Specific Questions</div>
            <p className="text-xs text-slate-400 leading-normal">
              A balanced mix of Behavioral, Product Sense, Execution, and Strategy tailored directly to this JD.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-left">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-sm font-semibold text-white mb-1">Targeted 1-Probe Follow-Up</div>
            <p className="text-xs text-slate-400 leading-normal">
              Detects whatever your first draft is missing (metrics, trade-offs, or a concrete decision) before scoring.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-left">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-sm font-semibold text-white mb-1">5-Dimension Rubric & Rewrites</div>
            <p className="text-xs text-slate-400 leading-normal">
              Relevance, Structure, Product Sense, Analytics, and Trade-offs scored individually from 1 to 5, plus Staff PM rewrite.
            </p>
          </div>
        </div>

        {/* Start Button */}
        <div className="pt-2 text-center">
          <button
            type="submit"
            disabled={isGenerating || !jdText.trim()}
            className="inline-flex items-center justify-center space-x-3 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Analyzing JD & Generating Questions...</span>
              </>
            ) : (
              <>
                <span>Begin Mock Interview for {selectedLevel}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
