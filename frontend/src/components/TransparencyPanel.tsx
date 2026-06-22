import { X, Eye } from 'lucide-react';

interface TransparencyData {
  queryType: string;
  tools: any[];
  executionTime: number;
}

export default function TransparencyPanel({
  data,
  onClose,
}: {
  data: TransparencyData;
  onClose: () => void;
}) {
  return (
    <div className="bg-[#fbfffd] border border-teal-100 rounded-lg shadow-2xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-teal-100">
        <div className="flex items-center gap-2 text-teal-800 font-semibold">
          <Eye size={16} />
          Execution Transparency
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-950 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Query Type */}
      <div className="text-xs">
        <p className="text-slate-400 mb-1">Query Type</p>
        <div className="inline-block bg-teal-50 px-2 py-1 rounded border border-teal-200 text-teal-800 font-semibold">
          [{data.queryType}]
        </div>
      </div>

      {/* Tools Executed */}
      {data.tools.length > 0 && (
        <div className="text-xs">
          <p className="text-slate-400 mb-2">Tools Executed ({data.tools.length})</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {data.tools.map((tool, i) => (
              <div key={i} className="bg-sky-50/70 p-2 rounded border border-sky-100">
                <p className="font-semibold text-slate-900">{tool.tool}</p>
                {tool.params && Object.keys(tool.params).length > 0 && (
                  <p className="text-slate-400 text-xs mt-1">
                    params: {JSON.stringify(tool.params)}
                  </p>
                )}
                {tool.execution_time_ms && (
                  <p className="text-slate-500 text-xs mt-1">
                    {tool.execution_time_ms}ms
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execution Time */}
      <div className="text-xs bg-sky-50/70 p-2 rounded border border-sky-100">
        <p className="text-slate-400">Total Execution Time</p>
        <p className="text-green-400 font-semibold">{data.executionTime}ms</p>
      </div>

      {/* Anti-Hallucination Note */}
      <div className="text-xs bg-emerald-50 p-2 rounded border border-emerald-200 text-emerald-800">
        ✓ LLM never saw database schema or raw SQL
      </div>
    </div>
  );
}
