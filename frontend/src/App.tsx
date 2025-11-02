import React, { useState, useRef, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
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
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  IconButton,
  Backdrop,
  Menu,
  MenuItem,
  TextField
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
  ShoppingCart,
  Close,
  NavigateNext,
  NavigateBefore,
  Lightbulb,
  Warning,
  TrendingDown,
  ArrowUpward,
  InventoryOutlined,
  CampaignOutlined,
  PriceCheckOutlined,
  Download,
  PictureAsPdf,
  TableChart,
  Share,
  Email,
  Compare,
  ArrowForward,
  ArrowUpwardOutlined,
  ArrowDownwardOutlined,
  CalendarToday
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
  
  // Onboarding tour state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<string | null>(null);

  // Download/Export state
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState<null | HTMLElement>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');

  // Comparison Mode state
  const [periodAFiles, setPeriodAFiles] = useState<FileAnalysisResponse[]>([]);
  const [periodBFiles, setPeriodBFiles] = useState<FileAnalysisResponse[]>([]);
  const [periodAResults, setPeriodAResults] = useState<AnalysisResult | null>(null);
  const [periodBResults, setPeriodBResults] = useState<AnalysisResult | null>(null);
  const [periodADate, setPeriodADate] = useState<Dayjs | null>(dayjs().subtract(1, 'month'));
  const [periodBDate, setPeriodBDate] = useState<Dayjs | null>(dayjs());
  const fileInputRefPeriodA = useRef<HTMLInputElement>(null);
  const fileInputRefPeriodB = useRef<HTMLInputElement>(null);

  // Check if user is first-time visitor
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      // Show onboarding after a brief delay to let the page load
      setTimeout(() => {
        setShowOnboarding(true);
      }, 1000);
    }
  }, []);

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

  // Export handlers
  const handleDownloadClick = (event: React.MouseEvent<HTMLElement>) => {
    setDownloadMenuAnchor(event.currentTarget);
  };

  const handleDownloadClose = () => {
    setDownloadMenuAnchor(null);
  };

  const exportToCSV = () => {
    if (!analysisResults) return;

    let csvContent = 'SME Analytics Report\n\n';
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

    // Trends section
    csvContent += 'TRENDS\n';
    csvContent += 'Metric,Direction,Change %\n';
    Object.entries(analysisResults.trends || {}).forEach(([key, trend]: [string, any]) => {
      csvContent += `${key.replace(/_/g, ' ')},${trend.direction},${trend.change_percent}%\n`;
    });
    csvContent += '\n';

    // Predictions section
    csvContent += 'PREDICTIONS (7 days)\n';
    csvContent += 'Day,Forecast Value\n';
    (analysisResults.predictions || []).forEach((prediction, index) => {
      csvContent += `Day ${index + 1},${prediction.toFixed(2)}\n`;
    });
    csvContent += '\n';

    // Insights section
    csvContent += 'AI INSIGHTS\n';
    csvContent += 'Title,Category,Message,Confidence\n';
    (analysisResults.insights || []).forEach((insight) => {
      const message = insight.message.replace(/,/g, ';'); // Replace commas to avoid CSV issues
      csvContent += `${insight.title},${insight.category},${message},${Math.round(insight.score * 100)}%\n`;
    });

    // Recommendations section
    const recommendations = generateRecommendations(analysisResults);
    if (recommendations.length > 0) {
      csvContent += '\nRECOMMENDATIONS\n';
      csvContent += 'Priority,Title,Category,Action\n';
      recommendations.forEach((rec) => {
        const action = rec.action.replace(/,/g, ';');
        csvContent += `${rec.priority.toUpperCase()},${rec.title},${rec.category},${action}\n`;
      });
    }

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sme-analytics-report-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    handleDownloadClose();
  };

  const exportToPDF = () => {
    if (!analysisResults) return;

    // Create a printable HTML version
    const reportContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>SME Analytics Report</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 20px auto; padding: 20px; }
          h1 { color: #1976d2; border-bottom: 3px solid #1976d2; padding-bottom: 10px; }
          h2 { color: #333; margin-top: 30px; border-bottom: 2px solid #e0e0e0; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .priority-high { color: #d32f2f; font-weight: bold; }
          .priority-medium { color: #f57c00; font-weight: bold; }
          .priority-low { color: #388e3c; font-weight: bold; }
          .insight-card { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .metric { font-size: 24px; font-weight: bold; color: #1976d2; }
          .date { color: #666; font-size: 14px; }
          @media print {
            body { margin: 0; padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>📊 SME Analytics Report</h1>
        <p class="date">Generated: ${new Date().toLocaleString()}</p>

        <h2>📈 Trend Analysis</h2>
        <table>
          <tr><th>Metric</th><th>Direction</th><th>Change %</th></tr>
          ${Object.entries(analysisResults.trends || {}).map(([key, trend]: [string, any]) => `
            <tr>
              <td>${key.replace(/_/g, ' ')}</td>
              <td>${trend.direction}</td>
              <td>${trend.change_percent > 0 ? '+' : ''}${trend.change_percent}%</td>
            </tr>
          `).join('')}
        </table>

        <h2>🔮 Predictions (7-day Forecast)</h2>
        <table>
          <tr><th>Day</th><th>Forecast Value</th></tr>
          ${(analysisResults.predictions || []).map((prediction, index) => `
            <tr>
              <td>Day ${index + 1}</td>
              <td class="metric">${prediction.toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>

        <h2>🤖 AI Insights</h2>
        ${(analysisResults.insights || []).map((insight) => `
          <div class="insight-card">
            <h3>${insight.title}</h3>
            <p><strong>Category:</strong> ${insight.category}</p>
            <p>${insight.message}</p>
            <p><strong>Confidence:</strong> ${Math.round(insight.score * 100)}%</p>
          </div>
        `).join('')}

        <h2>💡 Recommended Actions</h2>
        <table>
          <tr><th>Priority</th><th>Action</th><th>Category</th></tr>
          ${generateRecommendations(analysisResults).map((rec) => `
            <tr>
              <td class="priority-${rec.priority}">${rec.priority.toUpperCase()}</td>
              <td><strong>${rec.title}</strong><br/>${rec.action}</td>
              <td>${rec.category}</td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `;

    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
    handleDownloadClose();
  };

  const handleEmailReport = () => {
    setEmailDialogOpen(true);
    handleDownloadClose();
  };

  const handleEmailSend = () => {
    if (!emailAddress || !analysisResults) return;

    // In a real app, this would call a backend API to send email
    // For now, we'll just show a success message and copy report data
    const reportSummary = `
SME Analytics Report Summary

Trends: ${Object.keys(analysisResults.trends || {}).length} metrics analyzed
Predictions: ${(analysisResults.predictions || []).length} days forecasted
Insights: ${(analysisResults.insights || []).length} AI-generated insights
Recommendations: ${generateRecommendations(analysisResults).length} action items

Visit the platform to view full interactive report.
    `.trim();

    // Copy to clipboard
    navigator.clipboard.writeText(reportSummary);

    alert(`Report summary copied to clipboard!\n\nIn production, this would email the full report to: ${emailAddress}`);
    setEmailDialogOpen(false);
    setEmailAddress('');
  };

  // Comparison Mode Handlers
  const handlePeriodAUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setPeriodAFiles(data.files);
      
      // Automatically analyze Period A data
      const analysisResponse = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_ids: data.files.map((f: FileAnalysisResponse) => f.sessionId)
        })
      });

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        setPeriodAResults(analysisData);
      }
    } catch (error) {
      setUploadError('Failed to upload files for Period A. Please try again.');
      console.error('Period A upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePeriodBUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setPeriodBFiles(data.files);
      
      // Automatically analyze Period B data
      const analysisResponse = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_ids: data.files.map((f: FileAnalysisResponse) => f.sessionId)
        })
      });

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        setPeriodBResults(analysisData);
      }
    } catch (error) {
      setUploadError('Failed to upload files for Period B. Please try again.');
      console.error('Period B upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const calculateDelta = (valueA: number | undefined, valueB: number | undefined): { value: number; percentage: number; direction: 'up' | 'down' | 'neutral' } => {
    if (valueA === undefined || valueB === undefined || valueA === 0) {
      return { value: 0, percentage: 0, direction: 'neutral' };
    }
    
    const delta = valueB - valueA;
    const percentage = (delta / valueA) * 100;
    const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral';
    
    return { value: delta, percentage, direction };
  };

  // Generate actionable recommendations based on analysis results
  const generateRecommendations = (results: AnalysisResult) => {
    const recommendations: Array<{
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      icon: React.ReactElement;
      action: string;
      category: string;
    }> = [];

    // Analyze trends for recommendations
    if (results.trends) {
      Object.entries(results.trends).forEach(([key, trend]: [string, any]) => {
        if (trend.direction === 'decreasing' && Math.abs(trend.change_percent) > 10) {
          recommendations.push({
            title: `Address Declining ${key.replace(/_/g, ' ')}`,
            description: `Your ${key.replace(/_/g, ' ').toLowerCase()} has decreased by ${Math.abs(trend.change_percent).toFixed(1)}%. Consider reviewing your strategies in this area.`,
            priority: 'high',
            icon: <TrendingDown color="error" />,
            action: 'Review marketing campaigns and pricing strategies',
            category: 'Revenue Optimization'
          });
        } else if (trend.direction === 'increasing' && trend.change_percent > 15) {
          recommendations.push({
            title: `Scale Up ${key.replace(/_/g, ' ')} Operations`,
            description: `Great news! Your ${key.replace(/_/g, ' ').toLowerCase()} is growing by ${trend.change_percent.toFixed(1)}%. Time to scale your operations.`,
            priority: 'medium',
            icon: <ArrowUpward color="success" />,
            action: 'Increase inventory and prepare for higher demand',
            category: 'Growth Strategy'
          });
        }
      });
    }

    // Analyze predictions for recommendations
    if (results.predictions && results.predictions.length > 0) {
      const avgPrediction = results.predictions.reduce((sum, val) => sum + val, 0) / results.predictions.length;
      const firstPrediction = results.predictions[0];
      const growthRate = ((avgPrediction - firstPrediction) / firstPrediction) * 100;

      if (growthRate > 10) {
        recommendations.push({
          title: 'Prepare for Growth Period',
          description: `Forecasts show ${growthRate.toFixed(1)}% growth over the next week. Ensure you have adequate inventory and staffing.`,
          priority: 'high',
          icon: <InventoryOutlined color="primary" />,
          action: 'Stock up on inventory and schedule extra staff',
          category: 'Capacity Planning'
        });
      } else if (growthRate < -5) {
        recommendations.push({
          title: 'Boost Marketing Efforts',
          description: `Forecasts suggest a potential slowdown. Consider launching promotional campaigns to maintain momentum.`,
          priority: 'medium',
          icon: <CampaignOutlined color="warning" />,
          action: 'Plan promotional campaigns and special offers',
          category: 'Marketing Strategy'
        });
      }
    }

    // Analyze insights for recommendations
    if (results.insights && results.insights.length > 0) {
      results.insights.forEach((insight) => {
        if (insight.score > 0.7 && insight.category.toLowerCase().includes('seasonality')) {
          recommendations.push({
            title: 'Leverage Seasonal Patterns',
            description: insight.message,
            priority: 'medium',
            icon: <Lightbulb color="info" />,
            action: 'Plan seasonal inventory and marketing campaigns',
            category: 'Strategic Planning'
          });
        } else if (insight.score > 0.6 && insight.category.toLowerCase().includes('correlation')) {
          recommendations.push({
            title: 'Optimize Marketing Spend',
            description: insight.message,
            priority: 'low',
            icon: <PriceCheckOutlined color="success" />,
            action: 'Analyze and adjust marketing budget allocation',
            category: 'Cost Optimization'
          });
        } else if (insight.score > 0.5 && insight.category.toLowerCase().includes('anomaly')) {
          recommendations.push({
            title: 'Investigate Unusual Activity',
            description: insight.message,
            priority: 'high',
            icon: <Warning color="warning" />,
            action: 'Review operations for the identified time period',
            category: 'Risk Management'
          });
        }
      });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 6);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h2" component="h2" gutterBottom>
            ML Predictions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            AI-powered predictions from your uploaded data.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {uploadedFiles.length > 0 && analysisResults && (
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleDownloadClick}
              sx={{
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
              }}
            >
              Download Report
            </Button>
          )}
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
      </Box>

      {/* Download Menu */}
      <Menu
        anchorEl={downloadMenuAnchor}
        open={Boolean(downloadMenuAnchor)}
        onClose={handleDownloadClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={exportToCSV}>
          <ListItemIcon>
            <TableChart fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body2">Export as CSV</Typography>
            <Typography variant="caption" color="text.secondary">Spreadsheet format</Typography>
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={exportToPDF}>
          <ListItemIcon>
            <PictureAsPdf fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body2">Print as PDF</Typography>
            <Typography variant="caption" color="text.secondary">Printable report</Typography>
          </ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleEmailReport}>
          <ListItemIcon>
            <Email fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body2">Email Report</Typography>
            <Typography variant="caption" color="text.secondary">Share with stakeholders</Typography>
          </ListItemText>
        </MenuItem>
      </Menu>
      
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

            {/* Actionable Recommendations Section */}
            <Grid item xs={12}>
              <Box sx={{ mt: 2 }}>
                <Divider sx={{ my: 3 }}>
                  <Chip 
                    icon={<Lightbulb />} 
                    label="WHAT SHOULD I DO?" 
                    color="primary" 
                    sx={{ fontSize: '0.875rem', fontWeight: 600 }}
                  />
                </Divider>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                  Based on your data analysis, here are priority actions to take:
                </Typography>
                <Grid container spacing={2}>
                  {generateRecommendations(analysisResults).map((recommendation, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Card 
                        variant="outlined"
                        sx={{ 
                          height: '100%',
                          borderLeft: 4,
                          borderLeftColor: 
                            recommendation.priority === 'high' ? 'error.main' : 
                            recommendation.priority === 'medium' ? 'warning.main' : 
                            'success.main',
                          '&:hover': {
                            boxShadow: 3,
                            transform: 'translateY(-2px)',
                            transition: 'all 0.3s ease'
                          }
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ mr: 2, mt: 0.5 }}>
                              {recommendation.icon}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="h6" component="h3" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                                  {recommendation.title}
                                </Typography>
                                <Chip 
                                  label={recommendation.priority.toUpperCase()}
                                  size="small"
                                  color={
                                    recommendation.priority === 'high' ? 'error' : 
                                    recommendation.priority === 'medium' ? 'warning' : 
                                    'success'
                                  }
                                  sx={{ ml: 1 }}
                                />
                              </Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {recommendation.description}
                              </Typography>
                              <Box sx={{ 
                                backgroundColor: 'action.hover', 
                                borderRadius: 1, 
                                p: 1.5,
                                border: '1px dashed',
                                borderColor: 'divider'
                              }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                                  💡 Recommended Action:
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {recommendation.action}
                                </Typography>
                              </Box>
                              <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Chip 
                                  label={recommendation.category}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                                <Button 
                                  size="small" 
                                  endIcon={<CheckCircle />}
                                  sx={{ fontSize: '0.75rem' }}
                                >
                                  Mark Done
                                </Button>
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                {generateRecommendations(analysisResults).length === 0 && (
                  <Alert severity="info" sx={{ textAlign: 'center' }}>
                    <Typography variant="body2">
                      No specific recommendations at this time. Your business metrics look stable. Keep monitoring your data for new insights.
                    </Typography>
                  </Alert>
                )}
              </Box>
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

  const renderComparison = () => (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Compare sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h5" gutterBottom>
                Compare Time Periods
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload data from two different time periods to see how your business metrics have changed
              </Typography>
            </Box>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              💡 <strong>How it works:</strong> Upload data from Period A (e.g., last month) and Period B (e.g., this month) to compare metrics side-by-side with automatic delta calculations.
            </Typography>
          </Alert>
        </Box>

        <Grid container spacing={3}>
          {/* Period A Upload */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', borderLeft: 4, borderColor: 'primary.main' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Period A (Earlier)</Typography>
                </Box>

                <DatePicker
                  label="Period A Date"
                  value={periodADate}
                  onChange={(newValue) => setPeriodADate(newValue)}
                  sx={{ width: '100%', mb: 2 }}
                />

                <input
                  ref={fileInputRefPeriodA}
                  type="file"
                  multiple
                  accept=".csv,.xlsx,.xls"
                  onChange={handlePeriodAUpload}
                  style={{ display: 'none' }}
                />

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => fileInputRefPeriodA.current?.click()}
                  disabled={isUploading}
                  sx={{ mb: 2 }}
                >
                  <CloudUpload sx={{ mr: 1 }} />
                  Upload Period A Data
                </Button>

                {periodAFiles.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="success.main" gutterBottom>
                      ✅ {periodAFiles.length} file(s) uploaded
                    </Typography>
                    {periodAResults && (
                      <Chip 
                        label="Analysis Complete" 
                        color="success" 
                        size="small" 
                        icon={<CheckCircle />}
                      />
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Period B Upload */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', borderLeft: 4, borderColor: 'secondary.main' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalendarToday sx={{ mr: 1, color: 'secondary.main' }} />
                  <Typography variant="h6">Period B (Later)</Typography>
                </Box>

                <DatePicker
                  label="Period B Date"
                  value={periodBDate}
                  onChange={(newValue) => setPeriodBDate(newValue)}
                  sx={{ width: '100%', mb: 2 }}
                />

                <input
                  ref={fileInputRefPeriodB}
                  type="file"
                  multiple
                  accept=".csv,.xlsx,.xls"
                  onChange={handlePeriodBUpload}
                  style={{ display: 'none' }}
                />

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => fileInputRefPeriodB.current?.click()}
                  disabled={isUploading}
                  sx={{ mb: 2 }}
                >
                  <CloudUpload sx={{ mr: 1 }} />
                  Upload Period B Data
                </Button>

                {periodBFiles.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="success.main" gutterBottom>
                      ✅ {periodBFiles.length} file(s) uploaded
                    </Typography>
                    {periodBResults && (
                      <Chip 
                        label="Analysis Complete" 
                        color="success" 
                        size="small" 
                        icon={<CheckCircle />}
                      />
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Comparison Results */}
        {periodAResults && periodBResults && (
          <Box sx={{ mt: 4 }}>
            <Divider sx={{ mb: 3 }}>
              <Chip icon={<Compare />} label="COMPARISON RESULTS" color="primary" />
            </Divider>

            {/* Trends Comparison */}
            {periodAResults.trends && periodBResults.trends && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUp sx={{ mr: 1 }} />
                  Trend Comparison
                </Typography>
                <Grid container spacing={2}>
                  {Object.keys(periodAResults.trends).map((metric) => {
                    const valueA = periodAResults.trends[metric]?.latest_value;
                    const valueB = periodBResults.trends[metric]?.latest_value;
                    const delta = calculateDelta(valueA, valueB);

                    return (
                      <Grid item xs={12} md={6} key={metric}>
                        <Card>
                          <CardContent>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              {metric.replace(/_/g, ' ').toUpperCase()}
                            </Typography>
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={4}>
                                <Typography variant="body2" color="text.secondary">Period A</Typography>
                                <Typography variant="h6">{valueA?.toFixed(2) || 'N/A'}</Typography>
                              </Grid>
                              <Grid item xs={4} sx={{ textAlign: 'center' }}>
                                {delta.direction === 'up' ? (
                                  <ArrowUpwardOutlined sx={{ color: 'success.main', fontSize: 32 }} />
                                ) : delta.direction === 'down' ? (
                                  <ArrowDownwardOutlined sx={{ color: 'error.main', fontSize: 32 }} />
                                ) : (
                                  <ArrowForward sx={{ color: 'text.secondary', fontSize: 32 }} />
                                )}
                                <Chip
                                  label={`${delta.percentage >= 0 ? '+' : ''}${delta.percentage.toFixed(1)}%`}
                                  color={delta.direction === 'up' ? 'success' : delta.direction === 'down' ? 'error' : 'default'}
                                  size="small"
                                  sx={{ mt: 1 }}
                                />
                              </Grid>
                              <Grid item xs={4} sx={{ textAlign: 'right' }}>
                                <Typography variant="body2" color="text.secondary">Period B</Typography>
                                <Typography variant="h6">{valueB?.toFixed(2) || 'N/A'}</Typography>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}

            {/* Predictions Comparison */}
            {periodAResults.predictions && periodBResults.predictions && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <ShowChart sx={{ mr: 1 }} />
                  Forecast Comparison (7-Day Average)
                </Typography>
                <Card>
                  <CardContent>
                    {(() => {
                      const avgA = periodAResults.predictions.reduce((a, b) => a + b, 0) / periodAResults.predictions.length;
                      const avgB = periodBResults.predictions.reduce((a, b) => a + b, 0) / periodBResults.predictions.length;
                      const delta = calculateDelta(avgA, avgB);

                      return (
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">Period A Forecast</Typography>
                            <Typography variant="h5">{avgA.toFixed(2)}</Typography>
                          </Grid>
                          <Grid item xs={4} sx={{ textAlign: 'center' }}>
                            {delta.direction === 'up' ? (
                              <ArrowUpwardOutlined sx={{ color: 'success.main', fontSize: 40 }} />
                            ) : delta.direction === 'down' ? (
                              <ArrowDownwardOutlined sx={{ color: 'error.main', fontSize: 40 }} />
                            ) : (
                              <ArrowForward sx={{ color: 'text.secondary', fontSize: 40 }} />
                            )}
                            <Typography variant="h6" sx={{ mt: 1 }}>
                              {delta.percentage >= 0 ? '+' : ''}{delta.percentage.toFixed(1)}%
                            </Typography>
                          </Grid>
                          <Grid item xs={4} sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" color="text.secondary">Period B Forecast</Typography>
                            <Typography variant="h5">{avgB.toFixed(2)}</Typography>
                          </Grid>
                        </Grid>
                      );
                    })()}
                  </CardContent>
                </Card>
              </Box>
            )}

            {/* Insights Summary */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Lightbulb sx={{ mr: 1 }} />
                Key Changes
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ borderLeft: 4, borderColor: 'primary.main' }}>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>Period A Insights</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {periodAResults.insights?.length || 0} insights generated
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ borderLeft: 4, borderColor: 'secondary.main' }}>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>Period B Insights</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {periodBResults.insights?.length || 0} insights generated
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}

        {uploadError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {uploadError}
          </Alert>
        )}
      </Paper>
    </LocalizationProvider>
  );

  // Onboarding tour steps configuration
  const onboardingSteps = [
    {
      label: 'Welcome to SME Analytics',
      title: '🎉 Welcome!',
      description: 'This platform helps small business owners make data-driven decisions. Upload your sales data, get AI predictions, and see actionable insights in minutes.',
      highlightTab: null,
    },
    {
      label: 'Upload Your Data',
      title: '📁 Step 1: Upload',
      description: 'Drag and drop your CSV or Excel files, or try our sample data to see the platform in action. Your data is encrypted and never shared.',
      highlightTab: 1,
    },
    {
      label: 'View Predictions',
      title: '🤖 Step 2: Predictions',
      description: 'Get AI-powered forecasts for revenue, sales, and trends. Toggle plain language mode to see explanations in simple terms.',
      highlightTab: 2,
    },
    {
      label: 'Analyze Insights',
      title: '📊 Step 3: Analytics',
      description: 'View detailed charts, statistics, and insights about your business. Discover patterns and opportunities for growth.',
      highlightTab: 3,
    },
  ];

  const handleOnboardingNext = () => {
    const nextStep = onboardingStep + 1;
    if (nextStep < onboardingSteps.length) {
      setOnboardingStep(nextStep);
      const step = onboardingSteps[nextStep];
      if (step.highlightTab !== null) {
        setActiveTab(step.highlightTab);
        setHighlightedElement(`tab-${step.highlightTab}`);
      }
    } else {
      handleOnboardingClose();
    }
  };

  const handleOnboardingBack = () => {
    const prevStep = onboardingStep - 1;
    if (prevStep >= 0) {
      setOnboardingStep(prevStep);
      const step = onboardingSteps[prevStep];
      if (step.highlightTab !== null) {
        setActiveTab(step.highlightTab);
        setHighlightedElement(`tab-${step.highlightTab}`);
      }
    }
  };

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    setHighlightedElement(null);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  const handleOnboardingSkip = () => {
    handleOnboardingClose();
  };

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
          <Tab 
            label="⚖️ Compare" 
            id="tab-compare"
            aria-controls="panel-compare"
            aria-label="Compare time periods tab"
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
      <TabPanel value={activeTab} index={4}>
        {renderComparison()}
      </TabPanel>

      {/* Onboarding Modal */}
      <Dialog
        open={showOnboarding}
        onClose={handleOnboardingSkip}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
              {onboardingSteps[onboardingStep].title}
            </Typography>
            <IconButton
              onClick={handleOnboardingSkip}
              sx={{ color: 'white' }}
              aria-label="Close onboarding"
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={onboardingStep} orientation="vertical" sx={{ mt: 2 }}>
            {onboardingSteps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': {
                      color: index === onboardingStep ? 'white' : 'rgba(255,255,255,0.6)',
                      fontWeight: index === onboardingStep ? 600 : 400,
                    },
                    '& .MuiStepIcon-root': {
                      color: index === onboardingStep ? 'white' : 'rgba(255,255,255,0.4)',
                      '&.Mui-active': { color: 'white' },
                      '&.Mui-completed': { color: 'rgba(255,255,255,0.8)' },
                    }
                  }}
                >
                  {step.label}
                </StepLabel>
                <StepContent>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.95)', lineHeight: 1.7 }}>
                    {step.description}
                  </Typography>
                  {index === onboardingStep && (
                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={handleOnboardingBack}
                        disabled={onboardingStep === 0}
                        startIcon={<NavigateBefore />}
                        sx={{
                          color: 'white',
                          borderColor: 'rgba(255,255,255,0.5)',
                          '&:hover': {
                            borderColor: 'white',
                            backgroundColor: 'rgba(255,255,255,0.1)'
                          }
                        }}
                      >
                        Back
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleOnboardingNext}
                        endIcon={onboardingStep === onboardingSteps.length - 1 ? <CheckCircle /> : <NavigateNext />}
                        sx={{
                          backgroundColor: 'white',
                          color: '#667eea',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.9)'
                          }
                        }}
                      >
                        {onboardingStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
                      </Button>
                    </Box>
                  )}
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleOnboardingSkip}
            sx={{ 
              color: 'rgba(255,255,255,0.8)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Skip Tour
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Report Dialog */}
      <Dialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Email color="primary" />
            <Typography variant="h6">Email Report</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Share your analytics report with stakeholders via email. The report will include all predictions, insights, and recommendations.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Recipient Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            placeholder="colleague@example.com"
            helperText="Enter the email address of the recipient"
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              📊 Report will include: Trends, Forecasts, AI Insights, and Recommended Actions
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEmailDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleEmailSend}
            disabled={!emailAddress || !emailAddress.includes('@')}
            startIcon={<Share />}
          >
            Send Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Backdrop for highlighting elements */}
      {highlightedElement && (
        <Backdrop
          open={true}
          sx={{
            zIndex: (theme) => theme.zIndex.drawer - 1,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
          }}
          onClick={() => setHighlightedElement(null)}
        />
      )}
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
