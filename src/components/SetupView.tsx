import React, { useState } from 'react';
import { TargetLevel } from '../types';
import { SAMPLE_JDS, SampleJD } from '../data/sampleJDs';
import { Briefcase, CheckCircle2, ArrowRight, Layers, ShieldCheck, Zap, Star, Sparkles } from 'lucide-react';

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

  const levels: { level: TargetLevel; emoji: string; title: string; exp: string; focus: string; color: string }[] = [
    { level: 'APM',      emoji: '🌱', title: 'Associate PM',  exp: '0–2 yrs', focus: 'User empathy, feature design, basic analytics', color: 'from-green-400 to-emerald-500' },
    { level: 'PM',       emoji: '🚀', title: 'Product Manager', exp: '2–5 yrs', focus: 'Execution, A/B tests, roadmap defense, metrics', color: 'from-blue-400 to-indigo-500' },
    { level: 'Senior PM', emoji: '⚡', title: 'Senior PM',    exp: '5–8 yrs', focus: 'Strategy, system design, trade-offs, execs', color: 'from-pink-400 to-blush-500' },
    { level: 'Group PM', emoji: '👑', title: 'Group PM / Lead', exp: '8+ yrs', focus: 'Portfolio, team coaching, capital allocation', color: 'from-purple-400 to-lilac-500' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim()) return;
    onStartSession(selectedLevel, jdText, roleTitle || 'Product Manager', companyName || 'Tech Company');
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Decorative blobs */}
      <div className="blob w-[500px] h-[500px] bg-pink-300 -top-32 -left-32" />
      <div className="blob w-[400px] h-[400px] bg-purple-300 -bottom-20 -right-20" />
      <div className="blob w-[300px] h-[300px] bg-peach-200 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10 sm:py-16">

        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                          bg-pink-100 border border-pink-200 text-pink-600 text-xs font-black
                          uppercase tracking-widest mb-5 shadow-pink-sm">
            <Sparkles className="w-3.5 h-3.5 animate-bounce-soft" />
            <span>Real PM Evaluation • Not Just a Chatbot</span>
            <Sparkles className="w-3.5 h-3.5 animate-bounce-soft" />
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-pink-900 tracking-tight leading-tight mb-4">
            Nail Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-blush-500 to-purple-500">
              PM Interview
            </span>
            {' '}with AI ✨
          </h1>

          <p className="text-pink-600 text-base sm:text-lg leading-relaxed font-medium max-w-2xl mx-auto">
            Paste any job description. Get 6–8 custom questions, a surgical follow-up probe,
            a visible 5-dimension rubric, and a Staff PM rewrite — all in one session. 🎯
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Step 1: Level */}
          <div className="card p-6 sm:p-8 animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-2xl bg-pink-100 text-pink-600 flex items-center
                              justify-center font-black text-sm border border-pink-200">1</div>
              <div>
                <h2 className="text-lg font-black text-pink-900">Pick Your Target Level</h2>
                <p className="text-xs text-pink-400 font-medium">
                  Questions & scoring calibrate strictly to this bar 🎯
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {levels.map(item => {
                const isSelected = selectedLevel === item.level;
                return (
                  <button key={item.level} type="button" onClick={() => setSelectedLevel(item.level)}
                    className={`relative text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-pink-400 bg-pink-50 shadow-pink-md scale-[1.02]'
                        : 'border-pink-100 bg-white hover:border-pink-200 hover:shadow-soft'
                    }`}>
                    <div className={`text-2xl mb-2 ${isSelected ? 'animate-wiggle' : ''}`}>
                      {item.emoji}
                    </div>
                    <div className="font-black text-sm text-pink-900 mb-0.5">{item.level}</div>
                    <div className="text-[11px] font-bold text-pink-400">{item.exp}</div>
                    <div className="text-[10px] text-pink-500 leading-tight mt-1 line-clamp-2">
                      {item.focus}
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-pink-500 fill-pink-100" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: JD */}
          <div className="card p-6 sm:p-8 animate-slide-up space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-pink-100 text-pink-600 flex items-center
                              justify-center font-black text-sm border border-pink-200">2</div>
              <div>
                <h2 className="text-lg font-black text-pink-900">Add Your Job Description</h2>
                <p className="text-xs text-pink-400 font-medium">Use a preset or paste any real JD 📋</p>
              </div>
            </div>

            {/* Presets */}
            <div>
              <div className="text-[11px] font-black uppercase tracking-widest text-pink-400 mb-3">
                ✨ Quick 1-Click Presets:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {SAMPLE_JDS.map(preset => {
                  const isPreset = selectedPresetId === preset.id;
                  return (
                    <button key={preset.id} type="button" onClick={() => handleSelectPreset(preset)}
                      className={`flex items-start text-left p-3 rounded-2xl border-2 text-xs transition-all duration-200 ${
                        isPreset
                          ? 'bg-pink-50 border-pink-300 shadow-pink-sm'
                          : 'bg-white border-pink-100 hover:border-pink-200 hover:shadow-soft'
                      }`}>
                      <Briefcase className={`w-4 h-4 mr-2.5 shrink-0 mt-0.5 ${isPreset ? 'text-pink-500' : 'text-pink-300'}`} />
                      <div>
                        <div className="font-black text-pink-800 flex items-center gap-1">
                          {preset.company}
                          <span className="text-[10px] text-pink-400 font-bold">({preset.level})</span>
                        </div>
                        <div className="text-[11px] text-pink-500 truncate max-w-[180px] font-medium">
                          {preset.title}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Company + Role inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-pink-600 mb-1.5 uppercase tracking-wider">
                  Company Name 🏢
                </label>
                <input type="text" value={companyName}
                  onChange={e => { setCompanyName(e.target.value); setSelectedPresetId(''); }}
                  placeholder="e.g. Stripe, Uber, Airbnb, OpenAI"
                  className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-xs font-black text-pink-600 mb-1.5 uppercase tracking-wider">
                  Role Title 💼
                </label>
                <input type="text" value={roleTitle}
                  onChange={e => { setRoleTitle(e.target.value); setSelectedPresetId(''); }}
                  placeholder="e.g. Senior PM – Payments"
                  className="input-field text-sm" />
              </div>
            </div>

            {/* JD textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-pink-600 uppercase tracking-wider">
                  Job Description Text 📝
                </label>
                <span className="text-[11px] text-pink-300 font-medium">{jdText.length} chars</span>
              </div>
              <textarea rows={9} value={jdText}
                onChange={e => { setJdText(e.target.value); setSelectedPresetId(''); }}
                placeholder="Paste the full job posting here (responsibilities, requirements, team mission)..."
                className="input-field text-xs leading-relaxed font-mono" required />
            </div>
          </div>

          {/* Feature Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: '🎯', title: '6–8 Custom Questions', desc: 'Behavioral, Product Sense, Execution & Strategy — all tuned to your JD.' },
              { icon: '🔍', title: 'Surgical Follow-Up', desc: 'Detects missing metrics, trade-offs, or decisions in your first draft.' },
              { icon: '📊', title: '5-Dimension Rubric', desc: 'Scored 1–5 independently — see exactly where you\'re weak, never an average.' },
            ].map(f => (
              <div key={f.title} className="card p-5 card-hover animate-fade-in">
                <div className="text-3xl mb-3">{f.icon}</div>
                <div className="font-black text-sm text-pink-800 mb-1">{f.title}</div>
                <p className="text-xs text-pink-500 leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center pt-2">
            <button type="submit" disabled={isGenerating || !jdText.trim()}
              className="btn-primary inline-flex items-center gap-3 px-10 py-4 text-base
                         disabled:opacity-50 disabled:pointer-events-none shadow-pink-lg">
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Generating your interview...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">✨</span>
                  <span>Begin Mock Interview — {selectedLevel}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            <p className="text-xs text-pink-400 font-medium mt-3">
              No sign-up needed • Works 100% offline with built-in AI engine 💕
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
