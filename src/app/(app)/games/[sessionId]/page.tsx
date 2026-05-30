"use client";

import { motion } from "framer-motion";
import TopBar from "@/components/TopBar";

export default function GamePage() {
  return (
    <>
      <TopBar title="Game Arena" showBack />

      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-64px)] px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="game-card max-w-md w-full p-8 space-y-6 flex flex-col items-center"
        >
          {/* Анимейшнтэй хөгжүүлэлтийн дүрс */}
          <motion.div
            animate={{
              rotate: [0, 10, -10, 10, 0],
              scale: [1, 1.05, 1.05, 1, 1]
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: "easeInOut"
            }}
            className="text-6xl"
          >
            🚧
          </motion.div>

          <div className="space-y-2">
            <h2 className="font-display text-2xl font-bold tracking-wide text-foreground">
              Under Development
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Энэхүү хэсэг одоогоор хөгжүүлэлтийн шатанд явж байна. Бид удахгүй илүү сонирхолтой тоглоомуудтай эргэж ирэх болно!
            </p>
          </div>

          {/* Ачаалж буй эффект бүхий шугам */}
          <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden relative">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-neon-purple to-neon-blue absolute left-0 top-0"
              animate={{
                left: ["-100%", "100%"],
                width: ["30%", "30%"]
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "linear"
              }}
              style={{
                boxShadow: "0 0 12px rgba(124, 92, 255, 0.4)"
              }}
            />
          </div>

          <button
            onClick={() => window.history.back()}
            className="btn-game w-full text-center mt-2 text-sm"
          >
            Буцах
          </button>
        </motion.div>
      </div>
    </>
  );
}

