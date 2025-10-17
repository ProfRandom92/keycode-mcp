import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AndroidTools } from '../src/tools/android-tools.js';
import { execSync } from 'child_process';

vi.mock('child_process');

describe('AndroidTools Integration Tests', () => {
  let tools: AndroidTools;

  beforeEach(() => {
    tools = new AndroidTools();
    vi.clearAllMocks();
  });

  it('should build debug APK', async () => {
    const mockOutput = `
BUILD SUCCESSFUL in 45s
47 actionable tasks: 47 executed
`;
    
    // Mock gradlew existence check
    vi.mocked(execSync)
      .mockReturnValueOnce('') // test -f ./gradlew
      .mockReturnValueOnce('') // chmod +x
      .mockReturnValueOnce(mockOutput); // assembleDebug

    const result = await tools.buildIme({
      projectPath: '/path/to/project',
      buildType: 'assembleDebug',
    });

    expect(result.success).toBe(true);
    expect(result.buildType).toBe('assembleDebug');
    expect(result.apkPath).toBe('app/build/outputs/apk/debug/app-debug.apk');
    expect(execSync).toHaveBeenCalledWith(
      './gradlew assembleDebug',
      expect.objectContaining({
        cwd: '/path/to/project',
      })
    );
  });

  it('should build release APK', async () => {
    const mockOutput = 'BUILD SUCCESSFUL';
    
    vi.mocked(execSync)
      .mockReturnValueOnce('')
      .mockReturnValueOnce('')
      .mockReturnValueOnce(mockOutput);

    const result = await tools.buildIme({
      projectPath: '/path/to/project',
      buildType: 'assembleRelease',
    });

    expect(result.success).toBe(true);
    expect(result.buildType).toBe('assembleRelease');
    expect(result.apkPath).toBe('app/build/outputs/apk/release/app-release.apk');
  });

  it('should clean before build when requested', async () => {
    const mockOutput = 'BUILD SUCCESSFUL';
    
    vi.mocked(execSync)
      .mockReturnValueOnce('') // test -f
      .mockReturnValueOnce('') // chmod
      .mockReturnValueOnce('') // clean
      .mockReturnValueOnce(mockOutput); // assembleDebug

    const result = await tools.buildIme({
      projectPath: '/path/to/project',
      buildType: 'assembleDebug',
      clean: true,
    });

    expect(result.success).toBe(true);
    expect(execSync).toHaveBeenCalledWith(
      './gradlew clean',
      expect.any(Object)
    );
    expect(execSync).toHaveBeenCalledWith(
      './gradlew assembleDebug',
      expect.any(Object)
    );
  });

  it('should throw error when gradlew is not found', async () => {
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('test failed');
    });

    await expect(tools.buildIme({
      projectPath: '/invalid/path',
      buildType: 'assembleDebug',
    })).rejects.toThrow('gradlew not found in project path');
  });

  it('should handle build failures', async () => {
    vi.mocked(execSync)
      .mockReturnValueOnce('') // test -f
      .mockReturnValueOnce('') // chmod
      .mockImplementation(() => {
        throw new Error('FAILURE: Build failed with an exception');
      });

    await expect(tools.buildIme({
      projectPath: '/path/to/project',
      buildType: 'assembleDebug',
    })).rejects.toThrow('Android build failed');
  });

  it('should make gradlew executable', async () => {
    const mockOutput = 'BUILD SUCCESSFUL';
    
    vi.mocked(execSync)
      .mockReturnValueOnce('')
      .mockReturnValueOnce('')
      .mockReturnValueOnce(mockOutput);

    await tools.buildIme({
      projectPath: '/path/to/project',
      buildType: 'assembleDebug',
    });

    expect(execSync).toHaveBeenCalledWith(
      'chmod +x ./gradlew',
      expect.objectContaining({
        cwd: '/path/to/project',
      })
    );
  });

  it('should truncate large build output', async () => {
    const longOutput = Array(100).fill('Build step').join('\n');
    
    vi.mocked(execSync)
      .mockReturnValueOnce('')
      .mockReturnValueOnce('')
      .mockReturnValueOnce(longOutput);

    const result = await tools.buildIme({
      projectPath: '/path/to/project',
      buildType: 'assembleDebug',
    });

    const outputLines = result.output.split('\n');
    expect(outputLines.length).toBeLessThanOrEqual(20);
  });
});

