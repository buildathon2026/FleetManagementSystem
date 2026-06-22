import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { AlertCircle, Bot, Send, ThumbsDown, ThumbsUp, User } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import apiService from '../services/mockApi';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  question?: string;
  conversationId?: string;
  sources?: string[];
  toolResults?: any[];
  isOfflineFallback?: boolean;
}

const exampleQuestions = [
  'Which trucks have documents expiring soon?',
  'Show documents for truck T-084',
  'How much revenue did truck T-091 make?',
  'Compare truck T-084 and T-091 revenue',
];

export default function Chat() {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialQuestionSent = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const question = searchParams.get('q');
    if (question && !initialQuestionSent.current) {
      initialQuestionSent.current = true;
      sendMessage(question);
    }
  }, [searchParams]);

  const sendMessage = async (text: string) => {
    const question = text.trim();
    if (!question || loading) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-user`,
        role: 'user',
        content: question,
      },
    ]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiService.ask(question, 'conv-001');
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: response.answer,
          question,
          conversationId: response.conversation_id,
          sources: response.sources,
          toolResults: response.plan_executed.tool_results,
        },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: getOfflineAnswer(question, error?.message),
          question,
          isOfflineFallback: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-130px)] max-w-4xl flex-col gap-5">
      <section className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">Ask About the Fleet</h1>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Ask a normal business question. The assistant can look up trucks, documents,
              revenue, expenses, and renewals when the local backend is running.
            </p>
          </div>
          <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">
            Tip: try a truck ID like T-084.
          </div>
        </div>
      </section>

      {messages.length === 0 && (
        <section className="grid gap-3 md:grid-cols-2">
          {exampleQuestions.map((question) => (
            <button
              key={question}
              onClick={() => sendMessage(question)}
            className="rounded-lg border border-sky-100 bg-white/90 p-4 text-left text-sm font-medium text-slate-700 shadow-sm hover:border-sky-200 hover:text-slate-950"
            >
              {question}
            </button>
          ))}
        </section>
      )}

      <section className="flex-1 rounded-lg border border-blue-100 bg-white shadow-sm">
        <div className="min-h-[360px] space-y-4 p-4">
          {messages.length === 0 ? (
            <div className="flex h-[320px] items-center justify-center text-center">
              <div>
                <Bot className="mx-auto text-slate-300" size={44} />
                <p className="mt-3 font-medium text-slate-700">No conversation yet</p>
                <p className="mt-1 text-sm text-slate-500">Choose an example or type your own question below.</p>
              </div>
            </div>
          ) : (
            messages.map((message) => <MessageBubble key={message.id} message={message} />)
          )}

          {loading && (
            <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
              Checking fleet data...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-blue-100 bg-blue-50/40 p-4">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about revenue, documents, renewals, or a truck..."
              disabled={loading}
              className="min-w-0 flex-1 rounded-md border border-blue-200 bg-white px-4 py-3 text-sm text-slate-950 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-blue-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Send size={18} />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const comparison = !isUser ? getComparisonData(message.toolResults, message.content, message.question) : null;

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
          <Bot size={18} />
        </span>
      )}
      <div
        className={
          isUser
            ? 'max-w-[78%] rounded-lg bg-blue-800 px-4 py-3 text-sm leading-6 text-white'
            : 'w-full max-w-2xl rounded-lg border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm leading-6 text-slate-800'
        }
      >
        {message.isOfflineFallback && (
          <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900">
            <AlertCircle className="mt-0.5 shrink-0" size={17} />
            <p className="text-xs leading-5">
              The AI backend is not reachable, so this is a local demo response.
            </p>
          </div>
        )}
        {comparison ? (
          <ComparisonCards comparison={comparison} />
        ) : (
          <p className="whitespace-pre-line">{message.content}</p>
        )}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
            {message.sources.slice(0, 5).map((source) => (
              <span key={source} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                {source}
              </span>
            ))}
          </div>
        )}
        {!isUser && !message.isOfflineFallback && message.conversationId && (
          <FeedbackButtons conversationId={message.conversationId} />
        )}
      </div>
      {isUser && (
        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-800 text-white">
          <User size={18} />
        </span>
      )}
    </div>
  );
}

function FeedbackButtons({ conversationId }: { conversationId: string }) {
  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  const [error, setError] = useState('');

  const submit = async (nextRating: 'up' | 'down') => {
    setError('');
    setRating(nextRating);
    try {
      await apiService.submitFeedback(conversationId, nextRating);
    } catch (feedbackError) {
      setRating(null);
      setError('Could not save feedback');
    }
  };

  return (
    <div className="mt-3 flex items-center gap-2 border-t border-slate-200 pt-3">
      <span className="text-xs font-medium text-slate-500">Was this answer useful?</span>
      <button
        type="button"
        onClick={() => submit('up')}
        aria-label="Mark answer useful"
        className={
          rating === 'up'
            ? 'inline-flex h-8 w-8 items-center justify-center rounded-md bg-blue-700 text-white'
            : 'inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-700'
        }
      >
        <ThumbsUp size={15} />
      </button>
      <button
        type="button"
        onClick={() => submit('down')}
        aria-label="Mark answer not useful"
        className={
          rating === 'down'
            ? 'inline-flex h-8 w-8 items-center justify-center rounded-md bg-rose-600 text-white'
            : 'inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:text-rose-700'
        }
      >
        <ThumbsDown size={15} />
      </button>
      {rating && <span className="text-xs text-slate-500">Saved</span>}
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
}

interface ComparisonItem {
  label: string;
  total: number;
  count: number;
  countLabel: string;
  secondary?: {
    label: string;
    value: number;
  }[];
}

interface ComparisonData {
  title: string;
  totalLabel: string;
  items: ComparisonItem[];
}

function getComparisonData(toolResults?: any[], content = '', question = ''): ComparisonData | null {
  const fromTools = getComparisonFromTools(toolResults);
  if (fromTools) return fromTools;

  return getComparisonFromText(content, question);
}

function getComparisonFromTools(toolResults?: any[]): ComparisonData | null {
  if (!toolResults || toolResults.length < 2) return null;

  const normalized = toolResults
    .map((result) => ({
      ...result,
      data: result?.data || result?.result,
    }))
    .filter((result) => result?.ok !== false && result?.data);

  const revenue = normalized.filter((result) => result.tool === 'get_revenue');
  if (revenue.length > 1) {
    return {
      title: 'Revenue comparison',
      totalLabel: 'Combined revenue',
      items: revenue.map((result, index) => ({
        label: getTruckLabel(result, index),
        total: Number(result.data.total || 0),
        count: Number(result.data.load_count || 0),
        countLabel: 'loads',
      })),
    };
  }

  const expenses = normalized.filter((result) => result.tool === 'get_expenses');
  if (expenses.length > 1) {
    return {
      title: 'Expense comparison',
      totalLabel: 'Combined expenses',
      items: expenses.map((result, index) => ({
        label: getTruckLabel(result, index),
        total: Number(result.data.total || 0),
        count: Number(result.data.count || 0),
        countLabel: 'records',
      })),
    };
  }

  const profits = normalized.filter((result) => result.tool === 'get_truck_profit');
  if (profits.length > 1) {
    const items = profits.flatMap((result, index) => {
      const trucks = result.data.trucks || [];
      return trucks.map((truck: any) => ({
        label: truck.id || getTruckLabel(result, index),
        total: Number(truck.net || 0),
        count: 1,
        countLabel: 'truck',
        secondary: [
          { label: 'Revenue', value: Number(truck.revenue || 0) },
          { label: 'Expenses', value: Number(truck.expenses || 0) },
        ],
      }));
    });

    if (items.length > 1) {
      return {
        title: 'Profit comparison',
        totalLabel: 'Combined net profit',
        items,
      };
    }
  }

  return null;
}

function getComparisonFromText(content: string, question: string): ComparisonData | null {
  if (!/comparison/i.test(content)) return null;

  const countLabel = /records/i.test(content) ? 'records' : 'loads';
  const title = /expense/i.test(content)
    ? 'Expense comparison'
    : /profit/i.test(content)
      ? 'Profit comparison'
      : 'Revenue comparison';
  const totalLabel = /expense/i.test(content)
    ? 'Combined expenses'
    : /profit/i.test(content)
      ? 'Combined net profit'
      : 'Combined revenue';

  const trucks = question.match(/\bT-\d{3}\b/gi)?.map((truck) => truck.toUpperCase()) || [];
  const lines = [...content.matchAll(/\$\s*([\d,]+(?:\.\d{2})?)\s+across\s+(\d+)\s+(loads|records)/gi)];

  if (lines.length < 2) return null;

  return {
    title,
    totalLabel,
    items: lines.map((match, index) => ({
      label: trucks[index] || `Truck ${index + 1}`,
      total: Number(match[1].replace(/,/g, '')),
      count: Number(match[2]),
      countLabel,
    })),
  };
}

function getTruckLabel(result: any, index: number) {
  const truckId = result?.params?.truck_id;
  if (typeof truckId === 'string' && truckId && !truckId.startsWith('$')) {
    return truckId;
  }
  return `Truck ${index + 1}`;
}

function ComparisonCards({ comparison }: { comparison: ComparisonData }) {
  const combined = comparison.items.reduce((sum, item) => sum + item.total, 0);
  const winner = comparison.items.reduce<ComparisonItem | null>(
    (best, item) => (!best || item.total > best.total ? item : best),
    null
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-950">{comparison.title}</h3>
        {winner && (
          <p className="mt-1 text-sm text-slate-600">
            {winner.label} is higher at {formatMoney(winner.total)}.
          </p>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {comparison.items.map((item) => (
          <div key={item.label} className="rounded-lg border border-sky-100 bg-white/90 p-4">
            <p className="text-sm font-semibold text-blue-800">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{formatMoney(item.total)}</p>
            <p className="mt-1 text-sm text-slate-500">
              {item.count} {item.countLabel}
            </p>
            {item.secondary && (
              <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
                {item.secondary.map((row) => (
                  <div key={row.label} className="flex justify-between gap-3 text-slate-600">
                    <span>{row.label}</span>
                    <span className="font-medium text-slate-900">{formatMoney(row.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-md border border-blue-100 bg-blue-50/80 px-4 py-3">
        <p className="text-sm text-blue-900">
          {comparison.totalLabel}: <span className="font-semibold">{formatMoney(combined)}</span>
        </p>
      </div>
    </div>
  );
}

function formatMoney(value: number) {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getOfflineAnswer(question: string, errorMessage?: string) {
  const lower = question.toLowerCase();

  if (lower.includes('renew') || lower.includes('expir') || lower.includes('attention')) {
    return 'In the local demo data, these items need attention:\n\n- T-125 has an insurance renewal coming up soon.\n- T-140 has an inspection follow-up.\n- T-112 is marked inactive.\n\nOpen Fleet Status to review the alert list.';
  }

  if (lower.includes('document') || lower.includes('t-084')) {
    return 'The demo has documents linked to T-084, including fuel, maintenance, tax, insurance, and registration records. Open Documents and search for T-084 to review them.';
  }

  if (lower.includes('revenue') || lower.includes('compare')) {
    return 'The demo dashboard includes monthly revenue for each truck. Open Fleet Status to compare trucks by revenue and document count.';
  }

  return `I could not reach the local AI service${errorMessage ? ` (${errorMessage})` : ''}. You can still use Fleet Status and Documents with demo data while the backend is offline.`;
}
