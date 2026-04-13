import "server-only";

import type {
  IShoppingCartCommodity,
} from "@samchon/shopping-api/lib/structures/shoppings/orders/IShoppingCartCommodity";
import type { IShoppingOrder } from "@samchon/shopping-api/lib/structures/shoppings/orders/IShoppingOrder";
import type { IShoppingOrderPublish } from "@samchon/shopping-api/lib/structures/shoppings/orders/IShoppingOrderPublish";
import type { IShoppingSale } from "@samchon/shopping-api/lib/structures/shoppings/sales/IShoppingSale";
import type { IShoppingSaleSnapshot } from "@samchon/shopping-api/lib/structures/shoppings/sales/IShoppingSaleSnapshot";

import type {
  CartItemView,
  CartSelectionView,
  CategoryTreeNode,
  MoneyView,
  OrderDetailView,
  OrderItemView,
  OrderListItemView,
  PaginationView,
  ProductCardView,
  ProductDetailView,
  ProductOptionView,
  ProductUnitView,
  SectionFilter,
  SessionView,
  SnapshotView,
} from "@/lib/shopping/types";

function sellerNameOf(seller: {
  member?: { nickname: string } | null;
  citizen?: { name: string } | null;
}) {
  return seller.member?.nickname ?? seller.citizen?.name ?? "Unknown seller";
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}

function categoryTrailOf(category: IShoppingSale["categories"][number]) {
  const names: string[] = [category.name];
  let current = category.parent;

  while (current) {
    names.unshift(current.name);
    current = current.parent;
  }

  return names.join(" / ");
}

function categoryTrailsOf(categories: IShoppingSale["categories"]) {
  return uniqueStrings(categories.map(categoryTrailOf));
}

export function mapMoney(price: {
  nominal: number;
  real: number;
}): MoneyView {
  return {
    nominal: price.nominal,
    real: price.real,
    savings: Math.max(price.nominal - price.real, 0),
  };
}

export function mapPagination(pagination: {
  current: number;
  limit: number;
  records: number;
  pages: number;
}): PaginationView {
  return {
    current: pagination.current,
    limit: pagination.limit,
    records: pagination.records,
    pages: pagination.pages,
  };
}

export function mapSession(customer: {
  id: string;
  created_at: string;
  channel: { code: string; name: string };
  member: null | {
    nickname: string;
    emails: Array<{ value: string }>;
  };
  citizen: null | {
    name: string;
    mobile: string;
  };
}): SessionView {
  return {
    id: customer.id,
    createdAt: customer.created_at,
    channel: {
      code: customer.channel.code,
      name: customer.channel.name,
    },
    member: customer.member
      ? {
          nickname: customer.member.nickname,
          email: customer.member.emails[0]?.value ?? null,
        }
      : null,
    citizen: customer.citizen
      ? {
          name: customer.citizen.name,
          mobile: customer.citizen.mobile,
        }
      : null,
    isGuest: customer.member === null,
  };
}

export function mapProductCard(sale: IShoppingSale.ISummary): ProductCardView {
  return {
    id: sale.id,
    snapshotId: sale.snapshot_id,
    title: sale.content.title,
    thumbnailUrl: sale.content.thumbnails[0]?.url ?? null,
    thumbnailCount: sale.content.thumbnails.length,
    sectionName: sale.section.name,
    sellerName: sellerNameOf(sale.seller),
    categoryLabels: categoryTrailsOf(sale.categories),
    tags: sale.tags,
    priceRange: {
      lowest: mapMoney(sale.price_range.lowest),
      highest: mapMoney(sale.price_range.highest),
    },
    unitSummary: uniqueStrings(sale.units.map((unit) => unit.name)),
    status: sale.paused_at ? "paused" : "live",
    updatedAt: sale.updated_at,
  };
}

function sumPrices(
  stocks: Array<{
    price: {
      nominal: number;
      real: number;
    };
  }>,
) {
  return stocks.reduce(
    (acc, stock) => ({
      nominal: acc.nominal + stock.price.nominal,
      real: acc.real + stock.price.real,
    }),
    {
      nominal: 0,
      real: 0,
    },
  );
}

function deriveDetailPriceRange(
  units: IShoppingSale["units"],
): ProductDetailView["priceRange"] {
  const minimumScope = units.filter((unit) => unit.required);
  const lowestStocks = (minimumScope.length ? minimumScope : units).map((unit) =>
    unit.stocks.reduce((candidate, stock) =>
      stock.price.real < candidate.price.real ? stock : candidate,
    ),
  );
  const highestStocks = units.map((unit) =>
    unit.stocks.reduce((candidate, stock) =>
      stock.price.real > candidate.price.real ? stock : candidate,
    ),
  );

  return {
    lowest: mapMoney(sumPrices(lowestStocks)),
    highest: mapMoney(sumPrices(highestStocks)),
  };
}

