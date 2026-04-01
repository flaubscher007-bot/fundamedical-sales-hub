import React, { useState } from "react";
import { ExternalLink, ChevronDown, ChevronUp, CheckCircle2, Info } from "lucide-react";

const models = [
  {
    id: 1,
    tag: "UPFRONT",
    title: "Discounted Upfront Payment",
    subtitle: "Pay once on delivery — receive an immediate discount",
    color: "#92F21D",
    bg: "rgba(146,242,29,0.08)",
    border: "rgba(146,242,29,0.3)",
    deposit: "None",
    payable: "R18 400 on delivery of report",
    term: "Once-off — no ongoing obligations",
    interest: "None",
    maxTerm: "N/A",
    provider: "FundaMedical",
    providerUrl: null,
    highlights: [
      "Best value — largest discount available",
      "Full invoice issued (e.g. R30 000)",
      "Credit note issued for the discount (e.g. R11 600)",
      "Attorney only pays R18 400 net",
      "Clean books — no deferred liability",
    ],
    example: {
      title: "Example",
      rows: [
        ["Expert report invoice", "R30 000"],
        ["Credit note (discount)", "−R11 600"],
        ["Amount payable by attorney", "R18 400"],
        ["Interest", "None"],
        ["When to pay", "On delivery of report"],
      ],
    },
    note: "The full invoice and credit note are issued simultaneously. The net amount payable is always R18 400 regardless of the expert's full rate.",
  },
  {
    id: 2,
    tag: "36-MONTH ZERO COST",
    title: "36 Months — Zero Cost (Christopher Finance)",
    subtitle: "No deposit. No interest for 36 months per invoice. Settle early, pay nothing extra.",
    color: "#34CCD0",
    bg: "rgba(52,204,208,0.08)",
    border: "rgba(52,204,208,0.3)",
    deposit: "R0 — No deposit required",
    payable: "Full invoice deferred — settle when the matter settles",
    term: "36 months per invoice, interest-free",
    interest: "Interest runs from month 37 if unsettled",
    maxTerm: "72 months from first invoice on the matter",
    provider: "Christopher Finance",
    providerUrl: "https://christophergroup.co.za/36-month-zero-cost-product/",
    highlights: [
      "Zero deposit — no upfront cash required",
      "No costs or interest for the first 36 months",
      "Each expert has their own invoice with its own 36-month clock",
      "Matter maximum is 72 months from the first invoice",
      "Settle before 36 months = no additional cost whatsoever",
      "Interest only starts at month 37 if matter is still open",
    ],
    example: {
      title: "Example — Matter settles at month 28",
      rows: [
        ["Expert A invoice (month 1)", "R25 000"],
        ["Expert B invoice (month 6)", "R18 000"],
        ["Matter settles at month 28", ""],
        ["Expert A — within 36 months", "R25 000 (no interest)"],
        ["Expert B — within 36 months", "R18 000 (no interest)"],
        ["Total paid", "R43 000"],
      ],
    },
    example2: {
      title: "Example — Matter still open at month 40",
      rows: [
        ["Expert A invoice (month 1)", "R25 000"],
        ["36-month free period ends", "Month 37"],
        ["Interest from month 37", "Running until settlement"],
        ["Matter max term", "72 months from Expert A invoice"],
      ],
    },
    note: "Each invoice has its own independent 36-month interest-free period. The 72-month hard cap applies to the overall matter from the date of the first invoice.",
  },
  {
    id: 3,
    tag: "R11 500 DEPOSIT — 48 MONTHS",
    title: "R11 500 Deposit — 48 Month Settlement",
    subtitle: "Pay a deposit, defer the balance — up to 4 years interest-free",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.3)",
    deposit: "R11 500 per invoice",
    payable: "Balance of invoice deferred",
    term: "48 months from invoice date, interest-free",
    interest: "2% per month on invoice from month 49",
    maxTerm: "72 months",
    provider: "FundaMedical",
    providerUrl: null,
    highlights: [
      "Deposit of R11 500 confirms the booking",
      "Balance deferred for up to 48 months",
      "No interest if matter settles within 48 months",
      "2% per month interest applies from month 49",
      "Maximum matter term is 72 months",
    ],
    example: {
      title: "Example — Invoice of R30 000",
      rows: [
        ["Invoice amount", "R30 000"],
        ["Deposit payable now", "R11 500"],
        ["Balance deferred", "R18 500"],
        ["Settle within 48 months", "Pay R18 500 — no interest"],
        ["If unsettled at month 49", "2% p/m interest on R30 000"],
        ["Maximum term", "72 months"],
      ],
    },
    note: "The 2% per month interest applies to the original invoice amount from month 49. Settling promptly within the 48-month window avoids all interest charges.",
  },
  {
    id: 4,
    tag: "R5 750 DEPOSIT — 48 MONTHS",
    title: "R5 750 Deposit — 48 Month Settlement (Christopher Finance)",
    subtitle: "Lower deposit entry — same 48-month term with Christopher Finance backing",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.3)",
    deposit: "R5 750 per invoice",
    payable: "Balance of invoice deferred",
    term: "48 months from invoice date, interest-free",
    interest: "Interest runs from month 49 if unsettled",
    maxTerm: "72 months",
    provider: "Christopher Finance",
    providerUrl: "https://christophergroup.co.za/36-month-zero-cost-product/",
    highlights: [
      "Lower deposit than Option 3 (R5 750 vs R11 500)",
      "Extra year compared to the 36-month product",
      "No interest for 48 months",
      "Interest starts from month 49 if unsettled",
      "Maximum matter term is 72 months",
      "Backed by Christopher Finance",
    ],
    example: {
      title: "Example — Invoice of R30 000",
      rows: [
        ["Invoice amount", "R30 000"],
        ["Deposit payable now", "R5 750"],
        ["Balance deferred", "R24 250"],
        ["Settle within 48 months", "Pay R24 250 — no interest"],
        ["If unsettled at month 49", "Interest starts running"],
        ["Maximum term", "72 months"],
      ],
    },
    note: "This product offers the lowest deposit entry point for firms that need maximum cash flow flexibility while still gaining the extended 48-month settlement window.",
  },
];

