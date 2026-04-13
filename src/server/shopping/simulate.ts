import "server-only";

import type { IConnection } from "@samchon/shopping-api";

type Price = {
  nominal: number;
  real: number;
};

type SelectOptionFixture = {
  kind: "select";
  id: string;
  name: string;
  variable: boolean;
  candidates: Array<{
    id: string;
    name: string;
  }>;
};

type FieldOptionFixture = {
  kind: "field";
  id: string;
  name: string;
  inputType: "string" | "number" | "boolean";
};

type OptionFixture = SelectOptionFixture | FieldOptionFixture;

type StockFixture = {
  id: string;
  name: string;
  price: Price;
  quantity: number;
  choices: Array<{
    optionId: string;
    candidateId: string;
  }>;
};

type UnitFixture = {
  id: string;
  name: string;
  primary: boolean;
  required: boolean;
  options: OptionFixture[];
  stocks: StockFixture[];
};

type CategoryNode = {
  id: string;
  code: string;
  parent_id: string | null;
  name: string;
  created_at: string;
  children: CategoryNode[];
  parent_code: string | null;
};

type SectionRecord = {
  id: string;
  code: string;
  name: string;
  created_at: string;
};

type AttachmentRecord = {
  id: string;
  name: string;
  extension: string | null;
  url: string;
  created_at: string;
};

type SaleFixture = {
  id: string;
  snapshotId: string;
  title: string;
  description: {
    format: "html" | "md" | "txt";
    body: string;
  };
  thumbnails: AttachmentRecord[];
  files: AttachmentRecord[];
  section: SectionRecord;
  categoryCodes: string[];
  tags: string[];
  units: UnitFixture[];
  snapshots: Array<{
    snapshot_id: string;
    latest: boolean;
    content: {
      title: string;
    };
    price_range: {
      lowest: Price;
      highest: Price;
    };
  }>;
  created_at: string;
  updated_at: string;
  paused_at: string | null;
  suspended_at: string | null;
  opened_at: string | null;
  closed_at: string | null;
};

type MemberRecord = {
  id: string;
  nickname: string;
  email: string;
  password: string;
  created_at: string;
  citizen: null | {
    id: string;
    name: string;
    mobile: string;
    created_at: string;
  };
};

type CustomerRecord = {
  id: string;
  type: "customer";
  channel: {
    id: string;
    code: string;
    name: string;
    created_at: string;
  };
  external_user: null;
  href: string;
  referrer: string | null;
  ip: string;
  created_at: string;
  member: null | {
    id: string;
    nickname: string;
    emails: Array<{
      id: string;
      value: string;
      created_at: string;
    }>;
    created_at: string;
  };
  citizen: null | {
    id: string;
    name: string;
    mobile: string;
    created_at: string;
  };
};

type CartCommodityRecord = {
  id: string;
  sale_id: string;
  volume: number;
  orderable: boolean;
  pseudo: boolean;
  created_at: string;
  selections: Array<{
    unit_id: string;
    stock_id: string;
    quantity: number;
    values: Record<string, string | number | boolean | null>;
  }>;
};

type OrderGoodRecord = {
  id: string;
  commodity_id: string;
  commodity: ReturnType<typeof toApiCommodity>;
  volume: number;
  price: {
    cash: number;
    deposit: number;
    mileage: number;
    ticket: number;
    nominal: number;
    real: number;
  };
  state: string | null;
  confirmed_at: string | null;
};

type PublishRecord = {
  id: string;
  created_at: string;
  paid_at: string | null;
  cancelled_at: string | null;
  state: string;
  address: {
    id: string;
    created_at: string;
    mobile: string;
    name: string;
    country: string;
    province: string;
    city: string;
    department: string;
    possession: string;
    zip_code: string;
    special_note: string | null;
  };
  deliveries: unknown[];
};

type OrderRecord = {
  id: string;
  name: string;
  customer_id: string;
  goods: OrderGoodRecord[];
  publish: PublishRecord | null;
  created_at: string;
};

type SimulationState = {
  sequence: number;
  tick: number;
  channel: {
    id: string;
    code: string;
    name: string;
    created_at: string;
    categories: CategoryNode[];
  };
  categories: Map<string, CategoryNode>;
  sales: SaleFixture[];
  salesById: Map<string, SaleFixture>;
  customers: Map<string, CustomerRecord>;
  accessTokens: Map<string, string>;
  refreshTokens: Map<string, string>;
  carts: Map<string, CartCommodityRecord[]>;
  orders: Map<string, OrderRecord[]>;
  members: Map<string, MemberRecord>;
};

const GLOBAL_STATE_KEY = "__shopping_frontend_simulation__";
const BASE_TIME = Date.parse("2026-04-13T00:00:00.000Z");

function getSimulationState(): SimulationState {
  const globalScope = globalThis as typeof globalThis & {
    [GLOBAL_STATE_KEY]?: SimulationState;
  };

  globalScope[GLOBAL_STATE_KEY] ??= createSimulationState();
  return globalScope[GLOBAL_STATE_KEY];
}

