import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TargetLevel, Question, EvaluatedAnswer, SessionMetaSummary } from '../types';

let cachedClient: SupabaseClient | null = null;
let currentUrl: string = '';
let currentKey: string = '';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  let localUrl = '';
  let localKey = '';
  if (typeof window !== 'undefined') {
    localUrl = localStorage.getItem('interview_coach_supabase_url') || '';
    localKey = localStorage.getItem('interview_coach_supabase_anon_key') || '';
  }

  const url = localUrl || envUrl;
  const anonKey = localKey || envKey;

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey && url.startsWith('http'))
  };
}

export function setSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('interview_coach_supabase_url', url.trim());
    localStorage.setItem('interview_coach_supabase_anon_key', anonKey.trim());
  }
  cachedClient = null;
  currentUrl = '';
  currentKey = '';
}

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  if (cachedClient && currentUrl === url && currentKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: { persistSession: false }
    });
    currentUrl = url;
    currentKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(
  testUrl?: string,
  testKey?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const url = testUrl || getSupabaseConfig().url;
    const key = testKey || getSupabaseConfig().anonKey;

    if (!url || !key) {
      return { success: false, message: 'URL and Anon Key are required.' };
    }

    const client = createClient(url, key);
    // Ping the interview_sessions table with limit 1
    const { data, error } = await client
      .from('interview_sessions')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          message: 'Connected to Supabase, but the "interview_sessions" table is missing. Please run the SQL schema migration in your Supabase SQL editor.'
        };
      }
      return { success: false, message: `Supabase error: ${error.message}` };
    }

    return { success: true, message: 'Successfully connected to Supabase database!' };
  } catch (err: any) {
    return { success: false, message: `Connection failed: ${err.message || String(err)}` };
  }
}

export interface SavedSessionRecord {
  id: string;
  created_at: string;
  target_level: TargetLevel;
  role_title: string;
  company_name: string;
  stage: string;
  level_readiness_score: number | null;
  level_readiness_label: string | null;
  executive_summary: string | null;
  questions: Question[];
  dimension_averages: Record<string, number>;
  evaluated_answers?: any[];
}

export async function saveSessionToSupabase(
  sessionId: string,
  targetLevel: TargetLevel,
  roleTitle: string,
  companyName: string,
  jobDescription: string,
  questions: Question[],
  evaluatedAnswers: EvaluatedAnswer[],
  summary: SessionMetaSummary | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    // If Supabase is not configured, save locally as fallback
    saveSessionLocally(sessionId, targetLevel, roleTitle, companyName, jobDescription, questions, evaluatedAnswers, summary);
    return { success: true };
  }

  try {
    // 1. Upsert session record
    const sessionPayload: any = {
      id: sessionId,
      target_level: targetLevel,
      role_title: roleTitle,
      company_name: companyName,
      job_description: jobDescription,
      stage: summary ? 'summary' : 'interview',
      questions: questions,
      updated_at: new Date().toISOString()
    };

    if (summary) {
      sessionPayload.level_readiness_score = summary.levelReadinessScore;
      sessionPayload.level_readiness_label = summary.levelReadinessLabel;
      sessionPayload.executive_summary = summary.executiveSummary;
      sessionPayload.dimension_averages = summary.dimensionAverages;
    }

    const { error: sessionError } = await supabase
      .from('interview_sessions')
      .upsert(sessionPayload, { onConflict: 'id' });

    if (sessionError) {
      console.error('Error saving session to Supabase:', sessionError);
      return { success: false, error: sessionError.message };
    }

    // 2. Upsert evaluated answers
    if (evaluatedAnswers.length > 0) {
      const answersPayload = evaluatedAnswers.map(ans => {
        const q = questions.find(item => item.id === ans.questionId);
        const relScore = ans.rubricScores.find(r => r.dimension === 'Relevance')?.score || 3;
        const structScore = ans.rubricScores.find(r => r.dimension === 'Structure & Clarity')?.score || 3;
        const prodScore = ans.rubricScores.find(r => r.dimension === 'Product Sense')?.score || 3;
        const analScore = ans.rubricScores.find(r => r.dimension === 'Analytical Rigor')?.score || 3;
        const tradeScore = ans.rubricScores.find(r => r.dimension === 'Trade-offs & Decisions')?.score || 3;

        return {
          session_id: sessionId,
          question_id: ans.questionId,
          question_title: q?.title || 'Question',
          category: q?.category || 'general',
          initial_answer: ans.initialAnswer,
          follow_up_missing_element: ans.followUp.missingElement,
          follow_up_prompt: ans.followUp.prompt,
          follow_up_answer: ans.followUpAnswer,
          combined_answer: ans.combinedAnswer,
          relevance_score: relScore,
          structure_score: structScore,
          product_sense_score: prodScore,
          analytical_score: analScore,
          tradeoff_score: tradeScore,
          rubric_scores: ans.rubricScores,
          rewritten_answer: ans.rewrittenAnswer
        };
      });

      // Delete existing answers for this session to avoid duplicate key issues if regenerated
      await supabase.from('evaluated_answers').delete().eq('session_id', sessionId);
      const { error: answersError } = await supabase.from('evaluated_answers').insert(answersPayload);

      if (answersError) {
        console.warn('Error inserting evaluated answers:', answersError);
      }
    }

    // 3. Upsert session patterns if summary is provided
    if (summary && summary.systematicPatterns.length > 0) {
      const patternsPayload = summary.systematicPatterns.map(p => ({
        session_id: sessionId,
        pattern_type: p.type,
        dimension: p.dimension,
        title: p.title,
        summary: p.summary,
        occurrences: p.occurrences,
        total_questions: p.totalQuestions,
        recommendation: p.recommendation
      }));

      await supabase.from('session_patterns').delete().eq('session_id', sessionId);
      await supabase.from('session_patterns').insert(patternsPayload);
    }

    // Also update local storage cache for seamless offline resilience
    saveSessionLocally(sessionId, targetLevel, roleTitle, companyName, jobDescription, questions, evaluatedAnswers, summary);

    return { success: true };
  } catch (err: any) {
    console.error('Supabase save failed:', err);
    saveSessionLocally(sessionId, targetLevel, roleTitle, companyName, jobDescription, questions, evaluatedAnswers, summary);
    return { success: false, error: err.message };
  }
}

