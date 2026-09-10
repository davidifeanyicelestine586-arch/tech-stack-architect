import { cookies } from "next/headers";
import {
  createFailureResponse,
  createProjectApi,
} from "@/lib/persistence/api/project-api.js";
import { getAuthenticatedUserId } from "@/lib/auth/supabase-server";
import { logSecurityEvent } from "@/lib/security/logger";
import {
  createServerProjectPersistenceService,
  serverProjectRegistries,
} from "@/lib/persistence/service/create-server-project-service";

const isProduction = process.env.NODE_ENV === "production";

const getGuardErrorDetails = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return { code: "DATABASE_FAILURE", message: "unknown error" };
  }

  const code = "code" in error && typeof error.code === "string"
    ? error.code
    : "DATABASE_FAILURE";
  const message = "message" in error && typeof error.message === "string"
    ? error.message
    : "unknown error";

  return { code, message };
};

const getApi = () =>
  createProjectApi({
    service: createServerProjectPersistenceService(),
    registries: serverProjectRegistries,
    getCookieStore: cookies,
    getAuthenticatedUserId,
    isProduction,
    logger: (error: unknown) =>
      logSecurityEvent("project_api_guard_failure", getGuardErrorDetails(error)),
  });

export async function POST(request: Request) {
  try {
    return await getApi().create(request);
  } catch (error) {
    return createFailureResponse(error, isProduction);
  }
}

export async function GET(request: Request) {
  try {
    return await getApi().list(request);
  } catch (error) {
    return createFailureResponse(error, isProduction);
  }
}
