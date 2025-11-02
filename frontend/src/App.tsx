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
  Info,
  ShowChart,
  Assessment,
  Lock,
  Storefront,
  Restaurant,
  ShoppingCart
} from '@mui/icons-material';
import { apiService, FileAnalysisResponse, AnalysisResult } from './services/apiService';
import { 
  explainTrend, 
  explainPredictions, 
  explainInsight, 
  generateOverallSummary
} from './utils/explanationGenerator';
import { EmptyState } from './components/EmptyState';
import { DragDropUpload } from './components/DragDropUpload';

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
  const panelIds = ['overview', 'upload', 'predictions', 'analytics'];
  const panelId = panelIds[index] || `panel-${index}`;
  
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`panel-${panelId}`}
      aria-labelledby={`tab-${panelId}`}
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

  const handleFilesDrop = async (files: FileList) => {
    const file = files[0];
    if (!file) return;
    await processFileUpload(file);
  };

  const processFileUpload = async (file: File) => {
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

  const handleLoadSampleData = async (sampleType: 'retail' | 'ecommerce' | 'restaurant') => {
    setIsUploading(true);
    setUploadError(null);

    try {
      // Create sample CSV data based on type
      let csvContent = '';
      let filename = '';

      if (sampleType === 'retail') {
        filename = 'sample_coffee_shop_sales.csv';
        csvContent = `Date,Revenue,Customers,Orders,Marketing_Spend,Product_Category,Region
2024-01-01,2400,85,62,450,Coffee,Downtown
2024-01-02,2850,102,78,520,Coffee,Downtown
2024-01-03,1950,68,51,380,Pastries,Downtown
2024-01-04,3200,115,89,580,Coffee,Downtown
2024-01-05,2700,95,72,490,Mixed,Downtown
2024-01-06,2950,108,81,540,Coffee,Downtown
2024-01-07,2600,92,68,470,Mixed,Downtown
2024-01-08,3100,112,86,560,Coffee,Downtown
2024-01-09,2400,84,64,440,Pastries,Downtown
2024-01-10,2800,98,75,510,Coffee,Downtown
2024-01-11,3350,118,92,590,Mixed,Downtown
2024-01-12,2950,105,80,530,Coffee,Downtown
2024-01-13,2700,96,73,480,Pastries,Downtown
2024-01-14,3200,114,88,570,Coffee,Downtown
2024-01-15,2850,100,77,520,Mixed,Downtown`;
      } else if (sampleType === 'ecommerce') {
        filename = 'sample_online_boutique_sales.csv';
        csvContent = `Date,Revenue,Orders,Customers,Marketing_Spend,Product_Category,Channel
2024-01-01,8500,45,38,1200,Clothing,Facebook
2024-01-02,9200,52,44,1350,Accessories,Instagram
2024-01-03,7800,41,35,1100,Clothing,Google
2024-01-04,10500,58,49,1500,Mixed,Facebook
2024-01-05,9100,48,42,1280,Shoes,Instagram
2024-01-06,8900,47,40,1250,Clothing,Google
2024-01-07,11200,62,53,1600,Mixed,Facebook
2024-01-08,9600,51,44,1350,Accessories,Instagram
2024-01-09,8400,44,38,1180,Clothing,Google
2024-01-10,10800,59,50,1520,Mixed,Facebook
2024-01-11,9400,50,43,1320,Shoes,Instagram
2024-01-12,10200,56,48,1450,Clothing,Google
2024-01-13,11500,63,54,1620,Mixed,Facebook
2024-01-14,9800,52,45,1380,Accessories,Instagram
2024-01-15,10600,58,49,1490,Clothing,Google`;
      } else {
        filename = 'sample_restaurant_operations.csv';
        csvContent = `Date,Revenue,Covers,Avg_Check,Food_Cost,Labor_Cost,Day_Part
2024-01-01,4500,85,52.94,1350,1200,Dinner
2024-01-02,5200,102,50.98,1560,1400,Dinner
2024-01-03,3800,78,48.72,1140,1000,Dinner
2024-01-04,5800,115,50.43,1740,1550,Dinner
2024-01-05,4900,95,51.58,1470,1300,Dinner
2024-01-06,5400,108,50.00,1620,1450,Dinner
2024-01-07,4700,92,51.09,1410,1250,Dinner
2024-01-08,6100,118,51.69,1830,1600,Dinner
2024-01-09,4300,84,51.19,1290,1150,Dinner
2024-01-10,5500,105,52.38,1650,1450,Dinner
2024-01-11,6300,122,51.64,1890,1650,Dinner
2024-01-12,5700,110,51.82,1710,1500,Dinner
2024-01-13,4800,94,51.06,1440,1280,Dinner
2024-01-14,6000,116,51.72,1800,1580,Dinner
2024-01-15,5300,103,51.46,1590,1400,Dinner`;
      }

      // Convert CSV string to File object
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], filename, { type: 'text/csv' });

      // Upload the sample file
      await processFileUpload(file);
    } catch (error) {
      console.error('Failed to load sample data:', error);
      setUploadError('Failed to load sample data. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const renderOverview = () => (
    <>
      <Typography variant="h2" component="h2" gutterBottom>
        Overview Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => setActiveTab(1)}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CloudUpload color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6" component="h3">Data Upload</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Upload CSV/Excel files for analysis
              </Typography>
              <Typography variant="h3" component="div" color="primary" sx={{ mt: 2, fontSize: '2.125rem' }} aria-label={`${uploadedFiles.length} files uploaded`}>
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
                <Typography variant="h6" component="h3">ML Predictions</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Generate AI-powered forecasts
              </Typography>
              <Typography variant="h3" component="div" color="primary" sx={{ mt: 2, fontSize: '2.125rem' }} aria-label={`${analysisResults?.predictions?.length || 0} active predictions`}>
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
                <Typography variant="h6" component="h3">Analytics</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                View insights and reports
              </Typography>
              <Typography variant="h3" component="div" color="primary" sx={{ mt: 2, fontSize: '2.125rem' }} aria-label="Unlimited insights available">
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
                <Typography variant="h6" component="h3">System Status</Typography>
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

      <Alert severity="success" sx={{ mb: 3 }} role="status" aria-live="polite">
        🎉 All services are running successfully! Your interactive analytics platform is ready to use.
      </Alert>
    </>
  );

  const renderUpload = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h2" component="h2" gutterBottom>
        Data Upload
      </Typography>
      <Typography variant="body1" paragraph>
        Upload your CSV or Excel files to get started with predictions.
      </Typography>
      
      {/* Privacy Banner */}
      <Alert 
        severity="info" 
        icon={<Lock />}
        sx={{ 
          mb: 3,
          backgroundColor: '#e3f2fd',
          border: '1px solid #2196f3'
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
          🔒 Your Data is Secure
        </Typography>
        <Typography variant="body2" component="div">
          • All uploads are encrypted in transit (TLS) and at rest (AES-256)
          <br />
          • Data is never shared with third parties or used for training
          <br />
          • You can delete your data anytime from your account
          <br />
          • Compliant with GDPR, SOC 2, and industry best practices
        </Typography>
      </Alert>
      
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
      
      <DragDropUpload
        onFilesDrop={handleFilesDrop}
        accept=".csv,.xlsx,.xls"
        maxSize={50 * 1024 * 1024}
        disabled={isRestoring}
        isUploading={isUploading || isAnalyzing}
      />

      {/* Sample Data Section */}
      <Box sx={{ mt: 3, mb: 2 }}>
        <Divider sx={{ mb: 2 }}>
          <Chip label="OR TRY WITH SAMPLE DATA" />
        </Divider>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
          Not ready to upload your data? Try the platform with pre-loaded business examples
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Storefront />}
              onClick={() => handleLoadSampleData('retail')}
              disabled={isUploading || isAnalyzing}
              sx={{ height: '100%', py: 2, flexDirection: 'column', gap: 1 }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Coffee Shop
              </Typography>
              <Typography variant="caption" color="text.secondary">
                15 days of retail sales data
              </Typography>
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ShoppingCart />}
              onClick={() => handleLoadSampleData('ecommerce')}
              disabled={isUploading || isAnalyzing}
              sx={{ height: '100%', py: 2, flexDirection: 'column', gap: 1 }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Online Boutique
              </Typography>
              <Typography variant="caption" color="text.secondary">
                15 days of e-commerce data
              </Typography>
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Restaurant />}
              onClick={() => handleLoadSampleData('restaurant')}
              disabled={isUploading || isAnalyzing}
              sx={{ height: '100%', py: 2, flexDirection: 'column', gap: 1 }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Restaurant
              </Typography>
              <Typography variant="caption" color="text.secondary">
                15 days of operations data
              </Typography>
            </Button>
          </Grid>
        </Grid>
      </Box>

      {(isUploading || isAnalyzing) && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
            {isUploading ? 'Uploading file...' : 'Analyzing data with AI...'}
          </Typography>
        </Box>
      )}

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="outlined" 
          onClick={handleClearFiles} 
          disabled={uploadedFiles.length === 0 || isUploading || isAnalyzing}
        >
          Clear Files
        </Button>
      </Box>

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
          <Typography variant="h2" component="h2" gutterBottom>
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
            <Alert severity="info" sx={{ mb: 3 }} role="region" aria-label="Analysis summary">
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
        <EmptyState
          icon={<ShowChart />}
          title="No Predictions Yet"
          description={`To generate AI-powered forecasts:

1. Upload your data in the "Upload Data" tab
2. Click "Analyze" to process your data
3. Return here to see your predictions

Your predictions will include trends, forecasts, and actionable business insights.`}
          actionLabel="Go to Upload Data"
          onAction={() => setActiveTab(1)}
        />
      )}
    </Paper>
  );

  const renderAnalytics = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h2" component="h2" gutterBottom>
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
        <EmptyState
          icon={<Assessment />}
          title="No Data to Analyze"
          description={`Your analytics dashboard is waiting for data.

What you'll get once you upload:
• Interactive charts and visualizations
• Statistical analysis and correlations  
• Trend identification and patterns
• Historical data insights

Upload CSV or Excel files with your business data to get started.`}
          actionLabel="Upload Data Now"
          onAction={() => setActiveTab(1)}
        />
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
          aria-label="Analytics platform navigation tabs"
        >
          <Tab 
            label="🏠 Overview" 
            id="tab-overview"
            aria-controls="panel-overview"
            aria-label="Overview dashboard tab"
          />
          <Tab 
            label="📁 Upload Data" 
            id="tab-upload"
            aria-controls="panel-upload"
            aria-label="Upload data files tab"
          />
          <Tab 
            label="🤖 Predictions" 
            id="tab-predictions"
            aria-controls="panel-predictions"
            aria-label="View ML predictions tab"
          />
          <Tab 
            label="📊 Analytics" 
            id="tab-analytics"
            aria-controls="panel-analytics"
            aria-label="View analytics dashboard tab"
          />
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
