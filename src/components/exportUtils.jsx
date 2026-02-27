import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Convert data to CSV format
 */
export const generateCSV = (data, columns, fileName) => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const headers = columns.map(col => col.label);
  const rows = data.map(row => 
    columns.map(col => {
      const value = row[col.key];
      // Handle nested objects
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      return value || '';
    })
  );

  // Create CSV content
  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Convert data to PDF format with table
 */
export const generatePDF = (data, columns, fileName, title = '') => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Add title
  if (title) {
    doc.setFontSize(16);
    doc.text(title, pageWidth / 2, 15, { align: 'center' });
  }

  // Add date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 25);

  // Prepare table data
  const headers = columns.map(col => col.label);
  const rows = data.map(row =>
    columns.map(col => {
      const value = row[col.key];
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value).substring(0, 50);
      }
      return String(value || '').substring(0, 50);
    })
  );

  // Add table
  doc.autoTable({
    head: [headers],
    body: rows,
    startY: 35,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [52, 204, 208],
      textColor: [8, 31, 63],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [10, 30, 58],
    },
    margin: { top: 35 },
  });

  // Download
  doc.save(`${fileName}.pdf`);
};

/**
 * Filter data by date range
 */
export const filterByDateRange = (data, dateField, startDate, endDate) => {
  if (!startDate && !endDate) return data;

  return data.filter(item => {
    const itemDate = new Date(item[dateField]);
    if (startDate && itemDate < new Date(startDate)) return false;
    if (endDate && itemDate > new Date(endDate)) return false;
    return true;
  });
};