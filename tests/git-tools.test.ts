import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitTools } from '../src/tools/git-tools.js';
import { execSync } from 'child_process';

vi.mock('child_process');

describe('GitTools Integration Tests', () => {
  let tools: GitTools;

  beforeEach(() => {
    tools = new GitTools('mock-github-token');
    vi.clearAllMocks();
  });

  it('should create a public repository', async () => {
    const mockOutput = 'https://github.com/user/test-repo';
    vi.mocked(execSync).mockReturnValue(mockOutput);

    const result = await tools.createRepo({
      name: 'test-repo',
      description: 'Test repository',
      private: false,
    });

    expect(result.success).toBe(true);
    expect(result.repository).toBe('test-repo');
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('gh repo create test-repo --public'),
      expect.any(Object)
    );
  });

  it('should create a private repository', async () => {
    const mockOutput = 'https://github.com/user/private-repo';
    vi.mocked(execSync).mockReturnValue(mockOutput);

    const result = await tools.createRepo({
      name: 'private-repo',
      private: true,
    });

    expect(result.success).toBe(true);
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('--private'),
      expect.any(Object)
    );
  });

  it('should commit all changes', async () => {
    const mockOutput = '[main abc123] Test commit\n 1 file changed';
    vi.mocked(execSync).mockReturnValue(mockOutput);

    const result = await tools.commit({
      message: 'Test commit',
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe('Test commit');
    expect(execSync).toHaveBeenCalledWith('git add .', expect.any(Object));
    expect(execSync).toHaveBeenCalledWith('git commit -m "Test commit"', expect.any(Object));
  });

  it('should commit specific files', async () => {
    const mockOutput = '[main abc123] Partial commit';
    vi.mocked(execSync).mockReturnValue(mockOutput);

    const result = await tools.commit({
      message: 'Partial commit',
      files: ['file1.ts', 'file2.ts'],
    });

    expect(result.success).toBe(true);
    expect(execSync).toHaveBeenCalledWith('git add file1.ts file2.ts', expect.any(Object));
  });

  it('should create and checkout a branch', async () => {
    const mockOutput = 'Switched to a new branch "feature-branch"';
    vi.mocked(execSync).mockReturnValue(mockOutput);

    const result = await tools.createBranch({
      name: 'feature-branch',
      checkout: true,
    });

    expect(result.success).toBe(true);
    expect(result.branch).toBe('feature-branch');
    expect(result.checkedOut).toBe(true);
    expect(execSync).toHaveBeenCalledWith('git checkout -b feature-branch', expect.any(Object));
  });

  it('should create a branch without checkout', async () => {
    const mockOutput = '';
    vi.mocked(execSync).mockReturnValue(mockOutput);

    const result = await tools.createBranch({
      name: 'new-branch',
      checkout: false,
    });

    expect(result.success).toBe(true);
    expect(result.checkedOut).toBe(false);
    expect(execSync).toHaveBeenCalledWith('git branch new-branch', expect.any(Object));
  });

  it('should create a pull request', async () => {
    const mockOutput = 'https://github.com/user/repo/pull/1';
    vi.mocked(execSync).mockReturnValue(mockOutput);

    const result = await tools.createPR({
      title: 'Feature PR',
      body: 'This is a test PR',
      base: 'main',
      head: 'feature-branch',
    });

    expect(result.success).toBe(true);
    expect(result.title).toBe('Feature PR');
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('gh pr create'),
      expect.any(Object)
    );
  });

  it('should throw error when GITHUB_TOKEN is missing', async () => {
    const toolsNoToken = new GitTools();

    await expect(toolsNoToken.createRepo({ name: 'test' })).rejects.toThrow(
      'GITHUB_TOKEN not configured'
    );
  });

  it('should handle git command errors', async () => {
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('fatal: not a git repository');
    });

    await expect(tools.commit({ message: 'test' })).rejects.toThrow('Failed to commit');
  });
});

