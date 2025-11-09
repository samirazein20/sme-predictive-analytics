import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as AIIcon,
} from '@mui/icons-material';

export interface Message {
  id: number;
  senderType: 'USER' | 'AI';
  content: string;
  createdAt: string;
  metadata?: {
    confidence?: string;
    suggestions?: string[];
    referenced_data?: any;
  };
}

export interface ChatInterfaceProps {
  conversationId: number;
  messages: Message[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading?: boolean;
  fileName?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId,
  messages,
  onSendMessage,
  isLoading = false,
  fileName,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(inputMessage);
      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Paper
      elevation={3}
      sx={{
        height: '600px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'primary.main',
          color: 'white',
        }}
      >
        <Typography variant="h6">Chat about {fileName || 'Document'}</Typography>
        <Typography variant="caption">
          Ask questions about your data and get AI-powered insights
        </Typography>
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          bgcolor: '#f5f5f5',
        }}
      >
        {messages.length === 0 && !isLoading ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary',
            }}
          >
            <AIIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
            <Typography variant="h6" gutterBottom>
              Start a conversation
            </Typography>
            <Typography variant="body2" align="center">
              Ask me anything about your uploaded data.
              <br />
              For example: "What is the average sales?", "Show me trends", etc.
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  mb: 2,
                  flexDirection: message.senderType === 'USER' ? 'row-reverse' : 'row',
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: message.senderType === 'USER' ? 'primary.main' : 'secondary.main',
                    mx: 1,
                  }}
                >
                  {message.senderType === 'USER' ? <PersonIcon /> : <AIIcon />}
                </Avatar>

                <Box sx={{ flex: 1, maxWidth: '70%' }}>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: message.senderType === 'USER' ? 'primary.light' : 'white',
                      color: message.senderType === 'USER' ? 'white' : 'text.primary',
                    }}
                  >
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </Typography>

                    {/* AI Message Metadata */}
                    {message.senderType === 'AI' && message.metadata && (
                      <Box sx={{ mt: 1 }}>
                        {message.metadata.confidence && (
                          <Chip
                            label={`Confidence: ${message.metadata.confidence}`}
                            size="small"
                            sx={{ mr: 1, mt: 1 }}
                          />
                        )}

                        {/* Suggestions */}
                        {message.metadata.suggestions &&
                          message.metadata.suggestions.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="caption" color="text.secondary">
                                Suggested questions:
                              </Typography>
                              <List dense>
                                {message.metadata.suggestions.map((suggestion, idx) => (
                                  <ListItem
                                    key={idx}
                                    button
                                    onClick={() => setInputMessage(suggestion)}
                                    sx={{
                                      bgcolor: 'action.hover',
                                      borderRadius: 1,
                                      mb: 0.5,
                                    }}
                                  >
                                    <ListItemText
                                      primary={suggestion}
                                      primaryTypographyProps={{ variant: 'body2' }}
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          )}
                      </Box>
                    )}

                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 1,
                        opacity: 0.7,
                      }}
                    >
                      {formatTime(message.createdAt)}
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            ))}

            {isSending && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mx: 1 }}>
                  <AIIcon />
                </Avatar>
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
                  Thinking...
                </Typography>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      <Divider />

      {/* Input Area */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'white',
          display: 'flex',
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question about your data..."
          disabled={isSending || isLoading}
          variant="outlined"
          size="small"
        />
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={!inputMessage.trim() || isSending || isLoading}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            '&:disabled': {
              bgcolor: 'action.disabledBackground',
              color: 'action.disabled',
            },
          }}
        >
          {isSending ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
        </IconButton>
      </Box>
    </Paper>
  );
};

export default ChatInterface;
