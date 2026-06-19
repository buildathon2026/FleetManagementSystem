import { Link } from 'react-router-dom';

export default function Overview() {
  return (
    <div className="w-full min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-3xl space-y-12">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-2">Fleet</h1>
          <p className="text-slate-400">Search your fleet documents and data</p>
        </div>

        {/* Search Bar - Centered */}
        <Link
          to="/chat"
          className="block"
        >
          <div className="bg-slate-800 border border-slate-700 rounded-full px-6 py-4 flex items-center gap-3 hover:border-slate-600 hover:bg-slate-800/80 transition-all cursor-text">
            <svg
              className="w-5 h-5 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Ask about expenses, documents, trucks..."
              className="flex-1 bg-transparent outline-none text-slate-200 placeholder-slate-500 text-lg"
              readOnly
            />
          </div>
        </Link>

        {/* Examples */}
        <div className="space-y-3">
          <p className="text-center text-xs text-slate-600 uppercase tracking-wider">Examples</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link
              to="/chat?q=What%20is%20the%20revenue%20for%20truck%20T-084"
              className="p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all group"
            >
              <p className="text-sm text-slate-300 group-hover:text-slate-100">
                💰 What is the revenue for truck T-084?
              </p>
              <p className="text-xs text-slate-600 mt-1">Entity resolution + revenue</p>
            </Link>

            <Link
              to="/chat?q=Show%20all%20loads%20for%20truck%20T-084"
              className="p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all group"
            >
              <p className="text-sm text-slate-300 group-hover:text-slate-100">
                📄 Show all loads for truck T-084
              </p>
              <p className="text-xs text-slate-600 mt-1">Load retrieval & filtering</p>
            </Link>

            <Link
              to="/chat?q=What%20is%20the%20revenue%20for%20truck%20T-091"
              className="p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all group"
            >
              <p className="text-sm text-slate-300 group-hover:text-slate-100">
                📊 What is the revenue for truck T-091?
              </p>
              <p className="text-xs text-slate-600 mt-1">Multi-truck comparison</p>
            </Link>

            <Link
              to="/chat?q=Compare%20revenue%20between%20truck%20T-084%20and%20T-091"
              className="p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all group"
            >
              <p className="text-sm text-slate-300 group-hover:text-slate-100">
                🚚 Compare trucks T-084 and T-091
              </p>
              <p className="text-xs text-slate-600 mt-1">Multi-entity analysis</p>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-600 border-t border-slate-800 pt-8">
          <p>230 documents • 10 trucks • Real-time pipeline • Zero hallucinations</p>
        </div>
      </div>
    </div>
  );
}
