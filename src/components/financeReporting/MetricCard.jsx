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

  const colorStyles = {
    green: {color: '#92F21D', backgroundColor: 'rgba(146, 242, 29, 0.1)'},
    orange: {color: '#92F21D', backgroundColor: 'rgba(146, 242, 29, 0.1)'},
    red: {color: '#92F21D', backgroundColor: 'rgba(146, 242, 29, 0.1)'},
    slate: {color: '#92F21D', backgroundColor: 'rgba(146, 242, 29, 0.1)'},
  };

  const bgClass = colorClasses[color] || colorClasses.slate;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium mb-1" style={{color: '#ffffff'}}>{title}</p>
            <p className="text-l font-bold" style={{color: '#34CCD0'}}>{formatValue(value)}</p>
          </div>
          <div className="p-2 rounded-lg" style={colorStyles[color] || colorStyles.slate}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}