"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";

import type {
  ActivateCitizenPayload,
  AdminDashboardView,
  AdminCreateCouponPayload,
  AdminCreateDepositPayload,
  AdminCreateMileagePayload,
  AdminSessionView,
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
  SellerDashboardView,
  SellerOpenSalePayload,
  SellerReplicaSalePayload,
  SellerSessionView,
  SessionView,
  UpdateCartPayload,
  WalletView,
} from "@/lib/shopping/types";

import { requestJson } from "./client";

const shoppingKeys = {
  session: ["shopping", "session"] as const,
  catalog: (search: string) => ["shopping", "catalog", search] as const,
  product: (id: string) => ["shopping", "product", id] as const,
  cart: ["shopping", "cart"] as const,
  orders: ["shopping", "orders"] as const,
  order: (id: string) => ["shopping", "order", id] as const,
  sellerSession: ["shopping", "seller", "session"] as const,
  sellerDashboard: ["shopping", "seller", "dashboard"] as const,
  wallet: ["shopping", "wallet"] as const,
  adminSession: ["shopping", "admin", "session"] as const,
  adminDashboard: ["shopping", "admin", "dashboard"] as const,
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

export function useSellerSession() {
  return useQuery({
    queryKey: shoppingKeys.sellerSession,
    queryFn: () => requestJson<SellerSessionView>("/api/seller/session"),
  });
}

export function useSellerDashboard() {
  return useQuery({
    queryKey: shoppingKeys.sellerDashboard,
    queryFn: () => requestJson<SellerDashboardView>("/api/seller/dashboard"),
  });
}

export function useWallet() {
  return useQuery({
    queryKey: shoppingKeys.wallet,
    queryFn: () => requestJson<WalletView>("/api/wallet"),
  });
}

export function useAdminSession() {
  return useQuery({
    queryKey: shoppingKeys.adminSession,
    queryFn: () => requestJson<AdminSessionView>("/api/admin/session"),
  });
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: shoppingKeys.adminDashboard,
    queryFn: () => requestJson<AdminDashboardView>("/api/admin/dashboard"),
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
        queryClient.invalidateQueries({ queryKey: shoppingKeys.sellerSession }),
        queryClient.invalidateQueries({ queryKey: shoppingKeys.sellerDashboard }),
        queryClient.invalidateQueries({ queryKey: shoppingKeys.wallet }),
        queryClient.invalidateQueries({ queryKey: shoppingKeys.adminSession }),
        queryClient.invalidateQueries({ queryKey: shoppingKeys.adminDashboard }),
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

export function useLoginSeller() {
  return useShoppingMutation<SellerSessionView, LoginMemberPayload>({
    mutationFn: (payload) =>
      requestJson("/api/seller/session/login", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

export function useJoinSeller() {
  return useShoppingMutation<SellerSessionView, void>({
    mutationFn: () =>
      requestJson("/api/seller/session/join", {
        method: "POST",
      }),
  });
}

export function useReplicateSellerSale() {
  return useShoppingMutation<SellerDashboardView, SellerReplicaSalePayload>({
    mutationFn: (payload) =>
      requestJson("/api/seller/sales/replicate", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

export function usePauseSellerSale(saleId: string) {
  return useShoppingMutation<SellerDashboardView, void>({
    mutationFn: () =>
      requestJson(`/api/seller/sales/${saleId}/pause`, {
        method: "DELETE",
      }),
  });
}

export function useRestoreSellerSale(saleId: string) {
  return useShoppingMutation<SellerDashboardView, void>({
    mutationFn: () =>
      requestJson(`/api/seller/sales/${saleId}/restore`, {
        method: "PUT",
      }),
  });
}

export function useOpenSellerSale(saleId: string) {
  return useShoppingMutation<SellerDashboardView, SellerOpenSalePayload>({
    mutationFn: (payload) =>
      requestJson(`/api/seller/sales/${saleId}/open`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
  });
}

export function useClaimCoupon(couponId: string) {
  return useShoppingMutation<WalletView, void>({
    mutationFn: () =>
      requestJson(`/api/wallet/coupons/${couponId}/claim`, {
        method: "POST",
      }),
  });
}

export function useLoginAdmin() {
  return useShoppingMutation<AdminSessionView, LoginMemberPayload>({
    mutationFn: (payload) =>
      requestJson("/api/admin/session/login", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

export function useJoinAdmin() {
  return useShoppingMutation<AdminSessionView, void>({
    mutationFn: () =>
      requestJson("/api/admin/session/join", {
        method: "POST",
      }),
  });
}

export function useCreateAdminCoupon() {
  return useShoppingMutation<AdminDashboardView, AdminCreateCouponPayload>({
    mutationFn: (payload) =>
      requestJson("/api/admin/coupons", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

export function useCreateAdminDeposit() {
  return useShoppingMutation<AdminDashboardView, AdminCreateDepositPayload>({
    mutationFn: (payload) =>
      requestJson("/api/admin/deposits", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

export function useCreateAdminMileage() {
  return useShoppingMutation<AdminDashboardView, AdminCreateMileagePayload>({
    mutationFn: (payload) =>
      requestJson("/api/admin/mileages", {
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