function ModelCard({ model }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all"
      style={{ borderColor: model.border, backgroundColor: model.bg }}
    >
      {/* Header */}
      <button
        className="w-full text-left p-5 flex items-start gap-4"
        onClick={() => setOpen(o => !o)}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-black text-lg flex-shrink-0 mt-0.5"
          style={{ backgroundColor: model.color, color: "#081F3F" }}
        >
          {model.id}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-black px-2 py-0.5 rounded"
              style={{ backgroundColor: model.color, color: "#081F3F" }}
            >
              {model.tag}
            </span>
            {model.provider !== "FundaMedical" && (
              <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(52,204,208,0.15)", color: "#34CCD0" }}>
                via {model.provider}
              </span>
            )}
          </div>
          <h3 className="font-bold text-base mt-1" style={{ color: model.color }}>{model.title}</h3>
          <p className="text-sm mt-0.5" style={{ color: "#cbd5e1" }}>{model.subtitle}</p>

          {/* Quick summary row */}
          <div className="flex flex-wrap gap-4 mt-3">
            <div>
              <p className="text-xs" style={{ color: "#94a3b8" }}>Deposit</p>
              <p className="text-sm font-semibold" style={{ color: "#fff" }}>{model.deposit}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "#94a3b8" }}>Interest-free term</p>
              <p className="text-sm font-semibold" style={{ color: "#fff" }}>{model.term}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "#94a3b8" }}>Max term</p>
              <p className="text-sm font-semibold" style={{ color: "#fff" }}>{model.maxTerm}</p>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 mt-1">
          {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="px-5 pb-5 space-y-5 border-t" style={{ borderColor: model.border }}>
          {/* Highlights */}
          <div className="pt-4">
            <p className="text-xs font-bold mb-2" style={{ color: model.color }}>KEY FEATURES</p>
            <ul className="space-y-1.5">
              {model.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: model.color }} />
                  <span style={{ color: "#e2e8f0" }}>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Interest info */}
          <div className="rounded-lg px-4 py-3" style={{ backgroundColor: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)" }}>
            <p className="text-xs font-bold mb-1" style={{ color: "#f43f5e" }}>AFTER TERM — INTEREST</p>
            <p className="text-sm" style={{ color: "#fca5a5" }}>{model.interest}</p>
          </div>

          {/* Example tables */}
          {[model.example, model.example2].filter(Boolean).map((ex, ei) => (
            <div key={ei}>
              <p className="text-xs font-bold mb-2" style={{ color: model.color }}>{ex.title.toUpperCase()}</p>
              <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${model.border}` }}>
                <table className="w-full text-sm">
                  <tbody>
                    {ex.rows.map(([label, value], ri) => (
                      <tr key={ri} style={{ backgroundColor: ri % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent" }}>
                        <td className="px-3 py-2" style={{ color: "#94a3b8" }}>{label}</td>
                        <td className="px-3 py-2 text-right font-semibold" style={{ color: value ? "#fff" : "transparent" }}>{value || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Note */}
          {model.note && (
            <div className="flex gap-2 rounded-lg px-3 py-2.5" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: model.color }} />
              <p className="text-xs" style={{ color: "#94a3b8" }}>{model.note}</p>
            </div>
          )}

          {/* Provider link */}
          {model.providerUrl && (
            <a
              href={model.providerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
              style={{ color: model.color }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              More info — {model.provider}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function PricingModels() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-xl p-5" style={{ background: "linear-gradient(135deg, rgba(146,242,29,0.1) 0%, rgba(52,204,208,0.1) 100%)", border: "1px solid rgba(146,242,29,0.25)" }}>
        <h1 className="text-2xl font-black" style={{ color: "#92F21D" }}>FundaMedical Pricing Models</h1>
        <p className="text-sm mt-1" style={{ color: "#34CCD0" }}>
          Four flexible financing options for personal injury attorneys managing expert medico-legal report costs
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs" style={{ color: "#94a3b8" }}>
          <span>📞 (010) 594 9470</span>
          <span>✉️ info@fundamedical.co.za</span>
          <span>🌐 www.fundamedical.co.za</span>
        </div>
      </div>

      {/* Comparison quick-view */}
      <div className="rounded-xl border overflow-x-auto" style={{ borderColor: "rgba(52,204,208,0.2)", backgroundColor: "rgba(8,31,63,0.6)" }}>
        <table className="w-full text-xs min-w-[540px]">
          <thead>
            <tr style={{ backgroundColor: "rgba(52,204,208,0.1)" }}>
              <th className="px-4 py-3 text-left" style={{ color: "#34CCD0" }}>Option</th>
              <th className="px-4 py-3 text-left" style={{ color: "#34CCD0" }}>Deposit</th>
              <th className="px-4 py-3 text-left" style={{ color: "#34CCD0" }}>Interest-free period</th>
              <th className="px-4 py-3 text-left" style={{ color: "#34CCD0" }}>After term</th>
              <th className="px-4 py-3 text-left" style={{ color: "#34CCD0" }}>Max term</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["1 — Upfront", "None", "N/A (once-off)", "No interest", "N/A"],
              ["2 — 36 Month Zero Cost", "None", "36 months / invoice", "Interest from month 37", "72 months"],
              ["3 — R11 500 Deposit", "R11 500", "48 months", "2% p/m from month 49", "72 months"],
              ["4 — R5 750 Deposit", "R5 750", "48 months", "Interest from month 49", "72 months"],
            ].map(([opt, dep, term, after, max], i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                <td className="px-4 py-2.5 font-semibold" style={{ color: "#92F21D" }}>{opt}</td>
                <td className="px-4 py-2.5" style={{ color: "#fff" }}>{dep}</td>
                <td className="px-4 py-2.5" style={{ color: "#fff" }}>{term}</td>
                <td className="px-4 py-2.5" style={{ color: "#f87171" }}>{after}</td>
                <td className="px-4 py-2.5" style={{ color: "#fff" }}>{max}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Model cards */}
      <div className="space-y-4">
        {models.map(model => <ModelCard key={model.id} model={model} />)}
      </div>

      <p className="text-xs text-center pb-4" style={{ color: "#475569" }}>
        * Interest may apply after the settlement period. Maximum of 6 years (72 months) per matter.
        Christopher Finance products are subject to their terms and conditions.
      </p>
    </div>
  );
}