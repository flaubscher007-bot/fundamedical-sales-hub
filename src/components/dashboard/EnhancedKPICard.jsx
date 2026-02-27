import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';

export default function EnhancedKPICard({
  title,
  value,
  unit = '',
  trend = null,
  trendPercent = 0,
  icon: Icon = Zap,
  color = 'cyan',
  onClick = null,
  isClickable = false
}) {
  const colorClasses = {
    cyan: 'bg-cyan-500/10 border-[#34CCD0]',
    lime: 'bg-lime-500/10 border-[#92F21D]',
    blue: 'bg-blue-500/10 border-[#00BFFF]',
  };

  const accentColor = {
    cyan: '#34CCD0',
    lime: '#92F21D',
    blue: '#00BFFF',
  }[color];

  return (
    <Card
      className={`relative overflow-hidden ${colorClasses[color]} transition-all ${isClickable ? 'cursor-pointer hover:shadow-lg hover:shadow-cyan-500/20' : ''}`}
      onClick={onClick}
    >
      {/* Background glow */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10" style={{ backgroundColor: accentColor }} />

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-white">{title}</CardTitle>
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${accentColor}20` }}>
            <Icon className="w-5 h-5" style={{ color: accentColor }} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold" style={{ color: accentColor }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {unit && <span className="text-sm text-[#92F21D]">{unit}</span>}
        </div>

        {trend && (
          <div className="flex items-center gap-2">
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
              {Math.abs(trendPercent)}% {trend === 'up' ? 'increase' : 'decrease'}
            </span>
          </div>
        )}

        {isClickable && (
          <div className="text-xs text-[#34CCD0] mt-2">Click to drill down →</div>
        )}
      </CardContent>
    </Card>
  );
}