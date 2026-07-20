import React from 'react';
import { Button } from '@/components/ui/button';

interface CompressionSliderProps {
  percentage: string;
  onPercentageChange: (val: string) => void;
}

export const CompressionSlider: React.FC<CompressionSliderProps> = ({ percentage, onPercentageChange }) => {
  const setLevel = (level: number) => {
    onPercentageChange(level.toString());
  };

  return (
    <div className="flex flex-col gap-4 mt-2 bg-card p-4 rounded-xl border">
      <div className="grid grid-cols-3 gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setLevel(80)}
          className={percentage === '80' ? 'bg-primary text-primary-foreground' : ''}
        >
          Low Compression
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setLevel(50)}
          className={percentage === '50' ? 'bg-primary text-primary-foreground' : ''}
        >
          Balanced
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setLevel(20)}
          className={percentage === '20' ? 'bg-primary text-primary-foreground' : ''}
        >
          Max Compression
        </Button>
      </div>
    </div>
  );
};

