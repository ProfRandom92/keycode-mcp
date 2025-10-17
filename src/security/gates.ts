import { SecurityConfig, AuditEntry } from '../types/security.js';
import { createHash } from 'crypto';

export class SecurityGate {
  private auditLog: AuditEntry[] = [];

  constructor(private config: SecurityConfig) {}

  async checkMutatingOperation(
    tool: string,
    args: any,
    confirm: boolean = false
  ): Promise<{ allowed: boolean; reason?: string; dryRun: boolean }> {
    // Check if capability is enabled
    const capability = this.getCapabilityForTool(tool);
    if (capability && !this.config.capabilities[capability]) {
      return {
        allowed: false,
        reason: `Capability '${capability}' is disabled. Enable it in configuration.`,
        dryRun: false,
      };
    }

    // Check dry-run mode first (takes precedence)
    if (this.config.dryRun && !confirm) {
      return {
        allowed: false,
        reason: 'Dry-run mode enabled. Set confirm:true to execute.',
        dryRun: true,
      };
    }

    // Check confirmation requirement (only if dry-run is not active)
    if (!this.config.dryRun && this.config.requireConfirm && !confirm) {
      return {
        allowed: false,
        reason: 'Confirmation required. Set confirm:true to proceed.',
        dryRun: false,
      };
    }

    return { allowed: true, dryRun: false };
  }

  async checkWhitelist(
    type: 'repo' | 'org' | 'branch',
    value: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const list = this.config.whitelist[type === 'repo' ? 'repos' : type === 'org' ? 'orgs' : 'branches'];

    if (list.length === 0) {
      // Empty whitelist means all allowed
      return { allowed: true };
    }

    for (const pattern of list) {
      if (this.matchPattern(value, pattern)) {
        return { allowed: true };
      }
    }

    return {
      allowed: false,
      reason: `${type} '${value}' not in whitelist. Allowed patterns: ${list.join(', ')}`,
    };
  }

  private matchPattern(value: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
      .replace(/\//g, '\\/');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(value);
  }

  private getCapabilityForTool(tool: string): keyof SecurityConfig['capabilities'] | null {
    if (tool.startsWith('snippet.')) return 'snippets';
    if (tool.startsWith('git.')) return 'git';
    if (tool.startsWith('supabase.')) return 'supabase';
    if (tool.startsWith('cloudflare.')) return 'cloudflare';
    if (tool.startsWith('android.')) return 'android';
    return null;
  }

  audit(entry: Omit<AuditEntry, 'timestamp' | 'inputsHash'> & { inputs: any }) {
    const inputsHash = createHash('sha256')
      .update(JSON.stringify(entry.inputs))
      .digest('hex')
      .substring(0, 16);

    const auditEntry: AuditEntry = {
      timestamp: new Date().toISOString(),
      tool: entry.tool,
      caller: entry.caller,
      inputsHash,
      outcome: entry.outcome,
      error: entry.error,
      dryRun: entry.dryRun,
    };

    this.auditLog.push(auditEntry);

    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
  }

  getAuditLog(): AuditEntry[] {
    return [...this.auditLog];
  }

  getRecentAuditLog(count: number = 50): AuditEntry[] {
    return this.auditLog.slice(-count);
  }
}

