import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, FileText, FileBadge, BookTemplate, Sparkles, DollarSign } from "lucide-react";
import IntakeForms from "./IntakeForms";
import ContractTemplates from "../components/contracts/ContractTemplates";
import CompletedContracts from "../components/contracts/CompletedContracts";
import ContractAIAssistant from "../components/contracts/ContractAIAssistant";
import PricingProposals from "./PricingProposals";

export default function Contracts() {
  const [tab, setTab] = useState("intake");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl" style={{backgroundColor: '#34CCD0', backgroundOpacity: 0.1}}>
          <FileBadge className="w-6 h-6 text-[#34CCD0]" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{color: '#92F21D'}}>Contract Tools</h1>
          <p className="text-sm" style={{color: '#ffffff'}}>Manage intake forms, pricing proposals, contract templates and completed contracts</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="intake" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Intake Forms
          </TabsTrigger>
          <TabsTrigger value="proposals" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Proposals
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <BookTemplate className="w-4 h-4" /> Templates
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <FileText className="w-4 h-4" /> Completed
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> AI Assistant
          </TabsTrigger>
        </TabsList>

        <TabsContent value="intake" className="mt-4">
          <IntakeForms />
        </TabsContent>

        <TabsContent value="proposals" className="mt-4">
          <PricingProposals />
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <ContractTemplates />
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <CompletedContracts />
        </TabsContent>

        <TabsContent value="ai" className="mt-4">
          <ContractAIAssistant />
        </TabsContent>
      </Tabs>
    </div>
  );
}