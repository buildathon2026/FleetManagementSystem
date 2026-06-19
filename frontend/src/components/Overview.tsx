import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Overview() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center px-4">
      {/* Main Content */}
      <div className="max-w-2xl w-full space-y-8">
        {/* Logo/Title */}
        <div className="text-center space-y-4">
          <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            Fleet Intelligence
          </div>
          <p className="text-xl text-slate-300">
            50+ fleet documents per week. Now searchable, organized, and intelligent.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">230</div>
            <div className="text-xs text-slate-400 mt-1">Documents Ingested</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">10</div>
            <div className="text-xs text-slate-400 mt-1">Truck Entities</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-pink-400">0</div>
            <div className="text-xs text-slate-400 mt-1">Hallucinations</div>
          </div>
        </div>

        {/* Key Features - Minimal */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-slate-300">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
              ✓
            </div>
            <span>Ask in plain English. Get grounded answers with sources.</span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
              ✓
            </div>
            <span>Watch the pipeline execute. See every step in real-time.</span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400">
              ✓
            </div>
            <span>Entity linking works automatically. "Trk 84" → T-084.</span>
          </div>
        </div>

        {/* CTA Button */}
        <Link
          to="/chat"
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 group"
        >
          <Sparkles size={20} />
          Start Asking Questions
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* Sample Questions */}
        <div className="space-y-2">
          <p className="text-xs text-slate-500 text-center mb-3">Try these questions:</p>
          <div className="grid grid-cols-1 gap-2">
            <button className="text-left p-3 bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-300 transition-all">
              💰 How much on parts last month?
            </button>
            <button className="text-left p-3 bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-300 transition-all">
              📄 Find tax form for truck 84
            </button>
            <button className="text-left p-3 bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-300 transition-all">
              🚛 Which trucks are profitable?
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-center text-xs text-slate-500">
        <p>Grounded in 230 real-world fleet documents</p>
      </div>
    </div>
  );
}
