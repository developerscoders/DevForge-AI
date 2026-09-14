import { useEffect, useState } from 'react';
import { ArrowLeft, Monitor, RefreshCw, Smartphone, Tablet } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Project } from '../types';
import { fetchFirestoreProjectById } from '../lib/firestoreService';
import LiveInteractiveApp from '../components/LiveInteractiveApp';
import SEOHead from '../components/SEOHead';

interface StandalonePreviewProps { projects?: Project[]; }

/** Displays the generated product, not a fixed CRUD/API demo around it. */
export default function StandalonePreview({ projects = [] }: StandalonePreviewProps) {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    if (!id) return;
    let active = true;
    const local = projects.find((item) => item.id === id);
    if (local) { setProject(local); return; }
    (async () => {
      try {
        const response = await fetch(`/api/projects/${id}`);
        if (response.ok && active) { setProject(await response.json()); return; }
        const stored = await fetchFirestoreProjectById(id);
        if (active) setProject(stored || null);
      } catch { if (active) setProject(null); }
    })();
    return () => { active = false; };
  }, [id, projects]);

  if (!project) return <div className="min-h-screen bg-[#09090b] text-white grid place-items-center font-mono text-xs"><RefreshCw className="animate-spin" /> Loading generated project…</div>;
  if ((project.status as string) === 'generating') return <div className="min-h-screen bg-[#09090b] text-white grid place-items-center font-mono text-xs">Project is generating. The preview will appear after artifact validation.</div>;

  const width = viewport === 'mobile' ? 'max-w-[390px]' : viewport === 'tablet' ? 'max-w-[768px]' : 'w-full';
  return <div className="min-h-screen bg-[#050505] text-white">
    <SEOHead pageSlug={`/preview/${project.id}`} pageId={`preview-${project.id}`} title={`Preview: ${project.name}`} description={project.description || project.prompt} />
    <header className="sticky top-0 z-20 flex flex-wrap gap-3 items-center justify-between bg-[#0d0d0d] border-b border-white/10 px-4 py-3 font-mono text-xs">
      <Link to={`/projects/${project.id}`} className="flex items-center gap-2 text-slate-300 hover:text-white"><ArrowLeft size={14} /> Workspace</Link>
      <span className="text-emerald-400">Preview · {project.files?.length || 0} generated files</span>
      <div className="flex border border-white/15"><button aria-label="Desktop preview" onClick={() => setViewport('desktop')} className="p-2"><Monitor size={15} /></button><button aria-label="Tablet preview" onClick={() => setViewport('tablet')} className="p-2"><Tablet size={15} /></button><button aria-label="Mobile preview" onClick={() => setViewport('mobile')} className="p-2"><Smartphone size={15} /></button></div>
    </header>
    <div className="p-3 md:p-7 flex justify-center"><div className={`${width} bg-[#10100f] transition-all duration-300 shadow-2xl`}><LiveInteractiveApp project={project} /></div></div>
  </div>;
}
