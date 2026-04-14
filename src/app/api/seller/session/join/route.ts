import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/server/shopping/errors";
import { jsonWithCustomerSession } from "@/server/shopping/session";
import { joinSeller } from "@/server/shopping/seller";

export async function POST(request: NextRequest) {
  try {
    return await jsonWithCustomerSession(request, joinSeller);
  } catch (error) {
    return toErrorResponse(error);
  }
}
