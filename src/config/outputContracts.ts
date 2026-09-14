export const PROJECT_TYPES = [
  'web-app', 'mobile-app', 'browser-extension', 'ai-ml-pipeline', 'api-service',
  'data-pipeline', 'game', 'cli-tool', 'chrome-extension', 'static-site',
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

export interface ProjectClassification {
  project_type: ProjectType;
  domain: string;
  feature_list: string[];
  tech_constraints: string[];
  prompt_original: string;
}

export const SHARED_OUTPUT_CONTRACT = {
  classification: ['project_type', 'domain', 'feature_list', 'tech_constraints', 'prompt_original'],
  project: ['name', 'description', 'prd', 'architecture', 'files'],
} as const;

export function classifyProjectPrompt(prompt: string): ProjectClassification {
  const text = prompt.toLowerCase();
  const project_type: ProjectType = /image classification|model inference|machine learning|\bml\b|training pipeline/.test(text)
    ? 'ai-ml-pipeline'
    : /react native|expo|\bmobile app/.test(text) ? 'mobile-app'
    : /chrome extension|browser extension/.test(text) ? 'browser-extension'
    : /\bapi service|rest api only|api-only/.test(text) ? 'api-service'
    : /\bcli\b|command.line tool/.test(text) ? 'cli-tool'
    : /static site|landing page/.test(text) ? 'static-site'
    : 'web-app';
  const features = ['payment', 'playground', 'comparison', 'real-time', 'authentication', 'upload', 'confidence', 'inference', 'offline']
    .filter((term) => text.includes(term));
  const constraints = ['next.js', 'tailwind', 'framer motion', 'react native', 'expo', 'three.js', 'vector database']
    .filter((term) => text.includes(term));
  return { project_type, domain: prompt.split(/[,.\n]/, 1)[0].trim(), feature_list: features, tech_constraints: constraints, prompt_original: prompt };
}
