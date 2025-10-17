import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabaseTools } from '../src/tools/supabase-tools.js';

// Mock global fetch
global.fetch = vi.fn();

describe('SupabaseTools Integration Tests', () => {
  let tools: SupabaseTools;

  beforeEach(() => {
    tools = new SupabaseTools('https://test.supabase.co', 'mock-service-key');
    vi.clearAllMocks();
  });

  it('should execute a select query', async () => {
    const mockData = [{ id: 1, name: 'Test' }];
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const result = await tools.query({
      table: 'users',
      query: 'select=*',
      method: 'select',
    });

    expect(result.success).toBe(true);
    expect(result.method).toBe('select');
    expect(result.table).toBe('users');
    expect(result.data).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith(
      'https://test.supabase.co/rest/v1/users?select=*',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'apikey': 'mock-service-key',
          'Authorization': 'Bearer mock-service-key',
        }),
      })
    );
  });

  it('should execute an insert query', async () => {
    const mockData = [{ id: 2, name: 'New User' }];
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const result = await tools.query({
      table: 'users',
      query: JSON.stringify({ name: 'New User' }),
      method: 'insert',
    });

    expect(result.success).toBe(true);
    expect(result.method).toBe('insert');
    expect(fetch).toHaveBeenCalledWith(
      'https://test.supabase.co/rest/v1/users',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'New User' }),
      })
    );
  });

  it('should execute an update query', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);

    const result = await tools.query({
      table: 'users',
      query: JSON.stringify({ name: 'Updated' }),
      method: 'update',
    });

    expect(result.success).toBe(true);
    expect(result.method).toBe('update');
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'PATCH',
      })
    );
  });

  it('should execute a delete query', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);

    const result = await tools.query({
      table: 'users',
      query: 'id=eq.1',
      method: 'delete',
    });

    expect(result.success).toBe(true);
    expect(result.method).toBe('delete');
    expect(fetch).toHaveBeenCalledWith(
      'https://test.supabase.co/rest/v1/users?id=eq.1',
      expect.objectContaining({
        method: 'DELETE',
      })
    );
  });

  it('should get a value from KV store', async () => {
    const mockData = [{ key: 'test-key', value: 'test-value' }];
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const result = await tools.kvGet({ key: 'test-key' });

    expect(result.success).toBe(true);
    expect(result.key).toBe('test-key');
    expect(result.value).toBe('test-value');
  });

  it('should return null for non-existent KV key', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);

    const result = await tools.kvGet({ key: 'missing-key' });

    expect(result.success).toBe(false);
    expect(result.value).toBeNull();
  });

  it('should set a value in KV store', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [{ key: 'new-key', value: 'new-value' }],
    } as Response);

    const result = await tools.kvSet({
      key: 'new-key',
      value: 'new-value',
    });

    expect(result.success).toBe(true);
    expect(result.key).toBe('new-key');
  });

  it('should throw error when credentials are missing', async () => {
    const toolsNoAuth = new SupabaseTools();

    await expect(toolsNoAuth.query({
      table: 'users',
      query: 'select=*',
      method: 'select',
    })).rejects.toThrow('SUPABASE_URL and SUPABASE_SERVICE_KEY not configured');
  });

  it('should handle API errors', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      statusText: 'Unauthorized',
    } as Response);

    await expect(tools.query({
      table: 'users',
      query: 'select=*',
      method: 'select',
    })).rejects.toThrow('Supabase query failed');
  });
});

