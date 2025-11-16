import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Paper, Typography, Alert, AlertTitle } from '@mui/material';
import { Error as ErrorIcon, Refresh } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component catches React errors in child components
 * and displays a user-friendly fallback UI instead of crashing the entire app.
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // TODO: Log to error tracking service (e.g., Sentry)
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    // }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            p: 3,
          }}
          role="alert"
          aria-live="assertive"
        >
          <Paper
            sx={{
              p: 4,
              maxWidth: 600,
              textAlign: 'center',
              border: '1px solid',
              borderColor: 'error.light',
            }}
            elevation={3}
          >
            <ErrorIcon
              color="error"
              sx={{ fontSize: 64, mb: 2 }}
              aria-hidden="true"
            />

            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              {this.props.fallbackTitle || 'Oops! Something went wrong'}
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph>
              {this.props.fallbackMessage ||
                "We encountered an unexpected error. Don't worry - your data is safe. Please try refreshing this section."}
            </Typography>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Alert severity="error" sx={{ mt: 2, mb: 2, textAlign: 'left' }}>
                <AlertTitle>Error Details (Dev Mode)</AlertTitle>
                <Typography variant="body2" component="pre" sx={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontSize: '0.75rem',
                }}>
                  {this.state.error.toString()}
                </Typography>
                {this.state.errorInfo && (
                  <details style={{ marginTop: '8px' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                      Component Stack
                    </summary>
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{
                        mt: 1,
                        fontSize: '0.7rem',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {this.state.errorInfo.componentStack}
                    </Typography>
                  </details>
                )}
              </Alert>
            )}

            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={this.handleReset}
              size="large"
              aria-label="Try again - reset error state"
            >
              Try Again
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
