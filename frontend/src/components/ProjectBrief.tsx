import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, FileText } from 'lucide-react';

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
  'LLM provider: Groq OpenAI-compatible API',
  'Planner model: llama-3.1-8b-instant',
  'Formatter model: llama-3.1-8b-instant',
];

const realItems = [
  'Frontend demo routes for Documentation, Fleet, Documents, Ask, and Aliases.',
  'Synthetic dataset with 230 fleet documents across 10 document categories.',
  'Document ingestion pipeline for classification, extraction, entity linking, and search.',
  'API service layer designed to connect the frontend to the fleet data and AI-agent services.',
];

const hallucinationControls = [
  'The AI agent is not allowed to write SQL or directly query the database.',
  'The planner converts a user question into typed tool calls such as get_expenses, find_document, resolve_entity, or get_fleet_overview.',
  'Each tool validates parameters, runs backend-owned logic, and returns structured results from stored records.',
  'The final answer is formatted only from tool outputs and includes source IDs, document IDs, confidence, and execution details.',
  'The UI exposes tool calls and sources so the operator can verify where the answer came from.',
];

export default function ProjectBrief() {
  return (
    <article className="mx-auto max-w-4xl rounded-lg border border-cyan-100 bg-white px-5 py-5 shadow-sm shadow-cyan-100/60 sm:px-8">
      <header className="border-b border-cyan-100 pb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Documentation</p>
        <h1 className="mt-3 text-2xl font-semibold leading-tight text-slate-950 sm:text-3xl">
          FleetProof AI
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          AI-powered document intelligence for fleet operators. The system turns messy truck
          paperwork into searchable records and source-backed answers.
        </p>
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
            <li key={question} className="rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-amber-950">
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
        <ArchitectureDiagram />
      </DocSection>

      <DocSection title="How We Avoid Hallucinations">
        <p>
          FleetProof AI uses the model as a planner and formatter, not as the source of truth. The
          answer must come from validated tools, structured data, retrieved documents, and cited
          records.
        </p>
        <Checklist items={hallucinationControls} />
      </DocSection>

      <DocSection title="Key Features">
        <Checklist items={features} />
      </DocSection>

      <DocSection title="Tech Stack">
        <ul className="grid gap-2 sm:grid-cols-2">
          {techStack.map((item) => (
            <li key={item} className="rounded-md border border-cyan-100 bg-cyan-50/70 px-3 py-2 text-xs leading-5 text-slate-700">
              {item}
            </li>
          ))}
        </ul>
      </DocSection>

      <DocSection title="What Is Built">
        <h3 className="text-sm font-semibold text-slate-950">Real in this build</h3>
        <Checklist items={realItems} />
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

      <footer className="mt-8 border-t border-cyan-100 pt-5">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-teal-800 hover:text-teal-600"
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
    <section className="border-b border-cyan-100 py-6 last:border-b-0">
      <div className="mb-3 flex items-center gap-2">
        <FileText className="text-teal-700" size={18} />
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      </div>
      <div className="space-y-4 text-xs leading-6 text-slate-600 sm:text-sm">{children}</div>
    </section>
  );
}

function ArchitectureDiagram() {
  return (
    <div className="rounded-lg border border-cyan-100 bg-[#f5fcff] p-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <DiagramBox
          title="Fleet Documents"
          items={['Titles', 'Fuel records', 'Tax forms', 'Renewals', 'Maintenance receipts']}
        />
        <DiagramArrow />
        <DiagramBox
          title="Ingestion Pipeline"
          items={['Classify document', 'Extract fields', 'Normalize dates and amounts']}
        />
      </div>

      <div className="my-3 flex justify-center">
        <div className="h-8 border-l border-teal-300" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <DiagramBox
          title="Entity Resolution"
          items={['Unit 84', 'Trk 84', 'T-084', '84', 'Same canonical truck']}
        />
        <DiagramArrow />
        <DiagramBox
          title="Fleet Knowledge Store"
          items={['SQLite structured records', 'ChromaDB document search', 'Source metadata']}
        />
      </div>

      <div className="my-3 flex justify-center">
        <div className="h-8 border-l border-teal-300" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <DiagramBox
          title="Typed Tool Layer"
          items={['get_expenses', 'find_document', 'resolve_entity', 'get_fleet_overview']}
        />
        <DiagramArrow />
        <DiagramBox
          title="Operator Experience"
          items={['Ask in plain English', 'See cited answers', 'Inspect tool calls']}
        />
      </div>
    </div>
  );
}

function DiagramBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-cyan-100 bg-white p-3 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function DiagramArrow() {
  return (
    <div className="hidden h-px w-10 bg-teal-300 lg:block" aria-hidden="true" />
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <CheckCircle2 className="mt-1 shrink-0 text-emerald-600" size={15} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
