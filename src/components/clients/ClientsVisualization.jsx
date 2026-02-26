import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from "recharts";

const COLORS = ['#34CCD0', '#92F21D', '#48B600', '#FFB84D', '#FF6B6B', '#4ECDC4'];

export default function ClientsVisualization({ clients, statements }) {
  // Status distribution
  const statusData = [
    { name: 'Active', value: clients.filter(c => c.activity_status === 'ACTIVE').length },
    { name: 'Inactive', value: clients.filter(c => c.activity_status === 'INACTIVE').length },
    { name: 'Prospect', value: clients.filter(c => c.activity_status === 'Prospect').length }
  ];

  // By category
  const categoryData = {};
  clients.forEach(c => {
    if (c.category) {
      categoryData[c.category] = (categoryData[c.category] || 0) + 1;
    }
  });
  const categoryChartData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

  // By province
  const provinceData = {};
  clients.forEach(c => {
    if (c.province) {
      provinceData[c.province] = (provinceData[c.province] || 0) + 1;
    }
  });
  const provinceChartData = Object.entries(provinceData).map(([name, value]) => ({ name, value }));

  // Financial health indicators
  const financialHealth = clients.map(c => {
    const clientStatements = statements.filter(s => s.law_firm === c.firm_name);
    const latestStmt = clientStatements[0];
    const totalBalance = latestStmt?.total_balance || 0;
    const totalDeposit = latestStmt?.total_deposit || 0;
    const avgBalance = clientStatements.length > 0
      ? clientStatements.reduce((sum, s) => sum + (s.total_balance || 0), 0) / clientStatements.length
      : 0;
    
    return {
      firm: c.firm_name.substring(0, 20),
      fullName: c.firm_name,
      balance: Math.round(totalBalance / 1000),
      deposit: Math.round(totalDeposit / 1000),
      health: avgBalance > 100000 ? 'Good' : avgBalance > 50000 ? 'Fair' : 'At Risk',
      statements: clientStatements.length
    };
  }).filter(c => c.balance > 0 || c.deposit > 0);

  // Account status distribution
  const accountStatusMap = {};
  clients.forEach(c => {
    if (c.account_status) {
      const status = c.account_status.includes('GREEN') ? 'Green' : 
                     c.account_status.includes('ORANGE') ? 'Orange' : 
                     c.account_status.includes('RED') ? 'Red' : 'Blue';
      accountStatusMap[status] = (accountStatusMap[status] || 0) + 1;
    }
  });
  const accountStatusData = Object.entries(accountStatusMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {/* Status Distribution */}
      <div className="grid lg:grid-cols-2 gap-6">
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

        {/* Account Status */}
        {accountStatusData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={accountStatusData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                    <Cell fill="#48B600" />
                    <Cell fill="#FFB84D" />
                    <Cell fill="#FF6B6B" />
                    <Cell fill="#34CCD0" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* By Category */}
      {categoryChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Clients by Practice Area</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="value" fill="#34CCD0" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* By Province */}
      {provinceChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Clients by Province</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={provinceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#92F21D" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Financial Health Indicators */}
      {financialHealth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Financial Health Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2 text-left">Client</th>
                    <th className="p-2 text-right">Latest Balance</th>
                    <th className="p-2 text-right">Latest Deposit</th>
                    <th className="p-2 text-center">Statements</th>
                    <th className="p-2 text-center">Health</th>
                  </tr>
                </thead>
                <tbody>
                  {financialHealth.slice(0, 15).map((client, idx) => {
                    const healthColor = client.health === 'Good' ? 'text-green-600 bg-green-50' : 
                                       client.health === 'Fair' ? 'text-yellow-600 bg-yellow-50' : 
                                       'text-red-600 bg-red-50';
                    return (
                      <tr key={idx} className="border-t hover:bg-slate-50">
                        <td className="p-2 font-medium truncate" title={client.fullName}>{client.firm}</td>
                        <td className="p-2 text-right text-slate-600">ZAR {client.balance}k</td>
                        <td className="p-2 text-right text-green-600">ZAR {client.deposit}k</td>
                        <td className="p-2 text-center text-slate-500">{client.statements}</td>
                        <td className={`p-2 text-center font-semibold rounded ${healthColor}`}>{client.health}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}