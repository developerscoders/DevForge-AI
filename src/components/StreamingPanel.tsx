import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Shield, RefreshCw, AlertTriangle, CheckCircle, ArrowDown, ArrowUp, ToggleLeft, ToggleRight } from 'lucide-react';

interface StreamLog {
  timestamp: string;
  agent: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface StreamingPanelProps {
  logs: StreamLog[];
  projectStatus: string;
}

export default function StreamingPanel({ logs, projectStatus }: StreamingPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll ONLY inside the terminal element, never scrolling the browser window
  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const scrollToTop = () => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = 0;
    }
  };

  const scrollToBottom = () => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  };

  const logTypeColors = {
    info: 'text-sky-400',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    error: 'text-rose-400',
  };

  return (
    <div className="bg-[#111111] border border-[#222222] p-6 shadow-xl space-y-4 text-slate-100" id="streaming-panel">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#222222] pb-4 gap-4">
        <div>
          <span className="label text-[9px] text-violet-400">VM Log Streamer</span>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2 mt-1">
            <Terminal className="w-4 h-4 text-violet-400" />
            <span>SRE Ingress &amp; Container Stream</span>
          </h2>
          <p className="text-[9px] text-slate-500 font-mono mt-1 uppercase tracking-widest">MONITORING VM CONTAINER COMPILATION PROCESS</p>
        </div>

        {/* Current status chip & Scroll controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Auto Scroll Toggle */}
          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider border transition ${
              autoScroll
                ? 'bg-violet-950/40 text-violet-300 border-violet-700/40'
                : 'bg-black text-slate-500 border-[#333333] hover:text-slate-300'
            }`}
            title="Toggle terminal internal auto-scroll"
          >
            {autoScroll ? <ToggleRight className="w-3.5 h-3.5 text-violet-400" /> : <ToggleLeft className="w-3.5 h-3.5" />}
            <span>Auto-Scroll: {autoScroll ? 'ON' : 'OFF'}</span>
          </button>

          {/* Scroll Top / Bottom buttons */}
          <div className="flex items-center border border-[#333333] bg-black">
            <button
              type="button"
              onClick={scrollToTop}
              title="Scroll terminal to top"
              className="p-1 text-slate-400 hover:text-white border-r border-[#333333] transition"
            >
              <ArrowUp className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={scrollToBottom}
              title="Scroll terminal to bottom"
              className="p-1 text-slate-400 hover:text-white transition"
            >
              <ArrowDown className="w-3 h-3" />
            </button>
          </div>

          {projectStatus === 'planning' || projectStatus === 'coding' || projectStatus === 'testing' ? (
            <div className="flex items-center space-x-2 bg-indigo-500/10 text-indigo-400 px-3 py-1.5 border border-indigo-500/20 text-[9px] font-mono uppercase tracking-widest font-black">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>VM PIPELINE ACTIVE ({projectStatus})</span>
            </div>
          ) : projectStatus === 'deployed' ? (
            <div className="flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 border border-emerald-500/20 text-[9px] font-mono uppercase tracking-widest font-black">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>SANDBOX HEALTHY &amp; LIVE</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 bg-slate-900 text-slate-400 px-3 py-1.5 border border-slate-800 text-[9px] font-mono uppercase tracking-widest font-black">
              <Shield className="w-3.5 h-3.5" />
              <span>VM CONTAINER STANDBY ({projectStatus})</span>
            </div>
          )}
        </div>
      </div>

      {/* Terminal View - Internal Scroll Only */}
      <div
        ref={terminalRef}
        className="bg-[#050505] border border-[#222222] p-5 h-72 overflow-y-auto font-mono text-xs space-y-2.5 shadow-inner leading-relaxed rounded-none select-text"
      >
        {/* Boot Logs */}
        <div className="text-slate-500">// Bootstrapping secure sandbox, container isolation layer active...</div>
        <div className="text-slate-500">// Environment specifications loaded: NodeJS VM runtime verified.</div>

        {logs.map((log, index) => (
          <div key={index} className="flex items-start space-x-2 border-b border-[#222222]/40 pb-2">
            <span className="text-slate-600 font-medium">[{log.timestamp}]</span>
            <span className="text-indigo-400 font-bold min-w-[120px] uppercase tracking-wider">{log.agent}:</span>
            <span className={`flex-1 ${logTypeColors[log.type] || 'text-slate-300'}`}>
              {log.message}
            </span>
          </div>
        ))}

        {logs.length === 0 && (
          <div className="text-slate-600 py-16 text-center uppercase tracking-wider">
            // No compilation logs streamed. Standard environment idling.
          </div>
        )}
      </div>

      {/* SRE Compliance panel */}
      <div className="grid sm:grid-cols-3 gap-4 text-[10px] font-mono uppercase tracking-widest">
        <div className="bg-[#050505] border border-[#222222] p-3 rounded-none flex items-center space-x-3">
          <Shield className="text-emerald-400 w-5 h-5" />
          <div>
            <div className="text-slate-500 text-[9px]">Vulnerability Scan</div>
            <div className="text-slate-200 font-black mt-0.5">0 CVEs Found</div>
          </div>
        </div>
        <div className="bg-[#050505] border border-[#222222] p-3 rounded-none flex items-center space-x-3">
          <RefreshCw className="text-cyan-400 w-5 h-5" />
          <div>
            <div className="text-slate-500 text-[9px]">Kubernetes Cluster</div>
            <div className="text-slate-200 font-black mt-0.5">1 Pod Replica</div>
          </div>
        </div>
        <div className="bg-[#050505] border border-[#222222] p-3 rounded-none flex items-center space-x-3">
          <AlertTriangle className="text-amber-400 w-5 h-5" />
          <div>
            <div className="text-slate-500 text-[9px]">Integrity Check</div>
            <div className="text-slate-200 font-black mt-0.5">SHA-256 Verified</div>
          </div>
        </div>
      </div>
    </div>
  );
}
