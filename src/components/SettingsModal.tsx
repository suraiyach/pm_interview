import React, { useState, useEffect } from 'react';
import { X, Key, Database, Check, ExternalLink, ShieldCheck, Copy, AlertCircle, RefreshCw } from 'lucide-react';
import { getSupabaseConfig, setSupabaseConfig, testSupabaseConnection } from '../services/supabaseClient';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  geminiApiKey: string;
  useLiveLLM: boolean;
  onSaveGemini: (apiKey: string, useLive: boolean) => void;
  onSupabaseStatusChange?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  geminiApiKey,
  useLiveLLM,
  onSaveGemini,
  onSupabaseStatusChange
}) => {
  const [activeTab, setActiveTab] = useState<'supabase' | 'ai'>('supabase');

  // Supabase states
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [supabaseKey, setSupabaseKey] = useState<string>('');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [sqlCopied, setSqlCopied] = useState<boolean>(false);

  // Gemini states
  const [localGeminiKey, setLocalGeminiKey] = useState<string>(geminiApiKey);
  const [localUseLive, setLocalUseLive] = useState<boolean>(useLiveLLM);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setSupabaseUrl(config.url);
      setSupabaseKey(config.anonKey);
      setTestResult(null);
      setLocalGeminiKey(geminiApiKey);
      setLocalUseLive(useLiveLLM);
    }
  }, [isOpen, geminiApiKey, useLiveLLM]);

  if (!isOpen) return null;

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    setSupabaseConfig(supabaseUrl, supabaseKey);
    setSavedSuccess(true);
    if (onSupabaseStatusChange) onSupabaseStatusChange();
    setTimeout(() => {
      setSavedSuccess(false);
    }, 1500);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testSupabaseConnection(supabaseUrl, supabaseKey);
      setTestResult(result);
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Connection test failed.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveGemini = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveGemini(localGeminiKey.trim(), localUseLive);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const sqlSchemaText = `-- Interview Coach Supabase Migration
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  target_level text not null,
  role_title text not null,
  company_name text not null,
  job_description text,
  stage text default 'interview' not null,
  level_readiness_score integer,
  level_readiness_label text,
  executive_summary text,
  questions jsonb default '[]'::jsonb,
  dimension_averages jsonb default '{}'::jsonb
);

create table if not exists public.evaluated_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  question_id text not null,
  question_title text,
  category text,
  initial_answer text not null,
  follow_up_missing_element text,
  follow_up_prompt text,
  follow_up_answer text,
  combined_answer text,
  relevance_score integer,
  structure_score integer,
  product_sense_score integer,
  analytical_score integer,
  tradeoff_score integer,
  rubric_scores jsonb default '[]'::jsonb,
  rewritten_answer jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create table if not exists public.session_patterns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  pattern_type text not null,
  dimension text,
  title text not null,
  summary text,
  occurrences integer default 1,
  total_questions integer default 1,
  recommendation text,
  created_at timestamptz default now() not null
);

alter table public.interview_sessions enable row level security;
alter table public.evaluated_answers enable row level security;
alter table public.session_patterns enable row level security;

do $$
begin
  drop policy if exists "Allow all on interview_sessions" on public.interview_sessions;
  create policy "Allow all on interview_sessions" on public.interview_sessions for all using (true) with check (true);

  drop policy if exists "Allow all on evaluated_answers" on public.evaluated_answers;
  create policy "Allow all on evaluated_answers" on public.evaluated_answers for all using (true) with check (true);

  drop policy if exists "Allow all on session_patterns" on public.session_patterns;
  create policy "Allow all on session_patterns" on public.session_patterns for all using (true) with check (true);
end $$;

grant usage on schema public to anon, authenticated, service_role;
grant all on table public.interview_sessions to anon, authenticated, service_role;
grant all on table public.evaluated_answers to anon, authenticated, service_role;
grant all on table public.session_patterns to anon, authenticated, service_role;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchemaText);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shadow-md">
            {activeTab === 'supabase' ? <Database className="w-5 h-5 text-emerald-400" /> : <Key className="w-5 h-5 text-indigo-400" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Application Settings</h3>
            <p className="text-xs text-slate-400">Configure Database & AI Intelligence</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex space-x-2 border-b border-slate-800 pb-3 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('supabase')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'supabase'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Supabase Database</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ai'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>AI Engine (Gemini)</span>
          </button>
        </div>

        {/* Tab 1: Supabase Connection */}
        {activeTab === 'supabase' && (
          <form onSubmit={handleSaveSupabase} className="space-y-5">
            <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-750 text-xs text-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  Connect Supabase Cloud
                </span>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 text-[11px]"
                >
                  <span>Supabase Dashboard</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-slate-400 leading-normal text-[11px]">
                Persist all interview loops, questions, candidate responses, rubric scores (1–5), Staff PM rewrites, and systematic pattern reports directly to your Supabase PostgreSQL database.
              </p>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={e => setSupabaseUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Supabase Anon Public API Key
                </label>
                <input
                  type="password"
                  value={supabaseKey}
                  onChange={e => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* SQL Migration Helper */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-slate-200">Supabase SQL Schema Ready</div>
                <div className="text-[11px] text-slate-400">Tables: interview_sessions, evaluated_answers, session_patterns</div>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                {sqlCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{sqlCopied ? 'Copied SQL!' : 'Copy SQL'}</span>
              </button>
            </div>

            {/* Test Connection Result Alert */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-start space-x-2.5 border ${
                  testResult.success
                    ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                    : 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                }`}
              >
                {testResult.success ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !supabaseUrl || !supabaseKey}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 hover:text-white flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/25 flex items-center space-x-1.5 transition-all"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Save Supabase</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Gemini AI Key */}
        {activeTab === 'ai' && (
          <form onSubmit={handleSaveGemini} className="space-y-5">
            <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-750 text-xs text-slate-300 space-y-2">
              <div className="flex items-center space-x-2 text-indigo-300 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero-Config Built-in Mode Available</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Interview Coach has a full PM evaluation matrix built right in. Adding a Gemini API key is completely optional if you want live dynamic LLM evaluation.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Google Gemini API Key (Optional)
              </label>
              <input
                type="password"
                value={localGeminiKey}
                onChange={e => setLocalGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Saved locally in browser localStorage</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 inline-flex items-center space-x-1"
                >
                  <span>Get Gemini Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-850/60 border border-slate-800">
              <input
                type="checkbox"
                id="toggle-live"
                checked={localUseLive}
                onChange={e => setLocalUseLive(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded bg-slate-900 border-slate-700 focus:ring-indigo-500"
              />
              <label htmlFor="toggle-live" className="text-xs text-slate-300 cursor-pointer select-none">
                Enable live API calls when key is present
              </label>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 flex items-center space-x-1.5 transition-all"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save AI Settings</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