function resolveDetailPriceRange(
  sale: IShoppingSale,
  snapshots: IShoppingSaleSnapshot.ISummary[],
): ProductDetailView["priceRange"] {
  const currentSnapshot =
    snapshots.find((snapshot) => snapshot.snapshot_id === sale.snapshot_id) ??
    snapshots.find((snapshot) => snapshot.latest);

  if (currentSnapshot) {
    return {
      lowest: mapMoney(currentSnapshot.price_range.lowest),
      highest: mapMoney(currentSnapshot.price_range.highest),
    };
  }

  return {
    ...deriveDetailPriceRange(sale.units),
  };
}

function mapProductOptions(unit: IShoppingSale["units"][number]): ProductOptionView[] {
  return unit.options.map((option) =>
    option.type === "select"
      ? {
          kind: "variant",
          id: option.id,
          name: option.name,
          variable: option.variable,
          candidates: option.candidates.map((candidate) => ({
            id: candidate.id,
            name: candidate.name,
          })),
        }
      : {
          kind: "field",
          id: option.id,
          name: option.name,
          inputType:
            option.type === "string"
              ? "text"
              : option.type === "number"
                ? "number"
                : "checkbox",
        },
  );
}

function mapUnit(unit: IShoppingSale["units"][number]): ProductUnitView {
  const prices = unit.stocks.map((stock) => stock.price.real);
  const lowest = Math.min(...prices);
  const highest = Math.max(...prices);
  const matchingLowest = unit.stocks.find((stock) => stock.price.real === lowest)!;
  const matchingHighest = unit.stocks.find((stock) => stock.price.real === highest)!;

  return {
    id: unit.id,
    name: unit.name,
    primary: unit.primary,
    required: unit.required,
    priceRange: {
      lowest: mapMoney(matchingLowest.price),
      highest: mapMoney(matchingHighest.price),
    },
    options: mapProductOptions(unit),
    stocks: unit.stocks.map((stock) => ({
      id: stock.id,
      name: stock.name,
      price: mapMoney(stock.price),
      availableQuantity: Math.max(stock.inventory.income - stock.inventory.outcome, 0),
      choices: stock.choices.map((choice) => ({
        optionId: choice.option_id,
        candidateId: choice.candidate_id,
      })),
    })),
  };
}

export function mapSnapshot(snapshot: IShoppingSaleSnapshot.ISummary): SnapshotView {
  return {
    id: snapshot.snapshot_id,
    latest: snapshot.latest,
    title: snapshot.content.title,
    createdAt: null,
    priceRange: {
      lowest: mapMoney(snapshot.price_range.lowest),
      highest: mapMoney(snapshot.price_range.highest),
    },
  };
}

export function mapProductDetail(
  sale: IShoppingSale,
  snapshots: IShoppingSaleSnapshot.ISummary[],
): ProductDetailView {
  return {
    id: sale.id,
    snapshotId: sale.snapshot_id,
    title: sale.content.title,
    description: {
      format: sale.content.format,
      body: sale.content.body,
    },
    media: [...sale.content.thumbnails, ...sale.content.files].map((file) => ({
      id: file.id,
      name: file.name,
      url: file.url,
    })),
    section: {
      code: sale.section.code,
      name: sale.section.name,
    },
    seller: {
      name: sellerNameOf(sale.seller),
    },
    categoryLabels: categoryTrailsOf(sale.categories),
    tags: sale.tags,
    priceRange: resolveDetailPriceRange(sale, snapshots),
    status: sale.paused_at ? "paused" : "live",
    units: sale.units.map(mapUnit),
    snapshots: snapshots.map(mapSnapshot),
  };
}

function mergeCategoryCounts(
  nodes: IShoppingSale["categories"],
  counts: Map<string, number>,
) {
  for (const node of nodes) {
    counts.set(node.code, (counts.get(node.code) ?? 0) + 1);
  }
}

