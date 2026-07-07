'use client';

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from 'react';
import { FileText, ImageIcon, Upload, X } from 'lucide-react';

import {
  getFileUploadAccept,
  type FileUploadItemType,
  validateUploadFile,
} from '@/lib/files/upload';
import { formatFileSize } from '@/lib/files/size';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';

interface FileUploadProps {
  error?: string;
  file: File | null;
  isUploading?: boolean;
  itemType: FileUploadItemType;
  onChange: (file: File | null) => void;
  progress?: number;
}

export const FileUpload = ({
  error,
  file,
  isUploading = false,
  itemType,
  onChange,
  progress = 0,
}: FileUploadProps) => {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const previewUrl = useMemo(
    () => (itemType === 'image' && file ? URL.createObjectURL(file) : null),
    [file, itemType],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!file && inputRef.current) {
      inputRef.current.value = '';
    }
  }, [file]);

  const applyFile = (nextFile: File | null) => {
    setLocalError(null);

    if (!nextFile) {
      onChange(null);
      return;
    }

    const validationError = validateUploadFile(nextFile, itemType);

    if (validationError) {
      onChange(null);
      setLocalError(validationError);
      return;
    }

    onChange(nextFile);
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    applyFile(event.dataTransfer.files[0] ?? null);
  };

  const resolvedError = localError ?? error ?? null;
  const isImage = itemType === 'image';
  const helperText = isImage
    ? 'Upload PNG, JPG, GIF, WEBP, or SVG up to 5 MB.'
    : 'Upload PDF, text, markdown, JSON, YAML, XML, CSV, TOML, or INI up to 10 MB.';

  return (
    <div className='space-y-2'>
      <label htmlFor={inputId} className='block text-sm font-medium'>
        {isImage ? 'Image upload' : 'File upload'}
      </label>

      <input
        id={inputId}
        ref={inputRef}
        type='file'
        accept={getFileUploadAccept(itemType)}
        className='sr-only'
        onChange={(event) => applyFile(event.target.files?.[0] ?? null)}
      />

      <label
        htmlFor={inputId}
        className={cn(
          'block cursor-pointer rounded-[1.5rem] border border-dashed px-5 py-6 transition-colors',
          isDragging
            ? 'border-foreground/40 bg-muted/60'
            : 'border-border/70 bg-card/35 hover:bg-muted/40',
          resolvedError && 'border-destructive/50',
          isUploading && 'pointer-events-none opacity-80',
        )}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
          <div className='rounded-2xl border border-border/60 bg-background/80 p-3 text-muted-foreground'>
            {isImage ? <ImageIcon className='size-5' /> : <FileText className='size-5' />}
          </div>

          <div className='min-w-0 flex-1 space-y-1'>
            <p className='text-sm font-medium'>
              Drag and drop {isImage ? 'an image' : 'a file'}, or click to browse.
            </p>
            <p className='text-sm text-muted-foreground'>{helperText}</p>
          </div>

          <span className='inline-flex items-center gap-2 text-sm text-muted-foreground'>
            <Upload className='size-4' />
            Choose
          </span>
        </div>
      </label>

      {file ? (
        <div className='rounded-[1.5rem] border border-border/60 bg-card/40 p-4'>
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0 space-y-1'>
              <p className='truncate text-sm font-medium text-foreground'>{file.name}</p>
              <p className='text-sm text-muted-foreground'>{formatFileSize(file.size)}</p>
            </div>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='size-8 rounded-full'
              disabled={isUploading}
              onClick={() => {
                if (inputRef.current) {
                  inputRef.current.value = '';
                }

                applyFile(null);
              }}
            >
              <X className='size-4' />
              <span className='sr-only'>Remove file</span>
            </Button>
          </div>

          {isImage && previewUrl ? (
            <div className='mt-4 overflow-hidden rounded-2xl border border-border/60 bg-background/80'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={file.name}
                className='max-h-72 w-full object-contain'
              />
            </div>
          ) : null}

          {isUploading ? (
            <div className='mt-4 space-y-2'>
              <div className='h-2 overflow-hidden rounded-full bg-muted'>
                <div
                  className='h-full rounded-full bg-foreground transition-[width]'
                  style={{ width: `${Math.max(progress, 8)}%` }}
                />
              </div>
              <p className='text-xs text-muted-foreground'>Uploading... {progress}%</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {resolvedError ? <p className='text-sm text-destructive'>{resolvedError}</p> : null}
    </div>
  );
};
