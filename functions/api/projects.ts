// Cloudflare Pages Function for /api/projects
// Handles GET, POST, and OPTIONS directly at the Cloudflare edge

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, *',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function onRequestGet(context: any) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, *',
    'Content-Type': 'application/json',
  };

  return new Response(JSON.stringify([]), {
    status: 200,
    headers: corsHeaders,
  });
}

export async function onRequestPost(context: any) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, *',
    'Content-Type': 'application/json',
  };

  try {
    const body = await context.request.json().catch(() => ({}));
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const requestedName = typeof body.name === 'string' ? body.name.trim() : '';
    const userId = body.userId || undefined;
    const modelConfig = body.modelConfig || {
      reasoningModel: 'gemini-2.5-flash',
      codingModel: 'gemini-2.5-flash',
      speedTier: 'turbo',
      maxTokens: 8192,
      temperature: 0.7
    };

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const cleanAppName = (requestedName || prompt.split(/[\n,.]/, 1)[0].slice(0, 64))
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .trim() || 'Autonomous Application';

    const projectId = `proj_${Math.random().toString(36).substring(2, 9)}`;

    const newProject = {
      id: projectId,
      name: cleanAppName,
      description: prompt.slice(0, 180),
      prompt: prompt,
      projectClassification: {
        domain: 'web_application',
        complexity: 'advanced',
        recommendedAgents: ['aria', 'parker', 'sophia', 'frank', 'quinn', 'devon'],
        detectedTech: ['React', 'TypeScript', 'TailwindCSS', 'Vite']
      },
      status: 'generating',
      createdAt: new Date().toISOString(),
      aiCreditsUsed: 350,
      modelConfig: modelConfig,
      files: [],
      deployedUrl: `/preview/${projectId}`,
      userId: userId,
      agents: [
        {
          id: 'ag_ceo',
          name: 'Aria CEO',
          role: 'Chief AI Executive & Orchestrator',
          tier: 'ceo',
          provider: 'gemini',
          status: 'thinking',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&fit=crop&q=60',
          model: 'gemini-2.5-flash',
          currentTask: 'Deconstructing intent and setting milestone directives for Senior Leads',
          validationStatus: 'in_review',
          ceoDirectives: [
            'Deconstruct user prompt into high-impact functional modules',
            'Enforce strict verification on PRD, Architecture, and UI state consistency',
            'Deploy real-time diagnostic remediation to any failing subagent'
          ],
          outputLogs: []
        },
        {
          id: 'ag_pm',
          name: 'Parker Lead',
          role: 'Senior Product Manager',
          tier: 'senior',
          provider: 'openrouter',
          status: 'idle',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&fit=crop&q=60',
          model: 'anthropic/claude-3.5-sonnet',
          currentTask: 'Standing by for CEO directive on PRD scoping',
          validationStatus: 'pending',
          subagents: [
            { id: `sub_pm_1_${projectId}`, name: 'Spec Writer', role: 'PRD Modeler', task: 'Synthesizing feature matrix & core entities', status: 'idle', instructionsReceived: [], model: 'claude-3.5-sonnet' },
            { id: `sub_pm_2_${projectId}`, name: 'User Flow Synthesizer', role: 'UX Analyst', task: 'Modeling edge-case user actions & workflows', status: 'idle', instructionsReceived: [], model: 'claude-3.5-sonnet' }
          ],
          outputLogs: []
        },
        {
          id: 'ag_arch',
          name: 'Sophia Lead',
          role: 'Senior Solution Architect',
          tier: 'senior',
          provider: 'openrouter',
          status: 'idle',
          avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&fit=crop&q=60',
          model: 'openai/o3-mini',
          currentTask: 'Standing by for PRD validation from CEO',
          validationStatus: 'pending',
          subagents: [
            { id: `sub_arch_1_${projectId}`, name: 'Data Schema Modeler', role: 'DB Architect', task: 'Drafting strict TypeScript interfaces & database schemas', status: 'idle', instructionsReceived: [], model: 'o3-mini' },
            { id: `sub_arch_2_${projectId}`, name: 'API Contract Validator', role: 'API Architect', task: 'Verifying REST routes & security middleware', status: 'idle', instructionsReceived: [], model: 'o3-mini' }
          ],
          outputLogs: []
        },
        {
          id: 'ag_fe',
          name: 'Frank Lead',
          role: 'Senior Frontend Engineer',
          tier: 'senior',
          provider: 'nvidia',
          status: 'idle',
          avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&fit=crop&q=60',
          model: 'meta/llama-3.3-70b-instruct',
          currentTask: 'Standing by for Architecture approval',
          validationStatus: 'pending',
          subagents: [
            { id: `sub_fe_1_${projectId}`, name: 'Component Tree Builder', role: 'React Developer', task: 'Synthesizing responsive Tailwind components', status: 'idle', instructionsReceived: [], model: 'llama-3.3-70b' },
            { id: `sub_fe_2_${projectId}`, name: 'Interactive State Polisher', role: 'UI Engineer', task: 'Binding interactive state hooks & animations', status: 'idle', instructionsReceived: [], model: 'llama-3.3-70b' }
          ],
          outputLogs: []
        },
        {
          id: 'ag_qa',
          name: 'Quinn Lead',
          role: 'Senior QA & Testing Lead',
          tier: 'senior',
          provider: 'groq',
          status: 'idle',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=60',
          model: 'deepseek-r1-distill-llama-70b',
          currentTask: 'Standing by for code synthesis',
          validationStatus: 'pending',
          subagents: [
            { id: `sub_qa_1_${projectId}`, name: 'Unit Test Runner', role: 'Test Engineer', task: 'Running unit test assertions & regression probes', status: 'idle', instructionsReceived: [], model: 'deepseek-r1' },
            { id: `sub_qa_2_${projectId}`, name: 'Integration & Edge Verifier', role: 'Security Auditor', task: 'Auditing OWASP Top 10 rules & input boundaries', status: 'idle', instructionsReceived: [], model: 'deepseek-r1' }
          ],
          outputLogs: []
        },
        {
          id: 'ag_sre',
          name: 'Devon Lead',
          role: 'Senior DevOps & SRE Lead',
          tier: 'senior',
          provider: 'groq',
          status: 'idle',
          avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&fit=crop&q=60',
          model: 'llama-3.3-70b-versatile',
          currentTask: 'Standing by for QA pass',
          validationStatus: 'pending',
          subagents: [
            { id: `sub_sre_1_${projectId}`, name: 'Docker Container Builder', role: 'DevOps Engineer', task: 'Building multi-stage container & mapping port 3000', status: 'idle', instructionsReceived: [], model: 'llama-3.3-70b' },
            { id: `sub_sre_2_${projectId}`, name: 'Ingress & Self-Healing Daemon', role: 'SRE Specialist', task: 'Configuring health probes & auto-recovery hooks', status: 'idle', instructionsReceived: [], model: 'llama-3.3-70b' }
          ],
          outputLogs: []
        }
      ]
    };

    return new Response(JSON.stringify(newProject), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to create project' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