function createSvgDataUrl(title: string, colors: [string, string, string]) {
  const [start, end, accent] = colors;
  const safeTitle = escapeHtml(title);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${start}" />
          <stop offset="100%" stop-color="${end}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="900" rx="56" fill="url(#bg)" />
      <circle cx="980" cy="180" r="160" fill="${accent}" fill-opacity="0.22" />
      <circle cx="210" cy="730" r="210" fill="#ffffff" fill-opacity="0.08" />
      <rect x="112" y="128" width="976" height="644" rx="44" fill="#ffffff" fill-opacity="0.1" stroke="#ffffff" stroke-opacity="0.25" />
      <text x="112" y="220" fill="#ffffff" font-family="Manrope, Arial, sans-serif" font-size="64" font-weight="700">${safeTitle}</text>
      <text x="112" y="290" fill="#ffffff" fill-opacity="0.8" font-family="IBM Plex Mono, monospace" font-size="28">Samchon shopping simulation snapshot</text>
      <text x="112" y="694" fill="#ffffff" fill-opacity="0.7" font-family="IBM Plex Mono, monospace" font-size="24">Deterministic Playwright fixture image</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function stableChoiceId(parts: string[]) {
  let hash = 0;
  for (const part of parts.join("|")) {
    hash = (hash * 31 + part.charCodeAt(0)) >>> 0;
  }
  const value = hash.toString(16).padStart(12, "0").slice(-12);
  return `00000000-0000-4000-8000-${value}`;
}

function currentTimestamp(state: SimulationState) {
  return new Date(BASE_TIME + state.tick * 60_000).toISOString();
}

function advanceTimestamp(state: SimulationState, minutes = 13) {
  const value = currentTimestamp(state);
  state.tick += minutes;
  return value;
}

function nextRuntimeId(state: SimulationState) {
  const value = state.sequence.toString(16).padStart(12, "0");
  state.sequence += 1;
  return `00000000-0000-4000-8000-${value}`;
}

function issueTokens(state: SimulationState, customer: CustomerRecord) {
  const issuedAt = currentTimestamp(state);
  const access = `sim-access-${nextRuntimeId(state)}`;
  const refresh = `sim-refresh-${nextRuntimeId(state)}`;

  state.accessTokens.set(access, customer.id);
  state.refreshTokens.set(refresh, customer.id);

  return {
    setHeaders: {
      Authorization: `Bearer ${access}`,
    },
    token: {
      access,
      refresh,
      expired_at: new Date(Date.parse(issuedAt) + 3 * 60 * 60 * 1000).toISOString(),
      refreshable_until: new Date(
        Date.parse(issuedAt) + 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    },
  };
}

function makeMemberProjection(member: MemberRecord) {
  return {
    id: member.id,
    nickname: member.nickname,
    emails: [
      {
        id: stableChoiceId([member.id, member.email]),
        value: member.email,
        created_at: member.created_at,
      },
    ],
    created_at: member.created_at,
  };
}

function pageOf<T>(items: T[], input: { page?: number; limit?: number } = {}) {
  const records = items.length;
  const limit =
    input.limit && input.limit > 0 ? input.limit : records > 0 ? records : 1;
  const current = input.limit && input.limit > 0 ? Math.max(input.page ?? 1, 1) : 1;
  const pages = records === 0 ? 0 : Math.ceil(records / limit);
  const start = input.limit && input.limit > 0 ? (current - 1) * limit : 0;
  const data = input.limit && input.limit > 0 ? items.slice(start, start + limit) : items;

  return {
    pagination: {
      current,
      limit,
      records,
      pages,
    },
    data,
  };
}

function parseAuthorization(headers: Headers) {
  const authorization = headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }
  return authorization.slice("Bearer ".length);
}

function httpError(status: number, message: string) {
  return Response.json({ message }, { status });
}

function requireCustomer(state: SimulationState, headers: Headers) {
  const accessToken = parseAuthorization(headers);
  const customerId = accessToken ? state.accessTokens.get(accessToken) : null;
  const customer = customerId ? state.customers.get(customerId) : null;

  if (!customer) {
    throw httpError(401, "A simulated customer session is required.");
  }
  return customer;
}

async function parseJsonBody(init?: RequestInit) {
  const raw =
    typeof init?.body === "string"
      ? init.body
      : init?.body instanceof Uint8Array
        ? new TextDecoder().decode(init.body)
        : null;

  if (!raw || !raw.length) {
    return null;
  }
  return JSON.parse(raw) as Record<string, unknown>;
}

function ensureArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function cloneCustomer(customer: CustomerRecord) {
  return structuredClone(customer);
}

function createSimulationState(): SimulationState {
  const state: SimulationState = {
    sequence: 1,
    tick: 0,
    channel: {
      id: "",
      code: "samchon",
      name: "Samchon Storefront",
      created_at: "",
      categories: [],
    },
    categories: new Map(),
    sales: [],
    salesById: new Map(),
    customers: new Map(),
    accessTokens: new Map(),
    refreshTokens: new Map(),
    carts: new Map(),
    orders: new Map(),
    members: new Map(),
  };

  const createCategory = (code: string, name: string, parentCode: string | null) => {
    const parent = parentCode ? state.categories.get(parentCode) : null;
    const category: CategoryNode = {
      id: nextRuntimeId(state),
      code,
      parent_id: parent?.id ?? null,
      name,
      created_at: advanceTimestamp(state, 5),
      children: [],
      parent_code: parentCode,
    };
    state.categories.set(code, category);
    if (parent) {
      parent.children.push(category);
    } else {
      state.channel.categories.push(category);
    }
  };

  const createSection = (code: string, name: string): SectionRecord => ({
    id: nextRuntimeId(state),
    code,
    name,
    created_at: advanceTimestamp(state),
  });

  const createAttachment = (
    title: string,
    colors: [string, string, string],
  ): AttachmentRecord => ({
    id: nextRuntimeId(state),
    name: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    extension: "png",
    url: createSvgDataUrl(title, colors),
    created_at: advanceTimestamp(state, 3),
  });

  const createSale = (
    input: Omit<SaleFixture, "id" | "snapshotId" | "created_at"> & {
      created_at?: string;
    },
  ): SaleFixture => ({
    ...input,
    id: nextRuntimeId(state),
    snapshotId: nextRuntimeId(state),
    created_at: input.created_at ?? advanceTimestamp(state),
  });

  state.channel = {
    id: nextRuntimeId(state),
    code: "samchon",
    name: "Samchon Storefront",
    created_at: advanceTimestamp(state),
    categories: [],
  };

  createCategory("electronics", "Electronics", null);
  createCategory("laptops", "Laptops", "electronics");
  createCategory("macbooks", "MacBooks", "laptops");
  createCategory("tablets", "Tablets", "electronics");
  createCategory("ipads", "iPads", "tablets");
  createCategory("smart_phones", "Smart Phones", "electronics");
  createCategory("smart_watches", "Smart Watches", "electronics");

  const studio = createSection("studio", "Studio");
  const mobile = createSection("mobile", "Mobile");
  const wearables = createSection("wearables", "Wearables");

  const selectOption = (
    name: string,
    candidates: string[],
  ): SelectOptionFixture => ({
    kind: "select",
    id: nextRuntimeId(state),
    name,
    variable: true,
    candidates: candidates.map((candidate) => ({
      id: nextRuntimeId(state),
      name: candidate,
    })),
  });

  const macbookChip = selectOption("Chip", ["M4 Pro", "M4 Max"]);
  const macbookMemory = selectOption("Memory", ["24GB", "48GB"]);
  const iphoneColor = selectOption("Color", [
    "Natural Titanium",
    "Black Titanium",
  ]);
  const iphoneStorage = selectOption("Storage", ["256GB", "512GB"]);
  const ipadStorage = selectOption("Storage", ["256GB", "1TB"]);
  const ipadConnectivity = selectOption("Connectivity", [
    "Wi-Fi",
    "Wi-Fi + Cellular",
  ]);
  const watchCase = selectOption("Case", [
    "Natural Titanium",
    "Black Titanium",
  ]);
  const watchBand = selectOption("Band", ["Ocean", "Trail"]);

  const macbook = createSale({
    title: "MacBook Pro 16 Creator Bundle",
    description: {
      format: "md",
      body: [
        "A studio-oriented MacBook configuration with fast memory and quiet thermals.",
        "",
        "- 16-inch Liquid Retina XDR display",
        "- High-bandwidth unified memory options",
        "- Optional protection plan for long projects",
      ].join("\n"),
    },
    thumbnails: [
      createAttachment("MacBook Pro 16 Creator Bundle", [
        "#0f172a",
        "#0369a1",
        "#f59e0b",
      ]),
    ],
    files: [],
    section: studio,
    categoryCodes: ["macbooks"],
    tags: ["studio", "creator", "macbook"],
    units: [
      {
        id: nextRuntimeId(state),
        name: "Main Body",
        primary: true,
        required: true,
        options: [macbookChip, macbookMemory],
        stocks: [
          createVariantStock(
            state,
            "M4 Pro / 24GB",
            { nominal: 1_990_000, real: 1_800_000 },
            11,
            macbookChip,
            0,
            macbookMemory,
            0,
          ),
          createVariantStock(
            state,
            "M4 Pro / 48GB",
            { nominal: 2_390_000, real: 2_180_000 },
            7,
            macbookChip,
            0,
            macbookMemory,
            1,
          ),
          createVariantStock(
            state,
            "M4 Max / 24GB",
            { nominal: 2_990_000, real: 2_760_000 },
            4,
            macbookChip,
            1,
            macbookMemory,
            0,
          ),
          createVariantStock(
            state,
            "M4 Max / 48GB",
            { nominal: 3_390_000, real: 3_100_000 },
            3,
            macbookChip,
            1,
            macbookMemory,
            1,
          ),
        ],
      },
      {
        id: nextRuntimeId(state),
        name: "AppleCare+",
        primary: false,
        required: false,
        options: [],
        stocks: [createSimpleStock(state, "3-year coverage", 129_000, 89_000, 30)],
      },
    ],
    snapshots: [
      createSnapshot(
        state,
        "MacBook Pro 16 Creator Bundle / Winter launch",
        { nominal: 2_090_000, real: 1_920_000 },
        { nominal: 3_490_000, real: 3_250_000 },
        false,
      ),
      createSnapshot(
        state,
        "MacBook Pro 16 Creator Bundle",
        { nominal: 1_990_000, real: 1_800_000 },
        { nominal: 3_519_000, real: 3_189_000 },
        true,
      ),
    ],
    updated_at: "2026-04-12T09:00:00.000Z",
    paused_at: null,
    suspended_at: null,
    opened_at: "2026-03-28T00:00:00.000Z",
    closed_at: null,
  });

  const iphone = createSale({
    title: "iPhone 16 Pro Field Kit",
    description: {
      format: "md",
      body: [
        "A fast mobile setup for daily capture and field research.",
        "",
        "- Titanium chassis with bright display",
        "- Dual storage presets",
        "- Optional charging companion",
      ].join("\n"),
    },
    thumbnails: [
      createAttachment("iPhone 16 Pro Field Kit", [
        "#1f2937",
        "#475569",
        "#22c55e",
      ]),
    ],
    files: [],
    section: mobile,
    categoryCodes: ["smart_phones"],
    tags: ["iphone", "field", "camera"],
    units: [
      {
        id: nextRuntimeId(state),
        name: "Handset",
        primary: true,
        required: true,
        options: [iphoneColor, iphoneStorage],
        stocks: [
          createVariantStock(
            state,
            "Natural Titanium / 256GB",
            { nominal: 1_650_000, real: 1_520_000 },
            15,
            iphoneColor,
            0,
            iphoneStorage,
            0,
          ),
          createVariantStock(
            state,
            "Natural Titanium / 512GB",
            { nominal: 1_930_000, real: 1_790_000 },
            12,
            iphoneColor,
            0,
            iphoneStorage,
            1,
          ),
          createVariantStock(
            state,
            "Black Titanium / 256GB",
            { nominal: 1_650_000, real: 1_520_000 },
            9,
            iphoneColor,
            1,
            iphoneStorage,
            0,
          ),
          createVariantStock(
            state,
            "Black Titanium / 512GB",
            { nominal: 1_930_000, real: 1_790_000 },
            6,
            iphoneColor,
            1,
            iphoneStorage,
            1,
          ),
        ],
      },
      {
        id: nextRuntimeId(state),
        name: "MagSafe Charger",
        primary: false,
        required: false,
        options: [],
        stocks: [createSimpleStock(state, "15W puck", 69_000, 55_000, 40)],
      },
    ],
    snapshots: [
      createSnapshot(
        state,
        "iPhone 16 Pro Field Kit / Prelaunch",
        { nominal: 1_730_000, real: 1_610_000 },
        { nominal: 2_010_000, real: 1_865_000 },
        false,
      ),
      createSnapshot(
        state,
        "iPhone 16 Pro Field Kit",
        { nominal: 1_650_000, real: 1_520_000 },
        { nominal: 1_999_000, real: 1_845_000 },
        true,
      ),
    ],
    updated_at: "2026-04-11T05:30:00.000Z",
    paused_at: null,
    suspended_at: null,
    opened_at: "2026-04-01T00:00:00.000Z",
    closed_at: null,
  });

  const ipad = createSale({
    title: "iPad Pro 13 Sketch Set",
    description: {
      format: "md",
      body: [
        "A large canvas setup for sketching, note taking, and client walkthroughs.",
        "",
        "- Tandem OLED display",
        "- Storage and connectivity combinations",
        "- Optional stylus companion",
      ].join("\n"),
    },
    thumbnails: [
      createAttachment("iPad Pro 13 Sketch Set", [
        "#f8fafc",
        "#0f766e",
        "#fb7185",
      ]),
    ],
    files: [],
    section: studio,
    categoryCodes: ["ipads"],
    tags: ["ipad", "illustration", "portable"],
    units: [
      {
        id: nextRuntimeId(state),
        name: "Tablet",
        primary: true,
        required: true,
        options: [ipadStorage, ipadConnectivity],
        stocks: [
          createVariantStock(
            state,
            "256GB / Wi-Fi",
            { nominal: 1_790_000, real: 1_640_000 },
            10,
            ipadStorage,
            0,
            ipadConnectivity,
            0,
          ),
          createVariantStock(
            state,
            "256GB / Wi-Fi + Cellular",
            { nominal: 2_030_000, real: 1_890_000 },
            8,
            ipadStorage,
            0,
            ipadConnectivity,
            1,
          ),
          createVariantStock(
            state,
            "1TB / Wi-Fi",
            { nominal: 2_510_000, real: 2_360_000 },
            5,
            ipadStorage,
            1,
            ipadConnectivity,
            0,
          ),
          createVariantStock(
            state,
            "1TB / Wi-Fi + Cellular",
            { nominal: 2_750_000, real: 2_590_000 },
            4,
            ipadStorage,
            1,
            ipadConnectivity,
            1,
          ),
        ],
      },
      {
        id: nextRuntimeId(state),
        name: "Apple Pencil Pro",
        primary: false,
        required: false,
        options: [],
        stocks: [
          createSimpleStock(state, "Apple Pencil Pro", 199_000, 179_000, 22),
        ],
      },
    ],
    snapshots: [
      createSnapshot(
        state,
        "iPad Pro 13 Sketch Set / Early preview",
        { nominal: 1_860_000, real: 1_710_000 },
        { nominal: 2_890_000, real: 2_730_000 },
        false,
      ),
      createSnapshot(
        state,
        "iPad Pro 13 Sketch Set",
        { nominal: 1_790_000, real: 1_640_000 },
        { nominal: 2_949_000, real: 2_769_000 },
        true,
      ),
    ],
    updated_at: "2026-04-08T11:20:00.000Z",
    paused_at: null,
    suspended_at: null,
    opened_at: "2026-03-14T00:00:00.000Z",
    closed_at: null,
  });

  const watch = createSale({
    title: "Apple Watch Ultra Route Pack",
    description: {
      format: "md",
      body: [
        "A rugged watch setup for training blocks and outdoor routes.",
        "",
        "- Dual-frequency GPS",
        "- Two case finishes and two band styles",
        "- Paused temporarily while stock labels are being refreshed",
      ].join("\n"),
    },
    thumbnails: [
      createAttachment("Apple Watch Ultra Route Pack", [
        "#111827",
        "#334155",
        "#38bdf8",
      ]),
    ],
    files: [],
    section: wearables,
    categoryCodes: ["smart_watches"],
    tags: ["watch", "outdoor", "gps"],
    units: [
      {
        id: nextRuntimeId(state),
        name: "Watch",
        primary: true,
        required: true,
        options: [watchCase, watchBand],
        stocks: [
          createVariantStock(
            state,
            "Natural Titanium / Ocean",
            { nominal: 1_180_000, real: 1_040_000 },
            9,
            watchCase,
            0,
            watchBand,
            0,
          ),
          createVariantStock(
            state,
            "Natural Titanium / Trail",
            { nominal: 1_180_000, real: 1_040_000 },
            6,
            watchCase,
            0,
            watchBand,
            1,
          ),
          createVariantStock(
            state,
            "Black Titanium / Ocean",
            { nominal: 1_240_000, real: 1_090_000 },
            4,
            watchCase,
            1,
            watchBand,
            0,
          ),
          createVariantStock(
            state,
            "Black Titanium / Trail",
            { nominal: 1_240_000, real: 1_090_000 },
            4,
            watchCase,
            1,
            watchBand,
            1,
          ),
        ],
      },
    ],
    snapshots: [
      createSnapshot(
        state,
        "Apple Watch Ultra Route Pack / Launch",
        { nominal: 1_230_000, real: 1_110_000 },
        { nominal: 1_290_000, real: 1_170_000 },
        false,
      ),
      createSnapshot(
        state,
        "Apple Watch Ultra Route Pack",
        { nominal: 1_180_000, real: 1_040_000 },
        { nominal: 1_240_000, real: 1_090_000 },
        true,
      ),
    ],
    updated_at: "2026-04-10T07:45:00.000Z",
    paused_at: "2026-04-12T02:10:00.000Z",
    suspended_at: null,
    opened_at: "2026-02-20T00:00:00.000Z",
    closed_at: null,
  });

  macbook.snapshots.find((snapshot) => snapshot.latest)!.snapshot_id = macbook.snapshotId;
  iphone.snapshots.find((snapshot) => snapshot.latest)!.snapshot_id = iphone.snapshotId;
  ipad.snapshots.find((snapshot) => snapshot.latest)!.snapshot_id = ipad.snapshotId;
  watch.snapshots.find((snapshot) => snapshot.latest)!.snapshot_id = watch.snapshotId;

  state.sales = [macbook, iphone, ipad, watch];
  state.salesById = new Map(state.sales.map((sale) => [sale.id, sale]));
  state.members.set("pilot@samchon.dev", {
    id: nextRuntimeId(state),
    nickname: "Pilot",
    email: "pilot@samchon.dev",
    password: "demo1234",
    created_at: advanceTimestamp(state),
    citizen: {
      id: nextRuntimeId(state),
      name: "Pilot Kim",
      mobile: "01012345678",
      created_at: advanceTimestamp(state, 5),
    },
  });

  return state;
}

function createSimpleStock(
  state: SimulationState,
  name: string,
  nominal: number,
  real: number,
  quantity: number,
): StockFixture {
  return {
    id: nextRuntimeId(state),
    name,
    price: { nominal, real },
    quantity,
    choices: [],
  };
}

function createVariantStock(
  state: SimulationState,
  name: string,
  price: Price,
  quantity: number,
  left: SelectOptionFixture,
  leftIndex: number,
  right: SelectOptionFixture,
  rightIndex: number,
): StockFixture {
  return {
    id: nextRuntimeId(state),
    name,
    price,
    quantity,
    choices: [
      {
        optionId: left.id,
        candidateId: left.candidates[leftIndex].id,
      },
      {
        optionId: right.id,
        candidateId: right.candidates[rightIndex].id,
      },
    ],
  };
}

function createSnapshot(
  state: SimulationState,
  title: string,
  lowest: Price,
  highest: Price,
  latest: boolean,
) {
  return {
    snapshot_id: nextRuntimeId(state),
    latest,
    content: {
      title,
    },
    price_range: {
      lowest,
      highest,
    },
  };
}

function categoryInvert(
  state: SimulationState,
  code: string,
): {
  id: string;
  code: string;
  parent_id: string | null;
  name: string;
  created_at: string;
  parent: ReturnType<typeof categoryInvert> | null;
} {
  const category = state.categories.get(code);
  if (!category) {
    throw new Error(`Unknown category code: ${code}`);
  }

  return {
    id: category.id,
    code: category.code,
    parent_id: category.parent_id,
    name: category.name,
    created_at: category.created_at,
    parent: category.parent_code ? categoryInvert(state, category.parent_code) : null,
  };
}

function inventoryOf(stock: StockFixture) {
  return {
    income: stock.quantity,
    outcome: 0,
  };
}

function unitPriceRange(unit: UnitFixture) {
  const prices = unit.stocks.map((stock) => stock.price.real);
  const lowest = Math.min(...prices);
  const highest = Math.max(...prices);
  const lowestStock = unit.stocks.find((stock) => stock.price.real === lowest)!;
  const highestStock = unit.stocks.find((stock) => stock.price.real === highest)!;

  return {
    lowest: lowestStock.price,
    highest: highestStock.price,
  };
}

function toApiSeller() {
  return {
    id: "00000000-0000-4000-8000-00000000beef",
    member: {
      id: "00000000-0000-4000-8000-00000000feed",
      nickname: "Robot",
      emails: [],
      created_at: "2026-03-01T00:00:00.000Z",
    },
    citizen: null,
  };
}

function toApiOption(option: OptionFixture) {
  if (option.kind === "select") {
    return {
      id: option.id,
      type: "select" as const,
      name: option.name,
      variable: option.variable,
      candidates: option.candidates.map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
      })),
    };
  }

  return {
    id: option.id,
    type:
      option.inputType === "boolean"
        ? ("boolean" as const)
        : option.inputType === "number"
          ? ("number" as const)
          : ("string" as const),
    name: option.name,
  };
}

