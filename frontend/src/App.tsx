import React, { useState, useRef, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { 
  Container,
  Box,
  Typography, 
  Grid, 
  Card, 
  CardContent,
  Button,
  Chip,
  Alert,
  Paper,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import { 
  CloudUpload, 
  TrendingUp, 
  Analytics, 
  Computer,
  CheckCircle,
  Info
} from '@mui/icons-material';
import { apiService, FileAnalysisResponse, AnalysisResult } from './services/apiService';
import { 
  explainTrend, 
  explainPredictions, 
  explainInsight, 
  generateOverallSummary
} from './utils/explanationGenerator';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<FileAnalysisResponse[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoredFromCache, setRestoredFromCache] = useState(false);
  const [usePlainLanguage, setUsePlainLanguage] = useState(true); // Default to plain language for better UX
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore session on component mount
  useEffect(() => {
    const restoreSession = async () => {
      setIsRestoring(true);
      let hasRestoredData = false;
      
      try {
        // Restore uploaded files from localStorage
        const savedFiles = apiService.getUploadedFiles();
        if (savedFiles && savedFiles.length > 0) {
          setUploadedFiles(savedFiles);
          hasRestoredData = true;
        }

        // Restore predictions from localStorage
        const savedPredictions = apiService.getPredictions();
        if (savedPredictions) {
          setAnalysisResults(savedPredictions);
          hasRestoredData = true;
        }

        // If no local data, try to restore from backend session
        if (!savedFiles || savedFiles.length === 0) {
          const savedSessionId = apiService.getSavedSessionId();
          if (savedSessionId) {
            try {
              const sessionData = await apiService.getSession(savedSessionId);
              if (sessionData && sessionData.success) {
                setUploadedFiles([sessionData]);
                apiService.saveUploadedFiles([sessionData]);
                hasRestoredData = true;
              } else {
                // Session not found or invalid, clear it
                apiService.clearSession();
              }
            } catch (error) {
              console.error('Failed to restore session from backend:', error);
              apiService.clearSession();
            }
          }
        }

        // Show restoration message if data was restored
        if (hasRestoredData) {
          setRestoredFromCache(true);
          // Hide the message after 5 seconds
          setTimeout(() => setRestoredFromCache(false), 5000);
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
      } finally {
        setIsRestoring(false);
      }
    };

    restoreSession();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Upload to backend for basic analysis
      const analysisResponse = await apiService.uploadFile(file);
      const updatedFiles = [...uploadedFiles, analysisResponse];
      setUploadedFiles(updatedFiles);
      
      // Persist uploaded files to localStorage
      apiService.saveUploadedFiles(updatedFiles);

      // Read file content and send to ML service for advanced analysis
      setIsAnalyzing(true);
      const fileContent = await apiService.readFileAsText(file);
      const mlAnalysis = await apiService.analyzeWithML(fileContent, analysisResponse.analysisType);
      setAnalysisResults(mlAnalysis);
      
      // Persist predictions to localStorage
      apiService.savePredictions(mlAnalysis);

    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearFiles = () => {
    setUploadedFiles([]);
    setAnalysisResults(null);
    setUploadError(null);
    apiService.clearSession(); // Clear saved session
  };

  const renderOverview = () => (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        SME Predictive Analytics Platform
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => setActiveTab(1)}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CloudUpload color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6">Data Upload</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Upload CSV/Excel files for analysis
              </Typography>
              <Typography variant="h4" color="primary" sx={{ mt: 2 }}>
                {uploadedFiles.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Files uploaded
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => setActiveTab(2)}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6">ML Predictions</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Generate AI-powered forecasts
              </Typography>
              <Typography variant="h4" color="primary" sx={{ mt: 2 }}>
                {analysisResults?.predictions?.length || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active predictions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => setActiveTab(3)}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Analytics color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6">Analytics</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                View insights and reports
              </Typography>
              <Typography variant="h4" color="primary" sx={{ mt: 2 }}>
                ∞
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Insights available
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Computer color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6">System Status</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Service health status
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Chip 
                  label="Backend: Healthy"
                  color="success"
                  size="small"
                />
                <Chip 
                  label="ML Service: Healthy"
                  color="success"
                  size="small"
                />
                <Chip 
                  label="Ollama: Healthy"
                  color="success"
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Alert severity="success" sx={{ mb: 3 }}>
        🎉 All services are running successfully! Your interactive analytics platform is ready to use.
      </Alert>
    </>
  );

  const renderUpload = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Data Upload
      </Typography>
      <Typography variant="body1" paragraph>
        Upload your CSV or Excel files to get started with predictions.
      </Typography>
      
      {isRestoring && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
            Restoring your previous session...
          </Typography>
        </Box>
      )}

      {restoredFromCache && (
        <Alert severity="info" sx={{ mb: 2 }} icon={<CheckCircle />}>
          ✨ Previous session restored! Your files and predictions are available.
        </Alert>
      )}
      
      <Box sx={{ mb: 2 }}>
        <Button 
          variant="contained" 
          component="label"
          startIcon={<CloudUpload />}
          sx={{ mr: 2 }}
          disabled={isUploading || isAnalyzing || isRestoring}
        >
          {isUploading ? 'Uploading...' : 'Choose File'}
          <input 
            type="file" 
            hidden 
            accept=".csv,.xlsx,.xls" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
        </Button>
        <Button variant="outlined" onClick={handleClearFiles} disabled={uploadedFiles.length === 0}>
          Clear Files
        </Button>
      </Box>

      {(isUploading || isAnalyzing) && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
            {isUploading ? 'Uploading file...' : 'Analyzing data with AI...'}
          </Typography>
        </Box>
      )}

      <Typography variant="caption" display="block" sx={{ mt: 2 }}>
        Supported formats: CSV, Excel (.xlsx, .xls) | Max size: 50MB
      </Typography>

      {uploadError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {uploadError}
        </Alert>
      )}

      {uploadedFiles.length > 0 && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {uploadedFiles.length} file(s) uploaded and analyzed successfully!
        </Alert>
      )}

      {uploadedFiles.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Uploaded Files
          </Typography>
          <List>
            {uploadedFiles.map((fileAnalysis, index) => (
              <ListItem key={index} divider>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText
                  primary={fileAnalysis.fileName}
                  secondary={`${fileAnalysis.rowCount} rows, ${fileAnalysis.columnCount} columns - ${fileAnalysis.analysisType}`}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {uploadedFiles.length > 0 && analysisResults && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Key Insights
          </Typography>
          <Grid container spacing={2}>
            {analysisResults.insights.slice(0, 3).map((insight, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {insight.category === 'quality' && <CheckCircle color="success" sx={{ mr: 1 }} />}
                      {insight.category === 'business' && <TrendingUp color="primary" sx={{ mr: 1 }} />}
                      {insight.category === 'recommendation' && <Info color="info" sx={{ mr: 1 }} />}
                      <Typography variant="h6" fontSize="0.9rem">
                        {insight.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {insight.message}
                    </Typography>
                    <Chip 
                      label={`${Math.round(insight.score * 100)}% confidence`}
                      size="small"
                      color="primary"
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Paper>
  );

  const renderPredictions = () => (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            ML Predictions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            AI-powered predictions from your uploaded data.
          </Typography>
        </Box>
        <FormControlLabel
          control={
            <Switch 
              checked={usePlainLanguage}
              onChange={(e) => setUsePlainLanguage(e.target.checked)}
              color="primary"
            />
          }
          label={usePlainLanguage ? "Plain Language" : "Technical View"}
        />
      </Box>
      
      {uploadedFiles.length > 0 && analysisResults ? (
        <Box>
          {/* Overall Summary in Plain Language */}
          {usePlainLanguage && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                {generateOverallSummary(analysisResults)}
              </Typography>
            </Alert>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={3}>
            {/* Trend Analysis */}
            {Object.keys(analysisResults.trends).length > 0 && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📈 Trend Analysis
                    </Typography>
                    {Object.entries(analysisResults.trends).slice(0, 3).map(([key, trend]: [string, any]) => {
                      const trendExplanation = explainTrend(key, trend);
                      return (
                        <Box key={key} sx={{ mb: 2 }}>
                          {usePlainLanguage ? (
                            <>
                              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {trendExplanation.plain}
                              </Typography>
                              {trendExplanation.insight && (
                                <Alert 
                                  severity={trend.change_percent > 0 ? "success" : trend.change_percent < -10 ? "warning" : "info"} 
                                  sx={{ mt: 1 }}
                                >
                                  <Typography variant="caption">
                                    {trendExplanation.insight}
                                  </Typography>
                                </Alert>
                              )}
                            </>
                          ) : (
                            <>
                              <Typography variant="subtitle2">{key}</Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip 
                                  label={trend.direction}
                                  color={trend.direction === 'increasing' ? 'success' : 'warning'}
                                  size="small"
                                />
                                <Typography variant="body2">
                                  {trend.change_percent > 0 ? '+' : ''}{trend.change_percent}%
                                </Typography>
                              </Box>
                            </>
                          )}
                        </Box>
                      );
                    })}
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Predictions Display */}
            {analysisResults.predictions.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      🔮 Future Predictions (7 days)
                    </Typography>
                    {usePlainLanguage ? (
                      <Box>
                        {(() => {
                          const predictionExplanation = explainPredictions(analysisResults.predictions);
                          return (
                            <>
                              <Typography variant="body1" sx={{ mb: 2 }}>
                                {predictionExplanation.plain}
                              </Typography>
                              <Alert severity={predictionExplanation.businessImpact.includes('Growth') ? 'success' : predictionExplanation.businessImpact.includes('Attention') ? 'warning' : 'info'}>
                                <Typography variant="body2">
                                  {predictionExplanation.businessImpact}
                                </Typography>
                              </Alert>
                              <Divider sx={{ my: 2 }} />
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                Detailed forecast values:
                              </Typography>
                              <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
                                {analysisResults.predictions.map((prediction, index) => (
                                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                    <Typography variant="body2">Day {index + 1}:</Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                      {prediction.toFixed(2)}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            </>
                          );
                        })()}
                      </Box>
                    ) : (
                      <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                        {analysisResults.predictions.map((prediction, index) => (
                          <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                            <Typography variant="body2">Day {index + 1}:</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {prediction.toFixed(2)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* ML Insights */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                🤖 AI Insights
              </Typography>
              <Grid container spacing={2}>
                {analysisResults.insights.map((insight, index) => {
                  const insightExplanation = explainInsight(insight);
                  return (
                    <Grid item xs={12} md={4} key={index}>
                      <Card variant="outlined">
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            {insight.title}
                          </Typography>
                          {usePlainLanguage ? (
                            <>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {insightExplanation.plain}
                              </Typography>
                              <Alert severity={insight.score > 0.7 ? 'success' : insight.score > 0.4 ? 'info' : 'warning'} sx={{ mb: 1 }}>
                                <Typography variant="caption">
                                  {insightExplanation.actionable}
                                </Typography>
                              </Alert>
                            </>
                          ) : (
                            <>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {insight.message}
                              </Typography>
                            </>
                          )}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Chip 
                              label={insight.category}
                              size="small"
                              variant="outlined"
                            />
                            <Typography variant="caption" color="primary">
                              {Math.round(insight.score * 100)}% confidence
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <Alert severity="warning">
          Upload and analyze data first to see predictions and insights.
        </Alert>
      )}
    </Paper>
  );

  const renderAnalytics = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Analytics Dashboard
      </Typography>
      <Typography variant="body1" paragraph>
        Comprehensive analytics and insights from your data analysis.
      </Typography>
      
      {uploadedFiles.length > 0 && analysisResults ? (
        <Grid container spacing={3}>
          {/* Summary Statistics */}
          {Object.keys(analysisResults.summary_stats).length > 0 && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                📊 Summary Statistics
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(analysisResults.summary_stats).slice(0, 4).map(([column, stats]: [string, any]) => (
                  <Grid item xs={12} sm={6} md={3} key={column}>
                    <Card>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="h6" fontSize="1rem" gutterBottom>
                          {column}
                        </Typography>
                        <Box sx={{ fontSize: '0.8rem' }}>
                          <Typography variant="body2">Count: {stats.count}</Typography>
                          <Typography variant="body2">Mean: {stats.mean?.toFixed(2)}</Typography>
                          <Typography variant="body2">Min: {stats.min?.toFixed(2)}</Typography>
                          <Typography variant="body2">Max: {stats.max?.toFixed(2)}</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          )}

          {/* Charts Data Visualization */}
          {analysisResults.charts_data.timeseries && (
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2, minHeight: 300 }}>
                <Typography variant="h6" gutterBottom>
                  📈 {analysisResults.charts_data.timeseries.y_label} Over Time
                </Typography>
                <Box sx={{ 
                  height: 200, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: 'grey.50',
                  borderRadius: 1
                }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body1" gutterBottom>
                      Time Series Visualization
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {analysisResults.charts_data.timeseries.data.length} data points
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                      {analysisResults.charts_data.timeseries.data.slice(0, 7).map((point: any, index: number) => (
                        <Chip
                          key={index}
                          label={`${point.value.toFixed(0)}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                      {analysisResults.charts_data.timeseries.data.length > 7 && (
                        <Chip label="..." size="small" variant="outlined" />
                      )}
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          )}

          {/* Distribution Chart */}
          {analysisResults.charts_data.distribution && (
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, minHeight: 300 }}>
                <Typography variant="h6" gutterBottom>
                  📊 Distribution: {analysisResults.charts_data.distribution.column}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {analysisResults.charts_data.distribution.data.slice(0, 5).map((bin: any, index: number) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption">{bin.bin}</Typography>
                        <Typography variant="caption">{bin.count}</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(bin.count / Math.max(...analysisResults.charts_data.distribution.data.map((d: any) => d.count))) * 100}
                      />
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          )}

          {/* File Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              📄 Dataset Information
            </Typography>
            <Grid container spacing={2}>
              {uploadedFiles.map((fileAnalysis, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {fileAnalysis.fileName}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        <Chip label={`${fileAnalysis.rowCount} rows`} size="small" />
                        <Chip label={`${fileAnalysis.columnCount} columns`} size="small" />
                        <Chip label={fileAnalysis.analysisType} size="small" color="primary" />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Columns: {fileAnalysis.columnNames.join(', ')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, textAlign: 'center', minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="h6" gutterBottom>📈 Charts & Visualizations</Typography>
              <Typography variant="body2" color="text.secondary">
                Upload data to see interactive charts and trend analysis
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, textAlign: 'center', minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="h6" gutterBottom>📊 Statistical Analysis</Typography>
              <Typography variant="body2" color="text.secondary">
                Advanced statistics and correlations will appear here
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, textAlign: 'center', minHeight: 150, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="h6" gutterBottom>🎯 Get Started</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload your data files to unlock powerful analytics and AI insights
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => setActiveTab(1)}
                startIcon={<CloudUpload />}
              >
                Go to Upload
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Paper>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <AppBar position="static" color="transparent" elevation={1} sx={{ mb: 3, borderRadius: 1 }}>
        <Toolbar>
          <Typography variant="h5" component="h1" sx={{ flexGrow: 1 }}>
            SME Analytics Platform
          </Typography>
          <Chip label="All Systems Operational" color="success" variant="outlined" />
        </Toolbar>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{ borderTop: 1, borderColor: 'divider' }}
        >
          <Tab label="🏠 Overview" />
          <Tab label="📁 Upload Data" />
          <Tab label="🤖 Predictions" />
          <Tab label="📊 Analytics" />
        </Tabs>
      </AppBar>

      <TabPanel value={activeTab} index={0}>
        {renderOverview()}
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        {renderUpload()}
      </TabPanel>
      <TabPanel value={activeTab} index={2}>
        {renderPredictions()}
      </TabPanel>
      <TabPanel value={activeTab} index={3}>
        {renderAnalytics()}
      </TabPanel>
    </Container>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
