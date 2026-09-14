import { FileNode } from '../types.js';

/**
 * Offline fallback: a valid, modular client application. It deliberately uses
 * the user request as data; it never substitutes a domain-specific dashboard.
 */
export function generateFullProjectFiles(appName: string, prompt: string, cleanAppName?: string): FileNode[] {
  const slug = (cleanAppName || appName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'web-app';
  const config = JSON.stringify({ title: appName, brief: prompt, sections: extractSections(prompt) }, null, 2);
  const file = (path: string, content: string): FileNode => ({ path, name: path.split('/').pop() || path, type: 'file', content });
  return [
    file('package.json', JSON.stringify({ name: slug, private: true, version: '1.0.0', type: 'module', scripts: { dev: 'vite', build: 'tsc -b && vite build', test: 'vitest run' }, dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' }, devDependencies: { '@types/react': '^19.0.0', '@types/react-dom': '^19.0.0', '@vitejs/plugin-react': '^4.3.0', typescript: '^5.7.0', vite: '^6.2.0', vitest: '^3.0.0' } }, null, 2)),
    file('index.html', `<!doctype html>\n<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${escapeHtml(appName)}</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`),
    file('tsconfig.json', JSON.stringify({ compilerOptions: { target: 'ES2022', useDefineForClassFields: true, lib: ['ES2022', 'DOM', 'DOM.Iterable'], module: 'ESNext', skipLibCheck: true, moduleResolution: 'bundler', noEmit: true, jsx: 'react-jsx', strict: true }, include: ['src'] }, null, 2)),
    file('vite.config.ts', "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nexport default defineConfig({ plugins: [react()] });\n"),
    file('src/main.tsx', "import { StrictMode } from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App';\nimport './styles/global.css';\ncreateRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);\n"),
    file('src/config/project.ts', `export const project = ${config} as const;\n`),
    file('src/components/SiteHeader.tsx', "export function SiteHeader({ title }: { title: string }) { return <header className=\"site-header\"><a href=\"#top\">{title}</a><nav aria-label=\"Primary navigation\"><a href=\"#experience\">Experience</a><a href=\"#contact\">Contact</a></nav></header>; }\n"),
    file('src/components/ProjectSections.tsx', "export function ProjectSections({ sections }: { sections: readonly string[] }) { return <section id=\"experience\" className=\"sections\">{sections.map((section, index) => <article key={section}><span>0{index + 1}</span><h2>{section}</h2><p>Designed from the project brief with responsive, accessible interaction boundaries.</p></article>)}</section>; }\n"),
    file('src/App.tsx', "import { project } from './config/project';\nimport { SiteHeader } from './components/SiteHeader';\nimport { ProjectSections } from './components/ProjectSections';\nexport default function App() { return <main id=\"top\"><SiteHeader title={project.title} /><section className=\"hero\"><p>PROJECT BRIEF</p><h1>{project.title}</h1><p>{project.brief}</p><a href=\"#experience\">Explore the experience ↓</a></section><ProjectSections sections={project.sections} /><section id=\"contact\" className=\"contact\"><h2>Let’s begin.</h2><button type=\"button\">Get in touch</button></section></main>; }\n"),
    file('src/styles/global.css', "*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#10100f;color:#f5f0e8;font-family:Inter,system-ui,sans-serif}.site-header{display:flex;justify-content:space-between;padding:1.25rem 6vw;border-bottom:1px solid #ffffff22}.site-header a{color:inherit;text-decoration:none}.site-header nav{display:flex;gap:1rem}.hero,.sections,.contact{padding:clamp(4rem,10vw,10rem) 8vw}.hero{min-height:78vh;background:radial-gradient(circle at 80% 10%,#664729,transparent 40%)}.hero h1,.sections h2,.contact h2{font:500 clamp(2.5rem,8vw,7rem)/.95 Georgia,serif;margin:.6rem 0}.hero p{max-width:52rem;line-height:1.7}.hero>a,button{display:inline-block;margin-top:1.5rem;padding:.8rem 1.1rem;border:1px solid #d9b16e;background:transparent;color:inherit}.sections article{border-top:1px solid #ffffff22;padding:2rem 0}.sections span{color:#d9b16e;font-size:.75rem;letter-spacing:.12em}.sections h2{font-size:clamp(2rem,4vw,4rem)}.contact{background:#e8ddcc;color:#1b1711;text-align:center}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*:before,*:after{animation-duration:.01ms!important;transition-duration:.01ms!important}}\n"),
    file('tests/app.test.ts', "import { describe, expect, it } from 'vitest';\nimport { project } from '../src/config/project';\ndescribe('project configuration', () => { it('contains a project title and at least one planned section', () => { expect(project.title.length).toBeGreaterThan(0); expect(project.sections.length).toBeGreaterThan(0); }); });\n"),
    file('README.md', `# ${appName}\n\n## Source brief\n\n${prompt}\n\n## Structure\n\n- \`src/config/project.ts\`: prompt-derived product data\n- \`src/components/\`: reusable UI modules\n- \`src/styles/\`: responsive and reduced-motion styling\n- \`tests/\`: executable project contract\n\n## Commands\n\n\`npm install\`\n\`npm run dev\`\n\`npm run build\`\n\`npm test\`\n`),
  ];
}

function extractSections(prompt: string): string[] {
  const headings = [...prompt.matchAll(/^\s*(?:#+\s*|\d+[.)]\s+)([^\n]+)/gm)].map((match) => match[1].trim());
  return headings.length ? headings.slice(0, 6) : ['Overview', 'Core experience', 'Details'];
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] || character));
}
