import { useState } from 'react';
import { Download, Monitor, RefreshCw, Smartphone, Tablet } from 'lucide-react';
import { Project } from '../types';
import LiveInteractiveApp from './LiveInteractiveApp';

interface LiveSandboxPreviewProps { project: Project; onExport?: () => void; }

/** Workspace preview mirrors the product preview and never supplies a fake app. */
export default function LiveSandboxPreview({ project, onExport }: LiveSandboxPreviewProps) {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [reloading, setReloading] = useState(false);
  const width = viewport === 'mobile' ? 'max-w-[390px]' : viewport === 'tablet' ? 'max-w-[768px]' : 'w-full';
  const reload = () => { setReloading(true); window.setTimeout(() => setReloading(false), 350); };
  return <div className="h-[720px] border border-white/10 bg-[#080808] flex flex-col">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0d0d0d] p-3 font-mono text-xs">
      <span className="text-emerald-400">Artifact preview · {project.files?.length || 0} files</span>
      <div className="flex items-center gap-1"><button onClick={() => setViewport('desktop')} className="p-2" aria-label="Desktop"><Monitor size={15} /></button><button onClick={() => setViewport('tablet')} className="p-2" aria-label="Tablet"><Tablet size={15} /></button><button onClick={() => setViewport('mobile')} className="p-2" aria-label="Mobile"><Smartphone size={15} /></button><button onClick={reload} className="p-2" aria-label="Reload"><RefreshCw size={15} className={reloading ? 'animate-spin' : ''} /></button>{onExport && <button onClick={onExport} className="ml-2 flex items-center gap-1 border border-white/20 px-3 py-2"><Download size={13} /> Export</button>}</div>
    </div>
    <div className="flex-1 overflow-auto p-3 md:p-6 flex justify-center"><div className={`${width} min-h-full bg-[#10100f] shadow-2xl transition-all duration-300`}><LiveInteractiveApp project={project} /></div></div>
  </div>;
}
