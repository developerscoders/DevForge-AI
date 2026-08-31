import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  FileText
} from 'lucide-react';
import AgentOrchestrationGraph from '../components/AgentOrchestrationGraph';
import StreamingPanel from '../components/StreamingPanel';
import FileTree from '../components/FileTree';
import CodeViewer from '../components/CodeViewer';
import VisualAppBuilder from '../components/VisualAppBuilder';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/AuthModal';

interface ProjectViewProps {
  projects: Project[];
  onUpdateProjectFiles: (projectId: string, files: FileNode[]) => Promise<void>;
  onTriggerStream: (projectId: string) => Promise<void>;
}

export default function ProjectView({ projects, onUpdateProjectFiles, onTriggerStream }: ProjectViewProps) {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'swarm' | 'code' | 'visual' | 'preview'>('swarm');
  const [project, setProject] = useState<Project | null>(null);

  // Active files inside workspace
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');

  // Local simulated live terminal logs
  const [streamLogs, setStreamLogs] = useState<any[]>([]);

  const refreshProjectData = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
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

  // Find project on mount or parameter changes
  useEffect(() => {
    const found = projects.find((p) => p.id === id);
    if (found) {
      setProject(found);

      // Select first file by default if files exist
      if (found.files && found.files.length > 0) {
        setSelectedFile(found.files[0].path);
        setFileContent(found.files[0].content || '');
      }
    }

    refreshProjectData();
    const interval = setInterval(refreshProjectData, 2000);
    return () => clearInterval(interval);
  }, [id, projects]);

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center space-y-4 text-slate-100">
        <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto" />
        <h3 className="text-xl font-bold text-slate-200">Workspace Container offline</h3>
        <p className="text-sm text-slate-500">The SRE container sandbox mapping this project ID could not be loaded.</p>
        <Link
          to="/projects"
          className="inline-block bg-slate-900 hover:bg-slate-850 text-slate-200 text-xs px-4 py-2 rounded-xl border border-slate-800 font-bold transition"
        >
          Return to Dashboard
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
        message: `Integrity save: ${path.split('/').pop()} compiled and synced inside sandbox.`,
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
        message: `Uploaded file ${path} successfully synced to project workspace.`,
        type: 'success',
      },
    ]);
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
              <span className="label text-[9px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5">
                CONTAINER ACTIVE
              </span>
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                ID: {project.id}
              </span>
            </div>
            <h1 className="massive-type text-4xl text-white mt-1 uppercase tracking-wide">{project.name}</h1>
          </div>
        </div>

        {/* Right workspace actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadProjectBundle}
            className="bg-[#111111] hover:bg-[#1a1a1a] border border-[#222222] text-slate-300 text-[10px] uppercase tracking-widest font-bold px-4 py-2.5 transition duration-200 flex items-center space-x-1.5"
            id="download-workspace-bundle-btn"
          >
            <Download className="w-3.5 h-3.5 text-violet-400" />
            <span>Download Bundle</span>
          </button>

          <button
            onClick={runReBuild}
            className="bg-[#111111] hover:bg-[#1a1a1a] border border-[#222222] text-slate-300 text-[10px] uppercase tracking-widest font-bold px-4 py-2.5 transition duration-200"
            id="rebuild-swarm-btn"
          >
            <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" />
            <span>Rebuild Container</span>
          </button>

          {project.status === 'deployed' && (
            <button
              onClick={() => setActiveTab('preview')}
              className="bg-white hover:bg-violet-400 text-black text-[10px] uppercase tracking-widest font-extrabold px-4 py-2.5 transition duration-200"
              id="open-sandbox-btn"
            >
              <Globe className="w-3.5 h-3.5 inline mr-1.5" />
              <span>Launch Live Sandbox</span>
            </button>
          )}
        </div>
      </div>

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
          <span>Source Code</span>
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
          <span>Live Preview</span>
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
              onDownloadProject={handleDownloadProjectBundle}
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
        <div
          className="bg-[#111111] border border-[#222222] overflow-hidden shadow-2xl flex flex-col h-[560px] text-slate-100"
          id="sandbox-iframe"
        >
          {/* Iframe simulated URL browser bar */}
          <div className="bg-[#050505] px-4 py-3.5 border-b border-[#222222] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="flex space-x-1.5 select-none">
                <span className="w-2.5 h-2.5 bg-rose-500 inline-block"></span>
                <span className="w-2.5 h-2.5 bg-amber-500 inline-block"></span>
                <span className="w-2.5 h-2.5 bg-emerald-500 inline-block"></span>
              </div>
            </div>

            {/* URL input field */}
            <div className="bg-[#111111] border border-[#222222] text-[10px] font-mono text-slate-400 px-4 py-1.5 w-full max-w-xl text-center shadow-inner flex items-center justify-center space-x-1.5 uppercase tracking-widest font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>https://{project.id}.devforge.live/api/landing</span>
            </div>

            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">PORT 3000</span>
          </div>

          {/* Simulated Application rendering viewport */}
          <div
            className="flex-1 bg-[#050505] p-8 flex flex-col items-center justify-center space-y-6 overflow-y-auto"
            id="simulated-browser-viewport"
          >
            <div className="text-center max-w-lg space-y-4">
              <Bot className="w-12 h-12 text-indigo-400 mx-auto animate-pulse" />
              <div>
                <span className="label text-[9px] text-indigo-400 mb-1">Sandbox Preview</span>
                <h3 className="text-3xl font-bold uppercase tracking-wider text-white mt-1">{project.name}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed uppercase tracking-wider text-[10px]">
                  {project.description}
                </p>
              </div>

              <div className="bg-[#111111] p-4 border border-[#222222] font-mono text-xs text-left text-indigo-300">
                <div>// SRE VM Status: Containers deployed successfully.</div>
                <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                  Ready for full production integration. Code downloaded compiles cleanly.
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-3">
                <button
                  onClick={handleDownloadProjectBundle}
                  className="bg-white hover:bg-violet-400 text-black font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 transition duration-200 flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Project Files (.JSON)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
