import React, { useState } from 'react';
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
  Tab
} from '@mui/material';
import {
  CloudUpload,
  TrendingUp,
  Analytics
} from '@mui/icons-material';

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
  const [uploadedFiles, setUploadedFiles] = useState<number>(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const renderOverview = () => (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        SME Predictive Analytics Platform
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CloudUpload color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6">Data Upload</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Upload CSV/Excel files for analysis
              </Typography>
              <Typography variant="h4" color="primary" sx={{ mt: 2 }}>
                {uploadedFiles}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Files uploaded
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6">ML Predictions</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Generate AI-powered forecasts
              </Typography>
              <Typography variant="h4" color="primary" sx={{ mt: 2 }}>
                0
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active predictions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
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
        
      </Grid>

      <Alert severity="info" sx={{ mb: 3 }}>
        Welcome to your AI-powered analytics platform! This interactive dashboard allows you to upload data, create predictions, and view analytics.
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
      <Button 
        variant="contained" 
        component="label"
        startIcon={<CloudUpload />}
        sx={{ mr: 2 }}
      >
        Choose File
        <input type="file" hidden accept=".csv,.xlsx,.xls" />
      </Button>
      <Typography variant="caption" display="block" sx={{ mt: 2 }}>
        Supported formats: CSV, Excel (.xlsx, .xls)
      </Typography>
    </Paper>
  );

  const renderPredictions = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        ML Predictions
      </Typography>
      <Typography variant="body1" paragraph>
        Create machine learning predictions from your uploaded data.
      </Typography>
      <Alert severity="info">
        Upload data first to create predictions.
      </Alert>
    </Paper>
  );

  const renderAnalytics = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Analytics Dashboard
      </Typography>
      <Typography variant="body1" paragraph>
        View comprehensive analytics and insights from your predictions.
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Sample Chart Area</Typography>
            <Typography variant="body2" color="text.secondary">
              Charts will appear here after data upload
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Metrics Panel</Typography>
            <Typography variant="body2" color="text.secondary">
              Performance metrics will be displayed here
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );

  return (
    <Container maxWidth="lg">
      <AppBar position="static" color="transparent" elevation={0} sx={{ mb: 3 }}>
        <Toolbar>
          <Typography variant="h5" component="h1" sx={{ flexGrow: 1 }}>
            SME Analytics
          </Typography>
        </Toolbar>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Upload Data" />
          <Tab label="Predictions" />
          <Tab label="Analytics" />
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

export default Dashboard;
