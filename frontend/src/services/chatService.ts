// Chat API service for document Q&A functionality

export interface ConversationDTO {
  id: number;
  userId: number;
  uploadedFileId: number;
  title: string;
  fileName: string;
  lastMessageAt?: string;
  createdAt: string;
  messageCount?: number;
}

export interface MessageDTO {
  id: number;
  conversationId: number;
  senderType: 'USER' | 'AI';
  content: string;
  metadata?: {
    confidence?: string;
    suggestions?: string[];
    referenced_data?: any;
  };
  createdAt: string;
}

export interface CreateConversationRequest {
  userId: number;
  uploadedFileId: number;
  title?: string;
}

export interface SendMessageRequest {
  message: string;
}

export interface ConversationResponse {
  success: boolean;
  conversation: ConversationDTO;
  message: string;
}

export interface MessagesResponse {
  success: boolean;
  messages: MessageDTO[];
  count: number;
}

export interface SendMessageResponse {
  success: boolean;
  userMessage: MessageDTO;
  aiMessage: MessageDTO;
  suggestions?: string[];
}

export interface ConversationsListResponse {
  success: boolean;
  conversations: ConversationDTO[];
  count: number;
}

class ChatService {
  private readonly backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';
  private readonly baseUrl = `${this.backendUrl}/api/v1/chat`;

  constructor() {
    console.log('Chat Service Configuration:', {
      backendUrl: this.backendUrl,
      baseUrl: this.baseUrl,
    });
  }

  /**
   * Create a new conversation for a user and uploaded file
   */
  async createConversation(request: CreateConversationRequest): Promise<ConversationDTO> {
    const response = await fetch(`${this.baseUrl}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create conversation');
    }

    const data: ConversationResponse = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to create conversation');
    }

    return data.conversation;
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: number): Promise<ConversationDTO[]> {
    const response = await fetch(`${this.baseUrl}/conversations/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }

    const data: ConversationsListResponse = await response.json();
    if (!data.success) {
      throw new Error('Failed to fetch conversations');
    }

    return data.conversations;
  }

  /**
   * Get a specific conversation
   */
  async getConversation(conversationId: number): Promise<ConversationDTO> {
    const response = await fetch(`${this.baseUrl}/conversations/${conversationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch conversation');
    }

    const data: ConversationResponse = await response.json();
    if (!data.success) {
      throw new Error('Failed to fetch conversation');
    }

    return data.conversation;
  }

  /**
   * Get all messages in a conversation
   */
  async getConversationMessages(conversationId: number): Promise<MessageDTO[]> {
    const response = await fetch(
      `${this.baseUrl}/conversations/${conversationId}/messages`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    const data: MessagesResponse = await response.json();
    if (!data.success) {
      throw new Error('Failed to fetch messages');
    }

    return data.messages;
  }

  /**
   * Send a message and get AI response
   */
  async sendMessage(
    conversationId: number,
    message: string
  ): Promise<{ userMessage: MessageDTO; aiMessage: MessageDTO; suggestions?: string[] }> {
    const response = await fetch(
      `${this.baseUrl}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to send message');
    }

    const data: SendMessageResponse = await response.json();
    if (!data.success) {
      throw new Error('Failed to send message');
    }

    return {
      userMessage: data.userMessage,
      aiMessage: data.aiMessage,
      suggestions: data.suggestions,
    };
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete conversation');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to delete conversation');
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService;
