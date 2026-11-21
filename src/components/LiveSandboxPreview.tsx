import { useCallback, useEffect, useState } from 'react';
import { Download, Monitor, RefreshCw, Smartphone, Tablet, AlertTriangle, ExternalLink } from 'lucide-react';
import { Project, Agent, AgentLog, ExecutionRun } from '../types';
import LiveSwarmGenerationTracker from './LiveSwarmGenerationTracker';

interface LiveSandboxPreviewProps {
  project: Project;
  onExport?: () => void;
  onViewCode?: () => void;
  onViewSwarm?: () => void;
  progressPercentage?: number;
  activeAgent?: Agent;
  logs?: AgentLog[];
  executionRun?: ExecutionRun | null;
}

type PreviewStatus = {
  status: 'ready' | 'not_built' | 'failed' | 'preview_error' | 'project_not_found' | 'invalid_project_id';
  previewUrl?: string | null;
  message?: string;
  error?: string;
  filesCount?: number;
};

/** Displays the real built project from its isolated workspace, never a prompt-selected demo. */
export default function LiveSandboxPreview({
  project,
  onExport,
  onViewCode,
  onViewSwarm,
  progressPercentage,
  activeAgent,
  logs,
  executionRun,
}: LiveSandboxPreviewProps) {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [preview, setPreview] = useState<PreviewStatus | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [checking, setChecking] = useState(false);

  const isFailed = project.status === 'failed' || executionRun?.status === 'failed';
  const isCancelled = project.status === 'cancelled' || executionRun?.status === 'cancelled';
  const isGenerating =
    !isFailed &&
    !isCancelled &&
    (['generating', 'planning', 'coding', 'review', 'building', 'testing'].includes(project.status) ||
      executionRun?.status === 'queued' ||
      executionRun?.status === 'running' ||
      (progressPercentage !== undefined && progressPercentage < 100));

  const refreshPreviewStatus = useCallback(async (signal?: AbortSignal) => {
    setChecking(true);
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(project.id)}/preview/status`, {
        cache: 'no-store',
        signal,
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        setPreviewError(data.error || data.message || `Preview status request failed (${response.status})`);
        setPreview(null);
      } else {
        setPreview(data as PreviewStatus);
        setPreviewError(null);
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        setPreviewError(error?.message || 'Unable to contact the preview server.');
      }
    } finally {
      if (!signal?.aborted) setChecking(false);
    }
  }, [project.id]);

  useEffect(() => {
    const controller = new AbortController();
    void refreshPreviewStatus(controller.signal);
    return () => controller.abort();
  }, [refreshPreviewStatus, project.updatedAt, executionRun?.status, reloadKey]);

  useEffect(() => {
    if (isGenerating || preview?.status === 'ready' || isFailed || isCancelled) return;
    const timer = window.setInterval(() => void refreshPreviewStatus(), 4000);
    return () => window.clearInterval(timer);
  }, [isGenerating, preview?.status, isFailed, isCancelled, refreshPreviewStatus]);

  const previewUrl = preview?.status === 'ready'
    ? `${preview.previewUrl || `/preview/${encodeURIComponent(project.id)}/`}?v=${reloadKey}`
    : null;
  const width = viewport === 'mobile' ? 'max-w-[390px]' : viewport === 'tablet' ? 'max-w-[768px]' : 'w-full';

  return (
    <div className="min-h-[720px] border border-white/10 bg-[#080808] flex flex-col rounded-2xl overflow-hidden shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0d0d0d] p-3.5 font-mono text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full ${previewUrl ? 'bg-emerald-400' : isFailed ? 'bg-rose-500' : 'bg-amber-400 animate-pulse'}`} />
          <span className={previewUrl ? 'text-emerald-400 font-bold' : isFailed ? 'text-rose-400 font-bold' : 'text-amber-300 font-bold'}>
            {previewUrl ? 'REAL GENERATED APP · LIVE PREVIEW' : isFailed ? 'BUILD FAILED · DIAGNOSTICS REQUIRED' : isCancelled ? 'GENERATION CANCELLED' : isGenerating ? 'GENERATING SOURCE FILES' : 'WAITING FOR SUCCESSFUL BUILD'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setViewport('desktop')} className={`p-2 rounded hover:bg-white/10 ${viewport === 'desktop' ? 'text-violet-400' : 'text-slate-400'}`} aria-label="Desktop"><Monitor size={15} /></button>
          <button onClick={() => setViewport('tablet')} className={`p-2 rounded hover:bg-white/10 ${viewport === 'tablet' ? 'text-violet-400' : 'text-slate-400'}`} aria-label="Tablet"><Tablet size={15} /></button>
          <button onClick={() => setViewport('mobile')} className={`p-2 rounded hover:bg-white/10 ${viewport === 'mobile' ? 'text-violet-400' : 'text-slate-400'}`} aria-label="Mobile"><Smartphone size={15} /></button>
          <button onClick={() => { setReloadKey((value) => value + 1); void refreshPreviewStatus(); }} className="p-2 rounded hover:bg-white/10 text-slate-400" aria-label="Reload preview"><RefreshCw size={15} /></button>
          {previewUrl && <a href={previewUrl} target="_blank" rel="noreferrer" className="p-2 rounded hover:bg-white/10 text-slate-400" aria-label="Open preview in new tab"><ExternalLink size={15} /></a>}
          {onExport && <button onClick={onExport} className="ml-2 flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition font-mono"><Download size={13} /> Export</button>}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 md:p-6 flex justify-center bg-[#09090d]">
        <div className={`${width} min-h-full transition-all duration-300`}>
          {isGenerating ? (
            <LiveSwarmGenerationTracker project={project} progressPercentage={progressPercentage} activeAgent={activeAgent} logs={logs} executionRun={executionRun} onViewCode={onViewCode} onViewSwarm={onViewSwarm} />
          ) : previewUrl ? (
            <div className="w-full min-h-[640px] h-[75vh] bg-white rounded-xl overflow-hidden border border-white/10">
              <iframe key={reloadKey} title={`${project.name} generated application preview`} src={previewUrl} className="w-full h-full min-h-[640px] border-0 bg-white" sandbox="allow-scripts allow-forms allow-modals allow-popups allow-downloads" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className="min-h-[520px] flex items-center justify-center p-6">
              <div className="max-w-xl w-full rounded-2xl border border-amber-500/20 bg-[#111116] p-6 space-y-4">
                <div className="flex items-center gap-3 text-amber-300"><AlertTriangle size={20} /><h3 className="font-semibold">No runnable preview build found</h3></div>
                <p className="text-sm text-slate-300">{previewError || preview?.message || (isFailed ? 'The orchestration failed before producing a preview build.' : 'The generated source files are not yet compiled into dist/.')}</p>
                <div className="text-xs font-mono text-slate-500 space-y-1">
                  <p>Project files: {project.files?.length || 0}</p>
                  <p>Preview status: {preview?.status || (checking ? 'checking' : 'unknown')}</p>
                  <p>Build status: {executionRun?.status || project.status}</p>
                </div>
                <p className="text-xs text-slate-400">Install the generated project's dependencies in its isolated workspace (with approval), run the real production build, then refresh this panel. The preview will only appear when dist/index.html exists.</p>
                <button onClick={() => { setReloadKey((value) => value + 1); void refreshPreviewStatus(); }} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm">Check build again</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
