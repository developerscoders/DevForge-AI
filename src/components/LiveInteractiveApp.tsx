import React, { useState, useEffect, useRef } from 'react';
import { Project } from '../types';
import {
  Calculator as CalcIcon,
  CheckSquare,
  FileText,
  CloudSun,
  ShoppingBag,
  Sparkles,
  History,
  Copy,
  Check,
  RotateCcw,
  ArrowRightLeft,
  Plus,
  Trash2,
  Search,
  Sliders,
  DollarSign,
  TrendingUp,
  Clock,
  ChevronRight,
  CornerDownLeft,
  Divide,
  X as MultiplyIcon,
  Minus,
  Percent,
  Delete,
  Layers,
  Tag,
  User,
  Server,
  Database,
  ShieldCheck
} from 'lucide-react';

interface LiveInteractiveAppProps {
  project: Project;
}

export default function LiveInteractiveApp({ project }: LiveInteractiveAppProps) {
  const promptText = (project.prompt || project.name || '').toLowerCase();

  const isTaskFlowOrMern =
    promptText.includes('taskflow') ||
    promptText.includes('mern') ||
    promptText.includes('kanban') ||
    promptText.includes('project management') ||
    promptText.includes('sprint') ||
    promptText.includes('board') ||
    promptText.includes('task') ||
    promptText.includes('ticket');

  const isCalculator =
    promptText.includes('calc') ||
    promptText.includes('math') ||
    promptText.includes('arithmetic');

  const isNotes =
    promptText.includes('note') ||
    promptText.includes('journal') ||
    promptText.includes('scratchpad') ||
    promptText.includes('docs');

  const isWeather =
    promptText.includes('weather') ||
    promptText.includes('forecast') ||
    promptText.includes('climate');

  const isEcommerce =
    promptText.includes('shop') ||
    promptText.includes('store') ||
    promptText.includes('ecommerce') ||
    promptText.includes('cart') ||
    promptText.includes('product');

  const isRestaurant =
    !isTaskFlowOrMern &&
    (promptText.includes('restaurant') ||
      promptText.includes('fine dining') ||
      promptText.includes('bistro') ||
      promptText.includes('culinary') ||
      promptText.includes('table reservation'));

  if (isTaskFlowOrMern) {
    return <InteractiveTaskFlowApp project={project} />;
  }

  if (isCalculator) {
    return <InteractiveCalculator appName={project.name} />;
  }

  if (isNotes) {
    return <InteractiveNotesApp appName={project.name} prompt={project.prompt} />;
  }

  if (isWeather) {
    return <InteractiveWeatherApp appName={project.name} />;
  }

  if (isEcommerce) {
    return <InteractiveStorefront appName={project.name} prompt={project.prompt} />;
  }

  if (isRestaurant) {
    return <InteractiveRestaurant appName={project.name} />;
  }

  // General dynamic interactive web application
  return <InteractiveDynamicApp project={project} />;
}

interface TaskFlowTicket {
  id: string;
  title: string;
  category: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee: string;
  timeEstimate: string;
}

