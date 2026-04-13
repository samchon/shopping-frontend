import { OrderDetailPage } from "@/components/orders/order-detail-page";

export default async function OrderRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetailPage orderId={id} />;
}
