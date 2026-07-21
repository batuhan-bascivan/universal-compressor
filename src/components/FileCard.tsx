import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileText, FolderOpen, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileCardProps {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'converting' | 'completed' | 'failed';
  outputFormat: string;
  outputUrl?: string;
  onRemove: (fileId: string) => void;
  onShowInFolder: (fileId: string) => void;
}

const STATUS_ICONS = {
  completed:  <CheckCircle2 className="w-5 h-5 text-green-500" />,
  failed:     <AlertCircle className="w-5 h-5 text-destructive" />,
  converting: <Loader2 className="w-5 h-5 text-primary animate-spin" />,
  pending:    <FileText className="w-5 h-5 text-muted-foreground" />,
} as const;

const FileCard = ({
  fileId,
  fileName,
  progress,
  status,
  outputFormat,
  outputUrl,
  onRemove,
  onShowInFolder,
}: FileCardProps) => (
  <Card className="w-full transition-all hover:shadow-md">
    <CardContent className="p-4 flex items-center gap-4">
      <div className="flex-shrink-0">{STATUS_ICONS[status]}</div>
      <div className="flex-grow overflow-hidden">
        <p className="text-sm font-medium truncate text-foreground">{fileName}</p>
        <p className="text-xs text-muted-foreground">
          Compression: <span className="font-semibold text-primary">{100 - parseInt(outputFormat)}%</span>
        </p>
        {(status === 'converting' || status === 'completed') && (
          <Progress value={progress} className="h-1.5 mt-1" />
        )}
      </div>
      <div className="flex-shrink-0 flex items-center gap-1">
        {status === 'completed' && outputUrl && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onShowInFolder(fileId)}
            className="h-8 w-8"
          >
            <FolderOpen className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(fileId)}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default FileCard;