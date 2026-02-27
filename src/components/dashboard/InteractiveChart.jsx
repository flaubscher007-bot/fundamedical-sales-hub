import React, { useState } from 'react';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = ['#92F21D', '#34CCD0', '#00BFFF', '#7fd91a', '#00d4d4', '#00a8c8'];

export function InteractivePieChart({
  data,
  dataKey = 'value',
  nameKey = 'name',
  title = '',
  onSegmentClick = null,
}) {
  const [activeIndex, setActiveIndex] = useState(null);

  const handleClick = (data, index) => {
    setActiveIndex(index);
    onSegmentClick?.(data, index);
  };

  return (
    <Card className="border-2 border-[#34CCD0] bg-[#081F3F]">
      <CardHeader>
        <CardTitle className="text-[#92F21D]">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey={dataKey}
              onClick={(entry, index) => handleClick(entry, index)}
              cursor="pointer"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.5}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#0a1e3a', border: '2px solid #34CCD0', color: '#fff' }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        {onSegmentClick && (
          <div className="text-center text-xs text-[#92F21D] mt-4">Click segments to view details</div>
        )}
      </CardContent>
    </Card>
  );
}

export function InteractiveBarChart({
  data,
  dataKey = 'value',
  xAxisKey = 'name',
  title = '',
  onBarClick = null,
}) {
  const [activeIndex, setActiveIndex] = useState(null);

  const handleClick = (data, index) => {
    setActiveIndex(index);
    onBarClick?.(data, index);
  };

  return (
    <Card className="border-2 border-[#34CCD0] bg-[#081F3F]">
      <CardHeader>
        <CardTitle className="text-[#92F21D]">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#0a2d52" />
            <XAxis dataKey={xAxisKey} stroke="#92F21D" />
            <YAxis stroke="#92F21D" />
            <Tooltip contentStyle={{ backgroundColor: '#0a1e3a', border: '2px solid #34CCD0', color: '#fff' }} />
            <Bar
              dataKey={dataKey}
              fill="#92F21D"
              onClick={(entry, index) => handleClick(entry, index)}
              cursor="pointer"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={activeIndex === null || activeIndex === index ? '#92F21D' : '#34CCD0'}
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.5}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {onBarClick && (
          <div className="text-center text-xs text-[#92F21D] mt-4">Click bars to view details</div>
        )}
      </CardContent>
    </Card>
  );
}

export function InteractiveLineChart({
  data,
  dataKeys = [],
  xAxisKey = 'name',
  title = '',
}) {
  return (
    <Card className="border-2 border-[#34CCD0] bg-[#081F3F]">
      <CardHeader>
        <CardTitle className="text-[#92F21D]">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#0a2d52" />
            <XAxis dataKey={xAxisKey} stroke="#92F21D" />
            <YAxis stroke="#92F21D" />
            <Tooltip contentStyle={{ backgroundColor: '#0a1e3a', border: '2px solid #34CCD0', color: '#fff' }} />
            <Legend />
            {dataKeys.map((key, idx) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={COLORS[idx % COLORS.length]}
                dot={{ fill: COLORS[idx % COLORS.length], r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}