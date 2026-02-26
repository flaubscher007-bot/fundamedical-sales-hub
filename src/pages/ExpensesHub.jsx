import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Receipt, Wine } from "lucide-react";
import Mileage from "./Mileage";
import Expenses from "./Expenses";
import EntertainmentProposals from "./EntertainmentProposals";

export default function ExpensesHub() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="mileage" className="w-full">
        <TabsList className="bg-white border border-slate-200 shadow-sm h-11 p-1">
          <TabsTrigger value="mileage" className="flex items-center gap-2 data-[state=active]:bg-[#00bcd4] data-[state=active]:text-white">
            <Car className="w-4 h-4" /> Mileage Tracker
          </TabsTrigger>
          <TabsTrigger value="entertainment" className="flex items-center gap-2 data-[state=active]:bg-[#00bcd4] data-[state=active]:text-white">
            <Wine className="w-4 h-4" /> Entertainment
          </TabsTrigger>
          <TabsTrigger value="travel" className="flex items-center gap-2 data-[state=active]:bg-[#00bcd4] data-[state=active]:text-white">
            <Receipt className="w-4 h-4" /> Travel Claims
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mileage" className="mt-6">
          <Mileage />
        </TabsContent>
        <TabsContent value="entertainment" className="mt-6">
          <EntertainmentProposals />
        </TabsContent>
        <TabsContent value="travel" className="mt-6">
          <Expenses />
        </TabsContent>
      </Tabs>
    </div>
  );
}