const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 60;
export const MAX_REQUEST_BODY_BYTES = 256 * 1024;

const buckets = new Map();

const getClientKey = (request) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return `ip:${forwarded.split(",")[0].trim()}`;

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return `ip:${realIp.trim()}`;

  return "ip:unknown";
};

export class RequestGuardError extends Error {
  constructor(code, message, retryAfterSeconds = null) {
    super(message);
    this.name = "RequestGuardError";
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export const consumeRateLimit = (
  request,
  { limit = DEFAULT_LIMIT, windowMs = DEFAULT_WINDOW_MS, key = null } = {},
) => {
  const bucketKey = key || getClientKey(request);
  const now = Date.now();
  const current = buckets.get(bucketKey);

  if (!current || now >= current.resetAt) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (current.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    throw new RequestGuardError("RATE_LIMITED", "Too many requests.", retryAfterSeconds);
  }

  current.count += 1;
};

export const assertRequestSize = (request, maxBytes = MAX_REQUEST_BODY_BYTES) => {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    const parsed = Number(contentLength);
    if (!Number.isSafeInteger(parsed) || parsed < 0) {
      throw new RequestGuardError("INVALID_CONTENT_LENGTH", "Invalid content length.");
    }
    if (parsed > maxBytes) {
      throw new RequestGuardError("REQUEST_TOO_LARGE", "Request body is too large.");
    }
  }
};

export const assertJsonRequest = (request) => {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new RequestGuardError("UNSUPPORTED_MEDIA_TYPE", "Request content type must be application/json.");
  }
};

export const resetRequestGuardState = () => buckets.clear();

export { getClientKey };
