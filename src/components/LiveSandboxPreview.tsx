import { useState } from 'react';
import { Download, Monitor, RefreshCw, Smartphone, Tablet } from 'lucide-react';
import { Project, Agent, AgentLog } from '../types';
import LiveInteractiveApp from './LiveInteractiveApp';
import LiveSwarmGenerationTracker from './LiveSwarmGenerationTracker';

interface LiveSandboxPreviewProps {
  project: Project;
  onExport?: () => void;
  onViewCode?: () => void;
  onViewSwarm?: () => void;
  progressPercentage?: number;
  activeAgent?: Agent;
  logs?: AgentLog[];
}

/** Workspace preview displays real-time swarm generation tracking or the deployed interactive application. */
export default function LiveSandboxPreview({
  project,
  onExport,
  onViewCode,
  onViewSwarm,
  progressPercentage,
  activeAgent,
  logs
}: LiveSandboxPreviewProps) {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [reloading, setReloading] = useState(false);
  const width = viewport === 'mobile' ? 'max-w-[390px]' : viewport === 'tablet' ? 'max-w-[768px]' : 'w-full';
  const reload = () => {
    setReloading(true);
    window.setTimeout(() => setReloading(false), 350);
  };

  const allAgentsDone =
    project.agents && project.agents.length > 0 && project.agents.every((a) => a.status === 'complete');

  const isGenerating =
    project.status === 'generating' ||
    project.status === 'planning' ||
    project.status === 'coding' ||
    project.status === 'review' ||
    (progressPercentage !== undefined && progressPercentage < 100) ||
    !project.files ||
    project.files.length === 0 ||
    (!allAgentsDone && project.status !== 'deployed');

  return (
    <div className="min-h-[720px] border border-white/10 bg-[#080808] flex flex-col rounded-2xl overflow-hidden shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0d0d0d] p-3.5 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
          <span className={isGenerating ? 'text-amber-300 font-bold' : 'text-emerald-400'}>
            {isGenerating ? 'Swarm Build Container · Live Generation' : `Artifact Deployed · ${project.files?.length || 0} files`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setViewport('desktop')} className={`p-2 rounded hover:bg-white/10 ${viewport === 'desktop' ? 'text-violet-400' : 'text-slate-400'}`} aria-label="Desktop">
            <Monitor size={15} />
          </button>
          <button onClick={() => setViewport('tablet')} className={`p-2 rounded hover:bg-white/10 ${viewport === 'tablet' ? 'text-violet-400' : 'text-slate-400'}`} aria-label="Tablet">
            <Tablet size={15} />
          </button>
          <button onClick={() => setViewport('mobile')} className={`p-2 rounded hover:bg-white/10 ${viewport === 'mobile' ? 'text-violet-400' : 'text-slate-400'}`} aria-label="Mobile">
            <Smartphone size={15} />
          </button>
          <button onClick={reload} className="p-2 rounded hover:bg-white/10 text-slate-400" aria-label="Reload">
            <RefreshCw size={15} className={reloading ? 'animate-spin' : ''} />
          </button>
          {onExport && (
            <button onClick={onExport} className="ml-2 flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition font-mono">
              <Download size={13} /> Export
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 md:p-6 flex justify-center bg-[#09090d]">
        <div className={`${width} min-h-full transition-all duration-300`}>
          {isGenerating ? (
            <LiveSwarmGenerationTracker
              project={project}
              progressPercentage={progressPercentage}
              activeAgent={activeAgent}
              logs={logs}
              onViewCode={onViewCode}
              onViewSwarm={onViewSwarm}
            />
          ) : (
            <div className="bg-[#10100f] shadow-2xl rounded-2xl overflow-hidden border border-white/5">
              <LiveInteractiveApp project={project} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

