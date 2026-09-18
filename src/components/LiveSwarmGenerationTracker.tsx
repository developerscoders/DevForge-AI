import React, { useState, useEffect, useRef } from 'react';
import { Project, Agent, AgentLog } from '../types';
import {
  Sparkles,
  Cpu,
  Terminal,
  FileCode,
  CheckCircle2,
  Clock,
  Loader2,
  Bot,
  Layers,
  ArrowRight,
  ShieldCheck,
  Server,
  Zap
} from 'lucide-react';

interface LiveSwarmGenerationTrackerProps {
  project: Project;
  progressPercentage?: number;
  activeAgent?: Agent;
  logs?: AgentLog[];
  onViewCode?: () => void;
  onViewSwarm?: () => void;
}

export default function LiveSwarmGenerationTracker({
  project,
  progressPercentage,
  activeAgent,
  logs = [],
  onViewCode,
  onViewSwarm
}: LiveSwarmGenerationTrackerProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Derive active agent from project if not passed directly
  const currentAgent =
    activeAgent ||
    project.agents?.find((a) => a.status === 'active' || a.status === 'thinking') ||
    project.agents?.[0];

  const completedCount = project.agents?.filter((a) => a.status === 'complete').length || 0;
  const totalAgents = project.agents?.length || 6;
  const calculatedPercent =
    progressPercentage !== undefined
      ? progressPercentage
      : Math.min(100, Math.round((completedCount / totalAgents) * 100));

  const allLogs = logs.length > 0 ? logs : (project.agents?.flatMap((a) => a.outputLogs) || []);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allLogs.length]);

  return (
    <div className="w-full min-h-[620px] bg-[#09090d] text-slate-100 p-4 md:p-8 flex flex-col justify-between font-sans">
      {/* Top Status Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
                <Cpu className="animate-pulse" size={18} />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
                  Autonomous Swarm Active
                </span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-400 font-mono">
                  Port 3000 Ingress
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
                Synthesizing {project.name || 'Application Workspace'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-mono text-slate-400">Swarm Progress</div>
              <div className="text-lg font-black font-mono text-emerald-400">
                {calculatedPercent}%
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-[#16161d] h-2.5 rounded-full overflow-hidden p-0.5 border border-white/5">
            <div
              className="bg-gradient-to-r from-violet-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out shadow-lg shadow-violet-500/20"
              style={{ width: `${Math.max(8, calculatedPercent)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>Stage: {currentAgent?.name || 'Aria CEO'} ({currentAgent?.role || 'Executive Directives'})</span>
            <span>{project.files?.length || 0} Files Written</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Agent + Pipeline + Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-6">
        {/* Left Column: Active Agent Card & Pipeline Stages */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Agent Spotlight */}
          <div className="bg-[#121218] border border-violet-500/30 rounded-2xl p-4 md:p-5 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-xs font-mono text-violet-400 mb-3">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <Bot size={14} /> Currently Executing
              </span>
              <span className="text-[10px] bg-violet-500/20 border border-violet-500/40 text-violet-300 px-2 py-0.5 rounded-full">
                {currentAgent?.tier || 'Lead'} Tier
              </span>
            </div>

            <div className="flex items-center gap-3.5 mb-3">
              <img
                src={currentAgent?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&fit=crop&q=60'}
                alt={currentAgent?.name || 'Agent'}
                className="w-12 h-12 rounded-xl object-cover border border-violet-400/40 shadow"
              />
              <div>
                <h3 className="text-base font-bold text-white">{currentAgent?.name || 'Swarm Lead'}</h3>
                <p className="text-xs text-slate-400">{currentAgent?.role || 'Autonomous Engineer'}</p>
                <span className="text-[10px] font-mono text-slate-500">{currentAgent?.model || 'Gemini 2.5 Flash'}</span>
              </div>
            </div>

            <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-3 flex items-start gap-2.5">
              <Loader2 size={15} className="animate-spin text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 font-mono leading-relaxed">
                {currentAgent?.currentTask || 'Deconstructing requirements into architectural contracts...'}
              </div>
            </div>
          </div>

          {/* Pipeline Agent Sequence */}
          <div className="bg-[#101015] border border-white/5 rounded-2xl p-4 space-y-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
              Multi-Agent Orchestration Sequence
            </span>
            <div className="space-y-1.5">
              {project.agents?.map((agent, idx) => {
                const isComplete = agent.status === 'complete';
                const isActive = agent.status === 'active' || agent.status === 'thinking';
                return (
                  <div
                    key={agent.id || idx}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition border ${
                      isActive
                        ? 'bg-violet-950/30 border-violet-500/40 text-white'
                        : isComplete
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                        : 'bg-[#15151c]/60 border-white/5 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isComplete ? (
                        <CheckCircle2 size={14} className="text-emerald-400" />
                      ) : isActive ? (
                        <Loader2 size={14} className="animate-spin text-violet-400" />
                      ) : (
                        <Clock size={14} className="text-slate-500" />
                      )}
                      <span className="font-semibold">{agent.name}</span>
                      <span className="text-[10px] text-slate-500">({agent.role.split(' ')[0]})</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider">
                      {isComplete ? 'Complete' : isActive ? 'Working' : 'Queued'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Terminal Stream & Files */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Live Terminal Stream */}
          <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl p-4 flex-1 flex flex-col min-h-[320px] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-emerald-400" />
                <span>Live Swarm Telemetry & Code Generation Stream</span>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">
                LIVE
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-[11px] max-h-[320px]">
              {allLogs.length === 0 ? (
                <div className="text-slate-500 italic py-8 text-center">
                  Swarm agents initializing work orders...
                </div>
              ) : (
                allLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2.5 leading-relaxed">
                    <span className="text-slate-500 text-[10px] shrink-0 mt-0.5">{log.timestamp}</span>
                    <span className="text-violet-400 font-bold shrink-0">
                      [{(log as any).agent || (log as any).agentId || 'Swarm Engine'}]
                    </span>
                    <span
                      className={
                        log.type === 'success'
                          ? 'text-emerald-300'
                          : log.type === 'warning'
                          ? 'text-amber-300'
                          : log.type === 'error'
                          ? 'text-rose-400'
                          : 'text-slate-200'
                      }
                    >
                      {log.message}
                    </span>
                  </div>
                ))
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>

          {/* Live Generated Files Badge Bar */}
          {project.files && project.files.length > 0 && (
            <div className="bg-[#121218] border border-white/10 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono flex items-center gap-1.5 font-bold">
                  <FileCode size={14} className="text-violet-400" />
                  Synthesized Files ({project.files.length})
                </span>
                {onViewCode && (
                  <button
                    onClick={onViewCode}
                    className="text-xs text-violet-400 hover:text-violet-300 font-bold flex items-center gap-1"
                  >
                    View Code <ArrowRight size={12} />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {project.files.slice(0, 8).map((f) => (
                  <span
                    key={f.path}
                    className="text-[10px] font-mono bg-white/5 border border-white/10 text-slate-300 px-2 py-0.5 rounded-lg flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {f.path}
                  </span>
                ))}
                {project.files.length > 8 && (
                  <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5">
                    +{project.files.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer Notice */}
      <div className="border-t border-white/10 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-amber-400" />
          <span>Interactive Preview will mount automatically once deployment verification passes.</span>
        </div>
        <div className="flex items-center gap-2">
          {onViewSwarm && (
            <button
              onClick={onViewSwarm}
              className="bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-xl transition"
            >
              Swarm Graph View
            </button>
          )}
          {onViewCode && (
            <button
              onClick={onViewCode}
              className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-3 py-1.5 rounded-xl transition"
            >
              Inspect Source Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
