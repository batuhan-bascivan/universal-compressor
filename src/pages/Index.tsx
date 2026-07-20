import React, { useState, useCallback } from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

interface FileToCompress {
  id: string;
  file: File;
  name: string;
  type: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'converting' | 'completed' | 'failed';
  outputFormat: string;
  outputUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
}

const Index = () => {
  const [imageFiles, setImageFiles] = useState<FileToCompress[]>([]);
  const [videoFiles, setVideoFiles] = useState<FileToCompress[]>([]);
  const [audioFiles, setAudioFiles] = useState<FileToCompress[]>([]);
  const [documentFiles, setDocumentFiles] = useState<FileToCompress[]>([]);

  const [selectedImageLevel, setSelectedImageLevel] = useState<string>("50");
  const [selectedVideoLevel, setSelectedVideoLevel] = useState<string>("50");
  const [selectedAudioLevel, setSelectedAudioLevel] = useState<string>("50");
  const [selectedDocumentLevel, setSelectedDocumentLevel] = useState<string>("50");

  const [destinationFolder, setDestinationFolder] = useState<string | null>(null);

  const handleSelectDestination = useCallback(async () => {
    if (window.electron && window.electron.selectDirectory) {
      const path = await window.electron.selectDirectory();
      if (path) {
        setDestinationFolder(path);
        toast.success(`Destination folder set to: ${path}`);
      }
    } else {
      toast.error("Directory selection is not supported in this environment.");
    }
  }, []);

  const handleFilesAdded = useCallback((newFiles: File[], mediaType: 'image' | 'video' | 'audio' | 'document') => {
    const level =
      mediaType === 'image' ? selectedImageLevel :
      mediaType === 'video' ? selectedVideoLevel :
      mediaType === 'audio' ? selectedAudioLevel :
      selectedDocumentLevel;

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

    if (mediaType === 'image') setImageFiles((prev) => [...prev, ...filesToAdd]);
    else if (mediaType === 'video') setVideoFiles((prev) => [...prev, ...filesToAdd]);
    else if (mediaType === 'audio') setAudioFiles((prev) => [...prev, ...filesToAdd]);
    else setDocumentFiles((prev) => [...prev, ...filesToAdd]);

    toast.success(`${newFiles.length} ${mediaType} file(s) added!`);
  }, [selectedImageLevel, selectedVideoLevel, selectedAudioLevel, selectedDocumentLevel]);

  const handleRemoveFile = useCallback((fileId: string, mediaType: 'image' | 'video' | 'audio' | 'document') => {
    if (mediaType === 'image') setImageFiles((prev) => prev.filter((f) => f.id !== fileId));
    else if (mediaType === 'video') setVideoFiles((prev) => prev.filter((f) => f.id !== fileId));
    else if (mediaType === 'audio') setAudioFiles((prev) => prev.filter((f) => f.id !== fileId));
    else setDocumentFiles((prev) => prev.filter((f) => f.id !== fileId));
    toast.info("File removed.");
  }, []);

  const handleFormatChange = useCallback((level: string, mediaType: 'image' | 'video' | 'audio' | 'document') => {
    if (mediaType === 'image') {
      setSelectedImageLevel(level);
      setImageFiles((prev) => prev.map((f) => f.status === 'pending' ? { ...f, outputFormat: level } : f));
    } else if (mediaType === 'video') {
      setSelectedVideoLevel(level);
      setVideoFiles((prev) => prev.map((f) => f.status === 'pending' ? { ...f, outputFormat: level } : f));
    } else if (mediaType === 'audio') {
      setSelectedAudioLevel(level);
      setAudioFiles((prev) => prev.map((f) => f.status === 'pending' ? { ...f, outputFormat: level } : f));
    } else {
      setSelectedDocumentLevel(level);
      setDocumentFiles((prev) => prev.map((f) => f.status === 'pending' ? { ...f, outputFormat: level } : f));
    }
  }, []);

  const compressSingleFile = useCallback(async (fileToProcess: FileToCompress): Promise<FileToCompress> => {
    const updateFileState = (updater: React.SetStateAction<FileToCompress[]>) => {
      if (fileToProcess.mediaType === 'image') setImageFiles(updater);
      else if (fileToProcess.mediaType === 'video') setVideoFiles(updater);
      else if (fileToProcess.mediaType === 'audio') setAudioFiles(updater);
      else setDocumentFiles(updater);
    };

    try {
      updateFileState(prev => prev.map(f => f.id === fileToProcess.id ? { ...f, status: 'converting', progress: 10 } : f));

      if (!window.electron) {
        throw new Error("Electron API not available. Preload script failed to load.");
      }

      const filePath = window.electron.getFilePath(fileToProcess.file);
      if (!filePath) throw new Error("File path not found. Are you running in Electron?");

      updateFileState(prev => prev.map(f => f.id === fileToProcess.id ? { ...f, progress: 50 } : f));

      const result = await window.electron.compressFile(filePath, fileToProcess.outputFormat, destinationFolder || undefined);

      if (!result.success) throw new Error(result.error || "Compression failed");

      return { ...fileToProcess, status: 'completed', progress: 100, outputUrl: result.path };
    } catch (error: any) {
      console.error('Compression failed:', error);
      toast.error(`Failed to compress ${fileToProcess.name}: ${error.message}`);
      return { ...fileToProcess, status: 'failed', progress: 0 };
    }
  }, [destinationFolder]);

  const handleCompressAll = useCallback(async (mediaType: 'image' | 'video' | 'audio' | 'document') => {
    const toastId = toast.loading(`Starting ${mediaType} compression...`);
    let filesToProcess: FileToCompress[] = [];
    let setFilesState: React.Dispatch<React.SetStateAction<FileToCompress[]>>;

    if (mediaType === 'image') { filesToProcess = imageFiles; setFilesState = setImageFiles; }
    else if (mediaType === 'video') { filesToProcess = videoFiles; setFilesState = setVideoFiles; }
    else if (mediaType === 'audio') { filesToProcess = audioFiles; setFilesState = setAudioFiles; }
    else { filesToProcess = documentFiles; setFilesState = setDocumentFiles; }

    const pendingFiles = filesToProcess.filter(f => f.status === 'pending' || f.status === 'failed');
    const results = await Promise.all(pendingFiles.map(file => compressSingleFile(file)));

    setFilesState(prevFiles =>
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
  }, [imageFiles, videoFiles, audioFiles, documentFiles, compressSingleFile]);

  const handleShowInFolder = useCallback(async (fileId: string, mediaType: 'image' | 'video' | 'audio' | 'document') => {
    let filesArray: FileToCompress[] = [];
    if (mediaType === 'image') filesArray = imageFiles;
    else if (mediaType === 'video') filesArray = videoFiles;
    else if (mediaType === 'audio') filesArray = audioFiles;
    else filesArray = documentFiles;

    const file = filesArray.find(f => f.id === fileId);
    if (file && file.outputUrl) {
      await window.electron.showInFolder(file.outputUrl);
    } else {
      toast.error("Could not open folder. Path not found.");
    }
  }, [imageFiles, videoFiles, audioFiles, documentFiles]);

  const renderFileSection = (
    files: FileToCompress[],
    selectedFormat: string,
    onFormatChange: (format: string) => void,
    onFilesAdded: (newFiles: File[]) => void,
    onCompressAll: () => void,
    onRemoveFile: (fileId: string) => void,
    onShowInFolder: (fileId: string) => void,
    dragDropLabel: string,
    acceptedFileTypes: string,
  ) => {
    const hasPendingFiles = files.some(f => f.status === 'pending' || f.status === 'failed');
    return (
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="flex flex-col gap-4">
            <DragDropArea onFilesAdded={onFilesAdded} acceptedFileTypes={acceptedFileTypes} label={dragDropLabel} />
            <CompressionSlider
              percentage={selectedFormat}
              onPercentageChange={onFormatChange}
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
                  onRemove={() => onRemoveFile(file.id)}
                  onShowInFolder={() => onShowInFolder(file.id)}
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
          <ConvertAllButton onClick={onCompressAll} disabled={!hasPendingFiles} />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-8 md:p-12 relative">
      <div className="absolute top-4 right-4 flex gap-2">
        <TooltipProvider>
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
        </TooltipProvider>
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
              <TabsTrigger value="image">Image</TabsTrigger>
              <TabsTrigger value="video">Video</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
              <TabsTrigger value="document">Document</TabsTrigger>
            </TabsList>

            <TabsContent value="image" className="mt-8">
              {renderFileSection(
                imageFiles, selectedImageLevel,
                (level) => handleFormatChange(level, 'image'),
                (newFiles) => handleFilesAdded(newFiles, 'image'),
                () => handleCompressAll('image'),
                (fileId) => handleRemoveFile(fileId, 'image'),
                (fileId) => handleShowInFolder(fileId, 'image'),
                "Drag & Drop Images here", "image/*",
              )}
            </TabsContent>

            <TabsContent value="video" className="mt-8">
              {renderFileSection(
                videoFiles, selectedVideoLevel,
                (level) => handleFormatChange(level, 'video'),
                (newFiles) => handleFilesAdded(newFiles, 'video'),
                () => handleCompressAll('video'),
                (fileId) => handleRemoveFile(fileId, 'video'),
                (fileId) => handleShowInFolder(fileId, 'video'),
                "Drag & Drop Videos here", "video/*",
              )}
            </TabsContent>

            <TabsContent value="audio" className="mt-8">
              {renderFileSection(
                audioFiles, selectedAudioLevel,
                (level) => handleFormatChange(level, 'audio'),
                (newFiles) => handleFilesAdded(newFiles, 'audio'),
                () => handleCompressAll('audio'),
                (fileId) => handleRemoveFile(fileId, 'audio'),
                (fileId) => handleShowInFolder(fileId, 'audio'),
                "Drag & Drop Audios here", "audio/*",
              )}
            </TabsContent>

            <TabsContent value="document" className="mt-8">
              {renderFileSection(
                documentFiles, selectedDocumentLevel,
                (level) => handleFormatChange(level, 'document'),
                (newFiles) => handleFilesAdded(newFiles, 'document'),
                () => handleCompressAll('document'),
                (fileId) => handleRemoveFile(fileId, 'document'),
                (fileId) => handleShowInFolder(fileId, 'document'),
                "Drag & Drop Documents here",
                "application/pdf,.doc,.docx,.pptx,.xlsx",
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Index;
