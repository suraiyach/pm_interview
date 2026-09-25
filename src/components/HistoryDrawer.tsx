import React, { useState, useEffect } from 'react';
import { X, Clock, Trash2, ArrowUpRight, Database, RefreshCw, Sparkles } from 'lucide-react';
import { fetchPastSessions, fetchSessionDetails, deleteSessionFromSupabase, SavedSessionRecord, getSupabaseConfig } from '../services/supabaseClient';
import { EvaluatedAnswer, SessionMetaSummary } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSession: (session: SavedSessionRecord, evaluatedAnswers: EvaluatedAnswer[], summary: SessionMetaSummary | null) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ isOpen, onClose, onLoadSession }) => {
  const [sessions, setSessions] = useState<SavedSessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const config = getSupabaseConfig();

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await fetchPastSessions();
      setSessions(list);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (isOpen) loadData(); }, [isOpen]);

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
              type: p.pattern_type, dimension: p.dimension || 'General',
              title: p.title, summary: p.summary, occurrences: p.occurrences || 1,
              totalQuestions: p.total_questions || details.evaluatedAnswers.length,
              recommendation: p.recommendation || ''
            })),
            topStrengths: [], priorityFixes: [], actionPlan: []
          };
        }
        onLoadSession(details.session, details.evaluatedAnswers, summary);
        onClose();
      }
    } catch (e) { console.error(e); }
    finally { setLoadingId(null); }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Delete this session? 🗑️')) return;
    await deleteSessionFromSupabase(id);
    setSessions(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-pink-950/30 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white border-l-2 border-pink-100 h-full flex flex-col
                      shadow-pink-lg overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-pink-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-pink-400 to-blush-500
                            flex items-center justify-center shadow-pink-md">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black text-pink-900">Interview History 💾</h3>
              <p className="text-[11px] font-medium mt-0.5">
                {config.isConfigured ? (
                  <span className="text-emerald-500 inline-flex items-center gap-1">
                    <Database className="w-3 h-3" /> Synced with Supabase
                  </span>
                ) : (
                  <span className="text-pink-400">Local cache only</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={loadData} title="Refresh"
              className="p-2 rounded-xl text-pink-400 hover:text-pink-600 hover:bg-pink-50 transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose}
              className="p-2 rounded-xl text-pink-400 hover:text-pink-600 hover:bg-pink-50 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-pink-400">
              <div className="w-8 h-8 border-2 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
              <span className="text-xs font-bold">Loading from database... 💕</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-4">
              <div className="text-6xl animate-float">📋</div>
              <h4 className="text-sm font-black text-pink-800">No Sessions Yet</h4>
              <p className="text-xs text-pink-400 font-medium leading-relaxed max-w-xs mx-auto">
                Completed interview loops will be automatically saved here and synced to Supabase. 💕
              </p>
            </div>
          ) : (
            sessions.map(s => {
              const dateStr = new Date(s.created_at).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', year: 'numeric'
              });

              return (
                <div key={s.id} onClick={() => handleSelectSession(s)}
                  className="group p-4 rounded-2xl bg-white border-2 border-pink-100
                             hover:border-pink-300 hover:shadow-pink-sm transition-all cursor-pointer space-y-3
                             relative card-hover">
                  <div className="flex items-center justify-between gap-2">
                    <span className="badge bg-pink-100 text-pink-600 border border-pink-200 text-[10px] font-black">
                      ✨ {s.target_level}
                    </span>
                    <span className="text-[11px] text-pink-400 font-mono font-medium">{dateStr}</span>
                  </div>

                  <div>
                    <h4 className="font-black text-sm text-pink-900 truncate">{s.role_title}</h4>
                    <div className="text-xs text-pink-500 font-medium">{s.company_name}</div>
                  </div>

                  {s.level_readiness_score !== null && (
                    <div className="flex items-center justify-between border-t border-pink-100 pt-2 text-xs">
                      <span className="text-pink-400 font-medium">Readiness:</span>
                      <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
                        {s.level_readiness_score}% • {s.level_readiness_label}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-pink-400 font-medium">
                    <span>🎯 {s.questions?.length || 0} Questions</span>
                    <div className="flex items-center gap-2">
                      <button onClick={e => handleDelete(e, s.id)}
                        className="text-pink-300 hover:text-rose-500 transition-colors p-1"
                        title="Delete session">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-pink-500 font-black inline-flex items-center gap-1
                                       group-hover:text-pink-700 transition-colors">
                        {loadingId === s.id ? '⏳ Loading' : '📂 Open'}
                        <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer CTA */}
        {!config.isConfigured && (
          <div className="p-4 border-t border-pink-100 bg-pink-50/50">
            <div className="flex items-start gap-2.5 text-xs text-pink-600 font-medium">
              <Sparkles className="w-4 h-4 text-pink-400 shrink-0 mt-0.5 animate-bounce-soft" />
              <span>
                Connect Supabase in Settings to sync sessions across devices and never lose progress! 💕
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
