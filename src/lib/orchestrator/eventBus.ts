import { ExecutionEvent, ExecutionEventType } from '../../types.js';
import { executionStore } from './executionStore.js';
import { redactSecrets } from '../security/executionSecurity.js';

export type EventSubscriber = (event: ExecutionEvent) => void;

class OrchestratorEventBus {
  private subscribers = new Map<string, Set<EventSubscriber>>();

  public emit(
    projectId: string,
    runId: string,
    type: ExecutionEventType,
    data: Record<string, any>,
    refs: { agentId?: string; subagentId?: string; taskId?: string; executionId?: string } = {}
  ): ExecutionEvent {
    const event = executionStore.appendEvent(projectId, {
      runId,
      projectId,
      timestamp: new Date().toISOString(),
      type,
      agentId: refs.agentId,
      subagentId: refs.subagentId,
      taskId: refs.taskId,
      executionId: refs.executionId,
      data,
    });

    const subs = this.subscribers.get(projectId);
    if (subs) {
      for (const cb of subs) {
        try {
          cb(event);
        } catch (err) {
          console.warn('[EventBus] Subscriber delivery error:', err);
        }
      }
    }

    return event;
  }

  public subscribe(
    projectId: string,
    subscriber: EventSubscriber,
    sinceSeq?: number
  ): () => void {
    if (!this.subscribers.has(projectId)) {
      this.subscribers.set(projectId, new Set());
    }
    this.subscribers.get(projectId)!.add(subscriber);

    // Replay ordered history after sinceSeq when reconnecting
    if (typeof sinceSeq === 'number' && sinceSeq >= 0) {
      const missed = executionStore.getEvents(projectId, sinceSeq);
      for (const evt of missed) {
        try {
          subscriber(evt);
        } catch (err) {
          console.warn('[EventBus] Replay error:', err);
        }
      }
    }

    return () => {
      const subs = this.subscribers.get(projectId);
      if (!subs) return;
      subs.delete(subscriber);
      if (subs.size === 0) {
        this.subscribers.delete(projectId);
      }
    };
  }

  public formatStreamLog(event: ExecutionEvent): {
    id: string;
    timestamp: string;
    agent: string;
    agentId?: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    executionId?: string;
    toolName?: string;
  } | null {
    const timeStr = new Date(event.timestamp).toLocaleTimeString();
    const d = event.data || {};
    const agentLabel = d.agentName || d.subagentName || event.agentId || 'Aria CEO';

    switch (event.type) {
      case 'run:started':
        return {
          id: event.eventId,
          timestamp: timeStr,
          agent: 'Aria CEO',
          message: `Execution Run ${event.runId} started (${d.triggeredBy || 'create'}) — ${d.totalTasks || 0} DAG tasks scheduled.`,
          type: 'info',
        };
      case 'run:completed':
        return {
          id: event.eventId,
          timestamp: timeStr,
          agent: 'Aria CEO',
          message: `Execution Run ${event.runId} completed in ${d.durationMs || 0}ms (${d.totalToolCalls || 0} tool calls verified).`,
          type: 'success',
        };
      case 'run:failed':
        return {
          id: event.eventId,
          timestamp: timeStr,
          agent: 'Aria CEO',
          message: redactSecrets(`Execution Run ${event.runId} failed: ${d.error || 'Unknown failure'}`),
          type: 'error',
        };
      case 'run:cancelled':
        return {
          id: event.eventId,
          timestamp: timeStr,
          agent: 'Aria CEO',
          message: `Execution Run ${event.runId} cancelled: ${d.reason || 'User cancelled execution'}.`,
          type: 'warning',
        };
      case 'subagent:created':
        return {
          id: event.eventId,
          timestamp: timeStr,
          agent: agentLabel,
          agentId: event.agentId,
          message: `Spawned dynamic subagent "${d.subagent?.name}" (${d.subagent?.role}) for task: ${d.subagent?.task}`,
          type: 'info',
        };
      case 'agent:message':
        return {
          id: event.eventId,
          timestamp: timeStr,
          agent: d.fromAgentName || agentLabel,
          agentId: event.agentId,
          message: `[-> ${d.toAgentName}] ${redactSecrets(String(d.summary || ''))}`,
          type: d.messageType === 'self_heal' ? 'warning' : 'info',
        };
      case 'tool:pending':
        return {
          id: event.eventId,
          timestamp: timeStr,
          agent: agentLabel,
          agentId: event.agentId,
          executionId: event.executionId,
          toolName: d.toolName,
          message: `Tool queued: ${d.toolName} (${d.category})`,
          type: 'info',
        };
      case 'tool:running':
        return {
          id: event.eventId,
          timestamp: timeStr,
          agent: agentLabel,
          agentId: event.agentId,
          executionId: event.executionId,
          toolName: d.toolName,
          message: `Executing tool: ${d.toolName}...`,
          type: 'info',
        };
      case 'tool:completed':
        return {
          id: event.eventId,
          timestamp: timeStr,
          agent: agentLabel,
          agentId: event.agentId,
          executionId: event.executionId,
          toolName: d.toolName,
          message: `Tool succeeded: ${d.toolName} (${d.durationMs ?? 0}ms)`,
          type: 'success',
        };
      case 'tool:failed':
        return {
          id: event.eventId,
          timestamp: timeStr,
          agent: agentLabel,
          agentId: event.agentId,
          executionId: event.executionId,
          toolName: d.toolName,
          message: redactSecrets(`Tool failed: ${d.toolName} — ${d.error || 'Error'}`),
          type: 'error',
        };
      case 'approval:requested':
        return {
          id: event.eventId,
          timestamp: timeStr,
          agent: agentLabel,
          agentId: event.agentId,
          executionId: event.executionId,
          toolName: d.toolName,
          message: `Approval Required (${d.riskLevel?.toUpperCase() || 'HIGH'}): ${d.summary}`,
          type: 'warning',
        };
      case 'approval:resolved':
        return {
          id: event.eventId,
          timestamp: timeStr,
          agent: 'Security Gate',
          executionId: event.executionId,
          toolName: d.toolName,
          message: `Approval ${d.status?.toUpperCase()}: ${d.toolName}${d.resolvedBy ? ` by ${d.resolvedBy}` : ''}`,
          type: d.status === 'approved' ? 'success' : 'error',
        };
      case 'log:info':
        return {
          id: event.eventId,
          timestamp: timeStr,
          agent: agentLabel,
          agentId: event.agentId,
          message: redactSecrets(String(d.message || '')),
          type: d.level || 'info',
        };
      default:
        return null;
    }
  }
}

export const eventBus = new OrchestratorEventBus();
