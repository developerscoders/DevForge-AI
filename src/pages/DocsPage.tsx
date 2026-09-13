import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Terminal,
  HelpCircle,
  GitBranch,
  Zap,
  Shield,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';
import SEOHead from '../components/SEOHead';
import { PAGE_SEO } from '../lib/seoConfig';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    category: 'Architecture',
    question: 'How does the DevForge AI agent swarm coordinate code creation?',
    answer:
      'DevForge AI uses a hierarchical agent architecture. The Product Manager synthesizes the user prompt into user stories and requirements (PRD.md). The System Architect plans state management, data structures, and component trees (ARCHITECTURE.md). The Tech Lead defines interface standards, and Senior Coders stream modular TypeScript code in parallel. The QA Automation agent verifies syntax and applies AST error self-healing before finishing.'
  },
  {
    category: 'Deployment',
    question: 'How does 1-Click Vercel Edge Deployment work?',
    answer:
      'When you trigger Vercel deployment, DevForge bundles your project files in memory and dispatches them directly to the Vercel Deployments API. It monitors deployment status until the build completes, returning an active, SSL-secured edge URL.'
  },
  {
    category: 'DevOps',
    question: 'Can I synchronize projects directly to my personal GitHub account?',
    answer:
      'Yes. Using the GitHub Git Data Trees API, DevForge creates a repository (public or private) under your authenticated GitHub token, commits all source files with formatted commit messages, and connects the repository directly to your workspace.'
  },
  {
    category: 'Security',
    question: 'Are my private API keys or tokens visible in the browser?',
    answer:
      'No. DevForge AI adheres to strict full-stack security principles. All third-party secrets, LLM keys, and deployment tokens reside strictly inside the server environment. The client only sends requests to server-side proxy routes (/api/*).'
  },
  {
    category: 'Billing',
    question: 'How do Developer Credits work across plans?',
    answer:
      'Each project creation and code streaming operation deducts credits based on model token complexity. Starter plans include 1,000 credits, Pro includes 5,000 credits, and Enterprise includes 25,000 monthly credits with high-volume top-ups available.'
  }
];

