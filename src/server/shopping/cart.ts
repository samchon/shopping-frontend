import "server-only";

import ShoppingApi from "@samchon/shopping-api";

import type {
  AddToCartPayload,
  CartView,
  UpdateCartPayload,
} from "@/lib/shopping/types";
import { mapCartItem, mapSession } from "@/server/shopping/mappers";

import { ApiRouteError } from "./errors";
import { requireCurrentCustomer, type SessionContext } from "./session";

export async function getCartData(context: SessionContext): Promise<CartView> {
  const customer = await requireCurrentCustomer(context);
  const page =
    await ShoppingApi.functional.shoppings.customers.carts.commodities.index(
      context.connection,
      {
        limit: 0,
        sort: ["-commodity.created_at"],
      },
    );
  const items = page.data.map(mapCartItem);

  return {
    session: mapSession(customer),
    items,
    totals: {
      itemCount: items.length,
      quantity: items.reduce((total, item) => total + item.volume, 0),
      subtotal: items.reduce((total, item) => total + item.totalPrice, 0),
    },
  };
}

export async function addCartItem(
  payload: AddToCartPayload,
  context: SessionContext,
) {
  if (!payload.selections.length) {
    throw new ApiRouteError(400, "Choose at least one unit before adding to cart.");
  }

  await ShoppingApi.functional.shoppings.customers.carts.commodities.create(
    context.connection,
    {
      sale_id: payload.saleId,
      volume: payload.volume,
      accumulate: true,
      stocks: payload.selections.map((selection) => ({
        unit_id: selection.unitId,
        stock_id: selection.stockId,
        quantity: selection.quantity,
        choices: selection.optionValues.map((optionValue) => ({
          option_id: optionValue.optionId,
          value: optionValue.value,
        })),
      })),
    },
  );
}

export async function updateCartItem(
  commodityId: string,
  payload: UpdateCartPayload,
  context: SessionContext,
) {
  await ShoppingApi.functional.shoppings.customers.carts.commodities.update(
    context.connection,
    commodityId,
    {
      volume: payload.volume,
    },
  );
}

export async function deleteCartItem(
  commodityId: string,
  context: SessionContext,
) {
  await ShoppingApi.functional.shoppings.customers.carts.commodities.erase(
    context.connection,
    commodityId,
  );
}
