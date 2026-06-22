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

const demoFlow = [
  {
    title: 'Upload',
    body: 'Bring in PDFs, images, receipts, registrations, and renewals.',
    to: '/documents',
    icon: UploadCloud,
  },
  {
    title: 'Ask',
    body: 'Use normal language: revenue, parts spend, renewals, truck records.',
    to: '/chat?q=Compare%20truck%20T-084%20and%20T-091%20revenue',
    icon: MessageCircle,
  },
  {
    title: 'Verify',
    body: 'Answers come from tools and source records, not model memory.',
    to: '/chat?q=Which%20trucks%20have%20documents%20expiring%20soon%3F',
    icon: ShieldCheck,
  },
];

const liveQuestions = [
  'Compare truck T-084 and T-091 revenue',
  'Which trucks have documents expiring soon?',
  'Show documents for truck T-084',
  'How much did I spend on parts last month?',
];

const pipeline = ['Ingest', 'Classify', 'Extract fields', 'Resolve aliases', 'Answer with proof'];

export default function Overview() {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-sky-100 bg-[#fbfffd] shadow-sm">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-6 sm:p-8 lg:p-10">
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
              Fleet paperwork becomes searchable, linked, and answerable.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              Carriers run on titles, registrations, fuel receipts, tax forms, insurance files,
              maintenance records, and email threads. FleetProof AI links the mess to the right
              truck and lets operators ask questions in plain English.
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
                Upload document
              </Link>
            </div>
          </div>

          <div className="border-t border-sky-100 bg-gradient-to-br from-slate-950 via-teal-900 to-sky-900 p-6 text-white lg:border-l lg:border-t-0">
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-sky-100">Before</p>
                <div className="mt-3 rounded-lg border border-white/15 bg-white/10 p-4">
                  <p className="text-sm leading-6 text-sky-50">
                    Unit 84, Trk 84, T-084, glove box receipts, renewal emails, and filing cabinets.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-100">After</p>
                <div className="mt-3 grid gap-3">
                  <Metric label="Documents in demo" value="230+" />
                  <Metric label="Truck aliases resolved" value="10" />
                  <Metric label="Raw SQL exposed to AI" value="0" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {demoFlow.map(({ title, body, to, icon: Icon }, index) => (
          <Link
            key={title}
            to={to}
            className="group rounded-lg border border-sky-100 bg-[#fbfffd] p-5 shadow-sm hover:border-sky-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-sky-50 text-sky-800">
                  <Icon size={20} />
                </span>
              </div>
              <ArrowRight className="text-slate-300 group-hover:text-teal-700" size={18} />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-lg border border-teal-100 bg-[#fbfffd] p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Boxes className="text-teal-800" size={22} />
              <h2 className="text-lg font-semibold text-slate-950">Demo pipeline</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use this row to explain the build in 20 seconds.
            </p>
          </div>
          <Link
            to="/graph"
            className="inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-900 hover:bg-teal-100"
          >
            <Truck size={18} />
            View aliases
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          {pipeline.map((item, index) => (
            <div key={item} className="rounded-lg border border-teal-100 bg-teal-50/60 p-4">
              <p className="text-xs font-semibold uppercase text-teal-700">Step {index + 1}</p>
              <p className="mt-2 text-sm font-semibold leading-5 text-slate-950">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-amber-100 bg-[#fffdf7] p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 text-amber-700" size={22} />
            <div>
              <h2 className="text-lg font-semibold text-amber-950">What judges should notice</h2>
              <p className="mt-2 text-sm leading-6 text-amber-800">
                The app does not just chat. It uploads documents, normalizes truck aliases,
                queries structured data, retrieves documents, and shows source-backed answers.
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
            <h2 className="text-lg font-semibold text-slate-950">Live questions to click</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {liveQuestions.map((question) => (
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
          <h2 className="text-lg font-semibold text-slate-950">Why hallucination is reduced</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            'The model requests approved tools; backend code performs the data lookup.',
            'Answers cite load IDs, invoices, or document IDs returned by those tools.',
            'The LLM never gets raw SQL access or direct database control.',
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
