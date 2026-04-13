export type CatalogSortKey = "recent" | "title" | "price-asc" | "price-desc";

export interface MoneyView {
  nominal: number;
  real: number;
  savings: number;
}

export interface PaginationView {
  current: number;
  limit: number;
  records: number;
  pages: number;
}

export interface SessionView {
  id: string;
  createdAt: string;
  channel: {
    code: string;
    name: string;
  };
  member: null | {
    nickname: string;
    email: string | null;
  };
  citizen: null | {
    name: string;
    mobile: string;
  };
  isGuest: boolean;
}

export interface CategoryTreeNode {
  id: string;
  code: string;
  name: string;
  count: number;
  children: CategoryTreeNode[];
}

export interface SectionFilter {
  code: string;
  name: string;
  count: number;
}

export interface ProductCardView {
  id: string;
  snapshotId: string;
  title: string;
  thumbnailUrl: string | null;
  thumbnailCount: number;
  sectionName: string;
  sellerName: string;
  categoryLabels: string[];
  tags: string[];
  priceRange: {
    lowest: MoneyView;
    highest: MoneyView;
  };
  unitSummary: string[];
  status: "live" | "paused";
  updatedAt: string;
}

export interface ProductOptionCandidateView {
  id: string;
  name: string;
}

export type ProductOptionView =
  | {
      kind: "variant";
      id: string;
      name: string;
      variable: boolean;
      candidates: ProductOptionCandidateView[];
    }
  | {
      kind: "field";
      id: string;
      name: string;
      inputType: "text" | "number" | "checkbox";
    };

export interface ProductStockView {
  id: string;
  name: string;
  price: MoneyView;
  availableQuantity: number;
  choices: Array<{
    optionId: string;
    candidateId: string;
  }>;
}

export interface ProductUnitView {
  id: string;
  name: string;
  primary: boolean;
  required: boolean;
  priceRange: {
    lowest: MoneyView;
    highest: MoneyView;
  };
  options: ProductOptionView[];
  stocks: ProductStockView[];
}

export interface SnapshotView {
  id: string;
  latest: boolean;
  title: string;
  createdAt: string | null;
  priceRange: {
    lowest: MoneyView;
    highest: MoneyView;
  };
}

export interface ProductDetailView {
  id: string;
  snapshotId: string;
  title: string;
  description: {
    format: "txt" | "md" | "html";
    body: string;
  };
  media: Array<{
    id: string;
    name: string;
    url: string;
  }>;
  section: {
    code: string;
    name: string;
  };
  seller: {
    name: string;
  };
  categoryLabels: string[];
  tags: string[];
  priceRange: {
    lowest: MoneyView;
    highest: MoneyView;
  };
  status: "live" | "paused";
  units: ProductUnitView[];
  snapshots: SnapshotView[];
}

export interface CatalogView {
  session: SessionView;
  currentChannel: {
    code: string;
    name: string;
  };
  sections: SectionFilter[];
  categories: CategoryTreeNode[];
  products: ProductCardView[];
  pagination: PaginationView;
  query: {
    q: string;
    section: string | null;
    category: string | null;
    sort: CatalogSortKey;
    page: number;
    pageSize: number;
  };
}

export interface CartSelectionView {
  unitId: string;
  unitName: string;
  required: boolean;
  quantity: number;
  stockId: string;
  stockName: string;
  price: MoneyView;
  choices: Array<{
    label: string;
    value: string;
  }>;
}

export interface CartItemView {
  id: string;
  saleId: string;
  snapshotId: string;
  title: string;
  thumbnailUrl: string | null;
  sectionName: string;
  categoryLabels: string[];
  orderable: boolean;
  volume: number;
  createdAt: string;
  pricePerSet: MoneyView;
  totalPrice: number;
  selections: CartSelectionView[];
}

export interface CartView {
  session: SessionView;
  items: CartItemView[];
  totals: {
    itemCount: number;
    quantity: number;
    subtotal: number;
  };
}

export interface OrderListItemView {
  id: string;
  name: string;
  createdAt: string;
  paidAt: string | null;
  cancelledAt: string | null;
  status: "draft" | "paid" | "pending-payment" | "cancelled";
  itemCount: number;
  totalPrice: number;
}

export interface OrderItemView {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  volume: number;
  price: {
    cash: number;
    nominal: number;
    real: number;
  };
  state: string | null;
  confirmedAt: string | null;
  selections: CartSelectionView[];
}

export interface OrderDetailView {
  session: SessionView;
  id: string;
  name: string;
  createdAt: string;
  status: "draft" | "paid" | "pending-payment" | "cancelled";
  canPublish: boolean;
  requiresCitizen: boolean;
  price: {
    cash: number;
    deposit: number;
    mileage: number;
    ticket: number;
    nominal: number;
    real: number;
  };
  items: OrderItemView[];
  publish: null | {
    id: string;
    createdAt: string;
    paidAt: string | null;
    cancelledAt: string | null;
    deliveryState: string;
    address: {
      name: string;
      mobile: string;
      country: string;
      province: string;
      city: string;
      department: string;
      possession: string;
      zipCode: string;
      specialNote: string | null;
    };
  };
}

export interface OrderCollectionView {
  session: SessionView;
  orders: OrderListItemView[];
  pagination: PaginationView;
}

export interface AddToCartPayload {
  saleId: string;
  volume: number;
  selections: Array<{
    unitId: string;
    stockId: string;
    quantity: number;
    optionValues: Array<{
      optionId: string;
      value: string | number | boolean | null;
    }>;
  }>;
}

export interface UpdateCartPayload {
  volume: number;
}

export interface CreateOrderPayload {
  commodityIds: string[];
}

export interface ActivateCitizenPayload {
  name: string;
  mobile: string;
}

export interface PublishOrderPayload {
  mobile: string;
  name: string;
  country: string;
  province: string;
  city: string;
  department: string;
  possession: string;
  zipCode: string;
  specialNote: string | null;
}

export interface JoinMemberPayload {
  email: string;
  password: string;
  nickname: string;
  citizen: null | ActivateCitizenPayload;
}

export interface LoginMemberPayload {
  email: string;
  password: string;
}
