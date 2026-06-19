import { useState, useRef, useEffect } from 'react';
import { Send, ThumbsUp, ThumbsDown, Loader } from 'lucide-react';
import apiService from '../services/mockApi';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  confidence?: string;
  toolCalls?: any[];
  timestamp: Date;
}

export default function Chat({ onToolExecuted }: { onToolExecuted: (data: any) => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Welcome to Fleet Intelligence! Ask me about your fleet finances, documents, or operational status.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiService.ask(input, 'conv-001');

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        confidence: response.confidence,
        toolCalls: response.plan_executed.tools_called,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      onToolExecuted({
        queryType: response.query_type,
        tools: response.plan_executed.tools_called,
        executionTime: response.plan_executed.execution_time_ms,
      });
    } catch (error) {
      console.error('Error asking question:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] max-w-2xl mx-auto rounded-lg bg-slate-900 border border-slate-800 shadow-xl">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-100 border border-slate-700'
              }`}
            >
              <p className="text-sm">{message.content}</p>

              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-300">
                  <p className="font-semibold mb-1">Sources:</p>
                  <div className="flex flex-wrap gap-1">
                    {message.sources.map((source) => (
                      <span key={source} className="bg-slate-700 px-2 py-1 rounded">
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {message.confidence && (
                <div className="mt-2 text-xs">
                  <span className={`px-2 py-1 rounded ${
                    message.confidence === 'HIGH' ? 'bg-green-900 text-green-200' : 'bg-yellow-900 text-yellow-200'
                  }`}>
                    Confidence: {message.confidence}
                  </span>
                </div>
              )}

              {message.role === 'assistant' && (
                <div className="mt-2 flex gap-2">
                  <button className="p-1 hover:bg-slate-700 rounded transition-colors">
                    <ThumbsUp size={16} />
                  </button>
                  <button className="p-1 hover:bg-slate-700 rounded transition-colors">
                    <ThumbsDown size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 px-4 py-3 rounded-lg border border-slate-700">
              <Loader className="animate-spin" size={20} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-slate-800 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about fleet finances, documents, or status..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Send size={18} />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </form>
    </div>
  );
}
