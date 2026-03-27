import React from "react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function StatsCard({ title, value, icon: Icon, color = "teal", trend, href }) {
  const navigate = useNavigate();
  const colorMap = {
    teal: "bg-[#00bcd4]/10 text-[#00bcd4]",
    green: "bg-[#7ed957]/10 text-[#7ed957]",
    navy: "bg-[#0a1628]/10 text-[#0a1628]",
    orange: "bg-orange-100 text-orange-600",
    red: "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <Card
      className={`p-5 border-0 shadow-sm hover:shadow-md transition-shadow duration-300 ${href ? "cursor-pointer hover:ring-2 hover:ring-[#34CCD0]/50" : ""}`}
      onClick={href ? () => navigate(href) : undefined}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider" style={{color: '#92F21D'}}>{title}</p>
          <p className="text-2xl font-bold mt-2" style={{color: '#ffffff'}}>{value}</p>
          {trend && (
            <p className="text-xs font-medium mt-1" style={{color: '#92F21D'}}>{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}