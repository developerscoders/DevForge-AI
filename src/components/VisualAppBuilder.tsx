import React, { useState } from 'react';
import { Layout, Plus, Trash2, Code, Move, Star, Database, ArrowRightLeft, CreditCard, Sparkles } from 'lucide-react';

export default function VisualAppBuilder() {
  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
  const [components, setComponents] = useState([
    { id: '1', name: 'Premium Hero Section', type: 'ui', desc: 'Centered headline, subtext, CTA, and glassmorphism panel background' },
    { id: '2', name: 'SaaS Analytics Grid', type: 'ui', desc: 'Bento layout showing MRR, User Growth, and active Docker containers' },
    { id: '3', name: 'Razorpay Subscription Card', type: 'billing', desc: 'GST-compliant pricing table with Monthly/Yearly state handlers' },
    { id: '4', name: 'PostgreSQL User Model', type: 'database', desc: 'User relation database mapping with UUID keys and plan references' },
  ]);

  const addComponent = (type: 'ui' | 'billing' | 'database') => {
    let name = '';
    let desc = '';
    if (type === 'ui') {
      name = 'Dynamic Features Bento';
      desc = 'Responsive grid panel mapping feature highlights with lucide icons.';
    } else if (type === 'billing') {
      name = 'GST Invoice Download Button';
      desc = 'Simulated client button compiling transaction logs into PDF receipts.';
    } else {
      name = 'MongoDB Memory Log Store';
      desc = 'Semantic indexing collection schema with vector embedding lookup.';
    }

    setComponents(prev => [
      ...prev,
      { id: Date.now().toString(), name, type, desc }
    ]);
  };

  const removeComponent = (id: string) => {
    setComponents(prev => prev.filter(c => c.id !== id));
  };

  const generateMarkupCode = () => {
    return `import React, { useState } from 'react';
import { Sparkles, BarChart3, ShieldCheck, CreditCard } from 'lucide-react';

/**
 * Generated via DevForge AI - Visual App Builder State
 * Layout Structure: Modular Ingress Pipeline
 */
export default function CanvasApp() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Active Node Components Compiled Live */}
        ${components.map(c => {
          if (c.type === 'ui') {
            return `
        {/* UI Node: ${c.name} */}
        <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">${c.name}</h2>
          <p className="text-xs text-slate-400 mt-2">${c.desc}</p>
        </section>`;
          } else if (c.type === 'billing') {
            return `
        {/* Billing Node: ${c.name} */}
        <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl border-indigo-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-indigo-400">${c.name}</h2>
              <p className="text-xs text-slate-400 mt-1">${c.desc}</p>
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-lg font-semibold">
              Checkout Setup
            </button>
          </div>
        </section>`;
          } else {
            return `
        {/* Database Schema: ${c.name} */}
        <section className="bg-slate-950 border border-slate-850 p-4 rounded-xl font-mono text-xs text-cyan-400">
          <div>// DB CONFIG: ${c.name}</div>
          <div className="text-slate-500 mt-1">${c.desc}</div>
        </section>`;
          }
        }).join('\n')}

      </div>
    </div>
  );
}`;
  };

  return (
    <div className="bg-[#111111] border border-[#222222] overflow-hidden shadow-2xl flex flex-col h-[520px] text-slate-100 rounded-none" id="visual-app-builder">
      {/* Control tab header */}
      <div className="bg-[#050505] px-4 py-3 border-b border-[#222222] flex items-center justify-between">
        <div>
          <span className="label text-[9px] text-violet-400">Visual Layout Engine</span>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 mt-1">Visual App Builder</h2>
          <p className="text-[9px] text-slate-500 font-mono mt-0.5 uppercase tracking-widest">BENTO GRID BUILDER</p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Tabs */}
          <div className="bg-[#111111] p-1 border border-[#222222] flex text-[10px] font-mono font-bold uppercase tracking-widest rounded-none">
            <button
              onClick={() => setActiveTab('visual')}
              className={`px-3 py-1.5 transition duration-200 ${activeTab === 'visual' ? 'bg-white text-black font-extrabold' : 'text-slate-400 hover:text-white'}`}
              id="tab-visual"
            >
              Visual Canvas
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 transition duration-200 ${activeTab === 'code' ? 'bg-white text-black font-extrabold' : 'text-slate-400 hover:text-white'}`}
              id="tab-code"
            >
              <span className="flex items-center gap-1">
                <Code className="w-3.5 h-3.5" /> Source Code
              </span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'visual' ? (
        <div className="flex-1 grid md:grid-cols-12 overflow-hidden h-full">
          {/* Side Panel: Draggable/Clickable Components library */}
          <div className="md:col-span-4 border-r border-[#222222] p-4 space-y-4 bg-[#050505] overflow-y-auto">
            <h3 className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Components Library</h3>
            
            <div className="space-y-3 text-xs">
              <button
                onClick={() => addComponent('ui')}
                className="w-full bg-[#111111] hover:bg-[#1a1a1a] text-left p-3 border border-[#222222] transition flex items-center space-x-3 rounded-none"
                id="add-ui-btn"
              >
                <div className="p-2 bg-violet-600/10 text-violet-400 border border-violet-500/20 rounded-none">
                  <Layout className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-200 uppercase tracking-wider">UI Component Block</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide">Hero, forms, or analytics grids</div>
                </div>
              </button>

              <button
                onClick={() => addComponent('billing')}
                className="w-full bg-[#111111] hover:bg-[#1a1a1a] text-left p-3 border border-[#222222] transition flex items-center space-x-3 rounded-none"
                id="add-billing-btn"
              >
                <div className="p-2 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-none">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-200 uppercase tracking-wider">Razorpay Pay Node</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide">Price tables, coupon handlers</div>
                </div>
              </button>

              <button
                onClick={() => addComponent('database')}
                className="w-full bg-[#111111] hover:bg-[#1a1a1a] text-left p-3 border border-[#222222] transition flex items-center space-x-3 rounded-none"
                id="add-db-btn"
              >
                <div className="p-2 bg-cyan-600/10 text-cyan-400 border border-cyan-500/20 rounded-none">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-200 uppercase tracking-wider">Database Schema</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide">SQL tables, vector stores</div>
                </div>
              </button>
            </div>
          </div>

          {/* Main Visual Drag Canvas */}
          <div className="md:col-span-8 p-6 overflow-y-auto space-y-4 bg-[#050505] max-h-[460px]" id="visual-canvas">
            {components.length === 0 ? (
              <div className="text-center py-20 text-slate-600 font-mono text-xs uppercase tracking-wider">
                // Canvas empty. Click components in library to mount nodes.
              </div>
            ) : (
              components.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-start justify-between p-4 border transition group rounded-none ${
                    c.type === 'ui'
                      ? 'bg-[#111111] border-[#222222] hover:border-violet-500'
                      : c.type === 'billing'
                      ? 'bg-[#111111] border-indigo-900/50 hover:border-indigo-700'
                      : 'bg-[#111111] border-[#222222] hover:border-cyan-700 font-mono text-cyan-400'
                  }`}
                  id={`canvas-component-${c.id}`}
                >
                  <div className="flex items-start space-x-3.5 text-xs">
                    <Move className="w-4 h-4 text-slate-600 mt-0.5 cursor-grab group-hover:text-slate-400 transition" />
                    <div>
                      <div className="font-bold text-slate-200 flex items-center space-x-2 uppercase tracking-wider text-xs">
                        <span>{c.name}</span>
                        {c.type === 'billing' && (
                          <span className="text-[8px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-1.5 py-0.5 uppercase font-mono font-black tracking-wider rounded-none">
                            Razorpay
                          </span>
                        )}
                        {c.type === 'database' && (
                          <span className="text-[8px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-1.5 py-0.5 uppercase font-mono font-black tracking-wider rounded-none">
                            Schema
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed uppercase text-[10px] tracking-wide">{c.desc}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => removeComponent(c.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition rounded-none"
                    title="Remove component"
                    id={`remove-canvas-component-${c.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Source Code view */
        <div className="flex-1 bg-[#050505] font-mono text-xs overflow-auto p-6 leading-relaxed select-text whitespace-pre text-slate-300 h-full" id="source-code-preview">
          {generateMarkupCode()}
        </div>
      )}
    </div>
  );
}
