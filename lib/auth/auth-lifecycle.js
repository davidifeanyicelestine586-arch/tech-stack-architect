const AUTH_EVENTS = new Set([
  "INITIAL_SESSION",
  "SIGNED_IN",
  "SIGNED_OUT",
  "TOKEN_REFRESHED",
  "USER_UPDATED",
  "PASSWORD_RECOVERY",
]);

const SAFE_AUTH_MESSAGES = Object.freeze({
  INVALID_CREDENTIALS: "Your email or password is incorrect.",
  EMAIL_NOT_CONFIRMED: "Check your email to confirm your account before signing in.",
  RATE_LIMITED: "Too many authentication attempts. Please wait and try again.",
  NETWORK: "Authentication is temporarily unavailable. Check your connection and try again.",
  GENERIC: "Authentication failed. Please try again.",
});

export const isKnownAuthEvent = (event) => AUTH_EVENTS.has(event);

export const getSessionUser = (session) => session?.user ?? null;

export const isSessionActive = (session) => Boolean(session?.access_token && session?.user?.id);

export const authStateFromEvent = (event, session) => {
  if (!isKnownAuthEvent(event)) return null;
  if (event === "SIGNED_OUT") return { user: null, session: null };
  return { user: getSessionUser(session), session: session ?? null };
};

export const getSafeAuthErrorMessage = (error) => {
  const code = String(error?.code ?? "").toLowerCase();
  const message = String(error?.message ?? "").toLowerCase();

  if (code.includes("rate") || message.includes("rate limit") || message.includes("too many")) {
    return SAFE_AUTH_MESSAGES.RATE_LIMITED;
  }
  if (message.includes("email not confirmed")) return SAFE_AUTH_MESSAGES.EMAIL_NOT_CONFIRMED;
  if (message.includes("invalid login credentials")) return SAFE_AUTH_MESSAGES.INVALID_CREDENTIALS;
  if (message.includes("network") || message.includes("fetch")) return SAFE_AUTH_MESSAGES.NETWORK;
  return SAFE_AUTH_MESSAGES.GENERIC;
};

export { SAFE_AUTH_MESSAGES };