export async function fetchPastSessions(): Promise<SavedSessionRecord[]> {
  const supabase = getSupabase();
  if (!supabase) {
    return loadLocalSessions();
  }

  try {
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.warn('Failed to fetch from Supabase, using local:', error);
      return loadLocalSessions();
    }

    return (data || []) as SavedSessionRecord[];
  } catch (e) {
    console.warn('Error in fetchPastSessions:', e);
    return loadLocalSessions();
  }
}

export async function fetchSessionDetails(sessionId: string): Promise<{
  session: SavedSessionRecord;
  evaluatedAnswers: EvaluatedAnswer[];
  patterns: any[];
} | null> {
  const supabase = getSupabase();
  if (!supabase) {
    const local = loadLocalSessionById(sessionId);
    return local;
  }

  try {
    const { data: sessionData, error: sErr } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sErr || !sessionData) return loadLocalSessionById(sessionId);

    const { data: answersData } = await supabase
      .from('evaluated_answers')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    const { data: patternsData } = await supabase
      .from('session_patterns')
      .select('*')
      .eq('session_id', sessionId);

    const evaluatedAnswers: EvaluatedAnswer[] = (answersData || []).map(row => ({
      questionId: row.question_id,
      initialAnswer: row.initial_answer,
      followUp: {
        missingElement: row.follow_up_missing_element || 'metric',
        missingElementLabel: `Missing: ${row.follow_up_missing_element || 'Metric'}`,
        explanation: 'Interviewer follow-up probe',
        prompt: row.follow_up_prompt || ''
      },
      followUpAnswer: row.follow_up_answer || '',
      combinedAnswer: row.combined_answer || '',
      rubricScores: row.rubric_scores || [],
      rewrittenAnswer: row.rewritten_answer || { text: '', keyImprovements: [], frameworkUsed: '' },
      strengths: [],
      weaknesses: [],
      evaluationTimestamp: new Date(row.created_at).getTime()
    }));

    return {
      session: sessionData as SavedSessionRecord,
      evaluatedAnswers,
      patterns: patternsData || []
    };
  } catch (e) {
    console.warn('Error loading session from Supabase:', e);
    return loadLocalSessionById(sessionId);
  }
}

export async function deleteSessionFromSupabase(sessionId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('interview_sessions').delete().eq('id', sessionId);
    } catch (e) {
      console.warn('Failed to delete from Supabase:', e);
    }
  }

  // Delete from local cache
  if (typeof window !== 'undefined') {
    const list = loadLocalSessions().filter(s => s.id !== sessionId);
    localStorage.setItem('interview_coach_local_sessions', JSON.stringify(list));
    localStorage.removeItem(`interview_coach_session_${sessionId}`);
  }
  return true;
}

// Local storage fallbacks
function saveSessionLocally(
  sessionId: string,
  targetLevel: TargetLevel,
  roleTitle: string,
  companyName: string,
  jobDescription: string,
  questions: Question[],
  evaluatedAnswers: EvaluatedAnswer[],
  summary: SessionMetaSummary | null
) {
  if (typeof window === 'undefined') return;

  const record: SavedSessionRecord = {
    id: sessionId,
    created_at: new Date().toISOString(),
    target_level: targetLevel,
    role_title: roleTitle,
    company_name: companyName,
    stage: summary ? 'summary' : 'interview',
    level_readiness_score: summary?.levelReadinessScore || null,
    level_readiness_label: summary?.levelReadinessLabel || null,
    executive_summary: summary?.executiveSummary || null,
    questions,
    dimension_averages: summary?.dimensionAverages || {}
  };

  const list = loadLocalSessions().filter(s => s.id !== sessionId);
  list.unshift(record);
  localStorage.setItem('interview_coach_local_sessions', JSON.stringify(list.slice(0, 20)));

  const fullData = {
    session: record,
    evaluatedAnswers,
    patterns: summary?.systematicPatterns || []
  };
  localStorage.setItem(`interview_coach_session_${sessionId}`, JSON.stringify(fullData));
}

function loadLocalSessions(): SavedSessionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const str = localStorage.getItem('interview_coach_local_sessions');
    return str ? JSON.parse(str) : [];
  } catch {
    return [];
  }
}

function loadLocalSessionById(sessionId: string) {
  if (typeof window === 'undefined') return null;
  try {
    const str = localStorage.getItem(`interview_coach_session_${sessionId}`);
    return str ? JSON.parse(str) : null;
  } catch {
    return null;
  }
}
