import React, { useState, useEffect, useRef } from 'react';
import { Question, TargetLevel, FollowUpQuestion, EvaluatedAnswer } from '../types';
import { RubricScoreCard } from './RubricScoreCard';
import { RewrittenAnswerCard } from './RewrittenAnswerCard';
import { QuestionNavigator } from './QuestionNavigator';
import { speechManager } from '../services/speechService';
import { generateFollowUp, evaluateCombinedAnswer } from '../services/pmEvaluator';
import { callGeminiFollowUp, callGeminiEvaluation } from '../services/geminiApi';
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Clock,
  Sparkles,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  FileEdit,
  Send,
  ChevronDown,
  ChevronUp
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
  onAnswerEvaluated: (evaluated: EvaluatedAnswer) => void;
  onNextQuestion: () => void;
  onFinishSession: () => void;
  onSelectQuestionIndex: (idx: number) => void;
}

export const InterviewView: React.FC<InterviewViewProps> = ({
  questions,
  currentIndex,
  targetLevel,
  companyName,
  evaluatedAnswers,
  apiKey,
  useLiveLLM,
  onAnswerEvaluated,
  onNextQuestion,
  onFinishSession,
  onSelectQuestionIndex
}) => {
  const currentQuestion = questions[currentIndex];
  const existingEvaluation = evaluatedAnswers.find(ans => ans.questionId === currentQuestion?.id);

  // States
  const [initialAnswer, setInitialAnswer] = useState<string>('');
  const [followUp, setFollowUp] = useState<FollowUpQuestion | null>(null);
  const [followUpAnswer, setFollowUpAnswer] = useState<string>('');
  const [isEvaluatingFollowUp, setIsEvaluatingFollowUp] = useState<boolean>(false);
  const [isScoringFinal, setIsScoringFinal] = useState<boolean>(false);
  const [showFrameworkTip, setShowFrameworkTip] = useState<boolean>(false);

  // Audio / Speech states
  const [isQuestionSpeaking, setIsQuestionSpeaking] = useState<boolean>(false);
  const [isMicActiveInitial, setIsMicActiveInitial] = useState<boolean>(false);
  const [isMicActiveFollowUp, setIsMicActiveFollowUp] = useState<boolean>(false);

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  // Populate state if this question was already evaluated
  useEffect(() => {
    if (existingEvaluation) {
      setInitialAnswer(existingEvaluation.initialAnswer);
      setFollowUp(existingEvaluation.followUp);
      setFollowUpAnswer(existingEvaluation.followUpAnswer);
    } else {
      setInitialAnswer('');
      setFollowUp(null);
      setFollowUpAnswer('');
      setElapsedSeconds(0);
      setIsTimerRunning(true);
    }
    speechManager.stopSpeaking();
    speechManager.stopListening();
    setIsQuestionSpeaking(false);
    setIsMicActiveInitial(false);
    setIsMicActiveFollowUp(false);
  }, [currentIndex, existingEvaluation]);

  // Pacing Timer
  useEffect(() => {
    if (isTimerRunning && !existingEvaluation) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, existingEvaluation]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // TTS for question context
  const handleToggleSpeakQuestion = () => {
    if (isQuestionSpeaking) {
      speechManager.stopSpeaking();
      setIsQuestionSpeaking(false);
    } else {
      setIsQuestionSpeaking(true);
      const textToRead = `${currentQuestion.title}. ${currentQuestion.context}`;
      speechManager.speak(textToRead, () => {
        setIsQuestionSpeaking(false);
      });
    }
  };

  // Mic dictation for initial answer
  const handleToggleMicInitial = () => {
    if (isMicActiveInitial) {
      speechManager.stopListening();
      setIsMicActiveInitial(false);
    } else {
      const started = speechManager.startListening(
        (transcript) => {
          setInitialAnswer(prev => prev ? `${prev} ${transcript}` : transcript);
        },
        (err) => {
          console.warn('Speech error', err);
          setIsMicActiveInitial(false);
        }
      );
      if (started) setIsMicActiveInitial(true);
    }
  };

  // Mic dictation for follow up answer
  const handleToggleMicFollowUp = () => {
    if (isMicActiveFollowUp) {
      speechManager.stopListening();
      setIsMicActiveFollowUp(false);
    } else {
      const started = speechManager.startListening(
        (transcript) => {
          setFollowUpAnswer(prev => prev ? `${prev} ${transcript}` : transcript);
        },
        (err) => {
          console.warn('Speech error', err);
          setIsMicActiveFollowUp(false);
        }
      );
      if (started) setIsMicActiveFollowUp(true);
    }
  };

  // Insert standard starter frameworks
  const insertTemplate = (type: 'star' | 'circles') => {
    if (type === 'star') {
      const template = `**Situation:** [Describe the context, company scale, and the specific problem]\n\n**Task:** [What was your explicit ownership and goal as PM?]\n\n**Action:** [Step 1: Analyzed data; Step 2: Aligned eng/design; Step 3: Prioritized key trade-offs]\n\n**Result:** [Quantified outcome: +X% metric lift, $Y revenue, and key retrospective learning]`;
      setInitialAnswer(prev => prev ? `${prev}\n\n${template}` : template);
    } else {
      const template = `**1. Goal & Context:** [Align on the business objective and user mission]\n\n**2. Persona Segmentation:** [Identify 3 user cohorts; pick 1 acute segment to focus on]\n\n**3. Pain Points:** [List the #1 blocker or emotional friction for this user]\n\n**4. Solutions:** [Concept A, Concept B, Concept C]\n\n**5. Trade-off & Decision:** [Decisive pick using RICE scoring; what we explicitly sacrifice]\n\n**6. Success Telemetry:** [North star metric, conversion proxy, and negative guardrail metric]`;
      setInitialAnswer(prev => prev ? `${prev}\n\n${template}` : template);
    }
  };

  // Step 4: Submit initial answer and generate ONE targeted follow-up
  const handleSubmitInitialAnswer = async () => {
    if (!initialAnswer.trim() || initialAnswer.trim().split(/\s+/).length < 10) {
      alert('Please provide a substantive answer (at least 15 words) before submitting.');
      return;
    }

    setIsEvaluatingFollowUp(true);

    try {
      let generatedFollowUp: FollowUpQuestion | null = null;

      // Try Live Gemini if configured
      if (useLiveLLM && apiKey) {
        generatedFollowUp = await callGeminiFollowUp(apiKey, currentQuestion, initialAnswer, targetLevel);
      }

      // Fallback to built-in evaluation heuristics
      if (!generatedFollowUp) {
        generatedFollowUp = generateFollowUp(currentQuestion, initialAnswer, targetLevel);
      }

      setFollowUp(generatedFollowUp);
    } catch (e) {
      console.error(e);
      setFollowUp(generateFollowUp(currentQuestion, initialAnswer, targetLevel));
    } finally {
      setIsEvaluatingFollowUp(false);
    }
  };

  // Step 5: Score FINAL answer (original + follow-up combined) against the 5 rubric dimensions
  const handleSubmitFinalAnswer = async () => {
    if (!followUpAnswer.trim() || followUpAnswer.trim().split(/\s+/).length < 8) {
      alert('Please provide your response to the follow-up question (at least 10 words).');
      return;
    }

    setIsScoringFinal(true);

    try {
      let finalResult = null;

      if (useLiveLLM && apiKey && followUp) {
        finalResult = await callGeminiEvaluation(
          apiKey,
          currentQuestion,
          initialAnswer,
          followUp,
          followUpAnswer,
          targetLevel
        );
      }

      if (!finalResult) {
        finalResult = evaluateCombinedAnswer(
          currentQuestion,
          initialAnswer,
          followUp!,
          followUpAnswer,
          targetLevel
        );
      }

      const combined = `${initialAnswer}\n\n[Follow-up clarification]: ${followUpAnswer}`;

      const evaluatedData: EvaluatedAnswer = {
        questionId: currentQuestion.id,
        initialAnswer,
        followUp: followUp!,
        followUpAnswer,
        combinedAnswer: combined,
        rubricScores: finalResult.rubricScores,
        rewrittenAnswer: finalResult.rewrittenAnswer,
        strengths: finalResult.strengths,
        weaknesses: finalResult.weaknesses,
        evaluationTimestamp: Date.now()
      };

      onAnswerEvaluated(evaluatedData);
      setIsTimerRunning(false);

      // Trigger celebratory confetti for completing an evaluated answer
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (err) {
        // ignore
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScoringFinal(false);
    }
  };

  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Question Roadmap Stepper */}
        <div className="lg:col-span-1 space-y-6">
          <QuestionNavigator
            questions={questions}
            currentIndex={currentIndex}
            evaluatedAnswers={evaluatedAnswers}
            onSelectIndex={onSelectQuestionIndex}
          />

          {/* Quick Pacing & Framework Widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center space-x-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Answer Pacing</span>
              </span>
              <span className="font-mono text-white font-bold">{formatTimer(elapsedSeconds)}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Ideal PM answers span 2.5 to 4 minutes (approx. 180–350 words). Clear structure beats wandering length.
            </p>
          </div>
        </div>

        {/* Right Column: Question + Answer + Follow-Up + Rubric Results */}
        <div className="lg:col-span-3 space-y-8">
          {/* Main Question Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            {/* Top metadata */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {currentQuestion.categoryLabel}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  • Competency: <span className="text-slate-200">{currentQuestion.competency}</span>
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {/* Audio button for question */}
                <button
                  onClick={handleToggleSpeakQuestion}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    isQuestionSpeaking
                      ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 animate-pulse'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                  title={isQuestionSpeaking ? 'Stop audio' : 'Read question aloud'}
                >
                  {isQuestionSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isQuestionSpeaking ? 'Speaking...' : 'Listen'}</span>
                </button>
              </div>
            </div>

            {/* Question Title & Scenario */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                {currentQuestion.title}
              </h2>
              <div className="mt-4 p-4 rounded-xl bg-slate-850/80 border border-slate-750/80 text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans">
                {currentQuestion.context}
              </div>
            </div>

            {/* Seniority Expectations Alert */}
            <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-900/30 flex items-start space-x-3 text-xs">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-indigo-300">{targetLevel} Hiring Bar Expectation: </span>
                <span className="text-slate-300">{currentQuestion.levelExpectation}</span>
              </div>
            </div>

            {/* Framework helper accordion */}
            <div className="border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setShowFrameworkTip(!showFrameworkTip)}
                className="flex items-center justify-between w-full text-xs font-semibold text-slate-400 hover:text-indigo-300 transition-colors"
              >
                <span className="flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>Recommended Framework & Key Elements</span>
                </span>
                {showFrameworkTip ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showFrameworkTip && (
                <div className="mt-3 p-4 rounded-xl bg-slate-850/60 border border-slate-800 text-xs space-y-3">
                  <div>
                    <span className="font-semibold text-slate-300">Framework Tip: </span>
                    <span className="text-slate-400">{currentQuestion.frameworkTip}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-300">Interviewers look for: </span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {currentQuestion.idealKeyElements.map((elem, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                          ✓ {elem}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Initial Answer Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="text-base font-bold text-white">Your Initial Answer</h3>
              </div>

              {/* Controls: Speech Dictation & Starter Templates */}
              <div className="flex items-center space-x-2">
                {!existingEvaluation && !followUp && (
                  <>
                    <button
                      type="button"
                      onClick={() => insertTemplate(currentQuestion.category === 'behavioral' ? 'star' : 'circles')}
                      className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 hover:text-white rounded-lg flex items-center space-x-1"
                      title="Insert scaffold outline"
                    >
                      <FileEdit className="w-3 h-3 text-indigo-400" />
                      <span>Insert Template</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleMicInitial}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        isMicActiveInitial
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                      }`}
                      title={isMicActiveInitial ? 'Stop recording voice' : 'Dictate with your microphone'}
                    >
                      {isMicActiveInitial ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                      <span>{isMicActiveInitial ? 'Listening...' : 'Dictate'}</span>
                    </button>
                  </>
                )}

                <span className="text-xs font-mono text-slate-400">
                  {initialAnswer.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
            </div>

            {/* Answer Text Area */}
            <textarea
              rows={8}
              value={initialAnswer}
              onChange={e => setInitialAnswer(e.target.value)}
              disabled={!!existingEvaluation || !!followUp}
              placeholder="Structure your answer clearly. Walk through your problem diagnosis, user needs, trade-offs, and quantifiable metrics..."
              className="w-full bg-slate-850 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-500 leading-relaxed font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-80 disabled:bg-slate-900"
            />

            {/* Initial Answer Action Button */}
            {!existingEvaluation && !followUp && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSubmitInitialAnswer}
                  disabled={isEvaluatingFollowUp || initialAnswer.trim().length < 40}
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isEvaluatingFollowUp ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Interviewer Analyzing Answer...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Answer & Receive Follow-Up Probe</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Follow-Up Probe Section (Step 4) */}
          {followUp && (
            <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative ring-1 ring-indigo-500/20">
              {/* Header with Missing Element Diagnosis Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-950 pb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center">
                    2
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Interviewer Follow-Up Probe
                  </h3>
                </div>

                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30 self-start sm:self-auto">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{followUp.missingElementLabel}</span>
                </span>
              </div>

              {/* Diagnosis Alert */}
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-xs text-amber-200/90 leading-relaxed">
                <span className="font-semibold text-amber-300">Interviewer Observation: </span>
                {followUp.explanation}
              </div>

              {/* The Follow-Up Question Prompt */}
              <div className="p-5 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-sm sm:text-base font-medium text-indigo-100 leading-relaxed">
                "{followUp.prompt}"
              </div>

              {/* Follow-up input box */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Your Follow-Up Defense
                  </label>
                  <div className="flex items-center space-x-2">
                    {!existingEvaluation && (
                      <button
                        type="button"
                        onClick={handleToggleMicFollowUp}
                        className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          isMicActiveFollowUp
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                        }`}
                      >
                        {isMicActiveFollowUp ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                        <span>{isMicActiveFollowUp ? 'Listening...' : 'Dictate'}</span>
                      </button>
                    )}
                    <span className="text-xs font-mono text-slate-400">
                      {followUpAnswer.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                </div>

                <textarea
                  rows={5}
                  value={followUpAnswer}
                  onChange={e => setFollowUpAnswer(e.target.value)}
                  disabled={!!existingEvaluation}
                  placeholder="Address the missing element directly. Provide the concrete numbers, the explicit trade-off, or the final decision call..."
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-500 leading-relaxed font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-80 disabled:bg-slate-900"
                />
              </div>

              {/* Final Submit Button */}
              {!existingEvaluation && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSubmitFinalAnswer}
                    disabled={isScoringFinal || followUpAnswer.trim().length < 20}
                    className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isScoringFinal ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Grading Combined Response Against Rubric...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Final Response & View Rubric Score</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Evaluated Results View: Steps 5 & 6 */}
          {existingEvaluation && (
            <div className="space-y-8 pt-4">
              {/* Step 5: Visible 5-Dimension Rubric Card */}
              <RubricScoreCard scores={existingEvaluation.rubricScores} />

              {/* Step 6: Rewritten Staff PM Version Card */}
              <RewrittenAnswerCard
                rewritten={existingEvaluation.rewrittenAnswer}
                candidateCombinedAnswer={existingEvaluation.combinedAnswer}
              />

              {/* Next Question / Finish Loop Bar */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div>
                  <div className="text-sm font-bold text-white">
                    Question {currentIndex + 1} of {questions.length} Evaluated
                  </div>
                  <p className="text-xs text-slate-400">
                    {isLastQuestion
                      ? 'You have completed all interview questions in this loop!'
                      : 'Advance to the next question or review your previous answers.'}
                  </p>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  {isLastQuestion ? (
                    <button
                      type="button"
                      onClick={onFinishSession}
                      className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02]"
                    >
                      <span>Generate Full Session Patterns Summary</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onNextQuestion}
                      className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all"
                    >
                      <span>Next Question ({currentIndex + 2}/{questions.length})</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
