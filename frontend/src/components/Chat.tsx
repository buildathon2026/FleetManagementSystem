import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Send, Settings, HelpCircle } from 'lucide-react';
import apiService from '../services/mockApi';
import type { PipelineStage } from './PipelineVisualization';
import PipelineVisualization from './PipelineVisualization';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  confidence?: string;
  timestamp: Date;
}

const SAMPLE_QUESTIONS = [
  'How much did I spend on parts last month?',
  'Find the tax form for truck 84',
  'Which trucks are profitable?',
];

export default function Chat({ onToolExecuted }: { onToolExecuted: (data: any) => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializePipeline = () => {
    return [
      {
        id: 'classify',
        name: 'Classification',
        description: 'Analyzing document type...',
        status: 'pending' as const,
      },
      {
        id: 'extract',
        name: 'Extraction',
        description: 'Extracting structured fields...',
        status: 'pending' as const,
      },
      {
        id: 'resolve',
        name: 'Entity Resolution',
        description: 'Resolving truck references...',
        status: 'pending' as const,
      },
      {
        id: 'search',
        name: 'Semantic Search',
        description: 'Searching embeddings...',
        status: 'pending' as const,
      },
      {
        id: 'plan',
        name: 'Query Planning',
        description: 'Generating execution plan...',
        status: 'pending' as const,
      },
      {
        id: 'execute',
        name: 'Tool Execution',
        description: 'Running data tools...',
        status: 'pending' as const,
      },
      {
        id: 'format',
        name: 'Response Formatting',
        description: 'Formatting response...',
        status: 'pending' as const,
      },
    ];
  };

  const simulatePipelineStages = async (stages: PipelineStage[]) => {
    const stageTiming = [150, 120, 100, 80, 90, 200, 150];

    for (let i = 0; i < stages.length; i++) {
      // Mark current as running
      setPipelineStages((prev) =>
        prev.map((s, idx) =>
          idx === i ? { ...s, status: 'running' as const } : s
        )
      );

      // Wait for stage duration
      await new Promise((resolve) => setTimeout(resolve, stageTiming[i]));

      // Mark as complete
      setPipelineStages((prev) =>
        prev.map((s, idx) =>
          idx === i
            ? { ...s, status: 'complete' as const, duration: stageTiming[i] }
            : s
        )
      );
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Initialize pipeline
    const stages = initializePipeline();
    setPipelineStages(stages);

    // Simulate pipeline execution
    simulatePipelineStages(stages);

    try {
      // Wait a bit for pipeline visualization to complete
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const response = await apiService.ask(text, 'conv-001');

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        confidence: response.confidence,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      onToolExecuted({
        queryType: response.query_type,
        tools: response.plan_executed.tools_called,
        executionTime: response.plan_executed.execution_time_ms,
      });

      setPipelineStages([]);
    } catch (error) {
      console.error('Error:', error);
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

  const handleSendMessage = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSampleQuestion = (question: string) => {
    sendMessage(question);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/50 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
            <div>
              <h1 className="text-lg font-semibold text-slate-100">Fleet Intelligence</h1>
              <p className="text-xs text-slate-500">230 documents • 10 trucks • 0 hallucinations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-300">
              <HelpCircle size={20} />
            </button>
            <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-300">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          // Empty State
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="text-center space-y-8 max-w-2xl">
              <div>
                <h2 className="text-4xl font-bold text-slate-100 mb-2">
                  What would you like to know?
                </h2>
                <p className="text-slate-400">
                  Ask about fleet finances, documents, operational status. Everything is grounded in real data.
                </p>
              </div>

              {/* Sample Questions Grid */}
              <div className="grid grid-cols-1 gap-3">
                {SAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSampleQuestion(q)}
                    className="p-4 text-left bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700 rounded-xl transition-all text-slate-300 hover:text-slate-100"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Messages
          <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
                      : 'text-slate-100'
                  } px-4 py-3`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-600/50">
                      <p className="text-xs opacity-75 mb-2">Sources:</p>
                      <div className="flex flex-wrap gap-2">
                        {message.sources.slice(0, 3).map((source) => (
                          <span
                            key={source}
                            className="text-xs bg-slate-700 px-2 py-1 rounded"
                          >
                            {source}
                          </span>
                        ))}
                        {message.sources.length > 3 && (
                          <span className="text-xs text-slate-400">
                            +{message.sources.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Confidence */}
                  {message.confidence && (
                    <div className="mt-2 text-xs">
                      {message.confidence === 'HIGH' ? '✓' : '?'} {message.confidence}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Pipeline Visualization */}
            {pipelineStages.length > 0 && <PipelineVisualization stages={pipelineStages} />}

            {loading && pipelineStages.length === 0 && (
              <div className="flex justify-start">
                <div className="text-slate-400 text-sm">Processing your question...</div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-800 bg-slate-950/50 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={handleSendMessage} className="space-y-3">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about your fleet..."
                disabled={loading}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Watch the pipeline execute in real-time as your question is processed
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
