import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/server/shopping/errors";
import { jsonWithCustomerSession } from "@/server/shopping/session";
import { getAdminDashboard } from "@/server/shopping/admin";

export async function GET(request: NextRequest) {
  try {
    return await jsonWithCustomerSession(request, getAdminDashboard);
  } catch (error) {
    return toErrorResponse(error);
  }
}
