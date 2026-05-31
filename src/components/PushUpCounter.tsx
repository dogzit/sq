"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import * as poseDetection from "@tensorflow-models/pose-detection";

type Keypoint = poseDetection.Keypoint;
type Phase = "init" | "up" | "down";

const DOWN_ANGLE = 95;
const UP_ANGLE = 155;
const MIN_SCORE = 0.35;
const READY_FRAMES = 5;

function angleAt(a: Keypoint, b: Keypoint, c: Keypoint) {
  const v1x = a.x - b.x, v1y = a.y - b.y;
  const v2x = c.x - b.x, v2y = c.y - b.y;
  const dot = v1x * v2x + v1y * v2y;
  const mag = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y);
  if (mag === 0) return 180;
  return (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI;
}

function elbowAngle(kps: Keypoint[]) {
  const map: Record<string, Keypoint> = {};
  for (const k of kps) if (k.name) map[k.name] = k;
  const angles: number[] = [];
  let visibleSides = 0;
  for (const side of ["left", "right"] as const) {
    const sh = map[`${side}_shoulder`];
    const el = map[`${side}_elbow`];
    const wr = map[`${side}_wrist`];
    if (
      sh && el && wr &&
      (sh.score ?? 0) > MIN_SCORE &&
      (el.score ?? 0) > MIN_SCORE &&
      (wr.score ?? 0) > MIN_SCORE
    ) {
      visibleSides++;
      angles.push(angleAt(sh, el, wr));
    }
  }
  if (!angles.length) return { angle: null, visibleSides };
  return {
    angle: angles.reduce((a, b) => a + b, 0) / angles.length,
    visibleSides,
  };
}

interface Props {
  target?: number;
  onSuccess?: (info: { reps: number; coinsAwarded: number }) => void;
  onCount?: (n: number) => void;
}

