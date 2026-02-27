import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, List } from 'lucide-react';

export default function DrilldownModal({
  isOpen,
  onClose,
  title = 'Details',
  selectedData = null,
  relatedRecords = [],
  timeSeries = [],
  recordsLoading = false,
  seriesLoading = false,
}) {
  if (!selectedData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-[#34CCD0] bg-[#081F3F]">
        <DialogHeader>
          <DialogTitle className="text-[#92F21D]">{title}: {selectedData.name || selectedData.label}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="records" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#0a1e3a] border border-[#34CCD0]">
            <TabsTrigger
              value="records"
              className="text-white data-[state=active]:text-[#92F21D] data-[state=active]:bg-[#0a2d52]"
            >
              <List className="w-4 h-4 mr-2" />
              Related Records
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="text-white data-[state=active]:text-[#92F21D] data-[state=active]:bg-[#0a2d52]"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Time Breakdown
            </TabsTrigger>
          </TabsList>

          {/* Related Records Tab */}
          <TabsContent value="records" className="space-y-4 mt-4">
            {recordsLoading ? (
              <div className="text-center py-8 text-[#92F21D]">Loading records...</div>
            ) : relatedRecords.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {relatedRecords.map((record, idx) => (
                  <Card key={idx} className="border-[#34CCD0] bg-[#0a1e3a]">
                    <CardContent className="pt-6">
                      <div className="grid gap-2">
                        {Object.entries(record).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-[#92F21D] font-medium capitalize">{key}:</span>
                            <span className="text-white">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#92F21D]">No related records found</div>
            )}
          </TabsContent>

          {/* Time Breakdown Tab */}
          <TabsContent value="timeline" className="space-y-4 mt-4">
            {seriesLoading ? (
              <div className="text-center py-8 text-[#92F21D]">Loading timeline...</div>
            ) : timeSeries.length > 0 ? (
              <>
                <Card className="border-[#34CCD0] bg-[#0a1e3a]">
                  <CardHeader>
                    <CardTitle className="text-[#92F21D]">Daily Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={timeSeries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#0a2d52" />
                        <XAxis dataKey="date" stroke="#92F21D" />
                        <YAxis stroke="#92F21D" />
                        <Tooltip contentStyle={{ backgroundColor: '#0a1e3a', border: '2px solid #34CCD0', color: '#fff' }} />
                        <Bar dataKey="value" fill="#92F21D" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-[#34CCD0] bg-[#0a1e3a]">
                  <CardHeader>
                    <CardTitle className="text-[#92F21D]">Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={timeSeries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#0a2d52" />
                        <XAxis dataKey="date" stroke="#92F21D" />
                        <YAxis stroke="#92F21D" />
                        <Tooltip contentStyle={{ backgroundColor: '#0a1e3a', border: '2px solid #34CCD0', color: '#fff' }} />
                        <Line type="monotone" dataKey="value" stroke="#34CCD0" dot={{ fill: '#34CCD0' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-8 text-[#92F21D]">No timeline data available</div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}