function toApiSaleSummary(state: SimulationState, sale: SaleFixture) {
  const currentSnapshot =
    sale.snapshots.find((snapshot) => snapshot.snapshot_id === sale.snapshotId) ??
    sale.snapshots.find((snapshot) => snapshot.latest) ??
    sale.snapshots[0];

  return {
    id: sale.id,
    snapshot_id: sale.snapshotId,
    latest: true,
    content: {
      id: sale.thumbnails[0]?.id ?? nextRuntimeId(state),
      title: sale.title,
      thumbnails: structuredClone(sale.thumbnails),
    },
    categories: sale.categoryCodes.map((code) => categoryInvert(state, code)),
    tags: structuredClone(sale.tags),
    units: sale.units.map((unit) => ({
      id: unit.id,
      name: unit.name,
      primary: unit.primary,
      required: unit.required,
      price_range: unitPriceRange(unit),
    })),
    price_range: structuredClone(currentSnapshot.price_range),
    created_at: sale.created_at,
    updated_at: sale.updated_at,
    paused_at: sale.paused_at,
    suspended_at: sale.suspended_at,
    opened_at: sale.opened_at,
    closed_at: sale.closed_at,
    section: structuredClone(sale.section),
    seller: toApiSeller(),
  };
}

function toApiSaleDetail(state: SimulationState, sale: SaleFixture) {
  return {
    id: sale.id,
    snapshot_id: sale.snapshotId,
    latest: true,
    content: {
      id: sale.thumbnails[0]?.id ?? nextRuntimeId(state),
      title: sale.title,
      format: sale.description.format,
      body: sale.description.body,
      files: structuredClone(sale.files),
      thumbnails: structuredClone(sale.thumbnails),
    },
    categories: sale.categoryCodes.map((code) => categoryInvert(state, code)),
    tags: structuredClone(sale.tags),
    units: sale.units.map((unit) => ({
      id: unit.id,
      name: unit.name,
      primary: unit.primary,
      required: unit.required,
      options: unit.options.map(toApiOption),
      stocks: unit.stocks.map((stock) => ({
        id: stock.id,
        name: stock.name,
        price: structuredClone(stock.price),
        inventory: inventoryOf(stock),
        choices: stock.choices.map((choice) => ({
          id: stableChoiceId([stock.id, choice.optionId, choice.candidateId]),
          option_id: choice.optionId,
          candidate_id: choice.candidateId,
        })),
      })),
    })),
    created_at: sale.created_at,
    updated_at: sale.updated_at,
    paused_at: sale.paused_at,
    suspended_at: sale.suspended_at,
    opened_at: sale.opened_at,
    closed_at: sale.closed_at,
    section: structuredClone(sale.section),
    seller: toApiSeller(),
  };
}

