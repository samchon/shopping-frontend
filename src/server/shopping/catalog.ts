import "server-only";

import ShoppingApi from "@samchon/shopping-api";
import type { NextRequest } from "next/server";

import type { CatalogSortKey } from "@/lib/shopping/types";
import {
  mapCategoryTree,
  mapProductCard,
  mapProductDetail,
  mapSectionsFromSales,
  mapSession,
} from "@/server/shopping/mappers";

import { shoppingConfig } from "./config";
import { ApiRouteError } from "./errors";
import { requireCurrentCustomer, type SessionContext } from "./session";

function getSort(sort: CatalogSortKey) {
  switch (sort) {
    case "title":
      return ["+sale.content.title"] as const;
    case "price-asc":
      return ["+sale.price_range.lowest.real"] as const;
    case "price-desc":
      return ["-sale.price_range.lowest.real"] as const;
    case "recent":
    default:
      return ["-sale.updated_at"] as const;
  }
}

function parseQuery(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q")?.trim() ?? "";
  const section = searchParams.get("section")?.trim() || null;
  const category = searchParams.get("category")?.trim() || null;
  const sort = (searchParams.get("sort")?.trim() as CatalogSortKey) || "recent";
  const page = Number(searchParams.get("page") || "1");
  const pageSize = Number(searchParams.get("pageSize") || "8");

  return {
    q,
    section,
    category,
    sort:
      sort === "title" ||
      sort === "price-asc" ||
      sort === "price-desc" ||
      sort === "recent"
        ? sort
        : "recent",
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 8,
  };
}

function findCategoryIdByCode(
  categories: Array<{
    id: string;
    code: string;
    children: unknown[];
  }>,
  categoryCode: string | null,
): string | null {
  if (!categoryCode) {
    return null;
  }

  for (const category of categories) {
    if (category.code === categoryCode) {
      return category.id;
    }
    const nested = findCategoryIdByCode(
      category.children as Array<{
        id: string;
        code: string;
        children: unknown[];
      }>,
      categoryCode,
    );
    if (nested) {
      return nested;
    }
  }

  return null;
}

export async function getCatalogData(
  request: NextRequest,
  context: SessionContext,
) {
  const customer = await requireCurrentCustomer(context);
  const query = parseQuery(request);
  const channel =
    await ShoppingApi.functional.shoppings.customers.systematic.channels.get(
      context.connection,
      shoppingConfig.channelCode,
    );
  const categoryId = findCategoryIdByCode(channel.categories, query.category);

  if (query.category && !categoryId) {
    throw new ApiRouteError(404, "The selected category could not be found.");
  }

  const search = {
    ...(query.q ? { title_or_content: query.q } : {}),
    ...(query.section ? { section_codes: [query.section] } : {}),
    ...(categoryId ? { channel_category_ids: [categoryId] } : {}),
  };

  const [currentPage, allSales] = await Promise.all([
    ShoppingApi.functional.shoppings.customers.sales.index(context.connection, {
      page: query.page,
      limit: query.pageSize,
      search,
      sort: [...getSort(query.sort)],
    }),
    ShoppingApi.functional.shoppings.customers.sales.index(context.connection, {
      limit: 0,
      sort: ["+sale.content.title"],
    }),
  ]);

  return {
    session: mapSession(customer),
    currentChannel: {
      code: channel.code,
      name: channel.name,
    },
    sections: mapSectionsFromSales(allSales.data),
    categories: mapCategoryTree(channel.categories, allSales.data),
    products: currentPage.data.map(mapProductCard),
    pagination: currentPage.pagination,
    query,
  };
}

export async function getProductData(
  saleId: string,
  context: SessionContext,
) {
  const sale = await ShoppingApi.functional.shoppings.customers.sales.at(
    context.connection,
    saleId,
  );
  const snapshots =
    await ShoppingApi.functional.shoppings.customers.sales.snapshots.index(
      context.connection,
      saleId,
      {
        limit: 12,
      },
    );

  return mapProductDetail(sale, snapshots.data);
}
