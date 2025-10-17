import { z } from 'zod';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';

export const CloudflareDeploySchema = z.object({
  type: z.enum(['page', 'worker']).describe('Deployment type'),
  name: z.string().describe('Project/worker name'),
  path: z.string().describe('Path to deploy (directory for pages, file for workers)'),
  accountId: z.string().optional().describe('Cloudflare account ID'),
});

export class CloudflareTools {
  private apiToken?: string;

  constructor(apiToken?: string) {
    this.apiToken = apiToken;
  }

  async deploy(args: z.infer<typeof CloudflareDeploySchema>) {
    if (!this.apiToken) {
      throw new Error('CLOUDFLARE_API_TOKEN not configured');
    }

    try {
      if (args.type === 'page') {
        return await this.deployPage(args);
      } else {
        return await this.deployWorker(args);
      }
    } catch (error: any) {
      throw new Error(`Cloudflare deployment failed: ${error.message}`);
    }
  }

  private async deployPage(args: z.infer<typeof CloudflareDeploySchema>) {
    // Using wrangler CLI for Pages deployment
    const env = {
      ...process.env,
      CLOUDFLARE_API_TOKEN: this.apiToken,
    };

    const accountFlag = args.accountId ? `--account-id=${args.accountId}` : '';
    const cmd = `npx wrangler pages deploy ${args.path} --project-name=${args.name} ${accountFlag}`;

    const output = execSync(cmd, { encoding: 'utf-8', env });

    return {
      success: true,
      type: 'page',
      name: args.name,
      output: output.trim(),
    };
  }

  private async deployWorker(args: z.infer<typeof CloudflareDeploySchema>) {
    // Create a temporary wrangler.toml if it doesn't exist
    const wranglerConfig = `
name = "${args.name}"
main = "${args.path}"
compatibility_date = "2024-01-01"
`;

    const configPath = join(process.cwd(), 'wrangler.toml');
    writeFileSync(configPath, wranglerConfig);

    const env = {
      ...process.env,
      CLOUDFLARE_API_TOKEN: this.apiToken,
    };

    const accountFlag = args.accountId ? `--account-id=${args.accountId}` : '';
    const cmd = `npx wrangler deploy ${accountFlag}`;

    const output = execSync(cmd, { encoding: 'utf-8', env });

    return {
      success: true,
      type: 'worker',
      name: args.name,
      output: output.trim(),
    };
  }
}

