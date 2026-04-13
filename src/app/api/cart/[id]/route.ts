import type { NextRequest } from "next/server";

import { deleteCartItem, getCartData, updateCartItem } from "@/server/shopping/cart";
import { toErrorResponse } from "@/server/shopping/errors";
import { jsonWithCustomerSession } from "@/server/shopping/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const payload = await request.json();
    return await jsonWithCustomerSession(request, async (context) => {
      await updateCartItem(id, payload, context);
      return getCartData(context);
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return await jsonWithCustomerSession(request, async (context) => {
      await deleteCartItem(id, context);
      return getCartData(context);
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
