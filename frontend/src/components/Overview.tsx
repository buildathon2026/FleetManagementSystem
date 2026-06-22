import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Boxes,
  CheckCircle2,
  Database,
  MessageCircle,
  ShieldCheck,
  Truck,
  UploadCloud,
} from 'lucide-react';

const judgePath = [
  {
    step: '1',
    title: 'Upload messy documents',
    body: 'Drop in fuel receipts, tax forms, registrations, insurance files, or text extracts.',
    icon: UploadCloud,
    to: '/documents',
  },
  {
    step: '2',
    title: 'Ask an operator question',
    body: 'Try revenue comparisons, renewals, truck documents, or expense questions in plain English.',
    icon: MessageCircle,
    to: '/chat?q=Compare%20truck%20T-084%20and%20T-091%20revenue',
  },
  {
    step: '3',
    title: 'Verify the answer',
    body: 'Every answer is backed by typed tools, linked truck IDs, and source records.',
    icon: ShieldCheck,
    to: '/chat?q=Which%20trucks%20have%20documents%20expiring%20soon%3F',
  },
];

const sampleQuestions = [
  'Compare truck T-084 and T-091 revenue',
  'Which trucks have documents expiring soon?',
  'Show documents for truck T-084',
  'How much did I spend on parts last month?',
];

const architecture = [
  'Document upload',
  'Classify + extract',
  'Resolve truck aliases',
  'Query tools',
  'Grounded answer',
];

export default function Overview() {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-sky-100 bg-[#fbfffd] shadow-sm">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
          <div className="p-6 sm:p-8 lg:p-10">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Statement 7 · Fleet document intelligence
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
              A control room for fleet paperwork, plain-English questions, and verified answers.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              Trucking carriers run on scattered paper: fuel receipts, maintenance invoices,
              registrations, insurance renewals, tax forms, glove boxes, and email threads.
              FleetProof AI turns that mess into searchable truck records and answers an operator can trust.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/chat?q=Compare%20truck%20T-084%20and%20T-091%20revenue"
                className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800"
              >
                <Bot size={18} />
                AI chat
              </Link>
              <Link
                to="/documents"
                className="inline-flex items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-semibold text-sky-900 hover:bg-sky-100"
              >
                <UploadCloud size={18} />
                Upload a document
              </Link>
            </div>
          </div>

          <div className="border-t border-sky-100 bg-gradient-to-br from-slate-950 via-teal-900 to-sky-900 p-6 text-white lg:border-l lg:border-t-0">
            <div className="flex h-full flex-col justify-between gap-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-sky-100">Demo result</p>
                <h2 className="mt-3 text-2xl font-semibold">From “Truck 84” to an auditable answer.</h2>
                <p className="mt-3 text-sm leading-6 text-sky-50">
                  The system normalizes aliases like Unit 84, Trk 84, and T-084, then calls
                  approved backend tools for revenue, expenses, renewals, and documents.
                </p>
              </div>

              <div className="grid gap-3">
                <Metric label="Synthetic fleet documents" value="230+" />
                <Metric label="Truck records linked" value="10" />
                <Metric label="Raw SQL access for LLM" value="0" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {judgePath.map(({ step, title, body, icon: Icon, to }) => (
          <Link
            key={title}
            to={to}
            className="group rounded-lg border border-sky-100 bg-[#fbfffd] p-5 shadow-sm hover:border-sky-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-sm font-semibold text-white">
                  {step}
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-sky-50 text-sky-800">
                  <Icon size={20} />
                </span>
              </div>
              <ArrowRight className="text-slate-300 group-hover:text-teal-700" size={18} />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-lg border border-teal-100 bg-[#fbfffd] p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Boxes className="text-teal-800" size={22} />
              <h2 className="text-lg font-semibold text-slate-950">How the system works</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Show this row while presenting: it maps directly to the hackathon problem statement.
            </p>
          </div>
          <Link
            to="/graph"
            className="inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-900 hover:bg-teal-100"
          >
            <Truck size={18} />
            View truck links
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          {architecture.map((item, index) => (
            <div key={item} className="rounded-lg border border-teal-100 bg-teal-50/60 p-4">
              <p className="text-xs font-semibold uppercase text-teal-700">Step {index + 1}</p>
              <p className="mt-2 text-sm font-semibold leading-5 text-slate-950">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg border border-amber-100 bg-[#fffdf7] p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 text-amber-700" size={22} />
            <div>
              <h2 className="text-lg font-semibold text-amber-950">Operator pain made visible</h2>
              <p className="mt-2 text-sm leading-6 text-amber-800">
                Missed renewals and inspections can take trucks off the road. This demo surfaces
                urgent items first, then lets the operator inspect the underlying document.
              </p>
              <Link
                to="/dashboard"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-900 hover:text-amber-700"
              >
                Open fleet alerts <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Database className="text-sky-800" size={22} />
            <h2 className="text-lg font-semibold text-slate-950">Try these live questions</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {sampleQuestions.map((question) => (
              <Link
                key={question}
                to={`/chat?q=${encodeURIComponent(question)}`}
                className="rounded-md border border-sky-100 bg-white/90 p-3 text-sm font-medium leading-6 text-slate-700 hover:border-sky-200 hover:text-slate-950"
              >
                {question}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-emerald-700" size={22} />
          <h2 className="text-lg font-semibold text-slate-950">No-hallucination design</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            'The model requests typed tools; backend code performs the data lookup.',
            'Answers cite source records such as load IDs, invoices, or document IDs.',
            'If the backend is unavailable, the UI labels the answer as an unverified demo response.',
          ].map((point) => (
            <div key={point} className="rounded-md border border-emerald-100 bg-white/80 p-3">
              <CheckCircle2 className="text-emerald-600" size={18} />
              <p className="mt-2 text-sm leading-6 text-slate-700">{point}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/15 bg-white/10 p-4">
      <p className="text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-sky-50">{label}</p>
    </div>
  );
}
