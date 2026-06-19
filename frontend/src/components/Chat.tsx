import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Send, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiService from '../services/mockApi';
import type { PipelineStage } from './PipelineVisualization';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'pipeline';
  content: string;
  sources?: string[];
  stages?: PipelineStage[];
  timestamp: Date;
}

export default function Chat({ onToolExecuted }: { onToolExecuted: (data: any) => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ [key: string]: 'up' | 'down' | null }>({});
  const [feedbackModal, setFeedbackModal] = useState<{ messageId: string; isOpen: boolean; text: string }>({
    messageId: '',
    isOpen: false,
    text: '',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getPipelineStages = (): PipelineStage[] => [
    { id: '1', name: 'Classification', description: 'Analyzing document..', status: 'pending', duration: 0 },
    { id: '2', name: 'Extraction', description: 'Extracting fields..', status: 'pending', duration: 0 },
    { id: '3', name: 'Entity Resolution', description: 'Resolving references..', status: 'pending', duration: 0 },
    { id: '4', name: 'Semantic Search', description: 'Searching documents..', status: 'pending', duration: 0 },
    { id: '5', name: 'Query Planning', description: 'Planning execution..', status: 'pending', duration: 0 },
    { id: '6', name: 'Tool Execution', description: 'Running tools..', status: 'pending', duration: 0 },
    { id: '7', name: 'Formatting', description: 'Formatting response..', status: 'pending', duration: 0 },
  ];

  const animatePipeline = async (messageId: string) => {
    const stages = getPipelineStages();
    const stageTiming = [150, 120, 100, 80, 90, 200, 150];

    for (let i = 0; i < stages.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, stageTiming[i]));

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId && msg.stages
            ? {
                ...msg,
                stages: msg.stages.map((s, idx) =>
                  idx === i ? { ...s, status: 'complete' as const, duration: stageTiming[i] } : s
                ),
              }
            : msg
        )
      );
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const pipelineId = (Date.now() + 1).toString();
    const pipelineMsg: Message = {
      id: pipelineId,
      role: 'pipeline',
      content: '',
      stages: getPipelineStages(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, pipelineMsg]);

    setInput('');
    setLoading(true);

    animatePipeline(pipelineId);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const response = await apiService.ask(text, 'conv-001');

      // Keep pipeline visible and add response below it
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: response.answer,
          sources: response.sources,
          timestamp: new Date(),
        },
      ]);

      onToolExecuted({
        queryType: response.query_type,
        tools: response.plan_executed.tools_called,
        executionTime: response.plan_executed.execution_time_ms,
      });
    } catch (error) {
      console.error('Error:', error);
      // Keep pipeline visible and add error message below it
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: 'Error processing your question. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleBubbleYes = (messageId: string) => {
    setFeedback((prev) => ({
      ...prev,
      [messageId]: 'up',
    }));
    openFeedbackModal(messageId);
  };

  const handleBubbleNo = (messageId: string) => {
    setFeedback((prev) => ({
      ...prev,
      [messageId]: 'down',
    }));
  };

  const openFeedbackModal = (messageId: string) => {
    setFeedbackModal({ messageId, isOpen: true, text: '' });
  };

  const closeFeedbackModal = () => {
    setFeedbackModal({ messageId: '', isOpen: false, text: '' });
  };

  const sendFeedback = () => {
    // TODO: Send feedback to backend when ready
    console.log('Feedback:', {
      messageId: feedbackModal.messageId,
      text: feedbackModal.text,
    });
    closeFeedbackModal();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 px-4 py-3">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors">
          <ArrowLeft size={18} />
          <span className="text-sm">Back</span>
        </Link>
      </div>

      {/* Search Bar at Top */}
      {messages.length === 0 && (
        <div className="pt-16 px-4 pb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-8">Fleet</h1>

          <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <div className="bg-slate-800 border border-slate-700 rounded-full px-6 py-4 flex items-center gap-3 hover:border-slate-600 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                <svg
                  className="w-5 h-5 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about expenses, documents, trucks..."
                  className="flex-1 bg-transparent outline-none text-slate-100 placeholder-slate-500 text-base"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="text-slate-500 hover:text-blue-500 disabled:opacity-50 transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </form>

          {/* Example Queries */}
          <div className="max-w-2xl mx-auto">
            <p className="text-xs text-slate-600 uppercase tracking-wider mb-4">Example queries</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { emoji: '💰', text: 'How much on parts last month?', desc: 'SQL expenses' },
                { emoji: '📄', text: 'Find tax form for truck 84', desc: 'Semantic search' },
                { emoji: '📊', text: 'Which trucks are profitable?', desc: 'Analysis' },
                { emoji: '🔧', text: 'All maintenance for unit 84', desc: 'Filtering' },
              ].map((example, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(example.text)}
                  className="p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all text-left group"
                >
                  <p className="text-sm text-slate-300 group-hover:text-slate-100">
                    {example.emoji} {example.text}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">{example.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      {messages.length > 0 && (
        <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl mx-auto w-full space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'user' && (
                <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-sm">
                  <p className="text-sm">{message.content}</p>
                </div>
              )}

              {message.role === 'pipeline' && message.stages && (
                <div className="bg-slate-800 rounded-lg p-4 max-w-lg border border-slate-700 space-y-2">
                  {message.stages?.map((stage, idx) => (
                    <div key={stage.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5">
                          {stage.status === 'complete' && (
                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">✓</span>
                            </div>
                          )}
                          {stage.status === 'pending' && (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-600 border-t-blue-400 animate-spin" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-slate-300">{stage.name}</p>
                          <p className="text-xs text-slate-500">{stage.description}</p>
                        </div>
                        {stage.duration && stage.duration > 0 && (
                          <span className="text-xs text-slate-500">{stage.duration}ms</span>
                        )}
                      </div>
                      {idx < (message.stages?.length ?? 0) - 1 && (
                        <div className="ml-2 h-2 border-l border-slate-700" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {message.role === 'assistant' && (
                <div className="space-y-3">
                  <div className="bg-slate-800 rounded-lg p-4 max-w-lg border border-slate-700 space-y-3">
                    <p className="text-sm text-slate-200">{message.content}</p>
                    {message.sources && message.sources.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500">Sources:</p>
                        <div className="flex flex-wrap gap-2">
                          {message.sources.slice(0, 5).map((source) => (
                            <span key={source} className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
                              {source}
                            </span>
                          ))}
                          {message.sources.length > 5 && (
                            <span className="text-xs text-slate-500">+{message.sources.length - 5}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bouncing Feedback Bubble - Shows by default */}
                  {!feedback[message.id] && (
                    <div className="animate-bounce-gentle flex items-center gap-3 bg-blue-600/20 border border-blue-500/50 text-blue-300 px-4 py-3 rounded-full text-sm max-w-lg">
                      <span>💬 Was this helpful?</span>
                      <button
                        onClick={() => handleBubbleYes(message.id)}
                        className="ml-auto px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-full font-medium transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => handleBubbleNo(message.id)}
                        className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white text-xs rounded-full font-medium transition-colors"
                      >
                        No
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Feedback Modal */}
              {feedbackModal.isOpen && feedbackModal.messageId === message.id && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
                    <h3 className="text-lg font-semibold text-slate-100">Provide Feedback</h3>
                    <p className="text-sm text-slate-400">
                      Help us improve by sharing your thoughts about this response.
                    </p>
                    <textarea
                      value={feedbackModal.text}
                      onChange={(e) =>
                        setFeedbackModal((prev) => ({ ...prev, text: e.target.value }))
                      }
                      placeholder="What could we improve?..."
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                    />
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={closeFeedbackModal}
                        className="px-4 py-2 text-sm text-slate-300 hover:text-slate-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={sendFeedback}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input at Bottom (when messages exist) */}
      {messages.length > 0 && (
        <div className="border-t border-slate-800 px-4 py-4 bg-slate-950/50">
          <form onSubmit={handleSendMessage} className="flex gap-2 max-w-3xl mx-auto">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask another question..."
              disabled={loading}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
