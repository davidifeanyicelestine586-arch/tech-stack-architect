const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export class CsrfError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "CsrfError";
    this.code = code;
  }
}

/**
 * Enforce same-origin semantics when a browser supplies an Origin header.
 * Requests without Origin remain supported for non-browser/server-to-server
 * clients and for environments where the header is intentionally omitted.
 */
export const assertSameOrigin = (request) => {
  if (!STATE_CHANGING_METHODS.has(request.method.toUpperCase())) return;

  const origin = request.headers.get("origin");
  if (!origin) return;

  let suppliedOrigin;
  let requestOrigin;
  try {
    suppliedOrigin = new URL(origin).origin;
    requestOrigin = new URL(request.url).origin;
  } catch {
    throw new CsrfError("CSRF_ORIGIN_MISMATCH", "Request origin is invalid.");
  }

  if (suppliedOrigin !== requestOrigin) {
    throw new CsrfError("CSRF_ORIGIN_MISMATCH", "Request origin is not allowed.");
  }
};

export { STATE_CHANGING_METHODS };
