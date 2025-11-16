import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip
} from '@mui/material';
import {
  AutoAwesome,
  TrendingUp,
  BarChart,
  CompareArrows,
  AttachMoney,
  CalendarToday,
  Warning,
  PieChart,
  TrackChanges,
  Psychology,
  ChevronRight,
  Description,
  Calculate,
  Bolt,
  ArrowBack
} from '@mui/icons-material';

interface PromptCard {
  id: string;
  category: 'financial' | 'predictions' | 'analytics' | 'compare';
  title: string;
  description: string;
  prompt: string;
  Icon: React.ElementType;
  color: string;
}

const AIAssistant: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All Features', Icon: AutoAwesome, color: '#9333ea' },
    { id: 'financial', name: 'Financial Planning', Icon: AttachMoney, color: '#10b981' },
    { id: 'predictions', name: 'Forecasting', Icon: TrendingUp, color: '#3b82f6' },
    { id: 'analytics', name: 'Analytics', Icon: BarChart, color: '#f97316' },
    { id: 'compare', name: 'Comparisons', Icon: CompareArrows, color: '#ec4899' }
  ];

  const promptCards: PromptCard[] = [
    // Financial Planning
    {
      id: 'cash-flow',
      category: 'financial',
      title: 'Cash Flow Analysis',
      description: 'Understand your cash flow patterns and improve liquidity',
      prompt: 'Analyze my cash flow patterns. When do I have the most money coming in vs going out? Help me identify any cash flow issues and suggest ways to improve my working capital.',
      Icon: AttachMoney,
      color: '#10b981'
    },
    {
      id: 'budget-planning',
      category: 'financial',
      title: 'Budget Planning',
      description: 'Create and optimize your business budget',
      prompt: 'Help me create a practical budget for my business. Show me where I am spending the most money and suggest areas where I could cut costs without hurting sales.',
      Icon: Calculate,
      color: '#10b981'
    },
    {
      id: 'profit-margins',
      category: 'financial',
      title: 'Profit Margin Optimization',
      description: 'Find ways to increase your profit margins',
      prompt: 'Analyze my profit margins. Which products or services are most profitable? Where can I increase prices or reduce costs to improve my bottom line?',
      Icon: TrackChanges,
      color: '#10b981'
    },
    {
      id: 'expense-tracking',
      category: 'financial',
      title: 'Expense Management',
      description: 'Track and optimize your business expenses',
      prompt: 'Break down my expenses by category. Which costs are growing fastest? Help me identify unnecessary expenses and suggest ways to reduce spending.',
      Icon: Description,
      color: '#10b981'
    },

    // Forecasting / Predictions
    {
      id: 'revenue-forecast',
      category: 'predictions',
      title: 'Revenue Forecasting',
      description: 'Predict future revenue based on trends',
      prompt: 'Based on my sales history, what revenue should I expect next month and next quarter? What factors might affect these predictions?',
      Icon: TrendingUp,
      color: '#3b82f6'
    },
    {
      id: 'seasonal-trends',
      category: 'predictions',
      title: 'Seasonal Trends',
      description: 'Identify seasonal patterns in your business',
      prompt: 'What seasonal patterns exist in my business? When are my peak and slow periods? How should I prepare for these changes?',
      Icon: CalendarToday,
      color: '#3b82f6'
    },
    {
      id: 'inventory-forecast',
      category: 'predictions',
      title: 'Inventory Planning',
      description: 'Forecast inventory needs to avoid stockouts',
      prompt: 'Based on my sales trends, how much inventory should I order? When should I reorder to avoid running out of stock?',
      Icon: Warning,
      color: '#3b82f6'
    },
    {
      id: 'growth-projection',
      category: 'predictions',
      title: 'Growth Projections',
      description: 'Project business growth trajectories',
      prompt: 'If I maintain my current growth rate, where will my business be in 6 months? What growth rate should I aim for to reach my goals?',
      Icon: Bolt,
      color: '#3b82f6'
    },

    // Analytics
    {
      id: 'customer-insights',
      category: 'analytics',
      title: 'Customer Insights',
      description: 'Understand your customer behavior',
      prompt: 'Who are my best customers? What do they buy and how often? How can I attract more customers like them?',
      Icon: Psychology,
      color: '#f97316'
    },
    {
      id: 'product-performance',
      category: 'analytics',
      title: 'Product Performance',
      description: 'Analyze which products drive success',
      prompt: 'Which products or services are my top performers? Which ones are underperforming? Should I focus more on certain offerings?',
      Icon: BarChart,
      color: '#f97316'
    },
    {
      id: 'marketing-roi',
      category: 'analytics',
      title: 'Marketing ROI',
      description: 'Measure marketing effectiveness',
      prompt: 'Which marketing channels bring in the most customers and revenue? Where should I increase my marketing spend for the best return?',
      Icon: TrackChanges,
      color: '#f97316'
    },
    {
      id: 'kpi-dashboard',
      category: 'analytics',
      title: 'Key Performance Indicators',
      description: 'Track your most important metrics',
      prompt: 'What are the most important numbers I should track in my business? Show me my key performance indicators and how they are trending.',
      Icon: PieChart,
      color: '#f97316'
    },

    // Comparisons
    {
      id: 'period-comparison',
      category: 'compare',
      title: 'Period Comparison',
      description: 'Compare performance across time periods',
      prompt: 'Compare this month to last month. What has improved? What has declined? What should I focus on to maintain or improve performance?',
      Icon: CompareArrows,
      color: '#ec4899'
    },
    {
      id: 'product-comparison',
      category: 'compare',
      title: 'Product Comparison',
      description: 'Compare different products or services',
      prompt: 'Compare the performance of my different products or services. Which should I promote more? Which should I consider discontinuing?',
      Icon: BarChart,
      color: '#ec4899'
    },
    {
      id: 'channel-comparison',
      category: 'compare',
      title: 'Sales Channel Comparison',
      description: 'Compare different sales or marketing channels',
      prompt: 'Compare my different sales or marketing channels. Which ones are most cost-effective? Where should I invest more resources?',
      Icon: TrendingUp,
      color: '#ec4899'
    },
    {
      id: 'benchmark',
      category: 'compare',
      title: 'Goal Tracking',
      description: 'Track progress against your goals',
      prompt: 'How am I tracking against my goals? Am I on pace to hit my targets? What adjustments should I make to stay on track?',
      Icon: TrackChanges,
      color: '#ec4899'
    }
  ];

  const filteredPrompts = selectedCategory === 'all'
    ? promptCards
    : promptCards.filter(card => card.category === selectedCategory);

  const handlePromptClick = (prompt: string) => {
    // Save the prompt to sessionStorage so it can be used when a chat conversation starts
    sessionStorage.setItem('pendingFinancialPrompt', prompt);
    
    // Navigate to Dashboard - it will either open chat tab if data exists, or upload tab if no data
    navigate('/', {
      state: {
        action: 'from-ai-assistant'
      }
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f3ff 0%, #ffffff 50%, #eff6ff 100%)' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'white', borderBottom: 1, borderColor: 'divider', boxShadow: 1 }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  background: 'linear-gradient(135deg, #9333ea 0%, #6366f1 100%)',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 3
                }}
              >
                <AutoAwesome sx={{ fontSize: 32, color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700} color="text.primary">
                  AI Assistant for Small Business
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Get instant insights, forecasts, and guidance powered by AI
                </Typography>
              </Box>
            </Box>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/')}
              sx={{ color: 'text.secondary' }}
            >
              Back to Dashboard
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Hero Section */}
        <Card
          sx={{
            mb: 6,
            background: 'linear-gradient(135deg, #9333ea 0%, #6366f1 100%)',
            color: 'white',
            boxShadow: 4
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Your AI-Powered Business Advisor
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.95, mb: 3, maxWidth: 800 }}>
              Upload your business data once, then ask questions about finances, get forecasts, analyze trends,
              and compare performance - all in simple, easy-to-understand language.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {['💰 Financial Planning', '🔮 Smart Forecasting', '📊 Deep Analytics', '⚖️ Easy Comparisons'].map((label) => (
                <Chip
                  key={label}
                  label={label}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Category Filter */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
          {categories.map((category) => {
            const isSelected = selectedCategory === category.id;
            const Icon = category.Icon;
            return (
              <Button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                variant={isSelected ? 'contained' : 'outlined'}
                startIcon={<Icon />}
                sx={{
                  ...(isSelected && {
                    background: `linear-gradient(135deg, ${category.color}, ${category.color}dd)`,
                    color: 'white',
                    transform: 'scale(1.05)',
                    boxShadow: 3
                  }),
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none'
                }}
              >
                {category.name}
                {isSelected && (
                  <Chip
                    label={promptCards.filter(p => category.id === 'all' || p.category === category.id).length}
                    size="small"
                    sx={{ ml: 1, bgcolor: 'rgba(255,255,255,0.3)', color: 'white', height: 20 }}
                  />
                )}
              </Button>
            );
          })}
        </Box>

        {/* Prompt Cards Grid */}
        <Grid container spacing={3}>
          {filteredPrompts.map((card) => {
            const CardIcon = card.Icon;
            return (
              <Grid item xs={12} sm={6} md={4} key={card.id}>
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6
                    }
                  }}
                  onClick={() => handlePromptClick(card.prompt)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', mb: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 1.5,
                          bgcolor: `${card.color}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <CardIcon sx={{ fontSize: 28, color: card.color }} />
                      </Box>
                      <ChevronRight sx={{ color: 'text.secondary' }} />
                    </Box>

                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {card.title}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {card.description}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AutoAwesome sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        AI-powered insights
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* How It Works */}
        <Card sx={{ mt: 8, boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={700} align="center" gutterBottom>
              How It Works
            </Typography>
            <Grid container spacing={4} sx={{ mt: 2 }}>
              {[
                { step: '1', title: 'Upload Your Data', desc: 'Upload your business data (sales, expenses, etc.) in CSV or Excel format', color: '#9333ea' },
                { step: '2', title: 'Choose a Question', desc: 'Click any card above to ask that question, or type your own question', color: '#3b82f6' },
                { step: '3', title: 'Get Instant Insights', desc: 'Receive clear, actionable answers in plain English - no technical jargon', color: '#10b981' }
              ].map((item) => (
                <Grid item xs={12} md={4} key={item.step} sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${item.color}, ${item.color}dd)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      boxShadow: 3
                    }}
                  >
                    <Typography variant="h4" fontWeight={700} color="white">
                      {item.step}
                    </Typography>
                  </Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.desc}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card
          sx={{
            mt: 6,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            boxShadow: 4
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  Ready to get started?
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.95 }}>
                  Upload your data now and start getting AI-powered insights for your business
                </Typography>
              </Grid>
              <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/')}
                  sx={{
                    bgcolor: 'white',
                    color: '#10b981',
                    fontWeight: 700,
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      bgcolor: '#f0fdf4',
                      transform: 'scale(1.05)',
                      boxShadow: 6
                    }
                  }}
                >
                  Upload Data Now →
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default AIAssistant;
