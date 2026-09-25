import React, { useState, useEffect, useRef } from 'react';
import { Question, TargetLevel, FollowUpQuestion, EvaluatedAnswer } from '../types';
import { RubricScoreCard } from './RubricScoreCard';
import { RewrittenAnswerCard } from './RewrittenAnswerCard';
import { QuestionNavigator } from './QuestionNavigator';
import { speechManager } from '../services/speechService';
import { generateFollowUp, evaluateCombinedAnswer } from '../services/pmEvaluator';
import { callGeminiFollowUp, callGeminiEvaluation } from '../services/geminiApi';
import {
  Volume2, VolumeX, Mic, MicOff, Clock, Sparkles,
  ArrowRight, CheckCircle2, AlertCircle, Lightbulb,
  FileEdit, Send, ChevronDown, ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface InterviewViewProps {
  questions: Question[];
  currentIndex: number;
  targetLevel: TargetLevel;
  companyName: string;
  evaluatedAnswers: EvaluatedAnswer[];
  apiKey?: string;
  useLiveLLM: boolean;
  onAnswerEvaluated: (e: EvaluatedAnswer) => void;
  onNextQuestion: () => void;
  onFinishSession: () => void;
  onSelectQuestionIndex: (idx: number) => void;
}

export const InterviewView: React.FC<InterviewViewProps> = ({
  questions, currentIndex, targetLevel, companyName,
  evaluatedAnswers, apiKey, useLiveLLM,
  onAnswerEvaluated, onNextQuestion, onFinishSession, onSelectQuestionIndex
}) => {
  const currentQuestion = questions[currentIndex];
  const existingEvaluation = evaluatedAnswers.find(a => a.questionId === currentQuestion?.id);

  const [initialAnswer, setInitialAnswer] = useState('');
  const [followUp, setFollowUp] = useState<FollowUpQuestion | null>(null);
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [isEvaluatingFollowUp, setIsEvaluatingFollowUp] = useState(false);
  const [isScoringFinal, setIsScoringFinal] = useState(false);
  const [showFrameworkTip, setShowFrameworkTip] = useState(false);

  const [isQuestionSpeaking, setIsQuestionSpeaking] = useState(false);
  const [isMicActiveInitial, setIsMicActiveInitial] = useState(false);
  const [isMicActiveFollowUp, setIsMicActiveFollowUp] = useState(false);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (existingEvaluation) {
      setInitialAnswer(existingEvaluation.initialAnswer);
      setFollowUp(existingEvaluation.followUp);
      setFollowUpAnswer(existingEvaluation.followUpAnswer);
    } else {
      setInitialAnswer(''); setFollowUp(null); setFollowUpAnswer('');
      setElapsedSeconds(0); setIsTimerRunning(true);
    }
    speechManager.stopSpeaking(); speechManager.stopListening();
    setIsQuestionSpeaking(false); setIsMicActiveInitial(false); setIsMicActiveFollowUp(false);
  }, [currentIndex]);

  useEffect(() => {
    if (isTimerRunning && !existingEvaluation) {
      timerRef.current = setInterval(() => setElapsedSeconds(p => p + 1), 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning, existingEvaluation]);

  const formatTimer = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  const handleToggleSpeakQuestion = () => {
    if (isQuestionSpeaking) { speechManager.stopSpeaking(); setIsQuestionSpeaking(false); }
    else {
      setIsQuestionSpeaking(true);
      speechManager.speak(`${currentQuestion.title}. ${currentQuestion.context}`, () => setIsQuestionSpeaking(false));
    }
  };

  const handleToggleMicInitial = () => {
    if (isMicActiveInitial) { speechManager.stopListening(); setIsMicActiveInitial(false); }
    else {
      const ok = speechManager.startListening(t => setInitialAnswer(p => p ? `${p} ${t}` : t), () => setIsMicActiveInitial(false));
      if (ok) setIsMicActiveInitial(true);
    }
  };

  const handleToggleMicFollowUp = () => {
    if (isMicActiveFollowUp) { speechManager.stopListening(); setIsMicActiveFollowUp(false); }
    else {
      const ok = speechManager.startListening(t => setFollowUpAnswer(p => p ? `${p} ${t}` : t), () => setIsMicActiveFollowUp(false));
      if (ok) setIsMicActiveFollowUp(true);
    }
  };

  const insertTemplate = (type: 'star' | 'circles') => {
    const template = type === 'star'
      ? `**Situation:** [Context, company scale, specific problem]\n\n**Task:** [Your PM ownership and goal]\n\n**Action:**\n1. Analyzed data and identified root cause\n2. Aligned cross-functional team\n3. Prioritized key trade-offs\n\n**Result:** [Quantified outcome: +X% metric, $Y revenue, key learning]`
      : `**1. Goal:** [Business objective and user mission]\n\n**2. Personas:** [3 user cohorts → pick 1 acute segment]\n\n**3. Pain Points:** [Top friction for this user]\n\n**4. Solutions:**\n- Concept A: ...\n- Concept B: ...\n- Concept C: ...\n\n**5. Trade-off & Decision:** [Decisive pick + what we sacrifice]\n\n**6. Success Metrics:** [North star, proxy KPI, guardrail]`;
    setInitialAnswer(p => p ? `${p}\n\n${template}` : template);
  };

  const handleSubmitInitialAnswer = async () => {
    if (initialAnswer.trim().split(/\s+/).length < 10) return alert('Please write at least 15 words first! 💕');
    setIsEvaluatingFollowUp(true);
    try {
      let fu: FollowUpQuestion | null = null;
      if (useLiveLLM && apiKey) fu = await callGeminiFollowUp(apiKey, currentQuestion, initialAnswer, targetLevel);
      if (!fu) fu = generateFollowUp(currentQuestion, initialAnswer, targetLevel);
      setFollowUp(fu);
    } finally { setIsEvaluatingFollowUp(false); }
  };

  const handleSubmitFinalAnswer = async () => {
    if (followUpAnswer.trim().split(/\s+/).length < 8) return alert('Please add more to your follow-up! 💕');
    setIsScoringFinal(true);
    try {
      let result = null;
      if (useLiveLLM && apiKey && followUp)
        result = await callGeminiEvaluation(apiKey, currentQuestion, initialAnswer, followUp, followUpAnswer, targetLevel);
      if (!result) result = evaluateCombinedAnswer(currentQuestion, initialAnswer, followUp!, followUpAnswer, targetLevel);

      const evaluated: EvaluatedAnswer = {
        questionId: currentQuestion.id,
        initialAnswer, followUp: followUp!,
        followUpAnswer,
        combinedAnswer: `${initialAnswer}\n\n[Follow-up]: ${followUpAnswer}`,
        rubricScores: result.rubricScores,
        rewrittenAnswer: result.rewrittenAnswer,
        strengths: result.strengths, weaknesses: result.weaknesses,
        evaluationTimestamp: Date.now()
      };
      onAnswerEvaluated(evaluated);
      setIsTimerRunning(false);
      try { confetti({ particleCount: 80, spread: 70, colors: ['#f472b6','#fb7185','#c084fc'], origin: { y: 0.7 } }); } catch {}
    } finally { setIsScoringFinal(false); }
  };

  const isLastQuestion = currentIndex === questions.length - 1;
  const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="relative min-h-screen">
      {/* Subtle background blobs */}
      <div className="blob w-[400px] h-[400px] bg-pink-200 -top-20 -right-20 opacity-20" />
      <div className="blob w-[300px] h-[300px] bg-purple-200 bottom-0 -left-20 opacity-20" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Sidebar: Navigator + Timer */}
          <div className="lg:col-span-1 space-y-5">
            <QuestionNavigator questions={questions} currentIndex={currentIndex}
              evaluatedAnswers={evaluatedAnswers} onSelectIndex={onSelectQuestionIndex} />

            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-black text-pink-600">
                  <Clock className="w-3.5 h-3.5 text-pink-400" /> Pacing ⏱️
                </span>
                <span className={`font-mono font-black text-base ${elapsedSeconds > 240 ? 'text-rose-500' : 'text-pink-700'}`}>
                  {formatTimer(elapsedSeconds)}
                </span>
              </div>
              <div className="w-full h-2 bg-pink-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-pink-400 to-blush-500 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, (elapsedSeconds / 240) * 100)}%` }} />
              </div>
              <p className="text-[11px] text-pink-400 font-medium leading-normal">
                🎯 Ideal: 2.5–4 min (180–350 words). Structure beats length!
              </p>
            </div>
          </div>

          {/* Main Column */}
          <div className="lg:col-span-3 space-y-7">

            {/* Question Card */}
            <div className="card p-6 sm:p-8 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pink-100 pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="badge bg-pink-100 text-pink-600 border border-pink-200 font-black">
                    {currentQuestion.categoryLabel}
                  </span>
                  <span className="text-xs text-pink-500 font-medium">
                    🎯 {currentQuestion.competency}
                  </span>
                </div>
                <button onClick={handleToggleSpeakQuestion}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    isQuestionSpeaking
                      ? 'bg-pink-100 text-pink-600 border-pink-300 animate-pulse-pink'
                      : 'bg-white text-pink-400 border-pink-200 hover:bg-pink-50'
                  }`}>
                  {isQuestionSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isQuestionSpeaking ? 'Speaking...' : '🔊 Listen'}</span>
                </button>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-pink-900 leading-snug mb-4">
                  {currentQuestion.title}
                </h2>
                <div className="bg-pink-50/60 border border-pink-100 rounded-2xl p-4
                                text-pink-800 text-sm leading-relaxed font-medium whitespace-pre-wrap">
                  {currentQuestion.context}
                </div>
              </div>

              {/* Level expectation */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl
                              bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100">
                <Sparkles className="w-4 h-4 text-pink-400 shrink-0 mt-0.5 animate-bounce-soft" />
                <div className="text-xs">
                  <span className="font-black text-pink-700">{targetLevel} Hiring Bar: </span>
                  <span className="text-pink-600 font-medium">{currentQuestion.levelExpectation}</span>
                </div>
              </div>

              {/* Framework accordion */}
              <div className="border-t border-pink-100 pt-4">
                <button type="button" onClick={() => setShowFrameworkTip(!showFrameworkTip)}
                  className="flex items-center justify-between w-full text-xs font-black text-pink-500
                             hover:text-pink-700 transition-colors">
                  <span className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    💡 Framework Tips & Key Elements
                  </span>
                  {showFrameworkTip ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showFrameworkTip && (
                  <div className="mt-3 p-4 rounded-2xl bg-amber-50/70 border border-amber-100 text-xs space-y-3">
                    <div>
                      <span className="font-black text-amber-700">Framework: </span>
                      <span className="text-amber-600 font-medium">{currentQuestion.frameworkTip}</span>
                    </div>
                    <div>
                      <span className="font-black text-amber-700">Interviewers look for: </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {currentQuestion.idealKeyElements.map((e, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-xl bg-white text-amber-700
                                                   border border-amber-200 text-[11px] font-bold">
                            ✓ {e}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Initial Answer */}
            <div className="card p-6 sm:p-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-pink-100 text-pink-600 text-xs font-black
                                   flex items-center justify-center border border-pink-200">1</span>
                  <h3 className="font-black text-base text-pink-900">Your Initial Answer ✍️</h3>
                </div>

                {!existingEvaluation && !followUp && (
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => insertTemplate(
                      currentQuestion.category === 'behavioral' ? 'star' : 'circles'
                    )}
                      className="px-2.5 py-1 text-xs font-bold text-pink-500 bg-white border border-pink-200
                                 hover:bg-pink-50 rounded-xl flex items-center gap-1 transition-all">
                      <FileEdit className="w-3 h-3" /> Template
                    </button>

                    <button type="button" onClick={handleToggleMicInitial}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                        isMicActiveInitial
                          ? 'bg-rose-50 text-rose-500 border-rose-200 animate-pulse-pink'
                          : 'bg-white text-pink-400 border-pink-200 hover:bg-pink-50'
                      }`}>
                      {isMicActiveInitial ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                      <span>{isMicActiveInitial ? '🔴 Listening' : '🎙️ Dictate'}</span>
                    </button>

                    <span className="text-xs font-bold text-pink-300">{wordCount(initialAnswer)} words</span>
                  </div>
                )}
              </div>

              <textarea rows={8} value={initialAnswer} onChange={e => setInitialAnswer(e.target.value)}
                disabled={!!existingEvaluation || !!followUp}
                placeholder="Structure your answer clearly. Walk through your problem diagnosis, user needs, trade-offs, and quantifiable metrics... 💕"
                className="input-field text-sm leading-relaxed disabled:opacity-80 disabled:cursor-not-allowed" />

              {!existingEvaluation && !followUp && (
                <div className="flex justify-end pt-2">
                  <button type="button" onClick={handleSubmitInitialAnswer}
                    disabled={isEvaluatingFollowUp || initialAnswer.trim().length < 40}
                    className="btn-primary flex items-center gap-2 px-7 py-3 text-sm
                               disabled:opacity-50 disabled:pointer-events-none">
                    {isEvaluatingFollowUp ? (
                      <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Analyzing your answer...</span></>
                    ) : (
                      <><span>Submit & Get Follow-Up Probe</span><Send className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Follow-Up Probe */}
            {followUp && (
              <div className="card p-6 sm:p-8 space-y-5 border-2 border-amber-200 shadow-[0_4px_20px_rgba(251,191,36,0.2)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3
                                border-b border-amber-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 text-xs font-black
                                     flex items-center justify-center border border-amber-200">2</span>
                    <h3 className="font-black text-base text-pink-900">Interviewer Follow-Up 🎤</h3>
                  </div>
                  <span className="badge bg-amber-50 text-amber-700 border border-amber-200 font-black text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5" /> {followUp.missingElementLabel}
                  </span>
                </div>

                {/* Diagnosis */}
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100 text-xs font-medium
                                text-amber-700 leading-relaxed">
                  <span className="font-black text-amber-800">🔍 Gap Detected: </span>
                  {followUp.explanation}
                </div>

                {/* Probe question */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-pink-50 to-amber-50
                                border border-amber-200 text-sm font-black text-pink-900 leading-relaxed italic">
                  "{followUp.prompt}"
                </div>

                {/* Follow-up input */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-pink-600 uppercase tracking-wider">
                      Your Response 💪
                    </label>
                    <div className="flex items-center gap-2">
                      {!existingEvaluation && (
                        <button type="button" onClick={handleToggleMicFollowUp}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                            isMicActiveFollowUp
                              ? 'bg-rose-50 text-rose-500 border-rose-200 animate-pulse-pink'
                              : 'bg-white text-pink-400 border-pink-200 hover:bg-pink-50'
                          }`}>
                          {isMicActiveFollowUp ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                          <span>{isMicActiveFollowUp ? '🔴 Recording' : '🎙️ Dictate'}</span>
                        </button>
                      )}
                      <span className="text-xs font-bold text-pink-300">{wordCount(followUpAnswer)} words</span>
                    </div>
                  </div>

                  <textarea rows={5} value={followUpAnswer} onChange={e => setFollowUpAnswer(e.target.value)}
                    disabled={!!existingEvaluation}
                    placeholder="Address the missing element directly — give concrete numbers, name the trade-off, or make the definitive decision call... 💕"
                    className="input-field text-sm leading-relaxed disabled:opacity-80 disabled:cursor-not-allowed" />
                </div>

                {!existingEvaluation && (
                  <div className="flex justify-end pt-2">
                    <button type="button" onClick={handleSubmitFinalAnswer}
                      disabled={isScoringFinal || followUpAnswer.trim().length < 20}
                      className="btn-primary flex items-center gap-2 px-8 py-3.5 text-sm
                                 disabled:opacity-50 disabled:pointer-events-none"
                      style={{ background: isScoringFinal ? undefined : 'linear-gradient(135deg, #10b981, #059669)' }}>
                      {isScoringFinal ? (
                        <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          <span>Scoring against rubric...</span></>
                      ) : (
                        <><span>✨ Submit & View My Scores</span><CheckCircle2 className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Results: Rubric + Rewrite */}
            {existingEvaluation && (
              <div className="space-y-7 animate-fade-in">
                <RubricScoreCard scores={existingEvaluation.rubricScores} />
                <RewrittenAnswerCard rewritten={existingEvaluation.rewrittenAnswer}
                  candidateCombinedAnswer={existingEvaluation.combinedAnswer} />

                {/* Next / Finish Bar */}
                <div className="card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="font-black text-pink-900">
                      Question {currentIndex + 1} of {questions.length} Done! 🎉
                    </div>
                    <p className="text-xs text-pink-500 font-medium mt-0.5">
                      {isLastQuestion
                        ? 'You completed the full interview loop! 🌟'
                        : 'Ready for the next challenge?'}
                    </p>
                  </div>

                  {isLastQuestion ? (
                    <button type="button" onClick={onFinishSession}
                      className="btn-primary flex items-center gap-2 px-8 py-3.5 text-sm w-full sm:w-auto justify-center">
                      <span>🏆 See My Session Summary</span><ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button type="button" onClick={onNextQuestion}
                      className="btn-primary flex items-center gap-2 px-7 py-3.5 text-sm w-full sm:w-auto justify-center">
                      <span>Next Question ({currentIndex + 2}/{questions.length})</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
