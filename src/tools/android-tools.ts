import { z } from 'zod';
import { execSync } from 'child_process';
import { SecurityGate } from '../security/gates.js';
import { logger } from '../security/logger.js';

export const AndroidBuildImeSchema = z.object({
  projectPath: z.string().describe('Path to Android project'),
  buildType: z.enum(['assembleDebug', 'assembleRelease']).default('assembleDebug').describe('Build type'),
  clean: z.boolean().optional().default(false).describe('Clean before build'),
  confirm: z.boolean().optional().default(false).describe('Confirm execution (required when dry-run is enabled)'),
});

export class AndroidTools {
  private securityGate?: SecurityGate;

  constructor(securityGate?: SecurityGate) {
    this.securityGate = securityGate;
  }

  async buildIme(args: z.infer<typeof AndroidBuildImeSchema>) {
    // Security gate check
    if (this.securityGate) {
      const gateCheck = await this.securityGate.checkMutatingOperation('android.buildIme', args, args.confirm);
      if (!gateCheck.allowed) {
        logger.warn('android.buildIme blocked', { reason: gateCheck.reason, dryRun: gateCheck.dryRun });
        throw new Error(gateCheck.reason || 'Operation not allowed');
      }
    }

    try {
      const cwd = args.projectPath;
      
      // Check if gradlew exists
      try {
        execSync('test -f ./gradlew', { cwd, encoding: 'utf-8' });
      } catch {
        throw new Error('gradlew not found in project path');
      }

      // Make gradlew executable
      execSync('chmod +x ./gradlew', { cwd, encoding: 'utf-8' });

      // Clean if requested
      if (args.clean) {
        console.log('Cleaning project...');
        execSync('./gradlew clean', { cwd, encoding: 'utf-8' });
      }

      // Build
      console.log(`Building with ${args.buildType}...`);
      const output = execSync(`./gradlew ${args.buildType}`, { 
        cwd, 
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large build outputs
      });

      // Find the APK path
      let apkPath = '';
      if (args.buildType === 'assembleDebug') {
        apkPath = 'app/build/outputs/apk/debug/app-debug.apk';
      } else {
        apkPath = 'app/build/outputs/apk/release/app-release.apk';
      }

      logger.info('android.buildIme success', { buildType: args.buildType, apkPath });

      return {
        success: true,
        buildType: args.buildType,
        apkPath,
        output: output.trim().split('\n').slice(-20).join('\n'), // Last 20 lines
      };
    } catch (error: any) {
      throw new Error(`Android build failed: ${error.message}`);
    }
  }
}

