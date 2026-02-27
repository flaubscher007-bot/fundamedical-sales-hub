import React from 'react';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Columns3, LayoutList } from 'lucide-react';

export default function LayoutPresets({ currentLayout, onLayoutChange }) {
  const presets = [
    { id: 'balanced', label: '2-2 Grid', icon: Columns3, cols: 2 },
    { id: 'wide', label: 'Wide View', icon: LayoutGrid, cols: 1 },
    { id: 'compact', label: '3-Column', icon: LayoutList, cols: 3 },
  ];

  return (
    <div className="flex gap-2 items-center">
      <span className="text-sm text-[#92F21D]">Layout:</span>
      {presets.map((preset) => {
        const Icon = preset.icon;
        return (
          <Button
            key={preset.id}
            size="sm"
            variant={currentLayout === preset.id ? 'default' : 'outline'}
            onClick={() => onLayoutChange(preset.id)}
            className={
              currentLayout === preset.id
                ? 'bg-[#92F21D] text-[#081F3F] hover:bg-[#7fd91a]'
                : 'text-white border-[#34CCD0] hover:bg-[#0a2d52]'
            }
            title={preset.label}
          >
            <Icon className="w-4 h-4" />
          </Button>
        );
      })}
    </div>
  );
}

export const getLayoutClasses = (layout) => {
  switch (layout) {
    case 'wide':
      return 'grid grid-cols-1 gap-6';
    case 'compact':
      return 'grid grid-cols-1 md:grid-cols-3 gap-4';
    default:
      return 'grid grid-cols-1 md:grid-cols-2 gap-6';
  }
};