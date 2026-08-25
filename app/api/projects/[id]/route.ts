import { cookies } from "next/headers";
import {
  createFailureResponse,
  createProjectApi,
} from "@/lib/persistence/api/project-api.js";
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
    isProduction,
    logger: (error) => console.error("Project persistence request failed", error),
  });

type ProjectRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: ProjectRouteContext) {
  try {
    return await getApi().get(context);
  } catch (error) {
    return createFailureResponse(error, isProduction);
  }
}

export async function PATCH(request: Request, context: ProjectRouteContext) {
  try {
    return await getApi().update(request, context);
  } catch (error) {
    return createFailureResponse(error, isProduction);
  }
}

export async function DELETE(_request: Request, context: ProjectRouteContext) {
  try {
    return await getApi().remove(context);
  } catch (error) {
    return createFailureResponse(error, isProduction);
  }
}
