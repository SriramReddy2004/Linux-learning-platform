// Secure Ollama service via backend API with JWT authentication
export const ollamaService = {
  async streamChat(message, conversationHistory = [], token) {
    const model = 'gpt-oss:120b-cloud'; // Fixed model
    try {
      // Build context from conversation history
      let context = '';
      if (conversationHistory.length > 0) {
        context = conversationHistory
          .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
          .join('\n');
        context += '\nUser: ';
      }

      const fullPrompt = context + message;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: fullPrompt,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Invalid or expired token');
        }
        throw new Error(`API error: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      console.error('Error connecting to chat API:', error);
      throw error;
    }
  },

  async getAvailableModels(token) {
    try {
      const response = await fetch('/api/chat/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  },
};
