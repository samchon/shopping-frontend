"use client";

import Link from "next/link";
import { ChevronLeft, ShieldCheck, Truck, WalletCards } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ErrorState } from "@/components/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useActivateCitizen, useOrder, usePublishOrder } from "@/lib/shopping/hooks";
import type { OrderDetailView, PublishOrderPayload } from "@/lib/shopping/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

function statusLabel(status: OrderDetailView["status"]) {
  switch (status) {
    case "paid":
      return "Paid";
    case "pending-payment":
      return "Pending payment";
    case "cancelled":
      return "Cancelled";
    case "draft":
    default:
      return "Draft";
  }
}

function statusVariant(status: OrderDetailView["status"]) {
  switch (status) {
    case "paid":
      return "default" as const;
    case "pending-payment":
      return "secondary" as const;
    case "cancelled":
      return "destructive" as const;
    case "draft":
    default:
      return "outline" as const;
  }
}

function buildAddressDraft(order: OrderDetailView): PublishOrderPayload {
  if (order.publish) {
    return {
      ...order.publish.address,
      specialNote: order.publish.address.specialNote,
    };
  }

  return {
    name: order.session.citizen?.name ?? "",
    mobile: order.session.citizen?.mobile ?? "",
    country: "South Korea",
    province: "",
    city: "",
    department: "",
    possession: "",
    zipCode: "",
    specialNote: null,
  };
}

function validateAddress(payload: PublishOrderPayload) {
  const requiredEntries = [
    ["name", payload.name],
    ["mobile", payload.mobile],
    ["country", payload.country],
    ["province", payload.province],
    ["city", payload.city],
    ["department", payload.department],
    ["possession", payload.possession],
    ["zip code", payload.zipCode],
  ];

  const missing = requiredEntries.find(([, value]) => !value.trim());
  if (missing) {
    throw new Error(`Enter ${missing[0]} before publishing the order.`);
  }
}

