import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Upload, Image, Video, Loader2, Sparkles, Send, X, RefreshCw } from "lucide-react";
import PlatformAdviceCard from "./PlatformAdviceCard";
import SocialChatPanel from "./SocialChatPanel";

const BRAND_PLACEHOLDER = `e.g. FundaMedical is a South African medical-legal services company. We connect law firms with expert medical witnesses for personal injury, COIDA, RAF and medical negligence cases. Our tone is professional, trustworthy and empowering. Our key services include medical reports, expert witness scheduling, and financial support for law firms.`;

export default function SocialMediaUploader({ onSaved }) {
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [brandContext, setBrandContext] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [advice, setAdvice] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    setMediaFile(file);
    setMediaType(isVideo ? "video" : "image");
    setMediaPreview(URL.createObjectURL(file));
    setAdvice(null);
    setSaved(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const uploadMedia = async () => {
    if (!mediaFile) return null;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: mediaFile });
    setUploadedUrl(file_url);
    setUploading(false);
    return file_url;
  };

  const generateAdvice = async (extraContext = "", history = []) => {
    setGenerating(true);
    const fileUrl = uploadedUrl || await uploadMedia();

    const contextSection = brandContext.trim()
      ? `\n\nBRAND & INDUSTRY CONTEXT:\n${brandContext}`
      : "";
    const extraSection = extraContext ? `\n\nADDITIONAL USER INPUT:\n${extraContext}` : "";
    const chatSection = history.length
      ? `\n\nPREVIOUS CONVERSATION:\n${history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}`
      : "";

    const prompt = `You are a social media marketing expert specialising in professional services and healthcare industries in South Africa.

Analyse the uploaded ${mediaType || "content"} and provide highly specific, actionable advice for publishing it on each of the four major platforms below.${contextSection}${chatSection}${extraSection}

For EACH platform (Facebook, LinkedIn, Instagram, YouTube), provide:
- caption: A ready-to-use caption/description optimised for that platform's best practices
- hashtags: An array of 10–15 relevant hashtags (mix popular and niche)
- keywords: SEO keywords relevant to the content
- best_time: Best time/day to post for a South African professional audience
- format_tips: Specific formatting advice (length, emojis, structure, tags)
- engagement_tips: 3 specific tips to maximise reach and engagement on that platform
- thumbnail_advice: (YouTube/Instagram only) Advice on thumbnail or cover image
- description: (YouTube/LinkedIn only) Long-form description or article intro

Return as JSON only.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: fileUrl ? [fileUrl] : [],
      response_json_schema: {
        type: "object",
        properties: {
          facebook: { type: "object" },
          linkedin: { type: "object" },
          instagram: { type: "object" },
          youtube: { type: "object" },
          general_summary: { type: "string" }
        }
      }
    });

    setAdvice(result);
    setGenerating(false);
    return result;
  };

  const handleChatRefine = async (message) => {
    const newHistory = [...chatHistory, { role: "user", content: message }];
    setChatHistory(newHistory);
    const updatedAdvice = await generateAdvice(message, newHistory);
    setChatHistory(h => [...h, { role: "assistant", content: "I've updated the advice based on your input. Check the platform cards above." }]);
    setAdvice(updatedAdvice);
  };

  const handleSave = async () => {
    if (!advice) return;
    setSaving(true);
    await base44.entities.SocialPost.create({
      session_type: "ai_advisor",
      title: postTitle || `Post – ${new Date().toLocaleDateString("en-ZA")}`,
      media_url: uploadedUrl,
      media_type: mediaType,
      brand_context: brandContext,
      ai_advice: advice,
      chat_history: chatHistory,
      content: advice.general_summary || "",
    });
    setSaving(false);
    setSaved(true);
    if (onSaved) onSaved();
  };

  const reset = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setUploadedUrl(null);
    setAdvice(null);
    setChatHistory([]);
    setSaved(false);
    setPostTitle("");
  };

  return (
    <div className="space-y-5">
      {/* Step 1: Upload */}
      <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: "rgba(52,204,208,0.3)", backgroundColor: "rgba(52,204,208,0.05)" }}>
        <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "#34CCD0" }}>
          <Upload className="w-4 h-4" /> Step 1 — Upload Your Content
        </h2>

        {!mediaPreview ? (
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors hover:border-[#34CCD0]"
            style={{ borderColor: "rgba(52,204,208,0.3)" }}
          >
            <div className="flex gap-4 justify-center mb-3">
              <Image className="w-8 h-8" style={{ color: "#34CCD0" }} />
              <Video className="w-8 h-8" style={{ color: "#92F21D" }} />
            </div>
            <p className="font-semibold" style={{ color: "#92F21D" }}>Drag & drop or click to upload</p>
            <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>Images (JPG, PNG, WEBP) or Videos (MP4, MOV)</p>
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: "rgba(52,204,208,0.3)" }}>
            {mediaType === "image" ? (
              <img src={mediaPreview} alt="Preview" className="w-full max-h-64 object-contain" style={{ backgroundColor: "rgba(0,0,0,0.3)" }} />
            ) : (
              <video src={mediaPreview} controls className="w-full max-h-64" />
            )}
            <button onClick={reset} className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#fff" }}>
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-2">
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ backgroundColor: mediaType === "video" ? "rgba(146,242,29,0.8)" : "rgba(52,204,208,0.8)", color: "#081F3F" }}>
                {mediaType === "video" ? "📹 Video" : "🖼 Image"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Brand Context */}
      <div className="rounded-xl border p-5 space-y-3" style={{ borderColor: "rgba(146,242,29,0.3)", backgroundColor: "rgba(146,242,29,0.04)" }}>
        <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "#92F21D" }}>
          <Sparkles className="w-4 h-4" /> Step 2 — Tell the AI About Your Brand (Optional but Recommended)
        </h2>
        <Textarea
          placeholder={BRAND_PLACEHOLDER}
          value={brandContext}
          onChange={e => setBrandContext(e.target.value)}
          className="min-h-[100px] text-sm resize-none"
          style={{ backgroundColor: "rgba(8,31,63,0.6)", borderColor: "rgba(146,242,29,0.3)", color: "#fff" }}
        />
        <p className="text-xs" style={{ color: "#94a3b8" }}>
          This context is remembered across sessions — the more detail you provide, the more tailored the advice.
        </p>
      </div>

      {/* Post title */}
      {mediaPreview && (
        <div className="flex gap-3 items-center">
          <Input
            placeholder="Session title (e.g. 'Q2 Campaign Launch')"
            value={postTitle}
            onChange={e => setPostTitle(e.target.value)}
            style={{ backgroundColor: "rgba(8,31,63,0.6)", borderColor: "rgba(52,204,208,0.3)", color: "#fff" }}
          />
          <Button
            onClick={() => generateAdvice()}
            disabled={!mediaFile && !uploadedUrl || generating || uploading}
            style={{ backgroundColor: "#92F21D", color: "#081F3F", fontWeight: 700, whiteSpace: "nowrap" }}
          >
            {generating || uploading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{uploading ? "Uploading..." : "Analysing..."}</>
            ) : advice ? (
              <><RefreshCw className="w-4 h-4 mr-2" />Re-analyse</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />Get AI Advice</>
            )}
          </Button>
        </div>
      )}

      {/* AI Advice Results */}
      {advice && (
        <div className="space-y-4">
          {advice.general_summary && (
            <div className="rounded-xl border px-4 py-3" style={{ borderColor: "rgba(167,139,250,0.3)", backgroundColor: "rgba(167,139,250,0.08)" }}>
              <p className="text-sm font-semibold mb-1" style={{ color: "#a78bfa" }}>🤖 AI Summary</p>
              <p className="text-sm" style={{ color: "#e2e8f0" }}>{advice.general_summary}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["facebook", "linkedin", "instagram", "youtube"].map(platform => (
              advice[platform] && (
                <PlatformAdviceCard key={platform} platform={platform} data={advice[platform]} />
              )
            ))}
          </div>

          {/* Chat Refinement */}
          <SocialChatPanel chatHistory={chatHistory} onSend={handleChatRefine} generating={generating} />

          {/* Save */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={saving || saved}
              style={{
                backgroundColor: saved ? "rgba(146,242,29,0.15)" : "rgba(167,139,250,0.2)",
                color: saved ? "#92F21D" : "#a78bfa",
                fontWeight: 600,
                border: `1px solid ${saved ? "rgba(146,242,29,0.4)" : "rgba(167,139,250,0.4)"}`,
              }}
            >
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                : saved ? "✓ Saved to History"
                : "Save Session"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}