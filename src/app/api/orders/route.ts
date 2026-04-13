import type { NextRequest } from "next/server";

import { createOrder, getOrdersData } from "@/server/shopping/orders";
import { toErrorResponse } from "@/server/shopping/errors";
import { jsonWithCustomerSession } from "@/server/shopping/session";

export async function GET(request: NextRequest) {
  try {
    return await jsonWithCustomerSession(request, getOrdersData);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    return await jsonWithCustomerSession(request, (context) =>
      createOrder(payload, context),
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