export default function PushUpCounter({ target = 10, onSuccess, onCount }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef<Phase>("init");
  const readyCountRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);
  const lastCountRef = useRef(0);

  const [count, setCount] = useState(0);
  const [angle, setAngle] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("init");
  const [detected, setDetected] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [consented, setConsented] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [coinsAwarded, setCoinsAwarded] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState("");
  const running = consented;

  const beep = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate(40); } catch {}
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;

    async function init() {
      try {
        setLoading("Камер бэлдэж байна...");
        setError("");
        await tf.setBackend("webgl");
        await tf.ready();

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
          audio: false,
        });
        if (cancelled) return;

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await new Promise<void>((res) => {
          if (video.readyState >= 2) return res();
          video.onloadedmetadata = () => res();
        });
        await video.play();

        setLoading("AI модель ачаалж байна...");
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING },
        );
        if (cancelled) {
          detector.dispose();
          return;
        }
        detectorRef.current = detector;
        setLoading("");
        loop();
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error && e.message
              ? e.message
              : "Камер ачаалахад алдаа гарлаа",
          );
        }
      }
    }

    async function loop() {
      if (cancelled) return;
      const video = videoRef.current;
      const detector = detectorRef.current;
      if (!video || !detector || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      try {
        const poses = await detector.estimatePoses(video, { flipHorizontal: false });
        const kps = poses[0]?.keypoints;
        if (kps) {
          const { angle: a, visibleSides } = elbowAngle(kps);
          drawSkeleton(kps, phaseRef.current);

          if (a !== null && visibleSides >= 1) {
            readyCountRef.current = Math.min(readyCountRef.current + 1, READY_FRAMES);
            if (readyCountRef.current >= READY_FRAMES) setDetected(true);
            setAngle(a);

            if (phaseRef.current === "init" && a > UP_ANGLE) {
              phaseRef.current = "up";
              setPhase("up");
            } else if (phaseRef.current === "up" && a < DOWN_ANGLE) {
              phaseRef.current = "down";
              setPhase("down");
            } else if (phaseRef.current === "down" && a > UP_ANGLE) {
              phaseRef.current = "up";
              setPhase("up");
              setCount((c) => c + 1);
            }
          } else {
            readyCountRef.current = 0;
            setDetected(false);
            setAngle(null);
          }
        } else {
          readyCountRef.current = 0;
          setDetected(false);
        }
      } catch {
        // skip frame
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    function drawSkeleton(kps: Keypoint[], ph: Phase) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video || !video.videoWidth) return;
      if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
      if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const armPairs: [string, string][] = [
        ["left_shoulder", "left_elbow"],
        ["left_elbow", "left_wrist"],
        ["right_shoulder", "right_elbow"],
        ["right_elbow", "right_wrist"],
      ];
      const bodyPairs: [string, string][] = [
        ["left_shoulder", "right_shoulder"],
        ["left_shoulder", "left_hip"],
        ["right_shoulder", "right_hip"],
        ["left_hip", "right_hip"],
        ["left_hip", "left_knee"],
        ["right_hip", "right_knee"],
        ["left_knee", "left_ankle"],
        ["right_knee", "right_ankle"],
      ];
      const map: Record<string, Keypoint> = {};
      for (const k of kps) if (k.name) map[k.name] = k;

      const armColor = ph === "down" ? "#ff4d6a" : ph === "up" ? "#22d3ee" : "#7c5cff";

      ctx.lineWidth = 5;
      ctx.strokeStyle = armColor;
      ctx.shadowColor = armColor;
      ctx.shadowBlur = 12;
      for (const [a, b] of armPairs) {
        const A = map[a], B = map[b];
        if (!A || !B) continue;
        if ((A.score ?? 0) < MIN_SCORE || (B.score ?? 0) < MIN_SCORE) continue;
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.stroke();
      }

      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(124,92,255,0.6)";
      ctx.shadowBlur = 0;
      for (const [a, b] of bodyPairs) {
        const A = map[a], B = map[b];
        if (!A || !B) continue;
        if ((A.score ?? 0) < MIN_SCORE || (B.score ?? 0) < MIN_SCORE) continue;
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.stroke();
      }

      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 8;
      ctx.shadowColor = armColor;
      for (const k of kps) {
        if ((k.score ?? 0) < MIN_SCORE) continue;
        ctx.beginPath();
        ctx.arc(k.x, k.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    if (running) init();
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      detectorRef.current?.dispose();
      detectorRef.current = null;
      stream?.getTracks().forEach((t) => t.stop());
      const v = videoRef.current;
      if (v) v.srcObject = null;
    };
  }, [running]);

  useEffect(() => {
    if (count > lastCountRef.current) {
      lastCountRef.current = count;
      onCount?.(count);
      beep();
      setPulse((p) => p + 1);
    }
  }, [count, beep, onCount]);

  useEffect(() => {
    let cancelled = false;
    async function finish() {
      if (done || count < target || submitting) return;
      setDone(true);
      setSubmitting(true);
      setSubmitError("");
      try {
        const res = await fetch("/api/pushups/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reps: count }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setSubmitError(data.error || `HTTP ${res.status}`);
          return;
        }
        setCoinsAwarded(data.coinsAwarded);
        onSuccess?.({ reps: data.reps, coinsAwarded: data.coinsAwarded });
      } catch (e) {
        if (!cancelled) {
          setSubmitError(e instanceof Error ? e.message : "Сүлжээний алдаа");
        }
      } finally {
        if (!cancelled) setSubmitting(false);
      }
    }
    finish();
    return () => {
      cancelled = true;
    };
  }, [count, target, done, submitting, onSuccess]);

  function reset() {
    setCount(0);
    setDone(false);
    setPhase("init");
    setAngle(null);
    setDetected(false);
    setCoinsAwarded(null);
    setSubmitError("");
    phaseRef.current = "init";
    readyCountRef.current = 0;
    lastCountRef.current = 0;
  }

  const progress = Math.min(count / target, 1);
  const angleProgress =
    angle === null
      ? 0
      : Math.max(0, Math.min(1, (UP_ANGLE - angle) / (UP_ANGLE - DOWN_ANGLE)));

  const R = 28;
  const C = 2 * Math.PI * R;

  return (
    <div className="w-full max-w-xl mx-auto space-y-3">
      <div className="relative aspect-[3/4] sm:aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-border shadow-[0_0_24px_rgba(124,92,255,0.15)]">
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transform: "scaleX(-1)" }}
        />

        {/* Top-left: status pill */}
        <div className="absolute top-3 left-3 text-white">
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full backdrop-blur text-[11px] font-mono ${
              error
                ? "bg-red-500/70"
                : detected
                ? "bg-emerald-500/70"
                : "bg-black/55"
            }`}
          >
            {error ? "🔴 Алдаа" : loading ? "⏳ ачааллаж" : detected ? "🟢 LIVE" : "🟡 Биеэ харуул"}
          </span>
        </div>

        {/* Top-right: compact counter card with mini progress ring */}
        <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 shadow-[0_0_16px_rgba(124,92,255,0.4)]">
          <svg width="36" height="36" viewBox="0 0 64 64" className="-rotate-90">
            <circle cx="32" cy="32" r={R} stroke="rgba(255,255,255,0.15)" strokeWidth="6" fill="none" />
            <circle
              cx="32"
              cy="32"
              r={R}
              stroke="url(#g)"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - progress)}
              style={{ transition: "stroke-dashoffset 300ms cubic-bezier(.2,.7,.2,1)" }}
            />
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#7c5cff" />
              </linearGradient>
            </defs>
          </svg>
          <div
            key={pulse}
            className="flex items-baseline gap-1 text-white animate-in zoom-in-50 duration-200"
          >
            <span className="font-display text-2xl font-black tabular-nums leading-none">
              {count}
            </span>
            <span className="text-[11px] font-mono text-white/60">/{target}</span>
          </div>
        </div>

        {/* Side angle bar (visual rep meter) */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-32 rounded-full bg-white/10 overflow-hidden">
          <div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-rose-500 to-cyan-400 transition-[height] duration-150"
            style={{ height: `${angleProgress * 100}%` }}
          />
        </div>

        {/* Bottom HUD */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-white">
          <span
            className={`px-3 py-1.5 rounded-full backdrop-blur text-xs font-mono uppercase tracking-wider ${
              phase === "down"
                ? "bg-rose-500/80"
                : phase === "up"
                ? "bg-cyan-500/80"
                : "bg-black/55"
            }`}
          >
            {phase === "down" ? "↓ Доош" : phase === "up" ? "↑ Дээш" : "● Бэлд"}
          </span>
          <span className="px-3 py-1.5 rounded-full bg-black/55 backdrop-blur text-xs font-mono">
            ∠ {angle !== null ? `${angle.toFixed(0)}°` : "—"}
          </span>
          <button
            onClick={reset}
            className="px-3 py-1.5 rounded-full bg-black/55 backdrop-blur text-xs font-mono text-white"
          >
            ↻
          </button>
        </div>

        {/* Privacy consent screen */}
        {!consented && !error && !done && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/85 via-neon-purple/20 to-cyan-500/15 backdrop-blur-sm p-5">
            <div className="max-w-sm w-full space-y-4 text-center text-white">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl shadow-[0_0_24px_rgba(124,92,255,0.4)]">
                🔒
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display text-lg font-bold">
                  Камер ашиглах зөвшөөрөл
                </h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  Та камераар санаа зовох хэрэггүй —{" "}
                  <span className="text-cyan-300 font-semibold">
                    зураг, бичлэг ердөө хадгалагдахгүй
                  </span>
                  . Зөвхөн таны төхөөрөмж дотор AI тохойн өнцгийг шалгаж суниалт тоолно. Сэрвэр рүү юу ч илгээгдэхгүй.
                </p>
              </div>
              <ul className="text-[11px] text-white/70 space-y-1.5 text-left bg-white/5 border border-white/10 rounded-xl p-3">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Боловсруулалт зөвхөн таны browser дотор</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Зураг/бичлэг хадгалахгүй, илгээхгүй</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Хаахад камер шууд унтрана</span>
                </li>
              </ul>
              <button
                onClick={() => setConsented(true)}
                className="w-full px-6 py-3 rounded-full bg-neon-purple text-white font-display font-bold shadow-[0_0_18px_rgba(124,92,255,0.6)] hover:brightness-110 active:scale-95 transition"
              >
                ▶ Зөвшөөрөх ба эхлүүлэх
              </button>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {loading && consented && !error && !done && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[2px]">
            <div className="text-center text-white">
              <div className="text-4xl mb-2 animate-pulse">🤖</div>
              <div className="text-sm font-mono">{loading}</div>
            </div>
          </div>
        )}

        {/* Hint when not detected */}
        {!error && !loading && !detected && running && !done && (
          <div className="absolute inset-x-0 bottom-16 px-4 pointer-events-none">
            <div className="mx-auto max-w-[80%] text-center px-3 py-2 rounded-xl bg-black/60 backdrop-blur text-white text-[11px]">
              📷 Биеэ камерт бүтэн харуулж, мөр–тохой–бугуй ил харагдах өнцөгт байрлуулна уу
            </div>
          </div>
        )}

        {/* Rep flash effect */}
        {pulse > 0 && (
          <div
            key={`flash-${pulse}`}
            className="absolute inset-0 pointer-events-none animate-pulse"
            style={{
              boxShadow: "inset 0 0 60px rgba(34,211,238,0.6)",
              animation: "fadeOut 400ms forwards",
            }}
          />
        )}

        {/* Success overlay */}
        {done && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/85 via-neon-purple/30 to-cyan-500/20 backdrop-blur-sm animate-in fade-in p-5">
            <div className="text-center text-white max-w-xs space-y-3">
              <div className="text-7xl animate-bounce">🏆</div>
              <div className="space-y-0.5">
                <div className="text-2xl font-display font-black">Амжилттай!</div>
                <div className="text-sm text-white/70">{count} суниалт</div>
              </div>
              {submitting && (
                <div className="text-xs text-white/70 font-mono">Шагнал нэхэж байна...</div>
              )}
              {coinsAwarded !== null && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-gold/20 border border-neon-gold/40 text-neon-gold font-mono font-bold">
                  +{coinsAwarded} 🪙
                </div>
              )}
              {submitError && (
                <div className="text-xs text-rose-300 font-mono px-3 py-2 rounded-lg bg-rose-500/15 border border-rose-500/30">
                  {submitError}
                </div>
              )}
              {!submitting && (coinsAwarded !== null || submitError) && (
                <div className="text-[11px] text-white/60 leading-relaxed pt-1">
                  Дараагийн суниалт <span className="text-cyan-300 font-semibold">5 хоногийн</span> дараа нээгдэнэ
                </div>
              )}
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes fadeOut {
            0% { opacity: 1; }
            100% { opacity: 0; }
          }
        `}</style>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
