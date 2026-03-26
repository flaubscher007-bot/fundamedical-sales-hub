import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { firstNames } = await req.json();
    
    if (!Array.isArray(firstNames)) {
      return Response.json({ error: 'firstNames must be an array' }, { status: 400 });
    }

    // Get all BUL name mappings
    const mappings = await base44.entities.BULNameMapping.list();
    
    const resolved = {};
    const unresolved = [];

    for (const firstName of firstNames) {
      const name = firstName.trim();
      const mapping = mappings.find(m => m.first_name.toLowerCase() === name.toLowerCase());
      
      if (mapping) {
        resolved[name] = mapping.full_name;
      } else {
        unresolved.push(name);
      }
    }

    return Response.json({
      status: 'success',
      resolved,
      unresolved,
      message: `Resolved ${Object.keys(resolved).length} names, ${unresolved.length} unresolved`
    });
  } catch (error) {
    return Response.json({
      status: 'error',
      message: error.message
    }, { status: 500 });
  }
});