const REDACTED = "[redacted]";

const SENSITIVE_KEY_PATTERN = /token|secret|authorization|cookie|password|request[-_]?body|raw[-_]?body|credential|service[-_]?role|api[-_]?key|private[-_]?key|client[-_]?secret/i;

export const SECURITY_EVENT_LEVELS = Object.freeze({
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
});

export const SECURITY_EVENT_CATEGORIES = Object.freeze({
  AUTHENTICATION: "authentication",
  AUTHORIZATION: "authorization",
  REQUEST: "request",
  PERSISTENCE: "persistence",
  CONFIGURATION: "configuration",
  SYSTEM: "system",
});

const sanitizeValue = (value, depth = 0) => {
  if (depth > 2) return REDACTED;
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) return value.slice(0, 10).map((item) => sanitizeValue(item, depth + 1));
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).slice(0, 20).map(([key, item]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : sanitizeValue(item, depth + 1),
      ]),
    );
  }
  return REDACTED;
};

const isValidEventLevel = (level) => Object.values(SECURITY_EVENT_LEVELS).includes(level);
const isValidEventCategory = (category) => Object.values(SECURITY_EVENT_CATEGORIES).includes(category);

export const logSecurityEvent = (
  event,
  details = {},
  { level = SECURITY_EVENT_LEVELS.WARN, category = SECURITY_EVENT_CATEGORIES.SYSTEM } = {},
) => {
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    level: isValidEventLevel(level) ? level : SECURITY_EVENT_LEVELS.WARN,
    category: isValidEventCategory(category) ? category : SECURITY_EVENT_CATEGORIES.SYSTEM,
    ...sanitizeValue(details),
  };

  console.warn(JSON.stringify(entry));
  return entry;
};

export { REDACTED, sanitizeValue };
