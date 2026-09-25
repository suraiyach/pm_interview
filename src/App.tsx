import React, { useState, useEffect } from 'react';
import { TargetLevel, Question, EvaluatedAnswer, SessionMetaSummary } from './types';
import { Header } from './components/Header';
import { SetupView } from './components/SetupView';
import { InterviewView } from './components/InterviewView';
import { SessionSummaryView } from './components/SessionSummaryView';
import { SettingsModal } from './components/SettingsModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { generateQuestionsForJD } from './services/questionGenerator';
import { generateSessionMetaSummary } from './services/pmEvaluator';
import {
  saveSessionToSupabase,
  SavedSessionRecord,
  getSupabaseConfig
} from './services/supabaseClient';

export const App: React.FC = () => {
  // Session States
  const [sessionId, setSessionId] = useState<string>(() => {
    return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'sess_' + Date.now();
  });
  const [stage, setStage] = useState<'setup' | 'interview' | 'summary'>('setup');
  const [targetLevel, setTargetLevel] = useState<TargetLevel>('Senior PM');
  const [roleTitle, setRoleTitle] = useState<string>('Senior Product Manager');
  const [companyName, setCompanyName] = useState<string>('Tech Company');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [evaluatedAnswers, setEvaluatedAnswers] = useState<EvaluatedAnswer[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [metaSummary, setMetaSummary] = useState<SessionMetaSummary | null>(null);

  // Settings & History Modal States
  const [apiKey, setApiKey] = useState<string>('');
  const [useLiveLLM, setUseLiveLLM] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [supabaseVersion, setSupabaseVersion] = useState<number>(0);

  // Load API key from localStorage on mount
  useEffect(() => {
    try {
      const storedKey = localStorage.getItem('interview_coach_gemini_key') || '';
      const storedUseLive = localStorage.getItem('interview_coach_use_live') === 'true';
      setApiKey(storedKey);
      setUseLiveLLM(storedUseLive && !!storedKey);
    } catch (e) {
      // ignore
    }
  }, []);

  const handleSaveGeminiKey = (newKey: string, live: boolean) => {
    setApiKey(newKey);
    setUseLiveLLM(live && !!newKey);
    try {
      localStorage.setItem('interview_coach_gemini_key', newKey);
      localStorage.setItem('interview_coach_use_live', String(live && !!newKey));
    } catch (e) {
      // ignore
    }
  };

  const handleStartSession = (
    level: TargetLevel,
    jdText: string,
    title: string,
    company: string
  ) => {
    setIsGenerating(true);
    const newSessionId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'sess_' + Date.now();
    setSessionId(newSessionId);
    setTargetLevel(level);
    setJobDescription(jdText);
    setRoleTitle(title);
    setCompanyName(company);

    setTimeout(() => {
      // Generate 6-8 tailored PM interview questions
      const generated = generateQuestionsForJD(jdText, level);
      setQuestions(generated);
      setCurrentIndex(0);
      setEvaluatedAnswers([]);
      setMetaSummary(null);
      setIsGenerating(false);
      setStage('interview');

      // Initialize session in Supabase / Local storage
      saveSessionToSupabase(
        newSessionId,
        level,
        title,
        company,
        jdText,
        generated,
        [],
        null
      );
    }, 600);
  };

  const handleAnswerEvaluated = (evaluated: EvaluatedAnswer) => {
    let updatedList: EvaluatedAnswer[] = [];
    setEvaluatedAnswers(prev => {
      const existingIdx = prev.findIndex(item => item.questionId === evaluated.questionId);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = evaluated;
        updatedList = copy;
        return copy;
      }
      updatedList = [...prev, evaluated];
      return updatedList;
    });

    // Auto-sync progress to Supabase / Local storage
    saveSessionToSupabase(
      sessionId,
      targetLevel,
      roleTitle,
      companyName,
      jobDescription,
      questions,
      updatedList.length > 0 ? updatedList : [evaluated],
      null
    );
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinishSession = () => {
    const summary = generateSessionMetaSummary(
      targetLevel,
      roleTitle,
      companyName,
      evaluatedAnswers
    );
    setMetaSummary(summary);
    setStage('summary');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Sync full completed session with patterns to Supabase
    saveSessionToSupabase(
      sessionId,
      targetLevel,
      roleTitle,
      companyName,
      jobDescription,
      questions,
      evaluatedAnswers,
      summary
    );
  };

  const handleRestart = () => {
    if (stage === 'interview' && evaluatedAnswers.length > 0) {
      if (!confirm('Are you sure you want to end this session and start over?')) {
        return;
      }
    }
    setStage('setup');
    setCurrentIndex(0);
    setEvaluatedAnswers([]);
    setMetaSummary(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReviewQuestion = (idx: number) => {
    setCurrentIndex(idx);
    setStage('interview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load past session from History drawer
  const handleLoadSession = (
    savedRecord: SavedSessionRecord,
    loadedAnswers: EvaluatedAnswer[],
    loadedSummary: SessionMetaSummary | null
  ) => {
    setSessionId(savedRecord.id);
    setTargetLevel(savedRecord.target_level);
    setRoleTitle(savedRecord.role_title);
    setCompanyName(savedRecord.company_name);
    setJobDescription(savedRecord.job_description || '');
    setQuestions(savedRecord.questions || []);
    setEvaluatedAnswers(loadedAnswers);
    setCurrentIndex(Math.min(loadedAnswers.length, Math.max(0, (savedRecord.questions?.length || 1) - 1)));

    if (savedRecord.stage === 'summary' && loadedSummary) {
      setMetaSummary(loadedSummary);
      setStage('summary');
    } else {
      setMetaSummary(null);
      setStage('interview');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Header
        key={supabaseVersion}
        targetLevel={targetLevel}
        companyName={companyName}
        currentStep={currentIndex + 1}
        totalSteps={questions.length}
        stage={stage}
        hasApiKey={useLiveLLM && !!apiKey}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onResetSession={handleRestart}
      />

      <main className="flex-1">
        {stage === 'setup' && (
          <SetupView
            onStartSession={handleStartSession}
            isGenerating={isGenerating}
          />
        )}

        {stage === 'interview' && questions.length > 0 && (
          <InterviewView
            questions={questions}
            currentIndex={currentIndex}
            targetLevel={targetLevel}
            companyName={companyName}
            evaluatedAnswers={evaluatedAnswers}
            apiKey={apiKey}
            useLiveLLM={useLiveLLM}
            onAnswerEvaluated={handleAnswerEvaluated}
            onNextQuestion={handleNextQuestion}
            onFinishSession={handleFinishSession}
            onSelectQuestionIndex={(idx) => {
              setCurrentIndex(idx);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {stage === 'summary' && metaSummary && (
          <SessionSummaryView
            summary={metaSummary}
            questions={questions}
            evaluatedAnswers={evaluatedAnswers}
            onRestart={handleRestart}
            onReviewQuestion={handleReviewQuestion}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-850 py-6 text-center text-xs text-slate-500">
        <p>Interview Coach — Objective PM Evaluation Bar • Powered by Supabase & React</p>
      </footer>

      {/* Settings Modal (Supabase & Gemini AI) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        geminiApiKey={apiKey}
        useLiveLLM={useLiveLLM}
        onSaveGemini={handleSaveGeminiKey}
        onSupabaseStatusChange={() => setSupabaseVersion(v => v + 1)}
      />

      {/* Interview History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onLoadSession={handleLoadSession}
      />
    </div>
  );
};
