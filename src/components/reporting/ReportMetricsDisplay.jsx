import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, CheckCircle2 } from "lucide-react";

export default function ReportMetricsDisplay({ reportData }) {
  if (!reportData) return null;

  const metricCards = [
    {
      title: "Revenue Metrics",
      data: reportData.revenue,
      icon: DollarSign,
      color: "text-green-600",
      fields: ['totalRevenue', 'avgBalance']
    },
    {
      title: "Appointment Performance",
      data: reportData.appointments,
      icon: CheckCircle2,
      color: "text-blue-600",
      fields: ['total', 'completed', 'conversionRate']
    },
    {
      title: "BUL Activity",
      data: reportData.bulActivity,
      icon: TrendingUp,
      color: "text-purple-600",
      fields: ['totalBookings', 'totalDeposits', 'totalVisits']
    },
    {
      title: "User Activity",
      data: reportData.userActivity,
      icon: Users,
      color: "text-amber-600",
      fields: ['activeUsers', 'totalRecords']
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {metricCards.map((card, idx) => {
        if (!card.data) return null;
        const Icon = card.icon;
        return (
          <Card key={idx}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">{card.title}</CardTitle>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {card.fields.map(field => (
                <div key={field} className="flex justify-between text-sm">
                  <span className="text-slate-600 capitalize">
                    {field.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <span className="font-semibold text-slate-900">
                    {typeof card.data[field] === 'number' && field.includes('Rate')
                      ? `${card.data[field]}%`
                      : typeof card.data[field] === 'number'
                      ? card.data[field].toLocaleString()
                      : card.data[field]}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}