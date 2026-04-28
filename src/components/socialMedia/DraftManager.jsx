import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Check } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function DraftManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    platform: "",
    content: "",
    hashtags: [],
  });
  const [hashtagInput, setHashtagInput] = useState("");
  const queryClient = useQueryClient();

  // Fetch all drafts
  const { data: drafts = [], isLoading } = useQuery({
    queryKey: ["drafts"],
    queryFn: () => base44.entities.ScheduledPost.filter({ status: "Draft" }),
  });

  // Save or update draft
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingId) {
        return await base44.entities.ScheduledPost.update(editingId, data);
      } else {
        return await base44.entities.ScheduledPost.create({ ...data, status: "Draft" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
      resetForm();
      setIsOpen(false);
    },
  });

  // Delete draft
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ScheduledPost.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
    },
  });

  const resetForm = () => {
    setFormData({ title: "", platform: "", content: "", hashtags: [] });
    setHashtagInput("");
    setEditingId(null);
  };

  const handleSave = () => {
    if (!formData.platform || !formData.content) {
      alert("Please fill in platform and content");
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleEdit = (draft) => {
    setFormData({
      title: draft.title || "",
      platform: draft.platform || "",
      content: draft.content || "",
      hashtags: draft.hashtags || [],
    });
    setEditingId(draft.id);
    setIsOpen(true);
  };

  const addHashtag = () => {
    if (hashtagInput.trim()) {
      setFormData({
        ...formData,
        hashtags: [...formData.hashtags, hashtagInput.trim()],
      });
      setHashtagInput("");
    }
  };

  const removeHashtag = (index) => {
    setFormData({
      ...formData,
      hashtags: formData.hashtags.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Draft Posts</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gap-2">
              <Plus className="w-4 h-4" /> New Draft
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingId ? "Edit Draft" : "Create Draft"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white">Title (optional)</label>
                <Input
                  placeholder="Draft title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 bg-slate-800 border-slate-600 text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white">Platform *</label>
                <Select value={formData.platform} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
                  <SelectTrigger className="mt-1 bg-slate-800 border-slate-600 text-white">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="YouTube">YouTube</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-white">Content *</label>
                <Textarea
                  placeholder="Write your post content..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="mt-1 bg-slate-800 border-slate-600 text-white h-32"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white">Hashtags</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Type hashtag (e.g., #marketing)"
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addHashtag()}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                  <Button size="sm" variant="outline" onClick={addHashtag}>
                    Add
                  </Button>
                </div>
                {formData.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.hashtags.map((tag, idx) => (
                      <div key={idx} className="bg-slate-700 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                        {tag}
                        <button onClick={() => removeHashtag(idx)} className="hover:text-red-400">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : "Save Draft"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-slate-400">Loading drafts...</div>
      ) : drafts.length === 0 ? (
        <div className="text-center py-8 text-slate-400">No drafts yet. Start with a new post.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {drafts.map((draft) => (
            <div key={draft.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
              {draft.title && <h4 className="font-semibold text-white truncate">{draft.title}</h4>}
              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                  {draft.platform}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(draft.updated_date).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-slate-300 line-clamp-2">{draft.content}</p>
              {draft.hashtags?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {draft.hashtags.slice(0, 2).map((tag, idx) => (
                    <span key={idx} className="text-xs text-cyan-400">
                      {tag}
                    </span>
                  ))}
                  {draft.hashtags.length > 2 && (
                    <span className="text-xs text-slate-500">+{draft.hashtags.length - 2} more</span>
                  )}
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2 border-t border-slate-700">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(draft)}
                  className="gap-1"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(draft.id)}
                  disabled={deleteMutation.isPending}
                  className="gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}