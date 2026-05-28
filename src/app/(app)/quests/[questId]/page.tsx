"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import TopBar from "@/components/TopBar";

interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  difficulty: string;
  expiresAt: string;
}

interface Submission {
  id: string;
  photoUrl: string;
  caption: string | null;
  verified: boolean;
  xpAwarded: number;
  createdAt: string;
  user: { id: string; username: string; displayName: string };
}

export default function QuestDetailPage() {
  const params = useParams();
  const questId = params.questId as string;
  const fileRef = useRef<HTMLInputElement>(null);

  const [quest, setQuest] = useState<Quest | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/quests`)
      .then((r) => r.json())
      .then((d) => {
        const q = d.quests?.find((q: Quest) => q.id === questId);
        if (q) setQuest(q);
      });

    fetch(`/api/submissions?questId=${questId}`)
      .then((r) => r.json())
      .then((d) => {
        setSubmissions(d.submissions || []);
      });
  }, [questId]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function submitPhoto() {
    if (!preview) return;
    setUploading(true);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId, photo: preview, caption }),
      });

      const data = await res.json();
      if (data.submission) {
        setMySubmission(data.submission);
        setPreview(null);
        setCaption("");
        // Refresh submissions
        const subRes = await fetch(`/api/submissions?questId=${questId}`);
        const subData = await subRes.json();
        setSubmissions(subData.submissions || []);
      }
    } catch {
      // handle error
    } finally {
      setUploading(false);
    }
  }

  if (!quest) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-[var(--neon-cyan)] animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <TopBar title="Quest" showBack />

      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        {/* Quest Info */}
        <div className="card-cyber p-5">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">{quest.title}</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">{quest.description}</p>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-[var(--neon-green)] font-bold">+{quest.xpReward} XP</span>
            <span className="text-[var(--neon-cyan)]">{quest.difficulty}</span>
            <span className="text-[var(--text-secondary)]">
              Expires {new Date(quest.expiresAt).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Submit Photo */}
        {!mySubmission && (
          <div className="card-cyber p-5 space-y-4">
            <h3 className="text-sm font-bold text-[var(--neon-magenta)] uppercase tracking-wider">
              Submit Proof
            </h3>

            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />

            {preview ? (
              <div className="space-y-3">
                <img src={preview} alt="Preview" className="w-full rounded-lg border border-[rgba(0,240,255,0.2)]" />
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  className="w-full bg-[var(--bg-primary)] border border-[rgba(0,240,255,0.2)] rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--neon-cyan)] transition-all"
                />
                <div className="flex gap-2">
                  <button onClick={submitPhoto} disabled={uploading} className="btn-neon flex-1 text-sm disabled:opacity-50">
                    {uploading ? "Uploading..." : "Submit ✓"}
                  </button>
                  <button onClick={() => setPreview(null)} className="text-[var(--text-secondary)] text-sm px-4">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-[rgba(0,240,255,0.2)] rounded-lg py-8 text-center hover:border-[var(--neon-cyan)] transition-all"
              >
                <div className="text-3xl mb-2">📸</div>
                <div className="text-sm text-[var(--text-secondary)]">Tap to take a photo</div>
              </button>
            )}
          </div>
        )}

        {mySubmission && (
          <div className="card-cyber p-4 neon-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[var(--neon-green)] neon-glow-green font-bold">✓ Quest Complete!</span>
              <span className="text-xs text-[var(--text-secondary)]">+{mySubmission.xpAwarded} XP</span>
            </div>
          </div>
        )}

        {/* Submissions Feed */}
        {submissions.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-3">
              Submissions ({submissions.length})
            </h3>
            <div className="space-y-3">
              {submissions.map((sub) => (
                <div key={sub.id} className="card-cyber p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-[var(--neon-cyan)]/20 flex items-center justify-center text-[10px] font-bold text-[var(--neon-cyan)]">
                      {sub.user.displayName[0]}
                    </div>
                    <span className="text-sm font-semibold">{sub.user.displayName}</span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {new Date(sub.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <img src={sub.photoUrl} alt="" className="w-full rounded-lg" />
                  {sub.caption && (
                    <p className="text-sm text-[var(--text-secondary)] mt-2">{sub.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