function InteractiveTaskFlowApp({ project }: { project: Project }) {
  const [activeTab, setActiveTab] = useState<'board' | 'api' | 'telemetry'>('board');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [tickets, setTickets] = useState<TaskFlowTicket[]>([
    {
      id: 'tf-101',
      title: 'Initialize MongoDB connection pool with auto-reconnect backoff',
      category: 'Database',
      status: 'done',
      priority: 'high',
      assignee: 'Devon SRE',
      timeEstimate: '3h'
    },
    {
      id: 'tf-102',
      title: 'Enforce JWT authentication middleware & HTTP-only cookies',
      category: 'Security',
      status: 'review',
      priority: 'urgent',
      assignee: 'Frank Lead',
      timeEstimate: '4h'
    },
    {
      id: 'tf-103',
      title: 'Build drag-and-drop Kanban state controller with optimistic UI',
      category: 'Frontend',
      status: 'in_progress',
      priority: 'high',
      assignee: 'Sophia Arch',
      timeEstimate: '6h'
    },
    {
      id: 'tf-104',
      title: 'Implement REST endpoints: GET /api/tasks & POST /api/tasks',
      category: 'API Engine',
      status: 'todo',
      priority: 'medium',
      assignee: 'Parker PM',
      timeEstimate: '2h'
    },
    {
      id: 'tf-105',
      title: 'Write automated unit test assertions with Vitest for controllers',
      category: 'QA / Testing',
      status: 'todo',
      priority: 'medium',
      assignee: 'Quinn QA',
      timeEstimate: '5h'
    },
    {
      id: 'tf-106',
      title: 'Dockerize full-stack container & configure reverse proxy',
      category: 'DevOps',
      status: 'backlog',
      priority: 'low',
      assignee: 'Devon SRE',
      timeEstimate: '2h'
    }
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Frontend');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [notice, setNotice] = useState<string | null>(null);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newTicket: TaskFlowTicket = {
      id: `tf-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle.trim(),
      category: newCategory,
      status: 'todo',
      priority: newPriority,
      assignee: 'Aria Lead',
      timeEstimate: '3h'
    };
    setTickets([newTicket, ...tickets]);
    setNewTitle('');
    setNotice(`Ticket #${newTicket.id} created successfully!`);
    setTimeout(() => setNotice(null), 2500);
  };

  const advanceStatus = (ticketId: string) => {
    const cycle: Record<string, 'todo' | 'in_progress' | 'review' | 'done'> = {
      backlog: 'todo',
      todo: 'in_progress',
      in_progress: 'review',
      review: 'done',
      done: 'done'
    };
    setTickets(prev =>
      prev.map(t => (t.id === ticketId ? { ...t, status: cycle[t.status] || 'done' } : t))
    );
  };

  const deleteTicket = (ticketId: string) => {
    setTickets(prev => prev.filter(t => t.id !== ticketId));
    setNotice('Ticket deleted from board.');
    setTimeout(() => setNotice(null), 2000);
  };

  const filteredTickets = tickets.filter(t => {
    if (priorityFilter === 'all') return true;
    return t.priority === priorityFilter;
  });

  const columns = [
    { id: 'backlog', title: 'Backlog', borderColor: 'border-slate-700/40', badgeBg: 'bg-slate-800' },
    { id: 'todo', title: 'To Do', borderColor: 'border-blue-500/40', badgeBg: 'bg-blue-950/40 text-blue-400' },
    { id: 'in_progress', title: 'In Progress', borderColor: 'border-amber-500/40', badgeBg: 'bg-amber-950/40 text-amber-400' },
    { id: 'review', title: 'Code Review', borderColor: 'border-purple-500/40', badgeBg: 'bg-purple-950/40 text-purple-400' },
    { id: 'done', title: 'Completed', borderColor: 'border-emerald-500/40', badgeBg: 'bg-emerald-950/40 text-emerald-400' }
  ];

  return (
    <div className="w-full min-h-[640px] bg-[#09090d] text-slate-100 font-sans p-4 md:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-violet-600/30">
            TF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
                {project.name || 'TaskFlow Pro'}
              </h1>
              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono px-2 py-0.5 rounded font-bold">
                PORT 3000 ONLINE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              MERN Stack Task & Project Management Engine · Real-time REST Telemetry
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#14141a] p-1 rounded-xl border border-white/10 text-xs font-mono">
          <button
            onClick={() => setActiveTab('board')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'board' ? 'bg-violet-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Kanban Board
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'api' ? 'bg-violet-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            REST API
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'telemetry' ? 'bg-violet-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Stack Health
          </button>
        </div>
      </div>

      {notice && (
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-mono py-2 px-4 rounded-xl text-center font-bold animate-fadeIn">
          {notice}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#121218] border border-white/5 p-3.5 rounded-2xl">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Work Orders</span>
          <div className="text-xl font-bold font-mono text-white mt-1">{tickets.length}</div>
        </div>
        <div className="bg-[#121218] border border-white/5 p-3.5 rounded-2xl">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">In Active Flight</span>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {tickets.filter(t => t.status === 'in_progress' || t.status === 'review').length}
          </div>
        </div>
        <div className="bg-[#121218] border border-white/5 p-3.5 rounded-2xl">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">Completed Tickets</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {tickets.filter(t => t.status === 'done').length}
          </div>
        </div>
        <div className="bg-[#121218] border border-white/5 p-3.5 rounded-2xl">
          <span className="text-[10px] font-mono uppercase tracking-wider text-violet-400">Sprint Completion</span>
          <div className="text-xl font-bold font-mono text-violet-400 mt-1">
            {Math.round((tickets.filter(t => t.status === 'done').length / Math.max(1, tickets.length)) * 100)}%
          </div>
        </div>
      </div>

      {activeTab === 'board' && (
        <div className="space-y-6">
          {/* New Ticket Form & Filter Bar */}
          <div className="bg-[#111116] border border-white/5 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <form onSubmit={handleCreateTicket} className="flex-1 flex flex-wrap gap-2.5 items-center min-w-[280px]">
              <input
                type="text"
                placeholder="Draft new sprint ticket (e.g. Implement WebSocket gateway)..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="flex-1 min-w-[200px] bg-[#09090c] border border-white/10 px-3 py-2 text-xs text-white rounded-xl outline-none focus:border-violet-500"
              />
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="bg-[#09090c] border border-white/10 text-xs text-white px-3 py-2 rounded-xl outline-none"
              >
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="Database">Database</option>
                <option value="Security">Security</option>
                <option value="DevOps">DevOps</option>
              </select>
              <select
                value={newPriority}
                onChange={(e: any) => setNewPriority(e.target.value)}
                className="bg-[#09090c] border border-white/10 text-xs text-white px-3 py-2 rounded-xl outline-none"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <button
                type="submit"
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow"
              >
                <Plus size={14} /> Add Ticket
              </button>
            </form>

            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <span className="text-slate-400">Filter:</span>
              {['all', 'urgent', 'high', 'medium', 'low'].map(p => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-2 py-0.5 rounded capitalize ${priorityFilter === p ? 'bg-white/20 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {columns.map(col => {
              const colTickets = filteredTickets.filter(t => t.status === col.id);
              return (
                <div
                  key={col.id}
                  className={`bg-[#0d0d12] border ${col.borderColor} rounded-2xl p-3 flex flex-col min-h-[440px] shadow-lg`}
                >
                  <div className="flex items-center justify-between pb-2.5 border-b border-white/5 mb-3">
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">{col.title}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${col.badgeBg}`}>
                      {colTickets.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1 overflow-y-auto">
                    {colTickets.length === 0 ? (
                      <div className="text-slate-600 text-[11px] italic text-center py-8">
                        No tickets in {col.title.toLowerCase()}
                      </div>
                    ) : (
                      colTickets.map(ticket => (
                        <div
                          key={ticket.id}
                          className="bg-[#14141a] border border-white/5 hover:border-violet-500/40 p-3 rounded-xl space-y-2 transition shadow"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-mono text-slate-400">{ticket.id}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                ticket.priority === 'urgent'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : ticket.priority === 'high'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              }`}
                            >
                              {ticket.priority}
                            </span>
                          </div>

                          <h4 className="text-xs font-semibold text-white leading-snug line-clamp-2">
                            {ticket.title}
                          </h4>

                          <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1 font-mono">
                              <User size={10} /> {ticket.assignee}
                            </span>
                            <span className="font-mono">{ticket.timeEstimate}</span>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <button
                              onClick={() => deleteTicket(ticket.id)}
                              className="text-slate-500 hover:text-rose-400 transition"
                              title="Delete Ticket"
                            >
                              <Trash2 size={12} />
                            </button>
                            {col.id !== 'done' && (
                              <button
                                onClick={() => advanceStatus(ticket.id)}
                                className="text-[10px] text-violet-400 hover:text-violet-300 font-bold flex items-center gap-0.5"
                              >
                                Advance <ChevronRight size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'api' && (
        <div className="bg-[#111116] border border-white/5 p-6 rounded-2xl space-y-4 font-mono text-xs">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
            Synthesized REST Endpoints (Express & MongoDB)
          </h3>
          <div className="space-y-2.5">
            <div className="bg-[#09090d] border border-white/5 p-3 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">GET</span>
                <span className="text-white">/api/tasks</span>
              </div>
              <span className="text-slate-400">Query tasks by project, sprint, or status</span>
            </div>
            <div className="bg-[#09090d] border border-white/5 p-3 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold">POST</span>
                <span className="text-white">/api/tasks</span>
              </div>
              <span className="text-slate-400">Create new task with priority & assignee</span>
            </div>
            <div className="bg-[#09090d] border border-white/5 p-3 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold">PATCH</span>
                <span className="text-white">/api/tasks/:id/status</span>
              </div>
              <span className="text-slate-400">Atomic Kanban stage transition update</span>
            </div>
            <div className="bg-[#09090d] border border-white/5 p-3 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-bold">DELETE</span>
                <span className="text-white">/api/tasks/:id</span>
              </div>
              <span className="text-slate-400">Remove task entity from database</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'telemetry' && (
        <div className="bg-[#111116] border border-white/5 p-6 rounded-2xl space-y-4 font-mono text-xs">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
            Full-Stack Infrastructure Telemetry
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#09090d] border border-white/5 p-4 rounded-xl space-y-2">
              <div className="text-slate-400 font-bold">Runtime Environment</div>
              <div className="text-emerald-400">Node.js 22 + Express 5 · Port 3000</div>
              <div className="text-slate-500 text-[11px]">HTTP reverse proxy routing active</div>
            </div>
            <div className="bg-[#09090d] border border-white/5 p-4 rounded-xl space-y-2">
              <div className="text-slate-400 font-bold">Persistence Engine</div>
              <div className="text-emerald-400">MongoDB Cluster · Mongoose ODM</div>
              <div className="text-slate-500 text-[11px]">Indexes on projectId & assigneeId</div>
            </div>
            <div className="bg-[#09090d] border border-white/5 p-4 rounded-xl space-y-2">
              <div className="text-slate-400 font-bold">Authentication Gate</div>
              <div className="text-violet-400">JWT + Bcrypt (HMAC-SHA256)</div>
              <div className="text-slate-500 text-[11px]">RBAC Roles: Admin, Manager, Contributor</div>
            </div>
            <div className="bg-[#09090d] border border-white/5 p-4 rounded-xl space-y-2">
              <div className="text-slate-400 font-bold">Container Architecture</div>
              <div className="text-blue-400">Docker Multi-Stage Build</div>
              <div className="text-slate-500 text-[11px]">Alpine Linux runner with HEALTHCHECK probe</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



function InteractiveRestaurant({ appName }: { appName: string }) {
  const [category, setCategory] = useState('All');
  const [reserved, setReserved] = useState(false);
  const dishes = [
    ['Caviar & smoked crème', 'Tasting Menu', '€38'],
    ['Coal-roasted black cod', 'Mains', '€42'],
    ['Midnight garden', 'Cocktails', '€18'],
    ['Valrhona eclipse', 'Desserts', '€16'],
  ];
  const visible = category === 'All' ? dishes : dishes.filter((dish) => dish[1] === category);
  return (
    <div className="overflow-hidden bg-[#100f0d] text-[#f7f0e4] -m-4 md:-m-6 min-h-[620px] font-serif">
      <section className="relative min-h-[420px] p-7 md:p-12 flex flex-col justify-end bg-[linear-gradient(115deg,rgba(10,10,9,.95),rgba(61,40,24,.65)),url('https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center">
        <div className="absolute inset-0 bg-amber-900/10 animate-pulse" />
        <div className="relative flex justify-between items-center text-[10px] tracking-[.24em] uppercase"><b>L'ÉTOILE</b><button onClick={() => document.getElementById('preview-reservation')?.scrollIntoView()} className="border border-amber-200/60 px-3 py-2 hover:bg-amber-100 hover:text-black">Reserve</button></div>
        <div className="relative mt-auto"><p className="text-[10px] tracking-[.25em] uppercase text-amber-200">Paris · Contemporary tasting</p><h1 className="text-5xl md:text-7xl leading-[.85] mt-3 animate-[pulse_4s_ease-in-out_infinite]">Culinary<br/><i className="text-amber-300">Artistry</i> Redefined</h1><p className="mt-8 text-xs animate-bounce">↓ Scroll to explore</p></div>
      </section>
      <section className="p-7 md:p-12 bg-[#ebe0cf] text-[#1a1510]"><p className="text-[10px] tracking-[.24em] text-amber-800">THE CHEF'S STORY</p><h2 className="text-3xl md:text-5xl max-w-3xl mt-3">Memory, fire and the quiet theatre of a perfect service.</h2><div className="grid grid-cols-2 gap-3 mt-7"><img className="h-40 md:h-60 w-full object-cover" src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80" alt="Fine dining plate"/><img className="h-40 md:h-60 w-full object-cover translate-y-5" src="https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=80" alt="Chef plating a dish"/></div></section>
      <section className="p-7 md:p-12"><p className="text-[10px] tracking-[.24em] text-amber-300">À LA CARTE</p><div className="flex gap-2 flex-wrap my-5">{['All', 'Tasting Menu', 'Mains', 'Cocktails', 'Desserts'].map((item) => <button key={item} onClick={() => setCategory(item)} className={`text-xs border px-3 py-2 transition-all ${category === item ? 'bg-amber-300 text-black border-amber-300' : 'border-amber-100/40 hover:border-amber-200'}`}>{item}</button>)}</div><div>{visible.map(([dish, type, price]) => <div key={dish} className="grid grid-cols-[1fr_auto] border-t border-amber-100/20 py-4 hover:translate-x-1 transition-transform"><div><span className="text-[10px] text-amber-300">{type}</span><h3 className="text-xl">{dish}</h3></div><b>{price}</b></div>)}</div></section>
      <section id="preview-reservation" className="p-7 md:p-12 text-center bg-[#251a12]"><p className="text-[10px] tracking-[.24em] text-amber-300">RESERVATIONS</p><h2 className="text-4xl mt-2">Join us after dusk.</h2>{reserved ? <p className="mt-5 text-amber-200 animate-pulse">Your table is held. We look forward to welcoming you.</p> : <form onSubmit={(event) => { event.preventDefault(); setReserved(true); }} className="mt-6 grid gap-2 max-w-md mx-auto"><input required aria-label="Name" placeholder="Your name" className="p-3 bg-black/20 border border-amber-100/30"/><input required type="date" aria-label="Date" className="p-3 bg-black/20 border border-amber-100/30"/><button className="bg-amber-300 text-black py-3 font-bold hover:bg-amber-200">Request a table</button></form>}</section>
    </div>
  );
}

// ==========================================
// 1. FULLY FUNCTIONING INTERACTIVE CALCULATOR
// ==========================================
function InteractiveCalculator({ appName }: { appName: string }) {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [mode, setMode] = useState<'standard' | 'scientific' | 'converter'>('standard');
  const [memory, setMemory] = useState<number>(0);
  const [history, setHistory] = useState<Array<{ expr: string; result: string; timestamp: string }>>([
    { expr: '24 × 15', result: '360', timestamp: '10:14 AM' },
    { expr: '1,250 ÷ 5', result: '250', timestamp: '10:12 AM' },
    { expr: 'sqrt(144) + 18', result: '30', timestamp: '10:08 AM' }
  ]);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Unit Converter State
  const [convertCategory, setConvertCategory] = useState<'length' | 'weight' | 'temp'>('length');
  const [fromUnit, setFromUnit] = useState('meters');
  const [toUnit, setToUnit] = useState('feet');
  const [convertInput, setConvertInput] = useState('1');

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Never intercept keyboard events when user is typing in an input, textarea, or editable element (e.g. AuthModal, forms, signup)
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable ||
          target.getAttribute('contenteditable') === 'true' ||
          target.closest('input') ||
          target.closest('textarea') ||
          target.closest('[contenteditable="true"]'))
      ) {
        return;
      }

      if (mode === 'converter') return;
      if (e.key >= '0' && e.key <= '9') {
        inputDigit(e.key);
      } else if (e.key === '.') {
        inputDecimal();
      } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
        e.preventDefault();
        const opMap: Record<string, string> = { '+': '+', '-': '−', '*': '×', '/': '÷' };
        handleOperator(opMap[e.key]);
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, display, waitingForOperand, operator, prevValue]);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const handleBackspace = () => {
    if (waitingForOperand) return;
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleOperator = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(inputValue);
      setExpression(`${display} ${nextOperator}`);
    } else if (operator) {
      const current = prevValue || 0;
      const newValue = calculate(current, inputValue, operator);
      setPrevValue(newValue);
      setDisplay(String(newValue));
      setExpression(`${newValue} ${nextOperator}`);
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+':
        return a + b;
      case '−':
      case '-':
        return a - b;
      case '×':
      case '*':
        return a * b;
      case '÷':
      case '/':
        return b !== 0 ? a / b : 0;
      case '%':
        return a % b;
      case '^':
        return Math.pow(a, b);
      default:
        return b;
    }
  };

  const handleEquals = () => {
    if (operator === null || prevValue === null) return;
    const inputValue = parseFloat(display);
    const result = calculate(prevValue, inputValue, operator);
    const formattedResult = Number.isInteger(result) ? String(result) : String(parseFloat(result.toFixed(8)));

    const exprString = `${prevValue} ${operator} ${inputValue}`;
    setHistory((prev) => [
      { expr: exprString, result: formattedResult, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ...prev.slice(0, 19)
    ]);

    setDisplay(formattedResult);
    setExpression(`${exprString} =`);
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const handleScientific = (fn: string) => {
    const val = parseFloat(display);
    let res = 0;
    let label = '';

    switch (fn) {
      case 'sin':
        res = Math.sin((val * Math.PI) / 180);
        label = `sin(${val}°)`;
        break;
      case 'cos':
        res = Math.cos((val * Math.PI) / 180);
        label = `cos(${val}°)`;
        break;
      case 'tan':
        res = Math.tan((val * Math.PI) / 180);
        label = `tan(${val}°)`;
        break;
      case 'sqrt':
        res = val >= 0 ? Math.sqrt(val) : 0;
        label = `√(${val})`;
        break;
      case 'sqr':
        res = val * val;
        label = `sqr(${val})`;
        break;
      case 'log':
        res = val > 0 ? Math.log10(val) : 0;
        label = `log(${val})`;
        break;
      case 'ln':
        res = val > 0 ? Math.log(val) : 0;
        label = `ln(${val})`;
        break;
      case '1/x':
        res = val !== 0 ? 1 / val : 0;
        label = `1/(${val})`;
        break;
      case '+/-':
        res = val * -1;
        break;
      case 'pi':
        res = Math.PI;
        label = 'π';
        break;
      case 'e':
        res = Math.E;
        label = 'e';
        break;
      case 'fact':
        const n = Math.floor(Math.abs(val));
        let f = 1;
        for (let i = 2; i <= Math.min(n, 12); i++) f *= i;
        res = f;
        label = `fact(${n})`;
        break;
      default:
        res = val;
    }

    const formatted = Number.isInteger(res) ? String(res) : String(parseFloat(res.toFixed(8)));
    setDisplay(formatted);
    if (label) setExpression(`${label} =`);
    setWaitingForOperand(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert Calculation
  const calculateConversion = () => {
    const val = parseFloat(convertInput) || 0;
    if (convertCategory === 'length') {
      const inMeters: Record<string, number> = { meters: 1, feet: 0.3048, inches: 0.0254, kilometers: 1000, miles: 1609.34 };
      const meters = val * (inMeters[fromUnit] || 1);
      const res = meters / (inMeters[toUnit] || 1);
      return res.toFixed(4);
    }
    if (convertCategory === 'weight') {
      const inKg: Record<string, number> = { kilograms: 1, pounds: 0.453592, ounces: 0.0283495, grams: 0.001 };
      const kg = val * (inKg[fromUnit] || 1);
      const res = kg / (inKg[toUnit] || 1);
      return res.toFixed(4);
    }
    if (convertCategory === 'temp') {
      if (fromUnit === 'celsius' && toUnit === 'fahrenheit') return ((val * 9) / 5 + 32).toFixed(2);
      if (fromUnit === 'fahrenheit' && toUnit === 'celsius') return (((val - 32) * 5) / 9).toFixed(2);
      if (fromUnit === 'celsius' && toUnit === 'kelvin') return (val + 273.15).toFixed(2);
      if (fromUnit === 'kelvin' && toUnit === 'celsius') return (val - 273.15).toFixed(2);
      return String(val);
    }
    return '0';
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 space-y-6 select-none font-sans" id="interactive-calculator-app">
      {/* Calculator Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#222] gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-lg">
            <CalcIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">{appName || 'Smart Precision Calculator'}</h2>
            <p className="text-xs text-slate-400 font-mono">100% Operational • Keyboard Shortcuts Enabled</p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center bg-[#111] p-1 border border-[#222] rounded-lg text-xs font-mono">
          <button
            onClick={() => setMode('standard')}
            className={`px-3 py-1.5 rounded font-bold transition ${mode === 'standard' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Standard
          </button>
          <button
            onClick={() => setMode('scientific')}
            className={`px-3 py-1.5 rounded font-bold transition ${mode === 'scientific' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Scientific
          </button>
          <button
            onClick={() => setMode('converter')}
            className={`px-3 py-1.5 rounded font-bold transition ${mode === 'converter' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Unit Converter
          </button>
        </div>
      </div>

      {mode === 'converter' ? (
        /* Unit Converter View */
        <div className="bg-[#121215] border border-[#222] rounded-2xl p-6 md:p-8 space-y-6 max-w-xl mx-auto shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#222] pb-4">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-violet-400" />
              <span>Unit Converter Engine</span>
            </h3>
            <div className="flex gap-2">
              {(['length', 'weight', 'temp'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setConvertCategory(cat);
                    if (cat === 'length') { setFromUnit('meters'); setToUnit('feet'); }
                    if (cat === 'weight') { setFromUnit('kilograms'); setToUnit('pounds'); }
                    if (cat === 'temp') { setFromUnit('celsius'); setToUnit('fahrenheit'); }
                  }}
                  className={`px-2.5 py-1 text-xs font-mono uppercase font-bold rounded ${convertCategory === cat ? 'bg-violet-600 text-white' : 'bg-[#1a1a1e] text-slate-400 hover:text-white'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase text-slate-400">From</label>
              <input
                type="number"
                value={convertInput}
                onChange={(e) => setConvertInput(e.target.value)}
                className="w-full bg-[#09090b] border border-[#333] px-4 py-3 text-lg font-mono text-white rounded-lg outline-none focus:border-violet-500"
              />
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className="w-full bg-[#1a1a1e] border border-[#333] px-3 py-2 text-xs font-mono text-white rounded-lg outline-none"
              >
                {convertCategory === 'length' && (
                  <>
                    <option value="meters">Meters (m)</option>
                    <option value="feet">Feet (ft)</option>
                    <option value="inches">Inches (in)</option>
                    <option value="kilometers">Kilometers (km)</option>
                    <option value="miles">Miles (mi)</option>
                  </>
                )}
                {convertCategory === 'weight' && (
                  <>
                    <option value="kilograms">Kilograms (kg)</option>
                    <option value="pounds">Pounds (lbs)</option>
                    <option value="ounces">Ounces (oz)</option>
                    <option value="grams">Grams (g)</option>
                  </>
                )}
                {convertCategory === 'temp' && (
                  <>
                    <option value="celsius">Celsius (°C)</option>
                    <option value="fahrenheit">Fahrenheit (°F)</option>
                    <option value="kelvin">Kelvin (K)</option>
                  </>
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase text-slate-400">To (Calculated)</label>
              <div className="w-full bg-[#09090b] border border-violet-500/40 px-4 py-3 text-lg font-mono text-violet-300 font-bold rounded-lg flex items-center justify-between">
                <span>{calculateConversion()}</span>
                <span className="text-xs text-slate-500 font-normal">{toUnit}</span>
              </div>
              <select
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                className="w-full bg-[#1a1a1e] border border-[#333] px-3 py-2 text-xs font-mono text-white rounded-lg outline-none"
              >
                {convertCategory === 'length' && (
                  <>
                    <option value="feet">Feet (ft)</option>
                    <option value="meters">Meters (m)</option>
                    <option value="inches">Inches (in)</option>
                    <option value="kilometers">Kilometers (km)</option>
                    <option value="miles">Miles (mi)</option>
                  </>
                )}
                {convertCategory === 'weight' && (
                  <>
                    <option value="pounds">Pounds (lbs)</option>
                    <option value="kilograms">Kilograms (kg)</option>
                    <option value="ounces">Ounces (oz)</option>
                    <option value="grams">Grams (g)</option>
                  </>
                )}
                {convertCategory === 'temp' && (
                  <>
                    <option value="fahrenheit">Fahrenheit (°F)</option>
                    <option value="celsius">Celsius (°C)</option>
                    <option value="kelvin">Kelvin (K)</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>
      ) : (
        /* Main Calculator & History Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Calculator Pad */}
          <div className="lg:col-span-2 bg-[#121215] border border-[#222] rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            {/* Display Screen */}
            <div className="bg-[#050507] border border-[#222] rounded-2xl p-5 space-y-2 relative shadow-inner">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 min-h-[20px]">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] uppercase font-bold text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-500/20">
                    {mode}
                  </span>
                  {memory !== 0 && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      M = {memory}
                    </span>
                  )}
                </div>
                <span className="truncate max-w-[280px] text-slate-400">{expression || '\u00A0'}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-3xl md:text-5xl font-mono font-black text-white tracking-tight overflow-x-auto truncate">
                  {display}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-2 text-slate-400 hover:text-white bg-[#111] hover:bg-[#222] rounded-lg transition shrink-0"
                  title="Copy result to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Memory Buttons */}
            <div className="grid grid-cols-5 gap-2 text-xs font-mono">
              <button
                onClick={() => setMemory(0)}
                className="py-2 bg-[#18181c] hover:bg-[#222] text-slate-400 hover:text-white rounded-lg font-bold transition"
              >
                MC
              </button>
              <button
                onClick={() => {
                  setDisplay(String(memory));
                  setWaitingForOperand(true);
                }}
                className="py-2 bg-[#18181c] hover:bg-[#222] text-slate-400 hover:text-white rounded-lg font-bold transition"
              >
                MR
              </button>
              <button
                onClick={() => setMemory((m) => m + parseFloat(display))}
                className="py-2 bg-[#18181c] hover:bg-[#222] text-violet-400 hover:text-violet-300 rounded-lg font-bold transition"
              >
                M+
              </button>
              <button
                onClick={() => setMemory((m) => m - parseFloat(display))}
                className="py-2 bg-[#18181c] hover:bg-[#222] text-violet-400 hover:text-violet-300 rounded-lg font-bold transition"
              >
                M-
              </button>
              <button
                onClick={() => setMemory(parseFloat(display))}
                className="py-2 bg-[#18181c] hover:bg-[#222] text-slate-400 hover:text-white rounded-lg font-bold transition"
              >
                MS
              </button>
            </div>

            {/* Scientific Function Keys (if Scientific Mode) */}
            {mode === 'scientific' && (
              <div className="grid grid-cols-6 gap-2 text-xs font-mono">
                {['sin', 'cos', 'tan', 'sqrt', 'sqr', 'fact', 'log', 'ln', '1/x', 'pi', 'e', '+/-'].map((fn) => (
                  <button
                    key={fn}
                    onClick={() => handleScientific(fn)}
                    className="py-2.5 bg-[#1a1a20] hover:bg-violet-900/40 text-violet-300 hover:text-white rounded-lg font-bold transition border border-violet-500/10 active:scale-95"
                  >
                    {fn}
                  </button>
                ))}
              </div>
            )}

            {/* Standard Keypad */}
            <div className="grid grid-cols-4 gap-2.5">
              {/* Row 1 */}
              <button
                onClick={handleClear}
                className="py-3.5 md:py-4 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 rounded-xl font-bold font-mono text-base transition active:scale-95"
              >
                AC
              </button>
              <button
                onClick={handleBackspace}
                className="py-3.5 md:py-4 bg-[#1e1e24] hover:bg-[#282830] text-slate-200 rounded-xl font-bold font-mono text-base transition flex items-center justify-center active:scale-95"
              >
                <Delete className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleScientific('+/-')}
                className="py-3.5 md:py-4 bg-[#1e1e24] hover:bg-[#282830] text-slate-200 rounded-xl font-bold font-mono text-base transition active:scale-95"
              >
                ±
              </button>
              <button
                onClick={() => handleOperator('÷')}
                className="py-3.5 md:py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black font-mono text-xl transition active:scale-95 shadow"
              >
                ÷
              </button>

              {/* Row 2 */}
              <button
                onClick={() => inputDigit('7')}
                className="py-3.5 md:py-4 bg-[#18181c] hover:bg-[#222228] text-white rounded-xl font-bold font-mono text-xl transition active:scale-95 border border-[#222]"
              >
                7
              </button>
              <button
                onClick={() => inputDigit('8')}
                className="py-3.5 md:py-4 bg-[#18181c] hover:bg-[#222228] text-white rounded-xl font-bold font-mono text-xl transition active:scale-95 border border-[#222]"
              >
                8
              </button>
              <button
                onClick={() => inputDigit('9')}
                className="py-3.5 md:py-4 bg-[#18181c] hover:bg-[#222228] text-white rounded-xl font-bold font-mono text-xl transition active:scale-95 border border-[#222]"
              >
                9
              </button>
              <button
                onClick={() => handleOperator('×')}
                className="py-3.5 md:py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black font-mono text-xl transition active:scale-95 shadow"
              >
                ×
              </button>

              {/* Row 3 */}
              <button
                onClick={() => inputDigit('4')}
                className="py-3.5 md:py-4 bg-[#18181c] hover:bg-[#222228] text-white rounded-xl font-bold font-mono text-xl transition active:scale-95 border border-[#222]"
              >
                4
              </button>
              <button
                onClick={() => inputDigit('5')}
                className="py-3.5 md:py-4 bg-[#18181c] hover:bg-[#222228] text-white rounded-xl font-bold font-mono text-xl transition active:scale-95 border border-[#222]"
              >
                5
              </button>
              <button
                onClick={() => inputDigit('6')}
                className="py-3.5 md:py-4 bg-[#18181c] hover:bg-[#222228] text-white rounded-xl font-bold font-mono text-xl transition active:scale-95 border border-[#222]"
              >
                6
              </button>
              <button
                onClick={() => handleOperator('−')}
                className="py-3.5 md:py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black font-mono text-xl transition active:scale-95 shadow"
              >
                −
              </button>

              {/* Row 4 */}
              <button
                onClick={() => inputDigit('1')}
                className="py-3.5 md:py-4 bg-[#18181c] hover:bg-[#222228] text-white rounded-xl font-bold font-mono text-xl transition active:scale-95 border border-[#222]"
              >
                1
              </button>
              <button
                onClick={() => inputDigit('2')}
                className="py-3.5 md:py-4 bg-[#18181c] hover:bg-[#222228] text-white rounded-xl font-bold font-mono text-xl transition active:scale-95 border border-[#222]"
              >
                2
              </button>
              <button
                onClick={() => inputDigit('3')}
                className="py-3.5 md:py-4 bg-[#18181c] hover:bg-[#222228] text-white rounded-xl font-bold font-mono text-xl transition active:scale-95 border border-[#222]"
              >
                3
              </button>
              <button
                onClick={() => handleOperator('+')}
                className="py-3.5 md:py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black font-mono text-xl transition active:scale-95 shadow"
              >
                +
              </button>

              {/* Row 5 */}
              <button
                onClick={() => inputDigit('0')}
                className="col-span-2 py-3.5 md:py-4 bg-[#18181c] hover:bg-[#222228] text-white rounded-xl font-bold font-mono text-xl transition active:scale-95 border border-[#222]"
              >
                0
              </button>
              <button
                onClick={inputDecimal}
                className="py-3.5 md:py-4 bg-[#18181c] hover:bg-[#222228] text-white rounded-xl font-bold font-mono text-xl transition active:scale-95 border border-[#222]"
              >
                .
              </button>
              <button
                onClick={handleEquals}
                className="py-3.5 md:py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl font-black font-mono text-2xl transition active:scale-95 shadow-lg flex items-center justify-center"
              >
                =
              </button>
            </div>
          </div>

          {/* History Tape & Quick Reference */}
          <div className="bg-[#121215] border border-[#222] rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <History className="w-4 h-4 text-violet-400" />
                <span>Calculation History</span>
              </span>
              <button
                onClick={() => setHistory([])}
                className="text-[10px] font-mono text-slate-500 hover:text-rose-400 uppercase font-bold"
              >
                Clear
              </button>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {history.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs font-mono">
                  No calculations yet. Start calculating to record history.
                </div>
              ) : (
                history.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setDisplay(item.result);
                      setExpression(item.expr + ' =');
                      setWaitingForOperand(true);
                    }}
                    className="p-3 bg-[#0a0a0d] hover:bg-[#18181f] border border-[#222] rounded-xl cursor-pointer transition group"
                  >
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>{item.timestamp}</span>
                      <span className="text-violet-400 opacity-0 group-hover:opacity-100 transition">Replay →</span>
                    </div>
                    <div className="text-xs font-mono text-slate-300 mt-1">{item.expr}</div>
                    <div className="text-base font-mono font-bold text-emerald-400 mt-0.5 text-right">= {item.result}</div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Keyboard Reference */}
            <div className="pt-3 border-t border-[#222] text-[10px] font-mono text-slate-400 space-y-1">
              <div className="font-bold uppercase tracking-wider text-slate-300">Keyboard Shortcuts:</div>
              <div>• Numbers: [0 - 9], Decimal: [.]</div>
              <div>• Operators: [+], [-], [*], [/]</div>
              <div>• Calculate: [Enter] or [=]</div>
              <div>• Clear: [Esc] or [C], Backspace: [⌫]</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. FULLY FUNCTIONING TODO & TASK MANAGER
// ==========================================
function InteractiveTodoList({ appName, prompt }: { appName: string; prompt: string }) {
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Synthesize responsive UI layout', category: 'Design', completed: true, priority: 'high' },
    { id: '2', title: 'Verify database persistence contracts', category: 'Backend', completed: true, priority: 'high' },
    { id: '3', title: 'Implement full-stack state management', category: 'Frontend', completed: false, priority: 'medium' },
    { id: '4', title: 'Run automated QA test suites & regression probe', category: 'Testing', completed: false, priority: 'high' },
    { id: '5', title: 'Deploy container image on port 3000', category: 'DevOps', completed: false, priority: 'low' }
  ]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Frontend');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setTasks([
      { id: String(Date.now()), title: newTitle.trim(), category: newCategory, completed: false, priority: newPriority },
      ...tasks
    ]);
    setNewTitle('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 space-y-6 select-none font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#222] gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">{appName || 'Smart Task Flow'}</h2>
            <p className="text-xs text-slate-400 font-mono">100% Operational • {completedCount} of {tasks.length} Completed</p>
          </div>
        </div>

        <div className="flex items-center bg-[#111] p-1 border border-[#222] rounded-lg text-xs font-mono">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded font-bold uppercase transition ${filter === f ? 'bg-white text-black' : 'text-slate-400 hover:text-white'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleAddTask} className="bg-[#121215] border border-[#222] p-4 rounded-2xl flex flex-col sm:flex-row gap-3 shadow-lg">
        <input
          type="text"
          placeholder="Add a new task or milestone..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 bg-[#09090b] border border-[#333] px-4 py-2.5 text-sm text-white rounded-xl outline-none focus:border-emerald-500 placeholder-slate-500 font-sans"
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="bg-[#1a1a1e] border border-[#333] px-3 py-2.5 text-xs text-white rounded-xl outline-none font-mono"
        >
          <option value="Frontend">Frontend</option>
          <option value="Backend">Backend</option>
          <option value="Design">Design</option>
          <option value="Testing">Testing</option>
          <option value="DevOps">DevOps</option>
        </select>
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value as any)}
          className="bg-[#1a1a1e] border border-[#333] px-3 py-2.5 text-xs text-white rounded-xl outline-none font-mono"
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium</option>
          <option value="high">High Priority</option>
        </select>
        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase px-5 py-2.5 rounded-xl transition shadow flex items-center justify-center space-x-1 font-mono"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </form>

      <div className="space-y-2.5">
        {filteredTasks.map((t) => (
          <div
            key={t.id}
            className={`p-4 bg-[#121215] border border-[#222] rounded-2xl flex items-center justify-between gap-4 transition ${t.completed ? 'opacity-60 bg-[#0c0c0e]' : 'hover:border-slate-700'}`}
          >
            <div className="flex items-center space-x-3.5 flex-1 min-w-0">
              <input
                type="checkbox"
                checked={t.completed}
                onChange={() => toggleTask(t.id)}
                className="w-5 h-5 rounded border-[#444] text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-bold truncate ${t.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                  {t.title}
                </p>
                <div className="flex items-center space-x-2 mt-1 text-[10px] font-mono">
                  <span className="bg-[#1a1a1e] text-slate-400 px-2 py-0.5 rounded border border-[#333]">{t.category}</span>
                  <span className={`px-2 py-0.5 rounded uppercase font-bold ${t.priority === 'high' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : t.priority === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400'}`}>
                    {t.priority}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => deleteTask(t.id)}
              className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-[#1a1a1e] transition"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 3. FULLY FUNCTIONING NOTES & SCRATCHPAD
// ==========================================
function InteractiveNotesApp({ appName, prompt }: { appName: string; prompt: string }) {
  const [notes, setNotes] = useState([
    { id: '1', title: 'System Architecture Notes', content: 'Microservice running on Node 22 with TypeScript bundler. Port 3000 ingress mapped directly to container.', date: 'Today' },
    { id: '2', title: 'API Endpoints Reference', content: 'CRUD routes: /api/entities (GET, POST), /api/health (status, uptime), /api/stream (live logs).', date: 'Yesterday' }
  ]);
  const [activeNoteId, setActiveNoteId] = useState('1');
  const [search, setSearch] = useState('');

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0];

  const updateContent = (content: string) => {
    setNotes(notes.map((n) => (n.id === activeNote.id ? { ...n, content } : n)));
  };

  const updateTitle = (title: string) => {
    setNotes(notes.map((n) => (n.id === activeNote.id ? { ...n, title } : n)));
  };

  const addNewNote = () => {
    const newId = String(Date.now());
    const newNote = { id: newId, title: 'Untitled Document', content: '', date: 'Just now' };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newId);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8 space-y-6 font-sans">
      <div className="flex items-center justify-between pb-4 border-b border-[#222]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">{appName || 'Document Canvas'}</h2>
            <p className="text-xs text-slate-400 font-mono">Real-time Scratchpad & Markdown Editor</p>
          </div>
        </div>
        <button
          onClick={addNewNote}
          className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold uppercase px-4 py-2 rounded-xl transition flex items-center space-x-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#121215] border border-[#222] rounded-2xl p-4 space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#09090b] border border-[#333] pl-9 pr-3 py-2 text-xs text-white rounded-lg outline-none focus:border-amber-500"
            />
          </div>
          <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
            {notes
              .filter((n) => n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()))
              .map((n) => (
                <div
                  key={n.id}
                  onClick={() => setActiveNoteId(n.id)}
                  className={`p-3 rounded-xl cursor-pointer transition ${activeNoteId === n.id ? 'bg-amber-600/20 border border-amber-500/40 text-white' : 'bg-[#09090b] border border-[#222] text-slate-400 hover:text-white'}`}
                >
                  <div className="font-bold text-xs truncate">{n.title || 'Untitled Document'}</div>
                  <div className="text-[10px] text-slate-500 truncate mt-1">{n.content || 'Empty note...'}</div>
                </div>
              ))}
          </div>
        </div>

        <div className="md:col-span-2 bg-[#121215] border border-[#222] rounded-2xl p-6 space-y-4">
          <input
            type="text"
            value={activeNote?.title || ''}
            onChange={(e) => updateTitle(e.target.value)}
            className="w-full bg-transparent text-2xl font-black text-white outline-none border-b border-[#222] pb-2"
            placeholder="Note Title"
          />
          <textarea
            value={activeNote?.content || ''}
            onChange={(e) => updateContent(e.target.value)}
            placeholder="Start typing your notes, ideas, or documentation..."
            className="w-full h-80 bg-transparent text-slate-200 text-sm leading-relaxed outline-none resize-none font-sans"
          />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. FULLY FUNCTIONING WEATHER DASHBOARD
// ==========================================
function InteractiveWeatherApp({ appName }: { appName: string }) {
  const [city, setCity] = useState('San Francisco, CA');
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('F');

  const weatherData = {
    tempF: 68,
    tempC: 20,
    condition: 'Sunny & Clear',
    highF: 74,
    lowF: 55,
    humidity: '58%',
    wind: '12 mph NW',
    uv: '4 (Moderate)',
    airQuality: 'Good (34 AQI)',
    forecast: [
      { day: 'Mon', temp: 70, condition: 'Sunny' },
      { day: 'Tue', temp: 68, condition: 'Partly Cloudy' },
      { day: 'Wed', temp: 65, condition: 'Light Rain' },
      { day: 'Thu', temp: 72, condition: 'Clear' },
      { day: 'Fri', temp: 75, condition: 'Sunny' }
    ]
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 space-y-6 font-sans">
      <div className="flex items-center justify-between pb-4 border-b border-[#222]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg">
            <CloudSun className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">{appName || 'Live Atmospheric Forecast'}</h2>
            <p className="text-xs text-slate-400 font-mono">Telemetry Station • Live Weather Radar</p>
          </div>
        </div>

        <div className="flex items-center bg-[#111] p-1 border border-[#222] rounded-lg text-xs font-mono">
          <button
            onClick={() => setTempUnit('F')}
            className={`px-3 py-1.5 rounded font-bold ${tempUnit === 'F' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
          >
            °F
          </button>
          <button
            onClick={() => setTempUnit('C')}
            className={`px-3 py-1.5 rounded font-bold ${tempUnit === 'C' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
          >
            °C
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-cyan-950/40 via-[#10141a] to-[#090b0e] border border-cyan-500/20 rounded-3xl p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">Current Conditions</span>
            <h3 className="text-3xl font-black text-white mt-1">{city}</h3>
            <p className="text-slate-300 text-sm mt-0.5">{weatherData.condition}</p>
          </div>
          <div className="text-5xl md:text-7xl font-mono font-black text-white">
            {tempUnit === 'F' ? `${weatherData.tempF}°` : `${weatherData.tempC}°`}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[#222]">
          <div className="bg-[#0b0f14] p-3.5 rounded-xl border border-[#1e2630]">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Humidity</div>
            <div className="text-lg font-bold font-mono text-white mt-0.5">{weatherData.humidity}</div>
          </div>
          <div className="bg-[#0b0f14] p-3.5 rounded-xl border border-[#1e2630]">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Wind Velocity</div>
            <div className="text-lg font-bold font-mono text-white mt-0.5">{weatherData.wind}</div>
          </div>
          <div className="bg-[#0b0f14] p-3.5 rounded-xl border border-[#1e2630]">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Air Quality</div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">{weatherData.airQuality}</div>
          </div>
          <div className="bg-[#0b0f14] p-3.5 rounded-xl border border-[#1e2630]">
            <div className="text-[10px] font-mono text-slate-400 uppercase">UV Index</div>
            <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">{weatherData.uv}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. FULLY FUNCTIONING STOREFRONT & CART
// ==========================================
function InteractiveStorefront({ appName, prompt }: { appName: string; prompt: string }) {
  const [cart, setCart] = useState<Array<{ id: string; name: string; price: number; quantity: number }>>([]);
  const [orderComplete, setOrderComplete] = useState(false);

  const products = [
    { id: 'p1', name: 'High-Performance Cloud Compute Pod', category: 'Infrastructure', price: 49, rating: 4.9 },
    { id: 'p2', name: 'Autonomous Agent Swarm Runtime Pack', category: 'AI Tools', price: 99, rating: 5.0 },
    { id: 'p3', name: 'Low-Latency WebSocket Bridge', category: 'Networking', price: 29, rating: 4.8 },
    { id: 'p4', name: 'Enterprise PostgreSQL Cluster Node', category: 'Database', price: 79, rating: 4.9 }
  ];

  const addToCart = (p: typeof products[0]) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === p.id);
      if (existing) {
        return prev.map((item) => (item.id === p.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...prev, { id: p.id, name: p.name, price: p.price, quantity: 1 }];
    });
  };

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8 space-y-6 font-sans">
      <div className="flex items-center justify-between pb-4 border-b border-[#222]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 to-rose-500 flex items-center justify-center text-white shadow-lg">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">{appName || 'Modern Digital Marketplace'}</h2>
            <p className="text-xs text-slate-400 font-mono">100% Operational Cart & Instant Checkout</p>
          </div>
        </div>
        <div className="text-sm font-mono font-bold text-white bg-[#121215] border border-[#222] px-3.5 py-2 rounded-xl">
          Cart ({cart.reduce((a, b) => a + b.quantity, 0)}) • ${total}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((prod) => (
          <div key={prod.id} className="bg-[#121215] border border-[#222] p-5 rounded-2xl space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-pink-400 uppercase font-bold">{prod.category}</span>
              <h4 className="text-sm font-bold text-white mt-1 leading-tight">{prod.name}</h4>
              <div className="text-xs text-slate-400 mt-1">★ {prod.rating} Star Verified</div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[#222]">
              <span className="text-lg font-black font-mono text-white">${prod.price}</span>
              <button
                onClick={() => addToCart(prod)}
                className="bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold uppercase px-3 py-1.5 rounded-lg transition"
              >
                + Add
              </button>
            </div>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="bg-[#121215] border border-[#222] p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Your Shopping Cart</h3>
          <div className="divide-y divide-[#222]">
            {cart.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-200 font-bold">{item.name} × {item.quantity}</span>
                <span className="font-mono text-white font-bold">${item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[#222] text-base font-bold text-white">
            <span>Total:</span>
            <span className="text-emerald-400 font-mono">${total}</span>
          </div>
          <button
            onClick={() => {
              setOrderComplete(true);
              setCart([]);
            }}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold uppercase text-xs py-3 rounded-xl shadow-lg transition"
          >
            Complete Order Simulation
          </button>
        </div>
      )}

      {orderComplete && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center font-mono text-xs text-emerald-300 font-bold">
          ✓ Order successfully simulated and dispatched to queue!
        </div>
      )}
    </div>
  );
}

// ==========================================
// 6. GENERAL DYNAMIC INTERACTIVE WEB APPLICATION
// ==========================================
function InteractiveDynamicApp({ project }: { project: Project }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [items, setItems] = useState([
    { id: 'rec_1', name: 'Core Application Engine', category: 'Runtime', status: 'Active', value: '4,280 ops/sec' },
    { id: 'rec_2', name: 'Ingress Port 3000 Gateway', category: 'Network', status: 'Optimal', value: '12ms latency' },
    { id: 'rec_3', name: 'Dynamic State Controller', category: 'UI Core', status: 'Mounted', value: '60 FPS' },
    { id: 'rec_4', name: 'ACID Relational Persistence', category: 'Storage', status: 'Synchronized', value: '100% integrity' }
  ]);
  const [newItemName, setNewItemName] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    setItems([
      { id: `rec_${Date.now()}`, name: newItemName.trim(), category: 'Custom Item', status: 'Active', value: 'Created' },
      ...items
    ]);
    setNewItemName('');
    setNotice(`Item "${newItemName.trim()}" added to live application state.`);
    setTimeout(() => setNotice(null), 2500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8 space-y-6 font-sans">
      <div className="bg-gradient-to-r from-violet-950/40 via-[#121216] to-[#0a0a0d] border border-violet-500/20 p-6 md:p-8 rounded-3xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-violet-400 uppercase tracking-widest font-bold">
            Live Web Application
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
            ONLINE • PORT 3000
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">{project.name}</h2>
        <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
          {project.description || project.prompt}
        </p>
      </div>

      {notice && (
        <div className="bg-violet-600 text-white text-xs font-mono py-2 px-4 rounded-xl text-center font-bold animate-fadeIn">
          {notice}
        </div>
      )}

      {/* Interactive Controls */}
      <form onSubmit={handleAddItem} className="bg-[#121215] border border-[#222] p-4 rounded-2xl flex gap-3">
        <input
          type="text"
          placeholder="Enter item name to test live reactive state..."
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          className="flex-1 bg-[#09090b] border border-[#333] px-4 py-2.5 text-xs text-white rounded-xl outline-none focus:border-violet-500"
        />
        <button
          type="submit"
          className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase px-5 py-2.5 rounded-xl transition shadow"
        >
          Add Record
        </button>
      </form>

      {/* Grid of Records */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-[#121215] border border-[#222] p-4 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400">{item.category}</span>
              <span className="text-emerald-400 font-mono font-bold">{item.status}</span>
            </div>
            <div className="text-base font-bold text-white">{item.name}</div>
            <div className="text-xs text-slate-400 font-mono">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