function toApiChannel(state: SimulationState) {
  const iterate = (node: CategoryNode): CategoryNode => ({
    id: node.id,
    code: node.code,
    parent_id: node.parent_id,
    name: node.name,
    created_at: node.created_at,
    parent_code: node.parent_code,
    children: node.children.map(iterate),
  });

  return {
    id: state.channel.id,
    code: state.channel.code,
    name: state.channel.name,
    created_at: state.channel.created_at,
    categories: state.channel.categories.map(iterate),
  };
}

function computeCommodityPrice(commodity: CartCommodityRecord, sale: SaleFixture): Price {
  return commodity.selections.reduce<Price>(
    (acc, selection) => {
      const unit = sale.units.find((candidate) => candidate.id === selection.unit_id);
      const stock = unit?.stocks.find((candidate) => candidate.id === selection.stock_id);
      if (!stock) {
        return acc;
      }

      return {
        nominal: acc.nominal + stock.price.nominal * selection.quantity,
        real: acc.real + stock.price.real * selection.quantity,
      };
    },
    { nominal: 0, real: 0 },
  );
}

function toApiCommodity(state: SimulationState, commodity: CartCommodityRecord) {
  const sale = state.salesById.get(commodity.sale_id);
  if (!sale) {
    throw new Error(`Unknown sale: ${commodity.sale_id}`);
  }

  const units = commodity.selections
    .map((selection) => {
      const unit = sale.units.find((candidate) => candidate.id === selection.unit_id);
      const stock = unit?.stocks.find((candidate) => candidate.id === selection.stock_id);
      if (!unit || !stock) {
        return null;
      }

      return {
        id: unit.id,
        name: unit.name,
        primary: unit.primary,
        required: unit.required,
        stocks: [
          {
            id: stock.id,
            name: stock.name,
            price: structuredClone(stock.price),
            quantity: selection.quantity,
            inventory: inventoryOf(stock),
            choices: [
              ...stock.choices.map((choice) => {
                const option = unit.options.find(
                  (candidate) => candidate.id === choice.optionId,
                ) as SelectOptionFixture | undefined;
                const candidate = option?.candidates.find(
                  (item) => item.id === choice.candidateId,
                );
                return {
                  id: stableChoiceId([stock.id, choice.optionId, choice.candidateId]),
                  option: option
                    ? {
                        id: option.id,
                        type: "select" as const,
                        name: option.name,
                        variable: option.variable,
                      }
                    : null,
                  candidate: candidate
                    ? {
                        id: candidate.id,
                        name: candidate.name,
                      }
                    : null,
                  value: null,
                };
              }),
              ...unit.options
                .filter(
                  (option): option is FieldOptionFixture => option.kind === "field",
                )
                .filter((option) => option.id in selection.values)
                .map((option) => ({
                  id: stableChoiceId([stock.id, option.id, String(selection.values[option.id])]),
                  option: {
                    id: option.id,
                    type:
                      option.inputType === "boolean"
                        ? ("boolean" as const)
                        : option.inputType === "number"
                          ? ("number" as const)
                          : ("string" as const),
                    name: option.name,
                  },
                  candidate: null,
                  value: selection.values[option.id] ?? null,
                })),
            ].filter((choice) => choice.option !== null),
          },
        ],
      };
    })
    .filter((unit): unit is NonNullable<typeof unit> => unit !== null);

  return {
    id: commodity.id,
    sale: {
      id: sale.id,
      snapshot_id: sale.snapshotId,
      latest: true,
      content: {
        id: sale.thumbnails[0]?.id ?? nextRuntimeId(state),
        title: sale.title,
        thumbnails: structuredClone(sale.thumbnails),
      },
      categories: sale.categoryCodes.map((code) => categoryInvert(state, code)),
      tags: structuredClone(sale.tags),
      units,
      created_at: sale.created_at,
      updated_at: sale.updated_at,
      paused_at: sale.paused_at,
      suspended_at: sale.suspended_at,
      opened_at: sale.opened_at,
      closed_at: sale.closed_at,
      section: structuredClone(sale.section),
      seller: toApiSeller(),
    },
    orderable: commodity.orderable,
    pseudo: commodity.pseudo,
    volume: commodity.volume,
    price: computeCommodityPrice(commodity, sale),
    created_at: commodity.created_at,
  };
}

