import { z } from 'zod';
import { execSync } from 'child_process';

export const AndroidBuildImeSchema = z.object({
  projectPath: z.string().describe('Path to Android project'),
  buildType: z.enum(['assembleDebug', 'assembleRelease']).default('assembleDebug').describe('Build type'),
  clean: z.boolean().optional().default(false).describe('Clean before build'),
});

export class AndroidTools {
  async buildIme(args: z.infer<typeof AndroidBuildImeSchema>) {
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

