import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function MetricCard({ title, value, icon: Icon, color, isCurrency }) {
  const formatValue = (val) => {
    if (isCurrency) {
      return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 0,
      }).format(val || 0);
    }
    return typeof val === 'number' ? val.toLocaleString() : val;
  };

  const colorClasses = {
    green: "text-green-600 bg-green-50",
    orange: "text-orange-600 bg-orange-50",
    red: "text-red-600 bg-red-50",
    slate: "text-slate-600 bg-slate-50",
  };

  const bgClass = colorClasses[color] || colorClasses.slate;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-slate-900">{formatValue(value)}</p>
          </div>
          <div className={`p-2 rounded-lg ${bgClass}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}