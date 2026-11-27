import StoreAdminClient from '@/components/pages/StoreAdminClient';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
  ];
}

export default function StoreAdminPage({ params }: { params: { id: string } }) {
  const storeId = parseInt(params.id, 10);
  return <StoreAdminClient storeId={storeId} />;
}
