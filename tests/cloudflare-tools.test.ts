import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CloudflareTools } from '../src/tools/cloudflare-tools.js';
import { execSync } from 'child_process';
import * as fs from 'fs';

vi.mock('child_process');
vi.mock('fs');

describe('CloudflareTools Integration Tests', () => {
  let tools: CloudflareTools;

  beforeEach(() => {
    tools = new CloudflareTools('mock-api-token');
    vi.clearAllMocks();
  });

  it('should deploy a Cloudflare Page', async () => {
    const mockOutput = 'Deployment complete! https://test-project.pages.dev';
    vi.mocked(execSync).mockReturnValue(mockOutput);

    const result = await tools.deploy({
      type: 'page',
      name: 'test-project',
      path: './dist',
    });

    expect(result.success).toBe(true);
    expect(result.type).toBe('page');
    expect(result.name).toBe('test-project');
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('wrangler pages deploy'),
      expect.objectContaining({
        env: expect.objectContaining({
          CLOUDFLARE_API_TOKEN: 'mock-api-token',
        }),
      })
    );
  });

  it('should deploy a Cloudflare Page with account ID', async () => {
    const mockOutput = 'Deployment complete!';
    vi.mocked(execSync).mockReturnValue(mockOutput);

    const result = await tools.deploy({
      type: 'page',
      name: 'test-project',
      path: './dist',
      accountId: 'account-123',
    });

    expect(result.success).toBe(true);
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('--account-id=account-123'),
      expect.any(Object)
    );
  });

  it('should deploy a Cloudflare Worker', async () => {
    const mockOutput = 'Published worker-name';
    vi.mocked(execSync).mockReturnValue(mockOutput);
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});

    const result = await tools.deploy({
      type: 'worker',
      name: 'worker-name',
      path: './src/worker.js',
    });

    expect(result.success).toBe(true);
    expect(result.type).toBe('worker');
    expect(result.name).toBe('worker-name');
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('wrangler.toml'),
      expect.stringContaining('worker-name')
    );
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('wrangler deploy'),
      expect.any(Object)
    );
  });

  it('should throw error when API token is missing', async () => {
    const toolsNoToken = new CloudflareTools();

    await expect(toolsNoToken.deploy({
      type: 'page',
      name: 'test',
      path: './dist',
    })).rejects.toThrow('CLOUDFLARE_API_TOKEN not configured');
  });

  it('should handle deployment errors', async () => {
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('Deployment failed: Invalid project');
    });

    await expect(tools.deploy({
      type: 'page',
      name: 'invalid',
      path: './dist',
    })).rejects.toThrow('Cloudflare deployment failed');
  });

  it('should create wrangler.toml for worker deployment', async () => {
    vi.mocked(execSync).mockReturnValue('Success');
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});

    await tools.deploy({
      type: 'worker',
      name: 'my-worker',
      path: './worker.js',
    });

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('name = "my-worker"')
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('main = "./worker.js"')
    );
  });
});

