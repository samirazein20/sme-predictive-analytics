import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ThemeProvider, createTheme, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
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
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  Checkbox,
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
  TextField,
  Snackbar
} from '@mui/material';
import {
  CloudUpload,
  TrendingUp,
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
  CalendarToday,
  Settings,
  Description,
  Schedule,
  Add,
  Edit,
  Delete,
  Save,
  Chat
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
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { DataRequirementsChecklistModal } from './components/DataRequirementsChecklistModal';
import { generateTemplateCSV, formatSamplePreview } from './utils/templates';
import { ROICalculator } from './components/ROICalculator';
import { ShareToMobileButton } from './components/ShareToMobileButton';
import { generatePredictionsSummary, generateAnalyticsSummary } from './utils/mobileSummary';
import ChatPage from './pages/ChatPage';
import chatService from './services/chatService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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

// Color palette for multi-period visualization
const PERIOD_COLORS = [
  { primary: '#1976d2', light: 'rgba(25, 118, 210, 0.6)', lighter: 'rgba(25, 118, 210, 0.1)' }, // Blue
  { primary: '#9c27b0', light: 'rgba(156, 39, 176, 0.6)', lighter: 'rgba(156, 39, 176, 0.1)' }, // Purple
  { primary: '#f57c00', light: 'rgba(245, 124, 0, 0.6)', lighter: 'rgba(245, 124, 0, 0.1)' },  // Orange
  { primary: '#388e3c', light: 'rgba(56, 142, 60, 0.6)', lighter: 'rgba(56, 142, 60, 0.1)' },  // Green
  { primary: '#d32f2f', light: 'rgba(211, 47, 47, 0.6)', lighter: 'rgba(211, 47, 47, 0.1)' },  // Red
];

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
  const navigate = useNavigate();
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
  const [exportTemplateDialogOpen, setExportTemplateDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [exportTemplate, setExportTemplate] = useState({
    includeTrends: true,
    includePredictions: true,
    includeInsights: true,
    includeRecommendations: true,
    includeCharts: false, // Optional for future chart export
  });
  // Data Requirements modal state
  const [dataReqOpen, setDataReqOpen] = useState(false);
  // Sample template preview hover state
  const [templatePreview, setTemplatePreview] = useState<string | null>(null);
  const [previewAnchor, setPreviewAnchor] = useState<HTMLElement | null>(null);
  
  // Quick Start flow state
  const [quickStartActive, setQuickStartActive] = useState(false);
  const [quickStartStep, setQuickStartStep] = useState(0);
  const [quickStartCompleted, setQuickStartCompleted] = useState(() => {
    return localStorage.getItem('quickStartCompleted') === 'true';
  });

  // Comparison Mode state - Multi-period support
  interface Period {
    id: string;
    label: string;
    date: Dayjs | null;
    files: FileAnalysisResponse[];
    results: AnalysisResult | null;
    fileInputRef: React.RefObject<HTMLInputElement>;
  }

  const [periods, setPeriods] = useState<Period[]>([
    {
      id: 'period-1',
      label: 'Period 1',
      date: dayjs().subtract(2, 'month'),
      files: [],
      results: null,
      fileInputRef: React.createRef<HTMLInputElement>(),
    },
    {
      id: 'period-2',
      label: 'Period 2',
      date: dayjs().subtract(1, 'month'),
      files: [],
      results: null,
      fileInputRef: React.createRef<HTMLInputElement>(),
    },
    {
      id: 'period-3',
      label: 'Period 3',
      date: dayjs(),
      files: [],
      results: null,
      fileInputRef: React.createRef<HTMLInputElement>(),
    },
  ]);
  
  // Keep legacy state for backward compatibility with existing comparison results code
  const periodAResults = periods[0]?.results || null;
  const periodBResults = periods[1]?.results || null;

  // Schedule Management state
  const [schedules, setSchedules] = useState<any[]>([]);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    recipientEmail: '',
    frequency: 'WEEKLY',
    active: true,
  });

  // Chat state
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const conversationsLoadedRef = useRef(false);

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

  // Mobile responsive hooks
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // <600px
  // const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600-900px - reserved for future enhancements
  // const isDesktop = useMediaQuery(theme.breakpoints.up('md')); // >900px - reserved for future enhancements

  // State for progressive disclosure on mobile
  const [showAllPredictions, setShowAllPredictions] = useState(false);
  const [showAllAnalytics, setShowAllAnalytics] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Load saved export template preferences
  useEffect(() => {
    const savedTemplate = localStorage.getItem('exportTemplate');
    if (savedTemplate) {
      try {
        setExportTemplate(JSON.parse(savedTemplate));
      } catch (e) {
        console.warn('Failed to load export template preferences:', e);
      }
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

  // Load conversations when chat tab is accessed
  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      // Using userId = 1 for demo purposes
      const userId = 1;
      const convos = await chatService.getUserConversations(userId);
      setConversations(convos);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load conversations',
        severity: 'error'
      });
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 5 && !conversationsLoadedRef.current && !isLoadingConversations) {
      conversationsLoadedRef.current = true;
      loadConversations();
    }
  }, [activeTab, isLoadingConversations, loadConversations]);

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

  // Generate CSV report data (reusable for download and email)
  const generateCSVReport = (): string => {
    if (!analysisResults) return '';

    let csvContent = 'SME Analytics Report\n\n';
    csvContent += `Generated: ${new Date().toLocaleString()}\n`;
    csvContent += `Template: ${Object.entries(exportTemplate).filter(([_, v]) => v).map(([k]) => k.replace('include', '')).join(', ')}\n\n`;

    // Trends section (conditional)
    if (exportTemplate.includeTrends) {
      csvContent += 'TRENDS\n';
      csvContent += 'Metric,Direction,Change %\n';
      Object.entries(analysisResults.trends || {}).forEach(([key, trend]: [string, any]) => {
        csvContent += `${key.replace(/_/g, ' ')},${trend.direction},${trend.change_percent}%\n`;
      });
      csvContent += '\n';
    }

    // Predictions section (conditional)
    if (exportTemplate.includePredictions) {
      csvContent += 'PREDICTIONS (7 days)\n';
      csvContent += 'Day,Forecast Value\n';
      (analysisResults.predictions || []).forEach((prediction, index) => {
        csvContent += `Day ${index + 1},${prediction.toFixed(2)}\n`;
      });
      csvContent += '\n';
    }

    // Insights section (conditional)
    if (exportTemplate.includeInsights) {
      csvContent += 'AI INSIGHTS\n';
      csvContent += 'Title,Category,Message,Confidence\n';
      (analysisResults.insights || []).forEach((insight) => {
        const message = insight.message.replace(/,/g, ';'); // Replace commas to avoid CSV issues
        csvContent += `${insight.title},${insight.category},${message},${Math.round(insight.score * 100)}%\n`;
      });
      csvContent += '\n';
    }

    // Recommendations section (conditional)
    if (exportTemplate.includeRecommendations) {
      const recommendations = generateRecommendations(analysisResults);
      if (recommendations.length > 0) {
        csvContent += 'RECOMMENDATIONS\n';
        csvContent += 'Priority,Title,Category,Action\n';
        recommendations.forEach((rec) => {
          const action = rec.action.replace(/,/g, ';');
          csvContent += `${rec.priority.toUpperCase()},${rec.title},${rec.category},${action}\n`;
        });
      }
    }

    return csvContent;
  };

  const exportToCSV = () => {
    if (!analysisResults) return;

    const csvContent = generateCSVReport();

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

  const handleEmailSend = async () => {
    if (!emailAddress || !analysisResults) return;

    setIsAnalyzing(true);
    
    try {
      // Generate the CSV report data
      const reportData = generateCSVReport();
      
      // Determine report type from template
      const includedSections = Object.entries(exportTemplate)
        .filter(([_, included]) => included)
        .map(([key]) => key.replace('include', ''))
        .join(', ');
      const reportType = includedSections || 'Full Analysis';
      
      // Call backend API to send email
      const response = await fetch('http://localhost:8080/api/reports/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailAddress,
          reportData: reportData,
          reportType: reportType
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setSnackbar({
          open: true,
          message: `✅ Report successfully sent to ${emailAddress}!`,
          severity: 'success'
        });
        setEmailDialogOpen(false);
        setEmailAddress('');
      } else {
        throw new Error(result.message || 'Failed to send email');
      }
      
    } catch (error) {
      console.error('Error sending email:', error);
      setSnackbar({
        open: true,
        message: `❌ Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setIsAnalyzing(false);
    }
    setEmailAddress('');
  };

  // Multi-Period Management Functions
  const handlePeriodUpload = async (periodIndex: number, event: React.ChangeEvent<HTMLInputElement>) => {
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
      
      // Automatically analyze the data
      const analysisResponse = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_ids: data.files.map((f: FileAnalysisResponse) => f.sessionId)
        })
      });

      let analysisData: AnalysisResult | null = null;
      if (analysisResponse.ok) {
        analysisData = await analysisResponse.json();
      }

      // Update the specific period
      setPeriods(prevPeriods => {
        const newPeriods = [...prevPeriods];
        newPeriods[periodIndex] = {
          ...newPeriods[periodIndex],
          files: data.files,
          results: analysisData,
        };
        return newPeriods;
      });

    } catch (error) {
      setUploadError(`Failed to upload files for ${periods[periodIndex].label}. Please try again.`);
      console.error('Period upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const addPeriod = () => {
    const newPeriodNumber = periods.length + 1;
    const newPeriod: Period = {
      id: `period-${newPeriodNumber}`,
      label: `Period ${newPeriodNumber}`,
      date: dayjs().subtract(periods.length, 'month'),
      files: [],
      results: null,
      fileInputRef: React.createRef<HTMLInputElement>(),
    };
    setPeriods([...periods, newPeriod]);
  };

  const removePeriod = (periodIndex: number) => {
    if (periods.length <= 2) {
      setSnackbar({
        open: true,
        message: 'You must have at least 2 periods for comparison',
        severity: 'warning'
      });
      return;
    }
    setPeriods(periods.filter((_, index) => index !== periodIndex));
  };

  const updatePeriodDate = (periodIndex: number, newDate: Dayjs | null) => {
    setPeriods(prevPeriods => {
      const newPeriods = [...prevPeriods];
      newPeriods[periodIndex] = {
        ...newPeriods[periodIndex],
        date: newDate,
      };
      return newPeriods;
    });
  };

  const updatePeriodLabel = (periodIndex: number, newLabel: string) => {
    setPeriods(prevPeriods => {
      const newPeriods = [...prevPeriods];
      newPeriods[periodIndex] = {
        ...newPeriods[periodIndex],
        label: newLabel,
      };
      return newPeriods;
    });
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

  

  // Schedule Management Functions
  const fetchSchedules = async () => {
    setIsLoadingSchedules(true);
    try {
      const response = await fetch('http://localhost:8080/api/schedules');
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load schedules',
        severity: 'error'
      });
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      const url = selectedSchedule 
        ? `http://localhost:8080/api/schedules/${selectedSchedule.id}`
        : 'http://localhost:8080/api/schedules';
      
      const method = selectedSchedule ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleForm)
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: selectedSchedule ? 'Schedule updated!' : 'Schedule created!',
          severity: 'success'
        });
        setScheduleDialogOpen(false);
        setSelectedSchedule(null);
        setScheduleForm({
          name: '',
          recipientEmail: '',
          frequency: 'WEEKLY',
          active: true,
        });
        fetchSchedules();
      } else {
        throw new Error('Failed to save schedule');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to save schedule',
        severity: 'error'
      });
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const response = await fetch(`http://localhost:8080/api/schedules/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Schedule deleted',
          severity: 'success'
        });
        fetchSchedules();
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to delete schedule',
        severity: 'error'
      });
    }
  };

  const handleToggleSchedule = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/schedules/${id}/toggle`, {
        method: 'POST'
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Schedule status updated',
          severity: 'success'
        });
        fetchSchedules();
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update schedule',
        severity: 'error'
      });
    }
  };

  const handleEditSchedule = (schedule: any) => {
    setSelectedSchedule(schedule);
    setScheduleForm({
      name: schedule.name,
      recipientEmail: schedule.recipientEmail,
      frequency: schedule.frequency,
      active: schedule.active,
    });
    setScheduleDialogOpen(true);
  };

  // Load schedules when comparison tab is active
  useEffect(() => {
    if (activeTab === 1) { // Comparison tab
      fetchSchedules();
    }
  }, [activeTab]);

  // Quick Start guided flow handler
  const startQuickStart = async () => {
    setQuickStartActive(true);
    setQuickStartStep(1);
    
    // Step 1: Auto-load Coffee Shop sample data
    await handleLoadSampleData('retail');
    
    // Step 2: Navigate to Predictions after a brief delay
    setTimeout(() => {
      setQuickStartStep(2);
      setActiveTab(2); // Switch to Predictions tab
    }, 2000);
    
    // Step 3: After showing predictions, prompt for upload
    setTimeout(() => {
      setQuickStartStep(3);
    }, 5000);
  };

  const completeQuickStart = () => {
    setQuickStartCompleted(true);
    setQuickStartActive(false);
    setQuickStartStep(0);
    localStorage.setItem('quickStartCompleted', 'true');
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
      {/* Hero Section - Value Proposition */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          color: 'white',
          borderRadius: 3,
          p: { xs: 3, md: 5 },
          mb: 4,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative elements */}
        <Box sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.05)',
          zIndex: 0
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -50,
          left: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.03)',
          zIndex: 0
        }} />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant={isMobile ? 'h4' : 'h3'}
            component="h1"
            sx={{
              fontWeight: 700,
              mb: 2,
              lineHeight: 1.2
            }}
          >
            Smart Forecasting for Your Business
          </Typography>
          <Typography
            variant={isMobile ? 'h6' : 'h5'}
            sx={{
              mb: 3,
              opacity: 0.95,
              fontWeight: 400,
              maxWidth: 700
            }}
          >
            Make better decisions with AI-powered predictions. Know what's coming next week, next month, or next quarter.
          </Typography>

          {/* Key Benefits - Business Outcomes */}
          <Grid container spacing={2} sx={{ mb: 3, maxWidth: 900 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <TrendingUp sx={{ fontSize: 24, color: '#4caf50' }} />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Increase Revenue
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
                    Optimize inventory and staffing
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <InventoryOutlined sx={{ fontSize: 24, color: '#ff9800' }} />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Reduce Waste
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
                    Order the right amount
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Assessment sx={{ fontSize: 24, color: '#2196f3' }} />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Save Time
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
                    Automated insights in minutes
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <CheckCircle sx={{ fontSize: 24, color: '#4caf50' }} />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Easy to Use
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
                    No data science needed
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* CTA Buttons */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 4 }}>
            {!quickStartCompleted && (
              <Button
                variant="contained"
                size="large"
                onClick={startQuickStart}
                disabled={isUploading || isAnalyzing || quickStartActive}
                sx={{
                  bgcolor: '#4caf50',
                  color: 'white',
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  '&:hover': {
                    bgcolor: '#45a049',
                    transform: 'scale(1.02)',
                    transition: 'all 0.2s'
                  },
                  boxShadow: '0 4px 14px rgba(76, 175, 80, 0.4)'
                }}
                startIcon={quickStartActive ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <ArrowForward />}
              >
                {quickStartActive ? 'Loading Demo...' : 'See It In Action'}
              </Button>
            )}
            <Button
              variant="outlined"
              size="large"
              onClick={() => setActiveTab(1)}
              sx={{
                borderColor: 'white',
                color: 'white',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                fontSize: isMobile ? '1rem' : '1.1rem',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  transform: 'scale(1.02)',
                  transition: 'all 0.2s'
                }
              }}
              startIcon={<CloudUpload />}
            >
              Upload Your Data
            </Button>
          </Box>

          {/* Trust Signal */}
          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1, opacity: 0.9 }}>
            <Lock sx={{ fontSize: 18 }} />
            <Typography variant="body2">
              Your data is secure and private. We never share it with anyone.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Quick Start Active Progress */}
      {quickStartActive && quickStartStep > 0 && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          icon={<Info />}
        >
          {quickStartStep === 1 && (
            <Typography variant="body2">
              <strong>Step 1 of 3:</strong> Loading Coffee Shop sample data...
            </Typography>
          )}
          {quickStartStep === 2 && (
            <Typography variant="body2">
              <strong>Step 2 of 3:</strong> Here's what you'll see with YOUR data! Check out the predictions, trends, and recommendations below.
            </Typography>
          )}
          {quickStartStep === 3 && (
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Step 3 of 3:</strong> Ready to see insights for your business?
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => { setActiveTab(1); completeQuickStart(); }}
                >
                  Upload My Data
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={completeQuickStart}
                >
                  I'll Do This Later
                </Button>
              </Box>
            </Box>
          )}
        </Alert>
      )}

      {/* Quick Start Completion Badge */}
      {quickStartCompleted && (
        <Alert
          severity="success"
          icon={<CheckCircle />}
          sx={{ mb: 3 }}
        >
          <Typography variant="body2">
            <strong>Great!</strong> You've seen what this platform can do. Upload your data to get personalized insights for your business.
          </Typography>
        </Alert>
      )}

      {/* How It Works - Simple 3-Step Process */}
      <Box sx={{ mb: 5 }}>
        <Typography
          variant="h4"
          component="h2"
          align="center"
          sx={{ mb: 1, fontWeight: 700 }}
        >
          How It Works
        </Typography>
        <Typography
          variant="body1"
          align="center"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
        >
          Get started in 3 simple steps. No training required.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                textAlign: 'center',
                transition: 'all 0.3s',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
              onClick={() => setActiveTab(1)}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    bgcolor: 'primary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  <CloudUpload sx={{ fontSize: 32, color: 'primary.main' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  1. Upload Your Data
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Simply drag and drop your sales spreadsheet. CSV or Excel format works perfectly.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                textAlign: 'center',
                transition: 'all 0.3s',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
              onClick={() => setActiveTab(2)}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    bgcolor: 'success.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  <TrendingUp sx={{ fontSize: 32, color: 'success.main' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  2. Get Predictions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Our AI analyzes your data and generates accurate forecasts for the next 7 days.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                textAlign: 'center',
                transition: 'all 0.3s',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
              onClick={() => setActiveTab(3)}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    bgcolor: 'warning.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  <Lightbulb sx={{ fontSize: 32, color: 'warning.main' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  3. Take Action
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Get clear recommendations on inventory, staffing, and marketing based on your forecast.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Industry Use Cases - Social Proof */}
      <Box sx={{ mb: 5 }}>
        <Typography
          variant="h4"
          component="h2"
          align="center"
          sx={{ mb: 1, fontWeight: 700 }}
        >
          Built for Your Business
        </Typography>
        <Typography
          variant="body1"
          align="center"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
        >
          Whether you run a cafe, retail store, or restaurant, get insights tailored to your industry.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                transition: 'all 0.3s',
                '&:hover': {
                  boxShadow: 4
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                  <Storefront sx={{ fontSize: 32, color: '#6366f1' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Coffee Shops
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Predict daily foot traffic and optimize staffing. Never run out of popular items during peak hours.
                </Typography>
                <Chip label="Sample Available" size="small" color="primary" variant="outlined" />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                transition: 'all 0.3s',
                '&:hover': {
                  boxShadow: 4
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                  <Restaurant sx={{ fontSize: 32, color: '#f59e0b' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Restaurants
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Forecast reservations and reduce food waste. Plan ingredient orders with confidence.
                </Typography>
                <Chip label="Sample Available" size="small" color="primary" variant="outlined" />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                transition: 'all 0.3s',
                '&:hover': {
                  boxShadow: 4
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                  <ShoppingCart sx={{ fontSize: 32, color: '#10b981' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Retail Stores
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Anticipate demand for seasonal items and optimize inventory. Reduce overstock and stockouts.
                </Typography>
                <Chip label="Sample Available" size="small" color="primary" variant="outlined" />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                transition: 'all 0.3s',
                '&:hover': {
                  boxShadow: 4
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                  <Assessment sx={{ fontSize: 32, color: '#8b5cf6' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Service Business
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Forecast customer bookings and optimize team schedules. Plan capacity and resources ahead.
                </Typography>
                <Chip label="Custom Template" size="small" color="secondary" variant="outlined" />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Current Status Cards - Dashboard Metrics */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          component="h2"
          sx={{ mb: 3, fontWeight: 600 }}
        >
          Your Dashboard
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s',
                border: uploadedFiles.length > 0 ? '2px solid' : '1px solid',
                borderColor: uploadedFiles.length > 0 ? 'success.main' : 'divider',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)'
                }
              }}
              onClick={() => setActiveTab(1)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CloudUpload color="primary" sx={{ mr: 2, fontSize: 32 }} />
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                    Data Uploaded
                  </Typography>
                </Box>
                <Typography variant="h3" component="div" color="primary" sx={{ mb: 1, fontSize: '2.5rem', fontWeight: 700 }} aria-label={`${uploadedFiles.length} files uploaded`}>
                  {uploadedFiles.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {uploadedFiles.length === 0 ? 'Upload your first file to begin' : `${uploadedFiles.length === 1 ? 'File' : 'Files'} ready for analysis`}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s',
                border: analysisResults?.predictions?.length ? '2px solid' : '1px solid',
                borderColor: analysisResults?.predictions?.length ? 'success.main' : 'divider',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)'
                }
              }}
              onClick={() => setActiveTab(2)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUp color="primary" sx={{ mr: 2, fontSize: 32 }} />
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                    Predictions
                  </Typography>
                </Box>
                <Typography variant="h3" component="div" color="primary" sx={{ mb: 1, fontSize: '2.5rem', fontWeight: 700 }} aria-label={`${analysisResults?.predictions?.length || 0} active predictions`}>
                  {analysisResults?.predictions?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {analysisResults?.predictions?.length ? 'Forecasts ready to view' : 'Generate your first forecast'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s',
                border: analysisResults?.insights?.length ? '2px solid' : '1px solid',
                borderColor: analysisResults?.insights?.length ? 'success.main' : 'divider',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)'
                }
              }}
              onClick={() => setActiveTab(3)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Lightbulb color="primary" sx={{ mr: 2, fontSize: 32 }} />
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                    Insights
                  </Typography>
                </Box>
                <Typography variant="h3" component="div" color="primary" sx={{ mb: 1, fontSize: '2.5rem', fontWeight: 700 }}>
                  {analysisResults?.insights?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {analysisResults?.insights?.length ? 'Business insights discovered' : 'Insights appear after analysis'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Trust Signals - Security and Privacy */}
      <Card
        sx={{
          bgcolor: '#f8f9fa',
          border: '1px solid #e0e0e0'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                Your Data. Your Privacy. Guaranteed.
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <CheckCircle sx={{ fontSize: 20, color: 'success.main', mt: 0.3 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Bank-Level Encryption
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        AES-256 encryption at rest and in transit
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <CheckCircle sx={{ fontSize: 20, color: 'success.main', mt: 0.3 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Never Shared or Sold
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Your data stays private, always
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <CheckCircle sx={{ fontSize: 20, color: 'success.main', mt: 0.3 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        You Control Your Data
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Delete anytime, no questions asked
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <CheckCircle sx={{ fontSize: 20, color: 'success.main', mt: 0.3 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Compliance Ready
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        GDPR, SOC 2, and industry standards
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'center' } }}>
              <Lock sx={{ fontSize: 80, color: 'primary.main', opacity: 0.8 }} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </>
  );

  const renderUpload = () => (
    <>
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

      {/* Sample Data & Templates Section */}
      <Box sx={{ mt: 3, mb: 2 }}>
        <Divider sx={{ mb: 2 }}>
          <Chip label="SAMPLE DATA & TEMPLATES" />
        </Divider>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
          Not ready to upload your data? Try a sample or download a starter template.
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
              onMouseEnter={(e) => { setTemplatePreview(formatSamplePreview('retail')); setPreviewAnchor(e.currentTarget); }}
              onMouseLeave={() => { setTemplatePreview(null); setPreviewAnchor(null); }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Coffee Shop
              </Typography>
              <Typography variant="caption" color="text.secondary">
                15 days of retail sales data
              </Typography>
              <Typography variant="caption" color="primary" sx={{ mt: 0.5 }}>
                Hover: see sample rows
              </Typography>
            </Button>
            <Button
              fullWidth
              variant="text"
              size="small"
              sx={{ mt: 1 }}
              onClick={() => {
                const csv = generateTemplateCSV('retail');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'retail_sales_template.csv';
                link.click();
              }}
            >
              Download Retail Template
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
              onMouseEnter={(e) => { setTemplatePreview(formatSamplePreview('ecommerce')); setPreviewAnchor(e.currentTarget); }}
              onMouseLeave={() => { setTemplatePreview(null); setPreviewAnchor(null); }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Online Boutique
              </Typography>
              <Typography variant="caption" color="text.secondary">
                15 days of e-commerce data
              </Typography>
              <Typography variant="caption" color="primary" sx={{ mt: 0.5 }}>
                Hover: see sample rows
              </Typography>
            </Button>
            <Button
              fullWidth
              variant="text"
              size="small"
              sx={{ mt: 1 }}
              onClick={() => {
                const csv = generateTemplateCSV('ecommerce');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'ecommerce_template.csv';
                link.click();
              }}
            >
              Download E-commerce Template
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
              onMouseEnter={(e) => { setTemplatePreview(formatSamplePreview('service')); setPreviewAnchor(e.currentTarget); }}
              onMouseLeave={() => { setTemplatePreview(null); setPreviewAnchor(null); }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Restaurant
              </Typography>
              <Typography variant="caption" color="text.secondary">
                15 days of operations data
              </Typography>
              <Typography variant="caption" color="primary" sx={{ mt: 0.5 }}>
                Hover: see sample rows
              </Typography>
            </Button>
            <Button
              fullWidth
              variant="text"
              size="small"
              sx={{ mt: 1 }}
              onClick={() => {
                const csv = generateTemplateCSV('service');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'service_business_template.csv';
                link.click();
              }}
            >
              Download Service Template
            </Button>
          </Grid>
        </Grid>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button 
            size="small" 
            variant="contained" 
            onClick={() => setDataReqOpen(true)}
          >
            View Data Requirements
          </Button>
        </Box>
        {/* Hover Preview Popover (simple absolute box) */}
        {templatePreview && previewAnchor && (
          <Box
            role="tooltip"
            sx={{
              position: 'absolute',
              zIndex: 10,
              mt: 1,
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 3,
              p: 1.5,
              borderRadius: 1,
              fontSize: '0.75rem',
              whiteSpace: 'pre',
              maxWidth: 260
            }}
            style={{ left: previewAnchor.getBoundingClientRect().left, top: previewAnchor.getBoundingClientRect().bottom + window.scrollY }}
          >
            {templatePreview}
          </Box>
        )}
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
              <ListItem
                key={index}
                divider
                secondaryAction={
                  fileAnalysis.conversationId && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Chat />}
                      onClick={() => navigate(`/chat/${fileAnalysis.conversationId}`)}
                      size="small"
                    >
                      Chat with Data
                    </Button>
                  )
                }
              >
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
    <DataRequirementsChecklistModal open={dataReqOpen} onClose={() => setDataReqOpen(false)} />
    </>
  );

  const renderPredictions = () => (
    <Paper sx={{ p: isMobile ? 2 : 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant={isMobile ? "h4" : "h2"} component="h2" gutterBottom>
            ML Predictions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            AI-powered predictions from your uploaded data.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          {uploadedFiles.length > 0 && analysisResults && (
            <>
              {!isMobile && (
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
              {isMobile && (
                <Button
                  variant="contained"
                  startIcon={<Share />}
                  onClick={() => setShareDialogOpen(true)}
                  size="small"
                  sx={{
                    minWidth: '44px',
                    minHeight: '44px',
                    background: 'linear-gradient(45deg, #9c27b0 30%, #ba68c8 90%)',
                  }}
                >
                  📱 Share
                </Button>
              )}
            </>
          )}
          {!isMobile && (
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
          )}
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
        <MenuItem onClick={() => { setExportTemplateDialogOpen(true); handleDownloadClose(); }}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body2">Configure Template</Typography>
            <Typography variant="caption" color="text.secondary">Customize export sections</Typography>
          </ListItemText>
        </MenuItem>
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  🤖 AI Insights
                </Typography>
                {isMobile && analysisResults.insights.length > 3 && (
                  <Button
                    size="small"
                    onClick={() => setShowAllPredictions(!showAllPredictions)}
                    endIcon={showAllPredictions ? <ArrowUpwardOutlined /> : <ArrowDownwardOutlined />}
                    sx={{ minHeight: '44px' }}
                  >
                    {showAllPredictions ? 'Show Less' : `View All (${analysisResults.insights.length})`}
                  </Button>
                )}
              </Box>
              <Grid container spacing={2}>
                {analysisResults.insights
                  .slice(0, isMobile && !showAllPredictions ? 3 : analysisResults.insights.length)
                  .map((insight, index) => {
                  const insightExplanation = explainInsight(insight);
                  return (
                    <Grid item xs={12} md={4} key={index}>
                      <Card variant="outlined">
                        <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
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
                {/* ROI Calculator Section */}
                {analysisResults && analysisResults.predictions && analysisResults.predictions.length > 1 && (
                  <ROICalculator 
                    baselineRevenue={/* Derive a simple baseline from first prediction or average of uploaded revenue column if available */
                      (() => {
                        // Attempt to infer baseline from summary stats (first numeric metric labeled Revenue)
                        try {
                          const stats = (analysisResults as any).summary_stats;
                          if (stats && stats.Revenue && typeof stats.Revenue.mean === 'number') {
                            // Assume time window ~ one period; treat mean * count/periods? Simplicity: use mean * (stats.Revenue.count / stats.Revenue.count) => mean.
                            return stats.Revenue.mean;
                          }
                          // fallback to average of predictions
                          const preds = analysisResults.predictions;
                          return preds.reduce((a: number, b: number) => a + b, 0) / preds.length;
                        } catch {
                          return 0;
                        }
                      })()
                    }
                    growthPercent={(() => {
                      const preds = analysisResults.predictions;
                      const first = preds[0];
                      const last = preds[preds.length - 1];
                      if (first > 0) {
                        return ((last - first) / first) * 100;
                      }
                      return 0;
                    })()}
                    defaultGrossMargin={40}
                    defaultInvestmentRatio={30}
                  />
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
      {/* Share to Mobile Dialog */}
      {analysisResults && (
        <ShareToMobileButton
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          summary={generatePredictionsSummary(analysisResults)}
        />
      )}
    </Paper>
  );

  const renderAnalytics = () => (
    <Paper sx={{ p: isMobile ? 2 : 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant={isMobile ? "h4" : "h2"} component="h2" gutterBottom>
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" paragraph>
            Comprehensive analytics and insights from your data analysis.
          </Typography>
        </Box>
        {isMobile && uploadedFiles.length > 0 && analysisResults && (
          <Button
            variant="contained"
            startIcon={<Share />}
            onClick={() => setShareDialogOpen(true)}
            size="small"
            sx={{
              minWidth: '44px',
              minHeight: '44px',
              background: 'linear-gradient(45deg, #9c27b0 30%, #ba68c8 90%)',
            }}
          >
            📱 Share
          </Button>
        )}
      </Box>
      
      {uploadedFiles.length > 0 && analysisResults ? (
        <Grid container spacing={isMobile ? 2 : 3}>
          {/* Summary Statistics */}
          {Object.keys(analysisResults.summary_stats).length > 0 && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  📊 Summary Statistics
                </Typography>
                {isMobile && Object.keys(analysisResults.summary_stats).length > 2 && (
                  <Button
                    size="small"
                    onClick={() => setShowAllAnalytics(!showAllAnalytics)}
                    endIcon={showAllAnalytics ? <ArrowUpwardOutlined /> : <ArrowDownwardOutlined />}
                    sx={{ minHeight: '44px' }}
                  >
                    {showAllAnalytics ? 'Show Less' : `View All (${Object.keys(analysisResults.summary_stats).length})`}
                  </Button>
                )}
              </Box>
              <Grid container spacing={2}>
                {Object.entries(analysisResults.summary_stats)
                  .slice(0, isMobile && !showAllAnalytics ? 2 : Object.keys(analysisResults.summary_stats).length)
                  .map(([column, stats]: [string, any]) => (
                  <Grid item xs={12} sm={6} md={3} key={column}>
                    <Card>
                      <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                        <Typography variant="h6" fontSize={isMobile ? "0.9rem" : "1rem"} gutterBottom>
                          {column}
                        </Typography>
                        <Box sx={{ fontSize: isMobile ? '0.75rem' : '0.8rem' }}>
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
            <Grid item xs={12} md={isMobile ? 12 : 8}>
              <Paper sx={{ p: isMobile ? 1.5 : 2, minHeight: isMobile ? 200 : 300 }}>
                <Typography variant="h6" gutterBottom fontSize={isMobile ? "0.9rem" : "1.25rem"}>
                  📈 {analysisResults.charts_data.timeseries.y_label} Over Time
                </Typography>
                <Box sx={{ 
                  height: isMobile ? 150 : 200, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: 'grey.50',
                  borderRadius: 1
                }}>
                  <Box sx={{ textAlign: 'center', px: 1 }}>
                    <Typography variant="body1" gutterBottom fontSize={isMobile ? "0.85rem" : "1rem"}>
                      Time Series Visualization
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} fontSize={isMobile ? "0.75rem" : "0.875rem"}>
                      {analysisResults.charts_data.timeseries.data.length} data points
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                      {analysisResults.charts_data.timeseries.data.slice(0, isMobile ? 5 : 7).map((point: any, index: number) => (
                        <Chip
                          key={index}
                          label={`${point.value.toFixed(0)}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                      {analysisResults.charts_data.timeseries.data.length > (isMobile ? 5 : 7) && (
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
            <Grid item xs={12} md={isMobile ? 12 : 4}>
              <Paper sx={{ p: isMobile ? 1.5 : 2, minHeight: isMobile ? 200 : 300 }}>
                <Typography variant="h6" gutterBottom fontSize={isMobile ? "0.9rem" : "1.25rem"}>
                  📊 Distribution: {analysisResults.charts_data.distribution.column}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {analysisResults.charts_data.distribution.data.slice(0, isMobile ? 3 : 5).map((bin: any, index: number) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" fontSize={isMobile ? "0.7rem" : "0.75rem"}>{bin.bin}</Typography>
                        <Typography variant="caption" fontSize={isMobile ? "0.7rem" : "0.75rem"}>{bin.count}</Typography>
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
      {/* Share to Mobile Dialog for Analytics */}
      {analysisResults && (
        <ShareToMobileButton
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          summary={generateAnalyticsSummary(analysisResults)}
        />
      )}
    </Paper>
  );

  const renderComparison = () => (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Compare sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography variant="h5" gutterBottom>
                  Compare Multiple Time Periods
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upload data from multiple time periods to track how your business metrics evolve over time
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={addPeriod}
              disabled={periods.length >= 5}
              size="small"
            >
              Add Period
            </Button>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              💡 <strong>Multi-period comparison:</strong> Compare {periods.length} periods side-by-side. Add up to 5 periods to track long-term trends and identify patterns in your business metrics.
            </Typography>
          </Alert>
        </Box>

        <Grid container spacing={3}>
          {/* Dynamic Period Cards */}
          {periods.map((period, index) => {
            // Color palette for multiple periods
            const colors = [
              { border: '#1976d2', bg: 'rgba(25, 118, 210, 0.1)' }, // Blue
              { border: '#9c27b0', bg: 'rgba(156, 39, 176, 0.1)' }, // Purple
              { border: '#f57c00', bg: 'rgba(245, 124, 0, 0.1)' }, // Orange
              { border: '#388e3c', bg: 'rgba(56, 142, 60, 0.1)' }, // Green
              { border: '#d32f2f', bg: 'rgba(211, 47, 47, 0.1)' }, // Red
            ];
            const color = colors[index % colors.length];

            return (
              <Grid item xs={12} md={periods.length <= 2 ? 6 : periods.length <= 3 ? 4 : 3} key={period.id}>
                <Card sx={{ height: '100%', borderLeft: 4, borderColor: color.border, bgcolor: color.bg }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <CalendarToday sx={{ mr: 1, color: color.border }} />
                        <TextField
                          value={period.label}
                          onChange={(e) => updatePeriodLabel(index, e.target.value)}
                          variant="standard"
                          size="small"
                          sx={{ 
                            '& .MuiInput-input': { 
                              fontWeight: 600,
                              fontSize: '1.1rem'
                            } 
                          }}
                        />
                      </Box>
                      {periods.length > 2 && (
                        <IconButton 
                          size="small" 
                          onClick={() => removePeriod(index)}
                          color="error"
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      )}
                    </Box>

                    <DatePicker
                      label={`${period.label} Date`}
                      value={period.date}
                      onChange={(newValue: Dayjs | null) => updatePeriodDate(index, newValue)}
                      sx={{ width: '100%', mb: 2 }}
                      slotProps={{
                        textField: { size: 'small' }
                      }}
                    />

                    <input
                      ref={period.fileInputRef}
                      type="file"
                      multiple
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => handlePeriodUpload(index, e)}
                      style={{ display: 'none' }}
                    />

                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => period.fileInputRef.current?.click()}
                      disabled={isUploading}
                      sx={{ mb: 2 }}
                      size="small"
                    >
                      <CloudUpload sx={{ mr: 1 }} />
                      Upload Data
                    </Button>

                    {period.files.length > 0 && (
                      <Box>
                        <Typography variant="body2" color="success.main" gutterBottom>
                          ✅ {period.files.length} file(s) uploaded
                        </Typography>
                        {period.results && (
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
            );
          })}
        </Grid>

        {/* Comparison Results */}
        {periodAResults && periodBResults && (
          <Box sx={{ mt: 4 }}>
            <Divider sx={{ mb: 3 }}>
              <Chip 
                icon={<Compare />} 
                label={periods.length > 2 ? `COMPARISON RESULTS (${periods.filter(p => p.results).length} PERIODS)` : "COMPARISON RESULTS"} 
                color="primary" 
              />
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

            {/* Comparison Charts */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <ShowChart sx={{ mr: 1 }} />
                Visual Comparison
              </Typography>
              
              {/* Multi-Period Metrics Bar Chart */}
              {periods.filter(p => p.results?.trends).length >= 2 && (() => {
                const periodsWithTrends = periods.filter(p => p.results?.trends);
                const firstPeriod = periodsWithTrends[0];
                if (!firstPeriod.results?.trends) return null;
                
                return (
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Metrics Comparison ({periodsWithTrends.length} Periods)
                      </Typography>
                      <Box sx={{ height: 400 }}>
                        <Bar
                          data={{
                            labels: Object.keys(firstPeriod.results.trends).map(key => 
                              key.replace(/_/g, ' ').toUpperCase()
                            ),
                            datasets: periodsWithTrends.map((period, index) => ({
                              label: `${period.label} (${period.date?.format('MMM YYYY')})`,
                              data: Object.values(period.results!.trends!).map((trend: any) => trend.latest_value || 0),
                              backgroundColor: PERIOD_COLORS[index].light,
                              borderColor: PERIOD_COLORS[index].primary,
                              borderWidth: 2,
                            })),
                          }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top' as const,
                            },
                            title: {
                              display: false,
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                            },
                          },
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
                );
              })()}

              {/* Multi-Period Predictions Line Chart */}
              {periods.filter(p => p.results?.predictions).length >= 2 && (() => {
                const periodsWithPredictions = periods.filter(p => p.results?.predictions);
                
                return (
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Forecast Trends ({periodsWithPredictions.length} Periods, 7-Day)
                      </Typography>
                      <Box sx={{ height: 350 }}>
                        <Line
                          data={{
                            labels: Array.from({ length: 7 }, (_, i) => `Day ${i + 1}`),
                            datasets: periodsWithPredictions.map((period, index) => ({
                              label: `${period.label} Forecast`,
                              data: period.results!.predictions!,
                              borderColor: PERIOD_COLORS[index].primary,
                              backgroundColor: PERIOD_COLORS[index].lighter,
                              tension: 0.4,
                              fill: true,
                              pointRadius: 5,
                              pointHoverRadius: 7,
                            })),
                          }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top' as const,
                            },
                            tooltip: {
                              mode: 'index' as const,
                              intersect: false,
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: false,
                            },
                          },
                          interaction: {
                            mode: 'nearest' as const,
                            axis: 'x' as const,
                            intersect: false,
                          },
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
                );
              })()}

              {/* Delta Percentage Chart */}
              {periodAResults.trends && periodBResults.trends && (
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Percentage Change by Metric
                    </Typography>
                    <Box sx={{ height: 350 }}>
                      <Bar
                        data={{
                          labels: Object.keys(periodAResults.trends).map(key => 
                            key.replace(/_/g, ' ').toUpperCase()
                          ),
                          datasets: [
                            {
                              label: '% Change',
                              data: Object.keys(periodAResults.trends).map(key => {
                                const valueA = periodAResults.trends[key]?.latest_value;
                                const valueB = periodBResults.trends[key]?.latest_value;
                                const delta = calculateDelta(valueA, valueB);
                                return delta.percentage;
                              }),
                              backgroundColor: Object.keys(periodAResults.trends).map(key => {
                                const valueA = periodAResults.trends[key]?.latest_value;
                                const valueB = periodBResults.trends[key]?.latest_value;
                                const delta = calculateDelta(valueA, valueB);
                                return delta.direction === 'up' 
                                  ? 'rgba(76, 175, 80, 0.6)' 
                                  : delta.direction === 'down'
                                  ? 'rgba(244, 67, 54, 0.6)'
                                  : 'rgba(158, 158, 158, 0.6)';
                              }),
                              borderColor: Object.keys(periodAResults.trends).map(key => {
                                const valueA = periodAResults.trends[key]?.latest_value;
                                const valueB = periodBResults.trends[key]?.latest_value;
                                const delta = calculateDelta(valueA, valueB);
                                return delta.direction === 'up' 
                                  ? 'rgba(76, 175, 80, 1)' 
                                  : delta.direction === 'down'
                                  ? 'rgba(244, 67, 54, 1)'
                                  : 'rgba(158, 158, 158, 1)';
                              }),
                              borderWidth: 2,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false,
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  return `Change: ${context.parsed.y >= 0 ? '+' : ''}${context.parsed.y.toFixed(2)}%`;
                                },
                              },
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                callback: function(value) {
                                  return value + '%';
                                },
                              },
                            },
                          },
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>

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

        {/* Schedule Management Section */}
        <Box sx={{ mt: 4 }}>
          <Divider sx={{ mb: 3 }}>
            <Chip icon={<Schedule />} label="AUTOMATED SCHEDULES" color="primary" />
          </Divider>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <Schedule sx={{ mr: 1 }} />
              Manage Comparison Schedules
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setSelectedSchedule(null);
                setScheduleForm({
                  name: '',
                  recipientEmail: '',
                  frequency: 'WEEKLY',
                  active: true,
                });
                setScheduleDialogOpen(true);
              }}
            >
              Create Schedule
            </Button>
          </Box>

          {isLoadingSchedules ? (
            <LinearProgress />
          ) : schedules.length === 0 ? (
            <Alert severity="info">
              No schedules yet. Create one to automatically receive comparison reports!
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {schedules.map((schedule) => (
                <Grid item xs={12} md={6} key={schedule.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6">{schedule.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {schedule.recipientEmail}
                          </Typography>
                        </Box>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={schedule.active}
                              onChange={() => handleToggleSchedule(schedule.id)}
                              color="primary"
                            />
                          }
                          label={schedule.active ? 'Active' : 'Paused'}
                        />
                      </Box>

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Frequency</Typography>
                          <Typography variant="body1">{schedule.frequency}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Next Run</Typography>
                          <Typography variant="body1">
                            {schedule.nextRunAt ? dayjs(schedule.nextRunAt).format('MMM D, YYYY h:mm A') : 'N/A'}
                          </Typography>
                        </Grid>
                        {schedule.lastRunAt && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">Last Run</Typography>
                            <Typography variant="body1">
                              {dayjs(schedule.lastRunAt).format('MMM D, YYYY h:mm A')}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Edit />}
                          onClick={() => handleEditSchedule(schedule)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<Delete />}
                          onClick={() => handleDeleteSchedule(schedule.id)}
                        >
                          Delete
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {uploadError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {uploadError}
          </Alert>
        )}
      </Paper>
    </LocalizationProvider>
  );

  // Start a new chat from an uploaded file
  const handleStartChat = async (fileId: number, fileName: string) => {
    console.log('=== handleStartChat called ===');
    console.log('fileId:', fileId, 'fileName:', fileName);
    try {
      const userId = 1; // Demo user ID
      console.log('Creating conversation for userId:', userId);
      const conversation = await chatService.createConversation({
        userId,
        uploadedFileId: fileId,
        title: `Chat about ${fileName}`
      });
      
      console.log('Conversation created successfully:', conversation);
      // Navigate to the chat page
      navigate(`/chat/${conversation.id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start chat';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  // Render chat conversations list
  const renderChat = () => {
    console.log('=== renderChat called ===');
    console.log('uploadedFiles:', uploadedFiles);
    console.log('uploadedFiles.length:', uploadedFiles.length);
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Chat sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h5" gutterBottom>
                Chat with Your Data
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ask questions about your uploaded files and get AI-powered insights
              </Typography>
            </Box>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              💬 <strong>How it works:</strong> Upload a file in the "Upload Data" tab, then start a conversation to ask questions about your data. The AI will analyze your data and provide insights based on your questions.
            </Typography>
          </Alert>
        </Box>

        {/* Quick Start from Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Start New Chat
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select a file to start a conversation:
            </Typography>
            <Grid container spacing={2}>
              {uploadedFiles.map((file) => (
                <Grid item xs={12} md={6} key={file.sessionId}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {file.fileName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {file.rowCount} rows, {file.columnCount} columns
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Chip 
                              label={file.analysisType} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Chat />}
                          onClick={() => {
                            console.log('=== Start Chat button clicked ===');
                            console.log('file:', file);
                            console.log('file.uploadedFileId:', file.uploadedFileId);
                            if (file.uploadedFileId) {
                              handleStartChat(file.uploadedFileId, file.fileName);
                            } else {
                              console.log('uploadedFileId is missing!');
                              setSnackbar({
                                open: true,
                                message: 'File ID not available. Please re-upload the file.',
                                severity: 'error'
                              });
                            }
                          }}
                          disabled={!file.uploadedFileId}
                        >
                          Start Chat
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Existing Conversations */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Recent Conversations
          </Typography>
          
          {isLoadingConversations ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : conversations.length === 0 ? (
            <EmptyState
              icon={<Chat sx={{ fontSize: 64 }} />}
              title="No conversations yet"
              description={
                uploadedFiles.length > 0
                  ? "Start a new chat by selecting a file above"
                  : "Upload some data first, then start a conversation to ask questions about your data"
              }
              actionLabel={uploadedFiles.length === 0 ? "Upload Data" : undefined}
              onAction={uploadedFiles.length === 0 ? () => setActiveTab(1) : undefined}
            />
          ) : (
            <Grid container spacing={2}>
              {conversations.map((conversation) => (
                <Grid item xs={12} md={6} key={conversation.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { 
                        boxShadow: 3,
                        borderColor: 'primary.main' 
                      },
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                    onClick={() => navigate(`/chat/${conversation.id}`)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'start', mb: 1 }}>
                        <Chat color="primary" sx={{ mr: 1, mt: 0.5 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {conversation.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {conversation.fileName}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          {conversation.messageCount || 0} messages
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {conversation.lastMessageAt 
                            ? new Date(conversation.lastMessageAt).toLocaleDateString()
                            : new Date(conversation.createdAt).toLocaleDateString()
                          }
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Paper>
    );
  };

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
    <Container maxWidth="lg" sx={{ py: isMobile ? 1 : 2 }}>
      <AppBar position="static" color="transparent" elevation={1} sx={{ mb: isMobile ? 2 : 3, borderRadius: 1 }}>
        <Toolbar sx={{ minHeight: isMobile ? '56px' : '64px' }}>
          <Typography variant={isMobile ? "h6" : "h5"} component="h1" sx={{ flexGrow: 1 }}>
            {isMobile ? 'SME Analytics' : 'SME Analytics Platform'}
          </Typography>
        </Toolbar>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{ 
            borderTop: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: isMobile ? '48px' : '48px',
              minWidth: isMobile ? '60px' : '90px',
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              px: isMobile ? 0.5 : 2,
            }
          }}
          aria-label="Analytics platform navigation tabs"
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile
        >
          <Tab 
            label={isMobile ? "🏠" : "🏠 Overview"} 
            id="tab-overview"
            aria-controls="panel-overview"
            aria-label="Overview dashboard tab"
          />
          <Tab 
            label={isMobile ? "📁" : "📁 Upload Data"} 
            id="tab-upload"
            aria-controls="panel-upload"
            aria-label="Upload data files tab"
          />
          <Tab 
            label={isMobile ? "🤖" : "🤖 Predictions"} 
            id="tab-predictions"
            aria-controls="panel-predictions"
            aria-label="View ML predictions tab"
          />
          <Tab 
            label={isMobile ? "📊" : "📊 Analytics"} 
            id="tab-analytics"
            aria-controls="panel-analytics"
            aria-label="View analytics dashboard tab"
          />
          <Tab 
            label={isMobile ? "⚖️" : "⚖️ Compare"} 
            id="tab-compare"
            aria-controls="panel-compare"
            aria-label="Compare time periods tab"
          />
          <Tab 
            label={isMobile ? "💬" : "💬 Chat"} 
            id="tab-chat"
            aria-controls="panel-chat"
            aria-label="Chat with your data tab"
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
      <TabPanel value={activeTab} index={5}>
        {renderChat()}
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

      {/* Export Template Configuration Dialog */}
      <Dialog
        open={exportTemplateDialogOpen}
        onClose={() => setExportTemplateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Settings color="primary" />
            <Typography variant="h6">Configure Export Template</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select which sections to include in your exported reports. Your preferences will be saved for future exports.
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={exportTemplate.includeTrends}
                  onChange={(e) => setExportTemplate({ ...exportTemplate, includeTrends: e.target.checked })}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body2">Trend Analysis</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Historical trends and metric changes
                  </Typography>
                </Box>
              }
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={exportTemplate.includePredictions}
                  onChange={(e) => setExportTemplate({ ...exportTemplate, includePredictions: e.target.checked })}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body2">Predictions</Typography>
                  <Typography variant="caption" color="text.secondary">
                    7-day ML forecasts
                  </Typography>
                </Box>
              }
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={exportTemplate.includeInsights}
                  onChange={(e) => setExportTemplate({ ...exportTemplate, includeInsights: e.target.checked })}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body2">AI Insights</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Seasonality, correlations, and anomalies
                  </Typography>
                </Box>
              }
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={exportTemplate.includeRecommendations}
                  onChange={(e) => setExportTemplate({ ...exportTemplate, includeRecommendations: e.target.checked })}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body2">Recommendations</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Actionable business recommendations
                  </Typography>
                </Box>
              }
            />

            <Divider sx={{ my: 1 }} />
            
            <Alert severity="info" icon={<Description />}>
              <Typography variant="body2">
                💾 Your template preferences will be used for CSV and PDF exports
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setExportTemplateDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              // Save template to localStorage for persistence
              localStorage.setItem('exportTemplate', JSON.stringify(exportTemplate));
              setExportTemplateDialogOpen(false);
            }}
            startIcon={<Settings />}
          >
            Save Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Schedule color="primary" />
            <Typography variant="h6">
              {selectedSchedule ? 'Edit Schedule' : 'Create New Schedule'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Set up automated comparison reports to be sent to your email at regular intervals.
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              label="Schedule Name"
              fullWidth
              variant="outlined"
              value={scheduleForm.name}
              onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
              placeholder="e.g., Weekly Sales Comparison"
              helperText="Give your schedule a descriptive name"
            />

            <TextField
              label="Recipient Email"
              type="email"
              fullWidth
              variant="outlined"
              value={scheduleForm.recipientEmail}
              onChange={(e) => setScheduleForm({ ...scheduleForm, recipientEmail: e.target.value })}
              placeholder="your@email.com"
              helperText="Email address to receive the reports"
            />

            <TextField
              select
              label="Frequency"
              fullWidth
              variant="outlined"
              value={scheduleForm.frequency}
              onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value })}
              helperText="How often to send comparison reports"
            >
              <MenuItem value="DAILY">Daily</MenuItem>
              <MenuItem value="WEEKLY">Weekly</MenuItem>
              <MenuItem value="MONTHLY">Monthly</MenuItem>
            </TextField>

            <FormControlLabel
              control={
                <Switch
                  checked={scheduleForm.active}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, active: e.target.checked })}
                  color="primary"
                />
              }
              label={scheduleForm.active ? 'Active' : 'Paused'}
            />

            <Alert severity="info">
              <Typography variant="body2">
                📧 Reports will be sent automatically at 9:00 AM based on your selected frequency
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setScheduleDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveSchedule}
            disabled={!scheduleForm.name || !scheduleForm.recipientEmail}
            startIcon={<Save />}
          >
            {selectedSchedule ? 'Update' : 'Create'}
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

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
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
          <Route path="/chat/:conversationId" element={<ChatPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
