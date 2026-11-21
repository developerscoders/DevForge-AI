import path from 'node:path';
import fs from 'node:fs';
import net from 'node:net';

export class SecurityPolicyError extends Error {
  public readonly code: string;
  constructor(message: string, code = 'SECURITY_POLICY_VIOLATION') {
    super(message);
    this.name = 'SecurityPolicyError';
    this.code = code;
  }
}

export function getDataDir(): string {
  return process.env.DEVFORGE_DATA_DIR
    ? path.resolve(process.env.DEVFORGE_DATA_DIR)
    : path.resolve(process.cwd(), '.devforge-data');
}

export function sanitizeProjectId(projectId: string): string {
  const cleaned = String(projectId || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleaned) {
    throw new SecurityPolicyError('Invalid project identifier', 'INVALID_PROJECT_ID');
  }
  return cleaned;
}

export function getProjectWorkspaceRoot(projectId: string): string {
  const safeId = sanitizeProjectId(projectId);
  return path.resolve(getDataDir(), 'workspaces', safeId);
}

export function ensureProjectWorkspaceDir(projectId: string): string {
  const root = getProjectWorkspaceRoot(projectId);
  fs.mkdirSync(root, { recursive: true });
  return root;
}

/**
 * Resolves a target path inside the isolated project workspace root.
 * Blocks absolute paths outside root, null bytes, and `..` traversal.
 */
export function resolveSafeWorkspacePath(
  projectId: string,
  targetPath: string,
  options: { allowRoot?: boolean } = {}
): string {
  if (typeof targetPath !== 'string') {
    throw new SecurityPolicyError('File path must be a string', 'INVALID_PATH');
  }
  if (targetPath.includes('\0')) {
    throw new SecurityPolicyError('Null byte in path is forbidden', 'PATH_TRAVERSAL');
  }

  const root = getProjectWorkspaceRoot(projectId);
  const trimmed = targetPath.trim();
  if (!trimmed || trimmed === '.') {
    if (options.allowRoot) return root;
    throw new SecurityPolicyError('Path cannot target workspace root directly', 'INVALID_PATH');
  }

  // Reject explicit absolute paths or Windows drive prefixes
  if (path.isAbsolute(trimmed) || /^[a-zA-Z]:[\\/]/.test(trimmed)) {
    throw new SecurityPolicyError(`Absolute path "${targetPath}" is outside project workspace`, 'PATH_TRAVERSAL');
  }

  const resolved = path.resolve(root, trimmed);
  const normalizedRootWithSep = root.endsWith(path.sep) ? root : root + path.sep;

  if (resolved === root) {
    if (options.allowRoot) return resolved;
    throw new SecurityPolicyError('Path cannot target workspace root directly', 'INVALID_PATH');
  }

  if (!resolved.startsWith(normalizedRootWithSep)) {
    throw new SecurityPolicyError(
      `Path traversal detected: "${targetPath}" escapes project workspace`,
      'PATH_TRAVERSAL'
    );
  }

  return resolved;
}

export function toWorkspaceRelativePath(projectId: string, absolutePath: string): string {
  const root = getProjectWorkspaceRoot(projectId);
  return path.relative(root, absolutePath).split(path.sep).join('/');
}

const SECRET_ENV_KEYS = [
  'GEMINI_API_KEY',
  'OPENROUTER_API_KEY',
  'NVIDIA_API_KEY',
  'GROQ_API_KEY',
  'GITHUB_TOKEN',
  'VERCEL_TOKEN',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'FIREBASE_PRIVATE_KEY',
];

const SECRET_PATTERNS: Array<{ regex: RegExp; replacement: string }> = [
  { regex: /AIza[0-9A-Za-z\-_]{20,}/g, replacement: '[REDACTED_GOOGLE_KEY]' },
  { regex: /sk-[A-Za-z0-9\-_]{16,}/g, replacement: '[REDACTED_SK_KEY]' },
  { regex: /ghp_[A-Za-z0-9]{16,}/g, replacement: '[REDACTED_GITHUB_TOKEN]' },
  { regex: /github_pat_[A-Za-z0-9_]{20,}/g, replacement: '[REDACTED_GITHUB_PAT]' },
  { regex: /nvapi-[A-Za-z0-9\-_]{16,}/g, replacement: '[REDACTED_NVIDIA_KEY]' },
  { regex: /gsk_[A-Za-z0-9]{16,}/g, replacement: '[REDACTED_GROQ_KEY]' },
  { regex: /rzp_(?:test|live)_[A-Za-z0-9]{10,}/g, replacement: '[REDACTED_RAZORPAY_KEY]' },
  { regex: /(Bearer\s+)[A-Za-z0-9\-._~+/]{12,}=*/gi, replacement: '$1[REDACTED_TOKEN]' },
  { regex: /((?:api[_-]?key|secret|token|password|passwd|authorization)["']?\s*[:=]\s*["'])[A-Za-z0-9\-._~+/!@#$%^&*]{8,}(["'])/gi, replacement: '$1[REDACTED]$2' },
];

export function redactSecrets(input: string): string {
  if (!input || typeof input !== 'string') return input;
  let result = input;

  for (const key of SECRET_ENV_KEYS) {
    const val = process.env[key];
    if (val && val.trim().length >= 6 && val !== 'MY_GEMINI_API_KEY') {
      const escaped = val.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(escaped, 'g'), `[REDACTED_${key}]`);
    }
  }

  for (const { regex, replacement } of SECRET_PATTERNS) {
    result = result.replace(regex, replacement);
  }

  return result;
}

