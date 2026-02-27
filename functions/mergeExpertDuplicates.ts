import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Simple similarity score using Levenshtein distance concept
function similarityScore(str1, str2) {
  const s1 = str1?.toLowerCase().trim() || '';
  const s2 = str2?.toLowerCase().trim() || '';
  
  if (s1 === s2) return 1;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;
  
  // Count matching words
  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));
  const common = [...words1].filter(w => words2.has(w)).length;
  const total = Math.max(words1.size, words2.size);
  
  return total > 0 ? common / total : 0;
}

function findDuplicateGroups(experts, threshold = 0.7) {
  const groups = [];
  const processed = new Set();
  
  for (let i = 0; i < experts.length; i++) {
    if (processed.has(experts[i].id)) continue;
    
    const group = [experts[i]];
    processed.add(experts[i].id);
    
    for (let j = i + 1; j < experts.length; j++) {
      if (processed.has(experts[j].id)) continue;
      
      const score = similarityScore(experts[i].name, experts[j].name);
      if (score >= threshold) {
        group.push(experts[j]);
        processed.add(experts[j].id);
      }
    }
    
    if (group.length > 1) {
      groups.push(group);
    }
  }
  
  return groups;
}

function mergeExpertData(primary, secondary) {
  const merged = { ...primary };
  
  // Merge string fields - prefer non-empty, prefer longer
  const stringFields = ['discipline', 'email', 'phone', 'address', 'photo_url', 'biography', 'notes'];
  for (const field of stringFields) {
    if (!merged[field] && secondary[field]) {
      merged[field] = secondary[field];
    } else if (merged[field] && secondary[field] && secondary[field].length > merged[field].length) {
      merged[field] = secondary[field];
    }
  }
  
  // Merge enum fields - prefer active status
  if (!merged.active && secondary.active) {
    merged.active = secondary.active;
  } else if (merged.active === 'SEMI-ACTIVE' && secondary.active === 'YES') {
    merged.active = secondary.active;
  }
  
  // Merge cohort - keep whichever is set
  if (!merged.cohort && secondary.cohort) {
    merged.cohort = secondary.cohort;
  }
  
  // Merge arrays - combine and deduplicate
  const arrayFields = ['specializations', 'publications'];
  for (const field of arrayFields) {
    const primaryArr = merged[field] || [];
    const secondaryArr = secondary[field] || [];
    
    if (field === 'specializations') {
      merged[field] = [...new Set([...primaryArr, ...secondaryArr])];
    } else if (field === 'publications') {
      // Deduplicate publications by title
      const pubMap = new Map();
      [...primaryArr, ...secondaryArr].forEach(pub => {
        if (pub.title && !pubMap.has(pub.title)) {
          pubMap.set(pub.title, pub);
        }
      });
      merged[field] = Array.from(pubMap.values());
    }
  }
  
  return merged;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { threshold = 0.7 } = await req.json();
    const allExperts = await base44.asServiceRole.entities.Expert.list();
    
    const duplicateGroups = findDuplicateGroups(allExperts, threshold);
    
    const results = {
      groupsFound: duplicateGroups.length,
      mergedCount: 0,
      merges: [],
      errors: []
    };

    for (const group of duplicateGroups) {
      // Sort by creation date - keep oldest as primary
      group.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      
      const primary = group[0];
      
      for (let i = 1; i < group.length; i++) {
        try {
          const secondary = group[i];
          const mergedData = mergeExpertData(primary, secondary);
          
          // Update primary with merged data
          await base44.asServiceRole.entities.Expert.update(primary.id, mergedData);
          
          // Delete secondary
          await base44.asServiceRole.entities.Expert.delete(secondary.id);
          
          results.mergedCount++;
          results.merges.push({
            primary: primary.name,
            merged: secondary.name,
            mergedId: secondary.id
          });
        } catch (error) {
          results.errors.push({
            error: error.message,
            primary: primary.name,
            secondary: group[i].name
          });
        }
      }
    }

    return Response.json({
      status: 'success',
      message: `Merged ${results.mergedCount} duplicate experts across ${results.groupsFound} groups`,
      results
    });
  } catch (error) {
    return Response.json({
      status: 'error',
      message: error.message
    }, { status: 500 });
  }
});