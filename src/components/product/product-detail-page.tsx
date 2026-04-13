"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, PackagePlus, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ContentBody } from "@/components/content-body";
import { ErrorState } from "@/components/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAddToCart, useProduct } from "@/lib/shopping/hooks";
import type {
  AddToCartPayload,
  ProductDetailView,
  ProductOptionView,
  ProductUnitView,
} from "@/lib/shopping/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type UnitSelectionState = {
  enabled: boolean;
  stockId: string;
  quantity: number;
  fields: Record<string, string | number | boolean | null>;
};

function buildDefaultState(product: ProductDetailView) {
  const defaults: Record<string, UnitSelectionState> = {};

  for (const unit of product.units) {
    defaults[unit.id] = {
      enabled: unit.required,
      stockId: unit.stocks[0]?.id ?? "",
      quantity: 1,
      fields: Object.fromEntries(
        unit.options
          .filter((option) => option.kind === "field")
          .map((option) => [option.id, option.inputType === "checkbox" ? false : ""]),
      ),
    };
  }

  return defaults;
}

function getVariantOptions(unit: ProductUnitView) {
  return unit.options.filter(
    (option): option is Extract<ProductOptionView, { kind: "variant" }> =>
      option.kind === "variant" && option.variable,
  );
}

function getFieldOptions(unit: ProductUnitView) {
  return unit.options.filter(
    (option): option is Extract<ProductOptionView, { kind: "field" }> =>
      option.kind === "field",
  );
}

function stockChoiceMap(unit: ProductUnitView, stockId: string) {
  const stock = unit.stocks.find((candidate) => candidate.id === stockId) ?? unit.stocks[0];
  return Object.fromEntries(stock?.choices.map((choice) => [choice.optionId, choice.candidateId]));
}

function findMatchingStock(
  unit: ProductUnitView,
  currentStockId: string,
  optionId: string,
  candidateId: string,
) {
  const active = stockChoiceMap(unit, currentStockId);
  active[optionId] = candidateId;

  return (
    unit.stocks.find((stock) =>
      Object.entries(active).every(
        ([selectedOptionId, selectedCandidateId]) =>
          stock.choices.some(
            (choice) =>
              choice.optionId === selectedOptionId &&
              choice.candidateId === selectedCandidateId,
          ),
      ),
    ) ?? unit.stocks[0]
  );
}

function formatSnapshotTimestamp(value: string | null) {
  if (!value) {
    return "Snapshot summary does not include a timestamp";
  }

  return formatDateTime(value);
}

