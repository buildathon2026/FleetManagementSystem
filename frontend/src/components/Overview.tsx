import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Boxes,
  CheckCircle2,
  Database,
  FileText,
  Mail,
  MessageCircle,
  ReceiptText,
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
    <div className="space-y-4">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
          <div className="p-5 sm:p-6 lg:p-7">
            <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
              Instant, verifiable answers from every fleet record
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Ask FleetProof AI anything about your fleet and get verified answers from every
              document, receipt, form, and email associated with each truck.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/chat?q=Compare%20truck%20T-084%20and%20T-091%20revenue"
                className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
              >
                <Bot size={18} />
                AI chat
              </Link>
              <Link
                to="/documents"
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                <UploadCloud size={18} />
                Upload document
              </Link>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-4 lg:border-l lg:border-t-0">
            <div className="grid gap-3">
              <div className="rounded-lg border border-rose-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                  Before FleetProof AI
                </p>
                <p className="mt-1 text-base font-semibold text-slate-950">Paperwork is scattered</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <RecordChip icon={ReceiptText} title="Fuel receipt" meta="glove box" tone="messy" />
                  <RecordChip icon={Mail} title="Renewal email" meta="old inbox thread" tone="messy" />
                  <RecordChip icon={FileText} title="Tax form" meta="filing cabinet" tone="messy" />
                  <RecordChip icon={Truck} title="Unit 84 / Trk 84" meta="same truck, unclear" tone="messy" />
                </div>
              </div>

              <div className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      After FleetProof AI
                    </p>
                    <p className="mt-1 text-base font-semibold text-slate-950">
                      Everything links to the right truck
                    </p>
                  </div>
                  <CheckCircle2 className="shrink-0 text-blue-700" size={22} />
                </div>

                <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-2.5 text-sm font-semibold text-slate-800">
                  Ask: What do I need to renew truck T-084 plates?
                </p>

                <div className="mt-2 rounded-md border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-slate-800">
                  Registration, insurance, and tax form are ready. Fuel receipt and maintenance
                  records are already attached to T-084.
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {['T-084', 'REG-084', 'INS-084', 'TAX-2026'].map((source) => (
                    <span
                      key={source}
                      className="rounded-full bg-blue-700 px-2.5 py-1 text-xs font-semibold text-white"
                    >
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        {demoFlow.map(({ title, body, to, icon: Icon }, index) => (
          <Link
            key={title}
            to={to}
            className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                  <Icon size={18} />
                </span>
                <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
              </div>
              <ArrowRight className="text-slate-300 group-hover:text-blue-700" size={18} />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Boxes className="text-blue-800" size={22} />
              <h2 className="text-lg font-semibold text-slate-950">Demo pipeline</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use this row to explain the build in 20 seconds.
            </p>
          </div>
          <Link
            to="/graph"
            className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-900 hover:bg-blue-100"
          >
            <Truck size={18} />
            View aliases
          </Link>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-5">
          {pipeline.map((item, index) => (
            <div key={item} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-blue-700">Step {index + 1}</p>
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
              <h2 className="text-lg font-semibold text-amber-950">What the demo proves</h2>
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

      <section className="rounded-lg border border-indigo-100 bg-indigo-50/70 p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-indigo-700" size={22} />
          <h2 className="text-lg font-semibold text-slate-950">Why hallucination is reduced</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            'The model requests approved tools; backend code performs the data lookup.',
            'Answers cite load IDs, invoices, or document IDs returned by those tools.',
            'The LLM never gets raw SQL access or direct database control.',
          ].map((point) => (
            <div key={point} className="rounded-md border border-indigo-100 bg-white/80 p-3">
              <CheckCircle2 className="text-indigo-600" size={18} />
              <p className="mt-2 text-sm leading-6 text-slate-700">{point}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function RecordChip({
  icon: Icon,
  title,
  meta,
  tone = 'clean',
}: {
  icon: typeof FileText;
  title: string;
  meta: string;
  tone?: 'messy' | 'clean';
}) {
  const toneClasses =
    tone === 'messy'
      ? 'border-rose-100 bg-rose-50 text-rose-700'
      : 'border-blue-100 bg-blue-50 text-blue-700';

  return (
    <div className="rounded-md border border-slate-200 bg-white p-2.5">
      <div className="flex items-start gap-2">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${toneClasses}`}>
          <Icon size={17} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500">{meta}</p>
        </div>
      </div>
    </div>
  );
}
