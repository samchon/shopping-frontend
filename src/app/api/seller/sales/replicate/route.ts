import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/server/shopping/errors";
import { jsonWithCustomerSession } from "@/server/shopping/session";
import { replicateSellerSale } from "@/server/shopping/seller";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    return await jsonWithCustomerSession(request, (context) =>
      replicateSellerSale(payload, context),
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