export function ProductDetailPage({ productId }: { productId: string }) {
  const router = useRouter();
  const product = useProduct(productId);
  const addToCart = useAddToCart();
  const [selectionOverrides, setSelectionOverrides] = useState<
    Record<string, Partial<UnitSelectionState>>
  >({});

  if (product.isError) {
    return (
      <div className="grid gap-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to catalog
        </Link>
        <ErrorState
          description="This sale snapshot could not be loaded. The sale may have changed, or the API request may have failed."
          onRetry={() => product.refetch()}
          title="Product request failed"
        />
      </div>
    );
  }

  if (product.isLoading || !product.data) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-10 w-40 rounded-full" />
        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <Skeleton className="aspect-[4/3] rounded-[28px]" />
          <Skeleton className="min-h-[480px] rounded-[28px]" />
        </div>
      </div>
    );
  }

  const data = product.data;
  const primaryImage = data.media[0]?.url ?? null;
  const defaultSelection = buildDefaultState(data);
  const selection = Object.fromEntries(
    Object.entries(defaultSelection).map(([unitId, baseState]) => {
      const override = selectionOverrides[unitId];
      return [
        unitId,
        {
          ...baseState,
          ...override,
          fields: {
            ...baseState.fields,
            ...(override?.fields ?? {}),
          },
        } satisfies UnitSelectionState,
      ];
    }),
  ) as Record<string, UnitSelectionState>;

  async function handleAddToCart() {
    const payload: AddToCartPayload = {
      saleId: data.id,
      volume: 1,
      selections: data.units
        .filter((unit) => selection[unit.id]?.enabled)
        .map((unit) => ({
          unitId: unit.id,
          stockId: selection[unit.id].stockId,
          quantity: selection[unit.id].quantity,
          optionValues: getFieldOptions(unit).map((option) => ({
            optionId: option.id,
            value: selection[unit.id].fields[option.id] ?? null,
          })),
        })),
    };

    try {
      await addToCart.mutateAsync(payload);
      toast.success("Added to cart.");
      router.push("/cart");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add the product.");
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to catalog
        </Link>
        <Badge variant={data.status === "paused" ? "secondary" : "default"}>
          {data.status === "paused" ? "Paused by seller" : data.section.name}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="grid gap-6">
          <Card className="overflow-hidden">
            <div className="aspect-[4/3] overflow-hidden bg-muted">
              {primaryImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={data.title} className="h-full w-full object-cover" src={primaryImage} />
              ) : null}
            </div>
            <CardContent className="grid gap-5 p-6">
              <div className="grid gap-3">
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
                  {data.seller.name}
                </p>
                <h1 className="text-3xl font-semibold text-balance">{data.title}</h1>
                {data.categoryLabels.length ? (
                  <div className="flex flex-wrap gap-2">
                    {data.categoryLabels.map((label) => (
                      <span
                        key={label}
                        className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {data.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-accent px-3 py-1 text-xs">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="grid gap-2 rounded-[24px] bg-muted/50 p-5 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Lowest real price</p>
                  <p className="text-2xl font-semibold">
                    {formatCurrency(data.priceRange.lowest.real)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Highest real price</p>
                  <p className="text-2xl font-semibold">
                    {formatCurrency(data.priceRange.highest.real)}
                  </p>
                </div>
              </div>

              <Separator />

              <ContentBody body={data.description.body} format={data.description.format} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Snapshot history</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {data.snapshots.length ? (
                data.snapshots.map((snapshot) => (
                  <div
                    key={snapshot.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/30 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{snapshot.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatSnapshotTimestamp(snapshot.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      {snapshot.latest ? <Badge>Latest</Badge> : null}
                      <p className="mt-2 text-sm text-muted-foreground">
                        {formatCurrency(snapshot.priceRange.lowest.real)}-
                        {formatCurrency(snapshot.priceRange.highest.real)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No historical snapshots yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Compose your cart snapshot</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              {data.status === "paused" ? (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  This sale is paused, so review the snapshot carefully before adding it to
                  cart.
                </div>
              ) : null}

              {data.units.map((unit) => {
                const unitState = selection[unit.id];
                if (!unitState) {
                  return null;
                }

                const activeStock =
                  unit.stocks.find((stock) => stock.id === unitState.stockId) ?? unit.stocks[0];
                const variantOptions = getVariantOptions(unit);
                const fieldOptions = getFieldOptions(unit);
                const currentChoices = stockChoiceMap(unit, unitState.stockId);

                return (
                  <div key={unit.id} className="grid gap-4 rounded-[24px] border border-border/70 bg-muted/30 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold">{unit.name}</h2>
                          {unit.required ? <Badge>Required</Badge> : <Badge variant="outline">Optional</Badge>}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatCurrency(unit.priceRange.lowest.real)}-
                          {formatCurrency(unit.priceRange.highest.real)}
                        </p>
                      </div>
                      {!unit.required ? (
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={unitState.enabled}
                            onCheckedChange={(checked) =>
                              setSelectionOverrides((current) => {
                                const safeUnitState = {
                                  ...unitState,
                                  ...(current[unit.id] ?? {}),
                                  fields: {
                                    ...unitState.fields,
                                    ...(current[unit.id]?.fields ?? {}),
                                  },
                                };
                                return {
                                  ...current,
                                  [unit.id]: {
                                    ...safeUnitState,
                                    enabled: checked === true,
                                  },
                                };
                              })
                            }
                          />
                          Include
                        </label>
                      ) : null}
                    </div>

                    {unitState.enabled ? (
                      <>
                        {variantOptions.length ? (
                          <div className="grid gap-3">
                            {variantOptions.map((option) => (
                              <div key={option.id} className="grid gap-2">
                                <label className="text-sm font-medium">{option.name}</label>
                                <Select
                                  onValueChange={(candidateId) => {
                                    const matched = findMatchingStock(
                                      unit,
                                      unitState.stockId,
                                      option.id,
                                      candidateId,
                                    );
                                    setSelectionOverrides((current) => {
                                      const safeUnitState = {
                                        ...unitState,
                                        ...(current[unit.id] ?? {}),
                                        fields: {
                                          ...unitState.fields,
                                          ...(current[unit.id]?.fields ?? {}),
                                        },
                                      };
                                      return {
                                        ...current,
                                        [unit.id]: {
                                          ...safeUnitState,
                                          stockId: matched.id,
                                        },
                                      };
                                    });
                                  }}
                                  value={currentChoices[option.id]}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={`Choose ${option.name}`} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {option.candidates.map((candidate) => (
                                      <SelectItem key={candidate.id} value={candidate.id}>
                                        {candidate.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Final stock</label>
                          <Select
                            onValueChange={(value) =>
                              setSelectionOverrides((current) => {
                                const safeUnitState = {
                                  ...unitState,
                                  ...(current[unit.id] ?? {}),
                                  fields: {
                                    ...unitState.fields,
                                    ...(current[unit.id]?.fields ?? {}),
                                  },
                                };
                                return {
                                  ...current,
                                  [unit.id]: {
                                    ...safeUnitState,
                                    stockId: value,
                                  },
                                };
                              })
                            }
                            value={unitState.stockId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a stock" />
                            </SelectTrigger>
                            <SelectContent>
                              {unit.stocks.map((stock) => (
                                <SelectItem key={stock.id} value={stock.id}>
                                  {stock.name} / {formatCurrency(stock.price.real)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Available quantity: {activeStock.availableQuantity}
                          </p>
                        </div>

                        {fieldOptions.length ? (
                          <div className="grid gap-3">
                            {fieldOptions.map((option) => (
                              <div key={option.id} className="grid gap-2">
                                <label className="text-sm font-medium">{option.name}</label>
                                {option.inputType === "checkbox" ? (
                                  <label className="flex items-center gap-2 rounded-2xl border border-border px-3 py-3">
                                    <Checkbox
                                      checked={Boolean(unitState.fields[option.id])}
                                      onCheckedChange={(checked) =>
                                        setSelectionOverrides((current) => {
                                          const safeUnitState = {
                                            ...unitState,
                                            ...(current[unit.id] ?? {}),
                                            fields: {
                                              ...unitState.fields,
                                              ...(current[unit.id]?.fields ?? {}),
                                            },
                                          };
                                          return {
                                            ...current,
                                            [unit.id]: {
                                              ...safeUnitState,
                                              fields: {
                                                ...safeUnitState.fields,
                                                [option.id]: checked === true,
                                              },
                                            },
                                          };
                                        })
                                      }
                                    />
                                    Toggle option
                                  </label>
                                ) : (
                                  <Input
                                    onChange={(event) =>
                                      setSelectionOverrides((current) => {
                                        const safeUnitState = {
                                          ...unitState,
                                          ...(current[unit.id] ?? {}),
                                          fields: {
                                            ...unitState.fields,
                                            ...(current[unit.id]?.fields ?? {}),
                                          },
                                        };
                                        return {
                                          ...current,
                                          [unit.id]: {
                                            ...safeUnitState,
                                            fields: {
                                              ...safeUnitState.fields,
                                              [option.id]:
                                                option.inputType === "number"
                                                  ? Number(event.target.value)
                                                  : event.target.value,
                                            },
                                          },
                                        };
                                      })
                                    }
                                    type={option.inputType === "number" ? "number" : "text"}
                                    value={String(unitState.fields[option.id] ?? "")}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Quantity per set</label>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() =>
                                setSelectionOverrides((current) => {
                                  const safeUnitState = {
                                    ...unitState,
                                    ...(current[unit.id] ?? {}),
                                    fields: {
                                      ...unitState.fields,
                                      ...(current[unit.id]?.fields ?? {}),
                                    },
                                  };
                                  return {
                                    ...current,
                                    [unit.id]: {
                                      ...safeUnitState,
                                      quantity: Math.max(safeUnitState.quantity - 1, 1),
                                    },
                                  };
                                })
                              }
                              size="icon"
                              type="button"
                              variant="outline"
                            >
                              -
                            </Button>
                            <Input
                              className="w-20 text-center"
                              onChange={(event) =>
                                setSelectionOverrides((current) => {
                                  const safeUnitState = {
                                    ...unitState,
                                    ...(current[unit.id] ?? {}),
                                    fields: {
                                      ...unitState.fields,
                                      ...(current[unit.id]?.fields ?? {}),
                                    },
                                  };
                                  return {
                                    ...current,
                                    [unit.id]: {
                                      ...safeUnitState,
                                      quantity: Math.max(Number(event.target.value || 1), 1),
                                    },
                                  };
                                })
                              }
                              type="number"
                              value={unitState.quantity}
                            />
                            <Button
                              onClick={() =>
                                setSelectionOverrides((current) => {
                                  const safeUnitState = {
                                    ...unitState,
                                    ...(current[unit.id] ?? {}),
                                    fields: {
                                      ...unitState.fields,
                                      ...(current[unit.id]?.fields ?? {}),
                                    },
                                  };
                                  return {
                                    ...current,
                                    [unit.id]: {
                                      ...safeUnitState,
                                      quantity: safeUnitState.quantity + 1,
                                    },
                                  };
                                })
                              }
                              size="icon"
                              type="button"
                              variant="outline"
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        This optional unit is currently excluded from the cart snapshot.
                      </p>
                    )}
                  </div>
                );
              })}

              <Button
                className="h-12 text-base"
                disabled={addToCart.isPending}
                onClick={handleAddToCart}
              >
                <PackagePlus className="h-4 w-4" />
                {addToCart.isPending ? "Adding..." : "Add snapshot to cart"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
