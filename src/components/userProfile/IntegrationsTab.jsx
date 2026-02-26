import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link2, Unlink2, Check, AlertCircle } from "lucide-react";

const INTEGRATIONS = [
  { 
    id: 'google', 
    name: 'Google Calendar', 
    description: 'Sync your Google Calendar events with the team calendar',
    icon: '🔵'
  },
  { 
    id: 'outlook', 
    name: 'Outlook Calendar', 
    description: 'Sync your Outlook/Microsoft Calendar with the team calendar',
    icon: '📧'
  },
];

export default function IntegrationsTab({ currentUser, integrations }) {
  const [message, setMessage] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const qc = useQueryClient();

  const disconnectMutation = useMutation({
    mutationFn: (id) => base44.entities.CalendarIntegration.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendarIntegrations"] });
      setMessage({ type: 'success', text: 'Integration disconnected successfully!' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: 'Failed to disconnect: ' + error.message });
    }
  });

  const isConnected = (provider) => {
    return integrations.some(i => i.calendar_provider === provider && i.is_connected);
  };

  const handleConnect = async (provider) => {
    setConnecting(provider);
    setMessage(null);
    try {
      // In production, this would use OAuth flow
      // For now, create a record
      await base44.entities.CalendarIntegration.create({
        user_email: currentUser.email,
        user_name: currentUser.full_name,
        calendar_provider: provider,
        is_connected: true,
        sync_enabled: true,
        sync_direction: 'bidirectional'
      });
      qc.invalidateQueries({ queryKey: ["calendarIntegrations"] });
      setMessage({ type: 'success', text: `${INTEGRATIONS.find(i => i.id === provider)?.name} connected!` });
    } catch (error) {
      setMessage({ type: 'error', text: 'Connection failed: ' + error.message });
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = (integrationId) => {
    if (confirm('Are you sure you want to disconnect this calendar?')) {
      disconnectMutation.mutate(integrationId);
    }
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

      <div className="grid gap-4">
        {INTEGRATIONS.map(integration => {
          const connected = isConnected(integration.id);
          const integrationData = integrations.find(i => i.calendar_provider === integration.id);

          return (
            <Card key={integration.id} className={connected ? 'border-green-200 bg-green-50/30' : ''}>
              <CardHeader className="flex flex-row items-start justify-between pb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl">{integration.icon}</span>
                    <CardTitle className="text-base">{integration.name}</CardTitle>
                    {connected && (
                      <span className="inline-block px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                        Connected
                      </span>
                    )}
                  </div>
                  <CardDescription>{integration.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {connected ? (
                    <Button
                      variant="destructive"
                      onClick={() => handleDisconnect(integrationData?.id)}
                      disabled={disconnectMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Unlink2 className="w-4 h-4" />
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleConnect(integration.id)}
                      disabled={connecting === integration.id}
                      className="bg-[#00bcd4] hover:bg-[#0097a7] flex items-center gap-2"
                    >
                      <Link2 className="w-4 h-4" />
                      {connecting === integration.id ? 'Connecting...' : 'Connect'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">About Integrations</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-700 space-y-2">
          <p>• Connected calendars will sync events automatically</p>
          <p>• Two-way sync keeps your calendars up-to-date</p>
          <p>• You can manage sync preferences once connected</p>
        </CardContent>
      </Card>
    </div>
  );
}