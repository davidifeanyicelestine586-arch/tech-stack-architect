const REDACTED = "[redacted]";

const sanitizeValue = (value, depth = 0) => {
  if (depth > 2) return REDACTED;
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) return value.slice(0, 10).map((item) => sanitizeValue(item, depth + 1));
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).slice(0, 20).map(([key, item]) => [
        key.toLowerCase().includes("token") || key.toLowerCase().includes("secret") || key.toLowerCase().includes("authorization")
          ? key
          : key,
        key.toLowerCase().includes("token") || key.toLowerCase().includes("secret") || key.toLowerCase().includes("authorization")
          ? REDACTED
          : sanitizeValue(item, depth + 1),
      ]),
    );
  }
  return String(value);
};

export const logSecurityEvent = (event, details = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    ...sanitizeValue(details),
  };
  console.warn(JSON.stringify(entry));
};
