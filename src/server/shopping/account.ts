import "server-only";

import ShoppingApi from "@samchon/shopping-api";

import type {
  ActivateCitizenPayload,
  JoinMemberPayload,
  LoginMemberPayload,
  SessionView,
} from "@/lib/shopping/types";
import { mapSession } from "@/server/shopping/mappers";

import { requireCurrentCustomer, type SessionContext } from "./session";

export async function getSessionData(
  context: SessionContext,
): Promise<SessionView> {
  const customer = await requireCurrentCustomer(context);
  return mapSession(customer);
}

export async function activateCitizen(
  payload: ActivateCitizenPayload,
  context: SessionContext,
) {
  const customer =
    await ShoppingApi.functional.shoppings.customers.authenticate.activate(
      context.connection,
      {
        name: payload.name,
        mobile: payload.mobile,
      },
    );

  return mapSession(customer);
}

export async function joinMember(
  payload: JoinMemberPayload,
  context: SessionContext,
) {
  const customer = await ShoppingApi.functional.shoppings.customers.authenticate.join(
    context.connection,
    {
      email: payload.email,
      password: payload.password,
      nickname: payload.nickname,
      citizen: payload.citizen
        ? {
            name: payload.citizen.name,
            mobile: payload.citizen.mobile,
          }
        : null,
    },
  );

  return mapSession(customer);
}

export async function loginMember(
  payload: LoginMemberPayload,
  context: SessionContext,
) {
  const customer =
    await ShoppingApi.functional.shoppings.customers.authenticate.login(
      context.connection,
      {
        email: payload.email,
        password: payload.password,
      },
    );

  return mapSession(customer);
}
