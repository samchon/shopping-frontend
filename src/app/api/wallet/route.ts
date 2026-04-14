import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/server/shopping/errors";
import { jsonWithCustomerSession } from "@/server/shopping/session";
import { getWalletData } from "@/server/shopping/wallet";

export async function GET(request: NextRequest) {
  try {
    return await jsonWithCustomerSession(request, getWalletData);
  } catch (error) {
    return toErrorResponse(error);
  }
}
