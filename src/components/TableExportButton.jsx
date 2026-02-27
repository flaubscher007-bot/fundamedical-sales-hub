import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import ExportDialog from './ExportDialog';

export default function TableExportButton({
  data,
  columns,
  fileName = 'export',
  title = '',
  dateField = null
}) {
  const [isExportOpen, setIsExportOpen] = useState(false);

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setIsExportOpen(true)}
        variant="outline"
        className="text-white border-[#34CCD0] hover:bg-[#0a2d52]"
      >
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>

      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        data={data}
        columns={columns}
        fileName={fileName}
        title={title}
        dateField={dateField}
      />
    </>
  );
}