function computeOrderPrice(goods: OrderGoodRecord[]) {
  return goods.reduce(
    (acc, good) => ({
      cash: acc.cash + good.price.cash,
      deposit: acc.deposit + good.price.deposit,
      mileage: acc.mileage + good.price.mileage,
      ticket: acc.ticket + good.price.ticket,
      nominal: acc.nominal + good.price.nominal,
      real: acc.real + good.price.real,
      ticket_payments: [] as unknown[],
    }),
    {
      cash: 0,
      deposit: 0,
      mileage: 0,
      ticket: 0,
      nominal: 0,
      real: 0,
      ticket_payments: [] as unknown[],
    },
  );
}

function toApiOrder(state: SimulationState, order: OrderRecord) {
  const customer = state.customers.get(order.customer_id);
  if (!customer) {
    throw new Error(`Unknown customer: ${order.customer_id}`);
  }

  return {
    id: order.id,
    name: order.name,
    customer: structuredClone(customer),
    goods: order.goods.map((good) => ({
      id: good.id,
      commodity: structuredClone(good.commodity),
      volume: good.volume,
      price: structuredClone(good.price),
      state: good.state,
      confirmed_at: good.confirmed_at,
    })),
    price: computeOrderPrice(order.goods),
    publish: order.publish ? structuredClone(order.publish) : null,
    created_at: order.created_at,
  };
}

