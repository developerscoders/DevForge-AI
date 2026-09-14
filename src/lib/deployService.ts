import { FileNode } from '../types.js';

export interface GitHubPushResult {
  success: boolean;
  repoUrl?: string;
  repoName?: string;
  filesPushed?: number;
  branch?: string;
  isPrivate?: boolean;
  error?: string;
}

export interface VercelDeployResult {
  success: boolean;
  deploymentId?: string;
  url?: string;
  readyState?: string;
  projectName?: string;
  error?: string;
}

/**
 * Validates a GitHub Personal Access Token and retrieves user details
 */
export async function validateGitHubToken(token: string): Promise<{ valid: boolean; username?: string; error?: string }> {
  try {
    const cleanToken = token.trim();
    if (!cleanToken) return { valid: false, error: 'GitHub token cannot be empty' };

    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'DevForge-AI-Swarm/1.0'
      }
    });

    if (!res.ok) {
      if (res.status === 401) {
        return { valid: false, error: 'Bad credentials: Provided GitHub token is invalid or expired.' };
      }
      return { valid: false, error: `GitHub API error (${res.status}): ${res.statusText}` };
    }

    const userData = await res.json();
    return { valid: true, username: userData.login };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Failed to reach GitHub API' };
  }
}

/**
 * Pushes project files directly to GitHub with automatic repository creation
 */
export async function pushProjectToGitHub(options: {
  token: string;
  repoName: string;
  isPrivate?: boolean;
  commitMessage?: string;
  files: FileNode[];
  appName?: string;
}): Promise<GitHubPushResult> {
  const { token, repoName, isPrivate = false, commitMessage, files, appName } = options;

  // 1. Sanitize Inputs
  const sanitizedRepoName = repoName.trim().replace(/[^a-zA-Z0-9._-]/g, '-').replace(/^-+|-+$/g, '');
  if (!sanitizedRepoName) {
    return { success: false, error: 'Invalid repository name. Use letters, numbers, hyphens, or underscores.' };
  }

  // 2. Validate Token & get username
  const authCheck = await validateGitHubToken(token);
  if (!authCheck.valid || !authCheck.username) {
    return { success: false, error: authCheck.error || 'Authentication with GitHub failed.' };
  }
  const username = authCheck.username;

  const authHeaders = {
    Authorization: `Bearer ${token.trim()}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'DevForge-AI-Swarm/1.0'
  };

  try {
    // 3. Check if repository already exists
    let repoUrl = `https://github.com/${username}/${sanitizedRepoName}`;
    const checkRes = await fetch(`https://api.github.com/repos/${username}/${sanitizedRepoName}`, {
      headers: authHeaders
    });

    if (checkRes.status === 404) {
      // Create the repository
      const createRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: sanitizedRepoName,
          description: `Built autonomously with DevForge AI Swarm: ${appName || sanitizedRepoName}`,
          private: !!isPrivate,
          auto_init: true
        })
      });

      if (!createRes.ok) {
        const createErr = await createRes.json();
        return {
          success: false,
          error: `Failed to create repository: ${createErr.message || createRes.statusText}`
        };
      }

      const createdRepo = await createRes.json();
      repoUrl = createdRepo.html_url;
      // Brief pause to allow git repo init on GitHub
      await new Promise((r) => setTimeout(r, 1200));
    } else if (checkRes.ok) {
      const existingRepo = await checkRes.json();
      repoUrl = existingRepo.html_url;
    }

    // 4. Push files using the GitHub Contents API
    let pushedCount = 0;
    const enrichedFiles = ensureProductionDeployFiles(files, appName);
    const filesToPush = enrichedFiles.filter((f) => f.type !== 'folder' && f.content);

    for (const file of filesToPush) {
      const cleanPath = file.path.replace(/^\/+/, '');
      if (!cleanPath) continue;

      // Check if file already exists to get its SHA for update
      let sha: string | undefined;
      try {
        const fileCheckRes = await fetch(
          `https://api.github.com/repos/${username}/${sanitizedRepoName}/contents/${cleanPath}`,
          { headers: authHeaders }
        );
        if (fileCheckRes.ok) {
          const fileData = await fileCheckRes.json();
          sha = fileData.sha;
        }
      } catch (e) {
        // file doesn't exist yet, proceed
      }

      const putBody: any = {
        message: commitMessage || `feat: autonomous sync ${file.name} by DevForge AI Swarm`,
        content: Buffer.from(file.content || '').toString('base64'),
        branch: 'main'
      };
      if (sha) {
        putBody.sha = sha;
      }

      const putRes = await fetch(
        `https://api.github.com/repos/${username}/${sanitizedRepoName}/contents/${cleanPath}`,
        {
          method: 'PUT',
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(putBody)
        }
      );

      if (putRes.ok) {
        pushedCount++;
      } else {
        console.warn(`Failed to push file ${cleanPath}:`, putRes.status);
      }
    }

    return {
      success: true,
      repoUrl,
      repoName: `${username}/${sanitizedRepoName}`,
      filesPushed: pushedCount,
      branch: 'main',
      isPrivate
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Error occurred while pushing to GitHub'
    };
  }
}

