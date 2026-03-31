import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export default function SearchableSelect({ 
  value, 
  onValueChange, 
  items = [], 
  placeholder = "Select an option",
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      const aStr = (typeof a === "string" ? a : a.label) || "";
      const bStr = (typeof b === "string" ? b : b.label) || "";
      return aStr.localeCompare(bStr);
    });
    if (!searchTerm.trim()) return sorted;
    return sorted.filter(item => {
      const str = typeof item === "string" ? item : item.label;
      return str?.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [items, searchTerm]);

  return (
    <Select value={value} onValueChange={onValueChange} onOpenChange={(open) => { if (!open) setSearchTerm(""); }}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <div className="p-2 border-b border-slate-700">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "#92F21D" }} />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 h-8 text-sm"
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="p-3 text-sm text-center opacity-60">No items found</div>
          ) : (
            filteredItems.map((item, idx) => {
              const itemValue = typeof item === "string" ? item : item.value;
              const itemLabel = typeof item === "string" ? item : item.label;
              return (
                <SelectItem key={`${itemValue}-${idx}`} value={itemValue}>
                  {itemLabel}
                </SelectItem>
              );
            })
          )}
        </div>
      </SelectContent>
    </Select>
  );
}