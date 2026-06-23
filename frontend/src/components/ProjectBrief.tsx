import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Database,
  FileSearch,
  FileText,
  GitBranch,
  Layers,
  Network,
  ShieldCheck,
  Sparkles,
  Truck,
  Wrench,
} from 'lucide-react';

const features = [
  {
    title: 'Document intelligence',
    body: 'Classifies fleet paperwork and extracts dates, amounts, truck mentions, vendors, and renewal details.',
    icon: FileSearch,
  },
  {
    title: 'Entity resolution',
    body: 'Normalizes messy references like Unit 84, Trk 84, T-084, and 84 into one canonical truck record.',
    icon: Network,
  },
  {
    title: 'Semantic search',
    body: 'Finds relevant documents by meaning, so operators can search like they talk.',
    icon: Sparkles,
  },
  {
    title: 'Grounded AI answers',
    body: 'Routes questions through typed tools and source records instead of relying on model memory.',
    icon: ShieldCheck,
  },
];

const techStack = [
  'React',
  'TypeScript',
  'Vite',
  'Tailwind CSS',
  'Python',
  'FastAPI',
  'SQLite',
  'ChromaDB',
  'MCP-style tools',
  'LLM planner',
];

const realItems = [
  'Frontend demo flow for dashboard, documents, AI chat, and alias resolution',
  'Synthetic fleet dataset with 230 documents across 10 document types',
  'Document ingestion pipeline for classification, extraction, storage, and search',
  'Mock-aware API layer that can connect to backend services when available',
];

const mockedItems = [
  'Some dashboard and chat responses can fall back to mock data during a live demo',
  'Production authentication and tenant isolation are planned, not finalized',
  'Full MCP data server and complete AI-agent orchestration are represented in the architecture and API contracts',
];

const improvements = [
  'Connect all frontend views to the live backend services',
  'Add production auth, user roles, and tenant isolation',
  'Expand document preview with highlighting and original file rendering',
  'Add analytics for cost trends, renewal risk, and truck profitability',
];

export default function ProjectBrief() {
  return (
    <div className="space-y-5">
      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_0.8fr] lg:p-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase text-blue-800">
            <Truck size={15} />
            Project brief
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
            FleetProof AI turns messy fleet paperwork into source-backed answers.
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            This page replaces a slide deck: it explains the problem, solution, architecture,
            technical choices, current implementation, and next steps before the live product demo.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Start demo
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/chat?q=Which%20trucks%20have%20documents%20expiring%20soon%3F"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              <Bot size={18} />
              Ask AI
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">Demo story</p>
          <div className="mt-4 space-y-3">
            {['Find the right truck', 'Search linked documents', 'Ask an operational question', 'Verify with sources'].map(
              (item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-md border border-white/10 bg-white/5 p-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-100">{item}</span>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <BriefCard icon={FileText} title="Problem">
          Fleet operators manage fuel receipts, maintenance invoices, registrations, insurance
          certificates, tax forms, and emails across disconnected places. The same truck may appear
          under several names, which makes simple questions slow and error-prone.
        </BriefCard>
        <BriefCard icon={CheckCircle2} title="Solution">
          FleetProof AI ingests documents, extracts structured fields, resolves truck aliases, stores
          searchable records, and answers natural-language questions with cited sources and tool-call
          transparency.
        </BriefCard>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Layers className="text-blue-800" size={22} />
          <h2 className="text-lg font-semibold text-slate-950">Architecture Diagram</h2>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-5">
          {[
            ['Ingest', 'Raw documents enter the pipeline'],
            ['Classify + Extract', 'Document type and fields are detected'],
            ['Resolve Entities', 'Aliases map to canonical truck IDs'],
            ['Store + Search', 'SQLite and vector search hold verified records'],
            ['Answer', 'AI agent calls tools and cites sources'],
          ].map(([title, body], index) => (
            <div key={title} className="relative rounded-md border border-blue-100 bg-blue-50/70 p-4">
              <p className="text-xs font-semibold uppercase text-blue-700">Layer {index + 1}</p>
              <h3 className="mt-2 text-sm font-semibold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              {index < 4 && (
                <ArrowRight className="absolute right-3 top-4 hidden text-blue-300 lg:block" size={18} />
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {features.map(({ title, body, icon: Icon }) => (
          <div key={title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-800">
              <Icon size={20} />
            </span>
            <h2 className="mt-4 text-base font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Wrench className="text-blue-800" size={22} />
            <h2 className="text-lg font-semibold text-slate-950">Tech Stack</h2>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {techStack.map((item) => (
              <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Database className="text-blue-800" size={22} />
            <h2 className="text-lg font-semibold text-slate-950">Design and Implementation Summary</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The system is split into independent services so ingestion, entity resolution, data access,
            AI planning, and the frontend can evolve separately. The frontend is demo-ready and uses an
            API layer that falls back gracefully when local backend services are unavailable.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ListPanel title="What is real" items={realItems} tone="blue" />
        <ListPanel title="What is mocked or planned" items={mockedItems} tone="amber" />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <GitBranch className="text-blue-800" size={22} />
          <h2 className="text-lg font-semibold text-slate-950">Future Improvements</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {improvements.map((item) => (
            <div key={item} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function BriefCard({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon className="text-blue-800" size={22} />
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{children}</p>
    </section>
  );
}

function ListPanel({ title, items, tone }: { title: string; items: string[]; tone: 'blue' | 'amber' }) {
  const isBlue = tone === 'blue';

  return (
    <section className={isBlue ? 'rounded-lg border border-blue-100 bg-blue-50/70 p-5 shadow-sm' : 'rounded-lg border border-amber-100 bg-[#fffdf7] p-5 shadow-sm'}>
      <h2 className={isBlue ? 'text-lg font-semibold text-blue-950' : 'text-lg font-semibold text-amber-950'}>{title}</h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item} className="flex gap-3 rounded-md border border-white/80 bg-white/80 p-3">
            <CheckCircle2 className={isBlue ? 'mt-0.5 shrink-0 text-blue-700' : 'mt-0.5 shrink-0 text-amber-700'} size={18} />
            <p className="text-sm leading-6 text-slate-700">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
