import OrderCompleteClient from '@/components/pages/OrderCompleteClient';

export async function generateStaticParams() {
  return [
    { id: '1000' },
    { id: '999' },
  ];
}

export default function OrderCompletePage({ params }: { params: { id: string } }) {
  const orderId = parseInt(params.id, 10);
  return <OrderCompleteClient orderId={orderId} />;
}
