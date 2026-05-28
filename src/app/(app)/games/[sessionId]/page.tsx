"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import TopBar from "@/components/TopBar";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  timeLimit: number;
  round: number;
}

interface Session {
  id: string;
  gameType: string;
  status: string;
  roundCount: number;
  questions: Question[];
}

export default function GamePage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<Session | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<{ correct: boolean; correctIndex: number; xpEarned: number } | null>(null);
  const [timer, setTimer] = useState(15);
  const [startTime, setStartTime] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    fetch(`/api/qa/sessions?lobbyId=_`)
      .then((r) => r.json())
      .then((d) => {
        const s = d.sessions?.find((s: Session) => s.id === sessionId);
        if (s) {
          setSession(s);
          setStartTime(Date.now());
        }
      });
  }, [sessionId]);

  const currentQuestion = session?.questions[currentRound];

  // Timer
  useEffect(() => {
    if (!currentQuestion || selected !== null || finished) return;
    setTimer(currentQuestion.timeLimit);

    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentRound, currentQuestion, selected, finished]);

  const submitAnswer = useCallback(async (index: number) => {
    if (selected !== null || !currentQuestion) return;
    setSelected(index);

    const responseTimeMs = Date.now() - startTime;

    try {
      const res = await fetch("/api/qa/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          selectedIndex: index,
          responseTimeMs,
        }),
      });

      const data = await res.json();
      setResult(data);
      setTotalXp((prev) => prev + (data.xpEarned || 0));
      setScore((prev) => ({
        correct: prev.correct + (data.correct ? 1 : 0),
        total: prev.total + 1,
      }));
    } catch {
      // Already answered, just show
      setResult({
        correct: index === currentQuestion.correctIndex,
        correctIndex: currentQuestion.correctIndex,
        xpEarned: 0,
      });
    }
  }, [selected, currentQuestion, startTime]);

  function nextRound() {
    if (!session) return;
    if (currentRound + 1 >= session.questions.length) {
      setFinished(true);
      return;
    }
    setCurrentRound((r) => r + 1);
    setSelected(null);
    setResult(null);
    setStartTime(Date.now());
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-[var(--neon-cyan)] animate-pulse">Loading game...</div>
      </div>
    );
  }

  if (finished) {
    return (
      <>
        <TopBar title="Game Over" showBack />
        <div className="px-4 py-8 max-w-lg mx-auto text-center space-y-6">
          <div className="text-6xl">🏆</div>
          <h2 className="text-2xl font-bold neon-glow text-[var(--neon-cyan)]">
            GAME OVER
          </h2>
          <div className="card-cyber p-6 space-y-4">
            <div>
              <div className="text-4xl font-bold text-[var(--neon-green)] neon-glow-green">
                {score.correct}/{score.total}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">Correct Answers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[var(--neon-yellow)]">+{totalXp} XP</div>
              <div className="text-sm text-[var(--text-secondary)]">Earned</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!currentQuestion) return null;

  const timerPercent = (timer / currentQuestion.timeLimit) * 100;

  return (
    <>
      <TopBar
        title={`Round ${currentRound + 1}/${session.questions.length}`}
        showBack
        rightAction={
          <span className={`text-lg font-mono font-bold ${timer <= 5 ? "text-red-400 animate-pulse" : "text-[var(--neon-cyan)]"}`}>
            {timer}s
          </span>
        }
      />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-6">
        {/* Timer Bar */}
        <div className="w-full bg-[var(--bg-card)] rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${timerPercent}%`,
              background: timer <= 5
                ? "linear-gradient(90deg, #ff4444, #ff0000)"
                : "linear-gradient(90deg, var(--neon-cyan), var(--neon-magenta))",
            }}
          />
        </div>

        {/* Question */}
        <div className="card-cyber p-6 text-center">
          <p className="text-lg font-bold text-[var(--text-primary)]">
            {currentQuestion.question}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, i) => {
            let className = "card-cyber p-4 w-full text-left text-sm font-medium transition-all ";

            if (selected !== null) {
              if (i === result?.correctIndex) {
                className += "neon-border border-[var(--neon-green)]! shadow-[0_0_15px_rgba(57,255,20,0.3)] text-[var(--neon-green)]";
              } else if (i === selected && !result?.correct) {
                className += "border-red-500! shadow-[0_0_15px_rgba(255,0,0,0.3)] text-red-400 opacity-70";
              } else {
                className += "opacity-40";
              }
            } else {
              className += "hover:neon-border cursor-pointer active:scale-[0.98]";
            }

            return (
              <button
                key={i}
                onClick={() => submitAnswer(i)}
                disabled={selected !== null}
                className={className}
              >
                <span className="text-[var(--neon-cyan)] font-bold mr-3">
                  {String.fromCharCode(65 + i)}.
                </span>
                {option}
              </button>
            );
          })}
        </div>

        {/* Result */}
        {result && (
          <div className="space-y-3">
            <div className={`card-cyber p-4 text-center ${result.correct ? "neon-border" : "neon-border-magenta"}`}>
              <span className="text-lg font-bold">
                {result.correct ? (
                  <span className="text-[var(--neon-green)]">Correct! +{result.xpEarned} XP</span>
                ) : (
                  <span className="text-red-400">Wrong!</span>
                )}
              </span>
            </div>
            <button onClick={nextRound} className="btn-neon w-full text-center">
              {currentRound + 1 >= session.questions.length ? "See Results" : "Next Question →"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
