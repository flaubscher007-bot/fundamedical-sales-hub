import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Link2, Unlink2, CheckCircle2, AlertCircle, Clock } from "lucide-react";

export default function SharePointSyncPanel({ onSyncTrigger }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [connectionConfig, setConnectionConfig] = useState({
    siteUrl: "",
    driveId: "",
  });

  const handleConnect = () => {
    // Placeholder for actual OAuth/connection logic
    // When secrets are set up, this will trigger OAuth flow
    console.log("Connecting to SharePoint with config:", connectionConfig);
    // Simulate connection
    setIsConnected(true);
    setShowConnectDialog(false);
    setLastSyncTime(new Date());
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      // Call the provided sync trigger (will invoke backend function)
      if (onSyncTrigger) {
        await onSyncTrigger();
      }
      setLastSyncTime(new Date());
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setLastSyncTime(null);
    setConnectionConfig({ siteUrl: "", driveId: "" });
  };

  return (
    <Card className="funda-card">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-blue-600" /> SharePoint Integration
          </CardTitle>
          <div className="flex items-center gap-2">
            {isConnected && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            {!isConnected && <AlertCircle className="w-5 h-5 text-slate-400" />}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {!isConnected ? (
          <>
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 text-sm">
                SharePoint is not connected. Click below to authorize access and enable automatic syncing of financial documents.
              </AlertDescription>
            </Alert>

            <Button onClick={() => setShowConnectDialog(true)} className="w-full bg-blue-600 hover:bg-blue-700">
              <Link2 className="w-4 h-4 mr-2" /> Connect SharePoint
            </Button>
          </>
        ) : (
          <>
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-sm">
                Successfully connected to SharePoint. Financial documents will sync automatically.
              </AlertDescription>
            </Alert>

            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Connection Status</span>
                <span className="font-semibold text-green-600">Connected</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Last Sync
                </span>
                <span className="font-semibold text-slate-800">
                  {lastSyncTime ? lastSyncTime.toLocaleString('en-ZA') : "Never"}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="flex-1 bg-[#00bcd4] hover:bg-[#0097a7]"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Syncing..." : "Sync Now"}
              </Button>
              <Button onClick={handleDisconnect} variant="outline" className="flex-1">
                <Unlink2 className="w-4 h-4 mr-2" /> Disconnect
              </Button>
            </div>
          </>
        )}
      </CardContent>

      {/* Connection Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Connect to SharePoint</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                You'll be redirected to Microsoft to authorize access. Make sure you have admin access to the SharePoint site.
              </AlertDescription>
            </Alert>

            <div>
              <Label className="text-sm font-medium">SharePoint Site URL *</Label>
              <Input
                placeholder="https://fundamedical.sharepoint.com/sites/Finance"
                value={connectionConfig.siteUrl}
                onChange={(e) => setConnectionConfig({ ...connectionConfig, siteUrl: e.target.value })}
                className="mt-2"
              />
              <p className="text-xs text-slate-500 mt-1">Full URL to your SharePoint site</p>
            </div>

            <div>
              <Label className="text-sm font-medium">Document Library ID (Optional)</Label>
              <Input
                placeholder="Leave blank to use default Documents library"
                value={connectionConfig.driveId}
                onChange={(e) => setConnectionConfig({ ...connectionConfig, driveId: e.target.value })}
                className="mt-2"
              />
              <p className="text-xs text-slate-500 mt-1">Specific drive/library ID if needed</p>
            </div>

            <Alert className="bg-slate-50 border-slate-200">
              <AlertCircle className="h-4 w-4 text-slate-600" />
              <AlertDescription className="text-slate-600 text-xs">
                This integration requires SharePoint API credentials to be configured by your administrator. Contact support if you need help setting this up.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConnect}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!connectionConfig.siteUrl.trim()}
            >
              <Link2 className="w-4 h-4 mr-2" /> Authorize & Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}