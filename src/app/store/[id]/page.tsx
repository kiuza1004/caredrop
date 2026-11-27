import StoreDetailClient from '@/components/pages/StoreDetailClient';

export async function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }];
}

export default function StoreDetailPage({ params }: { params: { id: string } }) {
  const storeId = parseInt(params.id, 10);
  return <StoreDetailClient storeId={storeId} />;
}
