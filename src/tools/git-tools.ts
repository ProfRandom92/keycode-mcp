import { z } from 'zod';
import { execSync } from 'child_process';

export const GitCreateRepoSchema = z.object({
  name: z.string().describe('Repository name'),
  description: z.string().optional().describe('Repository description'),
  private: z.boolean().optional().default(false).describe('Create as private repository'),
});

export const GitCommitSchema = z.object({
  message: z.string().describe('Commit message'),
  files: z.array(z.string()).optional().describe('Files to commit (defaults to all changes)'),
});

export const GitBranchSchema = z.object({
  name: z.string().describe('Branch name'),
  checkout: z.boolean().optional().default(true).describe('Checkout the new branch'),
});

export const GitPRSchema = z.object({
  title: z.string().describe('Pull request title'),
  body: z.string().optional().describe('Pull request description'),
  base: z.string().optional().default('main').describe('Base branch'),
  head: z.string().describe('Head branch (source branch)'),
});

export class GitTools {
  private githubToken?: string;

  constructor(githubToken?: string) {
    this.githubToken = githubToken;
  }

  async createRepo(args: z.infer<typeof GitCreateRepoSchema>) {
    if (!this.githubToken) {
      throw new Error('GITHUB_TOKEN not configured');
    }

    const visibility = args.private ? '--private' : '--public';
    const description = args.description ? `--description "${args.description}"` : '';
    
    const cmd = `gh repo create ${args.name} ${visibility} ${description} --confirm`;
    
    try {
      const output = execSync(cmd, { 
        encoding: 'utf-8',
        env: { ...process.env, GITHUB_TOKEN: this.githubToken }
      });
      
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
    try {
      if (args.files && args.files.length > 0) {
        const files = args.files.join(' ');
        execSync(`git add ${files}`, { encoding: 'utf-8' });
      } else {
        execSync('git add .', { encoding: 'utf-8' });
      }

      const output = execSync(`git commit -m "${args.message}"`, { encoding: 'utf-8' });
      
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
    try {
      const checkoutFlag = args.checkout ? '-b' : '';
      const cmd = args.checkout 
        ? `git checkout -b ${args.name}`
        : `git branch ${args.name}`;
      
      const output = execSync(cmd, { encoding: 'utf-8' });
      
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

    try {
      const body = args.body ? `--body "${args.body}"` : '';
      const cmd = `gh pr create --title "${args.title}" ${body} --base ${args.base} --head ${args.head}`;
      
      const output = execSync(cmd, { 
        encoding: 'utf-8',
        env: { ...process.env, GITHUB_TOKEN: this.githubToken }
      });
      
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

