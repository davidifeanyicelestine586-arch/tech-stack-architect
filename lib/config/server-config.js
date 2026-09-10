import { PersistenceError } from "../persistence/project-serialization.js";

const REQUIRED_SERVER_ENV = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

export const getServerConfig = (env = process.env) => {
  const missing = REQUIRED_SERVER_ENV.filter((name) => !env[name]);
  if (missing.length > 0) {
    throw new PersistenceError("CONFIGURATION", "Required server configuration is missing.", {
      missing,
    });
  }

  return Object.freeze({
    supabaseUrl: env.SUPABASE_URL,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  });
};

export const validateProductionConfig = (env = process.env) => {
  if (env.NODE_ENV !== "production") return { valid: true, missing: [] };
  try {
    getServerConfig(env);
    return { valid: true, missing: [] };
  } catch (error) {
    return {
      valid: false,
      missing: Array.isArray(error?.details?.missing) ? error.details.missing : [],
    };
  }
};
