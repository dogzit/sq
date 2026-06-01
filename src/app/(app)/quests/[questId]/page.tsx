"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import TopBar from "@/components/TopBar";
import { AnimatedList, AnimatedItem } from "@/components/AnimatedList";
import { useUser } from "@/lib/swr";
import { toast } from "sonner";

const MAX_PHOTOS = 10; // including the primary one

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
  extraMediaUrls: string[];
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

interface PickedItem {
  id: string;
  file: File;
  previewUrl: string;
  type: "IMAGE" | "VIDEO";
}

export default function QuestDetailPage() {
  const params = useParams();
  const questId = params.questId as string;
  const fileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  const [quest, setQuest] = useState<Quest | null>(null);
  const [questLoading, setQuestLoading] = useState(true);
  const [questError, setQuestError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [picked, setPicked] = useState<PickedItem[]>([]);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editCaption, setEditCaption] = useState("");
  const [editUrls, setEditUrls] = useState<string[]>([]); // existing kept URLs
  const [editPicked, setEditPicked] = useState<PickedItem[]>([]); // new files to add
  const [editSaving, setEditSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user: currentUser } = useUser();
  const currentUserId = currentUser?.id || null;

  const loadSubmissions = useCallback(() => {
    fetch(`/api/submissions?questId=${questId}`)
      .then((r) => r.json())
      .then((d) => setSubmissions(d.submissions || []));
  }, [questId]);

  useEffect(() => {
    setQuestLoading(true);
    setQuestError(null);
    fetch(`/api/quests/${questId}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) {
          setQuestError(d.error || "Quest олдсонгүй");
          setQuest(null);
          return;
        }
        setQuest(d.quest || null);
      })
      .catch(() => setQuestError("Сүлжээний алдаа"))
      .finally(() => setQuestLoading(false));

    loadSubmissions();
  }, [questId, loadSubmissions]);

  const mySubmission = submissions.find((s) => s.user.id === currentUserId);

  function validateFile(file: File): { type: "IMAGE" | "VIDEO" } | null {
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) { toast.error("Зураг эсвэл видео сонгоно уу"); return null; }
    const maxSize = isVideo ? 80 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(isVideo ? "Видео 80MB-аас бага байх ёстой" : "Зураг 10MB-аас бага байх ёстой");
      return null;
    }
    return { type: isVideo ? "VIDEO" : "IMAGE" };
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    const newItems: PickedItem[] = [];
    const currentHasVideo = picked.some((p) => p.type === "VIDEO");
    let hasVideoInNew = false;

    for (const file of files) {
      const v = validateFile(file);
      if (!v) continue;
      if (v.type === "VIDEO") hasVideoInNew = true;
      newItems.push({
        id: `${Date.now()}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        type: v.type,
      });
    }
    if (newItems.length === 0) return;

    // Video can't mix with images and only one video allowed
    if (hasVideoInNew || currentHasVideo) {
      // Reset to a single video — videos are single-file only
      picked.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      const onlyVideo = newItems.find((i) => i.type === "VIDEO") || newItems[0];
      if (onlyVideo.type !== "VIDEO") {
        // Current had video, new are images — replace with new images, drop video
        setPicked(newItems.slice(0, MAX_PHOTOS));
      } else {
        setPicked([onlyVideo]);
      }
      return;
    }

    const merged = [...picked, ...newItems].slice(0, MAX_PHOTOS);
    if (picked.length + newItems.length > MAX_PHOTOS) {
      toast.error(`Хамгийн ихдээ ${MAX_PHOTOS} зураг`);
    }
    setPicked(merged);
  }

  function removePicked(id: string) {
    const item = picked.find((p) => p.id === id);
    if (item) URL.revokeObjectURL(item.previewUrl);
    setPicked(picked.filter((p) => p.id !== id));
  }

  function clearPreview() {
    picked.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPicked([]);
  }

  async function uploadToCloudinary(file: File): Promise<{ url: string; type: "IMAGE" | "VIDEO" }> {
    const isVideo = file.type.startsWith("video/");
    const resourceType: "image" | "video" = isVideo ? "video" : "image";

    const signRes = await fetch("/api/cloudinary/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: "sidequest/submissions", resourceType }),
    });
    const signData = await signRes.json();
    if (!signRes.ok) throw new Error(signData.error || "Cloudinary signature авч чадсангүй");

    const cloudForm = new FormData();
    cloudForm.append("file", file);
    cloudForm.append("api_key", signData.apiKey);
    cloudForm.append("timestamp", String(signData.timestamp));
    cloudForm.append("signature", signData.signature);
    cloudForm.append("folder", signData.folder);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${signData.cloudName}/${resourceType}/upload`,
      { method: "POST", body: cloudForm }
    );
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok || !uploadData.secure_url) {
      throw new Error(uploadData.error?.message || "Cloudinary upload амжилтгүй");
    }
    return { url: uploadData.secure_url, type: isVideo ? "VIDEO" : "IMAGE" };
  }

  async function submitMedia() {
    if (picked.length === 0) return;
    setUploading(true);
    try {
      const uploaded: { url: string; type: "IMAGE" | "VIDEO" }[] = [];
      for (const item of picked) {
        const u = await uploadToCloudinary(item.file);
        uploaded.push(u);
      }
      const primary = uploaded[0];
      const extras = uploaded.slice(1).map((u) => u.url);

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaUrl: primary.url,
          extraMediaUrls: extras,
          mediaType: primary.type,
          questId,
          caption: caption || null,
        }),
      });
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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Файл илгээхэд алдаа гарлаа");
    } finally {
      setUploading(false);
    }
  }

  function startEditing() {
    if (!mySubmission) return;
    setEditCaption(mySubmission.caption || "");
    setEditUrls([mySubmission.mediaUrl, ...(mySubmission.extraMediaUrls ?? [])]);
    setEditPicked([]);
    setEditing(true);
  }

  function cancelEditing() {
    editPicked.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setEditPicked([]);
    setEditUrls([]);
    setEditCaption("");
    setEditing(false);
  }

  function handleEditFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    if (mySubmission?.mediaType === "VIDEO") {
      toast.error("Видео submission-д зураг нэмэх боломжгүй");
      return;
    }

    const newItems: PickedItem[] = [];
    for (const file of files) {
      const v = validateFile(file);
      if (!v) continue;
      if (v.type === "VIDEO") {
        toast.error("Засварлахдаа зөвхөн зураг нэмж болно");
        continue;
      }
      newItems.push({
        id: `${Date.now()}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        type: v.type,
      });
    }
    const totalAfter = editUrls.length + editPicked.length + newItems.length;
    if (totalAfter > MAX_PHOTOS) {
      toast.error(`Хамгийн ихдээ ${MAX_PHOTOS} зураг`);
    }
    const allowed = Math.max(0, MAX_PHOTOS - editUrls.length - editPicked.length);
    setEditPicked([...editPicked, ...newItems.slice(0, allowed)]);
  }

  function removeEditUrl(url: string) {
    if (editUrls.length === 1 && editPicked.length === 0) {
      toast.error("Хамгийн багадаа нэг зураг үлдээх ёстой");
      return;
    }
    setEditUrls(editUrls.filter((u) => u !== url));
  }

  function removeEditPicked(id: string) {
    const item = editPicked.find((p) => p.id === id);
    if (item) URL.revokeObjectURL(item.previewUrl);
    setEditPicked(editPicked.filter((p) => p.id !== id));
  }

  async function saveEdit() {
    if (!mySubmission) return;
    if (editUrls.length === 0 && editPicked.length === 0) {
      toast.error("Хамгийн багадаа нэг зураг шаардлагатай");
      return;
    }
    setEditSaving(true);
    try {
      const newlyUploaded: string[] = [];
      for (const item of editPicked) {
        const u = await uploadToCloudinary(item.file);
        newlyUploaded.push(u.url);
      }
      const allUrls = [...editUrls, ...newlyUploaded];
      const [primary, ...extras] = allUrls;

      const res = await fetch(`/api/submissions/${mySubmission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaUrl: primary,
          extraMediaUrls: extras,
          caption: editCaption || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Засварлаж чадсангүй");
        return;
      }
      toast.success(data.mediaChanged ? "Засварлалаа — vote дахин эхэллээ" : "Засварлалаа");
      cancelEditing();
      loadSubmissions();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Засварлахад алдаа гарлаа");
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteSubmission() {
    if (!mySubmission) return;
    if (!confirm("Submission-аа устгахдаа итгэлтэй байна уу?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/submissions/${mySubmission.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Устгаж чадсангүй");
        return;
      }
      toast.success("Устгалаа");
      loadSubmissions();
    } catch {
      toast.error("Устгахад алдаа гарлаа");
    } finally {
      setDeleting(false);
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

  if (questLoading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-muted-foreground animate-pulse font-display">Loading...</div>
      </div>
    );
  }

  if (!quest) {
    return (
      <>
        <TopBar title="Quest" showBack />
        <div className="px-4 py-10 max-w-2xl mx-auto">
          <div className="game-card p-6 text-center space-y-2">
            <div className="text-4xl">🫥</div>
            <div className="font-display text-base font-semibold">Quest олдсонгүй</div>
            <div className="text-sm text-muted-foreground">
              {questError || "Энэ quest устсан эсвэл хандах эрхгүй байна."}
            </div>
          </div>
        </div>
      </>
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
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              {picked.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {picked.map((p) => (
                      <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden border border-border bg-black">
                        {p.type === "VIDEO" ? (
                          <video src={p.previewUrl} className="w-full h-full object-cover" muted playsInline />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                        )}
                        <button
                          onClick={() => removePicked(p.id)}
                          disabled={uploading}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center hover:bg-destructive transition-colors"
                          aria-label="Устгах"
                        >
                          ✕
                        </button>
                        {p.type === "VIDEO" && (
                          <span className="absolute bottom-1 left-1 pill bg-black/70 text-white text-[10px]">🎥</span>
                        )}
                      </div>
                    ))}
                    {picked[0]?.type !== "VIDEO" && picked.length < MAX_PHOTOS && (
                      <button
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-neon-purple/40 flex items-center justify-center text-2xl text-muted-foreground hover:text-neon-purple transition-colors"
                        aria-label="Зураг нэмэх"
                      >
                        ＋
                      </button>
                    )}
                  </div>

                  <div className="text-[11px] text-muted-foreground">
                    {picked.length} / {MAX_PHOTOS} {picked[0]?.type === "VIDEO" ? "видео" : "зураг"}
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
                    Олон зураг сонгож болно · Зураг ≤ 10MB · Видео ≤ 80MB
                  </div>
                </button>
              )}
            </div>
          </AnimatedItem>
        )}

        {mySubmission && !editing && (
          <AnimatedItem>
            <div className={`game-card p-4 ring-1 ${
              mySubmission.vetoStatus === "APPROVED" ? "ring-neon-green/30 glow-green" :
              mySubmission.vetoStatus === "REJECTED" ? "ring-destructive/30" :
              "ring-neon-gold/30"
            }`}>
              <div className="flex items-center gap-2 flex-wrap">
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
                {mySubmission.vetoStatus === "PENDING" && (
                  <div className="ml-auto flex gap-2">
                    <button
                      onClick={startEditing}
                      className="pill bg-neon-purple/15 text-neon-purple hover:bg-neon-purple/25 transition-colors"
                    >
                      ✎ Засах
                    </button>
                    <button
                      onClick={deleteSubmission}
                      disabled={deleting}
                      className="pill bg-destructive/15 text-destructive hover:bg-destructive/25 transition-colors disabled:opacity-40"
                    >
                      {deleting ? "..." : "🗑 Устгах"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </AnimatedItem>
        )}

        {mySubmission && editing && (
          <AnimatedItem>
            <div className="game-card p-5 space-y-4 ring-1 ring-neon-purple/30">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold">Submission засах</h3>
                <span className="text-[11px] text-muted-foreground">Media өөрчилбөл vote дахин эхэлнэ</span>
              </div>

              <input
                ref={editFileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleEditFileSelect}
                className="hidden"
              />

              <div className="grid grid-cols-3 gap-2">
                {editUrls.map((url) => (
                  <div key={url} className="relative aspect-square rounded-xl overflow-hidden border border-border bg-black">
                    {mySubmission.mediaType === "VIDEO" && url === mySubmission.mediaUrl ? (
                      <video src={url} className="w-full h-full object-cover" muted playsInline />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    )}
                    <button
                      onClick={() => removeEditUrl(url)}
                      disabled={editSaving}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center hover:bg-destructive transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {editPicked.map((p) => (
                  <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden border border-neon-purple/40 bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 pill bg-neon-purple/80 text-white text-[10px]">шинэ</span>
                    <button
                      onClick={() => removeEditPicked(p.id)}
                      disabled={editSaving}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center hover:bg-destructive transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {mySubmission.mediaType !== "VIDEO" &&
                  editUrls.length + editPicked.length < MAX_PHOTOS && (
                    <button
                      onClick={() => editFileRef.current?.click()}
                      disabled={editSaving}
                      className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-neon-purple/40 flex items-center justify-center text-2xl text-muted-foreground hover:text-neon-purple transition-colors"
                    >
                      ＋
                    </button>
                  )}
              </div>

              <input
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                placeholder="Caption..."
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 transition-all placeholder:text-muted-foreground/50"
              />

              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  disabled={editSaving}
                  className="btn-game flex-1 text-sm disabled:opacity-40"
                >
                  {editSaving ? "Хадгалж байна..." : "Хадгалах"}
                </button>
                <button
                  onClick={cancelEditing}
                  disabled={editSaving}
                  className="btn-game-outline text-sm px-4"
                >
                  Болих
                </button>
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
                const canVote = !isMine;
                const allUrls = [sub.mediaUrl, ...(sub.extraMediaUrls ?? [])];

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
                    ) : allUrls.length === 1 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sub.mediaUrl} alt="" className="w-full rounded-xl" />
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        {allUrls.map((url, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={url}
                            src={url}
                            alt=""
                            className={`w-full rounded-xl object-cover ${
                              allUrls.length === 3 && i === 0 ? "col-span-2 aspect-video" : "aspect-square"
                            }`}
                          />
                        ))}
                      </div>
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
