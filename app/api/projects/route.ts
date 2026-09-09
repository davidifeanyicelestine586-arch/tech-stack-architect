import { cookies } from "next/headers";
import {
  createFailureResponse,
  createProjectApi,
} from "@/lib/persistence/api/project-api.js";
import { getAuthenticatedUserId } from "@/lib/auth/supabase-server";
import {
  createServerProjectPersistenceService,
  serverProjectRegistries,
} from "@/lib/persistence/service/create-server-project-service";

const isProduction = process.env.NODE_ENV === "production";

const getApi = () =>
  createProjectApi({
    service: createServerProjectPersistenceService(),
    registries: serverProjectRegistries,
    getCookieStore: cookies,
    getAuthenticatedUserId,
    isProduction,
    logger: (error) => console.error("Project persistence request failed", error),
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
