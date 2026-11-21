import React, { useEffect, useRef, useState } from 'react';
import {
  Terminal,
  Shield,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ArrowDown,
  ArrowUp,
  ToggleLeft,
  ToggleRight,
  Wrench,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { ExecutionRun, Project, ToolExecutionRecord } from '../types';

interface StreamLog {
  timestamp: string;
  agent: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  executionId?: string;
  toolName?: string;
}

interface StreamingPanelProps {
  logs: StreamLog[];
  projectStatus: string;
  executionRun?: ExecutionRun | null;
  project?: Project | null;
}

export default function StreamingPanel({
  logs,
  projectStatus,
  executionRun,
  project,
}: StreamingPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [viewMode, setViewMode] = useState<'logs' | 'tools'>('logs');
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});

  // Auto-scroll ONLY inside the terminal element, never scrolling the browser window
  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, executionRun?.toolExecutions?.length, autoScroll, viewMode]);

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

  const toggleToolExpand = (execId: string) => {
    setExpandedTools((prev) => ({ ...prev, [execId]: !prev[execId] }));
  };

  const logTypeColors = {
    info: 'text-sky-400',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    error: 'text-rose-400',
  };

  const toolStatusBadge: Record<string, string> = {
    pending: 'text-slate-400 border-slate-700 bg-slate-900',
    running: 'text-amber-300 border-amber-500/40 bg-amber-500/10 animate-pulse',
    awaiting_approval: 'text-orange-300 border-orange-500/40 bg-orange-500/10',
    approved: 'text-cyan-300 border-cyan-500/40 bg-cyan-500/10',
    rejected: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
    success: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
    failed: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
    cancelled: 'text-slate-400 border-slate-700 bg-slate-900',
  };

  const toolExecutions: ToolExecutionRecord[] = executionRun?.toolExecutions || [];
  const activeRun = executionRun || project?.lastExecutionRun || null;
  const securityAlertCount = project?.astAudit?.securityAlerts;
  const astPassed = project?.astAudit?.passed;
  const certHash = project?.deploymentCertificate?.certificateHash;

  return (
    <div className="bg-[#111111] border border-[#222222] p-6 shadow-xl space-y-4 text-slate-100" id="streaming-panel">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#222222] pb-4 gap-4">
        <div>
          <span className="label text-[9px] text-violet-400">Execution &amp; Tool Telemetry Stream</span>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2 mt-1">
            <Terminal className="w-4 h-4 text-violet-400" />
            <span>Orchestrator Event &amp; Tool Stream</span>
          </h2>
          <p className="text-[9px] text-slate-500 font-mono mt-1 uppercase tracking-widest">
            {activeRun
              ? `RUN ${activeRun.runId} • ${activeRun.metrics.completedTasks}/${activeRun.metrics.totalTasks} TASKS • ${activeRun.metrics.totalToolCalls} TOOL CALLS`
              : 'MONITORING MULTI-AGENT RUNTIME STREAM'}
          </p>
        </div>

        {/* Mode toggle, status chip & Scroll controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center border border-[#333333] bg-black text-[9px] font-mono">
            <button
              type="button"
              onClick={() => setViewMode('logs')}
              className={`px-2.5 py-1 uppercase font-bold transition ${
                viewMode === 'logs' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Event Logs ({logs.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tools')}
              className={`px-2.5 py-1 uppercase font-bold transition flex items-center gap-1 ${
                viewMode === 'tools' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wrench className="w-3 h-3" />
              <span>Tools ({toolExecutions.length})</span>
            </button>
          </div>

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

          {projectStatus === 'generating' || projectStatus === 'planning' || projectStatus === 'coding' || projectStatus === 'testing' ? (
            <div className="flex items-center space-x-2 bg-indigo-500/10 text-indigo-400 px-3 py-1.5 border border-indigo-500/20 text-[9px] font-mono uppercase tracking-widest font-black">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>PIPELINE ACTIVE ({projectStatus})</span>
            </div>
          ) : projectStatus === 'deployed' ? (
            <div className="flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 border border-emerald-500/20 text-[9px] font-mono uppercase tracking-widest font-black">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>VERIFIED &amp; DEPLOYED</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 bg-slate-900 text-slate-400 px-3 py-1.5 border border-slate-800 text-[9px] font-mono uppercase tracking-widest font-black">
              <Shield className="w-3.5 h-3.5" />
              <span>STATUS: {projectStatus?.toUpperCase() || 'IDLE'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Terminal View - Internal Scroll Only */}
      <div
        ref={terminalRef}
        className="bg-[#050505] border border-[#222222] p-5 h-72 overflow-y-auto font-mono text-xs space-y-2.5 shadow-inner leading-relaxed rounded-none select-text"
      >
        {viewMode === 'logs' ? (
          <>
            {logs.map((log, index) => (
              <div key={index} className="flex items-start space-x-2 border-b border-[#222222]/40 pb-2">
                <span className="text-slate-600 font-medium shrink-0">[{log.timestamp}]</span>
                <span className="text-indigo-400 font-bold min-w-[120px] uppercase tracking-wider shrink-0">
                  {log.agent}:
                </span>
                <span className={`flex-1 ${logTypeColors[log.type] || 'text-slate-300'}`}>
                  {log.message}
                  {log.toolName && (
                    <span className="ml-2 text-[9px] px-1.5 py-0.5 bg-violet-950/60 border border-violet-500/30 text-violet-300">
                      tool:{log.toolName}
                    </span>
                  )}
                </span>
              </div>
            ))}

            {logs.length === 0 && (
              <div className="text-slate-600 py-16 text-center uppercase tracking-wider">
                // Waiting for execution events from orchestrator...
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2">
            {toolExecutions.length === 0 ? (
              <div className="text-slate-600 py-16 text-center uppercase tracking-wider">
                // No tool invocations recorded for this run yet.
              </div>
            ) : (
              toolExecutions.map((rec) => {
                const isOpen = !!expandedTools[rec.executionId];
                return (
                  <div key={rec.executionId} className="border border-[#222226] bg-[#0b0b0e] p-2.5 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => toggleToolExpand(rec.executionId)}
                      className="w-full flex items-center justify-between text-left gap-2"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        {isOpen ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span className="text-violet-300 font-bold">{rec.toolName}</span>
                        <span className="text-[9px] text-slate-500">by {rec.agentName}</span>
                        {rec.subagentName && (
                          <span className="text-[9px] text-cyan-400">({rec.subagentName})</span>
                        )}
                        <span className={`text-[9px] px-1.5 py-0.2 border uppercase ${toolStatusBadge[rec.status] || toolStatusBadge.pending}`}>
                          {rec.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {rec.durationMs !== undefined ? `${rec.durationMs}ms` : 'running'}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="pt-2 border-t border-[#1e1e24] space-y-2 text-[10px]">
                        <div>
                          <div className="text-slate-500 uppercase text-[9px]">Input Arguments:</div>
                          <pre className="bg-black p-2 border border-[#1d1d22] text-slate-300 overflow-x-auto max-h-28">
                            {JSON.stringify(rec.inputArgs, null, 2)}
                          </pre>
                        </div>
                        {rec.stdout && (
                          <div>
                            <div className="text-emerald-400 uppercase text-[9px]">STDOUT:</div>
                            <pre className="bg-black p-2 border border-[#1d1d22] text-emerald-300 overflow-x-auto max-h-28">
                              {rec.stdout}
                            </pre>
                          </div>
                        )}
                        {rec.stderr && (
                          <div>
                            <div className="text-amber-400 uppercase text-[9px]">STDERR:</div>
                            <pre className="bg-black p-2 border border-[#1d1d22] text-amber-300 overflow-x-auto max-h-28">
                              {rec.stderr}
                            </pre>
                          </div>
                        )}
                        {rec.error && (
                          <div className="text-rose-400 bg-rose-950/20 border border-rose-500/30 p-2">
                            Error: {rec.error}
                          </div>
                        )}
                        {rec.output !== undefined && (
                          <div>
                            <div className="text-sky-400 uppercase text-[9px]">Output:</div>
                            <pre className="bg-black p-2 border border-[#1d1d22] text-slate-300 overflow-x-auto max-h-32">
                              {JSON.stringify(rec.output, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Real Execution & Audit Telemetry Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4 text-[10px] font-mono uppercase tracking-widest">
        <div className="bg-[#050505] border border-[#222222] p-3 rounded-none flex items-center space-x-3">
          <Shield className={`w-5 h-5 ${securityAlertCount && securityAlertCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
          <div>
            <div className="text-slate-500 text-[9px]">AST &amp; OWASP Audit</div>
            <div className="text-slate-200 font-black mt-0.5">
              {securityAlertCount !== undefined
                ? `${securityAlertCount} Alerts (${astPassed ? 'PASSED' : 'FLAGGED'})`
                : 'Awaiting AST Gate'}
            </div>
          </div>
        </div>
        <div className="bg-[#050505] border border-[#222222] p-3 rounded-none flex items-center space-x-3">
          <RefreshCw className="text-cyan-400 w-5 h-5" />
          <div>
            <div className="text-slate-500 text-[9px]">DAG Execution</div>
            <div className="text-slate-200 font-black mt-0.5">
              {activeRun
                ? `${activeRun.metrics.completedTasks}/${activeRun.metrics.totalTasks} Tasks • ${activeRun.metrics.succeededToolCalls}/${activeRun.metrics.totalToolCalls} Tools`
                : 'No Run Recorded'}
            </div>
          </div>
        </div>
        <div className="bg-[#050505] border border-[#222222] p-3 rounded-none flex items-center space-x-3">
          <AlertTriangle className="text-amber-400 w-5 h-5" />
          <div>
            <div className="text-slate-500 text-[9px]">Executive Certificate</div>
            <div className="text-slate-200 font-black mt-0.5 truncate max-w-[190px]">
              {certHash || 'Pending Final Gate'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
