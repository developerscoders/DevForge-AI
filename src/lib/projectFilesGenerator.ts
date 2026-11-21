import { FileNode } from '../types.js';
import { synthesizeProjectArtifact } from './projectSynthesizer.js';

/**
 * Generates tailored runnable project source files matching the project type and full user prompt.
 */
export function generateFullProjectFiles(appName: string, prompt: string, cleanAppName?: string): FileNode[] {
  const artifact = synthesizeProjectArtifact(prompt, cleanAppName || appName);
  return artifact.files;
}
