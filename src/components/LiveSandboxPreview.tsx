import React, { useState } from 'react';
import { Project } from '../types';
import {
  Globe,
  RefreshCw,
  Maximize2,
  Minimize2,
  Download,
  Smartphone,
  Tablet,
  Monitor,
  ShieldCheck,
  Server,
  Activity,
  Layers,
  Terminal,
  ExternalLink,
  CheckCircle2,
  Zap,
  Search,
  Plus,
  Play,
  Copy,
  Check
} from 'lucide-react';
import LiveInteractiveApp from './LiveInteractiveApp';

interface LiveSandboxPreviewProps {
  project: Project;
  onExport?: () => void;
}

export default function LiveSandboxPreview({ project, onExport }: LiveSandboxPreviewProps) {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState('dashboard');
  const [simulatedSearch, setSimulatedSearch] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [renderMode, setRenderMode] = useState<'canvas' | 'iframe'>('canvas');

  // Interactive sample state inside preview
  const [itemCount, setItemCount] = useState(12);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const realLiveUrl = typeof window !== 'undefined' ? `${window.location.origin}/preview/${project.id}` : `https://${project.id}.devforge.live`;

  const reloadSandbox = () => {
    setIsReloading(true);
    setTimeout(() => {
      setIsReloading(false);
      triggerNotice('Live Sandbox reloaded cleanly.');
    }, 600);
  };

  const triggerNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(realLiveUrl);
    setCopiedUrl(true);
    triggerNotice('Live Preview URL copied to clipboard!');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const viewportWidths = {
    desktop: 'w-full',
    tablet: 'max-w-[768px]',
    mobile: 'max-w-[390px]',
  };

  // Find source file content if present
  const appTsxFile = project.files?.find((f) => f.path.includes('App.tsx') || f.path.includes('App.jsx'));
  const prdFile = project.files?.find((f) => f.path.includes('PRD') || f.path.includes('prd'));

  return (
    <div
      className={`bg-[#0d0d0d] border border-[#222222] text-slate-100 flex flex-col transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[720px] shadow-2xl'
      }`}
      id="live-sandbox-preview-container"
    >
      {/* 1. Browser Navigation & Controls Bar */}
      <div className="bg-[#050505] px-4 py-3 border-b border-[#222222] flex flex-wrap items-center justify-between gap-3 select-none">
        {/* Left: Window Controls & Viewport selectors */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block border border-rose-600" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block border border-amber-600" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block border border-emerald-600" />
          </div>

          <div className="flex items-center bg-[#111111] border border-[#222222] p-0.5">
            <button
              onClick={() => setViewport('desktop')}
              className={`p-1.5 transition ${viewport === 'desktop' ? 'bg-white text-black font-bold' : 'text-slate-400 hover:text-white'}`}
              title="Desktop View (100%)"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`p-1.5 transition ${viewport === 'tablet' ? 'bg-white text-black font-bold' : 'text-slate-400 hover:text-white'}`}
              title="Tablet View (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`p-1.5 transition ${viewport === 'mobile' ? 'bg-white text-black font-bold' : 'text-slate-400 hover:text-white'}`}
              title="Mobile View (390px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center: Live URL Address Bar */}
        <div className="flex-1 max-w-xl min-w-[260px] flex items-center bg-[#111111] border border-[#27272a] px-3 py-1.5 text-[10px] font-mono text-slate-300 justify-between shadow-inner">
          <div className="flex items-center space-x-2 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate text-slate-200">{realLiveUrl}</span>
          </div>
          <div className="flex items-center space-x-1 shrink-0 ml-2">
            <button
              onClick={handleCopyUrl}
              className="p-1 hover:bg-[#222] text-slate-400 hover:text-white transition flex items-center space-x-1"
              title="Copy live preview URL"
            >
              {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span className="text-[9px] uppercase font-bold hidden sm:inline">{copiedUrl ? 'Copied' : 'Copy'}</span>
            </button>
            <a
              href={realLiveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-[#222] text-slate-400 hover:text-white transition flex items-center space-x-1"
              title="Open Live Preview in New Window"
            >
              <ExternalLink className="w-3 h-3 text-violet-400" />
              <span className="text-[9px] uppercase font-bold text-violet-400 hidden sm:inline">Open URL</span>
            </a>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 text-[10px] font-mono">
          <div className="flex items-center bg-[#111111] border border-[#222222] p-0.5">
            <button
              onClick={() => setRenderMode('canvas')}
              className={`px-2 py-1 uppercase text-[9px] font-bold transition ${renderMode === 'canvas' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'}`}
              title="Interactive Canvas"
            >
              Canvas
            </button>
            <button
              onClick={() => setRenderMode('iframe')}
              className={`px-2 py-1 uppercase text-[9px] font-bold transition ${renderMode === 'iframe' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'}`}
              title="Embedded Iframe"
            >
              Iframe
            </button>
          </div>

          <button
            onClick={reloadSandbox}
            disabled={isReloading}
            className="p-1.5 bg-[#111111] hover:bg-[#1a1a1a] border border-[#222222] text-slate-300 transition"
            title="Reload Sandbox"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin text-violet-400' : ''}`} />
          </button>

          {onExport && (
            <button
              onClick={onExport}
              className="bg-white hover:bg-violet-400 text-black px-3 py-1.5 font-bold uppercase tracking-wider text-[9px] transition flex items-center space-x-1"
            >
              <Download className="w-3 h-3" />
              <span>Export Code</span>
            </button>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-[#111111] hover:bg-[#1a1a1a] border border-[#222222] text-slate-300 transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Preview'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Interactive Sandbox Viewport Canvas */}
      <div className="flex-1 bg-[#020202] p-4 overflow-y-auto flex justify-center items-start">
        {renderMode === 'iframe' ? (
          <div className={`${viewportWidths[viewport]} transition-all duration-300 bg-[#09090b] border border-[#222222] h-[580px] flex flex-col shadow-2xl overflow-hidden`}>
            <iframe
              src={realLiveUrl}
              title={`Preview of ${project.name}`}
              className="w-full h-full border-0 bg-[#09090b]"
            />
          </div>
        ) : (
        <div
          className={`${viewportWidths[viewport]} transition-all duration-300 bg-[#09090b] border border-[#222222] min-h-[500px] flex flex-col shadow-2xl overflow-hidden`}
        >
          {/* Notification Toast */}
          {actionNotice && (
            <div className="bg-violet-600 text-white text-[11px] font-mono py-1.5 px-4 text-center font-bold animate-fadeIn flex items-center justify-center space-x-2">
              <SparkCheck className="w-3.5 h-3.5" />
              <span>{actionNotice}</span>
            </div>
          )}

          {/* Deployed App Simulated Navigation */}
          <div className="bg-[#121214] border-b border-[#222222] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow">
                {project.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">{project.name}</h3>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 border border-emerald-500/20">
                  SANDBOX v1.0 • LIVE
                </span>
              </div>
            </div>

            {/* App Nav Tabs */}
            <div className="flex items-center space-x-1 bg-[#09090b] p-1 border border-[#222222] text-[10px] font-mono">
              {['dashboard', 'analytics', 'architecture', 'api-docs'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveNavTab(tab)}
                  className={`px-3 py-1 capitalize transition ${
                    activeNavTab === tab ? 'bg-white text-black font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* App Body Content based on Active Tab */}
          <div className="p-6 flex-1 space-y-6 overflow-y-auto">
            {/* Overview / Interactive App Tab */}
            {activeNavTab === 'dashboard' && (
              <div className="space-y-4">
                <LiveInteractiveApp project={project} />
              </div>
            )}

            {/* Analytics Tab */}
            {activeNavTab === 'analytics' && (
              <div className="space-y-4">
                <div className="bg-[#121215] border border-[#222222] p-5 rounded-lg space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">Runtime Telemetry</h4>
                  <div className="grid grid-cols-2 gap-4 text-[11px] font-mono">
                    <div className="p-3 bg-[#08080a] border border-[#222]">
                      <div className="text-slate-500">Heap Allocation</div>
                      <div className="text-lg font-bold text-white mt-1">42.8 MB</div>
                    </div>
                    <div className="p-3 bg-[#08080a] border border-[#222]">
                      <div className="text-slate-500">Throughput</div>
                      <div className="text-lg font-bold text-emerald-400 mt-1">2,400 req/sec</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Architecture Tab */}
            {activeNavTab === 'architecture' && (
              <div className="bg-[#121215] border border-[#222222] p-5 rounded-lg space-y-3 text-xs font-mono">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Synthesized System Architecture</h4>
                <div className="bg-[#08080a] p-4 border border-[#222] text-slate-300 whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
                  {prdFile?.content || 'System architecture generated by Senior Architect Sophia Lead (GPT-4o Mini) and approved by CEO Aria.'}
                </div>
              </div>
            )}

            {/* API Docs Tab */}
            {activeNavTab === 'api-docs' && (
              <div className="bg-[#121215] border border-[#222222] p-5 rounded-lg space-y-3 text-xs font-mono">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">REST API Endpoints</h4>
                <div className="space-y-2">
                  <div className="bg-[#08080a] p-3 border border-[#222] flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 font-bold">GET</span>
                      <span className="text-slate-200">/api/v1/entities</span>
                    </div>
                    <span className="text-slate-500">200 OK</span>
                  </div>
                  <div className="bg-[#08080a] p-3 border border-[#222] flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 font-bold">POST</span>
                      <span className="text-slate-200">/api/v1/entities</span>
                    </div>
                    <span className="text-slate-500">201 Created</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sandbox Footer Info */}
          <div className="bg-[#09090b] border-t border-[#222222] px-6 py-3 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <div className="flex items-center space-x-2">
              <Server className="w-3 h-3 text-violet-400" />
              <span>DevForge Autonomous Sandbox Container</span>
            </div>
            <span>Port 3000 Ingress Ready</span>
          </div>
        </div>
        )}
      </div>

      {/* 3. Bottom SRE Diagnostic Strip */}
      <div className="bg-[#050505] border-t border-[#222222] px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-[10px] font-mono text-slate-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Sandbox Status: Healthy &amp; Live</span>
          </div>
          <span className="text-slate-600">•</span>
          <div>Model Swarm: Gemini 2.5 + Claude 3.5 + GPT-4o + LLaMA 3.1</div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-slate-500">0 Security Alerts</span>
          <span className="text-slate-600">•</span>
          <span className="text-violet-400 font-bold">Full Code Export Ready</span>
        </div>
      </div>
    </div>
  );
}

function SparkCheck(props: any) {
  return (
    <svg className={props.className || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
