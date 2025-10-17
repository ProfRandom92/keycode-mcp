export interface SecurityConfig {
  dryRun: boolean;
  requireConfirm: boolean;
  whitelist: WhitelistConfig;
  capabilities: CapabilityFlags;
  humanInTheLoop: boolean;
}

export interface WhitelistConfig {
  repos: string[]; // e.g., ["owner/repo", "org/*"]
  orgs: string[]; // e.g., ["myorg", "trusted-org"]
  branches: string[]; // e.g., ["sandbox-*", "test/*"]
}

export interface CapabilityFlags {
  snippets: boolean;
  git: boolean;
  supabase: boolean;
  cloudflare: boolean;
  android: boolean;
}

export interface AuditEntry {
  timestamp: string;
  tool: string;
  caller: string;
  inputsHash: string;
  outcome: 'success' | 'error' | 'dry-run' | 'rejected';
  error?: string;
  dryRun?: boolean;
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  dryRun: true,
  requireConfirm: true,
  whitelist: {
    repos: [],
    orgs: [],
    branches: ['sandbox-*', 'test/*', 'dev/*'],
  },
  capabilities: {
    snippets: true,
    git: false,
    supabase: false,
    cloudflare: false,
    android: false,
  },
  humanInTheLoop: true,
};

