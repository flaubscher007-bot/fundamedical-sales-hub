import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

const COLORS = ['#34CCD0', '#92F21D', '#48B600', '#FFB84D', '#FF6B6B', '#4ECDC4'];

export default function DashboardCharts({ clients, statements, contracts, proposals }) {
  // Client growth data (simulated month-by-month)
  const clientGrowth = Array.from({ length: 6 }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() - (5 - i));
    const activeCount = Math.max(5, Math.floor(clients.length * (0.6 + i * 0.1)));
    return {
      month: format(month, 'MMM'),
      active: activeCount,
      inactive: Math.floor(clients.length * 0.2),
      prospect: Math.floor(clients.length * 0.1)
    };
  });

  // Client status distribution
  const statusData = [
    { name: 'Active', value: clients.filter(c => c.activity_status === 'ACTIVE').length },
    { name: 'Inactive', value: clients.filter(c => c.activity_status === 'INACTIVE').length },
    { name: 'Prospect', value: clients.filter(c => c.activity_status === 'Prospect').length }
  ];

  // Revenue trends from statements
  const revenueTrends = Array.from({ length: 6 }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() - (5 - i));
    const monthStatements = statements.filter(s => {
      if (!s.statement_month) return false;
      const sDate = new Date(s.statement_month);
      return sDate.getMonth() === month.getMonth();
    });
    const totalDeposit = monthStatements.reduce((sum, s) => sum + (s.total_deposit || 0), 0);
    const totalDue = monthStatements.reduce((sum, s) => sum + (s.total_due || 0), 0);
    return {
      month: format(month, 'MMM'),
      deposits: Math.round(totalDeposit / 1000),
      due: Math.round(totalDue / 1000)
    };
  });

  // BUL performance (top BULs by client count)
  const bulCounts = {};
  clients.forEach(c => {
    const bul = c.assigned_bul || c.business_unit_leader || 'Unassigned';
    bulCounts[bul] = (bulCounts[bul] || 0) + 1;
  });
  const bulPerformance = Object.entries(bulCounts)
    .map(([name, count]) => ({ name: name.split(' ')[0], value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Contract performance
  const contractStatus = {
    draft: contracts.filter(c => c.status === 'Draft').length,
    sent: contracts.filter(c => c.status === 'Sent').length,
    signed: contracts.filter(c => c.status === 'Signed').length,
    completed: contracts.filter(c => c.status === 'Completed').length
  };

  return (
    <div className="space-y-6">
      {/* Client Growth */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Client Growth Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={clientGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="active" stroke="#34CCD0" strokeWidth={2} name="Active" />
              <Line type="monotone" dataKey="inactive" stroke="#94a3b8" strokeWidth={2} name="Inactive" />
              <Line type="monotone" dataKey="prospect" stroke="#92F21D" strokeWidth={2} name="Prospect" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Client Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Client Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* BUL Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top BULs by Client Count</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={bulPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#34CCD0" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenue Trends (ZAR 000s)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `ZAR ${value}k`} />
              <Legend />
              <Bar dataKey="deposits" fill="#48B600" name="Deposits" radius={[8, 8, 0, 0]} />
              <Bar dataKey="due" fill="#FFB84D" name="Due" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Contract Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contract Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs text-slate-600 mb-1">Draft</p>
              <p className="text-2xl font-bold text-blue-600">{contractStatus.draft}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-xs text-slate-600 mb-1">Sent</p>
              <p className="text-2xl font-bold text-yellow-600">{contractStatus.sent}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-xs text-slate-600 mb-1">Signed</p>
              <p className="text-2xl font-bold text-purple-600">{contractStatus.signed}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-xs text-slate-600 mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-600">{contractStatus.completed}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}