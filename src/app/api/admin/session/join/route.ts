import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/server/shopping/errors";
import { jsonWithCustomerSession } from "@/server/shopping/session";
import { joinAdmin } from "@/server/shopping/admin";

export async function POST(request: NextRequest) {
  try {
    return await jsonWithCustomerSession(request, joinAdmin);
  } catch (error) {
    return toErrorResponse(error);
  }
}
