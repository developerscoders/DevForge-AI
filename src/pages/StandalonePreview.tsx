import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Project } from '../types';
import { fetchFirestoreProjectById } from '../lib/firestoreService';
import { auth } from '../lib/firebase';
import LiveSandboxPreview from '../components/LiveSandboxPreview';
import LiveSwarmGenerationTracker from '../components/LiveSwarmGenerationTracker';
import SEOHead from '../components/SEOHead';

interface StandalonePreviewProps { projects?: Project[]; }

/** Shows the actual generated build; never substitutes a prompt-keyword demo. */
export default function StandalonePreview({ projects = [] }: StandalonePreviewProps) {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    const local = projects.find((item) => item.id === id);
    if (local) setProject(local);

    (async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (idToken) {
          const response = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
            headers: { Authorization: `Bearer ${idToken}` },
            cache: 'no-store',
          });
          if (response.ok) {
            const serverProject = await response.json();
            if (active) setProject(serverProject);
            return;
          }
        }
        const stored = await fetchFirestoreProjectById(id);
        if (active && stored) setProject(stored);
      } catch (error) {
        console.warn('Could not restore standalone preview from the backend; trying Firestore:', error);
        const stored = await fetchFirestoreProjectById(id).catch(() => null);
        if (active && stored) setProject(stored);
      }
    })();

    return () => { active = false; };
  }, [id, projects]);

  if (!project) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white grid place-items-center font-mono text-xs">
        <RefreshCw className="animate-spin" /> Loading generated project…
      </div>
    );
  }

  const run = project.lastExecutionRun || null;
  const runIsActive = run
    ? ['queued', 'running', 'awaiting_approval'].includes(run.status)
    : false;
  const isGenerating = runIsActive || (
    !run &&
    (['generating', 'planning', 'coding', 'review', 'building', 'testing'].includes(project.status) ||
      !project.files?.length)
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <SEOHead
        pageSlug={`/preview/${project.id}`}
        pageId={`preview-${project.id}`}
        title={`Preview: ${project.name}`}
        description={project.description || project.prompt}
      />
      <header className="sticky top-0 z-20 flex flex-wrap gap-3 items-center justify-between bg-[#0d0d0d] border-b border-white/10 px-4 py-3 font-mono text-xs">
        <Link to={`/projects/${project.id}`} className="flex items-center gap-2 text-slate-300 hover:text-white">
          <ArrowLeft size={14} /> Workspace
        </Link>
        <span className={isGenerating ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
          {isGenerating ? 'Live Swarm Synthesis' : `Built Product Preview · ${project.files?.length || 0} source files`}
        </span>
      </header>
      <div className="p-3 md:p-7">
        {isGenerating ? (
          <LiveSwarmGenerationTracker project={project} executionRun={run} />
        ) : (
          <LiveSandboxPreview project={project} executionRun={run} />
        )}
      </div>
    </div>
  );
}
