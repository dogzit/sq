"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import TopBar from "@/components/TopBar";
import { AnimatedList, AnimatedItem, FadeIn } from "@/components/AnimatedList";
import { toast } from "sonner";

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
      .then((d) => setSubmissions(d.submissions || []));
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
        toast.success(`Quest complete! +${data.submission.xpAwarded} XP`);
        const subRes = await fetch(`/api/submissions?questId=${questId}`);
        const subData = await subRes.json();
        setSubmissions(subData.submissions || []);
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (!quest) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-muted-foreground animate-pulse font-display">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <TopBar title="Quest" showBack />

      <AnimatedList className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
        <AnimatedItem>
          <div className="game-card p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-neon-purple/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <h2 className="font-display text-lg font-bold mb-2 relative">{quest.title}</h2>
            <p className="text-sm text-muted-foreground mb-4 relative">{quest.description}</p>
            <div className="flex items-center gap-2 relative">
              <span className="pill bg-neon-gold/10 text-neon-gold font-mono">⚡ {quest.xpReward}</span>
              <span className="pill bg-secondary text-muted-foreground">{quest.difficulty}</span>
              <span className="pill bg-secondary text-muted-foreground">
                {new Date(quest.expiresAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </AnimatedItem>

        {!mySubmission && (
          <AnimatedItem>
            <div className="game-card p-5 space-y-4">
              <h3 className="font-display text-sm font-semibold">Submit Proof</h3>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />

              {preview ? (
                <div className="space-y-3">
                  <img src={preview} alt="Preview" className="w-full rounded-xl border border-border" />
                  <input
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption..."
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 transition-all placeholder:text-muted-foreground/50"
                  />
                  <div className="flex gap-2">
                    <button onClick={submitPhoto} disabled={uploading} className="btn-game flex-1 text-sm">
                      {uploading ? "Uploading..." : "Submit"}
                    </button>
                    <button onClick={() => setPreview(null)} className="btn-game-outline text-sm px-4">Cancel</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-2xl py-10 text-center hover:border-neon-purple/40 transition-all group"
                >
                  <div className="text-4xl mb-2">📸</div>
                  <div className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Tap to take a photo</div>
                </button>
              )}
            </div>
          </AnimatedItem>
        )}

        {mySubmission && (
          <AnimatedItem>
            <div className="game-card p-4 ring-1 ring-neon-green/30 glow-green">
              <div className="flex items-center gap-2">
                <span className="text-neon-green font-semibold">Quest Complete!</span>
                <span className="pill bg-neon-gold/10 text-neon-gold font-mono">+{mySubmission.xpAwarded} XP</span>
              </div>
            </div>
          </AnimatedItem>
        )}

        {submissions.length > 0 && (
          <AnimatedItem>
            <h3 className="font-display text-sm font-semibold mb-3">
              Submissions ({submissions.length})
            </h3>
            <div className="space-y-3">
              {submissions.map((sub) => (
                <div key={sub.id} className="game-card p-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-neon-purple/15 flex items-center justify-center text-[10px] font-bold text-neon-purple">
                      {sub.user.displayName[0]}
                    </div>
                    <span className="text-sm font-medium">{sub.user.displayName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(sub.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <img src={sub.photoUrl} alt="" className="w-full rounded-xl" />
                  {sub.caption && (
                    <p className="text-sm text-muted-foreground mt-2">{sub.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </AnimatedItem>
        )}
      </AnimatedList>
    </>
  );
}
