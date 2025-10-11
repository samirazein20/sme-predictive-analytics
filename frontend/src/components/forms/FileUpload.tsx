import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  CloudUpload,
  InsertDriveFile,
  Delete as DeleteIcon,
  CheckCircle,
} from '@mui/icons-material';
import { dataService, DataUploadResponse } from '../../services/api';

// Note: react-dropzone needs to be installed
// For now, using a simple input fallback
interface DropzoneState {
  getRootProps: () => any;
  getInputProps: () => any;
  isDragActive: boolean;
}

const useDropzone = (options: any): DropzoneState => {
  return {
    getRootProps: () => ({}),
    getInputProps: () => ({ type: 'file', accept: '.csv,.xlsx,.xls' }),
    isDragActive: false,
  };
};

interface FileUploadProps {
  onUploadComplete?: (data: DataUploadResponse) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<DataUploadResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await dataService.uploadFile(file);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setUploadedFiles(prev => [...prev, result]);
      onUploadComplete?.(result);
      
      setTimeout(() => {
        setProgress(0);
        setUploading(false);
      }, 1000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload file');
      setUploading(false);
      setProgress(0);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  return (
    <Box>
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor: isDragActive ? 'primary.50' : 'grey.50',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'primary.50',
          },
        }}
      >
        <input {...getInputProps()} />
        <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop your file here' : 'Drag & drop your data file'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Or click to browse files
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Chip label="CSV" size="small" sx={{ mr: 1 }} />
          <Chip label="Excel" size="small" sx={{ mr: 1 }} />
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Maximum file size: 50MB
          </Typography>
        </Box>
      </Paper>

      {uploading && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            Uploading file... {progress}%
          </Typography>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {uploadedFiles.length > 0 && (
        <Paper sx={{ mt: 2 }}>
          <Typography variant="h6" sx={{ p: 2, pb: 0 }}>
            Uploaded Files
          </Typography>
          <List>
            {uploadedFiles.map((file) => (
              <ListItem
                key={file.id}
                secondaryAction={
                  <IconButton onClick={() => removeFile(file.id)} edge="end">
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemIcon>
                  {file.status === 'ready' ? (
                    <CheckCircle color="success" />
                  ) : (
                    <InsertDriveFile />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={file.filename}
                  secondary={
                    <Box>
                      <Typography variant="caption" component="span">
                        {file.rows} rows, {file.columns.length} columns
                      </Typography>
                      <Chip
                        label={file.status}
                        size="small"
                        color={file.status === 'ready' ? 'success' : 'default'}
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default FileUpload;