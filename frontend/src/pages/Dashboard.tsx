import React from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent
} from '@mui/material';

const Dashboard: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        SME Predictive Analytics Platform
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div">
                Data Upload
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload your business data for analysis
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div">
                ML Predictions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Generate forecasts using AI models
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div">
                Analytics Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                View insights and reports
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Welcome to Your Analytics Platform
        </Typography>
        <Typography variant="body1">
          This platform provides AI-powered predictive analytics for small and medium enterprises.
          Upload your data, generate forecasts with reasoning models, and make data-driven decisions.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Dashboard;