export function mapSectionsFromSales(sales: IShoppingSale.ISummary[]): SectionFilter[] {
  const counts = new Map<string, SectionFilter>();

  for (const sale of sales) {
    const existing = counts.get(sale.section.code);
    if (existing) {
      existing.count += 1;
      continue;
    }

    counts.set(sale.section.code, {
      code: sale.section.code,
      name: sale.section.name,
      count: 1,
    });
  }

  return [...counts.values()].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

export function mapCategoryTree(
  categories: Array<{
    id: string;
    code: string;
    name: string;
    children: unknown[];
  }>,
  sales: IShoppingSale.ISummary[],
): CategoryTreeNode[] {
  const counts = new Map<string, number>();

  for (const sale of sales) {
    mergeCategoryCounts(sale.categories, counts);
  }

  const iterate = (
    nodes: Array<{
      id: string;
      code: string;
      name: string;
      children: unknown[];
    }>,
  ): CategoryTreeNode[] =>
    nodes
      .map((node) => ({
        id: node.id,
        code: node.code,
        name: node.name,
        count: counts.get(node.code) ?? 0,
        children: iterate(
          node.children as Array<{
            id: string;
            code: string;
            name: string;
            children: unknown[];
          }>,
        ),
      }))
      .filter((node) => node.count > 0 || node.children.length > 0);

  return iterate(categories);
}

function mapCartSelection(
  unit: IShoppingCartCommodity["sale"]["units"][number],
  stock: IShoppingCartCommodity["sale"]["units"][number]["stocks"][number],
): CartSelectionView {
  return {
    unitId: unit.id,
    unitName: unit.name,
    required: unit.required,
    quantity: stock.quantity,
    stockId: stock.id,
    stockName: stock.name,
    price: mapMoney(stock.price),
    choices: stock.choices.map((choice) => ({
      label: choice.option.name,
      value:
        choice.candidate?.name ??
        (typeof choice.value === "boolean"
          ? choice.value
            ? "Yes"
            : "No"
          : String(choice.value ?? "")),
    })),
  };
}

export function mapCartItem(item: IShoppingCartCommodity): CartItemView {
  const selections = item.sale.units.flatMap((unit) =>
    unit.stocks.map((stock) => mapCartSelection(unit, stock)),
  );

  return {
    id: item.id,
    saleId: item.sale.id,
    snapshotId: item.sale.snapshot_id,
    title: item.sale.content.title,
    thumbnailUrl: item.sale.content.thumbnails[0]?.url ?? null,
    sectionName: item.sale.section.name,
    categoryLabels: categoryTrailsOf(item.sale.categories),
    orderable: item.orderable,
    volume: item.volume,
    createdAt: item.created_at,
    pricePerSet: mapMoney(item.price),
    totalPrice: item.price.real * item.volume,
    selections,
  };
}

function orderStatusOf(order: IShoppingOrder): OrderListItemView["status"] {
  if (order.publish?.cancelled_at) {
    return "cancelled";
  }
  if (!order.publish) {
    return "draft";
  }
  if (order.publish.paid_at) {
    return "paid";
  }
  return "pending-payment";
}

function mapOrderItem(good: IShoppingOrder["goods"][number]): OrderItemView {
  return {
    id: good.id,
    title: good.commodity.sale.content.title,
    thumbnailUrl: good.commodity.sale.content.thumbnails[0]?.url ?? null,
    volume: good.volume,
    price: {
      cash: good.price.cash,
      nominal: good.price.nominal,
      real: good.price.real,
    },
    state: good.state,
    confirmedAt: good.confirmed_at,
    selections: good.commodity.sale.units.flatMap((unit) =>
      unit.stocks.map((stock) => mapCartSelection(unit, stock)),
    ),
  };
}

export function mapOrderListItem(order: IShoppingOrder): OrderListItemView {
  return {
    id: order.id,
    name: order.name,
    createdAt: order.created_at,
    paidAt: order.publish?.paid_at ?? null,
    cancelledAt: order.publish?.cancelled_at ?? null,
    status: orderStatusOf(order),
    itemCount: order.goods.length,
    totalPrice: order.price.real,
  };
}

function mapPublish(
  publish: IShoppingOrderPublish | null,
): OrderDetailView["publish"] {
  if (!publish) {
    return null;
  }

  return {
    id: publish.id,
    createdAt: publish.created_at,
    paidAt: publish.paid_at,
    cancelledAt: publish.cancelled_at,
    deliveryState: publish.state,
    address: {
      name: publish.address.name,
      mobile: publish.address.mobile,
      country: publish.address.country,
      province: publish.address.province,
      city: publish.address.city,
      department: publish.address.department,
      possession: publish.address.possession,
      zipCode: publish.address.zip_code,
      specialNote: publish.address.special_note,
    },
  };
}

export function mapOrderDetail(
  order: IShoppingOrder,
  canPublish: boolean,
  requiresCitizen: boolean,
): Omit<OrderDetailView, "session"> {
  return {
    id: order.id,
    name: order.name,
    createdAt: order.created_at,
    status: orderStatusOf(order),
    canPublish,
    requiresCitizen,
    price: {
      cash: order.price.cash,
      deposit: order.price.deposit,
      mileage: order.price.mileage,
      ticket: order.price.ticket,
      nominal: order.price.nominal,
      real: order.price.real,
    },
    items: order.goods.map(mapOrderItem),
    publish: mapPublish(order.publish),
  };
}
