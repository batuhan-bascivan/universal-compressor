import { useState, useCallback } from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import DragDropArea from "@/components/DragDropArea";
import { CompressionSlider } from "@/components/CompressionSlider";
import FileCard from "@/components/FileCard";
import ConvertAllButton from "@/components/ConvertAllButton";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModeToggle } from "@/components/mode-toggle";

declare global {
  interface Window {
    electron: {
      compressFile: (filePath: string, format: string, outputDir?: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      showInFolder: (filePath: string) => Promise<void>;
      getFilePath: (file: File) => string;
      selectDirectory: () => Promise<string | null>;
    };
  }
}

type MediaType = 'image' | 'video' | 'audio' | 'document';

interface FileToCompress {
  id: string;
  file: File;
  name: string;
  type: string;
  size: number;
  progress: number;
  status: 'pending' | 'converting' | 'completed' | 'failed';
  outputFormat: string;
  outputUrl?: string;
  mediaType?: MediaType;
}

const MEDIA_TABS: { type: MediaType; label: string; accept: string; dropLabel: string }[] = [
  { type: 'image',    label: 'Image',    accept: 'image/*',                              dropLabel: 'Drag & Drop Images here' },
  { type: 'video',    label: 'Video',    accept: 'video/*',                              dropLabel: 'Drag & Drop Videos here' },
  { type: 'audio',    label: 'Audio',    accept: 'audio/*',                              dropLabel: 'Drag & Drop Audio files here' },
  { type: 'document', label: 'Document', accept: 'application/pdf,.doc,.docx,.pptx,.xlsx', dropLabel: 'Drag & Drop Documents here' },
];

type FilesByType = Record<MediaType, FileToCompress[]>;
type LevelsByType = Record<MediaType, string>;

const Index = () => {
  const [filesByType, setFilesByType] = useState<FilesByType>({
    image: [], video: [], audio: [], document: [],
  });

  const [levelsByType, setLevelsByType] = useState<LevelsByType>({
    image: '50', video: '50', audio: '50', document: '50',
  });

  const [destinationFolder, setDestinationFolder] = useState<string | null>(null);

  const updateFiles = useCallback((mediaType: MediaType, updater: (prev: FileToCompress[]) => FileToCompress[]) => {
    setFilesByType(prev => ({ ...prev, [mediaType]: updater(prev[mediaType]) }));
  }, []);

  const handleSelectDestination = useCallback(async () => {
    if (window.electron?.selectDirectory) {
      const path = await window.electron.selectDirectory();
      if (path) {
        setDestinationFolder(path);
        toast.success(`Destination folder set to: ${path}`);
      }
    } else {
      toast.error("Directory selection is not supported in this environment.");
    }
  }, []);

  const handleFilesAdded = useCallback((newFiles: File[], mediaType: MediaType) => {
    const level = levelsByType[mediaType];
    const filesToAdd: FileToCompress[] = newFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      progress: 0,
      status: 'pending',
      mediaType,
      outputFormat: level,
    }));

    updateFiles(mediaType, prev => [...prev, ...filesToAdd]);
    toast.success(`${newFiles.length} ${mediaType} file(s) added!`);
  }, [levelsByType, updateFiles]);

  const handleRemoveFile = useCallback((fileId: string, mediaType: MediaType) => {
    updateFiles(mediaType, prev => prev.filter(f => f.id !== fileId));
    toast.info("File removed.");
  }, [updateFiles]);

  const handleFormatChange = useCallback((level: string, mediaType: MediaType) => {
    setLevelsByType(prev => ({ ...prev, [mediaType]: level }));
    updateFiles(mediaType, prev =>
      prev.map(f => f.status === 'pending' ? { ...f, outputFormat: level } : f)
    );
  }, [updateFiles]);

  const compressSingleFile = useCallback(async (fileToProcess: FileToCompress): Promise<FileToCompress> => {
    const mediaType = fileToProcess.mediaType!;

    try {
      updateFiles(mediaType, prev =>
        prev.map(f => f.id === fileToProcess.id ? { ...f, status: 'converting', progress: 10 } : f)
      );

      if (!window.electron) {
        throw new Error("Electron API not available. Preload script failed to load.");
      }

      const filePath = window.electron.getFilePath(fileToProcess.file);
      if (!filePath) throw new Error("File path not found. Are you running in Electron?");

      updateFiles(mediaType, prev =>
        prev.map(f => f.id === fileToProcess.id ? { ...f, progress: 50 } : f)
      );

      const result = await window.electron.compressFile(filePath, fileToProcess.outputFormat, destinationFolder || undefined);

      if (!result.success) throw new Error(result.error || "Compression failed");

      return { ...fileToProcess, status: 'completed', progress: 100, outputUrl: result.path };
    } catch (error: any) {
      console.error('Compression failed:', error);
      toast.error(`Failed to compress ${fileToProcess.name}: ${error.message}`);
      return { ...fileToProcess, status: 'failed', progress: 0 };
    }
  }, [destinationFolder, updateFiles]);

  const handleCompressAll = useCallback(async (mediaType: MediaType) => {
    const toastId = toast.loading(`Starting ${mediaType} compression...`);
    const filesToProcess = filesByType[mediaType];
    const pendingFiles = filesToProcess.filter(f => f.status === 'pending' || f.status === 'failed');
    const results = await Promise.all(pendingFiles.map(file => compressSingleFile(file)));

    updateFiles(mediaType, prevFiles =>
      prevFiles.map(oldFile => {
        const newFile = results.find(res => res.id === oldFile.id);
        return newFile || oldFile;
      })
    );

    toast.dismiss(toastId);
    const failedCount = results.filter(r => r.status === 'failed').length;
    if (failedCount > 0) {
      toast.error(`${failedCount} ${mediaType} file(s) failed to compress.`);
    } else {
      toast.success(`${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} compression finished successfully!`);
    }
  }, [filesByType, compressSingleFile, updateFiles]);

  const handleShowInFolder = useCallback(async (fileId: string, mediaType: MediaType) => {
    const file = filesByType[mediaType].find(f => f.id === fileId);
    if (file?.outputUrl) {
      await window.electron.showInFolder(file.outputUrl);
    } else {
      toast.error("Could not open folder. Path not found.");
    }
  }, [filesByType]);

  const renderFileSection = (mediaType: MediaType) => {
    const files = filesByType[mediaType];
    const tab = MEDIA_TABS.find(t => t.type === mediaType)!;
    const hasPendingFiles = files.some(f => f.status === 'pending' || f.status === 'failed');

    return (
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="flex flex-col gap-4">
            <DragDropArea
              onFilesAdded={(newFiles) => handleFilesAdded(newFiles, mediaType)}
              acceptedFileTypes={tab.accept}
              label={tab.dropLabel}
            />
            <CompressionSlider
              percentage={levelsByType[mediaType]}
              onPercentageChange={(level) => handleFormatChange(level, mediaType)}
            />
          </div>
          <div className="space-y-4">
            {files.length > 0 ? (
              files.map((file) => (
                <FileCard
                  key={file.id}
                  fileId={file.id}
                  fileName={file.name}
                  progress={file.progress}
                  status={file.status}
                  outputFormat={file.outputFormat}
                  outputUrl={file.outputUrl}
                  onRemove={() => handleRemoveFile(file.id, mediaType)}
                  onShowInFolder={() => handleShowInFolder(file.id, mediaType)}
                />
              ))
            ) : (
              <div className="flex items-center justify-center min-h-[200px] text-muted-foreground p-8 border-2 border-dashed border-border rounded-lg transition-all duration-300 hover:border-primary">
                Your files will appear here.
              </div>
            )}
          </div>
        </div>
        {files.length > 0 && (
          <ConvertAllButton onClick={() => handleCompressAll(mediaType)} disabled={!hasPendingFiles} />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-8 md:p-12 relative">
      <div className="absolute top-4 right-4 flex gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleSelectDestination}
              className="rounded-lg"
            >
              <FolderOpen className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">Select Destination Folder</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{destinationFolder ? `Destination: ${destinationFolder}` : "Select Destination Folder"}</p>
          </TooltipContent>
        </Tooltip>
        <ModeToggle />
      </div>
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-8">
        <header className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-2">
            Universal Compressor
          </h1>
          <p className="text-lg text-muted-foreground">
            Drag files, select compression, and shrink them. It's that simple.
          </p>
        </header>
        <main className="flex flex-col gap-8">
          <Tabs defaultValue="image" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {MEDIA_TABS.map(tab => (
                <TabsTrigger key={tab.type} value={tab.type}>{tab.label}</TabsTrigger>
              ))}
            </TabsList>

            {MEDIA_TABS.map(tab => (
              <TabsContent key={tab.type} value={tab.type} className="mt-8">
                {renderFileSection(tab.type)}
              </TabsContent>
            ))}
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Index;
