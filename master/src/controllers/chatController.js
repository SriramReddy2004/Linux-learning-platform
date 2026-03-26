const axios = require('axios');

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://host.docker.internal:11434';

// Get available models from Ollama
const getAvailableModels = async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_API_URL}/api/tags`);
    res.status(200).json({
      success: true,
      models: response.data.models || [],
    });
  } catch (error) {
    console.error('Error fetching models from Ollama:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available models',
      error: error.message,
    });
  }
};

// Stream chat response from Ollama
const streamChat = async (req, res) => {
  try {
    const { message } = req.body;
    const model = 'gpt-oss:120b-cloud'; // Fixed model
    const userId = req.user._id;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must be a string',
      });
    }

    // Log the chat request for audit trail
    console.log(`[Chat] User: ${userId}, Model: ${model}, Message length: ${message.length}`);

    // Stream response from Ollama
    const ollamaResponse = await axios.post(
      `${OLLAMA_API_URL}/api/generate`,
      {
        model,
        system: `You are a friendly and highly knowledgeable Linux mentor.

Your role is to help users understand Linux concepts, commands, system behavior, networking, file systems, permissions, processes, containers (Docker), and troubleshooting.

Guidelines:

* Explain clearly and simply, like teaching a beginner.
* Prefer practical explanations over theory.
* Provide real command examples when useful.
* When explaining commands, briefly describe key parts.
* Correct mistakes politely and explain why.
* Warn before suggesting potentially dangerous commands.
* Use a friendly, supportive tone and avoid unnecessary jargon.

Behavior:

* If the user asks "how", give step-by-step instructions.
* If the user asks "why", explain the concept briefly.
* If the user shares an error, analyze and suggest a fix.
* Mention the best solution; optionally include alternatives.
* If unsure, say so honestly.

Style:

* Keep responses under 150 words unless the user asks to elaborate.
* Use short paragraphs or bullets.
* Use code blocks for commands only when needed.

Goal:
Help the user become confident in Linux through concise, practical, and mentorship-style guidance.
`,
        prompt: message,
        stream: true,
      },
      {
        responseType: 'stream',
      }
    );

    // Set response headers for streaming
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Pipe the Ollama stream to the client
    ollamaResponse.data.pipe(res);

    // Handle errors from Ollama stream
    ollamaResponse.data.on('error', (error) => {
      console.error('Ollama stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming from Ollama',
        });
      }
    });

    // Handle client disconnection
    req.on('close', () => {
      ollamaResponse.data.destroy();
    });
  } catch (error) {
    console.error('Error in chat streaming:', error.message);

    // Only send response if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to connect to Ollama service',
        error: error.message,
      });
    }
  }
};

module.exports = {
  getAvailableModels,
  streamChat,
};
