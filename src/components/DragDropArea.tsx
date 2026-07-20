import React, { useState, useCallback } from "react";
import { UploadCloud } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DragDropAreaProps {
  onFilesAdded: (files: File[]) => void;
  acceptedFileTypes: string;
  label: string;
}

const DragDropArea: React.FC<DragDropAreaProps> = ({ onFilesAdded, acceptedFileTypes, label }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const matchesAcceptedType = useCallback((file: File) => {
    if (acceptedFileTypes === "*/*") return true;
    return acceptedFileTypes.split(',').some(type => {
      const trimmedType = type.trim();
      // Match by extension (e.g. ".docx", ".pptx")
      if (trimmedType.startsWith('.')) {
        return file.name.toLowerCase().endsWith(trimmedType.toLowerCase());
      }
      // Match by wildcard MIME (e.g. "image/*")
      if (trimmedType.endsWith('/*')) {
        return file.type.startsWith(trimmedType.slice(0, -1));
      }
      // Match by exact MIME type
      return file.type === trimmedType;
    });
  }, [acceptedFileTypes]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(matchesAcceptedType);

    if (droppedFiles.length > 0) {
      onFilesAdded(droppedFiles);
    }
  }, [onFilesAdded, matchesAcceptedType]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter(matchesAcceptedType);
    if (selectedFiles.length > 0) {
      onFilesAdded(selectedFiles);
    }
  }, [onFilesAdded, matchesAcceptedType]);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-xl transition-all duration-300",
        "border-border hover:border-primary",
        isDragging && "border-primary bg-accent"
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <UploadCloud className="w-12 h-12 mb-4 text-muted-foreground" />
      <p className="text-lg font-semibold text-foreground mb-2">{label}</p>
      <p className="text-muted-foreground mb-4">or</p>
      <label
        htmlFor={`file-upload-${label.replace(/\s/g, '-')}`}
        className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
      >
        Browse Files
      </label>
      <Input
        id={`file-upload-${label.replace(/\s/g, '-')}`}
        type="file"
        multiple
        accept={acceptedFileTypes}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default DragDropArea;