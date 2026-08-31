import React, { useState } from 'react';
import { Project } from '../types';
import {
  Layout,
  Calendar,
  Globe,
  Database,
  Cpu,
  ArrowUpRight,
  Search,
  Zap,
  Trash2,
  Copy,
  Plus,
  Layers,
  Sparkles,
  Server,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProjectDashboardProps {
  projects: Project[];
  onDeleteProject?: (id: string) => Promise<void>;
  onDuplicateProject?: (project: Project) => Promise<void>;
}

export default function ProjectDashboard({
  projects,
  onDeleteProject,
  onDuplicateProject,
}: ProjectDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ? true : p.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const totalCredits = projects.reduce((acc, p) => acc + (p.aiCreditsUsed || 0), 0);
  const activeContainers = projects.filter((p) => p.status === 'deployed' || p.status === 'coding').length;

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project workspace? This will permanently remove all files and records from Firestore.')) {
      setDeletingId(id);
      try {
        if (onDeleteProject) {
          await onDeleteProject(id);
        }
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDuplicateProject) {
      await onDuplicateProject(project);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 text-slate-100" id="project-dashboard">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="label mb-2 block text-violet-400">Database Engine • Firestore Active</span>
          <h1 className="massive-type text-5xl md:text-6xl text-white">
            PROJECT SWARMS<span className="text-violet-500">.</span>
          </h1>
          <p className="text-xs text-slate-400 uppercase tracking-wider mt-2">
            Inspect, edit, deploy, or re-enter AI agent containers stored in your tenant.
          </p>
        </div>

        {/* Top actions & Create button */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/"
            className="bg-white hover:bg-violet-400 text-black px-5 py-2.5 text-[10px] uppercase tracking-widest font-extrabold transition duration-200 flex items-center space-x-1.5 shadow-lg shadow-violet-950/20"
            id="dashboard-forge-btn"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Forge New Project</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111111] border border-[#222222] p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase text-slate-500">Total Projects</div>
            <div className="text-2xl font-bold text-white mt-1 font-mono">{projects.length}</div>
          </div>
          <Layers className="w-6 h-6 text-violet-400" />
        </div>

        <div className="bg-[#111111] border border-[#222222] p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase text-slate-500">Active SRE Containers</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{activeContainers}</div>
          </div>
          <Server className="w-6 h-6 text-emerald-400" />
        </div>

        <div className="bg-[#111111] border border-[#222222] p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase text-slate-500">Compute Credits Used</div>
            <div className="text-2xl font-bold text-violet-400 mt-1 font-mono">{totalCredits}</div>
          </div>
          <Zap className="w-6 h-6 text-violet-400" />
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0a0a0a] p-3 border border-[#222222]">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-600" />
          <input
            type="text"
            placeholder="Search prompt, title, files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111111] border border-[#222222] pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500 transition font-sans uppercase tracking-wider"
            id="search-input"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', 'deployed', 'coding', 'planning', 'testing'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`text-[9px] font-mono uppercase tracking-widest px-3 py-1.5 border transition ${
                statusFilter === st
                  ? 'bg-white text-black font-extrabold border-white'
                  : 'bg-[#111111] text-slate-400 border-[#222222] hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid or Empty State */}
      {filteredProjects.length === 0 ? (
        <div className="bg-[#111111] border border-[#222222] p-16 text-center space-y-6 shadow-2xl">
          <Layout className="h-12 w-12 text-slate-700 mx-auto" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">No Projects Found</h3>
            <p className="text-xs text-slate-500 mt-2">
              {searchQuery || statusFilter !== 'all'
                ? 'No projects match your current search query or filter.'
                : 'You have not created any projects yet in your Firestore database.'}
            </p>
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
            const dateStr = p.createdAt
              ? new Date(p.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Recent';

            const statusColors: Record<string, string> = {
              planning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              designing: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
              coding: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
              testing: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
              deployed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
              idle: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
            };

            const filesCount = p.files ? p.files.length : 0;

            return (
              <div
                key={p.id}
                className="bg-[#111111] border border-[#222222] hover:border-slate-700 p-6 flex flex-col justify-between h-80 transition duration-300 shadow-xl relative group"
                id={`project-card-${p.id}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider">
                      ID: {p.id.substring(0, 10)}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`text-[9px] font-bold px-2.5 py-0.5 border uppercase tracking-wider ${
                          statusColors[p.status] || 'bg-slate-500/10 text-slate-400'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider line-clamp-1">
                    {p.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {p.description || p.prompt}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-[#222222]">
                  {/* Model Chips & File count */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(p.modelConfig || {})
                        .slice(0, 2)
                        .map(([role, model]) => (
                          <span
                            key={role}
                            className="bg-[#050505] border border-[#222222] text-[8px] font-mono text-slate-400 px-1.5 py-0.5"
                          >
                            {role.split(' ')[0]}: {model.split('-')[1] || model.split('/')[1] || model}
                          </span>
                        ))}
                    </div>
                    <span className="text-[9px] font-mono text-slate-500">{filesCount} files</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center space-x-3 text-slate-500 text-[10px] font-mono">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-600" />
                        <span>{dateStr}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Zap className="w-3.5 h-3.5 text-violet-500" />
                        <span className="font-bold text-slate-300 font-mono">{p.aiCreditsUsed || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {/* Duplicate Button */}
                      {onDuplicateProject && (
                        <button
                          onClick={(e) => handleDuplicate(e, p)}
                          title="Duplicate Project"
                          className="p-1.5 bg-[#050505] hover:bg-slate-800 border border-[#222222] text-slate-400 hover:text-white transition"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      )}

                      {/* Delete Button */}
                      {onDeleteProject && (
                        <button
                          onClick={(e) => handleDelete(e, p.id)}
                          disabled={deletingId === p.id}
                          title="Delete Project"
                          className="p-1.5 bg-[#050505] hover:bg-rose-950/60 border border-[#222222] hover:border-rose-800 text-slate-400 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}

                      {/* Workspace Link */}
                      <Link
                        to={`/projects/${p.id}`}
                        className="bg-[#050505] hover:bg-violet-500 hover:text-white border border-[#222222] text-slate-300 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 transition-all duration-200 flex items-center space-x-1"
                        id={`project-btn-${p.id}`}
                      >
                        <span>Workspace</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
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
