import React, { useState, useRef } from 'react';
import { Upload, FileText, Image as ImageIcon, CheckCircle, X, Loader2 } from 'lucide-react';
import { uploadFileToSupabase } from '../../lib/storage';
import { formatFileSize, cn } from '../../lib/utils';
import { useToast } from '../../contexts/ToastContext';

export interface FileUploadProps {
  bucket: string;
  folderPath?: string;
  accept?: string;
  maxSizeBytes?: number;
  value?: string;
  onChange: (url: string, fileMeta?: { fileName: string; fileSize: number }) => void;
  label?: string;
  helperText?: string;
  type?: 'pdf' | 'image';
  currentFileName?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  bucket,
  folderPath = 'uploads',
  accept = 'application/pdf,image/*',
  maxSizeBytes = 25 * 1024 * 1024, // 25MB
  value,
  onChange,
  label,
  helperText,
  type = 'pdf',
  currentFileName,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string>(currentFileName || '');
  const [fileSize, setFileSize] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { error: toastError, success: toastSuccess } = useToast();

  const handleFile = async (file: File) => {
    if (file.size > maxSizeBytes) {
      toastError('File too large', `Maximum allowed size is ${formatFileSize(maxSizeBytes)}.`);
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadFileToSupabase(bucket, folderPath, file);
      setFileName(result.fileName);
      setFileSize(result.fileSize);
      onChange(result.url, { fileName: result.fileName, fileSize: result.fileSize });
      toastSuccess('Upload Complete', `${file.name} uploaded successfully.`);
    } catch (err: any) {
      toastError('Upload Failed', err.message || 'Could not upload file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setFileName('');
    setFileSize(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-dark-muted">
          {label}
        </label>
      )}

      <div
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-all cursor-pointer bg-background-elevated/40 hover:bg-background-elevated/80',
          isDragging ? 'border-lavender-500 bg-lavender-500/10' : 'border-dark-border hover:border-lavender-500/40',
          isUploading && 'pointer-events-none opacity-70'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center py-3">
            <Loader2 className="w-8 h-8 animate-spin text-lavender-400 mb-2" />
            <p className="text-sm font-medium text-white">Uploading to Supabase Storage...</p>
          </div>
        ) : value ? (
          <div className="flex items-center justify-between w-full p-2 bg-background-card rounded-xl border border-dark-border">
            <div className="flex items-center gap-3 min-w-0">
              {type === 'image' ? (
                <img
                  src={value}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded-lg border border-lavender-500/30"
                />
              ) : (
                <div className="p-2.5 bg-lavender-500/10 text-lavender-400 rounded-lg">
                  <FileText className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate max-w-xs">
                  {fileName || 'Uploaded File'}
                </p>
                {fileSize > 0 && <p className="text-xs text-dark-muted">{formatFileSize(fileSize)}</p>}
                <a
                  href={value}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-lavender-400 hover:underline inline-block mt-0.5"
                >
                  View current file
                </a>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="p-1.5 text-dark-muted hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-lavender-500/10 text-lavender-400 rounded-2xl mb-3 shadow-glow-sm">
              {type === 'image' ? <ImageIcon className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
            </div>
            <p className="text-sm font-medium text-white">
              Click to browse or drag & drop {type === 'image' ? 'image' : 'PDF document'}
            </p>
            <p className="text-xs text-dark-dim mt-1">
              Supports {accept.replace(/application\//g, '').replace(/image\//g, '')} up to{' '}
              {formatFileSize(maxSizeBytes)}
            </p>
          </div>
        )}
      </div>

      {helperText && <p className="text-xs text-dark-dim">{helperText}</p>}
    </div>
  );
};
