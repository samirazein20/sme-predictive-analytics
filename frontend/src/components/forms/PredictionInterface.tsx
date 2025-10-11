import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  Grid,
  Divider,
} from '@mui/material';
import { PlayArrow, Refresh } from '@mui/icons-material';
import { mlService, dataService, PredictionRequest, PredictionResponse, DataUploadResponse } from '../../services/api';

interface PredictionInterfaceProps {
  uploadedData?: DataUploadResponse[];
}

const PredictionInterface: React.FC<PredictionInterfaceProps> = ({ uploadedData = [] }) => {
  const [datasets, setDatasets] = useState<DataUploadResponse[]>(uploadedData);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [predictionType, setPredictionType] = useState<'classification' | 'regression' | 'forecasting'>('regression');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PredictionResponse[]>([]);
  const [runningPredictions, setRunningPredictions] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDatasets();
    loadPredictions();
  }, []);

  const loadDatasets = async () => {
    try {
      const data = await dataService.getDatasets();
      setDatasets(data);
    } catch (err: any) {
      console.error('Failed to load datasets:', err);
    }
  };

  const loadPredictions = async () => {
    try {
      const data = await mlService.getPredictions();
      setPredictions(data);
    } catch (err: any) {
      console.error('Failed to load predictions:', err);
    }
  };

  const startPrediction = async () => {
    if (!selectedDataset || !targetColumn) {
      setError('Please select a dataset and target column');
      return;
    }

    setLoading(true);
    setError(null);

    const request: PredictionRequest = {
      dataId: selectedDataset,
      targetColumn,
      predictionType,
      parameters: {
        // Add any additional parameters based on prediction type
      },
    };

    try {
      const result = await mlService.createPrediction(request);
      setPredictions(prev => [result, ...prev]);
      setRunningPredictions(prev => new Set([...prev, result.id]));
      
      // Poll for status updates
      pollPredictionStatus(result.id);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start prediction');
    } finally {
      setLoading(false);
    }
  };

  const pollPredictionStatus = async (predictionId: string) => {
    const maxAttempts = 30; // 5 minutes maximum
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setRunningPredictions(prev => {
          const newSet = new Set(prev);
          newSet.delete(predictionId);
          return newSet;
        });
        return;
      }

      try {
        const status = await mlService.getPredictionStatus(predictionId);
        
        setPredictions(prev => 
          prev.map(p => p.id === predictionId ? status : p)
        );

        if (status.status === 'completed' || status.status === 'failed') {
          setRunningPredictions(prev => {
            const newSet = new Set(prev);
            newSet.delete(predictionId);
            return newSet;
          });
          return;
        }

        attempts++;
        setTimeout(poll, 10000); // Poll every 10 seconds
        
      } catch (err) {
        console.error('Failed to poll prediction status:', err);
        attempts++;
        setTimeout(poll, 10000);
      }
    };

    poll();
  };

  const getSelectedDataset = () => {
    return datasets.find(d => d.id === selectedDataset);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'running': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Create ML Prediction
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Dataset</InputLabel>
              <Select
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                label="Select Dataset"
              >
                {datasets.filter(d => d.status === 'ready').map((dataset) => (
                  <MenuItem key={dataset.id} value={dataset.id}>
                    {dataset.filename} ({dataset.rows} rows)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Prediction Type</InputLabel>
              <Select
                value={predictionType}
                onChange={(e) => setPredictionType(e.target.value as any)}
                label="Prediction Type"
              >
                <MenuItem value="regression">Regression</MenuItem>
                <MenuItem value="classification">Classification</MenuItem>
                <MenuItem value="forecasting">Time Series Forecasting</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Target Column</InputLabel>
              <Select
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                label="Target Column"
                disabled={!selectedDataset}
              >
                {getSelectedDataset()?.columns.map((column) => (
                  <MenuItem key={column} value={column}>
                    {column}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
            onClick={startPrediction}
            disabled={loading || !selectedDataset || !targetColumn}
          >
            {loading ? 'Starting...' : 'Start Prediction'}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadPredictions}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Prediction History
        </Typography>
        
        {predictions.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No predictions yet. Create your first prediction above.
          </Typography>
        ) : (
          <List>
            {predictions.map((prediction, index) => (
              <React.Fragment key={prediction.id}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle1">
                          Prediction #{predictions.length - index}
                        </Typography>
                        <Chip
                          label={prediction.status}
                          color={getStatusColor(prediction.status) as any}
                          size="small"
                        />
                        {runningPredictions.has(prediction.id) && (
                          <CircularProgress size={16} />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          ID: {prediction.id}
                        </Typography>
                        {prediction.results && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Results: {Array.isArray(prediction.results) 
                              ? `${prediction.results.length} predictions generated`
                              : 'Results available'}
                          </Typography>
                        )}
                        {prediction.metrics && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2">Metrics:</Typography>
                            {Object.entries(prediction.metrics).map(([key, value]) => (
                              <Chip
                                key={key}
                                label={`${key}: ${typeof value === 'number' ? value.toFixed(4) : value}`}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 1, mt: 0.5 }}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < predictions.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default PredictionInterface;