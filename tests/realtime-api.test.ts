// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Express } from 'express';

describe('Real-Time Execution API, Persistence & SSE Replay', () => {
  let tmpDir: string;
  let originalDataDir: string | undefined;
  let originalKeys: Record<string, string | undefined> = {};
  let server: http.Server;
  let baseUrl: string;
  let executionStoreRef: any;

  beforeAll(async () => {
    originalDataDir = process.env.DEVFORGE_DATA_DIR;
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devforge-api-test-'));
    process.env.DEVFORGE_DATA_DIR = tmpDir;
    process.env.DEVFORGE_NO_AUTOSTART = '1';

    for (const k of ['GEMINI_API_KEY', 'OPENROUTER_API_KEY', 'NVIDIA_API_KEY', 'GROQ_API_KEY']) {
      originalKeys[k] = process.env[k];
      delete process.env[k];
    }

    const storeMod = await import('../src/lib/orchestrator/executionStore.js');
    executionStoreRef = storeMod.executionStore;
    executionStoreRef.resetForTests();

    const serverMod = await import('../server.js');
    const app: Express = serverMod.app;

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as { port: number };
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    for (const [k, v] of Object.entries(originalKeys)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    if (originalDataDir === undefined) delete process.env.DEVFORGE_DATA_DIR;
    else process.env.DEVFORGE_DATA_DIR = originalDataDir;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('lists all registered system tools and their real availability states', async () => {
    const res = await fetch(`${baseUrl}/api/system/tools`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.tools)).toBe(true);
    expect(data.tools.length).toBeGreaterThanOrEqual(25);
    expect(data.tools.some((t: any) => t.name === 'run_typecheck' && t.available)).toBe(true);
  });

  it('creates a project, executes multi-agent DAG to completion, streams SSE events & supports replay', async () => {
    const createRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Realtime Ledger',
        prompt: 'Create a real-time SaaS expense tracker with React, TypeScript, and billing metrics',
      }),
    });
    expect(createRes.status).toBe(200);
    const created = await createRes.json();
    expect(created.id).toBeTruthy();
    expect(created.activeRunId).toBeTruthy();

    // Poll /api/projects/:id/execution until completed
    let execPayload: any = null;
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
      const r = await fetch(`${baseUrl}/api/projects/${created.id}/execution`);
      expect(r.status).toBe(200);
      execPayload = await r.json();
      if (execPayload.run?.status === 'completed' || execPayload.run?.status === 'failed') {
        break;
      }
      await new Promise((r) => setTimeout(r, 80));
    }

    expect(execPayload.run.status).toBe('completed');
    expect(execPayload.run.tasks).toHaveLength(9);
    expect(execPayload.events.length).toBeGreaterThan(10);

    // Check /api/projects/:id/tools endpoint returns persisted tool execution records
    const toolsRes = await fetch(`${baseUrl}/api/projects/${created.id}/tools`);
    expect(toolsRes.status).toBe(200);
    const toolsData = await toolsRes.json();
    expect(toolsData.total).toBeGreaterThanOrEqual(8);
    expect(toolsData.toolExecutions.every((t: any) => typeof t.executionId === 'string')).toBe(true);

    // Check SSE replay from seq=5 returns only events with seq > 5 in monotonic order
    const abortCtrl = new AbortController();
    const sseRes = await fetch(`${baseUrl}/api/projects/${created.id}/events?sinceSeq=5`, {
      signal: abortCtrl.signal,
    });
    expect(sseRes.status).toBe(200);
    expect(sseRes.headers.get('content-type')).toContain('text/event-stream');

    const reader = sseRes.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const startRead = Date.now();
    while (Date.now() - startRead < 1500) {
      const { value, done } = await Promise.race([
        reader.read(),
        new Promise<{ value: undefined; done: true }>((res) =>
          setTimeout(() => res({ value: undefined, done: true }), 350)
        ),
      ]);
      if (value) buffer += decoder.decode(value, { stream: true });
      if (done) break;
    }
    abortCtrl.abort();

    const parsedSeqs = [...buffer.matchAll(/^id:\s*(\d+)/gm)].map((m) => Number(m[1]));
    expect(parsedSeqs.length).toBeGreaterThan(0);
    expect(Math.min(...parsedSeqs)).toBeGreaterThan(5);
    for (let i = 1; i < parsedSeqs.length; i++) {
      expect(parsedSeqs[i]).toBeGreaterThan(parsedSeqs[i - 1]);
    }

    // Trigger real diagnostic self-healing endpoint
    const healRes = await fetch(`${baseUrl}/api/projects/${created.id}/trigger-healing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnosticHint: 'Verify AST & coverage post-build' }),
    });
    expect(healRes.status).toBe(200);
    const healData = await healRes.json();
    expect(healData.success).toBe(true);
    expect(healData.run.triggeredBy).toBe('self_heal');
  });
});