export function redactObject<T>(value: T, depth = 0): T {
  if (depth > 10 || value === null || value === undefined) return value;
  if (typeof value === 'string') {
    return redactSecrets(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactObject(item, depth + 1)) as unknown as T;
  }
  if (typeof value === 'object') {
    const output: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
      if (/^(token|password|secret|apiKey|api_key|authorization|privateKey)$/i.test(k) && typeof v === 'string' && v.length > 0) {
        output[k] = '[REDACTED]';
      } else {
        output[k] = redactObject(v, depth + 1);
      }
    }
    return output as T;
  }
  return value;
}

export interface CommandPolicyVerdict {
  allowed: boolean;
  requiresApproval: boolean;
  riskLevel?: 'medium' | 'high' | 'critical';
  reason?: string;
}

const ALLOWED_BINARIES = new Set([
  'node',
  'npm',
  'npx',
  'tsc',
  'eslint',
  'vitest',
  'vite',
  'git',
  'ls',
  'cat',
  'wc',
  'head',
  'tail',
  'pwd',
  'echo',
]);

const DANGEROUS_SHELL_TOKENS = /[;&|`$<>]/;

const DESTRUCTIVE_ARG_PATTERNS = [
  /--force\b/i,
  /-rf\b/i,
  /--hard\b/i,
  /--delete\b/i,
  /\beval\b/i,
];

export function validateCommandPolicy(command: string, args: string[] = []): CommandPolicyVerdict {
  const bin = path.basename(String(command || '').trim());
  if (!bin) {
    return { allowed: false, requiresApproval: false, reason: 'Command binary is required.' };
  }

  if (DANGEROUS_SHELL_TOKENS.test(command) || args.some((a) => DANGEROUS_SHELL_TOKENS.test(String(a)))) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: 'Shell chaining, piping, or subshell metacharacters are blocked by command security policy.',
    };
  }

  if (!ALLOWED_BINARIES.has(bin)) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: `Executable "${bin}" is not in the sandboxed command allowlist.`,
    };
  }

  if (args.some((a) => String(a).includes('..') && (String(a).startsWith('/') || String(a).includes('/etc') || String(a).includes('/root')))) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: 'Command arguments attempting host filesystem traversal are blocked.',
    };
  }

  const joined = [bin, ...args].join(' ');
  if (DESTRUCTIVE_ARG_PATTERNS.some((rx) => rx.test(joined))) {
    return {
      allowed: true,
      requiresApproval: true,
      riskLevel: 'high',
      reason: `Potentially destructive flag detected in "${joined}".`,
    };
  }

  if (bin === 'git') {
    const sub = args[0] || '';
    const mutatingGit = new Set(['commit', 'push', 'reset', 'rebase', 'merge', 'checkout', 'clean', 'tag', 'remote']);
    if (mutatingGit.has(sub)) {
      return {
        allowed: true,
        requiresApproval: true,
        riskLevel: sub === 'push' || sub === 'reset' || sub === 'clean' ? 'critical' : 'medium',
        reason: `Git mutation ("git ${sub}") requires explicit approval.`,
      };
    }
  }

  if ((bin === 'npm' || bin === 'npx') && (args[0] === 'install' || args[0] === 'i' || args[0] === 'uninstall' || args[0] === 'publish')) {
    return {
      allowed: true,
      requiresApproval: true,
      riskLevel: args[0] === 'publish' ? 'critical' : 'high',
      reason: `Package manager mutation ("${joined}") requires explicit approval.`,
    };
  }

  return { allowed: true, requiresApproval: false };
}

function isPrivateOrBlockedIp(ip: string): boolean {
  if (!net.isIP(ip)) return false;
  if (ip === '::1' || ip === '::' || ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')) {
    return true;
  }
  const cleanIp = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  const parts = cleanIp.split('.').map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return false;
  const [a, b] = parts;
  if (a === 127 || a === 10 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

export function validateOutboundUrl(
  rawUrl: string,
  options: { allowLocalDevPort?: number } = {}
): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new SecurityPolicyError(`Invalid URL: "${rawUrl}"`, 'INVALID_URL');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new SecurityPolicyError(
      `Unsupported URL protocol "${parsed.protocol}". Only http/https are permitted.`,
      'SSRF_BLOCKED'
    );
  }

  const host = parsed.hostname.toLowerCase();
  const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
  const port = parsed.port ? Number(parsed.port) : parsed.protocol === 'https:' ? 443 : 80;

  if (isLocalHost && options.allowLocalDevPort && port === options.allowLocalDevPort) {
    return parsed;
  }

  if (
    isLocalHost ||
    host === '0.0.0.0' ||
    host === 'metadata.google.internal' ||
    host.endsWith('.internal') ||
    host.endsWith('.local') ||
    isPrivateOrBlockedIp(host)
  ) {
    throw new SecurityPolicyError(
      `SSRF protection blocked outbound request to private/internal host "${host}"`,
      'SSRF_BLOCKED'
    );
  }

  return parsed;
}

const IMPORTANT_FILES = new Set([
  'package.json',
  'tsconfig.json',
  'server.ts',
  'server/server.ts',
  'firestore.rules',
  'Dockerfile',
  'docker-compose.yml',
  '.env',
  '.env.example',
]);

export function isImportantFileOverwrite(filePath: string, exists: boolean): boolean {
  if (!exists) return false;
  const normalized = filePath.replace(/^\/+/, '');
  return IMPORTANT_FILES.has(normalized) || normalized.endsWith('.env');
}