/* ==========================================================================
   ХУУЧИН ТОГЛООМЫН КОД (КОММЕНТ БОЛГОВ)
   ==========================================================================

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { FadeIn } from "@/components/AnimatedList";

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

// export default function GamePageOld() {
//   const params = useParams();
//   const sessionId = params.sessionId as string;

//   const [session, setSession] = useState<Session | null>(null);
//   const [currentRound, setCurrentRound] = useState(0);
//   const [selected, setSelected] = useState<number | null>(null);
//   const [result, setResult] = useState<{ correct: boolean; correctIndex: number; coinsEarned: number } | null>(null);
//   const [timer, setTimer] = useState(15);
//   const [startTime, setStartTime] = useState(0);
//   const [totalXp, setTotalXp] = useState(0);
//   const [finished, setFinished] = useState(false);
//   const [score, setScore] = useState({ correct: 0, total: 0 });

//   useEffect(() => {
//     fetch(`/api/qa/sessions?sessionId=${sessionId}`)
//       .then((r) => r.json())
//       .then((d) => {
//         if (d.session) {
//           setSession(d.session);
//           setStartTime(Date.now());
//         }
//       });
//   }, [sessionId]);

//   const currentQuestion = session?.questions[currentRound];

//   useEffect(() => {
//     if (!currentQuestion || selected !== null || finished) return;
//     setTimer(currentQuestion.timeLimit);

//     const interval = setInterval(() => {
//       setTimer((t) => {
//         if (t <= 1) { clearInterval(interval); return 0; }
//         return t - 1;
//       });
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [currentRound, currentQuestion, selected, finished]);

//   const submitAnswer = useCallback(async (index: number) => {
//     if (selected !== null || !currentQuestion) return;
//     setSelected(index);
//     const responseTimeMs = Date.now() - startTime;

//     try {
//       const res = await fetch("/api/qa/answer", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ questionId: currentQuestion.id, selectedIndex: index, responseTimeMs }),
//       });
//       const data = await res.json();
//       setResult(data);
//       setTotalXp((prev) => prev + (data.coinsEarned || 0));
//       setScore((prev) => ({ correct: prev.correct + (data.correct ? 1 : 0), total: prev.total + 1 }));
//     } catch {
//       setResult({ correct: index === currentQuestion.correctIndex, correctIndex: currentQuestion.correctIndex, coinsEarned: 0 });
//     }
//   }, [selected, currentQuestion, startTime]);

//   function nextRound() {
//     if (!session) return;
//     if (currentRound + 1 >= session.questions.length) { setFinished(true); return; }
//     setCurrentRound((r) => r + 1);
//     setSelected(null);
//     setResult(null);
//     setStartTime(Date.now());
//   }

//   if (!session) {
//     return (
//       <div className="flex items-center justify-center min-h-dvh">
//         <div className="text-muted-foreground animate-pulse font-display">Loading game...</div>
//       </div>
//     );
//   }

//   if (finished) {
//     const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
//     const grade = accuracy === 100 ? "S" : accuracy >= 80 ? "A" : accuracy >= 60 ? "B" : accuracy >= 40 ? "C" : "F";
//     const gradeColor = { S: "text-neon-gold text-glow-gold", A: "text-neon-green", B: "text-neon-blue", C: "text-neon-orange", F: "text-neon-red" }[grade];
//     const emoji = accuracy === 100 ? "🏆" : accuracy >= 80 ? "🔥" : accuracy >= 60 ? "👍" : accuracy >= 40 ? "😅" : "💀";

//     return (
//       <>
//         <TopBar title="Game Over" showBack />
//         <FadeIn className="px-4 py-8 max-w-2xl mx-auto text-center space-y-6">
//           <div className="text-6xl">{emoji}</div>
//           <h2 className="font-display text-3xl font-bold">Game Over</h2>

//           <div className="game-card p-8 space-y-6">
//             <div>
//               <div className={`font-display text-6xl font-bold ${gradeColor}`}>{grade}</div>
//               <div className="text-xs text-muted-foreground mt-1">Grade</div>
//             </div>

//             <div className="grid grid-cols-3 gap-4">
//               <div>
//                 <div className="font-mono text-2xl font-bold text-foreground">{score.correct}/{score.total}</div>
//                 <div className="text-[11px] text-muted-foreground">Correct</div>
//               </div>
//               <div>
//                 <div className="font-mono text-2xl font-bold text-neon-purple">{accuracy}%</div>
//                 <div className="text-[11px] text-muted-foreground">Accuracy</div>
//               </div>
//               <div>
//                 <div className="font-mono text-2xl font-bold text-neon-gold text-glow-gold">+{totalXp}</div>
//                 <div className="text-[11px] text-muted-foreground">Coins</div>
//               </div>
//             </div>

//             <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
//               <motion.div
//                 className="h-full rounded-full bg-gradient-to-r from-neon-purple to-neon-blue"
//                 initial={{ width: 0 }}
//                 animate={{ width: `${accuracy}%` }}
//                 transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
//               />
//             </div>
//           </div>

//           <button
//             onClick={() => window.history.back()}
//             className="btn-game w-full text-center"
//           >
//             Back to Lobby
//           </button>
//         </FadeIn>
//       </>
//     );
//   }

//   if (!currentQuestion) return null;
//   const timerPercent = (timer / currentQuestion.timeLimit) * 100;
//   const optionLabels = ["A", "B", "C", "D"];

//   return (
//     <>
//       <TopBar
//         title={`Round ${currentRound + 1}/${session.questions.length}`}
//         showBack
//         rightAction={
//           <span className={`font-mono text-lg font-bold ${timer <= 5 ? "text-neon-red animate-glow-pulse" : "text-foreground"}`}>
//             {timer}s
//           </span>
//         }
//       />

//       <div className="px-4 py-4 max-w-2xl mx-auto space-y-5">
//         <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
//           <motion.div
//             className="h-full rounded-full"
//             animate={{ width: `${timerPercent}%` }}
//             transition={{ duration: 1, ease: "linear" }}
//             style={{
//               background: timer <= 5 ? "#EF4444" : "linear-gradient(90deg, #7C5CFF, #2DD4FF)",
//               boxShadow: timer <= 5 ? "0 0 12px rgba(239, 68, 68, 0.4)" : "0 0 12px rgba(124, 92, 255, 0.3)",
//             }}
//           />
//         </div>

//         <FadeIn key={currentRound}>
//           <div className="game-card p-6 text-center">
//             <p className="font-display text-lg font-bold">{currentQuestion.question}</p>
//           </div>
//         </FadeIn>

//         <div className="space-y-2.5">
//           {currentQuestion.options.map((option, i) => {
//             let extraClass = "game-card p-4 w-full text-left text-sm font-medium flex items-center gap-3 ";
//             if (selected !== null && result) {
//               if (i === result.correctIndex) extraClass += "ring-2 ring-neon-green glow-green text-neon-green ";
//               else if (i === selected && !result.correct) extraClass += "ring-2 ring-neon-red glow-red text-neon-red opacity-70 ";
//               else extraClass += "opacity-30 ";
//             } else if (selected !== null) {
//               if (i === selected) extraClass += "ring-2 ring-neon-purple glow-purple ";
//               else extraClass += "opacity-40 ";
//             } else {
//               extraClass += "cursor-pointer active:scale-[0.97] ";
//             }

//             return (
//               <motion.button
//                 key={i}
//                 onClick={() => submitAnswer(i)}
//                 disabled={selected !== null}
//                 className={extraClass}
//                 initial={{ opacity: 0, x: -12 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ delay: i * 0.08, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
//               >
//                 <span className="w-7 h-7 rounded-lg bg-neon-purple/10 text-neon-purple font-bold text-xs flex items-center justify-center flex-shrink-0">
//                   {optionLabels[i]}
//                 </span>
//                 {option}
//               </motion.button>
//             );
//           })}
//         </div>

//         {result && (
//           <FadeIn className="space-y-3">
//             <div className={`game-card p-4 text-center ${result.correct ? "ring-1 ring-neon-green/30" : "ring-1 ring-neon-red/30"}`}>
//               <span className="font-display text-base font-bold">
//                 {result.correct ? (
//                   <span className="text-neon-green">Correct! +{result.coinsEarned} 🪙</span>
//                 ) : (
//                   <span className="text-neon-red">Wrong!</span>
//                 )}
//               </span>
//             </div>
//             <button onClick={nextRound} className="btn-game w-full text-center">
//               {currentRound + 1 >= session.questions.length ? "See Results" : "Next Question"}
//             </button>
//           </FadeIn>
//         )}
//       </div>
//     </>
//   );
// }
*/