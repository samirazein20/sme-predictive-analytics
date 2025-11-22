import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Chat as ChatIcon, Description } from '@mui/icons-material';
import ChatInterface, { Message } from '../components/ChatInterface';
import chatService, { ConversationDTO, MessageDTO } from '../services/chatService';
import { baseCardStyle } from '../theme/cardStyles';

const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState<ConversationDTO | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConversationAndMessages = useCallback(async () => {
    if (!conversationId) {
      setError('No conversation ID provided');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Load conversation details
      const conv = await chatService.getConversation(parseInt(conversationId));
      setConversation(conv);

      // Load messages
      const msgs = await chatService.getConversationMessages(parseInt(conversationId));
      setMessages(
        msgs.map((msg: MessageDTO) => ({
          id: msg.id,
          senderType: msg.senderType,
          content: msg.content,
          createdAt: msg.createdAt,
          metadata: msg.metadata,
        }))
      );
    } catch (err: any) {
      console.error('Error loading conversation:', err);
      setError(err.message || 'Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadConversationAndMessages();
  }, [loadConversationAndMessages]);

  const handleSendMessage = async (message: string) => {
    if (!conversationId) return;

    try {
      const response = await chatService.sendMessage(parseInt(conversationId), message);

      // Add both user message and AI response to the messages list
      const newMessages = [
        {
          id: response.userMessage.id,
          senderType: response.userMessage.senderType as 'USER' | 'AI',
          content: response.userMessage.content,
          createdAt: response.userMessage.createdAt,
          metadata: response.userMessage.metadata,
        },
        {
          id: response.aiMessage.id,
          senderType: response.aiMessage.senderType as 'USER' | 'AI',
          content: response.aiMessage.content,
          createdAt: response.aiMessage.createdAt,
          metadata: response.aiMessage.metadata,
        },
      ];

      setMessages((prev) => [...prev, ...newMessages]);
    } catch (err: any) {
      console.error('Error sending message:', err);
      throw err; // Re-throw to let ChatInterface handle the error
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const renderHeader = () => (
    <Box
      sx={{
        bgcolor: 'white',
        borderBottom: 1,
        borderColor: 'divider',
        boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        mb: 3
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '72px',
          py: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(30, 58, 138, 0.25)'
              }}
            >
              <ChatIcon sx={{ fontSize: 28, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} color="#1e293b">
                {conversation?.title || 'Chat'}
              </Typography>
              {conversation && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  <Description sx={{ fontSize: 14, verticalAlign: 'text-bottom', mr: 0.5 }} />
                  {conversation.fileName}
                </Typography>
              )}
            </Box>
          </Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{
              color: '#64748b',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                bgcolor: '#f1f5f9'
              }
            }}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Container>
    </Box>
  );

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
        {renderHeader()}
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
        {renderHeader()}
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mb: 2, ...baseCardStyle }}>
            {error}
          </Alert>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{
              bgcolor: '#1e3a8a',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#1e40af'
              }
            }}
          >
            Back to Dashboard
          </Button>
        </Container>
      </Box>
    );
  }

  if (!conversation) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
        {renderHeader()}
        <Container maxWidth="lg">
          <Alert severity="warning" sx={{ mb: 2, ...baseCardStyle }}>
            Conversation not found
          </Alert>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{
              bgcolor: '#1e3a8a',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#1e40af'
              }
            }}
          >
            Back to Dashboard
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {renderHeader()}
      <Container maxWidth="lg" sx={{ pb: 4 }}>
        <ChatInterface
          conversationId={parseInt(conversationId!)}
          messages={messages}
          onSendMessage={handleSendMessage}
          fileName={conversation.fileName}
        />
      </Container>
    </Box>
  );
};

export default ChatPage;
