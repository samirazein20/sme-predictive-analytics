import React, { useState, useRef } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

export interface DragDropUploadProps {
  onFilesDrop: (files: FileList) => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  isUploading?: boolean;
  multiple?: boolean;
}

export const DragDropUpload: React.FC<DragDropUploadProps> = ({
  onFilesDrop,
  accept = '.csv,.xlsx,.xls',
  maxSize = 50 * 1024 * 1024, // 50MB default
  disabled = false,
  isUploading = false,
  multiple = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: FileList): boolean => {
    setError(null);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size
      if (file.size > maxSize) {
        setError(`File "${file.name}" exceeds maximum size of ${Math.round(maxSize / (1024 * 1024))}MB`);
        return false;
      }
      
      // Check file type
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (accept && !accept.split(',').some(ext => ext.trim() === extension)) {
        setError(`File "${file.name}" has unsupported format. Accepted: ${accept}`);
        return false;
      }
    }
    
    return true;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      if (validateFiles(files)) {
        onFilesDrop(files);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (validateFiles(files)) {
        onFilesDrop(files);
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box>
      <Box
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : disabled ? 'grey.300' : 'grey.400',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          bgcolor: isDragging ? 'primary.light' : disabled ? 'grey.50' : 'grey.50',
          transition: 'all 0.3s ease',
          cursor: disabled || isUploading ? 'not-allowed' : 'pointer',
          opacity: disabled || isUploading ? 0.6 : 1,
          '&:hover': {
            borderColor: disabled || isUploading ? 'grey.300' : 'primary.main',
            bgcolor: disabled || isUploading ? 'grey.50' : 'primary.light',
            transform: disabled || isUploading ? 'none' : 'scale(1.01)',
          },
        }}
        role="button"
        tabIndex={disabled || isUploading ? -1 : 0}
        aria-label="Upload files by dragging and dropping or clicking to browse"
        aria-disabled={disabled || isUploading}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled && !isUploading) {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <CloudUpload 
          sx={{ 
            fontSize: 48, 
            color: isDragging ? 'primary.main' : 'grey.500', 
            mb: 2,
            transition: 'all 0.3s ease',
          }} 
        />
        
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
          {isDragging 
            ? 'Drop files here!' 
            : isUploading 
            ? 'Uploading...' 
            : 'Drag files here or click to browse'}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Supported: CSV, Excel (.xlsx, .xls) • Max {Math.round(maxSize / (1024 * 1024))}MB
        </Typography>
        
        <Button
          variant="contained"
          component="span"
          startIcon={<CloudUpload />}
          disabled={disabled || isUploading}
          sx={{ mt: 2 }}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          {isUploading ? 'Uploading...' : 'Choose File'}
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept={accept}
          multiple={multiple}
          onChange={handleFileInputChange}
          disabled={disabled || isUploading}
        />
      </Box>
      
      {error && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default DragDropUpload;
