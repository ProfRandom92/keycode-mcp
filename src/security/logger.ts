export class SecureLogger {
  private sensitivePatterns = [
    /api[_-]?key[s]?["\s:=]+([a-zA-Z0-9_\-]+)/gi,
    /token[s]?["\s:=]+([a-zA-Z0-9_\-\.]+)/gi,
    /secret[s]?["\s:=]+([a-zA-Z0-9_\-]+)/gi,
    /password[s]?["\s:=]+([^\s"']+)/gi,
    /bearer\s+([a-zA-Z0-9_\-\.]+)/gi,
    /ghp_[a-zA-Z0-9]{36}/g,
    /github_pat_[a-zA-Z0-9_]{82}/g,
  ];

  private mask(text: string): string {
    let masked = text;
    
    for (const pattern of this.sensitivePatterns) {
      masked = masked.replace(pattern, (match, capture) => {
        if (capture) {
          const maskLength = Math.min(capture.length, 8);
          return match.replace(capture, '*'.repeat(maskLength));
        }
        return '***REDACTED***';
      });
    }

    return masked;
  }

  log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message: this.mask(message),
      data: data ? this.maskObject(data) : undefined,
    };

    const output = JSON.stringify(entry);
    
    if (level === 'error') {
      console.error(output);
    } else if (level === 'warn') {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  private maskObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.mask(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.maskObject(item));
    }

    if (obj && typeof obj === 'object') {
      const masked: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes('key') ||
          lowerKey.includes('token') ||
          lowerKey.includes('secret') ||
          lowerKey.includes('password')
        ) {
          masked[key] = '***REDACTED***';
        } else {
          masked[key] = this.maskObject(value);
        }
      }
      return masked;
    }

    return obj;
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }
}

export const logger = new SecureLogger();

