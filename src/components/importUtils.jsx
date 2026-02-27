/**
 * Convert import results to CSV format
 */
export function generateImportReportCSV(records, importType = 'expert') {
  if (!records || records.length === 0) {
    return 'No records to export';
  }

  const headers = [
    'Row Number',
    importType === 'expert' ? 'Expert Name' : 'Expert Name',
    importType === 'expert' ? 'Status' : 'BUL Assigned',
    'Action',
    'Status',
    'Error'
  ];

  const rows = records.map(r => [
    r.rowNumber,
    r.expert_name || '',
    importType === 'expert' ? r.status : (r.bul_assigned || ''),
    r.action || 'N/A',
    r.status || 'success',
    r.error || ''
  ]);

  // Build CSV
  let csv = headers.map(h => `"${h}"`).join(',') + '\n';
  csv += rows.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  return csv;
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Format import results summary
 */
export function formatImportSummary(results) {
  return {
    total: results.records?.length || 0,
    created: results.created || 0,
    updated: results.updated || 0,
    failed: results.failed || 0,
    successRate: results.records ? 
      Math.round(((results.records.length - results.failed) / results.records.length) * 100) : 0
  };
}