function formatFlowState(state: string | null) {
  if (!state || state === "none") {
    return null;
  }

  return state
    .split(/[_-]/g)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

export function OrderDetailPage({ orderId }: { orderId: string }) {
  const order = useOrder(orderId);
  const publishOrder = usePublishOrder(orderId);
  const activateCitizen = useActivateCitizen();
  const [citizenDraft, setCitizenDraft] = useState<{
    name?: string;
    mobile?: string;
  }>({});
  const [addressDraft, setAddressDraft] = useState<Partial<PublishOrderPayload>>({});

  if (order.isError) {
    return (
      <div className="grid gap-6">
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to orders
        </Link>
        <ErrorState
          description="The selected order could not be loaded. Retry the request or return to the order timeline."
          onRetry={() => order.refetch()}
          title="Order request failed"
        />
      </div>
    );
  }

  if (order.isLoading || !order.data) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-10 w-40 rounded-full" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),360px]">
          <Skeleton className="min-h-[520px] rounded-[28px]" />
          <Skeleton className="min-h-[520px] rounded-[28px]" />
        </div>
      </div>
    );
  }

  const data = order.data;
  const citizenName = citizenDraft.name ?? data.session.citizen?.name ?? "";
  const citizenMobile = citizenDraft.mobile ?? data.session.citizen?.mobile ?? "";
  const address = {
    ...buildAddressDraft(data),
    ...addressDraft,
  } satisfies PublishOrderPayload;

  async function handleCitizenActivation() {
    if (!citizenName.trim() || !citizenMobile.trim()) {
      toast.error("Enter your name and mobile number before verifying identity.");
      return;
    }

    try {
      await activateCitizen.mutateAsync({
        name: citizenName.trim(),
        mobile: citizenMobile.trim(),
      });
      setCitizenDraft({});
      await order.refetch();
      toast.success("Identity verified. You can now continue to publish the order.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Identity verification failed.",
      );
    }
  }

  async function handlePublish() {
    try {
      validateAddress(address);
      await publishOrder.mutateAsync({
        ...address,
        specialNote: address.specialNote?.trim() ? address.specialNote.trim() : null,
      });
      setAddressDraft({});
      await order.refetch();
      toast.success("Order published. Delivery and payment state are now attached.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Order publish failed.");
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to orders
        </Link>
        <Badge variant={statusVariant(data.status)}>{statusLabel(data.status)}</Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),360px]">
        <div className="grid gap-6">
          <Card>
            <CardContent className="grid gap-5 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
                    {data.publish ? "Published order" : "Checkout draft"}
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold">{data.name}</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Created {formatDateTime(data.createdAt)}
                  </p>
                </div>
                <div className="rounded-[24px] bg-muted/50 px-5 py-4 text-left lg:text-right">
                  <p className="text-sm text-muted-foreground">Order total</p>
                  <p className="text-2xl font-semibold">{formatCurrency(data.price.real)}</p>
                </div>
              </div>

              <div className="grid gap-3">
                {data.items.map((item) => {
                  const flowState = formatFlowState(item.state);

                  return (
                    <div
                      key={item.id}
                      className="grid gap-4 rounded-[24px] border border-border/70 bg-muted/30 p-4"
                    >
                      <div className="flex flex-col gap-4 md:flex-row">
                        <div className="h-24 w-24 overflow-hidden rounded-3xl bg-muted">
                          {item.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              alt={item.title}
                              className="h-full w-full object-cover"
                              src={item.thumbnailUrl}
                            />
                          ) : null}
                        </div>

                        <div className="grid flex-1 gap-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h2 className="text-lg font-semibold">{item.title}</h2>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Volume {item.volume}
                                {flowState ? ` / ${flowState}` : ""}
                              </p>
                            </div>
                            <div className="text-left md:text-right">
                              <p className="text-sm text-muted-foreground">Line total</p>
                              <p className="text-lg font-semibold">
                                {formatCurrency(item.price.real)}
                              </p>
                            </div>
                          </div>

                          <div className="grid gap-3 rounded-[20px] bg-card/80 p-4">
                            {item.selections.map((selection) => (
                              <div
                                key={`${selection.unitId}-${selection.stockId}`}
                                className="grid gap-1"
                              >
                                <p className="text-sm font-medium">
                                  {selection.unitName} / {selection.stockName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Quantity per set: {selection.quantity}
                                </p>
                                {selection.choices.length ? (
                                  <div className="flex flex-wrap gap-2">
                                    {selection.choices.map((choice) => (
                                      <span
                                        key={`${choice.label}-${choice.value}`}
                                        className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                                      >
                                        {choice.label}: {choice.value}
                                      </span>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {data.publish ? (
            <Card>
              <CardHeader>
                <CardTitle>Published delivery snapshot</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-3 rounded-[24px] bg-muted/40 p-4 text-sm">
                  <p>Published at: {formatDateTime(data.publish.createdAt)}</p>
                  <p>Paid at: {formatDateTime(data.publish.paidAt)}</p>
                  <p>
                    Delivery state:{" "}
                    {formatFlowState(data.publish.deliveryState) ?? "Not started"}
                  </p>
                </div>

                <div className="grid gap-2 text-sm text-muted-foreground">
                  <p>{data.publish.address.name}</p>
                  <p>{data.publish.address.mobile}</p>
                  <p>
                    {data.publish.address.country}, {data.publish.address.province},{" "}
                    {data.publish.address.city}
                  </p>
                  <p>
                    {data.publish.address.department}, {data.publish.address.possession},{" "}
                    {data.publish.address.zipCode}
                  </p>
                  <p>{data.publish.address.specialNote ?? "No delivery note."}</p>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="grid h-fit gap-6 xl:sticky xl:top-28">
          <Card>
            <CardHeader>
              <CardTitle>Payment summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cash</span>
                <span>{formatCurrency(data.price.cash)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Nominal</span>
                <span>{formatCurrency(data.price.nominal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Real</span>
                <span className="font-semibold">{formatCurrency(data.price.real)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Deposit</span>
                <span>{formatCurrency(data.price.deposit)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Mileage</span>
                <span>{formatCurrency(data.price.mileage)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ticket</span>
                <span>{formatCurrency(data.price.ticket)}</span>
              </div>
            </CardContent>
          </Card>

          {data.requiresCitizen ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Citizen verification
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <p className="text-sm text-muted-foreground">
                  The backend requires real-name verification before an order can be published.
                </p>
                <div className="grid gap-2">
                  <Label htmlFor="citizen-name">Name</Label>
                  <Input
                    id="citizen-name"
                    onChange={(event) =>
                      setCitizenDraft((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    value={citizenName}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="citizen-mobile">Mobile</Label>
                  <Input
                    id="citizen-mobile"
                    onChange={(event) =>
                      setCitizenDraft((current) => ({
                        ...current,
                        mobile: event.target.value,
                      }))
                    }
                    value={citizenMobile}
                  />
                </div>
                <Button
                  disabled={activateCitizen.isPending}
                  onClick={handleCitizenActivation}
                  type="button"
                >
                  {activateCitizen.isPending ? "Verifying..." : "Verify identity"}
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {!data.publish ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Publish with shipping address
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <p className="text-sm text-muted-foreground">
                  Publishing attaches delivery details and creates a payment record for this
                  order draft.
                </p>

                <div className="grid gap-2">
                  <Label htmlFor="address-name">Recipient name</Label>
                  <Input
                    id="address-name"
                    onChange={(event) =>
                      setAddressDraft((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    value={address.name}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address-mobile">Recipient mobile</Label>
                  <Input
                    id="address-mobile"
                    onChange={(event) =>
                      setAddressDraft((current) => ({
                        ...current,
                        mobile: event.target.value,
                      }))
                    }
                    value={address.mobile}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address-country">Country</Label>
                  <Input
                    id="address-country"
                    onChange={(event) =>
                      setAddressDraft((current) => ({
                        ...current,
                        country: event.target.value,
                      }))
                    }
                    value={address.country}
                  />
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="address-province">Province</Label>
                    <Input
                      id="address-province"
                      onChange={(event) =>
                        setAddressDraft((current) => ({
                          ...current,
                          province: event.target.value,
                        }))
                      }
                      value={address.province}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address-city">City</Label>
                    <Input
                      id="address-city"
                      onChange={(event) =>
                        setAddressDraft((current) => ({
                          ...current,
                          city: event.target.value,
                        }))
                      }
                      value={address.city}
                    />
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="address-department">Department</Label>
                    <Input
                      id="address-department"
                      onChange={(event) =>
                        setAddressDraft((current) => ({
                          ...current,
                          department: event.target.value,
                        }))
                      }
                      value={address.department}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address-zip-code">Zip code</Label>
                    <Input
                      id="address-zip-code"
                      onChange={(event) =>
                        setAddressDraft((current) => ({
                          ...current,
                          zipCode: event.target.value,
                        }))
                      }
                      value={address.zipCode}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address-possession">Possession</Label>
                  <Input
                    id="address-possession"
                    onChange={(event) =>
                      setAddressDraft((current) => ({
                        ...current,
                        possession: event.target.value,
                      }))
                    }
                    value={address.possession}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address-special-note">Delivery note</Label>
                  <Textarea
                    id="address-special-note"
                    onChange={(event) =>
                      setAddressDraft((current) => ({
                        ...current,
                        specialNote: event.target.value,
                      }))
                    }
                    placeholder="Leave delivery instructions if needed."
                    value={address.specialNote ?? ""}
                  />
                </div>

                <Button
                  className="h-12 text-base"
                  disabled={publishOrder.isPending || !data.canPublish}
                  onClick={handlePublish}
                  type="button"
                >
                  <WalletCards className="h-4 w-4" />
                  {publishOrder.isPending ? "Publishing..." : "Publish order"}
                </Button>

                {!data.canPublish ? (
                  <p className="text-sm text-muted-foreground">
                    This order cannot be published yet. Verify identity first, or refresh if
                    the backend state just changed.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
