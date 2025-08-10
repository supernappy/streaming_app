// AI API integration for chat
import api from './api';

export const aiAPI = {
  // Send a chat message and get an AI response
  getAIResponse: async (message, roomId) => {
    const response = await api.post(`/ai/chat`, { message, roomId });
    return response.data;
  },
  // Moderate a chat message
  moderateMessage: async (message, roomId) => {
    console.log('[AI] Calling moderation endpoint', { message, roomId });
    // Backend expects { content, type }
    const response = await api.post(`/ai/moderation/analyze`, { content: message, type: 'text' });
    return response.data;
  },
  // Summarize chat history
  summarizeChat: async (chatHistory, roomId) => {
    const response = await api.post(`/ai/summarize`, { chatHistory, roomId });
    return response.data;
  }
};
