import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Layout,
  Database,
  ShoppingCart,
  MessageSquare,
  Terminal,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Cpu,
  Layers,
  X
} from 'lucide-react';
import SEOHead from '../components/SEOHead';
import { PAGE_SEO } from '../lib/seoConfig';
import { BlueprintTemplate } from '../types';
import { fetchFirestoreTemplates, saveFirestoreTemplate, DEFAULT_TEMPLATES } from '../lib/firestoreService';
import { useAuth } from '../contexts/AuthContext';

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<BlueprintTemplate[]>(DEFAULT_TEMPLATES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  // Form state for creating custom blueprint
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'SaaS' | 'Analytics' | 'E-Commerce' | 'AI Tools' | 'Developer Tools'>('SaaS');
  const [newDescription, setNewDescription] = useState('');
  const [newTags, setNewTags] = useState('React, Tailwind, TypeScript');
  const [newPrompt, setNewPrompt] = useState('');
  const [newDifficulty, setNewDifficulty] = useState<'Beginner' | 'Intermediate' | 'Enterprise'>('Intermediate');
  const [newEstimatedFiles, setNewEstimatedFiles] = useState(15);

  const categories = ['All', 'SaaS', 'Analytics', 'E-Commerce', 'AI Tools', 'Developer Tools'];

  // Load blueprints from Firestore database on mount
  useEffect(() => {
    let isMounted = true;
    async function loadTemplates() {
      setIsLoading(true);
      try {
        const firestoreList = await fetchFirestoreTemplates();
        if (isMounted && firestoreList && firestoreList.length > 0) {
          setTemplates(firestoreList);
        }
      } catch (err) {
        console.warn('Using default blueprints due to fetch error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadTemplates();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredTemplates = templates.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = (prompt: string) => {
    // Navigate to builder with prefilled prompt state
    navigate('/', { state: { prefilledPrompt: prompt } });
  };

  const handleCreateBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrompt.trim()) return;

    setIsSaving(true);
    const customTemplate: BlueprintTemplate = {
      id: `bp_${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      description: newDescription.trim() || 'Custom user blueprint crafted for DevForge AI swarm.',
      tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
      suggestedPrompt: newPrompt.trim(),
      difficulty: newDifficulty,
      estimatedFiles: Number(newEstimatedFiles) || 12,
      author: user?.displayName || user?.email || 'Architect',
      createdAt: new Date().toISOString().split('T')[0]
    };

    try {
      await saveFirestoreTemplate(customTemplate);
      setTemplates((prev) => [customTemplate, ...prev]);
      setShowAddModal(false);
      setFeedbackMsg(`Blueprint "${customTemplate.title}" saved to Firestore database!`);
      setTimeout(() => setFeedbackMsg(''), 4000);

      // Reset form
      setNewTitle('');
      setNewDescription('');
      setNewPrompt('');
    } catch (err) {
      console.error('Failed to save blueprint to Firestore:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 text-slate-100" id="templates-page">
      <SEOHead {...PAGE_SEO.templates} />

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-mono font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Production-Ready Blueprints</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono">
          Start Faster with Autonomous Templates
        </h1>
        <p className="text-base sm:text-lg text-slate-400 font-sans leading-relaxed">
          Select an architectural blueprint crafted and validated by DevForge AI swarms.
          Customize the requirements or let the agents forge the complete solution instantly.
        </p>

        {/* Firestore Database Connection Pill */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3 font-mono text-xs">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#101827] border border-cyan-500/30 text-cyan-300">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Database: Firestore Synced</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <span className="text-slate-500 text-[11px]">
            Collection: <code className="text-slate-400">/templates</code> ({templates.length} blueprints)
          </span>
        </div>
      </div>

      {/* Success Notification Banner */}
      {feedbackMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg('')} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#0c0c0c] border border-[#222222] p-4 font-mono text-xs">
        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 border transition whitespace-nowrap uppercase tracking-wider ${
                selectedCategory === cat
                  ? 'bg-violet-600 border-violet-500 text-white font-bold'
                  : 'bg-[#141414] border-[#262626] text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search templates or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-1.5 bg-violet-600 hover:bg-violet-500 text-white px-3.5 py-1.5 font-bold uppercase tracking-wider transition whitespace-nowrap shadow-sm"
            id="btn-add-blueprint"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save Blueprint</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3 font-mono text-slate-400">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs">Loading blueprints from Firestore database...</p>
        </div>
      ) : (
        /* Grid of Templates */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-[#0c0c0c] border border-[#222222] p-6 hover:border-violet-500/40 transition-all flex flex-col justify-between group"
              id={`template-card-${template.id}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-violet-500/10 border border-violet-500/30 text-violet-400 uppercase tracking-wider font-bold">
                    {template.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    ~{template.estimatedFiles} source files
                  </span>
                </div>

                <h2 className="text-xl font-bold text-white font-mono group-hover:text-violet-300 transition">
                  {template.title}
                </h2>

                <p className="text-sm text-slate-400 font-sans leading-relaxed">
                  {template.description}
                </p>

                <div className="p-3 bg-[#111111] border border-[#1e1e1e] font-mono text-[11px] text-slate-300 rounded-sm">
                  <div className="text-violet-400 font-bold mb-1 flex items-center gap-1">
                    <Terminal className="w-3 h-3" />
                    <span>Orchestrator Prompt Preview:</span>
                  </div>
                  <p className="line-clamp-2 text-slate-400 italic">&ldquo;{template.suggestedPrompt}&rdquo;</p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono px-2 py-0.5 bg-[#161616] border border-[#262626] text-slate-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-[#1a1a1a]">
                <button
                  onClick={() => handleUseTemplate(template.suggestedPrompt)}
                  className="w-full inline-flex items-center justify-center space-x-2 bg-[#141414] hover:bg-violet-600 border border-[#262626] hover:border-violet-500 text-white py-2.5 px-4 font-mono text-xs font-bold uppercase tracking-wider transition group-hover:shadow-lg"
                  id={`btn-use-template-${template.id}`}
                >
                  <span>Forge with this Blueprint</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Custom Blueprint Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c0c0c] border border-[#262626] max-w-lg w-full p-6 space-y-5 font-mono text-xs animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="flex items-center space-x-2 text-violet-400 font-bold uppercase tracking-wider">
                <Plus className="w-4 h-4" />
                <span>Save New Blueprint to Firestore</span>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBlueprint} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">Blueprint Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Microservices Health Dashboard"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#141414] border border-[#262626] px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-[#141414] border border-[#262626] px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="SaaS">SaaS</option>
                    <option value="Analytics">Analytics</option>
                    <option value="E-Commerce">E-Commerce</option>
                    <option value="AI Tools">AI Tools</option>
                    <option value="Developer Tools">Developer Tools</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Difficulty</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value as any)}
                    className="w-full bg-[#141414] border border-[#262626] px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Briefly describe the architectural blueprint..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-[#141414] border border-[#262626] px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="React, Tailwind, Docker, Metrics"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full bg-[#141414] border border-[#262626] px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Autonomous Swarm Prompt</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed instructions for the PM, Architect, and Senior Coders..."
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  className="w-full bg-[#141414] border border-[#262626] px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#141414] border border-[#262626] text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  {isSaving ? 'Saving to DB...' : 'Save to Firestore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

