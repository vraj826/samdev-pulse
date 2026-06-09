import { afterEach, describe, expect, jest, test } from '@jest/globals';
import { HttpErrorCode, httpRequest } from './http-client.js';

function jsonResponse(data, init = {}) {
  const status = init.status ?? 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    url: init.url || 'https://example.test/mock',
    headers: init.headers || { get: () => null },
    json: async () => data,
    text: async () => JSON.stringify(data),
    arrayBuffer: async () => new ArrayBuffer(0),
  };
}

function textResponse(text, init = {}) {
  const status = init.status ?? 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    url: init.url || 'https://example.test/mock',
    headers: init.headers || { get: () => null },
    json: async () => {
      JSON.parse(text);
    },
    text: async () => text,
    arrayBuffer: async () => new TextEncoder().encode(text).buffer,
  };
}

describe('http-client.js', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('normalizes timeout failures', async () => {
    jest.useFakeTimers();

    const fetchImpl = jest.fn((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        reject(new DOMException('Aborted', 'AbortError'));
      });
    }));

    const request = httpRequest('https://example.test/slow', {
      fetchImpl,
      timeoutMs: 10,
    });

    jest.advanceTimersByTime(10);
    const result = await request;

    expect(result.success).toBe(false);
    expect(result.error).toMatchObject({
      code: HttpErrorCode.TIMEOUT,
      message: 'Request timed out',
      status: 0,
      url: 'https://example.test/slow',
    });
  });

  test('returns a structured error for invalid JSON responses', async () => {
    const fetchImpl = jest.fn(() => Promise.resolve(textResponse('not json', { status: 200 })));

    const result = await httpRequest('https://example.test/json', { fetchImpl });

    expect(result.success).toBe(false);
    expect(result.status).toBe(200);
    expect(result.error).toMatchObject({
      code: HttpErrorCode.INVALID_JSON,
      message: 'Invalid JSON response',
      status: 200,
    });
  });

  test.each([404, 429, 500])('returns a structured error for HTTP %s', async (status) => {
    const fetchImpl = jest.fn(() => Promise.resolve(jsonResponse({ error: 'nope' }, { status })));

    const result = await httpRequest(`https://example.test/${status}`, { fetchImpl });

    expect(result.success).toBe(false);
    expect(result.status).toBe(status);
    expect(result.error).toMatchObject({
      code: HttpErrorCode.HTTP_ERROR,
      message: `HTTP error: ${status}`,
      status,
    });
  });

  test('adds the shared user agent header', async () => {
    const fetchImpl = jest.fn(() => Promise.resolve(jsonResponse({ ok: true })));

    await httpRequest('https://example.test/headers', { fetchImpl });

    expect(fetchImpl.mock.calls[0][1].headers).toMatchObject({
      'User-Agent': 'samdev-pulse',
    });
  });
});
