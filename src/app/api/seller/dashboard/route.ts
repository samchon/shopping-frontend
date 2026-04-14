import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/server/shopping/errors";
import { jsonWithCustomerSession } from "@/server/shopping/session";
import { getSellerDashboard } from "@/server/shopping/seller";

export async function GET(request: NextRequest) {
  try {
    return await jsonWithCustomerSession(request, getSellerDashboard);
  } catch (error) {
    return toErrorResponse(error);
  }
}
