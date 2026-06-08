"use client";

import { useEffect, useRef, useState } from "react";
import { Hand, MessageSquare, Mic, MicOff, PhoneOff, Users, UserCheck, UserX, Ban } from "lucide-react";
import { toast } from "sonner";
import { api, LiveClassSession } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime } from "@/lib/utils";
import { useKeyboardInset } from "@/hooks/useKeyboardInset";

type Props = {
  classId: string;
  isTeacher: boolean;
  onEnd?: () => void;
};

export function LiveClassRoom({ classId, isTeacher, onEnd }: Props) {
  const { user } = useAuth();
  const [session, setSession] = useState<LiveClassSession | null>(null);
  const [chatText, setChatText] = useState("");
  const [tab, setTab] = useState<"chat" | "people">("people");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatComposerRef = useRef<HTMLDivElement>(null);
  const { inset: keyboardInset, scrollIntoView } = useKeyboardInset();

  const refresh = async () => {
    try {
      const data = await api.getLiveClass(classId);
      setSession(data);
      return data;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    api.requestJoinLiveClass(classId).catch(() => {});
    refresh();
    const interval = setInterval(refresh, 2500);
    return () => clearInterval(interval);
  }, [classId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.chatMessages?.length]);

  if (!session || !user) {
    return <div className="rounded-2xl border border-default bg-card p-8 text-center text-muted">Loading class room...</div>;
  }

  const myParticipant = session.sessionParticipants.find((p) => p.user._id === user.id);
  const isAdmitted = isTeacher || myParticipant?.status === "admitted";
  const isWaiting = !isTeacher && myParticipant?.status === "waiting";
  const isKicked = myParticipant?.status === "kicked";

  const waiting = session.sessionParticipants.filter((p) => p.status === "waiting");
  const admitted = session.sessionParticipants.filter((p) => p.status === "admitted");

  const sendChat = async () => {
    if (!chatText.trim()) return;
    try {
      await api.sendLiveClassChat(classId, chatText.trim());
      setChatText("");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    }
  };

  const jitsiUrl = `https://meet.jit.si/${session.roomId}#userInfo.displayName="${encodeURIComponent(user.name)}"&config.startWithAudioMuted=${isTeacher ? "false" : "true"}&config.startWithVideoMuted=false`;

  if (isKicked) {
    return (
      <div className="rounded-2xl border border-danger bg-danger-light p-8 text-center">
        <p className="font-semibold text-danger">You were removed from this class</p>
      </div>
    );
  }

  if (isWaiting) {
    return (
      <div className="rounded-2xl border border-default bg-card p-8 text-center space-y-3">
        <Users className="mx-auto h-12 w-12 text-muted" />
        <h3 className="text-lg font-semibold">Waiting for teacher to admit you</h3>
        <p className="text-sm text-muted">{session.title} · {formatDateTime(session.scheduledAt)}</p>
        <p className="text-xs text-muted animate-pulse">Please wait...</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-default bg-card p-4">
          <div>
            <div className="flex items-center gap-2">
              {session.status === "live" && <span className="h-2 w-2 animate-pulse rounded-full bg-danger" />}
              <h3 className="font-semibold">{session.title}</h3>
              <span className="badge-primary rounded-full px-2 py-0.5 text-xs capitalize">{session.status}</span>
            </div>
            <p className="text-xs text-muted">{session.batch?.name || "All batches"} · Room: {session.roomId}</p>
          </div>
          {isTeacher && session.status === "live" && (
            <button
              onClick={async () => {
                await api.endLiveClass(classId);
                onEnd?.();
                toast.success("Class ended");
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-danger px-4 py-2 text-sm font-medium text-white"
            >
              <PhoneOff className="h-4 w-4" /> End Class
            </button>
          )}
        </div>

        {isAdmitted && session.status === "live" ? (
          <div className="overflow-hidden rounded-2xl border border-default bg-black aspect-video">
            <iframe
              title="Live video"
              src={jitsiUrl}
              allow="camera; microphone; fullscreen; display-capture"
              className="h-full w-full min-h-[400px]"
            />
          </div>
        ) : (
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-default bg-surface">
            <p className="text-muted">
              {session.status === "scheduled" ? "Class not started yet" : "Video will appear when class is live"}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {!isTeacher && session.handRaiseEnabled && session.status === "live" && (
            <button
              onClick={() => api.toggleLiveHandRaise(classId).then(refresh)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${myParticipant?.handRaised ? "bg-warning text-white" : "border border-default"}`}
            >
              <Hand className="h-4 w-4" /> {myParticipant?.handRaised ? "Lower Hand" : "Raise Hand"}
            </button>
          )}
          {session.screenShareEnabled && isAdmitted && session.status === "live" && (
            <span className="inline-flex items-center gap-2 rounded-xl border border-default px-4 py-2 text-sm text-muted">
              Screen share available in video toolbar above
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col rounded-2xl border border-default bg-card overflow-hidden min-h-[min(420px,55dvh)] lg:min-h-[500px]">
        <div className="flex border-b border-default">
          {(["people", "chat"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 px-4 py-3 text-sm font-medium capitalize ${tab === t ? "bg-primary-light text-accent" : "text-muted"}`}
            >
              {t === "people" ? `People (${admitted.length})` : "Chat"}
            </button>
          ))}
        </div>

        {tab === "people" && (
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {isTeacher && waiting.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-muted">Waiting room ({waiting.length})</p>
                {waiting.map((p) => (
                  <div key={p.user._id} className="mb-2 flex items-center justify-between rounded-xl border border-warning bg-warning-light/30 p-3">
                    <span className="text-sm font-medium">{p.user.name}</span>
                    <div className="flex gap-1">
                      <button onClick={() => api.admitLiveParticipant(classId, p.user._id).then(refresh)} className="rounded-lg bg-success p-2 text-white" title="Admit">
                        <UserCheck className="h-4 w-4" />
                      </button>
                      <button onClick={() => api.kickLiveParticipant(classId, p.user._id).then(refresh)} className="rounded-lg border border-default p-2" title="Deny">
                        <UserX className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-muted">In class ({admitted.length})</p>
              {admitted.map((p) => (
                <div key={p.user._id} className="mb-2 flex items-center justify-between rounded-xl border border-default p-3">
                  <div>
                    <p className="text-sm font-medium">{p.user.name}</p>
                    {p.handRaised && <span className="text-xs text-warning">✋ Hand raised</span>}
                    {p.isMuted && <span className="text-xs text-muted"> · Muted</span>}
                  </div>
                  {isTeacher && p.user._id !== user.id && (
                    <div className="flex gap-1">
                      <button onClick={() => api.muteLiveParticipant(classId, p.user._id).then(refresh)} className="rounded-lg border border-default p-2" title="Mute toggle">
                        {p.isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </button>
                      <button onClick={() => api.kickLiveParticipant(classId, p.user._id).then(refresh)} className="rounded-lg border border-default p-2" title="Kick">
                        <UserX className="h-4 w-4" />
                      </button>
                      <button onClick={() => api.blockLiveParticipant(classId, p.user._id).then(refresh)} className="rounded-lg border border-danger p-2 text-danger" title="Block">
                        <Ban className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "chat" && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto p-3 space-y-2">
              {!session.chatEnabled ? (
                <p className="text-center text-sm text-muted">Chat is disabled</p>
              ) : session.chatMessages?.length ? (
                session.chatMessages.map((m) => (
                  <div key={m._id} className="rounded-xl bg-surface p-2">
                    <p className="text-xs font-semibold">{m.user.name}</p>
                    <p className="text-sm">{m.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted">No messages yet</p>
              )}
              <div ref={chatEndRef} />
            </div>
            {session.chatEnabled && isAdmitted && (
              <div
                ref={chatComposerRef}
                className="sticky bottom-0 z-10 flex shrink-0 items-center gap-2 border-t border-default bg-card p-3"
                style={{
                  paddingBottom: keyboardInset > 0 ? keyboardInset + 12 : undefined,
                }}
              >
                <input
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  onFocus={() => scrollIntoView(chatComposerRef.current)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder="Ask a question..."
                  className="input-field min-h-[44px] flex-1 rounded-xl border px-3 py-2.5 text-sm"
                />
                <button
                  type="button"
                  onClick={sendChat}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}