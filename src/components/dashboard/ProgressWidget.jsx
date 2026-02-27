import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProgressWidget({
  title,
  current,
  target,
  unit = '',
  color = 'lime',
}) {
  const percentage = target > 0 ? (current / target) * 100 : 0;
  const clampedPercentage = Math.min(percentage, 100);

  const colorClasses = {
    lime: { bg: 'bg-[#92F21D]', text: 'text-[#92F21D]' },
    cyan: { bg: 'bg-[#34CCD0]', text: 'text-[#34CCD0]' },
    blue: { bg: 'bg-[#00BFFF]', text: 'text-[#00BFFF]' },
  };

  const { bg, text } = colorClasses[color];

  const status =
    percentage >= 100 ? 'Exceeded' :
    percentage >= 75 ? 'On Track' :
    percentage >= 50 ? 'In Progress' :
    'Behind';

  const statusColor =
    percentage >= 100 ? 'text-green-500' :
    percentage >= 75 ? 'text-[#92F21D]' :
    percentage >= 50 ? 'text-[#34CCD0]' :
    'text-red-500';

  return (
    <Card className="border-2 border-[#34CCD0] bg-[#081F3F]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-white">{title}</CardTitle>
          <span className={`text-xs font-semibold ${statusColor}`}>{status}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress bar with glow */}
        <div className="space-y-2">
          <div className="relative h-8 bg-[#0a2d52] rounded-full overflow-hidden border border-[#34CCD0]">
            <div
              className={`h-full ${bg} transition-all duration-500 ease-out relative`}
              style={{
                width: `${clampedPercentage}%`,
                boxShadow: `0 0 20px ${color === 'lime' ? 'rgba(146, 242, 29, 0.5)' : 'rgba(52, 204, 208, 0.5)'}`,
              }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 animate-pulse opacity-50" />
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex gap-4">
              <div>
                <p className="text-[#92F21D] text-xs">Current</p>
                <p className={`font-semibold ${text}`}>
                  {current.toLocaleString()}{unit && ` ${unit}`}
                </p>
              </div>
              <div>
                <p className="text-[#92F21D] text-xs">Target</p>
                <p className={`font-semibold ${text}`}>
                  {target.toLocaleString()}{unit && ` ${unit}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[#92F21D] text-xs">Progress</p>
              <p className={`font-bold text-lg ${text}`}>
                {percentage.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}