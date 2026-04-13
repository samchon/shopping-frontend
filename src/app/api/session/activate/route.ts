import type { NextRequest } from "next/server";

import { activateCitizen } from "@/server/shopping/account";
import { toErrorResponse } from "@/server/shopping/errors";
import { jsonWithCustomerSession } from "@/server/shopping/session";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    return await jsonWithCustomerSession(request, (context) =>
      activateCitizen(payload, context),
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
