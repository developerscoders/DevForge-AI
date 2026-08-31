import React, { useState } from 'react';
import { Agent, SubAgent } from '../types';
import {
  Bot,
  Play,
  CheckCircle,
  Clock,
  Terminal,
  ChevronRight,
  ChevronDown,
  Activity,
  Cpu,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Award,
  Layers,
  ArrowRight,
  Wrench,
  CheckCircle2,
  Users,
  Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AgentOrchestrationGraphProps {
  agents: Agent[];
  projectId?: string;
  onRefresh?: () => void;
}

export default function AgentOrchestrationGraph({ agents, projectId, onRefresh }: AgentOrchestrationGraphProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(agents[0]?.id || null);
  const [expandedAgents, setExpandedAgents] = useState<Record<string, boolean>>({
    ag_pm: true,
    ag_arch: true,
    ag_fe: true,
    ag_qa: true,
    ag_sre: true
  });
  const [isHealingLoading, setIsHealingLoading] = useState(false);
  const [healingAlert, setHealingAlert] = useState<string | null>(null);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);
  const ceoAgent = agents.find((a) => a.tier === 'ceo') || agents[0];
  const seniorAgents = agents.filter((a) => a.tier === 'senior' || a.id !== ceoAgent?.id);

  const toggleExpand = (agentId: string) => {
    setExpandedAgents((prev) => ({ ...prev, [agentId]: !prev[agentId] }));
  };

  const statusIcons: Record<string, any> = {
    idle: Clock,
    thinking: Activity,
    active: Play,
    healing: RefreshCw,
    failed: AlertTriangle,
    complete: CheckCircle,
  };

  const statusColors: Record<string, string> = {
    idle: 'bg-slate-900 text-slate-500 border-slate-800',
    thinking: 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse',
    active: 'bg-violet-500/15 text-violet-400 border-violet-500/30 animate-pulse',
    healing: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse',
    failed: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    complete: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  };

  const providerBadges: Record<string, { label: string; bg: string; text: string; border: string }> = {
    gemini: { label: 'Google Gemini', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    openrouter: { label: 'OpenRouter', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    nvidia: { label: 'NVIDIA NIM', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    groq: { label: 'Groq Free Tier', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  };

  // Trigger interactive self-healing simulation
  const handleTriggerSelfHealing = async () => {
    if (!projectId) {
      setHealingAlert('Simulated self-healing active for demo.');
      setTimeout(() => setHealingAlert(null), 4000);
      return;
    }
    try {
      setIsHealingLoading(true);
      setHealingAlert('Simulating subagent failure... CEO & Senior Lead intervening.');
      const res = await fetch(`/api/projects/${projectId}/trigger-healing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setHealingAlert('Cross-Agent Self-Healing Verified: Subagent instructed, patched & validated by CEO Aria!');
        if (onRefresh) onRefresh();
      }
    } catch (e: any) {
      setHealingAlert(`Self-healing trigger error: ${e.message}`);
    } finally {
      setIsHealingLoading(false);
      setTimeout(() => setHealingAlert(null), 6000);
    }
  };

  return (
    <div className="space-y-6 text-slate-100" id="agent-orchestration-graph">
      
      {/* Top Banner: Swarm Status & Self-Healing Action Bar */}
      <div className="bg-[#111111] border border-[#222222] p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-violet-500/10 border border-violet-500/20">
            <Layers className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                Hierarchical Multi-Agent Swarm (6 Agents + Subagent Pods)
              </h2>
              <span className="text-[9px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest font-bold">
                CEO VALIDATED
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              CEO Orchestrator delegates to 5 Senior Leads across Gemini, OpenRouter, NVIDIA, and Groq.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleTriggerSelfHealing}
            disabled={isHealingLoading}
            className="flex items-center space-x-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 transition duration-200 shadow-md disabled:opacity-50"
            id="btn-trigger-healing"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isHealingLoading ? 'animate-spin' : ''}`} />
            <span>{isHealingLoading ? 'Intervening...' : 'Simulate Failure & Self-Heal'}</span>
          </button>
        </div>
      </div>

      {/* Swarm Execution Milestones Stepper */}
      <div className="bg-[#0b0b0d] border border-[#222222] p-4 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px] gap-2">
          {[
            { step: '01', title: 'Strategic PRD', lead: 'Parker Lead', model: 'Claude 3.5', icon: CheckCircle2, status: 'complete' },
            { step: '02', title: 'Architecture', lead: 'Sophia Lead', model: 'GPT-4o Mini', icon: CheckCircle2, status: 'complete' },
            { step: '03', title: 'React Synthesizer', lead: 'Frank Lead', model: 'LLaMA 3.1 70B', icon: CheckCircle2, status: 'complete' },
            { step: '04', title: 'CEO Cross-Heal', lead: 'Aria CEO', model: 'Gemini 2.5', icon: Sparkles, status: 'complete' },
            { step: '05', title: 'QA & Security', lead: 'Quinn Lead', model: 'LLaMA 3.3 70B', icon: ShieldCheck, status: 'complete' },
            { step: '06', title: 'SRE Docker Ingress', lead: 'Devon Lead', model: 'Mixtral 8x7B', icon: Server, status: 'complete' },
          ].map((m, idx) => {
            const Icon = m.icon;
            return (
              <div key={idx} className="flex-1 flex items-center">
                <div className="bg-[#141416] border border-violet-500/30 hover:border-violet-500 p-2.5 rounded flex-1 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-violet-400 font-bold">M-{m.step}</span>
                    <Icon className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div className="text-[11px] font-bold text-slate-200 uppercase tracking-wide mt-1 truncate">{m.title}</div>
                  <div className="text-[9px] font-mono text-slate-400 mt-0.5 flex items-center justify-between">
                    <span>{m.lead}</span>
                    <span className="text-indigo-300 text-[8px]">{m.model}</span>
                  </div>
                </div>
                {idx < 5 && (
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 mx-1 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {healingAlert && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-indigo-950/80 border border-indigo-500/40 text-xs font-mono text-indigo-200 flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-violet-400 animate-spin" />
            <span>{healingAlert}</span>
          </div>
          <button onClick={() => setHealingAlert(null)} className="text-slate-400 hover:text-white text-[10px] uppercase tracking-wider">
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Main Grid: LEFT Tier Structure | RIGHT Agent Inspector */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* LEFT (7 Cols): Hierarchy Swarm Tree */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* TIER 1: Executive CEO Agent Card */}
          {ceoAgent && (
            <div
              onClick={() => setSelectedAgentId(ceoAgent.id)}
              className={`border p-4 transition duration-200 cursor-pointer ${
                selectedAgentId === ceoAgent.id
                  ? 'bg-[#1c1a24] border-violet-500 shadow-2xl'
                  : 'bg-[#111111] border-violet-500/30 hover:border-violet-500/60'
              }`}
              id="ceo-agent-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="relative">
                    <img
                      src={ceoAgent.avatar}
                      alt={ceoAgent.name}
                      className="w-12 h-12 object-cover border border-violet-500/50"
                    />
                    <div className="absolute -top-1.5 -right-1.5 p-0.5 bg-amber-400 text-black shadow">
                      <Award className="w-3 h-3" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm text-slate-100 uppercase tracking-wider">{ceoAgent.name}</span>
                      <span className="text-[9px] font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40 px-2 py-0.5 uppercase tracking-wider">
                        Executive CEO Lead
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center space-x-2">
                      <span className="text-blue-400">{ceoAgent.provider ? providerBadges[ceoAgent.provider]?.label || ceoAgent.provider : 'Google Gemini'}</span>
                      <span>•</span>
                      <span>{ceoAgent.model}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[9px] font-mono font-bold px-2 py-1 uppercase tracking-wider border ${statusColors[ceoAgent.status || 'complete']}`}>
                    {ceoAgent.status || 'complete'}
                  </span>
                  <div className="text-[9px] text-emerald-400 font-mono mt-1 font-bold">
                    ✓ Validated All Milestones
                  </div>
                </div>
              </div>

              {/* CEO Directives Snippet */}
              <div className="mt-3 pt-3 border-t border-[#222222] bg-[#080808] p-2.5 font-mono text-[10px] text-slate-400 flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-violet-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CEO Protocol: Autonomous task delegation with real-time error intervention</span>
                </div>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider">Tier 1 Executive</span>
              </div>
            </div>
          )}

          {/* Connection Line from CEO to Senior Leads */}
          <div className="flex items-center justify-center">
            <div className="h-4 w-[1px] bg-violet-500/40"></div>
          </div>

          {/* TIER 2: Senior Leads & Subagent Clusters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                Senior Leads & Subagent Pods (5 Leads)
              </span>
              <span className="text-[9px] font-mono text-slate-500 uppercase">Multi-Model Routing</span>
            </div>

            {seniorAgents.map((agent) => {
              const isSelected = agent.id === selectedAgentId;
              const isExpanded = !!expandedAgents[agent.id];
              const Icon = statusIcons[agent.status] || Bot;
              const prov = providerBadges[agent.provider || 'gemini'] || { label: 'Multi-LLM', bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' };

              return (
                <div
                  key={agent.id}
                  className={`border transition duration-200 ${
                    isSelected ? 'bg-[#181818] border-violet-500 shadow-lg' : 'bg-[#0e0e0e] border-[#222222] hover:border-[#333333]'
                  }`}
                  id={`agent-senior-${agent.id}`}
                >
                  {/* Senior Agent Header */}
                  <div
                    onClick={() => setSelectedAgentId(agent.id)}
                    className="p-3.5 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={agent.avatar}
                          alt={agent.name}
                          className="w-10 h-10 object-cover border border-[#222222]"
                        />
                        <div className={`absolute -bottom-1 -right-1 p-0.5 border text-[8px] ${statusColors[agent.status]}`}>
                          <Icon className="w-2.5 h-2.5" />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-slate-200 uppercase tracking-wider">{agent.name}</span>
                          <span className="text-[9px] font-mono text-slate-400 bg-[#151515] border border-[#222222] px-1.5 py-0.5">
                            {agent.role}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center space-x-2">
                          <span className={`px-1.5 py-0.2 border text-[8px] font-bold ${prov.bg} ${prov.text} ${prov.border}`}>
                            {prov.label}
                          </span>
                          <span className="text-[9px] text-slate-400">{agent.model}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 uppercase tracking-wider border ${statusColors[agent.status]}`}>
                        {agent.status}
                      </span>
                      
                      {agent.subagents && agent.subagents.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(agent.id);
                          }}
                          className="p-1 text-slate-400 hover:text-white bg-[#151515] border border-[#222222]"
                        >
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable Subagent Pods */}
                  {agent.subagents && agent.subagents.length > 0 && isExpanded && (
                    <div className="px-3.5 pb-3 pt-1 border-t border-[#1a1a1a] bg-[#070707] space-y-2">
                      <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider flex items-center space-x-1.5 mb-1.5">
                        <Users className="w-3 h-3 text-slate-500" />
                        <span>Subagent Pods ({agent.subagents.length})</span>
                      </div>

                      <div className="grid gap-2">
                        {agent.subagents.map((sub) => {
                          const SubIcon = statusIcons[sub.status] || Bot;
                          return (
                            <div
                              key={sub.id}
                              className="bg-[#0f0f0f] border border-[#222222] p-2.5 flex items-start justify-between text-xs"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-[11px] text-slate-200">{sub.name}</span>
                                  <span className="text-[8px] font-mono text-slate-400 bg-[#181818] border border-[#262626] px-1 py-0.2">
                                    {sub.role}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  Task: {sub.task}
                                </div>
                                {sub.instructionsReceived && sub.instructionsReceived.length > 0 && (
                                  <div className="text-[9px] font-mono text-violet-300 bg-violet-950/30 border border-violet-500/20 p-1 mt-1">
                                    <span className="font-bold text-violet-400">Lead Directive:</span> {sub.instructionsReceived[sub.instructionsReceived.length - 1]}
                                  </div>
                                )}
                                {sub.healingSummary && (
                                  <div className="text-[9px] font-mono text-cyan-300 bg-cyan-950/30 border border-cyan-500/20 p-1 mt-1 flex items-center space-x-1">
                                    <Wrench className="w-3 h-3 text-cyan-400" />
                                    <span>{sub.healingSummary}</span>
                                  </div>
                                )}
                              </div>

                              <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 uppercase border ${statusColors[sub.status]}`}>
                                {sub.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT (5 Cols): Agent Inspector & Self-Healing Terminal */}
        <div className="lg:col-span-5 bg-[#111111] border border-[#222222] p-6 shadow-xl flex flex-col justify-between min-h-[480px]">
          {selectedAgent ? (
            <div className="space-y-4 flex flex-col justify-between h-full" id={`agent-inspector-${selectedAgent.id}`}>
              <div>
                {/* Header */}
                <div className="flex items-center space-x-4 pb-4 border-b border-[#222222]">
                  <img
                    src={selectedAgent.avatar}
                    alt={selectedAgent.name}
                    className="w-14 h-14 object-cover border border-[#222222]"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-extrabold text-slate-100 uppercase tracking-wider text-sm">{selectedAgent.name}</h3>
                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 uppercase border ${statusColors[selectedAgent.status]}`}>
                        {selectedAgent.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-0.5">{selectedAgent.role}</div>
                    <div className="text-[9px] text-indigo-400 font-mono mt-0.5 uppercase tracking-widest">
                      {selectedAgent.model}
                    </div>
                  </div>
                </div>

                {/* CEO Directives if applicable */}
                {selectedAgent.ceoDirectives && selectedAgent.ceoDirectives.length > 0 && (
                  <div className="mt-3 bg-[#080808] border border-violet-500/20 p-3 space-y-1 font-mono text-[10px]">
                    <div className="text-violet-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                      <Award className="w-3 h-3" />
                      <span>Executive Directives:</span>
                    </div>
                    <ul className="space-y-1 text-slate-300">
                      {selectedAgent.ceoDirectives.map((d, i) => (
                        <li key={i} className="flex items-start space-x-1.5">
                          <span className="text-violet-500 font-bold">•</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Log stream Console */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <Terminal className="w-3.5 h-3.5 text-violet-400" />
                      <span>Swarm Logs & Directives</span>
                    </div>
                    <span className="text-slate-500">{selectedAgent.outputLogs.length} Entries</span>
                  </div>

                  <div className="bg-[#050505] p-3.5 border border-[#222222] font-mono text-xs h-[230px] overflow-y-auto space-y-2.5 shadow-inner">
                    {selectedAgent.outputLogs.length === 0 ? (
                      <div className="text-slate-600 text-center py-16 uppercase tracking-wider text-[11px]">
                        // Standing by for CEO delegation stream...
                      </div>
                    ) : (
                      selectedAgent.outputLogs.map((log, idx) => {
                        const logTypeColors = {
                          info: 'text-sky-400',
                          success: 'text-emerald-400',
                          warning: 'text-amber-400',
                          error: 'text-rose-400',
                        };

                        return (
                          <div key={idx} className="leading-relaxed border-b border-[#222222]/40 pb-1.5 text-[11px]">
                            <span className="text-slate-600">[{log.timestamp}]</span>{' '}
                            <span className={logTypeColors[log.type] || 'text-slate-300'}>{log.message}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Inspector Footer */}
              <div className="text-[10px] font-mono text-slate-500 pt-3 border-t border-[#222222] flex justify-between uppercase tracking-wider">
                <span className="text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Self-Healing Engine Ready</span>
                </span>
                <span>Port 3000 Ingress Active</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 py-24 font-mono text-xs uppercase tracking-wider">
              <span>Select an agent to inspect its directives</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

