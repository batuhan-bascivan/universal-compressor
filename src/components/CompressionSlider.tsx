import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface CompressionSliderProps {
  label: string;
  percentage: string;
  onPercentageChange: (val: string) => void;
}

export const CompressionSlider: React.FC<CompressionSliderProps> = ({ label, percentage, onPercentageChange }) => {
  const numValue = Math.max(0.1, Math.min(10000, parseFloat(percentage) || 100));

  const handleSliderChange = (vals: number[]) => {
    onPercentageChange(vals[0].toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPercentageChange(e.target.value);
  };

  return (
    <div className="flex flex-col gap-4 mt-2 bg-card p-4 rounded-xl border">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        <div className="flex flex-row items-center gap-2">
           <Input 
             type="number" 
             className="w-24 h-8 text-right bg-background" 
             value={percentage} 
             onChange={handleInputChange} 
           />
           <span className="text-sm font-medium">%</span>
        </div>
      </div>
      <Slider
        min={1}
        max={100}
        step={1}
        value={[Math.min(numValue, 100)]}
        onValueChange={handleSliderChange}
        className="py-4"
      />
    </div>
  );
};
