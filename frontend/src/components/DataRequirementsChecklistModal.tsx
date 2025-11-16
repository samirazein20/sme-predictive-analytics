import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import CheckCircle from '@mui/icons-material/CheckCircle';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { DATA_REQUIREMENTS } from '../utils/templates';

interface DataRequirementsChecklistModalProps {
  open: boolean;
  onClose: () => void;
}

export const DataRequirementsChecklistModal: React.FC<DataRequirementsChecklistModalProps> = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="data-req-title" fullWidth maxWidth="sm">
      <DialogTitle id="data-req-title">📋 Data Requirements Checklist</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 2 }}>
          These guidelines help ensure high-quality predictions. If you meet the first three checks, you can start and refine later.
        </Typography>
        <List dense aria-label="data requirements list">
          {DATA_REQUIREMENTS.map((req, idx) => (
            <ListItem key={idx} disableGutters>
              <ListItemIcon>
                <CheckCircle color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={<Typography variant="body2">{req}</Typography>} />
            </ListItem>
          ))}
        </List>
        <Typography variant="subtitle2" sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoOutlined fontSize="small" /> Tips
        </Typography>
        <Typography variant="caption" component="div" sx={{ mt: 1, lineHeight: 1.6 }}>
          • More history increases forecast stability (aim for 60+ days when possible)<br />
          • Keep column names short and consistent (e.g., Revenue, Orders)<br />
          • Avoid mixing currencies or units within the same column<br />
          • You can upload multiple files; we'll unify columns intelligently in future releases
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
