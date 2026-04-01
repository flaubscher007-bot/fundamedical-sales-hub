import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function normalizeName(name) {
  return (name || "")
    .toLowerCase()
    .replace(/\b(attorneys|attorney|inc|incorporated|law|firm|and|&|the|of|cc|pty|ltd|legal|advocates|advocate|consultants|consultant|partners|partner)\b/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function fuzzyMatch(inputName, clients) {
  const normInput = normalizeName(inputName);
  const inputWords = normInput.split(" ").filter(w => w.length > 2);
  let bestMatch = null;
  let bestScore = 0;

  for (const client of clients) {
    const normClient = normalizeName(client.firm_name);
    if (normInput === normClient) return client;
    if (normInput.includes(normClient) || normClient.includes(normInput)) return client;
    const clientWords = normClient.split(" ").filter(w => w.length > 2);
    const overlap = inputWords.filter(w => clientWords.includes(w));
    const minLen = Math.min(inputWords.length, clientWords.length);
    if (minLen > 0) {
      const score = overlap.length / minLen;
      if (score >= 0.6 && score > bestScore) {
        bestScore = score;
        bestMatch = client;
      }
    }
  }
  return bestMatch;
}

function extractProvince(address) {
  const provinces = ["Western Cape", "KwaZulu-Natal", "Gauteng", "Eastern Cape", "Free State", "Limpopo", "Mpumalanga", "North West", "Northern Cape"];
  for (const p of provinces) {
    if (address.toLowerCase().includes(p.toLowerCase())) return p;
  }
  // Common city hints
  if (/\bjohannesburg\b|\bsandton\b|\bsoweto\b|\bcenturion\b|\bpretoria\b|\bmidrand\b|\bfourways\b|\bbryanston\b|\bbenoni\b|\bgermiston\b|\bvereeniging\b/i.test(address)) return "Gauteng";
  if (/\bcape town\b|\bstellenbosch\b|\bgeorge\b|\bpaarl\b|\bworcester\b|\bknysna\b|\bmossel bay\b/i.test(address)) return "Western Cape";
  if (/\bdurban\b|\bpietermaritzburg\b|\bnewcastle\b|\brichards bay\b/i.test(address)) return "KwaZulu-Natal";
  if (/\beast london\b|\bport elizabeth\b|\bgqeberha\b|\bgrahamstown\b|\bumtata\b/i.test(address)) return "Eastern Cape";
  if (/\bbloemfontein\b|\bwelkom\b/i.test(address)) return "Free State";
  if (/\bpolokwane\b|\blimpopo\b/i.test(address)) return "Limpopo";
  if (/\bnelspruit\b|\bmbombela\b|\bwitbank\b|\bsecunda\b/i.test(address)) return "Mpumalanga";
  if (/\bkimberley\b/i.test(address)) return "Northern Cape";
  if (/\brustenburg\b|\bmafikeng\b|\bklerksdorp\b/i.test(address)) return "North West";
  return null;
}

function extractCity(address) {
  const cityPatterns = [
    /\b(johannesburg|sandton|fourways|bryanston|randburg|roodepoort|soweto|benoni|germiston|boksburg|centurion|pretoria|midrand|krugersdorp|vereeniging)\b/i,
    /\b(cape town|stellenbosch|george|paarl|worcester|knysna|mossel bay|hermanus)\b/i,
    /\b(durban|pietermaritzburg|newcastle|richards bay|port shepstone|umhlanga)\b/i,
    /\b(east london|port elizabeth|gqeberha|grahamstown|umtata|mthatha|king william|queenstown)\b/i,
    /\b(bloemfontein|welkom|sasolburg)\b/i,
    /\b(polokwane|tzaneen|lephalale)\b/i,
    /\b(nelspruit|mbombela|witbank|emalahleni|secunda)\b/i,
    /\b(kimberley|upington)\b/i,
    /\b(rustenburg|mafikeng|mahikeng|klerksdorp|potchefstroom)\b/i,
  ];
  for (const pat of cityPatterns) {
    const m = address.match(pat);
    if (m) return m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
  }
  return null;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || !["admin", "Sales Manager", "senior_management"].includes(user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { addresses } = await req.json();
  if (!addresses?.length) return Response.json({ error: "No addresses provided" }, { status: 400 });

  const clients = await base44.asServiceRole.entities.Client.list();
  const results = { updated: 0, skipped: 0, notFound: [] };

  for (const { firm_name, address } of addresses) {
    const match = fuzzyMatch(firm_name, clients);
    if (!match) {
      results.notFound.push(firm_name);
      results.skipped++;
      continue;
    }
    const updateData = { address };
    const province = extractProvince(address);
    const city = extractCity(address);
    if (province && !match.province) updateData.province = province;
    if (city && !match.city) updateData.city = city;

    await base44.asServiceRole.entities.Client.update(match.id, updateData);
    results.updated++;
  }

  return Response.json(results);
});