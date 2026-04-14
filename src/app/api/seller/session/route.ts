import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/server/shopping/errors";
import { jsonWithCustomerSession } from "@/server/shopping/session";
import { getSellerSessionData } from "@/server/shopping/seller";

export async function GET(request: NextRequest) {
  try {
    return await jsonWithCustomerSession(request, getSellerSessionData);
  } catch (error) {
    return toErrorResponse(error);
  }
}
