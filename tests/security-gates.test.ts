import { describe, it, expect, beforeEach } from 'vitest';
import { SecurityGate } from '../src/security/gates.js';
import { SecurityConfig } from '../src/types/security.js';

describe('Security Gates E2E Tests', () => {
  let securityGate: SecurityGate;
  let config: SecurityConfig;

  beforeEach(() => {
    config = {
      dryRun: true,
      requireConfirm: true,
      whitelist: {
        repos: ['owner/allowed-repo'],
        orgs: ['trusted-org'],
        branches: ['sandbox-*', 'test/*'],
      },
      capabilities: {
        snippets: true,
        git: true,
        supabase: false,
        cloudflare: false,
        android: false,
      },
      humanInTheLoop: true,
    };
    securityGate = new SecurityGate(config);
  });

  describe('Dry-run gate', () => {
    it('should block operations when dry-run is enabled and confirm is false', async () => {
      const result = await securityGate.checkMutatingOperation('git.commit', {}, false);
      
      expect(result.allowed).toBe(false);
      expect(result.dryRun).toBe(true);
      expect(result.reason).toContain('Dry-run mode');
    });

    it('should allow operations when confirm is true', async () => {
      const result = await securityGate.checkMutatingOperation('git.commit', {}, true);
      
      expect(result.allowed).toBe(true);
      expect(result.dryRun).toBe(false);
    });

    it('should allow operations when dry-run is disabled and requireConfirm is false', async () => {
      config.dryRun = false;
      config.requireConfirm = false;
      securityGate = new SecurityGate(config);
      
      const result = await securityGate.checkMutatingOperation('git.commit', {}, false);
      
      expect(result.allowed).toBe(true);
    });

    it('should still require confirm when dry-run is disabled but requireConfirm is true', async () => {
      config.dryRun = false;
      config.requireConfirm = true;
      securityGate = new SecurityGate(config);
      
      const result = await securityGate.checkMutatingOperation('git.commit', {}, false);
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Confirmation required');
    });
  });

  describe('Capability flags', () => {
    it('should block operations when capability is disabled', async () => {
      const result = await securityGate.checkMutatingOperation('supabase.query', {}, true);
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Capability');
      expect(result.reason).toContain('disabled');
    });

    it('should allow operations when capability is enabled', async () => {
      const result = await securityGate.checkMutatingOperation('git.commit', {}, true);
      
      expect(result.allowed).toBe(true);
    });

    it('should check correct capability for each tool', async () => {
      expect((await securityGate.checkMutatingOperation('snippet.search', {}, true)).allowed).toBe(true);
      expect((await securityGate.checkMutatingOperation('git.branch', {}, true)).allowed).toBe(true);
      expect((await securityGate.checkMutatingOperation('supabase.query', {}, true)).allowed).toBe(false);
      expect((await securityGate.checkMutatingOperation('cloudflare.deploy', {}, true)).allowed).toBe(false);
      expect((await securityGate.checkMutatingOperation('android.buildIme', {}, true)).allowed).toBe(false);
    });
  });

  describe('Whitelist validation', () => {
    it('should allow exact repo match', async () => {
      const result = await securityGate.checkWhitelist('repo', 'owner/allowed-repo');
      
      expect(result.allowed).toBe(true);
    });

    it('should block repo not in whitelist', async () => {
      const result = await securityGate.checkWhitelist('repo', 'owner/forbidden-repo');
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not in whitelist');
    });

    it('should allow branch matching glob pattern', async () => {
      expect((await securityGate.checkWhitelist('branch', 'sandbox-feature')).allowed).toBe(true);
      expect((await securityGate.checkWhitelist('branch', 'sandbox-123')).allowed).toBe(true);
      expect((await securityGate.checkWhitelist('branch', 'test/feature')).allowed).toBe(true);
    });

    it('should block branch not matching patterns', async () => {
      const result = await securityGate.checkWhitelist('branch', 'main');
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not in whitelist');
    });

    it('should allow all when whitelist is empty', async () => {
      config.whitelist.repos = [];
      securityGate = new SecurityGate(config);
      
      const result = await securityGate.checkWhitelist('repo', 'any/repo');
      
      expect(result.allowed).toBe(true);
    });
  });

  describe('Audit trail', () => {
    it('should record successful operations', () => {
      securityGate.audit({
        tool: 'git.commit',
        caller: 'test-user',
        inputs: { message: 'test commit' },
        outcome: 'success',
      });

      const log = securityGate.getAuditLog();
      expect(log.length).toBe(1);
      expect(log[0].tool).toBe('git.commit');
      expect(log[0].outcome).toBe('success');
      expect(log[0].inputsHash).toBeDefined();
    });

    it('should record failed operations', () => {
      securityGate.audit({
        tool: 'git.pr',
        caller: 'test-user',
        inputs: { title: 'Test PR' },
        outcome: 'error',
        error: 'Authentication failed',
      });

      const log = securityGate.getAuditLog();
      expect(log[0].outcome).toBe('error');
      expect(log[0].error).toBe('Authentication failed');
    });

    it('should record dry-run operations', () => {
      securityGate.audit({
        tool: 'cloudflare.deploy',
        caller: 'test-user',
        inputs: { name: 'test-app' },
        outcome: 'dry-run',
        dryRun: true,
      });

      const log = securityGate.getAuditLog();
      expect(log[0].outcome).toBe('dry-run');
      expect(log[0].dryRun).toBe(true);
    });

    it('should limit audit log size', () => {
      for (let i = 0; i < 1100; i++) {
        securityGate.audit({
          tool: 'test.tool',
          caller: 'test',
          inputs: { index: i },
          outcome: 'success',
        });
      }

      const log = securityGate.getAuditLog();
      expect(log.length).toBe(1000);
    });

    it('should return recent audit entries', () => {
      for (let i = 0; i < 100; i++) {
        securityGate.audit({
          tool: 'test.tool',
          caller: 'test',
          inputs: { index: i },
          outcome: 'success',
        });
      }

      const recent = securityGate.getRecentAuditLog(10);
      expect(recent.length).toBe(10);
      // Most recent should be last
      expect(recent[9].inputsHash).toBeDefined();
    });
  });
});

