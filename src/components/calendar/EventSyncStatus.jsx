import React from "react";
import { Cloud, CloudOff, AlertCircle, Loader } from "lucide-react";

export default function EventSyncStatus({ syncStatus, syncError }) {
  const getSyncIcon = (status) => {
    switch (status) {
      case 'synced':
        return <Cloud className="w-4 h-4 text-green-600" />;
      case 'syncing':
        return <Loader className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <CloudOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSyncText = (status) => {
    switch (status) {
      case 'synced':
        return 'Synced to calendar';
      case 'syncing':
        return 'Syncing...';
      case 'failed':
        return 'Sync failed';
      default:
        return 'Not synced';
    }
  };

  return (
    <div className="flex items-center gap-1">
      {getSyncIcon(syncStatus)}
      <span className="text-xs text-gray-600">{getSyncText(syncStatus)}</span>
      {syncError && (
        <div className="group relative">
          <AlertCircle className="w-3 h-3 text-red-500 cursor-help" />
          <div className="hidden group-hover:block absolute z-10 bg-red-50 border border-red-200 rounded px-2 py-1 text-xs text-red-700 whitespace-nowrap">
            {syncError}
          </div>
        </div>
      )}
    </div>
  );
}