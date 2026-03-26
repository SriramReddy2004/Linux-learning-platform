import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader } from 'lucide-react';
import { ollamaService } from '../services/ollamaService';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

const AIAssistant = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [
      ...prev,
      { id: Date.now(), role: 'user', content: userMessage }
    ]);
    setLoading(true);

    const assistantMessageId = Date.now() + 1;
    let fullResponse = '';

    try {
      const response = await ollamaService.streamChat(userMessage, messages, token);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      setMessages(prev => [
        ...prev,
        { id: assistantMessageId, role: 'assistant', content: '' }
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.response) {
              fullResponse += json.response;

              setMessages(prev => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                if (lastMsg?.id === assistantMessageId) {
                  lastMsg.content = fullResponse + " ";
                }
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '❌ Error: ' + error.message,
          isError: true,
        },
      ]);
      toast.error('Failed to get AI response');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-screen w-full sm:w-96 bg-gray-900 border-l border-gray-800 shadow-2xl z-50 flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-800">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <h3 className="text-white font-semibold">AI Assistant</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        {messages.length === 0 && !loading && (
          <div className="text-center text-gray-500 text-sm mt-8">
            <p>👋 Hi! I'm your AI Assistant</p>
            <p className="text-xs mt-2">Ask me anything about Linux</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-xs px-3 py-2 rounded-lg text-sm break-words whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-green-600 text-white'
                  : msg.isError
                  ? 'bg-red-900 text-red-200'
                  : 'bg-gray-800 text-gray-100'
              }`}
            >
              {msg.role === 'assistant' && !msg.isError ? (
                <div className="prose prose-invert max-w-none text-sm overflow-x-auto">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    code({ inline, children, ...props }) {
                      return !inline ? (
                        <pre className="bg-black p-3 rounded-lg overflow-x-auto text-xs max-w-full">
                          <code {...props}>{children}</code>
                        </pre>
                      ) : (
                        <code className="bg-gray-700 px-1 rounded break-all">
                          {children}
                        </code>
                      );
                    },

                    table({ children }) {
                      return (
                        <div className="overflow-x-auto">
                          <table className="w-full border border-gray-700 text-sm text-left">
                            {children}
                          </table>
                        </div>
                      );
                    },

                    thead({ children }) {
                      return <thead className="bg-gray-700">{children}</thead>;
                    },

                    tbody({ children }) {
                      return <tbody>{children}</tbody>;
                    },

                    tr({ children }) {
                      return <tr className="border-b border-gray-700">{children}</tr>;
                    },

                    th({ children }) {
                      return (
                        <th className="px-3 py-2 border border-gray-700 text-gray-200 font-semibold">
                          {children}
                        </th>
                      );
                    },

                    td({ children }) {
                      return (
                        <td className="px-3 py-2 border border-gray-700 text-gray-300">
                          {children}
                        </td>
                      );
                    }
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-100 px-3 py-2 rounded-lg flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-gray-800 p-3 bg-gray-800">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask me anything..."
            className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-green-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIAssistant;