import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Project, FileNode, Agent } from '../types';
import {
  Bot,
  Terminal,
  Code,
  Layout,
  Globe,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  PlayCircle,
  Star,
  Download,
  Upload,
  Lock,
  FileText,
  Trash2,
  Edit3,
  Check,
  X,
  Database,
  Layers,
  Sparkles
} from 'lucide-react';
import AgentOrchestrationGraph from '../components/AgentOrchestrationGraph';
import StreamingPanel from '../components/StreamingPanel';
import FileTree from '../components/FileTree';
import CodeViewer from '../components/CodeViewer';
import VisualAppBuilder from '../components/VisualAppBuilder';
import LiveSandboxPreview from '../components/LiveSandboxPreview';
import ExportProjectModal from '../components/ExportProjectModal';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/AuthModal';
import {
  fetchFirestoreProjectById,
  saveFirestoreProject,
  updateFirestoreProjectDetails,
  listenToFirestoreProject
} from '../lib/firestoreService';

interface ProjectViewProps {
  projects: Project[];
  onUpdateProjectFiles: (projectId: string, files: FileNode[]) => Promise<void>;
  onTriggerStream: (projectId: string) => Promise<void>;
  onDeleteProject?: (projectId: string) => Promise<void>;
  onProjectUpdated?: (project: Project) => void;
}

