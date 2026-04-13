import type { NextRequest } from "next/server";

import { addCartItem, getCartData } from "@/server/shopping/cart";
import { toErrorResponse } from "@/server/shopping/errors";
import { jsonWithCustomerSession } from "@/server/shopping/session";

export async function GET(request: NextRequest) {
  try {
    return await jsonWithCustomerSession(request, getCartData);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    return await jsonWithCustomerSession(request, async (context) => {
      await addCartItem(payload, context);
      return getCartData(context);
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
