import { env } from "@/lib/env";

export function validateMaintenanceAuth(request: Request) {
  const token = env.maintenanceToken;
  if (!token) {
    return false;
  }
  const authorization = request.headers.get("authorization") ?? "";
  const bearer = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : null;
  const headerToken = request.headers.get("x-maintenance-token");
  const provided = bearer || headerToken;
  return Boolean(provided && provided === token);
}
