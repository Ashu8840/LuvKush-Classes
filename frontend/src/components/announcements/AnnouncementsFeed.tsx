"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Heart, MessageCircle, Trash2, Plus, BarChart3, ImageIcon, Type,
  Send, X, Megaphone,
} from "lucide-react";
import { toast } from "sonner";
import { api, Announcement, UserRole } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/contexts/AuthContext";

function Avatar({ name, url, size = "md" }: { name: string; url?: string; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className={`${dim} flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-default bg-primary-light font-bold text-primary`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

type PostType = "text" | "image" | "poll";

export function AnnouncementsFeed({ canPost, role }: { canPost: boolean; role: UserRole }) {
  const canDelete = role === "admin";
  const { user } = useAuth();
  const [posts, setPosts] = useState<Announcement[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [postType, setPostType] = useState<PostType>("text");
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = (p = 1) => {
    setLoading(true);
    api
      .getAnnouncements(p)
      .then((data) => {
        setPosts(data.announcements);
        setPage(data.pagination.page);
        setPages(data.pagination.pages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.uploadAnnouncementImage(file);
      setImageUrl(url);
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const resetForm = () => {
    setCaption("");
    setImageUrl("");
    setPollOptions(["", ""]);
    setPostType("text");
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createAnnouncement({
        type: postType,
        caption,
        imageUrl: postType === "image" ? imageUrl : undefined,
        pollOptions: postType === "poll" ? pollOptions.filter((o) => o.trim()).map((text) => ({ text })) : undefined,
      });
      setShowCreate(false);
      resetForm();
      load(1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async (post: Announcement) => {
    try {
      const res = await api.likeAnnouncement(post._id);
      setPosts((prev) =>
        prev.map((p) =>
          p._id === post._id
            ? { ...p, likedByMe: res.liked, likeCount: res.likeCount }
            : p
        )
      );
    } catch { /* ignore */ }
  };

  const vote = async (post: Announcement, optionIndex: number) => {
    try {
      const updated = await api.voteAnnouncementPoll(post._id, optionIndex);
      setPosts((prev) => prev.map((p) => (p._id === post._id ? updated : p)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Vote failed");
    }
  };

  const submitComment = async (postId: string) => {
    const text = commentDrafts[postId]?.trim();
    if (!text) return;
    try {
      const res = await api.commentOnAnnouncement(postId, text);
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, comments: [...p.comments, res.comment], commentCount: res.commentCount }
            : p
        )
      );
      setCommentDrafts((d) => ({ ...d, [postId]: "" }));
      setExpandedComments((e) => ({ ...e, [postId]: true }));
    } catch { /* ignore */ }
  };

  const removeComment = async (postId: string, commentId: string) => {
    try {
      const res = await api.deleteAnnouncementComment(postId, commentId);
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? {
                ...p,
                comments: p.comments.filter((c) => c._id !== commentId),
                commentCount: res.commentCount,
              }
            : p
        )
      );
    } catch { /* ignore */ }
  };

  const removePost = async (id: string) => {
    try {
      await api.deleteAnnouncement(id);
      setPosts((prev) => prev.filter((p) => p._id !== id));
      toast.success("Announcement removed");
    } catch {
      toast.error("Failed to remove announcement");
    }
  };

  const totalPollVotes = (post: Announcement) =>
    post.pollOptions?.reduce((sum, o) => sum + o.voteCount, 0) || 0;

  return (
    <div className="mx-auto max-w-[27rem] space-y-5">
      {canPost && (
        <button
          onClick={() => setShowCreate(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-default bg-card py-3 text-sm font-medium text-accent transition hover:bg-primary-light"
        >
          <Plus className="h-4 w-4" />
          New Announcement
        </button>
      )}

      {loading ? (
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card className="py-10 text-center">
          <Megaphone className="mx-auto h-8 w-8 text-muted opacity-40" />
          <p className="mt-3 text-sm text-muted">No announcements yet</p>
          {canPost && <p className="mt-1 text-xs text-muted">Post the first update for students and teachers</p>}
        </Card>
      ) : (
        posts.map((post) => (
          <Card key={post._id} className="overflow-hidden p-0 shadow-sm">
            <div className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                <Avatar name={post.author.name} url={post.author.avatar} size="md" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{post.author.name}</p>
                  <p className="text-xs text-muted">{formatDateTime(post.createdAt)}</p>
                </div>
              </div>
              {canDelete && (
                <button onClick={() => setDeletePostId(post._id)} className="rounded-md p-1.5 text-danger hover:bg-danger-light">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {post.type === "image" && post.imageUrl && (
              <div className="aspect-square w-full overflow-hidden bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.imageUrl} alt="" className="h-full w-full object-cover" />
              </div>
            )}

            {post.type === "text" && post.caption && (
              <div className="px-4 py-2.5">
                <p className="line-clamp-6 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{post.caption}</p>
              </div>
            )}

            {post.type === "poll" && (
              <div className="space-y-2 px-4 py-2.5">
                {post.caption && <p className="mb-2 text-sm font-medium text-foreground">{post.caption}</p>}
                {post.pollOptions?.map((opt, idx) => {
                  const total = totalPollVotes(post);
                  const pct = total > 0 ? Math.round((opt.voteCount / total) * 100) : 0;
                  const voted = post.myPollVoteIndex >= 0;
                  return (
                    <button
                      key={opt._id}
                      onClick={() => vote(post, idx)}
                      className={`relative w-full overflow-hidden rounded-lg border px-3.5 py-2.5 text-left transition ${
                        opt.votedByMe ? "border-accent bg-primary-light" : "border-default hover:bg-surface"
                      }`}
                    >
                      {voted && (
                        <div
                          className="absolute inset-y-0 left-0 bg-primary/15 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      )}
                      <div className="relative flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">{opt.text}</span>
                        {voted && <span className="text-xs text-muted">{pct}% · {opt.voteCount}</span>}
                      </div>
                    </button>
                  );
                })}
                <p className="text-xs text-muted">{totalPollVotes(post)} votes</p>
              </div>
            )}

            {post.type === "image" && post.caption && (
              <div className="px-4 pb-2.5">
                <p className="line-clamp-3 text-sm text-foreground">
                  <span className="font-semibold">{post.author.name}</span>{" "}
                  {post.caption}
                </p>
              </div>
            )}

            <div className="flex items-center gap-4 border-t border-default/60 px-4 py-2.5">
              <button
                onClick={() => toggleLike(post)}
                className={`flex items-center gap-1.5 text-sm font-medium transition ${
                  post.likedByMe ? "text-danger" : "text-muted hover:text-danger"
                }`}
              >
                <Heart className={`h-5 w-5 ${post.likedByMe ? "fill-current" : ""}`} />
                {post.likeCount > 0 && post.likeCount}
              </button>
              <button
                onClick={() => setExpandedComments((e) => ({ ...e, [post._id]: !e[post._id] }))}
                className="flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-foreground"
              >
                <MessageCircle className="h-5 w-5" />
                {post.commentCount > 0 && post.commentCount}
              </button>
            </div>

            {expandedComments[post._id] && (
              <div className="border-t border-default px-4 py-2.5">
                <div className="mb-2.5 max-h-44 space-y-2.5 overflow-y-auto">
                  {post.comments.length === 0 ? (
                    <p className="text-sm text-muted">No comments yet</p>
                  ) : (
                    post.comments.map((c) => {
                      const canDelete =
                        c.user._id === user?.id || user?.role === "admin";
                      return (
                        <div key={c._id} className="flex gap-2.5">
                          <Avatar name={c.user.name} url={c.user.avatar} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground">{c.user.name}</p>
                            <p className="text-sm text-foreground">{c.text}</p>
                          </div>
                          {canDelete && (
                            <button
                              onClick={() => removeComment(post._id, c._id)}
                              className="shrink-0 text-muted hover:text-danger"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    value={commentDrafts[post._id] || ""}
                    onChange={(e) => setCommentDrafts((d) => ({ ...d, [post._id]: e.target.value }))}
                    placeholder="Add a comment…"
                    className="flex-1 rounded-lg border border-default bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                    onKeyDown={(e) => e.key === "Enter" && submitComment(post._id)}
                  />
                  <button
                    onClick={() => submitComment(post._id)}
                    className="rounded-lg bg-primary px-3 py-2 text-primary-foreground"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </Card>
        ))
      )}

      {pages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => load(page - 1)}
            className="rounded-xl border border-default px-4 py-2 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="flex items-center text-sm text-muted">
            Page {page} of {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => load(page + 1)}
            className="rounded-xl border border-default px-4 py-2 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      <Modal open={showCreate} onClose={() => { setShowCreate(false); resetForm(); }} title="New Announcement">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex gap-2">
            {(["text", "image", "poll"] as PostType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setPostType(t)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium capitalize transition ${
                  postType === t ? "border-accent bg-primary-light text-accent" : "border-default text-muted"
                }`}
              >
                {t === "text" && <Type className="h-4 w-4" />}
                {t === "image" && <ImageIcon className="h-4 w-4" />}
                {t === "poll" && <BarChart3 className="h-4 w-4" />}
                {t}
              </button>
            ))}
          </div>

          {postType === "image" && (
            <div className="space-y-3">
              {imageUrl ? (
                <div className="relative aspect-square overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-default py-10 text-sm text-muted"
                >
                  <ImageIcon className="h-8 w-8" />
                  {uploading ? "Uploading…" : "Upload photo"}
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <Input
                label="Caption"
                name="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>
          )}

          {postType === "text" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Message</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                required
                rows={5}
                className="w-full rounded-xl border border-default bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
                placeholder="Write your announcement…"
              />
            </div>
          )}

          {postType === "poll" && (
            <div className="space-y-3">
              <Input label="Poll question" name="pollQ" value={caption} onChange={(e) => setCaption(e.target.value)} />
              {pollOptions.map((opt, i) => (
                <Input
                  key={i}
                  label={`Option ${i + 1}`}
                  name={`opt${i}`}
                  value={opt}
                  onChange={(e) => {
                    const next = [...pollOptions];
                    next[i] = e.target.value;
                    setPollOptions(next);
                  }}
                />
              ))}
              {pollOptions.length < 4 && (
                <button
                  type="button"
                  onClick={() => setPollOptions([...pollOptions, ""])}
                  className="text-sm text-accent hover:underline"
                >
                  + Add option
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || (postType === "image" && !imageUrl)}
            className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Posting…" : "Post Announcement"}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deletePostId}
        title="Remove announcement?"
        message="This post will be permanently removed for all students and teachers."
        confirmLabel="Remove"
        variant="danger"
        onConfirm={() => { if (deletePostId) removePost(deletePostId); }}
        onClose={() => setDeletePostId(null)}
      />
    </div>
  );
}