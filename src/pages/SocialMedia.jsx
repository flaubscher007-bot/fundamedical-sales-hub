import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Facebook, Linkedin, Instagram, Youtube,
  RefreshCw, Plus, ExternalLink, Trash2, Link2, CheckCircle2, AlertCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const PLATFORMS = [
  { name: "Facebook", icon: Facebook, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  { name: "LinkedIn", icon: Linkedin, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  { name: "Instagram", icon: Instagram, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200" },
  { name: "YouTube", icon: Youtube, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
];

export default function SocialMedia() {
  const queryClient = useQueryClient();
  const [connectDialog, setConnectDialog] = useState(null); // platform name
  const [formData, setFormData] = useState({ page_url: "", handle: "" });
  const [fetchingPlatform, setFetchingPlatform] = useState(null);
  const [linkedInLoading, setLinkedInLoading] = useState(false);

  const { data: accounts = [] } = useQuery({
    queryKey: ["social-accounts"],
    queryFn: () => base44.entities.SocialAccount.list(),
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["social-posts"],
    queryFn: () => base44.entities.SocialPost.list("-published_at", 30),
  });

  const saveAccount = useMutation({
    mutationFn: async (data) => {
      const existing = accounts.find(a => a.platform === data.platform);
      if (existing) {
        return base44.entities.SocialAccount.update(existing.id, { ...data, connected: true });
      }
      return base44.entities.SocialAccount.create({ ...data, connected: true });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["social-accounts"] }),
  });

  const deleteAccount = useMutation({
    mutationFn: (id) => base44.entities.SocialAccount.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["social-accounts"] }),
  });

  const deletePost = useMutation({
    mutationFn: (id) => base44.entities.SocialPost.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["social-posts"] }),
  });

  const handleConnect = async () => {
    if (!formData.page_url) return;
    await saveAccount.mutateAsync({ platform: connectDialog, ...formData });
    setConnectDialog(null);
    setFormData({ page_url: "", handle: "" });
  };

  const handleFetchPosts = async (account) => {
    if (account.platform === "LinkedIn") {
      setLinkedInLoading(true);
      try {
        await base44.functions.invoke("fetchLinkedInPosts", {});
        queryClient.invalidateQueries({ queryKey: ["social-posts"] });
      } catch (e) {
        alert("LinkedIn fetch failed: " + e.message);
      }
      setLinkedInLoading(false);
    } else {
      setFetchingPlatform(account.platform);
      try {
        await base44.functions.invoke("fetchPublicSocialPosts", {
          platform: account.platform,
          page_url: account.page_url,
          handle: account.handle,
        });
        queryClient.invalidateQueries({ queryKey: ["social-posts"] });
      } catch (e) {
        alert("Fetch failed: " + e.message);
      }
      setFetchingPlatform(null);
    }
  };

  const getPlatformConfig = (name) => PLATFORMS.find(p => p.name === name) || PLATFORMS[0];

  const getAccountForPlatform = (name) => accounts.find(a => a.platform === name);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Social Media Posts</h1>
        <p className="text-slate-500 mt-1">Connect your social accounts to fetch recent posts for client communications</p>
      </div>

      {/* Connected Accounts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLATFORMS.map((platform) => {
          const PIcon = platform.icon;
          const account = getAccountForPlatform(platform.name);
          const isFetching = fetchingPlatform === platform.name || (platform.name === "LinkedIn" && linkedInLoading);

          return (
            <Card key={platform.name} className={`border ${account ? platform.border : "border-slate-200"}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${platform.bg}`}>
                    <PIcon className={`w-5 h-5 ${platform.color}`} />
                  </div>
                  {account ? (
                    <Badge className="bg-green-100 text-green-700 border-0">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-500">
                      Not connected
                    </Badge>
                  )}
                </div>
                <p className="font-semibold text-slate-800 text-sm">{platform.name}</p>
                {account && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">{account.handle || account.page_url}</p>
                )}
                <div className="flex gap-2 mt-3">
                  {account ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => handleFetchPosts(account)}
                        disabled={isFetching}
                      >
                        <RefreshCw className={`w-3 h-3 mr-1 ${isFetching ? "animate-spin" : ""}`} />
                        {isFetching ? "Fetching..." : "Fetch Posts"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 px-2"
                        onClick={() => deleteAccount.mutate(account.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      className="flex-1 text-xs bg-slate-800 hover:bg-slate-700"
                      onClick={() => {
                        setConnectDialog(platform.name);
                        setFormData({ page_url: "", handle: "" });
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Connect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* LinkedIn Note */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          <strong>LinkedIn:</strong> Requires OAuth authorization. Go to <strong>Dashboard → Settings → Integrations</strong> to connect your LinkedIn account, then use "Fetch Posts" above.
          For Facebook, Instagram, and YouTube, posts are fetched from the public page URL.
        </span>
      </div>

      {/* Recent Posts */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Recent Posts {posts.length > 0 && <span className="text-slate-400 font-normal text-base">({posts.length})</span>}
        </h2>

        {postsLoading ? (
          <div className="text-center py-12 text-slate-400">Loading posts...</div>
        ) : posts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-slate-400">
              <Link2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No posts yet. Connect a social account and click "Fetch Posts" to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {posts.map((post) => {
              const cfg = getPlatformConfig(post.platform);
              const PIcon = cfg.icon;
              return (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`p-1.5 rounded ${cfg.bg}`}>
                        <PIcon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <span className="text-xs font-medium text-slate-600">{post.platform}</span>
                      {post.published_at && (
                        <span className="text-xs text-slate-400 ml-auto">
                          {formatDistanceToNow(new Date(post.published_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>

                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt=""
                        className="w-full h-36 object-cover rounded-md mb-3"
                        onError={e => e.target.style.display = "none"}
                      />
                    )}

                    <p className="text-sm text-slate-700 line-clamp-4 leading-relaxed">{post.content}</p>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      {post.post_url ? (
                        <a
                          href={post.post_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[#00bcd4] hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> View post
                        </a>
                      ) : <span />}
                      <button
                        onClick={() => deletePost.mutate(post.id)}
                        className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Connect Dialog */}
      <Dialog open={!!connectDialog} onOpenChange={() => setConnectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {connectDialog}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Page / Profile URL *</Label>
              <Input
                placeholder={`e.g. https://www.${connectDialog?.toLowerCase()}.com/fundamedical`}
                value={formData.page_url}
                onChange={e => setFormData(f => ({ ...f, page_url: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Handle / Page Name (optional)</Label>
              <Input
                placeholder="e.g. fundamedical"
                value={formData.handle}
                onChange={e => setFormData(f => ({ ...f, handle: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setConnectDialog(null)}>Cancel</Button>
              <Button
                onClick={handleConnect}
                disabled={!formData.page_url || saveAccount.isPending}
                className="bg-[#00bcd4] hover:bg-[#0097a7]"
              >
                {saveAccount.isPending ? "Connecting..." : "Connect"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}