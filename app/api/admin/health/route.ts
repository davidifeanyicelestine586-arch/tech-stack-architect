import { PersistenceError } from "@/lib/persistence/project-serialization.js";
import { createFailureResponse } from "@/lib/persistence/api/project-api.js";
import { requireAdminUser } from "@/lib/auth/authorization";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Protected administrative boundary used as a safe integration point for
 * future admin tooling. No user identifiers or sensitive metadata are returned.
 */
export async function GET(request: Request) {
  try {
    const user = await requireAdminUser(request);
    return Response.json({
      ok: true,
      data: {
        service: "admin",
        status: "ready",
        role: "admin",
        authenticated: Boolean(user.id),
      },
    });
  } catch (error) {
    if (!(error instanceof PersistenceError)) {
      console.error("Admin health request failed", error);
    }
    return createFailureResponse(error, isProduction);
  }
}
