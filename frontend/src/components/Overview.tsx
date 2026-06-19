import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Overview() {
  return (
    <div className="w-full h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-8 max-w-2xl px-4">
        {/* Logo */}
        <div className="text-6xl font-bold text-white">Fleet</div>

        {/* Tagline */}
        <p className="text-lg text-slate-400">
          Ask anything about your fleet. Get grounded answers.
        </p>

        {/* CTA */}
        <Link
          to="/chat"
          className="inline-flex items-center gap-2 bg-white text-slate-950 px-8 py-3 rounded-full font-semibold hover:bg-slate-100 transition-colors"
        >
          Start
          <ArrowRight size={18} />
        </Link>

        {/* Footer */}
        <p className="text-xs text-slate-600">230 documents • 10 trucks • Real-time pipeline</p>
      </div>
    </div>
  );
}
