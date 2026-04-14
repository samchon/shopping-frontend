import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/server/shopping/errors";
import { jsonWithCustomerSession } from "@/server/shopping/session";
import { openSellerSale } from "@/server/shopping/seller";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = await request.json();
    const { id } = await params;
    return await jsonWithCustomerSession(request, (context) =>
      openSellerSale(id, payload, context),
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
