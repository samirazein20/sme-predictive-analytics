import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Paper,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import ChatInterface, { Message } from '../components/ChatInterface';
import chatService, { ConversationDTO, MessageDTO } from '../services/chatService';

const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState<ConversationDTO | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConversationAndMessages();
  }, [conversationId]);

  const loadConversationAndMessages = async () => {
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
  };

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

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  if (!conversation) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">Conversation not found</Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to Dashboard
        </Button>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h4" gutterBottom>
            {conversation.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Conversation about: {conversation.fileName}
          </Typography>
        </Paper>
      </Box>

      <ChatInterface
        conversationId={parseInt(conversationId!)}
        messages={messages}
        onSendMessage={handleSendMessage}
        fileName={conversation.fileName}
      />
    </Container>
  );
};

export default ChatPage;
