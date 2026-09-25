import React from 'react';
import { TargetLevel } from '../types';
import { Target, Sparkles, Key, RotateCcw, Award, Database, History } from 'lucide-react';
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
  targetLevel,
  companyName,
  currentStep = 1,
  totalSteps = 7,
  stage,
  hasApiKey,
  onOpenSettings,
  onOpenHistory,
  onResetSession
}) => {
  const supabaseConfig = getSupabaseConfig();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onResetSession}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">Interview Coach</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                PM Studio
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Real PM Rubric & Iterative Follow-Up Engine</p>
          </div>
        </div>

        {/* Center: Session Meta (if in interview or summary) */}
        {stage !== 'setup' && (
          <div className="hidden md:flex items-center space-x-3 bg-slate-800/60 px-4 py-1.5 rounded-full border border-slate-700/60">
            {targetLevel && (
              <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Award className="w-3.5 h-3.5 mr-1" />
                {targetLevel}
              </span>
            )}
            {companyName && (
              <span className="text-xs text-slate-300 font-medium truncate max-w-[140px]">
                {companyName}
              </span>
            )}
            {stage === 'interview' && (
              <span className="text-xs text-slate-400 border-l border-slate-700 pl-3">
                Question <span className="text-white font-semibold">{currentStep}</span> of {totalSteps}
              </span>
            )}
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Supabase Status Button */}
          <button
            onClick={onOpenSettings}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              supabaseConfig.isConfigured
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:border-slate-600'
            }`}
            title="Configure Supabase Database"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">
              {supabaseConfig.isConfigured ? 'Supabase Connected' : 'Connect Supabase'}
            </span>
            <span className="sm:hidden">
              {supabaseConfig.isConfigured ? 'Supabase' : 'DB'}
            </span>
          </button>

          {/* Past History Drawer Toggle */}
          <button
            onClick={onOpenHistory}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:text-white text-xs font-medium transition-colors"
            title="View Past Mock Interviews"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">History</span>
          </button>

          {/* Settings Modal Toggle */}
          <button
            onClick={onOpenSettings}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              hasApiKey
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
            }`}
            title="AI & Database Settings"
          >
            <Key className="w-4 h-4" />
          </button>

          {/* Reset Button */}
          {stage !== 'setup' && (
            <button
              onClick={onResetSession}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              title="Reset and start new interview"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
