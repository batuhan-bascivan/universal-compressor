import { Button } from '@/components/ui/button';

interface CompressionSliderProps {
  percentage: string;
  onPercentageChange: (val: string) => void;
}

const LEVELS = [
  { value: 80, label: 'Low Compression' },
  { value: 50, label: 'Balanced' },
  { value: 20, label: 'Max Compression' },
] as const;

export const CompressionSlider = ({ percentage, onPercentageChange }: CompressionSliderProps) => {
  return (
    <div className="flex flex-col gap-4 mt-2 bg-card p-4 rounded-xl border">
      <div className="grid grid-cols-3 gap-2">
        {LEVELS.map(({ value, label }) => (
          <Button
            key={value}
            variant="outline"
            size="sm"
            onClick={() => onPercentageChange(value.toString())}
            className={`transition-all duration-200 ${percentage === value.toString() ? 'bg-primary text-primary-foreground' : ''}`}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
};