/**
 * Validates a Vercel Personal Access Token
 */
export async function validateVercelToken(token: string): Promise<{ valid: boolean; user?: any; error?: string }> {
  try {
    const cleanToken = token.trim();
    if (!cleanToken) return { valid: false, error: 'Vercel token cannot be empty' };

    const res = await fetch('https://api.vercel.com/v2/user', {
      headers: {
        Authorization: `Bearer ${cleanToken}`
      }
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return { valid: false, error: 'Invalid Vercel token. Ensure token was generated at vercel.com/account/tokens.' };
      }
      return { valid: false, error: `Vercel API error (${res.status}): ${res.statusText}` };
    }

    const data = await res.json();
    return { valid: true, user: data.user };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Failed to connect to Vercel API' };
  }
}

/**
 * Validates and self-heals project files for production deployment on Vercel & GitHub.
 * Guarantees Tailwind CSS engine injection (via CDN and @tailwindcss/vite) and vercel.json configuration.
 */
export function ensureProductionDeployFiles(files: FileNode[], appName?: string): FileNode[] {
  const result = files.map((f) => ({ ...f }));

  // 1. Normalize the document before any enrichment. LLM responses sometimes
  // escape markup (\<html>) or omit <head>, both of which Vite rejects.
  const indexHtml = result.find((f) => f.path === 'index.html' || f.path === '/index.html');
  if (indexHtml && indexHtml.content) {
    let html = indexHtml.content.replace(/\\</g, '<').replace(/\\>/g, '>').trim();
    const documentStart = html.search(/<!doctype\s+html/i);
    if (documentStart > 0) html = html.slice(documentStart);
    if (!/^<!doctype\s+html/i.test(html) || !/<html[\s>]/i.test(html) || !/<body[\s>]/i.test(html)) {
      const appScript = html.match(/<script[^>]+type=["']module["'][^>]+src=["']([^"']+)["'][^>]*><\/script>/i)?.[0]
        || '<script type="module" src="/src/main.tsx"></script>';
      html = `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${appName || 'DevForge App'}</title></head><body><div id="root"></div>${appScript}</body></html>`;
    }
    if (!/<head[\s>]/i.test(html)) html = html.replace(/<html([^>]*)>/i, '<html$1><head></head>');
    indexHtml.content = html;

    // Tailwind CDN is optional for generated projects; when requested, put it
    // inside <head>, never before the doctype.
    if (!indexHtml.content.includes('cdn.tailwindcss.com')) {
      if (indexHtml.content.includes('</head>')) {
        indexHtml.content = indexHtml.content.replace(
          '</head>',
          '  <!-- Instant Tailwind CSS Engine via CDN: Guarantees 100% full styling on Vercel, Netlify, and static edge -->\n    <script src="https://cdn.tailwindcss.com"></script>\n  </head>'
        );
      }
    }
  }

  // 2. Ensure package.json includes @tailwindcss/vite and tailwindcss
  const packageJson = result.find((f) => f.path === 'package.json' || f.path === '/package.json');
  if (packageJson && packageJson.content) {
    try {
      const parsed = JSON.parse(packageJson.content);
      parsed.devDependencies = parsed.devDependencies || {};
      if (!parsed.devDependencies['@tailwindcss/vite']) {
        parsed.devDependencies['@tailwindcss/vite'] = '^4.0.0';
      }
      if (!parsed.devDependencies['tailwindcss']) {
        parsed.devDependencies['tailwindcss'] = '^4.0.0';
      }
      packageJson.content = JSON.stringify(parsed, null, 2);
    } catch (e) {
      console.warn('Could not parse package.json for deploy enrichment:', e);
    }
  }

  // 3. Ensure vite.config.ts has tailwindcss plugin
  const viteConfig = result.find((f) => f.path === 'vite.config.ts' || f.path === '/vite.config.ts');
  if (viteConfig && viteConfig.content) {
    if (!viteConfig.content.includes('@tailwindcss/vite')) {
      viteConfig.content = `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nimport tailwindcss from '@tailwindcss/vite';\n\nexport default defineConfig({\n  plugins: [react(), tailwindcss()],\n  server: {\n    port: 3000,\n    host: '0.0.0.0'\n  }\n});\n`;
    }
  }

  // 4. Ensure vercel.json is present
  const hasVercelJson = result.some((f) => f.path === 'vercel.json' || f.path === '/vercel.json');
  if (!hasVercelJson) {
    result.push({
      path: 'vercel.json',
      name: 'vercel.json',
      type: 'file',
      content: JSON.stringify(
        {
          $schema: 'https://openapi.vercel.sh/vercel.json',
          framework: 'vite',
          buildCommand: 'vite build',
          outputDirectory: 'dist',
          cleanUrls: true,
          rewrites: [{ source: '/(.*)', destination: '/index.html' }]
        },
        null,
        2
      )
    });
  }

  return result;
}

/**
 * Deploys project files directly to Vercel via Vercel Deployments API
 */
export async function deployProjectToVercel(options: {
  token: string;
  projectName: string;
  files: FileNode[];
  appName?: string;
}): Promise<VercelDeployResult> {
  const { token, projectName, files, appName } = options;

  // 1. Sanitize project name
  const sanitizedName = projectName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100) || 'devforge-app';

  // 2. Validate token
  const authCheck = await validateVercelToken(token);
  if (!authCheck.valid) {
    return { success: false, error: authCheck.error || 'Vercel authentication failed' };
  }

  // 3. Format and enrich files with guaranteed CSS & build configs according to Vercel API specification
  const enrichedFiles = ensureProductionDeployFiles(files, appName);
  const validFiles = enrichedFiles.filter((f) => f.type !== 'folder' && f.content !== undefined);
  if (validFiles.length === 0) {
    return { success: false, error: 'Project has no files to deploy' };
  }

  const vercelFiles = validFiles.map((f) => ({
    file: f.path.replace(/^\/+/, ''),
    data: f.content || ''
  }));

  try {
    const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: sanitizedName,
        files: vercelFiles,
        projectSettings: {
          framework: 'vite'
        }
      })
    });

    const deployData = await deployRes.json();

    if (!deployRes.ok) {
      return {
        success: false,
        error: deployData.error?.message || `Vercel deployment failed (${deployRes.status}): ${deployRes.statusText}`
      };
    }

    const deployUrl = deployData.url ? `https://${deployData.url}` : undefined;

    return {
      success: true,
      deploymentId: deployData.id,
      url: deployUrl,
      readyState: deployData.readyState || 'READY',
      projectName: sanitizedName
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to trigger Vercel deployment'
    };
  }
}

/**
 * Checks Vercel deployment status by ID
 */
export async function checkVercelDeploymentStatus(token: string, deploymentId: string): Promise<{ readyState: string; url?: string; error?: string }> {
  try {
    const res = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
      headers: {
        Authorization: `Bearer ${token.trim()}`
      }
    });

    if (!res.ok) {
      return { readyState: 'ERROR', error: `Vercel status check failed (${res.status})` };
    }

    const data = await res.json();
    const readyState = data.readyState || 'READY';
    const errorMsg =
      data.error?.message ||
      data.errorMessage ||
      (readyState === 'ERROR' ? 'Vercel build or dependency installation failed.' : undefined);

    return {
      readyState,
      url: data.url ? `https://${data.url}` : undefined,
      error: errorMsg
    };
  } catch (err: any) {
    return { readyState: 'ERROR', error: err.message };
  }
}
