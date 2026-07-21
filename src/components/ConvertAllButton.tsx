import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

interface ConvertAllButtonProps {
  onClick: () => void;
  disabled: boolean;
}

const ConvertAllButton = ({ onClick, disabled }: ConvertAllButtonProps) => (
  <Button
    onClick={onClick}
    disabled={disabled}
    size="lg"
    className="w-full font-bold"
  >
    <Zap className="w-5 h-5 mr-2" /> Compress All
  </Button>
);

export default ConvertAllButton;