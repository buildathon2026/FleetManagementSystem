import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Send, Home } from 'lucide-react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getPipelineStages = (): PipelineStage[] => [
    { id: '1', name: 'Classification', description: 'Detecting document type...', status: 'pending', duration: 0 },
    { id: '2', name: 'Extraction', description: 'Extracting fields...', status: 'pending', duration: 0 },
    { id: '3', name: 'Entity Resolution', description: 'Resolving references...', status: 'pending', duration: 0 },
    { id: '4', name: 'Semantic Search', description: 'Searching embeddings...', status: 'pending', duration: 0 },
    { id: '5', name: 'Query Planning', description: 'Planning execution...', status: 'pending', duration: 0 },
    { id: '6', name: 'Tool Execution', description: 'Running tools...', status: 'pending', duration: 0 },
    { id: '7', name: 'Formatting', description: 'Formatting response...', status: 'pending', duration: 0 },
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

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Add pipeline message
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

    // Animate pipeline
    animatePipeline(pipelineId);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const response = await apiService.ask(text, 'conv-001');

      // Remove pipeline message and add final response
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== pipelineId);
        return [
          ...filtered,
          {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: response.answer,
            sources: response.sources,
            timestamp: new Date(),
          },
        ];
      });

      onToolExecuted({
        queryType: response.query_type,
        tools: response.plan_executed.tools_called,
        executionTime: response.plan_executed.execution_time_ms,
      });
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => prev.filter((m) => m.id !== pipelineId));
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

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Fleet</h1>
        <Link to="/" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
          <Home size={18} className="text-slate-400" />
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <h2 className="text-2xl font-semibold text-slate-300 mb-2">Ask anything about your fleet</h2>
              <p className="text-sm text-slate-500">fuel expenses • documents • trucks • profitability</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'user' && (
              <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-2xl">
                <p className="text-sm">{message.content}</p>
              </div>
            )}

            {message.role === 'pipeline' && message.stages && (
              <div className="bg-slate-800 rounded-lg p-4 max-w-2xl border border-slate-700 space-y-2">
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
              <div className="bg-slate-800 rounded-lg p-4 max-w-2xl border border-slate-700">
                <p className="text-sm text-slate-200 mb-3">{message.content}</p>
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
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-800 px-4 py-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about expenses, documents, trucks..."
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
    </div>
  );
}
