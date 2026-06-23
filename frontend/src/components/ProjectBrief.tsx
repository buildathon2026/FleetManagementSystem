import { Link } from 'react-router-dom';
import { ArrowRight, Bot, CheckCircle2, FileText, LayoutDashboard } from 'lucide-react';

const architecture = [
  ['1. Document ingestion', 'Classifies fleet documents and extracts structured fields like truck ID, date, amount, vendor, and document type.'],
  ['2. Entity resolution', 'Maps messy truck names such as Unit 84, Trk 84, T-084, and 84 to the same canonical truck.'],
  ['3. Data storage', 'Stores verified records in structured tables and keeps searchable document embeddings for semantic search.'],
  ['4. AI agent', 'Routes user questions to approved tools instead of allowing the model to invent facts or write SQL.'],
  ['5. Frontend demo', 'Shows the dashboard, document search, AI chat, alias resolution, and answer transparency.'],
];

const features = [
  'Document classification for fuel receipts, maintenance invoices, registrations, insurance, tax forms, emails, settlements, inspections, toll receipts, and titles.',
  'Field extraction for operational data such as truck reference, amount, date, vendor, and document summary.',
  'Truck alias resolution so multiple document formats still connect to the correct fleet asset.',
  'Semantic document search for natural queries like fuel receipt truck 84.',
  'AI chat interface with source citations and tool-call transparency.',
  'Fleet dashboard for revenue, document coverage, and operational alerts.',
];

const techStack = [
  'React + TypeScript frontend',
  'Vite build system',
  'Tailwind CSS styling',
  'Python backend services',
  'FastAPI-style service architecture',
  'SQLite for structured records',
  'ChromaDB for vector search',
  'MCP-style typed tools for controlled data access',
  'LLM planner and formatter for natural-language Q&A',
];

const realItems = [
  'Frontend demo routes for Documentation, Fleet, Documents, Ask, and Aliases.',
  'Synthetic dataset with 230 fleet documents across 10 document categories.',
  'Document ingestion pipeline for classification, extraction, entity linking, and search.',
  'API service layer that can call local backend services and fall back for demo continuity.',
];

const mockedItems = [
  'Some dashboard and chat responses can fall back to mock data if backend services are unavailable.',
  'Production authentication, roles, and tenant isolation are not complete yet.',
  'The full MCP data server and complete AI-agent orchestration are represented by contracts and planned service boundaries.',
];

const improvements = [
  'Connect every frontend view to live backend services in the deployed environment.',
  'Add production login, tenant isolation, and role-based access.',
  'Render original uploaded files with highlighted extracted fields.',
  'Add profitability analytics by truck, route, vendor, and time period.',
  'Add deployment monitoring and audit logs for tool calls.',
];

export default function ProjectBrief() {
  return (
    <article className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-8 lg:px-10">
      <header className="border-b border-slate-200 pb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">Documentation</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
          FleetProof AI
        </h1>
        <p className="mt-3 text-lg leading-8 text-slate-600">
          AI-powered document intelligence for fleet operators. The system turns messy truck
          paperwork into searchable records and source-backed answers.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
          >
            <LayoutDashboard size={18} />
            Start demo
          </Link>
          <Link
            to="/chat?q=Which%20trucks%20have%20documents%20expiring%20soon%3F"
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            <Bot size={18} />
            Ask a sample question
          </Link>
        </div>
      </header>

      <DocSection title="Overview">
        <p>
          FleetProof AI is a demo system for trucking and fleet operations. It ingests operational
          documents, extracts useful fields, links every record to the correct truck, and lets users
          ask questions through a grounded AI interface.
        </p>
        <p>
          The presentation flow is designed to work without slides: read this documentation page
          first, then move through Fleet, Documents, Ask, and Aliases in the navigation.
        </p>
      </DocSection>

      <DocSection title="Problem">
        <p>
          Trucking carriers run on paper. An active fleet generates 50+ documents every week:
          titles, tax forms, fuel records, registration renewals, maintenance receipts, insurance
          certificates, toll receipts, inspections, settlements, and emails.
        </p>
        <p>
          Today, those records live in filing cabinets, glove boxes, and email threads. Nothing is
          searchable. Nothing is organized by truck. Operators cannot answer basic questions without
          digging through physical files and disconnected messages.
        </p>
        <ul className="space-y-2">
          {[
            'Which trucks are profitable?',
            'How much did I spend on parts last month?',
            'Where is the tax form for truck 84?',
            'What documents do I need to renew these plates?',
          ].map((question) => (
            <li key={question} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
              {question}
            </li>
          ))}
        </ul>
        <p>
          The challenge is that some questions require database queries, some require document
          retrieval, and some require both in one answer. The system needs to handle all of them
          accurately, grounded in real records, with no hallucinations.
        </p>
      </DocSection>

      <DocSection title="Solution">
        <p>
          The system creates one searchable, structured view of fleet documents. It classifies each
          document, extracts the important fields, resolves messy truck references, stores the
          information, and answers questions using tool-backed data.
        </p>
        <p>
          The important design choice is that the AI does not directly control the database or invent
          numbers. It uses approved tools and returns answers with sources.
        </p>
      </DocSection>

      <DocSection title="Architecture">
        <ol className="space-y-3">
          {architecture.map(([title, body]) => (
            <li key={title} className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">{title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
            </li>
          ))}
        </ol>
      </DocSection>

      <DocSection title="Key Features">
        <Checklist items={features} />
      </DocSection>

      <DocSection title="Tech Stack">
        <ul className="grid gap-2 sm:grid-cols-2">
          {techStack.map((item) => (
            <li key={item} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {item}
            </li>
          ))}
        </ul>
      </DocSection>

      <DocSection title="What Is Real vs Mocked">
        <h3 className="text-base font-semibold text-slate-950">Real in this build</h3>
        <Checklist items={realItems} />

        <h3 className="mt-6 text-base font-semibold text-slate-950">Mocked or planned</h3>
        <Checklist items={mockedItems} />
      </DocSection>

      <DocSection title="Design and Implementation Summary">
        <p>
          The project is organized as independent modules so each part can evolve separately:
          document ingestion, entity resolution, secure data access, AI planning, and the frontend.
          This keeps the demo understandable while also matching a production-style architecture.
        </p>
        <p>
          The frontend is built as the presentation surface. The Documentation page explains the
          project, and the remaining pages demonstrate the product experience live.
        </p>
      </DocSection>

      <DocSection title="Future Improvements">
        <Checklist items={improvements} />
      </DocSection>

      <footer className="mt-8 border-t border-slate-200 pt-5">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-800 hover:text-blue-600"
        >
          Continue to Fleet demo
          <ArrowRight size={16} />
        </Link>
      </footer>
    </article>
  );
}

function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-slate-200 py-7 last:border-b-0">
      <div className="mb-3 flex items-center gap-2">
        <FileText className="text-blue-800" size={20} />
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      </div>
      <div className="space-y-4 text-sm leading-7 text-slate-600">{children}</div>
    </section>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <CheckCircle2 className="mt-1 shrink-0 text-blue-700" size={17} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
