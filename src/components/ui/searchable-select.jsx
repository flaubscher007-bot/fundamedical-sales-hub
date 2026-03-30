import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";

export default function SearchableSelect({ 
  value, 
  onValueChange, 
  items = [], 
  placeholder = "Select an option",
  label = "",
  searchable = true,
  allowClear = false
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);

  // Sort items alphabetically
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const aStr = typeof a === 'string' ? a : a.label;
      const bStr = typeof b === 'string' ? b : b.label;
      return aStr.localeCompare(bStr);
    });
  }, [items]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return sortedItems;
    return sortedItems.filter(item => {
      const str = typeof item === 'string' ? item : item.label;
      return str.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [sortedItems, searchTerm]);

  const displayValue = useMemo(() => {
    if (!value) return placeholder;
    const item = items.find(i => {
      const itemVal = typeof i === 'string' ? i : i.value;
      return itemVal === value;
    });
    return typeof item === 'string' ? item : item?.label;
  }, [value, items, placeholder]);

  const handleClear = (e) => {
    e.stopPropagation();
    onValueChange("");
    setSearchTerm("");
  };

  return (
    <div className="relative w-full">
      <Select value={value} onValueChange={onValueChange} open={open} onOpenChange={setOpen}>
        <SelectTrigger className="w-full">
          <SelectValue>{displayValue}</SelectValue>
        </SelectTrigger>
        <SelectContent className="w-full max-h-[300px]">
          {searchable && (
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-2 z-10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#92F21D" }} />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3"
                  style={{
                    backgroundColor: "rgba(10,30,58,0.8)",
                    borderColor: "#34CCD0"
                  }}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              </div>
            </div>
          )}
          
          <div className="max-h-[250px] overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="p-3 text-sm text-center" style={{ color: "#ffffff" }}>
                No items found
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const itemValue = typeof item === 'string' ? item : item.value;
                const itemLabel = typeof item === 'string' ? item : item.label;
                return (
                  <SelectItem key={idx} value={itemValue}>
                    {itemLabel}
                  </SelectItem>
                );
              })
            )}
          </div>
        </SelectContent>
      </Select>

      {allowClear && value && (
        <button
          onClick={handleClear}
          className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}