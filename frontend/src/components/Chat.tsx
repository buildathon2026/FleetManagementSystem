import { useState, useRef, useEffect } from 'react';
import { Send, ThumbsUp, ThumbsDown, Loader, Zap, HelpCircle } from 'lucide-react';
import apiService from '../services/mockApi';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  confidence?: string;
  toolCalls?: any[];
  timestamp: Date;
  queryType?: string;
}

const SAMPLE_QUERIES = [
  { text: 'How much did I spend on parts last month?', icon: '💰', type: 'STRUCTURED' },
  { text: 'Find the tax form for truck 84', icon: '📄', type: 'RETRIEVAL' },
  { text: 'Which trucks are profitable this quarter?', icon: '📊', type: 'STRUCTURED' },
  { text: 'What documents do I need to renew truck 125 registration?', icon: '🚛', type: 'RETRIEVAL' },
  { text: 'Show me all maintenance invoices for unit 84', icon: '🔧', type: 'RETRIEVAL' },
  { text: 'Why did truck 91 spend so much last month?', icon: '❓', type: 'HYBRID' },
];

export default function Chat({ onToolExecuted }: { onToolExecuted: (data: any) => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Welcome to Fleet Intelligence! 50+ documents arrive every week—fuel receipts, tax forms, maintenance invoices, insurance certificates. Everything is scanned and ingested automatically.\n\nAsk me about your fleet in plain English.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSampleQuery = (query: string) => {
    setInput(query);
    setShowExamples(false);
    setTimeout(() => handleSendMessage(new Event('submit') as any, query), 100);
  };

  const handleSendMessage = async (e: React.FormEvent | Event, customInput?: string) => {
    e.preventDefault?.();
    const messageText = customInput || input;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiService.ask(messageText, 'conv-001');

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        confidence: response.confidence,
        toolCalls: response.plan_executed.tools_called,
        queryType: response.query_type,
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
    <div className="flex flex-col h-screen max-w-3xl mx-auto rounded-lg bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-2xl px-4 py-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-100 border border-slate-700'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>

              {/* Query Type Badge */}
              {message.queryType && (
                <div className="mt-2 inline-block">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    message.queryType === 'STRUCTURED'
                      ? 'bg-blue-900/50 text-blue-200'
                      : message.queryType === 'RETRIEVAL'
                        ? 'bg-green-900/50 text-green-200'
                        : 'bg-purple-900/50 text-purple-200'
                  }`}>
                    [{message.queryType}]
                  </span>
                </div>
              )}

              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-300">
                  <p className="font-semibold mb-2">📎 Sources:</p>
                  <div className="flex flex-wrap gap-2">
                    {message.sources.slice(0, 5).map((source) => (
                      <span
                        key={source}
                        className="bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded cursor-pointer transition-colors"
                        title="Click to view document"
                      >
                        {source}
                      </span>
                    ))}
                    {message.sources.length > 5 && (
                      <span className="bg-slate-700 px-2 py-1 rounded text-slate-400">
                        +{message.sources.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Confidence */}
              {message.confidence && (
                <div className="mt-2 text-xs">
                  <span className={`px-2 py-1 rounded-full font-semibold ${
                    message.confidence === 'HIGH'
                      ? 'bg-green-900/50 text-green-200'
                      : message.confidence === 'MEDIUM'
                        ? 'bg-yellow-900/50 text-yellow-200'
                        : 'bg-red-900/50 text-red-200'
                  }`}>
                    {message.confidence === 'HIGH' ? '✅' : message.confidence === 'MEDIUM' ? '⚠️' : '❓'} Confidence: {message.confidence}
                  </span>
                </div>
              )}

              {/* Feedback */}
              {message.role === 'assistant' && (
                <div className="mt-3 flex gap-2 text-slate-400">
                  <button
                    className="p-1 hover:bg-slate-700 hover:text-green-400 rounded transition-colors"
                    title="This answer was helpful"
                  >
                    <ThumbsUp size={16} />
                  </button>
                  <button
                    className="p-1 hover:bg-slate-700 hover:text-red-400 rounded transition-colors"
                    title="This answer was not helpful"
                  >
                    <ThumbsDown size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 px-4 py-3 rounded-lg border border-slate-700 flex items-center gap-2">
              <Loader className="animate-spin" size={18} />
              <span className="text-sm text-slate-300">Analyzing fleet data...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Sample Queries */}
      {showExamples && messages.length === 1 && (
        <div className="border-t border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-400 mb-3 flex items-center gap-2">
            <Zap size={14} />
            Try asking:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {SAMPLE_QUERIES.map((query, i) => (
              <button
                key={i}
                onClick={() => handleSampleQuery(query.text)}
                className="text-left p-3 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-purple-600 transition-all text-sm text-slate-300 hover:text-slate-100"
              >
                <div className="text-lg mb-1">{query.icon}</div>
                <div className="text-xs text-slate-400 mb-1">{query.type}</div>
                <div className="font-medium">{query.text}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-slate-800 bg-slate-900 p-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Ask me anything about your fleet. Questions route to the right data source automatically..."
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
            <p className="text-xs text-slate-500 mt-2">Shift+Enter for new line</p>
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 text-white px-5 py-3 rounded-lg transition-colors flex items-center gap-2 font-medium h-fit"
          >
            {loading ? <Loader className="animate-spin" size={18} /> : <Send size={18} />}
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </form>

      {/* Footer Info */}
      <div className="bg-slate-950 border-t border-slate-800 px-4 py-2 text-xs text-slate-500 flex items-center justify-between">
        <div>🤖 Grounded in 230 documents across 10 fleet trucks</div>
        <div className="flex items-center gap-1">
          <HelpCircle size={14} />
          <a href="#" className="hover:text-slate-300">Learn more</a>
        </div>
      </div>
    </div>
  );
}
