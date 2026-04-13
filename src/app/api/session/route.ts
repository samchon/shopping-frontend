import type { NextRequest } from "next/server";

import { getSessionData } from "@/server/shopping/account";
import { toErrorResponse } from "@/server/shopping/errors";
import { jsonWithCustomerSession } from "@/server/shopping/session";

export async function GET(request: NextRequest) {
  try {
    return await jsonWithCustomerSession(request, getSessionData);
  } catch (error) {
    return toErrorResponse(error);
  }
}
