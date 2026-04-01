import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Geocode an address string using Nominatim (free OSM geocoder)
async function geocodeAddress(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=za`;
  const res = await fetch(url, { headers: { 'User-Agent': 'FundaMedical-SalesHub/1.0' } });
  const data = await res.json();
  if (data && data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name };
  }
  return null;
}

// Try to extract address from a website using AI
async function getAddressFromWebsite(base44, firmName, website) {
  try {
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Find the physical address of the law firm "${firmName}" in South Africa. Their website is: ${website}. 
Search the web for their contact page or about page to find their street address.
Return ONLY a JSON object with: { "address": "full street address", "city": "city name", "province": "province name" }
If you cannot find a specific address, return the city and province only.
Province must be one of: Western Cape, KwaZulu-Natal, Gauteng, Eastern Cape, Free State, Limpopo, Mpumalanga, North West, Northern Cape`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          address: { type: "string" },
          city: { type: "string" },
          province: { type: "string" }
        }
      }
    });
    return result;
  } catch (e) {
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { mode = 'geocode', clientIds = [] } = body;

    // Get all clients
    const allClients = await base44.asServiceRole.entities.Client.list('firm_name', 1000);

    // Filter to only those needing work
    let toProcess = clientIds.length > 0
      ? allClients.filter(c => clientIds.includes(c.id))
      : allClients.filter(c => !c.latitude || !c.longitude);

    const results = { updated: 0, failed: 0, details: [] };

    for (const client of toProcess) {
      try {
        let lat, lng, geoSource, addressUpdate = {};

        // If client has no address but has a website, try to get address from web
        if (mode === 'enrich' && !client.address && !client.city && client.website) {
          const webAddress = await getAddressFromWebsite(base44, client.firm_name, client.website);
          if (webAddress) {
            addressUpdate = {
              address: webAddress.address || client.address,
              city: webAddress.city || client.city,
              province: webAddress.province || client.province,
            };
          }
          // Small delay to avoid rate limiting
          await new Promise(r => setTimeout(r, 500));
        }

        const city = addressUpdate.city || client.city;
        const province = addressUpdate.province || client.province;
        const address = addressUpdate.address || client.address;

        // Build geocoding query - most specific first
        let geoResult = null;
        if (address && city) {
          geoResult = await geocodeAddress(`${address}, ${city}, ${province || 'South Africa'}`);
          geoSource = 'address';
        }
        if (!geoResult && city && province) {
          geoResult = await geocodeAddress(`${city}, ${province}, South Africa`);
          geoSource = 'city';
        }
        if (!geoResult && city) {
          geoResult = await geocodeAddress(`${city}, South Africa`);
          geoSource = 'city_only';
        }
        if (!geoResult && province) {
          geoResult = await geocodeAddress(`${province}, South Africa`);
          geoSource = 'province_only';
        }
        if (!geoResult) {
          // Try by firm name
          geoResult = await geocodeAddress(`${client.firm_name} attorneys South Africa`);
          geoSource = 'firm_name';
        }

        if (geoResult) {
          lat = geoResult.lat;
          lng = geoResult.lng;
        }

        if (lat && lng) {
          await base44.asServiceRole.entities.Client.update(client.id, {
            latitude: lat,
            longitude: lng,
            geo_source: geoSource,
            ...addressUpdate
          });
          results.updated++;
          results.details.push({ firm: client.firm_name, lat, lng, source: geoSource });
        } else {
          results.failed++;
          results.details.push({ firm: client.firm_name, error: 'Could not geocode' });
        }

        // Respect Nominatim rate limit (1 req/sec)
        await new Promise(r => setTimeout(r, 1100));

      } catch (err) {
        results.failed++;
        results.details.push({ firm: client.firm_name, error: err.message });
      }
    }

    return Response.json({ success: true, total: toProcess.length, ...results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});