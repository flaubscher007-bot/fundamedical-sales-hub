// BUL Territory Configuration
export const BUL_TERRITORY_MAP = [
  { name: "Dylan", provinces: ["Western Cape", "KwaZulu-Natal"] },
  { name: "Jacques", provinces: ["Eastern Cape"] },
  { name: "George", provinces: ["Free State", "Northern Cape"] },
  { name: "Duran", provinces: ["Mpumalanga"] },
  { name: "Nthabiseng", provinces: ["Limpopo", "North West"] },
  { name: "All BULs (Shared)", provinces: ["Gauteng"] },
];

export const BUL_COLORS = {
  Dylan: "#34CCD0",
  Jacques: "#f59e0b",
  George: "#a78bfa",
  Duran: "#fb923c",
  Nthabiseng: "#f43f5e",
  "All BULs (Shared)": "#92F21D",
};

export const PROVINCES = [
  "Western Cape", "KwaZulu-Natal", "Gauteng", "Eastern Cape",
  "Free State", "Limpopo", "Mpumalanga", "North West", "Northern Cape",
];

export const SPECIALTIES = [
  { value: "personal_injury", label: "Personal Injury" },
  { value: "medical_negligence", label: "Medical Negligence" },
  { value: "both", label: "Both (PI & Med Neg)" },
  { value: "raf_mva", label: "Road Accident Fund / MVA" },
  { value: "coida", label: "COIDA / Workmen's Compensation" },
];

export const OUTCOME_COLORS = {
  "Pending": "bg-slate-700 text-slate-300 border-slate-600",
  "Interested": "bg-green-900/50 text-green-400 border-green-700",
  "Not Interested": "bg-red-900/50 text-red-400 border-red-700",
  "No Response": "bg-yellow-900/50 text-yellow-400 border-yellow-700",
  "Follow-Up Required": "bg-orange-900/50 text-orange-400 border-orange-700",
  "Converted": "bg-cyan-900/50 text-cyan-400 border-cyan-700",
};

// Helper Functions
export function getBULSuggestion(firms) {
  if (!firms?.length) return null;
  const provinceCounts = {};
  firms.forEach(f => {
    if (f.province) {
      provinceCounts[f.province] = (provinceCounts[f.province] || 0) + 1;
    }
  });
  const sorted = Object.entries(provinceCounts).sort((a, b) => b[1] - a[1]);
  if (!sorted.length) return null;
  const topProvince = sorted[0][0];
  const territory = BUL_TERRITORY_MAP.find(t =>
    t.provinces.some(p => topProvince.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(topProvince.toLowerCase()))
  );
  return { bul: territory?.name || null, topProvince, sorted };
}

export function normName(s) {
  return (s || "").toLowerCase().replace(/[^a-z\s]/g, "").replace(/\b(attorneys|attorney|inc|incorporated|law|firm|and|the|of|cc|pty|ltd|legal|advocates|advocate)\b/g, "").replace(/\s+/g, " ").trim();
}

export function normalizeName(name) {
  return (name || "")
    .toLowerCase()
    .replace(/\b(attorneys|attorney|inc|incorporated|law|firm|and|&|the|of|cc|pty|ltd|legal|advocates|advocate|consultants|consultant)\b/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function fuzzyMatch(firmName, clients) {
  const normFirm = normalizeName(firmName);
  const firmWords = normFirm.split(" ").filter(w => w.length > 2);
  for (const client of clients) {
    const normClient = normalizeName(client.firm_name);
    const clientWords = normClient.split(" ").filter(w => w.length > 2);
    if (normFirm === normClient) return client;
    if (normFirm.includes(normClient) || normClient.includes(normFirm)) return client;
    const overlap = firmWords.filter(w => clientWords.includes(w));
    const minLen = Math.min(firmWords.length, clientWords.length);
    if (minLen > 0 && overlap.length / minLen >= 0.7) return client;
  }
  return null;
}

export function isSavedLead(name, savedLeads) {
  if (!name) return false;
  const n = normName(name);
  return savedLeads.some(l => { 
    const ln = normName(l.name); 
    return ln === n || ln.includes(n) || n.includes(ln); 
  });
}

export const QUALITY_COLORS = {
  "High": "bg-green-900/50 text-green-400 border-green-700",
  "Medium": "bg-yellow-900/50 text-yellow-400 border-yellow-700",
  "Low": "bg-slate-700 text-slate-300 border-slate-600"
};

export const VISIBLE_COUNT = 10;