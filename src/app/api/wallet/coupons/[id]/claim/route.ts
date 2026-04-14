import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/server/shopping/errors";
import { jsonWithCustomerSession } from "@/server/shopping/session";
import { claimCoupon } from "@/server/shopping/wallet";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return await jsonWithCustomerSession(request, (context) =>
      claimCoupon(id, context),
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
