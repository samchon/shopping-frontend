import type { NextRequest } from "next/server";

import { getCatalogData } from "@/server/shopping/catalog";
import { toErrorResponse } from "@/server/shopping/errors";
import { jsonWithCustomerSession } from "@/server/shopping/session";

export async function GET(request: NextRequest) {
  try {
    return await jsonWithCustomerSession(request, (context) =>
      getCatalogData(request, context),
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
