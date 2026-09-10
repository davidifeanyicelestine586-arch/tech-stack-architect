const DEFAULT_SUPABASE_ORIGIN = "https://*.supabase.co";

const normalizeOrigin = (value) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co")) return null;
    return url.origin;
  } catch {
    return null;
  }
};

export const buildContentSecurityPolicy = ({
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
  development = process.env.NODE_ENV !== "production",
} = {}) => {
  const supabaseOrigin = normalizeOrigin(supabaseUrl) ?? DEFAULT_SUPABASE_ORIGIN;
  const supabaseWebSocketOrigin = supabaseOrigin === DEFAULT_SUPABASE_ORIGIN
    ? "wss://*.supabase.co"
    : supabaseOrigin.replace(/^https:/, "wss:");

  const directives = [
    "default-src 'self'",
    development ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' ${supabaseOrigin} ${supabaseWebSocketOrigin}`,
    `frame-src 'self' ${supabaseOrigin}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];

  return directives.join("; ");
};
