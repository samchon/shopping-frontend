"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";

import { ErrorState } from "@/components/error-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCatalog } from "@/lib/shopping/hooks";
import type { CategoryTreeNode, ProductCardView } from "@/lib/shopping/types";
import { cn, formatCompactNumber, formatCurrency, formatDateTime } from "@/lib/utils";

function CategoryTree({
  nodes,
  current,
  onSelect,
  depth = 0,
}: {
  nodes: CategoryTreeNode[];
  current: string | null;
  onSelect: (value: string | null) => void;
  depth?: number;
}) {
  return (
    <div className="grid gap-1">
      {nodes.map((node) => (
        <div key={node.code} className="grid gap-1">
          <button
            className={cn(
              "flex items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
              current === node.code && "bg-primary/10 text-primary",
            )}
            onClick={() => onSelect(current === node.code ? null : node.code)}
            style={{ paddingLeft: `${depth * 14 + 12}px` }}
            type="button"
          >
            <span>{node.name}</span>
            <span className="text-xs text-muted-foreground">{node.count}</span>
          </button>
          {node.children.length ? (
            <CategoryTree
              nodes={node.children}
              current={current}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: ProductCardView }) {
  return (
    <Link href={`/products/${product.id}`} className="group block">
      <Card className="h-full overflow-hidden transition-transform duration-200 hover:-translate-y-1">
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          {product.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={product.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              src={product.thumbnailUrl}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No image
            </div>
          )}
        </div>
        <CardContent className="grid gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Badge variant={product.status === "paused" ? "secondary" : "default"}>
                {product.status === "paused" ? "Paused" : product.sectionName}
              </Badge>
              <div>
                <h3 className="line-clamp-2 text-lg font-semibold">{product.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {product.sellerName} / {formatDateTime(product.updatedAt)}
                </p>
              </div>
            </div>
            <div className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              {product.thumbnailCount} shots
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {product.categoryLabels.slice(0, 2).map((category) => (
              <span
                key={category}
                className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
              >
                {category}
              </span>
            ))}
            {product.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="rounded-full bg-accent px-2.5 py-1 text-xs">
                #{tag}
              </span>
            ))}
          </div>

          <div className="grid gap-2 rounded-2xl bg-muted/50 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Starting at
            </p>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold">
                  {formatCurrency(product.priceRange.lowest.real)}
                </p>
                {product.priceRange.highest.real !== product.priceRange.lowest.real ? (
                  <p className="text-sm text-muted-foreground">
                    up to {formatCurrency(product.priceRange.highest.real)}
                  </p>
                ) : null}
              </div>
              <div className="text-right text-sm text-muted-foreground">
                {product.unitSummary.length} unit
                {product.unitSummary.length > 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function CatalogPageFallback() {
  return (
    <div className="grid gap-6 lg:grid-cols-[280px,minmax(0,1fr)]">
      <aside className="grid h-fit gap-4 lg:sticky lg:top-28">
        <Card>
          <CardContent className="grid gap-3 p-5">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} className="h-10 rounded-2xl" />
            ))}
          </CardContent>
        </Card>
      </aside>

      <div className="grid gap-4">
        <Card>
          <CardContent className="grid gap-5 p-5">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-16 w-full rounded-[28px]" />
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr),180px,140px]">
              <Skeleton className="h-12 rounded-full" />
              <Skeleton className="h-12 rounded-full" />
              <Skeleton className="h-12 rounded-full" />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <Skeleton className="aspect-[4/3] rounded-t-[28px] rounded-b-none" />
              <CardContent className="grid gap-3 p-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CatalogPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSearch = searchParams.get("q") ?? "";
  const [searchDraft, setSearchDraft] = useState(activeSearch);
  const search = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const catalog = useCatalog(search);

  useEffect(() => {
    setSearchDraft(activeSearch);
  }, [activeSearch]);

  function updateParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(patch)) {
      if (!value) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }

    if (!patch.page) {
      next.set("page", "1");
    }

    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const data = catalog.data;

  if (catalog.isError) {
    return (
      <ErrorState
        description="The storefront could not load the catalog from the shopping API. Check the API host and retry the query."
        onRetry={() => catalog.refetch()}
        title="Catalog request failed"
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px,minmax(0,1fr)]">
      <aside className="grid h-fit gap-4 lg:sticky lg:top-28">
        <Card>
          <CardContent className="grid gap-5 p-5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Browse Filters</h2>
            </div>

            {catalog.isLoading || !data ? (
              <div className="grid gap-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 rounded-2xl" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  <p className="text-sm font-medium">Sections</p>
                  <button
                    className={cn(
                      "rounded-2xl px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                      !data.query.section && "bg-primary/10 text-primary",
                    )}
                    onClick={() => updateParams({ section: null })}
                    type="button"
                  >
                    All sections
                  </button>
                  {data.sections.map((section) => (
                    <button
                      key={section.code}
                      className={cn(
                        "flex items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                        data.query.section === section.code && "bg-primary/10 text-primary",
                      )}
                      onClick={() =>
                        updateParams({
                          section:
                            data.query.section === section.code ? null : section.code,
                        })
                      }
                      type="button"
                    >
                      <span>{section.name}</span>
                      <span className="text-xs text-muted-foreground">{section.count}</span>
                    </button>
                  ))}
                </div>

                <div className="grid gap-2">
                  <p className="text-sm font-medium">Categories</p>
                  <button
                    className={cn(
                      "rounded-2xl px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                      !data.query.category && "bg-primary/10 text-primary",
                    )}
                    onClick={() => updateParams({ category: null })}
                    type="button"
                  >
                    All categories
                  </button>
                  <CategoryTree
                    current={data.query.category}
                    nodes={data.categories}
                    onSelect={(value) => updateParams({ category: value })}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </aside>

      <div className="grid gap-4">
        <Card>
          <CardContent className="grid gap-5 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
                  {data?.currentChannel.name ?? "Storefront"}
                </p>
                <h1 className="mt-2 text-3xl font-semibold text-balance">
                  Browse live sale snapshots with channel, section, and SKU-aware filters
                </h1>
              </div>
              {data ? (
                <div className="rounded-3xl bg-secondary px-4 py-3 text-right">
                  <p className="text-sm text-muted-foreground">Products in scope</p>
                  <p className="text-2xl font-semibold">
                    {formatCompactNumber(data.pagination.records)}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr),180px,140px]">
              <form
                className="relative"
                onSubmit={(event) => {
                  event.preventDefault();
                  updateParams({ q: searchDraft || null });
                }}
              >
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-11"
                  onChange={(event) => setSearchDraft(event.target.value)}
                  placeholder="Search title or description"
                  value={searchDraft}
                />
              </form>

              <Select
                onValueChange={(value) => updateParams({ sort: value })}
                value={data?.query.sort ?? "recent"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recently updated</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                  <SelectItem value="price-asc">Lowest price</SelectItem>
                  <SelectItem value="price-desc">Highest price</SelectItem>
                </SelectContent>
              </Select>

              <Select
                onValueChange={(value) => updateParams({ pageSize: value })}
                value={String(data?.query.pageSize ?? 8)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Page size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 per page</SelectItem>
                  <SelectItem value="8">8 per page</SelectItem>
                  <SelectItem value="12">12 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {catalog.isLoading || !data ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                <Skeleton className="aspect-[4/3] rounded-t-[28px] rounded-b-none" />
                <CardContent className="grid gap-3 p-5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-7 w-3/4" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data.products.length ? (
          <>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Showing {(data.pagination.current - 1) * data.pagination.limit + 1}-
                {Math.min(
                  data.pagination.current * data.pagination.limit,
                  data.pagination.records,
                )}{" "}
                of {data.pagination.records} products
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-border/70 bg-card/80 p-4">
              <p className="text-sm text-muted-foreground">
                Page {data.pagination.current} of {Math.max(data.pagination.pages, 1)}
              </p>
              <div className="flex gap-2">
                <button
                  className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-40"
                  disabled={data.pagination.current <= 1}
                  onClick={() =>
                    updateParams({ page: String(Math.max(data.pagination.current - 1, 1)) })
                  }
                  type="button"
                >
                  Previous
                </button>
                <button
                  className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-40"
                  disabled={
                    data.pagination.pages === 0 ||
                    data.pagination.current >= data.pagination.pages
                  }
                  onClick={() =>
                    updateParams({
                      page: String(
                        Math.min(data.pagination.current + 1, data.pagination.pages),
                      ),
                    })
                  }
                  type="button"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="grid place-items-center gap-2 p-12 text-center">
              <p className="text-lg font-semibold">No products matched this filter.</p>
              <p className="max-w-xl text-sm text-muted-foreground">
                Try clearing a section or category filter, or search with a broader term.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
