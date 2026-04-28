import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, MessageSquare } from "lucide-react";

export default function SocialChatPanel({ chatHistory, onSend, generating }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const send = () => {
    if (!input.trim() || generating) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(167,139,250,0.3)", backgroundColor: "rgba(8,31,63,0.7)" }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: "rgba(167,139,250,0.1)", borderBottom: "1px solid rgba(167,139,250,0.2)" }}>
        <MessageSquare className="w-4 h-4" style={{ color: "#a78bfa" }} />
        <span className="text-sm font-bold" style={{ color: "#a78bfa" }}>Refine with AI Chat</span>
        <span className="text-xs ml-1" style={{ color: "#94a3b8" }}>Give more context to improve the advice</span>
      </div>

      {/* Chat messages */}
      {chatHistory.length > 0 && (
        <div className="max-h-64 overflow-y-auto p-4 space-y-3">
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[85%] rounded-xl px-3 py-2 text-sm"
                style={msg.role === "user"
                  ? { backgroundColor: "rgba(167,139,250,0.2)", color: "#e2e8f0", borderRadius: "12px 12px 4px 12px" }
                  : { backgroundColor: "rgba(52,204,208,0.1)", color: "#94a3b8", borderRadius: "12px 12px 12px 4px" }
                }
              >
                {msg.content}
              </div>
            </div>
          ))}
          {generating && (
            <div className="flex justify-start">
              <div className="px-3 py-2 rounded-xl flex items-center gap-2" style={{ backgroundColor: "rgba(52,204,208,0.1)" }}>
                <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "#34CCD0" }} />
                <span className="text-xs" style={{ color: "#34CCD0" }}>Re-analysing...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div className="p-3 flex gap-2 items-end" style={{ borderTop: chatHistory.length ? "1px solid rgba(167,139,250,0.15)" : "none" }}>
        <Textarea
          placeholder="e.g. 'Focus on our expert witness service for RAF cases' or 'Make it more inspirational' or 'Target attorneys aged 30–50'..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          className="flex-1 min-h-[60px] max-h-32 resize-none text-sm"
          style={{ backgroundColor: "rgba(8,31,63,0.6)", borderColor: "rgba(167,139,250,0.3)", color: "#fff" }}
        />
        <Button
          onClick={send}
          disabled={!input.trim() || generating}
          style={{ backgroundColor: "rgba(167,139,250,0.2)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.4)" }}
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}