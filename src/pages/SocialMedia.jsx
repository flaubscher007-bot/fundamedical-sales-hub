import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, History, Sparkles, Globe, PenLine } from "lucide-react";
import SocialMediaUploader from "@/components/socialMedia/SocialMediaUploader";
import SocialPostHistory from "@/components/socialMedia/SocialPostHistory";
import PastPostsPanel from "@/components/socialMedia/PastPostsPanel";
import AIPostGenerator from "@/components/socialMedia/AIPostGenerator";

export default function SocialMedia() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upload");
  const [refreshKey, setRefreshKey] = useState(0);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.SocialPost.list("-created_date", 50);
      setSessions(data.filter(s => s.session_type === "ai_advisor" || !s.session_type));
    } catch (e) { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadSessions(); }, [refreshKey]);

  const onSessionSaved = () => {
    setRefreshKey(k => k + 1);
    setActiveTab("history");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "#92F21D" }}>
          <Sparkles className="w-6 h-6" /> Social Media AI Advisor
        </h1>
        <p className="text-sm mt-1" style={{ color: "#34CCD0" }}>
          Upload your content and get AI-powered advice tailored for Facebook, YouTube, Instagram & LinkedIn
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="gap-1" style={{ backgroundColor: "rgba(52,204,208,0.08)", border: "1px solid rgba(52,204,208,0.2)" }}>
          <TabsTrigger value="upload" className="flex items-center gap-2 data-[state=active]:text-[#081F3F]"
            style={{ color: activeTab === "upload" ? "#081F3F" : "#94a3b8" }}>
            <Upload className="w-4 h-4" /> New Post Advisor
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:text-[#081F3F]"
            style={{ color: activeTab === "history" ? "#081F3F" : "#94a3b8" }}>
            <History className="w-4 h-4" /> Saved Sessions
            {sessions.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold ml-1"
                style={{ backgroundColor: "rgba(167,139,250,0.3)", color: "#a78bfa" }}>
                {sessions.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="generate" className="flex items-center gap-2 data-[state=active]:text-[#081F3F]"
            style={{ color: activeTab === "generate" ? "#081F3F" : "#94a3b8" }}>
            <PenLine className="w-4 h-4" /> Generate Posts
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2 data-[state=active]:text-[#081F3F]"
            style={{ color: activeTab === "past" ? "#081F3F" : "#94a3b8" }}>
            <Globe className="w-4 h-4" /> Past Posts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-4">
          <SocialMediaUploader onSaved={onSessionSaved} />
        </TabsContent>

        <TabsContent value="generate" className="mt-4">
          <AIPostGenerator />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <SocialPostHistory sessions={sessions} loading={loading} onDelete={() => setRefreshKey(k => k + 1)} />
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          <PastPostsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}