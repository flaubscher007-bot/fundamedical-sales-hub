import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Link2, CheckCircle2 } from "lucide-react";

export default function CalendarSettings({ currentUser, integrations, onClose }) {
  const googleIntegration = integrations?.find(i => i.calendar_provider === "google");
  const outlookIntegration = integrations?.find(i => i.calendar_provider === "outlook");

  const handleConnectGoogle = async () => {
    // Will be implemented with OAuth flow
    window.location.href = "/api/calendar/auth/google";
  };

  const handleConnectOutlook = async () => {
    // Will be implemented with OAuth flow
    window.location.href = "/api/calendar/auth/outlook";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Calendar Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Google Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-xl">🔵</span>
                Google Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {googleIntegration?.is_connected ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Connected</p>
                    <p className="text-sm text-green-700">Last synced: {googleIntegration.last_sync ? new Date(googleIntegration.last_sync).toLocaleDateString() : "Never"}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 text-sm">Connect your Google Calendar to sync events</p>
              )}
              <Button
                onClick={handleConnectGoogle}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Link2 className="w-4 h-4 mr-2" />
                {googleIntegration?.is_connected ? "Reconnect" : "Connect Google Calendar"}
              </Button>
            </CardContent>
          </Card>

          {/* Outlook Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-xl">🟦</span>
                Outlook Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {outlookIntegration?.is_connected ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Connected</p>
                    <p className="text-sm text-green-700">Last synced: {outlookIntegration.last_sync ? new Date(outlookIntegration.last_sync).toLocaleDateString() : "Never"}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 text-sm">Connect your Outlook Calendar to sync events</p>
              )}
              <Button
                onClick={handleConnectOutlook}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Link2 className="w-4 h-4 mr-2" />
                {outlookIntegration?.is_connected ? "Reconnect" : "Connect Outlook Calendar"}
              </Button>
            </CardContent>
          </Card>

          {/* Sync Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sync Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-600">
              <p>
                ✓ Events created in this app sync to Google Calendar and Outlook automatically
              </p>
              <p>
                ✓ Changes to external calendar events are reflected here
              </p>
              <p>
                ✓ Meetings scheduled with team members automatically create attendee invitations
              </p>
            </CardContent>
          </Card>

          <Button onClick={onClose} className="w-full bg-gray-200 text-gray-900 hover:bg-gray-300">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}