// Utility function for fuzzy string matching (Levenshtein-like)
export function fuzzyMatch(str1, str2, threshold = 0.7) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  let matches = 0;
  const maxLen = Math.max(s1.length, s2.length);
  
  for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) matches++;
  }
  
  const similarity = matches / maxLen;
  return similarity >= threshold ? similarity : 0;
}

// Find best matching column name
export function findColumn(headers, patterns, fuzzyThreshold = 0.7) {
  for (const pattern of patterns) {
    const exact = headers.find(h => h.toLowerCase().trim() === pattern.toLowerCase().trim());
    if (exact) return exact;
    
    const fuzzy = headers.find(h => fuzzyMatch(h, pattern, fuzzyThreshold) > 0);
    if (fuzzy) return fuzzy;
  }
  return null;
}

// Validate expert import columns
export function validateExpertColumns(headers) {
  const required = [
    { name: 'Expert Name', patterns: ['EXPERT NAME', 'expert_name', 'name'] },
    { name: 'Discipline', patterns: ['DISCIPLINE', 'discipline', 'specialty'] }
  ];
  
  const optional = [
    { name: 'Email', patterns: ['EXPERT EMAIL', 'EMAIL', 'email'] },
    { name: 'Phone', patterns: ['CONTACT', 'PHONE', 'phone'] },
    { name: 'Address', patterns: ['ADDRESS', 'address'] },
    { name: 'Active', patterns: ['ACTIVE', 'active', 'status'] },
    { name: 'Notes', patterns: ['SPECIFICATIONS', 'specifications', 'notes'] }
  ];
  
  const mapped = {};
  const missing = [];
  
  for (const field of required) {
    const found = findColumn(headers, field.patterns);
    if (found) {
      mapped[field.name] = found;
    } else {
      missing.push(field.name);
    }
  }
  
  for (const field of optional) {
    const found = findColumn(headers, field.patterns);
    if (found) {
      mapped[field.name] = found;
    }
  }
  
  return {
    valid: missing.length === 0,
    mapped,
    missing,
    warnings: []
  };
}

// Validate schedule import columns
export function validateScheduleColumns(headers, months = []) {
  const required = [
    { name: 'Expert Name', patterns: ['EXPERT NAME', 'expert_name', 'name'] }
  ];
  
  const mapped = {};
  const missing = [];
  
  for (const field of required) {
    const found = findColumn(headers, field.patterns);
    if (found) {
      mapped[field.name] = found;
    } else {
      missing.push(field.name);
    }
  }
  
  // Check for at least one month column
  const monthColumns = headers.filter(h => months.some(m => fuzzyMatch(h, m) > 0.7));
  mapped['Months'] = monthColumns;
  
  if (monthColumns.length === 0 && months.length > 0) {
    missing.push('At least one month column');
  }
  
  return {
    valid: missing.length === 0,
    mapped,
    missing,
    warnings: monthColumns.length > 0 ? [] : ['No month columns found']
  };
}