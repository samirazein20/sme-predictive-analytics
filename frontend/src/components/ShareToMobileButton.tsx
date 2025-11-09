import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Tabs,
  Tab,
  Alert,
  IconButton,
  Divider
} from '@mui/material';
import {
  PhoneAndroid,
  Email,
  Share as ShareIcon,
  Close,
  ContentCopy
} from '@mui/icons-material';

interface ShareToMobileButtonProps {
  open: boolean;
  onClose: () => void;
  summary: string;
}

export const ShareToMobileButton: React.FC<ShareToMobileButtonProps> = ({
  open,
  onClose,
  summary
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(summary).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Business Analytics Summary',
          text: summary,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        setShareError('Sharing cancelled or not supported');
      }
    } else {
      setShareError('Web Share API not supported on this device');
    }
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent('Your Business Analytics Summary');
    const body = encodeURIComponent(summary);
    const mailtoLink = `mailto:${emailAddress}?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
    onClose();
  };

  const handleSendSMS = () => {
    // SMS protocol varies by platform
    // iOS: sms:phonenumber&body=message
    // Android: sms:phonenumber?body=message
    const smsLink = `sms:${phoneNumber}${/iPhone|iPad|iPod/.test(navigator.userAgent) ? '&' : '?'}body=${encodeURIComponent(summary)}`;
    window.location.href = smsLink;
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="share-dialog-title"
    >
      <DialogTitle id="share-dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PhoneAndroid sx={{ mr: 1 }} />
            Share to Mobile
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<Email />} label="Email" />
          <Tab icon={<PhoneAndroid />} label="SMS" />
          <Tab icon={<ShareIcon />} label="Native Share" />
        </Tabs>

        {activeTab === 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Send this summary to your email address
            </Typography>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="you@example.com"
              sx={{ mb: 2 }}
            />
            <Alert severity="info" sx={{ mb: 2 }}>
              This will open your default email client
            </Alert>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Send this summary via SMS
            </Typography>
            <TextField
              fullWidth
              label="Phone Number"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 123-4567"
              sx={{ mb: 2 }}
            />
            <Alert severity="warning" sx={{ mb: 2 }}>
              SMS character limits may truncate long summaries
            </Alert>
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Use your device's native share feature
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Works best on mobile devices with installed apps
            </Alert>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Preview:
          </Typography>
          <Box
            sx={{
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 1,
              maxHeight: 200,
              overflow: 'auto',
              fontSize: '0.85rem',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace'
            }}
          >
            {summary}
          </Box>
          <Button
            size="small"
            startIcon={<ContentCopy />}
            onClick={handleCopyToClipboard}
            sx={{ mt: 1 }}
          >
            {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
          </Button>
        </Box>

        {shareError && (
          <Alert severity="error" onClose={() => setShareError(null)}>
            {shareError}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {activeTab === 0 && (
          <Button
            variant="contained"
            onClick={handleSendEmail}
            disabled={!emailAddress}
            startIcon={<Email />}
          >
            Send Email
          </Button>
        )}
        {activeTab === 1 && (
          <Button
            variant="contained"
            onClick={handleSendSMS}
            disabled={!phoneNumber}
            startIcon={<PhoneAndroid />}
          >
            Send SMS
          </Button>
        )}
        {activeTab === 2 && (
          <Button
            variant="contained"
            onClick={handleNativeShare}
            startIcon={<ShareIcon />}
          >
            Share
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
