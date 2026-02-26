import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Check, AlertCircle } from "lucide-react";

export default function NotificationsTab({ currentUser, preferences }) {
  const [settings, setSettings] = useState({
    email_task_assigned: true,
    email_leave_approved: true,
    email_leave_rejected: true,
    email_calendar_invites: true,
    email_daily_digest: false,
    push_task_assigned: true,
    push_calendar_reminders: true,
  });
  const [message, setMessage] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (preferences) {
      setSettings(prev => ({
        ...prev,
        ...preferences
      }));
    }
  }, [preferences]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (preferences?.id) {
        return base44.entities.UserPreference.update(preferences.id, data);
      } else {
        return base44.entities.UserPreference.create({
          user_email: currentUser.email,
          ...data
        });
      }
    },
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Notification preferences saved!' });
      setHasChanges(false);
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: 'Failed to save preferences: ' + error.message });
    }
  });

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(settings);
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
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Control which emails you receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'email_task_assigned', label: 'Task Assigned', desc: 'When a task is assigned to you' },
            { key: 'email_leave_approved', label: 'Leave Approved', desc: 'When your leave request is approved' },
            { key: 'email_leave_rejected', label: 'Leave Rejected', desc: 'When your leave request is rejected' },
            { key: 'email_calendar_invites', label: 'Calendar Invitations', desc: 'When invited to events' },
            { key: 'email_daily_digest', label: 'Daily Digest', desc: 'Daily summary of your activities' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-slate-800">{item.label}</p>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
              <Switch
                checked={settings[item.key]}
                onCheckedChange={() => handleToggle(item.key)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>In-app notifications and reminders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'push_task_assigned', label: 'Task Assignments', desc: 'Instant notification when assigned' },
            { key: 'push_calendar_reminders', label: 'Calendar Reminders', desc: 'Reminders before your events' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-slate-800">{item.label}</p>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
              <Switch
                checked={settings[item.key]}
                onCheckedChange={() => handleToggle(item.key)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-2 pt-4">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saveMutation.isPending}
          className="bg-[#7ed957] hover:bg-[#6cc844] text-black"
        >
          {saveMutation.isPending ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}