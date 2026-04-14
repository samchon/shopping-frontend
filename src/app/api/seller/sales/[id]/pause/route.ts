import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/server/shopping/errors";
import { jsonWithCustomerSession } from "@/server/shopping/session";
import { pauseSellerSale } from "@/server/shopping/seller";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return await jsonWithCustomerSession(request, (context) =>
      pauseSellerSale(id, context),
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
