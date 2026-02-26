import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Check, AlertCircle, Upload } from "lucide-react";

export default function ProfileTab({ currentUser }) {
  const [editMode, setEditMode] = useState(false);
  const [profilePicture, setProfilePicture] = useState(currentUser?.profile_picture || null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: currentUser?.full_name || "",
  });
  const [message, setMessage] = useState(null);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe({ full_name: data.full_name }),
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditMode(false);
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: 'Failed to update profile: ' + error.message });
    }
  });

  const handleSave = () => {
    if (!formData.full_name.trim()) {
      setMessage({ type: 'error', text: 'Name cannot be empty' });
      return;
    }
    updateMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              disabled={!editMode}
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <Label>Email Address</Label>
            <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-md bg-slate-50">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-slate-700">{currentUser?.email}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <Label>Account Role</Label>
            <div className="px-3 py-2 border border-slate-200 rounded-md bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="inline-block px-3 py-1 rounded-full bg-[#00bcd4]/10 text-[#00bcd4] text-sm font-medium">
                  {currentUser?.role || "User"}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">Contact an administrator to change your role</p>
          </div>

          <div className="flex gap-2 pt-4">
            {editMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData({ full_name: currentUser?.full_name || "" });
                    setEditMode(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="bg-[#7ed957] hover:bg-[#6cc844] text-black"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setEditMode(true)}
                className="bg-[#00bcd4] hover:bg-[#0097a7]"
              >
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}