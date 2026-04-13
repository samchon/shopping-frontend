import "server-only";

import type { IConnection } from "@samchon/shopping-api";
import ShoppingApi from "@samchon/shopping-api";
import { NextResponse, type NextRequest } from "next/server";

import { mapSession } from "@/server/shopping/mappers";

import { shoppingConfig } from "./config";
import { ApiRouteError, isUnauthorizedError } from "./errors";
import { simulatedShoppingFetch } from "./simulate";

const ACCESS_COOKIE = "shopping_access_token";
const REFRESH_COOKIE = "shopping_refresh_token";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

type AuthorizedCustomer =
  ShoppingApi.functional.shoppings.customers.authenticate.create.Output;

export interface SessionContext {
  connection: IConnection;
  refreshToken: string | null;
  customer:
    | AuthorizedCustomer
    | ShoppingApi.functional.shoppings.customers.authenticate.get.Output
    | null;
  cookieUpdates: Array<{
    name: string;
    value: string;
    expires: Date;
  }>;
}

function createConnection(accessToken?: string): IConnection {
  return {
    host: shoppingConfig.apiHost,
    ...(shoppingConfig.simulate
      ? {
          fetch: simulatedShoppingFetch,
        }
      : {}),
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : {},
  };
}

function queueTokenCookies(
  context: SessionContext,
  token: AuthorizedCustomer["token"],
) {
  context.cookieUpdates.push(
    {
      name: ACCESS_COOKIE,
      value: token.access,
      expires: new Date(token.expired_at),
    },
    {
      name: REFRESH_COOKIE,
      value: token.refresh,
      expires: new Date(token.refreshable_until),
    },
  );
  context.refreshToken = token.refresh;
  context.connection.headers ??= {};
  context.connection.headers.Authorization = `Bearer ${token.access}`;
}

async function bootstrapCustomer(request: NextRequest): Promise<SessionContext> {
  const connection = createConnection();
  const referer = request.headers.get("referer");
  const forwardedFor = request.headers.get("x-forwarded-for");
  const href = referer ?? request.nextUrl.origin;

  const customer =
    await ShoppingApi.functional.shoppings.customers.authenticate.create(
      connection,
      {
        channel_code: shoppingConfig.channelCode,
        external_user: null,
        href,
        referrer: referer,
        ip: forwardedFor ? forwardedFor.split(",")[0]?.trim() : null,
      },
    );

  const context: SessionContext = {
    connection,
    refreshToken: customer.token.refresh,
    customer,
    cookieUpdates: [],
  };
  queueTokenCookies(context, customer.token);
  return context;
}

async function refreshCustomer(refreshToken: string): Promise<SessionContext> {
  const connection = createConnection();
  const customer =
    await ShoppingApi.functional.shoppings.customers.authenticate.refresh(
      connection,
      {
        value: refreshToken,
      },
    );
  const context: SessionContext = {
    connection,
    refreshToken: customer.token.refresh,
    customer,
    cookieUpdates: [],
  };
  queueTokenCookies(context, customer.token);
  return context;
}

async function getOrCreateContext(request: NextRequest): Promise<SessionContext> {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value ?? null;

  if (!accessToken && refreshToken) {
    try {
      return await refreshCustomer(refreshToken);
    } catch {
      return bootstrapCustomer(request);
    }
  }

  if (!accessToken) {
    return bootstrapCustomer(request);
  }

  return {
    connection: createConnection(accessToken),
    refreshToken,
    customer: null,
    cookieUpdates: [],
  };
}

function applyCookies(response: NextResponse, context: SessionContext) {
  for (const cookie of context.cookieUpdates) {
    response.cookies.set(cookie.name, cookie.value, {
      ...cookieOptions,
      expires: cookie.expires,
    });
  }

  return response;
}

export async function jsonWithCustomerSession<T>(
  request: NextRequest,
  handler: (context: SessionContext) => Promise<T>,
) {
  let context = await getOrCreateContext(request);

  try {
    const data = await handler(context);
    return applyCookies(NextResponse.json(data), context);
  } catch (error) {
    if (isUnauthorizedError(error) && context.refreshToken) {
      context = await refreshCustomer(context.refreshToken);
      const data = await handler(context);
      return applyCookies(NextResponse.json(data), context);
    }
    throw error;
  }
}

export async function requireCurrentCustomer(context: SessionContext) {
  context.customer ??=
    await ShoppingApi.functional.shoppings.customers.authenticate.get(
      context.connection,
    );
  return context.customer;
}

export async function requireCitizen(context: SessionContext) {
  const customer = await requireCurrentCustomer(context);
  if (!customer.citizen) {
    throw new ApiRouteError(
      428,
      "Real-name verification is required before checkout.",
    );
  }
  return customer.citizen;
}

export function mapSessionResponse(
  customer:
    | AuthorizedCustomer
    | ShoppingApi.functional.shoppings.customers.authenticate.get.Output,
) {
  return mapSession(customer);
}
