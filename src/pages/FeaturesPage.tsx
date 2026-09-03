import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Cpu,
  GitBranch,
  ShieldCheck,
  Terminal,
  Activity,
  Layers,
  ArrowRight,
  Zap,
  Code2,
  Workflow,
  Server
} from 'lucide-react';
import SEOHead from '../components/SEOHead';
import { PAGE_SEO } from '../lib/seoConfig';

export default function FeaturesPage() {
  const featuresList = [
    {
      icon: Cpu,
      title: 'Autonomous Multi-Agent Swarm',
      badge: 'Agentic Core',
      description:
        'A coordinated hierarchy of specialized autonomous agents: Product Manager (PRD synthesis), System Architect (modular design), Senior Tech Lead (code standards), and Full-Stack Coders executing concurrently.',
      highlights: ['Hierarchical task delegation', 'Parallel file synthesis', 'Zero human code intervention required']
    },
    {
      icon: Activity,
      title: 'AST Self-Healing Engine',
      badge: 'Automated QA',
      description:
        'Syntax and runtime errors are caught in real-time. The QA Automation agent parses the Abstract Syntax Tree (AST), identifies broken imports or missing types, and heals them autonomously.',
      highlights: ['Automated compile verification', 'Recursive healing loops', 'Strict TypeScript compliance']
    },
    {
      icon: GitBranch,
      title: 'Direct GitHub Sync & Trees API',
      badge: 'DevOps CI/CD',
      description:
        'Instantly synchronize every generated project to your GitHub account using the high-performance Git Data Trees API. Create repositories, stage files, and push full commits with one click.',
      highlights: ['Full file tree preservation', 'Commit history generation', 'Private & public repo support']
    },
    {
      icon: Zap,
      title: '1-Click Vercel Edge Deployment',
      badge: 'Edge Cloud',
      description:
        'Deploy production-ready applications directly to Vercel’s global Edge network. Receive active live URLs in seconds with automated environment configuration and HTTPS certificates.',
      highlights: ['Edge SSR & static routing', 'Instant global CDN caching', 'Zero infrastructure setup']
    },
    {
      icon: Terminal,
      title: 'Interactive Live Sandbox & Preview',
      badge: 'Real-Time Telemetry',
      description:
        'Run and interact with applications immediately inside a safe, isolated container sandbox. Toggle between desktop, tablet, and mobile viewports with hot live-reloading.',
      highlights: ['Sandboxed iframe isolation', 'Real-time agent stream logs', 'Device responsiveness inspector']
    },
    {
      icon: ShieldCheck,
      title: 'Enterprise Security & Sandboxing',
      badge: 'Zero Trust',
      description:
        'API keys and server credentials never reach the browser client. All sensitive operations are securely proxied through backend microservices with Firestore RBAC rules.',
      highlights: ['Server-side secret isolation', 'HMAC webhook signature validation', 'Granular role-based access']
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-16 text-slate-100" id="features-page">
      <SEOHead {...PAGE_SEO.features} />

      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-mono font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation Software Engineering</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono">
          Engineered by Swarms. Built for Production.
        </h1>
        <p className="text-base sm:text-lg text-slate-400 font-sans leading-relaxed">
          DevForge AI shifts software engineering from manual syntax writing to high-level system orchestration.
          Discover the core engines powering our autonomous multi-agent developer swarm.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuresList.map((f, i) => {
          const Icon = f.icon;
          return (
            <div
              key={i}
              className="bg-[#0c0c0c] border border-[#222222] p-6 hover:border-violet-500/40 transition-all duration-300 flex flex-col justify-between group"
              id={`feature-card-${i}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-[#141414] border border-[#262626] text-violet-400 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-white/5 border border-white/10 text-slate-400 uppercase tracking-wider">
                    {f.badge}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white font-mono">{f.title}</h2>
                <p className="text-sm text-slate-400 leading-relaxed font-sans">{f.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#1a1a1a] space-y-2">
                {f.highlights.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-xs text-slate-300 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Architecture Flow Diagram Section */}
      <div className="bg-[#0c0c0c] border border-[#222222] p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e1e1e] pb-6">
          <div>
            <span className="text-xs font-mono text-violet-400 uppercase tracking-wider">Lifecycle Pipeline</span>
            <h2 className="text-2xl font-bold text-white font-mono mt-1">Autonomous Execution Lifecycle</h2>
          </div>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition"
            id="features-cta-build"
          >
            <span>Launch Swarm Builder</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          <div className="p-4 bg-[#141414] border border-[#222222] space-y-2">
            <div className="text-violet-400 font-bold flex items-center gap-2">
              <Workflow className="w-4 h-4" />
              <span>1. Specification</span>
            </div>
            <p className="text-slate-400 text-[11px]">Product Manager synthesizes natural language prompt into full PRD and user stories.</p>
          </div>
          <div className="p-4 bg-[#141414] border border-[#222222] space-y-2">
            <div className="text-indigo-400 font-bold flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>2. Architecture</span>
            </div>
            <p className="text-slate-400 text-[11px]">System Architect formulates clean component graph, state containers, and API contracts.</p>
          </div>
          <div className="p-4 bg-[#141414] border border-[#222222] space-y-2">
            <div className="text-emerald-400 font-bold flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              <span>3. Code Streaming</span>
            </div>
            <p className="text-slate-400 text-[11px]">Senior Coder writes modular TypeScript files in real-time with AST error prevention.</p>
          </div>
          <div className="p-4 bg-[#141414] border border-[#222222] space-y-2">
            <div className="text-cyan-400 font-bold flex items-center gap-2">
              <Server className="w-4 h-4" />
              <span>4. Cloud Deploy</span>
            </div>
            <p className="text-slate-400 text-[11px]">QA Agent runs synthetic testing, followed by automated GitHub commit & Vercel deployment.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
