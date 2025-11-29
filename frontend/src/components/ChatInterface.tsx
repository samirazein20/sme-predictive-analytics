import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Chip,
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
      elevation={0}
      sx={{
        height: '75vh',
        maxHeight: '800px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'rgba(15, 23, 42, 0.08)',
        boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AIIcon sx={{ fontSize: 24, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.125rem' }}>
              Chat about {fileName || 'Document'}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.8125rem' }}>
              Ask questions about your data and get AI-powered insights
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 3,
          bgcolor: '#f8fafc',
          backgroundImage: 'linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%)',
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
            <Box
              sx={{
                width: 80,
                height: 80,
                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
              }}
            >
              <AIIcon sx={{ fontSize: 48, color: '#1e40af' }} />
            </Box>
            <Typography variant="h6" fontWeight={700} color="#1e293b" gutterBottom>
              Start a conversation
            </Typography>
            <Typography variant="body2" align="center" color="#64748b" sx={{ maxWidth: 400, lineHeight: 1.6 }}>
              Ask me anything about your uploaded data. For example:
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1, width: '100%', maxWidth: 400 }}>
              <Chip
                label="What is the average sales?"
                variant="outlined"
                sx={{
                  borderColor: '#cbd5e1',
                  color: '#475569',
                  '&:hover': { bgcolor: '#f1f5f9', borderColor: '#1e40af' }
                }}
              />
              <Chip
                label="Show me revenue trends"
                variant="outlined"
                sx={{
                  borderColor: '#cbd5e1',
                  color: '#475569',
                  '&:hover': { bgcolor: '#f1f5f9', borderColor: '#1e40af' }
                }}
              />
              <Chip
                label="Which channel performs best?"
                variant="outlined"
                sx={{
                  borderColor: '#cbd5e1',
                  color: '#475569',
                  '&:hover': { bgcolor: '#f1f5f9', borderColor: '#1e40af' }
                }}
              />
            </Box>
          </Box>
        ) : (
          <>
            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  mb: 3,
                  flexDirection: message.senderType === 'USER' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    background: message.senderType === 'USER'
                      ? 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)'
                      : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 1.5,
                    flexShrink: 0,
                    boxShadow: message.senderType === 'USER'
                      ? '0 2px 8px rgba(30, 58, 138, 0.25)'
                      : '0 2px 8px rgba(30, 64, 175, 0.15)',
                  }}
                >
                  {message.senderType === 'USER'
                    ? <PersonIcon sx={{ fontSize: 24, color: 'white' }} />
                    : <AIIcon sx={{ fontSize: 24, color: '#1e40af' }} />
                  }
                </Box>

                <Box sx={{ flex: 1, maxWidth: '75%' }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      bgcolor: message.senderType === 'USER' ? '#1e3a8a' : 'white',
                      color: message.senderType === 'USER' ? 'white' : '#1e293b',
                      borderRadius: 2.5,
                      border: message.senderType === 'USER' ? 'none' : '1px solid #e2e8f0',
                      boxShadow: message.senderType === 'USER'
                        ? '0 4px 12px rgba(30, 58, 138, 0.2)'
                        : '0 2px 8px rgba(15, 23, 42, 0.06)',
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.6,
                        fontSize: '0.9375rem',
                      }}
                    >
                      {message.content}
                    </Typography>

                    {/* AI Message Metadata */}
                    {message.senderType === 'AI' && message.metadata && (
                      <Box sx={{ mt: 2 }}>
                        {/* Suggestions */}
                        {message.metadata.suggestions &&
                          message.metadata.suggestions.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                              <Typography
                                variant="caption"
                                color="#64748b"
                                fontWeight={600}
                                sx={{ display: 'block', mb: 1 }}
                              >
                                Suggested questions:
                              </Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {message.metadata.suggestions.map((suggestion, idx) => (
                                  <Box
                                    key={idx}
                                    onClick={() => setInputMessage(suggestion)}
                                    sx={{
                                      bgcolor: '#f8fafc',
                                      border: '1px solid #e2e8f0',
                                      borderRadius: 1.5,
                                      p: 1.5,
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      '&:hover': {
                                        bgcolor: '#f1f5f9',
                                        borderColor: '#1e40af',
                                        transform: 'translateX(4px)',
                                      },
                                    }}
                                  >
                                    <Typography variant="body2" color="#475569">
                                      {suggestion}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          )}
                      </Box>
                    )}

                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 1.5,
                        opacity: message.senderType === 'USER' ? 0.8 : 0.6,
                        fontSize: '0.75rem',
                      }}
                    >
                      {formatTime(message.createdAt)}
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            ))}

            {isSending && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 1.5,
                    boxShadow: '0 2px 8px rgba(30, 64, 175, 0.15)',
                  }}
                >
                  <AIIcon sx={{ fontSize: 24, color: '#1e40af' }} />
                </Box>
                <Box
                  sx={{
                    bgcolor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: 2.5,
                    p: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
                  }}
                >
                  <CircularProgress size={20} sx={{ color: '#1e40af' }} />
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                    Thinking...
                  </Typography>
                </Box>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          p: 3,
          bgcolor: 'white',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          gap: 2,
          alignItems: 'flex-end',
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your data..."
          disabled={isSending || isLoading}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: '#f8fafc',
              fontSize: '0.9375rem',
              '& fieldset': {
                borderColor: '#cbd5e1',
              },
              '&:hover fieldset': {
                borderColor: '#94a3b8',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#1e40af',
                borderWidth: '2px',
              },
              '&.Mui-disabled': {
                bgcolor: '#f1f5f9',
              },
            },
            '& .MuiOutlinedInput-input': {
              py: 1.5,
              px: 2,
            },
          }}
        />
        <IconButton
          onClick={handleSend}
          disabled={!inputMessage.trim() || isSending || isLoading}
          sx={{
            width: 48,
            height: 48,
            background: inputMessage.trim()
              ? 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)'
              : '#e2e8f0',
            color: 'white',
            borderRadius: 2,
            boxShadow: inputMessage.trim()
              ? '0 4px 12px rgba(30, 58, 138, 0.3)'
              : 'none',
            transition: 'all 0.2s',
            '&:hover': {
              background: inputMessage.trim()
                ? 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)'
                : '#cbd5e1',
              transform: inputMessage.trim() ? 'scale(1.05)' : 'none',
              boxShadow: inputMessage.trim()
                ? '0 6px 16px rgba(30, 58, 138, 0.4)'
                : 'none',
            },
            '&:active': {
              transform: 'scale(0.98)',
            },
            '&:disabled': {
              background: '#e2e8f0',
              color: '#94a3b8',
            },
          }}
        >
          {isSending ? (
            <CircularProgress size={24} sx={{ color: 'white' }} />
          ) : (
            <SendIcon sx={{ fontSize: 24 }} />
          )}
        </IconButton>
      </Box>
    </Paper>
  );
};

export default ChatInterface;
