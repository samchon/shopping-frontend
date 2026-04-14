import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/server/shopping/errors";
import { jsonWithCustomerSession } from "@/server/shopping/session";
import { loginSeller } from "@/server/shopping/seller";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    return await jsonWithCustomerSession(request, (context) =>
      loginSeller(payload, context),
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
