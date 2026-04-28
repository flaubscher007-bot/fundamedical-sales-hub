import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Calendar,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function UnifiedPerformanceDashboard() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load scheduled posts for current month
      const posts = await base44.entities.ScheduledPost.list("-scheduled_date", 100);
      const monthPosts = posts.filter((p) => {
        const postDate = new Date(p.scheduled_date);
        return (
          postDate.getMonth() === currentMonth.getMonth() &&
          postDate.getFullYear() === currentMonth.getFullYear()
        );
      });
      setScheduledPosts(monthPosts);

      // Load analytics
      const data = await base44.entities.PostAnalytics.list("-published_date", 100);
      setAnalytics(data);
    } catch (e) {
      console.error("Error loading data:", e);
    }
    setLoading(false);
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const days = [];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getPostsForDate = (date) => {
    if (!date) return [];
    return scheduledPosts.filter((p) => {
      const postDate = new Date(p.scheduled_date);
      return postDate.toDateString() === date.toDateString();
    });
  };

  const getAnalyticsForDate = (date) => {
    if (!date) return [];
    return analytics.filter((a) => {
      const analyticsDate = new Date(a.published_date);
      return analyticsDate.toDateString() === date.toDateString();
    });
  };

  // Calculate metrics
  const totalReach = analytics.reduce((sum, a) => sum + (a.reach || 0), 0);
  const totalEngagement = analytics.reduce(
    (sum, a) => sum + ((a.likes || 0) + (a.comments || 0) + (a.shares || 0)),
    0
  );
  const avgEngagementRate =
    analytics.length > 0
      ? (analytics.reduce((sum, a) => sum + (a.engagement_rate || 0), 0) / analytics.length).toFixed(2)
      : 0;

  // Platform breakdown
  const platformData = [
    {
      name: "Facebook",
      reach: analytics
        .filter((a) => a.platform === "Facebook")
        .reduce((sum, a) => sum + (a.reach || 0), 0),
      engagement: analytics
        .filter((a) => a.platform === "Facebook")
        .reduce((sum, a) => sum + ((a.likes || 0) + (a.comments || 0) + (a.shares || 0)), 0),
      color: "#1877F2",
    },
    {
      name: "LinkedIn",
      reach: analytics
        .filter((a) => a.platform === "LinkedIn")
        .reduce((sum, a) => sum + (a.reach || 0), 0),
      engagement: analytics
        .filter((a) => a.platform === "LinkedIn")
        .reduce((sum, a) => sum + ((a.likes || 0) + (a.comments || 0) + (a.shares || 0)), 0),
      color: "#0A66C2",
    },
  ];

  // Trend data (last 7 days)
  const trendData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayAnalytics = analytics.filter(
      (a) => new Date(a.published_date).toDateString() === date.toDateString()
    );
    trendData.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      reach: dayAnalytics.reduce((sum, a) => sum + (a.reach || 0), 0),
      engagement: dayAnalytics.reduce(
        (sum, a) => sum + ((a.likes || 0) + (a.comments || 0) + (a.shares || 0)),
        0
      ),
    });
  }

  const calendarDays = getDaysInMonth();
  const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900 border-slate-700">
          <div className="text-sm text-gray-400 mb-1">Total Reach</div>
          <div className="text-3xl font-bold" style={{ color: "#92F21D" }}>
            {totalReach.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">All platforms</div>
        </Card>

        <Card className="p-4 bg-slate-900 border-slate-700">
          <div className="text-sm text-gray-400 mb-1">Total Engagement</div>
          <div className="text-3xl font-bold" style={{ color: "#34CCD0" }}>
            {totalEngagement.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">Likes, comments, shares</div>
        </Card>

        <Card className="p-4 bg-slate-900 border-slate-700">
          <div className="text-sm text-gray-400 mb-1">Avg Engagement Rate</div>
          <div className="text-3xl font-bold" style={{ color: "#92F21D" }}>
            {avgEngagementRate}%
          </div>
          <div className="text-xs text-gray-500 mt-1">All posts</div>
        </Card>

        <Card className="p-4 bg-slate-900 border-slate-700">
          <div className="text-sm text-gray-400 mb-1">Scheduled Posts</div>
          <div className="text-3xl font-bold" style={{ color: "#34CCD0" }}>
            {scheduledPosts.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">This month</div>
        </Card>
      </div>

      {/* Trends */}
      <Card className="p-6 bg-slate-900 border-slate-700">
        <h3 className="text-lg font-bold mb-4" style={{ color: "#92F21D" }}>
          Performance Trend (Last 7 Days)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{ backgroundColor: "#081F3F", border: "1px solid #34CCD0" }}
              labelStyle={{ color: "#92F21D" }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="reach"
              stroke="#92F21D"
              strokeWidth={2}
              dot={{ fill: "#92F21D", r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="engagement"
              stroke="#34CCD0"
              strokeWidth={2}
              dot={{ fill: "#34CCD0", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Platform Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-slate-900 border-slate-700">
          <h3 className="text-lg font-bold mb-4" style={{ color: "#92F21D" }}>
            Reach by Platform
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={platformData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: "#081F3F", border: "1px solid #34CCD0" }}
                labelStyle={{ color: "#92F21D" }}
              />
              <Bar dataKey="reach" fill="#92F21D" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 bg-slate-900 border-slate-700">
          <h3 className="text-lg font-bold mb-4" style={{ color: "#92F21D" }}>
            Engagement by Platform
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={platformData.filter((p) => p.engagement > 0)}
                dataKey="engagement"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {platformData.map((p) => (
                  <Cell key={p.name} fill={p.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#081F3F", border: "1px solid #34CCD0" }}
                labelStyle={{ color: "#92F21D" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Calendar View */}
      <Card className="p-6 bg-slate-900 border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold" style={{ color: "#92F21D" }}>
            <Calendar className="inline mr-2 w-5 h-5" />
            {monthName}
          </h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={prevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center font-semibold text-xs" style={{ color: "#92F21D" }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((date, idx) => {
            const posts = date ? getPostsForDate(date) : [];
            const historicalData = date ? getAnalyticsForDate(date) : [];
            const isToday =
              date && date.toDateString() === new Date().toDateString();

            return (
              <div
                key={idx}
                className={`p-3 rounded-lg min-h-24 text-xs ${
                  !date
                    ? "bg-gray-900"
                    : isToday
                    ? "bg-slate-700 border-2 border-[#92F21D]"
                    : "bg-slate-800 border border-slate-700"
                }`}
              >
                {date && (
                  <>
                    <div className="font-bold mb-1" style={{ color: "#92F21D" }}>
                      {date.getDate()}
                    </div>

                    {/* Scheduled Posts */}
                    {posts.length > 0 && (
                      <div className="mb-2 space-y-1">
                        {posts.slice(0, 2).map((post, i) => (
                          <div
                            key={i}
                            className="text-xs p-1 rounded bg-blue-900/50 border-l-2 border-blue-500 truncate"
                            title={post.title}
                          >
                            {post.platform} • {post.title?.substring(0, 15)}...
                          </div>
                        ))}
                        {posts.length > 2 && (
                          <div className="text-xs text-gray-400">+{posts.length - 2} more</div>
                        )}
                      </div>
                    )}

                    {/* Historical Performance */}
                    {historicalData.length > 0 && (
                      <div className="space-y-0.5 text-gray-400">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {historicalData.reduce((sum, a) => sum + (a.reach || 0), 0)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {historicalData.reduce((sum, a) => sum + (a.likes || 0), 0)}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}