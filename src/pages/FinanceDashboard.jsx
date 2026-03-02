import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdvancedReporting from "./AdvancedReporting";

export default function FinanceDashboard() {
  return (
    <Tabs defaultValue="powerbi" className="w-full h-full">
      <TabsList className="w-full justify-start border-b rounded-none bg-white p-0">
        <TabsTrigger value="powerbi" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#00bcd4]">
          Power BI Dashboard
        </TabsTrigger>
        <TabsTrigger value="reporting" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#00bcd4]">
          Advanced Reporting
        </TabsTrigger>
      </TabsList>

      <TabsContent value="powerbi" className="fixed inset-0 top-40 flex flex-col m-0">
        <iframe
          title="TEAM FINANCE STATS"
          width="100%"
          height="80%"
          src="https://app.powerbi.com/view?r=eyJrIjoiZTljNDEyMTItNzQ4Ny00MTZmLTk0MmUtNDEyYjUwM2YxN2UxIiwidCI6ImViNzdjYzEwLTc5NDAtNDhjMy1hMDMzLWJkZjU3ODIzNDk0YiJ9&pageName=ReportSection9d871590762418041a6e"
          frameBorder="0"
          allowFullScreen={true}
        />
      </TabsContent>

      <TabsContent value="reporting" className="p-6 overflow-y-auto">
        <AdvancedReporting />
      </TabsContent>
    </Tabs>
  );
}