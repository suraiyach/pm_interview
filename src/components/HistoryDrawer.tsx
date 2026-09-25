import React, { useState, useEffect } from 'react';
import { X, Clock, Trash2, ArrowUpRight, Award, BarChart3, Database, RefreshCw } from 'lucide-react';
import { fetchPastSessions, fetchSessionDetails, deleteSessionFromSupabase, SavedSessionRecord, getSupabaseConfig } from '../services/supabaseClient';
import { EvaluatedAnswer, SessionMetaSummary, TargetLevel, Question } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSession: (
    session: SavedSessionRecord,
    evaluatedAnswers: EvaluatedAnswer[],
    summary: SessionMetaSummary | null
  ) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  onLoadSession
}) => {
  const [sessions, setSessions] = useState<SavedSessionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const config = getSupabaseConfig();

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await fetchPastSessions();
      setSessions(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectSession = async (s: SavedSessionRecord) => {
    setLoadingId(s.id);
    try {
      const details = await fetchSessionDetails(s.id);
      if (details) {
        let summary: SessionMetaSummary | null = null;
        if (s.stage === 'summary' && s.level_readiness_score !== null) {
          summary = {
            targetLevel: s.target_level,
            roleTitle: s.role_title,
            companyName: s.company_name,
            totalQuestions: s.questions.length,
            completedQuestions: details.evaluatedAnswers.length,
            dimensionAverages: s.dimension_averages || {},
            levelReadinessScore: s.level_readiness_score || 70,
            levelReadinessLabel: (s.level_readiness_label as any) || 'Solid Candidate',
            executiveSummary: s.executive_summary || '',
            systematicPatterns: details.patterns.map((p: any) => ({
              type: p.pattern_type,
              dimension: p.dimension || 'General',
              title: p.title,
              summary: p.summary,
              occurrences: p.occurrences || 1,
              totalQuestions: p.total_questions || details.evaluatedAnswers.length,
              recommendation: p.recommendation || ''
            })),
            topStrengths: [],
            priorityFixes: [],
            actionPlan: []
          };
        }

        onLoadSession(details.session, details.evaluatedAnswers, summary);
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this session?')) return;
    await deleteSessionFromSupabase(id);
    setSessions(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center space-x-2.5">
            <Clock className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Interview History</h3>
              <p className="text-[11px] text-slate-400">
                {config.isConfigured ? (
                  <span className="text-emerald-400 inline-flex items-center gap-1">
                    <Database className="w-3 h-3" /> Synced with Supabase
                  </span>
                ) : (
                  <span>Stored in Local Cache</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={loadData}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-3 text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <span>Fetching sessions from database...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-300">No Mock Interviews Saved Yet</h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Completed interviews and progress will be automatically saved here and synced to Supabase.
              </p>
            </div>
          ) : (
            sessions.map(s => {
              const dateStr = new Date(s.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <div
                  key={s.id}
                  onClick={() => handleSelectSession(s)}
                  className="p-4 rounded-2xl bg-slate-850/80 border border-slate-750/70 hover:border-indigo-500/60 hover:bg-slate-800 transition-all cursor-pointer space-y-2.5 relative group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      {s.target_level}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{dateStr}</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-white truncate">{s.role_title}</h4>
                    <div className="text-xs text-slate-400">{s.company_name}</div>
                  </div>

                  {s.level_readiness_score !== null && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
                      <span className="text-slate-400">Readiness:</span>
                      <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-300">
                        {s.level_readiness_score}% • {s.level_readiness_label}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                    <span>{s.questions?.length || 0} Questions in Loop</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={e => handleDelete(e, s.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-indigo-400 font-semibold inline-flex items-center gap-0.5">
                        {loadingId === s.id ? 'Loading...' : 'Open'}
                        <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
