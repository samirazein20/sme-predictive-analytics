import React from 'react';
import { Box, Typography, Button } from '@mui/material';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 8,
        px: 3,
      }}
      role="status"
      aria-label={`Empty state: ${title}`}
    >
      <Box
        sx={{
          fontSize: '4rem',
          mb: 2,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'text.secondary',
        }}
      >
        {icon}
      </Box>
      
      <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{
          mb: 4,
          maxWidth: 600,
          mx: 'auto',
          whiteSpace: 'pre-line',
        }}
      >
        {description}
      </Typography>
      
      {(actionLabel || secondaryActionLabel) && (
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          {actionLabel && onAction && (
            <Button
              variant="contained"
              size="large"
              onClick={onAction}
              aria-label={actionLabel}
            >
              {actionLabel}
            </Button>
          )}
          
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              variant="outlined"
              size="large"
              onClick={onSecondaryAction}
              aria-label={secondaryActionLabel}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

export default EmptyState;
