import { CheckCircle2, Circle, Loader, AlertCircle } from 'lucide-react';

export interface PipelineStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  duration?: number;
}

interface PipelineVisualizationProps {
  stages: PipelineStage[];
}

export default function PipelineVisualization({ stages }: PipelineVisualizationProps) {
  return (
    <div className="space-y-3 bg-slate-900/50 rounded-lg p-4 border border-slate-800">
      <div className="text-xs font-semibold text-slate-400 uppercase">Processing Pipeline</div>

      <div className="space-y-2">
        {stages.map((stage, index) => (
          <div key={stage.id}>
            {/* Stage */}
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 w-6 h-6">
                {stage.status === 'complete' && (
                  <CheckCircle2 size={24} className="text-blue-400" />
                )}
                {stage.status === 'running' && (
                  <Loader size={24} className="text-blue-400 animate-spin" />
                )}
                {stage.status === 'pending' && (
                  <Circle size={24} className="text-slate-500" />
                )}
                {stage.status === 'error' && (
                  <AlertCircle size={24} className="text-red-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-200">{stage.name}</span>
                  {stage.duration && (
                    <span className="text-xs text-slate-500">{stage.duration}ms</span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{stage.description}</p>
              </div>
            </div>

            {/* Connector Line */}
            {index < stages.length - 1 && (
              <div className="ml-3 h-3 border-l border-slate-700" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
