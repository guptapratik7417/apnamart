import OrderSuccessView from "@/components/OrderSuccessView";

type OrderSuccessPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrderSuccessPage({
  searchParams,
}: OrderSuccessPageProps) {
  const params = await searchParams;
  const orderId = Array.isArray(params.orderId)
    ? params.orderId[0]
    : params.orderId;

  return <OrderSuccessView orderId={orderId || ""} />;
}
