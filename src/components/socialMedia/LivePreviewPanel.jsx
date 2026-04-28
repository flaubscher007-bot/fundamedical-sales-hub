import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Eye, X, Copy } from "lucide-react";
import { toast } from "sonner";

const platforms = [
  {
    id: "facebook",
    name: "Facebook",
    color: "#1877F2",
    maxLength: 63206,
    previewWidth: "500px"
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    color: "#0A66C2",
    maxLength: 3000,
    previewWidth: "550px"
  }
];

export default function LivePreviewPanel() {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState(["facebook", "linkedin"]);

  const togglePlatform = (platformId) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const FacebookPreview = () => (
    <div
      className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-300"
      style={{ maxWidth: "500px" }}
    >
      {/* Facebook Header */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            FM
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-gray-900">FundaMedical</div>
            <div className="text-xs text-gray-500">2 hours ago</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {title && (
          <div className="text-lg font-bold text-gray-900 mb-3 break-words">
            {title}
          </div>
        )}
        <div className="text-gray-800 break-words leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      </div>

      {/* Image */}
      {imageUrl && (
        <div className="bg-gray-100 aspect-video flex items-center justify-center overflow-hidden">
          <img
            src={imageUrl}
            alt="Post"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 text-xs text-gray-600 flex gap-6">
        <span>👍 Like</span>
        <span>💬 Comment</span>
        <span>↗️ Share</span>
      </div>
    </div>
  );

  const LinkedInPreview = () => (
    <div
      className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-300"
      style={{ maxWidth: "550px" }}
    >
      {/* LinkedIn Header */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-bold">
            FM
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-900">FundaMedical</div>
            <div className="text-xs text-gray-500">2 hours ago • 🌐</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {title && (
          <div className="text-base font-bold text-gray-900 mb-2 break-words">
            {title}
          </div>
        )}
        <div className="text-gray-800 break-words leading-relaxed text-sm whitespace-pre-wrap">
          {content.length > 300
            ? `${content.substring(0, 300)}... See more`
            : content}
        </div>
      </div>

      {/* Image */}
      {imageUrl && (
        <div className="bg-gray-100 aspect-video flex items-center justify-center overflow-hidden">
          <img
            src={imageUrl}
            alt="Post"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 text-xs text-gray-600 flex gap-4">
        <span>👍 Like</span>
        <span>💬 Comment</span>
        <span>↗️ Repost</span>
        <span>➤ Send</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card className="p-6 bg-slate-900 border-slate-700">
        <h2 className="text-xl font-bold mb-4" style={{ color: "#92F21D" }}>
          Preview Post Content
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium" style={{ color: "#92F21D" }}>
              Post Title (Optional)
            </label>
            <Input
              placeholder="Add a headline..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium flex justify-between items-center" style={{ color: "#92F21D" }}>
              <span>Post Content</span>
              <span className="text-xs">
                {content.length} / {Math.min(...selectedPlatforms.map(p => platforms.find(pl => pl.id === p).maxLength))}
              </span>
            </label>
            <Textarea
              placeholder="Write your post content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-2 h-32"
            />
          </div>

          <div>
            <label className="text-sm font-medium" style={{ color: "#92F21D" }}>
              Image URL (Optional)
            </label>
            <Input
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Platform Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block" style={{ color: "#92F21D" }}>
              Preview Platforms
            </label>
            <div className="flex gap-3">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedPlatforms.includes(platform.id)
                      ? "opacity-100 ring-2 ring-offset-2"
                      : "opacity-50 hover:opacity-75"
                  }`}
                  style={{
                    backgroundColor: platform.color,
                    color: "white",
                    ringColor: platform.color,
                  }}
                >
                  <Eye className="w-4 h-4 inline mr-2" />
                  {platform.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Preview Section */}
      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#92F21D" }}>
          Live Preview
        </h3>

        <div className="grid gap-6" style={{ gridTemplateColumns: selectedPlatforms.length > 1 ? "repeat(auto-fit, minmax(500px, 1fr))" : "1fr" }}>
          {selectedPlatforms.includes("facebook") && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-blue-500">Facebook Preview</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(content)}
                  className="h-8"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <FacebookPreview />
            </div>
          )}

          {selectedPlatforms.includes("linkedin") && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-blue-700">LinkedIn Preview</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(content)}
                  className="h-8"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <LinkedInPreview />
            </div>
          )}
        </div>

        {selectedPlatforms.length === 0 && (
          <div className="text-center py-12" style={{ color: "#92F21D" }}>
            <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Select at least one platform to preview</p>
          </div>
        )}
      </div>
    </div>
  );
}