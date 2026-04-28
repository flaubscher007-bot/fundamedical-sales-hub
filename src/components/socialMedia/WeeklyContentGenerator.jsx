import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Sparkles, Download, Copy, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const platforms = ["Facebook", "LinkedIn", "Instagram"];

export default function WeeklyContentGenerator() {
  const [topic, setTopic] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [weeklyContent, setWeeklyContent] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);

  const generateContent = async () => {
    if (!topic && !url) {
      toast.error("Please provide a topic or URL");
      return;
    }

    setLoading(true);
    try {
      const prompt = url
        ? `Analyze this URL: ${url}\n\nCreate a full week of social media content (Monday-Sunday) for FundaMedical with post ideas, captions, and hashtags for Facebook, LinkedIn, and Instagram. Each day should have:
        - A unique topic or focus
        - Platform-specific captions (Facebook: casual & engaging, LinkedIn: professional, Instagram: visual-focused)
        - Relevant hashtags for each platform
        - Content description/idea
        
        Format as JSON with structure: { days: [{ day, facebook: { caption, hashtags, idea }, linkedin: { caption, hashtags, idea }, instagram: { caption, hashtags, idea } }] }`
        : `Based on the topic: "${topic}"\n\nCreate a full week of social media content (Monday-Sunday) for FundaMedical with post ideas, captions, and hashtags for Facebook, LinkedIn, and Instagram. Each day should have:
        - A unique angle or focus related to the topic
        - Platform-specific captions (Facebook: casual & engaging, LinkedIn: professional, Instagram: visual-focused)
        - Relevant hashtags for each platform
        - Content description/idea
        
        Format as JSON with structure: { days: [{ day, facebook: { caption, hashtags, idea }, linkedin: { caption, hashtags, idea }, instagram: { caption, hashtags, idea } }] }`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            days: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "string" },
                  facebook: {
                    type: "object",
                    properties: {
                      caption: { type: "string" },
                      hashtags: { type: "array", items: { type: "string" } },
                      idea: { type: "string" },
                    },
                  },
                  linkedin: {
                    type: "object",
                    properties: {
                      caption: { type: "string" },
                      hashtags: { type: "array", items: { type: "string" } },
                      idea: { type: "string" },
                    },
                  },
                  instagram: {
                    type: "object",
                    properties: {
                      caption: { type: "string" },
                      hashtags: { type: "array", items: { type: "string" } },
                      idea: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      });

      setWeeklyContent(response);
      toast.success("Content generated for the week!");
    } catch (error) {
      toast.error("Failed to generate content: " + error.message);
    }
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const exportAsCSV = () => {
    if (!weeklyContent) return;

    const rows = [];
    rows.push(["Day", "Platform", "Caption", "Hashtags", "Idea"]);

    weeklyContent.days.forEach((day) => {
      platforms.forEach((platform) => {
        const content = day[platform.toLowerCase()];
        rows.push([
          day.day,
          platform,
          content.caption,
          content.hashtags.join(" "),
          content.idea,
        ]);
      });
    });

    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "weekly-content-plan.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card className="p-6 bg-slate-900 border-slate-700">
        <h2 className="text-xl font-bold mb-4" style={{ color: "#92F21D" }}>
          <Sparkles className="inline mr-2 w-5 h-5" />
          Generate Week's Content
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium" style={{ color: "#92F21D" }}>
              Topic or Theme
            </label>
            <Input
              placeholder="e.g., Medical Negligence Legal Updates, New Services Launch..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium" style={{ color: "#92F21D" }}>
              OR Provide a URL
            </label>
            <Input
              placeholder="https://example.com/article (optional)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mt-2"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={generateContent}
              disabled={loading || (!topic && !url)}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Weekly Content
                </>
              )}
            </Button>

            {weeklyContent && (
              <Button variant="outline" onClick={exportAsCSV} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export as CSV
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Content Display */}
      {weeklyContent && (
        <div className="space-y-4">
          {/* Day Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {daysOfWeek.map((day, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDay(idx)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedDay === idx
                    ? "text-[#081F3F]"
                    : "text-gray-400 hover:text-white border border-slate-700"
                }`}
                style={{
                  backgroundColor: selectedDay === idx ? "#92F21D" : "transparent",
                }}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Content Cards for Selected Day */}
          {weeklyContent.days[selectedDay] && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold" style={{ color: "#92F21D" }}>
                {weeklyContent.days[selectedDay].day}'s Content
              </h3>

              {platforms.map((platform) => {
                const content = weeklyContent.days[selectedDay][platform.toLowerCase()];
                const platformColors = {
                  facebook: "#1877F2",
                  linkedin: "#0A66C2",
                  instagram: "#E1306C",
                };

                return (
                  <Card
                    key={platform}
                    className="p-6 bg-slate-900 border-slate-700 hover:border-slate-600 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h4
                        className="text-lg font-bold"
                        style={{ color: platformColors[platform.toLowerCase()] }}
                      >
                        {platform}
                      </h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(content.caption)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {/* Idea */}
                      <div>
                        <div className="text-xs font-semibold text-gray-400 mb-1 uppercase">
                          Content Idea
                        </div>
                        <p className="text-sm leading-relaxed">{content.idea}</p>
                      </div>

                      {/* Caption */}
                      <div>
                        <div className="text-xs font-semibold text-gray-400 mb-1 uppercase">
                          Caption
                        </div>
                        <Textarea
                          value={content.caption}
                          readOnly
                          className="h-24 text-sm resize-none"
                        />
                      </div>

                      {/* Hashtags */}
                      <div>
                        <div className="text-xs font-semibold text-gray-400 mb-2 uppercase">
                          Suggested Hashtags
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {content.hashtags.map((tag, idx) => (
                            <button
                              key={idx}
                              onClick={() => copyToClipboard(tag)}
                              className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 hover:bg-slate-700 transition-colors"
                              style={{
                                borderLeft: `3px solid ${platformColors[platform.toLowerCase()]}`,
                              }}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4 border-t border-slate-700">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(content.caption)}
                        >
                          Copy Caption
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            copyToClipboard(
                              `${content.caption}\n\n${content.hashtags.join(" ")}`
                            )
                          }
                        >
                          Copy with Hashtags
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!weeklyContent && !loading && (
        <Card className="p-12 bg-slate-900 border-slate-700 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" style={{ color: "#92F21D" }} />
          <p className="text-gray-400">
            Provide a topic or URL above to generate a week of platform-specific social media content with captions and hashtags.
          </p>
        </Card>
      )}
    </div>
  );
}