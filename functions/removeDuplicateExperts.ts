import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    // Get all experts
    const allExperts = await base44.asServiceRole.entities.Expert.list();

    // Group by normalized name
    const nameMap = new Map();
    const duplicates = [];

    for (const expert of allExperts) {
      const normalizedName = expert.name?.toLowerCase().trim();
      
      if (!normalizedName) continue;

      if (nameMap.has(normalizedName)) {
        duplicates.push({
          id: expert.id,
          name: expert.name,
          duplicateOf: nameMap.get(normalizedName).name
        });
      } else {
        nameMap.set(normalizedName, { id: expert.id, name: expert.name });
      }
    }

    // Delete duplicates
    let deleted = 0;
    for (const duplicate of duplicates) {
      try {
        await base44.asServiceRole.entities.Expert.delete(duplicate.id);
        deleted++;
      } catch (error) {
        console.error(`Failed to delete expert ${duplicate.id}:`, error.message);
      }
    }

    return Response.json({
      status: 'success',
      message: `Removed ${deleted} duplicate experts`,
      duplicatesFound: duplicates.length,
      deleted,
      duplicates: duplicates.slice(0, 10) // Return first 10 for review
    });
  } catch (error) {
    return Response.json({
      status: 'error',
      message: error.message
    }, { status: 500 });
  }
});