function createGuestCustomer(
  state: SimulationState,
  payload: Record<string, unknown>,
) {
  const customer: CustomerRecord = {
    id: nextRuntimeId(state),
    type: "customer",
    channel: {
      id: state.channel.id,
      code: state.channel.code,
      name: state.channel.name,
      created_at: state.channel.created_at,
    },
    external_user: null,
    href:
      typeof payload.href === "string"
        ? payload.href
        : "http://127.0.0.1:3000/",
    referrer: typeof payload.referrer === "string" ? payload.referrer : null,
    ip: typeof payload.ip === "string" && payload.ip.length ? payload.ip : "127.0.0.1",
    created_at: advanceTimestamp(state, 7),
    member: null,
    citizen: null,
  };

  state.customers.set(customer.id, customer);
  state.carts.set(customer.id, []);
  state.orders.set(customer.id, []);

  return {
    ...structuredClone(customer),
    ...issueTokens(state, customer),
  };
}

function selectionKey(commodity: CartCommodityRecord) {
  return JSON.stringify(
    commodity.selections
      .map((selection) => ({
        unit_id: selection.unit_id,
        stock_id: selection.stock_id,
        quantity: selection.quantity,
        values: Object.entries(selection.values)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([optionId, value]) => [optionId, value]),
      }))
      .sort((left, right) => left.unit_id.localeCompare(right.unit_id)),
  );
}

function bySort(sort: string | undefined, left: SaleFixture, right: SaleFixture) {
  switch (sort) {
    case "+sale.content.title":
      return left.title.localeCompare(right.title);
    case "+sale.price_range.lowest.real":
      return (
        left.snapshots.find((snapshot) => snapshot.latest)?.price_range.lowest.real ??
        0
      ) -
        (right.snapshots.find((snapshot) => snapshot.latest)?.price_range.lowest.real ??
          0);
    case "-sale.price_range.lowest.real":
      return (
        right.snapshots.find((snapshot) => snapshot.latest)?.price_range.lowest.real ??
        0
      ) -
        (left.snapshots.find((snapshot) => snapshot.latest)?.price_range.lowest.real ??
          0);
    case "-sale.updated_at":
    default:
      return right.updated_at.localeCompare(left.updated_at);
  }
}

