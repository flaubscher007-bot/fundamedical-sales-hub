import React, { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { TrendingUp, PieChart as PieIcon, BarChart3, LineChart as LineIcon } from "lucide-react";

export default function InteractiveChartBuilder({
  data = [],
  title = "Chart",
  dataKey = "value",
  xAxisKey = "date",
  onDrillDown,
  showDrillDown = false,
  filters = {}
}) {
  const [chartType, setChartType] = useState("line");
  const [timeRange, setTimeRange] = useState("monthly");
  const [selectedSegment, setSelectedSegment] = useState(null);

  const chartIcons = {
    line: LineIcon,
    bar: BarChart3,
    area: TrendingUp,
    pie: PieIcon
  };

  const COLORS = ["#34CCD0", "#92F21D", "#7ed957", "#FF6B6B", "#4ECDC4", "#45B7D1"];

  const handleSegmentClick = (payload) => {
    if (showDrillDown && onDrillDown) {
      setSelectedSegment(payload);
      onDrillDown({
        segment: payload.name || payload[xAxisKey],
        timeRange,
        data: payload
      });
    }
  };

  const renderChart = () => {
    if (!data || data.length === 0) {
      return <div className="flex items-center justify-center h-96 text-slate-400">No data available</div>;
    }

    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 0, bottom: 5 }
    };

    switch (chartType) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke="var(--funda-accent)"
                strokeWidth={2}
                dot={{ fill: "var(--funda-accent)", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey={dataKey}
                fill="var(--funda-accent)"
                onClick={(e) => handleSegmentClick(e.activeTooltipIndex !== undefined ? data[e.activeTooltipIndex] : null)}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      case "area":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey={dataKey}
                fill="var(--funda-accent)"
                stroke="var(--funda-accent)"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey={dataKey}
                onClick={(e) => handleSegmentClick(e)}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {selectedSegment && (
            <p className="text-sm text-slate-500 mt-1">
              Viewing: {selectedSegment.name || selectedSegment[xAxisKey]}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            {Object.entries({
              line: LineIcon,
              bar: BarChart3,
              area: TrendingUp,
              pie: PieIcon
            }).map(([type, Icon]) => (
              <Button
                key={type}
                variant={chartType === type ? "default" : "outline"}
                size="icon"
                onClick={() => setChartType(type)}
                title={type.charAt(0).toUpperCase() + type.slice(1)}
              >
                <Icon className="w-4 h-4" />
              </Button>
            ))}
          </div>
        </div>
      </div>

      {renderChart()}

      {showDrillDown && selectedSegment && (
        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedSegment(null)}
          >
            Clear Selection
          </Button>
        </div>
      )}
    </div>
  );
}