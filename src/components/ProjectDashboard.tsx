import React, { useState } from 'react';
import { Project } from '../types';
import { Layout, Calendar, Globe, Database, Cpu, ArrowUpRight, Search, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProjectDashboardProps {
  projects: Project[];
}

export default function ProjectDashboard({ projects }: ProjectDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 text-slate-100" id="project-dashboard">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="label mb-2 block">Tenant Library</span>
          <h1 className="massive-type text-6xl text-white">
            ACTIVE SWARMS<span className="text-violet-500">.</span>
          </h1>
          <p className="text-xs text-slate-400 uppercase tracking-wider mt-2">
            Re-enter, modify, optimize, or inspect containers running in your DevForge AI tenant.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-600" />
          <input
            type="text"
            placeholder="Search prompt, title, files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111111] border border-[#222222] pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500 transition font-sans uppercase tracking-wider"
            id="search-input"
          />
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="bg-[#111111] border border-[#222222] p-16 text-center space-y-6 shadow-2xl">
          <Layout className="h-12 w-12 text-slate-700 mx-auto" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">No Projects Found</h3>
            <p className="text-xs text-slate-500 mt-2">Get started by entering an idea on the Builder intake workspace.</p>
          </div>
          <Link
            to="/"
            className="inline-block bg-white hover:bg-violet-400 text-black px-6 py-2.5 text-[10px] uppercase tracking-widest font-bold transition duration-200"
          >
            Create Your First Project
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((p) => {
            const dateStr = new Date(p.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });

            const statusColors: Record<string, string> = {
              planning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              designing: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
              coding: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
              testing: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
              deployed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
              idle: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
            };

            return (
              <div
                key={p.id}
                className="bg-[#111111] border border-[#222222] hover:border-slate-700 p-6 flex flex-col justify-between h-72 transition duration-300 shadow-xl"
                id={`project-card-${p.id}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider">ID: {p.id.substring(0, 8)}</span>
                    <span
                      className={`text-[9px] font-bold px-2.5 py-0.5 border uppercase tracking-wider ${
                        statusColors[p.status] || 'bg-slate-500/10 text-slate-400'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider line-clamp-1">{p.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-3 leading-relaxed">{p.description}</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-[#222222]">
                  {/* Model Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(p.modelConfig || {}).slice(0, 3).map(([role, model]) => (
                      <span key={role} className="bg-[#050505] border border-[#222222] text-[9px] font-mono text-slate-500 px-2 py-0.5">
                        {role.split(' ')[0]}: {model.split('-')[1] || model}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-slate-500 text-[10px] font-mono">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-600" />
                        <span>{dateStr}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Zap className="w-3.5 h-3.5 text-violet-500" />
                        <span className="font-bold text-slate-300 font-mono">{p.aiCreditsUsed}</span>
                      </div>
                    </div>

                    <Link
                      to={`/projects/${p.id}`}
                      className="bg-[#050505] hover:bg-violet-500 hover:text-white border border-[#222222] text-slate-300 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 transition-all duration-200 flex items-center space-x-1.5"
                      id={`project-btn-${p.id}`}
                    >
                      <span>Workspace</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