async function routeSimulation(url: URL, init?: RequestInit) {
  const state = getSimulationState();
  const headers = new Headers(init?.headers);
  const body = (await parseJsonBody(init)) ?? {};
  const method = (init?.method ?? "GET").toUpperCase();
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  try {
    if (method === "POST" && pathname === "/shoppings/customers/authenticate") {
      return Response.json(createGuestCustomer(state, body), { status: 201 });
    }

    if (method === "PATCH" && pathname === "/shoppings/customers/authenticate/refresh") {
      const refreshToken = typeof body.value === "string" ? body.value : "";
      const customerId = state.refreshTokens.get(refreshToken);
      const customer = customerId ? state.customers.get(customerId) : null;
      if (!customer) {
        return httpError(401, "Refresh token is not valid anymore.");
      }

      return Response.json(
        {
          ...cloneCustomer(customer),
          ...issueTokens(state, customer),
        },
        { status: 200 },
      );
    }

    if (method === "GET" && pathname === "/shoppings/customers/authenticate") {
      return Response.json(cloneCustomer(requireCustomer(state, headers)), {
        status: 200,
      });
    }

    if (method === "POST" && pathname === "/shoppings/customers/authenticate/activate") {
      const customer = requireCustomer(state, headers);
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const mobile = typeof body.mobile === "string" ? body.mobile.trim() : "";

      if (!name || !mobile) {
        return httpError(400, "Name and mobile are required.");
      }

      customer.citizen = {
        id: customer.citizen?.id ?? nextRuntimeId(state),
        name,
        mobile,
        created_at: customer.citizen?.created_at ?? advanceTimestamp(state, 5),
      };

      const email = customer.member?.emails[0]?.value;
      if (email) {
        const member = state.members.get(email);
        if (member) {
          member.citizen = structuredClone(customer.citizen);
        }
      }

      return Response.json(cloneCustomer(customer), { status: 201 });
    }

    if (method === "POST" && pathname === "/shoppings/customers/authenticate/join") {
      const customer = requireCustomer(state, headers);
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
      const password = typeof body.password === "string" ? body.password : "";
      const citizenPayload =
        body.citizen && typeof body.citizen === "object"
          ? (body.citizen as Record<string, unknown>)
          : null;

      if (!email || !nickname || !password) {
        return httpError(400, "Nickname, email, and password are required.");
      }
      if (state.members.has(email)) {
        return httpError(409, "That member email already exists.");
      }

      const citizen =
        citizenPayload &&
        typeof citizenPayload.name === "string" &&
        typeof citizenPayload.mobile === "string"
          ? {
              id: nextRuntimeId(state),
              name: citizenPayload.name.trim(),
              mobile: citizenPayload.mobile.trim(),
              created_at: advanceTimestamp(state, 5),
            }
          : customer.citizen;

      const member: MemberRecord = {
        id: nextRuntimeId(state),
        nickname,
        email,
        password,
        created_at: advanceTimestamp(state, 7),
        citizen: citizen ? structuredClone(citizen) : null,
      };
      state.members.set(email, member);
      customer.member = makeMemberProjection(member);
      if (citizen) {
        customer.citizen = structuredClone(citizen);
      }

      return Response.json(cloneCustomer(customer), { status: 201 });
    }

    if (method === "PUT" && pathname === "/shoppings/customers/authenticate/login") {
      const customer = requireCustomer(state, headers);
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body.password === "string" ? body.password : "";
      const member = email ? state.members.get(email) : undefined;
      if (!member || member.password !== password) {
        return httpError(401, "Email or password does not match.");
      }

      customer.member = makeMemberProjection(member);
      customer.citizen = member.citizen ? structuredClone(member.citizen) : customer.citizen;
      return Response.json(cloneCustomer(customer), { status: 200 });
    }

    const channelMatch = pathname.match(
      /^\/shoppings\/customers\/systematic\/channels\/([^/]+)\/get$/,
    );
    if (method === "GET" && channelMatch) {
      return channelMatch[1] === state.channel.code
        ? Response.json(toApiChannel(state), { status: 200 })
        : httpError(404, "The requested channel was not found.");
    }

    if (method === "PATCH" && pathname === "/shoppings/customers/sales") {
      requireCustomer(state, headers);
      let sales = [...state.sales].filter((sale) => sale.suspended_at === null);
      const search =
        body.search && typeof body.search === "object"
          ? (body.search as Record<string, unknown>)
          : null;
      const sort = Array.isArray(body.sort) ? body.sort[0] : undefined;

      if (search) {
        const query =
          typeof search.title_or_content === "string"
            ? search.title_or_content.trim().toLowerCase()
            : "";
        const sectionCodes = ensureArray(search.section_codes);
        const categoryIds = ensureArray(search.channel_category_ids);
        if (query) {
          sales = sales.filter((sale) =>
            `${sale.title} ${sale.description.body}`.toLowerCase().includes(query),
          );
        }
        if (sectionCodes.length) {
          sales = sales.filter((sale) => sectionCodes.includes(sale.section.code));
        }
        if (categoryIds.length) {
          sales = sales.filter((sale) =>
            sale.categoryCodes.some((code) => categoryIds.includes(state.categories.get(code)?.id ?? "")),
          );
        }
      }

      sales.sort((left, right) =>
        bySort(typeof sort === "string" ? sort : undefined, left, right),
      );

      return Response.json(
        pageOf(
          sales.map((sale) => toApiSaleSummary(state, sale)),
          {
            page: typeof body.page === "number" ? body.page : 1,
            limit: typeof body.limit === "number" ? body.limit : undefined,
          },
        ),
        { status: 200 },
      );
    }

    const saleMatch = pathname.match(/^\/shoppings\/customers\/sales\/([0-9a-f-]+)$/);
    if (method === "GET" && saleMatch) {
      requireCustomer(state, headers);
      const sale = state.salesById.get(saleMatch[1]);
      return sale
        ? Response.json(toApiSaleDetail(state, sale), { status: 200 })
        : httpError(404, "The requested sale could not be found.");
    }

    const snapshotMatch = pathname.match(
      /^\/shoppings\/customers\/sales\/([0-9a-f-]+)\/snapshots$/,
    );
    if (method === "PATCH" && snapshotMatch) {
      requireCustomer(state, headers);
      const sale = state.salesById.get(snapshotMatch[1]);
      return sale
        ? Response.json(
            pageOf(
              sale.snapshots.map((snapshot) => structuredClone(snapshot)),
              {
                page: typeof body.page === "number" ? body.page : 1,
                limit: typeof body.limit === "number" ? body.limit : undefined,
              },
            ),
            { status: 200 },
          )
        : httpError(404, "The snapshot history could not be found.");
    }

    if (method === "PATCH" && pathname === "/shoppings/customers/carts/commodities") {
      const customer = requireCustomer(state, headers);
      const data = (state.carts.get(customer.id) ?? [])
        .slice()
        .sort((left, right) => right.created_at.localeCompare(left.created_at))
        .map((commodity) => toApiCommodity(state, commodity));
      return Response.json(
        pageOf(data, {
          page: typeof body.page === "number" ? body.page : 1,
          limit: typeof body.limit === "number" ? body.limit : undefined,
        }),
        { status: 200 },
      );
    }

    if (method === "POST" && pathname === "/shoppings/customers/carts/commodities") {
      const customer = requireCustomer(state, headers);
      const saleId = typeof body.sale_id === "string" ? body.sale_id : "";
      const sale = state.salesById.get(saleId);
      const stocks = Array.isArray(body.stocks) ? body.stocks : [];
      if (!sale || !stocks.length) {
        return httpError(400, "A sale and at least one stock selection are required.");
      }

      const commodity: CartCommodityRecord = {
        id: nextRuntimeId(state),
        sale_id: sale.id,
        volume:
          typeof body.volume === "number" && body.volume > 0 ? Math.floor(body.volume) : 1,
        orderable: true,
        pseudo: false,
        created_at: advanceTimestamp(state, 5),
        selections: stocks
          .map((selection) => {
            if (!selection || typeof selection !== "object") {
              return null;
            }
            const typed = selection as Record<string, unknown>;
            const choices = Array.isArray(typed.choices) ? typed.choices : [];
            return {
              unit_id: typeof typed.unit_id === "string" ? typed.unit_id : "",
              stock_id: typeof typed.stock_id === "string" ? typed.stock_id : "",
              quantity:
                typeof typed.quantity === "number" && typed.quantity > 0
                  ? Math.floor(typed.quantity)
                  : 1,
              values: Object.fromEntries(
                choices.flatMap((choice) => {
                  if (!choice || typeof choice !== "object") {
                    return [];
                  }
                  const typedChoice = choice as Record<string, unknown>;
                  const optionId =
                    typeof typedChoice.option_id === "string"
                      ? typedChoice.option_id
                      : null;
                  return optionId
                    ? [
                        [
                          optionId,
                          typedChoice.value as string | number | boolean | null,
                        ] as const,
                      ]
                    : [];
                }),
              ),
            };
          })
          .filter(
            (
              selection,
            ): selection is CartCommodityRecord["selections"][number] => selection !== null,
          ),
      };

      const commodities = state.carts.get(customer.id) ?? [];
      const duplicate =
        body.accumulate !== false
          ? commodities.find(
              (current) =>
                current.sale_id === commodity.sale_id &&
                selectionKey(current) === selectionKey(commodity),
            )
          : null;

      if (duplicate) {
        duplicate.volume += commodity.volume;
        return Response.json(toApiCommodity(state, duplicate), { status: 201 });
      }

      commodities.push(commodity);
      state.carts.set(customer.id, commodities);
      return Response.json(toApiCommodity(state, commodity), { status: 201 });
    }

    const commodityMatch = pathname.match(
      /^\/shoppings\/customers\/carts\/commodities\/([0-9a-f-]+)$/,
    );
    if (commodityMatch && method === "PUT") {
      const customer = requireCustomer(state, headers);
      const commodity = (state.carts.get(customer.id) ?? []).find(
        (item) => item.id === commodityMatch[1],
      );
      if (!commodity) {
        return httpError(404, "The cart commodity could not be found.");
      }
      commodity.volume =
        typeof body.volume === "number" && body.volume > 0 ? Math.floor(body.volume) : 1;
      return Response.json(null, { status: 200 });
    }

    if (commodityMatch && method === "DELETE") {
      const customer = requireCustomer(state, headers);
      state.carts.set(
        customer.id,
        (state.carts.get(customer.id) ?? []).filter(
          (item) => item.id !== commodityMatch[1],
        ),
      );
      return Response.json(null, { status: 200 });
    }

    if (method === "POST" && pathname === "/shoppings/customers/orders") {
      const customer = requireCustomer(state, headers);
      const commodities = state.carts.get(customer.id) ?? [];
      const goods = (Array.isArray(body.goods) ? body.goods : [])
        .map<OrderGoodRecord | null>((good) => {
          if (!good || typeof good !== "object") {
            return null;
          }
          const typed = good as Record<string, unknown>;
          const commodityId =
            typeof typed.commodity_id === "string" ? typed.commodity_id : "";
          const volume =
            typeof typed.volume === "number" && typed.volume > 0 ? Math.floor(typed.volume) : 1;
          const commodity = commodities.find((item) => item.id === commodityId);
          if (!commodity) {
            return null;
          }

          const apiCommodity = toApiCommodity(state, commodity);
          return {
            id: nextRuntimeId(state),
            commodity_id: commodity.id,
            commodity: structuredClone(apiCommodity),
            volume,
            price: {
              cash: apiCommodity.price.real * volume,
              deposit: 0,
              mileage: 0,
              ticket: 0,
              nominal: apiCommodity.price.nominal * volume,
              real: apiCommodity.price.real * volume,
            },
            state: null,
            confirmed_at: null,
          };
        })
        .filter((item): item is OrderGoodRecord => item !== null);

      if (!goods.length) {
        return httpError(404, "The selected commodities could not be found.");
      }

      const order: OrderRecord = {
        id: nextRuntimeId(state),
        name:
          goods.length === 1
            ? goods[0].commodity.sale.content.title
            : `${goods[0].commodity.sale.content.title} and ${goods.length - 1} more items`,
        customer_id: customer.id,
        goods,
        publish: null,
        created_at: advanceTimestamp(state, 7),
      };
      const orders = state.orders.get(customer.id) ?? [];
      orders.push(order);
      state.orders.set(customer.id, orders);
      return Response.json(toApiOrder(state, order), { status: 201 });
    }

    if (method === "PATCH" && pathname === "/shoppings/customers/orders") {
      const customer = requireCustomer(state, headers);
      const orders = (state.orders.get(customer.id) ?? [])
        .slice()
        .sort((left, right) => right.created_at.localeCompare(left.created_at))
        .map((order) => toApiOrder(state, order));
      return Response.json(
        pageOf(orders, {
          page: typeof body.page === "number" ? body.page : 1,
          limit: typeof body.limit === "number" ? body.limit : undefined,
        }),
        { status: 200 },
      );
    }

    const orderMatch = pathname.match(/^\/shoppings\/customers\/orders\/([0-9a-f-]+)$/);
    if (method === "GET" && orderMatch) {
      const customer = requireCustomer(state, headers);
      const order = (state.orders.get(customer.id) ?? []).find(
        (item) => item.id === orderMatch[1],
      );
      return order
        ? Response.json(toApiOrder(state, order), { status: 200 })
        : httpError(404, "The requested order could not be found.");
    }

    const ableMatch = pathname.match(
      /^\/shoppings\/customers\/orders\/([0-9a-f-]+)\/publish\/able$/,
    );
    if (method === "GET" && ableMatch) {
      const customer = requireCustomer(state, headers);
      const order = (state.orders.get(customer.id) ?? []).find(
        (item) => item.id === ableMatch[1],
      );
      return order
        ? Response.json(!order.publish, { status: 200 })
        : httpError(404, "The requested order could not be found.");
    }

    const publishMatch = pathname.match(
      /^\/shoppings\/customers\/orders\/([0-9a-f-]+)\/publish$/,
    );
    if (method === "POST" && publishMatch) {
      const customer = requireCustomer(state, headers);
      if (!customer.citizen) {
        return httpError(428, "Real-name verification is required before checkout.");
      }

      const order = (state.orders.get(customer.id) ?? []).find(
        (item) => item.id === publishMatch[1],
      );
      const address =
        body.address && typeof body.address === "object"
          ? (body.address as Record<string, unknown>)
          : null;

      if (!order) {
        return httpError(404, "The requested order could not be found.");
      }
      if (!address) {
        return httpError(400, "A delivery address is required.");
      }

      const createdAt = advanceTimestamp(state, 5);
      order.publish = {
        id: nextRuntimeId(state),
        created_at: createdAt,
        paid_at: createdAt,
        cancelled_at: null,
        state: "preparing",
        deliveries: [],
        address: {
          id: nextRuntimeId(state),
          created_at: createdAt,
          mobile: typeof address.mobile === "string" ? address.mobile.trim() : "",
          name: typeof address.name === "string" ? address.name.trim() : "",
          country: typeof address.country === "string" ? address.country.trim() : "",
          province: typeof address.province === "string" ? address.province.trim() : "",
          city: typeof address.city === "string" ? address.city.trim() : "",
          department:
            typeof address.department === "string" ? address.department.trim() : "",
          possession:
            typeof address.possession === "string" ? address.possession.trim() : "",
          zip_code: typeof address.zip_code === "string" ? address.zip_code.trim() : "",
          special_note:
            typeof address.special_note === "string"
              ? address.special_note.trim()
              : null,
        },
      };
      order.goods = order.goods.map((good) => ({
        ...good,
        state: "preparing",
      }));

      const commodityIds = new Set(order.goods.map((good) => good.commodity_id));
      state.carts.set(
        customer.id,
        (state.carts.get(customer.id) ?? []).filter(
          (commodity) => !commodityIds.has(commodity.id),
        ),
      );
      return Response.json(structuredClone(order.publish), { status: 201 });
    }

    return httpError(404, `No simulated route matched ${method} ${pathname}.`);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error(error);
    return httpError(500, "The simulated shopping backend failed unexpectedly.");
  }
}

export const simulatedShoppingFetch: NonNullable<IConnection["fetch"]> = async (
  input,
  init,
) => {
  const url = new URL(typeof input === "string" ? input : input.toString());
  return routeSimulation(url, init);
};
