import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SecureLogger } from '../src/security/logger.js';

describe('SecureLogger Tests', () => {
  let logger: SecureLogger;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    logger = new SecureLogger();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Sensitive data masking', () => {
    it('should mask API keys in messages', () => {
      logger.info('Using api_key: sk_test_123456789');

      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.message).not.toContain('sk_test_123456789');
      expect(loggedData.message).toContain('*');
    });

    it('should mask tokens in messages', () => {
      logger.info('Authorization: Bearer ghp_abcdefghijklmnopqrstuvwxyz123456');

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.message).not.toContain('ghp_abcdefghijklmnopqrstuvwxyz123456');
    });

    it('should mask secrets in messages', () => {
      logger.info('secret: my_super_secret_value');

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.message).not.toContain('my_super_secret_value');
    });

    it('should mask passwords in messages', () => {
      logger.info('password: P@ssw0rd123');

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.message).not.toContain('P@ssw0rd123');
    });

    it('should mask GitHub tokens', () => {
      logger.info('Token: ghp_1234567890123456789012345678901234AB');

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.message).not.toContain('ghp_1234567890123456789012345678901234AB');
    });
  });

  describe('Object masking', () => {
    it('should mask sensitive keys in objects', () => {
      logger.info('User data', {
        username: 'john',
        apiKey: 'secret123',
        token: 'bearer_token',
        password: 'mypassword',
      });

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.data.username).toBe('john');
      expect(loggedData.data.apiKey).toBe('***REDACTED***');
      expect(loggedData.data.token).toBe('***REDACTED***');
      expect(loggedData.data.password).toBe('***REDACTED***');
    });

    it('should mask nested objects', () => {
      logger.info('Config', {
        app: {
          name: 'test',
          credentials: {
            apiKey: 'secret',
            secret: 'topsecret',
          },
        },
      });

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.data.app.name).toBe('test');
      expect(loggedData.data.app.credentials.apiKey).toBe('***REDACTED***');
      expect(loggedData.data.app.credentials.secret).toBe('***REDACTED***');
    });

    it('should mask arrays with sensitive key names', () => {
      logger.info('Tokens', {
        tokens: ['token1', 'token2'],
      });

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      // The 'tokens' key is sensitive, so the entire value is redacted
      expect(loggedData.data.tokens).toBe('***REDACTED***');
    });

    it('should mask array items when they contain sensitive patterns', () => {
      logger.info('Items', {
        items: ['normal', 'api_key: secret123'],
      });

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.data.items[0]).toBe('normal');
      expect(loggedData.data.items[1]).not.toContain('secret123');
    });
  });

  describe('Log levels', () => {
    it('should log info messages', () => {
      logger.info('Info message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.level).toBe('info');
      expect(loggedData.message).toBe('Info message');
    });

    it('should log warning messages', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      logger.warn('Warning message');

      expect(consoleWarnSpy).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleWarnSpy.mock.calls[0][0]);
      expect(loggedData.level).toBe('warn');
      
      consoleWarnSpy.mockRestore();
    });

    it('should log error messages', () => {
      logger.error('Error message');

      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(loggedData.level).toBe('error');
    });
  });

  describe('JSON structure', () => {
    it('should include timestamp', () => {
      logger.info('Test');

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.timestamp).toBeDefined();
      expect(new Date(loggedData.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('should include level', () => {
      logger.info('Test');

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.level).toBe('info');
    });

    it('should include message', () => {
      logger.info('Test message');

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.message).toBe('Test message');
    });

    it('should include data when provided', () => {
      logger.info('Test', { username: 'john', id: 123 });

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.data).toEqual({ username: 'john', id: 123 });
    });

    it('should mask data with sensitive key names', () => {
      logger.info('Test', { key: 'value' });

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      // 'key' contains 'key' substring, so it gets masked
      expect(loggedData.data.key).toBe('***REDACTED***');
    });
  });
});

