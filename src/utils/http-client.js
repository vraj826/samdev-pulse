const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_USER_AGENT = 'samdev-pulse';

export const HttpErrorCode = {
  HTTP_ERROR: 'HTTP_ERROR',
  INVALID_JSON: 'INVALID_JSON',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
};

function normalizeHeaders(headers = {}) {
  return {
    'User-Agent': DEFAULT_USER_AGENT,
    ...headers,
  };
}

function buildError({ code, message, status = 0, url }) {
  return {
    code,
    message,
    status,
    url,
  };
}

async function parseBody(response, responseType) {
  if (responseType === 'arrayBuffer') {
    return response.arrayBuffer();
  }

  if (responseType === 'text') {
    return response.text();
  }

  if (responseType === 'none') {
    return null;
  }

  try {
    return await response.json();
  } catch (_) {
    throw buildError({
      code: HttpErrorCode.INVALID_JSON,
      message: 'Invalid JSON response',
      status: response.status,
      url: response.url,
    });
  }
}

export async function httpRequest(url, options = {}) {
  const {
    headers,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    responseType = 'json',
    fetchImpl = globalThis.fetch,
    ...fetchOptions
  } = options;

  if (typeof fetchImpl !== 'function') {
    return {
      success: false,
      error: buildError({
        code: HttpErrorCode.NETWORK_ERROR,
        message: 'Fetch is not available',
        url,
      }),
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      ...fetchOptions,
      headers: normalizeHeaders(headers),
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        headers: response.headers,
        error: buildError({
          code: HttpErrorCode.HTTP_ERROR,
          message: `HTTP error: ${response.status}`,
          status: response.status,
          url: response.url || url,
        }),
      };
    }

    const data = await parseBody(response, responseType);

    return {
      success: true,
      data,
      status: response.status,
      headers: response.headers,
    };
  } catch (error) {
    if (error?.code === HttpErrorCode.INVALID_JSON) {
      return {
        success: false,
        status: error.status,
        error,
      };
    }

    const isTimeout = error?.name === 'AbortError';
    return {
      success: false,
      error: buildError({
        code: isTimeout ? HttpErrorCode.TIMEOUT : HttpErrorCode.NETWORK_ERROR,
        message: isTimeout ? 'Request timed out' : error?.message || 'Network request failed',
        url,
      }),
    };
  } finally {
    clearTimeout(timeout);
  }
}
