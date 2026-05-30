"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import TopBar from "@/components/TopBar";
import { AnimatedList, AnimatedItem } from "@/components/AnimatedList";
import { useUser } from "@/lib/swr";
import { toast } from "sonner";

interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  difficulty: string;
  expiresAt: string;
  lobbyId: string | null;
}

interface Submission {
  id: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  caption: string | null;
  vetoStatus: string;
  xpAwarded: number;
  approveCount: number;
  rejectCount: number;
  createdAt: string;
  user: { id: string; username: string; displayName: string; avatarUrl: string | null };
  votes: { verdict: string; voterId: string }[];
  _count: { votes: number };
}

export default function QuestDetailPage() {
  const params = useParams();
  const questId = params.questId as string;
  const fileRef = useRef<HTMLInputElement>(null);

  const [quest, setQuest] = useState<Quest | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"IMAGE" | "VIDEO" | null>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);
  const { user: currentUser } = useUser();
  const currentUserId = currentUser?.id || null;

  const loadSubmissions = useCallback(() => {
    fetch(`/api/submissions?questId=${questId}`)
      .then((r) => r.json())
      .then((d) => setSubmissions(d.submissions || []));
  }, [questId]);

  useEffect(() => {
    fetch(`/api/quests`)
      .then((r) => r.json())
      .then((d) => {
        const q = d.quests?.find((q: Quest) => q.id === questId);
        if (q) setQuest(q);
      });

    loadSubmissions();
  }, [questId, loadSubmissions]);

  const mySubmission = submissions.find((s) => s.user.id === currentUserId);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking same file
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) { toast.error("Зураг эсвэл видео сонгоно уу"); return; }

    const maxSize = isVideo ? 80 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(isVideo ? "Видео 80MB-аас бага байх ёстой" : "Зураг 10MB-аас бага байх ёстой");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPickedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setPreviewType(isVideo ? "VIDEO" : "IMAGE");
  }

  function clearPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPickedFile(null);
    setPreviewUrl(null);
    setPreviewType(null);
  }

  async function submitMedia() {
    if (!pickedFile) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", pickedFile);
      form.append("questId", questId);
      if (caption) form.append("caption", caption);

      const res = await fetch("/api/submissions", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Илгээж чадсангүй");
        return;
      }
      clearPreview();
      setCaption("");
      if (data.pending) {
        toast.success("Илгээлээ! Lobby гишүүд vote хийхийг хүлээж байна.");
      } else {
        toast.success(`Quest биелэгдлээ! +${data.submission.xpAwarded} XP`);
      }
      loadSubmissions();
    } catch {
      toast.error("Файл илгээхэд алдаа гарлаа");
    } finally {
      setUploading(false);
    }
  }

  async function handleVote(submissionId: string, verdict: "APPROVE" | "REJECT") {
    setVotingId(submissionId);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verdict }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Саналаа өгөхөд алдаа гарлаа");
        return;
      }
      toast.success(verdict === "APPROVE" ? "Зөвшөөрлөө!" : "Татгалзлаа!");
      loadSubmissions();
    } catch {
      toast.error("Сүлжээний алдаа гарлаа");
    } finally {
      setVotingId(null);
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

      <AnimatedList className="px-4 py-4 space-y-4 max-w-2xl mx-auto pb-24">
        <AnimatedItem>
          <div className="game-card p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-neon-purple/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <h2 className="font-display text-lg font-bold mb-2 relative">{quest.title}</h2>
            <p className="text-sm text-muted-foreground mb-4 relative">{quest.description}</p>
            <div className="flex items-center gap-2 relative">
              <span className="pill bg-neon-gold/10 text-neon-gold font-mono">⚡ {quest.xpReward}</span>
              <span className="pill bg-secondary text-muted-foreground">{quest.difficulty}</span>
              {quest.lobbyId && (
                <span className="pill bg-neon-purple/10 text-neon-purple">Lobby Quest</span>
              )}
            </div>
          </div>
        </AnimatedItem>

        {!mySubmission && (
          <AnimatedItem>
            <div className="game-card p-5 space-y-4">
              <h3 className="font-display text-sm font-semibold">Submit Proof</h3>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {previewUrl ? (
                <div className="space-y-3">
                  {previewType === "VIDEO" ? (
                    <video
                      src={previewUrl}
                      controls
                      playsInline
                      className="w-full rounded-xl border border-border bg-black max-h-[60vh]"
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full rounded-xl border border-border"
                    />
                  )}

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="pill bg-secondary">
                      {previewType === "VIDEO" ? "🎥 Видео" : "🖼️ Зураг"}
                    </span>
                    {pickedFile && (
                      <span>{(pickedFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                    )}
                  </div>

                  <input
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Caption бичих..."
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 transition-all placeholder:text-muted-foreground/50"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={submitMedia}
                      disabled={uploading}
                      className="btn-game flex-1 text-sm disabled:opacity-40"
                    >
                      {uploading ? "Хуулж байна..." : "Илгээх"}
                    </button>
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="btn-game-outline text-sm px-4"
                    >
                      🔄
                    </button>
                    <button
                      onClick={clearPreview}
                      disabled={uploading}
                      className="btn-game-outline text-sm px-4"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-2xl py-10 text-center hover:border-neon-purple/40 transition-all group"
                >
                  <div className="text-4xl mb-2">📸 🎥</div>
                  <div className="text-sm font-semibold text-foreground group-hover:text-neon-purple transition-colors">
                    Зураг эсвэл видео сонгох
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Галерейгаас сонгоно уу · Зураг ≤ 10MB · Видео ≤ 80MB
                  </div>
                </button>
              )}
            </div>
          </AnimatedItem>
        )}

        {mySubmission && (
          <AnimatedItem>
            <div className={`game-card p-4 ring-1 ${
              mySubmission.vetoStatus === "APPROVED" ? "ring-neon-green/30 glow-green" :
              mySubmission.vetoStatus === "REJECTED" ? "ring-destructive/30" :
              "ring-neon-gold/30"
            }`}>
              <div className="flex items-center gap-2">
                {mySubmission.vetoStatus === "APPROVED" && (
                  <>
                    <span className="text-neon-green font-semibold">Quest Complete!</span>
                    <span className="pill bg-neon-gold/10 text-neon-gold font-mono">+{mySubmission.xpAwarded} XP</span>
                  </>
                )}
                {mySubmission.vetoStatus === "PENDING" && (
                  <>
                    <span className="text-neon-gold font-semibold">Vote хүлээж байна...</span>
                    <span className="pill bg-neon-green/10 text-neon-green">{mySubmission.approveCount}</span>
                    <span className="pill bg-destructive/10 text-destructive">{mySubmission.rejectCount}</span>
                  </>
                )}
                {mySubmission.vetoStatus === "REJECTED" && (
                  <span className="text-destructive font-semibold">Rejected</span>
                )}
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
              {submissions.map((sub) => {
                const isMine = sub.user.id === currentUserId;
                const myVote = sub.votes.find((v) => v.voterId === currentUserId);
                const canVote = !isMine && sub.vetoStatus === "PENDING";

                return (
                  <div key={sub.id} className="game-card p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-neon-purple/15 flex items-center justify-center text-[10px] font-bold text-neon-purple">
                        {sub.user.displayName[0]}
                      </div>
                      <span className="text-sm font-medium">{sub.user.displayName}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(sub.createdAt).toLocaleTimeString()}
                      </span>
                      {/* Status badge */}
                      {sub.vetoStatus === "PENDING" && (
                        <span className="pill bg-neon-gold/10 text-neon-gold ml-auto">Pending</span>
                      )}
                      {sub.vetoStatus === "APPROVED" && (
                        <span className="pill bg-neon-green/10 text-neon-green ml-auto">Approved</span>
                      )}
                      {sub.vetoStatus === "REJECTED" && (
                        <span className="pill bg-destructive/10 text-destructive ml-auto">Rejected</span>
                      )}
                    </div>
                    {sub.mediaType === "VIDEO" ? (
                      <video
                        src={sub.mediaUrl}
                        controls
                        playsInline
                        className="w-full rounded-xl bg-black"
                      />
                    ) : (
                      <img src={sub.mediaUrl} alt="" className="w-full rounded-xl" />
                    )}
                    {sub.caption && (
                      <p className="text-sm text-muted-foreground mt-2">{sub.caption}</p>
                    )}

                    {/* Vote counts */}
                    {sub.vetoStatus === "PENDING" && (
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="text-neon-green font-mono">{sub.approveCount}</span> approve
                          <span className="mx-1">·</span>
                          <span className="text-destructive font-mono">{sub.rejectCount}</span> reject
                        </div>
                      </div>
                    )}

                    {/* Vote buttons — can change vote */}
                    {canVote && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleVote(sub.id, "APPROVE")}
                          disabled={votingId === sub.id || myVote?.verdict === "APPROVE"}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                            myVote?.verdict === "APPROVE"
                              ? "bg-neon-green/25 text-neon-green ring-1 ring-neon-green/40"
                              : "bg-neon-green/10 text-neon-green hover:bg-neon-green/20"
                          }`}
                        >
                          {myVote?.verdict === "APPROVE" ? "Approved" : "Approve"}
                        </button>
                        <button
                          onClick={() => handleVote(sub.id, "REJECT")}
                          disabled={votingId === sub.id || myVote?.verdict === "REJECT"}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                            myVote?.verdict === "REJECT"
                              ? "bg-destructive/25 text-destructive ring-1 ring-destructive/40"
                              : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                          }`}
                        >
                          {myVote?.verdict === "REJECT" ? "Rejected" : "Reject"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </AnimatedItem>
        )}
      </AnimatedList>
    </>
  );
}
