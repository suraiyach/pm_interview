import React from 'react';
import { TargetLevel } from '../types';
import { Target, Key, RotateCcw, Award, Database, History, Sparkles } from 'lucide-react';
import { getSupabaseConfig } from '../services/supabaseClient';

interface HeaderProps {
  targetLevel?: TargetLevel;
  companyName?: string;
  currentStep?: number;
  totalSteps?: number;
  stage: 'setup' | 'interview' | 'summary';
  hasApiKey: boolean;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onResetSession: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  targetLevel, companyName, currentStep = 1, totalSteps = 7,
  stage, hasApiKey, onOpenSettings, onOpenHistory, onResetSession
}) => {
  const supabaseConfig = getSupabaseConfig();

  return (
    <header className="sticky top-0 z-40 glass border-b border-pink-100 shadow-pink-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={onResetSession}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-400 to-blush-600
                          flex items-center justify-center shadow-pink-md
                          group-hover:scale-105 transition-transform duration-200">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-pink-800 tracking-tight">Interview Coach</span>
              <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5
                               rounded-full bg-pink-100 text-pink-500 border border-pink-200">
                ✨ PM Studio
              </span>
            </div>
            <p className="text-[11px] text-pink-400 font-medium">AI-Powered PM Evaluation Engine</p>
          </div>
        </div>

        {/* Center: Session Progress Pill */}
        {stage !== 'setup' && (
          <div className="hidden md:flex items-center gap-3 glass px-4 py-1.5 rounded-full
                           border border-pink-200 shadow-pink-sm">
            {targetLevel && (
              <span className="badge bg-pink-100 text-pink-600 border border-pink-200">
                <Award className="w-3 h-3" /> {targetLevel}
              </span>
            )}
            {companyName && (
              <span className="text-xs font-bold text-pink-700 truncate max-w-[140px]">
                {companyName}
              </span>
            )}
            {stage === 'interview' && (
              <span className="text-xs text-pink-400 border-l border-pink-200 pl-3 font-medium">
                Q<span className="text-pink-700 font-black">{currentStep}</span>/{totalSteps}
              </span>
            )}
          </div>
        )}

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Supabase Status */}
          <button onClick={onOpenSettings}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 ${
              supabaseConfig.isConfigured
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                : 'bg-white text-pink-500 border-pink-200 hover:bg-pink-50'
            }`}>
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {supabaseConfig.isConfigured ? '💾 Connected' : 'Connect DB'}
            </span>
          </button>

          {/* History */}
          <button onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-pink-600
                       border border-pink-200 hover:bg-pink-50 text-xs font-bold transition-all duration-200">
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">History</span>
          </button>

          {/* Settings key icon */}
          <button onClick={onOpenSettings}
            className={`p-2 rounded-xl border text-xs transition-all duration-200 ${
              hasApiKey
                ? 'bg-pink-100 text-pink-600 border-pink-200'
                : 'bg-white text-pink-400 border-pink-200 hover:bg-pink-50'
            }`} title="AI & Database Settings">
            <Key className="w-4 h-4" />
          </button>

          {/* Reset */}
          {stage !== 'setup' && (
            <button onClick={onResetSession}
              className="p-2 text-pink-400 hover:text-pink-600 hover:bg-pink-50
                         rounded-xl transition-all duration-200" title="New session">
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
