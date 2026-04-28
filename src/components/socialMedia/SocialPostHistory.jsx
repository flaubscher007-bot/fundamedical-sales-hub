import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, ChevronDown, ChevronUp, Image, Video, MessageSquare, History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import PlatformAdviceCard from "./PlatformAdviceCard";

export default function SocialPostHistory({ sessions, loading, onDelete }) {
  const [expanded, setExpanded] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (id) => {
    setDeleting(id);
    await base44.entities.SocialPost.delete(id);
    if (onDelete) onDelete();
    setDeleting(null);
    if (expanded === id) setExpanded(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3">
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#a78bfa" }} />
        <p style={{ color: "#a78bfa" }}>Loading sessions...</p>
      </div>
    );
  }

  if (!sessions.length) {
    return (
      <div className="text-center py-16">
        <History className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: "#94a3b8" }} />
        <p className="font-semibold" style={{ color: "#92F21D" }}>No saved sessions yet</p>
        <p className="text-sm mt-1" style={{ color: "#34CCD0" }}>Upload content and get AI advice, then save your session</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map(session => {
        const isOpen = expanded === session.id;
        const chatCount = session.chat_history?.length || 0;
        const platforms = session.ai_advice ? Object.keys(session.ai_advice).filter(k => k !== "general_summary" && session.ai_advice[k]) : [];

        return (
          <div key={session.id} className="rounded-xl border overflow-hidden transition-colors"
            style={{ borderColor: isOpen ? "rgba(167,139,250,0.5)" : "rgba(52,204,208,0.2)", backgroundColor: "rgba(8,31,63,0.7)" }}>
            {/* Row Header */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:opacity-90"
              onClick={() => setExpanded(isOpen ? null : session.id)}
              style={{ backgroundColor: isOpen ? "rgba(167,139,250,0.1)" : "transparent" }}
            >
              {/* Media thumbnail */}
              {session.media_url ? (
                session.media_type === "video" ? (
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(146,242,29,0.15)" }}>
                    <Video className="w-5 h-5" style={{ color: "#92F21D" }} />
                  </div>
                ) : (
                  <img src={session.media_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                )
              ) : (
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(52,204,208,0.15)" }}>
                  <Image className="w-5 h-5" style={{ color: "#34CCD0" }} />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: "#92F21D" }}>
                  {session.title || "Untitled Session"}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  <p className="text-xs" style={{ color: "#94a3b8" }}>
                    {session.created_date ? formatDistanceToNow(new Date(session.created_date), { addSuffix: true }) : ""}
                  </p>
                  {platforms.length > 0 && (
                    <div className="flex gap-1">
                      {platforms.map(p => (
                        <span key={p} className="text-xs px-1.5 py-0.5 rounded-full capitalize"
                          style={{ backgroundColor: "rgba(52,204,208,0.15)", color: "#34CCD0" }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                  {chatCount > 0 && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: "#a78bfa" }}>
                      <MessageSquare className="w-3 h-3" /> {chatCount} chat msg{chatCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(session.id); }}
                  disabled={deleting === session.id}
                  className="p-1.5 rounded-lg transition-colors hover:bg-red-900/30"
                >
                  {deleting === session.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                    : <Trash2 className="w-3.5 h-3.5 text-red-400" />}
                </button>
                {isOpen ? <ChevronUp className="w-4 h-4" style={{ color: "#a78bfa" }} />
                  : <ChevronDown className="w-4 h-4" style={{ color: "#94a3b8" }} />}
              </div>
            </div>

            {/* Expanded content */}
            {isOpen && (
              <div className="px-4 pb-5 pt-2 space-y-4" style={{ borderTop: "1px solid rgba(167,139,250,0.2)" }}>
                {/* Media preview */}
                {session.media_url && (
                  <div className="rounded-xl overflow-hidden border" style={{ borderColor: "rgba(52,204,208,0.2)" }}>
                    {session.media_type === "video"
                      ? <video src={session.media_url} controls className="w-full max-h-48" />
                      : <img src={session.media_url} alt="" className="w-full max-h-48 object-contain" style={{ backgroundColor: "rgba(0,0,0,0.2)" }} />
                    }
                  </div>
                )}

                {/* Brand context */}
                {session.brand_context && (
                  <div className="rounded-lg px-3 py-2" style={{ backgroundColor: "rgba(146,242,29,0.06)", border: "1px solid rgba(146,242,29,0.15)" }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: "#92F21D" }}>Brand Context Used</p>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>{session.brand_context}</p>
                  </div>
                )}

                {/* AI Summary */}
                {session.ai_advice?.general_summary && (
                  <div className="rounded-lg px-3 py-2" style={{ backgroundColor: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)" }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: "#a78bfa" }}>🤖 AI Summary</p>
                    <p className="text-xs" style={{ color: "#e2e8f0" }}>{session.ai_advice.general_summary}</p>
                  </div>
                )}

                {/* Platform advice cards */}
                {session.ai_advice && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {["facebook", "linkedin", "instagram", "youtube"].map(p =>
                      session.ai_advice[p] ? (
                        <PlatformAdviceCard key={p} platform={p} data={session.ai_advice[p]} />
                      ) : null
                    )}
                  </div>
                )}

                {/* Chat history */}
                {session.chat_history?.length > 0 && (
                  <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(167,139,250,0.2)" }}>
                    <p className="px-4 py-2 text-xs font-semibold" style={{ backgroundColor: "rgba(167,139,250,0.1)", color: "#a78bfa" }}>
                      💬 Chat Refinement History
                    </p>
                    <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                      {session.chat_history.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className="max-w-[85%] rounded-lg px-3 py-1.5 text-xs"
                            style={msg.role === "user"
                              ? { backgroundColor: "rgba(167,139,250,0.2)", color: "#e2e8f0" }
                              : { backgroundColor: "rgba(52,204,208,0.1)", color: "#94a3b8" }
                            }>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}