export default function ProjectView({
  projects,
  onUpdateProjectFiles,
  onTriggerStream,
  onDeleteProject,
  onProjectUpdated
}: ProjectViewProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'swarm' | 'code' | 'visual' | 'preview'>('swarm');
  const [project, setProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit metadata modal
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Active files inside workspace
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');

  // Local simulated live terminal logs
  const [streamLogs, setStreamLogs] = useState<any[]>([]);

  // 1. Initial Load from Props, Firestore, or Server
  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    // Check existing in-memory projects first
    const found = projects.find((p) => p.id === id);
    if (found) {
      setProject(found);
      setEditName(found.name);
      setEditDesc(found.description || found.prompt);
      if (found.files && found.files.length > 0) {
        setSelectedFile(found.files[0].path);
        setFileContent(found.files[0].content || '');
      }
    }

    // Fetch from Firestore directly for freshness
    fetchFirestoreProjectById(id).then((fsProj) => {
      if (isMounted && fsProj) {
        setProject(fsProj);
        setEditName(fsProj.name);
        setEditDesc(fsProj.description || fsProj.prompt);
        if (fsProj.files && fsProj.files.length > 0 && !selectedFile) {
          setSelectedFile(fsProj.files[0].path);
          setFileContent(fsProj.files[0].content || '');
        }
        if (onProjectUpdated) {
          onProjectUpdated(fsProj);
        }
      }
    });

    // Subscribe to real-time Firestore changes
    const unsubscribe = listenToFirestoreProject(id, (updated) => {
      if (isMounted && updated) {
        setProject((prev) => {
          const next = { ...(prev || {}), ...updated } as Project;
          if (onProjectUpdated) onProjectUpdated(next);
          return next;
        });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [id, projects]);

  // 2. Poll server for live multi-agent swarm synthesis updates
  const refreshProjectData = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const data: Project = await res.json();
        setProject(data);
        if (onProjectUpdated) {
          onProjectUpdated(data);
        }

        // If the project state progressed, persist full snapshot to Firestore
        if (user && data.status) {
          await saveFirestoreProject(data, user.uid);
        }
      }
      const streamRes = await fetch(`/api/projects/${id}/stream`);
      if (streamRes.ok) {
        const streamData = await streamRes.json();
        if (streamData.logs && streamData.logs.length > 0) {
          setStreamLogs(streamData.logs);
        }
      }
    } catch (e) {
      console.warn('Could not poll project live updates:', e);
    }
  };

  useEffect(() => {
    refreshProjectData();
    const interval = setInterval(refreshProjectData, 2500);
    return () => clearInterval(interval);
  }, [id, user]);

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center space-y-4 text-slate-100">
        <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto" />
        <h3 className="text-xl font-bold text-slate-200">Workspace Container Not Found</h3>
        <p className="text-sm text-slate-500">
          The project could not be found or you may not have permissions to access it.
        </p>
        <Link
          to="/projects"
          className="inline-block bg-white hover:bg-violet-400 text-black text-xs px-4 py-2 font-bold uppercase tracking-wider transition"
        >
          Return to Projects
        </Link>
      </div>
    );
  }

  const handleSelectFile = (path: string) => {
    setSelectedFile(path);
    const found = project.files.find((f) => f.path === path);
    setFileContent(found?.content || '');
  };

  const handleSaveFile = async (path: string, content: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const updatedFiles = project.files.map((f) => (f.path === path ? { ...f, content } : f));
    await onUpdateProjectFiles(project.id, updatedFiles);

    // Add SRE integrity save log to stream
    const now = new Date().toLocaleTimeString();
    setStreamLogs((prev) => [
      ...prev,
      {
        timestamp: now,
        agent: 'SRE Monitor',
        message: `Integrity save: ${path.split('/').pop()} synced to Firestore & sandbox.`,
        type: 'info',
      },
    ]);
  };

  const handleUploadFile = async (path: string, content: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const exists = project.files.some((f) => f.path === path);
    const updatedFiles = exists
      ? project.files.map((f) => (f.path === path ? { ...f, content } : f))
      : [...project.files, { path, name: path.split('/').pop() || 'file', type: 'file' as const, content }];

    await onUpdateProjectFiles(project.id, updatedFiles);
    setProject((prev) => (prev ? { ...prev, files: updatedFiles } : prev));
    setSelectedFile(path);
    setFileContent(content);

    const now = new Date().toLocaleTimeString();
    setStreamLogs((prev) => [
      ...prev,
      {
        timestamp: now,
        agent: 'SRE Storage',
        message: `Uploaded file ${path} successfully synced to Firestore.`,
        type: 'success',
      },
    ]);
  };

  const handleSaveProjectDetails = async () => {
    if (!project) return;
    try {
      await updateFirestoreProjectDetails(project.id, {
        name: editName,
        description: editDesc,
      });
      setProject((prev) => (prev ? { ...prev, name: editName, description: editDesc } : prev));
      setIsEditingDetails(false);
    } catch (e) {
      console.error('Error updating project details:', e);
    }
  };

  const handleDeleteThisProject = async () => {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      return;
    }
    setIsDeleting(true);
    try {
      if (onDeleteProject) {
        await onDeleteProject(project.id);
      }
      navigate('/projects');
    } catch (e) {
      console.error('Error deleting project:', e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadProjectBundle = () => {
    const bundleData = {
      id: project.id,
      name: project.name,
      description: project.description,
      exportedAt: new Date().toISOString(),
      modelConfig: project.modelConfig,
      files: project.files.map((f) => ({
        path: f.path,
        content: f.content || '',
      })),
    };

    const blob = new Blob([JSON.stringify(bundleData, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_project_bundle.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const runReBuild = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    await onTriggerStream(project.id);
    const now = new Date().toLocaleTimeString();
    setStreamLogs((prev) => [
      ...prev,
      {
        timestamp: now,
        agent: 'SRE Admin',
        message: 'Manual rebuild signal sent to container. Syncing swarm agents...',
        type: 'warning',
      },
    ]);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-6 text-slate-100" id="project-workspace">
      {/* Back & Breadcrumb header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#222222] pb-5 gap-4">
        <div className="flex items-center space-x-4">
          <Link
            to="/projects"
            className="p-2.5 text-slate-400 hover:text-white bg-[#111111] border border-[#222222] transition duration-200"
            id="workspace-back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="label text-[9px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 flex items-center gap-1">
                <Database className="w-2.5 h-2.5 text-violet-400" />
                <span>FIRESTORE SYNCED</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                ID: {project.id}
              </span>
              <span
                className={`text-[9px] font-mono px-2 py-0.5 border uppercase tracking-wider font-bold ${
                  project.status === 'deployed'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-violet-500/15 text-violet-400 border-violet-500/30 animate-pulse'
                }`}
              >
                {project.status === 'deployed' ? '✓ DEPLOYED & READY' : `SWARM: ${project.status?.toUpperCase() || 'PLANNING'}`}
              </span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <h1 className="massive-type text-3xl md:text-4xl text-white uppercase tracking-wide">
                {project.name}
              </h1>
              <button
                onClick={() => setIsEditingDetails(true)}
                title="Edit Project Details"
                className="p-1 text-slate-500 hover:text-white transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right workspace actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-white hover:bg-violet-400 text-black text-[10px] uppercase tracking-widest font-extrabold px-3.5 py-2.5 transition duration-200 flex items-center space-x-1.5 shadow-md"
            id="export-workspace-bundle-btn"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Project</span>
          </button>

          <button
            onClick={runReBuild}
            className="bg-[#111111] hover:bg-[#1a1a1a] border border-[#222222] text-slate-300 text-[10px] uppercase tracking-widest font-bold px-3.5 py-2.5 transition duration-200"
            id="rebuild-swarm-btn"
          >
            <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" />
            <span>Rebuild Swarm</span>
          </button>

          <button
            onClick={handleDeleteThisProject}
            disabled={isDeleting}
            className="bg-[#111111] hover:bg-rose-950/40 border border-[#222222] hover:border-rose-800 text-slate-400 hover:text-rose-400 text-[10px] uppercase tracking-widest font-bold px-3.5 py-2.5 transition duration-200 flex items-center space-x-1.5"
            id="delete-workspace-btn"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
          </button>

          {project.status === 'deployed' && (
            <button
              onClick={() => setActiveTab('preview')}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-[10px] uppercase tracking-widest font-extrabold px-4 py-2.5 transition duration-200 flex items-center space-x-1.5 shadow-md"
              id="open-sandbox-btn"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </button>
          )}
        </div>
      </div>

      {/* Edit Details Modal */}
      {isEditingDetails && (
        <div className="bg-[#111111] border border-violet-500/40 p-5 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#222222] pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Edit3 className="w-4 h-4 text-violet-400" />
              <span>Edit Project Name & Description</span>
            </span>
            <button
              onClick={() => setIsEditingDetails(false)}
              className="text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-[#050505] border border-[#222222] px-3 py-2 text-xs text-white outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                Description
              </label>
              <input
                type="text"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full bg-[#050505] border border-[#222222] px-3 py-2 text-xs text-white outline-none focus:border-violet-500"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setIsEditingDetails(false)}
              className="px-4 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProjectDetails}
              className="bg-white hover:bg-violet-400 text-black px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition"
            >
              Save to Firestore
            </button>
          </div>
        </div>
      )}

      {/* Tabs list bar */}
      <div className="flex items-center space-x-2 bg-[#111111] p-1 border border-[#222222] self-start text-[10px] font-bold uppercase tracking-widest w-fit">
        <button
          onClick={() => setActiveTab('swarm')}
          className={`flex items-center space-x-2 px-4 py-2 transition duration-200 ${
            activeTab === 'swarm' ? 'bg-white text-black font-extrabold' : 'text-slate-400 hover:text-white'
          }`}
          id="tab-ws-swarm"
        >
          <Bot className="w-4 h-4" />
          <span>Swarm Pipeline</span>
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`flex items-center space-x-2 px-4 py-2 transition duration-200 ${
            activeTab === 'code' ? 'bg-white text-black font-extrabold' : 'text-slate-400 hover:text-white'
          }`}
          id="tab-ws-code"
        >
          <Code className="w-4 h-4" />
          <span>Source Code ({project.files?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('visual')}
          className={`flex items-center space-x-2 px-4 py-2 transition duration-200 ${
            activeTab === 'visual' ? 'bg-white text-black font-extrabold' : 'text-slate-400 hover:text-white'
          }`}
          id="tab-ws-visual"
        >
          <Layout className="w-4 h-4" />
          <span>Visual Canvas</span>
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center space-x-2 px-4 py-2 transition duration-200 ${
            activeTab === 'preview' ? 'bg-white text-black font-extrabold' : 'text-slate-400 hover:text-white'
          }`}
          id="tab-ws-preview"
        >
          <Globe className="w-4 h-4" />
          <span>Live Sandbox Preview</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'swarm' && (
        <div className="space-y-6">
          <AgentOrchestrationGraph agents={project.agents || []} projectId={project.id} onRefresh={refreshProjectData} />
          <StreamingPanel logs={streamLogs} projectStatus={project.status} />
        </div>
      )}

      {activeTab === 'code' && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-3">
            <FileTree
              files={project.files || []}
              onSelectFile={handleSelectFile}
              selectedFilePath={selectedFile}
              onUploadFile={handleUploadFile}
              onDownloadProject={() => setShowExportModal(true)}
            />
          </div>
          <div className="lg:col-span-9">
            <CodeViewer
              filePath={selectedFile}
              initialContent={fileContent}
              projectId={project.id}
              onSave={handleSaveFile}
            />
          </div>
        </div>
      )}

      {activeTab === 'visual' && (
        <div>
          <VisualAppBuilder />
        </div>
      )}

      {activeTab === 'preview' && (
        <div>
          <LiveSandboxPreview project={project} onExport={() => setShowExportModal(true)} />
        </div>
      )}

      {/* Full Project Export Modal */}
      <ExportProjectModal
        project={project}
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
