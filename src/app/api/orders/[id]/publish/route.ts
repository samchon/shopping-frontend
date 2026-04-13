import type { NextRequest } from "next/server";

import { getOrderDetail, publishOrder } from "@/server/shopping/orders";
import { toErrorResponse } from "@/server/shopping/errors";
import { jsonWithCustomerSession } from "@/server/shopping/session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const payload = await request.json();
    return await jsonWithCustomerSession(request, async (context) => {
      await publishOrder(id, payload, context);
      return getOrderDetail(id, context);
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
