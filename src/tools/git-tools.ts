import { z } from 'zod';
import { execSync } from 'child_process';
import { SecurityGate } from '../security/gates.js';
import { logger } from '../security/logger.js';

export const GitCreateRepoSchema = z.object({
  name: z.string().describe('Repository name'),
  description: z.string().optional().describe('Repository description'),
  private: z.boolean().optional().default(false).describe('Create as private repository'),
  confirm: z.boolean().optional().default(false).describe('Confirm execution (required when dry-run is enabled)'),
});

export const GitCommitSchema = z.object({
  message: z.string().min(10).max(200).describe('Commit message (10-200 chars)'),
  files: z.array(z.string()).optional().describe('Files to commit (defaults to all changes)'),
  confirm: z.boolean().optional().default(false).describe('Confirm execution (required when dry-run is enabled)'),
});

export const GitBranchSchema = z.object({
  name: z.string().regex(/^[a-zA-Z0-9_\/-]+$/).describe('Branch name (alphanumeric, _, /, -)'),
  checkout: z.boolean().optional().default(true).describe('Checkout the new branch'),
  confirm: z.boolean().optional().default(false).describe('Confirm execution (required when dry-run is enabled)'),
});

export const GitPRSchema = z.object({
  title: z.string().min(10).max(100).describe('Pull request title (10-100 chars)'),
  body: z.string().optional().describe('Pull request description'),
  base: z.string().optional().default('main').describe('Base branch'),
  head: z.string().describe('Head branch (source branch)'),
  confirm: z.boolean().optional().default(false).describe('Confirm execution (required when dry-run is enabled)'),
});

export class GitTools {
  private githubToken?: string;
  private securityGate?: SecurityGate;

  constructor(githubToken?: string, securityGate?: SecurityGate) {
    this.githubToken = githubToken;
    this.securityGate = securityGate;
  }

  async createRepo(args: z.infer<typeof GitCreateRepoSchema>) {
    if (!this.githubToken) {
      throw new Error('GITHUB_TOKEN not configured');
    }

    // Security gate check
    if (this.securityGate) {
      const gateCheck = await this.securityGate.checkMutatingOperation('git.createRepo', args, args.confirm);
      if (!gateCheck.allowed) {
        logger.warn('git.createRepo blocked', { reason: gateCheck.reason, dryRun: gateCheck.dryRun });
        throw new Error(gateCheck.reason || 'Operation not allowed');
      }
    }

    const visibility = args.private ? '--private' : '--public';
    const description = args.description ? `--description "${args.description}"` : '';
    
    const cmd = `gh repo create ${args.name} ${visibility} ${description} --confirm`;
    
    try {
      const output = execSync(cmd, { 
        encoding: 'utf-8',
        env: { ...process.env, GITHUB_TOKEN: this.githubToken }
      });
      
      logger.info('git.createRepo success', { repository: args.name });
      
      return {
        success: true,
        repository: args.name,
        output: output.trim(),
      };
    } catch (error: any) {
      throw new Error(`Failed to create repository: ${error.message}`);
    }
  }

  async commit(args: z.infer<typeof GitCommitSchema>) {
    // Security gate check
    if (this.securityGate) {
      const gateCheck = await this.securityGate.checkMutatingOperation('git.commit', args, args.confirm);
      if (!gateCheck.allowed) {
        logger.warn('git.commit blocked', { reason: gateCheck.reason, dryRun: gateCheck.dryRun });
        throw new Error(gateCheck.reason || 'Operation not allowed');
      }
    }

    try {
      if (args.files && args.files.length > 0) {
        const files = args.files.join(' ');
        execSync(`git add ${files}`, { encoding: 'utf-8' });
      } else {
        execSync('git add .', { encoding: 'utf-8' });
      }

      const output = execSync(`git commit -m "${args.message}"`, { encoding: 'utf-8' });
      
      logger.info('git.commit success', { message: args.message });
      
      return {
        success: true,
        message: args.message,
        output: output.trim(),
      };
    } catch (error: any) {
      throw new Error(`Failed to commit: ${error.message}`);
    }
  }

  async createBranch(args: z.infer<typeof GitBranchSchema>) {
    // Security gate check
    if (this.securityGate) {
      const gateCheck = await this.securityGate.checkMutatingOperation('git.branch', args, args.confirm);
      if (!gateCheck.allowed) {
        logger.warn('git.branch blocked', { reason: gateCheck.reason, dryRun: gateCheck.dryRun });
        throw new Error(gateCheck.reason || 'Operation not allowed');
      }

      // Whitelist check for branch name
      const whitelistCheck = await this.securityGate.checkWhitelist('branch', args.name);
      if (!whitelistCheck.allowed) {
        logger.warn('git.branch blocked by whitelist', { branch: args.name, reason: whitelistCheck.reason });
        throw new Error(whitelistCheck.reason || 'Branch not in whitelist');
      }
    }

    try {
      const checkoutFlag = args.checkout ? '-b' : '';
      const cmd = args.checkout 
        ? `git checkout -b ${args.name}`
        : `git branch ${args.name}`;
      
      const output = execSync(cmd, { encoding: 'utf-8' });
      
      logger.info('git.branch success', { branch: args.name, checkedOut: args.checkout });
      
      return {
        success: true,
        branch: args.name,
        checkedOut: args.checkout,
        output: output.trim(),
      };
    } catch (error: any) {
      throw new Error(`Failed to create branch: ${error.message}`);
    }
  }

  async createPR(args: z.infer<typeof GitPRSchema>) {
    if (!this.githubToken) {
      throw new Error('GITHUB_TOKEN not configured');
    }

    // Security gate check
    if (this.securityGate) {
      const gateCheck = await this.securityGate.checkMutatingOperation('git.pr', args, args.confirm);
      if (!gateCheck.allowed) {
        logger.warn('git.pr blocked', { reason: gateCheck.reason, dryRun: gateCheck.dryRun });
        throw new Error(gateCheck.reason || 'Operation not allowed');
      }

      // Whitelist check for head branch
      const whitelistCheck = await this.securityGate.checkWhitelist('branch', args.head);
      if (!whitelistCheck.allowed) {
        logger.warn('git.pr blocked by whitelist', { branch: args.head, reason: whitelistCheck.reason });
        throw new Error(whitelistCheck.reason || 'Branch not in whitelist');
      }
    }

    try {
      const body = args.body ? `--body "${args.body}"` : '';
      const cmd = `gh pr create --title "${args.title}" ${body} --base ${args.base} --head ${args.head}`;
      
      const output = execSync(cmd, { 
        encoding: 'utf-8',
        env: { ...process.env, GITHUB_TOKEN: this.githubToken }
      });
      
      logger.info('git.pr success', { title: args.title, base: args.base, head: args.head });
      
      return {
        success: true,
        title: args.title,
        output: output.trim(),
      };
    } catch (error: any) {
      throw new Error(`Failed to create PR: ${error.message}`);
    }
  }
}

