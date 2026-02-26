import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Bell, Link2, Shield } from "lucide-react";
import ProfileTab from "@/components/userProfile/ProfileTab";
import NotificationsTab from "@/components/userProfile/NotificationsTab";
import IntegrationsTab from "@/components/userProfile/IntegrationsTab";
import AdminPermissionsTab from "@/components/userProfile/AdminPermissionsTab";

export default function UserProfile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u);
      setLoading(false);
    }).catch(() => {
      base44.auth.redirectToLogin();
    });
  }, []);

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
    enabled: currentUser?.role === 'admin'
  });

  const { data: userPreferences = null } = useQuery({
    queryKey: ["userPreference", currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return null;
      const prefs = await base44.entities.UserPreference.filter({ user_email: currentUser.email });
      return prefs?.length > 0 ? prefs[0] : null;
    },
    enabled: !!currentUser?.email
  });

  const { data: calendarIntegrations = [] } = useQuery({
    queryKey: ["calendarIntegrations", currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return base44.entities.CalendarIntegration.filter({ user_email: currentUser.email });
    },
    enabled: !!currentUser?.email
  });

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!currentUser) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
        <p className="text-slate-600 mt-1">Manage your profile, preferences, and integrations</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Integrations
          </TabsTrigger>
          {currentUser?.role === 'admin' && (
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Permissions
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileTab currentUser={currentUser} />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationsTab currentUser={currentUser} preferences={userPreferences} />
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <IntegrationsTab currentUser={currentUser} integrations={calendarIntegrations} />
        </TabsContent>

        {currentUser?.role === 'admin' && (
          <TabsContent value="permissions" className="mt-6">
            <AdminPermissionsTab users={users} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}