export default function DocsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<'quickstart' | 'swarm' | 'deployment' | 'api'>('quickstart');

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-16 text-slate-100" id="docs-page">
      <SEOHead pageSlug="/docs" pageId="docs" {...PAGE_SEO.docs} />

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-mono font-semibold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Documentation & Guides</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono">
          DevForge Developer Guides
        </h1>
        <p className="text-base sm:text-lg text-slate-400 font-sans leading-relaxed">
          Everything you need to orchestrate autonomous AI agent swarms, synchronize code to GitHub,
          and deploy full-stack applications with high reliability.
        </p>
      </div>

      {/* Interactive Doc Nav Tabs */}
      <div className="flex border-b border-[#222222] font-mono text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('quickstart')}
          className={`px-4 py-2.5 font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'quickstart'
              ? 'border-violet-500 text-white bg-white/5'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          1. Quickstart Guide
        </button>
        <button
          onClick={() => setActiveTab('swarm')}
          className={`px-4 py-2.5 font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'swarm'
              ? 'border-violet-500 text-white bg-white/5'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          2. Swarm Engine
        </button>
        <button
          onClick={() => setActiveTab('deployment')}
          className={`px-4 py-2.5 font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'deployment'
              ? 'border-violet-500 text-white bg-white/5'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          3. CI/CD & Deployments
        </button>
        <button
          onClick={() => setActiveTab('api')}
          className={`px-4 py-2.5 font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'api'
              ? 'border-violet-500 text-white bg-white/5'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          4. REST API Endpoints
        </button>
      </div>

      {/* Tab Contents */}
      <div className="bg-[#0c0c0c] border border-[#222222] p-8 space-y-6">
        {activeTab === 'quickstart' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
              <Terminal className="w-5 h-5 text-violet-400" />
              <span>Forging Your First Application</span>
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed font-sans">
              DevForge AI accepts high-level system descriptions and turns them into 100% runnable, modular software codebases.
              Follow this sequence for the best code outcomes:
            </p>
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 bg-[#141414] border border-[#262626]">
                <div className="text-violet-400 font-bold mb-1">Step 1: Write a Detailed Prompt</div>
                <p className="text-slate-300 font-sans text-xs">
                  Describe what your app does, target users, primary views, and key data flows (e.g. &quot;Build an inventory tracking app with SKU filters, barcode scanner simulator, stock alerts, and CSV export&quot;).
                </p>
              </div>
              <div className="p-4 bg-[#141414] border border-[#262626]">
                <div className="text-violet-400 font-bold mb-1">Step 2: Inspect the Autonomous Swarm</div>
                <p className="text-slate-300 font-sans text-xs">
                  Watch the Product Manager, System Architect, Senior Coder, and QA Automation agents delegate tasks and stream source files in real-time.
                </p>
              </div>
              <div className="p-4 bg-[#141414] border border-[#262626]">
                <div className="text-violet-400 font-bold mb-1">Step 3: Preview & Deploy</div>
                <p className="text-slate-300 font-sans text-xs">
                  Interact with the live application in the embedded Sandbox. Push directly to GitHub or deploy live to Vercel with a single click.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'swarm' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <span>Hierarchical Multi-Agent Roles</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              <div className="p-4 bg-[#141414] border border-[#262626]">
                <div className="text-white font-bold text-sm mb-1">Product Manager (CEO Directive)</div>
                <p className="text-slate-400 font-sans">Synthesizes user prompt into concrete specs, PRD.md, and functional criteria.</p>
              </div>
              <div className="p-4 bg-[#141414] border border-[#262626]">
                <div className="text-white font-bold text-sm mb-1">System Architect</div>
                <p className="text-slate-400 font-sans">Produces ARCHITECTURE.md, data schemas, modular boundaries, and state strategy.</p>
              </div>
              <div className="p-4 bg-[#141414] border border-[#262626]">
                <div className="text-white font-bold text-sm mb-1">Senior Full-Stack Coder</div>
                <p className="text-slate-400 font-sans">Generates production TypeScript files, components, and responsive Tailwind styling.</p>
              </div>
              <div className="p-4 bg-[#141414] border border-[#262626]">
                <div className="text-white font-bold text-sm mb-1">QA Automation & AST Healer</div>
                <p className="text-slate-400 font-sans">Validates imports, compiles the tree, and autonomously resolves missing references.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'deployment' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-emerald-400" />
              <span>Deployment Pipeline Options</span>
            </h2>
            <div className="space-y-3 font-mono text-xs">
              <div className="p-4 bg-[#141414] border border-[#262626]">
                <div className="text-emerald-400 font-bold mb-1">GitHub Git Data Trees API</div>
                <p className="text-slate-300 font-sans text-xs">
                  Creates an authentic Git tree with blobs for all project files. Provides instant GitHub repository URL and initial commit SHA.
                </p>
              </div>
              <div className="p-4 bg-[#141414] border border-[#262626]">
                <div className="text-cyan-400 font-bold mb-1">Vercel Edge Deployments API</div>
                <p className="text-slate-300 font-sans text-xs">
                  Direct upload of source files to Vercel global edge infrastructure with live deployment URL and SSL provisioning.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Backend Core API Specs</span>
            </h2>
            <div className="space-y-2 font-mono text-xs">
              <div className="p-3 bg-[#141414] border border-[#262626] flex items-center justify-between">
                <span className="text-emerald-400 font-bold">POST /api/projects</span>
                <span className="text-slate-400 font-sans text-xs">Create new project and trigger autonomous swarm</span>
              </div>
              <div className="p-3 bg-[#141414] border border-[#262626] flex items-center justify-between">
                <span className="text-cyan-400 font-bold">GET /api/projects/:id/files</span>
                <span className="text-slate-400 font-sans text-xs">Retrieve complete project file hierarchy</span>
              </div>
              <div className="p-3 bg-[#141414] border border-[#262626] flex items-center justify-between">
                <span className="text-violet-400 font-bold">POST /api/deploy/github</span>
                <span className="text-slate-400 font-sans text-xs">Sync project files to GitHub repository</span>
              </div>
              <div className="p-3 bg-[#141414] border border-[#262626] flex items-center justify-between">
                <span className="text-amber-400 font-bold">POST /api/deploy/vercel</span>
                <span className="text-slate-400 font-sans text-xs">Deploy project to Vercel edge infrastructure</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FAQ Accordion Section (Ranks for Google Rich Snippets) */}
      <div className="space-y-6">
        <div className="border-b border-[#222222] pb-4">
          <div className="inline-flex items-center space-x-2 text-violet-400 text-xs font-mono font-bold uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-2xl font-bold text-white font-mono mt-1">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-[#0c0c0c] border border-[#222222] overflow-hidden transition"
                id={`faq-item-${idx}`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 text-left flex items-center justify-between space-x-4 hover:bg-white/3 transition"
                >
                  <span className="font-mono text-sm font-bold text-white">{item.question}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-sm text-slate-400 font-sans leading-relaxed border-t border-[#1a1a1a]">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-[#0c0c0c] border border-violet-500/30 p-8 text-center space-y-4">
        <h3 className="text-2xl font-bold text-white font-mono">Ready to Build with the Swarm?</h3>
        <p className="text-sm text-slate-400 font-sans max-w-lg mx-auto">
          Start generating full-stack software with autonomous AI agents today. Zero configuration required.
        </p>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider transition shadow-lg"
          id="docs-bottom-cta"
        >
          <span>Launch DevForge Builder</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
