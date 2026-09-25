import React, { useState, useEffect } from 'react';
import { X, Key, Database, Check, ExternalLink, ShieldCheck, Copy, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
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
  isOpen, onClose, geminiApiKey, useLiveLLM, onSaveGemini, onSupabaseStatusChange
}) => {
  const [activeTab, setActiveTab] = useState<'supabase' | 'ai'>('supabase');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [localGeminiKey, setLocalGeminiKey] = useState(geminiApiKey);
  const [localUseLive, setLocalUseLive] = useState(useLiveLLM);
  const [savedSuccess, setSavedSuccess] = useState(false);

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
    setTimeout(() => setSavedSuccess(false), 1500);
  };

  const handleTestConnection = async () => {
    setIsTesting(true); setTestResult(null);
    try {
      const result = await testSupabaseConnection(supabaseUrl, supabaseKey);
      setTestResult(result);
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Connection test failed.' });
    } finally { setIsTesting(false); }
  };

  const handleSaveGemini = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveGemini(localGeminiKey.trim(), localUseLive);
    setSavedSuccess(true);
    setTimeout(() => { setSavedSuccess(false); onClose(); }, 800);
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
  rubric_scores jsonb default '[]'::jsonb,
  rewritten_answer jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create table if not exists public.session_patterns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  pattern_type text not null,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-pink-950/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border-2 border-pink-100 rounded-3xl w-full max-w-xl p-6 sm:p-8
                      shadow-pink-lg relative my-8 animate-slide-up">
        {/* Close */}
        <button onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-2xl text-pink-300 hover:text-pink-600
                     hover:bg-pink-50 transition-all duration-200">
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-400 to-blush-500
                          flex items-center justify-center shadow-pink-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black text-pink-900">App Settings ✨</h3>
            <p className="text-xs text-pink-400 font-medium">Database & AI Intelligence</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-pink-100 pb-4 mb-6">
          {[
            { tab: 'supabase', icon: <Database className="w-4 h-4" />, label: '💾 Supabase DB' },
            { tab: 'ai',       icon: <Key className="w-4 h-4" />,      label: '🤖 AI Engine' },
          ].map(({ tab, icon, label }) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all ${
                activeTab === tab
                  ? 'bg-pink-100 text-pink-700 border border-pink-300 shadow-pink-sm'
                  : 'text-pink-400 hover:text-pink-600 hover:bg-pink-50'
              }`}>
              {icon}<span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab: Supabase */}
        {activeTab === 'supabase' && (
          <form onSubmit={handleSaveSupabase} className="space-y-5">
            <div className="p-4 rounded-2xl bg-pink-50/70 border border-pink-100 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-pink-800 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-500" /> Connect Supabase Cloud
                </span>
                <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer"
                  className="text-emerald-500 hover:text-emerald-600 inline-flex items-center gap-1 font-bold">
                  Dashboard <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-pink-500 font-medium leading-normal">
                Persist all sessions, rubric scores, Staff PM rewrites, and pattern reports to your Supabase Postgres database. 💾
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-pink-600 mb-1.5 uppercase tracking-wider">
                  Project URL 🔗
                </label>
                <input type="text" value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="input-field text-xs font-mono" />
              </div>
              <div>
                <label className="block text-xs font-black text-pink-600 mb-1.5 uppercase tracking-wider">
                  Anon Public API Key 🔑
                </label>
                <input type="password" value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)}
                  placeholder="sb_publishable_..."
                  className="input-field text-xs font-mono" />
              </div>
            </div>

            {/* SQL Copy */}
            <div className="p-3.5 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-pink-800">SQL Migration Schema 📋</div>
                <div className="text-[11px] text-pink-400 font-medium mt-0.5">
                  3 tables + RLS + grants — run once in SQL editor
                </div>
              </div>
              <button type="button" onClick={handleCopySql}
                className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs">
                {sqlCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{sqlCopied ? 'Copied! 💕' : 'Copy SQL'}</span>
              </button>
            </div>

            {/* Test result */}
            {testResult && (
              <div className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 border font-medium ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}>
                {testResult.success
                  ? <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  : <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                }
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={handleTestConnection}
                disabled={isTesting || !supabaseUrl || !supabaseKey}
                className="btn-secondary flex items-center gap-1.5 px-4 py-2 text-xs
                           disabled:opacity-50 disabled:pointer-events-none">
                {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button type="button" onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-pink-400 hover:bg-pink-50 transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="btn-primary flex items-center gap-1.5 px-5 py-2 text-xs">
                  {savedSuccess
                    ? <><Check className="w-3.5 h-3.5" /><span>Saved! 💕</span></>
                    : <span>Save Config</span>
                  }
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab: Gemini AI */}
        {activeTab === 'ai' && (
          <form onSubmit={handleSaveGemini} className="space-y-5">
            <div className="p-4 rounded-2xl bg-pink-50/70 border border-pink-100 text-xs space-y-2">
              <div className="flex items-center gap-2 font-black text-pink-800">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Zero-Config Mode Available ✨
              </div>
              <p className="text-pink-500 font-medium leading-relaxed">
                The built-in PM evaluation matrix works without an API key. Gemini is optional — only needed for dynamic live LLM evaluation.
              </p>
            </div>

            <div>
              <label className="block text-xs font-black text-pink-600 mb-1.5 uppercase tracking-wider">
                Google Gemini API Key (Optional) 🤖
              </label>
              <input type="password" value={localGeminiKey} onChange={e => setLocalGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="input-field text-xs font-mono" />
              <div className="mt-2 flex items-center justify-between text-[11px] text-pink-400 font-medium">
                <span>Stored locally in browser</span>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer"
                  className="text-blush-500 hover:text-blush-700 inline-flex items-center gap-1 font-bold">
                  Get Gemini Key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-pink-50 border border-pink-100">
              <input type="checkbox" id="toggle-live" checked={localUseLive}
                onChange={e => setLocalUseLive(e.target.checked)}
                className="w-4 h-4 rounded-lg accent-pink-500 cursor-pointer" />
              <label htmlFor="toggle-live" className="text-xs text-pink-700 font-bold cursor-pointer select-none">
                Enable live API calls when key is present
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-pink-400 hover:bg-pink-50 transition-colors">
                Cancel
              </button>
              <button type="submit"
                className="btn-primary flex items-center gap-1.5 px-5 py-2 text-xs">
                {savedSuccess
                  ? <><Check className="w-3.5 h-3.5" /><span>Saved! 💕</span></>
                  : <span>Save AI Settings</span>
                }
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
