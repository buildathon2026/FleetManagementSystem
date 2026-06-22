import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Database,
  FileSearch,
  MessageCircle,
  Truck,
} from 'lucide-react';

const demoSteps = [
  {
    label: 'Ask',
    title: 'Ask in plain English',
    description: '“Which trucks have documents expiring soon?”',
    icon: MessageCircle,
    to: '/chat?q=Which%20trucks%20have%20documents%20expiring%20soon%3F',
  },
  {
    label: 'Verify',
    title: 'Inspect the source',
    description: 'Open linked documents and see the record behind the answer.',
    icon: FileSearch,
    to: '/documents',
  },
  {
    label: 'Act',
    title: 'Prioritize the fleet',
    description: 'Review alerts, revenue, document count, and truck status.',
    icon: Truck,
    to: '/dashboard',
  },
];

const proofPoints = [
  'Answers come from tool/API results, not model memory.',
  'Documents are linked to canonical truck IDs like T-084.',
  'Unverified demo responses are labeled when the backend is offline.',
];

export default function Overview() {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-teal-100 bg-[#fbfffd] shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-7 p-6 sm:p-8 lg:p-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                Fleet document intelligence
              </p>
              <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
                Turn messy fleet paperwork into answers operators can verify.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Fleet teams lose hours chasing receipts, registrations, insurance files,
                and truck aliases across email and filing cabinets. This demo turns those
                records into a searchable workspace with an AI assistant that shows its work.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/chat?q=Which%20trucks%20have%20documents%20expiring%20soon%3F"
                className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800"
              >
                <Bot size={18} />
                Try the AI demo
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-5 py-3 text-sm font-semibold text-teal-900 hover:bg-teal-100"
              >
                <Truck size={18} />
                View fleet status
              </Link>
            </div>
          </div>

          <div className="border-t border-teal-100 bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 p-6 text-white lg:border-l lg:border-t-0">
            <div className="flex h-full flex-col justify-between gap-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-teal-100">The problem</p>
                <h2 className="mt-3 text-2xl font-semibold">One truck, five names, dozens of documents.</h2>
                <p className="mt-3 text-sm leading-6 text-teal-50">
                  “Unit 84”, “Trk 84”, “T-084”, and “84” should all point to the same
                  vehicle. Without that link, revenue, renewals, and compliance work gets messy fast.
                </p>
              </div>

              <div className="grid gap-3">
                <Metric label="Sample documents" value="230+" />
                <Metric label="Truck aliases resolved" value="10" />
                <Metric label="Raw SQL exposed to AI" value="0" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {demoSteps.map(({ label, title, description, icon: Icon, to }) => (
          <Link
            key={title}
            to={to}
            className="group rounded-lg border border-teal-100 bg-[#fbfffd] p-5 shadow-sm hover:border-teal-200 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase text-sky-800">
                {label}
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-50 text-teal-800">
                <Icon size={20} />
              </span>
            </div>
            <h2 className="mt-5 text-lg font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{description}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-800 group-hover:text-teal-900">
              Open <ArrowRight size={16} />
            </span>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-amber-100 bg-[#fffdf7] p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 text-amber-700" size={22} />
            <div>
              <h2 className="text-lg font-semibold text-amber-950">Why this matters</h2>
              <p className="mt-2 text-sm leading-6 text-amber-800">
                A missed insurance renewal or inspection can take a truck off the road.
                The demo surfaces those risks first, then lets the operator drill into the document.
              </p>
              <Link
                to="/dashboard"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-900 hover:text-amber-700"
              >
                Review sample alerts <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Database className="text-sky-800" size={22} />
            <h2 className="text-lg font-semibold text-slate-950">How judges can tell it is not hallucinating</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {proofPoints.map((point) => (
              <div key={point} className="rounded-md border border-sky-100 bg-white/80 p-3">
                <CheckCircle2 className="text-emerald-600" size={18} />
                <p className="mt-2 text-sm leading-6 text-slate-700">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/15 bg-white/10 p-4">
      <p className="text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-teal-50">{label}</p>
    </div>
  );
}
