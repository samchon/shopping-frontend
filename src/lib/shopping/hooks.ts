"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";

import type {
  ActivateCitizenPayload,
  AddToCartPayload,
  CartView,
  CatalogView,
  CreateOrderPayload,
  JoinMemberPayload,
  LoginMemberPayload,
  OrderCollectionView,
  OrderDetailView,
  ProductDetailView,
  PublishOrderPayload,
  SessionView,
  UpdateCartPayload,
} from "@/lib/shopping/types";

import { requestJson } from "./client";

const shoppingKeys = {
  session: ["shopping", "session"] as const,
  catalog: (search: string) => ["shopping", "catalog", search] as const,
  product: (id: string) => ["shopping", "product", id] as const,
  cart: ["shopping", "cart"] as const,
  orders: ["shopping", "orders"] as const,
  order: (id: string) => ["shopping", "order", id] as const,
};

export function useSession() {
  return useQuery({
    queryKey: shoppingKeys.session,
    queryFn: () => requestJson<SessionView>("/api/session"),
  });
}

export function useCatalog(search: string) {
  return useQuery({
    queryKey: shoppingKeys.catalog(search),
    queryFn: () => requestJson<CatalogView>(`/api/store${search}`),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: shoppingKeys.product(id),
    queryFn: () => requestJson<ProductDetailView>(`/api/products/${id}`),
    enabled: Boolean(id),
  });
}

export function useCart() {
  return useQuery({
    queryKey: shoppingKeys.cart,
    queryFn: () => requestJson<CartView>("/api/cart"),
  });
}

export function useOrders() {
  return useQuery({
    queryKey: shoppingKeys.orders,
    queryFn: () => requestJson<OrderCollectionView>("/api/orders"),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: shoppingKeys.order(id),
    queryFn: () => requestJson<OrderDetailView>(`/api/orders/${id}`),
    enabled: Boolean(id),
  });
}

function useShoppingMutation<TData, TVariables>(
  options: UseMutationOptions<TData, Error, TVariables>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: shoppingKeys.session }),
        queryClient.invalidateQueries({ queryKey: shoppingKeys.cart }),
        queryClient.invalidateQueries({ queryKey: shoppingKeys.orders }),
      ]);
      await options.onSuccess?.(data, variables, context, mutation);
    },
  });
}

export function useActivateCitizen() {
  return useShoppingMutation<SessionView, ActivateCitizenPayload>({
    mutationFn: (payload) =>
      requestJson("/api/session/activate", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

export function useJoinMember() {
  return useShoppingMutation<SessionView, JoinMemberPayload>({
    mutationFn: (payload) =>
      requestJson("/api/session/join", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

export function useLoginMember() {
  return useShoppingMutation<SessionView, LoginMemberPayload>({
    mutationFn: (payload) =>
      requestJson("/api/session/login", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useShoppingMutation<CartView, AddToCartPayload>({
    mutationFn: (payload) =>
      requestJson("/api/cart", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: shoppingKeys.cart }),
        queryClient.invalidateQueries({ queryKey: shoppingKeys.orders }),
      ]);
    },
  });
}

export function useUpdateCartItem(commodityId: string) {
  return useShoppingMutation<CartView, UpdateCartPayload>({
    mutationFn: (payload) =>
      requestJson(`/api/cart/${commodityId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
  });
}

export function useDeleteCartItem(commodityId: string) {
  return useShoppingMutation<CartView, void>({
    mutationFn: () =>
      requestJson(`/api/cart/${commodityId}`, {
        method: "DELETE",
      }),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useShoppingMutation<{ orderId: string }, CreateOrderPayload>({
    mutationFn: (payload) =>
      requestJson("/api/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: shoppingKeys.cart }),
        queryClient.invalidateQueries({ queryKey: shoppingKeys.orders }),
      ]);
    },
  });
}

export function usePublishOrder(orderId: string) {
  const queryClient = useQueryClient();
  return useShoppingMutation<OrderDetailView, PublishOrderPayload>({
    mutationFn: (payload) =>
      requestJson(`/api/orders/${orderId}/publish`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: shoppingKeys.order(orderId) }),
        queryClient.invalidateQueries({ queryKey: shoppingKeys.orders }),
        queryClient.invalidateQueries({ queryKey: shoppingKeys.cart }),
      ]);
    },
  });
}
